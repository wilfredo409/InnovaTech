import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import sanitizeHtml from 'sanitize-html';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, Firestore } from 'firebase/firestore';
import {
  cleanArticleTitle,
  getUniqueImage,
  isValidArticleImage,
  registerImageAsUsed,
  syncUsedImages,
  ensureUniqueArticlesImages,
  getImageCanonicalKey
} from './uniqueImages';
import { publishArticleToFacebook } from './facebookPublisher';

let firestoreInstance: Firestore | null = null;

function getFirestoreDB(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      firestoreInstance = getFirestore(app, config.firestoreDatabaseId);
    }
  } catch (err: any) {
    console.warn('[InnovaTech DB] Firestore initialization skipped:', err.message);
  }
  return firestoreInstance;
}

export async function syncArticleToFirestore(art: StoredArticle) {
  try {
    const db = getFirestoreDB();
    if (!db) return;
    await setDoc(doc(db, 'articles', art.id), {
      id: art.id,
      title: art.title,
      link: art.link || '',
      creator: art.creator || 'Redacción InnovaTech',
      pubDate: art.pubDate,
      content: art.content,
      contentSnippet: art.contentSnippet || '',
      categories: art.categories || [],
      imageUrl: art.imageUrl,
      sourceUrl: art.sourceUrl || art.link || '',
      topic: art.topic || 'latest',
      lang: art.lang || 'es'
    });
  } catch (err: any) {
    console.warn(`[InnovaTech DB] Error syncing article ${art.id} to Firestore:`, err.message);
  }
}

export interface StoredArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  contentSnippet: string;
  content: string;
  imageUrl: string;
  categories: string[];
  topic: string;
  lang: string;
  sourceUrl?: string;
  videoId?: string | null;
  audioUrl?: string | null;
  podcastTitle?: string | null;
  podcastCreator?: string | null;
  podcastImage?: string | null;
  episodeNumber?: string | number | null;
  seasonNumber?: string | number | null;
  podcastSummary?: string | null;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'innovatech_articles.json');
const SYNC_STATE_FILE = path.join(DATA_DIR, 'sync_state.json');

// In-memory cache for ultra-fast reading with 0 latency and 0 tokens
let articlesMemoryStore: StoredArticle[] = [];
let lastSyncTimestamp: number = 0;

// Curated high-resolution imagery assets branded for InnovaTech Media
const TOPIC_IMAGES: Record<string, string[]> = {
  ai: [
    "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80"
  ],
  hardware: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=1200&q=80"
  ],
  software: [
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80"
  ],
  gadgets: [
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"
  ],
  latest: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80"
  ]
};

// Seed articles crafted originally by InnovaTech Editorial with deep 4-paragraph journalistic analysis and inline figures
const SEED_ARTICLES: StoredArticle[] = [
  {
    id: "art-innovatech-ai-multimodal-2026",
    title: "Modelos de Inteligencia Artificial Multimodal: La Nueva Era del Procesamiento Contextual",
    link: "https://innovatech.fun/articulo/modelos-ia-multimodal-2026",
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    creator: "Equipo Editorial InnovaTech",
    contentSnippet: "Los recientes avances en arquitecturas neuronales permiten un razonamiento profundo combinando visión computacional, audio en tiempo real y análisis de código en milisegundos.",
    content: `<p>La evolución de la inteligencia artificial en el último año ha superado todas las expectativas del sector tecnológico. Con el despliegue masivo de arquitecturas neuronales optimizadas para el procesamiento multimodal simultáneo, los asistentes inteligentes ya no se limitan a predecir texto plano, sino que comprenden entornos tridimensionales, audio continuo y contextos de ingeniería de software en tiempo real con una precisión sin precedentes.</p>
<h3><strong>Avances en Eficiencia Energética e Inferencia en el Dispositivo</strong></h3>
<p>Uno de los retos fundamentales que enfrentaba la industria era el elevado consumo energético en los centros de datos masivos. Mediante técnicas innovadoras de cuantización dinámica, podado de pesos neuronales y destilación de conocimiento, los nuevos modelos pueden ejecutarse directamente en hardware local con un rendimiento antes reservado para clústeres de servidores dedicados.</p>
<figure class="my-8">
  <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80" alt="Arquitectura de Redes Neuronales e Inferencia" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Diagrama conceptual de procesamiento de datos en paralelo dentro de unidades neuronales de última generación.</figcaption>
</figure>
<p>Empresas líderes en semiconductores han integrado unidades de procesamiento neuronal (NPU) de tercera generación en procesadores móviles y de escritorio, logrando superar los <strong>50 TOPS de cómputo</strong> con un consumo térmico inferior a los 15 vatios. Esto permite a los usuarios ejecutar análisis biométricos, transcripción simultánea y generación creativa sin depender de una conexión constante a la nube ni comprometer la privacidad de sus datos.</p>
<h3><strong>Impacto en el Desarrollo de Software y la Productividad Global</strong></h3>
<p>Para la comunidad de desarrolladores e investigadores de <strong>InnovaTech</strong>, estas capacidades representan un cambio de paradigma total en los flujos de trabajo. La posibilidad de analizar depuraciones complejas, generar arquitecturas modulares y auditar la seguridad de infraestructuras críticas en milisegundos está acelerando los ciclos de lanzamiento tecnológico como nunca antes se había registrado en la historia de la informática.</p>`,
    imageUrl: TOPIC_IMAGES.ai[0],
    categories: ["Inteligencia Artificial", "Tecnología"],
    topic: "ai",
    lang: "es",
    createdAt: new Date().toISOString()
  },
  {
    id: "art-innovatech-semiconductores-3nm",
    title: "Arquitectura de Semiconductores a 3 Nanómetros y Transistores GAA",
    link: "https://innovatech.fun/articulo/semiconductores-3nm-transistores-gaa",
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    creator: "Redacción InnovaTech Hardware",
    contentSnippet: "Análisis detallado de la transición hacia transistores Gate-All-Around (GAA) y litografía ultravioleta extrema para procesadores móviles y de alto rendimiento.",
    content: `<p>La carrera por la miniaturización de transistores en la industria de semiconductores ha alcanzado un nuevo hito histórico. La implementación de la litografía ultravioleta extrema (EUV) con sistemas de alta apertura numérica permite imprimir circuitos con tolerancias subnanométricas, reduciendo drásticamente la fuga cuántica de electrones que limitaba el escalado tradicional del silicio.</p>
<h3><strong>¿Qué son los Transistores GAA y por qué superan a FinFET?</strong></h3>
<p>Durante más de una década, la tecnología FinFET dominó la fabricación de microprocesadores comerciales. Sin embargo, al descender por debajo de los 5 nanómetros, las aletas verticales de silicio perdían la capacidad de controlar adecuadamente el canal de conducción. Los nuevos transistores <strong>Gate-All-Around (GAA)</strong> envuelven completamente los nanocables o nanoláminas de silicio, otorgando un control electrostático superior y disminuyendo las pérdidas energéticas por calor disipado.</p>
<figure class="my-8">
  <img src="https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=1200&q=80" alt="Litografía y Diseño de Microchips GAA" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Estructura interna de nanoláminas apiladas en nodos de fabricación sub-2nm.</figcaption>
</figure>
<p>Esto se traduce en mejoras directas del <strong>20% al 35% en eficiencia energética</strong> respecto a generaciones previas, junto con un incremento notable en las frecuencias de reloj sostenidas. La densidad de integración resultante posibilita albergar más de 30.000 millones de transistores en un único silicio de gama alta, permitiendo memorias caché ultrarrápidas y aceleradores gráficos embebidos de alta potencia.</p>
<h3><strong>Perspectivas de Mercado y Próxima Litografía Angstrom</strong></h3>
<p>Los principales fabricantes mundiales ya han comenzado las pruebas de obleas destinadas a los nodos de 2 nanómetros y la era Angstrom (A16 y A14). En los laboratorios de prueba analizados por <strong>InnovaTech</strong>, los primeros prototipos confirman que la entrega de potencia por la cara posterior del silicio (Backside Power Delivery) será el próximo gran salto estructural para solventar los cuellos de botella de alimentación eléctrica.</p>`,
    imageUrl: TOPIC_IMAGES.hardware[0],
    categories: ["Hardware", "Ingeniería"],
    topic: "hardware",
    lang: "es",
    createdAt: new Date().toISOString()
  },
  {
    id: "art-innovatech-ciberseguridad-post-cuantica",
    title: "Criptografía Post-Cuántica: Protegiendo las Comunicaciones Globales",
    link: "https://innovatech.fun/articulo/criptografia-post-cuantica-comunicaciones",
    pubDate: new Date(Date.now() - 10800000).toISOString(),
    creator: "InnovaTech Ciberseguridad",
    contentSnippet: "Estándares criptográficos resistentes a computación cuántica y su despliegue en protocolos web, certificados SSL y redes financieras.",
    content: `<p>La seguridad informática mundial se encuentra inmersa en la mayor renovación estructural de los últimos treinta años. Con el rápido avance de los procesadores cuánticos experimentales, los algoritmos tradicionales de clave pública como RSA y las curvas elípticas corren el riesgo inminente de volverse vulnerables frente a ataques basados en el algoritmo de Shor.</p>
<h3><strong>Nuevos Estándares del NIST y Adopción en Protocolos TLS</strong></h3>
<p>Organismos internacionales de estandarización han ratificado los primeros algoritmos de <strong>criptografía basada en retículos (Lattice-based cryptography)</strong>, entre los que destacan ML-KEM para el intercambio de claves y ML-DSA para firmas digitales. Grandes navegadores web y proveedores globales de infraestructura en la nube ya han comenzado a activar esquemas híbridos en TLS 1.3 para blindar las conexiones frente al almacenamiento preventivo de datos cifrados.</p>
<figure class="my-8">
  <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80" alt="Criptografía y Algoritmos Post-Cuánticos" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Modelado matemático de retículos multidimensionales para el cifrado seguro de comunicaciones.</figcaption>
</figure>
<p>La estrategia denominada <em>'Harvest Now, Decrypt Later'</em> (recopilar hoy para descifrar en el futuro) ha impulsado a las instituciones financieras y gubernamentales a migrar sus certificados de seguridad sin demora. La combinación de algoritmos clásicos y post-cuánticos asegura que, incluso si una de las capas sufre una debilidad teórica, la confidencialidad total del canal permanezca garantizada.</p>
<h3><strong>Desafíos en la Implementación de Sistemas Heredados</strong></h3>
<p>A pesar de los avances, la transición plantea desafíos técnicos significativos debido al mayor tamaño de las claves y de los paquetes de negociación. Los ingenieros de <strong>InnovaTech</strong> destacan que la optimización de los búferes de red y la aceleración criptográfica por hardware en routers y servidores perimetrales serán esenciales para evitar incrementos perceptibles en la latencia de las transacciones digitales.</p>`,
    imageUrl: TOPIC_IMAGES.software[0],
    categories: ["Software", "Ciberseguridad"],
    topic: "software",
    lang: "es",
    createdAt: new Date().toISOString()
  },
  {
    id: "art-innovatech-gadgets-ecologicos",
    title: "Gadgets Sostenibles y Reparabilidad: Tendencias en Electrónica de Consumo",
    link: "https://innovatech.fun/articulo/gadgets-sostenibles-reparabilidad",
    pubDate: new Date(Date.now() - 14400000).toISOString(),
    creator: "Redacción InnovaTech Gadgets",
    contentSnippet: "Diseño modular, baterías reemplazables por el usuario y aluminio 100% reciclado marcan el nuevo estándar de la tecnología de consumo.",
    content: `<p>La industria de dispositivos electrónicos está experimentando una transformación profunda impulsada por las nuevas directivas internacionales de economía circular, el derecho a reparar y una exigencia creciente por parte de usuarios conscientes de la huella ecológica de sus dispositivos.</p>
<h3><strong>Baterías Reemplazables y Arquitectura Modular</strong></h3>
<p>Los principales fabricantes de teléfonos móviles, tabletas y ordenadores portátiles están abandonando progresivamente los adhesivos químicos permanentes en favor de fijaciones mecánicas y lengüetas de extracción rápida. Esto facilita enormemente el reemplazo de baterías desgastadas y paneles de pantalla sin requerir herramientas térmicas especializadas, duplicando la vida útil operativa de los terminales.</p>
<figure class="my-8">
  <img src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80" alt="Dispositivos Modulares y Reparabilidad" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Componentes y chasis desmontables diseñados para una fácil sustitución sin herramientas complejas.</figcaption>
</figure>
<p>Además, la estandarización de componentes internos desmontables con tornillería unificada permite a los usuarios y talleres independientes adquirir repuestos oficiales a precios justos. Esta modularidad reduce drásticamente la generación de residuos electrónicos y promueve un mercado de segunda vida mucho más dinámico y fiable.</p>
<h3><strong>Materiales Circulares y Huella de Carbono Neutra</strong></h3>
<p>En las pruebas de laboratorio de <strong>InnovaTech</strong>, comprobamos que el uso de aluminio 100% reciclado de grado aeroespacial, cobalto recuperado en las celdas de energía y embalajes totalmente libres de plástico son ya el estándar de excelencia para los productos de referencia del año. Esta evolución demuestra que la durabilidad y la sostenibilidad no están reñidas con el diseño premium.</p>`,
    imageUrl: TOPIC_IMAGES.gadgets[0],
    categories: ["Gadgets", "Ecológico"],
    topic: "gadgets",
    lang: "es",
    createdAt: new Date().toISOString()
  },
  {
    id: "art-innovatech-redes-wifi7",
    title: "Despliegue de Wi-Fi 7 y Conectividad de Ultra Baja Latencia",
    link: "https://innovatech.fun/articulo/redes-wifi7-ultra-baja-latencia",
    pubDate: new Date(Date.now() - 18000000).toISOString(),
    creator: "Redacción Técnica InnovaTech",
    contentSnippet: "Canales de 320 MHz, modulación 4096-QAM y operación Multi-Link (MLO) transforman la experiencia inalámbrica en hogares y entornos empresariales.",
    content: `<p>El estándar IEEE 802.11be, conocido comercialmente como <strong>Wi-Fi 7</strong>, representa el mayor salto en rendimiento y estabilidad de redes inalámbricas de los últimos cinco años. Con un ancho de banda teórico que alcanza hasta los 46 Gbps y una reducción de latencia por debajo de los 5 milisegundos, la tecnología abre la puerta a aplicaciones críticas como streaming de realidad extendida (XR) y telemedicina en tiempo real.</p>
<h3><strong>Operación Multi-Link (MLO) y Canales de 320 MHz</strong></h3>
<p>A diferencia de las generaciones previas donde un dispositivo cliente se asociaba exclusivamente a una única banda de frecuencia (2.4 GHz, 5 GHz o 6 GHz), la innovadora tecnología <strong>Multi-Link Operation (MLO)</strong> permite transmitir y recibir paquetes de datos a través de múltiples bandas de manera simultánea. Esto elimina los cuellos de botella por congestión de canal y asegura que la señal no sufra microcortes.</p>
<figure class="my-8">
  <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80" alt="Conectividad de Redes Wi-Fi 7 de Alta Velocidad" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Infraestructura de antenas beamforming para cobertura inalámbrica multicanal de 320 MHz.</figcaption>
</figure>
<p>Asimismo, la incorporación de canales ultraanchos de <strong>320 MHz</strong> y la modulación de amplitud en cuadratura <strong>4096-QAM</strong> permiten transportar un 20% más de densidad de datos en cada símbolo transmitido. Esto se traduce en transferencias de archivos masivos dentro de redes locales a velocidades equiparables a una conexión de fibra óptica directa.</p>
<h3><strong>Eficiencia en Entornos de Alta Densidad de Dispositivos</strong></h3>
<p>En pruebas de campo realizadas por el equipo técnico de <strong>InnovaTech</strong>, los nuevos routers equipados con Wi-Fi 7 demostraron una capacidad sobresaliente para gestionar simultáneamente más de un centenar de dispositivos domóticos y puestos de trabajo sin degradación de velocidad. La gestión inteligente del espectro convierte a este estándar en el pilar de la conectividad moderna.</p>`,
    imageUrl: TOPIC_IMAGES.latest[1],
    categories: ["Hardware", "Redes"],
    topic: "latest",
    lang: "es",
    createdAt: new Date().toISOString()
  },
  {
    id: "art-innovatech-open-source-os",
    title: "El Auge de los Sistemas Operativos Inmutables en Entornos de Producción",
    link: "https://innovatech.fun/articulo/sistemas-operativos-inmutables-open-source",
    pubDate: new Date(Date.now() - 21600000).toISOString(),
    creator: "Equipo Editorial InnovaTech",
    contentSnippet: "Por qué las distribuciones inmutables y los contenedores nativos están redefiniendo la estabilidad en servidores y estaciones de trabajo de desarrollo.",
    content: `<p>La arquitectura de sistemas operativos basados en un sistema de archivos raíz de solo lectura (/usr inmutable) se ha consolidado como la mejor práctica de ingeniería para garantizar que ninguna actualización corrupta, dependencia rota o comando erróneo desestabilice el núcleo del sistema principal.</p>
<h3><strong>Actualizaciones Atómicas y Reversión Instantánea (Rollback)</strong></h3>
<p>Mediante el uso de árboles de archivos versionados mediante tecnologías como OSTree y contenedores OCI nativos, cada actualización del sistema se aplica de manera estrictamente atómica. Esto significa que el sistema operativo se descarga como una imagen completa y verificada, aplicándose únicamente en el siguiente reinicio sin afectar los procesos en ejecución.</p>
<figure class="my-8">
  <img src="https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80" alt="Arquitectura de Sistemas Operativos Inmutables" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Aislamiento de capas entre el núcleo inmutable del sistema y los contenedores de aplicaciones.</figcaption>
</figure>
<p>Si surge cualquier incompatibilidad imprevista con controladores de hardware o servicios esenciales, el administrador del sistema puede reiniciar al estado previo con un único comando o selección en el cargador de arranque, reduciendo el tiempo de inactividad a cero minutos. Este nivel de resiliencia transforma radicalmente la administración de servidores en la nube y terminales de trabajo.</p>
<h3><strong>Separación Estricta entre Aplicaciones y Sistema Base</strong></h3>
<p>Las aplicaciones de usuario se ejecutan en capas aisladas mediante tecnologías de sandboxing (Flatpak, Podman o Docker), lo que previene que los paquetes de software modifiquen bibliotecas compartidas del sistema operativo. Los análisis editoriales de <strong>InnovaTech</strong> señalan que esta convergencia entre inmutabilidad y contenedorización representa el futuro definitivo del software libre para servidores e infraestructuras críticas.</p>`,
    imageUrl: TOPIC_IMAGES.software[4],
    categories: ["Software", "Open Source"],
    topic: "software",
    lang: "es",
    createdAt: new Date().toISOString()
  }
];

export function extractAllImagesFromHtml(html: string): string[] {
  if (!html) return [];
  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let url = match[1].trim();
    if (url.startsWith('http://')) url = url.replace('http://', 'https://');
    if (
      url.startsWith('https://') &&
      !url.includes('1x1') &&
      !url.includes('pixel') &&
      !url.includes('feedburner') &&
      !url.includes('gravatar.com') &&
      !url.includes('doubleclick') &&
      !url.includes('share-button') &&
      !urls.includes(url)
    ) {
      urls.push(url);
    }
  }
  return urls;
}

export function extractAllImagesFromItem(item: any): string[] {
  const images: string[] = [];
  
  if (item.mediaContent && item.mediaContent['$'] && item.mediaContent['$'].url) {
    images.push(item.mediaContent['$'].url);
  }
  if (item['media:content']) {
    if (Array.isArray(item['media:content'])) {
      item['media:content'].forEach((m: any) => {
        if (m?.$?.url) images.push(m.$.url);
      });
    } else if (item['media:content'].$ && item['media:content'].$.url) {
      images.push(item['media:content'].$.url);
    }
  }
  if (item['media:thumbnail']) {
    if (Array.isArray(item['media:thumbnail'])) {
      item['media:thumbnail'].forEach((m: any) => {
        if (m?.$?.url) images.push(m.$.url);
      });
    } else if (item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
      images.push(item['media:thumbnail'].$.url);
    }
  }
  if (item.enclosure && item.enclosure.url && (!item.enclosure.type || item.enclosure.type.startsWith('image/'))) {
    images.push(item.enclosure.url);
  }

  const htmlSources = [item['content:encoded'], item.contentEncoded, item.content, item.description, item.summary];
  for (const src of htmlSources) {
    if (typeof src === 'string') {
      const extracted = extractAllImagesFromHtml(src);
      images.push(...extracted);
    }
  }

  const valid = images
    .map(u => u.trim().replace(/^http:\/\//i, 'https://'))
    .filter(u => 
      u.startsWith('https://') &&
      !u.includes('1x1') &&
      !u.includes('pixel') &&
      !u.includes('feedburner') &&
      !u.includes('gravatar.com') &&
      !u.includes('doubleclick')
    );

  return Array.from(new Set(valid));
}

export function ensureMinimumParagraphs(art: StoredArticle, usedTracker?: Set<string>): StoredArticle {
  // 1. Sanitize the title to remove any source suffix (e.g. " - ADSLZone", " - Xataka", etc.)
  const oldTitle = (art.title || "").trim();
  const title = cleanArticleTitle(oldTitle);

  let content = (art.content || "").trim();

  // If content contained the uncleaned title, substitute with the clean title
  if (oldTitle && oldTitle !== title) {
    content = content.split(oldTitle).join(title);
  }

  // 2. Clean external feed artifacts
  content = content
    .replace(/La entrada\s+<a[^>]*>.*?<\/a>\s+aparece primero en\s+<a[^>]*>.*?<\/a>\.?/gi, "")
    .replace(/<p>\s*La entrada\s+.*?aparece primero en.*?<\/p>/gi, "")
    .replace(/<font[^>]*>.*?<\/font>/gi, "")
    .trim();

  // 3. Ensure hero image is valid and strictly unique across all articles
  const rawTopic = (art.topic || "tech").toLowerCase();
  const avoidList = usedTracker ? Array.from(usedTracker) : [];
  
  let heroImage = art.imageUrl;
  const heroCanon = heroImage ? getImageCanonicalKey(heroImage) : "";
  if (!isValidArticleImage(heroImage) || !heroCanon || (usedTracker && usedTracker.has(heroCanon))) {
    heroImage = getUniqueImage(null, rawTopic, avoidList);
  }
  if (usedTracker) {
    usedTracker.add(getImageCanonicalKey(heroImage));
  }

  // 4. Scan and sanitize all existing <img> tags inside content to eliminate any duplicates
  content = content.replace(/<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (fullMatch, beforeSrc, srcUrl, afterSrc) => {
    const srcCanon = srcUrl ? getImageCanonicalKey(srcUrl) : "";
    const hCanon = getImageCanonicalKey(heroImage);
    // If this image is invalid, matches hero image, or has already been used across the site:
    if (!isValidArticleImage(srcUrl) || !srcCanon || srcCanon === hCanon || (usedTracker && usedTracker.has(srcCanon))) {
      const avoid = usedTracker ? [...Array.from(usedTracker), heroImage] : [heroImage];
      const replacementImg = getUniqueImage(null, rawTopic, avoid);
      if (usedTracker) {
        usedTracker.add(getImageCanonicalKey(replacementImg));
      }
      return `<img${beforeSrc}src="${replacementImg}"${afterSrc}>`;
    }
    // Otherwise it's a valid unique image: track it!
    if (usedTracker) {
      usedTracker.add(srcCanon);
    }
    return fullMatch;
  });

  // Pick a secondary image for in-article illustration if needed
  const avoidForSecondary = usedTracker ? [...Array.from(usedTracker), heroImage] : [heroImage];
  const secondaryImage = getUniqueImage(null, rawTopic, avoidForSecondary);
  if (usedTracker) {
    usedTracker.add(getImageCanonicalKey(secondaryImage));
  }

  // Count existing substantive <p> tags
  const pMatches = content.match(/<p>([\s\S]*?)<\/p>/gi) || [];
  const cleanParagraphs = pMatches
    .map(p => p.replace(/<[^>]*>/g, '').trim())
    .filter(p => p.length > 35);

  if (cleanParagraphs.length >= 3 && content.length > 500) {
    // If content already has adequate length, check if it lacks an inline image figure
    const hasInlineImg = content.includes('<img ') || content.includes('<figure');
    if (!hasInlineImg && secondaryImage) {
      // Insert inline development image after the 2nd paragraph
      let pCount = 0;
      content = content.replace(/<\/p>/gi, (match) => {
        pCount++;
        if (pCount === 2) {
          return `${match}
<figure class="my-8">
  <img src="${secondaryImage}" alt="${title.replace(/"/g, '')}" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Desarrollo técnico y análisis contextual en la redacción de InnovaTech.</figcaption>
</figure>`;
        }
        return match;
      });
    }
    return {
      ...art,
      title,
      imageUrl: heroImage,
      content,
      contentSnippet: cleanArticleTitle(art.contentSnippet || "")
    };
  }

  // Generate a rich, 4-paragraph journalistic analysis tailored for InnovaTech with unique inline figure
  const baseSnippet = cleanArticleTitle((art.contentSnippet || "").replace(/<\/?[^>]+(>|$)/g, "").trim());

  const generatedHtml = `
<p>El panorama tecnológico internacional suma un nuevo hito relevante con la llegada de <strong>${title}</strong>. Esta novedad responde a la acelerada evolución que atraviesa el sector de ${art.categories?.join(", ") || "tecnología e innovación"}, donde las demandas de mayor rendimiento, integración inteligente y eficiencia operativa están marcando la pauta de los nuevos desarrollos para profesionales y usuarios en todo el mundo.</p>

<h3><strong>Análisis Técnico y Fundamentos de la Arquitectura</strong></h3>
<p>${baseSnippet.length > 40 ? baseSnippet + ". " : ""}Los detalles técnicos analizados por el equipo de <strong>InnovaTech</strong> evidencian una optimización sustancial en los protocolos de procesamiento y gestión de recursos. La integración de nuevos estándares de comunicación y algoritmos avanzados permite un rendimiento sostenido con una reducción notable en la latencia de respuesta, superando las limitaciones presentes en versiones anteriores.</p>

<figure class="my-8">
  <img src="${secondaryImage}" alt="${title.replace(/"/g, '')}" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Estructura y entorno de desarrollo analizados por los especialistas de InnovaTech.</figcaption>
</figure>

<h3><strong>Impacto en el Ecosistema y Competitividad del Mercado</strong></h3>
<p>Este movimiento estratégico redefine la competencia directa frente a las principales alternativas del mercado global. Las organizaciones y usuarios que adopten esta solución se beneficiarán de una mayor interoperabilidad, blindaje de seguridad reforzado y una curva de aprendizaje optimizada gracias al soporte continuo de la comunidad y de los equipos de ingeniería.</p>

<h3><strong>Perspectiva y Valoración Editorial de InnovaTech</strong></h3>
<p>Desde la redacción de <strong>InnovaTech</strong>, consideramos que esta actualización consolida una tendencia irreversible hacia infraestructuras más resilientes, modulares y centradas en la experiencia de usuario. En las próximas semanas continuaremos monitorizando las métricas de rendimiento en condiciones reales y las actualizaciones complementarias que amplíen su ecosistema.</p>
`.trim();

  return {
    ...art,
    title,
    imageUrl: heroImage,
    content: generatedHtml,
    contentSnippet: baseSnippet.length > 40 ? baseSnippet.substring(0, 220) : `${title}: análisis editorial en profundidad con especificaciones técnicas y proyección de mercado en InnovaTech.`
  };
}

export function initArticlesDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const usedImagesTracker = new Set<string>();

    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        articlesMemoryStore = parsed.map(art => ensureMinimumParagraphs(art, usedImagesTracker));
        saveArticlesToDisk();
      }
      console.log(`[InnovaTech DB] Loaded and normalized ${articlesMemoryStore.length} articles on disk with 100% unique imagery and clean titles.`);
    }

    if (articlesMemoryStore.length === 0) {
      console.log(`[InnovaTech DB] Seeding initial InnovaTech editorial articles...`);
      articlesMemoryStore = SEED_ARTICLES.map(art => ensureMinimumParagraphs(art, usedImagesTracker));
      saveArticlesToDisk();
    }

    // Sync all images into the global registry to prevent collision with incoming articles
    syncUsedImages(Array.from(usedImagesTracker));

    if (fs.existsSync(SYNC_STATE_FILE)) {
      const syncData = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf-8'));
      lastSyncTimestamp = syncData.lastSyncTimestamp || 0;
    }
  } catch (err: any) {
    console.error("[InnovaTech DB] Error initializing articles database:", err.message);
    if (articlesMemoryStore.length === 0) {
      const fallbackTracker = new Set<string>();
      articlesMemoryStore = SEED_ARTICLES.map(art => ensureMinimumParagraphs(art, fallbackTracker));
      saveArticlesToDisk();
    }
  }
}

export function saveArticlesToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(articlesMemoryStore, null, 2), 'utf-8');
    fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify({ lastSyncTimestamp }, null, 2), 'utf-8');

    // Also synchronize TypeScript initialArticles.ts for the frontend SPA
    const tsPath = path.join(process.cwd(), 'src', 'data', 'initialArticles.ts');
    const tsCode = `import { Article } from "../types";\n\nexport const INITIAL_ARTICLES: Article[] = ${JSON.stringify(articlesMemoryStore, null, 2)};\n`;
    fs.writeFileSync(tsPath, tsCode, 'utf-8');

    // Keep public/api/articles.json available for static CDN/S3 environments
    const publicApiDir = path.join(process.cwd(), 'public', 'api');
    if (!fs.existsSync(publicApiDir)) fs.mkdirSync(publicApiDir, { recursive: true });
    fs.writeFileSync(path.join(publicApiDir, 'articles.json'), JSON.stringify({ articles: articlesMemoryStore, total: articlesMemoryStore.length }, null, 2), 'utf-8');
  } catch (err: any) {
    console.error("[InnovaTech DB] Failed to save articles to disk:", err.message);
  }
}

export function getDeterministicArticleId(title: string, link: string): string {
  const norm = (title + link).toLowerCase().replace(/[^a-z0-9]/g, '');
  const hash = crypto.createHash('md5').update(norm).digest('hex').substring(0, 12);
  return `art-innovatech-${hash}`;
}

export function hasArticle(idOrLinkOrTitle: string): boolean {
  const target = idOrLinkOrTitle.toLowerCase().trim();
  return articlesMemoryStore.some(a => 
    a.id.toLowerCase() === target ||
    (a.link && a.link.toLowerCase() === target) ||
    (a.sourceUrl && a.sourceUrl.toLowerCase() === target) ||
    a.title.toLowerCase().trim() === target
  );
}

export function getAllArticles(topic?: string, lang?: string): StoredArticle[] {
  let list = articlesMemoryStore;
  
  if (lang) {
    list = list.filter(a => !a.lang || a.lang === lang || a.lang === 'es');
  }
  
  if (topic) {
    const norm = topic.toLowerCase().trim();
    if (norm === 'latest' || norm === 'destacados' || norm === 'highlights') {
      list = list.filter(a => a.topic === 'latest' || a.topic === 'destacados');
    } else {
      list = list.filter(a => a.topic.toLowerCase() === norm);
    }
  }
  
  const sorted = list.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return ensureUniqueArticlesImages(sorted, topic || 'latest');
}

export function searchStoredArticles(query: string, lang?: string): StoredArticle[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllArticles('latest', lang);
  
  const results = articlesMemoryStore.filter(art => {
    const matchTitle = (art.title || "").toLowerCase().includes(q);
    const matchSnippet = (art.contentSnippet || "").toLowerCase().includes(q);
    const matchContent = (art.content || "").toLowerCase().includes(q);
    const matchCreator = (art.creator || "").toLowerCase().includes(q);
    const matchCategory = art.categories && art.categories.some((cat: string) => cat.toLowerCase().includes(q));
    
    return matchTitle || matchSnippet || matchContent || matchCreator || matchCategory;
  }).sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return ensureUniqueArticlesImages(results, 'latest');
}

export function insertArticle(article: StoredArticle): boolean {
  if (hasArticle(article.id) || hasArticle(article.title)) {
    return false; // Already exists, skip to save tokens
  }
  const prepared = ensureMinimumParagraphs(article);
  articlesMemoryStore.unshift(prepared);
  saveArticlesToDisk();
  // Persist permanently to Cloud Firestore
  syncArticleToFirestore(prepared).catch(err => {
    console.warn(`[InnovaTech DB] Background sync to Firestore skipped:`, err.message);
  });

  // Automated Social Media Publishing: Facebook Page
  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    publishArticleToFacebook(prepared).catch(err => {
      console.warn(`[InnovaTech Social] Facebook auto-publish skipped/failed:`, err.message || err);
    });
  }

  return true;
}

export function getSyncStatus() {
  return {
    totalArticles: articlesMemoryStore.length,
    lastSyncTimestamp,
    lastSyncDate: lastSyncTimestamp ? new Date(lastSyncTimestamp).toISOString() : 'Never',
    nextSyncAllowedInMinutes: Math.max(0, Math.round((lastSyncTimestamp + 24 * 3600 * 1000 - Date.now()) / 60000))
  };
}

/**
 * Daily Ingestion and Editorial Transformation Pipeline
 * Only runs ONCE per 24 hours (or if forced).
 * Filters against existing articles so 0 tokens are spent on articles already in DB.
 */
export async function runDailyEditorialIngest(aiClient: GoogleGenAI | null, force: boolean = false): Promise<{ ingestedCount: number; skippedCount: number; message: string }> {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (!force && (now - lastSyncTimestamp < ONE_DAY_MS)) {
    const hoursLeft = Math.round((lastSyncTimestamp + ONE_DAY_MS - now) / 3600000);
    return {
      ingestedCount: 0,
      skippedCount: 0,
      message: `Daily sync already completed. Next daily sync scheduled in ${hoursLeft} hours.`
    };
  }

  console.log(`[InnovaTech Ingestion] Starting daily editorial ingestion at ${new Date().toISOString()}...`);
  
  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*'
    }
  });

  const RSS_SOURCES: { topic: string; url: string; lang: string }[] = [
    { topic: 'ai', url: 'https://news.google.com/rss/search?q=%22Inteligencia+Artificial%22&hl=es&gl=ES&ceid=ES:es', lang: 'es' },
    { topic: 'hardware', url: 'https://elchapuzasinformatico.com/feed/', lang: 'es' },
    { topic: 'software', url: 'https://www.softzone.es/feed/', lang: 'es' },
    { topic: 'gadgets', url: 'https://www.teknofilo.com/feed/', lang: 'es' },
    { topic: 'latest', url: 'https://www.adslzone.net/feed/', lang: 'es' }
  ];

  let totalIngested = 0;
  let totalSkipped = 0;

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      if (!feed || !feed.items || feed.items.length === 0) continue;

      // Check top 3 items per feed
      for (const item of feed.items.slice(0, 3)) {
        const rawTitle = cleanArticleTitle((item.title || "").trim());
        const rawLink = (item.link || "").trim();
        if (!rawTitle) continue;

        const articleId = getDeterministicArticleId(rawTitle, rawLink);

        // STAGE 1: DEDUPLICATION CHECK (0 tokens spent if exists)
        if (hasArticle(articleId) || hasArticle(rawTitle)) {
          totalSkipped++;
          continue;
        }

        // STAGE 2: EXTRACT ALL IMAGES FROM NEWS SOURCE WITH ZERO REPETITION
        const itemImages = extractAllImagesFromItem(item);
        const preferredHero = itemImages.length > 0 ? itemImages[0] : null;
        const primaryHeroImage = getUniqueImage(preferredHero, source.topic);
        registerImageAsUsed(primaryHeroImage);

        const secondaryImages = itemImages.slice(1).map(img => {
          const uniq = getUniqueImage(img, source.topic, [primaryHeroImage]);
          registerImageAsUsed(uniq);
          return uniq;
        });

        // STAGE 3: TRANSFORM & MOLD INTO INNOVATECH EDITORIAL JOURNALISM
        let formattedTitle = rawTitle;
        let formattedContent = item.content || item.contentSnippet || "";
        let formattedSnippet = item.contentSnippet || "";

        // If Gemini is available, shape the news with original InnovaTech narrative tone
        if (aiClient) {
          try {
            const prompt = `You are a Senior Editor at InnovaTech (an independent premium technology media outlet).
Transform this raw news brief into an original, high-quality, professional InnovaTech tech story in Spanish:

Raw Headline: ${rawTitle}
Raw Snippet: ${item.contentSnippet || ""}
Available Source Images: ${itemImages.length > 0 ? JSON.stringify(itemImages) : "None"}

Write an original, comprehensive 4-paragraph news story formatted in clean HTML (minimum 350-500 words).
Guidelines:
1. Editorial Author: "Redacción InnovaTech" or "Equipo Editorial InnovaTech".
2. Headline (title): A clear, compelling headline in Spanish. CRITICAL: NEVER include any source names, publisher brands, or RSS suffixes (e.g. do NOT write '- Xataka', '- ADSLZone', '- EL PAÍS', etc.).
3. Content: 4 well-structured paragraphs with <h3><strong>Subtítulo</strong></h3> sections, key metrics in <strong>, and deep technical context. Every story MUST contain at least 4 detailed paragraphs.
4. If there are available source images beyond the main cover (${secondaryImages.length} available), embed them between the paragraphs using <figure class="my-8"><img src="..." alt="..." class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" /><figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Pie de foto explicativo...</figcaption></figure>.
5. Output schema strictly in JSON:
{
  "title": "...",
  "contentSnippet": "2-sentence executive summary...",
  "contentHtml": "<p>...</p><h3><strong>...</strong></h3><p>...</p><h3><strong>...</strong></h3><p>...</p><h3><strong>...</strong></h3><p>...</p>"
}`;

            const res = await aiClient.models.generateContent({
              model: "gemini-flash-latest",
              contents: prompt,
              config: { responseMimeType: "application/json" }
            });

            if (res.text) {
              let cleaned = res.text.trim().replace(/^```(json)?\n/, "").replace(/\n```$/, "");
              const parsed = JSON.parse(cleaned);
              if (parsed.title && parsed.contentHtml) {
                formattedTitle = cleanArticleTitle(parsed.title);
                formattedContent = parsed.contentHtml;
                formattedSnippet = cleanArticleTitle(parsed.contentSnippet || formattedSnippet);
              }
            }
          } catch (aiErr: any) {
            console.warn(`[InnovaTech Ingestion] AI molding fallback for "${rawTitle}":`, aiErr.message);
          }
        }

        // If secondary source images were not yet embedded into formattedContent, insert them between paragraphs
        if (secondaryImages.length > 0 && !formattedContent.includes('<img ') && !formattedContent.includes('<figure')) {
          let pIdx = 0;
          formattedContent = formattedContent.replace(/<\/p>/gi, (match) => {
            pIdx++;
            if (pIdx === 2 && secondaryImages[0]) {
              return `${match}
<figure class="my-8">
  <img src="${secondaryImages[0]}" alt="${formattedTitle.replace(/"/g, '')}" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Detalle visual y especificaciones técnicas proporcionadas en el informe.</figcaption>
</figure>`;
            }
            if (pIdx === 3 && secondaryImages[1]) {
              return `${match}
<figure class="my-8">
  <img src="${secondaryImages[1]}" alt="${formattedTitle.replace(/"/g, '')}" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">Perspectiva adicional del producto analizada por InnovaTech.</figcaption>
</figure>`;
            }
            return match;
          });
        }

        const rawArticle: StoredArticle = {
          id: articleId,
          title: formattedTitle,
          link: `https://innovatech.fun/articulo/${articleId.replace('art-innovatech-', '')}`,
          pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
          creator: `Redacción InnovaTech ${source.topic.toUpperCase()}`,
          contentSnippet: formattedSnippet.substring(0, 220),
          content: formattedContent,
          imageUrl: primaryHeroImage,
          categories: [source.topic.toUpperCase(), "InnovaTech"],
          topic: source.topic,
          lang: source.lang,
          sourceUrl: rawLink,
          createdAt: new Date().toISOString()
        };

        const newArticle = ensureMinimumParagraphs(rawArticle);
        insertArticle(newArticle);
        totalIngested++;
        console.log(`[InnovaTech Ingestion] Stored original article: "${formattedTitle.substring(0, 45)}..." (ID: ${articleId})`);
      }
    } catch (feedErr: any) {
      console.warn(`[InnovaTech Ingestion] Error reading source ${source.url}:`, feedErr.message);
    }
  }

  lastSyncTimestamp = Date.now();
  saveArticlesToDisk();

  console.log(`[InnovaTech Ingestion] Finished daily sync. Stored ${totalIngested} new articles, skipped ${totalSkipped} duplicates.`);

  return {
    ingestedCount: totalIngested,
    skippedCount: totalSkipped,
    message: `Daily sync finished. Added ${totalIngested} new articles, skipped ${totalSkipped} existing items without spending tokens.`
  };
}
