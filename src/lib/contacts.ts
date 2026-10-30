import { segments } from "@/lib/content";
export const contactReasons = [...segments.map(s => s.title), "Consulta inicial", "Evaluación", "Prácticas pre profesionales", "Quiero ser aliado / convenio", "Aún no estoy seguro/a"];
export const contactStatuses = { pendiente: "Pendiente", en_contacto: "En contacto", atendido: "Atendido" } as const;
export type ContactStatus = keyof typeof contactStatuses;
export type ContactRequest = { id: string; nombre: string; telefono: string; servicio: string; mensaje: string; estado: ContactStatus; consentimiento: boolean; created_at: string };
export function validContactPhone(phone: string) {
  return /^[+\d\s().-]+$/.test(phone) && /^\d{7,15}$/.test(phone.replace(/\D/g, ""));
}
