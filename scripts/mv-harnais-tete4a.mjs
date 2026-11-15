/* ───────────────────────────────────────────────────────
   HARNAIS — TETE-4A (§577) : LE BANDEAU COMMUN — LE HAUT DE L'ÉCRAN À LA MÊME HAUTEUR PARTOUT
   Lancer :          node scripts/mv-harnais-tete4a.mjs
   Contre-épreuves : node scripts/mv-harnais-tete4a.mjs --contre

   POURQUOI IL EXISTE
   Le haut de l'écran changeait de hauteur d'un écran à l'autre : la Cave posait son choix du millésime DANS l'en-tête (le Chai et le
   Millésime : 153 et 174 px contre 111 ; 204 et 243 au téléphone). TETE-4A pose trois lignes, toujours les mêmes : la bande
   campagne/date monte dans la ligne du module, et une ligne d'écran (.mv-ecran, 44 px) suit l'en-tête — le compteur, le bouton
   d'ajout, le choix du millésime. Ce harnais garde : les huit en-têtes d'index.html (lus bloc par bloc), « ? Aide » JOUÉ sur les
   deux places (dans la ligne du module ; sous l'en-tête pour le Pilotage, pas encore passé), la Réserve, le choix du millésime
   JOUÉ (il ne retourne pas dans l'en-tête), et la feuille du bandeau (importée après styles.css, tout par la charte avec un repli).
   Ce qu'il ne voit pas : la hauteur à l'écran — elle se mesure sur l'appli construite (npm run test:ux).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { idx: lire('index.html'), uti: lire('src/utils.js'), rsv: lire('src/reserve.js'), cav: lire('src/cave.js'), css: lire('src/bandeau.css'), app: lire('src/app.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
const PAGES = ['home', 'parcelles', 'journal', 'tracteur', 'phyto', 'reglages', 'planning', 'cave'];
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function finBloc(s, i) { const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { d += m[1] ? -1 : 1; if (!d) return re.lastIndex; } return -1; }
const sansCom = (s) => s.replace(/<!--[\s\S]*?-->/g, '');
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };

/* un DOM minime, juste ce que lisent _mvInjectHelpBtn et _caveEnsureMilBar */
function noeud(cls, id) {
  const n = { className: cls || '', _id: id || '', children: [], parentNode: null, style: {}, attrs: {},
    classList: { contains: (c) => (' ' + n.className + ' ').includes(' ' + c + ' ') },
    appendChild(c) { c.parentNode = n; n.children.push(c); return c; },
    insertBefore(c, ref) { c.parentNode = n; const k = ref ? n.children.indexOf(ref) : -1; if (k < 0) n.children.push(c); else n.children.splice(k, 0, c); return c; },
    get nextSibling() { const p = n.parentNode; if (!p) return null; return p.children[p.children.indexOf(n) + 1] || null; },
    tous() { return n.children.reduce((a, c) => a.concat([c], c.tous ? c.tous() : []), []); },
    querySelector(sel) { const c = sel.replace(/^\./, ''); return n.tous().find((x) => x.classList && x.classList.contains(c)) || null; },
    closest() { return null; }, setAttribute(k, v) { n.attrs[k] = v; } };
  return n;
}
/* un document dont les nœuds créés s'inscrivent par leur id (d.id = '…') */
function docParId(parId) {
  return { getElementById: (id) => parId[id] || null,
    createElement: () => { const n = noeud(''); Object.defineProperty(n, 'id', { set(v) { parId[v] = n; n._id = v; }, get() { return n._id; } }); return n; } };
}

function jouer(S) {
  const idx = sansCom(S.idx);
  // ① les huit en-têtes : la bande DANS la ligne du module, la ligne d'écran juste après l'en-tête
  let bons = 0; const detail = [];
  for (const h of PAGES) {
    const i = idx.indexOf('<div class="mod-header h-' + h + '">'); const f = i < 0 ? -1 : finBloc(idx, i); if (f < 0) { detail.push(h + ' introuvable'); continue; }
    const H = idx.slice(i, f); const tp = H.indexOf('<div class="mod-header-top">'); const tf = tp < 0 ? -1 : finBloc(H, tp); const top = tf < 0 ? '' : H.slice(tp, tf);
    const tt = top.indexOf('<div class="mod-header-titles">'); const ttf = tt < 0 ? -1 : finBloc(top, tt);
    const bandeApresTitres = ttf > 0 && /^\s*<div class="mod-meta-row mvu-meta">/.test(top.slice(ttf));
    const uneBande = (H.match(/class="mod-meta-row/g) || []).length === 1;
    const suite = idx.slice(f); const ecran = /^\s*<div class="mv-ecran"><div class="mv-ecran-g">[\s\S]*?<\/div><div class="mv-ecran-d"[^>]*>[\s\S]*?<\/div><\/div>/.exec(suite);
    const plusDeBandeDessous = !/^\s*(<div class="mv-ecran">(?:(?!<div class="mv-ecran">)[\s\S])*?<\/div><\/div>\s*)?(<div[^>]*id="cave-milnote"[^>]*><\/div>\s*)?<div class="mod-meta-row/.test(suite);
    const onglets = /<div class="mvu-tabs"/.test(H) && !/mv-ecran/.test(H);
    if (bandeApresTitres && uneBande && ecran && plusDeBandeDessous && onglets) bons++; else detail.push(h + ' : bande ' + bandeApresTitres + '/' + uneBande + ', écran ' + !!ecran + ', dessous ' + plusDeBandeDessous + ', onglets ' + onglets);
  }
  t('① les huit en-têtes d’index.html : la bande campagne/date dans la ligne du module, la ligne d’écran juste après l’en-tête (' + bons + '/8' + (detail.length ? ' — ' + detail.join(' ; ') : '') + ')', bons === 8);
  t('①bis huit lignes d’écran et huit bandes, pas une de plus', (idx.match(/class="mv-ecran"/g) || []).length === 8 && (idx.match(/class="mod-meta-row/g) || []).length === 8);
  // ② ce que l'en-tête disait en pastille ou en bouton vit sur la ligne d'écran
  const dansEcran = (id) => { const k = idx.indexOf('id="' + id + '"'); if (k < 0) return false; const e = idx.lastIndexOf('<div class="mv-ecran">', k), hd = idx.lastIndexOf('<div class="mod-header h-', k); return e > hd && finBloc(idx, e) > k; };
  const ids = ['pc-badge', 'trac-header-badge', 'phyto-header-badge', 'plan-header-badge', 'cave-hdr-badge', 'regl-role-badge', 'j-sub', 'journal-add-btn'];
  const hors = ids.filter((id) => !dansEcran(id));
  t('② les six compteurs, le compte du Journal et « + Ajouter » sont sur la ligne d’écran' + (hors.length ? ' (hors ligne : ' + hors.join(', ') + ')' : ''), hors.length === 0);
  t('②bis la Cave : l’hôte du choix du millésime à droite de sa ligne, la phrase du Millésime sous elle', /<div class="mv-ecran-d" id="cave-ecran-d">/.test(idx) && /<\/div><\/div>\s*<div class="cave-milnote" id="cave-milnote" style="display:none"><\/div>/.test(idx));
  // ③ « ? Aide », JOUÉ : dans la ligne du module il suit la bande ; sous l'en-tête (Pilotage) il reste dans la bande ; jamais deux
  {
    const top = noeud('mod-header-top'); const titres = top.appendChild(noeud('mod-header-titles')); const bande = top.appendChild(noeud('mod-meta-row mvu-meta')); const roue = top.appendChild(noeud('mod-home-btn'));
    const seule = noeud('mod-meta-row mvu-meta'); const page = noeud('page'); page.appendChild(seule);
    const doc = { querySelectorAll: () => [bande, seule], createElement: (tag) => { const n = noeud(''); n.tag = tag; return n; }, createTextNode: (x) => ({ texte: x }), readyState: 'complete' };
    const ctx = { document: doc, openAide: () => {} }; vm.createContext(ctx);
    vm.runInContext(fonction(S.uti, 'function _mvInjectHelpBtn(') + '\n_mvInjectHelpBtn(); _mvInjectHelpBtn();', ctx);
    const aides = top.children.filter((c) => c.classList.contains('mv-help-btn'));
    t('③ « ? Aide » (joué deux fois) : un seul dans la ligne du module, juste après la bande, avant la roue', aides.length === 1 && top.children.indexOf(aides[0]) === top.children.indexOf(bande) + 1 && top.children.indexOf(roue) === top.children.indexOf(aides[0]) + 1 && !bande.children.length && titres.children.length === 0);
    t('③bis sous l’en-tête (le Pilotage, pas encore passé) : il reste dans la bande, un seul', seule.children.filter((c) => c.classList.contains('mv-help-btn')).length === 1);
  }
  // ④ la Réserve, rendue en JS : la bande dans la ligne du module, avant les onglets ; la ligne d'écran après l'en-tête
  {
    const r = S.rsv; const iTop = r.indexOf("+'<div class=\"mod-header-top\">'"), iBande = r.indexOf("+'<div class=\"mod-meta-row mvu-meta\">'"), iTabs = r.indexOf("+'<div class=\"mvu-tabs mvr-tabs\">'"), iEcran = r.indexOf("+'<div class=\"mv-ecran\"><div class=\"mv-ecran-g\">");
    t('④ la Réserve : une seule bande, dans la ligne du module (avant les onglets) ; sa ligne d’écran suit l’en-tête', iTop > 0 && iBande > iTop && iTabs > iBande && iEcran > iTabs && (r.match(/mod-meta-row mvu-meta/g) || []).length === 1 && /\+'<\/div>'\n    \/\/ ★ TETE-4A[^\n]*\n    \+'<div class="mv-ecran">/.test(r));
  }
  // ⑤ le choix du millésime, JOUÉ : sur la ligne d'écran quand elle existe — plus jamais sous les sections, dans l'en-tête
  {
    const tete = noeud('mod-header h-cave'); const sections = tete.appendChild(noeud('mvu-tabs', 'cave-sec-tabs')); const ecr = noeud('mv-ecran-d', 'cave-ecran-d');
    const ctx = { document: docParId({ 'cave-sec-tabs': sections, 'cave-ecran-d': ecr }) }; vm.createContext(ctx);
    vm.runInContext(fonction(S.cav, 'function _caveEnsureMilBar(') + '\n_caveEnsureMilBar(); _caveEnsureMilBar();', ctx);
    t('⑤ le choix du millésime (joué deux fois) : une seule barre, à droite de la ligne d’écran, rien d’ajouté à l’en-tête', ecr.children.length === 1 && ecr.children[0]._id === 'cave-milbar' && tete.children.length === 1);
    const tete2 = noeud('mod-header h-cave'); const sec2 = tete2.appendChild(noeud('mvu-tabs', 'cave-sec-tabs'));
    const ctx2 = { document: docParId({ 'cave-sec-tabs': sec2 }) }; vm.createContext(ctx2);
    vm.runInContext(fonction(S.cav, 'function _caveEnsureMilBar(') + '\n_caveEnsureMilBar();', ctx2);
    t('⑤bis sans ligne d’écran (une page d’avant), elle retombe sous les sections : jamais perdue', tete2.children.length === 2 && tete2.children[1]._id === 'cave-milbar');
    t('⑤ter la phrase du Millésime sort de la barre, vers #cave-milnote', /var hn=document\.getElementById\('cave-milnote'\);\s*\n\s*if\(hn\)\{ var nt=h\.querySelector\('\.mlh-tous'\); hn\.innerHTML=''; if\(nt\) hn\.appendChild\(nt\); hn\.style\.display=nt\?'':'none'; \}/.test(S.cav));
  }
  // ⑥ la feuille du bandeau : lue juste après styles.css ; 44 px ; tout par la charte, avec un repli ; le Pilotage laissé tel quel
  {
    const css = S.css.replace(/\/\*[\s\S]*?\*\//g, '');
    t('⑥ app.js lit la feuille du bandeau juste après styles.css', /^import '\.\/styles\.css';\r?\nimport '\.\/bandeau\.css';/m.test(S.app));
    t('⑥bis la ligne d’écran : sous l’en-tête, 44 px, une seule rangée', /\.mod-header \+ \.mv-ecran\{[^}]*height:var\(--h-ecran,44px\);[^}]*white-space:nowrap;[^}]*overflow:hidden;[^}]*\}/.test(css));
    const sansRepli = (css.match(/var\(--[\w-]+\)/g) || []); const sansVar = css.replace(/var\(--[\w-]+,[^()]*(\([^()]*\))?[^()]*\)/g, ''); const brutes = (sansVar.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) || []);
    t('⑥ter chaque réglage se lit dans la charte AVEC un repli ; aucune couleur écrite en dur (' + sansRepli.length + ' sans repli, ' + brutes.length + ' en dur)', sansRepli.length === 0 && brutes.length === 0);
    const petites = (css.match(/font-size:\s*(\d+(?:\.\d+)?)px/g) || []).filter((x) => parseFloat(x.replace(/[^\d.]/g, '')) < 12);
    // TETE-4C (§579) : le Pilotage a pris le bandeau commun — la grille du téléphone vaut pour TOUS les en-têtes, plus aucune exception
    t('⑥quater aucun texte sous 12 px ; au téléphone, la grille vaut pour tous les en-têtes, le Pilotage compris', petites.length === 0 && (css.match(/\.mod-header > \.mod-header-top/g) || []).length >= 6 && !/:not\(\.h-pilotage\)/.test(css));
  }
  t('⑦ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-tete4a.mjs'") > 0 && S.liste.indexOf("mv-harnais-tete4a.mjs --contre'") > 0);
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
    ['une bande campagne/date revient sous l’en-tête de la Cave', m('idx', '<div class="cave-milnote" id="cave-milnote" style="display:none"></div>', '<div class="cave-milnote" id="cave-milnote" style="display:none"></div>\n<div class="mod-meta-row mvu-meta"></div>')],
    ['la ligne d’écran du Phyto disparaît', (S) => { const k = S.idx.indexOf('id="phyto-header-badge"'); const e = S.idx.lastIndexOf('<div class="mv-ecran">', k); if (k < 0 || e < 0) throw new Error('ancre absente'); return Object.assign({}, S, { idx: S.idx.slice(0, e) + '<div class="mv-ecrin">' + S.idx.slice(e + 22) }); }],
    ['le compteur du Planning retourne dans l’en-tête', (S) => { const b = '<span class="mod-header-badge" id="plan-header-badge">&mdash;</span>'; if (!S.idx.includes(b)) throw new Error('ancre absente'); const s = S.idx.replace(b, ''); const k = s.indexOf('<div class="mod-header h-planning">'); const tt = s.indexOf('<div class="mod-header-titles">', k); return Object.assign({}, S, { idx: s.slice(0, tt) + b + s.slice(tt) }); }],
    ['« ? Aide » retourne dans la bande, même dans la ligne du module', m('uti', 'if (ligne) ligne.insertBefore(b, rows[i].nextSibling); else rows[i].appendChild(b);', 'rows[i].appendChild(b);')],
    ['« ? Aide » ne se compte plus dans la ligne : il se pose deux fois', m('uti', "if ((ligne || rows[i]).querySelector('.mv-help-btn')) continue;", "if (rows[i].querySelector('.mv-help-btn')) continue;")],
    ['la Réserve perd sa ligne d’écran', m('rsv', "+'<div class=\"mv-ecran\"><div class=\"mv-ecran-g\">", "+'<div class=\"mv-ecrin\"><div class=\"mv-ecran-g\">")],
    ['le choix du millésime retourne dans l’en-tête', m('cav', 'if(ecr) ecr.appendChild(d);', 'if(false) ecr.appendChild(d);')],
    ['la phrase du Millésime reste dans la barre', m('cav', 'if(nt) hn.appendChild(nt);', 'if(nt) void 0;')],
    ['app.js ne lit plus la feuille du bandeau', m('app', "import './bandeau.css';", "// import './bandeau.css';")],
    ['la ligne d’écran passe à 60 px', m('css', 'height:var(--h-ecran,44px);', 'height:60px;')],
    ['une couleur écrite en dur dans la feuille', m('css', 'background:var(--bg-doux,#F7F5F1);', 'background:#F7F5F1;')],
    ['un réglage lu sans repli', m('css', 'color:var(--texte,#1B1A18); }', 'color:var(--texte); }')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-tete4a.mjs'").join("mv-harnais-tete4Z.mjs'") })],
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
