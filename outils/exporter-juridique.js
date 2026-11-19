/* Exporte les textes de juridique.js en Markdown, un fichier par document : node outils/exporter-juridique.js
   Les fichiers produits (dossier juridique/) servent à la relecture par l'avocat. Ne pas les modifier à la main :
   corriger juridique.js puis relancer l'export. */
'use strict';
const fs = require('fs');
const path = require('path');
const J = require('../juridique.js');

function versMarkdown(html) {
  return html
    .replace(/<span class="a-completer">(.*?)<\/span>/g, '**$1**')
    .replace(/<tr>(.*?)<\/tr>/gs, (_, l) => {
      const entete = /<th>/.test(l);
      const cases = [...l.matchAll(/<t[hd]>(.*?)<\/t[hd]>/gs)].map((c) => c[1].trim());
      return '| ' + cases.join(' | ') + ' |\n' + (entete ? '|' + cases.map(() => '---').join('|') + '|\n' : '');
    })
    .replace(/<\/?table>/g, '\n')
    .replace(/<ol>(.*?)<\/ol>/gs, (_, l) => { let n = 0; return '\n' + l.replace(/<li>(.*?)<\/li>/gs, (_m, t) => `${++n}. ${t.trim()}\n`); })
    .replace(/<li>(.*?)<\/li>/gs, (_, t) => `- ${t.trim()}\n`)
    .replace(/<\/?ul>/g, '\n')
    .replace(/<p>(.*?)<\/p>/gs, (_, t) => `${t.trim()}\n\n`)
    .replace(/<\/?b>/g, '**')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/^((?:- |\d+\. ).*)\n\n(?=- |\d+\. )/gm, '$1\n').trim();
}

const dossier = path.join(__dirname, '..', 'juridique');
fs.mkdirSync(dossier, { recursive: true });
J.PAGES.forEach((p, i) => {
  const md = [`# ${p.titre}`, '',
    `${J.SOCIETE.nom} SAS · ${J.SOCIETE.siege}`, '',
    `> ${J.SOCIETE.version}. Document de travail, à faire valider par un avocat avant mise en ligne. Les mentions **[À COMPLÉTER : …]** restent à renseigner.`, '',
    p.intro, '',
    ...p.sections.flatMap(([t, h]) => [`## ${t}`, '', versMarkdown(h), '']),
  ].join('\n');
  const nom = `${i + 1}-${p.id}.md`;
  fs.writeFileSync(path.join(dossier, nom), md);
  console.log('juridique/' + nom, md.length, 'caractères');
});
