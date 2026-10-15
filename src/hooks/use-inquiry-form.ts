import { useRef, useState, type FormEvent } from "react"
import { buildDraftURL, endpointURL, messageFromEntries } from "@/lib/form-utils"

export type InquiryConfig =
  | { mode: "endpoint"; action: string; successMessage?: string }
  | { mode: "mailto" | "sms"; recipient: string; subject?: string }
  | { mode: "copy" }
export type InquiryStatus = {
  phase: "idle" | "pending" | "accepted" | "draft" | "copied" | "error"
  message: string
  text?: string
  href?: string
}

/** No default destination and no automatic sending from draft modes. */
export function useInquiryForm(config: InquiryConfig) {
  const [status, setStatus] = useState<InquiryStatus>({ phase: "idle", message: "" })
  const pending = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (pending.current || !form.reportValidity()) return
    pending.current = true
    setStatus({ phase: "pending", message: "Preparing your inquiry…" })
    try {
      const data = new FormData(form)
      if (config.mode === "endpoint") {
        const response = await fetch(endpointURL(config.action, location.href), {
          method: "POST", body: data, headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000),
        })
        if (!response.ok) throw new Error("The request was not accepted. Please try again or use another contact method.")
        setStatus({ phase: "accepted", message: config.successMessage || "Your request was accepted." })
      } else {
        const text = messageFromEntries(data)
        if (config.mode === "copy") {
          try {
            await navigator.clipboard.writeText(text)
            setStatus({ phase: "copied", message: "Copied. Paste your inquiry into your preferred contact app." })
          } catch {
            setStatus({ phase: "draft", message: "Copy the inquiry below. Nothing has been sent.", text })
          }
        } else {
          const href = buildDraftURL(config.mode, config.recipient, text, {
            subject: config.subject, ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
          })
          setStatus({ phase: "draft", message: "Review your draft. Nothing has been sent.", text, href })
        }
      }
    } catch (error) {
      const message = error instanceof Error ? ["TimeoutError", "AbortError"].includes(error.name)
        ? "The request timed out. Please try again or use another contact method."
        : error instanceof TypeError ? "The request could not be completed. Check your connection or use another contact method." : error.message
        : "The inquiry could not be prepared."
      setStatus({ phase: "error", message })
    } finally { pending.current = false }
  }
  return { submit, status, pending: status.phase === "pending" }
}
