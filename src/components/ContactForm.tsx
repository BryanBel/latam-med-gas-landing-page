import { useState, type SyntheticEvent } from 'react';
import { supabase } from '../lib/supabase';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: real users never fill this hidden field, bots usually do.
    if (data.get('website')) {
      setStatus('success');
      return;
    }

    setStatus('submitting');

    const { error } = await supabase.from('leads').insert({
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || '') || null,
      company: String(data.get('company') || '') || null,
      message: String(data.get('message') || ''),
    });

    if (error) {
      setStatus('error');
      return;
    }

    setStatus('success');
    form.reset();
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-8 text-center">
        <p className="text-[15px] font-semibold text-ink">Gracias por contactarnos.</p>
        <p className="mt-2 text-[14px] text-slate-600">Le responderemos a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-[13.5px] font-semibold text-slate-600 mb-1.5">
            Nombre *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg ring-1 ring-slate-200 px-4 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-[13.5px] font-semibold text-slate-600 mb-1.5">
            Correo *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg ring-1 ring-slate-200 px-4 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-[13.5px] font-semibold text-slate-600 mb-1.5">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full rounded-lg ring-1 ring-slate-200 px-4 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-[13.5px] font-semibold text-slate-600 mb-1.5">
            Empresa / Institución
          </label>
          <input
            id="company"
            name="company"
            type="text"
            className="w-full rounded-lg ring-1 ring-slate-200 px-4 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-[13.5px] font-semibold text-slate-600 mb-1.5">
          Mensaje *
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="w-full rounded-lg ring-1 ring-slate-200 px-4 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {status === 'error' && (
        <p className="text-[13.5px] text-red-600">
          No se pudo enviar el mensaje. Intente de nuevo o escríbanos directamente por correo.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full sm:w-auto px-6 py-3 rounded-lg bg-accent text-white text-[14.5px] font-semibold hover:bg-accent-600 transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
