/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — RANGBOUT-1 (§349) : « DU RANG À LA BOUTEILLE »
   Lancer : node scripts/mv-harnais-rangbout1.mjs          (le contrôle)
            node scripts/mv-harnais-rangbout1.mjs --contre  (la contre-épreuve)
   `_mvRangBouteille` est EXÉCUTÉE (bloc borné de src/jalons.js) sur un domaine
   inventé : le travail par millésime, la récolte, la cuve, la cuvée.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J0 = fs.readFileSync('src/jalons.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8'), S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
let n = 0;
const charger = J => import('data:text/javascript;base64,' + Buffer.from(J.slice(J.indexOf(DEB), J.indexOf(FIN)) + '\nexport { _mvRangBouteille };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
const D = () => ({
  nomTache: t => ({ Taille: 'Taille', Relevage: 'Relevage', Vendange: 'Vendange' })[t] || t,
  journal: [
    { parcelle: 'Clos Bas', tache: 'Taille', date: '2024-12-10', statut: 'Validé', qui: 'Paul' },           // décembre 2024 : millésime 2025
    { parcelle: 'Clos Bas', tache: 'Relevage', date: '2025-06-02', statut: 'Validé', qui: 'Léo', membresEquipe: ['Paul'] },
    { parcelle: 'Clos Bas', tache: 'Vendange', date: '2025-09-20', statut: 'Validé', qui: 'Paul' },
    { parcelle: 'En Champs', tache: 'Relevage', date: '2025-06-03', statut: 'Annulé', qui: 'Paul' },       // défait : rien
    { parcelle: 'Champ Franc', tache: 'Relevage', date: '2025-06-04', statut: 'Validé', qui: 'Léo' },      // pas Paul
    { parcelle: 'Clos Bas', tache: 'Taille', date: '2024-02-10', statut: 'Validé', qui: 'Paul' },          // millésime 2024, sans récolte
  ],
  recoltes: [
    { parcelle: 'Clos Bas', date: '2025-09-20', cuve_id: 'cv4' },
    { parcelle: 'En Champs', date: '2025-09-21', cuve_id: 'cv5' },
    { parcelle: 'Champ Franc', date: '2025-09-22', cuve_id: 'cv6' },
  ],
  cuves: [{ id: 'cv4', nom: 'Cuve 4', decuvage: { cuvee_id: 'c1' } }, { id: 'cv5', nom: 'Cuve 5' }, { id: 'cv6', nom: 'Cuve 6' }],
  cuvees: [{ id: 'c1', nom: 'Clos Bas', millesime: 2025, statut: 'elevage' }],
});
async function controles(J) {
  const K = await charger(J), r = [], R = K._mvRangBouteille('Paul', D());
  r.push(['un seul millésime avec du vin : 2025 (2024 n’a pas de récolte)', R.length === 1 && R[0].millesime === '2025', JSON.stringify(R)]);
  const v = R[0] && R[0].vins;
  r.push(['le vin de Clos Bas : la cuvée du décuvage, en élevage', v && v.length === 1 && v[0].nom === 'Clos Bas 2025' && v[0].etat === 'en élevage', JSON.stringify(v)]);
  r.push(['ce qu’il y a fait : la taille (décembre d’avant), le relevage (à deux), la vendange', v && v[0].parcelles.length === 1 && v[0].parcelles[0].nom === 'Clos Bas' && v[0].parcelles[0].taches.join() === 'Taille,Relevage,Vendange', JSON.stringify(v && v[0].parcelles)]);
  r.push(['ni une parcelle défaite (« Annulé »), ni celle d’un autre', v && !v.some(x => /Cuve 5|Cuve 6/.test(x.nom))]);
  const D2 = D(); D2.cuves[0] = { id: 'cv4', nom: 'Cuve 4' };
  const R2 = K._mvRangBouteille('Paul', D2);
  r.push(['pas encore décuvé : le vin est la cuve, « en cuve »', R2[0] && R2[0].vins[0].nom === 'Cuve 4 (2025)' && R2[0].vins[0].etat === 'en cuve']);
  const D3 = D(); D3.cuvees[0].statut = 'embouteille';
  r.push(['mis en bouteille : « en bouteille »', K._mvRangBouteille('Paul', D3)[0].vins[0].etat === 'en bouteille']);
  r.push(['sans nom, rien', K._mvRangBouteille('', D()).length === 0]);
  return r;
}
function cablage() {
  return [
    ['« Ma trace » montre la section, après « Vos premières fois »', /h\+=window\._mvPremieresSection\(\);[^\n]*\n  if\(typeof window\._mvRangBouteilleSection==='function'\) h\+=window\._mvRangBouteilleSection\(\);/.test(A)],
    ['la section échappe ses textes', /esc\(v\.nom\)/.test(J0) && /esc\(v\.etat\)/.test(J0) && /esc\(p\.nom\)/.test(J0) && /esc\(g\.millesime\)/.test(J0)],
    ['le style, sans couleur en dur', (() => { const b = S.slice(S.indexOf('/* RANGBOUT-1 (§349)'), S.indexOf('/* ★ TETE-2 (§329)')); return b.length > 100 && !/#[0-9a-fA-F]{3,6}\b/.test(b); })()],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── RANGBOUT-1 — « Du rang à la bouteille »\n');
  for (const [x, c, d] of await controles(J0)) t(x, c, d);
  for (const [x, c] of cablage()) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── RANGBOUT-1 — contre-épreuve\n');
const essais = [
  ['la taille de décembre rangée dans le mauvais millésime est vue', J0.replace("return String(m >= 11 ? y + 1 : y);", "return String(y);"), 'ce qu’il y a fait'],
  ['une validation défaite comptée est vue', J0.replace("if (!j || j.meteo || j.statut !== 'Validé' || !iso(j.date) || !j.parcelle) return;\n    var eq = [j.qui]", "if (!j || j.meteo || !iso(j.date) || !j.parcelle) return;\n    var eq = [j.qui]"), 'ni une parcelle défaite'],
  ['la cuvée du décuvage oubliée est vue', J0.replace("var cu = (cv.decuvage && cv.decuvage.cuvee_id) ? cuvees.find(function (x) { return x && x.id === cv.decuvage.cuvee_id; }) : null;\n      var cle", "var cu = null;\n      var cle"), 'le vin de Clos Bas'],
];
let rates = 0;
for (const [x, J, cible] of essais) {
  let vu; try { vu = (await controles(J)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = false; console.log('      (plantage : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
