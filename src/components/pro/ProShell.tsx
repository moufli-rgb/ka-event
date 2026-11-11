import React, { useState } from 'react';
import { ArrowLeft, Database, Eye, EyeOff, Loader2, LogOut, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { frError, isSupabaseConfigured, supabase } from '../../lib/supabase';
import { signOut } from '../../lib/useAuth';

/* ───────────── Cadre commun des espaces séparés (prestataire / admin) ───────────── */

export const ProShell: React.FC<{
  title: string;
  accent?: string;
  userEmail?: string | null;
  onBackToSite: () => void;
  children: React.ReactNode;
}> = ({ title, accent = 'Pro', userEmail, onBackToSite, children }) => (
  <div className="min-h-screen bg-stone-100 flex flex-col">
    <header className="sticky top-0 z-40 bg-zinc-950 text-white pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToSite}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 shrink-0"
            aria-label="Retour au site"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-lg font-bold leading-none">
              KoraFête <span className="text-emerald-400">{accent}</span>
            </p>
            <p className="text-[11px] text-stone-400 truncate">{title}</p>
          </div>
        </div>
        {userEmail && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs text-stone-400 max-w-[220px] truncate">{userEmail}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </header>
    <main className="flex-1 pb-[env(safe-area-inset-bottom)]">{children}</main>
  </div>
);

/* ───────────── Message quand Supabase n'est pas encore branché ───────────── */

export const NotConfigured: React.FC = () => (
  <div className="max-w-lg mx-auto px-4 py-16">
    <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
      <Database className="w-8 h-8 text-amber-600 mx-auto" />
      <h1 className="text-xl font-semibold">Base de données non branchée</h1>
      <p className="text-sm text-stone-600">
        Ajoutez <code className="px-1 bg-stone-100 rounded">VITE_SUPABASE_URL</code> et{' '}
        <code className="px-1 bg-stone-100 rounded">VITE_SUPABASE_ANON_KEY</code> dans le fichier{' '}
        <code className="px-1 bg-stone-100 rounded">.env.local</code> (et dans les variables
        d’environnement de Vercel), puis relancez le site.
      </p>
    </div>
  </div>
);

export const FullLoader: React.FC = () => (
  <div className="py-24 flex justify-center">
    <Loader2 className="w-7 h-7 animate-spin text-stone-400" />
  </div>
);

/* ───────────── Formulaire de connexion / inscription ───────────── */

export const AuthPanel: React.FC<{
  heading: string;
  subheading: string;
  allowSignup?: boolean;
}> = ({ heading, subheading, allowSignup = true }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!isSupabaseConfigured || !supabase) return <NotConfigured />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase!.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/?espace=pro` },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo('Compte créé ! Ouvrez l’e-mail de confirmation que nous venons d’envoyer, puis connectez-vous.');
          setMode('login');
        }
      } else {
        const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/?espace=pro`,
        });
        if (error) throw error;
        setInfo('Si un compte existe, un lien de réinitialisation vient d’être envoyé par e-mail.');
        setMode('login');
      }
    } catch (err) {
      setError(frError(err));
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white';

  return (
    <div className="min-h-[calc(100dvh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-end p-12 bg-gradient-to-br from-emerald-900 via-emerald-950 to-zinc-950 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">KoraFête Pro</p>
        <h2 className="font-display text-4xl mt-3 leading-tight">
          Présentez votre savoir-faire aux clients qui organisent leur événement.
        </h2>
        <ul className="mt-6 space-y-2 text-sm text-emerald-100/80">
          <li>• Votre profil et vos photos</li>
          <li>• Vos prestations avec des prix clairs</li>
          <li>• Les demandes de devis reçues directement</li>
        </ul>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 shadow-sm p-7 space-y-5"
        >
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {mode === 'signup' ? 'Créer mon compte' : mode === 'reset' ? 'Mot de passe oublié' : heading}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              {mode === 'signup'
                ? 'Gratuit. Vous pourrez ensuite créer votre profil.'
                : mode === 'reset'
                  ? 'Recevez un lien pour choisir un nouveau mot de passe.'
                  : subheading}
            </p>
          </div>

          {allowSignup && mode !== 'reset' && (
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-full text-xs font-semibold">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`py-2 rounded-full transition-colors ${
                    mode === m ? 'bg-white text-zinc-900 shadow-sm' : 'text-stone-500'
                  }`}
                >
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-stone-600">E-mail</span>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${input} pl-10`}
                placeholder="vous@exemple.com"
              />
            </div>
          </label>

          {mode !== 'reset' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-stone-600">Mot de passe</span>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${input} pr-11`}
                  placeholder={mode === 'signup' ? '6 caractères minimum' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
          )}

          {error && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
          {info && <p className="text-sm text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'reset' ? 'login' : 'reset');
              setError(null);
            }}
            className="w-full text-xs text-stone-500 hover:text-zinc-900"
          >
            {mode === 'reset' ? '← Retour à la connexion' : 'Mot de passe oublié ?'}
          </button>
        </motion.form>
      </div>
    </div>
  );
};
