import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Target, Users, CheckCircle2, ShieldCheck, Mail, Globe, Cpu } from "lucide-react";

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact: () => void;
  lang: string;
}

export function AboutUsModal({ isOpen, onClose, onOpenContact, lang }: AboutUsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] pointer-events-auto"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/25 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-white leading-tight">
                      Acerca de InnovaTech
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Periodismo tecnológico, análisis y futuro digital
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Hero / Mission */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-blue-950/30 dark:to-gray-900 border border-blue-100/60 dark:border-blue-900/30 rounded-2xl p-5 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    Nuestra Misión
                  </span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                    InnovaTech nació con el propósito de acercar los avances más revolucionarios en Inteligencia Artificial, computación, ciberseguridad, gadgets y software a la comunidad hispanohablante y global con análisis riguroso, claridad y una experiencia de usuario de vanguardia.
                  </p>
                </div>

                {/* Editorial Pillars */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span>Nuestros Principios Editoriales</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Verificación y Calidad</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        Contrastamos fuentes oficiales, documentos técnicos y análisis empíricos antes de publicar.
                      </p>
                    </div>
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Innovación Multimedia</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        Integramos podcasts interactivos, resúmenes con audio síntesis y videoanálisis enriquecidos.
                      </p>
                    </div>
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Independencia Editorial</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        Nuestras opiniones y análisis sobre dispositivos y software son 100% autónomos y honestos.
                      </p>
                    </div>
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                        <span>Accesibilidad Global</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        Soporte multilingüe, modo oscuro optimizado y diseño responsivo ultrarrápido.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team & Editorial Board */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>Equipo Editorial y Redacción Especializada</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">CM</div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Carlos Mendoza</span>
                      </div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Director Editorial & Analista de Silicio</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                        Ing. en Computación (12+ años de experiencia en semiconductores GAAFET y computación cuántica).
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">EM</div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Elena Morales</span>
                      </div>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Editora Senior de IA</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                        M.Sc. en Inteligencia Artificial. Auditora de modelos de pesos abiertos y regulación EU AI Act.
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">JO</div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Javier Ortiz</span>
                      </div>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Editor Técnico de Hardware</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                        Especialista en pruebas de banco, benchmarking de GPUs y arquitectura de placas base.
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">SV</div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Sofía Valenzuela</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Editora de Ciberseguridad & Redes</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                        Auditora de seguridad en redes, criptografía post-cuántica y estándares Wi-Fi 7 / 6G.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30 rounded-2xl text-xs space-y-1">
                    <p className="font-bold text-gray-900 dark:text-white">Compromiso Contra el Contenido de Poco Valor:</p>
                    <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                      Nuestros artículos y comparativas son elaborados con fuentes primarias (NIST, IEEE, arXiv, patentes oficiales) e investigados rigurosamente por especialistas humanos, garantizando criterio, análisis técnico y originalidad.
                    </p>
                  </div>
                </div>

                {/* Transparency notice */}
                <div className="p-4 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/30 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">¿Tienes sugerencias o notas de prensa?</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Contáctanos directamente en nuestro canal oficial.</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenContact();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer"
                  >
                    Contactar
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/25 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
