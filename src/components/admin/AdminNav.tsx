"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, FileText, Images, ArrowUpRight } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";

export function AdminNav() {
  const pathname = usePathname();
  const links = [
    { href: "/admin/contactos", label: "Solicitudes de contacto", icon: Inbox },
    { href: "/admin/blog", label: "Blog", icon: FileText },
    { href: "/admin/contenido", label: "Contenido del sitio", icon: Images },
  ];
  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto max-w-6xl px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="text-xl font-extrabold text-ink">SANTI <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-ink-muted">Administración</span></Link>
          <div className="flex items-center gap-3"><Link href="/" target="_blank" className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">Ver sitio <ArrowUpRight size={15} /></Link><LogoutButton /></div>
        </div>
        <nav aria-label="Administración" className="mt-5 flex flex-wrap gap-2">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${pathname.startsWith(href) ? "bg-pink-tint text-pink" : "text-ink-soft hover:bg-sky-tint"}`}><Icon size={17} />{label}</Link>)}
        </nav>
      </div>
    </div>
  );
}
