import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, Shield, Check, X } from "lucide-react";

interface CookieConsentBannerProps {
  onOpenPrivacy: () => void;
}

export function CookieConsentBanner({ onOpenPrivacy }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("innovatech_cookie_consent");
    if (!consent) {
      // Small delay to prevent layout flicker on initial load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("innovatech_cookie_consent", "all");
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem("innovatech_cookie_consent", "essential");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-2xl"
          id="cookie-consent-banner"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 mt-0.5 shadow-sm">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">
                Consentimiento de Cookies y Privacidad
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                Utilizamos cookies propias y de terceros (como Google AdSense y Firebase) para personalizar anuncios, analizar el tráfico y mejorar tu experiencia.
              </p>
              <div className="pt-1">
                <button
                  onClick={onOpenPrivacy}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3 h-3" />
                  <span>Leer Política de Privacidad y Cookies</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleAcceptEssential}
              className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-750 dark:text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
            >
              Solo Esenciales
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer text-center"
            >
              Aceptar Todas
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
