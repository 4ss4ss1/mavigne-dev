/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — PREMIERES-1 (§345) : « VOS PREMIÈRES FOIS », LA FRISE DU PARCOURS
   Lancer : node scripts/mv-harnais-premieres1.mjs          (le contrôle)
            node scripts/mv-harnais-premieres1.mjs --contre  (la contre-épreuve)
   `_mvPremieresFois` est EXÉCUTÉE (bloc borné de src/jalons.js) sur un domaine
   inventé ; le reste est le câblage (« Ma trace », l'échappement, le style).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J0 = fs.readFileSync('src/jalons.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8'), S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
let n = 0;
const charger = J => import('data:text/javascript;base64,' + Buffer.from(J.slice(J.indexOf(DEB), J.indexOf(FIN)) + '\nexport { _mvPremieresFois };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
const D = () => ({
  membres: [{ nom: 'Paul', debut_contrat: '2025-03-01' }], aujourdhui: '2026-06-12', vigne: { ec_rang: 1 },
  parcelles: [{ nom: 'P1', surface: 0.6 }, { nom: 'P2', surface: 1 }, { nom: 'P3', surface: 0.6 }],
  nomTache: t => t === 'Ebourgeonnage' ? 'Ébourgeonnage' : t,
  journal: [
    { parcelle: 'P2', tache: 'Relevage', date: '2026-04-02', statut: 'Validé', qui: 'Léo', membresEquipe: ['Paul'] },   // à deux : 0,5 ha
    { parcelle: 'P1', tache: 'Ebourgeonnage', date: '2026-03-16', statut: 'Validé', qui: 'Paul' },                    // 0,6 ha, la première
    { parcelle: 'P3', tache: 'Ebourgeonnage', date: '2026-03-20', statut: 'Validé', qui: 'Léo', membresEquipe: ['Paul', 'Marc'] }, // à trois : 0,2 ha
    { parcelle: 'P1', tache: 'Taille', date: '2026-02-01', statut: 'Annulé', qui: 'Paul' },                            // défaite : ne compte pas
    { parcelle: 'P1', tache: 'Plantation', date: '2026-05-02', statut: 'Validé', qui: 'Paul' },
  ],
  activites: [{ nom: 'Tarière', champCustom: { label: 'Trous', feedsPlantation: true } }],
  sessions: [
    { conducteur: 'Marc', coequipier: 'Paul', activite: 'Tarière', date: '2026-04-03', parcellesFaites: [{ nom: 'P2', data: { Trous: 12 } }] },
    { conducteur: 'Paul', activite: 'Rognage', date: '2026-06-01', parcellesFaites: [] },
  ],
  cave: { operations: [{ type: 'ouillage', date: '2026-05-24', operateur: 'Nico', intervenants: ['Paul'] }, { type: 'degustation', date: '2026-05-30', intervenants: ['Léo'] }] },
});
async function controles(J) {
  const K = await charger(J), r = [], P = K._mvPremieresFois('Paul', D());
  const F = Object.fromEntries(P.faites.map(f => [f.cle, f]));
  r.push(['la frise est dans l’ordre des jours', P.faites.map(f => f.date).join() === P.faites.map(f => f.date).slice().sort().join()]);
  r.push(['l’arrivée au domaine, depuis le début du contrat', F.arrivee && F.arrivee.date === '2025-03-01']);
  r.push(['la première validation : la vraie date, la tâche (son nom affiché) et la parcelle', F.val && F.val.date === '2026-03-16' && F.val.detail === 'Ébourgeonnage, P1', JSON.stringify(F.val)]);
  r.push(['une validation défaite (« Annulé ») n’est pas une première fois', !F.taille]);
  r.push(['le premier hectare : le jour où le cumul de SA part passe 1 ha (0,6, puis 0,2 à trois, puis 0,5 à deux)', F.ha1 && F.ha1.date === '2026-04-02', JSON.stringify(F.ha1)]);
  r.push(['le premier kilomètre (rangs à 1 m : 0,6 ha = 6 km, dès le premier jour)', F.km1 && F.km1.date === '2026-03-16']);
  r.push(['le premier trou de tarière, comme coéquipier, « avec » le conducteur', F.trou && F.trou.date === '2026-04-03' && F.trou.detail === 'avec Marc']);
  r.push(['la première session au volant (comme conducteur seulement)', F.ses && F.ses.date === '2026-06-01' && F.ses.detail === 'Rognage']);
  r.push(['le premier ouillage où il est noté ; pas la dégustation d’un autre', F.ouil && F.ouil.date === '2026-05-24' && !F.degu]);
  r.push(['la première plantation', F.plantation && F.plantation.date === '2026-05-02']);
  r.push(['un an au domaine, une fois la date passée', F.an && F.an.date === '2026-03-01' && !P.aVenir.some(a => a.cle === 'an')]);
  r.push(['à venir : la vendange et la taille, pas encore faites', P.aVenir.map(a => a.cle).join() === 'vendange,taille']);
  const P2 = K._mvPremieresFois('Paul', Object.assign(D(), { aujourdhui: '2026-02-20' }));
  r.push(['avant l’anniversaire, « un an » est à venir, avec sa date', P2.aVenir.some(a => a.cle === 'an' && a.quand === '2026-03-01') && !P2.faites.some(f => f.cle === 'an')]);
  r.push(['sans nom, rien', K._mvPremieresFois('', D()).faites.length === 0]);
  return r;
}
function cablage() {
  return [
    ['« Ma trace » montre la frise, au-dessus de « Mes jalons »', /h\+=window\._mvPremieresSection\(\);[\s\S]{0,800}h\+=window\._mvJalonsSection\(\);/.test(A)   /* RANGBOUT-1 (§349) : « Les vins de votre travail » vient entre les deux */],
    ['la frise échappe ses textes (titres, dates, détails)', /esc\(f\.titre\)/.test(J0) && /esc\(_mvJalDateFr\(f\.date\) \+ \(f\.detail \? ' · ' \+ f\.detail : ''\)\)/.test(J0)],
    ['le style, sans couleur en dur', (() => { const b = S.slice(S.indexOf('/* PREMIERES-1 (§345)'), S.indexOf('/* ★ TETE-2 (§329)')); return b.length > 100 && !/#[0-9a-fA-F]{3,6}\b/.test(b); })()],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── PREMIERES-1 — « Vos premières fois »\n');
  for (const [x, c, d] of await controles(J0)) t(x, c, d);
  for (const [x, c] of cablage()) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── PREMIERES-1 — contre-épreuve\n');
const essais = [
  ['une validation « Annulé » comptée est vue', J0.replace("return j && !j.meteo && j.statut === 'Validé' && iso(j.date)", "return j && !j.meteo && iso(j.date)"), 'une validation défaite'],
  ['la part de chacun oubliée est vue (le premier hectare tomberait trop tôt)', J0.replace("var s = (parseFloat(p.surface) || 0) / equipe(j).length;", "var s = (parseFloat(p.surface) || 0);"), 'le premier hectare'],
  ['la frise en désordre est vue', J0.replace("out.sort(function (a, b) { return a.date.localeCompare(b.date); });", ''), 'la frise est dans l’ordre'],
];
let rates = 0;
for (const [x, J, cible] of essais) {
  let vu; try { vu = (await controles(J)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = false; console.log('      (plantage : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
