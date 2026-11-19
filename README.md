# ZETOOLS · maquette de la plateforme (phase 1)

Plateforme communautaire et sécurisée pour **acheter, louer ou échanger des outils d’occasion à petit prix** entre particuliers et professionnels, **négocier le prix**, **trouver un artisan géolocalisé**, **faire réparer** ses outils, **prendre rendez-vous** et profiter du **déstockage des enseignes**. Zone pilote : Île-de-France.

> Maquette cliquable : les paiements, les comptes et les données sont **simulés**. Rien n’est encaissé, aucune donnée ne quitte le navigateur.

## Ouvrir la maquette

- **Un seul fichier, à envoyer ou ouvrir n’importe où :** `dist/zetools-maquette.html`
- **Version de travail :** `index.html`, ouvert dans un navigateur.
- **Assembler à nouveau la version en un fichier :** `./assembler.sh`
- **Tests de la logique (138 tests) :** `node tests/tester.js`

## Ce que la maquette montre

| Écran | Contenu |
|---|---|
| Accueil | Vidéo de fond, héro avec recherche par transaction (vente / location / échange), catégorie et lieu ; les 3 modes ; 7 catégories illustrées en vidéo ; annonces à la une ; réassurance ; parcours en 4 étapes ; offre pro ; L’Atelier |
| Catalogue | Filtres par transaction, catégorie, ville ou code postal, recherche plein texte |
| Fiche outil | Calendrier de disponibilité, devis détaillé (remises, assurance, frais, caution), achat avec séquestre, proposition d’échange, prix neuf de référence et remise, « Proposer mon prix » |
| Messagerie | Masquage automatique des téléphones, e-mails, IBAN, adresses, liens et messageries externes tant qu’aucune transaction n’est payée |
| Mon espace | « Mon calendrier de location », mes annonces, mes favoris |
| Déposer une annonce | Formulaire complet, prix neuf de référence, prix conseillé et plafond calculés selon l’état, refus des prix trop élevés |
| Services (`#/services`, `#/service/…`, `#/proposer-service`) | Un membre, particulier ou professionnel, propose ses services à l’heure ou au forfait : fiche sur le modèle d’un outil, réservation d’un jour et d’une heure, paiement conservé jusqu’au service rendu, offre de prix. Électricité, plomberie et maçonnerie réservées aux professionnels avec SIRET. Assurance optionnelle : « Je prends l’assurance » côté client (dommages) et côté prestataire particulier (responsabilité civile), encadré « assurée / non assurée » avant paiement, aucune case cochée d’avance |
| Fiches techniques (`#/fiches`, `#/fiche-technique/…`) | Six pas-à-pas (monter un meuble, fixer ou fabriquer une étagère, percer un mur, repeindre un meuble, entretenir sa perceuse) téléchargeables en vrai PDF, produit dans le navigateur sans dépendance |
| Offres de prix (`#/offres`) | L’acheteur ou le locataire propose son prix ; le propriétaire accepte, refuse ou contre-propose ; le prix convenu s’applique 48 h |
| Agenda (`#/agenda`, `#/rendez-vous`) | Proposer jusqu’à 3 créneaux (jour et heure) pour des travaux, un échange, une réparation ou une remise ; acceptation, contre-proposition, annulation, export `.ics` |
| Déstockage (`#/destockage`, `#/lot/…`) | Produits neufs des enseignes à prix cassés, prix barré de référence sur 30 jours, stock par magasin, paiement et retrait en magasin |
| Espace enseigne (`#/espace-enseigne`) | Espace privé des distributeurs, négoces, fabricants et loueurs : indicateurs, lots, retraits à préparer, publication d’un lot. Noms d’enseignes fictifs |
| Documents juridiques (`#/legal/…`) | Conditions générales, conditions professionnels et enseignes, mentions légales, confidentialité et cookies, sécurité et caution, règles de prix (ZETools SAS). Projets à valider par un avocat |
| Trouver un artisan (`#/travaux`) | Géolocalisation (navigateur ou code postal), carte OpenStreetMap, artisans abonnés classés par distance, demande de travaux gratuite (petits, moyens, gros) |
| Espace artisan (`#/espace-artisan`) | Abonnement 39 €/mois ou 390 €/an, 30 jours d’essai, 0 % de commission ; demandes de sa zone sur carte ; réponse contrôlée (abonnement, métier, zone, décennale pour les gros travaux) |
| Outils à réparer (`#/reparer`) | Réparateurs proches, outils vendus « à réparer », dépôt d’un outil en panne, bonus réparation |
| Pros, FAQ, mentions, crédits | Offres Gratuit / Artisan abonné / Pro Solo / Pro Business, questions fréquentes, crédits photos |

## Fichiers

- `logique.js` : règles métier (prix, commissions, disponibilités, masquage, recherche).
- `donnees.js` : annonces, membres et réservations fictives ; liens des photos.
- `pdf.js` : générateur de PDF des fiches techniques (A4, Helvetica, aucune bibliothèque externe).
- `juridique.js` : textes juridiques ; les tarifs y sont repris de `logique.js`.
- `juridique/` : les mêmes textes en Markdown pour l’avocat, produits par `node outils/exporter-juridique.js`.
- `app.js` : écrans et navigation.
- `style.css` : charte graphique (anthracite / acier, jaune chantier, vert forêt).
- [`CAHIER_DES_CHARGES.md`](CAHIER_DES_CHARGES.md) : règles économiques et prérequis.
- [`CAHIER_DES_CHARGES_TECHNIQUE.md`](CAHIER_DES_CHARGES_TECHNIQUE.md) : architecture, fonctions, conformité, phases.
- [`schema.sql`](schema.sql) : modèle de données PostgreSQL + PostGIS.

## Vidéos

Onze vidéos réelles [Mixkit](https://mixkit.co/license/#videoFree) (licence gratuite, usage commercial autorisé, sans attribution obligatoire) :
- en fond de l'accueil, de « Trouver un artisan » et de « Outils à réparer » ;
- une par catégorie de produits (tuiles de l'accueil et bandeau du catalogue filtré).

Elles sont muettes, en boucle, chargées seulement quand elles deviennent visibles, et figées si le système demande de limiter les animations. Elles sont créditées dans la page « Crédits ».

## Photos

Photographies [Unsplash](https://unsplash.com/license) : usage commercial gratuit, sans attribution obligatoire. Les auteurs sont tout de même crédités dans la page « Crédits photos ». Les images sont chargées depuis `images.unsplash.com` et la carte depuis OpenStreetMap (Leaflet 1.9.4) : il faut une connexion Internet. Sans Leaflet, une carte radar de secours s’affiche.
