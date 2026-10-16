import { lazy, Suspense } from "react"
const UIShowcase = import.meta.env.DEV ? lazy(() => import("./dev/ui-showcase")) : null
const SectionShowcase = import.meta.env.DEV ? lazy(() => import("./dev/section-showcase")) : null
export default function App() {
  if (SectionShowcase && new URLSearchParams(location.search).has("layouts")) return <Suspense fallback={<p>Loading layouts…</p>}><SectionShowcase /></Suspense>
  if (UIShowcase && new URLSearchParams(location.search).has("ui")) return <Suspense fallback={<p>Loading controls…</p>}><UIShowcase /></Suspense>
  return <><a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3" href="#main">Skip to content</a><main id="main" tabIndex={-1} /></>
}
