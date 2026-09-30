const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.error("dist folder not found. Run vite build first.");
  process.exit(1);
}

const articlesFile = path.join(__dirname, '..', 'data', 'innovatech_articles.json');
let articles = [];
if (fs.existsSync(articlesFile)) {
  try {
    articles = JSON.parse(fs.readFileSync(articlesFile, 'utf-8'));
  } catch (e) {
    console.error("Failed to parse articles JSON:", e);
  }
}

const TOPIC_LABELS = {
  ai: 'Inteligencia Artificial',
  hardware: 'Hardware y Componentes',
  software: 'Software y Desarrollo',
  gadgets: 'Gadgets y Móviles',
  cybersecurity: 'Ciberseguridad',
  latest: 'Últimas Noticias'
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanTitle(title) {
  return (title || 'Noticia Tecnológica')
    .replace(/[<>"]/g, '')
    .trim();
}

// 1. Generate Category Pages (e.g. /categoria/ai/index.html)
const topics = ['ai', 'hardware', 'software', 'gadgets', 'cybersecurity', 'latest'];

topics.forEach(topic => {
  const topicName = TOPIC_LABELS[topic] || 'Tecnología';
  const topicArticles = articles.filter(a => (a.topic || 'latest').toLowerCase() === topic || topic === 'latest');
  const displayArticles = topicArticles.length ? topicArticles.slice(0, 30) : articles.slice(0, 30);

  const cardsHtml = displayArticles.map(art => {
    const rawTitle = cleanTitle(art.title);
    const cleanDesc = ((art.contentSnippet || "").replace(/<[^>]*>/g, '').replace(/"/g, '&quot;')).slice(0, 160);
    return `
      <article style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${art.imageUrl ? `<div style="margin-bottom: 16px; border-radius: 12px; overflow: hidden; height: 180px;"><img src="${art.imageUrl}" alt="${rawTitle}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" /></div>` : ''}
          <span style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase;">${art.categories?.[0] || topicName}</span>
          <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 8px 0 12px 0; line-height: 1.35;">
            <a href="/articulo/${encodeURIComponent(art.id)}" style="color: #0f172a; text-decoration: none;">${rawTitle}</a>
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
    <link rel="canonical" href="https://innovatech.fun/categoria/${topic}" />
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
            <a href="/acerca-de" style="color: #64748b; text-decoration: none;">Acerca de</a>
            <a href="/contacto" style="color: #64748b; text-decoration: none;">Contacto</a>
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
            <a href="/privacidad" style="color: #2563eb; text-decoration: none;">Privacidad</a>
            <a href="/terminos" style="color: #2563eb; text-decoration: none;">Términos</a>
            <a href="/contacto" style="color: #2563eb; text-decoration: none;">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  </body>
</html>`;

  // Write to dist/categoria/[topic]/index.html
  const catDir = path.join(distDir, 'categoria', topic);
  ensureDir(catDir);
  fs.writeFileSync(path.join(catDir, 'index.html'), html, 'utf-8');

  // Also write to dist/category/[topic]/index.html
  const catAltDir = path.join(distDir, 'category', topic);
  ensureDir(catAltDir);
  fs.writeFileSync(path.join(catAltDir, 'index.html'), html, 'utf-8');
});

// 2. Generate Articles Pages (e.g. /articulo/[id]/index.html)
let articleCount = 0;
articles.forEach(article => {
  const rawTitle = cleanTitle(article.title);
  const cleanSnippet = ((article.contentSnippet || "").replace(/<[^>]*>/g, '').replace(/"/g, '&quot;')).slice(0, 160);
  const articleUrl = `https://innovatech.fun/articulo/${encodeURIComponent(article.id)}`;

  const articleHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${rawTitle} | InnovaTech</title>
    <meta name="description" content="${cleanSnippet}" />
    <link rel="canonical" href="${articleUrl}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta property="og:title" content="${rawTitle}" />
    <meta property="og:description" content="${cleanSnippet}" />
    <meta property="og:url" content="${articleUrl}" />
    <meta property="og:type" content="article" />
    ${article.imageUrl ? `<meta property="og:image" content="${article.imageUrl}" />` : ''}
    <meta name="google-adsense-account" content="ca-pub-9020993400158462" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9020993400158462" crossorigin="anonymous"></script>
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/jpeg" href="/icon.jpg" />
  </head>
  <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #ffffff; margin: 0; padding: 0;">
    <header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; position: sticky; top: 0; z-index: 40;">
      <div style="max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
        <a href="/" style="text-decoration: none; color: #2563eb; font-size: 24px; font-weight: 900;">InnovaTech</a>
        <a href="/" style="text-decoration: none; font-size: 13px; font-weight: 700; color: #2563eb;">← Volver al Inicio</a>
      </div>
    </header>
    <main style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
      <span style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase;">${TOPIC_LABELS[article.topic] || 'Tecnología'}</span>
      <h1 style="font-size: 32px; font-weight: 900; line-height: 1.25; margin: 12px 0 16px 0; color: #0f172a;">${rawTitle}</h1>
      <div style="display: flex; gap: 16px; font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
        <span>Por <strong>${article.creator || 'Redacción InnovaTech'}</strong></span>
        <span>•</span>
        <time datetime="${article.pubDate}">${new Date(article.pubDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
      </div>
      ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${rawTitle}" style="width: 100%; border-radius: 16px; margin-bottom: 32px; max-height: 480px; object-fit: cover;" />` : ''}
      <div style="font-size: 16px; line-height: 1.8; color: #334155;">
        ${article.content || `<p>${cleanSnippet}</p>`}
      </div>
      <div style="margin-top: 40px; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center;">
        <h3 style="font-size: 16px; font-weight: 800; margin: 0 0 8px 0;">¿Te gustó este artículo?</h3>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">Explora más análisis tecnológicos actualizados en nuestra portada.</p>
        <a href="/" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Ver más noticias</a>
      </div>
    </main>
    <footer style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 13px; color: #64748b; margin-top: 60px;">
      © 2026 InnovaTech. Todos los derechos reservados.
    </footer>
  </body>
</html>`;

  const artDir = path.join(distDir, 'articulo', encodeURIComponent(article.id));
  ensureDir(artDir);
  fs.writeFileSync(path.join(artDir, 'index.html'), articleHtml, 'utf-8');
  articleCount++;
});

console.log(`[SSG Prerender] Pre-rendered ${topics.length} category pages and ${articleCount} article pages into dist/ successfully.`);
