/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — CARTEDOM-1 (§350) : « LA CARTE DE VOTRE SAISON » — le compte
   Lancer : node scripts/mv-harnais-cartedom1.mjs          (le contrôle)
            node scripts/mv-harnais-cartedom1.mjs --contre  (la contre-épreuve)
   Le compte des passages est EXÉCUTÉ (bloc borné de src/jalons.js) sur un
   domaine inventé ; le reste est le câblage.
   ★ CARTEDOM-2 (§491) : la carte compte les PARCELLES EN VIGNE (plus les
   contours) et les range de la plus parcourue à la moins parcourue ; la
   projection géographique est partie (la mosaïque : mv-harnais-cartedom2).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J0 = fs.readFileSync('src/jalons.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8'), S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
let n = 0;
const charger = J => import('data:text/javascript;base64,' + Buffer.from(J.slice(J.indexOf(DEB), J.indexOf(FIN)) + '\nexport { _mvCarteDomaine, _mvCarteNiveau };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
const PARCS = [
  { nom: 'Clos Bas', surface: '0,40', statut: 'Active' },
  { nom: 'En Champs', surface: '0,25', statut: 'Active' },
  { nom: 'Champ Franc', surface: 0.6, statut: 'Active' },
  { nom: 'La Vieille', surface: '1,2', statut: 'Arrachee' },   // arrachée : hors de la carte et du compte
  { nom: '', surface: '0,1' },                                   // sans nom : écartée
];
const JOUR = [
  { parcelle: 'Clos Bas', tache: 'Relevage', date: '2026-04-02', statut: 'Validé', qui: 'Paul' },
  { parcelle: 'Clos Bas', tache: 'Relevage', date: '2026-04-02', statut: 'Validé', qui: 'Paul' },          // doublon
  { parcelle: 'clos bas', tache: 'Palissage', date: '2026-05-02', statut: 'Validé', qui: 'Léo', membresEquipe: ['Paul'] },   // casse et équipe
  { parcelle: 'En Champs', tache: 'Relevage', date: '2026-04-03', statut: 'Annulé', qui: 'Paul' },        // défait
  { parcelle: 'En Champs', tache: 'Relevage', date: '2025-10-03', statut: 'Validé', qui: 'Paul' },        // avant la saison
  { parcelle: 'Champ Franc', tache: 'Relevage', date: '2026-04-04', statut: 'Validé', qui: 'Léo' },       // pas lui
  { parcelle: 'La Vieille', tache: 'Arrachage', date: '2026-04-05', statut: 'Validé', qui: 'Paul' },      // une arrachée ne compte pas
];
async function controles(J) {
  const K = await charger(J), r = [];
  const C = K._mvCarteDomaine('Paul', { parcelles: PARCS, journal: JOUR, depuis: '2026-03-16' });
  const N = Object.fromEntries(C.zones.map(z => [z.nom, z.n]));
  r.push(['les passages par parcelle : les siens, à plusieurs aussi, sans doublon, sans « Annulé », depuis le début de la saison', N['Clos Bas'] === 2 && N['En Champs'] === 0 && N['Champ Franc'] === 0, JSON.stringify(N)]);
  r.push(['seules les parcelles en vigne sont comptées (ni l’arrachée, ni une parcelle sans nom) ; le compte des parcelles travaillées', C.total === 3 && C.travaillees === 1 && !('La Vieille' in N), JSON.stringify(C.zones)]);
  r.push(['l’ordre : la plus parcourue d’abord, puis la plus grande', C.zones.map(z => z.nom).join('|') === 'Clos Bas|Champ Franc|En Champs', C.zones.map(z => z.nom).join('|')]);
  r.push(['la surface est lue, virgule comprise', C.zones.find(z => z.nom === 'Clos Bas').surface === 0.4 && C.zones.find(z => z.nom === 'Champ Franc').surface === 0.6]);
  r.push(['quatre teintes : aucun, 1, 2 à 3, 4 et plus', K._mvCarteNiveau(0) === 0 && K._mvCarteNiveau(1) === 1 && K._mvCarteNiveau(3) === 2 && K._mvCarteNiveau(9) === 3]);
  r.push(['sans nom, aucun passage', K._mvCarteDomaine('', { parcelles: PARCS, journal: JOUR }).travaillees === 0]);
  return r;
}
function cablage() {
  return [
    ['« Ma trace » montre la carte, après « Les vins de votre travail »', /h\+=window\._mvRangBouteilleSection\(\);[^\n]*\n  if\(typeof window\._mvCarteDomaineSection==='function'\) h\+=window\._mvCarteDomaineSection\(\);/.test(A)],
    ['la carte lit les parcelles, plus les contours', /_mvCarteDomaine\(u\.nom, \{ parcelles: window\.PARCELLES,/.test(J0) && !/KML_DATA/.test(J0)],
    ['le nom de la parcelle est échappé (attribut et libellé)', /data-nom="' \+ escA\(z\.nom\) \+ '" title="' \+ escA\(lib\) \+ '" aria-label="' \+ escA\(lib\)/.test(J0)],
    ['les teintes viennent des classes (jetons), aucune couleur écrite dans le JavaScript', /class="mtr-cd-p cd-n' \+ _mvCarteNiveau\(z\.n\)/.test(J0) && !/fill=["']#/.test(J0)],
    ['le style, sans couleur en dur', (() => { const b = S.slice(S.indexOf('/* CARTEDOM-1 (§350)'), S.indexOf('/* ★ TETE-2 (§329)')); return b.length > 100 && !/#[0-9a-fA-F]{3,6}\b/.test(b); })()],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── CARTEDOM-1 — « La carte de votre saison » (le compte)\n');
  let R = []; try { R = await controles(J0); } catch (e) { R = [['le moteur s’exécute', false, String(e && e.message)]]; }
  for (const [x, c, d] of R) t(x, c, d);
  for (const [x, c] of cablage()) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── CARTEDOM-1 — contre-épreuve\n');
const essais = [
  ['un passage d’avant la saison compté est vu', J0.replace('    if (depuis && iso(j.date) < depuis) return;\n', ''), 'les passages par parcelle'],
  ['un doublon compté est vu', J0.replace('    if (vus[cle]) return; vus[cle] = 1;\n    var p = String(j.parcelle).toLowerCase(); n[p] = (n[p] || 0) + 1;', '    var p = String(j.parcelle).toLowerCase(); n[p] = (n[p] || 0) + 1;'), 'les passages par parcelle'],
  ['une parcelle arrachée comptée est vue', J0.replace("return p && p.nom && p.statut !== 'Arrachee'; })", 'return p && p.nom; })'), 'seules les parcelles en vigne'],
  ['un tri par nom seul est vu', J0.replace('return (b.n - a.n) || (b.surface - a.surface) || ', 'return '), 'l’ordre'],
];
let rates = 0;
for (const [x, J, cible] of essais) {
  if (J === J0) { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — défaut non posé (motif introuvable)'); continue; }
  let vu; try { vu = (await controles(J)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = false; console.log('      (plantage : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
