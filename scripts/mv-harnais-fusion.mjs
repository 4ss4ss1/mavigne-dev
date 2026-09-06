/* ══════════════════════════════════════════════════════════════════════
   HARNAIS — FUS-1 : fusionner des cuves dans le Cuvier.

   Methode C20 : on extrait les VRAIES fonctions de src/cave.js et on les
   execute. Les stubs sont minimaux — tout ce qui est teste vient du fichier.

   ⚠️ Un harnais doit compter un plantage comme ROUGE, et le lanceur doit
   lire le code de sortie. C'est fait en bas.
   ⚠️ CONTRE-EPREUVE OBLIGATOIRE : chaque defaut corrige est reintroduit et
   le harnais doit rougir. Une contre-epreuve qui ne peut pas rougir ne
   prouve rien (§68).
   ══════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const CAVE = path.join(ICI, '..', 'src', 'cave.js');

let ok = 0, ko = 0;
const dit = [];
function T(nom, cond, detail) {
  if (cond) { ok++; }
  else { ko++; dit.push('  ✗ ' + nom + (detail ? ' — ' + detail : '')); }
}
function proche(a, b, eps = 0.05) { return Math.abs(a - b) <= eps; }

/* ── extraction : blocs pris dans l'ordre reel du fichier ────────────── */
function bloc(src, debut, fin) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('bloc introuvable : ' + debut.slice(0, 50));
  const j = src.indexOf(fin, i);
  if (j < 0) throw new Error('fin introuvable pour : ' + debut.slice(0, 50));
  return src.slice(i, j + fin.length);
}

const SRC = fs.readFileSync(CAVE, 'utf8');

const MORCEAUX = [
  bloc(SRC, 'function _caveCuve(id){', '\n}'),
  bloc(SRC, 'function _caveCuveOcc(id, hors){', '\n}'),
  bloc(SRC, 'function _vendIsActive(c)', '\n'),
  bloc(SRC, 'function _vendRepere(c){', '\n}'),
  bloc(SRC, 'function _vendTriRepere(a,b){', '\n}'),
  bloc(SRC, 'function _vendEstFusionnee(c)', '\n'),
  bloc(SRC, 'function _vendTriOps(c){', '\n}'),
  bloc(SRC, 'function _vendCuvCsDom(cuveId, exclId){', '\n}'),
  bloc(SRC, 'function _vendVolLoge(cv){', '\n}'),
  bloc(SRC, 'function _vendFusCuves(){', '\n}'),
  bloc(SRC, 'function _vendFusPris(){', '\n}'),
  bloc(SRC, 'function _vendFusHl(c)', '\n'),
  bloc(SRC, 'function _vendFusTotHl(){', '\n}'),
  bloc(SRC, 'function _vendFusNomAuto(){', '\n}'),
  bloc(SRC, 'function _vendFusParcLibre(){', '\n}'),
  bloc(SRC, 'function _vendFusDestObj(){', '\n}'),
  bloc(SRC, 'function saveVendFusion(){', '\n}'),
];

/* ── stubs : le strict minimum ───────────────────────────────────────── */
const PRELUDE = `
var CAVE_VENDANGE = null, CAVE_ELEVAGE = { cuvees: [] };
var _vendFusSel = {}, _vendFusDest = null, _vendFusNom = '', _vendFusNomTouche = false;
var _vendOuvert = null;
var TOASTS = [], CHAMPS = {};
function showToast(m){ TOASTS.push(String(m)); }
function canWrite(){ return true; }
function _vendGarde(){ return true; }                          // VD-GARDE (cave.js)
function _vendFbSave(m,c){ if(m) showToast(m,c); }             // VD-SAVE  (cave.js)
function _vendSheetClose(){}
function renderVendCuves(){}
function _vendCuvHl(caisses){ return (caisses * 25) / 135; }   // 25 kg/caisse, 135 kg/hL
function _recCsDom(r){ return (r && r.caisses_dom) || 0; }
function _vendFusNomAutoStub(){}
function _caveParc(){ return (window.CONFIG.cave.cuves || []); }
function _caveFutL(){ return 228; }
function _caveVolL(){ return 0; }
function _vendCuvF1(n){ return String(Math.round(n*10)/10); }
var document = {
  getElementById: function(id){ return CHAMPS[id] ? { value: CHAMPS[id] } : null; },
  querySelector: function(){ return null; }
};
var window = { CONFIG: { cave: { cuves: [] } }, fbSave: null };
`;

const CODE = PRELUDE + MORCEAUX.join('\n') + `
;return { saveVendFusion, _vendFusTotHl, _vendFusHl, _vendFusDestObj, _vendFusParcLibre,
          _vendTriRepere, _vendRepere, _vendCuvCsDom, _vendVolLoge, _vendFusNomAuto,
          _caveCuveOcc, _vendFusCuves,
          etat: function(){ return { CAVE_VENDANGE: CAVE_VENDANGE, TOASTS: TOASTS, window: window }; },
          pose: function(cv, cfg, sel, dest, champs){
            CAVE_VENDANGE = cv; window.CONFIG.cave.cuves = cfg;
            _vendFusSel = sel; _vendFusDest = dest; CHAMPS = champs || {}; TOASTS = [];
          } };
`;

let API;
try { API = new Function(CODE)(); }
catch (e) { console.error('✗ le harnais n\'a pas pu charger les fonctions :', e.message); process.exit(1); }

/* ── le jeu d'essai : trois cuves, deux parcelles chacune ────────────── */
function monde() {
  return {
    config: { poids_caisse_kg: 25, ratio_min: 130, ratio_max: 140 },
    recoltes: [
      { id: 'r1', parcelle: 'Les Damodes',   caisses_dom: 142, cuve_id: 'c1' },
      { id: 'r2', parcelle: 'Aux Boudots',   caisses_dom: 98,  cuve_id: 'c2' },
      { id: 'r3', parcelle: 'Aux Chaignots', caisses_dom: 61,  cuve_id: 'c3' },
      { id: 'r4', parcelle: 'Les Damodes',   caisses_dom: 30,  cuve_id: 'c2' }
    ],
    cuves_vinif: [
      { id:'c1', nom:'Les Damodes',   statut:'fa', cuve_ref:'p1', volume_hl:60,
        parcelles:['Les Damodes'],   mesures_fa:[{id:'m1',date:'2026-09-20',densite:1040}], operations:[] },
      { id:'c2', nom:'Aux Boudots',   statut:'fa', cuve_ref:'p2', volume_hl:40,
        parcelles:['Aux Boudots','Les Damodes'], mesures_fa:[{id:'m2',date:'2026-09-21',densite:1030}], operations:[] },
      { id:'c3', nom:'Aux Chaignots', statut:'fa', cuve_ref:'p3', volume_hl:25,
        parcelles:['Aux Chaignots'], mesures_fa:[], operations:[] }
    ]
  };
}
const PARC = [
  { id:'p1', nom:'Cuve 1',  litres:6000, matiere:'inox' },
  { id:'p2', nom:'Cuve 2',  litres:4000, matiere:'inox' },
  { id:'p3', nom:'Cuve 3',  litres:2500, matiere:'beton' },
  { id:'p10',nom:'Cuve 10', litres:8000, matiere:'inox' }
];

/* ═══════════ 1. Le repere vient du parc, jamais d'un numero invente ═══ */
{
  const cv = monde();
  API.pose(cv, PARC, {}, null, {});
  T('R1 repere lu dans le parc', API._vendRepere(cv.cuves_vinif[0]) === 'Cuve 1',
    'rendu : ' + API._vendRepere(cv.cuves_vinif[0]));
  T('R2 pas de cuve_ref = pas de repere', API._vendRepere({ nom:'X' }) === '');
}

/* ═══════════ 2. Le tri de cuverie est stable ET numerique ════════════ */
{
  const cv = monde();
  API.pose(cv, [{id:'a',nom:'Cuve 2'},{id:'b',nom:'Cuve 10'},{id:'c',nom:'Cuve 1'}], {}, null, {});
  const l = [{cuve_ref:'a',nom:'B'},{cuve_ref:'b',nom:'C'},{cuve_ref:'c',nom:'A'}]
    .sort(API._vendTriRepere).map(x => API._vendRepere(x));
  T('T1 Cuve 10 apres Cuve 2', l.join('|') === 'Cuve 1|Cuve 2|Cuve 10', 'rendu : ' + l.join('|'));
  const sans = [{cuve_ref:'c',nom:'A'},{nom:'sans repere'}].sort(API._vendTriRepere);
  T('T2 une cuve sans repere part a la fin', sans[1].nom === 'sans repere');
}

/* ═══════════ 3. La fusion elle-meme ══════════════════════════════════ */
{
  const cv = monde();
  API.pose(cv, PARC, { c1:1, c2:1 }, 'c1', { 'vfus-nom':'Damodes + Boudots', 'vfus-date':'2026-09-28' });

  const avantHl = API._vendFusTotHl();
  T('F0 volume estime = caisses du domaine, pas la contenance',
    proche(avantHl, (142+98+30) * 25 / 135), 'rendu : ' + avantHl);

  API.saveVendFusion();
  const c1 = cv.cuves_vinif.find(c => c.id === 'c1');
  const c2 = cv.cuves_vinif.find(c => c.id === 'c2');

  T('F1 les recoltes de la cuve absorbee changent de cuve',
    cv.recoltes.filter(r => r.cuve_id === 'c1').length === 3);
  T('F2 plus aucune recolte sur la cuve absorbee',
    cv.recoltes.filter(r => r.cuve_id === 'c2').length === 0);
  T('F3 la cuve absorbee passe en termine', c2.statut === 'termine');
  T('F4 elle porte sa fusion', !!c2.fusion && c2.fusion.vers === 'c1');
  T('F5 elle LACHE sa cuve physique', c2.cuve_ref === null);
  T('F6 elle n\'a PAS de decuvage', !c2.decuvage);
  T('F7 donc son volume loge vaut zero', API._vendVolLoge(c2) === 0);
  T('F8 la porteuse prend le nom saisi', c1.nom === 'Damodes + Boudots');
  T('F9 les parcelles se reunissent sans doublon',
    c1.parcelles.join('|') === 'Les Damodes|Aux Boudots', 'rendu : ' + c1.parcelles.join('|'));
  T('F10 la porteuse garde sa cuve physique', c1.cuve_ref === 'p1');
  T('F11 la porteuse garde ses propres releves', (c1.mesures_fa || []).length === 1);
  T('F12 la cuve absorbee garde les siens', (c2.mesures_fa || []).length === 1);
  T('F13 une ligne assemblage au registre',
    (c1.operations || []).filter(o => o.type === 'assemblage').length === 1);
  const asm = (c1.operations || []).find(o => o.type === 'assemblage');
  T('F14 le registre nomme les cuves d\'origine', asm && asm.sources.join(',') === 'Aux Boudots');
  T('F15 le registre marque le volume comme estime', asm && asm.estime === true);

  /* ★★★ LE CONTROLE QUI COMPTE : aucun double compte. */
  const total = API._vendCuvCsDom('c1') + API._vendCuvCsDom('c2');
  T('F16 total des caisses conserve, zero double compte', total === 142 + 98 + 30 + 0,
    'rendu : ' + total);
  T('F17 la cuve absorbee ne compte plus rien', API._vendCuvCsDom('c2') === 0);
  /* La cuve physique de l'absorbee est-elle vraiment libre ? */
  T('F18 la cuve physique liberee est reutilisable', API._caveCuveOcc('p2', null) === null);
}

/* ═══════════ 4. Fusion vers une cuve LIBRE du parc ═══════════════════ */
{
  const cv = monde();
  API.pose(cv, PARC, { c1:1, c2:1, c3:1 }, 'p10', { 'vfus-nom':'Assemblage', 'vfus-date':'2026-09-28' });
  API.saveVendFusion();
  const c1 = cv.cuves_vinif.find(c => c.id === 'c1');
  T('P1 la porteuse bascule sur la cuve du parc', c1.cuve_ref === 'p10');
  T('P2 elle prend la contenance de cette cuve si elle n\'en avait pas', c1.volume_hl === 60);
  T('P3 toutes les recoltes ont suivi', cv.recoltes.every(r => r.cuve_id === 'c1'));
  T('P4 deux cuves absorbees', cv.cuves_vinif.filter(c => c.fusion).length === 2);
  T('P5 trois parcelles reunies', c1.parcelles.length === 3, 'rendu : ' + c1.parcelles.join('|'));
  T('P6 les anciennes cuves physiques sont toutes libres',
    ['p2','p3'].every(id => API._caveCuveOcc(id, null) === null));
}

/* ═══════════ 5. Les refus ════════════════════════════════════════════ */
{
  const cv = monde();
  API.pose(cv, PARC, { c1:1 }, 'c1', {});
  API.saveVendFusion();
  T('X1 une seule cuve : refus', API.etat().TOASTS.some(t => /au moins deux/.test(t)));
  T('X2 rien n\'a bouge', cv.cuves_vinif.every(c => !c.fusion));

  API.pose(cv, PARC, { c1:1, c2:1 }, null, {});
  API.saveVendFusion();
  T('X3 sans destination : refus', API.etat().TOASTS.some(t => /arriv/.test(t)));
  T('X4 rien n\'a bouge non plus', cv.cuves_vinif.every(c => !c.fusion));
}

/* ═══════════ 6. Une cuve fusionnee ne se re-fusionne pas ════════════ */
{
  const cv = monde();
  API.pose(cv, PARC, { c1:1, c2:1 }, 'c1', { 'vfus-nom':'A+B' });
  API.saveVendFusion();
  API.pose(cv, PARC, {}, null, {});
  const libres = API._vendFusCuves().map(c => c.id).sort();
  T('Z1 la cuve absorbee sort de la liste fusionnable', libres.join(',') === 'c1,c3',
    'rendu : ' + libres.join(','));

  /* ⚠️ Z1 ne traversait PAS la garde qu'il pretendait tester : une cuve
     fusionnee est aussi 'termine', donc le premier test suffisait deja a
     l'exclure. Trouve par la contre-epreuve, qui restait verte sur un
     fichier sabote. Z2 pose le cas que la garde existe pour attraper :
     une donnee abimee, fusionnee mais restee en fermentation. */
  const abime = monde();
  abime.cuves_vinif[1].fusion = { vers: 'c1', vers_nom: 'A+B', date: '2026-09-28' };
  API.pose(abime, PARC, {}, null, {});
  const l2 = API._vendFusCuves().map(c => c.id).sort();
  T('Z2 une cuve fusionnee restee en FA est quand meme exclue',
    l2.join(',') === 'c1,c3', 'rendu : ' + l2.join(','));
}

/* ═══════════ 7. Le nom propose ══════════════════════════════════════ */
{
  const cv = monde();
  API.pose(cv, PARC, { c1:1, c3:1 }, null, {});
  T('N1 nom automatique = les deux noms', API._vendFusNomAuto() === 'Les Damodes + Aux Chaignots',
    'rendu : ' + API._vendFusNomAuto());
  API.pose(cv, PARC, { c1:1 }, null, {});
  T('N2 une seule cuve : pas de nom propose', API._vendFusNomAuto() === '');
}

/* ── verdict ─────────────────────────────────────────────────────────── */
console.log('\nHARNAIS FUS-1 — ' + ok + ' vertes, ' + ko + ' rouges');
if (ko) { console.log(dit.join('\n')); process.exit(1); }
console.log('✔ tout est vert');
process.exit(0);
