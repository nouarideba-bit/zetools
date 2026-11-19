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
      modes: ['location', 'vente'], prixNeuf: 220, prixJour: 6, prixVente: 89, caution: 90, ville: 'Montreuil', cp: '93100', membre: 'm1',
      photo: U('1572981779307-38b8cabb2407'), description: 'Perceuse-visseuse sans fil, mandrin 13 mm, 2 batteries 2 Ah et chargeur rapide. Idéale montage de meubles, fixations murales, perçage bois et métal.',
      indispo: [] },
    { id: 'a2', titre: 'Perforateur SDS+ 800 W avec coffret de forets', marque: 'Bosch', categorie: 'electro', etat: 'Bon état',
      modes: ['location'], prixNeuf: 180, prixJour: 6, prixVente: null, caution: 70, ville: 'Vincennes', cp: '94300', membre: 'm2',
      photo: U('1585201731775-0597e1be4bfb'), description: 'Perforateur burineur pour béton et parpaing. Livré avec 6 forets SDS+ et burin plat. Parfait pour un week-end de travaux.',
      indispo: [{ debut: '2026-12-24', fin: '2026-12-26' }] },
    { id: 'a3', titre: 'Visseuse à chocs 18 V compacte', marque: 'Milwaukee', categorie: 'electro', etat: 'Très bon état',
      modes: ['location', 'echange'], prixNeuf: 150, prixJour: 5, prixVente: null, caution: 60, ville: 'Boulogne-Billancourt', cp: '92100', membre: 'm3',
      photo: U('1623161551706-318825cd18ef'), description: 'Visseuse à chocs pour vis longues et terrasses bois. Recherche en échange : ponceuse excentrique.',
      echangeContre: 'Ponceuse excentrique', indispo: [] },
    { id: 'a4', titre: 'Sécateur de précision + gants', marque: 'Felco', categorie: 'jardin', etat: 'Neuf',
      modes: ['vente', 'echange'], prixNeuf: 45, prixJour: null, prixVente: 29, caution: 0, ville: 'Nogent-sur-Marne', cp: '94130', membre: 'm5',
      photo: U('1523301551780-cd17359a95d0'), description: 'Sécateur à lame forgée, jamais utilisé, avec gants de jardinage taille 9.',
      echangeContre: 'Cisaille à haies manuelle', indispo: [] },
    { id: 'a5', titre: 'Brouette renforcée 100 L', marque: 'Haemmerlin', categorie: 'chantier', etat: 'Bon état',
      modes: ['location', 'vente'], prixNeuf: 75, prixJour: 3, prixVente: 25, caution: 25, ville: 'Saint-Maur-des-Fossés', cp: '94100', membre: 'm4',
      photo: U('1621272156506-cdbdb6a47243'), description: 'Brouette de chantier, roue gonflée neuve. Pratique pour un déménagement de terre ou un petit chantier de maçonnerie.',
      indispo: [] },
    { id: 'a6', titre: 'Lot de 4 outils de jardin à main', marque: 'Fiskars', categorie: 'jardin', etat: 'Très bon état',
      modes: ['vente'], prixNeuf: 40, prixJour: null, prixVente: 15, caution: 0, ville: 'Montreuil', cp: '93100', membre: 'm1',
      photo: U('1526381805515-3fec2d69e7cc'), description: 'Transplantoir, griffe, binette et serfouette. Manches bois, rangement mural inclus.',
      indispo: [] },
    { id: 'a7', titre: 'Pelles et bêches de terrassement (×3)', marque: 'Leborgne', categorie: 'chantier', etat: 'Bon état',
      modes: ['location'], prixNeuf: 90, prixJour: 3, prixVente: null, caution: 30, ville: 'Nogent-sur-Marne', cp: '94130', membre: 'm5',
      photo: U('1537877853655-34bdcda5e833'), description: 'Une pelle ronde, une pelle carrée et une bêche. Pour une plantation de haie ou une tranchée.',
      indispo: [] },
    { id: 'a8', titre: 'Coffret d’outils d’ébéniste anciens', marque: 'Peugeot Frères', categorie: 'main', etat: 'Bon état',
      modes: ['echange', 'vente'], prixNeuf: 200, prixJour: null, prixVente: 60, caution: 0, ville: 'Vincennes', cp: '94300', membre: 'm2',
      photo: U('1774963711952-713bb7a52c4e'), description: 'Rabots, ciseaux à bois et vilebrequin restaurés. Échange possible contre une scie sur table.',
      echangeContre: 'Scie sur table', indispo: [] },
    { id: 'a9', titre: 'Taille-haie / élagage : kit de taille', marque: 'Wolf-Garten', categorie: 'jardin', etat: 'Très bon état',
      modes: ['location'], prixNeuf: 160, prixJour: 5, prixVente: null, caution: 60, ville: 'Boulogne-Billancourt', cp: '92100', membre: 'm3',
      photo: U('1617576683096-00fc8eecb3af'), description: 'Cisaille à haies, sécateur de force et gants. La bonne trousse pour la taille d’automne.',
      indispo: [] },
    { id: 'a10', titre: 'Servante d’atelier garnie 120 pièces', marque: 'Facom', categorie: 'meca', etat: 'Bon état',
      modes: ['vente', 'location'], prixNeuf: 650, prixJour: 10, prixVente: 229, caution: 200, ville: 'Saint-Maur-des-Fossés', cp: '94100', membre: 'm4',
      photo: U('1530124566582-a618bc2615dc'), description: 'Servante 6 tiroirs : douilles, clés mixtes, tournevis, pinces. Pour une révision moto ou une vidange.',
      indispo: [] },
    { id: 'a11', titre: 'Visseuse 18 V : batterie HS, pour bricoleur', marque: 'Makita', categorie: 'electro', etat: 'À réparer',
      modes: ['vente', 'echange'], prixNeuf: 120, prixJour: null, prixVente: 15, caution: 0, ville: 'Vincennes', cp: '94300', membre: 'm2',
      photo: U('1623161551727-54c918bdcec1'), description: 'Moteur et mandrin OK, la batterie ne tient plus la charge. Idéal pour qui a déjà des batteries Makita 18 V.',
      panne: 'Batterie à remplacer', echangeContre: 'Batterie 18 V', indispo: [] },
    { id: 'a12', titre: 'Lot d’outils anciens à restaurer', marque: 'Divers', categorie: 'main', etat: 'À réparer',
      modes: ['vente'], prixNeuf: 100, prixJour: null, prixVente: 10, caution: 0, ville: 'Nogent-sur-Marne', cp: '94130', membre: 'm5',
      photo: U('1774365294150-5d6051b6c53a'), description: 'Râteaux et outils de jardin anciens : manches à changer, métal sain. Pour amateur de restauration.',
      panne: 'Manches cassés, rouille de surface', indispo: [] },
    // Mécanique auto / moto, thermique et électrique
    { id: 'a13', titre: 'Cric rouleur 2 t et deux chandelles', marque: 'Mecafer', categorie: 'meca', etat: 'Très bon état',
      modes: ['location', 'vente'], prixNeuf: 180, prixJour: 6, prixVente: 85, caution: 80, ville: 'Montreuil', cp: '93100', membre: 'm1',
      photo: U('1578583444045-69c6e71c520b'), description: 'Cric bas pour citadine, SUV ou utilitaire léger, livré avec deux chandelles 3 t. Ne travaillez jamais sous une voiture tenue par le seul cric.',
      indispo: [] },
    { id: 'a14', titre: 'Clé à chocs sans fil 18 V et douilles de roue', marque: 'Milwaukee', categorie: 'meca', etat: 'Bon état',
      modes: ['location'], prixNeuf: 420, prixJour: 14, prixVente: null, caution: 150, ville: 'Boulogne-Billancourt', cp: '92100', membre: 'm3',
      photo: U('1764015805414-df7de89d405b'), description: 'Carré 1/2", 2 batteries, douilles 17-19-21 mm. Changement de pneus hiver / été en dix minutes. Resserrez ensuite à la clé dynamométrique.',
      indispo: [] },
    { id: 'a15', titre: 'Coffret de douilles 1/4" et 1/2", 94 pièces', marque: 'Facom', categorie: 'meca', etat: 'Très bon état',
      modes: ['vente', 'location'], prixNeuf: 300, prixJour: 8, prixVente: 139, caution: 100, ville: 'Boulogne-Billancourt', cp: '92100', membre: 'm3',
      photo: U('1637640125496-31852f042a60'), description: 'Douilles 6 pans, cliquets, rallonges, embouts Torx et Allen. Couvre l’essentiel d’une révision auto ou moto.',
      indispo: [] },
    { id: 'a16', titre: 'Valise de diagnostic OBD2 multimarque', marque: 'Autel', categorie: 'meca', etat: 'Très bon état',
      modes: ['location', 'vente'], prixNeuf: 450, prixJour: 15, prixVente: 199, caution: 150, ville: 'Nogent-sur-Marne', cp: '94130', membre: 'm5',
      photo: U('1727893380169-4dda123e19f7'), description: 'Lecture et effacement des codes défaut, données moteur en direct, état de la batterie. Thermique, hybride et électrique (lecture seule sur la batterie de traction).',
      indispo: [] },
    { id: 'a17', titre: 'Booster de démarrage 12 V lithium', marque: 'Noco', categorie: 'meca', etat: 'Bon état',
      modes: ['location', 'vente', 'echange'], prixNeuf: 200, prixJour: 6, prixVente: 75, caution: 60, ville: 'Saint-Maur-des-Fossés', cp: '94100', membre: 'm4',
      photo: U('1676337167752-2062c6ca7366'), description: 'Redémarre une voiture, une moto ou un utilitaire batterie à plat, sans seconde voiture. Pinces protégées contre l’inversion.',
      echangeContre: 'Chargeur de batterie', indispo: [] },
    { id: 'a18', titre: 'Câble de recharge Type 2, 7 m, 22 kW', marque: 'Green Motion', categorie: 'meca', etat: 'Très bon état',
      modes: ['vente', 'location'], prixNeuf: 250, prixJour: 5, prixVente: 119, caution: 80, ville: 'Montreuil', cp: '93100', membre: 'm1',
      photo: U('1593941707874-ef25b8b4a92b'), description: 'Pour bornes publiques et wallbox, voitures électriques et hybrides rechargeables. Triphasé 32 A, avec sac de rangement.',
      indispo: [] },
    { id: 'a19', titre: 'Chargeur portable VE sur prise domestique', marque: 'Juice Booster', categorie: 'meca', etat: 'Bon état',
      modes: ['location'], prixNeuf: 380, prixJour: 9, prixVente: null, caution: 150, ville: 'Boulogne-Billancourt', cp: '92100', membre: 'm3',
      photo: U('1704475336842-0ab3798abf0e'), description: 'Recharge une voiture électrique sur prise renforcée ou classique (8 à 16 A). Pratique en vacances ou en attendant la pose d’une borne. Faites vérifier votre installation électrique.',
      indispo: [] },
    { id: 'a20', titre: 'Multimètre et testeur de batterie 12 V', marque: 'Fluke', categorie: 'meca', etat: 'Très bon état',
      modes: ['location', 'vente'], prixNeuf: 160, prixJour: 4, prixVente: 75, caution: 50, ville: 'Nogent-sur-Marne', cp: '94130', membre: 'm5',
      photo: U('1777042510267-2c0543a0d715'), description: 'Tension, charge, alternateur, fusibles : trouvez la panne électrique d’une moto ou d’une voiture. Réseau 12 V seulement : la batterie haute tension d’un véhicule électrique exige une habilitation électrique.',
      indispo: [] },
    { id: 'a21', titre: 'Béquille d’atelier moto avant / arrière', marque: 'Oxford', categorie: 'meca', etat: 'Bon état',
      modes: ['location', 'echange'], prixNeuf: 140, prixJour: 4, prixVente: null, caution: 50, ville: 'Saint-Maur-des-Fossés', cp: '94100', membre: 'm4',
      photo: U('1636761358757-0a616eb9e17e'), description: 'Lève la moto pour graisser la chaîne, changer une roue ou passer l’hiver sans plat sur les pneus. Thermique ou électrique.',
      echangeContre: 'Démonte-pneu moto', indispo: [] },
    { id: 'a22', titre: 'Jeu de clés mixtes 8 à 24 mm', marque: 'Stahlwille', categorie: 'meca', etat: 'État correct',
      modes: ['vente', 'echange'], prixNeuf: 110, prixJour: null, prixVente: 30, caution: 0, ville: 'Montreuil', cp: '93100', membre: 'm1',
      photo: U('1581085271555-d32ebe05933a'), description: 'Douze clés plates et à œil, traces d’usage mais aucune tête abîmée.',
      echangeContre: 'Clé à bougie', indispo: [] },
    { id: 'a23', titre: 'Kit changement de roue : clé en croix et cales', marque: 'Hazet', categorie: 'meca', etat: 'Bon état',
      modes: ['location'], prixNeuf: 90, prixJour: 3, prixVente: null, caution: 30, ville: 'Vincennes', cp: '94300', membre: 'm2',
      photo: U('1645445522156-9ac06bc7a767'), description: 'Clé en croix 17-19-21-23 mm, rallonge et deux cales de roue. Le minimum pour changer une roue sans forcer.',
      indispo: [] },
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
    ['Outils de mécanique', 'heyquilia', '1530124566582-a618bc2615dc'],
    ['Cric rouleur', 'sincerelymedia', '1578583444045-69c6e71c520b'],
    ['Clé à chocs sur roue', 'lex_living', '1764015805414-df7de89d405b'],
    ['Coffret de douilles', 'kronemberger', '1637640125496-31852f042a60'],
    ['Diagnostic automobile', 'mtonuk', '1727893380169-4dda123e19f7'],
    ['Batterie et pinces', 'newpowa', '1676337167752-2062c6ca7366'],
    ['Câble de recharge', 'chuttersnap', '1593941707874-ef25b8b4a92b'],
    ['Recharge de voiture électrique', 'zaptec', '1704475336842-0ab3798abf0e'],
    ['Multimètre sur batterie de moto', 'thecurlyone', '1777042510267-2c0543a0d715'],
    ['Mécanique moto', '_ks_', '1636761358757-0a616eb9e17e'],
    ['Clés plates', 'tekton_tools', '1581085271555-d32ebe05933a'],
    ['Changement de roue', 'jimmynilssonmasth', '1645445522156-9ac06bc7a767'],
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
    { id: 'serrurerie', nom: 'Serrurerie', icone: '🔑' },
    { id: 'vitrerie', nom: 'Vitrerie & mise en sécurité', icone: '🪟' },
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
      tarifHoraire: 55, note: 4.7, avis: 89, siret: true, decennale: true, delai: 'urgences 7j/7', outils: true, urgence: { delaiMin: 25, horaires: '24 h/24, 7 j/7' },
      presentation: 'Fuites, chauffe-eau, remplacement de sanitaires, rénovation de salle de bains.',
      abonnement: { formule: 'mensuel', finPeriode: '2026-12-03' } },
    { id: 'p4', nom: 'Élec Nogent', ville: 'Nogent-sur-Marne', lat: 48.8370, lon: 2.4827, rayonKm: 10, metiers: ['electricite'],
      tarifHoraire: 50, note: 4.6, avis: 41, siret: true, decennale: true, delai: 'sous 3 jours', outils: true, urgence: { delaiMin: 35, horaires: '7 h – 23 h, 7 j/7' },
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
    // professionnels d'astreinte (urgence travaux) : SIRET, assurance et décennale vérifiées
    { id: 'p10', nom: 'Serrures Express Vincennes', ville: 'Vincennes', lat: 48.8460, lon: 2.4330, rayonKm: 15, metiers: ['serrurerie'],
      tarifHoraire: 60, note: 4.7, avis: 73, siret: true, decennale: true, delai: 'urgences 24 h/24', outils: true, urgence: { delaiMin: 20, horaires: '24 h/24, 7 j/7' },
      presentation: 'Ouverture de porte claquée ou fermée à clé, remplacement de cylindre, mise en sécurité après effraction.',
      abonnement: { formule: 'annuel', finPeriode: '2027-09-30' } },
    { id: 'p11', nom: 'Vitrerie de l’Est', ville: 'Fontenay-sous-Bois', lat: 48.8510, lon: 2.4760, rayonKm: 15, metiers: ['vitrerie', 'menuiserie'],
      tarifHoraire: 52, note: 4.5, avis: 29, siret: true, decennale: true, delai: 'urgences 7 h – 22 h', outils: true, urgence: { delaiMin: 40, horaires: '7 h – 22 h, 7 j/7' },
      presentation: 'Vitre cassée : mise en sécurité immédiate (panneau de bois), puis remplacement du vitrage simple ou double.',
      abonnement: { formule: 'mensuel', finPeriode: '2027-01-15' } },
    { id: 'p12', nom: 'Chauffage Services Montreuil', ville: 'Montreuil', lat: 48.8590, lon: 2.4380, rayonKm: 12, metiers: ['plomberie'],
      tarifHoraire: 58, note: 4.8, avis: 95, siret: true, decennale: true, delai: 'urgences 7j/7', outils: true, urgence: { delaiMin: 30, horaires: '6 h – 23 h, 7 j/7' },
      presentation: 'Plombier-chauffagiste : fuites, chaudières et chauffe-eau en panne, canalisations bouchées.',
      abonnement: { formule: 'mensuel', finPeriode: '2026-12-31' } },
  ];

  /* Urgence travaux : chaque type indique le métier appelé et les bons gestes en attendant le professionnel.
     « danger » : la plateforme n'envoie personne et oriente vers les secours. */
  const TYPES_URGENCE = [
    { id: 'fuite', nom: 'Fuite d’eau, dégât des eaux', icone: '💧', metier: 'plomberie',
      gestes: ['Coupez l’eau au robinet d’arrivée générale, souvent près du compteur.', 'Si l’eau approche des prises ou du tableau, coupez l’électricité au disjoncteur général.', 'Épongez et protégez les meubles ; photographiez les dégâts pour votre assurance.', 'Prévenez le voisin du dessous et votre syndic.'] },
    { id: 'bouchon', nom: 'WC ou canalisation bouchés', icone: '🚽', metier: 'plomberie',
      gestes: ['Arrêtez d’utiliser l’eau dans le logement.', 'N’utilisez pas de produit chimique : il abîme les canalisations et brûle les mains du dépanneur.', 'Essayez une ventouse, sans forcer.'] },
    { id: 'chauffage', nom: 'Chauffage ou eau chaude en panne', icone: '🔥', metier: 'plomberie',
      gestes: ['Vérifiez le disjoncteur de la chaudière ou du chauffe-eau.', 'Regardez la pression de la chaudière (souvent entre 1 et 2 bars) et le code d’erreur affiché.', 'Notez la marque et le modèle : le professionnel viendra avec les bonnes pièces.'] },
    { id: 'electricite', nom: 'Panne de courant, disjoncteur qui saute', icone: '⚡', metier: 'electricite',
      gestes: ['Vérifiez si la panne touche aussi vos voisins : si oui, appelez le dépannage Enedis : 09 72 67 50 suivi du numéro de votre département (09 72 67 50 94 dans le Val-de-Marne).', 'Débranchez les appareils, puis réenclenchez les disjoncteurs un par un pour trouver le circuit en cause.', 'Ne touchez jamais un fil dénudé, mouillé ou une prise qui chauffe.'] },
    { id: 'serrure', nom: 'Porte claquée, clé perdue, serrure bloquée', icone: '🔑', metier: 'serrurerie',
      gestes: ['Vérifiez si un proche, le gardien ou l’agence a un double des clés.', 'Préparez un justificatif de domicile : le serrurier doit vérifier que vous êtes chez vous.', 'Après une effraction, portez plainte avant de faire changer la serrure.'] },
    { id: 'vitre', nom: 'Vitre cassée', icone: '🪟', metier: 'vitrerie',
      gestes: ['Éloignez enfants et animaux, ramassez les éclats avec des gants épais.', 'Couvrez l’ouverture avec un carton ou une bâche et du ruban adhésif.', 'Mesurez la vitre (largeur, hauteur, épaisseur, simple ou double vitrage).'] },
    { id: 'gaz', nom: 'Odeur de gaz', icone: '⚠️', danger: true,
      gestes: ['Ne touchez à aucun interrupteur, n’allumez rien, ne téléphonez pas à l’intérieur.', 'Ouvrez les fenêtres, fermez le robinet de gaz si vous le pouvez, sortez.', 'Appelez Urgence Sécurité Gaz au 0 800 47 33 33 (gratuit, 24 h/24) ou les pompiers au 18 ou au 112.'] },
  ];

  /* Vidéothèque : les vidéos des fiches, plus des tutoriels choisis par thème.
     Toutes vérifiées le 19/11/2026 (oEmbed YouTube : publiques, intégration autorisée). Intégrées, jamais copiées. */
  const THEMES_VIDEO = [
    { id: 'montage', nom: 'Montage et meubles', icone: '🪑' },
    { id: 'fixation', nom: 'Percer et fixer', icone: '🔩' },
    { id: 'peinture', nom: 'Peinture et sols', icone: '🖌️' },
    { id: 'outils', nom: 'Entretien et réparation d’outils', icone: '🪛' },
    { id: 'jardin', nom: 'Jardin', icone: '🌳' },
    { id: 'urgence', nom: 'Bons gestes en cas d’urgence', icone: '🚨' },
  ];
  const VIDEOS_TUTOS = [
    { yt: '7nc_KcN5Gx8', titre: 'Démonter un meuble ancien', chaine: 'Happy Hour TV', theme: 'montage', duree: '7:51' },
    { yt: 'jIBfEU8oCSk', titre: 'Poser du parquet flottant', chaine: 'Castorama', theme: 'peinture', duree: '8:56' },
    { yt: 'a4Q_etNIF1U', titre: 'Peindre un mur au rouleau', chaine: 'Leroy Merlin', theme: 'peinture', duree: '1:15' },
    { yt: '4bXUM8NB6Z8', titre: 'Vérifier les charbons de vos outils', chaine: 'Korman Outillage', theme: 'outils', duree: '2:53' },
    { yt: 'qLwRSj3TiPQ', titre: 'Changer les charbons d’une meuleuse ou d’une perceuse', chaine: 'Bricolage Direct', theme: 'outils', duree: '4:24' },
    { yt: 'hcamAmqGYLo', titre: 'Affûter une lame de tondeuse', chaine: 'Action Création', theme: 'jardin', duree: '5:05' },
    { yt: 'PyqQl1B4MkM', titre: 'Tailler une haie', chaine: 'Leroy Merlin', theme: 'jardin', duree: '4:38' },
    { yt: 'UHERdAtVyGY', titre: 'Tailler une haie : conseils de jardinage', chaine: 'STIHL France', theme: 'jardin', duree: '1:51' },
    { yt: 'fucu-rrmAiY', titre: 'Couper l’eau générale en cas de fuite', chaine: 'Logista Hometech', theme: 'urgence', duree: '2:17', urgence: 'fuite' },
    { yt: 'TzmWCKPeB8Y', titre: 'Que faire quand l’électricité saute ?', chaine: 'Sikana', theme: 'urgence', duree: '1:41', urgence: 'electricite' },
  ];
  const THEME_FICHE = { f1: 'montage', f2: 'fixation', f3: 'montage', f4: 'fixation', f5: 'peinture', f6: 'outils' };

  /* Coupons de travaux à offrir */
  const THEMES_COUPON = [
    { id: 'libre', nom: 'Travaux au choix', icone: '🎁', idee: 'Pour tous les services et artisans de ZETools.' },
    { id: 'meubles', nom: 'Montage de meubles', icone: '🪑', idee: 'Idéal pour un emménagement ou une chambre d’enfant.' },
    { id: 'peinture', nom: 'Un coup de peinture', icone: '🖌️', idee: 'Une pièce rafraîchie, sans y passer le week-end.' },
    { id: 'jardin', nom: 'Jardin', icone: '🌳', idee: 'Tonte, taille de haie, élagage.' },
    { id: 'depannage', nom: 'Petits dépannages', icone: '🔧', idee: 'Pour les parents ou grands-parents : fixations, joints, ampoules.' },
  ];
  const PROCHES = [
    { id: 'parent', nom: 'Un parent', icone: '👵' }, { id: 'enfant', nom: 'Un enfant', icone: '🧒' }, { id: 'ami', nom: 'Un ami', icone: '🤝' },
    { id: 'collegue', nom: 'Un collègue', icone: '💼' }, { id: 'voisin', nom: 'Un voisin', icone: '🏡' }, { id: 'autre', nom: 'Une autre personne', icone: '💛' },
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


  // Déstockage enseignes : noms d'enseignes FICTIFS (maquette publique, aucune marque réelle de distributeur).
  // Types d'acteurs visés : grandes surfaces de bricolage, négoces de matériaux, fabricants, loueurs, quincailleries.
  const TYPES_ENSEIGNE = { gsb: 'Grande surface de bricolage', negoce: 'Négoce de matériaux', fabricant: 'Fabricant', loueur: 'Loueur de matériel', quincaillerie: 'Quincaillerie' };
  const ENSEIGNES = [
    { id: 'e1', nom: 'Brico Horizon', type: 'gsb', siret: true, magasins: 6, logo: '🏬' },
    { id: 'e2', nom: 'Matériaux du Val', type: 'negoce', siret: true, magasins: 3, logo: '🧱' },
    { id: 'e3', nom: 'Forgeval Outillage', type: 'fabricant', siret: true, magasins: 1, logo: '🏭' },
    { id: 'e4', nom: 'Location Chantier Plus', type: 'loueur', siret: true, magasins: 4, logo: '🚚' },
  ];
  const LOTS = [
    { id: 'l1', enseigne: 'e1', titre: 'Perceuse-visseuse 18 V, 2 batteries, coffret', categorie: 'electro', photo: U('1572981779307-38b8cabb2407'),
      prixReference: 149, prixDestockage: 69, motif: 'Fin de série', fin: '2026-12-20',
      magasins: [{ nom: 'Brico Horizon Montreuil', cp: '93100', stock: 14 }, { nom: 'Brico Horizon Créteil', cp: '94000', stock: 9 }] },
    { id: 'l2', enseigne: 'e1', titre: 'Taille-haie électrique 600 W, lame 55 cm', categorie: 'jardin', photo: U('1617576683096-00fc8eecb3af'),
      prixReference: 99, prixDestockage: 45, motif: 'Fin de saison', fin: '2026-12-31',
      magasins: [{ nom: 'Brico Horizon Nanterre', cp: '92000', stock: 22 }] },
    { id: 'l3', enseigne: 'e2', titre: 'Brouette de chantier 100 L, roue gonflée', categorie: 'chantier', photo: U('1621272156506-cdbdb6a47243'),
      prixReference: 89, prixDestockage: 39, motif: 'Surstock', fin: '2027-01-15',
      magasins: [{ nom: 'Matériaux du Val Vitry', cp: '94400', stock: 40 }, { nom: 'Matériaux du Val Ivry', cp: '94200', stock: 18 }] },
    { id: 'l4', enseigne: 'e3', titre: 'Servante d’atelier 7 tiroirs garnie 150 pièces', categorie: 'meca', photo: U('1530124566582-a618bc2615dc'),
      prixReference: 699, prixDestockage: 349, motif: 'Emballage abîmé, produit neuf', fin: '2026-12-15',
      magasins: [{ nom: 'Forgeval, dépôt usine Gennevilliers', cp: '92230', stock: 6 }] },
    { id: 'l5', enseigne: 'e4', titre: 'Perforateur SDS+ 800 W, sorti du parc de location, révisé', categorie: 'electro', photo: U('1585201731775-0597e1be4bfb'),
      prixReference: 189, prixDestockage: 79, motif: 'Renouvellement du parc', fin: '2027-01-31', reconditionne: true,
      magasins: [{ nom: 'Location Chantier Plus Saint-Denis', cp: '93200', stock: 11 }] },
    { id: 'l6', enseigne: 'e2', titre: 'Lot de 3 pelles et bêches de terrassement', categorie: 'chantier', photo: U('1537877853655-34bdcda5e833'),
      prixReference: 75, prixDestockage: 29, motif: 'Changement de référence', fin: '2026-12-31',
      magasins: [{ nom: 'Matériaux du Val Vitry', cp: '94400', stock: 25 }] },
  ];

  // Rendez-vous reçus en démonstration (proposés par d'autres membres)
  const RDV_DEMO = [
    { id: 'r-demo-1', type: 'echange', sens: 'recu', avec: 'm3', objet: 'Échange ponceuse contre visseuse à chocs', annonceId: 'a3',
      creneaux: ['2026-11-28T10:00', '2026-11-28T14:00', '2026-11-30T18:00'], dureeHeures: 1, lieu: 'Lieu public proche (parvis de la mairie conseillé)', statut: 'proposé',
      message: 'Je peux samedi matin ou lundi soir, dites-moi ce qui vous arrange.' },
  ];

  // Services proposés par des membres : particuliers (coups de main occasionnels) et professionnels (SIRET)
  const SERVICES = [
    { id: 's1', modes: ['service'], titre: 'Montage de meubles en kit et pose d’étagères', metier: 'bricolage', membre: 'm1', siret: false, assurePlateforme: true,
      tarif: 22, unite: 'heure', dureeMin: 1, ville: 'Montreuil', cp: '93100', rayonKm: 8, outils: true, photo: U('1623161551706-318825cd18ef'),
      description: 'Armoires, lits, bureaux, dressings : je monte vos meubles en kit et je fixe étagères et meubles hauts. Je viens avec ma visseuse, mon niveau et mes chevilles.',
      inclus: ['Déplacement dans un rayon de 8 km', 'Outillage et petite quincaillerie', 'Nettoyage en fin de montage'] },
    { id: 's2', modes: ['service'], titre: 'Pose de cuisine et agencement sur mesure', metier: 'menuiserie', membre: 'm2', siret: true, decennale: true,
      tarif: 45, unite: 'heure', dureeMin: 2, ville: 'Vincennes', cp: '94300', rayonKm: 12, outils: true, photo: U('1621905251918-48416bd8575a'),
      description: 'Menuisier agenceur depuis 15 ans. Pose de cuisines, plans de travail, dressings et placards sur mesure. Devis détaillé avant intervention pour les chantiers de plus d’une journée.',
      inclus: ['Devis écrit gratuit', 'Facture et garantie professionnelle', 'Outillage d’atelier complet'] },
    { id: 's3', modes: ['service'], titre: 'Taille de haie et entretien de jardin', metier: 'jardin', membre: 'm5', siret: true,
      tarif: 35, unite: 'heure', dureeMin: 2, ville: 'Nogent-sur-Marne', cp: '94130', rayonKm: 15, outils: true, photo: U('1617576683096-00fc8eecb3af'),
      description: 'Taille de haies, tonte, débroussaillage, ramassage et évacuation des déchets verts. Matériel thermique et batterie professionnel.',
      inclus: ['Évacuation des déchets verts', 'Matériel professionnel', 'Facture, service à la personne'] },
    { id: 's4', modes: ['service'], titre: 'Fixation murale : télévision, tringles, miroirs', metier: 'bricolage', membre: 'm4', siret: false,
      tarif: 35, unite: 'forfait', dureeForfait: 1, ville: 'Saint-Maur-des-Fossés', cp: '94100', rayonKm: 10, outils: true, photo: U('1585201731775-0597e1be4bfb'),
      description: 'Forfait pour une fixation murale propre et de niveau : support de télévision, tringle à rideaux, miroir ou tableau lourd. Perforateur et chevilles adaptées à votre mur.',
      inclus: ['Jusqu’à 3 points de fixation', 'Chevilles adaptées (placo, brique, béton)', 'Aspiration des poussières'] },
    { id: 's5', modes: ['service'], titre: 'Cours de bricolage à domicile : prenez vos outils en main', metier: 'bricolage', membre: 'm3', siret: false,
      tarif: 25, unite: 'heure', dureeMin: 1, ville: 'Boulogne-Billancourt', cp: '92100', rayonKm: 6, outils: false, photo: U('1504148455328-c376907d081c'),
      description: 'Vous venez d’acheter ou de louer un outil sur ZETools ? Je vous montre comment vous en servir en sécurité : perceuse, scie sauteuse, ponceuse. Idéal pour un premier chantier.',
      inclus: ['Conseils de sécurité', 'Exercices sur votre propre outil', 'Liste des consommables à prévoir'] },
  ];

  // Fiches techniques téléchargeables en PDF (contenu rédigé pour ZETools, indicatif)
  // adresse publique de la maquette (GitHub Pages) ; à remplacer par https://zetools.fr/ une fois le domaine réservé
  const SITE_PUBLIC = 'https://nouarideba-bit.github.io/zetools/';
  /* Vidéos des fiches : choisies sur des chaînes de marques, d'enseignes ou de bricoleurs reconnus,
     vérifiées le 19/11/2026 par le service oEmbed de YouTube (vidéo publique, intégration autorisée).
     Elles sont intégrées, jamais copiées. « debuts » : secondes de début de chaque étape, à renseigner
     pour les Tutos ZETOOLS (null tant que la vidéo ne suit pas exactement les étapes de la fiche). */
  const FICHES = [
    { id: 'f1', videos: [{ yt: 'dLC-b_5psdM', titre: 'Les conseils pratiques pour monter un meuble en kit', chaine: 'Weldom', debuts: null }, { yt: 'xgK8rc06aVM', titre: 'Monter des meubles en kit', chaine: 'Maisonbrico', debuts: null }], pictos: ['espace', 'inventaire', 'trier', 'goutte', 'assembler', 'mesurer', 'redresser', 'fixer'], icone: '🪑', titre: 'Monter un meuble en kit sans se tromper', theme: 'Montage', niveau: 'Débutant', duree: '1 à 2 h', budget: '0 € hors meuble',
      resume: 'La méthode pour monter une armoire, une commode ou un bureau en kit d’équerre, sans abîmer les panneaux et sans vis en trop à la fin.',
      outils: [{ nom: 'Visseuse sans fil à couple réglable, embouts cruciformes et six pans', q: 'visseuse' }, { nom: 'Maillet en caoutchouc', q: 'maillet' }, { nom: 'Mètre ruban et niveau à bulle', q: 'niveau' }, { nom: 'Petites coupelles pour trier la visserie', q: '' }],
      materiaux: ['Colle à bois vinylique (facultatif, pour les tourillons)', 'Carton d’emballage pour protéger le sol', 'Vis et chevilles adaptées à votre mur pour la fixation anti-basculement'],
      etapes: ['Dégagez une surface plus grande que le meuble couché et protégez le sol avec le carton d’emballage.', 'Faites l’inventaire des panneaux et de la quincaillerie avec la notice. S’il manque une pièce, ne commencez pas.', 'Triez la visserie par type dans des coupelles et repérez chaque panneau par sa lettre ou son numéro.', 'Posez d’abord tourillons et excentriques sur les panneaux. Une goutte de colle dans les trous de tourillons rigidifie le meuble, mais empêche tout démontage.', 'Assemblez la caisse à plat : côtés, dessus, dessous. Serrez les excentriques d’un quart de tour, sans forcer.', 'Contrôlez l’équerrage : les deux diagonales de la caisse doivent être égales. Fixez ensuite le fond, qui bloque l’équerrage.', 'Redressez le meuble à deux. Posez tablettes, portes et tiroirs, puis réglez les charnières avec leurs vis de réglage.', 'Fixez le meuble au mur avec le dispositif anti-basculement fourni.'],
      securite: ['Réglez la visseuse sur un couple faible : l’aggloméré éclate si l’on serre trop fort.', 'Manipulez les grands panneaux à deux.', 'Un meuble haut non fixé au mur peut basculer : la fixation murale est indispensable, surtout avec des enfants.'],
      astuce: 'Gardez la notice et la clé fournie dans une pochette collée au dos du meuble : elles serviront au prochain déménagement.' },
    { id: 'f2', videos: [{ yt: '52hQm7WapzE', titre: 'Fixer une étagère murale sur placo avec chevilles Molly', chaine: 'Brico Dépôt', debuts: null }, { yt: 'nQFQSEtJsXo', titre: 'Fixer une tablette à fixation invisible', chaine: 'Leroy Merlin', debuts: null }], pictos: ['mur', 'electricite', 'niveau', 'percer', 'nettoyer', 'visser', 'verifier'], icone: '📏', titre: 'Fixer une étagère murale solide et de niveau', theme: 'Fixation', niveau: 'Débutant', duree: '45 min', budget: '10 à 30 €',
      resume: 'Choisir la bonne cheville selon le mur, percer proprement et obtenir une étagère parfaitement horizontale.',
      outils: [{ nom: 'Perceuse à percussion ou perforateur', q: 'perforateur' }, { nom: 'Forets adaptés au mur (béton, brique, bois ou métal pour le placo)', q: 'forets' }, { nom: 'Détecteur de câbles et de métaux', q: 'détecteur' }, { nom: 'Niveau à bulle, mètre, crayon', q: 'niveau' }, { nom: 'Visseuse et aspirateur', q: 'visseuse' }],
      materiaux: ['Étagère avec ses équerres ou ses supports invisibles', 'Chevilles adaptées : métalliques à expansion pour la plaque de plâtre, longues ou chimiques pour la brique creuse, nylon pour le béton et la brique pleine', 'Vis du diamètre indiqué sur la boîte de chevilles'],
      etapes: ['Identifiez le mur : il sonne creux (plaque de plâtre, brique creuse) ou plein (béton, brique pleine). La couleur de la poussière au perçage confirme : blanche pour le plâtre, rouge pour la brique, grise pour le béton.', 'Passez le détecteur. Ne percez jamais à l’aplomb ni à l’horizontale d’une prise ou d’un interrupteur.', 'Tracez un trait horizontal au niveau à bulle et marquez les points de perçage à travers les supports.', 'Percez au diamètre de la cheville, un centimètre plus profond que sa longueur. Sans percussion dans la plaque de plâtre, la brique creuse et le carrelage.', 'Aspirez la poussière et enfoncez les chevilles à fleur du mur.', 'Vissez les supports sans les bloquer, contrôlez le niveau, puis serrez.', 'Posez la tablette, fixez-la aux supports et chargez-la progressivement.'],
      securite: ['Portez des lunettes de protection.', 'Près d’un circuit électrique, coupez le courant au tableau avant de percer.', 'Respectez la charge maximale indiquée sur la boîte de chevilles : elle dépend du mur.'],
      astuce: 'Collez une enveloppe pliée sous le point de perçage avec du ruban adhésif : elle recueille la poussière.' },
    { id: 'f3', videos: [{ yt: 'Q1gg45YgYIg', titre: 'Fabriquer une étagère toute simple', chaine: 'Dimitri Elledge', debuts: null }], pictos: ['plan', 'tracer', 'scier', 'poncer', 'percer', 'assembler', 'visser', 'peindre', 'fixer'], icone: '🪚', titre: 'Fabriquer une étagère en bois sur mesure', theme: 'Fabrication', niveau: 'Intermédiaire', duree: 'Une demi-journée, plus le séchage', budget: '40 à 90 €',
      resume: 'Une bibliothèque simple en planches massives, aux dimensions exactes de votre niche ou de votre mur.',
      outils: [{ nom: 'Scie circulaire avec guide, ou scie sauteuse', q: 'scie' }, { nom: 'Ponceuse excentrique', q: 'ponceuse' }, { nom: 'Perceuse-visseuse, foret de 3 mm et fraise à chanfreiner', q: 'perceuse' }, { nom: 'Serre-joints, équerre de menuisier, mètre', q: 'serre-joints' }],
      materiaux: ['Planches de pin ou de chêne, 18 à 22 mm d’épaisseur', 'Vis à bois 4 × 40 mm, colle à bois', 'Abrasifs grains 80, 120, 180 et 240', 'Huile ou vernis de finition', 'Fond en contreplaqué de 5 mm ou traverse arrière'],
      etapes: ['Dessinez un plan coté. Pour une planche de 18 mm chargée de livres, limitez la portée à 80 cm environ entre deux montants.', 'Tracez les coupes à l’équerre et numérotez les pièces.', 'Sciez avec la belle face vers le bas : la lame fait des éclats sur le dessus.', 'Poncez au grain 80, puis 120, puis 180, et cassez légèrement les arêtes.', 'Pré-percez à 3 mm et fraisez l’entrée des trous : le bois ne fend pas et les têtes de vis s’effacent.', 'Assemblez montants et tablettes à la colle et aux vis, sous serre-joints. Contrôlez l’équerrage par les diagonales.', 'Posez le fond ou une traverse arrière : c’est ce qui empêche le meuble de se déformer en parallélogramme.', 'Dépoussiérez, puis appliquez deux couches de finition en égrenant au grain 240 entre les deux.', 'Fixez l’étagère au mur.'],
      securite: ['Lunettes, protections auditives et masque anti-poussière pendant le sciage et le ponçage.', 'Bloquez toujours la pièce avec des serre-joints : ne la tenez jamais à la main près de la lame.', 'Débranchez l’outil ou retirez la batterie avant de changer une lame.'],
      astuce: 'Faites débiter les planches à la bonne longueur en magasin : il ne vous restera que les coupes de finition.' },
    { id: 'f4', videos: [{ yt: 'fQB2NizOMBw', titre: 'Bien percer : choisir une cheville et un foret adéquats', chaine: 'Bricorama', debuts: null }, { yt: 'Vz9dFV93HMc', titre: 'Choisir une cheville en fonction du mur', chaine: 'Robert Longechal', debuts: null }], pictos: ['mur', 'electricite', 'percer', 'attention', 'percer', 'attendre', 'nettoyer'], icone: '🧱', titre: 'Percer un mur : le bon foret, la bonne cheville', theme: 'Perçage', niveau: 'Débutant', duree: '20 min', budget: '5 à 15 €',
      resume: 'Plaque de plâtre, brique, béton, carrelage : à chaque support sa méthode pour un trou net et une fixation qui tient.',
      outils: [{ nom: 'Perceuse à percussion (brique pleine, parpaing) ou perforateur SDS (béton)', q: 'perforateur' }, { nom: 'Jeu de forets : béton, bois, métal, carrelage', q: 'forets' }, { nom: 'Détecteur de câbles et de métaux', q: 'détecteur' }, { nom: 'Aspirateur et ruban adhésif de masquage', q: 'aspirateur' }],
      materiaux: ['Chevilles adaptées au support et à la charge', 'Vis correspondantes'],
      etapes: ['Reconnaissez le support : plaque de plâtre (sonne creux, poussière blanche), brique (poussière rouge), béton (poussière grise, très dur).', 'Repérez câbles et tuyaux au détecteur. Les gaines électriques courent à la verticale et à l’horizontale des prises et interrupteurs.', 'Plaque de plâtre : foret à métaux, sans percussion, cheville métallique à expansion.', 'Brique creuse : sans percussion pour ne pas casser les alvéoles, cheville longue ou scellement chimique.', 'Béton et brique pleine : percussion ou perforateur, foret béton, cheville nylon.', 'Carrelage : collez un ruban de masquage, percez sans percussion avec un foret spécial, à vitesse lente, puis changez de foret pour le mur.', 'Percez bien perpendiculairement, un centimètre plus profond que la cheville, et aspirez le trou avant de la poser.'],
      securite: ['Lunettes de protection ; masque si vous percez beaucoup.', 'Coupez le courant au tableau en cas de doute sur le passage d’un câble.', 'Tenez la machine à deux mains et utilisez la poignée latérale d’un perforateur.'],
      astuce: 'Un morceau de ruban adhésif enroulé sur le foret sert de butée de profondeur.' },
    { id: 'f5', videos: [{ yt: 'mFvki5IWAZE', titre: 'Peindre un meuble', chaine: 'Jennifer, Atelier Mobilier', debuts: null }], pictos: ['demonter', 'nettoyer', 'poncer', 'nettoyer', 'goutte', 'peindre', 'poncer', 'peindre', 'attendre'], icone: '🖌️', titre: 'Poncer et repeindre un meuble en bois', theme: 'Rénovation', niveau: 'Intermédiaire', duree: 'Un week-end avec les séchages', budget: '30 à 60 €',
      resume: 'Redonner une seconde vie à une commode ou à une table : préparation du support, sous-couche et deux couches bien tendues.',
      outils: [{ nom: 'Ponceuse excentrique et cale à poncer', q: 'ponceuse' }, { nom: 'Pinceau à rechampir et petit rouleau laqueur', q: '' }, { nom: 'Tournevis, bâche de protection', q: '' }],
      materiaux: ['Abrasifs grains 120, 180 et 240', 'Dégraissant ou lessive, chiffons', 'Pâte à bois', 'Sous-couche adaptée (primaire d’accrochage pour un meuble mélaminé ou verni)', 'Peinture pour boiseries'],
      etapes: ['Démontez poignées, portes et tiroirs. Protégez le sol.', 'Lessivez, rincez et laissez sécher complètement.', 'Poncez au grain 120. Sur un vernis sain, il suffit de dépolir pour donner de l’accroche : inutile de mettre le bois à nu.', 'Dépoussiérez à l’aspirateur, puis au chiffon légèrement humide.', 'Rebouchez trous et éclats à la pâte à bois, laissez sécher, poncez au grain 180.', 'Appliquez la sous-couche et laissez sécher le temps indiqué.', 'Égrenez au grain 240 et dépoussiérez.', 'Passez deux couches fines de peinture dans le sens du fil du bois, en respectant le temps de séchage entre les couches.', 'Remontez la quincaillerie. Attendez plusieurs jours avant un usage intensif : la peinture durcit lentement.'],
      securite: ['Masque anti-poussière FFP2 et lunettes pendant le ponçage.', 'Les peintures des meubles anciens peuvent contenir du plomb : ne les poncez pas à sec, faites-les tester ou utilisez un décapant adapté.', 'Aérez la pièce pendant l’application et le séchage.'],
      astuce: 'Deux couches fines valent mieux qu’une couche épaisse : moins de coulures, un film plus dur.' },
    { id: 'f6', videos: [{ yt: 'Sc0PNG-kF_8', titre: 'Utiliser une visseuse en sécurité', chaine: 'grainedecopeaux', debuts: null }, { yt: 'Q-KfLy3znWw', titre: 'Utiliser et entretenir un perforateur', chaine: 'Brico Dépôt', debuts: null }], pictos: ['batterie', 'nettoyer', 'goutte', 'trier', 'batterie', 'electricite', 'nettoyer', 'inventaire'], icone: '🔋', titre: 'Entretenir sa perceuse-visseuse et ses batteries', theme: 'Entretien', niveau: 'Débutant', duree: '15 min', budget: '0 €',
      resume: 'Les gestes simples qui doublent la durée de vie d’un outil sans fil, et qui lui gardent sa valeur à la revente ou à la location.',
      outils: [{ nom: 'Pinceau sec ou soufflette', q: '' }, { nom: 'Chiffon propre', q: '' }, { nom: 'Huile fine', q: '' }],
      materiaux: [],
      etapes: ['Retirez la batterie avant toute intervention.', 'Dépoussiérez les ouïes d’aération au pinceau sec : un moteur qui respire ne surchauffe pas.', 'Ouvrez le mandrin à fond, chassez la poussière, déposez une goutte d’huile fine sur les mors.', 'Triez forets et embouts : un foret émoussé fait forcer la machine et vide la batterie.', 'Stockez les batteries lithium à moitié chargées, au sec, entre 10 et 25 °C. Évitez la décharge complète.', 'Ne laissez pas la batterie en permanence sur le chargeur et ne rechargez pas une batterie encore chaude.', 'Essuyez les contacts de la batterie et du chargeur avec un chiffon sec.', 'Notez la date d’achat et les interventions : c’est le carnet de santé de l’outil, un vrai argument sur ZETools.'],
      securite: ['Une batterie gonflée, choquée ou qui chauffe anormalement ne doit plus servir : déposez-la dans un point de collecte.', 'Ne stockez jamais une batterie en plein soleil ni dans une voiture en été.', 'N’utilisez que le chargeur prévu par le fabricant.'],
      astuce: 'Une batterie qui ne tient plus la charge se remplace : l’outil, lui, peut servir encore dix ans.' },
  ];

  // Offres de prix reçues en démonstration (sur des annonces fictives du compte de démonstration)
  const OFFRES_DEMO = [
    { id: 'o-demo-1', sens: 'recue', avec: 'm2', titre: 'Votre scie sauteuse 650 W', mode: 'vente', prixAffiche: 45, montant: 32, statut: 'en attente', expire: '2026-12-31T20:00' },
    { id: 'o-demo-2', sens: 'recue', avec: 'm1', titre: 'Votre échelle télescopique 3,80 m', mode: 'location', prixAffiche: 5, montant: 4, statut: 'en attente', expire: '2026-12-31T20:00' },
  ];

  const D = { PHOTOS, VIDEOS, CATEGORIES, MEMBRES, ANNONCES, RESERVATIONS, ARTICLES, CREDITS, METIERS, ARTISANS, DEMANDES, TYPES_ENSEIGNE, ENSEIGNES, LOTS, RDV_DEMO, OFFRES_DEMO, SERVICES, FICHES, SITE_PUBLIC, TYPES_URGENCE, THEMES_VIDEO, VIDEOS_TUTOS, THEME_FICHE, THEMES_COUPON, PROCHES };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else racine.ZT_DONNEES = D;
})(typeof window !== 'undefined' ? window : globalThis);
