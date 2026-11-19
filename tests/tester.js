/* Tests de la logique ZETOOLS : node tests/tester.js */
'use strict';
const assert = require('assert');
const Z = require('../logique.js');
const D = require('../donnees.js');

let ok = 0, ko = 0;
function test(nom, fn) {
  try { fn(); ok++; console.log('  ✓', nom); }
  catch (e) { ko++; console.log('  ✗', nom, '\n     ', e.message); }
}
const outil = { id: 'x', prixJour: 10, prixVente: 100, caution: 150, indispo: [{ debut: '2026-12-24', fin: '2026-12-26' }] };
const resas = [{ outilId: 'x', debut: '2026-12-05', fin: '2026-12-07', statut: 'confirmée' },
  { outilId: 'x', debut: '2026-12-10', fin: '2026-12-12', statut: 'annulée' }];

console.log('Prix');
test('nbJours inclut les bornes', () => { assert.strictEqual(Z.nbJours('2026-12-03', '2026-12-05'), 3); assert.strictEqual(Z.nbJours('2026-12-03', '2026-12-03'), 1); });
test('nbJours traverse le changement d’heure et de mois', () => assert.strictEqual(Z.nbJours('2027-03-27', '2027-04-02'), 7));
test('1 jour : pas de remise, assurance minimale 3 €', () => {
  const d = Z.devisLocation(outil, '2026-12-01', '2026-12-01');
  assert.deepStrictEqual([d.brut, d.remise, d.location, d.assurance, d.fraisService, d.totalLocataire], [10, 0, 10, 3, 0.8, 13.8]);
});
test('3 jours : remise 10 %', () => { const d = Z.devisLocation(outil, '2026-12-01', '2026-12-03'); assert.strictEqual(d.remise, 3); assert.strictEqual(d.location, 27); });
test('7 jours : remise 20 %, assurance 7 %', () => { const d = Z.devisLocation(outil, '2026-12-01', '2026-12-07'); assert.strictEqual(d.location, 56); assert.strictEqual(d.assurance, 3.92); });
test('sans assurance', () => assert.strictEqual(Z.devisLocation(outil, '2026-12-01', '2026-12-01', { assurance: false }).assurance, 0));
test('commission dégressive 15 / 12 / 10 %', () => { assert.strictEqual(Z.tauxCommission(0), 0.15); assert.strictEqual(Z.tauxCommission(4), 0.15); assert.strictEqual(Z.tauxCommission(5), 0.12); assert.strictEqual(Z.tauxCommission(20), 0.10); assert.strictEqual(Z.tauxCommission(99), 0.10); });
test('versement propriétaire + commission = location', () => {
  const d = Z.devisLocation({ ...outil, prixJour: 13.7 }, '2026-12-01', '2026-12-04', { locationsProprietaire: 6 });
  assert.strictEqual(Math.round((d.versementProprietaire + d.commission) * 100), Math.round(d.location * 100));
});
test('total locataire = location + assurance + frais', () => {
  const d = Z.devisLocation({ ...outil, prixJour: 9 }, '2026-12-01', '2026-12-05');
  assert.strictEqual(Math.round(d.totalLocataire * 100), Math.round((d.location + d.assurance + d.fraisService) * 100));
});
test('la caution n’entre pas dans le total', () => assert.strictEqual(Z.devisLocation(outil, '2026-12-01', '2026-12-01').totalLocataire, 13.8));
test('dates inversées : erreur', () => assert.throws(() => Z.devisLocation(outil, '2026-12-05', '2026-12-01')));
test('vente : commission 8 %', () => assert.deepStrictEqual(Z.devisVente(outil), { prix: 100, commission: 8, versementVendeur: 92 }));

console.log('Disponibilités');
test('période libre acceptée', () => assert.ok(Z.verifierDisponibilite(outil, resas, '2026-12-01', '2026-12-03', '2026-11-19').ok));
test('chevauchement refusé', () => assert.ok(!Z.verifierDisponibilite(outil, resas, '2026-12-04', '2026-12-05', '2026-11-19').ok));
test('englobement refusé', () => assert.ok(!Z.verifierDisponibilite(outil, resas, '2026-12-01', '2026-12-09', '2026-11-19').ok));
test('lendemain du retour accepté', () => assert.ok(Z.verifierDisponibilite(outil, resas, '2026-12-08', '2026-12-09', '2026-11-19').ok));
test('réservation annulée ignorée', () => assert.ok(Z.verifierDisponibilite(outil, resas, '2026-12-10', '2026-12-12', '2026-11-19').ok));
test('dates bloquées par le propriétaire refusées', () => assert.match(Z.verifierDisponibilite(outil, resas, '2026-12-23', '2026-12-24', '2026-11-19').raison, /bloqué/));
test('date passée refusée', () => assert.ok(!Z.verifierDisponibilite(outil, resas, '2026-11-18', '2026-11-20', '2026-11-19').ok));
test('plus de 30 jours refusé', () => assert.ok(!Z.verifierDisponibilite(outil, [], '2027-01-01', '2027-02-15', '2026-11-19').ok));
test('autre outil sans effet', () => assert.ok(Z.verifierDisponibilite({ ...outil, id: 'y', indispo: [] }, resas, '2026-12-05', '2026-12-07', '2026-11-19').ok));
test('dates manquantes refusées', () => assert.ok(!Z.verifierDisponibilite(outil, [], null, '2026-12-01').ok));
test('joursOccupes : 3 réservés + 3 bloqués, annulée exclue', () => {
  const j = Z.joursOccupes(outil, resas);
  assert.strictEqual(j.size, 6); assert.ok(j.has('2026-12-06')); assert.ok(!j.has('2026-12-11'));
});

console.log('Masquage des coordonnées');
const masque = (t) => Z.masquerCoordonnees(t, false);
const doitMasquer = [
  'Appelez-moi au 06 12 34 56 78',
  'mon tel 06.12.34.56.78 merci',
  '0612345678',
  'joignable au +33 6 12 34 56 78',
  'ou 0033 6 12 34 56 78',
  'écris à jean.dupont@gmail.com',
  'jean.dupont arobase gmail point com',
  'jean (at) free.fr',
  'virement sur FR76 3000 6000 0112 3456 7890 189',
  'je suis au 12 rue de la Paix à Vincennes',
  'rdv 3 bis avenue Foch',
  'regarde www.monsite.fr',
  'on passe sur WhatsApp plutôt',
  'zéro six douze trente-quatre',
  '0 6 1 2 3 4 5 6 7 8',
];
for (const t of doitMasquer) test(`masque : « ${t} »`, () => { const r = masque(t); assert.ok(r.masque, r.texte); assert.ok(r.texte.includes(Z.MASQUE)); });
const neDoitPasMasquer = [
  'Bonjour, il est disponible samedi ?',
  'Je le rends le 12/12 vers 18 h',
  'Le foret de 8 mm est fourni, 2 batteries 18 V',
  'Prix 145 €, état 9/10',
  'Je peux venir à 14 h 30 le 3 décembre',
];
for (const t of neDoitPasMasquer) test(`laisse passer : « ${t} »`, () => { const r = masque(t); assert.ok(!r.masque, r.texte); assert.strictEqual(r.texte, t); });
test('après transaction confirmée, rien n’est masqué', () => assert.strictEqual(Z.masquerCoordonnees('06 12 34 56 78', true).texte, '06 12 34 56 78'));
test('le texte autour du masque est conservé', () => assert.match(masque('Salut, 06 12 34 56 78 à bientôt').texte, /^Salut, .* à bientôt$/));

console.log('Recherche et données');
test('filtre par mode', () => assert.ok(Z.filtrer(D.ANNONCES, { mode: 'echange' }).every((a) => a.modes.includes('echange'))));
test('filtre par code postal', () => assert.ok(Z.filtrer(D.ANNONCES, { lieu: '94' }).every((a) => a.cp.startsWith('94'))));
test('recherche par marque, insensible à la casse', () => assert.deepStrictEqual(Z.filtrer(D.ANNONCES, { q: 'dewalt' }).map((a) => a.id), ['a1']));
test('recherche multi-mots', () => assert.strictEqual(Z.filtrer(D.ANNONCES, { q: 'perforateur vincennes' }).length, 1));
test('aucun résultat absurde', () => assert.strictEqual(Z.filtrer(D.ANNONCES, { q: 'tractopelle' }).length, 0));
test('chaque annonce est cohérente avec ses modes', () => {
  for (const a of D.ANNONCES) {
    if (a.modes.includes('location')) assert.ok(a.prixJour > 0 && a.caution >= 0, a.id);
    if (a.modes.includes('vente')) assert.ok(a.prixVente > 0, a.id);
    assert.ok(D.MEMBRES[a.membre], a.id);
    assert.ok(D.CATEGORIES.some((c) => c.id === a.categorie), a.id);
    assert.ok(/^https:\/\/images\.unsplash\.com\/photo-/.test(a.photo), a.id);
  }
});
test('7 catégories du cahier des charges', () => assert.strictEqual(D.CATEGORIES.length, 7));
test('réservations d’exemple sans chevauchement', () => {
  for (const r of D.RESERVATIONS) {
    const a = D.ANNONCES.find((x) => x.id === r.outilId);
    assert.ok(Z.verifierDisponibilite(a, D.RESERVATIONS.filter((x) => x !== r), r.debut, r.fin).ok, r.id);
  }
});

console.log('\nGéolocalisation et abonnement artisan');
const J = '2026-11-19';
const PARIS = { lat: 48.8566, lon: 2.3522 };
test('code postal connu → position', () => { const p = Z.positionCodePostal('94300'); assert.ok(p && Math.abs(p.lat - 48.85) < 0.05); });
test('code postal inconnu d’IDF → repli sur le département', () => assert.ok(Z.positionCodePostal('94999')));
test('code postal hors zone → null', () => assert.strictEqual(Z.positionCodePostal('13001'), null));
test('distance Paris–Vincennes entre 5 et 8 km', () => { const d = Z.distanceKm(PARIS, { lat: 48.8474, lon: 2.4392 }); assert.ok(d > 5 && d < 8, d); });
test('distance nulle sur soi-même', () => assert.ok(Z.distanceKm(PARIS, PARIS) < 0.001));
test('position approchée à environ 1 km', () => { const p = Z.positionApprochee({ lat: 48.84741, lon: 2.43924 }); assert.deepStrictEqual(p, { lat: 48.85, lon: 2.44 }); });
test('artisans proches triés par distance', () => {
  const r = Z.artisansProches({ lat: 48.8474, lon: 2.4392 }, D.ARTISANS, { rayonKm: 20 });
  for (let i = 1; i < r.length; i++) assert.ok(r[i].km >= r[i - 1].km);
});
test('le rayon de l’artisan compte aussi', () => {
  const r = Z.artisansProches(PARIS, D.ARTISANS, { rayonKm: 40 });
  assert.ok(r.every((x) => x.km <= x.artisan.rayonKm));
});
test('filtre par métier « réparation »', () => {
  const r = Z.artisansProches({ lat: 48.86, lon: 2.44 }, D.ARTISANS, { rayonKm: 20, metier: 'reparation' });
  assert.ok(r.length >= 1 && r.every((x) => x.artisan.metiers.includes('reparation')));
});
test('demandes visibles par un artisan : son métier, sa zone', () => {
  const a = D.ARTISANS.find((x) => x.id === 'p8');
  const r = Z.demandesPourArtisan(a, D.DEMANDES);
  assert.ok(r.length >= 1);
  assert.ok(r.every((x) => (x.demande || x).metier === 'reparation'));
});
test('abonnement actif / sans abonnement', () => {
  assert.strictEqual(Z.abonnementActif({ abonnement: { finPeriode: '2026-12-01' } }, J), true);
  assert.strictEqual(Z.abonnementActif({ abonnement: { finPeriode: '2026-11-18' } }, J), false);
  assert.strictEqual(Z.abonnementActif({ abonnement: null }, J), false);
});
test('coût annuel = 2 mois offerts', () => { const c = Z.coutAbonnement('annuel'); assert.strictEqual(c.prix, 390); assert.strictEqual(c.economieAn, 78); });
test('coût mensuel 39 €', () => assert.strictEqual(Z.coutAbonnement('mensuel').prix, 39));
const ART = { id: 'x', metiers: ['maconnerie'], rayonKm: 30, lat: 48.84, lon: 2.24, decennale: false, abonnement: { finPeriode: '2027-01-01' } };
const GROS = D.DEMANDES.find((d) => d.id === 'd4');
test('gros travaux refusés sans décennale', () => assert.match(Z.peutRepondre(ART, GROS, J).raison, /décennale/));
test('gros travaux acceptés avec décennale', () => assert.ok(Z.peutRepondre(Object.assign({}, ART, { decennale: true }), GROS, J).ok));
test('abonnement expiré → réponse refusée', () => assert.match(Z.peutRepondre(Object.assign({}, ART, { decennale: true, abonnement: { finPeriode: '2026-10-01' } }), GROS, J).raison, /Abonnement/));
test('hors zone → refusé', () => assert.match(Z.peutRepondre(Object.assign({}, ART, { decennale: true, rayonKm: 1, lat: 48.9, lon: 2.6 }), GROS, J).raison, /zone/));
test('pas de double réponse', () => assert.match(Z.peutRepondre(Object.assign({}, ART, { decennale: true }), Object.assign({}, GROS, { reponses: [{ artisanId: 'x' }] }), J).raison, /déjà/));
test('chaque artisan a des métiers connus', () => { for (const a of D.ARTISANS) assert.ok(a.metiers.every((m) => D.METIERS.some((x) => x.id === m)), a.id); });

console.log('Prix plafonnés');
test('plafond selon l’état : 70 / 50 / 40 / 30 / 15 %', () => {
  assert.deepStrictEqual(['Neuf', 'Très bon état', 'Bon état', 'État correct', 'À réparer'].map((e) => Z.plafondPrix(200, e).venteMax), [140, 100, 80, 60, 30]);
});
test('loyer ≤ 4 % du neuf, minimum 2 €', () => { assert.strictEqual(Z.plafondPrix(200, 'Bon état').jourMax, 8); assert.strictEqual(Z.plafondPrix(30, 'Bon état').jourMax, 2); });
test('prix conseillé = 80 % du plafond', () => assert.strictEqual(Z.plafondPrix(200, 'Très bon état').venteConseillee, 80));
test('sans prix neuf : refus', () => { assert.strictEqual(Z.plafondPrix(0, 'Neuf'), null); assert.strictEqual(Z.verifierPrix({ modes: ['vente'], prixVente: 10, etat: 'Neuf' }).ok, false); });
test('vente trop chère refusée, au plafond acceptée', () => {
  assert.match(Z.verifierPrix({ prixNeuf: 200, etat: 'Bon état', modes: ['vente'], prixVente: 81 }).erreurs[0], /trop élevé/);
  assert.ok(Z.verifierPrix({ prixNeuf: 200, etat: 'Bon état', modes: ['vente'], prixVente: 80 }).ok);
});
test('loyer et caution trop élevés refusés', () => {
  const v = Z.verifierPrix({ prixNeuf: 200, etat: 'Bon état', modes: ['location'], prixJour: 9, caution: 120 });
  assert.strictEqual(v.erreurs.length, 2);
});
test('même neuf, un outil reste sous le prix magasin', () => assert.strictEqual(Z.verifierPrix({ prixNeuf: 100, etat: 'Neuf', modes: ['vente'], prixVente: 100 }).ok, false));
test('remise sur le neuf', () => { assert.strictEqual(Z.remiseSurNeuf(89, 220), 60); assert.strictEqual(Z.remiseSurNeuf(220, 220), 0); assert.strictEqual(Z.remiseSurNeuf(10, 0), 0); });
test('toutes les annonces de la maquette respectent les plafonds', () => { for (const a of D.ANNONCES) { const v = Z.verifierPrix(a); assert.ok(v.ok, a.id + ' ' + v.erreurs.join(' ')); } });

console.log('Déstockage enseignes');
const LOT = D.LOTS[0];
test('tous les lots de la maquette sont valides et à −40 % au moins', () => { for (const l of D.LOTS) { assert.ok(Z.verifierLot(l, J).ok, l.id); assert.ok(Z.remiseSurNeuf(l.prixDestockage, l.prixReference) >= 40, l.id); assert.ok(D.ENSEIGNES.some((e) => e.id === l.enseigne)); } });
test('prix de déstockage ≥ prix de référence : refusé', () => assert.match(Z.verifierLot(Object.assign({}, LOT, { prixDestockage: LOT.prixReference }), J).erreurs[0], /inférieur/));
test('lot sans stock ou expiré : refusé', () => {
  assert.strictEqual(Z.verifierLot(Object.assign({}, LOT, { magasins: [] }), J).ok, false);
  assert.match(Z.verifierLot(Object.assign({}, LOT, { fin: '2026-11-01' }), J).erreurs[0], /passée/);
});
test('devis : limite par client, commission 8 %', () => {
  const d = Z.devisLot(LOT, 5);
  assert.strictEqual(d.quantite, Z.REGLES.maxParClient); assert.strictEqual(d.total, 138); assert.strictEqual(d.commission, 11.04); assert.strictEqual(d.versementEnseigne, 126.96); assert.strictEqual(d.economie, 160);
});
test('retrait du stock dans le magasin choisi, sans toucher à l’original', () => {
  const r = Z.retirerDuStock(LOT, '94000', 2);
  assert.ok(r.ok); assert.strictEqual(r.magasins.find((m) => m.cp === '94000').stock, 7); assert.strictEqual(LOT.magasins.find((m) => m.cp === '94000').stock, 9);
});
test('stock insuffisant : refus', () => assert.strictEqual(Z.retirerDuStock({ magasins: [{ nom: 'x', cp: '1', stock: 1 }] }, '1', 2).ok, false));

console.log('Agenda et rendez-vous');
const M = '2026-11-19T15:10';
test('créneaux de 8 h à 19 h, toutes les heures', () => { const c = Z.creneauxJour('2026-11-20'); assert.strictEqual(c.length, 12); assert.strictEqual(c[0].heure, '08:00'); assert.strictEqual(c[11].heure, '19:00'); });
test('pas de créneau le dimanche', () => assert.strictEqual(Z.creneauxJour('2026-11-22').length, 0));
test('le jour même : seulement 2 h après maintenant', () => assert.deepStrictEqual(Z.creneauxJour('2026-11-19', { maintenant: M }).map((c) => c.heure), ['18:00', '19:00']));
test('créneau déjà pris marqué non libre', () => assert.strictEqual(Z.creneauxJour('2026-11-20', { pris: ['2026-11-20T10:00'] }).find((c) => c.heure === '10:00').libre, false));
test('avancer passe minuit et le changement d’année', () => assert.strictEqual(Z.avancer('2026-12-31T23:00', 2), '2027-01-01T01:00'));
const RDV = { id: 'r1', type: 'echange', objet: 'Ponceuse, test', creneaux: ['2026-11-21T10:00', '2026-11-23T18:00'], dureeHeures: 2, statut: 'proposé' };
test('proposition valide', () => assert.ok(Z.verifierProposition(RDV, M).ok));
test('proposition refusée : aucun créneau, plus de 3, doublon, passé, dimanche, type inconnu', () => {
  assert.strictEqual(Z.verifierProposition(Object.assign({}, RDV, { creneaux: [] }), M).ok, false);
  assert.strictEqual(Z.verifierProposition(Object.assign({}, RDV, { creneaux: ['2026-11-21T08:00', '2026-11-21T09:00', '2026-11-21T10:00', '2026-11-21T11:00'] }), M).ok, false);
  assert.strictEqual(Z.verifierProposition(Object.assign({}, RDV, { creneaux: ['2026-11-21T08:00', '2026-11-21T08:00'] }), M).ok, false);
  assert.strictEqual(Z.verifierProposition(Object.assign({}, RDV, { creneaux: ['2026-11-19T16:00'] }), M).ok, false);
  assert.strictEqual(Z.verifierProposition(Object.assign({}, RDV, { creneaux: ['2026-11-22T10:00'] }), M).ok, false);
  assert.strictEqual(Z.verifierProposition(Object.assign({}, RDV, { type: 'autre' }), M).ok, false);
});
test('accepter un créneau confirme le rendez-vous', () => { const r = Z.confirmerRdv(RDV, '2026-11-21T10:00'); assert.strictEqual(r.rdv.statut, 'confirmé'); assert.strictEqual(r.rdv.creneau, '2026-11-21T10:00'); });
test('créneau hors proposition refusé', () => assert.strictEqual(Z.confirmerRdv(RDV, '2026-11-21T12:00').ok, false));
test('conflit avec un rendez-vous confirmé qui chevauche', () => {
  const autre = { id: 'r2', statut: 'confirmé', creneau: '2026-11-21T11:00', dureeHeures: 1 };
  assert.match(Z.confirmerRdv(RDV, '2026-11-21T10:00', [autre]).raison, /déjà/);
  assert.ok(Z.confirmerRdv(RDV, '2026-11-21T10:00', [Object.assign({}, autre, { creneau: '2026-11-21T12:00' })]).ok);
});
test('annulation gratuite jusqu’à 24 h avant', () => {
  const c = { statut: 'confirmé', creneau: '2026-11-21T10:00' };
  assert.strictEqual(Z.annulationGratuite(c, '2026-11-20T10:00'), true); assert.strictEqual(Z.annulationGratuite(c, '2026-11-20T10:01'), false);
  assert.strictEqual(Z.annulationGratuite({ statut: 'proposé' }, '2026-11-21T09:59'), true);
});
test('export calendrier .ics : début, fin, virgule échappée', () => {
  const ics = Z.versIcs(Object.assign({}, RDV, { creneau: '2026-11-21T10:00' }));
  assert.match(ics, /DTSTART;TZID=Europe\/Paris:20261121T100000/); assert.match(ics, /DTEND;TZID=Europe\/Paris:20261121T120000/); assert.match(ics, /Ponceuse\\, test/); assert.ok(ics.startsWith('BEGIN:VCALENDAR') && ics.endsWith('END:VCALENDAR'));
});
test('le rendez-vous de démonstration est une proposition valide', () => { for (const r of D.RDV_DEMO) assert.ok(Z.verifierProposition(r, M).ok, r.id); });

console.log('Offres de prix');
const AN = { id: 'z', titre: 'Test', membre: 'm1', modes: ['vente', 'location'], prixVente: 80, prixJour: 5 };
test('offre valide entre 50 % et le prix affiché', () => { assert.ok(Z.verifierOffre(AN, 'vente', 60).ok); assert.ok(Z.verifierOffre(AN, 'vente', 40).ok); assert.ok(Z.verifierOffre(AN, 'location', 2.5).ok); });
test('offre refusée : trop basse, au prix affiché, nulle, mode absent, quota', () => {
  assert.match(Z.verifierOffre(AN, 'vente', 39).raison, /trop basse/); assert.match(Z.verifierOffre(AN, 'vente', 80).raison, /inférieure/);
  assert.strictEqual(Z.verifierOffre(AN, 'vente', 0).ok, false); assert.strictEqual(Z.verifierOffre(AN, 'echange', 10).ok, false);
  assert.match(Z.verifierOffre(AN, 'vente', 60, 3).raison, /maximum/);
});
const OF = Z.creerOffre(AN, 'vente', 60, M);
test('offre créée : en attente, valable 48 h', () => { assert.strictEqual(OF.statut, 'en attente'); assert.strictEqual(OF.expire, '2026-11-21T15:10'); assert.strictEqual(OF.prixAffiche, 80); });
test('accepter : prix convenu = montant de l’offre', () => assert.strictEqual(Z.repondreOffre(OF, 'accepter', M).offre.prixFinal, 60));
test('contre-proposition bornée entre l’offre et le prix affiché', () => {
  assert.strictEqual(Z.repondreOffre(OF, 'contre', M, 60).ok, false); assert.strictEqual(Z.repondreOffre(OF, 'contre', M, 80).ok, false);
  const c = Z.repondreOffre(OF, 'contre', M, 70).offre; assert.strictEqual(c.statut, 'contre-offre');
  assert.strictEqual(Z.repondreOffre(c, 'accepter', M).offre.prixFinal, 70); assert.strictEqual(Z.repondreOffre(c, 'contre', M, 75).ok, false);
});
test('offre expirée ou déjà traitée : plus de réponse possible', () => {
  assert.match(Z.repondreOffre(OF, 'accepter', '2026-11-21T15:11').raison, /expiré/);
  assert.match(Z.repondreOffre(Z.repondreOffre(OF, 'refuser', M).offre, 'accepter', M).raison, /déjà/);
});
test('démo vendeur : accepte dès 80 % du prix, sinon contre-propose à mi-chemin', () => {
  assert.strictEqual(Z.reponseVendeurDemo(Z.creerOffre(AN, 'vente', 64, M), M).offre.statut, 'acceptée');
  assert.strictEqual(Z.reponseVendeurDemo(Z.creerOffre(AN, 'vente', 50, M), M).offre.contre, 65);
  assert.strictEqual(Z.reponseVendeurDemo(Z.creerOffre(AN, 'location', 3, M), M).offre.contre, 4);
});
test('le prix négocié s’applique à l’annonce tant que l’accord est valable', () => {
  const acc = Z.repondreOffre(OF, 'accepter', M).offre;
  const a = Z.appliquerOffres(AN, [acc], M); assert.strictEqual(a.prixVente, 60); assert.strictEqual(a.prixVenteAffiche, 80); assert.strictEqual(a.prixJour, 5); assert.strictEqual(AN.prixVente, 80);
  assert.strictEqual(Z.appliquerOffres(AN, [acc], '2026-11-22T00:00').prixVente, 80);
  assert.strictEqual(Z.devisVente(a).commission, 4.8);
});
test('les offres de démonstration sont cohérentes', () => { for (const o of D.OFFRES_DEMO) assert.ok(o.montant < o.prixAffiche && o.montant >= o.prixAffiche * Z.REGLES.offres.plancher, o.id); });

console.log('Services');
const SV = D.SERVICES[0];
test('les services de la maquette sont valides et leurs prestataires existent', () => { for (const x of D.SERVICES) { assert.ok(Z.verifierService(x).ok, x.id); assert.ok(D.MEMBRES[x.membre], x.id); assert.ok(D.METIERS.some((m) => m.id === x.metier), x.id); } });
test('métier réglementé : SIRET exigé', () => {
  const x = Object.assign({}, SV, { metier: 'electricite', siret: false });
  assert.match(Z.verifierService(x).erreurs[0], /professionnels qualifiés/); assert.ok(Z.verifierService(Object.assign({}, x, { siret: true })).ok);
  assert.strictEqual(Z.estReglemente('bricolage'), false); assert.strictEqual(Z.estReglemente('plomberie'), true);
});
test('service refusé : sans titre, sans tarif, unité ou code postal invalides', () => {
  assert.strictEqual(Z.verifierService(Object.assign({}, SV, { titre: 'ab' })).ok, false); assert.strictEqual(Z.verifierService(Object.assign({}, SV, { tarif: 0 })).ok, false);
  assert.strictEqual(Z.verifierService(Object.assign({}, SV, { unite: 'jour' })).ok, false); assert.strictEqual(Z.verifierService(Object.assign({}, SV, { cp: '9310' })).ok, false);
});
test('devis à l’heure : frais client 8 %, commission 12 %', () => {
  const d = Z.devisService(SV, 3);
  assert.deepStrictEqual([d.heures, d.base, d.fraisService, d.total, d.commission], [3, 66, 5.28, 71.28, 7.92]);
  assert.strictEqual(Z.devisService(Object.assign({}, SV, { assurePlateforme: false }), 3).versementPrestataire, 58.08);
});
test('devis : durée minimum du prestataire et 8 h au plus', () => {
  const x = Object.assign({}, SV, { dureeMin: 2 });
  assert.strictEqual(Z.devisService(x, 1).heures, 2); assert.strictEqual(Z.devisService(x, 20).heures, 8); assert.strictEqual(Z.devisService(x).heures, 2);
});
test('devis au forfait : prix fixe quelle que soit la durée demandée', () => { const f = D.SERVICES.find((x) => x.unite === 'forfait'); const d = Z.devisService(f, 5); assert.strictEqual(d.base, f.tarif); assert.strictEqual(d.heures, f.dureeForfait); assert.strictEqual(d.forfait, true); });
test('artisan abonné : aucune commission', () => { const d = Z.devisService(Object.assign({}, SV, { assurePlateforme: false }), 2, { abonne: true }); assert.strictEqual(d.commission, 0); assert.strictEqual(d.versementPrestataire, 44); });
test('recherche de services par métier, mot et lieu', () => {
  assert.ok(Z.filtrerServices(D.SERVICES, { metier: 'jardin' }).every((x) => x.metier === 'jardin')); assert.strictEqual(Z.filtrerServices(D.SERVICES, { q: 'meubles' })[0].id, 's1');
  assert.strictEqual(Z.filtrerServices(D.SERVICES, { lieu: '94' }).length, D.SERVICES.filter((x) => x.cp.startsWith('94')).length); assert.strictEqual(Z.filtrerServices(D.SERVICES, { q: 'zzz' }).length, 0);
});
test('offre de prix sur un service, puis tarif négocié appliqué au devis', () => {
  assert.ok(Z.verifierOffre(SV, 'service', 18).ok); assert.match(Z.verifierOffre(SV, 'service', 10).raison, /trop basse/); assert.strictEqual(Z.verifierOffre(SV, 'vente', 18).ok, false);
  const acc = Z.repondreOffre(Z.creerOffre(SV, 'service', 18, M), 'accepter', M).offre;
  const n = Z.appliquerOffres(SV, [acc], M); assert.strictEqual(n.tarif, 18); assert.strictEqual(n.tarifAffiche, 22); assert.strictEqual(Z.devisService(n, 2).base, 36); assert.strictEqual(SV.tarif, 22);
});
test('une prestation réservée est un rendez-vous de type « service »', () => {
  const r = { id: 'rs', type: 'service', objet: SV.titre, creneaux: ['2026-11-21T10:00'], dureeHeures: 2 };
  assert.ok(Z.verifierProposition(r, M).ok); assert.strictEqual(Z.confirmerRdv(r, '2026-11-21T10:00').rdv.statut, 'confirmé'); assert.match(Z.versIcs(Object.assign({}, r, { creneau: '2026-11-21T10:00' })), /Prestation de service/);
});

console.log('Assurance des services');
const PART = D.SERVICES.find((x) => !x.siret && !x.assurePlateforme), PRO = D.SERVICES.find((x) => x.siret), ASSURE = D.SERVICES.find((x) => x.assurePlateforme);
test('sans case cochée : aucune assurance facturée', () => { const d = Z.devisService(PART, 2); assert.strictEqual(d.assurance, 0); assert.strictEqual(d.total, Z.devisService(PART, 2, { assurance: false }).total); });
test('« Je prends l’assurance » : 6 % du prix, 2 € minimum, ajoutés au total', () => {
  const d = Z.devisService(PRO, 3, { assurance: true }); assert.strictEqual(d.assurance, 8.1); assert.strictEqual(d.total, 153.9);
  assert.strictEqual(Z.devisService(PART, 1, { assurance: true }).assurance, 2.1); assert.strictEqual(Z.devisService(Object.assign({}, PART, { tarif: 20 }), 1, { assurance: true }).assurance, 2);
});
test('particulier sans assurance : le client est averti', () => { const c = Z.devisService(PART, 1).couverture; assert.strictEqual(c.assure, false); assert.match(c.message, /non assurée/); });
test('particulier + assurance du client : prestation couverte', () => { const c = Z.devisService(PART, 1, { assurance: true }).couverture; assert.strictEqual(c.assure, true); assert.match(c.message, /votre assurance dommages/); });
test('professionnel : couvert par sa responsabilité civile professionnelle', () => assert.match(Z.devisService(PRO, 2).couverture.message, /professionnelle/));
test('prestataire assuré par ZETools : 4 % déduits de son versement, rien de plus pour le client', () => {
  const d = Z.devisService(ASSURE, 3); assert.strictEqual(d.cotisationPrestataire, 2.64); assert.strictEqual(d.versementPrestataire, 55.44); assert.strictEqual(d.total, 71.28); assert.strictEqual(d.couverture.assure, true);
});
test('l’assurance du client ne change pas le versement du prestataire', () => assert.strictEqual(Z.devisService(PART, 2, { assurance: true }).versementPrestataire, Z.devisService(PART, 2).versementPrestataire));

console.log('Fiches techniques et PDF');
const PDF = require('../pdf.js');
test('six fiches complètes : outils, étapes, sécurité', () => {
  assert.strictEqual(D.FICHES.length, 6);
  for (const f of D.FICHES) { assert.ok(f.titre && f.resume && f.niveau && f.duree && f.budget, f.id); assert.ok(f.outils.length >= 3, f.id); assert.ok(f.etapes.length >= 6, f.id); assert.ok(f.securite.length >= 3, f.id); }
});
test('chaque fiche produit un PDF valide : en-tête, fin, table des objets exacte', () => {
  for (const f of D.FICHES) {
    const pdf = PDF.fichePdf(f);
    assert.ok(pdf.startsWith('%PDF-1.4\n') && pdf.endsWith('%%EOF\n'), f.id);
    assert.ok(/^[\x00-\x7f]*$/.test(pdf), f.id + ' : le fichier doit rester en ASCII');
    const debut = Number(pdf.match(/startxref\n(\d+)\n%%EOF/)[1]); assert.strictEqual(pdf.slice(debut, debut + 4), 'xref', f.id);
    const lignes = pdf.slice(debut).split('\n'); const nb = Number(lignes[1].split(' ')[1]);
    for (let n = 1; n < nb; n++) { const pos = Number(lignes[2 + n].slice(0, 10)); assert.ok(pdf.slice(pos).startsWith(`${n} 0 obj\n`), `${f.id} objet ${n}`); }
    const pages = (pdf.match(/\/Type \/Page /g) || []).length; assert.ok(pages >= 1 && pages <= 3, f.id); assert.ok(pdf.includes(`/Count ${pages} `), f.id);
    for (const m of pdf.matchAll(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)) assert.strictEqual(m[2].length, Number(m[1]), f.id + ' longueur de flux');
  }
});
test('accents, apostrophes, euro et « œ » encodés en WinAnsi', () => {
  const pdf = PDF.fichePdf(Object.assign({}, D.FICHES[0], { titre: 'Étagère d’œuvre à 5 € (test)' }));
  assert.ok(pdf.includes('(\\311tag\\350re d\\222\\234uvre \\340 5 \\200 \\(test\\))'));
});
test('le texte long est coupé dans la largeur de la page', () => {
  const l = PDF.couper(D.FICHES[0].etapes.join(' '), 10.5, false, 495); assert.ok(l.length > 5); for (const x of l) assert.ok(PDF.largeur(x, 10.5, false) <= 495);
});
test('nom de fichier sans accent ni espace', () => assert.strictEqual(PDF.nomFichier({ titre: 'Fixer une étagère murale solide et de niveau' }), 'zetools-fiche-fixer-une-etagere-murale-solide-et-de-niveau.pdf'));
test('octets : même longueur que le fichier', () => { const pdf = PDF.fichePdf(D.FICHES[5]); assert.strictEqual(PDF.octets(pdf).length, pdf.length); });

console.log('Textes juridiques');
const JUR = require('../juridique.js');
test('les six documents existent et sont complets', () => {
  assert.deepStrictEqual(JUR.PAGES.map((p) => p.id), ['cgu', 'pros', 'mentions', 'confidentialite', 'securite', 'prix']);
  for (const p of JUR.PAGES) { assert.ok(p.sections.length >= 5, p.id); const t = p.sections.map((s) => s[1]).join(''); assert.ok(!/undefined|NaN|\$\{/.test(t), p.id); }
});
test('société : ZETools SAS, 58 rue de Ponthieu, 75008 Paris', () => { assert.strictEqual(JUR.SOCIETE.siege, '58 rue de Ponthieu, 75008 Paris'); assert.match(JUR.PAGES.find((p) => p.id === 'mentions').sections[0][1], /ZETools<\/b>, société par actions simplifiée/); });
test('les tarifs des conditions suivent les règles de la plateforme', () => {
  const cgu = JUR.PAGES.find((p) => p.id === 'cgu').sections.map((s) => s[1]).join('');
  assert.match(cgu, /Commission de 8 % du prix/); assert.match(cgu, /2,9 € par partie/); assert.match(cgu, /15 %, puis 12 % à partir de 5 locations, puis 10 % à partir de 20 locations/);
  const pros = JUR.PAGES.find((p) => p.id === 'pros').sections.map((s) => s[1]).join('');
  assert.match(pros, /39 € hors taxes par mois/); assert.match(pros, /390 € hors taxes par an/);
});

const PDFM = require('../pdf.js'); const DM = require('../donnees.js');
test('chaque étape de chaque fiche a un pictogramme connu', () => {
  for (const f of DM.FICHES) { assert.strictEqual(f.pictos.length, f.etapes.length, f.id); for (const k of f.pictos) assert.ok(PDFM.PICTOS[k], k); }
});
test('PDF : marque ZETOOLS et logo sur chaque page, pictogrammes dessinés', () => {
  for (const f of DM.FICHES) {
    const pdf = PDFM.fichePdf(f); const pages = pdf.split('/Type /Page ').length - 1;
    assert.ok(pages >= 1, f.id);
    const flux = pdf.split('stream').filter((_, i) => i % 2 === 1);
    const contenus = flux.filter((c) => /BT/.test(c));
    assert.strictEqual(contenus.length, pages, f.id);
    for (const c of contenus) { assert.match(c, /\(TOOLS\) Tj/); assert.strictEqual((c.match(/0\.96 0\.72 0 RG/g) || []).length, 2, f.id + ' : logo en tête et en pied'); }
    assert.ok(!/The Tools/i.test(pdf), f.id);
  }
});
test('logo et pictogrammes SVG valides', () => {
  assert.match(PDFM.logoSvg(), /^<svg[^>]+viewBox="0 0 100 100".*<\/svg>$/);
  for (const k of Object.keys(PDFM.PICTOS)) assert.match(PDFM.pictoSvg(k), /^<svg class="picto".*<\/svg>$/);
});

const QRM = require('../qr.js');
test('QR code : taille, carrés de repérage, versions 1 à 6', () => {
  const m = QRM.qrMatrice('ZETOOLS'); assert.strictEqual(m.length, 21);
  for (const [x, y] of [[0, 0], [14, 0], [0, 14]]) { assert.ok(m[y][x] && m[y + 6][x + 6] && m[y + 3][x + 3]); assert.ok(!m[y + 1][x + 1]); }
  assert.strictEqual(QRM.qrMatrice(DM.SITE_PUBLIC + '#/fiche-technique/f1').length, 33);
  assert.throws(() => QRM.qrMatrice('x'.repeat(107)));
});
test('chaque fiche a au moins une vidéo YouTube décrite', () => {
  for (const f of DM.FICHES) { assert.ok(f.videos.length >= 1, f.id); for (const v of f.videos) { assert.match(v.yt, /^[\w-]{11}$/); assert.ok(v.titre && v.chaine); if (v.debuts) assert.strictEqual(v.debuts.length, f.etapes.length); } }
});
test('PDF : encart vidéo avec QR code quand l’adresse est fournie', () => {
  const f = DM.FICHES[0]; const avec = PDFM.fichePdf(f, null, { url: DM.SITE_PUBLIC + '#/fiche-technique/f1' }), sans = PDFM.fichePdf(f);
  assert.match(avec, /\(La fiche en vid\\351o\) Tj/); assert.ok(!/La fiche en vid/.test(sans));
  assert.ok(avec.length > sans.length + 2000);
});

// ---------- urgence travaux ----------
test('jours fériés 2026 : Pâques, Ascension, Pentecôte', () => { const j = Z.joursFeries(2026); ['2026-04-06', '2026-05-14', '2026-05-25', '2026-07-14', '2026-12-25'].forEach((d) => assert.ok(j.includes(d), d)); });
test('majoration : jour 0 %, nuit 50 %, dimanche 50 %, non cumulées', () => {
  assert.strictEqual(Z.majorationUrgence('2026-11-19T14:00').taux, 0);
  assert.strictEqual(Z.majorationUrgence('2026-11-19T22:10').taux, 0.5);
  assert.strictEqual(Z.majorationUrgence('2026-11-19T07:59').taux, 0.5);
  assert.strictEqual(Z.majorationUrgence('2026-11-22T14:00').taux, 0.5);
  assert.strictEqual(Z.majorationUrgence('2026-11-22T23:00').taux, 0.5);
  assert.strictEqual(Z.majorationUrgence('2026-12-25T10:00').taux, 0.5);
});
test('devis urgence de nuit : 152,28 € et devis écrit obligatoire', () => {
  const a = D.ARTISANS.find((x) => x.id === 'p3'); const d = Z.devisUrgence(a, '2026-11-19T22:10', 1);
  assert.strictEqual(d.total, 152.28); assert.ok(d.devisEcritObligatoire);
  assert.strictEqual(+(d.deplacement + d.mainOeuvre + d.majoration + d.fraisService).toFixed(2), d.total);
});
test('devis urgence de jour sous 150 € : pas de devis écrit obligatoire', () => {
  const a = D.ARTISANS.find((x) => x.id === 'p3'); const d = Z.devisUrgence(a, '2026-11-19T14:00', 1);
  assert.strictEqual(d.majoration, 0); assert.ok(d.total < 150); assert.ok(!d.devisEcritObligatoire);
});
test('professionnels d’urgence : SIRET, bon métier, classés par délai, 15 km au plus', () => {
  const r = Z.artisansUrgence({ lat: 48.8475, lon: 2.4393 }, D.ARTISANS, 'plomberie');
  assert.ok(r.length >= 1); r.forEach((x) => { assert.ok(x.artisan.siret && x.artisan.urgence && x.artisan.metiers.includes('plomberie')); assert.ok(x.km <= 15); });
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].minutes <= r[i].minutes);
  assert.strictEqual(Z.artisansUrgence({ lat: 48.8475, lon: 2.4393 }, D.ARTISANS, 'jardinage').length, 0);
});
test('le gaz n’envoie aucun artisan', () => { const g = D.TYPES_URGENCE.find((t) => t.id === 'gaz'); assert.ok(g.danger); assert.ok(!g.metier); });

// ---------- bons cadeaux ----------
const aleaFixe = (() => { let i = 0; return () => ((i++ * 7919) % 31) / 31; });
test('code de bon cadeau : format, clé de contrôle, faute de frappe détectée', () => {
  for (let k = 0; k < 50; k++) { const c = Z.genererCodeCoupon(); assert.ok(/^ZT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(c), c); assert.ok(Z.verifierCodeCoupon(c)); assert.ok(Z.verifierCodeCoupon(c.toLowerCase().replace(/-/g, ' '))); }
  const c = Z.genererCodeCoupon(aleaFixe()); const n = c.split(''); n[4] = n[4] === '2' ? '3' : '2';
  assert.ok(!Z.verifierCodeCoupon(n.join(''))); assert.ok(!Z.verifierCodeCoupon('ZT-AAAA')); assert.strictEqual(Z.formaterCode('zt jz4c bfsk'), 'ZT-JZ4C-BFSK');
});
test('bon cadeau : contrôles du montant, du prénom, de l’e-mail et du message', () => {
  const ok = { montant: 50, destinataire: { prenom: 'Léa' } };
  assert.ok(Z.verifierCoupon(ok, '2026-11-19').ok);
  assert.ok(!Z.verifierCoupon({ montant: 10, destinataire: { prenom: 'Léa' } }, '2026-11-19').ok);
  assert.ok(!Z.verifierCoupon({ montant: 501, destinataire: { prenom: 'Léa' } }, '2026-11-19').ok);
  assert.ok(!Z.verifierCoupon({ montant: 50.5, destinataire: { prenom: 'Léa' } }, '2026-11-19').ok);
  assert.ok(!Z.verifierCoupon({ montant: 50, destinataire: { prenom: ' ' } }, '2026-11-19').ok);
  assert.ok(!Z.verifierCoupon({ montant: 50, destinataire: { prenom: 'Léa' }, envoi: { mode: 'email', email: 'lea@' } }, '2026-11-19').ok);
  assert.ok(!Z.verifierCoupon({ montant: 50, destinataire: { prenom: 'Léa' }, envoi: { mode: 'email', email: 'lea@exemple.fr', date: '2026-11-18' } }, '2026-11-19').ok);
  assert.ok(!Z.verifierCoupon({ montant: 50, destinataire: { prenom: 'Léa' }, message: 'x'.repeat(301) }, '2026-11-19').ok);
});
test('bon cadeau : validité 12 mois à partir de l’envoi', () => {
  const c = Z.creerCoupon({ montant: 100, destinataire: { prenom: 'Léa' }, envoi: { mode: 'email', email: 'lea@exemple.fr', date: '2026-12-24' } }, '2026-11-19');
  assert.strictEqual(c.expire, '2027-12-24'); assert.strictEqual(c.solde, 100); assert.strictEqual(c.achete, '2026-11-19');
  assert.strictEqual(Z.ajouterMois('2027-01-31', 1), '2027-02-28');
});
test('bon cadeau : utilisation partielle, puis solde épuisé, puis expiration', () => {
  let c = Z.creerCoupon({ montant: 100, destinataire: { prenom: 'Léa' } }, '2026-11-19');
  let u = Z.utiliserCoupon(c, 60.5, '2026-12-01', 'Montage');
  assert.ok(u.ok); assert.strictEqual(u.debit, 60.5); assert.strictEqual(u.resteAPayer, 0); assert.strictEqual(u.coupon.solde, 39.5);
  u = Z.utiliserCoupon(u.coupon, 104.76, '2026-12-02'); assert.strictEqual(u.debit, 39.5); assert.strictEqual(u.resteAPayer, 65.26); assert.strictEqual(u.coupon.solde, 0); assert.strictEqual(u.coupon.utilisations.length, 2);
  assert.ok(!Z.utiliserCoupon(u.coupon, 10, '2026-12-03').ok);
  assert.ok(!Z.utiliserCoupon(c, 10, '2027-11-20').ok); assert.ok(Z.utiliserCoupon(c, 10, '2027-11-19').ok);
  assert.strictEqual(c.solde, 100);
});
test('bon cadeau en PDF : page unique, code, montant et QR code', () => {
  const P = require('../pdf.js'); const c = Object.assign(Z.creerCoupon({ montant: 150, theme: 'jardin', de: 'Adam', destinataire: { prenom: 'Papa' }, message: 'Bonne fête !' }, '2026-11-19'), { themeNom: 'Jardin' });
  const url = D.SITE_PUBLIC + '#/offrir?code=' + c.code;
  const pdf = P.bonCadeauPdf(c, null, { url });
  assert.ok(pdf.startsWith('%PDF-1.4')); assert.ok(pdf.trim().endsWith('%%EOF')); assert.ok(pdf.includes('/Count 1'));
  assert.ok(pdf.includes(c.code)); assert.ok(pdf.includes('Pour Papa')); assert.ok(pdf.includes('150 \\200'));
  assert.ok(url.length <= 106); assert.ok(pdf.length > P.bonCadeauPdf(c, null, {}).length + 2000);
  assert.strictEqual(P.nomFichierCoupon(c), `ZETools-bon-cadeau-${c.code}.pdf`);
});

// ---------- vidéothèque ----------
test('vidéothèque : identifiants YouTube valides, sans doublon, thèmes connus', () => {
  const ids = D.VIDEOS_TUTOS.map((v) => v.yt).concat(...D.FICHES.map((f) => (f.videos || []).map((v) => v.yt)));
  ids.forEach((id) => assert.ok(/^[\w-]{11}$/.test(id), id)); assert.strictEqual(new Set(ids).size, ids.length);
  const th = D.THEMES_VIDEO.map((t) => t.id); D.VIDEOS_TUTOS.forEach((v) => assert.ok(th.includes(v.theme)));
  Object.values(D.THEME_FICHE).forEach((t) => assert.ok(th.includes(t)));
  D.VIDEOS_TUTOS.filter((v) => v.urgence).forEach((v) => assert.ok(D.TYPES_URGENCE.some((t) => t.id === v.urgence)));
});

test('mécanique auto / moto : au moins 10 annonces, thermique et électrique', () => {
  const m = D.ANNONCES.filter((a) => a.categorie === 'meca');
  assert.ok(m.length >= 10, m.length + ' annonces');
  assert.ok(m.some((a) => /électrique|VE|Type 2/.test(a.titre + a.description)));
  assert.ok(m.some((a) => /moto/i.test(a.titre + a.description)));
  assert.ok(!m.some((a) => a.photo.includes('1540104539488')), 'la photo de perceuse ne doit plus illustrer la mécanique');
});
test('chaque photo d’annonce mécanique est créditée', () => {
  const ids = D.CREDITS.map((c) => c[2]);
  D.ANNONCES.filter((a) => a.categorie === 'meca').forEach((a) => assert.ok(ids.some((i) => a.photo.includes(i)), a.id));
});
test('onglet Offre : route, lien d’en-tête et tarifs issus des règles', () => {
  const fs = require('fs'), path = require('path');
  const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), idx = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(app.includes("case 'offre': html = vueOffre()"));
  assert.ok(idx.includes('href="#/offre"'));
  assert.ok(app.includes('R.fraisServiceLocataire') && app.includes('R.commissionVente'));
  assert.ok(!app.includes('méritent <em>une seconde vie</em>'), 'ancien slogan retiré');
});

// ---------- Passeport outil ----------
const PJ = '2026-11-19';
const passeportSain = { misEnService: '2025-06', heures: 40, controles: [{ date: '2026-11-01', type: 'video', resultat: 'ok' }], reparations: [] };
test('passeport : un outil récent et contrôlé est « Excellent »', () => { const s = Z.scoreSante(passeportSain, PJ); assert.ok(s.score >= 90, s.score); assert.strictEqual(s.niveau, 'Excellent'); });
test('passeport : chaque point retiré est expliqué', () => {
  const s = Z.scoreSante({ misEnService: '2018-01', heures: 400, batterie: { capacite: 50, cycles: 500 }, controles: [{ date: '2026-10-01', type: 'video', resultat: 'echec' }], reparations: [] }, PJ);
  assert.strictEqual(100 + s.facteurs.reduce((t, f) => t + f.points, 0), s.score);
  assert.ok(s.facteurs.length >= 4); assert.ok(s.score < 40);
});
test('passeport : sans contrôle, 15 points en moins', () => { const s = Z.scoreSante({ misEnService: '2026-11', heures: 0, controles: [], reparations: [] }, PJ); assert.strictEqual(s.score, 85); });
test('garantie : vente, score ≥ 80 et contrôle réussi de moins de 90 jours', () => {
  const vente = { modes: ['vente'] }, loc = { modes: ['location'] };
  assert.ok(Z.garantiePasseport(passeportSain, vente, PJ).ok);
  assert.strictEqual(Z.garantiePasseport(passeportSain, loc, PJ).ok, false);
  const vieux = Object.assign({}, passeportSain, { controles: [{ date: '2026-06-01', type: 'video', resultat: 'ok' }] });
  assert.strictEqual(Z.garantiePasseport(vieux, vente, PJ).ok, false);
});
test('garantie : un contrôle ajouté rend la garantie à un outil', () => {
  const p = { misEnService: '2025-06', heures: 40, controles: [{ date: '2026-05-01', type: 'video', resultat: 'ok' }], reparations: [] };
  assert.strictEqual(Z.garantiePasseport(p, { modes: ['vente'] }, PJ).ok, false);
  assert.ok(Z.garantiePasseport(Z.ajouterControle(p, { date: PJ, type: 'acoustique', resultat: 'ok' }), { modes: ['vente'] }, PJ).ok);
  assert.throws(() => Z.ajouterControle(p, { date: PJ, resultat: 'peut-être' }));
});
test('passeports de la maquette : tous rattachés à une annonce, scores entre 0 et 100', () => {
  Object.entries(D.PASSEPORTS).forEach(([id, p]) => { assert.ok(D.ANNONCES.some((a) => a.id === id), id); const s = Z.scoreSante(p, PJ); assert.ok(s.score >= 0 && s.score <= 100); });
  assert.ok(Z.scoreSante(D.PASSEPORTS.a11, PJ).score < 40, 'la visseuse à batterie HS doit être « Fatiguée »');
});
test('batterie estimée : date gravée + charges, jamais au-dessus de 100 ni dans le futur', () => {
  assert.strictEqual(Z.estimerBatterie('2026-11', 0, PJ).capacite, 100);
  assert.ok(Z.estimerBatterie('2020-01', 600, PJ).capacite < 70);
  assert.strictEqual(Z.estimerBatterie('2027-01', 0, PJ), null);
  assert.strictEqual(Z.estimerBatterie('', 10, PJ), null);
});
test('test acoustique : sain, réserve, échec', () => {
  assert.strictEqual(Z.analyseAcoustique({ regularite: 0.95, aigus: 0.1, chocs: 0 }).resultat, 'ok');
  assert.strictEqual(Z.analyseAcoustique({ regularite: 0.95, aigus: 0.5, chocs: 0 }).resultat, 'reserve');
  assert.strictEqual(Z.analyseAcoustique({ regularite: 0.6, aigus: 0.5, chocs: 4 }).resultat, 'echec');
});

// ---------- Location-achat ----------
test('« Je le garde » : le loyer hors frais est déduit du prix de vente', () => {
  const a = D.ANNONCES.find((x) => x.id === 'a13'); // 6 €/j, vente 85 €
  const g = Z.prixSiJeLeGarde(a, { debut: '2026-11-18', fin: '2026-11-19', statut: 'confirmée' }, PJ);
  assert.ok(g.ok); assert.strictEqual(g.deduit, 12); assert.strictEqual(g.reste, 73);
});
test('« Je le garde » : refusé hors délai, outil non vendu ou location annulée', () => {
  const a = D.ANNONCES.find((x) => x.id === 'a13');
  assert.strictEqual(Z.prixSiJeLeGarde(a, { debut: '2026-11-10', fin: '2026-11-12', statut: 'confirmée' }, PJ).ok, false);
  assert.strictEqual(Z.prixSiJeLeGarde(D.ANNONCES.find((x) => x.id === 'a2'), { debut: '2026-11-18', fin: '2026-11-19', statut: 'confirmée' }, PJ).ok, false);
  assert.strictEqual(Z.prixSiJeLeGarde(a, { debut: '2026-11-18', fin: '2026-11-19', statut: 'annulée' }, PJ).ok, false);
});

// ---------- Mode Projet ----------
const optsProjet = (o) => Object.assign({ quantite: 3, cp: '94300', debut: '2026-11-28', fin: '2026-11-29', annonces: D.ANNONCES, reservations: D.RESERVATIONS, aujourdHui: PJ }, o);
test('projet : consommables arrondis au conditionnement, fixes une fois par projet', () => {
  const c = Z.consommablesProjet(D.PROJETS.find((p) => p.id === 'etageres'), 7);
  assert.deepStrictEqual(c.map((x) => x.paquets), [2, 2, 1]);
});
test('projet : un outil réservé n’est pas proposé ; on loue un autre outil libre', () => {
  const r = Z.composerProjet(D.PROJETS.find((p) => p.id === 'etageres'), optsProjet({ rayonKm: 20 }));
  assert.ok(r.ok); assert.ok(!r.outils.some((c) => c.annonce.id === 'a1' && c.mode === 'location'));
  assert.ok(r.outils.every((c) => c.mode === 'location'));
});
test('projet : un même outil couvre deux étapes sans être payé deux fois', () => {
  const r = Z.composerProjet(D.PROJETS.find((p) => p.id === 'roues'), optsProjet({ quantite: 4 }));
  assert.ok(r.lignes.some((l) => l.partage)); assert.strictEqual(r.outils.length, new Set(r.outils.map((c) => c.annonce.id)).size);
});
test('projet : achat au choix, sans caution, et total cohérent', () => {
  const r = Z.composerProjet(D.PROJETS.find((p) => p.id === 'etageres'), optsProjet({ rayonKm: 20, achats: ['a1'] }));
  const a1 = r.outils.find((c) => c.annonce.id === 'a1');
  assert.strictEqual(a1.mode, 'achat'); assert.strictEqual(a1.prix, 89);
  assert.strictEqual(r.total, Math.round((r.totalOutils + r.totalConsommables) * 100) / 100);
  assert.strictEqual(r.cautions, r.outils.filter((c) => c.mode === 'location').reduce((t, c) => t + c.annonce.caution, 0));
});
test('projet : le rayon exclut les outils trop loin et le signale', () => {
  const r = Z.composerProjet(D.PROJETS.find((p) => p.id === 'haie'), optsProjet({ quantite: 15, rayonKm: 5 }));
  assert.ok(r.manquants.length >= 1); assert.ok(r.outils.every((c) => c.km <= 5));
});
test('projet : dates passées refusées', () => { assert.strictEqual(Z.composerProjet(D.PROJETS[0], optsProjet({ debut: '2026-11-01', fin: '2026-11-02' })).ok, false); });
test('projets de la maquette : outils, fiches et services existants', () => {
  D.PROJETS.forEach((p) => {
    p.besoins.forEach((b) => b.outils.forEach((id) => assert.ok(D.ANNONCES.some((a) => a.id === id), p.id + ' ' + id)));
    if (p.fiche) assert.ok(D.FICHES.some((f) => f.id === p.fiche), p.fiche);
    if (p.service) assert.ok(D.SERVICES.some((x) => x.id === p.service), p.service);
  });
});
test('CGU : passeport, location-achat et Mode Projet', () => {
  const J = require('../juridique.js'); const cgu = J.PAGES.find((x) => x.id === 'cgu').sections.map((x) => x[0]).join('|');
  ['22-3', '22-4', '22-5'].forEach((n) => assert.ok(cgu.includes('Article ' + n), n));
});

test('charte : aucun émoji dans l’en-tête et le pied de page, filtre actif sur les vues', () => {
  const fs = require('fs'); const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  const reste = (html.match(/\p{Extended_Pictographic}/gu) || []).filter((c) => !'★©®™'.includes(c));
  assert.deepStrictEqual(reste, []);
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.ok(app.includes('vue.innerHTML = sansPictos(html)')); assert.ok(app.includes("t.textContent = sansPictos(texte)"));
});

test('vidéos : lecture dans le site, même en fichier local (relais hébergé)', () => {
  const fs = require('fs'); const path = require('path');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const relais = fs.readFileSync(path.join(__dirname, '..', 'lecteur.html'), 'utf8');
  assert.strictEqual((app.match(/youtube-nocookie\.com\/embed/g) || []).length, 1);   // une seule fabrique d'iframe
  assert.ok(app.includes("RELAIS_VIDEO = 'https://nouarideba-bit.github.io/zetools/lecteur.html'"));
  assert.ok(relais.includes('/^[A-Za-z0-9_-]{11}$/') && relais.includes('youtube-nocookie.com/embed/'));
});

console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
