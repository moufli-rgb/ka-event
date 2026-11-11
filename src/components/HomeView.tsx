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
  Truck,
  PenLine,
  Users,
  Wallet,
} from 'lucide-react';
import { CategoryId, EventCategoryMatrix, EventProject, EventTypeId, GiftProduct } from '../types';
import { EVENT_TYPES, SERVICE_CATEGORIES, formatFcfa } from '../data/initialData';
import { MEDIA } from '../assets/mediaRegistry';
import { SafeImage } from './SafeImage';
import { HeroCarousel, HeroSlide } from './HeroCarousel';

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
  gifts: GiftProduct[];
  providerCount: number;
  onStartPlanning: (payload: StartPlanningPayload) => void;
  onGoGifts: () => void;
  onGoProviders: () => void;
  onOpenPro: (space: 'prestataire' | 'admin') => void;
}

const BUDGET_MIN = 100000;
const BUDGET_MAX = 15000000;

export const HomeView: React.FC<HomeViewProps> = ({
  project,
  matrix,
  gifts,
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
      eyebrow: 'Boutique Cadeaux KoraFête',
      title: 'Offrez un cadeau qui marque les esprits.',
      subtitle:
        'Coffrets artisanaux, écrin au choix, carte personnalisée et livraison le jour même. Pas besoin d’organiser un événement.',
      ctaLabel: 'Offrir un cadeau',
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

  const spotlightGifts = gifts.slice(0, 3);

  return (
    <>
      <HeroCarousel slides={slides} />

      {/* ─── Parcours client en 3 étapes ─── */}
      <section id="demarrer" className="relative z-20 -mt-14 sm:-mt-20 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl shadow-black/10 border border-stone-200 overflow-hidden">
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

          <div className="p-5 sm:p-8">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {EVENT_TYPES.map((ev) => {
                    const sel = ev.id === eventId;
                    return (
                      <button
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
                      </button>
                    );
                  })}
                </div>
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
          </div>
        </div>
      </section>

      {/* ─── Boutique Cadeaux mise en avant ─── */}
      <section className="mt-20 sm:mt-24 bg-[#06281F] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="relative">
            <div className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-2xl overflow-hidden">
              <SafeImage
                src={MEDIA.giftHamper}
                alt="Coffret cadeau KoraFête"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-4 sm:left-auto sm:-right-5 bg-amber-400 text-zinc-950 rounded-2xl px-5 py-4 shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider">Livré aujourd’hui</p>
              <p className="text-sm font-semibold">Commandez avant 14h</p>
            </div>
          </div>

          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" /> Boutique Cadeaux
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold leading-[1.08]">
              Faites plaisir, <span className="italic text-amber-300">en trois clics.</span>
            </h2>
            <p className="text-base sm:text-lg text-emerald-100/80 leading-relaxed max-w-lg">
              Un anniversaire, un mariage, une naissance ou un simple merci : choisissez un coffret, on s’occupe du reste.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Gift, label: 'Coffrets artisanaux' },
                { icon: PenLine, label: 'Carte personnalisée' },
                { icon: Truck, label: 'Livraison express' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-2 py-4">
                  <Icon className="w-5 h-5 mx-auto text-amber-300 mb-2" />
                  <p className="text-xs font-medium text-emerald-50">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
              {spotlightGifts.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={onGoGifts}
                  className="group shrink-0 w-44 rounded-xl bg-white text-zinc-900 overflow-hidden text-left"
                >
                  <div className="h-24 overflow-hidden bg-stone-100">
                    <SafeImage
                      src={g.image}
                      alt={g.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold line-clamp-1">{g.name}</p>
                    <p className="text-sm font-bold text-emerald-900 tabular-nums mt-0.5">
                      {formatFcfa(g.priceFcfa)}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onGoGifts}
              className="inline-flex items-center gap-2 px-7 py-4 text-sm font-bold bg-amber-400 text-zinc-950 rounded-full hover:bg-amber-300 transition-colors"
            >
              Découvrir la boutique ({gifts.length} coffrets)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Trois espaces ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900">Une plateforme, trois espaces</h2>
          <p className="text-sm text-stone-500 mt-2">Chacun accède à son propre espace.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            <div
              key={title}
              className="group bg-white border border-stone-200 rounded-2xl p-7 flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
          ))}
        </div>
      </section>
    </>
  );
};
