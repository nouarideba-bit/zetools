/* ZETOOLS · application de la maquette (routeur par #, vues, état local). */
(function () {
  'use strict';
  const { PHOTOS, VIDEOS, CATEGORIES, MEMBRES, ANNONCES, RESERVATIONS, ARTICLES, CREDITS } = window.ZT_DONNEES;
  const Z = window.ZT;
  const AUJOURDHUI = Z.versTexte(Z.versDate(new Date()));
  const vue = document.getElementById('vue');

  /* ---------- état persistant (navigateur seulement) ---------- */
  const CLE = 'zetools-maquette-v1';
  const ETAT_INITIAL = () => ({
    reservations: [],
    favoris: [],
    annonces: [],
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
  const annonce = (id) => toutesAnnonces().find((a) => a.id === id);
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
  function carte(a) {
    const m = membre(a.membre); const fav = etat.favoris.includes(a.id);
    return `<a class="carte" href="#/annonce/${a.id}">
      <div class="visuel">${a.photo ? `<img loading="lazy" src="${a.photo}" alt="${esc(a.titre)}">` : ''}
        <div class="badges">${badges(a)}</div>
        <button class="coeur" data-fav="${a.id}" aria-label="Ajouter aux favoris">${fav ? '❤️' : '♡'}</button></div>
      <div class="infos"><span class="badge badge-etat" style="align-self:start">${esc(a.etat)}</span>
        <h3>${esc(a.titre)}</h3><div class="prix">${prixPrincipal(a)}</div>
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
  let selection = { debut: null, fin: null, mois: null, onglet: null, assurance: true };
  function vueFiche(id) {
    const a = annonce(id);
    if (!a) return '<div class="page"><div class="conteneur vide">Annonce introuvable. <a href="#/annonces">Retour aux annonces</a></div></div>';
    const m = membre(a.membre);
    if (selection.id !== id) selection = { id, debut: null, fin: null, mois: AUJOURDHUI.slice(0, 7), onglet: a.modes[0], assurance: true };
    return `<div class="page"><div class="conteneur">
      <div class="fil"><a href="#/">Accueil</a> › <a href="#/annonces?cat=${a.categorie}">${catNom(a.categorie)}</a> › ${esc(a.titre)}</div>
      <div class="fiche">
        <div>
          <div class="photo-principale">${a.photo ? `<img src="${a.photo.replace('w=900', 'w=1400')}" alt="${esc(a.titre)}">` : ''}</div>
          <div class="panneau" style="margin-top:16px">
            <h2 style="margin-top:0">Description</h2><p>${esc(a.description)}</p>
            <div class="ligne"><span>Marque</span><b>${esc(a.marque)}</b></div>
            <div class="ligne"><span>État</span><b>${esc(a.etat)}</b></div>
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

  function zoneTransaction(a) {
    const o = selection.onglet;
    if (o === 'vente') {
      const d = Z.devisVente(a);
      return `<div class="ligne"><span>Prix</span><b>${Z.euros(d.prix)}</b></div>
        <div class="ligne discret"><span>Protection acheteur (séquestre)</span><span>incluse</span></div>
        <div class="ligne total"><span>Vous payez</span><span>${Z.euros(d.prix)}</span></div>
        <div class="alerte alerte-info">Le vendeur reçoit ${Z.euros(d.versementVendeur)} une fois la remise confirmée (commission ZETOOLS ${Z.euros(d.commission)}).</div>
        <button class="btn btn-cta" style="width:100%" data-action="acheter">Acheter avec paiement sécurisé</button>`;
    }
    if (o === 'echange') {
      return `<p>Le propriétaire cherche : <b>${esc(a.echangeContre || 'à discuter')}</b>.</p>
        <label style="display:flex;flex-direction:column;gap:6px;font-weight:600">Votre proposition<textarea id="proposition" rows="3" style="border:1px solid var(--bord);border-radius:8px;padding:10px" placeholder="Ex. : ponceuse excentrique Makita, très bon état, avec 20 disques"></textarea></label>
        <div class="ligne discret"><span>Frais de mise en relation, par partie</span><span>${Z.euros(Z.REGLES.fraisEchange)}</span></div>
        <button class="btn btn-vert" style="width:100%;margin-top:10px" data-action="echanger">Proposer l’échange</button>`;
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
          <label class="ligne" style="cursor:pointer"><span><input type="checkbox" id="assurance" ${selection.assurance ? 'checked' : ''}> Assurance casse et vol</span><span>${Z.euros(d.assurance)}</span></label>
          <div class="ligne"><span>Frais de service</span><span>${Z.euros(d.fraisService)}</span></div>
          <div class="ligne total"><span>Total</span><span>${Z.euros(d.totalLocataire)}</span></div>
          <div class="ligne discret"><span>Caution (empreinte, non débitée)</span><span>${Z.euros(d.caution)}</span></div>
          <button class="btn btn-cta" style="width:100%;margin-top:10px" data-action="reserver">Réserver et payer ${Z.euros(d.totalLocataire)}</button>`;
      }
    } else {
      detail = `<div class="alerte alerte-info">${selection.debut ? 'Choisissez maintenant le jour de retour.' : 'Choisissez le jour de retrait dans le calendrier.'}</div>`;
    }
    return `<div class="ligne"><span>Tarif</span><b>${Z.euros(a.prixJour)} / jour</b></div>
      <div class="ligne discret"><span>-10 % dès 3 jours · -20 % dès 7 jours</span><span></span></div>
      ${calendrier(a)}${detail}`;
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
        <label>État<select name="etat"><option>Neuf</option><option ${enPanne ? '' : 'selected'}>Très bon état</option><option>Bon état</option><option ${enPanne ? 'selected' : ''}>À réparer</option></select></label>
        <label class="large">Panne constatée (si à réparer)<input name="panne" placeholder="Ex. : batterie qui ne tient plus la charge"></label>
        <label>Code postal<input name="cp" required pattern="\\d{5}" placeholder="94300"></label>
        <div class="large"><b>Je propose</b><div class="cases" style="margin-top:6px"><label><input type="checkbox" name="modes" value="location" checked> la location</label><label><input type="checkbox" name="modes" value="vente"> la vente</label><label><input type="checkbox" name="modes" value="echange"> l’échange</label></div></div>
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
    document.getElementById('form-depot').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const modes = fd.getAll('modes');
      const nb = (k) => Number(fd.get(k)) || null;
      if (!modes.length) return toast('Choisissez au moins : location, vente ou échange.');
      if (modes.includes('location') && !nb('prixJour')) return toast('Indiquez un prix par jour pour la location.');
      if (modes.includes('vente') && !nb('prixVente')) return toast('Indiquez un prix de vente.');
      const cp = String(fd.get('cp'));
      const a = {
        id: 'u' + Date.now(), titre: String(fd.get('titre')), marque: String(fd.get('marque') || '—'), categorie: String(fd.get('categorie')),
        etat: String(fd.get('etat')), modes, prixJour: nb('prixJour'), prixVente: nb('prixVente'), caution: nb('caution') || 0,
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
      </div>
      ${blocReassurance().replace('class="bloc reassurance"', 'class="bloc reassurance" style="margin-top:40px;border-radius:16px"')}
    </div></div>`;
  }

  function vueAtelier() {
    return `<div class="page"><div class="conteneur"><div class="titre-section"><div><div class="surtitre">L’Atelier</div><h2>Le guide du bon bricoleur</h2><p>Conseils pratiques, choix du matériel, entretien.</p></div></div>${grilleArticles()}</div></div>`;
  }

  function vueAide() {
    const q = [
      ['Que se passe-t-il si l’outil est abîmé ?', 'Les photos d’état prises à la remise et au retour font foi. La caution couvre les petits dégâts ; l’assurance casse optionnelle prend le relais au-delà.'],
      ['Pourquoi ne puis-je pas donner mon numéro ?', 'Tant que rien n’est payé sur ZETOOLS, nous ne pouvons ni garantir la caution ni vous rembourser. Les coordonnées s’affichent automatiquement après paiement.'],
      ['Quand le propriétaire est-il payé ?', 'Le loyer est versé 24 h après le retour de l’outil, si aucun litige n’est ouvert. Pour une vente, après confirmation de la remise par l’acheteur.'],
      ['Un échange est-il protégé ?', 'Oui : chacun règle des frais de mise en relation et une caution croisée peut être demandée pour les outils de valeur différente.'],
      ['Faut-il être professionnel pour louer souvent ?', 'Au-delà d’un usage occasionnel, un numéro SIRET est demandé. Les revenus sont déclarés aux impôts conformément à la directive DAC7.'],
    ];
    return `<div class="page"><div class="conteneur" style="max-width:820px"><div class="titre-section"><div><h2>Questions fréquentes</h2></div></div>${q.map(([t, r]) => `<details class="panneau"><summary style="font-weight:700;cursor:pointer">${t}</summary><p>${r}</p></details>`).join('')}</div></div>`;
  }

  function vueLegal() {
    return `<div class="page"><div class="conteneur" style="max-width:820px"><div class="panneau"><h2>Conditions générales et mentions légales</h2>
      <p><b>À rédiger avec un avocat avant tout lancement.</b> Points à couvrir : statut d’intermédiaire de la plateforme, CGU et CGV distinctes particuliers/professionnels, prestataire de paiement agréé (aucun fonds ne transite par ZETOOLS), obligations DAC7, assurance, médiation de la consommation, RGPD.</p></div></div></div>`;
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

  /* ---------- routeur ---------- */
  function router() {
    const [chemin, qs] = (location.hash.slice(1) || '/').split('?');
    const params = new URLSearchParams(qs || '');
    const seg = chemin.split('/').filter(Boolean);
    let html, apres = null;
    switch (seg[0]) {
      case undefined: html = vueAccueil(); apres = brancherAccueil; break;
      case 'annonces': html = vueAnnonces(params); apres = brancherFiltres; break;
      case 'annonce': html = vueFiche(seg[1]); apres = () => { const a = annonce(seg[1]); if (a) brancherFiche(a); }; break;
      case 'messages': html = vueMessages(params); apres = () => brancherMessages(params); break;
      case 'mon-espace': html = vueMonEspace(); apres = brancherEspace; break;
      case 'favoris': html = vueMonEspace(); apres = () => { brancherEspace(); const h = [...document.querySelectorAll('h3')].find((x) => x.textContent === 'Mes favoris'); if (h) h.scrollIntoView(); }; break;
      case 'deposer': html = vueDeposer(params); apres = brancherDeposer; break;
      case 'pros': html = vuePros(); break;
      case 'travaux': if (params.get('metier') !== null) { filtreTravaux.metier = params.get('metier'); filtreTravaux.vise = ''; } html = vueTravaux(); apres = brancherTravaux; break;
      case 'espace-artisan': html = vueEspaceArtisan(); apres = brancherEspaceArtisan; break;
      case 'reparer': html = vueReparer(); break;
      case 'securite': html = blocReassurance(); break;
      case 'atelier': html = vueAtelier(); break;
      case 'aide': html = vueAide(); break;
      case 'legal': html = vueLegal(); break;
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
