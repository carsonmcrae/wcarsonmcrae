/**
 * Purpose: Measure the JavaScript a built page actually imports, including shared chunks.
 * Scope: Resolve emitted local ES module edges and distinguish initial from intent-loaded code.
 * Does NOT belong: Source dependency policy or changing runtime loading behavior.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import ts from 'typescript';
import { BASE, DIST, files } from './dist';

interface Edge {
  path: string;
  deferred: boolean;
}
const edges = new Map<string, Edge[]>();

function resolveAsset(from: string, specifier: string): string {
  const path = specifier.startsWith(BASE)
    ? specifier.slice(BASE.length)
    : posix.join(posix.dirname(from), specifier);
  if (!files.includes(path)) throw new Error(`Missing built module: ${from} -> ${specifier}`);
  return path;
}

function imports(file: string): Edge[] {
  const cached = edges.get(file);
  if (cached) return cached;
  const result: Edge[] = [];
  const source = ts.createSourceFile(
    file,
    readFileSync(join(DIST, file), 'utf8'),
    ts.ScriptTarget.Latest,
  );
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      const specifier = node.moduleSpecifier;
      if (!ts.isStringLiteralLike(specifier)) throw new Error(`Unresolved built import in ${file}`);
      result.push({ path: resolveAsset(file, specifier.text), deferred: false });
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const specifier = node.arguments[0];
      if (!specifier || !ts.isStringLiteralLike(specifier))
        throw new Error(`Unresolved deferred built import in ${file}`);
      result.push({ path: resolveAsset(file, specifier.text), deferred: true });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  edges.set(file, result);
  return result;
}

export function scriptGraph(entries: string[], includeDeferred = false): Set<string> {
  const visited = new Set<string>();
  const walk = (file: string) => {
    if (visited.has(file)) return;
    visited.add(file);
    for (const edge of imports(file)) {
      if (includeDeferred || !edge.deferred) walk(edge.path);
    }
  };
  for (const entry of entries) walk(entry);
  return visited;
}
