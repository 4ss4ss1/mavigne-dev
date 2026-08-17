/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE JEU D'ICONES (lot DS-1)
   Lancer : node scripts/mv-harnais-icones.mjs
            node scripts/mv-harnais-icones.mjs --baseline   (regraver le cliquet)

   Ce qu'il interdit :
     A. qu'un `_mvIcon('x')` / `_mvIconInline('x')` vise un symbol qui n'existe
        pas — un <use> qui ne trouve rien ne rend RIEN, en silence ;
     B. qu'un symbol declare ne serve nulle part (du poids mort dans index.html) ;
     C. qu'un emoji revienne dans reglages.js, le module temoin ;
     D. que le compte GLOBAL d'emojis rendus remonte (cliquet) ;
     E. que les formes du sprite portent un fill/stroke en dur — elles ne
        prendraient plus la couleur du texte a travers le <use> ;
     F. qu'un document IMPRIME utilise `_mvIcon` : le sprite n'existe pas dans
        l'onglet ou il s'ouvre. C'est `_mvIconInline` qu'il lui faut.

   ⚠️ §34g : on lit le CODE, jamais les commentaires. Le blanchiment est celui
      du preflight, a l'identique — sinon deux outils comptent deux choses.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const R = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const rebase = process.argv.includes('--baseline');

/* Le meme blanchiment que scripts/preflight.mjs. A ne pas reinventer : deux
   comptages qui divergent, c'est une dispute de chiffres tous les six mois. */
function blank(c) {
  c = c.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  c = c.replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  return c;
}

/* La classe des PICTOGRAMMES. ⚠️ Elle exclut volontairement le selecteur de
   variante U+FE0F : « ⚠️ » est UN glyphe a l'ecran, pas deux. Un comptage qui
   le compte a part annonce 1 067 la ou l'oeil en voit 920. */
const PICTO = /[\u2190-\u21FF\u2300-\u23FF\u25A0-\u25FF\u2600-\u27BF\u2B00-\u2BFF\u{1F000}-\u{1FAFF}]/gu;

/* ⚠️ CE QUI N'EST PAS UN EMOJI, ET RESTE.
   Une fleche dans une phrase est de la PONCTUATION ; un triangle colle a un
   pourcentage est un SIGNE DE DELTA. Les remplacer par une icone serait une
   faute de typographie, pas un progres. La liste est nommee, pas devinee. */
const TYPO = new Set(['\u2192', '\u25B2', '\u25BC', '\uFF0B']);

/* ⚠️ LE SEUL RESIDU TOLERE DANS reglages.js, ET POURQUOI.
   `_ACT_EMOJIS` est la VALEUR enregistree dans `a.emoji`. tracteur.js la rend
   dans des <option>, et une balise <option> ne peut pas contenir de SVG. La
   ligne est une cle de donnees, jamais affichee telle quelle : `_actIcone` la
   traduit avant tout rendu. Le jour ou les <option> deviennent un selecteur
   maison (DS-M), cette exemption saute. */
const EXEMPT_REGLAGES = [/^var _ACT_EMOJIS\s*=/];

const MODULES = ['app', 'utils', 'pilotage', 'planning', 'reglages', 'cave',
                 'tracteur', 'phyto', 'reserve', 'admin-gt', 'firebase', 'onboarding'];

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m\u2713\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m\u2717\x1b[0m ' + nom + (detail ? '\n      \u2192 ' + detail : '')); }
};

console.log('\n\u2500\u2500 LE JEU D\u2019ICONES\n');

/* ══ LE SPRITE ══════════════════════════════════════════════════════════════ */
const HTML = R('index.html');
const bloc = HTML.match(/<svg id="mv-sprite"[\s\S]*?<\/svg>/);
t('Le sprite existe dans index.html', !!bloc, 'aucun <svg id="mv-sprite"> trouve');

const symboles = new Map();   // nom -> corps
if (bloc) {
  /* ⚠️ Les symboles portent desormais `data-src` : le motif doit accepter
     tout attribut apres l'identifiant, sinon il n'en trouve plus AUCUN
     et le harnais devient vert par le vide. */
  const re = /<symbol id="ic-([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/symbol>/g;
  let m; while ((m = re.exec(bloc[0]))) symboles.set(m[1], m[2]);
}
t('Le sprite declare au moins 20 symboles', symboles.size >= 20, symboles.size + ' symbole(s)');
/* ⚠️ Vecu : un motif trop strict a rendu `symboles` vide, et la moitie des
   assertions sont passees au vert PAR LE VIDE. Le compte est donc lui-meme
   une assertion, avant toutes les autres. */

/* Le sprite doit rester AVANT #app-root : `_mvIconInline` relit ces formes dans
   le DOM pour fabriquer un document imprime. */
t('Le sprite precede #app-root',
  bloc ? HTML.indexOf('<svg id="mv-sprite"') < HTML.indexOf('id="app-root"') : false);

/* ══ E. AUCUNE FORME NE FIGE SA COULEUR ═════════════════════════════════════
   `fill` est HERITE a travers le <use>. Une forme qui porte le sien ne se
   repeint plus — ni en sombre, ni en plein soleil, ni sur un fond colore.
   ⚠️ Le piege propre au jeu PLEIN : creuser un trou avec une couleur de fond
     en dur (`fill="#fff"`) marche sur la carte blanche et rate partout
     ailleurs. Les trous passent par `fill-rule="evenodd"`, qui n'est ni un
     fill ni un stroke et n'est donc pas attrape ici — c'est voulu.        */
const figees = [];
for (const [nom, corps] of symboles) {
  const attrs = corps.match(/(?:fill|stroke|stroke-width)="[^"]*"/g) || [];
  const mauvais = attrs.filter(a => !/^fill="currentColor"$/.test(a) && !/^stroke="none"$/.test(a));
  if (mauvais.length) figees.push(nom + ' (' + mauvais.join(' ') + ')');
}
t('Aucune forme ne fige sa couleur', figees.length === 0, figees.join(' \u00b7 '));

const enDur = [...symboles].filter(([, c]) => /fill="(#|white|rgb)/i.test(c)).map(([n]) => n);
t('Aucun trou creuse avec une couleur de fond en dur', enDur.length === 0,
  enDur.join(' \u00b7 ') + ' \u2014 utiliser fill-rule="evenodd"');

/* ══ A. TOUT APPEL VISE UN SYMBOLE EXISTANT ════════════════════════════════ */
const appels = new Map();     // nom -> [fichiers]
const RE_APPEL = /_mvIcon(?:Inline|Tuile)?\(\s*'([a-z0-9-]+)'/g;
const RE_NOMME = /_mvSetIcon\([^,]+,\s*'([a-z0-9-]+)'/g;
/* ⚠️ Les noms passes par une TABLE (`{p:'cave', ic:'verre', l:'Cave'}` dans la
   barre de navigation) ne passent jamais par un appel litteral : sans cette
   lecture, `verre` passait pour un symbole mort. Les autres n'echappaient au
   rouge que parce qu'ils servaient AUSSI ailleurs — par chance, donc. */
const RE_TABLE = /\bic(?:o|on)?:\s*'([a-z][a-z0-9-]*)'/g;
const RE_TICON = /'([a-z][a-z0-9-]*)'/g;

const sources = {};
for (const mod of MODULES) sources[mod] = blank(R('src/' + mod + '.js'));

for (const mod of MODULES) {
  for (const re of [RE_APPEL, RE_NOMME, RE_TABLE]) {
    re.lastIndex = 0;
    let m; while ((m = re.exec(sources[mod]))) {
      if (!appels.has(m[1])) appels.set(m[1], []);
      if (!appels.get(m[1]).includes(mod)) appels.get(m[1]).push(mod);
    }
  }
}
/* ⚠️⚠️⚠️ QUATRIEME FOIS QUE CE MEME ANGLE MORT MORD, ET LA LISTE EN DUR N'EST
   PAS LA REPONSE. Un nom d'icone qui ne passe pas par un appel litteral est
   invisible ici : TICON, ACT_ICONES, `ic:` de la barre de navigation, `ico:`
   des fiches d'aide, MV_METEO_IC, puis _PIL_IC. A chaque fois le harnais a
   declare des symboles morts qui ne l'etaient pas — et surtout, les autres
   n'echappaient au rouge QUE parce qu'ils servaient aussi ailleurs.
   La regle est donc generale : TOUTE TABLE dont le nom finit par IC, ICO,
   ICON ou ICONES est lue, dans n'importe quel module.
   ★ Une liste en dur qu'on rallonge a chaque incident n'est pas un filet,
     c'est un journal des incidents passes. */
/* ⚠️ Le dernier segment SOULIGNE doit valoir IC/ICO/ICON/ICONE/ICONES.
   Sans le souligne, `FB_STATIC` entrait dans le filet et sortait douze faux
   positifs — la collision de nom qui rend un harnais inutilisable, donc
   ignore, donc mort. Une table d'icones se NOMME, c'est la convention. */
const RE_TABLES = /(?:var|const|export const)\s+([A-Za-z_$][\w$]*_(?:IC|ICO|ICON|ICONE|ICONES))\s*=\s*[{[]/g;
for (const mod of MODULES) {
  RE_TABLES.lastIndex = 0;
  let mt;
  while ((mt = RE_TABLES.exec(sources[mod]))) {
    const deb = mt.index + mt[0].length - 1;
    const clot = sources[mod][deb] === '{' ? '}' : ']';
    const fin = sources[mod].indexOf(clot + ';', deb);
    if (fin < 0) continue;
    const tranche = sources[mod].slice(deb, fin);
    /* ⚠️⚠️⚠️ CE BLOC A ETE FAUX PENDANT TOUT LE LOT, ET C'EST LE PIRE DEFAUT
       DE LA JOURNEE : il sautait (`continue`) les noms absents du sprite au
       lieu de les SIGNALER. Un controle qui, par construction, ne peut pas
       echouer. `_PIL_IC` demandait « equipe », retire du sprite deux heures
       plus tot, et le harnais est reste vert du debut a la fin — c'est l'e2e
       de la CI qui l'a trouve, via le repli visible de `_mvIcon`.
       ★ On ne lit plus toutes les chaines de la table : on lit la VALEUR de
         chaque paire `cle:'valeur'` (et chaque entree d'un tableau). Une cle
         n'est pas un nom d'icone ; une valeur, si — et si elle n'existe pas,
         c'est un ROUGE, pas un silence. */
    const valeurs = clot === '}'
      ? [...tranche.matchAll(/[\w$'"-]+\s*:\s*'([a-z][a-z0-9-]*)'/g)].map(x => x[1])
      : [...tranche.matchAll(/'([a-z][a-z0-9-]*)'/g)].map(x => x[1]);
    for (const nom of valeurs) {
      if (!appels.has(nom)) appels.set(nom, []);
      if (!appels.get(nom).includes(mt[1])) appels.get(nom).push(mt[1]);
    }
  }
}

/* index.html peut poser un <use> en dur (le bouton d'icone d'activite). */
/* ⚠️ Les commentaires HTML sont blanchis : le commentaire du sprite CITE un
   <use href="#ic-nom"> en exemple, et il se prenait pour un appel reel. */
const horsSprite = (bloc ? HTML.replace(bloc[0], '') : HTML).replace(/<!--[\s\S]*?-->/g, ' ');
let mu; const RE_USE = /href="#ic-([a-z0-9-]+)"/g;
while ((mu = RE_USE.exec(horsSprite))) {
  if (!appels.has(mu[1])) appels.set(mu[1], []);
  if (!appels.get(mu[1]).includes('index.html')) appels.get(mu[1]).push('index.html');
}

const orphelins = [...appels.keys()].filter(n => !symboles.has(n));
t('Toute icone appelee a son symbole',
  orphelins.length === 0,
  orphelins.map(n => n + ' (' + appels.get(n).join(', ') + ')').join(' \u00b7 '));

/* ══ B. AUCUN SYMBOLE MORT ═════════════════════════════════════════════════ */
const morts = [...symboles.keys()].filter(n => !appels.has(n));
t('Aucun symbole declare sans emploi', morts.length === 0, morts.join(' \u00b7 '));

/* ══ F. UN DOCUMENT IMPRIME N'A PAS LE SPRITE ══════════════════════════════
   Les fonctions qui fabriquent un document autonome (elles portent toutes un
   <style> et une balise <head>) doivent utiliser `_mvIconInline`. Un `_mvIcon`
   y rendrait un cadre vide, sans la moindre erreur.                        */
function trancheDocs(src) {
  const out = [];
  const re = /<\/head><body>|<\/style><\/head>/g;
  let m; while ((m = re.exec(src))) {
    // La fonction qui contient ce marqueur : on remonte au `function ` precedent.
    const deb = src.lastIndexOf('function ', m.index);
    const fin = src.indexOf('\n}', m.index);
    if (deb >= 0 && fin > deb) out.push(src.slice(deb, fin));
  }
  return out;
}
const fautifs = [];
for (const bloc2 of trancheDocs(sources.reglages)) {
  if (/[^e]_mvIcon\(/.test(bloc2)) {
    const nom = (bloc2.match(/function\s+([A-Za-z_$][\w$]*)/) || [, '?'])[1];
    fautifs.push(nom);
  }
}
t('Aucun document imprime n\u2019appelle _mvIcon', fautifs.length === 0,
  [...new Set(fautifs)].join(' \u00b7 ') + ' \u2014 utiliser _mvIconInline');

/* ══ G. UNE SEULE ECHELLE DE TAILLES ═══════════════════════════════════════
   16 en ligne · 18 bouton · 20 ligne de liste · 24 tuile · 40 ecran vide.
   Deux icones de meme niveau a deux tailles differentes, c'est le premier
   signe du bricolage — et ca ne se voit jamais fichier par fichier, seulement
   a l'ecran, trop tard. Une valeur hors echelle est donc un ROUGE, pas un
   avertissement : sinon l'echelle se delite en six mois.
   ⚠️ Sous 16 px, un trait de 1,75 sur une grille de 24 ne fait plus qu'un
     pixel : c'est le plancher, pas une preference. */
const ECHELLE = [16, 18, 20, 24, 40];
const horsEchelle = [];
for (const mod of MODULES) {
  const re2 = /_mvIcon(?:Inline|Tache)?\([^(),]*(?:\([^()]*\))?[^(),]*,\s*(\d+)\)/g;
  let m; while ((m = re2.exec(sources[mod]))) {
    if (!ECHELLE.includes(+m[1])) horsEchelle.push(mod + ' : ' + m[0].slice(0, 44));
  }
}
t('Toute taille est dans l\u2019echelle ' + ECHELLE.join('/'), horsEchelle.length === 0,
  horsEchelle.slice(0, 6).join(' \u00b7 '));

/* ══ H. LE SPRITE VIENT BIEN DE LA BIBLIOTHEQUE ════════════════════════════
   Une forme retouchee a la main dans index.html serait ecrasee au prochain
   `build-sprite.mjs`, sans bruit. Deux marques la rendent verifiable : la
   version de Lucide sur le sprite, et le nom d'origine sur chaque symbol. */
t('Le sprite porte sa version de bibliotheque', /data-lucide="[\d.]+"/.test(HTML));
const sansSrc = [...symboles.keys()].filter(n =>
  !new RegExp('<symbol id="ic-' + n + '" viewBox="0 0 24 24" data-src="[a-z0-9-]+"').test(HTML));
t('Chaque symbole cite sa forme d\u2019origine', sansSrc.length === 0, sansSrc.join(' \u00b7 '));

/* La graisse est declaree UNE fois, dans .mv-ic, et nulle part ailleurs. */
const CSS = R('src/styles.css');
/* ⚠️ `.mv-ic-abs` (le repli) porte legitimement la sienne : le motif ne doit
   viser QUE le selecteur nu, sinon il compte deux declarations et rougit
   sur une regle correcte. */
const graisses = (CSS.match(/\.mv-ic\s*\{[^}]*stroke-width:\s*[\d.]+/g) || []);
t('La graisse du jeu est declaree une seule fois', graisses.length === 1,
  graisses.length + ' declaration(s)');

/* ══ J. UN TERNAIRE DONT LES DEUX BRANCHES SONT IDENTIQUES ═════════════════
   Vecu : `_mapLabelsVisible ? '\u{1F3F7} Noms \u2713' : '\u{1F3F7} Noms'` — le « \u2713 » etait la
   SEULE difference entre l'etat actif et l'etat inactif. La passe de retrait
   des emojis l'a emporte, et le bouton s'est mis a afficher la meme chose dans
   les deux cas. Rien ne plante, rien ne rougit : le bouton ment, c'est tout.
   ★ Un ternaire a branches egales est presque toujours le residu d'un retrait. */
const jumeaux = [];
for (const mod of MODULES) {
  const re4 = /\?\s*('(?:[^'\\]|\\.){2,60}')\s*:\s*('(?:[^'\\]|\\.){2,60}')/g;
  let m; while ((m = re4.exec(sources[mod]))) {
    if (m[1] === m[2]) jumeaux.push(mod + ' : ' + m[0].slice(0, 50));
  }
}
t('Aucun ternaire ne rend deux fois la meme chaine', jumeaux.length === 0,
  jumeaux.slice(0, 5).join(' \u00b7 '));

/* ══ C. reglages.js, LE MODULE TEMOIN ══════════════════════════════════════ */
function pictos(src) {
  const out = [];
  src.split('\n').forEach((l, i) => {
    if (EXEMPT_REGLAGES.some(r => r.test(l.trim()))) return;
    const g = (l.match(PICTO) || []).filter(c => !TYPO.has(c));
    if (g.length) out.push((i + 1) + ' ' + g.join(''));
  });
  return out;
}
const restants = pictos(sources.reglages);
t('Zero emoji rendu dans reglages.js', restants.length === 0,
  restants.slice(0, 8).join(' \u00b7 '));

/* ══ D. LE CLIQUET GLOBAL — LE COMPTE NE REMONTE JAMAIS ════════════════════ */
const compte = {};
let total = 0;
for (const mod of MODULES) {
  const g = (sources[mod].match(PICTO) || []).filter(c => !TYPO.has(c));
  compte[mod] = g.length; total += g.length;
}
const REF = 'scripts/mv-icones-baseline.json';
let ref = null;
try { ref = JSON.parse(R(REF)); } catch { /* absent : premier passage */ }

if (rebase) {
  fs.writeFileSync(path.join(root, REF),
    JSON.stringify({ total, modules: compte }, null, 2) + '\n');
  console.log('\n  cliquet regrave : total = ' + total);
} else if (!ref) {
  t('Le cliquet existe', false, 'lancer : node scripts/mv-harnais-icones.mjs --baseline');
} else {
  const hausses = MODULES.filter(m => compte[m] > (ref.modules[m] ?? 0))
    .map(m => m + ' ' + (ref.modules[m] ?? 0) + '\u2192' + compte[m]);
  t('Le compte d\u2019emojis ne remonte dans aucun module', hausses.length === 0, hausses.join(' \u00b7 '));
  t('Le compte global ne remonte pas (' + total + ' \u2264 ' + ref.total + ')', total <= ref.total);
  if (total < ref.total)
    console.log('    \x1b[33m\u2193\x1b[0m ' + (ref.total - total) + ' de moins qu\u2019en reference'
      + ' \u2014 regraver : node scripts/mv-harnais-icones.mjs --baseline');
}

/* ══ G. ON EXECUTE LA PRIMITIVE, ON NE LA RELIT PAS ════════════════════════
   §42f : une assertion qui lit la source se laisse satisfaire par un
   commentaire. Ici on charge les VRAIES fonctions d'utils.js dans un DOM
   minimal bati sur le VRAI sprite, et on regarde ce qu'elles rendent.
   C'est le seul moyen de prouver le repli visible : un symbol absent doit
   rendre quelque chose QU'ON VOIT, pas une chaine vide.                    */
{
  const U = R('src/utils.js');
  const deb = U.indexOf('var _MV_IC_SET = null;');
  const fin = U.indexOf("return ACT_LEGACY[v.replace(/\\uFE0F/g, '')] || 'tracteur';\n}");
  if (deb < 0 || fin < 0) t('Les primitives d\u2019icone sont extractibles', false);
  else {
    const frag = U.slice(deb, fin + 60);
    const journal = [];
    const els = new Map();
    for (const [nom, corps] of symboles) els.set('ic-' + nom, { id: 'ic-' + nom, innerHTML: corps });
    const faux = {
      getElementById: (id) => id === 'mv-sprite'
        ? { querySelectorAll: () => [...symboles.keys()].map(n => ({ id: 'ic-' + n })) }
        : (els.get(id) || null)
    };
    globalThis.document = faux;
    globalThis.window = { logError: (o) => journal.push(o.msg) };
    const url = 'data:text/javascript;base64,' + Buffer.from(frag, 'utf8').toString('base64');
    const M = await import(url);

    t('_mvIcon rend un <use> vers le bon symbole',
      /class="mv-ic"[^>]*width="14"/.test(M._mvIcon('check', 14)) && M._mvIcon('check', 14).includes('href="#ic-check"'),
      M._mvIcon('check', 14));

    const abs = M._mvIcon('nexistepas', 16);
    t('Un symbole absent rend un repli VISIBLE, et part au journal',
      abs.includes('mv-ic-abs') && abs.includes('stroke-dasharray') && journal.some(x => x.includes('nexistepas')),
      abs.slice(0, 90) + ' | journal=' + journal.join(','));

    const inl = M._mvIconInline('check', 12);
    t('_mvIconInline recopie la forme, sans <use>',
      inl.includes(symboles.get('check')) && !inl.includes('<use') && inl.includes('stroke="currentColor"'),
      inl.slice(0, 110));

    t('_mvIconInline d\u2019un symbole absent rend une chaine vide, pas un cadre',
      M._mvIconInline('nexistepas', 12) === '');

    const e1 = {}; M._mvSetIcon(e1, 'corbeille', 20);
    const e2 = {}; M._mvSetIcon(e2, '\u{1F5D1}\uFE0F', 20);
    const e3 = {}; M._mvSetIcon(e3, '', 20);
    t('_mvSetIcon : un nom pose une icone, un emoji reste du texte',
      e1.innerHTML && e1.innerHTML.includes('#ic-corbeille')
      && e2.textContent === '\u{1F5D1}\uFE0F' && e1.textContent === undefined
      && e3.textContent === '',
      JSON.stringify([e1, e2, e3]));

    t('_actIcone traduit l\u2019ancien emoji, laisse passer un nom, a un repli',
      M._actIcone('\u{1F69C}') === 'tracteur' && M._actIcone('\u2702\uFE0F') === 'secateur'
      && M._actIcone('\u{1F33F}') === 'feuille' && M._actIcone('eprouvette') === 'eprouvette'
      && M._actIcone('') === 'tracteur' && M._actIcone(null) === 'tracteur',
      [M._actIcone('\u{1F69C}'), M._actIcone('\u2702\uFE0F'), M._actIcone('\u{1F33F}'), M._actIcone(null)].join('/'));

    /* Les 18 emojis du vocabulaire d'activite doivent TOUS tomber sur une icone
       reelle. Un seul oubli et l'activite d'un client s'affiche en tracteur. */
    const voc = (sources.reglages.match(/var _ACT_EMOJIS\s*=\s*\[([^\]]*)\]/) || [, ''])[1]
      .split(',').map(x => x.trim().replace(/^'|'$/g, '')).filter(Boolean);
    const perdus = voc.filter(e => !symboles.has(M._actIcone(e)));
    t('Les ' + voc.length + ' emojis d\u2019activite tombent sur une icone reelle',
      voc.length === 18 && perdus.length === 0, perdus.join(' '));

    delete globalThis.document; delete globalThis.window;
  }
}

/* ══ I. LA CHARTE D'ILOTS (DS-2) ═══════════════════════════════════════════
   Quatre tons de badge, pas cinq. Et aucune couleur d'etat ecrite en dur dans
   un module : un #EAF5E4 est juste sur la carte claire et vire sale en sombre.
   C'est exactement le defaut que la charte corrige — il ne doit pas revenir
   par la porte de derriere, un ecran a la fois.                            */
{
  const CSSC = R('src/styles.css');
  const TONS = ['vert', 'ambre', 'rouge', 'neutre'];
  const declares = [...CSSC.matchAll(/\.mv-bdg-([a-z]+)\s*\{/g)].map(m => m[1]);
  t('Les tons de badge sont les quatre prevus',
    declares.length === TONS.length && TONS.every(x => declares.includes(x)),
    declares.join(' \u00b7 '));

  const utilises = new Set();
  for (const mod of MODULES) {
    const re3 = /_mvBadge\([^,]*,\s*'([a-z]+)'/g;
    let m; while ((m = re3.exec(sources[mod]))) utilises.add(m[1]);
  }
  const inconnus = [...utilises].filter(x => !TONS.includes(x));
  t('Aucun badge ne demande un ton inexistant', inconnus.length === 0, inconnus.join(' \u00b7 '));

  /* Les briques de la charte doivent exister avant qu'un module les appelle :
     une classe absente ne casse rien, elle rend juste un bloc nu — en silence. */
  /* ⚠️ VECU LE 16/08, ET PERSONNE NE L'AURAIT VU. En refaisant #home-stat-content,
     la charte a change l'ordre de ses enfants — or le mode COMPACT les visait
     par leur RANG (`>div:first-child`, `>div:nth-child(n+4)`). Le mode compact
     est une preference PAR UTILISATEUR : elle ne s'ouvre jamais en developpant.
     Un selecteur de rang dans un bloc que la charte remanie est donc interdit. */
  const parRang = [...CSSC.matchAll(/#(home-stat-content|dp-taches|home-dre|home-msem)[^{]*:(?:first-child|last-child|nth-child)[^{]*\{/g)]
    .map(m => m[0].trim());
  t('Aucune regle CSS ne vise un enfant par son rang dans un bloc de la charte',
    parRang.length === 0, parRang.join(' \u00b7 '));

  const briques = ['.mv-c', '.mv-t', '.mv-n', '.mv-l', '.mv-hd', '.mv-ft', '.mv-tr',
                   '.mv-track', '.mv-fill', '.mv-bdg', '.mv-gh', '.mv-kv'];
  const absentes = briques.filter(b => !new RegExp('\\' + b + '(?![\\w-])[^{]*\\{').test(CSSC));
  t('Les ' + briques.length + ' briques de la charte sont declarees',
    absentes.length === 0, absentes.join(' '));
}

console.log('\n  ' + symboles.size + ' symboles \u00b7 ' + appels.size + ' noms appeles \u00b7 '
  + total + ' emojis rendus restants (tous modules)\n');
console.log(ko ? '\x1b[31m' + ko + ' ROUGE(S)\x1b[0m sur ' + (ok + ko) + '\n'
               : '\x1b[32m' + ok + ' verts\x1b[0m\n');
process.exit(ko ? 1 : 0);
