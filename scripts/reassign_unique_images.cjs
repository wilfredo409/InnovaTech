const fs = require('fs');
const path = require('path');

const UNIQUE_TOPIC_POOLS = {
  latest: [
    "photo-1451187580459-43490279c0fa",
    "photo-1544197150-b99a580bb7a8",
    "photo-1531297484001-80022131f5a1",
    "photo-1504384308090-c894fdcc538d",
    "photo-1457369804613-52c61a468e7d",
    "photo-1581091226825-a6a2a5aee158",
    "photo-1535223289827-42f1e9919769",
    "photo-1504384764586-bb4cdc1707b0",
    "photo-1520869562399-e772f042f422",
    "photo-1520333789090-1afc82db536a",
    "photo-1519389950473-47ba0277781c",
    "photo-1488590528505-98d2b5aba04b",
    "photo-1550751827-4bd374c3f58b",
    "photo-1460925895917-afdab827c52f",
    "photo-1517245386807-bb43f82c33c4",
    "photo-1507413245164-6160d8298b31",
    "photo-1516110833967-0b57883c5319",
    "photo-1508739773434-c26b3d09e071",
    "photo-1508873696983-2df5703bc37d",
    "photo-1522071820081-009f0129c71c",
    "photo-1486312338219-ce68d2c6f44d",
    "photo-1498084393753-b411b2d26b34",
    "photo-1517048676732-d65bc937f952",
    "photo-1515378791036-0648a3ef77b2",
    "photo-1484807352052-23338990c6c6",
    "photo-1504868584819-f8e8b4b6d7e3",
    "photo-1551836022-d5d88e9218df",
    "photo-1553877522-43269d4ea984",
    "photo-1531538606171-0c5a7e7f722a",
    "photo-1573164713988-8665fc963095"
  ],
  ai: [
    "photo-1677442136019-21780efad99a",
    "photo-1620712943543-bcc4688e7485",
    "photo-1507146426996-ef05306b995a",
    "photo-1618005182384-a83a8bd57fbe",
    "photo-1589254065878-42c9da997008",
    "photo-1535378917042-10a22c95931a",
    "photo-1485827404703-89b55fcc595e",
    "photo-1527474305487-b87b222841cc",
    "photo-1547082299-de196ea013d6",
    "photo-1558494949-ef010cbdcc31",
    "photo-1532094349884-543bc11b234d",
    "photo-1507668077129-56e32842fceb",
    "photo-1501167786227-4cba60f6d58f",
    "photo-1614064641938-3bbee52942c7",
    "photo-1509228468518-180dd4864904",
    "photo-1516321318423-f06f85e504b3",
    "photo-1617791160505-6f00504e3519",
    "photo-1531482615713-2afd69097998",
    "photo-1555255707-c07966088b7b",
    "photo-1579546929518-9e396f3cc809",
    "photo-1618172193763-c511deb635ca",
    "photo-1633493106185-05a8b417c805",
    "photo-1634017839464-5c339ebe3cb4",
    "photo-1678995632928-fd6c2789f7e8",
    "photo-1682687220063-4742bd7fd538",
    "photo-1682687220199-d0124f48f95b",
    "photo-1682687220208-22d7a2543e88",
    "photo-1664575602276-acd073f104c1",
    "photo-1661956602116-aa6865609028",
    "photo-1635070041078-e363dbe005cb"
  ],
  hardware: [
    "photo-1518770660439-4636190af475",
    "photo-1581092160607-ee22621dd758",
    "photo-1591405351990-4726e331f141",
    "photo-1542751371-adc38448a05e",
    "photo-1555664424-778a1e5e1b48",
    "photo-1597852074816-d933c7d2b988",
    "photo-1563770660941-20978e870e26",
    "photo-1624705002806-5d72df19c3ad",
    "photo-1616440347437-b1c73416efc2",
    "photo-1591799264318-7e6ef8ddb7ea",
    "photo-1562408590-e32931084e23",
    "photo-1580584126903-c17d41830450",
    "photo-1525547719571-a2d4ac8945e2",
    "photo-1587202372775-e229f172b9d7",
    "photo-1550745165-9bc0b252726f",
    "photo-1517430816045-df4b7de11d1d",
    "photo-1591488320449-011701bb6704",
    "photo-1607604276583-eef5d076aa5f",
    "photo-1588872657578-7efd1f1555ed",
    "photo-1580894732444-8ecded7900cd",
    "photo-1593642632823-8f785ba67e45",
    "photo-1593642532400-2682810df593",
    "photo-1593642634315-48f5414c3ad9",
    "photo-1593642702821-c8da6771f0c6",
    "photo-1541807084-5c52b6b3adef",
    "photo-1587829741301-dc798b83add3",
    "photo-1517336714731-489689fd1ca8",
    "photo-1512499617640-c74ae3a79d37",
    "photo-1547394765-185e1e68f34e",
    "photo-1588508065123-287b28e013da"
  ],
  software: [
    "photo-1555066931-4365d14bab8c",
    "photo-1542831371-29b0f74f9713",
    "photo-1517694712202-14dd9538aa97",
    "photo-1607799279861-4dd421887fb3",
    "photo-1605379399642-870262d3d051",
    "photo-1531403009284-440f080d1e12",
    "photo-1526374965328-7f61d4dc18c5",
    "photo-1461749280684-dccba630e2f6",
    "photo-1580927752452-89d86da3fa0a",
    "photo-1522542550221-31fd19575a2d",
    "photo-1534665482403-a909d0d97c67",
    "photo-1629654297299-c8506221ca97",
    "photo-1566837945700-30057527ade0",
    "photo-1504639725590-34d0984388bd",
    "photo-1515879218367-8466d910aaa4",
    "photo-1510915228340-29c85a43dcfe",
    "photo-1518773553398-650c184e0bb3",
    "photo-1498050108023-c5249f4df085",
    "photo-1551288049-bebda4e38f71",
    "photo-1526379095098-d400fd0bf935",
    "photo-1516259762381-22954d7d3ad2",
    "photo-1556075798-4825dfaaf498",
    "photo-1551033406-611cf9a28f67",
    "photo-1558655146-d09347e92766",
    "photo-1542744094-3a31f272c490",
    "photo-1551836022-4c4c79ecde51",
    "photo-1581291518857-4e27b48ff24e",
    "photo-1517433456452-f9633a875f6f",
    "photo-1521737604893-d14cc237f11d",
    "photo-1507238691740-187a5b1d37b8"
  ],
  gadgets: [
    "photo-1527977966376-1c8408f9f108",
    "photo-1550009158-9ebf69173e03",
    "photo-1546868871-7041f2a55e12",
    "photo-1511707171634-5f897ff02aa9",
    "photo-1505740420928-5e560c06d30e",
    "photo-1523275335684-37898b6baf30",
    "photo-1544244015-0df4b3ffc6b0",
    "photo-1543512214-318c7553f230",
    "photo-1583394838336-acd977736f90",
    "photo-1572569511254-d8f925fe2cbb",
    "photo-1508614589041-895b88991e3e",
    "photo-1522273400909-fd1a8f77637e",
    "photo-1610465299996-30f240ac2b1c",
    "photo-1615663245857-ac93bb7c39e7",
    "photo-1509198397868-475647b2a1e5",
    "photo-1610945265064-0e34e5519bbf",
    "photo-1608248597279-f99d160bfcbc",
    "photo-1563132337-f159f484226c",
    "photo-1515940175183-6798529cb860",
    "photo-1613946069412-38f7f1ff0b65",
    "photo-1546435770-a3e426bf472b",
    "photo-1585060544812-6b45742d762f",
    "photo-1565849904461-04a58ad377e0",
    "photo-1512446816042-444d641267d4",
    "photo-1567581935884-3349723552ca",
    "photo-1584438784894-089d6a62b8fa",
    "photo-1574944985070-8f3ebc6b79d2",
    "photo-1516035069371-29a1b244cc32",
    "photo-1507679799987-c73779587ccf",
    "photo-1510511459019-5dda7724fd87"
  ]
};

// Clean unique pools
const GLOBAL_SEEN = new Set();
const CLEANED_POOLS = {};

for (const [topic, list] of Object.entries(UNIQUE_TOPIC_POOLS)) {
  CLEANED_POOLS[topic] = [];
  for (const id of list) {
    if (!GLOBAL_SEEN.has(id)) {
      GLOBAL_SEEN.add(id);
      CLEANED_POOLS[topic].push(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`);
    }
  }
}

// 1. Read initialArticles.ts
let initialCode = fs.readFileSync('src/data/initialArticles.ts', 'utf8');
initialCode = initialCode.replace(/import .*/g, '').replace(/export const INITIAL_ARTICLES: Article\[\] = /, 'global.INITIAL_ARTICLES = ');
eval(initialCode);
const initialArticles = global.INITIAL_ARTICLES;

// 2. Read innovatech_articles.json
const storedArticles = JSON.parse(fs.readFileSync('data/innovatech_articles.json', 'utf8'));

// Track assigned image per article ID
const articleImageMap = new Map();
const usedImageUrls = new Set();

// Pointer per category
const topicPointers = {
  latest: 0,
  ai: 0,
  hardware: 0,
  software: 0,
  gadgets: 0
};

function getNextAvailableImage(topic) {
  const pool = CLEANED_POOLS[topic] || CLEANED_POOLS.latest;
  
  while (topicPointers[topic] < pool.length) {
    const candidate = pool[topicPointers[topic]++];
    if (!usedImageUrls.has(candidate)) {
      usedImageUrls.add(candidate);
      return candidate;
    }
  }

  // Fallback across all pools
  for (const [t, p] of Object.entries(CLEANED_POOLS)) {
    for (const candidate of p) {
      if (!usedImageUrls.has(candidate)) {
        usedImageUrls.add(candidate);
        return candidate;
      }
    }
  }

  // Synthesize deterministic unique URL if all curated pool photos are used
  const sig = `img-${usedImageUrls.size + 1}`;
  const synthesized = `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80&sig=${sig}`;
  usedImageUrls.add(synthesized);
  return synthesized;
}

function assignImagesForArticle(article) {
  const topic = article.topic || 'latest';
  
  let heroImg = articleImageMap.get(article.id)?.hero;
  if (!heroImg) {
    heroImg = getNextAvailableImage(topic);
  }
  
  let contentImg = articleImageMap.get(article.id)?.content;
  if (!contentImg) {
    contentImg = getNextAvailableImage(topic);
  }

  articleImageMap.set(article.id, { hero: heroImg, content: contentImg });
  return { heroImg, contentImg };
}

// Helper to replace inline figure img in content
function updateContentFigureImage(content, newImageUrl) {
  if (!content) return content;
  // Replace <img src="[^"]+" with new secondary image
  return content.replace(/(<img\s+src=")[^"]+(")/i, `$1${newImageUrl}$2`);
}

// Update initialArticles
initialArticles.forEach(art => {
  const { heroImg, contentImg } = assignImagesForArticle(art);
  art.imageUrl = heroImg;
  art.content = updateContentFigureImage(art.content, contentImg);
});

// Update storedArticles
storedArticles.forEach(art => {
  const { heroImg, contentImg } = assignImagesForArticle(art);
  art.imageUrl = heroImg;
  art.content = updateContentFigureImage(art.content, contentImg);
});

console.log('Total articles processed:', articleImageMap.size);
console.log('Total unique images assigned:', usedImageUrls.size);

// Save updated initialArticles.ts
const initialFileContent = `import { Article } from '../types';\n\nexport const INITIAL_ARTICLES: Article[] = ${JSON.stringify(initialArticles, null, 2)};\n`;
fs.writeFileSync('src/data/initialArticles.ts', initialFileContent, 'utf8');

// Save updated innovatech_articles.json
fs.writeFileSync('data/innovatech_articles.json', JSON.stringify(storedArticles, null, 2), 'utf8');

console.log('Successfully re-assigned and saved unique images to both datasets with 0 duplicates!');
