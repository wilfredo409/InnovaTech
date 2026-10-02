import fs from 'fs';
import path from 'path';
import { StoredArticle } from './articleManager';

export interface FacebookPublishResult {
  success: boolean;
  postId?: string;
  photoId?: string;
  hasComment?: boolean;
  type?: 'photo' | 'feed';
  error?: string;
}

export interface PublishHistoryItem {
  articleId: string;
  postId: string;
  title: string;
  publishedAt: string;
  type?: string;
}

// In-memory overrides if provided at runtime
let runtimePageId: string | null = null;
let runtimePageToken: string | null = null;

// Scheduler state
let schedulerTimer: NodeJS.Timeout | null = null;
let schedulerIntervalMs: number = 30 * 60 * 1000; // 30 minutes
let lastPublishTimestamp: number | null = null;
let nextScheduledTimestamp: number | null = null;
let getArticlesProvider: (() => StoredArticle[]) | null = null;

const HISTORY_FILE_PATH = path.join(process.cwd(), 'data', 'facebook_published_history.json');

/**
 * Loads published history from disk
 */
export function loadPublishHistory(): PublishHistoryItem[] {
  try {
    if (fs.existsSync(HISTORY_FILE_PATH)) {
      const data = fs.readFileSync(HISTORY_FILE_PATH, 'utf-8');
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.error('[Facebook Publisher] Error cargando historial de publicaciones:', err);
  }
  return [];
}

/**
 * Records an article as published
 */
export function recordPublishedArticle(item: PublishHistoryItem) {
  try {
    const history = loadPublishHistory();
    // Prepend new item
    history.unshift(item);
    // Keep max 500 items
    const trimmed = history.slice(0, 500);
    const dir = path.dirname(HISTORY_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Facebook Publisher] Error guardando historial de publicación:', err);
  }
}

/**
 * Clears the publication history so that all articles can be republished
 */
export function clearPublishHistory(): void {
  try {
    const dir = path.dirname(HISTORY_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    console.log('[Facebook Publisher] Historial de publicaciones reiniciado a vacío.');
  } catch (err) {
    console.error('[Facebook Publisher] Error reiniciando historial:', err);
  }
}

/**
 * Formats a rich, informative, engaging Facebook editorial post with multiple paragraphs,
 * technical context, author attribution, and direct links.
 */
export function formatRichFacebookPost(article: StoredArticle, articleUrl: string): string {
  const cleanTitle = (article.title || '').replace(/<\/?[^>]+(>|$)/g, '').trim();
  
  // Extract paragraphs by converting HTML blocks to double newlines and cleaning entities
  const rawText = (article.content || article.contentSnippet || '')
    .replace(/<\/?(?:h[1-6]|p|div|li)[^>]*>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  const paragraphs = rawText
    .split('\n\n')
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 60 && !p.toLowerCase().startsWith('estructura y entorno') && !p.toLowerCase().startsWith('fuente:'));

  let bodyExcerpt = '';
  if (paragraphs.length >= 2) {
    bodyExcerpt = paragraphs.slice(0, 2).join('\n\n');
  } else if (paragraphs.length === 1) {
    bodyExcerpt = paragraphs[0];
  } else {
    bodyExcerpt = (article.contentSnippet || '').replace(/<[^>]*>/g, '').trim();
  }

  // If still short, try including up to 3 paragraphs
  if (bodyExcerpt.length < 250 && paragraphs.length > 2) {
    bodyExcerpt = paragraphs.slice(0, 3).join('\n\n');
  }

  // Trim to max 1200 characters for high-density rich editorial reading on Facebook
  if (bodyExcerpt.length > 1200) {
    bodyExcerpt = bodyExcerpt.slice(0, 1190).trim() + '...';
  }

  const topicTags: Record<string, string> = {
    ai: '#InteligenciaArtificial #IA #Innovacion #InnovaTech #TechNews',
    ia: '#InteligenciaArtificial #IA #Innovacion #InnovaTech #TechNews',
    hardware: '#Hardware #Semiconductores #Chips #InnovaTech #Tech',
    software: '#Software #Desarrollo #Programacion #InnovaTech #Tech',
    gadgets: '#Gadgets #Smartphones #Tecnologia #InnovaTech #Review',
    cybersecurity: '#Ciberseguridad #Privacidad #SeguridadInformatica #InnovaTech',
    ciberseguridad: '#Ciberseguridad #Privacidad #SeguridadInformatica #InnovaTech',
    latest: '#Tecnologia #Innovacion #NoticiasTech #InnovaTech'
  };

  const tags = topicTags[(article.topic || 'latest').toLowerCase()] || '#Tecnologia #InnovaTech';
  const author = article.creator || 'Redacción InnovaTech';
  const category = (article.categories && article.categories[0]) || 'Tecnología';

  return [
    `⚡ ${cleanTitle}`,
    `\n📂 ${category.toUpperCase()} | Por ${author}`,
    `\n${bodyExcerpt}`,
    `\n🔍 Análisis y Ficha Técnica:`,
    `Descubre todos los benchmarks, especificaciones completas y repercusiones en la industria.`,
    `\n📖 Lee el artículo completo en nuestro sitio web:`,
    `${articleUrl}`,
    `\n👇 (Enlace directo también disponible en el primer comentario)`,
    `\n${tags}`
  ].join('\n');
}

/**
 * Finds the next article that has not yet been published to Facebook,
 * verifying that it has an accessible image and substantive content.
 */
export async function getNextUnpublishedArticle(articles: StoredArticle[]): Promise<StoredArticle | null> {
  if (!articles || !articles.length) return null;
  const history = loadPublishHistory();
  const publishedIds = new Set(history.map(h => h.articleId));

  // Find candidate articles not in publishedIds with accessible images
  for (const article of articles) {
    if (!publishedIds.has(article.id) && article.title && article.id) {
      // Prioritize articles with verified valid images
      if (article.imageUrl && article.imageUrl.startsWith('http')) {
        const hasImg = await isAccessibleImageUrl(article.imageUrl);
        if (hasImg) {
          return article;
        }
      }
    }
  }

  // Second pass: any unpublished article even if image needs fallback
  for (const article of articles) {
    if (!publishedIds.has(article.id) && article.title && article.id) {
      return article;
    }
  }

  // If all have been published, pick the oldest published one to cycle
  return articles[0] || null;
}

export function setRuntimeFacebookCredentials(pageId: string, pageToken: string) {
  runtimePageId = pageId.trim();
  runtimePageToken = pageToken.trim();
}

export function getActiveFacebookCredentials() {
  const pageId = runtimePageId || process.env.FACEBOOK_PAGE_ID?.trim() || "";
  const pageToken = runtimePageToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() || "";
  return { pageId, pageToken };
}

/**
 * Verifies if an image URL is accessible and returns an image content-type
 */
async function isAccessibleImageUrl(url?: string): Promise<boolean> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Publishes a tech article to Facebook:
 * 1. Posts with image as a Photo post via Graph API /{page-id}/photos
 * 2. Immediately adds the first comment with the link to the news article on our website
 * 3. Gracefully fallbacks to updating post text or feed post if required
 */
export async function publishArticleToFacebook(article: StoredArticle): Promise<FacebookPublishResult> {
  const { pageId, pageToken } = getActiveFacebookCredentials();

  if (!pageId || !pageToken) {
    return {
      success: false,
      error: 'Credenciales de Facebook no configuradas (FACEBOOK_PAGE_ID o FACEBOOK_PAGE_ACCESS_TOKEN ausentes en las variables de entorno)'
    };
  }

  try {
    const articleUrl = `https://innovatech.fun/articulo/${encodeURIComponent(article.id)}`;
    
    // Generate comprehensive editorial post with detailed context, technical takeaways, and links
    const richPostMessage = formatRichFacebookPost(article, articleUrl);

    // 1. Publish as a REAL publication on the Page's timeline feed (/feed) with article link and rich message
    const feedEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/feed`;

    let createdPostId: string | null = null;
    let createdPhotoId: string | null = null;
    let postType: 'feed' | 'photo' = 'feed';

    const feedRes = await fetch(feedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: richPostMessage,
        link: articleUrl,
        published: true,
        access_token: pageToken
      })
    });

    const feedData: any = await feedRes.json();
    if (feedRes.ok && feedData && feedData.id) {
      createdPostId = feedData.id;
      postType = 'feed';
      console.log(`[Facebook Publisher] ¡Publicación creada con éxito en el muro/feed (PÚBLICA)! Post ID: ${createdPostId}`);
    } else {
      console.warn(`[Facebook Publisher] Publicación directa en feed no completada (${feedData?.error?.message}). Intentando fallback con foto pública...`);

      // Fallback: If feed link publishing fails, try posting with photo
      const hasValidImage = await isAccessibleImageUrl(article.imageUrl);
      if (hasValidImage && article.imageUrl) {
        const photoParams = new URLSearchParams();
        photoParams.set('url', article.imageUrl);
        photoParams.set('caption', richPostMessage);
        photoParams.set('published', 'true');
        photoParams.set('access_token', pageToken);

        const photoRes = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/photos`, {
          method: 'POST',
          body: photoParams
        });

        const photoData: any = await photoRes.json();
        if (photoRes.ok && photoData && (photoData.post_id || photoData.id)) {
          createdPhotoId = photoData.id;
          createdPostId = photoData.post_id || photoData.id;
          postType = 'photo';
          console.log(`[Facebook Publisher] Fallback con foto completado: Post ID: ${createdPostId}`);
        }
      }

      if (!createdPostId) {
        const errorMsg = feedData?.error?.message || `HTTP ${feedRes.status}`;
        console.error(`[Facebook Publisher] Error publicando:`, errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    }

    // 2. Add first comment with the link to the website article
    let hasComment = false;
    const targetCommentId = createdPostId;
    const commentMessage = `🔗 Lee el artículo completo y las especificaciones técnicas en InnovaTech:\n${articleUrl}`;

    try {
      const commentParams = new URLSearchParams();
      commentParams.set('message', commentMessage);
      commentParams.set('access_token', pageToken);

      const commentRes = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(targetCommentId)}/comments`, {
        method: 'POST',
        body: commentParams
      });

      const commentData: any = await commentRes.json();
      if (commentRes.ok && commentData && commentData.id) {
        hasComment = true;
        console.log(`[Facebook Publisher] ¡Primer comentario agregado exitosamente! ID comentario: ${commentData.id}`);
      } else {
        console.warn(`[Facebook Publisher] Comentario no pudo publicarse (${commentData?.error?.message}). Actualizando pie del post con link de respaldo.`);
        
        // Fallback: If pages_manage_engagement is not granted, ensure post caption has full rich content and link
        const fullCaption = richPostMessage;
        await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(targetCommentId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fullCaption,
            access_token: pageToken
          })
        });
      }
    } catch (commentErr: any) {
      console.warn(`[Facebook Publisher] Error agregando primer comentario:`, commentErr.message);
    }

    // 3. Record publication in history
    recordPublishedArticle({
      articleId: article.id,
      postId: createdPostId,
      title: article.title,
      publishedAt: new Date().toISOString(),
      type: postType
    });

    lastPublishTimestamp = Date.now();

    return {
      success: true,
      postId: createdPostId,
      photoId: createdPhotoId || undefined,
      hasComment,
      type: postType
    };

  } catch (error: any) {
    console.error(`[Facebook Publisher] Error general en publicación:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validates the Facebook Page Access Token and retrieves page name
 */
export async function verifyFacebookConnection(customPageId?: string, customToken?: string): Promise<{
  valid: boolean;
  pageName?: string;
  pageId?: string;
  category?: string;
  error?: string;
  code?: number;
  diagnostic?: string;
}> {
  const pageId = (customPageId || runtimePageId || process.env.FACEBOOK_PAGE_ID || '').trim();
  const pageToken = (customToken || runtimePageToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim();

  if (!pageId || !pageToken) {
    return {
      valid: false,
      error: 'Variables FACEBOOK_PAGE_ID y/o FACEBOOK_PAGE_ACCESS_TOKEN no definidas en el entorno'
    };
  }

  try {
    const url = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}`);
    url.searchParams.set('fields', 'id,name,category,link');
    url.searchParams.set('access_token', pageToken);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data: any = await response.json();

    if (response.ok && data && data.id) {
      return {
        valid: true,
        pageId: data.id,
        pageName: data.name,
        category: data.category
      };
    } else {
      // If direct page query failed, check if this is a User Token that manages the page and can be exchanged
      try {
        const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${encodeURIComponent(pageToken)}`);
        const accountsData: any = await accountsRes.json();
        if (accountsRes.ok && accountsData?.data && Array.isArray(accountsData.data) && accountsData.data.length > 0) {
          const matchedPage = accountsData.data.find((p: any) => p.id === pageId) || accountsData.data[0];
          if (matchedPage && matchedPage.access_token) {
            console.log(`[Facebook Publisher] Token de usuario canjeado automáticamente por Token de Página permanente: ${matchedPage.name} (${matchedPage.id})`);
            setRuntimeFacebookCredentials(matchedPage.id, matchedPage.access_token);
            return {
              valid: true,
              pageId: matchedPage.id,
              pageName: matchedPage.name,
              category: matchedPage.category || 'Página de Facebook',
              diagnostic: 'Token de usuario canjeado automáticamente por Token de Página permanente.'
            };
          }
        }
      } catch (exchangeErr) {
        // Fallback silently
      }

      const errorMsg = data?.error?.message || `HTTP ${response.status}`;
      const code = data?.error?.code;
      let diagnostic: string | undefined;

      if (errorMsg.includes('could not be decrypted')) {
        diagnostic = 'El token fue rechazado por Meta ("The access token could not be decrypted"). Esto sucede cuando el token se generó con una app distinta, el secreto de la app cambió, o se copió incompleto.';
      } else if (code === 190) {
        diagnostic = 'Token caducado o inválido. Genera un nuevo token de acceso a la página en Graph API Explorer.';
      }

      return {
        valid: false,
        error: errorMsg,
        code,
        diagnostic,
        pageId
      };
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Initializes and starts the automatic 30-minute recurring scheduler
 */
export function startFacebookScheduler(
  articlesProvider: () => StoredArticle[], 
  intervalMinutes: number = 30
) {
  getArticlesProvider = articlesProvider;
  schedulerIntervalMs = intervalMinutes * 60 * 1000;

  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  nextScheduledTimestamp = Date.now() + schedulerIntervalMs;
  console.log(`[Facebook Scheduler] Programador de publicaciones iniciado: cada ${intervalMinutes} minutos.`);

  schedulerTimer = setInterval(async () => {
    try {
      console.log(`[Facebook Scheduler] Ejecutando publicación periódica (intervalo: ${intervalMinutes}m)...`);
      if (!getArticlesProvider) return;
      const articles = getArticlesProvider();
      if (!articles || !articles.length) {
        console.warn(`[Facebook Scheduler] No hay artículos disponibles en el catálogo.`);
        return;
      }

      const nextArticle = await getNextUnpublishedArticle(articles);
      if (!nextArticle) {
        console.log(`[Facebook Scheduler] No hay artículos nuevos pendientes en la cola.`);
        return;
      }

      console.log(`[Facebook Scheduler] Publicando automáticamente: "${nextArticle.title}"...`);
      const result = await publishArticleToFacebook(nextArticle);
      lastPublishTimestamp = Date.now();
      nextScheduledTimestamp = Date.now() + schedulerIntervalMs;
      console.log(`[Facebook Scheduler] Resultado:`, result);
    } catch (err: any) {
      console.error(`[Facebook Scheduler] Error durante publicación automática:`, err.message);
    }
  }, schedulerIntervalMs);
}

/**
 * Stops the recurring scheduler
 */
export function stopFacebookScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    nextScheduledTimestamp = null;
    console.log(`[Facebook Scheduler] Programador de publicaciones detenido.`);
  }
}

/**
 * Returns scheduler status and metrics
 */
export function getFacebookSchedulerStatus(allArticlesCount: number = 0) {
  const history = loadPublishHistory();
  return {
    isActive: Boolean(schedulerTimer),
    intervalMinutes: schedulerIntervalMs / 60000,
    lastPublishDate: lastPublishTimestamp ? new Date(lastPublishTimestamp).toISOString() : (history[0]?.publishedAt || null),
    nextScheduledDate: nextScheduledTimestamp ? new Date(nextScheduledTimestamp).toISOString() : null,
    nextScheduledInMinutes: nextScheduledTimestamp ? Math.max(0, Math.round((nextScheduledTimestamp - Date.now()) / 60000)) : null,
    totalPublishedCount: history.length,
    totalAvailableArticles: allArticlesCount,
    remainingUnpublishedCount: Math.max(0, allArticlesCount - history.length),
    recentHistory: history.slice(0, 5)
  };
}
