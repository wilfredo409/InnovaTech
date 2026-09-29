import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

interface ArticleData {
  id: string;
  title: string;
  link: string;
  creator: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  categories: string[];
  imageUrl: string;
  sourceUrl?: string;
  topic: 'latest' | 'ai' | 'hardware' | 'software' | 'gadgets';
  lang: string;
}

// 100% verified unique image pools (50 hero images + 50 inline images = 100 unique photos)
const IMAGES = {
  latest: {
    heroes: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520869562399-e772f042f422?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=1200&q=80'
    ],
    inlines: [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516110833967-0b57883c5319?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508873696983-2df5703bc37d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  ai: {
    heroes: [
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80'
    ],
    inlines: [
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  hardware: {
    heroes: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=80'
    ],
    inlines: [
      'https://images.unsplash.com/photo-1562408590-e32931084e23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580584126903-c17d41830450?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  software: {
    heroes: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1200&q=80'
    ],
    inlines: [
      'https://images.unsplash.com/photo-1534665482403-a909d0d97c67?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  gadgets: {
    heroes: [
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80'
    ],
    inlines: [
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522273400909-fd1a8f77637e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1610465299996-30f240ac2b1c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1563132337-f159f484226c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515940175183-6798529cb860?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613946069412-38f7f1ff0b65?auto=format&fit=crop&w=1200&q=80'
    ]
  }
};

function makeArticleHtml(
  title: string,
  topicName: string,
  p1: string,
  section1Title: string,
  p2: string,
  inlineImg: string,
  caption: string,
  section2Title: string,
  p3: string,
  section3Title: string,
  p4: string
): string {
  return `
<p>${p1}</p>

<h3><strong>${section1Title}</strong></h3>
<p>${p2}</p>

<figure class="my-8">
  <img src="${inlineImg}" alt="${title.replace(/"/g, '')}" class="w-full rounded-2xl object-cover max-h-[480px] shadow-md" loading="lazy" />
  <figcaption class="text-xs md:text-sm text-center text-gray-500 dark:text-gray-400 mt-2 italic">${caption}</figcaption>
</figure>

<h3><strong>${section2Title}</strong></h3>
<p>${p3}</p>

<h3><strong>${section3Title}</strong></h3>
<p>${p4}</p>
`.trim();
}

export function buildCompleteEditorialDatabase(): ArticleData[] {
  const articles: ArticleData[] = [];

  // ==========================================
  // CATEGORY: LATEST (Lo más destacado de esta semana) - 10 Articles
  // ==========================================
  const latestArticlesDef = [
    {
      title: "La Unión Europea aprueba la Ley de Soberanía Tecnológica: microchips avanzados e infraestructura cuántica para 2030",
      p1: "El Parlamento Europeo y el Consejo de la Unión han formalizado la aprobación definitiva de la Ley de Soberanía Tecnológica. Este ambicioso marco regulatorio e inversor movilizará más de 45.000 millones de euros en colaboración público-privada para garantizar que al menos el 20% de la producción mundial de semiconductores de vanguardia se fabrique dentro del territorio europeo antes de 2030.",
      s1: "Inversión Estratégica en Fundiciones y Litografía Avanzada",
      p2: "El plan articula incentivos directos para la instalación de megafundiciones capaces de producir nodos por debajo de los 2 nanómetros, así como centros de investigación dedicados a la computación cuántica fotónica. Con este paso, los estados miembros buscan blindar cadenas de suministro clave frente a tensiones geopolíticas y reducir la dependencia de proveedores extracontinentales.",
      caption: "Complejos de investigación y desarrollo industrial impulsados por la Unión Europea para la fabricación de chips de última generación.",
      s2: "Impacto en las Industrias Automotriz, Médica y Aeroespacial",
      p3: "Las principales firmas de automoción y tecnología médica han celebrado la medida, señalando que la disponibilidad de silicio de alta densidad en suelo europeo reducirá los cuellos de botella que afectaron a las líneas de producción en ejercicios anteriores. Asimismo, se establecen reservas estratégicas de materiales críticos como galio, germanio y tierras raras.",
      s3: "Evaluación Editorial de InnovaTech",
      p4: "Desde la redacción de InnovaTech consideramos que esta legislación marca un punto de inflexión en la autonomía digital comunitaria. Sin embargo, el reto fundamental residirá en la capacidad de atraer talento especializado en ingeniería de semiconductores y en acelerar los plazos de construcción de las infraestructuras previstas."
    },
    {
      title: "GPT-6 Astra ya es oficial: OpenAI estrena su IA más potente con razonamiento multimodal en tiempo real",
      p1: "OpenAI ha presentado oficialmente su nuevo modelo insignia, bautizado como GPT-6 Astra. La nueva arquitectura representa un salto cualitativo al abandonar la segmentación por modalidades y operar sobre un flujo de tokens unificado que procesa texto, audio de alta fidelidad, visión espacial continua y código fuente de manera simultánea sin etapas intermedias de traducción.",
      s1: "Razonamiento Profundo Continuo con Memoria Contextual Dinámica",
      p2: "Astra incorpora una ventana de contexto optimizada capaz de gestionar hasta dos millones de tokens manteniendo una recuperación semántica precisa y consistente. Las evaluaciones benchmark independientes sitúan a GPT-6 Astra a la cabeza en pruebas de razonamiento matemático complejo, verificación formal de algoritmos y diagnóstico médico preliminar asistido.",
      caption: "Arquitectura de cálculo masivo y centros de datos dedicados al entrenamiento del modelo GPT-6 Astra.",
      s2: "Eficiencia Computacional y Reducción del Coste de Inferencia",
      p3: "Uno de los aspectos más celebrados por la industria es la optimización de los modelos cuantizados de inferencia, que reducen a la mitad la energía necesaria por cada mil consultas resueltas. Las grandes corporaciones podrán desplegar versiones adaptadas con gobernanza de datos estricta y aislamiento de memoria local.",
      s3: "Perspectiva Editorial de InnovaTech",
      p4: "La llegada de GPT-6 Astra consolida la madurez de la inteligencia artificial agentic, capaz de ejecutar planes complejos de trabajo en lugar de responder a preguntas aisladas. Las implicaciones éticas y regulatorias deberán evolucionar al mismo ritmo para garantizar un despliegue seguro."
    },
    {
      title: "Movistar desvela cómo se actualiza su amplificador WiFi 7 para alcanzar los 10 Gbps inalámbricos",
      p1: "Telefónica ha iniciado el despliegue del nuevo amplificador Smart WiFi 7 destinado a sus clientes de fibra simétrica de alta velocidad. El equipo, diseñado en colaboración con los principales fabricantes de silicio de telecomunicaciones, permite multiplicar por cuatro la velocidad inalámbrica efectiva en entornos domésticos y oficinas mediante el aprovechamiento de la banda limpia de 6 GHz.",
      s1: "Canales de 320 MHz y Modulación 4096-QAM",
      p2: "Las pruebas realizadas en entornos de alta densidad demuestran que la combinación de anchos de canal de 320 MHz y la tecnología MLO (Multi-Link Operation) permite a los dispositivos conectarse simultáneamente a múltiples bandas de frecuencia. Esto erradica las interferencias habituales provocadas por redes vecinas y reduce la latencia inalámbrica a menos de 3 milisegundos.",
      caption: "Esquema de cobertura mesh y distribución de radiofrecuencia del nuevo amplificador inteligente.",
      s2: "Compatibilidad con Terminales Móviles y Domótica Matter",
      p3: "El dispositivo incluye soporte nativo para el protocolo Thread y actúa como un router de borde para la pasarela Matter, permitiendo controlar cerraduras inteligentes, sensores de presencia y climatización sin sobrecargar el espectro WiFi convencional ni requerir concentradores adicionales.",
      s3: "Balance Editorial de InnovaTech",
      p4: "Esta actualización tecnológica representa la antesala indispensable para la adopción masiva de streaming 8K sin compresión y computación espacial en la nube dentro del hogar. Los usuarios que dispongan de tarjetas compatibles notarán un cambio radical en la fluidez de sus conexiones."
    },
    {
      title: "Digi ya ofrece 2 Gbps por 20 euros: despliegue masivo de fibra óptica XGS-PON en España",
      p1: "La operadora Digi ha dado un nuevo golpe sobre la mesa en el mercado español de las telecomunicaciones al anunciar su nueva tarifa de fibra PRO-Digi de 2 Gbps simétricos por tan solo 20 euros mensuales. Esta oferta está respaldada por una expansión sin precedentes de su red propia basada en la tecnología de transmisión óptica XGS-PON.",
      s1: "Arquitectura XGS-PON y Reducción de Latencias de Red",
      p2: "A diferencia de las redes GPON tradicionales limitadas a 2,5 Gbps compartidos entre múltiples abonados, el estándar XGS-PON entrega hasta 10 Gbps simétricos por rama de distribución. Esto garantiza que cada usuario conectado disponga de un caudal garantizado con pings inferiores a los 5 milisegundos hacia los principales puntos neutros de intercambio de tráfico.",
      caption: "Tendido de fibra óptica y módulos de conmutación óptica en cabeceras metropolitanas de telecomunicación.",
      s2: "Reacción de la Competencia y Presión sobre el ARPU",
      p3: "Los analistas del sector coinciden en que este movimiento forzará a los grandes operadores incumbentes a revisar sus esquemas tarifarios y a acelerar la migración de sus infraestructuras heredadas para frenar la pérdida de clientes de valor en núcleos urbanos e industriales.",
      s3: "Perspectiva Editorial de InnovaTech",
      p4: "La democratización de velocidades gigabit ultrarrápidas a precios asequibles es una excelente noticia para el consumidor y un catalizador para el teletrabajo avanzado y el respaldo continuo en la nube de creadores de contenido multimedia."
    },
    {
      title: "El Consorcio Global de Satélites de Órbita Baja anuncia cobertura directa a teléfonos inteligentes 5G sin antenas especiales",
      p1: "El consorcio internacional de operadores satelitales en órbita terrestre baja (LEO) ha confirmado el éxito de las pruebas de transmisión directa Direct-to-Cell. Mediante esta tecnología, cualquier smartphone estándar con conectividad 5G podrá recibir cobertura de voz, datos y mensajería de emergencia en zonas remotas de todo el planeta sin requerir ningún accesorio externo ni modificaciones físicas.",
      s1: "Arreglos de Antenas Phased-Array en Órbita a 500 Kilómetros",
      p2: "Los satélites de nueva generación incorporan paneles de antenas con conformación de haz dinámico que compensan el desplazamiento Doppler y la atenuación atmosférica en tiempo real. La red asigna dinámicamente canales celulares estándar 3GPP Release 17 a los terminales que pierden la señal de las torres terrestres.",
      caption: "Constelación de satélites en órbita baja operando enlaces directos con dispositivos móviles en tierra.",
      s2: "Seguridad Marítima, Rescate en Montaña y Eliminación de Zonas de Sombra",
      p3: "Servicios de emergencia, guardacostas y expediciones científicas podrán contar con una línea de vida digital ininterrumpida. Incluso en desastres naturales donde las torres convencionales colapsen, los ciudadanos mantendrán la capacidad de solicitar auxilio y recibir alertas tempranas.",
      s3: "Comentario Editorial de InnovaTech",
      p4: "La fusión entre redes celulares terrestres y espaciales marca el fin definitivo de las zonas sin cobertura en el planeta. Se trata de uno de los avances en telecomunicaciones con mayor impacto humanitario de la presente década."
    },
    {
      title: "España destina 1.200 millones del fondo NextTech para crear la primera megafactoría de superordenadores cuánticos fotónicos",
      p1: "El Ministerio de Transformación Digital ha hecho oficial la adjudicación de una partida histórica de 1.200 millones de euros procedentes del programa NextTech para la construcción en territorio nacional de una megafactoría de supercomputación cuántica fotónica, posicionando al país en la élite mundial del procesamiento de información subatómica.",
      s1: "Qubits Fotónicos que Operan a Temperatura Ambiente",
      p2: "A diferencia de los sistemas superconductores que requieren criogenia extrema cercana al cero absoluto, la tecnología fotónica utiliza partículas de luz guiadas por guías de onda de silicio a temperatura ambiente. El objetivo del centro es alcanzar procesadores de más de 1.000 qubits lógicos con corrección activa de errores para 2028.",
      caption: "Montaje de guías de onda ópticas y circuitos integrados fotónicos en salas blancas de investigación cuántica.",
      s2: "Aplicaciones en Nuevos Fármacos, Materiales y Criptografía",
      p3: "Los superordenadores fotónicos desarrollados en esta instalación se orientarán prioritariamente al diseño de catalizadores químicos para la captura de carbono, el descubrimiento acelerado de moléculas terapéuticas contra enfermedades raras y la optimización de redes energéticas complejas.",
      s3: "Valoración Editorial de InnovaTech",
      p4: "Esta apuesta sitúa al ecosistema de investigación español en una posición de vanguardia internacional, capaz de retener a investigadores de primer nivel y atraer inversión industrial de alta densidad tecnológica."
    },
    {
      title: "La UIT ratifica las frecuencias oficiales para las primeras redes comerciales 6G previstas para 2029",
      p1: "La Unión Internacional de Telecomunicaciones (UIT) ha concluido la Conferencia Mundial de Radiocomunicaciones con un acuerdo unánime sobre las bandas del espectro electromagnético que darán vida a las futuras redes 6G. Las frecuencias sub-THz comprendidas entre los 7 y los 24 GHz, junto con tramos experimentales de 100 GHz, han sido armonizadas a escala global.",
      s1: "Velocidades de Terabits y Detección del Entorno por Radiofrecuencia",
      p2: "El 6G no solo multiplicará la tasa de transferencia hasta alcanzar el terabit por segundo, sino que convertirá a las ondas de radio en sensores de radar de altísima resolución. Esto permitirá a las redes cartografiar entornos urbanos en 3D en tiempo real, facilitando la navegación de drones autónomos y vehículos no tripulados.",
      caption: "Laboratorios de radiofrecuencia analizando la propagación de ondas milimétricas para la futura conectividad 6G.",
      s2: "Interacción Háptica y Gemelos Digitales de Ciudades Enteras",
      p3: "Con latencias sub-milisegundo estables, el 6G habilitará la telepresencia háptica inmersiva, donde cirujanos podrán manipular instrumental a miles de kilómetros con retroalimentación táctil instantánea, y las metrópolis podrán simular dinámicas de tráfico en gemelos digitales hiperprecisos.",
      s3: "Análisis Editorial de InnovaTech",
      p4: "Aunque la comercialización masiva aún se sitúa a finales de la década, la fijación de estándares de espectro otorga certidumbre a los fabricantes de semiconductores para comenzar a diseñar los módems del mañana."
    },
    {
      title: "La revolución de las baterías de estado sólido para centros de datos: triplican la densidad energética y eliminan riesgos de incendio",
      p1: "Los principales operadores de infraestructuras de centros de datos en Europa y Estados Unidos han iniciado la transición masiva hacia sistemas de respaldo basados en electrolito cerámico de estado sólido. Esta tecnología sustituye a las tradicionales baterías de iones de litio con electrolito líquido inflamable, transformando por completo la seguridad y la eficiencia espacial de los servidores.",
      s1: "Celdas Cerámicas No Inflamables con 15.000 Ciclos de Vida",
      p2: "Las nuevas baterías de estado sólido toleran temperaturas de operación de hasta 85 grados Celsius sin degradación acelerada y no sufren el fenómeno de embalamiento térmico. Su densidad energética alcanza los 600 Wh/kg, lo que permite reducir a un tercio el espacio de las salas de generadores y sistemas SAI.",
      caption: "Módulos de almacenamiento energético de estado sólido instalados en centros de datos de alta disponibilidad.",
      s2: "Sostenibilidad y Reducción de la Huella de Carbono Operativa",
      p3: "Al prescindir de cobalto y utilizar cátodos basados en manganeso y silicio de fácil reciclaje, los costes de desmantelamiento y la huella de carbono asociada al ciclo de vida se reducen en más de un 65% en comparación con la química de litio convencional.",
      s3: "Reflexión Editorial de InnovaTech",
      p4: "La voraz demanda energética impulsada por el entrenamiento de modelos de inteligencia artificial exige un salto cualitativo en los sistemas de respaldo. Las baterías de estado sólido representan la respuesta técnica más sólida y madura para los próximos veinte años."
    },
    {
      title: "El Parlamento Europeo endurece las exigencias de ciberseguridad NIS2 para servicios en la nube e infraestructuras críticas",
      p1: "La directiva comunitaria sobre ciberseguridad NIS2 ha entrado en vigor con un régimen sancionador estricto que contempla multas millonarias y responsabilidad legal directa para los consejos de administración de empresas tecnológicas y operadoras de servicios esenciales que no certifiquen auditorías de seguridad periódicas.",
      s1: "Respaldo Inmutable y Protección de Cadenas de Suministro de Software",
      p2: "La normativa exige a las organizaciones implantar sistemas de registro inmutables, autenticación multifactor obligatoria en todos los accesos administrativos, cifrado post-cuántico en tránsito y un plan de continuidad de negocio verificado con simulacros periódicos de ataques de secuestro de datos (ransomware).",
      caption: "Centros de operaciones de seguridad (SOC) monitorizando amenazas y vectores de ataque en infraestructuras críticas.",
      s2: "Auditorías de Código Fuente y Dependencias Open Source",
      p3: "Uno de los puntos clave radica en el control estricto de las librerías de terceros y dependencias de código abierto integradas en el software corporativo, debiendo presentar un inventario de software SBOM (Software Bill of Materials) actualizado para cada producto desplegado.",
      s3: "Opinión Editorial de InnovaTech",
      p4: "La directiva NIS2 pone fin a la era de la ciberseguridad voluntaria o secundaria. Las empresas que adapten sus arquitecturas con antelación no solo evitarán sanciones, sino que ganarán una ventaja competitiva decisiva en confianza corporativa."
    },
    {
      title: "Revolución en el cable submarino transatlántico: entra en servicio la línea de fibra óptica de 500 Terabits por segundo",
      p1: "El consorcio internacional de infraestructuras interoceánicas ha culminado con éxito el despliegue del cable submarino transatlántico 'NuLink Express', que conecta la Península Ibérica con la costa este de los Estados Unidos. La infraestructura ofrece un ancho de banda récord de 500 Terabits por segundo a través de 24 pares de fibra óptica amplificada.",
      s1: "Fibras Multinúcleo con Amplificación Óptica Sumergida",
      p2: "A través del uso de fibras multinúcleo con multiplexación por división espacial (SDM) y repetidores ópticos de bombeo láser redundante cada 70 kilómetros submarinos, el sistema reduce la atenuación a mínimos teóricos, registrando una latencia transoceánica de tan solo 28 milisegundos entre Madrid y Nueva York.",
      caption: "Buque cablero especializado durante las labores de inmersión y anclaje de cables de fibra óptica en lecho marino.",
      s2: "Garantía de Tráfico para Inteligencia Artificial y Computación en la Nube",
      p3: "La puesta en marcha de este enlace fortalece la posición de la península ibérica como el nodo de conexión digital y centro de datos más estratégico del sur de Europa, canalizando el flujo de datos entre América, Europa, África y Oriente Medio.",
      s3: "Conclusión Editorial de InnovaTech",
      p4: "El tendido de cables submarinos de última generación demuestra que el hardware físico sigue siendo la columna vertebral indispensable sobre la que descansan todas las aplicaciones y servicios digitales del mundo moderno."
    }
  ];

  latestArticlesDef.forEach((def, idx) => {
    articles.push({
      id: `art-innovatech-latest-${idx + 1}`,
      title: def.title,
      link: `https://innovatech.editorial/noticias/destacados/${idx + 1}`,
      creator: "Redacción Central InnovaTech",
      pubDate: new Date(Date.now() - idx * 3600000 * 3).toISOString(),
      content: makeArticleHtml(
        def.title,
        "Destacados",
        def.p1,
        def.s1,
        def.p2,
        IMAGES.latest.inlines[idx],
        def.caption,
        def.s2,
        def.p3,
        def.s3,
        def.p4
      ),
      contentSnippet: def.p1.substring(0, 220) + "...",
      categories: ["Destacados", "Telecomunicaciones", "Estrategia Global"],
      imageUrl: IMAGES.latest.heroes[idx],
      topic: 'latest',
      lang: 'es'
    });
  });

  // ==========================================
  // CATEGORY: AI (Inteligencia Artificial) - 10 Articles
  // ==========================================
  const aiArticlesDef = [
    {
      title: "Google DeepMind presenta AlphaGenome: el modelo que predice mutaciones y estructura del ADN a escala atómica",
      p1: "Google DeepMind ha anunciado un nuevo hito científico con la presentación de AlphaGenome, un modelo de inteligencia artificial de última generación diseñado para predecir con exactitud atómica la estructura tridimensional de cadenas completas de ADN, ARN y sus interacciones con complejos proteicos.",
      s1: "Redes Neuronales Geométricas y Predicción Bioquímica",
      p2: "AlphaGenome emplea transformadores basados en teoría de grafos y simulación de campos de fuerza cuánticos. En ensayos a ciegas validados por la comunidad médica internacional, el sistema predijo el impacto de mutaciones genéticas no observadas con una precisión superior al 94%, acelerando enormemente la investigación oncológica.",
      caption: "Representación computacional del modelo AlphaGenome analizando plegamientos macromoleculares en tiempo real.",
      s2: "Diseño Computacional de Fármacos Personalizados",
      p3: "Investigadores de más de cien instituciones globales han comenzado a utilizar el modelo para simular cómo pequeñas moléculas químicas se acoplan a sitios activos del ADN, lo que permite acortar la fase preclínica del descubrimiento de fármacos de varios años a pocas semanas.",
      s3: "Juicio Editorial de InnovaTech",
      p4: "AlphaGenome evidencia que el mayor valor de la inteligencia artificial moderna no está en generar texto conversacional, sino en resolver enigmas biológicos fundamentales que transformarán la medicina preventiva."
    },
    {
      title: "Modelos de Inteligencia Artificial Multimodal: La Nueva Era de la Percepción Computacional",
      p1: "La transición desde modelos basados exclusivamente en texto hacia sistemas fundacionales verdaderamente multimodales está redefiniendo cómo las máquinas perciben y razonan sobre el entorno físico que las rodea. La combinación armónica de audio, visión computerizada y cinemática espacial marca un salto histórico.",
      s1: "Fusión Temprana de Tokens y Espacios Latentes Compartidos",
      p2: "En los sistemas tradicionales de primera generación, cada modalidad requería un codificador independiente. Las nuevas arquitecturas de fusión temprana entrenan a la red sobre un único espacio vectorial donde una imagen, un sonido o un comando de texto son proyecciones complementarias del mismo concepto subyacente.",
      caption: "Visualización del mapa vectorial de tokens compartidos entre señales visuales, acústicas y sintácticas.",
      s2: "Aplicación en Robótica Colaborativa y Vehículos Autónomos",
      p3: "En el campo de la robótica asistencial, estos modelos permiten que un brazo mecánico interprete instrucciones ambiguas en lenguaje natural, observando los objetos sobre una mesa y coordinando movimientos milimétricos con retroalimentación sensorial directa.",
      s3: "Reflexión Editorial de InnovaTech",
      p4: "La percepción multimodal es el puente que separa a la IA estadística de sistemas verdaderamente capacitados para operar en el mundo físico. Los progresos observados este año marcarán la norma de la robótica de consumo."
    },
    {
      title: "Los grandes ‘chatbots’ de inteligencia artificial sufren una caída global por saturación de servidores de inferencia",
      p1: "Una interrupción coordinada en varios de los principales servicios comerciales de inteligencia artificial generativa dejó a millones de usuarios empresariales sin acceso durante más de tres horas. El incidente se originó en una cascada de sobrecarga en los clústeres de inferencia alojados en la costa este estadounidense.",
      s1: "Cuellos de Botella en la Memoria HBM y Enrutamiento Anycast",
      p2: "Los informes preliminares señalan que un pico masivo de peticiones concurrentes con ventanas de contexto extendidas agotó los búferes de memoria de alta velocidad (HBM) de las tarjetas aceleradoras, provocando tiempos de espera críticos en los balanceadores de carga y reinicios automáticos en cadena.",
      caption: "Monitores de telemetría de clústeres de cálculo mostrando las curvas de latencia durante la interrupción de servicio.",
      s2: "Lecciones en Resiliencia y Planes de Contingencia Corporativos",
      p3: "El apagón ha reactivado el debate en las mesas de dirección de las grandes corporaciones sobre el riesgo de depender exclusivamente de APIs en la nube pública, impulsando el interés por desplegar modelos locales optimizados para tareas críticas de oficina.",
      s3: "Balance Editorial de InnovaTech",
      p4: "Este evento demuestra que la infraestructura que soporta la economía de la IA aún adolece de vulnerabilidades operativas. La diversificación de proveedores y la inferencia perimetral (edge AI) resultan hoy más urgentes que nunca."
    },
    {
      title: "Claude Fable 5.1: lista de novedades del nuevo modelo de Anthropic con memoria persistente y depuración de código autónoma",
      p1: "Anthropic ha liberado la actualización Claude Fable 5.1, una versión pensada específicamente para desarrolladores de software y científicos de datos que incorpora capacidades pioneras de memoria contextual persistente a lo largo de múltiples sesiones de trabajo.",
      s1: "Árboles de Ejecución y Pruebas Unitarias Automatizadas",
      p2: "El modelo puede levantar entornos virtuales aislados para compilar el código generado, ejecutar baterías de pruebas automáticas y autocorregir fallos de sintaxis o fugas de memoria antes de entregar la respuesta final al ingeniero de software, logrando un 98% de éxito en depuración.",
      caption: "Entorno interactivo de desarrollo asistido por la arquitectura de depuración autónoma de Claude Fable 5.1.",
      s2: "Memoria Segmentada y Cumplimiento Estricto del RGPD",
      p3: "A diferencia de otros enfoques, los datos almacenados en la memoria persistente del usuario pueden ser auditados, editados o eliminados selectivamente con un solo clic, garantizando que ninguna información sensible corporativa sea utilizada en futuros reentrenamientos.",
      s3: "Valoración Editorial de InnovaTech",
      p4: "Con Fable 5.1, Anthropic demuestra que la ergonomía del desarrollador y la privacidad no son incompatibles con un rendimiento técnico de máximo nivel. Se posiciona como una herramienta indispensable en el ciclo de vida del software."
    },
    {
      title: "Meta lanza LLaMA-4 Open Frontier: arquitectura de mezcla de expertos de 400.000 millones de parámetros con licencia libre",
      p1: "Meta ha publicado los pesos abiertos de LLaMA-4 Open Frontier, su modelo fundacional más potente hasta la fecha. Con una arquitectura sparse de mezcla de expertos (MoE) que suma 400.000 millones de parámetros totales pero solo activa 45.000 millones por token, el modelo iguala en rendimiento a soluciones cerradas de pago.",
      s1: "Eficiencia de Activación MoE y Cuantización a 4 Bits",
      p2: "Gracias a la activación selectiva de expertos por capas y al desarrollo de esquemas avanzados de cuantización FP4 y INT4, los desarrolladores pueden ejecutar este coloso en servidores equipados con hardware estándar sin sacrificar precisión de razonamiento.",
      caption: "Diagrama esquemático de la activación de enrutadores expertos dentro de la red LLaMA-4 Open Frontier.",
      s2: "Impulso Definitivo al Ecosistema de Código Abierto",
      p3: "Universidades, startups y administraciones públicas cuentan ahora con un modelo de primer nivel que pueden auditar, adaptar a idiomas minoritarios y desplegar internamente con soberanía absoluta sobre sus propios datos.",
      s3: "Análisis Editorial de InnovaTech",
      p4: "La apuesta de Meta por los pesos abiertos continúa dinamizando el mercado tecnológico global, forzando a los gigantes propietarios a acelerar su innovación y reducir sus precios de acceso a las APIs."
    },
    {
      title: "Agentes de IA autónomos en entornos corporativos: cómo los workflows agentic están reemplazando a los scripts tradicionales",
      p1: "La automatización de procesos empresariales está viviendo su mayor revolución en dos décadas con la adopción de arquitecturas de agentes autónomos. Estos agentes no se limitan a seguir árboles de decisión rígidos, sino que planifican, interactúan con herramientas externas y rectifican su rumbo de manera dinámica.",
      s1: "Llamadas a Funciones y Protocolos de Verificación de Estado",
      p2: "Los nuevos agentes implementan protocolos formales de verificación donde cada acción (como consultar una base de datos SQL o generar una factura) es validada contra políticas de seguridad antes de ejecutarse en producción, evitando alucinaciones operativas.",
      caption: "Panel de control orquestando cientos de agentes de inteligencia artificial interactuando con bases de datos corporativas.",
      s2: "Reducción de Costes Operativos en Logística y Atención al Cliente",
      p3: "Las empresas pioneras en adoptar agentes orquestados reportan una reducción del 60% en el tiempo de resolución de incidencias complejas de clientes y una mejora drástica en la precisión del control de inventarios distribuidos.",
      s3: "Perspectiva Editorial de InnovaTech",
      p4: "El futuro del trabajo informático reside en diseñar orquestaciones robustas de agentes. Aquellas organizaciones que aprendan a supervisar flujos de trabajo inteligentes liderarán la productividad del sector."
    },
    {
      title: "NVIDIA presenta Blackwell B300: arquitectura de tensor cores con refrigeración líquida y 100 PFLOPS de cálculo FP4",
      p1: "NVIDIA ha desvelado su nuevo acelerador de inteligencia artificial para centros de datos masivos, el Blackwell B300. Concebido íntegramente para clústeres con refrigeración líquida directa al chip, entrega una potencia descomunal de hasta 100 PetaFLOPS en formato de cálculo FP4 de precisión reducida.",
      s1: "Interconexión NVLink de Quinta Generación y 1,8 TB/s",
      p2: "El procesador integra dos matrices de silicio unidas mediante un puente de empaquetado 3D de alta densidad que se comporta lógicamente como un único chip monolítico, complementado con 288 GB de memoria HBM3e ultrarrápida.",
      caption: "Acelerador NVIDIA B300 con bloque de disipación para refrigeración líquida directa sobre el silicio.",
      s2: "Reducción del Consumo en Granjas de Servidores a Gran Escala",
      p3: "La incorporación de refrigeración líquida permite a los operadores de centros de datos prescindir de ventiladores mecánicos ruidosos e ineficientes, elevando el coeficiente de eficiencia de uso de energía (PUE) por debajo de 1,1.",
      s3: "Reflexión Editorial de InnovaTech",
      p4: "NVIDIA consolida su liderazgo indiscutible en la provisión de hardware para la inteligencia artificial. Sin embargo, el reto de abastecer el consumo eléctrico mundial que demandan estos chips permanece abierto."
    },
    {
      title: "Generación de vídeo hiperrealista en tiempo real: los nuevos modelos de difusión espacial transforman la producción audiovisual",
      p1: "La industria cinematográfica y publicitaria se encuentra en plena metamorfosis tras el lanzamiento de los modelos de difusión espacial en tiempo real. Estas herramientas permiten generar tomas cinematográficas con consistencia geométrica, iluminación física creíble y actores digitales indistinguibles de la realidad.",
      s1: "Modelado Tridimensional Implícito y Consistencia Temporal",
      p2: "A diferencia de las generaciones previas que presentaban deformaciones y parpadeos en los fondos, las nuevas redes calculan un mapa de profundidad 3D subyacente para mantener la coherencia espacial de cámaras en movimiento rápido a 60 fotogramas por segundo.",
      caption: "Línea de tiempo de edición interactiva combinando cámaras virtuales y generación de escenas foto-realistas.",
      s2: "Transformación de los Flujos de Postproducción y Efectos Visuales",
      p3: "Estudios de animación y efectos especiales en todo el mundo ya integran estas tecnologías para generar escenarios virtuales instantáneos y duplicar tomas de riesgo sin exponer a especialistas en los sets de rodaje.",
      s3: "Juicio Editorial de InnovaTech",
      p4: "La democratización de efectos visuales de calidad cinematográfica abre la puerta a creadores independientes con presupuestos modestos, aunque exige protocolos rigurosos de marca de agua digital contra deepfakes no autorizados."
    },
    {
      title: "Sistemas de alineación constitucional y seguridad en LLM: avances para mitigar alucinaciones y sesgos algorítmicos",
      p1: "Investigadores en ética y gobernanza de la inteligencia artificial han presentado los resultados de un consorcio global enfocado en la alineación constitucional de modelos de lenguaje. Mediante el uso de supervisión asistida por reglas éticas axiomáticas, se ha logrado reducir las alucinaciones en un 85%.",
      s1: "Auto-Crítica Guiada por Principios Constitucionales",
      p2: "El sistema incorpora una etapa de razonamiento reflexivo en la que un subsistema secundario evalúa la veracidad de cada afirmación contra fuentes documentales autenticadas antes de emitir la salida al usuario final, penalizando afirmaciones no contrastadas.",
      caption: "Esquema metodológico del ciclo de alineación constitucional y verificación probabilística de afirmaciones.",
      s2: "Aplicación en Sectores Críticos: Finanzas, Salud y Derecho",
      p3: "En ámbitos donde una sola alucinación puede acarrear responsabilidades legales graves, estos sistemas de verificación determinista brindan la certidumbre necesaria para automatizar dictámenes preliminares con garantías plenas.",
      s3: "Comentario Editorial de InnovaTech",
      p4: "Hacer que los modelos de inteligencia artificial sean fiables y explicables es el prerrequisito indispensable para su adopción plena en las instituciones públicas y los sistemas sanitarios del mundo."
    },
    {
      title: "La computación neuromórfica aplicada al aprendizaje automático: microprocesadores inspirados en el cerebro con consumo de microvatios",
      p1: "Ingenieros del sector microelectrónico han completado las primeras pruebas industriales de chips neuromórficos diseñados para ejecutar redes neuronales biológicas basadas en espigas (SNN). Estos procesadores operan con un consumo eléctrico de apenas unos microvatios, mil veces inferior al silicio tradicional.",
      s1: "Procesamiento Asíncrono Basado en Impulsos Eléctricos",
      p2: "En lugar de refrescar constantemente matrices numéricas masivas con un reloj central, las neuronas de silicio del chip neuromórfico solo se activan cuando reciben un impulso entrante específico, imitando la eficiencia energética sin parangón del cerebro humano.",
      caption: "Microfotografía de la matriz de sinapsis electrónicas y compuertas memristivas en un procesador neuromórfico.",
      s2: "Dispositivos Médicos Implantables y Sensores Satelitales Autónomos",
      p3: "Esta bajísima demanda energética hace viables implantes cocleares inteligentes y sensores satelitales que pueden monitorizar variables durante décadas alimentándose exclusivamente de la energía residual ambiental.",
      s3: "Visión Editorial de InnovaTech",
      p4: "La computación neuromórfica representa una de las vías más prometedoras para superar los límites físicos de la ley de Moore y hacer sostenible la expansión global de la inteligencia computacional."
    }
  ];

  aiArticlesDef.forEach((def, idx) => {
    articles.push({
      id: `art-innovatech-ai-${idx + 1}`,
      title: def.title,
      link: `https://innovatech.editorial/noticias/ai/${idx + 1}`,
      creator: "Equipo de Inteligencia Artificial InnovaTech",
      pubDate: new Date(Date.now() - idx * 3600000 * 3.5).toISOString(),
      content: makeArticleHtml(
        def.title,
        "Inteligencia Artificial",
        def.p1,
        def.s1,
        def.p2,
        IMAGES.ai.inlines[idx],
        def.caption,
        def.s2,
        def.p3,
        def.s3,
        def.p4
      ),
      contentSnippet: def.p1.substring(0, 220) + "...",
      categories: ["Inteligencia Artificial", "Deep Learning", "Investigación Científica"],
      imageUrl: IMAGES.ai.heroes[idx],
      topic: 'ai',
      lang: 'es'
    });
  });

  // ==========================================
  // CATEGORY: HARDWARE - 10 Articles
  // ==========================================
  const hwArticlesDef = [
    {
      title: "Arquitectura de Semiconductores a 3 Nanómetros y Transistores GAA: el salto generacional en microelectrónica",
      p1: "La transición tecnológica desde los transistores FinFET hacia las arquitecturas de compuerta completa (GAA - Gate-All-Around) con nanoláminas apiladas representa el mayor hito de ingeniería en la industria de los semiconductores en los últimos quince años.",
      s1: "Control Electrostático Superior y Supresión de Fugas de Corriente",
      p2: "Al rodear el canal de conducción por los cuatro lados con el material de compuerta, las fundiciones logran un control electrostático impecable que reduce las corrientes de fuga a niveles mínimos y permite voltajes de operación inferiores a los 0,7 voltios con frecuencias superiores a los 5 GHz.",
      caption: "Microscopía electrónica de barrido mostrando las nanoláminas GAA superpuestas en un nodo de 3 nanómetros.",
      s2: "Rendimiento por Vatio en Servidores y Dispositivos Móviles",
      p3: "Las mejoras medidas en silicio comercial arrojan incrementos de hasta un 30% en eficiencia energética a igual velocidad de reloj, permitiendo a los dispositivos móviles sostener cargas intensas de procesamiento gráfico sin estrangulamiento térmico.",
      s3: "Valoración Editorial de InnovaTech",
      p4: "La maduración del proceso GAA certifica que la física de los semiconductores sigue encontrando vías innovadoras para extender la ley de Moore hacia el horizonte atómico de los próximos años."
    },
    {
      title: "Microsoft limita su nube: Game Pass Ultimate ahora sólo te permite usar tus propios juegos adquiridos",
      p1: "Microsoft ha anunciado una modificación sustancial en la política de funcionamiento de su plataforma de videojuegos en la nube Xbox Cloud Gaming vinculada a la suscripción Game Pass Ultimate, introduciendo nuevas condiciones para el juego en streaming.",
      s1: "Optimización de Infraestructuras y Derechos de Licenciamiento",
      p2: "La compañía ha explicado que la medida responde a la necesidad de equilibrar la creciente demanda de servidores y ordenar los acuerdos de distribución digital con los estudios independientes y grandes editoras internacionales que exigen compras individuales.",
      caption: "Centro de servidores Azure con tarjetas de procesamiento gráfico dedicadas a la transmisión de juegos en la nube.",
      s2: "Reacción de la Comunidad de Jugadores y Ecosistema Portátil",
      p3: "Los poseedores de consolas portátiles y usuarios de Smart TVs han mostrado opiniones divididas, valorando la estabilidad técnica del servicio pero lamentando la pérdida de títulos incluidos en el catálogo rotatorio clásico.",
      s3: "Análisis Editorial de InnovaTech",
      p4: "Este movimiento refleja la compleja rentabilidad de los modelos de suscripción de tarifa plana en el sector del entretenimiento digital cuando los costes energéticos y de ancho de banda se disparan."
    },
    {
      title: "Apple prepara el mayor salto gráfico de sus SoC para iPhone y Mac con núcleos de trazado de rayos por hardware de segunda generación",
      p1: "Informes de las cadenas de suministro en Taiwán confirman que la próxima generación de procesadores diseñados por Apple en Cupertino incorporará una GPU completamente rediseñada con aceleración nativa de trazado de rayos y cálculo neuronal por hardware.",
      s1: "Mapeo de Coherencia de Rayos y Compresión de Malla Geométrica",
      p2: "La nueva arquitectura gráfica integra unidades de intersección BVH capaces de triplicar el cálculo de rebotes de luz por segundo en comparación con la generación previa, permitiendo iluminación global dinámica en tiempo real y reflejos hiperrealistas en videojuegos AAA.",
      caption: "Esquema conceptual del diseño monolítico del nuevo procesador de Apple fabricado sobre nodo avanzado.",
      s2: "Ecosistema Metal 4 y Escalado Temporal Neural",
      p3: "El nuevo framework gráfico Metal 4 aprovechará los motores de red neuronal de la GPU para reconstruir imágenes en resolución 4K a partir de renderizados a 1080p sin pérdida perceptible de nitidez ni artefactos temporales.",
      s3: "Reflexión Editorial de InnovaTech",
      p4: "Apple redobla su apuesta por convertir a sus plataformas en destinos de primer orden para los entusiastas del videojuego, desafiando el dominio tradicional del ecosistema PC y consolas domésticas."
    },
    {
      title: "AMD RDNA 5 alcanzaría los 3,4 GHz: información interna acota las frecuencias y rendimiento por vatio de las nuevas Radeon",
      p1: "Filtraciones técnicas procedentes de laboratorios de validación de placas han revelado los primeros datos de rendimiento de la arquitectura gráfica AMD RDNA 5. Los nuevos chips prometen alcanzar frecuencias de reloj sostenidas de hasta 3,4 GHz con refrigeración convencional por aire.",
      s1: "Diseño Basado en Chiplets con Interconexión Infinity Fanout",
      p2: "Siguiendo la exitosa filosofía modular de los procesadores Ryzen, AMD separa el núcleo de cálculo gráfico (GCD) de las matrices de memoria y caché (MCD), optimizando los costes de producción y permitiendo configuraciones térmicas muy agresivas.",
      caption: "Módulo gráfico experimental de pruebas montado en un banco de ensayos para medición de frecuencias y voltajes.",
      s2: "Rivalidad Directa en la Gama Alta de Tarjetas Gráficas",
      p3: "Las estimaciones preliminares apuntan a que estas frecuencias permitirán a las tarjetas Radeon competir de tú a tú en resoluciones 4K ultra con las propuestas de la competencia, ofreciendo un consumo eléctrico más contenido.",
      s3: "Comentario Editorial de InnovaTech",
      p4: "La competencia en el mercado gráfico es vital para evitar una escalada de precios insostenible para los usuarios. Si AMD materializa estos registros, el mercado de tarjetas gráficas vivirá un renacimiento muy saludable."
    },
    {
      title: "TSMC inicia la producción en riesgo de su nodo de 2 nanómetros N2 con entrega de energía por la cara posterior (A16)",
      p1: "Taiwan Semiconductor Manufacturing Company (TSMC) ha anunciado oficialmente el encendido de sus líneas piloto para la fabricación en riesgo del nodo de 2 nanómetros, denominado N2, que incluirá la variante avanzada A16 con distribución de energía trasera (Backside Power Delivery).",
      s1: "SuperPower Rail y Eliminación de Caídas de Tensión IR Drop",
      p2: "Al trasladar las pistas metálicas de alimentación eléctrica a la parte posterior de la oblea de silicio, los diseñadores liberan la cara frontal exclusivamente para el enrutamiento de señales de datos, eliminando las pérdidas de voltaje por resistencia interna y ganando un 15% de densidad lógica.",
      caption: "Oblea de silicio de 300 mm en una sala limpia automatizada durante los procesos de fotolitografía ultravioleta extrema.",
      s2: "Clientes Iniciales: Servidores de IA y Teléfonos de Máxima Gama",
      p3: "Los principales clientes tecnológicos internacionales ya han reservado la totalidad de la capacidad de producción de las nuevas fábricas para garantizar el suministro de sus procesadores insignia a partir de 2026.",
      s3: "Balance Editorial de InnovaTech",
      p4: "La red de alimentación trasera es uno de los saltos de ingeniería más audaces de la historia moderna de los chips. Quien domine esta tecnología dominará la eficiencia de los centros de datos del mundo."
    },
    {
      title: "La revolución de las memorias HBM4: interconexión 3D apilada que supera los 2 Terabytes por segundo de ancho de banda",
      p1: "Los principales fabricantes de memoria dinámica han finalizado la especificación JEDEC para el estándar HBM4. Este nuevo formato de memoria de alto ancho de banda redefine la integración tridimensional al incorporar una matriz lógica base fabricada en nodos avanzados de 4 nanómetros.",
      s1: "Bus de 2048 Bits y Apilamiento de 16 Capas de Silicio",
      p2: "El salto desde el bus de 1024 bits de HBM3 al bus masivo de 2048 bits de HBM4 duplica el rendimiento por paquete, alcanzando una tasa de transferencia de datos superior a los 2 Terabytes por segundo por cada módulo integrado.",
      caption: "Estructura tridimensional microscópica de capas de silicio apiladas mediante vías pasantes Through-Silicon Vias.",
      s2: "Eliminación del Cuello de Botella en el Entrenamiento de Redes Neuronales",
      p3: "La velocidad de acceso a la memoria ha sido históricamente el principal freno para acelerar el entrenamiento de grandes modelos lingüísticos. HBM4 disuelve este obstáculo, permitiendo que los clústeres operen a plena capacidad.",
      s3: "Perspectiva Editorial de InnovaTech",
      p4: "La memoria HBM4 demuestra que la verdadera batalla del hardware de cómputo moderno se libra en el ancho de banda y la proximidad física entre los datos y los núcleos de procesamiento."
    },
    {
      title: "Intel revela la arquitectura Clearwater Forest: 288 núcleos eficientes sobre el avanzado proceso de fabricación Intel 18A",
      p1: "Intel ha desvelado las especificaciones técnicas completas de su procesador para centros de datos Clearwater Forest. Con una impactante configuración de hasta 288 núcleos eficientes de arquitectura Darkmont, el chip estrena comercialmente el proceso de fabricación Intel 18A.",
      s1: "Transistores RibbonFET y Alimentación PowerVia",
      p2: "Clearwater Forest combina la tecnología propietaria de transistores RibbonFET con la red de energía PowerVia en la cara posterior. Esto permite condensar 288 núcleos físicos en un zócalo con una reducción del 40% en consumo eléctrico frente a la generación anterior.",
      caption: "Socket de servidor de alta densidad con procesador Intel Clearwater Forest y disipador pasivo de cobre.",
      s2: "Enfoque en Cargas de Trabajo Nativas en la Nube y Microservicios",
      p3: "Diseñado específicamente para proveedores de servicios en la nube, el procesador maximiza la densidad de hilos por rack de servidores, permitiendo alojar miles de contenedores Docker simultáneos con latencias deterministas.",
      s3: "Evaluación Editorial de InnovaTech",
      p4: "Con Intel 18A, la compañía de Santa Clara demuestra que su ambicioso plan de recuperar la paridad y el liderazgo en fabricación de semiconductores avanza con solidez técnica en el mercado empresarial."
    },
    {
      title: "Refrigeración por inmersión bifásica: cómo los nuevos servidores para centros de datos reducen el consumo energético un 40%",
      p1: "El vertiginoso aumento en la densidad térmica de los procesadores de última generación está forzando a los centros de datos a abandonar el aire acondicionado convencional en favor de la refrigeración por inmersión líquida bifásica con fluidos dieléctricos ecológicos.",
      s1: "Termodinámica del Cambio de Fase y Condensación de Vapor",
      p2: "Los servidores se sumergen completamente en un líquido dieléctrico no conductor que hierve a una temperatura controlada de 50 grados Celsius al contacto con los chips calientes. El vapor asciende a un serpentín superior donde se condensa y vuelve a caer por gravedad sin necesidad de bombas mecánicas.",
      caption: "Tanque sellado de refrigeración por inmersión bifásica con servidores operando sumergidos en fluido dieléctrico.",
      s2: "Supresión de Ventiladores Ruidosos y Protección contra Polvo",
      p3: "Al eliminar los ventiladores y el flujo de aire ambiental, los componentes electrónicos no sufren corrosión por humedad ni acumulación de partículas de polvo, extendiendo la vida útil del hardware en más de un 35%.",
      s3: "Opinión Editorial de InnovaTech",
      p4: "La refrigeración por inmersión es una de las innovaciones de ingeniería más elegantes y necesarias para garantizar que el crecimiento de la economía digital sea compatible con los objetivos de sostenibilidad energética global."
    },
    {
      title: "Placas base sin cables a la vista: la estandarización del estándar BTF y Stealth se impone en el montaje de PC para entusiastas",
      p1: "El mercado del montaje de ordenadores personales para entusiastas y creadores de contenido ha alcanzado un consenso definitivo en torno a los formatos BTF (Back-To-the-Future) y Stealth, que reubican la totalidad de los conectores de alimentación en la parte trasera del circuito impreso.",
      s1: "Ranuras de Conexión Inversa y Chasis Especializados",
      p2: "Al situar los puertos ATX de 24 pines, los conectores EPS de la CPU, las tomas de ventilador y las cabeceras SATA en la cara posterior de la placa, el compartimento principal queda libre de cableado visible, mejorando el flujo aerodinámico de aire en un 20%.",
      caption: "Montaje de placa base con conectores traseros y chasis panorámico de doble cámara libre de cables visibles.",
      s2: "Conector Gráfico PCIe de Alta Potencia Integrado en Placa",
      p3: "El estándar incluye una ranura de alimentación adicional capaz de suministrar hasta 600 vatios a la tarjeta gráfica directamente desde la placa base, erradicando los riesgosos cables 12V-2x6 que cuelgan del frontal del equipo.",
      s3: "Veredicto Editorial de InnovaTech",
      p4: "El estándar de conectores traseros no solo aporta una estética inmaculada a los montajes modernos, sino que simplifica drásticamente el ensamblaje y mejora la refrigeración pasiva de los componentes críticos."
    },
    {
      title: "Almacenamiento SSD PCIe 5.0 de segunda generación: controladoras térmicas de 7nm alcanzan velocidades de 14.500 MB/s sin ventilador",
      p1: "Los primeros discos de estado sólido PCIe 5.0 sufrieron severos problemas de sobrecalentamiento que obligaban a utilizar disipadores voluminosos con pequeños ventiladores ruidosos. La segunda generación de controladoras fabricadas en 7 nanómetros ha resuelto este inconveniente.",
      s1: "Eficiencia de las Nuevas Controladoras Phison y Silicon Motion",
      p2: "Gracias a la litografía más reducida, las nuevas controladoras consumen menos de 6 vatios a pleno rendimiento secuencial de 14.500 MB/s en lectura y 12.000 MB/s en escritura, permitiendo disipación pasiva de bajo perfil incluso en ordenadores portátiles delgados.",
      caption: "Módulo SSD M.2 PCIe 5.0 con disipador de aluminio anodizado instalado en una ranura de alta velocidad.",
      s2: "Tiempos de Carga Instantáneos con DirectStorage en Juegos y Edición 8K",
      p3: "La saturación del bus PCIe 5.0 x4 permite descomprimir activos de juego directamente en la memoria de la tarjeta gráfica en fracciones de segundo y editar flujos de vídeo ProRes RAW 8K sin necesidad de generar archivos proxy intermedios.",
      s3: "Balance Editorial de InnovaTech",
      p4: "La madurez térmica del almacenamiento PCIe 5.0 elimina el último escollo que frenaba su adopción masiva. Los usuarios profesionales y jugadores exigentes disponen ahora de una velocidad extrema con total silencio operativo."
    }
  ];

  hwArticlesDef.forEach((def, idx) => {
    articles.push({
      id: `art-innovatech-hw-${idx + 1}`,
      title: def.title,
      link: `https://innovatech.editorial/noticias/hardware/${idx + 1}`,
      creator: "Laboratorio de Hardware InnovaTech",
      pubDate: new Date(Date.now() - idx * 3600000 * 4).toISOString(),
      content: makeArticleHtml(
        def.title,
        "Hardware",
        def.p1,
        def.s1,
        def.p2,
        IMAGES.hardware.inlines[idx],
        def.caption,
        def.s2,
        def.p3,
        def.s3,
        def.p4
      ),
      contentSnippet: def.p1.substring(0, 220) + "...",
      categories: ["Hardware", "Semiconductores", "Arquitectura de PC"],
      imageUrl: IMAGES.hardware.heroes[idx],
      topic: 'hardware',
      lang: 'es'
    });
  });

  // ==========================================
  // CATEGORY: SOFTWARE - 10 Articles
  // ==========================================
  const swArticlesDef = [
    {
      title: "Criptografía Post-Cuántica: Protegiendo las Comunicaciones Globales frente a la computación cuántica",
      p1: "El Instituto Nacional de Estándares y Tecnología (NIST) y las agencias de ciberseguridad internacionales han finalizado la publicación de los primeros estándares oficiales de criptografía post-cuántica (PQC), diseñados para resistir ataques de ordenadores cuánticos futuros.",
      s1: "Algoritmos Basados en Retículos: ML-KEM y ML-DSA",
      p2: "Los nuevos algoritmos reemplazan a los esquemas clásicos RSA y curva elíptica basándose en la dificultad matemática de resolver problemas en retículos multidimensionales. Su implantación es urgente ante la amenaza de actores maliciosos que capturan tráfico cifrado hoy para descifrarlo en el futuro.",
      caption: "Representación matemática tridimensional de un retículo criptográfico utilizado en el algoritmo ML-KEM.",
      s2: "Integración en Navegadores Web, TLS y Certificados Digitales",
      p3: "Las principales entidades bancarias y plataformas en la nube ya han comenzado a activar el soporte híbrido en sus conexiones TLS 1.3, combinando el cifrado tradicional con las nuevas claves post-cuánticas sin penalizar la velocidad de carga de las páginas web.",
      s3: "Valoración Editorial de InnovaTech",
      p4: "La migración hacia la criptografía post-cuántica es la mayor renovación de la infraestructura de seguridad de Internet desde su nacimiento. Las organizaciones que pospongan esta transición pondrán en grave riesgo sus datos más confidenciales."
    },
    {
      title: "El Auge de los Sistemas Operativos Inmutables en Entornos de Producción y Desarrollo con contenedores atómicos",
      p1: "La adopción de distribuciones Linux inmutables está transformando la administración de sistemas corporativos y estaciones de trabajo de desarrollo. Al montar el sistema de archivos raíz en modo de solo lectura, se erradican las roturas por actualizaciones fallidas.",
      s1: "Actualizaciones Atómicas Basadas en Imágenes y Despliegues A/B",
      p2: "En los sistemas inmutables, cualquier actualización se aplica como una nueva imagen del sistema en segundo plano. Si ocurre un fallo tras el reinicio, el gestor de arranque revierte automáticamente a la versión previa intacta en cuestión de segundos, garantizando alta disponibilidad.",
      caption: "Terminal de administración de sistemas mostrando el despliegue atómico de imágenes inmutables en servidores.",
      s2: "Aislamiento de Aplicaciones Mediante Flatpak y Contenedores OCI",
      p3: "Todo el software de usuario se ejecuta encapsulado en contenedores o paquetes aislados, lo que impide que librerías en conflicto alteren las dependencias críticas del núcleo del sistema operativo.",
      s3: "Reflexión Editorial de InnovaTech",
      p4: "La inmutabilidad del sistema operativo aporta la misma previsibilidad y robustez que los contenedores llevaron a la nube hace una década. Es una de las tendencias de ingeniería de software más recomendables del momento."
    },
    {
      title: "Audacity 4.0 estrena interfaz y un nuevo modelo de edición de audio no destructivo con soporte para plugins VST3",
      p1: "El editor de audio de código abierto más popular del mundo, Audacity, ha alcanzado su esperada versión 4.0. La actualización introduce una interfaz gráfica totalmente rediseñada con modos oscuro y claro de alto contraste, así como un motor de reproducción no destructivo en tiempo real.",
      s1: "Efectos en Tiempo Real y Cadenas de Masterización Modular",
      p2: "Los creadores de contenido sonoro pueden ahora aplicar ecualizadores, compresores dinámicos y plugins VST3 en pistas activas sin modificar el archivo original en disco, permitiendo ajustar parámetros durante la escucha previa con latencia cero.",
      caption: "Espacio de trabajo de Audacity 4.0 con la nueva interfaz gráfica y paneles de efectos en tiempo real.",
      s2: "Compatibilidad Multiplataforma y Exportación en Formatos Hi-Res",
      p3: "La aplicación optimiza su rendimiento en procesadores Apple Silicon y chips ARM64 en Linux, ofreciendo soporte nativo para audio en formato FLAC de 32 bits en coma flotante y frecuencias de muestreo de hasta 192 kHz.",
      s3: "Comentario Editorial de InnovaTech",
      p4: "Audacity 4.0 demuestra el vigor del software libre cuando se combinan recursos profesionales con el respeto a la privacidad del usuario, consolidándose como la alternativa gratuita definitiva a los DAW comerciales."
    },
    {
      title: "Copilot no funciona en la barra lateral de Edge: cómo solucionar el error común de sincronización de perfiles",
      p1: "Un número creciente de usuarios del navegador Microsoft Edge ha reportado bloqueos intermitentes en el panel lateral de asistencia inteligente Copilot, donde la herramienta queda en bucle de carga o muestra un mensaje genérico de error de conexión.",
      s1: "Causa Raíz: Corrupción en la Caché de Autenticación de Cuenta Microsoft",
      p2: "El equipo técnico de InnovaTech ha analizado el fallo, confirmando que se debe a una desincronización entre las credenciales de la cuenta corporativa o personal de Microsoft almacenadas en el servicio de tokens de Windows y la sesión web activa del navegador.",
      caption: "Captura de los ajustes de configuración de perfiles y privacidad en el navegador Microsoft Edge.",
      s2: "Guía Paso a Paso para Restaurar la Funcionalidad de la Barra Lateral",
      p3: "Para solucionar el problema basta con acceder a Configuración > Perfiles > Cerrar sesión, marcar la limpieza de datos en el dispositivo local, reiniciar el navegador y volver a iniciar sesión activando la casilla de sincronización de extensiones.",
      s3: "Apunte Editorial de InnovaTech",
      p4: "La creciente integración de servicios de inteligencia artificial en el corazón de los navegadores exige a las compañías robustecer los mecanismos de manejo de errores para no degradar la experiencia de usuario diaria."
    },
    {
      title: "Microsoft confirma el fallo del cursor en Windows 11 tras la actualización acumulativa y publica un parche de emergencia",
      p1: "Microsoft ha reconocido formalmente la existencia de una anomalía gráfica en la última actualización acumulativa de Windows 11 que provocaba la desaparición o parpadeo errático del cursor del ratón en monitores con frecuencias de refresco variables (VRR).",
      s1: "Incompatibilidad entre el Administrador de Ventanas DWM y Controladores GPU",
      p2: "El error se manifestaba en configuraciones con tarjetas gráficas dedicadas al alternar entre aplicaciones en modo ventana sin bordes y juegos a pantalla completa, debido a un cálculo defectuoso en el plano de composición de hardware del Desktop Window Manager.",
      caption: "Ventana del catálogo de actualizaciones de Windows Update mostrando la descarga del parche correctivo KB5039.",
      s2: "Despliegue Inmediato Mediante el Mecanismo Known Issue Rollback (KIR)",
      p3: "La compañía ha activado la reversión remota de la función afectada a través del protocolo KIR para usuarios domésticos y ha liberado un parche específico fuera de banda en el catálogo de Windows Update para administradores de sistemas empresariales.",
      s3: "Juicio Editorial de InnovaTech",
      p4: "La rápida respuesta de Microsoft mitiga el malestar de los usuarios, pero evidencia la necesidad de reforzar los programas de prueba internos antes de liberar actualizaciones acumulativas obligatorias."
    },
    {
      title: "Linux Kernel 6.14 llega con soporte optimizado para procesadores híbridos, mejoras en el programador BPF y controladores Rust",
      p1: "Linus Torvalds ha anunciado la disponibilidad general de la versión 6.14 del núcleo Linux. Esta iteración destaca por una reestructuración profunda del planificador de tareas para sacar el máximo rendimiento a los procesadores modernos con arquitecturas híbridas de núcleos grandes y eficientes.",
      s1: "Asignación de Cargas Heterogéneas y Reducción de Latencias eBPF",
      p2: "El planificador CFS incorpora nuevas métricas de eficiencia energética que derivan hilos de baja prioridad a los núcleos eficientes en reposo, reservando los núcleos de alto rendimiento para tareas en primer plano. Además, el subsistema eBPF gana nuevas sondas de rastreo seguras.",
      caption: "Líneas de código en lenguaje Rust integradas en el árbol oficial de controladores del núcleo Linux.",
      s2: "Mayor Presencia de Rust en Controladores de Dispositivos de Red",
      p3: "La transición gradual hacia Rust continúa consolidándose con la inclusión de nuevos controladores para tarjetas de red inalámbrica y almacenamiento NVMe escritos íntegramente en este lenguaje seguro en memoria.",
      s3: "Valoración Editorial de InnovaTech",
      p4: "Linux sigue siendo el motor silencioso e imparable de la infraestructura informática mundial. La integración de Rust fortalece su seguridad contra vulnerabilidades de desbordamiento de búfer en componentes críticos."
    },
    {
      title: "La consolidación de WebAssembly (WASM) en el backend: microservicios sin servidor que inician en menos de un milisegundo",
      p1: "WebAssembly ha dejado de ser una tecnología exclusiva de los navegadores web para convertirse en la alternativa más eficiente a los contenedores Docker en arquitecturas de backend y computación perimetral sin servidor (serverless).",
      s1: "Tiempos de Arranque en Frío de Microsegundos y Seguridad Sandbox",
      p2: "Al compilar lenguajes como Rust, C++ o Go a binarios WASM universales, los módulos pueden instanciarse en entornos de ejecución livianos como Wasmtime en menos de 500 microsegundos con un aislamiento estricto de memoria basado en capacidades (WASI).",
      caption: "Diagrama comparativo de uso de memoria y tiempo de arranque entre contenedores Docker y módulos WebAssembly.",
      s2: "Reducción de Costes en Plataformas de Cloud Computing",
      p3: "Proveedores de infraestructura en el borde reportan que pueden alojar hasta diez veces más servicios concurrentes por servidor físico que con máquinas virtuales tradicionales, rebajando radicalmente las facturas de cómputo en la nube.",
      s3: "Reflexión Editorial de InnovaTech",
      p4: "WASM en el backend está escribiendo el siguiente capítulo de la computación en la nube. Su ligereza y neutralidad de plataforma ofrecen una eficiencia energética sin precedentes."
    },
    {
      title: "TypeScript 5.8: chequeo estricto de tipos en tiempo de diseño, optimizaciones de compilación y nuevas utilidades de inferencia",
      p1: "El equipo de desarrollo de TypeScript en Microsoft ha liberado la versión 5.8 del lenguaje tipado sobre JavaScript. La entrega se enfoca en acelerar la velocidad del compilador en bases de código masivas y en perfeccionar la inferencia de tipos en uniones condicionales complejas.",
      s1: "Análisis de Flujo de Control Mejorado en Funciones Asíncronas",
      p2: "El compilador detecta ahora con precisión matemática casos donde una variable puede quedar indefinida tras la resolución de una promesa encadenada, evitando excepciones en tiempo de ejecución causadas por lecturas nulas no controladas.",
      caption: "Editor de código VS Code mostrando la comprobación estricta de tipos en tiempo real de TypeScript 5.8.",
      s2: "Caché Incremental Inteligente y Menor Uso de RAM en el Servidor de Lenguaje",
      p3: "Los proyectos monorepo de gran escala experimentan reducciones de hasta un 40% en los tiempos de verificación de tipos gracias a un nuevo motor de indexación de declaraciones que descarta reevaluaciones redundantes de librerías externas.",
      s3: "Apunte Editorial de InnovaTech",
      p4: "TypeScript se consolida como el estándar indiscutible para el desarrollo web robusto y escalable. Cada actualización reafirma su compromiso con el rendimiento del desarrollador."
    },
    {
      title: "PostgreSQL 18: paralelismo avanzado en consultas JSONB, particionado automático y mayor rendimiento en cargas analíticas",
      p1: "El Grupo de Desarrollo Global de PostgreSQL ha presentado las principales novedades de la versión 18 de su veterano gestor de bases de datos relacionales de código abierto, incorporando mejoras drásticas en el procesamiento analítico concurrente.",
      s1: "Indexación Avanzada y Deserialización Vectorizada de JSON",
      p2: "Las consultas que filtran sobre atributos embebidos en columnas de tipo JSONB aprovechan ahora instrucciones vectoriales SIMD de la CPU para deserializar datos en memoria a velocidad de silicio, superando en benchmarks a motores de documentos dedicados.",
      caption: "Gráfica de rendimiento analítico mostrando las tasas de transacción por segundo de PostgreSQL 18.",
      s2: "Particionado Declarativo Automático y Resiliencia en Réplicas",
      p3: "La creación dinámica de particiones temporales simplifica la administración de series temporales y registros de auditoría de millones de filas sin necesidad de crear disparadores manuales propensos a errores.",
      s3: "Comentario Editorial de InnovaTech",
      p4: "PostgreSQL 18 demuestra por qué sigue siendo el motor de bases de datos más versátil y respetado de la industria del software. Su capacidad de evolucionar sin romper la compatibilidad histórica es encomiable."
    },
    {
      title: "Next.js 16 y el nuevo compilador Turbopack: renderizado parcial prerenderizado y optimización automática de dependencias",
      p1: "Vercel ha lanzado Next.js 16, marcando la adopción por defecto y estable de Turbopack como el motor de compilación oficial del framework. Esta versión introduce además el renderizado parcial prerenderizado (PPR) para fusionar páginas estáticas con secciones dinámicas sin fisuras.",
      s1: "Turbopack en Producción: Compilaciones Diez Veces Más Rápidas",
      p2: "Escrito íntegramente en Rust, Turbopack elimina por completo la necesidad de empaquetadores legacy como Webpack en proyectos Next.js, reduciendo los tiempos de arranque en desarrollo de decenas de segundos a menos de doscientos milisegundos.",
      caption: "Métricas de compilación y tiempos de respuesta de renderizado parcial de componentes en Next.js 16.",
      s2: "Optimización Automática de Imágenes, Fuentes y Scripts de Terceros",
      p3: "El framework analiza automáticamente las hojas de estilo y recursos multimedia en tiempo de compilación para generar cargas críticas en línea y diferir el resto, garantizando puntuaciones de 100 en las métricas Core Web Vitals de Google.",
      s3: "Balance Editorial de InnovaTech",
      p4: "Next.js 16 consolida el estándar del desarrollo web moderno de alto rendimiento, facilitando a desarrolladores y empresas la entrega de experiencias de navegación fluidas que optimizan la visibilidad en motores de búsqueda."
    }
  ];

  swArticlesDef.forEach((def, idx) => {
    articles.push({
      id: `art-innovatech-sw-${idx + 1}`,
      title: def.title,
      link: `https://innovatech.editorial/noticias/software/${idx + 1}`,
      creator: "Redacción de Software InnovaTech",
      pubDate: new Date(Date.now() - idx * 3600000 * 4.2).toISOString(),
      content: makeArticleHtml(
        def.title,
        "Software",
        def.p1,
        def.s1,
        def.p2,
        IMAGES.software.inlines[idx],
        def.caption,
        def.s2,
        def.p3,
        def.s3,
        def.p4
      ),
      contentSnippet: def.p1.substring(0, 220) + "...",
      categories: ["Software", "Sistemas Operativos", "Desarrollo Web"],
      imageUrl: IMAGES.software.heroes[idx],
      topic: 'software',
      lang: 'es'
    });
  });

  // ==========================================
  // CATEGORY: GADGETS - 10 Articles
  // ==========================================
  const gadgetsArticlesDef = [
    {
      title: "DJI Neo 2: el nuevo dron ultraligero con seguimiento biométrico por IA y grabación 4K",
      p1: "DJI ha presentado el DJI Neo 2, un dron de tamaño de bolsillo con un peso de tan solo 135 gramos que prescinde de mando tradicional para despegar y aterrizar directamente desde la palma de la mano del usuario mediante comandos gestuales y reconocimiento biométrico.",
      s1: "Seguimiento Inteligente por Visión Artificial y Grabación 4K Estabilizada",
      p2: "Equipado con un sensor de 1/2 pulgada y estabilización mecánica en un eje combinada con algoritmos electrónicos RockSteady, el Neo 2 captura secuencias en resolución 4K a 60 fps mientras mantiene al usuario perfectamente encuadrado durante actividades deportivas.",
      caption: "DJI Neo 2 realizando despegue autónomo desde la palma de la mano con protectores integrales de hélices.",
      s2: "Protectores Integrales de Hélices y Autonomía de 18 Minutos",
      p3: "Las protecciones de hélice completas garantizan un vuelo seguro en interiores y entornos boscosos. Su batería intercambiable proporciona hasta 18 minutos de grabación continua y se recarga mediante puerto USB-C convencional con protocolo Power Delivery.",
      s3: "Veredicto Editorial de InnovaTech",
      p4: "El DJI Neo 2 redefine la categoría de los drones personales para creadores de contenido y deportistas, ofreciendo la mejor relación entre portabilidad, calidad de imagen y sencillez de uso del mercado actual."
    },
    {
      title: "Gadgets Sostenibles y Reparabilidad: Tendencias en Electrónica de Consumo con diseño modular y baterías reemplazables",
      p1: "La presión regulatoria de la Unión Europea y una creciente conciencia medioambiental entre los consumidores están obligando a los grandes fabricantes de tecnología a adoptar diseños modulares donde las piezas puedan repararse en casa con herramientas comunes.",
      s1: "Normativas de Ecodiseño y Baterías de Fácil Extracción",
      p2: "Las nuevas generaciones de teléfonos inteligentes, auriculares inalámbricos y portátiles prescinden de pegamentos industriales agresivos en favor de fijaciones magnéticas y tornillos estándar, facilitando el cambio de batería en menos de cinco minutos.",
      caption: "Despiece modular de un dispositivo electrónico de consumo mostrando sus módulos independientes reparables.",
      s2: "Acceso Universal a Manuales Oficiales y Repuestos Originales",
      p3: "Las marcas han abierto portales públicos de autoservicio donde cualquier ciudadano puede adquirir pantallas, conectores de carga y altavoces originales a precios regulados, combatiendo de raíz la obsolescencia programada.",
      s3: "Opinión Editorial de InnovaTech",
      p4: "El avance hacia la reparabilidad es una victoria para los derechos del consumidor y para la salud del planeta. La mejor tecnología no es solo la más potente, sino la que dura más tiempo en perfectas condiciones de uso."
    },
    {
      title: "Dreame presenta en IFA 2026 un robot con vapor, cámara 8K, cepillo auto-desenredante y estación de vaciado inteligente",
      p1: "La feria tecnológica de Berlín ha sido el escenario elegido por Dreame para desvelar su nuevo buque insignia en domótica doméstica, un robot aspirador y fregador que incorpora desinfección activa por vapor caliente y navegación guiada por cámara estereoscópica 8K.",
      s1: "Fregado Térmico a 60 Grados y Cepillo Anti-Enredos TriCut",
      p2: "El sistema disuelve manchas resecas de grasa en suelos cerámicos y de madera mediante un flujo constante de vapor a alta temperatura, mientras su rodillo principal corta automáticamente pelos y fibras acumuladas antes de que puedan trabar el motor de succión de 12.000 Pa.",
      caption: "Estación de autolimpieza inteligente de Dreame realizando el lavado y secado automático de mopas con aire caliente.",
      s2: "Estación Automatizada con Conexión a Toma de Agua y Desagüe",
      p3: "La base de mantenimiento puede conectarse directamente a la fontanería de la vivienda, vaciando el polvo acumulado en una bolsa sellada para 90 días y rellenando el depósito de agua limpia sin ninguna intervención humana durante meses.",
      s3: "Evaluación Editorial de InnovaTech",
      p4: "La robotización del hogar alcanza cotas de sofisticación sin precedentes. Este modelo demuestra que la verdadera comodidad radica en la automatización completa del ciclo de mantenimiento del aparato."
    },
    {
      title: "Nuevo tado° X de 2ª generación: más fino, táctil, con batería recargable y compatibilidad universal con Matter over Thread",
      p1: "El especialista europeo en climatización inteligente tado° ha renovado su gama de cabezales termostáticos con el lanzamiento de la segunda generación de tado° X. El dispositivo estrena un diseño cilíndrico minimalista con pantalla matricial táctil integrada.",
      s1: "Batería de Iones de Litio Extraíble con Carga USB-C",
      p2: "Abandonando las tradicionales pilas desechables, el cabezal incorpora un módulo de batería recargable que dura toda la temporada de calefacción y puede retirarse con un clic para cargarse en cualquier cargador de teléfono móvil en un par de horas.",
      caption: "Cabezal termostático tado° X montado en un radiador de diseño mostrando la temperatura en su pantalla táctil.",
      s2: "Conectividad Nativa Matter over Thread sin Puente Propietario",
      p3: "Gracias a su radio Thread certificada para Matter, el termostato se comunica de forma directa y local con Apple Home, Google Home o Alexa sin necesidad de adquirir pasarelas intermedias, respondiendo al instante a cambios de temperatura programados.",
      s3: "Balance Editorial de InnovaTech",
      p4: "Con el tado° X de 2ª generación, el ahorro energético en calefacción se vuelve accesible, estético y respetuoso con el medio ambiente, reduciendo hasta un 30% la factura de gas o electricidad sin perder confort."
    },
    {
      title: "Análisis a fondo de las gafas inteligentes de realidad aumentada con pantallas microLED transparentes y audio espacial direccional",
      p1: "Hemos probado durante tres semanas las nuevas gafas de realidad aumentada para uso diario desarrolladas por los pioneros de la óptica holográfica. Con un peso de apenas 68 gramos, su montura pasa completamente desapercibida como unas gafas de graduación convencionales.",
      s1: "Micro-Displays MicroLED de 5.000 Nits en Guías de Onda Difractivas",
      p2: "Los proyectores microscópicos emiten una imagen brillante que resulta perfectamente legible incluso bajo la luz solar directa del mediodía, superponiendo indicaciones de navegación GPS giro a giro, traducciones de texto en directo y transcripciones de llamadas.",
      caption: "Gafas inteligentes de realidad aumentada mostrando la interfaz gráfica proyectada sobre la lente transparente.",
      s2: "Audio Direccional que Respeta la Privacidad Auditiva",
      p3: "Los transductores de sonido ubicados en las patillas canalizan el audio directamente hacia el canal auditivo del usuario mediante cancelación acústica de fase, impidiendo que personas situadas a menos de un metro escuchen la conversación telefónica.",
      s3: "Juicio Editorial de InnovaTech",
      p4: "Estas gafas demuestran que la computación espacial portable solo triunfará cuando logre el equilibrio perfecto entre ligereza física, diseño socialmente aceptable y utilidad cotidiana real."
    },
    {
      title: "Anillos inteligentes de titanio para monitorización de salud: sensores fotopletismográficos miden apnea del sueño y variabilidad cardíaca",
      p1: "El mercado de los dispositivos vestibles de salud ha encontrado en los anillos inteligentes de titanio de grado aeroespacial a su competidor más serio frente a los relojes tradicionales, gracias a su comodidad para ser llevados ininterrumpidamente durante el descanso nocturno.",
      s1: "Monitoreo Continuo de Temperatura Cutánea y VFC",
      p2: "Al situarse en las arterias digitales de los dedos de la mano, los sensores ópticos y de bioimpedancia captan señales de variabilidad de la frecuencia cardíaca (VFC) con una relación señal-ruido superior a la de la muñeca, permitiendo detectar inicios de procesos febriles e infecciones con 24 horas de antelación.",
      caption: "Anillo inteligente de titanio en su base de carga por inducción magnética inalámbrica.",
      s2: "Detección Precoz de Episodios de Apnea Obstructiva del Sueño",
      p3: "Los algoritmos clínicos del dispositivo registran las caídas en la saturación periférica de oxígeno (SpO2) durante la noche, generando informes médicos estructurados que los usuarios pueden compartir con sus especialistas de medicina del sueño.",
      s3: "Reflexión Editorial de InnovaTech",
      p4: "La miniaturización extrema de los sensores biomédicos en factores de forma discretos como un anillo anticipa una era de medicina preventiva personalizada que cambiará la longevidad humana."
    },
    {
      title: "Monitores portátiles OLED plegables para nómadas digitales: 16 pulgadas, 120 Hz y alimentación con un único cable USB-C PD",
      p1: "Los profesionales móviles y nómadas digitales disponen de una nueva herramienta de productividad con la llegada de los primeros monitores portátiles plegables basados en paneles OLED flexibles, capaces de desplegarse hasta las 16 pulgadas de diagonal y plegarse al tamaño de una libreta A5.",
      s1: "Contraste Infinito, Espacio DCI-P3 100% y Frecuencia de 120 Hz",
      p2: "El panel ofrece una resolución de 2.880 x 1.800 píxeles con tiempos de respuesta de 0,1 milisegundos y negros puros certificados por VESA DisplayHDR True Black 500, convirtiéndolo en un monitor ideal para edición fotográfica y etalonaje de vídeo en ruta.",
      caption: "Monitor portátil OLED plegado a 90 grados funcionando como doble pantalla vertical junto a un ordenador portátil.",
      s2: "Conexión Limpia mediante Cable Único USB-C con Modo DP Alt",
      p3: "Un único cable USB-C transmite la señal de vídeo de alta definición y la energía eléctrica necesaria, reduciendo el desorden en cafeterías, trenes o espacios de trabajo compartido.",
      s3: "Balance Editorial de InnovaTech",
      p4: "La flexibilidad de los paneles OLED ha madurado lo suficiente para ofrecer durabilidad mecánica y rendimiento visual sin concesiones en el equipamiento del profesional que trabaja en movimiento."
    },
    {
      title: "Teclados mecánicos magnéticos con interruptores Hall Effect: actuación analógica milimétrica y disparo rápido para gamers",
      p1: "El sector de los periféricos de juego de alta competición ha adoptado de manera unánime la tecnología de interruptores magnéticos basados en sensores Hall Effect, desbancando a los clásicos mecanismos de contacto metálico.",
      s1: "Ajuste de Actuación Dinámica desde 0,1 mm hasta 4,0 mm",
      p2: "Al medir el campo magnético emitido por un imán integrado en el vástago de la tecla, el software permite al usuario fijar la distancia exacta a la que se registra la pulsación, habilitando funciones de disparo rápido (Rapid Trigger) donde la tecla se desactiva instantáneamente al iniciar el recorrido ascendente.",
      caption: "Teclado mecánico con iluminación RGB por tecla e interruptores magnéticos Hall Effect analizados en banco de pruebas.",
      s2: "Durabilidad Extrema sin Contacto Eléctrico Físico",
      p3: "La ausencia de fricción metálica elimina el desgaste por rebote de contacto y prolonga la vida útil de cada interruptor más allá de los 150 millones de pulsaciones, además de hacerlo completamente inmune a la humedad y derrames accidentales.",
      s3: "Veredicto Editorial de InnovaTech",
      p4: "La tecnología analógica magnética supone el mayor avance en teclados desde la invención del switch mecánico, ofreciendo una precisión quirúrgica que redefine la ventaja competitiva en los deportes electrónicos."
    },
    {
      title: "Cámaras de acción 8K de 360 grados: estabilización giroscópica de nivel profesional y edición automática asistida por IA",
      p1: "Los creadores de deportes extremos y documentalistas de viajes cuentan con una nueva referencia técnica en cámaras panorámicas con la llegada de los modelos de doble lente capaces de grabar vídeo envolvente en resolución 8K nativa a 30 fotogramas por segundo.",
      s1: "Sensores CMOS de Gran Formato y Costura Óptica Invisible",
      p2: "La integración de dos sensores de una pulgada con lentes ojo de pez de cristal de fluorita minimiza las aberraciones cromáticas y las aberraciones en el punto de unión, generando una esfera visual perfecta donde el palo selfie desaparece automáticamente por software.",
      caption: "Cámara de acción 360 montada en un manillar de bicicleta de montaña durante una bajada en terreno accidentado.",
      s2: "Reencuadre Cinematográfico en Postproducción con Seguimiento Facial",
      p3: "Grabar en 360 grados permite al creador no preocuparse por hacia dónde apunta la cámara durante la acción, eligiendo los mejores ángulos, paneos de cámara fluidos y encuadres verticales u horizontales durante la edición posterior en el smartphone.",
      s3: "Apunte Editorial de InnovaTech",
      p4: "La grabación esférica en resolución 8K resuelve definitivamente la pérdida de nitidez que sufrían las generaciones anteriores al reencuadrar, consolidándose como la herramienta creativa más versátil para grabaciones de acción."
    },
    {
      title: "Estaciones de energía portátil LiFePO4 de 2.000 Wh: carga solar ultrarrápida y modo SAI ininterrumpido para emergencias",
      p1: "La demanda de generadores solares limpios y estaciones de energía portátiles ha crecido de forma exponencial, impulsada por entusiastas del campismo y usuarios que buscan respaldar electrodomésticos críticos y equipos de trabajo frente a apagones de la red eléctrica.",
      s1: "Celdas de Fosfato de Hierro y Litio con 4.000 Ciclos de Carga",
      p2: "Las nuevas estaciones utilizan química LiFePO4, mucho más segura y estable químicamente que el litio convencional, garantizando más de diez años de uso diario continuo sin perder más del 20% de su capacidad nominal de almacenamiento.",
      caption: "Estación de energía portátil LiFePO4 conectada a paneles solares plegables en un campamento al aire libre.",
      s2: "Inversor de Onda Senoidal Pura de 2.400 W y Modo SAI de 10 ms",
      p3: "Con capacidad para suministrar picos de potencia de hasta 4.000 vatios y una conmutación automática de red a batería en menos de 10 milisegundos, el equipo mantiene encendidos ordenadores de trabajo, routers de fibra y neveras sin reinicios ni pérdidas de datos.",
      s3: "Conclusión Editorial de InnovaTech",
      p4: "Estas estaciones representan el puente perfecto hacia la independencia energética personal y la resiliencia en situaciones de emergencia climática, combinando alta potencia con energía limpia y silenciosa."
    }
  ];

  gadgetsArticlesDef.forEach((def, idx) => {
    articles.push({
      id: `art-innovatech-gadgets-${idx + 1}`,
      title: def.title,
      link: `https://innovatech.editorial/noticias/gadgets/${idx + 1}`,
      creator: "Especialistas en Gadgets InnovaTech",
      pubDate: new Date(Date.now() - idx * 3600000 * 4.5).toISOString(),
      content: makeArticleHtml(
        def.title,
        "Gadgets",
        def.p1,
        def.s1,
        def.p2,
        IMAGES.gadgets.inlines[idx],
        def.caption,
        def.s2,
        def.p3,
        def.s3,
        def.p4
      ),
      contentSnippet: def.p1.substring(0, 220) + "...",
      categories: ["Gadgets", "Electrónica de Consumo", "Movilidad y Wearables"],
      imageUrl: IMAGES.gadgets.heroes[idx],
      topic: 'gadgets',
      lang: 'es'
    });
  });

  return articles;
}

async function main() {
  console.log("=== INICIANDO GENERACIÓN Y SINCRONIZACIÓN DE LA BASE DE DATOS INNOVATECH ===");
  const allArticles = buildCompleteEditorialDatabase();
  console.log(`Total de artículos generados: ${allArticles.length}`);

  // 1. Validar unicidad absoluta de imágenes y títulos
  const seenImages = new Set<string>();
  const seenTitles = new Set<string>();
  const categoryCounts: Record<string, number> = {};

  for (const art of allArticles) {
    categoryCounts[art.topic] = (categoryCounts[art.topic] || 0) + 1;
    if (seenTitles.has(art.title.toLowerCase().trim())) {
      throw new Error(`Título duplicado detectado: ${art.title}`);
    }
    seenTitles.add(art.title.toLowerCase().trim());

    // Extract hero image key
    const heroMatch = art.imageUrl.match(/photo-[a-zA-Z0-9-]+/);
    if (!heroMatch) throw new Error(`URL de héroe inválida: ${art.imageUrl}`);
    const heroId = heroMatch[0];
    if (seenImages.has(heroId)) {
      throw new Error(`Imagen héroe duplicada detectada: ${heroId} en artículo "${art.title}"`);
    }
    seenImages.add(heroId);

    // Extract inline image key
    const inlineMatch = art.content.match(/src="([^"]+)"/);
    if (!inlineMatch) throw new Error(`Artículo sin imagen inline: ${art.title}`);
    const inlinePhotoMatch = inlineMatch[1].match(/photo-[a-zA-Z0-9-]+/);
    if (!inlinePhotoMatch) throw new Error(`URL inline inválida: ${inlineMatch[1]}`);
    const inlineId = inlinePhotoMatch[0];
    if (seenImages.has(inlineId)) {
      throw new Error(`Imagen inline duplicada detectada: ${inlineId} en artículo "${art.title}"`);
    }
    seenImages.add(inlineId);
  }

  console.log("Distribución por categorías:", categoryCounts);
  console.log(`Total imágenes únicas verificadas: ${seenImages.size} (100% de unicidad sin solapamientos)`);

  // 2. Guardar permanentemente en base de datos local en disco
  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const DB_FILE = path.join(DATA_DIR, 'innovatech_articles.json');
  fs.writeFileSync(DB_FILE, JSON.stringify(allArticles, null, 2), 'utf-8');
  console.log(`[Base de Datos Local] ${allArticles.length} artículos guardados permanentemente en ${DB_FILE}`);

  // 3. Sincronizar con la base de datos Cloud Firestore
  console.log("[Cloud Firestore] Sincronizando colección /articles en Firestore...");
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  let syncedCount = 0;
  for (const art of allArticles) {
    const docRef = doc(db, 'articles', art.id);
    await setDoc(docRef, {
      id: art.id,
      title: art.title,
      link: art.link,
      creator: art.creator,
      pubDate: art.pubDate,
      content: art.content,
      contentSnippet: art.contentSnippet,
      categories: art.categories,
      imageUrl: art.imageUrl,
      sourceUrl: art.sourceUrl || art.link,
      topic: art.topic,
      lang: art.lang
    });
    syncedCount++;
  }
  console.log(`[Cloud Firestore] ¡Éxito! ${syncedCount} artículos sincronizados permanentemente en Firestore.`);

  // 4. Verificar consulta de lectura desde Firestore
  const snap = await getDocs(collection(db, 'articles'));
  console.log(`[Cloud Firestore] Verificación completada. Artículos existentes en Firestore: ${snap.size}`);
  console.log("=== SINCRONIZACIÓN EXITOSA Y COMPLETA ===");
  process.exit(0);
}

main().catch(err => {
  console.error("Error fatal en la sincronización:", err);
  process.exit(1);
});
