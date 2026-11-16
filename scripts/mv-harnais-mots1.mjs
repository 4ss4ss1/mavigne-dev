/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-1 (§582) : ÉCONOMIE › SYNTHÈSE SE LIT D’UN COUP D’ŒIL
   Lancer :          node scripts/mv-harnais-mots1.mjs
   Contre-épreuves : node scripts/mv-harnais-mots1.mjs --contre

   CE QU’IL GARDE
   ① Le verdict tient en UNE phrase : un titre, son repère. _pecVerdictM est JOUÉE, le vrai code, sur ses huit états
     (les sept d’avant, plus « Le budget serait dépassé ») : les pour-cent entiers, les mots du lexique (§580c), les boutons.
   ② La ligne de la campagne ouvre la phrase (son nom, ses dates) ; rien ne manque au chiffrage = une coche ; un poste
     compté pour zéro = une bande, sous la phrase, avec son bouton. _pecVerdict et _pecBandeZeros sont JOUÉES.
   ③ Quatre chiffres aux étiquettes du lexique, puis trois tuiles REPLIÉES leur chiffre sur le titre : « Coût à la fin »
     (_pecTuileFin, JOUÉE : le chiffre et la date d’Aujourd’hui, la méthode posée derrière le « i »), l’exercice,
     « Prix de revient ». Plus d’avis de périmètre, plus de bande d’exercice, plus de mode d’emploi à demeure.
   ④ Ce qui a quitté l’écran est dans une fiche ; le guide, l’aide, l’annonce et les versions suivent.
   ⚠️ Il ne compte pas les mots à l’écran : c’est `npm run test:mots` (la référence de Synthèse baisse dans ce lot).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'), ref: lire('scripts/mv-mots-baseline.json') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const ligne = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n', i) + 1); };
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const eur = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + '\u00a0€';

const BOUCHONS = `
function _pilEsc(x){ return String(x); }
function _ecoEur(v){ return String(Math.round(v)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u202f')+'\\u00a0€'; }
function _pecEurK(v){ return (Math.round(v/100)/10).toString().replace('.',',')+' k€'; }
function _ecoH1(v){ return (Math.round(v*10)/10).toString().replace('.',','); }
function _pilSaisonNom(){ return 'Après-vendange 2026-2027'; }
function _mvIcon(n){ return '[ico:'+n+']'; }
function _mvIconTuile(n,t){ return '[tuile:'+n+':'+t+']'; }
function _mvInfoBtn(c){ return '[i:'+c+']'; }
function _pilStat(n,u,w){ return '[stat|'+n+'|'+(u||'')+'|'+(w||'')+']'; }
function _pilTile(id,dot,titre,stat,sub,grad,body,cle){ return JSON.stringify({ id:id, titre:titre, stat:stat, sub:sub, body:body, cle:cle }); }
function _pecBurnSvg(){ return '<svg></svg>'; }
function _pecNonRetenu(){ return 'NON RETENU'; }
`;
function monde(S) {
  const ctx = { Math, Number, String, Object, Array, isFinite, isNaN, JSON, Date };
  ctx.window = ctx;
  ctx._pilSaison = () => ({ nom: 'Après-vendange 2026-2027', debut: '2026-10-24', fin: '2027-02-28' });
  ctx.__fiches = {}; ctx._mvInfoSet = (c, f) => { ctx.__fiches[c] = f; };
  ctx.MV_INFO = { 'pil.eco.fin': { p: ['FIXE 1', 'FIXE 2'] } };
  ctx._mvGraphSuivre = (sel) => { ctx.__graph = sel; };
  vm.createContext(ctx);
  const i = S.pil.indexOf('function _pecPct0(v){'), j = S.pil.indexOf("\n// ── Alertes : ce qui manque, ce qui dérape, ce qu'on peut corriger ───");
  if (i < 0 || j < i) throw new Error('bloc du verdict introuvable');
  vm.runInContext(BOUCHONS + ligne(S.pil, 'function _pecIsoToMs(iso){') + ligne(S.pil, 'function _pecMoisCourt(') + ligne(S.pil, 'function _pecJourCourt(ms){')
    + S.pil.slice(i, j) + '\n' + S.pil.slice(S.pil.indexOf('function _pecFiabOk(cleFia){'), S.pil.indexOf('\n}\n', S.pil.indexOf('function _pecFiabCard(Z, R, cleFia, cleRem){')) + 3)
    + fnDe(S.pil, 'function _pecTuileFin(E,TL){')
    + '\nthis.M=_pecVerdictM; this.V=_pecVerdict; this.Z=function(z){ return _pecFiabBande(z,"pil.eco.fiabilite"); }; this.Rq=_pecFiabRemq; this.C=_pecFiabCard; this.F=_pecTuileFin; this.P0=_pecPct0;', ctx);
  return ctx;
}
const E0 = (o = {}) => Object.assign({ hasRate: true, avc: 15.6, cons: 12.3, engage: 1940, budget: 15784, projFin: 15317, moSrc: 'planning', projOn: true,
  tv: { hVigne: 146 }, cad: { ok: false, src: 'planning', seuil: 40, ecart: null, applic: false } }, o);
const CAD = (ecart, o = {}) => ({ cad: Object.assign({ ok: true, src: 'planning', seuil: 40, ecart, applic: true, hReel: 146, hBar: 124, hTrac: 6 }, o) });

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d]);
  const essai = (n, f) => { try { f(); } catch (e) { T(n + ' — plantage', false, String(e && e.stack || e).slice(0, 300)); } };

  /* ── ① LA PHRASE ── */
  essai('① le verdict', () => {
    const W = monde(S); let M;
    M = W.M(E0({ hasRate: false }));
    T('① sans taux horaire : le chiffrage n’est pas branché, et le bouton mène aux Réglages', M.t === 'Le chiffrage n’est pas branché' && /sans taux horaire/.test(M.r) && M.act.length === 1 && M.act[0][0] === 'diag' && M.act[0][1] === 'equipe', JSON.stringify(M));
    M = W.M(E0({ avc: 2 }));
    T('① au début : « La campagne démarre », l’engagé sur le budget', M.t === 'La campagne démarre' && M.r === '<b>' + eur(1940) + '</b> engagés sur <b>' + eur(15784) + '</b>', M.t + ' : ' + M.r);
    M = W.M(E0());
    T('① la démo : « Le budget tient », 12 % engagé pour 16 % du travail fait — des pour-cent entiers', M.t === 'Le budget tient' && M.r === '<b>12\u00a0%</b> engagé pour <b>16\u00a0%</b> du travail fait' && M.act.length === 0 && M.cadre === null, M.t + ' : ' + M.r);
    M = W.M(E0({ projFin: 16251 }));
    T('① le coût à la fin passe le budget sans cadence mesurée : « Le budget serait dépassé », de combien', M.t === 'Le budget serait dépassé' && M.r.startsWith('<b>+' + eur(467) + '</b> à la fin') && M.ic[0] === 'alerte', M.t + ' : ' + M.r);
    M = W.M(E0(Object.assign({ projFin: 18200 }, CAD(18))));
    T('① +18 % de cadence, appliquée : le titre, l’écart, le dépassement à la fin, deux boutons', M.t === 'Le travail prend plus de temps que le barème' && M.r === '<b>+18\u00a0%</b>, soit <b>2,4 k€</b> au-dessus du budget à la fin' && M.ic[1] === 'rouge' && M.act.map((a) => a[1]).join() === 'pos,taches', M.r);
    M = W.M(E0(CAD(18, { applic: false })));
    T('① +18 % non appliquée : la phrase le dit', M.r === '<b>+18\u00a0%</b>, non appliqué au budget', M.r);
    M = W.M(E0(CAD(8)));
    T('① +8 % : une légère dérive, un bouton', M.t === 'Légère dérive de cadence' && M.r === '<b>+8\u00a0%</b> de temps sur le travail fait' && M.act.length === 1 && M.act[0][1] === 'pos', M.r);
    M = W.M(E0(CAD(-12)));
    T('① −12 % : l’équipe va plus vite', M.t === 'L’équipe va plus vite que le barème' && M.r === '<b>12\u00a0%</b> de temps en moins', M.r);
    M = W.M(E0(CAD(2)));
    T('① +2 % : la cadence colle au barème', M.t === 'La cadence colle au barème' && /<b>12\u00a0%<\/b> engagé pour <b>16\u00a0%<\/b>/.test(M.r), M.r);
    M = W.M(E0(CAD(2, { src: 'histo', histoNom: 'Après-vendange 2025-2026' })));
    T('① une cadence de l’an dernier : le titre le dit, le cadre nomme la campagne', M.t === '\u21a9\ufe0e La cadence de l’an dernier collait au barème — mesuré sur la campagne précédente' && /mesuré sur <b>Après-vendange 2025-2026<\/b> — cette campagne en est à 16 % sur 40 %/.test(M.cadre), M.t + ' | ' + M.cadre);
    const tous = [E0({ hasRate: false }), E0({ avc: 2 }), E0(), E0({ projFin: 16251 }), E0(Object.assign({ projFin: 18200 }, CAD(18))), E0(CAD(18, { applic: false })), E0(CAD(8)), E0(CAD(-12)), E0(CAD(2)), E0(CAD(2, { src: 'histo' }))]
      .map((e) => { const m = W.M(e); return m.t + ' ' + m.r + ' ' + (m.cadre || ''); }).join(' ‖ ');
    T('① aucune phrase ne dit « période », « dépensé », « avancement », ni un pour-cent à décimale', !/p[ée]riode|dépens|avancement|réalisé|\d,\d\u00a0%/i.test(tous), tous.match(/p[ée]riode|dépens|avancement|réalisé|\d,\d\u00a0%/i));
    T('① un pour-cent s’arrondit à l’entier, espace insécable', W.P0(12.3) === '12\u00a0%' && W.P0(15.6) === '16\u00a0%' && W.P0(undefined) === '0\u00a0%');

    /* ── ② LA LIGNE DE LA CAMPAGNE, LA COCHE, LA BANDE ── */
    let H = W.V(E0(), null, []);
    T('② la campagne et ses dates ouvrent la phrase', /<div class="pec-per"><span><b>Après-vendange 2026-2027<\/b> \u00b7 24 oct\. \u2192 28 févr\.<\/span>/.test(H), H.slice(0, 260));
    T('② UNE phrase : le titre, deux points, le repère, un point', /<div class="t">Le budget tient\u00a0: <b>12\u00a0%<\/b> engagé pour <b>16\u00a0%<\/b> du travail fait\. \[i:pil\.cadence\]<\/div>/.test(H) && !/class="d"/.test(H));
    T('② rien ne manque au chiffrage : une coche « complet », la fiche à portée', /<span class="pec-ok">\[ico:check\] complet \[i:pil\.eco\.fiabilite\]<\/span>/.test(H));
    const ZZ = [{ nom: 'Traitements sans dose chiffrée', cible: 'registre', ou: 'Phyto › Registre' }, { nom: 'Prix du GNR', cible: null, ou: null }];
    H = W.V(E0(), null, ZZ);
    T('② un poste manque : pas de coche', !/pec-ok/.test(H));
    T('② sans postes à zéro : pas de bande', W.Z([]) === '' && W.Z(null) === '');
    const B = W.Z(ZZ);
    T('② deux postes à zéro : la bande les compte, les nomme, pose le bouton qui y mène et la fiche', /<b>2 postes à zéro<\/b> \u00b7 Traitements sans dose chiffrée \u00b7 Prix du GNR/.test(B) && /data-diag="registre">Phyto › Registre \u203a<\/button>/.test(B) && (B.match(/<button/g) || []).length === 1 && /\[i:pil\.eco\.fiabilite\]/.test(B) && /role="status"/.test(B), B);
    T('② un seul : au singulier', /<b>1 poste à zéro<\/b>/.test(W.Z(ZZ.slice(0, 1))));
    const Z3 = ZZ.slice(0, 1); Z3.nBudget = 3;
    T('② … et la bande garde le lien avec le bandeau « à compléter » : « 1 des 3 »', / · 1 des 3 à compléter<\/span>/.test(W.Z(Z3)) && !/ des /.test(W.Z(ZZ)), W.Z(Z3));
    const Rq = W.Rq(['R1', 'R2'], 'pil.eco.remarques');
    T('② les remarques : un bouton court, leur compte, et la fiche du moment remplie', /<button class="pec-remq" data-mvi="pil\.eco\.remarques"><span class="pec-remq-n">2<\/span>remarques sur ces chiffres/.test(Rq) && W.__fiches['pil.eco.remarques'].p.length === 2 && W.Rq([], 'x') === '', Rq);
    T('② le rendu partagé (Le détail de l’exercice) : la bande OU la coche, puis les remarques', /class="pec-al"/.test(W.C(ZZ, ['R1'], 'a', 'pil.eco.remarques')) && /<div class="pec-per"><span class="pec-ok">\[ico:check\] complet \[i:a\]<\/span><\/div><button class="pec-remq"/.test(W.C([], ['R1'], 'a', 'pil.eco.remarques')));
    H = W.V(E0(Object.assign({ projFin: 18200 }, CAD(18))), null, []);
    T('② les boutons du verdict restent sous la phrase', /data-pec="sub" data-v="pos">Voir quel travail dérape \u203a/.test(H) && /data-diag="taches">Réglages › Tâches \u203a/.test(H));

    /* ── ③ LA TUILE « COÛT À LA FIN » ── */
    const TL = { ok: true, finV: 15317, finMs: Date.parse('2026-11-25T00:00:00'), finPrevue: true, projMs: null, pace: 638, nDays: 3, objMs: 1 };
    let U = JSON.parse(W.F(E0(), TL));
    T('③ « Coût à la fin » : le chiffre d’Aujourd’hui et sa date sur le titre, la fiche pil.eco.fin', U.id === 'ecofin' && U.titre === 'Coût à la fin' && U.stat === '[stat|' + eur(15317) + '| \u00b7 25 nov.|]' && U.cle === 'pil.eco.fin' && U.sub === '', U.stat);
    T('③ … dedans : le graphique, sa légende, le rythme comme une mesure', /<div id="pec-g-burn"><\/div>/.test(U.body) && W.__graph === '#pec-g-burn' && /Engagé cumulé/.test(U.body) && />Projection</.test(U.body) && /<div class="l">Rythme<\/div><div class="v">638\u00a0€<small> par jour<\/small><\/div><div class="s">les 3 derniers jours<\/div>/.test(U.body), U.body.slice(-260));
    T('③ … plus de mode d’emploi à demeure dans la tuile', !/pec-note/.test(U.body) && !/Chaque euro est pos/.test(U.body));
    const F = W.__fiches['pil.eco.fin'];
    T('③ … la méthode est derrière le « i » : le texte fixe, puis les heures du moment', !!F && F.p[0] === 'FIXE 1' && F.p[1] === 'FIXE 2' && /neutralisé sous 40 % du barème fait — 16 % à ce jour/.test(F.p[2]) && /<b>146 h<\/b> payées dans les rangs/.test(F.p[3]), JSON.stringify(F));
    W.F(E0(CAD(18, { applic: false })), TL);
    T('③ … une cadence mesurée : les heures de présence contre le barème, et pourquoi elle n’est pas retenue', /<b>146 h<\/b> de présence contre <b>124 h<\/b> prévues, après déduction de 6 h de tracteur/.test(W.__fiches['pil.eco.fin'].p[2]) && /NON RETENU/.test(W.__fiches['pil.eco.fin'].p[2]));
    U = JSON.parse(W.F(E0(), Object.assign({}, TL, { projMs: Date.parse('2026-11-12T00:00:00') })));
    T('③ le coût dépasse le budget : « budget épuisé le » sur le titre', U.stat === '[stat|' + eur(15317) + '| \u00b7 25 nov.|budget épuisé le 12 nov.]', U.stat);
    U = JSON.parse(W.F(E0(), Object.assign({}, TL, { finPrevue: false })));
    T('③ sans fin prévue : le chiffre sans date', U.stat === '[stat|' + eur(15317) + '||]', U.stat);
    U = JSON.parse(W.F(E0(), { ok: false }));
    T('③ rien de validé : un tiret, et l’écran vide en une ligne', U.stat === '[stat|\u2014||]' && /<div class="pec-empty">Le tracé se remplit à mesure que les travaux sont validés au journal\.<\/div>/.test(U.body));
  });

  /* ── ③ bis L’ÉCRAN, lu dans le code ── */
  const vue = sansCom(fnDe(S.pil, 'function _pecViewSynthese(E,TL){'));
  const etiq = [...vue.matchAll(/<div class="pec-k"><div class="l">([^'<]+)/g)].map((m) => m[1]);
  T('③ quatre chiffres, aux étiquettes du lexique : Budget, Engagé, Reste, Écart de cadence', etiq.join('|') === 'Budget|Engagé|Reste|Écart de cadence', etiq.join('|'));
  T('③ … plus « Budget de la période », « Engagé à ce jour », « Reste à engager », « encore à faire »', !/Budget de la p|Engag\\u00e9 \\u00e0 ce jour|Engagé à ce jour|Reste \\u00e0 engager|Reste à engager|encore \\u00e0 faire|encore à faire/.test(vue));
  T('③ … leurs repères : l’hectare, la part du budget, les heures à faire', /_ecoEur\(E\.coutHaB\)\)\+'\/ha<\/div>/.test(vue) && /_pecPct0\(E\.cons\)\+' du budget<\/div>/.test(vue) && /_pilNum\(Math\.round\(E\.tot\.rH\)\)\+' h à faire<\/div>/.test(vue));
  T('③ … les fiches de l’engagé et de la cadence restent posées à côté de leur chiffre', /Engagé'\+\(typeof _mvInfoBtn==='function'\?\(' '\+_mvInfoBtn\('pil\.eco\.engage'\)\):''\)/.test(vue) && /Écart de cadence'\+\(typeof _mvInfoBtn==='function'\?\(' '\+_mvInfoBtn\('pil\.cadence'\)\):''\)/.test(vue));
  T('③ la barre : le plein est l’engagé, un trait dit le travail fait', /<div class="pec-jr"><div class="pec-bar"><i style="width:'\+pE\.toFixed\(1\)/.test(vue) && /<span class="pec-rep" style="left:'\+pA\.toFixed\(1\)\+'%"><\/span>/.test(vue) && /travail fait <b>'\+_pecPct0\(E\.avc\)/.test(vue));
  T('③ trois tuiles repliées : le coût à la fin, l’année (avec ses avis), le prix de revient', /<div class="pil-panels">'\+_pecTuileFin\(E,TL\)\+\(an\?_pilPanelAnBudget\(avis\):''\)\+_pecTuileRevient\(E\)\+'<\/div>'/.test(vue) && /if\(!an && avis\) H\+=avis;/.test(vue));
  T('③ … repliées par défaut, avec leur icône', /anbudget:1,ecofin:1,ecorev:1,/.test(S.pil) && /ecofin:'graphique',ecorev:'bouteille'\}/.test(S.pil));
  T('③ les remarques ferment l’écran, par le rendu partagé', /H\+=_pecFiabRemq\(_pecRemarques\(E,TL\),'pil\.eco\.remarques'\);/.test(vue) && /_pecVerdict\(E,TL,Z\)\+_pecFiabBande\(Z,'pil\.eco\.fiabilite'\)/.test(vue) && !/sur la lecture de ces chiffres/.test(sansCom(S.pil)));
  T('③ plus de carte « Ce qu’il faut regarder », plus de note à demeure, plus de bande d’exercice dans la vue', !/qu\\u2019il faut regarder|qu’il faut regarder|pec-note|_pecBandeExo|_pecAlertes/.test(vue));
  T('③ les fonctions parties ne laissent pas de reste', !/function _pecBandeExo\(|function _pecAlertes\(|function _pilAnEcoHtml\(/.test(S.pil) && !/_pecBandeExo\(\)|_pecAlertes\(E|_pilAnEcoHtml\(\)/.test(sansCom(S.pil)));
  const rev = sansCom(fnDe(S.pil, 'function _pecTuileRevient(E){'));
  T('③ « Prix de revient » : la bouteille sur le titre, le millésime dessous, deux portes', /_pilStat\(\(RV&&RV\.tot\.eurCol!=null\)\?\(_pecRevE2\(RV\.tot\.eurCol\)\+'\\u00a0\\u20AC'\):'\\u2014',' la bouteille'\)/.test(rev) && /'millésime '\+RV\.mil/.test(rev) && /_pilTile\('ecorev','#8A5A38','Prix de revient', stat, sub, null, body, 'pil\.eco\.revient'\)/.test(rev) && (rev.match(/data-pec="sub" data-v="(rev|pos)"/g) || []).length === 2);
  const an = sansCom(fnDe(S.pil, 'function _pilPanelAnBudget(avis){'));
  T('③ la tuile de l’année : son titre dit le cadre, « sur » entre deux chiffres, Sorti et Total prévu, la porte du détail, ses avis dedans', /var titre=\(C&&C\.cadre==='vig'\)\?'L\\u2019ann\\u00e9e vigne':'L\\u2019exercice', sub=C\?C\.court:'';/.test(an)
    && /_pilStat\(K\(B\.dep\)\+'\\u00a0k\\u20ac',' sur '\+K\(B\.tot\)\+'\\u00a0k\\u20ac'\)/.test(an) && /_pilAnFig\('Sorti','au '/.test(an) && /_pilAnFig\('Total pr\\u00e9vu'/.test(an) && !/D\\u00e9pens\\u00e9|attendu/.test(an)
    && /body=\(avis\|\|''\)\+body\+'<div class="pec-acts"><button class="pec-btn" data-pec="sub" data-v="exe">/.test(an) && /_pilTile\('anbudget','#8A5A38',titre, stat, sub, null, body, 'pil\.an\.budget'\)/.test(an));
  T('③ … son tableau et son graphique disent « sorti »', /<span role="columnheader">Sorti<\/span>/.test(S.pil) && /<\/em>sorti<\/span>'/.test(S.pil));
  const eco = sansCom(fnDe(S.pil, 'function _pilTabEco(d){'));
  T('③ la Synthèse n’a plus rien au-dessus d’elle que la sous-barre', /else body=_pecViewSynthese\(E,TL\);/.test(eco));
  T('③ plus d’avis de périmètre en Économie : chaque sous-vue nomme ce qu’elle chiffre (la Synthèse en MOTS-1, les cinq autres en MOTS-2, §583)', !/_pilAvertEco/.test(sansCom(S.pil)) && /return '<div class="pec-wrap">'\+_pecSubNav\(E\)\+body\+'<\/div>';/.test(eco));
  T('③ plus de ligne « … · ha · taux moyen » sous la sous-barre (aucune sous-vue, depuis MOTS-2)', !/var ctx=|pec-ctx/.test(fnDe(S.pil, 'function _pecSubNav(E){')));
  T('③ plus de sous-titre qui redit l’onglet', /eco:'Économie',/.test(S.pil) && !/budget, rythme de dépense et prix de revient/.test(S.pil));

  /* ── ④ CE QUI SUIT ── */
  const fi = S.uti.indexOf("'pil.eco.fin': {"), fj = S.uti.indexOf('\n  ] }', fi) + 6;   // la fiche seule : MOTS-2 (§583) en a posé deux autres juste après
  const fiche = fi > 0 && fj > fi ? S.uti.slice(fi, fj) : '';
  T('④ la fiche pil.eco.fin est déclarée : le coût à la fin, chaque euro à sa date, le rythme, la cadence', /t: 'Le coût à la fin, et son graphique'/.test(fiche) && /Chaque euro est posé à <b>sa<\/b> date/.test(fiche) && /Le <b>rythme<\/b> est une mesure/.test(fiche) && /L\\u2019<b>écart de cadence<\/b> vient de là/.test(fiche) && (fiche.match(/^    '/gm) || []).length === 4);
  T('④ la fiche de l’année dit ce que la tuile ne dit plus (tout le domaine, les euros sortis, deux questions)', /'pil\.an\.budget': \{ t: 'L’exercice, ou l’année vigne'/.test(S.uti) && /<b>salaires chargés compris<\/b>, pour <b>tout le domaine<\/b>/.test(S.uti) && /Deux questions, jamais deux totaux d’une même chose/.test(S.uti));
  T('④ la fiche du revient dit ce qui se lit sur le cycle et ce qui se lit sur la campagne', /seule la <b>bouteille<\/b> se lit sur le cycle du millésime/.test(S.uti));
  T('④ l’aide d’Économie dit la Synthèse en une ligne', /La <b>Synthèse<\/b> tient en une phrase, quatre chiffres et trois tuiles repliées/.test(S.uti));
  T('④ le guide : la Synthèse d’un coup d’œil, la bande rouge, les quatre chiffres, les tuiles', /La Synthèse d'Économie, d'un coup d'œil<\/h3>/.test(S.guide) && /une <b>bande rouge<\/b> le dit sous la phrase/.test(S.guide) && /Viennent <b>quatre chiffres<\/b>/.test(S.guide) && /Le reste est <b>replié<\/b>, son chiffre sur le titre : <b>Coût à la fin<\/b>/.test(S.guide)
    && !/Le verdict, en tête d'Économie|bande <b>L'exercice en cours<\/b>/.test(S.guide));
  const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1];
  const bloc = S.wn.slice(S.wn.indexOf("{ v: '11.10'"), S.wn.indexOf("{ v: '11.09'"));
  T('④ l’annonce de la 11.10, pour l’admin', /^  \{ v: '11\.10', d: '2026-11-16'/m.test(S.wn) && /la Synthèse se lit d’un coup d’œil/.test(bloc) && /Aucun calcul ne change/.test(bloc) && /pour: \['admin'\]/.test(bloc));
  T('④ les versions : l’appli à 11.10 au moins, cinq affichages ; le SW dit MOTS-1', !!app && Number(app) >= 11.10 && S.idx.split('v' + app).length - 1 === 4 && S.idx.includes('boot.js?v=' + app) && /^\/\/ v12\.01 \(16\/11\/2026\) — MOTS-1 \(§582\)/m.test(S.sw), 'APP ' + app);
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  const mt = ref && ref.mesures && ref.mesures['téléphone'] && ref.mesures['téléphone']['Pilotage › Économie › Synthèse'];
  T('④ la référence des mots a baissé avec l’écran : moins de 120 mots au téléphone, plus une phrase de 15 mots, 15 mots au plus avant le premier grand chiffre', !!mt && mt.mots < 120 && mt.p15 === 0 && mt.avant !== null && mt.avant <= 15, JSON.stringify(mt));
  T('④ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-mots1.mjs'") > 0 && S.liste.indexOf("mv-harnais-mots1.mjs --contre'") > 0);
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
    ['les pour-cent de la phrase reprennent une décimale', sur('pil', "function _pecPct0(v){ return Math.round(Number(v)||0)+'\u00a0%'; }", "function _pecPct0(v){ return (Math.round((Number(v)||0)*10)/10).toString().replace('.',',')+'\u00a0%'; }")],
    ['« La période démarre » revient', sur('pil', "t='La campagne démarre';", "t='La période démarre';")],
    ['le budget « tient » même quand le coût à la fin le dépasse', sur('pil', "if(sup>0.5){ ic=['alerte','or']; t='Le budget serait dépassé';", "if(false){ ic=['alerte','or']; t='Le budget serait dépassé';")],
    ['la phrase de la démo perd son repère', sur('pil', "else { ic=['journal','']; t='Le budget tient'; r=parts; }", "else { ic=['journal','']; t='Le budget tient'; r=''; }")],
    ['la dérive perd son bouton', sur('pil', "    act.push(['sub','pos','Voir quel travail dérape']);\n", '')],
    ['une cadence non appliquée ne le dit plus', sur('pil', " : ', non appliqué au budget');\n    act.push(['sub','pos','Voir quel travail dérape']);", " : '');\n    act.push(['sub','pos','Voir quel travail dérape']);")],
    ['le cadre de l’an dernier reparle de « période »', sur('pil', '</b> — cette campagne en est à ', '</b> — cette période en est à ')],
    ['la ligne de la campagne perd ses dates', sur('pil', "+((a!==null&&b!==null)?(' \u00b7 '+_pilEsc(_pecJourCourt(a))+' \u2192 '+_pilEsc(_pecJourCourt(b))):'')+'</span>'", "+'</span>'")],
    ['le verdict retrouve un paragraphe sous son titre', sur('pil', "+'<div class=\"t\">'+M.t+(M.r?", "+'<div class=\"t\">'+M.t+'</div><div class=\"d\">'+(M.r?")],
    ['la coche « complet » s’affiche même quand un poste manque', sur('pil', "var complet=(Z && !Z.length) ? _pecFiabOk('pil.eco.fiabilite')", "var complet=(Z) ? _pecFiabOk('pil.eco.fiabilite')")],
    ['la bande s’affiche sans poste à zéro', sur('pil', "function _pecFiabBande(Z, cleFia){\n  if(!Z || !Z.length) return '';", "function _pecFiabBande(Z, cleFia){\n  if(!Z) return '';")],
    ['la bande perd le bouton qui mène au bon écran', sur('pil', "return z.cible ? '<button class=\"pil-diag-go ghost\" data-diag=\"'+_pilEsc(z.cible)", "return false ? '<button class=\"pil-diag-go ghost\" data-diag=\"'+_pilEsc(z.cible)")],
    ['la bande perd sa fiche', sur('pil', "    +(typeof _mvInfoBtn==='function'?_mvInfoBtn(cleFia):'')+'</div>';", "    +'</div>';")],
    ['« Coût à la fin » perd sa date', sur('pil', "TL.finPrevue?(' \\u00b7 '+_pilEsc(_pecJourCourt(TL.finMs))):''", "''")],
    ['« budget épuisé le » ne monte plus sur le titre', sur('pil', "TL.projMs?('budget épuisé le '+_pilEsc(_pecJourCourt(TL.projMs))):null)", 'null)')],
    ['la note de méthode revient à demeure dans la tuile', sur('pil', "var body='<div id=\"pec-g-burn\"></div>'", "var body='<div class=\"pec-note\">Chaque euro est posé à sa date.</div><div id=\"pec-g-burn\"></div>'")],
    ['la méthode du moment n’est plus posée derrière le « i »', sur('pil', "window._mvInfoSet('pil.eco.fin', { p: base.concat(", "window._mvInfoSet('pil.eco.finX', { p: base.concat(")],
    ['le texte fixe de la fiche est écrasé par les heures du moment', sur('pil', "window._mvInfoSet('pil.eco.fin', { p: base.concat(", "window._mvInfoSet('pil.eco.fin', { p: [].concat(")],
    ['« Coût à la fin » s’ouvre sans fiche', sur('pil', "return _pilTile('ecofin','#8A5A38','Coût à la fin', stat, '', null, body, 'pil.eco.fin');", "return _pilTile('ecofin','#8A5A38','Coût à la fin', stat, '', null, body, null);")],
    ['une étiquette reprend son ancien nom', sur('pil', "+'<div class=\"pec-k\"><div class=\"l\">Reste</div>", "+'<div class=\"pec-k\"><div class=\"l\">Reste à engager</div>")],
    ['la fiche de la cadence quitte son chiffre', sur('pil', "Écart de cadence'+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.cadence')):'')+'</div>'", "Écart de cadence</div>'")],
    ['la barre perd le trait du travail fait', sur('pil', "<span class=\"pec-rep\" style=\"left:'+pA.toFixed(1)+'%\"></span>", '')],
    ['une tuile s’ouvre par défaut', sur('pil', 'anbudget:1,ecofin:1,ecorev:1,', 'anbudget:1,ecorev:1,')],
    ['la tuile de l’année quitte la Synthèse', sur('pil', "+(an?_pilPanelAnBudget(avis):'')+_pecTuileRevient(E)+'</div>'", "+_pecTuileRevient(E)+'</div>'")],
    ['les avis de l’année se perdent quand la tuile est éteinte', sur('pil', '  if(!an && avis) H+=avis;\n', '')],
    ['les remarques reprennent leur long libellé', sur('pil', "+' sur ces chiffres'", "+' sur la lecture de ces chiffres'")],
    ['les remarques ne remplissent plus leur fiche', sur('pil', "if(typeof window._mvInfoSet==='function') window._mvInfoSet(cleRem, { p:R });", '')],
    ['la tuile de l’année redit « dépensé »', sur('pil', "_pilAnFig('Sorti','au '", "_pilAnFig('D\\u00e9pens\\u00e9','au '")],
    ['la tuile de l’année perd la porte du détail', sur('pil', "body=(avis||'')+body+'<div class=\"pec-acts\"><button class=\"pec-btn\" data-pec=\"sub\" data-v=\"exe\">", "body=(avis||'')+body+'<div class=\"pec-acts\"><button class=\"pec-btn\" data-pec=\"sub\" data-v=\"exo\">")],
    ['l’avis de périmètre revient en Économie', sur('pil', "return '<div class=\"pec-wrap\">'+_pecSubNav(E)+body+'</div>';", "return '<div class=\"pec-wrap\">'+_pecSubNav(E)+_pilCadreAvert(_pilAvertEco())+body+'</div>';")],
    ['la ligne de contexte revient sous la sous-barre', sur('pil', "  return '<div class=\"pec-subnav\"><div class=\"pec-sub\">'+b+'</div></div>';", "  var ctx='7,02 ha'; return '<div class=\"pec-subnav\"><div class=\"pec-sub\">'+b+'</div><div class=\"pec-ctx\">'+ctx+'</div></div>';")],
    ['le sous-titre redit l’onglet', sur('pil', "eco:'Économie',", "eco:'Économie — budget, rythme de dépense et prix de revient',")],
    ['la bande d’exercice revient', (S) => ({ ...S, pil: S.pil + '\nfunction _pecBandeExo(){ return ""; }\n' })],
    ['la fiche pil.eco.fin perd la méthode des dates', sur('uti', "    'Chaque euro est posé à <b>sa</b> date : la main-d\\u2019œuvre", "    'La main-d\\u2019œuvre")],
    ['la fiche de l’année garde son ancien titre', sur('uti', "'pil.an.budget': { t: 'L’exercice, ou l’année vigne'", "'pil.an.budget': { t: 'Le budget de l’année'")],
    ['le guide garde l’ancien titre', sur('guide', "La Synthèse d'Économie, d'un coup d'œil</h3>", "Le verdict, en tête d'Économie</h3>")],
    ['l’annonce manque', sur('wn', "{ v: '11.10', d: '2026-11-16'", "{ v: '11.095', d: '2026-11-16'")],
    ['la référence des mots n’a pas été regravée', (S) => { const r = JSON.parse(S.ref); r.mesures['téléphone']['Pilotage › Économie › Synthèse'].mots = 440; return { ...S, ref: JSON.stringify(r) }; }],
    ['une phrase de 15 mots revient sur la Synthèse', (S) => { const r = JSON.parse(S.ref); r.mesures['téléphone']['Pilotage › Économie › Synthèse'].p15 = 1; return { ...S, ref: JSON.stringify(r) }; }],
    ['la liste ne joue plus ce fichier', (S) => ({ ...S, liste: S.liste.split("mv-harnais-mots1.mjs'").join("mv-harnais-motsZ.mjs'") })],
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
