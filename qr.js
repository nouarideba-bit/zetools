/* ZETools · générateur de QR code sans dépendance (norme ISO/IEC 18004).
   Mode octets, correction d'erreur niveau M (environ 15 % du code peut être abîmé), versions 1 à 6 :
   jusqu'à 106 octets, assez pour l'adresse d'une fiche.
   Renvoie une matrice de booléens (true = module noir), sans la marge blanche de 4 modules à prévoir autour.
   Fonctionne dans le navigateur (window.ZT_QR) et sous Node (module.exports) pour les tests. */
(function (racine) {
  'use strict';

  const ECC_PAR_BLOC = [10, 16, 26, 18, 24, 16];   // niveau M, versions 1 à 6
  const NB_BLOCS = [1, 1, 1, 2, 2, 4];

  function modulesDonnees(v) {                       // modules disponibles pour les données et la correction
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; }
    return r;
  }
  const octetsDonnees = (v) => Math.floor(modulesDonnees(v) / 8) - ECC_PAR_BLOC[v - 1] * NB_BLOCS[v - 1];

  // Reed-Solomon sur GF(256), polynôme 0x11D
  function mul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; }
  function diviseur(deg) {
    const r = new Array(deg).fill(0); r[deg - 1] = 1; let racineG = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) { r[j] = mul(r[j], racineG); if (j + 1 < deg) r[j] ^= r[j + 1]; }
      racineG = mul(racineG, 2);
    }
    return r;
  }
  function reste(donnees, div) {
    const r = new Array(div.length).fill(0);
    for (const b of donnees) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); }
    return r;
  }

  function encoder(texte) {
    const octets = Array.from(new TextEncoder().encode(texte));
    let v = 1;
    while (v <= 6 && 4 + 8 + octets.length * 8 > octetsDonnees(v) * 8) v++;
    if (v > 6) throw new Error('Texte trop long pour le QR code (106 octets au plus)');
    const cap = octetsDonnees(v) * 8;
    const bits = [];
    const ajouter = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    ajouter(4, 4); ajouter(octets.length, 8); octets.forEach((o) => ajouter(o, 8));
    ajouter(0, Math.min(4, cap - bits.length));
    ajouter(0, (8 - (bits.length % 8)) % 8);
    for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) ajouter(p, 8);
    const donnees = [];
    for (let i = 0; i < bits.length; i += 8) donnees.push(parseInt(bits.slice(i, i + 8).join(''), 2));

    // blocs, correction d'erreur, entrelacement
    const nb = NB_BLOCS[v - 1], ecc = ECC_PAR_BLOC[v - 1], brut = Math.floor(modulesDonnees(v) / 8);
    const courts = nb - (brut % nb), longCourt = Math.floor(brut / nb), div = diviseur(ecc);
    const blocs = []; let k = 0;
    for (let i = 0; i < nb; i++) {
      const d = donnees.slice(k, k + longCourt - ecc + (i < courts ? 0 : 1)); k += d.length;
      const e = reste(d, div); if (i < courts) d.push(0);
      blocs.push(d.concat(e));
    }
    const mots = [];
    for (let i = 0; i < blocs[0].length; i++) blocs.forEach((b, j) => { if (i !== longCourt - ecc || j >= courts) mots.push(b[i]); });
    return { v, mots };
  }

  function qrMatrice(texte) {
    const { v, mots } = encoder(texte);
    const n = v * 4 + 17;
    const m = Array.from({ length: n }, () => new Array(n).fill(false));
    const fonction = Array.from({ length: n }, () => new Array(n).fill(false));
    const poser = (x, y, noir) => { m[y][x] = noir; fonction[y][x] = true; };

    for (let i = 0; i < n; i++) { poser(6, i, i % 2 === 0); poser(i, 6, i % 2 === 0); }      // lignes de synchronisation
    const reperes = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < n && y >= 0 && y < n) poser(x, y, d !== 2 && d !== 4); } };
    reperes(3, 3); reperes(n - 4, 3); reperes(3, n - 4);                                      // trois carrés de repérage
    if (v >= 2) {                                                                             // motif d'alignement (un seul jusqu'à la version 6)
      const c = n - 7;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) poser(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    const format = (masque) => {                                                              // niveau M (00) + masque, BCH(15,5)
      const d = masque; let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412; const bit = (i) => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) poser(8, i, bit(i));
      poser(8, 7, bit(6)); poser(8, 8, bit(7)); poser(7, 8, bit(8));
      for (let i = 9; i < 15; i++) poser(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) poser(n - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) poser(8, n - 15 + i, bit(i));
      poser(8, n - 8, true);                                                                  // module noir fixe
    };
    format(0);

    // placement des mots en zigzag, de droite à gauche
    let i = 0;
    for (let droite = n - 1; droite >= 1; droite -= 2) {
      if (droite === 6) droite = 5;
      for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
        const x = droite - j, monte = ((droite + 1) & 2) === 0, y = monte ? n - 1 - vert : vert;
        if (!fonction[y][x] && i < mots.length * 8) { m[y][x] = ((mots[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
      }
    }

    const regle = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
      (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0];
    const masquer = (k) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fonction[y][x] && regle[k](x, y)) m[y][x] = !m[y][x]; };
    const penalite = () => {                                                                  // règles 1, 2 et 4 de la norme
      let p = 0;
      for (let a = 0; a < n; a++) for (const ligne of [true, false]) {
        let suite = 1;
        for (let b = 1; b <= n; b++) {
          const meme = b < n && (ligne ? m[a][b] === m[a][b - 1] : m[b][a] === m[b - 1][a]);
          if (meme) suite++; else { if (suite >= 5) p += suite - 2; suite = 1; }
        }
      }
      for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
      let noirs = 0; m.forEach((l) => l.forEach((c) => { if (c) noirs++; }));
      return p + Math.floor(Math.abs(noirs * 20 - n * n * 10) / (n * n)) * 10;
    };
    let meilleur = 0, min = Infinity;
    for (let k = 0; k < 8; k++) { masquer(k); format(k); const p = penalite(); if (p < min) { min = p; meilleur = k; } masquer(k); }
    masquer(meilleur); format(meilleur);
    return m;
  }

  /** QR code en SVG, marge blanche comprise. */
  function qrSvg(texte, taille) {
    const m = qrMatrice(texte), n = m.length, t = n + 8;
    let d = '';
    m.forEach((l, y) => l.forEach((c, x) => { if (c) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
    return `<svg class="qr" width="${taille || 120}" height="${taille || 120}" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  const ZT_QR = { qrMatrice, qrSvg, octetsDonnees };
  if (typeof module !== 'undefined' && module.exports) module.exports = ZT_QR;
  racine.ZT_QR = ZT_QR;
})(typeof window !== 'undefined' ? window : globalThis);
