import React, { useEffect, useRef, useState } from 'react';

interface AdSenseBannerProps {
  client?: string;
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: 'true' | 'false';
  className?: string;
  minContentLength?: number;
  content?: string;
}

/**
 * Checks whether user has explicitly consented to marketing/advertising cookies.
 * Google AdSense CMP Policy requires strict pre-consent blocking.
 */
function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('innovatech_cookie_consent');
    if (!saved) return false; // Strictly blocked until consent is given
    const parsed = JSON.parse(saved);
    return !!parsed.marketing;
  } catch {
    const legacy = localStorage.getItem('innovatech_cookie_consent_legacy');
    return legacy === 'all';
  }
}

/**
 * Responsive Google AdSense Banner Component
 * Follows Google AdSense Publisher & CMP Policies:
 * - Strictly blocks rendering and script execution until marketing consent is granted
 * - Only renders on screens with substantial, high-value publisher content
 * - Does not render on navigation, loading, empty, or modal screens
 * - Safe initialization with error boundaries
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  client = 'ca-pub-9020993400158462',
  slot = '6169079218',
  format = 'auto',
  responsive = 'true',
  className = '',
  minContentLength = 150,
  content = '',
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const [consentGranted, setConsentGranted] = useState<boolean>(() => hasMarketingConsent());

  useEffect(() => {
    const handleConsentUpdate = (e: any) => {
      if (e?.detail?.marketing !== undefined) {
        setConsentGranted(!!e.detail.marketing);
      } else {
        setConsentGranted(hasMarketingConsent());
      }
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
  }, []);

  // Pre-consent blocking: strictly do not render or execute if consent is not granted
  if (!consentGranted) {
    return null;
  }

  // If content is provided and too short, do not display ad to prevent "No content" policy violation
  if (content && content.replace(/<[^>]*>/g, '').trim().length < minContentLength) {
    return null;
  }

  useEffect(() => {
    if (!consentGranted) return;

    const timer = setTimeout(() => {
      try {
        if (!pushedRef.current && adRef.current && adRef.current.isConnected) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      } catch (e) {
        console.warn('AdSense notice:', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [consentGranted]);

  return (
    <div className={`w-full my-6 text-center overflow-hidden min-h-[90px] flex flex-col items-center justify-center ${className}`}>
      <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-2">
        Publicidad
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '250px' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

/**
 * In-Feed Google AdSense Native Ad
 * Strictly blocked until CMP consent is established
 */
export const InFeedAd: React.FC<{ client?: string; slot?: string; className?: string; articleCount?: number }> = ({
  client = 'ca-pub-9020993400158462',
  slot = '6169079218',
  className = '',
  articleCount = 5,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const [consentGranted, setConsentGranted] = useState<boolean>(() => hasMarketingConsent());

  useEffect(() => {
    const handleConsentUpdate = (e: any) => {
      if (e?.detail?.marketing !== undefined) {
        setConsentGranted(!!e.detail.marketing);
      } else {
        setConsentGranted(hasMarketingConsent());
      }
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
  }, []);

  if (!consentGranted || articleCount < 4) {
    return null;
  }

  useEffect(() => {
    if (!consentGranted) return;

    const timer = setTimeout(() => {
      try {
        if (!pushedRef.current && adRef.current && adRef.current.isConnected) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      } catch (e) {
        console.warn('AdSense in-feed notice:', e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [consentGranted]);

  return (
    <div className={`mb-6 break-inside-avoid rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 min-h-[140px] flex flex-col items-center justify-center text-center ${className}`}>
      <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-2">
        Publicidad
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
      />
    </div>
  );
};

/**
 * In-Article Google AdSense Unit
 * Strictly guarded to only show with substantial editorial content and explicit CMP consent
 */
export const InArticleAd: React.FC<{
  client?: string;
  slot?: string;
  className?: string;
  hasSufficientContent?: boolean;
}> = ({
  client = 'ca-pub-9020993400158462',
  slot = '6169079218',
  className = '',
  hasSufficientContent = true,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const [consentGranted, setConsentGranted] = useState<boolean>(() => hasMarketingConsent());

  useEffect(() => {
    const handleConsentUpdate = (e: any) => {
      if (e?.detail?.marketing !== undefined) {
        setConsentGranted(!!e.detail.marketing);
      } else {
        setConsentGranted(hasMarketingConsent());
      }
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
  }, []);

  if (!consentGranted || !hasSufficientContent) {
    return null;
  }

  useEffect(() => {
    if (!consentGranted) return;

    const timer = setTimeout(() => {
      try {
        if (!pushedRef.current && adRef.current && adRef.current.isConnected) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      } catch (e) {
        console.warn('AdSense in-article notice:', e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [consentGranted]);

  return (
    <div className={`my-8 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-center ${className}`}>
      <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-2 block">
        Publicidad
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center', minHeight: '90px' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={client}
        data-ad-slot={slot}
      />
    </div>
  );
};
