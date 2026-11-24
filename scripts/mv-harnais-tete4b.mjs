/* ───────────────────────────────────────────────────────
   HARNAIS — TETE-4B (§578) : LES SOUS-ONGLETS SUR LA LIGNE D'ÉCRAN ; LA LIGNE COLLÉE SUR ORDINATEUR
   Lancer :          node scripts/mv-harnais-tete4b.mjs
   Contre-épreuves : node scripts/mv-harnais-tete4b.mjs --contre

   POURQUOI IL EXISTE
   Dans la Cave, les sous-onglets venaient après un bloc différent dans chaque section (280 px au Cuvier, 322 au Chai, 546 au
   Millésime ; 306, 399 et 761 au téléphone). TETE-4B les pose sur la ligne d'écran (.mv-ecran), à gauche, un seul jeu à la fois ; le
   millésime regardé y tient en un bouton, à droite. Sur ordinateur la ligne colle sous l'en-tête — et les panneaux qui collent
   (les fiches à côté des listes) se calent SOUS elle : ils collaient à 16 px du haut de la fenêtre, donc sous l'en-tête (mesuré :
   95 px de la fiche cachés en descendant).
   Ce harnais garde : la place des trois jeux dans index.html, _caveSousSync JOUÉE section par section, les deux formes du choix du
   millésime JOUÉES sur les mêmes années, _mvTeteBas JOUÉE, et — le garde-fou qui compte — TOUT panneau que styles.css fait coller
   à 16 px sur ordinateur doit être dans la liste de bandeau.css : une fiche neuve oubliée repasserait sous l'en-tête.
   Ce qu'il ne voit pas : la place à l'écran — elle se mesure sur l'appli construite (npm run test:ux).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { idx: lire('index.html'), uti: lire('src/utils.js'), cav: lire('src/cave.js'), css: lire('src/bandeau.css'), sty: lire('src/styles.css'), app: lire('src/app.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function finBloc(s, i) { const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { d += m[1] ? -1 : 1; if (!d) return re.lastIndex; } return -1; }
const sansCom = (s) => s.replace(/<!--[\s\S]*?-->/g, '');
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };

/* un DOM minime : ce que lisent _caveSousSync et _mvTeteBas */
function noeud(cls, id) {
  const n = { className: cls || '', id: id || '', children: [], parentNode: null, style: {}, offsetHeight: 0, pos: 'static',
    classList: { contains: (c) => (' ' + n.className + ' ').includes(' ' + c + ' '),
      toggle(c, on) { const a = n.className.split(' ').filter((x) => x && x !== c); if (on) a.push(c); n.className = a.join(' '); },
      remove(c) { n.className = n.className.split(' ').filter((x) => x && x !== c).join(' '); } },
    appendChild(c) { c.parentNode = n; n.children.push(c); return c; },
    tous() { return n.children.reduce((a, c) => a.concat([c], c.tous()), []); },
    closest(sel) { const c = sel.replace(/^\./, ''); let x = n; while (x) { if (x.classList.contains(c)) return x; x = x.parentNode; } return null; },
    querySelector(sel) { if (sel === '.mod-header + .mv-ecran') { const k = n.children.findIndex((x) => x.classList.contains('mod-header')); const s = k < 0 ? null : n.children[k + 1]; return s && s.classList.contains('mv-ecran') ? s : null; }
      const c = sel.replace(/^\./, ''); return n.tous().find((x) => x.classList.contains(c)) || null; } };
  return n;
}
/* les règles d'une feuille prises dans « @media (min-width:1024px) », en { sélecteurs, corps } */
function regles1024(css) {
  const out = []; const re = /@media\s*\(min-width:1024px\)\s*\{/g; let m;
  while ((m = re.exec(css))) { let k = m.index + m[0].length, p = 1, deb = k; for (; k < css.length && p; k++) { if (css[k] === '{') p++; else if (css[k] === '}') p--; }
    const bloc = css.slice(deb, k - 1); const rr = /([^{}]+)\{([^{}]*)\}/g; let r; while ((r = rr.exec(bloc))) out.push({ sel: r[1].trim(), corps: r[2] }); }
  return out;
}
const norm = (s) => s.replace(/\s+/g, ' ').replace(/\s*>\s*/g, ' > ').trim();

function jouer(S) {
  const idx = sansCom(S.idx);
  const css = S.css.replace(/\/\*[\s\S]*?\*\//g, '');
  // ① index.html : les trois jeux sur la ligne d'écran de la Cave, à gauche, avant le compteur ; plus rien à leur ancienne place
  {
    const i = idx.indexOf('<div class="mod-header h-cave">'); const f = i < 0 ? -1 : finBloc(idx, i);
    const e = f < 0 ? -1 : idx.indexOf('<div class="mv-ecran">', f); const ef = e < 0 ? -1 : finBloc(idx, e); const L = ef < 0 ? '' : idx.slice(e, ef);
    const iS = L.indexOf('<div class="mv-ecran-sous" id="cave-ecran-sous">'), iB = L.indexOf('id="cave-hdr-badge"'), iD = L.indexOf('<div class="mv-ecran-d" id="cave-ecran-d">');
    t('① la ligne d’écran de la Cave suit son en-tête ; à gauche l’hôte des sous-onglets, puis le compteur ; à droite l’hôte du millésime', e > 0 && /^\s*$/.test(idx.slice(f, e)) && iS > 0 && iB > iS && iD > iB);
    const hf = iS < 0 ? -1 : finBloc(L, iS); const H = hf < 0 ? '' : L.slice(iS, hf);
    const caches = ['<div class="mv-ecran-sous-h" id="cave-sous-vend" style="display:none">', 'id="mvc-tabs-row" style="display:none"', 'id="ml-tabs-row" role="tablist" aria-label="Vues du millésime" style="display:none"'].every((x) => H.includes(x));
    t('①bis l’hôte porte les trois jeux — Le Cuvier (posé par cave.js), Le Chai, Le Millésime —, tous cachés au départ', caches);
    const une = (id) => (idx.match(new RegExp('id="' + id + '"', 'g')) || []).length === 1;
    const mvc = idx.indexOf('<div id="mvc-elevage"'), mil = idx.indexOf('<div id="cave-view-mil"');
    const dansVue = (deb, id) => { const fin = finBloc(idx, deb); return idx.slice(deb, fin).includes('id="' + id + '"'); };
    t('①ter chaque jeu n’existe qu’une fois : plus dans la vue du Chai ni dans celle du Millésime', une('mvc-tabs-row') && une('ml-tabs-row') && mvc > 0 && mil > 0 && !dansVue(mvc, 'mvc-tabs-row') && !dansVue(mil, 'ml-tabs-row'));
    t('①quater leurs boutons ont suivi (les ids que lisent le code, les tutos et les nouveautés)', ['mvc-tbtn-cuv', 'mvc-tbtn-labo', 'mvc-tbtn-diag', 'mvc-tbtn-journal', 'ml-tab-vie', 'ml-tab-parc', 'ml-tab-cuv', 'ml-tab-crb'].every((b) => H.includes('id="' + b + '"')));
  }
  // ② _caveSousSync, JOUÉE : un seul jeu visible, celui de la section ; .a-sous suit ; un jeu hors de l'hôte n'est pas touché
  {
    const ligne = noeud('mv-ecran'); const g = ligne.appendChild(noeud('mv-ecran-g')); const h = g.appendChild(noeud('mv-ecran-sous', 'cave-ecran-sous'));
    const J = { 'cave-sous-vend': h.appendChild(noeud('mv-ecran-sous-h', 'cave-sous-vend')), 'mvc-tabs-row': h.appendChild(noeud('mvu-tabs mvu-sub', 'mvc-tabs-row')), 'ml-tabs-row': h.appendChild(noeud('mvu-tabs mvu-sub', 'ml-tabs-row')) };
    const parId = Object.assign({ 'cave-ecran-sous': h }, J);
    const ctx = { document: { getElementById: (id) => parId[id] || null }, setTimeout: () => 0, window: {}, caveSection: 'aujourdhui' }; vm.createContext(ctx);
    const decl = (S.cav.match(/^var _CAVE_SOUS=\{[^\n]*\};/m) || [''])[0];
    vm.runInContext(decl + '\n' + fonction(S.cav, 'function _caveSousSync('), ctx);
    const vus = (sec) => { ctx.caveSection = sec; vm.runInContext('_caveSousSync()', ctx); return Object.keys(J).filter((k) => J[k].style.display !== 'none').join(',') + '|' + ligne.classList.contains('a-sous'); };
    const r = ['vendange', 'elevage', 'millesime', 'aujourdhui', 'reglages'].map(vus);
    t('② jouée, section par section : Le Cuvier, Le Chai, Le Millésime montrent CHACUN leur jeu et lui seul (' + r.slice(0, 3).join(' ; ') + ')', r[0] === 'cave-sous-vend|true' && r[1] === 'mvc-tabs-row|true' && r[2] === 'ml-tabs-row|true');
    t('②bis Aujourd’hui et les réglages n’en montrent aucun : la ligne redit la campagne (' + r.slice(3).join(' ; ') + ')', r[3] === '|false' && r[4] === '|false');
    // une page d'avant : le jeu du Chai est resté dans sa vue — on ne le cache pas
    const ailleurs = noeud('mvu-tabs mvu-sub', 'mvc-tabs-row'); noeud('vue').appendChild(ailleurs); parId['mvc-tabs-row'] = ailleurs; ailleurs.style.display = '';
    ctx.caveSection = 'vendange'; vm.runInContext('_caveSousSync()', ctx);
    t('②ter un jeu resté hors de la ligne (une page d’avant) n’est pas caché', ailleurs.style.display === '');
    t('②quater renderCave appelle _caveSousSync après le millésime regardé ; Le Cuvier pose son jeu dans #cave-sous-vend', /_caveMilBarRender\(\);[^\n]*\n\s*_caveSousSync\(\);/.test(S.cav) && /var _hs=document\.getElementById\('cave-sous-vend'\), _bs=body\.querySelector\('\.mvv-wrap > \.mvu-tabs\.mvu-sub'\);\s*\n\s*if\(_hs&&_bs\)\{ _hs\.innerHTML=''; _hs\.appendChild\(_bs\); \}/.test(S.cav));
  }
  // ③ le millésime regardé, JOUÉ dans ses deux formes : les mêmes années, la plus récente d'abord ; un seul millésime → pas de choix
  {
    const ctx = { CAVE_ELEVAGE: { cuvees: [{ millesime: 2025, statut: 'elevage' }, { millesime: 2025, statut: 'elevage' }, { millesime: 2024, statut: 'embouteille' }] },
      _caveMilsDuChai: () => [2024, 2025], _mlMillesimes: () => [2026, 2025], _caveMillFilter: '2025', caveSection: 'elevage', _mlCampagne: () => 2026,
      _escHtml: (x) => String(x), _escAttr: (x) => String(x), _pcavLog: () => {}, _mlPhrase: () => '<b>8 parcelles récoltées</b>' }; vm.createContext(ctx);   // MOTS-12 : la phrase de l'onglet
    vm.runInContext(['function _caveMillChoix(', 'function _caveMillNoteHtml(', 'function _caveMillChipsHtml(', 'function _caveMillBoutonHtml('].map((d) => fonction(S.cav, d)).join('\n'), ctx);
    const b = vm.runInContext('_caveMillBoutonHtml()', ctx), p = vm.runInContext('_caveMillChipsHtml()', ctx);
    const opts = [...b.matchAll(/<option value="([^"]+)"( selected)?>([^<]+)<\/option>/g)].map((m) => m[1] + (m[2] ? '*' : ''));
    t('③ le bouton : une liste « Tous », puis 2026, 2025, 2024 — l’année regardée choisie (' + opts.join(' ') + ')', opts.join(' ') === 'tous 2026 2025* 2024' && /<select class="mvcm-liste" id="cave-mil-sel" aria-label="Millésime regardé" onchange="_caveSetMill\(this\.value\)">/.test(b));
    const puces = [...p.matchAll(/onclick="_caveSetMill\('([^']+)'\)"/g)].map((m) => m[1]);
    t('③bis les puces (la page sans ligne d’écran) lisent les mêmes années, dans le même ordre', puces.join(' ') === 'tous 2026 2025 2024' && /2025<span class="mvcm-c">2<\/span>/.test(p));
    ctx._caveMillFilter = 'tous'; ctx.caveSection = 'millesime';
    const bT = vm.runInContext('_caveMillBoutonHtml()', ctx), n = vm.runInContext('_caveMillNoteHtml()', ctx);
    t('③ter sur « Tous », au Millésime : « Tous » choisi dans la liste, et la phrase de l’onglet à part (MOTS-12 : l’année montrée est dans le « i » de la tête)', /<option value="tous" selected>Tous<\/option>/.test(bT) && /class="mlh-tous ml-ph"/.test(n) && /8 parcelles récoltées/.test(n) && !/mlh-tous/.test(bT));
    ctx._caveMilsDuChai = () => [2025]; ctx._mlMillesimes = () => [2025];
    t('③quater un seul millésime : ni bouton ni puces', vm.runInContext('_caveMillBoutonHtml()', ctx) === '' && vm.runInContext('_caveMillChipsHtml()', ctx) === '');
    t('③quinquies la barre : le bouton (et la phrase) sur la ligne d’écran, les puces ailleurs', /var surLigne=!!\(h\.parentNode && h\.parentNode\.id==='cave-ecran-d'\);\s*\n\s*h\.innerHTML=la\?\(surLigne\?_caveMillBoutonHtml\(\)\+_caveMillNoteHtml\(\):_caveMillChipsHtml\(\)\):'';/.test(S.cav));
  }
  // ④ la feuille : la ligne qui porte des sous-onglets ; collée sur ordinateur, sous un en-tête de 111 px
  {
    t('④ la ligne qui porte des sous-onglets leur donne la gauche et tait son compteur ; sans eux, l’hôte ne prend pas de place', /\.mv-ecran:not\(\.a-sous\) > \.mv-ecran-g > \.mv-ecran-sous\{ display:none; \}/.test(css) && /\.mv-ecran\.a-sous > \.mv-ecran-g\{ flex:1 1 auto; max-width:none; \}/.test(css) && /\.mv-ecran\.a-sous > \.mv-ecran-g > \.mod-header-badge\{ display:none; \}/.test(css));
    t('④bis les sous-onglets y tiennent dans les 44 px (28 px, zone d’appui étendue) et défilent de côté', /body \.mv-ecran-sous \.mvu-tabs\.mvu-sub \.mvu-tab\{[^}]*height:var\(--h-sm,28px\);[^}]*min-height:0;[^}]*\}/.test(css) && /body \.mv-ecran-sous \.mvu-tabs\.mvu-sub \.mvu-tab::after\{[^}]*top:calc\(var\(--e-2,8px\) \* -1\);[^}]*\}/.test(css) && /\.mv-ecran-g > \.mv-ecran-sous\{[^}]*overflow-x:auto;[^}]*\}/.test(css));
    const R = regles1024(css); const colle = R.find((r) => norm(r.sel) === '.mod-header + .mv-ecran');
    t('④ter sur ordinateur (1 024 px et plus) la ligne colle sous l’en-tête, à 111 px, sous lui dans la pile', !!colle && /position:sticky;\s*top:calc\(var\(--mv-demo-h,0px\) \+ var\(--h-tete,111px\)\);\s*z-index:79;/.test(colle.corps) && !/\.mod-header \+ \.mv-ecran\{[^}]*position:sticky/.test(css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')));
  }
  // ⑤ LE GARDE-FOU : tout panneau que styles.css fait coller à 16 px (ou 12) sur ordinateur est recalé sous la ligne par bandeau.css
  {
    const HAUT = 'calc(var(--mv-demo-h,0px) + var(--h-tete,111px) + var(--h-ecran,44px) + var(--e-4,16px))';   // TETE-4C (§579) : le bandeau de la démo décale tout de sa hauteur
    const sty = S.sty.replace(/\/\*[\s\S]*?\*\//g, ''); const A = regles1024(sty).filter((r) => /position:sticky/.test(r.corps) && /(^|;)\s*top:(var\(--e-4,16px\)|12px)\s*(;|$)/.test(r.corps) && !/#ovPlanFiche/.test(r.sel));
    const R = regles1024(css); const rTop = R.find((r) => norm(r.corps) === norm('top:' + HAUT + ';')), rMax = R.find((r) => /max-height:/.test(r.corps));
    const liste = rTop ? rTop.sel.split(',').map((x) => norm(x).replace(/^body /, '')) : [], listeMax = rMax ? rMax.sel.split(',').map((x) => norm(x).replace(/^body /, '')) : [];
    const voulus = [].concat(...A.map((r) => r.sel.split(',').map(norm))); const manque = voulus.filter((x) => !liste.includes(x));
    t('⑤ les ' + voulus.length + ' panneaux qui collaient à 16 px du haut de la fenêtre sont tous calés sous la ligne (manquent : ' + (manque.join(' | ') || 'aucun') + ')', voulus.length >= 13 && manque.length === 0);
    const hauts = [].concat(...A.filter((r) => /max-height:calc\(100vh - var\(--e-8,40px\)\)/.test(r.corps)).map((r) => r.sel.split(',').map(norm))); const manqueH = hauts.filter((x) => !listeMax.includes(x));
    t('⑤bis ceux qui avaient une hauteur limitée la gardent, comptée depuis leur nouvelle place (' + hauts.length + ' ; manquent : ' + (manqueH.join(' | ') || 'aucun') + ')', hauts.length >= 8 && manqueH.length === 0 && !!rMax && norm(rMax.corps) === norm('max-height:calc(100vh - ' + HAUT + ' - var(--e-6,24px));'));
    t('⑤ter le sommaire de Cave › Aujourd’hui, en colonne sur ordinateur, se cale aussi', liste.includes('.caj-som'));
    t('⑤quater Planning › Personnel : la ligne d’écran sur toute la largeur, la fiche de la personne sous elle', R.some((r) => norm(r.sel) === 'body.pl-gens-dock #page-planning > .mv-ecran' && /grid-column:1 \/ -1/.test(r.corps)) && R.some((r) => norm(r.sel) === 'body.pl-gens-dock #page-planning > #ovPlanFiche' && /grid-row:3 \/ span 20/.test(r.corps)));
  }
  // ⑥ _mvTeteBas, JOUÉE : l'en-tête, plus la ligne quand elle colle ; ceux qui se calent sous l'en-tête la lisent
  {
    const pg = noeud('page', 'page-cave'); const hd = pg.appendChild(noeud('mod-header')); hd.offsetHeight = 111; const ec = pg.appendChild(noeud('mv-ecran')); ec.offsetHeight = 44;
    const win = { getComputedStyle: (e) => ({ position: e.pos }) }; const ctx = { document: { getElementById: (id) => (id === 'page-cave' ? pg : null) }, window: win }; vm.createContext(ctx);
    vm.runInContext(fonction(S.uti, 'function _mvTeteBas('), ctx);
    ec.pos = 'sticky'; const pc = vm.runInContext("_mvTeteBas('page-cave')", ctx); ec.pos = 'static'; const tel = vm.runInContext("_mvTeteBas('page-cave')", ctx);
    t('⑥ jouée : 155 px quand la ligne colle (ordinateur), 111 quand elle défile (téléphone), 0 sans page (' + [pc, tel, vm.runInContext("_mvTeteBas('page-x')", ctx)].join(', ') + ')', pc === 155 && tel === 111 && vm.runInContext("_mvTeteBas('page-x')", ctx) === 0 && /window\._mvTeteBas = _mvTeteBas;/.test(S.uti));
    t('⑥bis la colonne de l’Accueil, celle de Cave › Aujourd’hui, son sommaire et son saut d’ancre lisent cette mesure', /window\._mvTeteBas\?window\._mvTeteBas\('page-home'\)/.test(S.app) && (S.cav.match(/window\._mvTeteBas\?window\._mvTeteBas\('page-cave'\)/g) || []).length === 2 && /setProperty\('--caj-som-haut',_bas\(\)\+'px'\)/.test(S.cav));
  }
  t('⑦ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-tete4b.mjs'") > 0 && S.liste.indexOf("mv-harnais-tete4b.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['les onglets du Chai retournent dans leur vue', (S) => { const a = S.idx.indexOf('<div class="mvu-tabs mvu-sub" id="mvc-tabs-row"'); const f = finBloc(S.idx, a); const b = S.idx.slice(a, f); const s = S.idx.slice(0, a) + S.idx.slice(f); const k = s.indexOf('<div class="mvc-hdr" id="mvc-header"></div>'); if (a < 0 || k < 0) throw new Error('ancre absente'); return Object.assign({}, S, { idx: s.slice(0, k) + b + s.slice(k) }); }],
    ['le jeu du Millésime n’est plus caché au départ', m('idx', 'id="ml-tabs-row" role="tablist" aria-label="Vues du millésime" style="display:none"', 'id="ml-tabs-row" role="tablist" aria-label="Vues du millésime"')],
    ['le compteur passe avant les sous-onglets', (S) => { const b = '<span class="mod-header-badge" id="cave-hdr-badge">—</span>'; const h = '<div class="mv-ecran-sous" id="cave-ecran-sous">'; if (!S.idx.includes(b) || !S.idx.includes(h)) throw new Error('ancre absente'); return Object.assign({}, S, { idx: S.idx.replace(b, '').replace(h, b + h) }); }],
    ['un bouton du Chai perd son id', m('idx', 'id="mvc-tbtn-diag"', 'id="mvc-tbtn-diagn"')],
    ['deux jeux visibles à la fois', m('cav', "b.style.display=(_CAVE_SOUS[k]===vu)?'':'none';", "b.style.display='';")],
    ['la ligne ne se range plus quand elle porte des sous-onglets', m('cav', "l.classList.toggle('a-sous',!!vu);", "l.classList.toggle('a-sous',false);")],
    ['un jeu resté dans sa vue est caché quand même', m('cav', 'if(b && b.parentNode===h) b.style.display', 'if(b) b.style.display')],
    ['renderCave oublie les sous-onglets', m('cav', "  _caveSousSync();       // TETE-4B", "  // _caveSousSync();       // TETE-4B")],
    ['le jeu du Cuvier reste dans sa vue', m('cav', "if(_hs&&_bs){ _hs.innerHTML=''; _hs.appendChild(_bs); }", 'if(false){ }')],
    ['le bouton du millésime oublie l’année regardée', m('cav', "(String(_caveMillFilter)===String(m)?' selected':'')+'>'+_escHtml(String(m))+'</option>'", "''+'>'+_escHtml(String(m))+'</option>'")],
    ['les années ne sont plus rangées de la plus récente à la plus ancienne', m('cav', 'ms.sort(function(a,b){ return Number(b)-Number(a); });\n  return {act:act, ms:ms};', 'ms.sort(function(a,b){ return Number(a)-Number(b); });\n  return {act:act, ms:ms};')],
    ['un seul millésime, et le bouton s’affiche quand même', m('cav', "var ch=_caveMillChoix(), ms=ch.ms;\n  if(ms.length<2) return '';", "var ch=_caveMillChoix(), ms=ch.ms;\n  if(ms.length<1) return '';")],
    ['les puces reviennent sur la ligne d’écran', m('cav', 'la?(surLigne?_caveMillBoutonHtml()+_caveMillNoteHtml():_caveMillChipsHtml()):', 'la?(false?_caveMillBoutonHtml()+_caveMillNoteHtml():_caveMillChipsHtml()):')],
    ['le compteur reste affiché à côté des sous-onglets', m('css', '.mv-ecran.a-sous > .mv-ecran-g > .mod-header-badge{ display:none; }', '.mv-ecran.a-sous > .mv-ecran-g > .mod-header-badge{ display:inline; }')],
    ['les sous-onglets reprennent 38 px de haut : la ligne déborde', m('css', 'height:var(--h-sm,28px); min-height:0;', 'height:var(--h-sm,28px); min-height:38px;')],
    ['la ligne colle aussi au téléphone', (S) => { const a = '  .mod-header + .mv-ecran{ position:sticky; top:calc(var(--mv-demo-h,0px) + var(--h-tete,111px)); z-index:79; }'; if (!S.css.includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { css: S.css.replace(a, '') + '\n.mod-header + .mv-ecran{ position:sticky; top:calc(var(--mv-demo-h,0px) + var(--h-tete,111px)); z-index:79; }\n' }); }],
    ['la ligne colle à 16 px : elle passe sous l’en-tête', m('css', '.mod-header + .mv-ecran{ position:sticky; top:calc(var(--mv-demo-h,0px) + var(--h-tete,111px));', '.mod-header + .mv-ecran{ position:sticky; top:var(--e-4,16px);')],
    ['la fiche du Chai n’est plus recalée', m('css', '#page-cave #mvc-view-cuv > #chai-fiche,body .dgn-liste,body .caj-som{ top:', 'body .dgn-liste,body .caj-som{ top:')],
    ['une fiche neuve colle à 16 px dans styles.css, sans être recalée', (S) => Object.assign({}, S, { sty: S.sty + '\n@media (min-width:1024px){\n  #page-neuve > #nv-fiche{ position:sticky; top:var(--e-4,16px); }\n}\n' })],
    ['la fiche des Parcelles garde sa hauteur d’avant', m('css', 'body .caj-fx,#page-parcelles #pwrapliste > .content > #p-fiche,\n  #page-tracteur #trac-panel-sessions > #trac-fiche,#page-phyto.ph-reg-on', 'body .caj-fx,\n  #page-tracteur #trac-panel-sessions > #trac-fiche,#page-phyto.ph-reg-on')],
    ['Planning › Personnel : la fiche remonte à côté de la ligne d’écran', m('css', 'body.pl-gens-dock #page-planning > #ovPlanFiche{ grid-row:3 / span 20; }', 'body.pl-gens-dock #page-planning > #ovPlanFiche{ grid-row:2 / span 20; }')],
    ['la mesure oublie la ligne collée', m('uti', "if(ec && window.getComputedStyle && window.getComputedStyle(ec).position==='sticky') h+=ec.offsetHeight;", 'if(false) h+=ec.offsetHeight;')],
    ['la colonne de l’Accueil relit la seule hauteur de l’en-tête', m('app', "h=window._mvTeteBas?window._mvTeteBas('page-home'):(hd?hd.offsetHeight:0);", 'h=hd?hd.offsetHeight:0;')],
    ['le sommaire de Cave › Aujourd’hui relit la seule hauteur de l’en-tête', m('cav', "setProperty('--caj-som-haut',_bas()+'px')", "setProperty('--caj-som-haut',hd.offsetHeight+'px')")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-tete4b.mjs'").join("mv-harnais-tete4Z.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
