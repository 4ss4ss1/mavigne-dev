/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-8 (§590) : PILOTAGE › TRAVAUX ALLÉGÉ SUR PLACE — L'ONGLET RESTE, SES CARTES AUSSI, MOINS DE MOTS DANS CHACUNE
   Lancer :          node scripts/mv-harnais-mots8.mjs
   Contre-épreuves : node scripts/mv-harnais-mots8.mjs --contre

   POURQUOI IL EXISTE
   Nico (17/11) garde les onglets Travaux, L'équipe & le matériel, Décider et Conformité dans le Pilotage : un pilote doit
   pouvoir tout visiter sans ouvrir les autres modules (le plan du 13/11, qui les déménageait, est abandonné). Trois règles :
   le Pilotage montre et décide, les modules font (un bouton « Ouvrir » par carte) ; les mêmes chiffres (rien n'est recalculé) ;
   un résumé, pas une copie. Travaux s'allège le premier, sur maquette validée (« go », 17/11) :
   docs/maquettes/maquette-pilotage-travaux-v1.html.

   CE QU'IL GARDE
   ① toutes les cartes restent, à leur place : le bandeau, Avancement, La charge par tâche, Le temps de l'équipe, Échéances,
      Carte du domaine — et chacune a son bouton vers le module où l'on agit ;
   ② la phrase du haut (la fin prévue d'Aujourd'hui, la même date) à la place du sous-titre-question ;
   ③ le bandeau en tuiles d'Aujourd'hui : un nom, un chiffre, une barre ou une pastille, deux ou trois mots ; la phrase
      d'avant au survol ; « Renfort » au lieu d'« Effectif » ;
   ④ une couleur par tâche, la même partout ; la barre d'avancement garde la couleur d'ÉTAT (KIT-1), l'Accueil ne change pas ;
   ⑤ le détail au toucher (les dates d'une tâche, l'écart, l'échéance), la méthode derrière les « i » ;
   ⑥ les mots du lexique (§580c) : fait · reste · prévu · campagne · renfort · sorti ;
   ⑦ la feuille (pilotage.css, pas styles.css au plafond), l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { pil: lire('src/pilotage.js'), uti: lire('src/utils.js'), css: lire('src/styles.css'), pcss: lire('src/pilotage.css'), app: lire('src/app.js'),
  wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'),
  ref: lire('scripts/mv-mots-baseline.json'), lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-pilotage-travaux-v1.html') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const texte = (h) => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const BASE = ['_pilEsc', '_pilNum', '_pilDfr', '_pilFmtD', '_pilDfrObj', '_pilStat', '_pilUn', '_pilNb', '_pilJourC', '_friseNorm'];

// Les fonctions de l'onglet, montées dans Node avec ce qu'elles lisent.
function monter(S, noms, extra) {
  const code = BASE.concat(noms).map((n) => corps(S.pil, n)).join('\n')
    + '\nvar _PIL_PIE_COLORS=' + (S.pil.match(/var _PIL_PIE_COLORS = (\[[^\]]*\]);/) || [, '[]'])[1] + ';'
    + '\nvar _PIL_AN_MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];'
    + '\nthis.api={' + BASE.concat(noms).map((n) => n + ':' + n).join(',') + '};';
  const ctx = Object.assign({ Math, Number, String, Array, Object, Date, JSON, isFinite, parseInt, parseFloat,
    _mvIcon: () => '<svg class="ic"></svg>', _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '">i</button>', window: {} }, extra || {});
  vm.createContext(ctx); vm.runInContext(code, ctx); return ctx.api;
}
function kit(S, win) {
  const N = ['_mvkNb', '_mvkHa', '_mvkEtat', '_mvkDet', '_mvkLigne', '_mvOrdreChantiers', '_mvkAvancement', '_escHtml', '_escAttr'];
  const ctx = { Math, Number, String, Array, Object, window: win || {}, tNom: (n) => n };
  vm.createContext(ctx); vm.runInContext(N.map((n) => corps(S.uti, n)).join('\n') + '\nthis.api={' + N.map((n) => n + ':' + n).join(',') + '};', ctx); return ctx.api;
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const P = sansCom(S.pil);
  // ① les cartes restent, chacune avec son bouton
  let H = '';
  essai('① l’onglet garde ses cinq cartes, dans le même ordre, dans un cadre à lui (.pil-tv)', () => {
    const vu = [];
    const a = monter(S, ['_pilTvBtn', '_pilTabAvc'], { _pilShow: () => true, _pilPanelTemps: () => '<i>TEMPS</i>', _pilPanelEcheances: (d, m) => { vu.push(m); return '<i>ECH</i>'; }, _pilPanelCarte: () => '<i>CARTE</i>' });
    H = a._pilTabAvc({ data: [] }, 'M');
    return [/^<div class="pil-tv"><div class="pil-charts"><div class="pil-panel pil-tv-av">[\s\S]*<div class="pil-panel pil-tv-cg">[\s\S]*<div class="pil-panels"><i>TEMPS<\/i><i>ECH<\/i><i>CARTE<\/i><\/div><\/div>$/.test(H) && vu[0] === 'M', H.slice(0, 300)];
  });
  T('① « Avancement » : son « i », « Cette campagne · N-1 », la jauge DANS la carte, les lignes, « Ouvrir les parcelles »', H.includes('Avancement<button class="mv-i" data-mvi="pil.avc.avancement">i</button>')
    && H.includes('<button type="button" data-b="saison" class="on" aria-pressed="true">Cette campagne</button><button type="button" data-b="cmp" aria-pressed="false">N-1</button>')
    && H.includes('<div class="pil-gauge pil-gauge-in" id="pil-gauge"></div><div class="pil-bar" id="pil-bar"></div><div class="pil-tv-act"><button type="button" class="pil-tv-btn" data-tvgo="parcelles">Ouvrir les parcelles</button></div>'));
  T('① « La charge par tâche » : un titre fixe et son « i », « Reste · Fait · Prévu »', /id="pil-pie-title">La charge par tâche<button class="mv-i" data-mvi="pil\.avc\.charge">i<\/button><\/div>/.test(H)
    && />Reste<\/button><button type="button" data-m="fait" aria-pressed="false">Fait<\/button><button type="button" data-m="plan" aria-pressed="false">Prévu<\/button>/.test(H));
  T('① chaque carte repliée a son bouton vers le module où l’on agit : le planning, la carte de la Vigne', P.includes("'<div class=\"pil-tv-act\">'+_pilTvBtn('planning','Ouvrir le planning')") && P.includes("+ '<div class=\"pil-tv-act\">'+_pilTvBtn('carte','Ouvrir la carte')+'</div>';"));
  T('① les boutons mènent au bon endroit : la liste ou la carte de la Vigne, le planning, les activités du tracteur', P.includes("var _vo=(cible==='carte')?'carte':'liste';") && P.includes("window.switchPTab(_vo);")
    && P.includes("if(cible==='planning'){ if(window.goTo) window.goTo('planning'); return; }") && P.includes("if(cible==='tracbar'){ window._pilGo('tracact'); return; }")
    && P.includes("tracact:   ['tracteur','tracteur','set-sec-act-trac','_mvReglOpen'],") && P.includes("var _tg=e.target.closest('[data-tvgo]');") && P.includes("if(_tg){ e.stopPropagation(); _pilTvGo(_tg.getAttribute('data-tvgo')); return; }"));
  // ② la phrase
  essai('② la phrase : le pourcentage fait, la fin prévue en court, verte avant l’objectif, rouge après', () => {
    const a = monter(S, ['_pilTvPhrase']), d = { gaugePct: 16 }, f = new Date(2026, 10, 25);
    const ok = texte(a._pilTvPhrase(d, { proj: f, marge: 5 })), h = a._pilTvPhrase(d, { proj: f, marge: 5 }), ko = a._pilTvPhrase(d, { proj: new Date(2026, 11, 1), marge: -3 });
    return [/^16.% fait ?, fin prévue 25.nov\.$/.test(ok) && /class="pil-tv-d ok"/.test(h) && /class="pil-tv-d ko">1er.déc\./.test(ko) && /^<span class="pil-tv-ph">/.test(h), ok + ' | ' + ko];
  });
  essai('② … sans barème, à 100 %, ou quand l’équipe ne suffit pas, elle le dit', () => {
    const a = monter(S, ['_pilTvPhrase']);
    const v = texte(a._pilTvPhrase({ gaugeVide: true }, null)), c = texte(a._pilTvPhrase({ gaugePct: 100 }, { proj: new Date() })), k = texte(a._pilTvPhrase({ gaugePct: 40 }, { capa: { ok: false } }));
    return [v === 'Rien au barème sur la campagne' && /^100.% fait$/.test(c) && /^40.% fait ?, l’équipe prévue ne suffit pas$/.test(k), [v, c, k].join(' | ')];
  });
  T('② … la MÊME fin prévue qu’Aujourd’hui (_pilMargeCalc, une fois par rendu), posée à la place du sous-titre', P.includes("var _mAvc=null; try{ _mAvc=_pilMargeCalc(d); }") && P.includes("host.innerHTML=_pilTabAvc(d,_mAvc);")
    && P.includes("var _ph=document.getElementById('pil-souslig-t'); if(_ph) _ph.innerHTML=_pilTvPhrase(d,_mAvc);")
    // MOTS-9 (§592) : L’équipe & le matériel prend la même ligne (sa phrase, _pilEqPhrase).
    && P.includes(`+'<div class="pil-souslig'+((tab==='avc'||tab==='equ')?' pil-tv-souslig':'')+'"><span id="pil-souslig-t">'+((tab==='avc'||tab==='equ')?'':_pilEsc(_pilTabLabel(tab)))+'</span>'`));
  // ③ le bandeau — ★ PORTEE-1 (§591) : ses tuiles de l'ANNÉE (Travaux, Renfort, Budget sorti) ont laissé la place à deux tuiles de la
  //   CAMPAGNE (l'équipe au pic, le budget engagé), jouées par mv-harnais-portee1. Ce qui reste de MOTS-8 : la forme de la tuile.
  let B = null;
  try { B = monter(S, ['_pilPhotoHtml', '_pilPhBar', '_pilPhPl', '_pilFlag'], {}); }
  catch (e) { T('③ les tuiles du bandeau se dessinent (' + e.message + ')', false); return out; }
  essai('③ une tuile : un bouton, son nom, son point, un chevron, le chiffre — plus de « voir le détail », plus de « ! » écrit', () => {
    const h = B._pilPhotoHtml('Travaux', '1 869', ' h', '', 'prévu sur l’exercice', 'avc', B._pilFlag('r', '1 chose à compléter'), 'travaux', 'de <b>barème</b>');
    return [/^<button type="button" class="pil-photo" data-pgo="avc" data-pq="travaux" title="de barème"><span class="k"><span class="kn">Travaux<span class="pil-flag" role="img" style="background:var\(--rouge\)" title="1 chose à compléter" aria-label="1 chose à compléter"><\/span><\/span><svg class="ic"><\/svg><\/span><span class="v">1 869<span class="u"> h<\/span><\/span><span class="s">prévu sur l’exercice<\/span><\/button>$/.test(h)
      && !/voir le d/.test(S.pil.slice(S.pil.indexOf('function _pilPhotoHtml('), S.pil.indexOf('function _pilNb('))), h];
  });
  T('③ le bandeau garde la forme des tuiles d’Aujourd’hui, sur la campagne (PORTEE-1)', P.includes("return '<div class=\"pil-photos pil-tv-tu pil-tv-tu2\">'+pEff+pBud+'</div>';") && !/function _pilPhotoEffAn\(|function _pilPhotoBudAn\(/.test(S.pil));
  // ④ une couleur par tâche
  essai('④ une couleur par tâche : sa place dans la campagne, distincte des autres ; hors liste, une place fixe', () => {
    const a = monter(S, ['_pilTCol'], { _pilSaison: () => ({ taches: ['Palissage', 'Tirage', 'Taille'] }) });
    const c = ['Palissage', 'Tirage', 'Taille'].map(a._pilTCol), x = a._pilTCol('Pliage');
    return [new Set(c).size === 3 && c[0] === '#7A1020' && x === a._pilTCol('pliage') && x !== '#8A5A38', c.join(',') + ' ' + x];
  });
  essai('④ … la même dans les trois boutons du donut (plus la couleur du rang), et le titre ne change plus', () => {
    const r = {};
    for (const m of ['reste', 'fait', 'plan']) { const a = monter(S, ['_pilTCol', '_pilPieData'], { _PIL_STATE: { pie: m }, _pilSaison: () => ({ taches: ['Palissage', 'Tirage', 'Taille'] }) });
      const p = a._pilPieData({ data: [{ nom: 'Taille', h_reste: 491, h_done: 0, h_total: 491 }, { nom: 'Tirage', h_reste: 281, h_done: 0, h_total: 281 }, { nom: 'Palissage', h_reste: 176, h_done: 175, h_total: 351 }] });
      r[m] = p.title + ' ' + p.items.map((i) => i.n + ':' + i.c).join(','); }
    return [r.fait.includes('Palissage:#7A1020') && r.reste.includes('Palissage:#7A1020') && r.plan.includes('Palissage:#7A1020') && r.reste.includes('Taille:#5B2D8E') && r.plan.includes('Taille:#5B2D8E') && /^La charge par tâche /.test(r.reste) && r.reste.split(' ')[0] === r.fait.split(' ')[0], JSON.stringify(r)];
  });
  T('④ la frise, l’écart et les fenêtres de la roue lisent la même couleur', /function _taskColor\(nom\)\{ return _pilTCol\(nom\); \}/.test(P) && !/_PIL_TASK_COL/.test(P));
  essai('④ l’avancement : la pastille de la tâche devant son nom, la barre garde la couleur d’ÉTAT ; ses dates au toucher', () => {
    const k = kit(S), rows = [{ nom: 'Palissage', pct: 50, h_done: 175, h_total: 351 }];
    const h = k._mvkAvancement(rows, { Palissage: true }, { col: () => '#7A1020', dates: (t, late) => 'prévu <b>24 nov.</b>' + (late ? ' · retard' : '') });
    return [h === '<details class="mvk-det"><summary><span class="mvk-ligne"><span class="nom"><i class="mvk-pt" style="background:#7A1020" aria-hidden="true"></i>Palissage</span><span class="mvk-barre"><i class="mvk-retard" style="width:50%"></i></span><span class="pct mvk-t-retard">50' + String.fromCharCode(160) + '%</span><span class="det">175 / 351 h</span></span></summary><p class="mvk-dt">prévu <b>24 nov.</b> · retard</p></details>', h];
  });
  essai('④ … et l’Accueil, qui n’en passe pas, ne change pas d’un caractère', () => {
    const k = kit(S), h = k._mvkAvancement([{ nom: 'Taille', pct: 0, h_done: 0, h_total: 491 }], {});
    return [h === '<div class="mvk-ligne"><span class="nom">Taille</span><span class="mvk-barre"><i class="mvk-cours" style="width:0%"></i></span><span class="pct mvk-t-cours">0' + String.fromCharCode(160) + '%</span><span class="det">0 / 491 h</span></div>', h];
  });
  // ⑤ le détail au toucher
  const cd = { taskWindows: [{ nom: 'Palissage', start: '2026-11-24', end: '2027-01-14' }, { nom: 'Taille', start: '2026-10-24', end: '2027-02-28' }] };
  const real = { palissage: { start: '2026-10-24', state: 'live' }, taille: { state: 'none' } };
  essai('⑤ les dates d’une tâche : la fenêtre prévue, le journal, l’écart au départ ; « sa fenêtre est passée » en retard', () => {
    const a = monter(S, ['_pilTvDatesFn'], { _pilVueEstConsultee: () => true, _pilCdVue: () => cd, _pilTaskReal: () => real }), f = a._pilTvDatesFn({});
    const p = texte(f({ nom: 'Palissage', pct: 50 }, false)), t = texte(f({ nom: 'Taille', pct: 0 }, true));
    return [/^prévu 24 nov\. → 14 janv\. · fait depuis le 24 oct\. · départ 31.j plus tôt$/.test(p) && /^prévu 24 oct\. → 28 févr\. · fait rien encore · sa fenêtre est passée$/.test(t), p + ' | ' + t];
  });
  essai('⑤ … rien quand la portée regarde une autre campagne (ses dates ne seraient pas les siennes)', () => {
    const a = monter(S, ['_pilTvDatesFn'], { _pilVueEstConsultee: () => false, _pilCdVue: () => cd, _pilTaskReal: () => real });
    return a._pilTvDatesFn({}) === null;
  });
  essai('⑤ l’écart au prévu : une ligne par tâche, son verdict en couleur, ses dates au toucher', () => {
    const a = monter(S, ['_pilTCol', '_taskColor', '_pilEcartHtml'], { _pilSaison: () => ({ taches: ['Palissage', 'Taille'] }) }), h = a._pilEcartHtml(cd, real), t = texte(h);
    return [/^Palissage départ 31.j plus tôt prévu 24 nov\. → 14 janv\. · fait 24 oct\. → en cours Taille à venir prévu 24 oct\. → 28 févr\. · fait rien encore$/.test(t) && /<span class="v ok">départ 31/.test(h) && /<span class="v dx">à venir/.test(h) && (h.match(/<details class="pil-tv-e">/g) || []).length === 2 && (h.match(/<\/summary><p class="pil-tv-dt">prévu <b>/g) || []).length === 2, t];
  });
  T('⑤ « Le temps de l’équipe » : replié, la présence et la part dans les rangs ; ouvert, la barre, trois lignes, la ligne orange du tracteur et « Régler »', P.includes("var _subT='de pr\\u00e9sence \\u00b7 '+(_surch?('surcharge \\u00d7'+_xR):(_pV+' % dans les rangs'));")
    && P.includes("return _pilTile('temps','#4A9FC8','Le temps de l\\u2019\\u00e9quipe', _pilStat(_pilNum(_prez),' h'), _subT, null, body);")
    && P.includes("+((_tH>0)?'':('<div class=\"pil-tv-al\"><span>Le tracteur n\\u2019a pas de bar\\u00e8me</span>'+_pilTvBtn('tracbar','R\\u00e9gler')+'</div>'));"));
  T('⑤ … « Il faut N personnes à temps plein… en moyenne » passe dans le « i », avec les chiffres du jour (fiche vivante)', P.includes("if(window._mvInfoSet) window._mvInfoSet('pil.avc.temps',{ p:[_vif].concat(_base0) });") && !/Une moyenne n\\u2019est pas un pic\.<\/b>'\+/.test(P));
  T('⑤ « Échéances » : replié, la fin de la dernière tâche ; ouvert, la fin de tout, une ligne par tâche, « la plus longue » en pastille ; sans « ≈ » (hors de la police : le cliquet SUBSET)', P.includes("subHtml=(rows.length>1?'fin de la derni\\u00e8re : ':'fin : ')+_fin") && !/u2248/.test(corps(S.pil, '_pilPanelEcheances'))
    && P.includes("(long?'<span class=\"pil-tv-pl or\">la plus longue</span>':'')") && P.includes("return _pilTile('echeances','#C9A84C','\\u00c9ch\\u00e9ances', statHtml, subHtml, null, body);") && !/pôle long/.test(P));
  T('⑤ « Carte du domaine » : replié, le nombre de parcelles et la vue choisie (plus un troisième « 16 % »)', P.includes("return _pilTile('carte','#7FA83A','Carte du domaine', _pilStat(nP,' parcelle'+(nP>1?'s':''),null), ha+' ha \\u00b7 color\\u00e9es par '+_lentM, null, body);"));
  T('⑤ les cinq « i » ont leur fiche, et la Carte dit son nouveau chiffre', ['pil.avc.avancement', 'pil.avc.charge', 'pil.avc.frise', 'pil.avc.courbe', 'pil.avc.echeances'].every((k) => S.uti.includes("  '" + k + "': { t: '"))
    && S.uti.includes("'Le chiffre est le nombre de parcelles en place, avec leur surface ; l’avancement est en tête de l’onglet.") && /'« pers\. » : des personnes à temps plein, en moyenne sur la campagne\./.test(S.uti));
  // ⑥ le lexique
  const neuf = ['_pilRenderGauge', '_pilTabAvc', '_pilTvPhrase', '_pilTvDatesFn', '_pilPhotosHtml', '_pilPanelTemps', '_pilPanelEcheances', '_pilEcartHtml', '_pilPanelCarte'].map((n) => sansCom(corps(S.pil, n))).join('\n');
  const chaines = (neuf.match(/'(?:[^'\\]|\\.)*'/g) || []).join(' ');
  T('⑥ les mots du lexique : plus « réalisées », « restantes », « planifiées », « Effectif », « à trouver », « dépensés », « ETP », « pôle long », « ~ » à l’écran de l’onglet',
    !/réalis|restante|planifi|Effectif|\\u00e0 trouver|à trouver|d\\u00e9pens|dépens|ETP|p\\u00f4le|pôle|'~'/.test(chaines) && / fait<\/span>'/.test(chaines) && / reste<\/span>'/.test(chaines), (chaines.match(/réalis|restante|planifi|Effectif|à trouver|dépens|ETP|pôle/) || [''])[0]);
  T('⑥ « à prévoir », « engagé », « campagne » : les mots du lexique sont là (PORTEE-1 : le bandeau de la campagne)', /' \\u00e0 pr\\u00e9voir'/.test(S.pil) && /'engag\\u00e9 \\u00b7 budget '/.test(S.pil) && S.pil.includes("Aucune t\\u00e2che sur la campagne</div>"));
  // ⑦ la feuille, l'aide, le guide, l'annonce, les versions
  T('⑦ les règles du lot sont dans pilotage.css (styles.css est au plafond), lue après aujourdhui.css', S.pcss.includes('★★★ MOTS-8 (§590)') && !/pil-tv-|mvk-det|mvk-pt/.test(S.css) && Buffer.byteLength(S.css) <= 1024 * 1024
    && S.app.indexOf("import './pilotage.css';") > S.app.indexOf("import './aujourdhui.css';") && S.app.indexOf("import './aujourdhui.css';") > 0);
  T('⑦ ce qui se déplie se touche sur 44 px ; le point d’une tuile a sa zone de toucher', /\.mvk-det > summary \.mvk-ligne\{min-height:44px\}/.test(S.pcss) && /\.pil-tv-e > summary\{[^}]*min-height:44px/.test(S.pcss) && /\.pil-tv-tu \.pil-flag::after\{content:"";position:absolute;inset:-18px\}/.test(S.pcss));
  T('⑦ au téléphone, les trois tuiles tiennent de front, un filet entre elles (le bloc GABARIT-1 les empilait)', /@media \(max-width:760px\)\{[\s\S]*#page-pilotage \.pil-photos\.pil-tv-tu\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(S.pcss)
    && S.pcss.includes('#page-pilotage .pil-photos.pil-tv-tu > .pil-photo + .pil-photo{border-top:0 !important;border-left:var(--bw,1px) solid var(--ligne,#E7E6E2) !important}'));
  T('⑦ l’aide du Pilotage dit la phrase, les tuiles, la couleur, le toucher et les boutons', /« La campagne »\) s’ouvre sur une phrase : ce qui est fait, et la fin prévue/.test(S.uti) && /une couleur par tâche, la même partout dans l’onglet/.test(S.uti) && /Chaque carte a son bouton : « Ouvrir » mène au module où l’on agit/.test(S.uti));
  T('⑦ le guide aussi', /Travaux s'ouvre sur une phrase : ce qui est fait, et la fin prévue/.test(S.guide) && /<b>équipe au pic<\/b>/.test(S.guide) /* PORTEE-1 (§591) : « Renfort » est parti avec les tuiles de l'année */ && /[Uu]ne couleur par tâche, la même partout dans l'onglet/.test(S.guide));
  const wn = S.wn.slice(S.wn.indexOf("  { v: '11.18',"), S.wn.indexOf("  { v: '11.17',"));
  T('⑦ l’annonce 11.18 : pour l’admin, sans « & », et dit « Aucun calcul ne change »', wn.length > 200 && /pour: \['admin'\], emoji: '[a-z]+', titre: 'Pilotage, onglet Travaux\\u00a0: les mêmes cartes, moins de mots'/.test(wn) && !/titre: '[^']*&/.test(wn) && /Aucun calcul ne change/.test(wn));
  const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1] || '0', nApp = parseFloat(app);
  T('⑦ les versions : APP 11.18 au moins, partout la même ; le service worker dit le lot', nApp >= 11.18 && (S.idx.match(new RegExp('v' + app.replace('.', '\\.') + '\\b', 'g')) || []).length >= 4 && S.idx.includes('/boot.js?v=' + app)
    && S.sw.includes('// v12.09 (17/11/2026) — MOTS-8 (§590)') && parseFloat((S.sw.match(/const CACHE_NAME {3}= 'mavigne-v(\d+\.\d+)';/) || [, '0'])[1]) >= 12.09, app);
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  const rt = ref && ref.mesures && ref.mesures['téléphone'] && ref.mesures['téléphone']['Pilotage › Travaux'];
  T('⑦ la référence des mots est regravée : Travaux au téléphone à 65 mots au plus (104 avant), 2 hors lexique (16 avant : « Avancement », le titre validé, et la vue de la carte)', !!rt && rt.mots <= 65 && rt.lex <= 2 && rt.p15 === 0, rt ? JSON.stringify(rt) : 'absente');
  T('⑦ la maquette validée est au dépôt, et dite au LISEZMOI', /Pilotage › Travaux, maquette v1/.test(S.maq) && /`maquette-pilotage-travaux-v1\.html` — Pilotage › Travaux allégé sur place/.test(S.lm));
  T('⑦ ce harnais et ses contre-épreuves sont dans la liste', S.liste.includes("['node scripts/mv-harnais-mots8.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots8.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-8 (§590) — Pilotage › Travaux allégé sur place\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['une carte quitte l’onglet (Échéances)', sur('pil', "  if(_pilShow('avc_echeances')) panels+=_pilPanelEcheances(d,m);\n", '')],
    ['« Échéances » recalcule sa fin (plus celle du rendu)', sur('pil', "panels+=_pilPanelEcheances(d,m);", "panels+=_pilPanelEcheances(d);")],
    ['« Ouvrir les parcelles » disparaît', sur('pil', "+'<div class=\"pil-tv-act\">'+_pilTvBtn('parcelles','Ouvrir les parcelles')+'</div></div>';", "+'</div>';")],
    ['« Ouvrir la carte » ouvre la liste', sur('pil', "var _vo=(cible==='carte')?'carte':'liste';", "var _vo='liste';")],
    ['« Régler » ne mène plus aux activités du tracteur', sur('pil', "tracact:   ['tracteur','tracteur','set-sec-act-trac','_mvReglOpen'],", "tracact:   ['tracteur','tracteur','set-sec-tracteurs','_mvReglOpen'],")],
    ['le clic sur « Ouvrir » n’est plus écouté', sur('pil', "var _tg=e.target.closest('[data-tvgo]');", "var _tg=null;")],
    ['« N-1 » reprend son nom long', sur('pil', 'aria-pressed="false">N-1</button>', 'aria-pressed="false">Comparatif N-1</button>')],
    ['le titre du donut reprend « · restante »', sur('pil', `id="pil-pie-title">La charge par t\\u00e2che'`, `id="pil-pie-title">La charge par t\\u00e2che \\u00b7 restante'`)],
    ['la phrase ne colore plus un retard', sur('pil', "var cl=(m.marge==null)?'':(m.marge<0?' ko':(m.marge>0?' ok':''));", "var cl='';")],
    ['la phrase écrit le 1er comme « 1 »', sur('pil', "(dt.getDate()===1?'1er':dt.getDate())", "dt.getDate()")],
    ['la phrase ne dit plus quand l’équipe ne suffit pas', sur('pil', "else if(m && m.capa && m.capa.ok===false) h+=", "else if(false) h+=")],
    ['le sous-titre-question revient sur Travaux', sur('pil', "((tab==='avc'||tab==='equ')?'':_pilEsc(_pilTabLabel(tab)))", "_pilEsc(_pilTabLabel(tab))")],
    ['la phrase ne se pose plus', sur('pil', "if(_ph) _ph.innerHTML=_pilTvPhrase(d,_mAvc);", "")],
    ['« voir le détail » revient sur les tuiles', sur('pil', "+'<span class=\"s\">'+sous+'</span></button>';", "+'<span class=\"s\">'+sous+'</span><span class=\"go\">voir le d\\u00e9tail \\u203A</span></button>';")],
    ['le « ! » revient écrit dans le point', sur('pil', `aria-label="'+_pilEsc(titre)+'"></span>';`, `aria-label="'+_pilEsc(titre)+'">!</span>';`)],
    ['la phrase d’avant ne passe plus au survol', sur('pil', "(tt?' title=\"'+_pilEsc(tt)+'\"':'')", "''")],
    ['le donut reprend la couleur du rang', sur('pil', "src.forEach(function(x){ x.c=_pilTCol(x.n); });", "src.forEach(function(x,i){ x.c=_PIL_PIE_COLORS[i%_PIL_PIE_COLORS.length]; });")],
    ['deux tâches prennent la même couleur', sur('pil', "return _PIL_PIE_COLORS[i%_PIL_PIE_COLORS.length];\n}", "return _PIL_PIE_COLORS[0];\n}")],
    ['la frise garde sa table à part', sur('pil', "function _taskColor(nom){ return _pilTCol(nom); }", "var _PIL_TASK_COL={};\nfunction _taskColor(nom){ return _PIL_TASK_COL[nom]||'#8A5A38'; }")],
    ['la barre d’avancement prend la couleur de la tâche (plus l’état)', sur('uti', "var ligne=_mvkLigne(nomH, t.pct||0, eqf?'fait':_mvkEtat(t.pct||0,late),", "var ligne=_mvkLigne(nomH, t.pct||0, 'cours',")],
    ['l’Accueil prend un <details> sans rien demander', sur('uti', "var h=dt?('<details class=\"mvk-det\">", "var h=true?('<details class=\"mvk-det\">")],
    ['la ligne dans un <summary> reste un <div>', sur('uti', "_mvkDet(t), false, dt?'span':'div');", "_mvkDet(t), false, 'div');")],
    ['les dates d’une tâche oublient le retard', sur('pil', "if(late) out.push('<b class=\"ko\">sa fen\\u00eatre est pass\\u00e9e</b>');", "")],
    ['les dates suivent une autre campagne', sur('pil', "var cd=null; try{ cd=_pilVueEstConsultee()?_pilCdVue():null; }", "var cd=null; try{ cd=_pilCdVue(); }")],
    ['l’écart perd sa couleur', sur('pil', "cls=(ds>1)?'ko':((ds<-1)?'ok':'');", "cls='';")],
    ['l’écart reprend ses lignes longues (plus de détail au toucher)', sur('pil', "+'<span class=\"v'+(cls?' '+cls:'')+'\">'+v+'</span></summary><p class=\"pil-tv-dt\">'+det+'</p></details>';", "+'<span class=\"v'+(cls?' '+cls:'')+'\">'+v+'</span></summary></details><p>'+det+'</p>';")],
    ['« Régler » disparaît du tracteur sans barème', sur('pil', "_pilTvBtn('tracbar','R\\u00e9gler')", "''")],
    ['la fiche du temps ne dit plus les chiffres du jour', sur('pil', "if(window._mvInfoSet) window._mvInfoSet('pil.avc.temps',{ p:[_vif].concat(_base0) });", "")],
    ['« pôle long » revient', sur('pil', "'<span class=\"pil-tv-pl or\">la plus longue</span>'", "'<b>p\\u00f4le long</b>'")],
    ['la Carte redit l’avancement', sur('pil', "_pilStat(nP,' parcelle'+(nP>1?'s':''),null)", "_pilStat(d.gaugePct,' %',null)")],
    ['une fiche « i » manque', sur('uti', "  'pil.avc.courbe': { t: '", "  'pil.avc.courbeX': { t: '")],
    ['« restantes » revient sous la jauge', sur('pil', "'\\u00a0h</b> reste</span>'", "'\\u00a0h</b> restantes</span>'")],
    ['le bloc du lot retourne dans styles.css', (S) => ({ ...S, css: S.css + S.pcss.slice(S.pcss.indexOf('★★★ MOTS-8 (§590)')) })],
    ['la feuille n’est plus importée', sur('app', "import './pilotage.css';", "")],
    ['une ligne qui se déplie ne se touche plus sur 44 px', sur('pcss', '.mvk-det > summary .mvk-ligne{min-height:44px}', '.mvk-det > summary .mvk-ligne{min-height:24px}')],
    ['au téléphone, le bandeau se réempile', sur('pcss', '#page-pilotage .pil-photos.pil-tv-tu > .pil-photo + .pil-photo{border-top:0 !important;', '#page-pilotage .pil-photos.pil-tv-tu > .pil-photo + .pil-photo{border-top:1px !important;')],
    // MOTS-9 (§592) : l’aide de L’équipe & le matériel dit aussi « Ouvrir » mène au module… — le mutant vise la ligne de Travaux.
    ['l’aide ne dit pas les boutons', sur('uti', 'Chaque carte a son bouton : « Ouvrir » mène au module où l’on agit', 'Chaque carte a son bouton : « Ouvrir » ouvre')],
    ['le guide ne dit pas la phrase', sur('guide', "Travaux s'ouvre sur une phrase : ce qui est fait, et la fin prévue", "Travaux s'ouvre sur un sous-titre")],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("titre: 'Pilotage, onglet Travaux"); if (i < 0) throw new Error('motif absent : annonce'); const j = S.wn.lastIndexOf("pour: ['admin']", i); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.09 (17/11/2026) — MOTS-8 (§590)', '// v12.09 (17/11/2026) — divers')],
    ['la référence des mots garde l’ancien Travaux', (S) => { const r = JSON.parse(S.ref); r.mesures['téléphone']['Pilotage › Travaux'].mots = 104; return { ...S, ref: JSON.stringify(r) }; }],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots8.mjs']", "['node scripts/mv-harnais-mots8Z.mjs']")],
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
