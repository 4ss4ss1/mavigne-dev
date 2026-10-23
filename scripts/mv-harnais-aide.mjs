// HARNAIS — AIDE-1 (§365) : la fenêtre « ? Aide » se lit — aucun code à l'écran, l'icône dessinée, le Pilotage dit vrai.
//   node scripts/mv-harnais-aide.mjs           → doit être vert
//   node scripts/mv-harnais-aide.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (18/10) : « il y a un souci dans l'écran d'aide de pilotage ». Mesuré au navigateur : le nom de l'icône
// (« graphique ») écrit en gros à la place de l'icône ; 105 bouts de code au milieu du texte (les gras, un « &amp; ») ;
// « Huit onglets » et « les sept onglets » sur le même écran ; « le dernier ouvert revient », faux depuis AUJ-5 (§307).
// Aucun contrôle ne lisait ce que la fenêtre AFFICHE : C22 vérifie qu'une fiche a sa page, pas qu'elle se lit.
// A. La VRAIE openAide (src/utils.js) exécutée sur chaque fiche et sur la fiche par défaut, avec la VRAIE liste d'onglets
//    (src/pilotage.js) : le texte que lit le navigateur ne porte ni balise ni entité ni « undefined » ; l'en-tête dessine
//    son icône et n'écrit que le titre et sa phrase ; le gras écrit devient du gras, apparié ; aucune ligne perdue.
// B. _mvAideTexte sur des chaînes faites pour la piéger : seul <b>…</b> passe, apparié, jamais imbriqué, refermé.
// C. Le texte des fiches : l'amorce sans code, la suite sans entité ni autre balise, le gras apparié ; chaque icône
//    existe dans le jeu d'icônes d'index.html.
// D. Le Pilotage dit vrai : aucun nombre d'onglets écrit en dur ; l'ouverture sur Aujourd'hui dite par l'aide ET faite
//    par goHub (app.js) ; le guide nomme les huit onglets et ne dit plus « sept » ; la nouveauté 9.30.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = { uti: lire('src/utils.js'), pil: lire('src/pilotage.js'), app: lire('src/app.js'), html: lire('index.html'), guide: lire('guide/11-pilotage.html') };
// Le corps d'une fonction, par comptage d'accolades.
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('introuvable : ' + nom);
  const k = src.indexOf('{', i); let n = 0;
  for (let j = k; j < src.length; j++) { if (src[j] === '{') n++; else if (src[j] === '}') { n--; if (!n) return src.slice(i, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
// Ce que le navigateur AFFICHE d'un HTML : les balises disparaissent, les entités redeviennent des caractères.
const visible = h => h.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const BALISE = /<\/?[a-z][a-z0-9]*(\s[^<>]*)?\/?>/i;
const ENTITE = /&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i;
const PERMISES = new Set(['div', 'span', 'b', 'button', 'svg']);
const SOUS_TITRE = 'Ce qu’on peut faire sur cet écran';

// _mvAideTexte manque dans un fichier d'avant AIDE-1 : on monte quand même, pour que la partie A dise ce qui s'affiche.
const facultatif = (src, nom) => { try { return corps(src, nom); } catch (e) { return ''; } };
function monter(S) {
  const u = S.uti;
  const code = [corps(u, '_escHtml'), corps(u, '_mvAideEnum'), (u.match(/var _MV_AIDE_NB = \[[^\]]*\];/) || [''])[0], corps(u, '_mvAideNb'),
    corps(u, '_mvAideOngletsDom'), corps(u, '_mvAideSections'), corps(u, '_mvAideOngletsPil'), facultatif(u, '_mvAideTexte'),
    u.slice(u.indexOf('var MV_AIDE = {'), u.indexOf('function _mvAideFiche()')), corps(u, '_mvAideFiche'), corps(u, 'openAide')].join('\n');
  const a = S.pil.indexOf('var _PIL_TABS = ['), b = S.pil.indexOf('\n];', a);
  if (a < 0 || b < 0) throw new Error('_PIL_TABS introuvable');
  const tabs = vm.runInNewContext(S.pil.slice(a, b + 3) + '\n_PIL_TABS');
  const icones = []; let page = 'home', ouvert = null; const inner = { innerHTML: '' };
  const ctx = {
    _mvIcon: n => { icones.push(String(n)); return '<svg class="mv-ic" data-ic="' + String(n) + '"></svg>'; },
    document: { querySelector: s => (s === '.page.active' ? { id: 'page-' + page } : null), querySelectorAll: () => [], getElementById: id => (id === 'aide-inner' ? inner : {}) },
  };
  ctx.window = ctx; ctx._PIL_TABS = tabs; ctx.openOv = id => { ouvert = id; }; ctx.logError = () => {};
  vm.createContext(ctx); vm.runInContext(code, ctx);
  const voir = k => { page = k; ouvert = null; inner.innerHTML = ''; icones.length = 0; ctx.openAide(); return { html: inner.innerHTML, icones: icones.slice(), ouvert }; };
  return { ctx, tabs, voir };
}
// Les points d'une fiche tels que l'aide les évalue (une fonction est appelée ; nulle ou en échec : omise).
function points(f) {
  const out = [];
  for (const p of f.points) {
    let q = p; if (typeof q === 'function') { try { q = q(); } catch (e) { q = null; } }
    if (q && q[0]) out.push({ am: String(q[0]), su: String(q[1] || ''), dyn: typeof p === 'function' });
  }
  return out;
}
const apparie = s => { let o = 0; for (const t of s.match(/<\/?b>/g) || []) { if (t === '<b>') { if (o) return false; o++; } else { if (!o) return false; o--; } } return o === 0; };

function partieA(M, T) {
  const { ctx, tabs, voir } = M;
  const cles = Object.keys(ctx.MV_AIDE).concat(['']);
  const f1 = [], f2 = [], f3 = [], f4 = [], f5 = [], f6 = [], f7 = [], f8 = [];
  for (const k of cles) {
    const f = k ? ctx.MV_AIDE[k] : ctx.MV_AIDE_DEFAUT, nom = k || '(défaut)';
    const r = voir(k || 'zz-sans-fiche'), html = r.html, vis = visible(html);
    if (!html || r.ouvert !== 'ovAide') f1.push(nom);
    if (BALISE.test(vis)) f2.push(nom + ' → « ' + (vis.match(BALISE) || [''])[0] + ' »');
    if (ENTITE.test(vis)) f3.push(nom + ' → « ' + (vis.match(ENTITE) || [''])[0] + ' »');
    if (/\bundefined\b|\bNaN\b|\bnull\b/.test(vis)) f4.push(nom);
    const iL = html.indexOf('<div class="mva-list">');
    const reste = visible(iL > 0 ? html.slice(0, iL) : html).split(f.titre).join('').split(SOUS_TITRE).join('').trim();
    if (!r.icones.includes(f.ico) || reste) f5.push(nom + (reste ? ' (l’en-tête écrit « ' + reste + ' »)' : ' (icône non dessinée)'));
    const noms = [...html.matchAll(/<\/?([a-z0-9]+)/gi)].map(m => m[1].toLowerCase()).filter(n => !PERMISES.has(n));
    if (noms.length) f6.push(nom + ' → ' + [...new Set(noms)].join(', '));
    const P = points(f), liste = iL > 0 ? html.slice(iL) : '';
    const nIt = (liste.match(/<div class="mva-it">/g) || []).length;
    const attendu = P.reduce((n, p) => n + 1 + (p.su.match(/<b>/g) || []).length, 0);
    const ouvre = (liste.match(/<b>/g) || []).length, ferme = (liste.match(/<\/b>/g) || []).length;
    if (ouvre !== ferme || ouvre !== attendu) f7.push(nom + ' (' + ouvre + ' gras ouverts, ' + ferme + ' fermés, ' + attendu + ' écrits)');
    if (nIt !== P.length) f8.push(nom + ' (' + nIt + ' lignes affichées pour ' + P.length + ' points)');
  }
  T('A1 chaque fiche s’ouvre (' + cles.length + ' fiches, défaut compris)', cles.length >= 11 && !f1.length, f1);
  T('A2 aucune balise ne s’affiche en texte (« <b>fin prévue</b> » vu le 18/10)', !f2.length, f2);
  T('A3 aucune entité ne s’affiche en texte (« &amp; »)', !f3.length, f3);
  T('A4 ni « undefined », ni « NaN », ni « null » à l’écran', !f4.length, f4);
  T('A5 l’en-tête dessine son icône et n’écrit que le titre et sa phrase (« graphique » écrit en gros vu le 18/10)', !f5.length, f5);
  T('A6 aucune autre balise que celles de la fenêtre (div, span, b, button, svg)', !f6.length, f6);
  T('A7 le gras écrit devient du gras, apparié — l’amorce plus chaque <b> de la suite', !f7.length, f7);
  T('A8 aucune ligne perdue : une ligne affichée par point', !f8.length, f8);
  const vp = visible(voir('pilotage').html), nb = ctx._mvAideNb(tabs.length);
  T('A9 l’aide du Pilotage compte ses onglets dans le code : « ' + nb + ' onglets », chacun nommé', tabs.length >= 7 /* PIL-RANGE-2b (§444) : L'année rangée, sept onglets — un plancher contre une lecture ratée du code */ && vp.includes(nb + ' onglets') && tabs.every(t => vp.includes(t[2])));
}
function partieB(M, T) {
  const t = M.ctx._mvAideTexte, e = M.ctx._escHtml;
  T('B0 _mvAideTexte existe : le texte d’une fiche passe par lui', typeof t === 'function');
  if (typeof t !== 'function') return;
  const piege = 'x <i>y</i> <img src=x onerror=alert(1)> <b class="z">w';
  T('B1 le gras passe', t('<b>fin prévue</b>') === '<b>fin prévue</b>');
  T('B2 le reste est échappé (& < > " \')', t('a & b < c > d "e" \'f\'') === e('a & b < c > d "e" \'f\''));
  T('B3 une autre balise, ou un <b> qui porte un attribut, reste du texte', t(piege) === e(piege));
  T('B4 un gras resté ouvert se referme en fin de ligne', t('<b>a') === '<b>a</b>');
  T('B5 une fermeture orpheline disparaît', t('a</b>b') === 'ab');
  T('B6 jamais de gras dans le gras', t('<b>a<b>b</b>c</b>') === '<b>ab</b>c');
  T('B7 <B> en majuscules reste du texte', t('<B>a</B>') === e('<B>a</B>'));
  T('B8 rien donne rien', t(null) === '' && t(undefined) === '' && t('') === '');
}
function partieC(M, T, S) {
  const { ctx } = M;
  const c1 = [], c2 = [], c3 = [], c4 = [];
  for (const k of Object.keys(ctx.MV_AIDE).concat([''])) {
    const f = k ? ctx.MV_AIDE[k] : ctx.MV_AIDE_DEFAUT, nom = k || '(défaut)';
    if (!S.html.includes('id="ic-' + f.ico + '"')) c4.push(nom + ' → ' + f.ico);
    f.points.forEach((p, i) => {
      if (typeof p === 'function') return;
      const am = String(p[0] || ''), su = String(p[1] || ''), o = nom + ' n°' + (i + 1) + ' « ' + am.slice(0, 40) + ' »';
      if (BALISE.test(am) || ENTITE.test(am)) c1.push(o);
      const autres = (su.match(new RegExp(BALISE.source, 'gi')) || []).filter(b => b !== '<b>' && b !== '</b>');
      if (ENTITE.test(su) || autres.length) c2.push(o + ' → ' + ((su.match(ENTITE) || [])[0] || autres[0]));
      if (!apparie(su)) c3.push(o);
    });
  }
  T('C1 l’amorce est du texte pur (le rendu la met en gras)', !c1.length, c1);
  T('C2 la suite : ni entité ni autre balise que <b> (écrire « & », « SO2 »)', !c2.length, c2);
  T('C3 la suite : chaque <b> fermé, jamais imbriqué', !c3.length, c3);
  T('C4 chaque icône de fiche existe dans le jeu d’icônes d’index.html', !c4.length, c4);
}
function partieD(M, T, S) {
  const { ctx, tabs } = M;
  const pil = ctx.MV_AIDE.pilotage, compte = /\b(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|\d+)\s+onglets\b/i;
  const durs = pil.points.filter(p => typeof p !== 'function' && compte.test(String(p[0]) + ' ' + String(p[1] || ''))).map(p => p[0]);
  T('D1 aucun nombre d’onglets écrit en dur dans l’aide du Pilotage (« les sept onglets » contre « Huit onglets »)', !durs.length, durs);
  let dyn = null; try { dyn = ctx._mvAideOngletsPil(); } catch (e) { dyn = null; }
  T('D2 l’aide dit l’ouverture sur Aujourd’hui, plus « le dernier ouvert revient »', !!dyn && dyn[1].includes('s’ouvre sur Aujourd’hui') && !/dernier ouvert revient/i.test(dyn[1]));
  const go = sansCom(corps(S.app, 'goHub'));
  const i = S.pil.indexOf("window._pilOuvrirAujourdhui=function(){ _PIL_TAB='auj';"), ligne = i < 0 ? '' : S.pil.slice(S.pil.lastIndexOf('\n', i) + 1, i);
  T('D3 …et c’est vrai : goHub (app.js) rouvre Aujourd’hui à chaque ouverture de l’appli', go.includes('_pilOuvrirAujourdhui()') && i >= 0 && !/\/\/|\/\*/.test(ligne));
  const g = S.guide.replace(/<!--[\s\S]*?-->/g, ''), sub = (g.match(/<div class="sub">([^<]*)<\/div>/) || [])[1] || '';
  const listes = sub.replace(/&amp;/g, '&').split(' · ').map(x => x.trim());
  T('D4 le guide ne dit plus « sept onglets »', !/\bsept onglets\b/i.test(visible(g)));
  T('D5 le sous-titre du guide nomme les ' + tabs.length + ' onglets du code, Archives compris', listes.length === tabs.length && tabs.every(t => listes.includes(t[2])));
  T('D6 la nouveauté 9.30 : une correction pour tous, au Journal', /\{ v: '9\.30', d: '2026-10-19', items: \[\n    \{ niv: 0, pour: \['tous'\], emoji: 'livre'/.test(S.uti));
}
function verifier(S) {
  const out = []; const T = (n, c, det) => out.push([n, !!c, det && det.length ? det.slice(0, 4).join(' · ') : '']);
  let M = null;
  try { M = monter(S); } catch (e) { T('plantage au montage : ' + (e && e.message), false); return out; }
  for (const p of [partieA, partieB, partieC, partieD]) { try { p(M, T, S); } catch (e) { T('plantage ' + p.name + ' : ' + (e && e.message), false); } }
  return out;
}
const remp = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('ancre introuvable ou multiple : ' + a.slice(0, 70)); return s.replace(a, b); };
if (!CONTRE) {
  const res = verifier(BASE); let ko = 0;
  res.forEach(([n, ok, det]) => { if (!ok) ko++; console.log((ok ? '  vert    ' : '  ROUGE   ') + n + (!ok && det ? '\n            ' + det : '')); });
  console.log(ko ? `AIDE-1 : ${ko} ROUGE(S) sur ${res.length}` : `AIDE-1 : ${res.length} vertes`); process.exit(ko ? 1 : 0);
} else {
  const DEF = [
    ['l’en-tête écrit de nouveau le nom de l’icône', S => ({ ...S, uti: remp(S.uti, '_mvIcon(a.ico, 18)', '_escHtml(a.ico)') })],
    ['l’en-tête ne dessine plus d’icône', S => ({ ...S, uti: remp(S.uti, '_mvIcon(a.ico, 18)', "''") })],
    ['la suite est de nouveau échappée en bloc (le gras en code)', S => ({ ...S, uti: remp(S.uti, "_mvAideTexte(p[1] || '')", "_escHtml(p[1] || '')") })],
    ['_mvAideTexte laisse tout passer', S => ({ ...S, uti: remp(S.uti, 'else if (m) out += _escHtml(m);', 'else if (m) out += m;') })],
    ['_mvAideTexte ne referme plus un gras ouvert', S => ({ ...S, uti: remp(S.uti, "return gras ? out + '</b>' : out;", 'return out;') })],
    ['_mvAideTexte imbrique les gras', S => ({ ...S, uti: remp(S.uti, "if (m === '<b>') { if (!gras) { out += '<b>'; gras = true; } }", "if (m === '<b>') { out += '<b>'; gras = true; }") })],
    ['un « &amp; » revient dans l’aide du Pilotage', S => ({ ...S, uti: remp(S.uti, 'L’équipe & le matériel\u202f» alors', 'L’équipe &amp; le matériel\u202f» alors') })],
    ['un « <sub> » revient dans l’aide de la Cave', S => ({ ...S, uti: remp(S.uti, 'le SO2, les tanins', 'le SO<sub>2</sub>, les tanins') })],
    ['un gras dans une amorce', S => ({ ...S, uti: remp(S.uti, "['Le « i » est partout', ", "['Le <b>« i »</b> est partout', ") })],
    ['un gras jamais fermé dans une suite', S => ({ ...S, uti: remp(S.uti, 'Dans <b>Décider</b>, chaque étape a le sien', 'Dans <b>Décider, chaque étape a le sien') })],
    ['une icône de fiche qui n’existe pas', S => ({ ...S, uti: remp(S.uti, "ico: 'graphique', titre: 'Pilotage'", "ico: 'graphiques', titre: 'Pilotage'") })],
    ['« le dernier ouvert revient » est de retour', S => ({ ...S, uti: remp(S.uti, "'. À l’ouverture de l’appli, le Pilotage s’ouvre sur Aujourd’hui ; quand vous y revenez, il garde l’onglet où vous étiez.'", "'. Le dernier ouvert revient à la visite suivante.'") })],
    ['« les sept onglets » réécrit en dur', S => ({ ...S, uti: remp(S.uti, '": chaque onglet suit la même règle', '": les sept onglets suivent la même règle') })],
    ['la ligne des onglets ne lit plus le code (point omis)', S => ({ ...S, uti: remp(S.uti, 'var t = window._PIL_TABS;', 'var t = window._PIL_TABS_X;') })],
    ['goHub ne rouvre plus Aujourd’hui (l’aide mentirait)', S => ({ ...S, app: remp(S.app, "try{ if(window._pilOuvrirAujourdhui) window._pilOuvrirAujourdhui(); }catch(e){ if(window._mvAvale) window._mvAvale(e,'app.js/goHub#auj'); } ", '') })],
    ['le guide redit « sept onglets »', S => ({ ...S, guide: remp(S.guide, '<b>Tous les onglets</b>\n  suivent cette règle', 'Les <b>sept onglets</b>\n  suivent cette règle') })],
    ['le sous-titre du guide oublie Archives', S => ({ ...S, guide: remp(S.guide, ' · Archives</div></div>', '</div></div>') })],
  ];
  let muettes = 0;
  for (const [lib, f] of DEF) {
    let rougit = false;
    // Une ancre perdue n'est pas un rouge : le défaut n'a pas été posé, la contre-épreuve n'a rien prouvé — MUETTE.
    try { rougit = verifier(f(BASE)).some(([, ok]) => !ok); } catch (e) { rougit = false; console.log('    (' + e.message + ')'); }
    console.log((rougit ? '  rougit   ' : '  MUETTE   ') + lib); if (!rougit) muettes++;
  }
  console.log(muettes ? `AIDE-1 contre-épreuves : ${muettes} MUETTE(S) sur ${DEF.length}` : `AIDE-1 contre-épreuves : ${DEF.length} sur ${DEF.length} rougissent`);
  process.exit(muettes ? 1 : 0);
}
