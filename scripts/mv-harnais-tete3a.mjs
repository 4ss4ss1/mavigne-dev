/* ───────────────────────────────────────────────────────
   HARNAIS — TETE-3A (§473) : L'EN-TÊTE QUI SE REPLIE AU TÉLÉPHONE (docs/maquettes/maquette-ux-v1.html, partie 1)
   Lancer :          node scripts/mv-harnais-tete3a.mjs
   Contre-épreuves : node scripts/mv-harnais-tete3a.mjs --contre

   POURQUOI IL EXISTE
   Un en-tête qui se replie au mauvais moment cache ce qu'on vient chercher : un tuto qui fait défiler vers un onglet, un test
   qui clique dessus. Ce harnais JOUE _mvRepliMaj (extraite d'app.js) sur une horloge et un défilement posés : un défilement
   programmé ne replie pas ; un défilement de la main vers le bas, passé 140 px (REGL-UX-1, §504), replie ; remonter ou revenir en haut déplie ;
   sur ordinateur, jamais. Il garde la règle CSS (la bande et les onglets cachés, une ligne de 44 px), et le geste de molette
   que test:ux envoie avant de faire défiler — sans lui, la mesure « en défilant » ne verrait jamais l'en-tête replié.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), css: lire('src/styles.css'), ux: lire('scripts/mv-ux-rendu.mjs'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, tel) {
  const cls = new Set(); let now = 100000;
  const ctx = { _mvRepliY: 0, _mvRepliGeste: 0, _mvRepliGel: 0, Date: { now: () => now }, document: { body: { classList: { add: (x) => cls.add(x), remove: (x) => cls.delete(x), contains: (x) => cls.has(x) } }, documentElement: { scrollTop: 0 } },
    window: { scrollY: 0, matchMedia: () => ({ matches: tel }) } };
  vm.createContext(ctx); vm.runInContext(fonction(S.app, 'function _mvRepliMaj(') + '\n' + fonction(S.app, 'function _mvRepliArme(') + '\nthis.maj = _mvRepliMaj; this.arme = _mvRepliArme;', ctx);
  const aller = (y, geste, pas) => { now += (pas || 400); if (geste) ctx.arme(); now += 10; ctx.window.scrollY = y; ctx.maj(); return cls.has('mv-replie'); };
  return { aller };
}
function jouer(S) {
  const A = monde(S, true);
  t('① un défilement programmé (tuto, test, scrollIntoView) ne replie pas', A.aller(400, false) === false);
  const E = monde(S, true); E.aller(30, true);
  t('① un petit geste près du haut (sous 140 px : l’ancrage du repli ne doit pas retomber sous 24 px) ne replie pas', E.aller(60, true) === false && E.aller(130, true) === false);
  const B = monde(S, true); B.aller(30, true);
  t('① un défilement de la main vers le bas, passé 140 px, replie', B.aller(200, true) === true);
  const F = monde(S, true); F.aller(30, true); F.aller(300, true);
  t('① le saut de l’ancrage juste après le repli (−54 px en 50 ms) ne déplie pas', F.aller(246, true, 40) === true);
  t('① remonter de quelques pixels déplie', B.aller(180, true) === false);
  const C = monde(S, true); C.aller(300, true); C.aller(400, true);
  t('① revenir en haut déplie, même sans geste', C.aller(10, false) === false);
  const D = monde(S, false); D.aller(100, true);
  t('① sur ordinateur, jamais (la règle de l’ordinateur viendra avec TETE-3C)', D.aller(500, true) === false);
  t('② la ligne repliée : la bande campagne/date et les onglets cachés, une ligne de 44 px, au téléphone seulement',
    S.css.includes('@media (max-width:767.98px){\n  body.mv-replie .page.active .mod-header{padding-top:0;padding-bottom:0;cursor:pointer;}')
    && S.css.includes('body.mv-replie .page.active .mod-header > .mvu-tabs{display:none;}')   /* TETE-3B (§474) : la bande campagne/date est sortie de l’en-tête, elle défile */ && S.css.includes('body.mv-replie .page.active .mod-header .mod-header-top{min-height:44px;margin-bottom:0;}'));
  t('② un appui sur la ligne la déplie (hors boutons), et seuls molette et doigt arment le repli',
    /e\.target\.closest\('\.page\.active \.mod-header'\)&&!e\.target\.closest\('button,a,input,select'\)\) b\.classList\.remove\('mv-replie'\)/.test(S.app)
    && S.app.includes("window.addEventListener('wheel',_mvRepliArme,{passive:true});") && S.app.includes("window.addEventListener('touchmove',_mvRepliArme,{passive:true});"));
  t('③ test:ux fait défiler comme la main (six pas, une molette à chaque pas)', /for \(let k = 1; k <= 6; k\+\+\) \{ window\.dispatchEvent\(new WheelEvent\('wheel'/.test(S.ux));
  t('④ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-tete3a.mjs'") > 0 && S.liste.indexOf("mv-harnais-tete3a.mjs --contre'") > 0);
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
    ['un défilement programmé replie aussi', m('app', 'if(Date.now()-_mvRepliGeste<2500){', 'if(true){')],
    ['le repli part dès le premier pixel', m('app', 'if(d>6&&y>140&&!replie){', 'if(d>0&&!replie){')],
    ['le seuil retombe à 72 px (l’ancrage ramène sous 24 px)', m('app', 'if(d>6&&y>140&&!replie){', 'if(d>6&&y>72&&!replie){')],
    ['remonter ne déplie plus', m('app', "else if(d<-6&&replie){ b.classList.remove('mv-replie'); _mvRepliGel=Date.now()+350; }", '')],
    ['plus de gel après un changement (l’ancrage fait osciller l’en-tête)', m('app', 'if(Date.now()<_mvRepliGel){ _mvRepliY=y; return; }', '')],
    ['l’ordinateur se replie aussi', m('app', "if(!tel||y<24){", 'if(y<24){')],
    ['les onglets ne se cachent plus', m('css', 'body.mv-replie .page.active .mod-header > .mvu-tabs{display:none;}', 'body.mv-replie .page.active .mod-header > .zz{display:none;}')],
    ['test:ux reprend le défilement programmé seul', m('ux', "window.dispatchEvent(new WheelEvent('wheel', { deltaY: y > y0 ? 1 : -1 })); ", '')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-tete3a.mjs'").join("mv-harnais-tete3Z.mjs'") })],
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
