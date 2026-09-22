/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — SESSIONS TRACTEUR : PLUS RIEN NE SE PERD (lot SESS-1, §168)
   Lancer : node scripts/mv-harnais-sessions.mjs
            node scripts/mv-harnais-sessions.mjs --contre

   ══ POURQUOI ══
   Le 22/09, une journée de griffage est devenue irrécupérable : 2h54 mesurées et 17 mesures
   écartées au compteur, et presque rien dans la session. TAP-1 avait réglé le défilement. Restaient
   les défauts du moteur, trouvés en le relisant :
     ① rouvrir la session pendant une mesure la TUAIT (« chrono lancé en retard ») ;
     ② interrompre une parcelle perdait le temps d'avant la pause ;
     ③ refaire une parcelle remplaçait son temps, et chaque morceau était jugé seul ;
     ④ un seul chrono pour tout l'appareil : ouvrir une autre session l'effaçait ;
     ⑤ aucune trace des gestes ; ⑥ 99,6 % arrondi à 100 % terminait la session ;
     ⑦ regarder une session la modifiait (statut, date de fin) ; et quelques autres.

   ══ CE QU'IL TIENT ══
   Les VRAIES fonctions de src/tracteur.js, extraites par leur nom et exécutées sous une horloge
   factice, avec un localStorage factice : chaque défaut est rejoué geste par geste.
   ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE avec garde d'injection — une mutation qui ne
      trouve pas son ancre est une ERREUR, jamais un vert.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { trac: lire('src/tracteur.js'), app: lire('src/app.js'), html: lire('index.html'),
               utils: lire('src/utils.js'), guide: lire('guide/06-tracteur.html') };

function fonction(src, nom) {
  const tete = 'function ' + nom + '(';
  const i = src.indexOf(tete);
  if (i < 0 || src.indexOf(tete, i + 1) >= 0) return '';
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  return '';
}
const FONCTIONS = ['_chrNeuf', '_chrJour', '_chrMes', '_chrNom', '_chrDur', '_chrGrp', '_chrEcart', '_chronoOn',
  '_chronoEnabledForSession', '_sessBaremeMin', '_chrSurf', '_chrBareme', '_chrFmtTimer', '_chrFmtRate', '_chrFmtDur',
  '_chrLive', '_chrCourant', '_chrBlocMs', '_chrBucketMs', '_chrHors', '_chrPause', '_chrMesure', '_chrGoBucket',
  '_chrTous', '_chrEcrireTous', '_chrPrune', '_chrSave', '_chrLoad', '_chrVierge', '_chronoReset', '_chrOublier',
  '_stopChronoTimer', '_startChronoTimer', '_chrSuspect', '_chrSuspectTotal', '_chrTrace', '_chrPose', '_chrPoserBloc',
  '_chrCloturer', '_chrDemarrer', '_chrFermerAilleurs', '_chrTapParcelle', '_chrReprendreParcelle', '_chrAjouterAuBloc',
  '_chrFini', '_chrInterrompre', '_chrDejeuner', '_chrReprendre', '_chrFermerPause', '_chrFinJournee',
  '_chronoFinalizeOnClose', '_chrRestaurer', 'renderSessionProgress', 'toggleSessionSkip', '_sdDecocher', '_sdNorm',
  '_sdRetablir', 'toggleSessionParcelle', 'confirmerValidationChamp'];
const VARS = [/^var _CHR_CLE = .*$/m, /^var _CHR_CLE2 = .*$/m, /^var _CHR_HAUT = .*$/m, /var _CHR_MOTIFS=\{[\s\S]*?\};/,
  /^var _CHR_TRACE_MAX=.*$/m, /^var _chrPersistKO=false;$/m, /^var _ocvNomParcelle=null;$/m];

/* ── Le bac : le vrai moteur, une horloge, un stockage, deux sessions ── */
const T0 = Date.UTC(2026, 8, 22, 6, 0, 0);
const MIN = 60000;
function bac(S, o = {}) {
  const horloge = { t: o.t0 || T0 };
  const RealDate = Date;
  class FDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(horloge.t); } static now() { return horloge.t; } }
  const store = new Map(Object.entries(o.store || {}));
  const env = { horloge, toasts: [], saves: [], confirme: null, fermee: 0 };
  const el = () => ({ textContent: '', style: {}, value: '', innerHTML: '', querySelectorAll: () => [] });
  const dom = { 'sd-progress': el(), 'sd-bar': el(), 'ocv-val': Object.assign(el(), { value: o.valeur || '' }), 'sd-hist': el() };
  const PARCELLES = [
    { nom: 'Combe du Bas', surface: '1.6753' }, { nom: 'Petite', surface: '0.4' }, { nom: 'Grande', surface: '10' },
    { nom: 'Grande2', surface: '10' }, { nom: 'Mini', surface: '0.04' }, { nom: 'Nulle', surface: '0' }
  ].concat(o.parcelles || []);
  const SESSIONS = o.sessions || [
    { id: 'A', activite: 'Griffage', date: '2026-09-22', statut: 'En cours', parcellesFaites: [], parcellesSkip: [] },
    { id: 'B', activite: 'Broyage', date: '2026-09-22', statut: 'En cours', parcellesFaites: [], parcellesSkip: [] }];
  const CONFIG = { chrono_mode: o.chrono === false ? 'off' : 'on' };
  const w = { tracSessionId: 'A', CONFIG, currentUser: { nom: 'Nico' }, SESSIONS };
  w.openConfirmDel = (titre, sub, cb, icone, bouton, couleur, alt) => { env.confirme = { titre, sub, cb, bouton, alt }; };
  const ctx = {
    window: w, SESSIONS, PARCELLES, CONFIG, Date: FDate, Math, JSON, Object, Array, Number, String, isNaN,
    ACTIVITES: o.activites || [{ nom: 'Griffage', h_ha: 3 }, { nom: 'Broyage', h_ha: 1 }],
    REPARATEUR: {}, TRACTEURS_LIST: [], sdSkipMode: false, sdShowDone: false,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    navigator: {}, setInterval: () => 1, clearInterval: () => {}, setTimeout: () => 0,
    document: { getElementById: id => dom[id] || null },
    isTractoriste: () => true, isAdmin: () => true,
    showToast: m => env.toasts.push(m), _saveData: k => env.saves.push(k),
    renderSDParcelles: () => {}, closeSessionDetail: () => { env.fermee++; }, _chronoTick: () => {},
    _gnrTodayISO: () => '2026-09-22', _closeOv: () => {}, _openOv: () => {}, _mvIcon: () => '', _actIcone: () => '',
    _escHtml: s => String(s)
  };
  vm.createContext(ctx);
  vm.runInContext(S.vars + '\nvar _chrono=_chrNeuf();var _chronoTimer=null;\n' + S.code, ctx);
  env.ctx = ctx; env.store = store; env.dom = dom; env.S = SESSIONS;
  env.avance = ms => { horloge.t += ms; };
  env.ouvrir = sid => { w.tracSessionId = sid; ctx._chrRestaurer(sid); };
  env.fermer = () => ctx._chronoFinalizeOnClose();
  env.entree = (sid, nom) => (SESSIONS.find(x => x.id === sid).parcellesFaites || []).find(x => (typeof x === 'string' ? x : x.nom) === nom);
  env.etat = sid => JSON.parse(store.get('mavigne_chrono_v2') || '{}')[sid];
  return env;
}

function scenarios(S) {
  const R = [];
  const cas = (nom, f) => { let ok = false; try { ok = !!f(); } catch (e) { nom += ' (' + String(e.message).slice(0, 90) + ')'; } R.push([nom, ok]); };
  const C = e => e.ctx;
  cas('★ ① rouvrir la session pendant une mesure ne la tue plus (11 min sur 5 h de barème)', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Combe du Bas'); e.avance(10 * MIN);
    e.fermer(); e.avance(MIN); e.ouvrir('A');
    const encore = C(e)._chrono.bloc.join() === 'Combe du Bas' && !e.entree('A', 'Combe du Bas');
    e.avance(190 * MIN); C(e)._chrFini();
    const x = e.entree('A', 'Combe du Bas');
    return encore && x && x.dmin === 201 && !x.ecarte;
  });
  cas('… mais un chrono OUBLIÉ (plus de 12 h) se ferme bien à la réouverture', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Petite'); e.fermer(); e.avance(13 * 60 * MIN); e.ouvrir('A');
    const x = e.entree('A', 'Petite'); return !C(e)._chrono.bloc.length && x && x.ecarte === 'dur';
  });
  cas('★ ② interrompre garde le temps d\u2019avant la pause (30 + 20 = 50 min, pas 20)', () => {
    const e = bac(S); e.ouvrir('A'); const t = e.horloge.t; C(e)._chrTapParcelle('Petite'); e.avance(30 * MIN);
    C(e)._chrInterrompre(); e.avance(45 * MIN); C(e)._chrReprendre(); e.avance(20 * MIN); C(e)._chrFini();
    const x = e.entree('A', 'Petite'); return x && x.dmin === 50 && x.mes === 50 && x.t0 === t;
  });
  cas('② fin de journée pendant la pause : la parcelle est écrite, arrêtée à l\u2019heure de l\u2019interruption', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Petite'); e.avance(40 * MIN); C(e)._chrInterrompre();
    const tp = e.horloge.t; e.avance(30 * MIN); C(e)._chrFinJournee();
    const x = e.entree('A', 'Petite'); return x && x.mes === 40 && x.t1 === tp && e.fermee === 1;
  });
  cas('★ ③ reprendre une parcelle faite ADDITIONNE (90 + 80 min), jugé sur le total', () => {
    const e = bac(S); e.ouvrir('A'); const t = e.horloge.t;
    C(e)._chrTapParcelle('Combe du Bas'); e.avance(90 * MIN); C(e)._chrFini();
    const avant = e.entree('A', 'Combe du Bas');
    const ecarteSeul = avant && avant.ecarte === 'bas' && avant.mes === 90;
    C(e)._chrReprendreParcelle('Combe du Bas'); e.avance(80 * MIN); C(e)._chrFini();
    const x = e.entree('A', 'Combe du Bas');
    return ecarteSeul && x.dmin === 170 && x.n === 2 && !x.ecarte && x.t0 === t;
  });
  cas('③ une fois aberrante (oubliée 13 h) ne compte pas, et n\u2019efface pas la mesure juste', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Petite'); e.avance(50 * MIN); C(e)._chrFini();
    C(e)._chrReprendreParcelle('Petite'); e.avance(13 * 60 * MIN); C(e)._chrFini();
    const x = e.entree('A', 'Petite'); return x.dmin === 50 && !x.ecarte;
  });
  cas('★ ④ un chrono par session : regarder une autre session ne l\u2019efface plus', () => {
    const e = bac(S); e.ouvrir('A'); const t = e.horloge.t; C(e)._chrTapParcelle('Combe du Bas'); e.avance(10 * MIN);
    e.ouvrir('B'); C(e)._chrDejeuner(); C(e)._chrReprendre(); e.fermer();
    e.ouvrir('A'); return C(e)._chrono.bloc.join() === 'Combe du Bas' && C(e)._chrono.t0d === t;
  });
  cas('④ un chrono à la fois : commencer ailleurs ferme la mesure restée ouverte, à la bonne heure', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Combe du Bas'); e.avance(60 * MIN);
    e.ouvrir('B'); C(e)._chrTapParcelle('Grande');
    const x = e.entree('A', 'Combe du Bas'), sa = e.etat('A');
    return x && x.mes === 60 && sa && !sa.bloc.length && C(e)._chrono.bloc.join() === 'Grande'
      && e.toasts.some(m => /Griffage/.test(m));
  });
  cas('④ l\u2019ancien état unique est repris à la mise à jour (migration)', () => {
    const vieux = { sid: 'A', bloc: ['Petite'], t0: T0 - 5 * MIN, mesMs: 0, horsMs: 0, pauseMs: 0, bucket: 'none', bT0: T0, pause: false, pauseOuvert: null, dernier: null, ecarte: 0, ecarteMs: 0 };
    const e = bac(S, { store: { mavigne_chrono_session: JSON.stringify(vieux) } }); e.ouvrir('A');
    return C(e)._chrono.bloc.join() === 'Petite' && !e.store.has('mavigne_chrono_session');
  });
  cas('changement de jour : les compteurs repartent à zéro, la pause d\u2019hier se ferme à son heure', () => {
    const hier = T0 - 20 * 60 * MIN, tp = hier + 30 * MIN;
    const st = { A: { sid: 'A', bloc: [], t0: 0, t0d: hier, acc: 30 * MIN, tp, mesMs: 5e6, horsMs: 1e6, pauseMs: 1e6, bucket: 'pause', bT0: tp, pause: true, pauseOuvert: ['Petite'], dernier: null, ecarte: 3, ecarteMs: 4e6, jour: '2026-09-21' } };
    const e = bac(S, { store: { mavigne_chrono_v2: JSON.stringify(st) } }); e.ouvrir('A');
    const x = e.entree('A', 'Petite');
    return C(e)._chrono.mesMs === 0 && C(e)._chrono.ecarte === 0 && !C(e)._chrono.pause && x && x.mes === 30 && x.t1 === tp;
  });
  cas('⑤ boîte noire : chaque geste s\u2019inscrit (début, fin, reprise, interruption, décoche…)', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Petite'); e.avance(30 * MIN); C(e)._chrInterrompre();
    C(e)._chrReprendre(); e.avance(5 * MIN); C(e)._chrFini(); C(e)._chrReprendreParcelle('Petite'); e.avance(MIN); C(e)._chrFini();
    C(e)._sdDecocher('Petite');
    const g = (e.S[0].trace || []).map(x => x.e).join(',');
    return g === 'debut,interrompt,reprend,fin,reprise,fin,decoche' && e.S[0].trace.every(x => x.u === 'Nico');
  });
  cas('★ ⑤ « Rétablir » remet la parcelle décochée telle qu\u2019elle était', () => {
    const e = bac(S); e.S[0].parcellesFaites = [{ nom: 'Petite', t0: 1, t1: 2, ps: 0, grp: 1, mes: 50, dmin: 50, n: 1 }];
    const avant = JSON.stringify(e.S[0].parcellesFaites[0]);
    C(e)._sdDecocher('Petite'); const ev = e.S[0].trace.find(x => x.e === 'decoche');
    C(e)._sdRetablir(ev.t);
    return JSON.stringify(e.entree('A', 'Petite')) === avant && e.S[0].trace.some(x => x.e === 'retabli');
  });
  cas('⑤ la boîte noire reste bornée : 200 gestes au plus, 3 jours au plus', () => {
    const e = bac(S); const s = e.S[0];
    s.trace = [{ t: T0 - 4 * 24 * 60 * MIN, e: 'vieux' }];
    for (let i = 0; i < 250; i++) { C(e)._chrTrace(s, 'coche', 'P' + i); e.avance(1000); }
    return s.trace.length === 200 && !s.trace.some(x => x.e === 'vieux');
  });
  cas('★ ⑥ 99,6 % n\u2019est pas 100 % : la session ne se termine pas avec une parcelle à faire', () => {
    const e = bac(S, { parcelles: [], sessions: [{ id: 'A', activite: 'Griffage', statut: 'En cours', parcellesFaites: [], parcellesSkip: ['Combe du Bas', 'Petite', 'Nulle'] }] });
    const s = e.S[0]; s.parcellesFaites = [{ nom: 'Grande' }, { nom: 'Grande2' }]; C(e).renderSessionProgress();
    const p1 = s.avancement, st1 = s.statut; s.parcellesFaites.push({ nom: 'Mini' }); C(e).renderSessionProgress();
    return p1 === 99 && st1 === 'En cours' && s.avancement === 100 && s.statut === 'Terminé';
  });
  cas('★ ⑦ regarder une session terminée ne la rouvre plus (parcelle plantée depuis)', () => {
    const e = bac(S, { parcelles: [{ nom: 'Plantée depuis', surface: '0.3' }] });
    const s = e.S[0]; s.statut = 'Terminé'; s.dateFin = '2026-09-10'; s.avancement = 100;
    s.parcellesFaites = ['Combe du Bas', 'Petite', 'Grande', 'Grande2', 'Mini', 'Nulle'].map(nom => ({ nom }));
    e.saves.length = 0; C(e).renderSessionProgress({ vue: true });
    return s.statut === 'Terminé' && s.dateFin === '2026-09-10' && s.avancement === 100 && !e.saves.length
      && /\b98%/.test(e.dom['sd-progress'].textContent);   // 22,12 / 22,42 ha : l'écran le dit, la session reste terminée
  });
  cas('une coche sans chrono est un objet {nom}, et les vieilles chaînes le deviennent', () => {
    const e = bac(S, { chrono: false }); e.S[0].parcellesFaites = ['Grande']; C(e).toggleSessionParcelle('Petite');
    return JSON.stringify(e.S[0].parcellesFaites) === '[{"nom":"Grande"},{"nom":"Petite"}]';
  });
  cas('chrono allumé : toucher une parcelle faite propose « Reprendre la mesure », qui relance le chrono dessus', () => {
    const e = bac(S); e.ouvrir('A'); e.S[0].parcellesFaites = [{ nom: 'Petite', mes: 50, dmin: 50, n: 1 }];
    C(e).toggleSessionParcelle('Petite'); const c = e.confirme;
    if (!c || !c.alt || c.alt.label !== 'Reprendre la mesure' || c.bouton !== 'D\u00e9cocher') return false;
    c.alt.cb(); return C(e)._chrono.bloc.join() === 'Petite' && e.entree('A', 'Petite').dmin === 50;
  });
  cas('une parcelle en cours de mesure ne se décoche pas et ne se désactive pas d\u2019un appui', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Petite');
    C(e).toggleSessionParcelle('Petite'); C(e).toggleSessionSkip('Petite');
    return !e.confirme && !(e.S[0].parcellesSkip || []).length && C(e)._chrono.bloc.join() === 'Petite';
  });
  cas('une valeur saisie deux fois ne fait pas deux lignes', () => {
    const e = bac(S, { chrono: false, valeur: '120', activites: [{ nom: 'Griffage', champCustom: { label: 'Trous', type: 'nombre' } }] });
    e.S[0].parcellesFaites = [{ nom: 'Petite', data: { Trous: '10' } }];
    C(e)._ocvNomParcelle = 'Petite'; C(e).confirmerValidationChamp();
    const l = e.S[0].parcellesFaites; return l.length === 1 && l[0].data.Trous === '120';
  });
  cas('un bloc sans surface garde son temps (à parts égales), au lieu de 0', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Nulle'); e.avance(30 * MIN); C(e)._chrFini();
    return e.entree('A', 'Nulle').mes === 30;
  });
  cas('supprimer une session oublie son chrono', () => {
    const e = bac(S); e.ouvrir('A'); C(e)._chrTapParcelle('Petite'); C(e)._chrOublier('A');
    return !e.etat('A') && !C(e)._chrono.bloc.length;
  });
  return R;
}

function statiques(S) {
  const R = [];
  const T = S.trac, se = fonction(T, 'saveEditSession'), oe = fonction(T, 'openEditSession'), ds = fonction(T, 'deleteSession');
  R.push(['modifier une session : 0 % reste 0 %, la saison suit la date', !/\)\|\|100/.test(se) && !/avancement\|\|100/.test(oe) && /_saisonForDate/.test(se)]);
  R.push(['supprimer depuis « Modifier » recalcule les trous et oublie le chrono, comme depuis la feuille', /_recalcPlantationTrous/.test(ds) && /_chrOublier\(id\)/.test(ds) && /_chrOublier\(id\)/.test(fonction(T, 'deleteSessionFromDetail'))]);
  R.push(['le bandeau et son minuteur montrent la fois entière (pause déduite)', /_chrFmtTimer\(_chrBlocMs\(\)\)/.test(fonction(T, '_chronoTick')) && /ms=_chrBlocMs\(\)/.test(fonction(T, '_renderChronoBar'))]);
  R.push(['l\u2019ouverture regarde sans modifier', /renderSessionProgress\(\{vue:true\}\)/.test(fonction(T, 'openSessionDetail'))]);
  R.push(['« Voir toutes » ne remontre pas les parcelles désactivées', /sdShowDone\?actives\.filter\(p=>!skip\.includes\(p\.nom\)/.test(fonction(T, 'renderSDParcelles'))]);
  const oc = fonction(S.app, 'openConfirmDel');
  R.push(['la boîte de confirmation sait proposer un second choix, et le cache sinon',
    /alt\)\{/.test(oc) && /ocd-alt/.test(oc) && /window\._execConfirmAlt = _execConfirmAlt/.test(S.app)
      && /id="ocd-alt"[^>]*onclick="_execConfirmAlt\(\)"/.test(S.html) && /id="sd-hist"/.test(S.html)]);
  const aide = S.utils.slice(S.utils.indexOf('var MV_AIDE = {'), S.utils.indexOf('var MV_AIDE_DEFAUT'));
  const i = aide.indexOf('\n  tracteur: {'), fiche = aide.slice(i, aide.indexOf('\n  }', i));
  R.push(['la fiche d\u2019aide Tracteur dit la reprise, la pause gardée et l\u2019historique',
    /Reprendre la mesure/.test(fiche) && /Historique des gestes/.test(fiche)]);
  R.push(['le guide Tracteur dit la reprise et l\u2019historique', /Reprendre la mesure/.test(S.guide) && /Historique des gestes/.test(S.guide)]);
  R.push(['« Quoi de neuf » 7.55 ouvre sur la mesure qui ne se perd plus', /\{ v: '7\.55', items: \[\s*\{ emoji: '[a-z]+', titre: '[^']*(perd|tue)/.test(S.utils)]);
  return R;
}

function mesurer(src) {
  const code = FONCTIONS.map(n => fonction(src.trac, n));
  const manque = FONCTIONS.filter((n, k) => !code[k]);
  const vars = VARS.map(r => (src.trac.match(r) || [''])[0]);
  const vManque = vars.filter(v => !v).length;
  const S = Object.assign({}, src, { code: code.join('\n'), vars: vars.join('\n') });
  const R = [['le moteur se lit dans tracteur.js' + (manque.length || vManque ? ' (manque : ' + manque.join(', ') + (vManque ? ' + ' + vManque + ' constante(s)' : '') + ')' : ''), !manque.length && !vManque]];
  if (manque.length || vManque) return R;
  return R.concat(scenarios(S), statiques(S));
}

let ok = 0, ko = 0;
console.log('\n\u2500\u2500 SESSIONS TRACTEUR : PLUS RIEN NE SE PERD \u2014 lot SESS-1\n');
for (const [nom, cond] of mesurer(BASE)) {
  if (cond) { ok++; console.log('  \x1b[32m\u2713\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m\u2717\x1b[0m ' + nom); }
}
console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('  contre-épreuve non jouée : la référence est rouge'); process.exit(1); }

/* ── Contre-épreuves : chaque défaut corrigé, remis tel qu'il était ── */
const DEFAUTS = [
  { nom: '★ ① la reprise juge encore la mesure jeune (« bas ») et la tue', dans: '_chrRestaurer', de: "if(sp==='dur'||sp==='haut')", vers: 'if(sp)' },
  { nom: '★ ② la pause oublie le temps d\u2019avant', dans: '_chrInterrompre', de: '_chrono.acc=_chrBlocMs();', vers: '_chrono.acc=0;' },
  { nom: '② la fin de journée oublie la parcelle en pause', dans: '_chrFermerPause', de: 'if(_chrono.bloc.length||', vers: 'if(true||' },
  { nom: '★ ③ refaire une parcelle remplace son temps', dans: '_chrPoserBloc', de: 'var mes=Math.round((_chrMes(o)+(aberrante?0:part))*10)/10;', vers: 'var mes=Math.round(((aberrante?0:part))*10)/10;' },
  { nom: '③ une fois aberrante efface la mesure juste', dans: '_chrPoserBloc', de: 'if(aberrante&&o&&typeof o.dmin===\'number\')', vers: 'if(false)' },
  { nom: '③ un bloc sans surface perd son temps', dans: '_chrPoserBloc', de: 'var part=tot>0?(min*surfs[i]/tot):(min/n);', vers: 'var part=tot>0?(min*surfs[i]/tot):0;' },
  { nom: '★ ④ un seul état pour tout l\u2019appareil', dans: '_chrSave', de: 'm[_chrono.sid]=_chrono;', vers: 'm={};m[_chrono.sid]=_chrono;' },
  { nom: '④ commencer ailleurs laisse courir l\u2019autre chrono', dans: '_chrTapParcelle', de: '_chrFermerAilleurs(s.id);', vers: '' },
  { nom: '④ l\u2019ancien état n\u2019est pas repris', dans: '_chrTous', de: 'if(o&&o.sid&&!m[o.sid])m[o.sid]=o;', vers: '' },
  { nom: 'le jour qui change ne remet rien à zéro', dans: '_chrRestaurer', de: "if((_chrono.jour||'')!==_chrJour()){", vers: 'if(false){' },
  { nom: '★ ⑤ la décoche ne garde pas l\u2019entrée retirée', dans: '_sdDecocher', de: "_chrTrace(s,'decoche',nom,{x:JSON.stringify(_ret)});", vers: "_chrTrace(s,'decoche',nom);" },
  { nom: '⑤ la boîte noire enfle sans fin', dans: '_chrTrace', de: 'if(tr.length>_CHR_TRACE_MAX)', vers: 'if(false)' },
  { nom: '★ ⑥ l\u2019arrondi termine la session à 99,6 %', dans: 'renderSessionProgress', de: 'const pct=reste===0?100:(totalSurf>0?Math.min(99,Math.floor(doneSurf/totalSurf*100)):0);', vers: 'const pct=totalSurf>0?Math.round(doneSurf/totalSurf*100):100;' },
  { nom: '★ ⑦ regarder une session la modifie', dans: 'renderSessionProgress', de: 'if(o&&o.vue)return;', vers: '' },
  { nom: 'la coche redevient une chaîne', dans: 'toggleSessionParcelle', de: 's.parcellesFaites.push({nom:nom});', vers: 's.parcellesFaites.push(nom);' },
  { nom: 'la parcelle en cours se désactive', dans: 'toggleSessionSkip', de: "if(_chrono.bloc.indexOf(nom)>=0||", vers: 'if(false&&' },
  { nom: 'la valeur saisie redouble', dans: 'confirmerValidationChamp', de: 'if(_jv>=0)s.parcellesFaites[_jv]=', vers: 'if(false)s.parcellesFaites[_jv]=' },
  { nom: 'plus de « Reprendre » dans la boîte', dans: 'toggleSessionParcelle', de: "_dAlt={label:'Reprendre la mesure',", vers: "_dAlt=null&&{label:'Reprendre la mesure'," },
  { nom: '« Modifier » remet « ||100 »', dans: 'saveEditSession', de: 's.avancement=isNaN(_av)?(s.avancement!=null?s.avancement:0):Math.max(0,Math.min(100,_av));', vers: 's.avancement=parseInt(document.getElementById(\'es-av\').value)||100;' }
];
const un = (t, m) => t.split(m).length - 1 === 1;
let det = 0; const rates = [];
for (const d of DEFAUTS) {
  const f = fonction(BASE.trac, d.dans);
  if (!f || !un(BASE.trac, f) || !un(f, d.de)) { console.log('  \x1b[31m\u2717\x1b[0m injection NON POSÉE : ' + d.nom); rates.push(d.nom); continue; }
  const mute = BASE.trac.replace(f, f.replace(d.de, d.vers));
  const rouges = mesurer(Object.assign({}, BASE, { trac: mute })).filter(r => !r[1]).length;
  if (rouges) { det++; console.log('    DÉTECTÉ  ' + d.nom + ' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'); }
  else { rates.push(d.nom); console.log('  \x1b[31m\u2717\x1b[0m NON DÉTECTÉ  ' + d.nom); }
}
console.log('');
if (rates.length) { console.log('  \x1b[31m' + rates.length + ' défaut(s) passent inaperçus\x1b[0m\n'); process.exit(1); }
console.log('  Les ' + det + ' défauts sont détectés.\n');
process.exit(0);
