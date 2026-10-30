This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Solicitudes de contacto

El formulario `/contacto` guarda nombre, teléfono, motivo, mensaje, autorización y fecha en Supabase. No abre WhatsApp. `/admin` abre la bandeja `/admin/contactos`, con búsqueda, paginación y seguimiento.

Antes de publicar:

1. En el proyecto Supabase `qxrdurbxyrwlpczsncax`, ejecutar `supabase/contactos.sql` en SQL Editor. La migración es aditiva y puede repetirse.
2. Comprobar que las cuentas existentes de Authentication son del equipo: la migración copia las cuentas actuales con correo (no anónimas) a `contact_admins`. Las cuentas creadas después no reciben acceso. Para autorizar otra cuenta del equipo desde SQL Editor: `insert into public.contact_admins (user_id) values ('UUID_DEL_USUARIO') on conflict do nothing;`.
3. Mantener las variables de despliegue `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` del proyecto actual. No se necesita ni debe exponerse una clave de servicio.
4. Enviar una consulta de prueba y comprobarla con una cuenta autorizada en `/admin/contactos`. Marcarla como atendida. Verificar que un visitante sin sesión no puede leer solicitudes.

La base valida longitudes, teléfono, autorización y estado. El público solo puede insertar los campos del formulario; no puede leer datos, cambiar estados ni fijar fechas. Solo las cuentas en `contact_admins` pueden consultar solicitudes y actualizar su estado. No hay eliminación desde la bandeja.
