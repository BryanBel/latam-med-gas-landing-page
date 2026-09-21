// Seed/fallback copy — shown until the client fills in real content via /studio.
// Sourced from client-assets/ (invoice, resale certs, LMG letterhead, ASSE verification report).

import type { Service, Certification, Project } from './sanityQueries';

export const DEFAULT_SITE_SETTINGS = {
  siteName: 'Latam Med Gas USA LLC',
  // Prose rather than a dot-separated list: middle dots are rationed to one per line, and
  // four of them in a row reads as decoration rather than punctuation.
  tagline: 'Diseño, instalación, inspección, mantenimiento, asesoría y verificación de sistemas de gases medicinales',
  // Contact info provided directly by the client (2026-08-11) — confirmed, not placeholder.
  phone: '+58 414-2349582 / +57 318 3588075',
  email: 'LatamMedGasUSA@gmail.com',
  address: '2 S Biscayne Boulevard, Suite 3200 #2088, Miami, Florida 33132, Estados Unidos',
  // Sin punto final: un eslogan cierra solo, y el punto le quita aire.
  slogan: 'Confianza que fluye en cada línea de gas',
  ctaTitle: '¿Listo para normalizar su sistema de gases medicinales?',
  // Vacío a propósito: el titular y el botón ya dicen todo, y el párrafo solo repetía la
  // invitación. Sigue siendo editable desde el Studio si alguna página lo necesita.
  ctaText: '',
  footerNote: 'Sus datos de contacto se utilizan únicamente para responder a su solicitud.',
};

export const DEFAULT_HERO = {
  // One middle dot, not two. "Gases Medicinales" was redundant with the headline below it.
  eyebrow: 'ASSE Serie 6000 · NFPA 99',
  heading: 'Sistemas de gases medicinales seguros, verificados y conformes a la norma',
  subheading:
    'Diseño, instalación, inspección, mantenimiento, asesoría y verificación de sistemas de gases medicinales para hospitales y centros de salud en Latinoamérica.',
  ctaLabel: 'Solicitar cotización',
  ctaLink: '/contacto/',
};

export const DEFAULT_ABOUT = {
  eyebrow: 'Sobre Nosotros',
  heading: 'Especialistas en sistemas de gases medicinales para instituciones de salud',
  body: 'Latam Med Gas USA LLC es una empresa con sede en Miami, Florida, dedicada al diseño, instalación, inspección, mantenimiento, asesoría y verificación de sistemas de gases medicinales. Acompañamos a hospitales y centros de salud en Latinoamérica en cada etapa de sus proyectos, bajo los estándares de la norma ASSE serie 6000 y el código NFPA 99, con un programa de capacitación profesional en convenio con CONECOTEC y NITC, entes acreditados para certificar.',
  highlights: [
    'Cobertura en instituciones de salud públicas y privadas en Latinoamérica',
    'Capacitación bajo la norma ASSE serie 6000, con certificación a través de entes acreditados',
    'Venta de equipos de prueba para instalación ASSE 6010 y verificación ASSE 6030',
  ],
};

export const DEFAULT_SERVICES: Service[] = [
  {
    _id: 'seed-inspeccion',
    title: 'Inspección de Sistemas GM',
    description: 'Revisión técnica de redes y centrales de gases medicinales conforme a la normativa vigente.',
    icon: 'clipboard-check',
  },
  {
    _id: 'seed-mantenimiento',
    title: 'Mantenimiento',
    description: 'Planes de mantenimiento preventivo y correctivo para sistemas de gases medicinales en operación.',
    icon: 'wrench',
  },
  {
    _id: 'seed-diseno',
    title: 'Diseño',
    description: 'Diseño de redes de distribución de gases medicinales para proyectos nuevos y ampliaciones.',
    icon: 'ruler',
  },
  {
    _id: 'seed-instalacion',
    title: 'Instalación',
    description:
      'Instalación de redes y centrales de gases medicinales bajo los perfiles de la norma ASSE 6010 y el código NFPA 99.',
    icon: 'hard-hat',
  },
  {
    _id: 'seed-asesoria',
    title: 'Asesoría',
    description: 'Acompañamiento técnico y normativo en cada etapa del proyecto de gases medicinales.',
    icon: 'headphones',
  },
  {
    _id: 'seed-verificacion',
    title: 'Verificación',
    description:
      'Verificación de sistemas de tubería de gases medicinales bajo la norma ASSE 6030, con informe final y anexos.',
    icon: 'shield-check',
  },
  {
    _id: 'seed-cursos',
    title: 'Cursos de Capacitación ASSE 6000',
    description: 'Formación profesional para todos los perfiles de la norma ASSE serie 6000 y el código NFPA 99.',
    icon: 'graduation-cap',
    link: '/cursos/',
  },
  {
    _id: 'seed-capacitacion',
    title: 'Convenio con entes certificadores',
    description:
      'Convenio con CONECOTEC, acreditado por ema, y con NITC: los entes certificadores ante los que gestionamos el trámite.',
    icon: 'award',
  },
  {
    _id: 'seed-equipos',
    title: 'Venta de Equipos de Prueba',
    description: 'Equipos para instalación bajo ASSE 6010 y verificación bajo ASSE 6030.',
    icon: 'package',
  },
];

export const DEFAULT_CERTIFICATIONS: Certification[] = [
  { _id: 'seed-nfpa99', name: 'NFPA 99', description: 'Código de instalaciones para el cuidado de la salud.' },
  {
    _id: 'seed-asse6000',
    name: 'ASSE 6000',
    description: 'Serie de normas de certificación profesional para personal de gases medicinales.',
  },
  {
    _id: 'seed-iso',
    name: 'ISO',
    description:
      'Publicaciones de la Organización Internacional para la Normalización, usadas como referencia técnica.',
  },
  {
    _id: 'seed-asme',
    name: 'ASME',
    description: 'Publicaciones de la American Society of Mechanical Engineers, usadas como referencia técnica.',
  },
];

// Real trajectory from the client source docs — presence in the market since 2020, listed
// newest-first. Used in full by /trayectoria and sliced to a few highlights on the home page.
export const DEFAULT_PROJECTS: Project[] = [
  {
    _id: 'seed-tuxtla',
    clientName: 'Hospital General de Tuxtla Gutiérrez',
    location: 'Tuxtla Gutiérrez, Chiapas',
    country: 'México',
    date: 'Noviembre 2024',
    serviceType: 'Inspección y diagnóstico',
    description: 'Inspección y diagnóstico del sistema de gases medicinales y vacío médico-quirúrgico.',
  },
  {
    _id: 'seed-tegucigalpa',
    clientName: 'Hospital Escuela Ciudad de Tegucigalpa',
    location: 'Tegucigalpa',
    country: 'Honduras',
    date: 'Junio 2024',
    serviceType: 'Inspección y diagnóstico',
    description: 'Inspección y diagnóstico del sistema de gases medicinales y vacío médico-quirúrgico.',
  },
  {
    _id: 'seed-isla-mujeres',
    clientName: 'Hospital Naval de Isla Mujeres',
    location: 'Isla Mujeres, Quintana Roo',
    country: 'México',
    date: 'Marzo 2024',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-boca-chila',
    clientName: 'Clínica Naval de Boca de Chila',
    location: 'Nayarit',
    country: 'México',
    date: 'Marzo 2024',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-troncoso',
    clientName: 'Centro de Atención de Salud Troncoso',
    location: 'México',
    country: 'México',
    date: 'Febrero 2024',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-isla-mujeres-2023',
    clientName: 'Hospital Naval de Isla Mujeres',
    location: 'Quintana Roo',
    country: 'México',
    date: 'Octubre 2023',
    serviceType: 'Inspección',
    description:
      'Inspección de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-san-cristobal',
    clientName: 'Centro Clínico San Cristóbal',
    location: 'San Cristóbal',
    country: 'Venezuela',
    date: 'Febrero 2023',
    serviceType: 'Inspección',
    description:
      'Inspección de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-la-paz',
    clientName: 'Hospital Naval de La Paz',
    location: 'La Paz, Baja California Sur',
    country: 'México',
    date: 'Diciembre 2022',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-montero',
    clientName: 'Hospital Montero',
    location: 'Santa Cruz de la Sierra',
    country: 'Bolivia',
    date: 'Octubre 2022',
    serviceType: 'Inspección',
    description:
      'Inspección de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-coatzacoalcos',
    clientName: 'Hospital General Naval de Coatzacoalcos',
    location: 'Coatzacoalcos, Veracruz',
    country: 'México',
    date: 'Mayo 2022',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-panama-covid',
    clientName: 'Hospital Covid de la Salud',
    location: 'Ciudad de Panamá',
    country: 'Panamá',
    date: 'Febrero 2021',
    serviceType: 'Verificación',
    description: 'Verificación de sistemas de gases medicinales y vacío médico.',
  },
  {
    _id: 'seed-santa-fe',
    clientName: 'Hospital Fundación Santa Fe de Bogotá',
    location: 'Bogotá',
    country: 'Colombia',
    date: 'Febrero 2020',
    serviceType: 'Inspección',
    description:
      'Inspección de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    _id: 'seed-gas-solutions',
    clientName: 'Gas Solutions Services, S.A.',
    location: 'Panamá',
    country: 'Panamá',
    serviceType: 'Capacitación ASSE 6000',
    description: 'Capacitación profesional para certificación bajo la norma ASSE serie 6000, versión NFPA 99-2024.',
  },
];

export const DEFAULT_MISSION_VISION = {
  mission:
    'Garantizar la seguridad, calidad y eficiencia de los sistemas de distribución de gases medicinales mediante inspecciones, pruebas y mantenimientos regulares, asegurando el cumplimiento de las normativas y estándares establecidos para proteger la salud de los pacientes y del personal médico.',
  vision:
    'Ser una unidad líder en la promoción de la transparencia, la eficiencia y el cumplimiento normativo, actuando con el más alto nivel de integridad en cada proyecto en el que participamos —diseño, instalación, inspección, verificación y mantenimiento— y contribuyendo a la confianza pública y la mejora continua del sector salud.',
};

// Market-presence figures for the animated stat strip. Present in the market since 2020; the
// project count and country spread are grounded in DEFAULT_PROJECTS above.
export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}
export const DEFAULT_STATS: Stat[] = [
  { value: 5, suffix: '+', label: 'Años en el mercado' },
  { value: 12, suffix: '+', label: 'Proyectos de inspección y verificación' },
  { value: 6, label: 'Países en Latinoamérica' },
  { value: 10, label: 'Cursos ASSE serie 6000' },
];

// ASSE Series 6000 course catalogue. Short, faithful one-line role summaries (core + selective —
// the full profile text lives in the client source docs).
export interface Course {
  code: string;
  title: string;
  description: string;
}
export const DEFAULT_COURSES: Course[] = [
  {
    code: '6005',
    title: 'Generalista',
    description: 'Comprensión integral de los sistemas y normativas de gases medicinales; rol de apoyo y supervisión.',
  },
  {
    code: '6010',
    title: 'Instalador',
    description: 'Instalación de sistemas de tubería para gases medicinales conforme a la norma.',
  },
  {
    code: '6015',
    title: 'Instalador a granel',
    description: 'Instalación de sistemas de suministro a granel (criogénicos) de oxígeno y gases medicinales.',
  },
  {
    code: '6020',
    title: 'Inspector',
    description: 'Inspección de sistemas de gases medicinales y prevención de reflujo en instalaciones médicas.',
  },
  {
    code: '6030',
    title: 'Verificador',
    description: 'Inspección y pruebas de sistemas de gas medicinal, con informe final de verificación.',
  },
  {
    code: '6035',
    title: 'Verificador a granel',
    description: 'Verificación de sistemas de suministro a granel (criogénicos).',
  },
  {
    code: '6040',
    title: 'Mantenimiento',
    description: 'Mantenimiento preventivo y correctivo de sistemas de gases médicos.',
  },
  {
    code: '6050',
    title: 'Instructor',
    description: 'Formación e instrucción en sistemas de gases medicinales bajo la norma ASSE serie 6000.',
  },
  {
    code: '6055',
    title: 'Instructor a granel',
    description: 'Instrucción en instalación, inspección y mantenimiento de sistemas a granel.',
  },
  {
    code: '6060',
    title: 'Diseñador',
    description: 'Diseño de sistemas de suministro de gas médico conforme al código NFPA 99.',
  },
];

// "Portafolio de Soluciones" — products and spare parts sourced through our supplier network.
export const DEFAULT_PRODUCTS: string[] = [
  'Reguladores de vacío',
  'Reguladores de presión',
  'Eyectores',
  'Trampas',
  'Blender / mezcladores',
  'Flujómetros de O₂ y aire',
  'Tomas con flujómetro',
  'Tomas para gases medicinales',
  'Monitores de oxígeno',
  'Acoples y conectores',
  'Mangueras para gases medicinales',
  'Repuestos y refacciones',
];

// Root-relative rather than bare fragments: Header and Footer also render on /404 and
// /privacidad, where a plain "#servicios" points at an anchor that isn't on the page.
// From the home page these still resolve as same-document fragment navigation.
// Multi-page nav: each area is its own page. Inicio is an explicit link (not just the logo)
// now that it's a true multi-page site; Contáctenos stays a button in the header pointing at
// the /contacto page.
export const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Nosotros', href: '/nosotros/' },
  { label: 'Servicios', href: '/servicios/' },
  { label: 'Cursos ASSE 6000', href: '/cursos/' },
  { label: 'Trayectoria', href: '/trayectoria/' },
];

// Per-page copy: SEO, the interior-page hero, and the heading that opens each section. These
// were literals inside the templates, so "change the subtitle on Servicios" meant a code change.
// The `page` document type in Sanity mirrors this shape; what is here is the fallback, and
// scripts/seed-pages-to-sanity.mjs is what put the same values into the CMS.
//
// /404 is deliberately absent: it must render when Sanity is unreachable, so it queries nothing.
export interface SectionSeed {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
}
export interface PageSeed {
  seoTitle?: string;
  metaDescription?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  sections?: Record<string, SectionSeed>;
  contentSections?: { heading: string; body: string }[];
}

export const DEFAULT_PAGES: Record<string, PageSeed> = {
  inicio: {
    seoTitle: 'Latam Med Gas USA LLC - Gases Medicinales ASSE 6000 / NFPA 99',
    sections: {
      servicios: {
        eyebrow: 'Servicios',
        heading: 'Todo lo que su institución necesita en gases medicinales',
        subheading:
          'Desde el diseño hasta la verificación final, cubrimos cada etapa bajo la norma ASSE serie 6000 y el código NFPA 99.',
        ctaLabel: 'Ver todos los servicios',
      },
      proyectos: {
        eyebrow: 'Trayectoria',
        heading: 'Presencia comprobada en Latinoamérica',
        subheading:
          'Desde 2020 acompañamos a instituciones de salud en la inspección y verificación de sus sistemas de gases medicinales.',
        ctaLabel: 'Ver toda la trayectoria',
      },
      certificaciones: { heading: 'Respaldados por los estándares internacionales de la industria' },
    },
  },
  nosotros: {
    seoTitle: 'Nosotros',
    metaDescription:
      'Especialistas en diseño, instalación, inspección, mantenimiento y verificación de sistemas de gases medicinales bajo ASSE serie 6000 y NFPA 99.',
    heroEyebrow: 'Nosotros',
    heroSubtitle:
      'Acompañamos a hospitales y centros de salud en Latinoamérica bajo la norma ASSE serie 6000 y el código NFPA 99.',
    sections: {
      misionVision: { heading: 'Misión y Visión' },
      certificaciones: { heading: 'Normativas y estándares' },
    },
  },
  servicios: {
    seoTitle: 'Servicios en sistemas de gases medicinales',
    metaDescription:
      'Verificación, inspección, diseño, asesoría, capacitación ASSE 6000 y comercialización de productos para sistemas de gases medicinales en hospitales y clínicas.',
    heroEyebrow: 'Servicios',
    heroTitle: 'Todo lo que su institución necesita en gases medicinales',
    heroSubtitle:
      'Desde el diseño hasta la verificación final, cubrimos cada etapa bajo la norma ASSE serie 6000 y el código NFPA 99.',
    sections: {
      productos: {
        eyebrow: 'Portafolio de Soluciones',
        heading: 'Productos y repuestos para gases medicinales',
        subheading:
          'Nuestros años en el mercado nos han permitido construir lazos con fabricantes de productos y repuestos. Elaboramos cotizaciones según el proyecto o los requerimientos específicos de cada cliente.',
      },
    },
  },
  cursos: {
    seoTitle: 'Cursos de Capacitación ASSE 6000 (6005–6060)',
    metaDescription:
      'Capacitación profesional bajo la norma ASSE serie 6000 y el código NFPA 99: generalista, instalador, inspector, verificador, instructor y diseñador.',
    heroEyebrow: 'Capacitación',
    heroTitle: 'Cursos de Capacitación ASSE serie 6000',
    heroSubtitle:
      'Formación para todos los perfiles de la norma ASSE serie 6000, orientada a aplicar con propiedad lo establecido en el código NFPA 99.',
    sections: {
      cursosNota: {
        heading:
          'Los cursos se dictan conforme a la norma ASSE serie 6000. Escríbanos para conocer fechas, modalidades y el temario detallado de cada perfil.',
      },
      bandaContacto: {
        heading: 'Capacite a su equipo bajo la norma ASSE 6000',
        subheading:
          'Solicite información sobre nuestros cursos de capacitación profesional y el trámite de certificación ante los entes acreditados.',
      },
    },
  },
  trayectoria: {
    seoTitle: 'Trayectoria y presencia internacional',
    metaDescription:
      'Proyectos de inspección y verificación de sistemas de gases medicinales en México, Honduras, Panamá, Venezuela y Bolivia desde 2020.',
    heroEyebrow: 'Trayectoria',
    heroTitle: 'Presencia en el mercado desde 2020',
    heroSubtitle:
      'Acompañamos a instituciones de salud de toda Latinoamérica en cada etapa de sus sistemas de gases medicinales —diseño, instalación, inspección, verificación y mantenimiento—, con resultados comprobados año tras año.',
    sections: {
      proyectosLista: { heading: 'Proyectos de inspección y verificación' },
      testimonios: { heading: 'Lo que dicen las instituciones con las que trabajamos' },
    },
  },
  contacto: {
    seoTitle: 'Contacto',
    metaDescription:
      'Contacte a Latam Med Gas USA LLC: solicite información técnica o una cotización para la verificación, inspección o diseño de su sistema de gases medicinales.',
    heroEyebrow: 'Contacto',
    heroTitle: 'Conversemos sobre su proyecto',
    heroSubtitle:
      'Cuéntenos sobre su institución y le responderemos con la información técnica y comercial que amerite su proyecto.',
  },
  '404': {
    seoTitle: 'Página no encontrada',
    metaDescription: 'La página que busca no existe o fue movida.',
    heroEyebrow: 'Error 404',
    heroTitle: 'Esta página no existe',
    heroSubtitle:
      'Puede que el enlace esté roto o que la página se haya movido. Vuelva al inicio para seguir navegando.',
  },
  privacidad: {
    seoTitle: 'Política de Privacidad',
    metaDescription: 'Cómo Latam Med Gas USA LLC recoge, usa y protege la información enviada a través de este sitio.',
    heroTitle: 'Política de Privacidad',
    contentSections: [
      {
        heading: 'Qué información recogemos',
        body: 'Únicamente la que usted escribe en el formulario de contacto: nombre, correo electrónico, teléfono (opcional), empresa o institución (opcional) y el mensaje. No recogemos ningún otro dato personal, y el sitio no le pide crear una cuenta.',
      },
      {
        heading: 'Para qué la usamos',
        body: 'Solo para responder a su solicitud y darle seguimiento comercial o técnico. No vendemos, alquilamos ni cedemos su información a terceros, y no la usamos para enviarle publicidad no solicitada.',
      },
      {
        heading: 'Dónde se guarda',
        body: 'Los mensajes del formulario se almacenan en Supabase, nuestro proveedor de base de datos, y se envía una notificación por correo electrónico al equipo mediante Resend para poder responderle. Ambos proveedores actúan por cuenta nuestra y solo procesan los datos de este formulario.',
      },
      {
        heading: 'Cuánto tiempo la conservamos',
        body: 'Conservamos los mensajes mientras sean necesarios para atender su solicitud y darle seguimiento comercial o técnico. Puede pedirnos que eliminemos el suyo en cualquier momento escribiendo a la dirección indicada abajo.',
      },
      {
        heading: 'Cookies y analítica',
        body: 'Este sitio no utiliza cookies de seguimiento ni de publicidad. Para medir el tráfico usamos Cloudflare Web Analytics, que no emplea cookies ni identifica a visitantes individuales: solo agrega páginas vistas, procedencia y rendimiento.',
      },
      {
        heading: 'Sus derechos',
        body: 'Puede solicitarnos acceder a la información que tenemos sobre usted, corregirla o eliminarla. Escríbanos y atenderemos la solicitud en un plazo razonable.',
      },
    ],
  },
};

/**
 * Title and description for a page's <head>, resolving Sanity over the seed and guaranteeing a
 * string for both — `Layout` requires them, and every page was otherwise repeating the same
 * three-level `??` chain.
 */
export function pageSeo(
  slug: keyof typeof DEFAULT_PAGES | string,
  page?: { seoTitle?: string; metaDescription?: string } | null,
): { title: string; description: string } {
  const seed = DEFAULT_PAGES[slug] ?? {};
  return {
    title: page?.seoTitle ?? seed.seoTitle ?? DEFAULT_SITE_SETTINGS.siteName,
    description: page?.metaDescription ?? seed.metaDescription ?? DEFAULT_SITE_SETTINGS.tagline,
  };
}
