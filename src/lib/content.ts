// Seed/fallback copy — shown until the client fills in real content via /studio.
// Sourced from client-assets/ (invoice, resale certs, LMG letterhead, ASSE verification report).

export const DEFAULT_SITE_SETTINGS = {
  siteName: 'Latam Med Gas USA LLC',
  tagline: 'Inspección · Mantenimiento · Diseño · Asesoría · Verificación de Sistemas de Gases Medicinales',
  phone: '+1 (305) 900-2281',
  email: 'gerencia@latammedgas.com',
  address: '2 S Biscayne Boulevard Suite 3200 #2088, Miami, Florida 33132, Estados Unidos',
};

export const DEFAULT_HERO = {
  eyebrow: 'ASSE Serie 6000 · NFPA 99 · Gases Medicinales',
  heading: 'Sistemas de gases medicinales seguros, certificados y verificados',
  subheading:
    'Inspección, mantenimiento, diseño, asesoría y verificación de sistemas de gases medicinales para hospitales y centros de salud en Latinoamérica.',
  ctaLabel: 'Solicitar cotización',
  ctaLink: '#contacto',
};

export const DEFAULT_SERVICES = [
  {
    _id: 'seed-inspeccion',
    title: 'Inspección de Sistemas GM',
    description: 'Revisión técnica de redes y centrales de gases medicinales conforme a la normativa vigente.',
  },
  {
    _id: 'seed-mantenimiento',
    title: 'Mantenimiento',
    description: 'Planes de mantenimiento preventivo y correctivo para sistemas de gases medicinales en operación.',
  },
  {
    _id: 'seed-diseno',
    title: 'Diseño',
    description: 'Diseño de redes de distribución de gases medicinales para proyectos nuevos y ampliaciones.',
  },
  {
    _id: 'seed-asesoria',
    title: 'Asesoría',
    description: 'Acompañamiento técnico y normativo en cada etapa del proyecto de gases medicinales.',
  },
  {
    _id: 'seed-verificacion',
    title: 'Verificación ASSE 6030',
    description:
      'Verificación de sistemas de tubería de gases medicinales bajo la norma ASSE 6030, con informe final y anexos.',
  },
  {
    _id: 'seed-cursos',
    title: 'Cursos de Capacitación ASSE 6000',
    description:
      'Formación profesional bajo la norma ASSE serie 6000, código NFPA 99, dictada por instructores certificados ASSE 6050.',
  },
  {
    _id: 'seed-certificacion',
    title: 'Certificación Profesional',
    description: 'Programa de certificación profesional en convenio con CONECOTEC y NITC.',
  },
  {
    _id: 'seed-equipos',
    title: 'Venta de Equipos de Prueba',
    description: 'Equipos para instalación bajo ASSE 6010 y verificación bajo ASSE 6030.',
  },
];

export const DEFAULT_CERTIFICATIONS = [
  { _id: 'seed-nfpa99', name: 'NFPA 99', description: 'Código de instalaciones para el cuidado de la salud.' },
  {
    _id: 'seed-asse6000',
    name: 'ASSE 6000',
    description: 'Serie de normas de certificación profesional para personal de gases medicinales.',
  },
  {
    _id: 'seed-asse6010',
    name: 'ASSE 6010',
    description: 'Instalador de sistemas de tubería para gases medicinales no inflamables.',
  },
  {
    _id: 'seed-asse6030',
    name: 'ASSE 6030',
    description: 'Verificador de sistemas de tubería para gases medicinales no inflamables.',
  },
];

export const DEFAULT_PROJECTS = [
  {
    _id: 'seed-imss-tuxtla',
    clientName: 'Hospital General IMSS Tuxtla-Chiapas',
    location: 'Tuxtla Gutiérrez, Chiapas, México',
    description: 'Verificación de sistema de gases medicinales bajo la norma ASSE 6030, con informe final y anexos.',
  },
  {
    _id: 'seed-gas-solutions',
    clientName: 'Gas Solutions Services, S.A.',
    location: 'Panamá, República de Panamá',
    description: 'Capacitación profesional para certificación bajo la norma ASSE 6000, versión NFPA 99-2024.',
  },
];

export const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Certificaciones', href: '#certificaciones' },
  { label: 'Proyectos', href: '#proyectos' },
  { label: 'Contacto', href: '#contacto' },
];
