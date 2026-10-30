/* ───────────────────────────────────────────────────────
   HARNAIS — RSV-UX-1 (§495) : LA RÉSERVE — UNE ACTION PRINCIPALE, L'ÉTAT VIDE QUI DIT QUOI FAIRE (docs/maquettes/maquette-ux-v2.html)
   Lancer :          node scripts/mv-harnais-rsvux1.mjs
   Contre-épreuves : node scripts/mv-harnais-rsvux1.mjs --contre

   POURQUOI IL EXISTE
   Mesuré par la maquette : premier écran = une carte vide, puis la pyramide ; aucun « + ». Ce harnais JOUE _rsvMvtVa (extraite
   de reserve.js) : chaque ligne de « Nouveau mouvement » ferme la feuille et ouvre SON formulaire existant (achat, fûts neufs,
   se séparer, inventaire, ouillage), une clé inconnue n'ouvre rien ; il garde le « + » réservé à l'admin, ses cinq lignes, la
   pyramide passée devant la part des anges, la part des anges vide en une ligne avec « Saisir », les formulaires exposés.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { rsv: lire('src/reserve.js'), cave: lire('src/cave.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function jouer(S) {
  const ouverts = []; const cls = new Set(['mvr-mvt-ouvert']);
  const ctx = { window: {}, document: { body: { classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c) } } } };
  ['_rsvOpenAchat', '_rsvOpenFut', '_rsvOpenSep', '_rsvOpenInv', 'openOvCaveOp'].forEach((f) => { ctx.window[f] = () => ouverts.push(f); });
  const i = S.rsv.indexOf('var _RSV_MVT='); const tab = S.rsv.slice(i, S.rsv.indexOf(';', i) + 1);
  vm.createContext(ctx); vm.runInContext(tab + '\n' + fonction(S.rsv, 'function _rsvMvtFermer(') + '\n' + fonction(S.rsv, 'function _rsvMvtVa(') + '\nthis.va=_rsvMvtVa;', ctx);
  ['achat', 'futs', 'sep', 'inv', 'ouill'].forEach((m) => ctx.va(m));
  t('① chaque ligne ouvre son formulaire existant — achat, fûts neufs, se séparer, inventaire, ouillage — et ferme la feuille', ouverts.join() === '_rsvOpenAchat,_rsvOpenFut,_rsvOpenSep,_rsvOpenInv,openOvCaveOp' && !cls.has('mvr-mvt-ouvert'));
  const avant = ouverts.length; ctx.va('nimporte'); t('① une clé inconnue n’ouvre rien', ouverts.length === avant);
  t('② le « + » réservé à l’admin ; la feuille porte ses cinq lignes, chacune lue dans data-m', S.rsv.includes("var _fab=(typeof isAdmin==='function'&&isAdmin())?'<button type=\"button\" class=\"mvr-fab\" id=\"mvr-fab\" onclick=\"_rsvMvt()\"")
    && ['achat', 'futs', 'sep', 'inv', 'ouill'].every((m) => S.rsv.includes('data-m="' + m + '" onclick="_rsvMvtVa(this.dataset.m)"')) && S.rsv.includes("page.innerHTML=head+'<div id=\"mvr-body\" class=\"mvr-body\"></div>'+_fab;"));
  t('② les cinq formulaires sont exposés', ['_rsvOpenAchat', '_rsvOpenFut', '_rsvOpenSep', '_rsvOpenInv'].every((f) => new RegExp('window\\.' + f + ' *=').test(S.rsv)) && /window\.openOvCaveOp *=/.test(S.cave));
  const v = fonction(S.cave, 'function _pcavVueParc(');
  t('③ la pyramide passe devant la part des anges', v.indexOf('_pcavPyramide(c)') > 0 && v.indexOf('_pcavPyramide(c)') < v.indexOf('_pcavAngesCard(c)'));
  t('③ la part des anges vide : une ligne et « Saisir » (le formulaire d’ouillage)', S.cave.includes('<div class="pcav-vide pcav-vide1"><span>Aucun ouillage saisi sur douze mois') && S.cave.includes('onclick="openOvCaveOp()">Saisir</button></div>') && !S.cave.includes('Renseignez le volume total'));
  t('④ au téléphone, le « + » et la feuille ; les rangées de 48 px', S.css.includes('#page-reserve .mvr-fab{display:flex;') && S.css.includes('body.mvr-mvt-ouvert #page-reserve .mvr-mvt{display:block;') && S.css.includes('.mvr-mvt-l{display:flex;flex-direction:column;justify-content:center;width:100%;min-height:48px;'));
  t('⑤ exposées ; la liste joue ce fichier et sa contre-épreuve', S.rsv.includes('window._rsvMvt=_rsvMvt; window._rsvMvtFermer=_rsvMvtFermer; window._rsvMvtVa=_rsvMvtVa;') && S.liste.indexOf("mv-harnais-rsvux1.mjs'") > 0 && S.liste.indexOf("mv-harnais-rsvux1.mjs --contre'") > 0);
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
    ['« Fûts neufs » ouvre l’achat', m('rsv', "futs:'_rsvOpenFut'", "futs:'_rsvOpenAchat'")],
    ['la feuille reste ouverte', m('rsv', 'function _rsvMvtVa(m){\n  _rsvMvtFermer();', 'function _rsvMvtVa(m){')],
    ['le « + » pour tout le monde', m('rsv', "var _fab=(typeof isAdmin==='function'&&isAdmin())?", 'var _fab=true?')],
    ['la part des anges repasse devant', m('cave', "  if(c.parc){ try{ h+=_pcavPyramide(c)||''; }catch(e){ _pcavLog('pyramide',e); } }\n  try{ h+=_pcavAngesCard(c)||''; }catch(e){ _pcavLog('angescard',e); }", "  try{ h+=_pcavAngesCard(c)||''; }catch(e){ _pcavLog('angescard',e); }\n  if(c.parc){ try{ h+=_pcavPyramide(c)||''; }catch(e){ _pcavLog('pyramide',e); } }")],
    ['la part des anges vide sans « Saisir »', m('cave', 'onclick="openOvCaveOp()">Saisir</button></div>', '></div>')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-rsvux1.mjs'").join("mv-harnais-rsvuxZ.mjs'") })],
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
