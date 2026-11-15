/* ───────────────────────────────────────────────────────
   HARNAIS — TETE-3C (§475) : « ? AIDE » RETROUVÉ, LE PILOTAGE ET LA RÉSERVE AU MÊME EN-TÊTE
   Lancer :          node scripts/mv-harnais-tete3c.mjs
   Contre-épreuves : node scripts/mv-harnais-tete3c.mjs --contre

   POURQUOI IL EXISTE
   TETE-3B (§474) a sorti la bande campagne/date des en-têtes ; l'injecteur de « ? Aide » (utils.js) ne la cherchait que DANS
   l'en-tête : le bouton a disparu de huit modules, et aucun contrôle ne l'a vu. Ce harnais garde les deux places lues par
   l'injecteur, et que le Pilotage (son en-tête JOUÉ : _pilHdrHtml exécutée, la profondeur des <div> comptée) et la Réserve
   posent leur bande APRÈS leur en-tête, où les règles communes la trouvent (sélecteurs « .mod-header + … »).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { uti: lire('src/utils.js'), pil: lire('src/pilotage.js'), rsv: lire('src/reserve.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function finBloc(s, i) { const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { d += m[1] ? -1 : 1; if (!d) return re.lastIndex; } return -1; }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function jouer(S) {
  t('① « ? Aide » cherche la bande dans l’en-tête ET juste après lui', S.uti.includes("var rows = document.querySelectorAll('.mod-header .mod-meta-row, .mod-header + .mod-meta-row');"));
  const ctx = { _mvIcon: () => '<svg></svg>', _pilEsc: (x) => String(x), _pilHa: (x) => String(x), _pilTabsHtml: () => '<div class="mvu-tabs mvu-pil" id="pil-tabs"></div>', window: { isAdmin: () => true } };
  vm.createContext(ctx); vm.runInContext(fonction(S.pil, 'function _pilHdrHtml(') + '\nthis.f = _pilHdrHtml;', ctx);
  const h = ctx.f({ domaine: 'Domaine', nActives: 12, surfTot: 11.76, saison: 'Après-vendange 2026-2027', meteo: true });
  const i = h.indexOf('<div class="mod-header h-pilotage">'), f = finBloc(h, i);
  // ★ TETE-4C (§579) : le Pilotage a pris le bandeau commun — sa bande est DANS la ligne du module, comme les neuf autres (TETE-4A) ; plus rien ne suit l'en-tête ici.
  const iTop = h.indexOf('<div class="mod-header-top">'), fTop = iTop < 0 ? -1 : finBloc(h, iTop);
  t('② le Pilotage : une seule bande campagne/date, dans la ligne du module ; l’en-tête se ferme après ses onglets', i === 0 && f === h.length && fTop > 0 && h.slice(iTop, fTop).includes('<div class="mod-meta-row mvu-meta') && (h.match(/class="mod-meta-row/g) || []).length === 1 && h.slice(fTop).startsWith('<div class="mvu-tabs mvu-pil" id="pil-tabs">'));
  // ★ TETE-4A (§577) : la bande de la Réserve est montée dans la ligne du module, comme les huit autres ; sa ligne d'écran suit l'en-tête.
  { const iB = S.rsv.indexOf("+'<div class=\"mod-meta-row mvu-meta\">'"), iT = S.rsv.indexOf("+'<div class=\"mvu-tabs mvr-tabs\">'"), iE = S.rsv.indexOf('<div class=\"mv-ecran\">');
    t('③ la Réserve : une seule bande, dans la ligne du module (TETE-4A) ; ses onglets restés dans l’en-tête, la ligne d’écran après', (S.rsv.match(/mod-meta-row mvu-meta/g) || []).length === 1 && iB > 0 && iT > iB && iE > iT); }
  t('④ les règles communes trouvent la bande où qu’elle soit (« .mod-header + … »), plus seulement sous .page', S.css.includes('.mod-header + .mod-meta-row.mvu-meta{position:relative;z-index:5;') && S.css.includes('.mod-header > .mod-header-top{padding-top:') && !S.css.includes('.page > .mod-meta-row.mvu-meta'));
  t('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-tete3c.mjs'") > 0 && S.liste.indexOf("mv-harnais-tete3c.mjs --contre'") > 0);
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
    ['« ? Aide » ne cherche plus que dans l’en-tête', m('uti', "'.mod-header .mod-meta-row, .mod-header + .mod-meta-row'", "'.mod-header .mod-meta-row'")],
    ['le Pilotage perd sa bande', m('pil', "    +'<div class=\"mod-meta-row mvu-meta'+(d.meteo?' mvu-avec-meteo':'')+'\">'", "    +'<div class=\"mod-meta-rox mvu-meta'+(d.meteo?' mvu-avec-meteo':'')+'\">'")],
    ['les onglets du Pilotage sortent de l’en-tête', m('pil', "    +'</div>'\n    +_pilTabsHtml(tab)\n    +'</div>';", "    +'</div>'\n    +'</div>'\n    +_pilTabsHtml(tab);")],
    ['une seconde bande dans la Réserve', m('rsv', "      +'<div class=\"mvu-tabs mvr-tabs\">'", "      +'<div class=\"mod-meta-row mvu-meta\"></div>'\n      +'<div class=\"mvu-tabs mvr-tabs\">'")],
    ['les règles reviennent à « .page > … »', m('css', '.mod-header + .mod-meta-row.mvu-meta{position:relative;z-index:5;', '.page > .mod-meta-row.mvu-meta{position:relative;z-index:5;')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-tete3c.mjs'").join("mv-harnais-tete3Z.mjs'") })],
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
