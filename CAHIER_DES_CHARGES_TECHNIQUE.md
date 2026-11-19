# ZETOOLS · cahier des charges technique

Marketplace d’outillage de seconde main : vente, location, échange, artisans géolocalisés et réparation.
Version du 19/11/2026. Base : le cahier des charges fourni par Monsieur, complété par JARVIS.
- Les ajouts sont signalés **[ZETOOLS]**.
- Les remarques sont signalées **[Vigilance]**.
- Ce document remplace la section 4 « Choix techniques » de [`CAHIER_DES_CHARGES.md`](CAHIER_DES_CHARGES.md).

Documents liés :
- [`CAHIER_DES_CHARGES.md`](CAHIER_DES_CHARGES.md) : règles économiques ;
- [`schema.sql`](schema.sql) : modèle de données ;
- `dist/zetools-maquette.html` : maquette.

---

## 1. Présentation générale

- **Objectif :** plateforme web mobile-first (PWA) de mise en relation C2C et B2C/B2B pour l’économie circulaire de l’outillage.
- **Modèles de transaction :**
  1. Vente directe (prix fixe ou offre négociable).
  2. Location courte ou moyenne durée (jour, week-end, semaine) avec caution.
  3. Échange ou troc (outil contre outil, avec soulte si déséquilibre).
- **[ZETOOLS] Deux modules supplémentaires :**
  4. **Artisans géolocalisés sur abonnement.** Le client publie gratuitement une demande de travaux (petits, moyens ou gros). Les artisans abonnés à 39 €/mois ou 390 €/an y répondent, sans commission ni coût par contact.
  5. **Outils à réparer.** Demande de réparation adressée aux réparateurs proches, vente ou troc d’outils pour pièces, bonus réparation QualiRépar.
- **Zone pilote :** Île-de-France.

## 2. Architecture et stack

| Composant | Technologie | Justification |
|---|---|---|
| Frontend | Next.js (React) + Tailwind CSS | SEO (SSR/SSG) pour les fiches outils, performance mobile |
| Backend / API | NestJS (Node) ou FastAPI (Python) | Modulaire, traitements asynchrones (paiements, notifications) |
| Base de données | PostgreSQL + PostGIS | Relationnel robuste et recherche par rayon native (`ST_DWithin`) |
| Recherche | Meilisearch (auto-hébergé) ou Algolia | Instantanée, tolérante aux fautes, multi-critères |
| Médias | Cloudflare R2 ou S3 + Cloudinary | Compression des photos, CDN |
| Paiement et séquestre | Stripe Connect ou Mangopay | Obligatoire pour encaisser pour le compte de tiers (escrow, cautions, commissions) |
| Cartographie | Mapbox ou Google Maps ; **[ZETOOLS]** Leaflet + OpenStreetMap possible au départ | Autocomplétion d’adresses, carte, distances |
| **[ZETOOLS]** Abonnements | Stripe Billing | Abonnement artisan mensuel ou annuel, essai de 30 jours |
| **[ZETOOLS]** Temps réel | WebSockets (Socket.IO) ou service managé (Ably, Pusher) | Messagerie et notifications |

**[Vigilance] Choix sur mesure ou clé en main.** Le premier cahier des charges recommandait Sharetribe pour tester vite. Les modules artisans (abonnement, demandes géolocalisées, exclusivité) et réparation dépassent ce qu’un outil clé en main sait faire proprement. **La stack sur mesure ci-dessus devient le bon choix** si ces modules sont dans le MVP. Sharetribe ne reste pertinent que pour un test de demande de 6 à 8 semaines limité à la location.

## 3. Spécifications fonctionnelles

### A. Utilisateurs et profils
- Inscription par e-mail ou mot de passe, OAuth (Google, Apple). OTP SMS obligatoire pour publier ou louer.
- KYC via le prestataire de paiement, à partir du seuil DAC7 ou dès le premier versement selon les règles du prestataire.
- Comptes particulier et professionnel : SIRET vérifié par l’API Sirene, badge « Pro », TVA.
- Réputation : note sur 5, avis vérifiés après transaction, taux et délai de réponse.
- **[ZETOOLS] Profil artisan :**
  - métiers, base d’intervention et rayon en km ;
  - tarif horaire ;
  - assurance décennale (date de fin), exigée pour répondre aux gros travaux ;
  - RGE et QualiRépar le cas échéant.
- **[ZETOOLS] Score de confiance composite (0 à 100) :** identité, ponctualité des retours, état des outils rendus, litiges ; SIRET et décennale pour les pros.

### B. Annonces
- Plusieurs modes sur un même outil (par exemple vendre à 120 € **ou** louer à 15 €/jour).
- Champs obligatoires :
  - titre, description, 1 à 8 photos compressées ;
  - catégorie et sous-catégorie ;
  - marque (liste fermée + « Autre ») et modèle ;
  - état : neuf, très bon, bon, correct, pour pièces ;
  - énergie : filaire, batterie avec tension (12, 18, 36 V), thermique, manuel ;
  - localisation floutée à environ 1 km avant transaction.
- Location : tarifs jour, week-end et semaine, caution, calendrier d’indisponibilités.
- Échange : liste des outils ou catégories recherchés.
- **[ZETOOLS] État « pour pièces » :** la description de la panne est obligatoire, et l’annonce remonte dans l’espace « Outils à réparer ».
- **[ZETOOLS] Carnet de santé de l’outil :** un QR code par outil physique. Il conserve l’historique des locations, des réparations et des états des lieux photo, d’une annonce à l’autre (table `carnet_outil`).

### C. Recherche
- Filtres :
  - transaction ;
  - rayon de 5 à 100 km ;
  - prix ;
  - marque ;
  - état ;
  - énergie ;
  - disponibilité aux dates choisies.
- Tri : pertinence, récence, prix, proximité.
- **[ZETOOLS] Recherche d’artisans :**
  - un artisan n’apparaît que si le client est **à la fois** dans le rayon choisi par le client et dans la zone d’intervention de l’artisan ;
  - résultats triés par distance ;
  - filtre par métier.

### D. Tunnels transactionnels
1. **Vente :**
   - remise en main propre, avec paiement séquestré libéré par QR code ou par code à 6 chiffres ;
   - ou livraison (Mondial Relay, Colissimo, Chronopost) avec étiquette et suivi.
2. **Location :** demande sur le calendrier → acceptation → empreinte bancaire pour la caution et débit du loyer → état des lieux photo au départ et au retour → versement au propriétaire et annulation de l’empreinte.
3. **Échange :** proposition (un outil de son catalogue + soulte éventuelle) → validation mutuelle → contrat d’échange numérique.
4. **[ZETOOLS] Demande de travaux :**
   - le client publie gratuitement ;
   - pendant une période d’exclusivité, seuls 3 à 5 artisans abonnés et vérifiés voient la demande, puis elle s’ouvre à tous les abonnés de la zone ;
   - les devis passent par la messagerie masquée, puis le client accepte un devis et les coordonnées sont dévoilées ;
   - le client laisse un avis après le chantier.
5. **[ZETOOLS] Réparation :** même circuit, avec le métier « réparation », l’outil et la panne décrits ; si le réparateur est labellisé et l’outil éligible, le bonus réparation est déduit du devis.

**[Vigilance] Durée des empreintes bancaires.** Une pré-autorisation par carte expire après environ 7 jours chez Stripe. La maquette autorise des locations jusqu’à 30 jours. Il faut donc :
- soit renouveler l’empreinte ;
- soit, au-delà de 7 jours, prélever la caution réellement puis la rembourser ;
- soit limiter la durée de location.

### E. Messagerie
- Chat temps réel lié à une annonce ou à une demande de travaux.
- Masquage automatique avant transaction payée : téléphones, e-mails, IBAN, adresses, liens, messageries externes. Le texte d’origine est conservé, chiffré, pour la modération. Ce masquage est déjà en place dans la maquette.
- Offres de prix dans le fil.

### F. Back-office
- Indicateurs clés :
  - GMV et commissions ;
  - **[ZETOOLS]** revenu récurrent des abonnements artisans et taux de résiliation ;
  - utilisateurs actifs ;
  - taux de litiges ;
  - **[ZETOOLS]** part des demandes de travaux ayant reçu au moins un devis.
- Modération des annonces : contenus interdits, doublons, outils dangereux.
- Litiges : bloquer un paiement, capturer tout ou partie d’une caution, rembourser.
- **[ZETOOLS] Vérification des pros :** SIRET, décennale et labels, avec alerte avant expiration.

## 4. Exigences non fonctionnelles

- **RGPD :**
  - données sensibles chiffrées en AES-256 ;
  - droit à l’oubli par anonymisation, les transactions étant conservées pour la comptabilité ;
  - consentement aux cookies ;
  - registre des traitements.
- **DAC7 :** les vendeurs qui atteignent 30 transactions **ou** 2 000 € de contrepartie dans l’année sont déclarés à l’administration fiscale (vue `dac7_vendeurs_a_declarer`).
- **Sécurité :**
  - protection contre les risques OWASP Top 10 ;
  - limitation du nombre d’appels à l’API ;
  - jetons JWT courts avec jetons de renouvellement en cookie httpOnly ;
  - journal d’audit des actions sensibles.
- **Performance :** score Lighthouse mobile supérieur à 90.
- **Disponibilité :**
  - 99,9 % ;
  - sauvegardes quotidiennes, avec restauration testée chaque mois.
- **[ZETOOLS] Juridique, bloquant avant mise en ligne :**
  - CGU et CGV distinctes pour particuliers et pros ;
  - statut d’intermédiaire ;
  - médiateur de la consommation ;
  - obligations d’information des plateformes en ligne (classement des offres, avis) ;
  - assurance responsabilité civile de la plateforme.

## 5. Découpage en phases

| Phase | Durée | Contenu |
|---|---|---|
| **1 · MVP** | 10 à 12 semaines | Authentification et OTP, annonces vente + location, recherche géolocalisée, messagerie masquée, paiement séquestré et remise en main propre. **[ZETOOLS]** Demandes de travaux, abonnement artisan et carte des artisans |
| **2 · V1.1** | 4 à 6 semaines | Livraison (Mondial Relay), cautions par empreinte, états des lieux photo. **[ZETOOLS]** Espace réparation, carnet de santé et QR code |
| **3 · V1.2** | 4 semaines | Échange avec soulte, comptes pros complets, PWA installable ou application. **[ZETOOLS]** Bonus réparation, exclusivité limitée et score de confiance |

**[Vigilance] Délai du MVP.** Ajouter le module artisans au MVP de 8 à 10 semaines est réaliste à 10 à 12 semaines avec une équipe de 2 ou 3 développeurs. L’alternative est de lancer d’abord les artisans, ce qui est plus simple techniquement, sans paiement entre tiers, et apporte un revenu récurrent dès le premier mois, puis d’ouvrir la marketplace d’outils.

## 6. Ce que la maquette valide déjà

72 tests automatisés réussis :
- prix, remises et commissions ;
- disponibilités ;
- masquage des coordonnées ;
- recherche ;
- géolocalisation par code postal et distances ;
- double rayon client et artisan ;
- règles de réponse des artisans : abonnement actif, métier, zone, décennale pour les gros travaux, pas de double réponse ;
- coût de l’abonnement.

La maquette sert de brief visuel et fonctionnel au prestataire.
