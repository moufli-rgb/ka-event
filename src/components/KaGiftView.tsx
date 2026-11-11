import React, { useState } from 'react';
import { ExternalLink, Loader2, MessageCircle } from 'lucide-react';

export const KA_URL = 'https://ka-six-sepia.vercel.app';
export const KA_WHATSAPP = 'https://wa.me/2290142815562';

/**
 * Boutique cadeaux : intègre le site Kā (la calebasse cadeau, réinventée)
 * directement dans KoraFête.
 */
export const KaGiftView: React.FC = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="flex flex-col bg-[#F4F2EC] h-[calc(100dvh-8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-[calc(100dvh-4rem)]">
      {/* Bandeau Kā */}
      <div className="shrink-0 bg-[#344B31] text-[#F4F2EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-ka text-xl leading-none">Kā</span>
            <span className="hidden sm:inline text-xs text-[#F4F2EC]/75 truncate">
              La calebasse cadeau, réinventée · partenaire cadeaux de KoraFête
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={KA_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-[#F4F2EC]/30 hover:bg-white/10 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <a
              href={KA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-[#F4F2EC] text-[#344B31] hover:bg-white transition-colors"
            >
              <span className="hidden sm:inline">Ouvrir en plein écran</span>
              <span className="sm:hidden">Plein écran</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Site Kā intégré */}
      <div className="relative flex-1">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#344B31]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Chargement de la boutique Kā…</p>
          </div>
        )}
        <iframe
          src={KA_URL}
          title="Kā — boutique de calebasses cadeaux"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          allow="clipboard-write"
        />
      </div>
    </div>
  );
};
