#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
//  FORME-1 (§301) — LE DOMAINE EN DIRECT AUX FORMES RÉELLES
//  Exécute le VRAI moteur des formes (utils.js), la VRAIE lecture du journal (cockpit.js), le VRAI modèle du cockpit
//  (_pilCk2Modele, pilotage.js) et la VRAIE mise en page du plan (cockpit-vue.js) ; lit sur le texte les gestes,
//  la fiche et la feuille de style.
//    node scripts/mv-harnais-forme1.mjs [--contre]
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RAC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(RAC, f), 'utf8');
const CONTRE = process.argv.includes('--contre');
const SRC0 = { uti: L('src/utils.js'), ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), vue: L('src/cockpit-vue.js'),
  coq: L('src/coquille.js'), app: L('src/app.js'), html: L('index.html'), css: L('src/styles.css') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const blocDe = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloc introuvable : ' + a); return s.slice(i, j); };
const J0 = new Date(), iso = k => { const d = new Date(J0.getFullYear(), J0.getMonth(), J0.getDate() + k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ord = k => Math.round((Date.UTC(J0.getFullYear(), J0.getMonth(), J0.getDate() + k) - Date.UTC(2026, 0, 1)) / 864e5);
// Un rectangle de w mètres (vers l'est) sur h (vers le nord), à la latitude de Gevrey, fermé comme dans un KML.
const LAT0 = 47.2265, LNG0 = 4.9655, KX = 111320 * Math.cos(LAT0 * Math.PI / 180);
const pt = (x, y) => [LAT0 + y / 110540, LNG0 + x / KX];
const rect = (w, h, x = 0, y = 0) => [pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h), pt(x, y)];
const equerre = () => [pt(0, 0), pt(60, 0), pt(60, 15), pt(15, 15), pt(15, 60), pt(0, 60), pt(0, 0)];

function moteurFormes(S) {
  const ctx = { Math, Object, String, Array, Number, isFinite, JSON, KML_POLYGONS_DYNAMIC: [{ name: 'Les Crais 2', pts: rect(100, 20) }] };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(blocDe(S.uti, "/* ★ FORME-1 (§301) — LA FORME D'UNE PARCELLE", '/* ★ FIN FORME-1 */'), ctx);
  return ctx;
}
function lecture(S) {
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(S.ck, ctx); return ctx;
}
function modele(S, geoStub) {
  const P = [{ nom: 'Les Crais 1', surface: .41, appellation: 'Gevrey-Chambertin', commune: { nom: 'Gevrey-Chambertin', lat: 47.22, lng: 4.96 }, statut: 'Active' },
    { nom: 'Les Crais 2', surface: .38, appellation: 'Gevrey-Chambertin', commune: { nom: 'Gevrey-Chambertin', lat: 47.22, lng: 4.96 }, statut: 'Active' },
    { nom: 'Les Charmes', surface: .36, appellation: 'Côte de Nuits-Villages', commune: { nom: 'Brochon', lat: 47.24, lng: 4.97 }, statut: 'Active' }];
  const hex = t => Math.floor(t).toString(16), now = Date.now();
  // Les Crais 2 commencée HIER par Hugo et Léa, pas validée ; Les Charmes commencée puis validée aujourd'hui.
  const JOURNAL = [{ id: hex(now - 864e5), date: iso(-1), parcelle: 'Les Crais 2', tache: 'Taille', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'], statut: 'En cours' },
    { id: hex(now - 6e4 * 10), date: iso(0), parcelle: 'Les Charmes', tache: 'Taille', qui: 'Jean', statut: 'En cours' },
    { id: hex(now - 6e4 * 6), date: iso(0), parcelle: 'Les Charmes', tache: 'Taille', qui: 'Jean', statut: 'Validé' }];
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx;
  Object.assign(ctx, { PARCELLES: P, JOURNAL, MEMBRES: [], PLANNING_ENTRIES: {}, METEO_HOURLY: null, METEO_DAILY: null,
    tNom: n => n, _mvToday: () => iso(0),
    _mvTacheDuMoment: o => (o && Array.isArray(o.noms) && typeof o.fini === 'function')
      ? { mode: 'dates', taches: ['Taille'], items: [], dates: { Taille: { debut: iso(-40), fin: iso(47) } }, retard: {} }
      : { mode: 'aucune', taches: [], items: [], dates: {}, retard: {} } });
  if (geoStub) ctx._mvParcContours = n => (n === 'Les Crais 2' ? [rect(100, 20)] : []);
  vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  vm.runInContext(fnDe(S.pil, 'function _pilEtatEntree(e){') + "window._mvEnContratLe = window._mvEnContratLe || function(){ return true; };\n" + fnDe(S.pil, 'function _pilPhotoIso(dt){') + fnDe(S.pil, 'function _pilPrevuLe(m, dt){') + fnDe(S.pil, 'function _pilJourDomaine(dt){') + fnDe(S.pil, 'function _pilMembresActifs(ds){') +    /* AUJ-5 (§307) : le modèle lit le planning (jours travaillés) */ fnDe(S.pil, 'function _pilPrioDuJour(d){') + fnDe(S.pil, 'function _pilCk2Modele(d, m){') + `
    function _pilFmtD(s){ return String(s || ''); }
    function _rfCd(){ return { taskWindows: [{ nom:'Taille', ws:${ord(-40)}, we:${ord(48)} }] }; }
    function _pilRetards(){ return {}; }
    function _pilTensData(){ return { rows: [], nRouge:0, nSeuil:0 }; }
    function _pilPhotoListe(){ return []; }
    function _pilTraiterCalc(){ return { big:'Pas aujourd’hui', rai:'Hors saison', ban:'' }; }
    function _pilDiag(){ return []; }
    function _pilGainsProlong(){ return {}; }
    function _pilMargeCalc(){ return { fin:null, obj:null, marge:0 }; }
    this.__V = _pilCk2Modele({ data: [{ nom:'Taille', pct:40, h_done:300, h_total:706, surf_total:1.15 }], totalReste:400, totalTotal:706, hDone:300, gaugePct:40,
      saison:{ nom:'Hiver' }, presences:[{ nom:'Hugo', etat:'present' }], tracs:[] }, { obj:new Date(Date.now()+48*864e5), proj:new Date(Date.now()+43*864e5), marge:5, cadH:35 });`, ctx);
  return ctx.__V;
}
function plan(S, W, U) {
  const ctx = { Math, Object, String, Array, Number, isFinite, JSON, Set };
  ctx.window = { _mvFormeDe: U._mvFormeDe, _mvAvale: () => {} };
  vm.createContext(ctx);
  vm.runInContext('var PARCS = [], APPS = [], HA_VIGNE = 0, PLAN_W = 0, PLAN_H = 0, PLAN_S = 1, PLAN_LARG = 0;\nconst f1 = v => v.toFixed(1); const haTxt = v => v.toFixed(2) + " ha";\n'
    + blocDe(S.vue, '/* ★ FORME-1 (§301) — LE PLAN AUX FORMES RÉELLES, COMPACT.', 'function charger(v) {')
    + `
    preparerParcs([
      { nom: 'Lanière', ha: .2, appellation: 'Gevrey-Chambertin', commune: { nom: 'Gevrey-Chambertin' }, geo: [${JSON.stringify(rect(100, 20))}] },
      { nom: 'Équerre', ha: .19, appellation: 'Gevrey-Chambertin', commune: 'Brochon', geo: [${JSON.stringify(equerre())}] },
      { nom: 'Bloc', ha: .9, appellation: 'Bourgogne', commune: 'Gevrey-Chambertin', geo: [${JSON.stringify(rect(90, 100, 300, 50))}] },
      { nom: 'Sans contour', ha: .25, appellation: 'Bourgogne', commune: 'Gevrey-Chambertin', geo: [] },
      { nom: 'Arrachée', ha: .3, appellation: 'Bourgogne', commune: 'Gevrey-Chambertin', arr: true, geo: [${JSON.stringify(rect(60, 50))}] } ]);
    disposer(${W});
    this.__P = { PARCS, APPS, PLAN_W, PLAN_H, PLAN_S, C: mesuresPlan(${W}).C };`, ctx);
  return ctx.__P;
}
const recouvre = (a, b) => a[0] < b[0] + b[2] - .5 && b[0] < a[0] + a[2] - .5 && a[1] < b[1] + b[3] - .5 && b[1] < a[1] + a[3] - .5;

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  // ① Le moteur des formes (utils.js)
  const U = moteurFormes(S);
  const F = U._mvFormeDe([rect(100, 20)]);
  T('un contour [lat, lng] devient sa forme en mètres : 100 × 20 m, 2 000 m², point de fermeture du KML retiré',
    F && Math.abs(F.w - 100) < .5 && Math.abs(F.h - 20) < .3 && Math.abs(F.aire - 2000) < 25 && F.rings[0].length === 4);
  T('nord en haut, sans rotation : la longueur reste est-ouest, les rangs suivent la longueur', F && (F.ang < 1 || F.ang > 179) && U._mvFormeAngle(F.ang) === 90);
  T('moins de trois points, ou rien : pas de forme', U._mvFormeDe([[pt(0, 0), pt(5, 5)]]) === null && U._mvFormeDe([]) === null && U._mvFormeDe(null) === null);
  const E = U._mvFormeDe([equerre()]);
  T('une parcelle en équerre : l’équipe se pose DANS la parcelle (pas au centre de son cadre, qui est dehors)', E && U._mvFormeDedans(E.pole.x, E.pole.y, E.rings) && !U._mvFormeDedans(E.w * .7, E.h * .7, E.rings));
  T('les contours se trouvent par le nom, sans tenir compte de la casse', U._mvParcContours('LES CRAIS 2').length === 1 && U._mvParcContours('Les Crais 1').length === 0);
  const svg = U._mvFormeSvg(F, 300, 150, { etat: 'cours', id: 'x' });
  T('la forme en grand : son état, ses rangs dans la longueur, une échelle ronde en mètres', svg.includes('class="mv-fo et-cours"') && svg.includes('rotate(90)') && svg.includes('20\u202fm') && svg.includes('id="x-r"'));
  T('sans contour, la fiche ne dessine rien', U._mvFormeSvg(null, 300, 150) === '' && U._mvParcFormeHtml('Inconnue') === '');
  // ② Une lecture du journal pour l'état ET pour l'équipe (cockpit.js)
  const W = lecture(S);
  const parcs = [{ nom: 'A' }, { nom: 'B' }, { nom: 'C' }, { nom: 'D', statut: 'Arrachee' }];
  const J = [{ date: '2027-01-10', parcelle: 'A', tache: 'Taille', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'], statut: 'En cours' },
    { date: '2027-01-11', parcelle: 'B', tache: 'Taille', qui: 'Jean', statut: 'En cours' }, { date: '2027-01-11', parcelle: 'B', tache: 'Taille', qui: 'Jean', statut: 'Validé' },
    { date: '2027-01-05', parcelle: 'C', tache: 'Taille', qui: 'Jean', statut: 'Validé' }, { date: '2027-01-11', parcelle: 'C', tache: 'Taille', qui: 'Jean', statut: 'En cours' }];
  const et = W._ckPlanEtats(parcs, J, 'Taille', '2027-01-01', false), deb = W._ckPlanDebuts(parcs, J, 'Taille', '2027-01-01');
  T('l’état ne change pas : en cours, faite, faite (un début après une validation ne la défait pas), arrachée', et.A === 'cours' && et.B === 'faite' && et.C === 'faite' && et.D === 'arr');
  T('chaque parcelle en cours a sa ligne de début — même commencée un autre jour —, et seulement elles', Object.keys(deb).join() === 'A' && deb.A.date === '2027-01-10' && deb.A.qui === 'Hugo');
  // ③ Le modèle du cockpit (pilotage.js)
  const V = modele(S, true);
  T('l’équipe d’une parcelle commencée HIER est sur le plan, avec le jour du début', V.equipes.length === 1 && V.equipes[0].parcelle === 'Les Crais 2' && V.equipes[0].noms === 'Hugo et Léa' && V.equipes[0].depuis === iso(-1));
  T('une parcelle commencée puis validée ne garde pas d’équipe', !V.equipes.some(e => e.parcelle === 'Les Charmes'));
  T('la commune part en toutes lettres (plus d’objet { nom, lat, lng } : « [object Object] »)', V.parcs.every(p => typeof p.commune === 'string') && V.parcs[2].commune === 'Brochon');
  T('le contour part avec la parcelle', V.parcs[1].geo.length === 1 && V.parcs[0].geo.length === 0);
  // ④ La mise en page du plan (cockpit-vue.js)
  const Pp = plan(S, 640, U), Pt = plan(S, 360, U);
  const avecF = Pp.PARCS.filter(p => p.f);
  T('UNE échelle pour tout le domaine : chaque forme garde ses mètres × la même échelle', avecF.length === 4 && avecF.every(p => Math.abs(p.box[2] / p.f.w - Pp.PLAN_S) < 1e-6 && Math.abs(p.box[3] / p.f.h - Pp.PLAN_S) < 1e-6));
  const lan = Pp.PARCS.find(p => p.nom === 'Lanière');
  T('une lanière de 100 × 20 m reste une lanière (5 pour 1), nord en haut', lan && Math.abs(lan.box[2] / lan.box[3] - 5) < .05);
  T('aucune parcelle n’en recouvre une autre, toutes tiennent dans la largeur', Pp.PARCS.every((a, i) => Pp.PARCS.every((b, j) => i === j || !recouvre(a.box, b.box))) && Pp.PARCS.every(p => p.box[0] >= -.01 && p.box[0] + p.box[2] <= 640.01));
  T('sans contour : un carré de sa surface (0,25 ha → 50 m de côté)', (() => { const q = Pp.PARCS.find(p => p.nom === 'Sans contour'); return q && !q.f && Math.abs(q.box[2] - 50 * Pp.PLAN_S) < .01 && q.d.includes('A'); })());
  T('la commune est lue en toutes lettres, même rangée en objet', Pp.PARCS.find(p => p.nom === 'Lanière').commune === 'Gevrey-Chambertin');
  T('au téléphone : une colonne, tout tient dans la largeur, sans défilement de côté', Pt.C === 1 && Pt.PLAN_W === 360 && Pt.PARCS.every(p => p.box[0] + p.box[2] <= 360.01));
  // ⑤ Les gestes, la fiche, la feuille (lus sur le texte)
  T('toucher une parcelle du plan ouvre SA fiche (openDP), plus jamais la feuille d’une tâche',
    S.vue.includes("function ouvrirFeuille(pid) { const p = PIDX[pid]; if (p && !p.arr) { cacherLoupe(); if (typeof window.openDP === 'function') window.openDP(p.nom); } }") && !S.vue.includes('window.openSelParc'));
  T('Ctrl K ouvre la fiche de la parcelle choisie', S.coq.includes("if (x.go.parc) { if (typeof window.openDP === 'function') window.openDP(x.go.parc); return; }") && !S.coq.includes('window.openSelParc'));
  T('le plan se dessine à la largeur réelle, au montage et quand la largeur change', S.vue.includes('cacherLoupe(); monter(); brancherPlan(); ranger(); dessinerPlan(true);')
    && S.vue.includes("redimPlanT = setTimeout(() => { if ($('#ck-page')) dessinerPlan(false); }, 140);") && S.vue.includes("const pX = p => (p.cx / PLAN_W * 100) + '%';"));
  T('les gestes du plan sont délégués à la carte (ils survivent au redessin)', /function brancherPlan\(\) \{[\s\S]*?const carte = \$\('#ck-carte'\);[\s\S]*?carte\.addEventListener\('click'/.test(S.vue));
  T('la fiche (téléphone) et la fiche de droite (ordinateur) montrent la forme ; la commune s’écrit en toutes lettres',
    S.app.includes("_dpf.innerHTML=_dph; _dpf.hidden=!_dph;") && S.app.includes("window._mvParcFormeHtml(p.nom,520,170,'pfxf')") && S.app.includes("(p.commune&&typeof p.commune==='object')?p.commune.nom:p.commune")
    && /id="ovParcelle"[\s\S]{0,6000}id="dp-forme"/.test(S.html));
  T('la feuille : le plan sans largeur minimale ni défilement, la loupe, la forme des fiches', S.css.includes('.ck2 .ck-carte-in{min-width:0;aspect-ratio:auto}')
    && S.css.includes('.ck-loupe{position:fixed;') && S.css.includes('.mv-fo.et-faite{fill:var(--ok-doux);stroke:var(--ok)}'));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['l’équipe lue au journal du jour seul (le défaut signalé)', 'pil', "window._ckPlanDebuts(PARC, J, t.cle, t.debut)", "window._ckPlanDebuts(PARC, J.filter(function(e){ return e.date===auj; }), t.cle, t.debut)"],
    ['le début gardé après la validation', 'ck', "Object.keys(L.deb).forEach(function(n){ if(L.der[n] === 'cours') r[n] = L.deb[n]; });", "Object.keys(L.deb).forEach(function(n){ r[n] = L.deb[n]; });"],
    ['la commune passée telle quelle', 'pil', "commune:(p.commune&&typeof p.commune==='object')?String(p.commune.nom||''):String(p.commune||''),", "commune:p.commune||'',"],
    ['lat et lng inversées dans la projection', 'uti', "return [q[1] * kx, -q[0] * _MV_M_LAT];", "return [q[0] * kx, -q[1] * _MV_M_LAT];"],
    ['la place réservée sans la forme (un carré pour toutes)', 'vue', "const dimsP = (p, s) => p.f ? [p.f.w * s, p.f.h * s] : [p.cote * s, p.cote * s];", "const dimsP = (p, s) => [p.cote * s, p.cote * s];"],
    ['le toucher rappelle openSelParc', 'vue', "if (typeof window.openDP === 'function') window.openDP(p.nom); } }", "if (typeof window.openSelParc === 'function') window.openSelParc(p.nom); } }"],
    ['Ctrl K rappelle openSelParc', 'coq', "if (typeof window.openDP === 'function') window.openDP(x.go.parc); return; }", "if (typeof window.openSelParc === 'function') window.openSelParc(x.go.parc); return; }"],
    ['les pastilles placées en millièmes (pX de REF-1)', 'vue', "const pX = p => (p.cx / PLAN_W * 100) + '%';", "const pX = p => (p.cx / 10) + '%';"],
    ['la fiche sans sa forme', 'app', "_dpf.innerHTML=_dph; _dpf.hidden=!_dph;", "_dpf.hidden=true;"],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length < 2) { console.log('  ??  ancre introuvable : ' + nom); manques++; return; }
    S[f] = S[f].split(a).join(b);
    const rouge = jouer(S).some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ✓ rougit : ' : '  ✗ reste vert : ') + nom);
  });
  console.log('\n' + (DEF.length - manques) + '/' + DEF.length + ' contre-épreuves rougissent');
  if (manques) process.exit(1);
}
if (ko) process.exit(1);
