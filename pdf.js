/* ZETOOLS · générateur de PDF minimal pour les fiches techniques (aucune dépendance).
   Produit un vrai fichier PDF 1.4, format A4, polices standard Helvetica (encodage WinAnsi).
   Fonctionne dans le navigateur (window.ZT_PDF) et sous Node (module.exports) pour les tests. */
(function (racine) {
  'use strict';
  const L = 595, H = 842, MARGE = 50, LARGEUR = L - 2 * MARGE, BAS = 64;
  // largeurs Helvetica (millièmes de cadratin) des caractères 32 à 126
  const W = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
    1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
    333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  // caractères hors Latin-1 présents dans WinAnsi
  const SPECIAUX = { '’': 0x92, '‘': 0x91, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97, '…': 0x85, '€': 0x80, 'œ': 0x9C, 'Œ': 0x8C, '•': 0x95, ' ': 0x20, ' ': 0x20, '×': 0xD7 };
  function codes(texte) {
    const r = [];
    for (const c of String(texte)) {
      const k = c.codePointAt(0);
      if (SPECIAUX[c]) r.push(SPECIAUX[c]); else if (k >= 32 && k <= 255) r.push(k); else if (k > 255 && k < 0x2000) r.push(63); // autres : « ? » ; émojis ignorés
    }
    return r;
  }
  function largeur(texte, taille, gras) {
    let t = 0;
    for (const k of codes(texte)) t += (k >= 32 && k <= 126 ? W[k - 32] : 556);
    return t * taille / 1000 * (gras ? 1.07 : 1);
  }
  function chaine(texte) { // chaîne PDF, entièrement en ASCII
    return '(' + codes(texte).map((k) => (k === 40 || k === 41 || k === 92 ? '\\' + String.fromCharCode(k) : k > 126 ? '\\' + k.toString(8).padStart(3, '0') : String.fromCharCode(k))).join('') + ')';
  }
  function couper(texte, taille, gras, max) {
    const lignes = []; let ligne = '';
    for (const mot of String(texte).split(/\s+/).filter(Boolean)) {
      const essai = ligne ? ligne + ' ' + mot : mot;
      if (ligne && largeur(essai, taille, gras) > max) { lignes.push(ligne); ligne = mot; } else ligne = essai;
    }
    if (ligne) lignes.push(ligne);
    return lignes;
  }

  /* ---------- logo ZETools (l'écrou ZE), dessiné en formes simples dans un carré de 100 ---------- */
  const LOGO = { hexagone: [[50, 6], [88.1, 28], [88.1, 72], [50, 94], [11.9, 72], [11.9, 28]],
    z: [[28, 26], [72, 26], [72, 37], [45, 63], [72, 63], [72, 74], [28, 74], [28, 63], [55, 37], [28, 37]] };
  const pts = (l) => l.map((p) => p.join(',')).join(' ');
  function logoSvg(taille) {
    return `<svg width="${taille || 34}" height="${taille || 34}" viewBox="0 0 100 100" aria-hidden="true"><polygon points="${pts(LOGO.hexagone)}" fill="#f5b700" stroke="#f5b700" stroke-width="8" stroke-linejoin="round"/><polygon points="${pts(LOGO.z)}" fill="#23272b"/></svg>`;
  }

  /* ---------- pictogrammes des étapes : traits simples sur une grille de 24, rendus en SVG et en PDF ----------
     l = ligne [x1, y1, x2, y2] ; r = rectangle [x, y, largeur, hauteur] ; c = cercle [cx, cy, rayon, plein ?] ; p = polygone fermé [[x, y], …] */
  const PICTOS = {
    espace: [['l', 3, 8, 3, 4], ['l', 3, 4, 7, 4], ['l', 17, 4, 21, 4], ['l', 21, 4, 21, 8], ['l', 21, 16, 21, 20], ['l', 21, 20, 17, 20], ['l', 7, 20, 3, 20], ['l', 3, 20, 3, 16], ['r', 8, 9, 8, 6]],
    inventaire: [['r', 5, 4, 14, 17], ['r', 9, 2, 6, 4], ['l', 8, 11, 16, 11], ['l', 8, 14, 16, 14], ['l', 8, 17, 13, 17]],
    trier: [['r', 2, 13, 5.5, 6], ['r', 9.25, 13, 5.5, 6], ['r', 16.5, 13, 5.5, 6], ['c', 4.75, 7, 1.3, 1], ['c', 12, 7, 1.3, 1], ['c', 19.25, 7, 1.3, 1]],
    goutte: [['p', [[12, 3], [17.5, 12.5], [17.5, 16], [15, 19.5], [12, 20.5], [9, 19.5], [6.5, 16], [6.5, 12.5]]]],
    assembler: [['r', 3, 3, 11, 11], ['r', 10, 10, 11, 11]],
    mesurer: [['r', 2, 8, 20, 8], ['l', 6, 8, 6, 12], ['l', 10, 8, 10, 11], ['l', 14, 8, 14, 12], ['l', 18, 8, 18, 11]],
    redresser: [['l', 12, 19, 12, 4], ['l', 12, 4, 7, 9], ['l', 12, 4, 17, 9], ['l', 5, 21, 19, 21]],
    fixer: [['l', 4, 3, 4, 21], ['r', 4, 10, 8, 4], ['l', 12, 12, 20, 12], ['l', 20, 9, 20, 15]],
    mur: [['r', 3, 5, 18, 14], ['l', 3, 9.7, 21, 9.7], ['l', 3, 14.3, 21, 14.3], ['l', 12, 5, 12, 9.7], ['l', 8, 9.7, 8, 14.3], ['l', 16, 9.7, 16, 14.3], ['l', 12, 14.3, 12, 19]],
    electricite: [['p', [[13, 2], [6, 13], [11, 13], [10, 22], [18, 10], [13, 10]]]],
    niveau: [['r', 2, 8, 20, 8], ['c', 12, 12, 2.2], ['l', 8.5, 9.5, 8.5, 14.5], ['l', 15.5, 9.5, 15.5, 14.5]],
    percer: [['r', 3, 7, 11, 6], ['p', [[6, 13], [10, 13], [9, 20], [5, 20]]], ['l', 14, 8, 14, 12], ['l', 14, 10, 21, 10]],
    nettoyer: [['l', 12, 3, 12, 9], ['l', 9, 6, 15, 6], ['l', 6, 13, 6, 19], ['l', 3, 16, 9, 16], ['l', 17, 12, 17, 20], ['l', 13, 16, 21, 16]],
    visser: [['r', 3, 9, 8, 6], ['l', 11, 12, 19, 12], ['p', [[19, 10.2], [22, 12], [19, 13.8]]]],
    verifier: [['c', 12, 12, 9], ['l', 7.5, 12.5, 10.5, 15.5], ['l', 10.5, 15.5, 16.5, 8.5]],
    plan: [['r', 4, 3, 16, 18], ['l', 4, 9, 20, 9], ['l', 10, 9, 10, 21]],
    tracer: [['p', [[4, 20], [6, 14], [16, 4], [20, 8], [10, 18]]], ['l', 6, 14, 10, 18], ['l', 14, 6, 18, 10]],
    scier: [['p', [[3, 9], [15, 7], [15, 15], [3, 12]]], ['r', 15, 6, 6, 10], ['l', 5, 12.5, 6, 15], ['l', 8, 13.2, 9, 15.7], ['l', 11, 14, 12, 16.5]],
    poncer: [['r', 4, 9, 16, 6], ['l', 8, 9, 8, 6], ['l', 8, 6, 16, 6], ['l', 16, 6, 16, 9], ['l', 3, 18, 21, 18], ['l', 2, 21, 6, 21], ['l', 18, 21, 22, 21]],
    peindre: [['r', 10, 2, 4, 9], ['r', 8, 11, 8, 3], ['p', [[8, 14], [16, 14], [15, 21], [9, 21]]]],
    attention: [['p', [[12, 3], [22, 20], [2, 20]]], ['l', 12, 9, 12, 14], ['c', 12, 17, 0.7, 1]],
    attendre: [['c', 12, 12, 9], ['l', 12, 7, 12, 12], ['l', 12, 12, 15.5, 14]],
    demonter: [['l', 7, 17, 15, 9], ['c', 17, 7, 3.2], ['c', 6, 18, 1.8]],
    batterie: [['r', 3, 8, 16, 9], ['r', 19, 10.5, 2, 4], ['l', 6.5, 10.5, 6.5, 14.5], ['l', 9.5, 10.5, 9.5, 14.5], ['l', 12.5, 10.5, 12.5, 14.5]],
  };
  function pictoSvg(cle, taille) {
    const formes = (PICTOS[cle] || PICTOS.verifier).map((f) => {
      if (f[0] === 'l') return `<line x1="${f[1]}" y1="${f[2]}" x2="${f[3]}" y2="${f[4]}"/>`;
      if (f[0] === 'r') return `<rect x="${f[1]}" y="${f[2]}" width="${f[3]}" height="${f[4]}"/>`;
      if (f[0] === 'c') return `<circle cx="${f[1]}" cy="${f[2]}" r="${f[3]}"${f[4] ? ' fill="currentColor"' : ''}/>`;
      return `<polygon points="${pts(f[1])}"/>`;
    }).join('');
    return `<svg class="picto" width="${taille || 28}" height="${taille || 28}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${formes}</svg>`;
  }

  /** Construit le PDF d'une fiche technique. Retourne le fichier sous forme de chaîne ASCII. */
  function fichePdf(f, societe, options) {
    const opt = options || {};
    const soc = societe || { nom: 'ZETools', siege: '58 rue de Ponthieu, 75008 Paris' };
    const pages = []; let ops = []; let y = 0;
    const texte = (t, x, yy, taille, gras, rgb) => ops.push(`BT /${gras ? 'F2' : 'F1'} ${taille} Tf ${rgb || '0.11 0.13 0.15'} rg ${x.toFixed(1)} ${yy.toFixed(1)} Td ${chaine(t)} Tj ET`);
    const rect = (x, yy, w, h, rgb) => ops.push(`${rgb} rg ${x} ${yy.toFixed(1)} ${w} ${h} re f`);
    const n = (v) => Number(v.toFixed(2));
    // dessin vectoriel : repère d'origine (x0, haut), y vers le bas, échelle e
    const chemin = (liste, x0, haut, e) => liste.map((p, i) => `${n(x0 + p[0] * e)} ${n(haut - p[1] * e)} ${i ? 'l' : 'm'}`).join(' ') + ' h';
    const logo = (x0, haut, taille) => { const e = taille / 100;
      ops.push(`q 0.96 0.72 0 rg 0.96 0.72 0 RG ${n(8 * e)} w 1 j ${chemin(LOGO.hexagone, x0, haut, e)} B 0.137 0.153 0.169 rg ${chemin(LOGO.z, x0, haut, e)} f Q`); };
    const picto = (cle, x0, haut, taille) => { const e = taille / 24; const K = 0.5523;
      const formes = (PICTOS[cle] || PICTOS.verifier).map((f) => {
        if (f[0] === 'l') return `${n(x0 + f[1] * e)} ${n(haut - f[2] * e)} m ${n(x0 + f[3] * e)} ${n(haut - f[4] * e)} l S`;
        if (f[0] === 'r') return `${n(x0 + f[1] * e)} ${n(haut - (f[2] + f[4]) * e)} ${n(f[3] * e)} ${n(f[4] * e)} re S`;
        if (f[0] === 'c') { const cx = x0 + f[1] * e, cy = haut - f[2] * e, r = f[3] * e, k = r * K;
          return `${n(cx + r)} ${n(cy)} m ${n(cx + r)} ${n(cy + k)} ${n(cx + k)} ${n(cy + r)} ${n(cx)} ${n(cy + r)} c ${n(cx - k)} ${n(cy + r)} ${n(cx - r)} ${n(cy + k)} ${n(cx - r)} ${n(cy)} c ${n(cx - r)} ${n(cy - k)} ${n(cx - k)} ${n(cy - r)} ${n(cx)} ${n(cy - r)} c ${n(cx + k)} ${n(cy - r)} ${n(cx + r)} ${n(cy - k)} ${n(cx + r)} ${n(cy)} c ${f[4] ? 'B' : 'S'}`; }
        return chemin(f[1], x0, haut, e) + ' S';
      });
      ops.push(`q 0.137 0.153 0.169 RG 0.137 0.153 0.169 rg ${n(1.7 * e)} w 1 J 1 j ${formes.join(' ')} Q`); };
    const nouvellePage = () => {
      if (ops.length) pages.push(ops);
      ops = [];
      rect(0, H - 56, L, 56, '0.137 0.153 0.169');
      logo(MARGE, H - 13, 30);
      const xm = MARGE + 38;
      texte('ZE', xm, H - 36, 18, true, '0.96 0.72 0'); texte('TOOLS', xm + largeur('ZE', 18, true) + 1, H - 36, 18, true, '1 1 1');
      const d = 'Fiche technique'; texte(d, L - MARGE - largeur(d, 11, false), H - 34, 11, false, '1 1 1');
      y = H - 56 - 34;
    };
    const place = (h) => { if (y - h < BAS) nouvellePage(); };
    const paragraphe = (t, taille, gras, retrait, rgb, prefixe) => {
      const lignes = couper(t, taille, gras, LARGEUR - (retrait || 0));
      lignes.forEach((l, i) => {
        place(taille * 1.45);
        if (i === 0 && prefixe) texte(prefixe, MARGE + (retrait || 0) - largeur(prefixe, taille, true) - 5, y, taille, true, '0.17 0.37 0.23');
        texte(l, MARGE + (retrait || 0), y, taille, gras, rgb); y -= taille * 1.45;
      });
    };
    const titreSection = (t) => { place(46); y -= 10; rect(MARGE, y - 5, 28, 3, '0.96 0.72 0'); y -= 0; texte(t, MARGE, y + 4, 13, true); y -= 24; };
    // étapes illustrées : pictogramme dans un carré jaune pâle, numéro, texte
    const etapes = (items, pictos) => items.forEach((it, i) => {
      const lignes = couper(it, 10.5, false, LARGEUR - 62); const pas = 10.5 * 1.45;
      const h = Math.max(30, lignes.length * pas + 4);
      place(h + 6);
      const haut = y + 11;
      rect(MARGE, haut - 28, 28, 28, '1 0.96 0.84');
      picto((pictos || [])[i], MARGE + 3, haut - 3, 22);
      texte(`${i + 1}.`, MARGE + 36, y, 10.5, true, '0.17 0.37 0.23');
      lignes.forEach((l, k) => texte(l, MARGE + 54, y - k * pas, 10.5, false));
      y -= h + 6;
    });
    const liste = (items, numerote) => items.forEach((it, i) => { paragraphe(it, 10.5, false, numerote ? 24 : 14, null, numerote ? `${i + 1}.` : '-'); y -= 3; });

    nouvellePage();
    paragraphe(f.titre, 20, true); y -= 4;
    paragraphe(`Niveau : ${f.niveau}  |  Durée : ${f.duree}  |  Budget : ${f.budget}`, 10, false, 0, '0.35 0.38 0.42'); y -= 6;
    paragraphe(f.resume, 11, false); 
    // encart vidéo : QR code vers la fiche en ligne, qui porte la vidéo
    const QR = racine.ZT_QR || (typeof require === 'function' ? require('./qr.js') : null);
    if (opt.url && QR) {
      const m = QR.qrMatrice(opt.url), nq = m.length, cote = 74, s = cote / (nq + 8), hb = cote + 12;
      place(hb + 14); y -= 4;
      const haut = y + 8;
      rect(MARGE, haut - hb, LARGEUR, hb, '1 0.96 0.84');
      const x0 = MARGE + 6, y0 = haut - 6;
      rect(x0, y0 - cote, cote, cote, '1 1 1');
      const mods = [];
      m.forEach((l, r) => l.forEach((c, k) => { if (c) mods.push(`${n(x0 + (k + 4) * s)} ${n(y0 - (r + 5) * s)} ${n(s)} ${n(s)} re`); }));
      ops.push(`q 0 0 0 rg ${mods.join(' ')} f Q`);
      const xt = x0 + cote + 14, lt = LARGEUR - cote - 32; let yt = haut - 22;
      texte('La fiche en vidéo', xt, yt, 13, true); yt -= 17;
      couper('Scannez ce code avec votre téléphone : la fiche s’ouvre sur ZETools avec sa vidéo pas à pas, à suivre pendant le travail.', 10, false, lt).forEach((l) => { texte(l, xt, yt, 10, false); yt -= 13; });
      const v = (f.videos || [])[0];
      if (v) couper(`Vidéo : « ${v.titre} », ${v.chaine}, sur YouTube.`, 8.5, false, lt).forEach((l) => { texte(l, xt, yt, 8.5, false, '0.35 0.38 0.42'); yt -= 11; });
      y = haut - hb - 10;
    }
    titreSection('Outils nécessaires'); liste(f.outils.map((o) => o.nom));
    if ((f.materiaux || []).length) { titreSection('Matériaux et fournitures'); liste(f.materiaux); }
    titreSection('Étapes'); etapes(f.etapes, f.pictos);
    titreSection('Sécurité'); liste(f.securite);
    if (f.astuce) { titreSection('L’astuce du bricoleur'); paragraphe(f.astuce, 10.5, false); }
    y -= 10; paragraphe('Tous ces outils se louent ou s’achètent d’occasion sur ZETools, près de chez vous. Pas envie de le faire vous-même ? Réservez un prestataire dans la rubrique Services.', 10, true, 0, '0.17 0.37 0.23');
    pages.push(ops);

    // pieds de page, une fois le nombre de pages connu
    pages.forEach((p, i) => {
      ops = p; logo(L - MARGE - 16, 40, 16);   // la marque sur chaque page, en tête et en pied
      p.push(`0.87 0.88 0.9 rg ${MARGE} 46 ${LARGEUR} 0.7 re f`);
      const pied = (t, yy) => p.push(`BT /F1 7.5 Tf 0.35 0.38 0.42 rg ${MARGE} ${yy} Td ${chaine(t)} Tj ET`);
      pied(`${soc.nom} SAS · ${soc.siege} · Fiche indicative : suivez toujours la notice du fabricant de vos outils et de vos fournitures.`, 34);
      pied(`Page ${i + 1} / ${pages.length}`, 22);
    });

    return assemblerPdf(pages, { titre: f.titre, auteur: soc.nom + ' SAS', sujet: 'Fiche technique de bricolage' });
  }
  /** Octets du fichier (le PDF produit est entièrement en ASCII). */
  /** Assemble les pages (listes d'opérations de dessin) en un fichier PDF 1.4 complet. */
  function assemblerPdf(pages, info) {
    const objets = [];
    const kids = pages.map((_, i) => `${6 + 2 * i} 0 R`).join(' ');
    objets[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objets[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
    objets[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objets[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objets[5] = `<< /Title ${chaine(info.titre)} /Author ${chaine(info.auteur)} /Subject ${chaine(info.sujet)} /Producer ${chaine('ZETools')} >>`;
    pages.forEach((p, i) => {
      const flux = p.join('\n');
      objets[6 + 2 * i] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${L} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${7 + 2 * i} 0 R >>`;
      objets[7 + 2 * i] = `<< /Length ${flux.length} >>\nstream\n${flux}\nendstream`;
    });
    let pdf = '%PDF-1.4\n'; const positions = [];
    for (let n = 1; n < objets.length; n++) { positions[n] = pdf.length; pdf += `${n} 0 obj\n${objets[n]}\nendobj\n`; }
    const xref = pdf.length;
    pdf += `xref\n0 ${objets.length}\n0000000000 65535 f \n` + positions.slice(1).map((p) => String(p).padStart(10, '0') + ' 00000 n \n').join('');
    pdf += `trailer\n<< /Size ${objets.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return pdf;
  }

  /** Bon cadeau « coupon de travaux » : une page A4 à imprimer ou à envoyer, avec code et QR code. */
  function bonCadeauPdf(c, societe, options) {
    const soc = societe || { nom: 'ZETools', siege: '58 rue de Ponthieu, 75008 Paris' };
    const opt = options || {};
    const ops = []; const n = (v) => Number(v.toFixed(2));
    const texte = (t, x, y, taille, gras, rgb) => ops.push(`BT /${gras ? 'F2' : 'F1'} ${taille} Tf ${rgb || '0.11 0.13 0.15'} rg ${n(x)} ${n(y)} Td ${chaine(t)} Tj ET`);
    const centre = (t, y, taille, gras, rgb) => texte(t, (L - largeur(t, taille, gras)) / 2, y, taille, gras, rgb);
    const rect = (x, y, w, h, rgb) => ops.push(`${rgb} rg ${n(x)} ${n(y)} ${n(w)} ${n(h)} re f`);
    const chemin = (liste, x0, haut, e) => liste.map((p, i) => `${n(x0 + p[0] * e)} ${n(haut - p[1] * e)} ${i ? 'l' : 'm'}`).join(' ') + ' h';
    const logo = (x0, haut, taille) => { const e = taille / 100;
      ops.push(`q 0.96 0.72 0 rg 0.96 0.72 0 RG ${n(8 * e)} w 1 j ${chemin(LOGO.hexagone, x0, haut, e)} B 0.137 0.153 0.169 rg ${chemin(LOGO.z, x0, haut, e)} f Q`); };
    const jj = (d) => d.split('-').reverse().join('/');

    // cadre de la carte : bande anthracite, logo, montant dans un écusson jaune
    rect(0, 0, L, H, '1 1 1');
    rect(40, 300, L - 80, 500, '0.137 0.153 0.169');
    rect(40, 300, L - 80, 6, '0.96 0.72 0');
    logo(70, 772, 44);
    texte('ZE', 124, 742, 26, true, '0.96 0.72 0'); texte('TOOLS', 124 + largeur('ZE', 26, true) + 1, 742, 26, true, '1 1 1');
    const etiquette = 'BON CADEAU TRAVAUX'; texte(etiquette, L - 70 - largeur(etiquette, 11, true), 750, 11, true, '0.96 0.72 0');
    centre(`Pour ${c.destinataire.prenom}`, 660, 30, true, '1 1 1');
    if (c.de) centre(`de la part de ${c.de}`, 632, 13, false, '0.85 0.86 0.88');
    rect(L / 2 - 110, 520, 220, 86, '0.96 0.72 0');
    const montant = `${String(c.montant).replace('.', ',')} €`;
    centre(montant, 548, 44, true, '0.137 0.153 0.169');
    centre(c.themeNom || 'Travaux au choix', 494, 14, true, '1 1 1');
    if (c.message) {
      const lignes = couper(`« ${c.message} »`, 12, false, L - 180).slice(0, 4);
      lignes.forEach((l, i) => centre(l, 462 - i * 17, 12, false, '0.92 0.93 0.94'));
    }
    centre('Des travaux faits par un voisin ou un professionnel, près de chez vous.', 330, 10, false, '0.75 0.77 0.8');

    // code et QR code
    texte('Votre code', 60, 262, 11, false, '0.35 0.38 0.42');
    texte(c.code, 60, 230, 26, true);
    texte(`Valable jusqu’au ${jj(c.expire)}, en une ou plusieurs fois.`, 60, 204, 10.5, false);
    const etapes = ['1. Rendez-vous sur ZETools, rubrique « Offrir des travaux ».', '2. Saisissez votre code dans « Utiliser un coupon ».', '3. Réservez un service ou un artisan : le montant est déduit.'];
    etapes.forEach((t, i) => texte(t, 60, 176 - i * 16, 10, false, '0.17 0.37 0.23'));
    const QR = racine.ZT_QR || (typeof require === 'function' ? require('./qr.js') : null);
    if (QR && opt.url) {
      const m = QR.qrMatrice(opt.url), cote = 116, s = cote / (m.length + 8), x0 = L - 60 - cote, y0 = 272;
      rect(x0, y0 - cote, cote, cote, '1 1 1');
      const mods = []; m.forEach((l, r) => l.forEach((v, k) => { if (v) mods.push(`${n(x0 + (k + 4) * s)} ${n(y0 - (r + 5) * s)} ${n(s)} ${n(s)} re`); }));
      ops.push(`q 0 0 0 rg ${mods.join(' ')} f Q`);
      const sc = 'Scannez pour l’utiliser'; texte(sc, x0 + (cote - largeur(sc, 8.5, false)) / 2, y0 - cote - 12, 8.5, false, '0.35 0.38 0.42');
    }
    // conditions et pied
    ops.push(`0.87 0.88 0.9 rg 60 96 ${L - 120} 0.7 re f`);
    couper(`Coupon non remboursable et non échangeable contre des espèces. Utilisable sur ZETools pour les services entre membres et les travaux d’artisans, dans la limite de son solde. Le solde restant reste disponible jusqu’à la date de validité. Conditions complètes : conditions générales d’utilisation, article « Coupons de travaux ».`, 8, false, L - 120)
      .forEach((l, i) => texte(l, 60, 82 - i * 11, 8, false, '0.35 0.38 0.42'));
    texte(`${soc.nom} SAS · ${soc.siege}`, 60, 30, 7.5, false, '0.35 0.38 0.42');
    return assemblerPdf([ops], { titre: `Bon cadeau travaux ${c.code}`, auteur: soc.nom + ' SAS', sujet: 'Coupon de travaux à offrir' });
  }
  const nomFichierCoupon = (c) => `ZETools-bon-cadeau-${c.code}.pdf`;

  function octets(pdf) { const o = new Uint8Array(pdf.length); for (let i = 0; i < pdf.length; i++) o[i] = pdf.charCodeAt(i) & 0xFF; return o; }
  const nomFichier = (f) => 'zetools-fiche-' + String(f.titre).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '.pdf';

  const ZT_PDF = { fichePdf, bonCadeauPdf, nomFichierCoupon, assemblerPdf, octets, nomFichier, largeur, couper, PICTOS, pictoSvg, logoSvg };
  if (typeof module !== 'undefined' && module.exports) module.exports = ZT_PDF;
  else racine.ZT_PDF = ZT_PDF;
})(typeof window !== 'undefined' ? window : globalThis);
