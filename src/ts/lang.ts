// The header's language menu is a <details>, so it opens and closes on its own. This only closes
// it again on a click outside or on Escape, so it doesn't stay open over the page.

export function setUpLanguageMenu(root: ParentNode): void {
  for (const menu of root.querySelectorAll<HTMLDetailsElement>(".lang")) {
    document.addEventListener("click", (event) => {
      if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") menu.open = false;
    });
  }
}
