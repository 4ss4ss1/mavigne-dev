/* ───────────────────────────────────────────────────────
   HARNAIS — LISIBLE-1 (§470) : LES TEXTES ET LES CIBLES COMME LA MAQUETTE (maquette-ux-v1, partie 3), ET LA DÉCISION DU 26/09 TENUE
   Lancer :          node scripts/mv-harnais-lisible1.mjs
   Contre-épreuves : node scripts/mv-harnais-lisible1.mjs --contre

   POURQUOI IL EXISTE
   Le cliquet au rendu (npm run test:ux, §459/§467) dit COMBIEN de textes et de cibles sont trop petits ; il ne dit pas LESQUELS
   reviendraient si une règle était défaite, ni si l'écran suit sa maquette. Ce harnais garde, dans les sources, chaque réglage de
   LISIBLE-1 : le plancher de texte (11 px partout, 12 au téléphone, par le seul jeton --pt-nano), les initiales du Journal dans
   un rond de 28 — deux au plus, puis « +N » (la fonction _jAvas EXÉCUTÉE) —, la ligne d'heures du Planning à 12 px tronquée, les
   cinq cibles agrandies, la zone de 44 px des boutons « discrets » et secondaires, les jours de la Cave à 44 px — et la décision de
   Nico du 26/09, reconfirmée le 26/10 : les puces, les bulles « i » et la roue gardent leur taille.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { css: lire('src/styles.css'), charte: lire('src/charte.css'), html: lire('index.html'), app: lire('src/app.js'), reserve: lire('src/reserve.js'), tracteur: lire('src/tracteur.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
const N = 'font-size:var(--pt-nano,11px)';
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
/* _jAvas jouée pour de bon : un auteur seul, une équipe de quatre, un doublon, une validation par un autre. */
function avas(S) {
  const ctx = { MEMBRES: [{ nom: 'Marie', couleur: '#2E7D32' }, { nom: 'Sophie', couleur: '#C9A84C' }], COULEURS_MBR: {}, _escHtml: (x) => String(x).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';'),
    _jFaitPar: (r) => (r.faitPar || []) };
  vm.createContext(ctx); vm.runInContext(fonction(S.app, 'function _jAvas(') + '\nthis.f = _jAvas;', ctx);
  const ronds = (h) => (h.match(/class="java"/g) || []).length, plus = (h) => { const m = /class="java java-plus">\+(\d+)</.exec(h); return m ? +m[1] : 0; };
  const seul = ctx.f({ qui: 'Marie' }, '#2E7D32'), eq4 = ctx.f({ equipe: true, qui: 'Marie', membresEquipe: ['Sophie', 'Paul', 'Léa'] }, '#2E7D32'),
    dbl = ctx.f({ equipe: true, qui: 'Marie', membresEquipe: ['Marie', 'Sophie'] }, '#2E7D32'), hors = ctx.f({ quiHors: true, qui: 'Admin', faitPar: ['Sophie', 'Paul'] }, '#888');
  return { seul, eq4, dbl, hors, ronds, plus };
}
function jouer(S) {
  t('① le plancher de texte au téléphone : --pt-nano à 12 px sous 768 px, dans la charte (11 px sur ordinateur)', S.charte.includes('@media (max-width:767.98px){ :root{ --pt-nano:12px; } }') && /--pt-nano:11px;/.test(S.charte));
  t('② les initiales du Journal : 11 px (12 au téléphone) dans un rond de 28, bordé, les ronds qui se chevauchent',
    S.css.includes('.java{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;' + N + ';font-weight:600;color:white;flex-shrink:0;border:2px solid var(--bg-card);}')
    && S.css.includes('.java-grp .java + .java{margin-left:-8px;}') && S.css.includes('.java.java-plus{background:var(--acier);}'));
  const A = avas(S);
  t('② deux ronds au plus, puis « +N » : un auteur → 1 rond ; une équipe de quatre → 2 ronds et « +2 » ; un doublon compté une fois ; validé par un autre → ceux qui ont fait',
    A.ronds(A.seul) === 1 && A.plus(A.seul) === 0 && A.ronds(A.eq4) === 2 && A.plus(A.eq4) === 2 && A.ronds(A.dbl) === 2 && A.plus(A.dbl) === 0
    && A.ronds(A.hors) === 2 && />S</.test(A.hors) && />P</.test(A.hors) && A.seul.includes('aria-hidden="true"'));
  t('② la ligne du Journal pose les ronds par _jAvas', S.app.includes('<div class="jmeta">${_jAvas(r, col)}<span'));
  t('③ la ligne d’heures du Planning (« 173h / 152h ») : 12 px, tronquée plutôt qu’entière à 9', S.css.includes('.pl2-name-s{display:block;font-size:var(--pt-micro,12px);color:var(--texte-doux);font-variant-numeric:lining-nums tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'));
  t('④ les avatars des filtres, l’étiquette d’équipe, le chiffre de la synchronisation : 11 px',
    S.css.includes('.oava{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;' + N + ';') && S.css.includes('.pv-team-lbl{' + N + ';') && S.css.includes('.mv-syncdot .mvs-cnt{background:#E0922C;color:#231203;' + N + ';'));
  t('④ l’échelle de la campagne (Réglages) et la priorité du moment : 11 px', S.html.includes('.cmp-scale{position:relative;height:15px;' + N + ';') && S.html.includes('margin-left:2px;font-size:inherit}') && S.html.includes('<div style="' + N + ';font-weight:700;color:#7A5C10;margin-bottom:3px">Priorité du moment</div>'));
  t('④ l’unité de la Réserve et l’étiquette du registre : 11 px', S.reserve.includes('.mvr-u{' + N + ';') && S.tracteur.includes('<span style="' + N + ';font-weight:700;padding:2px 8px;border-radius:7px;'));
  const i = S.css.indexOf('/* ═══ LISIBLE-1 (§470)'); const bloc = i >= 0 ? S.css.slice(i, i + 2600) : '';
  t('⑤ la zone de 44 px des boutons « discrets » et secondaires et de « Pourquoi ? », dessin inchangé (décision du 26/10)',
    bloc.includes(':where(.mvbtn-discret, .mvbtn-secondaire, .mv-pq, #priority-edit-btn){ position:relative; }') && bloc.includes(".mvbtn-discret::after, .mvbtn-secondaire::after, .mv-pq::after{ content:''; position:absolute; left:0; right:0; top:calc(50% - 22px); bottom:calc(50% - 22px); }"));
  t('⑤ le crayon de la priorité 24 × 24 avec sa zone, « Pourquoi ? » et les tuiles de l’Accueil à 24 px',
    bloc.includes('#priority-edit-btn{ min-width:var(--e-6,24px); min-height:var(--e-6,24px);') && bloc.includes("#priority-edit-btn::after{ content:''; position:absolute; inset:-10px; }") && bloc.includes('.mv-pq{ min-height:var(--e-6,24px); }') && bloc.includes('#page-home .hpc-p{ min-height:var(--e-6,24px); }'));
  t('⑤ les champs de recherche prennent la hauteur de leur boîte', bloc.includes('.sbox > input{ align-self:stretch; margin:-10px 0; padding:10px 0; }'));
  t('⑤ les 7 jours de la Cave à 44 px de large', bloc.includes('#page-cave .mvbtn.mvbtn-option{ min-width:44px; }'));
  t('⑥ la décision du 26/09 tient : ni puces, ni bulles « i », ni roue dans le bloc', !!bloc && !/\.(tfchip|ptfchip|chip|mv-i|ck-i)\b|#pil-gear/.test(bloc.replace(/\/\*[\s\S]*?\*\//g, '')));
  t('⑦ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-lisible1.mjs'") > 0 && S.liste.indexOf("mv-harnais-lisible1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['le plancher du téléphone retiré', m('charte', '@media (max-width:767.98px){ :root{ --pt-nano:12px; } }', '')],
    ['les initiales du Journal retombent dans un rond de 20', m('css', '.java{width:28px;height:28px;', '.java{width:20px;height:20px;')],
    ['plus de « +N » : tous les ronds dessinés', m('app', 'noms.slice(0,2)', 'noms.slice(0,9)')],
    ['les doublons de l’équipe comptés deux fois', m('app', 'return n && a.indexOf(n)===i;', 'return !!n;')],
    ['la ligne du Journal reprend son rond seul', m('app', '<div class="jmeta">${_jAvas(r, col)}<span', '<div class="jmeta"><div class="java">?</div><span')],
    ['les heures du Planning retombent à 9 px', m('css', '.pl2-name-s{display:block;font-size:var(--pt-micro,12px)', '.pl2-name-s{display:block;font-size:9px')],
    ['l’échelle de la campagne retombe à 9 px', m('html', '.cmp-scale{position:relative;height:15px;' + N, '.cmp-scale{position:relative;height:15px;font-size:9px')],
    ['l’étiquette du registre retombe à 10 px', m('tracteur', '<span style="' + N + ';font-weight:700;padding:2px 8px;border-radius:7px;', '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:7px;')],
    ['les boutons discrets perdent leur zone', m('css', '.mvbtn-discret::after, .mvbtn-secondaire::after, .mv-pq::after{', '.mvbtn-zz::after{')],
    ['le crayon de la priorité perd sa zone', m('css', "#priority-edit-btn::after{ content:''; position:absolute; inset:-10px; }", '')],
    ['les champs de recherche reprennent 16 px', m('css', '.sbox > input{ align-self:stretch; margin:-10px 0; padding:10px 0; }', '')],
    ['les jours de la Cave reviennent sous 44 px', m('css', '#page-cave .mvbtn.mvbtn-option{ min-width:44px; }', '')],
    ['les puces sont agrandies malgré la décision du 26/09', m('css', '.mv-pq{ min-height:var(--e-6,24px); }', '.mv-pq{ min-height:var(--e-6,24px); } .tfchip{ min-height:36px; }')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-lisible1.mjs'").join("mv-harnais-lisibleZ.mjs'") })],
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
