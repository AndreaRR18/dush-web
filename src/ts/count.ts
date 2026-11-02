// Counts a number up from zero, the way dush's counters climb during a scan. The final value is
// already in the HTML, so it shows as it is without JavaScript, and it is put back exactly at the
// end. An inline number keeps its final width while it counts, so what follows it doesn't jump.

const duration = 1200;

export function countUp(element: HTMLElement, delay = 0): void {
  const target = Number(element.dataset["count"]);
  if (!Number.isFinite(target)) return;
  const decimals = Number(element.dataset["decimals"] ?? 0);
  const format = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const final = element.textContent;

  if (getComputedStyle(element).display === "inline") {
    element.style.display = "inline-block";
    element.style.minWidth = `${widestWidth(element, final ?? "")}px`;
    element.style.textAlign = "right";
  }

  let start: number | undefined;
  const step = (now: number): void => {
    start ??= now + delay;
    const progress = Math.min(1, Math.max(0, (now - start) / duration));
    if (progress < 1) {
      element.textContent = format.format(target * (1 - (1 - progress) ** 3));
      requestAnimationFrame(step);
    } else {
      element.textContent = final;
    }
  };
  element.textContent = format.format(0);
  requestAnimationFrame(step);
}

/** The width of `text` written with its widest digit: fonts without tabular figures vary. */
function widestWidth(element: HTMLElement, text: string): number {
  let widest = 0;
  for (let digit = 0; digit <= 9; digit++) {
    element.textContent = text.replace(/\d/g, String(digit));
    widest = Math.max(widest, element.getBoundingClientRect().width);
  }
  element.textContent = text;
  return Math.ceil(widest);
}
