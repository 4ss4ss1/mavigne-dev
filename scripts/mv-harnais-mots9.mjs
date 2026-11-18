/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-9 (§592) : PILOTAGE › L'ÉQUIPE & LE MATÉRIEL ALLÉGÉS SUR PLACE — TOUTES LES CARTES RESTENT, REPLIÉES
   Lancer :          node scripts/mv-harnais-mots9.mjs
   Contre-épreuves : node scripts/mv-harnais-mots9.mjs --contre

   POURQUOI IL EXISTE
   Après Travaux (§590), la même règle pour L'équipe & le matériel (décision du 17/11 : les onglets restent dans le Pilotage et
   s'allègent sur place). Mesuré (démo) : 254 mots au téléphone, trois phrases de 15 mots et plus, six mots hors du lexique ;
   « 255 L » écrit trois fois ; la tension, la consommation et les trois grandes cartes des travaux du tracteur ouvertes d'office ;
   « Capacité vs charge » ici, « Équipe au pic » dans Travaux pour le même chiffre. Maquette validée (« Go avec tes
   recommandations », 18/11) : docs/maquettes/maquette-equipe-materiel-v1.html.

   CE QU'IL GARDE
   ① l'onglet : Personnel (Équipe, Présents, Équipe au pic, Tension, Renfort), Matériel (Tracteurs, Cuve GNR, Consommation,
      Travaux tracteur en cours) — dans cet ordre, l'intertitre seulement s'il a une carte, le repli s'il n'y a rien ;
   ② la phrase du haut : les présents, la tension (les mots du cockpit), la cuve sous le seuil, une révision dépassée ;
   ③ chaque carte : un titre, un chiffre, une pastille ; la méthode dans le « i » ; « Ouvrir » vers le module où l'on agit ;
   ④ les travaux du tracteur en UNE carte, la révision dedans ; le gasoil après les travaux dans la carte de la cuve ;
   ⑤ les cartes repliées par défaut ; la tension se déplie quand le cockpit y mène ;
   ⑥ ce qui est parti (les trois grandes cartes, l'ancien détail de la tension, leurs fiches et leur grille) ; les mots du lexique ;
   ⑦ l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { pil: lire('src/pilotage.js'), uti: lire('src/utils.js'), css: lire('src/styles.css'), pcss: lire('src/pilotage.css'),
  wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'),
  lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-equipe-materiel-v1.html') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const texte = (h) => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const BASE = ['_pilEsc', '_pilNum', '_pilDfr', '_pilFmtD', '_pilDfrObj', '_pilNb', '_pilUn', '_pilStat', '_pilTile', '_pilPhPl', '_pilTvBtn', '_pilTensFmtEc'];
function monter(S, noms, extra, glob) {
  const code = (glob || 'var _PIL_STATE={collapsed:{},sub:{pres_cp:1,pres_recup:1,pres_mal:1}};\n') + BASE.concat(noms).map((n) => corps(S.pil, n)).join('\n')
    + '\nvar _PIL_AN_MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];'
    + '\nthis.api={' + BASE.concat(noms).map((n) => n + ':' + n).join(',') + '};';
  const ctx = Object.assign({ Math, Number, String, Array, Object, Date, JSON, isFinite, isNaN, parseInt, parseFloat,
    _mvIcon: () => '<svg class="ic"></svg>', _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '">i</button>', _pilIcoFor: () => '<svg></svg>', window: {} }, extra || {});
  vm.createContext(ctx); vm.runInContext(code, ctx); ctx.api.ctx = ctx; return ctx.api;
}
const TENS = { rows: [{ nom: 'Marie', f: 85, p: 70, ec: 21, sm: 44, niv: 'orange' }, { nom: 'Sophie', f: 80, p: 70, ec: 14, sm: 43, niv: 'orange' }, { nom: 'Jean', f: 70, p: 70, ec: 0, sm: 40, niv: 'ok' }],
  L: { maxMoy: 44, maxHebdo: 48 }, nSeuil: 2, nRouge: 0 };
const D0 = { presentFiches: 4, nVchamp: 4, jourTravaille: true, membres: [{}, {}, {}, {}], presences: [], gnr: { capacite: 1000, niveau: 255, seuil: 300 }, tracs: [{ revReste: 18 }] };

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const P = sansCom(S.pil);

  // ① l'onglet
  essai('① l’onglet : Personnel puis Matériel, les neuf cartes dans l’ordre ; l’intertitre seulement s’il a une carte ; le repli sinon', () => {
    const stub = (id) => () => '[' + id + ']';
    const ex = { _pilShow: () => true, _pilPanelEquipe: stub('equipe'), _pilPanelPresences: stub('presents'), _pilPanelCapacite: stub('pic'), _pilPanelTension: stub('tension'),
      _pilPanelAnRenfort: stub('renfort'), _pilTrxParts: () => ({}), _pilPanelTracteur: stub('tracteurs'), _pilPanelGnr: stub('gnr'), _pilPanelConso: stub('conso'), _pilPanelTrx: stub('trx') };
    const a = monter(S, ['_pilTabEqu'], ex);
    const h = a._pilTabEqu({});
    const b = monter(S, ['_pilTabEqu'], Object.assign({}, ex, { _pilShow: (k) => k.indexOf('mat_') === 0 }));
    const c = monter(S, ['_pilTabEqu'], Object.assign({}, ex, { _pilShow: () => false }));
    const hb = b._pilTabEqu({}), hc = c._pilTabEqu({});
    return [h === '<div class="pil-tv pil-eq"><div class="pil-sec-h">Personnel</div><div class="pil-panels">[equipe][presents][pic][tension][renfort]</div><div class="pil-sec-h">Matériel</div><div class="pil-panels">[tracteurs][gnr][conso][trx]</div></div>'
      && !/Personnel/.test(hb) && /Matériel/.test(hb) && /pil-empty/.test(hc), h];
  });
  T('① l’onglet est rendu par _pilTabEqu, sa phrase prend la sous-ligne (comme Travaux)', P.includes("    host.innerHTML=_pilTabEqu(d);\n    var _phE=document.getElementById('pil-souslig-t'); if(_phE) _phE.innerHTML=_pilEqPhrase(d);")
    && P.includes("'<div class=\"pil-souslig'+((tab==='avc'||tab==='equ')?' pil-tv-souslig':'')+'\"><span id=\"pil-souslig-t\">'+((tab==='avc'||tab==='equ')?'':_pilEsc(_pilTabLabel(tab)))+'</span>'"));

  // ② la phrase
  const ph = (d, tens) => texte(monter(S, ['_pilEqPhrase'], { _pilTensData: () => tens })._pilEqPhrase(d));
  essai('② la phrase : « 4/4 présents, 2 personnes au seuil, cuve GNR sous le seuil »', () => { const t = ph(D0, TENS); return [t === '4/4 présents , 2 personnes au seuil , cuve GNR sous le seuil'.replace(/ ,/g, ' ,'), t]; });
  essai('② … les mots du cockpit : « 1 au-delà du maximum » prime ; « personne au seuil » ; une révision dépassée ; un jour sans travail', () => {
    const a = ph(Object.assign({}, D0, { gnr: { capacite: 1000, niveau: 800, seuil: 300 } }), Object.assign({}, TENS, { nRouge: 1 }));
    const b = ph(Object.assign({}, D0, { gnr: null }), Object.assign({}, TENS, { nSeuil: 0 }));
    const c = ph(Object.assign({}, D0, { jourTravaille: false, gnr: null, tracs: [{ revReste: -3 }] }), null);
    return [a === '4/4 présents , 1 au-delà du maximum' && b === '4/4 présents , personne au seuil' && c === 'pas de travail prévu aujourd’hui , révision dépassée', [a, b, c].join(' | ')];
  });
  T('② la phrase porte ses couleurs : au seuil et la cuve en attention, le maximum et la révision en rouge (pilotage.css)',
    P.includes("p.push('<b class=\"or\">'+TS.nSeuil+' personne'") && P.includes("p.push('<b class=\"ko\">'+TS.nRouge+' au-del\\u00e0 du maximum</b>')")
    && S.pcss.includes('#page-pilotage .pil-tv-ph b.or{color:var(--attention-texte)}'));

  // ③ les cartes
  essai('③ « Présents » : 4/4 et « au complet » ; sinon « 1 absent » en orange ; la méthode dans le « i » ; « Ouvrir le planning »', () => {
    const a = monter(S, ['_pilPanelPresences'], { window: {} });
    const h = a._pilPanelPresences(D0), t = texte(h);
    const h2 = a._pilPanelPresences(Object.assign({}, D0, { presentFiches: 3 }));
    return [/^<div class="pil-tile( open)?" data-pid="presences">/.test(h) && t === 'Présents i ▸ 4/4 au complet Ouvrir le planning' && /pil-tv-pl ok">au complet/.test(h)
      && /pil-tv-pl or">1 absent</.test(h2) && h.includes('data-tvgo="planning"') && h.includes('data-mvi="pil.presences"'), t];
  });
  essai('③ « Tension » : « 2 au seuil », 14 jours face au planning, une ligne par personne au toucher, « Ouvrir le planning »', () => {
    const a = monter(S, ['_pilPanelTension'], { _pilTensData: () => TENS });
    const h = a._pilPanelTension({}), t = texte(h);
    return [/^Tension i ▸ 2 au seuil 14 derniers jours, face au planning Marie 85 h \+21 % Sophie 80 h \+14 % Jean 70 h 0 %/.test(t) && (h.match(/class="pil-tens-r"/g) || []).length === 3
      && h.includes('data-mvi="pil.tens"') && h.includes('data-tvgo="planning"') && !/Les 14 derniers jours|détail/.test(t), t];
  });
  essai('③ « Cuve GNR » : 255 L une fois, « sous le seuil », le seuil sur la barre, « Ouvrir l’entretien » ; l’après-travaux quand il y a des litres', () => {
    const a = monter(S, ['_pilPanelGnr'], { _pilEmptyGo: () => '' });
    const h = a._pilPanelGnr(D0, null), t = texte(h);
    const h2 = a._pilPanelGnr(D0, { cuve: { src: 'conso du réglage', html: '<div class="pil-trx-casc">X</div>' } });
    return [t === 'Cuve GNR i ▸ 255 L sous le seuil seuil 300 L · cuve de 1 000 L Ouvrir l’entretien' && /<u style="left:30\.0%"/.test(h) && h.includes('data-tvgo="entretien"')
      && (t.match(/255/g) || []).length === 1 && /Après les travaux en cours<small>conso du réglage<\/small><\/div><div class="pil-trx-casc">X/.test(h2) && !/Après les travaux/.test(h), t];
  });
  essai('③ « Travaux tracteur en cours » : « 1 en cours », « 1 sans barème » (jamais « reste 0,0 h · 0 L ») ; avec un barème, « reste 4,5 h · 27 L » ; la révision dedans ; orange, sa pastille monte', () => {
    const a = monter(S, ['_pilPanelTrx'], { _pilGmFr: (v) => String(v.toFixed(1)).replace('.', ',') });
    const J = { n: 1, hT: 0, lT: 0, nSansH: 1, html: '<i>TRAVAUX</i>' };
    const ok = a._pilPanelTrx({}, { jobs: J, rev: { titre: 'Révision · New Holland', etat: 'pas atteinte', cls: 'ok', html: '<i>REV</i>' } });
    const or = a._pilPanelTrx({}, { jobs: J, rev: { titre: 'Révision · New Holland', etat: 'atteinte pendant : Griffage', cls: 'or', html: '' } });
    const t = texte(ok), l2 = (or.match(/<div class="pil-th-l2">([\s\S]*?)<\/div>/) || [])[1] || '';
    const deux = texte(a._pilPanelTrx({}, { jobs: { n: 2, hT: 4.5, lT: 27, nSansH: 1, html: '' }, rev: null }));
    return [/^Travaux tracteur en cours i ▸ 1 en cours 1 sans barème TRAVAUX Révision · New Holland pas atteinte REV Ouvrir le tracteur$/.test(t)
      && /▸ 2 en cours reste 4,5 h · 27 L · 1 sans barème Ouvrir le tracteur$/.test(deux)
      && /pil-tv-pl or">Révision atteinte pendant : Griffage/.test(l2) && !/pil-tv-pl/.test((ok.match(/<div class="pil-th-l2">([\s\S]*?)<\/div>/) || [])[1] || '')
      && ok.includes('data-tvgo="tracteur"') && a._pilPanelTrx({}, { jobs: null, rev: null }) === '', t];
  });
  T('③ « Équipe au pic » : le nom, le chiffre et la pastille de la tuile de Travaux (les mêmes : _pilPicPortee) ; deux barres sur la même échelle',
    P.includes("return _pilTile('capacite','#C9A84C','\\u00c9quipe au pic', _pilStat(_pilEtpFmt(req),' pers.')+pl, sub, null, body, 'pil.capacite');")
    && P.includes("(manque>0.05?_pilPhPl('+'+_pilUn(manque)+' \\u00e0 pr\\u00e9voir','or'):_pilPhPl('l\\u2019\\u00e9quipe suffit','ok'))")
    && P.includes("_pilPhPl(man>0.05?('+'+_pilUn(man)+' \\u00e0 pr\\u00e9voir'):(A?'l\\u2019\\u00e9quipe suffit':'pic pass\\u00e9'), man>0.05?'or':(A?'ok':''))")
    && P.includes("var mxC=Math.max(prevu,req,0.1);") && !/Options : renfort saisonnier/.test(P) && !/pCouv/.test(P));
  T('③ « Renfort » : « 0 » et « l’équipe suffit », ou « +N pers. » et « à prévoir » ; il écrit son année ; « Simuler un renfort »',
    P.includes("stat=_pilStat('0','')+_pilPhPl('l\\u2019\\u00e9quipe suffit','ok');") && P.includes("stat=_pilStat('+'+f0.n, ' pers.')+_pilPhPl('\\u00e0 pr\\u00e9voir','or');")
    && P.includes("var _cadL=(C&&C.court)?((C.cadre==='vig'?'ann\\u00e9e vigne ':'exercice ')+C.court+' \\u00b7 '):'';") && P.includes('sub=_cadL+(R.finCouv?') && P.includes('sub=_cadL+(f0.a<=C.auj?') && P.includes("return _pilTile('anrenfort','#C9A84C','Renfort', stat, sub, null, body, 'pil.an.renfort');")
    && P.includes("_pilTvBtn('renfort','Simuler un renfort')") && !/Combien recruter, quand, et ce que co/.test(P));
  T('③ « Équipe » (le nombre, plus « actifs ») ; « Tracteurs » (le nombre, la révision la plus proche) ; « Consommation » (le réglage quand rien n’est mesuré)',
    P.includes("_pilStat(_nColl>0?_nPers:d.membres.length, '', null),") && P.includes("_pilTvBtn('equipe','Ouvrir l\\u2019\\u00e9quipe')")
    && P.includes("return _pilTile('tracteur','#4A9FC8','Tracteurs', _pilStat(n,''") && P.includes("'révision dans '+_pilNum(_pr.revReste)")
    && P.includes("_pilStat(_pilGmFr(flotte!=null?flotte:cfgLh), ' L/h', null)+(flotte!=null?_pilPhPl('mesur\\u00e9e','ok'):_pilPhPl('r\\u00e9glage',''))") && !P.includes("pil-cso-msg") && !/var msg=/.test(corps(P, '_pilPanelConso')));
  essai('③ « Ouvrir » : l’équipe, l’entretien et le renfort par les chemins de _pilGo ; le tracteur et le planning par goTo', () => {
    const vu = [];
    const a = monter(S, ['_pilTvGo'], { window: { _pilGo: (c) => vu.push('go:' + c), goTo: (m) => vu.push('to:' + m) } });
    ['equipe', 'entretien', 'renfort', 'tracteur', 'planning'].forEach((c) => a._pilTvGo(c));
    return [vu.join(',') === 'go:equipe,go:entretien,go:renfort,to:tracteur,to:planning', vu.join(',')];
  });

  // ④ ⑤ ⑥
  T('④ une seule source pour les travaux du tracteur (_pilTrxParts) : la carte des travaux et la cuve la lisent ; la cascade seulement avec des litres',
    P.includes("try{ X=_pilTrxParts(d); }") && P.includes("if(_pilShow('mat_gnr')) M+=_pilPanelGnr(d,X);") && P.includes("if(_pilShow('mat_travaux')) M+=_pilPanelTrx(d,X);")
    && S.pil.includes("    if(avecL.length){\n      // ★ L'ECHELLE (GNR-2)"));
  T('⑤ repliées par défaut : la tension, la consommation, les travaux du tracteur (avec les autres)', /collapsed:\{tension:1,conso:1,trx:1,echeances:1,/.test(P));
  T('⑤ « Voir le détail » du cockpit déplie la tension et la montre', P.includes("if(_PIL_STATE && _PIL_STATE.collapsed) _PIL_STATE.collapsed.tension=0;")
    && P.includes("_pilFlash(document.querySelector('#pil-content .pil-tile[data-pid=\"tension\"]'))") && !/pil-tension-det/.test(P));
  const partis = ['_pilTabPrs(', '_pilTabMat(', '_pilCardTension(', '_pilCkTracteur(', '_pilAnyShow(', 'Gasoil apr', 'Pour finir les travaux tracteur', 'pil-trx-cote', 'Capacité vs charge', "'Parc tracteur'", "'Consommation mesurée'"];
  const reste = partis.filter((k) => P.includes(k));
  T('⑥ partis : les trois grandes cartes, l’ancien détail de la tension, l’intertitre orphelin, les anciens noms', reste.length === 0, reste.join(', '));
  T('⑥ leur grille (styles.css) et leurs fiches (pil.trxrev, pil.trxgnr) sont parties ; leur texte vit dans pil.trx et pil.gnr ; pil.tens existe',
    !/pil-trx-cote|\.pil-tension-det/.test(S.css) && !/'pil\.trx(rev|gnr)'/.test(S.uti) && S.uti.includes("'<b>La révision dans ces travaux</b> (au toucher) : la carte prend")
    && S.uti.includes("'<b>Après les travaux en cours</b> (au toucher, quand un travail a des litres à compter) : le niveau de la cuve") && S.uti.includes("  'pil.tens': { t: 'Tension', p: ["));
  const fns = ['_pilTabEqu', '_pilEqPhrase', '_pilPanelTension', '_pilPanelTrx', '_pilPanelGnr', '_pilPanelPresences', '_pilPanelEquipe', '_pilPanelTracteur', '_pilPanelCapacite', '_pilPanelAnRenfort', '_pilPanelConso'];
  const chaines = (fns.map((n) => sansCom(corps(S.pil, n))).join('\n').match(/'(?:[^'\\]|\\.)*'/g) || []).join(' ');
  const hors = chaines.match(/actifs|Pr\\u00e9sences|Présences|pour finir|\\u00e0 trouver|à trouver|effectif|r\\u00e9alis|réalis|restante|planifi|d\\u00e9pens|dépens/);
  T('⑥ les mots du lexique (§580c) dans les cartes de l’onglet : plus « actifs », « Présences », « pour finir », « à trouver »', !hors, hors ? hors[0] : '');
  T('⑥ les noms des cartes dans « Choisir les indicateurs »', P.includes("equ:[['prs_equipe','Équipe'],['prs_presences','Présents'],['prs_capacite','Équipe au pic'],['auj_tension','Tension'],['an_frise','Renfort'],['mat_tracteur','Tracteurs'],['mat_gnr','Cuve GNR'],['mat_conso','Consommation'],['mat_travaux','Travaux tracteur en cours']]"));

  // ⑦
  T('⑦ l’aide : la phrase et les cartes, la tension, les alertes matériel', S.uti.includes("['L’équipe & le matériel se lit d’un coup d’œil', ") && S.uti.includes("la carte « Tension » le redit et, touchée, montre une ligne par personne")
    && S.uti.includes("Dans L’équipe & le matériel, « Travaux tracteur en cours » dit ce qui reste à faire"));
  T('⑦ le guide : L’équipe & le matériel, le tracteur sur les travaux en cours, « Renfort »', S.guide.includes("<h3>{ic:equipe} L'équipe &amp; le matériel</h3>") && S.guide.includes('<li><b>La révision dans ces travaux</b>')
    && S.guide.includes('<li><b>Renfort</b>') && !S.guide.includes('Gasoil après les travaux</b>'));
  const iW = S.wn.indexOf("{ v: '11.20'"), jW = S.wn.indexOf("{ v: '11.19'");
  T('⑦ l’annonce 11.20, pour l’administrateur seulement', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin']") && S.wn.slice(iW, jW).includes('Équipe au pic'));
  // DEBORD-1 (§593) : les lots suivants montent les versions — 11.20 au moins, partout la même ; le changelog du SW garde la ligne du lot.
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑦ les versions : APP 11.20 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.20 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && /const CACHE_NAME   = 'mavigne-v12\.\d+';/.test(S.sw) && S.sw.includes('// v12.11 (18/11/2026) — MOTS-9 (§592)'));
  T('⑦ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('L’équipe & le matériel') && S.lm.includes('maquette-equipe-materiel-v1.html'));
  T('⑦ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots9.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots9.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-9 (§592) — Pilotage › L’équipe & le matériel allégés sur place\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['une carte quitte l’onglet (la tension)', sur('pil', "  if(_pilShow('auj_tension')) P+=_pilPanelTension(d);\n", '')],
    ['l’ordre change (la cuve avant les tracteurs)', sur('pil', "  if(_pilShow('mat_tracteur')) M+=_pilPanelTracteur(d);\n  if(_pilShow('mat_gnr')) M+=_pilPanelGnr(d,X);\n", "  if(_pilShow('mat_gnr')) M+=_pilPanelGnr(d,X);\n  if(_pilShow('mat_tracteur')) M+=_pilPanelTracteur(d);\n")],
    ['un intertitre orphelin', sur('pil', "    +(P?'<div class=\"pil-sec-h\">Personnel</div><div class=\"pil-panels\">'+P+'</div>':'')", "    +'<div class=\"pil-sec-h\">Personnel</div><div class=\"pil-panels\">'+P+'</div>'")],
    ['la phrase ne prend plus la sous-ligne', sur('pil', "var _phE=document.getElementById('pil-souslig-t'); if(_phE) _phE.innerHTML=_pilEqPhrase(d);", "")],
    ['la phrase oublie la cuve', sur('pil', "  if(g && g.capacite && (Number(g.niveau)||0)<=(Number(g.seuil)||0)) p.push('<b class=\"or\">cuve GNR sous le seuil</b>');\n", '')],
    ['la phrase dit « au seuil » quand le maximum est dépassé', sur('pil', "    if(TS.nRouge) p.push('<b class=\"ko\">'+TS.nRouge+' au-del\\u00e0 du maximum</b>');\n    else if", "    if")],
    ['« au complet » ne se dit plus', sur('pil', "_pilPhPl('au complet','ok')", "''")],
    ['« Présences du jour » revient', sur('pil', "_pilTile('presences','#C9A84C','Présents',", "_pilTile('presences','#C9A84C','Présences du jour',")],
    ['la tension reprend ses trois titres', sur('pil', "    '14 derniers jours, face au planning', null, body, 'pil.tens');", "    'Les 14 derniers jours — détail', null, body, 'pil.tens');")],
    ['« 255 L » s’écrit deux fois', sur('pil', "    'seuil '+_pilNum(seuil)+' L \\u00b7 cuve de '+_pilNum(cap)+' L', null, body, 'pil.gnr');", "    _pilNum(niveau)+' L \\u00b7 seuil '+_pilNum(seuil)+' L \\u00b7 cuve de '+_pilNum(cap)+' L', null, body, 'pil.gnr');")],
    ['le seuil quitte la barre', sur('pil', "    +(seuil>0?'<u style=\"left:'+Math.min(100,seuil/cap*100).toFixed(1)+'%\" title=\"seuil '+_pilNum(seuil)+' L\"></u>':'')+'</div>'", "    +'</div>'")],
    ['l’après-travaux quitte la cuve', sur('pil', "    +((X&&X.cuve)?('<div class=\"pil-tv-fh\">Après les travaux en cours<small>'+X.cuve.src+'</small></div>'+X.cuve.html):'')\n", '')],
    ['la pastille de la révision ne monte plus', sur('pil', "  if(Rv && Rv.cls!=='ok') stat+=", "  if(false) stat+=")],
    ['« pour finir » revient', sur('pil', "?('reste '+_pilGmFr(Jb.hT)+' h \\u00b7 '+_pilNum(Jb.lT)+' L'):'')", "?(_pilGmFr(Jb.hT)+' h \\u00b7 '+_pilNum(Jb.lT)+' L pour finir'):'')")],
    ['« Équipe au pic » reprend son ancien nom', sur('pil', "return _pilTile('capacite','#C9A84C','\\u00c9quipe au pic', _pilStat(_pilEtpFmt(req)", "return _pilTile('capacite','#C9A84C','Capacit\\u00e9 vs charge', _pilStat(_pilEtpFmt(req)")],
    ['les deux barres reprennent chacune leur échelle', sur('pil', "  var mxC=Math.max(prevu,req,0.1);", "  var mxC=Math.max(prevu,0.1);")],
    ['le renfort n’écrit plus son année', sur('pil', "    sub=_cadL+(R.finCouv?", "    sub=(R.finCouv?")],
    ['« à trouver » revient sous le graphe du renfort', sur('pil', "renfort \\u00e0 pr\\u00e9voir</span>'", "renfort \\u00e0 trouver</span>'")],
    ['« actifs » revient', sur('pil', "_pilStat(_nColl>0?_nPers:d.membres.length, '', null),", "_pilStat(_nColl>0?_nPers:d.membres.length, ' actifs', null),")],
    ['le paragraphe de 36 mots revient', sur('pil', "<div class=\"pil-cso'+(nIv?'':' compact')+'\"><ul class=\"pil-cso-l\">", "<div class=\"pil-cso'+(nIv?'':' compact')+'\"><p class=\"pil-cso-msg\">Aucun tracteur n\\u2019a encore assez de pleins.</p><ul class=\"pil-cso-l\">")],
    ['« reste 0,0 h · 0 L » revient pour un travail sans barème', sur('pil', "sub=((Jb.n>Jb.nSansH)?('reste '", "sub=((true)?('reste '")],
    ['« Ouvrir l’entretien » mène ailleurs', sur('pil', "    if(cible==='equipe'||cible==='entretien'||cible==='renfort'){ window._pilGo(cible); return; }", "    if(cible==='equipe'||cible==='renfort'){ window._pilGo(cible); return; }")],
    ['la consommation s’ouvre d’office', sur('pil', "  collapsed:{tension:1,conso:1,trx:1,", "  collapsed:{tension:1,trx:1,")],
    ['« Voir le détail » ne déplie plus la tension', sur('pil', "if(_PIL_STATE && _PIL_STATE.collapsed) _PIL_STATE.collapsed.tension=0;", "")],
    ['les trois grandes cartes reviennent', (S) => ({ ...S, pil: S.pil + "\nfunction _pilCkTracteur(d){ return '<div class=\"pil-tile2\">Gasoil après les travaux</div>'; }" })],
    ['la fiche de la révision redevient à part', (S) => ({ ...S, uti: S.uti.replace("  'pil.tens': { t:", "  'pil.trxrev': { t: 'x', p: [] },\n  'pil.tens': { t:") })],
    ['l’aide ne dit pas la carte « Tension »', sur('uti', 'la carte « Tension » le redit et, touchée, montre une ligne par personne', 'la carte du dessous montre une ligne par personne')],
    ['le guide garde la section du gasoil', sur('guide', '<li><b>La révision dans ces travaux</b>', '<li><b>Gasoil après les travaux</b>')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("{ v: '11.20'"); const j = S.wn.indexOf("pour: ['admin']", i); if (i < 0 || j < 0) throw new Error('motif absent : annonce'); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + "pour: ['admin']".length) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.11 (18/11/2026) — MOTS-9 (§592)', '// v12.11 (18/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-equipe-materiel-v1.html', 'maquette-equipe-materiel-vX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots9.mjs']", "['node scripts/mv-harnais-mots9Z.mjs']")],
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
