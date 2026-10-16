import { useEffect } from "react"

/** Flips `.reveal` elements to `.is-visible` as they enter the viewport. Once each; no scroll hijacking. */
export function useReveal(selector = ".reveal", rootMargin = "0px 0px -10% 0px") {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(selector)
    if (!nodes.length) return
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { nodes.forEach(n => n.classList.add("is-visible")); return }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target) }
    }, { rootMargin })
    nodes.forEach(n => observer.observe(n))
    return () => observer.disconnect()
  }, [selector, rootMargin])
}
