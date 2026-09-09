/* ─────────────────────────────────────────────────
   HARNAIS — LA ROUE CRANTÉE DES MODULES (lot NAV-1, §98)
   Lancer :          node scripts/mv-harnais-regl-module.mjs
   Contre-épreuves : node scripts/mv-harnais-regl-module.mjs --contre

   POURQUOI IL EXISTE
   Mesuré au lot NAV-0 (CLAUDE.md §98a) : SIX endroits où l'on règle quelque
   chose, TROIS mots pour « réglage », TROIS portes vers un document, un bouton
   maison sur les 11 en-têtes qui double le dock — et qui portait, sans le dire,
   le voyant de synchronisation. Une règle : un module règle ses affaires chez
   lui (le patron de la Cave, lot CAVE-2).

   CE QU'IL GRAVE
   1. Les blocs Réglages › Vigne et › Tracteur sont REPARENTÉS, pas recopiés :
      #regl-view-vigne et #regl-view-tracteur existent UNE fois, dans
      #ovReglVigne / #ovReglTracteur, avec leurs sections (mêmes id).
   2. Réglages a trois onglets (domaine · equipe · app), sans bande de compteurs.
   3. Chaque en-tête de la Vigne (3) et du Tracteur porte la roue ; aucun
      en-tête de module ne porte plus goHub (le panneau GT, oui).
   4. Le voyant de synchro s'ancre sur .mod-header-top, plus sur le bouton maison.
   5. Les documents de la roue viennent de MV_DOCS filtré par module, servis par
      docsGo(i) — exécuté sur un catalogue fictif (méthode C20).
   6. Les renvois (Pilotage « à compléter », Mise en route, aide) visent la roue.
   ───────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const APP  = readFileSync('src/app.js', 'utf8');
const HTML = readFileSync('index.html', 'utf8');
const REG  = readFileSync('src/reglages.js', 'utf8');
const PIL  = readFileSync('src/pilotage.js', 'utf8');
const RSV  = readFileSync('src/reserve.js', 'utf8');
const UT   = readFileSync('src/utils.js', 'utf8');
const G12  = readFileSync('guide/12-reglages.html', 'utf8');
const G04  = readFileSync('guide/04-vigne.html', 'utf8');
const G06  = readFileSync('guide/06-tracteur.html', 'utf8');

const nu = s => s
  .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
const APPNU = nu(APP), REGNU = nu(REG), PILNU = nu(PIL), RSVNU = nu(RSV), UTNU = nu(UT);
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
function nb(src, re) { return (src.match(re) || []).length; }

/* ══ LE JEU D'ASSERTIONS — rejouable sur une source mutée ══ */
function jouer(app, html, reg, pil, rsv, ut, silencieux) {
  let ok = true;
  const T = (c, nom, det) => { if (!silencieux) pose(c, nom, det); if (!c) ok = false; };

  /* 1. Reparentés, pas recopiés */
  T(nb(html, /id="regl-view-vigne"/g) === 1 && nb(html, /id="regl-view-tracteur"/g) === 1,
    'les blocs Vigne et Tracteur existent une seule fois');
  const iV = html.indexOf('id="ovReglVigne"'), iT = html.indexOf('id="ovReglTracteur"');
  const bV = html.indexOf('id="regl-view-vigne"'), bT = html.indexOf('id="regl-view-tracteur"');
  const iR = html.indexOf('id="page-reglages"'), iC = html.indexOf('id="page-chat"');
  T(iV > 0 && iT > 0 && iV < bV && bV < iT && iT < bT && bT < iC,
    'chaque bloc vit dans la feuille de son module, hors de la page R\u00e9glages',
    JSON.stringify({ iV, bV, iT, bT, iC }));
  T(!(bV > iR && bV < iV) && !(bT > iR && bT < iV),
    'aucun des deux blocs n\u2019est rest\u00e9 dans #page-reglages');
  for (const id of ['set-sec-taches', 'set-sec-dens', 'set-sec-secteurs', 'set-sec-tracteurs', 'set-sec-act-trac', 'taches-config-list', 'act-trac-list', 'tracteurs-set-list'])
    T(nb(html, new RegExp('id="' + id + '"', 'g')) === 1, 'le bloc garde son id : #' + id);
  T(html.indexOf('id="set-sec-taches"') > iV && html.indexOf('id="set-sec-taches"') < iT
    && html.indexOf('id="set-sec-tracteurs"') > iT && html.indexOf('id="set-sec-tracteurs"') < iC,
    'les sections sont dans la bonne feuille (t\u00e2ches c\u00f4t\u00e9 Vigne, parc c\u00f4t\u00e9 Tracteur)');
  T(/id="regl-docs-vigne"/.test(html) && /id="regl-docs-tracteur"/.test(html),
    'chaque feuille a son h\u00f4te de documents');
  T(/closeOv\(event,'ovReglVigne'\)/.test(html) && /closeOv\(event,'ovReglTracteur'\)/.test(html),
    'les feuilles se ferment par closeOv, comme toute feuille');
  // Les écrivains n'ont pas changé de cible : ils écrivent toujours dans ces id.
  T(reg.includes("getElementById('taches-config-list')") && reg.includes("getElementById('regl-dens-sub')"),
    'renderReglages \u00e9crit toujours dans les blocs de la Vigne (m\u00eames id)');
  T(readFileSync('src/tracteur.js', 'utf8').includes("getElementById('tracteurs-set-list')"),
    'renderTracteurSet \u00e9crit toujours dans le parc (m\u00eame id)');

  /* 2. Réglages : trois onglets, pas de compteurs */
  T(nb(html, /id="regl-tbtn-/g) === 3 && /regl-tbtn-domaine/.test(html) && /regl-tbtn-equipe/.test(html) && /regl-tbtn-app/.test(html),
    'R\u00e9glages a trois onglets : Domaine, \u00c9quipe, App');
  T(!/regl-tbtn-vigne|regl-tbtn-tracteur/.test(html), 'plus d\u2019onglet Vigne ni Tracteur');
  T(/\['domaine','equipe','app'\]\.forEach/.test(reg), 'switchReglTab ne conna\u00eet que les trois');
  T(!/regl-kpis|regl-stat-/.test(html) && !/regl-stat-/.test(reg), 'la bande Membres \u00b7 T\u00e2ches \u00b7 Tracteurs est partie (HTML et JS)');
  T(!/mvu-tabs-many" id="regl-tabs-row"/.test(html), 'la barre ne d\u00e9file plus (mvu-tabs-many retir\u00e9)');

  /* 3. La roue sur les en-têtes ; plus de maison */
  T(nb(html, /_mvReglOpen\('vigne'\)/g) === 3, 'la roue de la Vigne est sur ses trois en-t\u00eates');
  T(nb(html, /_mvReglOpen\('tracteur'\)/g) === 1, 'la roue du Tracteur est sur son en-t\u00eate');
  const gt = html.indexOf('id="page-admin-gt"');
  const hubs = [...html.matchAll(/goHub\(\)/g)].map(m => m.index);
  T(hubs.length === 1 && hubs[0] > gt, 'un seul goHub dans index.html, celui du panneau GT', 'goHub : ' + hubs.length);
  T(!/goHub/.test(rsv), 'la R\u00e9serve n\u2019a plus de bouton maison');
  T(!/pil-back/.test(pil), 'le Pilotage n\u2019a plus son \u2302');
  T(nb(html, /<div class="mod-header-title">Vigne<\/div>/g) === 3, 'le titre dit \u00ab Vigne \u00bb sur les trois pages du module');
  T(!/mod-header-title">(Accueil|Mes Parcelles|Journal)</.test(html), 'plus de titre Accueil / Mes Parcelles / Journal');

  /* 4. Le voyant de synchro */
  const dots = extraire(app, '_syncEnsureDots') || '';
  T(/querySelectorAll\('\.mod-header-top'\)/.test(dots) && /appendChild\(_syncMakeDot\(\)\)/.test(dots),
    'le voyant de synchro s\u2019ancre sur .mod-header-top');
  T(!/goHub/.test(dots), '\u2026 et ne cherche plus le bouton maison');

  /* 5. Le composant */
  T(/function _mvReglOpen\(mod\)/.test(app) && /window\._mvReglOpen\s*=\s*_mvReglOpen/.test(app), '_mvReglOpen existe et est expos\u00e9');
  const open = extraire(app, '_mvReglOpen') || '';
  T(/if\(!isAdmin\(\)\)/.test(open), 'la roue refuse un non-administrateur');
  T(/window\.renderReglages\(\)/.test(open), 'la roue rappelle renderReglages \u2014 elle ne recopie rien');
  T(/openOv\(R\.ov\)/.test(open), 'la roue ouvre la feuille par openOv');
  T(/vigne:\s*\{\s*ov:'ovReglVigne'/.test(app) && /tracteur:\s*\{\s*ov:'ovReglTracteur'/.test(app), 'le registre _MV_REGL nomme les deux feuilles');
  T(/_mvReglSync\(\);/.test(extraire(app, 'applyRoles') || ''), 'applyRoles synchronise la roue avec le r\u00f4le');
  T(/onclick="docsGo\('\+x\.i\+'\)"/.test(app), 'les documents passent par docsGo(i), le seul chemin');
  T(!/_mvReglTousDocs\(\\''\+mod/.test(app), 'aucune valeur interpol\u00e9e dans un gestionnaire (C24b)');

  /* 5 bis. Exécuté : le filtre et le rendu sur un catalogue fictif */
  const fnDocs = extraire(app, '_mvReglDocs'), fnHtml = extraire(app, '_mvReglDocsHtml');
  T(!!fnDocs && !!fnHtml, '_mvReglDocs / _mvReglDocsHtml sont extractibles');
  if (fnDocs && fnHtml) {
    const ico = "var _MV_REGL_DOC_ICO={vignoble:'carte',entretien:'outil'};";
    const stubs = "var _escHtml=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};var _mvIcon=function(n){return '<i data-ic=\"'+n+'\"></i>';};";
    const cat = "[{mod:'vigne',act:'vignoble',t:'\u00c9tat <du> vignoble',ask:'',fm:'pdf'},{mod:'cave',act:'manip',t:'Manip',fm:'pdf'},{mod:'tracteur',act:'entretien',t:'Carnet',ask:'Une machine',fm:'pdf'},null,{mod:'vigne',act:'csvJournal',t:'Journal',fm:'csv'}]";
    let r = null;
    try {
      r = new Function('window', ico + stubs + fnDocs + fnHtml + " return {l:_mvReglDocs('vigne'), h:_mvReglDocsHtml('vigne','Vigne'), t:_mvReglDocs('tracteur'), v:_mvReglDocsHtml('reserve','R\u00e9serve')};")({ MV_DOCS: eval(cat) });
    } catch (e) { r = { err: e.message }; }
    T(r && !r.err, 'le filtre s\u2019ex\u00e9cute', r && r.err);
    if (r && !r.err) {
      T(r.l.length === 2 && r.l[0].i === 0 && r.l[1].i === 4, 'il garde les deux documents de la vigne, avec leur INDEX dans le catalogue (0 et 4)');
      T(r.t.length === 1 && r.t[0].i === 2, 'le tracteur n\u2019a que le carnet, index 2');
      T(r.h.includes("docsGo(0)") && r.h.includes("docsGo(4)") && !r.h.includes("docsGo(2)"), 'le rendu appelle docsGo avec l\u2019index du catalogue, pas celui de la liste filtr\u00e9e');
      T(r.h.includes('&lt;du&gt;'), 'le titre d\u2019un document est \u00e9chapp\u00e9');
      T(r.h.includes('data-ic="carte"') && r.h.includes('data-ic="imprimante"'), 'ic\u00f4ne d\u00e9di\u00e9e quand elle existe, imprimante sinon');
      T(r.h.includes('Tous les documents'), 'la feuille renvoie vers le catalogue complet');
      T(r.v === '', 'un module sans document rend une cha\u00eene vide, pas un titre orphelin');
    }
  }

  /* 6. Les renvois */
  T(/taches:\s*\['home',\s*'vigne',\s*'set-sec-taches',\s*'_mvReglOpen'\]/.test(pil)
    && /tracteurs:\s*\['tracteur','tracteur','set-sec-tracteurs','_mvReglOpen'\]/.test(pil),
    'les cibles du Pilotage ouvrent le module puis sa roue');
  T(!/ou:'R\\u00e9glages \\u203a Vigne/.test(pil) && !/\(R\\u00e9glages \\u203a Tracteur\)/.test(pil),
    'aucun constat du Pilotage n\u2019envoie plus dans R\u00e9glages \u203a Vigne / \u203a Tracteur');
  T(/if \(k === 'vigne'\) \{ if \(window\._mvReglOpen\) window\._mvReglOpen\('vigne'\); return; \}/.test(app),
    'la Mise en route ouvre la roue de la Vigne');
  T(/switchReglTab\('domaine'\)/.test(app) && !/switchReglTab\('vigne'\)/.test(app),
    'le chapitre de d\u00e9mo R\u00e9glages atterrit sur Domaine');
  for (const m of ['vignoble', 'saison', 'csvJournal', 'csvParcelles'])
    T(new RegExp("act:'" + m + "',\\s*mod:'vigne'").test(reg), 'MV_DOCS : ' + m + ' porte son module (vigne)');
  T(/act:'entretien',\s*mod:'tracteur'/.test(reg), 'MV_DOCS : entretien porte son module (tracteur)');

  /* 7. L'aide et le guide disent vrai */
  const aide = ut.slice(ut.indexOf('var MV_AIDE = {'), ut.indexOf('var MV_AIDE_DEFAUT'));
  const fiche = k => { const i = aide.indexOf('\n  ' + k + ': {'); const j = aide.indexOf('\n  }', i); return aide.slice(i, j); };
  T(!/R\u00e9glages, onglet App/.test(fiche('parcelles')) && !/R\u00e9glages, onglet App/.test(fiche('journal')) && !/R\u00e9glages, onglet (App|Tracteur)/.test(fiche('tracteur')),
    'les fiches Parcelles, Journal, Tracteur n\u2019envoient plus dans R\u00e9glages');
  T(/roue crant\u00e9e/.test(fiche('home')) && /roue crant\u00e9e/.test(fiche('tracteur')) && /roue crant\u00e9e/.test(fiche('reglages')),
    'les fiches Accueil, Tracteur et R\u00e9glages nomment la roue');
  T(!/\['Onglet Vigne'/.test(fiche('reglages')), 'la fiche R\u00e9glages ne d\u00e9crit plus un onglet Vigne');
  T(/Domaine \u00b7 \u00c9quipe \u00b7 App/.test(G12) && !/\{ic:feuille\} Vigne<\/h3>/.test(G12) && !/\{ic:tracteur\} Tracteur<\/h3>/.test(G12),
    'le guide R\u00e9glages a trois onglets et ne d\u00e9crit plus Vigne ni Tracteur');
  T(/\{ic:engrenage\} La roue crant\u00e9e/.test(G04) && /\{ic:engrenage\} La roue crant\u00e9e/.test(G06),
    'le guide Vigne et le guide Tracteur d\u00e9crivent leur roue');
  T(!/R\u00e9glages \u203a Vigne \u203a/.test(G04 + G06 + readFileSync('guide/05-saisons.html', 'utf8') + readFileSync('guide/14-depannage.html', 'utf8')),
    'aucun chemin \u00ab R\u00e9glages \u203a Vigne \u203a \u2026 \u00bb ne subsiste dans le guide');
  return ok;
}

console.log('\n\u2500\u2500 NAV-1 : un module r\u00e8gle ses affaires chez lui \u2014 la roue crant\u00e9e\n');
jouer(APPNU, HTMLNU, REGNU, PILNU, RSVNU, UTNU, false);

/* ══ CONTRE-ÉPREUVES — chaque défaut réintroduit doit rougir ══ */
if (CONTRE) {
  console.log('\n  Contre-\u00e9preuves');
  const cas = [
    ['le bloc Vigne recopi\u00e9 dans #page-reglages (deux fois le m\u00eame id)',
      { html: h => h.replace('id="regl-view-domaine"', 'id="regl-view-vigne"></div><div id="regl-view-domaine"') }],
    ['l\u2019onglet Vigne revient dans la barre',
      { html: h => h.replace('id="regl-tbtn-equipe"', 'id="regl-tbtn-vigne"') }],
    ['la bande de compteurs revient',
      { html: h => h.replace('id="regl-tabs-row"', 'id="regl-tabs-row"><div id="regl-kpis"></div><div id="regl-stat-membres"') }],
    ['un bouton maison revient sur un en-t\u00eate de module',
      { html: h => h.replace("_mvReglOpen('tracteur')", 'goHub()') }],
    ['le voyant de synchro cherche encore goHub',
      { app: a => a.replace("top.appendChild(_syncMakeDot());", "if(top.getAttribute('onclick')==='goHub()') top.appendChild(_syncMakeDot());") }],
    ['la roue accepte un ouvrier',
      { app: a => a.replace("if(!isAdmin()){ showToast('R\\u00e9serv\\u00e9 \\u00e0 l\\u2019administrateur'", "if(false){ showToast('R\\u00e9serv\\u00e9 \\u00e0 l\\u2019administrateur'") }],
    ['docsGo re\u00e7oit l\u2019index de la liste filtr\u00e9e au lieu de celui du catalogue',
      { app: a => a.replace("cat.forEach(function(d,i){ if(d && d.mod===mod) out.push({i:i, d:d}); });", "cat.forEach(function(d,i){ if(d && d.mod===mod) out.push({i:out.length, d:d}); });") }],
    ['le titre d\u2019un document n\u2019est plus \u00e9chapp\u00e9',
      { app: a => a.replace("_escHtml(d.t||'')+'</div>'", "(d.t||'')+'</div>'") }],
    ['une cible du Pilotage renvoie dans R\u00e9glages \u203a Vigne',
      { pil: p => p.replace("taches:    ['home',    'vigne',  'set-sec-taches',   '_mvReglOpen'],", "taches:    ['reglages','vigne',  'set-sec-taches'],") }],
    ['MV_DOCS oublie le module de l\u2019\u00e9tat du vignoble',
      { reg: r => r.replace("act:'vignoble',  mod:'vigne'", "act:'vignoble',  mod:''") }],
    ['la fiche Parcelles renvoie \u00e0 nouveau dans R\u00e9glages, onglet App',
      { ut: u => u.replace("s\u2019imprime depuis la roue crant\u00e9e de la Vigne, bloc Documents : toutes", "s\u2019imprime depuis R\u00e9glages, onglet App, \u00ab Documents & impressions \u00bb : toutes") }],
  ];
  for (const [nom, mut] of cas) {
    const app2 = mut.app ? mut.app(APPNU) : APPNU, html2 = mut.html ? mut.html(HTMLNU) : HTMLNU;
    const reg2 = mut.reg ? mut.reg(REGNU) : REGNU, pil2 = mut.pil ? mut.pil(PILNU) : PILNU, ut2 = mut.ut ? mut.ut(UTNU) : UTNU;
    const identique = app2 === APPNU && html2 === HTMLNU && reg2 === REGNU && pil2 === PILNU && ut2 === UTNU;
    const vertApres = identique ? true : jouer(app2, html2, reg2, pil2, RSVNU, ut2, true);
    pose(!identique && !vertApres, nom + ' \u2192 rougit bien', identique ? 'la mutation n\u2019a rien chang\u00e9' : 'rest\u00e9 vert');
  }
}

console.log('\n  ' + vert + ' / ' + total + ' vertes' + (rouges.length ? '\n  ROUGES : ' + rouges.join(' \u00b7 ') : '') + '\n');
process.exit(rouges.length ? 1 : 0);
