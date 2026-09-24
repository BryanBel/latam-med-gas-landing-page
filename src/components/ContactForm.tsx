import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { submitLead, LEAD_LIMITS, TURNSTILE_SITE_KEY } from '../lib/leads';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'message', string>>;

// La API que inyecta el script de Cloudflare. Solo lo que se usa aquí.
interface Turnstile {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      execution?: 'render' | 'execute';
      appearance?: 'always' | 'execute' | 'interaction-only';
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      language?: string;
    },
  ) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const inputClass =
  'w-full rounded-lg ring-1 ring-slate-200 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';
const errorClass = 'mt-1 text-2xs text-red-600';

// Nombre y apellido. Letras de cualquier alfabeto, tildes, apóstrofos, guiones y puntos, que es
// lo que llevan los nombres reales: «María de la Cruz», «J. Pérez», «O'Brien», «Jean-Luc».
// Números y símbolos fuera.
const NOMBRE_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;

// Correo. A propósito **no** se limita a gmail: quien escribe por aquí lo hace desde el dominio
// de su hospital o su clínica, y filtrar por proveedor rechazaría justo los contactos que más
// interesan. Lo que sí exige es la forma completa —parte local, dominio con etiquetas válidas y
// un TLD de dos letras o más—, que es donde caen los errores de tecleo de verdad: falta la
// arroba, falta el punto, se queda en «.c», o el dominio empieza o acaba en guion.
const CORREO_RE =
  /^[\p{L}\p{N}._%+-]+@[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?)*\.\p{L}{2,}$/u;

// Erratas que se escriben solas al teclear rápido. Un correo mal puesto no da error a nadie: el
// mensaje se guarda, el cliente responde y la respuesta rebota contra un buzón que no existe,
// así que el lead se pierde sin que ninguna de las dos partes se entere.
const DOMINIOS_ERRATA: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
};

// Teléfono, solo si lo rellenan. Se pide en formato internacional porque quien escribe puede
// estar en cualquiera de los seis países donde hay trabajo hecho, y un «0414-2349582» sin
// prefijo no se puede marcar desde fuera de Venezuela. E.164 admite 15 dígitos como máximo.
const TELEFONO_RE = /^\+\d{8,15}$/;

/** Quita lo que la gente usa para separar: espacios, guiones, paréntesis y puntos. */
function normalizarTelefono(v: string): string {
  return v.replace(/[\s().-]/g, '');
}

function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const phone = String(data.get('phone') || '').trim();

  if (!name) errors.name = 'Indique su nombre y apellido.';
  else if (!NOMBRE_RE.test(name)) errors.name = 'Use solo letras, sin números ni símbolos.';
  else if (name.split(/\s+/).filter(Boolean).length < 2) errors.name = 'Falta el apellido.';

  if (!email) errors.email = 'Indique su correo.';
  else if (!CORREO_RE.test(email)) errors.email = 'Revise el formato del correo.';
  else {
    const sugerido = DOMINIOS_ERRATA[email.slice(email.lastIndexOf('@') + 1).toLowerCase()];
    if (sugerido) errors.email = `¿Quiso decir @${sugerido}?`;
  }

  // Vacío es válido: el teléfono no es obligatorio.
  if (phone && !TELEFONO_RE.test(normalizarTelefono(phone))) {
    errors.phone = 'Incluya el código de país, por ejemplo +57 318 3588075.';
  }

  if (!String(data.get('message') || '').trim()) errors.message = 'Escriba su mensaje.';

  return errors;
}

/** Carga el script una sola vez aunque el componente se monte varias veces. */
function cargarTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existente = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existente) {
    return new Promise((resolve, reject) => {
      existente.addEventListener('load', () => resolve(), { once: true });
      existente.addEventListener('error', () => reject(new Error('turnstile')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener('load', () => resolve(), { once: true });
    s.addEventListener('error', () => reject(new Error('turnstile')), { once: true });
    document.head.appendChild(s);
  });
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const successRef = useRef<HTMLParagraphElement>(null);

  // El widget va en modo `execute`: no pide nada al cargar, se dispara al enviar. Con
  // `interaction-only` no dibuja nada salvo que Cloudflare decida que hace falta un reto, así
  // que el formulario se ve igual que antes para casi todo el mundo.
  const cajaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Turnstile devuelve el token por callback, no por promesa. Esto es el puente: `execute()`
  // dispara, y el callback resuelve lo que `handleSubmit` está esperando.
  const pendiente = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);

  useEffect(() => {
    let cancelado = false;

    cargarTurnstile()
      .then(() => {
        if (cancelado || !cajaRef.current || !window.turnstile || widgetId.current) return;
        widgetId.current = window.turnstile.render(cajaRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          execution: 'execute',
          appearance: 'interaction-only',
          language: 'es',
          callback: (token) => {
            pendiente.current?.resolve(token);
            pendiente.current = null;
          },
          'error-callback': () => {
            pendiente.current?.reject(new Error('No se pudo completar la verificación anti-spam.'));
            pendiente.current = null;
          },
          'expired-callback': () => {
            pendiente.current?.reject(new Error('La verificación caducó. Intente de nuevo.'));
            pendiente.current = null;
          },
        });
      })
      .catch(() => {
        // Sin script no hay token, y sin token la función rechaza el envío. Se avisa aquí en
        // lugar de dejar que el visitante escriba el mensaje entero y lo pierda al enviar.
        if (!cancelado) {
          setStatus('error');
          setErrorMsg('No se pudo cargar la verificación anti-spam. Recargue la página o escríbanos por correo.');
        }
      });

    return () => {
      cancelado = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  function obtenerToken(): Promise<string> {
    const id = widgetId.current;
    if (!id || !window.turnstile) {
      return Promise.reject(new Error('La verificación anti-spam aún no está lista. Intente de nuevo en un momento.'));
    }
    return new Promise<string>((resolve, reject) => {
      // Con tiempo límite. Turnstile responde por callback, y si por lo que sea no llama a
      // ninguno —ni al de éxito ni al de error— la promesa no se resuelve nunca y el botón se
      // queda en «Enviando…» para siempre. Mejor un error que el visitante pueda leer.
      const timer = setTimeout(() => {
        if (pendiente.current !== handlers) return;
        pendiente.current = null;
        reject(new Error('La verificación anti-spam tardó demasiado. Intente de nuevo o escríbanos por correo.'));
      }, 20_000);

      const handlers = {
        resolve: (token: string) => {
          clearTimeout(timer);
          resolve(token);
        },
        reject: (err: Error) => {
          clearTimeout(timer);
          reject(err);
        },
      };
      pendiente.current = handlers;

      // Cada token sirve una sola vez, así que se parte de cero en cada envío — si no, un
      // segundo intento reenviaría el token ya gastado y la función lo rechazaría.
      window.turnstile!.reset(id);
      window.turnstile!.execute(id);
    });
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: real users never fill this hidden field, bots usually do.
    if (data.get('website')) {
      setStatus('success');
      return;
    }

    const fieldErrors = validate(data);
    setErrors(fieldErrors);
    const firstInvalid = Object.keys(fieldErrors)[0];
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const token = await obtenerToken();
      await submitLead(
        {
          name: String(data.get('name') || ''),
          email: String(data.get('email') || ''),
          phone: String(data.get('phone') || '') || null,
          company: String(data.get('company') || '') || null,
          message: String(data.get('message') || ''),
        },
        token,
      );
      setStatus('success');
      form.reset();
      // Move focus to the confirmation — the form it replaces is gone, so without this
      // a keyboard or screen-reader user lands nowhere and never hears the result.
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (err) {
      console.error('[contacto] no se pudo registrar el lead:', err);
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo enviar el mensaje. Intente de nuevo o escríbanos directamente por correo.',
      );
      setStatus('error');
    }
  }

  function describedBy(field: keyof FieldErrors) {
    return errors[field] ? `${field}-error` : undefined;
  }

  if (status === 'success') {
    // No card chrome here: this replaces the form inside the panel, which already provides the
    // white surface and centres it vertically (see ContactSection). A nested card would double
    // the border and strand the message at the top of the stretched panel.
    return (
      <div
        className="flex h-full min-h-[20rem] flex-col items-center justify-center py-6 text-center"
        role="status"
        aria-live="polite"
      >
        {/* GAS_ACCENTS[0], el verde de oxígeno. Va a mano y no importado de lib/icons porque ese
            módulo arrastra lucide-react, y esto es una isla de cliente: importarlo le sumaría el
            paquete entero de iconos a un chunk que hoy pesa 7 KB. Por lo mismo el check es un SVG
            suelto en vez de un componente. */}
        <span
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: '#15803d1a' }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#15803d"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <p ref={successRef} tabIndex={-1} className="text-ink text-lg font-bold focus-visible:outline-none">
          Gracias por contactarnos.
        </p>
        <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-slate-600">
          Hemos recibido su mensaje y le responderemos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre y apellido *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={LEAD_LIMITS.name}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('name')}
            className={inputClass}
          />
          {errors.name && (
            <p id="name-error" className={errorClass}>
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Correo *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            maxLength={LEAD_LIMITS.email}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy('email')}
            className={inputClass}
          />
          {errors.email && (
            <p id="email-error" className={errorClass}>
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            spellCheck={false}
            placeholder="+57 318 3588075"
            maxLength={LEAD_LIMITS.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
            className={inputClass}
          />
          {errors.phone ? (
            <p id="phone-error" className={errorClass}>
              {errors.phone}
            </p>
          ) : (
            <p id="phone-hint" className="text-2xs mt-1 text-slate-500">
              Opcional. Con código de país.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>
            Empresa / Institución
          </label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={LEAD_LIMITS.company}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Mensaje *
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={LEAD_LIMITS.message}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy('message')}
          className={inputClass}
        />
        {errors.message && (
          <p id="message-error" className={errorClass}>
            {errors.message}
          </p>
        )}
      </div>

      {/* Donde Turnstile dibuja el reto si hace falta. Vacío el resto del tiempo. */}
      <div ref={cajaRef} className="empty:hidden" />

      <p role="alert" className="text-xs text-red-600 empty:hidden">
        {status === 'error' && errorMsg}
      </p>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-accent hover:bg-accent-600 focus-visible:ring-accent w-full cursor-pointer rounded-full px-7 py-3 text-sm font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? 'Enviando…' : 'Enviar mensaje'}
      </button>

      {/* El aviso va aquí, en el punto donde se recogen los datos, no solo en el pie. Es lo que
          piden la LFPDPPP mexicana y la Ley 1581 colombiana, que son la ley de la mayoría de
          quienes escriben por este formulario. */}
      <p className="text-2xs mt-3 leading-relaxed text-slate-500">
        Sus datos se utilizan únicamente para responder a su solicitud.{' '}
        <a
          href="/privacidad/"
          className="text-accent hover:text-accent-600 focus-visible:ring-accent rounded-sm font-medium underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
        >
          Política de Privacidad
        </a>
        . Protegido por Cloudflare Turnstile.
      </p>
    </form>
  );
}
