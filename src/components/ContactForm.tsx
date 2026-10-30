"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { contactReasons, validContactPhone } from "@/lib/contacts";
import { site } from "@/lib/site";

const inputBase = "w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink placeholder:text-ink-muted focus:border-pink focus-visible:outline-2 focus-visible:outline-pink";
const label = "mb-1.5 block text-sm font-bold text-ink";

export function ContactForm() {
  const submitting = useRef(false);
  const requestId = useRef<string | null>(null);
  const requestPayload = useRef("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const nombre = String(form.get("nombre") ?? "").trim();
    const telefono = String(form.get("telefono") ?? "").trim();
    const servicio = String(form.get("servicio") ?? "");
    const mensaje = String(form.get("mensaje") ?? "").trim();
    if (nombre.length < 2 || !validContactPhone(telefono) || !contactReasons.includes(servicio) || !form.has("consentimiento")) {
      setError("Completa tu nombre, un teléfono válido, el motivo y la autorización de contacto.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("No pudimos registrar tu solicitud. Inténtalo más tarde o escríbenos al correo que aparece debajo.");
      return;
    }
    submitting.current = true;
    setSending(true);
    try {
      // Reuse the ID on retries so a lost response cannot create duplicates.
      const payloadKey = JSON.stringify({ nombre, telefono, servicio, mensaje });
      if (!requestId.current || requestPayload.current !== payloadKey) {
        requestId.current = crypto.randomUUID();
        requestPayload.current = payloadKey;
      }
      const { error: saveError } = await createPublicClient().from("contact_requests").insert({
        id: requestId.current, nombre, telefono, servicio, mensaje, consentimiento: true,
      });
      if (saveError && saveError.code !== "23505") throw saveError;
      formElement.reset();
      setSent(true);
    } catch {
      setError("No se pudo guardar tu solicitud. Tus datos siguen aquí; vuelve a intentar el envío.");
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  if (sent) return (
    <div role="status" className="rounded-3xl border border-green/20 bg-white p-7 text-center shadow-soft">
      <CheckCircle2 className="mx-auto h-12 w-12 text-green" />
      <h3 className="mt-4 text-2xl text-ink">¡Recibimos tu solicitud!</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">El equipo de SANTI revisará tu mensaje y se comunicará contigo al teléfono que registraste.</p>
      <button type="button" onClick={() => { requestId.current = null; setSent(false); }} className="mt-5 font-bold text-pink underline underline-offset-4">Enviar otra consulta</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-busy={sending}>
      <fieldset disabled={sending} className="space-y-4 disabled:opacity-70">
        <div>
          <label htmlFor="nombre" className={label}>Nombre y apellido *</label>
          <input id="nombre" name="nombre" autoComplete="name" required minLength={2} maxLength={120} placeholder="Tu nombre y apellido" className={inputBase} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="telefono" className={label}>Teléfono *</label>
            <input id="telefono" name="telefono" autoComplete="tel" type="tel" required maxLength={30} placeholder="+51 999 999 999" className={inputBase} />
          </div>
          <div>
            <label htmlFor="servicio" className={label}>Motivo de contacto *</label>
            <select id="servicio" name="servicio" required className={inputBase} defaultValue="">
              <option value="" disabled>Selecciona…</option>
              {contactReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="mensaje" className={label}>¿En qué podemos ayudarte?</label>
          <textarea id="mensaje" name="mensaje" rows={4} maxLength={2000} placeholder="Cuéntanos brevemente el motivo de tu consulta." className={`${inputBase} resize-y`} />
          <p className="mt-1 text-xs text-ink-muted">Opcional. Evita incluir información médica o sensible.</p>
        </div>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
          <input type="checkbox" name="consentimiento" required className="mt-1 h-4 w-4 shrink-0 accent-pink" />
          <span>Autorizo a SANTI a guardar estos datos y contactarme para atender mi consulta. He leído la <Link href="/privacidad" target="_blank" className="font-bold text-pink underline">política de privacidad</Link>.</span>
        </label>
        <Button type="submit" variant="green" size="lg" className="w-full" disabled={sending}>
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
          {sending ? "Guardando solicitud…" : "Quiero que me contacten"}
        </Button>
      </fieldset>
      {error && <p role="alert" className="rounded-2xl bg-pink-tint px-4 py-3 text-sm font-semibold text-ink">{error}</p>}
      <p className="text-center text-xs text-ink-muted">Tu solicitud llegará directamente a nuestro equipo. También puedes escribirnos a <a href={`mailto:${site.contact.email}`} className="font-semibold text-pink">{site.contact.email}</a>.</p>
    </form>
  );
}
