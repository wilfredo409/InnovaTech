const fs = require('fs');
const path = require('path');

const articlesPath = path.join(__dirname, '..', 'data', 'innovatech_articles.json');
let articles = [];
if (fs.existsSync(articlesPath)) {
  articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
} else {
  const initialPath = path.join(__dirname, '..', 'src', 'data', 'initialArticles.ts');
  const content = fs.readFileSync(initialPath, 'utf8');
  const jsonMatch = content.match(/INITIAL_ARTICLES:\s*Article\[\]\s*=\s*(\[[\s\S]*\]);/);
  if (jsonMatch) {
    articles = eval(jsonMatch[1]);
  }
}

const today = new Date().toISOString().split('T')[0];

// Only canonical Spanish categories
const canonicalTopics = [
  { slug: 'ia', alt: 'ai', priority: '0.85' },
  { slug: 'hardware', priority: '0.85' },
  { slug: 'software', priority: '0.85' },
  { slug: 'gadgets', priority: '0.85' },
  { slug: 'ciberseguridad', alt: 'cybersecurity', priority: '0.85' }
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Core Institutional Pages (Spanish Canonical) -->
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
`;

// Canonical Category Sections
canonicalTopics.forEach(t => {
  xml += `  <url>
    <loc>https://innovatech.fun/categoria/${t.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${t.priority}</priority>
  </url>
`;
  if (t.alt) {
    xml += `  <url>
    <loc>https://innovatech.fun/categoria/${t.alt}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.80</priority>
  </url>
`;
  }
});

// Sort articles chronologically descending (newest first)
const sortedArticles = [...articles].sort((a, b) => {
  const dateA = new Date(a.pubDate || '2026-09-01').getTime();
  const dateB = new Date(b.pubDate || '2026-09-01').getTime();
  return dateB - dateA;
});

// All Article Entries with natural September 2026 progression
sortedArticles.forEach(art => {
  let pubDate = today;
  try {
    if (art.pubDate) {
      pubDate = new Date(art.pubDate).toISOString().split('T')[0];
    }
  } catch (e) {
    pubDate = today;
  }
  const cleanTitle = (art.title || 'Noticia Tecnológica')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  xml += `  <url>
    <loc>https://innovatech.fun/articulo/${encodeURIComponent(art.id)}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;

  if (art.imageUrl) {
    const cleanImg = art.imageUrl.replace(/&/g, '&amp;');
    xml += `
    <image:image>
      <image:loc>${cleanImg}</image:loc>
      <image:title>${cleanTitle}</image:title>
    </image:image>`;
  }

  xml += `
  </url>
`;
});

xml += `</urlset>\n`;

const publicDest = path.join(__dirname, '..', 'public', 'sitemap.xml');
fs.writeFileSync(publicDest, xml, 'utf8');

const distDest = path.join(__dirname, '..', 'dist', 'sitemap.xml');
if (fs.existsSync(path.dirname(distDest))) {
  fs.writeFileSync(distDest, xml, 'utf8');
}

console.log(`[Sitemap] Generated clean Spanish canonical sitemap.xml with ${sortedArticles.length} chronologically sorted articles.`);
