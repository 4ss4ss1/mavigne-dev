/* ───────────────────────────────────────────────────────
   HARNAIS — COMPT-7 (§489) : LA CARTE DE LA RÉVISION DU PILOTAGE DIT L'ENTRETIEN LE PLUS PRESSANT
   Lancer :          node scripts/mv-harnais-compt7.mjs
   Contre-épreuves : node scripts/mv-harnais-compt7.mjs --contre

   POURQUOI IL EXISTE
   La carte ne lisait que les heures de la révision : une révision dépassée à la date, un tracteur suivi à la date seule, un
   graissage dû demain restaient muets. Ce harnais JOUE _pilGmRevision de pilotage.js : la compatibilité avec la révision aux
   heures (mv-harnais-gnr-mesure garde le reste), le rang par la date, les autres entretiens et leurs propres seuils, « aussi »,
   et le texte de chacun ; il vérifie que _pilData lit les entretiens et que la carte ne lit plus revReste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), cpt: lire('src/compteur.js'), utils: lire('src/utils.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, detail) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail !== undefined ? '  → ' + detail : '')); } };
const DATES = { '2026-11-05': '5 nov. 2026', '2026-10-20': '20 oct. 2026' };
function monde(S) {
  const ctx = { window: { _trDateAn: (iso) => DATES[iso] || iso }, _pilNum: (n) => String(n), _pilEsc: (x) => String(x) };
  vm.createContext(ctx);
  vm.runInContext(['_pilGmRevision', '_pilGmRevOrdre', '_pilGmDateAn', '_pilGmRevTxt'].map((n) => fonction(S.pil, 'function ' + n + '(')).join('\n') + '\nthis.rev=_pilGmRevision; this.txt=_pilGmRevTxt;', ctx);
  return ctx;
}
const T = { jobs: [{ id: 'EF', tid: 't2', h: 1.6, nom: 'Effeuillage' }, { id: 'SB', tid: 't2', h: 7.8, nom: 'Griffage' }, { id: 'RG', tid: 't1', h: 6, nom: 'Rognage' }, { id: 'X', tid: 't1', h: null, nom: 'Sans barème' }] };
function jouer(S) {
  const A = monde(S);
  const R1 = A.rev({ tracs: [{ id: 't9', nom: 'Loin', revReste: 3 }, { id: 't2', nom: 'Bobard', revReste: 8 }] }, T);
  t('① comme avant : la révision atteinte pendant un travail passe devant une plus proche hors travaux ; le Griffage, à 82 %', R1 && R1.t.id === 't2' && R1.it.rev && R1.dans && R1.dans.job.id === 'SB' && Math.abs(R1.dans.pc - 6.4 / 7.8) < 1e-9 && Math.abs(R1.tot - 9.4) < 1e-9, R1 && JSON.stringify([R1.t.id, R1.dans && R1.dans.job.id]));
  const R2 = A.rev({ tracs: [{ id: 't9', nom: 'NH', revReste: 3 }, { id: 't3', nom: 'Vieux', revReste: -5 }] }, T);
  t('② comme avant : dépassée d’abord ; loin et hors des travaux, aucune carte', R2 && R2.t.id === 't3' && R2.it.rang === 0 && A.rev({ tracs: [{ id: 't9', revReste: 400 }] }, T) === null);
  const R4 = A.rev({ tracs: [{ id: 't9', nom: 'NH', revReste: 400, revDate: '2026-10-20', revJours: -9 }] }, T);
  const R5 = A.rev({ tracs: [{ id: 't9', nom: 'NH', revReste: null, revDate: '2026-11-05', revJours: 7 }] }, T);
  t('③ la date compte : 400 h devant mais la date passée → dépassée ; suivi à la date seule, dû dans 7 jours → montré', R4 && R4.it.rang === 0 && R4.it.jours === -9 && R5 && R5.it.rang === 1 && R5.it.reste == null);
  const R6 = A.rev({ tracs: [{ id: 't1', nom: 'NH', revReste: 300, ents: [{ nom: 'Graissage', reste: 4, pd: null, jours: null, rouge: true, orange: false, depasse: false }] }] }, T);
  t('④ un autre entretien plus pressant prend la carte : le graissage, atteint pendant le Rognage', R6 && R6.it.nom === 'Graissage' && !R6.it.rev && R6.dans && R6.dans.job.id === 'RG' && R6.sansBareme === 1);
  const R7 = A.rev({ tracs: [{ id: 't1', nom: 'NH', revReste: 100, ents: [{ nom: 'Graissage', reste: 4, rouge: true }] }] }, T);
  t('⑤ les autres en vue sont dits : la révision à 100 h, en « aussi »', R7 && R7.it.nom === 'Graissage' && R7.aussi.length === 1 && R7.aussi[0].rev && A.txt(R7.aussi[0]) === 'r\u00e9vision dans 100 h', R7 && JSON.stringify(R7.aussi.map((x) => x.nom)));
  t('⑥ un entretien loin, sans couleur, ne fait pas de carte', A.rev({ tracs: [{ id: 't1', revReste: 400, ents: [{ nom: 'Vidange', reste: 500, rouge: false, orange: false }] }] }, T) === null);
  t('⑦ le texte de chacun : « Filtre le 5 nov. 2026 », « révision dépassée de 12 h », « date dépassée »',
    A.txt({ rev: false, nom: 'Filtre', reste: null, pd: '2026-11-05', jours: 7 }) === 'Filtre le 5 nov. 2026' && A.txt({ rev: true, reste: -12 }) === 'r\u00e9vision d\u00e9pass\u00e9e de 12 h' && A.txt({ rev: false, nom: 'Courroie', reste: 30, pd: '2026-10-20', jours: -9 }) === 'Courroie dans 30 h ou date d\u00e9pass\u00e9e');
  const a = S.pil.indexOf('  // ② La révision\n'), b = S.pil.indexOf('  // ③ La cuve', a), carte = a > 0 && b > a ? S.pil.slice(a, b) : '';
  t('⑧ la carte lit l’entretien choisi, plus revReste ; son titre le nomme ; la date et « aussi » sous la carte',
    carte && !carte.includes('revReste') && carte.includes("var t=R.t, it=R.it, rs=it.reste,") && carte.includes("<span class=\"t\">'+nomIt+' \\u00b7 '") && carte.includes('R.aussi.map(_pilGmRevTxt)') && carte.includes("(dIt&&!bigDate)"));
  t('⑨ _pilData lit les entretiens, compteur.js expose leur échéance ; l’info de la carte le dit ; la liste joue ce fichier et sa contre-épreuve',
    S.pil.includes(', ents:_ents };') && S.cpt.includes('window._trEntEtat=_trEntEtat;') && S.utils.includes("'pil.trxrev': { t: 'L\u2019entretien le plus pressant") && S.liste.indexOf("mv-harnais-compt7.mjs'") > 0 && S.liste.indexOf("mv-harnais-compt7.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].split(a).join(b) }); };
  const mutants = [
    ['la date ne compte plus dans le rang', m('pil', 'it.rang=((it.reste!=null&&it.reste<=0)||(it.jours!=null&&it.jours<0))?0:((dans||(it.jours!=null&&it.jours<=14))?1:2);', 'it.rang=((it.reste!=null&&it.reste<=0))?0:((dans)?1:2);')],
    ['les autres entretiens sont ignorés', m('pil', '(t.ents||[]).forEach(function(e){ items.push(', '([]).forEach(function(e){ items.push(')],
    ['« aussi » reste vide', m('pil', 'aussi:vus.slice(1),', 'aussi:[],')],
    ['un entretien lointain fait une carte', m('pil', 'proche:!!(e.rouge||e.orange||e.depasse)', 'proche:true')],
    ['le rang ne passe plus avant les heures', m('pil', '  if(a.rang!==b.rang) return a.rang-b.rang;\n', '')],
    ['la carte relit revReste', m('pil', 'var t=R.t, it=R.it, rs=it.reste,', 'var t=R.t, it=R.it, rs=t.revReste,')],
    ['_pilData oublie les entretiens', m('pil', ', ents:_ents };', ' };')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-compt7.mjs'").join("mv-harnais-comptW.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
