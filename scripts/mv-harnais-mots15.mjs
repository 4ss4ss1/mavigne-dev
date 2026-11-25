/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-15 (§610) : PHYTO › REGISTRE ALLÉGÉ — UNE PHRASE, UNE ANNÉE PAR BLOC
   Lancer :          node scripts/mv-harnais-mots15.mjs
   Contre-épreuves : node scripts/mv-harnais-mots15.mjs --contre

   POURQUOI IL EXISTE
   Mesuré (démo, 25/11) : le Registre empilait quinze traitements depuis 2020, chacun avec sa phrase verte « rentrée
   libre depuis le 12 juin 2020 » ; « 4,2 sur 4 cette année » redit sur chaque traitement au cuivre de l'année, EN VERT (la
   couleur de la rentrée, même au-dessus de 4) ; rien en haut ne disait si l'on pouvait retourner dans les vignes. La fiche
   (ordinateur) écrivait « 10 Sep » sans l'année et « Réentrée » quand la liste dit « rentrée ». Et, vu en route,
   Conformité écrivait le plafond de cuivre 28 en dur quand il se règle (Bilan cuivre). 316 mots au téléphone, 2 546 px.
   Maquette validée (« go », 25/11) avec ses cinq recommandations : docs/maquettes/maquette-phyto-registre-v1.html.

   CE QU'IL GARDE
   ① la phrase, JOUÉE : « Rentrée libre partout » ou « Rentrée interdite sur N parcelles jusqu'à … » ; le cuivre sur sept
      ans seulement près du plafond (dès 87,5 %, orange ; rouge au-delà), au plafond RÉGLÉ ;
   ② l'état de la rentrée d'un traitement, JOUÉ : tant qu'elle est interdite, puis sept jours (après sa fin, ou après le
      traitement quand il n'y a pas de délai) ;
   ③ la liste, JOUÉE (la vraie renderPhytoTrac) : une année par bloc, la plus récente ouverte, le cuivre de l'année sur sa
      ligne, le choix de l'utilisateur gardé ; déplier / replier JOUÉ ;
   ④ la fiche : la date du registre, « Rentrée » ;
   ⑤ Conformité suit le plafond réglé, JOUÉ ;
   ⑥ la feuille de style, l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { tr: lire('src/tracteur.js'), pil: lire('src/pilotage.js'), css: lire('src/styles.css'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'),
  sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/07-phyto.html'), gpil: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'),
  lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-phyto-registre-v1.html') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const decl = (src, d) => { const i = src.indexOf(d); if (i < 0) throw new Error('absent : ' + d); return src.slice(i, src.indexOf(';', i) + 1); };
const texte = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (x) => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NOW = new Date(2026, 9, 27, 11, 0);   // mardi 27 octobre 2026, 11 h
const PARC = ['Clos du Moulin', 'Les Charmes', 'La Combotte', 'Aux Murgers'].map((nom) => ({ nom, statut: 'Actif' }));

// Les aides du registre, montées ensemble ; dreEffectif lit le délai du produit (m.drae) ; l'horloge est fixée.
function monde(S, o) {
  o = o || {};
  const el = { innerHTML: '' }, phr = { innerHTML: '', hidden: true };
  const ctx = { TRAITEMENTS: o.T || [], Date: class extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW.getTime()); } },
    Math, JSON, _escHtml: esc, _escAttr: esc, _mvIcon: (n) => '<svg data-i="' + n + '"></svg>', dreEffectif: (h) => ({ h: Number(h) || 0, motif: '' }),
    document: { getElementById: (id) => (id === 'ph-phrase' ? phr : el) },
    window: { PARCELLES: PARC, _cuPlafond: () => (o.plafAn || 4), _cuPlafond7: () => (o.plafAn || 4) * 7, _cuParcRollSum: (n) => (o.roll || {})[n] || 0,
      _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '"></button>' } };
  vm.createContext(ctx);
  vm.runInContext([decl(S.tr, 'var _PH_MOIS='), decl(S.tr, 'var _PH_ETAT_J='), decl(S.tr, 'var _phAnsOuv='),
    ...['_phJours', '_phHeureFr', '_phDateFr', '_phQuandFr', '_phEtatRentree', '_phEtatUtile', '_phF1', '_phCuivreCumul', '_phCuivreTxt', '_phCuivreAn', '_phPhrase', '_phEtatHtml', '_phParcParts', 'renderPhytoTrac'].map((n) => corps(S.tr, n)),
    'this.__ans=_phAnsOuv;'].join('\n'), ctx);
  const i = S.tr.indexOf('window._phAnBasc=function(b){'); if (i < 0) throw new Error('absent : _phAnBasc');
  vm.runInContext(S.tr.slice(i, S.tr.indexOf('\n};', i) + 3), ctx);
  return { ctx, el, phr };
}
const T1 = (d, h, extra) => Object.assign({ produit: 'Soufre mouillable', type: 'Soufre', dose: '8 kg/ha', drae: 24, date: d, heureFin: h, parcelles: ['Les Charmes', 'La Combotte'], conducteur: 'Paul' }, extra || {});

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };

  // ①
  essai('① rien d’interdit, une parcelle à 96 % du plafond : « Rentrée libre partout · cuivre : 26,8 sur 28 kg/ha en sept ans, Clos du Moulin » (orange)', () => {
    const { ctx } = monde(S, { roll: { 'Clos du Moulin': 26.8, 'Les Charmes': 25.2 } });
    const h = ctx._phPhrase([T1('2026-09-10', '09:00')], NOW);
    return [h === '<b class="ok">Rentrée libre partout</b> · <b class="or">cuivre\u00a0: 26,8 sur 28 kg/ha en sept ans</b>, Clos du Moulin', h];
  });
  essai('① une bouillie finie à 10 h, 6 h de délai : « Rentrée interdite sur 2 parcelles jusqu’à aujourd’hui 16 h 00 »', () => {
    const { ctx } = monde(S, {});
    const h = ctx._phPhrase([T1('2026-10-27', '10:00', { drae: 6 }), T1('2026-09-10', '09:00')], NOW);
    return [texte(h) === 'Rentrée interdite sur 2 parcelles jusqu’à aujourd’hui 16 h 00' && h.includes('<b class="ko">Rentrée interdite</b>'), h];
  });
  essai('① deux interdites : la phrase dit la fin la plus tardive (« demain 9 h 00 »), les parcelles comptées une fois', () => {
    const { ctx } = monde(S, {});
    const h = ctx._phPhrase([T1('2026-10-27', '10:00', { drae: 6 }), T1('2026-10-27', '09:00', { drae: 24, parcelles: ['La Combotte', 'Aux Murgers'] })], NOW);
    return [texte(h) === 'Rentrée interdite sur 3 parcelles jusqu’à demain 9 h 00', h];
  });
  essai('① le cuivre se tait sous 87,5 % ; rouge au-delà du plafond ; il suit le plafond réglé (3 kg/ha par an : 21)', () => {
    const a = monde(S, { roll: { 'Clos du Moulin': 24.4 } }).ctx._phPhrase([], NOW), b = monde(S, { roll: { 'Clos du Moulin': 29.5 } }).ctx._phPhrase([], NOW),
      c = monde(S, { roll: { 'Clos du Moulin': 19 }, plafAn: 3 }).ctx._phPhrase([], NOW);
    return [!a.includes('cuivre') && b.includes('<b class="ko">cuivre\u00a0: 29,5 sur 28') && c.includes('<b class="or">cuivre\u00a0: 19 sur 21 kg/ha'), [a, b, c].join(' | ')];
  });

  // ②
  essai('② l’état de la rentrée : interdite oui ; libre depuis 3 jours oui, depuis 8 non ; sans délai : 3 jours oui, 30 non', () => {
    const { ctx } = monde(S, {}); const U = (t, m) => ctx._phEtatUtile(ctx._phEtatRentree(t, m, NOW), t, NOW);
    const r = [U(T1('2026-10-27', '10:00'), { drae: 24 }), U(T1('2026-10-23', '09:00'), { drae: 24 }), U(T1('2026-10-18', '09:00'), { drae: 24 }),
      U(T1('2026-10-24', '09:00'), { drae: 0, type: 'Biocontrôle' }), U(T1('2026-09-27', '09:00'), { drae: 0, type: 'Biocontrôle' })];
    return [JSON.stringify(r) === '[true,true,false,true,false]', JSON.stringify(r)];
  });

  // ③
  const LISTE = () => [T1('2026-10-27', '10:00', { drae: 6 }), T1('2026-09-10', '09:00'),
    T1('2026-08-25', '09:00', { produit: 'Bouillie bordelaise RSR', type: 'Cuivre', cuMetal: 1.6, parcelles: ['Clos du Moulin'] }),
    T1('2025-07-04', '09:00', { produit: 'Bouillie bordelaise RSR', type: 'Cuivre', cuMetal: 2, parcelles: ['Clos du Moulin', 'Les Charmes'] }),
    T1('2025-06-12', '09:00', { produit: 'Bouillie bordelaise RSR', type: 'Cuivre', cuMetal: 2.2, parcelles: ['Clos du Moulin'] })];
  essai('③ la liste : 2026 ouverte, 2025 repliée sur sa ligne « 2 traitements · cuivre 4,2 sur 4 kg/ha » ; la phrase posée avec son « i »', () => {
    const { ctx, el, phr } = monde(S, { T: LISTE() }); ctx.renderPhytoTrac(); const h = el.innerHTML;
    const s26 = h.slice(h.indexOf('data-an="2026"'), h.indexOf('data-an="2025"')), s25 = h.slice(h.indexOf('data-an="2025"'));
    return [h.indexOf('<section class="ph-an open" data-an="2026"') === 0 && s26.includes('aria-expanded="true"') && !/class="ph-an-l" hidden/.test(s26)
      && h.includes('<section class="ph-an" data-an="2025">') && s25.includes('aria-expanded="false"') && s25.includes('<div class="ph-an-l" hidden>')
      && texte(s25).includes('> 2025 2 traitements · cuivre 4,2 sur 4 kg/ha') && texte(s26).includes('> 2026 3 traitements · cuivre 1,6 sur 4 kg/ha')
      && !phr.hidden && phr.innerHTML.includes('Rentrée interdite') && phr.innerHTML.includes('data-mvi="phyto.registre"'), h.slice(0, 600)];
  });
  essai('③ sur les lignes : l’interdite dite, l’ancienne muette, le cuivre à sa dose et sans « cette année »', () => {
    const { ctx, el } = monde(S, { T: LISTE() }); ctx.renderPhytoTrac(); const t = texte(el.innerHTML);
    return [t.includes('rentrée interdite jusqu’à aujourd’hui 16 h 00') && !t.includes('rentrée libre depuis') && t.includes('cuivre : 1,6 kg Cu/ha')
      && t.includes('cuivre : 2,2 kg Cu/ha') && !t.includes('cette année'), t.slice(0, 500)];
  });
  essai('③ une année dépliée par l’utilisateur le reste au prochain dessin ; déplier / replier tient la classe, aria-expanded et hidden', () => {
    const { ctx, el } = monde(S, { T: LISTE() }); ctx.__ans['2025'] = true; ctx.renderPhytoTrac();
    const ouverte = el.innerHTML.includes('<section class="ph-an open" data-an="2025">');
    const cl = new Set(['ph-an']), l = { hidden: true }, attr = {}; const sec = { dataset: { an: '2024' }, classList: { contains: (c) => cl.has(c), toggle: (c, v) => (v ? cl.add(c) : cl.delete(c)) }, querySelector: () => l };
    const b = { closest: () => sec, setAttribute: (k, v) => { attr[k] = v; } };
    ctx.window._phAnBasc(b); const a1 = [cl.has('open'), attr['aria-expanded'], l.hidden, ctx.__ans['2024']];
    ctx.window._phAnBasc(b); const a2 = [cl.has('open'), attr['aria-expanded'], l.hidden, ctx.__ans['2024']];
    return [ouverte && JSON.stringify(a1) === '[true,"true",false,true]' && JSON.stringify(a2) === '[false,"false",true,false]', JSON.stringify([ouverte, a1, a2])];
  });
  T('③ la liste vide cache la phrase', S.tr.includes("if(!list.length){ const _ph0=document.getElementById('ph-phrase'); if(_ph0) _ph0.hidden=true;"));

  // ④
  T('④ la fiche : la date du registre (« 10 sept. 2026 »), « Rentrée », plus « Réentrée » nulle part dans le Phyto',
    S.tr.includes("var tags=[m.type,m.amm?'AMM '+m.amm:'',_phDateFr(t,now),op].filter(Boolean).map(") && S.tr.includes('<span class="l">Rentr\\u00e9e</span>')
    && S.tr.includes('<div class="trf-alerte">Rentr\\u00e9e interdite jusqu') && !/R\\u00e9entr\\u00e9e|Réentrée/.test(corps(S.tr, '_phFicheHtml')));

  // ⑤
  essai('⑤ Conformité suit le plafond réglé : 3 kg/ha par an, 21 sur sept ans — 19 est en vigilance ; la phrase dit « réglé »', () => {
    const ctx = { window: { PARCELLES: PARC, _cuPlafond7: () => 21, _cuParcRollSum: (n) => ({ 'Clos du Moulin': 19, 'Les Charmes': 22 })[n] || 0 } };
    vm.createContext(ctx); vm.runInContext(corps(S.pil, '_cfmCuivre') + '\nthis.r=_cfmCuivre();', ctx);
    return [ctx.r.plaf === 21 && ctx.r.over === 1 && ctx.r.warn === 1 && S.pil.includes("plafond '+(cu.plaf===28?'UE ':'r\\u00e9gl\\u00e9 ')+'<b>'+cu.plaf+' kg/ha</b>") && !S.pil.includes('plafond UE <b>28 kg/ha</b>'), JSON.stringify(ctx.r)];
  });

  // ⑥
  T('⑥ la feuille : le cuivre en gris, la phrase cachée hors du Registre, la flèche tourne à l’ouverture, la ligne d’une année fait 48 px (une cible) ; la page a sa phrase',
    S.css.includes('.ph-cu{font-weight:var(--fw-med,500);color:var(--texte-doux,#686660);}') && S.css.includes('#page-phyto:not(.ph-reg-on) #ph-phrase{display:none!important;}')
    && S.css.includes('#page-phyto .ph-an.open .ph-an-h .mv-ic{transform:rotate(180deg);}') && S.css.includes('#page-phyto .ph-an-h{display:flex;align-items:center;gap:var(--e-2,8px);width:100%;min-height:var(--h-row-2,48px);') && S.idx.includes('<p class="ph-ph" id="ph-phrase" hidden></p>'));
  T('⑥ le « i » du registre dit la phrase, les années, les sept jours ; celui du cuivre dit le plafond réglé',
    S.uti.includes("'phyto.registre': { t: 'Le registre'") && S.uti.includes('puis <b>sept jours</b> après') && S.uti.includes('S’il est réglé autrement dans le Bilan cuivre, c’est ce plafond qui compte'));
  T('⑥ l’aide et le guide : la phrase, une année par bloc, les sept jours ; « délais de rentrée »',
    S.uti.includes("['Le registre', \"s’ouvre sur une phrase") && S.uti.includes('délais de rentrée et avant récolte') && !S.uti.includes('délais de réentrée')
    && S.guide.includes('Le Registre s\'ouvre sur <b>une phrase</b>') && S.guide.includes('<b>tant que la rentrée est interdite puis sept jours</b>') && S.gpil.includes('(ou celui réglé dans le Bilan cuivre'));
  const iW = S.wn.indexOf("{ v: '11.31'"), jW = S.wn.indexOf("{ v: '11.30'");
  T('⑥ l’annonce 11.31, pour l’administrateur et le tractoriste', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin', 'tractoriste']") && S.wn.slice(iW, jW).includes('registre'));
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑥ les versions : APP 11.31 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.31 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && S.sw.includes('// v12.22 (25/11/2026) — MOTS-15 (§610)'));
  T('⑥ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('Phyto › Registre') && S.lm.includes('maquette-phyto-registre-v1.html'));
  T('⑥ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots15.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots15.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-15 (§610) — Phyto › Registre allégé\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 600) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['la phrase dit « libre » malgré une interdite', sur('tr', "var et=_phEtatRentree(t,m,now); if(!et||et.k!=='interdite') return;", "var et=_phEtatRentree(t,m,now); return;")],
    ['la phrase garde la première fin, pas la plus tardive', sur('tr', 'if(!finMax||et.fin>finMax) finMax=et.fin;', 'if(!finMax) finMax=et.fin;')],
    ['le cuivre parle toujours', sur('tr', 'if(best&&best.s>=0.875*pl) P.push(', 'if(best) P.push(')],
    ['le cuivre de la phrase écrit 28 en dur', sur('tr', "var pl=(typeof window._cuPlafond7==='function')?window._cuPlafond7():28, best=null;", 'var pl=28, best=null;')],
    ['le dépassement reste orange', sur('tr', "'<b class=\"'+(best.s>pl?'ko':'or')+'\">cuivre", "'<b class=\"or\">cuivre")],
    ['l’état de la rentrée parle toujours', sur('tr', "_et=_phEtatUtile(_et0,t,now)?_et0:null", '_et=_et0')],
    ['sept jours deviennent trente', sur('tr', 'var _PH_ETAT_J=7;', 'var _PH_ETAT_J=30;')],
    ['sans délai, l’état parle toujours', sur('tr', "return !isNaN(d) && _phJours(d,now)>=-_PH_ETAT_J;", 'return true;')],
    ['toutes les années s’ouvrent', sur('tr', ':k===0, n=g.l.length', ':true, n=g.l.length')],
    ['le choix de l’utilisateur est oublié', sur('tr', 'const ouv=(_phAnsOuv[g.an]!=null)?_phAnsOuv[g.an]:k===0', 'const ouv=k===0')],
    ['« cette année » revient sur la ligne', sur('tr', "return 'cuivre\\u00a0: '+_phF1(cu)+' kg Cu/ha';", "return 'cuivre\\u00a0: '+_phF1(cu)+' kg Cu/ha \\u00b7 '+_phF1(_phCuivreCumul(String(t.date||'').slice(0,4),t.parcelles))+' sur 4 cette ann\\u00e9e';")],
    ['l’année ne dit plus son cuivre', sur('tr', "+(cu?' \\u00b7 '+_escHtml(cu):'')+'</span>'", "+'</span>'")],
    ['déplier ne retire pas « hidden »', sur('tr', "var l=sec.querySelector('.ph-an-l'); if(l) l.hidden=!ouv;", '')],
    ['la phrase n’est plus posée', sur('tr', "if(ph){ ph.innerHTML=_phPhrase(list,now)", "if(0){ ph.innerHTML=_phPhrase(list,now)")],
    ['la liste vide laisse la phrase', sur('tr', "if(_ph0) _ph0.hidden=true;", '')],
    ['la fiche redit « 10 Sep »', sur('tr', "_phDateFr(t,now),op].filter(Boolean)", '_fmtDate(t.date),op].filter(Boolean)')],
    ['« Réentrée » revient', sur('tr', '<span class="l">Rentr\\u00e9e</span>', '<span class="l">R\\u00e9entr\\u00e9e</span>')],
    ['Conformité repasse à 28 en dur', sur('pil', "var PLAF=(typeof window._cuPlafond7==='function')?window._cuPlafond7():28;", 'var PLAF=28;')],
    ['le cuivre reprend la couleur verte', sur('css', '.ph-cu{font-weight:var(--fw-med,500);color:var(--texte-doux,#686660);}', '.ph-cu{font-weight:var(--fw-med,500);color:var(--ok-texte);}')],
    ['la ligne d’une année redescend à 32 px', sur('css', 'width:100%;min-height:var(--h-row-2,48px);', 'width:100%;min-height:var(--h-ctl);')],
    ['la phrase reste sur le Catalogue', sur('css', '#page-phyto:not(.ph-reg-on) #ph-phrase{display:none!important;}', '')],
    ['le « i » ne dit plus les sept jours', sur('uti', 'puis <b>sept jours</b> après', 'puis plus tard')],
    ['l’aide redit « réentrée »', sur('uti', 'délais de rentrée et avant récolte', 'délais de réentrée et avant récolte')],
    ['le guide ne dit pas la phrase', sur('guide', 'Le Registre s\'ouvre sur <b>une phrase</b>', 'Le Registre s\'ouvre')],
    ['l’annonce est montrée à tout le monde', sur('wn', "pour: ['admin', 'tractoriste'], emoji: 'eprouvette', titre: 'Le registre phyto", "pour: ['tous'], emoji: 'eprouvette', titre: 'Le registre phyto")],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.22 (25/11/2026) — MOTS-15 (§610)', '// v12.22 (25/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-phyto-registre-v1.html', 'maquette-phyto-rX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots15.mjs']", "['node scripts/mv-harnais-mots15Z.mjs']")],
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
