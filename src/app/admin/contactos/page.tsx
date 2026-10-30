import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ContactsInbox } from "@/components/admin/ContactsInbox";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Solicitudes de contacto · Administración", robots: { index: false, follow: false } };

export default async function ContactsPage() {
  if (!isSupabaseConfigured) return <><AdminNav /><div className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-2xl">Panel aún no configurado</h1><p className="mt-3 text-ink-soft">Conecta Supabase para recibir las solicitudes de contacto.</p></div></>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin, error } = await supabase.from("contact_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || !admin) return <><AdminNav /><main className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-2xl">Bandeja no disponible</h1><p role="alert" className="mt-3 text-ink-soft">{error ? "No pudimos cargar la bandeja. Inténtalo nuevamente más tarde." : "Tu cuenta no tiene acceso a las solicitudes de contacto. Consulta con el administrador del sitio."}</p></main></>;
  return <div className="min-h-screen bg-sky-tint/40"><AdminNav /><ContactsInbox /></div>;
}
