/* ───────────────────────────────────────────────────────
   HARNAIS — COHER-1 (§581) : TROIS DÉSACCORDS ENTRE ÉCRANS DU PILOTAGE, FERMÉS
   Lancer :          node scripts/mv-harnais-coher1.mjs
   Contre-épreuves : node scripts/mv-harnais-coher1.mjs --contre

   CE QU’IL GARDE
   ① La tuile « Conformité » d’Aujourd’hui compte ce que l’onglet Conformité écrit sur ses tuiles. Elle comptait les
     lignes de _pilDiag() marquées 'cfm' : aucune ne l’est, elle ne pouvait dire que « 0 point à régler ». La liste
     (_pilCfmPoints) est JOUÉE ici, le vrai code sur des données posées : le cuivre dépassé, le registre pas prêt,
     l’IFT sans catalogue — et ce qui n’en est pas (la vigilance, une tuile éteinte, un registre vide).
   ② Le graphique « Rythme de dépense » rejoint le « coût à la fin » d’Aujourd’hui (E.projFin) à la fin prévue des
     travaux. Il prolongeait le rythme des derniers jours jusqu’à la fin de la période : 81,0 k€ et « budget épuisé le
     18 nov. » sous un verdict « Le budget tient ». _pecTimeline est JOUÉE sur le cas de la démo et sur ses bords.
   ③ Dans Archives, « campagne » n’a plus qu’un sens : une ligne est une année vigne, ses barres sont des campagnes.
     _arcLigne est JOUÉE.
   ④ Les fiches, le guide, l’annonce et les versions suivent.
   ⚠️ Il ne regarde pas l’écran : la preuve au navigateur est dans le §581 (les trois écrans relus sur le build).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), vue: lire('src/cockpit-vue.js'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const ligne = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n', i) + 1); };
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const ms = (iso) => Date.parse(iso + 'T00:00:00');

/* ① la liste de la Conformité, le vrai code */
function points(S, o = {}) {
  const i = S.pil.indexOf('function _cfmRegPoint(V){'), j = S.pil.indexOf('function _cfmIftRef(){');
  if (i < 0 || j < i) throw new Error('bloc des points introuvable');
  const ctx = { String, Number, Object, Array, Math };
  ctx.window = ctx;
  ctx.__montre = o.montre || (() => true);
  ctx.__cu = o.cu || { avail: true, over: 0, warn: 0, rows: [] };
  ctx.__R = o.R || { lignes: 0, ok: true };
  if (o.V !== undefined) ctx._regCarte = () => ({ an: 2026, V: o.V });
  vm.createContext(ctx);
  vm.runInContext('function _pilShow(k){ return __montre(k); }\nfunction _cfmCuivre(){ return __cu; }\nfunction _iftAnnee(){ return 2026; }\nfunction _iftCalc(){ return __R; }\n'
    + S.pil.slice(i, j) + '\nthis.__P = _pilCfmPoints();', ctx);
  return ctx.__P;
}
/* ② la projection, le vrai code, l’horloge posée */
function projection(S, o) {
  const FIX = Date.parse(o.auj + 'T09:00:00');
  class D extends Date { constructor(...a) { if (a.length) super(...a); else super(FIX); } static now() { return FIX; } }
  const ctx = { Math, Number, String, Object, Array, isFinite, isNaN, parseInt, Date: D };
  ctx.window = ctx;
  ctx._pilSaison = () => ({ nom: 'Après-vendange', debut: o.debut || '2026-10-24', fin: o.fin || '2027-02-28' });
  ctx.JOURNAL = [];
  vm.createContext(ctx);
  vm.runInContext(ligne(S.pil, 'function _pecIsoToMs(iso){') + ligne(S.pil, 'function _pecMsToIso(ms){')
    + 'function _pilObjectifGet(){ return null; }\nfunction _friseNorm(x){ return x; }\n' + fnDe(S.pil, 'function _pecTimeline(E, finIso){') + '\nthis.__f = _pecTimeline;', ctx);
  return ctx.__f({ moSrc: 'planning', tv: { byD: o.byD }, tot: { byDateTrac: {}, byDatePhy: {}, byDatePresta: {} }, pairs: [], budget: o.budget, projFin: o.projFin }, o.finIso === undefined ? null : o.finIso);
}
/* ③ une ligne d’Archives, le vrai code */
function ligneArchives(S) {
  const ctx = { Math, Number, String, Object, Array, Date };
  ctx.window = ctx; ctx._mvToday = () => '2026-10-27';
  vm.createContext(ctx);
  vm.runInContext(ligne(S.pil, 'function _arcN(s){') + ligne(S.pil, 'function _arcISO(n){')
    + 'function _arcBornes(an){ return { an:an, d0:an+"-08-01", d1:(an+1)+"-07-31", court:an+"–"+(an+1) }; }\nfunction _arcHeures(){ return 0; }\nfunction _pilHa(x){ return String(x); }\nfunction _pilEsc(x){ return String(x); }\n'
    + fnDe(S.pil, 'function _arcLigne(an,list,cur){')
    + '\nthis.__h = [_arcLigne(2026,[{nom:"Après-vendange 2026-2027",debut:"2026-10-24",fin:"2027-02-28"},{nom:"Printemps 2027",debut:"2027-03-01",fin:"2027-06-30"}],true), _arcLigne(2025,[{nom:"Printemps 2026",debut:"2026-03-01",fin:"2026-06-30"}],false)];', ctx);
  return ctx.__h;
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d]);
  const essai = (n, f) => { try { f(); } catch (e) { T(n + ' — plantage', false, String(e && e.message || e)); } };
  const DEMO = { auj: '2026-10-27', byD: { '2026-10-24': 640, '2026-10-25': 650, '2026-10-26': 650 }, budget: 15784, projFin: 15317, finIso: '2026-11-25' };

  /* ── ① LA CONFORMITÉ ── */
  essai('① la liste de la Conformité', () => {
    const SIRET = { nLignes: 10, siretOk: false, nManque: 3, sansDate: 1 };
    T('① rien à signaler : aucun point', points(S, { V: { nLignes: 10, siretOk: true, nManque: 0, sansDate: 0 } }).length === 0);
    let P = points(S, { V: SIRET });
    T('① le SIRET manquant est un point, et il passe avant les lignes à compléter', P.length === 1 && P[0].id === 'phyto' && P[0].court === 'SIRET manquant' && P[0].t === 'Registre : SIRET manquant', JSON.stringify(P));
    P = points(S, { V: { nLignes: 10, siretOk: true, nManque: 3, sansDate: 1 } });
    T('① des lignes à compléter sont un point', P.length === 1 && P[0].court === '3 à compléter', JSON.stringify(P));
    P = points(S, { V: { nLignes: 10, siretOk: true, nManque: 0, sansDate: 2 } });
    T('① des traitements sans date sont un point (le registre n’est pas prêt : _regVerdict)', P.length === 1 && P[0].court === '2 sans date', JSON.stringify(P));
    T('① un registre sans ligne n’est pas un point, même sans SIRET', points(S, { V: { nLignes: 0, siretOk: false, nManque: 0 } }).length === 0);
    P = points(S, { cu: { avail: true, over: 2, warn: 1, rows: [] } });
    T('① un plafond de cuivre dépassé est un point', P.length === 1 && P[0].id === 'cuivre' && P[0].t === 'Cuivre : plafond dépassé (2 parcelles)', JSON.stringify(P));
    T('① la vigilance cuivre (sous le plafond) n’en est pas un', points(S, { cu: { avail: true, over: 0, warn: 3, rows: [] } }).length === 0);
    P = points(S, { R: { lignes: 3, ok: false } });
    T('① un IFT sans catalogue est un point — avec des traitements seulement', P.length === 1 && P[0].id === 'ift' && P[0].court === 'catalogue E-Phy absent' && points(S, { R: { lignes: 0, ok: false } }).length === 0, JSON.stringify(P));
    P = points(S, { V: SIRET, cu: { avail: true, over: 1, warn: 0, rows: [] }, R: { lignes: 3, ok: false } });
    T('① trois points, dans l’ordre : le cuivre, le registre, l’IFT', P.map((p) => p.id).join() === 'cuivre,phyto,ift' && P[0].t === 'Cuivre : plafond dépassé (1 parcelle)', P.map((p) => p.id).join());
    T('① une tuile éteinte dans « Choisir les indicateurs » ne compte pas', points(S, { V: SIRET, cu: { avail: true, over: 1 }, R: { lignes: 3, ok: false }, montre: (k) => k !== 'mat_phyto' && k !== 'cfm_cuivre' }).map((p) => p.id).join() === 'ift');
    T('① sans registre.js, la liste ne plante pas', points(S, { R: { lignes: 3, ok: false } }).length === 1);
  });
  const mod = sansCom(fnDe(S.pil, 'function _pilCk2Modele(d, m){'));
  T('① le modèle d’Aujourd’hui lit la liste de l’onglet, plus les diagnostics marqués « cfm »', /diag=_pilCfmPoints\(\);/.test(mod) && !/indexOf\('cfm'\)/.test(mod));
  T('① … sous garde : une erreur de la liste ne casse pas Aujourd’hui', /try\{ diag=_pilCfmPoints\(\); \}catch\(e\)\{ diag=\[\];/.test(mod));
  T('① … il nomme le premier point et compte les autres', /confN:diag\.length, confTxt:diag\.length\?\(tx\(diag\[0\]\.t\|\|'Un point à régler'\)\+\(diag\.length>1\?\(' · \+'\+\(diag\.length-1\)\):''\)\):'Rien à régler'/.test(mod));
  T('① la tuile du registre écrit la mention que la liste compte', /var V=G\.V, _av=_cfmRegPoint\(V\);/.test(S.pil) && !/_av=!V\.nLignes\?null/.test(S.pil));
  T('① la tuile de l’IFT écrit la mention que la liste compte', /' en '\+an\+' · '\+_cfmIftPoint\(R\), null,/.test(S.pil) && !/' · catalogue E-Phy absent', null,/.test(S.pil));
  T('① la tuile du cuivre et la liste lisent le même compte (cu.over)', /var sw=cu\.over\?/.test(S.pil) && /if\(cu&&cu\.avail&&cu\.over\) P\.push/.test(S.pil));
  T('① la fiche « i » de la tuile dit ce qu’elle compte', /conformite: 'Ce que l’onglet Conformité signale avant un contrôle/.test(S.vue) && !/documents obligatoires qui demandent une action/.test(S.vue));

  /* ── ② LE COÛT À LA FIN ── */
  essai('② la projection', () => {
    let L = projection(S, DEMO);
    T('② la démo : la projection rejoint le coût à la fin d’Aujourd’hui (15 317 €), plus 81 k€', L.ok && L.cum === 1940 && L.finV === 15317 && L.finV < L.budget && !('projEndV' in L), 'cum=' + L.cum + ' finV=' + L.finV);
    T('② … à la fin prévue des travaux (25 nov.), pas à la fin de la période', L.finMs === ms('2026-11-25') && L.finPrevue === true && L.tEnd === ms('2027-02-28'), String(L.finMs));
    T('② … le budget tient : pas de « budget épuisé le »', L.projMs === null);
    T('② … elle part d’aujourd’hui, et le rythme reste une mesure', L.projT0 === ms('2026-10-27') && L.pace > 600 && L.pace <= 650 && L.nDays >= 2 && L.nDays < 2.1   /* le 25/10/2026 dure 25 h à Paris : 2,04 jours */, 'projT0=' + L.projT0 + ' pace=' + L.pace);
    L = projection(S, { ...DEMO, projFin: 20000 });
    const att = ms('2026-10-27') + (15784 - 1940) / (20000 - 1940) * (ms('2026-11-25') - ms('2026-10-27'));
    T('② le coût à la fin dépasse le budget : « épuisé » le jour où la projection le croise, avant la fin des travaux', L.projMs !== null && Math.abs(L.projMs - att) < 1 && L.projMs > L.projT0 && L.projMs < L.finMs, String(L.projMs));
    L = projection(S, { ...DEMO, finIso: null });
    T('② sans fin prévue : la fin de la période, et l’écran ne dit pas « fin prévue »', L.finMs === ms('2027-02-28') && L.finPrevue === false && L.finV === 15317);
    L = projection(S, { ...DEMO, finIso: '2026-10-20' });
    T('② une fin prévue déjà passée : la fin de la période', L.finMs === ms('2027-02-28') && L.finPrevue === false);
    L = projection(S, { ...DEMO, finIso: '2027-03-15' });
    T('② une fin prévue après la période est gardée (le retard se voit)', L.finMs === ms('2027-03-15') && L.finPrevue === true && L.finMs > L.tEnd);
    L = projection(S, { ...DEMO, projFin: undefined });
    T('② sans coût à la fin : pas de projection, pas de date', L.finV === null && L.projMs === null);
    L = projection(S, { ...DEMO, projFin: 1000 });
    T('② un coût à la fin sous l’engagé ne redescend pas la courbe', L.finV === 1940);
    L = projection(S, { ...DEMO, auj: '2026-11-10', byD: { '2026-10-24': 1940 } });
    T('② rien de saisi depuis deux semaines : la projection part d’aujourd’hui, pas de la dernière saisie', L.projT0 === ms('2026-11-10') && L.tLast === ms('2026-10-24'));
    L = projection(S, { ...DEMO, auj: '2027-03-10', finIso: null });
    T('② la période finie, sans fin prévue : plus de projection', L.finMs === null && L.finV === null);
  });
  const eco = sansCom(fnDe(S.pil, 'function _pilTabEco(d){'));
  T('② Économie passe à la projection la fin prévue d’Aujourd’hui (_pilMargeCalc(d).proj)', /var _mg=_pilMargeCalc\(d\); if\(_mg && _mg\.proj instanceof Date\) _finIso=_pilPhotoIso\(_mg\.proj\);/.test(eco) && /var TL=_pecTimeline\(E, _finIso\);/.test(eco));
  T('② Aujourd’hui lit le même coût à la fin (E.projFin) et la même fin (m.proj)', /var att=num\(E\.projFin\);/.test(fnDe(S.pil, 'function _pilCk2Eco(d, V){')) && /fin:isoD\(m&&m\.proj\)/.test(mod));
  T('② plus aucune lecture de l’ancienne projection au rythme', !/projEndV/.test(sansCom(S.pil)) && !/fin de p\\u00e9riode projet\\u00e9e/.test(S.pil));
  const svg = sansCom(fnDe(S.pil, 'function _pecBurnSvg(E,TL,w){'));
  T('② le graphique trace jusqu’au coût à la fin, à la fin prévue, en partant d’aujourd’hui', /L'\+X\(TL\.projT0\)\.toFixed\(1\)\+' '\+Y\(lastP\.v\)\.toFixed\(1\)\+' L'\+X\(TL\.finMs\)\.toFixed\(1\)\+' '\+Y\(TL\.finV\)\.toFixed\(1\)/.test(svg)
    && /var tMax=Math\.max\(TL\.tEnd, TL\.tToday\|\|0, TL\.finMs\|\|0, TL\.tLast\|\|0\);/.test(svg) && /Math\.max\(TL\.budget, TL\.cum, TL\.finV\|\|0, pFin\)/.test(svg));
  // MOTS-1 (§582) : la ligne sous « Rythme de dépense » est devenue le TITRE de la tuile « Coût à la fin » (_pecTuileFin) — le même chiffre, la même date.
  const fin = sansCom(fnDe(S.pil, 'function _pecTuileFin(E,TL){'));
  T('② le titre de la tuile écrit le coût à la fin à l’euro, la fin prévue au jour, comme Aujourd’hui', /_pilStat\(_pilEsc\(_ecoEur\(TL\.finV\)\), TL\.finPrevue\?\(' \\u00b7 '\+_pilEsc\(_pecJourCourt\(TL\.finMs\)\)\):''/.test(fin) && /_pilTile\('ecofin','#8A5A38','Coût à la fin'/.test(fin));
  T('② « budget épuisé le » ne s’écrit que si la projection a une date, et plus sous un verdict', /TL\.projMs\?\('budget épuisé le '\+_pilEsc\(_pecJourCourt\(TL\.projMs\)\)\):null\)/.test(fin)
    && !/Le budget serait \\u00e9puis\\u00e9 le|Le budget serait épuisé le|Au rythme actuel, le budget serait/.test(sansCom(S.pil)));
  T('② la légende ne dit plus « au rythme constaté »', />Projection<\/span>'/.test(S.pil) && !/Projection au rythme constat/.test(S.pil));
  T('② une date courte s’écrit « 25 nov. »', /function _pecJourCourt\(ms\)\{ var d=new Date\(ms\); return d\.getDate\(\)\+' '\+_pecMoisCourt\(d\.getMonth\(\)\); \}/.test(S.pil));

  /* ── ③ ARCHIVES ── */
  essai('③ une ligne d’Archives', () => {
    const [h1, h2] = ligneArchives(S);
    T('③ une ligne porte ses années, « en cours » sur la bonne, et compte des campagnes', /<span class="y">2026–2027 <em>en cours<\/em><\/span><span class="m">2 campagnes · pas d’instantané<\/span>/.test(h1) && /<span class="y">2025–2026<\/span><span class="m">1 campagne · /.test(h2), h1.slice(0, 160));
    T('③ … plus de « période », plus de « Campagne 2026–2027 »', !/p[ée]riode/i.test(h1 + h2) && !/Campagne \d/.test(h1 + h2));
  });
  const arc = sansCom(fnDe(S.pil, 'function _pilTabArc(d){'));
  T('③ la phrase du haut parle d’années vigne', /Toutes les années vigne sur le même axe/.test(arc));
  T('③ le compteur : des années vigne et des campagnes, accordées', /<div class="l">année'\+\(keys\.length>1\?'s':''\)\+' vigne<\/div>/.test(arc) && /<div class="l">campagne'\+\(S\.length>1\?'s':''\)\+'<\/div>/.test(arc));
  T('③ l’écran vide parle de campagnes', /Aucune campagne datée\. Elles apparaissent ici /.test(arc));
  T('③ plus un « période » écrit à l’écran dans Archives', !/p[ée]riode/i.test(arc) && !/p\\u00e9riode/.test(arc));

  /* ── ④ CE QUI SUIT ── */
  T('④ l’aide d’Archives dit « années vigne »', /\['Archives', "empile les années vigne sur un même axe/.test(S.uti));
  T('④ la fiche de l’engagé dit où va la projection', /Dans la tuile <b>Coût à la fin<\/b>, le pointillé part d\\u2019aujourd\\u2019hui et rejoint le <b>coût à la fin<\/b>/.test(S.uti));
  T('④ le guide : la projection, la tuile Conformité, les années vigne', /rejoint ce coût à la <b>fin prévue<\/b> des travaux/.test(S.guide) && /La tuile Conformité compte ce que l'onglet Conformité signale/.test(S.guide)
    && /Toutes les <b>années vigne<\/b> sur un <b>même axe<\/b>/.test(S.guide) && /une campagne jamais clôturée apparaît sur la frise/.test(S.guide));
  const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1];
  const bloc = S.wn.slice(S.wn.indexOf("{ v: '11.09'"), S.wn.indexOf("{ v: '11.08'"));
  T('④ l’annonce de la 11.09 dit les trois, pour l’admin', /^  \{ v: '11\.09', d: '2026-11-16'/m.test(S.wn) && /tuile Conformité compte ce que l’onglet signale/.test(bloc) && /coût à la fin/.test(bloc) && /une ligne par année vigne/.test(bloc)
    && (bloc.match(/pour: \['admin'\]/g) || []).length === 3);
  T('④ les versions : l’appli à 11.09 au moins, cinq affichages ; le SW dit COHER-1', !!app && Number(app) >= 11.09 && S.idx.split('v' + app).length - 1 === 4 && S.idx.includes('boot.js?v=' + app)
    && /^\/\/ v12\.00 \(16\/11\/2026\) — COHER-1 \(§581\)/m.test(S.sw), 'APP ' + app);
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  for (const [n, c, d] of r) { if (c) console.log('  \x1b[32m✓\x1b[0m ' + n); else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n + (d ? '\n      → ' + d : '')); } }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + r.length + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 50)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['le modèle relit les diagnostics marqués « cfm »', sur('pil', 'try{ diag=_pilCfmPoints(); }catch(e){ diag=[];', "try{ diag=_pilDiag().filter(function(x){ return x&&x.touche&&x.touche.indexOf('cfm')>=0; }); }catch(e){ diag=[];")],
    ['la liste n’est plus sous garde', sur('pil', 'try{ diag=_pilCfmPoints(); }catch(e){ diag=[]; if(window._mvAvale)', 'diag=_pilCfmPoints(); if(false){ if(window._mvAvale)')],
    ['le SIRET manquant n’est plus compté', sur('pil', "  if(!V.siretOk) return 'SIRET manquant';\n", '')],
    ['les traitements sans date ne sont plus comptés', sur('pil', "  if(V.sansDate) return V.sansDate+' sans date';\n", '')],
    ['un registre vide compte', sur('pil', '  if(!V||!V.nLignes) return null;\n  if(!V.siretOk)', '  if(!V) return null;\n  if(!V.siretOk)')],
    ['la vigilance cuivre compte', sur('pil', 'if(cu&&cu.avail&&cu.over) P.push', 'if(cu&&cu.avail&&(cu.over||cu.warn)) P.push')],
    ['le cuivre dépassé ne compte plus', sur('pil', 'if(cu&&cu.avail&&cu.over) P.push', 'if(false) P.push')],
    ['l’IFT compte sans traitement', sur('pil', "return (R&&R.lignes&&!R.ok)?'catalogue E-Phy absent':null;", "return (R&&!R.ok)?'catalogue E-Phy absent':null;")],
    ['une tuile éteinte compte', sur('pil', "if(_pilShow('mat_phyto') && typeof window._regCarte==='function'){\n    var G=window._regCarte(); pt=", "if(typeof window._regCarte==='function'){\n    var G=window._regCarte(); pt=")],
    ['la tuile du registre reprend sa propre mention', sur('pil', 'var V=G.V, _av=_cfmRegPoint(V);', "var V=G.V, _av=!V.nLignes?null:(!V.siretOk?'SIRET manquant':null);")],
    ['la tuile de l’IFT reprend sa propre mention', sur('pil', "' · '+_cfmIftPoint(R), null,", "' · catalogue E-Phy absent', null,")],
    ['le texte de la tuile ne compte plus les autres points', sur('pil', "+(diag.length>1?(' · +'+(diag.length-1)):'')", '')],
    ['la fiche de la tuile garde l’ancien texte', sur('vue', "conformite: 'Ce que l’onglet Conformité signale avant un contrôle", "conformite: 'Points du registre phyto et des documents obligatoires qui demandent une action de votre part. Ce que l’onglet")],
    ['la projection prolonge de nouveau le rythme', sur('pil', 'var finV=(isFinite(E.projFin) && E.projFin>0) ? Math.max(cum, E.projFin) : null;', 'var finV=cum+pace*Math.max(0,(tEnd-winEnd)/86400000);')],
    ['« budget épuisé » revient quand le budget tient', sur('pil', 'if(finV!==null && budget>cum && finV>budget) projMs', 'if(finV!==null && budget>cum) projMs')],
    ['la fin prévue n’est plus lue', sur('pil', 'var finMs=finIso ? _pecIsoToMs(finIso) : null, finPrevue=', 'var finMs=null, finPrevue=')],
    ['une fin prévue passée est gardée', sur('pil', 'finPrevue=(finMs!==null && finMs>projT0);', 'finPrevue=(finMs!==null);')],
    ['la projection repart de la dernière saisie', sur('pil', 'var projT0=(tToday!==null) ? Math.max(lastMs, tToday) : lastMs;', 'var projT0=lastMs;')],
    ['un coût à la fin sous l’engagé redescend la courbe', sur('pil', 'Math.max(cum, E.projFin) : null;', 'E.projFin : null;')],
    ['Économie ne passe plus la fin prévue', sur('pil', 'var TL=_pecTimeline(E, _finIso);', 'var TL=_pecTimeline(E);')],
    ['Aujourd’hui lit un autre coût à la fin', sur('pil', 'var att=num(E.projFin);', 'var att=num(E.budget);')],
    ['le graphique trace jusqu’à la fin de la période', sur('pil', "' L'+X(TL.finMs).toFixed(1)+' '+Y(TL.finV).toFixed(1)", "' L'+X(TL.tEnd).toFixed(1)+' '+Y(TL.finV).toFixed(1)")],
    ['le titre de la tuile perd le coût à la fin', sur('pil', "? _pilStat(_pilEsc(_ecoEur(TL.finV)), TL.finPrevue?", "? _pilStat(_pilEsc(_pecEurK(TL.pace)), TL.finPrevue?")],
    ['« budget épuisé le » s’écrit sans date de projection', sur('pil', "TL.projMs?('budget épuisé le '+_pilEsc(_pecJourCourt(TL.projMs))):null)", "('budget épuisé le '+_pilEsc(_pecJourCourt(TL.projMs))))")],
    ['la légende redit « au rythme constaté »', sur('pil', '>Projection</span>', '>Projection au rythme constat\\u00e9</span>')],
    ['une ligne d’Archives recompte des périodes', sur('pil', "var meta=list.length+' campagne'+(list.length>1?'s':'');", "var meta=list.length+' période'+(list.length>1?'s':'');")],
    ['une ligne d’Archives s’appelle de nouveau « Campagne »', sur('pil', "<span class=\"y\">'+_pilEsc(_b.court", "<span class=\"y\">Campagne '+_pilEsc(_b.court")],
    ['le compteur d’Archives reparle de périodes', sur('pil', "<div class=\"l\">campagne'+(S.length>1?'s':'')+'</div>", '<div class="l">périodes</div>')],
    ['la phrase du haut d’Archives reparle de campagnes', sur('pil', 'Toutes les années vigne sur le même axe', 'Toutes les campagnes sur le même axe')],
    ['l’aide d’Archives garde « campagnes »', sur('uti', '"empile les années vigne sur un même axe', '"empile les campagnes sur un même axe')],
    ['la fiche de l’engagé ne dit pas la projection', sur('uti', 'Dans la tuile <b>Coût à la fin</b>, le pointillé', 'Dans la tuile, le pointillé')],
    ['le guide ne dit pas la tuile Conformité', sur('guide', "La tuile Conformité compte ce que l'onglet Conformité signale", 'La tuile Conformité')],
    ['l’annonce manque', sur('wn', "{ v: '11.09', d: '2026-11-16'", "{ v: '11.085', d: '2026-11-16'")],
    ['un affichage de version oublié', (S) => { const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1]; if (S.idx.indexOf('boot.js?v=' + app) < 0) throw new Error('motif absent'); return { ...S, idx: S.idx.replace('boot.js?v=' + app, 'boot.js?v=11.08') }; }],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible : ' + nom + ' (' + e.message + ')'); continue; }
    let rouges = 0; try { rouges = suite(S).filter((x) => !x[1]).length; } catch (e) { rouges = 1; }
    if (rouges > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + rouges + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
