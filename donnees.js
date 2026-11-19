/* ZETOOLS · données fictives de la maquette (aucune personne réelle).
   Photos : Unsplash, licence Unsplash (usage commercial gratuit, sans attribution obligatoire).
   Les images sont appelées depuis images.unsplash.com, rien n'est téléchargé. */
(function (racine) {
  'use strict';
  const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

  const PHOTOS = {
    hero: U('1504148455328-c376907d081c', 1800),
    vente: U('1572981779307-38b8cabb2407'),
    location: U('1617576683096-00fc8eecb3af'),
    echange: U('1621272156568-7306716648df'),
    atelier: U('1774963711952-713bb7a52c4e', 1400),
  };

  // Vidéos Mixkit (licence gratuite Mixkit : usage commercial autorisé, sans attribution obligatoire)
  const MX = (id, titre) => ({ id, titre,
    hd: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
    sd: `https://assets.mixkit.co/videos/${id}/${id}-360.mp4`,
    poster: `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`,
    page: `https://mixkit.co/free-stock-video/${id}/` });
  const VIDEOS = {
    accueil: MX(777, 'Perçage d’une planche à l’établi'),
    artisans: MX(44861, 'Menuisier préparant son chantier'),
    reparer: MX(41930, 'Réparation d’un moteur au garage'),
    categories: {
      electro: MX(44858, 'Assemblage d’un cadre à la visseuse sans fil'),
      main: MX(775, 'Ciseaux à bois rangés à l’atelier'),
      meca: MX(4716, 'Mécanicien réparant un moteur de voiture'),
      jardin: MX(43697, 'Rempotage au jardin, gants et outils'),
      chantier: MX(21021, 'Mortier sur un mur de briques en chantier'),
      atelier: MX(29995, 'Établi d’atelier et outillage rangé'),
      epi: MX(20910, 'Soudeur équipé de son masque de protection'),
    },
  };

  const CATEGORIES = [
    { id: 'electro', nom: 'Électroportatif', icone: '⚡' },
    { id: 'main', nom: 'Outillage à main', icone: '🔧' },
    { id: 'meca', nom: 'Mécanique auto/moto', icone: '🔩' },
    { id: 'jardin', nom: 'Jardinage & Motoculture', icone: '🌿' },
    { id: 'chantier', nom: 'Gros œuvre & Chantier', icone: '🧱' },
    { id: 'atelier', nom: 'Atelier & Rangement', icone: '🗄️' },
    { id: 'epi', nom: 'Équipements de protection', icone: '🦺' },
  ];

  const MEMBRES = {
    m1: { id: 'm1', nom: 'Karim B.', ville: 'Montreuil', note: 4.9, avis: 37, verifie: true, pro: false, locations: 23, depuis: '2026' },
    m2: { id: 'm2', nom: 'Atelier Duval', ville: 'Vincennes', note: 4.8, avis: 112, verifie: true, pro: true, locations: 64, depuis: '2026' },
    m3: { id: 'm3', nom: 'Sophie L.', ville: 'Boulogne-Billancourt', note: 4.7, avis: 15, verifie: true, pro: false, locations: 6, depuis: '2026' },
    m4: { id: 'm4', nom: 'Thomas R.', ville: 'Saint-Maur-des-Fossés', note: 5.0, avis: 8, verifie: true, pro: false, locations: 2, depuis: '2026' },
    m5: { id: 'm5', nom: 'Jardins de l’Est', ville: 'Nogent-sur-Marne', note: 4.6, avis: 54, verifie: true, pro: true, locations: 31, depuis: '2026' },
  };

  // modes : 'vente' | 'location' | 'echange' (une annonce peut en cumuler plusieurs)
  const ANNONCES = [
    { id: 'a1', titre: 'Perceuse-visseuse 18 V + 2 batteries', marque: 'DeWalt', categorie: 'electro', etat: 'Très bon état',
      modes: ['location', 'vente'], prixJour: 9, prixVente: 145, caution: 120, ville: 'Montreuil', cp: '93100', membre: 'm1',
      photo: U('1572981779307-38b8cabb2407'), description: 'Perceuse-visseuse sans fil, mandrin 13 mm, 2 batteries 2 Ah et chargeur rapide. Idéale montage de meubles, fixations murales, perçage bois et métal.',
      indispo: [] },
    { id: 'a2', titre: 'Perforateur SDS+ 800 W avec coffret de forets', marque: 'Bosch', categorie: 'electro', etat: 'Bon état',
      modes: ['location'], prixJour: 14, prixVente: null, caution: 200, ville: 'Vincennes', cp: '94300', membre: 'm2',
      photo: U('1585201731775-0597e1be4bfb'), description: 'Perforateur burineur pour béton et parpaing. Livré avec 6 forets SDS+ et burin plat. Parfait pour un week-end de travaux.',
      indispo: [{ debut: '2026-12-24', fin: '2026-12-26' }] },
    { id: 'a3', titre: 'Visseuse à chocs 18 V compacte', marque: 'Milwaukee', categorie: 'electro', etat: 'Très bon état',
      modes: ['location', 'echange'], prixJour: 8, prixVente: null, caution: 110, ville: 'Boulogne-Billancourt', cp: '92100', membre: 'm3',
      photo: U('1623161551706-318825cd18ef'), description: 'Visseuse à chocs pour vis longues et terrasses bois. Recherche en échange : ponceuse excentrique.',
      echangeContre: 'Ponceuse excentrique', indispo: [] },
    { id: 'a4', titre: 'Sécateur de précision + gants', marque: 'Felco', categorie: 'jardin', etat: 'Neuf',
      modes: ['vente', 'echange'], prixJour: null, prixVente: 38, caution: 0, ville: 'Nogent-sur-Marne', cp: '94130', membre: 'm5',
      photo: U('1523301551780-cd17359a95d0'), description: 'Sécateur à lame forgée, jamais utilisé, avec gants de jardinage taille 9.',
      echangeContre: 'Cisaille à haies manuelle', indispo: [] },
    { id: 'a5', titre: 'Brouette renforcée 100 L', marque: 'Haemmerlin', categorie: 'chantier', etat: 'Bon état',
      modes: ['location', 'vente'], prixJour: 5, prixVente: 45, caution: 40, ville: 'Saint-Maur-des-Fossés', cp: '94100', membre: 'm4',
      photo: U('1621272156506-cdbdb6a47243'), description: 'Brouette de chantier, roue gonflée neuve. Pratique pour un déménagement de terre ou un petit chantier de maçonnerie.',
      indispo: [] },
    { id: 'a6', titre: 'Lot de 4 outils de jardin à main', marque: 'Fiskars', categorie: 'jardin', etat: 'Très bon état',
      modes: ['vente'], prixJour: null, prixVente: 25, caution: 0, ville: 'Montreuil', cp: '93100', membre: 'm1',
      photo: U('1526381805515-3fec2d69e7cc'), description: 'Transplantoir, griffe, binette et serfouette. Manches bois, rangement mural inclus.',
      indispo: [] },
    { id: 'a7', titre: 'Pelles et bêches de terrassement (×3)', marque: 'Leborgne', categorie: 'chantier', etat: 'Bon état',
      modes: ['location'], prixJour: 6, prixVente: null, caution: 50, ville: 'Nogent-sur-Marne', cp: '94130', membre: 'm5',
      photo: U('1537877853655-34bdcda5e833'), description: 'Une pelle ronde, une pelle carrée et une bêche. Pour une plantation de haie ou une tranchée.',
      indispo: [] },
    { id: 'a8', titre: 'Coffret d’outils d’ébéniste anciens', marque: 'Peugeot Frères', categorie: 'main', etat: 'Bon état',
      modes: ['echange', 'vente'], prixJour: null, prixVente: 90, caution: 0, ville: 'Vincennes', cp: '94300', membre: 'm2',
      photo: U('1774963711952-713bb7a52c4e'), description: 'Rabots, ciseaux à bois et vilebrequin restaurés. Échange possible contre une scie sur table.',
      echangeContre: 'Scie sur table', indispo: [] },
    { id: 'a9', titre: 'Taille-haie / élagage : kit de taille', marque: 'Wolf-Garten', categorie: 'jardin', etat: 'Très bon état',
      modes: ['location'], prixJour: 7, prixVente: null, caution: 60, ville: 'Boulogne-Billancourt', cp: '92100', membre: 'm3',
      photo: U('1617576683096-00fc8eecb3af'), description: 'Cisaille à haies, sécateur de force et gants. La bonne trousse pour la taille d’automne.',
      indispo: [] },
    { id: 'a10', titre: 'Servante d’atelier garnie 120 pièces', marque: 'Facom', categorie: 'meca', etat: 'Bon état',
      modes: ['vente', 'location'], prixJour: 12, prixVente: 390, caution: 300, ville: 'Saint-Maur-des-Fossés', cp: '94100', membre: 'm4',
      photo: U('1540104539488-92a51bbc0410'), description: 'Servante 6 tiroirs : douilles, clés mixtes, tournevis, pinces. Pour une révision moto ou une vidange.',
      indispo: [] },
    { id: 'a11', titre: 'Visseuse 18 V : batterie HS, pour bricoleur', marque: 'Makita', categorie: 'electro', etat: 'À réparer',
      modes: ['vente', 'echange'], prixJour: null, prixVente: 25, caution: 0, ville: 'Vincennes', cp: '94300', membre: 'm2',
      photo: U('1623161551727-54c918bdcec1'), description: 'Moteur et mandrin OK, la batterie ne tient plus la charge. Idéal pour qui a déjà des batteries Makita 18 V.',
      panne: 'Batterie à remplacer', echangeContre: 'Batterie 18 V', indispo: [] },
    { id: 'a12', titre: 'Lot d’outils anciens à restaurer', marque: 'Divers', categorie: 'main', etat: 'À réparer',
      modes: ['vente'], prixJour: null, prixVente: 15, caution: 0, ville: 'Nogent-sur-Marne', cp: '94130', membre: 'm5',
      photo: U('1774365294150-5d6051b6c53a'), description: 'Râteaux et outils de jardin anciens : manches à changer, métal sain. Pour amateur de restauration.',
      panne: 'Manches cassés, rouille de surface', indispo: [] },
  ];

  // réservations déjà présentes (fictives) pour colorer les calendriers
  const RESERVATIONS = [
    { id: 'r1', outilId: 'a1', debut: '2026-11-27', fin: '2026-11-29', statut: 'confirmée', locataire: 'Vous' },
    { id: 'r2', outilId: 'a2', debut: '2026-12-05', fin: '2026-12-07', statut: 'confirmée', locataire: 'Inès M.' },
    { id: 'r3', outilId: 'a7', debut: '2026-11-21', fin: '2026-11-22', statut: 'confirmée', locataire: 'Paul D.' },
  ];

  const ARTICLES = [
    { id: 'l1', titre: 'Perceuse ou perforateur : lequel louer pour votre mur ?', duree: '4 min', photo: U('1585201731775-0597e1be4bfb', 700),
      chapo: 'Placo, brique, béton : la bonne machine selon le support, et pourquoi louer coûte moins cher qu’acheter pour trois trous par an.' },
    { id: 'l2', titre: 'Tailler sa haie en novembre : le guide express', duree: '5 min', photo: U('1617576683096-00fc8eecb3af', 700),
      chapo: 'Les gestes, le calendrier et le matériel à emprunter à un voisin plutôt qu’à stocker au garage.' },
    { id: 'l3', titre: 'Bien rendre un outil loué : la check-list', duree: '3 min', photo: U('1526381805515-3fec2d69e7cc', 700),
      chapo: 'Nettoyage, batteries, photos de restitution : comment récupérer votre caution sans discussion.' },
  ];

  const CREDITS = [
    ['Atelier, outils sur établi', 'Barn Images', '1504148455328-c376907d081c'],
    ['Perceuse-visseuse', 'Syed Hussaini', '1572981779307-38b8cabb2407'],
    ['Perforateur', 'contributeur Unsplash', '1585201731775-0597e1be4bfb'],
    ['Visseuse à chocs', 'contributeur Unsplash', '1623161551706-318825cd18ef'],
    ['Servante d’atelier', 'contributeur Unsplash', '1540104539488-92a51bbc0410'],
    ['Taille de haie', 'Crystal Jo', '1617576683096-00fc8eecb3af'],
    ['Sécateur et gants', 'Eco Warrior Princess', '1523301551780-cd17359a95d0'],
    ['Brouette au jardin', 'Annie Spratt', '1621272156568-7306716648df'],
    ['Brouette sur terre', 'Annie Spratt', '1621272156506-cdbdb6a47243'],
    ['Outils de jardin à main', 'Annie Spratt', '1526381805515-3fec2d69e7cc'],
    ['Pelles sur l’herbe', 'dylan nolte', '1537877853655-34bdcda5e833'],
    ['Outils d’ébéniste anciens', 'Fer Troulik', '1774963711952-713bb7a52c4e'],
    ['Visseuse à réparer', 'contributeur Unsplash', '1623161551727-54c918bdcec1'],
    ['Râteaux anciens', 'Giovanni L.', '1774365294150-5d6051b6c53a'],
    ['Artisan au travail', 'contributeur Unsplash', '1621905251918-48416bd8575a'],
  ];

  /* --- Artisans abonnés (fictifs) et demandes de travaux de clients --- */
  const METIERS = [
    { id: 'bricolage', nom: 'Petits travaux & bricolage', icone: '🔨' },
    { id: 'plomberie', nom: 'Plomberie', icone: '🚰' },
    { id: 'electricite', nom: 'Électricité', icone: '💡' },
    { id: 'peinture', nom: 'Peinture & revêtements', icone: '🖌️' },
    { id: 'menuiserie', nom: 'Menuiserie & montage', icone: '🪚' },
    { id: 'jardin', nom: 'Jardinage & élagage', icone: '🌳' },
    { id: 'maconnerie', nom: 'Maçonnerie & gros œuvre', icone: '🧱' },
    { id: 'reparation', nom: 'Réparation d’outillage', icone: '🪛' },
  ];

  // position = siège ou domicile de l'artisan ; rayonKm = zone d'intervention qu'il a choisie
  const ARTISANS = [
    { id: 'p1', nom: 'Atelier Duval', ville: 'Vincennes', lat: 48.8474, lon: 2.4392, rayonKm: 12, metiers: ['menuiserie', 'bricolage'],
      tarifHoraire: 45, note: 4.8, avis: 112, siret: true, decennale: true, delai: 'sous 48 h', outils: true,
      presentation: 'Menuisier agenceur, 15 ans d’expérience. Pose de cuisines, dressings, parquets et petites réparations.',
      abonnement: { formule: 'annuel', finPeriode: '2027-06-30' } },
    { id: 'p2', nom: 'Karim Services', ville: 'Montreuil', lat: 48.8638, lon: 2.4485, rayonKm: 8, metiers: ['bricolage', 'peinture', 'menuiserie'],
      tarifHoraire: 35, note: 4.9, avis: 64, siret: true, decennale: false, delai: 'dès demain', outils: true,
      presentation: 'Auto-entrepreneur multiservice : montage de meubles, fixations, peinture, petits dépannages.',
      abonnement: { formule: 'mensuel', finPeriode: '2026-12-15' } },
    { id: 'p3', nom: 'Plomberie Lemaire', ville: 'Saint-Maur-des-Fossés', lat: 48.7994, lon: 2.4997, rayonKm: 15, metiers: ['plomberie'],
      tarifHoraire: 55, note: 4.7, avis: 89, siret: true, decennale: true, delai: 'urgences 7j/7', outils: true,
      presentation: 'Fuites, chauffe-eau, remplacement de sanitaires, rénovation de salle de bains.',
      abonnement: { formule: 'mensuel', finPeriode: '2026-12-03' } },
    { id: 'p4', nom: 'Élec Nogent', ville: 'Nogent-sur-Marne', lat: 48.8370, lon: 2.4827, rayonKm: 10, metiers: ['electricite'],
      tarifHoraire: 50, note: 4.6, avis: 41, siret: true, decennale: true, delai: 'sous 3 jours', outils: true,
      presentation: 'Mise aux normes, tableaux électriques, prises et éclairages, bornes de recharge.',
      abonnement: { formule: 'annuel', finPeriode: '2027-03-31' } },
    { id: 'p5', nom: 'Jardins de l’Est', ville: 'Nogent-sur-Marne', lat: 48.8395, lon: 2.4790, rayonKm: 20, metiers: ['jardin'],
      tarifHoraire: 38, note: 4.6, avis: 54, siret: true, decennale: false, delai: 'sous 1 semaine', outils: true,
      presentation: 'Taille de haies, élagage, entretien de jardins, évacuation des déchets verts.',
      abonnement: { formule: 'mensuel', finPeriode: '2026-12-20' } },
    { id: 'p6', nom: 'Bâti Rénov 92', ville: 'Boulogne-Billancourt', lat: 48.8397, lon: 2.2399, rayonKm: 25, metiers: ['maconnerie', 'peinture'],
      tarifHoraire: 48, note: 4.5, avis: 27, siret: true, decennale: true, delai: 'sous 2 semaines', outils: true,
      presentation: 'Ouverture de murs porteurs, dalles, ravalement, rénovation complète.',
      abonnement: { formule: 'annuel', finPeriode: '2027-09-30' } },
    { id: 'p7', nom: 'Thomas Bricole', ville: 'Ivry-sur-Seine', lat: 48.8131, lon: 2.3847, rayonKm: 6, metiers: ['bricolage'],
      tarifHoraire: 30, note: 4.4, avis: 9, siret: true, decennale: false, delai: 'le week-end', outils: false,
      presentation: 'Petits travaux le week-end ; je loue les outils sur ZETOOLS si besoin.',
      abonnement: null },
    { id: 'p8', nom: 'Répar’Outils 93', ville: 'Montreuil', lat: 48.8610, lon: 2.4420, rayonKm: 15, metiers: ['reparation'],
      tarifHoraire: 40, note: 4.9, avis: 73, siret: true, decennale: false, delai: 'diagnostic sous 48 h', outils: true,
      presentation: 'Réparation d’électroportatif et de motoculture toutes marques : charbons, interrupteurs, batteries, carburateurs, affûtage.',
      abonnement: { formule: 'annuel', finPeriode: '2027-08-31' } },
    { id: 'p9', nom: 'Atelier Moteur Créteil', ville: 'Créteil', lat: 48.7904, lon: 2.4556, rayonKm: 20, metiers: ['reparation', 'jardin'],
      tarifHoraire: 42, note: 4.7, avis: 38, siret: true, decennale: false, delai: 'sous 1 semaine', outils: true,
      presentation: 'Tondeuses, débroussailleuses, tronçonneuses : révision, réparation et remise en route avant la saison.',
      abonnement: { formule: 'mensuel', finPeriode: '2026-12-28' } },
  ];

  // demandes de clients : position déjà floutée à ~1 km, adresse exacte jamais publiée
  const DEMANDES = [
    { id: 'd1', metier: 'menuiserie', taille: 'petit', titre: 'Monter une cuisine IKEA (6 caissons)', ville: 'Vincennes', cp: '94300', lat: 48.85, lon: 2.44,
      budget: '300 à 500 €', quand: 'Avant le 15 décembre', outilsClient: false, statut: 'ouverte', publiee: '2026-11-18', reponses: [] },
    { id: 'd2', metier: 'plomberie', taille: 'petit', titre: 'Fuite sous l’évier de la cuisine', ville: 'Saint-Mandé', cp: '94160', lat: 48.84, lon: 2.42,
      budget: 'Moins de 150 €', quand: 'Urgent', outilsClient: false, statut: 'ouverte', publiee: '2026-11-19', reponses: [] },
    { id: 'd3', metier: 'peinture', taille: 'moyen', titre: 'Repeindre un séjour de 25 m² (murs et plafond)', ville: 'Montreuil', cp: '93100', lat: 48.86, lon: 2.45,
      budget: '800 à 1 200 €', quand: 'Janvier 2027', outilsClient: false, statut: 'ouverte', publiee: '2026-11-17', reponses: [] },
    { id: 'd4', metier: 'maconnerie', taille: 'gros', titre: 'Ouvrir un mur porteur entre cuisine et salon', ville: 'Issy-les-Moulineaux', cp: '92130', lat: 48.82, lon: 2.27,
      budget: '5 000 à 9 000 €', quand: 'Printemps 2027', outilsClient: false, statut: 'ouverte', publiee: '2026-11-15', reponses: [] },
    { id: 'd5', metier: 'jardin', taille: 'petit', titre: 'Tailler 20 m de haie de thuyas', ville: 'Le Perreux-sur-Marne', cp: '94170', lat: 48.84, lon: 2.50,
      budget: '200 à 300 €', quand: 'Ce mois-ci', outilsClient: true, statut: 'ouverte', publiee: '2026-11-19', reponses: [] },
    { id: 'd6', metier: 'electricite', taille: 'moyen', titre: 'Remplacer le tableau électrique d’un T3', ville: 'Fontenay-sous-Bois', cp: '94120', lat: 48.85, lon: 2.48,
      budget: '1 000 à 1 800 €', quand: 'Sous un mois', outilsClient: false, statut: 'ouverte', publiee: '2026-11-16', reponses: [] },
    { id: 'd7', metier: 'bricolage', taille: 'petit', titre: 'Fixer une TV murale et 3 étagères', ville: 'Paris 20e', cp: '75020', lat: 48.86, lon: 2.40,
      budget: 'Moins de 150 €', quand: 'Ce week-end', outilsClient: true, statut: 'ouverte', publiee: '2026-11-19', reponses: [] },
    { id: 'd8', metier: 'reparation', taille: 'petit', titre: 'Perceuse Bosch qui ne démarre plus (étincelles)', ville: 'Bagnolet', cp: '93170', lat: 48.87, lon: 2.42,
      budget: 'Moins de 150 €', quand: 'Cette semaine', outilsClient: true, statut: 'ouverte', publiee: '2026-11-18', reponses: [],
      outil: 'Perceuse à percussion Bosch PSB 650', panne: 'Étincelles à l’arrière puis arrêt' },
    { id: 'd9', metier: 'reparation', taille: 'petit', titre: 'Tondeuse thermique qui cale à chaud', ville: 'Champigny-sur-Marne', cp: '94500', lat: 48.82, lon: 2.51,
      budget: '150 à 500 €', quand: 'Pas pressé', outilsClient: true, statut: 'ouverte', publiee: '2026-11-17', reponses: [],
      outil: 'Tondeuse Honda HRG 466', panne: 'Démarre à froid, cale après 10 minutes' },
  ];

  PHOTOS.artisans = U('1621905251918-48416bd8575a', 1400);

  const D = { PHOTOS, VIDEOS, CATEGORIES, MEMBRES, ANNONCES, RESERVATIONS, ARTICLES, CREDITS, METIERS, ARTISANS, DEMANDES };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else racine.ZT_DONNEES = D;
})(typeof window !== 'undefined' ? window : globalThis);
