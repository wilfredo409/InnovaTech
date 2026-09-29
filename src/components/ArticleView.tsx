import React, { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import sanitizeHtml from "sanitize-html";
import { motion } from "motion/react";
import { ArrowLeft, Share2, Bookmark, ExternalLink, Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Trash2, Radio, User, Sparkles } from "lucide-react";
import { Article } from "../types";
import { collection, query, where, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";
import { getApiUrl, cleanArticleTitle } from "../lib/utils";
import { InArticleAd } from "./AdSenseBanner";
import { AD_SLOTS } from "../lib/adConfig";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface PodcastPlayerProps {
  audioUrl: string;
  articleTitle: string;
  articleCreator: string;
  articleId: string;
  currentAudio: { url: string; title: string; creator: string; articleId: string } | null;
  isAudioPlaying: boolean;
  playAudio: (url: string, title: string, creator: string, articleId: string) => void;
  pauseAudio: () => void;
  audioProgress: number;
  audioDuration: number;
  seekAudio: (seconds: number) => void;
  t: (text: string) => string;
}

function PodcastPlayer({ 
  audioUrl, 
  articleTitle, 
  articleCreator, 
  articleId,
  currentAudio,
  isAudioPlaying,
  playAudio,
  pauseAudio,
  audioProgress,
  audioDuration,
  seekAudio,
  t
}: PodcastPlayerProps) {
  const isThisAudioPlaying = currentAudio?.url === audioUrl && isAudioPlaying;
  const isThisAudioLoaded = currentAudio?.url === audioUrl;

  const savedPosStr = localStorage.getItem(`innovatech_audio_pos_${audioUrl}`) || localStorage.getItem(`techsync_audio_pos_${audioUrl}`);
  const initialProgress = savedPosStr ? parseFloat(savedPosStr) : 0;
  
  const displayProgress = isThisAudioLoaded ? audioProgress : initialProgress;
  const displayDuration = isThisAudioLoaded ? audioDuration : 0;

  const handleTogglePlay = () => {
    if (isThisAudioLoaded) {
      if (isAudioPlaying) {
        pauseAudio();
      } else {
        playAudio(audioUrl, articleTitle, articleCreator, articleId);
      }
    } else {
      playAudio(audioUrl, articleTitle, articleCreator, articleId);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isThisAudioLoaded) {
      seekAudio(value);
    } else {
      localStorage.setItem(`innovatech_audio_pos_${audioUrl}`, value.toString());
    }
  };

  const skip = (seconds: number) => {
    if (isThisAudioLoaded) {
      const target = Math.max(0, Math.min(audioProgress + seconds, audioDuration));
      seekAudio(target);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 my-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          🎧 {t('Podcast Episode')}
        </span>
        {isThisAudioLoaded && (
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full animate-pulse">
            {t('Active')}
          </span>
        )}
      </div>

      {/* Progress slider */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono text-slate-500 w-10 text-right">
          {formatTime(displayProgress)}
        </span>
        <input 
          type="range"
          min={0}
          max={displayDuration || 100}
          value={displayProgress}
          onChange={handleSeekChange}
          className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
        />
        <span className="text-xs font-mono text-slate-500 w-10">
          {formatTime(displayDuration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 px-2">
        <button 
          onClick={() => skip(-15)}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Rewind 15 seconds"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button 
          onClick={handleTogglePlay}
          className="w-12 h-12 flex items-center justify-center bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full shadow-md hover:scale-105 transition-all"
        >
          {isThisAudioPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
        </button>

        <button 
          onClick={() => skip(15)}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Forward 15 seconds"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  t: (text: string) => string;
}

function YouTubePlayer({ videoId, title, t }: YouTubePlayerProps) {
  const [savedTime, setSavedTime] = useState(0);

  useEffect(() => {
    const savedPos = localStorage.getItem(`innovatech_video_pos_${videoId}`) || localStorage.getItem(`techsync_video_pos_${videoId}`);
    if (savedPos) {
      setSavedTime(Math.floor(parseFloat(savedPos)));
    }
  }, [videoId]);

  // Generate standard embed URL with start time parameter if available
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1${savedTime > 0 ? `&start=${savedTime}` : ""}`;

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-lg mb-6 border border-slate-200 dark:border-slate-800">
      <div className="aspect-video w-full">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allowFullScreen
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
        <span>📹 {t('Video Player')}</span>
        {savedTime > 0 && (
          <span>
            {t('Last position') || 'Última posición'}: {Math.floor(savedTime / 60)}:
            {String(Math.floor(savedTime % 60)).padStart(2, '0')}
          </span>
        )}
      </div>
    </div>
  );
}

interface CommentsSectionProps {
  articleId: string;
  articleTitle: string;
  articleImageUrl: string;
  user: FirebaseUser | null;
  onLogin: () => void;
  t: (text: string) => string;
}

interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userEmail: string;
  userName: string;
  content: string;
  createdAt: number;
  parentId?: string;
  parentAuthorId?: string;
  replyToName?: string;
  articleTitle?: string;
  articleImageUrl?: string;
}

function CommentsSection({ articleId, articleTitle, articleImageUrl, user, onLogin, t }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // States for replying to other comments
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    if (!articleId) return;

    const q = query(
      collection(db, "comments"),
      where("articleId", "==", articleId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          articleId: data.articleId,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName || data.userEmail?.split("@")[0] || "User",
          content: data.content,
          createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (data.createdAt || Date.now()),
          parentId: data.parentId || undefined,
          parentAuthorId: data.parentAuthorId || undefined,
          replyToName: data.replyToName || undefined,
          articleTitle: data.articleTitle || undefined,
          articleImageUrl: data.articleImageUrl || undefined,
        });
      });

      // Sort by date desc globally (root comments and replies together first, we then thread them)
      list.sort((a, b) => b.createdAt - a.createdAt);
      setComments(list);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, "comments");
    });

    return () => unsubscribe();
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "comments"), {
        articleId,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email?.split("@")[0] || "User",
        content: newComment.trim(),
        createdAt: new Date(),
        articleTitle: articleTitle || "Article",
        articleImageUrl: articleImageUrl || ""
      });
      setNewComment("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "comments");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentComment: Comment) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    setReplySubmitting(true);
    try {
      await addDoc(collection(db, "comments"), {
        articleId,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email?.split("@")[0] || "User",
        content: replyContent.trim(),
        createdAt: new Date(),
        parentId: parentComment.id,
        parentAuthorId: parentComment.userId,
        replyToName: parentComment.userName,
        articleTitle: articleTitle || "Article",
        articleImageUrl: articleImageUrl || ""
      });
      setReplyContent("");
      setReplyingToId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "comments");
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, "comments", commentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  // Build the threaded comments view
  const rootComments = comments.filter(c => !c.parentId);
  const repliesByParentId = comments.reduce((acc, comment) => {
    if (comment.parentId) {
      if (!acc[comment.parentId]) {
        acc[comment.parentId] = [];
      }
      acc[comment.parentId].push(comment);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  // Sort replies under each parent in chronological order
  Object.keys(repliesByParentId).forEach(parentId => {
    repliesByParentId[parentId].sort((a, b) => a.createdAt - b.createdAt);
  });

  return (
    <div className="mt-12 border-t border-gray-100 dark:border-gray-800 pt-8">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span>💬 {t('Comments')}</span>
        <span className="text-sm px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full font-semibold">
          {comments.length}
        </span>
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('Write a comment...')}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
            maxLength={500}
            required
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : t('Post Comment')}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-800/60 mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('Sign in to leave a comment')}</p>
          <button
            onClick={onLogin}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors"
          >
            {t('Sign In')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : rootComments.length > 0 ? (
        <div className="flex flex-col gap-6">
          {rootComments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-3">
              {/* Root Comment Card */}
              <div 
                className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-gray-100/60 dark:border-gray-800/40 relative group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{comment.userName}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && (
                      <button
                        onClick={() => {
                          setReplyingToId(replyingToId === comment.id ? null : comment.id);
                          setReplyContent("");
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors p-1"
                      >
                        {replyingToId === comment.id ? 'Cancelar' : 'Responder'}
                      </button>
                    )}
                    {user && user.uid === comment.userId && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>

              {/* Inline Reply Input */}
              {replyingToId === comment.id && user && (
                <form 
                  onSubmit={(e) => handleReplySubmit(e, comment)} 
                  className="ml-6 sm:ml-10 p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-850 rounded-xl flex flex-col gap-2 transition-all"
                >
                  <span className="text-xs text-gray-400 font-medium">Respondiendo a <span className="font-bold">{comment.userName}</span></span>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                    maxLength={300}
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1 bg-gray-150 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={replySubmitting || !replyContent.trim()}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {replySubmitting ? '...' : 'Publicar'}
                    </button>
                  </div>
                </form>
              )}

              {/* Replies Thread */}
              {repliesByParentId[comment.id] && repliesByParentId[comment.id].length > 0 && (
                <div className="ml-6 sm:ml-10 flex flex-col gap-3 pl-4 border-l-2 border-gray-100 dark:border-gray-800/80">
                  {repliesByParentId[comment.id].map((reply) => (
                    <div 
                      key={reply.id}
                      className="p-3 bg-gray-50/50 dark:bg-gray-900/10 rounded-xl border border-gray-100/40 dark:border-gray-850/30 relative group"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{reply.userName}</span>
                          <span className="text-[10px] text-gray-400">
                            {format(new Date(reply.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        {user && user.uid === reply.userId && (
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
                            title="Delete Reply"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500 italic">
          {t('Be the first to comment!')}
        </p>
      )}
    </div>
  );
}

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  lang: string;
  t: (text: string) => string;
  user: FirebaseUser | null;
  onLogin: () => void;
  currentAudio: { url: string; title: string; creator: string; articleId: string } | null;
  isAudioPlaying: boolean;
  playAudio: (url: string, title: string, creator: string, articleId: string) => void;
  pauseAudio: () => void;
  audioProgress: number;
  audioDuration: number;
  seekAudio: (seconds: number) => void;
}

export function ArticleView({ 
  article, 
  onBack, 
  lang, 
  t,
  user,
  onLogin,
  currentAudio,
  isAudioPlaying,
  playAudio,
  pauseAudio,
  audioProgress,
  audioDuration,
  seekAudio
}: ArticleViewProps) {
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [enrichedContent, setEnrichedContent] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentFailed, setEnrichmentFailed] = useState(false);

  const [isReading, setIsReading] = useState(false);
  const [isReadingPaused, setIsReadingPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  const isUserPausingRef = useRef(false);
  const currentSentenceIndexRef = useRef(0);
  const sentencesRef = useRef<string[]>([]);
  const selectedVoiceURIRef = useRef("");
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  currentSentenceIndexRef.current = currentSentenceIndex;
  sentencesRef.current = sentences;
  selectedVoiceURIRef.current = selectedVoiceURI;

  useEffect(() => {
    setSelectedVoiceURI("");
  }, [lang]);

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const targetLang = lang || 'es';
        const langPrefix = targetLang.toLowerCase().substring(0, 2);
        
        let matched = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
        if (matched.length === 0) {
          matched = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
        }

        // Filter out Spanish (US) voices as requested, since they fail on some Android/Chrome platforms
        if (langPrefix === 'es') {
          matched = matched.filter(v => !v.lang.toLowerCase().includes('es-us') && !v.lang.toLowerCase().includes('es_us'));
        }

        if (matched.length === 0) {
          matched = voices;
        }

        const sortedVoices = [...matched];

        setAvailableVoices(sortedVoices);

        if (sortedVoices.length > 0) {
          let defaultVoice: SpeechSynthesisVoice | undefined;
          if (langPrefix === 'es') {
            defaultVoice = sortedVoices.find(v => {
              const name = v.name.toLowerCase();
              return (
                name.includes('sabina') || 
                name.includes('paulina') || 
                name.includes('helena') || 
                name.includes('daria') || 
                name.includes('laura') || 
                name.includes('zira') || 
                name.includes('google') ||
                name.includes('female') ||
                name.includes('mujer')
              );
            });
            if (!defaultVoice) {
              defaultVoice = sortedVoices[0];
            }
          }
          if (!defaultVoice) {
            defaultVoice = sortedVoices[0];
          }
          if (defaultVoice) {
            const voiceVal = defaultVoice.voiceURI || defaultVoice.name;
            setSelectedVoiceURI(prev => prev || voiceVal);
            selectedVoiceURIRef.current = voiceVal;
          }
        }
      }
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      updateVoices();
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      }
    };
  }, [lang]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [article]);

  const plainTextLength = article.content ? article.content.replace(/<[^>]*>/g, '').trim().length : 0;
  const rawHtml = translatedContent || (article.content && plainTextLength > 100 ? article.content : article.contentSnippet) || '';

  // Clean up the HTML content, ensuring it's safe to render and stripped of bad styles
  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'iframe', 'figure', 'figcaption' ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height', 'loading', 'class'],
      figure: ['class'],
      figcaption: ['class'],
      iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder', 'allow']
    },
    transformTags: {
      'img': sanitizeHtml.simpleTransform('img', { class: 'w-full rounded-2xl my-6 object-cover max-h-[500px] shadow-md' }),
      'figure': sanitizeHtml.simpleTransform('figure', { class: 'my-8' }),
      'figcaption': sanitizeHtml.simpleTransform('figcaption', { class: 'text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic' }),
      'p': sanitizeHtml.simpleTransform('p', { class: 'mb-7 text-lg leading-relaxed text-gray-800 dark:text-gray-200' }),
      'h1': sanitizeHtml.simpleTransform('h1', { class: 'text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white' }),
      'h2': sanitizeHtml.simpleTransform('h2', { class: 'text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white' }),
      'h3': sanitizeHtml.simpleTransform('h3', { class: 'text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white' }),
      'a': sanitizeHtml.simpleTransform('a', { class: 'text-blue-600 dark:text-blue-400 hover:underline' }),
      'li': sanitizeHtml.simpleTransform('li', { class: 'mb-2 text-gray-800 dark:text-gray-200' })
    }
  });

  // Split HTML after the first paragraph to place the in-article advertisement between paragraph 1 and paragraph 2
  const { firstParagraphHtml, remainingParagraphsHtml } = useMemo(() => {
    if (!cleanHtml) return { firstParagraphHtml: '', remainingParagraphsHtml: '' };
    const closingPTag = '</p>';
    const firstPIndex = cleanHtml.toLowerCase().indexOf(closingPTag);
    if (firstPIndex !== -1) {
      const splitIdx = firstPIndex + closingPTag.length;
      return {
        firstParagraphHtml: cleanHtml.substring(0, splitIdx),
        remainingParagraphsHtml: cleanHtml.substring(splitIdx).trim()
      };
    }
    return { firstParagraphHtml: cleanHtml, remainingParagraphsHtml: '' };
  }, [cleanHtml]);

  // Ensure strict compliance with Google AdSense policy: never show ads on low-value / non-content / video screens
  const hasSufficientContentForAd = useMemo(() => {
    if (article.videoId) return false; // Never place ads on video player screens
    if (translating || enriching) return false; // Never place ads while loading
    if (!remainingParagraphsHtml || remainingParagraphsHtml.trim().length < 80) return false;
    const totalLength = (firstParagraphHtml + remainingParagraphsHtml).replace(/<[^>]*>/g, '').trim().length;
    return totalLength >= 250; // High substantive text threshold
  }, [article.videoId, translating, enriching, firstParagraphHtml, remainingParagraphsHtml]);

  const speakSentence = (index: number, shouldCancel = false, isFallback = false) => {
    // Check if running inside Android WebView with Native JS Interface (e.g. AndroidBridge.speak)
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const androidBridge = win.AndroidInterface || win.AndroidTTS || win.Android;

    if (androidBridge && typeof androidBridge.speak === 'function') {
      const arr = sentencesRef.current;
      if (index >= arr.length) {
        setIsReading(false);
        setIsReadingPaused(false);
        setCurrentSentenceIndex(0);
        return;
      }
      isUserPausingRef.current = false;
      androidBridge.speak(arr[index], lang || 'es');
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const arr = sentencesRef.current;
    if (index >= arr.length) {
      setIsReading(false);
      setIsReadingPaused(false);
      setCurrentSentenceIndex(0);
      activeUtteranceRef.current = null;
      return;
    }

    isUserPausingRef.current = false;

    if (shouldCancel) {
      window.speechSynthesis.cancel();
    }

    const textToSpeak = arr[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    activeUtteranceRef.current = utterance;

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const voices = window.speechSynthesis.getVoices() || [];
    const targetVal = selectedVoiceURIRef.current;

    let voice: SpeechSynthesisVoice | null = null;
    if (!isFallback && targetVal) {
      voice = voices.find(v => v.voiceURI === targetVal || v.name === targetVal) || null;
    }

    if (!voice && !isFallback) {
      voice = voices.find(v => v.lang.toLowerCase().startsWith('es') && !v.lang.toLowerCase().includes('es-us') && !v.lang.toLowerCase().includes('es_us')) 
        || voices.find(v => v.lang.toLowerCase().startsWith('es')) 
        || null;
    }

    if (voice && !isFallback) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      // Default system voice for Spanish
      utterance.lang = lang ? `${lang.toLowerCase()}-${lang.toUpperCase()}` : 'es-ES';
    }
    utterance.rate = 0.95;

    utterance.onend = () => {
      activeUtteranceRef.current = null;
      if (isUserPausingRef.current) return;
      const nextIndex = index + 1;
      setCurrentSentenceIndex(nextIndex);
      speakSentence(nextIndex, false, false);
    };

    utterance.onerror = (e) => {
      activeUtteranceRef.current = null;
      if (isUserPausingRef.current || e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn("SpeechSynthesis warning with selected voice:", e.error, e);

      // If custom voice failed (e.g. network/voice error on Google ES-US voice), retry with system default voice
      if (!isFallback) {
        console.log("Retrying speech with default system voice...");
        speakSentence(index, true, true);
        return;
      }

      // If even default voice fails, try moving to the next sentence
      const nextIndex = index + 1;
      if (nextIndex < arr.length) {
        setCurrentSentenceIndex(nextIndex);
        speakSentence(nextIndex, false, false);
      } else {
        setIsReading(false);
        setIsReadingPaused(false);
      }
    };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Error invoking speechSynthesis:", err);
      if (!isFallback) {
        speakSentence(index, true, true);
      }
    }
  };

  const startReading = () => {
    if (isReadingPaused) {
      setIsReading(true);
      setIsReadingPaused(false);
      speakSentence(currentSentenceIndex, true);
      return;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = cleanHtml || rawHtml || article.title;
    const textToRead = `${article.title}. ${tempDiv.textContent || tempDiv.innerText || ''}`;
    const parsed = textToRead
      .split(/[.!?\n\r。！？]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (parsed.length === 0) return;

    setSentences(parsed);
    sentencesRef.current = parsed;
    setCurrentSentenceIndex(0);
    currentSentenceIndexRef.current = 0;

    setIsReading(true);
    setIsReadingPaused(false);
    speakSentence(0, true);
  };

  const pauseReading = () => {
    isUserPausingRef.current = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReading(false);
    setIsReadingPaused(true);
  };

  const stopReading = () => {
    isUserPausingRef.current = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReading(false);
    setIsReadingPaused(false);
    setCurrentSentenceIndex(0);
  };

  useEffect(() => {
    setEnrichedContent(null);
    setTranslatedContent(null);
    setEnrichmentFailed(false);
    
    const plainTextLength = article.content ? article.content.replace(/<[^>]*>/g, '').trim().length : 0;
    const needsEnrichment = !article.videoId && !article.audioUrl && (plainTextLength < 350);
    
    async function translateContent(textToTranslate: string, isOriginalHtml: boolean) {
      setTranslating(true);
      try {
        const res = await fetch(getApiUrl('/api/translate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToTranslate,
            lang: lang,
            isHtml: isOriginalHtml
          })
        });
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        const data = await res.json();
        setTranslatedContent(data.translatedText || textToTranslate);
      } catch (err) {
        console.error("Failed to translate article", err);
        setTranslatedContent(textToTranslate);
      } finally {
        setTranslating(false);
      }
    }

    async function processArticle() {
      let contentToUse = (article.content && plainTextLength > 100) ? article.content : (article.contentSnippet || "");
      
      if (needsEnrichment) {
        setEnriching(true);
        try {
          const enrichRes = await fetch(getApiUrl('/api/enrich-article'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: article.id,
              title: article.title,
              creator: article.creator,
              contentSnippet: article.contentSnippet,
              topic: article.categories?.[0] || 'ai',
              lang: lang
            })
          });
          
          if (!enrichRes.ok) throw new Error("Enrichment failed");
          const enrichData = await enrichRes.json();
          const fullyEnrichedHtml = enrichData.enrichedContent;
          setEnrichedContent(fullyEnrichedHtml);
          contentToUse = fullyEnrichedHtml;
          
          // Since the generated content is already in the target language (lang), we don't need translation!
          setTranslatedContent(fullyEnrichedHtml);
          setTranslating(false);
          setEnriching(false);
          return;
        } catch (err) {
          console.error("Failed to enrich article, using snippet fallback:", err);
          setEnrichmentFailed(true);
          setEnrichedContent(contentToUse);
          setEnriching(false);
        }
      }
      
      const needsTranslation = lang !== "en" && (article.contentLang ? article.contentLang !== lang : article.lang !== lang);
      if (needsTranslation) {
        translateContent(contentToUse, contentToUse === article.content);
      } else {
        setTranslatedContent(contentToUse);
        setTranslating(false);
      }
    }

    processArticle();
  }, [article, lang]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-white dark:bg-gray-950 overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto min-h-screen flex flex-col pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Hero Image */}
        {article.imageUrl && !article.videoId && (
          <div className="w-full h-[40vh] sm:h-[50vh] relative overflow-hidden">
            <img 
              src={article.imageUrl} 
              alt={cleanArticleTitle(article.title)}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallback = `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&sig=${encodeURIComponent(article.id || article.title)}`;
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Content */}
        <article className="px-5 sm:px-8 pt-8 flex-1">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white leading-tight">
              {cleanArticleTitle(article.title)}
            </h1>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-3">
              {article.creator && <span className="font-medium text-gray-900 dark:text-gray-300">{article.creator}</span>}
              {article.creator && <span>•</span>}
              <time dateTime={article.pubDate}>
                {article.pubDate ? format(new Date(article.pubDate), "MMM d, yyyy") : "Recent"}
              </time>
            </div>
          </div>

          {article.videoId && (
            <YouTubePlayer videoId={article.videoId} title={article.title} t={t} />
          )}

          {article.audioUrl && (
            <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/10 dark:from-gray-900/60 dark:to-gray-900/20 border border-gray-200/60 dark:border-gray-800/80 rounded-2xl shadow-sm flex gap-4 items-center">
              {article.podcastImage ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow bg-white dark:bg-gray-800 shrink-0">
                  <img 
                    src={article.podcastImage} 
                    alt={article.podcastTitle || 'Podcast'} 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes("images.unsplash.com")) {
                        target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80";
                      }
                    }}
                    className="w-full h-full object-cover" 
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow">
                  <Radio className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 mb-1.5">
                  🎙️ {t('Podcast Series') || 'Serie de Podcast'}
                </span>
                
                {article.podcastTitle && (
                  <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-0.5 leading-snug">
                    {article.podcastTitle}
                  </h3>
                )}
                
                {article.podcastCreator && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {t('Author') || 'Autor'}: <span className="font-bold text-gray-800 dark:text-gray-200">{article.podcastCreator}</span>
                  </p>
                )}
                
                {(article.episodeNumber || article.seasonNumber) && (
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                    {article.episodeNumber && (
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {t('Episode') || 'Episodio'} {article.episodeNumber}
                      </span>
                    )}
                    {article.episodeNumber && article.seasonNumber && <span className="mx-1.5">•</span>}
                    {article.seasonNumber && (
                      <span>{t('Season') || 'Temporada'} {article.seasonNumber}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {article.audioUrl && (
            <PodcastPlayer 
              audioUrl={article.audioUrl} 
              articleTitle={article.title} 
              articleCreator={article.creator || ''} 
              articleId={article.id}
              currentAudio={currentAudio}
              isAudioPlaying={isAudioPlaying}
              playAudio={playAudio}
              pauseAudio={pauseAudio}
              audioProgress={audioProgress}
              audioDuration={audioDuration}
              seekAudio={seekAudio}
              t={t}
            />
          )}

          {!article.videoId && !article.audioUrl && (
            <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-emerald-50/40 to-teal-50/10 dark:from-emerald-950/15 dark:to-teal-950/5 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <Volume2 className={`w-6 h-6 ${isReading ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-1">
                    ✨ {t('Text-to-Speech') || 'Texto a Voz'}
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">
                    {t('Listen to Article') || 'Escuchar Artículo'}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3.5 self-stretch sm:self-auto justify-between sm:justify-start">
                {availableVoices.length > 0 && (
                  <div className="flex flex-col gap-0.5 min-w-[140px] max-w-[200px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      📢 {t('Voice') || 'Voz'}
                    </span>
                    <select
                      value={selectedVoiceURI}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedVoiceURI(val);
                        if (isReading) {
                          selectedVoiceURIRef.current = val;
                          speakSentence(currentSentenceIndexRef.current, true);
                        }
                      }}
                      className="text-xs font-semibold bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/60 rounded-xl px-2.5 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer shadow-sm transition-all"
                    >
                      {availableVoices.map((v) => {
                        const valKey = v.voiceURI || v.name;
                        let displayName = v.name;
                        displayName = displayName
                          .replace('Microsoft', '')
                          .replace('Google', '')
                          .replace('Desktop', '')
                          .replace('Natural', '✨')
                          .trim();
                        return (
                          <option key={valKey} value={valKey}>
                            {displayName} ({v.lang})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  {isReading ? (
                    <button
                      onClick={pauseReading}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl font-medium text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                      {t('Pause Reading') || 'Pausar Lectura'}
                    </button>
                  ) : (
                    <button
                      onClick={startReading}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl font-medium text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      {isReadingPaused ? (t('Resume Reading') || 'Reanudar Lectura') : (t('Listen to Article') || 'Escuchar Artículo')}
                    </button>
                  )}

                  {(isReading || isReadingPaused) && (
                    <button
                      onClick={stopReading}
                      className="p-2 bg-white/90 dark:bg-gray-800/95 hover:bg-gray-150 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-sm transition-colors"
                      title={t('Stop Reading') || 'Detener Lectura'}
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {enrichmentFailed && (
            <div className="mb-6 p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex gap-3 items-start">
              <span className="text-lg">💡</span>
              <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <span className="font-bold">{t('Draft Preview') || 'Vista previa'}:</span> {t('Showing news summary. The AI-enrichment quota limit has been reached.') || 'Mostrando el resumen original de la noticia. Se ha alcanzado el límite de cuota de enriquecimiento por Inteligencia Artificial.'}
              </div>
            </div>
          )}

          {/* Render HTML content safely with In-Article Ad placed between paragraph 1 and paragraph 2 */}
          {(translating || enriching) ? (
            <div className="animate-pulse flex flex-col gap-4 my-8">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-11/12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-10/12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-9/12 mt-4"></div>
            </div>
          ) : (
            <div className="article-body">
              {/* Primer Párrafo */}
              <div 
                className="article-content max-w-none font-serif text-lg text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: firstParagraphHtml }}
              />

              {/* Publicidad Integrada entre el Primer y Segundo Párrafo (Solo con contenido editorial sustancial a ambos lados) */}
              {hasSufficientContentForAd && (
                <div className="my-8">
                  <InArticleAd slot={AD_SLOTS.inArticle} hasSufficientContent={hasSufficientContentForAd} />
                </div>
              )}

              {/* Párrafos Restantes y Subtítulos */}
              {remainingParagraphsHtml && (
                <div 
                  className="article-content max-w-none font-serif text-lg text-gray-800 dark:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: remainingParagraphsHtml }}
                />
              )}
            </div>
          )}
          
          <CommentsSection 
            articleId={article.id} 
            articleTitle={article.title}
            articleImageUrl={article.imageUrl || ""}
            user={user} 
            onLogin={onLogin} 
            t={t} 
          />
        </article>
      </div>
    </motion.div>
  );
}
