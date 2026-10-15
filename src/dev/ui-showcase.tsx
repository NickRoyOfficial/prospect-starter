import { useEffect, useState } from "react"
import { ArrowUpRight, Menu, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { Separator } from "@/components/ui/separator"
import { InquiryForm } from "@/components/inquiry-form"

/** Development-only control preview. Vite excludes this module from production. */
export default function UIShowcase() {
  const [dark, setDark] = useState(false)
  const [service, setService] = useState("")
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); return () => document.documentElement.classList.remove("dark") }, [dark])
  return <div className={dark ? "dark" : ""}><main className="min-h-svh bg-background text-foreground"><div className="mx-auto max-w-5xl space-y-10 px-5 py-10 sm:px-10">
    <header className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-sm text-muted-foreground">Development only</p><h1 className="text-3xl font-semibold tracking-tight">Shared UI controls</h1></div><Button variant="outline" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />} Theme</Button></header>
    <NavigationMenu><NavigationMenuList><NavigationMenuItem><NavigationMenuLink href="#form">Form</NavigationMenuLink></NavigationMenuItem><NavigationMenuItem><NavigationMenuLink href="#faq">FAQ</NavigationMenuLink></NavigationMenuItem></NavigationMenuList></NavigationMenu>
    <section className="flex flex-wrap gap-3" aria-label="Buttons and overlays"><Button>Primary action <ArrowUpRight /></Button><Button variant="outline">Secondary action</Button><Dialog><DialogTrigger asChild><Button variant="secondary">Open dialog</Button></DialogTrigger><DialogContent><DialogTitle>Dialog preview</DialogTitle><DialogDescription>Keyboard focus stays inside while this dialog is open. Escape closes it.</DialogDescription><Input aria-label="Dialog field" placeholder="Focus test" /></DialogContent></Dialog><Sheet><SheetTrigger asChild><Button variant="outline"><Menu />Open menu</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>Navigation preview</SheetTitle><SheetDescription>A reusable drawer for a project-specific menu.</SheetDescription></SheetHeader></SheetContent></Sheet></section>
    <div className="grid items-start gap-8 md:grid-cols-2"><Card id="form"><CardHeader><CardTitle>Inquiry behavior</CardTitle><CardDescription>This preview prepares local text. It has no external delivery destination.</CardDescription></CardHeader><CardContent><InquiryForm config={{ mode: "copy" }}><div className="grid gap-2"><Label htmlFor="preview-name">Name</Label><Input id="preview-name" name="Name" autoComplete="name" required /></div><div className="grid gap-2"><Label htmlFor="preview-email">Email</Label><Input id="preview-email" name="Email" type="email" autoComplete="email" required /></div><div className="grid gap-2"><Label htmlFor="preview-service">Service</Label><Select value={service} onValueChange={setService}><SelectTrigger id="preview-service" className="w-full"><SelectValue placeholder="Choose a service" /></SelectTrigger><SelectContent><SelectItem value="option-a">Option A</SelectItem><SelectItem value="option-b">Option B</SelectItem></SelectContent></Select><input type="hidden" name="Service" value={service} /></div><div className="grid gap-2"><Label htmlFor="preview-notes">Notes</Label><Textarea id="preview-notes" name="Notes" rows={3} /></div></InquiryForm></CardContent></Card>
    <section id="faq" className="space-y-5"><h2 className="text-2xl font-semibold tracking-tight">Accordion behavior</h2><Accordion type="single" collapsible><AccordionItem value="first"><AccordionTrigger>How does reuse work?</AccordionTrigger><AccordionContent>Import only the controls needed for the selected section and customize their appearance.</AccordionContent></AccordionItem><AccordionItem value="second"><AccordionTrigger>Does the starter define the design?</AccordionTrigger><AccordionContent>Each prospect gets its own typography, imagery, layout, colors, and motion.</AccordionContent></AccordionItem></Accordion><Separator /><p className="text-sm text-muted-foreground">Neutral preview controls. No customer quotes, ratings, business claims, or preset page design.</p></section></div>
    <section className="space-y-5" aria-labelledby="carousel-title"><h2 id="carousel-title" className="text-2xl font-semibold tracking-tight">Carousel behavior</h2><div className="mx-12"><Carousel aria-label="Control preview carousel"><CarouselContent>{[1,2,3,4].map(i => <CarouselItem key={i} className="sm:basis-1/2"><Card><CardContent className="grid aspect-[4/3] place-items-center p-6 text-3xl font-semibold">{i}</CardContent></Card></CarouselItem>)}</CarouselContent><CarouselPrevious /><CarouselNext /></Carousel></div></section>
  </div></main></div>
}
