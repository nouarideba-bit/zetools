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

console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
