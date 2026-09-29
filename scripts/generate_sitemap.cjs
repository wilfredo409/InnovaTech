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

const topics = ['ai', 'hardware', 'software', 'gadgets', 'cybersecurity', 'podcasts', 'videos', 'events', 'reviews'];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <!-- Core Portal Pages -->
  <url>
    <loc>https://innovatech.fun/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/acerca-de.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/acerca-de</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/contacto.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/contacto</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/privacy.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/terminos.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://innovatech.fun/terminos</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

// Category Sections
topics.forEach(t => {
  xml += `  <url>
    <loc>https://innovatech.fun/categoria/${t}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
`;
});

// All Article Entries
articles.forEach(art => {
  let pubDate = today;
  try {
    if (art.pubDate) {
      pubDate = new Date(art.pubDate).toISOString().split('T')[0];
    }
  } catch (e) {
    pubDate = today;
  }
  const cleanTitle = (art.title || 'Noticia Tecnológica').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
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

fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), xml, 'utf8');
console.log(`Generated sitemap.xml with ${articles.length} articles and ${topics.length} category sections.`);
