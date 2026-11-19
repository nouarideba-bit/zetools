/* ZETOOLS · textes juridiques (projet à faire valider par un avocat avant mise en ligne).
   Les chiffres viennent de logique.js (REGLES) : un seul endroit à modifier.
   Fonctionne dans le navigateur (window.ZT_JURIDIQUE) et sous Node (module.exports). */
(function (racine) {
  'use strict';
  const Z = (typeof module !== 'undefined' && module.exports) ? require('./logique.js') : racine.ZT;
  const R = Z.REGLES;
  const pc = (x) => String(Math.round(x * 1000) / 10).replace('.', ',') + ' %';
  const eur = (x) => String(x).replace('.', ',') + ' €';
  const AC = (quoi) => `<span class="a-completer">[À COMPLÉTER : ${quoi}]</span>`;

  const SOCIETE = {
    nom: 'ZETools', forme: 'société par actions simplifiée (SAS)',
    siege: '58 rue de Ponthieu, 75008 Paris', version: 'Projet du 19 novembre 2026',
  };
  const S = `<b>ZETools</b>, ${SOCIETE.forme} au capital de ${AC('montant du capital')}, dont le siège social est situé ${SOCIETE.siege}, immatriculée au registre du commerce et des sociétés de Paris sous le numéro ${AC('numéro SIREN')}`;
  const plaf = R.plafondsVente;

  const PAGES = [
    /* ------------------------------------------------------------------ */
    { id: 'cgu', titre: 'Conditions générales d’utilisation et de services', court: 'Conditions générales',
      intro: 'Elles s’appliquent à toute personne qui utilise la plateforme ZETools, comme particulier ou comme professionnel. Les professionnels sont en outre soumis aux conditions particulières professionnels et enseignes.',
      sections: [
        ['Article 1. Objet', `<p>Les présentes conditions régissent l’accès et l’utilisation de la plateforme ZETools (site et application), éditée par ${S} (« ZETools »).</p>
          <p>La plateforme met en relation ses membres pour : la vente d’outils, la location d’outils, l’échange d’outils, la mise en relation avec des artisans et des réparateurs, l’achat de produits déstockés par des enseignes, et la prise de rendez-vous entre membres.</p>`],
        ['Article 2. Définitions', `<ul>
          <li><b>Membre</b> : toute personne titulaire d’un compte.</li>
          <li><b>Particulier</b> : membre qui agit à des fins qui n’entrent pas dans le cadre d’une activité professionnelle.</li>
          <li><b>Professionnel</b> : membre qui agit dans le cadre de son activité commerciale, artisanale, industrielle ou libérale, y compris les artisans abonnés et les enseignes.</li>
          <li><b>Annonce</b> : offre de vente, de location ou d’échange publiée par un membre.</li>
          <li><b>Transaction</b> : contrat conclu entre deux membres par l’intermédiaire de la plateforme.</li>
          <li><b>Prestataire de paiement</b> : l’établissement agréé qui encaisse et reverse les fonds, ${AC('nom et agrément du prestataire, par exemple Stripe ou Mangopay')}.</li></ul>`],
        ['Article 3. Rôle de ZETools', `<p>ZETools est un opérateur de plateforme en ligne au sens de l’article L. 111-7 du Code de la consommation, et un hébergeur des contenus publiés par les membres.</p>
          <p><b>ZETools n’est pas partie aux contrats</b> de vente, de location, d’échange, de travaux ou de réparation : ces contrats sont conclus directement entre les membres. ZETools n’est ni vendeur, ni loueur, ni entrepreneur de travaux, et ne vérifie pas matériellement les outils.</p>
          <p>ZETools fournit en revanche ses propres services, dont elle répond : mise en relation, messagerie, agenda, paiement sécurisé par le prestataire de paiement, gestion de la caution, traitement des litiges.</p>`],
        ['Article 4. Inscription et compte', `<ul>
          <li>L’inscription est réservée aux personnes majeures et capables, et aux personnes morales représentées par une personne habilitée.</li>
          <li>Le membre fournit des informations exactes et les tient à jour. Un numéro de téléphone vérifié est exigé pour publier, louer ou réserver.</li>
          <li>Le prestataire de paiement vérifie l’identité du membre avant tout versement, conformément à la réglementation de lutte contre le blanchiment.</li>
          <li>Le membre indique s’il agit comme particulier ou comme professionnel. Se présenter comme particulier alors que l’on agit à titre professionnel constitue une pratique commerciale trompeuse (article L. 121-4 du Code de la consommation).</li>
          <li>Le compte est personnel. Le membre garde ses identifiants secrets et répond de l’usage de son compte.</li></ul>`],
        ['Article 5. Annonces', `<p>Le membre publie sous sa seule responsabilité. Il garantit qu’il est propriétaire de l’outil ou autorisé à en disposer, et que la description, l’état et les photos sont fidèles.</p>
          <p><b>Sont interdits</b> : les outils volés ou d’origine douteuse ; les outils rappelés par leur fabricant ; les machines dont les dispositifs de sécurité ont été retirés ou neutralisés ; les équipements de protection individuelle contre les chutes ou à usage unique déjà utilisés ; les contrefaçons ; les produits dont la vente entre particuliers est réglementée (produits chimiques, explosifs, armes).</p>
          <p>Un outil en panne est publié avec l’état « À réparer » et la description de la panne.</p>
          <p><b>Prix plafonnés.</b> ZETools est une place de marché d’outils à petit prix. Le prix de vente ne peut dépasser une part du prix neuf de référence, selon l’état : ${pc(plaf['Neuf'])} pour un outil neuf, ${pc(plaf['Très bon état'])} en très bon état, ${pc(plaf['Bon état'])} en bon état, ${pc(plaf['État correct'])} en état correct, ${pc(plaf['À réparer'])} à réparer. Le loyer ne peut dépasser ${pc(R.locationJourMax)} du prix neuf par jour. Le détail figure dans les règles de prix.</p>`],
        ['Article 6. Classement des annonces et avis', `<p><b>Classement.</b> Par défaut, les annonces sont classées selon : la correspondance avec la recherche, la proximité géographique, la disponibilité aux dates demandées, la date de publication et la note du membre. Aucune rémunération ne modifie ce classement, sauf mention « Annonce mise en avant » apposée sur l’annonce concernée (articles L. 111-7 et D. 111-7 du Code de la consommation).</p>
          <p><b>Avis.</b> Seuls les membres ayant réalisé une transaction ou un rendez-vous confirmé peuvent déposer un avis. Les avis sont contrôlés avant publication, publiés par ordre chronologique et conservés ${AC('durée de publication des avis')}. Un avis peut être refusé s’il est injurieux, hors sujet ou s’il contient des données personnelles ; son auteur en est informé (articles L. 111-7-2 et D. 111-17 du Code de la consommation).</p>`],
        ['Article 7. Vente', `<p>La vente est conclue entre le vendeur et l’acheteur lorsque l’acheteur paie le prix. Le prix est conservé par le prestataire de paiement jusqu’à la confirmation de la remise par l’acheteur (code de remise ou QR code), puis versé au vendeur, déduction faite de la commission.</p>
          <p><b>Offres de prix.</b> L’acheteur ou le locataire peut proposer un prix inférieur au prix affiché, dans la limite de ${pc(R.offres.plancher)} de ce prix. Son offre l’engage pendant ${R.offres.validiteHeures} heures (article 1116 du Code civil). Le propriétaire l’accepte, la refuse ou fait une contre-proposition, valable ${R.offres.validiteHeures} heures. Le contrat est formé par l’acceptation, au prix convenu, et le paiement intervient dans les ${R.offres.validiteHeures} heures ; à défaut, l’accord est caduc. Les commissions et frais se calculent sur le prix convenu.</p>
          <p>Vendeur professionnel : l’acheteur consommateur bénéficie du droit de rétractation, de la garantie légale de conformité et de la garantie des vices cachés (article 18). Vendeur particulier : seule la garantie des vices cachés des articles 1641 et suivants du Code civil s’applique, ainsi que l’obligation de délivrer un outil conforme à l’annonce.</p>`],
        ['Article 8. Location', `<ul>
          <li>La location est un contrat de louage de chose conclu entre le propriétaire et le locataire (articles 1709 et suivants du Code civil), pour une durée de 1 à ${R.dureeMax} jours.</li>
          <li>Le locataire utilise l’outil conformément à sa destination et à la notice, avec les équipements de protection adaptés. Il ne le prête pas et ne le sous-loue pas.</li>
          <li>Un état des lieux photographique est réalisé à la remise et au retour, dans l’application. Il fait foi entre les parties.</li>
          <li>Le locataire répond des dégradations et des pertes survenues pendant la location, sauf s’il prouve qu’elles ont eu lieu sans sa faute (article 1732 du Code civil). L’usure normale reste à la charge du propriétaire.</li>
          <li>Le loyer est versé au propriétaire 24 heures après le retour, si aucun litige n’est ouvert.</li></ul>`],
        ['Article 9. Caution', `<p>La caution prend la forme d’une <b>empreinte bancaire</b> : une autorisation de prélèvement sur la carte du locataire, qui n’est pas débitée. Elle est levée au retour de l’outil en bon état.</p>
          <p>En cas de dégradation, de perte ou de non-restitution, constatée par l’état des lieux, tout ou partie de la caution peut être prélevée, après une procédure contradictoire de 72 heures pendant laquelle le locataire présente ses observations. Le fonctionnement détaillé figure à la page « Sécurité et caution ».</p>`],
        ['Article 10. Échange', `<p>L’échange est un contrat par lequel les membres se donnent un outil pour un autre (articles 1702 et suivants du Code civil). Si les valeurs diffèrent, les membres peuvent convenir d’une soulte, payée par l’intermédiaire de la plateforme. Chaque partie règle des frais de mise en relation de ${eur(R.fraisEchange)}.</p>`],
        ['Article 11. Artisans, travaux et réparations', `<p>Le client publie gratuitement une demande de travaux ou de réparation. Les artisans abonnés y répondent par un devis. Le contrat de travaux ou de réparation est conclu directement entre le client et l’artisan, qui en est seul responsable : conformité, délais, garanties légales, assurance de responsabilité civile et, pour les ouvrages qui en relèvent, assurance décennale (article 1792 du Code civil).</p>
          <p><b>Services proposés par les membres.</b> Un membre peut publier une offre de service, à l’heure ou au forfait. Le client réserve un jour et une heure et paie en ligne ; le prix est conservé par le prestataire de paiement et versé au prestataire une fois le service rendu. Le contrat de prestation de services est conclu directement entre le client et le prestataire.</p>
          <p><b>Assurance des services.</b> Un prestataire particulier n’a pas d’assurance de responsabilité civile professionnelle. Avant tout paiement, la plateforme indique au client si la prestation est assurée, et par qui. Le prestataire peut souscrire l’assurance de responsabilité civile proposée par ZETools, pour ${pc(R.service.assurancePrestataireTaux)} du prix de chaque prestation. Le client peut souscrire, par une case qu’il coche lui-même, l’assurance dommages proposée par ZETools, pour ${pc(R.service.assuranceClientTaux)} du prix avec un minimum de ${eur(R.service.assuranceClientMin)}. À défaut d’assurance, les dommages se règlent directement entre le client et le prestataire. Garanties, plafonds et exclusions : ${AC('assureur et notice d’information de l’assurance des services')}.</p>
          <p>Un particulier ne peut proposer que de petits services occasionnels : petit bricolage, montage, jardinage courant, cours. Les activités soumises à qualification professionnelle, notamment l’électricité, la plomberie, le gaz et la maçonnerie, sont réservées aux professionnels qualifiés et immatriculés (article L. 121-1 du Code de l’artisanat). Le prestataire particulier déclare ses revenus ; une activité habituelle impose un statut professionnel.</p>
          <p>ZETools vérifie à l’inscription le numéro SIRET et, pour les gros travaux, l’attestation d’assurance décennale, sur la base des documents fournis. Cette vérification ne vaut pas garantie de la qualité des travaux.</p>`],
        ['Article 12. Déstockage des enseignes', `<p>Les produits proposés en déstockage sont vendus par des professionnels identifiés sur chaque offre. Le prix barré est le prix le plus bas pratiqué par l’enseigne au cours des trente jours précédant la réduction (article L. 112-1-1 du Code de la consommation). L’achat est limité à ${R.maxParClient} unités par client et par lot. Le retrait a lieu en magasin, sur présentation du code de retrait, dans un délai de 7 jours.</p>`],
        ['Article 13. Agenda et rendez-vous', `<ul>
          <li>Un membre peut proposer jusqu’à ${R.rdv.maxCreneaux} créneaux pour des travaux, un échange, une réparation ou la remise d’un outil. Le rendez-vous est confirmé lorsque l’autre membre accepte un créneau.</li>
          <li>L’annulation est libre jusqu’à ${R.rdv.annulationGratuiteHeures} heures avant le rendez-vous. Passé ce délai, ou en cas d’absence, l’annulation est mentionnée sur le profil du membre. Des absences répétées peuvent entraîner la suspension du compte.</li>
          <li>L’adresse exacte n’est communiquée qu’après confirmation. Pour un échange entre particuliers, ZETools recommande un lieu public.</li></ul>`],
        ['Article 14. Prix des services de ZETools', `<table><tr><th>Service</th><th>Prix, toutes taxes comprises</th></tr>
          <tr><td>Inscription, publication d’annonces, demande de travaux, agenda</td><td>Gratuit</td></tr>
          <tr><td>Vente</td><td>Commission de ${pc(R.commissionVente)} du prix, à la charge du vendeur</td></tr>
          <tr><td>Location, côté locataire</td><td>Frais de service de ${pc(R.fraisServiceLocataire)} du loyer</td></tr>
          <tr><td>Location, côté propriétaire</td><td>Commission de ${R.paliersCommission.map((p) => pc(p.taux) + (p.aPartirDe ? ' à partir de ' + p.aPartirDe + ' locations' : '')).join(', puis ')}</td></tr>
          <tr><td>Échange</td><td>${eur(R.fraisEchange)} par partie</td></tr>
          <tr><td>Service réservé en ligne, côté client</td><td>Frais de service de ${pc(R.service.fraisClient)} du prix</td></tr>
          <tr><td>Service réservé en ligne, côté prestataire</td><td>Commission de ${pc(R.service.commission)} du prix ; aucune commission pour les artisans abonnés</td></tr>
          <tr><td>Assurance dommages d’un service, optionnelle, côté client</td><td>${pc(R.service.assuranceClientTaux)} du prix, avec un minimum de ${eur(R.service.assuranceClientMin)}</td></tr>
          <tr><td>Assurance responsabilité civile du prestataire, optionnelle</td><td>${pc(R.service.assurancePrestataireTaux)} du prix de chaque prestation, déduits du versement</td></tr>
          <tr><td>Fiches techniques en PDF</td><td>Gratuit</td></tr>
          <tr><td>Garantie casse et vol, optionnelle</td><td>${pc(R.assuranceTaux)} du loyer, avec un minimum de ${eur(R.assuranceMin)}</td></tr></table>
          <p>Aucune option payante n’est cochée d’avance : toute assurance résulte d’un choix exprès du membre (article L. 121-17 du Code de la consommation).</p>
          <p>Le prix total, frais compris, est affiché avant tout paiement. Les tarifs des professionnels figurent dans les conditions particulières.</p>`],
        ['Article 15. Paiement', `<p>Les paiements sont encaissés par le prestataire de paiement, sur un compte de cantonnement. <b>ZETools ne détient à aucun moment les fonds des membres.</b> Le membre accepte les conditions du prestataire de paiement lors de l’ouverture de son compte de paiement.</p>
          <p>Tout paiement hors plateforme prive le membre du séquestre, de la caution, de la garantie optionnelle et du traitement des litiges.</p>`],
        ['Article 16. Messagerie et coordonnées', `<p>Avant le paiement ou la confirmation d’un rendez-vous, la messagerie masque automatiquement les numéros de téléphone, adresses électroniques, adresses postales, coordonnées bancaires et liens externes. Les coordonnées utiles sont communiquées après la transaction. Le contournement répété de cette protection peut entraîner la suspension du compte.</p>`],
        ['Article 17. Obligations fiscales et sociales', `<p>Les revenus tirés de la plateforme peuvent être imposables et soumis à cotisations sociales. ZETools informe les membres de leurs obligations à chaque transaction et leur adresse chaque année, en janvier, un récapitulatif des opérations (article 242 bis du Code général des impôts).</p>
          <p>ZETools déclare chaque année à l’administration fiscale les opérations qui entrent dans le champ des articles 1649 ter A et suivants du Code général des impôts. Pour les ventes de biens, sont déclarés les membres qui ont réalisé dans l’année au moins 30 ventes ou perçu plus de 2 000 €. Le membre concerné reçoit copie des informations transmises.</p>
          <p>Pour information : la vente occasionnelle d’un bien personnel d’occasion n’est en principe pas imposable lorsque son prix n’excède pas 5 000 € (article 150 UA du Code général des impôts) ; les loyers sont des revenus à déclarer. Le membre qui vend ou loue de manière habituelle doit exercer sous un statut professionnel.</p>`],
        ['Article 18. Droit de rétractation et garanties', `<p><b>Services de ZETools.</b> Le consommateur dispose de 14 jours pour se rétracter d’un service payant de ZETools (article L. 221-18 du Code de la consommation). S’il demande l’exécution immédiate du service, il reconnaît perdre ce droit une fois le service pleinement exécuté (article L. 221-28, 1°).</p>
          <p><b>Achat auprès d’un professionnel</b> (vendeur professionnel, enseigne) : le consommateur dispose de 14 jours à compter de la réception ou du retrait pour se rétracter, sans motif. Il bénéficie de la garantie légale de conformité pendant 2 ans (articles L. 217-3 et suivants du Code de la consommation ; pour un bien d’occasion, le défaut est présumé exister à la délivrance pendant 12 mois) et de la garantie des vices cachés.</p>
          <p><b>Transaction entre particuliers</b> : le droit de rétractation et la garantie légale de conformité ne s’appliquent pas. La garantie des vices cachés s’applique.</p>
          <p><b>Location auprès d’un professionnel</b> : le consommateur dispose du droit de rétractation de 14 jours. S’il demande que la location commence avant la fin de ce délai, il paie la part du loyer correspondant aux jours écoulés (article L. 221-25) et perd son droit une fois la location entièrement exécutée (article L. 221-28, 1°). Entre particuliers, les conditions d’annulation affichées sur l’annonce s’appliquent.</p>`],
        ['Article 19. Signalement, modération et suspension', `<p>Toute personne peut signaler un contenu illicite par le bouton « Signaler » ou à l’adresse ${AC('adresse de signalement')}. ZETools traite les signalements avec diligence et informe leur auteur de la suite donnée.</p>
          <p>ZETools peut retirer une annonce, restreindre sa visibilité, suspendre ou clôturer un compte en cas de manquement aux présentes conditions ou de contenu illicite. Le membre reçoit une décision motivée et peut la contester gratuitement auprès de ${AC('adresse de réclamation')} pendant six mois (règlement (UE) 2022/2065 sur les services numériques).</p>`],
        ['Article 20. Responsabilité', `<p>ZETools répond de l’exécution de ses propres services. Elle ne répond pas de l’exécution des contrats conclus entre les membres, de l’état des outils, de la qualité des travaux ni des dommages causés par l’usage d’un outil.</p>
          <p>Les fiches techniques et les articles de L’Atelier sont fournis à titre d’information générale. Ils ne remplacent ni la notice du fabricant, ni l’avis d’un professionnel. L’utilisateur reste seul juge de sa capacité à réaliser les travaux et de la conformité de son installation.</p>
          <p>En qualité d’hébergeur, ZETools n’est responsable des contenus publiés par les membres que si, ayant eu connaissance de leur caractère illicite, elle n’a pas agi promptement pour les retirer.</p>
          <p>Aucune clause des présentes ne limite les droits que la loi reconnaît au consommateur, ni la responsabilité de ZETools en cas de faute lourde, de dol ou de dommage corporel.</p>`],
        ['Article 21. Données personnelles', `<p>ZETools traite les données personnelles des membres dans les conditions décrites dans la politique de confidentialité.</p>`],
        ['Article 22. Propriété intellectuelle', `<p>La marque, le logo, la charte graphique et les logiciels de la plateforme appartiennent à ZETools. Le membre conserve ses droits sur ses photos et ses textes ; il accorde à ZETools une licence gratuite et non exclusive de reproduction et de représentation, pour le monde entier et pour la durée de publication de l’annonce, aux seules fins d’exploiter et de promouvoir la plateforme.</p>
          <p>Les fiches techniques peuvent être téléchargées, imprimées et partagées gratuitement pour un usage personnel, sans modification et avec la mention de ZETools. Toute exploitation commerciale est soumise à autorisation.</p>`],
        ['Article 23. Durée, résiliation, modification', `<p>Le contrat est conclu pour une durée indéterminée. Le membre peut clôturer son compte à tout moment, depuis son espace, sans frais ; les transactions en cours vont à leur terme.</p>
          <p>ZETools peut modifier les présentes conditions. Les membres en sont informés par courrier électronique au moins 15 jours avant l’entrée en vigueur. Le membre qui refuse la modification peut clôturer son compte.</p>`],
        ['Article 24. Réclamations et médiation', `<p>Toute réclamation est adressée à ${AC('adresse du service clients')}. ZETools y répond dans un délai de 30 jours.</p>
          <p>À défaut de solution, le consommateur peut saisir gratuitement le médiateur de la consommation : ${AC('nom, adresse et site du médiateur')} (articles L. 612-1 et suivants du Code de la consommation).</p>`],
        ['Article 25. Droit applicable et tribunaux', `<p>Les présentes conditions sont soumises au droit français. Le consommateur peut saisir, à son choix, le tribunal de son domicile ou celui du lieu de livraison ou d’exécution (article R. 631-3 du Code de la consommation). Entre professionnels, le tribunal de commerce de Paris est seul compétent.</p>`],
      ] },

    /* ------------------------------------------------------------------ */
    { id: 'pros', titre: 'Conditions particulières professionnels, artisans et enseignes', court: 'Conditions professionnels et enseignes',
      intro: 'Elles complètent les conditions générales pour les membres qui agissent à titre professionnel. En cas de contradiction, elles prévalent.',
      sections: [
        ['Article 1. Accès', `<p>Le compte professionnel est ouvert après vérification : numéro SIRET, extrait d’immatriculation de moins de trois mois, identité du représentant, coordonnées bancaires auprès du prestataire de paiement. Le professionnel certifie ne proposer que des produits et services conformes au droit de l’Union européenne. Ses nom, adresse, numéro d’immatriculation et coordonnées sont affichés sur ses offres (article L. 111-7 du Code de la consommation ; article 30 du règlement (UE) 2022/2065).</p>`],
        ['Article 2. Obligations du professionnel envers les consommateurs', `<p>Le professionnel reste seul responsable de ses obligations légales : information précontractuelle, droit de rétractation de 14 jours, garantie légale de conformité, garantie des vices cachés, facturation, reprise des équipements électriques usagés, sécurité et conformité des produits (marquage CE, notice en français).</p>`],
        ['Article 3. Offres de loueurs et vendeurs professionnels', `<table><tr><th>Offre</th><th>Prix hors taxes</th><th>Contenu</th></tr>
          <tr><td>Pro Solo</td><td>19 € par mois</td><td>Badge PRO, calendrier multi-outils, mise en avant locale, factures automatiques</td></tr>
          <tr><td>Pro Business</td><td>à partir de 49 € par mois</td><td>Parc illimité, plusieurs utilisateurs, statistiques, export comptable</td></tr></table>
          <p>Les commissions sur les ventes et les locations sont celles des conditions générales.</p>`],
        ['Article 4. Abonnement artisan', `<ul>
          <li>Prix : ${R.abonnementArtisan.mensuel} € hors taxes par mois, ou ${R.abonnementArtisan.annuel} € hors taxes par an. Essai gratuit de ${R.abonnementArtisan.essaiJours} jours, sans engagement.</li>
          <li>L’abonnement donne accès à toutes les demandes de travaux et de réparation de la zone d’intervention de l’artisan, pour ses métiers. <b>Aucune commission sur les chantiers, aucun coût par contact.</b></li>
          <li>L’artisan fournit et tient à jour ses attestations d’assurance de responsabilité civile professionnelle et, pour les gros travaux, d’assurance décennale. Une attestation expirée suspend l’accès aux demandes concernées.</li>
          <li>L’artisan remet au client un devis écrit avant tous travaux, conformément à la réglementation applicable à son activité.</li>
          <li>L’abonnement mensuel se renouvelle chaque mois et se résilie à tout moment depuis l’espace artisan, avec effet à la fin du mois payé. L’abonnement annuel se résilie à l’échéance.</li>
          <li>ZETools ne garantit ni un nombre de demandes ni un chiffre d’affaires.</li></ul>`],
        ['Article 5. Enseignes : déstockage', `<ul>
          <li><b>Accès privé.</b> L’espace enseigne est réservé aux distributeurs, négoces de matériaux, fabricants, loueurs et quincailleries admis par ZETools.</li>
          <li><b>Produits.</b> Produits neufs, ou reconditionnés et annoncés comme tels : fins de série, surstocks, fins de saison, emballages abîmés, retours, matériel sorti d’un parc de location et révisé.</li>
          <li><b>Prix de référence.</b> L’enseigne déclare, pour chaque lot, le prix le plus bas qu’elle a pratiqué à l’égard de tous les consommateurs dans le point de vente concerné au cours des trente jours précédant la réduction (article L. 112-1-1 du Code de la consommation). Elle conserve la preuve de ce prix et la communique à ZETools sur demande. Elle garantit ZETools contre toute réclamation liée à un prix de référence inexact.</li>
          <li><b>Stock.</b> L’enseigne tient à jour le stock par magasin. Une commande payée qui ne peut être honorée est remboursée intégralement au client sous 48 heures.</li>
          <li><b>Retrait.</b> La commande est tenue à disposition pendant 7 jours. L’enseigne remet le produit contre le code de retrait et délivre la facture.</li>
          <li><b>Commission.</b> ${pc(R.commissionDestockage)} hors taxes du prix de vente toutes taxes comprises, prélevée sur le versement. Aucun abonnement pendant la phase pilote.</li>
          <li><b>Versement.</b> Le prix, net de commission, est versé par le prestataire de paiement à l’expiration du délai de rétractation du client, ou ${AC('délai de versement négocié')}.</li></ul>`],
        ['Article 6. Classement et accès aux données', `<p>Les offres des professionnels sont classées selon les critères de l’article 6 des conditions générales. Le professionnel accède, dans son espace, aux données nécessaires à l’exécution de ses commandes et à ses statistiques. Il n’utilise les données des clients que pour exécuter la commande (règlement (UE) 2019/1150, articles 5 et 9).</p>`],
        ['Article 7. Facturation et paiement', `<p>Les abonnements sont payables d’avance, par prélèvement ou carte bancaire. Tout retard de paiement entraîne, de plein droit, des pénalités au taux de ${AC('taux, au minimum trois fois le taux d’intérêt légal')} et une indemnité forfaitaire de recouvrement de 40 € (articles L. 441-10 et D. 441-5 du Code de commerce).</p>`],
        ['Article 8. Suspension et résiliation', `<p>ZETools informe le professionnel de toute restriction ou suspension par une décision motivée, au plus tard au moment où elle prend effet. La résiliation de l’ensemble des services est notifiée au moins 30 jours à l’avance, sauf manquement grave ou répété, ou obligation légale (règlement (UE) 2019/1150, article 4). Le professionnel peut contester la décision auprès de ${AC('adresse de réclamation professionnels')}.</p>`],
        ['Article 9. Modification', `<p>Toute modification des présentes conditions est notifiée au professionnel au moins 15 jours avant son entrée en vigueur. Le professionnel peut résilier son contrat avant cette date.</p>`],
        ['Article 10. Responsabilité', `<p>La responsabilité de ZETools envers le professionnel est limitée aux dommages directs et plafonnée au montant des sommes payées par le professionnel à ZETools au cours des douze derniers mois, sauf faute lourde ou dolosive.</p>`],
        ['Article 11. Droit applicable et tribunal', `<p>Droit français. Tout litige relève de la compétence exclusive du tribunal de commerce de Paris.</p>`],
      ] },

    /* ------------------------------------------------------------------ */
    { id: 'mentions', titre: 'Mentions légales', court: 'Mentions légales',
      intro: 'Informations publiées en application de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (article 1-1, anciennement article 6, III).',
      sections: [
        ['Éditeur du site', `<p>${S}.</p><ul>
          <li>Siège social : ${SOCIETE.siege}, France.</li>
          <li>Numéro de TVA intracommunautaire : ${AC('numéro de TVA')}.</li>
          <li>Téléphone : ${AC('numéro de téléphone')}.</li>
          <li>Adresse électronique : ${AC('adresse de contact')}.</li>
          <li>Directeur de la publication : ${AC('prénom et nom du président de la SAS')}, président.</li></ul>`],
        ['Hébergeur', `<p>${AC('dénomination, adresse et téléphone de l’hébergeur du site')}.</p>`],
        ['Prestataire de paiement', `<p>Les paiements sont opérés par ${AC('dénomination, siège, numéro d’agrément du prestataire de paiement')}. ZETools n’encaisse pas les fonds des membres.</p>`],
        ['Point de contact', `<p>Autorités, membres et tiers peuvent contacter ZETools à l’adresse ${AC('adresse du point de contact unique')}, en français ou en anglais (articles 11 et 12 du règlement (UE) 2022/2065). Un contenu illicite se signale par le bouton « Signaler » présent sur chaque annonce et chaque profil.</p>`],
        ['Médiation de la consommation', `<p>Après une réclamation écrite restée sans solution, le consommateur peut saisir gratuitement : ${AC('nom, adresse postale et site internet du médiateur')}.</p>`],
        ['Qualité des vendeurs', `<p>ZETools est un opérateur de plateforme en ligne. Chaque annonce indique si le vendeur ou le loueur est un particulier ou un professionnel. Les règles protectrices du Code de la consommation (rétractation, garantie légale de conformité) ne s’appliquent pas aux contrats conclus entre particuliers.</p>`],
        ['Propriété intellectuelle', `<p>La marque ZETools, le logo et l’ensemble des éléments du site sont protégés. Toute reproduction sans autorisation est interdite. Les photographies et vidéos d’illustration sont créditées à la page « Crédits photos et vidéos ».</p>`],
        ['Assurance', `<p>Responsabilité civile professionnelle : ${AC('assureur, numéro de police, couverture géographique')}.</p>`],
      ] },

    /* ------------------------------------------------------------------ */
    { id: 'confidentialite', titre: 'Politique de confidentialité et cookies', court: 'Confidentialité et cookies',
      intro: 'ZETools traite vos données dans le respect du règlement (UE) 2016/679 (RGPD) et de la loi n° 78-17 du 6 janvier 1978.',
      sections: [
        ['1. Responsable du traitement', `<p>${S}. Contact pour toute question relative aux données : ${AC('adresse dédiée, par exemple donnees@…')}. Délégué à la protection des données : ${AC('nom du délégué, ou « non désigné »')}.</p>`],
        ['2. Données traitées, finalités et bases légales', `<table><tr><th>Finalité</th><th>Données</th><th>Base légale</th></tr>
          <tr><td>Création et gestion du compte</td><td>Identité, adresse électronique, téléphone, mot de passe chiffré</td><td>Exécution du contrat</td></tr>
          <tr><td>Publication d’annonces, transactions, agenda</td><td>Annonces, photos, réservations, rendez-vous, états des lieux</td><td>Exécution du contrat</td></tr>
          <tr><td>Paiement, caution, lutte contre la fraude</td><td>Données de paiement (traitées par le prestataire de paiement), pièce d’identité, historique</td><td>Exécution du contrat ; obligation légale ; intérêt légitime</td></tr>
          <tr><td>Recherche par proximité</td><td>Code postal, ou position approximative si vous l’autorisez</td><td>Consentement pour la géolocalisation du navigateur ; exécution du contrat pour le code postal</td></tr>
          <tr><td>Messagerie et masquage des coordonnées</td><td>Contenu des messages</td><td>Exécution du contrat ; intérêt légitime (sécurité des membres)</td></tr>
          <tr><td>Vérification des professionnels</td><td>SIRET, attestations d’assurance, identité du représentant</td><td>Obligation légale ; intérêt légitime</td></tr>
          <tr><td>Avis et réputation</td><td>Notes, avis, taux de réponse, annulations</td><td>Intérêt légitime</td></tr>
          <tr><td>Déclarations fiscales</td><td>Identité, numéro fiscal, montants perçus, nombre de transactions</td><td>Obligation légale (Code général des impôts)</td></tr>
          <tr><td>Lettres d’information</td><td>Adresse électronique</td><td>Consentement, ou intérêt légitime pour des services analogues déjà utilisés</td></tr>
          <tr><td>Mesure d’audience</td><td>Données de navigation</td><td>Consentement, sauf outil exempté</td></tr></table>`],
        ['3. Localisation', `<p>Votre position exacte n’est jamais affichée. Les annonces et les artisans sont situés à l’échelle de la commune ou d’un rayon d’environ un kilomètre. L’adresse exacte n’est communiquée à l’autre membre qu’après une transaction payée ou un rendez-vous confirmé.</p>`],
        ['4. Destinataires', `<ul>
          <li>Les autres membres, dans la limite nécessaire à la transaction : prénom, initiale du nom, commune, note, puis coordonnées après paiement ou confirmation.</li>
          <li>Le prestataire de paiement, l’hébergeur, le prestataire d’envoi de SMS et de courriers électroniques, le fournisseur de cartographie, l’assureur de la garantie optionnelle : ${AC('liste nominative des sous-traitants')}.</li>
          <li>L’administration fiscale et les autorités, lorsque la loi l’impose.</li></ul>
          <p>ZETools ne vend pas vos données.</p>`],
        ['5. Transferts hors de l’Union européenne', `<p>Les données sont hébergées dans l’Union européenne. ${AC('préciser les éventuels transferts et leurs garanties : décision d’adéquation, clauses contractuelles types')}.</p>`],
        ['6. Durées de conservation', `<table><tr><th>Données</th><th>Durée</th></tr>
          <tr><td>Compte</td><td>Pendant la vie du compte, puis 3 ans sans activité ; suppression ou anonymisation ensuite</td></tr>
          <tr><td>Transactions, factures</td><td>10 ans (article L. 123-22 du Code de commerce)</td></tr>
          <tr><td>Pièces d’identité</td><td>Conservées par le prestataire de paiement, 5 ans après la fin de la relation</td></tr>
          <tr><td>Messages</td><td>${AC('durée, par exemple 1 an après la dernière transaction liée')}</td></tr>
          <tr><td>États des lieux photographiques</td><td>${AC('durée, par exemple 1 an, ou jusqu’à la clôture du litige')}</td></tr>
          <tr><td>Données fiscales déclarées</td><td>10 ans</td></tr>
          <tr><td>Cookies et choix de consentement</td><td>6 mois pour le choix ; 13 mois au plus pour les cookies</td></tr></table>`],
        ['7. Vos droits', `<p>Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, et du droit de retirer votre consentement à tout moment. Vous pouvez définir des directives sur le sort de vos données après votre décès. Écrivez à ${AC('adresse dédiée')} ; ZETools répond dans un délai d’un mois.</p>
          <p>Vous pouvez introduire une réclamation auprès de la CNIL, 3 place de Fontenoy, 75007 Paris, www.cnil.fr.</p>`],
        ['8. Sécurité', `<p>Connexions chiffrées, mots de passe hachés, accès internes restreints et journalisés, sauvegardes quotidiennes. Toute violation de données présentant un risque est notifiée à la CNIL dans les 72 heures et, si le risque est élevé, aux personnes concernées.</p>`],
        ['9. Mineurs', `<p>La plateforme est réservée aux personnes majeures. ZETools supprime tout compte ouvert par un mineur dont elle a connaissance.</p>`],
        ['10. Cookies et traceurs', `<table><tr><th>Catégorie</th><th>Rôle</th><th>Consentement</th></tr>
          <tr><td>Strictement nécessaires</td><td>Connexion, panier, sécurité, mémorisation de vos choix</td><td>Non requis</td></tr>
          <tr><td>Mesure d’audience</td><td>Statistiques de fréquentation</td><td>Requis, sauf outil exempté configuré selon les recommandations de la CNIL</td></tr>
          <tr><td>Contenus tiers</td><td>Fonds de carte, vidéos d’illustration : votre adresse IP est transmise au fournisseur</td><td>Requis, ou hébergement des contenus par ZETools</td></tr>
          <tr><td>Publicité</td><td>Aucun à ce jour</td><td>Requis le cas échéant</td></tr></table>
          <p>Vous pouvez accepter ou refuser les traceurs, aussi simplement l’un que l’autre, et modifier votre choix à tout moment par le lien « Gérer mes cookies » en bas de page.</p>`],
        ['11. Modification', `<p>Cette politique peut évoluer. La date de mise à jour figure en tête de page ; les modifications importantes vous sont notifiées.</p>`],
      ] },

    /* ------------------------------------------------------------------ */
    { id: 'securite', titre: 'Sécurité et caution', court: 'Sécurité et caution',
      intro: 'Comment ZETools protège votre argent, vos outils et votre personne.',
      sections: [
        ['1. Votre argent est séquestré', `<ul>
          <li>Vous payez sur ZETools. Le prix est conservé par un prestataire de paiement agréé et n’est versé au vendeur, au loueur ou à l’enseigne qu’après la remise de l’outil.</li>
          <li>Vente : le vendeur est payé quand vous confirmez la remise, par code ou QR code.</li>
          <li>Location : le propriétaire est payé 24 heures après le retour, si aucun litige n’est ouvert.</li>
          <li>Ne payez jamais en dehors de la plateforme : virement, espèces, lien reçu par message. Vous perdriez toute protection.</li></ul>`],
        ['2. La caution : une empreinte, pas un débit', `<ul>
          <li>La caution est fixée par le propriétaire, dans la limite du plafond de vente de l’outil : elle ne peut jamais dépasser ce que vaut l’outil sur ZETools.</li>
          <li>Elle prend la forme d’une empreinte bancaire sur la carte du locataire, enregistrée au début de la location. Rien n’est débité.</li>
          <li>L’empreinte est levée automatiquement au retour de l’outil en bon état.</li>
          <li>Pour une location de plus de 7 jours, l’empreinte est renouvelée en cours de location, ou la caution est prélevée puis remboursée au retour : vous en êtes informé avant de payer.</li></ul>`],
        ['3. L’état des lieux par photos', `<p>À la remise et au retour, chacun photographie l’outil dans l’application : vue d’ensemble, plaque signalétique, accessoires, défauts existants. Les photos sont horodatées et servent de preuve. Sans état des lieux de départ, l’outil est présumé remis en bon état de fonctionnement.</p>`],
        ['4. En cas de casse, de perte ou de retard', `<ol>
          <li><b>Signalement</b> par le propriétaire dans les 24 heures qui suivent le retour, avec photos.</li>
          <li><b>Échange contradictoire</b> : le locataire a 72 heures pour répondre. Les deux parties peuvent s’accorder sur un montant.</li>
          <li><b>Décision</b> : à défaut d’accord, ZETools examine l’état des lieux, la valeur de l’outil et un devis de réparation, puis propose un montant, plafonné à la caution.</li>
          <li><b>Prélèvement</b> de la somme retenue sur l’empreinte ; le solde est libéré.</li>
          <li><b>Recours</b> : chaque partie conserve le droit de saisir le médiateur ou le tribunal.</li></ol>
          <p>L’usure normale n’est jamais retenue. Un retard est facturé au tarif journalier, par jour commencé.</p>`],
        ['5. La garantie casse et vol, en option', `<p>Pour ${pc(R.assuranceTaux)} du loyer (minimum ${eur(R.assuranceMin)}), le locataire peut souscrire une garantie qui prend en charge la casse accidentelle et le vol au-delà d’une franchise. Assureur, plafonds et exclusions : ${AC('assureur, notice d’information, franchise')}.</p>`],
        ['5 bis. L’assurance des services', `<ul>
          <li>Un professionnel est couvert par sa propre responsabilité civile professionnelle.</li>
          <li>Un particulier n’en a pas. Il peut prendre l’assurance responsabilité civile ZETools : son annonce porte alors le badge « Assuré ».</li>
          <li>À la réservation, vous pouvez cocher « Je prends l’assurance » : pour ${pc(R.service.assuranceClientTaux)} du prix (minimum ${eur(R.service.assuranceClientMin)}), les dégâts causés chez vous pendant la prestation sont couverts.</li>
          <li>Avant de payer, un encadré vous dit toujours si la prestation est assurée, et par qui. Rien n’est coché à votre place.</li></ul>`],
        ['6. Des membres vérifiés', `<ul>
          <li>Téléphone vérifié pour tous ; identité vérifiée par le prestataire de paiement avant tout versement.</li>
          <li>Professionnels : SIRET vérifié ; artisans : assurance décennale vérifiée pour les gros travaux.</li>
          <li>Avis déposés uniquement après une transaction ou un rendez-vous réel.</li></ul>`],
        ['7. Vos coordonnées restent masquées', `<p>Téléphone, adresse électronique et adresse postale sont masqués dans la messagerie jusqu’au paiement ou à la confirmation du rendez-vous. L’adresse exacte n’apparaît jamais sur une annonce.</p>`],
        ['8. Rencontrer en sécurité', `<ul>
          <li>Pour un échange ou une vente entre particuliers, préférez un lieu public, en journée. L’agenda vous le propose par défaut.</li>
          <li>Essayez l’outil à la remise. Vérifiez la plaque signalétique et le numéro de série.</li>
          <li>Refusez tout outil dont un carter, une protection ou un arrêt d’urgence manque.</li></ul>`],
        ['9. Utiliser l’outil en sécurité', `<ul>
          <li>Lisez la notice ; le propriétaire la joint à l’annonce quand elle existe.</li>
          <li>Portez les protections adaptées : lunettes, gants, protections auditives, chaussures de sécurité, masque.</li>
          <li>Outils thermiques, tronçonneuses, travail en hauteur : réservés aux utilisateurs formés. En cas de doute, faites appel à un artisan.</li></ul>`],
        ['10. Signaler', `<p>Un bouton « Signaler » figure sur chaque annonce, chaque profil et chaque conversation. En cas de danger immédiat, composez le 17 ou le 112. En cas de fraude, déposez plainte et prévenez ZETools : ${AC('adresse du service sécurité')}.</p>`],
      ] },

    /* ------------------------------------------------------------------ */
    { id: 'prix', titre: 'Règles de prix', court: 'Règles de prix',
      intro: 'Sur ZETools, un outil coûte toujours nettement moins cher que le neuf.',
      sections: [
        ['1. Le principe', `<p>ZETools est une place de marché d’outils d’occasion. Des membres peuvent aussi y vendre, louer ou échanger un outil neuf, jamais servi : il reste vendu sous le prix du magasin. Chaque annonce indique le prix neuf de référence et la remise obtenue.</p>`],
        ['2. Prix de vente maximum', `<table><tr><th>État de l’outil</th><th>Prix maximum, en part du prix neuf</th></tr>
          ${Object.entries(plaf).map(([e, t]) => `<tr><td>${e}</td><td>${pc(t)}</td></tr>`).join('')}</table>
          <p>ZETools suggère un prix conseillé égal à ${pc(R.partConseillee)} du maximum : c’est le prix auquel les outils partent le plus vite.</p>`],
        ['3. Location', `<p>Le loyer ne dépasse pas ${pc(R.locationJourMax)} du prix neuf par jour, avec un minimum de ${eur(R.locationJourMin)}. Des remises s’appliquent automatiquement : ${R.remises.slice().reverse().map((r) => pc(r.taux) + ' à partir de ' + r.aPartirDe + ' jours').join(', ')}. La caution ne dépasse pas le prix de vente maximum de l’outil.</p>`],
        ['4. Prix neuf de référence', `<p>C’est le prix actuel du même modèle, ou du modèle équivalent, dans le commerce. Le membre l’indique de bonne foi ; ZETools peut le corriger ou demander un justificatif.</p>`],
        ['5. Déstockage des enseignes', `<p>Les produits déstockés par les enseignes sont neufs et vendus par des professionnels : les plafonds ci-dessus ne s’y appliquent pas. Le prix barré est le prix le plus bas pratiqué par l’enseigne au cours des trente jours précédents.</p>`],
      ] },
  ];

  const ZT_JURIDIQUE = { SOCIETE, PAGES };
  if (typeof module !== 'undefined' && module.exports) module.exports = ZT_JURIDIQUE;
  else racine.ZT_JURIDIQUE = ZT_JURIDIQUE;
})(typeof window !== 'undefined' ? window : globalThis);
