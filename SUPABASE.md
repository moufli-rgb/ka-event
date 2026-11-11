# Brancher KoraFête sur Supabase

Les comptes prestataires, leurs profils, leurs prestations, les demandes de devis, les avis
et les signalements sont enregistrés dans Supabase (gratuit).

## 1. Créer le projet

1. Allez sur https://supabase.com, connectez-vous, puis **New project**.
2. Choisissez un nom (ex. `korafete`), un mot de passe de base de données et une région proche
   (ex. *West EU* ou *Central EU*).

## 2. Créer les tables

1. Dans le projet : **SQL Editor** → **New query**.
2. Copiez tout le contenu du fichier `supabase/schema.sql`, collez-le, puis cliquez sur **Run**.

Le script peut être relancé sans risque : il ne supprime aucune donnée.

## 3. Récupérer les clés

**Project Settings** → **API** :

- *Project URL* → `VITE_SUPABASE_URL`
- clé *anon public* → `VITE_SUPABASE_ANON_KEY`

Créez un fichier `.env.local` à la racine du projet (il n'est jamais envoyé sur GitHub) :

```
VITE_SUPABASE_URL="https://xxxxxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

Puis relancez `npm run dev`.

**Sur Vercel** : *Project* → *Settings* → *Environment Variables*, ajoutez les deux mêmes
variables, puis redéployez.

> La clé *anon* peut être publique : c'est la sécurité dans la base (fichier `schema.sql`)
> qui protège les données. N'utilisez **jamais** la clé *service_role* dans le site.

## 4. Adresse du site pour les e-mails

**Authentication** → **URL Configuration** :

- *Site URL* : l'adresse de votre site en ligne (ex. `https://korafete.vercel.app`)
- *Redirect URLs* : ajoutez aussi `http://localhost:3000/**` pour les tests sur votre PC.

Sans ça, les liens des e-mails (confirmation, mot de passe oublié) renvoient au mauvais endroit.

Par défaut, Supabase demande de confirmer l'e-mail à l'inscription. Pour tester plus vite,
vous pouvez le désactiver : **Authentication** → **Sign In / Providers** → **Email** →
décocher *Confirm email*.

## 5. Devenir administrateur

1. Sur le site, ouvrez **Espace pro** et créez votre compte avec votre e-mail.
2. Dans Supabase → **SQL Editor**, exécutez (avec votre e-mail) :

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'votre-email@exemple.com';
```

3. Sur le site, en bas de page → **Administration** (ou `/#admin`).

## Qui voit quoi

| | Visiteur / client | Prestataire connecté | Administrateur |
|---|---|---|---|
| Profils et prestations publiés | ✔ lecture | ✔ modifie **les siens** | ✔ tout |
| Badge « Vérifié » | — | ✘ | ✔ |
| Demandes de devis | ✔ envoie | ✔ lit et répond **aux siennes** | ✔ |
| Avis | ✔ publie | ✔ lecture | ✔ supprime |
| Signalements | ✔ envoie | ✘ | ✔ lit et traite |
| Photos | lecture | ✔ envoie dans **son** dossier | — |
