/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ARRIVEE-2 (§338) : L'ARRIVÉE DE L'OUVRIER SUR SA PRIORITÉ, RESSERRÉE
   Lancer : node scripts/mv-harnais-arrivee2.mjs          (le contrôle)
            node scripts/mv-harnais-arrivee2.mjs --contre  (la contre-épreuve)
   Mesuré au navigateur le 15/10 (375 × 667, ouvrier de l'équipe prioritaire) :
   premier « Valider » à 800 px avant, 605 px après. Ce harnais tient le câblage.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const A0 = fs.readFileSync('src/app.js', 'utf8'), H0 = fs.readFileSync('index.html', 'utf8'), S0 = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0, k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
function controles(A, H, S) {
  const r = [], rp = fonction(A, 'renderParcelles'), pm = fonction(A, '_pProchaineMarque');
  r.push(['la classe p-arrivee suit le verrou de la priorité', /classList\.toggle\('p-arrivee',!!_prioLocked\)/.test(rp)]);
  r.push(['la priorité est dite une fois : le bandeau ne garde que le message de l’admin', /if\(_prioLocked\)\{ if\(pTaskRow\)pTaskRow\.style\.display='none'; if\(!priorityMessage\)pb\.style\.display='none'; \}/.test(rp)]);
  r.push(['« Prochaine » est posée après les cartes, avant les barres (la fin de renderParcelles intacte)',
    /_pProchaineMarque\(_prioLocked\);[^\n]*\n  if\(_pDesk\(\)\)_pFicheSync\(data\);/.test(rp) && /_pvRenderProxBar\(\);\n  _pvRenderOrdreBar\(\);\n  _pOrdMapSync\(\);\n  _pCibleMapSync\(\);\n\}$/.test(rp)]);
  r.push(['« Prochaine » : retirée à chaque rendu, jamais hors arrivée, sur la première parcelle à valider',
    /querySelectorAll\('\.pc-prochaine'\)\.forEach\(function\(x\)\{ x\.remove\(\); \}\);\n  if\(!on\) return;/.test(pm) && /querySelector\('\.pc-validate'\)/.test(pm)]);
  r.push(['les nombres des tuiles passent sur les filtres d’état', /\[\['pf-n-c',c\],\['pf-n-e',e\],\['pf-n-a',a\]\]/.test(fonction(A, 'computePStats')) && ['pf-n-c', 'pf-n-e', 'pf-n-a'].every(i => H.includes('id="' + i + '"'))]);
  r.push(['les tuiles s’effacent à l’arrivée, et seulement à l’arrivée', /\.p-arrivee #parc-kpis\{display:none\}/.test(S) && /\.fchip-n\{display:none\}/.test(S) && /\.p-arrivee \.fchip-n\{display:inline/.test(S)]);
  r.push(['état et Liste/Carte sur une ligne, marges de TETE-1 comptées', /#page-parcelles\.p-arrivee \.frow\{[^}]*max-width:calc\(100% - 170px\)/.test(S)]);
  const regle = (S.match(/\.pc-prochaine\{[^}]*\}/) || [''])[0];
  r.push(['la marque « Prochaine » a son style, sans couleur en dur', !!regle && !/#[0-9a-fA-F]{3,6}\b/.test(regle)]);
  // ARRIVEE-3 (§339) : le niveau et l'équipe sur une ligne
  r.push(['ARRIVEE-3 : le niveau et l’équipe tiennent sur une ligne, à l’arrivée seulement',
    /#page-parcelles\.p-arrivee #p-subsel-wrap\{display:inline-block;[^}]*max-width:60%\}/.test(S) && /#page-parcelles\.p-arrivee #p-team-bar\{display:inline-block;[^}]*width:calc\(40% - 8px\)\}/.test(S)]);
  r.push(['ARRIVEE-3 : une tâche sans niveau rend toute la ligne à l’équipe, noms compris',
    /#page-parcelles\.p-arrivee #p-subsel-wrap:empty\+#p-team-bar\{display:block;width:auto\}/.test(S) && /#page-parcelles\.p-arrivee #p-subsel-wrap:empty\+#p-team-bar \.pv-team-info\{display:block\}/.test(S)]);
  r.push(['ARRIVEE-3 : les cibles du niveau gardent leurs 44 px', !/\.p-arrivee[^{]*\.pv-pchip[^{]*\{[^}]*height/.test(S) && /\.pv-pchip\{min-width:44px;height:44px/.test(S)]);
  return r;
}
let ok = 0, ko = 0;
const t = (n, c) => { if (c) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + n); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n); } };
if (!CONTRE) {
  console.log('\n── ARRIVEE-2 — l’arrivée de l’ouvrier, resserrée\n');
  for (const [n, c] of controles(A0, H0, S0)) t(n, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── ARRIVEE-2 — contre-épreuve\n');
const essais = [
  ['le bandeau qui répète la priorité est vu', A0.replace("if(_prioLocked){ if(pTaskRow)pTaskRow.style.display='none'; if(!priorityMessage)pb.style.display='none'; }", ''), S0, 'la priorité est dite une fois'],
  ['« Prochaine » posée en fin de fonction est vue', A0.replace("  _pProchaineMarque(_prioLocked);", '').replace("  _pCibleMapSync();\n}", "  _pCibleMapSync();\n  _pProchaineMarque(_prioLocked);\n}"), S0, '« Prochaine » est posée'],
  ['les tuiles effacées pour tout le monde sont vues', A0, S0.replace('.p-arrivee #parc-kpis{display:none}', '#parc-kpis{display:none}'), 'les tuiles s’effacent'],
  ['ARRIVEE-3 : le niveau remis sur sa propre ligne est vu', A0, S0.replace('#page-parcelles.p-arrivee #p-subsel-wrap{display:inline-block;', '#page-parcelles.p-arrivee #p-subsel-wrap{display:block;'), 'ARRIVEE-3 : le niveau et l’équipe'],
];
let rates = 0;
for (const [n, A, S, cible] of essais) { const vu = controles(A, H0, S).some(([x, c]) => x.startsWith(cible) && !c); if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); } }
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
