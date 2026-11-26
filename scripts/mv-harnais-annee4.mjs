/* ───────────────────────────────────────────────────────
   HARNAIS — ANNEE-4 (§615) : LE NOM D'UNE SAISON, D'UNE SEMAINE À PART ; « MON ANNÉE » AUX COULEURS DE LA VUE
   Lancer :          node scripts/mv-harnais-annee4.mjs
   Contre-épreuves : node scripts/mv-harnais-annee4.mjs --contre

   POURQUOI IL EXISTE
   Une saison n'est écrite nulle part : elle se LIT dans la grille. Son nom (facultatif, maquette v3 ; les semaines à part
   aussi, Nico le 26/11) est rangé avec le modèle (_noms : {'m-j': nom}, le jour où la période commence) et va à la période qui
   contient ce jour. Ce harnais joue les VRAIES fonctions (src/planning-annee.js, src/planning-annee-vue.js, l'export et
   l'import CSV de src/planning.js) sur la VRAIE grille 2026 du modèle « standard », et tient :
     ① la lecture : un nom va à la saison qui contient son jour, une semaine à part prend le sien, une saison le plus tôt ;
     ② nommer : le brouillon, le nom posé au début de la période, l'ancien effacé, le même nom sans brouillon, un nom propre
        (40 signes, sans retour ni contrôle), rien pour qui n'est pas admin ;
     ③ le nom suit la coupe (plus tôt comme plus tard), reste à la partie d'avant quand « Changer le rythme » coupe la saison ;
     ④ « Enregistrer » ne garde que les noms qui nomment encore une période ;
     ⑤ l'écran : la ligne de la vue (le nom à la place du rythme, le rythme dans la bulle), le champ en tête du panneau (l'admin),
        le nom en titre (les autres), le nom de la saison sous le titre d'une semaine ; le champ s'enregistre à sa validation ;
     ⑥ le programme indicatif et « Mon année » disent le nom ; « Mon année » prend les pièces de la vue ;
     ⑦ l'export CSV écrit les noms, l'import les relit à l'identique.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const sansPonts = (t) => t.replace(/^function (\w+)\(\)\{ return window\.\1\.apply\(null, arguments\); \}$/gm, '');
const S0 = { pl: lire('src/planning.js'), an: lire('src/planning-annee.js'), vu: lire('src/planning-annee-vue.js'), css: lire('src/annee.css') };

function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const ligneVar = (src, nom) => { const m = new RegExp('^var ' + nom + '\\s*=.*$', 'm').exec(src); if (!m) throw new Error('VAR ABSENTE : ' + nom); return m[0]; };
const NOMS = ['_paH', '_paHm', '_paMinT', '_paHHMM', '_planAnneeSaison', '_planAnneeLire', '_planAnneeDate', '_planAnneePlage', '_planAnneeResumeTxt', '_planAnneeResumeAB',
  '_planAnneeCopie', '_planAnneePose', '_planAnneeGrille', '_planAnneeMeta', '_planAnneeMetaCopie', '_planAnneeMetaEd', '_planAnneeBrouillon', '_planAnneeSemDefaut', '_planAnneeSemSel',
  '_planAnneeCible', '_planAnneeTotal', '_planAnneeCleS', '_planAnneePriseSaison', '_planAnneeHoraire', '_planAnneeHorairesTxt', '_planAnneeReguliers', '_planAnneePasVal', '_planAnneeVal',
  '_planAnneeNomsIx', '_planAnneeNoms', '_planAnneeNomsUtiles', '_planAnneeNomPropre', 'planAnneeNom', 'planAnneeCoupe', 'planAnneeDesIci', 'planAnneeEnregistrer',
  '_planAnneeHoraireTxt', '_planAnneeNature', '_planAnneeModulation', '_planAnneeProgramme', '_planAnneeMini',
  '_anvP', '_anvSom', '_anvRythme', '_anvParSem', '_anvCtx', '_anvRangs', '_anvSec', '_anvDec', '_anvHHMM', '_anvIso', '_anvMemeCel', '_anvCel', '_anvGrille', '_anvChoix', '_anvHeure',
  '_anvDebut', '_anvJourEd', '_anvPanSaison', '_anvPanSemaine', '_anvPanTitre', '_anvVue', 'planAnneeChamp', '_anvApres', '_anvAppuiEcoute', 'planExportCSV', 'planImportCSV', '_planRecaleMap', '_planRecaleAlterne', '_planRecaleSemaines', '_planRecale'];

function monter(S, o) {
  const i0 = S.pl.indexOf('var PLAN_DEF = {'), j0 = S.pl.indexOf('};', i0);
  const PLAN_DEF = vm.runInNewContext('(' + S.pl.slice(i0 + 15, j0 + 1) + ')');
  const toasts = [], rendus = [], sauves = [], telecharge = [];
  const store = o.store || { standard: JSON.parse(JSON.stringify(PLAN_DEF.standard)) };
  const ctx = vm.createContext({ window: { PLAN_MOIS: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'], PLANNING_ENTRIES: {},
      PLAN_PAUSE_MIN: 60, showToast: (m) => toasts.push(m), fbSaveToast: () => 1, fbToastApres: (e, m) => toasts.push(m) },
    _MV_FERIES_CACHE: {}, console, Date, setTimeout: (f) => f(), PLAN_DEF, PLANNING_TEMPLATES: { 2026: store }, planYear: 2026,
    Blob: function (parts) { telecharge.push(parts.join('')); }, URL: { createObjectURL: () => 'u', revokeObjectURL: () => {} },
    document: { createElement: () => ({ click() {} }), body: { appendChild() {}, removeChild() {} }, getElementById: () => ({ files: [{}], value: '' }), addEventListener() {}, removeEventListener() {}, activeElement: null },
    FileReader: function () { this.readAsText = () => this.onload({ target: { result: o.csv || '' } }); } });
  ctx._E = o.E; ctx._rendus = rendus; ctx._store = store; ctx._sauves = sauves; ctx._adm = o.adm !== false;
  ctx._planGetTpl = (pl, y) => (y === 2026 && store[pl]) ? store[pl] : {};
  const AN = sansPonts(S.an), VU = sansPonts(S.vu), SRC = AN + '\n' + VU + '\n' + S.pl;
  const pre = 'function _paE(){return _E;}\nfunction _pY(){return 2026;}\nfunction isAdmin(){return _adm;}\nfunction showToast(m){window.showToast(m);}\n'
    + 'function _planLegal(){return {maxJour:10,maxHebdo:48,maxMoy:44,modulMax:250,hebdoLeg:35,plafAnnuel:1607};}\n'
    + 'function _planBaseActive(){return false;}\nfunction _planBaseAttendue(){return 1600;}\nfunction _planCreditFerie(){return 0;}\nfunction _planFmt(h){return String(h)+" h";}\n'
    + 'function _planModelBrut(id,yr,G){var t=0;for(var m=0;m<12;m++)for(var k in (G[m]||{}))t+=parseFloat(G[m][k])||0;return t;}\n'
    + 'function _planMbrs(){return [];}\nfunction _planPlId(m){return "standard";}\nfunction _planModeles(){return ["standard"];}\n'
    + 'function _planSolidJour(){return null;}\nfunction _escHtml(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}\nfunction _escAttr(s){return _escHtml(s).replace(/"/g,"&quot;");}\n'
    + 'function _mvInfoSet(){}\nfunction _mvInfoBtn(k){return "<button class=\\"mv-i\\"></button>";}\nfunction _planAnneeFerieSem(){return "[ferie]";}\n'
    + 'function _pTplStore(){return _store;}\nfunction planSaveTpl(id){_sauves.push(id);}\nfunction _planRenderCadre(){}\n'
    + 'function _planRenderAnnee(){if(_anvTenir)return;_rendus.push(1);}\nfunction _planAnneeMetaCopie2(){}\n';
  vm.runInContext(pre + fonction(S.pl, '_mvEasterMD') + '\n' + fonction(S.pl, '_feriesY') + '\n' + ligneVar(AN, 'PLAN_MOIS_FR') + '\nwindow.PLAN_MOIS_FR=PLAN_MOIS_FR;\n'
    + ligneVar(VU, 'ANV_OV') + '\n' + ligneVar(VU, 'ANV_CHOIX') + '\n' + ligneVar(VU, '_anvTenir') + '\n' + ligneVar(S.pl, '_PLAN_MOIS_CSV') + '\n' + ligneVar(S.pl, '_PLAN_MOIS_IDX') + '\n'
    + 'var _pTplStoreX=null;\n' + NOMS.map((n) => fonction(SRC, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};', ctx);
  return { F: ctx.f, ctx, toasts, rendus, sauves, telecharge, store };
}
const LIRE = (F, E) => F._planAnneeLire('standard', 2026, F._planAnneeGrille());
const debut = (A, si) => A.J.find((x) => x.s === si && !x.ferme && !x.apart);
const cle = (x) => x.m + '-' + x.d;

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };

  essai('① la lecture : un nom va à la saison qui contient son jour (même au milieu), une semaine à part prend le sien, une saison le plus tôt des siens', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A = LIRE(F, E), w = A.sem.findIndex((s) => s.apart), x2 = A.J.filter((x) => x.s === 2 && !x.apart && !x.ferme);
    const mil = x2[Math.floor(x2.length / 2)], fin = x2[x2.length - 1];
    const N = F._planAnneeNoms(A, { _noms: { [cle(debut(A, 0))]: 'Hiver', [cle(mil)]: 'Printemps', [cle(fin)]: 'Doublon', [cle(A.sem[w].j[2])]: 'Vendanges', '13-40': 'perdu' } });
    return [N.s[0] === 'Hiver' && N.s[2] === 'Printemps' && N.w[w] === 'Vendanges' && N.s[1] == null && !Object.values(N.s).includes('Doublon'), JSON.stringify(N.s) + ' ' + JSON.stringify(N.w)];
  });
  essai('② nommer : un brouillon, le nom au début de la saison ; renommer efface l’ancien ; le même nom, rien ; effacer, plus de nom', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A = LIRE(F, E), a1 = debut(A, 1);
    F.planAnneeNom({ dataset: { k: 's', s: '1' }, value: '  Taille   et   liage  ' }); const pose = E.n === 1 && E.brouillon && E.meta._noms[cle(a1)] === 'Taille et liage';
    F.planAnneeNom({ dataset: { k: 's', s: '1' }, value: 'Taille et liage' }); const meme = E.n === 1;
    E.meta._noms[cle(A.J[a1.i + 9])] = 'vieux';
    F.planAnneeNom({ dataset: { k: 's', s: '1' }, value: 'Taille' }); const renomme = E.n === 2 && Object.values(E.meta._noms).join('|') === 'Taille';
    F.planAnneeNom({ dataset: { k: 's', s: '1' }, value: '' }); const efface = E.n === 3 && Object.keys(E.meta._noms).length === 0;
    return [pose && meme && renomme && efface, [pose, meme, renomme, efface].join(',')];
  });
  essai('② un nom propre (40 signes, sans retour ni signe de contrôle) ; une semaine à part se nomme ; rien pour qui n’est pas admin', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A = LIRE(F, E), w = A.sem.findIndex((s) => s.apart);
    F.planAnneeNom({ dataset: { k: 's', s: '0' }, value: 'Un\nnom\ttrès ' + 'x'.repeat(60) });
    const v = Object.values(E.meta._noms)[0];
    F.planAnneeNom({ dataset: { k: 'w', w: String(w) }, value: 'Vendanges' }); const sem = E.meta._noms[cle(A.sem[w].j[0])] === 'Vendanges';
    F.planAnneeNom({ dataset: { k: 'w', w: '3' }, value: 'pas à part' }); const pasAp = !Object.values(E.meta._noms).includes('pas à part');
    const E2 = { annee: 'standard' }; const m2 = monter(S, { E: E2, adm: false }); m2.F.planAnneeNom({ dataset: { k: 's', s: '0' }, value: 'Hiver' });
    return [v.length === 40 && /^Un nom très x+$/.test(v) && sem && pasAp && !E2.brouillon, v];
  });
  essai('③ le nom suit la coupe — une semaine plus tôt comme deux plus tard — et ne passe jamais à la saison d’avant', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); let A = LIRE(F, E);
    F.planAnneeNom({ dataset: { k: 's', s: '1' }, value: 'Mars' }); F.planAnneeNom({ dataset: { k: 's', s: '0' }, value: 'Hiver' });
    F.planAnneeCoupe({ dataset: { s: '1', n: '-7' } }); A = LIRE(F, E); let N = F._planAnneeNoms(A, E.meta); const tot = N.s[1] === 'Mars' && N.s[0] === 'Hiver' && debut(A, 1).m === 1;
    const lun = A.J.find((x) => x.m === 2 && x.d === 16); F.planAnneeCoupe({ dataset: { s: '1', iso: F._anvIso(2026, lun) } }); A = LIRE(F, E); N = F._planAnneeNoms(A, E.meta);
    return [tot && N.s[1] === 'Mars' && N.s[0] === 'Hiver' && debut(A, 1).m === 2 && debut(A, 1).d >= 16, JSON.stringify(N.s) + ' début ' + debut(A, 1).d + '/' + (debut(A, 1).m + 1)];
  });
  essai('③ « Changer le rythme » coupe la saison : le nom reste à la partie d’avant, la nouvelle n’en a pas', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); let A = LIRE(F, E);
    F.planAnneeNom({ dataset: { k: 's', s: '0' }, value: 'Hiver' }); const w = A.J.find((x) => x.m === 1 && x.d === 9).w;
    F.planAnneeDesIci({ dataset: { w: String(w), g: '0', v: '8' } }); A = LIRE(F, E); const N = F._planAnneeNoms(A, E.meta), x = A.J.find((y) => y.m === 1 && y.d === 9);
    return [A.saisons.length > 6 && N.s[0] === 'Hiver' && x.s !== 0 && N.s[x.s] == null, A.saisons.length + ' saisons'];
  });
  essai('④ « Enregistrer » ne garde que les noms qui nomment encore une période (le reste part)', () => {
    const E = { annee: 'standard' }; const { F, store, sauves } = monter(S, { E }); const A = LIRE(F, E);
    F.planAnneeNom({ dataset: { k: 's', s: '0' }, value: 'Hiver' }); E.meta._noms[cle(A.J[debut(A, 0).i + 20])] = 'orphelin'; E.meta._noms['11-40'] = 'hors';
    F.planAnneeEnregistrer(); const n = store.standard._noms || {};
    return [sauves.length === 1 && Object.keys(n).length === 1 && n[cle(debut(A, 0))] === 'Hiver', JSON.stringify(n)];
  });
  essai('⑤ la vue : le nom à la place du rythme (le rythme dans la bulle), une semaine à part nommée ; sans nom, rien ne change', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A = LIRE(F, E), w = A.sem.findIndex((s) => s.apart);
    const avant = F._anvVue(F._anvCtx(E));
    F.planAnneeNom({ dataset: { k: 's', s: '1' }, value: 'Taille <et> liage' }); F.planAnneeNom({ dataset: { k: 'w', w: String(w) }, value: 'Vendanges' });
    const h = F._anvVue(F._anvCtx(E));
    return [/class="anv-l anv-r anv-r-nom" data-pan="s" data-s="1"[^>]*title="Taille &lt;et&gt; liage — Saison du /.test(h) && h.includes('<b class="anv-nm-n">Taille &lt;et&gt; liage</b>')
      && h.includes('<b class="anv-nm-n">Vendanges</b>') && !avant.includes('anv-r-nom') && (avant.match(/anv-nm-n/g) || []).length === 0, ''];
  });
  essai('⑤ le panneau : le champ du nom en tête pour l’admin (40 signes, les dates dessous nomment la fenêtre) ; le nom en titre pour les autres ; la saison sous le titre d’une semaine', () => {
    const E = { annee: 'standard', pan: { t: 'w' } }; const { F } = monter(S, { E }); F.planAnneeNom({ dataset: { k: 's', s: '0' }, value: 'Hiver' });
    const C = F._anvCtx(E), p = F._anvPanSaison(C, 0), H = F._anvPanTitre(C, p);
    const adm = /<input class="mvchamp mvchamp-compact anv-nom" type="text" maxlength="40"[^>]*value="Hiver"[^>]*data-f="nom" data-k="s" data-s="0"[^>]*onchange="planAnneeChamp\(this,event\)"[^>]*><span id="anv-pan-t">/.test(H);
    C.adm = false; const H2 = F._anvPanTitre(C, p); const lect = /^<div class="anv-pan-tt"><b>Hiver<\/b><span id="anv-pan-t">/.test(H2) && !/<input/.test(H2);
    C.adm = true; const sem = F._anvPanSemaine(C); E.semaine = 3; const sem2 = F._anvPanSemaine(F._anvCtx(E));
    return [adm && lect && / · Hiver$/.test(sem2.s) && sem2.nom == null, sem2.s];
  });
  essai('⑤ le champ du nom : rien en tapant ; à sa validation, le nom ; le même nom remet le champ', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E });
    const el = { dataset: { f: 'nom', k: 's', s: '0' }, type: 'text', value: 'Hiv', defaultValue: '' };
    F.planAnneeChamp(el, { type: 'input' }); const attend = !E.n; el.value = 'Hiver'; F.planAnneeChamp(el, { type: 'change' }); const fait = E.n === 1;
    const el2 = { dataset: { f: 'nom', k: 's', s: '0' }, type: 'text', value: ' Hiver ', defaultValue: 'Hiver' }; F.planAnneeChamp(el2, { type: 'change' });
    return [attend && fait && E.n === 1 && el2.value === 'Hiver', 'n ' + E.n];
  });
  essai('⑥ le programme indicatif et « Mon année » disent le nom ; « Mon année » prend les pièces de la vue (barres, bandes, hachures, pastilles, aujourd’hui)', () => {
    const E = { annee: 'standard' }; const { F, store } = monter(S, { E }); const A = LIRE(F, E), w = A.sem.findIndex((s) => s.apart);
    store.standard._noms = { [cle(debut(A, 0))]: 'Hiver', [cle(A.sem[w].j[0])]: 'Vendanges' };
    const P = F._planAnneeProgramme('standard', 2026), M = F._planAnneeMini('standard', 2026);
    return [/<td><b>Hiver<\/b> — /.test(P) && /<td><b>Vendanges<\/b> — /.test(P) && /<div class="anv-mini"><div class="anv-mini-t"><span class="anv-bar/.test(M) && M.includes('anv-bar-f') && M.includes('anv-bar-ap')
      && /<span class="anv-lg"><\/span><b>Hiver<\/b> · /.test(M) && /<span class="anv-lg anv-lg-ap"><\/span><b>Vendanges<\/b> · /.test(M) && !/background:/.test(M), ''];
  });
  essai('⑦ l’export CSV écrit les noms (mois ; jour ; nom), l’import les relit à l’identique', () => {
    const E = { annee: 'standard' }; const m = monter(S, { E }); m.store.standard._noms = { '2-1': 'Taille ; liage', '8-7': 'Vendanges' };
    m.F.planExportCSV('standard'); const csv = m.telecharge.join('');
    const m2 = monter(S, { E: { annee: 'standard' }, csv, store: {} }); m2.F.planImportCSV('copie'); const n = (m2.store.copie || {})._noms || {};
    return [/\nnom;mar;1;Taille\s+liage\n/.test(csv) && n['2-1'] === 'Taille liage' && n['8-7'] === 'Vendanges' && /\nnom;sep;7;Vendanges/.test(csv) && m2.toasts.some((t) => / · 2 noms/.test(t)), JSON.stringify(n)];
  });
  essai('⑦ l’année d’après (« Préparer 2027 », « Partir de 2026 ») : chaque nom glisse avec son jour et nomme la même période en 2027 et en 2028', () => {
    const E = { annee: 'standard' }; const { F, store } = monter(S, { E }); const A = LIRE(F, E), noms = {};
    A.saisons.forEach((sa, si) => { const x = debut(A, si); if (x) noms[cle(x)] = 'S' + si; }); A.sem.forEach((s, w) => { if (s.apart) noms[cle(s.j[0])] = 'W' + w; });
    store.standard._noms = noms; const res = [];
    for (const an of [2027, 2028]) {
      const R = F._planRecale(store.standard, 2026, an), A2 = F._planAnneeLire('standard', an, R.g), N = F._planAnneeNoms(A2, R.g);
      const s = Object.keys(N.s).sort((a, b) => a - b).map((k) => N.s[k]), w = Object.values(N.w);
      const tient = Object.keys(R.g._noms).every((k) => { const [m, d] = k.split('-').map(Number), o = Object.keys(noms).find((c) => noms[c] === R.g._noms[k]), [m0, d0] = o.split('-').map(Number);
        return (R.g[m] || {})[d] === (store.standard[m0] || {})[d0]; });
      res.push(an + ' : ' + s.join(',') + ' | ' + w.join(','));
      if (!(tient && w.length === Object.values(noms).filter((v) => v[0] === 'W').length && w.every((v) => v[0] === 'W') && s.every((v) => v[0] === 'S')
        && s.map((v) => +v.slice(1)).every((v, i, l) => !i || v > l[i - 1]) && s.length >= Math.min(A.saisons.length, A2.saisons.length) - 1)) return [false, res.join(' ; ') + ' tient=' + tient];
    }
    return [true, res.join(' ; ')];
  });
  T('⑧ la feuille : le champ du nom, la ligne nommée (le nom devant au téléphone), « Mon année » et ses couleurs (aucune en dur hors des replis)',
    /\.anv-ov \.anv-nom\{ display:block; width:100%;/.test(S.css) && /#page-planning \.anv-r-nom \.anv-nm\{ order:-2;/.test(S.css) && /#page-planning \.anv-mini\{ --anv-sable:/.test(S.css)
    && (() => { const a = S.css.indexOf('★★ ANNEE-4 (§615)'), b = S.css.indexOf('/* ★ FIN ANNEE-4 */'); return a >= 0 && b > a && !/#[0-9a-fA-F]{3,6}\b/.test(S.css.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '').replace(/var\(--[\w-]+,[^()]*(\([^()]*\))?[^()]*\)/g, '')); })());
  return out;
}

if (!CONTRE) {
  console.log('\n── ANNEE-4 — le nom des saisons et des semaines à part ; « Mon année » aux couleurs de la vue\n');
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['une saison prend le dernier de ses noms', sur('an', '.sort(function(a,b){return a.x.i-b.x.i;})', '.sort(function(a,b){return b.x.i-a.x.i;})')],
    ['un nom dans une semaine à part nomme la saison', sur('an', 'if(x.apart){if(o.w[x.w]==null)', 'if(false){if(o.w[x.w]==null)')],
    ['renommer laisse l’ancien nom', sur('an', 'jours.forEach(function(x){delete meta._noms[x.m+\'-\'+x.d];});', '')],
    ['le même nom fait un brouillon', sur('an', "if(!a||v===cur)return;", "if(!a)return;")],
    ['un nom sans limite', sur('an', ".trim().slice(0,40);}", ".trim();}")],
    ['qui n’est pas admin nomme', sur('an', "function planAnneeNom(el){\n  if(typeof isAdmin==='function'&&!isAdmin())return;", "function planAnneeNom(el){\n")],
    ['la coupe laisse le nom derrière elle', sur('an', "  if(nm){var meta=_planAnneeMetaEd(E)", "  if(false){var meta=_planAnneeMetaEd(E)")],
    ['« Enregistrer » garde les noms perdus', sur('an', "if(neuf._noms){var nn=", "if(false){var nn=")],
    ['« Enregistrer » oublie les noms', sur('an', "['_timings','_timings_jour','_horaires_dma','_noms'].forEach(function(k){var v=E.meta[k];", "['_timings','_timings_jour','_horaires_dma'].forEach(function(k){var v=E.meta[k];")],
    ['la vue montre le rythme malgré le nom', sur('vu', "nom=(nb||_anvRythme(r.sa.h))", "nom=(_anvRythme(r.sa.h))")],
    ['le nom n’est plus échappé dans la vue', sur('vu', "'<b class=\"anv-nm-n\">'+_escHtml(nm)+'</b>'", "'<b class=\"anv-nm-n\">'+nm+'</b>'")],
    ['le champ du nom n’a plus de limite', sur('vu', 'type="text" maxlength="40"', 'type="text"')],
    ['le nom s’enregistre à chaque lettre', sur('vu', "if((f==='autre'||f==='nom')&&t&&t!=='change')return;", "if(f==='autre'&&t&&t!=='change')return;")],
    ['la semaine ne dit plus le nom de sa saison', sur('vu', ":nmS?' \\u00b7 '+_escHtml(nmS):''", ":''")],
    ['le programme perd le nom', sur('an', "quand:nom(NM.s[si])+", "quand:")],
    ['« Mon année » reprend ses couleurs d’avant', sur('an', "h+=barre(p.i0,p.i1,sa.ab?' anv-bar-ab':''", "h+='<span style=\"background:var(--terre)\"></span>'+barre(p.i0,p.i1,sa.ab?' anv-bar-ab':''")],
    ['l’export oublie les noms', sur('pl', "rows.push('nom'+S+_PLAN_MOIS_CSV[mi]+S+dd+S+v);", '')],
    ['l’année d’après recopie les noms tels quels', sur('pl', "if(grille._noms&&typeof grille._noms==='object'){", "if(false){")],
    ['l’import ne relit pas les noms', sur('pl', "var nN=Object.keys(noms).length;if(nN>0)tplData._noms=noms;", "var nN=0;")],
  ];
  let ok = 0;
  for (const [n, f] of mutants) { let rouge = false, d = ''; try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { d = e.message; }
    if (rouge) ok++; console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit' : '\x1b[31m✗\x1b[0m NE ROUGIT PAS') + ' : ' + n + (d ? ' (' + d + ')' : '')); }
  console.log('\n' + (ok === mutants.length ? '\x1b[32mVERT\x1b[0m — ' + ok + '/' + mutants.length + ' contre-épreuves rougissent' : '\x1b[31mROUGE\x1b[0m — ' + (mutants.length - ok) + ' contre-épreuve(s) muette(s)'));
  process.exit(ok === mutants.length ? 0 : 1);
}
