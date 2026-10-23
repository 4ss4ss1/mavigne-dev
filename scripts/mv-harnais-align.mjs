// HARNAIS — ALIGN-1 (§236) : Pilotage › Aujourd'hui, la décision du jour en quatre tuiles bâties pareil.
// PIL-RANGE-1b (§441) : l'ancien Aujourd'hui (tuiles d'avant, petites courbes, frise, carte Cave) est retiré ; ce harnais ne garde que ce qui vit encore.
//   node scripts/mv-harnais-align.mjs           → doit être vert
//   node scripts/mv-harnais-align.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (04/10, capture) : quatre cartes de même hauteur mais le contenu collé en haut, deux grands vides.
// Maquette validée : chaque tuile a les mêmes étages (verdict, raison, bande, pied), le pied collé en bas ;
// les listes (parcelles à nu, tension par personne) descendent dans .pil-dec2, 5 lignes et un bouton.
// ⚠️ Aucun harnais ne voit un écran : celui-ci garde la STRUCTURE (étages, ordre, rangées, CSS qui aligne),
//    le rendu à l'œil reste à faire sur appareil.
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const PIL0 = fs.readFileSync(path.join(R, 'src/pilotage.js'), 'utf8');
const CSS0 = fs.readFileSync(path.join(R, 'src/styles.css'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const ZONES = ['pil-tz-big', 'pil-tz-rai', 'pil-tz-ban', 'pil-tz-pied'];
const enOrdre = s => { let k = -1; for (const z of ZONES) { const j = s.indexOf(z, k + 1); if (j < 0) return false; k = j; } return true; };
function suite(PIL, CSS) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const P = sansCom(PIL);
  T('la protection montre 5 parcelles, le bouton déplie les autres', /_PIL_PROT_TOUT\?tot:5/.test(P) && /data-diag="prot_tout"/.test(P) && /cible==='prot_tout'\)\{ _PIL_PROT_TOUT=!_PIL_PROT_TOUT; renderPilotage\(\); return; \}/.test(P));
  T('le détail tient sa rangée, et prend toute la largeur quand il est seul', /\.pil-dec2\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(320px,1fr\)\)/.test(CSS));
  return out;
}
function joue(P, C) { try { return suite(P, C); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(PIL0, CSS0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nALIGN-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['le détail perd sa grille', p => p, c => c.replace('.pil-dec2{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))', '.pil-dec2{display:block;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))')],
  ['la liste des parcelles n’a plus de limite', p => p.replace('_PIL_PROT_TOUT?tot:5', '_PIL_PROT_TOUT?tot:tot'), c => c],
  ['le bouton « Et N autres » ne fait plus rien', p => p.replace("cible==='prot_tout'", "cible==='prot_tout_x'"), c => c],
];
let rg = 0;
DEF.forEach(([n, fp, fc]) => {
  const P2 = fp(PIL0), C2 = fc(CSS0);
  if (P2 === PIL0 && C2 === CSS0) { console.log('  ⚠ non injecté : ' + n); return; }
  const rouge = joue(P2, C2).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
