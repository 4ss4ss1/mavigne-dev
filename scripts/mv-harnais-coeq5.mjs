/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — COEQ-5 (§526) : « EN DIRECT » DU PILOTAGE NOMME LE COÉQUIPIER ; « PAR PERSONNE » ; LE CONTRÔLE DE CADENCE
   Lancer : node scripts/mv-harnais-coeq5.mjs          (le contrôle)
            node scripts/mv-harnais-coeq5.mjs --contre  (la contre-épreuve)
   `_trParPersonne` (coequipier.js) et `_ckAvec` (cockpit.js) sont EXÉCUTÉES sur une session inventée ; le reste est le câblage.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const lire = f => fs.readFileSync(f, 'utf8');
const S0 = { C: lire('src/coequipier.js'), K: lire('src/cockpit.js'), P: lire('src/pilotage.js'), V: lire('src/cockpit-vue.js'), T: lire('src/tracteur.js'), L: lire('scripts/mv-harnais-liste.mjs'), H: lire('scripts/harnais-cadence-escalier.mjs') };
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0; const k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
const SESS = { activite: 'Tarière', conducteur: 'Marc', coequipier: 'Hugo', parcellesFaites: [{ nom: 'A', co: 'Léo', dmin: 60, data: { Trous: 30 } }, { nom: 'B', co: 'Hugo', data: { Trous: 20 } }, { nom: 'C', co: 'Léo', dmin: 30, data: { Trous: 10 } }] };
function controles(S) {
  const r = []; let pp = null, av = null;
  try {
    const has = (S.C.match(/var _trHas=[^\n]*\n/) || [''])[0];
    const P = { chrMes: x => (x && x.dmin) || 0, sessBaremeMin: (s, surf) => surf * 120, chrSurf: n => (n === 'B' ? 0.5 : 1) };
    const win = { ACTIVITES: [{ nom: 'Tarière', champCustom: { label: 'Trous', feedsPlantation: true } }] };
    pp = new Function('window', 'P', has + 'function _P(){ return P; }\n' + fonction(S.C, '_trCoDe') + '\n' + fonction(S.C, '_trParPersonne') + '\nreturn _trParPersonne;')(win, P)(SESS);
    const w2 = { _trCoDe: new Function(has + fonction(S.C, '_trCoDe') + '\nreturn _trCoDe;')() };
    av = new Function('window', fonction(S.K, '_ckAvec') + '\nreturn _ckAvec;')(w2);
  } catch (e) { pp = null; }
  r.push(['« Par personne » et les coéquipiers du fil s’exécutent', !!pp && !!av]);
  if (pp && av) {
    const g = n => pp.lignes.find(x => x.nom === n) || {};
    r.push(['par personne : le conducteur toutes les parcelles (150 min, 60 trous), chaque coéquipier les siennes (Léo 90 min et 40 trous, Hugo 60 min et 20 trous)', g('Marc').min === 150 && g('Marc').trous === 60 && g('Léo').min === 90 && g('Léo').trous === 40 && g('Hugo').min === 60 && g('Hugo').trous === 20 && pp.trous === true]);
    r.push(['le fil : les coéquipiers des parcelles finies, sinon celui du moment', av(SESS, ['A', 'C']).join() === 'Léo' && av(SESS, ['A', 'B']).join() === 'Léo,Hugo' && av(SESS, null).join() === 'Hugo']);
  }
  r.push(['le fil du tracteur porte ses coéquipiers (début, parcelles finies, en cours, en pause)', (S.K.match(/avec: \(typeof _ckAvec === 'function' \? _ckAvec\(s, (null|f\.parcs)\) : \[\]\)/g) || []).length === 4]);
  r.push(['le modèle en fait « Marc et Léo », deux initiales', (S.P.match(/var n=x\.qui\?\[x\.qui\]\.concat\(Array\.isArray\(x\.avec\)\?x\.avec:\[\]\):\[\];/g) || []).length === 2 && (S.P.match(/noms:\(n\.length>1\?n\.slice\(0,-1\)\.join\(', '\)\+' et '\+n\[n\.length-1\]/g) || []).length === 2]);
  r.push(['le verbe s’accorde : « ont fini »', /EQ\[e\.eq\]\.ini\.length > 1\) \? ' ont ' : ' a '/.test(S.V) && /qui \+ v \+ 'fini '/.test(S.V)]);
  r.push(['la fiche de session montre « Par personne », le pont prête le barème', /window\._trParPersonneHtml\(s\)/.test(S.T) && /sessBaremeMin:_sessBaremeMin/.test(S.T)]);
  r.push(['le contrôle de cadence est recalé et joué par la chaîne', /non appliqu\\\\u00e9 au budget/.test(S.H) && /harnais-cadence-escalier\.mjs/.test(S.L)]);
  return r;
}
let ko = 0;
if (!CONTRE) {
  console.log('\n── COEQ-5 — « En direct » du Pilotage, « Par personne »\n');
  for (const [n, c] of controles(S0)) { if (!c) ko++; console.log('  ' + (c ? '\x1b[32m✓\x1b[0m ' : '\x1b[31m✗\x1b[0m ') + n); }
  console.log(`\n  ${ko ? ko + ' rouge(s)' : 'tout est vert'}\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── COEQ-5 — contre-épreuve\n');
const mut = (k, a, b) => { if (!S0[k].includes(a)) throw new Error('défaut non posé : ' + a.slice(0, 50)); return { ...S0, [k]: S0[k].replace(a, b) }; };
const essais = [
  ['le coéquipier compte toutes les parcelles', () => mut('C', "ajoute(_trCoDe(s,e),'co\\u00e9quipier',m,t);", "ajoute(s.coequipier,'co\\u00e9quipier',m,t);"), 'par personne'],
  ['le fil oublie les coéquipiers des parcelles', () => mut('K', "if(parcs && parcs.length && co){", "if(false){"), 'le fil :'],
  ['le modèle perd « et Léo »', () => mut('P', "var n=x.qui?[x.qui].concat(Array.isArray(x.avec)?x.avec:[]):[];", "var n=x.qui?[x.qui]:[];"), 'le modèle'],
  ['le verbe reste au singulier', () => mut('V', "? ' ont ' : ' a '", "? ' a ' : ' a '"), 'le verbe'],
];
let rates = 0;
for (const [n, fab, cible] of essais) { let vu = false; try { vu = controles(fab()).some(([x, c]) => x.startsWith(cible) && !c); } catch (e) { vu = false; } if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); } }
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
