# ZETOOLS · cahier des charges de la phase 1

*Version du 19/11/2026 · établi à partir du dossier ZETOOLS et de la maquette jointe.*

## 1. Objectif de la phase 1 (mois 2 à 5)

Lancer une première version en ligne sur **une zone test (Île-de-France)** et **deux familles d’outils (électroportatif, jardinage)**. Le catalogue est rempli au départ par le fondateur. Le recrutement des professionnels prépare la phase 2.

## 2. Règles économiques (codées dans `logique.js`, modifiables)

| Règle | Valeur dans la maquette |
|---|---|
| Frais de service payés par le locataire | 8 % de la location |
| Commission propriétaire, dégressive | 15 %, puis 12 % dès 5 locations, puis 10 % dès 20 |
| Remise longue durée | -10 % dès 3 jours, -20 % dès 7 jours |
| Assurance casse et vol (option) | 7 % de la location, 3 € minimum |
| Commission sur vente (séquestre) | 8 % |
| Frais de mise en relation d’un échange | 2,90 € par partie |
| Durée maximale d’une location | 30 jours |
| Caution | empreinte bancaire, jamais débitée sauf litige ; plafonnée au prix de vente maximum de l’outil |
| **Prix de vente maximum** (part du prix neuf) | neuf 70 %, très bon état 50 %, bon état 40 %, état correct 30 %, à réparer 15 % |
| **Loyer maximum** | 4 % du prix neuf par jour, 2 € minimum |
| Prix conseillé | 80 % du maximum |
| **Offre de prix** (négociation) | 50 % du prix affiché au minimum, 3 offres par annonce, validité 48 h, une contre-proposition |
| **Déstockage enseignes** | commission 8 %, 2 unités par client et par lot, retrait sous 7 jours |
| **Services entre membres** | frais de service client 8 %, commission prestataire 12 % (0 % pour un artisan abonné), 8 h au plus par réservation, métiers réglementés réservés aux professionnels |
| **Assurance des services** (option) | client : 6 % du prix, 2 € minimum ; prestataire particulier : 4 % déduits du versement ; jamais cochée d’avance |
| Fiches techniques PDF | gratuites |
| **Rendez-vous** | 3 créneaux proposés au plus, de 8 h à 20 h hors dimanche, annulation gratuite jusqu’à 24 h avant |

Ces chiffres sont des hypothèses de travail à valider avec votre étude de marché ; ils ne constituent pas une recommandation financière.

## 3. Fonctions à livrer

1. **Comptes** : inscription par e-mail ou Apple/Google, vérification du téléphone, vérification d’identité via le prestataire de paiement, numéro SIRET pour les pros.
2. **Annonces** : photos depuis le téléphone, modes vente / location / échange, prix, caution, calendrier de disponibilité, blocage de dates.
3. **Recherche** : texte, transaction, catégorie, rayon autour d’un code postal.
4. **Réservation et paiement** : paiement du loyer, empreinte de caution, versement au propriétaire 24 h après le retour, remboursement et litige.
5. **Messagerie protégée** : masquage des coordonnées avant paiement (motifs déjà testés dans la maquette), signalement.
6. **États des lieux** : photos à la remise et au retour, horodatées.
7. **Avis** réservés aux transactions réellement payées.
8. **Espace pro** : multi-outils, factures, export comptable, abonnements Pro Solo (19 €) et Pro Business (dès 49 €).
9. **L’Atelier** : premiers articles pour le référencement.
10. **Administration** : modération des annonces, litiges, déclarations DAC7.

## 4. Choix techniques recommandés

> **Mis à jour le 19/11/2026 :** remplacé par [`CAHIER_DES_CHARGES_TECHNIQUE.md`](CAHIER_DES_CHARGES_TECHNIQUE.md). Avec les modules artisans et réparation, la stack sur mesure (Next.js, NestJS, PostgreSQL + PostGIS, Stripe Connect) est désormais recommandée. Le tableau ci-dessous est conservé pour mémoire.

| Option | Coût indicatif phase 1 | Pour | Contre |
|---|---|---|---|
| **Sharetribe** (marketplace clé en main) + Stripe Connect | 2 000 à 8 000 € + abonnement | Location avec calendrier et caution prévus, mise en ligne rapide | Personnalisation limitée, coût mensuel |
| Développement sur mesure (Next.js + Supabase + Stripe Connect) à partir de cette maquette | 15 000 à 40 000 € | Maîtrise totale, masquage et règles sur mesure | Délai et budget plus élevés |

**Recommandation :** Sharetribe pour la phase 1, afin de tester la demande vite et à moindre coût. Le sur-mesure viendra en phase 2 si le volume le justifie. La maquette sert de brief visuel et fonctionnel au prestataire.

## 5. Prérequis hors technique (bloquants avant mise en ligne)

- **Société** : immatriculation, compte bancaire professionnel.
- **Prestataire de paiement agréé pour les places de marché** (Stripe Connect ou Mangopay). ZETOOLS ne doit jamais détenir les fonds.
- **Avocat** : CGU, CGV, statut d’intermédiaire, conformité DAC7, RGPD, médiation de la consommation.
- **Assurance** : contrat casse et vol pour les locations, responsabilité civile professionnelle de la plateforme.
- **Marque** : aucune marque « ZETOOLS » n’est enregistrée en France, dans l’UE ou à l’OMPI (vérifié le 19/11/2026). Dépôt INPI à faire, en classes 35 (place de marché), 39 (location) et 42 (plateforme en ligne).
- **Domaines** : `zetools.fr` et `zetools.io` sont libres ; `zetools.com` est détenu par un tiers jusqu’au 23/07/2027.

## 6. Ce que la maquette ne fait pas

Aucun vrai paiement ni vrai compte, aucun serveur. Les données vivent dans le navigateur. Les photos sont des images libres de droits, pas celles des futurs membres.
