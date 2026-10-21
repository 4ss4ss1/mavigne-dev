// HARNAIS — VIF-1 (§414) : Aujourd'hui se met à jour en direct, pastilles d'alerte dans la barre, trois défauts d'Aujourd'hui.
//   node scripts/mv-harnais-vif1.mjs           → doit être vert
//   node scripts/mv-harnais-vif1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { coq: L('src/coquille.js'), pil: L('src/pilotage.js'), vue: L('src/cockpit-vue.js'), ck: L('src/cockpit.js'), app: L('src/app.js'), css: L('src/styles.css'), uti: L('src/utils.js') };
const iso = k => { const t = new Date(), x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + k); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
function coquille(S, opts) {
  const ctx = { Math, String, Array, Object, JSON, Number, Date, setTimeout: () => 0, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: true, addEventListener() {} }), document: { addEventListener() {}, querySelectorAll: () => [] }, localStorage: { getItem: () => null, setItem() {} } };
  ctx.window = ctx; Object.assign(ctx, opts);
  vm.createContext(ctx); vm.runInContext(S.coq, ctx); return ctx;
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const base = { TRACTEURS_LIST: [{ id: 't1' }, { id: 't2' }, { id: 't3' }], REPARATEUR: { t2: { motif: 'embrayage' } },
    MEMBRES: [{ nom: 'Paul', fin_contrat: iso(12) }, { nom: 'Léo', fin_contrat: iso(45) }, { nom: 'Ana', fin_contrat: iso(5), statut: 'Inactif' }],
    _ckSavoirFort: 2, _mvToday: () => iso(0), _mlAgendaComplet: () => [{ items: [1, 2, 3] }], _mlVerdict: () => ({ cls: 'due' }) };
  const A = coquille(S, Object.assign({ isAdmin: () => true }, base))._railAlertes();
  T('pastilles de l’admin : tracteur en réparation, contrat à 30 jours, cave due, points prioritaires du Pilotage',
    A.tracteur === 1 && A.planning === 1 && A.cave === 3 && A.pilotage === 2);
  const B = coquille(S, Object.assign({ isAdmin: () => false }, base))._railAlertes();
  T('un salarié ne voit ni les contrats ni le Pilotage', B.tracteur === 1 && B.cave === 3 && !('planning' in B) && !('pilotage' in B));
  const C = coquille(S, Object.assign({}, base, { isAdmin: () => true, REPARATEUR: {}, MEMBRES: [], _ckSavoirFort: 0, _mlVerdict: () => ({ cls: 'ok' }) }))._railAlertes();
  T('rien à signaler : aucune pastille (pas de zéro affiché)', Object.keys(C).length === 0);
  T('la pastille dit ce qu’elle compte, au singulier ou au pluriel, et plafonne à 9+',
    S.coq.includes("(n > 9 ? '9+' : n)") && S.coq.includes("+ (n > 1 && p !== 'cave' ? 's' : '')") && S.coq.includes('role="img" aria-label="'));
  T('la barre peint ses pastilles à sa construction et le temps réel les repeint', S.coq.includes('window._railAlertesMaj();   // VIF-1') && (S.app.match(/window\._railAlertesMaj\(\)/g) || []).length >= 2);
  T('Aujourd’hui à l’écran se met à jour en direct, avec les mêmes fonctions que son dessin',
    S.pil.includes("if(_PIL_TAB!=='auj'||!document.getElementById('ck-page')||typeof window._ck2Maj!=='function') return false;")
    && S.pil.includes('var d=_pilData(), m=_pilMargeCalc(d), V=_pilCk2Modele(d,m); V.eco=_pilCk2Eco(d,V);') && S.pil.includes('window._ck2Maj(V);'));
  T('le temps réel et la priorité passent par la mise à jour en direct, et redessinent sinon',
    (S.app.match(/if\(!\(window\._pilRafraichirVif&&window\._pilRafraichirVif\(\)\)\) (?:window\.)?renderPilotage\(\);/g) || []).length === 2);
  T('les parcelles qui viennent d’être faites ou commencées ont leur onde, retrouvées par leur nom',
    S.vue.includes("if (id && b && a && b !== a && (b === 'faite' || b === 'cours')) onde(id, b, t);") && S.vue.includes('charger(v); majTout({});'));
  T('les points prioritaires d’« À savoir » sont comptés là où le modèle se construit', S.pil.includes("window._ckSavoirFort=(sv||[]).filter(function(x){ return x&&x.prio===1; }).length;"));
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  const t0 = new Date(); const d1 = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + 1);
  const PE = { Sophie: { [d1.getFullYear()]: { [d1.getMonth()]: { [d1.getDate()]: { absent: true } } } } };
  const ab = ctx._ckSvAbsences([{ nom: 'Sophie' }], PE, e => ({ etat: e && e.absent ? 'absent' : 'present', motif: '' }), t0);
  T('une absence ne s’accorde plus de travers : « Absence de Sophie »', ab.length === 1 && ab[0].titre === 'Absence de Sophie' && S.ck.includes("[suite] || 'absence'))"));
  T('un objectif déjà passé n’a plus de ligne d’allure qui déborde à gauche', S.vue.includes("$('#ck-c-besoin').setAttribute('d', VISEE > AUJ ? 'M' + f1(xa)"));
  T('le fil de portée collé sous le bandeau, les onglets sous les deux ; sa hauteur posée aussi sur Aujourd’hui',
    S.css.includes('body #page-pilotage .pil-tabsbar{top:calc(var(--pil-entete-bas,0px) + var(--pil-portee-h,0px))}') && S.css.includes('body #page-pilotage .pil-portee{position:sticky;top:var(--pil-entete-bas,0px);z-index:61}')
    && S.pil.includes('window._ck2Monter(_V); _pilStickyH();'));
  T('version et nouveautés (9.74)', /export const APP_VERSION = '9\.74';/.test(S.uti) && /\{ v: '9\.74', d: '2026-10-21', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-page'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0; res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' — ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['les contrats montrés à un salarié', 'coq', "  if (admin) {\n    const t = new Date()", "  if (true) {\n    const t = new Date()"],
    ['une pastille « 0 »', 'coq', "Object.keys(a).forEach(k => { if (!(a[k] > 0)) delete a[k]; });", ""],
    ['un tracteur compté sans réparation', 'coq', "filter(t => t && R[t.id]).length", "filter(t => t).length"],
    ['la priorité qui redessine toute la page', 'app', "if(pg&&pg.id==='page-pilotage'&&typeof window.renderPilotage==='function'){ if(!(window._pilRafraichirVif&&window._pilRafraichirVif())) window.renderPilotage(); }", "if(pg&&pg.id==='page-pilotage'&&typeof window.renderPilotage==='function') window.renderPilotage();"],
    ['plus d’onde sur une parcelle validée', 'vue', "(b === 'faite' || b === 'cours')) onde(id, b, t);", "(b === 'faite' || b === 'cours')) {}"],
    ['« Sophie absent » revenu', 'ck', "titre: pl.etat === 'absent' ? 'Absence de ' + m.nom : m.nom + ' ' + lib,", "titre: m.nom + ' ' + lib,"],
    ['la ligne d’allure d’un objectif passé', 'vue', "VISEE > AUJ ? 'M' + f1(xa)", "true ? 'M' + f1(xa)"],
    ['la mise en direct sur un autre onglet', 'pil', "if(_PIL_TAB!=='auj'||!document.getElementById('ck-page')", "if(!document.getElementById('ck-page')"],
  ];
  let m = 0; DEF.forEach(([nom, f, a, b]) => { const S = Object.assign({}, SRC0); if (S[f].split(a).length !== 2) { console.log('  ??  ' + nom); m++; return; } S[f] = S[f].replace(a, b); const rouge = jouer(S).some(x => !x[1]); if (!rouge) m++; console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom); });
  console.log('\n' + (m ? 'CONTRE-ÉPREUVES ROUGES ' + m : 'CONTRE-ÉPREUVES VERTES') + ' — ' + DEF.length + ' défauts réinjectés'); process.exit(ko || m ? 1 : 0);
}
process.exit(ko ? 1 : 0);
