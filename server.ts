import express from "express";
import path from "path";
import fs from "fs";
import Parser from "rss-parser";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  initArticlesDatabase,
  getAllArticles,
  searchStoredArticles,
  runDailyEditorialIngest,
  getSyncStatus
} from "./server/articleManager";
import { cleanArticleTitle, getUniqueImage, ensureUniqueArticlesImages } from "./server/uniqueImages";

dotenv.config();

const app = express();
const PORT = 3000;
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded']
    ]
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/rdf+xml, application/xml, text/xml, */*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache'
  }
});

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Custom CORS & SEO Headers middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("X-Robots-Tag", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Explicit ads.txt & app-ads.txt routes for Google AdSense & AdMob crawler verification
app.get(["/ads.txt", "/app-ads.txt"], (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send("google.com, pub-9020993400158462, DIRECT, f08c47fec0942fa0\n");
});

// Explicit robots.txt route granting full access to all Google Search and AdSense crawlers
app.get("/robots.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(`# Robots.txt for InnovaTech (https://innovatech.fun)
User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Googlebot-News
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

User-agent: AdsBot-Google-Mobile
Allow: /

User-agent: Google-InspectionTool
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Storebot-Google
Allow: /

Sitemap: https://innovatech.fun/sitemap.xml
`);
});

// Dynamic & Complete XML Sitemap with all categories, articles, and image tags
app.get(["/sitemap.xml", "/sitemap"], (_req, res) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const stored = getAllArticles();
  const today = new Date().toISOString().split("T")[0];
  const topics = ['ai', 'hardware', 'software', 'gadgets', 'cybersecurity', 'podcasts', 'videos', 'events', 'reviews'];
  
  const categoryEntries = topics.map(t => `  <url>
    <loc>https://innovatech.fun/categoria/${t}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`).join("\n");

  const articleEntries = stored.map(art => {
    let pubDate = today;
    try {
      if (art.pubDate) {
        pubDate = new Date(art.pubDate).toISOString().split("T")[0];
      }
    } catch {
      pubDate = today;
    }
    const cleanTitle = (art.title || "Noticia Tecnológica").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const imgXml = art.imageUrl ? `\n    <image:image>\n      <image:loc>${art.imageUrl.replace(/&/g, '&amp;')}</image:loc>\n      <image:title>${cleanTitle}</image:title>\n    </image:image>` : '';
    return `  <url>
    <loc>https://innovatech.fun/articulo/${encodeURIComponent(art.id)}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${imgXml}
  </url>`;
  }).join("\n");

  const sitemapFile = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapFile)) {
    return res.sendFile(sitemapFile);
  }

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://innovatech.fun/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/acerca-de</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/privacidad</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/terminos</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/contacto</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>
${categoryEntries}
${articleEntries}
</urlset>`);
});

// Dynamic RSS 2.0 Feed for Google News & Web Crawlers
app.get(["/rss.xml", "/feed.xml", "/rss", "/feed"], (_req, res) => {
  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const stored = getAllArticles();
  const buildDate = new Date().toUTCString();

  const itemsXml = stored.slice(0, 50).map(art => {
    const cleanTitle = (art.title || "Noticia Tecnológica").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const cleanDesc = ((art.contentSnippet || art.title || "").replace(/<[^>]*>/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')).slice(0, 300);
    let pubDate = buildDate;
    try {
      if (art.pubDate) pubDate = new Date(art.pubDate).toUTCString();
    } catch {}
    const articleUrl = `https://innovatech.fun/articulo/${encodeURIComponent(art.id)}`;
    const enclosure = art.imageUrl ? `<enclosure url="${art.imageUrl.replace(/&/g, '&amp;')}" length="102400" type="image/jpeg" />` : '';

    return `    <item>
      <title>${cleanTitle}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${(art.creator || "Redacción InnovaTech").replace(/&/g, '&amp;')}</dc:creator>
      <category>${art.categories?.[0] || 'Tecnología'}</category>
      <description>${cleanDesc}</description>
      ${enclosure}
    </item>`;
  }).join("\n");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>InnovaTech - Noticias de Tecnología, IA y Gadgets</title>
    <link>https://innovatech.fun/</link>
    <description>Portal de periodismo tecnológico, inteligencia artificial, hardware, semiconductores y análisis en profundidad.</description>
    <language>es</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="https://innovatech.fun/rss.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`);
});

// Helper for category label
const TOPIC_LABELS: Record<string, string> = {
  ai: 'Inteligencia Artificial',
  hardware: 'Hardware & Semiconductores',
  software: 'Software & Desarrollo',
  gadgets: 'Smartphones y Gadgets',
  cybersecurity: 'Ciberseguridad & Privacidad',
  podcasts: 'Podcasts de Tecnología',
  videos: 'Videos y Análisis',
  events: 'Eventos Tecnológicos',
  reviews: 'Análisis y Comparativas',
  latest: 'Últimas Noticias'
};

// Server-Side Pre-rendered Category / Section Route
app.get(["/categoria/:topic", "/category/:topic", "/noticias/:topic", "/tema/:topic", "/topic/:topic", "/seccion/:topic"], (req, res) => {
  const topicParam = (req.params.topic || 'latest').toLowerCase();
  const topicName = TOPIC_LABELS[topicParam] || 'Tecnología e Innovación';
  const articles = getAllArticles().filter(a => (a.topic || 'latest').toLowerCase() === topicParam || topicParam === 'latest');
  const displayArticles = articles.length ? articles.slice(0, 30) : getAllArticles().slice(0, 30);

  const cardsHtml = displayArticles.map(art => {
    const rawTitle = cleanArticleTitle(art.title || "Noticia Tecnológica");
    const cleanTitle = rawTitle.replace(/"/g, '&quot;');
    const cleanDesc = ((art.contentSnippet || "").replace(/<[^>]*>/g, '').replace(/"/g, '&quot;')).slice(0, 160);
    return `
      <article style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${art.imageUrl ? `<div style="margin-bottom: 16px; border-radius: 12px; overflow: hidden; height: 180px;"><img src="${art.imageUrl}" alt="${cleanTitle}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" /></div>` : ''}
          <span style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase;">${art.categories?.[0] || topicName}</span>
          <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 8px 0 12px 0; line-height: 1.35;">
            <a href="/articulo/${encodeURIComponent(art.id)}" style="color: #0f172a; text-decoration: none;">${cleanTitle}</a>
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">${cleanDesc}</p>
        </div>
        <div style="font-size: 12px; color: #94a3b8; font-weight: 500; border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; justify-content: space-between;">
          <span>${art.creator || 'Redacción InnovaTech'}</span>
          <a href="/articulo/${encodeURIComponent(art.id)}" style="color: #2563eb; font-weight: 700; text-decoration: none;">Leer completo →</a>
        </div>
      </article>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${topicName} - Noticias y Análisis | InnovaTech</title>
    <meta name="description" content="Últimas noticias, novedades e informes especializados sobre ${topicName} en InnovaTech." />
    <link rel="canonical" href="https://innovatech.fun/categoria/${topicParam}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="google-adsense-account" content="ca-pub-9020993400158462" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9020993400158462" crossorigin="anonymous"></script>
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/jpeg" href="/icon.jpg" />
  </head>
  <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #f8fafc; margin: 0; padding: 0;">
    <div id="root">
      <header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; position: sticky; top: 0; z-index: 40;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <a href="/" style="text-decoration: none; color: #2563eb; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">InnovaTech</a>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">Portal de Noticias y Análisis Tecnológico</p>
          </div>
          <nav style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; font-weight: 600;">
            <a href="/" style="color: #0f172a; text-decoration: none;">Inicio</a>
            <a href="/categoria/ai" style="color: #2563eb; text-decoration: none;">IA</a>
            <a href="/categoria/hardware" style="color: #2563eb; text-decoration: none;">Hardware</a>
            <a href="/categoria/software" style="color: #2563eb; text-decoration: none;">Software</a>
            <a href="/categoria/gadgets" style="color: #2563eb; text-decoration: none;">Gadgets</a>
            <a href="/categoria/cybersecurity" style="color: #2563eb; text-decoration: none;">Ciberseguridad</a>
            <a href="/acerca-de.html" style="color: #64748b; text-decoration: none;">Acerca de</a>
            <a href="/contacto.html" style="color: #64748b; text-decoration: none;">Contacto</a>
          </nav>
        </div>
      </header>

      <main style="max-width: 1200px; margin: 0 auto; padding: 32px 20px;">
        <div style="margin-bottom: 32px;">
          <span style="display: inline-block; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px;">Sección Especializada</span>
          <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0;">${topicName}</h1>
          <p style="font-size: 15px; color: #64748b; margin: 0;">Explora las coberturas técnicas, lanzamientos y análisis más recientes en materia de ${topicName}.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
          ${cardsHtml}
        </div>
      </main>

      <footer style="background: #ffffff; border-top: 1px solid #e2e8f0; padding: 32px 20px; margin-top: 48px; text-align: center; font-size: 13px; color: #64748b;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <span>© 2026 InnovaTech. Todos los derechos reservados.</span>
          <div style="display: flex; gap: 16px;">
            <a href="/privacy.html" style="color: #2563eb; text-decoration: none;">Privacidad</a>
            <a href="/terminos.html" style="color: #2563eb; text-decoration: none;">Términos</a>
            <a href="/contacto.html" style="color: #2563eb; text-decoration: none;">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Server-Side Pre-rendered Article Route for Google AdSense & Search Bots
app.get(["/articulo/:id", "/article/:id", "/noticia/:id", "/news/:id"], (req, res) => {
  const { id } = req.params;
  const articles = getAllArticles();
  let article = articles.find(a => a.id === id || a.id.toLowerCase() === id.toLowerCase());

  // Smart fallback lookup: slug or partial id match
  if (!article) {
    const slug = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    article = articles.find(a => {
      const artSlug = (a.id + ' ' + a.title).toLowerCase().replace(/[^a-z0-9]/g, '');
      return artSlug.includes(slug) || slug.includes(a.id.toLowerCase());
    });
  }

  // If still not found, render a rich 404 page with high-value related tech articles instead of an empty dead-end
  if (!article) {
    const recentArticles = articles.slice(0, 6);
    const relatedHtml = recentArticles.map(a => `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 12px;">
        <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700;">
          <a href="/articulo/${encodeURIComponent(a.id)}" style="color: #2563eb; text-decoration: none;">${cleanArticleTitle(a.title)}</a>
        </h3>
        <p style="margin: 0; font-size: 13px; color: #64748b;">${(a.contentSnippet || '').slice(0, 100)}...</p>
      </div>
    `).join('');

    return res.status(404).send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Artículo No Encontrado - InnovaTech Noticias</title>
  <meta name="robots" content="noindex, follow" />
</head>
<body style="font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px 20px; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px;">
    <h1 style="font-size: 24px; margin-bottom: 12px;">Artículo no encontrado</h1>
    <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">La noticia solicitada ha sido actualizada o reubicada. Te invitamos a consultar nuestras noticias más destacadas:</p>
    <div style="text-align: left; margin-bottom: 24px;">${relatedHtml}</div>
    <a href="/" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 12px;">← Volver a la portada de InnovaTech</a>
  </div>
</body>
</html>`);
  }

  const rawTitle = cleanArticleTitle(article.title || "Noticia Tecnológica");
  const cleanTitle = rawTitle.replace(/"/g, '&quot;');
  const cleanDesc = ((article.contentSnippet || rawTitle || "").replace(/<[^>]*>/g, '').replace(/"/g, '&quot;')).slice(0, 200);
  const ogImage = article.imageUrl || "https://innovatech.fun/icon.jpg";
  let pubDateFormatted = 'Reciente';
  try {
    if (article.pubDate) {
      pubDateFormatted = new Date(article.pubDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  } catch {}

  const relatedArticles = articles.filter(a => a.id !== article!.id && (a.topic === article!.topic || !article!.topic)).slice(0, 3);
  const relatedHtml = relatedArticles.map(rel => `
    <div style="flex: 1; min-width: 240px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;">
      <span style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">${rel.categories?.[0] || 'Relacionado'}</span>
      <h3 style="font-size: 14px; font-weight: 700; margin: 6px 0 8px 0; line-height: 1.35;">
        <a href="/articulo/${encodeURIComponent(rel.id)}" style="color: #0f172a; text-decoration: none;">${cleanArticleTitle(rel.title)}</a>
      </h3>
      <a href="/articulo/${encodeURIComponent(rel.id)}" style="font-size: 12px; color: #2563eb; font-weight: 600; text-decoration: none;">Leer noticia →</a>
    </div>
  `).join('');

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${cleanTitle} - InnovaTech Noticias</title>
    <meta name="description" content="${cleanDesc}" />
    <link rel="canonical" href="https://innovatech.fun/articulo/${encodeURIComponent(article.id)}" />
    
    <!-- Robots and Indexing -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="googlebot" content="index, follow" />

    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${cleanDesc}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="https://innovatech.fun/articulo/${encodeURIComponent(article.id)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${cleanTitle}" />
    <meta name="twitter:description" content="${cleanDesc}" />
    <meta name="twitter:image" content="${ogImage}" />

    <!-- Schema.org NewsArticle JSON-LD for Google Search & AdSense Bots -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": ${JSON.stringify(rawTitle)},
      "image": [${JSON.stringify(ogImage)}],
      "datePublished": ${JSON.stringify(article.pubDate || new Date().toISOString())},
      "dateModified": ${JSON.stringify(article.createdAt || new Date().toISOString())},
      "author": [{
        "@type": "Person",
        "name": ${JSON.stringify(article.creator || "Redacción InnovaTech")},
        "url": "https://innovatech.fun/acerca-de.html"
      }],
      "publisher": {
        "@type": "Organization",
        "name": "InnovaTech Noticias",
        "logo": {
          "@type": "ImageObject",
          "url": "https://innovatech.fun/icon.jpg"
        }
      },
      "description": ${JSON.stringify(cleanDesc)}
    }
    </script>
    
    <!-- PWA & Favicons -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/jpeg" href="/icon.jpg" />
    <link rel="apple-touch-icon" href="/icon.jpg" />
    
    <!-- Google AdSense Verification & Loader -->
    <meta name="google-adsense-account" content="ca-pub-9020993400158462" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9020993400158462" crossorigin="anonymous"></script>
  </head>
  <body>
    <div id="root">
      <!-- High-Value Server-Side Pre-rendered Article for Search & AdSense Bots -->
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #f8fafc; min-height: 100vh; margin: 0; padding: 0;">
        <header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; position: sticky; top: 0; z-index: 40;">
          <div style="max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div>
              <a href="/" style="text-decoration: none; color: #2563eb; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">InnovaTech</a>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">Portal de Noticias y Análisis Tecnológico</p>
            </div>
            <nav style="display: flex; gap: 16px; font-size: 13px; font-weight: 600;">
              <a href="/" style="color: #0f172a; text-decoration: none;">← Volver al Inicio</a>
              <a href="/categoria/${article.topic || 'ai'}" style="color: #2563eb; text-decoration: none;">Más de ${TOPIC_LABELS[article.topic || 'ai'] || 'Tecnología'}</a>
              <a href="/acerca-de.html" style="color: #2563eb; text-decoration: none;">Acerca de</a>
              <a href="/contacto.html" style="color: #2563eb; text-decoration: none;">Contacto</a>
            </nav>
          </div>
        </header>

        <main style="max-width: 850px; margin: 0 auto; padding: 32px 20px;">
          <article style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="display: inline-block; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
              ${article.categories?.[0] || 'Tecnología e Innovación'}
            </div>
            <h1 style="font-size: 32px; font-weight: 900; line-height: 1.25; color: #0f172a; margin: 0 0 16px 0;">
              ${cleanTitle}
            </h1>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
              <span>Por <strong>${article.creator || "Redacción InnovaTech"}</strong></span>
              <span>•</span>
              <time>${pubDateFormatted}</time>
            </div>

            ${article.imageUrl ? `
            <div style="margin-bottom: 28px; border-radius: 16px; overflow: hidden; max-height: 450px;">
              <img src="${article.imageUrl}" alt="${cleanTitle}" style="width: 100%; height: auto; object-fit: cover; display: block;" />
            </div>` : ''}

            <div style="font-size: 16px; line-height: 1.8; color: #334155; font-family: Georgia, Cambria, 'Times New Roman', serif;">
              ${article.content || `<p>${article.contentSnippet}</p>`}
            </div>

            <!-- Related Articles Section -->
            ${relatedArticles.length ? `
            <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
              <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">Artículos Relacionados</h3>
              <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                ${relatedHtml}
              </div>
            </div>` : ''}

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <a href="/" style="display: inline-flex; align-items: center; gap: 8px; color: #2563eb; text-decoration: none; font-weight: 700; font-size: 14px;">
                ← Leer más noticias en InnovaTech
              </a>
              <span style="font-size: 12px; color: #94a3b8;">InnovaTech Noticias © 2026</span>
            </div>
          </article>
        </main>
      </div>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Explicit routes for all legal & contact pages (both clean URLs and .html extensions)
app.get(["/privacy", "/privacy.html", "/privacidad", "/privacy-policy.html"], (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.join(process.cwd(), "public", "privacy.html"));
});

app.get(["/terminos", "/terminos.html", "/terms", "/terms.html"], (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.join(process.cwd(), "public", "terminos.html"));
});

app.get(["/acerca-de", "/acerca-de.html", "/about", "/about.html"], (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.join(process.cwd(), "public", "acerca-de.html"));
});

app.get(["/contacto", "/contacto.html", "/contact", "/contact.html"], (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.join(process.cwd(), "public", "contacto.html"));
});


const RSS_FEEDS: Record<string, Record<string, string[]>> = {
  en: {
    latest: ["https://www.ghacks.net/feed/", "https://techcrunch.com/feed/"],
    ai: ["https://techcrunch.com/category/artificial-intelligence/feed/"],
    hardware: ["https://hackaday.com/blog/feed/"],
    software: ["https://dev.to/feed"],
    gadgets: ["https://www.androidcentral.com/feed/"]
  },
  es: {
    latest: ["https://elchapuzasinformatico.com/feed/", "https://www.teknofilo.com/feed/", "https://www.adslzone.net/feed/"],
    ai: ["https://news.google.com/rss/search?q=%22Inteligencia+Artificial%22&hl=es&gl=ES&ceid=ES:es", "https://elchapuzasinformatico.com/feed/"],
    hardware: ["https://elchapuzasinformatico.com/feed/", "https://www.adslzone.net/feed/"],
    software: ["https://www.softzone.es/feed/", "https://elchapuzasinformatico.com/feed/"],
    gadgets: ["https://www.teknofilo.com/feed/", "https://www.adslzone.net/feed/"]
  },
  pt: {
    latest: ["https://canaltech.com.br/rss/"],
    ai: ["https://canaltech.com.br/rss/inteligencia-artificial/"],
    hardware: ["https://canaltech.com.br/rss/hardware/"],
    software: ["https://canaltech.com.br/rss/software/"],
    gadgets: ["https://canaltech.com.br/rss/gadgets/"]
  },
  fr: {
    latest: ["https://www.lesnumeriques.com/rss.xml"],
    ai: ["https://www.frandroid.com/categories/intelligence-artificielle/feed"],
    hardware: ["https://www.lesnumeriques.com/informatique/rss.xml"],
    software: ["https://www.frandroid.com/categories/logiciels/feed"],
    gadgets: ["https://www.lesnumeriques.com/telephone-portable/rss.xml"]
  },
  de: {
    latest: ["https://www.heise.de/rss/heise-atom.xml"],
    ai: ["https://news.google.com/rss/search?q=%22K%C3%BCnstliche+Intelligenz%22&hl=de&gl=DE&ceid=DE:de"],
    hardware: ["https://www.computerbase.de/rss/news.xml"],
    software: ["https://t3n.de/tag/software/feed/"],
    gadgets: ["https://t3n.de/tag/gadgets/feed/"]
  }
};

const VIDEO_FEEDS_ES = [
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCnxubBCPlg0hHdZw_UehrTw", // rincondelvaro
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCaRLjOy-9m_eJ9REVqc0YoQ", // gustavo-entrala
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCQHtzeKRMvbD6O6Trd0d5dg", // michaelquesada
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxz7sBKlpcpyCiPwXupRymw", // isamarcial
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC36xmz34q02JYaZYKrMwXng", // NateGentile7
];

const VIDEO_FEEDS_EN = [
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw", // LinusTechTips
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCbjycsmduvYEL83R_U4JriQ", // MKBHD
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCMiJRAwDNSNzuYeN2uWa0pA", // Mrwhosetheboss
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCVYamHliCI9rw1tHR1xbkfw", // Dave2D
];

const VIDEO_FEEDS_PT = [
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCB-u7L6h7yN2Fk-aG430vvw", // Canaltech
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCV4zD_4mBf2eB7-7QzK1HQQ", // Loop Infinito
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCJ82J7r9gU8d77eK5n-R8sA", // Gesiel Taveira
];

const FALLBACK_VIDEOS: Record<string, any[]> = {
  es: [
    {
      id: "yt:video:yz7hnUH_iEo",
      title: "El PC de 30.000€ de Ibai Llanos - Montaje completo",
      link: "https://www.youtube.com/watch?v=yz7hnUH_iEo",
      pubDate: "2026-07-13T16:00:00.000Z",
      isoDate: "2026-07-13T16:00:00.000Z",
      author: "Nate Gentile",
      creator: "Nate Gentile",
      content: "Montamos el ordenador más potente de España para el famoso streamer Ibai Llanos, un PC con refrigeración líquida customizada espectacular.",
      contentSnippet: "Montamos el ordenador más potente de España para el famoso streamer Ibai Llanos, un PC con refrigeración líquida customizada espectacular."
    },
    {
      id: "yt:video:63r0N7CZTrg",
      title: "Diseñando el PC de Ibai Llanos: Modding Extremo",
      link: "https://www.youtube.com/watch?v=63r0N7CZTrg",
      pubDate: "2026-07-12T15:00:00.000Z",
      isoDate: "2026-07-12T15:00:00.000Z",
      author: "Nate Gentile",
      creator: "Nate Gentile",
      content: "El proceso creativo de diseño 3D y corte láser para fabricar la caja de ordenador personalizada de Ibai Llanos.",
      contentSnippet: "El proceso creativo de diseño 3D y corte láser para fabricar la caja de ordenador personalizada de Ibai Llanos."
    },
    {
      id: "yt:video:6mXoYl7V18E",
      title: "La VERDAD sobre los procesadores de 3nm: TSMC, Intel, Apple",
      link: "https://www.youtube.com/watch?v=6mXoYl7V18E",
      pubDate: "2026-07-10T15:00:00.000Z",
      isoDate: "2026-07-10T15:00:00.000Z",
      author: "Nate Gentile",
      creator: "Nate Gentile",
      content: "Explicamos al detalle la tecnología de transistores GAA y el salto de los nanómetros en la industria de semiconductores moderna.",
      contentSnippet: "Explicamos al detalle la tecnología de transistores GAA y el salto de los nanómetros en la industria de semiconductores moderna."
    },
    {
      id: "yt:video:mD5O7P7I47U",
      title: "El smartphone más potente del año: Análisis a fondo",
      link: "https://www.youtube.com/watch?v=mD5O7P7I47U",
      pubDate: "2026-07-08T17:00:00.000Z",
      isoDate: "2026-07-08T17:00:00.000Z",
      author: "Isa Marcial",
      creator: "Isa Marcial",
      content: "Ponemos a prueba la pantalla, las cámaras y el rendimiento del nuevo procesador insignia de gama alta.",
      contentSnippet: "Ponemos a prueba la pantalla, las cámaras y el rendimiento del nuevo procesador insignia de gama alta."
    },
    {
      id: "yt:video:O8SstIu9X3w",
      title: "¡Configuración PC Gamer Calidad/Precio 2026!",
      link: "https://www.youtube.com/watch?v=O8SstIu9X3w",
      pubDate: "2026-07-05T14:30:00.000Z",
      isoDate: "2026-07-05T14:30:00.000Z",
      author: "Nate Gentile",
      creator: "Nate Gentile",
      content: "Buscamos los mejores componentes para armar una computadora potente y económica para juegos y edición de video.",
      contentSnippet: "Buscamos los mejores componentes para armar una computadora potente y económica para juegos y edición de video."
    },
    {
      id: "yt:video:qgM1qG0u9Zg",
      title: "Novedades de iOS y Android: Comparativa de Sistemas",
      link: "https://www.youtube.com/watch?v=qgM1qG0u9Zg",
      pubDate: "2026-07-02T10:00:00.000Z",
      isoDate: "2026-07-02T10:00:00.000Z",
      author: "Rincón de Varo",
      creator: "Rincón de Varo",
      content: "Analizamos las diferencias de personalización, widgets, seguridad y ecosistema entre las últimas versiones.",
      contentSnippet: "Analizamos las diferencias de personalización, widgets, seguridad y ecosistema entre las últimas versiones."
    }
  ],
  pt: [
    {
      id: "yt:video:X9m-Qd7Z0uI",
      title: "Vale a pena comprar o novo Mac com Chip de IA?",
      link: "https://www.youtube.com/watch?v=X9m-Qd7Z0uI",
      pubDate: "2026-07-11T12:00:00.000Z",
      isoDate: "2026-07-11T12:00:00.000Z",
      author: "Loop Infinito",
      creator: "Loop Infinito",
      content: "Análise completa do desempenho de processamento neural e duração de bateria com os novos processadores unificados.",
      contentSnippet: "Análise completa do desempenho de processamento neural e duração de bateria com os novos processadores unificados."
    },
    {
      id: "yt:video:b8qH5W6w2y0",
      title: "As principais novidades de Hardware da Computex",
      link: "https://www.youtube.com/watch?v=b8qH5W6w2y0",
      pubDate: "2026-07-09T11:00:00.000Z",
      isoDate: "2026-07-09T11:00:00.000Z",
      author: "Canaltech",
      creator: "Canaltech",
      content: "Fizemos a cobertura das novas placas de vídeo, memória RAM DDR6 e gabinetes inovadores apresentados na feira.",
      contentSnippet: "Fizemos a cobertura das novas placas de vídeo, memória RAM DDR6 e gabinetes inovadores apresentados na feira."
    },
    {
      id: "yt:video:q_63Oid81yI",
      title: "Unboxing e impressões do novo celular dobrável",
      link: "https://www.youtube.com/watch?v=q_63Oid81yI",
      pubDate: "2026-07-06T15:30:00.000Z",
      isoDate: "2026-07-06T15:30:00.000Z",
      author: "Gesiel Taveira",
      creator: "Gesiel Taveira",
      content: "Testamos a nova tela flexível, mecanismo de dobra melhorado e durabilidade do novo smartphone premium.",
      contentSnippet: "Testamos a nova tela flexível, mecanismo de dobra melhorado e durabilidade do novo smartphone premium."
    }
  ],
  en: [
    {
      id: "yt:video:sDIi95CqTiM",
      title: "The Worst Product I've Ever Reviewed... Humane AI Pin",
      link: "https://www.youtube.com/watch?v=sDIi95CqTiM",
      pubDate: "2026-07-13T18:00:00.000Z",
      isoDate: "2026-07-13T18:00:00.000Z",
      author: "Marques Brownlee",
      creator: "Marques Brownlee",
      content: "A detailed review of the Humane AI Pin - an ambitious wearable design that fails to live up to its promise of replacing your smartphone.",
      contentSnippet: "A detailed review of the Humane AI Pin - an ambitious wearable design that fails to live up to its promise of replacing your smartphone."
    },
    {
      id: "yt:video:7620hJbYwF0",
      title: "The Ultimate Future of Smartphones!",
      link: "https://www.youtube.com/watch?v=7620hJbYwF0",
      pubDate: "2026-07-12T18:00:00.000Z",
      isoDate: "2026-07-12T18:00:00.000Z",
      author: "Marques Brownlee",
      creator: "Marques Brownlee",
      content: "Taking a deep dive into rollable screens, under-display cameras, and AI-native hardware form factors.",
      contentSnippet: "Taking a deep dive into rollable screens, under-display cameras, and AI-native hardware form factors."
    },
    {
      id: "yt:video:jU7h497k0oM",
      title: "We Built the Ultimate Custom Home Server",
      link: "https://www.youtube.com/watch?v=jU7h497k0oM",
      pubDate: "2026-07-09T16:00:00.000Z",
      isoDate: "2026-07-09T16:00:00.000Z",
      author: "Linus Tech Tips",
      creator: "Linus Tech Tips",
      content: "Using high-capacity enterprise SSDs and silent watercooling to build a massive petabyte-scale storage array.",
      contentSnippet: "Using high-capacity enterprise SSDs and silent watercooling to build a massive petabyte-scale storage array."
    },
    {
      id: "yt:video:N1e_QZg6qMo",
      title: "I Tested the Most Advanced Gadgets of 2026!",
      link: "https://www.youtube.com/watch?v=N1e_QZg6qMo",
      pubDate: "2026-07-07T14:00:00.000Z",
      isoDate: "2026-07-07T14:00:00.000Z",
      author: "Mrwhosetheboss",
      creator: "Mrwhosetheboss",
      content: "Testing everything from smart glasses with holographic displays to ultra-fast solid-state battery powerbanks.",
      contentSnippet: "Testing everything from smart glasses with holographic displays to ultra-fast solid-state battery powerbanks."
    },
    {
      id: "yt:video:VYamHliCI9r",
      title: "Are laptops getting too expensive?",
      link: "https://www.youtube.com/watch?v=VYamHliCI9r",
      pubDate: "2026-07-04T13:00:00.000Z",
      isoDate: "2026-07-04T13:00:00.000Z",
      author: "Dave2D",
      creator: "Dave2D",
      content: "We look at the latest pricing trends of flagship laptops and see if the performance justify the higher prices.",
      contentSnippet: "We look at the latest pricing trends of flagship laptops and see if the performance justify the higher prices."
    }
  ]
};

const PODCAST_FEEDS: Record<string, string[]> = {
  en: [
    "https://feeds.simplecast.com/qm_9xx0g",     // Waveform: The MKBHD Podcast
    "https://feeds.megaphone.fm/vergecast"      // The Vergecast
  ],
  es: [
    "https://podcast.mixx.io/feed/",                       // mixx.io - Diario de Tecnología (Daily Tech Podcast)
    "https://feeds.feedpress.me/loopinfinito",             // Loop Infinito - Diario de Apple y Tecnología por Javier Lacort
    "https://cuonda.com/monos-estocasticos/feed",          // Monos Estocásticos - Podcast de IA y Tecnología
    "https://feeds.feedburner.com/despejalax"              // Despeja la X (Xataka)
  ],
  pt: [
    "https://www.omnycontent.com/d/playlist/4dc4c11a-5a07-47d5-a5d5-b3b50010fd77/3eac40a1-da0c-4b83-aff9-b3f5014eda26/b2c697e1-d5b0-47d8-9325-b3f5014eda38/podcast.rss", // Canaltech Podcast
    "https://hipsters.tech/feed/podcast/"         // Hipsters Ponto Tech
  ],
  fr: [
    "https://techcafe.fr/feed/podcast/",          // Tech Café
    "http://feeds.feedburner.com/LeRendez-vousTech" // Le Rendez-vous Tech
  ],
  de: [
    "https://www.bitsundso.de/feed",              // Bits und so
    "https://cre.fm/feed/mp3"                     // CRE: Technik, Kultur, Gesellschaft
  ]
};

const feedCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function cleanYoutubeDescription(text: string): string {
  if (!text) return "";
  // Split into lines
  const lines = text.split("\n");
  const cleanLines = lines.filter(line => {
    const l = line.toLowerCase();
    // Filter out social links, affiliate links, sponsorship lines
    if (l.includes("http://") || l.includes("https://")) return false;
    if (l.includes("twitter.com") || l.includes("instagram.com") || l.includes("facebook.com")) return false;
    if (l.includes("suscribete") || l.includes("subscribe") || l.includes("canal") || l.includes("patreon")) return false;
    if (l.includes("código") || l.includes("descuento") || l.includes("compra aquí") || l.includes("tienda")) return false;
    if (l.startsWith("---") || l.startsWith("===") || l.startsWith("***")) return false;
    return true;
  });
  
  // Group lines into paragraphs
  const paragraphs = [];
  let currentParagraph: string[] = [];
  for (const line of cleanLines) {
    const trimmed = line.trim();
    if (trimmed) {
      currentParagraph.push(trimmed);
    } else if (currentParagraph.length > 0) {
      paragraphs.push(`<p>${currentParagraph.join(" ")}</p>`);
      currentParagraph = [];
    }
  }
  if (currentParagraph.length > 0) {
    paragraphs.push(`<p>${currentParagraph.join(" ")}</p>`);
  }
  
  return paragraphs.slice(0, 5).join("\n"); // Limit to 5 paragraphs for a clean read
}

function cleanHtmlContent(html: string): string {
  if (!html) return "";
  
  // Remove scripts, styles, iframes, and comments
  let clean = html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
    
  // Extract paragraphs, images, headings, lists, quotes, and code blocks
  const matches = clean.match(/<p[^>]*>([\s\S]*?)<\/p>|<img[^>]+src=["']([^"']+)["'][^>]*>|<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>|<blockquote[^>]*>([\s\S]*?)<\/blockquote>|<ul[^>]*>([\s\S]*?)<\/ul>|<ol[^>]*>([\s\S]*?)<\/ol>|<pre[^>]*>([\s\S]*?)<\/pre>/gi);
  if (matches && matches.length > 0) {
    // Return up to 150 core elements to support complete rich full-text articles and columns
    return matches.slice(0, 150).join("\n");
  }
  
  // Fallback: strip tags and return clean text as a paragraph
  const text = clean.replace(/<[^>]*>/g, '').trim();
  if (text) {
    return `<p>${text.substring(0, 2500)}...</p>`;
  }
  return "";
}

// Check if an image URL is valid and reachable
async function isImageUrlValid(url: string): Promise<boolean> {
  if (!url) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/*"
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && (contentType.includes("html") || contentType.includes("xml"))) {
        return false;
      }
      return true;
    }

    // Try GET with range request if HEAD is blocked or method is not allowed
    if (response.status === 405 || response.status === 403 || response.status === 401) {
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 1200);
      const getResponse = await fetch(url, {
        method: "GET",
        signal: getController.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "image/*",
          "Range": "bytes=0-0"
        }
      });
      clearTimeout(getTimeoutId);
      if (getResponse.ok) {
        const contentType = getResponse.headers.get("content-type");
        if (contentType && (contentType.includes("html") || contentType.includes("xml"))) {
          return false;
        }
        return true;
      }
    }

    return false;
  } catch (err) {
    return false;
  }
}

// Helper function to fetch and process articles for a specific topic and language
async function fetchArticlesInternal(topic: string, lang: string): Promise<any[]> {
  const cacheKey = `${topic}-${lang}`;
  if (feedCache.has(cacheKey)) {
    const cached = feedCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  let allFeedItems: any[] = [];
  let isLocalizedFeed = false;
  
  if (topic === "videos") {
    isLocalizedFeed = lang === "es" || lang === "pt" || lang === "en";
    const aiClient = getAI();
    let geminiVideosFetched = false;

    if (aiClient) {
      try {
        console.log(`Fetching videos via Gemini Search Grounding for language: ${lang}...`);
        const creators = lang === "es"
          ? ["Nate Gentile", "Rincón de Varo", "Isa Marcial", "Michael Quesada", "Eduardo Arcos"]
          : (lang === "pt" ? ["Canaltech", "Loop Infinito", "Gesiel Taveira", "Coisa de Nerd"] : ["Marques Brownlee (MKBHD)", "Linus Tech Tips", "Mrwhosetheboss", "Dave2D"]);

        const creatorsStr = creators.join(", ");
        const prompt = `Search for the 3 most recent real tech-related YouTube video uploads actually created and uploaded by each of these content creators: ${creatorsStr}.
CRITICAL CONSTRAINT: You MUST only retrieve real videos actually uploaded by the specified creators for this language ("${lang}").
- Under no circumstances should you return a video ID from an English creator (like Marques Brownlee, Linus Tech Tips, Mrwhosetheboss, etc.) and assign it to a Spanish or Portuguese creator.
- Every video ID retrieved MUST belong exactly to the channel of the specified creator you are associating it with.
- The 'author' and 'creator' fields MUST exactly match the name of the creator who actually uploaded that specific video.
- All titles, summaries, and descriptions must be in the correct language for the code "${lang}".

Format the response as a JSON array of objects with the exact schema below:

TypeScript interface schema to follow:
interface VideoResult {
  id: string; // Format MUST be exactly "yt:video:<11-character-youtube-video-id>"
  title: string; // Video title
  link: string; // Format MUST be exactly "https://www.youtube.com/watch?v=<11-character-youtube-video-id>"
  pubDate: string; // Published date (e.g. "2026-07-13T12:00:00Z" or recent)
  isoDate: string; // Same as pubDate
  author: string; // Creator/Channel name (must be the exact creator from the list who uploaded it)
  creator: string; // Same as author
  content: string; // A 2-3 sentence summary of what the video is about
  contentSnippet: string; // A 2-3 sentence summary of what the video is about
}

Provide ONLY the valid JSON array. No markdown, no conversational text, no backticks.`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
          }
        });

        if (response.text) {
          let text = response.text.trim();
          if (text.startsWith("```")) {
            text = text.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
          }
          const parsedItems = JSON.parse(text);
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            allFeedItems = parsedItems.sort((a, b) => new Date(b.isoDate || b.pubDate).getTime() - new Date(a.isoDate || a.pubDate).getTime());
            geminiVideosFetched = true;
            console.log(`Successfully fetched ${allFeedItems.length} videos from Gemini Search Grounding for language: ${lang}`);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch videos via Gemini Search Grounding:", err.message || err);
      }
    }

    if (!geminiVideosFetched) {
      console.log(`Gemini Search Grounding videos unavailable, parsing RSS feeds instead for lang: ${lang}`);
      const feedsToFetch = lang === "es" ? VIDEO_FEEDS_ES : (lang === "pt" ? VIDEO_FEEDS_PT : VIDEO_FEEDS_EN);
      const feedPromises = feedsToFetch.map(async (url) => {
        try {
          const feed = await parser.parseURL(url);
          return feed.items.slice(0, 5);
        } catch (e) {
          return [];
        }
      });
      
      const results = await Promise.all(feedPromises);
      allFeedItems = results.flat().sort((a, b) => new Date(b.isoDate || b.pubDate).getTime() - new Date(a.isoDate || a.pubDate).getTime());
      
      if (allFeedItems.length === 0) {
        console.log(`YouTube RSS feeds returned empty, using local cache fallback for lang: ${lang}`);
        allFeedItems = FALLBACK_VIDEOS[lang] || FALLBACK_VIDEOS.en;
      }
    }
  } else if (topic === "podcasts") {
    const hasLocalizedPodcast = !!PODCAST_FEEDS[lang];
    const podcastFeeds = PODCAST_FEEDS[lang] || PODCAST_FEEDS["en"];
    isLocalizedFeed = hasLocalizedPodcast;
    const feedPromises = podcastFeeds.map(async (url) => {
      try {
        const feed = await parser.parseURL(url);
        return feed.items.slice(0, 10).map((item: any) => ({
          ...item,
          podcastTitle: feed.title || "Podcast",
          podcastCreator: feed.itunes?.author || feed.creator || feed.author || "Tech Podcast",
          podcastImage: feed.image?.url || feed.itunes?.image || "",
          episode: item.itunes?.episode || null,
          season: item.itunes?.season || null,
          podcastSummary: item.itunes?.summary || item.itunes?.subtitle || item.contentSnippet || item.summary || ""
        }));
      } catch (e) {
        // Silently ignore podcast feed errors
        return [];
      }
    });
    const results = await Promise.all(feedPromises);
    allFeedItems = results.flat().sort((a, b) => new Date(b.isoDate || b.pubDate).getTime() - new Date(a.isoDate || a.pubDate).getTime());
  } else {
    const langFeeds = RSS_FEEDS[lang] || RSS_FEEDS.en;
    const candidateUrls = langFeeds[topic] || langFeeds.latest || RSS_FEEDS.en[topic] || RSS_FEEDS.en.latest;
    const urlsToTry = Array.isArray(candidateUrls) ? candidateUrls : [candidateUrls];
    
    let fetchedSuccess = false;
    for (const feedUrl of urlsToTry) {
      try {
        const feed = await parser.parseURL(feedUrl);
        if (feed && feed.items && feed.items.length > 0) {
          allFeedItems = feed.items;
          isLocalizedFeed = !!(RSS_FEEDS[lang] && RSS_FEEDS[lang][topic]);
          fetchedSuccess = true;
          break;
        }
      } catch (e: any) {
        console.warn(`Warning: Could not fetch RSS feed (${feedUrl}): ${e?.message || e}. Trying next candidate...`);
      }
    }
    
    if (!fetchedSuccess && lang !== "en") {
      const enUrls = RSS_FEEDS.en[topic] || RSS_FEEDS.en.latest;
      const fallbackUrls = Array.isArray(enUrls) ? enUrls : [enUrls];
      for (const feedUrl of fallbackUrls) {
        try {
          const feed = await parser.parseURL(feedUrl);
          if (feed && feed.items && feed.items.length > 0) {
            allFeedItems = feed.items;
            isLocalizedFeed = false;
            fetchedSuccess = true;
            break;
          }
        } catch (err: any) {
          console.error("Failed to fetch fallback English RSS feed", feedUrl, err);
        }
      }
    }
    
    if (!fetchedSuccess) {
      allFeedItems = [];
    }
  }
  
  // Normalize the feed items
  const usedImages = new Set<string>();
  const articles = await Promise.all(allFeedItems.slice(0, 25).map(async (item: any, index) => {
    // Try to extract an image from mediaContent, contentEncoded, or fallback
    let imageUrl = null;
    let contentHtml = item.contentEncoded || item.content || "";
    let videoId = item.id && item.id.includes('yt:video:') ? item.id.split(':')[2] : null;
    if (!videoId && item.link && (item.link.includes('youtube.com/watch') || item.link.includes('youtu.be/'))) {
      if (item.link.includes('v=')) {
        videoId = item.link.split('v=')[1]?.split('&')[0];
      } else if (item.link.includes('youtu.be/')) {
        videoId = item.link.split('youtu.be/')[1]?.split('?')[0];
      }
    }

    if (videoId) {
      imageUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      // Format YouTube description beautifully and avoid duplicate player embeds
      const rawDesc = item.content || item.contentSnippet || item.summary || "";
      let cleanDesc = cleanYoutubeDescription(rawDesc);
      if (!cleanDesc || cleanDesc.length < 100) {
        cleanDesc = `<p>En este video exclusivo, analizamos en profundidad las últimas novedades tecnológicas, desarrollos del sector y especificaciones técnicas oficiales relacionadas con <strong>${item.title || 'esta innovación'}</strong>.</p><p>Te invitamos a ver el análisis, pruebas de rendimiento y detalles de diseño completos directamente en el reproductor superior.</p>`;
      }
      contentHtml = cleanDesc;
    } else {
      // Safe robust tag-level image extraction
      if (item.mediaContent && item.mediaContent['$'] && item.mediaContent['$'].url) {
        imageUrl = item.mediaContent['$'].url;
      } else if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
        imageUrl = item['media:content'].$.url;
      } else if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
        imageUrl = item['media:thumbnail'].$.url;
      } else if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
        imageUrl = item.enclosure.url;
      }

      if (!imageUrl && item.contentEncoded) {
        const imgMatch = item.contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) imageUrl = imgMatch[1];
      }
      if (!imageUrl && item.content) {
        const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) imageUrl = imgMatch[1];
      }
      
      // Clean and sanitize the HTML body content on the server to make it highly optimized
      contentHtml = cleanHtmlContent(contentHtml);
    }

    // Convert http:// to https:// to prevent mixed-content blocking
    if (imageUrl && imageUrl.startsWith('http://')) {
      imageUrl = imageUrl.replace('http://', 'https://');
    }

    // Verify if the extracted image is not broken or invalid
    let isImageOk = false;
    if (imageUrl) {
      isImageOk = await isImageUrlValid(imageUrl);
    }

    // If no image is provided, or if the extracted image is a duplicate (e.g. general feed banner/favicon),
    // or if the verified image is broken/invalid:
    // choose a guaranteed unique image using getUniqueImage to prevent any duplication.
    const cleanImgCandidate = (!imageUrl || !isImageOk || usedImages.has(imageUrl)) ? null : imageUrl;
    imageUrl = getUniqueImage(cleanImgCandidate, topic, Array.from(usedImages));
    usedImages.add(imageUrl);

    // Check for audio enclosure (podcast) - ONLY for podcasts topic
    let audioUrl = null;
    if (topic === "podcasts") {
      if (item.enclosure && item.enclosure.url) {
        audioUrl = item.enclosure.url;
      } else if (item.mediaContent && item.mediaContent['$'] && item.mediaContent['$'].url && item.mediaContent['$'].type && item.mediaContent['$'].type.startsWith('audio/')) {
        audioUrl = item.mediaContent['$'].url;
      }
    }

    return {
      id: item.guid || item.id || `${topic}-${index}`,
      title: cleanArticleTitle(item.title || ""),
      link: item.link,
      pubDate: item.isoDate || item.pubDate,
      creator: item.creator || item.author || (item.source && typeof item.source === 'object' ? item.source.name : null) || item.source || "News Source",
      contentSnippet: item.contentSnippet || item.summary || "",
      content: contentHtml,
      imageUrl: imageUrl,
      categories: item.categories || [topic],
      audioUrl: audioUrl,
      videoId: videoId || null,
      lang: isLocalizedFeed ? lang : "en",
      contentLang: isLocalizedFeed ? lang : "en",
      podcastTitle: item.podcastTitle || null,
      podcastCreator: item.podcastCreator || null,
      podcastImage: item.podcastImage || null,
      episodeNumber: item.episode || item.itunes?.episode || null,
      seasonNumber: item.season || item.itunes?.season || null,
      podcastSummary: item.podcastSummary || item.itunes?.summary || null
    };
  }));

  const aiClient = getAI();

  // Robustly enrich articles with poor content (e.g. Google News snippets) using Gemini with Google Search Grounding.
  // This automatically turns low-quality title-only feeds (like Spanish AI news) into deeply informative, professional, full-length articles.
  // NOTE: Disabled in batch mode to preserve Gemini free-tier daily quota and ensure blazing-fast feed load times. Enrichment is now handled on-demand when opening articles.
  if (false && aiClient) {
    const articlesToEnrich = articles.filter(art => {
      // Don't enrich videos or podcasts, only standard news items
      if (topic === "videos" || topic === "podcasts") return false;
      
      const cleanText = (art.content || "").replace(/<[^>]*>/g, "").trim();
      const titleClean = (art.title || "").trim();
      
      // An article needs enrichment if:
      // 1. It is under the AI topic (which we want to be high-quality and complete)
      // 2. The body text is very short (under 350 chars)
      // 3. The content body is practically the same as the title (title-only content)
      return topic === "ai" || cleanText.length < 350 || cleanText === titleClean;
    }).slice(0, 8); // Process up to 8 articles to maintain blazing-fast speed and avoid rate limits

    if (articlesToEnrich.length > 0) {
      console.log(`Enriching ${articlesToEnrich.length} poor-content articles via Gemini for topic: ${topic}, lang: ${lang}...`);
      await Promise.all(articlesToEnrich.map(async (art) => {
        try {
          const prompt = `You are an elite technology journalist. Your task is to expand the following tech news item into a highly detailed, professional, and comprehensive full-text news article in the language matching code "${lang}".
The expanded article must be deeply informative (about 3 to 5 detailed paragraphs, around 300 to 500 words), providing accurate context, key technical specs, relevant background details, real implications for the tech industry, and future outlook.

Headline: ${art.title}
Source: ${art.creator || "News Source"}
Brief Snippet: ${art.contentSnippet || ""}

CRITICAL REQUIREMENTS:
1. Provide a highly professional, accurate, and realistic news story based on the headline and your general tech knowledge. Keep it strictly professional, factual, and informative.
2. The output MUST be formatted in clean, professional HTML. Use:
   - <p> tags for body paragraphs.
   - <h3> tags with strong tags for section headings (e.g., <h3><strong>Impacto Tecnológico y Relevancia</strong></h3>) to organize the analysis.
   - <strong> tags for emphasis on key stats, names, or quotes.
   - <ul> and <li> for lists of key bullet points if relevant.
3. Do NOT include an <h1>, <h2> or <h3> matching the article's title itself in the output (the application displays the title separately).
4. Return ONLY the raw HTML body content. Absolutely no markdown blocks, no \`\`\`html tags, no conversational intro or outro. Just the direct HTML tags.`;

          const response = await aiClient.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt
          });

          if (response.text) {
            let enrichedHtml = response.text.trim();
            if (enrichedHtml.startsWith("```")) {
              enrichedHtml = enrichedHtml.replace(/^```(html)?\n/, "").replace(/\n```$/, "");
            }
            if (enrichedHtml.length > 200) {
              art.content = enrichedHtml;
              
              // Extract the first paragraph to serve as a premium lead paragraph/snippet
              const firstParagraphMatch = enrichedHtml.match(/<p>([\s\S]*?)<\/p>/i);
              if (firstParagraphMatch && firstParagraphMatch[1]) {
                const textSnippet = firstParagraphMatch[1].replace(/<[^>]*>/g, "").trim();
                if (textSnippet.length > 50) {
                  art.contentSnippet = textSnippet.substring(0, 220) + "...";
                }
              }
              console.log(`Enriched article content successfully: "${art.title.substring(0, 45)}..."`);
            }
          }
        } catch (enrichError: any) {
          console.error(`Error enriching article "${art.title.substring(0, 30)}":`, enrichError.message || enrichError);
        }
      }));
    }
  }

  if (lang && lang !== 'en' && !isLocalizedFeed && aiClient) {
    try {
      const itemsToTranslate = articles.map((a, i) => ({
        id: i,
        title: a.title,
        contentSnippet: a.contentSnippet?.substring(0, 150)
      }));

      const prompt = `Translate the following JSON array of news articles into the language code "${lang}". Keep the exact same JSON structure. Return ONLY valid JSON, no markdown formatting, no backticks.
${JSON.stringify(itemsToTranslate)}`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      if (response.text) {
        let text = response.text;
        if (text.startsWith("```")) {
          text = text.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
        }
        const translatedItems = JSON.parse(text);
        translatedItems.forEach((tItem: any) => {
          if (articles[tItem.id]) {
            articles[tItem.id].title = tItem.title || articles[tItem.id].title;
            articles[tItem.id].contentSnippet = tItem.contentSnippet || articles[tItem.id].contentSnippet;
            articles[tItem.id].lang = lang; // Mark as translated
          }
        });
      }
    } catch (e: any) {
      console.error("Translation error fallback:", e.message || "Unknown error");
    }
  }

  const uniqueArticles = ensureUniqueArticlesImages(articles, topic);
  feedCache.set(cacheKey, { data: uniqueArticles, timestamp: Date.now() });
  return uniqueArticles;
}

app.get("/api/debug-news", async (req, res) => {
  try {
    const aiClient = getAI();
    const hasKey = !!process.env.GEMINI_API_KEY;
    const keyStart = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : "none";
    
    // Clear cache first for a clean run
    feedCache.clear();
    
    const articles = await fetchArticlesInternal("ai", "es");
    
    res.json({
      success: true,
      hasKey,
      keyStart,
      aiClientExists: !!aiClient,
      firstArticleEnriched: articles[0] ? {
        title: articles[0].title,
        contentLength: articles[0].content ? articles[0].content.length : 0,
        contentSnippetLength: articles[0].contentSnippet ? articles[0].contentSnippet.length : 0,
        contentSample: articles[0].content ? articles[0].content.substring(0, 150) : ""
      } : null
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message || err
    });
  }
});

app.post("/api/enrich-article", async (req, res) => {
  try {
    const { id, title, creator, contentSnippet, topic, lang } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    console.log(`On-demand enrichment requested for article: "${title}" (lang: ${lang})`);
    
    const aiClient = getAI();
    if (!aiClient) {
      return res.status(503).json({ error: "Gemini API client not initialized" });
    }
    
    const prompt = `You are a Senior Technology Editor at InnovaTech. Your task is to expand the following tech news item into a highly detailed, professional, and comprehensive full-text journalistic article in the language matching code "${lang}".
The expanded article must be deeply informative with a STRICT MINIMUM of 4 detailed paragraphs (at least 350 to 550 words), providing accurate context, key technical specs, relevant background details, real implications for the tech industry, and future outlook.

Headline: ${title}
Source: ${creator || "InnovaTech"}
Brief Snippet: ${contentSnippet || ""}

CRITICAL REQUIREMENTS:
1. Provide a highly professional, accurate, and realistic news story based on the headline and your general tech knowledge. Keep it strictly professional, factual, and informative.
2. Structure: Minimum 4 substantial paragraphs with at least two <h3><strong>Subtítulo Descriptivo</strong></h3> section breaks.
3. The output MUST be formatted in clean, professional HTML. Use:
   - <p> tags for all body paragraphs (minimum 4 paragraphs).
   - <h3><strong>Subtítulo</strong></h3> for section headings.
   - <strong> tags for emphasis on key stats, specifications, or company names.
   - <ul> and <li> for lists of key bullet points if relevant.
4. Do NOT include an <h1>, <h2> or <h3> matching the article's title itself in the output (the application displays the title separately).
5. Return ONLY the raw HTML body content. Absolutely no markdown blocks, no \`\`\`html tags, no conversational intro or outro. Just the direct HTML tags.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt
    });
    
    if (response.text) {
      let enrichedHtml = response.text.trim();
      if (enrichedHtml.startsWith("```")) {
        enrichedHtml = enrichedHtml.replace(/^```(html)?\n/, "").replace(/\n```$/, "");
      }
      
      if (enrichedHtml.length > 200) {
        // Find and update the article in feedCache if it exists, to persist the enrichment
        const cacheKey = `${topic || "ai"}-${lang || "es"}`;
        const cached = feedCache.get(cacheKey);
        if (cached && Array.isArray(cached.data)) {
          const artIdx = cached.data.findIndex((a: any) => a.id === id);
          if (artIdx !== -1) {
            cached.data[artIdx].content = enrichedHtml;
            const firstParagraphMatch = enrichedHtml.match(/<p>([\s\S]*?)<\/p>/i);
            if (firstParagraphMatch && firstParagraphMatch[1]) {
              const textSnippet = firstParagraphMatch[1].replace(/<[^>]*>/g, "").trim();
              if (textSnippet.length > 50) {
                cached.data[artIdx].contentSnippet = textSnippet.substring(0, 220) + "...";
              }
            }
            console.log(`Updated cache entry for "${title.substring(0, 30)}..." under key: ${cacheKey}`);
          }
        }
        
        return res.json({ enrichedContent: enrichedHtml });
      }
    }
    
    return res.status(500).json({ error: "Failed to generate valid enrichment content" });
  } catch (error: any) {
    console.error("Error in on-demand enrichment:", error.message || error);
    res.status(500).json({ error: "Failed to enrich article", details: error.message || error });
  }
});

// API routes FIRST
app.get("/api/news", async (req, res) => {
  try {
    const topic = (req.query.topic as string) || "latest";
    const lang = (req.query.lang as string) || "es";
    
    // For media topics (videos and podcasts), use media parser with player embeddings
    if (topic === "videos" || topic === "podcasts") {
      const articles = await fetchArticlesInternal(topic, lang);
      return res.json({ articles: ensureUniqueArticlesImages(articles, topic), translationFailed: false });
    }

    // For editorial news topics (latest, ai, hardware, software, gadgets):
    // Retrieve directly from the persistent InnovaTech database (0 tokens spent on page views)
    const stored = getAllArticles(topic, lang);
    if (stored && stored.length > 0) {
      return res.json({ articles: ensureUniqueArticlesImages(stored, topic), translationFailed: false, fromDatabase: true });
    }

    // Fallback: if database has not yet been populated for a specific filter, fetch and persist
    const articles = await fetchArticlesInternal(topic, lang);
    res.json({ articles: ensureUniqueArticlesImages(articles, topic), translationFailed: false });
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// Search API Endpoint - queries stored database directly (0 tokens, instant search)
app.get("/api/search", async (req, res) => {
  try {
    const q = (req.query.q as string || "").trim().toLowerCase();
    const lang = (req.query.lang as string) || "es";
    
    if (!q) {
      return res.json({ articles: [] });
    }
    
    const results = searchStoredArticles(q, lang);
    res.json({ articles: ensureUniqueArticlesImages(results, 'latest') });
  } catch (error) {
    console.error("Error searching news:", error);
    res.status(500).json({ error: "Failed to search news" });
  }
});

// Admin / Sync API Endpoint: view sync status or trigger deduplicated daily ingest
app.get("/api/sync-status", (req, res) => {
  res.json(getSyncStatus());
});

app.post("/api/sync-news", async (req, res) => {
  try {
    const force = req.query.force === "true" || req.body?.force === true;
    const aiClient = getAI();
    const result = await runDailyEditorialIngest(aiClient, force);
    res.json({ success: true, ...result, status: getSyncStatus() });
  } catch (err: any) {
    console.error("Sync news error:", err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// Dedicated routes to serve the Privacy Policy directly as a beautiful standalone page (prevents 404s and fully complies with Google Play Store requirements)
app.get(["/privacy", "/privacy.html"], (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidad - InnovaTech Noticias</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
  <script>
    function toggleLanguage(lang) {
      if (lang === 'es') {
        document.getElementById('content-es').classList.remove('hidden');
        document.getElementById('content-en').classList.add('hidden');
        document.getElementById('btn-es').classList.add('bg-blue-600', 'text-white');
        document.getElementById('btn-es').classList.remove('bg-gray-200', 'text-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300');
        document.getElementById('btn-en').classList.add('bg-gray-200', 'text-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300');
        document.getElementById('btn-en').classList.remove('bg-blue-600', 'text-white');
      } else {
        document.getElementById('content-es').classList.add('hidden');
        document.getElementById('content-en').classList.remove('hidden');
        document.getElementById('btn-en').classList.add('bg-blue-600', 'text-white');
        document.getElementById('btn-en').classList.remove('bg-gray-200', 'text-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300');
        document.getElementById('btn-es').classList.add('bg-gray-200', 'text-gray-700', 'dark:bg-gray-800', 'dark:text-gray-300');
        document.getElementById('btn-es').classList.remove('bg-blue-600', 'text-white');
      }
    }
  </script>
</head>
<body class="bg-slate-50 text-slate-900 transition-colors duration-200 min-h-screen">
  <div class="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
    <!-- Header Card -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shadow-sm">
          iT
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">InnovaTech Noticias</h1>
          <p class="text-xs text-slate-500 font-medium">Identificador: <span class="font-bold text-slate-700">com.mobilezonne.innovatech</span></p>
        </div>
      </div>
      
      <!-- Language Selector -->
      <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
        <button id="btn-es" onclick="toggleLanguage('es')" class="px-4 py-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-sm">Español</button>
        <button id="btn-en" onclick="toggleLanguage('en')" class="px-4 py-2 text-xs font-bold rounded-lg transition-all text-slate-700 hover:text-slate-950">English</button>
      </div>
    </div>

    <!-- SPANISH CONTENT -->
    <main id="content-es" class="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 space-y-8">
      <div>
        <h2 class="text-2xl font-black text-slate-950 tracking-tight border-b pb-4 border-slate-100">Política de Privacidad</h2>
        <p class="text-xs text-slate-400 mt-2 font-medium">Última actualización: Julio 2026</p>
      </div>

      <div class="space-y-4">
        <p class="text-sm text-slate-600 leading-relaxed font-medium">
          En <strong>InnovaTech Noticias</strong> ("nosotros", "nuestro"), valoramos profundamente tu privacidad y la seguridad de tus datos. Esta Política de Privacidad explica de manera transparente cómo recopilamos, utilizamos, almacenamos y protegemos tu información cuando utilizas nuestra aplicación móvil <strong>InnovaTech (com.mobilezonne.innovatech)</strong>.
        </p>
        <p class="text-sm text-slate-600 leading-relaxed font-medium">
          Nuestra aplicación ofrece servicios interactivos de noticias tecnológicas, videos y podcasts. Al utilizar nuestra App, aceptas las prácticas descritas en este documento. Cumplimos estrictamente con las directrices para desarrolladores de Google Play y las normativas de protección de datos aplicables.
        </p>
      </div>

      <!-- Section 1 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          1. Información que Recopilamos
        </h3>
        <div class="pl-3.5 space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
          <p><strong>Información de Cuenta (Google Sign-In):</strong> Si decides registrarte e iniciar sesión con tu cuenta de Google, recopilamos de manera segura tu nombre, dirección de correo electrónico y URL de imagen de perfil. Esto es necesario para personalizar tu perfil, habilitar los comentarios de la comunidad y sincronizar tus datos en la nube.</p>
          <p><strong>Datos de Uso e Historial:</strong> Para mejorar tu experiencia de lectura y ofrecerte mejores recomendaciones de noticias, registramos de forma local (y en la nube si estás autenticado) el historial de noticias leídas, videos vistos y episodios de podcasts reproducidos.</p>
          <p><strong>Contenido Generado por el Usuario:</strong> Almacenamos de forma segura en nuestra base de datos los comentarios y respuestas que publicas en los artículos, vinculados de forma transparente a tu perfil de usuario.</p>
          <p><strong>Datos de Dispositivo y Anuncios (Google AdMob):</strong> La aplicación utiliza Google AdMob para mostrar publicidad. AdMob puede recopilar el ID de publicidad de Android (Advertising ID), dirección IP, identificadores de dispositivo y datos de rendimiento de red para ofrecer anuncios personalizados o generales de acuerdo con las normativas de consentimiento de Google.</p>
        </div>
      </section>

      <!-- Section 2 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          2. Cómo Utilizábamos tus Datos
        </h3>
        <ul class="pl-7 list-disc space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
          <li>Para proporcionar, mantener y mejorar los servicios interactivos de InnovaTech Noticias.</li>
          <li>Sincronizar tus preferencias de idioma, temas favoritos, historial de lectura y comentarios entre múltiples dispositivos mediante Firebase Firestore de manera segura.</li>
          <li>Gestionar y moderar las interacciones de la comunidad (comentarios y respuestas).</li>
          <li>Mostrar anuncios adaptados o generales a través de Google AdMob, respetando tus configuraciones de personalización.</li>
          <li>Enviar notificaciones automáticas relevantes sobre respuestas a tus comentarios o noticias urgentes.</li>
        </ul>
      </section>

      <!-- Section 3 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          3. Servicios de Terceros
        </h3>
        <div class="pl-3.5 space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
          <p>Para garantizar un servicio seguro y estable, integramos los siguientes servicios de confianza de Google:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li><strong>Firebase (Google LLC):</strong> Utilizado para la autenticación de usuarios de forma segura y el almacenamiento de bases de datos de Firestore cifradas.</li>
            <li><strong>Google AdMob (Google LLC):</strong> Integrado para mostrar anuncios publicitarios respetando las políticas de publicidad.</li>
            <li><strong>YouTube API Services:</strong> Para reproducir videos informativos y tutoriales integrados en el feed de noticias.</li>
          </ul>
        </div>
      </section>

      <!-- Section 4 -->
      <section class="space-y-3 bg-red-50/30 border border-red-100 p-5 rounded-2xl">
        <h3 class="text-base font-extrabold text-red-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-red-600 rounded-full"></span>
          4. Requisito de Eliminación de Cuentas y Datos (Google Play Compliance)
        </h3>
        <div class="pl-3.5 space-y-3 text-sm text-slate-700 leading-relaxed font-semibold">
          <p>
            En total conformidad con los estrictos requisitos de datos de usuario de <strong>Google Play</strong>, proporcionamos un método claro y accesible para que los usuarios soliciten y ejecuten la eliminación completa de su cuenta y todos los datos asociados de forma inmediata.
          </p>
          <p>
            <strong>Cómo eliminar tu cuenta y datos desde la App:</strong>
          </p>
          <ol class="list-decimal pl-5 space-y-1 text-slate-600 font-medium">
            <li>Abre la aplicación móvil <strong>InnovaTech</strong>.</li>
            <li>Abre el Menú lateral deslizante en la esquina izquierda.</li>
            <li>Haz clic en el botón con texto rojo <strong>"Eliminar Cuenta y Datos"</strong>.</li>
            <li>Confirma tu decisión en la ventana emergente.</li>
          </ol>
          <p class="font-bold text-red-700">
            Consecuencias de la eliminación: Al confirmar, tu perfil de usuario, historial de lectura, preferencias, marcadores y todos tus comentarios y respuestas serán eliminados permanentemente de nuestros servidores en la nube de forma irreversible e inmediata.
          </p>
          <p class="text-xs font-medium text-slate-500">
            También puedes solicitar la eliminación enviando un correo electrónico directamente a nuestro soporte de privacidad en <a href="mailto:privacidad@innovatech.fun" class="text-blue-600 underline">privacidad@innovatech.fun</a>. Procesaremos y eliminaremos tus datos en un plazo máximo de 24 horas.
          </p>
        </div>
      </section>

      <!-- Section 5 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          5. Privacidad Infantil
        </h3>
        <p class="pl-3.5 text-sm text-slate-600 leading-relaxed font-medium">
          Nuestra aplicación está dirigida a un público general interesado en tecnología. No recopilamos conscientemente ninguna información de identificación personal de niños menores de 13 años. Si detectamos que un menor de 13 años nos ha proporcionado datos personales, procederemos a eliminarlos de forma inmediata de nuestros servidores.
        </p>
      </section>

      <!-- Section 6 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          6. Contacto y Soporte
        </h3>
        <p class="pl-3.5 text-sm text-slate-600 leading-relaxed font-medium">
          Si tienes cualquier pregunta, inquietud o reclamación relacionada con esta Política de Privacidad o la gestión de tus datos personales, puedes ponerte en contacto con nuestro oficial de privacidad en cualquier momento:
          <br>
          <span class="block mt-2 font-bold text-slate-900">Correo Electrónico: <a href="mailto:privacidad@innovatech.fun" class="text-blue-600 hover:underline">privacidad@innovatech.fun</a></span>
        </p>
      </section>

      <div class="border-t pt-6 text-center text-xs text-slate-400 font-bold">
        © 2026 InnovaTech Noticias. Todos los derechos reservados.
      </div>
    </main>

    <!-- ENGLISH CONTENT -->
    <main id="content-en" class="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 space-y-8 hidden">
      <div>
        <h2 class="text-2xl font-black text-slate-950 tracking-tight border-b pb-4 border-slate-100">Privacy Policy</h2>
        <p class="text-xs text-slate-400 mt-2 font-medium">Last updated: July 2026</p>
      </div>

      <div class="space-y-4">
        <p class="text-sm text-slate-600 leading-relaxed font-medium">
          At <strong>InnovaTech News</strong> ("we", "our"), we deeply value your privacy and data security. This Privacy Policy outlines how we collect, use, store, and protect your information when you use our mobile application <strong>InnovaTech (com.mobilezonne.innovatech)</strong>.
        </p>
        <p class="text-sm text-slate-600 leading-relaxed font-medium">
          Our application provides technology news, video summaries, and podcasts. By using our App, you consent to the practices described here. We strictly comply with Google Play Developer Policies and applicable data protection regulations.
        </p>
      </div>

      <!-- Section 1 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          1. Information We Collect
        </h3>
        <div class="pl-3.5 space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
          <p><strong>Account Information (Google Sign-In):</strong> If you choose to register and sign in with your Google account, we securely collect your name, email address, and profile picture URL to personalize your profile, enable interactive comments, and sync your data securely across multiple devices.</p>
          <p><strong>Usage Data and History:</strong> To improve your reading feed, we log your read news, watched videos, and played podcasts locally (and in the cloud if authenticated).</p>
          <p><strong>User-Generated Content:</strong> We store comments and replies you write on articles, linked transparently to your user profile.</p>
          <p><strong>Device and Advertisement Data (Google AdMob):</strong> The App utilizes Google AdMob to display advertisements. AdMob may collect Android Advertising IDs, IP addresses, device identifiers, and network performance data in line with Google's consent guidelines.</p>
        </div>
      </section>

      <!-- Section 2 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          2. How We Use Your Data
        </h3>
        <ul class="pl-7 list-disc space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
          <li>To provide, maintain, and improve InnovaTech's interactive services.</li>
          <li>To safely sync your language, topic preferences, reading history, and comments across devices using Firebase Firestore.</li>
          <li>To manage and moderate community discussions (comments and replies).</li>
          <li>To display tailored or general advertisements via Google AdMob.</li>
          <li>To send relevant push notifications regarding replies to your comments or breaking tech news.</li>
        </ul>
      </section>

      <!-- Section 3 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          3. Third-Party Services
        </h3>
        <div class="pl-3.5 space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
          <p>To ensure secure and reliable operations, we integrate the following trusted Google services:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li><strong>Firebase (Google LLC):</strong> Used for secure user authentication and Firestore database storage.</li>
            <li><strong>Google AdMob (Google LLC):</strong> Used to monetize our app through banner advertisements complying with Google's advertising guidelines.</li>
            <li><strong>YouTube API Services:</strong> Embedded to play technical video content directly within the articles.</li>
          </ul>
        </div>
      </section>

      <!-- Section 4 -->
      <section class="space-y-3 bg-red-50/30 border border-red-100 p-5 rounded-2xl">
        <h3 class="text-base font-extrabold text-red-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-red-600 rounded-full"></span>
          4. Account and Data Deletion Requirement (Google Play Compliance)
        </h3>
        <div class="pl-3.5 space-y-3 text-sm text-slate-700 leading-relaxed font-semibold">
          <p>
            In full compliance with <strong>Google Play's User Data policy</strong>, we provide a prominent and accessible in-app mechanism for users to request and execute the permanent deletion of their account and all associated user data.
          </p>
          <p>
            <strong>How to delete your account and data:</strong>
          </p>
          <ol class="list-decimal pl-5 space-y-1 text-slate-600 font-medium">
            <li>Open the <strong>InnovaTech</strong> app on your device.</li>
            <li>Open the side drawer Menu on the left.</li>
            <li>Click the red <strong>"Eliminar Cuenta y Datos"</strong> (Delete Account & Data) button.</li>
            <li>Confirm your request in the dialog box.</li>
          </ol>
          <p class="font-bold text-red-700">
            Consequences of deletion: Upon confirmation, your user profile, reading history, preferences, bookmarks, and all comments/replies will be immediately and permanently purged from our Firebase servers.
          </p>
          <p class="text-xs font-medium text-slate-500">
            You can also submit a data deletion request by emailing us directly at <a href="mailto:privacidad@innovatech.fun" class="text-blue-600 underline">privacidad@innovatech.fun</a>. We will process and delete your data within 24 hours.
          </p>
        </div>
      </section>

      <!-- Section 5 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          5. Children's Privacy
        </h3>
        <p class="pl-3.5 text-sm text-slate-600 leading-relaxed font-medium">
          InnovaTech News is designed for a general audience. We do not knowingly collect personal data from children under the age of 13. If we discover a child under 13 has provided personal information, we will immediately delete it from our systems.
        </p>
      </section>

      <!-- Section 6 -->
      <section class="space-y-3">
        <h3 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
          <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          6. Contact Us
        </h3>
        <p class="pl-3.5 text-sm text-slate-600 leading-relaxed font-medium">
          If you have any questions, concerns, or requests regarding this Privacy Policy or your data rights, please contact us at:
          <br>
          <span class="block mt-2 font-bold text-slate-900">Email: <a href="mailto:privacidad@innovatech.fun" class="text-blue-600 hover:underline">privacidad@innovatech.fun</a></span>
        </p>
      </section>

      <div class="border-t pt-6 text-center text-xs text-slate-400 font-bold">
        © 2026 InnovaTech News. All rights reserved.
      </div>
    </main>
  </div>
</body>
</html>
  `);
});

app.post("/api/translate", async (req, res) => {
  try {
    const { text, lang, isHtml } = req.body;
    if (!text || !lang || lang === 'en') {
      return res.json({ translatedText: text || "" });
    }
    const aiClient = getAI();
    if (!aiClient) {
      return res.json({ translatedText: text || "" });
    }

    // Truncate translation text to prevent timeouts and over-billing
    let textToTranslate = text;
    if (textToTranslate.length > 4000) {
      textToTranslate = textToTranslate.substring(0, 4000) + "...";
    }

    const prompt = `Translate the following ${isHtml ? 'HTML content' : 'text'} into the language code "${lang}". ${isHtml ? 'Preserve all HTML tags and structure exactly as they are. Do not wrap with markdown blocks.' : ''}

Content to translate:
${textToTranslate}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    let translated = response.text || textToTranslate;
    if (isHtml) {
      translated = translated.replace(/^```html\n/, '').replace(/\n```$/, '');
    }

    res.json({ translatedText: translated });
  } catch (error: any) {
    console.error("Translation API error:", error.message || "Unknown error");
    // Completely bulletproof fallback
    res.json({ translatedText: req.body?.text || "" });
  }
});

// Unhandled API routes error handler (returns clean JSON 404)
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `El endpoint API ${req.method} ${req.path} no existe.`
  });
});

// Global Express Error Handler Middleware to prevent server crashes and return elegant HTML/JSON error reports
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled server error:", err);
  if (req.path.startsWith("/api/")) {
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "production" ? "Ha ocurrido un error inesperado." : err.message
    });
  } else {
    res.status(500).send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error 500 - InnovaTech Noticias</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
    <div class="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">
      500
    </div>
    <div class="space-y-2">
      <h1 class="text-xl font-extrabold tracking-tight text-slate-950">Error Interno del Servidor</h1>
      <p class="text-xs text-slate-500 font-medium">Lo sentimos, ha ocurrido un error inesperado al procesar tu solicitud.</p>
    </div>
    <a href="/" class="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all">
      Volver al Inicio
    </a>
  </div>
</body>
</html>
    `);
  }
});

async function startServer() {
  // Initialize persistent articles database
  initArticlesDatabase();

  // Run daily editorial ingestion in the background (respects 24h interval and skips existing news with 0 token spend)
  setTimeout(() => {
    runDailyEditorialIngest(getAI(), false).catch((err) => {
      console.warn("Initial daily ingestion background check:", err.message || err);
    });
  }, 3000);

  // Set recurring 12-hour background check to ensure once-a-day ingestion
  setInterval(() => {
    runDailyEditorialIngest(getAI(), false).catch((err) => {
      console.warn("Scheduled daily ingestion check:", err.message || err);
    });
  }, 12 * 60 * 60 * 1000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
