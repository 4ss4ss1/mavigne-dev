// ═════════════════════════════════════════════════════════════════════════════
//  HARNAIS PRATIQUES-1 (§622) — LES PRATIQUES DE CAVE DU DOMAINE
// ═════════════════════════════════════════════════════════════════════════════
//  Nico, 27/11 : « peut-être que chez moi les blancs rentrent d'une certaine façon, et dans un autre
//  domaine d'une autre » ; puis, sur la maquette : « rajouter une sécurité quand 2 pratiques ou
//  plusieurs ne sont pas compatibles ».
//
//  Sur les VRAIES fonctions extraites de src/cuvier-pratiques.js (jouées dans Node) et sur les vrais
//  fichiers pour le branchement.
//
//  CE QUE CE HARNAIS PROUVE
//   A. les sécurités du réglage, JOUÉES : malo bloquée + bâtonnage « à vérifier », confirmé puis
//      oublié si la situation change ; une saignée sans rouge « impossible » ; un rosé de saignée
//      contre un rouge « pas de saignée » « à mettre d'accord » ; la turbidité cachée sans débourbage ;
//   B. le parcours prévu de chaque couleur suit les réponses ;
//   C. la couleur d'une cuve, JOUÉE : proposée d'après les parcelles, refusée (rouge ou rosé sur du
//      blanc), à confirmer (blanc de noirs, mélange) ; le chapeau d'un blanc, d'un rosé, d'un blanc
//      de macération ; les gestes d'extraction proposés ;
//   D. le branchement dans cuvier.js : la couleur vérifiée AVANT toute écriture de la cuve, et
//      portée par l'objet rebâti ; le réglage vérifié AVANT d'écrire ; la mesure, la tournée, la
//      fiche, le bandeau, la ligne des réglages ; la frontière ;
//   E. la fenêtre dans index.html, les étiquettes des tutos ;
//   F. l'aide, le guide, « Quoi de neuf », les deux tutos.
//
//  Usage :  node scripts/mv-harnais-pratiques1.mjs
//           node scripts/mv-harnais-pratiques1.mjs --contre
// ═════════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = {
  pr: lire('src/cuvier-pratiques.js'), cu: lire('src/cuvier.js'), idx: lire('index.html'), utils: lire('src/utils.js'),
  wn: lire('src/whats-new.js'), g08: lire('guide/08-cave.html'), tu: lire('src/tutos.js'), css: lire('src/styles.css')
};

/* ══ EXTRACTION — accolades comptées hors chaînes et hors commentaires ══ */
function bornes(src, nom) {
  const re = new RegExp('^(?:export )?(?:async )?function ' + nom + '\\s*\\(', 'gm');
  const m = [...src.matchAll(re)];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return [m[0].index, j + 1];
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
const avant = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) >= 0 && t.indexOf(a) < t.indexOf(b);

const PRELUDE = `
var window = { currentUser: { nom: 'Nico' } };
var CAVE_VENDANGE = { config: {} };
var COUL = {};
function _parcCoul(n){ return COUL[n] || '?'; }
function _mlAuj(){ return '2026-11-27'; }
var _vcuvCoulOk = null;
function __pose(o){ COUL = o.coul || {}; CAVE_VENDANGE.config = o.config || {}; _vcuvCoulOk = (o.ok === undefined) ? null : o.ok; }
`;
const NOMS = ['_pratHas', '_pratCachee', '_pratAlertes', '_pratOuvertes', '_pratParcours', '_pratCfg', '_pratGeste',
  '_vendParcCouls', '_vendCoulAuto', '_vendCuveCoul', '_vendChapeau', '_vcuvCoulCheck', '_vcuvCoulPret'];
function charger(S) {
  const nomVar = (/^var _PRAT_NOM = \{[^\n]*\};$/m.exec(S.pr) || [''])[0];
  if (!nomVar) throw new Error('_PRAT_NOM introuvable');
  const code = PRELUDE + nomVar + '\n' + NOMS.map(n => fn(S.pr, n)).join('\n') + '\n;({ ' + NOMS.join(', ') + ', __pose })';
  return vm.runInNewContext(code, {});
}
// Un réglage de départ, complet, sans alerte.
const P0 = () => ({ actif: { r: true, b: true, o: false },
  r: { egr: ['egr'], mpf: ['non'], ext: ['pig', 'rem'], sai: ['non'], pre: ['apres'], ml: ['fut'] },
  b: { arr: ['direct'], deb: ['stat'], ntu: ['oui'], fa: ['fut'], ml: ['fait'], lies: ['lies'] },
  o: { met: ['direct'], deb: ['stat'], ml: ['bloq'] }, conf: {} });
const ids = (l) => l.map(a => a.id + ':' + a.niv).join(',');
const etapes = (l) => l.map(x => x[0]).join(' > ');

const T = {
  // A — les sécurités du réglage
  A1: ['un réglage ordinaire : aucune alerte', (A) => A._pratAlertes(P0()).length === 0],
  A2: ['malo bloquée + bâtonnage : « à vérifier », sous la question de l’élevage', (A) => {
    const P = P0(); P.b.ml = ['fait', 'bloq']; P.b.lies = ['bat'];
    const l = A._pratAlertes(P); return ids(l) === 'lies:w' && l[0].c === 'b' && l[0].q === 'lies' && A._pratOuvertes(P).length === 1; }],
  A3: ['confirmé, il ne bloque plus l’enregistrement', (A) => {
    const P = P0(); P.b.ml = ['bloq']; P.b.lies = ['bat']; P.conf = { lies: { par: 'Nico', le: '2026-11-27' } };
    return A._pratAlertes(P).length === 1 && A._pratOuvertes(P).length === 0; }],
  A4: ['une saignée sans rouge : « impossible »', (A) => {
    const P = P0(); P.actif = { r: false, b: true, o: true }; P.o.met = ['sai'];
    return ids(A._pratAlertes(P)) === 'sai-r:b'; }],
  A5: ['rosé de saignée, rouge « pas de saignée » : « à mettre d’accord » ; « parfois » au rouge l’éteint', (A) => {
    const P = P0(); P.actif.o = true; P.o.met = ['sai']; const a = ids(A._pratAlertes(P));
    P.r.sai = ['oui']; return a === 'sai-fix:fix' && A._pratAlertes(P).length === 0; }],
  A6: ['un « impossible » ou un « à mettre d’accord » ne se confirme pas', (A) => {
    const P = P0(); P.actif.o = true; P.o.met = ['sai']; P.conf = { 'sai-fix': { par: 'x', le: 'y' } };
    return A._pratOuvertes(P).length === 1; }],
  A7: ['la turbidité se cache sans débourbage, et seulement au blanc', (A) => {
    const P = P0(); const v = A._pratCachee(P, 'b', 'ntu'); P.b.deb = ['non'];
    return !v && A._pratCachee(P, 'b', 'ntu') && !A._pratCachee(P, 'o', 'ntu') && !A._pratCachee(P, 'b', 'fa'); }],
  A8: ['une confirmation tombe quand la situation confirmée disparaît (_pratAlertesSuivre)', (A, S) => {
    const f = fn(S.pr, '_pratAlertesSuivre'), s = fn(S.pr, '_pratSet');
    return f.includes('delete P.conf[id]') && s.includes('_pratAlertesSuivre(P)') && fn(S.pr, '_pratActif').includes('_pratAlertesSuivre(P)'); }],
  // B — le parcours prévu
  B1: ['blanc : pressurage, débourbage, entonnage, fermentation, malo, élevage, Au Chai', (A) =>
    etapes(A._pratParcours(P0(), 'b')) === 'Pressurage > Débourbage > Entonnage > Fermentation > Malo > Élevage sur lies > Au Chai'],
  B2: ['blanc sans débourbage : l’étape part, l’entonnage se fait au sortir du pressoir', (A) => {
    const P = P0(); P.b.deb = ['non']; const l = A._pratParcours(P, 'b');
    return !l.some(x => x[0] === 'Débourbage') && l.some(x => x[0] === 'Entonnage' && x[1] === 'au sortir du pressoir'); }],
  B3: ['blanc en fût et en cuve : la fermentation se choisit par cuve, pas d’entonnage imposé', (A) => {
    const P = P0(); P.b.fa = ['fut', 'cuve']; const l = A._pratParcours(P, 'b'), f = l.find(x => x[0] === 'Fermentation');
    return /au choix par cuve/.test(f[1]) && !l.some(x => x[0] === 'Entonnage'); }],
  B4: ['blanc en macération pelliculaire : égrappage et macération avant la presse', (A) => {
    const P = P0(); P.b.arr = ['pel']; return etapes(A._pratParcours(P, 'b')).startsWith('Égrappage > Macération pelliculaire > Pressurage'); }],
  B5: ['rouge : la macération à froid et la saignée n’apparaissent que réglées ; l’extraction dit ses gestes', (A) => {
    const P = P0(); const a = A._pratParcours(P, 'r'); P.r.mpf = ['oui']; P.r.sai = ['oui']; P.r.ext = ['pig']; const b = A._pratParcours(P, 'r');
    return !a.some(x => x[0] === 'Macération à froid') && b.some(x => x[0] === 'Macération à froid') && b.some(x => x[0] === 'Saignée')
      && b.find(x => x[0] === 'Fermentation')[1] === 'pigeages'; }],
  B6: ['rosé de saignée : il commence par la saignée ; toute couleur finit « Au Chai »', (A) => {
    const P = P0(); P.o.met = ['sai']; const o = A._pratParcours(P, 'o');
    return o[0][0] === 'Saignée' && ['r', 'b', 'o'].every(c => { const l = A._pratParcours(P, c); return l[l.length - 1][0] === 'Au Chai'; }); }],
  // C — la couleur d'une cuve, le chapeau
  C1: ['la couleur se propose d’après les parcelles (un mélange se propose rouge)', (A) => {
    A.__pose({ coul: { Perr: 'b', Clos: 'r' } });
    return A._vendCoulAuto(['Perr']) === 'b' && A._vendCoulAuto(['Clos']) === 'r' && A._vendCoulAuto(['Clos', 'Perr']) === 'r' && A._vendCoulAuto(['Inconnue']) === '?'; }],
  C2: ['rouge ou rosé sur des parcelles de cépage blanc : « impossible »', (A) => {
    A.__pose({ coul: { Perr: 'b' } });
    const r = A._vcuvCoulCheck(['Perr'], 'r'), o = A._vcuvCoulCheck(['Perr'], 'o');
    return r && r.niv === 'b' && o && o.niv === 'b' && A._vcuvCoulCheck(['Perr'], 'b') === null; }],
  C3: ['blanc de raisins noirs, et raisins rouges et blancs mêlés : « à vérifier »', (A) => {
    A.__pose({ coul: { Perr: 'b', Clos: 'r' } });
    const n = A._vcuvCoulCheck(['Clos'], 'b'), m = A._vcuvCoulCheck(['Clos', 'Perr'], 'r');
    return n && n.id === 'bdn' && n.niv === 'w' && m && m.id === 'mix' && m.niv === 'w' && A._vcuvCoulCheck(['Clos'], 'r') === null; }],
  C4: ['le contrôle d’avant l’écriture : refus net, confirmation demandée, puis acceptée (posée ici ou déjà sur la cuve)', (A) => {
    A.__pose({ coul: { Perr: 'b', Clos: 'r' } });
    const ko = A._vcuvCoulPret(['Perr'], 'r', null), dem = A._vcuvCoulPret(['Clos'], 'b', null);
    A.__pose({ coul: { Perr: 'b', Clos: 'r' }, ok: 'bdn' }); const ok1 = A._vcuvCoulPret(['Clos'], 'b', null);
    A.__pose({ coul: { Perr: 'b', Clos: 'r' } }); const ok2 = A._vcuvCoulPret(['Clos'], 'b', { couleur_conf: { k: 'bdn' } });
    return /raisins blancs/.test(ko || '') && /confirmez/.test(dem || '') && ok1 === null && ok2 === null; }],
  C5: ['la couleur dite à la création prime sur les parcelles', (A) => {
    A.__pose({ coul: { Clos: 'r' } });
    return A._vendCuveCoul({ couleur: 'o', parcelles: ['Clos'] }) === 'o' && A._vendCuveCoul({ parcelles: ['Clos'] }) === 'r'; }],
  C6: ['le chapeau : un rouge oui ; un blanc, un rosé non ; un blanc de macération confirmé oui', (A) => {
    A.__pose({ coul: { Perr: 'b', Clos: 'r' } });
    return A._vendChapeau({ parcelles: ['Clos'] }) && !A._vendChapeau({ parcelles: ['Perr'] }) && !A._vendChapeau({ couleur: 'o', parcelles: ['Clos'] })
      && A._vendChapeau({ parcelles: ['Perr'], macere: { par: 'Nico' } }); }],
  C7: ['les gestes d’extraction : tous sans réglage (comme avant), ceux du domaine ensuite', (A) => {
    A.__pose({ config: {} }); const sans = A._pratGeste('pig') && A._pratGeste('rem');
    const P = P0(); P.r.ext = ['rem']; A.__pose({ config: { pratiques: P } });
    return sans && !A._pratGeste('pig') && A._pratGeste('rem'); }],
  // D — le branchement
  D1: ['saveVendCuve vérifie la couleur AVANT d’écrire la cuve', (A, S) => {
    const f = fn(S.cu, 'saveVendCuve');
    return avant(f, '_vcuvCoulPret(parcelles,_coul,existing)', 'CAVE_VENDANGE.cuves_vinif.push(obj)') && f.includes("if(_coulKo){ showToast(_coulKo,'#B85A1A'); _vcuvCoulRendre(); return; }"); }],
  D2: ['l’objet rebâti porte la couleur, sa confirmation et le blanc de macération', (A, S) => {
    const f = fn(S.cu, 'saveVendCuve');
    return f.includes('couleur:_coul||undefined') && f.includes('couleur_conf:_vcuvCoulConf(parcelles,_coul,existing)') && f.includes('macere:existing?(existing.macere||undefined):undefined'); }],
  D3: ['la mesure : pas de chapeau sur un blanc ou un rosé, les gestes du domaine seulement', (A, S) => {
    const f = fn(S.cu, 'openOvVendMesure');
    return f.includes('&& _vendChapeau(c)') && f.includes("_chap&&_rg&&_pratGeste('rem')?2:0") && f.includes("_chap&&_rg&&_pratGeste('pig')?1:0") && f.includes('_vmMacInject(c,'); }],
  D4: ['le blanc de macération se note à l’enregistrement du relevé', (A, S) => fn(S.cu, 'saveVendMesure').includes('if(_vmMacPris()&&!cu.macere) cu.macere=')],
  D5: ['la tournée ne montre P et R que là où ils ont un sens', (A, S) => S.cu.includes("+(_vtMontre(c,'p')?_vtCntHtml(c.id,'p','P'):'')+(_vtMontre(c,'r')?_vtCntHtml(c.id,'r','R'):'')")],
  D6: ['la fiche : la couleur de la cuve (rosé compris) et son parcours prévu', (A, S) => {
    const f = fn(S.cu, '_vendFicheHtml'); return f.includes('var coul=_vendCuveCoul(c);') && f.includes("coul==='o'") && f.includes('_vendParcoursHtml(c)'); }],
  D7: ['le bandeau de la première ouverture et la ligne des réglages', (A, S) =>
    fn(S.cu, 'renderVendCuves').includes('h+=_pratBandeauHtml();') && fn(S.cu, 'renderVendParam').includes("_vendRegGroupe('Vos pratiques de cave'")],
  D8: ['savePratiques vérifie AVANT d’écrire, et réservé à l’administrateur', (A, S) => {
    const f = fn(S.pr, 'savePratiques');
    return avant(f, 'if(ouv.length){', 'CAVE_VENDANGE.config.pratiques=o') && f.includes('_pratAdm()') && fn(S.pr, '_pratSet').includes('_pratAdm()'); }],
  D9: ['la frontière : ce que les pratiques lisent du Cuvier est sur window', (A, S) =>
    ['_vendRegLigne', '_vtB', '_matVin', '_matPlur', '_vendGarde', '_vendPressee', 'renderVendCuves'].every(n => new RegExp('^window\\.' + n + ' = ' + n + ';', 'm').test(S.cu))
    && /import \{[^}]*_vendChapeau[^}]*\} from '\.\/cuvier-pratiques\.js';/.test(S.cu)],
  D10: ['les gestes de la fenêtre sont exposés', (A, S) =>
    ['openPratiques', '_pratCoul', '_pratSet', '_pratActif', '_pratConf', '_pratFix', 'savePratiques', '_pratPlusTard', '_vcuvCoulSet', '_vcuvCoulOkSet', '_vmMacOuvrir', '_vmMacConfirmer']
      .every(n => new RegExp('^window\\.' + n + '\\s*=\\s*' + n + ';', 'm').test(S.pr))],
  // E — la fenêtre, les étiquettes
  E1: ['index.html porte la fenêtre #ovPratiques et son corps', (A, S) => S.idx.includes('<div class="overlay" id="ovPratiques" onclick="closeOv(event,\'ovPratiques\')">') && S.idx.includes('<div id="prat-corps"></div>')],
  E2: ['les étiquettes des tutos sont écrites en toutes lettres', (A, S) =>
    ['prat.o', 'prat.b', 'prat.o.met.direct', 'prat.b.ml.bloq', 'prat.b.lies.bat', 'vcuv.coul.r', 'vcuv.coul.b'].every(e => S.pr.includes("'data-tuto=\"" + e + "\"'"))
    && ['prat.band', 'prat.ok', 'prat.conf'].every(e => S.pr.includes('data-tuto="' + e + '"'))
    && ['vcuv.nom', 'vcuv.parc', 'vcuv.ok'].every(e => S.idx.includes('data-tuto="' + e + '"'))],
  E3: ['la feuille de style : la fenêtre défile, le « choisi » est celui de la charte', (A, S) =>
    S.css.includes('#prat-corps{flex:1;min-height:0;overflow-y:auto;') && S.css.includes('.prat-o.on{border-color:var(--accent-texte);background:var(--accent-doux);color:var(--accent-texte)')],
  // F — l'accompagnement
  F1: ['l’aide de la Cave le dit', (A, S) => S.utils.includes("['Vos pratiques de cave',") && S.utils.includes("['La couleur d’une cuve',")],
  F2: ['le guide le dit, avec les sécurités', (A, S) => S.g08.includes('<b>Vos pratiques de cave</b>') && S.g08.includes('<b>Les sécurités</b>')],
  F3: ['« Quoi de neuf » l’annonce (bloc 11.43)', (A, S) => {
    const i = S.wn.indexOf("{ v: '11.43'"); const b = i < 0 ? '' : S.wn.slice(i, S.wn.indexOf('] },', i));
    return b.includes('PRATIQUES-1') && b.includes("titre: 'Vos pratiques de cave'") && b.includes('La couleur d’une cuve'); }],
  F4: ['les deux tutos : régler ses pratiques (la sécurité confirmée), créer une cuve de blanc (le refus essayé)', (A, S) => {
    const t1 = S.tu.indexOf("{ id: 'pratiques'"), t2 = S.tu.indexOf("{ id: 'cuve-blanc'");
    const b1 = t1 < 0 ? '' : S.tu.slice(t1, S.tu.indexOf("\n  { id: '", t1 + 10)), b2 = t2 < 0 ? '' : S.tu.slice(t2, S.tu.indexOf("\n  // ★ PHENO-1C", t2));
    return ['openPratiques', '_pratCoul', '_pratActif', '_pratSet', '_pratConf', 'savePratiques'].every(n => b1.includes("'" + n + "'")) && b1.includes('[data-tuto="prat.conf"]')
      && ['openOvVendCuve', '_vcuvCoulSet', 'saveVendCuve'].every(n => b2.includes("'" + n + "'")) && b2.includes('if (ok) memo.rougeVu = true;')
      && b2.includes('return !!memo.rougeVu && !!(b && b.classList.contains(\'on\'))'); }]
};

/* ══ EXÉCUTION ══ */
function jouer(S) {
  let A = null, err = null;
  try { A = charger(S); } catch (e) { err = e; }
  const res = {};
  for (const [k, [, f]] of Object.entries(T)) {
    try { res[k] = !!f(A, S); } catch (e) { res[k] = false; }
  }
  return { res, err };
}

/* ══ CONTRE-ÉPREUVES — chaque ancre UNIQUE dans le fichier visé, injection en mémoire ══ */
const CASSES = [
  ['pr', "if(P.actif.b && _pratHas(P,'b','ml','bloq') && _pratHas(P,'b','lies','bat'))", "if(false)", 'A2', 'la sécurité « malo bloquée + bâtonnage » oubliée'],
  ['pr', "  return _pratAlertes(P).filter(function(a){ return !(a.niv==='w'&&conf[a.id]); });", "  return _pratAlertes(P).filter(function(a){ return !conf[a.id]; });", 'A6', 'un « à mettre d’accord » qui se confirme'],
  ['pr', "function _pratCachee(P, c, k){ return c==='b' && k==='ntu' && _pratHas(P,'b','deb','non'); }", "function _pratCachee(P, c, k){ return false; }", 'A7', 'la turbidité demandée sans débourbage'],
  ['pr', "  if(n.b&&!n.r&&k!=='b') return {id:'blanc-'+k, niv:'b',", "  if(n.b&&!n.r&&k!=='b') return {id:'blanc-'+k, niv:'w',", 'C2', 'un rouge sur du blanc seulement « à vérifier »'],
  ['pr', "  if(k==='b'||k==='o') return !!(c&&c.macere);", "  if(k==='b') return !!(c&&c.macere);", 'C6', 'un rosé avec un chapeau'],
  ['pr', "  return !P || _pratHas(P,'r','ext',g);", "  return true;", 'C7', 'tous les gestes proposés malgré le réglage'],
  ['cu', "  var _coul=_vcuvCoulChoisie(parcelles), _coulKo=_vcuvCoulPret(parcelles,_coul,existing);\n  if(_coulKo){ showToast(_coulKo,'#B85A1A'); _vcuvCoulRendre(); return; }\n", "", 'D1', 'la couleur plus vérifiée avant l’écriture'],
  ['cu', "    couleur:_coul||undefined, couleur_conf:_vcuvCoulConf(parcelles,_coul,existing),\n", "", 'D2', 'la couleur perdue par l’objet rebâti'],
  ['cu', "!(c&&(_vendPressee(c)||_vendDecuvee(c))) && _vendChapeau(c),", "!(c&&(_vendPressee(c)||_vendDecuvee(c))),", 'D3', 'le chapeau revenu sur un blanc'],
  ['cu', "+(_vtMontre(c,'p')?_vtCntHtml(c.id,'p','P'):'')+(_vtMontre(c,'r')?_vtCntHtml(c.id,'r','R'):'')", "+_vtCntHtml(c.id,'p','P')+_vtCntHtml(c.id,'r','R')", 'D5', 'P et R partout dans la tournée'],
  ['pr', "  if(ouv.length){ _pratEt.coul=ouv[0].c; _pratRendre(); showToast(ouv[0].t+' : à régler avant d’enregistrer','#B85A1A'); return; }\n", "", 'D8', 'le réglage écrit malgré un point ouvert'],
  ['cu', "window._vtB = _vtB;\n", "", 'D9', 'un nom de la frontière retiré'],
  ['idx', '<div id="prat-corps"></div>', '', 'E1', 'le corps de la fenêtre oublié'],
  ['pr', "'prat.b.ml.bloq':'data-tuto=\"prat.b.ml.bloq\"', ", "", 'E2', 'une étiquette de tuto composée (invisible au harnais des tutos)'],
  ['tu', "        fait: function (memo) { var b = _q('[data-tuto=\"vcuv.coul.b\"]'); return !!memo.rougeVu && ", "        fait: function (memo) { var b = _q('[data-tuto=\"vcuv.coul.b\"]'); return ", 'F4', 'le blanc vu fait avant le refus essayé (saut d’étape)']
];

const sain = jouer(SAIN);
let rouge = 0;
if (sain.err) { console.log('  \x1b[31m✗\x1b[0m chargement : ' + sain.err.message); rouge++; }
for (const [k, [lbl]] of Object.entries(T)) {
  const ok = sain.res[k];
  if (!ok) rouge++;
  if (!CONTRE) console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + k + ' — ' + lbl);
}
if (!CONTRE) {
  console.log('\n' + (rouge ? '\x1b[31m✗ ' + rouge + ' rouge(s)\x1b[0m' : '\x1b[32m✓ ' + Object.keys(T).length + ' vertes, 0 rouge\x1b[0m'));
  process.exit(rouge ? 1 : 0);
}
if (rouge) { console.log('\x1b[31m✗ le code sain n’est pas vert : contre-épreuve impossible\x1b[0m'); process.exit(1); }
let det = 0;
for (const [f, de, vers, cle, nom] of CASSES) {
  const n = SAIN[f].split(de).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ancre ' + (n ? 'non unique (' + n + ')' : 'introuvable') + ' : ' + nom); rouge++; continue; }
  const S = Object.assign({}, SAIN, { [f]: SAIN[f].replace(de, vers) });
  const r = jouer(S);
  const vu = r.err || !r.res[cle];
  console.log('  ' + (vu ? '\x1b[32m✓\x1b[0m DÉTECTÉ ' : '\x1b[31m✗\x1b[0m MANQUÉ  ') + ' ' + nom + ' (' + cle + ')');
  if (vu) det++; else rouge++;
}
console.log('\n' + (rouge ? '\x1b[31m✗ ' + rouge + ' contre-épreuve(s) manquée(s)\x1b[0m' : '\x1b[32m✓ ' + det + '/' + CASSES.length + ' défauts détectés\x1b[0m'));
process.exit(rouge ? 1 : 0);
