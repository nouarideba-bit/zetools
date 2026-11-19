/* ZETOOLS · application de la maquette (routeur par #, vues, état local). */
(function () {
  'use strict';
  const { PHOTOS, VIDEOS, CATEGORIES, MEMBRES, ANNONCES, RESERVATIONS, ARTICLES, CREDITS, SERVICES } = window.ZT_DONNEES;
  const Z = window.ZT;
  const AUJOURDHUI = Z.versTexte(Z.versDate(new Date()));
  const vue = document.getElementById('vue');

  /* ---------- état persistant (navigateur seulement) ---------- */
  const CLE = 'zetools-maquette-v1';
  const ETAT_INITIAL = () => ({
    reservations: [],
    favoris: [],
    annonces: [],
    lots: [], stocks: {}, retraits: [], enseigne: null, services: [], coupons: [], urgences: [],
    rdv: window.ZT_DONNEES.RDV_DEMO.map((r) => Object.assign({}, r)),
    offres: window.ZT_DONNEES.OFFRES_DEMO.map((o) => Object.assign({}, o)),
    conversations: [
      { id: 'c1', annonceId: 'a2', avec: 'm2', confirmee: false, messages: [
        { de: 'moi', texte: 'Bonjour, le perforateur est-il disponible le week-end du 13 décembre ?' },
        { de: 'eux', texte: 'Bonjour ! Oui, il est libre. Réservez directement sur la fiche, la caution est bloquée sur votre carte.' },
      ] },
      { id: 'c2', annonceId: 'a3', avec: 'm3', confirmee: false, messages: [
        { de: 'eux', texte: 'Votre ponceuse m’intéresse pour l’échange contre ma visseuse à chocs. Elle a beaucoup servi ?' },
      ] },
    ],
  });
  function charger() {
    try { const t = localStorage.getItem(CLE); if (t) return Object.assign(ETAT_INITIAL(), JSON.parse(t)); } catch (e) { /* stockage indisponible */ }
    return ETAT_INITIAL();
  }
  let etat = charger();
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* ignoré */ } }

  const toutesAnnonces = () => ANNONCES.concat(etat.annonces);
  const toutesReservations = () => RESERVATIONS.concat(etat.reservations);
  const tousServices = () => SERVICES.concat(etat.services);
  const service = (id) => tousServices().find((x) => x.id === id);
  // une conversation peut porter sur un outil ou sur un service
  const annonce = (id) => toutesAnnonces().find((a) => a.id === id) || service(id);
  const membre = (id) => MEMBRES[id] || { id: 'moi', nom: 'Vous', ville: 'Paris', note: 5, avis: 0, verifie: true, pro: false, locations: 0 };

  /* ---------- utilitaires ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const catNom = (id) => (CATEGORIES.find((c) => c.id === id) || {}).nom || '';
  const initiales = (nom) => nom.split(/\s+/).map((m) => m[0]).join('').slice(0, 2).toUpperCase();
  function toast(texte) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = texte;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3800);
  }
  function badges(a) {
    const b = [];
    if (a.modes.includes('vente')) b.push(`<span class="badge badge-vente">Vente ${Z.euros(a.prixVente)}</span>`);
    if (a.modes.includes('location')) b.push(`<span class="badge badge-location">Location ${Z.euros(a.prixJour)}/j</span>`);
    if (a.modes.includes('echange')) b.push('<span class="badge badge-echange">Échange</span>');
    return b.join('');
  }
  function prixPrincipal(a) {
    if (a.modes.includes('location')) return `${Z.euros(a.prixJour)} <small>/ jour</small>`;
    if (a.modes.includes('vente')) return Z.euros(a.prixVente);
    return '<small>Troc · contre</small> ' + esc(a.echangeContre || 'à proposer');
  }
  // « −60 % vs neuf » : l'occasion reste toujours bien en dessous du prix magasin
  function ligneNeuf(a) {
    if (!a.prixNeuf) return '';
    const r = a.modes.includes('vente') ? Z.remiseSurNeuf(a.prixVente, a.prixNeuf) : 0;
    return `<div class="neuf">${r ? `<span class="remise">−${r} %</span> ` : ''}Neuf : <s>${Z.euros(a.prixNeuf)}</s></div>`;
  }
  function carte(a) {
    const m = membre(a.membre); const fav = etat.favoris.includes(a.id);
    return `<a class="carte" href="#/annonce/${a.id}">
      <div class="visuel">${a.photo ? `<img loading="lazy" src="${a.photo}" alt="${esc(a.titre)}">` : ''}
        <div class="badges">${badges(a)}</div>
        <button class="coeur" data-fav="${a.id}" aria-label="Ajouter aux favoris">${fav ? '❤️' : '♡'}</button></div>
      <div class="infos"><span class="badge badge-etat" style="align-self:start">${esc(a.etat)}</span>
        <h3>${esc(a.titre)}</h3><div class="prix">${prixPrincipal(a)}</div>${ligneNeuf(a)}
        <div class="meta"><span>📍 ${esc(a.ville)}</span><span>★ ${m.note.toFixed(1)} (${m.avis})</span></div></div></a>`;
  }
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fav]');
    if (!f) return;
    e.preventDefault(); e.stopPropagation();
    const id = f.dataset.fav;
    etat.favoris = etat.favoris.includes(id) ? etat.favoris.filter((x) => x !== id) : etat.favoris.concat(id);
    sauver(); f.textContent = etat.favoris.includes(id) ? '❤️' : '♡';
    toast(etat.favoris.includes(id) ? 'Ajouté à vos favoris' : 'Retiré de vos favoris');
  });

  /* ---------- vues ---------- */

  /* ---------- vidéos ---------- */
  // Vidéo de fond : muette, en boucle, jamais bloquante (l'affiche reste visible si la vidéo ne charge pas)
  function videoFond(v, qualite) {
    if (!v) return '';
    return `<video class="video-fond" data-auto muted loop playsinline preload="none" poster="${v.poster}" aria-hidden="true" tabindex="-1"><source src="${qualite === 'sd' ? v.sd : v.hd}" type="video/mp4"></video>`;
  }
  // Lance les vidéos visibles, met en pause les autres ; rien ne bouge si l'utilisateur limite les animations
  let observateurVideos = null;
  function activerVideos() {
    const videos = document.querySelectorAll('video[data-auto]');
    if (!videos.length) return;
    const calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calme) return;
    const lire = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    if (!('IntersectionObserver' in window)) { videos.forEach(lire); return; }
    if (observateurVideos) observateurVideos.disconnect();
    observateurVideos = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => { if (e.isIntersecting) lire(e.target); else e.target.pause(); });
    }, { threshold: 0.25 });
    videos.forEach((v) => observateurVideos.observe(v));
  }

  function vueAccueil() {
    const une = toutesAnnonces().slice(0, 8);
    return `
    <section class="hero hero-video" style="background-image:url('${PHOTOS.hero}')">
      ${videoFond(VIDEOS.accueil)}
      <div class="conteneur">
        <h1>Vos outils méritent <em>une seconde vie</em>. Les vôtres aussi.</h1>
        <p class="sous">Achetez à prix réduit, louez à deux rues de chez vous ou troquez ce qui dort au garage. Paiement sécurisé, caution protégée, profils vérifiés.</p>
        <div class="onglets-mode" id="onglets-hero">
          <button data-mode="" class="actif">Tout</button><button data-mode="vente">Acheter</button><button data-mode="location">Louer</button><button data-mode="echange">Échanger</button>
        </div>
        <form class="moteur" id="moteur">
          <input name="q" placeholder="Perforateur, tondeuse, Makita…" aria-label="Quel outil ?">
          <select name="cat" aria-label="Catégorie"><option value="">Toutes catégories</option>${CATEGORIES.map((c) => `<option value="${c.id}">${c.nom}</option>`).join('')}</select>
          <input name="lieu" placeholder="Ville ou code postal" aria-label="Localisation">
          <button class="btn btn-cta" type="submit">Rechercher</button>
        </form>
        <div class="chiffres-hero"><div><b>×10</b>un outil prêté sert dix fois plus</div><div><b>-70 %</b>louer plutôt qu’acheter pour 2 jours</div><div><b>Île-de-France</b>zone pilote 2027</div></div>
      </div>
    </section>

    <section class="bloc"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Trois façons d’utiliser ZETOOLS</div><h2>Achetez, louez ou échangez</h2></div></div>
      <div class="modes">
        <div class="mode"><img src="${PHOTOS.vente}" alt="Perceuse-visseuse sur un établi"><div class="corps"><h3>Acheter / Vendre</h3><p>Équipez-vous à prix réduit avec du matériel contrôlé, ou rentabilisez les outils qui dorment dans votre cave. Paiement bloqué jusqu’à la remise.</p><a class="lien" href="#/annonces?mode=vente">Voir les outils à vendre →</a></div></div>
        <div class="mode"><img src="${PHOTOS.location}" alt="Taille d’une haie avec des gants de travail"><div class="corps"><h3>Louer entre voisins</h3><p>Besoin d’un perforateur pour un week-end ? Louez-le à côté de chez vous, à la journée, avec caution et assurance casse en option.</p><a class="lien" href="#/annonces?mode=location">Louer près de chez moi →</a></div></div>
        <div class="mode"><img src="${PHOTOS.echange}" alt="Brouette dans un jardin"><div class="corps"><h3>Échanger / Troquer</h3><p>Échangez un outil dont vous n’avez plus l’usage contre celui qu’il vous faut. Sans argent, avec la même protection.</p><a class="lien" href="#/annonces?mode=echange">Proposer un échange →</a></div></div>
      </div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Catégories</div><h2>Trouvez le bon matériel</h2></div></div>
      <div class="categories categories-video">${CATEGORIES.map((c) => `<a class="categorie categorie-video" href="#/annonces?cat=${c.id}" title="${esc(VIDEOS.categories[c.id] ? VIDEOS.categories[c.id].titre : c.nom)}">${videoFond(VIDEOS.categories[c.id], 'sd')}<span class="etiquette"><span class="ico">${c.icone}</span>${c.nom}</span></a>`).join('')}</div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">À la une</div><h2>Annonces près de chez vous</h2><p>Sélection en Île-de-France, mise à jour en continu.</p></div><a class="btn btn-contour" href="#/annonces">Toutes les annonces</a></div>
      <div class="grille">${une.map(carte).join('')}</div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Services</div><h2>Quelqu’un pour le faire à votre place</h2><p>Montage, fixations, jardinage, cours de bricolage : réservez un voisin ou un professionnel, à l’heure ou au forfait.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-contour" href="#/services">Tous les services</a><a class="btn btn-cta" href="#/proposer-service">Proposer mes services</a></div></div>
      <div class="grille">${tousServices().slice(0, 4).map(carteService).join('')}</div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="trois-espaces">
        <a class="espace-tuile tuile-urgence" href="#/urgence"><span class="ico">🚨</span><b>Urgence travaux</b><span>Fuite, panne, porte claquée : un pro vérifié, son délai et son prix ferme avant le déplacement.</span><em>Trouver un pro maintenant →</em></a>
        <a class="espace-tuile tuile-videos" href="#/videos"><span class="ico">🎬</span><b>Vidéothèque</b><span>Des tutoriels à regarder ici même : montage, perçage, peinture, outils, jardin.</span><em>Regarder les vidéos →</em></a>
        <a class="espace-tuile tuile-cadeau" href="#/offrir"><span class="ico">🎁</span><b>Offrir des travaux</b><span>Un bon cadeau de 20 à 500 € pour un parent, un enfant, un ami, un collègue.</span><em>Offrir un bon cadeau →</em></a>
      </div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Fiches techniques</div><h2>Apprenez à le faire vous-même</h2><p>Des pas-à-pas gratuits, à télécharger en PDF : montage de meuble, étagère, perçage, peinture, entretien.</p></div><a class="btn btn-contour" href="#/fiches">Toutes les fiches</a></div>
      <div class="grille">${window.ZT_DONNEES.FICHES.slice(0, 4).map(carteFiche).join('')}</div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Déstockage des enseignes</div><h2>Du neuf à prix cassés, retiré en magasin</h2><p>Fins de série et surstocks des grandes surfaces de bricolage, négoces, fabricants et loueurs.</p></div><a class="btn btn-contour" href="#/destockage">Voir tout le déstockage</a></div>
      <div class="grille">${lotsActifs().slice(0, 4).map(carteLot).join('')}</div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Travaux et réparation</div><h2>Vous avez l’outil, il vous manque la main ?</h2><p>Des artisans géolocalisés près de chez vous, et des réparateurs pour les outils en panne.</p></div></div>
      <div class="modes">
        <div class="mode"><img src="${PHOTOS.artisans}" alt="Artisan au travail"><div class="corps"><h3>📍 Trouver un artisan</h3><p>Petits, moyens ou gros travaux : publiez votre demande gratuitement, les artisans abonnés de votre secteur vous répondent, classés par distance.</p><a class="lien" href="#/travaux">Voir les artisans autour de moi →</a></div></div>
        <div class="mode"><img src="${PHOTOS.atelier}" alt="Établi d’atelier"><div class="corps"><h3>🪛 Outils à réparer</h3><p>Faites réparer un outil en panne près de chez vous, ou vendez-le pour pièces plutôt que de le jeter.</p><a class="lien" href="#/reparer">Donner une seconde vie →</a></div></div>
        <div class="mode"><div class="corps"><h3>🧑‍🔧 Vous êtes artisan ?</h3><p><b>39 € par mois</b>, sans commission ni coût par contact : accédez à toutes les demandes de travaux de votre zone. 30 jours d’essai.</p><a class="btn btn-cta" href="#/espace-artisan">Ouvrir mon espace artisan</a></div></div>
      </div>
    </div></section>

    ${blocReassurance()}

    <section class="bloc"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Comment ça marche</div><h2>Une location en quatre étapes</h2></div></div>
      <div class="etapes">
        <div class="etape"><h3>Je choisis mes dates</h3><p>Le calendrier de l’outil montre en direct les jours libres.</p></div>
        <div class="etape"><h3>Je paie sur ZETOOLS</h3><p>Le loyer est bloqué, la caution n’est qu’une empreinte bancaire.</p></div>
        <div class="etape"><h3>Je récupère l’outil</h3><p>Coordonnées dévoilées après paiement, photos d’état à la remise.</p></div>
        <div class="etape"><h3>Je rends, on se note</h3><p>Le propriétaire est payé, la caution est libérée, chacun laisse un avis.</p></div>
      </div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="bandeau-pro"><div class="texte"><div class="surtitre" style="color:#cfe6d5">Professionnels</div><h2>Loueurs, artisans, jardiniers : rejoignez la phase pilote</h2><p>Publiez votre parc, gérez vos disponibilités et soyez trouvé par les particuliers de votre secteur. Commission dégressive, sans engagement.</p><a class="btn btn-cta" href="#/pros">Découvrir les offres pro</a></div>
      <img src="${PHOTOS.atelier}" alt="Outils d’atelier anciens"></div>
    </div></section>

    <section class="bloc" style="padding-top:0"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">L’Atelier</div><h2>Le guide du bon bricoleur</h2></div><a class="btn btn-contour" href="#/atelier">Tous les articles</a></div>
      ${grilleArticles()}
    </div></section>`;
  }

  function blocReassurance() {
    return `<section class="bloc reassurance"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Confiance et sécurité</div><h2>Protégé du premier message au retour de l’outil</h2><p>Ces protections ne valent que pour les transactions réglées sur ZETOOLS.</p></div></div>
      <div class="garanties">
        <div class="garantie"><div class="ico">🔒</div><h3>Paiement sécurisé</h3><p>Fonds en séquestre chez un prestataire agréé, versés au vendeur après confirmation de la remise.</p></div>
        <div class="garantie"><div class="ico">💳</div><h3>Caution protégée</h3><p>Simple empreinte bancaire pendant la location, libérée au retour de l’outil en bon état.</p></div>
        <div class="garantie"><div class="ico">✅</div><h3>Profils vérifiés</h3><p>Identité, téléphone et, pour les pros, numéro SIRET contrôlés avant la première annonce payante.</p></div>
        <div class="garantie"><div class="ico">⭐</div><h3>Avis communautaires</h3><p>Seuls les membres ayant réellement loué, acheté ou échangé peuvent laisser un avis.</p></div>
        <div class="garantie"><div class="ico">🛡️</div><h3>Assurance casse</h3><p>Option casse et vol pendant la location, à partir de 3 € par réservation.</p></div>
      </div></div></section>`;
  }

  function grilleArticles() {
    return `<div class="articles">${ARTICLES.map((a) => `<article class="article"><img loading="lazy" src="${a.photo}" alt=""><div class="corps"><small class="surtitre">${a.duree} de lecture</small><h3>${esc(a.titre)}</h3><p>${esc(a.chapo)}</p></div></article>`).join('')}</div>`;
  }

  function vueAnnonces(params) {
    const f = { mode: params.get('mode') || '', categorie: params.get('cat') || '', q: params.get('q') || '', lieu: params.get('lieu') || '' };
    const res = Z.filtrer(toutesAnnonces(), f);
    const titre = f.mode === 'vente' ? 'Outils à vendre' : f.mode === 'location' ? 'Outils à louer' : f.mode === 'echange' ? 'Outils à échanger' : 'Toutes les annonces';
    return `<div class="page"><div class="conteneur">
      <div class="fil"><a href="#/">Accueil</a> › ${titre}</div>
      ${f.categorie && VIDEOS.categories[f.categorie] ? (() => { const c = CATEGORIES.find((x) => x.id === f.categorie); const v = VIDEOS.categories[f.categorie]; return `<div class="bandeau-video">${videoFond(v)}<div class="texte"><div class="surtitre">${c.icone} Catégorie</div><h2>${esc(c.nom)}</h2><p>${esc(v.titre)}</p></div></div>`; })() : ''}
      <div class="mise-en-page">
        <form class="filtres" id="filtres">
          <label>Recherche<input name="q" value="${esc(f.q)}" placeholder="Outil, marque…"></label>
          <label>Transaction<select name="mode"><option value="">Toutes</option><option value="vente" ${f.mode === 'vente' ? 'selected' : ''}>Vente</option><option value="location" ${f.mode === 'location' ? 'selected' : ''}>Location</option><option value="echange" ${f.mode === 'echange' ? 'selected' : ''}>Échange</option></select></label>
          <label>Catégorie<select name="cat"><option value="">Toutes</option>${CATEGORIES.map((c) => `<option value="${c.id}" ${f.categorie === c.id ? 'selected' : ''}>${c.nom}</option>`).join('')}</select></label>
          <label>Ville ou code postal<input name="lieu" value="${esc(f.lieu)}" placeholder="94300"></label>
          <button class="btn btn-cta" type="submit">Filtrer</button>
          <a href="#/annonces" style="font-size:.9rem;text-align:center">Effacer les filtres</a>
        </form>
        <div>
          <div class="titre-section"><div><h2>${titre}</h2><p>${res.length} annonce${res.length > 1 ? 's' : ''} en Île-de-France</p></div></div>
          ${res.length ? `<div class="grille">${res.map(carte).join('')}</div>` : '<div class="vide">Aucun outil ne correspond. Élargissez la zone ou <a href="#/deposer">publiez une demande</a>.</div>'}
        </div>
      </div></div></div>`;
  }

  /* --- fiche outil : réservation, achat, échange --- */
  // l'assurance n'est jamais cochée d'avance : une option payante exige un choix exprès du client
  let selection = { debut: null, fin: null, mois: null, onglet: null, assurance: false };
  function vueFiche(id) {
    const a = Z.appliquerOffres(annonce(id), etat.offres, maintenant());
    if (!a) return '<div class="page"><div class="conteneur vide">Annonce introuvable. <a href="#/annonces">Retour aux annonces</a></div></div>';
    const m = membre(a.membre);
    if (selection.id !== id) selection = { id, debut: null, fin: null, mois: AUJOURDHUI.slice(0, 7), onglet: a.modes[0], assurance: false };
    return `<div class="page"><div class="conteneur">
      <div class="fil"><a href="#/">Accueil</a> › <a href="#/annonces?cat=${a.categorie}">${catNom(a.categorie)}</a> › ${esc(a.titre)}</div>
      <div class="fiche">
        <div>
          <div class="photo-principale">${a.photo ? `<img src="${a.photo.replace('w=900', 'w=1400')}" alt="${esc(a.titre)}">` : ''}</div>
          <div class="panneau" style="margin-top:16px">
            <h2 style="margin-top:0">Description</h2><p>${esc(a.description)}</p>
            <div class="ligne"><span>Marque</span><b>${esc(a.marque)}</b></div>
            <div class="ligne"><span>État</span><b>${esc(a.etat)}</b></div>
            ${a.prixNeuf ? `<div class="ligne"><span>Prix neuf de référence</span><b>${Z.euros(a.prixNeuf)}${a.modes.includes('vente') && Z.remiseSurNeuf(a.prixVente, a.prixNeuf) ? ` · vente à −${Z.remiseSurNeuf(a.prixVente, a.prixNeuf)} %` : ''}</b></div>` : ''}
            <div class="ligne"><span>Catégorie</span><b>${catNom(a.categorie)}</b></div>
            ${a.echangeContre ? `<div class="ligne"><span>Échange recherché</span><b>${esc(a.echangeContre)}</b></div>` : ''}
            <div class="ligne"><span>Remise</span><b>📍 ${esc(a.ville)} (${esc(a.cp)}) · adresse exacte après paiement</b></div>
          </div>
        </div>
        <div>
          <div class="panneau">
            <div class="badges" style="display:flex;gap:6px;flex-wrap:wrap">${badges(a)}<span class="badge badge-etat">${esc(a.etat)}</span></div>
            <h1>${esc(a.titre)}</h1>
            <div class="vendeur" style="margin-top:12px"><div class="avatar">${initiales(m.nom)}</div><div><b>${esc(m.nom)}</b>${m.pro ? ' <span class="badge badge-vente">PRO</span>' : ''}<br><span class="verifie">✔ Profil vérifié</span> · ★ ${m.note.toFixed(1)} (${m.avis} avis) · ${m.locations} transactions</div></div>
            <div class="onglets" id="onglets-fiche">${a.modes.map((md) => `<button data-onglet="${md}" class="${selection.onglet === md ? 'actif' : ''}">${{ vente: 'Acheter', location: 'Louer', echange: 'Échanger' }[md]}</button>`).join('')}</div>
            <div id="zone-transaction">${zoneTransaction(a)}</div>
          </div>
          <div class="panneau"><b>💬 Une question ?</b><p style="margin:6px 0 10px;color:var(--texte-doux)">Écrivez au propriétaire. Téléphone, e-mail et adresse sont masqués jusqu’à la transaction : c’est ce qui vous protège.</p><a class="btn btn-contour" href="#/messages?annonce=${a.id}">Contacter ${esc(m.nom)}</a></div>
        </div>
      </div></div></div>`;
  }

  // « Proposer mon prix » : offre en attente, contre-offre, prix négocié ou formulaire
  function blocOffre(a, mode) {
    const champ = { vente: 'prixVente', location: 'prixJour', service: 'tarif' }[mode];
    const unite = mode === 'location' ? ' / jour' : mode === 'service' ? uniteService(a) : '';
    const qui = mode === 'service' ? 'prestataire' : 'propriétaire';
    const affiche = a[champ + 'Affiche'];
    if (affiche) return `<div class="alerte alerte-ok">🤝 Prix négocié accepté : <b>${Z.euros(a[champ])}${unite}</b> au lieu de ${Z.euros(affiche)}. Offre valable 48 h.</div>`;
    const mes = etat.offres.filter((x) => x.sens === 'envoyee' && x.annonceId === a.id && x.mode === mode);
    const enCours = mes.find((x) => ['en attente', 'contre-offre'].includes(x.statut) && !Z.offreExpiree(x, maintenant()));
    if (enCours) return `<div class="alerte alerte-info">🤝 ${enCours.statut === 'contre-offre' ? `Le ${qui} vous propose <b>${Z.euros(enCours.contre)}${unite}</b>.` : `Votre offre de <b>${Z.euros(enCours.montant)}${unite}</b> attend la réponse du ${qui}.`} <a href="#/offres">Voir mes offres</a></div>`;
    const mini = Math.ceil(a[champ] * Z.REGLES.offres.plancher * 2) / 2;
    if (mes.length >= Z.REGLES.offres.maxParAnnonce) return '<div class="alerte alerte-info">Vous avez atteint le nombre maximum d’offres pour cette annonce.</div>';
    return `<div class="bloc-offre"><b>🤝 Proposer mon prix</b>
      <div class="offre-saisie"><input type="number" id="montant-offre" min="${mini}" step="0.5" placeholder="Votre prix${unite} (min. ${Z.euros(mini)})" aria-label="Votre prix"><button type="button" class="btn btn-contour" data-action="offrir" data-mode="${mode}">Envoyer l’offre</button></div>
      <span class="discret">Le ${qui} a 48 h pour accepter, refuser ou vous faire une contre-proposition. Rien n’est débité avant son accord.</span></div>`;
  }
  function zoneTransaction(a) {
    const o = selection.onglet;
    if (o === 'vente') {
      const d = Z.devisVente(a);
      return `<div class="ligne"><span>Prix</span><b>${Z.euros(d.prix)}</b></div>
        <div class="ligne discret"><span>Protection acheteur (séquestre)</span><span>incluse</span></div>
        <div class="ligne total"><span>Vous payez</span><span>${Z.euros(d.prix)}</span></div>
        <div class="alerte alerte-info">Le vendeur reçoit ${Z.euros(d.versementVendeur)} une fois la remise confirmée (commission ZETOOLS ${Z.euros(d.commission)}).</div>
        <button class="btn btn-cta" style="width:100%" data-action="acheter">Acheter avec paiement sécurisé</button>
        ${blocOffre(a, 'vente')}`;
    }
    if (o === 'echange') {
      return `<p>Le propriétaire cherche : <b>${esc(a.echangeContre || 'à discuter')}</b>.</p>
        <label style="display:flex;flex-direction:column;gap:6px;font-weight:600">Votre proposition<textarea id="proposition" rows="3" style="border:1px solid var(--bord);border-radius:8px;padding:10px" placeholder="Ex. : ponceuse excentrique Makita, très bon état, avec 20 disques"></textarea></label>
        <div class="ligne discret"><span>Frais de mise en relation, par partie</span><span>${Z.euros(Z.REGLES.fraisEchange)}</span></div>
        <button class="btn btn-vert" style="width:100%;margin-top:10px" data-action="echanger">Proposer l’échange</button>
        <a class="btn btn-contour" style="width:100%;margin-top:8px" href="#/rendez-vous?type=echange&annonce=${a.id}">📅 Proposer des dates et heures d’échange</a>`;
    }
    // location
    let detail = '';
    if (selection.debut && selection.fin) {
      const v = Z.verifierDisponibilite(a, toutesReservations(), selection.debut, selection.fin, AUJOURDHUI);
      if (!v.ok) detail = `<div class="alerte alerte-erreur">${esc(v.raison)}</div>`;
      else {
        const d = Z.devisLocation(a, selection.debut, selection.fin, { assurance: selection.assurance, locationsProprietaire: membre(a.membre).locations });
        detail = `<div class="alerte alerte-ok">Du ${Z.formatDate(selection.debut)} au ${Z.formatDate(selection.fin)} · ${d.jours} jour${d.jours > 1 ? 's' : ''}</div>
          <div class="ligne"><span>${Z.euros(a.prixJour)} × ${d.jours} j</span><span>${Z.euros(d.brut)}</span></div>
          ${d.remise ? `<div class="ligne" style="color:var(--vert)"><span>Remise longue durée</span><span>− ${Z.euros(d.remise)}</span></div>` : ''}
          <label class="ligne" style="cursor:pointer"><span><input type="checkbox" id="assurance" ${selection.assurance ? 'checked' : ''}> <b>Je prends l’assurance</b> casse et vol</span><span>${Z.euros(d.assurance)}</span></label>
          <div class="ligne"><span>Frais de service</span><span>${Z.euros(d.fraisService)}</span></div>
          ${selection.assurance ? '' : '<div class="ligne discret"><span>Sans assurance, la casse et le vol sont couverts par votre seule caution.</span><span></span></div>'}
          <div class="ligne total"><span>Total</span><span>${Z.euros(d.totalLocataire)}</span></div>
          <div class="ligne discret"><span>Caution (empreinte, non débitée)</span><span>${Z.euros(d.caution)}</span></div>
          <button class="btn btn-cta" style="width:100%;margin-top:10px" data-action="reserver">Réserver et payer ${Z.euros(d.totalLocataire)}</button>`;
      }
    } else {
      detail = `<div class="alerte alerte-info">${selection.debut ? 'Choisissez maintenant le jour de retour.' : 'Choisissez le jour de retrait dans le calendrier.'}</div>`;
    }
    return `<div class="ligne"><span>Tarif</span><b>${Z.euros(a.prixJour)} / jour</b></div>
      <div class="ligne discret"><span>-10 % dès 3 jours · -20 % dès 7 jours</span><span></span></div>
      ${calendrier(a)}${detail}${blocOffre(a, 'location')}`;
  }

  function calendrier(a) {
    const occ = Z.joursOccupes(a, toutesReservations());
    const [an, mo] = selection.mois.split('-').map(Number);
    const premier = new Date(Date.UTC(an, mo - 1, 1));
    const nb = new Date(Date.UTC(an, mo, 0)).getUTCDate();
    const decalage = (premier.getUTCDay() + 6) % 7;
    const nomMois = premier.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    let cases = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j) => `<span>${j}</span>`).join('');
    for (let i = 0; i < decalage; i++) cases += '<span></span>';
    for (let j = 1; j <= nb; j++) {
      const t = `${an}-${String(mo).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
      let cls = '', dis = false;
      if (t < AUJOURDHUI) { cls = 'passe'; dis = true; } else if (occ.has(t)) { cls = 'occupe'; dis = true; }
      if (t === selection.debut || t === selection.fin) cls = 'choisi';
      else if (selection.debut && selection.fin && t > selection.debut && t < selection.fin && !dis) cls = 'entre';
      cases += `<button data-jour="${t}" class="${cls}" ${dis ? 'disabled' : ''}>${j}</button>`;
    }
    return `<div class="calendrier" style="margin:12px 0"><div class="tete"><button data-mois="-1" aria-label="Mois précédent">‹</button><span>${nomMois}</span><button data-mois="1" aria-label="Mois suivant">›</button></div>
      <div class="jours">${cases}</div>
      <div class="legende"><span><i style="background:var(--fond)"></i>Libre</span><span><i style="background:#f2d4cc"></i>Réservé</span><span><i style="background:var(--jaune)"></i>Votre sélection</span></div></div>`;
  }

  function brancherFiche(a) {
    const zone = document.getElementById('zone-transaction');
    const rafraichir = () => { zone.innerHTML = zoneTransaction(a); };
    document.getElementById('onglets-fiche').addEventListener('click', (e) => {
      const b = e.target.closest('[data-onglet]'); if (!b) return;
      selection.onglet = b.dataset.onglet;
      document.querySelectorAll('#onglets-fiche button').forEach((x) => x.classList.toggle('actif', x === b));
      rafraichir();
    });
    zone.addEventListener('change', (e) => { if (e.target.id === 'assurance') { selection.assurance = e.target.checked; rafraichir(); } });
    zone.addEventListener('click', (e) => {
      const j = e.target.closest('[data-jour]');
      if (j) {
        const t = j.dataset.jour;
        if (!selection.debut || selection.fin || t < selection.debut) { selection.debut = t; selection.fin = null; }
        else selection.fin = t;
        return rafraichir();
      }
      const mv = e.target.closest('[data-mois]');
      if (mv) {
        const [an, mo] = selection.mois.split('-').map(Number);
        const d = new Date(Date.UTC(an, mo - 1 + Number(mv.dataset.mois), 1));
        const nouveau = d.toISOString().slice(0, 7);
        if (nouveau >= AUJOURDHUI.slice(0, 7)) selection.mois = nouveau;
        return rafraichir();
      }
      const act = e.target.closest('[data-action]'); if (!act) return;
      if (act.dataset.action === 'reserver') {
        const v = Z.verifierDisponibilite(a, toutesReservations(), selection.debut, selection.fin, AUJOURDHUI);
        if (!v.ok) return toast(v.raison);
        const d = Z.devisLocation(a, selection.debut, selection.fin, { assurance: selection.assurance, locationsProprietaire: membre(a.membre).locations });
        etat.reservations.push({ id: 'r' + Date.now(), outilId: a.id, debut: selection.debut, fin: selection.fin, statut: 'confirmée', locataire: 'Vous', total: d.totalLocataire, caution: d.caution });
        deverrouillerConversation(a.id);
        sauver();
        toast(`Réservation confirmée (simulation) : ${Z.euros(d.totalLocataire)} payés, caution de ${Z.euros(d.caution)} bloquée.`);
        selection.debut = selection.fin = null; aller('#/mon-espace');
      } else if (act.dataset.action === 'offrir') {
        const mode = act.dataset.mode; const montant = Number(document.getElementById('montant-offre').value);
        const base = annonce(a.id);
        const v = Z.verifierOffre(base, mode, montant, etat.offres.filter((x) => x.sens === 'envoyee' && x.annonceId === a.id && x.mode === mode).length);
        if (!v.ok) return toast(v.raison);
        etat.offres.push(Z.creerOffre(base, mode, montant, maintenant())); sauver();
        toast(`Offre de ${Z.euros(montant)} envoyée. Réponse sous 48 h.`); aller('#/offres');
      } else if (act.dataset.action === 'acheter') {
        deverrouillerConversation(a.id); sauver();
        toast(`Paiement de ${Z.euros(a.prixVente)} placé en séquestre (simulation). Le vendeur est prévenu.`);
        aller('#/messages?annonce=' + a.id);
      } else if (act.dataset.action === 'echanger') {
        const texte = (document.getElementById('proposition').value || '').trim();
        if (!texte) return toast('Décrivez l’outil que vous proposez en échange.');
        const c = conversationPour(a.id);
        c.messages.push({ de: 'moi', texte: '🔁 Proposition d’échange : ' + Z.masquerCoordonnees(texte, c.confirmee).texte });
        sauver(); toast('Proposition envoyée. Vous serez prévenu de la réponse.');
        aller('#/messages?annonce=' + a.id);
      }
    });
  }

  function conversationPour(annonceId) {
    let c = etat.conversations.find((x) => x.annonceId === annonceId);
    if (!c) {
      const a = annonce(annonceId);
      c = { id: 'c' + Date.now(), annonceId, avec: a.membre, confirmee: false, messages: [] };
      etat.conversations.unshift(c);
    }
    return c;
  }
  function deverrouillerConversation(annonceId) {
    const c = conversationPour(annonceId);
    c.confirmee = true;
    c.messages.push({ de: 'systeme', texte: 'Transaction confirmée : les coordonnées de chacun sont désormais visibles. Remise prévue au 18 rue des Ateliers, 94300 Vincennes (adresse fictive).' });
  }

  /* --- messagerie avec masquage --- */
  function vueMessages(params) {
    const voulu = params.get('annonce');
    if (voulu && annonce(voulu)) conversationPour(voulu);
    const active = etat.conversations.find((c) => c.annonceId === voulu) || etat.conversations[0];
    return `<div class="page"><div class="conteneur">
      <div class="titre-section"><div><h2>Messagerie</h2><p>Les coordonnées (téléphone, e-mail, adresse, IBAN, liens) sont masquées automatiquement tant qu’aucune transaction n’est payée sur ZETOOLS.</p></div></div>
      <div class="messagerie">
        <div class="conversations">${etat.conversations.map((c) => { const a = annonce(c.annonceId); const m = membre(c.avec); return `<div class="conversation ${c === active ? 'actif' : ''}" data-conv="${c.annonceId}"><b>${esc(m.nom)}</b><small>${esc(a ? a.titre : '')}</small><small>${c.confirmee ? '🔓 coordonnées visibles' : '🔒 coordonnées masquées'}</small></div>`; }).join('')}</div>
        <div class="fil-messages">
          <div class="messages" id="messages">${active ? active.messages.map(rendreMessage).join('') : ''}</div>
          <form class="saisie" id="saisie"><input id="texte-msg" autocomplete="off" placeholder="Écrivez votre message… (essayez d’y mettre un numéro de téléphone)"><button class="btn btn-cta">Envoyer</button></form>
        </div>
      </div></div></div>`;
  }
  function rendreMessage(m) {
    if (m.de === 'systeme') return `<div class="alerte alerte-ok" style="align-self:center">${esc(m.texte)}</div>`;
    const html = esc(m.texte).split(esc(Z.MASQUE)).join(`<span class="masque">${esc(Z.MASQUE)}</span>`);
    return `<div class="msg ${m.de === 'moi' ? 'moi' : ''}">${html}</div>`;
  }
  function brancherMessages(params) {
    const voulu = params.get('annonce');
    const active = etat.conversations.find((c) => c.annonceId === voulu) || etat.conversations[0];
    document.querySelectorAll('[data-conv]').forEach((el) => el.addEventListener('click', () => { aller('#/messages?annonce=' + el.dataset.conv); }));
    const zone = document.getElementById('messages'); zone.scrollTop = zone.scrollHeight;
    document.getElementById('saisie').addEventListener('submit', (e) => {
      e.preventDefault();
      const champ = document.getElementById('texte-msg'); const brut = champ.value.trim();
      if (!brut || !active) return;
      const r = Z.masquerCoordonnees(brut, active.confirmee);
      active.messages.push({ de: 'moi', texte: r.texte });
      if (r.masque) active.messages.push({ de: 'systeme', texte: 'Pour votre sécurité, les coordonnées ont été masquées. Elles seront partagées automatiquement après le paiement sur ZETOOLS, qui seul vous assure caution, assurance et remboursement.' });
      sauver(); champ.value = '';
      zone.innerHTML = active.messages.map(rendreMessage).join(''); zone.scrollTop = zone.scrollHeight;
    });
  }

  /* --- mon espace : réservations, calendrier de location, mes annonces --- */
  function vueMonEspace() {
    const mesRes = toutesReservations().filter((r) => r.locataire === 'Vous');
    const mesAnn = etat.annonces;
    return `<div class="page"><div class="conteneur">
      <div class="titre-section"><div><h2>Mon espace</h2><p>Compte de démonstration · profil vérifié</p></div><a class="btn btn-cta" href="#/deposer">＋ Déposer une annonce</a></div>
      <h3>Mon calendrier de location</h3>
      ${mesRes.length ? `<table class="tableau"><thead><tr><th>Outil</th><th>Du</th><th>Au</th><th>Total payé</th><th>Caution bloquée</th><th>Statut</th></tr></thead><tbody>${mesRes.sort((x, y) => x.debut.localeCompare(y.debut)).map((r) => { const a = annonce(r.outilId); return `<tr><td><a href="#/annonce/${a.id}">${esc(a.titre)}</a></td><td>${Z.formatDate(r.debut)}</td><td>${Z.formatDate(r.fin)}</td><td>${r.total ? Z.euros(r.total) : '—'}</td><td>${Z.euros(r.caution ?? a.caution)}</td><td><span class="statut">${esc(r.statut)}</span></td></tr>`; }).join('')}</tbody></table>` : '<div class="vide">Aucune location pour l’instant.</div>'}
      <h3 style="margin-top:32px">Mes services proposés</h3>
      ${etat.services.length ? `<div class="grille">${etat.services.map(carteService).join('')}</div>` : '<div class="vide">Vous savez monter un meuble, tailler une haie, poser une étagère ? <a href="#/proposer-service">Proposez vos services</a>.</div>'}
      <h3 style="margin-top:32px">Mes bons cadeaux</h3>
      <div class="panneau bandeau-action"><div>${etat.coupons.length ? `${etat.coupons.length} bon(s) · solde disponible ${Z.euros(etat.coupons.filter((c) => !Z.couponExpire(c, AUJOURDHUI)).reduce((t, c) => t + c.solde, 0))}.` : 'Offrez des travaux à un proche, ou saisissez le code d’un bon reçu.'}</div><a class="btn btn-contour" href="#/offrir">🎁 Offrir ou utiliser un bon</a></div>
      <h3 style="margin-top:32px">Mes offres de prix</h3>
      <div class="panneau bandeau-action"><div>${etat.offres.filter((o) => o.sens === 'recue' && o.statut === 'en attente').length} offre(s) reçue(s) à traiter · ${etat.offres.filter((o) => o.sens === 'envoyee').length} envoyée(s).</div><a class="btn btn-contour" href="#/offres">🤝 Voir les offres</a></div>
      <h3 style="margin-top:32px">Mes rendez-vous</h3>
      <div class="panneau bandeau-action"><div>${etat.rdv.filter((r) => r.statut === 'confirmé').length} confirmé(s) · ${etat.rdv.filter((r) => r.statut === 'proposé').length} en attente. Travaux, échanges, réparations et remises d’outils.</div><a class="btn btn-contour" href="#/agenda">📅 Ouvrir mon agenda</a></div>
      <h3 style="margin-top:32px">Mes retraits en magasin (déstockage)</h3>
      ${etat.retraits.length ? etat.retraits.map((r) => `<div class="panneau"><div class="ligne"><span><b>Code ${esc(r.code)}</b> · ${r.quantite} × ${esc(r.titre)}<br><span class="discret">À retirer sous 7 jours : ${esc(r.magasin)}</span></span><b>${Z.euros(r.total)}</b></div></div>`).join('') : '<div class="vide">Aucun retrait en cours. <a href="#/destockage">Voir le déstockage des enseignes</a>.</div>'}
      <h3 style="margin-top:32px">Mes demandes de travaux</h3>
      ${blocMesDemandes()}
      <h3 style="margin-top:32px">Mes annonces</h3>
      ${mesAnn.length ? `<div class="grille">${mesAnn.map(carte).join('')}</div>` : '<div class="vide">Vous n’avez pas encore d’annonce. Un outil qui dort au garage ? <a href="#/deposer">Publiez-le en 2 minutes</a>.</div>'}
      <h3 style="margin-top:32px">Mes favoris</h3>
      ${etat.favoris.length ? `<div class="grille">${etat.favoris.map(annonce).filter(Boolean).map(carte).join('')}</div>` : '<div class="vide">Touchez ♡ sur une annonce pour la retrouver ici.</div>'}
      <p style="margin-top:28px"><button class="btn btn-contour" id="reinitialiser">Réinitialiser la démonstration</button></p>
    </div></div>`;
  }

  function vueDeposer(params) {
    const enPanne = params && params.get('etat') === 'reparer';
    return `<div class="page"><div class="conteneur" style="max-width:820px">
      <div class="titre-section"><div><h2>Déposer une annonce</h2><p>Gratuit pour les particuliers. Votre annonce est visible immédiatement dans la maquette.</p></div></div>
      <form class="panneau formulaire" id="form-depot">
        <label class="large">Titre<input name="titre" required maxlength="80" placeholder="Ex. : Ponceuse excentrique 125 mm + 20 disques"></label>
        <label>Marque<input name="marque" placeholder="Makita, Bosch…"></label>
        <label>Catégorie<select name="categorie" required>${CATEGORIES.map((c) => `<option value="${c.id}">${c.nom}</option>`).join('')}</select></label>
        <label>État<select name="etat"><option>Neuf</option><option ${enPanne ? '' : 'selected'}>Très bon état</option><option>Bon état</option><option>État correct</option><option ${enPanne ? 'selected' : ''}>À réparer</option></select></label>
        <label class="large">Panne constatée (si à réparer)<input name="panne" placeholder="Ex. : batterie qui ne tient plus la charge"></label>
        <label>Code postal<input name="cp" required pattern="\\d{5}" placeholder="94300"></label>
        <div class="large"><b>Je propose</b><div class="cases" style="margin-top:6px"><label><input type="checkbox" name="modes" value="location" checked> la location</label><label><input type="checkbox" name="modes" value="vente"> la vente</label><label><input type="checkbox" name="modes" value="echange"> l’échange</label></div></div>
        <label>Prix neuf de référence (€)<input name="prixNeuf" type="number" min="1" step="1" required placeholder="Prix en magasin aujourd’hui"></label>
        <div class="large alerte alerte-info" id="aide-prix">Indiquez le prix neuf : ZETools calcule le prix conseillé et le plafond. Sur ZETools, un outil se vend toujours <b>bien en dessous du neuf</b> (70 % au plus pour un outil neuf, 50 % en très bon état, 40 % en bon état, 30 % en état correct, 15 % à réparer).</div>
        <label>Prix par jour (€)<input name="prixJour" type="number" min="1" step="0.5" placeholder="10"></label>
        <label>Prix de vente (€)<input name="prixVente" type="number" min="1" step="1" placeholder="120"></label>
        <label>Caution demandée (€)<input name="caution" type="number" min="0" step="10" placeholder="150"></label>
        <label>Échange recherché<input name="echangeContre" placeholder="Ex. : scie sauteuse"></label>
        <label class="large">Description<textarea name="description" rows="4" placeholder="Accessoires fournis, conseils d’usage… (vos coordonnées seront masquées)"></textarea></label>
        <div class="large alerte alerte-info">Phase 1 : les photos se chargent depuis votre téléphone dans la version réelle. La maquette utilise une illustration par défaut.</div>
        <div class="large"><button class="btn btn-cta">Publier l’annonce</button></div>
      </form></div></div>`;
  }
  function brancherDeposer() {
    const form = document.getElementById('form-depot');
    const aide = document.getElementById('aide-prix');
    const majAide = () => {
      const p = Z.plafondPrix(Number(form.prixNeuf.value), form.etat.value);
      if (!p) return;
      aide.innerHTML = `Pour un outil « ${esc(form.etat.value)} » vendu ${Z.euros(Number(form.prixNeuf.value))} neuf : <b>vente conseillée ${Z.euros(p.venteConseillee)}</b> (maximum ${Z.euros(p.venteMax)}) · <b>location conseillée ${Z.euros(p.jourConseille)} / jour</b> (maximum ${Z.euros(p.jourMax)}) · caution ${Z.euros(p.cautionMax)} au plus.`;
      form.prixVente.placeholder = p.venteConseillee; form.prixJour.placeholder = p.jourConseille; form.caution.placeholder = Math.min(p.cautionMax, p.venteConseillee);
    };
    form.prixNeuf.addEventListener('input', majAide); form.etat.addEventListener('change', majAide);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const modes = fd.getAll('modes');
      const nb = (k) => Number(fd.get(k)) || null;
      if (!modes.length) return toast('Choisissez au moins : location, vente ou échange.');
      if (modes.includes('location') && !nb('prixJour')) return toast('Indiquez un prix par jour pour la location.');
      if (modes.includes('vente') && !nb('prixVente')) return toast('Indiquez un prix de vente.');
      const controle = Z.verifierPrix({ prixNeuf: nb('prixNeuf'), etat: String(fd.get('etat')), modes, prixJour: nb('prixJour'), prixVente: nb('prixVente'), caution: nb('caution') || 0 });
      if (!controle.ok) return toast(controle.erreurs[0]);
      const cp = String(fd.get('cp'));
      const a = {
        id: 'u' + Date.now(), titre: String(fd.get('titre')), marque: String(fd.get('marque') || '—'), categorie: String(fd.get('categorie')),
        etat: String(fd.get('etat')), modes, prixNeuf: nb('prixNeuf'), prixJour: nb('prixJour'), prixVente: nb('prixVente'), caution: nb('caution') || 0,
        ville: cp.startsWith('75') ? 'Paris' : 'Île-de-France', cp, membre: 'moi', photo: PHOTOS.atelier,
        description: Z.masquerCoordonnees(String(fd.get('description') || ''), false).texte,
        echangeContre: String(fd.get('echangeContre') || ''), indispo: [],
      };
      etat.annonces.push(a); sauver();
      toast('Annonce publiée.'); aller('#/annonce/' + a.id);
    });
  }

  function vuePros() {
    return `<div class="page"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Offres</div><h2>Particuliers et professionnels</h2><p>Commission dégressive sur les locations : 15 %, puis 12 % dès 5 locations, puis 10 % dès 20.</p></div></div>
      <div class="offres">
        <div class="offre"><h3>Gratuit</h3><div class="tarif">0 €</div><ul><li>Annonces illimitées pour les particuliers</li><li>Paiement sécurisé et caution</li><li>Messagerie protégée</li></ul></div>
        <div class="offre phare"><h3>Artisan abonné</h3><div class="tarif">39 € <small style="font-size:1rem">/ mois</small></div><ul><li>Toutes les demandes de travaux de votre zone : petits, moyens et gros</li><li>0 % de commission, 0 € par contact</li><li>Carte des chantiers autour de vous</li><li>390 € / an (2 mois offerts) · 30 jours d’essai</li></ul><a class="btn btn-cta" href="#/espace-artisan">Ouvrir mon espace artisan</a></div>
        <div class="offre"><h3>Pro Solo</h3><div class="tarif">19 € <small style="font-size:1rem">/ mois</small></div><ul><li>Badge PRO et SIRET vérifié</li><li>Calendrier de disponibilités multi-outils</li><li>Mise en avant locale</li><li>Factures automatiques</li></ul><a class="btn btn-cta" href="#/messages">Rejoindre la phase pilote</a></div>
        <div class="offre"><h3>Pro Business</h3><div class="tarif">dès 49 € <small style="font-size:1rem">/ mois</small></div><ul><li>Parc illimité, plusieurs comptes</li><li>Statistiques et export comptable</li><li>Interlocuteur dédié</li></ul></div>
        <div class="offre"><h3>Enseigne · déstockage</h3><div class="tarif">${Math.round(Z.REGLES.commissionDestockage * 100)} % <small style="font-size:1rem">par vente</small></div><ul><li>Grandes surfaces de bricolage, négoces, fabricants, loueurs</li><li>Espace privé, stock par magasin, retrait en magasin</li><li>0 € d’abonnement pendant le pilote</li></ul><a class="btn btn-cta" href="#/espace-enseigne">Espace enseigne</a></div>
      </div>
      <p class="note-legale">Prix hors taxes pour les professionnels. Détail : <a href="#/legal/pros">conditions particulières professionnels, artisans et enseignes</a> · <a href="#/legal/cgu">conditions générales</a> · <a href="#/legal/prix">règles de prix</a>.</p>
      ${blocReassurance().replace('class="bloc reassurance"', 'class="bloc reassurance" style="margin-top:40px;border-radius:16px"')}
    </div></div>`;
  }

  function vueAtelier() {
    return `<div class="page"><div class="conteneur"><div class="titre-section"><div><div class="surtitre">L’Atelier</div><h2>Le guide du bon bricoleur</h2><p>Conseils pratiques, choix du matériel, entretien.</p></div></div>${grilleArticles()}
      <div class="titre-section" style="margin-top:40px"><div><div class="surtitre">À télécharger</div><h2>Fiches techniques en PDF</h2><p>Monter un meuble, fixer une étagère, percer un mur : des pas-à-pas gratuits à imprimer.</p></div><a class="btn btn-contour" href="#/fiches">Toutes les fiches</a></div>
      <div class="grille">${window.ZT_DONNEES.FICHES.slice(0, 4).map(carteFiche).join('')}</div></div></div>`;
  }

  function vueAide() {
    const q = [
      ['Que se passe-t-il si l’outil est abîmé ?', 'Les photos d’état prises à la remise et au retour font foi. La caution couvre les petits dégâts ; l’assurance casse optionnelle prend le relais au-delà.'],
      ['Pourquoi ne puis-je pas donner mon numéro ?', 'Tant que rien n’est payé sur ZETOOLS, nous ne pouvons ni garantir la caution ni vous rembourser. Les coordonnées s’affichent automatiquement après paiement.'],
      ['Quand le propriétaire est-il payé ?', 'Le loyer est versé 24 h après le retour de l’outil, si aucun litige n’est ouvert. Pour une vente, après confirmation de la remise par l’acheteur.'],
      ['Un échange est-il protégé ?', 'Oui : chacun règle des frais de mise en relation et une caution croisée peut être demandée pour les outils de valeur différente.'],
      ['Puis-je négocier le prix ?', 'Oui. Sur chaque annonce de vente ou de location, « Proposer mon prix » envoie votre offre au propriétaire. Il a 48 h pour accepter, refuser ou vous faire une contre-proposition. Rien n’est débité avant l’accord, et le paiement reste sécurisé.'],
      ['La prestation d’un particulier est-elle assurée ?', 'Un particulier n’a pas d’assurance professionnelle. Deux protections existent : le prestataire peut prendre l’assurance responsabilité civile ZETools (badge « Assuré »), et vous pouvez cocher « Je prends l’assurance » à la réservation pour couvrir les dégâts causés chez vous. Sans l’une ni l’autre, la fiche l’indique clairement avant le paiement.'],
      ['Pourquoi les prix sont-ils plafonnés ?', 'ZETools est une place de marché d’outils à petit prix. Un outil d’occasion se vend au plus à 50 % du neuf en très bon état, 40 % en bon état, 30 % en état correct. Même un outil neuf, jamais servi, reste sous le prix du magasin (70 % au plus). Le prix neuf de référence et la remise sont affichés sur chaque annonce.'],
      ['Comment fixer un rendez-vous pour des travaux ou un échange ?', 'Depuis la fiche d’un artisan ou d’une annonce, cliquez sur « Proposer un rendez-vous » : choisissez jusqu’à 3 créneaux dans le calendrier. L’autre partie en accepte un, et le rendez-vous s’inscrit dans votre agenda. Annulation gratuite jusqu’à 24 h avant.'],
      ['Qu’est-ce que le déstockage des enseignes ?', 'Des professionnels (grandes surfaces de bricolage, négoces, fabricants, loueurs) y écoulent leurs fins de série et surstocks : des produits neufs, à prix cassés, payés en ligne et retirés en magasin, avec les garanties légales du vendeur.'],
      ['Faut-il être professionnel pour louer souvent ?', 'Au-delà d’un usage occasionnel, un numéro SIRET est demandé. Les revenus sont déclarés aux impôts conformément à la directive DAC7.'],
    ];
    return `<div class="page"><div class="conteneur" style="max-width:820px"><div class="titre-section"><div><h2>Questions fréquentes</h2></div></div>${q.map(([t, r]) => `<details class="panneau"><summary style="font-weight:700;cursor:pointer">${t}</summary><p>${r}</p></details>`).join('')}</div></div>`;
  }

  function vueLegal(id) {
    const J = window.ZT_JURIDIQUE; const p = J.PAGES.find((x) => x.id === id) || J.PAGES[0];
    return `<div class="page"><div class="conteneur"><div class="juridique">
      <nav aria-label="Documents juridiques">${J.PAGES.map((x) => `<a href="#/legal/${x.id}" class="${x.id === p.id ? 'actif' : ''}">${x.court}</a>`).join('')}<a href="#/pros">Offres professionnelles</a></nav>
      <article class="panneau"><div class="surtitre">${J.SOCIETE.nom} SAS · ${J.SOCIETE.siege}</div><h2 style="margin:4px 0">${p.titre}</h2>
        <p class="discret">${J.SOCIETE.version} · document de travail, à faire valider par un avocat avant mise en ligne. Les mentions surlignées restent à compléter.</p>
        <p>${p.intro}</p>
        ${p.sections.map(([t, h]) => `<h3>${t}</h3>${h}`).join('')}
      </article></div></div></div>${p.id === 'securite' ? blocReassurance() : ''}`;
  }

  function vueCredits() {
    return `<div class="page"><div class="conteneur" style="max-width:820px"><div class="panneau"><h2>Crédits photos et vidéos</h2>
      <p>Photographies issues d’<a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash</a>, sous licence Unsplash : utilisation gratuite, y compris commerciale, sans attribution obligatoire. Nous créditons tout de même les auteurs.</p>
      ${CREDITS.map(([sujet, auteur, id]) => `<div class="ligne"><span>${esc(sujet)}</span><span>${esc(auteur)} · <a href="https://images.unsplash.com/photo-${id}" target="_blank" rel="noopener">source</a></span></div>`).join('')}
      <h3 style="margin-top:28px">Vidéos</h3>
      <p>Vidéos issues de <a href="https://mixkit.co/license/#videoFree" target="_blank" rel="noopener">Mixkit</a>, sous licence gratuite Mixkit : usage commercial autorisé, sans attribution obligatoire. Elles sont lues sans son et s’arrêtent si vous avez demandé à limiter les animations.</p>
      ${[VIDEOS.accueil, VIDEOS.artisans, VIDEOS.reparer, ...Object.values(VIDEOS.categories)].map((v) => `<div class="ligne"><span>${esc(v.titre)}</span><span>Mixkit n° ${v.id} · <a href="${v.page}" target="_blank" rel="noopener">source</a></span></div>`).join('')}
    </div></div></div>`;
  }

  /* =====================================================================
     ARTISANS : géolocalisation, demandes de travaux, espace abonné
     ===================================================================== */
  const { METIERS, ARTISANS, DEMANDES } = window.ZT_DONNEES;
  const AB = Z.REGLES.abonnementArtisan;
  const metierNom = (id) => (METIERS.find((m) => m.id === id) || {}).nom || id;
  const metierIco = (id) => (METIERS.find((m) => m.id === id) || {}).icone || '🛠️';
  const tailleNom = (t) => Z.REGLES.tailles[t] || t;
  etat.demandes = etat.demandes || [];
  etat.reponses = etat.reponses || {};
  etat.abonnements = etat.abonnements || {};
  etat.artisanDemo = etat.artisanDemo || 'p2';
  let posClient = null; // { lat, lon, libelle, source } — gardée en mémoire seulement

  const toutesDemandes = () => DEMANDES.concat(etat.demandes).map((d) => Object.assign({}, d, {
    reponses: (d.reponses || []).concat(etat.reponses[d.id] || []),
    statut: etat.statuts && etat.statuts[d.id] ? etat.statuts[d.id] : d.statut,
  }));
  const artisan = (id) => {
    const a = ARTISANS.find((x) => x.id === id);
    return a && etat.abonnements[id] ? Object.assign({}, a, { abonnement: etat.abonnements[id] }) : a;
  };
  const tousArtisans = () => ARTISANS.map((a) => artisan(a.id));
  const artisansAbonnes = () => tousArtisans().filter((a) => Z.abonnementActif(a, AUJOURDHUI));

  function plusJours(t, n) { return Z.versTexte(new Date(Z.versDate(t).getTime() + n * 86400000)); }

  /* --- carte : Leaflet + OpenStreetMap si disponible, sinon radar dessiné --- */
  function dessinerCarte(id, centre, points, rayonKm) {
    const el = document.getElementById(id);
    if (!el) return;
    if (window.L) {
      try {
        const carte = window.L.map(el, { scrollWheelZoom: false }).setView([centre.lat, centre.lon], 12);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(carte);
        const zone = window.L.circle([centre.lat, centre.lon], { radius: rayonKm * 1000, color: '#2b5f3a', weight: 1, fillOpacity: 0.06 }).addTo(carte);
        window.L.circleMarker([centre.lat, centre.lon], { radius: 9, color: '#23272b', fillColor: '#23272b', fillOpacity: 1 }).addTo(carte).bindTooltip(centre.libelle || 'Vous');
        points.forEach((p) => window.L.circleMarker([p.lat, p.lon], { radius: 8, color: '#23272b', weight: 2, fillColor: p.couleur || '#f5b700', fillOpacity: 1 })
          .addTo(carte).bindPopup(`<b>${esc(p.titre)}</b><br>${esc(p.detail || '')}`));
        carte.fitBounds(zone.getBounds(), { padding: [10, 10] });
        return;
      } catch (e) { /* repli sur le radar */ }
    }
    // radar : positions relatives, sans dépendance externe
    const R = 140, k = R / rayonKm, kmLon = 111.32 * Math.cos((centre.lat * Math.PI) / 180);
    const pts = points.map((p) => {
      const x = (p.lon - centre.lon) * kmLon * k, y = -(p.lat - centre.lat) * 110.57 * k;
      return `<circle cx="${(R + x).toFixed(1)}" cy="${(R + y).toFixed(1)}" r="7" fill="${p.couleur || '#f5b700'}" stroke="#23272b" stroke-width="2"><title>${esc(p.titre)}</title></circle>`;
    }).join('');
    el.innerHTML = `<svg viewBox="0 0 ${2 * R} ${2 * R}" style="width:100%;height:100%;background:#eef1ee">
      ${[1, 0.66, 0.33].map((f) => `<circle cx="${R}" cy="${R}" r="${R * f}" fill="none" stroke="#2b5f3a" stroke-opacity=".35" stroke-dasharray="4 4"/>`).join('')}
      <text x="${R + 4}" y="14" font-size="10" fill="#2b5f3a">${rayonKm} km</text>
      <circle cx="${R}" cy="${R}" r="8" fill="#23272b"/>${pts}</svg>`;
  }

  function carteArtisan(x, avecBouton) {
    const a = x.artisan;
    return `<div class="artisan-carte">
      <div class="vendeur"><div class="avatar">${initiales(a.nom)}</div><div style="flex:1"><b>${esc(a.nom)}</b> <span class="badge badge-echange">Abonné vérifié</span><br>
        <span class="verifie">${a.siret ? '✔ SIRET' : ''}${a.decennale ? ' · ✔ Décennale' : ''}</span> · ★ ${a.note.toFixed(1)} (${a.avis})</div>
        <div class="distance">📍 ${Z.formatDistance(x.km)}</div></div>
      <p style="margin:8px 0;color:var(--texte-doux);font-size:.92rem">${esc(a.presentation)}</p>
      <div class="puces">${a.metiers.map((m) => `<span class="puce">${metierIco(m)} ${esc(metierNom(m))}</span>`).join('')}</div>
      <div class="ligne discret"><span>Dès ${Z.euros(a.tarifHoraire)} / h · intervient ${esc(a.delai)}</span><span>${a.outils ? 'Vient avec ses outils' : 'Outils à fournir ou à louer'}</span></div>
      ${avecBouton ? `<button class="btn btn-cta" data-devis="${a.id}" style="width:100%;margin-top:6px">Demander un devis gratuit</button>` : ''}
      <a class="btn btn-contour" href="#/rendez-vous?type=${a.metiers.includes('reparation') ? 'reparation' : 'travaux'}&avec=${a.id}" style="width:100%;margin-top:6px">📅 Proposer un rendez-vous</a>
    </div>`;
  }

  /* --- page client : trouver un artisan près de chez moi --- */
  let filtreTravaux = { rayon: 10, metier: '', vise: '' };
  function vueTravaux() {
    const res = posClient ? Z.artisansProches(posClient, artisansAbonnes(), { rayonKm: filtreTravaux.rayon, metier: filtreTravaux.metier }) : [];
    return `<section class="hero hero-court hero-video" style="background-image:url('${PHOTOS.artisans}')">${videoFond(VIDEOS.artisans)}<div class="conteneur">
        <div class="surtitre" style="color:var(--jaune)">Petits, moyens et gros travaux</div>
        <h1>Un artisan vérifié <em>près de chez vous</em>, avec ses outils.</h1>
        <p class="sous">Décrivez vos travaux : les artisans abonnés de votre secteur reçoivent votre demande et vous envoient leur devis. Gratuit et sans engagement pour vous.</p>
      </div></section>
      <div class="page"><div class="conteneur">
      <div class="panneau" style="margin-bottom:20px">
        <div class="localisation">
          <button class="btn btn-sombre" id="geoloc">📍 Me localiser</button>
          <span style="color:var(--texte-doux)">ou</span>
          <form id="form-cp" style="display:flex;gap:8px"><input id="cp-client" inputmode="numeric" maxlength="5" placeholder="Code postal" style="width:130px;border:1px solid var(--bord);border-radius:8px;padding:10px"><button class="btn btn-contour">Valider</button></form>
          <label>Rayon <select id="rayon">${[5, 10, 20, 40].map((r) => `<option value="${r}" ${filtreTravaux.rayon === r ? 'selected' : ''}>${r} km</option>`).join('')}</select></label>
          <label>Métier <select id="metier-filtre"><option value="">Tous</option>${METIERS.map((m) => `<option value="${m.id}" ${filtreTravaux.metier === m.id ? 'selected' : ''}>${m.nom}</option>`).join('')}</select></label>
        </div>
        <div id="etat-geo" class="alerte ${posClient ? 'alerte-ok' : 'alerte-info'}">${posClient
          ? `Position : ${esc(posClient.libelle)} (${posClient.source}). Les artisans ne voient qu’une zone d’environ 1 km, jamais votre adresse avant que vous acceptiez un devis.`
          : 'Autorisez la localisation ou saisissez votre code postal pour voir les artisans qui interviennent chez vous.'}</div>
      </div>
      ${posClient ? `<div class="travaux-grille">
        <div><div id="carte-client" class="carte-geo"></div><p class="legende"><span><i style="background:var(--anthracite)"></i>Vous</span><span><i style="background:var(--jaune)"></i>Artisans abonnés</span></p></div>
        <div><div class="titre-section" style="margin-bottom:10px"><div><h2 style="font-size:1.3rem">${res.length} artisan${res.length > 1 ? 's' : ''} dans un rayon de ${filtreTravaux.rayon} km</h2><p>Classés du plus proche au plus loin. Seuls les artisans dont la zone d’intervention couvre votre adresse apparaissent.</p></div></div>
          <div class="liste-artisans">${res.map((x) => carteArtisan(x, true)).join('') || '<div class="vide">Aucun artisan abonné ne couvre encore votre secteur pour ce métier. Publiez votre demande : elle sera visible dès qu’un artisan s’inscrit dans votre zone.</div>'}</div></div>
      </div>` : ''}
      <div class="panneau" id="bloc-demande" style="margin-top:24px">
        <h2 style="margin-top:0">Décrire mes travaux</h2>
        <form class="formulaire" id="form-demande">
          <label>Métier<select name="metier" required>${METIERS.map((m) => `<option value="${m.id}" ${(filtreTravaux.metier || '') === m.id ? 'selected' : ''}>${m.icone} ${m.nom}</option>`).join('')}</select></label>
          <label>Ampleur<select name="taille"><option value="petit">Petits travaux (quelques heures)</option><option value="moyen">Travaux moyens (quelques jours)</option><option value="gros">Gros travaux (chantier)</option></select></label>
          <label class="large">Titre<input name="titre" required maxlength="90" placeholder="Ex. : Poser 3 étagères et fixer une TV murale"></label>
          <label class="large">Détails<textarea name="details" rows="3" placeholder="Surface, matériaux, accès… (vos coordonnées seront masquées)"></textarea></label>
          <label>Budget indicatif<select name="budget"><option>Moins de 150 €</option><option>150 à 500 €</option><option>500 à 1 500 €</option><option>1 500 à 5 000 €</option><option>Plus de 5 000 €</option><option>Je ne sais pas</option></select></label>
          <label>Quand ?<select name="quand"><option>Urgent</option><option>Cette semaine</option><option>Ce mois-ci</option><option>Dans les 3 mois</option><option>Pas pressé</option></select></label>
          <label class="large">Les outils<select name="outils"><option value="artisan">L’artisan vient avec ses outils</option><option value="client">J’ai les outils nécessaires</option><option value="location">Je loue les outils sur ZETOOLS</option></select></label>
          <label>Code postal du chantier<input name="cp" required inputmode="numeric" pattern="\\d{5}" value="${esc(posClient && posClient.cp ? posClient.cp : '')}" placeholder="94300"></label>
          <input type="hidden" name="vise" value="${esc(filtreTravaux.vise)}">
          <div class="large">${filtreTravaux.vise ? `<div class="alerte alerte-info">Demande adressée en priorité à <b>${esc(artisan(filtreTravaux.vise).nom)}</b>, et visible par les autres artisans abonnés du secteur.</div>` : ''}<button class="btn btn-cta">Publier ma demande · gratuit</button></div>
        </form>
      </div></div></div>`;
  }

  function brancherTravaux() {
    const rafraichir = () => { vue.innerHTML = vueTravaux(); brancherTravaux(); };
    const placer = (p) => { posClient = p; rafraichir(); };
    document.getElementById('geoloc').addEventListener('click', () => {
      const etatGeo = document.getElementById('etat-geo');
      if (!navigator.geolocation) { etatGeo.textContent = 'Localisation indisponible sur cet appareil : saisissez votre code postal.'; return; }
      etatGeo.textContent = 'Recherche de votre position…';
      navigator.geolocation.getCurrentPosition((g) => {
        const p = { lat: g.coords.latitude, lon: g.coords.longitude };
        const horsZone = Z.distanceKm(p, { lat: 48.8566, lon: 2.3522 }) > 80;
        if (horsZone) { etatGeo.className = 'alerte alerte-erreur'; etatGeo.textContent = 'Vous êtes hors de la zone pilote (Île-de-France). Saisissez le code postal du chantier.'; return; }
        placer(Object.assign(Z.positionApprochee(p), { libelle: 'votre position', source: 'GPS, arrondie à 1 km' }));
      }, () => { etatGeo.className = 'alerte alerte-erreur'; etatGeo.textContent = 'Localisation refusée ou impossible : saisissez votre code postal.'; },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
    });
    document.getElementById('form-cp').addEventListener('submit', (e) => {
      e.preventDefault();
      const cp = document.getElementById('cp-client').value.trim();
      const p = Z.positionCodePostal(cp);
      if (!p) return toast('Code postal hors de la zone pilote Île-de-France.');
      placer({ lat: p.lat, lon: p.lon, libelle: `${p.libelle} (${cp})`, source: `code postal, précision ${p.precision}`, cp });
    });
    document.getElementById('rayon').addEventListener('change', (e) => { filtreTravaux.rayon = Number(e.target.value); rafraichir(); });
    document.getElementById('metier-filtre').addEventListener('change', (e) => { filtreTravaux.metier = e.target.value; rafraichir(); });
    vue.addEventListener('click', function choisir(e) {
      const b = e.target.closest('[data-devis]'); if (!b) return;
      vue.removeEventListener('click', choisir);
      filtreTravaux.vise = b.dataset.devis;
      const a = artisan(b.dataset.devis);
      if (!filtreTravaux.metier) filtreTravaux.metier = a.metiers[0];
      rafraichir(); document.getElementById('bloc-demande').scrollIntoView({ behavior: 'smooth' });
    });
    if (posClient) {
      const res = Z.artisansProches(posClient, artisansAbonnes(), { rayonKm: filtreTravaux.rayon, metier: filtreTravaux.metier });
      dessinerCarte('carte-client', posClient, res.map((x) => ({ lat: x.artisan.lat, lon: x.artisan.lon, titre: x.artisan.nom, detail: `${Z.formatDistance(x.km)} · ${x.artisan.metiers.map(metierNom).join(', ')}` })), filtreTravaux.rayon);
    }
    document.getElementById('form-demande').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const cp = String(fd.get('cp')).trim();
      const p = Z.positionCodePostal(cp);
      if (!p) return toast('Code postal hors de la zone pilote Île-de-France.');
      const pos = posClient && posClient.cp !== cp && posClient.source.startsWith('GPS') ? Z.positionApprochee(posClient) : Z.positionApprochee(p);
      const d = {
        id: 'd' + Date.now(), metier: String(fd.get('metier')), taille: String(fd.get('taille')),
        titre: String(fd.get('titre')), details: Z.masquerCoordonnees(String(fd.get('details') || ''), false).texte,
        ville: p.libelle, cp, lat: pos.lat, lon: pos.lon, budget: String(fd.get('budget')), quand: String(fd.get('quand')),
        outilsClient: fd.get('outils') !== 'artisan', outils: String(fd.get('outils')), statut: 'ouverte', publiee: AUJOURDHUI,
        vise: String(fd.get('vise') || ''), mienne: true, reponses: [],
      };
      const destinataires = artisansAbonnes().filter((a) => Z.peutRepondre(a, d, AUJOURDHUI).ok);
      etat.demandes.push(d);
      // simulation : l'artisan le plus proche répond aussitôt
      const premier = destinataires.map((a) => ({ a, km: Z.distanceKm(a, d) })).sort((x, y) => x.km - y.km)[0];
      if (premier) {
        etat.reponses[d.id] = [{ artisanId: premier.a.id, prix: d.taille === 'gros' ? 'Visite technique gratuite avant chiffrage' : `Environ ${Z.euros(premier.a.tarifHoraire * (d.taille === 'moyen' ? 16 : 3))}`,
          dispo: premier.a.delai, message: 'Bonjour, je suis disponible et je viens avec mon matériel. Je peux passer voir le chantier si besoin.', date: AUJOURDHUI, simulee: true }];
      }
      filtreTravaux.vise = ''; sauver();
      toast(`Demande publiée : ${destinataires.length} artisan${destinataires.length > 1 ? 's' : ''} abonné${destinataires.length > 1 ? 's' : ''} de votre secteur la reçoi${destinataires.length > 1 ? 'vent' : 't'}.`);
      aller('#/mon-espace');
    });
  }

  /* --- suivi des demandes du client (dans Mon espace) --- */
  function blocMesDemandes() {
    const miennes = toutesDemandes().filter((d) => d.mienne);
    if (!miennes.length) return '<div class="vide">Aucune demande en cours. <a href="#/travaux">Trouver un artisan près de chez moi</a>.</div>';
    return miennes.map((d) => `<div class="panneau">
      <div class="titre-section" style="margin-bottom:6px"><div><b>${metierIco(d.metier)} ${esc(d.titre)}</b><p>${esc(tailleNom(d.taille))} · ${esc(d.ville)} · ${esc(d.budget)} · ${esc(d.quand)}</p></div><span class="statut">${esc(d.statut)}</span></div>
      ${d.reponses.length ? d.reponses.map((r, i) => { const a = artisan(r.artisanId); return `<div class="reponse">
        <div><b>${esc(a.nom)}</b> · ★ ${a.note.toFixed(1)} · ${esc(r.prix)} · ${esc(r.dispo)}${r.simulee ? ' <small>(réponse simulée)</small>' : ''}<br><span style="color:var(--texte-doux)">${esc(r.message)}</span>
        ${d.statut === 'attribuée' && d.retenu === r.artisanId ? `<div class="alerte alerte-ok">Devis accepté. Coordonnées échangées : ${esc(a.nom)}, tél. 01 23 45 67 89 (fictif). L’artisan reçoit votre adresse exacte.</div>` : ''}</div>
        ${d.statut === 'ouverte' ? `<button class="btn btn-vert" data-accepter="${esc(d.id)}" data-artisan="${esc(a.id)}">Accepter</button>` : ''}</div>`; }).join('')
      : '<p style="color:var(--texte-doux)">En attente des réponses des artisans du secteur.</p>'}
    </div>`).join('');
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-accepter]'); if (!b) return;
    etat.statuts = etat.statuts || {};
    etat.statuts[b.dataset.accepter] = 'attribuée';
    const d = etat.demandes.find((x) => x.id === b.dataset.accepter);
    if (d) d.retenu = b.dataset.artisan;
    sauver(); toast('Devis accepté : vos coordonnées sont transmises à l’artisan.'); router();
  });

  /* --- espace artisan abonné --- */
  function vueEspaceArtisan() {
    const a = artisan(etat.artisanDemo);
    const actif = Z.abonnementActif(a, AUJOURDHUI);
    const liste = Z.demandesPourArtisan(a, toutesDemandes());
    const ab = a.abonnement;
    return `<div class="page"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Espace artisan</div><h2>${esc(a.nom)}</h2><p>${esc(a.ville)} · zone d’intervention ${a.rayonKm} km · ${a.metiers.map(metierNom).join(', ')}</p></div>
        <label style="font-weight:600">Démonstration, se connecter en tant que : <select id="choix-artisan">${ARTISANS.map((x) => `<option value="${x.id}" ${x.id === a.id ? 'selected' : ''}>${esc(x.nom)}</option>`).join('')}</select></label></div>
      <div class="abonnement ${actif ? 'actif' : ''}">
        ${actif ? `<div><b>✔ Abonnement ${ab.formule === 'annuel' ? 'annuel' : 'mensuel'} actif</b> jusqu’au ${Z.formatDate(ab.finPeriode)}${ab.essai ? ' (période d’essai)' : ''}.<br>Accès illimité à toutes les demandes de votre zone : 0 % de commission, 0 € par contact.</div>
          <div class="chiffre"><b>${liste.length}</b>demande${liste.length > 1 ? 's' : ''} ouverte${liste.length > 1 ? 's' : ''} dans votre zone</div>`
        : `<div><b>${liste.length} client${liste.length > 1 ? 's' : ''} cherche${liste.length > 1 ? 'nt' : ''} un artisan dans votre zone en ce moment.</b><br>Abonnez-vous pour voir le détail et leur répondre : ${Z.euros(AB.mensuel)} par mois, sans engagement, ou ${Z.euros(AB.annuel)} par an (2 mois offerts). ${AB.essaiJours} jours d’essai.</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-cta" data-abonner="mensuel">${Z.euros(AB.mensuel)} / mois</button><button class="btn btn-sombre" data-abonner="annuel">${Z.euros(AB.annuel)} / an</button></div>`}
      </div>
      <div class="travaux-grille" style="margin-top:20px">
        <div><div id="carte-artisan" class="carte-geo"></div><p class="legende"><span><i style="background:var(--anthracite)"></i>Votre atelier</span><span><i style="background:var(--jaune)"></i>Petits</span><span><i style="background:var(--orange)"></i>Moyens</span><span><i style="background:var(--vert)"></i>Gros travaux</span></p></div>
        <div class="liste-artisans ${actif ? '' : 'floute'}">${liste.map((x) => carteDemande(x, a, actif)).join('') || '<div class="vide">Aucune demande ouverte dans votre zone pour vos métiers.</div>'}</div>
      </div></div></div>`;
  }
  const couleurTaille = (t) => ({ petit: '#f5b700', moyen: '#e8590c', gros: '#2b5f3a' }[t]);
  function carteDemande(x, a, actif) {
    const d = x.demande;
    const peut = Z.peutRepondre(a, d, AUJOURDHUI);
    const dejaRepondu = d.reponses.some((r) => r.artisanId === a.id);
    return `<div class="artisan-carte">
      <div class="vendeur"><div class="avatar" style="background:${couleurTaille(d.taille)};color:#fff">${metierIco(d.metier)}</div><div style="flex:1"><b>${actif ? esc(d.titre) : esc(metierNom(d.metier)) + ' · détail réservé aux abonnés'}</b><br>
        <span style="color:var(--texte-doux);font-size:.9rem">${esc(tailleNom(d.taille))} · ${esc(d.ville)} · publiée le ${Z.formatDate(d.publiee)}</span></div><div class="distance">📍 ${Z.formatDistance(x.km)}</div></div>
      ${actif ? `<div class="ligne discret"><span>Budget : ${esc(d.budget)} · ${esc(d.quand)}</span><span>${d.outilsClient ? 'Le client a les outils' : 'Venir avec ses outils'}</span></div>
        <div class="ligne discret"><span>${d.reponses.length} réponse${d.reponses.length > 1 ? 's' : ''} d’artisans</span><span>Adresse exacte après acceptation</span></div>
        ${dejaRepondu ? '<div class="alerte alerte-ok">Votre devis est envoyé. Vous serez prévenu si le client l’accepte.</div>'
          : peut.ok ? `<form class="form-reponse" data-demande="${esc(d.id)}">
            <input name="prix" required placeholder="Prix estimé (ex. 350 € TTC)"><input name="dispo" required placeholder="Disponibilité (ex. mardi 9 h)">
            <input name="message" class="large" placeholder="Message au client (coordonnées masquées)"><button class="btn btn-cta large">Envoyer mon devis</button></form>`
          : `<div class="alerte alerte-erreur">${esc(peut.raison)}</div>`}` : ''}
    </div>`;
  }
  function brancherEspaceArtisan() {
    const a = artisan(etat.artisanDemo);
    document.getElementById('choix-artisan').addEventListener('change', (e) => { etat.artisanDemo = e.target.value; sauver(); router(); });
    document.querySelectorAll('[data-abonner]').forEach((b) => b.addEventListener('click', () => {
      const formule = b.dataset.abonner;
      etat.abonnements[a.id] = { formule, finPeriode: plusJours(AUJOURDHUI, AB.essaiJours), essai: true };
      sauver(); toast(`Abonnement ${formule} activé (simulation) : ${AB.essaiJours} jours d’essai, puis ${formule === 'annuel' ? Z.euros(AB.annuel) + ' / an' : Z.euros(AB.mensuel) + ' / mois'}.`); router();
    }));
    document.querySelectorAll('.form-reponse').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const d = toutesDemandes().find((x) => x.id === f.dataset.demande);
      const v = Z.peutRepondre(artisan(etat.artisanDemo), d, AUJOURDHUI);
      if (!v.ok) return toast(v.raison);
      const propre = (k) => Z.masquerCoordonnees(String(fd.get(k) || ''), false).texte;
      (etat.reponses[d.id] = etat.reponses[d.id] || []).push({ artisanId: a.id, prix: propre('prix'), dispo: propre('dispo'), message: propre('message') || 'Bonjour, je suis disponible pour ces travaux.', date: AUJOURDHUI });
      sauver(); toast('Devis envoyé au client.'); router();
    }));
    const liste = Z.demandesPourArtisan(a, toutesDemandes());
    dessinerCarte('carte-artisan', { lat: a.lat, lon: a.lon, libelle: a.nom }, liste.map((x) => ({ lat: x.demande.lat, lon: x.demande.lon, couleur: couleurTaille(x.demande.taille),
      titre: Z.abonnementActif(a, AUJOURDHUI) ? x.demande.titre : metierNom(x.demande.metier), detail: `${tailleNom(x.demande.taille)} · ${Z.formatDistance(x.km)}` })), a.rayonKm);
  }

  /* --- espace « Outils à réparer » --- */
  function vueReparer() {
    const aReparer = toutesAnnonces().filter((a) => a.etat === 'À réparer');
    const reparateurs = artisansAbonnes().filter((a) => a.metiers.includes('reparation'));
    return `<section class="hero hero-court hero-video" style="background-image:url('${PHOTOS.atelier}')">${videoFond(VIDEOS.reparer)}<div class="conteneur">
        <div class="surtitre" style="color:var(--jaune)">Outils à réparer</div>
        <h1>Un outil en panne n’est pas <em>un déchet</em>.</h1>
        <p class="sous">Faites-le réparer par un réparateur près de chez vous, vendez-le pour pièces, ou offrez-lui une seconde vie entre les mains d’un bricoleur.</p>
      </div></section>
      <div class="page"><div class="conteneur">
      <div class="modes">
        <div class="mode"><div class="corps"><h3>🪛 Faire réparer mon outil</h3><p>Décrivez la panne : les réparateurs abonnés de votre secteur vous envoient un diagnostic et un devis. Gratuit pour vous.</p><a class="btn btn-cta" href="#/travaux?metier=reparation">Trouver un réparateur</a></div></div>
        <div class="mode"><div class="corps"><h3>🔁 Vendre ou troquer pour pièces</h3><p>Moteur grillé, batterie morte, manche cassé ? Publiez-le « À réparer » : pièces et carcasses intéressent les bricoleurs.</p><a class="btn btn-sombre" href="#/deposer?etat=reparer">Déposer un outil en panne</a></div></div>
        <div class="mode"><div class="corps"><h3>🧰 Acheter à petit prix</h3><p>Des outils à remettre en état pour quelques euros. La panne est décrite par le vendeur avant l’achat.</p><a class="btn btn-contour" href="#outils-a-reparer">Voir les outils à réparer</a></div></div>
      </div>
      <div class="titre-section" style="margin-top:40px"><div><div class="surtitre">Réparateurs abonnés</div><h2>${reparateurs.length} ateliers de réparation en Île-de-France</h2><p>Électroportatif, motoculture, affûtage. Indiquez votre code postal sur la page suivante pour les voir classés par distance.</p></div></div>
      <div class="liste-artisans deux-colonnes">${reparateurs.map((a) => carteArtisan({ artisan: a, km: Z.distanceKm({ lat: 48.8566, lon: 2.3522 }, a) }, false).replace('📍', '📍 de Paris centre :')).join('')}</div>
      <div class="titre-section" style="margin-top:40px" id="outils-a-reparer"><div><div class="surtitre">À remettre en état</div><h2>Outils à réparer</h2></div></div>
      <div class="grille">${aReparer.map(carte).join('') || '<div class="vide">Aucun outil à réparer pour le moment.</div>'}</div>
      <div class="panneau" style="margin-top:32px"><h3 style="margin-top:0">Bon à savoir avant de jeter</h3>
        <ul style="color:var(--texte-doux);margin:0;padding-left:18px">
          <li>Les pannes les plus courantes (charbons, interrupteur, cordon, batterie) se réparent souvent pour moins de la moitié du prix du neuf.</li>
          <li>L’outillage électroportatif et les tondeuses ouvrent droit au <b>bonus réparation</b> (20 € déduits de la facture pour l’électroportatif) chez un réparateur labellisé QualiRépar.</li>
          <li>Un outil réparé garde l’historique de ses interventions sur ZETOOLS : un argument à la revente.</li>
        </ul></div>
    </div></div>`;
  }

  /* =====================================================================
     DÉSTOCKAGE ENSEIGNES : produits neufs, prix barrés conformes (art. L.112-1-1 C. conso)
     ===================================================================== */
  const { TYPES_ENSEIGNE, ENSEIGNES, LOTS, RDV_DEMO } = window.ZT_DONNEES;
  const enseigne = (id) => ENSEIGNES.find((e) => e.id === id) || { id, nom: 'Enseigne', type: 'gsb', logo: '🏬' };
  const lotCourant = (l) => (etat.stocks[l.id] ? Object.assign({}, l, { magasins: etat.stocks[l.id] }) : l);
  const tousLots = () => LOTS.concat(etat.lots).map(lotCourant);
  const lotsActifs = () => tousLots().filter((l) => l.fin >= AUJOURDHUI && Z.stockLot(l) > 0);
  const NOTE_REFERENCE = 'Prix de référence : prix le plus bas pratiqué par l’enseigne au cours des 30 jours précédant la réduction (art. L.112-1-1 du Code de la consommation). Produits neufs, garanties légales de l’enseigne.';

  function carteLot(l) {
    const e = enseigne(l.enseigne); const r = Z.remiseSurNeuf(l.prixDestockage, l.prixReference); const st = Z.stockLot(l);
    return `<a class="carte carte-lot" href="#/lot/${l.id}">
      <div class="visuel">${l.photo ? `<img loading="lazy" src="${l.photo}" alt="${esc(l.titre)}">` : ''}
        <div class="badges"><span class="badge badge-destock">Déstockage</span><span class="remise">−${r} %</span></div></div>
      <div class="infos"><span class="enseigne-nom">${e.logo} ${esc(e.nom)} · ${esc(TYPES_ENSEIGNE[e.type] || '')}</span>
        <h3>${esc(l.titre)}</h3>
        <div class="prix">${Z.euros(l.prixDestockage)} <s class="barre">${Z.euros(l.prixReference)}</s></div>
        <div class="meta"><span>${l.reconditionne ? '♻️ Reconditionné' : '✨ Neuf'} · ${esc(l.motif)}</span></div>
        <div class="meta"><span>📦 ${st} en stock · ${l.magasins.length} magasin${l.magasins.length > 1 ? 's' : ''}</span><span>⏳ jusqu’au ${Z.formatDate(l.fin)}</span></div></div></a>`;
  }
  let filtreLots = { cat: '', type: '' };
  function vueDestockage() {
    const lots = lotsActifs().filter((l) => (!filtreLots.cat || l.categorie === filtreLots.cat) && (!filtreLots.type || enseigne(l.enseigne).type === filtreLots.type));
    const puce = (k, v, lib) => `<button class="puce ${filtreLots[k] === v ? 'active' : ''}" data-filtre-lot="${k}" data-valeur="${v}">${lib}</button>`;
    return `<section class="hero hero-court hero-destock"><div class="conteneur">
        <div class="surtitre" style="color:var(--jaune)">Déstockage des enseignes · produits neufs</div>
        <h1>Les fins de série des pros, <em>à prix imbattables</em>.</h1>
        <p class="sous">Grandes surfaces de bricolage, négoces de matériaux, fabricants et loueurs écoulent ici leurs surstocks. Vous payez en ligne et retirez en magasin.</p>
      </div></section>
      <div class="page"><div class="conteneur">
        <div class="puces" style="margin-bottom:10px">${puce('cat', '', 'Toutes catégories')}${CATEGORIES.map((c) => puce('cat', c.id, `${c.icone} ${c.nom}`)).join('')}</div>
        <div class="puces" style="margin-bottom:20px">${puce('type', '', 'Tous les acteurs')}${Object.entries(TYPES_ENSEIGNE).map(([k, v]) => puce('type', k, v)).join('')}</div>
        <div class="grille">${lots.map(carteLot).join('') || '<div class="vide">Aucun lot pour ces critères. Revenez bientôt : les enseignes publient chaque semaine.</div>'}</div>
        <p class="note-legale">${NOTE_REFERENCE} Limite de ${Z.REGLES.maxParClient} unités par client et par lot.</p>
        <div class="panneau bandeau-action"><div><b>Vous êtes une enseigne, un négoce, un fabricant ou un loueur ?</b><br>Écoulez vos fins de série et surstocks auprès des bricoleurs de votre zone de chalandise, sans brader votre image : espace privé, retrait en magasin, 0 € d’abonnement pendant le pilote.</div><a class="btn btn-cta" href="#/espace-enseigne">Accéder à l’espace enseigne</a></div>
      </div></div>`;
  }
  function brancherDestockage() {
    vue.querySelectorAll('[data-filtre-lot]').forEach((b) => b.addEventListener('click', () => { filtreLots[b.dataset.filtreLot] = b.dataset.valeur; router(); }));
  }
  function vueLot(id) {
    const l = tousLots().find((x) => x.id === id);
    if (!l) return '<div class="page"><div class="conteneur vide">Lot introuvable. <a href="#/destockage">Retour au déstockage</a></div></div>';
    const e = enseigne(l.enseigne); const d = Z.devisLot(l, 1);
    const fini = l.fin < AUJOURDHUI || Z.stockLot(l) === 0;
    return `<div class="page"><div class="conteneur">
      <div class="fil"><a href="#/">Accueil</a> › <a href="#/destockage">Déstockage</a> › ${esc(l.titre)}</div>
      <div class="fiche"><div><div class="photo-principale">${l.photo ? `<img src="${l.photo.replace('w=900', 'w=1400')}" alt="${esc(l.titre)}">` : ''}</div>
          <div class="panneau" style="margin-top:16px"><h2 style="margin-top:0">Détails du lot</h2>
            <div class="ligne"><span>Vendu par</span><b>${e.logo} ${esc(e.nom)} · ${esc(TYPES_ENSEIGNE[e.type])} ${e.siret ? '· ✔ SIRET vérifié' : ''}</b></div>
            <div class="ligne"><span>Produit</span><b>${l.reconditionne ? 'Reconditionné, révisé par le loueur' : 'Neuf'}</b></div>
            <div class="ligne"><span>Raison du déstockage</span><b>${esc(l.motif)}</b></div>
            <div class="ligne"><span>Offre valable jusqu’au</span><b>${Z.formatDate(l.fin)} ou épuisement du stock</b></div>
            <h3>Stock par magasin</h3>${l.magasins.map((m) => `<div class="ligne"><span>📍 ${esc(m.nom)} (${esc(m.cp)})</span><b>${m.stock} disponible${m.stock > 1 ? 's' : ''}</b></div>`).join('')}
            <p class="note-legale">${NOTE_REFERENCE} Achat à distance auprès d’un professionnel : droit de rétractation de 14 jours et garantie légale de conformité de 2 ans (${l.reconditionne ? '1 an au moins pour un bien reconditionné, selon l’enseigne' : 'produit neuf'}).</p></div></div>
        <div><div class="panneau"><div class="badges" style="display:flex;gap:6px"><span class="badge badge-destock">Déstockage</span><span class="remise">−${d.remise} %</span></div>
          <h1>${esc(l.titre)}</h1>
          <div class="prix-lot">${Z.euros(l.prixDestockage)} <s class="barre">${Z.euros(l.prixReference)}</s></div>
          ${fini ? '<div class="alerte alerte-info">Cette offre est terminée.</div>' : `<form id="form-lot" class="formulaire" style="grid-template-columns:1fr 1fr">
            <label>Quantité<select name="quantite">${Array.from({ length: Math.min(Z.REGLES.maxParClient, Z.stockLot(l)) }, (_, i) => `<option>${i + 1}</option>`).join('')}</select></label>
            <label>Magasin de retrait<select name="cp">${l.magasins.filter((m) => m.stock > 0).map((m) => `<option value="${esc(m.cp)}">${esc(m.nom)}</option>`).join('')}</select></label>
            <div class="large" id="devis-lot"></div>
            <div class="large"><button class="btn btn-cta" style="width:100%">Payer et réserver en click & collect</button></div></form>`}
          <p style="color:var(--texte-doux);font-size:.9rem">Paiement sécurisé par le prestataire agréé de ZETools. L’enseigne prépare votre commande ; vous la retirez avec votre code sous 7 jours.</p></div></div>
      </div></div></div>`;
  }
  function brancherLot(id) {
    const f = document.getElementById('form-lot'); if (!f) return;
    const l = tousLots().find((x) => x.id === id);
    const maj = () => { const d = Z.devisLot(l, Number(f.quantite.value)); document.getElementById('devis-lot').innerHTML = `<div class="ligne total"><span>Total</span><span>${Z.euros(d.total)}</span></div><div class="ligne discret"><span>Votre économie</span><span>${Z.euros(d.economie)}</span></div>`; };
    f.quantite.addEventListener('change', maj); maj();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Z.devisLot(l, Number(f.quantite.value));
      const r = Z.retirerDuStock(l, f.cp.value, d.quantite);
      if (!r.ok) return toast(r.raison);
      etat.stocks[l.id] = r.magasins;
      const code = 'ZT-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      etat.retraits.push({ code, lotId: l.id, enseigne: l.enseigne, titre: l.titre, magasin: r.magasin, quantite: d.quantite, total: d.total, commission: d.commission, date: AUJOURDHUI });
      sauver(); toast(`Réservé. Code de retrait ${code} à présenter en magasin.`); aller('#/mon-espace');
    });
  }

  /* --- espace privé enseigne --- */
  function vueEspaceEnseigne() {
    if (!etat.enseigne) {
      return `<div class="page"><div class="conteneur" style="max-width:760px"><div class="panneau">
        <div class="surtitre">Espace privé · accès sur invitation</div><h2 style="margin-top:4px">Espace enseigne ZETools</h2>
        <p>Réservé aux distributeurs et fabricants d’outillage : grandes surfaces de bricolage, négoces de matériaux, fabricants, loueurs, quincailleries. Chaque compte est vérifié avant ouverture (SIRET, extrait Kbis, signataire habilité, coordonnées bancaires auprès du prestataire de paiement).</p>
        <ul class="liste-avantages"><li>Publiez vos fins de série, surstocks, retours et produits à l’emballage abîmé, magasin par magasin.</li><li>Vente en ligne, retrait en magasin : du trafic en point de vente, sans logistique supplémentaire.</li><li>Commission de ${Math.round(Z.REGLES.commissionDestockage * 100)} % sur les ventes réalisées, 0 € d’abonnement pendant le pilote.</li><li>Prix barrés contrôlés : vous attestez le prix de référence sur 30 jours, ZETools l’affiche conformément au Code de la consommation.</li></ul>
        <form id="connexion-enseigne" class="formulaire" style="grid-template-columns:1fr">
          <label>Démonstration, se connecter en tant que<select name="enseigne">${ENSEIGNES.map((e) => `<option value="${e.id}">${e.logo} ${esc(e.nom)} · ${esc(TYPES_ENSEIGNE[e.type])}</option>`).join('')}</select></label>
          <button class="btn btn-cta">Entrer dans l’espace enseigne</button></form>
        <p style="font-size:.88rem;color:var(--texte-doux)">Noms d’enseignes fictifs pour la maquette. Conditions : <a href="#/legal/pros">conditions particulières professionnels et enseignes</a>.</p></div></div></div>`;
    }
    const e = enseigne(etat.enseigne);
    const mesLots = tousLots().filter((l) => l.enseigne === e.id);
    const mesRetraits = etat.retraits.filter((r) => r.enseigne === e.id);
    const ca = mesRetraits.reduce((t, r) => t + r.total, 0), com = mesRetraits.reduce((t, r) => t + r.commission, 0);
    return `<div class="page"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Espace enseigne · privé</div><h2>${e.logo} ${esc(e.nom)}</h2><p>${esc(TYPES_ENSEIGNE[e.type])} · ${e.magasins} point${e.magasins > 1 ? 's' : ''} de vente</p></div><button class="btn btn-contour" id="deconnexion-enseigne">Se déconnecter</button></div>
      <div class="kpis"><div class="kpi"><b>${mesLots.filter((l) => l.fin >= AUJOURDHUI && Z.stockLot(l) > 0).length}</b><span>lots en ligne</span></div><div class="kpi"><b>${mesLots.reduce((t, l) => t + Z.stockLot(l), 0)}</b><span>unités en stock</span></div><div class="kpi"><b>${mesRetraits.reduce((t, r) => t + r.quantite, 0)}</b><span>unités vendues</span></div><div class="kpi"><b>${Z.euros(ca)}</b><span>chiffre d’affaires</span></div><div class="kpi"><b>${Z.euros(ca - com)}</b><span>versé après commission</span></div></div>
      <div class="panneau"><h3 style="margin-top:0">Mes lots</h3><div class="tableau-defile"><table class="tableau"><thead><tr><th>Produit</th><th>Réf. 30 j</th><th>Déstockage</th><th>Remise</th><th>Stock</th><th>Fin</th></tr></thead><tbody>
        ${mesLots.map((l) => `<tr><td><a href="#/lot/${l.id}">${esc(l.titre)}</a></td><td>${Z.euros(l.prixReference)}</td><td><b>${Z.euros(l.prixDestockage)}</b></td><td>−${Z.remiseSurNeuf(l.prixDestockage, l.prixReference)} %</td><td>${Z.stockLot(l)}</td><td>${Z.formatDate(l.fin)}</td></tr>`).join('') || '<tr><td colspan="6">Aucun lot publié.</td></tr>'}</tbody></table></div></div>
      <div class="panneau"><h3 style="margin-top:0">Retraits à préparer</h3>${mesRetraits.map((r) => `<div class="ligne"><span><b>${esc(r.code)}</b> · ${r.quantite} × ${esc(r.titre)} · ${esc(r.magasin)}</span><b>${Z.euros(r.total)}</b></div>`).join('') || '<p style="color:var(--texte-doux)">Aucune commande pour le moment.</p>'}</div>
      <form class="panneau formulaire" id="form-lot-enseigne"><h3 class="large" style="margin:0">Publier un lot</h3>
        <label class="large">Désignation<input name="titre" required maxlength="90" placeholder="Ex. : Scie circulaire 1 400 W, lame 190 mm"></label>
        <label>Catégorie<select name="categorie">${CATEGORIES.map((c) => `<option value="${c.id}">${c.nom}</option>`).join('')}</select></label>
        <label>Raison du déstockage<select name="motif"><option>Fin de série</option><option>Surstock</option><option>Fin de saison</option><option>Emballage abîmé, produit neuf</option><option>Changement de référence</option><option>Renouvellement du parc</option></select></label>
        <label>Prix de référence (€)<input name="prixReference" type="number" min="1" step="0.01" required placeholder="Le plus bas sur 30 jours"></label>
        <label>Prix de déstockage (€)<input name="prixDestockage" type="number" min="1" step="0.01" required></label>
        <label>Magasin<input name="magasin" required placeholder="${esc(e.nom)} Vitry"></label>
        <label>Code postal<input name="cp" required pattern="\\d{5}" placeholder="94400"></label>
        <label>Quantité disponible<input name="stock" type="number" min="1" step="1" required></label>
        <label>Fin de l’opération<input name="fin" type="date" required min="${AUJOURDHUI}"></label>
        <label class="large case"><input type="checkbox" name="atteste" required> J’atteste que le prix de référence est le prix le plus bas pratiqué dans ce magasin au cours des 30 jours précédant la réduction.</label>
        <div class="large alerte alerte-info">Phase 2 : import du catalogue par fichier CSV ou flux EDI, et mise à jour automatique des stocks depuis votre logiciel de caisse.</div>
        <div class="large"><button class="btn btn-cta">Publier le lot</button></div></form>
    </div></div>`;
  }
  function brancherEspaceEnseigne() {
    const c = document.getElementById('connexion-enseigne');
    if (c) c.addEventListener('submit', (e) => { e.preventDefault(); etat.enseigne = c.enseigne.value; sauver(); router(); });
    const d = document.getElementById('deconnexion-enseigne');
    if (d) d.addEventListener('click', () => { etat.enseigne = null; sauver(); router(); });
    const f = document.getElementById('form-lot-enseigne'); if (!f) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault(); const fd = new FormData(f);
      const lot = { id: 'l' + Date.now(), enseigne: etat.enseigne, titre: String(fd.get('titre')), categorie: String(fd.get('categorie')), motif: String(fd.get('motif')),
        prixReference: Number(fd.get('prixReference')), prixDestockage: Number(fd.get('prixDestockage')), fin: String(fd.get('fin')), photo: PHOTOS.atelier,
        magasins: [{ nom: String(fd.get('magasin')), cp: String(fd.get('cp')), stock: Number(fd.get('stock')) }] };
      const v = Z.verifierLot(lot, AUJOURDHUI);
      if (!v.ok) return toast(v.erreurs[0]);
      etat.lots.push(lot); sauver(); toast('Lot publié dans le déstockage.'); router();
    });
  }

  /* =====================================================================
     AGENDA : proposer et réserver des dates et heures (travaux, échanges, réparations, remises)
     ===================================================================== */
  const maintenant = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  const quand = (c) => { const d = new Date(c.slice(0, 10) + 'T12:00:00Z'); return `${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })} à ${c.slice(11, 13)} h ${c.slice(14, 16) === '00' ? '' : c.slice(14, 16)}`.trim(); };
  function nomContact(id) {
    if (!id) return 'à choisir';
    if (MEMBRES[id]) return MEMBRES[id].nom;
    const a = ARTISANS.find((x) => x.id === id); return a ? a.nom : 'membre ZETools';
  }
  const rdvConfirmes = () => etat.rdv.filter((r) => r.statut === 'confirmé');
  let selRdv = null;
  function initSelRdv(params) {
    const cle = params.toString();
    if (selRdv && selRdv.cle === cle) return;
    const a = params.get('annonce') ? annonce(params.get('annonce')) : null;
    const art = params.get('avec') ? ARTISANS.find((x) => x.id === params.get('avec')) : null;
    const type = params.get('type') || 'travaux';
    selRdv = { cle, type, avec: params.get('avec') || (a ? a.membre : ''), annonceId: a ? a.id : '', reponseA: params.get('reponse') || '',
      objet: params.get('objet') || (a ? `${Z.REGLES.typesRdv[type] || ''} · ${a.titre}` : art ? `${Z.REGLES.typesRdv[type]} avec ${art.nom}` : ''),
      mois: AUJOURDHUI.slice(0, 7), jour: '', creneaux: [], dureeHeures: type === 'travaux' ? 2 : 1 };
  }
  function calendrierRdv() {
    const [an, mo] = selRdv.mois.split('-').map(Number);
    const premier = new Date(Date.UTC(an, mo - 1, 1)); const nb = new Date(Date.UTC(an, mo, 0)).getUTCDate();
    const nomMois = premier.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    let cases = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j) => `<span>${j}</span>`).join('') + '<span></span>'.repeat((premier.getUTCDay() + 6) % 7);
    for (let j = 1; j <= nb; j++) {
      const t = `${an}-${String(mo).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
      const dim = new Date(t + 'T00:00:00Z').getUTCDay() === 0;
      const dis = t < AUJOURDHUI || dim || !Z.creneauxJour(t, { maintenant: maintenant() }).length;
      const cls = [dis ? 'passe' : '', t === selRdv.jour ? 'choisi' : '', selRdv.creneaux.some((c) => c.startsWith(t)) ? 'marque' : ''].join(' ');
      cases += `<button type="button" data-jour-rdv="${t}" class="${cls}" ${dis ? 'disabled' : ''}>${j}</button>`;
    }
    const pris = rdvConfirmes().map((r) => r.creneau);
    const slots = selRdv.jour ? Z.creneauxJour(selRdv.jour, { maintenant: maintenant(), pris }) : [];
    const max = Z.REGLES.rdv.maxCreneaux;
    return `<div class="rdv-grille"><div class="calendrier"><div class="tete"><button type="button" data-mois-rdv="-1" aria-label="Mois précédent">‹</button><span>${nomMois}</span><button type="button" data-mois-rdv="1" aria-label="Mois suivant">›</button></div><div class="jours">${cases}</div></div>
      <div><b>${selRdv.jour ? quand(selRdv.jour + 'T00:00').replace(/ à .*/, '') : 'Choisissez un jour'}</b>
        <div class="creneaux">${slots.map((s) => `<button type="button" data-creneau="${s.debut}" class="${selRdv.creneaux.includes(s.debut) ? 'choisi' : ''}" ${s.libre ? '' : 'disabled title="Déjà pris dans votre agenda"'}>${s.heure}</button>`).join('') || (selRdv.jour ? '<span class="discret">Plus de créneau ce jour-là.</span>' : '')}</div>
        <div class="choisis"><b>Vos propositions (${selRdv.creneaux.length}/${max})</b>${selRdv.creneaux.map((c) => `<span class="puce">${quand(c)} <button type="button" data-retirer="${c}" aria-label="Retirer">×</button></span>`).join('') || '<p class="discret">Proposez jusqu’à 3 créneaux : l’autre partie en choisit un.</p>'}</div></div></div>`;
  }
  function vueRendezVous(params) {
    initSelRdv(params);
    const s = selRdv;
    return `<div class="page"><div class="conteneur" style="max-width:980px">
      <div class="titre-section"><div><div class="surtitre">Agenda ZETools</div><h2>${s.reponseA ? 'Proposer d’autres dates' : 'Proposer un rendez-vous'}</h2><p>Choisissez des jours et des heures : votre interlocuteur accepte un créneau, et le rendez-vous s’ajoute à vos deux agendas.</p></div><a class="btn btn-contour" href="#/agenda">📅 Mon agenda</a></div>
      <form class="panneau formulaire" id="form-rdv">
        <label>Type<select name="type">${Object.entries(Z.REGLES.typesRdv).map(([k, v]) => `<option value="${k}" ${k === s.type ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Avec<input value="${esc(nomContact(s.avec))}" disabled></label>
        <label class="large">Objet<input name="objet" required maxlength="100" value="${esc(s.objet)}" placeholder="Ex. : pose d’une porte intérieure, échange ponceuse contre visseuse"></label>
        <label>Durée<select name="duree">${[1, 2, 4, 8].map((h) => `<option value="${h}" ${h === s.dureeHeures ? 'selected' : ''}>${h === 4 ? 'Demi-journée' : h === 8 ? 'Journée' : h + ' h'}</option>`).join('')}</select></label>
        <label>Lieu<select name="lieu"><option>Lieu public proche (conseillé pour un échange)</option><option ${s.type === 'travaux' ? 'selected' : ''}>À mon domicile (adresse transmise après confirmation)</option><option ${s.type === 'reparation' ? 'selected' : ''}>À l’atelier du professionnel</option><option>Visioconférence (premier contact, devis)</option></select></label>
        <div class="large" id="zone-calendrier">${calendrierRdv()}</div>
        <label class="large">Message<textarea name="message" rows="2" placeholder="Précisions utiles (accès, matériel à prévoir…). Vos coordonnées restent masquées."></textarea></label>
        <div class="large alerte alerte-info">Annulation gratuite jusqu’à ${Z.REGLES.rdv.annulationGratuiteHeures} h avant le rendez-vous. Au-delà, l’annulation est signalée sur votre profil.</div>
        <div class="large"><button class="btn btn-cta">Envoyer la proposition</button></div>
      </form></div></div>`;
  }
  function brancherRendezVous() {
    const f = document.getElementById('form-rdv');
    const zone = document.getElementById('zone-calendrier');
    const redessiner = () => { zone.innerHTML = calendrierRdv(); };
    zone.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.moisRdv) { const [a, m] = selRdv.mois.split('-').map(Number); const d = new Date(Date.UTC(a, m - 1 + Number(b.dataset.moisRdv), 1)); selRdv.mois = d.toISOString().slice(0, 7); }
      else if (b.dataset.jourRdv) selRdv.jour = b.dataset.jourRdv;
      else if (b.dataset.retirer) selRdv.creneaux = selRdv.creneaux.filter((c) => c !== b.dataset.retirer);
      else if (b.dataset.creneau) {
        const c = b.dataset.creneau;
        if (selRdv.creneaux.includes(c)) selRdv.creneaux = selRdv.creneaux.filter((x) => x !== c);
        else if (selRdv.creneaux.length >= Z.REGLES.rdv.maxCreneaux) return toast(`${Z.REGLES.rdv.maxCreneaux} créneaux au maximum : retirez-en un.`);
        else selRdv.creneaux = selRdv.creneaux.concat(c).sort();
      }
      redessiner();
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault(); const fd = new FormData(f);
      const rdv = { id: 'r' + Date.now(), sens: 'envoye', type: String(fd.get('type')), avec: selRdv.avec, annonceId: selRdv.annonceId, objet: String(fd.get('objet')),
        creneaux: selRdv.creneaux.slice(), dureeHeures: Number(fd.get('duree')), lieu: String(fd.get('lieu')), statut: 'proposé',
        message: Z.masquerCoordonnees(String(fd.get('message') || ''), false).texte };
      const v = Z.verifierProposition(rdv, maintenant());
      if (!v.ok) return toast(v.erreurs[0]);
      if (selRdv.reponseA) etat.rdv = etat.rdv.map((r) => (r.id === selRdv.reponseA ? Object.assign({}, r, { statut: 'contre-proposé' }) : r));
      etat.rdv.push(rdv); selRdv = null; sauver();
      toast('Proposition envoyée. Vous serez prévenu dès qu’un créneau est accepté.'); aller('#/agenda');
    });
  }
  let moisAgenda = null;
  function vueAgenda() {
    moisAgenda = moisAgenda || AUJOURDHUI.slice(0, 7);
    const [an, mo] = moisAgenda.split('-').map(Number);
    const premier = new Date(Date.UTC(an, mo - 1, 1)); const nb = new Date(Date.UTC(an, mo, 0)).getUTCDate();
    const nomMois = premier.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    let cases = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j) => `<span>${j}</span>`).join('') + '<span></span>'.repeat((premier.getUTCDay() + 6) % 7);
    for (let j = 1; j <= nb; j++) {
      const t = `${an}-${String(mo).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
      const conf = etat.rdv.some((r) => r.statut === 'confirmé' && r.creneau.startsWith(t));
      const prop = etat.rdv.some((r) => r.statut === 'proposé' && r.creneaux.some((c) => c.startsWith(t)));
      cases += `<button type="button" disabled class="${t < AUJOURDHUI ? 'passe' : ''} ${conf ? 'rdv-ok' : prop ? 'rdv-attente' : ''}">${j}</button>`;
    }
    const groupe = (titre, liste, rendu) => `<div class="panneau"><h3 style="margin-top:0">${titre} <span class="discret">(${liste.length})</span></h3>${liste.map(rendu).join('') || '<p class="discret">Rien pour le moment.</p>'}</div>`;
    const entete = (r) => `<div><span class="badge badge-echange">${esc(Z.REGLES.typesRdv[r.type])}</span> <b>${esc(r.objet)}</b><br><span class="discret">avec ${esc(nomContact(r.avec))} · ${r.dureeHeures >= 8 ? 'journée' : r.dureeHeures + ' h'} · ${esc(r.lieu)}${r.type === 'service' ? (r.assure ? ' · 🛡️ assurée' : ' · ⚠️ non assurée') : ''}</span>${r.message ? `<p class="citation">« ${esc(r.message)} »</p>` : ''}</div>`;
    const recus = etat.rdv.filter((r) => r.sens === 'recu' && r.statut === 'proposé');
    const envoyes = etat.rdv.filter((r) => r.sens === 'envoye' && r.statut === 'proposé');
    const confirmes = rdvConfirmes().slice().sort((a, b) => a.creneau.localeCompare(b.creneau));
    const autres = etat.rdv.filter((r) => ['annulé', 'refusé', 'contre-proposé'].includes(r.statut));
    return `<div class="page"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">Agenda</div><h2>Mes rendez-vous</h2><p>Travaux, échanges de matériel, réparations et remises d’outils : proposez des dates, acceptez un créneau, ajoutez-le à votre calendrier.</p></div><a class="btn btn-cta" href="#/rendez-vous?type=echange">＋ Proposer un rendez-vous</a></div>
      <div class="agenda"><div class="panneau"><div class="calendrier"><div class="tete"><button data-mois-agenda="-1" aria-label="Mois précédent">‹</button><span>${nomMois}</span><button data-mois-agenda="1" aria-label="Mois suivant">›</button></div><div class="jours">${cases}</div></div>
          <p class="legende"><span class="pastille-ok"></span> confirmé <span class="pastille-attente"></span> en attente</p></div>
        <div>
          ${groupe('À vous de répondre', recus, (r) => `<div class="rdv">${entete(r)}<div class="creneaux">${r.creneaux.map((c) => `<button class="btn btn-vert" data-accepter="${r.id}" data-c="${c}">✔ ${quand(c)}</button>`).join('')}</div>
            <div class="actions-rdv"><a class="btn btn-contour" href="#/rendez-vous?type=${r.type}&avec=${r.avec}&objet=${encodeURIComponent(r.objet)}&reponse=${r.id}">Proposer d’autres dates</a><button class="btn btn-contour" data-refuser="${r.id}">Refuser</button></div></div>`)}
          ${groupe('Confirmés', confirmes, (r) => `<div class="rdv rdv-confirme"><div class="date-rdv">${quand(r.creneau)}</div>${entete(r)}
            <div class="actions-rdv"><button class="btn btn-contour" data-ics="${r.id}">📅 Ajouter à mon calendrier</button><button class="btn btn-contour" data-annuler="${r.id}">Annuler</button></div></div>`)}
          ${groupe('En attente de réponse', envoyes, (r) => `<div class="rdv">${entete(r)}<div class="discret">Créneaux proposés : ${r.creneaux.map(quand).join(' · ')}</div>
            <div class="actions-rdv"><button class="btn btn-contour" data-simuler="${r.id}">Démo : simuler l’acceptation</button><button class="btn btn-contour" data-annuler="${r.id}">Annuler</button></div></div>`)}
          ${autres.length ? groupe('Historique', autres, (r) => `<div class="rdv rdv-passe">${entete(r)}<span class="discret">${esc(r.statut)}</span></div>`) : ''}
        </div></div></div></div>`;
  }
  function brancherAgenda() {
    const trouver = (id) => etat.rdv.find((r) => r.id === id);
    const maj = (id, chg) => { etat.rdv = etat.rdv.map((r) => (r.id === id ? Object.assign({}, r, chg) : r)); sauver(); router(); };
    const accepter = (r, c) => { const res = Z.confirmerRdv(r, c, etat.rdv); if (!res.ok) return toast(res.raison); maj(r.id, res.rdv); toast(`Rendez-vous confirmé : ${quand(c)}.`); };
    vue.querySelector('.page').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.moisAgenda) { const [a, m] = moisAgenda.split('-').map(Number); moisAgenda = new Date(Date.UTC(a, m - 1 + Number(b.dataset.moisAgenda), 1)).toISOString().slice(0, 7); router(); }
      else if (b.dataset.accepter) accepter(trouver(b.dataset.accepter), b.dataset.c);
      else if (b.dataset.simuler) { const r = trouver(b.dataset.simuler); accepter(r, r.creneaux[0]); }
      else if (b.dataset.refuser) { maj(b.dataset.refuser, { statut: 'refusé' }); toast('Proposition refusée.'); }
      else if (b.dataset.annuler) {
        const r = trouver(b.dataset.annuler);
        if (!Z.annulationGratuite(r, maintenant()) && !confirm('Moins de 24 h avant le rendez-vous : l’annulation sera signalée sur votre profil. Continuer ?')) return;
        maj(r.id, { statut: 'annulé' }); toast('Rendez-vous annulé, votre interlocuteur est prévenu.');
      } else if (b.dataset.ics) {
        const r = trouver(b.dataset.ics);
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(new Blob([Z.versIcs(r)], { type: 'text/calendar' }));
        lien.download = `zetools-${r.creneau.slice(0, 10)}.ics`; document.body.appendChild(lien); lien.click(); lien.remove();
      }
    });
  }

  /* =====================================================================
     SERVICES : un membre propose ses services, comme on propose un outil
     (fiche, tarif, calendrier de réservation à l'heure, offre de prix)
     ===================================================================== */
  const uniteService = (s) => (s.unite === 'forfait' ? ' le forfait' : ' / heure');
  const statutPrestataire = (s) => (s.siret ? 'Professionnel · SIRET vérifié' : 'Particulier · coup de main occasionnel');
  function carteService(s) {
    const m = membre(s.membre);
    return `<a class="carte" href="#/service/${s.id}">
      <div class="visuel">${s.photo ? `<img loading="lazy" src="${s.photo}" alt="${esc(s.titre)}">` : ''}
        <div class="badges"><span class="badge badge-service">Service</span>${s.siret ? '<span class="badge badge-vente">PRO</span>' : ''}${s.siret || s.assurePlateforme ? '<span class="badge badge-echange">🛡️ Assuré</span>' : ''}</div></div>
      <div class="infos"><span class="badge badge-etat" style="align-self:start">${metierIco(s.metier)} ${esc(metierNom(s.metier))}</span>
        <h3>${esc(s.titre)}</h3><div class="prix">${Z.euros(s.tarif)} <small>${uniteService(s)}</small></div>
        <div class="meta"><span>📍 ${esc(s.ville)} · ${s.rayonKm} km</span><span>★ ${m.note.toFixed(1)} (${m.avis})</span></div></div></a>`;
  }
  let filtreServices = { metier: '', q: '', lieu: '' };
  function vueServices() {
    const liste = Z.filtrerServices(tousServices(), filtreServices);
    const puce = (v, lib) => `<button class="puce ${filtreServices.metier === v ? 'active' : ''}" data-metier-service="${v}">${lib}</button>`;
    return `<section class="hero hero-court hero-video" style="background-image:url('${PHOTOS.artisans}')">${videoFond(VIDEOS.artisans)}<div class="conteneur">
        <div class="surtitre" style="color:var(--jaune)">Services entre voisins et professionnels</div>
        <h1>Pas le temps, pas la main ? <em>Réservez quelqu’un</em>.</h1>
        <p class="sous">Montage de meubles, fixations, jardinage, cours de bricolage : choisissez un prestataire, un jour et une heure. Vous payez en ligne, le prestataire est réglé une fois le service rendu.</p>
      </div></section>
      <div class="page"><div class="conteneur">
        <div class="titre-section"><div><h2>${liste.length} service${liste.length > 1 ? 's' : ''} près de chez vous</h2></div><a class="btn btn-cta" href="#/proposer-service">＋ Proposer mes services</a></div>
        <div class="puces" style="margin-bottom:20px">${puce('', 'Tous les métiers')}${METIERS.map((x) => puce(x.id, `${x.icone} ${x.nom}`)).join('')}</div>
        <div class="grille">${liste.map(carteService).join('') || '<div class="vide">Aucun service pour ce métier pour le moment. <a href="#/travaux">Publiez une demande de travaux</a> : les artisans abonnés vous répondent.</div>'}</div>
        <div class="panneau bandeau-action"><div><b>Un chantier plus important ?</b><br>Pour des travaux sur devis (plomberie, électricité, maçonnerie, rénovation), publiez gratuitement votre demande : les artisans vérifiés de votre secteur vous répondent.</div><a class="btn btn-contour" href="#/travaux">Trouver un artisan</a></div>
      </div></div>`;
  }
  function brancherServices() {
    vue.querySelectorAll('[data-metier-service]').forEach((b) => b.addEventListener('click', () => { filtreServices.metier = b.dataset.metierService; router(); }));
  }
  let selService = { id: null };
  function zoneService(s) {
    const [an, mo] = selService.mois.split('-').map(Number);
    const premier = new Date(Date.UTC(an, mo - 1, 1)); const nb = new Date(Date.UTC(an, mo, 0)).getUTCDate();
    const nomMois = premier.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    let cases = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j) => `<span>${j}</span>`).join('') + '<span></span>'.repeat((premier.getUTCDay() + 6) % 7);
    for (let j = 1; j <= nb; j++) {
      const t = `${an}-${String(mo).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
      const dis = t < AUJOURDHUI || !Z.creneauxJour(t, { maintenant: maintenant() }).length;
      cases += `<button type="button" data-jour-svc="${t}" class="${dis ? 'passe' : ''} ${t === selService.jour ? 'choisi' : ''}" ${dis ? 'disabled' : ''}>${j}</button>`;
    }
    const pris = rdvConfirmes().map((r) => r.creneau);
    const slots = selService.jour ? Z.creneauxJour(selService.jour, { maintenant: maintenant(), pris }) : [];
    const d = Z.devisService(s, selService.heures, { assurance: selService.assurance });
    const prixAssurance = Z.devisService(s, selService.heures, { assurance: true }).assurance;
    const heures = s.unite === 'forfait' ? '' : `<label class="ligne">Durée <select id="heures-svc">${Array.from({ length: Z.REGLES.service.heuresMax - (s.dureeMin || 1) + 1 }, (_, i) => i + (s.dureeMin || 1)).map((h) => `<option value="${h}" ${h === d.heures ? 'selected' : ''}>${h} h</option>`).join('')}</select></label>`;
    return `<div class="ligne"><span>Tarif</span><b>${Z.euros(s.tarif)}${uniteService(s)}</b></div>
      <div class="ligne discret"><span>${s.unite === 'forfait' ? `Forfait d’environ ${s.dureeForfait || 1} h` : `${s.dureeMin || 1} h minimum`} · se déplace à ${s.rayonKm} km</span><span></span></div>
      <div class="calendrier" style="margin:12px 0"><div class="tete"><button type="button" data-mois-svc="-1" aria-label="Mois précédent">‹</button><span>${nomMois}</span><button type="button" data-mois-svc="1" aria-label="Mois suivant">›</button></div><div class="jours">${cases}</div></div>
      ${selService.jour ? `<b style="text-transform:capitalize">${quand(selService.jour + 'T00:00').replace(/ à .*/, '')}</b><div class="creneaux">${slots.map((c) => `<button type="button" data-creneau-svc="${c.debut}" class="${selService.creneau === c.debut ? 'choisi' : ''}" ${c.libre ? '' : 'disabled title="Déjà pris dans votre agenda"'}>${c.heure}</button>`).join('') || '<span class="discret">Plus de créneau ce jour-là.</span>'}</div>` : '<div class="alerte alerte-info">Choisissez un jour dans le calendrier, puis une heure.</div>'}
      ${heures}
      ${selService.creneau ? `<div class="alerte alerte-ok" style="text-transform:none">${quand(selService.creneau)} · ${d.heures} h</div>
        <div class="ligne"><span>${d.forfait ? 'Forfait' : `${Z.euros(s.tarif)} × ${d.heures} h`}</span><span>${Z.euros(d.base)}</span></div>
        <div class="ligne"><span>Frais de service</span><span>${Z.euros(d.fraisService)}</span></div>
        <label class="ligne" style="cursor:pointer"><span><input type="checkbox" id="assurance-svc" ${selService.assurance ? 'checked' : ''}> <b>Je prends l’assurance</b> dommages</span><span>${Z.euros(prixAssurance)}</span></label>
        <div class="alerte ${d.couverture.assure ? 'alerte-ok' : 'alerte-erreur'}" style="text-transform:none">${d.couverture.assure ? '🛡️' : '⚠️'} ${esc(d.couverture.message)}${selService.assurance ? '' : ' L’assurance dommages ZETools couvre les dégâts causés chez vous pendant la prestation.'}</div>
        <div class="ligne total"><span>Total</span><span>${Z.euros(d.total)}</span></div>
        <div class="ligne discret"><span>Payé au prestataire une fois le service rendu</span><span>${Z.euros(d.versementPrestataire)}</span></div>
        ${blocCouponPaiement(d.total, selService.coupon, 'id="coupon-svc"')}
        <button class="btn btn-cta" style="width:100%;margin-top:10px" data-action="reserver-service">Réserver et payer ${Z.euros(resteService(d.total))}</button>` : ''}
      ${blocOffre(s, 'service')}
      <a class="btn btn-contour" style="width:100%;margin-top:10px" href="#/rendez-vous?type=service&avec=${s.membre}&objet=${encodeURIComponent(s.titre)}">📅 Proposer plusieurs créneaux au prestataire</a>`;
  }
  function resteService(total) {
    const c = couponsUtilisables().find((x) => x.code === selService.coupon);
    return c ? Z.utiliserCoupon(c, total, AUJOURDHUI, '').resteAPayer : total;
  }
  function vueService(id) {
    const s = Z.appliquerOffres(service(id), etat.offres, maintenant());
    if (!s) return '<div class="page"><div class="conteneur vide">Service introuvable. <a href="#/services">Retour aux services</a></div></div>';
    const m = membre(s.membre);
    if (selService.id !== id) selService = { id, mois: AUJOURDHUI.slice(0, 7), jour: '', creneau: '', heures: s.dureeMin || 1, assurance: false, coupon: '' };
    return `<div class="page"><div class="conteneur">
      <div class="fil"><a href="#/">Accueil</a> › <a href="#/services">Services</a> › ${esc(s.titre)}</div>
      <div class="fiche">
        <div>
          <div class="photo-principale">${s.photo ? `<img src="${s.photo.replace('w=900', 'w=1400')}" alt="${esc(s.titre)}">` : ''}</div>
          <div class="panneau" style="margin-top:16px">
            <h2 style="margin-top:0">Le service</h2><p>${esc(s.description)}</p>
            <div class="ligne"><span>Métier</span><b>${metierIco(s.metier)} ${esc(metierNom(s.metier))}</b></div>
            <div class="ligne"><span>Prestataire</span><b>${statutPrestataire(s)}${s.decennale ? ' · assurance décennale' : ''}</b></div>
            <div class="ligne"><span>Assurance</span><b>${s.siret ? '🛡️ Responsabilité civile professionnelle' : s.assurePlateforme ? '🛡️ Assuré par ZETools à chaque prestation' : '⚠️ Non assuré : prenez l’assurance à la réservation'}</b></div>
            <div class="ligne"><span>Outils</span><b>${s.outils ? 'Vient avec ses outils' : 'Sur vos outils (ou loués sur ZETools)'}</b></div>
            <div class="ligne"><span>Zone d’intervention</span><b>📍 ${esc(s.ville)} (${esc(s.cp)}) · ${s.rayonKm} km autour</b></div>
            ${(s.inclus || []).length ? `<h3>Compris dans le prix</h3><ul class="liste-avantages">${s.inclus.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
            ${s.siret ? '' : '<p class="note-legale">Service proposé par un particulier, à titre occasionnel : pas de facture professionnelle ni de garantie décennale. Pour des travaux réglementés (électricité, plomberie, gros œuvre), choisissez un professionnel.</p>'}
          </div>
        </div>
        <div>
          <div class="panneau">
            <div class="badges" style="display:flex;gap:6px;flex-wrap:wrap"><span class="badge badge-service">Service ${Z.euros(s.tarif)}${uniteService(s)}</span><span class="badge badge-etat">${esc(metierNom(s.metier))}</span></div>
            <h1>${esc(s.titre)}</h1>
            <div class="vendeur" style="margin-top:12px"><div class="avatar">${initiales(m.nom)}</div><div><b>${esc(m.nom)}</b>${s.siret ? ' <span class="badge badge-vente">PRO</span>' : ''}<br><span class="verifie">✔ Profil vérifié</span> · ★ ${m.note.toFixed(1)} (${m.avis} avis)</div></div>
            <div id="zone-service" style="margin-top:14px">${zoneService(s)}</div>
          </div>
          <div class="panneau"><b>💬 Une question ?</b><p style="margin:6px 0 10px;color:var(--texte-doux)">Écrivez au prestataire. Téléphone, e-mail et adresse restent masqués jusqu’à la réservation.</p><a class="btn btn-contour" href="#/messages?annonce=${s.id}">Envoyer un message</a></div>
        </div>
      </div></div></div>`;
  }
  function brancherService(id) {
    const zone = document.getElementById('zone-service'); if (!zone) return;
    const courant = () => Z.appliquerOffres(service(id), etat.offres, maintenant());
    const rafraichir = () => { zone.innerHTML = zoneService(courant()); };
    zone.addEventListener('change', (e) => {
      if (e.target.id === 'heures-svc') { selService.heures = Number(e.target.value); rafraichir(); }
      if (e.target.id === 'assurance-svc') { selService.assurance = e.target.checked; rafraichir(); }
      if (e.target.id === 'coupon-svc') { selService.coupon = e.target.value; rafraichir(); }
    });
    zone.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const s = courant();
      if (b.dataset.moisSvc) { const [a, m] = selService.mois.split('-').map(Number); const n = new Date(Date.UTC(a, m - 1 + Number(b.dataset.moisSvc), 1)).toISOString().slice(0, 7); if (n >= AUJOURDHUI.slice(0, 7)) selService.mois = n; return rafraichir(); }
      if (b.dataset.jourSvc) { selService.jour = b.dataset.jourSvc; selService.creneau = ''; return rafraichir(); }
      if (b.dataset.creneauSvc) { selService.creneau = b.dataset.creneauSvc; return rafraichir(); }
      if (b.dataset.action === 'offrir') {
        const base = service(id); const montant = Number(document.getElementById('montant-offre').value);
        const v = Z.verifierOffre(base, 'service', montant, etat.offres.filter((x) => x.sens === 'envoyee' && x.annonceId === id && x.mode === 'service').length);
        if (!v.ok) return toast(v.raison);
        etat.offres.push(Z.creerOffre(base, 'service', montant, maintenant())); sauver();
        toast(`Offre de ${Z.euros(montant)} envoyée. Réponse sous 48 h.`); return aller('#/offres');
      }
      if (b.dataset.action === 'reserver-service') {
        const d = Z.devisService(s, selService.heures, { assurance: selService.assurance });
        const rdv = { id: 'r' + Date.now(), sens: 'envoye', type: 'service', assure: d.couverture.assure, assuranceClient: !!selService.assurance, avec: s.membre, serviceId: s.id, objet: s.titre, creneaux: [selService.creneau], dureeHeures: d.heures,
          lieu: 'À mon domicile (adresse transmise après réservation)', statut: 'proposé', montant: d.total, message: '' };
        const v = Z.verifierProposition(rdv, maintenant()); if (!v.ok) return toast(v.erreurs[0]);
        const c = Z.confirmerRdv(rdv, selService.creneau, etat.rdv); if (!c.ok) return toast(c.raison);
        let mot = '';
        if (selService.coupon) {
          const i = etat.coupons.findIndex((x) => x.code === selService.coupon);
          const u = i >= 0 ? Z.utiliserCoupon(etat.coupons[i], d.total, AUJOURDHUI, s.titre) : { ok: false, raison: 'Bon cadeau introuvable.' };
          if (!u.ok) return toast(u.raison);
          etat.coupons[i] = u.coupon; c.rdv.coupon = { code: u.coupon.code, debit: u.debit };
          mot = ` dont ${Z.euros(u.debit)} par bon cadeau (solde restant ${Z.euros(u.coupon.solde)})`;
        }
        etat.rdv.push(c.rdv); deverrouillerConversation(s.id); sauver();
        toast(`Prestation réservée (simulation) : ${Z.euros(d.total)} payés${mot} et conservés jusqu’à la fin du service${selService.assurance ? ', assurance dommages incluse' : ''}.`);
        selService = { id: null }; aller('#/agenda');
      }
    });
  }
  function vueProposerService() {
    return `<div class="page"><div class="conteneur" style="max-width:820px">
      <div class="titre-section"><div><div class="surtitre">Services</div><h2>Proposer mes services</h2><p>Gratuit. Vous fixez votre tarif, vos clients réservent un jour et une heure, vous êtes payé une fois le service rendu.</p></div></div>
      <form class="panneau formulaire" id="form-service">
        <label class="large">Votre service<input name="titre" required maxlength="80" placeholder="Ex. : Montage de meubles en kit, pose de tringles, tonte de pelouse"></label>
        <label>Métier<select name="metier" required>${METIERS.map((x) => `<option value="${x.id}">${x.icone} ${x.nom}</option>`).join('')}</select></label>
        <label>Vous êtes<select name="statut"><option value="particulier">Un particulier (coups de main occasionnels)</option><option value="pro">Un professionnel (SIRET)</option></select></label>
        <label>Tarif (€)<input name="tarif" type="number" min="1" step="0.5" required placeholder="25"></label>
        <label>Facturé<select name="unite"><option value="heure">à l’heure</option><option value="forfait">au forfait</option></select></label>
        <label>Durée minimum, ou durée du forfait (h)<input name="duree" type="number" min="1" max="8" step="1" value="1"></label>
        <label>Code postal<input name="cp" required pattern="\\d{5}" placeholder="94300"></label>
        <label>Rayon de déplacement (km)<input name="rayon" type="number" min="1" max="50" value="10"></label>
        <label class="case"><input type="checkbox" name="outils" checked> Je viens avec mes outils</label>
        <label class="large case"><input type="checkbox" name="assurePlateforme"> <span><b>Je prends l’assurance</b> responsabilité civile ZETools : ${Math.round(Z.REGLES.service.assurancePrestataireTaux * 100)} % déduits de chaque prestation, et le badge « Assuré » sur mon annonce. Conseillé si vous êtes un particulier, sans assurance professionnelle.</span></label>
        <label class="large">Description<textarea name="description" rows="4" placeholder="Votre expérience, ce qui est compris, ce qui ne l’est pas… (vos coordonnées seront masquées)"></textarea></label>
        <div class="large alerte alerte-info" id="aide-service">Particulier : seuls les petits services occasionnels sont ouverts (petit bricolage, montage, jardinage, cours). L’électricité, la plomberie et la maçonnerie sont réservées aux professionnels qualifiés, avec SIRET. Vos revenus sont à déclarer ; une activité régulière suppose un statut professionnel (micro-entreprise).</div>
        <div class="large"><button class="btn btn-cta">Publier mon service</button></div>
      </form></div></div>`;
  }
  function brancherProposerService() {
    const f = document.getElementById('form-service');
    f.addEventListener('submit', (e) => {
      e.preventDefault(); const fd = new FormData(f); const cp = String(fd.get('cp')); const forfait = fd.get('unite') === 'forfait';
      const pos = Z.positionCodePostal(cp);
      const s = { id: 'us' + Date.now(), modes: ['service'], titre: String(fd.get('titre')), metier: String(fd.get('metier')), membre: 'moi', siret: fd.get('statut') === 'pro',
        tarif: Number(fd.get('tarif')), unite: String(fd.get('unite')), dureeMin: forfait ? 1 : Number(fd.get('duree')) || 1, dureeForfait: forfait ? Number(fd.get('duree')) || 1 : undefined,
        ville: pos ? pos.libelle : 'Île-de-France', cp, rayonKm: Number(fd.get('rayon')) || 10, outils: fd.get('outils') === 'on', assurePlateforme: fd.get('assurePlateforme') === 'on', photo: PHOTOS.artisans,
        description: Z.masquerCoordonnees(String(fd.get('description') || ''), false).texte, inclus: [] };
      const v = Z.verifierService(s);
      if (!v.ok) return toast(v.erreurs[0]);
      etat.services.push(s); sauver(); toast('Service publié.'); aller('#/service/' + s.id);
    });
  }

  /* =====================================================================
     FICHES TECHNIQUES : guides pas à pas, téléchargeables en PDF
     ===================================================================== */
  const { FICHES, SITE_PUBLIC } = window.ZT_DONNEES;
  const urlFiche = (f) => `${SITE_PUBLIC}#/fiche-technique/${f.id}`;
  const minSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  // façade : aucune requête vers YouTube avant le clic (pas de cookie déposé sans action du visiteur)
  function facadeVideo(v) {
    return `<div class="video-facade">
      <button class="btn btn-cta btn-lire" data-lire="${esc(v.yt)}" aria-label="Lire la vidéo ${esc(v.titre)}">▶ Lire la vidéo</button>
      <div class="video-titre">« ${esc(v.titre)} »<br><span>${esc(v.chaine)} · YouTube</span></div>
      <p class="video-consentement">La vidéo est hébergée par YouTube (Google). Rien n’est chargé avant votre clic ; en la lançant, vous acceptez les cookies de YouTube. <a href="#/legal/confidentialite">En savoir plus</a></p>
    </div>`;
  }
  function blocVideo(f) {
    const vs = f.videos || []; if (!vs.length) return '';
    const v = vs[0];
    return `<section class="bloc-video" aria-labelledby="titre-video">
      <div class="bloc-video-tete"><h3 id="titre-video">▶ La fiche en vidéo</h3><a class="discret" href="https://www.youtube.com/watch?v=${esc(v.yt)}" target="_blank" rel="noopener" data-lien-yt>Ouvrir sur YouTube ↗</a></div>
      <div class="bloc-video-corps">
        <div class="video-cadre" data-cadre>${facadeVideo(v)}</div>
        <aside class="video-telephone">${window.ZT_QR.qrSvg(urlFiche(f), 112)}<b>Sur votre téléphone</b><span>Scannez pour suivre la fiche et sa vidéo pendant le travail.</span></aside>
      </div>
      ${vs.length > 1 ? `<div class="video-choix"><span class="discret">Autres vidéos :</span>${vs.map((x, i) => `<button class="puce${i ? '' : ' active'}" data-choix-video="${i}">${esc(x.chaine)}</button>`).join('')}</div>` : ''}
      <p class="note-legale">${v.debuts ? 'Cliquez sur ▶ à côté d’une étape pour aller directement au bon moment de la vidéo.' : 'Vidéo choisie par ZETools sur une chaîne reconnue, mais non produite par ZETools : elle peut différer légèrement des étapes de la fiche. Bientôt, les <b>Tutos ZETOOLS</b> : une courte séquence filmée pour chaque étape.'}</p>
    </section>`;
  }
  function carteFiche(f) {
    return `<a class="carte carte-fiche" href="#/fiche-technique/${f.id}">
      <div class="visuel visuel-fiche"><span>${f.icone}</span><div class="badges"><span class="badge badge-location">PDF gratuit</span>${(f.videos || []).length ? '<span class="badge badge-echange">▶ Vidéo</span>' : ''}</div></div>
      <div class="infos"><span class="badge badge-etat" style="align-self:start">${esc(f.theme)} · ${esc(f.niveau)}</span>
        <h3>${esc(f.titre)}</h3><div class="meta"><span>⏱ ${esc(f.duree)}</span><span>${f.etapes.length} étapes</span></div></div></a>`;
  }
  function telechargerFiche(id) {
    const f = FICHES.find((x) => x.id === id); if (!f) return;
    const P = window.ZT_PDF; const J = window.ZT_JURIDIQUE;
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([P.octets(P.fichePdf(f, J && J.SOCIETE, { url: urlFiche(f) }))], { type: 'application/pdf' }));
    lien.download = P.nomFichier(f); document.body.appendChild(lien); lien.click(); lien.remove();
    toast('Fiche téléchargée en PDF.');
  }
  function vueFiches() {
    return `<div class="page"><div class="conteneur">
      <div class="titre-section"><div><div class="surtitre">L’Atelier · fiches techniques</div><h2>Apprenez à le faire vous-même</h2><p>Des fiches pas à pas, gratuites, à télécharger en PDF et à imprimer : outils, fournitures, étapes, sécurité. Chaque outil cité se loue ou s’achète d’occasion sur ZETools.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-cta" href="#/videos">🎬 La vidéothèque</a><a class="btn btn-contour" href="#/atelier">Les articles de L’Atelier</a></div></div>
      <div class="grille">${FICHES.map(carteFiche).join('')}</div>
      <div class="panneau bandeau-action"><div><b>Pas envie de le faire vous-même ?</b><br>Un voisin ou un professionnel s’en charge, à l’heure ou au forfait.</div><a class="btn btn-cta" href="#/services">Voir les services</a></div>
    </div></div>`;
  }
  function vueFicheTechnique(id) {
    const f = FICHES.find((x) => x.id === id);
    if (!f) return '<div class="page"><div class="conteneur vide">Fiche introuvable. <a href="#/fiches">Toutes les fiches techniques</a></div></div>';
    const liste = (items, ord) => `<${ord ? 'ol' : 'ul'} class="liste-fiche">${items.map((x) => `<li>${x}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`;
    return `<div class="page"><div class="conteneur" style="max-width:900px">
      <div class="fil"><a href="#/">Accueil</a> › <a href="#/fiches">Fiches techniques</a> › ${esc(f.titre)}</div>
      <article class="panneau fiche-technique" data-fiche="${f.id}">
        <div class="marque-fiche">${window.ZT_PDF.logoSvg(26)}<span><b class="marque-ze">ZE</b><b>TOOLS</b> · fiche technique</span></div>
        <div class="entete-fiche"><span class="icone-fiche">${f.icone}</span><div><div class="surtitre">Fiche technique · ${esc(f.theme)}</div><h1>${esc(f.titre)}</h1>
          <div class="puces"><span class="puce">Niveau : ${esc(f.niveau)}</span><span class="puce">⏱ ${esc(f.duree)}</span><span class="puce">Budget : ${esc(f.budget)}</span></div></div></div>
        <p class="resume-fiche">${esc(f.resume)}</p>
        ${blocVideo(f)}
        <button class="btn btn-cta" data-pdf="${f.id}">📄 Télécharger la fiche en PDF</button>
        <h3>Outils nécessaires</h3>
        <ul class="liste-fiche">${f.outils.map((o) => `<li>${esc(o.nom)}${o.q ? ` · <a href="#/annonces?q=${encodeURIComponent(o.q)}">louer ou acheter d’occasion</a>` : ''}</li>`).join('')}</ul>
        ${f.materiaux.length ? `<h3>Matériaux et fournitures</h3>${liste(f.materiaux.map(esc))}` : ''}
        <h3>Étapes</h3><ol class="etapes-picto">${f.etapes.map((e, i) => `<li><span class="case-picto">${window.ZT_PDF.pictoSvg((f.pictos || [])[i])}</span><span><b>${i + 1}.</b> ${esc(e)}${(f.videos || [])[0] && f.videos[0].debuts && f.videos[0].debuts[i] != null ? ` <button class="lien-etape" data-lire="${esc(f.videos[0].yt)}" data-debut="${f.videos[0].debuts[i]}">▶ ${minSec(f.videos[0].debuts[i])}</button>` : ''}</span></li>`).join('')}</ol>
        <h3>Sécurité</h3>${liste(f.securite.map(esc))}
        ${f.astuce ? `<div class="alerte alerte-info"><b>L’astuce du bricoleur.</b> ${esc(f.astuce)}</div>` : ''}
        <p class="note-legale">Fiche indicative rédigée par ZETools. Suivez toujours la notice du fabricant de vos outils et de vos fournitures. En cas de doute, faites appel à un professionnel.</p>
        <div class="actions-rdv"><button class="btn btn-cta" data-pdf="${f.id}">📄 Télécharger en PDF</button><a class="btn btn-contour" href="#/services">Le faire faire par un prestataire</a><a class="btn btn-contour" href="#/fiches">Toutes les fiches</a></div>
      </article></div></div>`;
  }
  function brancherFicheTechnique() {
    vue.querySelectorAll('[data-pdf]').forEach((b) => b.addEventListener('click', () => telechargerFiche(b.dataset.pdf)));
    const art = vue.querySelector('[data-fiche]'); if (!art) return;
    const f = FICHES.find((x) => x.id === art.dataset.fiche);
    const cadre = art.querySelector('[data-cadre]'); if (!f || !cadre) return;
    const lire = (yt, debut) => {
      const v = f.videos.find((x) => x.yt === yt) || f.videos[0];
      cadre.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.yt)}?rel=0&autoplay=1${debut ? `&start=${debut}` : ''}" title="${esc(v.titre)} · ${esc(v.chaine)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      cadre.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    art.addEventListener('click', (e) => {   // l'article est recréé à chaque affichage : pas d'écouteur en double
      const b = e.target.closest('[data-lire]'); if (b) { lire(b.dataset.lire, Number(b.dataset.debut) || 0); return; }
      const c = e.target.closest('[data-choix-video]'); if (!c) return;
      const v = f.videos[Number(c.dataset.choixVideo)];
      cadre.innerHTML = facadeVideo(v);
      const lien = art.querySelector('[data-lien-yt]'); if (lien) lien.href = `https://www.youtube.com/watch?v=${v.yt}`;
      art.querySelectorAll('[data-choix-video]').forEach((x) => x.classList.toggle('active', x === c));
    });
  }

  /* =====================================================================
     OFFRES DE PRIX : chacun propose son prix, l'autre accepte, refuse ou contre-propose
     ===================================================================== */
  function vueOffres() {
    const M = maintenant();
    const unite = (o) => (o.mode === 'location' ? ' / jour' : '');
    const etiquette = (o) => { const st = Z.offreExpiree(o, M) ? 'expirée' : o.statut; return `<span class="badge ${st === 'acceptée' ? 'badge-echange' : st === 'refusée' || st === 'expirée' ? 'badge-vente' : 'badge-location'}">${st}</span>`; };
    const tete = (o) => `<div><b>${esc(o.titre)}</b> ${etiquette(o)}<br><span class="discret">${{ vente: 'Achat', location: 'Location', service: 'Service' }[o.mode]} · prix affiché ${Z.euros(o.prixAffiche)}${unite(o)} · ${o.sens === 'recue' ? 'offre de' : o.mode === 'service' ? 'prestataire :' : 'propriétaire :'} ${esc(nomContact(o.avec))}</span></div>`;
    const montants = (o) => `<div class="montants"><span>Offre <b>${Z.euros(o.montant)}${unite(o)}</b> <small>(−${Z.remiseSurNeuf(o.montant, o.prixAffiche)} %)</small></span>${o.contre ? `<span>Contre-proposition <b>${Z.euros(o.contre)}${unite(o)}</b></span>` : ''}${o.prixFinal ? `<span class="final">Prix convenu <b>${Z.euros(o.prixFinal)}${unite(o)}</b></span>` : ''}</div>`;
    const vivante = (o) => !Z.offreExpiree(o, M);
    const recue = (o) => `<div class="rdv">${tete(o)}${montants(o)}${o.statut === 'en attente' && vivante(o) ? `<div class="actions-rdv"><button class="btn btn-vert" data-offre="${o.id}" data-reponse="accepter">✔ Accepter ${Z.euros(o.montant)}</button>
        <span class="offre-saisie"><input type="number" step="0.5" min="${o.montant}" max="${o.prixAffiche}" placeholder="Mon prix" aria-label="Contre-proposition" data-contre="${o.id}"><button class="btn btn-contour" data-offre="${o.id}" data-reponse="contre">Contre-proposer</button></span>
        <button class="btn btn-contour" data-offre="${o.id}" data-reponse="refuser">Refuser</button></div>` : o.statut === 'contre-offre' && vivante(o) ? '<span class="discret">En attente de la réponse de l’acheteur.</span>' : ''}</div>`;
    const envoyee = (o) => `<div class="rdv">${tete(o)}${montants(o)}<div class="actions-rdv">${!vivante(o) ? '' : o.statut === 'en attente' ? `<button class="btn btn-contour" data-offre="${o.id}" data-reponse="demo">Démo : simuler la réponse du propriétaire</button><button class="btn btn-contour" data-offre="${o.id}" data-reponse="refuser">Retirer mon offre</button>`
        : o.statut === 'contre-offre' ? `<button class="btn btn-vert" data-offre="${o.id}" data-reponse="accepter">✔ Accepter ${Z.euros(o.contre)}</button><button class="btn btn-contour" data-offre="${o.id}" data-reponse="refuser">Refuser</button>`
        : o.statut === 'acceptée' ? `<a class="btn btn-cta" href="#/${o.mode === 'service' ? 'service' : 'annonce'}/${o.annonceId}">${o.mode === 'vente' ? 'Payer' : 'Réserver'} au prix convenu</a>` : ''}</div></div>`;
    const recues = etat.offres.filter((o) => o.sens === 'recue'), envoyees = etat.offres.filter((o) => o.sens === 'envoyee');
    return `<div class="page"><div class="conteneur" style="max-width:900px">
      <div class="titre-section"><div><div class="surtitre">Négociation</div><h2>Offres de prix</h2><p>Proposez votre prix sur une annonce : le propriétaire accepte, refuse ou vous fait une contre-proposition. Si vous êtes d’accord, la vente ou la location se conclut au prix convenu, avec le même paiement sécurisé.</p></div><a class="btn btn-cta" href="#/annonces">Trouver un outil</a></div>
      <div class="panneau"><h3 style="margin-top:0">Offres reçues sur mes annonces <span class="discret">(${recues.length})</span></h3>${recues.map(recue).join('') || '<p class="discret">Aucune offre reçue.</p>'}</div>
      <div class="panneau"><h3 style="margin-top:0">Mes offres envoyées <span class="discret">(${envoyees.length})</span></h3>${envoyees.map(envoyee).join('') || '<p class="discret">Vous n’avez pas encore fait d’offre. Sur une annonce, cliquez sur « Proposer mon prix ».</p>'}</div>
      <div class="alerte alerte-info">Règles : une offre ne peut pas être inférieure à ${Math.round(Z.REGLES.offres.plancher * 100)} % du prix affiché ; ${Z.REGLES.offres.maxParAnnonce} offres au plus par annonce ; chaque offre vaut ${Z.REGLES.offres.validiteHeures} h et engage son auteur pendant ce délai. Un prix accepté reste réservé ${Z.REGLES.offres.validiteHeures} h.</div>
    </div></div>`;
  }
  function brancherOffres() {
    vue.querySelector('.page').addEventListener('click', (e) => {
      const b = e.target.closest('[data-offre]'); if (!b) return;
      const o = etat.offres.find((x) => x.id === b.dataset.offre); const M = maintenant();
      let r;
      if (b.dataset.reponse === 'demo') r = Z.reponseVendeurDemo(o, M);
      else if (b.dataset.reponse === 'contre') r = Z.repondreOffre(o, 'contre', M, Number(vue.querySelector(`[data-contre="${o.id}"]`).value));
      else r = Z.repondreOffre(o, b.dataset.reponse, M);
      if (!r.ok) return toast(r.raison);
      etat.offres = etat.offres.map((x) => (x.id === o.id ? r.offre : x)); sauver();
      toast({ 'acceptée': `Accord conclu à ${Z.euros(r.offre.prixFinal)}.`, 'refusée': 'Offre refusée.', 'contre-offre': `Contre-proposition de ${Z.euros(r.offre.contre)} envoyée.` }[r.offre.statut]); router();
    });
  }

  /* =====================================================================
     VIDÉOTHÈQUE : regarder les tutoriels sur ZETools, sans quitter le site
     ===================================================================== */
  const { TYPES_URGENCE, THEMES_VIDEO, VIDEOS_TUTOS, THEME_FICHE, THEMES_COUPON, PROCHES } = window.ZT_DONNEES;
  let consentementYt = false;   // en mémoire seulement : redemandé à chaque visite
  const iframeYt = (v, auto) => `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.yt)}?rel=0${auto ? '&autoplay=1' : ''}" title="${esc(v.titre)} · ${esc(v.chaine)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  function toutesVideos() {
    const vus = new Set(), liste = [];
    FICHES.forEach((f) => (f.videos || []).forEach((v) => { if (!vus.has(v.yt)) { vus.add(v.yt); liste.push(Object.assign({ theme: THEME_FICHE[f.id] || 'montage', fiche: f }, v)); } }));
    VIDEOS_TUTOS.forEach((v) => { if (!vus.has(v.yt)) { vus.add(v.yt); liste.push(Object.assign({}, v)); } });
    return liste;
  }
  const themeVideo = (id) => THEMES_VIDEO.find((t) => t.id === id) || { nom: '', icone: '▶' };
  let selVideo = { theme: '', yt: '' };
  function vueVideos(params) {
    if (params.get('theme') !== null) selVideo.theme = params.get('theme');
    if (params.get('v')) selVideo.yt = params.get('v');
    const toutes = toutesVideos();
    const liste = toutes.filter((v) => !selVideo.theme || v.theme === selVideo.theme);
    const v = toutes.find((x) => x.yt === selVideo.yt) || liste[0] || toutes[0];
    selVideo.yt = v.yt;
    const tuile = (x) => `<button class="tuile-video${x.yt === v.yt ? ' en-cours' : ''}" data-video="${esc(x.yt)}" aria-label="Regarder : ${esc(x.titre)}">
        <span class="tuile-visuel"><span class="tuile-ico">${themeVideo(x.theme).icone}</span><span class="tuile-play">▶</span>${x.duree ? `<span class="tuile-duree">${esc(x.duree)}</span>` : ''}</span>
        <span class="tuile-texte"><b>${esc(x.titre)}</b><span>${esc(x.chaine)}${x.fiche ? ' · fiche PDF' : ''}</span></span></button>`;
    return `<section class="hero hero-court" style="background:var(--anthracite)"><div class="conteneur">
        <div class="surtitre" style="color:var(--jaune)">Vidéothèque ZETOOLS</div>
        <h1>Regardez, <em>puis faites-le</em> vous-même.</h1>
        <p class="sous">${toutes.length} tutoriels choisis sur des chaînes reconnues, à regarder ici même : montage, perçage, peinture, entretien des outils, jardin et bons gestes d’urgence.</p>
      </div></section>
      <div class="page"><div class="conteneur">
        <div class="filtres-videos" role="group" aria-label="Thèmes">
          <button class="puce${selVideo.theme ? '' : ' active'}" data-theme-video="">Toutes (${toutes.length})</button>
          ${THEMES_VIDEO.map((t) => `<button class="puce${selVideo.theme === t.id ? ' active' : ''}" data-theme-video="${t.id}">${t.icone} ${esc(t.nom)} (${toutes.filter((x) => x.theme === t.id).length})</button>`).join('')}
        </div>
        <div class="videotheque">
          <div class="lecteur-colonne">
            <div class="video-cadre" id="lecteur">${consentementYt ? iframeYt(v, false) : facadeVideo(v)}</div>
            <div class="panneau lecteur-infos">
              <div class="surtitre">${themeVideo(v.theme).icone} ${esc(themeVideo(v.theme).nom)}</div>
              <h2 style="margin:4px 0 6px">${esc(v.titre)}</h2>
              <p class="discret" style="margin:0 0 10px">${esc(v.chaine)}${v.duree ? ` · ${esc(v.duree)}` : ''} · vidéo YouTube intégrée, non produite par ZETools</p>
              <div class="actions-rdv">
                ${v.fiche ? `<a class="btn btn-cta" href="#/fiche-technique/${v.fiche.id}">📄 La fiche pas à pas : ${esc(v.fiche.titre)}</a>` : ''}
                ${v.urgence ? `<a class="btn btn-cta" href="#/urgence?type=${v.urgence}">🚨 Trouver un professionnel d’urgence</a>` : ''}
                <a class="btn btn-contour" href="#/services">Le faire faire par un prestataire</a>
                <a class="btn btn-contour" href="https://www.youtube.com/watch?v=${esc(v.yt)}" target="_blank" rel="noopener">Ouvrir sur YouTube ↗</a>
              </div>
            </div>
          </div>
          <div class="liste-videos">${liste.map(tuile).join('') || '<div class="vide">Aucune vidéo dans ce thème.</div>'}</div>
        </div>
        <p class="note-legale">Les vidéos sont hébergées par YouTube (Google) et intégrées en mode « confidentialité renforcée » : rien n’est chargé avant votre premier clic sur « Lire ». Les vignettes ci-dessus sont dessinées par ZETools, sans appel à YouTube. <a href="#/legal/confidentialite">En savoir plus</a></p>
      </div></div>`;
  }
  function brancherVideos() {
    const cadre = document.getElementById('lecteur'); if (!cadre) return;
    const redessiner = (lire) => {
      vue.innerHTML = vueVideos(new URLSearchParams()); brancherVideos();
      const v = toutesVideos().find((x) => x.yt === selVideo.yt);
      const c = document.getElementById('lecteur');
      if (lire && consentementYt) c.innerHTML = iframeYt(v, true);
      return c;
    };
    vue.querySelector('.filtres-videos').addEventListener('click', (e) => {
      const b = e.target.closest('[data-theme-video]'); if (!b) return;
      selVideo.theme = b.dataset.themeVideo; selVideo.yt = ''; redessiner(false);
    });
    vue.querySelector('.videotheque').addEventListener('click', (e) => {
      const lire = e.target.closest('[data-lire]');
      if (lire) { consentementYt = true; const v = toutesVideos().find((x) => x.yt === lire.dataset.lire); cadre.innerHTML = iframeYt(v, true); return; }
      const t = e.target.closest('[data-video]'); if (!t) return;
      selVideo.yt = t.dataset.video;
      redessiner(true).scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* =====================================================================
     URGENCE TRAVAUX : un professionnel d'astreinte, le prix affiché avant le déplacement
     ===================================================================== */
  etat.urgences = etat.urgences || [];
  etat.coupons = etat.coupons || [];
  let selUrg = { type: '', artisan: 'premier', coupon: '' };
  const typeUrg = (id) => TYPES_URGENCE.find((t) => t.id === id);
  const couponsUtilisables = () => etat.coupons.filter((c) => c.solde > 0 && !Z.couponExpire(c, AUJOURDHUI));
  function blocCouponPaiement(montant, choisi, attribut) {
    const cs = couponsUtilisables(); if (!cs.length) return '';
    const c = cs.find((x) => x.code === choisi);
    const u = c ? Z.utiliserCoupon(c, montant, AUJOURDHUI, '') : null;
    return `<label class="ligne coupon-paiement"><span>🎁 Payer avec un bon cadeau</span><select ${attribut}><option value="">Non merci</option>${cs.map((x) => `<option value="${x.code}" ${x.code === choisi ? 'selected' : ''}>${x.code} · solde ${Z.euros(x.solde)}</option>`).join('')}</select></label>
      ${u ? `<div class="ligne"><span>Bon cadeau ${esc(c.code)}</span><span>− ${Z.euros(u.debit)}</span></div><div class="ligne total"><span>Reste à payer</span><span>${Z.euros(u.resteAPayer)}</span></div>` : ''}`;
  }
  function vueUrgence(params) {
    if (params.get('type') !== null) { selUrg.type = params.get('type'); selUrg.artisan = 'premier'; }
    const t = typeUrg(selUrg.type);
    const enCours = etat.urgences.filter((u) => u.statut !== 'terminée').slice(-1)[0];
    const M = maintenant();
    const res = t && !t.danger && posClient ? Z.artisansUrgence(posClient, artisansAbonnes(), t.metier) : [];
    if (selUrg.artisan !== 'premier' && !res.some((x) => x.artisan.id === selUrg.artisan)) selUrg.artisan = 'premier';
    const sollicites = res.slice(0, Z.REGLES.urgence.maxSollicites);
    const videoGeste = t ? VIDEOS_TUTOS.find((v) => v.urgence === t.id) : null;
    const maj = Z.majorationUrgence(M);
    const carteUrg = (x) => {
      const a = x.artisan, d = Z.devisUrgence(a, M, 1);
      return `<div class="artisan-carte urgence-carte${selUrg.artisan === a.id ? ' choisi' : ''}">
        <div class="vendeur"><div class="avatar">${initiales(a.nom)}</div><div style="flex:1"><b>${esc(a.nom)}</b> <span class="badge badge-echange">Pro vérifié</span><br>
          <span class="verifie">✔ SIRET${a.decennale ? ' · ✔ Décennale' : ''}</span> · ★ ${a.note.toFixed(1)} (${a.avis})</div>
          <div class="eta"><b>~ ${x.minutes} min</b><span>${Z.formatDistance(x.km)}</span></div></div>
        <div class="discret" style="margin:6px 0">Astreinte ${esc(a.urgence.horaires)}</div>
        <div class="ligne"><span>Déplacement</span><span>${Z.euros(d.deplacement)}</span></div>
        <div class="ligne"><span>Main-d’œuvre, 1re heure</span><span>${Z.euros(d.mainOeuvre)}</span></div>
        ${d.majoration ? `<div class="ligne"><span>Majoration ${esc(d.motif)} (+${Math.round(d.tauxMajoration * 100)} %)</span><span>${Z.euros(d.majoration)}</span></div>` : ''}
        <div class="ligne"><span>Frais de service</span><span>${Z.euros(d.fraisService)}</span></div>
        <div class="ligne total"><span>Prix ferme, 1re heure</span><span>${Z.euros(d.total)}</span></div>
        <div class="ligne discret"><span>Heure suivante, si nécessaire</span><span>${Z.euros(d.heureSupplementaire)}</span></div>
        <button class="btn ${selUrg.artisan === a.id ? 'btn-sombre' : 'btn-contour'}" data-choisir-urg="${a.id}" style="width:100%;margin-top:6px">${selUrg.artisan === a.id ? '✔ Professionnel choisi' : 'Choisir ce professionnel'}</button>
      </div>`;
    };
    const suivi = (u) => { const a = artisan(u.artisan); return `<div class="panneau suivi-urgence">
        <div class="surtitre" style="color:#a52714">Intervention en cours</div>
        <h2 style="margin:4px 0">${esc(a.nom)} est en route</h2>
        <p><b>Arrivée estimée vers ${u.arrivee.slice(11).replace(':', ' h ')}</b> · ${esc(typeUrg(u.type).nom)} · prix ferme de la 1re heure : <b>${Z.euros(u.devis.total)}</b>${u.coupon ? ` (dont ${Z.euros(u.coupon.debit)} réglés par le bon cadeau ${esc(u.coupon.code)})` : ''}.</p>
        <ul class="liste-avantages">
          <li>Le professionnel se présente avec son nom et sa carte ZETools : vérifiez-les avant de le faire entrer.</li>
          <li>Il constate la panne et vous confirme le prix <b>avant</b> de commencer. Tout supplément doit être écrit et accepté par vous dans l’application.</li>
          <li>Ne payez rien sur place, ni en espèces ni par chèque : le paiement passe par ZETools, une fois l’intervention validée.</li>
        </ul>
        <div class="actions-rdv"><button class="btn btn-vert" data-terminer-urg="${u.id}">✔ Démo : intervention terminée</button><a class="btn btn-contour" href="#/agenda">Voir dans mon agenda</a></div>
      </div>`; };
    return `<section class="hero hero-court hero-urgence"><div class="conteneur">
        <div class="surtitre" style="color:#ffd7cf">Urgence travaux · 7 j/7</div>
        <h1>Fuite, panne, porte claquée ? <em>Un pro vérifié, vite.</em></h1>
        <p class="sous">Les professionnels d’astreinte les plus proches, leur délai d’arrivée et leur <b>prix ferme affiché avant le déplacement</b>. Paiement par ZETools uniquement : jamais d’espèces, jamais de surprise.</p>
      </div></section>
      <div class="page"><div class="conteneur">
        <div class="alerte alerte-erreur bandeau-secours"><b>Danger immédiat ?</b> Incendie, personne blessée, forte odeur de gaz : appelez le <a href="tel:18">18</a> ou le <a href="tel:112">112</a>. Urgence médicale : <a href="tel:15">15</a>. Odeur de gaz : Urgence Sécurité Gaz <a href="tel:0800473333">0 800 47 33 33</a>.</div>
        ${enCours ? suivi(enCours) : ''}
        <h2>1. Quelle est l’urgence ?</h2>
        <div class="types-urgence">${TYPES_URGENCE.map((x) => `<button class="type-urgence${x.id === selUrg.type ? ' choisi' : ''}${x.danger ? ' danger' : ''}" data-type-urg="${x.id}"><span>${x.icone}</span>${esc(x.nom)}</button>`).join('')}</div>
        ${t ? `<div class="urgence-gestes ${t.danger ? 'gestes-danger' : ''}">
            <div class="panneau"><h3 style="margin-top:0">${t.danger ? '⚠️ Mettez-vous en sécurité, maintenant' : '🧯 En attendant le professionnel'}</h3><ol class="liste-fiche">${t.gestes.map((g) => `<li>${esc(g)}</li>`).join('')}</ol>
              ${t.danger ? '<p><b>ZETools n’envoie pas d’artisan pour une odeur de gaz.</b> Seuls les services de sécurité gaz et les pompiers interviennent : appelez-les depuis l’extérieur.</p>' : ''}</div>
            ${videoGeste ? `<div class="panneau"><h3 style="margin-top:0">▶ Le bon geste en vidéo</h3><div class="video-cadre" data-cadre-urg>${facadeVideo(videoGeste)}</div><p class="discret" style="margin:8px 0 0">${esc(videoGeste.chaine)} · ${esc(videoGeste.duree)}</p></div>` : ''}
          </div>` : ''}
        ${t && !t.danger ? `<h2>2. Où êtes-vous ?</h2>
          <div class="panneau"><div class="localisation">
            <button class="btn btn-sombre" id="geoloc-urg">📍 Me localiser</button><span style="color:var(--texte-doux)">ou</span>
            <form id="form-cp-urg" style="display:flex;gap:8px"><input id="cp-urg" inputmode="numeric" maxlength="5" placeholder="Code postal" value="${esc(posClient && posClient.cp ? posClient.cp : '')}" style="width:130px;border:1px solid var(--bord);border-radius:8px;padding:10px"><button class="btn btn-contour">Valider</button></form>
          </div>
          <div id="etat-geo-urg" class="alerte ${posClient ? 'alerte-ok' : 'alerte-info'}" style="margin-top:10px">${posClient ? `Position : ${esc(posClient.libelle)}. Votre adresse exacte n’est transmise qu’au professionnel qui intervient.` : 'Indiquez où vous êtes pour voir les professionnels disponibles et leur délai.'}</div></div>
          ${posClient ? `<h2>3. Les professionnels disponibles <span class="discret" style="font-size:1rem">${maj.taux ? `· tarif ${esc(maj.motif)} en ce moment` : '· tarif de jour'}</span></h2>
            ${res.length ? `<div class="grille-urgence">${res.map(carteUrg).join('')}</div>
            <form class="panneau form-espace" id="form-urgence">
              <h3 style="margin-top:0">4. Envoyer ma demande</h3>
              <label class="ligne" style="cursor:pointer"><span><input type="radio" name="qui" value="premier" ${selUrg.artisan === 'premier' ? 'checked' : ''}> <b>Le premier disponible</b> (recommandé) : la demande part aux ${sollicites.length} plus proches, le premier qui accepte intervient</span></label>
              ${selUrg.artisan !== 'premier' ? `<label class="ligne" style="cursor:pointer"><span><input type="radio" name="qui" value="${selUrg.artisan}" checked> Seulement <b>${esc(artisan(selUrg.artisan).nom)}</b></span></label>` : ''}
              <label>Ce qui se passe <span class="discret">(facultatif)</span><textarea name="details" maxlength="300" rows="2" placeholder="Ex. : l’eau coule sous l’évier, j’ai coupé l’arrivée générale"></textarea></label>
              <label>Adresse de l’intervention<input name="adresse" required autocomplete="street-address" placeholder="N°, rue, étage, code d’accès"></label>
              <p class="discret" style="margin:0">L’adresse n’est transmise qu’au professionnel qui accepte, et n’est pas conservée par cette démonstration.</p>
              <div id="paiement-urg">${blocCouponPaiement(Z.devisUrgence(selUrg.artisan === 'premier' ? res[0].artisan : artisan(selUrg.artisan), M, 1).total, selUrg.coupon, 'id="coupon-urg"')}</div>
              <label class="case-legale"><input type="checkbox" name="expresse" required> Je demande expressément une intervention urgente à mon domicile. J’ai noté que, pour les travaux strictement nécessaires à l’urgence, il n’y a pas de droit de rétractation, et qu’un devis écrit m’est remis avant tout travail au-delà de 150 € TTC.</label>
              <button class="btn btn-cta btn-urgence" style="width:100%">🚨 Envoyer ma demande d’urgence</button>
              <p class="discret" style="margin:8px 0 0">Une empreinte bancaire du prix ferme est prise ; vous n’êtes débité qu’après avoir validé l’intervention (simulation dans la maquette).</p>
            </form>` : `<div class="vide">Aucun professionnel d’astreinte à moins de ${Z.REGLES.urgence.rayonKm} km pour ce type d’urgence. Essayez <a href="#/travaux?metier=${t.metier}">la recherche d’artisans</a> et appliquez les gestes ci-dessus.</div>`}` : ''}` : ''}
        <div class="panneau bandeau-action" style="margin-top:24px"><div><b>Les arnaques au dépannage existent.</b> Sur ZETools : professionnels vérifiés (SIRET, assurance), prix affiché avant le déplacement, majorations de nuit et du dimanche annoncées, paiement uniquement par la plateforme.</div><a class="btn btn-contour" href="#/legal/cgu">Nos conditions</a></div>
      </div></div>`;
  }
  function brancherUrgence() {
    const rafraichir = () => { const y = window.scrollY; vue.innerHTML = vueUrgence(new URLSearchParams()); brancherUrgence(); window.scrollTo(0, y); };
    vue.querySelectorAll('[data-type-urg]').forEach((b) => b.addEventListener('click', () => { selUrg.type = b.dataset.typeUrg; selUrg.artisan = 'premier'; rafraichir(); }));
    const cadre = vue.querySelector('[data-cadre-urg]');
    if (cadre) cadre.addEventListener('click', (e) => { const b = e.target.closest('[data-lire]'); if (!b) return; consentementYt = true; cadre.innerHTML = iframeYt(VIDEOS_TUTOS.find((v) => v.yt === b.dataset.lire), true); });
    const geo = document.getElementById('geoloc-urg');
    if (geo) geo.addEventListener('click', () => {
      const etatGeo = document.getElementById('etat-geo-urg');
      if (!navigator.geolocation) { etatGeo.textContent = 'Localisation indisponible : saisissez votre code postal.'; return; }
      etatGeo.textContent = 'Recherche de votre position…';
      navigator.geolocation.getCurrentPosition((g) => {
        const p = { lat: g.coords.latitude, lon: g.coords.longitude };
        if (Z.distanceKm(p, { lat: 48.8566, lon: 2.3522 }) > 80) { etatGeo.className = 'alerte alerte-erreur'; etatGeo.textContent = 'Vous êtes hors de la zone pilote (Île-de-France) : saisissez votre code postal.'; return; }
        posClient = Object.assign(Z.positionApprochee(p), { libelle: 'votre position', source: 'GPS, arrondie à 1 km' }); rafraichir();
      }, () => { etatGeo.className = 'alerte alerte-erreur'; etatGeo.textContent = 'Localisation refusée ou impossible : saisissez votre code postal.'; },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
    });
    const fcp = document.getElementById('form-cp-urg');
    if (fcp) fcp.addEventListener('submit', (e) => {
      e.preventDefault(); const cp = document.getElementById('cp-urg').value.trim(); const p = Z.positionCodePostal(cp);
      if (!p) return toast('Code postal hors de la zone pilote Île-de-France.');
      posClient = { lat: p.lat, lon: p.lon, libelle: `${p.libelle} (${cp})`, source: `code postal, précision ${p.precision}`, cp }; rafraichir();
    });
    vue.querySelectorAll('[data-choisir-urg]').forEach((b) => b.addEventListener('click', () => { selUrg.artisan = selUrg.artisan === b.dataset.choisirUrg ? 'premier' : b.dataset.choisirUrg; rafraichir(); }));
    const cu = document.getElementById('coupon-urg');
    if (cu) cu.addEventListener('change', () => { selUrg.coupon = cu.value; rafraichir(); });
    vue.querySelectorAll('[data-terminer-urg]').forEach((b) => b.addEventListener('click', () => {
      const u = etat.urgences.find((x) => x.id === b.dataset.terminerUrg); if (u) u.statut = 'terminée';
      sauver(); toast('Intervention validée : le professionnel est payé, vous pouvez laisser un avis.'); rafraichir();
    }));
    const f = document.getElementById('form-urgence');
    if (f) f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f), t = typeUrg(selUrg.type), M = maintenant();
      const res = Z.artisansUrgence(posClient, artisansAbonnes(), t.metier);
      const qui = fd.get('qui') || 'premier';
      const x = qui === 'premier' ? res[0] : res.find((y) => y.artisan.id === qui); if (!x) return toast('Ce professionnel n’est plus disponible.');
      const devis = Z.devisUrgence(x.artisan, M, 1);
      let coupon = null;
      if (selUrg.coupon) {
        const i = etat.coupons.findIndex((c) => c.code === selUrg.coupon);
        const u = i >= 0 ? Z.utiliserCoupon(etat.coupons[i], devis.total, AUJOURDHUI, `Urgence : ${t.nom}`) : { ok: false, raison: 'Bon cadeau introuvable.' };
        if (!u.ok) return toast(u.raison);
        etat.coupons[i] = u.coupon; coupon = { code: u.coupon.code, debit: u.debit };
      }
      const d = new Date(Date.now() + x.minutes * 60000), p = (n) => String(n).padStart(2, '0');
      const arrivee = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
      const id = 'u' + Date.now();
      etat.urgences.push({ id, type: t.id, artisan: x.artisan.id, devis, demande: M, arrivee, statut: 'en route', coupon });
      etat.rdv.push({ id, sens: 'envoye', type: 'travaux', avec: x.artisan.id, objet: `🚨 Urgence · ${t.nom}`, creneaux: [arrivee], creneau: arrivee, dureeHeures: 1,
        lieu: 'À mon domicile', statut: 'confirmé', montant: devis.total, message: String(fd.get('details') || '').slice(0, 300) });
      selUrg.coupon = ''; sauver();
      toast(`${x.artisan.nom} a accepté${qui === 'premier' ? ' le premier' : ''} : arrivée dans ~${x.minutes} min (simulation).`);
      rafraichir(); window.scrollTo(0, 0);
    });
  }

  /* =====================================================================
     OFFRIR DES TRAVAUX : un bon cadeau payé sur ZETools, offert à un proche
     ===================================================================== */
  const urlCoupon = (c) => `${SITE_PUBLIC}#/offrir?code=${c.code}`;
  const themeCoupon = (id) => THEMES_COUPON.find((t) => t.id === id) || THEMES_COUPON[0];
  let selCadeau = { lien: 'parent', theme: 'libre', montant: 50, autre: '', pour: '', de: '', message: '', mode: 'pdf', email: '', date: '' };
  let codeSaisi = '';
  function apercuCoupon(c) {
    const t = themeCoupon(c.theme);
    return `<div class="carte-cadeau">
      <div class="cc-tete"><span class="cc-logo">${window.ZT_PDF.logoSvg(26)}<b><span class="marque-ze">ZE</span>TOOLS</b></span><span class="cc-etiquette">BON CADEAU TRAVAUX</span></div>
      <div class="cc-pour">Pour ${esc((c.destinataire && c.destinataire.prenom) || c.pour || '…')}</div>
      ${c.de ? `<div class="cc-de">de la part de ${esc(c.de)}</div>` : ''}
      <div class="cc-montant">${Number.isFinite(c.montant) && c.montant > 0 ? `${c.montant} €` : '— €'}</div>
      <div class="cc-theme">${t.icone} ${esc(t.nom)}</div>
      ${c.message ? `<div class="cc-message">« ${esc(c.message)} »</div>` : ''}
      ${c.code ? `<div class="cc-code">${esc(c.code)}<span>valable jusqu’au ${Z.formatDate(c.expire)}</span></div>` : ''}
    </div>`;
  }
  function telechargerCoupon(code) {
    const c = etat.coupons.find((x) => x.code === code); if (!c) return;
    const P = window.ZT_PDF, J = window.ZT_JURIDIQUE;
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([P.octets(P.bonCadeauPdf(Object.assign({ themeNom: themeCoupon(c.theme).nom }, c), J && J.SOCIETE, { url: urlCoupon(c) }))], { type: 'application/pdf' }));
    lien.download = P.nomFichierCoupon(c); document.body.appendChild(lien); lien.click(); lien.remove();
    toast('Bon cadeau téléchargé en PDF.');
  }
  function vueOffrir(params) {
    if (params.get('code')) codeSaisi = Z.formaterCode(params.get('code'));
    const C = Z.REGLES.coupon;
    const montant = selCadeau.autre !== '' ? Number(selCadeau.autre) : selCadeau.montant;
    const dernier = etat.coupons.find((c) => c.nouveau);
    const trouve = codeSaisi ? etat.coupons.find((c) => c.code === codeSaisi) : null;
    const codeOk = codeSaisi ? Z.verifierCodeCoupon(codeSaisi) : false;
    const ligneCoupon = (c) => `<tr><td><b>${esc(c.code)}</b><br><span class="discret">pour ${esc(c.destinataire.prenom)}</span></td><td>${esc(themeCoupon(c.theme).nom)}</td><td>${Z.euros(c.montant)}</td><td><b>${Z.euros(c.solde)}</b></td><td>${Z.couponExpire(c, AUJOURDHUI) ? '<span class="statut" style="background:#fdecea;color:#a52714">expiré</span>' : Z.formatDate(c.expire)}</td><td><button class="btn btn-contour" data-pdf-coupon="${c.code}">📄 PDF</button></td></tr>`;
    return `<section class="hero hero-court hero-cadeau"><div class="conteneur">
        <div class="surtitre" style="color:var(--anthracite)">Offrir des travaux</div>
        <h1>Offrez un coup de main, <em>pas un objet de plus.</em></h1>
        <p class="sous">Un bon cadeau de ${C.min} à ${C.max} €, à utiliser pour les services et les interventions des artisans de ZETools : montage de meubles, peinture, jardin, petits dépannages. Pour un parent, un enfant, un ami, un collègue.</p>
      </div></section>
      <div class="page"><div class="conteneur">
      ${dernier ? `<div class="panneau confirmation-cadeau"><div class="surtitre">Paiement accepté (simulation)</div><h2 style="margin:4px 0 14px">Votre bon cadeau pour ${esc(dernier.destinataire.prenom)} est prêt</h2>
          <div class="cadeau-recap">${apercuCoupon(dernier)}<div>
            <p>Code : <b>${esc(dernier.code)}</b> · ${Z.euros(dernier.montant)} · valable jusqu’au ${Z.formatDate(dernier.expire)}, en une ou plusieurs fois.</p>
            ${dernier.envoi.mode === 'email' ? `<p>ZETools l’enverra par e-mail le <b>${Z.formatDate(dernier.envoi.date)}</b> à <b>${esc(dernier.envoi.email)}</b>. <span class="discret">(Dans la maquette, aucun e-mail n’est réellement envoyé.)</span></p>` : '<p>Imprimez-le ou transmettez le PDF vous-même : il contient le code et un QR code pour l’utiliser.</p>'}
            <div class="actions-rdv"><button class="btn btn-cta" data-pdf-coupon="${dernier.code}">📄 Télécharger le bon cadeau (PDF)</button><button class="btn btn-contour" data-fermer-confirmation>Offrir un autre bon</button></div>
          </div></div></div>` : ''}
      <div class="offrir">
        <form class="panneau form-espace" id="form-cadeau" novalidate>
          <h2 style="margin-top:0">1. À qui l’offrez-vous ?</h2>
          <div class="choix-proches">${PROCHES.map((p) => `<button type="button" class="puce${selCadeau.lien === p.id ? ' active' : ''}" data-lien="${p.id}">${p.icone} ${esc(p.nom)}</button>`).join('')}</div>
          <div class="deux-colonnes"><label>Son prénom<input name="pour" maxlength="40" value="${esc(selCadeau.pour)}" placeholder="Maman, Léa, Karim…"></label>
          <label>De la part de<input name="de" maxlength="40" value="${esc(selCadeau.de)}" placeholder="Votre prénom"></label></div>
          <h2>2. Quelle idée de travaux ?</h2>
          <div class="themes-cadeau">${THEMES_COUPON.map((t) => `<button type="button" class="theme-cadeau${selCadeau.theme === t.id ? ' choisi' : ''}" data-theme-cadeau="${t.id}"><span>${t.icone}</span><b>${esc(t.nom)}</b><small>${esc(t.idee)}</small></button>`).join('')}</div>
          <p class="discret" style="margin:6px 0 0">Le thème figure sur le bon ; le bon reste utilisable pour tous les services et interventions de ZETools.</p>
          <h2>3. Quel montant ?</h2>
          <div class="choix-proches">${C.montants.map((m) => `<button type="button" class="puce${selCadeau.autre === '' && selCadeau.montant === m ? ' active' : ''}" data-montant="${m}">${m} €</button>`).join('')}
            <label class="montant-libre">Autre <input name="autre" type="number" min="${C.min}" max="${C.max}" step="1" value="${esc(selCadeau.autre)}" placeholder="${C.min}–${C.max}"> €</label></div>
          <h2>4. Un petit mot ?</h2>
          <textarea name="message" maxlength="300" rows="3" placeholder="Pour ton nouvel appartement : quelqu’un viendra monter les meubles !">${esc(selCadeau.message)}</textarea>
          <div class="discret" style="text-align:right"><span id="compteur-cadeau">${selCadeau.message.length}</span> / 300</div>
          <h2>5. Comment le remettre ?</h2>
          <label class="ligne" style="cursor:pointer"><span><input type="radio" name="mode" value="pdf" ${selCadeau.mode === 'pdf' ? 'checked' : ''}> <b>Je l’imprime ou je l’envoie moi-même</b> (PDF avec QR code)</span></label>
          <label class="ligne" style="cursor:pointer"><span><input type="radio" name="mode" value="email" ${selCadeau.mode === 'email' ? 'checked' : ''}> <b>ZETools l’envoie par e-mail</b>, le jour choisi</span></label>
          ${selCadeau.mode === 'email' ? `<div class="deux-colonnes"><label>Son adresse e-mail<input name="email" type="email" value="${esc(selCadeau.email)}" placeholder="prenom@exemple.fr"></label>
            <label>Date d’envoi<input name="date" type="date" min="${AUJOURDHUI}" max="${Z.ajouterMois(AUJOURDHUI, 12)}" value="${esc(selCadeau.date || AUJOURDHUI)}"></label></div>` : ''}
          <div class="ligne total" style="margin-top:14px"><span>À payer</span><span id="a-payer">${Number.isFinite(montant) && montant > 0 ? Z.euros(montant) : '—'}</span></div>
          <p class="discret" style="margin:0 0 10px">Sans frais. Valable 12 mois à partir de sa remise, utilisable en plusieurs fois. Non remboursable en espèces.</p>
          <button class="btn btn-cta" style="width:100%">🎁 Payer et offrir</button>
          <p class="discret" style="margin:8px 0 0">Paiement sécurisé (simulé dans la maquette : aucune carte n’est demandée ni débitée).</p>
        </form>
        <aside class="apercu-cadeau"><div class="surtitre">Aperçu</div><div id="apercu-carte">${apercuCoupon({ pour: selCadeau.pour, de: selCadeau.de, montant, theme: selCadeau.theme, message: selCadeau.message })}</div>
          <p class="discret">Le PDF reprend cette carte, avec le code, la date de validité et un QR code qui ouvre directement ZETools.</p></aside>
      </div>

      <div class="panneau" id="utiliser-coupon" style="margin-top:28px">
        <h2 style="margin-top:0">🎟️ Vous avez reçu un bon cadeau ?</h2>
        <form id="form-code" class="localisation"><input id="code-coupon" value="${esc(codeSaisi)}" placeholder="ZT-XXXX-XXXX" autocomplete="off" spellcheck="false" aria-label="Code du bon cadeau" style="text-transform:uppercase;letter-spacing:1px;border:1px solid var(--bord);border-radius:8px;padding:10px;width:200px"><button class="btn btn-sombre">Vérifier</button></form>
        ${codeSaisi ? (!codeOk ? '<div class="alerte alerte-erreur" style="margin-top:10px">Ce code n’existe pas : vérifiez chaque caractère (il n’y a ni 0, ni O, ni 1, ni I, ni L).</div>'
          : trouve ? `<div class="alerte ${Z.couponExpire(trouve, AUJOURDHUI) ? 'alerte-erreur' : 'alerte-ok'}" style="margin-top:10px">${Z.couponExpire(trouve, AUJOURDHUI) ? `Ce bon a expiré le ${Z.formatDate(trouve.expire)}.` : `Bon cadeau de ${Z.euros(trouve.montant)} pour ${esc(trouve.destinataire.prenom)} : <b>solde ${Z.euros(trouve.solde)}</b>, valable jusqu’au ${Z.formatDate(trouve.expire)}. Il vous sera proposé au moment de payer un service ou une intervention.`}</div>
              <div class="actions-rdv"><a class="btn btn-cta" href="#/services">Choisir un service</a><a class="btn btn-contour" href="#/urgence">Urgence travaux</a></div>`
          : '<div class="alerte alerte-info" style="margin-top:10px">Code au bon format, mais inconnu de cette démonstration : les bons de la maquette sont enregistrés dans ce navigateur seulement.</div>') : '<p class="discret" style="margin:8px 0 0">Saisissez le code imprimé sur le bon, ou scannez son QR code.</p>'}
      </div>

      <h3 style="margin-top:28px">Mes bons cadeaux</h3>
      ${etat.coupons.length ? `<div class="defile-tableau"><table class="tableau"><thead><tr><th>Code</th><th>Thème</th><th>Montant</th><th>Solde</th><th>Valable jusqu’au</th><th></th></tr></thead><tbody>${etat.coupons.slice().reverse().map(ligneCoupon).join('')}</tbody></table></div>` : '<div class="vide">Aucun bon cadeau pour l’instant.</div>'}
      </div></div>`;
  }
  function brancherOffrir() {
    const f = document.getElementById('form-cadeau'); if (!f) return;
    const lire = () => { const fd = new FormData(f); ['pour', 'de', 'message', 'autre', 'email', 'date'].forEach((k) => { if (fd.has(k)) selCadeau[k] = String(fd.get(k)); }); selCadeau.mode = fd.get('mode') || 'pdf'; };
    const redessiner = () => { const y = window.scrollY; vue.innerHTML = vueOffrir(new URLSearchParams()); brancherOffrir(); window.scrollTo(0, y); };
    const apercu = () => {
      lire(); const m = selCadeau.autre !== '' ? Number(selCadeau.autre) : selCadeau.montant;
      document.getElementById('apercu-carte').innerHTML = apercuCoupon({ pour: selCadeau.pour, de: selCadeau.de, montant: m, theme: selCadeau.theme, message: selCadeau.message });
      document.getElementById('compteur-cadeau').textContent = selCadeau.message.length;
      document.getElementById('a-payer').textContent = Number.isFinite(m) && m > 0 ? Z.euros(m) : '—';
      if (f.querySelector('[name=autre]').value !== '') f.querySelectorAll('[data-montant]').forEach((b) => b.classList.remove('active'));
    };
    f.addEventListener('input', apercu);
    f.addEventListener('change', (e) => { if (e.target.name === 'mode') { lire(); redessiner(); } });
    f.addEventListener('click', (e) => {
      const b = e.target.closest('button[type=button]'); if (!b) return;
      lire();
      if (b.dataset.lien) selCadeau.lien = b.dataset.lien;
      if (b.dataset.themeCadeau) selCadeau.theme = b.dataset.themeCadeau;
      if (b.dataset.montant) { selCadeau.montant = Number(b.dataset.montant); selCadeau.autre = ''; }
      redessiner();
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault(); lire();
      const demande = { montant: selCadeau.autre !== '' ? Number(selCadeau.autre) : selCadeau.montant, theme: selCadeau.theme, de: selCadeau.de.trim(),
        destinataire: { prenom: selCadeau.pour.trim(), lien: selCadeau.lien }, message: selCadeau.message.trim(),
        envoi: selCadeau.mode === 'email' ? { mode: 'email', email: selCadeau.email.trim(), date: selCadeau.date || AUJOURDHUI } : { mode: 'pdf' } };
      const v = Z.verifierCoupon(demande, AUJOURDHUI); if (!v.ok) return toast(v.erreurs[0]);
      etat.coupons.forEach((c) => { delete c.nouveau; });
      const c = Object.assign(Z.creerCoupon(demande, AUJOURDHUI), { nouveau: true });
      etat.coupons.push(c); sauver();
      selCadeau = Object.assign({}, selCadeau, { pour: '', message: '', autre: '', email: '', date: '' });
      toast(`Paiement de ${Z.euros(c.montant)} accepté (simulation). Bon cadeau ${c.code} créé.`);
      vue.innerHTML = vueOffrir(new URLSearchParams()); brancherOffrir(); window.scrollTo(0, 0);
    });
    vue.querySelectorAll('[data-pdf-coupon]').forEach((b) => b.addEventListener('click', () => telechargerCoupon(b.dataset.pdfCoupon)));
    const fermer = vue.querySelector('[data-fermer-confirmation]');
    if (fermer) fermer.addEventListener('click', () => { etat.coupons.forEach((c) => { delete c.nouveau; }); sauver(); redessiner(); });
    document.getElementById('form-code').addEventListener('submit', (e) => {
      e.preventDefault(); lire(); const brut = document.getElementById('code-coupon').value.trim(); codeSaisi = brut ? Z.formaterCode(brut) : '';
      vue.innerHTML = vueOffrir(new URLSearchParams()); brancherOffrir(); document.getElementById('utiliser-coupon').scrollIntoView();
    });
  }

  /* ---------- routeur ---------- */
  function router() {
    const [chemin, qs] = (location.hash.slice(1) || '/').split('?');
    const params = new URLSearchParams(qs || '');
    const seg = chemin.split('/').filter(Boolean);
    let html, apres = null;
    switch (seg[0]) {
      case undefined: html = vueAccueil(); apres = brancherAccueil; break;
      case 'annonces': html = vueAnnonces(params); apres = brancherFiltres; break;
      case 'annonce': html = vueFiche(seg[1]); apres = () => { const a = Z.appliquerOffres(annonce(seg[1]), etat.offres, maintenant()); if (a) brancherFiche(a); }; break;
      case 'messages': html = vueMessages(params); apres = () => brancherMessages(params); break;
      case 'mon-espace': html = vueMonEspace(); apres = brancherEspace; break;
      case 'favoris': html = vueMonEspace(); apres = () => { brancherEspace(); const h = [...document.querySelectorAll('h3')].find((x) => x.textContent === 'Mes favoris'); if (h) h.scrollIntoView(); }; break;
      case 'deposer': html = vueDeposer(params); apres = brancherDeposer; break;
      case 'pros': html = vuePros(); break;
      case 'travaux': if (params.get('metier') !== null) { filtreTravaux.metier = params.get('metier'); filtreTravaux.vise = ''; } html = vueTravaux(); apres = brancherTravaux; break;
      case 'espace-artisan': html = vueEspaceArtisan(); apres = brancherEspaceArtisan; break;
      case 'reparer': html = vueReparer(); break;
      case 'destockage': html = vueDestockage(); apres = brancherDestockage; break;
      case 'lot': html = vueLot(seg[1]); apres = () => brancherLot(seg[1]); break;
      case 'espace-enseigne': html = vueEspaceEnseigne(); apres = brancherEspaceEnseigne; break;
      case 'rendez-vous': html = vueRendezVous(params); apres = brancherRendezVous; break;
      case 'agenda': html = vueAgenda(); apres = brancherAgenda; break;
      case 'offres': html = vueOffres(); apres = brancherOffres; break;
      case 'services': html = vueServices(); apres = brancherServices; break;
      case 'service': html = vueService(seg[1]); apres = () => brancherService(seg[1]); break;
      case 'proposer-service': html = vueProposerService(); apres = brancherProposerService; break;
      case 'fiches': html = vueFiches(); break;
      case 'videos': html = vueVideos(params); apres = brancherVideos; break;
      case 'urgence': html = vueUrgence(params); apres = brancherUrgence; break;
      case 'offrir': html = vueOffrir(params); apres = brancherOffrir; break;
      case 'fiche-technique': html = vueFicheTechnique(seg[1]); apres = brancherFicheTechnique; break;
      case 'securite': html = vueLegal('securite'); break;
      case 'atelier': html = vueAtelier(); break;
      case 'aide': html = vueAide(); break;
      case 'legal': html = vueLegal(seg[1]); break;
      case 'credits': html = vueCredits(); break;
      default: html = '<div class="page"><div class="conteneur vide">Page introuvable. <a href="#/">Retour à l’accueil</a></div></div>';
    }
    vue.innerHTML = html;
    if (apres) apres();
    activerVideos();
    document.getElementById('bulle-msg').textContent = etat.conversations.length;
    if (!seg[0] || seg[0] !== 'favoris') window.scrollTo(0, 0);
  }
  function versAnnonces(obj) {
    const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.set(k, v); });
    aller('#/annonces' + (p.toString() ? '?' + p : ''));
  }
  function brancherAccueil() {
    let mode = '';
    document.getElementById('onglets-hero').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]'); if (!b) return;
      mode = b.dataset.mode; document.querySelectorAll('#onglets-hero button').forEach((x) => x.classList.toggle('actif', x === b));
    });
    document.getElementById('moteur').addEventListener('submit', (e) => {
      e.preventDefault(); const fd = new FormData(e.target);
      versAnnonces({ mode, q: fd.get('q'), cat: fd.get('cat'), lieu: fd.get('lieu') });
    });
  }
  function brancherFiltres() {
    document.getElementById('filtres').addEventListener('submit', (e) => {
      e.preventDefault(); const fd = new FormData(e.target);
      versAnnonces({ mode: fd.get('mode'), q: fd.get('q'), cat: fd.get('cat'), lieu: fd.get('lieu') });
    });
  }
  function brancherEspace() {
    const b = document.getElementById('reinitialiser');
    if (b) b.addEventListener('click', () => { etat = ETAT_INITIAL(); sauver(); toast('Démonstration réinitialisée.'); router(); });
  }
  document.getElementById('recherche-entete').addEventListener('submit', (e) => {
    e.preventDefault(); const v = document.getElementById('q-entete').value.trim();
    if (/^\d{2,5}$/.test(v)) versAnnonces({ lieu: v }); else versAnnonces({ q: v });
  });
  // navigation interne robuste (certains aperçus ignorent les changements de #)
  function aller(h) {
    location.hash = h;
    if (location.hash !== h) { try { history.pushState(null, '', h); } catch (e) { /* ignoré */ } router(); }
  }
  window.ZT_ALLER = aller;
  document.addEventListener('click', (e) => {
    const lien = e.target.closest('a[href^="#/"]');
    if (!lien || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); aller(lien.getAttribute('href'));
  });
  window.addEventListener('hashchange', router);
  window.addEventListener('popstate', router);
  router();
})();
