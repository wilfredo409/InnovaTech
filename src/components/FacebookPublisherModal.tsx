import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Facebook, RefreshCw, Send, CheckCircle2, AlertCircle, 
  ExternalLink, Key, ShieldCheck, Clock, Trash2, Globe
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { getApiUrl, isAdminUser, ADMIN_EMAIL } from "../lib/utils";

interface FacebookPublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  lang?: string;
  t?: (key: string) => string;
}

interface FacebookStatus {
  valid: boolean;
  pageId?: string;
  name?: string;
  error?: string;
  diagnostic?: string;
  configured?: {
    hasPageId: boolean;
    pageId: string | null;
    hasToken: boolean;
    tokenPrefix: string | null;
  };
}

export function FacebookPublisherModal({
  isOpen,
  onClose,
  user
}: FacebookPublisherModalProps) {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [syncingNews, setSyncingNews] = useState(false);
  const [status, setStatus] = useState<FacebookStatus | null>(null);
  const [customToken, setCustomToken] = useState("");
  const [customPageId, setCustomPageId] = useState("");
  const [saveCredentials, setSaveCredentials] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);

  const isAdmin = isAdminUser(user);

  const fetchStatus = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const res = await fetch(getApiUrl("/api/social/facebook/status"), {
        headers: { "x-admin-email": user?.email || "" }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
      const historyRes = await fetch(getApiUrl("/api/social/facebook/history"), {
        headers: { "x-admin-email": user?.email || "" }
      });
      if (historyRes.ok) {
        const hData = await historyRes.json();
        setHistoryCount(hData.count || 0);
      }
    } catch (e: any) {
      console.error("Error fetching Facebook status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchStatus();
      setActionMessage(null);
    }
  }, [isOpen, isAdmin]);

  const handleTestOrSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !customToken.trim()) return;
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await fetch(getApiUrl("/api/social/facebook/test-connection"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-email": user?.email || ""
        },
        body: JSON.stringify({
          pageId: customPageId.trim() || undefined,
          pageToken: customToken.trim(),
          save: saveCredentials
        })
      });
      const data = await res.json();
      if (data.valid) {
        setActionMessage({
          type: "success",
          text: `¡Conexión verificada! Página: ${data.name || data.pageId}. Las credenciales han sido guardadas.`
        });
        setCustomToken("");
        await fetchStatus();
      } else {
        setActionMessage({
          type: "error",
          text: `Error de verificación: ${data.error || data.diagnostic || "No se pudo conectar con la página."}`
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: `Error de red: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishLatest = async () => {
    if (!isAdmin) return;
    try {
      setPublishing(true);
      setActionMessage(null);
      const res = await fetch(getApiUrl("/api/social/facebook/publish-latest"), {
        method: "POST",
        headers: { "x-admin-email": user?.email || "" }
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: "success",
          text: `¡Artículo publicado en Facebook exitosamente con visibilidad pública! ID: ${data.postId}`
        });
        await fetchStatus();
      } else {
        setActionMessage({
          type: "error",
          text: `No se pudo publicar: ${data.error}`
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: `Error al publicar: ${err.message}`
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleClearHistory = async () => {
    if (!isAdmin) return;
    try {
      setClearing(true);
      setActionMessage(null);
      const res = await fetch(getApiUrl("/api/social/facebook/history/clear"), {
        method: "POST",
        headers: { "x-admin-email": user?.email || "" }
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: "success",
          text: "Historial de publicaciones reiniciado a cero. La cola volverá a publicar los artículos como publicaciones públicas."
        });
        await fetchStatus();
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: `Error reiniciando historial: ${err.message}`
      });
    } finally {
      setClearing(false);
    }
  };

  const handleSyncNews = async () => {
    if (!isAdmin) return;
    try {
      setSyncingNews(true);
      setActionMessage(null);
      const res = await fetch(getApiUrl("/api/sync-news?force=true"), {
        method: "POST",
        headers: { "x-admin-email": user?.email || "" }
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: "success",
          text: `Sincronización completada: ${data.ingestedCount} nuevas noticias añadidas a la web. ¡Listas para verse y publicarse!`
        });
        await fetchStatus();
      } else {
        setActionMessage({
          type: "error",
          text: `Error al sincronizar noticias: ${data.error || "No se pudo sincronizar."}`
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: `Error al sincronizar: ${err.message}`
      });
    } finally {
      setSyncingNews(false);
    }
  };

  if (!isOpen) return null;

  // Strict Security Guard: Only smiwceron@gmail.com can view or operate this panel
  if (!isAdmin) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-800 text-center space-y-4 shadow-2xl"
          >
            <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl w-fit mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Acceso de Administrador</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Este panel de administración está reservado únicamente para la cuenta de superadministrador autorizada ({ADMIN_EMAIL}).
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
                <Facebook className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Publicador Automático de Facebook
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    🛡️ Admin: {user?.email}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* Status Feedback banner */}
            {actionMessage && (
              <div
                className={`p-4 rounded-2xl flex items-start gap-3 ${
                  actionMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : actionMessage.type === "error"
                    ? "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                    : "bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                }`}
              >
                {actionMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                )}
                <div className="text-xs leading-relaxed font-medium">
                  {actionMessage.text}
                </div>
              </div>
            )}

            {/* Connection Status Card */}
            <div className="bg-gray-50 dark:bg-gray-950/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  Estado de la Conexión Meta API
                </span>
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Actualizar estado</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status?.valid
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                      : "bg-amber-500 shadow-sm shadow-amber-500/50"
                  }`}
                />
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {status?.valid
                    ? `Conectado a la página: ${status.name || "InnovaTech"}`
                    : status?.error || "El token actual requiere renovación o permisos en Meta Developers"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <span className="font-medium text-gray-400">Page ID configurado: </span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    61595083524439
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-400">Posts en historial: </span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {historyCount} artículo(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Why posts become private info box */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
                <Globe className="w-4 h-4" />
                <span>¿Por qué Meta/Facebook hace las publicaciones privadas?</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Cuando una aplicación en <strong>developers.facebook.com</strong> está en <strong>"Modo En Desarrollo" (Development)</strong>, Meta oculta automáticamente cualquier contenido publicado del público general: solo el creador y administradores de la app pueden verlo.
              </p>
              <div className="bg-white/80 dark:bg-gray-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-gray-800 dark:text-gray-200 space-y-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Cómo hacer que las publicaciones sean 100% públicas para todo el mundo:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-gray-600 dark:text-gray-300">
                  <li>Ingresa a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">developers.facebook.com/apps</a>.</li>
                  <li>Selecciona tu aplicación.</li>
                  <li>En la barra superior, cambia el botón de <strong>"En desarrollo"</strong> a <strong>"En vivo" (Live Mode)</strong>.</li>
                  <li>Si te pide URL de Privacidad, coloca: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">https://innovatech.fun/privacy</code>.</li>
                </ol>
              </div>
            </div>

            {/* Actions: Publish and Reset History */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Acciones de Publicación Inmediata
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePublishLatest}
                  disabled={publishing}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${publishing ? "animate-pulse" : ""}`} />
                  <span>{publishing ? "Publicando..." : "Publicar Último Artículo (Público)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={clearing}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                  title="Reinicia la lista de artículos marcados como publicados para que vuelvan a salir en Facebook"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>{clearing ? "Reiniciando..." : "Reiniciar Historial de Publicaciones"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncNews}
                  disabled={syncingNews}
                  className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer sm:col-span-2"
                  title="Descarga y enriquece las noticias más recientes desde las fuentes RSS oficiales para que estén en la web y en Facebook"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingNews ? "animate-spin" : ""}`} />
                  <span>{syncingNews ? "Sincronizando noticias RSS..." : "Sincronizar Noticias de la Web Ahora (Actualizador)"}</span>
                </button>
              </div>
            </div>

            {/* Update Access Token Form */}
            <form onSubmit={handleTestOrSaveToken} className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-5">
              <span className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-500" />
                Actualizar Page Access Token en tiempo de ejecución
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Si renovaste el token en Meta Graph Explorer o generaste un Page Token permanente, pégalo aquí para activarlo inmediatamente sin reiniciar el servidor:
              </p>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Pega tu nuevo FACEBOOK_PAGE_ACCESS_TOKEN (EAA...)"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveCredentials}
                      onChange={(e) => setSaveCredentials(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Guardar y activar para publicaciones automáticas</span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !customToken.trim()}
                    className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl text-xs transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {loading ? "Verificando..." : "Verificar y Activar Token"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-950/20 text-xs">
            <a
              href="https://www.facebook.com/share/19yG89kdBd/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>Ver Página de Facebook</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold rounded-xl text-gray-700 dark:text-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
