/* ───────────────────────────────────────────────────────
   HARNAIS — PHY-UX-1 (§502) : LE REGISTRE PHYTO SE LIT DANS LES RANGS (docs/maquettes/maquette-ux-v2.html, Phyto)
   Lancer :          node scripts/mv-harnais-phyux1.mjs
   Contre-épreuves : node scripts/mv-harnais-phyux1.mjs --contre

   POURQUOI IL EXISTE
   Le registre écrivait « 2026-09-08 » et un badge « Réentrée nh » compté depuis minuit. Ce harnais JOUE les vraies fonctions
   (extraites de tracteur.js), à heure fixée : la date dite (« aujourd'hui, 6 h 30 », « hier », « 8 sept. 2026 », le 1er),
   l'état de la rentrée calculé comme l'Accueil (l'heure de fin, sinon de début, sinon midi, plus le délai), « interdite
   jusqu'à … » puis « libre depuis … », le biocontrôle sans délai, le cuivre de l'année (la parcelle la plus chargée, sur le
   plafond), la ligne échappée ; il garde la ligne du registre branchée, l'étiquette à 12, le badge minuit retiré.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { tr: lire('src/tracteur.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, tr) {
  const ctx = { TRAITEMENTS: tr, window: { _cuPlafond: () => 4 }, _escHtml: (x) => String(x).replace(/</g, '&lt;'), _escAttr: (x) => String(x), dreEffectif: (h) => ({ h: Number(h) || 0 }) };
  const i = S.tr.indexOf('var _PH_MOIS='); const mois = S.tr.slice(i, S.tr.indexOf(';', i) + 1);
  vm.createContext(ctx); vm.runInContext(mois + '\n' + ['function _phJours(', 'function _phHeureFr(', 'function _phDateFr(', 'function _phQuandFr(', 'function _phEtatRentree(', 'function _phF1(', 'function _phCuivreCumul(', 'function _phCuivreTxt(', 'function _phCuivreAn(', 'function _phEtatHtml('].map((d) => fonction(S.tr, d)).join('\n')
    + '\nthis.date=_phDateFr; this.etat=_phEtatRentree; this.cu=_phCuivreTxt; this.cuAn=_phCuivreAn; this.html=_phEtatHtml;', ctx);
  return ctx;
}
function jouer(S) {
  const now = new Date(2026, 9, 26, 10, 40);   // lundi 26 octobre 2026, 10 h 40
  const C = monde(S, [{ date: '2026-10-25', parcelles: ['Clos du Moulin', 'Les Charmes'], cuMetal: 1.1 }, { date: '2026-06-02', parcelles: ['Clos du Moulin'], cuMetal: 1.8 }, { date: '2025-06-02', parcelles: ['Clos du Moulin'], cuMetal: 3 }]);
  t('① la date se dit : « aujourd’hui, 6 h 30 », « hier, 18 h 05 », « 8 sept. 2026 », « 1er août 2026 »', C.date({ date: '2026-10-26', heureFin: '06:30' }, now) === 'aujourd’hui, 6 h 30' && C.date({ date: '2026-10-25', heureDebut: '18:05' }, now) === 'hier, 18 h 05'
    && C.date({ date: '2026-09-08' }, now) === '8 sept. 2026' && C.date({ date: '2026-08-01' }, now) === '1er août 2026');
  const a = C.etat({ date: '2026-10-25', heureFin: '18:30' }, { drae: 24 }, now), b = C.etat({ date: '2026-09-08' }, { drae: 24 }, now);
  t('② la rentrée : « interdite jusqu’à aujourd’hui 18 h 30 » (fin 18 h 30 + 24 h) ; « libre depuis le 9 sept. » (midi + 24 h)', a.k === 'interdite' && a.txt === 'rentrée interdite jusqu’à aujourd’hui 18 h 30' && b.k === 'libre' && b.txt === 'rentrée libre depuis le 9 sept.');
  t('② sans délai : le biocontrôle le dit ; un autre produit aussi', C.etat({ date: '2026-08-11' }, { drae: 0, type: 'Biocontrôle' }, now).txt === 'biocontrôle, sans délai' && C.etat({ date: '2026-08-11' }, { drae: 0, type: 'Adjuvant' }, now).txt === 'sans délai de rentrée');
  // MOTS-15 (§610) : la ligne d’un traitement dit sa dose ; le cumul de l’année (le même calcul) passe sur la ligne de l’année.
  t('③ le cuivre : la dose sur le traitement ; sur l’année, le cumul de la parcelle la plus chargée, sur le plafond (2025 ne compte pas)', C.cu(C.TRAITEMENTS[0]) === 'cuivre\u00a0: 1,1 kg Cu/ha' && C.cu({ date: '2026-08-11', cuMetal: 0 }) === ''
    && C.cuAn('2026', C.TRAITEMENTS.slice(0, 2)) === 'cuivre 2,9 sur 4 kg/ha' && C.cuAn('2025', C.TRAITEMENTS.slice(2)) === 'cuivre 3 sur 4 kg/ha' && C.cuAn('2026', [{ date: '2026-08-11', cuMetal: 0 }]) === '');
  const h = C.html({ k: 'interdite', txt: 'rentrée <b>' }, 'cuivre');
  t('③ la ligne d’état est échappée, sa classe dit l’état ; le cuivre à part, sans la couleur de la rentrée (MOTS-15)', h === '<div class="ph-etat"><span class="ph-etat-interdite">rentrée &lt;b></span> · <span class="ph-cu">cuivre</span></div>' && C.html(null, '') === ''
    && C.html(null, 'cuivre') === '<div class="ph-etat"><span class="ph-cu">cuivre</span></div>');
  t('④ la ligne du registre : la date dite, l’étiquette au jeton nano (12 au téléphone, LISIBLE-1), l’état posé au bout ; plus de badge compté depuis minuit', S.tr.includes('${_escHtml(_phDateFr(t,now))}') && S.tr.includes('font-size:var(--pt-nano,11px);font-weight:700;padding:2px 8px;border-radius:7px;background:${tb}') && S.tr.includes('${_phEtatHtml(_et,_cu)}') && !S.tr.includes('Réentrée \'+draeR'));
  t('④ les couleurs : interdite en danger, libre en vert ; la liste joue ce fichier', S.css.includes('.ph-etat-interdite{color:var(--danger-texte,#BA361A);}') && S.css.includes('.ph-etat-libre{color:var(--ok-texte,#217343);}') && S.liste.indexOf("mv-harnais-phyux1.mjs'") > 0 && S.liste.indexOf("mv-harnais-phyux1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['l’heure de fin oubliée (midi partout)', m('tr', "var hm=String(t.heureFin||t.heureDebut||'12:00').split(':');", "var hm='12:00'.split(':');")],
    ['« interdite » et « libre » inversés', m('tr', "return fin>now ? { k:'interdite'", "return fin<now ? { k:'interdite'")],
    ['le cuivre compte l’année d’avant', m('tr', "return x&&String(x.date||'').slice(0,4)===an&&parseFloat(x.cuMetal)>0", "return x&&parseFloat(x.cuMetal)>0")],
    ['la ligne d’état n’est plus échappée', m('tr', "'+_escHtml(et.txt)+'</span>'", "'+et.txt+'</span>'")],
    ['le cuivre reprend la couleur de la rentrée', m('tr', "(et?' \\u00b7 ':'')+'<span class=\"ph-cu\">'", "(et?' \\u00b7 ':'')+'<span class=\"ph-etat-'+(et?et.k:'')+'\">'")],
    ['la date redevient machine', m('tr', '${_escHtml(_phDateFr(t,now))}', '${_escHtml(t.date)}')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-phyux1.mjs'").join("mv-harnais-phyuxZ.mjs'") })],
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
