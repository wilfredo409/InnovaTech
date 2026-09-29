import React, { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";
import { Radio, User } from "lucide-react";
import { Article } from "../types";
import { InFeedAd } from "./AdSenseBanner";
import { AD_SLOTS } from "../lib/adConfig";
import { cleanArticleTitle } from "../lib/utils";
import { ensureClientUniqueArticles, getSafeImageFallback } from "../lib/uniqueImages";

interface NewsFeedProps {
  articles: Article[];
  loading: boolean;
  onArticleClick: (article: Article) => void;
  emptyMessage?: string;
  t?: (text: string) => string;
}

export function NewsFeed({ articles, loading, onArticleClick, emptyMessage, t }: NewsFeedProps) {
  // Robust image deduplication: Guarantee that every single rendered card has a distinct, non-repeated image
  const displayArticles = useMemo(() => {
    if (!articles || !articles.length) return [];
    return ensureClientUniqueArticles(articles, 'latest');
  }, [articles]);

  if (loading && (!displayArticles || displayArticles.length === 0)) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="mb-6 break-inside-avoid bg-gray-100 dark:bg-gray-800 rounded-3xl p-5 animate-pulse">
            <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (!displayArticles || !displayArticles.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
        <p>{emptyMessage || 'No se encontraron artículos para este tema en este momento.'}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
        {displayArticles.map((article, index) => {
          return (
            <React.Fragment key={article.id}>
              <motion.article 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
                onClick={() => onArticleClick(article)}
                className="mb-6 break-inside-avoid cursor-pointer group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {article.imageUrl && (
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img 
                      src={article.imageUrl} 
                      alt={cleanArticleTitle(article.title)}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = getSafeImageFallback(article.id || article.title, article.topic || 'latest', index);
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {article.content && article.content.includes('<iframe') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-red-600 border-b-[8px] border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full uppercase tracking-wider">
                      {article.audioUrl ? (t ? t('Podcast') : 'Podcast') : (article.categories?.[0] || 'Tecnología')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {article.pubDate ? formatDistanceToNow(new Date(article.pubDate), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-snug mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cleanArticleTitle(article.title)}
                  </h2>

                  {article.audioUrl && (
                    <div className="mb-4 bg-gray-50 dark:bg-gray-850/60 border border-gray-100 dark:border-gray-800/60 p-3 rounded-2xl">
                      <div className="flex flex-col gap-1.5 text-xs">
                        {article.podcastTitle && (
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{article.podcastTitle}</span>
                          </div>
                        )}
                        {article.podcastCreator && (
                          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Por: <span className="font-medium">{article.podcastCreator}</span></span>
                          </div>
                        )}
                        {article.episodeNumber && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] mt-0.5">
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded font-bold text-[9px] uppercase">
                              Ep. {article.episodeNumber}
                            </span>
                            {article.seasonNumber && <span className="text-slate-400">| S{article.seasonNumber}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {article.contentSnippet && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 font-sans leading-relaxed">
                      {article.contentSnippet}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {!article.audioUrl && article.creator ? (
                      <span className="font-medium truncate max-w-[180px]">{article.creator}</span>
                    ) : (
                      <span className="font-medium text-blue-600 dark:text-blue-400">Leer artículo completo →</span>
                    )}
                    <span className="text-[11px] text-gray-400">InnovaTech</span>
                  </div>
                </div>
              </motion.article>

              {/* Anuncio in-feed nativo colocado estratégicamente tras el 3er artículo para mantener un alto valor editorial */}
              {index === 2 && articles.length >= 5 && (
                <InFeedAd key={`feed-ad-${article.id}`} slot={AD_SLOTS.inFeed} articleCount={articles.length} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
