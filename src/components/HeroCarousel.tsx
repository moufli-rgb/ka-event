import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Gift, Pause, Play } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { WordsReveal } from './Motion';

export interface HeroSlide {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Mise en avant spéciale (ex. boutique cadeaux) */
  highlight?: boolean;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  intervalMs?: number;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, intervalMs = 6500 }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const isRunning = !paused && !hovered && count > 1;

  useEffect(() => {
    if (!isRunning) return;
    const t = window.setTimeout(next, intervalMs);
    return () => window.clearTimeout(t);
  }, [isRunning, next, intervalMs, index]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  return (
    <section
      className="relative w-full h-[86svh] sm:h-[78vh] min-h-[540px] max-h-[820px] overflow-hidden bg-zinc-950 text-white select-none"
      aria-roledescription="carrousel"
      aria-label="Présentation KoraFête"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
        touchStartX.current = null;
      }}
    >
      {slides.map((s, i) => {
        const active = i === index;
        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-[1100ms] ease-out ${
              active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${i + 1} sur ${count}`}
            aria-hidden={!active}
          >
            <div
              className={`absolute inset-0 transition-transform ease-out ${
                active ? 'scale-[1.06] duration-[8000ms]' : 'scale-100 duration-0'
              }`}
            >
              <SafeImage src={s.image} alt={s.title} className="w-full h-full object-cover" />
            </div>

            {/* Voiles pour la lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
            {s.highlight && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-transparent to-emerald-950/40 mix-blend-multiply" />
            )}

            <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-36 sm:pb-16 flex items-end sm:items-center">
              <div
                className={`max-w-2xl space-y-5 transition-all duration-700 delay-200 ${
                  active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {s.highlight ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400 text-zinc-950 text-xs font-bold tracking-wide uppercase">
                    <Gift className="w-3.5 h-3.5" />
                    {s.eyebrow}
                  </span>
                ) : (
                  <p className="text-xs sm:text-sm font-medium tracking-[0.18em] uppercase text-amber-200/90">
                    {s.eyebrow}
                  </p>
                )}
                <h1 className="text-[clamp(2.1rem,5.2vw,4.4rem)] leading-[1.06] font-semibold">
                  {active ? <WordsReveal text={s.title} playKey={`${s.id}-${index}`} /> : s.title}
                </h1>
                <p className="text-[15px] sm:text-lg text-stone-200 leading-relaxed max-w-xl line-clamp-3 sm:line-clamp-none">
                  {s.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={s.onCta}
                    tabIndex={active ? 0 : -1}
                    className={`inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
                      s.highlight
                        ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                        : 'bg-white text-zinc-950 hover:bg-stone-100'
                    }`}
                  >
                    {s.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {s.secondaryLabel && s.onSecondary && (
                    <button
                      type="button"
                      onClick={s.onSecondary}
                      tabIndex={active ? 0 : -1}
                      className="hidden sm:inline-flex px-6 py-3.5 text-sm font-semibold rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                    >
                      {s.secondaryLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Flèches */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-black/30 border border-white/20 backdrop-blur-sm hover:bg-black/55 transition-colors"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-black/30 border border-white/20 backdrop-blur-sm hover:bg-black/55 transition-colors"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicateurs + pause */}
      <div className="absolute bottom-24 sm:bottom-28 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                className="group relative h-1 flex-1 rounded-full bg-white/25 overflow-hidden"
                aria-label={`Aller à la diapositive ${i + 1}`}
                aria-current={i === index}
              >
                <span
                  key={i === index ? `run-${index}-${isRunning}` : 'idle'}
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    s.highlight ? 'bg-amber-400' : 'bg-white'
                  }`}
                  style={
                    i < index
                      ? { width: '100%' }
                      : i === index
                        ? isRunning
                          ? { width: '0%', animation: `kf-progress ${intervalMs}ms linear forwards` }
                          : { width: '100%' }
                        : { width: '0%' }
                  }
                />
              </button>
            ))}
          </div>
          <span className="text-xs tabular-nums text-stone-300">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/25 hover:bg-white/10"
            aria-label={paused ? 'Relancer le défilement' : 'Mettre en pause'}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </section>
  );
};
