/* ───────────────────────────────────────────────────────
   HARNAIS — OVPANEL-1 (§574) : UNE FENÊTRE PORTE UNE COQUE QUE LA FEUILLE CONNAÎT
   Lancer :          node scripts/mv-harnais-ovpanel1.mjs
   Contre-épreuves : node scripts/mv-harnais-ovpanel1.mjs --contre

   POURQUOI IL EXISTE
   Trois fenêtres avaient été écrites avec une coque « .ov-panel / .ov-hd / .ov-drag / .ov-title / .ov-close » qu'aucune
   feuille n'a jamais stylée : ni fond ni en-tête, le titre posé sur la page, le contenu flottant sur l'écran du dessous,
   la poignée sans effet. Aucun contrôle ne le voyait — une classe sans règle ne lève rien. Le panneau des périodes du
   registre a été repris au §573 ; ici, celui du journal des interventions (reglages.js) prend la feuille commune (.modal),
   et la troisième fenêtre — la fiche d'un produit du catalogue local, que plus rien n'ouvrait depuis la bascule E-Phy —
   est retirée avec sa liste (elle écrivait en plus dans « ocd-title », l'identifiant de la fenêtre de confirmation).
   Ce harnais JOUE _jivChoix (extraite de reglages.js) dans un document de test et garde l'invariant pour les fenêtres
   À VENIR : les cinq classes de l'ancienne coque ne reviennent pas, et toute coque posée à la création d'une fenêtre
   (« className = 'overlay' » puis son premier élément) est une classe que la feuille connaît.
   Jamais déployé (scripts/) → aucun bump.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const MODULES = fs.readdirSync(path.join(RACINE, 'src')).filter((f) => f.endsWith('.js')).sort();
const S0 = { rg: lire('src/reglages.js'), phy: lire('src/phyto.js'), tra: lire('src/tracteur.js'), app: lire('src/app.js'), reg: lire('src/registre.js'), ut: lire('src/utils.js'),
  wn: lire('src/whats-new.js'), html: lire('index.html'), css: lire('src/styles.css') + '\n' + lire('src/charte.css'), pf: lire('scripts/preflight-baseline.json'),
  aj: lire('scripts/mv-harnais-ajour1.mjs'), liste: lire('scripts/mv-harnais-liste.mjs') };
const AUTRES = {}; for (const f of MODULES) if (!['reglages.js', 'phyto.js', 'tracteur.js', 'app.js', 'registre.js', 'utils.js', 'whats-new.js'].includes(f)) AUTRES[f] = lire('src/' + f);
const CLE = { 'reglages.js': 'rg', 'phyto.js': 'phy', 'tracteur.js': 'tra', 'app.js': 'app', 'registre.js': 'reg', 'utils.js': 'ut', 'whats-new.js': 'wn' };
const source = (S, f) => (CLE[f] ? S[CLE[f]] : AUTRES[f]);
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}') { p--; if (!p) break; } } return src.slice(i, k + 1); }
// Le code sans ses commentaires : un harnais qui lit ce qu'on raconte au sujet du code ne teste pas le code (§25).
const nu = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
const VIEILLE = ['ov-panel', 'ov-hd', 'ov-drag', 'ov-title', 'ov-close'];
const dansFeuille = (css, c) => new RegExp('\\.' + c.replace(/[-]/g, '\\-') + '(?![\\w-])').test(css);
const classes = (h) => { const o = new Set(); for (const m of h.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).filter(Boolean).forEach((c) => o.add(c)); return [...o]; };
const divDansBouton = (h) => /<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<div\b/.test(h);
const balance = (h, b) => (h.match(new RegExp('<' + b + '\\b', 'g')) || []).length === (h.match(new RegExp('</' + b + '>', 'g')) || []).length;

// Les périodes du scénario : la clé de la troisième porte une apostrophe (elle doit arriver échappée dans le onclick).
const FEN = [{ k: 'c2026', lbl: 'Campagne 2026-2027 (en cours)', sub: '1er août 2026 → 31 juillet 2027' }, { k: 'c2025', lbl: 'Campagne <2025>', sub: '' }, { k: "p'3", lbl: 'Période de travail', sub: 'du 12/11 au 28/02' }];
const COMPTES = { c2026: { trav: [1, 2], sess: [], trt: [] }, c2025: { trav: [], sess: [1], trt: [] }, "p'3": { trav: [], sess: [], trt: [] } };

function monde(S) {
  const vu = { ouvert: [], icones: [], crees: 0, ajoutes: 0 };
  const dom = {};
  const corps = { innerHTML: '' };
  const ctx = { String, Number, Array, Object, JSON, console, vu,
    _escHtml: null, _escAttr: null,
    _mvIcon: (n) => { vu.icones.push(n); return '<svg></svg>'; },
    _jivData: (f) => { if (!f || !COMPTES[f.k]) throw new Error('_jivData appelée sans sa période'); return COMPTES[f.k]; },
    openOv: (id) => { vu.ouvert.push(id); },
    document: {
      getElementById: (id) => dom[id] || null,
      createElement: () => { vu.crees++; return { id: '', className: '', attrs: {}, _h: '', setAttribute(k, v) { this.attrs[k] = v; },
        set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; },
        querySelector(s) { return (s === '#jiv-body' && /<div id="jiv-body"><\/div>/.test(this._h)) ? corps : null; } }; },
      body: { appendChild: (e) => { vu.ajoutes++; dom[e.id] = e; } } } };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fonction(S.ut, 'function _escHtml(s) {') + '\n' + fonction(S.ut, 'function _escAttr(s) {') + '\n'
    + fonction(S.ut, 'export function _mvInfoBtn(cle) {').replace(/^export /, '') + '\nwindow._mvInfoBtn = _mvInfoBtn;\n'
    + fonction(S.rg, 'function _jivChoix(F){'), ctx);
  return { ctx, vu, dom, corps };
}

function jouer(S) {
  // ── ① la fenêtre du journal des interventions, jouée ──
  const M = monde(S);
  M.ctx._jivChoix(FEN);
  const ov = M.dom.ovJivExport || { attrs: {}, innerHTML: '', className: '' }, H = ov.innerHTML, B = M.corps.innerHTML;
  t('① la fenêtre est créée une fois, posée dans la page, fermée au toucher à côté, puis ouverte',
    M.vu.crees === 1 && M.vu.ajoutes === 1 && ov.className === 'overlay' && ov.attrs.onclick === "closeOv(event,'ovJivExport')" && M.vu.ouvert.join() === 'ovJivExport',
    JSON.stringify([M.vu.crees, M.vu.ajoutes, ov.className, ov.attrs.onclick, M.vu.ouvert]));
  t('① sa coque est la feuille commune : .modal (qui garde le toucher pour elle), sa poignée, son en-tête, son corps',
    H.startsWith('<div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-hd">') && /<div class="modal-body"><div id="jiv-body"><\/div>/.test(H), H.slice(0, 140));
  t('① le titre est dans l’en-tête, la pastille « i » du journal à côté de lui',
    /<div class="modal-hd"><div class="modal-title"[^>]*><span>Journal des interventions<\/span><button type="button" class="mv-i" data-mvi="doc\.journal"[^>]*>[\s\S]*?<\/button><\/div><\/div>/.test(H), H.slice(100, 420));
  t('① « Annuler » est un bouton du corps, qui ferme CETTE fenêtre',
    /<div class="modal-body">[\s\S]*<button type="button" class="mbtn" onclick="closeOv\(null,'ovJivExport'\)"[^>]*>Annuler<\/button><\/div><\/div>$/.test(H), H.slice(-200));
  const cls = classes(H), inconnues = cls.filter((c) => !dansFeuille(S.css, c));
  t('① chaque classe de la coque est connue de la feuille (' + cls.join(', ') + ')', cls.length >= 6 && !inconnues.length, 'sans règle : ' + inconnues.join(', '));
  t('① plus de croix dessinée à la main, aucune des cinq classes de l’ancienne coque', !M.vu.icones.length && !VIEILLE.some((c) => cls.includes(c)), M.vu.icones.join() + ' ' + cls.join());
  t('① la coque est équilibrée, sans <div> dans un <button>', balance(H, 'div') && balance(H, 'button') && balance(H, 'span') && !divDansBouton(H));
  const bts = [...B.matchAll(/<button onclick="window\.exportJournalInterventions\('([^"]*)'\)"/g)].map((m) => m[1]);
  t('① une période par bouton, sa clé échappée dans le geste (l’apostrophe ne ferme rien)', bts.join('|') === "c2026|c2025|p\\'3", bts.join('|'));
  t('① chaque bouton porte SON compte : les trois sources additionnées, au singulier quand il faut',
    />2 interventions<\/span>/.test(B) && />1 intervention<\/span>/.test(B) && />0 intervention<\/span>/.test(B) && (B.match(/intervention/g) || []).length === 3, B.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 260));
  t('① la première période est marquée, le libellé échappé, la question et sa pastille en tête',
    /^<div[^>]*>Sur quelle période \? <button type="button" class="mv-i" data-mvi="doc\.fenetres"/.test(B) && (B.match(/border:1\.5px solid var\(--vert,#3D6B27\)/g) || []).length === 1
    && B.indexOf('var(--vert,#3D6B27);border-radius') < B.indexOf('c2025') && B.includes('Campagne &lt;2025&gt;') && !B.includes('<2025>'), B.slice(0, 200));
  t('① le contenu est équilibré, sans <div> dans un <button>', balance(B, 'div') && balance(B, 'button') && balance(B, 'span') && !divDansBouton(B) && !/undefined|NaN/.test(B));
  M.ctx._jivChoix(FEN.slice(0, 1));
  t('① rouverte, la fenêtre est réutilisée : la coque ne bouge pas, le contenu est réécrit',
    M.vu.crees === 1 && M.vu.ajoutes === 1 && ov.innerHTML === H && M.vu.ouvert.length === 2 && (M.corps.innerHTML.match(/<button onclick=/g) || []).length === 1);
  t('① les deux fiches « i » existent', S.ut.includes("'doc.journal': { t: 'Le journal des interventions'") && S.ut.includes("'doc.fenetres': { t: "));

  // ── ② l'ancienne coque ne revient pas ; toute coque posée à la création d'une fenêtre est connue de la feuille ──
  const fichiers = MODULES.map((f) => [f, nu(source(S, f))]).concat([['index.html', S.html]]);
  const revenues = []; for (const [f, s] of fichiers) for (const c of VIEILLE) if (new RegExp('(?<![\\w-])' + c + '(?![\\w-])').test(s)) revenues.push(f + ' : ' + c);
  t('② aucune des cinq classes de l’ancienne coque dans src/ ni index.html (' + fichiers.length + ' fichiers lus)', fichiers.length >= 30 && !revenues.length, revenues.join(' · '));
  const sites = [], sans = [];
  for (const [f, s] of fichiers) for (const m of s.matchAll(/className\s*=\s*(['"])overlay(?:\s[^'"]*)?\1/g)) {
    const c = /class=\\?["']([^"'\\\s]+)/.exec(s.slice(m.index + m[0].length, m.index + m[0].length + 900));
    if (!c) continue; sites.push(f + ' : ' + c[1]); if (!dansFeuille(S.css, c[1])) sans.push(f + ' : .' + c[1]);
  }
  t('② chaque fenêtre créée dans le code pose une coque que la feuille connaît (' + sites.length + ' sites lus)', sites.length >= 4 && !sans.length, sans.join(' · ') || sites.join(' · '));
  t('② la feuille porte bien la coque commune', ['modal', 'modal-handle', 'modal-hd', 'modal-title', 'modal-body', 'mbtn', 'mv-i'].every((c) => dansFeuille(S.css, c)));
  t('② tirer la poignée ferme la fenêtre : la coque commune est écoutée, plus l’ancienne',
    /var HANDLE_SEL = '[^']*\.modal-handle[^']*';/.test(S.app) && /return target\.closest\('\.modal, [^']*'\);/.test(S.app) && !/HANDLE_SEL = '[^']*ov-/.test(S.app));

  // ── ③ la fiche du catalogue local, que plus rien n'ouvrait, et sa liste ──
  const morts = []; for (const [f, s] of fichiers) for (const n of ['openCatDetail', 'renderCatalogueTrac', 'ovCatDetail', 'catalogue-list-trac']) if (s.includes(n)) morts.push(f + ' : ' + n);
  t('③ la fiche morte, sa liste et leur conteneur absent ne sont plus nommés nulle part', !morts.length, morts.join(' · '));
  const ocd = []; for (const [f, s] of fichiers) if (f !== 'app.js' && f !== 'index.html' && /['"]ocd-title['"]/.test(s)) ocd.push(f);
  t('③ « ocd-title » n’appartient qu’à la fenêtre de confirmation : un seul élément, écrit par app.js seul',
    (S.html.match(/id="ocd-title"/g) || []).length === 1 && S.app.includes("document.getElementById('ocd-title').textContent=title||") && !ocd.length, ocd.join());
  { // l'onglet Catalogue, joué : il ouvre toujours le référentiel E-Phy, sans passer par la liste retirée
    const v = { chips: 0, rendu: 0, vue: { style: { display: 'x' } } };
    const c = { document: { getElementById: (id) => (id === 'cat-ephy-view' ? v.vue : null) }, _ephyBuildChips: () => { v.chips++; c._ephyChipsBuilt = true; }, ephyRender: () => { v.rendu++; }, _ephyChipsBuilt: false, _catSub: '' };
    vm.createContext(c); let leve = null;
    try { vm.runInContext(fonction(S.tra, 'function catSub(which){') + "\ncatSub('ephy'); catSub('ephy');", c); } catch (e) { leve = e.message; }
    t('③ l’onglet Catalogue montre toujours le référentiel E-Phy', !leve && v.chips === 1 && v.rendu === 2 && v.vue.style.display === '' && c._catSub === 'ephy', leve || JSON.stringify(v));
  }
  t('③ la référence du preflight ne réclame plus le conteneur absent', !S.pf.includes('catalogue-list-trac'));

  // ── ④ trouvé en route : la ligne de la fenêtre « avant l'export » (§573) ──
  const G = fonction(S.reg, 'function _regGroupeHtml(g) {');
  t('④ registre.js : la ligne à reprendre est un bouton sans <div> dedans (trois lignes de texte en <span>)',
    !/<div\b/.test(G) && (G.match(/<span style="display:block;/g) || []).length === 3 && (G.match(/<\/span>'/g) || []).length === 3 && G.includes('data-reg="ligne"'));

  // ── ⑤ les fils ──
  t('⑤ la fenêtre reste classée (lecture)', /ovJivExport: \['LECTURE'/.test(S.aj) && !/ovCatDetail/.test(S.aj));
  t('⑤ l’annonce le dit', /v: '11\.04'[\s\S]{0,300}Le journal des interventions\\u00a0: le choix de la période s’affiche correctement/.test(S.wn));
  t('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-ovpanel1.mjs'") > 0 && S.liste.indexOf("mv-harnais-ovpanel1.mjs --contre'") > 0);
}

if (!CONTRE) {
  console.log('\n\x1b[1mMA VIGNE — Harnais OVPANEL-1 · scénarios\x1b[0m');
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n\x1b[1mMA VIGNE — Harnais OVPANEL-1 · contre-épreuves\x1b[0m');
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (S[cle].split(a).length !== 2) throw new Error('ancre absente ou multiple : ' + a.slice(0, 50)); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  // dans _jivChoix seulement : la coque commune s'écrit de la même façon dans d'autres fenêtres de reglages.js
  const j = (a, b) => (S) => { const f = fonction(S.rg, 'function _jivChoix(F){'); if (f.split(a).length !== 2) throw new Error('ancre absente ou multiple : ' + a.slice(0, 50)); return Object.assign({}, S, { rg: S.rg.replace(f, f.replace(a, b)) }); };
  const plus = (cle, txt) => (S) => Object.assign({}, S, { [cle]: S[cle] + txt });
  const mutants = [
    ['la coque sans style revient', j('<div class="modal" onclick="event.stopPropagation()">', '<div class="ov-panel" onclick="event.stopPropagation()">')],
    ['un toucher dans la fenêtre la ferme', j('<div class="modal" onclick="event.stopPropagation()">', '<div class="modal">')],
    ['la poignée disparaît', j('<div class="modal-handle"></div>', '')],
    ['la pastille « i » du journal disparaît', j("window._mvInfoBtn('doc.journal')", "''")],
    ['le titre sort de l’en-tête', j('<div class="modal-hd"><div class="modal-title"', '<div class="modal-hd"></div><div class="modal-title"')],
    ['les périodes sortent du corps', j('<div class="modal-body"><div id="jiv-body"></div>', '<div id="jiv-body"></div><div class="modal-body">')],
    ['« Annuler » ferme une autre fenêtre', j("closeOv(null,\\'ovJivExport\\')\" style=\"width:100%;margin-top:8px", "closeOv(null,\\'ovAutre\\')\" style=\"width:100%;margin-top:8px")],
    ['la clé d’une période n’est plus échappée', j("\\''+_escAttr(f.k)+'\\'", "\\''+f.k+'\\'")],
    ['le compte oublie deux sources', j('n=D.trav.length+D.sess.length+D.trt.length;', 'n=D.trav.length;')],
    ['le libellé d’une période n’est plus échappé', j("color:var(--texte)\">'+_escHtml(f.lbl)+'", "color:var(--texte)\">'+f.lbl+'")],
    ['un <div> dans le bouton d’une période', j("+'<span style=\"display:block;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte)\">'+_escHtml(f.lbl)+'</span>'", "+'<div style=\"font-size:var(--pt-base,14px);font-weight:600;color:var(--texte)\">'+_escHtml(f.lbl)+'</div>'")],
    ['le bouton « Annuler » prend une classe que la feuille ne connaît pas', j('<button type="button" class="mbtn" onclick="closeOv', '<button type="button" class="mbtn bouton-inconnu" onclick="closeOv')],
    ['une fenêtre neuve pose une coque inconnue', plus('phy', "\nfunction _xOuvrir(){ var ov=document.createElement('div'); ov.className='overlay'; ov.innerHTML='<div class=\"feuille-inconnue\"><div class=\"modal-hd\"></div></div>'; }\n")],
    ['l’ancienne poignée est de nouveau écoutée', m('app', "var HANDLE_SEL = '.modal-handle, ", "var HANDLE_SEL = '.modal-handle, .ov-drag, ")],
    ['la poignée commune n’est plus écoutée', m('app', "var HANDLE_SEL = '.modal-handle, ", "var HANDLE_SEL = '")],
    ['la fiche morte revient', plus('phy', "\nfunction openCatDetail(nom){ return nom; }\n")],
    ['la liste morte revient dans l’onglet Catalogue', m('tra', "  if(ev) ev.style.display = (which==='ephy'?'':'none');\n", "  if(ev) ev.style.display = (which==='ephy'?'':'none');\n  if(which==='mine'){ renderCatalogueTrac(); return; }\n")],
    ['l’onglet Catalogue ne dessine plus le référentiel', m('tra', "  if(!_ephyChipsBuilt) _ephyBuildChips();\n  ephyRender();\n}", "  if(!_ephyChipsBuilt) _ephyBuildChips();\n}")],
    ['un module écrit dans le titre de la fenêtre de confirmation', plus('phy', "\nfunction _xTitre(){ document.getElementById('ocd-title').textContent='x'; }\n")],
    ['la référence du preflight réclame de nouveau le conteneur', plus('pf', '\n"catalogue-list-trac"\n')],
    ['un <div> revient dans la ligne à reprendre', m('reg', "+ '<span style=\"display:block;font-size:var(--pt-txt,13px);font-weight:600\">'", "+ '<div style=\"font-size:var(--pt-txt,13px);font-weight:600\">'")],
    ['l’annonce est retirée', m('wn', 'Le journal des interventions\\u00a0: le choix de la période s’affiche correctement', 'Le journal des interventions')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-ovpanel1.mjs'").join("mv-harnais-ovpanelZ.mjs'") })]];
  let rougit = 0;
  for (const [nom, f] of mutants) {
    let S; try { S = f(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté : ' + nom + ' (' + e.message + ')'); continue; }
    const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S); } catch (e) { ko++; } console.log = log;
    if (ko) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + ko + ')\x1b[0m'); } else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
  }
  console.log('\n  ' + rougit + '/' + mutants.length + ' contre-épreuves rougissent\n');
  process.exit(rougit === mutants.length ? 0 : 1);
}
