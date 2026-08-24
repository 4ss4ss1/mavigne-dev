/* ═══════════════════════════════════════════════════════════════════════════
   FABRIQUE LE SPRITE D'ICONES A PARTIR DU PAQUET LUCIDE
   Lancer :  npm i -D lucide-static      (une fois)
             node scripts/build-sprite.mjs > /tmp/sprite.html
             puis remplacer le bloc <svg id="mv-sprite"> d'index.html

   ⚠️ VOLONTAIREMENT HORS DU BUILD, et hors de package.json. Le sprite est
     COMMITE : ni la CI ni un client n'ont besoin de lucide-static. Le paquet
     ne sert qu'a regenerer, a la main, quand la correspondance change.
   ⚠️ NE JAMAIS RETOUCHER UNE FORME DANS index.html. Elle serait ecrasee au
     prochain passage ici, sans bruit. Ce fichier est la source.
   ★ Trois jeux dessines a la main ont ete refuses avant d'en arriver la
     (§45h) : la coherence d'une bibliotheque entretenue ne se rattrape pas
     a la main sur 36 dessins.
   ═══════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
const DIR = 'node_modules/lucide-static/icons/';
if (!fs.existsSync(DIR)) {
  console.error('\n  lucide-static est absent. Lancer :  npm i -D lucide-static\n');
  process.exit(1);
}
const V = JSON.parse(fs.readFileSync('node_modules/lucide-static/package.json','utf8')).version;

/* nom Ma Vigne  →  nom Lucide  ·  a quoi il sert dans l'app */
export const MAP = {
  alerte:'triangle-alert', beche:'shovel', bureau:'building-2', calendrier:'calendar',
  carburant:'fuel', carton:'archive', check:'check', chrono:'timer', cle:'key-round',
  corbeille:'trash-2', crayon:'pencil', croix:'x', curseurs:'sliders-horizontal',
  dossier:'folder', eclair:'zap', epingle:'map-pin', eprouvette:'test-tube',
  feuille:'leaf', flamme:'flame', goutte:'droplet', graphique:'chart-column', lien:'link',
  liste:'clipboard-list', outil:'wrench', personne:'user', pousse:'sprout', raisin:'grape',
  maison:'house', chevron:'chevron-down', cuve:'warehouse',
  info:'info', balance:'scale', equipe:'users', soleil:'sun', euro:'euro', pulverisateur:'spray-can', fiole:'flask-conical', cible:'target',
  livre:'book-open', bogue:'bug', carte:'map', journal:'notebook-pen',
  nuage:'cloud', pluie:'cloud-rain', neige:'cloud-snow', bruine:'cloud-drizzle',
  orage:'cloud-lightning', brouillard:'cloud-fog',
  plus:'ellipsis', rang:'fence', retour:'undo-2', rotation:'refresh-cw', sablier:'hourglass',
  verre:'wine',
  secateur:'scissors', tariere:'drill', tracteur:'tractor',
  /* ── DS-4 : les deux formes que le metier reclamait et que le jeu n'avait pas.
     `barrique` remplace un CADDIE (Reserve > Futs) et un BARIL DE PETROLE
     (Le Chai) : deux glyphes qui disaient autre chose que ce qu'on compte.
     `parcours` remplace une HELICE D'ADN sur « La ligne de vie » — le flux
     benne -> cuve -> fut -> bouteille est une suite d'etapes, pas un genome. */
  barrique:'barrel', parcours:'waypoints',
  /* ── DS-M1 : les formes que reclamait index.html, jamais migre jusqu'ici.
     ⚠️ index.html est la surface la PLUS VISIBLE (tous les modales, les
       titres de section, les puces de filtre) et la seule qui n'etait sous
       AUCUN cliquet : 256 pictogrammes que le harnais ne comptait pas.
     ★ Regle de nommage tenue : un nom = une forme. Deux noms maison qui
       pointent la meme forme Lucide seraient deux facons de dire la meme
       chose, et l'ecran finirait par les melanger. */
  ancre:'anchor', bulle:'message-square', cable:'cable', cadenas:'lock',
  calculatrice:'calculator', carre:'square', cloche:'bell', contraste:'contrast',
  deconnexion:'log-out', diplome:'graduation-cap', document:'file-text',
  doigt:'pointer', drapeau:'flag', engrenage:'cog', enveloppe:'mail',
  envoyer:'send', etincelles:'sparkles', etiquette:'tag', etoile:'star',
  gauche:'arrow-left', hautbas:'arrow-up-down', horsligne:'wifi-off',
  imprimante:'printer', loupe:'search', lune:'moon', microscope:'microscope',
  nombre:'hash', oeil:'eye', pause:'pause', recu:'receipt', refus:'circle-x',
  seau:'paint-bucket', sortie:'external-link', ticket:'ticket',
  valide:'circle-check-big',
  /* ── DS-M2 : les formes de `tracteur.js`, le module debloque par la levee du
     verrou des <option>.
     ⚠️ `abeille` prend `hexagon` — l'alveole — et non `bug` : `bogue` porte deja
       cette forme pour « Signaler un probleme », et deux noms maison sur une
       meme forme Lucide, c'est deux facons de dire la meme chose que l'ecran
       finira par melanger. La regle « un nom = une forme » passe avant
       l'illustration litterale. */
  abeille:'hexagon', interdit:'ban', lecture:'play', repas:'utensils', route:'route'
,
  /* ── DS-M3 : la visite guidee et la demo publique ──
     C'est le premier ecran qu'un prospect voit — le lien « Voir la demo » du
     site. Il tournait encore entierement au pictogramme. */
  antenne:'satellite-dish', bouclier:'shield', bouteille:'bottle-wine',
  boussole:'compass', ouvrier:'hard-hat',
  /* ── DS-M6 : les motifs d'absence du Planning. Chacun est un MOTIF
     administratif distinct — un arret de travail n'est pas un conge sans
     solde — et l'ecran les liste cote a cote : ils doivent se distinguer
     au premier coup d'oeil, pas seulement se lire. */
  avion:'plane-takeoff', pansement:'bandage', reveil:'alarm-clock',
  thermometre:'thermometer',
  /* ── DS-M12 : L'ALPHABET D'ETAT DES TACHES ──
     Quatre etats dans un rond de 22 px : fait, en cours, AUTO, pas commence.
     Ils s'ecrivaient ✓ ▶ ~ ○ — dont un TILDE, qui n'est pas un pictogramme
     et ne ressemble a rien de rond. C'est ce melange qui a fait remettre ce
     lot trois fois : il fallait choisir le JEU, pas traduire glyphe a glyphe.
     ★ Le jeu retenu est une FAMILLE DE RONDS, lisible d'un coup d'oeil dans
       une colonne : `check` (fait) · `lecture` (en cours) · `cercle-pointille`
       (auto — le pointille dit « deduit, pas saisi ») · `cercle` (vide).
     ⚠ `cercle` avait deja ete ajoute puis RETIRE en DS-M3, faute d'emploi.
       Il en a un maintenant. */
  cercle:'circle', 'cercle-pointille':'circle-dashed',
  /* la fiche d'entretien du tracteur : six points a cocher, six objets reels */
  vent:'wind', ventilateur:'fan', pneu:'disc-3'
};

export function corps(lucide) {
  const brut = fs.readFileSync(DIR + lucide + '.svg', 'utf8');
  const m = brut.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (!m) throw new Error('forme illisible : ' + lucide);
  const c = m[1].replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  /* ⚠️ Lucide porte stroke-width sur la balise <svg>, PAS sur les formes : c'est
     exactement ce qu'il faut ici, la graisse reste heritee de .mv-ic. On verifie. */
  /* `fill="currentColor"` est TOLERE : il suit encore la couleur du texte
     (Lucide s'en sert pour un point plein, ex. le trou de la cle). Ce qui est
     interdit, c'est une couleur EN DUR ou une graisse posee sur la forme. */
  const fautif = (c.match(/(?:stroke-width|stroke|fill)="[^"]*"/g) || [])
    .filter(a => a !== 'fill="none"' && a !== 'fill="currentColor"' && a !== 'stroke="none"');
  if (fautif.length) throw new Error(lucide + ' fige : ' + fautif.join(' '));
  return c;
}

export const VERSION = V;
if (process.argv[2] === '--print') {
  const noms = Object.keys(MAP).sort();
  let s = '<!-- ════════════════════════════════════════════════════════════════════════\n'
    + '     LE SPRITE D\'ICONES (lot DS-1)\n'
    + '     ★ Les formes viennent de LUCIDE v' + V + ' (licence ISC — lucide.dev),\n'
    + '       recopiees telles quelles depuis le paquet `lucide-static`. Trois jeux\n'
    + '       dessines a la main ont ete refuses avant : la coherence d\'une\n'
    + '       bibliotheque entretenue ne se retrouve pas a la main sur 36 dessins.\n'
    + '     ⚠️ NE PAS RETOUCHER UNE FORME ICI. Le sprite se REGENERE :\n'
    + '          node scripts/build-sprite.mjs\n'
    + '        La correspondance nom-maison → nom-Lucide y vit, et elle seule.\n'
    + '     ⚠️ Les formes ne portent NI stroke NI stroke-width NI fill : tout est\n'
    + '        herite de .mv-ic (styles.css). C\'est deja la convention de Lucide,\n'
    + '        qui pose ces attributs sur la balise <svg> ; le script le verifie.\n'
    + '     ⚠️ Un symbol absent ne rend RIEN, en silence : le harnais l\'interdit,\n'
    + '        `_mvIcon` rend un carre pointille et le journal le note.\n'
    + '     ⚠️ Ce bloc doit rester AVANT #app-root : `_mvIconInline` (documents\n'
    + '        imprimes) lit ces formes dans le DOM.\n'
    + '     ════════════════════════════════════════════════════════════════════ -->\n'
    + '<svg id="mv-sprite" data-lucide="' + V + '" aria-hidden="true" focusable="false"'
    + ' style="display:none" xmlns="http://www.w3.org/2000/svg">\n';
  for (const n of noms)
    s += '  <symbol id="ic-' + n + '" viewBox="0 0 24 24" data-src="' + MAP[n] + '">'
       + corps(MAP[n]) + '</symbol>\n';
  s += '</svg>\n';
  process.stdout.write(s);
}
