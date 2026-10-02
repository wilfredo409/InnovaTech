import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Universal Title Sanitizer
 * Strips all source references, publisher brandings, and RSS aggregator suffixes.
 */
export function cleanArticleTitle(title: string): string {
  if (!title) return "";

  // 1. Remove any HTML tags
  let clean = title.replace(/<\/?[^>]+(>|$)/g, "").trim();

  // 2. Remove parenthetical or bracketed source attributions:
  clean = clean.replace(/\s*[\(\[](?:fuente|vía|via|source|crédito|credit)?[:\s]*[A-Za-zÀ-ÿ0-9\s.,'’"&-]{2,40}[\)\]]\s*$/i, "");

  // 3. Known news sources / publishers commonly found in Spanish and international tech RSS feeds
  const KNOWN_PUBLISHERS = [
    "Xataka Android", "Xataka Móvil", "Xataka Movil", "Xataka Foto", "Xataka",
    "EL PAÍS", "El País", "La Voz de Galicia", "Genbeta", "Hipertextual",
    "MuyComputer", "MuyComputerPRO", "MuyLinux", "MuyPymes", "MuyInteresante",
    "Softzone", "ADSLZone", "Teknófilo", "Teknofilo",
    "El Chapuzas Informático", "El Chapuzas Informatico", "El Androide Libre",
    "El Confidencial", "El Mundo", "ABC", "Cinco Días", "Cinco Dias",
    "Europa Press", "Agencia EFE", "EFE", "TechCrunch", "The Verge", "Wired",
    "Engadget", "Ars Technica", "ZDNet", "CNET", "Canaltech",
    "Les Numériques", "Les Numeriques", "Frandroid", "Heise Online", "Heise",
    "ComputerBase", "t3n", "Ghacks", "Hackaday", "Dev.to", "Android Central",
    "20 Minutos", "20minutos", "La Vanguardia", "Applesfera", "Mundo Xiaomi",
    "Gizmodo", "Microsofters", "La Razón", "La Razon", "Público", "Publico",
    "elDiario.es", "El Economista", "Expansión", "Expansion", "Computer Hoy",
    "Hobby Consolas", "Vandal", "IGN España", "IGN", "Reuters", "BBC Mundo",
    "BBC", "CNN en Español", "CNN", "The Guardian", "Bloomberg", "Google News",
    "Noticias Google", "Microsoft News", "Yahoo Noticias"
  ];

  for (const pub of KNOWN_PUBLISHERS) {
    const escaped = pub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\s*[-–—|»•/:]+\\s*${escaped}\\s*$`, 'i');
    clean = clean.replace(regex, "");
  }

  // 4. Generic trailing publisher match (e.g. " - Somename", " | Somename")
  clean = clean.replace(/\s+[-–—|»•/]\s+[A-Za-zÀ-ÿ0-9\s.,'’"&-]{2,45}$/i, "");

  // 5. Clean any trailing punctuation or stray dashes left behind
  clean = clean.replace(/\s*[-–—|»•/:]+\s*$/, "").trim();

  return clean || title.trim();
}

export function getApiUrl(path: string): string {
  // Check if running in a native webview / Capacitor environment
  // In a regular mobile browser, standard relative paths should be used.
  const isCapacitor = 
    !!(window as any).Capacitor || 
    window.location.protocol.startsWith('capacitor') || 
    window.location.protocol.startsWith('file') ||
    // Capacitor on Android sometimes runs on http://localhost without window.Capacitor ready instantly, 
    // but a standard browser on a phone will have window.location.hostname of the web server (e.g. ais-dev-... or ais-pre-...)
    (window.location.hostname === 'localhost' && !window.location.port && !(window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0));

  if (isCapacitor) {
    // If running in Capacitor, redirect to the cloud backend.
    // Use the custom VITE_API_URL if provided, else fallback to the shared preview server URL
    const baseUrl = (import.meta as any).env?.VITE_API_URL || "https://ais-pre-sdkcayotsrwzsf7pbaxvl6-721076122598.us-east1.run.app";
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }
  return path;
}

/**
 * Official Facebook Page URL where posts are published
 */
export const FACEBOOK_PAGE_URL = "https://www.facebook.com/share/19yG89kdBd/";

/**
 * Single Super Admin Email authorized to view and access administration panels
 */
export const ADMIN_EMAIL = "smiwceron@gmail.com";

/**
 * Returns true only if the user is authenticated with the admin email
 */
export function isAdminUser(user: { email?: string | null } | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}
