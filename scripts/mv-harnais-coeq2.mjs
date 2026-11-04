/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — COEQ-2 (§523) : LE COÉQUIPIER DU TRACTEUR, PARCELLE PAR PARCELLE
   Lancer : node scripts/mv-harnais-coeq2.mjs          (le contrôle)
            node scripts/mv-harnais-coeq2.mjs --contre  (la contre-épreuve)
   Les fonctions de src/coequipier.js sont EXÉCUTÉES sur des sessions inventées (qui était là, le passé figé avant un
   changement, le jour d'une parcelle, l'annulation) ; le bloc des jalons aussi (chacun ses parcelles). Le reste est le câblage.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const lire = f => fs.readFileSync(f, 'utf8');
const S0 = { C: lire('src/coequipier.js'), T: lire('src/tracteur.js'), J: lire('src/jalons.js'), H: lire('index.html'), A: lire('src/app.js') };
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0; const k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
const NOMS = ['_trCoDe', '_trSessADeux', '_trCoeqNoms', '_trIso', '_trAuj', '_trJourDe', '_trStampCo', '_trFigerCo', '_trCoSnap', '_trCoRetour', '_trJoursDe', '_trEqDuJour', '_trAvecTxt'];
function moteur(S) {
  const has = (S.C.match(/var _trHas=[^\n]*\n/) || [''])[0];
  const code = has + NOMS.map(n => fonction(S.C, n)).join('\n') + '\nreturn {' + NOMS.join(',') + '};';
  const win = { ACTIVITES: [{ nom: 'Tarière' }, { nom: 'Rognage' }, { nom: 'Amendement' }], _mvActCoeq: new Function(fonction(S.T, '_mvActCoeq') + '\nreturn _mvActCoeq;')() };
  return new Function('window', '_mvToday', code)(win, () => '2026-11-03');
}
async function jalons(S) {
  const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
  const src = S.J.slice(S.J.indexOf(DEB), S.J.indexOf(FIN)) + '\nexport { _mvJalonsCompteurs, MV_JALONS_SERIES };\n// ' + Math.random();
  return import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
}
async function controles(S) {
  const r = [];
  let M = null; try { M = moteur(S); } catch (e) { M = null; }
  r.push(['les fonctions du coéquipier s’exécutent', !!M]);
  if (M) {
    const leg = { activite: 'Tarière', coequipier: 'Léo', date: '2026-11-02', parcellesFaites: [{ nom: 'A' }, { nom: 'B', co: 'Hugo' }, { nom: 'C', co: '' }] };
    r.push(['une parcelle sans `co` lit le coéquipier de la session ; `co` l’emporte, vide = personne', M._trCoDe(leg, leg.parcellesFaites[0]) === 'Léo' && M._trCoDe(leg, leg.parcellesFaites[1]) === 'Hugo' && M._trCoDe(leg, leg.parcellesFaites[2]) === '']);
    const s = { activite: 'Tarière', coequipier: 'Léo', date: '2026-11-02', parcellesFaites: [{ nom: 'P1' }, { nom: 'P2', d: '2026-11-03' }] };
    M._trFigerCo(s); s.coequipier = 'Hugo'; const e = { nom: 'P3', d: '2026-11-03' }; M._trStampCo(s, e); s.parcellesFaites.push(e);
    r.push(['changer pour la suite : le passé garde Léo, la parcelle suivante prend Hugo', M._trCoDe(s, s.parcellesFaites[0]) === 'Léo' && M._trCoDe(s, s.parcellesFaites[1]) === 'Léo' && e.co === 'Hugo']);
    const sr = { activite: 'Rognage', parcellesFaites: [] }, e2 = { nom: 'X' }; M._trStampCo(sr, e2);
    r.push(['une session qui ne se fait pas à deux ne note aucun coéquipier', !('co' in e2) && M._trSessADeux(sr) === false && M._trSessADeux(s) === true]);
    const t0 = new Date(2026, 10, 4, 10, 0).getTime();
    r.push(['le jour d’une parcelle : le chrono, puis le jour de la coche, puis la session', M._trJourDe(s, { t0 }) === '2026-11-04' && M._trJourDe(s, { d: '2026-11-03' }) === '2026-11-03' && M._trJourDe(s, {}) === '2026-11-02']);
    const J = M._trJoursDe(s);
    r.push(['les jours : le plus récent d’abord, et qui était là ce jour-là', J.length === 2 && J[0].jour === '2026-11-03' && M._trAvecTxt(M._trEqDuJour(s, J[0].parcs)) === 'avec Léo puis Hugo' && M._trAvecTxt(M._trEqDuJour(s, J[1].parcs)) === 'avec Léo']);
    r.push(['« seul », « seul puis avec Hugo »', M._trAvecTxt(['']) === 'seul' && M._trAvecTxt(['', 'Hugo']) === 'seul puis avec Hugo']);
    const u = { coequipier: 'Léo', parcellesFaites: [{ nom: 'A' }, { nom: 'B', co: 'Léo', coCorr: { par: 'Nico', le: '2026-11-01' } }] };
    const snap = M._trCoSnap(u); u.parcellesFaites[0].co = 'Hugo'; u.parcellesFaites[1].co = 'Inès'; delete u.parcellesFaites[1].coCorr; M._trCoRetour(u, snap);
    r.push(['« Annuler » remet chaque parcelle comme avant (un `co` absent redevient absent)', !('co' in u.parcellesFaites[0]) && u.parcellesFaites[1].co === 'Léo' && u.parcellesFaites[1].coCorr && u.parcellesFaites[1].coCorr.par === 'Nico']);
    r.push(['les coéquipiers d’une session, dans l’ordre d’arrivée', M._trCoeqNoms(s).join() === 'Léo,Hugo']);
  }
  let JL = null; try { JL = await jalons(S); } catch (e) { JL = null; }
  r.push(['le bloc des jalons s’exécute', !!JL]);
  if (JL) {
    const D = { parcelles: [{ nom: 'P1', surface: 2 }, { nom: 'P2', surface: 1 }, { nom: 'P3', surface: 1 }], activites: [{ nom: 'Tarière', champCustom: { label: 'Trous', feedsPlantation: true } }, { nom: 'Amendement' }],
      sessions: [{ conducteur: 'Marc', coequipier: 'Hugo', activite: 'Tarière', statut: 'Terminé', parcellesFaites: [{ nom: 'P1', data: { Trous: 30 }, co: 'Léo' }, { nom: 'P2', data: { Trous: 20 }, co: 'Hugo' }] },
                 { conducteur: 'Marc', coequipier: 'Paul', activite: 'Tarière', statut: 'Terminé', parcellesFaites: [{ nom: 'P3', data: { Trous: 10 } }] },
                 { conducteur: 'Marc', coequipier: 'Léo', activite: 'Amendement', statut: 'Terminé', parcellesFaites: [{ nom: 'P1', co: 'Léo' }] }] };
    const c = n => JL._mvJalonsCompteurs(n, D);
    r.push(['jalons : chaque coéquipier ses trous (Léo 30, Hugo 20), le conducteur tous (60), une session d’avant au coéquipier de la session (Paul 10)', c('Léo').trous === 30 && c('Hugo').trous === 20 && c('Marc').trous === 60 && c('Paul').trous === 10]);
    r.push(['jalons : l’amendement compte dans « Hectares fertilisés » (D5)', c('Léo').eng === 2 && c('Marc').eng === 2 && (JL.MV_JALONS_SERIES.find(x => x.id === 'eng') || {}).t === 'Hectares fertilisés']);
  }
  const f = n => fonction(S.T, n), fc = n => fonction(S.C, n);
  r.push(['tracteur.js importe coequipier.js et lui prête ses outils (window._trPont)', /^import '\.\/coequipier\.js';/m.test(S.T) && /chrSurf:_chrSurf, sdNorm:_sdNorm, chrTrace:_chrTrace, renderSDParcelles:renderSDParcelles, openSessionDetail:openSessionDetail/.test(S.T)]);
  r.push(['la coche note le coéquipier du moment', /window\._trStampCo\(s,s\.parcellesFaites\[s\.parcellesFaites\.length-1\]\)/.test(f('toggleSessionParcelle'))]);
  r.push(['la valeur saisie, réécrite, garde son coéquipier', /_ne\.co=_ve\.co;/.test(f('confirmerValidationChamp')) && /window\._trStampCo\(s,_ne\)/.test(f('confirmerValidationChamp'))]);
  r.push(['le chrono, quand il pose une fois, garde le coéquipier', /e\.co=o\.co;/.test(f('_chrPoserBloc')) && /window\._trStampCo\(s,e\)/.test(f('_chrPoserBloc'))]);
  r.push(['la feuille montre l’équipe et les jours', /window\.renderSDEqEncart\(\);/.test(f('openSessionDetail')) && (f('renderSDParcelles').match(/window\._sdRenderFaites\(\)/g) || []).length === 2]);
  r.push(['« Changer » fige le passé AVANT de changer, et n’écrit jamais undefined', /_trFigerCo\(s\);[^\n]*\n  if\(n\) s\.coequipier=n; else delete s\.coequipier;/.test(fc('saveSdEqChanger'))]);
  r.push(['« Corriger » signe chaque parcelle corrigée et respecte les droits', /x\.coCorr=\{par:par,le:_trAuj\(\)\}/.test(fc('saveSdEqCorriger')) && /_trPeutCorriger\(s,_trJourDe\(s,x\)\)/.test(fc('saveSdEqCorriger')) && /isAdmin\(\)\)\|\|\(_trPeutChanger\(s\)&&j===_trAuj\(\)\)/.test(fc('_trPeutCorriger'))]);
  r.push(['la page a l’encart, la feuille et les jours', ['id="sd-eq-encart"', 'id="sd-eq-overlay"', 'id="sd-eq-sheet"', 'id="sd-faites"'].every(x => S.H.includes(x))]);
  r.push(['l’accueil reconnaît le coéquipier d’un seul jour', /window\._trCoeqNoms\(s\)\.indexOf\(me\)>=0/.test(S.A)]);
  r.push(['la carte « En cours » et la fiche sur ordinateur nomment l’équipe', /\(s\.conducteur\|\|''\)\+\(s\.coequipier\?' et '\+s\.coequipier:''\)/.test(f('_trEncoursHtml')) && /data-sdeq=\\?"fiche-corr\\?"/.test(f('_trFicheHtml'))]);
  return r;
}
let ko = 0;
if (!CONTRE) {
  console.log('\n── COEQ-2 — le coéquipier, parcelle par parcelle\n');
  for (const [n, c] of await controles(S0)) { if (!c) ko++; console.log('  ' + (c ? '\x1b[32m✓\x1b[0m ' : '\x1b[31m✗\x1b[0m ') + n); }
  console.log(`\n  ${ko ? ko + ' rouge(s)' : 'tout est vert'}\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── COEQ-2 — contre-épreuve\n');
const mut = (k, a, b) => { if (!S0[k].includes(a)) throw new Error('défaut non posé : ' + a.slice(0, 50)); return { ...S0, [k]: S0[k].replace(a, b) }; };
const essais = [
  ['le coéquipier de la parcelle ignoré', () => mut('C', "return _trHas(x,'co')?String(x.co||''):", "return false?String(x.co||''):"), 'une parcelle sans'],
  ['« Changer » sans figer le passé', () => mut('C', "  _trFigerCo(s);   // ★ le passé garde le coéquipier d'avant\n", ''), '« Changer » fige'],
  ['les jalons donnent toute la session au coéquipier', () => mut('J', "      if (!cond && _mvJalCo(s, x) !== nom) return;", ''), 'jalons : chaque'],
  ['la valeur saisie efface le coéquipier', () => mut('T', "if(Object.prototype.hasOwnProperty.call(_ve,'co')) _ne.co=_ve.co;", ''), 'la valeur saisie'],
  ['le chrono efface le coéquipier', () => mut('T', "e.co=o.co;", ''), 'le chrono'],
  ['l’amendement sort des hectares fertilisés', () => mut('J', "sl === 'engrais' || sl === 'amendement'", "sl === 'engrais'"), 'jalons : l’amendement'],
];
let rates = 0;
for (const [n, fab, cible] of essais) {
  let vu = false; try { vu = (await controles(fab())).some(([x, c]) => x.startsWith(cible) && !c); } catch (e) { vu = false; }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
