/**
 * Purpose: Keyboard and dismissal behavior for native disclosure menus.
 * Scope: One open menu, outside-click dismissal, and Escape with focus restored to its summary.
 * Does NOT belong: The header menu (menu.ts) or choices inside the disclosures.
 */
export function initDisclosures(doc: Document): () => void {
  const menus = Array.from(doc.querySelectorAll<HTMLDetailsElement>('[data-timeline-menu]'));
  const onToggle = (event: Event) => {
    const opened = event.target;
    if (opened instanceof HTMLDetailsElement && opened.open && menus.includes(opened)) {
      for (const menu of menus) if (menu !== opened) menu.open = false;
    }
  };
  const onOutside = (event: Event) => {
    for (const menu of menus) if (!menu.contains(event.target as Node)) menu.open = false;
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    for (const menu of menus) {
      if (menu.open) {
        menu.open = false;
        menu.querySelector('summary')!.focus();
      }
    }
  };
  doc.addEventListener('toggle', onToggle, true);
  doc.addEventListener('click', onOutside);
  doc.addEventListener('keydown', onKey);
  return () => {
    doc.removeEventListener('toggle', onToggle, true);
    doc.removeEventListener('click', onOutside);
    doc.removeEventListener('keydown', onKey);
  };
}
