/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-11 (§604) : PILOTAGE › CONFORMITÉ ALLÉGÉ SUR PLACE — UNE PHRASE, CINQ CARTES REPLIÉES
   Lancer :          node scripts/mv-harnais-mots11.mjs
   Contre-épreuves : node scripts/mv-harnais-mots11.mjs --contre

   POURQUOI IL EXISTE
   Le dernier des quatre onglets restés dans le Pilotage (décision du 17/11). Mesuré (démo) : 90 mots — l'onglet le plus court —,
   mais rien ne disait d'un coup d'œil ce qui est à régler : le sous-titre « cuivre, IFT et délai de rentrée » oubliait la
   protection et le registre ; la protection était une grande carte toujours ouverte, d'un autre dessin (1,4 écran au téléphone) ;
   des repères à décoder (« ↑ 2 », « — », « 0 actif ») ; le registre recopiait la fenêtre d'export (218 mots ouvert) ; « restante »
   hors du lexique. Maquette validée (« Go », 23/11) avec ses trois recommandations : docs/maquettes/maquette-conformite-v1.html.

   CE QU'IL GARDE
   ① l'onglet : la règle des cartes allégées (.pil-tv.pil-cf), la protection en carte comme les autres, le repli s'il n'y a rien ;
   ② la phrase du haut : le délai de rentrée en cours, les parcelles à nu (ou bientôt), les points à régler — LA LISTE de la tuile
      d'Aujourd'hui (_pilCfmPoints) ; « Rien à régler » sinon ; aucun calcul de plus ;
   ③ la protection : « Protection », « 8 parcelles » et la pastille (à nu, à nu d'ici 2 jours, protégées), l'hectare dessous, la
      liste, les réglages en pied, « Ouvrir les traitements » (Phyto › Registre) ; repliée par défaut ;
   ④ les pastilles : cuivre (au-dessus, en vigilance, sous le plafond), IFT (catalogue absent ; au-dessus, sous la référence),
      registre (la mention de COHER-1 ; prêt pour le contrôle), délai de rentrée (aucune parcelle en délai ; rentrée interdite) ;
      « Conforme » ne se répète plus ; la formule de l'IFT et le paragraphe des délais légaux quittent l'écran pour le « i » ;
   ⑤ le registre en résumé (registre.js/_regCarte) : les points à compléter, un compte, le bouton ; joué ;
   ⑥ le lexique ; l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { pil: lire('src/pilotage.js'), reg: lire('src/registre.js'), uti: lire('src/utils.js'), pcss: lire('src/pilotage.css'),
  wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'),
  lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-conformite-v1.html') };
function corps(src, nom, pre) {
  const i = src.indexOf((pre || 'function ') + nom); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const texte = (h) => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const BASE = ['_pilEsc', '_pilStat', '_pilPhPl', '_pilTvBtn', '_pilHa', '_pilNum'];
function monter(S, noms, extra, glob) {
  const code = (glob || '') + BASE.concat(noms).map((n) => corps(S.pil, n + '(')).join('\n') + '\nthis.api={' + BASE.concat(noms).map((n) => n + ':' + n).join(',') + '};';
  const ctx = Object.assign({ Math, Number, String, Array, Object, Date, JSON, isFinite, isNaN, parseInt, parseFloat,
    _mvIcon: () => '<svg class="ic"></svg>', _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '">i</button>', window: {},
    _pilTile: (id, dot, title, stat, sub, g, body, info) => '<tile id="' + id + '" info="' + info + '"><h>' + title + '</h>' + stat + '<sub>' + (sub || '') + '</sub>' + body + '</tile>' }, extra || {});
  vm.createContext(ctx); vm.runInContext(code, ctx); ctx.api.ctx = ctx; return ctx.api;
}
const PROT = (o = {}) => Object.assign({ n: 8, rows: [], nu: [1, 2, 3, 4, 5, 6, 7, 8], bientot: [], haNu: 7.02 }, o);

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const P = sansCom(S.pil), TC = sansCom(corps(S.pil, '_pilTabCfm('));

  // ① l'onglet
  T('① l’onglet : la règle des cartes allégées, la protection en carte (_pilProtTuile), le repli s’il n’y a rien',
    TC.includes("var H='<div class=\"pil-tv pil-cf\"><div class=\"pil-panels\">', any=false;") && TC.includes("var _pcar=_pilProtTuile();") && TC.includes("  H+='</div></div>';")
    && !/function _pilProtCarte\(/.test(P) && !/pil-tile2/.test(corps(S.pil, '_pilProtTuile(')));
  T('① la phrase prend la sous-ligne, après les cartes', P.includes("    host.innerHTML=_pilTabCfm(d);\n    var _phC=document.getElementById('pil-souslig-t'); if(_phC) _phC.innerHTML=_pilCfPhrase();")
    && P.includes("((tab==='avc'||tab==='equ'||tab==='sim'||tab==='cfm')?' pil-tv-souslig':'')"));

  // ② la phrase
  const PH = (o) => monter(S, ['_pilCfPhrase'], { _pilShow: () => true, _cfmDre: () => ({ active: Array(o.dre || 0).fill({}) }), _pilProtData: () => o.prot, _pilCfmPoints: () => o.pts || [] })._pilCfPhrase();
  essai('② « 8 parcelles à nu, 2 points à régler » (rouge, orange)', () => {
    const h = PH({ prot: PROT(), pts: [{}, {}] });
    return [texte(h) === '8 parcelles à nu , 2 points à régler' && /<b class="ko">8 parcelles/.test(h) && /<b class="or">2 points/.test(h), texte(h)];
  });
  essai('② … le délai de rentrée d’abord ; « à nu d’ici 2 jours » ; « Rien à régler »', () => {
    const a = texte(PH({ dre: 1, prot: PROT({ nu: [], bientot: [1, 2] }), pts: [{}] }));
    const b = texte(PH({ prot: PROT({ nu: [], bientot: [] }), pts: [] }));
    return [a === '1 parcelle en délai de rentrée , 2 parcelles à nu d’ici 2 jours , 1 point à régler' && b === 'Rien à régler', a + ' | ' + b];
  });
  T('② la phrase lit les calculs des cartes et la liste de la tuile d’Aujourd’hui (_pilCfmPoints), sans en refaire', (() => { const c = corps(S.pil, '_pilCfPhrase('); return /_pilCfmPoints\(\)/.test(c) && /_pilProtData\(\)/.test(c) && /_cfmDre\(\)/.test(c) && !/_regVerif|_iftCalc|_cfmCuivre/.test(c); })());

  // ③ la protection
  essai('③ l’en-tête : « 8 parcelles » et « à nu », l’hectare ; « à nu d’ici 2 jours » ; « protégées »', () => {
    const a = monter(S, ['_pilProtTete']);
    const t1 = a._pilProtTete(PROT()), t2 = a._pilProtTete(PROT({ nu: [], bientot: [1, 2] })), t3 = a._pilProtTete(PROT({ nu: [], bientot: [], rows: [1, 2, 3] }));
    return [texte(t1.stat) === '8 parcelles à nu' && /pil-tv-pl ko/.test(t1.stat) && texte(t1.sub) === '7,02 ha sans protection' && /pil-tv-pl or">à nu d’ici 2 jours/.test(t2.stat)
      && texte(t3.stat) === '3 parcelles protégées' && /pil-tv-pl ok/.test(t3.stat) && t3.sub === null, [t1.stat, t2.stat, t3.stat].map(texte).join(' | ')];
  });
  const PT = sansCom(corps(S.pil, '_pilProtTuile(')), PHH = sansCom(corps(S.pil, '_pilProtHtml('));
  T('③ la carte : « Protection », la fiche « i », la liste et les réglages en pied, « Ouvrir les traitements »', PT.includes("return _pilTile('prot','#B85A1A','Protection',T.stat,T.sub,null,_pilProtHtml(P),'pil.prot');")
    && PHH.includes("var pied='<div class=\"pil-li-s pil-prot-pied\">rémanences '") && PHH.includes("+pied+'<div class=\"pil-tv-act\">'+_pilTvBtn('traitements','Ouvrir les traitements')+'</div></div>';")
    && !/pil-prot-big/.test(PHH));
  T('③ repliée par défaut ; « Ouvrir les traitements » mène à Phyto › Registre', /collapsed:\{[^}]*,prot:1\}/.test(P)
    && /if\(cible==='traitements'\)\{\n\s*if\(window\.goTo\) window\.goTo\('phyto'\);[^]*?window\.switchPhytoTab\('reg'\)/.test(corps(S.pil, '_pilTvGo(')));

  // ④ les pastilles
  T('④ le cuivre : la pastille (au-dessus, en vigilance, sous le plafond), plus « ↑ » ni « Conforme » ligne à ligne', TC.includes("var sw=cu.over?_pilPhPl(cu.over+' au-dessus du plafond','ko'):(cu.warn?_pilPhPl(cu.warn+' en vigilance','or'):_pilPhPl('sous le plafond','ok'));")
    && TC.includes("var st=r.ratio>1?'D\\u00e9passement \\u00b7 ':r.ratio>=0.875?'Vigilance \\u00b7 ':'';") && !/'Conforme'/.test(TC) && !/\\u2191 '\+cu\.warn/.test(TC));
  const IF = sansCom(corps(S.pil, '_pilIftTuile('));
  T('④ l’IFT : « 3 passages » et « catalogue E-Phy absent » ; l’écart en pastille ; la formule quitte l’écran', IF.includes("_pilStat(R.nPass,' passage'+(R.nPass>1?'s':''))+_pilPhPl(_cfmIftPoint(R),'or')")
    && IF.includes("hb>rv?_pilPhPl(Math.round((hb/rv-1)*100)+' % au-dessus de la référence','ko'):_pilPhPl('sous la référence','ok')") && !/Dose appliquée ÷/.test(IF) && !/rouvrez cet onglet/.test(IF));
  T('④ le registre : la mention en pastille, « prêt pour le contrôle » ; « 3 traitements » sans « au format du registre électronique »',
    S.pil.includes("_pilStat(V.nLignes,' ligne'+(V.nLignes>1?'s':''))+(V.nLignes?(_av?_pilPhPl(_av,'or'):_pilPhPl('pr\\u00eat pour le contr\\u00f4le','ok')):'')") && !/au format du registre \\u00e9lectronique/.test(sansCom(corps(S.pil, '_pilPanelPhyto('))));
  T('④ le délai de rentrée : « 0 » et « aucune parcelle en délai », une ligne ; actif : « rentrée interdite » et le bouton',
    TC.includes("_pilStat('0','')+_pilPhPl('aucune parcelle en d\\u00e9lai','ok'), null, null, '<div class=\"pil-empty\" style=\"font-style:normal\">Toutes les parcelles sont accessibles.</div>'")
    && TC.includes("_pilPhPl('rentr\\u00e9e interdite','ko'), null, null, body3+'<div class=\"pil-tv-act\">'+_pilTvBtn('traitements','Ouvrir les traitements')+'</div>'") && !/' actif'/.test(TC));

  // ⑤ le registre en résumé, joué
  essai('⑤ le registre en résumé : les points à compléter, « Les 5 autres points : en règle · 2 facultatifs à compléter », le bouton, plus le verdict ni l’échéance', () => {
    const c = corps(S.reg, '_regCarte = function ', 'window.');
    const ctx = { _regAnnee: () => 2026, _regFenAn: () => ({ k: 'civ2026' }), isAdmin: () => true, _escAttr: (x) => x, _escHtml: (x) => x,
      _regPl: (n, un, des) => n + '\u00a0' + (n > 1 ? des : un), _regVerdictHtml: () => '<div data-reg="verdict"></div>', _regPointHtml: (p) => '<pt>' + p.t + '</pt>',
      _regPoints: () => [{ t: 'SIRET', niv: 'manque' }, { t: 'Date', niv: 'ok' }, { t: 'Loc', niv: 'ok' }, { t: 'Stade', niv: 'conseil' }, { t: 'Surf', niv: 'ok' }, { t: 'Hor', niv: 'rien' }, { t: 'Rent', niv: 'rien' }, { t: 'Cible', niv: 'conseil' }],
      window: { _regVerif: () => ({ nLignes: 10 }), _regVerdict: () => ({ ok: false }) } };
    vm.createContext(ctx); vm.runInContext(c.replace(/^window\./, 'var R=window.') + ';', ctx);
    const G = ctx.window._regCarte(), t = texte(G.corps);
    return [(G.corps.match(/<pt>/g) || []).length === 1 && t.includes('Les 5 autres points : en règle · 2 facultatifs à compléter') && t.includes('Voir les lignes et exporter 2026')
      && !G.corps.includes('data-reg="verdict"') && !/31 janvier/.test(S.reg.slice(S.reg.indexOf('window._regCarte'), S.reg.indexOf('window._regCarte') + 2500)), t];
  });
  T('⑤ les délais légaux et les huit points vivent dans le « i » (pil.phyto) et la fenêtre', S.uti.includes('avant le 31 janvier</b> de l\\u2019année suivante') && S.uti.includes('« Voir les lignes et exporter » ouvre les <b>huit points</b> de contrôle'));

  // ⑥
  const chaines = (['_pilCfPhrase(', '_pilProtTete(', '_pilProtTuile(', '_pilTabCfm(', '_pilIftTuile('].map((n) => sansCom(corps(S.pil, n))).join('\n').match(/'(?:[^'\\]|\\.)*'/g) || []).join(' ');
  const hors = chaines.match(/restante|pour finir|au champ|' ?~ |\\u2248|≈/);
  T('⑥ les mots du lexique (§580c) : plus « restante », « ~ », « ≈ »', !hors && S.pil.includes("['auj_traiter','Protection des parcelles (fenêtre de traitement)']") && S.uti.includes("'pil.prot': { t: 'La protection des parcelles'"), hors ? hors[0] : '');
  T('⑥ l’aide : Conformité se lit d’un coup d’œil', S.uti.includes("['Conformité', \"se lit d’un coup d’œil : une phrase en haut"));
  T('⑥ le guide : la phrase, la carte Protection, le registre en résumé', S.guide.includes('En haut, une phrase : « 8 parcelles à nu, 2 points à régler »') && S.guide.includes('<li><b>Protection</b> : les parcelles à nu')
    && S.guide.includes('la carte montre ce qui manque, puis un') && !S.guide.includes('Sous la décision du jour, dans sa propre carte, la <b>protection restante</b>'));
  const iW = S.wn.indexOf("{ v: '11.27'"), jW = S.wn.indexOf("{ v: '11.26'");
  T('⑥ l’annonce 11.27, pour l’administrateur seulement', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin']") && S.wn.slice(iW, jW).includes('Ouvrir les traitements'));
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑥ les versions : APP 11.27 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.27 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && S.sw.includes('// v12.18 (23/11/2026) — MOTS-11 (§604)'));
  T('⑥ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('Pilotage — Conformité') && S.lm.includes('maquette-conformite-v1.html'));
  T('⑥ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots11.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots11.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-11 (§604) — Pilotage › Conformité allégé sur place\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['l’onglet perd la règle des cartes allégées', sur('pil', "var H='<div class=\"pil-tv pil-cf\"><div class=\"pil-panels\">', any=false;", "var H='<div class=\"pil-panels\">', any=false;")],
    ['la protection redevient la grande carte', sur('pil', "var _pcar=_pilProtTuile();", "var _pcar=_pilProtCarte();")],
    ['la phrase ne prend plus la sous-ligne', sur('pil', "    var _phC=document.getElementById('pil-souslig-t'); if(_phC) _phC.innerHTML=_pilCfPhrase();", '')],
    ['la phrase oublie les parcelles à nu', sur('pil', "      if(nNu) p.push('<b class=\"ko\">'+nNu+' parcelle'+pl(nNu)+' \\u00e0 nu</b>');", "      if(false) p.push('');")],
    ['la phrase recompte le registre au lieu de la liste d’Aujourd’hui', sur('pil', "var pts=[]; try{ pts=_pilCfmPoints(); }", "var pts=[]; try{ pts=window._regVerif()?[]:_pilCfmPoints(); }")],
    ['la phrase ne dit plus « Rien à régler »', sur('pil', "(p.length?p.join(', '):'Rien \\u00e0 r\\u00e9gler')", "(p.length?p.join(', '):'')")],
    ['la protection perd sa pastille', sur('pil', "  if(nNu) return { stat:_pilStat(nNu,' parcelle'+pl(nNu))+_pilPhPl('à nu','ko'),", "  if(nNu) return { stat:_pilStat(nNu,' parcelle'+pl(nNu)),")],
    ['« Ouvrir les traitements » part de la protection', sur('pil', "+pied+'<div class=\"pil-tv-act\">'+_pilTvBtn('traitements','Ouvrir les traitements')+'</div></div>';", "+pied+'</div>';")],
    ['le bouton ne mène nulle part', sur('pil', "    if(cible==='traitements'){", "    if(cible==='traitementsZ'){")],
    ['la protection arrive ouverte', sur('pil', ',ordrepassage:1,prot:1},', ',ordrepassage:1},')],
    ['« ↑ 2 » revient sur le cuivre', sur('pil', "var sw=cu.over?_pilPhPl(cu.over+' au-dessus du plafond','ko'):(cu.warn?_pilPhPl(cu.warn+' en vigilance','or'):_pilPhPl('sous le plafond','ok'));", "var sw=cu.over?_pilPhPl(cu.over+' au-dessus du plafond','ko'):(cu.warn?('\\u2191 '+cu.warn):'');")],
    ['« Conforme » revient sous chaque barre', sur('pil', "r.ratio>=0.875?'Vigilance \\u00b7 ':'';", "r.ratio>=0.875?'Vigilance \\u00b7 ':'Conforme \\u00b7 ';")],
    ['la formule de l’IFT revient à l’écran', sur('pil', "  var methode='';", "  var methode='<div>Dose appliquée ÷ dose homologuée</div>';")],
    ['l’écart de l’IFT redevient une flèche', sur('pil', "hb>rv?_pilPhPl(Math.round((hb/rv-1)*100)+' % au-dessus de la référence','ko'):_pilPhPl('sous la référence','ok')", "hb>rv?('↑ '+Math.round((hb/rv-1)*100)+' %'):''")],
    ['le registre perd sa pastille « prêt pour le contrôle »', sur('pil', "_pilPhPl('pr\\u00eat pour le contr\\u00f4le','ok')", "''")],
    ['« 0 actif » revient', sur('pil', "_pilStat('0','')+_pilPhPl('aucune parcelle en d\\u00e9lai','ok')", "_pilStat('0',' actif')")],
    ['le registre redonne ses huit points', sur('reg', "var corps = (V.nLignes ? dus.map(function (p) { return _regPointHtml(p); }).join('') + compte : _regVerdictHtml(V))", "var corps = (V.nLignes ? _regVerdictHtml(V) + pts.map(function (p) { return _regPointHtml(p); }).join('') + compte : _regVerdictHtml(V))")],
    ['le compte du registre part', sur('reg', "+ compte : _regVerdictHtml(V))", " : _regVerdictHtml(V))")],
    ['« restante » revient', sur('pil', "['auj_traiter','Protection des parcelles (fenêtre de traitement)']", "['auj_traiter','Protection restante (fenêtre de traitement)']")],
    ['le « i » perd les huit points', sur('uti', '« Voir les lignes et exporter » ouvre les <b>huit points</b> de contrôle', '« Voir les lignes et exporter » ouvre les traitements')],
    ['l’aide ne dit pas Conformité', sur('uti', "['Conformité', \"se lit d’un coup d’œil : une phrase en haut", "['Conformité', \"suit le cuivre")],
    ['le guide garde l’ancienne place de la protection', sur('guide', "Dans l'onglet <b>Conformité</b>, la carte <b>Protection</b>", "Sous la décision du jour, dans sa propre carte, la <b>protection restante</b>")],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("{ v: '11.27'"); const j = S.wn.indexOf("pour: ['admin']", i); if (i < 0 || j < 0) throw new Error('motif absent : annonce'); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + "pour: ['admin']".length) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.18 (23/11/2026) — MOTS-11 (§604)', '// v12.18 (23/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-conformite-v1.html', 'maquette-conformite-vX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots11.mjs']", "['node scripts/mv-harnais-mots11Z.mjs']")],
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
