// HARNAIS — TOURNEE-1 (§324) : « Tournée définie pour » (Parcelles, « Toutes tâches ») ne propose que les tournées encore utiles ;
//   une tâche finie n'applique plus sa tournée ; une liste vide ne garde plus la barre de la tâche d'avant.
//   node scripts/mv-harnais-tournee1.mjs           → doit être vert
//   node scripts/mv-harnais-tournee1.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (13/10, capture de Parcelles sur « Toutes tâches », campagne « Hiver 2026 - 2027 ») : Dégraffage, terminé, et Vendange, pas sur
// cette campagne, restaient proposés sous « Tournée définie pour ». Reformulé avant le travail, réponse : « go ».
// Exécute l'APPLICATION ENTIÈRE (scripts/mv-app-node.mjs) avec les VRAIS utils.js et app.js — renderParcelles, _pvRenderOrdreBar,
// _pOrdUtile, _pOrdTache et le filtre de la liste :
//   A. le scénario de la capture : l'encart, « Reprendre la tournée du domaine », la tâche affichée (barre, numéros), la liste vide ;
//   B. la puce et la liste : pour chaque tâche de la période qui a une tournée, la puce est proposée si et seulement si la VRAIE liste
//      « À faire » de la tâche n'est pas vide — sur la capture et sur 40 tirages au hasard (graine fixe) ; et les deux règles appellent
//      les mêmes fonctions : une condition ajoutée d'un seul côté rougit ;
//   C. lu : rien n'est effacé, la nouveauté, l'aide, le guide ; aucune erreur avalée.
// Aucune écriture dans le dépôt : les sources (et leurs défauts réinjectés) passent par des copies dans le dossier temporaire.
import fs from 'fs'; import os from 'os'; import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { uti: lire('src/utils.js'), app: lire('src/app.js'), g04: lire('guide/04-vigne.html') };
const FICH = { uti: 'utils.js', app: 'app.js' };
const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts/mv-app-node.mjs')).href);
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');

// ── Le monde : la campagne d'hiver de la capture. Vendange est au catalogue, pas dans la période. ──
const PER = 'Hiver 2026 - 2027';
const TACHES = [{ nom: 'Taille', hha: 50 }, { nom: 'Tirage', hha: 30 }, { nom: 'Réparation', hha: 20 }, { nom: 'Dégraffage', hha: 10 },
  { nom: 'Arrachage', hha: 0, anytime: true }, { nom: 'Pioche', hha: 12, type: 'passages' }, { nom: 'Vendange', hha: 100 }];
const PERT = ['Taille', 'Tirage', 'Réparation', 'Dégraffage', 'Arrachage', 'Pioche'];
const ETAPES = [{ id: 'demontage', lbl: 'Démontage' }, { id: 'souches', lbl: 'Souches', presta: true }, { id: 'ramassage', lbl: 'Ramassage', presta: true }];
const ORD = (o, d) => ({ ordre: o, date: d, par: 'Nico' });
// Six tournées enregistrées dans Décider ; Tirage n'en a pas.
const TOURNEES = () => ({ 'Taille': ORD(['B', 'C', 'A'], '2026-10-12'), 'Réparation': ORD(['A', 'B', 'C'], '2026-10-01'), 'Dégraffage': ORD(['A', 'B', 'C', 'D'], '2026-10-05'),
  'Arrachage': ORD(['A'], '2026-10-02'), 'Pioche': ORD(['C', 'A', 'B'], '2026-10-03'), 'Vendange': ORD(['C', 'B', 'A'], '2026-09-15') });
const AVEC = PERT.filter(t => TOURNEES()[t]);
const P = (nom, extra) => Object.assign({ nom, surface: 0.3, statut: 'Plantée', appellation: 'Bourgogne', commune: 'Gevrey-Chambertin', taches: {} }, extra);
// La capture : la taille reste sur B et C ; le dégraffage est fait partout (D, arrachée, ne compte pas) ; la réparation ne reste que
// là où elle est désactivée ; l'arrachage de A est fini pour l'équipe (souches et ramassage au prestataire) ; le 2e passage de pioche
// reste sur C.
function parcsCapture(c) {
  return [
    P('A', { taches: { 'Taille': 'Validé', 'Dégraffage': 'Validé', 'Pioche': { p1: 'Validé', p2: 'Validé' } }, tachesExclues: ['Réparation'], selCamp: { Arrachage: c }, arrEtapes: { c, f: { demontage: { d: '2026-10-02' } } } }),
    P('B', { taches: { 'Réparation': 'Validé', 'Dégraffage': 'Validé', 'Pioche': { p1: 'Validé', p2: 'Validé' } } }),
    P('C', { taches: { 'Dégraffage': 'Validé', 'Pioche': { p1: 'Validé', p2: 'Non démarré' } }, tachesExclues: ['Réparation'] }),
    P('D', { statut: 'Arrachee', taches: {} }),
  ];
}
// … puis tout fini : la taille sur B et C, le 2e passage de pioche sur C.
function parcsFinies(c) {
  const L = parcsCapture(c);
  L[1].taches['Taille'] = 'Validé'; L[2].taches['Taille'] = 'Validé'; L[2].taches['Pioche'] = { p1: 'Validé', p2: 'Validé' };
  return L;
}
// Un tirage : cinq parcelles, chaque état au hasard (fait, commencé, rien), des tâches désactivées, des arrachées, l'arrachage choisi
// ou non pour la campagne, ses étapes faites ou non, la pioche limitée à un passage sur certaines.
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function tirage(rnd, c) {
  const pick = a => a[Math.floor(rnd() * a.length)];
  const ST = ['Validé', 'Validé', 'En cours', 'Non démarré', ''], PP = ['Validé', 'Validé', 'Commencé', 'Non démarré'];
  return ['A', 'B', 'C', 'D', 'E'].map(nom => {
    const taches = {};
    for (const t of ['Taille', 'Tirage', 'Réparation', 'Dégraffage']) { const s = pick(ST); if (s) taches[t] = s; }
    taches['Pioche'] = { p1: pick(PP), p2: pick(PP) }; if (rnd() < 0.2) taches['Pioche'].ov = 1;
    if (rnd() < 0.15) taches['Arrachage'] = 'Validé';
    const f = {}; for (const e of ETAPES) if (rnd() < 0.5) f[e.id] = { d: '2026-10-02' };
    const extra = { statut: rnd() < 0.15 ? 'Arrachee' : 'Plantée', taches, tachesExclues: ['Taille', 'Réparation', 'Dégraffage', 'Pioche'].filter(() => rnd() < 0.2), arrEtapes: { c, f } };
    if (rnd() < 0.5) extra.selCamp = { Arrachage: c };
    return P(nom, extra);
  });
}

// ★ L'appli se recharge DANS LE MÊME PROCESSUS (une fois par contre-épreuve) : ce qu'un chargement d'avant a posé sur window resterait
//   visible (règle apprise par mv-harnais-dates1).
const LUS = ['setPTacheFilter', 'setPCurStep', 'pOrdreToggle', '_mvOrdreFor', '_mvOrdreTaches', '_mvCampRef', 'applyFbData', 'pShowDone'];
async function monde(S) {
  for (const n of LUS) delete globalThis[n];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-tournee1-')), remplace = {};
  for (const k of Object.keys(FICH)) { const f = path.join(tmp, FICH[k]); fs.writeFileSync(f, S[k]); remplace[FICH[k]] = f; }
  let A;
  try { A = await chargerApp({ remplace }); } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  A.setAuj([2026, 9, 13]);   // mardi 13 octobre 2026, le jour de la capture
  A.poser({ taches: TACHES, saisons: [{ nom: PER, active: true, debut: '2026-10-01', fin: '2027-03-31', taches: PERT }], config: { domaine_nom: 'Test' } });
  const c = A.G._mvCampRef();
  A.poser({ config: { domaine_nom: 'Test', arrachage: { etapes: ETAPES, apres: 'souches' }, ordre_passage_t: TOURNEES() }, parcelles: parcsCapture(c) });
  return Object.assign(A, { c });
}

const txt = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function barre(W) { const e = W.els['p-ordre-bar']; const html = (e && e.innerHTML) || ''; return { html, vis: !!e && e.style.display !== 'none' && html.trim() !== '' }; }
function puces(W) {
  W.G.setPTacheFilter('toutes');
  const b = barre(W);
  if (!b.vis || b.html.indexOf('Tournée définie pour') < 0) return [];
  return [...b.html.matchAll(/onclick="setPTacheFilter\('([^']*)'\)"/g)].map(m => m[1]);
}
// setPTacheFilter remet « À faire » (pShowDone = false) : c'est la liste qu'ouvre la puce.
function listeAFaire(W, T) { W.G.setPTacheFilter(T); const L = (W.els['pList'] && W.els['pList'].innerHTML) || ''; return L.indexOf('empty-state') < 0; }
const OFF = () => 'mavigne_ordre_off_' + (globalThis.localStorage.getItem('mavigne_tenant') || '');
function appels(src) { return [...new Set([...src.matchAll(/\b(_[A-Za-z]\w*)\s*\(/g)].map(m => m[1]))].sort(); }
function blocFiltre(A) {
  const i = A.indexOf('const _dataF=PARCELLES.filter(p=>{'); if (i < 0) throw new Error('filtre de la liste introuvable');
  const j = A.indexOf("if(pTacheFilter!=='toutes'){", i); if (j < 0 || j - i > 1500) throw new Error('bloc « tâche » du filtre introuvable');
  let d = 0, e = A.indexOf('{', j);
  for (; e < A.length; e++) { if (A[e] === '{') d++; else if (A[e] === '}') { d--; if (!d) break; } }
  return A.slice(j, e + 1);
}
function corpsUtile(A) { const i = A.indexOf('function _pOrdUtile(T){'); if (i < 0) throw new Error('_pOrdUtile introuvable'); return A.slice(i, A.indexOf('\n}\n', i) + 3); }

async function suite(S) {
  const out = []; const T = (n, f) => { let c = false; try { c = !!f(); } catch (e) { c = false; n += ' — PLANTE : ' + e.message; } out.push([n, c]); };
  let W;
  try { W = await monde(S); } catch (e) { T('le monde se monte (' + e.message + ')', false); return out; }
  const e0 = W.JOURNAL_ERR.length, LS = globalThis.localStorage;
  const remettre = () => { LS.removeItem(OFF()); W.poser({ config: { domaine_nom: 'Test', arrachage: { etapes: ETAPES, apres: 'souches' }, ordre_passage_t: TOURNEES() }, parcelles: parcsCapture(W.c) }); };
  // ── A. la capture ──
  T('A1 l\u2019encart ne propose que Taille et Pioche, dans l\u2019ordre du catalogue : ni Dégraffage (fait), ni Vendange (autre campagne), ni Réparation (ne reste que désactivée), ni Arrachage (au prestataire)', () =>
    puces(W).join('|') === 'Taille|Pioche');
  T('A2 l\u2019encart garde son libellé, et sa puce ouvre la liste de sa tâche', () => { puces(W); const b = barre(W); return b.vis && b.html.includes('Tournée définie pour :') && b.html.includes("onclick=\"setPTacheFilter('Taille')\""); });
  T('A3 chaque puce mène à une liste qui n\u2019est pas vide', () => { const p = puces(W); return p.length === 2 && p.every(t => listeAFaire(W, t)); });
  T('A4 tout fini : plus d\u2019encart du tout (ni libellé seul, ni puce)', () => {
    W.poser({ parcelles: parcsFinies(W.c) });
    try { const p = puces(W), b = barre(W); return p.length === 0 && !b.vis && b.html === '' && W.els['p-ordre-bar'].style.display === 'none'; } finally { remettre(); } });
  T('A5 « Tri normal » choisi : « Reprendre la tournée du domaine » tant qu\u2019une tournée sert encore…', () => {
    LS.setItem(OFF(), '1');
    try { W.G.setPTacheFilter('toutes'); const b = barre(W); return b.vis && b.html.includes('Reprendre la tournée du domaine'); } finally { remettre(); } });
  T('A6 … et plus rien quand aucune ne sert', () => {
    W.poser({ parcelles: parcsFinies(W.c) }); LS.setItem(OFF(), '1');
    try { W.G.setPTacheFilter('toutes'); const b = barre(W); return !b.vis && !b.html.includes('Reprendre'); } finally { remettre(); } });
  T('A7 la tâche affichée qui reste à faire garde sa barre (« Tournée du domaine · Taille », 2 parcelles, ordre du 12/10) et ses numéros : B 1, C 2', () => {
    W.G.setPTacheFilter('Taille'); const t = txt(barre(W).html), L = W.els['pList'].innerHTML;
    return t.includes('Tournée du domaine · Taille') && t.includes('2 parcelles à faire, dans l\u2019ordre · ordre du 12/10')
      && /pc-ord">1<\/span><span class="mv-t-nom">B</.test(L) && /pc-ord">2<\/span><span class="mv-t-nom">C</.test(L); });
  T('A8 de Taille à Dégraffage (fait partout, liste vide) : la barre de Taille ne reste pas au-dessus de « … terminé »', () => {
    W.G.setPTacheFilter('Taille'); if (!barre(W).vis) return false;
    W.G.setPTacheFilter('Dégraffage'); const b = barre(W);
    return W.els['pList'].innerHTML.includes('empty-state') && !b.vis && !b.html.includes('Taille'); });
  T('A9 Dégraffage sur « Toutes » (les parcelles faites affichées) : ni barre, ni numéros de tournée', () => {
    W.G.setPTacheFilter('Dégraffage'); globalThis.pShowDone = true; W.G.setPCurStep(1);
    try { const L = W.els['pList'].innerHTML, b = barre(W); return L.indexOf('empty-state') < 0 && /mv-t-nom">A</.test(L) && !/pc-ord"/.test(L) && !b.vis; }
    finally { globalThis.pShowDone = false; } });
  T('A10 il reste à faire, mais aucune parcelle de la tournée dans la liste : la barre le dit (plus « tout est fait »)', () => {
    const m = TOURNEES(); m['Taille'] = ORD(['A', 'D'], '2026-10-12');
    W.poser({ config: { domaine_nom: 'Test', arrachage: { etapes: ETAPES, apres: 'souches' }, ordre_passage_t: m } });
    try { W.G.setPTacheFilter('Taille'); const t = txt(barre(W).html); return t.includes('Tournée du domaine · Taille') && t.includes('aucune parcelle de la tournée dans la liste') && !t.includes('tout est fait'); }
    finally { remettre(); } });
  T('A11 la sortie « liste vide » redessine aussi les numéros de la carte et l\u2019anneau (lu : Leaflet ne tourne pas dans Node)', () => {
    const A = sansCom(S.app), i = A.indexOf("const cont=document.getElementById('pList');"), j = A.indexOf('if(!data.length){', i), k = A.indexOf('return;', j);
    if (i < 0 || j < 0 || k < 0 || j - i > 200) throw new Error('sortie « liste vide » introuvable');
    const b = A.slice(j, k); return b.includes('_pvRenderOrdreBar();') && b.includes('_pOrdMapSync();') && b.includes('_pCibleMapSync();'); });
  // ── B. la puce et la liste ──
  const equiv = () => { const ps = puces(W), ko = []; for (const t of AVEC) { const l = listeAFaire(W, t); if (ps.includes(t) !== l) ko.push(t + (l ? ' (liste pleine, pas de puce)' : ' (puce, liste vide)')); } return ko; };
  T('B1 la capture : pour chaque tâche qui a une tournée, puce proposée ⇔ liste « À faire » non vide', () => { const ko = equiv(); if (ko.length) throw new Error(ko.join(', ')); return true; });
  T('B2 40 tirages au hasard (graine fixe) : la même réponse, tâche par tâche — et chaque tâche vue des deux côtés', () => {
    const rnd = mulberry32(20261013), ko = [], vu = {}; AVEC.forEach(t => { vu[t] = { oui: 0, non: 0 }; });
    try {
      for (let k = 0; k < 40; k++) {
        W.poser({ parcelles: tirage(rnd, W.c) });
        const ps = puces(W);
        for (const t of AVEC) { const l = listeAFaire(W, t); if (ps.includes(t) !== l) ko.push(k + ':' + t); vu[t][l ? 'oui' : 'non']++; }
      }
    } finally { remettre(); }
    if (ko.length) throw new Error('écarts ' + ko.slice(0, 6).join(', '));
    const seul = AVEC.filter(t => !vu[t].oui || !vu[t].non);
    if (seul.length) throw new Error('tirage trop pauvre : ' + seul.join(', ') + ' jamais vue des deux côtés');
    return true; });
  T('B3 la puce et la liste appellent les mêmes fonctions (_mvArrHors, _mvExclu, _pvCurDone, _pvAuPresta) : une condition ajoutée d\u2019un seul côté rougit', () => {
    const A = sansCom(S.app), f = appels(blocFiltre(A)), u = appels(corpsUtile(A)).filter(n => n !== '_pOrdUtile');
    if (f.join(',') !== u.join(',')) throw new Error('liste : ' + f.join(',') + ' / puce : ' + u.join(','));
    return ['_mvArrHors', '_mvExclu', '_pvAuPresta', '_pvCurDone'].every(n => f.includes(n)); });
  // ── C. lu ──
  T('C1 rien n\u2019est effacé : les six tournées restent enregistrées, celle des vendanges comprise', () => {
    puces(W); const m = W.G.CONFIG && W.G.CONFIG.ordre_passage_t, v = W.G._mvOrdreFor('Vendange');
    return !!m && Object.keys(m).length === 6 && !!v && v.ordre.join() === 'C,B,A'; });
  T('C2 la nouveauté l\u2019annonce (bloc 8.92)', () => { const U = S.uti, i = U.indexOf("{ v: '8.92', d: '2026-10-13', items: ["), j = U.indexOf("{ v: '8.91'", i), b = U.slice(i, j);
    return i > 0 && j > i && b.includes('La tournée ne propose plus les travaux finis') && b.includes('Reprendre la tournée du domaine') && b.includes('… terminé'); });
  T('C3 l\u2019aide de Parcelles le dit (le numéro, l\u2019encart)', () => S.uti.includes('qu\u2019il reste une parcelle à faire sur ce travail ; les parcelles se rangent alors dans cet ordre.')
    && S.uti.includes('seulement ceux de la campagne en cours où il reste une parcelle à faire.'));
  T('C4 le guide aussi', () => S.g04.includes('tant qu\'il reste une parcelle à faire sur ce travail') && S.g04.includes('<b>Tournée définie'));
  const av = W.JOURNAL_ERR.slice(e0);
  T('C5 aucune erreur avalée en route' + (av.length ? ' (' + String(av[0].msg).slice(0, 120) + ')' : ''), () => av.length === 0);
  return out;
}

let ok = 0, ko = 0;
(await suite(SRC0)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nTOURNEE-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
// Une ancre absente — ou présente deux fois — fait PLANTER le script (rouge) : une contre-épreuve qui ne trouve pas son défaut ne prouve rien.
const sub = (k, a, b) => { const S = Object.assign({}, SRC0), n = S[k].split(a).length - 1; if (n !== 1) throw new Error('contre-épreuve : ancre trouvée ' + n + ' fois : ' + a.slice(0, 70)); S[k] = S[k].replace(a, () => b); return S; };
const CONTRES = [
  ['app.js : l\u2019encart propose toutes les tournées enregistrées (l\u2019écran d\u2019avant)', () => sub('app', '+utiles.map(function(nm){', '+dispo.map(function(nm){')],
  ['app.js : la campagne n\u2019est plus regardée (les vendanges en hiver)', () => sub('app', '  if(!getTachesSaison().some(function(t){ return !!t && t.nom===T; })) return false;\n', '')],
  ['app.js : une parcelle faite compte comme « à faire »', () => sub('app', ' && !_pvCurDone(p,T)', '')],
  ['app.js : une tâche désactivée compte comme « à faire »', () => sub('app', ' && !_mvExclu(p,T)', '')],
  ['app.js : une parcelle arrachée compte pour une autre tâche que l\u2019arrachage', () => sub('app', '!_mvArrHors(p,T) && ', '')],
  ['app.js : l\u2019arrachage au prestataire compte comme « à faire » pour l\u2019équipe', () => sub('app', " && !(T==='Arrachage'&&_pvAuPresta(p,T)); });", '; });')],
  ['app.js : « Reprendre la tournée du domaine » reste quand plus rien ne sert', () => sub('app', "    if(!utiles.length){ el.innerHTML=''; el.style.display='none'; return; }   // TOURNEE-1 : plus rien à reprendre\n", '')],
  ['app.js : un encart vide (« Tournée définie pour : » sans puce)', () => sub('app', "if(pTacheFilter==='toutes'&&utiles.length){", "if(pTacheFilter==='toutes'){")],
  ['app.js : la tâche affichée finie garde sa tournée (barre, numéros)', () => sub('app', "return (_pOrdLire(pTacheFilter) && _pOrdUtile(pTacheFilter)) ? pTacheFilter : '';", "return _pOrdLire(pTacheFilter) ? pTacheFilter : '';")],
  ['app.js : la liste vide ne redessine plus la barre (celle de la tâche d\u2019avant reste)', () => sub('app', '    _pvRenderOrdreBar(); _pOrdMapSync(); _pCibleMapSync();\n', '')],
  ['app.js : la liste vide ne remet plus les numéros de la carte', () => sub('app', '    _pvRenderOrdreBar(); _pOrdMapSync(); _pCibleMapSync();\n', '    _pvRenderOrdreBar(); _pCibleMapSync();\n')],
  ['app.js : la liste vide ne remet plus l\u2019anneau', () => sub('app', '    _pvRenderOrdreBar(); _pOrdMapSync(); _pCibleMapSync();\n', '    _pvRenderOrdreBar(); _pOrdMapSync();\n')],
  ['app.js : une condition ajoutée à la seule liste (les parcelles commencées cachées)', () => sub('app', '      if(_mvArrHors(p,pTacheFilter))return false;', '      if(_mvArrHors(p,pTacheFilter))return false;\n      if(_pvCurStarted(p,pTacheFilter))return false;')],
  ['app.js : une condition ajoutée à la seule puce', () => sub('app', " && !(T==='Arrachage'&&_pvAuPresta(p,T)); });", " && !(T==='Arrachage'&&_pvAuPresta(p,T)) && !_pvCurStarted(p,T); });")],
  ['app.js : « tout est fait sur ce travail » revient alors qu\u2019il reste à faire', () => sub('app', "'aucune parcelle de la tournée dans la liste'", "'tout est fait sur ce travail'")],
];
let mord = 0, muet = 0;
for (const [n, mk] of CONTRES) {
  let rouge = false;
  try { const S = mk(); rouge = (await suite(S)).some(([, c]) => !c); } catch (e) { console.log('  \u2717 contre-épreuve CASSÉE : ' + n + ' — ' + e.message); muet++; continue; }
  if (rouge) { mord++; console.log('  \u2713 contre-épreuve rouge : ' + n); } else { muet++; console.log('  \u2717 contre-épreuve MUETTE : ' + n); }
}
console.log(`\nTOURNEE-1 contre-épreuves : ${mord}/${CONTRES.length} mordent`);
process.exit(muet ? 1 : 0);
