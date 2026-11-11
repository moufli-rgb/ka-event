import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Gift,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  MapPin,
  MessageCircle,
  Users,
  Wallet,
} from 'lucide-react';
import { CategoryId, EventCategoryMatrix, EventProject, EventTypeId } from '../types';
import { KA_WHATSAPP } from './KaGiftView';
import { EVENT_TYPES, SERVICE_CATEGORIES, formatFcfa } from '../data/initialData';
import { MEDIA } from '../assets/mediaRegistry';
import { SafeImage } from './SafeImage';
import { HeroCarousel, HeroSlide } from './HeroCarousel';
import { AnimatePresence, motion } from 'motion/react';
import { Marquee, Reveal, Stagger, StaggerItem, staggerItem } from './Motion';

export interface StartPlanningPayload {
  eventTypeId: EventTypeId;
  guestCount: number;
  targetBudgetFcfa: number;
  eventDate: string;
  selectedCategories: CategoryId[];
}

interface HomeViewProps {
  project: EventProject;
  matrix: EventCategoryMatrix;
  providerCount: number;
  onStartPlanning: (payload: StartPlanningPayload) => void;
  onGoGifts: () => void;
  onGoProviders: () => void;
  onOpenPro: (space: 'prestataire' | 'admin') => void;
}

const KA_FORMULAS = [
  {
    code: 'KA-1',
    name: 'Kā 1',
    price: 3000,
    badge: null as string | null,
    featured: false,
    perks: ['Sexe & couleur au choix', 'Contenu surprise préparé avec soin', 'Emballage élégant avec ruban'],
  },
  {
    code: 'KA-2',
    name: 'Kā 2',
    price: 5000,
    badge: 'Coup de cœur',
    featured: true,
    perks: ['Sexe & couleur au choix', 'Choix des articles selon stock', 'Emballage élégant avec ruban'],
  },
  {
    code: 'KA-3',
    name: 'Kā 3',
    price: 10000,
    badge: 'Livraison offerte',
    featured: false,
    perks: ['Sexe & couleur au choix', 'Choix des articles selon stock', 'Mot personnalisé inclus'],
  },
];

const BUDGET_MIN = 100000;
const BUDGET_MAX = 15000000;

export const HomeView: React.FC<HomeViewProps> = ({
  project,
  matrix,
  providerCount,
  onStartPlanning,
  onGoGifts,
  onGoProviders,
  onOpenPro,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [eventId, setEventId] = useState<EventTypeId>(project.eventTypeId || 'mariage');
  const [guests, setGuests] = useState(project.guestCount);
  const [budget, setBudget] = useState(project.targetBudgetFcfa);
  const [date, setDate] = useState(project.eventDate);

  const recommended = useMemo(
    () => SERVICE_CATEGORIES.filter((c) => matrix[eventId][c.id] === 'recommandee').map((c) => c.id),
    [matrix, eventId]
  );
  const [selectedCats, setSelectedCats] = useState<CategoryId[]>(recommended);

  const pickEvent = (id: EventTypeId) => {
    const cfg = EVENT_TYPES.find((e) => e.id === id);
    setEventId(id);
    if (cfg) {
      setGuests(cfg.defaultGuests);
      setBudget(cfg.suggestedBudgetFcfa);
    }
    setSelectedCats(
      SERVICE_CATEGORIES.filter((c) => matrix[id][c.id] === 'recommandee').map((c) => c.id)
    );
    setStep(2);
  };

  const toggleCat = (id: CategoryId) =>
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const eventCfg = EVENT_TYPES.find((e) => e.id === eventId)!;
  const visibleCats = SERVICE_CATEGORIES.filter((c) => matrix[eventId][c.id] !== 'masquee');
  const hiddenCats = SERVICE_CATEGORIES.filter((c) => matrix[eventId][c.id] === 'masquee');

  const slides: HeroSlide[] = [
    {
      id: 's-organiser',
      image: MEDIA.heroReception,
      eyebrow: 'Mariages · Anniversaires · Baptêmes · Soutenances',
      title: 'Votre événement, organisé simplement.',
      subtitle:
        'Choisissez votre événement, fixez votre budget et trouvez les prestataires qu’il vous faut — au juste prix, en FCFA.',
      ctaLabel: 'Organiser mon événement',
      onCta: () => document.getElementById('demarrer')?.scrollIntoView({ behavior: 'smooth' }),
      secondaryLabel: 'Voir les prestataires',
      onSecondary: onGoProviders,
    },
    {
      id: 's-cadeaux',
      image: MEDIA.giftHamper,
      eyebrow: 'Cadeaux avec Kā',
      title: 'La calebasse cadeau, réinventée.',
      subtitle:
        'Composez votre Kā, ajoutez votre mot doux, validez sur WhatsApp. Dès 3 000 FCFA, retrait gratuit à Cotonou.',
      ctaLabel: 'Faire ma Kā',
      onCta: onGoGifts,
      highlight: true,
    },
    {
      id: 's-traiteurs',
      image: MEDIA.cateringBuffet,
      eyebrow: 'Traiteurs & Buffets',
      title: 'Des saveurs qui rassemblent.',
      subtitle: 'Buffets, cocktails dînatoires et service à l’assiette — tarifs affichés par invité.',
      ctaLabel: 'Trouver un traiteur',
      onCta: onGoProviders,
    },
    {
      id: 's-salles',
      image: MEDIA.venueGarden,
      eyebrow: 'Salles & Jardins',
      title: 'Le lieu parfait pour votre grand jour.',
      subtitle: 'Pavillons, jardins et salles climatisées, comparés côte à côte avant de réserver.',
      ctaLabel: 'Explorer les lieux',
      onCta: onGoProviders,
    },
    {
      id: 's-deco',
      image: MEDIA.decorStage,
      eyebrow: 'Décoration · Photo · Vidéo',
      title: 'Une ambiance à couper le souffle.',
      subtitle: 'Scénographie florale, coin des mariés et reportage souvenir par des pros vérifiés.',
      ctaLabel: 'Voir les décorateurs',
      onCta: onGoProviders,
    },
  ];

  const steps = [
    { n: 1 as const, label: 'Événement', icon: PartyPopper },
    { n: 2 as const, label: 'Budget', icon: Wallet },
    { n: 3 as const, label: 'Prestations', icon: Sparkles },
  ];

  return (
    <>
      <HeroCarousel slides={slides} />

      {/* ─── Parcours client en 3 étapes ─── */}
      <section id="demarrer" className="relative z-20 -mt-14 sm:-mt-20 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl shadow-black/15 border border-stone-200 overflow-hidden"
        >
          {/* Stepper */}
          <div className="flex items-stretch border-b border-stone-200">
            {steps.map(({ n, label, icon: Icon }) => {
              const done = step > n;
              const current = step === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStep(n)}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-4 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
                    current
                      ? 'border-[#065F46] text-zinc-900 bg-emerald-50/40'
                      : 'border-transparent text-stone-500 hover:text-zinc-900'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                      done || current ? 'bg-[#065F46] text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : n}
                  </span>
                  <Icon className="w-4 h-4 hidden sm:block" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-8 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            >
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900">
                    Quel événement préparez-vous ?
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    On vous propose ensuite uniquement les prestations utiles.
                  </p>
                </div>
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.5 } } }}
                >
                  {EVENT_TYPES.map((ev) => {
                    const sel = ev.id === eventId;
                    return (
                      <motion.button
                        variants={staggerItem}
                        whileTap={{ scale: 0.96 }}
                        key={ev.id}
                        type="button"
                        onClick={() => pickEvent(ev.id)}
                        className={`group relative h-28 sm:h-32 rounded-xl overflow-hidden text-left ring-2 transition-all ${
                          sel ? 'ring-[#065F46]' : 'ring-transparent hover:ring-stone-300'
                        }`}
                      >
                        <SafeImage
                          src={ev.coverImage}
                          alt={ev.label}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <span className="absolute bottom-2.5 left-3 right-3 text-white text-sm font-semibold leading-tight">
                          {ev.label}
                        </span>
                        {sel && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#065F46] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-emerald-800">{eventCfg.label}</p>
                  <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900">
                    Quel est votre budget ?
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="kf-budget" className="text-sm font-medium text-stone-600">
                      Budget total
                    </label>
                    <span className="text-2xl sm:text-3xl font-bold text-zinc-900 tabular-nums">
                      {formatFcfa(budget)}
                    </span>
                  </div>
                  <input
                    id="kf-budget"
                    type="range"
                    min={BUDGET_MIN}
                    max={BUDGET_MAX}
                    step={50000}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full accent-[#065F46]"
                  />
                  <div className="flex justify-between text-xs text-stone-400 tabular-nums">
                    <span>{formatFcfa(BUDGET_MIN)}</span>
                    <span>{formatFcfa(BUDGET_MAX)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-stone-600 mb-1.5">
                      <Users className="w-4 h-4" /> Nombre d’invités
                    </span>
                    <input
                      type="number"
                      min={5}
                      value={guests}
                      onChange={(e) => setGuests(Math.max(5, Number(e.target.value) || 5))}
                      className="w-full px-4 py-3 text-sm bg-[#FAF9F6] border border-stone-200 rounded-xl tabular-nums focus:outline-none focus:border-emerald-800"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-stone-600 mb-1.5 block">Date prévue</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-[#FAF9F6] border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-800"
                    />
                  </label>
                </div>

                <p className="text-xs text-stone-500">
                  Soit environ <strong className="text-zinc-900 tabular-nums">{formatFcfa(Math.round(budget / Math.max(guests, 1)))}</strong> par invité.
                </p>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-zinc-900"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-[#065F46] text-white rounded-full hover:bg-[#064E3B]"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-emerald-800">
                    {eventCfg.label} · {formatFcfa(budget)} · {guests} invités
                  </p>
                  <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900">
                    De quelles prestations avez-vous besoin ?
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Nous avons coché les essentiels pour cet événement. Ajustez librement.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[...visibleCats, ...hiddenCats].map((cat) => {
                    const on = selectedCats.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCat(cat.id)}
                        className={`relative rounded-xl overflow-hidden text-left border-2 transition-all ${
                          on ? 'border-[#065F46]' : 'border-stone-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="h-16 bg-stone-100">
                          <SafeImage src={cat.coverImage} alt={cat.label} className="w-full h-full object-cover" />
                        </div>
                        <div className="px-2.5 py-2 text-xs font-semibold text-zinc-900 leading-tight min-h-[2.75rem] flex items-center">
                          {cat.label}
                        </div>
                        <span
                          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                            on ? 'bg-[#065F46] border-[#065F46] text-white' : 'bg-white/90 border-stone-300'
                          }`}
                        >
                          {on && <Check className="w-3 h-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-zinc-900"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    type="button"
                    disabled={selectedCats.length === 0}
                    onClick={() =>
                      onStartPlanning({
                        eventTypeId: eventId,
                        guestCount: guests,
                        targetBudgetFcfa: budget,
                        eventDate: date,
                        selectedCategories: selectedCats,
                      })
                    }
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold bg-[#065F46] text-white rounded-full hover:bg-[#064E3B] disabled:opacity-40"
                  >
                    Voir les prestataires ({selectedCats.length} prestations)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ─── Bandeau défilant ─── */}
      <Marquee
        className="mt-16 sm:mt-20 py-5 border-y border-stone-200 bg-white text-xl sm:text-3xl font-display italic text-stone-400"
        items={[
          'Mariages',
          'Anniversaires',
          'Baptêmes',
          'Soutenances',
          'Dots & cérémonies',
          'Galas',
          'Cadeaux Kā',
          'Événements pro',
        ]}
      />

      {/* ─── Kā : boutique cadeaux mise en avant ─── */}
      <section className="bg-[#344B31] text-[#F4F2EC] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <Reveal className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F2EC]/10 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <Gift className="w-3.5 h-3.5" /> Nos cadeaux avec Kā
            </span>
            <h2 className="font-ka text-4xl sm:text-6xl leading-[1.02]">
              Hier, dans la calebasse.
              <br />
              <span className="text-[#D9C79E]">Aujourd’hui, avec Kā.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#F4F2EC]/80 leading-relaxed max-w-md">
              Nos aïeux s’offraient des présents dans la calebasse. Kā garde le geste : vous composez, vous personnalisez, vous validez. Kā s’occupe du reste.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onGoGifts}
                className="inline-flex items-center gap-2 px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] bg-[#F4F2EC] text-[#344B31] rounded-full hover:bg-white transition-colors"
              >
                Faire ma Kā <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={KA_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 text-xs font-semibold rounded-full border border-[#F4F2EC]/30 hover:bg-white/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </Reveal>

          <div className="lg:col-span-7 space-y-4">
            <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4" gap={0.15}>
              {KA_FORMULAS.map((f) => (
                <StaggerItem key={f.code} className={f.featured ? 'kf-float' : ''}>
                <button
                  type="button"
                  onClick={onGoGifts}
                  className={`relative w-full h-full text-left rounded-2xl p-6 flex flex-col transition-transform hover:-translate-y-1 ${
                    f.featured
                      ? 'bg-[#F4F2EC] text-[#344B31] shadow-2xl shadow-black/30'
                      : 'bg-[#F4F2EC]/[0.06] border border-[#F4F2EC]/15'
                  }`}
                >
                  {f.badge && (
                    <span
                      className={`absolute -top-3 left-6 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        f.featured ? 'bg-[#344B31] text-[#F4F2EC]' : 'bg-[#D9C79E] text-[#344B31]'
                      }`}
                    >
                      {f.badge}
                    </span>
                  )}
                  <span className="text-[10px] tracking-[0.25em] opacity-60">{f.code}</span>
                  <span className="font-ka text-3xl mt-1">{f.name}</span>
                  <span className="text-lg font-semibold tabular-nums mt-1">{formatFcfa(f.price)}</span>
                  <ul className="mt-4 space-y-1.5 text-xs leading-snug opacity-85 flex-1">
                    {f.perks.map((p) => (
                      <li key={p} className="flex gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-px" /> {p}
                      </li>
                    ))}
                  </ul>
                </button>
                </StaggerItem>
              ))}
            </Stagger>
            <p className="flex items-center gap-2 text-xs text-[#F4F2EC]/70">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              Retrait gratuit à Orca Déco Jericho (Cotonou), du lundi au samedi de 9h à 19h30 · Validation simple via WhatsApp
            </p>
          </div>
        </div>
      </section>

      {/* ─── Trois espaces ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <Reveal className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900">Une plateforme, trois espaces</h2>
          <p className="text-sm text-stone-500 mt-2">Chacun accède à son propre espace.</p>
        </Reveal>
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-5" gap={0.12}>
          {[
            {
              icon: PartyPopper,
              title: 'Client',
              text: 'Choisissez votre événement, votre budget et les prestations dont vous avez besoin.',
              cta: 'Organiser un événement',
              onClick: () => document.getElementById('demarrer')?.scrollIntoView({ behavior: 'smooth' }),
              tone: 'bg-emerald-50 text-emerald-900',
            },
            {
              icon: Briefcase,
              title: 'Prestataire',
              text: `Créez votre profil, publiez vos prestations et tarifs, répondez aux demandes. ${providerCount} pros déjà inscrits.`,
              cta: 'Accéder à mon espace pro',
              onClick: () => onOpenPro('prestataire'),
              tone: 'bg-amber-50 text-amber-900',
            },
            {
              icon: ShieldCheck,
              title: 'Administrateur',
              text: 'Vérifiez les profils, modérez les signalements et gérez la boutique cadeaux.',
              cta: 'Console d’administration',
              onClick: () => onOpenPro('admin'),
              tone: 'bg-stone-100 text-zinc-800',
            },
          ].map(({ icon: Icon, title, text, cta, onClick, tone }) => (
            <StaggerItem key={title} className="h-full">
            <div
              className="group h-full bg-white border border-stone-200 rounded-2xl p-7 flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${tone}`}>
                <Icon className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-semibold text-zinc-900 mt-5">{title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed mt-2 flex-1">{text}</p>
              <button
                type="button"
                onClick={onClick}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 group-hover:gap-2.5 transition-all"
              >
                {cta} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </>
  );
};
