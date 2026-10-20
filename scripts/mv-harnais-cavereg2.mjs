// HARNAIS — CAVEREG-2 (§387) : les réglages du Cuvier et du Chai en lignes, et leur fenêtre (roue crantée de la Cave).
//   node scripts/mv-harnais-cavereg2.mjs           → doit être vert
//   node scripts/mv-harnais-cavereg2.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions : renderVendParam, _vendReg, _vendRegNombre, _vendRegRendre, _vendRegLire, _vendRegOk,
// _vendRegChoix, _vendRegUnite, _vendCfg, _matFour (cuvier.js) ; renderCaveReglages, _cregLigne, _cregGroupe, _caveOuilHtml,
// _caveRegOuil (cave.js). Bouchons : la fenêtre de saisie commune (openPrompt) répond tout de suite ; l'enregistrement, le
// toast, la base du rendement (_vendSetRdtBase), le parc à cuves (une marque), les seuils d'ouillage (une table).
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = { cuv: fs.readFileSync('src/cuvier.js', 'utf8'), cave: fs.readFileSync('src/cave.js', 'utf8'), html: fs.readFileSync('index.html', 'utf8'),
  css: fs.readFileSync('src/styles.css', 'utf8'), utils: fs.readFileSync('src/utils.js', 'utf8') };
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
const CUV = ['_vendRegLigne', '_vendRegGroupe', '_vendFr', 'renderVendParam', '_vendReg', '_vendRegNombre', '_vendRegRendre', '_vendRegVal', '_vendRegLire',
  '_vendRegMaj', '_vendRegUnite', '_vendRegVider', '_vendRegOk', '_vendRegChoix', '_vendCfg', '_matFour', '_matPlur'];
const CAV = ['_cregLigne', '_cregGroupe', '_caveOuilHtml', '_caveRegOuil', 'renderCaveReglages'];

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  let code = 'var _vendRegEt = null;\n';
  try { for (const f of CUV) code += fn(S.cuv, f) + '\n'; for (const f of CAV) code += fn(S.cave, f) + '\n'; }
  catch (e) { t('les fonctions des réglages existent', false, e.message); return L; }
  const els = {}, toasts = [], sauves = [], appels = [];
  const mk = (id) => (els[id] = els[id] || { id, value: '', innerHTML: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; }, removeAttribute(k) { delete this.attrs[k]; } });
  ['cave-reg-cuvier', 'mvc-body-reglages', 'creg-ed-corps', 'creg-min', 'creg-max', 'creg-conv'].forEach(mk);
  const ctx = {
    ADMIN: true, ECRIRE: true, REPONSE: '',
    CAVE_VENDANGE: { config: { poids_caisse_kg: 25, ratio_min: 130, ratio_max: 140, sucre_par_degre: 16.83, rdt_base: 'jus', mat_four: { r: { min: 205, max: 225 }, b: null } } },
    CAVE_ELEVAGE: { config: { ouillage_alerte_j: 14, ouillage_par_mil: { '2025': 21 } } },
    document: { getElementById: (id) => els[id] || null },
    _mvF1: (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ','), _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>',
    _escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'),
    isAdmin: () => ctx.ADMIN, canWrite: () => ctx.ECRIRE, showToast: (m) => toasts.push(m), _vendFbSave: (m) => sauves.push(m),
    _caveSaisBanner: () => '', _vendInjectCss() {}, _vendEnsureSheetCss() {}, _vendRefreshCockpit() {}, _vendClients: () => [1, 2],
    _vendRdtBase: () => ctx.CAVE_VENDANGE.config.rdt_base, _vendSetRdtBase: (b) => { appels.push('base:' + b); ctx.CAVE_VENDANGE.config.rdt_base = b; },
    _caveV2InjectCss() {}, _caveSeuilGlobal: () => 14, _caveMilsEnCave: () => ['2025', '2026'], _caveSeuilOu: (m) => (ctx.CAVE_ELEVAGE.config.ouillage_par_mil[m] || 14),
    _caveFutL: () => 228, _caveParcCardHtml: () => '<div class="MARQUE-PARC"></div>',
    openOv: (id) => appels.push('ouvre:' + id), closeOv: (e, id) => appels.push('ferme:' + id),
    openPrompt: (o) => { appels.push('prompt:' + o.titre + ':' + o.valeur); o.cb(ctx.REPONSE); },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  try { vm.runInContext(code, ctx, { filename: 'cavereg2-extrait.js' }); } catch (e) { t('les fonctions extraites se chargent', false, e.message); return L; }
  const cuvier = () => els['cave-reg-cuvier'].innerHTML, fen = () => els['creg-ed-corps'].innerHTML;

  /* ══ 1. LE CUVIER EN LIGNES ══ */
  ctx.renderVendParam();
  const h = cuvier();
  t('trois groupes, comme la maquette', /creg-g-t">Maturité</.test(h) && /creg-g-t">Pesée et rendement</.test(h) && /creg-g-t">Vente de raisin</.test(h));
  t('une ligne par réglage, sa valeur écrite', /Fourchette des rouges<span class="mvpas mvpas-etiquette creg-neuf">nouveau<\/span><\/span><span class="d">12,2 à 13,4 %vol potentiel<\/span><\/span><span class="v">205 à 225 g\/L</.test(h)
    && /Fourchette des blancs[\s\S]{0,140}pas de bande dans les Maturités<\/span><\/span><span class="v">aucune</.test(h) && /<span class="v">16,83 g\/L</.test(h)
    && /<span class="v">25 kg</.test(h) && /<span class="v">130 à 140 kg par hL</.test(h) && /<span class="v">jus clair</.test(h) && /<span class="v">2 clients</.test(h));
  t('plus aucun champ dans la page, plus de « Enregistrer les paramètres »', !/<input/.test(h) && !/Enregistrer les paramètres/.test(h) && !/_vendSaveParam/.test(h));
  t('les portes d’avant restent : corriger un poids, gérer les clients, livraisons et bons', /onclick="openVendPoids\(\)">Ouvrir/.test(h) && /onclick="openVendClients\(\)">Gérer/.test(h) && /onclick="openVendVrac\(\)">Ouvrir/.test(h));
  ctx.ADMIN = false; ctx.renderVendParam();
  t('hors administrateur : rien à modifier, les portes restent', !/Modifier/.test(cuvier()) && /openVendVrac/.test(cuvier()));
  ctx.ADMIN = true;
  /* ══ 2. UN NOMBRE SEUL : la fenêtre de saisie commune, les bornes d'avant ══ */
  ctx.REPONSE = '24,5'; ctx._vendReg('pck');
  t('le poids d’une caisse : la fenêtre commune, sa valeur, enregistré', appels.includes('prompt:Poids d’une caisse:25') && ctx.CAVE_VENDANGE.config.poids_caisse_kg === 24.5 && /Poids d’une caisse : 24,5 kg$/.test(sauves[sauves.length - 1]));
  ctx.REPONSE = '80'; ctx._vendReg('pck');
  t('hors bornes : ramené à 60 kg, et dit', ctx.CAVE_VENDANGE.config.poids_caisse_kg === 60 && /ramené aux bornes/.test(sauves[sauves.length - 1]));
  ctx.REPONSE = '16,8333'; ctx._vendReg('spd');
  t('le sucre pour un degré, au centième', ctx.CAVE_VENDANGE.config.sucre_par_degre === 16.83);
  ctx.ADMIN = false; const nP = appels.length; ctx._vendReg('pck');
  t('réservé à l’administrateur', appels.length === nP && /administrateur/.test(toasts[toasts.length - 1]));
  ctx.ADMIN = true;
  /* ══ 3. LA FOURCHETTE : deux bornes ou aucune, sucre ou degré, l'autre couleur gardée ══ */
  ctx._vendReg('four-b');
  t('la fenêtre de la fourchette s’ouvre, sans bornes pour les blancs', appels.includes('ouvre:ovCregEdit') && /Fourchette des blancs/.test(fen()) && /onclick="_vendRegUnite\('a'\)">Degré %vol/.test(fen()));
  els['creg-min'].value = '200'; els['creg-max'].value = '';
  t('une seule borne : refusée, dans la fenêtre', /deux bornes/.test(ctx._vendRegLire().err || ''));
  els['creg-min'].value = '215'; els['creg-max'].value = '195';
  const r1 = ctx._vendRegLire();
  t('deux bornes inversées : remises dans l’ordre', r1.val && r1.val.min === 195 && r1.val.max === 215, JSON.stringify(r1));
  els['creg-min'].value = '210'; els['creg-max'].value = '210';
  t('un haut égal au bas : refusé', /dépasser le bas/.test(ctx._vendRegLire().err || ''));
  ctx._vendRegEt.u = 'a'; els['creg-min'].value = '11,6'; els['creg-max'].value = '12,8';
  const r2 = ctx._vendRegLire();
  t('en degré : converti en sucre (× 16,83)', r2.val && r2.val.min === 195 && r2.val.max === 215, JSON.stringify(r2));
  ctx._vendRegOk();
  const f = ctx.CAVE_VENDANGE.config.mat_four;
  t('enregistrée : les blancs posés, les rouges gardés, la fenêtre fermée', f.b && f.b.min === 195 && f.r && f.r.min === 205 && appels.includes('ferme:ovCregEdit') && /Fourchette des blancs : 195 à 215 g\/L/.test(sauves[sauves.length - 1]));
  ctx._vendReg('four-b'); ctx._vendRegVider(); ctx._vendRegOk();
  t('vider la retire', ctx.CAVE_VENDANGE.config.mat_four.b === null && (ctx.CAVE_VENDANGE.config.mat_four.r || {}).min === 205 && /retirée/.test(sauves[sauves.length - 1]));
  /* ══ 4. LE RENDEMENT JUS, LA BASE ══ */
  ctx._vendReg('ratio'); els['creg-min'].value = '145'; els['creg-max'].value = '128'; ctx._vendRegOk();
  t('le rendement jus : remis dans l’ordre, et dit', ctx.CAVE_VENDANGE.config.ratio_min === 128 && ctx.CAVE_VENDANGE.config.ratio_max === 145 && /remis dans l’ordre/.test(sauves[sauves.length - 1]));
  ctx._vendReg('base');
  t('la base : deux choix, le choisi marqué', /mvbtn mvbtn-option on" aria-pressed="true" onclick="_vendRegChoix\('jus'\)"><b>Jus clair/.test(fen()) && /_vendRegChoix\('total'\)"><b>Jus et lies/.test(fen()));
  ctx._vendRegChoix('total');
  t('choisir enregistre par la fonction d’avant, et ferme', appels.includes('base:total') && appels.lastIndexOf('ferme:ovCregEdit') > appels.lastIndexOf('base:total'));
  /* ══ 5. LE CHAI EN LIGNES, L'OUILLAGE DANS LA FENÊTRE ══ */
  ctx.renderCaveReglages();
  const c1 = els['mvc-body-reglages'].innerHTML;
  t('Élevage : l’alerte d’ouillage (et le millésime qui a son seuil), la contenance d’un fût', /Alerte d’ouillage<\/span><span class="d">2025 : 21 j<\/span><\/span><span class="v">tous les 14 jours<\/span><button[^>]*onclick="_caveRegOuil\(\)">Modifier/.test(c1)
    && /Contenance d’un fût[\s\S]{0,140}<span class="v">228 L<\/span><button[^>]*onclick="_caveFutPrompt\(\)">Modifier/.test(c1));
  t('le parc à cuves reste, les outils suivent', /MARQUE-PARC/.test(c1) && /Convertisseur SO₂[\s\S]{0,160}onclick="openOvCaveConvert\(\)">Ouvrir/.test(c1));
  ctx.ADMIN = false; ctx.renderCaveReglages();
  t('hors administrateur : les outils seuls', !/Alerte d’ouillage/.test(els['mvc-body-reglages'].innerHTML) && /Convertisseur/.test(els['mvc-body-reglages'].innerHTML));
  ctx.ADMIN = true; ctx._caveRegOuil();
  t('l’ouillage s’ouvre dans la fenêtre, avec ses compteurs d’avant', els['creg-ed-corps'].attrs['data-ouil'] === '1' && /id="mvc-seuil-num"/.test(fen()) && /_caveSeuilStep\(1\)/.test(fen()) && /_caveSeuilMilStep/.test(fen()));
  ctx.CAVE_ELEVAGE.config.ouillage_par_mil['2026'] = 9; els['creg-ed-corps'].innerHTML = ''; ctx.renderCaveReglages();
  t('la fenêtre suit chaque geste (le rendu la réécrit)', /9 j/.test(fen()));
  ctx._vendReg('ratio');
  t('la fenêtre rendue au Cuvier n’est plus celle de l’ouillage', els['creg-ed-corps'].attrs['data-ouil'] === undefined);
  t('le compteur général redessine la page', /renderCaveReglages\(\);\s*\/\/ ★ CAVEREG-2/.test(fn(S.cave, '_caveSeuilStep')));
  /* ══ 6. LA PAGE, LE STYLE, LA NOUVEAUTÉ ══ */
  t('la fenêtre existe dans index.html', S.html.includes('id="ovCregEdit"') && S.html.includes('id="creg-ed-corps"'));
  t('le style des lignes vit dans la feuille', S.css.indexOf('★ CAVEREG-2 (§387)') > S.css.indexOf('★ FIN CAVEREG-1') && /\.creg-l\{/.test(S.css));
  t('la nouveauté le dit', /\{ v: '9\.49'/.test(S.utils));
  return L;
}

const DEFAUTS = [
  ['enregistrer une couleur efface l’autre', (S) => ({ ...S, cuv: S.cuv.replace("var c=E.k.slice(-1), f=Object.assign({ r:null, b:null }, CAVE_VENDANGE.config.mat_four||{});", "var c=E.k.slice(-1), f={ r:null, b:null };") })],
  ['le degré n’est plus converti', (S) => ({ ...S, cuv: S.cuv.replace("sLo=lo>0?(deg?lo*spd:lo):NaN, sHi=hi>0?(deg?hi*spd:hi):NaN;", "sLo=lo>0?lo:NaN, sHi=hi>0?hi:NaN;") })],
  ['les ratios inversés restent inversés', (S) => ({ ...S, cuv: S.cuv.replace("    if(inv){ var t=a; a=b; b=t; }\n", "") })],
  ['le poids d’une caisse n’a plus de bornes', (S) => ({ ...S, cuv: S.cuv.replace("y=Math.min(pk?60:20, Math.max(pk?10:15, x));", "y=x;") })],
  ['« Modifier » pour tout le monde', (S) => ({ ...S, cuv: S.cuv.replace("mod=adm?'Modifier':'';", "mod='Modifier';") })],
  ['l’alerte d’ouillage tait les seuils par millésime', (S) => ({ ...S, cave: S.cave.replace("propres.length?propres.map(function(m){", "false?propres.map(function(m){") })],
  ['la fenêtre de l’ouillage ne suit plus', (S) => ({ ...S, cave: S.cave.replace("  if(ov&&ov.getAttribute&&ov.getAttribute('data-ouil')==='1') ov.innerHTML=_caveOuilHtml();\n", "") })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nCAVEREG-2 — les réglages du Cuvier et du Chai en lignes');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nCAVEREG-2 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = Object.keys(SAIN).every((k) => S[k] === SAIN[k]);
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
