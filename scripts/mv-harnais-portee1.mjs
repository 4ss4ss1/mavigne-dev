/* ───────────────────────────────────────────────────────
   HARNAIS — PORTEE-1 (§591) : « VOUS REGARDEZ » NE RESTE QUE LÀ OÙ IL CHANGE L'ÉCRAN — LA CAMPAGNE SE CHOISIT À LA PASTILLE
   Lancer :          node scripts/mv-harnais-portee1.mjs
   Contre-épreuves : node scripts/mv-harnais-portee1.mjs --contre

   POURQUOI IL EXISTE
   Mesuré sur la démo (17/11) : la barre « Vous regardez » était sur les sept onglets du Pilotage ; quatre l'ignoraient
   (Aujourd'hui, Décider, Archives — Conformité n'en tirait qu'un avertissement) ; Économie n'en lisait que l'année (Le détail) ;
   Travaux n'en lisait que le bandeau, qui comptait l'exercice (1 869 h) au-dessus d'un Avancement de la campagne (1 123 h).
   Et « La campagne » doublait le choix de la campagne de toute l'appli. Une campagne passée consultée gardait une pastille
   verte et des projections (« fin prévue 14 déc. », « 35 jours de retard » pour une campagne close le 23 oct.).
   Maquette validée (« Go », 18/11) : docs/maquettes/maquette-vous-regardez-v1.html — les quatre choix recommandés.

   CE QU'IL GARDE
   ① la campagne se choisit à la pastille du haut : un bouton, le même menu que la Vigne (_seasonMenuToggle avec son ancre) ;
   ② « Vous regardez » ne reste que sur Économie › Le détail, et n'y choisit que l'année (exercice ou année vigne) ;
      Travaux, L'équipe & le matériel et Décider ont une ligne : la campagne, ses dates, le jour (au téléphone, le jour seul) ;
      les autres onglets, rien ;
   ③ le bandeau de Travaux : deux tuiles de la campagne — l'équipe au pic (_pilPicPortee) et le budget engagé (_pecData) ;
   ④ une campagne passée : pastille ambrée, « consultée », et un bilan — la phrase de Travaux, la phrase et la carte de fin
      d'Aujourd'hui (la fin de la CAMPAGNE, pas l'objectif) ;
   ⑤ le zoom par campagne est parti avec ses puces, sa liste, son alias _PIL_ETPSEL, l'avertissement de la Conformité,
      les photos de l'année ; « ≈ » quitte le Pilotage (hors de la police) ; le menu de la campagne tient en une ligne ;
   ⑥ la feuille (pilotage.css), l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { pil: lire('src/pilotage.js'), uti: lire('src/utils.js'), pcss: lire('src/pilotage.css'), app: lire('src/app.js'), ck: lire('src/cockpit-vue.js'),
  wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'),
  lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-vous-regardez-v1.html') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const texte = (h) => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const BASE = ['_pilEsc', '_pilNum', '_pilDfr', '_pilFmtD', '_pilDfrObj', '_pilNb', '_pilUn', '_pilAnnOrd'];
// Les fonctions, montées dans Node avec ce qu'elles lisent ; `glob` : les variables du module qu'elles lisent.
function monter(S, noms, extra, glob) {
  const code = (glob || '') + BASE.concat(noms).map((n) => corps(S.pil, n)).join('\n')
    + '\nvar _PIL_AN_MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];'
    + '\nthis.api={' + BASE.concat(noms).map((n) => n + ':' + n).join(',') + '};';
  const ctx = Object.assign({ Math, Number, String, Array, Object, Date, JSON, isFinite, isNaN, parseInt, parseFloat,
    _mvIcon: () => '<svg class="ic"></svg>', _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '">i</button>', window: {} }, extra || {});
  vm.createContext(ctx); vm.runInContext(code, ctx); ctx.api.ctx = ctx; return ctx.api;
}
const AUJ = '2026-10-27';

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const P = sansCom(S.pil), CK = sansCom(S.ck);

  // ① la pastille
  T('① la pastille de la campagne est un bouton qui annonce son menu (data-pilsaison, aria-haspopup, aria-expanded)',
    P.includes(`return '<button type="button" class="hv2-saison-pill pil-saison-btn'+(cons?' consult':'')+'" data-pilsaison="1" aria-haspopup="true" aria-expanded="false" title="Choisir la campagne">'`));
  T('① … elle ouvre LE menu de la Vigne, ancré sous elle (_seasonMenuToggle(e, ancre)) ; le menu se ferme en la relâchant',
    P.includes("if(_ps){ e.stopPropagation(); if(typeof window._seasonMenuToggle==='function') window._seasonMenuToggle(e,_ps); return; }")
    && /function _seasonMenuToggle\(e,ancre\)\{/.test(S.app) && S.app.includes("var pl=ancre||document.getElementById('hv2-saison-pill');")
    && /\.hv2-saison-pill\.open/.test(S.app));
  T('① … le menu tient en une ligne : « La campagne active s’ouvre par défaut. » (plus « saison », hors du lexique)',
    S.idx.includes('La campagne active s’ouvre par défaut.') && !S.idx.includes('La saison active est la vue par défaut'));

  // ② la ligne d'écran
  essai('② « Vous regardez » ne reste que sur Économie › Le détail ; la ligne de la campagne sur Travaux, L’équipe, Décider ; rien ailleurs', () => {
    const a = monter(S, ['_pilCrumbHtml'], { _pilCrumbAnnee: () => 'AN', _pilCrumbCampagne: () => 'CAMP' }, 'var _PIL_TAB="auj", _PEC_SUB="syn";\n');
    const vu = {};
    for (const [t, s] of [['auj'], ['avc'], ['equ'], ['sim'], ['eco', 'syn'], ['eco', 'exe'], ['cfm'], ['arc']]) { a.ctx._PIL_TAB = t; a.ctx._PEC_SUB = s || 'syn'; vu[t + (s ? '/' + s : '')] = a._pilCrumbHtml(); }
    const j = JSON.stringify(vu);
    return [j === '{"auj":"","avc":"CAMP","equ":"CAMP","sim":"CAMP","eco/syn":"","eco/exe":"AN","cfm":"","arc":""}', j];
  });
  essai('② la ligne de la campagne : « La campagne », ses dates et le jour où l’on est ; au téléphone, le jour seul', () => {
    const a = monter(S, ['_pilCrumbCampagne', '_pilPorteeBornes', '_pilPorteeJour'], { _pilAnAuj: () => AUJ,
      _pilSaison: () => ({ nom: 'Après-vendange 2026-2027', debut: '2026-10-24', fin: '2027-02-28' }), _pilSaisonNom: () => 'Après-vendange 2026-2027',
      window: { getSaisonActive: () => ({ nom: 'Après-vendange 2026-2027' }) } });
    const h = a._pilCrumbCampagne();
    return [h === '<span class="pil-ptcamp-t"><span class="pil-ptlab">La campagne</span><span class="pil-ptbornes">du 24 oct. au 28 févr. · 4ᵉ jour sur 128</span><span class="pil-ptcourt">4ᵉ jour sur 128</span></span>', h];
  });
  essai('② … une campagne passée : « La campagne consultée », « terminée » ; au téléphone « consultée · terminée le 23 oct. »', () => {
    const a = monter(S, ['_pilCrumbCampagne', '_pilPorteeBornes', '_pilPorteeJour'], { _pilAnAuj: () => AUJ,
      _pilSaison: () => ({ nom: 'Printemps 2026', debut: '2026-03-01', fin: '2026-10-23' }), _pilSaisonNom: () => 'Printemps 2026',
      window: { getSaisonActive: () => ({ nom: 'Après-vendange 2026-2027' }) } });
    const t = texte(a._pilCrumbCampagne());
    return [t === 'La campagne consultée du 1 mars au 23 oct. · terminée consultée · terminée le 23 oct.', t];
  });
  essai('② « Vous regardez » ne choisit plus que l’année : l’exercice ou l’année vigne — plus « La campagne »', () => {
    const b = corps(S.pil, '_pilCrumbAnnee');
    const a = monter(S, ['_pilPorteeMode', '_pilPorteeChoisir'], { _pilCadreSet: (c) => { a.ctx._PIL_SCOPE.cadre = c; } }, 'var _PIL_SCOPE={camp:null,cadre:"exo",recul:0};\n');
    a._pilPorteeChoisir('camp'); const m1 = a._pilPorteeMode(), c1 = a.ctx._PIL_SCOPE.camp;
    a._pilPorteeChoisir('vig'); const m2 = a._pilPorteeMode();
    return [b.includes("B('exo','L\\u2019exercice')+B('vig','L\\u2019ann\\u00e9e vigne')") && !/B\('camp'/.test(b) && m1 === 'exo' && c1 === null && m2 === 'vig', [m1, c1, m2].join(' ')];
  });
  essai('② une campagne mémorisée par une version d’avant est oubliée au chargement ; le cadre de l’année, lui, reste', () => {
    const mem = { 'mavigne_pil_scope_t1': 'Vendanges 2026', 'mavigne_pil_cadre_t1': 'vig' };
    const ls = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
    const a = monter(S, ['_pilScopeLoad', '_pilScopeKey', '_pilCadreKey'], { localStorage: ls, _pilTenant: () => 't1' }, 'var _PIL_SCOPE={camp:"x",cadre:"exo",recul:0};\n');
    a._pilScopeLoad();
    return [a.ctx._PIL_SCOPE.camp === null && a.ctx._PIL_SCOPE.cadre === 'vig' && !('mavigne_pil_scope_t1' in mem), JSON.stringify(a.ctx._PIL_SCOPE)];
  });

  // ③ le bandeau de Travaux
  const pStub = { _pilDiag: () => [], _pilSaisonNom: () => 'Après-vendange 2026-2027', _pilSemLabO: () => 'semaine du 28 nov. 2026' };
  let B = null;
  try { B = (extra) => monter(S, ['_pilPhotosHtml', '_pilPhotoHtml', '_pilPhBar', '_pilPhPl', '_pilFlag'], Object.assign({}, pStub, extra)); }
  catch (e) { T('③ le bandeau se monte (' + e.message + ')', false); }
  essai('③ deux tuiles de la campagne : l’équipe au pic (l’équipe suffit) et le budget engagé face au budget', () => {
    const a = B({ _pilPicPortee: (nom) => ({ ok: true, nom, pic: 2.5, picW: { o0: 330 }, av: { pic: 2.5, picW: { o0: 330 }, manque: 0 } }),
      _pecData: () => ({ configured: true, budget: 15784, engage: 1940 }) });
    const h = a._pilPhotosHtml(), t = texte(h);
    return [h.startsWith('<div class="pil-photos pil-tv-tu pil-tv-tu2">') && (h.match(/class="pil-photo"/g) || []).length === 2
      && t === 'Équipe au pic 2,5 pers. l’équipe suffit semaine du 28 nov. 2026 Budget 1 940 € engagé · budget 15 784 €'
      && h.includes('<i style="width:12%"></i>') && h.includes('data-pgo="equ"') && h.includes('data-pgo="eco"'), t];
  });
  essai('③ … le pic lit LA campagne de la pastille (_pilPicPortee(_pilSaisonNom())) ; un renfort à prévoir dit « +N à prévoir » en orange', () => {
    let lu = null;
    const a = B({ _pilPicPortee: (nom) => { lu = nom; return { ok: true, pic: 4.6, picW: { o0: 340 }, av: { pic: 4.6, picW: { o0: 340 }, manque: 1.6 } }; },
      _pecData: () => ({ configured: true, budget: 15784, engage: 1940 }) });
    const h = a._pilPhotosHtml();
    return [lu === 'Après-vendange 2026-2027' && h.includes('<span class="pil-tv-pl or">+1,6 à prévoir</span>'), lu + ' ' + texte(h)];
  });
  T('③ plus de tuile « Travaux », plus les chiffres de l’année (_pilPhotosData) dans le bandeau ; la feuille met deux colonnes',
    !/_pilPhotosData|_pilPhotoEffAn|_pilPhotoBudAn/.test(P) && !/_pilPhotoHtml\('Travaux'/.test(corps(S.pil, '_pilPhotosHtml'))
    && /^#page-pilotage \.pil-photos\.pil-tv-tu\.pil-tv-tu2\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/m.test(S.pcss));

  // ④ une campagne passée
  essai('④ Travaux : une campagne finie ne se projette pas — « 0 % fait, campagne terminée le 23 oct. »', () => {
    const a = monter(S, ['_pilTvPhrase'], { _pilAnAuj: () => AUJ, _pilSaison: () => ({ nom: 'Printemps 2026', fin: '2026-10-23' }) });
    const t = texte(a._pilTvPhrase({ gaugePct: 0, gaugeVide: false }, null)).replace(' ,', ',');
    return [t === '0 % fait, campagne terminée le 23 oct.', t];
  });
  essai('④ la tête du cockpit sait qu’une campagne est finie — par SA fin, pas par l’objectif ; « terminée » au féminin', () => {
    const a = monter(S, ['_pilCk2Per', '_pilPorteeBornes'], { _pilAnAuj: () => AUJ, window: { _pilSaison: () => ({ nom: 'Printemps 2026', debut: '2026-03-01', fin: '2026-10-23' }) } }, 'var _PIL_SCOPE={camp:null};\n');
    const r = a._pilCk2Per();
    const b = monter(S, ['_pilCk2Per', '_pilPorteeBornes'], { _pilAnAuj: () => AUJ, window: { _pilSaison: () => ({ nom: 'Après', debut: '2026-10-24', fin: '2027-02-28' }) } }, 'var _PIL_SCOPE={camp:null};\n');
    const q = b._pilCk2Per();
    return [r.finie === true && r.fin === '2026-10-23' && r.bornesHtml === 'du 1 mars au 23 oct. · terminée' && q.finie === false && q.pct != null, JSON.stringify([r, q])];
  });
  T('④ Aujourd’hui : la phrase d’une campagne finie dit son bilan — « Campagne terminée le… », l’engagé face au budget — avant toute projection',
    CK.includes("const PF = (V.per && V.per.finie && V.per.fin) ? deIso(V.per.fin) : null;\n  if (PF) {")
    && CK.includes("fig('Campagne termin\\u00e9e le ' + dCourt(PF), 'allerFin', 'ck-cap-t', '')")
    && CK.includes("[['engag\\u00e9', eur(r.dep)], ['budget', eur(r.budget)]]") && CK.indexOf('if (PF) {') < CK.indexOf("$('#ck-resume').innerHTML = '<span class=\"ck-res-ph\">' + fig(maj1(temps)")
    && !/\+VISEE < \+AUJ/.test(CK));
  T('④ … la carte de fin : « Fin de la campagne », la date, « N % fait », « Terminée » ; ni frise, ni objectif, ni renfort à simuler',
    CK.includes("if (kt) kt.textContent = PF ? 'Fin de la campagne' : 'Fin prévue';") && CK.includes("e1.className = 'ck-etat fini'; e1.textContent = 'Terminée';")
    && CK.includes("if (carte) carte.classList.toggle('ck-v-finie', !!PF);") && CK.includes('<span id="ck-v-k-t">Fin prévue</span>')
    && S.pcss.includes('#ck-verdict.ck-v-finie .ck-frise,#ck-verdict.ck-v-finie .ck-v-act{display:none}'));
  T('④ la pastille d’une campagne consultée passe à l’ambre (« consultée » ; au téléphone, le nom seul)',
    P.includes("(cons?'<span class=\"pil-cons-t\"> \\u00b7 consult\\u00e9e</span>':'')")
    && S.pcss.includes('body .mod-header .hv2-saison-pill.pil-saison-btn.consult{background:var(--or-pale)!important;color:var(--attention)!important')
    && /@media \(max-width:760px\)\{ #page-pilotage \.pil-cons-t\{display:none\} \}/.test(S.pcss));
  T('④ au téléphone, le nom entier tient avec le chevron (12 px, 2 px d’écart)',
    S.pcss.includes('#page-pilotage .mod-meta-row button.pil-saison-btn{gap:2px}') && S.pcss.includes('#page-pilotage .pil-saison-btn .hv2-sc-chev svg{width:12px;height:12px}'));

  // ⑤ ce qui part
  const partis = ['_pilPorteePopHtml', '_pilAnFriseCadre', 'data-etpc', 'pil-ptpop', 'data-ptpop', '_PIL_ETPSEL', '_pilAvertCfm', '_pilCadreAvert', '_pilPorteeCampDefaut', 'pil-anchip', 'pil-ptbtn'];
  const reste = partis.filter((k) => P.includes(k));
  T('⑤ le zoom par campagne est parti : ses puces, sa liste, son alias _PIL_ETPSEL, l’avertissement de la Conformité', reste.length === 0, reste.join(', '));
  T('⑤ « ≈ » quitte le Pilotage (U+2248 hors de la police) : « environ », ou rien quand l’étiquette dit déjà « probable »',
    // MOTS-9 (§592) : la phrase « Il manque environ N personnes cette semaine-là… » de « Équipe au pic » est partie (le chiffre
    //   et la pastille la disent) ; elle ne revient pas avec « ≈ ».
    !/\\u2248|≈/.test(P) && P.includes("(nH?'environ\\u00a0'+_dzMin(moy):'\\u2014')") && !/Il manque \\u2248|Il manque ≈/.test(P));

  // ⑥ l'aide, le guide, l'annonce, les versions, la maquette, la liste
  T('⑥ l’aide : « Choisir la campagne » (la pastille), « Chaque écran dit ce qu’il compte », la fiche « i » de Le détail',
    S.uti.includes("['Choisir la campagne', \" : la pastille en haut du Pilotage") && S.uti.includes("['Chaque écran dit ce qu’il compte',")
    && S.uti.includes("'pil.cadres': { t: 'Ce que compte Le détail : l’exercice ou l’année vigne'") && !S.uti.includes('Choisir ce que vous regardez'));
  T('⑥ le guide : la pastille, deux chiffres en tête de Travaux, « Vous regardez » sur Le détail seulement', S.guide.includes('<li><b>La campagne se choisit à la pastille du haut</b>')
    && S.guide.includes('<li><b>Deux chiffres en tête de « Travaux »</b>') && !S.guide.includes('La barre « Vous regardez » dit ce que montre tout le Pilotage'));
  const iW = S.wn.indexOf("{ v: '11.19'");
  T('⑥ l’annonce 11.19, pour l’administrateur seulement', iW > 0 && iW < S.wn.indexOf("{ v: '11.18'") && S.wn.slice(iW, S.wn.indexOf("{ v: '11.18'")).includes("pour: ['admin']")
    && S.wn.includes("titre: 'Pilotage\\u00a0: la campagne se choisit à la pastille du haut'"));
  // MOTS-9 (§592) : les lots suivants montent les versions — 11.19 au moins, partout la même ; le changelog du SW garde la ligne du lot.
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑥ les versions : APP 11.19 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.19 && S.idx.includes('Ma Vigne v' + appV)
    && /const CACHE_NAME   = 'mavigne-v12\.\d+';/.test(S.sw) && S.sw.includes('// v12.10 (18/11/2026) — PORTEE-1 (§591)'));
  T('⑥ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('Vous regardez') && S.maq.includes('Choisir une campagne') && S.lm.includes('maquette-vous-regardez-v1.html'));
  T('⑥ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-portee1.mjs']") && S.liste.includes("['node scripts/mv-harnais-portee1.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nPORTEE-1 (§591) — la campagne se choisit à la pastille ; « Vous regardez » sur Économie › Le détail seulement\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['la pastille redevient une étiquette', sur('pil', `'<button type="button" class="hv2-saison-pill pil-saison-btn'`, `'<span class="hv2-saison-pill pil-saison-btn'`)],
    ['la pastille ouvre le menu sans ancre (sous la pastille de la Vigne)', sur('pil', "window._seasonMenuToggle(e,_ps); return; }", "window._seasonMenuToggle(e); return; }")],
    ['le menu ne sait plus s’ancrer', sur('app', "var pl=ancre||document.getElementById('hv2-saison-pill');", "var pl=document.getElementById('hv2-saison-pill');")],
    ['le menu reparle de « saison »', sur('idx', 'La campagne active s’ouvre par défaut.', 'La saison active est la vue par défaut.')],
    ['« Vous regardez » revient sur Aujourd’hui', sur('pil', "if(tab==='eco' && _PEC_SUB==='exe') return _pilCrumbAnnee();", "if(tab==='auj' || (tab==='eco' && _PEC_SUB==='exe')) return _pilCrumbAnnee();")],
    ['Décider perd la ligne de la campagne', sur('pil', "if(tab==='avc' || tab==='equ' || tab==='sim') return _pilCrumbCampagne();", "if(tab==='avc' || tab==='equ') return _pilCrumbCampagne();")],
    ['la ligne perd le jour où l’on est', sur('pil', "+'<span class=\"pil-ptbornes\">'+_pilPorteeBornes(sa.debut,sa.fin,1)+'</span>'", "+'<span class=\"pil-ptbornes\">'+_pilEsc(sa.debut)+'</span>'")],
    ['la campagne consultée ne se dit plus', sur('pil', "(cons?'La campagne consult\\u00e9e':'La campagne')", "'La campagne'")],
    ['« La campagne » revient dans « Vous regardez »', sur('pil', "B('exo','L\\u2019exercice')+B('vig','L\\u2019ann\\u00e9e vigne')", "B('camp','La campagne')+B('exo','L\\u2019exercice')+B('vig','L\\u2019ann\\u00e9e vigne')")],
    ['« La campagne » se pose de nouveau', sur('pil', "function _pilPorteeChoisir(m){ _pilCadreSet(m==='vig'?'vig':'exo'); }", "function _pilPorteeChoisir(m){ if(m==='camp'){ _PIL_SCOPE.camp='Vendanges'; return; } _pilCadreSet(m==='vig'?'vig':'exo'); }")],
    ['une campagne mémorisée revient au chargement', sur('pil', "  _PIL_SCOPE.camp=null;\n  try{ if(localStorage.getItem(_pilScopeKey())) localStorage.removeItem(_pilScopeKey()); }", "  try{ _PIL_SCOPE.camp=localStorage.getItem(_pilScopeKey())||null; }")],
    ['le cadre de l’année est oublié aussi', sur('pil', "if(c==='vig'||c==='exo') _PIL_SCOPE.cadre=c;", "if(false) _PIL_SCOPE.cadre=c;")],
    ['le pic lit l’année au lieu de la campagne', sur('pil', "PP=_pilPicPortee(_pilSaisonNom());", "PP=_pilPicPortee();")],
    ['le budget redevient le sorti de l’année', sur('pil', "var bud=E?(Number(E.budget)||0):0, dep=E?(Number(E.engage)||0):0;", "var bud=E?(Number(E.budget)||0):0, dep=E?(Number(E.sorti)||0):0;")],
    ['le budget perd sa barre', sur('pil', "_pilPhBar(dep/bud*100),'engag\\u00e9", "'','engag\\u00e9")],
    ['un renfort à prévoir ne se dit plus', sur('pil', "man>0.05?('+'+_pilUn(man)+' \\u00e0 pr\\u00e9voir')", "man>0.05?('l\\u2019\\u00e9quipe suffit')")],
    ['la tuile « Travaux » revient', sur('pil', "return '<div class=\"pil-photos pil-tv-tu pil-tv-tu2\">'+pEff+pBud+'</div>';", "return '<div class=\"pil-photos pil-tv-tu pil-tv-tu2\">'+_pilPhotoHtml('Travaux','1 869',' h','','pr\\u00e9vu','avc','','travaux','')+pEff+pBud+'</div>';")],
    ['la feuille remet trois colonnes', sur('pcss', '#page-pilotage .pil-photos.pil-tv-tu.pil-tv-tu2{grid-template-columns:repeat(2,minmax(0,1fr))}', '#page-pilotage .pil-photos.pil-tv-tu.pil-tv-tu2{grid-template-columns:repeat(3,minmax(0,1fr))}')],
    ['une campagne finie se projette encore (Travaux)', sur('pil', "if(_sa && _sa.fin && String(_sa.fin).slice(0,10)<_pilAnAuj()) return", "if(false) return")],
    ['la tête du cockpit prend l’objectif pour la fin', sur('pil', "r.fin=d1; r.finie=(!isNaN(b) && !isNaN(o) && o>b);", "r.fin=d1; r.finie=false;")],
    ['« terminé » au masculin pour la campagne', sur('pil', "r.bornesHtml=_pilPorteeBornes(d0,d1,1);", "r.bornesHtml=_pilPorteeBornes(d0,d1);")],
    ['Aujourd’hui reprojette une campagne finie', sur('ck', "const PF = (V.per && V.per.finie && V.per.fin) ? deIso(V.per.fin) : null;\n  if (PF) {", "const PF = null;\n  if (PF) {")],
    ['la carte de fin dit encore « En retard »', sur('ck', "e1.className = 'ck-etat fini'; e1.textContent = 'Terminée';", "e1.className = 'ck-etat ko'; e1.textContent = 'En retard';")],
    ['la frise reste sur une campagne finie', sur('pcss', '#ck-verdict.ck-v-finie .ck-frise,#ck-verdict.ck-v-finie .ck-v-act{display:none}', '#ck-verdict.ck-v-finie .ck-v-act{display:none}')],
    ['la pastille consultée redevient grise', sur('pcss', 'body .mod-header .hv2-saison-pill.pil-saison-btn.consult{background:var(--or-pale)!important;color:var(--attention)!important', 'body .mod-header .hv2-saison-pill.pil-saison-btn.consult{background:var(--survol)!important;color:var(--texte)!important')],
    ['au téléphone, le chevron recoupe le nom', sur('pcss', '#page-pilotage .pil-saison-btn .hv2-sc-chev svg{width:12px;height:12px}', '#page-pilotage .pil-saison-btn .hv2-sc-chev svg{width:16px;height:16px}')],
    ['les puces de zoom reviennent', (S) => ({ ...S, pil: S.pil + "\nfunction _pilAnFriseCadre(C, ann){ return '<button data-etpc=\"x\"></button>'; }" })],
    ['l’alias _PIL_ETPSEL revient', (S) => ({ ...S, pil: S.pil + "\nObject.defineProperty(window,'_PIL_ETPSEL',{ get:function(){ return _PIL_SCOPE.camp; } });" })],
    ['« ≈ » revient dans le Pilotage', sur('pil', "(nH?'environ\\u00a0'+_dzMin(moy):'\\u2014')", "(nH?'\\u2248\\u00a0'+_dzMin(moy):'\\u2014')")],
    ['l’aide dit encore « Vous regardez » partout', sur('uti', "['Choisir la campagne', \" : la pastille en haut du Pilotage", "['Choisir ce que vous regardez', \" : la barre")],
    ['la fiche « i » reparle de la campagne', sur('uti', "'pil.cadres': { t: 'Ce que compte Le détail : l’exercice ou l’année vigne'", "'pil.cadres': { t: 'Ce que vous regardez : la campagne, l’année vigne ou l’exercice'")],
    ['le guide garde l’ancienne barre', sur('guide', '<li><b>La campagne se choisit à la pastille du haut</b>', '<li><b>La barre « Vous regardez » dit ce que montre tout le Pilotage</b>')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("{ v: '11.19'"); const j = S.wn.indexOf("pour: ['admin']", i); if (i < 0 || j < 0) throw new Error('motif absent : annonce'); return { ...S, wn: S.wn.slice(0, j) + "pour: ['admin','ouvrier']" + S.wn.slice(j + "pour: ['admin']".length) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.10 (18/11/2026) — PORTEE-1 (§591)', '// v12.10 (18/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-vous-regardez-v1.html', 'maquette-vous-regardez-vX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-portee1.mjs']", "['node scripts/mv-harnais-portee1Z.mjs']")],
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
