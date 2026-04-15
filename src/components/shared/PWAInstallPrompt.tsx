'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, MoreVertical, Download, Smartphone } from 'lucide-react';

// "Ne plus afficher" → permanent (localStorage)
const KEY_PERM = 'nafa_pwa_never';
// Fermer avec X → session seulement (sessionStorage)
const KEY_SESSION = 'nafa_pwa_session';

type DeviceType = 'ios' | 'android' | 'other';

function detectDevice(): DeviceType {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

function shouldSkip(): boolean {
  return (
    isStandaloneMode() ||
    !!localStorage.getItem(KEY_PERM) ||
    !!sessionStorage.getItem(KEY_SESSION)
  );
}

const IOS_STEPS = [
  {
    icon: <Share size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />,
    text: (
      <>
        Appuie sur <strong>Partager</strong> (icône{' '}
        <Share size={12} strokeWidth={2} className="inline" />
        ) en bas de Safari
      </>
    ),
  },
  {
    icon: <Plus size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />,
    text: (
      <>
        Défile et appuie sur <strong>« Sur l&apos;écran d&apos;accueil »</strong>
      </>
    ),
  },
  {
    icon: <Smartphone size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />,
    text: <>Appuie sur <strong>Ajouter</strong> — c&apos;est fait !</>,
  },
];

const ANDROID_STEPS = [
  {
    icon: <MoreVertical size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />,
    text: (
      <>
        Appuie sur les <strong>3 points</strong> en haut à droite de Chrome
      </>
    ),
  },
  {
    icon: <Download size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />,
    text: (
      <>
        Sélectionne <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>
      </>
    ),
  },
  {
    icon: <Smartphone size={18} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />,
    text: <>Appuie sur <strong>Ajouter</strong> — c&apos;est fait !</>,
  },
];

export function PWAInstallPrompt() {
  // `ready` = initial client checks done — prevents any flash during hydration
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<DeviceType>('other');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // All checks require `window` — run only on client after mount
    if (shouldSkip()) {
      setReady(true); // mark ready but don't show
      return;
    }

    const detected = detectDevice();
    setDevice(detected);
    setReady(true);

    // Capture the native Android install prompt without showing immediately
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't call setVisible here — let the timer control timing
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Show after 5s — applies to all devices (iOS guide, Android guide or native)
    const timer = setTimeout(() => setVisible(true), 5000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  // X button: hide for this session only
  const dismissSession = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(KEY_SESSION, '1');
  }, []);

  // "Ne plus afficher": hide permanently
  const dismissPermanent = useCallback(() => {
    setVisible(false);
    localStorage.setItem(KEY_PERM, '1');
  }, []);

  const handleNativeInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(KEY_PERM, '1');
    }
    setDeferredPrompt(null);
    setVisible(false);
  }, [deferredPrompt]);

  // Nothing to render until client checks are done (prevents SSR/hydration flash)
  if (!ready) return null;

  const steps = device === 'ios' ? IOS_STEPS : ANDROID_STEPS;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={dismissSession}
          />

          {/* Card — slides up from bottom */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 pb-10"
            style={{ background: 'var(--nafa-white)', maxWidth: 480, margin: '0 auto' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-lg"
                  style={{ background: 'var(--nafa-orange)' }}
                >
                  N
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: 'var(--nafa-black)' }}>
                    Installer NAFA
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--nafa-gray-400)' }}>
                    Accès rapide depuis ton écran d&apos;accueil
                  </p>
                </div>
              </div>
              <button
                onClick={dismissSession}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--nafa-gray-100)' }}
                aria-label="Fermer"
              >
                <X size={15} strokeWidth={2} style={{ color: 'var(--nafa-gray-700)' }} />
              </button>
            </div>

            {/* Android: native install button */}
            {device === 'android' && deferredPrompt ? (
              <div>
                <p className="text-sm mb-4" style={{ color: 'var(--nafa-gray-700)' }}>
                  Installe l&apos;application pour recevoir les notifications et accéder rapidement à tes commandes.
                </p>
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: 'var(--nafa-orange)' }}
                >
                  <Download size={18} strokeWidth={1.75} />
                  Installer l&apos;application
                </button>
              </div>
            ) : (
              /* iOS or manual Android guide */
              <div>
                <p className="text-sm mb-4" style={{ color: 'var(--nafa-gray-700)' }}>
                  {device === 'ios'
                    ? "Sur Safari, suis ces étapes pour ajouter NAFA à ton écran d'accueil :"
                    : 'Sur Chrome, suis ces étapes pour installer NAFA :'}
                </p>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,107,44,0.08)' }}
                      >
                        {step.icon}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm" style={{ color: 'var(--nafa-gray-800)' }}>
                          <span
                            className="inline-flex w-5 h-5 rounded-full text-white text-xs font-bold items-center justify-center mr-1.5 flex-shrink-0"
                            style={{ background: 'var(--nafa-orange)', verticalAlign: 'middle' }}
                          >
                            {i + 1}
                          </span>
                          {step.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                {device === 'ios' && (
                  <div
                    className="mt-4 p-3 rounded-2xl flex items-center gap-2"
                    style={{ background: 'var(--nafa-gray-100)' }}
                  >
                    <Share size={15} strokeWidth={1.75} style={{ color: 'var(--nafa-orange)' }} />
                    <p className="text-xs" style={{ color: 'var(--nafa-gray-700)' }}>
                      L&apos;icône Partager se trouve dans la barre d&apos;outils de Safari (en bas ou en haut)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Ne plus afficher — permanent */}
            <button
              onClick={dismissPermanent}
              className="w-full mt-4 py-2 text-sm text-center"
              style={{ color: 'var(--nafa-gray-400)' }}
            >
              Ne plus afficher
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
