/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-4 (§585) : PILOTAGE › ARCHIVES ALLÉGÉ ; LA FRISE DIT LE NOM D'UNE CAMPAGNE AU SURVOL OU AU TOUCHER
   Lancer :          node scripts/mv-harnais-mots4.mjs
   Contre-épreuves : node scripts/mv-harnais-mots4.mjs --contre

   POURQUOI IL EXISTE
   L'écran des Archives ouvrait sur un paragraphe, une échelle de mois, des barres qui portaient leur nom tronqué au téléphone
   (« Après-vendange 202 »), puis une note. La maquette validée (`maquette-moins-de-texte-v3.html`) dessinait des barres sans
   nom. Nico, 16/11, devant deux maquettes (les noms sous la barre, ou sans) : non aux noms — « quand la souris survole la
   frise, que ça indique le nom de la période ; pareil si on touche la frise sur téléphone ». Maquette du geste :
   `docs/maquettes/maquette-archives-frise-v2.html`. « Go ».

   CE QU'IL GARDE
   ① La ligne de la frise (_arcLigne), JOUÉE : des boutons sans texte, leur nom, leurs dates et leurs heures en attributs.
   ② La bulle (_arcBulle), JOUÉE sur un faux écran : le texte posé en texte (jamais en HTML), tenue dans la carte, refermée.
   ③ Les gestes : survol, clavier, toucher qui reste jusqu'au toucher suivant.
   ④ L'écran : une phrase, trois chiffres, la frise, le bilan par année, deux boutons ; plus de paragraphe ni de note.
   ⑤ Le style : la zone de toucher d'une barre, la bulle ; plus de classe orpheline.
   ⑥ La fenêtre « Comparer deux campagnes » ; les fiches, le guide, l'aide, l'annonce, les versions, la référence des mots.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { pil: lire('src/pilotage.js'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), css: lire('src/styles.css'), reg: lire('src/reglages.js'),
  guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'), ref: lire('scripts/mv-mots-baseline.json'), lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-archives-frise-v2.html') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const ligne = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n', i) + 1); };
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const plat = (s) => String(s).replace(/[  ]/g, ' ');

/* ① une ligne de la frise, le vrai code */
function lignes(S) {
  const ctx = { Math, Number, String, Object, Array, Date };
  ctx.window = ctx; ctx._mvToday = () => '2026-10-27';
  vm.createContext(ctx);
  vm.runInContext(['function _arcN(s){', 'function _arcISO(n){', 'function _pecIsoToMs(iso){', 'function _pecJourCourt(ms){', 'function _pecMoisCourt(m){', 'function _arcJour(iso){'].map((n) => ligne(S.pil, n)).join('')
    + 'function _arcBornes(an){ return { an:an, d0:an+"-08-01", d1:(an+1)+"-07-31", court:an+"–"+(an+1) }; }\nvar __H={}; function _arcHeures(n){ return __H[n]||0; }\nfunction _pilHa(x){ return String(x); }\n'
    + 'function _pilEsc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }\n'
    + fnDe(S.pil, 'function _arcLigne(an,list,cur){')
    + '\n__H["Printemps 2026"]=1840;'
    + '\nthis.__h = [_arcLigne(2026,[{nom:"Printemps 2027",debut:"2027-03-01",fin:"2027-06-30"},{nom:"Après-vendange 2026-2027",debut:"2026-10-24",fin:"2027-02-28"}],true),'
    + ' _arcLigne(2025,[{nom:"Printemps 2026",debut:"2026-03-01",fin:"2026-06-30"},{nom:"Le « clos » <b>",debut:"2025-10-01",fin:"2025-12-31"}],false)];', ctx);
  return ctx.__h;
}
/* ② la bulle, le vrai code, sur un faux écran */
function bulle(S, seg, fixe) {
  const j = { classes: [], props: {} };
  const bul = { hidden: fixe !== 'ouverte', offsetWidth: 120, firstChild: { textContent: '' }, lastChild: { textContent: '' }, style: { setProperty(k, v) { j.props[k] = v; } },
    set innerHTML(v) { j.html = v; } };
  const fr = { querySelectorAll: () => [{ classList: { remove(c) { j.retire = c; } } }], contains: (x) => !(x && x.ailleurs), getBoundingClientRect: () => ({ left: 20, top: 0, width: 300 }) };
  const ctx = { Math, document: { getElementById: (id) => (id === 'arc-frise' ? (fixe === 'sans' ? null : fr) : bul) } };
  vm.createContext(ctx);
  vm.runInContext(fnDe(S.pil, 'function _arcBulle(seg){') + '\nthis.__f=_arcBulle;', ctx);
  const s = seg && { ailleurs: seg.ailleurs, classList: { add(c) { j.classes.push(c); } }, getAttribute: (k) => seg[k], getBoundingClientRect: () => ({ left: seg.left, width: seg.width, top: 60 }) };
  ctx.__f(s);
  return { bul, j };
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { f(); } catch (e) { T(n + ' — plantage', false, String(e && e.message || e)); } };
  const P = sansCom(S.pil);

  /* ── ① LA LIGNE DE LA FRISE ── */
  essai('① une ligne de la frise', () => {
    const [h1, h2] = lignes(S).map(plat);
    T('① une ligne : ses années, puis ses barres — plus un mot écrit dans une barre', /^<div class="arc-row cur"><span class="y">2026–2027<\/span><span class="arc-trk">/.test(h1) && (h1.match(/<button type="button" class="arc-seg"/g) || []).length === 2 && !/<b>/.test(h1) && !/>[^<>]+<\/button>/.test(h1), h1);
    T('① une barre est un bouton qui porte son nom et ses dates : « 24 oct. → 28 févr. · en cours »', /data-n="Après-vendange 2026-2027" data-d="24 oct\. → 28 févr\. · en cours" aria-label="Après-vendange 2026-2027, 24 oct\. → 28 févr\. · en cours"/.test(h1), h1);
    T('① … dans l’ordre des dates, quel que soit l’ordre de la liste', h1.indexOf('Après-vendange 2026-2027') < h1.indexOf('Printemps 2027'));
    T('① … la campagne à venir n’est pas « en cours » et n’a pas d’heures', /data-n="Printemps 2027" data-d="1 mars → 30 juin"/.test(h1));
    T('① … le trait d’aujourd’hui est sur l’année en cours, pas sur les autres', /<span class="arc-today" style="left:[\d.]+%"><\/span><\/span><\/div>$/.test(h1) && !/arc-today/.test(h2));
    T('① une campagne close dit ses heures : « 1 mars → 30 juin · 1840 h »', /data-n="Printemps 2026" data-d="1 mars → 30 juin · 1840 h"/.test(h2) && /^<div class="arc-row old">/.test(h2), h2);
    T('① un nom avec des guillemets ou un chevron reste dans son attribut', /data-n="Le « clos » &lt;b&gt;"/.test(h2) && !/<b>"/.test(h2));
    T('① la couleur est sur le trait, dans le bouton (le bouton, lui, fait la zone de toucher)', /style="left:[\d.]+%;width:[\d.]+%"><i style="background:#8A5A38"><\/i><\/button>/.test(h1));
  });

  /* ── ② LA BULLE ── */
  essai('② la bulle', () => {
    const a = bulle(S, { 'data-n': 'Été <b>2026</b>', 'data-d': '1 juin → 31 juil.', left: 280, width: 30 });
    T('② la bulle s’ouvre et pose le nom et les dates en TEXTE (un nom ne s’exécute jamais)', a.bul.hidden === false && a.bul.firstChild.textContent === 'Été <b>2026</b>' && a.bul.lastChild.textContent === '1 juin → 31 juil.' && a.j.html === '<b></b><span></span>', JSON.stringify(a.j));
    T('② … la barre visée est marquée, la précédente ne l’est plus', a.j.classes.join() === 'sel' && a.j.retire === 'sel');
    T('② … près du bord droit, la bulle reste dans la carte et sa flèche suit la barre', a.bul.style.left === '236px' && a.bul.style.top === '70px' && Math.abs(parseFloat(a.j.props['--fl']) - 82.5) < 0.01, JSON.stringify([a.bul.style.left, a.bul.style.top, a.j.props]));
    const g = bulle(S, { 'data-n': 'A', 'data-d': 'B', left: 20, width: 10 });
    T('② … près du bord gauche aussi', g.bul.style.left === '64px' && parseFloat(g.j.props['--fl']) >= 8);
    const c = bulle(S, { 'data-n': 'A', 'data-d': 'B', left: 150, width: 40 });
    T('② … au milieu, elle est centrée sur la barre', c.bul.style.left === '150px' && c.j.props['--fl'] === '50%');
    T('② sans barre, une bulle ouverte se referme', bulle(S, null, 'ouverte').bul.hidden === true);
    T('② une barre d’un autre écran (repeint depuis) ne l’ouvre pas, et referme celle qui l’était', bulle(S, { ailleurs: true, 'data-n': 'A', 'data-d': 'B', left: 1, width: 1 }).bul.hidden === true && bulle(S, { ailleurs: true, 'data-n': 'A', 'data-d': 'B', left: 1, width: 1 }, 'ouverte').bul.hidden === true);
    let ok = true; try { bulle(S, { 'data-n': 'A', 'data-d': 'B', left: 1, width: 1 }, 'sans'); } catch (e) { ok = false; }
    T('② hors de l’écran des Archives, elle ne plante pas', ok);
  });

  /* ── ③ LES GESTES ── */
  const bind = sansCom(fnDe(S.pil, 'function _pilBindContent(content){'));
  T('③ au survol, la bulle ; la souris partie, elle se referme — sauf la barre touchée', /content\.addEventListener\('mouseover', function\(e\)\{ var s=e\.target\.closest&&e\.target\.closest\('\.arc-seg'\); if\(s\) _arcBulle\(s\); \}\);/.test(bind) && /content\.addEventListener\('mouseout', function\(e\)\{ if\(e\.target\.closest&&e\.target\.closest\('\.arc-seg'\)\) _arcBulle\(\(_ARC_FIXE&&document\.body\.contains\(_ARC_FIXE\)\)\?_ARC_FIXE:null\); \}\);/.test(bind));
  T('③ au clavier aussi', /content\.addEventListener\('focusin', function\(e\)\{ var s=e\.target\.closest&&e\.target\.closest\('\.arc-seg'\); if\(s\) _arcBulle\(s\); \}\);/.test(bind));
  T('③ au toucher, elle reste ; toucher la même barre, ou ailleurs, la referme', /var _as=e\.target\.closest\('\.arc-seg'\);\n\s+if\(_as\)\{ e\.stopPropagation\(\); _ARC_FIXE=\(_ARC_FIXE===_as\)\?null:_as; _arcBulle\(_ARC_FIXE\); return; \}\n\s+if\(_ARC_FIXE\)\{ _ARC_FIXE=null; _arcBulle\(null\); \}/.test(bind));

  /* ── ④ L'ÉCRAN ── */
  const arc = sansCom(fnDe(S.pil, 'function _pilTabArc(d){'));
  T('④ une phrase : les années vigne, les campagnes, les clôtures de l’année', /_pecEnteteVue\('', '<b>'\+keys\.length\+' année'\+\(keys\.length>1\?'s':''\)\+' vigne<\/b>, '\+S\.length\+' campagne'\+\(S\.length>1\?'s':''\)\+'\. '\n\s+\+\(nClos\?\(nClos\+' clôture'\+\(nClos>1\?'s':''\)\+' cette année\.'\):'Aucune clôture cette année\.'\)\)/.test(arc));
  T('④ … une clôture = un instantané au nom d’une campagne de l’année vigne en cours', /var nClos=\(par\[anCur\]\|\|\[\]\)\.filter\(function\(s\)\{ return H0\.some\(function\(x\)\{ return x&&x\.saisonNom===s\.nom; \}\); \}\)\.length;/.test(arc));
  T('④ trois chiffres de front ; sans heures, un tiret et « à la première clôture » (pas de « 1re » : hors de la police)', /<div class="pec-kpis pec-k3">/.test(arc) && (arc.match(/<div class="pec-k">/g) || []).length === 3 && /\(hTot>0\?'':'<div class="s">à la première clôture<\/div>'\)/.test(arc) && !/[ᵉʳ]/.test(arc));
  T('④ la frise : son axe est LU dans le réglage (« août → juil. »), sa fiche, sa bulle, ses lignes', /var axe=\(m0!==null&&m1!==null\)\?\(_pecMoisCourt\(new Date\(m0\)\.getMonth\(\)\)\+' → '\+_pecMoisCourt\(new Date\(m1\)\.getMonth\(\)\)\):'';/.test(arc) && /_mvInfoBtn\('pil\.arc\.frise'\)/.test(arc) && /<div class="arc-frise" id="arc-frise"><div class="arc-bul" id="arc-bul" role="status" hidden><\/div>'\n\s+\+keys\.map\(function\(k\)\{ return _arcLigne\(k,par\[k\],k===anCur\); \}\)\.join\(''\)/.test(arc));
  T('④ … sous la frise, la campagne en cours est nommée — seulement s’il y en a une', /var enc=S\.filter\(function\(s\)\{ return auj>=s\.debut && auj<=s\.fin; \}\)\[0\]\|\|null;/.test(arc) && /\(enc\?\('<div class="arc-fait">[^\n]*>en cours<\/span><span>'\+_pilEsc\(enc\.nom\)\+'<\/span><\/div>'\):''\)/.test(arc));
  T('④ deux boutons : « Comparer deux campagnes », « Éditer le bilan »', /onclick="window\._arcOpenCmp&&window\._arcOpenCmp\(\)"><span>'\+_mvIcon\('graphique',16\)\+'<\/span> Comparer deux campagnes<\/button>/.test(arc) && /onclick="window\._bcExportChoix&&window\._bcExportChoix\(\)"><span>'\+_mvIcon\('livre',16\)\+'<\/span> Éditer le bilan<\/button>/.test(arc) && !/deux saisons/.test(arc));
  T('④ la frise à gauche, le bilan et les boutons à droite sur ordinateur', /h\+='<div class="pec-g2 pec-g21">'\+frise\+'<div>'\+_arcBlocAnnuel\(\)\+acts\+'<\/div><\/div><\/div>';/.test(arc) && /var h='<div class="pec-wrap">'/.test(arc));
  T('④ plus de paragraphe en tête, plus d’échelle des mois, plus de note en bas', !/arc-intro|arc-note|_cmpEchelle|arc-kpi/.test(arc) && !/Toutes les années vigne sur le même axe/.test(arc) && !/instantanés pris à la clôture/.test(arc));
  T('④ l’écran vide tient en une ligne, avec sa porte', /if\(!S\.length\) return '<div class="arc-empty">Aucune campagne datée\. '\n\s+\+'<button type="button" class="pil-diag-go ghost" data-diag="saisons">Réglages › Campagne ›<\/button><\/div>';/.test(arc));
  T('④ plus de sous-titre d’écran qui redit l’onglet', /arc:'Archives'[,}]/.test(S.pil) && !/arc:'Archives des campagnes'/.test(S.pil));
  const bil = sansCom(fnDe(S.pil, 'function _arcBlocAnnuel(){'));
  T('④ le bilan : son titre, sa fiche, « Année vigne | Exercice »', /<div class="pec-ct">Bilan par année<\/div>/.test(bil) && /_mvInfoBtn\('pil\.arc\.bilan'\)/.test(bil) && /opt\('vigne','Année vigne'\)\+opt\('exercice','Exercice'\)/.test(bil));
  T('④ … une année sans clôture n’affiche que son nom ; ses dates seulement si le cadre n’est pas celui de la frise', /if\(!A\.campagnes\.length\) return r\+'<\/div>';/.test(bil) && /\(cadre==='exercice'\?\('<span class="d">'\+_pilEsc\(_arcJour\(A\.bornes\.d0\)\+' → '\+_arcJour\(A\.bornes\.d1\)\)\+'<\/span>'\):''\)/.test(bil));
  T('④ … plus de phrase à demeure dans le bilan', !/Calcul|Aucune campagne close|au prorata|choisi par/.test(bil) && /'<div class="arcan-tk">dont '\+_pilHa\(Math\.round\(A\.hRep\)\)\+' h réparties<\/div>'/.test(bil));
  T('④ … le réglage du cadre reste réservé à l’administrateur', /return adm \? '<button class="'/.test(bil) && /if\(!\(typeof window\.isAdmin==='function' && window\.isAdmin\(\)\)\)\{/.test(fnDe(S.pil, 'function _arcSetCadre(v){')));

  /* ── ⑤ LE STYLE ── */
  T('⑤ une barre : 36 px de zone de toucher, le trait de 16 px dedans, jamais plus étroite que 8 px', /\n\.arc-seg\{position:absolute;top:-10px;height:36px;min-width:8px;border:0;padding:10px 0;background:none;cursor:pointer;font:inherit\}/.test(S.idx) && /\n\.arc-seg i\{display:block;height:16px;border-radius:4px\}/.test(S.idx));
  T('⑤ la barre visée se voit (survol, clavier, toucher)', /\n\.arc-seg:hover i,\.arc-seg:focus-visible i,\.arc-seg\.sel i\{opacity:1;outline:2px solid var\(--texte\);outline-offset:2px\}/.test(S.idx));
  T('⑤ la bulle : au-dessus de la barre, ne prend pas les gestes, se cache vraiment', /\n\.arc-bul\{position:absolute;z-index:6;transform:translate\(-50%,-100%\);[^\n]*white-space:nowrap;pointer-events:none;/.test(S.idx) && /\n\.arc-bul\[hidden\]\{display:none\}/.test(S.idx) && /\n\.arc-card\{overflow:visible\}/.test(S.idx));
  T('⑤ l’échelle du Pilotage vise le trait, plus le bouton', /:is\(#page-pilotage, #ovReglPilotage\) \.arc-seg i \{ height: var\(--barre-graph-h\) !important;/.test(S.css));
  const morts = ['arc-intro', 'arc-kpi', 'arc-lab', 'arc-note', 'arc-fr', 'arcan-sub', 'arcan-vide', 'arcan-t', 'arcan-h'].filter((c) => new RegExp('\\.' + c + '(?![\\w-])').test(S.idx + S.css) || new RegExp('["\' ]' + c + '["\' ]').test(P));
  T('⑤ plus de classe orpheline des anciennes Archives', morts.length === 0, morts.join(', '));
  T('⑤ trois chiffres de front', /'\.pec-kpis\.pec-k3\{grid-template-columns:repeat\(3,1fr\)\}'/.test(S.pil));

  /* ── ⑥ CE QUI SUIT ── */
  const rh = fnDe(S.reg, 'function renderHistorique(){');
  T('⑥ la fenêtre s’appelle « Comparer deux campagnes » ; son sous-titre porte le compte', /<\/svg> Comparer deux campagnes<\/div><div class="modal-sub" id="histo-modal-sub"><\/div>/.test(S.idx) && /sub\.textContent=allSaisons\.length\+' campagne'\+\(allSaisons\.length>1\?'s':''\);/.test(rh));
  T('⑥ … plus de « saison » ni de « snapshot » écrit dans la fenêtre', !/multi-saisons|saisons? disponible|Aucune saison|Saison [AB] |2 saisons|Snapshot [AB]|le snapshot|un snapshot/.test(rh) && !/multi-saisons|entre saisons/.test(S.idx));
  T('⑥ … vide, elle tient en une ligne', /<div class="et">Aucune campagne archivée<\/div><div class="ed">La comparaison s’ouvre à la première clôture\.<\/div>/.test(rh));
  const fiche = (k) => { const i = S.uti.indexOf("  '" + k + "': {"); return i < 0 ? '' : S.uti.slice(i, S.uti.indexOf('\n  ] }', i) + 6); };
  T('⑥ fiche pil.arc.frise : l’axe, le geste (souris ou toucher), le trait d’aujourd’hui', /de récolte à récolte, l’hiver n’est pas coupé en deux/.test(fiche('pil.arc.frise')) && /Passez la souris dessus, ou touchez-la/.test(fiche('pil.arc.frise')) && /Le trait vertical, c’est aujourd’hui/.test(fiche('pil.arc.frise')));
  T('⑥ fiche pil.arc.bilan : calculé, les instantanés, l’année sans clôture, les heures réparties', /jamais recopié/.test(fiche('pil.arc.bilan')) && /<b>instantanés<\/b> pris à la clôture/.test(fiche('pil.arc.bilan')) && /n’affiche que son nom/.test(fiche('pil.arc.bilan')) && /au prorata de ses interventions datées/.test(fiche('pil.arc.bilan')));
  T('⑥ le guide : la phrase, les trois chiffres, le geste sur la frise, les deux boutons', /L'écran s'ouvre sur <b>une phrase<\/b> — « 2 années vigne, 2 campagnes\. Aucune clôture cette année\. »/.test(S.guide) && /<b>Sur ordinateur, passez la souris<\/b> sur une barre ; <b>au téléphone, touchez-la<\/b>/.test(S.guide) && /<b>Comparer deux campagnes<\/b>/.test(S.guide) && !/se compare l'avancement de deux saisons/.test(S.guide));
  T('⑥ l’aide de l’onglet dit le geste', /\['Archives', "empile les années vigne sur un même axe[^\n]*Passez la souris sur une barre, ou touchez-la : son nom et ses dates s’affichent\."\],/.test(S.uti));
  const bi = S.wn.indexOf("  { v: '11.13',"), bloc = bi < 0 ? '' : S.wn.slice(bi, S.wn.indexOf('\n  ] },', bi));
  T('⑥ l’annonce de la 11.13, pour l’admin', /^  \{ v: '11\.13', d: '2026-11-16'/m.test(S.wn) && /la frise dit le nom quand on la touche/.test(bloc) && /passez la souris sur une barre, ou touchez-la au téléphone/.test(bloc) && /Aucun calcul ne change/.test(bloc) && /pour: \['admin'\]/.test(bloc) && !/titre: '[^']*&/.test(bloc));
  const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1];
  T('⑥ les versions : l’appli à 11.13 au moins, cinq affichages ; le SW dit MOTS-4', !!app && Number(app) >= 11.13 && S.idx.split('v' + app).length - 1 === 4 && S.idx.includes('boot.js?v=' + app) && /^\/\/ v12\.04 \(16\/11\/2026\) — MOTS-4 \(§585\)/m.test(S.sw), 'APP ' + app);
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  const a = ref && ref.mesures && ref.mesures['téléphone'] && ref.mesures['téléphone']['Pilotage › Archives'];
  T('⑥ la référence des mots est regravée : Archives à 45 mots au plus au téléphone, aucune phrase de 15 mots, un chiffre dès le début', !!a && a.mots <= 45 && a.p15 === 0 && a.avant !== null && a.avant <= 15, JSON.stringify(a));
  T('⑥ la maquette du geste est au dépôt, et dite au LISEZMOI', /Archives : la frise dit le nom quand on la survole ou qu’on la touche/.test(S.maq) && /`maquette-archives-frise-v2\.html` — Archives : la frise sans les noms, leur nom dans une bulle/.test(S.lm));
  T('⑥ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-mots4.mjs'") > 0 && S.liste.indexOf("mv-harnais-mots4.mjs --contre'") > 0);
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  for (const [n, c, d] of r) { if (c) console.log('  \x1b[32m✓\x1b[0m ' + n); else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n + (d ? '\n      → ' + d : '')); } }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + r.length + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 50)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const refMut = (f) => (S) => { const r = JSON.parse(S.ref); f(r.mesures['téléphone']['Pilotage › Archives']); return { ...S, ref: JSON.stringify(r) }; };
  const mutants = [
    ['le nom revient écrit dans la barre', sur('pil', "+' style=\"left:'+x+'%;width:'+w+'%\"><i style=\"background:'+col(s)+'\"></i></button>';", "+' style=\"left:'+x+'%;width:'+w+'%\"><i style=\"background:'+col(s)+'\"></i>'+_pilEsc(s.nom)+'</button>';")],
    ['une barre perd son nom pour le lecteur d’écran', sur('pil', "aria-label=\"'+_pilEsc(s.nom+', '+dd)+'\"'", "aria-label=\"\"'")],
    ['une barre perd ses dates', sur('pil', "data-d=\"'+_pilEsc(dd)+'\" aria-label", "data-d=\"\" aria-label")],
    ['un nom de campagne n’est plus échappé dans son attribut', sur('pil', "class=\"arc-seg\" data-n=\"'+_pilEsc(s.nom)+'\"", "class=\"arc-seg\" data-n=\"'+s.nom+'\"")],
    ['toute campagne se dit « en cours »', sur('pil', 'var hh=_arcHeures(s.nom), enc=(today>=s.debut && today<=s.fin);', 'var hh=_arcHeures(s.nom), enc=true;')],
    ['une campagne close ne dit plus ses heures', sur('pil', "(enc?' · en cours':(hh>0?(' · '+_pilHa(hh)+' h'):''))", "(enc?' · en cours':'')")],
    ['les barres ne sont plus rangées par date', sur('pil', "var segs=list.slice().sort(function(x,y){ return String(x.debut).localeCompare(String(y.debut)); })\n    .map(function(s){\n      var x=pc(s.debut), w=pc(s.fin)-x; if(w<=0) w=1;\n      var hh=", "var segs=list.slice()\n    .map(function(s){\n      var x=pc(s.debut), w=pc(s.fin)-x; if(w<=0) w=1;\n      var hh=")],
    ['le trait d’aujourd’hui s’affiche sur toutes les années', sur('pil', "if(today>=_arcISO(a)&&today<=_arcISO(b)) segs+='<span class=\"arc-today\"", "if(true) segs+='<span class=\"arc-today\"")],
    ['la bulle pose le nom en HTML', sur('pil', "bul.firstChild.textContent=seg.getAttribute('data-n')||'';", "bul.innerHTML='<b>'+(seg.getAttribute('data-n')||'')+'</b><span></span>';")],
    ['la bulle sort de la carte', sur('pil', 'x=Math.max(w/2+4, Math.min(rf.width-w/2-4, cx));', 'x=cx;')],
    ['la bulle ne se referme plus', sur('pil', 'if(!seg || !fr.contains(seg)){ bul.hidden=true; return; }', 'if(!seg || !fr.contains(seg)){ return; }')],
    ['la bulle s’ouvre pour une barre d’un écran repeint', sur('pil', 'if(!seg || !fr.contains(seg)){ bul.hidden=true; return; }', 'if(!seg){ bul.hidden=true; return; }')],
    ['la bulle plante hors des Archives', sur('pil', "bul=document.getElementById('arc-bul'); if(!fr||!bul) return;", "bul=document.getElementById('arc-bul');")],
    ['le survol n’ouvre plus la bulle', sur('pil', "  content.addEventListener('mouseover', function(e){ var s=e.target.closest&&e.target.closest('.arc-seg'); if(s) _arcBulle(s); });\n", '')],
    ['la souris partie, la bulle reste', sur('pil', "_arcBulle((_ARC_FIXE&&document.body.contains(_ARC_FIXE))?_ARC_FIXE:null); });", '{} });')],
    ['le clavier n’ouvre plus la bulle', sur('pil', "  content.addEventListener('focusin', function(e){ var s=e.target.closest&&e.target.closest('.arc-seg'); if(s) _arcBulle(s); });\n", '')],
    ['un toucher ailleurs ne referme plus la bulle', sur('pil', '    if(_ARC_FIXE){ _ARC_FIXE=null; _arcBulle(null); }\n', '')],
    ['le paragraphe du haut revient', sur('pil', "  var h='<div class=\"pec-wrap\">'\n    +_pecEnteteVue('', '<b>'+keys.length", "  var h='<div class=\"pec-wrap\"><div class=\"arc-intro\">Toutes les années vigne sur le même axe.</div>'\n    +_pecEnteteVue('', '<b>'+keys.length")],
    ['la phrase annonce toujours « aucune clôture »', sur('pil', "+(nClos?(nClos+' clôture'+(nClos>1?'s':'')+' cette année.'):'Aucune clôture cette année.'))", "+('Aucune clôture cette année.'))")],
    ['« à la 1re clôture » reprend des caractères hors de la police', sur('pil', "<div class=\"s\">à la première clôture</div>", '<div class="s">à la 1ʳᵉ clôture</div>')],
    ['l’axe de la frise est écrit en dur', sur('pil', "var axe=(m0!==null&&m1!==null)?(_pecMoisCourt(new Date(m0).getMonth())+' → '+_pecMoisCourt(new Date(m1).getMonth())):'';", "var axe='août → juil.';")],
    ['la frise perd sa fiche', sur('pil', "+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.arc.frise')):'')+'</div></div>'", "+'</div></div>'")],
    ['la frise perd sa bulle', sur('pil', '<div class="arc-bul" id="arc-bul" role="status" hidden></div>', '')],
    ['« en cours » s’affiche sans campagne en cours', sur('pil', "+(enc?('<div class=\"arc-fait\">", "+(true?('<div class=\"arc-fait\">")],
    ['le bouton reparle de saisons', sur('pil', '</span> Comparer deux campagnes</button>', '</span> Comparer deux saisons</button>')],
    ['le bilan de campagne perd sa porte', sur('pil', "+'<button class=\"pec-btn\" onclick=\"window._bcExportChoix&&window._bcExportChoix()\"><span>'+_mvIcon('livre',16)+'</span> Éditer le bilan</button></div>';", "+'</div>';")],
    ['l’écran vide reprend deux phrases', sur('pil', "'<div class=\"arc-empty\">Aucune campagne datée. '\n    +'<button", "'<div class=\"arc-empty\">Aucune campagne datée. Elles apparaissent ici dès qu’une campagne porte un début et une fin. '\n    +'<button")],
    ['le sous-titre d’écran revient', sur('pil', "arc:'Archives'", "arc:'Archives des campagnes'")],
    ['le bilan reprend sa phrase à demeure', sur('pil', "    if(!A.campagnes.length) return r+'</div>';", "    if(!A.campagnes.length) return r+'<div class=\"arcan-vide\">Aucune campagne close cette année.</div></div>';")],
    ['le bilan perd sa fiche', sur('pil', "(typeof _mvInfoBtn==='function'?_mvInfoBtn('pil.arc.bilan'):'')", "''")],
    ['le cadre du bilan se règle sans être administrateur', sur('pil', "    return adm ? '<button class=\"'", "    return true ? '<button class=\"'")],
    ['la zone de toucher d’une barre redevient un trait', sur('idx', '.arc-seg{position:absolute;top:-10px;height:36px;', '.arc-seg{position:absolute;top:0;height:16px;')],
    ['la bulle prend les gestes', sur('idx', 'white-space:nowrap;pointer-events:none;box-shadow:0 6px 18px', 'white-space:nowrap;box-shadow:0 6px 18px')],
    ['la bulle cachée reste visible', sur('idx', '\n.arc-bul[hidden]{display:none}', '')],
    ['la carte de la frise coupe la bulle', sur('idx', '\n.arc-card{overflow:visible}', '')],
    ['une classe orpheline revient', sur('idx', '\n.arc-card{overflow:visible}', '\n.arc-card{overflow:visible}\n.arc-intro{color:red}')],
    ['la fenêtre reparle de saisons', sur('idx', '</svg> Comparer deux campagnes</div><div class="modal-sub" id="histo-modal-sub"></div>', '</svg> Historique multi-saisons</div><div class="modal-sub" id="histo-modal-sub"></div>')],
    ['la fenêtre vide reparle de saison', sur('reg', '<div class="et">Aucune campagne archivée</div>', '<div class="et">Aucune saison archivée</div>')],
    ['la fenêtre reparle de snapshot', sur('reg', 'Supprimer l’archive «', 'Supprimer le snapshot «')],
    ['la fiche de la frise tait le geste', sur('uti', 'Passez la souris dessus, ou touchez-la : ', '')],
    ['la fiche du bilan disparaît', sur('uti', "  'pil.arc.bilan': {", "  'pil.arc.bilanx': {")],
    ['le guide tait le geste', sur('guide', "<b>Sur ordinateur, passez la souris</b> sur une barre ; <b>au téléphone, touchez-la</b>", 'Les barres ne se touchent pas')],
    ['l’aide tait le geste', sur('uti', ' Passez la souris sur une barre, ou touchez-la : son nom et ses dates s’affichent."],', '"],')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("  { v: '11.13',"); const j = S.wn.indexOf("pour: ['admin']", i); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.04 (16/11/2026) — MOTS-4 (§585)', '// v12.04 (16/11/2026) — divers')],
    ['la référence des mots n’a pas été regravée', refMut((t) => { t.mots = 110; })],
    ['la maquette n’est pas au dépôt', (S) => ({ ...S, maq: '' })],
    ['la liste ne joue plus ce fichier', (S) => ({ ...S, liste: S.liste.split("mv-harnais-mots4.mjs'").join("mv-harnais-motsX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible : ' + nom + ' (' + e.message + ')'); continue; }
    if (Object.keys(S0).every((k) => S[k] === S0[k])) { console.log('  \x1b[31m✗\x1b[0m mutant sans effet : ' + nom); continue; }
    let rouges = 0; try { rouges = suite(S).filter((x) => !x[1]).length; } catch (e) { rouges = 1; }
    if (rouges > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + rouges + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
