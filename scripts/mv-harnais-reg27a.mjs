/* ───────────────────────────────────────────────────────
   HARNAIS — REG27-1A (§572) : LE REGISTRE 2027 SE SAISIT — LA CIBLE ET LE MODE, LA SURFACE TRAITÉE, LA RENTRÉE ANTICIPÉE
   Lancer :          node scripts/mv-harnais-reg27a.mjs
   Contre-épreuves : node scripts/mv-harnais-reg27a.mjs --contre

   POURQUOI IL EXISTE
   L'arrêté du 24 décembre 2025 (registre électronique au 1er janvier 2027) demande, pour chaque utilisation : la surface
   TRAITÉE, la cible et le mode d'application quand on les note, et le délai d'une rentrée anticipée (HH:MM) — avec, pour
   elle, le moment, le lieu, le motif et les mesures de protection. Ma Vigne n'en saisissait rien : une parcelle comptait
   entière, la colonne « Cible » sortait vide, le « DRE anticipé » était un texte libre tapé d'avance. Ce harnais JOUE le
   code extrait des modules sur un petit domaine : la surface traitée (utils.js, une seule règle), la cible proposée, le mode
   retenu, le délai compté depuis la fin du traitement, le verdict de la fenêtre (avant la fin, au-delà du délai), le fichier
   du registre ligne par ligne, l'IFT qui compte la part traitée, La Réserve et le coût qui consomment les hectares traités ;
   puis il garde les fils : l'assistant, la fiche, la modification, le PDF, la fiche sur ordinateur, le tuto, l'aide.
   Horloge figée au dimanche 15 novembre 2026, 9 h 30.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { texteTutosDepot } from './mv-tutos-sources.mjs';   // ★ COULEUR-1 (§625) : le moteur des tutos et ses listes par module
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { ut: lire('src/utils.js'), phy: lire('src/phyto.js'), rg: lire('src/registre.js'), pil: lire('src/pilotage.js'), rsv: lire('src/reserve.js'), reg: lire('src/reglages.js'),
  trc: lire('src/tracteur.js'), tu: texteTutosDepot(), wn: lire('src/whats-new.js'), cov: lire('scripts/tutos-couverture.json'),
  g07: lire('guide/07-phyto.html'), g11: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function tranche(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('tranche introuvable : ' + a); return src.slice(i, j + b.length); }
function blocIft(src) { const a = src.indexOf('var IFT_BIO_RE='), b = src.indexOf('// Une parcelle : son IFT hors biocontrôle'); if (a < 0 || b < a) throw new Error('bloc IFT introuvable'); return src.slice(a, b); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
const RealDate = Date, FIXE = new RealDate('2026-11-15T09:30:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXE); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXE; FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;
const proche = (a, b) => a != null && Math.abs(a - b) < 1e-9;

// Le domaine : A 2 ha, B 1,2 ha (écrit « 1,2 »), C sans surface, D arrachée.
const PARC = [{ nom: 'A', surface: 2 }, { nom: 'B', surface: '1,2' }, { nom: 'C', surface: '' }, { nom: 'D', surface: 0.5, statut: 'Arrachee' }];
const EPHY = [
  { amm: '2000001', nom: 'FONGI A', type: 'Fongicide', sub: 'folpel', usages: [{ cible: 'Vigne · Trt Part.Aer. · Mildiou(s)', dose: '2 kg/ha' }, { cible: 'Vigne · Trt Part.Aer. · Black rot', dose: '1,5 kg/ha' }] },
  { amm: '2000003', nom: 'CUIVRE C', type: 'Cuivre', sub: 'hydroxyde de cuivre', usages: [{ cible: 'Vigne · Trt Part.Aer. · Mildiou(s)', dose: '4 kg/ha' }] },
  { amm: '9999999', nom: 'CUIVRE C', type: 'Cuivre', sub: 'oxychlorure', usages: [{ cible: 'Vigne · Trt Part.Aer. · Excoriose', dose: '4 kg/ha' }] }];
const TRAIT = () => [
  { produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', drae: 48, dose_val: 2, dose_unit: 'kg/ha', date: '2026-11-14', heureDebut: '16:30', heureFin: '18:00',
    parcelles: ['A', 'B'], sessionId: 's1', cible: 'Mildiou(s)', mode: 'Pulvérisation', surfTraitee: { B: 0.4 },
    rentrees: [{ id: 'r2', quand: '2026-11-15T07:30', parcelles: ['B'], motif: 'Relevage', mesures: 'Gants', delai: '99:99' },
               { id: 'r1', quand: '2026-11-14T21:15', parcelles: ['A', 'B'], motif: 'Bâches', mesures: 'Bottes', delai: '03:15' }] },
  { produit: 'FONGI A', amm: '2000001', type: 'Fongicide', drae: 24, dose_val: 1, dose_unit: 'kg/ha', date: '2026-11-14', heureDebut: '16:30', heureFin: '18:00',
    parcelles: ['A', 'B'], sessionId: 's1', cible: 'Black rot', mode: 'Pulvérisation', surfTraitee: { B: 0.4 } },
  { produit: 'ADJU', type: 'MFSC', date: '2026-11-14', heureFin: '18:00', parcelles: ['A', 'B'], sessionId: 's1' },
  { produit: 'FONGI A', amm: '2000001', type: 'Fongicide', dose_val: 2, dose_unit: 'kg/ha', date: '2026-06-01', parcelles: ['A', 'C'], sessionId: 's0', dreAnticipe: '6h — relevage', mode: 'Poudrage' }];

function monde(S, o = {}) {
  const champs = Object.assign({}, o.champs || {});
  const ctx = { Math, Object, Array, String, Number, JSON, isFinite, isNaN, parseInt, parseFloat, console, Date: FakeDate,
    PARCELLES: o.parc || PARC, TRAITEMENTS: o.trait || TRAIT(), EPHY: o.ephy === undefined ? EPHY : o.ephy, CATALOGUE: [], CONFIG: { siret: '123 456 789 00012' },
    INTRANTS: { produits: [{ nom: 'CUIVRE C', prixU: 10 }, { nom: 'Fongi A', prixU: 20 }] },
    document: { getElementById: (id) => (Object.prototype.hasOwnProperty.call(champs, id) ? champs[id] : null) },
    _mvParcGeo: (p) => (p && p.nom === 'A' ? { lat: 47.1, lng: 4.9 } : null), _dreMotif: () => '' };
  ctx.window = ctx; vm.createContext(ctx);
  const ut = [fonction(S.ut, 'function _mvHaNum('), fonction(S.ut, 'window._mvSurfT=function(t,nom,ha){'), fonction(S.ut, 'window._mvSurfTTot=function(t){'),
    fonction(S.ut, 'export function dreEffectif(').replace(/^export /, '')].join('\n');
  vm.runInContext(o.sansAide ? fonction(S.ut, 'export function dreEffectif(').replace(/^export /, '') : ut, ctx, { filename: 'utils-extrait.js' });
  const phy = [fonction(S.phy, 'function _phyNorm('), fonction(S.phy, 'function _phyEphy('), fonction(S.phy, 'function _phResolve('),
    tranche(S.phy, 'var MV_PHY_MODES=', '];'), fonction(S.phy, 'function _phyCibleCourte('), fonction(S.phy, 'function _phyCiblesEphy('), fonction(S.phy, 'function _phyParDate('),
    fonction(S.phy, 'function _phyCiblesVues('), fonction(S.phy, 'function _phyCibleDefaut('), fonction(S.phy, 'function _phyCiblesListe('), fonction(S.phy, 'function _phyModeDefaut('),
    fonction(S.phy, 'function _phParcHa('), fonction(S.phy, 'function _phSurfLire('), fonction(S.phy, 'function _phSurfDe('), fonction(S.phy, 'function _phSurfZero('),
    fonction(S.phy, 'function _phSessionLignes('), fonction(S.phy, 'function _phDreSession('), fonction(S.phy, 'function _phFinApp('), fonction(S.phy, 'function _phFinTrait('),
    fonction(S.phy, 'function _phHhMm('), fonction(S.phy, 'function _phHFr('), fonction(S.phy, 'function _phRentreeDelaiMin('), fonction(S.phy, 'function _phRentrees('),
    fonction(S.phy, 'function _phRentreeDelai('), fonction(S.phy, 'function _phRentreeQuand('), fonction(S.phy, 'function _phRentreeT('), fonction(S.phy, 'function _phRentreeVerdict('),
    "var MV_OEPP_VIGNE = 'VITVI';", fonction(S.rg, 'function _phCsvCell('), fonction(S.rg, 'function _phCsvNum('), fonction(S.rg, 'function _phCsvDate('),
    fonction(S.rg, 'function _phCsvHeure('), fonction(S.rg, 'function _phCsvBbch('), fonction(S.rg, 'function _phCsvDose('), fonction(S.phy, 'function _phCsvParcs('),
    tranche(S.rg, 'var MV_PHY_CSV_COLS = [', '];'), fonction(S.rg, 'function _phCsvJour('), fonction(S.rg, 'window._phytoCsvRows = function(fen){'),
    'var dreEffectif = window.dreEffectif || dreEffectif;'].join('\n');
  vm.runInContext(phy, ctx, { filename: 'phyto-extrait.js' });
  vm.runInContext([fonction(S.pil, 'function _cfmIftRef('), blocIft(S.pil), fonction(S.pil, 'function _ecoPhNorm('), fonction(S.pil, 'function _ecoPhytoByParc(')].join('\n'), ctx, { filename: 'pilotage-extrait.js' });
  vm.runInContext([fonction(S.rsv, 'function _conso('), fonction(S.rsv, 'function _treatSurface(')].join('\n'), ctx, { filename: 'reserve-extrait.js' });
  ctx.__champs = champs;
  return ctx;
}
const ch = (v) => ({ value: v });

function jouer(S) {
  const X = monde(S);
  const tB = { parcelles: ['A', 'B', 'C'], surfTraitee: { B: 0.4, A: 5, C: 0.3, Z: 1 } };
  // ① la surface traitée : une seule règle (utils.js)
  t('① la parcelle entière par défaut ; les hectares saisis quand elle ne l’a été qu’en partie (« 1,2 » se lit)',
    proche(X._mvSurfT({}, 'A'), 2) && proche(X._mvSurfT(tB, 'B'), 0.4) && proche(X._mvSurfT({ surfTraitee: { B: '0,6' } }, 'B'), 0.6));
  t('① plafonnée à la parcelle ; sans surface connue, la valeur saisie ; une valeur négative ne compte pas',
    proche(X._mvSurfT(tB, 'A'), 2) && proche(X._mvSurfT(tB, 'C'), 0.3) && proche(X._mvSurfT({ surfTraitee: { A: -1 } }, 'A'), 2) && proche(X._mvSurfT(tB, 'Z', 3), 1));
  t('① le total d’un traitement : la somme de ses parcelles ; une ancienne saisie (chaîne, ou rien) ne casse rien',
    proche(X._mvSurfTTot(tB), 2.7) && proche(X._mvSurfTTot({ parcelles: 'B' }), 1.2) && proche(X._mvSurfTTot({ parcelles: [], surface: 3 }), 3) && X._mvSurfTTot({}) === 0);
  // ② la saisie des surfaces (assistant et modification) : relire, arrondir, retirer la parcelle entière
  const o = { B: 0.9 }; X.__champs['st-0'] = ch('2'); X.__champs['st-1'] = ch('0,35'); X.__champs['st-2'] = ch('');
  X._phSurfLire('st-', ['A', 'B', 'C'], o);
  const o2 = { A: 1 }; X.__champs['st-0'] = ch('0'); X._phSurfLire('st-', ['A'], o2);
  t('② la valeur tapée se relit (virgule comprise) ; égale à la parcelle, elle redevient « parcelle entière » ; vide aussi ; zéro est refusé à l’enregistrement',
    JSON.stringify(o) === '{"B":0.35}' && o2.A === 0 && X._phSurfZero(['A'], o2).join() === 'A' && X._phSurfZero(['B'], { B: 0.35 }).length === 0);
  // ③ la cible proposée, le mode retenu
  t('③ l’usage E-Phy se lit à son dernier morceau : « Vigne · Trt Part.Aer. · Mildiou(s) » → « Mildiou(s) »',
    X._phyCibleCourte('Vigne · Trt Part.Aer. · Mildiou(s)') === 'Mildiou(s)' && X._phyCibleCourte('Vigne') === '' && X._phyCibleCourte('') === '');
  const Xv = monde(S, { trait: [] });
  t('③ un produit à un seul usage : sa cible est proposée ; à plusieurs usages et sans historique : rien (jamais choisie à la place du vigneron)',
    Xv._phyCibleDefaut('CUIVRE C', '2000003') === 'Mildiou(s)' && Xv._phyCibleDefaut('FONGI A', '2000001') === '' && Xv._phyCibleDefaut('Inconnu', '') === '');
  t('③ l’AMM désigne le bon produit quand deux portent le même nom', Xv._phyCibleDefaut('CUIVRE C', '9999999') === 'Excoriose');
  t('③ la dernière cible notée pour ce produit passe devant ; la liste réunit l’historique et E-Phy, sans doublon',
    X._phyCibleDefaut('FONGI A', '2000001') === 'Black rot' && X._phyCiblesListe('FONGI A', '2000001').join('|') === 'Black rot|Mildiou(s)');
  t('③ le mode : le dernier noté au registre, sinon « Pulvérisation »', X._phyModeDefaut() === 'Pulvérisation' && monde(S, { trait: [TRAIT()[3]] })._phyModeDefaut() === 'Poudrage' && Xv._phyModeDefaut() === 'Pulvérisation');
  // ④ le délai d'une rentrée anticipée
  const T = X.TRAITEMENTS;
  t('④ HH:MM, les heures au-delà de 24 comprises', X._phHhMm(450) === '07:30' && X._phHhMm(810) === '13:30' && X._phHhMm(2890) === '48:10' && X._phHhMm(0) === '00:00');
  t('④ compté depuis la fin du traitement (et non tapé) : 13:30 et 03:15 ; sans heure de fin, celui noté à la déclaration',
    X._phRentreeDelai(T[0], T[0].rentrees[0]) === '13:30' && X._phRentreeDelai(T[0], T[0].rentrees[1]) === '03:15' && X._phRentreeDelai({ date: '2026-11-14' }, { quand: '2026-11-15T07:30', delai: '12:00' }) === '12:00');
  t('④ les rentrées, de la plus ancienne à la plus récente', X._phRentrees(T[0]).map((r) => r.id).join() === 'r1,r2' && X._phRentrees({ rentrees: 'x' }).length === 0);
  t('④ le délai qui borne : le plus long des produits de la cuve (48 h), l’adjuvant ne compte pas', X._phDreSession(T[1]) === 48 && X._phDreSession(T[3]) === 6);
  t('④ la fin de l’application : l’heure de fin, sinon de début, sinon midi', X._phFinApp(T[0]).getHours() === 18 && X._phFinApp({ date: '2026-11-14', heureDebut: '07:05' }).getMinutes() === 5 && X._phFinApp({ date: '2026-11-14' }).getHours() === 12 && X._phFinApp({}) === null);
  // ⑤ le verdict de la fenêtre
  const vd = (tr, c) => { const Y = monde(S, { champs: c }); return Y._phRentreeVerdict(tr || Y.TRAITEMENTS[0]); };
  const sansFin = Object.assign({}, TRAIT()[0], { heureFin: '' });
  t('⑤ sans heure de fin : la fenêtre la demande ; tapée dans la fenêtre, le délai se compte',
    /heure de fin/.test(vd(sansFin, { 'prt-date': ch('2026-11-15'), 'prt-heure': ch('07:30') }).txt) && vd(sansFin, { 'prt-fin': ch('18:00'), 'prt-date': ch('2026-11-15'), 'prt-heure': ch('07:30') }).ok);
  t('⑤ avant la fin du traitement : refusé ; au-delà du délai (48 h) : « rien à déclarer »',
    /avant la fin/.test(vd(null, { 'prt-date': ch('2026-11-14'), 'prt-heure': ch('17:00') }).txt) && !vd(null, { 'prt-date': ch('2026-11-16'), 'prt-heure': ch('18:00') }).ok
    && /rien à déclarer/.test(vd(null, { 'prt-date': ch('2026-11-16'), 'prt-heure': ch('18:30') }).txt));
  const bon = vd(null, { 'prt-date': ch('2026-11-15'), 'prt-heure': ch('07:30') });
  t('⑤ dans le délai : accepté, le moment au format du registre, le délai dit en clair et en HH:MM',
    bon.ok && bon.q === '2026-11-15T07:30' && /^13 h 30 après la fin du traitement/.test(bon.txt) && /au registre : 13:30\./.test(bon.txt));
  // ⑥ le fichier du registre, ligne par ligne
  const R = X._phytoCsvRows(), L = R.rows, C = X.MV_PHY_CSV_COLS;
  const lig = (p, n) => L.find((r) => r[2] === p && r[18] === n);
  const ci = (lbl) => C.indexOf(lbl);
  t('⑥ les colonnes : « Surface traitée (ha) » à sa place, la surface de la parcelle et la rentrée (moment, motif, mesures) en fin ; chaque ligne en a autant',
    C.length === 26 && C[14] === 'Surface traitée (ha)' && C[22] === 'Surface de la parcelle (ha)' && /moment$/.test(C[23]) && /motif$/.test(C[24]) && /protection$/.test(C[25]) && L.every((r) => r.length === C.length));
  const cA = lig('CUIVRE C', 'A'), cB = lig('CUIVRE C', 'B'), fB = lig('FONGI A', 'B');
  t('⑥ la surface traitée : la parcelle entière (2,0000) ou les hectares saisis (0,4000), la parcelle à côté (1,2000)',
    cA[14] === '2,0000' && cB[14] === '0,4000' && cB[ci('Surface de la parcelle (ha)')] === '1,2000' && fB[14] === '0,4000');
  t('⑥ la cible et le mode de chaque produit', cA[10] === 'Mildiou(s)' && fB[10] === 'Black rot' && cA[11] === 'Pulvérisation');
  t('⑥ la rentrée de la parcelle de la ligne : la plus précoce donne le délai ; les autres suivent, dans l’ordre',
    cA[7] === '03:15' && cB[7] === '03:15' && cA[23] === '14/11/2026 21:15' && cB[23] === '14/11/2026 21:15 | 15/11/2026 07:30' && cB[24] === 'Bâches | Relevage' && cB[25] === 'Bottes | Gants');
  t('⑥ la cuve : le produit sans rentrée déclarée sur sa ligne n’en porte pas ; l’ancien « DRE anticipé » sort tel qu’il a été tapé',
    fB[7] === '' && fB[23] === '' && lig('FONGI A', 'C')[7] === '6h — relevage');
  t('⑥ une parcelle sans surface connue : la case reste vide (jamais « 0,0000 »)', lig('FONGI A', 'C')[14] === '' && lig('FONGI A', 'C')[22] === '');
  // ⑦ l'IFT compte la part traitée
  const I = X._iftCalc(2026), P = {}; I.rows.forEach((r) => { P[r.nom] = r; });
  t('⑦ IFT : B n’a été traitée qu’au tiers (0,4 sur 1,2) — elle compte 0,5 ÷ 3 + 1 ÷ 1,5 ÷ 3 à la cible (Black rot, 1,5)',
    proche(P.B.hb, (2 / 4 + 1 / 1.5) * (0.4 / 1.2)), JSON.stringify(P.B));
  t('⑦ IFT : A entière, et le domaine pondéré par les surfaces des parcelles', proche(P.A.hb, 2 / 4 + 1 / 1.5 + 2 / 1.5) && proche(I.hb, (P.A.hb * 2 + P.B.hb * 1.2) / 3.2), JSON.stringify([P.A.hb, I.hb]));
  const Ia = monde(S, { sansAide: true })._iftCalc(2026), Pa = {}; Ia.rows.forEach((r) => { Pa[r.nom] = r; });
  t('⑦ sans utils.js de ce lot : la parcelle entière, comme avant', proche(Pa.B.hb, 2 / 4 + 1 / 1.5), JSON.stringify(Pa.B));
  // ⑧ La Réserve et le coût consomment les hectares traités
  t('⑧ La Réserve : 2 kg/ha sur 2,4 ha traités (A entière + 0,4 de B) = 4,8 kg', proche(X._treatSurface(T[0]), 2.4) && proche(X._conso({ nom: 'CUIVRE C' }).q, 4.8), X._conso({ nom: 'CUIVRE C' }).q);
  const E = X._ecoPhytoByParc({ d0: '2026-11-01', d1: '2026-11-30' });
  t('⑧ le coût phyto : B ne paie que ses 0,4 ha (cuivre 2 × 0,4 × 10 € + fongicide 1 × 0,4 × 20 €)', proche(E.cost.B, 8 + 8) && proche(E.cost.A, 40 + 40), JSON.stringify(E.cost));
  // ⑨ les fils
  const P0 = S.phy;
  t('⑨ l’assistant : plus de « DRE anticipé » tapé d’avance ; le mode d’application ; la cible de chaque produit ; la zone des surfaces',
    !P0.includes('id="trat-dre"') && P0.includes('<select id="trat-mode" class="mvchamp"') && P0.includes('+_tratCibleFieldHtml(p,i)+') && P0.includes("+'<div id=\"trat-surf-zone\">'+_tratSurfZoneHtml()+'</div>'")
    && P0.includes('_trat.produits.push({nom:m.nom,cible:_phyCibleDefaut(m.nom,m.amm),'));
  t('⑨ une coche relit d’abord les hectares tapés (ils suivent l’ordre des parcelles) ; une décochée perd sa surface',
    P0.includes('window._tratToggleParc=function(nom){\n  _tratSaveSurf();') && P0.includes('delete _trat.surfT[nom];}') && P0.includes('window._teToggleParc=function(nom){ _teSaveSurf();'));
  t('⑨ l’enregistrement : la cible du produit, le mode, la surface en partie seulement (traitement et session), jamais de champ vide pour Firestore',
    P0.includes('cible:String(p.cible||\'\').trim(),') && P0.includes("mode:_trat.mode||'',modeAb:_trat.modeAb,note:_trat.note,sessionId:sid};") && P0.includes('if(hasT) rec.surfTraitee=Object.assign({},sT);')
    && P0.includes('if(hasT) ses.surfTraitee=Object.assign({},sT);') && !P0.includes('dreAnticipe:_trat.dreAnticipe'));
  t('⑨ la fiche : cible et mode, surface traitée, rentrées et « Déclarer une rentrée anticipée » ; le délai de réentrée court depuis la fin du traitement',
    P0.includes('${_phDetCibleHtml(t)}') && P0.includes('${_phDetParcHtml(t)}') && P0.includes('${_phDetRentHtml(idx,t,_canEd)}') && P0.includes('data-tuto="phy.rentree" onclick="window._phRentreeOuvrir(')
    && P0.includes('const draeR=(draeH>0&&_fin)?'));
  t('⑨ la déclaration va sur toute la cuve, l’heure de fin tapée aussi (et sur la session) ; la fiche se rouvre à jour',
    P0.includes('_phSessionLignes(t).forEach(function(o){\n    if(hf) o.heureFin=hf;') && P0.includes('se.heureFin=hf; }); saveData(\'sessions\'); }') && P0.includes('if(det) openTraitDetail(idx);'));
  t('⑨ la modification : cible, mode, surfaces ; l’ancien « DRE anticipé » ne se montre que s’il existe',
    P0.includes('<input type="text" id="te-cible" list="te-cibles"') && P0.includes('<select id="te-mode" class="fsel">') && P0.includes("(t.dreAnticipe?'<div style=\"margin-bottom:14px\"><span class=\"mvchamp-l\" style=\"margin-bottom:6px\">Rentrée anticipée (saisie d’avant)</span>")
    && P0.includes("<div id=\"te-parc-grid\" style=\"display:flex;flex-wrap:wrap;gap:6px\"></div><div id=\"te-surf-zone\"></div>"));
  t('⑨ le panneau d’export dit ce que contient la colonne de surface ; le PDF écrit les rentrées, la cible et les hectares traités',
    S.rg.includes('Surface trait\\u00e9e (ha)\\u00a0\\u00bb reprend les hectares saisis') && S.reg.includes('_rt.forEach(r=>bits.push(`<b>Rentrée anticipée ') && S.reg.includes('ha traités${_part?') && S.reg.includes("${t.cible?`<div class=\"sub-line\">${_escHtml(t.cible)}</div>`:''}"));
  t('⑨ sur ordinateur : la fiche dit la surface en partie, le mode, les rentrées ; « Ouvrir le traitement » porte l’étiquette du tuto ; la réentrée depuis la fin',
    S.trc.includes("reg.push(['Application',t.mode]);") && S.trc.includes("window._phRentrees(t):[]).forEach(function(r){ reg.push(['Rentr") && S.trc.includes('data-tuto="phy.ouvrir.pc"') && S.trc.includes('var dApp=(typeof window._phFinApp===\'function\')?window._phFinApp(t):d0;'));
  t('⑩ le tuto « rentrée anticipée » : ses gestes, son traitement d’entraînement chargé pour lui seul ; « Retirer » exempté, motivé',
    S.tu.includes("couvre: ['_phRentreeOuvrir', '_phRentreeMaj', '_phRentreeParc', '_phRentreeValider']") && S.tu.includes("if (String(window.__MV_TUTO || '') === 'rentree' && typeof window.applyFbData === 'function')")
    && /"_phRentreeSuppr": "REG27-1A/.test(S.cov));
  t('⑩ l’aide, l’info de l’IFT et du délai de rentrée, le guide, l’annonce 11.02',
    S.ut.includes("['Une rentrée anticipée', \"— revenir dans une parcelle avant la fin du délai") && S.ut.includes('Une parcelle traitée <b>en partie</b> compte pour sa part') && S.ut.includes('se <b>déclare</b> après coup, sur la fiche du traitement')
    && S.g07.includes('<h3>{ic:chrono} Une rentrée anticipée</h3>') && S.g11.includes('Une parcelle traitée <b>en partie</b> compte pour sa') && /v: '11\.02'[\s\S]{0,400}Le registre 2027 se remplit à la saisie/.test(S.wn));
  t('⑪ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-reg27a.mjs'") > 0 && S.liste.indexOf("mv-harnais-reg27a.mjs --contre'") > 0);
}
if (!CONTRE) {
  console.log('\n\x1b[1mMA VIGNE — Harnais REG27-1A · scénarios\x1b[0m');
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n\x1b[1mMA VIGNE — Harnais REG27-1A · contre-épreuves\x1b[0m');
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (S[cle].split(a).length !== 2) throw new Error('ancre absente ou multiple : ' + a.slice(0, 50)); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['la surface saisie est ignorée (toujours la parcelle entière)', m('ut', 'if(v==null||v<0) return s;', 'return s;')],
    ['la surface saisie n’est plus plafonnée à la parcelle', m('ut', 'return s>0?Math.min(v,s):v;', 'return v;')],
    ['la valeur égale à la parcelle reste une « partie »', m('phy', 'if(ha>0&&v>=ha-0.00005) delete o[nom]; else o[nom]=Math.round(v*10000)/10000;', 'o[nom]=Math.round(v*10000)/10000;')],
    ['la cible du premier usage E-Phy est choisie à la place du vigneron', m('phy', "return e.length===1?e[0]:'';", "return e.length?e[0]:'';")],
    ['l’historique ne passe plus devant E-Phy', m('phy', 'var v=_phyCiblesVues(nom); if(v.length) return v[0];', 'var v=[];')],
    ['le délai sans zéro devant les heures', m('phy', "return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;", "return h+':'+(m<10?'0':'')+m;")],
    ['le délai qui borne ne lit que le produit de la fiche', m('phy', 'function _phDreSession(t){ var mx=0; _phSessionLignes(t).forEach(', 'function _phDreSession(t){ var mx=0; [t].forEach(')],
    ['une rentrée au-delà du délai s’enregistre', m('phy', 'if(dre>0&&min>=dre*60) return', 'if(dre>0&&min>=dre*6000) return')],
    ['le fichier écrit la parcelle entière sous « Surface traitée »', m('rg', "(st>0?_phCsvNum(st,4):''),", "(sp>0?_phCsvNum(sp,4):''),")],
    ['le délai du fichier redevient le texte tapé d’avance', m('rg', "(rs.length ? window._phRentreeDelai(t, rs[0]) : (t.dreAnticipe||'')),", "(t.dreAnticipe||''),")],
    ['une rentrée sort sur toutes les parcelles du traitement', m('rg', 'r.parcelles.indexOf(nom)>=0; });', 'true; });')],
    ['la cible et le mode ne sortent plus au fichier', m('rg', "(t.cible||''), (t.mode||''),", "'', '',")],
    ['l’IFT compte la parcelle entière', m('pil', 'var w=_iftPart(t,q);', 'var w=1;')],
    ['La Réserve consomme la parcelle entière', m('rsv', "  if(typeof window._mvSurfTTot==='function') return window._mvSurfTTot(e);\n", '')],
    ['le coût phyto paie la parcelle entière', m('pil', "      if(surf>0&&typeof window._mvSurfT==='function') surf=window._mvSurfT(e,nom,surf);", '')],
    ['une coche ne relit plus les hectares tapés', m('phy', 'window._tratToggleParc=function(nom){\n  _tratSaveSurf();', 'window._tratToggleParc=function(nom){')],
    ['le traitement d’entraînement se charge pour tous les tutos', m('tu', "if (String(window.__MV_TUTO || '') === 'rentree' && typeof window.applyFbData === 'function')", "if (typeof window.applyFbData === 'function')")],
    ['l’aide ne dit plus la rentrée anticipée', m('ut', "['Une rentrée anticipée', \"— revenir dans une parcelle avant la fin du délai", "['Un retour', \"— revenir dans une parcelle avant la fin du délai")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-reg27a.mjs'").join("mv-harnais-reg27Z.mjs'") })]];
  let rougit = 0;
  for (const [nom, f] of mutants) {
    let S; try { S = f(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté : ' + nom + ' (' + e.message + ')'); continue; }
    const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S); } catch (e) { ko++; } console.log = log;
    if (ko) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + ko + ')\x1b[0m'); } else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
  }
  console.log('\n  ' + rougit + '/' + mutants.length + ' contre-épreuves rougissent\n');
  process.exit(rougit === mutants.length ? 0 : 1);
}
