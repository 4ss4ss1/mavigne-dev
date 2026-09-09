/* ───────────────────────────────────────────────────────
   HARNAIS — RÉGLAGES & DOCUMENTS DE LA CAVE, ET LES ONGLETS DU CUVIER (lot CAVE-2)
   Lancer :          node scripts/mv-harnais-cave-reglages.mjs
   Contre-épreuves : node scripts/mv-harnais-cave-reglages.mjs --contre

   POURQUOI IL EXISTE
   Mesuré au lot ① (CLAUDE.md §94a) : « Cuvier » était un sous-onglet DE
   « Le Cuvier », « Analyses » (les maturités, à la vigne) se confondait avec
   les analyses labo du Chai, et « Réglages » vivait DEUX fois dans la Cave —
   un onglet au Cuvier, un au Chai — plus le module Réglages. Un mot porté
   par deux écrans ne renvoie nulle part (§90a).

   CE QU'IL GRAVE
   1. Le Cuvier a trois onglets, dans l'ordre de la vendange : Récoltes, Cuves,
      Maturités — les CLÉS ne bougent pas ('rec','cuves','ana'), seuls les
      libellés. Plus d'onglet Réglages, ni ici ni au Chai.
   2. Une seule porte pour les réglages de la cave : la roue crantée de
      l'en-tête, qui ouvre une section SANS onglet ('reglages').
   3. Les anciennes clés ('param' du Cuvier, 'reglages' et 'divers' du Chai)
      atterrissent sur la roue — un client qui les demande encore ne voit
      pas le vide.
   4. AUCUNE COPIE : les deux écrivains de réglages (renderVendParam,
      renderCaveReglages) changent d'hôte, pas de définition ; les documents
      viennent du catalogue MV_DOCS de reglages.js, par docsGo(i).
   5. Toute liste qui masque la vue Aujourd'hui masque aussi celle de la roue.

   Méthode C20 : ce qui s'exécute est exécuté (_caveRegDocs sur un catalogue
   fictif) ; le reste est structurel, lu APRÈS retrait des commentaires (§34g).
   ─────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const SRC  = readFileSync('src/cave.js', 'utf8');
const HTML = readFileSync('index.html', 'utf8');
const REG  = readFileSync('src/reglages.js', 'utf8');
const UT   = readFileSync('src/utils.js', 'utf8');
const GUIDE = readFileSync('guide/08-cave.html', 'utf8');

const nu = s => s
  .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
const SRCNU = nu(SRC), REGNU = nu(REG), UTNU = nu(UT);
const HTMLNU = HTML.replace(/<!--[\s\S]*?-->/g, '');

let vert = 0, total = 0;
const rouges = [];
function pose(ok, nom, detail) {
  total++;
  if (ok) { vert++; console.log('   \u2713 ' + nom); }
  else { rouges.push(nom); console.log('   \u2717 ' + nom + (detail ? '\n      \u2192 ' + detail : '')); }
}
function extraire(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) return null;
  let i = src.indexOf('{', m.index), d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  return null;
}

/* ══ LE JEU D'ASSERTIONS — rejouable sur une source mutée (contre-épreuves) ══ */
function jouer(src, html, reg, ut, silencieux) {
  const dire = silencieux ? () => {} : pose;
  let ok = true;
  const T = (c, nom, det) => { if (!silencieux) pose(c, nom, det); if (!c) ok = false; };

  console.log(silencieux ? '' : '\n  Les onglets du Cuvier');
  const cockpit = extraire(src, '_vendCockpitHtml') || '';
  T(!/mvv-tab-param/.test(cockpit), 'plus d\u2019onglet R\u00e9glages au Cuvier');
  const ordre = [...cockpit.matchAll(/mvv-tab-(rec|cuves|ana)/g)].map(m => m[1]);
  T(ordre.join(',') === 'rec,cuves,ana', 'ordre de la vendange : R\u00e9coltes, Cuves, Maturit\u00e9s', ordre.join(','));
  T(/> Cuves<\/button>/.test(cockpit) && !/> Cuvier<\/button>/.test(cockpit), '\u00ab Cuvier \u00bb dans \u00ab Le Cuvier \u00bb s\u2019appelle Cuves');
  T(/> Maturit\u00e9s<\/button>/.test(cockpit) && !/> Analyses<\/button>/.test(cockpit), '\u00ab Analyses \u00bb s\u2019appelle Maturit\u00e9s');
  const rt = extraire(src, '_vendRenderTab') || '';
  T(/\['rec','cuves','ana'\]/.test(rt) && !/'param'/.test(rt), '_vendRenderTab ne conna\u00eet que les trois cl\u00e9s');
  const sv = extraire(src, 'switchVendOng') || '';
  T(/tab==='param'[^\n]*_caveOpenReglages\(\)/.test(sv), 'switchVendOng(\'param\') ouvre la roue (tol\u00e9rance)');
  T(/indexOf\(tab\)<0\)\s*tab='cuves'/.test(sv), 'une cl\u00e9 inconnue du Cuvier replie sur Cuves');

  console.log(silencieux ? '' : '\n  Les onglets du Chai');
  const sc = extraire(src, 'switchCaveOng') || '';
  const ong = (sc.match(/var ONGLETS\s*=\s*\[([^\]]*)\]/) || [])[1] || '';
  T(ong.replace(/['\s]/g, '') === 'cuv,journal,bouteille', 'ONGLETS du Chai : cuv, journal, bouteille', ong);
  T(/tab==='reglages'[^\n]*_caveOpenReglages\(\)/.test(sc) && /tab==='divers'/.test(sc), 'switchCaveOng(\'reglages\') et (\'divers\') ouvrent la roue');
  T(!/tab==='reglages'\)\s*renderCaveReglages\(\)/.test(sc), 'le Chai ne rend plus ses r\u00e9glages en onglet');
  T(!/mvc-tbtn-reglages/.test(html) && !/id="mvc-view-reglages"/.test(html), 'index.html : l\u2019onglet et la vue R\u00e9glages du Chai ont disparu');

  console.log(silencieux ? '' : '\n  La roue crant\u00e9e');
  T(/id="cave-hdr-gear"[^>]*onclick="_caveOpenReglages\(\)"/.test(html), 'la roue est dans l\u2019en-t\u00eate et ouvre _caveOpenReglages');
  T(!/cave-sec-reglages/.test(html) && !/cave-sec-reglages/.test(src), 'la section reglages n\u2019a PAS d\u2019onglet : seule la roue l\u2019ouvre');
  const rc = extraire(src, 'renderCave') || '';
  T(/'millesime','reglages'\]\.indexOf\(caveSection\)/.test(rc), 'le filet de renderCave conna\u00eet la section reglages');
  T(/caveSection === 'reglages'[^\n]*renderCaveReglagesCave\(\)/.test(rc), 'renderCave aiguille vers renderCaveReglagesCave');
  const rvp = extraire(src, 'renderVendParam') || '';
  T(/getElementById\('cave-reg-cuvier'\)/.test(rvp) && !/getElementById\('mvv-body'\)/.test(rvp), 'renderVendParam \u00e9crit dans #cave-reg-cuvier (m\u00eame \u00e9crivain, autre h\u00f4te)');
  const rcr = extraire(src, 'renderCaveReglages') || '';
  T(/getElementById\('mvc-body-reglages'\)/.test(rcr), 'renderCaveReglages garde son h\u00f4te #mvc-body-reglages');
  const vue = (html.match(/<div id="cave-view-reg"[\s\S]*?<div id="cave-reg-docs"><\/div>/) || [''])[0];
  T(/id="cave-reg-cuvier"/.test(vue) && /id="mvc-body-reglages"/.test(vue) && /id="cave-reg-mil"/.test(vue) && /id="cave-reg-docs"/.test(vue),
    'la vue de la roue porte les quatre h\u00f4tes : Cuvier, Chai, mill\u00e9sime, documents');
  const rrc = extraire(src, 'renderCaveReglagesCave') || '';
  T(/renderVendParam\(\)/.test(rrc) && /renderCaveReglages\(\)/.test(rrc), 'la roue appelle les deux \u00e9crivains, elle ne les recopie pas');
  T(/_caveGoAoc\(\)/.test(rrc), 'le mill\u00e9sime renvoie vers les appellations (_caveGoAoc)');
  const goaoc = extraire(src, '_caveGoAoc') || '';
  T(/goTo\('reglages'\)/.test(goaoc) && /switchReglTab\('domaine'\)/.test(goaoc) && /'aoc-card'/.test(goaoc), '_caveGoAoc va dans R\u00e9glages \u203a Domaine et \u00e9claire #aoc-card');
  const sync = extraire(src, '_caveSyncSecTabs') || '';
  T(/cave-hdr-gear/.test(sync) && /caveSection==='reglages'/.test(sync), 'la roue dit quand on est chez elle (active)');
  const masques = (src.match(/'auj','reg'\]/g) || []).length;
  T(masques >= 4, 'toute liste qui masque Aujourd\u2019hui masque aussi la roue (' + masques + ' listes)');
  for (const f of ['_caveOpenReglages', '_caveGoAoc', 'renderCaveReglagesCave'])
    T(new RegExp('window\\.' + f + '\\s*=\\s*' + f).test(src), f + ' est sur window');

  console.log(silencieux ? '' : '\n  Les documents : un catalogue, pas deux');
  T(/window\.MV_DOCS\s*=\s*MV_DOCS/.test(reg), 'reglages.js expose MV_DOCS');
  const rd = extraire(src, '_caveRegDocs') || '';
  T(/window\.MV_DOCS/.test(rd), '_caveRegDocs lit window.MV_DOCS');
  T(!/t:'Cahier de cuverie'/.test(src) && !/t:'Registre des manipulations'/.test(src), 'cave.js ne recopie aucun titre de document');
  const rdh = extraire(src, '_caveRegDocsHtml') || '';
  T(/onclick="docsGo\('\+x\.i\+'\)"/.test(rdh), 'chaque ligne appelle docsGo(i), l\u2019index du catalogue');
  const ico = (src.match(/var _CREG_DOC_ICO=\{([^}]*)\}/) || [])[1] || '';
  const noms = [...ico.matchAll(/:'([a-z-]+)'/g)].map(m => m[1]);
  const sprite = new Set([...html.matchAll(/symbol id="ic-([a-z0-9-]+)"/g)].map(m => m[1]));
  const absents = noms.filter(n => !sprite.has(n));
  T(noms.length >= 5 && absents.length === 0, 'les ic\u00f4nes des documents existent dans le sprite', absents.join(', '));
  const engr = sprite.has('engrenage') && sprite.has('etiquette');
  T(engr, 'engrenage et etiquette existent dans le sprite');
  // Exécution : le filtre du catalogue
  if (rd) {
    const fn = new Function('window', rd + '\nreturn _caveRegDocs();');
    const cat = [
      { act: 'phytoPdf', mod: 'phyto', t: 'Registre phyto' },
      { act: 'bilan', mod: 'pilotage', t: 'Bilan de campagne' },
      { act: 'manip', mod: 'cave', t: 'Registre des manipulations' },
      { act: 'futs', mod: 'reserve', t: 'Inventaire des f\u00fbts' },
      { act: 'intrants', mod: 'reserve', t: 'Inventaire des intrants' },
      { act: 'cuverie', mod: 'cave', t: 'Cahier de cuverie' },
      null,
      { act: 'mois', mod: 'planning', t: 'Relev\u00e9 mensuel' },
    ];
    let out = null;
    try { out = fn({ MV_DOCS: cat }); } catch (e) { out = null; }
    const acts = out ? out.map(x => x.d.act) : [];
    T(acts.join(',') === 'bilan,manip,futs,cuverie', 'ex\u00e9cut\u00e9 : la cave, le bilan et les f\u00fbts, rien d\u2019autre, dans l\u2019ordre du catalogue', acts.join(','));
    T(out && out.every(x => cat[x.i] === x.d), 'ex\u00e9cut\u00e9 : chaque ligne garde l\u2019index r\u00e9el du catalogue (docsGo(i))');
    let vide = null; try { vide = fn({}); } catch (e) { vide = null; }
    T(Array.isArray(vide) && vide.length === 0, 'ex\u00e9cut\u00e9 : sans catalogue, une liste vide, pas une erreur');
  } else T(false, '_caveRegDocs est extractible');

  console.log(silencieux ? '' : '\n  L\u2019aide dit la v\u00e9rit\u00e9');
  const aide = (ut.match(/\n  cave: \{[\s\S]*?\n  \},/) || [''])[0];
  T(/roue crant\u00e9e/.test(aide), 'MV_AIDE cave parle de la roue crant\u00e9e');
  T(!/R\u00e9glages du Chai|R\u00e9glages du Cuvier|onglet R\u00e9glages/.test(aide), 'MV_AIDE cave ne nomme plus un onglet R\u00e9glages');
  T(!/R\u00e9glages du Chai|Le Chai \u203a R\u00e9glages/.test(nu(src).replace(/roue crant/g, '')), 'aucun texte d\u2019\u00e9cran ne renvoie plus \u00e0 \u00ab R\u00e9glages du Chai \u00bb');
  T(/roue crant\u00e9e/.test(GUIDE) && !/Le Chai \u203a R\u00e9glages/.test(GUIDE), 'le guide suit');
  return ok;
}

console.log('\n\u2500\u2500 CAVE-2 : un mot, un \u00e9cran \u2014 une porte pour les r\u00e9glages\n');
jouer(SRCNU, HTMLNU, REGNU, UTNU, false);

/* ══ CONTRE-ÉPREUVES — chaque défaut réintroduit doit rougir ══ */
if (CONTRE) {
  console.log('\n  Contre-\u00e9preuves');
  const cas = [
    ['la tol\u00e9rance de switchVendOng(\'param\') retir\u00e9e',
      s => s.replace("if(tab==='param'){ _caveOpenReglages(); return; }", ''), HTMLNU, REGNU],
    ['\'reglages\' remis dans les ONGLETS du Chai',
      s => s.replace("var ONGLETS = ['cuv','journal','bouteille'];", "var ONGLETS = ['cuv','journal','reglages','bouteille'];"), HTMLNU, REGNU],
    ['le filtre des documents oublie le bilan',
      s => s.replace("d.mod==='cave'||d.act==='bilan'||d.act==='futs'", "d.mod==='cave'||d.act==='futs'"), HTMLNU, REGNU],
    ['MV_DOCS n\u2019est plus expos\u00e9 par reglages.js',
      s => s, HTMLNU, REGNU.replace(/window\.MV_DOCS\s*=\s*MV_DOCS;/, '')],
    ['la roue redevient un onglet de la barre',
      s => s, HTMLNU.replace('id="cave-sec-aujourdhui"', 'id="cave-sec-reglages"'), REGNU],
    ['renderVendParam r\u00e9\u00e9crit dans #mvv-body',
      s => s.replace("getElementById('cave-reg-cuvier'); if(!el) return;", "getElementById('mvv-body'); if(!el) return;"), HTMLNU, REGNU],
  ];
  for (const [nom, mut, html, reg] of cas) {
    const src2 = mut(SRCNU);
    const identique = src2 === SRCNU && html === HTMLNU && reg === REGNU;
    const vertApres = identique ? true : jouer(src2, html, reg, UTNU, true);
    pose(!identique && !vertApres, nom + ' \u2192 rougit bien', identique ? 'la mutation n\u2019a rien chang\u00e9' : 'rest\u00e9 vert');
  }
}

console.log('\n  ' + vert + ' / ' + total + ' vertes' + (rouges.length ? '\n  ROUGES : ' + rouges.join(' \u00b7 ') : '') + '\n');
process.exit(rouges.length ? 1 : 0);
