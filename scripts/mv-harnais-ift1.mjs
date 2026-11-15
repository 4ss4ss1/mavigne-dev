/* ───────────────────────────────────────────────────────
   HARNAIS — IFT-1 (§571) : L'IFT RÉEL — DOSE APPLIQUÉE ÷ DOSE DE RÉFÉRENCE, LE BIOCONTRÔLE À PART, FACE À LA RÉFÉRENCE
   Lancer :          node scripts/mv-harnais-ift1.mjs
   Contre-épreuves : node scripts/mv-harnais-ift1.mjs --contre

   POURQUOI IL EXISTE
   Conformité comptait des passages et les comparait à un IFT de référence : deux grandeurs qui ne se comparent pas. Ce harnais
   JOUE le calcul extrait de pilotage.js (la méthode du guide du ministère) sur un domaine fabriqué : la dose de référence « à la
   culture » (la plus petite des doses homologuées de la vigne) et « à la cible » (la plus grande de la cible), l'hectolitre ramené
   à l'hectare sur 1 000 L, une masse qui ne se compare pas à un volume, le produit sans dose qui compte 1, l'adjuvant qui ne compte
   pas, le biocontrôle reconnu à la substance (le soufre en est, le spinosad non, même typé « Biocontrôle »), la moyenne du domaine
   pondérée par les surfaces, l'année civile et la précédente tant que la neuve est vide, les vignes arrachées hors du calcul, les
   doses réduites et à vérifier ; il REND la carte « IFT » de Conformité (chiffres, lignes, avertissements, maladies signalées,
   dépliant) et garde les fils : la carte du domaine, la case « Choisir les indicateurs », l'aide, le réglage, l'annonce.
   Horloge figée au mardi 16 juin 2026.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), ut: lire('src/utils.js'), wn: lire('src/whats-new.js'), reg: lire('src/reglages.js'), app: lire('src/app.js'),
  phy: lire('src/phyto.js'), g11: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(src) { const a = src.indexOf('var IFT_BIO_RE='), b = src.indexOf('// Une parcelle : son IFT hors biocontrôle'); if (a < 0 || b < a) throw new Error('bloc IFT introuvable'); return src.slice(a, b); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
const RealDate = Date, FIXE = new RealDate('2026-06-16T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXE); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXE; FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;

// Le catalogue : un fongicide à deux usages (mildiou 2 kg/ha, black-rot 1,5), un soufre, un cuivre, un spinosad typé
// « Biocontrôle », un produit dosé à l'hectolitre, un insecticide liquide, un adjuvant.
const EPHY = [
  { amm: '2000001', nom: 'FONGI A', type: 'Fongicide', sub: 'folpel', usages: [{ cible: 'Vigne · Trt Part.Aer. · Mildiou(s)', dose: '2 kg/ha' }, { cible: 'Vigne · Trt Part.Aer. · Black rot', dose: '1,5 kg/ha' }] },
  { amm: '2000002', nom: 'SOUFRE S', type: 'Soufre', sub: 'Soufre (80 %)', usages: [{ cible: 'Vigne · Oïdium(s)', dose: '12.5 kg/ha' }] },
  { amm: '2000003', nom: 'CUIVRE C', type: 'Cuivre', sub: 'hydroxyde de cuivre', usages: [{ cible: 'Vigne · Mildiou(s)', dose: '4 kg/ha' }] },
  { amm: '2000004', nom: 'SPINO', type: 'Biocontrôle', sub: 'spinosad', usages: [{ cible: 'Vigne · Tordeuses', dose: '0.15 L/ha' }] },
  { amm: '2000005', nom: 'HECTO H', type: 'Fongicide', sub: 'cymoxanil', usages: [{ cible: 'Vigne · Mildiou(s)', dose: '20 g/hL' }] },
  { amm: '2000006', nom: 'INSECTE L', type: 'Insecticide', sub: 'lambda-cyhalothrine', usages: [{ cible: 'Vigne · Tordeuses', dose: '0.1 L/ha' }] },
  { amm: '2000007', nom: 'ADJU', type: 'Adjuvant', sub: '', usages: [] }];
const PARC = [{ nom: 'A', surface: '2' }, { nom: 'B', surface: '1' }, { nom: 'C', surface: '1' }, { nom: 'D', surface: '0.5', statut: 'Arrachee' },
  { nom: 'E', surface: '' }, { nom: 'F', surface: '1' }, { nom: 'G', surface: '1' }];
const tr = (o) => Object.assign({ date: '2026-05-02' }, o);
const TRAIT = [
  tr({ sessionId: 's1', produit: 'FONGI A', amm: '2000001', dose_val: 1.5, dose_unit: 'kg/ha', parcelles: ['A', 'B'] }),              // 1,0 (culture : 1,5)
  tr({ sessionId: 's1', produit: 'SOUFRE S', amm: '2000002', type: 'Soufre', dose_val: 6.25, dose_unit: 'kg/ha', parcelles: ['A', 'B'] }),   // 0,5 biocontrôle
  tr({ sessionId: 's2', date: '2026-05-20', produit: 'FONGI A', amm: '2000001', dose_val: 0.75, dose_unit: 'kg/ha', parcelles: ['A'] }),    // 0,5 réduite
  tr({ sessionId: 's2', date: '2026-05-20', produit: 'ADJU', amm: '2000007', type: 'Adjuvant', dose_val: 0.2, dose_unit: 'l/ha', parcelles: ['A'] }),   // ne compte pas
  tr({ sessionId: 's3', date: '2026-06-01', produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', dose: '2 kg/ha', parcelles: ['B'] }),       // 0,5 (dose écrite)
  tr({ sessionId: 's4', date: '2026-06-05', produit: 'Mystère', amm: '', dose_val: 1, dose_unit: 'l/ha', parcelles: ['A'] }),             // hors catalogue : 1
  tr({ sessionId: 's5', date: '2026-06-10', produit: 'HECTO H', amm: '2000005', dose: '30 g/hL', parcelles: ['C'] }),                     // 300 g ÷ 200 g = 1,5
  tr({ sessionId: 's6', date: '2026-06-12', produit: 'FONGI A', amm: '2000001', cible: 'Mildiou', dose_val: 2, dose_unit: 'kg/ha', parcelles: ['A'] }),   // à la cible : 1,0
  tr({ sessionId: 's7', date: '2026-06-14', produit: 'INSECTE L', amm: '2000006', dose_val: 0.5, dose_unit: 'l/ha', parcelles: ['B'] }),    // 5,0 : à vérifier
  tr({ sessionId: 's8', date: '2026-06-15', produit: 'FONGI A', amm: '2000001', dose_val: 1, dose_unit: 'l/ha', parcelles: ['B'] }),        // un volume face à une masse : 1
  tr({ sessionId: 's9', date: '2026-06-15', produit: 'SPINO', amm: '2000004', type: 'Biocontrôle', dose_val: 0.15, dose_unit: 'l/ha', parcelles: ['C'] }),   // 1,0, PAS biocontrôle
  tr({ sessionId: 'sD', date: '2026-06-02', produit: 'FONGI A', amm: '2000001', dose_val: 1.5, dose_unit: 'kg/ha', parcelles: ['D'] }),     // vigne arrachée : hors calcul
  tr({ sessionId: 'v1', date: '2025-06-02', produit: 'FONGI A', amm: '2000001', dose_val: 1.5, dose_unit: 'kg/ha', parcelles: ['A'] })];    // l'an dernier
function monde(S, o = {}) {
  const ctx = { Math, Object, Array, String, Number, JSON, isFinite, parseInt, parseFloat, console, Date: FakeDate,
    PARCELLES: PARC, TRAITEMENTS: o.trait || TRAIT, EPHY: o.ephy === undefined ? EPHY : o.ephy, CONFIG: o.config || {},
    _obsMaladies: (nom) => (nom === 'B' ? ['oïdium'] : []),
    _pilEsc: (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    _pilHa: (v) => String(v).replace('.', ','), _mvIcon: (n) => '<i data-ic="' + n + '"></i>',
    _pilStat: (n, u, w) => '<span class="pil-th-stat"><b>' + n + '</b>' + (u || '') + (w ? ' <b class="warn">' + w + '</b>' : '') + '</span>',
    _pilTile: (id, dot, title, stat, sub, g, body, info) => '<tile id="' + id + '" info="' + info + '"><h>' + title + '</h>' + stat + '<sub>' + (sub || '') + '</sub>' + body + '</tile>' };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([fonction(S.pil, 'function _cfmIftRef('), bloc(S.pil), fonction(S.pil, 'function _pilIftLigne('), fonction(S.pil, 'function _pilIftTuile(')].join('\n'), ctx, { filename: 'ift-extrait.js' });
  return ctx;
}
const proche = (a, b) => a != null && Math.abs(a - b) < 1e-9;
function jouer(S) {
  const X = monde(S);
  const q = (s, m) => X._iftQte(s, m);
  t('① les doses se lisent : « 2,5 kg/ha », « 200 g/hL » ramené à l’hectare sur 1 000 L, « 0.16 L/ha », une unité d’objets',
    proche(q('2,5 kg/ha').q, 2.5) && q('2,5 kg/ha').dim === 'm' && proche(q('200 g/hL').q, 2) && q('0.16 L/ha').dim === 'v' && proche(q('0.16 L/ha').q, 0.16) && q('500 diffuseurs/ha').dim === 'u:diffuseurs' && q('pas de dose') === null);
  t('① une fourchette : sa borne haute pour une dose de référence, illisible pour une dose appliquée', proche(q('3–5 kg/ha', true).q, 5) && q('3–5 kg/ha') === null);
  const R = X._iftCalc(2026), P = {}; R.rows.forEach((r) => { P[r.nom] = r; });
  t('② à la culture : la plus petite des doses homologuées (1,5 kg/ha) — A : 1,0 + 0,5 + 1 + 1,0 = 3,5', proche(P.A.hb, 3.5), JSON.stringify(P.A));
  t('② à la cible, quand le traitement la porte : la plus grande de cette cible (2 kg/ha → 1,0)', R.cible === 1);
  t('③ l’hectolitre ramené à l’hectare (30 g/hL face à 20 g/hL : 1,5), et le spinosad n’est PAS du biocontrôle — C : 2,5', proche(P.C.hb, 2.5) && proche(P.C.bio, 0), JSON.stringify(P.C));
  t('④ le soufre est du biocontrôle (0,5, à part) ; un volume face à une masse compte 1 ; la dose écrite se lit — B : 7,5 et 0,5', proche(P.B.hb, 7.5) && proche(P.B.bio, 0.5), JSON.stringify(P.B));
  t('④ l’adjuvant ne compte pas ; 2 produits comptés 1 (hors catalogue, unités) ; 1 dose à vérifier (5 fois la référence)', R.lignes === 11 && R.un === 2 && R.doute === 1, JSON.stringify([R.lignes, R.un, R.doute]));
  t('⑤ le domaine : la moyenne des parcelles pondérée par leur surface — (3,5 × 2 + 7,5 + 2,5) ÷ 6 ha', proche(R.hb, 17 / 6) && proche(R.bio, 1.5 / 6) && proche(R.surfTot, 6), JSON.stringify([R.hb, R.bio, R.surfTot]));
  t('⑤ la vigne arrachée sort du calcul (sa ligne : hors des parcelles) ; une parcelle sans surface est listée, sans poids', !P.D && R.horsParc === 1 && P.E && P.E.n === 0);
  t('⑥ 10 passages, dont 3 à dose réduite (le soufre à moitié, le fongicide à moitié, le cuivre écrit à moitié)', R.nPass === 10 && R.nRed === 3, JSON.stringify([R.nPass, R.nRed]));
  t('⑥ rangées de la plus haute à la plus basse : B, A, C', R.rows[0].nom === 'B' && R.rows[1].nom === 'A' && R.rows[2].nom === 'C');
  const R5 = X._iftCalc(2025);
  t('⑦ l’année civile : 2025 a son propre IFT (1,0 sur A, 2 ÷ 6 au domaine)', R5.lignes === 1 && proche(R5.hb, 2 / 6));
  t('⑦ l’année affichée : la courante quand elle a un traitement, la précédente tant qu’elle n’en a aucun, la courante sinon',
    X._iftAnnee() === 2026 && monde(S, { trait: [TRAIT[12]] })._iftAnnee() === 2025 && monde(S, { trait: [] })._iftAnnee() === 2026);
  const H = X._pilIftTuile();
  t('⑧ la carte : « IFT 2026 », hors biocontrôle en tête (2,8), le biocontrôle et la référence par défaut dans le cadre', /<h>IFT 2026<\/h>/.test(H) && H.includes('<b>2,8</b> hors biocontrôle') && H.includes('<sub>biocontrôle 0,3 · référence 12,0 (par défaut)</sub>') && H.includes('info="pil.cfm.ift"'));
  t('⑧ le détail : le biocontrôle, le total, la référence (le hors-biocontrôle est en tête) ; la jauge, l’écart, les passages, l’année d’avant',
    [['0,3', 'biocontrôle'], ['3,1', 'total'], ['12,0', 'référence, à régler']].every(([v, l]) => H.includes('<div class="v">' + v + '</div><div class="l" style="color:var(--texte-doux);margin-top:2px">' + l + '</div>'))
    && (H.match(/class="pil-ift-k"/g) || []).length === 3 && H.includes('class="pil-gbar"')
    && H.includes('hors biocontrôle : 76 % sous la référence') && H.includes('10 passages, dont 3 à dose réduite') && H.includes('2025 : 0,3'));
  t('⑧ ce qui est compté 1, à vérifier, hors des parcelles : dit', H.includes('2 produits comptés 1 : dose appliquée ou homologuée inconnue') && H.includes('1 dose à vérifier') && H.includes('1 ligne sur une parcelle absente de la liste'));
  const iB = H.indexOf('pil-li-t">B '), iA = H.indexOf('pil-li-t">A '), iC = H.indexOf('pil-li-t">C ');
  t('⑨ par parcelle : les cinq plus hautes dans l’ordre, la maladie signalée cette année, le biocontrôle, l’autre derrière le dépliant',
    iB > 0 && iA > iB && iC > iA && H.includes('4 passages · + 0,5 en biocontrôle · 1 produit compté 1 · oïdium signalé') && H.includes('>L’autre parcelle</summary>') && (H.match(/class="pil-li"/g) || []).length === 6);
  const Hr = monde(S, { config: { conformite: { ift_ref: 2.5 } } })._pilIftTuile();
  t('⑩ au-dessus de la référence réglée (2,5) : l’alerte en tête, l’écart dit', Hr.includes('<b class="warn">↑ 13 %</b>') && Hr.includes('13 % au-dessus de la référence') && Hr.includes('référence 2,5</sub>'));
  const He = monde(S, { ephy: [] })._pilIftTuile(), Hv = monde(S, { trait: [] })._pilIftTuile();
  t('⑪ sans le catalogue E-Phy : pas de chiffre, la raison ; sans traitement : zéro, et comment il se calculera', He.includes('<b>—</b>') && He.includes('catalogue E-Phy absent') && He.includes('n’est pas chargé') && Hv.includes('aucun traitement en 2026') && Hv.includes('Aucun traitement enregistré en 2026'));
  // Les fils : la carte du domaine, la case, l'aide, le réglage, l'annonce, la saisie, le guide, la liste.
  t('⑫ Conformité rend la carte ; la carte du domaine lit le même calcul ; la case et l’étiquette suivent ; plus de passages comptés',
    S.pil.includes("if(_pilShow('cfm_ift')){ any=true; H+=_pilIftTuile(); }") && S.pil.includes("var R=_iftCalc(_iftAnnee()), ift={}; R.rows.forEach(function(q){ ift[q.nom]=q; });")
    && S.pil.includes("['ift','IFT']") && S.pil.includes("['cfm_ift','IFT de l’année (fréquence de traitement)']") && S.pil.includes("cfm:'Conformité — cuivre, IFT et délai de rentrée'") && !/function _cfmPassages\(/.test(S.pil));
  t('⑬ les maladies signalées viennent des signalements de l’année (app.js), annulés exclus', S.app.includes('window._obsMaladies=function(nom){') && S.app.includes("if(_obsFamille(e.type)!=='maladie'||e.type==='carence') return;"));
  t('⑭ l’aide dit la méthode : la dose de référence, le « compte 1 », le biocontrôle à part, la référence hors biocontrôle, l’année',
    /'pil\.cfm\.ift': \{ t: 'L\\u2019IFT, l\\u2019indicateur de fréquence de traitement'/.test(S.ut) && S.ut.includes('<b>compte 1</b>') && S.ut.includes('IFT <b>hors biocontrôle</b>, herbicides compris') && S.ut.includes('du 1er janvier au 31 décembre') && S.ut.includes("['La dose/ha de chaque produit'"));
  t('⑮ le réglage : hors biocontrôle, au dixième ; la saisie dit que la dose fait l’IFT ; le guide a la méthode ; l’annonce 11.01',
    S.reg.includes('herbicides compris, hors biocontr\\u00f4le') && S.reg.includes('step="0.1" inputmode="decimal"') && S.phy.includes('alimente La R&#xe9;serve et l&#8217;IFT')
    && S.g11.includes("<summary>Comment l'IFT est-il calculé&nbsp;?</summary>") && /v: '11\.01'[\s\S]{0,200}L’IFT réel remplace le compte des passages/.test(S.wn));
  t('⑯ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-ift1.mjs'") > 0 && S.liste.indexOf("mv-harnais-ift1.mjs --contre'") > 0);
}
if (!CONTRE) {
  console.log('\n\x1b[1mMA VIGNE — Harnais IFT-1 · scénarios\x1b[0m');
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n\x1b[1mMA VIGNE — Harnais IFT-1 · contre-épreuves\x1b[0m');
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (S[cle].split(a).length !== 2) throw new Error('ancre absente ou multiple : ' + a.slice(0, 50)); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['la dose de référence prend la plus GRANDE des doses de la vigne', m('pil', "us.forEach(function(u){ var r=_iftQte(u&&u.dose,true); if(r&&r.dim===da.dim&&(!best||r.q<best.q)) best=r; });", "us.forEach(function(u){ var r=_iftQte(u&&u.dose,true); if(r&&r.dim===da.dim&&(!best||r.q>best.q)) best=r; });")],
    ['la cible du traitement est ignorée', m('pil', '  if(cib){\n', '  if(false){\n')],
    ['une masse se compare à un volume', m('pil', "us.forEach(function(u){ var r=_iftQte(u&&u.dose,true); if(r&&r.dim===da.dim&&(!best||r.q<best.q)) best=r; });", "us.forEach(function(u){ var r=_iftQte(u&&u.dose,true); if(r&&(!best||r.q<best.q)) best=r; });")],
    ['l’hectolitre n’est plus ramené à l’hectare', m('pil', "  if(m[4]==='hl') q*=10;", '')],
    ['un produit sans dose compte 0 au lieu de 1', m('pil', 'if(!da||!dr) return { compte:true, r:1, un:true,', 'if(!da||!dr) return { compte:true, r:0, un:true,')],
    ['les adjuvants comptent', m('pil', "  if(type==='adjuvant'||type==='mfsc') return { compte:false };\n", '')],
    ['le biocontrôle n’est plus à part', m('pil', 'if(L.bio) q.bio+=L.r*w; else q.hb+=L.r*w;', 'q.hb+=L.r*w;')],
    ['le spinosad redevient du biocontrôle (le type E-Phy fait foi)', m('pil', 'var IFT_PAS_BIO_RE=/(cuivr|bouillie bordelaise|spinosad|pyrethr|prohexadione)/;', 'var IFT_PAS_BIO_RE=/(cuivr|bouillie bordelaise|pyrethr|prohexadione)/;')],
    ['le domaine en moyenne simple, sans les surfaces', m('pil', 'if(q.surf>0){ sHb+=q.hb*q.surf; sBio+=q.bio*q.surf; }', 'if(q.surf>0){ sHb+=q.hb; sBio+=q.bio; }')],
    ['toutes les années se mélangent', m('pil', 'if(!t||_iftAnDe(t)!==an) return;', 'if(!t) return;')],
    ['une vigne arrachée compte', m('pil', "if(!p||p.statut==='Arrachee'||par[p.nom]) return;", 'if(!p||par[p.nom]) return;')],
    ['l’année vide reste affichée en janvier', m('pil', 'return (a[y]||!a[y-1])?y:y-1;', 'return y;')],
    ['les maladies signalées ne sont plus lues', m('pil', "var mal=(typeof window._obsMaladies==='function'&&an===new Date().getFullYear())?window._obsMaladies:null;", 'var mal=null;')],
    ['la carte du domaine revient aux passages', m('pil', "['ift','IFT']", "['pass','Passages phyto']")],
    ['l’aide ne dit plus qu’un produit sans dose compte 1', m('ut', '<b>compte 1</b>', 'compte')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-ift1.mjs'").join("mv-harnais-iftZ.mjs'") })]];
  let rougit = 0;
  for (const [nom, f] of mutants) {
    let S; try { S = f(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté : ' + nom + ' (' + e.message + ')'); continue; }
    const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S); } catch (e) { ko++; } console.log = log;
    if (ko) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + ko + ')\x1b[0m'); } else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
  }
  console.log('\n  ' + rougit + '/' + mutants.length + ' contre-épreuves rougissent\n');
  process.exit(rougit === mutants.length ? 0 : 1);
}
