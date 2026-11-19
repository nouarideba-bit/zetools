-- ZETOOLS · modèle de données de référence (PostgreSQL 16 + PostGIS)
-- Couvre : vente, location, échange, messagerie, paiement séquestré, cautions,
-- artisans abonnés et demandes de travaux, réparation, carnet de santé des outils,
-- litiges, DAC7. Montants en centimes (integer) pour éviter les arrondis.
-- Document de travail : non exécuté à ce jour, à valider par le prestataire.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- contrainte anti-chevauchement des réservations
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;       -- e-mails insensibles à la casse

-- ---------- Énumérations ----------
CREATE TYPE type_compte       AS ENUM ('particulier', 'professionnel', 'admin');
CREATE TYPE etat_outil        AS ENUM ('neuf', 'tres_bon', 'bon', 'correct', 'pour_pieces');
CREATE TYPE energie_outil     AS ENUM ('filaire', 'batterie', 'thermique', 'manuel');
CREATE TYPE statut_annonce    AS ENUM ('brouillon', 'en_moderation', 'publiee', 'suspendue', 'vendue', 'archivee');
CREATE TYPE type_transaction  AS ENUM ('vente', 'location', 'echange');
CREATE TYPE statut_transac    AS ENUM ('demandee', 'acceptee', 'payee', 'en_cours', 'terminee', 'annulee', 'en_litige');
CREATE TYPE statut_caution    AS ENUM ('empreinte', 'liberee', 'capturee_partielle', 'capturee_totale', 'expiree');
CREATE TYPE mode_remise       AS ENUM ('main_propre', 'livraison', 'casier');
CREATE TYPE taille_travaux    AS ENUM ('petit', 'moyen', 'gros');
CREATE TYPE statut_demande    AS ENUM ('ouverte', 'attribuee', 'terminee', 'annulee');
CREATE TYPE periodicite       AS ENUM ('mensuel', 'annuel');
CREATE TYPE statut_abonnement AS ENUM ('essai', 'actif', 'impaye', 'resilie');
CREATE TYPE statut_litige     AS ENUM ('ouvert', 'en_arbitrage', 'clos_rembourse', 'clos_capture', 'clos_sans_suite');

-- ---------- Utilisateurs ----------
CREATE TABLE utilisateurs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 citext UNIQUE NOT NULL,
  telephone_chiffre     bytea,                   -- AES-256 côté application
  telephone_verifie_le  timestamptz,             -- OTP SMS obligatoire pour publier ou louer
  type                  type_compte NOT NULL DEFAULT 'particulier',
  prenom                text NOT NULL,
  nom_chiffre           bytea,
  avatar_url            text,
  position_approx       geography(Point, 4326),  -- floutée à ~1 km ; l'adresse exacte est dans adresses
  code_postal           text,
  ville                 text,
  stripe_account_id     text,                    -- compte connecté (vendeur, loueur, artisan)
  stripe_customer_id    text,                    -- client (acheteur, locataire, abonné)
  kyc_statut            text NOT NULL DEFAULT 'non_requis',  -- non_requis | en_cours | valide | refuse
  note_moyenne          numeric(2,1),
  nb_avis               integer NOT NULL DEFAULT 0,
  taux_reponse          numeric(4,3),
  delai_reponse_minutes integer,
  score_confiance       smallint CHECK (score_confiance BETWEEN 0 AND 100),
  cree_le               timestamptz NOT NULL DEFAULT now(),
  anonymise_le          timestamptz              -- droit à l'oubli : identité effacée, transactions conservées
);
CREATE INDEX ON utilisateurs USING gist (position_approx);

CREATE TABLE adresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id  uuid NOT NULL REFERENCES utilisateurs(id),
  libelle_chiffre bytea NOT NULL,                -- jamais montrée avant une transaction payée
  position        geography(Point, 4326) NOT NULL,
  par_defaut      boolean NOT NULL DEFAULT false
);

CREATE TABLE profils_pro (
  utilisateur_id     uuid PRIMARY KEY REFERENCES utilisateurs(id),
  raison_sociale     text NOT NULL,
  siret              char(14) UNIQUE NOT NULL,
  siret_verifie_le   timestamptz,                -- API Sirene
  tva_intra          text,
  assujetti_tva      boolean NOT NULL DEFAULT false,
  decennale_assureur text,
  decennale_fin      date,                       -- exigée pour répondre aux gros travaux
  rge                boolean NOT NULL DEFAULT false,
  qualirepar         boolean NOT NULL DEFAULT false  -- réparateur labellisé : bonus réparation
);

-- ---------- Catalogue ----------
CREATE TABLE categories (
  id        serial PRIMARY KEY,
  parent_id integer REFERENCES categories(id),
  slug      text UNIQUE NOT NULL,
  nom       text NOT NULL
);

CREATE TABLE marques (id serial PRIMARY KEY, nom text UNIQUE NOT NULL);

-- Un outil physique (avec son carnet de santé) peut porter plusieurs annonces successives
CREATE TABLE outils (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid NOT NULL REFERENCES utilisateurs(id),
  categorie_id    integer NOT NULL REFERENCES categories(id),
  marque_id       integer REFERENCES marques(id),
  marque_autre    text,
  modele          text,
  energie         energie_outil NOT NULL,
  tension_v       smallint CHECK (tension_v IN (12, 18, 36, 54)),
  etat            etat_outil NOT NULL,
  panne_decrite   text,
  qr_code         text UNIQUE,                   -- étiquette du carnet de santé
  CHECK (etat <> 'pour_pieces' OR panne_decrite IS NOT NULL)
);

CREATE TABLE carnet_outil (                      -- historique : locations, réparations, états des lieux
  id        bigserial PRIMARY KEY,
  outil_id  uuid NOT NULL REFERENCES outils(id),
  evenement text NOT NULL,                       -- location | reparation | etat_des_lieux | vente | echange
  detail    jsonb NOT NULL DEFAULT '{}',
  cree_le   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE annonces (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outil_id          uuid NOT NULL REFERENCES outils(id),
  titre             text NOT NULL,
  description       text NOT NULL,
  statut            statut_annonce NOT NULL DEFAULT 'en_moderation',
  vente_active      boolean NOT NULL DEFAULT false,   -- les trois modes sont cumulables
  prix_vente        integer CHECK (prix_vente > 0),
  prix_negociable   boolean NOT NULL DEFAULT false,
  location_active   boolean NOT NULL DEFAULT false,
  prix_jour         integer CHECK (prix_jour > 0),
  prix_weekend      integer,
  prix_semaine      integer,
  caution           integer CHECK (caution >= 0),
  echange_actif     boolean NOT NULL DEFAULT false,
  echange_recherche text,                        -- outils ou catégories voulus en contrepartie
  position_approx   geography(Point, 4326) NOT NULL,
  code_postal       text NOT NULL,
  ville             text NOT NULL,
  publiee_le        timestamptz,
  maj_le            timestamptz NOT NULL DEFAULT now(),
  CHECK (vente_active OR location_active OR echange_actif),
  CHECK (NOT vente_active OR prix_vente IS NOT NULL),
  CHECK (NOT location_active OR (prix_jour IS NOT NULL AND caution IS NOT NULL))
);
CREATE INDEX ON annonces USING gist (position_approx);
CREATE INDEX ON annonces (statut, publiee_le DESC);

CREATE TABLE annonce_photos (
  id         bigserial PRIMARY KEY,
  annonce_id uuid NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  url        text NOT NULL,
  ordre      smallint NOT NULL CHECK (ordre BETWEEN 1 AND 8),
  UNIQUE (annonce_id, ordre)
);

CREATE TABLE indisponibilites (                  -- saisies par le propriétaire
  id         bigserial PRIMARY KEY,
  annonce_id uuid NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
  periode    daterange NOT NULL
);

-- ---------- Transactions ----------
CREATE TABLE transactions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  type_transaction NOT NULL,
  annonce_id            uuid NOT NULL REFERENCES annonces(id),
  vendeur_id            uuid NOT NULL REFERENCES utilisateurs(id),  -- propriétaire ou vendeur
  client_id             uuid NOT NULL REFERENCES utilisateurs(id),  -- acheteur, locataire ou proposant
  statut                statut_transac NOT NULL DEFAULT 'demandee',
  remise                mode_remise NOT NULL DEFAULT 'main_propre',
  periode               daterange,                                   -- location uniquement
  montant_ht            integer NOT NULL DEFAULT 0,
  frais_service         integer NOT NULL DEFAULT 0,                  -- payés par le client
  commission            integer NOT NULL DEFAULT 0,                  -- retenue au vendeur
  assurance             integer NOT NULL DEFAULT 0,
  code_remise           char(6),                                     -- code ou QR saisi à la rencontre
  stripe_payment_intent text,
  cree_le               timestamptz NOT NULL DEFAULT now(),
  CHECK (type <> 'location' OR periode IS NOT NULL),
  CHECK (vendeur_id <> client_id)
);
-- Deux locations actives ne peuvent pas se chevaucher sur la même annonce
ALTER TABLE transactions ADD CONSTRAINT location_sans_chevauchement
  EXCLUDE USING gist (annonce_id WITH =, periode WITH &&)
  WHERE (type = 'location' AND statut <> 'annulee');

CREATE TABLE cautions (
  transaction_id        uuid PRIMARY KEY REFERENCES transactions(id),
  montant               integer NOT NULL,
  statut                statut_caution NOT NULL DEFAULT 'empreinte',
  stripe_payment_intent text NOT NULL,           -- capture_method = manual
  autorisee_le          timestamptz NOT NULL,
  expire_le             timestamptz NOT NULL,    -- environ 7 jours sur carte : renouveler pour les locations longues
  capturee              integer NOT NULL DEFAULT 0
);

CREATE TABLE etats_des_lieux (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    uuid NOT NULL REFERENCES transactions(id),
  moment            text NOT NULL CHECK (moment IN ('depart', 'retour')),
  photos            text[] NOT NULL,
  commentaire       text,
  valide_par_client boolean,
  cree_le           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, moment)
);

CREATE TABLE echanges (                          -- complète une transaction de type 'echange'
  transaction_id     uuid PRIMARY KEY REFERENCES transactions(id),
  annonce_proposee   uuid NOT NULL REFERENCES annonces(id),
  soulte             integer NOT NULL DEFAULT 0, -- positive : le proposant paie ; négative : il reçoit
  accepte_vendeur_le timestamptz,
  accepte_client_le  timestamptz,
  contrat_pdf_url    text
);

CREATE TABLE expeditions (
  transaction_id uuid PRIMARY KEY REFERENCES transactions(id),
  transporteur   text NOT NULL,                  -- mondial_relay | colissimo | chronopost
  numero_suivi   text,
  etiquette_url  text,
  statut         text NOT NULL DEFAULT 'a_expedier'
);

-- ---------- Artisans abonnés et demandes de travaux ----------
CREATE TABLE metiers (id text PRIMARY KEY, nom text NOT NULL);  -- bricolage, plomberie, reparation…

CREATE TABLE artisans (
  utilisateur_id     uuid PRIMARY KEY REFERENCES profils_pro(utilisateur_id),
  base               geography(Point, 4326) NOT NULL,
  rayon_km           smallint NOT NULL CHECK (rayon_km BETWEEN 1 AND 100),
  tarif_horaire      integer,
  presentation       text,
  delai_intervention text,
  vient_avec_outils  boolean NOT NULL DEFAULT true
);
CREATE INDEX ON artisans USING gist (base);

CREATE TABLE artisan_metiers (
  artisan_id uuid REFERENCES artisans(utilisateur_id),
  metier_id  text REFERENCES metiers(id),
  PRIMARY KEY (artisan_id, metier_id)
);

CREATE TABLE abonnements (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id             uuid NOT NULL REFERENCES artisans(utilisateur_id),
  periodicite            periodicite NOT NULL,
  prix                   integer NOT NULL,       -- 3900 (mois) ou 39000 (an)
  statut                 statut_abonnement NOT NULL DEFAULT 'essai',
  debut                  date NOT NULL,
  fin_periode            date NOT NULL,
  stripe_subscription_id text
);
CREATE UNIQUE INDEX abonnement_en_cours_unique ON abonnements (artisan_id) WHERE statut IN ('essai', 'actif');

CREATE TABLE demandes_travaux (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          uuid NOT NULL REFERENCES utilisateurs(id),
  metier_id          text NOT NULL REFERENCES metiers(id),
  taille             taille_travaux NOT NULL,
  titre              text NOT NULL,
  details            text,
  budget             text,
  quand              text,
  outils_client      boolean NOT NULL DEFAULT false,
  outil_concerne     text,                       -- réparation : modèle de l'outil
  panne              text,                       -- réparation : panne constatée
  position_approx    geography(Point, 4326) NOT NULL,
  code_postal        text NOT NULL,
  statut             statut_demande NOT NULL DEFAULT 'ouverte',
  artisan_vise       uuid REFERENCES artisans(utilisateur_id),
  exclusivite_jusqua timestamptz,                -- visible par 3 à 5 pros seulement jusqu'à cette date
  artisan_retenu     uuid REFERENCES artisans(utilisateur_id),
  cree_le            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON demandes_travaux USING gist (position_approx);
CREATE INDEX ON demandes_travaux (statut, metier_id);

CREATE TABLE demande_destinataires (             -- qui voit la demande pendant l'exclusivité
  demande_id uuid REFERENCES demandes_travaux(id) ON DELETE CASCADE,
  artisan_id uuid REFERENCES artisans(utilisateur_id),
  vue_le     timestamptz,
  PRIMARY KEY (demande_id, artisan_id)
);

CREATE TABLE reponses_devis (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id       uuid NOT NULL REFERENCES demandes_travaux(id) ON DELETE CASCADE,
  artisan_id       uuid NOT NULL REFERENCES artisans(utilisateur_id),
  message          text NOT NULL,                -- masqué comme la messagerie
  prix_estime      integer,
  bonus_reparation integer NOT NULL DEFAULT 0,   -- déduit si réparateur QualiRépar et outil éligible
  cree_le          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (demande_id, artisan_id)
);

-- ---------- Messagerie ----------
CREATE TABLE conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid REFERENCES annonces(id),
  demande_id uuid REFERENCES demandes_travaux(id),
  cree_le    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation_membres (
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  utilisateur_id  uuid REFERENCES utilisateurs(id),
  lu_jusqua       timestamptz,
  PRIMARY KEY (conversation_id, utilisateur_id)
);

CREATE TABLE messages (
  id                     bigserial PRIMARY KEY,
  conversation_id        uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  auteur_id              uuid NOT NULL REFERENCES utilisateurs(id),
  texte_original_chiffre bytea NOT NULL,         -- conservé pour la modération et les litiges
  texte_affiche          text NOT NULL,          -- coordonnées masquées tant que rien n'est payé
  masquage_applique      boolean NOT NULL DEFAULT false,
  offre_prix             integer,                -- offre de prix envoyée dans le fil
  cree_le                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON messages (conversation_id, cree_le);

-- ---------- Réputation ----------
CREATE TABLE avis (
  id             bigserial PRIMARY KEY,
  transaction_id uuid REFERENCES transactions(id),
  demande_id     uuid REFERENCES demandes_travaux(id),   -- avis sur un artisan
  auteur_id      uuid NOT NULL REFERENCES utilisateurs(id),
  cible_id       uuid NOT NULL REFERENCES utilisateurs(id),
  note           smallint NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire    text,
  cree_le        timestamptz NOT NULL DEFAULT now(),
  CHECK (transaction_id IS NOT NULL OR demande_id IS NOT NULL),
  UNIQUE (transaction_id, auteur_id),
  UNIQUE (demande_id, auteur_id)
);

-- ---------- Modération, litiges, conformité ----------
CREATE TABLE signalements (
  id         bigserial PRIMARY KEY,
  annonce_id uuid REFERENCES annonces(id),
  message_id bigint REFERENCES messages(id),
  auteur_id  uuid REFERENCES utilisateurs(id),     -- null si détection automatique
  motif      text NOT NULL,
  traite_le  timestamptz,
  decision   text
);

CREATE TABLE litiges (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    uuid NOT NULL REFERENCES transactions(id),
  ouvert_par        uuid NOT NULL REFERENCES utilisateurs(id),
  motif             text NOT NULL,
  statut            statut_litige NOT NULL DEFAULT 'ouvert',
  montant_capture   integer NOT NULL DEFAULT 0,
  montant_rembourse integer NOT NULL DEFAULT 0,
  arbitre_par       uuid REFERENCES utilisateurs(id),
  ouvert_le         timestamptz NOT NULL DEFAULT now(),
  clos_le           timestamptz
);

-- DAC7 : seuil de déclaration = 30 transactions OU 2 000 € de contrepartie sur l'année civile
CREATE VIEW dac7_vendeurs_a_declarer AS
SELECT t.vendeur_id,
       extract(year FROM t.cree_le)::int AS annee,
       count(*)                          AS nb_transactions,
       sum(t.montant_ht - t.commission)  AS contrepartie_centimes
FROM transactions t
WHERE t.statut = 'terminee'
GROUP BY t.vendeur_id, extract(year FROM t.cree_le)
HAVING count(*) >= 30 OR sum(t.montant_ht - t.commission) >= 200000;

CREATE TABLE journal_audit (                     -- actions sensibles : admin, paiement, anonymisation
  id        bigserial PRIMARY KEY,
  acteur_id uuid,
  action    text NOT NULL,
  cible     text NOT NULL,
  detail    jsonb,
  cree_le   timestamptz NOT NULL DEFAULT now()
);

-- ---------- Exemple : artisans abonnés qui couvrent un client ----------
-- SELECT a.utilisateur_id, ST_Distance(a.base, :client) / 1000 AS km
-- FROM artisans a
-- JOIN abonnements ab ON ab.artisan_id = a.utilisateur_id
--      AND ab.statut IN ('essai', 'actif') AND ab.fin_periode >= current_date
-- JOIN artisan_metiers am ON am.artisan_id = a.utilisateur_id AND am.metier_id = :metier
-- WHERE ST_DWithin(a.base, :client, LEAST(a.rayon_km, :rayon_client) * 1000)
-- ORDER BY km;
