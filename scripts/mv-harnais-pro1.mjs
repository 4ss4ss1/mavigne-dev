// ── PRO-1 (§269) — LA BARRE LATÉRALE, LE COCKPIT, LA CONSOMMATION MESURÉE ─────────────────────────────────────────
//   node scripts/mv-harnais-pro1.mjs           → doit être vert
//   node scripts/mv-harnais-pro1.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (08/10) : « certains boutons ne fonctionnent pas (priorité, agrandir) », « la présentation de consommation ne fait
//   pas pro du tout », « sur PC la barre latérale n'est pas bien automatisée, le reste de l'écran est cassé quand elle
//   n'est pas pliée ». Ce harnais tient chacune des causes trouvées. Il EXÉCUTE ce qui se calcule (le pas des graduations,
//   la carte de consommation) et lit le reste sur le texte : une mise en page se regarde (captures du §269), elle ne se
//   prouve pas ici.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { vue: L('src/cockpit-vue.js'), pil: L('src/pilotage.js'), css: L('src/styles.css'), coq: L('src/coquille.js') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };

function conso(S, cas) {
  const ctx = { Math, Number, String, Array, Object, JSON, isFinite, _PIL_GM_MIN_IV: 2, _PIL_GM_MIN_H: 10,
    _ecoCfg: () => ({ conso: 6 }), _pilNum: n => String(Math.round(Number(n) || 0)),
    _pilGmFr: (v, d) => (Number(v) || 0).toFixed(d == null ? 1 : d).replace('.', ','),
    _pilEsc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    _pilStat: (v, u) => '<span class="st">' + v + u + '</span>', _pilTile: (id, c, t, st, sub, x, body) => '<div class="tuile">' + st + '<p>' + sub + '</p>' + body + '</div>',
    _pilGmConso: tid => JSON.parse(JSON.stringify(cas[tid])) };
  vm.createContext(ctx); vm.runInContext(fnDe(S.pil, 'function _pilPanelConso(d){'), ctx);
  return ctx._pilPanelConso({ tracs: Object.keys(cas).map(id => ({ id, nom: id.toUpperCase() })) });
}
const VIDE = { iv: [], L: 0, H: 0, Hc: 0, nOk: 0, nEc: 0, nSans: 0, lh: null, ok: false };
function jouer(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  // ① Le squelette du cockpit : plus de balise cassée ni de texte parasite, des balises équilibrées
  const i = S.vue.indexOf('window._ck2Squelette'), sq = S.vue.slice(i, S.vue.indexOf('};', i));
  T('le squelette n’a plus la balise cassée « <d<div » ni le texte parasite', !sq.includes('<d<div') && !sq.includes("\\'"));
  T('le squelette ouvre autant de <div> qu’il en ferme', (sq.match(/<div[ >]/g) || []).length === (sq.match(/<\/div>/g) || []).length);
  T('une seule bulle de courbe (id « ck-tip ») dans tout le module', (S.vue.match(/id="ck-tip"/g) || []).length === 1);
  // ② Les boutons
  T('« Changer la priorité » ouvre le choix de la priorité (data-fn « priorite » → openPriorityEdit)',
    S.vue.includes(`data-fn="priorite">' + (pr.mode === 'choix' ? 'Choisir la priorité' : 'Changer la priorité')`)
    && /fn\.dataset\.fn === 'priorite'\) \{\s*if \(typeof window\.openPriorityEdit === 'function'\) window\.openPriorityEdit\(\);/.test(S.vue) && !S.vue.includes('data-onglet="dec"'));
  T('« Agrandir » agit (plus d’instruction vide)', S.vue.includes("if (fn && fn.dataset.fn === 'agrandir') { agrandir(true); return; }") && !S.vue.includes('i2 >= 0) {}'));
  T('l’objectif se règle (plus de message de démonstration)', !S.vue.includes('data-toast=') && S.vue.includes('data-fn="objectif"')
    && S.pil.includes('window._pilObjectifRegler=function(iso){') && S.pil.includes('if(!_pilObjectifSet(iso)) return false;'));
  T('« Voir le détail » mène à la tension par personne, qui existe dans L’équipe', S.vue.includes('data-fn="tension"')
    && S.pil.includes("if(cible==='tension'){") && /function _pilTabPrs\(d\)\{[\s\S]*?_pilCardTension\(d\)[\s\S]*?id="pil-tension-det"/.test(S.pil));
  T('la protection restante vit dans Conformité', /function _pilTabCfm\(d\)\{[^]*?_pilProtCarte\(\)/.test(S.pil.slice(S.pil.indexOf('function _pilTabCfm(d){'), S.pil.indexOf('function _pilTabCfm(d){') + 900)));
  // ③ Le modèle : la tâche du moment lue avec la période et les tâches, par le même appel que la tuile
  const mod = fnDe(S.pil, 'function _pilCk2Modele(d, m){');
  T('le cockpit lit la tâche du moment par _pilPrioDuJour, jamais par l’appel nu', mod.includes('PP=_pilPrioDuJour(d).M;') && !mod.includes('_mvTacheDuMoment()') && !/tm\.nom\|\|tm\.tache/.test(mod));
  T('la fenêtre de traitement arrive en DONNÉES (le cockpit la dessine)', mod.includes('fen:TR.fen||null') && !mod.includes('bande:tx(TR.ban)'));
  // ④ La surveillance de largeur : rien ne plante quand le cockpit a quitté l'écran
  T('ranger() cesse de surveiller une page disparue', S.vue.includes("if (!pg) { if (obs) { obs.disconnect(); obs = null; } return; }") && S.vue.includes('obs = new ResizeObserver(() => rangerBientot());'));
  T('les graphes suivent toute nouvelle largeur, une fois posée', S.vue.includes("clearTimeout(redimT); redimT = setTimeout(() => { if ($('#ck-page')) { redimCourbe(false); redimEChart(false); } }, 140);"));
  // ⑤ La courbe : pas rond exécuté, plus de mois retiré en dur, la zone mesurée part de la première photo
  const ctx = {}; vm.createContext(ctx); vm.runInContext(fnDe(S.vue, 'function pasNet(max, n) {').replace('function pasNet', 'this.pasNet = function'), ctx);
  T('les graduations prennent un pas rond qui suit le volume (2 472 h → 500 ; étroit → 1 000 ; 180 h → 50)',
    ctx.pasNet(2472, 5) === 500 && ctx.pasNet(2472, 3) === 1000 && ctx.pasNet(180, 4) === 50 && ctx.pasNet(0, 4) > 0);
  T('aucun mois n’est retiré en dur', !S.vue.includes("l === 'mars'"));
  T('la zone « reste mesuré » part de la première photo', S.vue.includes("'M' + f1(pts[0][0]) + ' ' + f1(y0) + 'L' + ligne.slice(1)") && !S.vue.includes("'L' + f1(c.X(DEBUT)) + ' ' + f1(y0) + 'Z'"));
  // ⑥ La feuille : la barre a la largeur qui lui est réservée, plus de marge négative doublée
  T('la barre latérale compte ses marges dans sa largeur (box-sizing)', S.css.includes('.mv-rail,.mv-rail *,.mv-rail *::before,.mv-rail *::after{box-sizing:border-box}'));
  T('la flèche « Réduire » a une taille (plus de grand triangle noir)', /\.mv-rail-plier svg\{[^}]*width:20px;height:20px;fill:none/.test(S.css));
  T('aucune marge négative doublée (« --16px ») dans la feuille', !/(?<![\w-])--\d+(?:\.\d+)?px/.test(S.css));
  // ⑦ La coquille : les onglets lus dans _PIL_TABS, un redimensionnement seulement quand l'état change
  // §34g : on lit le CODE — le commentaire qui raconte la correction cite les anciens noms.
  const coqCode = S.coq.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');
  T('Ctrl K lit les onglets dans _PIL_TABS (plus « Simuler » ni « L’équipe et les tâches »)', coqCode.includes('const T = window._PIL_TABS;') && !coqCode.includes("'Simuler'") && !coqCode.includes('L’équipe et les tâches'));
  T('plier la barre prévient les écrans, une fois, et seulement si l’état change', S.coq.includes('if (avant !== !!on) apresBascule();') && S.coq.includes("window.dispatchEvent(new Event('resize'))"));
  T('un dépliage fait à la main tient malgré la reconstruction de la barre', S.coq.includes('if (manuel !== null) return manuel;') && S.coq.includes('if (garder) manuel = !!on;'));
  // ⑧ La consommation mesurée, exécutée
  const P0 = conso(S, { a: VIDE, b: VIDE, c: VIDE });
  T('sans aucun plein mesurable : une phrase, et ni piste ni échelle', P0.includes('pil-cso-msg') && P0.includes('pil-cso compact') && (P0.match(/pil-cso-r sans/g) || []).length === 3);
  T('plus la ligne trois fois répétée « pas assez de pleins : réglage … utilisé »', !/pas assez de pleins : réglage/.test(P0));
  const mes = { iv: [{ d: '2026-09-20', l: 60, h: 8, lh: 7.5 }, { d: '2026-10-01', l: 70, h: 9, lh: 7.78 }], L: 130, H: 17, Hc: 12, nOk: 2, nEc: 0, nSans: 0, lh: 130 / 17, ok: true };
  const P1 = conso(S, { a: mes, b: VIDE });
  const cxRegl = (P1.match(/<line x1="([\d.]+)%" x2="\1%" y1="1" y2="23" class="g"\/>/) || [])[1];
  const lab6 = (P1.match(/<span style="left:([\d.]+)%">6<\/span>/) || [])[1];
  T('l’échelle tombe sous les traits : le « 6 » est posé là où est le trait du réglage', cxRegl != null && cxRegl === lab6);
  T('la mesure s’écrit sur une ligne (valeur et unité liées), le tracteur non mesuré dit son réglage', /<b>7,6<\/b>\u00a0L\/h/.test(P1) && /réglage 6,0\u00a0L\/h/.test(P1) && !P1.includes('compact'));
  T('aucun undefined / NaN', !/undefined|NaN/.test(P0 + P1));
  // ⑨ La vue Économie : le coût de l'heure arrondi (« 21.27848101265823 € »), pas de « 0 € sous le budget »
  T('vue Économie : le coût de l’heure s’écrit arrondi, et un budget tenu se dit « dans le budget »',
    !S.vue.includes("' h réelles, à ' + TAUX + '") && S.vue.includes("Math.abs(r.sous) < 100 ? 'Dans le budget de '"));
  return out;
}

const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la balise cassée revient dans le squelette', 'vue', '<div class="ck-sr" id="ck-annonce"', "<d<div class=\"ck-tip\" id=\"ck-tip\"></div>\\'; <div class=\"ck-sr\" id=\"ck-annonce\""],
    ['« Changer la priorité » renvoie vers un onglet', 'vue', 'data-fn="priorite">', 'data-onglet="dec">'],
    ['« Agrandir » rebranché sur une instruction vide', 'vue', "if (fn && fn.dataset.fn === 'agrandir') { agrandir(true); return; }", "if (fn && fn.dataset.fn === 'agrandir') { const i2 = 0; if (i2 >= 0) {} return; }"],
    ['le cockpit lit la tâche du moment par l’appel nu', 'pil', 'PP=_pilPrioDuJour(d).M;', 'PP=window._mvTacheDuMoment();'],
    ['ranger() plante sur une page disparue', 'vue', "if (!pg) { if (obs) { obs.disconnect(); obs = null; } return; }", ''],
    ['le pas des graduations redevient fixe', 'vue', "return (q <= 1 ? 1 : q <= 2 ? 2 : q <= 2.5 ? 2.5 : q <= 5 ? 5 : 10) * p;", 'return 500;'],
    ['la zone mesurée repart du début de la période', 'vue', "'M' + f1(pts[0][0]) + ' ' + f1(y0) + 'L' + ligne.slice(1)", "ligne + 'L' + f1(c.X(DEBUT)) + ' ' + f1(y0) + 'Z' + ''"],
    ['la barre perd box-sizing (269 px pour 244)', 'css', '.mv-rail,.mv-rail *,.mv-rail *::before,.mv-rail *::after{box-sizing:border-box}', '.mv-rail-x{box-sizing:border-box}'],
    ['une marge doublée revient', 'css', '.ck-carte{position:relative;margin:0 -16px;', '.ck-carte{position:relative;margin:0 --16px;'],
    ['Ctrl K repropose « Simuler »', 'coq', "['sim', 'Décider']", "['sim', 'Simuler']"],
    ['l’échelle de la consommation répartie à la largeur du texte', 'pil', "ax+='<span style=\"left:'+pc(k)+'\">'", "ax+='<span>'"],
    ['le coût de l’heure redevient brut (quatorze décimales)', 'vue', "' h réelles, à ' + Number(TAUX || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '", "' h réelles, à ' + TAUX + '"],
    ['la tension par personne quitte L’équipe', 'pil', "if(_tc) H+='<div class=\"pil-tension-det\" id=\"pil-tension-det\">'+_tc+'</div>';", ''],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length < 2) { console.log('  ??  ancre introuvable : ' + nom); manques++; return; }
    S[f] = S[f].split(a).join(b);
    let rouge; try { rouge = jouer(S).some(x => !x[1]); } catch (e) { rouge = true; }
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
