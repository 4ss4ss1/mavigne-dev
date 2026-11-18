/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-10 (§594) : PILOTAGE › DÉCIDER ALLÉGÉ SUR PLACE — UNE PHRASE, TROIS CARTES REPLIÉES
   Lancer :          node scripts/mv-harnais-mots10.mjs
   Contre-épreuves : node scripts/mv-harnais-mots10.mjs --contre

   POURQUOI IL EXISTE
   Après Travaux (§590) et L'équipe & le matériel (§592), la même règle pour Décider (décision du 17/11 : les onglets restent dans
   le Pilotage et s'allègent sur place). Mesuré (démo) : 377 mots à l'arrivée, deux phrases de plus de 20 mots, cinq mots hors du
   lexique (« pour finir » ×2, « au champ » ×2, « ~ ») ; la tournée ouverte d'office (3,8 écrans au téléphone) ; « 3 nov. » trois
   fois dans « Qui fait quoi » ; « Aucune tournée pour ce travail » puis « Aucune tournée diffusée » ; « Enregistrer la diffuse à
   l'équipe » pour un bouton parti avec TRN-1 (§330) ; « Simuler un renfort » menait à un Renfort replié. Maquette validée
   (« go », 18/11) avec ses trois recommandations : docs/maquettes/maquette-decider-v1.html.

   CE QU'IL GARDE
   ① l'onglet : la tournée, Qui fait quoi, le Renfort — dans cet ordre, sous .pil-tv.pil-dc ; le repli s'il n'y a rien ;
   ② la phrase du haut : le travail, où l'équipe sera ce soir, la fin prévue (rouge si elle déborde), le renfort, « simulation » —
      lue sur les calculs des cartes (_DZ_LAST, _DZ_REP_LAST, _RF_RES), jamais un calcul de plus ; elle suit les essais ;
   ③ les en-têtes : « La tournée du jour », « Qui fait quoi », « Renfort » ; « fin prévue », la pastille (tient, déborde, ne finit
      pas, l'équipe suffit, à prévoir) ; « présents » ;
   ④ les corps : les cases ne parlent que d'une modification ou d'une absence ; « Ce soir » ; le verdict qui tient en pastille ;
      « déjà au plus proche » en pastille ; une ligne pour la tournée de l'équipe ; plus de consigne « Enregistrer » ; « environ » ;
      « Qui fait quoi » sans redite, avec « Ouvrir la priorité du moment » (administrateur) ;
   ⑤ les cartes repliées par défaut, la tournée comprise ; un raccourci déplie sa carte ET l'enregistre (_pilDeplier) ; « Simuler
      un renfort » (cockpit, L'équipe) ouvre le Renfort ;
   ⑥ les mots du lexique ; les consignes sorties de l'écran vivent dans le « i » ;
   ⑦ l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { pil: lire('src/pilotage.js'), uti: lire('src/utils.js'), pcss: lire('src/pilotage.css'), vue: lire('src/cockpit-vue.js'),
  wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'),
  lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-decider-v1.html') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const texte = (h) => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const BASE = ['_pilEsc', '_pilStat', '_pilTile', '_pilPhPl', '_pilTvBtn', '_dzIso', '_dzDt', '_dzJ', '_dzJc', '_dzHj', '_dzMin', '_dzPers', '_dzPl', '_dzPt', '_dzRepFin'];
const GLOB = "var _PIL_STATE={collapsed:{},sub:{}};\nvar _DZ_JS=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];\n"
  + "var _DZ_MS=['janv.','f\\u00e9vr.','mars','avr.','mai','juin','juil.','ao\\u00fbt','sept.','oct.','nov.','d\\u00e9c.'];\n";
function monter(S, noms, extra, glob) {
  const code = GLOB + (glob || '') + BASE.concat(noms).map((n) => corps(S.pil, n)).join('\n') + '\nthis.api={' + BASE.concat(noms).map((n) => n + ':' + n).join(',') + '};';
  const ctx = Object.assign({ Math, Number, String, Array, Object, Date, JSON, isFinite, isNaN, parseInt, parseFloat,
    _mvIcon: () => '<svg class="ic"></svg>', _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '">i</button>', _pilIcoFor: () => '<svg></svg>',
    _opTNom: (n) => n, _dzAuj: () => '2026-10-27', _dzMod: () => false, _dzRepSim: () => false, _pilTabLabel: () => 'Décider', window: {} }, extra || {});
  vm.createContext(ctx); vm.runInContext(code, ctx); ctx.api.ctx = ctx; return ctx.api;
}
// La tournée de la démo (27/10) : Palissage, 6 jours, le soir à La Combotte, fenêtre jusqu'au 28 févr.
const jours = (n, deb) => Array.from({ length: n }, (_, i) => ({ iso: '2026-' + (deb + i > 31 ? '11-0' + (deb + i - 31) : '10-' + (deb + i)), parcs: [0] }));
const C0 = (o = {}) => Object.assign({ rows: [{ nom: 'La Combotte' }, { nom: 'Champ de la Croix' }], ref: { iso: '2026-10-27' }, e0: { n: 4, J: 8 },
  sim: { days: [{ iso: '2026-10-27', parcs: [0] }, { iso: '2026-10-28', parcs: [0] }, { iso: '2026-10-29', parcs: [0, 1] }, { iso: '2026-10-30', parcs: [1] }, { iso: '2026-11-02', parcs: [1] }, { iso: '2026-11-03', parcs: [1] }], bloque: false },
  ver: [{ t: 'Palissage', ok: true, f: { fin: '2027-02-28' } }] }, o);
const R0 = (o = {}) => Object.assign({ mode: 'prio', ref: '2026-10-27', nJour: 4, taches: [{ t: 'Palissage', fin: '2026-11-03', ok: true, rien: false, arret: false }] }, o);

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const P = sansCom(S.pil);

  // ① l'onglet
  essai('① l’onglet : la tournée, Qui fait quoi, le Renfort, dans cet ordre, sous .pil-tv.pil-dc ; le repli sinon', () => {
    const stub = (id) => () => '[' + id + ']';
    const ex = { _pilShow: () => true, _pilPanelOrdrePassage: stub('tournee'), _pilPanelSimulateur: stub('quifait'), _pilPanelRenfort: stub('renfort') };
    const h = monter(S, ['_pilTabSim'], ex)._pilTabSim({});
    const h2 = monter(S, ['_pilTabSim'], Object.assign({}, ex, { _pilShow: () => false }))._pilTabSim({});
    return [h === '<div class="pil-tv pil-dc"><div class="pil-panels">[tournee][quifait][renfort]</div></div>' && /pil-empty/.test(h2), h];
  });
  T('① la phrase prend la sous-ligne, APRÈS les trois cartes (elle lit leurs calculs)', P.includes("    host.innerHTML=_pilTabSim(d);\n    _pilDcPhraseMaj();")
    && P.includes("'<div class=\"pil-souslig'+((tab==='avc'||tab==='equ'||tab==='sim')?' pil-tv-souslig':'')+'\"><span id=\"pil-souslig-t\">'+((tab==='avc'||tab==='equ'||tab==='sim')?'':_pilEsc(_pilTabLabel(tab)))+'</span>'"));

  // ② la phrase
  const PH = (C, R, Q, ex, glob) => {
    const a = monter(S, ['_pilDcPhrase'], Object.assign({ _pilShow: () => true }, ex || {}),
      'var _PIL_OP={tasks:["Palissage"]}, _DZ_LAST=' + JSON.stringify(C) + ', _DZ_REP_LAST=' + JSON.stringify(R) + ', _RF_RES=' + JSON.stringify(Q) + ';\n' + (glob || ''));
    return a._pilDcPhrase();
  };
  essai('② « Palissage : ce soir à La Combotte, fin prévue 3 nov., l’équipe suffit »', () => {
    const h = PH(C0(), R0(), { ok: true, pointe: 0 }), t = texte(h);
    return [t === 'Palissage : ce soir à La Combotte , fin prévue 3 nov. , l’équipe suffit' && /^<span class="pil-tv-ph">/.test(h) && !/class="ko"/.test(h), t];
  });
  essai('② … un autre jour (« le 28 oct. »), la fin qui déborde en rouge, le renfort à prévoir en orange, « simulation »', () => {
    const a = texte(PH(C0({ ref: { iso: '2026-10-28' } }), R0(), { ok: true, pointe: 0 }));
    const hb = PH(C0({ ver: [{ t: 'Palissage', ok: false, f: { fin: '2026-10-30' } }] }), R0(), { ok: true, pointe: 3 }, { _dzMod: () => true });
    const b = texte(hb);
    const c = texte(PH(C0({ sim: { days: [{ iso: '2026-10-27', parcs: [0] }], bloque: true } }), R0(), null));
    return [a.startsWith('Palissage : le 28 oct. à La Combotte') && b === 'Palissage : ce soir à La Combotte , fin prévue 3 nov. · déborde , 3 saisonniers à prévoir , simulation'
      && /<b class="ko">3 nov\.<\/b>/.test(hb) && /<b class="or">3/.test(hb) && /ne finit pas/.test(c), [a, b, c].join(' | ')];
  });
  essai('② … sans la tournée (masquée), la fin de « Qui fait quoi » ; rien à dire : le libellé de l’onglet', () => {
    const a = texte(PH(C0(), R0(), { ok: true, pointe: 0 }, { _pilShow: (k) => k !== 'sim_ordre' }));
    const b = texte(PH(null, null, null, { _pilShow: () => false }));
    return [a === 'fin prévue 3 nov. , l’équipe suffit' && b === 'Décider', a + ' | ' + b];
  });
  T('② la phrase suit les essais : _pilSimRefresh la repeint (la tournée y finit aussi)', corps(S.pil, '_pilSimRefresh').includes('_pilDcPhraseMaj();')
    && corps(S.pil, '_pilOpRefresh').includes('_pilSimRefresh();') && /if\(_PIL_TAB!=='sim'\) return;/.test(corps(S.pil, '_pilDcPhraseMaj')));
  T('② aucun calcul de plus : la phrase lit _DZ_LAST, _DZ_REP_LAST et _RF_RES', !/_dzCalc\(|_dzRep\(|_rfBody\(|_dzSimuler\(/.test(corps(S.pil, '_pilDcPhrase'))
    && /_DZ_LAST/.test(corps(S.pil, '_pilDcPhrase')) && /_DZ_REP_LAST/.test(corps(S.pil, '_pilDcPhrase')) && /_RF_RES/.test(corps(S.pil, '_pilDcPhrase')));

  // ③ les en-têtes
  essai('③ la tournée : « 6 jours · fin prévue 3 nov. » et « tient » ; « déborde », « ne finit pas » ; pas de pastille sans fenêtre', () => {
    const a = monter(S, ['_dzStatTour', '_dzPlTour', '_dzSubTour'], {}, 'var _PIL_OP={tasks:["Palissage"]};\n');
    const t1 = texte(a._dzStatTour(C0())), h1 = a._dzStatTour(C0());
    const t2 = texte(a._dzStatTour(C0({ ver: [{ ok: false }] }))), t3 = texte(a._dzStatTour(C0({ sim: Object.assign({}, C0().sim, { bloque: true }) }))), t4 = texte(a._dzStatTour(C0({ ver: [] })));
    const s1 = a._dzSubTour(C0());
    return [t1 === '6 jours · fin prévue 3 nov. tient' && /pil-tv-pl ok">tient/.test(h1) && t2.endsWith('déborde') && t3.endsWith('ne finit pas') && t4 === '6 jours · fin prévue 3 nov.'
      && texte(s1) === 'Palissage · dès le 27 oct. · 4 pers. × 8 h', [t1, t2, t3, t4, s1].join(' | ')];
  });
  essai('③ Qui fait quoi : « 3 nov. fin prévue » et « tient » ; « déborde » ; « 4 présents le 27 oct. »', () => {
    const a = monter(S, ['_dzStatRep', '_dzSubRep']);
    const t1 = texte(a._dzStatRep(R0())), t2 = texte(a._dzStatRep(R0({ taches: [{ t: 'P', fin: '2026-11-03', ok: false, rien: false }] }))), s = a._dzSubRep(R0());
    const t3 = texte(a._dzStatRep(R0({ taches: [{ t: 'P', arret: true }] })));
    return [t1 === '3 nov. fin prévue tient' && t2 === '3 nov. fin prévue déborde' && t3 === '— un travail ne finit pas' && texte(s) === '1 priorité · 4 présents le 27 oct.', [t1, t2, t3, s].join(' | ')];
  });
  T('③ les titres : « La tournée du jour », « Qui fait quoi », « Renfort » ; le Renfort reprend les pastilles de L’équipe',
    P.includes("_pilTile('ordrepassage','#C9A84C','La tourn\\u00e9e du jour',") && P.includes("_pilTile('simulateur','#C9A84C','Qui fait quoi',")
    && P.includes("return _pilTile('renfort','#C9A84C','Renfort', stat,") && P.includes("_pilPhPl('\\u00e0 pr\\u00e9voir','or') : _pilStat('0','')+_pilPhPl('l\\u2019\\u00e9quipe suffit','ok');")
    && P.includes("'aux heures du planning, sans heures sup', null,") && !/jusqu\\u2019o\\u00f9|r\\u00e9partir l\\u2019\\u00e9quipe|combien, et quand/.test(P));

  // ④ les corps
  const C_ = (n) => sansCom(corps(S.pil, n));
  const RG = C_('_dzReglagesHtml'), RS = C_('_dzResultatHtml'), TR = C_('_dzTriHtml'), LI = C_('_dzListeHtml'), RP = C_('_dzRepHtml');
  T('④ les cases ne parlent que d’une modification (« planning de mardi », « allonge la présence », « calculés sur les distances » partis)',
    !/planning de '|allonge la pr|calcul\\u00e9s sur les distances|journ\\u00e9e continue/.test(RG) && RG.includes("(jMod?'modifi\\u00e9 \\u2014 planning\\u00a0: '+_dzHj(C.jPlan):'')")
    && S.pcss.includes('#page-pilotage .pil-dc .pil-dz-set .src:empty{display:none}'));
  essai('④ la case Équipe : « affectée à la priorité », une équipe collective, les absents — plus « toute l’équipe au champ »', () => {
    const a = monter(S, ['_dzEqSrc']);
    const v = a._dzEqSrc({ ctx: { base: { src: 'tous' } }, e0: { pers: [{ nom: 'A', n: 1 }], abs: [] } });
    const w = a._dzEqSrc({ ctx: { base: { src: 'prio' } }, e0: { pers: [{ nom: 'Coll', n: 3 }], abs: [{ nom: 'Paul', motif: 'congé' }, { nom: 'X', motif: 'hors contrat' }] } });
    return [v === '' && w === 'affectée à la priorité · dont Coll ×3 · Paul congé', JSON.stringify([v, w])];
  });
  T('④ le résultat : « Ce soir », « reste 43 h · reprise le 28 oct. », « fin prévue », le verdict qui tient en pastille, « +2 personnes »',
    RS.includes("(d1.iso===_dzAuj()?'Ce soir':_dzJ(d1.iso)+', le soir')") && RS.includes("'reste <b>'+_opFmtH(reste)+'</b> \\u00b7 reprise le '") && RS.includes("<span>fin pr\\u00e9vue <b>'")
    && RS.includes("'<div class=\"pil-dz-vl\">'+nom+_pilPhPl('tient \\u00b7 fen\\u00eatre jusqu\\u2019au '+_dzJc(v.f.fin),'ok')+'</div>'") && RS.includes("'<br>Il faudrait <b>+'+_dzPl(v.besoin,'personne')+'</b> chaque jour.'")
    && !/le soir, l\\u2019\\u00e9quipe est|pour finir|jours travaill\\u00e9s|trajets compris/.test(RS));
  T('④ le rendement : « déjà au plus proche » en pastille, plus de phrase', C_('_dzRendementHtml').includes("(R.same?'<span class=\"r\">'+_pilPhPl('déjà au plus proche','ok')+'</span>':'')")
    && !/déjà celui/.test(C_('_dzRendementHtml')));
  T('④ une ligne pour la tournée de l’équipe, « Ici, un essai », plus la boîte « diffusée » ni la consigne de 21 mots',
    TR.includes("'Tourn\\u00e9e de l\\u2019\\u00e9quipe\\u00a0: '+(trn?") && TR.includes("'<p class=\"pil-dz-essai\">Ici, un essai\\u00a0: rien n\\u2019est enregistr\\u00e9.</p>'")
    && !/_opDiffusHtml|Les tris ci-dessus|puis ajuste/.test(TR) && !/function _opDiffusHtml\(/.test(P));
  T('④ la liste : plus de consigne « Enregistrer », la reprise en une ligne ; la carte dit « trajet environ » (« ≈ » est hors de la police, PORTEE-1)', !/Enregistrer/.test(LI) && LI.includes("'<div class=\"pil-dz-note\"><b>\\u21c5</b> prend une parcelle, une <b>fente dor\\u00e9e</b> la repose'")
    && LI.includes("reprise\\u00a0: '+_pilEsc(rp.nom)+' \\u00b7 '") && P.includes("trajet environ '+_opFmtM(dist)") && !P.includes('trajet ~ ') && !/\\u2248|≈/.test(P));
  T('④ Qui fait quoi : plus de « À partir du … », le bilan pour plusieurs travaux seulement, « Ouvrir la priorité du moment » (administrateur)',
    !/m\\u00eame jour, m\\u00eame planning|ajoute une personne/.test(RP) && RP.includes("if(bloq||R.taches.length>1) h+='<div class=\"pil-dz-bil\">")
    && RP.includes("if(_opCanEdit()) h+='<div class=\"pil-tv-act\">'+_pilTvBtn('priorite','Ouvrir la priorit\\u00e9 du moment')+'</div>';")
    && /cible==='priorite'\)\{ window\._pilGo\(cible\)/.test(corps(S.pil, '_pilTvGo')));

  // ⑤ repliées, et les raccourcis qui déplient
  T('⑤ repliées par défaut : la tournée aussi (avec Qui fait quoi et le Renfort)', /collapsed:\{[^}]*simulateur:1,renfort:1,[^}]*ordrepassage:1\}/.test(P));
  T('⑤ _pilDeplier ouvre ET enregistre ; la tension et le renfort s’en servent', /function _pilDeplier\(id\)\{[^\n]*_PIL_STATE\.collapsed\[id\]=0; _pilSaveState\(_PIL_STATE\);/.test(P)
    && P.includes("    if(cible==='tension'){\n      _pilDeplier('tension');") && P.includes("    if(cible==='renfort'){\n      _pilDeplier('renfort');")
    && P.includes("_pilVersCarte(document.querySelector('#pil-content .pil-tile[data-pid=\"renfort\"]'));") && /t\.style\.scrollMarginTop=/.test(corps(S.pil, '_pilVersCarte')));
  T('⑤ « Simuler un renfort » du cockpit passe par _pilGo(\'renfort\')', S.vue.includes("  if (k === 'sim' && typeof window._pilGo === 'function') { window._pilGo('renfort'); return; }"));

  // ⑥ le lexique, et le « i »
  const fns = ['_pilDcPhrase', '_dzStatTour', '_dzSubTour', '_dzStatRep', '_dzSubRep', '_dzTravauxHtml', '_dzEqSrc', '_dzReglagesHtml', '_dzResultatHtml', '_dzTriHtml', '_dzListeHtml', '_dzRepHtml', '_pilPanelRenfort', '_opMapSvg'];
  const chaines = (fns.map((n) => sansCom(corps(S.pil, n))).join('\n').match(/'(?:[^'\\]|\\.)*'/g) || []).join(' ');
  const hors = chaines.match(/pour finir|au champ|restantes?|r\\u00e9alis|réalis|effectif|planifi|' ?~ /);
  T('⑥ les mots du lexique (§580c) : plus « pour finir », « au champ », « restantes », « ~ »', !hors, hors ? hors[0] : '');
  T('⑥ les consignes sorties de l’écran vivent dans le « i » (pil.tournee ; « + ajoute une personne » dans pil.quifait)',
    S.uti.includes("'<b>L\\u2019ordre de passage</b> : les tris sont un essai, rien n\\u2019est enregistré ici.") && S.uti.includes('la double flèche prend une parcelle, une fente dorée la repose')
    && S.uti.includes("'<b>+</b> ajoute une personne à ce travail : d\\u2019abord quelqu\\u2019un sans priorité ce jour-là, puis un renfort."));

  // ⑦
  T('⑦ l’aide : Décider se lit d’un coup d’œil', S.uti.includes("['Décider se lit d’un coup d’œil', ") && S.uti.includes('« Ouvrir la priorité du moment » la fixe'));
  T('⑦ le guide : la phrase, les cartes repliées, « Ouvrir la priorité du moment », « Simuler un renfort »', S.guide.includes('trois cartes <b>repliées</b> : la tournée du jour, qui fait quoi, et le renfort')
    && S.guide.includes('« Ouvrir la priorité du moment » mène là où') && S.guide.includes('« Simuler un renfort », depuis Aujourd\'hui ou') && !S.guide.includes("La tournée du jour — jusqu'où ?"));
  const iW = S.wn.indexOf("{ v: '11.22'"), jW = S.wn.indexOf("{ v: '11.21'");
  T('⑦ l’annonce 11.22, pour l’administrateur seulement', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin']") && S.wn.slice(iW, jW).includes('Ouvrir la priorité du moment'));
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑦ les versions : APP 11.22 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.22 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && /const CACHE_NAME   = 'mavigne-v12\.\d+';/.test(S.sw) && S.sw.includes('// v12.13 (18/11/2026) — MOTS-10 (§594)'));
  T('⑦ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('Pilotage — Décider') && S.lm.includes('maquette-decider-v1.html'));
  T('⑦ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots10.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots10.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-10 (§594) — Pilotage › Décider allégé sur place\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['une carte quitte l’onglet (Qui fait quoi)', sur('pil', "  if(_pilShow('sim_etsi')) H+=_pilPanelSimulateur(d);\n  if(_pilShow('sim_cout')) H+=_pilPanelRenfort(d);\n  if(!H)", "  if(_pilShow('sim_cout')) H+=_pilPanelRenfort(d);\n  if(!H)")],
    ['l’onglet perd la règle des cartes allégées', sur('pil', "return '<div class=\"pil-tv pil-dc\"><div class=\"pil-panels\">'+H+'</div></div>';", "return '<div class=\"pil-panels\">'+H+'</div>';")],
    ['la phrase ne prend plus la sous-ligne', sur('pil', "    host.innerHTML=_pilTabSim(d);\n    _pilDcPhraseMaj();", "    host.innerHTML=_pilTabSim(d);")],
    ['la phrase ne suit plus les essais', sur('pil', "  _pilDcPhraseMaj();   // MOTS-10", "  //   // MOTS-10")],
    ['la phrase oublie où l’équipe sera ce soir', sur('pil', "' \\u00e0 <b>'+_pilEsc(st.nom)+'</b>'", "''")],
    ['la phrase ne rougit plus quand ça déborde', sur('pil', "p.push('fin pr\\u00e9vue <b'+(ko?' class=\"ko\"':'')", "p.push('fin pr\\u00e9vue <b'+(false?' class=\"ko\"':'')")],
    ['la phrase recalcule la tournée', sur('pil', "var p=[], C=_pilShow('sim_ordre')?_DZ_LAST:null,", "var p=[], C=_pilShow('sim_ordre')?_dzCalc():null,")],
    ['« pour finir » revient dans l’en-tête', sur('pil', "(n>1?' jours':' jour')+' \\u00b7 fin pr\\u00e9vue '+_dzJc(fin))", "(n>1?' jours':' jour')+' pour finir \\u00b7 '+_dzJc(fin))")],
    ['la tournée perd sa pastille', sur('pil', "  return C.ver.some(function(v){ return !v.ok; })?_pilPhPl('d\\u00e9borde','ko'):_pilPhPl('tient','ok');", "  return '';")],
    ['« au champ » revient', sur('pil', "' pr\\u00e9sents le '+_dzJc(R.ref)", "' pers. au champ le '+_dzJc(R.ref)")],
    ['le titre redevient une question', sur('pil', "_pilTile('ordrepassage','#C9A84C','La tourn\\u00e9e du jour',", "_pilTile('ordrepassage','#C9A84C','La tourn\\u00e9e du jour \\u2014 jusqu\\u2019o\\u00f9\\u00a0?',")],
    ['« planning de mardi · par personne » revient', sur('pil', "(jMod?'modifi\\u00e9 \\u2014 planning\\u00a0: '+_dzHj(C.jPlan):'')", "(jMod?'modifi\\u00e9 \\u2014 planning\\u00a0: '+_dzHj(C.jPlan):'planning de '+_DZ_JL[_dzDt(C.ref.iso).getDay()]+' \\u00b7 par personne')")],
    ['« toute l’équipe au champ » revient sous Équipe', sur('pil', "  if(b.src==='prio') out.push('affect\\u00e9e \\u00e0 la priorit\\u00e9');", "  out.push(b.src==='prio'?'affect\\u00e9e \\u00e0 la priorit\\u00e9':'toute l\\u2019\\u00e9quipe au champ');")],
    ['le verdict redevient une phrase', sur('pil', "_pilPhPl('tient \\u00b7 fen\\u00eatre jusqu\\u2019au '+_dzJc(v.f.fin),'ok')", "'tient dans la fen\\u00eatre jusqu\\u2019au '+_dzJc(v.f.fin)")],
    ['« L’ordre actuel est déjà celui… » revient', sur('pil', "(R.same?'<span class=\"r\">'+_pilPhPl('déjà au plus proche','ok')+'</span>':'')", "''")],
    ['la boîte « diffusée » revient', sur('pil', "    +'<p class=\"pil-dz-essai\">Ici, un essai\\u00a0: rien n\\u2019est enregistr\\u00e9.</p>';\n  return h;", "    +'<p class=\"pil-dz-essai\">Ici, un essai\\u00a0: rien n\\u2019est enregistr\\u00e9.</p>';\n  return h+_opDiffusHtml();")],
    ['« Enregistrer la diffuse » revient', sur('pil', "la repose'+(hasCom?'\\u00a0; <b>\\u21c5 bloc</b>\\u00a0: toute une commune':'')+'.</div>';", "la repose'+(hasCom?'\\u00a0; <b>\\u21c5 bloc</b>\\u00a0: toute une commune':'')+'. <b>Enregistrer</b> la diffuse.</div>';")],
    ['« ~ » revient sur la carte', sur('pil', 'trajet environ ', 'trajet ~ ')],
    ['« ≈ » (hors de la police, PORTEE-1) arrive sur la carte', sur('pil', 'trajet environ ', 'trajet \\u2248 ')],
    ['le bilan « travail fini » revient pour un seul travail', sur('pil', "  if(bloq||R.taches.length>1) h+='<div class=\"pil-dz-bil\">", "  if(true) h+='<div class=\"pil-dz-bil\">")],
    ['« Ouvrir la priorité du moment » part', sur('pil', "  if(_opCanEdit()) h+='<div class=\"pil-tv-act\">'+_pilTvBtn('priorite','Ouvrir la priorit\\u00e9 du moment')+'</div>';\n", '')],
    ['le bouton ne mène nulle part', sur('pil', "||cible==='renfort'||cible==='priorite'){ window._pilGo(cible); return; }", "||cible==='renfort'){ window._pilGo(cible); return; }")],
    ['la tournée arrive ouverte', sur('pil', ',dre:1,ordrepassage:1},', ',dre:1},')],
    ['_pilDeplier n’enregistre plus', sur('pil', "_PIL_STATE.collapsed[id]=0; _pilSaveState(_PIL_STATE);", "_PIL_STATE.collapsed[id]=0;")],
    ['« Simuler un renfort » ne déplie plus le renfort', sur('pil', "    if(cible==='renfort'){\n      _pilDeplier('renfort');", "    if(cible==='renfort'){")],
    ['le cockpit retombe sur l’onglet sans la carte', sur('vue', "  if (k === 'sim' && typeof window._pilGo === 'function') { window._pilGo('renfort'); return; }\n", '')],
    ['la consigne de rangement quitte le « i »', sur('uti', 'la double flèche prend une parcelle, une fente dorée la repose', 'on range à la main')],
    ['l’aide ne dit pas Décider', sur('uti', "['Décider se lit d’un coup d’œil', ", "['Décider', ")],
    ['le guide garde l’ancien titre', sur('guide', '<li><b>La tournée du jour</b> : où l\'équipe sera ce soir', "<li><b>La tournée du jour — jusqu'où ?</b> où l'équipe sera ce soir")],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("{ v: '11.22'"); const j = S.wn.indexOf("pour: ['admin']", i); if (i < 0 || j < 0) throw new Error('motif absent : annonce'); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + "pour: ['admin']".length) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.13 (18/11/2026) — MOTS-10 (§594)', '// v12.13 (18/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-decider-v1.html', 'maquette-decider-vX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots10.mjs']", "['node scripts/mv-harnais-mots10Z.mjs']")],
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
