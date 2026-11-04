/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — COEQ-4 (§525) : LE PILOTAGE COMPTE LE COÉQUIPIER, AU JOUR DE CHAQUE PARCELLE
   Lancer : node scripts/mv-harnais-coeq4.mjs          (le contrôle)
            node scripts/mv-harnais-coeq4.mjs --contre  (la contre-épreuve)
   `_ecoTracHByParc` (pilotage.js) est EXÉCUTÉE avec `_trCoDe` / `_trJourDe` de coequipier.js, sur une tarière de deux jours :
   les heures de chacun au jour de la parcelle, le coût à chacun son taux, le carburant qui ne double pas, la fenêtre.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const lire = f => fs.readFileSync(f, 'utf8');
const S0 = { P: lire('src/pilotage.js'), C: lire('src/coequipier.js'), A: lire('src/app.js'), G: lire('src/reglages.js'), U: lire('src/utils.js') };
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0; const k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
function calc(S, win) {
  const co = (S.C.match(/var _trHas=[^\n]*\n/) || [''])[0] + ['_trCoDe', '_trIso', '_trJourDe'].map(n => fonction(S.C, n)).join('\n') + '\nreturn {_trCoDe,_trJourDe};';
  const W = new Function(co)();
  const win0 = { SESSIONS: [
      { activite: 'Tarière', conducteur: 'Marc', coequipier: 'Hugo', date: '2026-10-13', parcellesFaites: [{ nom: 'P1', co: 'Léo' }, { nom: 'P2', co: 'Hugo', d: '2026-10-14' }] },
      { activite: 'Tarière', conducteur: 'Marc', coequipier: 'Paul', date: '2026-10-15', parcellesFaites: [{ nom: 'P3' }] }],
    ACTIVITES: [{ nom: 'Tarière', h_ha: 2 }], PARCELLES: [{ nom: 'P1', surface: 1 }, { nom: 'P2', surface: 1 }, { nom: 'P3', surface: 1 }],
    MEMBRES: [{ nom: 'Marc', taux: 20 }, { nom: 'Léo', taux: 15 }, { nom: 'Hugo', taux: 18 }, { nom: 'Paul', taux: 16 }],
    _mvPaieTauxEffAt: m => m.taux, _trCoDe: W._trCoDe, _trJourDe: W._trJourDe, getSaisonActive: () => ({ nom: '' }) };
  const f = new Function('window', 'function _ecoRate(){ return 10; } function _ecoCfg(){ return { conso: 6, gnrL: 1.5 }; }\n' + fonction(S.P, '_ecoTracHByParc') + '\nreturn _ecoTracHByParc;')(win0);
  return f(win);
}
function controles(S) {
  const r = []; let o = null, w = null; try { o = calc(S, null); w = calc(S, { d0: '2026-10-14', d1: '2026-10-14' }); } catch (e) { o = null; }
  r.push(['le calcul des heures du tracteur s’exécute', !!o]);
  if (o) {
    r.push(['chaque personne au jour de la parcelle : Marc le 13 et le 14, Léo le 13, Hugo le 14', (o.condH.Marc || {})['2026-10-13'] === 2 && (o.condH.Marc || {})['2026-10-14'] === 2 && (o.condH['Léo'] || {})['2026-10-13'] === 2 && (o.condH.Hugo || {})['2026-10-14'] === 2 && !(o.condH.Hugo || {})['2026-10-13']]);
    r.push(['le coût : le conducteur ET le coéquipier, chacun à son taux (P1 = 2 h × 20 + 2 h × 15)', o.cost.P1 === 70 && o.cost.P2 === 76]);
    r.push(['le carburant ne double pas (2 h × 6 L × 1,5 €)', o.gnrByDate['2026-10-13'] === 18 && o.h.P1 === 2 && o.hCo.P1 === 2]);
    r.push(['l’engagement du jour : main-d’œuvre des deux + carburant, au jour de la parcelle', o.byDate['2026-10-14'] === 2 * 20 + 2 * 18 + 18 && o.condByDate['2026-10-14'] === 76]);
    r.push(['une session d’avant (sans `co`) compte le coéquipier de la session', o.condH.Paul && o.condH.Paul['2026-10-15'] === 2]);
    r.push(['une fenêtre se juge parcelle par parcelle', !!w && !w.h.P1 && w.h.P2 === 2 && !w.h.P3]);
  }
  r.push(['le temps réel d’Aujourd’hui retire aussi le coéquipier', /cadP\.h - T\.tracH - \(T\.tracHCo\|\|0\) - hbH/.test(S.P)]);
  r.push(['« En direct » nomme le coéquipier et ne montre plus l’amendement en validation d’équipe', /' et '\+s\.coequipier\):''\)\+', au tracteur<\/b>/.test(S.A) && /j\.parcelle&&!j\.auTracteur/.test(S.A)]);
  r.push(['les rapports disent « Équipe »', /<th>Tracteur<\/th><th>\\u00c9quipe<\/th>/.test(S.A) && /<th>Équipe<\/th><th>Avancement<\/th>/.test(S.G) && (S.G.match(/window\._trCoeqNoms\(s\)\.join/g) || []).length === 2]);
  r.push(['l’aide des calculs (MV_INFO) parle du coéquipier', /conducteur ou coéquipier, au jour de chaque parcelle/.test(S.U) && /heures au tracteur<\/b> \(conducteur et coéquipier\)/.test(S.U)]);
  return r;
}
let ko = 0;
if (!CONTRE) {
  console.log('\n── COEQ-4 — le Pilotage compte le coéquipier\n');
  for (const [n, c] of controles(S0)) { if (!c) ko++; console.log('  ' + (c ? '\x1b[32m✓\x1b[0m ' : '\x1b[31m✗\x1b[0m ') + n); }
  console.log(`\n  ${ko ? ko + ' rouge(s)' : 'tout est vert'}\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── COEQ-4 — contre-épreuve\n');
const mut = (k, a, b) => { if (!S0[k].includes(a)) throw new Error('défaut non posé : ' + a.slice(0, 50)); return { ...S0, [k]: S0[k].replace(a, b) }; };
const essais = [
  ['le coéquipier oublié du temps vigne', () => mut('P', "if(_co && _j){ if(!out.condH[_co])", "if(false){ if(!out.condH[_co])"), 'chaque personne'],
  ['toutes les heures au premier jour', () => mut('P', "var _j=(typeof window._trJourDe==='function')?window._trJourDe(se,x):String(se.date||'').slice(0,10);", "var _j=String(se.date||'').slice(0,10);"), 'chaque personne'],
  ['le coéquipier ne coûte rien', () => mut('P', "var mo=h*_tuP+(_co?h*_tuC:0);", "var mo=h*_tuP;"), 'le coût'],
  ['le carburant double', () => mut('P', "out.gnrByDate[_j]=(out.gnrByDate[_j]||0)+h*_cfgT.conso*_cfgT.gnrL;", "out.gnrByDate[_j]=(out.gnrByDate[_j]||0)+2*h*_cfgT.conso*_cfgT.gnrL;"), 'le carburant'],
  ['la fenêtre jugée à la session', () => mut('P', "      if(win&&win.d0&&win.d1&&(!_j||_j<win.d0||_j>win.d1)) return;\n", ''), 'une fenêtre'],
];
let rates = 0;
for (const [n, fab, cible] of essais) { let vu = false; try { vu = controles(fab()).some(([x, c]) => x.startsWith(cible) && !c); } catch (e) { vu = false; } if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); } }
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
