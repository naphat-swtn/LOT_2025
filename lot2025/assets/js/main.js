// Enable JS styles
document.documentElement.classList.remove("no-js");

// Sticky header height var (legacy fallback preparation)
const header = document.querySelector(".site-header");
function setHeaderHeightVar() {
  if (!header) return;
  document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
}
window.addEventListener("load", setHeaderHeightVar);
window.addEventListener("resize", () => requestAnimationFrame(setHeaderHeightVar));

// Sticky header shadow
const onScroll = () => {
  if (!header) return;
  if (window.scrollY > 4) header.classList.add("is-scrolled");
  else header.classList.remove("is-scrolled");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile nav toggle
const nav = document.getElementById("site-nav");
const toggle = document.querySelector(".nav-toggle");
function toggleNav() {
  if (!nav || !toggle) return;
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
}
if (toggle && nav) {
  toggle.addEventListener("click", toggleNav);
  nav.addEventListener("click", (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.tagName === "A" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
}

// Reveal on scroll
const revealTargets = document.querySelectorAll("[data-reveal]");
if (revealTargets.length && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.25 }
  );
  revealTargets.forEach((el) => io.observe(el));
}

// ================= Timeline alignment (unchanged) =================
function measureDateColumn() {
  const vtl = document.querySelector(".vtl");
  if (!vtl) return;
  const dates = vtl.querySelectorAll(".vtl-date");
  let maxW = 0;
  dates.forEach((d) => { maxW = Math.max(maxW, d.getBoundingClientRect().width); });
  vtl.style.setProperty("--date-col", `${Math.ceil(maxW + 10)}px`);
}
function updateTimelineLine() {
  const vtl = document.querySelector(".vtl");
  if (!vtl) return;
  const dots = vtl.querySelectorAll(".vtl-dot");
  if (!dots.length) return;

  const vRect = vtl.getBoundingClientRect();
  const localTop = (el) => el.getBoundingClientRect().top - vRect.top + vtl.scrollTop;
  const localLeft = (el) => el.getBoundingClientRect().left - vRect.left + vtl.scrollLeft;

  const first = dots[0];
  const last = dots[dots.length - 1];
  const fRect = first.getBoundingClientRect();

  const lineLeft = localLeft(first) + fRect.width / 2;
  const lineTop = localTop(first) + fRect.height / 2;
  const arrowTop = localTop(last);
  const lineHeight = Math.max(0, arrowTop - lineTop);

  vtl.style.setProperty("--line-left", `${lineLeft}px`);
  vtl.style.setProperty("--line-top", `${lineTop}px`);
  vtl.style.setProperty("--line-height", `${lineHeight}px`);
  vtl.style.setProperty("--arrow-top", `${arrowTop}px`);
}
function refreshTimeline() {
  measureDateColumn();
  requestAnimationFrame(() => requestAnimationFrame(updateTimelineLine));
}
window.addEventListener("load", refreshTimeline);
window.addEventListener("resize", () => requestAnimationFrame(refreshTimeline));
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => requestAnimationFrame(refreshTimeline)).catch(() => {});
}
function hookIconLoads() {
  const vtl = document.querySelector(".vtl");
  if (!vtl) return;
  const imgs = vtl.querySelectorAll(".vtl-dot img");
  imgs.forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", () => requestAnimationFrame(refreshTimeline), { once: true });
    img.addEventListener("error", () => requestAnimationFrame(refreshTimeline), { once: true });
  });
}
hookIconLoads();
const vtlNode = document.querySelector(".vtl");
if (vtlNode) {
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => requestAnimationFrame(refreshTimeline));
    ro.observe(vtlNode);
  }
  const mo = new MutationObserver(() => {
    hookIconLoads();
    requestAnimationFrame(refreshTimeline);
  });
  mo.observe(vtlNode, { childList: true, subtree: true, attributes: true, characterData: true });
}

// ===== Sticky fallback detector (ensures navbar sticks at top in tricky layouts) =====
(function ensureStickyHeader() {
  if (!header) return;

  // Update CSS var for header height (used by padding when fallback is active)
  setHeaderHeightVar();

  // Heuristic: after a tiny scroll, sticky headers should remain at top (top ~ 0).
  // If header scrolls away, enable fixed fallback.
  let tested = false;
  function test() {
    if (tested) return;
    tested = true;
    const top0 = header.getBoundingClientRect().top;
    window.scrollBy(0, 2);
    const top1 = header.getBoundingClientRect().top;
    window.scrollBy(0, -2);

    const looksSticky = Math.abs(top1) <= Math.abs(top0); // sticky stays at 0
    if (!looksSticky) {
      header.classList.add("is-fixed-fallback");
      document.body.classList.add("has-fixed-header");
      setHeaderHeightVar();
    }
  }
  // Run after load + on first scroll (handles very short pages too)
  if (document.readyState === "complete") setTimeout(test, 50);
  else window.addEventListener("load", () => setTimeout(test, 50), { once: true });
  window.addEventListener("scroll", test, { passive: true, once: true });

  // Keep padding correct when resized
  window.addEventListener("resize", () => requestAnimationFrame(setHeaderHeightVar));
})();