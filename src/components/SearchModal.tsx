import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Newspaper, Radio, Video, Layers, Sparkles, Loader2 } from 'lucide-react';
import { Article } from '../types';
import { getApiUrl } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ensureClientUniqueArticles, getSafeImageFallback } from '../lib/uniqueImages';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  t: (text: string) => string;
  onArticleClick: (article: Article) => void;
}

const LOCAL_DICT: Record<string, Record<string, string>> = {
  es: {
    'Search InnovaTech...': 'Buscar en InnovaTech...',
    'All': 'Todos',
    'News': 'Noticias',
    'Podcasts': 'Podcasts',
    'Videos': 'Videos',
    'Searching...': 'Buscando en las fuentes...',
    'No results found': 'No se encontraron resultados',
    'Try searching for other tech terms': 'Prueba buscando otros términos tecnológicos como "IA", "iPhone" o "Google"',
    'Popular Topics': 'Temas Populares',
    'Type at least 2 characters to search...': 'Escribe al menos 2 caracteres para comenzar...',
  },
  pt: {
    'Search InnovaTech...': 'Pesquisar no InnovaTech...',
    'All': 'Todos',
    'News': 'Notícias',
    'Podcasts': 'Podcasts',
    'Videos': 'Vídeos',
    'Searching...': 'Pesquisando fontes...',
    'No results found': 'Nenhum resultado encontrado',
    'Try searching for other tech terms': 'Tente pesquisar outros termos como "IA", "iPhone" ou "Google"',
    'Popular Topics': 'Tópicos Populares',
    'Type at least 2 characters to search...': 'Digite pelo menos 2 caracteres para pesquisar...',
  },
  fr: {
    'Search InnovaTech...': 'Rechercher sur InnovaTech...',
    'All': 'Tout',
    'News': 'Actualités',
    'Podcasts': 'Podcasts',
    'Videos': 'Vidéos',
    'Searching...': 'Recherche dans les sources...',
    'No results found': 'Aucun résultat trouvé',
    'Try searching for other tech terms': 'Essayez de rechercher d\'autres termes comme "IA", "iPhone" ou "Google"',
    'Popular Topics': 'Sujets Populaires',
    'Type at least 2 characters to search...': 'Saisissez au moins 2 caractères pour rechercher...',
  },
  de: {
    'Search InnovaTech...': 'Auf InnovaTech suchen...',
    'All': 'Alle',
    'News': 'Nachrichten',
    'Podcasts': 'Podcasts',
    'Videos': 'Videos',
    'Searching...': 'Quellen durchsuchen...',
    'No results found': 'Keine Ergebnisse gefunden',
    'Try searching for other tech terms': 'Suchen Sie nach anderen Begriffen wie "KI", "iPhone" oder "Google"',
    'Popular Topics': 'Beliebte Themen',
    'Type at least 2 characters to search...': 'Geben Sie mindestens 2 Zeichen ein, um zu suchen...',
  }
};

export function SearchModal({ isOpen, onClose, lang, t, onArticleClick }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'news' | 'podcast' | 'video'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const localT = (key: string) => {
    return LOCAL_DICT[lang]?.[key] || t(key) || key;
  };

  const popularTopics = [
    'AI', 'ChatGPT', 'Apple', 'Android', 'Google', 'Hardware', 'Nvidia', 'Xiaomi'
  ];

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setArticles([]);
    }
  }, [isOpen]);

  // Handle Search Fetch with simple debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(getApiUrl(`/api/search?q=${encodeURIComponent(query)}&lang=${lang}`));
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.error('Search request failed', err);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [query, lang]);

  // Client-side filtering of types and guaranteed unique images per card
  const filteredArticles = useMemo(() => {
    const list = articles.filter(art => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'news') return !art.videoId && !art.audioUrl;
      if (activeFilter === 'podcast') return !!art.audioUrl;
      if (activeFilter === 'video') return !!art.videoId;
      return true;
    });

    return ensureClientUniqueArticles(list, 'latest');
  }, [articles, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-gray-950/40 dark:bg-gray-950/70 backdrop-blur-md overflow-hidden pt-10 sm:pt-20">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh] z-10"
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={localT('Search InnovaTech...')}
            className="w-full text-base sm:text-lg bg-transparent border-none outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0"
          >
            {t('Close') || 'Cerrar'}
          </button>
        </div>

        {/* Filters Tabs Bar */}
        {query.trim().length >= 2 && (
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-50 dark:border-gray-850 overflow-x-auto scrollbar-hide shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              {localT('All')}
            </button>
            <button
              onClick={() => setActiveFilter('news')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === 'news' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'}`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              {localT('News')}
            </button>
            <button
              onClick={() => setActiveFilter('podcast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === 'podcast' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'}`}
            >
              <Radio className="w-3.5 h-3.5" />
              {localT('Podcasts')}
            </button>
            <button
              onClick={() => setActiveFilter('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === 'video' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'}`}
            >
              <Video className="w-3.5 h-3.5" />
              {localT('Videos')}
            </button>
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium animate-pulse">{localT('Searching...')}</p>
            </div>
          ) : query.trim().length < 2 ? (
            <div className="py-6">
              <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {localT('Popular Topics')}
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {popularTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setQuery(topic)}
                    className="px-3.5 py-1.5 bg-gray-50 hover:bg-blue-50 dark:bg-gray-850 dark:hover:bg-blue-900/25 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-sm font-medium transition-all"
                  >
                    #{topic}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-8 italic">
                {localT('Type at least 2 characters to search...')}
              </p>
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => {
                    onArticleClick(article);
                    onClose();
                  }}
                  className="group flex gap-4 p-3 rounded-2xl border border-gray-50 hover:border-gray-150 dark:border-transparent dark:hover:bg-gray-850 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                >
                  {article.imageUrl && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const fallback = getSafeImageFallback(article.id || article.title, 'latest');
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded uppercase tracking-wider">
                        {article.categories?.[0] || 'Tech'}
                      </span>
                      {article.pubDate && (
                        <span className="text-[10px] text-gray-400">
                          {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                {localT('No results found')}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm">
                {localT('Try searching for other tech terms')}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
