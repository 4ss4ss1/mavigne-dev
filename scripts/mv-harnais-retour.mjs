/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE RETOUR FERME CE QUI EST OUVERT, ET UN APPUI VA OÙ L'ON APPUIE
   (lot TOUR-2, §171)
   Lancer : node scripts/mv-harnais-retour.mjs
            node scripts/mv-harnais-retour.mjs --contre

   ══ POURQUOI ══
   Le tour complet du 23/09 (§170) a rejoué le bouton retour d'Android sur
   l'appli compilée : `_mvBack` ne connaissait que la famille `.overlay`. Feuille
   du Cuvier ouverte + retour → la page changeait et la feuille RESTAIT
   par-dessus ; même chose pour la feuille « Plus » du dock et la feuille
   « c'est fait » ; le panneau « Ce qu'il manque » ne se fermait jamais. Et sur
   le Tracteur, un crayon INVISIBLE vivait dans chaque puce de conducteur : un
   appui au milieu de « Jean » ouvrait sa fiche au lieu de filtrer.

   ══ CE QU'IL TIENT ══
     A. Le VRAI `_mvBack` d'app.js, avec `_mvTopSurface`, `_MV_SURFACES`,
        `_mvTopOverlay`, `_mvCloseable`, `_mvZ`, exécuté dans un DOM factice :
        chaque surface ouverte seule se ferme par SA fermeture ; la plus haute
        passe d'abord ; à égalité, la dernière dans le DOM ; la porte CGU ne
        tombe jamais ; rien d'ouvert → la page d'accueil du rôle.
     B. Chaque ouverture pose une entrée d'historique (sinon, sur la page
        d'accueil, le retour quitte l'appli au lieu de fermer la feuille), et
        `_pilDiagClose` est exposée.
     C. La puce de conducteur ne contient plus aucune cible : le crayon est un
        bouton frère, visible. L'icône « traitement » n'est plus effacée.
     D. Le double appui (touch-action), les zones d'appui, le bandeau démo.

   ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection —
      une mutation qui ne trouve pas son ancre est une ERREUR, jamais un vert.
      La première remet l'ANCIEN `_mvBack`, mot pour mot : elle doit rougir.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const V = '\u001b[32m', R = '\u001b[31m', G = '\u001b[2m', T = '\u001b[0m';

const SRC0 = {
  app:      lire('src/app.js'),
  utils:    lire('src/utils.js'),
  cuvier:   lire('src/cuvier.js'),
  pilotage: lire('src/pilotage.js'),
  tracteur: lire('src/tracteur.js'),
  css:      lire('src/styles.css'),
};

/* Découpe par comptage d'accolades à partir d'une ancre. */
function bloc(src, ancre, ouv = '{', fer = '}') {
  const i = src.indexOf(ancre);
  if (i < 0) throw new Error('ancre introuvable : ' + ancre);
  let j = src.indexOf(ouv, i), d = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === ouv) d++;
    else if (src[k] === fer) { d--; if (d === 0) {
      let fin = k + 1; if (src[fin] === ';') fin++;
      return src.slice(i, fin);
    } }
  }
  throw new Error('bloc non refermé : ' + ancre);
}

/* ── Le DOM factice ─────────────────────────────────────────────────────── */
function monde(ouverts, pageActive = 'page-cave', landing = 'page-pilotage') {
  const journal = [];
  let ordre = 0;
  const els = {};
  function el(nom, z, classes) {
    const cl = new Set(classes);
    const e = {
      nom, z, pos: ordre++,
      classList: { add: (c) => cl.add(c), remove: (c) => { cl.delete(c); journal.push('remove:' + nom + ':' + c); },
                   contains: (c) => cl.has(c) },
      compareDocumentPosition: (o) => (o.pos > e.pos ? 4 : 2),
      querySelector: (q) => {
        const m = q.match(/data-op="(\w+)"/);
        return m ? { click: () => journal.push('click:' + nom + ':' + m[1]) } : null;
      },
      _cl: cl,
    };
    els[nom] = e; return e;
  }
  // Les surfaces : sélecteur → (élément, z, classes quand ouvert)
  const DEF = {
    overlay:  ['.overlay.open', 9201, ['overlay', 'open']],
    overlay2: ['.overlay.open', 9202, ['overlay', 'open']],
    mvv:      ['#mvv-ov.open', 9000, ['mvv-ov', 'open']],
    tri:      ['#mv-tri-ov.open', 9000, ['mvz-ov', 'open']],
    diag:     ['#pil-diagwrap.show', 8905, ['pil-diagwrap', 'show']],
    mvds:     ['.mvds-bg', 2400, ['mvds-bg']],
    dock:     ['#mv-dock-sheet.show', 96, ['show']],
    dzsh:     ['.pil-dz-shw', 400, ['pil-dz-shw']],
    dzfm:     ['.pil-dz-fm', 400, ['pil-dz-fm']],
    cgu:      ['.mvt-ov', 9500, ['mvt-ov']],
  };
  ouverts.forEach((k) => el(k, DEF[k][1], DEF[k][2]));
  const ouvertParSel = (sel) => Object.values(els).filter((e) =>
    DEF[e.nom][0] === sel && (!/\.(open|show)$/.test(sel) || e._cl.has(sel.split('.').pop())));
  const document = {
    querySelector(sel) {
      if (sel === '.page.active') return { id: pageActive };
      const l = ouvertParSel(sel); return l.length ? l[l.length - 1] : null;
    },
    querySelectorAll(sel) { return ouvertParSel(sel); },
  };
  const window = {
    _vendSheetClose: () => journal.push('close:mvv'),
    _mvTriFermer:    () => journal.push('close:tri'),
    _pilDiagClose:   () => journal.push('close:diag'),
  };
  const ctx = {
    document, window, console,
    getComputedStyle: (e) => ({ zIndex: String(e.z) }),
    _mvdsClose:     () => journal.push('close:mvds'),
    _dockPlusClose: () => journal.push('close:dock'),
    _landingPage:   () => landing,
    _goLanding:     () => journal.push('landing'),
    _mvHistPush:    () => journal.push('push'),
  };
  return { ctx, journal };
}

function charger(app, ctx) {
  const code = [
    bloc(app, 'var _MV_SURFACES=[', '[', ']'),
    bloc(app, 'function _mvZ('),
    bloc(app, 'function _mvTopSurface('),
    bloc(app, 'function _mvCloseable('),
    bloc(app, 'function _mvTopOverlay('),
    bloc(app, 'function _mvBack('),
  ].join('\n') + '\n;globalThis.__r={_mvBack,_mvCloseable};';
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.__r;
}

/* ── Les assertions ─────────────────────────────────────────────────────── */
function executer(S) {
  const res = [];
  const t = (nom, ok, info) => res.push({ nom, ok: !!ok, info });
  const jouer = (ouverts, page, landing) => {
    const { ctx, journal } = monde(ouverts, page, landing);
    let r;
    try { const f = charger(S.app, ctx); r = f._mvBack(); return { r, journal, f }; }
    catch (e) { return { r: 'PLANTE ' + e.message, journal }; }
  };

  // A. chaque surface seule
  const seule = {
    overlay: 'remove:overlay:open', mvv: 'close:mvv', tri: 'close:tri', diag: 'close:diag',
    mvds: 'close:mvds', dock: 'close:dock', dzsh: 'click:dzsh:shut', dzfm: 'click:dzfm:fmx',
  };
  for (const [k, attendu] of Object.entries(seule)) {
    const o = jouer([k]);
    t(`A · retour avec « ${k} » ouvert : sa fermeture est appelée, la page ne change pas`,
      o.r === true && o.journal.includes(attendu) && !o.journal.includes('landing'),
      JSON.stringify(o.journal) + ' r=' + o.r);
  }
  let o = jouer(['mvv', 'overlay']);
  t('A · un dialogue (9201) sur la feuille du Cuvier (9000) : le dialogue d’abord',
    o.journal[0] === 'remove:overlay:open' && !o.journal.includes('close:mvv'), JSON.stringify(o.journal));
  o = jouer(['dock', 'mvds']);
  t('A · la feuille « c’est fait » (2400) passe avant la feuille « Plus » (96)',
    o.journal[0] === 'close:mvds' && !o.journal.includes('close:dock'), JSON.stringify(o.journal));
  o = jouer(['mvv', 'tri']);
  t('A · à égalité (9000), la dernière dans le DOM se ferme',
    o.journal[0] === 'close:tri' && !o.journal.includes('close:mvv'), JSON.stringify(o.journal));
  o = jouer(['overlay', 'overlay2']);
  t('A · deux dialogues : le plus haut seulement',
    o.journal.length === 1 && o.journal[0] === 'remove:overlay2:open', JSON.stringify(o.journal));
  o = jouer(['cgu']);
  t('A · ★ la porte CGU ne tombe JAMAIS au retour',
    !o.journal.some((j) => /cgu/.test(j)), JSON.stringify(o.journal));
  o = jouer([], 'page-cave', 'page-pilotage');
  t('A · rien d’ouvert, hors accueil : retour à la page d’accueil du rôle',
    o.r === true && o.journal.includes('landing'), JSON.stringify(o.journal));
  o = jouer([], 'page-pilotage', 'page-pilotage');
  t('A · rien d’ouvert, sur l’accueil : on laisse quitter',
    o.r === false && o.journal.length === 0, JSON.stringify(o.journal) + ' r=' + o.r);
  {
    // ⚠️ Sur la page « hub », `_mvCloseable` rend faux par elle-même : c'est le seul cas où la
    //    surface fait la différence (la contre-épreuve l'a montré — ailleurs, la page suffisait).
    const { ctx } = monde(['diag'], 'page-hub', 'page-hub');
    let ok = false; try { ok = charger(S.app, ctx)._mvCloseable() === true; } catch (e) { ok = false; }
    t('A · une surface ouverte compte comme « quelque chose à fermer » (l’entrée est reposée)', ok);
  }

  // B. l'historique à l'ouverture, et l'exposition
  const push = /window\._mvHistPush\)\s*window\._mvHistPush\(\)/;
  t('B · la feuille de tri pose une entrée d’historique',
    push.test(bloc(S.utils, 'window._mvTriOuvrir = function')));
  t('B · la feuille du Cuvier pose une entrée (une seule, pas à chaque étape)',
    /if\(!_dejaOuverte\)\{[^}]*_mvHistPush/.test(bloc(S.cuvier, 'function _vendSheet(html)')));
  t('B · le panneau « Ce qu’il manque » pose une entrée',
    push.test(bloc(S.pilotage, 'function _pilDiagOpen(')));
  t('B · `_pilDiagClose` est exposée (le retour l’appelle depuis app.js)',
    /window\._pilDiagClose\s*=\s*_pilDiagClose/.test(S.pilotage));
  t('B · les feuilles de Décider posent une entrée',
    /op==='sheet'\)\{\s*if\(!OP\._sheet&&window\._mvHistPush\)/.test(S.pilotage)
    && /op==='fm'\)\{\s*if\(!OP\._fm&&window\._mvHistPush\)/.test(S.pilotage));
  t('B · la feuille « Plus » et la feuille « c’est fait » posent une entrée',
    /function _dockPlus\(\)\{[^}]*_mvHistPush\(\)/.test(S.app)
    && /if\(!_mvdsDeja\) _mvHistPush\(\)/.test(bloc(S.app, 'function _mvdsOpen(')));
  t('B · `window._mvHistPush` existe pour les autres modules',
    /window\._mvHistPush\s*=\s*function/.test(S.app));

  // C. la puce de conducteur et l'icône « traitement »
  const lignePuces = S.tracteur.split('\n').find((l) => l.includes('_condList().map(') && l.includes('window.fCond===c.nom')) || '';
  const suite = S.tracteur.slice(S.tracteur.indexOf(lignePuces), S.tracteur.indexOf(lignePuces) + 900);
  const puce = (suite.match(/<div class="chip [^`]*?<\/div>/) || [''])[0];
  t('C · ★ la puce de conducteur ne contient plus AUCUNE cible (pas d’onclick imbriqué)',
    puce && (puce.match(/onclick=/g) || []).length === 1, puce.slice(0, 160));
  t('C · le crayon est un bouton frère, visible, qui ouvre la fiche',
    /class="chip chip-ed"[^>]*onclick="editCond\(/.test(suite) && /_mvIcon\('crayon',16\)/.test(suite));
  t('C · l’icône « traitement » n’est plus effacée',
    !/ico\.textContent\s*=\s*on\?'':''/.test(S.tracteur)
    && /_mvSetIcon\(ico,on\?'valide':'carre',18\)/.test(S.tracteur));

  // D. double appui, zones, bandeau
  const iTA = S.css.indexOf('button,a,[onclick],[role="button"],label,summary,select,input,textarea{touch-action:manipulation;}');
  const iMH = S.css.indexOf('.modal-handle{');
  t('D · le double appui ne zoome plus (touch-action:manipulation sur ce qui s’appuie)', iTA >= 0);
  t('D · ★ la règle est posée AVANT .modal-handle (dont touch-action:none doit gagner)',
    iTA >= 0 && iMH > iTA, `règle ${iTA} · modal-handle ${iMH}`);
  t('D · les puces ont une zone d’appui qui ne déborde pas sur la rangée voisine (≤ 5 px)',
    /\.chip::after,\.fchip::after,\.tfchip::after,\.ptfchip::after\{content:'';position:absolute;inset:-5px -3px;\}/.test(S.css));
  t('D · « Tout voir → » et la roue du Pilotage ont une zone d’appui',
    /\.hv2-voir-tout::after\{/.test(S.css) && /\.pil-gear2::after\{/.test(S.css));
  t('D · le bandeau démo décale l’appli et l’en-tête collant',
    /body\.classList\.add\('mv-demo-on'\)/.test(bloc(S.app, 'function _initLoginDemo('))
    && /body\.mv-demo-on #app-root\{padding-top:var\(--mv-demo-h/.test(S.css)
    && /body\.mv-demo-on \.mod-header/.test(S.css));
  return res;
}

/* ── Les contre-épreuves ────────────────────────────────────────────────── */
function muter(S, fic, avant, apres) {
  if (!S[fic].includes(avant)) throw new Error('INJECTION RATÉE (' + fic + ') : ' + avant.slice(0, 70));
  return Object.assign({}, S, { [fic]: S[fic].replace(avant, apres) });
}
const CONTRES = [
  ['l’ANCIEN _mvBack (famille .overlay seule), mot pour mot', (S) => muter(S, 'app',
    'var top=_mvTopSurface();\n  if(top){ top.close(); return true; }',
    'var ov=_mvTopOverlay();\n  if(ov){ ov.classList.remove(\'open\'); return true; }')],
  ['la porte CGU ajoutée aux surfaces fermables', (S) => muter(S, 'app',
    "{q:'#mvv-ov.open',", "{q:'.mvt-ov', f:function(el){ el.classList.remove('mvt-ov'); }},\n  {q:'#mvv-ov.open',")],
  ['l’égalité départagée par le PREMIER dans le DOM', (S) => muter(S, 'app',
    '(best.el.compareDocumentPosition(el) & 4)', '(best.el.compareDocumentPosition(el) & 2)')],
  ['le panneau « Ce qu’il manque » retiré de la liste', (S) => muter(S, 'app',
    "  {q:'#pil-diagwrap.show',  f:function(){ if(window._pilDiagClose) window._pilDiagClose(); }},\n", '')],
  ['`_mvCloseable` qui ignore les surfaces', (S) => muter(S, 'app',
    "  if(_MV_SURFACES.some(function(s){ return !!document.querySelector(s.q); })) return true;\n", '')],
  ['`_pilDiagClose` non exposée', (S) => muter(S, 'pilotage',
    'window._pilDiagClose=_pilDiagClose;', '')],
  ['la feuille du Cuvier sans entrée d’historique', (S) => muter(S, 'cuvier',
    'if(!_dejaOuverte){ if(window._mvHistPush)', 'if(false){ if(window._mvHistPush)')],
  ['l’ANCIEN crayon invisible remis DANS la puce', (S) => muter(S, 'tracteur',
    "renderTracteur()\">${_escHtml(c.nom)}</div>`",
    "renderTracteur()\">${_escHtml(c.nom)}<span style=\"padding:12px 8px\" onclick=\"event.stopPropagation();editCond('${_escAttr(c.nom)}')\"></span></div>`")],
  ['l’icône « traitement » de nouveau effacée', (S) => muter(S, 'tracteur',
    "if(ico&&window._mvSetIcon)window._mvSetIcon(ico,on?'valide':'carre',18);", "if(ico)ico.textContent=on?'':'';")],
  ['la règle du double appui posée APRÈS .modal-handle', (S) => {
    const r = 'button,a,[onclick],[role="button"],label,summary,select,input,textarea{touch-action:manipulation;}\n';
    const S2 = muter(S, 'css', r, '');
    return Object.assign({}, S2, { css: S2.css + '\n' + r });
  }],
  ['le bandeau démo sans décalage', (S) => muter(S, 'app',
    "document.body.classList.add('mv-demo-on');", '')],
];

/* ── Exécution ──────────────────────────────────────────────────────────── */
console.log('\n  MA VIGNE — Harnais TOUR-2 : le retour et les appuis\n');
const base = executer(SRC0);
let rouges = 0;
for (const a of base) {
  console.log(`  ${a.ok ? V + 'OK ' : R + 'KO '}${T} ${a.nom}` + (a.ok ? '' : `\n      ${G}${a.info || ''}${T}`));
  if (!a.ok) rouges++;
}
console.log(`\n  ${rouges ? R : V}${base.length - rouges} vertes, ${rouges} rouges${T}`);
if (rouges) process.exit(1);

if (CONTRE) {
  console.log('\n  ── Contre-épreuves (chaque défaut remis doit faire rougir) ──');
  let muettes = 0;
  for (const [nom, f] of CONTRES) {
    let S2;
    try { S2 = f(SRC0); } catch (e) { console.log(`  ${R}ERREUR${T} ${nom} — ${e.message}`); muettes++; continue; }
    const r = executer(S2).filter((a) => !a.ok);
    if (r.length) console.log(`  ${V}détecté${T} ${nom} ${G}(${r.length} rouge${r.length > 1 ? 's' : ''})${T}`);
    else { console.log(`  ${R}MUETTE${T} ${nom}`); muettes++; }
  }
  console.log(`\n  ${muettes ? R : V}${CONTRES.length - muettes}/${CONTRES.length} contre-épreuves détectées${T}`);
  if (muettes) process.exit(1);
}
