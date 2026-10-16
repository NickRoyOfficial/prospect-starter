import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useInquiryForm, type InquiryConfig } from "@/hooks/use-inquiry-form"
import { cn } from "@/lib/utils"
import "./layouts.css"

type Content = { children: ReactNode; className?: string }
/** Navigation is inside the viewport composition. Supply real content; no built-in business copy. */
export function Hero({ variant = "split", navigation, media, inquiry, footer, children, className, ...props }: Omit<ComponentProps<"section">, "children"> & Content & { variant?: "split" | "photo" | "editorial"; navigation: ReactNode; media: ReactNode; inquiry?: ReactNode; footer?: ReactNode }) {
  return <section {...props} className={cn("p-hero", `p-hero-${variant}`, className)}><header className="p-hero-nav p-wrap">{navigation}</header><div className="p-hero-body p-wrap"><div className="p-hero-copy">{children}</div><div className="p-hero-media">{media}</div>{inquiry && <div className="p-hero-inquiry">{inquiry}</div>}</div>{footer && <div className="p-hero-foot p-wrap">{footer}</div>}</section>
}
export function Section({ children, className, ...props }: ComponentProps<"section">) { return <section {...props} className={cn("p-section p-wrap", className)}>{children}</section> }
export function SectionHeading({ eyebrow, title, children, className }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; className?: string }) { return <div className={cn("p-section-heading", className)}><div>{eyebrow && <p className="p-eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{children && <div className="p-section-intro">{children}</div>}</div> }
export function CardGrid({ variant = "cards", children, className }: Content & { variant?: "cards" | "bento" | "rows" }) { return <div className={cn("p-card-grid", `p-grid-${variant}`, className)}>{children}</div> }
export function PhotoCard({ image, title, children, href, icon, className }: { image: ReactNode; title: ReactNode; children?: ReactNode; href: string; icon?: ReactNode; className?: string }) { return <a href={href} className={cn("p-photo-card", className)}><div className="p-photo-card-media">{image}</div>{icon && <span className="p-card-icon">{icon}</span>}<div className="p-card-copy"><h3>{title}</h3>{children}</div><ArrowUpRight className="p-card-arrow" aria-hidden="true" /></a> }
export function SplitSection({ media, children, reverse = false, inset = false, className }: Content & { media: ReactNode; reverse?: boolean; inset?: boolean }) { return <div className={cn("p-split", reverse && "p-split-reverse", inset && "p-split-inset", className)}><div className="p-split-media">{media}</div><div className="p-split-copy">{children}</div></div> }
export function CallToAction({ children, action, className }: Content & { action: ReactNode }) { return <div className={cn("p-cta", className)}><div>{children}</div><div>{action}</div></div> }
export function FooterLayout({ children, bottom, variant = "columns", className }: Content & { bottom?: ReactNode; variant?: "columns" | "compact" }) { return <footer className={cn("p-footer p-wrap", `p-footer-${variant}`, className)}><div className="p-footer-main">{children}</div>{bottom && <div className="p-footer-bottom">{bottom}</div>}</footer> }
export function FAQ({ items, className }: { items: { question: string; answer: ReactNode }[]; className?: string }) { return <Accordion type="single" collapsible className={className}>{items.map((item, index) => <AccordionItem key={index} value={String(index)}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent>{item.answer}</AccordionContent></AccordionItem>)}</Accordion> }
export function FeedbackCarousel({ items, label = "Customer feedback", className }: { items: { name: string; content: ReactNode }[]; label?: string; className?: string }) {
  if (!items.length) return null
  return <Carousel opts={{ loop: items.length > 1 }} aria-label={label} tabIndex={0} className={cn("p-feedback", className)}><CarouselContent>{items.map((item, index) => <CarouselItem key={index} aria-label={`${index + 1} of ${items.length}`}><article className="p-feedback-card">{item.content}<p className="p-feedback-name">{item.name}</p></article></CarouselItem>)}</CarouselContent>{items.length > 1 && <div className="p-carousel-controls"><CarouselPrevious /><CarouselNext /></div>}</Carousel>
}
/** Reuses the tested form hook and restores focus after a manually opened draft dialog. */
export function InquiryDialogForm({ config, children, submitLabel = "Prepare inquiry", className }: Content & { config: InquiryConfig; submitLabel?: string }) {
  const { submit, status, pending } = useInquiryForm(config)
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement | null>(null)
  useEffect(() => { if (status.phase === "draft") setOpen(true) }, [status])
  return <><form onSubmit={submit} aria-busy={pending} className={cn("p-inquiry", className)}>{children}<Button ref={trigger} type="submit" disabled={pending}>{pending ? "Preparing…" : submitLabel}</Button><p role="status" aria-live="polite">{status.message}</p></form><Dialog open={open} onOpenChange={setOpen}><DialogContent className="p-draft-dialog" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus({ preventScroll: true }) }}><DialogTitle>Review your inquiry</DialogTitle><DialogDescription>{status.message}</DialogDescription><Textarea aria-label="Prepared inquiry" value={status.text || ""} readOnly rows={5} />{status.href && <Button asChild><a href={status.href}>Open message draft</a></Button>}</DialogContent></Dialog></>
}
