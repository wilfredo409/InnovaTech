import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, FileText, Scale, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

interface TermsConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export function TermsConditionsModal({ isOpen, onClose, lang }: TermsConditionsModalProps) {
  const content = {
    title: "Términos y Condiciones de Uso",
    lastUpdated: "Última actualización: Agosto 2026",
    sections: [
      {
        title: "1. Aceptación de los Términos",
        icon: Scale,
        content: [
          "Al acceder y utilizar el portal web y las aplicaciones móviles de InnovaTech, aceptas someterte a estos Términos y Condiciones de Uso, a todas las leyes aplicables y a nuestras políticas de privacidad y cookies.",
          "Si no estás de acuerdo con cualquiera de estos términos, te solicitamos abstenerte de utilizar nuestros servicios."
        ]
      },
      {
        title: "2. Propiedad Intelectual y Uso del Contenido",
        icon: FileText,
        content: [
          "Todo el contenido editorial original, análisis, reseñas de tecnología, artículos informativos, textos, logotipos y elementos de diseño publicados en InnovaTech son propiedad de InnovaTech y están protegidos por las leyes de propiedad intelectual.",
          "Se permite el acceso personal y no comercial para lectura. Queda prohibida la reproducción, duplicación, scraping automatizado o reventa de nuestros contenidos sin autorización previa por escrito."
        ]
      },
      {
        title: "3. Conducta del Usuario y Comentarios",
        icon: ShieldCheck,
        content: [
          "InnovaTech ofrece áreas interactivas para que la comunidad comparta opiniones en los artículos.",
          "Los usuarios se comprometen a no publicar comentarios difamatorios, ofensivos, que inciten al odio, spam, enlaces maliciosos o publicidad no autorizada.",
          "Nos reservamos el derecho de moderar, editar o eliminar cualquier comentario que viole estas directrices o las políticas de la comunidad."
        ]
      },
      {
        title: "4. Publicidad y Servicios de Terceros",
        icon: HelpCircle,
        content: [
          "InnovaTech exhibe anuncios provistos por redes publicitarias autorizadas como Google AdSense y Google AdMob.",
          "Las transacciones, compras o visitas a sitios web anunciados son responsabilidad exclusiva entre el usuario y dicho tercero.",
          "No garantizamos ni asumimos responsabilidad por productos o servicios ofrecidos por anunciantes externos."
        ]
      },
      {
        title: "5. Exención de Responsabilidad",
        icon: AlertTriangle,
        content: [
          "La información tecnológica y guías provistas en InnovaTech se proporcionan con fines exclusivamente informativos y educativos. Aunque nos esforzamos por mantener la información actualizada y precisa, no garantizamos la absoluta exactitud o idoneidad para propósitos específicos.",
          "InnovaTech no se hace responsable por pérdidas o daños derivados del uso de la información contenida en el portal."
        ]
      },
      {
        title: "6. Modificaciones de los Términos",
        icon: Scale,
        content: [
          "Nos reservamos el derecho de revisar y actualizar estos términos en cualquier momento para reflejar cambios legales o de funcionamiento. Las modificaciones entrarán en vigencia desde su publicación en este sitio."
        ]
      },
      {
        title: "7. Contacto Legal",
        icon: HelpCircle,
        content: [
          "Para cualquier duda o comunicación legal relacionada con estos términos, contáctanos en: smiwceron@gmail.com"
        ]
      }
    ],
    footer: "InnovaTech - Periodismo e innovación tecnológica con estándares de transparencia y calidad.",
    backBtn: "Aceptar y Cerrar"
  };

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
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-white leading-tight">
                      {content.title}
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {content.lastUpdated}
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
                {content.sections.map((sec, idx) => {
                  const IconComp = sec.icon;
                  return (
                    <div key={idx} className="space-y-2.5">
                      <h3 className="text-sm font-bold text-gray-950 dark:text-white flex items-center gap-2">
                        <IconComp className="w-4 h-4 text-blue-500" />
                        <span>{sec.title}</span>
                      </h3>
                      <div className="space-y-2 pl-6 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        {sec.content.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-2xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic text-center">
                    {content.footer}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/25 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {content.backBtn}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
