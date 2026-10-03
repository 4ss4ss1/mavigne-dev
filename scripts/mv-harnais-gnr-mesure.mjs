#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS GNR-M (§213) — LE TRACTEUR SUR LES TRAVAUX EN COURS, LA CONSO MESURÉE
   Lancer :  node scripts/mv-harnais-gnr-mesure.mjs            (scénarios)
             node scripts/mv-harnais-gnr-mesure.mjs --contre   (contre-épreuves)
   Méthode §6b (harnais INTÉGRÉ) : on n'invente aucun moteur. Le bloc
   _pilCkAlertes → _pilPanelConso est EXTRAIT de src/pilotage.js, ainsi que les
   helpers réels qu'il appelle (_pilEsc, _pilNum, _pilDfr, _pilStat, _pilTile,
   _pilIco, _pilIcoFor, _ecoCfg), puis exécuté dans un vm sous horloge figée.
   Ce qui est prouvé :
   ① la conso = Σ litres ÷ Σ heures notées entre deux pleins ; le premier plein
     ne compte pas ; deux pleins le même jour n'en font qu'un ; un intervalle sans
     heure est écarté ; un plein sans litres est compté à part ; les heures du
     jour du plein vont à l'intervalle qui FINIT ce jour-là ;
   ② un travail lancé couvre le domaine : arrachées et désactivées hors, cochées
     déduites ; « Terminé » et « plus rien à faire » sortent ; la session
     Amendement n'est jamais un périmètre ; l'apport compte ses parcelles en
     attente, sur la campagne seulement ;
   ③ la révision se place dans les travaux du tracteur, dans l'ordre de lancement ;
   ④ le rendu : aucun undefined/NaN, balises équilibrées, largeurs bornées.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SRC = readFileSync('src/pilotage.js', 'utf8');
const PHY = readFileSync('src/phyto.js', 'utf8');

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); }
  }
  throw new Error('accolades : ' + nom);
}
function bloc(src) {
  const a = src.indexOf('function _pilCkAlertes(d){');
  const b = src.indexOf("// ── Onglet AUJOURD'HUI (cockpit) ──");
  if (a < 0 || b < 0 || b < a) throw new Error('bloc GNR-M introuvable');
  return src.slice(a, b);
}
function icoTable(src) {
  const m = src.match(/var _PIL_TILE_ICO=\{[\s\S]*?\};/);
  if (!m) throw new Error('_PIL_TILE_ICO introuvable');
  return m[0];
}

const RealDate = Date;
const FIXED = new RealDate('2026-06-16T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXED); }
FakeDate.prototype = RealDate.prototype;
FakeDate.now = () => FIXED;
FakeDate.parse = RealDate.parse;
FakeDate.UTC = RealDate.UTC;

const ts = iso => new RealDate(iso + 'T15:00:00').getTime();

function monde() {
  return {
    PARCELLES: [
      { nom: 'A', surface: 1.0 }, { nom: 'B', surface: 0.5 }, { nom: 'C', surface: 0.8 },
      { nom: 'D', surface: 0.4, statut: 'Arrachee' }, { nom: 'E', surface: 0.3 },
    ],
    ACTIVITES: [
      { nom: 'Rognage', h_ha: 2, tracteurDefautId: 't1' },
      { nom: 'Griffage', h_ha: 3, tracteurDefautId: 't2' },
      { nom: 'Effeuilleuse', h_ha: 1, tracteurDefautId: 't2' },
      { nom: 'Amendement', h_ha: 1.5, tracteurDefautId: 't1' },
      { nom: 'Inconnu' },
      { nom: 'Traitement', h_ha: 1.3, tracteurDefautId: 't2' },
    ],
    ENTRETIENS: [
      { tracteurId: 't1', date: '2026-05-01', plein: true, litres_plein: 50 },
      { tracteurId: 't1', date: '2026-05-10', plein: true, litres_plein: 60 },
      { tracteurId: 't1', date: '2026-05-15', plein: true },
      { tracteurId: 't1', date: '2026-05-20', plein: true, litres_plein: 40 },
      { tracteurId: 't1', date: '2026-05-20', plein: true, litres_plein: 20 },
      { tracteurId: 't1', date: '2026-05-25', plein: true, litres_plein: 30 },
      { tracteurId: 't1', date: '2026-05-26', plein: false, litres_plein: 99 },
      { tracteurId: 't2', date: '2026-05-05', plein: true, litres_plein: 80 },
    ],
    SESSIONS: [
      { id: 'H1', activite: 'Rognage', statut: 'Terminé', date: '2026-05-01', parcellesFaites: [{ nom: 'A', dmin: 120, t1: ts('2026-05-01') }] },
      { id: 'H2', activite: 'Rognage', statut: 'Terminé', date: '2026-05-05', parcellesFaites: [{ nom: 'A', dmin: 300, t1: ts('2026-05-05') }, 'B'] },
      { id: 'H3', activite: 'Rognage', statut: 'Terminé', date: '2026-05-10', parcellesFaites: [{ nom: 'C', dmin: 60, t1: ts('2026-05-10') }] },
      { id: 'H4', activite: 'Rognage', statut: 'Terminé', date: '2026-05-12', parcellesFaites: [{ nom: 'A', dmin: 240, t1: ts('2026-05-12') }, { nom: 'C' }] },
      { id: 'H5', activite: 'Rognage', statut: 'Terminé', date: '2026-05-20', parcellesFaites: [{ nom: 'E', dmin: 180, t1: ts('2026-05-20') }] },
      { id: 'SG', activite: 'Effeuilleuse', statut: 'En cours', date: '2026-05-01', parcellesFaites: [{ nom: 'A', t1: ts('2026-05-02') }] },
      { id: 'SB', activite: 'Griffage', statut: 'En cours', date: '2026-06-09', tracteurId: 't2', parcellesFaites: [] },
      { id: 'SA', activite: 'Rognage', statut: 'En cours', date: '2026-06-12', parcellesSkip: ['E'], parcellesFaites: [{ nom: 'A', t1: ts('2026-06-12') }] },
      { id: 'SC', activite: 'Griffage', statut: 'Terminé', date: '2026-06-01', tracteurId: 't2', parcellesFaites: ['A'] },
      { id: 'SD', activite: 'Griffage', statut: 'En cours', date: '2026-06-02', tracteurId: 't2', parcellesFaites: ['A', 'B', 'C', 'E'] },
      { id: 'SE', activite: 'Amendement', statut: 'En cours', date: '2026-06-13', tracteurId: 't2', parcellesFaites: [] },
      { id: 'SF', activite: 'Inconnu', statut: 'En cours', date: '2026-06-15', tracteurId: 't1', parcellesFaites: [] },
      { id: 'H6', activite: 'Traitement', statut: 'Terminé', date: '2026-05-22', tracteurId: 't2', parcellesFaites: [{ nom: 'A', dmin: 90, t1: ts('2026-05-22') }, 'C'] },   // chrono 1,5 h/ha sur 1 ha
      { id: 'H7', activite: 'Traitement', statut: 'Terminé', date: '2026-06-03', tracteurId: 't2', parcellesFaites: [{ nom: 'B', dmin: 30, t1: ts('2026-06-03') }] },        // chrono 1 h/ha sur 0,5 ha
    ],
    INTRANTS: { fertil: [
      { id: 'op1', cree: '2026-06-12T08:00:00', parcs: ['A', 'B', 'D'] },
      { id: 'op2', cree: '2026-06-01', parcs: ['C'] },
      { id: 'op3', cree: '2025-06-01', parcs: ['E'] },
    ] },
    FAITS: { op1: { A: { date: '2026-06-13' } }, op2: { C: { date: '2026-06-02' } }, op3: {} },
  };
}

function charger(src, o = {}) {
  const W = monde();
  const ctx = {
    console, Math, JSON, Object, Array, String, Number, isFinite, parseFloat, Date: FakeDate,
    PARCELLES: W.PARCELLES, ACTIVITES: W.ACTIVITES, ENTRETIENS: W.ENTRETIENS, SESSIONS: W.SESSIONS, INTRANTS: W.INTRANTS,
    CONFIG: { eco: {}, features: { trait_cuve: o.flag === undefined ? true : o.flag } }, _PIL_STATE: {},
    _sessInSaison: s => !!s,
    _pilSaison: () => ({ nom: '2026' }),
    _saisonForDate: iso => (iso >= '2025-11-01' && iso <= '2026-10-31') ? '2026' : '2025',
    getSaisonActive: () => ({ nom: '2026' }),
    _ferFaits: () => W.FAITS,
    _mvIcon: n => '<svg data-ic="' + n + '"></svg>',
    _mvInfoBtn: k => '<button class="mv-i" data-info="' + k + '">i</button>',
    tNom: n => n,
    TRACTEURS_LIST: [{ id: 't1', nom: 'NH' }, { id: 't2', nom: 'Bobard', traitementOnly: true }],
    _pilProtData: () => (o.prot || { n: 5, nu: [1, 2], bientot: [] }),
    _pilTreatDays: () => (o.days === undefined ? [{ label: 'demain', start: 6, end: 11 }] : o.days),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const code = [icoTable(src), corps(src, '_pilEsc'), corps(src, '_pilNum'), corps(src, '_pilTnom'), corps(src, '_pilDfr'),
    corps(src, '_pilStat'), corps(src, '_pilIco'), corps(src, '_pilIcoFor'), corps(src, '_pilTile'), corps(src, '_ecoCfg'), bloc(src)].join('\n');
  vm.runInContext(code, ctx, { filename: 'gnrm-extrait.js' });
  return { ctx, W };
}

function scenarios(src, journal) {
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => {
    if (cond) { ok++; if (journal) console.log('  \x1b[32m✓\x1b[0m ' + nom); }
    else { ko++; if (journal) console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); }
  };
  const proche = (a, b, e = 1e-6) => a != null && Math.abs(a - b) < e;
  const _n = v => Math.round(v).toLocaleString('fr-FR');
  let C;
  try { C = charger(src); } catch (e) { t('le bloc s’extrait et s’exécute', false, e.message); return { ok, ko }; }
  const X = C.ctx;
  try {
    // ① LA CONSO MESURÉE
    const c1 = X._pilGmConso('t1');
    t('① t1 : deux intervalles valides, un écarté', c1.nOk === 2 && c1.nEc === 1, JSON.stringify({ nOk: c1.nOk, nEc: c1.nEc }));
    t('① le premier plein ne compte pas, deux pleins le même jour = un seul (120 L)', c1.L === 120, c1.L);
    t('① heures : jour du plein précédent exclu, jour du plein inclus (15,6 h)', proche(c1.H, 15.6), c1.H);
    t('① heures chronométrées séparées du barème (13 h)', proche(c1.Hc, 13), c1.Hc);
    t('① moyenne PONDÉRÉE : 120 ÷ 15,6 = 7,69 L/h', c1.ok && proche(c1.lh, 120 / 15.6), c1.lh);
    t('① un plein sans litres est compté à part (1), une fiche sans « plein » ignorée', c1.nSans === 1, c1.nSans);
    const iv1 = c1.iv[0];
    t('① premier intervalle : 60 L sur 7 h dont 6 h chrono', iv1 && iv1.l === 60 && proche(iv1.h, 7) && proche(iv1.hc, 6), JSON.stringify(iv1));
    const c2 = X._pilGmConso('t2');
    t('① un seul plein : pas de mesure, ok=false', !c2.ok && c2.lh === null && c2.iv.length === 0, JSON.stringify(c2));
    t('① tracteur inconnu : rien, sans planter', X._pilGmConso('zz').ok === false && X._pilGmConso('').ok === false);

    // ② LES TRAVAUX EN COURS
    const T = X._pilGmTravaux();
    const ids = T.jobs.map(j => j.id);
    t('② cinq travaux, dans l’ordre de lancement', JSON.stringify(ids) === JSON.stringify(['SG', 'SB', 'SA', 'op1', 'SF']), JSON.stringify(ids));
    t('② « Terminé » sort, et « plus rien à faire » sort aussi', ids.indexOf('SC') < 0 && ids.indexOf('SD') < 0);
    t('② la session Amendement n’est jamais un périmètre', ids.indexOf('SE') < 0);
    t('② le domaine = parcelles non arrachées (2,6 ha)', proche(T.domaine, 2.6), T.domaine);
    const SA = T.jobs.find(j => j.id === 'SA');
    t('② SA : arrachée et désactivée hors, cochée déduite → 1,3 ha sur 2,3 ha', SA && proche(SA.resteHa, 1.3) && proche(SA.perHa, 2.3) && SA.nSkip === 1, SA && JSON.stringify([SA.resteHa, SA.perHa]));
    t('② SA : tracteur par défaut de l’activité (t1), heures au barème (2,6 h)', SA && SA.tid === 't1' && proche(SA.h, 2.6));
    t('② SA : litres à la conso MESURÉE de t1 (2,6 × 7,69 = 20 L)', SA && SA.src === 'mesure' && proche(SA.l, 2.6 * 120 / 15.6), SA && SA.l);
    const SB = T.jobs.find(j => j.id === 'SB');
    t('② SB : tracteur de la session (t2), repli sur le réglage 6 L/h → 46,8 L', SB && SB.tid === 't2' && SB.src === 'reglage' && proche(SB.l, 46.8), SB && JSON.stringify([SB.tid, SB.src, SB.l]));
    const op = T.jobs.find(j => j.id === 'op1');
    t('② apport : parcelles en attente seulement (B, 0,5 ha), arrachée hors (1,5 ha choisis)', op && proche(op.resteHa, 0.5) && proche(op.perHa, 1.5) && op.nSel === 2, op && JSON.stringify([op.resteHa, op.perHa, op.nSel]));
    t('② apport : tracteur de la session Amendement ouverte (t2), marqué lancé', op && op.tid === 't2' && op.lance === true && proche(op.h, 0.75));
    t('② apport fini ou d’une autre campagne : rien', ids.indexOf('op2') < 0 && ids.indexOf('op3') < 0);
    const SF = T.jobs.find(j => j.id === 'SF');
    t('② sans barème : heures et litres absents (null), jamais zéro', SF && SF.h === null && SF.l === null);
    const SG = T.jobs.find(j => j.id === 'SG');
    t('② session sans coche depuis 45 j : signalée (> 21 j)', SG && SG.dormJ > 21 && SB.dormJ <= 21, SG && SG.dormJ);

    // ③ LA RÉVISION
    const d = { tracs: [{ id: 't1', nom: 'New Holland', revReste: 3 }, { id: 't2', nom: 'Bobard', revReste: 8 }], gnr: { capacite: 1500, niveau: 410, seuil: 300 }, refDate: '2026-06-16' };
    const R = X._pilGmRevision(d, T);
    t('③ la révision atteinte pendant un travail passe devant une révision plus proche mais hors travaux', R && R.t.id === 't2', R && R.t.id);
    t('③ bout à bout dans l’ordre : atteinte pendant le Griffage (après 1,6 h d’effeuillage)', R && R.dans && R.dans.job.id === 'SB' && proche(R.dans.pc, 6.4 / 7.8), R && R.dans && JSON.stringify([R.dans.job.id, R.dans.pc]));
    const R2 = X._pilGmRevision({ tracs: [{ id: 't1', nom: 'NH', revReste: 3 }, { id: 't3', nom: 'Vieux', revReste: -5 }] }, T);
    t('③ une révision dépassée passe en premier', R2 && R2.t.id === 't3');
    t('③ loin (> 120 h) et hors des travaux : aucune carte', X._pilGmRevision({ tracs: [{ id: 't1', nom: 'NH', revReste: 400 }] }, T) === null);
    const R3 = X._pilGmRevision({ tracs: [{ id: 't1', nom: 'NH', revReste: 3 }] }, T);
    t('③ un travail sans barème est compté à part', R3 && R3.sansBareme === 1 && proche(R3.tot, 2.6), R3 && JSON.stringify([R3.sansBareme, R3.tot]));

    // ④ LE RENDU
    const H = X._pilCkTracteur(d);
    const nRows = (H.match(/class="pil-trx-job"/g) || []).length;
    t('④ une ligne par travail en cours (5)', nRows === 5, nRows);
    t('④ cartes : travaux, révision, cuve', H.includes('Travaux tracteur en cours') && H.includes('Révision · Bobard') && H.includes('Cuve GNR'));
    t('④ la session oubliée est signalée, une seule', (H.match(/aucune parcelle cochée depuis/g) || []).length === 1);
    const apres = 410 - (1.6 * 6) - 46.8 - (2.6 * 120 / 15.6) - (0.75 * 6);
    t('④ la cuve après les travaux = 410 − Σ litres (' + Math.round(apres) + ' L)', H.includes(Math.round(apres).toLocaleString('fr-FR') + ' L après les travaux en cours'));
    t('④ le travail sans barème est dit, pas compté', H.includes('1 travail sans barème, non compté'));
    // TRAIT-CUVE (§221) : le traitement conseille, en pointille
    const lT = 2.6 * (2 / 1.5) * 6, apT = apres - lT;
    t('⑥ traitement conseillé : 2 parcelles à nu + fenêtre demain → pointillé, domaine × cadence MESURÉE (2 h chrono ÷ 1,5 ha = 1,33 h/ha, pas le barème 1,3) × 6 L/h (−21 L)', H.includes('(conseillé)') && H.includes('\u2212' + _n(lT)) && H.includes(_n(apT) + ' L') && H.includes('Avec ce traitement') && H.includes('fenêtre demain 6h\u219211h') && H.includes('cadence mesurée sur 2 traitements'), H.slice(H.indexOf('Après les travaux'), H.indexOf('Après les travaux') + 400));
    const M = X._pilGmHhaMesure('Traitement');
    t('⑥ cadence mesurée : minutes chronométrées ÷ hectares chronométrés (la parcelle C, sans chrono, ne compte pas)', M && proche(M.hha, 2 / 1.5) && M.n === 2 && proche(M.ha, 1.5));
    t('⑥ moins de 0,5 ha chronométré : pas de mesure, le barème reprend', X._pilGmHhaMesure('Griffage') === null && (() => { const Y = charger(src).ctx; Y.SESSIONS.splice(Y.SESSIONS.findIndex(x => x.id === 'H6'), 1); Y.SESSIONS.splice(Y.SESSIONS.findIndex(x => x.id === 'H7'), 1); return Y._pilCkTracteur(d).includes('(barème)'); })());
    t('⑥ interrupteur éteint (CONFIG.features.trait_cuve absent) : pas de pointillé', !charger(src, { flag: false }).ctx._pilCkTracteur(d).includes('(conseillé)'));
    t('⑥ rien à nu : pas de pointillé', !charger(src, { prot: { n: 5, nu: [], bientot: [] } }).ctx._pilCkTracteur(d).includes('(conseillé)'));
    t('⑥ aucune fenêtre dans les 5 jours : pas de pointillé', !charger(src, { days: [{ label: 'demain', start: null }] }).ctx._pilCkTracteur(d).includes('(conseillé)'));
    t('⑥ traitement déjà lancé : il est dans les travaux, pas en pointillé', (() => { const Y = charger(src).ctx; Y.SESSIONS.push({ id: 'ST', activite: 'Traitement', statut: 'En cours', date: '2026-06-16', tracteurId: 't2', parcellesFaites: [] }); const h = Y._pilCkTracteur(d); return !h.includes('(conseillé)') && (h.match(/class="pil-trx-job"/g) || []).length === 6; })());
    t('④ cascade : échelle arrondie au-dessus du niveau du jour (410 L → 500 L), pas la capacité', H.includes('<span>500 L</span>') && !H.includes('<span>1 500 L</span>'));
    t('④ aucun undefined / NaN', !/undefined|NaN/.test(H));
    const bal = (o, f) => (H.match(new RegExp('<' + o + '[ >]', 'g')) || []).length === (H.match(new RegExp('</' + o + '>', 'g')) || []).length;
    t('④ <div> et <span> équilibrés', bal('div') && bal('span'));
    t('④ aucun <div> dans un <button>', !/<button[^>]*>(?:(?!<\/button>)[\s\S])*<div/.test(H));
    const larg = [...H.matchAll(/(?:width|left):(-?[\d.]+)%/g)].map(m => +m[1]);
    t('④ largeurs et positions entre 0 et 100 %', larg.length > 0 && larg.every(v => v >= 0 && v <= 100), JSON.stringify(larg.filter(v => v < 0 || v > 100)));
    const A1 = X._pilCkAlertes({ tracs: [{ id: 't1', nom: 'NH', revReste: 3, rep: { motif: 'embrayage' } }], gnr: null, refDate: '2026-06-16' });
    t('④ la liste garde les machines immobilisées, la révision n’y est plus une ligne', A1.includes('immobilisé') && !A1.includes('Révision <b>') && A1.includes('pil-trx'));
    X.SESSIONS.length = 0; X.INTRANTS.fertil.length = 0;
    const A2 = X._pilCkAlertes({ tracs: [{ id: 't1', nom: 'NH', revReste: 400 }], gnr: { capacite: 1500, niveau: 900, seuil: 300 } });
    t('④ rien en cours, rien d’immobilisé, cuve haute : la phrase de calme', A2.includes('Rien à signaler'));
    const A3 = X._pilCkAlertes({ tracs: [], gnr: { capacite: 1500, niveau: 250, seuil: 300 } });
    t('④ sans travail, une cuve sous le seuil garde sa carte', A3.includes('250 L, sous le seuil') && !A3.includes('Rien à signaler'));
    t('④ l’échelle suit le seuil quand il dépasse le niveau (300 L → 400 L)', A3.includes('<span>400 L</span>'));
    // la conso se calcule sur ENTRETIENS + SESSIONS : on recharge le monde pour la tuile
    const C2 = charger(src);
    const P = C2.ctx._pilPanelConso({ tracs: [{ id: 't1', nom: 'NH' }, { id: 't2', nom: 'Bobard' }] });
    t('④ tuile conso : 7,7 L/h mesurés pour t1, réglage dit pour t2', P.includes('<b>7,7</b> L/h') && P.includes('réglage 6,0 L/h utilisé'), P.slice(0, 200));
    t('④ tuile conso : la flotte ne compte que les mesures crues (7,7)', P.includes('<b>7,7</b> L/h</span>') || P.includes('<b>7,7</b>'));
    t('④ tuile conso : aucun undefined / NaN', !/undefined|NaN/.test(P));

    // ⑤ ÉPINGLAGE
    const fer = (PHY.match(/var FER_ACT\s*=\s*'([^']+)'/) || [])[1];
    const pil = (src.match(/var _PIL_GM_FER\s*=\s*'([^']+)'/) || [])[1];
    t('⑤ le nom de l’activité Amendement est le même que dans phyto.js', fer && fer === pil, fer + ' / ' + pil);
  } catch (e) { t('les scénarios s’exécutent sans planter', false, e.stack); }
  return { ok, ko };
}

console.log('\n\x1b[1mMA VIGNE — Harnais GNR-M · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
if (!CONTRE) {
  const r = scenarios(SRC, true);
  console.log('\n  ' + r.ok + ' vertes, ' + r.ko + ' rouges\n');
  process.exit(r.ko ? 1 : 0);
}
const DEFAUTS = [
  ['les parcelles désactivées comptent de nouveau', 'skip.indexOf(p.nom)<0', 'true'],
  ['le statut « Terminé » est ignoré', "if(se.statut!=='En cours'||se.activite===_PIL_GM_FER) return;", 'if(se.activite===_PIL_GM_FER) return;'],
  ['la session Amendement redevient un périmètre', "if(se.statut!=='En cours'||se.activite===_PIL_GM_FER) return;", "if(se.statut!=='En cours') return;"],
  ['le jour du plein précédent est recompté', 'if(dd>a&&dd<=b)', 'if(dd>=a&&dd<=b)'],
  ['la moyenne n’est plus pondérée', 'out.lh = out.ok ? out.L/out.H : null;', 'out.lh = out.ok ? out.iv[0].lh : null;'],
  ['l’apport recompte ses parcelles déjà faites', 'var att=noms.filter(function(n){ return !r[n]; });', 'var att=noms.filter(function(n){ return true; });'],
  ['un travail fini ne sort plus', 'if(!reste.length) return;   // fini', '/* */   // fini'],
  ['un apport d’une autre campagne se projette', "if(!_pilGmInCamp(c0)) return;", ''],
  ['la cadence mesurée est ignorée au profit du barème', 'var M=_pilGmHhaMesure(act.nom), hha=M?M.hha:(parseFloat(act.h_ha)||0);', 'var M=null, hha=(parseFloat(act.h_ha)||0);'],
  ['une parcelle sans chrono compte dans la cadence mesurée', "if(!x||typeof x!=='object'||typeof x.dmin!=='number'||!(x.dmin>0)) return;", "if(!x) return; if(typeof x!=='object'){ x={nom:x,dmin:60}; } if(!(x.dmin>0)) return;"],
  ['l’interrupteur ne retient plus rien', "if(F.trait_cuve!==true) return null;", ''],
  ['le traitement conseillé s’affiche même sans parcelle à nu', 'var nNu=P.nu.length+P.bientot.length; if(!nNu) return null;', 'var nNu=P.nu.length+P.bientot.length;'],
  ['le traitement conseillé ignore qu’il est déjà lancé', "if(T.jobs.some(function(j){ return j.kind==='session'&&j.nom===act.nom; })) return null;", ''],
  ['les arrachées comptent dans le domaine', "var actives=parcs.filter(function(p){ return p&&p.statut!=='Arrachee'; });", 'var actives=parcs.filter(function(p){ return !!p; });'],
];
let rougit = 0;
for (const [nom, a, b] of DEFAUTS) {
  const n = SRC.split(a).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté (' + n + ' occurrence) : ' + nom); continue; }
  const r = scenarios(SRC.replace(a, b), false);
  if (r.ko > 0) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')\x1b[0m'); }
  else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log('\n  ' + rougit + '/' + DEFAUTS.length + ' contre-épreuves rougissent\n');
process.exit(rougit === DEFAUTS.length ? 0 : 1);
