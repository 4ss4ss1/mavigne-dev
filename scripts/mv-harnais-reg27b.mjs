/* ───────────────────────────────────────────────────────
   HARNAIS — REG27-1B (§573) : LE REGISTRE RELU LIGNE PAR LIGNE AVANT L'EXPORT
   Lancer :          node scripts/mv-harnais-reg27b.mjs
   Contre-épreuves : node scripts/mv-harnais-reg27b.mjs --contre

   POURQUOI IL EXISTE
   « Le contrôle avant le contrôleur » (maquette « niveau au-dessus », partie 5) : le fichier du registre sortait sans rien
   dire de ce qui lui manquait — un produit sans numéro d'AMM, une parcelle sans contour, un insecticide sans horaires. Ce
   harnais JOUE src/registre.js (en entier) sur les VRAIES lignes de l'export (window._phytoCsvRows, extrait de phyto.js) pour
   un petit domaine : ce que le texte exige (SIRET, AMM à 7 chiffres, date, dose, localisation, surface), ce qu'il exige sous
   condition (les horaires d'un insecticide ou d'un produit marqué, le stade d'un produit limité à un stade, une rentrée
   anticipée qui se compte), ce qui est facultatif (cible, mode, stade hors condition) ; le verdict, les huit points de la
   carte, les traitements à reprendre, l'année civile en tête des périodes, l'année de la carte ; puis les fils : l'export
   qui s'arrête sur la vérification, « Exporter quand même », la carte de Pilotage, l'aide, le guide, l'annonce.
   Horloge figée au dimanche 15 novembre 2026.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { rg: lire('src/registre.js'), ut: lire('src/utils.js'), phy: lire('src/phyto.js'), pil: lire('src/pilotage.js'), wn: lire('src/whats-new.js'),
  aj: lire('scripts/mv-harnais-ajour1.mjs'), cov: lire('scripts/tutos-couverture.json'), g07: lire('guide/07-phyto.html'), g11: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function tranche(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('tranche introuvable : ' + a); return src.slice(i, j + b.length); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
const RealDate = Date, FIXE = new RealDate('2026-11-15T09:30:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXE); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXE; FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;

// Le domaine : A (2 ha, un contour), B (1,2 ha, sans contour), C (ni surface ni contour).
const PARC = [{ nom: 'A', surface: 2 }, { nom: 'B', surface: 1.2 }, { nom: 'C', surface: '' }];
const CATA = [{ nom: 'STADE S', stadeOblig: true }, { nom: 'HEURE H', heureOblig: true }];
const plein = { dose_val: 2, dose_unit: 'kg/ha', stade: 'Floraison (BBCH 65)', cible: 'Mildiou(s)', mode: 'Pulvérisation', heureDebut: '16:30', heureFin: '18:00' };
const tr = (o) => Object.assign({}, plein, o);
const TRAIT = () => [
  tr({ produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', drae: 48, date: '2026-06-01', parcelles: ['A'], sessionId: 's0', surfTraitee: { A: 0.5 } }),                 // 0 : complet, A en partie
  { produit: 'Maison', type: 'Fongicide', date: '2026-06-02', parcelles: ['A', 'B'], sessionId: 's1' },                                                                  // 1 : ni AMM ni dose ; B sans contour ; rien de facultatif
  tr({ produit: 'INSECTE L', amm: '2000006', type: 'Insecticide', date: '2026-06-03', parcelles: ['A'], sessionId: 's2', heureDebut: '', heureFin: '' }),               // 2 : insecticide sans horaires
  tr({ produit: 'STADE S', amm: '2000009', type: 'Fongicide', date: '2026-06-04', parcelles: ['A'], sessionId: 's3', stade: '' }),                                      // 3 : produit limité à un stade, sans stade
  tr({ produit: 'FONGI A', amm: '2000001', type: 'Fongicide', date: '2026-06-05', parcelles: ['C'], sessionId: 's4' }),                                                 // 4 : parcelle sans surface ni contour
  tr({ produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', drae: 48, date: '2026-06-06', parcelles: ['A'], sessionId: 's5',
    rentrees: [{ id: 'r1', quand: '2026-06-07T07:30', parcelles: ['A'], motif: 'Relevage', mesures: 'Gants' }] }),                                                      // 5 : une rentrée qui se compte
  tr({ produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', drae: 48, date: '2026-06-08', parcelles: ['A'], sessionId: 's6', heureFin: '',
    rentrees: [{ id: 'r2', quand: '2026-06-09T07:30', parcelles: ['A'], motif: 'Relevage', mesures: 'Gants', delai: '13:30' }] }),                                      // 6 : rentrée sans heure de fin
  tr({ produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', date: '2026-06-10', parcelles: ['A'], sessionId: 's7', dreAnticipe: '6h — relevage' }),                     // 7 : l'ancien texte libre
  tr({ produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', drae: 48, date: '2026-06-11', parcelles: ['A'], sessionId: 's8',
    rentrees: [{ id: 'r3', quand: '2026-06-14T07:30', parcelles: ['A'], motif: 'Relevage', mesures: '' }] }),                                                           // 8 : rentrée au-delà du délai, sans protections
  tr({ produit: 'HEURE H', amm: '2000010', type: 'Fongicide', date: '2026-06-12', parcelles: ['A'], sessionId: 's9', stade: '', cible: '', mode: '' }),                 // 9 : horaires dus et donnés ; le facultatif manque
  tr({ produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', date: '2025-06-01', parcelles: ['A'], sessionId: 'v1' }),                                                   // 10 : l'an dernier, complet
  tr({ produit: 'CUIVRE C', amm: '2000003', type: 'Cuivre', date: '', parcelles: ['A'], sessionId: 'x1' })];                                                            // 11 : sans date

function monde(S, o = {}) {
  const dom = {};
  const el = (id) => dom[id] || (dom[id] = { id, textContent: '', innerHTML: '', style: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, querySelector: (s) => el(s.replace(/^#/, '')) });
  const ctx = { Math, Object, Array, String, Number, JSON, isFinite, isNaN, parseInt, parseFloat, console, Date: FakeDate,
    PARCELLES: PARC, TRAITEMENTS: o.trait || TRAIT(), EPHY: [], CATALOGUE: CATA, CONFIG: { siret: o.siret === undefined ? '123 456 789 00012' : o.siret },
    document: { getElementById: (id) => (id === 'ovRegVerif' ? el('ovRegVerif') : (dom[id] || null)), createElement: () => el('neuf'), body: { appendChild() {} } },
    _mvParcGeo: (p) => (p && p.nom === 'A' ? { lat: 47.1, lng: 4.9 } : null), _dreMotif: () => '',
    _mvFenetresAnnee: () => (o.fenetres || [{ k: 'camp2026', axe: 'campagne', lbl: 'Campagne 2026-2027', sub: '', d0: '2026-08-01', d1: '2027-07-31' }, { k: 'tout', axe: 'tout', lbl: 'Tout l’historique', sub: '', d0: '', d1: '' }]),
    _mvFenFr: (iso) => { const p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso || ''); },
    __admin: o.admin !== false, __ouverts: [], __fermes: [], __fiches: [], __toasts: [] };
  ctx.openOv = (id) => ctx.__ouverts.push(id); ctx.closeOv = (e, id) => ctx.__fermes.push(id); ctx.openTraitDetail = (i) => ctx.__fiches.push(i);
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([fonction(S.ut, 'function _mvHaNum('), fonction(S.ut, 'window._mvSurfT=function(t,nom,ha){'), fonction(S.ut, 'window._mvSurfTTot=function(t){'),
    fonction(S.ut, 'export function dreEffectif(').replace(/^export /, ''),
    'function isAdmin(){ return window.__admin; } function showToast(m){ window.__toasts.push(m); } function _escHtml(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }',
    'function _escAttr(s){ return _escHtml(String(s==null?"":s).replace(/\'/g,"\\\\\'")); } function _mvIcon(n){ return "<i data-ic=\\""+n+"\\"></i>"; }'].join('\n'), ctx, { filename: 'utils-extrait.js' });
  const phy = [fonction(S.phy, 'function _phyNorm('), fonction(S.phy, 'function _phResolve('),
    fonction(S.phy, 'function _phParcHa('), fonction(S.phy, 'function _phSessionLignes('), fonction(S.phy, 'function _phDreSession('), fonction(S.phy, 'function _phFinTrait('),
    fonction(S.phy, 'function _phHhMm('), fonction(S.phy, 'function _phRentreeDelaiMin('), fonction(S.phy, 'function _phRentrees('), fonction(S.phy, 'function _phRentreeDelai('),
    "var MV_OEPP_VIGNE = 'VITVI';", fonction(S.phy, 'function _phCsvNum('), fonction(S.phy, 'function _phCsvDate('),
    fonction(S.phy, 'function _phCsvHeure('), fonction(S.phy, 'function _phCsvBbch('), fonction(S.phy, 'function _phCsvDose('), fonction(S.phy, 'function _phCsvParcs('),
    tranche(S.phy, 'var MV_PHY_CSV_COLS = [', '];'), fonction(S.phy, 'function _phCsvJour('), fonction(S.phy, 'window._phytoCsvRows = function(fen){'),
    fonction(S.phy, 'function _phytoFenAnnees('), fonction(S.phy, 'function _phytoFenetres('),
    'window._phResolve=_phResolve; window._phRentrees=_phRentrees; window._phRentreeDelaiMin=_phRentreeDelaiMin; window._phDreSession=_phDreSession; window._phytoFenetres=_phytoFenetres;'].join('\n');
  vm.runInContext(phy, ctx, { filename: 'phyto-extrait.js' });
  vm.runInContext(S.rg.replace(/^import [^\n]*\n/m, ''), ctx, { filename: 'registre.js' });
  ctx.__dom = dom;
  return ctx;
}
const AN26 = { k: 'civ2026', lbl: 'Année 2026', d0: '2026-01-01', d1: '2026-12-31' };

function jouer(S) {
  const X = monde(S), V = X._regVerif(AN26);
  const L = (i, nom) => V.lignes.find((l) => l.i === i && l.nom === nom) || { M: [], C: [] };
  const C = X.MV_PHY_CSV_COLS;
  t('① les colonnes que la vérification lit sont bien celles du fichier',
    C[2] === 'Produit' && /AMM/.test(C[3]) && /^Date/.test(C[4]) && /début$/.test(C[5]) && /fin$/.test(C[6]) && /^Délai de rentrée/.test(C[7]) && /^Dose/.test(C[8]) && /^Unité/.test(C[9])
    && C[10] === 'Cible' && /^Mode/.test(C[11]) && /^Latitude/.test(C[12]) && /^Longitude/.test(C[13]) && C[14] === 'Surface traitée (ha)' && /BBCH/.test(C[16]) && C[18] === 'Parcelle' && C[22] === 'Surface de la parcelle (ha)');
  t('① la fenêtre de l’année : 10 traitements, 11 lignes (une par produit et par parcelle) ; le traitement sans date compté à part', V.nTrait === 10 && V.nLignes === 11 && V.sansDate === 1 && V.siretOk, JSON.stringify([V.nTrait, V.nLignes, V.sansDate]));
  t('② un traitement complet ne laisse aucune ligne ; sa parcelle traitée en partie est comptée', !V.lignes.some((l) => l.i === 0) && V.nPartie === 1);
  t('② exigé : le numéro d’AMM à 7 chiffres, la dose et son unité ; la parcelle sans contour n’a pas de coordonnées',
    L(1, 'A').M.join() === 'amm,dose' && L(1, 'B').M.join() === 'amm,dose,gps' && V.m.amm === 2 && V.m.dose === 2);
  t('② exigé : une surface traitée — la parcelle sans surface ni contour', L(4, 'C').M.join() === 'gps,surface' && V.m.surface === 1 && V.m.gps === 2);
  t('③ sous condition : les horaires d’un insecticide ou d’un produit marqué « horaires » — dus sur 2 lignes, manquants sur 1',
    L(2, 'A').M.join() === 'horaires' && V.nHeureReq === 2 && V.m.horaires === 1 && !L(9, 'A').M.length);
  t('③ sous condition : le stade d’un produit limité à un stade est exigé ; ailleurs il est facultatif',
    L(3, 'A').M.join() === 'stade' && L(1, 'A').C.indexOf('stade') >= 0 && L(9, 'A').C.join() === 'stade,cible,mode' && V.m.stade === 1 && V.c.stade === 3);
  t('④ une rentrée qui se compte passe ; sans heure de fin, au-delà du délai ou sans protections, elle est à reprendre',
    !V.lignes.some((l) => l.i === 5) && L(6, 'A').M.join() === 'rfin' && L(8, 'A').M.join() === 'rapres,rmotif' && V.nRentrees === 3);
  t('④ l’ancien « DRE anticipé » en texte libre est à redéclarer', L(7, 'A').M.join() === 'rtexte');
  t('⑤ le facultatif (cible, mode) est compté, jamais reproché : 8 lignes à compléter sur 11, dans 7 traitements', V.nManque === 8 && V.nTraitManque === 7 && V.c.cible === 3 && V.c.mode === 3, JSON.stringify([V.nManque, V.nTraitManque, V.c]));
  // le verdict
  const vd = X._regVerdict(V);
  const propre = () => [TRAIT()[0], TRAIT()[5], TRAIT()[10]];
  const Xp = monde(S, { trait: propre() }), Vp = Xp._regVerif(AN26);
  t('⑥ le verdict : « à 8 lignes près » ; complet : « Prêt pour le contrôle » ; rien : « Aucun traitement »',
    !vd.ok && vd.txt === 'Prêt pour le contrôle, à 8\u00a0lignes près' && Xp._regVerdict(Vp).ok && Xp._regVerdict(Vp).txt === 'Prêt pour le contrôle' && X._regVerdict(X._regVerif({ k: 'x', d0: '2020-01-01', d1: '2020-12-31' })).vide === true, vd.txt);
  const Xs = monde(S, { trait: propre(), siret: '' }), Vs = Xs._regVerif(AN26);
  t('⑥ sans SIRET : le verdict le dit d’abord, et l’export s’arrête même si chaque ligne est complète', !Xs._regVerdict(Vs).ok && /SIRET/.test(Xs._regVerdict(Vs).txt) && Xs._regBloque(AN26) === true && Xp._regBloque(AN26) === false);
  const Xd = monde(S, { trait: propre().concat([TRAIT()[11]]) });
  t('⑥ un traitement sans date reste hors du fichier : dit, et l’export s’arrête', /1\u00a0traitement sans date/.test(Xd._regVerdict(Xd._regVerif(AN26)).txt) && Xd._regBloque(AN26) === true);
  t('⑥ tout le registre (sans bornes) : la ligne sans date est dans le fichier, et reprochée', X._regVerif({ k: 'tout', d0: '', d1: '' }).m.date === 1);
  // les huit points
  const P = X._regPoints(V), niv = P.map((p) => p.niv).join();
  t('⑦ les huit points de la carte, dans l’ordre de la maquette', P.length === 8 && /^SIRET/.test(P[0].t) && /^Date/.test(P[1].t) && /^Localisation/.test(P[2].t) && /^Stade/.test(P[3].t) && /^Surface/.test(P[4].t) && /^Horaires/.test(P[5].t) && /^Rentrée/.test(P[6].t) && /^Cible/.test(P[7].t));
  t('⑦ chacun dit son état : exigé manquant (à compléter), facultatif, ou ok', niv === 'manque,manque,manque,manque,manque,manque,manque,conseil' && P[0].n === 2 && P[2].n === 2 && P[7].n === 3, niv);
  const Pp = Xp._regPoints(Vp);
  t('⑦ complet : tout est ok ; la surface dit sa parcelle en partie, la rentrée déclarée est dite, les horaires « rien à dire »',
    Pp.map((p) => p.niv).join() === 'ok,ok,ok,ok,ok,rien,ok,ok' && /dont 1 en partie/.test(Pp[4].s) && /1\u00a0ligne avec une rentrée déclarée/.test(Pp[6].s), Pp.map((p) => p.niv).join());
  // la carte et la fenêtre
  const G = X._regCarte();
  t('⑧ la carte : l’année civile en cours, le verdict, les huit points, le bouton « Voir les lignes et exporter 2026 », l’échéance',
    G.an === 2026 && G.k === 'civ2026' && G.corps.includes('data-reg="verdict"') && (G.corps.match(/border-top:1px solid var\(--gris-clair\)/g) || []).length === 8
    && G.corps.includes('onclick="window._regOuvrir(\'civ2026\')"') && G.corps.includes('Voir les lignes et exporter 2026') && G.corps.includes('avant le 31 janvier'));
  t('⑧ la carte d’un registre complet propose « Exporter le registre » ; sans droit d’administrateur, aucun bouton',
    Xp._regCarte().corps.includes('Exporter le registre 2026') && !monde(S, { admin: false })._regCarte().corps.includes('_regOuvrir'));
  t('⑧ l’année de la carte : la courante dès qu’elle a un traitement, sinon la précédente tant qu’elle en a', monde(S, { trait: [TRAIT()[10]] })._regCarte().an === 2025 && monde(S, { trait: [] })._regCarte().an === 2026);
  X._regOuvrir('civ2026');
  const corps = X.__dom['rgv-body'].innerHTML, bx = X.__dom['rgv-exp'];
  t('⑨ la fenêtre « avant l’export » : le verdict, les points, 7 traitements à reprendre, celui où seul du facultatif manque derrière le dépliant',
    X.__ouverts.join() === 'ovRegVerif' && corps.includes('à 8\u00a0lignes près') && (corps.match(/data-reg="ligne"/g) || []).length === 8 && corps.includes('7\u00a0traitements à reprendre') && corps.includes('<details') && /Année 2026/.test(X.__dom['rgv-sub'].textContent));
  t('⑨ une ligne dit ce qui manque, la parcelle quand c’est elle, puis le facultatif',
    corps.includes('02/06/2026 · Maison') && corps.includes('À compléter\u00a0: numéro d’AMM à 7 chiffres · dose et unité · coordonnées (B)') && corps.includes('Facultatif\u00a0: stade · cible · mode d’application'));
  t('⑨ « Exporter quand même » repart sans vérification ; complet : « Exporter le registre »', bx.innerHTML.includes('Exporter quand même') && bx.attrs.onclick === "_phytoExportCsv('civ2026',1)" && (Xp._regOuvrir('civ2026'), Xp.__dom['rgv-exp'].innerHTML.includes('Exporter le registre')));
  X._regAller(3);
  const Xn = monde(S, { admin: false }); Xn._regOuvrir('civ2026');
  t('⑨ une ligne touchée ferme la fenêtre et ouvre la fiche du traitement ; la fenêtre est réservée à l’administrateur', X.__fermes.join() === 'ovRegVerif' && X.__fiches.join() === '3' && !Xn.__ouverts.length && Xn.__toasts.length === 1);
  // les périodes
  const F = X._phytoFenetres();
  t('⑩ l’année civile en tête des périodes : la courante, puis la précédente ; « tout » reste en dernier', F[0].k === 'civ2026' && F[0].d0 === '2026-01-01' && F[0].d1 === '2026-12-31' && F[1].k === 'civ2025' && F[F.length - 1].k === 'tout' && F.length === 4);
  const Fe = monde(S, { fenetres: [{ k: 'exo2026', axe: 'exercice', lbl: 'Exercice 2026', sub: '', d0: '2026-01-01', d1: '2026-12-31' }, { k: 'tout', axe: 'tout', lbl: 'Tout', sub: '', d0: '', d1: '' }] });
  t('⑩ un exercice aux mêmes dates n’est pas redit : la carte s’y accroche', Fe._phytoFenetres().map((f) => f.k).join() === 'civ2025,exo2026,tout' && Fe._regCarte().k === 'exo2026');
  // les fils
  t('⑪ l’export s’arrête sur la vérification, sauf « quand même » ; il ferme la fenêtre en partant ; chaque ligne dit son traitement',
    S.phy.includes("if(!sansVerif && typeof window._regBloque==='function' && typeof window._regOuvrir==='function' && window._regBloque(fen)){ window._regOuvrir(fen.k); return; }")
    && S.phy.includes("closeOv(null, 'ovRegVerif');") && S.phy.includes("src.push({ i: rang, nom: (nom||'') });") && S.phy.includes("import './registre.js';"));
  t('⑪ Pilotage › Conformité : la carte « Le registre <année> » lit registre.js, garde sa case et sa fiche, les derniers passages derrière un dépliant',
    S.pil.includes("var G=(typeof window._regCarte==='function')?window._regCarte():null;") && S.pil.includes("return _pilTile('phyto','#5A9FD4','Le registre '+G.an,") && S.pil.includes("G.corps+_liste, 'pil.phyto');")
    && S.pil.includes("['mat_phyto','Le registre de l’année (vérifié avant l’export)']"));
  t('⑫ la fenêtre est classée (lecture) ; ses deux gestes sont exemptés, motivés', /ovRegVerif: \['LECTURE'/.test(S.aj) && /"_regOuvrir": "REG27-1B/.test(S.cov) && /"_regAller": "REG27-1B/.test(S.cov));
  t('⑫ l’aide, la fiche « i », les guides, l’annonce 11.03',
    S.ut.includes("'pil.phyto': { t: 'Le registre, vérifié avant l\\u2019export'") && S.ut.includes('Avant de sortir, le fichier est relu ligne par ligne') && S.ut.includes('le <b>registre</b> de l’année — relu ligne par ligne avant l’export')
    && S.g07.includes('<b>Avant de sortir, le fichier est relu ligne par ligne.</b>') && S.g11.includes("<b>Le registre de l'année</b>") && /v: '11\.03'[\s\S]{0,300}Le registre se vérifie avant l’export/.test(S.wn));
  t('⑬ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-reg27b.mjs'") > 0 && S.liste.indexOf("mv-harnais-reg27b.mjs --contre'") > 0);
}
if (!CONTRE) {
  console.log('\n\x1b[1mMA VIGNE — Harnais REG27-1B · scénarios\x1b[0m');
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n\x1b[1mMA VIGNE — Harnais REG27-1B · contre-épreuves\x1b[0m');
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (S[cle].split(a).length !== 2) throw new Error('ancre absente ou multiple : ' + a.slice(0, 50)); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['le numéro d’AMM n’est plus exigé', m('rg', "    if (!/^\\d{7}$/.test(String(r[RG.AMM] || '').trim())) M.push('amm');\n", '')],
    ['la dose n’est plus exigée', m('rg', "    if (r[RG.DOSE] === '' || !String(r[RG.UNITE] || '').trim()) M.push('dose');\n", '')],
    ['les horaires ne sont plus dus pour un insecticide', m('rg', "return String(m.type || '') === 'Insecticide' || !!(c && c.heureOblig); }", 'return !!(c && c.heureOblig); }')],
    ['le stade est reproché partout', m('rg', "if (_regStadeRequis(t)) M.push('stade'); else C.push('stade');", "M.push('stade');")],
    ['la cible facultative devient un manque', m('rg', "if (!String(r[RG.CIBLE] || '').trim()) C.push('cible');", "if (!String(r[RG.CIBLE] || '').trim()) M.push('cible');")],
    ['une rentrée au-delà du délai passe', m('rg', 'else if (dre > 0 && min >= dre * 60) M.push', 'else if (dre > 0 && min >= dre * 6000) M.push')],
    ['une rentrée sans heure de fin passe', m('rg', "if (min == null) M.push('rfin'); else if", 'if (min == null) { } else if')],
    ['l’ancien texte libre passe', m('rg', "!/^\\d{2,}:\\d{2}$/.test(String(delaiCellule).trim())) M.push('rtexte');", "false) M.push('rtexte');")],
    ['la colonne de la surface traitée est lue au mauvais rang', m('rg', 'SURF: 14,', 'SURF: 22,')],
    ['le verdict est bon malgré les lignes à compléter', m('rg', "  if (!V.nManque) return { ok: true, txt: 'Prêt pour le contrôle' };", "  if (V.nLignes) return { ok: true, txt: 'Prêt pour le contrôle' };")],
    ['le SIRET manquant ne se dit plus', m('rg', "  if (!V.siretOk) return { ok: false, txt: 'Le SIRET du domaine manque : chaque ligne doit le porter' };\n", '')],
    ['l’export ne s’arrête plus jamais', m('rg', 'return !!(V.nLignes && (V.nManque || !V.siretOk || V.sansDate)); };', 'return false; };')],
    ['l’export ne consulte plus la vérification', m('phy', "if(!sansVerif && typeof window._regBloque==='function'", "if(false && typeof window._regBloque==='function'")],
    ['les lignes ne savent plus de quel traitement elles viennent', m('phy', "src.push({ i: rang, nom: (nom||'') });", "src.push({ i: 0, nom: (nom||'') });")],
    ['l’année civile n’est plus proposée', m('phy', '      if(L && L.length) return _phytoFenAnnees(L);', '      if(L && L.length) return L;')],
    ['la carte reste sur l’année vide en janvier', m('rg', 'return (a[y] || !a[y - 1]) ? y : y - 1;', 'return y;')],
    ['un non-administrateur ouvre la fenêtre', m('rg', "  if (!isAdmin()) { showToast('Réservé aux administrateurs', '#C0392B'); return; }\n", '')],
    ['une ligne touchée n’ouvre plus la fiche', m('rg', 'window.openTraitDetail(i);', '')],
    ['Pilotage ne lit plus la vérification', m('pil', "var G=(typeof window._regCarte==='function')?window._regCarte():null;", 'var G=null;')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-reg27b.mjs'").join("mv-harnais-reg27Z.mjs'") })]];
  let rougit = 0;
  for (const [nom, f] of mutants) {
    let S; try { S = f(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté : ' + nom + ' (' + e.message + ')'); continue; }
    const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S); } catch (e) { ko++; } console.log = log;
    if (ko) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + ko + ')\x1b[0m'); } else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
  }
  console.log('\n  ' + rougit + '/' + mutants.length + ' contre-épreuves rougissent\n');
  process.exit(rougit === mutants.length ? 0 : 1);
}
