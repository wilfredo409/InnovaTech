import React from "react";
import { 
  Shield, FileText, Mail, Sparkles, Globe, Cpu, 
  HelpCircle, Info, ExternalLink, Heart 
} from "lucide-react";

interface FooterProps {
  onOpenAbout: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenContact: () => void;
  onSelectTopic?: (topicId: string) => void;
}

export function Footer({
  onOpenAbout,
  onOpenPrivacy,
  onOpenTerms,
  onOpenContact,
  onSelectTopic
}: FooterProps) {
  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand & Editorial Mission */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                InnovaTech
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-sm">
              Tu portal de referencia para el periodismo tecnológico de vanguardia, avances en inteligencia artificial, hardware de nueva generación, reseñas y análisis independientes.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full text-[11px]">
                <Globe className="w-3 h-3 text-blue-500" />
                <span>Multilingüe (ES, EN, PT, FR, DE)</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full text-[11px]">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Actualización Diaria</span>
              </span>
            </div>
          </div>

          {/* Temas / Categorías */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Categorías
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <li>
                <button 
                  onClick={() => onSelectTopic && onSelectTopic('ai')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Inteligencia Artificial
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTopic && onSelectTopic('hardware')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Hardware y Procesadores
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTopic && onSelectTopic('software')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Software y Desarrollo
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTopic && onSelectTopic('mobile')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Smartphones y Gadgets
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTopic && onSelectTopic('cybersecurity')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Ciberseguridad y Redes
                </button>
              </li>
            </ul>
          </div>

          {/* Páginas Legales y Soporte */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Transparencia y Legal
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <li>
                <button 
                  onClick={onOpenAbout}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Acerca de Nosotros (Sobre InnovaTech)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenPrivacy}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Política de Privacidad y Cookies</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenTerms}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Términos y Condiciones de Uso</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenContact}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>Contacto y Soporte Editorial</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-settings"))}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-500" />
                  <span>Preferencias de Cookies</span>
                </button>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed font-medium space-y-0.5">
              <div>Contacto general: <a href="mailto:contacto@innovatech.fun" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">contacto@innovatech.fun</a></div>
              <div>Redacción y prensa: <a href="mailto:redaccion@innovatech.fun" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">redaccion@innovatech.fun</a></div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            © {new Date().getFullYear()} InnovaTech Digital Media. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <button onClick={onOpenPrivacy} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
              Privacidad
            </button>
            <span>•</span>
            <button onClick={onOpenTerms} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
              Términos
            </button>
            <span>•</span>
            <button onClick={onOpenContact} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
              Contacto
            </button>
            <span>•</span>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-settings"))} 
              className="text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
            >
              Cookies
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
