/* ───────────────────────────────────────────────────────
   HARNAIS — ANNEE-2 (§613) : PLANNING › ANNÉE, LA VUE REFAITE
   Lancer :          node scripts/mv-harnais-annee2.mjs
   Contre-épreuves : node scripts/mv-harnais-annee2.mjs --contre

   POURQUOI IL EXISTE
   Nico (25/11) : la présentation de l'année « grossière… gros, ça prend de la place, c'est pas joli, c'est pas professionnel ».
   Maquette v3 validée le 26/11 (« impeccable ») : docs/maquettes/maquette-planning-annee-refonte-v3.html. Ce harnais joue les
   VRAIES fonctions (src/planning-annee.js, _feriesY de src/planning.js) sur la VRAIE grille 2026 du modèle « standard », et tient :
     ① le compte : les lignes de la vue somment au pied de la colonne « total », qui vaut le compte de la bande ; dès la base de
        l'année (2027), la ligne des fériés porte les heures des fériés chômés et la colonne fait toujours le compte ;
     ② une semaine = un bouton (ses heures), une seule ancre de tuto ; la vue n'a plus aucun « − / + » ;
     ③ la barre : un seul bouton principal ; « Annuler » / « Enregistrer » y sont tant qu'un brouillon existe, et leurs ancres
        de tuto passent au pied du panneau quand il est ouvert ;
     ④ la ligne d'état et la légende ne disent que ce que le modèle contient ;
     ⑤ le panneau : une fenêtre à la coque commune, la saison (sa grille, ANNEE-3), la semaine, les contrôles ; fermé, il se
        vide ; la feuille le pose à droite dès 768 px et suit les animations réduites ;
     ⑥ un brouillon garde son année (la garde du rendu, la flèche de l'année refusée) ;
     ⑦ chaque ancre « plan.annee.* » qu'un tuto touche existe.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { texteTutosDepot } from './mv-tutos-sources.mjs';   // ★ COULEUR-1 (§625) : le moteur des tutos et ses listes par module
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
// ANNEE-3 (§614) : la vue et son panneau vivent dans planning-annee-vue.js. Les deux fichiers sont lus ensemble, leurs ponts
//   (function X(){ return window.X.apply(…) }) retirés : chaque fonction n'y est qu'une fois, la vraie.
const sansPonts = (t) => t.replace(/^function (\w+)\(\)\{ return window\.\1\.apply\(null, arguments\); \}$/gm, '');
const S0 = { pl: lire('src/planning.js'), ann: sansPonts(lire('src/planning-annee.js')) + '\n' + sansPonts(lire('src/planning-annee-vue.js')), mod: lire('src/planning-modeles.js'), css: lire('src/annee.css'), sty: lire('src/styles.css'), app: lire('src/' + 'app' + '.js'), tu: texteTutosDepot(), html: lire('index.html') };

function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const ligneVar = (src, nom) => { const m = new RegExp('^var ' + nom + '=.*$', 'm').exec(src); if (!m) throw new Error('VAR ABSENTE : ' + nom); return m[0]; };
const NOMS = ['_paH', '_paHm', '_paMinT', '_planAnneeSaison', '_planAnneeLire', '_planAnneeDate', '_planAnneePlage', '_planAnneeResumeTxt', '_planAnneeResumeAB',
  '_planAnneeCopie', '_planAnneePose', '_planAnneeGrille', '_planAnneeMeta', '_planAnneeMetaCopie', '_planAnneeSemDefaut', '_planAnneeSemSel', '_planAnneeCible', '_planAnneeTotal',
  '_planAnneeCleS', '_planAnneeNomsIx', '_planAnneeNoms', '_planAnneePriseSaison', '_planAnneeHoraire', '_planAnneeHorairesTxt', '_planAnneeReguliers',
  '_planAnneePasVal', '_planAnneeNomS', '_planAnneeRetouches', '_planAnneeSuggestions', '_planAnneeBrouillon',
  '_anvP', '_anvSom', '_anvRythme', '_anvParSem', '_anvCtx', '_anvRangs', '_anvBrouillonBtns', '_anvOutils', '_anvVue', '_anvLegende', '_anvEtat', '_anvSec',
  '_anvPanSaison', '_anvPanSemaine', '_anvPanCtl', '_anvPanJuste', '_anvPanJours', 'planAnneeAn',
  '_anvDec', '_anvHHMM', '_anvIso', '_anvMemeCel', '_anvCel', '_anvGrille', '_anvChoix', '_anvHeure', '_anvDebut', '_anvJourEd'];   // ANNEE-3 (§614) : la grille, son choix, ses champs

function monter(S, o) {
  const i0 = S.pl.indexOf('var PLAN_DEF = {'), j0 = S.pl.indexOf('};', i0);
  const PLAN_DEF = vm.runInNewContext('(' + S.pl.slice(i0 + 15, j0 + 1) + ')');
  const appels = [];
  const ctx = vm.createContext({ window: { PLAN_MOIS: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'], PLANNING_ENTRIES: {},
      _planYearList: () => [2026, 2027], planSetYear: (y) => appels.push('an:' + y), showToast: (m) => appels.push('toast') },
    _MV_FERIES_CACHE: {}, console, Date });
  ctx._an = o.an || 2026; ctx._nv = !!o.nv; ctx._E = o.E; ctx._plusBrut = o.plusBrut || 0;
  ctx._planGetTpl = (pl, y) => (pl === 'standard') ? PLAN_DEF.standard : {};
  const pre = 'function _paE(){return _E;}\nfunction _pY(){return _an;}\nfunction isAdmin(){return true;}\n'
    + 'function _planLegal(){return {maxJour:10,maxHebdo:48,maxMoy:44,modulMax:250,hebdoLeg:35,plafAnnuel:1607};}\n'
    + 'function _planBaseActive(){return _nv;}\nfunction _planBaseAttendue(){return 1600;}\nfunction _planCreditFerie(){return 0;}\n'
    + 'function _planModelBrut(id,yr,G){var t=0;for(var m=0;m<12;m++)for(var k in (G[m]||{}))t+=parseFloat(G[m][k])||0;return t+_plusBrut;}\n'
    + 'function _planMbrs(){return [];}\nfunction _planPlId(m){return m.planning_id||"standard";}\nfunction _planModeles(){return ["standard","mi-temps"];}\n'
    + 'function _planSolidJour(){return null;}\nfunction _escHtml(s){return String(s);}\nfunction _escAttr(s){return String(s).replace(/"/g,"&quot;");}\n'
    + 'function _mvInfoSet(){}\nfunction _mvInfoBtn(k){return "<button class=\\"mv-i\\" data-mvi=\\""+k+"\\"></button>";}\n'
    + 'function _planAnneeFerieSem(){return "[ferie]";}\nfunction _planAnneeFeriesBloc(){return "<div data-tuto=\\"plan.annee.feries.tous\\">[feries]</div>";}\nfunction _planAnneeSuivi(){return "[suivi]";}\n'
    + 'function _planRenderAnnee(){}\n';
  vm.runInContext(pre + fonction(S.pl, '_mvEasterMD') + '\n' + fonction(S.pl, '_feriesY') + '\n' + ligneVar(S.ann, 'PLAN_MOIS_FR') + '\n' + ligneVar(S.ann, 'ANV_OV') + '\n' + ligneVar(S.ann, 'ANV_CHOIX') + '\nwindow.PLAN_MOIS_FR=PLAN_MOIS_FR;\n'
    + NOMS.map((n) => fonction(S.ann, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};', ctx);
  return { F: ctx.f, ctx, appels };
}
const num = (s) => parseFloat(String(s).replace(/\u2212/g, '-').replace(/[\s\u00a0\u202f]/g, '').replace(/h(\d\d)$/, '.$1').replace('h', '')) || 0;
const hNum = (s) => { const t = String(s).replace(/[\s\u00a0\u202f]/g, ''); const m = /^([+\u2212-]?)(\d+)h(\d\d)?$/.exec(t); if (!m) return NaN; return (m[1] === '\u2212' || m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + (m[3] ? parseInt(m[3], 10) / 60 : 0)); };
const cellules = (h, att) => [...h.matchAll(new RegExp('data-anv="' + att + '"[^>]*>([^<]*)<', 'g'))].map((m) => m[1]);

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };

  // ① le compte
  essai('① 2026 : les lignes somment au pied de la colonne « total », qui vaut le compte (la bande)', () => {
    const { F } = monter(S, { E: { annee: 'standard' } }); const C = F._anvCtx({ annee: 'standard' }), h = F._anvVue(C);
    const lignes = cellules(h, 'p').map(hNum), pied = hNum(cellules(h, 'tan')[0]), tot = F._planAnneeTotal('standard', 2026, F._planAnneeGrille() || {});
    const som = lignes.reduce((a, b) => a + b, 0);
    return [lignes.length > 0 && Math.abs(som - pied) < 0.02 && Math.abs(pied - C.brut) < 0.02 && Math.abs(C.brut - tot) < 0.02, lignes.length + ' lignes, somme ' + som + ', pied ' + pied + ', compte ' + tot];
  });
  essai('① la base de l’année (2027) : la ligne des fériés porte les heures des fériés chômés ; la colonne fait toujours le compte', () => {
    const { F } = monter(S, { an: 2026, nv: true, plusBrut: 21, E: { annee: 'standard' } }); const C = F._anvCtx({ annee: 'standard' }), h = F._anvVue(C);
    const lignes = cellules(h, 'p').map(hNum), fe = hNum(cellules(h, 'fe')[0]), pied = hNum(cellules(h, 'tan')[0]);
    const som = lignes.reduce((a, b) => a + b, 0);
    return [Math.abs(fe - 21) < 0.02 && Math.abs(som + fe - pied) < 0.02 && Math.abs(pied - C.brut) < 0.02, 'fériés ' + fe + ', somme ' + som + ', pied ' + pied];
  });
  // ② les semaines, plus aucun « − / + » dans la vue
  essai('② une semaine = un bouton (ses heures), une seule ancre « semhit », celle de la semaine choisie', () => {
    const { F } = monter(S, { E: { annee: 'standard' } }); const C = F._anvCtx({ annee: 'standard' }), h = F._anvVue(C);
    const n = (h.match(/class="anv-wh" data-pan="w"/g) || []).length, a = (h.match(/data-tuto="plan\.annee\.semhit"/g) || []).length;
    return [n === C.A.sem.length && a === 1 && h.includes('data-w="' + C.sel + '" data-tuto="plan.annee.semhit"'), n + ' boutons pour ' + C.A.sem.length + ' semaines, ' + a + ' ancre(s)'];
  });
  essai('② la vue, la barre et la ligne d’état n’ont plus aucun « − / + »', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const C = F._anvCtx(E);
    const h = F._anvOutils(C) + F._anvVue(C) + F._anvEtat(C), pm = (h.match(/>\s*[\u2212+]\s*<\/button>/g) || []).length;
    return [pm === 0 && !/planAnneePas\(|planAnneeJour\(|planAnneePrise\(/.test(h), pm + ' « − / + »'];
  });
  // ③ la barre
  essai('③ sans brouillon : « Tomber juste » est le seul bouton principal', () => {
    const { F } = monter(S, { E: { annee: 'standard' } }); const h = F._anvOutils(F._anvCtx({ annee: 'standard' }));
    return [(h.match(/mvbtn-principal/g) || []).length === 1 && /mvbtn mvbtn-principal" data-tuto="plan\.annee\.juste"/.test(h) && !h.includes('planAnneeEnregistrer()'), h.slice(0, 200)];
  });
  essai('③ un brouillon, panneau fermé : « Annuler » et « Enregistrer » dans la barre, avec leurs ancres ; « Enregistrer » seul principal', () => {
    const E = { annee: 'standard', brouillon: { 0: {} } }; const { F: F2 } = monter(S, { E }); const C = F2._anvCtx(E), h = F2._anvOutils(C);
    return [h.includes('data-tuto="plan.annee.ann" onclick="planAnneeAnnuler()"') && h.includes('data-tuto="plan.annee.enr" onclick="planAnneeEnregistrer()"')
      && (h.match(/mvbtn-principal/g) || []).length === 1 && /mvbtn mvbtn-secondaire" data-tuto="plan\.annee\.juste"/.test(h), ''];
  });
  essai('③ … panneau ouvert : les ancres quittent la barre (le pied du panneau les porte)', () => {
    const E = { annee: 'standard', brouillon: { 0: {} }, pan: { t: 's', si: 0 } }; const { F } = monter(S, { E }); const h = F._anvOutils(F._anvCtx(E));
    return [h.includes('onclick="planAnneeEnregistrer()"') && !h.includes('data-tuto="plan.annee.enr"') && !h.includes('data-tuto="plan.annee.ann"')
      && F._anvBrouillonBtns(true).includes('data-tuto="plan.annee.enr"'), ''];
  });
  // ④ la ligne d'état, la légende
  essai('④ la légende ne montre que ce que la vue contient (semaine à part, fermé, A/B, au-dessus de 35 h) — « standard », puis une année toute simple', () => {
    const uni = {}; for (let m = 0; m < 12; m++) { uni[m] = {}; const nb = new Date(2026, m + 1, 0).getDate(); for (let d = 1; d <= nb; d++) { const g = new Date(2026, m, d).getDay(); if (g >= 1 && g <= 5) uni[m][d] = 7; } }
    const paires = [['anv-lg-ap', 'anv-bar-ap'], ['anv-lg-f', 'anv-bar-f'], ['anv-lg-ab', 'anv-bar-ab'], ['anv-lg-p', 'anv-wk-p'], ['anv-lg-cp', 'anv-cp']], faux = [];
    for (const E of [{ annee: 'standard' }, { annee: 'standard', brouillon: uni }]) { const { F } = monter(S, { E }); const C = F._anvCtx(E), v = F._anvVue(C), l = F._anvLegende(C);
      paires.forEach(([a, b]) => { if (l.includes(a + '"') !== v.includes(b + '"')) faux.push((E.brouillon ? 'simple:' : 'standard:') + a); }); }
    return [faux.length === 0, faux.join(', ')];
  });
  essai('④ la ligne d’état : le cadre, les fériés travaillés, « Personne ne suit », les jours à part, le brouillon', () => {
    const E = { annee: 'standard', brouillon: { 0: {} } }; const { F } = monter(S, { E }); const C = F._anvCtx(E), h = F._anvEtat(C);
    return [h.includes('data-tuto="plan.annee.cadre"') && h.includes('data-tuto="plan.annee.feries.ouvrir"') && h.includes('data-tuto="plan.annee.suivi.ouvrir"')
      && (C.A.jours.length ? h.includes('data-tuto="plan.annee.jours.ouvrir"') : !h.includes('jours.ouvrir')) && h.includes('Pas encore enregistr'), ''];
  });
  // ⑤ le panneau
  essai('⑤ la saison : sa grille (sept cases, l’ancre au vendredi), sa prise de poste en champ heure ; la liste des lundis à partir de la deuxième (ANNEE-3)', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const C = F._anvCtx(E);
    const a = F._anvPanSaison(C, 0), b = C.A.saisons.length > 1 ? F._anvPanSaison(C, 1) : null;
    return [!!a && (a.c.match(/class="anv-cel[^"]*" data-k="s"/g) || []).length === 7 && a.c.includes('data-g="4" data-tuto="plan.annee.cel"') && /type="time"[^>]*data-tuto="plan\.annee\.prise"/.test(a.c)
      && !/>\s*[\u2212+]\s*<\/button>/.test(a.c) && !a.c.includes('data-tuto="plan.annee.coupe"') && (!b || /<select[^>]*data-tuto="plan\.annee\.coupe"/.test(b.c)), C.A.saisons.length + ' saisons'];
  });
  essai('⑤ la semaine : ‹ et › en tête, ses 7 jours en rangées, fermer, changer le rythme (sa grille)', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const C = F._anvCtx(E), w = F._anvPanSemaine(C);
    return [!!w && w.nav.includes('data-tuto="plan.annee.sem"') && (w.c.match(/<div class="anv-jr/g) || []).length === 7 && /plan\.annee\.(fsem|rsem)/.test(w.c) && (w.c.match(/data-k="r"/g) || []).length === 7, ''];
  });
  essai('⑤ les contrôles : le cadre (cinq lignes et les dimanches), puis les fériés', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const c = F._anvPanCtl(F._anvCtx(E)).c;
    return [(c.match(/class="anv-ln"/g) || []).length === 6 && c.includes('[feries]'), ''];
  });
  T('⑤ le panneau est une fenêtre à la coque commune (.overlay > .modal, poignée, en-tête, corps) ; fermé, il se vide',
    /o\.className='overlay anv-ov'/.test(S.ann) && /'<div class="modal anv-pan" role="dialog" aria-modal="true" aria-labelledby="anv-pan-t"><div class="modal-handle"><\/div><div class="modal-hd anv-pan-h"/.test(S.ann)
    && S.ann.includes("['anv-pan-h','anv-pan-c','anv-pied'].forEach(function(i){var x=document.getElementById(i);if(x){x.innerHTML='';x._anv='';}});"));
  T('⑤ la feuille à part (src/annee.css, importée après frais.css ; styles.css est à son plafond) : à droite dès 768 px, le tableau dès 1 024 px, les animations réduites, aucune couleur en dur hors des replis',
    S.app.includes("import './frais.css';") && S.app.indexOf("import './annee.css';") > S.app.indexOf("import './frais.css';") && !S.sty.includes('.anv-') && S.css.includes('  .overlay.anv-ov{ align-items:stretch; justify-content:flex-end; }') && S.css.includes('@media (prefers-reduced-motion:reduce){ .anv-ov .anv-pan{ animation:none; } }')
    && /@media \(min-width:1024px\)\{\n  #page-planning \.anv-gn\{ --anv-lab:260px; --anv-num:176px; \}/.test(S.css)
    && (() => { const a = S.css.indexOf('★★ ANNEE-2 (§613)'), b = S.css.indexOf('/* ★ FIN ANNEE-2 */'); return a >= 0 && b > a && !/#[0-9a-fA-F]{3,6}\b/.test(S.css.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '').replace(/var\(--[\w-]+,[^()]*(\([^()]*\))?[^()]*\)/g, '')); })()
    && (S.css.match(/var\(--(?!anv-)[\w-]+\)/g) || []).length === 0);
  // ⑥ un brouillon garde son année
  T('⑥ le rendu : un brouillon d’une autre année ne se pose pas sur celle-ci (« Revenir en … », « Les abandonner »)',
    fonction(S.ann, '_planRenderAnnee').includes('if(E.brouillon&&E.an!=null&&E.an!==yr){') && fonction(S.ann, '_planRenderAnnee').includes('if(!E.brouillon)E.an=yr;'));
  essai('⑥ la flèche de l’année : refusée tant qu’un brouillon existe, sinon elle change l’année', () => {
    const a = monter(S, { E: { annee: 'standard', brouillon: { 0: {} } } }); a.F.planAnneeAn({ dataset: { y: '2027' } });
    const b = monter(S, { E: { annee: 'standard' } }); b.F.planAnneeAn({ dataset: { y: '2027' } });
    return [a.appels.join() === 'toast' && b.appels.join() === 'an:2027', a.appels.join() + ' | ' + b.appels.join()];
  });
  // ⑦ les ancres des tutos
  const ancres = [...new Set([...S.tu.matchAll(/data-tuto="(plan\.annee\.[\w.]+)"/g)].map((m) => m[1]))];
  const sources = S.ann + S.mod + S.html;
  const manquent = ancres.filter((a) => !sources.includes('data-tuto="' + a + '"') && !sources.includes("data-tuto=\\\"" + a + "\\\""));
  T('⑦ chaque ancre « plan.annee.* » qu’un tuto touche existe (' + ancres.length + ')', ancres.length >= 20 && manquent.length === 0, manquent.join(', '));
  T('⑦ la bande suit le brouillon (la carte ne répète plus le compte)', fonction(S.ann, '_planRenderAnnee').includes("sb.innerHTML=_planAnneeBande();") && !fonction(S.ann, '_planRenderAnnee').includes('L\\u2019ann\\u00e9e du mod\\u00e8le'));
  return out;
}

if (!CONTRE) {
  console.log('\n── ANNEE-2 — Planning › Année, la vue refaite\n');
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['une saison ne compte plus ses heures', sur('ann', "if(a<0)a=x.i;b=x.i;t+=x.h;}});if(a<0)return;\n    R.push(", "if(a<0)a=x.i;b=x.i;}});if(a<0)return;\n    R.push(")],
    ['les fériés chômés quittent la colonne (2027)', sur('ann', 'var fe=(C.nv&&C.brut-C.tot>0.05)?C.brut-C.tot:0;', 'var fe=0;')],
    ['un « + » revient dans la ligne d’état', sur('ann', "return h+_anvLegende(C)+'</div>';}", "return h+'<button>+</button>'+_anvLegende(C)+'</div>';}")],
    ['chaque semaine porte l’ancre du tuto', sur('ann', "(k===C.sel?' data-tuto=\"plan.annee.semhit\"':' tabindex=\"-1\"')", "' data-tuto=\"plan.annee.semhit\"'")],
    ['la barre garde les ancres, panneau ouvert', sur('ann', 'if(br)ac+=_anvBrouillonBtns(!pan);', 'if(br)ac+=_anvBrouillonBtns(true);')],
    ['la légende montre une semaine à part absente', sur('ann', "if(A.sem.some(function(s){return s.apart;}))L.push(", "if(true)L.push(")],
    ['le brouillon se pose sur une autre année', sur('ann', 'if(E.brouillon&&E.an!=null&&E.an!==yr){', 'if(false){')],
    ['la flèche de l’année ignore le brouillon', sur('ann', "if(E&&E.brouillon){if(window.showToast)window.showToast('Enregistrez ou annulez", "if(false){if(window.showToast)window.showToast('Enregistrez ou annulez")],
    ['le panneau ne se pose plus à droite', sur('css', '  .overlay.anv-ov{ align-items:stretch; justify-content:flex-end; }\n', '')],
    ['une ancre de tuto renommée', sur('ann', ":r.si===1?' data-tuto=\"plan.annee.saison2\"'", ":r.si===1?' data-tuto=\"plan.annee.saisonX\"'")],
    ['fermé, le panneau garde ses boutons', sur('ann', "['anv-pan-h','anv-pan-c','anv-pied'].forEach(function(i){var x=document.getElementById(i);if(x){x.innerHTML='';x._anv='';}});", '')],
    ['une couleur écrite en dur dans le bloc', sur('css', '#page-planning .anv-wk-p{ background:var(--anv-plus); }', '#page-planning .anv-wk-p{ background:#C9A35A; }')],
    ['un jeton du socle sans repli', sur('css', '#page-planning .anv-wk{ position:absolute; bottom:6px; border-radius:2px 2px 0 0; background:var(--anv-sable); }', '#page-planning .anv-wk{ position:absolute; bottom:6px; border-radius:2px 2px 0 0; background:var(--or); }')],
    ['la feuille revient dans styles.css', sur('sty', '/* ★ FIN GABARIT-1 */', '#page-planning .anv-wk{ display:block; }\n/* ★ FIN GABARIT-1 */')],
  ];
  let ok = 0;
  for (const [n, f] of mutants) { let rouge = false, d = ''; try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { d = e.message; }
    if (rouge) ok++; console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit' : '\x1b[31m✗\x1b[0m NE ROUGIT PAS') + ' : ' + n + (d ? ' (' + d + ')' : '')); }
  console.log('\n' + (ok === mutants.length ? '\x1b[32mVERT\x1b[0m — ' + ok + '/' + mutants.length + ' contre-épreuves rougissent' : '\x1b[31mROUGE\x1b[0m — ' + (mutants.length - ok) + ' contre-épreuve(s) muette(s)'));
  process.exit(ok === mutants.length ? 0 : 1);
}
