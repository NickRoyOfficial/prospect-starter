import { useId, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useInquiryForm, type InquiryConfig } from "@/hooks/use-inquiry-form"

/** Supply labeled fields as children and an explicit delivery config. */
export function InquiryForm({ config, children, className, submitLabel = "Prepare inquiry" }: {
  config: InquiryConfig; children: ReactNode; className?: string; submitLabel?: string
}) {
  const { submit, status, pending } = useInquiryForm(config)
  const statusId = useId()
  return <form onSubmit={submit} aria-busy={pending} aria-describedby={statusId} className={cn("grid gap-4", className)}>
    {children}
    <Button type="submit" disabled={pending}>{pending ? "Preparing…" : submitLabel}</Button>
    <div id={statusId} role="status" aria-live="polite" className="grid gap-3 text-sm">
      {status.message && <p>{status.message}</p>}
      {status.text && <Textarea aria-label="Prepared inquiry" value={status.text} readOnly rows={5} />}
      {status.href && <Button asChild variant="outline"><a href={status.href}>Open message draft</a></Button>}
    </div>
  </form>
}
