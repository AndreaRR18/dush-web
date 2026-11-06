// The header's theme toggle: light or dark chosen by the visitor instead of the OS. The choice is
// stored in localStorage and set as data-theme on <html> by the inline script in each page's <head>,
// before the first paint, so the page never flashes the wrong theme; tokens.css maps data-theme to
// color-scheme and every light-dark() token follows it. Here we also aim the illustrations' <picture>
// sources and the theme-color metas at the chosen theme (their media attribute can't see data-theme),
// and keep the button's icon, label and pressed state in step. Without JavaScript the button stays
// hidden and the page simply follows the OS.

const storageKey = "dush-theme";
const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

type Theme = "light" | "dark";

/** Elements whose media follows the OS, with the media to restore when no theme is forced. */
const followers: { element: Element; media: string }[] = [];

function forcedTheme(): Theme | null {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : null;
}

function currentTheme(): Theme {
  return forcedTheme() ?? (darkScheme.matches ? "dark" : "light");
}

export function setUpThemeToggle(root: ParentNode): void {
  const button = root.querySelector<HTMLButtonElement>("button[data-theme-toggle]");
  if (!button) return;
  const icon = button.querySelector("use");

  for (const element of document.querySelectorAll('source[media*="prefers-color-scheme"], meta[name="theme-color"]')) {
    followers.push({ element, media: element.getAttribute("media") ?? "" });
  }

  const apply = (): void => {
    const forced = forcedTheme();
    const theme = currentTheme();
    for (const { element, media } of followers) {
      const next = forced === null ? media : media.includes(forced) ? "all" : "not all";
      if (element.getAttribute("media") !== next) element.setAttribute("media", next);
    }
    if (icon) icon.setAttribute("href", theme === "dark" ? "#icon-sun" : "#icon-moon");
    const label = theme === "dark" ? button.dataset.toLight : button.dataset.toDark;
    if (label) {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    }
    button.setAttribute("aria-pressed", String(theme === "dark"));
  };

  button.addEventListener("click", () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Storage refused (private browsing): the choice lasts for this page only.
    }
    apply();
  });

  darkScheme.addEventListener("change", apply);
  apply();
}
