import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Share, SquarePlus, X } from 'lucide-react';

/* ─────────────────────────────  Barre d'onglets (mobile)  ───────────────────────────── */

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BottomTabBar: React.FC<{
  items: TabItem[];
  active: string;
  onSelect: (id: string) => void;
}> = ({ items, active, onSelect }) => (
  <nav
    className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-[env(safe-area-inset-bottom)]"
    aria-label="Navigation principale"
  >
    <div className="grid grid-cols-5 h-16">
      {items.map(({ id, label, icon: Icon }) => {
        const on = active === id;
        const isKa = id === 'cadeaux';
        if (isKa) {
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="relative flex flex-col items-center justify-end pb-1.5"
              aria-current={on ? 'page' : undefined}
            >
              <motion.span
                whileTap={{ scale: 0.9 }}
                className={`absolute -top-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-[#344B31]/40 border-4 border-white ${
                  on ? 'bg-[#344B31] text-[#F4F2EC]' : 'bg-[#344B31] text-[#F4F2EC]'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="absolute inset-0 rounded-full kf-ping" />
              </motion.span>
              <span className={`text-[10px] font-semibold ${on ? 'text-[#344B31]' : 'text-stone-500'}`}>
                {label}
              </span>
            </button>
          );
        }
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="relative flex flex-col items-center justify-center gap-1"
            aria-current={on ? 'page' : undefined}
          >
            {on && (
              <motion.span
                layoutId="tab-dot"
                className="absolute top-0 h-0.5 w-8 rounded-full bg-[#065F46]"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <motion.span animate={{ y: on ? -1 : 0, scale: on ? 1.1 : 1 }}>
              <Icon className={`w-5 h-5 ${on ? 'text-[#065F46]' : 'text-stone-400'}`} />
            </motion.span>
            <span className={`text-[10px] ${on ? 'font-semibold text-zinc-900' : 'text-stone-500'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

/* ─────────────────────────────  Installer l'application  ───────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'korafete_install_dismissed_v1';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export const InstallAppBanner: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      /* stockage indisponible */
    }
    if (dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iPhone / iPad : pas d'événement d'installation, on affiche le guide.
    let t: number | undefined;
    if (isIos()) t = window.setTimeout(() => setShow(true), 2500);

    const onInstalled = () => setShow(false);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (t) window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    setIosHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* stockage indisponible */
    }
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const res = await deferred.userChoice;
      setDeferred(null);
      if (res.outcome === 'accepted') setShow(false);
    } else {
      setIosHelp(true);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed z-50 left-3 right-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:left-auto md:right-5 md:bottom-5 md:w-96"
        >
          <div className="rounded-2xl bg-zinc-950 text-white shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <img src="/icons/icon-192.png" alt="" className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Installer KoraFête</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Ajoutez l’application sur votre écran d’accueil, comme une vraie app.
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="p-1 text-stone-400 hover:text-white"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {iosHelp ? (
              <ol className="mt-4 space-y-2 text-xs text-stone-300">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                  Touchez <Share className="w-4 h-4 text-white" /> <strong className="text-white">Partager</strong> en bas de Safari
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                  Choisissez <SquarePlus className="w-4 h-4 text-white" />{' '}
                  <strong className="text-white">Sur l’écran d’accueil</strong>
                </li>
              </ol>
            ) : (
              <button
                type="button"
                onClick={install}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-stone-100"
              >
                <Download className="w-4 h-4" />
                Installer l’application
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
