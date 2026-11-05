/**
 * Purpose: Enforce the repository’s browser, Worker, and CLI dependency boundaries.
 * Scope: First-party runtime import graphs, including deferred imports and re-exports; erased types are ignored.
 * Does NOT belong: Bundling, third-party package analysis, or proving arbitrary JavaScript is environment-safe.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { builtinModules } from 'node:module';
import { posix } from 'node:path';
import ts from 'typescript';
import type { FileText, GateReport } from './file-lines.ts';

interface Module {
  path: string;
  imports: string[];
  browser: boolean;
  build: boolean;
  opaque: boolean;
}
const BUILTINS = new Set(builtinModules);
const DOM_NAMES = new Set(['Document', 'Window', 'Storage', 'Element', 'HTMLElement']);
const BROWSER_GLOBALS = new Set(['window', 'document', 'localStorage', 'sessionStorage']);
type Runtime = 'browser' | 'Worker';

function isTypeOnly(clause: ts.ImportClause): boolean {
  if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) return true;
  const bindings = clause.namedBindings;
  return (
    !clause.name &&
    !!bindings &&
    ts.isNamedImports(bindings) &&
    bindings.elements.every((item) => item.isTypeOnly)
  );
}
function importSpecifier(node: ts.Node): string | undefined {
  if (ts.isImportDeclaration(node)) {
    if (node.importClause && isTypeOnly(node.importClause)) return undefined;
    return (node.moduleSpecifier as ts.StringLiteral).text;
  }
  if (ts.isExportDeclaration(node) && node.moduleSpecifier && hasRuntimeExport(node))
    return (node.moduleSpecifier as ts.StringLiteral).text;
  if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    const argument = node.arguments[0];
    if (argument && ts.isStringLiteral(argument)) return argument.text;
  }
  return undefined;
}
function hasRuntimeExport(node: ts.ExportDeclaration): boolean {
  if (node.isTypeOnly) return false;
  return (
    !node.exportClause ||
    !ts.isNamedExports(node.exportClause) ||
    node.exportClause.elements.some((item) => !item.isTypeOnly)
  );
}
function opaqueImport(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false;
  if (ts.isIdentifier(node.expression) && node.expression.text === 'require') return true;
  return (
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    (!node.arguments[0] || !ts.isStringLiteral(node.arguments[0]))
  );
}
function browserReference(node: ts.Node): boolean {
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'globalThis' &&
    BROWSER_GLOBALS.has(node.name.text)
  )
    return true;
  if (ts.isTypeReferenceNode(node)) {
    const name = node.typeName.getText();
    return DOM_NAMES.has(name) || /^HTML\w*Element$/.test(name);
  }
  return ts.isIdentifier(node) && BROWSER_GLOBALS.has(node.text) && !isPropertyName(node);
}
function isPropertyName(node: ts.Identifier): boolean {
  const parent = node.parent;
  const property =
    ts.isPropertyAccessExpression(parent) ||
    ts.isPropertyAssignment(parent) ||
    ts.isPropertySignature(parent) ||
    ts.isPropertyDeclaration(parent) ||
    ts.isMethodDeclaration(parent);
  return property && parent.name === node;
}
function buildReference(node: ts.Node): boolean {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === 'glob' &&
    ts.isMetaProperty(node.expression) &&
    node.expression.keywordToken === ts.SyntaxKind.ImportKeyword
  );
}
function inspect(file: FileText, browser = false): Module {
  const source = ts.createSourceFile(file.path, file.text, ts.ScriptTarget.Latest, true);
  const module: Module = {
    path: file.path,
    imports: [],
    browser,
    build: false,
    opaque: false,
  };
  const visit = (node: ts.Node) => {
    const specifier = importSpecifier(node);
    if (specifier) module.imports.push(specifier);
    module.browser ||= browserReference(node);
    module.build ||= buildReference(node);
    module.opaque ||= opaqueImport(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return module;
}
function astroScripts(file: FileText): Module[] {
  const text = file.text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
  // Search the original text: lowercasing all source can change Unicode lengths and slice offsets.
  const openingTag = /<script(?=[\t\n\f\r />])/gi;
  const closingTag = /<\/script[\t\n\f\r ]*>/gi;
  const modules: Module[] = [];
  let offset = 0;
  while (offset < text.length) {
    openingTag.lastIndex = offset;
    const start = openingTag.exec(text);
    if (!start) break;
    const end = text.indexOf('>', start.index);
    if (end < 0) break;
    const opening = text.slice(start.index, end + 1);
    offset = end + 1;
    if (opening.endsWith('/>')) continue;
    closingTag.lastIndex = offset;
    const close = closingTag.exec(text);
    if (!close) break;
    modules.push(
      inspect(
        {
          path: `${file.path}#script-${modules.length + 1}`,
          text: text.slice(offset, close.index),
        },
        true,
      ),
    );
    offset = closingTag.lastIndex;
  }
  return modules;
}
function resolveImport(
  from: string,
  specifier: string,
  modules: Map<string, Module>,
): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const path = posix.normalize(posix.join(posix.dirname(from), specifier));
  return [path, `${path}.ts`, `${path}.js`, `${path}.mts`, `${path}.mjs`, `${path}/index.ts`].find(
    (candidate) => modules.has(candidate),
  );
}
function externalViolation(specifier: string): string | undefined {
  if (specifier.startsWith('node:') || BUILTINS.has(specifier))
    return 'Node built-ins belong in build/CLI code';
  if (specifier.startsWith('astro:'))
    return 'Astro build APIs cannot enter a browser or Worker runtime';
  return undefined;
}
function moduleViolation(runtime: Runtime, module: Module): string | undefined {
  if (module.path.startsWith('scripts/')) return 'repository tooling cannot enter a site runtime';
  if (module.build) return 'import.meta.glob is a site-build capability';
  if (module.opaque)
    return 'runtime loading must use literal ES module imports so its dependency graph stays reviewable';
  if (
    runtime === 'browser' &&
    (module.path === 'src/lib/reaction-service.ts' || module.path.startsWith('workers/'))
  )
    return 'the reaction database service belongs only in the Worker graph';
  if (runtime === 'Worker' && (module.browser || module.path.startsWith('src/scripts/')))
    return 'DOM/browser controllers cannot enter the Worker graph';
  return undefined;
}
function checkGraph(runtime: Runtime, root: string, modules: Map<string, Module>): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const visit = (path: string, trail: string[]) => {
    if (seen.has(path)) return;
    seen.add(path);
    const module = modules.get(path)!;
    const chain = [...trail, path];
    const reason = moduleViolation(runtime, module);
    if (reason) errors.push(`${runtime}: ${chain.join(' -> ')}: ${reason}.`);
    for (const specifier of module.imports) {
      const external = externalViolation(specifier);
      if (external) errors.push(`${runtime}: ${chain.join(' -> ')} -> ${specifier}: ${external}.`);
      const target = resolveImport(path, specifier, modules);
      if (target) visit(target, chain);
    }
  };
  visit(root, []);
  return errors;
}
function directionViolation(module: Module, target: string): string | undefined {
  if (
    module.path.startsWith('src/') &&
    (target.startsWith('scripts/') || target.startsWith('workers/'))
  )
    return 'site source cannot depend on CLI or deployment adapters';
  if (module.path.startsWith('src/lib/') && target.startsWith('src/scripts/'))
    return 'behavior libraries cannot depend on browser entry points';
  if (
    module.path.startsWith('scripts/lib/') &&
    target.startsWith('scripts/') &&
    !target.startsWith('scripts/lib/')
  )
    return 'CLI policy libraries cannot depend on executable entry points';
  return undefined;
}

export function checkDependencyBoundaries(files: FileText[]): GateReport {
  const source = files.filter(
    ({ path }) =>
      /^(?:src\/|scripts\/|workers\/).+\.(?:[cm]?[jt]s|astro)$/.test(path) &&
      !/\.d\.[cm]?ts$/.test(path),
  );
  const modules = new Map(
    source
      .flatMap((file) => (file.path.endsWith('.astro') ? astroScripts(file) : [inspect(file)]))
      .map((module) => [module.path, module]),
  );
  const report: GateReport = { checked: modules.size, errors: [], warnings: [] };
  for (const module of modules.values()) {
    for (const specifier of module.imports) {
      const target = resolveImport(module.path, specifier, modules);
      if (!target) continue;
      const reason = directionViolation(module, target);
      if (reason) report.errors.push(`${module.path} -> ${target}: ${reason}.`);
    }
    if (module.path.startsWith('src/scripts/') || module.browser)
      report.errors.push(...checkGraph('browser', module.path, modules));
    if (/^workers\/[^/]+\/src\/index\.ts$/.test(module.path))
      report.errors.push(...checkGraph('Worker', module.path, modules));
  }
  return report;
}
