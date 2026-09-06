import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';
const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/pilotage.js');
let ko = 0, ok = 0;
function t(nom, cond) {
  if (cond) { ok++; console.log('  \u2713 ' + nom); }
  else { ko++; console.log('  \u2717 ' + nom); }
}

const src = fs.readFileSync(P, 'utf8');
const L = src.split('\n');

console.log('\n── Garde de montage ──');
// Sans ces ancres, un renommage ferait verdir un harnais vide (§40).
t('_pecCadHisto existe', /function _pecCadHisto\(/.test(src));
t('_pilCapaProj existe', /function _pilCapaProj\(/.test(src));
t('cadSrc existe', /var cadSrc *=/.test(src));
t('cadAppl est defini', /var cadAppl *= *\(cadSrc==='planning'\)/.test(src));

console.log('\n── 1. applic derive de la SOURCE, pas de ok ──');
t('applic vrai seulement en marche 1', /cadAppl *= *\(cadSrc==='planning'\)/.test(src));
t('applic expose dans E.cad', /cad:\{[^}]*applic:cadAppl/.test(src.replace(/\n/g, ' ')));

console.log('\n── 2. Tout site PROJECTIF est garde ──');
// Un site projectif = il multiplie une charge/un budget, ou trace une fin.
const sites = [
  ['facteur k de la date', /if\(E&&E\.cad&&E\.cad\.ok&&E\.cad\.applic\)\{\s*\n\s*k=1\+/],
  ['budget projete', /var projFin = cadAppl \? \(engage \+ resteE\*\(1\+ecart\)\)/],
  ['ligne de fin du graphe', /var pFin=\(E && E\.cad && E\.cad\.ok && E\.cad\.applic/],
  ['legende fin projetee', /E\.cad\.ok&&E\.cad\.applic&&Math\.abs\(E\.cad\.ecart\)>5\?'<span class="pec-lg">/],
  ['KPI budget accueil', /var ec=\(E\.cad\.ok&&E\.cad\.applic\)\?E\.cad\.ecart:null;/]
];
for (const [nom, re] of sites) t(nom + ' garde par applic', re.test(src));

console.log('\n── 3. Aucun site projectif NON garde ne subsiste ──');
// Balayage : toute ligne qui lit cad.ecart ou cadOk pour projeter doit citer applic.
const suspects = [];
L.forEach((ln, i) => {
  const n = i + 1;
  if (/^\s*\/\//.test(ln)) return;                   // commentaire
  const litEcart = /E\.cad\.ecart/.test(ln);
  const projette = /projFin|k=1\+|pFin=/.test(ln);
  if ((litEcart && projette) || /k=1\+\(\(E\.cad\.ecart/.test(ln)) {
    // Une garde a plus de 6 lignes du site qu'elle protege n'est plus lisible :
    // c'est la fenetre au-dela de laquelle on la considere absente.
    const amont = L.slice(Math.max(0, i - 6), i).join('\n');
    if (!/applic/.test(ln) && !/applic/.test(amont)) suspects.push(n + ': ' + ln.trim().slice(0, 70));
  }
});
t('zero site projectif non garde', suspects.length === 0);
if (suspects.length) suspects.forEach(s => console.log('      ' + s));

console.log('\n── 4. La marche 2 reste LISIBLE (elle n\'est pas supprimee) ──');
t('_pecCadHisto toujours appelee', /cadHist *= *_pecCadHisto\(hBarC\)/.test(src));
t('source histo toujours annoncee', /E\.cad\.src==='histo'/.test(src));
t('alerte histo ne promet plus de projection',
  !/la projection reprend donc ce rythme/.test(src));
t('alerte histo dit « repere »', /c\\u2019est un <b>rep\\u00e8re<\/b>, pas une pr\\u00e9vision/.test(src));

console.log('\n── 5. Bornes et seuil intacts ──');
t('borne [0,5 ; 3] toujours en place', /k>=0\.5 && k<=3/.test(src));
t('seuil d\'avancement inchange', /_PEC_CAD_AVC = 0\.40/.test(src));

console.log('\n' + (ko ? '\u2717 ' + ko + ' ECHEC(S)' : '\u2713 ' + ok + ' assertions vertes'));
process.exit(ko ? 1 : 0);
