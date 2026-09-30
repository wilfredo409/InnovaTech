import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, Shield, Check, X, Settings2, Sliders, ExternalLink } from "lucide-react";

interface CookieConsentBannerProps {
  onOpenPrivacy: () => void;
}

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export function CookieConsentBanner({ onOpenPrivacy }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    // Listen for custom trigger to reopen settings from footer
    const handleReopen = () => {
      setIsConfiguring(true);
      setIsVisible(true);
    };

    window.addEventListener("open-cookie-settings", handleReopen);

    const savedConsent = localStorage.getItem("innovatech_cookie_consent");
    if (!savedConsent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("open-cookie-settings", handleReopen);
      };
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setAnalyticsAllowed(!!parsed.analytics);
        setMarketingAllowed(!!parsed.marketing);
        // Sync AdSense non-personalized setting
        if (!parsed.marketing) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).requestNonPersonalizedAds = 1;
        }
      } catch {
        if (savedConsent === "essential") {
          setMarketingAllowed(false);
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).requestNonPersonalizedAds = 1;
        } else if (savedConsent === "all") {
          setMarketingAllowed(true);
          setAnalyticsAllowed(true);
        }
      }
    }

    return () => window.removeEventListener("open-cookie-settings", handleReopen);
  }, []);

  const savePreferences = (essential: boolean, analytics: boolean, marketing: boolean) => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("innovatech_cookie_consent", JSON.stringify(prefs));
    localStorage.setItem("innovatech_cookie_consent_legacy", marketing ? "all" : "essential");

    // AdSense compliance: if marketing is false, enforce NonPersonalizedAds = 1
    if (!marketing) {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).requestNonPersonalizedAds = 1;
    } else {
      delete ((window as any).adsbygoogle || {}).requestNonPersonalizedAds;
    }

    // Notify all active ad components and listeners
    window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: prefs }));

    setIsVisible(false);
    setIsConfiguring(false);
  };

  const handleAcceptAll = () => {
    savePreferences(true, true, true);
  };

  const handleAcceptEssential = () => {
    savePreferences(true, false, false);
  };

  const handleSaveCustom = () => {
    savePreferences(true, analyticsAllowed, marketingAllowed);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop if in configuring modal mode */}
          {isConfiguring && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[998] backdrop-blur-xs"
              onClick={() => setIsConfiguring(false)}
            />
          )}

          <motion.div
            initial={{ y: 80, opacity: 0, scale: isConfiguring ? 0.95 : 1 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className={`fixed z-[999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-5 sm:p-6 ${
              isConfiguring 
                ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                : "bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg"
            }`}
            id="cookie-consent-banner"
          >
            {/* Header info */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 mt-0.5 shadow-xs">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">
                    {isConfiguring ? "Configuración Avanzada de Cookies" : "Transparencia y Gestión de Cookies"}
                  </h3>
                  {isConfiguring && (
                    <button
                      onClick={() => setIsConfiguring(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  {isConfiguring
                    ? "Personaliza qué tipos de cookies autorizas almacenar en tu navegador. Proveedores externos como Google utilizan cookies para publicar anuncios basados en tus visitas anteriores."
                    : "En InnovaTech utilizamos cookies técnicas, analíticas y publicitarias de proveedores externos (incluido Google AdSense) para personalizar anuncios, analizar el tráfico y mantener el portal gratuito."
                  }
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onOpenPrivacy}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Política de Privacidad y Cookies</span>
                  </button>
                  <a
                    href="https://myadcenter.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Centro de Anuncios Google</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Granular Settings Toggles */}
            {isConfiguring && (
              <div className="mt-5 space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
                {/* 1. Necessary */}
                <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">Cookies Esenciales y Técnicas</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-md font-bold">Siempre Activas</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Requeridas para la navegación segura, sesión de usuario, tema visual e integridad del sistema.
                    </p>
                  </div>
                </div>

                {/* 2. Analytics */}
                <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-800">
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-gray-900 dark:text-white">Cookies de Rendimiento y Análisis</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Métricas anónimas para evaluar velocidad de carga del servidor y optimizar la experiencia de lectura.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={analyticsAllowed}
                      onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 3. Advertising */}
                <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-800">
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-gray-900 dark:text-white">Publicidad Personalizada (Google AdSense)</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Permite a Google y a sus socios presentar anuncios relevantes según tus intereses. Al desactivar, se mostrarán anuncios contextuales no personalizados.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={marketingAllowed}
                      onChange={(e) => setMarketingAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              {isConfiguring ? (
                <>
                  <button
                    onClick={handleAcceptEssential}
                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Rechazar No Esenciales
                  </button>
                  <button
                    onClick={handleSaveCustom}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
                  >
                    Guardar Selección
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsConfiguring(true)}
                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center inline-flex items-center justify-center gap-1.5"
                    title="Configurar Cookies"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configurar</span>
                  </button>
                  <button
                    onClick={handleAcceptEssential}
                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Solo Esenciales
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer text-center"
                  >
                    Aceptar Todas
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
