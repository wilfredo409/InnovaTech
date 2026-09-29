import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mail, Clock, Send, CheckCircle2, AlertCircle, Building, ShieldCheck } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ContactPageProps {
  onBack: () => void;
  lang: string;
  t: (text: string) => string;
}

export function ContactPage({ onBack, lang, t }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor introduce una dirección de correo electrónico válida.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // Real database write to firestore contact_submissions collection
      await addDoc(collection(db, 'contact_submissions'), {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        language: lang
      });

      setSuccess(true);
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error("Error writing message to Firestore: ", err);
      setError('Hubo un problema al enviar su mensaje. Por favor intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onBack}
            className="self-start flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl shadow-sm hover:scale-[1.01] hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>
          
          <div className="space-y-2 mt-2 text-center md:text-left">
            <span className="inline-block px-3 py-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100/40 dark:bg-blue-900/40 rounded-full uppercase tracking-widest">
              Portal de Soporte
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Contacto y Soporte
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
              ¿Tienes preguntas, sugerencias o requieres soporte técnico para InnovaTech? Estamos aquí para ayudarte de forma directa y personalizada.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Support Information Bento Cards */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Developer Contact Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-850 shadow-sm flex items-start gap-4 hover:shadow-md transition-all">
              <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-md shadow-blue-500/10">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="font-extrabold text-sm uppercase text-gray-400 tracking-wider">Correo Directo</h3>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">smiwceron@gmail.com</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  Soporte uno a uno, respuestas en menos de 24 horas hábiles.
                </p>
                <a 
                  href="mailto:smiwceron@gmail.com"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2 cursor-pointer"
                >
                  Enviar correo directo →
                </a>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-850 shadow-sm flex items-start gap-4 hover:shadow-md transition-all">
              <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-md shadow-indigo-500/10">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm uppercase text-gray-400 tracking-wider">Horario de Atención</h3>
                <p className="text-base font-bold text-gray-900 dark:text-white">Lunes a Viernes</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">9:00 AM - 6:00 PM (GMT-5)</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed mt-1">
                  Atención prioritaria y personalizada para todos nuestros usuarios.
                </p>
              </div>
            </div>

            {/* Privacy & Trust Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-850 shadow-sm flex items-start gap-4 hover:shadow-md transition-all">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md shadow-emerald-500/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm uppercase text-gray-400 tracking-wider">Privacidad Asegurada</h3>
                <p className="text-base font-bold text-gray-900 dark:text-white">Datos Encriptados</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  Toda la información enviada mediante este formulario es manejada de manera 100% confidencial y protegida bajo nuestras normas de privacidad.
                </p>
              </div>
            </div>

          </div>

          {/* Contact Form Card */}
          <div className="md:col-span-7 bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-850 shadow-sm">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center text-center py-10 space-y-4"
                >
                  <div className="p-4 bg-emerald-500/15 text-emerald-500 rounded-full animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                      ¡Mensaje Enviado con Éxito!
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-sm">
                      Gracias por ponerte en contacto. Tu consulta se ha registrado de manera segura y nos comunicaremos contigo lo antes posible.
                    </p>
                  </div>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Enviar otro mensaje
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                    Formulario de Contacto
                  </h2>

                  {error && (
                    <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100/50 dark:border-red-900/30 font-medium leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="form-name" className="text-xs font-bold uppercase text-gray-400 tracking-wider">Nombre Completo *</label>
                      <input
                        id="form-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="form-email" className="text-xs font-bold uppercase text-gray-400 tracking-wider">Correo Electrónico *</label>
                      <input
                        id="form-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ej. juan@correo.com"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-subject" className="text-xs font-bold uppercase text-gray-400 tracking-wider">Asunto *</label>
                    <input
                      id="form-subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej. Sugerencia sobre traducción o error de audio"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-message" className="text-xs font-bold uppercase text-gray-400 tracking-wider">Mensaje *</label>
                    <textarea
                      id="form-message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe tu mensaje detalladamente aquí..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-extrabold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:pointer-events-none"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando mensaje...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Mensaje</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
