// HARNAIS — REF-1 (§266) : Aujourd'hui reprend la maquette validée, montée avec le modèle réel.
//   node scripts/mv-harnais-ref1.mjs           → doit être vert
//   node scripts/mv-harnais-ref1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute le VRAI _pilCk2Modele (pilotage.js) et les VRAIES sources de cockpit.js sur des données au format de
// l'appli ; lit sur le texte le module de la maquette (src/cockpit-vue.js), le branchement, la feuille et l'aide.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { pil: L('src/pilotage.js'), ck: L('src/cockpit.js'), vue: L('src/cockpit-vue.js'), app: L('src/app.js'), css: L('src/styles.css'), uti: L('src/utils.js') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const J0 = new Date(), iso = k => { const d = new Date(J0.getFullYear(), J0.getMonth(), J0.getDate() + k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ord = k => Math.round((Date.UTC(J0.getFullYear(), J0.getMonth(), J0.getDate() + k) - Date.UTC(2026, 0, 1)) / 864e5);
function modele(S) {
  const P = [{ nom: 'Les Crais 1', surface: .41, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin', statut: 'Active' },
    { nom: 'Les Crais 2', surface: .38, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin', statut: 'Active' },
    { nom: 'Les Charmes', surface: .36, appellation: 'Côte de Nuits-Villages', commune: 'Brochon', statut: 'Active' },
    { nom: 'La Justice 6', surface: .30, appellation: 'Gevrey-Chambertin', commune: 'Brochon', statut: 'Arrachée' }];
  const hex = t => Math.floor(t).toString(16), now = Date.now();
  const JOURNAL = [{ id: hex(now - 864e5 * 9), date: iso(-9), parcelle: 'Les Crais 1', tache: 'Taille', qui: 'Jean', statut: 'Validé' },
    { id: hex(now - 6e4 * 10), date: iso(0), parcelle: 'Les Charmes', tache: 'Taille', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'], statut: 'En cours' },
    { id: hex(now - 6e4 * 6), date: iso(0), parcelle: 'Les Charmes', tache: 'Taille', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'], statut: 'Validé' },
    { id: hex(now - 6e4 * 3), date: iso(0), parcelle: 'Les Crais 2', tache: 'Taille', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'], statut: 'En cours' }];
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx;
  Object.assign(ctx, { PARCELLES: P, JOURNAL, MEMBRES: [], PLANNING_ENTRIES: {}, METEO_HOURLY: null,
    METEO_DAILY: { time: [0, 1, 2, 3, 4].map(iso), code: [3, 61, 71, 2, 0], tmin: [1, 2, -3, 0, -1], tmax: [6, 5, 4, 7, 8] },
    tNom: n => ({ Brulage: 'Brûlage' })[n] || n, _mvToday: () => iso(0), _mvTacheDuMoment: () => ({ nom: 'Taille' }) });
  vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  vm.runInContext(fnDe(S.pil, 'function _pilEtatEntree(e){') + fnDe(S.pil, 'function _pilCk2Modele(d, m){') + `
    function _rfCd(){ return { taskWindows: [{ nom:'Taille', ws:${ord(-40)}, we:${ord(48)} }, { nom:'Brulage', ws:${ord(-8)}, we:${ord(48)} }] }; }
    function _pilRetards(){ return {}; }
    function _pilTensData(){ return { rows: [{ nom:'Jean', f:98, p:100 }], nRouge:0, nSeuil:0 }; }
    function _pilPhotoListe(){ return [{ d:'${iso(-2)}', reste:1300 }, { d:'${iso(-1)}', reste:1250 }]; }
    function _pilTraiterCalc(){ return { big:'Pas aujourd’hui', rai:'Hors <b>saison</b>', ban:'aucune parcelle à nu' }; }
    function _pilDiag(){ return [{ touche:['cfm'], t:'Registre à <b>compléter</b>' }]; }
    function _pilGainsProlong(){ return {}; }
    this.__V = _pilCk2Modele({ data: [{ nom:'Taille', pct:61, h_done:449, h_total:706, surf_total:1.15 }, { nom:'Brulage', pct:19, h_done:66, h_total:403, surf_total:1.15 }, { nom:'Ebourgeonnage', type:'passages', pct:0 }],
      totalReste:1186, totalTotal:3100, hDone:1914, gaugePct:61.7, saison:{ nom:'Hiver 2026-2027' },
      presences:[{ nom:'Jean', etat:'present' }, { nom:'Marion', etat:'cp' }, { nom:'Hugo', etat:'present' }, { nom:'Chloé', etat:'present', bureau:true }],
      tracs:[{ nom:'Fendt 208', rep:{ motif:'Embrayage' } }] }, { obj:new Date(Date.now()+48*864e5), proj:new Date(Date.now()+43*864e5), marge:5, cadH:35 });`, ctx);
  return ctx.__V;
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const V = modele(S);
  T('les tâches simples de la campagne, avec leurs fenêtres et les heures du moteur (pas les passages)',
    V.taches.map(t => t.id).join() === 'taille,brulage' && V.taches[0].debut === iso(-40) && V.taches[0].fin === iso(47) && V.taches[0].hDone === 449 && V.taches[1].nom === 'Brûlage');
  T('la fin prévue, l\u2019objectif et la marge viennent de _pilMargeCalc', V.fin === iso(43) && V.objectif === iso(48) && V.marge === 5);
  T('les présences du jour, sans le bureau ; le motif dit l\u2019absence', V.presents === 2 && V.effectifTotal === 3 && V.absTxt === 'Marion en congé' && V.decision.pres.v === '2 sur 3');
  T('l\u2019état des parcelles par tâche, lu au journal (arrachée exclue)', V.etats.taille['Les Crais 1'] === 'faite' && V.etats.taille['Les Charmes'] === 'faite' && V.etats.taille['Les Crais 2'] === 'cours' && V.etats.taille['La Justice 6'] === 'arr');
  T('l\u2019équipe sur le terrain et le fil du jour (l\u2019heure lue dans l\u2019identifiant)', V.equipes.length === 1 && V.equipes[0].parcelle === 'Les Crais 2' && V.equipes[0].noms === 'Hugo et Léa'
    && V.evts.length === 3 && V.evts[0].type === 'commence' && V.evts[1].h === Math.round(.36 * 706 / 1.15 * 10) / 10   /* surface × barème (h_total / surf_total) */);
  T('la décision du jour : « Traiter ? » et la tension lus dans leurs moteurs, sans balises', V.decision.traiter.raison === 'Hors saison' && V.decision.tension.v === 'Personne au seuil' && V.prio === 'taille');
  T('la météo des cinq jours, le matériel dans « À savoir », la conformité par les diagnostics', V.meteo.length === 5 && V.meteo[1].ic === 'pluie' && V.meteo[2].ic === 'gel'
    && V.savoir.some(x => x.cat === 'materiel' && x.titre === 'Fendt 208 immobilisé') && V.confN === 1 && V.confTxt === 'Registre à compléter');
  T('la saison dit « d\u2019hiver », la date dit le jour et la semaine ; pas d\u2019économie inventée', V.saisonDe === 'd’hiver' && /semaine \d+$/.test(V.dateTxt) && V.eco === null);
  const vue = S.vue;
  T('les noms venus de l\u2019appli sont échappés dans les dessins', /esc\(t\.nom\)/.test(vue) && /esc\(x\.quand\)/.test(vue) && /esc\(l\.nom\)/.test(vue));
  T('le module est la maquette, sans un texte de démonstration', ['function htmlVerdict(', 'function htmlSavoir(', 'function htmlDecision(', 'function svgPlan(', 'function htmlChantiers(', 'function dessinerCourbe(', 'function htmlFil('].every(k => vue.includes(k))
    && !/Marion|Fendt|Brochon|Certiphyto|semaine 2|Mardi 12|sur 7</.test(vue.replace(/window\._ck2Squelette[^\n]*\n/, '')));
  T('toucher une parcelle ouvre SA fiche (le chemin de validation de toujours), jamais une feuille neuve',
    /function ouvrirFeuille\(pid\) \{ const p = PIDX\[pid\]; if \(p && !p\.arr && typeof window\.openSelParc === 'function'\) window\.openSelParc\(p\.nom\); \}/.test(vue) && !vue.includes('function surValider(pid'));
  T('l\u2019entrée orchestrée ne se joue qu\u2019une fois par session', vue.includes('SANS_MVT = !!window._ck2EntreeFaite; entree(); SANS_MVT = false; window._ck2EntreeFaite = true;') && vue.includes('const reduit = () => MQ_REDUIT.matches || SANS_MVT;'));
  T('le squelette porte les blocs de la maquette et l\u2019accroche de la visite', ['id="ck-verdict"', 'id="ck-savoir"', 'id="ck-decision"', 'id="ck-plan"', 'id="ck-chant"', 'id="ck-courbe"', 'id="ck-fil"'].every(k => vue.includes(k)) && vue.includes('data-mvt=\\"traiter\\"') === false && vue.includes("' data-mvt=\"traiter\"'"));
  T('_pilTabAuj monte la maquette avec le modèle réel, et garde l\u2019ancien cockpit en repli',
    S.pil.includes("try{ var _V=_pilCk2Modele(d,m); _V.eco=_pilCk2Eco(d,_V); setTimeout(function(){ try{ window._ck2Monter(_V); }") && S.pil.includes('return window._ck2Squelette(); }') && S.pil.includes('return window._ckAuj({')
    && S.pil.includes("catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTabAuj#ck2'); }"));
  T('« Traiter ? » : un seul calcul, lu par la tuile et par le cockpit', S.pil.includes('var X=_pilTraiterCalc(), big=X.big') && S.pil.includes('return { big:big, bigCol:bigCol, rai:rai, ban:ban, pied:pied, _i:_i };'));
  T('le module est importé après cockpit.js, reserve.js reste dernier', /import '\.\/cockpit\.js';[^\n]*\nimport '\.\/cockpit-vue\.js';[^\n]*\n(?:import '[^']+';[^\n]*\n)*import '\.\/reserve\.js';/.test(S.app));
  const css = S.css.slice(S.css.indexOf('★★★ REF-1 (§266)'));
  T('la feuille de la maquette est là, avec ses jetons propres, et l\u2019ancienne feuille est partie',
    css.includes('.ck2{') && /--et-faite\s*:/.test(css) && /--ck-r-lg:var\(--r-lg,16px\)/.test(css) && !S.css.includes("AUJ-1 (§260) — LE COCKPIT D'AUJOURD'HUI, VUE TERRAIN"));
  T('la nouveauté de REF-1 reste au Journal (bloc 8.38, pastille sur la fin prévue)', /\{ v: '8\.38', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-verdict'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['les passages proposés comme tâches simples', 'pil', "var rows=(typeof window._ckPlanTaches==='function')?window._ckPlanTaches(d.data):(d.data||[]);", "var rows=(d.data||[]);"],
    ['le bureau compté dans l\u2019effectif', 'pil', "return p&&!p.bureau; }).map(function(p){ return { nom:p.nom, absent:p.etat!=='present'", "return !!p; }).map(function(p){ return { nom:p.nom, absent:p.etat!=='present'"],
    ['une équipe qui reste après sa validation', 'pil', "if(ev.type==='commence') sur[e.parcelle]=ev; else delete sur[e.parcelle];", "if(ev.type==='commence') sur[e.parcelle]=ev;"],
    ['des balises dans la décision du jour', 'pil', "traiter:TR?{ v:tx(TR.big), raison:tx(TR.rai), bande:tx(TR.ban) }", "traiter:TR?{ v:TR.big, raison:TR.rai, bande:TR.ban }"],
    ['une économie inventée', 'pil', "sparkTrav:ph.slice(-14).map(function(x){ return hT?Math.round((hT-x.reste)/hT*1000)/10:0; }), eco:null", "sparkTrav:[], eco:{}"],
    ['un nom de démonstration revenu', 'vue', "const maisons = []", "const maisons = []; const _demo = 'Marion'"],
    ['une feuille de validation neuve au toucher', 'vue', "if (p && !p.arr && typeof window.openSelParc === 'function') window.openSelParc(p.nom); }", "if (p) remplirFeuille(p); }"],
    ['l\u2019entrée rejouée à chaque dessin', 'vue', "SANS_MVT = !!window._ck2EntreeFaite; entree(); SANS_MVT = false; window._ck2EntreeFaite = true;", "entree();"],
    ['plus de repli : écran blanc si la maquette plante', 'pil', "    catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTabAuj#ck2'); }\n", "    finally{}\n"],
    ['la feuille sans les jetons propres (plan tout noir)', 'css', '--et-faite:', '--xx-faite:'],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length < 2) { console.log('  ??  ancre introuvable : ' + nom); manques++; return; }
    S[f] = S[f].split(a).join(b);
    const rouge = jouer(S).some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
