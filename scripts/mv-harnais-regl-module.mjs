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
   7. (NAV-2, §99) Le Planning : « Le cadre » n'est plus un onglet, il vit dans la
      roue ; _planRenderCadre écrit dans l'hôte de la feuille (repli #plan-body) ;
      les documents « à volet » du hub y sont emmenés par _mvReglDocGo.
   8. (NAV-3, §100) Le Pilotage : plus de bouton « Outils » ; Archives est un
      onglet, le Paramétrage se rend dans la feuille (_pilParamRender), la clé
      'param' est traitée à part (C22 lit _PIL_TAB_MIGR comme la liste des clés
      mortes) ; conso GNR et IFT de référence ont chacun leur roue.
   9. (NAV-4/5, §101) Phyto et Réserve ont leur roue (documents seulement), le
      bouton d'export quitte le bas du registre ; « App » devient « Moi », le
      catalogue des documents passe dans Domaine ; les en-têtes disent le mot du
      dock ; « Paramétrage » n'apparaît plus à l'écran.
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
const G10  = readFileSync('guide/10-planning.html', 'utf8');
const PLN  = readFileSync('src/planning.js', 'utf8');
const CSS  = readFileSync('src/styles.css', 'utf8');
const G11  = readFileSync('guide/11-pilotage.html', 'utf8');
const PHY  = readFileSync('src/phyto.js', 'utf8');
const CAV  = readFileSync('src/cave.js', 'utf8');

const nu = s => s
  .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
const APPNU = nu(APP), REGNU = nu(REG), PILNU = nu(PIL), RSVNU = nu(RSV), UTNU = nu(UT), PLNNU = nu(PLN);
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
function jouer(app, html, reg, pil, rsv, ut, pln, silencieux) {
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
  T(/onclick="_mvReglDocGo\('\+x\.i\+'\)"/.test(app), 'chaque ligne de document passe par _mvReglDocGo(i)');
  const docGo = extraire(app, '_mvReglDocGo') || '';
  T(/if\(!volet\)\{ docsGo\(i\); return; \}/.test(docGo) && /docsGo\(i\); \},60\)/.test(docGo), '\u2026 qui finit toujours par docsGo(i), le seul chemin');
  T(/window\._docsEstVolet\(d\.act\)/.test(docGo) && /window\.openDocs\(\)/.test(docGo), '\u2026 et ouvre le hub avant un document \u00e0 volet');
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
      T(r.h.includes("_mvReglDocGo(0)") && r.h.includes("_mvReglDocGo(4)") && !r.h.includes("_mvReglDocGo(2)"), 'le rendu appelle _mvReglDocGo avec l\u2019index du catalogue, pas celui de la liste filtr\u00e9e');
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
  T(/Domaine \u00b7 \u00c9quipe \u00b7 Moi/.test(G12) && !/\{ic:feuille\} Vigne<\/h3>/.test(G12) && !/\{ic:tracteur\} Tracteur<\/h3>/.test(G12),
    'le guide R\u00e9glages a trois onglets et ne d\u00e9crit plus Vigne ni Tracteur');
  T(/\{ic:engrenage\} La roue crant\u00e9e/.test(G04) && /\{ic:engrenage\} La roue crant\u00e9e/.test(G06),
    'le guide Vigne et le guide Tracteur d\u00e9crivent leur roue');
  T(!/R\u00e9glages \u203a Vigne \u203a/.test(G04 + G06 + readFileSync('guide/05-saisons.html', 'utf8') + readFileSync('guide/14-depannage.html', 'utf8')),
    'aucun chemin \u00ab R\u00e9glages \u203a Vigne \u203a \u2026 \u00bb ne subsiste dans le guide');

  /* 8. NAV-2 — le Planning */
  T(!/data-tab="cadre"/.test(html) && nb(html, /data-tab="(mois|gens)"/g) === 2, 'la barre du Planning a deux onglets, sans « Le cadre »');
  T(nb(html, /_mvReglOpen\('planning'\)/g) === 1, 'la roue du Planning est sur son en-t\u00eate');
  const iP = html.indexOf('id="ovReglPlanning"'), hP = html.indexOf('id="plan-cadre-host"'), dP = html.indexOf('id="regl-docs-planning"');
  T(iP > 0 && hP > iP && dP > hP && dP < html.indexOf('id="page-chat"'), 'la feuille du Planning porte l\u2019h\u00f4te du cadre puis les documents');
  T(/var _PLAN_VALID_TAB=\{mois:1,gens:1,moi:1\};/.test(pln), '_PLAN_VALID_TAB ne conna\u00eet plus cadre');
  T(/cadre:'mois'/.test(pln) && /templates:'mois'/.test(pln), 'les cl\u00e9s m\u00e9moris\u00e9es cadre et templates atterrissent sur le mois');
  T(/if\(tab==='cadre'\)\{ if\(window\._mvReglOpen\) window\._mvReglOpen\('planning'\); return; \}/.test(pln), 'planSwitchTab(\'cadre\') ouvre la roue');
  T(!/planTab==='cadre'/.test(pln), 'plus aucune branche planTab===cadre');
  const cadre = extraire(pln, '_planRenderCadre') || '', editor = extraire(pln, '_planRenderGridEditor') || '';
  T(/var body=_planCadreHost\(\);/.test(cadre) && /var body=_planCadreHost\(\);/.test(editor), 'le cadre et l\u2019\u00e9diteur de semaine \u00e9crivent dans l\u2019h\u00f4te de la feuille');
  const host = extraire(pln, '_planCadreHost') || '';
  T(/getElementById\('plan-cadre-host'\)\|\|document\.getElementById\('plan-body'\)/.test(host), '\u2026 avec repli sur #plan-body');
  T(/function _planCadreOpen\(\)\{ _planEditing=null; _planRenderCadre\(\); \}/.test(pln) && /window\._planCadreOpen=_planCadreOpen;/.test(pln), '_planCadreOpen repart de la liste, et est expos\u00e9');
  T(/planning:\s*\{\s*ov:'ovReglPlanning'/.test(app) && /if\(mod==='planning'\)\{ if\(window\._planCadreOpen\) window\._planCadreOpen\(\); \}/.test(open), 'la roue du Planning rend le cadre par _planCadreOpen, pas par renderReglages');
  T(/act:'etp',\s*mod:'planning'/.test(reg), 'MV_DOCS : Heures & ETP porte son module (planning)');
  const volet = extraire(reg, '_docsEstVolet');
  T(!!volet && /window\._docsEstVolet=_docsEstVolet;/.test(reg), '_docsEstVolet existe et est expos\u00e9 par reglages.js, \u00e0 c\u00f4t\u00e9 de docsGo');
  if (volet) {
    let f = null; try { f = new Function(volet + ' return _docsEstVolet;')(); } catch (e) { f = null; }
    T(!!f && ['mois','releve','annuelNom','etp'].every(a => f(a) === true) && ['annuel','vignoble','entretien'].every(a => f(a) === false),
      '_docsEstVolet : les quatre volets, et rien d\u2019autre (ex\u00e9cut\u00e9)');
  }
  if (docGo) {
    const appels = [];
    try {
      const env = { MV_DOCS: [{ act: 'annuel' }, { act: 'mois' }], _docsEstVolet: a => a === 'mois', openDocs: () => appels.push('openDocs') };
      const g = new Function('window', 'docsGo', 'closeOv', 'setTimeout', "var _MV_REGL={planning:{ov:'ovReglPlanning'},vigne:{ov:'ovReglVigne'},tracteur:{ov:'ovReglTracteur'}};" + docGo + ' return _mvReglDocGo;')(env, i => appels.push('docsGo:' + i), (e, id) => appels.push('close:' + id), (fn) => fn());
      g(0); g(1);
    } catch (e) { appels.push('ERR ' + e.message); }
    T(appels.join(' ') === 'docsGo:0 close:ovReglPlanning close:ovReglVigne close:ovReglTracteur openDocs docsGo:1',
      '_mvReglDocGo (ex\u00e9cut\u00e9) : direct pour un document simple ; ferme les roues, ouvre le hub, puis docsGo pour un volet', appels.join(' '));
  }
  const fp = fiche('planning');
  T(!/Le cadre/.test(fp) && /Deux onglets/.test(fp) && /roue crant\u00e9e du Planning/.test(fp), 'la fiche Planning dit deux onglets et la roue, plus « Le cadre »');
  T(!/Planning \u203a Le cadre/.test(G10) && !/onglet Mod\u00e8les/.test(G10) && /Deux onglets, et une roue crant\u00e9e/.test(G10), 'le guide Planning ne nomme plus l\u2019onglet Le cadre ni l\u2019onglet Mod\u00e8les');

  /* 9. NAV-3 — le Pilotage */
  T(!/pil-outils|_PIL_TOOLS/.test(pil) && !/pil-outils/.test(CSS), 'plus de bouton \u00ab Outils \u00bb, ni de menu, ni de CSS');
  T(/\['cfm','alerte','Conformit\u00e9'\],[\s\S]{0,600}\['arc','carton','Archives'\]\n\];/.test(pil), 'Archives est le dernier onglet de _PIL_TABS, apr\u00e8s Conformit\u00e9');
  T(/var _PIL_VALID_TAB = \{auj:1,an:1,avc:1,equ:1,cav:1,eco:1,cfm:1,arc:1,sim:1\};/.test(pil), '_PIL_VALID_TAB ne conna\u00eet plus param');
  T(!/param:'auj'/.test(pil) && /var _PIL_TAB_ROUE = 'param';/.test(pil), '\u2018param\u2019 est trait\u00e9 \u00e0 part, PAS dans _PIL_TAB_MIGR (C22 y lirait une cl\u00e9 morte et rougirait sur le Cuvier)');
  T(/if\(t===_PIL_TAB_ROUE\) t='auj';/.test(pil), 'un onglet m\u00e9moris\u00e9 sur param rouvre sur Aujourd\u2019hui');
  T(/if\(t===_PIL_TAB_ROUE\)\{ if\(window\._mvReglOpen\) window\._mvReglOpen\('pilotage'\); return false; \}/.test(pil), '_pilSetTab(param) ouvre la roue');
  const fill = extraire(pil, '_pilFillContent') || '';
  T(!/tab==='param'/.test(fill) && /_pilParamRefresh\(d\);/.test(fill), '_pilFillContent n\u2019a plus de branche param et repeint la feuille ouverte');
  const prr = extraire(pil, '_pilParamRender') || '';
  T(/getElementById\('pil-regl-host'\)/.test(prr) && /host\.innerHTML=_pilParamBody\(d\);/.test(prr) && /_pilBindParam\(d\);/.test(prr) && /window\._ecoRenderIftCard\(\)/.test(prr),
    '_pilParamRender : m\u00eame corps, m\u00eames \u00e9crivains, plus la carte IFT');
  const prf = extraire(pil, '_pilParamRefresh') || '';
  T(/getElementById\('ovReglPilotage'\)/.test(prf) && /classList\.contains\('open'\)/.test(prf), '_pilParamRefresh ne repeint que si la feuille est ouverte');
  T(/window\._pilParamOpen=function\(\)\{/.test(pil) && /closest\('\[data-diag\]'\)/.test(pil.slice(pil.indexOf('window._pilParamOpen=function'), pil.indexOf('window._pilParamOpen=function')+900)),
    '_pilParamOpen est expos\u00e9 et d\u00e9l\u00e8gue les boutons \u00ab \u00e0 compl\u00e9ter \u00bb de la feuille');
  T(/if\(_pa==='param'\)\{ if\(window\._mvReglOpen\) window\._mvReglOpen\('pilotage'\); return; \}/.test(pil), 'le raccourci Param\u00e9trage de l\u2019\u00c9conomie ouvre la roue');
  T(/id="pil-regl-gear"/.test(pil) && /window\.isAdmin\(\)\)\?'<button class="pil-icon mv-regl-gear" id="pil-regl-gear"/.test(pil), 'la roue est dans l\u2019en-t\u00eate du Pilotage, admin seulement');
  T(/gearR\.onclick=function\(\)\{ if\(window\._mvReglOpen\) window\._mvReglOpen\('pilotage'\); \}/.test(pil), '\u2026 et elle est branch\u00e9e');
  T(!/_pilOpenParam/.test(pil) && !/_pilOpenParam/.test(reg), '_pilOpenParam (l\u2019ancien saut Domaine \u2192 Param\u00e9trage) n\u2019existe plus');
  T(/pilotage:\s*\{\s*ov:'ovReglPilotage'/.test(app) && /else if\(mod==='pilotage'\)\{ if\(window\._pilParamOpen\) window\._pilParamOpen\(\); \}/.test(app), 'la roue du Pilotage rend par _pilParamOpen');
  T(!/_ecoRenderConfigCard|eco-conf-card/.test(reg), 'la carte \u00ab \u00c9conomie & conformit\u00e9 \u00bb n\u2019existe plus');
  T(/_ecoRenderConsoCard\(\);\n    _aocRenderCard\(\);/.test(reg), 'renderReglages rend la carte Carburant puis les appellations');
  const conso = extraire(reg, '_ecoRenderConsoCard') || '', ift = extraire(reg, '_ecoRenderIftCard') || '';
  T(/getElementById\('regl-eco-tracteur'\)/.test(conso) && /_ecoCfgSet\(\\'conso\\',null,this\.value\)/.test(conso), 'la conso GNR se r\u00e8gle dans la roue du Tracteur, par le m\u00eame \u00e9crivain');
  T(/getElementById\('regl-eco-pilotage'\)/.test(ift) && /_ecoCfgSet\(\\'ift\\',null,this\.value\)/.test(ift) && /window\._ecoRenderIftCard=_ecoRenderIftCard;/.test(reg), 'l\u2019IFT se r\u00e8gle dans la roue du Pilotage, par le m\u00eame \u00e9crivain, expos\u00e9');
  if (ift) {
    let out = null;
    try {
      const carte = extraire(reg, '_ecoCarte') || '';
      const css = "var _ECO_IN_CSS='';var _ECO_ROW_CSS='';var isAdmin=function(){return true;};var _mvIcon=function(n){return '<i data-ic=\"'+n+'\"></i>';};";
      const dom = { innerHTML: '' };
      out = new Function('window', 'document', css + carte + ift + " _ecoRenderIftCard(); return document.el.innerHTML;")({ CONFIG: { conformite: { ift_ref: 14 } } }, { el: dom, getElementById: id => id === 'regl-eco-pilotage' ? dom : null });
    } catch (e) { out = 'ERR ' + e.message; }
    T(typeof out === 'string' && out.includes('value="14"') && out.includes("_ecoCfgSet('ift',null,this.value)") && out.includes('data-ic="eprouvette"'),
      '_ecoRenderIftCard (ex\u00e9cut\u00e9) rend la valeur, l\u2019\u00e9crivain et l\u2019ic\u00f4ne', String(out).slice(0, 120));
  }
  T(!/_PIL_TOOLS/.test(ut), 'l\u2019aide ne lit plus _PIL_TOOLS');
  const fpil = fiche('pilotage');
  T(!/Rien ne se saisit ici/.test(fpil) && /quatre choses s\u2019\u00e9crivent/.test(fpil) && /roue crant\u00e9e/.test(fpil), 'la fiche Pilotage ne promet plus qu\u2019on n\u2019y \u00e9crit rien, et nomme la roue');
  // Le journal WHATS_NEW est de l'histoire : on ne le réécrit pas. L'aide et les fiches « i », si.
  const aideEtInfo = ut.slice(ut.indexOf('var MV_AIDE = {'));
  T(!/Outils \u203a Param\u00e9trage/.test(aideEtInfo) && !/Outils \\u203a Param/.test(aideEtInfo), 'plus aucun \u00ab Outils \u203a Param\u00e9trage \u00bb dans l\u2019aide ni les fiches \u00ab i \u00bb');
  T(!/Le bouton <b>Outils<\/b>/.test(G11) && /La roue crant\u00e9e \u2014 ce qui se r\u00e8gle/.test(G11), 'le guide Pilotage d\u00e9crit la roue, plus le bouton Outils');
  const iPT = html.indexOf('id="ovReglPilotage"');
  T(iPT > 0 && html.indexOf('id="pil-regl-host"') > iPT && html.indexOf('id="regl-eco-pilotage"') > iPT && html.indexOf('id="regl-docs-pilotage"') > iPT && iPT < html.indexOf('id="page-chat"'),
    'la feuille du Pilotage porte l\u2019h\u00f4te du Param\u00e9trage, la carte IFT, puis les documents');
  T(html.indexOf('id="regl-eco-tracteur"') > html.indexOf('id="ovReglTracteur"') && html.indexOf('id="regl-eco-tracteur"') < html.indexOf('id="regl-docs-tracteur"'), 'la feuille du Tracteur porte la carte Carburant avant ses documents');

  /* 10. NAV-4/5 — Phyto, Réserve, vocabulaire */
  T(!/phyto-export-row/.test(html) && !/phyto-export-row/.test(nu(PHY)), 'le bouton d\u2019export a quitt\u00e9 le bas du registre phyto');
  T(nb(html, /_mvReglOpen\('phyto'\)/g) === 1 && /id="ovReglPhyto"/.test(html) && /id="regl-docs-phyto"/.test(html), 'le Phyto a sa roue et sa feuille de documents');
  T(/phyto:\s*\{\s*ov:'ovReglPhyto'/.test(app) && /reserve:\s*\{\s*ov:'ovReglReserve'/.test(app), 'le registre _MV_REGL conna\u00eet Phyto et R\u00e9serve');
  T(/window\.isAdmin\(\)\)\?'<button class="mod-home-btn mv-regl-gear" onclick="_mvReglOpen\(\\'reserve\\'\)"/.test(rsv), 'la R\u00e9serve rend sa roue en JS, admin seulement');
  T(/id="ovReglReserve"/.test(html) && /id="regl-docs-reserve"/.test(html) && /Aucun prix ne se saisit ici/.test(html), 'la feuille de la R\u00e9serve porte les inventaires et dit o\u00f9 vont les prix');
  T(/mod==='phyto'\|\|mod==='reserve'/.test(open), 'la roue du Phyto et de la R\u00e9serve ne rappelle aucun \u00e9crivain');
  T(/id="regl-tbtn-app"[^\n]*<\/span>Moi<\/button>/.test(html) && !/<\/span>App<\/button>/.test(html), 'le troisi\u00e8me onglet de R\u00e9glages s\u2019appelle Moi (cl\u00e9 app inchang\u00e9e)');
  const iDom = html.indexOf('id="regl-view-domaine"'), iDon = html.indexOf('id="set-sec-donnees"'), iExp = html.indexOf('id="regl-export-row"'), iEq = html.indexOf('id="regl-view-equipe"');
  T(nb(html, /id="regl-export-row"/g) === 1 && iDom < iDon && iDon < iExp && iExp < iEq, 'Documents & impressions est dans Domaine \u203a Donn\u00e9es, une fois');
  T(/getElementById\('regl-export-row'\)/.test(extraire(reg, '_reglStashRow') || ''), '_reglStashRow s\u2019ancre toujours sur la ligne des documents (qui a d\u00e9m\u00e9nag\u00e9 avec elle)');
  T(/switchReglTab\('domaine'\); if\(window\.openDocs\) window\.openDocs\(\);/.test(app), '\u00ab Tous les documents \u00bb depuis une roue va dans Domaine');
  T(/<div class="mod-header-title">R\u00e9serve<\/div>/.test(rsv) && !/La R\u00e9serve<\/div>/.test(rsv), 'l\u2019en-t\u00eate de la R\u00e9serve dit le mot du dock');
  T(/ttl\.textContent='Cave';/.test(nu(CAV)), 'l\u2019en-t\u00eate de la Cave dit le mot du dock');
  T(nb(html, /Le Mill\u00e9sime/g) === 2 && !/Le mill\u00e9sime<\/button>/.test(html), '\u00ab Le Mill\u00e9sime \u00bb s\u2019\u00e9crit comme \u00ab Le Cuvier \u00bb');
  T(!/Param\u00e9trage|Param\\u00e9trage/.test(pil), 'le mot \u00ab Param\u00e9trage \u00bb n\u2019appara\u00eet plus dans le Pilotage (hors commentaires)');
  T(!/R\u00e9glages \u203a App/.test(G04 + G06 + G10 + G11 + G12 + readFileSync('guide/13-donnees.html', 'utf8') + readFileSync('guide/08-cave.html', 'utf8') + readFileSync('guide/01-demarrer.html', 'utf8') + readFileSync('guide/14-depannage.html', 'utf8')),
    'plus aucun chemin \u00ab R\u00e9glages \u203a App \u00bb dans le guide');
  T(!/onglet App/.test(aideEtInfo), 'l\u2019aide ne dit plus \u00ab onglet App \u00bb');
  return ok;
}

console.log('\n\u2500\u2500 NAV-1 : un module r\u00e8gle ses affaires chez lui \u2014 la roue crant\u00e9e\n');
jouer(APPNU, HTMLNU, REGNU, PILNU, RSVNU, UTNU, PLNNU, false);

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
  cas.push(
    ['l\u2019onglet « Le cadre » revient dans la barre du Planning',
      { html: h => h.replace('data-tab="gens"', 'data-tab="cadre"') }],
    ['_planRenderCadre \u00e9crit directement dans #plan-body',
      { pln: p => p.replace("function _planRenderCadre(){\n  var body=_planCadreHost();", "function _planRenderCadre(){\n  var body=document.getElementById('plan-body');") }],
    ['la migration cadre \u2192 mois est perdue',
      { pln: p => p.replace("templates:'mois',cadre:'mois'", "templates:'mois'") }],
    ['_docsEstVolet oublie Heures & ETP',
      { reg: r => r.replace("act==='annuelNom'||act==='etp';", "act==='annuelNom';") }],
    ['_mvReglDocGo appelle docsGo sans ouvrir le hub pour un volet',
      { app: a => a.replace("if(!volet){ docsGo(i); return; }", "docsGo(i); return;") }],
    ['les lignes de la roue court-circuitent _mvReglDocGo',
      { app: a => a.replace('onclick="_mvReglDocGo(\'+x.i+\')"', 'onclick="docsGo(\'+x.i+\')"') }],
    ['param revient dans _PIL_VALID_TAB',
      { pil: p => p.replace("arc:1,sim:1};", "arc:1,sim:1,param:1};") }],
    ['param passe par _PIL_TAB_MIGR (C22 rougirait sur le Cuvier)',
      { pil: p => p.replace("ecf:'eco',cav:'auj'}", "ecf:'eco',cav:'auj',param:'auj'}") }],
    ['un onglet m\u00e9moris\u00e9 sur param n\u2019est plus ramen\u00e9 sur Aujourd\u2019hui',
      { pil: p => p.replace("if(t===_PIL_TAB_ROUE) t='auj'; ", "") }],
    ['_pilFillContent oublie de repeindre la feuille',
      { pil: p => p.replace("  _pilParamRefresh(d);\n}\n", "}\n") }],
    ['la carte IFT \u00e9crit dans la feuille du Tracteur',
      { reg: r => r.replace("getElementById('regl-eco-pilotage')", "getElementById('regl-eco-tracteur')") }],
    ['renderReglages ne rend plus la carte Carburant',
      { reg: r => r.replace("    _ecoRenderConsoCard();\n    _aocRenderCard();", "    _aocRenderCard();") }],
    ['la fiche Pilotage promet \u00e0 nouveau qu\u2019on n\u2019y \u00e9crit rien',
      { ut: u => u.replace("['Presque tout se lit, quatre choses s\u2019\u00e9crivent'", "['Rien ne se saisit ici'") }],
    ['le bouton d\u2019export revient au bas du registre phyto',
      { html: h => h.replace('id="tab-cat-trac"', 'id="phyto-export-row"></div><div id="tab-cat-trac"') }],
    ['le troisi\u00e8me onglet redevient App',
      { html: h => h.replace('</span>Moi</button>', '</span>App</button>') }],
    ['Documents & impressions retourne sous App',
      { html: h => h.replace('id="set-sec-donnees"', 'id="set-sec-donnees-x"').replace('id="regl-view-app"', 'id="regl-view-app"><div id="regl-export-row"></div') }],
    ['l\u2019en-t\u00eate de la R\u00e9serve redit \u00ab La R\u00e9serve \u00bb',
      { rsv: r => r.replace('<div class="mod-header-title">R\u00e9serve</div>', '<div class="mod-header-title">La R\u00e9serve</div>') }],
    ['\u00ab Param\u00e9trage \u00bb revient dans un titre du Pilotage',
      { pil: p => p.replace(';margin-bottom:8px">Fen\u00eatres des t\u00e2ches</div>', ';margin-bottom:8px">Param\u00e9trage \u00b7 fen\u00eatres des t\u00e2ches</div>') }],
  );
  for (const [nom, mut] of cas) {
    const app2 = mut.app ? mut.app(APPNU) : APPNU, html2 = mut.html ? mut.html(HTMLNU) : HTMLNU;
    const reg2 = mut.reg ? mut.reg(REGNU) : REGNU, pil2 = mut.pil ? mut.pil(PILNU) : PILNU, ut2 = mut.ut ? mut.ut(UTNU) : UTNU, pln2 = mut.pln ? mut.pln(PLNNU) : PLNNU, rsv2 = mut.rsv ? mut.rsv(RSVNU) : RSVNU;
    const identique = app2 === APPNU && html2 === HTMLNU && reg2 === REGNU && pil2 === PILNU && ut2 === UTNU && pln2 === PLNNU && rsv2 === RSVNU;
    const vertApres = identique ? true : jouer(app2, html2, reg2, pil2, rsv2, ut2, pln2, true);
    pose(!identique && !vertApres, nom + ' \u2192 rougit bien', identique ? 'la mutation n\u2019a rien chang\u00e9' : 'rest\u00e9 vert');
  }
}

console.log('\n  ' + vert + ' / ' + total + ' vertes' + (rouges.length ? '\n  ROUGES : ' + rouges.join(' \u00b7 ') : '') + '\n');
process.exit(rouges.length ? 1 : 0);
