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

  /** Construit le PDF d'une fiche technique. Retourne le fichier sous forme de chaîne ASCII. */
  function fichePdf(f, societe) {
    const soc = societe || { nom: 'ZETools', siege: '58 rue de Ponthieu, 75008 Paris' };
    const pages = []; let ops = []; let y = 0;
    const texte = (t, x, yy, taille, gras, rgb) => ops.push(`BT /${gras ? 'F2' : 'F1'} ${taille} Tf ${rgb || '0.11 0.13 0.15'} rg ${x.toFixed(1)} ${yy.toFixed(1)} Td ${chaine(t)} Tj ET`);
    const rect = (x, yy, w, h, rgb) => ops.push(`${rgb} rg ${x} ${yy.toFixed(1)} ${w} ${h} re f`);
    const nouvellePage = () => {
      if (ops.length) pages.push(ops);
      ops = [];
      rect(0, H - 56, L, 56, '0.137 0.153 0.169');
      texte('ZE', MARGE, H - 36, 18, true, '0.96 0.72 0'); texte('TOOLS', MARGE + largeur('ZE', 18, true) + 1, H - 36, 18, true, '1 1 1');
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
    const liste = (items, numerote) => items.forEach((it, i) => { paragraphe(it, 10.5, false, numerote ? 24 : 14, null, numerote ? `${i + 1}.` : '-'); y -= 3; });

    nouvellePage();
    paragraphe(f.titre, 20, true); y -= 4;
    paragraphe(`Niveau : ${f.niveau}  |  Durée : ${f.duree}  |  Budget : ${f.budget}`, 10, false, 0, '0.35 0.38 0.42'); y -= 6;
    paragraphe(f.resume, 11, false); 
    titreSection('Outils nécessaires'); liste(f.outils.map((o) => o.nom));
    if ((f.materiaux || []).length) { titreSection('Matériaux et fournitures'); liste(f.materiaux); }
    titreSection('Étapes'); liste(f.etapes, true);
    titreSection('Sécurité'); liste(f.securite);
    if (f.astuce) { titreSection('L’astuce du bricoleur'); paragraphe(f.astuce, 10.5, false); }
    y -= 10; paragraphe('Tous ces outils se louent ou s’achètent d’occasion sur ZETools, près de chez vous. Pas envie de le faire vous-même ? Réservez un prestataire dans la rubrique Services.', 10, true, 0, '0.17 0.37 0.23');
    pages.push(ops);

    // pieds de page, une fois le nombre de pages connu
    pages.forEach((p, i) => {
      p.push(`0.87 0.88 0.9 rg ${MARGE} 46 ${LARGEUR} 0.7 re f`);
      const pied = (t, yy) => p.push(`BT /F1 7.5 Tf 0.35 0.38 0.42 rg ${MARGE} ${yy} Td ${chaine(t)} Tj ET`);
      pied(`${soc.nom} SAS · ${soc.siege} · Fiche indicative : suivez toujours la notice du fabricant de vos outils et de vos fournitures.`, 34);
      pied(`Page ${i + 1} / ${pages.length}`, 22);
    });

    // assemblage des objets
    const objets = [];
    const kids = pages.map((_, i) => `${6 + 2 * i} 0 R`).join(' ');
    objets[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objets[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
    objets[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objets[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objets[5] = `<< /Title ${chaine(f.titre)} /Author ${chaine(soc.nom + ' SAS')} /Subject ${chaine('Fiche technique de bricolage')} /Producer ${chaine('ZETools')} >>`;
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
  /** Octets du fichier (le PDF produit est entièrement en ASCII). */
  function octets(pdf) { const o = new Uint8Array(pdf.length); for (let i = 0; i < pdf.length; i++) o[i] = pdf.charCodeAt(i) & 0xFF; return o; }
  const nomFichier = (f) => 'zetools-fiche-' + String(f.titre).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '.pdf';

  const ZT_PDF = { fichePdf, octets, nomFichier, largeur, couper };
  if (typeof module !== 'undefined' && module.exports) module.exports = ZT_PDF;
  else racine.ZT_PDF = ZT_PDF;
})(typeof window !== 'undefined' ? window : globalThis);
