// The sticky header draws its hairline once the page has scrolled past the top, so it sits on the
// paper with no line at first.

export function setUpHeader(root: ParentNode): void {
  const header = root.querySelector(".header");
  const sentinel = root.querySelector(".scroll-sentinel");
  if (!header || !sentinel) return;
  new IntersectionObserver(([entry]) => {
    header.classList.toggle("is-scrolled", entry ? !entry.isIntersecting : false);
  }).observe(sentinel);
}
