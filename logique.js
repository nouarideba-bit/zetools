/* ZETOOLS · logique métier de la maquette phase 1 (prix, réservations, masquage).
   Fonctionne dans le navigateur (window.ZT) et sous Node (module.exports) pour les tests. */
(function (racine) {
  'use strict';

  const REGLES = {
    fraisServiceLocataire: 0.08,          // frais de service payés par le locataire
    commissionVente: 0.08,                // commission sur une vente (séquestre)
    fraisEchange: 2.9,                    // frais fixes de mise en relation d'un troc, par partie
    // commission dégressive côté propriétaire, selon le nombre de locations déjà faites
    paliersCommission: [
      { aPartirDe: 0, taux: 0.15 },
      { aPartirDe: 5, taux: 0.12 },
      { aPartirDe: 20, taux: 0.10 },
    ],
    // remise longue durée sur le tarif journalier
    remises: [
      { aPartirDe: 7, taux: 0.20 },
      { aPartirDe: 3, taux: 0.10 },
    ],
    assuranceTaux: 0.07,                  // garantie casse / vol optionnelle, en % de la location
    assuranceMin: 3,                      // € minimum
    dureeMax: 30,
    // abonnement artisan : accès à toutes les demandes de travaux, sans commission ni frais par contact
    abonnementArtisan: { mensuel: 39, annuel: 390, essaiJours: 30 },
    tailles: { petit: 'Petits travaux', moyen: 'Travaux moyens', gros: 'Gros travaux' },
  };

  const arrondi = (x) => Math.round(x * 100) / 100;
  const JOUR = 86400000;

  function versDate(d) {
    if (d instanceof Date) return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const [a, m, j] = String(d).split('-').map(Number);
    return new Date(Date.UTC(a, m - 1, j));
  }
  function versTexte(d) { return d.toISOString().slice(0, 10); }

  /** Nombre de jours facturés, bornes incluses (du 3 au 5 = 3 jours). */
  function nbJours(debut, fin) {
    return Math.round((versDate(fin) - versDate(debut)) / JOUR) + 1;
  }

  function tauxRemise(jours) {
    for (const r of REGLES.remises) if (jours >= r.aPartirDe) return r.taux;
    return 0;
  }

  function tauxCommission(locationsFaites) {
    let t = REGLES.paliersCommission[0].taux;
    for (const p of REGLES.paliersCommission) if (locationsFaites >= p.aPartirDe) t = p.taux;
    return t;
  }

  /** Décompte complet d'une location. */
  function devisLocation(outil, debut, fin, opts = {}) {
    const jours = nbJours(debut, fin);
    if (!(jours >= 1)) throw new Error('Dates invalides : la fin précède le début.');
    const brut = arrondi(outil.prixJour * jours);
    const remise = arrondi(brut * tauxRemise(jours));
    const location = arrondi(brut - remise);
    const assurance = opts.assurance === false ? 0
      : arrondi(Math.max(REGLES.assuranceMin, location * REGLES.assuranceTaux));
    const fraisService = arrondi(location * REGLES.fraisServiceLocataire);
    const totalLocataire = arrondi(location + assurance + fraisService);
    const taux = tauxCommission(opts.locationsProprietaire || 0);
    const commission = arrondi(location * taux);
    const versementProprietaire = arrondi(location - commission);
    return {
      jours, brut, remise, location, assurance, fraisService, totalLocataire,
      caution: outil.caution, // bloquée (empreinte bancaire), jamais encaissée sauf litige
      tauxCommission: taux, commission, versementProprietaire,
      margePlateforme: arrondi(commission + fraisService),
    };
  }

  function devisVente(outil) {
    const commission = arrondi(outil.prixVente * REGLES.commissionVente);
    return { prix: outil.prixVente, commission, versementVendeur: arrondi(outil.prixVente - commission) };
  }

  /** Vérifie qu'une période est réservable. Renvoie { ok, raison }. */
  function verifierDisponibilite(outil, reservations, debut, fin, aujourdHui) {
    if (!debut || !fin) return { ok: false, raison: 'Choisissez une date de début et de fin.' };
    const d = versDate(debut), f = versDate(fin);
    if (isNaN(d) || isNaN(f)) return { ok: false, raison: 'Dates invalides.' };
    if (f < d) return { ok: false, raison: 'La date de fin précède la date de début.' };
    if (aujourdHui && d < versDate(aujourdHui)) return { ok: false, raison: 'La date de début est passée.' };
    if (nbJours(debut, fin) > REGLES.dureeMax) return { ok: false, raison: `Location limitée à ${REGLES.dureeMax} jours.` };
    for (const r of reservations) {
      if (r.outilId !== outil.id || r.statut === 'annulée') continue;
      const rd = versDate(r.debut), rf = versDate(r.fin);
      if (d <= rf && rd <= f) {
        return { ok: false, raison: `Déjà réservé du ${formatDate(r.debut)} au ${formatDate(r.fin)}.` };
      }
    }
    for (const b of (outil.indispo || [])) {
      if (d <= versDate(b.fin) && versDate(b.debut) <= f) return { ok: false, raison: 'Le propriétaire a bloqué ces dates.' };
    }
    return { ok: true };
  }

  /** Jours occupés d'un outil (texte AAAA-MM-JJ) pour colorer le calendrier. */
  function joursOccupes(outil, reservations) {
    const res = new Set();
    const ajouter = (a, b) => {
      for (let t = versDate(a).getTime(); t <= versDate(b).getTime(); t += JOUR) res.add(versTexte(new Date(t)));
    };
    reservations.filter((r) => r.outilId === outil.id && r.statut !== 'annulée').forEach((r) => ajouter(r.debut, r.fin));
    (outil.indispo || []).forEach((b) => ajouter(b.debut, b.fin));
    return res;
  }

  /* --- Masquage des coordonnées dans la messagerie (anti-contournement) --- */
  const MASQUE = '[coordonnées masquées · visibles après la transaction]';
  const MOTIFS = [
    // e-mails, y compris « arobase » / « (at) » et « point » écrits en toutes lettres
    /[\w.+-]+\s*(?:@|\(at\)|\[at\]|\barobase\b)\s*[\w-]+\s*(?:\.|\bpoint\b)\s*[a-z]{2,}/gi,
    // IBAN (FR76 ...)
    /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g,
    // téléphones : +33 6 12 34 56 78, 0033..., 06 12 34 56 78, 06.12.34.56.78, 0612345678
    /(?:\+|\b00)\s*33\s*\(?0?\)?\s*[1-9](?:[\s.-]*\d{2}){4}/g,
    /\b0[1-9](?:[\s.-]*\d{2}){4}\b/g,
    // suite de 9 chiffres ou plus, même séparés (tentative de contournement)
    /\b\d(?:[\s.-]?\d){8,}\b/g,
    // numéros écrits en lettres : « zéro six douze ... »
    /\bz[ée]ro\s+(?:un|deux|trois|quatre|cinq|six|sept|huit|neuf)\b[^.!?\n]*/gi,
    // adresses postales : « 12 rue ... », « 3 bis avenue ... »
    /\b\d{1,4}\s*(?:bis|ter)?\s*,?\s*(?:rue|avenue|av\.|boulevard|bd|chemin|allée|impasse|place|route|quai|cours)\s+[A-Za-zÀ-ÿ'’ -]{2,40}/gi,
    // liens et messageries externes
    /\b(?:https?:\/\/|www\.)\S+/gi,
    /\b(?:whatsapp|whats app|telegram|signal|messenger|snapchat|instagram|insta)\b[^.!?\n]*/gi,
  ];

  /** Renvoie { texte, masque } : le texte avec les coordonnées remplacées. */
  function masquerCoordonnees(texte, transactionConfirmee) {
    if (transactionConfirmee) return { texte, masque: false };
    let sortie = texte, masque = false;
    for (const m of MOTIFS) {
      sortie = sortie.replace(m, () => { masque = true; return MASQUE; });
    }
    return { texte: sortie, masque };
  }

  /** Recherche et filtres du catalogue. */
  function filtrer(annonces, f = {}) {
    const q = (f.q || '').trim().toLowerCase();
    return annonces.filter((a) => {
      if (f.mode && !a.modes.includes(f.mode)) return false;
      if (f.categorie && a.categorie !== f.categorie) return false;
      if (f.lieu) {
        const l = f.lieu.trim().toLowerCase();
        if (l && !(a.ville.toLowerCase().includes(l) || a.cp.startsWith(l))) return false;
      }
      if (q) {
        const texte = `${a.titre} ${a.marque} ${a.description} ${a.ville} ${a.cp}`.toLowerCase();
        if (!q.split(/\s+/).every((mot) => texte.includes(mot))) return false;
      }
      return true;
    });
  }

  /* --- Géolocalisation et mise en relation avec les artisans (petits travaux) --- */
  // Centres approximatifs de communes d'Île-de-France (zone pilote), puis repli par département.
  const COMMUNES = {
    '75011': ['Paris 11e', 48.8590, 2.3800], '75015': ['Paris 15e', 48.8417, 2.2999], '75018': ['Paris 18e', 48.8925, 2.3444],
    '75020': ['Paris 20e', 48.8634, 2.3984], '93100': ['Montreuil', 48.8638, 2.4485], '94300': ['Vincennes', 48.8474, 2.4392],
    '92100': ['Boulogne-Billancourt', 48.8397, 2.2399], '94100': ['Saint-Maur-des-Fossés', 48.7994, 2.4997],
    '94130': ['Nogent-sur-Marne', 48.8370, 2.4827], '93200': ['Saint-Denis', 48.9362, 2.3574], '92200': ['Neuilly-sur-Seine', 48.8846, 2.2697],
    '94200': ['Ivry-sur-Seine', 48.8131, 2.3847], '92130': ['Issy-les-Moulineaux', 48.8245, 2.2738], '93300': ['Aubervilliers', 48.9146, 2.3821],
    '94000': ['Créteil', 48.7904, 2.4556], '92000': ['Nanterre', 48.8924, 2.2071], '78000': ['Versailles', 48.8049, 2.1204],
    '91300': ['Massy', 48.7309, 2.2713], '95100': ['Argenteuil', 48.9472, 2.2467], '93160': ['Noisy-le-Grand', 48.8486, 2.5528],
    '94400': ['Vitry-sur-Seine', 48.7875, 2.3928], '77420': ['Champs-sur-Marne', 48.8526, 2.6024],
  };
  const DEPARTEMENTS = {
    '75': ['Paris', 48.8566, 2.3522], '92': ['Hauts-de-Seine', 48.8500, 2.2400], '93': ['Seine-Saint-Denis', 48.9100, 2.4800],
    '94': ['Val-de-Marne', 48.7800, 2.4700], '77': ['Seine-et-Marne', 48.6000, 2.9000], '78': ['Yvelines', 48.8000, 1.9800],
    '91': ['Essonne', 48.6000, 2.2500], '95': ['Val-d’Oise', 49.0500, 2.1000],
  };

  /** Position approximative d'un code postal d'Île-de-France, ou null hors zone. */
  function positionCodePostal(cp) {
    const c = String(cp || '').trim();
    if (!/^\d{5}$/.test(c)) return null;
    const v = COMMUNES[c] || DEPARTEMENTS[c.slice(0, 2)];
    if (!v) return null;
    return { lat: v[1], lon: v[2], libelle: v[0], precision: COMMUNES[c] ? 'commune' : 'département' };
  }

  /** Distance à vol d'oiseau en km (formule de haversine). */
  function distanceKm(a, b) {
    const R = 6371, rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /** Position floutée (~1 km) : seule montrée aux autres membres avant acceptation du devis. */
  function positionApprochee(p) {
    return { lat: Math.round(p.lat * 100) / 100, lon: Math.round(p.lon * 100) / 100 };
  }

  function formatDistance(km) {
    if (km < 1) return 'moins de 1 km';
    return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
  }

  /** Artisans qui peuvent intervenir chez le client : dans le rayon de recherche du client
      ET dans leur propre rayon d'intervention, triés du plus proche au plus loin. */
  function artisansProches(client, artisans, opts = {}) {
    const rayon = opts.rayonKm || 10;
    return artisans
      .filter((a) => !opts.metier || a.metiers.includes(opts.metier))
      .map((a) => ({ artisan: a, km: distanceKm(client, a) }))
      .filter((x) => x.km <= rayon && x.km <= x.artisan.rayonKm)
      .sort((x, y) => x.km - y.km || y.artisan.note - x.artisan.note);
  }

  /** Demandes visibles par un artisan : dans son rayon, de ses métiers, encore ouvertes. */
  function demandesPourArtisan(artisan, demandes) {
    return demandes
      .filter((d) => d.statut === 'ouverte' && artisan.metiers.includes(d.metier))
      .map((d) => ({ demande: d, km: distanceKm(artisan, d) }))
      .filter((x) => x.km <= artisan.rayonKm)
      .sort((x, y) => x.km - y.km);
  }

  /* --- Abonnement artisan : un forfait mensuel, accès illimité aux demandes, aucune commission --- */
  function abonnementActif(artisan, aujourdHui) {
    const ab = artisan.abonnement;
    if (!ab || !ab.finPeriode) return false;
    return versDate(ab.finPeriode) >= versDate(aujourdHui);
  }

  /** Prix d'un abonnement selon la périodicité, avec l'économie sur un an. */
  function coutAbonnement(periodicite) {
    const f = REGLES.abonnementArtisan;
    if (periodicite === 'annuel') {
      return { prix: f.annuel, periode: 'an', parMois: arrondi(f.annuel / 12), economieAn: arrondi(f.mensuel * 12 - f.annuel) };
    }
    return { prix: f.mensuel, periode: 'mois', parMois: f.mensuel, economieAn: 0 };
  }

  /** Un artisan peut-il répondre à une demande ? Renvoie { ok, raison }. */
  function peutRepondre(artisan, demande, aujourdHui) {
    if (!abonnementActif(artisan, aujourdHui)) return { ok: false, raison: 'Abonnement artisan requis pour répondre aux clients.' };
    if (demande.statut !== 'ouverte') return { ok: false, raison: 'Cette demande n’est plus ouverte.' };
    if (!artisan.metiers.includes(demande.metier)) return { ok: false, raison: 'Ce métier ne figure pas sur votre profil.' };
    if (distanceKm(artisan, demande) > artisan.rayonKm) return { ok: false, raison: 'Chantier hors de votre zone d’intervention.' };
    if (demande.taille === 'gros' && !artisan.decennale) return { ok: false, raison: 'Les gros travaux exigent une assurance décennale vérifiée.' };
    if ((demande.reponses || []).some((r) => r.artisanId === artisan.id)) return { ok: false, raison: 'Vous avez déjà répondu à cette demande.' };
    return { ok: true };
  }

  function formatDate(t) {
    const [a, m, j] = String(t).split('-');
    return `${j}/${m}/${a}`;
  }
  function euros(x) {
    return Number(x).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  const ZT = {
    REGLES, MASQUE, nbJours, tauxRemise, tauxCommission, devisLocation, devisVente,
    verifierDisponibilite, joursOccupes, masquerCoordonnees, filtrer, formatDate, euros, versTexte, versDate,
    positionCodePostal, distanceKm, positionApprochee, formatDistance, artisansProches, demandesPourArtisan, abonnementActif, coutAbonnement, peutRepondre,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = ZT;
  else racine.ZT = ZT;
})(typeof window !== 'undefined' ? window : globalThis);
