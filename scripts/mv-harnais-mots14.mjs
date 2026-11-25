/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-14 (§609) : CAVE › AUJOURD'HUI ALLÉGÉ — CHAQUE CHIFFRE À UN SEUL ENDROIT
   Lancer :          node scripts/mv-harnais-mots14.mjs
   Contre-épreuves : node scripts/mv-harnais-mots14.mjs --contre

   POURQUOI IL EXISTE
   Mesuré (démo, 24/11) : l'écran d'arrivée de la Cave redisait ses chiffres. Le sommaire répétait la bande de la Cave
   (« À faire », « Fûts ») ; le détail d'aujourd'hui, dans les quatre semaines, listait une seconde fois les cinq gestes de
   « Ce qui presse » puis une phrase pour dire de les faire là-haut ; « Derniers gestes » répétait « Déjà fait aujourd'hui ».
   Deux phrases de 15 mots et plus : « Pas de relevé… Puis : 1 cuvée à ouiller · 2 cuvées ont fini leur malo. » et
   « Calculé sur 3 cuves suivies et 4 cuvées en élevage, avec le seuil d'ouillage… ». Et deux nombres faux dans le
   sommaire : « À faire 6 » quand la bande disait 5 (il comptait la fin de fermentation estimée, que la règle CAVEAUJ-1
   dit ne pas être un geste), « À surveiller 4 » pour deux lignes (« class="caj-asi » attrapait aussi l'icône
   « caj-asic »). Maquette validée (« go », 25/11) avec ses quatre recommandations :
   docs/maquettes/maquette-cave-aujourdhui-v1.html.

   CE QU'IL GARDE
   ① le sommaire, JOUÉ : « À faire » et « Fûts » sans nombre (la bande les dit), les quatre autres avec le leur ;
      « À surveiller » compte des lignes, JOUÉ sur le balisage réel de _aujVeille ;
   ② « Ce qui presse » : la raison seule sous le verdict (le Pilotage garde ses pastilles « Puis ») ; le pied
      « Calculé sur… » parti, le « i » monté à côté du titre, la méthode dedans ;
   ③ le détail d'un jour, JOUÉ : aujourd'hui, le nombre de gestes et le chemin vers « Ce qui presse », seulement ce qui
      n'est pas un geste en liste ; un autre jour, tout ;
   ④ « Derniers gestes », JOUÉ : à partir d'hier ; « Rien d'autre » quand seul aujourd'hui a des gestes ; sur ordinateur,
      des colonnes d'au moins 120 px (trois colonnes fixes faisaient 72 px à 1024 : « Gevrey-Chambertin » sortait de la carte) ;
   ⑤ « À surveiller » : deux lignes plus courtes, les mêmes chiffres ;
   ⑥ l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { cave: lire('src/cave.js'), css: lire('src/styles.css'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'),
  idx: lire('index.html'), pil: lire('src/pilotage.js'), guide: lire('guide/08-cave.html'), liste: lire('scripts/mv-harnais-liste.mjs'),
  lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-cave-aujourdhui-v1.html') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const ligne = (src, debut) => { const i = src.indexOf(debut); if (i < 0) throw new Error('ligne absente : ' + debut.slice(0, 50)); return src.slice(i, src.indexOf('\n', i)); };
const texte = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const esc = (x) => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BASE = () => ({ _escHtml: esc, _escAttr: esc, _mvIcon: (n) => '<svg data-i="' + n + '"></svg>', window: {} });

function sommaire(S, N) {
  const ctx = BASE(); vm.createContext(ctx); vm.runInContext(corps(S.cave, '_aujSommaireHtml'), ctx);
  return ctx._aujSommaireHtml(N);
}
// La ligne réelle de _aujRender qui compte « À surveiller », jouée sur le balisage réel de _aujVeille (deux lignes, deux icônes).
function veille(S) {
  const ctx = { ...BASE(), _AUJ_N: {}, from: '2026-10-27', parc: {}, _mlSansDate: () => [], _aujInjectCss: () => {},
    _aujMaceration: (c) => (c.mac ? { prevu: 7, jours: 8 } : null), _vendIsActive: () => true, _mlProjFA: (c) => (c.mac ? null : { etat: 'normal', date: '2026-10-29', d20: 1007, pente: 7, marge: 1 }),
    _mlEcartJ: () => 2, _mlFrJ: () => 'jeu 29', _AUJ_ICO: {}, CAVE_VENDANGE: { cuves_vinif: [{ nom: 'Cuve 5', mac: 1 }, { nom: 'Cuve 3' }] }, CAVE_ELEVAGE: { cuvees: [] } };
  vm.createContext(ctx);
  vm.runInContext(corps(S.cave, '_aujVeille') + '\n' + ligne(S.cave, '  var _veil=_aujVeille(from,parc); _AUJ_N.veille=') + '\nthis.h=_veil;', ctx);
  return { n: ctx._AUJ_N.veille, h: ctx.h };
}
function detail(S, d, it) {
  const ctx = { ...BASE(), _aujJourLong: (x) => (x === '2026-10-27' ? 'Mardi 27 octobre' : 'Jeudi 29 octobre'),
    _ML_LBL: { fa: 'Fin de fermentation', malo: 'Malo' }, _AUJ_VERBE: { mesure: 'Relever', ouillage: 'Ouiller', soutirage: 'Soutirer' } };
  vm.createContext(ctx);
  vm.runInContext(ligne(S.cave, 'var _ML_INFO=') + '\n' + corps(S.cave, '_mlGestes') + '\n' + corps(S.cave, '_aujDetail'), ctx);
  return ctx._aujDetail(d, it, '2026-10-27');
}
const ITEMS = () => [{ kind: 'mesure', titre: 'Cuve 7', date: '2026-10-27' }, { kind: 'ouillage', titre: 'Fixin 1er Cru', detail: '3 fûts', date: '2026-10-27' },
  { kind: 'soutirage', titre: 'Gevrey VV', date: '2026-10-27' }, { kind: 'fa', titre: 'Cuve 3', detail: 'fin de fermentation estimée · ± 1 j', date: '2026-10-27' }];
function recents(S, ev) {
  const ctx = { ...BASE(), _aujTout: false, _aujRecents: () => ev,
    _mlEcartJ: (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000), _aujJourLong: (d) => ({ '2026-10-27': 'Mardi 27 octobre', '2026-10-26': 'Lundi 26 octobre', '2026-10-25': 'Dimanche 25 octobre' })[d] };
  vm.createContext(ctx); vm.runInContext(corps(S.cave, '_aujRecentsHtml'), ctx);
  return ctx._aujRecentsHtml('2026-10-27');
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const C = sansCom(S.cave);
  let R = ''; try { R = sansCom(corps(S.cave, '_aujRender')); } catch (e) { R = ''; }

  // ①
  essai('① le sommaire : « À faire » et « Fûts » sans nombre, les quatre autres avec le leur, dans l’ordre', () => {
    const h = sommaire(S, { presse: 5, cuves: 3, veille: 2, releves: 0 });
    const L = ['Ce qui presse<b>5</b>', 'À faire</a>', 'Cuves<b>3</b>', 'Fûts</a>', 'À surveiller<b>2</b>', 'Relevés du jour<b>0</b>'];
    return [L.every((x, i) => h.indexOf(x) > 0 && (i === 0 || h.indexOf(x) > h.indexOf(L[i - 1]))) && (h.match(/<b>/g) || []).length === 4, h];
  });
  T('① _aujRender ne pose plus de nombre pour « À faire » ni « Fûts » (la bande les compte, en gestes)',
    R.includes('_AUJ_N={ presse:auj.length, cuves:nSu, releves:faits.length, veille:0 };') && !/_AUJ_N=\{[^}]*(semaine|futs)/.test(R));
  essai('① « À surveiller » compte des lignes : 2 pour deux lignes (pas les icônes)', () => { const v = veille(S); return [v.n === 2 && (v.h.match(/caj-asic/g) || []).length === 2, JSON.stringify(v).slice(0, 300)]; });

  // ②
  T('② sous le verdict, la raison seule ; le Pilotage garde ses pastilles « Puis »', R.includes("<p class=\"caj-why\">'+_escHtml(v.why||v.s)+'</p>'")
    && !R.includes("_escHtml(v.s)+'</p>'") && C.includes('return {cls:first.cls, t:first.t, s:s, why:first.why, puis:suite};') && S.pil.includes('v.puis'));
  T('② le pied « Calculé sur… » est parti, de la page et de la feuille de style', !R.includes('caj-cadre') && !/Calcul\\u00e9 sur '/.test(C) && !S.css.includes('.caj-cadre'));
  T('② le « i » de « Ce qui presse » est à côté du titre', R.includes("'Ce qui presse'+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('cave.auj'):'')+'</span>"));
  T('② le « i » dit sur quoi porte le calcul et où lire la suite', S.uti.includes('Le calcul porte sur les <b>cuves suivies</b> du Cuvier et les <b>cuvées en élevage</b> du Chai')
    && S.uti.includes('ce qui suit se lit dans la liste du jour et dans les quatre semaines'));

  // ③
  essai('③ aujourd’hui : « 3 gestes à faire », le chemin vers « Ce qui presse », la fin estimée seule en liste', () => {
    const h = detail(S, '2026-10-27', ITEMS()), t = texte(h);
    return [t.includes('3 gestes à faire') && h.includes("_aujVers('caj-titre')") && t.includes('Fin de fermentation · Cuve 3')
      && !t.includes('Cuve 7') && !t.includes('Fixin') && !t.includes('Gevrey') && !t.includes('se font depuis'), t];
  });
  essai('③ aujourd’hui sans fin estimée : pas de liste vide', () => { const h = detail(S, '2026-10-27', ITEMS().slice(0, 2)); return [texte(h).includes('2 gestes à faire') && !h.includes('<ul>'), h]; });
  essai('③ un autre jour garde tout son détail', () => {
    const t = texte(detail(S, '2026-10-29', ITEMS().map((x) => ({ ...x, date: '2026-10-29' }))));
    return [t.includes('Cuve 7') && t.includes('Fixin') && t.includes('Gevrey') && t.includes('Cuve 3') && !t.includes('gestes à faire'), t];
  });
  essai('③ un jour vide : « Rien de prévu ce jour-là. »', () => texte(detail(S, '2026-10-29', [])).includes('Rien de prévu ce jour-là.'));
  T('③ la phrase « Les gestes du jour se font depuis… » a disparu', !/Les gestes du jour se font depuis/.test(C));

  // ④
  const E = [{ d: '2026-10-27', t: 'Relevé', q: 'Cuve 3', ic: 'thermometre' }, { d: '2026-10-26', t: 'Ouillage', q: 'Fixin 1er Cru', ic: 'goutte' }, { d: '2026-10-25', t: 'Soutirage', q: 'Gevrey VV', ic: 'barrique' }];
  essai('④ « Derniers gestes » commence à hier : pas d’« Aujourd’hui », hier et avant-hier, « Tout voir (2) »', () => {
    const h = recents(S, E), t = texte(h);
    return [!t.includes('Aujourd’hui') && !t.includes('Cuve 3') && t.includes('Hier · lundi 26') && t.includes('Fixin 1er Cru') && t.includes('Gevrey VV') && t.includes('Tout voir (2)'), t];
  });
  essai('④ seul aujourd’hui a des gestes : « Rien d’autre ces dix derniers jours. »', () => texte(recents(S, E.slice(0, 1))).includes('Rien d’autre ces dix derniers jours.'));
  essai('④ aucun geste : « Aucun geste ces dix derniers jours. »', () => texte(recents(S, [])).includes('Aucun geste ces dix derniers jours.'));
  T('④ sur ordinateur, des colonnes d’au moins 120 px (deux à 1024 et 1280, trois dès 1366) et un nom long qui passe à la ligne',
    S.css.includes('  #page-cave .caj-ed{ display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr));') && S.css.includes('  #page-cave .caj-edt{ overflow-wrap:anywhere; }'));
  T('④ le Pilotage lit toujours _aujRecents entière (aujourd’hui compris)', C.includes('recents:_aujRecents(auj),') && S.pil.includes('(Y.recents||[]).slice(0,12)'));

  // ⑤
  essai('⑤ « À surveiller » : deux lignes plus courtes, les mêmes chiffres', () => {
    const t = texte(veille(S).h);
    return [t.includes('8 jours en cuve, 7 prévus.') && t.includes('1007, −7 par jour, à 1 j près.') && t.includes('jeu 29') && !t.includes('prévus à la création') && !t.includes('Densité 1007'), t];
  });

  // ⑥
  T('⑥ l’aide : la raison seule, le sommaire sans nombre pour « À faire » et « Fûts », le détail d’aujourd’hui, Derniers gestes à partir d’hier',
    S.uti.includes('puis pourquoi, en une phrase. Dessous,') && S.uti.includes('« À faire » et « Fûts » n’y ont pas de nombre, les quatre chiffres de la Cave le donnent juste au-dessus')
    && S.uti.includes('pour aujourd’hui, le nombre de gestes et le chemin vers « Ce qui presse »') && S.uti.includes('« Derniers gestes », sur dix jours, à partir d’hier'));
  T('⑥ le guide dit les mêmes choses', S.guide.includes('Dessous, pourquoi, en une phrase ;') && S.guide.includes('sauf « À faire » et « Fûts », que les quatre chiffres juste au-dessus donnent déjà')
    && S.guide.includes('pour aujourd\'hui, il dit combien de gestes attendent et mène à « Ce qui presse »') && S.guide.includes('à partir d\'hier et du plus récent au plus ancien'));
  const iW = S.wn.indexOf("{ v: '11.30'"), jW = S.wn.indexOf("{ v: '11.29'");
  T('⑥ l’annonce 11.30, pour l’administrateur seulement', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin']") && S.wn.slice(iW, jW).includes('Aujourd'));
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑥ les versions : APP 11.30 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.30 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && S.sw.includes('// v12.21 (25/11/2026) — MOTS-14 (§609)'));
  T('⑥ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('Cave › Aujourd’hui') && S.lm.includes('maquette-cave-aujourdhui-v1.html'));
  T('⑥ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots14.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots14.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-14 (§609) — Cave › Aujourd’hui allégé\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['« À faire » reprend un nombre', sur('cave', "['caj-semaine','\\u00c0 faire',null]", "['caj-semaine','\\u00c0 faire',N.semaine]")],
    ['« Fûts » reprend un nombre', sur('cave', "['caj-ch-t','F\\u00fbts',null]", "['caj-ch-t','F\\u00fbts',N.futs]")],
    ['« Cuves » perd le sien', sur('cave', "['caj-cv-t','Cuves',N.cuves]", "['caj-cv-t','Cuves',null]")],
    ['_aujRender recompte les gestes de la semaine', sur('cave', '_AUJ_N={ presse:auj.length, cuves:nSu,', '_AUJ_N={ presse:auj.length, semaine:0, cuves:nSu,')],
    ['« À surveiller » recompte les icônes', sur('cave', '_AUJ_N.veille=(_veil.match(/<li class="caj-asi[ "]/g)||[]).length;', '_AUJ_N.veille=(_veil.match(/class="caj-asi/g)||[]).length;')],
    ['« Puis : … » revient sous le verdict', sur('cave', "<p class=\"caj-why\">'+_escHtml(v.why||v.s)+'</p>'", "<p class=\"caj-why\">'+_escHtml(v.s)+'</p>'")],
    ['le Pilotage perd ses pastilles', sur('cave', 'why:first.why, puis:suite};', 'why:first.why};')],
    ['le Pilotage ne lit plus hier et aujourd’hui', sur('cave', 'recents:_aujRecents(auj),', 'recents:[],')],
    ['le pied « Calculé sur… » revient', sur('cave', "    +'</section>'+_aujEtat(from,parc)+'</div>'", "    +'<p class=\"caj-cadre\"><i></i><span>Calcul\\u00e9 sur '+nSu+' cuves.</span></p></section>'+_aujEtat(from,parc)+'</div>'")],
    ['le « i » quitte le titre', sur('cave', "'Ce qui presse'+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('cave.auj'):'')+'</span>", "'Ce qui presse</span>")],
    ['le « i » ne dit plus sur quoi porte le calcul', sur('uti', 'Le calcul porte sur les <b>cuves suivies</b> du Cuvier', 'Le calcul porte sur le Cuvier')],
    ['le détail d’aujourd’hui relit les gestes', sur('cave', "  if(d===auj){ nG=_mlGestes(it).length; it=it.filter(function(x){ return _ML_INFO[x.kind]; }); }", "  if(d===auj){ nG=_mlGestes(it).length; }")],
    ['le détail d’aujourd’hui ne mène plus à « Ce qui presse »', sur('cave', "onclick=\"_aujVers(\\'caj-titre\\')\">Ce qui presse'", "onclick=\"_aujVers(\\'caj-semaine\\')\">Ce qui presse'")],
    ['le détail d’un autre jour est réduit aussi', sur('cave', '  if(d===auj){ nG=_mlGestes(it).length;', '  if(d){ nG=_mlGestes(it).length;')],
    ['une liste vide reste affichée', sur('cave', "  if(!it.length) return h+'</div>';\n  h+='<ul>'", "  h+='<ul>'")],
    ['« Derniers gestes » reprend aujourd’hui', sur('cave', 'ev=tous.filter(function(e){ return e.d!==auj; })', 'ev=tous')],
    ['trois colonnes fixes reviennent (72 px à 1024)', sur('css', 'grid-template-columns:repeat(auto-fill,minmax(120px,1fr));', 'grid-template-columns:repeat(3,minmax(0,1fr));')],
    ['le nom long ne passe plus à la ligne', sur('css', '  #page-cave .caj-edt{ overflow-wrap:anywhere; }', '')],
    ['« Rien d’autre » devient « Aucun geste »', sur('cave', "(tous.length?'Rien d\\u2019autre ces dix derniers jours.'", "(0?'Rien d\\u2019autre ces dix derniers jours.'")],
    ['la macération reparle longuement', sur('cave', "s:x.jours+' jours en cuve, '+x.prevu+' pr\\u00e9vus.'", "s:x.prevu+' jours pr\\u00e9vus \\u00e0 la cr\\u00e9ation de la cuve, '+x.jours+' jours en cuve aujourd\\u2019hui.'")],
    ['la fin proche redit sa date', sur('cave', "s:Math.round(p.d20)+', \\u2212'+String(p.pente).replace('.',',')+' par jour, \\u00e0 '", "s:'Densit\\u00e9 '+Math.round(p.d20)+', \\u2212'+String(p.pente).replace('.',',')+' par jour, \\u00e0 '")],
    ['l’aide redit « puis ce qui suit »', sur('uti', 'puis pourquoi, en une phrase. Dessous,', 'puis pourquoi, puis ce qui suit. Dessous,')],
    ['le guide dit encore « chacun avec son nombre »', sur('guide', 'sauf « À faire » et « Fûts », que les quatre chiffres juste au-dessus donnent déjà', 'chacun avec son nombre')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("{ v: '11.30'"); const j = S.wn.indexOf("pour: ['admin']", i); if (i < 0 || j < 0) throw new Error('motif absent : annonce'); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.21 (25/11/2026) — MOTS-14 (§609)', '// v12.21 (25/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-cave-aujourdhui-v1.html', 'maquette-cave-aX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots14.mjs']", "['node scripts/mv-harnais-mots14Z.mjs']")],
  ];
  let bons = 0, mal = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { mal++; console.log('  \x1b[31m✗\x1b[0m non injecté (' + e.message + ') : ' + nom); continue; }
    let r; try { r = suite(S); } catch (e) { r = [['plantage', false]]; }
    const k = r.filter((x) => !x[1]).length;
    if (k > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + k + ')'); } else { mal++; console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom); }
  }
  console.log('\n' + (mal ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves rougissent');
  process.exit(mal ? 1 : 0);
}
