import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, LogIn, Mail, Lock, AlertCircle, CheckCircle2, 
  ExternalLink, ArrowRight, UserPlus, Shield, Sparkles
} from 'lucide-react';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from '../lib/firebase';
import { ADMIN_EMAIL } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  lang?: string;
  t?: (key: string) => string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  lang = 'es',
  t = (s: string) => s
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [popupFailed, setPopupFailed] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPopupFailed(false);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setSuccessMsg('¡Sesión iniciada con éxito!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: any) {
      console.warn('Google popup error:', err.code, err.message);
      setPopupFailed(true);

      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('La ventana de Google se cerró antes de completar el inicio de sesión. Si se cerró sola, tu navegador puede estar bloqueando ventanas emergentes o cookies de terceros.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('El dominio de la aplicación no está en la lista de dominios autorizados de Google OAuth. Puedes iniciar sesión abajo con tu correo y contraseña.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Tu navegador bloqueó la ventana emergente de Google. Habilita las ventanas emergentes o usa el acceso con Correo y Contraseña.');
      } else {
        setErrorMsg(err.message || 'Error al conectar con Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRedirectSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error('Google redirect error:', err);
      setErrorMsg(err.message || 'Error al iniciar redirección.');
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg('¡Bienvenido! Sesión iniciada correctamente.');
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg('¡Cuenta creada e iniciada con éxito!');
      }

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Email auth error:', err.code, err.message);

      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        if (authMode === 'signin') {
          setErrorMsg('Credenciales no encontradas. Si aún no has creado una contraseña con este correo, haz clic abajo en "Crear cuenta" para registrarla ahora mismo.');
        } else {
          setErrorMsg('Contraseña o correo inválido.');
        }
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado. Cambia a "Iniciar Sesión" e ingresa tu contraseña.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Formato de correo electrónico inválido.');
      } else {
        setErrorMsg(err.message || 'Error al autenticar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Escribe tu correo arriba para enviarte el enlace de recuperación.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(`Se ha enviado un correo a ${email} para restablecer tu contraseña.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo enviar el correo de restablecimiento.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-blue-50/40 dark:bg-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Accede a InnovaTech con tu cuenta
                </p>
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
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {/* Feedback Messages */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/40 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Quick Admin Chip for smiwceron@gmail.com */}
            <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-[11px] text-gray-900 dark:text-gray-100">Super Administrador</span>
                  <span className="text-[10px] text-gray-500 font-mono">{ADMIN_EMAIL}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmail(ADMIN_EMAIL)}
                className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              >
                Usar Correo
              </button>
            </div>

            {/* Google Sign-In Primary Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-gray-800 dark:text-gray-100 font-bold rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
              </button>

              {popupFailed && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleGoogleRedirectSignIn}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    ¿La ventana se cerró sola? Probar con redirección completa →
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
              <span className="flex-shrink mx-3 text-gray-400 dark:text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                O con Correo y Contraseña
              </span>
              <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="tu-correo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    Contraseña
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50 text-xs"
              >
                <span>{loading ? 'Verificando...' : authMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center pt-1 border-t border-gray-100 dark:border-gray-800">
              {authMode === 'signin' ? (
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                  ¿Aún no has registrado una contraseña con tu correo?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Crear cuenta aquí
                  </button>
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                  ¿Ya tienes cuenta creada?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMsg(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Iniciar sesión aquí
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
