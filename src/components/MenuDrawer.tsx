import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Moon, Sun, User, LogIn, LogOut, BookOpen, Play, 
  MessageSquare, CornerDownRight, Globe, Check, Shield, Trash2, AlertTriangle, Mail, Info, FileText 
} from "lucide-react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { Article } from "../types";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  lang: string;
  t: (text: string) => string;
  onArticleClick: (article: Article) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  onLangChange: (lang: string) => void;
  onOpenLangSelector: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTerms?: () => void;
  onOpenAbout?: () => void;
  onDeleteAccountData: () => Promise<void>;
  onOpenContactPage: () => void;
}

interface HistoryItem {
  id: string;
  articleId: string;
  title: string;
  imageUrl: string;
  type: "news" | "video" | "podcast";
  pubDate: string;
  creator?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  videoId?: string;
  audioUrl?: string;
  viewedAt: any;
}

interface UserComment {
  id: string;
  articleId: string;
  articleTitle?: string;
  content: string;
  createdAt: number;
}

interface UserReply {
  id: string;
  articleId: string;
  articleTitle?: string;
  commentAuthorName: string;
  replyContent: string;
  createdAt: number;
}

export function MenuDrawer({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
  lang,
  t,
  onArticleClick,
  theme,
  setTheme,
  onLangChange,
  onOpenLangSelector,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onOpenAbout,
  onDeleteAccountData,
  onOpenContactPage
}: MenuDrawerProps) {
  const [activeTab, setActiveTab] = useState<"history" | "videos" | "comments" | "replies">("history");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Real-time Firestore or Local Storage data states
  const [readNews, setReadNews] = useState<HistoryItem[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<HistoryItem[]>([]);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [userReplies, setUserReplies] = useState<UserReply[]>([]);
  const [loading, setLoading] = useState(false);

  // Load guest data / Local storage fallback
  const loadLocalData = () => {
    try {
      const localHistoryStr = localStorage.getItem("innovatech_local_history") || localStorage.getItem("techsync_local_history");
      if (localHistoryStr) {
        const localHistory: HistoryItem[] = JSON.parse(localHistoryStr);
        setReadNews(localHistory.filter(item => item.type !== "video"));
        setWatchedVideos(localHistory.filter(item => item.type === "video"));
      } else {
        setReadNews([]);
        setWatchedVideos([]);
      }
      setUserComments([]);
      setUserReplies([]);
    } catch (e) {
      console.error("Failed to load local history", e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!user) {
      loadLocalData();
      return;
    }

    setLoading(true);

    // 1. Subscribe to reading & video watch history in Firestore
    const qHistory = query(
      collection(db, "history"),
      where("userId", "==", user.uid)
    );

    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const historyList: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        historyList.push({
          id: data.articleId,
          articleId: data.articleId,
          title: data.title,
          imageUrl: data.imageUrl || "",
          type: data.type,
          pubDate: data.pubDate || "",
          creator: data.creator || "",
          link: data.link || "",
          contentSnippet: data.contentSnippet || "",
          content: data.content || "",
          videoId: data.videoId || "",
          audioUrl: data.audioUrl || "",
          viewedAt: data.viewedAt?.seconds ? data.viewedAt.seconds * 1000 : (data.viewedAt || Date.now())
        });
      });

      // Sort by viewedAt desc
      historyList.sort((a, b) => b.viewedAt - a.viewedAt);

      setReadNews(historyList.filter(item => item.type !== "video"));
      setWatchedVideos(historyList.filter(item => item.type === "video"));
      setLoading(false);
    }, (err) => {
      console.error("Firestore history subscription error:", err);
      loadLocalData();
      setLoading(false);
    });

    // 2. Subscribe to user comments
    const qComments = query(
      collection(db, "comments"),
      where("userId", "==", user.uid)
    );

    const unsubComments = onSnapshot(qComments, (snapshot) => {
      const commentsList: UserComment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        commentsList.push({
          id: doc.id,
          articleId: data.articleId,
          articleTitle: data.articleTitle || "Article Link",
          content: data.content,
          createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (data.createdAt || Date.now())
        });
      });

      commentsList.sort((a, b) => b.createdAt - a.createdAt);
      setUserComments(commentsList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "comments");
    });

    // 3. Subscribe to replies received on their comments (written by other users)
    const qReplies = query(
      collection(db, "comments"),
      where("parentAuthorId", "==", user.uid)
    );

    const unsubReplies = onSnapshot(qReplies, (snapshot) => {
      const repliesList: UserReply[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include replies written by others, not ourselves
        if (data.userId !== user.uid) {
          repliesList.push({
            id: doc.id,
            articleId: data.articleId,
            articleTitle: data.articleTitle || "Article Link",
            commentAuthorName: data.userName || "User",
            replyContent: data.content,
            createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (data.createdAt || Date.now())
          });
        }
      });

      repliesList.sort((a, b) => b.createdAt - a.createdAt);
      setUserReplies(repliesList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "comments");
    });

    return () => {
      unsubHistory();
      unsubComments();
      unsubReplies();
    };
  }, [isOpen, user]);

  const handleItemClick = (item: any) => {
    const mockArticle: Article = {
      id: item.articleId || item.id,
      title: item.title || item.articleTitle || "InnovaTech News",
      link: item.link || "",
      pubDate: item.pubDate || new Date(item.createdAt || Date.now()).toISOString(),
      creator: item.creator || "",
      contentSnippet: item.contentSnippet || item.content || "",
      content: item.content || "",
      imageUrl: item.imageUrl || "",
      categories: [],
      videoId: item.videoId || undefined,
      audioUrl: item.audioUrl || undefined
    };
    onArticleClick(mockArticle);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col h-full border-r border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold tracking-tight text-lg">InnovaTech Menu</span>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "User"} 
                        className="w-12 h-12 rounded-full object-cover border border-blue-500/20"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {(user.displayName || user.email || "U").substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{user.displayName || "InnovaTech Fan"}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl text-xs font-semibold transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t("Sign Out") || "Cerrar Sesión"}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col text-center py-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 mx-auto mb-3">
                    <User className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm mb-1">{t("Sign In") || "Iniciar Sesión"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 px-2">
                    Inicia sesión para sincronizar tu historial, publicar comentarios y ver tus respuestas en la nube.
                  </p>
                  <button
                    onClick={onLogin}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all mb-3"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar sesión con Google</span>
                  </button>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium px-2 leading-relaxed">
                    Al iniciar sesión, aceptas nuestra{" "}
                    <button 
                      onClick={onOpenPrivacyPolicy}
                      className="text-blue-500 hover:underline font-bold inline-block"
                    >
                      Política de Privacidad
                    </button>.
                  </p>
                </div>
              )}
            </div>

            {/* App Settings */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Configuración</p>
              
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-950/30">
                <span className="text-sm font-medium">Modo de pantalla</span>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
                >
                  <div className={`p-1 rounded-md transition-colors ${theme === "light" ? "bg-blue-500 text-white" : "text-gray-500"}`}>
                    <Sun className="w-4 h-4" />
                  </div>
                  <div className={`p-1 rounded-md transition-colors ${theme === "dark" ? "bg-blue-500 text-white" : "text-gray-500"}`}>
                    <Moon className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Language Settings */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-950/30">
                <span className="text-sm font-medium">Idioma</span>
                <button
                  onClick={onOpenLangSelector}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-750 hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm transition-all text-xs font-bold"
                  title="Cambiar idioma"
                >
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="uppercase">{lang}</span>
                </button>
              </div>
            </div>

            {/* Legal Section */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-2.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Legal y Transparencia</p>
              
              {/* Contact / Soporte Dedicado */}
              <button
                onClick={onOpenContactPage}
                className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/40 dark:bg-blue-950/10 hover:bg-blue-50/85 dark:hover:bg-blue-950/20 border border-blue-100/30 dark:border-blue-900/20 text-sm font-medium transition-all text-left w-full hover:scale-[1.01] group cursor-pointer"
              >
                <div className="p-2 bg-blue-500 text-white rounded-xl group-hover:scale-110 transition-transform shadow-sm shadow-blue-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Contacto y Soporte</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">smiwceron@gmail.com</span>
                </div>
              </button>

              {/* Acerca de InnovaTech */}
              {onOpenAbout && (
                <button
                  onClick={onOpenAbout}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950/30 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-all text-left w-full hover:scale-[1.01] cursor-pointer"
                >
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>Acerca de InnovaTech</span>
                </button>
              )}

              {/* Privacy Policy */}
              <button
                onClick={onOpenPrivacyPolicy}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950/30 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-all text-left w-full hover:scale-[1.01] cursor-pointer"
              >
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Política de Privacidad y Cookies</span>
              </button>

              {/* Terms and Conditions */}
              {onOpenTerms && (
                <button
                  onClick={onOpenTerms}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950/30 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-all text-left w-full hover:scale-[1.01] cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Términos y Condiciones</span>
                </button>
              )}

              {/* Account Deletion */}
              {user && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/10 hover:bg-red-100/50 dark:hover:bg-red-950/20 text-sm font-medium transition-all text-left w-full text-red-600 dark:text-red-400 hover:scale-[1.01] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Eliminar Cuenta y Datos</span>
                </button>
              )}
            </div>

            {/* Main Tabs Navigation */}
            <div className="grid grid-cols-3 border-b border-gray-100 dark:border-gray-800 text-center text-xs font-semibold bg-gray-50/50 dark:bg-gray-950/10 shrink-0">
              <button
                onClick={() => setActiveTab("history")}
                className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === "history" ? "border-blue-500 text-blue-500 bg-white dark:bg-gray-900" : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Noticias ({readNews.length})</span>
              </button>
              {/* Videos tab temporarily disabled during review:
              <button
                onClick={() => setActiveTab("videos")}
                className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === "videos" ? "border-blue-500 text-blue-500 bg-white dark:bg-gray-900" : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <Play className="w-4 h-4" />
                <span>Videos ({watchedVideos.length})</span>
              </button>
              */}
              <button
                onClick={() => setActiveTab("comments")}
                className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === "comments" ? "border-blue-500 text-blue-500 bg-white dark:bg-gray-900" : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                disabled={!user}
                title={!user ? "Inicia sesión para ver" : ""}
              >
                <MessageSquare className="w-4 h-4" />
                <span className={!user ? "opacity-50" : ""}>Mis Com. ({userComments.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("replies")}
                className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === "replies" ? "border-blue-500 text-blue-500 bg-white dark:bg-gray-900" : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                disabled={!user}
                title={!user ? "Inicia sesión para ver" : ""}
              >
                <CornerDownRight className="w-4 h-4" />
                <span className={!user ? "opacity-50" : ""}>Respuestas ({userReplies.length})</span>
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeTab === "history" && (
                    readNews.length > 0 ? (
                      readNews.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-left border border-gray-100 dark:border-gray-800/60 transition-colors"
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0 flex items-center justify-center text-gray-400">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold line-clamp-2 leading-tight text-gray-900 dark:text-gray-100">{item.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">
                              {item.creator ? `${item.creator} • ` : ""}{new Date(item.viewedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-12 italic">No hay noticias leídas en tu historial.</p>
                    )
                  )}

                  {activeTab === "videos" && (
                    watchedVideos.length > 0 ? (
                      watchedVideos.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-left border border-gray-100 dark:border-gray-800/60 transition-colors"
                        >
                          <div className="relative w-12 h-12 shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                                <Play className="w-5 h-5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold line-clamp-2 leading-tight text-gray-900 dark:text-gray-100">{item.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(item.viewedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-12 italic">No hay videos vistos en tu historial.</p>
                    )
                  )}

                  {activeTab === "comments" && (
                    user ? (
                      userComments.length > 0 ? (
                        userComments.map((comment) => (
                          <button
                            key={comment.id}
                            onClick={() => handleItemClick(comment)}
                            className="flex flex-col gap-1.5 p-3 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-left border border-gray-100 dark:border-gray-800/60 transition-colors"
                          >
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold line-clamp-1">
                              🔗 {comment.articleTitle}
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2 italic">
                              "{comment.content}"
                            </p>
                            <span className="text-[10px] text-gray-400 self-end mt-1">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-12 italic">Aún no has publicado comentarios.</p>
                      )
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-gray-400 mb-2">Inicia sesión para ver tus comentarios.</p>
                      </div>
                    )
                  )}

                  {activeTab === "replies" && (
                    user ? (
                      userReplies.length > 0 ? (
                        userReplies.map((reply) => (
                          <button
                            key={reply.id}
                            onClick={() => handleItemClick(reply)}
                            className="flex flex-col gap-1.5 p-3 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-left border border-gray-100 dark:border-gray-800/60 transition-colors bg-blue-50/20 dark:bg-blue-900/10"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold line-clamp-1 flex-1">
                                🔗 {reply.articleTitle}
                              </span>
                            </div>
                            <div className="pl-2 border-l-2 border-blue-500/50 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-gray-750 dark:text-gray-300">{reply.commentAuthorName}</span> ha respondido:
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-100 font-medium line-clamp-2">
                              "{reply.replyContent}"
                            </p>
                            <span className="text-[10px] text-gray-400 self-end mt-1">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-12 italic">Nadie ha respondido a tus comentarios todavía.</p>
                      )
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-gray-400 mb-2">Inicia sesión para ver las respuestas a tus comentarios.</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Custom Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 z-[111] flex flex-col gap-4 text-gray-900 dark:text-gray-100"
                >
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/20 rounded-xl shrink-0">
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="font-extrabold text-base leading-snug">¿Eliminar cuenta y todos tus datos?</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                      Esta acción es irreversible y cumple plenamente con las políticas de Google Play. Se eliminarán permanentemente de nuestros servidores:
                    </p>
                    <ul className="text-[11px] text-gray-600 dark:text-gray-300 space-y-1 bg-gray-50 dark:bg-gray-950/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 list-disc pl-5 font-bold">
                      <li>Tu cuenta de InnovaTech</li>
                      <li>Historial de lectura y videos</li>
                      <li>Tus comentarios y respuestas</li>
                    </ul>
                  </div>

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 italic font-medium leading-relaxed">
                    Tus datos se borrarán inmediatamente. ¿Estás seguro de que deseas proceder?
                  </p>

                  <div className="flex gap-3 mt-1">
                    <button
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={isDeleting}
                      onClick={async () => {
                        setIsDeleting(true);
                        try {
                          await onDeleteAccountData();
                          setShowDeleteConfirm(false);
                          onClose();
                        } catch (e) {
                          console.error("Failed to delete account data", e);
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-red-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isDeleting ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Confirmar</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
