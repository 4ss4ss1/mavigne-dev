/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — CARTEDOM-1 (§350) : « LA CARTE DE VOTRE SAISON »
   Lancer : node scripts/mv-harnais-cartedom1.mjs          (le contrôle)
            node scripts/mv-harnais-cartedom1.mjs --contre  (la contre-épreuve)
   Le compte des passages et la projection sont EXÉCUTÉS (bloc borné de
   src/jalons.js) sur un domaine inventé ; le reste est le câblage.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J0 = fs.readFileSync('src/jalons.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8'), S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
let n = 0;
const charger = J => import('data:text/javascript;base64,' + Buffer.from(J.slice(J.indexOf(DEB), J.indexOf(FIN)) + '\nexport { _mvCarteDomaine, _mvCarteNiveau, _mvCarteSvgPoints };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
const POLYS = [
  { name: 'Clos Bas', pts: [[47.20, 4.96], [47.201, 4.96], [47.201, 4.962], [47.20, 4.962]] },
  { name: 'En Champs', pts: [[47.202, 4.963], [47.203, 4.963], [47.203, 4.965]] },
  { name: 'Champ Franc', pts: [[47.199, 4.958], [47.1995, 4.958], [47.1995, 4.959]] },
  { name: 'Mauvais', pts: [[47.2, 4.96]] },   // pas un polygone : écarté
];
const JOUR = [
  { parcelle: 'Clos Bas', tache: 'Relevage', date: '2026-04-02', statut: 'Validé', qui: 'Paul' },
  { parcelle: 'Clos Bas', tache: 'Relevage', date: '2026-04-02', statut: 'Validé', qui: 'Paul' },          // doublon
  { parcelle: 'clos bas', tache: 'Palissage', date: '2026-05-02', statut: 'Validé', qui: 'Léo', membresEquipe: ['Paul'] },   // casse et équipe
  { parcelle: 'En Champs', tache: 'Relevage', date: '2026-04-03', statut: 'Annulé', qui: 'Paul' },        // défait
  { parcelle: 'En Champs', tache: 'Relevage', date: '2025-10-03', statut: 'Validé', qui: 'Paul' },        // avant la saison
  { parcelle: 'Champ Franc', tache: 'Relevage', date: '2026-04-04', statut: 'Validé', qui: 'Léo' },       // pas lui
];
async function controles(J) {
  const K = await charger(J), r = [];
  const C = K._mvCarteDomaine('Paul', { polygones: POLYS, journal: JOUR, depuis: '2026-03-16' });
  const N = Object.fromEntries(C.zones.map(z => [z.nom, z.n]));
  r.push(['les passages par parcelle : les siens, à plusieurs aussi, sans doublon, sans « Annulé », depuis le début de la saison', N['Clos Bas'] === 2 && N['En Champs'] === 0 && N['Champ Franc'] === 0, JSON.stringify(N)]);
  r.push(['seuls les vrais polygones sont dessinés ; le compte des parcelles travaillées', C.total === 3 && C.travaillees === 1 && !('Mauvais' in N)]);
  r.push(['quatre teintes : aucun, 1, 2 à 3, 4 et plus', K._mvCarteNiveau(0) === 0 && K._mvCarteNiveau(1) === 1 && K._mvCarteNiveau(3) === 2 && K._mvCarteNiveau(9) === 3]);
  const P = K._mvCarteSvgPoints(C.zones);
  const xs = P.poly.flatMap(s => s.split(' ').map(c => +c.split(',')[0])), ys = P.poly.flatMap(s => s.split(' ').map(c => +c.split(',')[1]));
  r.push(['la projection tient dans la boîte, nord en haut', P.l === 1000 && P.poly.length === 3 && Math.min(...xs) >= 0 && Math.max(...xs) <= P.l && Math.min(...ys) >= 0 && Math.max(...ys) <= P.h
    && /,0$/.test(P.poly[1].split(' ').find(c => c.endsWith(',0')) || '')]);
  r.push(['sans nom, aucun passage', K._mvCarteDomaine('', { polygones: POLYS, journal: JOUR }).travaillees === 0]);
  return r;
}
function cablage() {
  return [
    ['« Ma trace » montre la carte, après « Les vins de votre travail »', /h\+=window\._mvRangBouteilleSection\(\);[^\n]*\n  if\(typeof window\._mvCarteDomaineSection==='function'\) h\+=window\._mvCarteDomaineSection\(\);/.test(A)],
    ['le nom de la parcelle est échappé dans l’infobulle', /<title>' \+ esc\(z\.nom \+ ' — '/.test(J0)],
    ['les teintes viennent des classes (jetons), aucune couleur écrite dans le JavaScript', /class="cd-n' \+ _mvCarteNiveau\(z\.n\) \+ '"/.test(J0) && !/fill=["']#/.test(J0)],
    ['le style, sans couleur en dur', (() => { const b = S.slice(S.indexOf('/* CARTEDOM-1 (§350)'), S.indexOf('/* ★ TETE-2 (§329)')); return b.length > 100 && !/#[0-9a-fA-F]{3,6}\b/.test(b); })()],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── CARTEDOM-1 — « La carte de votre saison »\n');
  for (const [x, c, d] of await controles(J0)) t(x, c, d);
  for (const [x, c] of cablage()) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── CARTEDOM-1 — contre-épreuve\n');
const essais = [
  ['un passage d’avant la saison compté est vu', J0.replace('    if (depuis && iso(j.date) < depuis) return;\n', ''), 'les passages par parcelle'],
  ['un doublon compté est vu', J0.replace('    if (vus[cle]) return; vus[cle] = 1;\n    var p = String(j.parcelle).toLowerCase(); n[p] = (n[p] || 0) + 1;', '    var p = String(j.parcelle).toLowerCase(); n[p] = (n[p] || 0) + 1;'), 'les passages par parcelle'],
  ['le nord en bas (axe inversé) est vu', J0.replace("Math.round((maxLa - +p[0]) * s)", "Math.round((+p[0] - minLa) * s)"), 'la projection tient'],
];
let rates = 0;
for (const [x, J, cible] of essais) {
  let vu; try { vu = (await controles(J)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = false; console.log('      (plantage : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
