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
 * Finds the next article that has not yet been published to Facebook
 */
export function getNextUnpublishedArticle(articles: StoredArticle[]): StoredArticle | null {
  if (!articles || !articles.length) return null;
  const history = loadPublishHistory();
  const publishedIds = new Set(history.map(h => h.articleId));

  // Find first article not in publishedIds
  for (const article of articles) {
    if (!publishedIds.has(article.id)) {
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
    
    // Create clean tags based on article topic
    const topicTags: Record<string, string> = {
      ai: '#InteligenciaArtificial #IA #InnovaTech #TechNews',
      ia: '#InteligenciaArtificial #IA #InnovaTech #TechNews',
      hardware: '#Hardware #Semiconductores #Chips #InnovaTech',
      software: '#Software #Desarrollo #Programacion #InnovaTech',
      gadgets: '#Gadgets #Smartphones #Tecnologia #InnovaTech',
      cybersecurity: '#Ciberseguridad #Privacidad #Seguridad #InnovaTech',
      ciberseguridad: '#Ciberseguridad #Privacidad #Seguridad #InnovaTech',
      latest: '#Tecnologia #Innovacion #InnovaTech #Tech'
    };

    const tags = topicTags[(article.topic || 'latest').toLowerCase()] || '#Tecnologia #InnovaTech';
    const cleanSnippet = (article.contentSnippet || '').replace(/<[^>]*>/g, '').trim().slice(0, 240);
    
    // Caption pointing reader to the first comment for the full link
    const photoCaption = `🚀 ${article.title}\n\n${cleanSnippet ? cleanSnippet + '...\n\n' : ''}👇 Enlace directo al análisis y especificaciones técnicas completas en el primer comentario.\n\n${tags}`;

    // Verify if article image URL is accessible
    const hasValidImage = await isAccessibleImageUrl(article.imageUrl);

    let createdPostId: string | null = null;
    let createdPhotoId: string | null = null;
    let postType: 'photo' | 'feed' = 'feed';

    if (hasValidImage && article.imageUrl) {
      // 1. Post as photo
      const photoParams = new URLSearchParams();
      photoParams.set('url', article.imageUrl);
      photoParams.set('caption', photoCaption);
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
        console.log(`[Facebook Publisher] ¡Foto publicada con éxito! Post ID: ${createdPostId}, Photo ID: ${createdPhotoId}`);
      } else {
        console.warn(`[Facebook Publisher] Fallo al subir foto (${photoData?.error?.message}). Intentando publicación en feed...`);
      }
    }

    // Fallback to feed post if photo upload did not produce a post ID
    if (!createdPostId) {
      const feedMessage = `🚀 ${article.title}\n\n${cleanSnippet ? cleanSnippet + '...\n\n' : ''}👇 Enlace directo al análisis completo en el primer comentario.\n\n${tags}`;
      const feedEndpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/feed`;

      const feedRes = await fetch(feedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: feedMessage,
          link: articleUrl,
          access_token: pageToken
        })
      });

      const feedData: any = await feedRes.json();
      if (feedRes.ok && feedData && feedData.id) {
        createdPostId = feedData.id;
        postType = 'feed';
        console.log(`[Facebook Publisher] Post publicado en feed: ${createdPostId}`);
      } else {
        const errorMsg = feedData?.error?.message || `HTTP ${feedRes.status}`;
        console.error(`[Facebook Publisher] Error publicando en feed:`, errorMsg);
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
        
        // Fallback: If pages_manage_engagement is not granted, update post caption to include the link so users always have it!
        const fullCaption = `🚀 ${article.title}\n\n${cleanSnippet ? cleanSnippet + '...\n\n' : ''}📖 Lee el análisis completo y las especificaciones técnicas en InnovaTech:\n${articleUrl}\n\n${tags}`;
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

      const nextArticle = getNextUnpublishedArticle(articles);
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
