// HARNAIS — PROL-1 (§265) : ce qu'une prolongation de contrat d'un mois ferait gagner.
//   node scripts/mv-harnais-prol1.mjs           → doit être vert
//   node scripts/mv-harnais-prol1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute la VRAIE _pilGainsProlong (pilotage.js) avec un simulateur de renfort simulé qui enregistre ses appels,
// et la VRAIE phrase du cockpit (_ckSvContrats, _ckProlong).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { pil: L('src/pilotage.js'), ck: L('src/cockpit.js'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };
const fn = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const iso = k => { const t = new Date(), x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + k); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
function monde(S, opt) {
  opt = opt || {};
  const appels = [];
  // La fin du contrat de Paul tombe PILE le dernier jour d'une semaine : « la semaine qui suit » se distingue alors de « la semaine de fin ».
  const W = []; const p = iso(10).split('-'), oFin = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - Date.UTC(2026, 0, 1)) / 864e5);
  for (let i = 0; i < 30; i++) W.push({ o0: oFin - 13 + 7 * i, o1: oFin - 7 + 7 * i });
  const ctx = { Math, Number, String, Array, Object, JSON, Date, parseInt, isFinite };
  ctx.window = ctx;
  ctx.MEMBRES = [{ nom: 'Paul', fin_contrat: iso(10) }, { nom: 'Léo', fin_contrat: iso(45) }, { nom: 'Ana', fin_contrat: iso(-2) }, { nom: 'Zoé', fin_contrat: iso(5), statut: 'Inactif' }];
  const dec = { W, c: { rdt: 0.8, k: 0.1 }, rate: 23, noRate: !!opt.noRate };
  ctx._rfPair = () => (opt.fini ? { dec, fini: true } : { dec });
  ctx._rfProf = (c, sel) => ({ sel, rdt: c.c.rdt });
  ctx._rfSim = (c, prof) => { appels.push(prof); return prof.sel ? { induit: opt.pire ? 230 : opt.sansGain ? 200 : 80, horsDelai: opt.pire ? 3 : opt.sansGain ? 2 : 1 } : { induit: 200, horsDelai: 2 }; };
  ctx._rfWOf = (W2, o) => { for (let q = 0; q < W2.length; q++) if (o <= W2[q].o1) return q; return W2.length - 1; };
  ctx._ecoEur = n => Math.round(n).toLocaleString('fr-FR') + ' €';
  vm.createContext(ctx);
  vm.runInContext(fn(S.pil, 'function _pilIsoJ(t,k){') + fn(S.pil, 'function _pilGainsProlong(d){') + 'this.__g=_pilGainsProlong;', ctx);
  return { ctx, appels, dec };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const M = monde(S), g = M.ctx.__g({});
  T('seuls les contrats qui finissent dans les 30 jours (ni plus tard, ni déjà finis, ni inactifs)', JSON.stringify(Object.keys(g)) === '["Paul"]');
  T('le gain : les heures de rattrapage évitées, leurs euros au taux de l\u2019équipe, les tâches ramenées', g.Paul.h === 120 && g.Paul.eur === '2\u202f760 €' && g.Paul.taches === 1);
  const prof = M.appels.find(p => p.sel);
  const pp = iso(10).split('-'), oFin = Math.round((Date.UTC(+pp[0], +pp[1] - 1, +pp[2]) - Date.UTC(2026, 0, 1)) / 864e5);
  T('une personne de plus, des semaines qui SUIVENT la fin du contrat jusqu\u2019à un mois après', prof.sel.a === 2 && prof.sel.R === 1 && prof.sel.a === M.ctx._rfWOf(M.dec.W, oFin + 1) && prof.sel.b === M.ctx._rfWOf(M.dec.W, oFin + 30));
  T('à rendement plein (elle connaît le travail), sur une copie : le contexte partagé reste intact', prof.rdt === 1 && M.dec.c.rdt === 0.8);
  T('sans taux, ou campagne finie : aucun gain inventé', Object.keys(monde(S, { noRate: true }).ctx.__g({})).length === 0 && Object.keys(monde(S, { fini: true }).ctx.__g({})).length === 0);
  const z = monde(S, { sansGain: true }).ctx.__g({});
  const pire = monde(S, { pire: true }).ctx.__g({});
  T('aucun gain, ou pire : zéro, jamais un chiffre négatif', z.Paul.h === 0 && z.Paul.taches === 0 && z.Paul.eur === '' && pire.Paul.h === 0 && pire.Paul.taches === 0);
  const C = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  C.window = C; vm.createContext(C); vm.runInContext(S.ck, C);
  const now = new Date(), m = [{ nom: 'Paul', fin_contrat: iso(10) }];
  T('la phrase dit le gain', C._ckSvContrats(m, now, g)[0].sous === 'Le prolonger d’un mois éviterait 120\u202fh de rattrapage (env. 2\u202f760 €) et ramènerait 1 tâche dans sa fenêtre.');
  T('sans gain, elle le dit ; sans calcul, la phrase d\u2019avant', C._ckSvContrats(m, now, z)[0].sous.includes('ne changerait rien') && C._ckSvContrats(m, now)[0].sous.includes('simulez un renfort'));
  T('_pilTabAuj passe les gains au cockpit, qui les donne à la ligne', S.pil.includes("prolong:_pilGainsProlong(d), dec:dec,") && S.ck.includes('window._ckSvContrats(window.MEMBRES, new Date(), o.prolong)'));
  T('aide, guide et nouveauté (8.37)', S.uti.includes('avec ce qu’une prolongation d’un mois ferait gagner') && S.guide.includes("avec ce qu'une prolongation d'un mois éviterait")
    && /\{ v: '8\.37', d: '2026-10-07', items: \[\n    \{ niv: 0, pour: \['admin'\]/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le contexte partagé modifié (rendement)', 'pil', "var ctx2=Object.assign({},ctx,{c:Object.assign({},ctx.c,{rdt:1})});", "ctx.c.rdt=1; var ctx2=ctx;"],
    ['la personne ajoutée dès la semaine de fin', 'pil', "a:_rfWOf(ctx.W,o+1)", "a:_rfWOf(ctx.W,o)"],
    ['les contrats lointains comptés', 'pil', "||m.fin_contrat<auj||m.fin_contrat>lim) return;", "||m.fin_contrat<auj) return;"],
    ['un gain négatif possible', 'pil', "var h=Math.max(0,Math.round((base.induit||0)-(r.induit||0)));", "var h=Math.round((base.induit||0)-(r.induit||0));"],
    ['un gain inventé sans taux', 'pil', "if(!P||!P.dec||P.dec.noRate||P.fini) return out;", "if(!P||!P.dec||P.fini) return out;"],
    ['« aucun gain » non dit', 'ck', "  if(!(g.h >= 1) && !(g.taches >= 1)) return 'Le prolonger d’un mois ne changerait rien aux travaux de la campagne.';\n", ""],
    ['les gains non passés à la ligne', 'ck', "window._ckSvContrats(window.MEMBRES, new Date(), o.prolong)", "window._ckSvContrats(window.MEMBRES, new Date())"],
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
