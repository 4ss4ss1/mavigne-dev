// ═══ CONTRE-ÉPREUVE de mv-harnais-demo ═══
//  Chaque défaut corrigé est RÉINTRODUIT dans une copie en mémoire ; le harnais
//  doit rougir. Un harnais qui ne rougit jamais ne prouve rien (§34g/§34h).
import fs from 'fs';
import { jouer } from './harnais-demo.mjs';
const SRC = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const PIL = fs.readFileSync(new URL('../src/pilotage.js', import.meta.url), 'utf8');
const IDX = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const CSS = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const AUTRE = PIL + IDX + CSS;
// Le corpus de recherche est recompose par le harnais lui-meme (il en retire les
// citations de la visite) : on lui passe la source mutee et le reste separement.

const CP = [
  ['① une ligne du chiffrage n\'est plus démontrée',
    s => s.replace("credits:[{ k:'controle', min:0 }]", "hyp:''")],
  ['② un moment crédite une ligne qui n\'existe pas',
    s => s.replace("credits:[{ k:'validation', min:5 }]", "credits:[{ k:'fantome', min:5 }]")],
  ['③ un moment vise le corps d\'une carte repliée',
    s => s.replace("sel:['.pec-tbl','.pec-card','#pil-content']", "sel:['.pil-tbody','.pec-card','#pil-content']")],
  ['④ un moment cite un sélecteur qui n\'existe nulle part',
    s => s.replace("sel:['#trac-panel-sessions','#page-tracteur']", "sel:['#trac-panel-fantomatique','#page-tracteur']")],
  ['⑤ la ligne molle revient dans le total',
    s => s.replace("  { k:'controle',", "  { k:'info', min:10, freq:220, lab:'Retrouver l\\u2019info', hyp:'' },\n  { k:'controle',")],
  ['⑥ une fonction du moteur est appelée sans être écrite',
    s => s.replace('function _mvtCredits(s){', 'function _mvtCreditsX(s){')],
  ['⑧ la visite reprend l\'identifiant de feuille d\'un autre module',
    s => s.replace("st.id='mvt-visite-css'", "st.id='mvt-css'")],
  ['⑨ le moteur recentre dans l\'écran entier',
    s => s.replace('_mvtScrollDans((_mvtEls && _mvtEls[0]) || _mvtEl);',
                   'var _e0=(_mvtEls && _mvtEls[0]) || _mvtEl; if(_e0) _e0.scrollIntoView({block:\'center\'});')],
  ['⑩ le halo n\'est plus borné par la bande utile',
    s => s.replace('  var b=_mvtBande();\n  var t=r.top-pad, bo=r.bottom+pad;',
                   '  var b={haut:0,bas:0,dispo:vh};\n  var t=r.top-pad, bo=r.bottom+pad;')],
  ['⑦ un prix se reglisse dans la clôture',
    s => s.replace("+'<a class=\"mvt-add-cta\"", "+'<div class=\"mvt-add-eur\">Abonnement 79 \\u20AC/mois</div>'\n    +'<a class=\"mvt-add-cta\"")],
];

console.log('── contre-épreuve mv-harnais-demo ──');
let bons = 0;
// Référence : le code livré doit être VERT, sinon la contre-épreuve ne prouve rien.
const ref = jouer(SRC, null, true);
console.log(`  référence : ${ref.ok} vertes · ${ref.ko} rouges`);
if (ref.ko) { console.log('  ✗ la base n\'est pas verte — contre-épreuve sans valeur'); process.exit(2); }

for (const [nom, mut] of CP) {
  const s2 = mut(SRC);
  if (s2 === SRC) { console.log(`  ✗ ${nom} : la mutation n'a rien changé (motif absent)`); continue; }
  let r;
  try { r = jouer(s2, undefined, true); }
  catch (e) { console.log(`  ✓ ${nom} → le harnais casse (${e.message.slice(0, 40)})`); bons++; continue; }
  if (r.ko > 0) { console.log(`  ✓ ${nom} → ${r.ko} rouge(s)`); bons++; }
  else console.log(`  ✗ ${nom} → TOUJOURS VERT : le harnais ne le voit pas`);
}
console.log(`\n  ${bons}/${CP.length} défauts réintroduits sont bien détectés`);
process.exit(bons === CP.length ? 0 : 1);
