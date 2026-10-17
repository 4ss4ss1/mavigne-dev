/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ARRIVEE-4 (§355) : LE BOUTON « FILTRES » À L'ARRIVÉE DE L'OUVRIER
   Lancer : node scripts/mv-harnais-arrivee4.mjs          (le contrôle)
            node scripts/mv-harnais-arrivee4.mjs --contre  (la contre-épreuve)
   `_pFxEtat` et `_pFxActifs` sont EXÉCUTÉES ; le reste est le câblage (la
   ligne, la feuille, les leviers d'avant, la tournée qui garde la main, le CSS).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const A0 = fs.readFileSync('src/app.js', 'utf8'), H = fs.readFileSync('index.html', 'utf8'), S0 = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0, k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
function controles(A, S) {
  const r = [];
  let F = null;
  try { F = new Function(fonction(A, '_pFxEtat') + fonction(A, '_pFxActifs') + '\nreturn { etat: _pFxEtat, actifs: _pFxActifs };')(); } catch (e) { F = null; }
  r.push(['les deux fonctions existent et s’exécutent', !!F]);
  if (F) {
    r.push(['l’état affiché se lit sur les leviers d’avant (pFilter, pShowDone)', F.etat('toutes', false) === 'afaire' && F.etat('toutes', true) === 'toutes' && F.etat('complet', false) === 'finies' && F.etat('avance', true) === 'encours' && F.etat('arrachee', false) === 'arrachees']);
    r.push(['la pastille compte ce qui s’écarte du départ (« À faire », sans proximité)', F.actifs('afaire', false) === 0 && F.actifs('toutes', false) === 1 && F.actifs('finies', true) === 2]);
  }
  const fa = fonction(A, '_pFxAfficher'), fr = fonction(A, '_pFxRender'), fo = fonction(A, '_pFxOrdre');
  r.push(['« Afficher » garde la tâche prioritaire (ne remet pas pTacheFilter à « toutes »)', !!fa && !/pTacheFilter\s*=/.test(fa) && /pFilter=f; window\.pShowDone=\(v==='toutes'\);/.test(fa)]);
  r.push(['la tournée de l’admin garde la main : pas de proximité quand elle s’applique (TRN-2)', /if\(_pProxBloque\(\)\)\{\n    h\+='<div class="p-fx-opt on p-fx-fixe">/.test(fr) && /if\(_pProxBloque\(\)\) return;/.test(fo)]);
  r.push(['la pastille se met à jour à chaque rendu de l’arrivée', /_pgParc\.classList\.toggle\('p-arrivee',!!_prioLocked\);\n  _pFxBadge\(\);/.test(A)]);
  r.push(['la ligne recherche + « Filtres » + Carte, et la feuille', /<div class="p-srow">/.test(H) && /id="p-fx-btn" onclick="openPFiltres\(\)"/.test(H) && /class="p-fx-btn p-fx-carte" onclick="switchPTab\('carte'\)"/.test(H) && /<div class="overlay" id="ovPFiltres"/.test(H)]);
  const b = S.slice(S.indexOf('/* ★ ARRIVEE-4 (§355)'), S.indexOf('/* ★ TETE-2 (§329)'));
  r.push(['hors arrivée rien ne bouge (la ligne s’efface, les boutons sont cachés)', /\.p-srow\{display:contents\}\n\.p-fx-btn\{display:none\}/.test(b)]);
  r.push(['à l’arrivée : états et proximité rangés ; Liste/Carte rangé sauf sur la carte (pour revenir)', /#page-parcelles\.p-arrivee \.frow,#page-parcelles\.p-arrivee #p-prox-bar\{display:none!important\}/.test(b) && /#page-parcelles\.p-arrivee \.tabs2:not\(:has\(#tbc\.active\)\)\{display:none\}/.test(b)]);
  r.push(['le style, sans couleur en dur', b.length > 100 && !/#[0-9a-fA-F]{3,6}\b/.test(b)]);
  return r;
}
let ok = 0, ko = 0;
const t = (x, c) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x); } };
if (!CONTRE) {
  console.log('\n── ARRIVEE-4 — le bouton « Filtres »\n');
  for (const [x, c] of controles(A0, S0)) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── ARRIVEE-4 — contre-épreuve\n');
const essais = [
  ['la tâche prioritaire remise à « toutes » est vue', A0.replace("pFilter=f; window.pShowDone=(v==='toutes');", "pFilter=f; pTacheFilter='toutes'; window.pShowDone=(v==='toutes');"), S0, '« Afficher » garde la tâche'],
  ['la proximité proposée malgré la tournée est vue', A0.replace("  if(_pProxBloque()) return;\n  if((v==='prox')", "  if((v==='prox')"), S0, 'la tournée de l’admin'],
  ['Liste/Carte rangé même sur la carte (plus de retour) est vu', A0, S0.replace('#page-parcelles.p-arrivee .tabs2:not(:has(#tbc.active)){display:none}', '#page-parcelles.p-arrivee .tabs2{display:none}'), 'à l’arrivée : états'],
];
let rates = 0;
for (const [x, A, S, cible] of essais) { const vu = controles(A, S).some(([y, c]) => y.startsWith(cible) && !c); if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); } }
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
