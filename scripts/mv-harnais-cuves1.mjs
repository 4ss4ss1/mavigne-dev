// HARNAIS — CUVES-1 (§383) : les Cuves rangées (Cuvier › Cuves) — une cuve s'ouvre en fiche.
//   node scripts/mv-harnais-cuves1.mjs           → doit être vert
//   node scripts/mv-harnais-cuves1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions de cuvier.js (renderVendCuves, _vendTeteHtml, _vendChiffresHtml, _vendRempHtml, _vendFicheHtml,
// _vendBascOuv) sur une cuverie fabriquée : deux cuves en fermentation (dont une à relever), une en macération, une en
// attente d'encuvage, une décuvée. Trois écrans : ordinateur, téléphone avec la fenêtre, bac à sable sans fenêtre.
// Bouchons (dits ici, pas cachés) : le détail d'une cuve (_vendDetailHtml), ses lignes (_vendCorpsHtml), ses outils, ses
// vignettes (_vendCellHtml) et les sections fusionnées / décuvées sont des marques — ils ont leurs harnais (GF, CUV-13,
// fusion, CAVE-2, alignement) ; « à relever » (_vendADue) et le volume contenu (_vendVolContenu) sont lus sur la cuve.
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = {
  cuv: fs.readFileSync('src/cuvier.js', 'utf8'),
  html: fs.readFileSync('index.html', 'utf8'),
  css: fs.readFileSync('src/styles.css', 'utf8'),
  utils: (fs.readFileSync('src/utils.js', 'utf8') + '\n' + fs.readFileSync('src/whats-new.js', 'utf8')),
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
const FONCTIONS = ['renderVendCuves', '_vendTeteHtml', '_vendChiffresHtml', '_vendRempHtml', '_vendFicheHtml', '_vendBascOuv', '_vendDateLongue', '_matPlur', '_matVin'];

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  let code = 'var _vendOuvert = null;\n';
  try { for (const f of FONCTIONS) code += fn(S.cuv, f) + '\n'; } catch (e) { t('les fonctions de l’onglet existent', false, e.message); return L; }
  const cuve = (id, nom, statut, vol, cap, o) => Object.assign({ id, nom, statut, volume_hl: cap, _vol: vol, parcelles: ['Les Charmes'], cuve_ref: 'p' + id }, o || {});
  const CUVES = [cuve('c1', 'Cuve 1', 'fa', 40, 50, { _due: true, _stale: 2 }), cuve('c2', 'Cuve 2', 'fa', 30, 40),
    cuve('c3', 'Cuve 3', 'mpf', 20, 30), cuve('c4', 'Cuve 4', 'setup', 0, 20), cuve('c5', 'Cuve 5', 'termine', 0, 25)];
  const els = { 'mvv-body': { innerHTML: '' } }, appels = [];
  const ctx = {
    AN: '2026', LARGE: true, ECRIRE: true, FENETRE: true,
    CAVE_VENDANGE: { cuves_vinif: CUVES },
    document: { getElementById: (id) => (id === 'cuv-fiche-corps' ? (ctx.FENETRE ? (els[id] = els[id] || { innerHTML: '' }) : null) : els[id] || null) },
    _mvToday: () => '2026-09-08', _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>',
    _escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'),
    canWrite: () => ctx.ECRIRE, _matAnCourant: () => ctx.AN, _mlCampagne: () => '2026', _matLarge: () => ctx.LARGE, _vendAnnees: () => ['2026', '2025'],
    _vendEstFusionnee: () => false, _vendADue: (c) => !!c._due, _vendStale: (c) => c._stale || 0, _vendVolContenu: (c) => ({ hl: c._vol }),
    _caveSaisBanner: () => '', _vendOutilsHtml: () => '<div class="MARQUE-OUTILS"></div>', _vendCorpsHtml: () => '<div class="MARQUE-LISTE"></div>',
    _vendFusionneesSection: () => '', _vendDecuveesSection: () => '', _vendListe: (l) => l.slice(), _vendCellHtml: (c) => '<i class="MARQUE-VIGNETTE">' + c.id + '</i>',
    _vendDetailHtml: (c) => '<div class="MARQUE-DETAIL">' + c.id + '</div>', _vendRepere: (c) => c.id.toUpperCase(), _caveCuve: () => ({ materiau: 'inox' }),
    _parcCoul: () => 'r', _vendStatLbl: (s) => ({ fa: 'FA', mpf: 'MPF', setup: 'Setup', termine: 'Terminé' })[s] || s, _vendCuvF1: (x) => String(x),
    _vendPeindreGraphes: () => appels.push('peindre'), _vendRefreshCockpit() {},
  };
  ctx.window = ctx;
  ctx._mvGraphOublier = () => {};
  ctx.openOv = (id) => appels.push('ouvre:' + id); ctx.closeOv = (e, id) => appels.push('ferme:' + id);
  vm.createContext(ctx);
  try { vm.runInContext(code, ctx, { filename: 'cuves1-extrait.js' }); } catch (e) { t('les fonctions extraites se chargent', false, e.message); return L; }
  const corps = () => els['mvv-body'].innerHTML;

  /* ══ 1. LES QUATRE CHIFFRES ══ */
  const kp = ctx._vendChiffresHtml(CUVES);
  t('en fermentation : deux cuves, une en macération à froid', /En fermentation<\/span><span class="mvchiffres-v">2<small class="rec-u">cuves<\/small>[\s\S]{0,60}1 en macération à froid/.test(kp), kp.slice(0, 300));
  t('à relever : une, nommée', /À relever<\/span><span class="mvchiffres-v">1<\/span><span class="rec-sous">Cuve 1</.test(kp));
  t('en cuve : 90 hL sur 140 hL de cuverie, la jauge à 64 %', /En cuve<\/span><span class="mvchiffres-v">90<small class="rec-u">hL<\/small><\/span><span class="rec-sous">sur 140 hL de cuverie<\/span><span class="rec-jauge"><i style="width:64%">/.test(kp));
  t('en attente d’encuvage : une, nommée', /Encuvage<\/span><span class="mvchiffres-v">1<\/span><span class="rec-sous">Cuve 4</.test(kp));
  /* ══ 2. ORDINATEUR : le plan à droite, puis la fiche ══ */
  ctx.renderVendCuves();
  const e1 = corps();
  t('la tête : « Fusionner » et « Nouvelle cuve »', /onclick="openVendFusion\(\)">Fusionner/.test(e1) && /onclick="openOvVendCuve\(null\)">[\s\S]{0,80}Nouvelle cuve/.test(e1));
  t('aucune cuve ouverte : le plan de cuverie à droite, avec son remplissage', /cuv-remp[\s\S]*90 hL en cuve sur 140 hL de cuverie, 64 %/.test(e1) && (e1.match(/MARQUE-VIGNETTE/g) || []).length === 5);
  t('le bandeau « à mesurer » reste, et ouvre la cuve', /mvv-alert[\s\S]{0,400}onclick="_vendBascOuv\('c1'\)"/.test(e1));
  ctx._vendBascOuv('c2');
  const e2 = corps();
  t('ouverte : la fiche à droite, le détail d’avant dedans, le plan parti', /cuv-fiche[\s\S]*MARQUE-DETAIL">c2/.test(e2) && !/cuv-remp/.test(e2) && !appels.some((a) => a.startsWith('ouvre:')));
  t('la fiche : la cuve, l’étape, la contenance, la couleur, et la croix qui la referme', /Cuve C2/.test(e2) && /mvpas-etiquette">FA</.test(e2) && /inox · 40/.test(e2)
    && /Rouge/.test(e2) && /data-id="c2" onclick="_vendBascOuv\(this\.dataset\.id\)"/.test(e2));
  ctx._vendBascOuv('c2');
  t('la croix : retour au plan', /cuv-remp/.test(corps()) && ctx._vendOuvert === null);
  /* ══ 3. TÉLÉPHONE : la fenêtre ══ */
  ctx.LARGE = false; appels.length = 0;
  ctx._vendBascOuv('c1');
  const f1 = els['cuv-fiche-corps'].innerHTML;
  t('au téléphone, la fiche s’ouvre dans sa fenêtre, pas dans l’écran', /MARQUE-DETAIL">c1/.test(f1) && !/MARQUE-DETAIL/.test(corps()) && appels.includes('ouvre:ovCuveFiche'));
  t('une cuve à relever le dit en tête de fiche, avec « Noter un relevé »', /mvencadre-attention[\s\S]{0,200}Pas de relevé depuis 2 jours[\s\S]{0,300}onclick="openOvVendMesure\(this\.dataset\.id\)">Noter un relevé/.test(f1));
  t('ses courbes se peignent une fois la fenêtre remplie', appels.lastIndexOf('peindre') > appels.indexOf('ouvre:ovCuveFiche'));
  ctx._vendBascOuv('c1');
  t('la retoucher la referme', appels.includes('ferme:ovCuveFiche') && ctx._vendOuvert === null);
  /* ══ 4. SANS FENÊTRE (index.html ancien, bac à sable) : la fiche se pose dans l'écran ══ */
  ctx.FENETRE = false;
  ctx._vendBascOuv('c2');
  t('sans fenêtre, la fiche se pose dans l’écran', /rec-grille rec-v-parc cuv-ici/.test(corps()) && /MARQUE-DETAIL">c2/.test(corps()));
  ctx._vendBascOuv('c2'); ctx.FENETRE = true; ctx.LARGE = true;
  /* ══ 5. LECTURE SEULE, VENDANGE PASSÉE ══ */
  ctx.ECRIRE = false; ctx.renderVendCuves();
  const e3 = corps();
  t('lecture seule : ni « Nouvelle cuve » ni « Fusionner »', !/Nouvelle cuve/.test(e3) && !/openVendFusion/.test(e3));
  t('lecture seule : la fiche prévient, sans bouton de relevé', /Pas de relevé depuis/.test(ctx._vendFicheHtml(CUVES[0], false)) && !/Noter un relevé/.test(ctx._vendFicheHtml(CUVES[0], false)));
  ctx.ECRIRE = true; ctx.AN = '2025'; ctx.renderVendCuves();
  const e4 = corps();
  t('vendange passée : « décuvées », renvoi au Chai, ni chiffres ni cuves', /Les cuves de 2025 sont décuvées/.test(e4) && /au Chai/.test(e4) && !/mvchiffres/.test(e4) && !/MARQUE-LISTE/.test(e4) && !/Nouvelle cuve/.test(e4));
  ctx.AN = '2026';
  /* ══ 6. LE BRANCHEMENT, lu dans le texte ══ */
  t('la ligne ne se déplie plus sur place', !/mvv-det/.test(fn(S.cuv, '_vendLigneHtml')) && !/_vendDetailHtml/.test(fn(S.cuv, '_vendLigneHtml')));
  t('le plan de la liste : au téléphone seulement, sans détail glissé dessous', /_vendVue==='plan' && !_matLarge\(\)/.test(fn(S.cuv, '_vendCorpsHtml')) && !/_vendDetailHtml/.test(fn(S.cuv, '_vendCorpsHtml')));
  t('les boutons flottants et l’ancien graphique de remplissage sont partis', !/mvv-fab/.test(fn(S.cuv, 'renderVendCuves')) && !/function _vendRemplirSvg/.test(S.cuv));
  t('la fenêtre de la fiche existe dans index.html', S.html.includes('id="ovCuveFiche"') && S.html.includes('id="cuv-fiche-corps"'));
  t('le style vit dans la feuille, après celui des Récoltes', S.css.indexOf('★ CUVES-1 (§383)') > S.css.indexOf('★ FIN REC-1') && S.css.includes('★ FIN CUVES-1'));
  t('l’aide et la nouveauté le disent', /\['Une cuve s’ouvre en fiche', /.test(S.utils) && /cible: '#mvv-tab-cuves'/.test(S.utils) && !/dépliez la cuve/.test(S.utils));
  return L;
}

const DEFAUTS = [
  ['la ligne se déplie de nouveau sur place', (S) => ({ ...S, cuv: S.cuv.replace("  /* ★ CUVES-1 (§383) : la cuve ouverte se lit dans sa fiche (à droite, ou dans sa fenêtre) ; la ligne reste marquée. */\n  return h+'</div>';", "  h+='<div class=\"mvv-det\"'+(ouv?'':' hidden')+'>'+(ouv?_vendDetailHtml(c,canEdit):'')+'</div>';\n  return h+'</div>';") })],
  ['« à relever » compte toutes les cuves actives', (S) => ({ ...S, cuv: S.cuv.replace("var due=cuves.filter(_vendADue), setup=act.filter(", "var due=act, setup=act.filter(") })],
  ['le remplissage oublie la contenance', (S) => ({ ...S, cuv: S.cuv.replace("act.forEach(function(c){ vol+=(_vendVolContenu(c).hl||0); cap+=(parseFloat(c.volume_hl)||0); });\n  var noms=", "act.forEach(function(c){ vol+=(_vendVolContenu(c).hl||0); cap+=0; });\n  var noms=") })],
  ['au téléphone, la fiche reste dans l’écran', (S) => ({ ...S, cuv: S.cuv.replace("  if(_matLarge()||!corps) return;\n", "  return;\n") })],
  ['une vendange passée montre encore les cuves', (S) => ({ ...S, cuv: S.cuv.replace("  if(!courante){\n    h+='<section class=\"mvcarte rec-vide\"><div class=\"rec-vide-ic\">'+_mvIcon('cuve',24)", "  if(false){\n    h+='<section class=\"mvcarte rec-vide\"><div class=\"rec-vide-ic\">'+_mvIcon('cuve',24)") })],
  ['la fiche ne prévient plus qu’il manque un relevé', (S) => ({ ...S, cuv: S.cuv.replace("  if(_vendADue(c)) h+='<div class=\"mvencadre mvencadre-attention rec-fi-enc\">'", "  if(false) h+='<div class=\"mvencadre mvencadre-attention rec-fi-enc\">'") })],
  ['la lecture seule peut noter un relevé', (S) => ({ ...S, cuv: S.cuv.replace("+(canEdit?'<button type=\"button\" class=\"mvbtn mvbtn-principal mvbtn-compact\" data-id=\"'+_escAttr(c.id)+'\" onclick=\"openOvVendMesure(", "+(true?'<button type=\"button\" class=\"mvbtn mvbtn-principal mvbtn-compact\" data-id=\"'+_escAttr(c.id)+'\" onclick=\"openOvVendMesure(") })],
  ['la fenêtre de la fiche manque', (S) => ({ ...S, html: S.html.replace('id="cuv-fiche-corps"', 'id="cuv-fiche-corpsX"') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nCUVES-1 — les Cuves rangées, une cuve s’ouvre en fiche');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nCUVES-1 — contre-épreuve');
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
