import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Eye, EyeOff, Flag, Loader2, ShieldAlert, Store, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SERVICE_CATEGORIES } from '../../data/initialData';
import { ProviderRow, ReportRow, frError, supabase } from '../../lib/supabase';
import { AuthState } from '../../lib/useAuth';
import { AuthPanel, FullLoader, NotConfigured, ProShell } from './ProShell';
import { SafeImage } from '../SafeImage';

type Row = ProviderRow & { packages: { count: number }[] };

export const AdminSpace: React.FC<{ auth: AuthState; onBackToSite: () => void }> = ({ auth, onBackToSite }) => {
  const [tab, setTab] = useState<'prestataires' | 'signalements'>('prestataires');
  const [providers, setProviders] = useState<Row[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const [{ data: p, error: e1 }, { data: r, error: e2 }] = await Promise.all([
      supabase.from('providers').select('*, packages(count)').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
    ]);
    if (e1 || e2) setError(frError(e1 || e2));
    setProviders((p as Row[]) || []);
    setReports((r as ReportRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (auth.isAdmin) load();
  }, [auth.isAdmin, load]);

  const patch = async (id: string, values: Partial<ProviderRow>) => {
    if (!supabase) return;
    setBusy(id);
    const { error } = await supabase.from('providers').update(values).eq('id', id);
    if (error) setError(frError(error));
    setBusy(null);
    load();
  };

  const remove = async (p: Row) => {
    if (!supabase || !window.confirm(`Supprimer définitivement « ${p.business_name} » et toutes ses prestations ?`)) return;
    setBusy(p.id);
    const { error } = await supabase.from('providers').delete().eq('id', p.id);
    if (error) setError(frError(error));
    setBusy(null);
    load();
  };

  const resolve = async (id: string) => {
    if (!supabase) return;
    await supabase.from('reports').update({ status: 'Résolu' }).eq('id', id);
    load();
  };

  const shell = (children: React.ReactNode) => (
    <ProShell title="Administration" accent="Admin" userEmail={auth.user?.email} onBackToSite={onBackToSite}>
      {children}
    </ProShell>
  );

  if (!supabase) return shell(<NotConfigured />);
  if (auth.loading) return shell(<FullLoader />);
  if (!auth.user)
    return shell(<AuthPanel heading="Administration" subheading="Réservé à l’équipe KoraFête." allowSignup={false} />);
  if (!auth.isAdmin)
    return shell(
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <ShieldAlert className="w-9 h-9 text-amber-600 mx-auto" />
        <h1 className="text-xl font-semibold">Accès réservé</h1>
        <p className="text-sm text-stone-600">Ce compte n’a pas le rôle administrateur.</p>
      </div>
    );
  if (loading) return shell(<FullLoader />);

  const pending = providers.filter((p) => !p.verified).length;
  const openReports = reports.filter((r) => r.status === 'Ouvert').length;

  return shell(
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Prestataires', value: providers.length },
          { label: 'À vérifier', value: pending },
          { label: 'Signalements', value: openReports },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5">
            <p className="text-xs text-stone-500">{s.label}</p>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-stone-200 rounded-full">
        {(
          [
            { id: 'prestataires', label: 'Prestataires', icon: Store },
            { id: 'signalements', label: `Signalements${openReports ? ` (${openReports})` : ''}`, icon: Flag },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative py-2.5 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${
              tab === id ? 'text-white' : 'text-stone-600'
            }`}
          >
            {tab === id && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-zinc-900" />}
            <Icon className="relative w-4 h-4" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-4 py-3">{error}</p>}

      {tab === 'prestataires' && (
        <div className="space-y-3">
          {providers.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-sm text-stone-500">
              Aucun prestataire inscrit pour le moment.
            </div>
          )}
          {providers.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-20 h-32 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                <SafeImage src={p.cover_image} alt={p.business_name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500">
                  {SERVICE_CATEGORIES.find((c) => c.id === p.category_id)?.label} · {p.city} ·{' '}
                  {p.packages?.[0]?.count ?? 0} prestation(s)
                </p>
                <h3 className="font-semibold truncate">{p.business_name}</h3>
                <p className="text-xs text-stone-500 truncate">{p.phone} · {p.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  disabled={busy === p.id}
                  onClick={() => patch(p.id, { verified: !p.verified })}
                  className={`px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                    p.verified ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-800 text-white'
                  }`}
                >
                  {busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                  {p.verified ? 'Vérifié' : 'Vérifier'}
                </button>
                <button
                  type="button"
                  onClick={() => patch(p.id, { published: !p.published })}
                  className="px-3 py-2 rounded-full border border-stone-200 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {p.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {p.published ? 'Visible' : 'Masqué'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  className="px-3 py-2 rounded-full border border-stone-200 text-stone-500 hover:text-rose-700"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'signalements' && (
        <div className="space-y-3">
          {reports.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-sm text-stone-500">
              Aucun signalement.
            </div>
          )}
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-stone-500">{new Date(r.created_at).toLocaleDateString('fr-FR')} · {r.reporter_name}</p>
                <h3 className="font-semibold">{r.target_name}</h3>
                <p className="text-sm text-stone-600">{r.reason}</p>
              </div>
              {r.status === 'Ouvert' ? (
                <button type="button" onClick={() => resolve(r.id)} className="px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-semibold">
                  Marquer comme traité
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-800">Traité</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
