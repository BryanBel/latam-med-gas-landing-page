[English](README.md) | **Español**

# Latam Med Gas — Landing Page

Sitio web de **Latam Med Gas USA LLC**, empresa con sede en Miami dedicada a la inspección, diseño, mantenimiento y capacitación de certificación ASSE 6000 / NFPA 99 para sistemas de gases medicinales en hospitales y clínicas de Latinoamérica.

Actualmente en **etapa de wireframe**: la arquitectura completa y el flujo de contenido ya están funcionando, pero la identidad de marca real (logo, colores, fotografía) todavía no — cada elemento visual es un marcador de posición que se reemplaza en cuanto lleguen los assets de marca.

## Stack Tecnológico

| Capa           | Tecnología                                                | Por qué                                                                                                                                      |
| -------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework      | [Astro](https://astro.build) (salida estática)            | No envía JavaScript por defecto; solo hidrata las partes que realmente necesitan interactividad                                              |
| Interactividad | Islas de [React](https://react.dev)                       | Usado en un solo lugar ([`ContactForm.tsx`](src/components/ContactForm.tsx)) — todo lo demás es `.astro` puro                                |
| Estilos        | [Tailwind CSS v4](https://tailwindcss.com)                | Tokens de diseño (`--color-ink`, `--color-accent*`) centralizados en [`src/styles/global.css`](src/styles/global.css), fáciles de reemplazar |
| CMS            | [Sanity](https://sanity.io), Studio embebido en `/studio` | El cliente edita el contenido directamente en el sitio publicado — sin necesidad de alojar un CMS aparte                                     |
| Backend        | [Supabase](https://supabase.com)                          | Solo para los leads del formulario de contacto, política RLS de solo inserción — sin acceso de lectura desde el cliente                      |
| Hosting        | [Cloudflare Pages](https://pages.cloudflare.com)          | Plan gratuito, despliegue automático con git push, CDN global                                                                                |
| DNS            | the registrar                                         | Solo como registrador del dominio — el hosting vive en Cloudflare                                                                            |
| Lenguaje       | TypeScript (estricto)                                     | `astro check` corre sin errores en todo el proyecto                                                                                          |

## Características

- **Impulsado por CMS con respaldo seguro** — cada sección (hero, servicios, certificaciones, proyectos) obtiene su contenido de Sanity al momento del build y usa contenido semilla de [`src/lib/content.ts`](src/lib/content.ts) si el CMS está vacío o inaccesible, para que el sitio nunca se vea en blanco.
- **Sin marca, sin problema** — el componente reutilizable [`ImagePlaceholder`](src/components/ImagePlaceholder.astro) reemplaza cada imagen con un wireframe; una paleta neutra de grises/acento reemplaza los colores de marca. Ambos se cambian en un solo lugar cuando existan los assets reales.
- **Captura de leads protegida contra spam** — el formulario de contacto usa un campo honeypot y seguridad a nivel de fila (RLS) en Supabase que solo permite `insert`, nunca `select`/`update`/`delete`, desde la llave pública anónima.
- **Navegación móvil accesible primero** — menú móvil solo con CSS (sin JavaScript adicional), con estado `aria-expanded` y cierre con la tecla Escape.
- **Contenido en español, vocabulario técnico heredado** — la redacción está en español para el público de LATAM; los términos de la industria (ASSE, NFPA, DISS, CGA) se mantienen sin traducir, tal como se usan en el sector.

## Estructura del Proyecto

```text
.
├── astro.config.mjs          # Configuración de Astro + React + Tailwind + integración Sanity
├── sanity.config.ts           # Configuración del Studio de Sanity embebido (esquemas, plugins)
├── src/
│   ├── components/            # Secciones Astro (Header, Hero, Services, ...) + ContactForm.tsx (la única isla React)
│   ├── layouts/Layout.astro   # <head>, fuentes, meta SEO/OG
│   ├── lib/
│   │   ├── content.ts          # Contenido semilla/respaldo, tomado de client-assets/
│   │   ├── sanityQueries.ts    # Consultas GROQ tipadas usadas en build time
│   │   └── supabase.ts         # Cliente de Supabase (llave anónima)
│   ├── sanity/schemaTypes/    # Modelo de contenido del CMS (siteSettings, heroSection, service, certification, project, testimonial)
│   └── pages/index.astro      # Ensambla todas las secciones
└── supabase/migrations/       # Migración SQL para la tabla `leads` + política RLS
```

## Primeros Pasos

```sh
pnpm install
cp .env.example .env   # completar credenciales de Sanity y Supabase, ver abajo
pnpm dev                # http://localhost:4321
```

### Variables de entorno

| Variable                   | Dónde obtenerla                                                                   |
| -------------------------- | --------------------------------------------------------------------------------- |
| `PUBLIC_SANITY_PROJECT_ID` | [sanity.io/manage](https://sanity.io/manage) → tu proyecto                        |
| `PUBLIC_SANITY_DATASET`    | Normalmente `production`                                                          |
| `PUBLIC_SUPABASE_URL`      | [supabase.com/dashboard](https://supabase.com/dashboard) → Project Settings → API |
| `PUBLIC_SUPABASE_ANON_KEY` | Misma página — la llave pública/anónima, nunca la service role key                |

## Scripts

| Comando            | Acción                                                           |
| ------------------ | ---------------------------------------------------------------- |
| `pnpm dev`         | Inicia el servidor de desarrollo local                           |
| `pnpm build`       | Genera el sitio estático en `./dist/`                            |
| `pnpm preview`     | Previsualiza el build de producción localmente                   |
| `pnpm astro check` | Verifica los tipos de todo el proyecto                           |
| `pnpm lint`        | ESLint (flat config: reglas de JS + TypeScript + Astro)          |
| `pnpm format`      | Prettier, con ordenamiento de clases Tailwind y soporte `.astro` |

## Edición de Contenido

Los editores de contenido inician sesión en `/studio` del sitio publicado — sin código, sin git, sin instalación local. El modelo de contenido vive en [`src/sanity/schemaTypes/`](src/sanity/schemaTypes/):

- **Configuración del Sitio** — nombre, eslogan, teléfono, correo, dirección, redes sociales
- **Sección Hero** — título principal, subtítulo, CTA
- **Servicio** — la grilla de servicios (título, descripción, orden)
- **Certificación** — tarjetas de credenciales ASSE/NFPA
- **Proyecto** — casos de éxito de clientes
- **Testimonio** — citas (aún no integradas en ninguna sección de la página)

## Formulario de Contacto → Leads

Los envíos se insertan directamente en una tabla `leads` de Supabase ([migración](supabase/migrations/0001_create_leads.sql)) desde el navegador usando la llave pública anónima. La seguridad a nivel de fila restringe el rol anónimo a solo `insert` — los leads solo pueden leerse desde el panel de Supabase, nunca desde el sitio público. Un campo honeypot oculto filtra bots básicos antes de enviar cualquier solicitud.

## Despliegue

1. **Cloudflare Pages** — conectar este repositorio, comando de build `pnpm build`, directorio de salida `dist`. Cada push a `master` despliega automáticamente.
2. **Dominio** — apuntar el DNS del dominio registrado en the registrar hacia Cloudflare (nameservers o CNAME), en lugar de alojar el sitio directamente en the registrar.
3. Configurar las mismas variables de entorno del `.env` en la configuración del proyecto de Cloudflare Pages.
