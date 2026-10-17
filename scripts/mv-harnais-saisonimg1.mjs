/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — SAISONIMG-1 (§351) : « MA SAISON EN IMAGES »
   Lancer : node scripts/mv-harnais-saisonimg1.mjs          (le contrôle)
            node scripts/mv-harnais-saisonimg1.mjs --contre  (la contre-épreuve)
   `_mvSaisonImages` est EXÉCUTÉE (bloc borné de src/jalons.js) sur une saison
   inventée ; le reste est le câblage (l'écran, le PDF, « Ma trace »).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J0 = fs.readFileSync('src/jalons.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8'), H = fs.readFileSync('index.html', 'utf8'), S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
let n = 0;
const charger = J => import('data:text/javascript;base64,' + Buffer.from(J.slice(J.indexOf(DEB), J.indexOf(FIN)) + '\nexport { _mvSaisonImages };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
const D = () => ({
  saison: { nom: 'Printemps 2026', debut: '2026-03-16', fin: '2026-07-31' }, aujourdhui: '2026-06-12', vigne: { ec_rang: 1, pieds: 10000 },
  parcelles: [{ nom: 'Clos Bas', surface: 1 }, { nom: 'En Champs', surface: 0.8 }],
  journal: [
    { parcelle: 'Clos Bas', tache: 'Relevage', date: '2026-04-02', statut: 'Validé', qui: 'Paul' },
    { parcelle: 'Clos Bas', tache: 'Palissage', date: '2026-05-02', statut: 'Validé', qui: 'Paul' },
    { parcelle: 'En Champs', tache: 'Relevage', date: '2026-04-05', statut: 'Validé', qui: 'Léo', membresEquipe: ['Paul'] },   // sa part : 0,4
    { parcelle: 'En Champs', tache: 'Taille', date: '2026-02-01', statut: 'Validé', qui: 'Paul' },                             // avant la saison
    { parcelle: 'Clos Bas', tache: 'Relevage', date: '2026-04-09', statut: 'Annulé', qui: 'Paul' },                            // défait
  ],
  activites: [{ nom: 'Tarière', champCustom: { label: 'Trous', feedsPlantation: true } }],
  sessions: [{ conducteur: 'Marc', coequipier: 'Paul', activite: 'Tarière', date: '2026-04-03', statut: 'Terminé', parcellesFaites: [{ nom: 'En Champs', data: { Trous: 40 } }] }],
  cave: { operations: [{ type: 'ouillage', date: '2026-05-24', operateur: 'Nico', intervenants: ['Paul'] }] },
  cuves: [], recoltes: [], cuvees: [], membres: [{ nom: 'Paul', debut_contrat: '2025-03-01' }],
  gagnes: { 'val.1': '2026-04-02', 'ouv.10': '2025-11-02' },
});
async function controles(J) {
  const K = await charger(J), r = [], R = K._mvSaisonImages('Paul', D());
  const C = Object.fromEntries(R.cartes.map(c => [c.cle, c]));
  r.push(['six cartes, toujours, dans l’ordre', R.cartes.length === 6 && R.cartes.map(c => c.cle).join() === 'saison,coeur,gestes,volant,jalons,vins']);
  r.push(['« Votre saison » : sa part (1 + 1 + 0,4 ha … sans l’« Annulé » ni l’avant-saison), ses jours, ses km, ses pieds', C.saison.grand === '2,4 ha' && C.saison.lignes.join('|') === '3 jours au domaine|24 km de rangs|24\u00a0000 pieds', JSON.stringify(C.saison)]);
  r.push(['la parcelle de cœur : la plus parcourue, avec ses passages', C.coeur.grand === 'Clos Bas' && C.coeur.petit === '2 passages cette saison' && C.coeur.lignes[0] === 'et 1 autre parcelle']);
  r.push(['ses gestes, par hectares', C.gestes.grand === 'Relevage' && C.gestes.lignes[0] === 'Relevage · 1,4 ha']);
  r.push(['au volant et au chai : les trous de tarière (comme coéquipier) et l’ouillage', C.volant.lignes.join('|') === '40 trous de tarière|1 ouillage', JSON.stringify(C.volant.lignes)]);
  r.push(['premières fois et jalons DE la saison (pas ceux d’avant)', C.jalons.lignes.includes('Première validation') && !C.jalons.lignes.includes('10 ouvertures'), JSON.stringify(C.jalons.lignes)]);
  r.push(['la dernière carte remercie, même sans vin', C.vins.lignes[C.vins.lignes.length - 1] === 'Merci pour cette saison.' && /encore à naître/.test(C.vins.petit)]);
  const V = K._mvSaisonImages('', D());
  r.push(['sans nom, six cartes vides mais lisibles', V.cartes.length === 6 && V.cartes[1].grand === 'À venir']);
  return r;
}
function cablage() {
  return [
    ['« Ma trace » ouvre « Ma saison en images »', /onclick="openSaisonImages\(\)"><span>Ma saison en images/.test(A)],
    ['la fenêtre a ses six cartes et ses deux boutons (PDF, fermer)', /<div class="overlay" id="ovSaisonImg"/.test(H) && /id="si-cartes"/.test(H) && /onclick="_mvSaisonPdf\(\)">Enregistrer en PDF/.test(H) && /onclick="_mvSaisonFermer\(\)">Fermer/.test(H)],
    ['le PDF passe par le document imprimable de l’appli', /window\._mvDocOpen\(\{ titre: 'Ma saison en images'/.test(J0)],
    ['les cartes échappent leurs textes', /esc\(c\.titre\)/.test(J0) && /esc\(c\.grand\)/.test(J0) && /esc\(c\.petit\)/.test(J0) && /'<li>' \+ esc\(l\) \+ '<\/li>'/.test(J0)],
    ['aucune couleur en dur (ni dans le style, ni dans le PDF)', (() => { const b = S.slice(S.indexOf('/* SAISONIMG-1 (§351)'), S.indexOf('/* ★ TETE-2 (§329)')); const p = J0.slice(J0.indexOf('function _mvSaisonPdf'), J0.indexOf('window.openSaisonImages')); return b.length > 100 && !/#[0-9a-fA-F]{3,6}\b/.test(b) && !/#[0-9a-fA-F]{3,6}\b/.test(p); })()],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── SAISONIMG-1 — « Ma saison en images »\n');
  for (const [x, c, d] of await controles(J0)) t(x, c, d);
  for (const [x, c] of cablage()) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── SAISONIMG-1 — contre-épreuve\n');
const essais = [
  ['un travail d’avant la saison compté est vu', J0.replace("var dans = function (d) { d = iso(d); return !!d && (!deb || d >= deb) && (!fin || d <= fin); };", "var dans = function (d) { return !!iso(d); };"), '« Votre saison »'],
  ['la part de chacun oubliée est vue', J0.replace("var s = (parseFloat(p.surface) || 0) / eq.length;\n    ha += s;", "var s = (parseFloat(p.surface) || 0);\n    ha += s;"), '« Votre saison »'],
  ['une carte qui manque est vue', J0.replace("    { cle: 'volant', titre: 'Au volant et au chai',", "    false && { cle: 'volant', titre: 'Au volant et au chai',"), 'six cartes'],
];
let rates = 0;
for (const [x, J, cible] of essais) {
  let vu; try { vu = (await controles(J)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = true; console.log('      (plantage, donc vu : ' + String(e && e.message).slice(0, 60) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
