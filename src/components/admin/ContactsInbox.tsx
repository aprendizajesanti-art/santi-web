"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Inbox, Search, RefreshCw, Phone, CheckCircle2, Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { contactStatuses, type ContactRequest, type ContactStatus } from "@/lib/contacts";

const date = (value: string) => new Date(value).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "medium", timeStyle: "short" });
const styles = { pendiente: "bg-orange-tint text-ink", en_contacto: "bg-sky-tint text-ink", atendido: "bg-green-soft text-ink" };
const pageSize = 20;

export function ContactsInbox() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ContactRequest[]>([]);
  const [counts, setCounts] = useState({ pendiente: 0, en_contacto: 0, atendido: 0 });
  const [filter, setFilter] = useState<ContactStatus | "todos">("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      let query = supabase.from("contact_requests").select("*", { count: "exact" });
      if (filter !== "todos") query = query.eq("estado", filter);
      // Remove PostgREST filter operators from user input.
      const term = search.trim().replace(/[^\p{L}\p{N}\s+@.-]/gu, "").slice(0, 100);
      if (term) query = query.or(`nombre.ilike.%${term}%,telefono.ilike.%${term}%,servicio.ilike.%${term}%`);
      const [result, ...stats] = await Promise.all([
        query.order("created_at", { ascending: false }).order("id").range(page * pageSize, (page + 1) * pageSize - 1),
        ...Object.keys(contactStatuses).map(status => supabase.from("contact_requests").select("id", { count: "exact", head: true }).eq("estado", status)),
      ]);
      if (current !== generation.current) return;
      if (result.error || stats.some(stat => stat.error)) throw new Error("load");
      if (page > 0 && (result.count ?? 0) <= page * pageSize) {
        setPage(page - 1);
        return;
      }
      setRows(result.data as ContactRequest[]);
      setTotal(result.count ?? 0);
      setCounts({ pendiente: stats[0].count ?? 0, en_contacto: stats[1].count ?? 0, atendido: stats[2].count ?? 0 });
    } catch {
      if (current === generation.current) { setRows([]); setError("No pudimos cargar las solicitudes. Inténtalo nuevamente."); }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [supabase, filter, search, page]);

  useEffect(() => { const timer = setTimeout(() => { void load(); }, 250); return () => { clearTimeout(timer); generation.current++; }; }, [load]);

  async function updateStatus(id: string, estado: ContactStatus) {
    setSaving(id);
    setError("");
    try {
      const { data, error } = await supabase.from("contact_requests").update({ estado }).eq("id", id).select("id").single();
      if (error || !data) throw new Error("update");
      await load();
    } catch { setError("No se pudo guardar el estado. Vuelve a intentarlo."); }
    finally { setSaving(null); }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-9 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-pink">Cerca de cada familia</p><h1 className="mt-2 text-3xl text-ink sm:text-4xl">Solicitudes de contacto</h1><p className="mt-3 text-sm text-ink-soft">Revisa las consultas y organiza el seguimiento de tu equipo.</p></div>
        <button onClick={() => void load()} disabled={loading || !!saving} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Actualizar</button>
      </div>
      <div className="my-8 grid gap-4 sm:grid-cols-3">
        {([{ key: "pendiente", icon: Inbox, description: "Por atender", color: "bg-orange-tint" }, { key: "en_contacto", icon: Clock3, description: "Seguimiento en curso", color: "bg-sky-tint" }, { key: "atendido", icon: CheckCircle2, description: "Consultas atendidas", color: "bg-green-soft" }] as const).map(({ key, icon: Icon, description, color }) => <button key={key} onClick={() => { setFilter(key); setPage(0); }} aria-pressed={filter === key} className={`flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-soft ${filter === key ? "border-pink" : "border-line"}`}><span className={`rounded-xl p-3 ${color}`}><Icon size={22} /></span><div><p className="text-3xl font-bold text-ink">{loading || error ? "—" : counts[key]}</p><p className="mt-1 text-sm text-ink-soft">{description}</p></div></button>)}
      </div>
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft" aria-label="Bandeja de solicitudes">
        <div className="flex flex-wrap gap-3 border-b border-line p-5">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line px-3"><Search size={18} className="text-ink-muted" /><span className="sr-only">Buscar por nombre, teléfono o motivo</span><input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar por nombre, teléfono o motivo" className="w-full min-w-0 bg-transparent py-3 text-sm outline-none" /></label>
          <select aria-label="Filtrar por estado" value={filter} onChange={e => { setFilter(e.target.value as ContactStatus | "todos"); setPage(0); }} className="rounded-xl border border-line bg-white px-4 py-3 text-sm"><option value="todos">Todos los estados</option>{Object.entries(contactStatuses).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
        </div>
        {error && <div role="alert" className="m-5 rounded-xl bg-pink-tint p-4 text-sm">{error}</div>}
        <div aria-live="polite" aria-busy={loading}>
          {loading ? <p className="p-12 text-center text-ink-soft">Cargando solicitudes…</p> : !error && rows.length === 0 ? <div className="px-6 py-16 text-center"><Inbox className="mx-auto mb-4 text-ink-muted" size={36} /><h2 className="text-xl">{search || filter !== "todos" ? "No hay coincidencias" : "Tu bandeja está lista"}</h2><p className="mt-2 text-sm text-ink-soft">{search || filter !== "todos" ? "Prueba con otro nombre o estado." : "Las nuevas solicitudes del formulario aparecerán aquí."}</p></div> : <ul className="divide-y divide-line">{rows.map(row => <li key={row.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs text-ink-muted">{date(row.created_at)} · Lima</p><h2 className="mt-1 break-words text-xl text-ink">{row.nombre}</h2><p className="mt-1 text-sm font-semibold text-ink-soft">{row.servicio}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${styles[row.estado]}`}>{contactStatuses[row.estado]}</span></div>
            {row.mensaje && <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-sky-tint/50 p-4 text-sm leading-relaxed text-ink-soft">{row.mensaje}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><a href={`tel:${row.telefono.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2 text-sm font-bold text-ink"><Phone size={16} className="text-pink" />{row.telefono}</a><label className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">Seguimiento<select aria-label={`Estado de ${row.nombre}`} disabled={!!saving || loading} value={row.estado} onChange={e => void updateStatus(row.id, e.target.value as ContactStatus)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink disabled:opacity-50">{Object.entries(contactStatuses).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>{saving === row.id && <span role="status">Guardando…</span>}</label></div>
          </li>)}</ul>}
        </div>
        {!error && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-ink-soft"><span>{total} solicitudes{total > 0 && ` · Página ${page + 1} de ${Math.ceil(total / pageSize)}`}</span><div className="flex gap-2"><button disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-line px-3 py-2 disabled:opacity-40">Anterior</button><button disabled={(page + 1) * pageSize >= total || loading} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-line px-3 py-2 disabled:opacity-40">Siguiente</button></div></div>}
      </section>
    </main>
  );
}
