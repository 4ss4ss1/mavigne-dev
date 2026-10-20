// HARNAIS — REC-1 (§382) : les Récoltes rangées (Cuvier › Récoltes).
//   node scripts/mv-harnais-rec1.mjs           → doit être vert
//   node scripts/mv-harnais-rec1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions de cuvier.js (_recDonnees, _recRdtTxt, _recParcHtml, _recJourHtml, _recFicheHtml,
// renderVendRec, _vendAnnees) sur une vendange fabriquée : deux parcelles rentrées (une estimée sous son maximum, une
// mesurée au-dessus), une vendue en partie, trois pesées sur deux jours, une vendange d'avant, une année du fichier.
// Bouchons (dits ici, pas cachés) : le rendement par parcelle (_mlRendements, cave.js) rend des lignes écrites ici — son
// calcul a ses harnais (vendange-parts, poids-caisse, le millésime) ; les parts d'une pesée (_vendParts, _vpKg, _vpCs,
// _vpNom) sont simplifiées ; « Encore sur pied » (_vendResteHtml) est une marque — elle a ses deux harnais (sansrec1,
// reste-a-rentrer) ; la page et la feuille sont lues dans le texte.
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = {
  cuv: fs.readFileSync('src/cuvier.js', 'utf8'),
  html: fs.readFileSync('index.html', 'utf8'),
  css: fs.readFileSync('src/styles.css', 'utf8'),
  utils: fs.readFileSync('src/utils.js', 'utf8'),
};
function bornes(src, nom) {
  const m = [...src.matchAll(new RegExp('^function ' + nom + '\\s*\\(', 'gm'))];
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
const FONCTIONS = ['_vendMillOfDate', '_vendAnnees', '_vendDateLongue', '_recMilliers', '_recVin', '_recRdtTxt', '_recSanit', '_recDestsTxt',
  '_recDonnees', 'renderVendRec', '_recConnue', '_recTeteHtml', '_recChiffresHtml', '_recVuesHtml', '_recParcHtml', '_recJourHtml', '_recHist',
  '_recFicheHtml', '_matPlur', '_matJj', '_matVin', '_matAge', '_recDests'];

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  let code = "var _recVue = 'parc';\nvar _recSelNom = null;\nvar _matFen = 7;\n";
  try { for (const f of FONCTIONS) code += fn(S.cuv, f) + '\n'; } catch (e) { t('les fonctions de l’onglet existent', false, e.message); return L; }
  const P = { 'Les Charmes': { nom: 'Les Charmes', surface: '1.0', cepage: 'Pinot noir' },
    'Champ Perdrix': { nom: 'Champ Perdrix', surface: '0.5', rendement_hist: [{ millesime: 2024, kg: 2700 }] } };
  const part = (dom, cs, client) => ({ dom, caisses: cs, pck: 25, client: client || '' });
  const REC = [
    { id: 'r1', parcelle: 'Les Charmes', date: '2026-09-01', parts: [part(true, 120)], etat_pct: 92 },
    { id: 'r2', parcelle: 'Champ Perdrix', date: '2026-09-04', parts: [part(true, 40), part(false, 20, 'Maison X')], etat_pct: 60 },
    { id: 'r3', parcelle: 'Champ Perdrix', date: '2026-09-04', parts: [part(true, 30)], etat_pct: 40 },
    { id: 'r0', parcelle: 'Les Charmes', date: '2025-09-10', parts: [part(true, 100)] },
  ];
  const ligne = (nom, o) => Object.assign({ parcelle: P[nom], kg: 0, caisses: 0 }, o);
  const RDT = {
    2026: [ligne('Champ Perdrix', { hlMin: 45, hlMax: 45, hlHa: 45, statut: 'mesure', max: 40, depasse: true, kg: 2250, caisses: 90 }),
           ligne('Les Charmes', { hlMin: 38, hlMax: 41, hlHa: 39.5, statut: 'estime', max: 40, depasse: false, kg: 3000, caisses: 120 })],
    2025: [ligne('Les Charmes', { hlMin: 35, hlMax: 35, hlHa: 35, statut: 'mesure', max: 40, depasse: false, kg: 2500, caisses: 100 })],
  };
  const corps = { innerHTML: '' }, fiche = { innerHTML: '' };
  const ctx = {
    AN: '2026', LARGE: true, ECRIRE: true,
    CAVE_VENDANGE: { recoltes: REC, analyses: [{ parcelle: 'Les Charmes', date: '2026-08-20', val: 200 }], config: {} },
    document: { getElementById: (id) => (id === 'mvv-body' ? corps : id === 'rec-fiche-corps' ? fiche : null) },
    _mvToday: () => '2026-09-08', _mvF1: (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ','),
    _escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'),
    _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>', canWrite: () => ctx.ECRIRE,
    _mlCampagne: () => '2026', _matAnCourant: () => ctx.AN, _matLarge: () => ctx.LARGE, _matAnnees: () => ['2026'],
    _vendParcByName: (n) => P[String(n).trim()] || null, _parcCoul: (n) => (n === 'Champ Perdrix' ? 'b' : 'r'),
    _vendRdtMax: (p, an) => ({ max: 40, src: 'aoc', aoc: 'Gevrey-Chambertin' }), _vendAocDe: () => ({ nom: 'Gevrey-Chambertin' }),
    _vendParts: (r) => r.parts, _vpKg: (p) => p.caisses * p.pck, _vpCs: (p) => p.caisses, _vpNom: (p) => (p.dom ? 'Domaine' : p.client),
    _recKg: (r) => r.parts.reduce((s, p) => s + p.caisses * p.pck, 0), _recKgDom: (r) => r.parts.reduce((s, p) => s + (p.dom ? p.caisses * p.pck : 0), 0),
    _recKgCli: (r) => r.parts.reduce((s, p) => s + (p.dom ? 0 : p.caisses * p.pck), 0), _recCaisses: (r) => r.parts.reduce((s, p) => s + p.caisses, 0),
    _vendResteARentrer: () => ({ lignes: [{ nom: 'En Songe', ha: 0.28 }], sans: [], inconnues: [] }), _vendResteHtml: () => '<div class="MARQUE-RESTE"></div>',
    _caveSaisBanner: () => '', _vendRetoursDus: () => 1, _vendRefreshCockpit() {}, _vendErLbl: () => 'éraflée',
    _vendHlRange: (kg) => (kg / 140).toFixed(1) + '–' + (kg / 130).toFixed(1), _vendCfg: () => ({ ratio_min: 130, ratio_max: 140, sucre_par_degre: 16.83 }),
    _mlKgHl: () => 135, _matSynth: () => ({ tous: {} }),
  };
  ctx.window = ctx; ctx.parseFloat = parseFloat; ctx.isFinite = isFinite; ctx.String = String;
  ctx._mlRendements = (an) => (RDT[String(an)] || []).map((o) => Object.assign({}, o));
  vm.createContext(ctx);
  // les deux formateurs de surface du domaine (KIT-4), les vrais, lus dans utils.js
  const ha = S.utils.match(/function _mvHaNum\(x\)\{[^\n]*\nwindow\._mvHaP=[^\n]*\nwindow\._mvHaT=[^\n]*\n/);
  if (!ha) { t('les formateurs de surface se trouvent dans utils.js', false); return L; }
  code = ha[0] + code;
  try { vm.runInContext(code, ctx, { filename: 'rec1-extrait.js' }); } catch (e) { t('les fonctions extraites se chargent', false, e.message); return L; }

  /* ══ 1. LES CHIFFRES : la moyenne pondérée par la surface, l'an passé sur les mêmes parcelles ══ */
  const D = ctx._recDonnees('2026');
  t('deux parcelles rentrées, trois pesées de la vendange (pas celle de 2025)', D.rows.length === 2 && D.recs.length === 3, D.rows.length + ' / ' + D.recs.length);
  t('la moyenne est pondérée par la surface (41,3 hL/ha)', D.moy && Math.abs(D.moy.hlHa - (39.5 * 1 + 45 * 0.5) / 1.5) < 0.01, D.moy && D.moy.hlHa);
  t('une parcelle estimée rend la moyenne estimée : une fourchette', D.moy && D.moy.statut === 'estime' && ctx._recRdtTxt(D.moy) === '40–42', D.moy && ctx._recRdtTxt(D.moy));
  t('l’an passé, sur les seules parcelles qui en ont un', D.moy1 === 35, String(D.moy1));
  t('le vendu en raisin est compté à part', D.kgCli === 500 && D.kgDom === 4750, D.kgCli + ' / ' + D.kgDom);
  /* ══ 2. UNE VALEUR QUAND LE VOLUME EST MESURÉ, UNE FOURCHETTE QUAND IL EST ESTIMÉ ══ */
  const cp = D.rows.find((o) => o.nom === 'Champ Perdrix'), ch = D.rows.find((o) => o.nom === 'Les Charmes');
  t('mesurée : une valeur', ctx._recRdtTxt(cp) === '45', ctx._recRdtTxt(cp));
  t('estimée : une fourchette', ctx._recRdtTxt(ch) === '38–41', ctx._recRdtTxt(ch));
  /* ══ 3. LES BARRES : le dépassement, le maximum, l'an passé ══ */
  const ph = ctx._recParcHtml(D);
  t('une ligne par parcelle rentrée, qui ouvre sa fiche par son nom', (ph.match(/onclick="_recSel\(this\.dataset\.nom\)"/g) || []).length === 2 && /data-nom="Champ Perdrix"/.test(ph));
  t('le dépassement se voit : barre et chiffre au ton danger, encadré qui nomme la parcelle', /class="bar dep"/.test(ph) && /<b class="dep">45<\/b>/.test(ph)
    && /mvencadre-danger[\s\S]{0,120}Champ Perdrix/.test(ph));
  t('le maximum de l’appellation sur chaque ligne, l’an passé sur celle qui en a un', (ph.match(/class="mx"/g) || []).length === 2 && (ph.match(/class="n1"/g) || []).length === 1);
  /* ══ 4. LE JOURNAL ══ */
  const jh = ctx._recJourHtml(D);
  t('le jour le plus récent en tête', jh.indexOf('vendredi 4 septembre') > -1 && jh.indexOf('vendredi 4 septembre') < jh.indexOf('mardi 1er septembre'), jh.slice(0, 200));
  t('le sanitaire au ton du jeu : 92 réussi, 60 à surveiller, 40 en retard', /mvpas-fait">sanitaire 92 %/.test(jh) && /mvpas-surveiller">sanitaire 60 %/.test(jh) && /mvpas-retard">sanitaire 40 %/.test(jh));
  t('les destinataires et l’éraflage sur chaque pesée', /Domaine 40 c\. · Maison X 20 c\. · éraflée/.test(jh));
  /* ══ 5. LA FICHE ══ */
  const fh = ctx._recFicheHtml('Champ Perdrix', D);
  t('fiche : au-dessus du maximum, dit sans fourchette pour une mesurée', /Au-dessus du maximum de l’appellation Gevrey-Chambertin \(40 hL\/ha\)\./.test(fh));
  t('fiche : la surface de la parcelle au centiare', /0,5000 ha/.test(fh));
  t('fiche : une pesée = un « Modifier » pour qui peut écrire', (fh.match(/onclick="openOvVendRec\(this\.dataset\.id\)">Modifier/g) || []).length === 2);
  t('fiche : l’historique mêle l’appli et le fichier, et le dit', /<span class="a">2024<\/span>/.test(fh) && /bar fic/.test(fh) && /Barres pâles/.test(fh));
  ctx.ECRIRE = false;
  t('lecture seule : ni « Modifier » ni pesée à ajouter', !/Modifier<\/button>/.test(ctx._recFicheHtml('Champ Perdrix', D)) && !/openOvVendRec\(null/.test(ctx._recFicheHtml('Champ Perdrix', D)));
  ctx.ECRIRE = true;
  /* ══ 6. L'ÉCRAN ENTIER, la vendange en cours puis une vendange passée ══ */
  ctx.renderVendRec();
  const e1 = corps.innerHTML;
  t('vendange en cours : la tête, les chiffres, le rendement, le journal à droite, « Encore sur pied »', /Nouvelle récolte/.test(e1) && /mvchiffres rec-chiffres/.test(e1)
    && /Rendement par parcelle/.test(e1) && /Journal des pesées/.test(e1) && /MARQUE-RESTE/.test(e1));
  t('les surfaces passent par les formateurs du domaine (totaux au centième)', /1,50 ha sur 1,78/.test(e1));
  t('le vendu en raisin et le retour attendu dans un encadré, vers les ventes', /mvencadre-attention rec-vrac[\s\S]{0,260}1 retour client attendu[\s\S]{0,200}openVendVrac\(\)/.test(e1));
  ctx.AN = '2025';
  ctx.renderVendRec();
  const e2 = corps.innerHTML;
  t('vendange passée : ni pesée à ajouter, ni « Encore sur pied »', !/Nouvelle récolte/.test(e2) && !/MARQUE-RESTE/.test(e2) && /dernière pesée le/.test(e2));
  t('les vendanges à relire réunissent maturités et pesées', ctx._vendAnnees().indexOf('2025') >= 0);
  ctx.AN = '2026';
  /* ══ 7. LE BRANCHEMENT, lu dans le texte ══ */
  t('changer de vendange redessine l’onglet ouvert', /_vendRenderTab\(\);\s*\}/.test(fn(S.cuv, '_matSetAn')));
  t('la fiche des Maturités renvoie vers la récolte', /_vendVoir\(\\'rec\\',this\.dataset\.nom\)">Voir sa récolte/.test(S.cuv));
  t('les anciens blocs sont partis (apports, pluriannuel)', !/mvmat-ttl">Apports par parcelle/.test(S.cuv) && !/function _vendRendHistHtml/.test(S.cuv) && !/function _vendApportsSvg/.test(S.cuv));
  t('la fenêtre de la fiche existe dans index.html', S.html.includes('id="ovRecFiche"') && S.html.includes('id="rec-fiche-corps"'));
  t('le style vit dans la feuille, après celui des Maturités', S.css.indexOf('★ REC-1 (§382)') > S.css.indexOf('★ FIN MATU-1') && S.css.includes('★ FIN REC-1'));
  t('les gestes sont exposés', ['_recSel', '_recSetVue', '_vendVoir'].every((n) => S.cuv.includes('window.' + n + ' ')));
  t('la nouveauté vise l’onglet Récoltes', /cible: '#mvv-tab-rec'/.test(S.utils) && /id="mvv-tab-rec"/.test(S.cuv));
  return L;
}

const DEFAUTS = [
  ['la moyenne n’est plus pondérée', (S) => ({ ...S, cuv: S.cuv.replace('sB += o.hlHa * o.surface;', 'sB += o.hlHa * 0.75;') })],
  ['une mesurée s’affiche en fourchette', (S) => ({ ...S, cuv: S.cuv.replace("Math.round(o.hlMin) === Math.round(o.hlMax)) return String(Math.round(o.hlHa));", "Math.round(o.hlMin) === Math.round(o.hlMax)) return Math.round(o.hlMin) + '\\u2013' + Math.round(o.hlMax);") })],
  ['l’an passé n’est plus marqué', (S) => ({ ...S, cuv: S.cuv.replace("var n1 = o.n1 != null ? '<i class=\"n1\"", "var n1 = false ? '<i class=\"n1\"") })],
  ['le dépassement ne se voit plus', (S) => ({ ...S, cuv: S.cuv.replace("'<i class=\"bar' + (o.depasse ? ' dep' : '') + '\"", "'<i class=\"bar' + '' + '\"") })],
  ['le journal part du plus ancien', (S) => ({ ...S, cuv: S.cuv.replace('Object.keys(jours).sort().reverse().forEach(function(d){', 'Object.keys(jours).sort().forEach(function(d){') })],
  ['les tons du sanitaire sont inversés', (S) => ({ ...S, cuv: S.cuv.replace("(s >= 80 ? 'mvpas-fait' : s >= 55 ? 'mvpas-surveiller' : 'mvpas-retard')", "(s >= 80 ? 'mvpas-retard' : s >= 55 ? 'mvpas-surveiller' : 'mvpas-fait')") })],
  ['changer de vendange ne redessine que les Maturités', (S) => ({ ...S, cuv: S.cuv.replace("_matVoirTout = { jamais:false, rent:false }; _vendRenderTab(); }", "_matVoirTout = { jamais:false, rent:false }; renderVendAna(); }") })],
  ['une vendange passée propose encore une pesée', (S) => ({ ...S, cuv: S.cuv.replace('var an = _matAnCourant(), D = _recDonnees(an), canEdit = canWrite() && D.courante;', 'var an = _matAnCourant(), D = _recDonnees(an), canEdit = canWrite();') })],
  ['la fenêtre de la fiche manque', (S) => ({ ...S, html: S.html.replace('id="ovRecFiche"', 'id="ovRecFicheX"') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nREC-1 — les Récoltes rangées');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nREC-1 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = S.cuv === SAIN.cuv && S.html === SAIN.html && S.css === SAIN.css && S.utils === SAIN.utils;
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
