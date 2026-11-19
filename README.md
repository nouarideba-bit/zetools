# ZETOOLS · maquette de la plateforme (phase 1)

Plateforme communautaire et sécurisée pour **acheter, louer ou échanger des outils d’occasion** entre particuliers et professionnels, **trouver un artisan géolocalisé** pour ses travaux et **faire réparer** ses outils. Zone pilote : Île-de-France.

> Maquette cliquable : les paiements, les comptes et les données sont **simulés**. Rien n’est encaissé, aucune donnée ne quitte le navigateur.

## Ouvrir la maquette

- **Un seul fichier, à envoyer ou ouvrir n’importe où :** `dist/zetools-maquette.html`
- **Version de travail :** `index.html`, ouvert dans un navigateur.
- **Assembler à nouveau la version en un fichier :** `./assembler.sh`
- **Tests de la logique (72 tests) :** `node tests/tester.js`

## Ce que la maquette montre

| Écran | Contenu |
|---|---|
| Accueil | Héro avec recherche par transaction (vente / location / échange), catégorie et lieu ; les 3 modes ; 7 catégories ; annonces à la une ; réassurance ; parcours en 4 étapes ; offre pro ; L’Atelier |
| Catalogue | Filtres par transaction, catégorie, ville ou code postal, recherche plein texte |
| Fiche outil | Calendrier de disponibilité, devis détaillé (remises, assurance, frais, caution), achat avec séquestre, proposition d’échange |
| Messagerie | Masquage automatique des téléphones, e-mails, IBAN, adresses, liens et messageries externes tant qu’aucune transaction n’est payée |
| Mon espace | « Mon calendrier de location », mes annonces, mes favoris |
| Déposer une annonce | Formulaire complet, publication immédiate dans la maquette |
| Trouver un artisan (`#/travaux`) | Géolocalisation (navigateur ou code postal), carte OpenStreetMap, artisans abonnés classés par distance, demande de travaux gratuite (petits, moyens, gros) |
| Espace artisan (`#/espace-artisan`) | Abonnement 39 €/mois ou 390 €/an, 30 jours d’essai, 0 % de commission ; demandes de sa zone sur carte ; réponse contrôlée (abonnement, métier, zone, décennale pour les gros travaux) |
| Outils à réparer (`#/reparer`) | Réparateurs proches, outils vendus « à réparer », dépôt d’un outil en panne, bonus réparation |
| Pros, FAQ, mentions, crédits | Offres Gratuit / Artisan abonné / Pro Solo / Pro Business, questions fréquentes, crédits photos |

## Fichiers

- `logique.js` : règles métier (prix, commissions, disponibilités, masquage, recherche).
- `donnees.js` : annonces, membres et réservations fictives ; liens des photos.
- `app.js` : écrans et navigation.
- `style.css` : charte graphique (anthracite / acier, jaune chantier, vert forêt).
- [`CAHIER_DES_CHARGES.md`](CAHIER_DES_CHARGES.md) : règles économiques et prérequis.
- [`CAHIER_DES_CHARGES_TECHNIQUE.md`](CAHIER_DES_CHARGES_TECHNIQUE.md) : architecture, fonctions, conformité, phases.
- [`schema.sql`](schema.sql) : modèle de données PostgreSQL + PostGIS.

## Photos

Photographies [Unsplash](https://unsplash.com/license) : usage commercial gratuit, sans attribution obligatoire. Les auteurs sont tout de même crédités dans la page « Crédits photos ». Les images sont chargées depuis `images.unsplash.com` et la carte depuis OpenStreetMap (Leaflet 1.9.4) : il faut une connexion Internet. Sans Leaflet, une carte radar de secours s’affiche.
