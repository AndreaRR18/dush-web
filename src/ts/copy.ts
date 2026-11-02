// "Copy Command" buttons: a button with data-copy="<id>" copies the text of the element with that
// id. Its label turns into "Copied" for a moment, then comes back. When the browser refuses the
// clipboard, the text is selected instead, so ⌘C still works.

const copiedFor = 1600;

export function setUpCopyButtons(root: ParentNode): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>("button[data-copy]")) {
    button.addEventListener("click", () => copy(button));
  }
}

async function copy(button: HTMLButtonElement): Promise<void> {
  const source = document.getElementById(button.dataset.copy ?? "");
  const text = source?.textContent?.trim();
  if (!source || !text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.getSelection()?.selectAllChildren(source);
    return;
  }
  const label = button.textContent;
  button.textContent = button.dataset.copied ?? "Copied";
  window.setTimeout(() => {
    button.textContent = label;
  }, copiedFor);
}
