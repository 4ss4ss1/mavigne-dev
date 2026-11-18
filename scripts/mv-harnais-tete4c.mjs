/* ───────────────────────────────────────────────────────
   HARNAIS — TETE-4C (§579) : LE PILOTAGE PREND LE BANDEAU COMMUN
   Lancer :          node scripts/mv-harnais-tete4c.mjs
   Contre-épreuves : node scripts/mv-harnais-tete4c.mjs --contre

   POURQUOI IL EXISTE
   Le haut du Pilotage empilait quatre bandes : l'en-tête, la campagne et la météo, « Vous regardez », les onglets — 218 px sur
   ordinateur, 286 au téléphone, où « Vous regardez » en prenait 132 à lui seul. TETE-4C lui donne les trois lignes de tout le
   monde : la campagne et la météo dans la ligne du module, les onglets DANS l'en-tête, « Vous regardez » en ligne d'écran ; au
   téléphone elle tient en un bouton, qui déplie le choix dessous. Et la page ne défile plus dans elle-même : son en-tête ne
   collait que sur « Aujourd'hui ».
   Ce harnais JOUE _pilHdrHtml (la place de la bande et des onglets), _pilCrumbHtml dans ses trois cadres (ce que dit le bouton),
   _pilPtOuvrir et _mvTeteBas (le bandeau de la démo compte) ; il lit le squelette, le geste et la feuille du bandeau.
   Ce qu'il ne voit pas : les hauteurs à l'écran — elles se mesurent sur l'appli construite (npm run test:ux, test:gabarit).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), css: lire('src/bandeau.css'), uti: lire('src/utils.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
const sansCom = (s) => s.replace(/^\s*\/\/.*$/gm, '');
function finBloc(s, i) { const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { d += m[1] ? -1 : 1; if (!d) return re.lastIndex; } return -1; }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function noeud(cls, id) {
  const n = { className: cls || '', id: id || '', children: [], parentNode: null, attrs: {}, offsetHeight: 0, pos: 'static', top: 'auto',
    classList: { contains: (c) => (' ' + n.className + ' ').includes(' ' + c + ' '), toggle(c, on) { const a = n.className.split(' ').filter((x) => x && x !== c); if (on) a.push(c); n.className = a.join(' '); } },
    appendChild(c) { c.parentNode = n; n.children.push(c); return c; }, setAttribute(k, v) { n.attrs[k] = v; },
    querySelector(sel) { if (sel === '.mod-header + .mv-ecran') { const k = n.children.findIndex((x) => x.classList.contains('mod-header')); const s = k < 0 ? null : n.children[k + 1]; return s && s.classList.contains('mv-ecran') ? s : null; }
      const c = sel.replace(/^\./, ''); return n.children.find((x) => x.classList.contains(c)) || null; } };
  return n;
}
function regles(css, media) {
  const out = []; const re = new RegExp('@media\\s*\\(' + media.replace(/[-:]/g, (c) => '\\' + c) + '\\)\\s*\\{', 'g'); let m;
  while ((m = re.exec(css))) { let k = m.index + m[0].length, p = 1, deb = k; for (; k < css.length && p; k++) { if (css[k] === '{') p++; else if (css[k] === '}') p--; }
    const bloc = css.slice(deb, k - 1); const rr = /([^{}]+)\{([^{}]*)\}/g; let r; while ((r = rr.exec(bloc))) out.push({ sel: r[1].trim().replace(/\s+/g, ' '), corps: r[2] }); }
  return out;
}

function jouer(S) {
  const pil = sansCom(S.pil);
  const css = S.css.replace(/\/\*[\s\S]*?\*\//g, '');
  // ① l'en-tête, JOUÉ : la bande dans la ligne du module (après les titres, avant la roue), les onglets DANS l'en-tête
  {
    const ctx = { window: { isAdmin: () => true }, _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>', _pilHa: (x) => String(x).replace('.', ','),
      _PIL_TABS: [['auj', 'chrono', 'Aujourd’hui'], ['avc', 'liste', 'Travaux'], ['sim', 'balance', 'Décider'], ['eco', 'euro', 'Économie']], _PIL_ZOOM_FIN: 'sim' }; vm.createContext(ctx);
    vm.runInContext(['function _pilEsc(', 'function _pilTabsHtml(', 'function _pilHdrHtml('].map((d) => fonction(S.pil, d)).join('\n'), ctx);
    const H = (meteo) => vm.runInContext('_pilHdrHtml(' + JSON.stringify({ domaine: 'Domaine <A>', nActives: 8, surfTot: 7.02, saison: 'Hiver 2026', meteo }) + ',"avc")', ctx);
    const h = H(true), iT = h.indexOf('<div class="mod-header-top">'), fT = finBloc(h, iT), top = h.slice(iT, fT), reste = h.slice(fT);
    const iTi = top.indexOf('<div class="mod-header-titles">'), fTi = finBloc(top, iTi), apres = top.slice(fTi);
    t('① jouée : UN seul bloc — l’en-tête se ferme après les onglets, rien ne le suit', h.startsWith('<div class="mod-header h-pilotage">') && finBloc(h, 0) === h.length);
    t('①bis la bande (campagne, date, météo) est DANS la ligne du module, juste après les titres ; la roue vient après elle', /^<div class="mod-meta-row mvu-meta mvu-avec-meteo">/.test(apres) && apres.indexOf('id="pil-regl-gear"') > apres.indexOf('id="pil-meteo"') && (h.match(/class="mod-meta-row/g) || []).length === 1 && !/mod-meta-row/.test(reste));
    t('①ter les onglets sont dans l’en-tête, après la ligne du module ; l’onglet ouvert est marqué ; plus de barre .pil-tabsbar', /^<div class="mvu-tabs mvu-pil" id="pil-tabs">/.test(reste) && /<button class="mvu-tab active" data-tab="avc">/.test(reste) && !/pil-tabsbar/.test(h));
    t('①quater les repères lus ailleurs sont là (#pil-dom-nom, #pil-saison, #pil-meteo, #pil-regl-gear), le nom du domaine échappé', ['id="pil-dom-nom"', 'id="pil-saison"', 'id="pil-meteo"', 'id="pil-regl-gear"'].every((x) => h.includes(x)) && h.includes('Domaine &lt;A&gt;') && /<div class="hv2-date" data-mv-date>/.test(h));
    t('①quinquies sans météo, la bande ne se dit pas « avec météo » et la pastille est cachée', /<div class="mod-meta-row mvu-meta">/.test(H(false)) && /id="pil-meteo" style="display:none"/.test(H(false)));
  }
  // ② le squelette : la ligne d'écran suit l'en-tête ; « Vous regardez » à gauche, « N choses à compléter » à droite
  {
    const sq = sansCom(fonction(S.pil, 'function _pilSkeleton('));
    t('② la ligne d’écran suit l’en-tête : « Vous regardez » à gauche (#pil-crumb), « à compléter » à droite (#pil-diagbtn-host)', /return _pilHdrHtml\(d,tab\)\s*\n\s*\+'<div class="mv-ecran pil-portee" id="pil-portee"><div class="mv-ecran-g pil-crumb" id="pil-crumb">'\+_pilCrumbHtml\(\)\+'<\/div>'\s*\n\s*\+'<div class="mv-ecran-d"><span id="pil-diagbtn-host">'\+_pilDiagBtnHtml\(\)\+'<\/span><\/div><\/div>'/.test(sq));
    t('②bis les onglets ne sont rendus qu’une fois, par l’en-tête ; un rendu neuf replie le choix', !/_pilTabsHtml\(/.test(sq) && /_pilPtOuvert=false;/.test(sq) && (pil.match(/\+_pilTabsHtml\(/g) || []).length === 1);
    t('②ter plus rien n’empile la barre : ni bande collante à elle, ni onglets calés sous elle, ni enveloppe .pil-portee-in', !/\.pil-portee\{position:sticky/.test(pil) && !/pil-tabsbar/.test(pil) && !/pil-portee-in/.test(pil));
  }
  // ③ « Vous regardez », JOUÉE dans ses deux cadres : ce que dit le bouton du téléphone, et le choix complet derrière lui.
  //   ★ PORTEE-1 (§591) : elle ne vit plus que sur Économie › Le détail (_pilCrumbAnnee) et ne choisit plus que l'année — la
  //   campagne se choisit à la pastille du haut (mv-harnais-portee1).
  {
    const ctx = { _PIL_SCOPE: { camp: null, cadre: 'exo', recul: 0 }, _pilPtOuvert: false, window: {},
      _pilAnCadre: () => ({ court: '2026–2027', prevOk: true, recul: 0, d0: '2026-08-01', d1: '2027-07-31' }), _pilPorteePeriode: () => ({ debut: '2026-11-12', fin: '2027-02-28' }),
      _pilPorteeBornes: () => 'du 1 août au 31 juil.', _mvInfoBtn: (k) => '<button class="mv-info" data-info="' + k + '">i</button>' }; vm.createContext(ctx);
    vm.runInContext(['function _pilEsc(', 'function _pilPorteeMode(', 'function _pilCrumbAnnee('].map((d) => fonction(S.pil, d)).join('\n'), ctx);
    const C = () => vm.runInContext('_pilCrumbAnnee()', ctx);
    const dit = (h) => (/<span class="pil-ptres-t">([^<]*)<\/span>/.exec(h) || [])[1];
    const exo = C(); ctx._PIL_SCOPE.cadre = 'vig'; const vig = C(); ctx._PIL_SCOPE.camp = 'Hiver "26"'; const camp = C();
    t('③ jouée : le bouton dit l’année qu’on regarde — « ' + dit(exo) + ' », « ' + dit(vig) + ' » ; une campagne ne s’y lit plus', dit(exo) === 'Exercice 2026–2027' && dit(vig) === 'Année vigne 2026–2027' && dit(camp) === 'Année vigne 2026–2027');
    t('③bis le bouton vient en premier, replié par défaut, et commande #pil-ptchoix', /^<button type="button" class="pil-ptres" data-ptres="1" aria-expanded="false" aria-controls="pil-ptchoix" aria-label="Vous regardez : Exercice 2026–2027\. Changer">/.test(exo));
    const iC = exo.indexOf('<div class="pil-ptchoix" id="pil-ptchoix">'); const ch = exo.slice(iC);
    t('③ter tout le choix est derrière lui, d’un bloc : les deux cadres, les flèches de l’année, les dates, la bulle d’information', iC > 0 && finBloc(exo, iC) === exo.length && ['data-portee="vig"', 'data-portee="exo"', 'data-anrecul="-1"', 'data-anrecul="1"', 'class="pil-ptbornes"', 'data-info="pil.cadres"'].every((x) => ch.includes(x)) && /class="on" aria-pressed="true">L’exercice</.test(ch));
    t('③quater plus de campagne dans le choix, ni sa liste (PORTEE-1)', !ch.includes('data-portee="camp"') && !/pil-ptpop|data-ptpop/.test(exo + camp));
    ctx._pilPtOuvert = true; t('③quinquies déplié, la barre repeinte le dit encore (aria-expanded)', /data-ptres="1" aria-expanded="true"/.test(C()));
  }
  // ④ le geste, JOUÉ : déplier pose .pt-ouvert sur la ligne et le dit au bouton ; un toucher hors de la ligne referme
  {
    const ligne = noeud('mv-ecran pil-portee', 'pil-portee'), bouton = noeud('pil-ptres');
    const ctx = { document: { getElementById: (id) => (id === 'pil-portee' ? ligne : null), querySelector: (s) => (s === '#pil-portee [data-ptres]' ? bouton : null) } }; vm.createContext(ctx);
    vm.runInContext('var _pilPtOuvert=false;\n' + fonction(S.pil, 'function _pilPtOuvrir(') + '\nthis.__etat=()=>_pilPtOuvert;', ctx);
    vm.runInContext('_pilPtOuvrir(true)', ctx); const a = [ligne.classList.contains('pt-ouvert'), bouton.attrs['aria-expanded'], ctx.__etat()].join('|');
    vm.runInContext('_pilPtOuvrir(false)', ctx); const b = [ligne.classList.contains('pt-ouvert'), bouton.attrs['aria-expanded'], ctx.__etat()].join('|');
    t('④ jouée : déplié (' + a + ') puis replié (' + b + ')', a === 'true|true|true' && b === 'false|false|false');
    t('④bis le geste : le bouton bascule, un toucher hors de la ligne referme — avant tout autre geste de la barre', /var _pr=e\.target\.closest\('\[data-ptres\]'\);\s*\n\s*if\(_pr\)\{ e\.stopPropagation\(\); _pilPtOuvrir\(!_pilPtOuvert\); return; \}\s*\n\s*if\(_pilPtOuvert && !e\.target\.closest\('#pil-portee'\)\) _pilPtOuvrir\(false\);\s*\n\s*var _ptV=/.test(pil));   // PORTEE-1 (§591) : la liste des campagnes (_pop) est partie
  }
  // ⑤ la feuille : la page ne défile plus dans elle-même ; la ligne colle sur ordinateur ; le bouton au téléphone et sur tablette
  {
    t('⑤ la page du Pilotage ne défile plus dans elle-même : son en-tête colle sur tous les onglets', /body #page-pilotage\{ overflow-x:clip; overflow-y:visible; \}/.test(css));
    const base = /body #page-pilotage \.mod-header \+ \.mv-ecran\.pil-portee\{ position:relative; top:auto; z-index:62; overflow:visible; \}/.test(css);
    const pc = regles(css, 'min-width:1024px').find((r) => r.sel === 'body #page-pilotage .mod-header + .mv-ecran.pil-portee');
    t('⑤bis « Vous regardez » est la ligne d’écran : rien n’y est rogné (son menu s’ouvre dessous) ; elle ne colle que sur ordinateur, sous l’en-tête', base && !!pc && /position:sticky;\s*top:calc\(var\(--mv-demo-h,0px\) \+ var\(--h-tete,111px\)\);\s*z-index:79;/.test(pc.corps));
    const tel = regles(css, 'max-width:767px'); const R = (sel) => tel.find((r) => r.sel === sel);
    t('⑤ter sur ordinateur le bouton est caché et le choix est sur la ligne ; à 767 px et moins, l’inverse', /\n\.pil-ptres\{ display:none; \}/.test(css) && /\n\.pil-ptchoix\{ display:flex;/.test(css) && !!R('.pil-ptres') && /display:inline-flex/.test(R('.pil-ptres').corps) && !!R('.pil-ptchoix') && /display:none/.test(R('.pil-ptchoix').corps));
    const ouv = R('.pil-portee.pt-ouvert .pil-ptchoix');
    t('⑤quater déplié, le choix se pose SOUS la ligne, sur toute la largeur, et passe à la ligne', !!ouv && /display:flex;\s*flex-wrap:wrap;\s*position:absolute;\s*top:100%;\s*left:0;\s*right:0;/.test(ouv.corps) && /white-space:normal/.test(ouv.corps));
    t('⑤quinquies le bouton a sa zone d’appui sur toute la hauteur de la ligne ; quand la place manque, les dates se coupent avant le reste', !!R('.pil-ptres::after') && /\.pil-ptchoix > \.pil-ptbornes\{ flex:0 1000 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; \}/.test(css) && /body #page-pilotage \.mv-ecran\.pil-portee > \.mv-ecran-g\.pil-crumb\{[^}]*min-width:0;/.test(css));
    t('⑤sexies au téléphone, la grille de la ligne du module vaut pour le Pilotage aussi : plus d’exception', !/:not\(\.h-pilotage\)/.test(css) && regles(css, 'max-width:600px').some((r) => r.sel === '.mod-header > .mod-header-top' && /display:grid/.test(r.corps)));
  }
  // ⑥ le bandeau de la démo (l'en-tête colle plus bas) : la ligne d'écran, les panneaux et la mesure le comptent
  {
    const n = (css.match(/calc\(var\(--mv-demo-h,0px\) \+ var\(--h-tete,111px\)/g) || []).length;
    t('⑥ la ligne d’écran et les panneaux collants se calent sous le bandeau de la démo (' + n + ' calculs le comptent, aucun ne l’oublie)', n >= 4 && !/top:var\(--h-tete,111px\)/.test(css) && !/calc\(var\(--h-tete,111px\)/.test(css));
    const pg = noeud('page', 'page-x'); const hd = pg.appendChild(noeud('mod-header')); hd.offsetHeight = 111; hd.pos = 'sticky'; hd.top = '0px'; const ec = pg.appendChild(noeud('mv-ecran')); ec.offsetHeight = 44; ec.pos = 'sticky';
    const ctx = { document: { getElementById: (id) => (id === 'page-x' ? pg : null) }, window: { getComputedStyle: (e) => ({ position: e.pos, top: e.top }) } }; vm.createContext(ctx);
    vm.runInContext(fonction(S.uti, 'function _mvTeteBas('), ctx); const M = () => vm.runInContext("_mvTeteBas('page-x')", ctx);
    const sans = M(); hd.top = '37px'; const avec = M(); ec.pos = 'static'; const tel = M(); hd.pos = 'static'; const libre = M();
    t('⑥bis _mvTeteBas, jouée : ' + sans + ' px sans bandeau, ' + avec + ' avec (37 px de plus), ' + tel + ' quand la ligne défile, ' + libre + ' si l’en-tête ne colle pas', sans === 155 && avec === 192 && tel === 148 && libre === 111);
  }
  t('⑦ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-tete4c.mjs'") > 0 && S.liste.indexOf("mv-harnais-tete4c.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const BANDE = "    +'<div class=\"mod-meta-row mvu-meta'+(d.meteo?' mvu-avec-meteo':'')+'\">'";
  const mutants = [
    ['la bande campagne/météo repasse sous l’en-tête', (S) => { const i = S.pil.indexOf(BANDE), f = S.pil.indexOf("    +'</div>'\n", S.pil.indexOf('id="pil-meteo"', i)) + "    +'</div>'\n".length; const fin = "    +_pilTabsHtml(tab)\n    +'</div>';\n"; if (i < 0 || !S.pil.includes(fin)) throw new Error('ancre absente'); const b = S.pil.slice(i, f); const s = S.pil.slice(0, i) + S.pil.slice(f); return Object.assign({}, S, { pil: s.replace(fin, "    +_pilTabsHtml(tab)\n    +'</div>'\n" + b.replace(/\n$/, ';\n')) }); }],
    ['la roue passe avant la bande', (S) => { const g = S.pil.split('\n').find((l) => l.includes('id="pil-regl-gear"') && l.trim().startsWith('+(((')); if (!g || !S.pil.includes(BANDE)) throw new Error('ancre absente'); return Object.assign({}, S, { pil: S.pil.replace(g + '\n', '').replace(BANDE, g + '\n' + BANDE) }); }],
    ['les onglets ressortent de l’en-tête', m('pil', "    +'</div>'\n    +_pilTabsHtml(tab)\n    +'</div>';", "    +'</div>'\n    +'</div>'\n    +_pilTabsHtml(tab);")],
    ['la barre .pil-tabsbar revient autour des onglets', m('pil', "    +_pilTabsHtml(tab)\n    +'</div>';", "    +'<div class=\"pil-tabsbar\">'+_pilTabsHtml(tab)+'</div>'\n    +'</div>';")],
    ['l’en-tête perd le repère de la météo', m('pil', '<div class="hv2-meteo-mini" id="pil-meteo"', '<div class="hv2-meteo-mini" id="pil-meteox"')],
    ['« Vous regardez » n’est plus la ligne d’écran', m('pil', '<div class="mv-ecran pil-portee" id="pil-portee">', '<div class="pil-portee" id="pil-portee">')],
    ['« à compléter » repasse à gauche, dans la barre', m('pil', "+'<div class=\"mv-ecran-d\"><span id=\"pil-diagbtn-host\">'+_pilDiagBtnHtml()+'</span></div></div>'", "+'<span id=\"pil-diagbtn-host\">'+_pilDiagBtnHtml()+'</span><div class=\"mv-ecran-d\"></div></div>'")],
    ['un rendu neuf laisse le choix déplié', m('pil', "  _pilPtOuvert=false;\n  return _pilHdrHtml(d,tab)", "  return _pilHdrHtml(d,tab)")],
    ['la bande collante de la barre revient dans le style du module', m('pil', "  var css=''\n", "  var css=''\n  +'.pil-portee{position:sticky;top:0;z-index:34;}'\n")],
    ['le bouton dit toujours « Exercice », même sur l’année vigne', m('pil', "(mode==='vig'?'Ann\\u00e9e vigne':'Exercice')", "(mode==='vig'?'Exercice':'Exercice')")],
    // PORTEE-1 (§591) : le bouton ne porte plus de nom de campagne (saisi par l'utilisateur) — seulement l'année calculée ; la
    //   contre-épreuve « le nom de la campagne n'est plus échappé » n'a plus d'objet.
    ['la bulle d’information reste hors du choix', m('pil', "+'<div class=\"pil-ptchoix\" id=\"pil-ptchoix\">'+h+_mvInfoBtn('pil.cadres')+'</div>';", "+'<div class=\"pil-ptchoix\" id=\"pil-ptchoix\">'+h+'</div>'+_mvInfoBtn('pil.cadres');")],
    ['la barre repeinte oublie qu’elle est dépliée', m('pil', "aria-expanded=\"'+(_pilPtOuvert?'true':'false')+'\" aria-controls=\"pil-ptchoix\"", "aria-expanded=\"false\" aria-controls=\"pil-ptchoix\"")],
    ['déplier ne pose plus la classe sur la ligne', m('pil', "if(p) p.classList.toggle('pt-ouvert',_pilPtOuvert);", "if(p) p.classList.toggle('pt-ouvert',false);")],
    ['un toucher ailleurs ne referme plus', m('pil', "if(_pilPtOuvert && !e.target.closest('#pil-portee')) _pilPtOuvrir(false);", "if(false) _pilPtOuvrir(false);")],
    ['la page défile de nouveau dans elle-même', m('css', 'body #page-pilotage{ overflow-x:clip; overflow-y:visible; }', 'body #page-pilotage{ overflow-x:clip; overflow-y:auto; }')],
    ['la ligne rogne son menu', m('css', 'position:relative; top:auto; z-index:62; overflow:visible; }', 'position:relative; top:auto; z-index:62; overflow:hidden; }')],
    ['la ligne du Pilotage colle sans compter le bandeau de la démo', m('css', '  body #page-pilotage .mod-header + .mv-ecran.pil-portee{ position:sticky; top:calc(var(--mv-demo-h,0px) + var(--h-tete,111px)); z-index:79; }', '  body #page-pilotage .mod-header + .mv-ecran.pil-portee{ position:sticky; top:var(--h-tete,111px); z-index:79; }')],
    ['au téléphone le choix reste étalé sur la ligne', (S) => { const a = '  .pil-ptchoix{ display:none; }'; if (!S.css.includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { css: S.css.replace(a, '  .pil-ptchoix{ display:flex; }') }); }],
    ['déplié, le choix reste dans les 44 px de la ligne', m('css', 'display:flex; flex-wrap:wrap; position:absolute; top:100%; left:0; right:0;', 'display:flex; flex-wrap:wrap;')],
    ['le bouton se montre aussi sur ordinateur', m('css', '\n.pil-ptres{ display:none; }', '\n.pil-ptres{ display:inline-flex; }')],
    ['le Pilotage ressort de la grille du téléphone', (S) => Object.assign({}, S, { css: S.css.replace('  .mod-header > .mod-header-top{ display:grid;', '  .mod-header:not(.h-pilotage) > .mod-header-top{ display:grid;') })],
    ['la mesure oublie le bandeau de la démo', m('uti', "if(cs.position==='sticky' && t>0) h+=t;", 'if(false) h+=t;')],
    ['les panneaux collants oublient le bandeau de la démo', (S) => { const a = 'calc(var(--mv-demo-h,0px) + var(--h-tete,111px) + var(--h-ecran,44px) + var(--e-4,16px))'; if (!S.css.includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { css: S.css.split(a).join('calc(var(--h-tete,111px) + var(--h-ecran,44px) + var(--e-4,16px))') }); }],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-tete4c.mjs'").join("mv-harnais-tete4Z.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    if (S.pil === S0.pil && S.css === S0.css && S.uti === S0.uti && S.liste === S0.liste) { console.log('  \x1b[31m✗\x1b[0m mutant sans effet : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
