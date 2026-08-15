import { useRef, useState, type SyntheticEvent } from 'react';
import { supabase } from '../lib/supabase';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

const inputClass =
  'w-full rounded-lg ring-1 ring-slate-200 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';
const errorClass = 'mt-1 text-2xs text-red-600';

function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const email = String(data.get('email') || '').trim();

  if (!String(data.get('name') || '').trim()) errors.name = 'Indique su nombre.';
  if (!email) errors.email = 'Indique su correo.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Revise el formato del correo.';
  if (!String(data.get('message') || '').trim()) errors.message = 'Escriba su mensaje.';

  return errors;
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const successRef = useRef<HTMLParagraphElement>(null);

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

    try {
      const { error } = await supabase.from('leads').insert({
        name: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        phone: String(data.get('phone') || '') || null,
        company: String(data.get('company') || '') || null,
        message: String(data.get('message') || ''),
      });
      if (error) throw error;
      setStatus('success');
      form.reset();
      // Move focus to the confirmation — the form it replaces is gone, so without this
      // a keyboard or screen-reader user lands nowhere and never hears the result.
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
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
      <div className="py-6 text-center" role="status" aria-live="polite">
        <p ref={successRef} tabIndex={-1} className="text-ink text-base font-semibold focus-visible:outline-none">
          Gracias por contactarnos.
        </p>
        <p className="mt-2 text-sm text-slate-600">Le responderemos a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
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
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>
            Empresa / Institución
          </label>
          <input id="company" name="company" type="text" autoComplete="organization" className={inputClass} />
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

      <p role="status" aria-live="polite" className="text-xs text-red-600 empty:hidden">
        {status === 'error' && 'No se pudo enviar el mensaje. Intente de nuevo o escríbanos directamente por correo.'}
      </p>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-accent hover:bg-accent-600 focus-visible:ring-accent w-full cursor-pointer rounded-full px-7 py-3 text-sm font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
