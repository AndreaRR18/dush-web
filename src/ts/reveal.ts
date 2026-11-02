// Motion on scroll: what starts below the fold waits out of sight, then slides in once, as it
// scrolls into view. Elements that arrive together come in one after the other, and numbers
// marked data-count count up as they arrive. With Reduce Motion nothing moves, and without
// JavaScript everything is simply there.

import { countUp } from "./count.ts";

/** Milliseconds between elements that arrive together. */
const stagger = 90;

export function setUpReveal(root: ParentNode): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let isFirstLook = true;
  const observer = new IntersectionObserver((entries) => {
    const arriving: HTMLElement[] = [];
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      // The first look only hides what is entirely below the fold: nothing on screen blinks.
      if (isFirstLook && entry.boundingClientRect.top >= window.innerHeight) {
        element.classList.add("is-waiting");
      } else if (isFirstLook || entry.isIntersecting) {
        arriving.push(element);
      }
    }
    isFirstLook = false;
    arriving.forEach((element, index) => {
      observer.unobserve(element);
      reveal(element, index * stagger);
    });
  }, { rootMargin: "0px 0px -10% 0px" });

  for (const element of root.querySelectorAll<HTMLElement>("[data-reveal]")) observer.observe(element);
}

function reveal(element: HTMLElement, delay: number): void {
  if (element.classList.contains("is-waiting")) {
    element.style.transitionDelay = `${delay}ms`;
    element.addEventListener("transitionend", () => element.style.removeProperty("transition-delay"), { once: true });
    element.classList.remove("is-waiting");
  }
  for (const number of element.querySelectorAll<HTMLElement>("[data-count]")) countUp(number, delay);
}
