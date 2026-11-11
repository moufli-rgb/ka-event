import React, { useState, useMemo } from 'react';
import {
  Gift,
  ShoppingBag,
  Check,
  Package,
  Truck,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import {
  GiftCartItem,
  GiftOccasion,
  GiftOrder,
  GiftProduct,
} from '../types';
import { formatFcfa } from '../data/initialData';
import { SafeImage } from './SafeImage';

interface GiftShopViewProps {
  gifts: GiftProduct[];
  cart: GiftCartItem[];
  orders: GiftOrder[];
  onAddToCart: (item: GiftCartItem) => void;
  onUpdateCartQty: (id: string, delta: number) => void;
  onRemoveCartItem: (id: string) => void;
  onPlaceOrder: (order: Omit<GiftOrder, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => void;
}

const OCCASION_FILTERS: Array<{ id: GiftOccasion; label: string }> = [
  { id: 'toutes', label: 'Toutes les occasions' },
  { id: 'mariage', label: 'Mariages & Fiançailles' },
  { id: 'anniversaire', label: 'Anniversaires' },
  { id: 'naissance', label: 'Naissances & Baptêmes' },
  { id: 'remerciement', label: 'Remerciements & Soutenances' },
  { id: 'coffret_personnalise', label: 'Coffrets personnalisés' },
];

const WRAPPING_OPTIONS = [
  { id: 'ecrin_emeraude' as const, label: 'Écrin velours vert impérial & ruban soie', fee: 3500 },
  { id: 'kraft_artisanal' as const, label: 'Papier kraft texturé & fleurs séchées (inclus)', fee: 0 },
  { id: 'coffret_bois' as const, label: 'Coffret bois naturel réutilisable gravé', fee: 6500 },
];

export const GiftShopView: React.FC<GiftShopViewProps> = ({
  gifts,
  cart,
  orders,
  onAddToCart,
  onUpdateCartQty,
  onRemoveCartItem,
  onPlaceOrder,
}) => {
  const [occasionFilter, setOccasionFilter] = useState<GiftOccasion>('toutes');
  const [customizingGift, setCustomizingGift] = useState<GiftProduct | null>(null);
  const [wrappingStyle, setWrappingStyle] = useState<'ecrin_emeraude' | 'kraft_artisanal' | 'coffret_bois'>('kraft_artisanal');
  const [recipientName, setRecipientName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');

  // Checkout form state
  const [deliveryMode, setDeliveryMode] = useState<'livraison_express' | 'retrait_boutique'>('livraison_express');
  const [paymentMethod, setPaymentMethod] = useState<GiftOrder['paymentMethod']>('Mobile Money (Wave / Orange / MTN)');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const filteredGifts = useMemo(() => {
    if (occasionFilter === 'toutes') return gifts;
    return gifts.filter((g) => g.occasion === occasionFilter);
  }, [gifts, occasionFilter]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + (item.gift.priceFcfa + item.wrappingFeeFcfa) * item.quantity,
        0
      ),
    [cart]
  );

  const deliveryFee = deliveryMode === 'livraison_express' && cart.length > 0 ? 3000 : 0;
  const orderTotal = subtotal + deliveryFee;

  const handleConfirmAddGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customizingGift) return;
    const wrap = WRAPPING_OPTIONS.find((w) => w.id === wrappingStyle) || WRAPPING_OPTIONS[1];
    onAddToCart({
      id: `gcart-${Date.now()}`,
      gift: customizingGift,
      quantity: 1,
      wrappingStyle: wrap.id,
      wrappingFeeFcfa: wrap.fee,
      recipientName: recipientName.trim(),
      personalMessage: personalMessage.trim(),
    });
    setAddedFeedback(`« ${customizingGift.name} » a été ajouté à votre panier cadeaux.`);
    setCustomizingGift(null);
    setRecipientName('');
    setPersonalMessage('');
    setTimeout(() => setAddedFeedback(null), 4000);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !customerName.trim() || !customerPhone.trim()) return;
    onPlaceOrder({
      items: cart,
      deliveryMode,
      deliveryFeeFcfa: deliveryFee,
      paymentMethod,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress:
        deliveryMode === 'retrait_boutique'
          ? 'Retrait Showroom KoraFête (Cocody Riviera / Almadies)'
          : deliveryAddress.trim(),
      totalFcfa: orderTotal,
    });
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Storefront Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-8 border-b border-stone-200">
        <div className="lg:col-span-7 space-y-3">
          <p className="text-xs font-medium text-emerald-800">
            Boutique Officielle KoraFête · Achat direct sans organiser d’événement
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900">
            Offrir un cadeau mémorable, préparé avec soin et livré le jour même
          </h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
            Sélectionnez un coffret artisanal, choisissez son écrin d’emballage, rédigez votre carte personnalisée et suivez la livraison en temps réel.
          </p>
        </div>
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-950/5 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-emerald-800" />
          </div>
          <div className="text-xs text-stone-600 space-y-1">
            <p className="font-semibold text-zinc-900 text-sm">Qualité & Stocks garantis en direct</p>
            <p>Tous nos coffrets sont assemblés dans nos ateliers propriétaires avec contrôle qualité avant expédition.</p>
          </div>
        </div>
      </div>

      {addedFeedback && (
        <div className="px-5 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-medium flex items-center justify-between">
          <span>{addedFeedback}</span>
          <a href="#panier-cadeaux" className="text-xs font-semibold underline ml-4 whitespace-nowrap">
            Voir le panier cadeaux
          </a>
        </div>
      )}

      {/* Interactive Occasion Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {OCCASION_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setOccasionFilter(f.id)}
            className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              occasionFilter === f.id
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3-Column Gift Product Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {filteredGifts.map((gift) => (
          <article
            key={gift.id}
            className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform duration-150"
          >
            <div className="aspect-[4/3] w-full bg-stone-100 overflow-hidden">
              <SafeImage src={gift.image} alt={gift.name} />
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <p className="text-xs text-stone-500">
                  {gift.occasionLabel} · {gift.stock > 0 ? `${gift.stock} en stock` : 'Rupture temporaire'}
                </p>
                <h2 className="text-lg font-semibold text-zinc-900">{gift.name}</h2>
                <p className="text-sm text-stone-600 line-clamp-3">{gift.description}</p>

                <ul className="pt-2 space-y-1">
                  {gift.contents.slice(0, 3).map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-600">
                      <Check className="w-3.5 h-3.5 text-emerald-800 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-zinc-900 tabular-nums">
                    {formatFcfa(gift.priceFcfa)}
                  </p>
                  <p className="text-[11px] text-stone-500">{gift.deliveryDelay}</p>
                </div>

                <button
                  type="button"
                  disabled={gift.stock <= 0}
                  onClick={() => {
                    setCustomizingGift(gift);
                    setWrappingStyle('kraft_artisanal');
                  }}
                  className="px-4 py-2.5 text-xs font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                >
                  Personnaliser & Offrir
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Contiguous Gift Cart & Order Tracking Section */}
      <section id="panier-cadeaux" className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-stone-200">
        {/* Cart & Checkout */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-800" />
              Panier Boutique Cadeaux ({cart.reduce((a, b) => a + b.quantity, 0)})
            </h2>
            <span className="text-xs text-stone-500">Livraison soignée ou retrait gratuit</span>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-stone-500 py-6">
              Votre panier cadeaux est vide. Cliquez sur « Personnaliser & Offrir » sur un coffret ci-dessus pour préparer votre attention.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="divide-y divide-stone-200">
                {cart.map((item) => {
                  const wrapLabel =
                    WRAPPING_OPTIONS.find((w) => w.id === item.wrappingStyle)?.label || item.wrappingStyle;
                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-zinc-900">{item.gift.name}</h3>
                        <p className="text-xs text-stone-500">{wrapLabel}</p>
                        {item.recipientName && (
                          <p className="text-xs text-stone-600">Pour : {item.recipientName}</p>
                        )}
                        {item.personalMessage && (
                          <p className="text-xs italic text-stone-600">« {item.personalMessage} »</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center border border-stone-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, -1)}
                            className="p-1.5 text-stone-600 hover:text-zinc-900"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, 1)}
                            className="p-1.5 text-stone-600 hover:text-zinc-900"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-zinc-900 tabular-nums min-w-[95px] text-right">
                          {formatFcfa((item.gift.priceFcfa + item.wrappingFeeFcfa) * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => onRemoveCartItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600"
                          aria-label="Supprimer l'article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleCheckoutSubmit} className="pt-4 border-t border-stone-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('livraison_express')}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                      deliveryMode === 'livraison_express'
                        ? 'border-emerald-800 bg-emerald-50/60 text-zinc-900'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-emerald-800" />
                      Livraison Coursier Express (+3 000 FCFA)
                    </div>
                    <p className="mt-0.5 text-stone-500">Remise en main propre au destinataire</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('retrait_boutique')}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                      deliveryMode === 'retrait_boutique'
                        ? 'border-emerald-800 bg-emerald-50/60 text-zinc-900'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-800" />
                      Retrait Gratuit en Boutique (0 FCFA)
                    </div>
                    <p className="mt-0.5 text-stone-500">Prêt sous 1h dans notre espace cadeaux</p>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Votre nom</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Jean-Marc Konan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Téléphone (suivi SMS/WhatsApp)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+225 07 00 00 00 00"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                {deliveryMode === 'livraison_express' && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Adresse précise de livraison & contact du destinataire
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ville, quartier, repère et téléphone du destinataire..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Mode de règlement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as GiftOrder['paymentMethod'])}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
                  >
                    <option value="Mobile Money (Wave / Orange / MTN)">Mobile Money (Wave / Orange Money / MTN MoMo)</option>
                    <option value="Paiement à la livraison">Paiement en espèces ou Mobile Money à la livraison</option>
                    <option value="Carte bancaire">Carte bancaire Visa / Mastercard</option>
                  </select>
                </div>

                <div className="p-4 rounded-lg bg-[#FAF9F6] border border-stone-200 space-y-1.5 text-sm tabular-nums">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Sous-total coffrets & emballages</span>
                    <span>{formatFcfa(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Frais de livraison</span>
                    <span>{deliveryFee === 0 ? 'Gratuit' : formatFcfa(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-zinc-900 pt-1 border-t border-stone-200">
                    <span>Total à régler</span>
                    <span>{formatFcfa(orderTotal)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-5 text-sm font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] transition-colors"
                >
                  Valider ma commande cadeau ({formatFcfa(orderTotal)})
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Order Tracking */}
        <div className="lg:col-span-5 bg-[#FAF9F6] border border-stone-200 rounded-xl p-6 space-y-4 h-fit">
          <h2 className="text-lg font-semibold text-zinc-900">
            Suivi de vos commandes cadeaux
          </h2>
          {orders.length === 0 ? (
            <p className="text-xs text-stone-500 leading-relaxed">
              Vos commandes validées apparaîtront immédiatement ici avec leur numéro de suivi et le récapitulatif de livraison.
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-lg bg-white border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-zinc-900">
                      Commande #{ord.orderNumber}
                    </span>
                    <span className="font-semibold text-emerald-800">{ord.status}</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Client : {ord.customerName} · {ord.paymentMethod}
                  </p>
                  <p className="text-xs text-stone-500">{ord.deliveryAddress}</p>
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-zinc-900 tabular-nums">
                    <span>{ord.items.reduce((a, b) => a + b.quantity, 0)} coffret(s)</span>
                    <span>{formatFcfa(ord.totalFcfa)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Customization Modal */}
      {customizingGift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmAddGift}
            className="w-full max-w-lg bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-xl"
          >
            <div>
              <p className="text-xs text-stone-500">Personnalisation du coffret</p>
              <h3 className="text-xl font-semibold text-zinc-900">{customizingGift.name}</h3>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-700">Choix de l’emballage cadeau</label>
              {WRAPPING_OPTIONS.map((w) => (
                <label
                  key={w.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs ${
                    wrappingStyle === w.id
                      ? 'border-emerald-800 bg-emerald-50/50'
                      : 'border-stone-200'
                  }`}
                >
                  <span className="flex items-center gap-2 text-zinc-900">
                    <input
                      type="radio"
                      name="wrapping"
                      checked={wrappingStyle === w.id}
                      onChange={() => setWrappingStyle(w.id)}
                      className="accent-emerald-800"
                    />
                    {w.label}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {w.fee === 0 ? 'Inclus' : `+${formatFcfa(w.fee)}`}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Prénom / Nom du destinataire (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Pour Mariam & Cédric"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Votre message calligraphié sur la carte jointe
              </label>
              <textarea
                rows={3}
                placeholder="Tous nos vœux de bonheur et de prospérité..."
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomizingGift(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-zinc-900"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B]"
              >
                Ajouter au panier cadeaux
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
