/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — COEQ-3 (§524) : LE TRACTEUR AU JOURNAL ; LES DEUX TUTOS DU COÉQUIPIER
   Lancer : node scripts/mv-harnais-coeq3.mjs          (le contrôle)
            node scripts/mv-harnais-coeq3.mjs --contre  (la contre-épreuve)
   `_trJournalLignes` et `_trPassagesParc` (src/coequipier.js) sont EXÉCUTÉES sur des sessions inventées : une ligne par
   session et par jour, le filtre « Qui » qui ne garde au coéquipier que SES parcelles, le traitement en lecture. Le reste est
   le câblage du journal (app.js) et des tutos (tutos.js).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const lire = f => fs.readFileSync(f, 'utf8');
const S0 = { C: lire('src/coequipier.js'), A: lire('src/app.js'), U: lire('src/tutos.js'), T: lire('src/tracteur.js') };
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0; const k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
const NOMS = ['_trCoDe', '_trIso', '_trJourDe', '_trJoursDe', '_trEqDuJour', '_trAvecTxt', '_trJournalLignes', '_trPassagesParc'];
function moteur(S) {
  const has = (S.C.match(/var _trHas=[^\n]*\n/) || [''])[0], jr = (S.C.match(/var _trJRows=\{\};\n/) || [''])[0];
  const win = { SESSIONS: [
    { id: 's1', activite: 'Tarière', conducteur: 'Marc', coequipier: 'Hugo', date: '2026-11-02', parcellesFaites: [{ nom: 'A', co: 'Léo' }, { nom: 'B', co: 'Léo' }, { nom: 'C', co: 'Hugo', d: '2026-11-03' }, { nom: 'D', co: 'Léo', d: '2026-11-03' }] },
    { id: 's2', type: 'traitement', activite: 'Traitement', conducteur: 'Paul', date: '2026-11-03', parcelles: ['A', 'C'], produits: ['Cuivre'] },
    { id: 's3', activite: 'Rognage', conducteur: 'Paul', date: '2025-07-01', parcellesFaites: [{ nom: 'A' }] }] };
  const P = { sessInSaison: s => String(s.date) >= '2026-01-01' };
  const code = has + jr + 'function _P(){ return P; }\n' + NOMS.map(n => fonction(S.C, n)).join('\n') + '\nreturn {' + NOMS.join(',') + '};';
  return new Function('window', 'P', code)(win, P);
}
function controles(S) {
  const r = []; let M = null; try { M = moteur(S); } catch (e) { M = null; }
  r.push(['les fonctions du journal s’exécutent', !!M]);
  if (M) {
    const L = M._trJournalLignes({});
    r.push(['une ligne par session et par jour, dans la saison seulement (le rognage de 2025 reste dehors)', L.length === 3 && L.filter(x => x.sid === 's1').map(x => x.date).join() === '2026-11-03,2026-11-02' && !L.some(x => x.sid === 's3')]);
    const j3 = L.find(x => x.id === 'trac:s1:2026-11-03');
    r.push(['la ligne dit qui était là ce jour-là, dans l’ordre (Hugo puis Léo)', !!j3 && j3.coeqs.join() === 'Hugo,Léo' && j3.cond === 'Marc' && j3.statut === 'Validé']);
    const LH = M._trJournalLignes({ qui: 'Hugo' });
    r.push(['filtré sur un coéquipier : seulement SES parcelles', LH.length === 1 && LH[0].parcs.map(x => x.nom).join() === 'C']);
    r.push(['filtré sur le conducteur : toutes ses parcelles', M._trJournalLignes({ qui: 'Marc' }).reduce((t, x) => t + x.parcs.length, 0) === 4]);
    r.push(['filtré sur une parcelle, une date, une recherche', M._trJournalLignes({ parcelle: 'B' }).length === 1 && M._trJournalLignes({ deb: '2026-11-03' }).length === 2 && M._trJournalLignes({ q: 'cuivre' }).length === 1 && M._trJournalLignes({ tache: 'Rognage' }).length === 0]);
    const tr = L.find(x => x.trait);
    r.push(['le traitement passe en lecture : son applicateur, ses produits, ses parcelles', !!tr && tr.cond === 'Paul' && tr.produits.join() === 'Cuivre' && tr.parcs.length === 2 && tr.coeqs.length === 0]);
    const pa = M._trPassagesParc('A');
    r.push(['les passages d’une parcelle : le tracteur avec son équipe, le traitement', pa.some(x => x.tache === 'Tarière' && x.qui === 'Marc et Léo' && x.date === '2026-11-02') && pa.some(x => x.tache === 'Traitement' && x.qui === 'Paul')]);
  }
  const lj = fonction(S.A, 'renderJournalList');
  r.push(['le journal ne montre plus la ligne d’amendement doublon (`auTracteur`)', /if\(r\.auTracteur\)return false;/.test(lj)]);
  r.push(['le filtre « Qui » prend toute l’équipe d’une validation', /\(_jFaitPar\(r\)\|\|\[\]\)\.indexOf\(jQui\)<0/.test(lj)]);
  r.push(['le journal ajoute les lignes du tracteur et les dessine', /window\._trJournalLignes\(\{qui:jQui,tache:jTache,parcelle:jParcelle,deb:jDateDeb,fin:jDateFin,q:jSearch\}\)/.test(lj) && /if\(r\.trac&&typeof window\._trJournalCarte==='function'\)return window\._trJournalCarte\(r,hasNext\);/.test(lj)]);
  r.push(['la fiche sur ordinateur sait lire une ligne du tracteur', /window\._trJournalFiche\(r\)/.test(fonction(S.A, '_jFicheHtml')) && /window\._trJournalRow\(_jSelId\)/.test(fonction(S.A, '_jMontre'))]);
  r.push(['« Derniers passages » de la parcelle lit le tracteur', /window\._trPassagesParc\(p\.nom\)/.test(fonction(S.A, '_pFicheHtml'))]);
  r.push(['deux tutos : changer et corriger le coéquipier, sur une session à deux d’entraînement', /id: 'coeq-changer'/.test(S.U) && /id: 'coeq-corriger'/.test(S.U) && /couvre: \['openSdEqChanger', 'saveSdEqChanger'\]/.test(S.U) && /window\.applyFbData\('sessions', _tuSessions\(\)\)/.test(S.U) && /data-tuto="trac\.encours\.av"/.test(S.T)]);
  return r;
}
let ko = 0;
if (!CONTRE) {
  console.log('\n── COEQ-3 — le tracteur au journal, les tutos du coéquipier\n');
  for (const [n, c] of controles(S0)) { if (!c) ko++; console.log('  ' + (c ? '\x1b[32m✓\x1b[0m ' : '\x1b[31m✗\x1b[0m ') + n); }
  console.log(`\n  ${ko ? ko + ' rouge(s)' : 'tout est vert'}\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── COEQ-3 — contre-épreuve\n');
const mut = (k, a, b) => { if (!S0[k].includes(a)) throw new Error('défaut non posé : ' + a.slice(0, 50)); return { ...S0, [k]: S0[k].replace(a, b) }; };
const essais = [
  ['le coéquipier filtré voit toute la session', () => mut('C', "(!tr&&_trCoDe(s,x)===qui)", "!tr"), 'filtré sur un coéquipier'],
  ['le journal remontre le doublon d’amendement', () => mut('A', "    if(r.auTracteur)return false;", ''), 'le journal ne montre plus'],
  ['le filtre « Qui » ne lit plus que l’auteur', () => mut('A', "&&(_jFaitPar(r)||[]).indexOf(jQui)<0)return false;", ")return false;"), 'le filtre « Qui »'],
  ['le traitement perd ses produits', () => mut('C', "produits:tr?(s.produits||[]):[]", "produits:[]"), 'le traitement passe'],
  ['les passages oublient le coéquipier', () => mut('C', "qui:(s.conducteur||'')+(c?' et '+c:'')", "qui:(s.conducteur||'')"), 'les passages'],
];
let rates = 0;
for (const [n, fab, cible] of essais) { let vu = false; try { vu = controles(fab()).some(([x, c]) => x.startsWith(cible) && !c); } catch (e) { vu = false; } if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); } }
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
