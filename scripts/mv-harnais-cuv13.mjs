// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS CUV-13 — « PRESSURAGE » : L'ÉTAPE S'APPELLE PAR SON NOM, ET LA
//  CUVE PRESSURÉE RESTE RÉCLAMÉE
// ═══════════════════════════════════════════════════════════════════════════
//  Nico, 15/09 : « le décuvage ici est en fait un pressurage ». À cette étape
//  on presse, et le jus peut finir sa fermentation dans une autre cuve avant
//  la mise en fût. L'étape (clé 'decuvage') n'était ni active ni décuvée :
//  plus de « Saisir une mesure », plus de champ dans la tournée. À la question
//  « acceptée ou réclamée ? », Nico a répondu : RÉCLAMÉE.
//
//  Sur les VRAIES fonctions extraites de src/cave.js. Bouchons : ce qui n'est
//  pas le sujet (volumes, sucre, repère, graphes, échappements, icônes).
//
//  CE QUE CE HARNAIS PROUVE
//   1. la clé 'decuvage' se lit « Pressurage » — table, frise, parcours,
//      formulaire « Modifier » d'index.html — et la CLÉ ne change pas ;
//   2. une cuve pressurée est RÉCLAMÉE (tournée, cuves à mesurer, badge) et
//      mesurable ; « suivie ⇒ mesurable » tient sur toutes les formes de cuve ;
//   3. le décuvage reste un FAIT : une cuve décuvée à qui l'on repose l'étape
//      n'est pas réclamée par elle, une cuve fusionnée jamais ;
//   4. le badge de l'onglet compte ce que l'alerte compte ;
//   5. l'écran le dit, RENDU et pas seulement prédit (§129d) : bouton, ligne
//      du détail, pastille de tournée, vignette, badge de ligne, légende ;
//   6. l'aide et le guide nomment l'étape.
//
//  ⚠ Contre-épreuve : chaque ancre doit être UNIQUE dans le bloc extrait
//    (§129d) — une ancre absente ou double est ROUGE, jamais « détectée ».
//
//  Usage :  node scripts/mv-harnais-cuv13.mjs
//           node scripts/mv-harnais-cuv13.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = lire('src/cave.js');

/* ══ EXTRACTION — indices relus, ordre réel du fichier ══ */
const NOMS = [
  '_vendFrDate', '_vendStatLbl', '_vendIsActive', '_vendTempCls',
  '_vendHist', '_vendStatIdx', '_vendStatDeb', '_vendStatFin', '_vendStatDuree',
  '_vendRepere', '_vendADue', '_vendEstFusionnee',
  '_vendTriDate', '_vendTriMes', '_vendLastMes', '_vendSince', '_vendStale', '_vendLastD',
  '_vendStepper', '_vendParcLigne', '_vendKpiData', '_mvgId',
  '_vendLigneHtml', '_vendDetailHtml', '_vendCellHtml',
  '_vendDecuvee', '_vendFaEnCours', '_vendPressee', '_vendSuivie', '_vendMesurable',
  '_vtNum', '_vtActives', '_vtB', '_vtTags', '_fermLegende', '_vendCuvF1',
  '_mlD', '_mlIso', '_mlAuj', '_mlEcartJ', '_mlAMesurer',
  /* ★ VOL-1 — la jauge lit `_vendVolContenu` : les VRAIES fonctions, qui
     s'appuient sur les bouchons du prélude (_vendVolLoge, _vendCuvKgDom…). */
  '_vendSortiesHl', '_vendVolContenu'
];
function extraire(nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(SRC);
  if (!m) { console.error('ABSENTE de src/cave.js : ' + nom); process.exit(1); }
  let i = SRC.indexOf('{', m.index), d = 0;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === '{') d++;
    else if (SRC[j] === '}' && --d === 0) return [m.index, SRC.slice(m.index, j + 1)];
  }
  console.error('accolade non fermée : ' + nom); process.exit(1);
}
function table(nom) {
  const m = new RegExp('^var ' + nom + '\\s*=', 'm').exec(SRC);
  if (!m) { console.error('TABLE ABSENTE : ' + nom); process.exit(1); }
  let d = 0;
  for (let j = m.index; j < SRC.length; j++) {
    const ch = SRC[j];
    if (ch === '[' || ch === '{' || ch === '(') d++;
    else if (ch === ']' || ch === '}' || ch === ')') d--;
    else if (ch === ';' && d === 0) return [m.index, SRC.slice(m.index, j + 1)];
  }
  console.error('point-virgule non trouvé : ' + nom); process.exit(1);
}
const BLOC = [...NOMS.map(extraire), ...['_VEND_STAT', '_VEND_STEPS'].map(table)]
  .sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');

const PRELUDE = `
var CAVE_VENDANGE = { cuves_vinif: [], recoltes: [], config: {} };
var _VT_BUF = {}, _vendOuvert = null;
var PARC = { p1: { id: 'p1', nom: 'Cuve 12' } };
function _caveCuve(id){ return PARC[id] || null; }
function _escHtml(s){ return String(s == null ? '' : s); }
function _escAttr(s){ return String(s == null ? '' : s); }
function _mvIcon(){ return '<svg></svg>'; }
function _vendCfg(){ return { poids_caisse_kg: 25, ratio_min: 130, ratio_max: 140, sucre_par_degre: 16.83 }; }
function _recCaisses(){ return 0; }
function _recKg(){ return 0; }
function _recKgDom(){ return 0; }
function _vendMesD20(m){ return m ? m.densite : null; }
function _vendFaPct(){ return 0; }
function _vendSucreRest(){ return 0; }
function _vendJourSec(){ return null; }
function _vendDSec(){ return 996; }
function _vendDSecTxt(){ return '996 (rep\\u00e8re)'; }
function _vendCuvCsDom(){ return 0; }
function _vendVolLoge(){ return 0; }
function _vendDvolHtml(){ return ''; }   // CUV-14 : le bloc « Volume decuve » a son harnais (futcap)
function _vendHlKg(){ return 0; }
function _vendCuvKgDom(){ return 0; }
function _vendDecD20(){ return null; }
function _vendParcHist(){ return ''; }
function _vendMesHist(){ return ''; }
function _vendOpsSummary(){ return ''; }
function _vendOpLbl(k){ return k; }
function _mvF1(x){ return String(x); }
`;
const RETOUR = `
return { _vendStatLbl, _VEND_STAT, _VEND_STEPS, _vendIsActive, _vendDecuvee, _vendFaEnCours,
  _vendPressee, _vendSuivie, _vendMesurable, _vendADue, _vendKpiData, _vtActives, _vtTags,
  _mlAMesurer, _mlAuj, _vendDetailHtml, _vendCellHtml, _vendLigneHtml, _vendStepper,
  _vendParcLigne, _fermLegende,
  pose: function(cv){ CAVE_VENDANGE = cv; _VT_BUF = {}; } };
`;
function monter(mutation) {
  const corps = mutation ? mutation(BLOC) : BLOC;
  return new Function(PRELUDE + corps + RETOUR)();
}

let vert = 0; const rouges = [];
function pose(cond, quoi) {
  if (cond) { vert++; console.log('  vert   ' + quoi); }
  else { rouges.push(quoi); console.log('  ROUGE  ' + quoi); }
}

/* ══ LE DÉCOR — dates RELATIVES à aujourd'hui, jamais en dur ══ */
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
  + '-' + String(d.getDate()).padStart(2, '0');
const jm = n => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const rel = (n, d) => ({ id: 'm' + n + '_' + d, date: jm(n), densite: d, temp_c: 22 });
function cuve(id, statut, o) {
  return Object.assign({ id, nom: id, statut, date_entree: jm(20), parcelles: [], operations: [],
    mesures_fa: [rel(3, 1005)],
    statut_hist: [{ id: 's0', statut: 'fa', date: jm(14) }, { id: 's1', statut: 'decuvage', date: jm(3) }]
  }, o || {});
}
const FAIT = (fin, n) => ({ date: jm(n == null ? 2 : n), cuvee_id: 'cuv_x', fa_finie: fin });
/* Des FABRIQUES, pas des objets partagés : chaque essai part d'une cuve neuve. */
const F = {
  pressee:     () => cuve('P', 'decuvage'),                                  // pressée à 1005, relevée il y a 3 j
  presseeJour: () => cuve('PJ', 'decuvage', { mesures_fa: [rel(3, 1005), rel(0, 1003)] }),
  presseeRef:  () => cuve('PR', 'decuvage', { cuve_ref: 'p1' }),
  presseeAvant:() => cuve('PA', 'decuvage', { mesures_fa: [rel(5, 1010)] }), // relevés AVANT la presse
  decRepose:   () => cuve('DR', 'decuvage', { decuvage: FAIT(true) }),       // décuvée, étape reposée à la main
  decFA:       () => cuve('DF', 'termine', { decuvage: FAIT(false), mesures_fa: [rel(3, 1005), rel(1, 1002)] }),
  decFin:      () => cuve('DN', 'termine', { decuvage: FAIT(true) }),
  fusP:        () => cuve('FU', 'decuvage', { fusion: { vers: 'autre', date: jm(1) } }),
  fa:          () => cuve('FA', 'fa', { statut_hist: [{ id: 's0', statut: 'fa', date: jm(14) }] }),
  mpf:         () => cuve('MP', 'mpf', { statut_hist: [] }),
  setup:       () => cuve('SE', 'setup', { mesures_fa: [], statut_hist: [] }),
  fml:         () => cuve('FM', 'fml'),
  termine:     () => cuve('TE', 'termine')
};
const ETAT_DETAIL = c => A => A._vendDetailHtml(c, true);

const A = monter();

if (!CONTRE) {
  console.log('\n── 1 · le mot : la clé « decuvage » se lit « Pressurage » ──');
  {
    pose(A._vendStatLbl('decuvage') === 'Pressurage', '★★ le libellé de l’étape est « Pressurage »');
    pose(A._VEND_STAT.decuvage && A._VEND_STAT.decuvage.i === 3,
      '★ la CLÉ et le rang ne bougent pas : aucune migration de statut_hist');
    const st = A._VEND_STEPS.find(s => s[0] === 'decuvage');
    pose(!!st && st[1] === 'Press.', 'la frise abrège en « Press. »');
    pose(A._VEND_STEPS.every(s => !/D[ée]cuv/.test(s[1]))
      && Object.keys(A._VEND_STAT).every(k => !/D[ée]cuv/.test(A._VEND_STAT[k].lbl)),
      'plus aucune étape ne s’appelle « Décuvage » ni « Décuv. »');
    const p = F.pressee();
    pose(/<div class="mvv-step cur">[\s\S]*?<div class="lb">Press\.<\/div>/.test(A._vendStepper(p)),
      '★ RENDU : la frise porte « Press. » sur l’étape en cours');
    pose(A._vendParcLigne(p).indexOf('<b>Pressurage</b> depuis le') !== -1,
      'RENDU : « Pressurage depuis le … » sous la frise');
    const opt = (lire('index.html').match(/<option value="decuvage">([^<]*)<\/option>/) || [])[1];
    pose(opt === A._vendStatLbl('decuvage'),
      '★★ le formulaire « Modifier » (index.html) dit le même mot que la table — rendu : ' + opt);
  }

  console.log('\n── 2 · RÉCLAMÉE : tournée, cuves à mesurer, badge ──');
  {
    const p = F.pressee();
    pose(A._vendPressee(p), 'une cuve à l’étape Pressurage, sans décuvage, est pressurée');
    pose(A._vendSuivie(p), '★★★ elle est RÉCLAMÉE (réponse de Nico)');
    pose(A._vendMesurable(p), '★★ et donc mesurable');
    pose(!A._vendIsActive(p), '★ « en fermentation » garde son sens : _vendIsActive ne bouge pas');
    A.pose({ cuves_vinif: [F.pressee(), F.decFin(), F.fusP(), F.decRepose()] });
    pose(A._vtActives().map(c => c.id).join(',') === 'P',
      '★★★ la tournée la réclame — et elle seule parmi décuvée finie, fusionnée, décuvée reposée');
    A.pose({ cuves_vinif: [F.pressee(), F.presseeJour()] });
    pose(A._mlAMesurer(A._mlAuj()).map(x => x.cuve.id).join(',') === 'P',
      '★★ elle entre dans les cuves à mesurer — celle relevée ce matin, non');
    pose(A._vendADue(F.pressee()) && !A._vendADue(F.presseeJour()),
      'à mesurer sans relevé depuis hier, à jour une fois relevée');
  }

  console.log('\n── 3 · le décuvage reste un FAIT ──');
  {
    const r = F.decRepose();
    pose(!A._vendPressee(r) && !A._vendSuivie(r),
      '★★★ une cuve DÉCUVÉE à qui « Modifier » repose l’étape n’est pas réclamée par elle (§118)');
    pose(A._vendMesurable(r), 'elle reste mesurable, comme toute cuve décuvée (§129)');
    const f = F.fusP();
    pose(!A._vendPressee(f) && !A._vendSuivie(f) && !A._vendMesurable(f),
      '★ une cuve fusionnée ne suit rien : son vin est ailleurs');
    pose(!A._vendSuivie(F.fml()) && !A._vendMesurable(F.fml()),
      'l’étape FML sans décuvage ne rouvre rien (inchangé)');
    pose(!A._vendSuivie(F.termine()) && !A._vendMesurable(F.termine()),
      'une cuve « terminée » sans décuvage ne rouvre rien (inchangé)');
    const toutes = Object.keys(F).map(k => F[k]());
    const faux = toutes.filter(c => A._vendSuivie(c) && !A._vendMesurable(c)).map(c => c.id);
    pose(faux.length === 0, '★★ invariant sur ' + toutes.length + ' formes : réclamée ⇒ acceptée'
      + (faux.length ? ' — en défaut : ' + faux.join(',') : ''));
  }

  console.log('\n── 4 · le badge de l’onglet compte ce que l’alerte compte ──');
  {
    const fa = F.fa();                      // relevée il y a 3 j : due
    A.pose({ cuves_vinif: [F.pressee(), F.presseeJour(), F.decFA(), fa, F.fusP(), F.decFin()] });
    const k = A._vendKpiData();
    const alerte = [F.pressee(), F.presseeJour(), F.decFA(), F.fa(), F.fusP(), F.decFin()]
      .filter(c => !c.fusion && A._vendADue(c)).length;
    pose(k.due === alerte, '★★★ badge = alerte « à mesurer » (' + k.due + ' / ' + alerte + ')');
    pose(k.due === 3, '★★ il compte la pressurée ET la décuvée qui finit au chai (3 dues)');
    pose(k.activeN === 4, 'la barre de santé porte sur les 4 cuves réclamées, fusionnée exclue');
    pose(k.enFA === 1, 'le compte « en fermentation » ne change pas de sens (1)');
  }

  console.log('\n── 5 · l’écran le dit — rendu, pas prédit ──');
  {
    const d = A._vendDetailHtml(F.pressee(), true);
    pose(d.indexOf('Saisir une mesure') !== -1, '★★★ le détail rend « Saisir une mesure »');
    pose(d.indexOf('<b>Pressurée</b>') !== -1 && d.indexOf('garde sa place dans la tournée') !== -1,
      '★★ la ligne du détail dit que le jus reste suivi');
    pose(d.indexOf('rattache') === -1, 'sans repère de cuverie, pas de phrase de rattachement');
    /* ⚠ Le code pose une espace INSÉCABLE dans « Modifier » : on cherche la fin de phrase. */
    pose(A._vendDetailHtml(F.presseeRef(), true).indexOf('le rattache à la nouvelle') !== -1,
      '★ avec un repère, la phrase du rattachement sort');
    pose(d.indexOf('Décuver</button>') !== -1, 'le bouton « Décuver » reste là : c’est lui qui envoie au Chai');
    pose(A._vendDetailHtml(F.decFin(), true).indexOf('<b>Pressurée</b>') === -1,
      'une cuve décuvée ne porte pas la ligne du pressurage');
    pose(A._vtTags(F.pressee()).indexOf('>pressurée<') !== -1, '★ la tournée porte la pastille « pressurée »');
    pose(A._vtTags(F.decRepose()).indexOf('>pressurée<') === -1, '… pas une cuve décuvée');
    /* ⚠ Sans contenance, la vignette ne dessine aucun niveau — donc aucune couleur. */
    const cell = A._vendCellHtml(Object.assign(F.presseeJour(), { volume_hl: 60 }));
    pose(cell.indexOf('>pressurée<') !== -1 && cell.indexOf('#8A5A38') !== -1,
      'le plan de cuverie : « pressurée », couleur de cuve suivie');
    pose(A._vendLigneHtml(F.presseeJour(), true).indexOf('>Pressurage</span>') !== -1,
      'la ligne fermée, relevée ce matin, porte « Pressurage »');
    pose(A._vendLigneHtml(F.pressee(), true).indexOf('mvv-etat due') !== -1,
      '★ … et passe « à mesurer » sans relevé depuis hier');
  }

  console.log('\n── 6 · la légende explique la remontée après la presse ──');
  {
    const leg = c => A._fermLegende(c, [], Date.parse(jm(20)), c.mesures_fa, true, []);
    /* ⚠ Un relevé du JOUR de la presse n'est pas « après » : on ne sait pas s'il
       a été pris avant ou après le pressoir. Même règle que le décuvage (>). */
    pose(leg(F.pressee()).indexOf('après le pressurage') === -1,
      'un relevé du jour même de la presse ne déclenche pas la note');
    pose(leg(F.presseeJour()).indexOf('après le pressurage') !== -1,
      '★ relevés pris après le pressurage : la note le dit');
    pose(leg(F.presseeAvant()).indexOf('après le pressurage') === -1,
      'relevés tous antérieurs à la presse : pas de note');
    const df = leg(F.decFA());
    pose(df.indexOf('après le décuvage') !== -1 && df.indexOf('après le pressurage') === -1,
      '★★ une cuve décuvée garde la note du DÉCUVAGE, jamais les deux');
  }

  console.log('\n── 7 · l’aide et le guide nomment l’étape ──');
  {
    const u = lire('src/utils.js'), g = lire('guide/08-cave.html'), pg = lire('public/guide.html');
    pose(u.indexOf("['Pressurer n’est pas décuver'") !== -1 && u.indexOf('<b>Pressurage</b>') !== -1,
      'l’aide de la Cave a son entrée « Pressurer n’est pas décuver »');
    pose(g.indexOf("<b>Pressurer n'est pas décuver.</b>") !== -1, 'le guide aussi');
    pose(pg.indexOf("<b>Pressurer n'est pas décuver.</b>") !== -1, 'et le guide publié est reconstruit');
    pose(u.indexOf('garde « Saisir une mesure », reste dans la tournée') === -1
      && g.indexOf('on ne sulfite pas sur du sucre') === -1,
      '★ plus de phrase qui réserve la saisie au seul cas « à finir au chai », ni l’erreur du sulfitage');
  }
}

/* ══ CONTRE-ÉPREUVE ═══════════════════════════════════════════════════════
   Chaque défaut est réintroduit dans le code EXTRAIT : le harnais doit rougir.
   ⚠ L'ancre est vérifiée UNIQUE d'abord : une ancre absente laisserait le code
   intact et ferait passer un faux « détecté » pour une preuve. */
if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVE : chaque défaut réintroduit doit mordre ──');
  const mord = (titre, ancre, remplace, essai) => {
    const n = BLOC.split(ancre).length - 1;
    if (n !== 1) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
    /* ⚠⚠ Un essai déjà faux sur le code SAIN ferait passer n'importe quelle
       mutation pour « détectée ». On le joue d'abord sur le code livré. */
    let sain = false;
    try { sain = !!essai(monter()); } catch (e) { sain = false; }
    if (!sain) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ESSAI FAUX SUR LE CODE SAIN'); return; }
    let rouge = false;
    try { rouge = !essai(monter(b => b.replace(ancre, remplace))); } catch (e) { rouge = true; }
    if (rouge) { vert++; console.log('  vert   ' + titre + ' → détecté'); }
    else { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
  };
  mord('★★★ la cuve pressurée n’est plus réclamée (le défaut d’origine)',
    '||_vendFaEnCours(c)||_vendPressee(c);', '||_vendFaEnCours(c);',
    M => { M.pose({ cuves_vinif: [F.pressee()] }); return M._vtActives().length === 1; });
  mord('★★ réclamée mais plus acceptée : le bouton disparaît',
    '||_vendDecuvee(c)||_vendPressee(c);', '||_vendDecuvee(c);',
    M => M._vendDetailHtml(F.pressee(), true).indexOf('Saisir une mesure') !== -1);
  mord('★★ l’étape reposée sur une cuve décuvée la fait revenir dans la tournée',
    "c.statut==='decuvage' && !_vendDecuvee(c) && !_vendEstFusionnee(c)", "c.statut==='decuvage' && !_vendEstFusionnee(c)",
    M => !M._vendSuivie(F.decRepose()));
  mord('★ une cuve fusionnée redevient réclamée',
    "c.statut==='decuvage' && !_vendDecuvee(c) && !_vendEstFusionnee(c)", "c.statut==='decuvage' && !_vendDecuvee(c)",
    M => !M._vendSuivie(F.fusP()));
  mord('★★ le badge relit _vendIsActive pendant que l’alerte lit _vendSuivie',
    'return c&&!_vendEstFusionnee(c)&&_vendSuivie(c);', 'return _vendIsActive(c);',
    M => { M.pose({ cuves_vinif: [F.pressee(), F.decFA(), F.fa()] }); return M._vendKpiData().due === 3; });
  mord('★★ le libellé redevient « Décuvage »',
    "lbl:'Pressurage'", "lbl:'Décuvage'",
    M => M._vendStatLbl('decuvage') === 'Pressurage');
  mord('la frise réécrit « Décuv. »',
    "['decuvage','Press.']", "['decuvage','Décuv.']",
    M => /<div class="lb">Press\.<\/div>/.test(M._vendStepper(F.pressee())));
  mord('★ la ligne du détail se tait',
    'if(_vendPressee(c)){', 'if(false){',
    M => M._vendDetailHtml(F.pressee(), true).indexOf('<b>Pressurée</b>') !== -1);
  mord('la pastille de tournée disparaît',
    'if(_vendPressee(c)) o+=', 'if(false) o+=',
    M => M._vtTags(F.pressee()).indexOf('>pressurée<') !== -1);
  mord('la vignette oublie la pressurée',
    ": _vendPressee(c) ? 'pressur", ": false ? 'pressur",
    M => M._vendCellHtml(F.presseeJour()).indexOf('>pressurée<') !== -1);
  mord('★ la légende ne donne plus la raison d’une remontée après la presse',
    'if(!(cu && _vendDecuvee(cu)) && _dPr &&', 'if(false && _dPr &&',
    M => { const c = F.presseeJour(); return M._fermLegende(c, [], Date.parse(jm(20)), c.mesures_fa, true, []).indexOf('après le pressurage') !== -1; });
  mord('★ une cuve décuvée affiche les deux notes à la fois',
    'if(!(cu && _vendDecuvee(cu)) && _dPr &&', 'if(_dPr &&',
    M => { const c = F.decFA(); return M._fermLegende(c, [], Date.parse(jm(20)), c.mesures_fa, true, []).indexOf('après le pressurage') === -1; });
}

console.log('\n' + '─'.repeat(30));
console.log('  ' + vert + ' vert' + (rouges.length ? ' · ' + rouges.length + ' ROUGE' : ' · 0 rouge'));
if (rouges.length) { rouges.forEach(r => console.log('   ✗ ' + r)); process.exit(1); }
