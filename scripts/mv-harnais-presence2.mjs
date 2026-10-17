/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — PRESENCE-2 (§346) : « QUI ÉTAIT LÀ » AU CUVIER (remontages, pigeages)
   Lancer : node scripts/mv-harnais-presence2.mjs          (le contrôle)
            node scripts/mv-harnais-presence2.mjs --contre  (la contre-épreuve)
   `_mvCuvierNotees`, `_mvChapeauLib` et la frise sont EXÉCUTÉS (bloc borné de
   src/jalons.js) ; le reste est le câblage (le relevé, la carte de l'Accueil).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J0 = fs.readFileSync('src/jalons.js', 'utf8'), C0 = fs.readFileSync('src/cuvier.js', 'utf8'), H = fs.readFileSync('index.html', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
let n = 0;
const charger = J => import('data:text/javascript;base64,' + Buffer.from(J.slice(J.indexOf(DEB), J.indexOf(FIN)) + '\nexport { _mvCuvierNotees, _mvChapeauLib, _mvPremieresFois };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
const CUVES = [
  { nom: 'Cuve 4', mesures_fa: [
    { id: 'm1', date: '2026-06-11', remontages: 2, pigeages: 1, qui: ['Paul', 'Léo'], par: 'Nico' },            // hier : oui
    { id: 'm6', date: '2026-06-10', pigeages: 1, intervenants: ['Paul'], par: 'Nico' },                          // l'ancien champ de PRESENCE-2 : relu
    { id: 'm2', date: '2026-06-12', remontages: 0, pigeages: 0, densite: 1050, qui: ['Paul'], par: 'Nico' },     // rien sur le chapeau : non
    { id: 'm3', date: '2026-06-12', pigeages: 2, qui: ['Paul', 'Léo'], par: 'Paul', tour: true },                // sa propre tournée : non
    { id: 'm4', date: '2026-06-01', remontages: 1, qui: ['Paul'], par: 'Nico' },                                 // trop vieux : non
  ] },
  { nom: 'Cuve 7', mesures_fa: [{ id: 'm5', date: '2026-06-12', pigeages: 3, qui: ['Nico', 'Paul'], par: 'Nico', tour: true }] },   // la tournée de Nico, aujourd'hui : oui
];
async function controles(J) {
  const K = await charger(J), r = [];
  const L = K._mvCuvierNotees('Paul', CUVES, '2026-06-12', 3);
  r.push(['les relevés où il est noté, par un autre, avec du travail de chapeau, depuis trois jours, les plus récents d’abord', L.map(x => x.id).join() === 'm5,m1', L.map(x => x.id).join()]);
  r.push(['PRESENCE-2B : `qui` (la tournée et le relevé) fait foi ; l’ancien champ « intervenants » est relu ; sa propre tournée ne se signale pas', K._mvCuvierNotees('Paul', CUVES, '2026-06-12', 3).length === 2 && K._mvCuvierNotees('Paul', [{ nom: 'C', mesures_fa: [CUVES[0].mesures_fa[1]] }], '2026-06-12', 3).length === 1 && !L.some(x => x.id === 'm3') && L[0].tour === true]);
  r.push(['chaque entrée dit sa cuve, ses remontages et pigeages, qui l’a noté', L[1] && L[1].cuve === 'Cuve 4' && L[1].rem === 2 && L[1].pig === 1 && L[1].par === 'Nico' && L[1].type === 'chapeau']);
  r.push(['le geste se dit : « 2 remontages et 1 pigeage », « 3 pigeages »', K._mvChapeauLib(2, 1) === '2 remontages et 1 pigeage' && K._mvChapeauLib(0, 3) === '3 pigeages' && K._mvChapeauLib(1, 0) === '1 remontage']);
  r.push(['sans nom, rien', K._mvCuvierNotees('', CUVES, '2026-06-12', 3).length === 0]);
  const P = K._mvPremieresFois('Paul', { cuves: CUVES, aujourdhui: '2026-06-12' });
  const F = Object.fromEntries(P.faites.map(f => [f.cle, f]));
  r.push(['la frise : le premier remontage et le premier pigeage où il était là, avec la cuve', F.rem && F.rem.date === '2026-06-01' && F.rem.detail === 'Cuve 4' && F.pig && F.pig.date === '2026-06-10']);
  return r;
}
function cablage(J, C) {
  return [
    ['le relevé du Cuvier a « Qui était là », dans le bloc du chapeau', /<div class="fl"[^>]*>Qui était là<\/div>\n\s*<div class="ppicker" id="vm-int-pick"><\/div>/.test(H)],
    ['à l’ouverture, les présents se cochent depuis `qui` (les déjà notés le restent à la correction)', /_vmIntRender\(m&&\(\(m\.qui&&m\.qui\.length\)\?m\.qui:m\.intervenants\)\);/.test(C) && /pris\.forEach\(function\(n\)\{ if\(noms\.indexOf\(n\)<0\) noms\.push\(n\); \}\);/.test(C)],
    ['l’enregistrement pose `qui` seulement s’il y a des noms et que le choix était à l’écran, dit qui les a notés, et fond l’ancien champ', /if\(_vmInt\.length\)\{ mesure\.qui=_vmInt; mesure\.par=\(window\.currentUser&&window\.currentUser\.nom\)\|\|''; \} else \{ delete mesure\.qui; delete mesure\.par; \}\n    delete mesure\.intervenants;/.test(C) && /var _vmChoix=!!\(_vmBox&&_vmBox\.children&&_vmBox\.children\.length&&\(!_vmChapEl\|\|_vmChapEl\.style\.display!=='none'\)\);\n  if\(_vmChoix\)\{/.test(C)],
    ['PRESENCE-2B : la tournée note qui l’a faite', /if\(_VT_WHO\.length\) m\.qui=_VT_WHO\.slice\(\);\n    if\(window\.currentUser&&window\.currentUser\.nom\) m\.par=window\.currentUser\.nom;/.test(C)],
    ['les noms des puces sont échappés', /data-val="'\+_escAttr\(n\)\+'"/.test(C) && /\+_escHtml\(n\)\+'<\/div>'/.test(C)],
    ['la carte de l’Accueil mêle le Chai et le Cuvier, deux au plus', /\.concat\(_mvCuvierNotees\(u\.nom, \(window\.CAVE_VENDANGE && window\.CAVE_VENDANGE\.cuves_vinif\) \|\| \[\], auj, 3\)\)/.test(J) && /\.slice\(0, 2\);/.test(J)],
    ['la carte du Cuvier échappe ses textes et passe l’identifiant par data-id', /esc\(o\.par \|\| \(o\.tour \? 'La tournée' : 'L’admin'\)\)/.test(J) && /esc\(o\.cuve\)/.test(J) && (J.match(/data-id="' \+ _mvJalEnc\(o\.id\) \+ '" onclick="_mvCaveNoteVu\(this\.dataset\.id\)"/g) || []).length === 2],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── PRESENCE-2 — « Qui était là » au Cuvier\n');
  for (const [x, c, d] of await controles(J0)) t(x, c, d);
  for (const [x, c] of cablage(J0, C0)) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── PRESENCE-2 — contre-épreuve\n');
const essais = [
  ['un relevé noté par lui-même montré est vu', J0.replace(" || m.par === nom) return;", ") return;"), C0, 'les relevés où il est noté'],
  ['un relevé sans travail de chapeau montré est vu', J0.replace("      if (!((m.remontages | 0) > 0 || (m.pigeages | 0) > 0)) return;\n", ''), C0, 'les relevés où il est noté'],
  ['un tableau vide écrit dans le document est vu', J0, C0.replace("} else { delete mesure.qui; delete mesure.par; }", "} else { mesure.qui=[]; }"), 'l’enregistrement pose `qui`'],
  ['un relevé de la tournée corrigé sans le bloc du chapeau, qui perdrait `qui`, est vu', J0, C0.replace("  if(_vmChoix){\n", "  if(true){\n"), 'l’enregistrement pose `qui`'],
  ['l’ancien champ seul lu (la tournée oubliée) est vu', J0.replace("var qui = (m && m.qui && m.qui.length) ? m.qui : ((m && m.intervenants) || []);", "var qui = (m && m.intervenants) || [];"), C0, 'les relevés où il est noté'],
];
let rates = 0;
for (const [x, J, C, cible] of essais) {
  let vu; try { vu = (await controles(J)).concat(cablage(J, C)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = false; console.log('      (plantage : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
