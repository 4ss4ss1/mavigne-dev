/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — PRESENCE-1 (§344) : « TA PRÉSENCE EST NOTÉE »
   Lancer : node scripts/mv-harnais-presence1.mjs          (le contrôle)
            node scripts/mv-harnais-presence1.mjs --contre  (la contre-épreuve)
   Le choix des opérations est EXÉCUTÉ (bloc borné de src/jalons.js) sur un Chai
   inventé ; le reste est le câblage (la carte, « Vu », l'Accueil, le Chai).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J0 = fs.readFileSync('src/jalons.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8'), H = fs.readFileSync('index.html', 'utf8');
const U = fs.readFileSync('src/utils.js', 'utf8'), S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
let n = 0;
const charger = J => import('data:text/javascript;base64,' + Buffer.from(J.slice(J.indexOf(DEB), J.indexOf(FIN)) + '\nexport { _mvCaveNotees, _mvCaveTypeLib, _mvCaveQuand };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
const OPS = [
  { id: 'a', type: 'ouillage', date: '2026-06-11', operateur: 'Nico', intervenants: ['Paul', 'Léo'] },        // hier, noté par Nico : oui
  { id: 'b', type: 'soutirage', date: '2026-06-01', operateur: 'Nico', intervenants: ['Paul'] },               // trop vieux
  { id: 'c', type: 'degustation', date: '2026-06-12', operateur: 'Paul', intervenants: ['Paul'] },             // saisi par lui-même
  { id: 'd', type: 'soufre', date: '2026-06-12', operateur: 'Nico', intervenants: ['Léo'] },                   // pas lui
  { id: 'e', type: 'filtration', date: '2026-06-10', operateur: 'Paul' },                                       // ancienne forme, lui-même
  { id: 'f', type: 'analyse', date: '2026-06-12', operateur: 'Nico', intervenants: ['Paul'] },                 // aujourd'hui : oui
  { id: 'g', type: 'ouillage', date: '2026-06-13', operateur: 'Nico', intervenants: ['Paul'] },                // demain : non
  { id: 'h', type: 'soutirage', date: '2026-06-09', operateur: 'Nico', intervenants: ['Paul'] },               // il y a 3 jours : oui, mais 3e
];
async function controles(J) {
  const K = await charger(J), r = [];
  const L = K._mvCaveNotees('Paul', OPS, '2026-06-12', 3).map(o => o.id);
  r.push(['les opérations où il est noté, par un autre, depuis trois jours, les plus récentes d’abord, deux au plus', L.join() === 'f,a', L.join()]);
  r.push(['jamais celles qu’il a saisies lui-même, ni celles d’un autre intervenant, ni une date à venir', !L.includes('c') && !L.includes('d') && !L.includes('g') && !L.includes('e')]);
  r.push(['l’ancienne forme (« opérateur » seul) compte, quand c’est un autre qui la porte', K._mvCaveNotees('Paul', [{ id: 'x', type: 'ouillage', date: '2026-06-12', operateur: 'Léo', intervenants: [] }, { id: 'y', type: 'ouillage', date: '2026-06-12', operateur: 'Paul' }], '2026-06-12', 3).map(o => o.id).join() === '']);
  r.push(['sans nom, rien', K._mvCaveNotees('', OPS, '2026-06-12', 3).length === 0]);
  r.push(['au-delà de trois jours, plus rien (même seule)', K._mvCaveNotees('Paul', [{ id: 'z', type: 'ouillage', date: '2026-06-07', operateur: 'Nico', intervenants: ['Paul'] }], '2026-06-12', 3).length === 0]);
  r.push(['les gestes se disent : « l’ouillage », « le sulfitage »… et un type inconnu reste « une opération »', K._mvCaveTypeLib('ouillage') === 'l’ouillage' && K._mvCaveTypeLib('soufre') === 'le sulfitage' && K._mvCaveTypeLib('zzz') === 'une opération']);
  r.push(['le jour se dit : d’aujourd’hui, d’hier, du 09/06', K._mvCaveQuand('2026-06-12', '2026-06-12') === 'd’aujourd’hui' && K._mvCaveQuand('2026-06-11', '2026-06-12') === 'd’hier' && K._mvCaveQuand('2026-06-09', '2026-06-12') === 'du 09/06']);
  r.push(['« Vu » passe l’identifiant par data-id, jamais dans le code de l’attribut', /data-id="' \+ _mvJalEnc\(o\.id\) \+ '" onclick="_mvCaveNoteVu\(this\.dataset\.id\)"/.test(J) && !/onclick="_mvCaveNoteVu\(' \+/.test(J)]);
  r.push(['le repli d’échappement encode (jamais il n’efface)', /function _mvJalEnc\(x\) \{ return String\(x == null \? '' : x\)\.replace\(\/&\/g, '&amp;'\)/.test(J) && !/replace\(\/\[<>&"\]\/g, ''\)/.test(J)]);
  r.push(['les noms et les cuvées sont échappés dans la carte', /esc\(o\.operateur \|\| 'L’admin'\)/.test(J) && /esc\(noms\.join\(', '\)\)/.test(J) && /esc\(avec\.join\(', '\)\)/.test(J)]);
  r.push(['« Vu » se range sur ce téléphone seulement (localStorage, gardé sous try)', /function _mvCaveVus\(\) \{ try \{ return JSON\.parse\(localStorage\.getItem/.test(J) && /try \{ var v = _mvCaveVus\(\);/.test(J)]);
  return r;
}
function cablage() {
  return [
    ['l’Accueil rend la carte (renderHome)', /if\(window\._mvCaveNoteRender\) window\._mvCaveNoteRender\(\);/.test(A)],
    ['la carte a sa place en tête de l’Accueil', H.includes('<div id="home-cave-note"></div>')],
    ['le Chai prévient l’admin, sous les intervenants', /id="cop-int-wrap"[^>]*><\/div>\n\s*<div class="cop-int-note">Les intervenants cochés verront sur leur Accueil que leur présence est notée/.test(H)],
    ['le pourquoi du geste vient des fiches (POURQUOI-1), en texte brut', /export function _mvPqTexte\(libelle, ctx, champ\)/.test(U) && /window\._mvPqTexte = _mvPqTexte;/.test(U)],
    ['le style, sans couleur en dur', (() => { const b = S.slice(S.indexOf('/* PRESENCE-1 (§344)'), S.indexOf('/* ★ TETE-2 (§329)')); return b.length > 100 && !/#[0-9a-fA-F]{3,6}\b/.test(b); })()],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── PRESENCE-1 — « Ta présence est notée »\n');
  for (const [x, c, d] of await controles(J0)) t(x, c, d);
  for (const [x, c] of cablage()) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── PRESENCE-1 — contre-épreuve\n');
const essais = [
  ['une opération saisie par lui-même montrée est vue', J0.replace('    if (o.operateur === nom) return false;\n', ''), 'jamais celles qu’il a saisies'],
  ['la limite des trois jours retirée est vue', J0.replace('return d >= 0 && d <= lim;', 'return d >= 0;'), 'au-delà de trois jours'],
  ['l’identifiant remis dans le code de l’attribut est vu', J0.replace('data-id="\' + _mvJalEnc(o.id) + \'" onclick="_mvCaveNoteVu(this.dataset.id)"', 'onclick="_mvCaveNoteVu(\' + esc(o.id) + \')"'), '« Vu » passe l’identifiant'],
];
let rates = 0;
for (const [x, J, cible] of essais) {
  let vu; try { vu = (await controles(J)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = false; console.log('      (plantage : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
