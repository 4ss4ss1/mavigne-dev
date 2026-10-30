/* ───────────────────────────────────────────────────────
   HARNAIS — CAVE-UX-1 (§494) : CAVE › AUJOURD'HUI — LE SOMMAIRE QUI SUIT, LE CONTENANT CHOISI (docs/maquettes/maquette-ux-v2.html, Cave)
   Lancer :          node scripts/mv-harnais-cavux1.mjs
   Contre-épreuves : node scripts/mv-harnais-cavux1.mjs --contre

   POURQUOI IL EXISTE
   La page faisait quatre écrans sans repère ; sur ordinateur, « À surveiller » tenait la droite. Décision de Nico (28/10) :
   trois colonnes, comme la maquette. Ce harnais JOUE les vraies fonctions (extraites de cave.js) : le sommaire (six entrées,
   leurs nombres, leurs ancres, un zéro écrit « 0 »), la fiche du contenant (ses raisons, sa densité et son dernier relevé, ses
   fûts, ses gestes avec la valeur lue dans data-*, « Autre geste »), la sélection (la première d'office, la disparue remplacée,
   rien au téléphone) ; il garde la structure, le geste d'une ligne qui ne la choisit pas, les compteurs à zéro tus, la grille.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, desk) {
  const fiche = { innerHTML: '' }; const lis = ['c:c7', 'v:fx'].map((k) => ({ dataset: { k }, a: {}, setAttribute(n, v) { this.a[n] = v; } }));
  const ctx = { _AUJ_G: [{ k: 'c:c7', ref: 'c7', cuve: true, titre: 'Cuve 7', G: [{ kind: 'mesure', urgence: 'due' }] }, { k: 'v:fx', ref: 'fx', cuve: false, titre: 'Fixin ’25', G: [{ kind: 'ouillage' }, { kind: 'soutirage' }] }],
    _aujSelK: '', _AUJ_GESTE: { alerte: 'mesure' }, _AUJ_VERBE: { mesure: 'Relever', ouillage: 'Ouiller', soutirage: 'Soutirer' },
    _aujEntite: (ref) => ({ id: ref }), _aujMeta: (x) => (x.cuve ? 'inox 60 hL' : '3 fûts'), _aujRaison: (it) => 'raison ' + it.kind, _escHtml: (x) => String(x), _escAttr: (x) => String(x),
    _vendTriMes: () => [{ date: '2026-10-26', d: 994 }], _vendMesD20: (m) => m.d, _aujNb: (n) => String(n), _mlFrJ: (d) => 'le ' + d, _caveNbTonneaux: () => 3,
    window: { matchMedia: () => ({ matches: desk }) }, document: { getElementById: (id) => (id === 'caj-fiche' ? fiche : null), querySelectorAll: () => lis } };
  vm.createContext(ctx); vm.runInContext(['function _aujDesk(', 'function _aujSommaireHtml(', 'function _aujFicheHtml(', 'function _aujMontre(', 'function _aujSel(', 'function _aujFicheSync('].map((d) => fonction(S.cave, d)).join('\n') + '\nthis.som=_aujSommaireHtml; this.fx=_aujFicheHtml; this.sel=_aujSel; this.sync=_aujFicheSync;', ctx);
  return { ctx, fiche, lis };
}
function jouer(S) {
  const A = monde(S, true); const h = A.ctx.som({ presse: 2, semaine: 5, cuves: 7, futs: 43, veille: 0, releves: 0 });
  t('① le sommaire : six entrées dans l’ordre, leurs nombres, leurs ancres ; un zéro écrit « 0 »', ['Ce qui presse<b>2</b>', 'À faire<b>5</b>', 'Cuves<b>7</b>', 'Fûts<b>43</b>', 'À surveiller<b>0</b>', 'Relevés du jour<b>0</b>'].every((x, i, a) => h.indexOf(x) > 0 && (i === 0 || h.indexOf(x) > h.indexOf(a[i - 1])))
    && ['caj-titre', 'caj-semaine', 'caj-cv-t', 'caj-ch-t', 'caj-droite', 'caj-faits'].every((id) => h.includes('href="#' + id + '" class="caj-so" data-vers="' + id + '" onclick="return _aujVers(this.dataset.vers)"')));
  const c = A.ctx.fx(A.ctx._AUJ_G[0]);
  t('② la fiche d’une cuve : son nom, sa raison, sa densité à 20 °C et son dernier relevé, « Relever » en premier, « Autre geste »', c.includes('Cuve 7') && c.includes('raison mesure') && c.includes('994') && c.includes('le 2026-10-26')
    && c.includes('class="mvbtn mvbtn-principal caj-fx-b" data-g="mesure" data-ref="c7" onclick="_mlGo(this.dataset.g,this.dataset.ref)">Relever') && c.includes('onclick="openOvCaveOp()">Autre geste'));
  const v = A.ctx.fx(A.ctx._AUJ_G[1]);
  t('② la fiche d’une cuvée : ses fûts, « Ouiller » puis « Soutirer » ; sans contenant, on le dit', v.includes('<dt>Fûts</dt><dd>3</dd>') && v.indexOf('>Ouiller<') > 0 && v.indexOf('>Soutirer<') > v.indexOf('>Ouiller<') && A.ctx.fx(null).includes('Choisissez un contenant'));
  A.ctx.sync();
  t('③ la sélection : la première d’office, marquée ; un appui en choisit une autre', A.fiche.innerHTML.includes('Cuve 7') && A.lis[0].a['aria-selected'] === 'true' && (A.ctx.sel('v:fx'), A.fiche.innerHTML.includes('Fixin') && A.lis[1].a['aria-selected'] === 'true'));
  const B = monde(S, true); B.ctx._aujSelK = 'c:disparue'; B.ctx.sync(); const C = monde(S, false); C.ctx.sel('v:fx');
  t('③ la choisie disparue : la première la remplace ; au téléphone, un appui ne choisit rien', B.fiche.innerHTML.includes('Cuve 7') && C.fiche.innerHTML === '' && C.ctx._aujSelK === '');
  t('④ la page : le sommaire, la page, la fiche ; la ligne porte sa clé ; ses gestes ne la choisissent pas', S.cave.includes("body.innerHTML=_caveSaisBanner()+'<div class=\"caj-3\">'+_aujSommaireHtml(_AUJ_N)+'<div class=\"caj-centre\">'+_c+'</div><aside class=\"caj-fx\" id=\"caj-fiche\"")
    && S.cave.includes('" data-k="\'+_escAttr(x.k)+\'" onclick="_aujSel(this.dataset.k)">') && S.cave.includes('caj-b" onclick="event.stopPropagation();_mlGo('));
  t('④ les ancres posées : « Relevés du jour », le calendrier ; les compteurs à zéro se taisent', S.cave.includes('<div class="caj-fait" id="caj-faits">') && S.cave.includes("'<div id=\"caj-semaine\">'+_aujCal(sem,from)+'</div>'") && S.cave.includes("===0?' hidden':'')+'><div class=\"mvu-kpi-v\">'"));
  t('⑤ le sommaire suit l’en-tête (sa hauteur, repliée ou non) ; sur ordinateur, trois colonnes, « À surveiller » dans le fil', S.cave.includes("_aujRO=new ResizeObserver(") && S.css.includes('.caj-som{position:sticky;top:var(--caj-som-haut,57px);')
    && S.css.includes('.caj-3{display:grid;grid-template-columns:minmax(0,200px) minmax(0,1fr) minmax(0,340px);') && S.css.includes('.caj-3 .caj-dr,.caj-3 .caj-dr.colle{position:static!important;'));
  t('⑥ exposées ; la liste joue ce fichier et sa contre-épreuve', S.cave.includes('window._aujSel=_aujSel; window._aujVers=_aujVers;') && S.liste.indexOf("mv-harnais-cavux1.mjs'") > 0 && S.liste.indexOf("mv-harnais-cavux1.mjs --contre'") > 0);
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
    ['« À surveiller » quitte le sommaire', m('cave', ",['caj-droite','\\u00c0 surveiller',N.veille]", '')],
    ['la fiche d’une cuve perd sa densité', m('cave', "(d20!=null?'<dt>Densit\\u00e9 \\u00e0 20\\u00a0\\u00b0C</dt><dd>'+_escHtml(_aujNb(d20))+'</dd>':'')", "''")],
    ['la choisie disparue n’est pas remplacée', m('cave', "_aujMontre(ks.indexOf(_aujSelK)>=0?_aujSelK:(ks[0]||''));", '_aujMontre(_aujSelK);')],
    ['au téléphone, l’appui choisit aussi', m('cave', 'function _aujSel(k){ if(!_aujDesk()) return; _aujMontre(k); }', 'function _aujSel(k){ _aujMontre(k); }')],
    ['un geste de la ligne la choisit aussi', m('cave', 'caj-b" onclick="event.stopPropagation();_mlGo(', 'caj-b" onclick="_mlGo(')],
    ['les compteurs à zéro reparlent', m('cave', "===0?' hidden':'')+'><div class=\"mvu-kpi-v\">'", "===0?'':'')+'><div class=\"mvu-kpi-v\">'")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-cavux1.mjs'").join("mv-harnais-cavuxZ.mjs'") })],
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
