// HARNAIS — REF-2 (§267) : la photo économique du jour, depuis le moteur de l'onglet Économie (_pecData).
//   node scripts/mv-harnais-ref2.mjs           → doit être vert
//   node scripts/mv-harnais-ref2.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { pil: L('src/pilotage.js'), vue: L('src/cockpit-vue.js'), uti: L('src/utils.js') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
function eco(S, E) {
  const ctx = { Math, Number, String, Array, Object, JSON, Date, parseInt, isFinite };
  ctx.window = ctx; ctx.PARCELLES = [{ nom: 'A1', surface: 1, appellation: 'Bourgogne' }, { nom: 'B1', surface: .5, appellation: '1er cru' }, { nom: 'X', surface: 2, appellation: 'Bourgogne', statut: 'Arrachée' }];
  vm.createContext(ctx);
  vm.runInContext(fnDe(S.pil, 'function _pilCk2Eco(d, V){') + `
    function _pecData(){ return ${JSON.stringify(E)}; }
    function _rfPair(){ return { dec: { rate: 23, W: [] } }; } function _rfProf(){ return []; } function _rfSim(){ return { induit: 40, horsDelai: 1 }; }
    function _pilPhotoListe(){ return [{ d:'2026-10-01', reste:900, cons:40 }, { d:'2026-10-02', reste:880 }, { d:'2026-10-03', reste:860, cons:42.5 }]; }
    function _mvToday(){ return '2026-10-08'; }   // AUJ-7 : la série datée s'arrête aujourd'hui
    this.__E = _pilCk2Eco({}, { photos: [] });`, ctx);
  return ctx.__E;
}
// AUJ-7 (§309) : la main-d'œuvre PAYÉE (poste « mo », 41 000 €) n'est plus le barème du fait (tot.moF, 37 600 €), et l'atterrissage est la
//   fin projetée du moteur (projFin), plus « engagé + reste d'argent » — qui valait le budget par construction.
const E0 = { configured: true, rate: 23, budget: 70800, engage: 45230, resteE: 30000, projFin: 79000, avc: 61, hbH: 0, tot: { moB: 61412, moF: 37600, moR: 28300 },
  postes: [{ k: 'mo', lab: 'Main-d’œuvre', fait: 41000, budget: 61412 }, { k: 'gnr', lab: 'Carburant', fait: 1080, budget: 2400, det: 'GNR <b>des</b> tracteurs', proj: true }, { k: 'pre', lab: 'Prestations', fait: 900, budget: 500 }],
  cad: { ok: true, applic: true, ecart: 1.6, hJour: 35 }, tasks: [{ nom: 'Taille', fE: 1000, ecE: 15, reH: 456 }, { nom: 'Brulage', fE: 500, ecE: -11, reH: 64.6 }, { nom: 'Sans', fE: 0, ecE: null }],
  pairs: [{ parc: 'A1', eur: 2400 }, { parc: 'B1', eur: 1800 }, { parc: 'X', eur: 999 }] };
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const e = eco(S, E0);
  T('budget, engagé et atterrissage viennent du moteur (atterrissage = fin projetée ; main-d’œuvre payée, son reste à la cadence)', e.budget === 70800 && e.dep === 45230 && e.att === 79000 && e.moBudget === 61412 && e.moDep === 41000 && Math.abs(e.moAtt - (41000 + 28300 * 1.016)) < 1e-6 && e.cadAppl === true);
  T('les postes hors main-d’œuvre, sans balises ; l’atterrissage d’un poste n’est jamais sous son dépensé', e.postes.length === 2 && e.postes[0].note === 'GNR des tracteurs' && e.postes[0].ref === 'proj' && e.postes[0].att === 2400 && e.postes[1].ref === 'cout' && e.postes[1].att === 900);
  T('écart au barème : celui du moteur ; plus de « cadence » prêtée à l’équipe (c’était la journée de référence)', Math.abs(e.ecartMoy - .016) < 1e-9 && !('cadence' in e));
  T('par tâche : écart du réalisé sur le fait et heures réelles (rien d’inventé sans fait)', Math.abs(e.ecTache.Taille - .015) < 1e-9 && e.hReelTache.Brulage === 65 && !('Sans' in e.ecTache) && e.hReel === 521);
  T('par appellation : la main-d’œuvre engagée à l’hectare EN PRODUCTION (l’arrachée ne compte pas)', e.coutHaApp.Bourgogne === 2400 && e.coutHaApp['1er cru'] === 3600);
  T('coût de l’inaction : le simulateur de renfort, comme sa tuile', e.inaction.h === 40 && e.inaction.eur === 920 && e.inaction.horsDelai === 1);
  T('sans temps réel, pas de courbe inventée', Array.isArray(e.serie) && e.serie.length === 0);
  { const e2 = eco(S, Object.assign({}, E0, { tv: { d0: '2026-10-01', hVigne: 1800, byD: { '2026-10-01': 1000, '2026-10-02': 1200 }, byDHb: { '2026-10-02': 200 }, barD: { '2026-10-01': 10, '2026-10-02': 20 } } })), s2 = e2.serie || [];
    T('le dépensé et le fait au fil des jours : datés par le moteur, ils ne font que monter, le dernier point = les chiffres du jour', s2.length === 3 && s2[0].d === '2026-10-01' && s2[1].dep >= s2[0].dep && s2[1].fait >= s2[0].fait && s2[2].d === '2026-10-08' && s2[2].dep === Math.round(41000 / 61412 * 1000) / 10 && s2[2].fait === 61 && Math.abs(s2[1].dep - Math.round(2000 / 61412 * 1000) / 10) < 1e-9); }
  T('sans taux horaire : pas de photo économique (ni bascule, ni budget)', eco(S, Object.assign({}, E0, { configured: false })) === null);
  const v = S.vue;
  T('la vue Économie lit le modèle : cadence et inaction réelles, aucune phrase de démonstration', v.includes("'<b>' + nb(r.capMoy) + '</b><small>\\u202fh/j</small>'") && v.includes('const x = (V.eco || {}).inaction;') && !v.includes('la pente et l’âge des vignes') && !v.includes('<b>35</b>'));
  T('pas de petite courbe sans historique, pas de tracé vide', /\|\| [a-z]+\.length < 2\) return '';/.test(v));
  T('« Exporter pour la compta » : l’export CSV de l’onglet Économie', v.includes("if (fn && fn.dataset.fn === 'export') { if (typeof window._pilEcoExport === 'function') window._pilEcoExport(); return; }") && S.pil.includes("_pecExport('csv', _pecData())"));
  T('la photo économique se branche dans Aujourd’hui', S.pil.includes('var _V=_pilCk2Modele(d,m); _V.eco=_pilCk2Eco(d,_V);'));
  T('la nouveauté de REF-2 reste au Journal (bloc 8.39)', /\{ v: '8\.39', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-verdict', emoji: 'euro'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['l’atterrissage redevient « dépensé + reste d’argent »', 'pil', "var att=num(E.projFin);", "var att=dep+num(E.resteE);"],
    ['la main-d’œuvre redevient le barème du fait', 'pil', "var moDep=num(Pk.mo?Pk.mo.fait:T.moF)", "var moDep=num(T.moF)"],
    ['un poste atterrit sous son dépensé', 'pil', "att:Math.max(f,b) };", "att:b };"],
    ['l’arrachée comptée dans les hectares', 'pil', "if(!p||/arrach/i.test(String(p.statut||''))) return; var a=p.appellation", "if(!p) return; var a=p.appellation"],
    ['un écart inventé sans fait', 'pil', "if(t.ecE!=null&&t.fE>0) ecTache[t.nom]=t.ecE/t.fE;", "ecTache[t.nom]=t.fE?t.ecE/t.fE:0;"],
    ['une photo économique sans taux', 'pil', "if(!E||!E.configured) return null;", "if(!E) return null;"],
    ['la cadence de démonstration revenue', 'vue', "'<b>' + nb(r.capMoy) + '</b><small>\\u202fh/j</small>'", "'<b>35</b><small>\\u202fh/j</small>'"],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length !== 2) { console.log('  ??  ancre introuvable ou multiple : ' + nom); manques++; return; }
    S[f] = S[f].replace(a, b);
    const rouge = jouer(S).some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
