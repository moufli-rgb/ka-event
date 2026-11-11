import React from 'react';
import { motion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fait apparaître un bloc en glissant vers le haut quand il entre à l'écran. */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}> = ({ children, delay = 0, y = 28, className }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.7, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

/** Conteneur dont les enfants <StaggerItem> apparaissent l'un après l'autre. */
export const Stagger: React.FC<{
  children: React.ReactNode;
  className?: string;
  gap?: number;
}> = ({ children, className, gap = 0.08 }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-40px' }}
    variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
  >
    {children}
  </motion.div>
);

export const staggerItem = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div className={className} variants={staggerItem}>
    {children}
  </motion.div>
);

/** Titre qui s'affiche mot par mot (rejoué à chaque changement de `playKey`). */
export const WordsReveal: React.FC<{ text: string; playKey: string | number; className?: string }> = ({
  text,
  playKey,
  className,
}) => (
  <span key={playKey} className={className} aria-label={text}>
    {text.split(' ').map((w, i) => (
      <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]" aria-hidden>
        <motion.span
          className="inline-block"
          initial={{ y: '110%' }}
          animate={{ y: '0%' }}
          transition={{ duration: 0.75, delay: 0.15 + i * 0.07, ease: EASE }}
        >
          {w}
          {' '}
        </motion.span>
      </span>
    ))}
  </span>
);

/** Bandeau de mots qui défile en continu. */
export const Marquee: React.FC<{ items: string[]; className?: string }> = ({ items, className }) => {
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden ${className || ''}`} aria-hidden>
      <div className="flex w-max kf-marquee">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-6 pr-6 whitespace-nowrap">
            {t}
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
          </span>
        ))}
      </div>
    </div>
  );
};
