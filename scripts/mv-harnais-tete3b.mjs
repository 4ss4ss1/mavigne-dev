/* ───────────────────────────────────────────────────────
   HARNAIS — TETE-3B (§474) : L'EN-TÊTE AU REPOS, UNE BANDE ET UN SEGMENT (docs/maquettes/maquette-ux-v1.html, partie 1)
   Lancer :          node scripts/mv-harnais-tete3b.mjs
   Contre-épreuves : node scripts/mv-harnais-tete3b.mjs --contre

   POURQUOI IL EXISTE
   L'en-tête collant portait trois bandes (178 px au téléphone). Ce lot sort la bande campagne/date de l'en-tête — une ligne
   juste dessous, qui défile (choix de Nico, 28/10) — et fait des onglets un segment en texte seul ; dans la Vigne, le titre
   dit la page. Ce harnais garde la STRUCTURE (lue dans index.html, bloc par bloc : aucune bande dans un en-tête, chacune
   juste après le sien), les titres et sous-titres de la Vigne, le segment, et la bande lisible sur le fond de la page.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { html: lire('index.html'), css: lire('src/styles.css'), app: lire('src/app.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
const MODS = ['h-home', 'h-parcelles', 'h-journal', 'h-tracteur', 'h-phyto', 'h-reglages', 'h-planning', 'h-cave'];
function bloc(s, i) { const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { d += m[1] ? -1 : 1; if (!d) return re.lastIndex; } return -1; }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function jouer(S) {
  const r = MODS.map((c) => { const i = S.html.indexOf('<div class="mod-header ' + c + '">'); if (i < 0) return { c, ok: false }; const f = bloc(S.html, i);
    const dedans = S.html.slice(i, f).includes('mod-meta-row'); const apres = S.html.slice(f, f + 260).includes('<div class="mod-meta-row mvu-meta">');
    const onglets = /<div class="mvu-tabs"/.test(S.html.slice(i, f)); return { c, ok: !dedans && apres && onglets }; });
  t('① les huit en-têtes : aucune bande campagne/date dedans, chacune juste après le sien ; les onglets restent dans l’en-tête', r.every((x) => x.ok));
  t('② la Vigne : le titre dit la page — Accueil, Parcelles, Journal', ['Accueil', 'Parcelles', 'Journal'].every((n, k) => { const c = ['h-home', 'h-parcelles', 'h-journal'][k]; const i = S.html.indexOf('<div class="mod-header ' + c + '">'); return new RegExp('<div class="mod-header-title"[^>]*>' + n + '</div>').test(S.html.slice(i, bloc(S.html, i))); }));
  t('② le sous-titre dit « Vigne », puis ce que la page ajoute (les identifiants que le code écrit restent)', ['hv2-header-sub', 'p-saison-sub', 'j-sub'].every((id) => S.html.includes('<div class="mod-header-sub"><span class="mod-header-mod">Vigne</span><span id="' + id + '">'))
    && S.css.includes(".mod-header-mod + span:not(:empty)::before{content:'\\00a0\\00b7\\00a0';}") && S.app.includes("document.getElementById('p-saison-sub').textContent='';"));
  t('③ les onglets de l’en-tête : un segment arrondi, des options de 36 px, texte seul', S.css.includes('.mod-header > .mvu-tabs{gap:4px;padding:3px;margin:6px 0 6px;') && S.css.includes('.page > .mod-header > .mod-header-top{padding-top:calc(env(safe-area-inset-top,0px) + 8px)!important;padding-bottom:4px!important;margin-bottom:0;min-height:44px!important;}') && S.css.includes('border-radius:var(--r-full,999px);}\n.mod-header > .mvu-tabs .mvu-tab{min-height:36px;padding:7px 12px;border-radius:var(--r-full,999px);}') && S.css.includes('.mod-header > .mvu-tabs .mvu-tab-em{display:none;}'));
  t('④ la bande sur le fond de la page : au-dessus des cartes (menu des campagnes), pastille, date et mini-météo lisibles', S.css.includes('.page > .mod-meta-row.mvu-meta{position:relative;z-index:5;') && S.css.includes('.page > .mod-meta-row.mvu-meta .hv2-saison-pill{background:var(--bg-card,#FFFFFF);border:1px solid var(--ligne,#E7E6E2);color:var(--texte,#1B1A18);}')
    && S.css.includes('.page > .mod-meta-row.mvu-meta .hv2-date{color:var(--texte-doux,#686660)!important;}') && S.css.includes('.page > .mod-meta-row.mvu-meta .hv2-meteo-mini-temp{color:var(--texte,#1B1A18);}'));
  t('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-tete3b.mjs'") > 0 && S.liste.indexOf("mv-harnais-tete3b.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const remet = (S) => { const i = S.html.indexOf('<div class="mod-header h-cave">'); const f = bloc(S.html, i); const k = S.html.indexOf('<div class="mod-meta-row mvu-meta">', f); const g = bloc(S.html, k);
    const row = S.html.slice(k, g); const sans = S.html.slice(0, k) + S.html.slice(g); const top = sans.indexOf('<div class="mvu-tabs"', i); return Object.assign({}, S, { html: sans.slice(0, top) + row + sans.slice(top) }); };
  const mutants = [
    ['la bande de la Cave revient dans l’en-tête', remet],
    ['le Journal reprend « Vigne » pour titre', (S) => Object.assign({}, S, { html: S.html.replace(/(<div class="mod-header h-journal">[\s\S]*?<div class="mod-header-title"[^>]*>)Journal(<\/div>)/, '$1Vigne$2') })],
    ['Parcelles se redit dans son sous-titre', m('app', "document.getElementById('p-saison-sub').textContent='';", "document.getElementById('p-saison-sub').textContent='Parcelles';")],
    ['les icônes reviennent dans les onglets', m('css', '.mod-header > .mvu-tabs .mvu-tab-em{display:none;}', '')],
    ['la bande repasse sous les cartes (le menu des campagnes caché)', m('css', '.page > .mod-meta-row.mvu-meta{position:relative;z-index:5;', '.page > .mod-meta-row.mvu-meta{')],
    ['la pastille reste blanche sur fond clair', m('css', '.page > .mod-meta-row.mvu-meta .hv2-saison-pill{background:var(--bg-card,#FFFFFF);border:1px solid var(--ligne,#E7E6E2);color:var(--texte,#1B1A18);}', '')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-tete3b.mjs'").join("mv-harnais-tete3Z.mjs'") })],
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
