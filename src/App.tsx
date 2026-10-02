/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Search, User, Menu, Globe, Check, LogOut, LogIn, Play, Pause, RotateCcw, RotateCw, X, AlertTriangle, Home, Mail, Sun, Moon, Facebook, RefreshCw } from 'lucide-react';
import { Article, Topic } from './types';
import { NewsFeed } from './components/NewsFeed';
import { ArticleView } from './components/ArticleView';
import { MenuDrawer } from './components/MenuDrawer';
import { SearchModal } from './components/SearchModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsConditionsModal } from './components/TermsConditionsModal';
import { AboutUsModal } from './components/AboutUsModal';
import { FacebookPublisherModal } from './components/FacebookPublisherModal';
import { AuthModal } from './components/AuthModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { Footer } from './components/Footer';
import { ContactPage } from './components/ContactPage';
import { INITIAL_ARTICLES } from './data/initialArticles';
import { ensureClientUniqueArticles } from './lib/uniqueImages';
import { auth, db, getRedirectResult } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { getApiUrl, FACEBOOK_PAGE_URL } from './lib/utils';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import { AD_SLOTS } from './lib/adConfig';   // ← agregado

const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
];

const DICT: Record<string, Record<string, string>> = {
  es: {
    'For You': 'Lo más destacado de esta semana',
    'Featured This Week': 'Lo más destacado de esta semana',
    'Artificial Intelligence': 'Inteligencia Artificial',
    'Hardware': 'Hardware',
    'Software': 'Software',
    'Gadgets': 'Gadgets',
    'Videos': 'Videos',
    'Podcasts': 'Podcasts',
    'InnovaTech': 'InnovaTech Noticias',
    'No articles found for this topic right now.': 'No se encontraron artículos para este tema.',
    'Select Language': 'Selecciona tu Idioma',
    'Continue': 'Continuar',
    'Translation temporarily unavailable. Showing in English.': 'Traducción temporalmente no disponible. Mostrando en inglés.',
    'Menu opened': 'Menú abierto',
    'Search opened': 'Búsqueda abierta',
    'You have no new notifications.': 'No tienes nuevas notificaciones.',
    'Comments': 'Comentarios',
    'Write a comment...': 'Escribe un comentario...',
    'Sign in to leave a comment': 'Inicia sesión para dejar un comentario',
    'Post Comment': 'Publicar Comentario',
    'Be the first to comment!': '¡Sé el primero en comentar!',
    'Sign In': 'Iniciar Sesión',
    'Video Player': 'Reproductor de Video',
    'Progress saved': 'Progreso guardado',
    'Podcast Episode': 'Episodio de Podcast',
    'Active': 'Activo',
    'Read Original': 'Leer Original',
    'Press back again to exit the application': 'Presiona atrás de nuevo para salir de la aplicación',
    'Listen to Article': 'Escuchar Artículo',
    'Pause Reading': 'Pausar Lectura',
    'Resume Reading': 'Reanudar Lectura',
    'Stop Reading': 'Detener Lectura',
    'Latin Female Voice': 'Voz Latina Femenina',
    'Text-to-Speech': 'Texto a Voz',
    'Voice': 'Voz',
    'Select Voice': 'Seleccionar Voz',
    'Automatic': 'Automático',
    'AdMob Production Active': 'Monetización AdMob Activa',
    'Remove Ads': 'Quitar Ads',
    'InnovaTech Premium: No ads, offline mode and unlimited downloads.': 'InnovaTech Premium: Sin anuncios, modo offline y descargas ilimitadas.'
  },
  pt: {
    'For You': 'Destaques desta Semana',
    'Featured This Week': 'Destaques desta Semana',
    'Artificial Intelligence': 'Inteligência Artificial',
    'Hardware': 'Hardware',
    'Software': 'Software',
    'Gadgets': 'Gadgets',
    'Videos': 'Vídeos',
    'Podcasts': 'Podcasts',
    'InnovaTech': 'InnovaTech Notícias',
    'No articles found for this topic right now.': 'Nenhum artigo encontrado no momento.',
    'Translation temporarily unavailable. Showing in English.': 'Tradução temporariamente indisponível. Mostrando em inglês.',
    'Menu opened': 'Menu aberto',
    'Search opened': 'Pesquisa aberta',
    'You have no new notifications.': 'Você não tem novas notificações.',
    'Comments': 'Comentários',
    'Write a comment...': 'Escreva um comentário...',
    'Sign in to leave a comment': 'Faça login para deixar um comentário',
    'Post Comment': 'Publicar Comentário',
    'Be the first to comment!': 'Seja o primeiro a comentar!',
    'Sign In': 'Entrar',
    'Video Player': 'Reprodutor de Vídeo',
    'Progress saved': 'Progresso salvo',
    'Podcast Episode': 'Episódio de Podcast',
    'Active': 'Ativo',
    'Read Original': 'Ler Original',
    'Press back again to exit the application': 'Pressione voltar novamente para sair do aplicativo',
    'Listen to Article': 'Ouvir Artigo',
    'Pause Reading': 'Pausar Leitura',
    'Resume Reading': 'Retomar Leitura',
    'Stop Reading': 'Parar Leitura',
    'Latin Female Voice': 'Voz Latina Feminina',
    'Text-to-Speech': 'Conversor de texto em voz',
    'Voice': 'Voz',
    'Select Voice': 'Selecionar Voz',
    'Automatic': 'Automático',
    'AdMob Production Active': 'Monetização AdMob Ativa',
    'Remove Ads': 'Remover Ads',
    'InnovaTech Premium: No ads, offline mode and unlimited downloads.': 'InnovaTech Premium: Sem anúncios, modo offline e downloads ilimitados.'
  },
  fr: {
    'For You': 'Les Temps Forts de la Semaine',
    'Featured This Week': 'Les Temps Forts de la Semaine',
    'Artificial Intelligence': 'Intelligence Artificielle',
    'Hardware': 'Matériel',
    'Software': 'Logiciel',
    'Gadgets': 'Gadgets',
    'Videos': 'Vidéos',
    'Podcasts': 'Balados',
    'InnovaTech': 'InnovaTech Actualités',
    'No articles found for this topic right now.': 'Aucun article trouvé actuellement.',
    'Translation temporarily unavailable. Showing in English.': 'Traduction temporairement indisponible. Affichage en anglais.',
    'Menu opened': 'Menu ouvert',
    'Search opened': 'Recherche ouverte',
    'You have no new notifications.': 'Vous n\'avez pas de nouvelles notifications.',
    'Comments': 'Commentaires',
    'Write a comment...': 'Écrire un commentaire...',
    'Sign in to leave a comment': 'Connectez-vous pour laisser un commentaire',
    'Post Comment': 'Publier le commentaire',
    'Be the first to comment!': 'Soyez le premier à commenter !',
    'Sign In': 'Se Connecter',
    'Video Player': 'Lecteur Vidéo',
    'Progress saved': 'Progrès enregistré',
    'Podcast Episode': 'Épisode de Podcast',
    'Active': 'Actif',
    'Read Original': 'Lire l\'original',
    'Press back again to exit the application': 'Appuyez à nouveau sur retour pour quitter l\'application',
    'Listen to Article': 'Écouter l\'article',
    'Pause Reading': 'Mettre en pause',
    'Resume Reading': 'Reprendre la lecture',
    'Stop Reading': 'Arrêter la lecture',
    'Latin Female Voice': 'Voix latine féminine',
    'Text-to-Speech': 'Synthèse vocale',
    'Voice': 'Voix',
    'Select Voice': 'Choisir la voix',
    'Automatic': 'Automatique',
    'AdMob Production Active': 'Monétisation AdMob Active',
    'Remove Ads': 'Supprimer les pubs',
    'InnovaTech Premium: No ads, offline mode and unlimited downloads.': 'InnovaTech Premium : sans publicité, mode hors ligne et téléchargements illimités.'
  },
  de: {
    'For You': 'Highlights dieser Woche',
    'Featured This Week': 'Highlights dieser Woche',
    'Artificial Intelligence': 'Künstliche Intelligenz',
    'Hardware': 'Hardware',
    'Software': 'Software',
    'Gadgets': 'Gadgets',
    'Videos': 'Videos',
    'Podcasts': 'Podcasts',
    'InnovaTech': 'InnovaTech Nachrichten',
    'No articles found for this topic right now.': 'Zurzeit keine Artikel gefunden.',
    'Translation temporarily unavailable. Showing in English.': 'Übersetzung vorübergehend nicht verfügbar. Anzeige auf Englisch.',
    'Menu opened': 'Menü geöffnet',
    'Search opened': 'Suche geöffnet',
    'You have no new notifications.': 'Sie haben keine neuen Beachrichtigungen.',
    'Comments': 'Kommentare',
    'Write a comment...': 'Schreibe einen Kommentar...',
    'Sign in to leave a comment': 'Melden Sie sich an, um einen Kommentar zu hinterlassen',
    'Post Comment': 'Kommentar posten',
    'Be the first to comment!': 'Schreibe den ersten Kommentar!',
    'Sign In': 'Anmelden',
    'Video Player': 'Videoplayer',
    'Progress saved': 'Fortschritt gespeichert',
    'Podcast Episode': 'Podcast-Episode',
    'Active': 'Aktiv',
    'Read Original': 'Original lesen',
    'Press back again to exit the application': 'Drücken Sie erneut auf Zurück, um die App zu beenden',
    'Listen to Article': 'Artikel anhören',
    'Pause Reading': 'Vorlesen pausieren',
    'Resume Reading': 'Vorlesen fortsetzen',
    'Stop Reading': 'Vorlesen beenden',
    'Latin Female Voice': 'Weibliche lateinische Stimme',
    'Text-to-Speech': 'Sprachsynthese',
    'Voice': 'Stimme',
    'Select Voice': 'Stimme auswählen',
    'Automatic': 'Automatisch',
    'AdMob Production Active': 'AdMob-Monetisierung Aktiv',
    'Remove Ads': 'Werbung entfernen',
    'InnovaTech Premium: No ads, offline mode and unlimited downloads.': 'InnovaTech Premium: Keine Werbung, Offline-Modus und unbegrenzte Downloads.'
  }
};

const TOPICS: { id: Topic; label: string }[] = [
  { id: 'latest', label: 'Featured This Week' },
  { id: 'ai', label: 'Artificial Intelligence' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'software', label: 'Software' },
  { id: 'gadgets', label: 'Gadgets' }
  // Temporarily disabled for ad and store review:
  // { id: 'videos', label: 'Videos' },
  // { id: 'podcasts', label: 'Podcasts' }
];

export default function App() {
  const [activeTopic, setActiveTopic] = useState<Topic>('latest');
  const [articles, setArticles] = useState<Article[]>(() => ensureClientUniqueArticles(INITIAL_ARTICLES.filter(a => a.topic === 'latest'), 'latest'));
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [lang, setLang] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('innovatech_lang') || localStorage.getItem('techsync_lang')) : null;
    if (saved) return saved;
    const browserLang = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : 'es';
    if (browserLang && ['es', 'en', 'pt', 'fr', 'de'].includes(browserLang)) {
      return browserLang;
    }
    return 'es';
  });
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [show404, setShow404] = useState(false);
  const [showContactPage, setShowContactPage] = useState(false);

  // Theme support (light/dark mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('innovatech_theme') || localStorage.getItem('techsync_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('innovatech_theme', theme);
  }, [theme]);

  // Drawer / Notification states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastCheckedNotifications, setLastCheckedNotifications] = useState<number>(() => {
    return parseInt(localStorage.getItem('innovatech_notif_last_checked') || localStorage.getItem('techsync_notif_last_checked') || '0', 10);
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudio, setCurrentAudio] = useState<{ url: string; title: string; creator: string; articleId: string } | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curTime = audioRef.current.currentTime;
      setAudioProgress(curTime);
      if (currentAudio) {
        localStorage.setItem(`innovatech_audio_pos_${currentAudio.url}`, curTime.toString());
      }
    }
  };

  const handleDurationChange = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    setAudioProgress(0);
    if (currentAudio) {
      localStorage.removeItem(`innovatech_audio_pos_${currentAudio.url}`);
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current || !currentAudio) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsAudioPlaying(true))
        .catch(e => console.error("Playback failed:", e));
    }
  };

  const seekAudio = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setAudioProgress(seconds);
      if (currentAudio) {
        localStorage.setItem(`innovatech_audio_pos_${currentAudio.url}`, seconds.toString());
      }
    }
  };

  const playAudio = (url: string, title: string, creator: string, articleId: string) => {
    const isNew = !currentAudio || currentAudio.url !== url;
    setCurrentAudio({ url, title, creator, articleId });
    setIsAudioPlaying(true);

    setTimeout(() => {
      if (audioRef.current) {
        if (isNew) {
          audioRef.current.src = url;
          audioRef.current.playbackRate = playbackRate;
          const savedPos = localStorage.getItem(`innovatech_audio_pos_${url}`) || localStorage.getItem(`techsync_audio_pos_${url}`);
          if (savedPos) {
            audioRef.current.currentTime = parseFloat(savedPos);
            setAudioProgress(parseFloat(savedPos));
          } else {
            audioRef.current.currentTime = 0;
            setAudioProgress(0);
          }
        }
        audioRef.current.play()
          .then(() => setIsAudioPlaying(true))
          .catch(e => console.error("Playback failed:", e));
      }
    }, 50);
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  useEffect(() => {
    // Check if user authenticated via redirect fallback
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          showToast("¡Sesión iniciada con éxito!");
        }
      })
      .catch((err) => {
        console.warn("Redirect auth check:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.language) {
              setLang(data.language);
              localStorage.setItem('innovatech_lang', data.language);
              setShowLangSelector(false);
            }
            if (data.favoriteTopics && data.favoriteTopics.length > 0) {
              setActiveTopic(data.favoriteTopics[0] as Topic);
            }
          } else {
            // First time login
            const currentLang = localStorage.getItem('innovatech_lang') || 'es';
            try {
              await setDoc(doc(db, 'users', currentUser.uid), {
                email: currentUser.email,
                language: currentLang,
                updatedAt: new Date()
              });
            } catch (writeErr) {
              handleFirestoreError(writeErr, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${currentUser.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/contacto' || path === '/contacto.html') {
        setShowContactPage(true);
        setShow404(false);
        setSelectedArticle(null);
      } else if (path.startsWith('/articulo/') || path.startsWith('/article/') || path.startsWith('/noticia/')) {
        const rawId = decodeURIComponent(path.split('/')[2] || '');
        const cleanTarget = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const findInList = (list: Article[]) => list.find(a => {
          if (!a || !a.id) return false;
          if (a.id === rawId || a.id.toLowerCase() === rawId.toLowerCase()) return true;
          const aClean = a.id.toLowerCase().replace(/[^a-z0-9]/g, '');
          return aClean === cleanTarget || (cleanTarget.length > 8 && aClean.includes(cleanTarget));
        });
        const match = findInList(articles) || findInList(INITIAL_ARTICLES);
        if (match) {
          setSelectedArticle(match);
          setShow404(false);
          setShowContactPage(false);
        }
      } else if (path === '/' || path === '/index.html') {
        setShowContactPage(false);
        setShow404(false);
        setSelectedArticle(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    if (path === '/contacto' || path === '/contacto.html') {
      setShowContactPage(true);
      setShow404(false);
    } else if (path === '/acerca-de' || path === '/acerca-de.html' || path === '/about') {
      setShowAboutModal(true);
      setShowContactPage(false);
      setShow404(false);
    } else if (path === '/terminos' || path === '/terminos.html' || path === '/terms') {
      setShowTermsModal(true);
      setShowContactPage(false);
      setShow404(false);
    } else if (path === '/privacy' || path === '/privacy.html' || path === '/privacidad') {
      setShowPrivacyModal(true);
      setShowContactPage(false);
      setShow404(false);
    } else {
      setShowContactPage(false);
      setShow404(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const isPrivacyUrl = 
      params.get('privacy') === 'true' || 
      params.get('view') === 'privacy' || 
      path === '/privacy' || 
      path === '/privacy.html' || 
      path === '/privacidad' || 
      path === '/privacy-policy.html' ||
      window.location.hash === '#privacy';

    const isContactUrl = 
      params.get('contact') === 'true' || 
      params.get('view') === 'contact' || 
      path === '/contacto' || 
      path === '/contacto.html' || 
      path === '/contact' ||
      path === '/contact.html' ||
      window.location.hash === '#contacto';

    const isAboutUrl =
      params.get('about') === 'true' ||
      params.get('view') === 'about' ||
      path === '/acerca-de' ||
      path === '/acerca-de.html' ||
      path === '/about' ||
      path === '/about.html' ||
      window.location.hash === '#about';

    const isTermsUrl =
      params.get('terms') === 'true' ||
      params.get('view') === 'terms' ||
      path === '/terminos' ||
      path === '/terminos.html' ||
      path === '/terms' ||
      path === '/terms.html' ||
      window.location.hash === '#terms';

    const isArticleUrl = 
      path.startsWith('/articulo/') || 
      path.startsWith('/article/') || 
      path.startsWith('/noticia/') ||
      path.startsWith('/news/');

    const isCategoryUrl =
      path.startsWith('/categoria/') ||
      path.startsWith('/category/') ||
      path.startsWith('/noticias/') ||
      path.startsWith('/tema/') ||
      path.startsWith('/topic/') ||
      path.startsWith('/seccion/');

    const isGeneralCatalogUrl =
      path === '/' ||
      path === '/index.html' ||
      path === '/noticias' ||
      path === '/articulos' ||
      path === '/feed' ||
      path === '/rss';

    const isValidPath =
      isGeneralCatalogUrl ||
      isArticleUrl ||
      isCategoryUrl ||
      isPrivacyUrl ||
      isContactUrl ||
      isAboutUrl ||
      isTermsUrl;

    if (!isValidPath) {
      setShow404(true);
      setLang('es');
      setShowLangSelector(false);
    } else {
      setShow404(false);
      const savedLang = localStorage.getItem('innovatech_lang') || localStorage.getItem('techsync_lang');
      if (savedLang) {
        setLang(savedLang);
      }
    }

    if (isCategoryUrl) {
      const parts = path.split('/');
      let cat = parts[2] || 'latest';
      if (cat === 'ia') cat = 'ai';
      if (cat === 'ciberseguridad') cat = 'cybersecurity';
      const knownTopics = ['latest', 'ai', 'hardware', 'software', 'gadgets', 'cybersecurity', 'podcasts', 'videos', 'events', 'reviews'];
      if (knownTopics.includes(cat)) {
        setActiveTopic(cat);
      }
    }

    if (path === '/privacy' || path === '/privacy.html' || path === '/privacy-policy.html') {
      window.history.replaceState({}, '', '/privacidad');
    } else if (path === '/about' || path === '/about.html') {
      window.history.replaceState({}, '', '/acerca-de');
    } else if (path === '/terms' || path === '/terms.html') {
      window.history.replaceState({}, '', '/terminos');
    } else if (path === '/contact' || path === '/contact.html') {
      window.history.replaceState({}, '', '/contacto');
    }

    if (isPrivacyUrl) setShowPrivacyModal(true);
    if (isContactUrl) setShowContactPage(true);
    if (isAboutUrl) setShowAboutModal(true);
    if (isTermsUrl) setShowTermsModal(true);

    if (isArticleUrl) {
      const rawId = decodeURIComponent(window.location.pathname.split('/')[2] || '');
      if (rawId) {
        const cleanTarget = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const findInList = (list: Article[]) => list.find(a => {
          if (!a || !a.id) return false;
          if (a.id === rawId || a.id.toLowerCase() === rawId.toLowerCase()) return true;
          const aClean = a.id.toLowerCase().replace(/[^a-z0-9]/g, '');
          return aClean === cleanTarget || (cleanTarget.length > 8 && aClean.includes(cleanTarget));
        });

        const found = findInList(INITIAL_ARTICLES);
        if (found) {
          setSelectedArticle(found);
          setShow404(false);
        } else {
          // Fallback fetch: try static public /api/articles.json then dynamic endpoint
          const dynamicUrl = window.location.hostname === 'innovatech.fun' 
            ? 'https://innovatech-669972812446.us-east1.run.app/api/articles' 
            : getApiUrl('/api/articles');

          fetch('/api/articles.json')
            .then(r => r.ok ? r.json() : fetch(dynamicUrl).then(res => res.json()))
            .then(data => {
              const matched = findInList(data.articles || []);
              if (matched) {
                setSelectedArticle(matched);
                setShow404(false);
              }
            })
            .catch(() => {});
        }
      }
    }
  }, []);

  const handleGoHome = () => {
    window.history.pushState({}, '', '/');
    setShow404(false);
    setShowContactPage(false);
  };

  const handleLangSelect = async (code: string) => {
    setLang(code);
    localStorage.setItem('innovatech_lang', code);
    setShowLangSelector(false);
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          language: code,
          updatedAt: new Date()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const handleDeleteAccountData = async () => {
    if (!user) return;
    try {
      const uid = user.uid;
      
      // 1. Delete user configuration doc
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        console.error("Error deleting user profile", err);
      }

      // 2. Query & delete history records
      try {
        const qHistory = query(collection(db, 'history'), where('userId', '==', uid));
        const snapHistory = await getDocs(qHistory);
        const historyDeletePromises = snapHistory.docs.map(d => deleteDoc(d.ref));
        await Promise.all(historyDeletePromises);
      } catch (err) {
        console.error("Error deleting user history", err);
      }

      // 3. Query & delete user comments
      try {
        const qComments = query(collection(db, 'comments'), where('userId', '==', uid));
        const snapComments = await getDocs(qComments);
        const commentDeletePromises = snapComments.docs.map(d => deleteDoc(d.ref));
        await Promise.all(commentDeletePromises);
      } catch (err) {
        console.error("Error deleting user comments", err);
      }

      // 4. Sign out
      await signOut(auth);
      
      // 5. Feedback
      showToast("Tu cuenta y datos han sido eliminados permanentemente.");
    } catch (e) {
      console.error("Complete deletion failed", e);
      showToast("No se pudieron eliminar todos los datos. Contacta con soporte.");
    }
  };

  const handleTopicSelect = async (topicId: Topic) => {
    setActiveTopic(topicId);
    const cached = INITIAL_ARTICLES.filter(a => a.topic === topicId);
    if (cached.length > 0) {
      setArticles(ensureClientUniqueArticles(cached, topicId));
    }
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          favoriteTopics: [topicId],
          updatedAt: new Date()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const t = (text: string) => {
    if (!lang || lang === 'en') return text;
    return DICT[lang]?.[text] || text;
  };

  // Safe Article click wrapper to save reading/video watch history
  const handleArticleClick = async (article: Article) => {
    setSelectedArticle(article);
    window.history.pushState({}, '', '/articulo/' + encodeURIComponent(article.id));
    
    // Save to local history (unauthenticated user)
    try {
      const localHistoryStr = localStorage.getItem('innovatech_local_history') || localStorage.getItem('techsync_local_history');
      let localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
      localHistory = localHistory.filter((item: any) => item.articleId !== article.id && item.id !== article.id);
      
      const historyItem = {
        id: article.id,
        articleId: article.id,
        title: article.title,
        imageUrl: article.imageUrl || '',
        creator: article.creator || '',
        pubDate: article.pubDate || '',
        videoId: article.videoId || null,
        audioUrl: article.audioUrl || null,
        type: article.videoId ? 'video' : (article.audioUrl ? 'podcast' : 'news'),
        viewedAt: Date.now(),
        link: article.link || '',
        contentSnippet: article.contentSnippet || '',
        content: article.content || ''
      };
      
      localHistory.unshift(historyItem);
      if (localHistory.length > 50) localHistory.pop();
      localStorage.setItem('innovatech_local_history', JSON.stringify(localHistory));
    } catch (e) {
      console.error("Local history save error:", e);
    }

    // Save to Firestore history (authenticated user)
    if (user) {
      try {
        const safeId = `${user.uid}_${article.id.replace(/[^a-zA-Z0-9_\-]/g, '_')}`.substring(0, 120);
        await setDoc(doc(db, 'history', safeId), {
          userId: user.uid,
          articleId: article.id,
          title: article.title,
          imageUrl: article.imageUrl || '',
          creator: article.creator || '',
          pubDate: article.pubDate || '',
          type: article.videoId ? 'video' : (article.audioUrl ? 'podcast' : 'news'),
          viewedAt: new Date(),
          link: article.link || '',
          contentSnippet: article.contentSnippet || '',
          content: article.content || '',
          videoId: article.videoId || '',
          audioUrl: article.audioUrl || ''
        });
      } catch (e) {
        console.error("Firestore history save error:", e);
      }
    }
  };

  // Notifications live subscription
  useEffect(() => {
    const welcomeNotif = {
      id: 'welcome_notif',
      articleId: '',
      articleTitle: '',
      title: '¡Bienvenido a InnovaTech! 🎉',
      content: 'Explora las últimas noticias de tecnología, videos y podcasts en tu propio idioma.',
      createdAt: Date.now(),
      type: 'welcome'
    };

    const updateNotif = {
      id: 'update_notif',
      articleId: '',
      articleTitle: '',
      title: 'Modo Día y Noche Disponible 🌓',
      content: 'Configura el modo oscuro o claro y el idioma que prefieras directamente desde el menú de la esquina superior izquierda.',
      createdAt: Date.now() - 1800000,
      type: 'update'
    };

    if (!user) {
      setNotifications([welcomeNotif, updateNotif]);
      return;
    }

    // Listen to replies to comments posted by the user
    const qReplies = query(
      collection(db, "comments"),
      where("parentAuthorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(qReplies, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== user.uid) {
          list.push({
            id: doc.id,
            articleId: data.articleId,
            articleTitle: data.articleTitle || "Noticia",
            title: `Respuesta de ${data.userName || "un usuario"}`,
            content: data.content,
            createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (data.createdAt || Date.now()),
            type: 'reply'
          });
        }
      });

      list.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications([...list, welcomeNotif, updateNotif]);
    }, (err) => {
      console.error("Notifications subscription error:", err);
      setNotifications([welcomeNotif, updateNotif]);
    });

    return () => unsubscribe();
  }, [user]);

  const handleToggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen) {
      const now = Date.now();
      setLastCheckedNotifications(now);
      localStorage.setItem('innovatech_notif_last_checked', now.toString());
    }
  };

  const unreadCount = notifications.filter(n => n.createdAt > lastCheckedNotifications).length;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Back navigation & overlay management
  const isAnyOverlayOpen = !!selectedArticle || isSearchOpen || isMenuOpen || isNotificationsOpen;
  
  const isAnyOverlayOpenRef = useRef(isAnyOverlayOpen);
  isAnyOverlayOpenRef.current = isAnyOverlayOpen;

  const lastBackPressTimeRef = useRef<number>(0);

  const warningMsg = t('Press back again to exit the application');
  const warningMsgRef = useRef(warningMsg);
  warningMsgRef.current = warningMsg;

  const closeAllOverlays = () => {
    setSelectedArticle(null);
    setIsSearchOpen(false);
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
  };

  // Synchronize overlays with browser history and handle back presses
  useEffect(() => {
    // Initialize history state: replace current with 'prevent-exit' and push 'main'
    if (!window.history.state || !window.history.state.view) {
      window.history.replaceState({ view: 'prevent-exit' }, '');
      window.history.pushState({ view: 'main' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      // If we popped to main state
      if (state?.view === 'main') {
        if (isAnyOverlayOpenRef.current) {
          closeAllOverlays();
        }
      } 
      // If we popped to prevent-exit (meaning they pressed back on the main screen)
      else if (state?.view === 'prevent-exit') {
        if (isAnyOverlayOpenRef.current) {
          closeAllOverlays();
          window.history.pushState({ view: 'main' }, '');
        } else {
          const now = Date.now();
          if (now - lastBackPressTimeRef.current < 2000) {
            // Exit warning triggered again within 2 seconds. Exit the app.
            window.history.go(-1);
          } else {
            // First back press on main screen
            lastBackPressTimeRef.current = now;
            showToast(warningMsgRef.current);
            // Move history forward to 'main' so we are ready for next back press
            window.history.forward();
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Sync overlay open/close with history push/back
  useEffect(() => {
    const currentState = window.history.state;
    if (isAnyOverlayOpen) {
      if (currentState?.view === 'main') {
        window.history.pushState({ view: 'overlay' }, '');
      }
    } else {
      if (currentState?.view === 'overlay') {
        window.history.back();
      }
    }
  }, [isAnyOverlayOpen]);

  const [isRefreshingNews, setIsRefreshingNews] = useState(false);

  const fetchNews = async (showSpinner: boolean = true) => {
    if (!lang) return;
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/news?topic=${activeTopic}&lang=${lang}&_t=${Date.now()}`));
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        setArticles(ensureClientUniqueArticles(data.articles, activeTopic));
      }
      if (data.translationFailed) {
        showToast(t('Translation temporarily unavailable. Showing in English.'));
      }
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // Initial and topic/lang change fetch
  useEffect(() => {
    fetchNews(true);
  }, [activeTopic, lang]);

  // Automatic Background News Polling: keep production and preview tabs fresh every 5 minutes
  useEffect(() => {
    const pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchNews(false); // background silent update without spinner
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(pollTimer);
  }, [activeTopic, lang]);

  const handleManualRefreshNews = async () => {
    try {
      setIsRefreshingNews(true);
      // Trigger background sync on server if admin or normal fetch
      await fetch(getApiUrl('/api/sync-news'), {
        method: 'POST',
        headers: { 'x-admin-email': user?.email || '' }
      }).catch(() => {});

      await fetchNews(false);
      showToast("Noticias actualizadas con éxito.");
    } catch (err: any) {
      console.error("Error refreshing news:", err);
      showToast("Error al actualizar noticias.");
    } finally {
      setIsRefreshingNews(false);
    }
  };

  if (show404) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-gray-900 dark:text-gray-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-4xl font-black shadow-inner">
            404
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">{t('Página No Encontrada')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {t('La dirección que buscas no existe o ha sido movida.')}
            </p>
          </div>
          <button
            onClick={handleGoHome}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>{t('Ir al Inicio')}</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              {t('InnovaTech')}
            </h1>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-colors"
              title="Síguenos en Facebook (@InnovaTech)"
              aria-label="Página de Facebook InnovaTech"
            >
              <Facebook className="w-5 h-5 fill-blue-600/10" />
            </a>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              title={theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('Search') || 'Buscar'}
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button 
                onClick={handleToggleNotifications}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-red-500 text-[9px] text-white font-bold rounded-full border border-white dark:border-gray-950 leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover Dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl shadow-xl z-50 p-4 max-h-[80vh] overflow-y-auto flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                        <span className="font-bold text-sm flex items-center gap-1.5">
                          🔔 Notificaciones
                        </span>
                        <button 
                          onClick={() => setIsNotificationsOpen(false)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (n.articleId) {
                                  handleArticleClick({
                                    id: n.articleId,
                                    title: n.articleTitle || n.title,
                                    link: '',
                                    pubDate: new Date(n.createdAt).toISOString(),
                                    creator: '',
                                    contentSnippet: n.content,
                                    content: n.content,
                                    imageUrl: '',
                                    categories: []
                                  });
                                }
                                setIsNotificationsOpen(false);
                              }}
                              className={`text-left p-3 rounded-xl border transition-colors ${n.createdAt > lastCheckedNotifications ? 'bg-blue-50/35 dark:bg-blue-900/10 border-blue-100/50' : 'bg-transparent border-gray-100/40 dark:border-gray-850/30 hover:bg-gray-50 dark:hover:bg-gray-850'}`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-xs truncate text-gray-900 dark:text-gray-100">{n.title}</span>
                                <span className="text-[9px] text-gray-400 shrink-0">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                                {n.content}
                              </p>
                            </button>
                          ))
                        ) : (
                          <p className="text-center py-8 text-xs text-gray-400 italic">No tienes notificaciones.</p>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Topics Scroll & Auto-Updater */}
        {!showContactPage && (
          <div className="w-full px-4 sm:px-6 max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="overflow-x-auto scrollbar-hide flex-1">
              <div className="flex gap-6 pb-3 pt-1 w-max">
                {TOPICS.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic.id)}
                    className={`text-sm font-medium whitespace-nowrap transition-colors relative ${
                      activeTopic === topic.id 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                  >
                    {t(topic.label)}
                    {activeTopic === topic.id && (
                      <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-gray-900 dark:bg-white rounded-t-full"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick News Refresh / Auto-Updater button */}
            <div className="pb-3 pt-1 shrink-0">
              <button
                onClick={handleManualRefreshNews}
                disabled={isRefreshingNews || loading}
                title="Actualizar noticias en tiempo real"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingNews ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto pb-28 sm:pb-24 pt-4">
        {showContactPage ? (
          <ContactPage 
            onBack={handleGoHome}
            lang={lang || 'es'}
            t={t}
          />
        ) : (
          <>
            <NewsFeed 
              articles={articles} 
              loading={loading} 
              onArticleClick={handleArticleClick}
              emptyMessage={t('No articles found for this topic right now.')}
              t={t}
            />

            {/* Sección de Contacto Dedicada */}
            <div className="mt-16 px-4 max-w-2xl mx-auto">
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-900 dark:to-gray-850/60 border border-blue-100/35 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-2 text-center sm:text-left min-w-0 flex-1 relative z-10">
                  <span className="inline-block px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/40 dark:bg-blue-900/40 rounded-full uppercase tracking-wider">
                    Soporte y Contacto
                  </span>
                  <h3 className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white leading-snug">
                    ¿Tienes alguna duda o sugerencia?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Ponte en contacto directo con el equipo de InnovaTech en <span className="font-bold text-gray-700 dark:text-gray-200">contacto@innovatech.fun</span>.
                  </p>
                </div>
                
                <div className="shrink-0 relative z-10 w-full sm:w-auto">
                  <button 
                    onClick={() => navigateTo('/contacto')}
                    className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/15 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] w-full cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Página de Contacto</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rich Web Footer with legal & category links */}
            <Footer
              onOpenAbout={() => setShowAboutModal(true)}
              onOpenPrivacy={() => setShowPrivacyModal(true)}
              onOpenTerms={() => setShowTermsModal(true)}
              onOpenContact={() => navigateTo('/contacto')}
              onSelectTopic={(topicId) => {
                setActiveTopic(topicId as Topic);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}
      </main>

      {/* Menu Drawer on the left */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        lang={lang || 'es'}
        t={t}
        onArticleClick={handleArticleClick}
        theme={theme}
        setTheme={setTheme}
        onLangChange={handleLangSelect}
        onOpenLangSelector={() => {
          setShowLangSelector(true);
          setIsMenuOpen(false);
        }}
        onOpenPrivacyPolicy={() => {
          setShowPrivacyModal(true);
          setIsMenuOpen(false);
        }}
        onOpenTerms={() => {
          setShowTermsModal(true);
          setIsMenuOpen(false);
        }}
        onOpenAbout={() => {
          setShowAboutModal(true);
          setIsMenuOpen(false);
        }}
        onDeleteAccountData={handleDeleteAccountData}
        onOpenContactPage={() => {
          navigateTo('/contacto');
          setIsMenuOpen(false);
        }}
        onOpenFacebookAdmin={() => {
          setShowFacebookModal(true);
          setIsMenuOpen(false);
        }}
      />

      <AnimatePresence>
        {selectedArticle && (
          <ArticleView 
            article={selectedArticle} 
            onBack={() => {
              setSelectedArticle(null);
              window.history.pushState({}, '', '/');
            }} 
            lang={lang || 'en'}
            t={t}
            user={user}
            onLogin={handleLogin}
            currentAudio={currentAudio}
            isAudioPlaying={isAudioPlaying}
            playAudio={playAudio}
            pauseAudio={pauseAudio}
            audioProgress={audioProgress}
            audioDuration={audioDuration}
            seekAudio={seekAudio}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            lang={lang || 'es'}
            t={t}
            onArticleClick={handleArticleClick}
          />
        )}
      </AnimatePresence>

      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        lang={lang || 'es'}
      />

      <TermsConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        lang={lang || 'es'}
      />

      <AboutUsModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        onOpenContact={() => {
          setShowAboutModal(false);
          navigateTo('/contacto');
        }}
        lang={lang || 'es'}
      />

      <FacebookPublisherModal
        isOpen={showFacebookModal}
        onClose={() => setShowFacebookModal(false)}
        user={user}
        lang={lang || 'es'}
        t={t}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => showToast("¡Sesión iniciada con éxito!")}
        lang={lang || 'es'}
        t={t}
      />

      <CookieConsentBanner
        onOpenPrivacy={() => setShowPrivacyModal(true)}
      />

      {/* Global Audio Player Sticky Bar (Spotify style) */}
      <AnimatePresence>
        {currentAudio && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-xl px-4 py-3 sm:px-6"
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                  <Globe className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                    {currentAudio.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentAudio.creator || 'Podcast'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-950 dark:hover:text-white transition-colors hidden sm:block"
                  title="Rewind 15 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlayAudio}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0"
                >
                  {isAudioPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 15);
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-950 dark:hover:text-white transition-colors hidden sm:block"
                  title="Forward 15 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    let nextRate = 1;
                    if (playbackRate === 1) nextRate = 1.25;
                    else if (playbackRate === 1.25) nextRate = 1.5;
                    else if (playbackRate === 1.5) nextRate = 2;
                    else nextRate = 1;
                    setPlaybackRate(nextRate);
                    if (audioRef.current) audioRef.current.playbackRate = nextRate;
                  }}
                  className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-800 dark:text-gray-200"
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>

                <button
                  onClick={() => {
                    setIsAudioPlaying(false);
                    setCurrentAudio(null);
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.src = "";
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-1 shrink-0"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Seek Slider bar */}
            <div 
              className="max-w-5xl mx-auto mt-2.5 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full cursor-pointer relative overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seekAudio(pos * audioDuration);
              }}
            >
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                style={{ width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={handleAudioEnded}
      />

      {/* Language Selector Modal */}
      <AnimatePresence>
        {showLangSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 relative"
            >
              <button 
                onClick={() => setShowLangSelector(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex justify-center mb-4 text-blue-600 dark:text-blue-400">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-1 text-gray-900 dark:text-white tracking-tight">
                {t('Select Language') || 'Selecciona tu Idioma'}
              </h2>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">
                InnovaTech Noticias
              </p>
              
              <div className="flex flex-col gap-2.5">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => handleLangSelect(l.code)}
                    className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left text-sm font-semibold ${
                      lang === l.code 
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'border-gray-200 dark:border-gray-700/80 hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <span>{l.name}</span>
                    <Check className={`w-4 h-4 text-blue-500 transition-opacity ${lang === l.code ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed ${currentAudio ? 'bottom-[96px]' : 'bottom-[28px]'} left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-lg z-50 text-sm font-medium transition-all`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

