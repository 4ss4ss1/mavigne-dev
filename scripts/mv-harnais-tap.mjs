/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — UN APPUI N'EST PAS UN DÉFILEMENT (lot TAP-1, §166)
   Lancer : node scripts/mv-harnais-tap.mjs
            node scripts/mv-harnais-tap.mjs --contre

   ══ POURQUOI ══
   Nico, le 22/09 : « c'est actuellement beaucoup trop sensible et rien que
   défiler ça valide les parcelles ». Dans une session tracteur, la coche
   partait au LEVER DU DOIGT (touchend), quel qu'ait été son chemin : touchmove
   annulait l'appui long, jamais la coche. Chrono allumé, un défilement fermait
   la mesure en cours et en ouvrait une autre.

   ══ CE QU'IL TIENT ══
     A. `_sdTapVerdict` (pure), cas par cas.
     B. Le VRAI bloc TAP-1 de src/tracteur.js, exécuté tel quel entre ses deux
        bornes, sous de vrais enchaînements d'événements d'un navigateur tactile
        (pointer*, touch*, souris de compatibilité, click) : un appui, un
        défilement, une liste lancée qu'on arrête, un double appui, un appui
        long, la feuille tirée tout en haut, la souris, le clavier.
     C. La décoche : `toggleSessionParcelle` et `_sdDecocher` extraits et
        exécutés — la confirmation, la parcelle retrouvée par son nom, le repli,
        et la coche qui reste d'un seul geste.
     D. Le câblage (renderSDParcelles), la feuille de style, l'aide, le guide,
        « Quoi de neuf ».

   ⚠️ Le modèle de navigateur est le PIRE CAS, exprès : il envoie un click après
      une liste arrêtée et après un appui long, là où Chrome et Safari le
      suppriment souvent. Les gardes du code ne comptent pas sur la politesse du
      navigateur.
   ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection —
      une mutation qui ne trouve pas son ancre est une ERREUR, jamais un vert.
      La première remet l'ANCIEN geste, mot pour mot : elle doit rougir.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { trac: lire('src/tracteur.js'), css: lire('src/styles.css'), utils: lire('src/utils.js'),
               guide: lire('guide/06-tracteur.html') };

/* ── Lecture ─────────────────────────────────────────────────────────────── */
const BORNE_A = '// \u2500\u2500 TAP-1 : d\u00e9but du bloc';
const BORNE_Z = '// \u2500\u2500 TAP-1 : fin du bloc \u2500\u2500';
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');
function bloc(src) {
  const i = src.indexOf(BORNE_A), j = src.indexOf(BORNE_Z);
  if (i < 0 || j < i || src.indexOf(BORNE_A, i + 1) >= 0) return '';
  return src.slice(i, j + BORNE_Z.length);
}
/* La fonction ENTIÈRE, en-tête compris, comptée à l'accolade ; '' si absente ou en double. */
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

/* ── B. Le bac des gestes : le vrai bloc, une horloge, deux lignes, la feuille ── */
function bacGeste(S) {
  const horloge = { t: 1000000 };
  let minuteurs = [], n = 0;
  const env = { appels: { coche: [], bloc: [] } };
  env.avance = ms => {
    const fin = horloge.t + ms;
    for (;;) {
      minuteurs.sort((a, b) => a.at - b.at || a.id - b.id);
      const m = minuteurs[0];
      if (!m || m.at > fin) break;
      minuteurs.shift(); horloge.t = m.at; m.fn();
    }
    horloge.t = fin;
  };
  const el = nom => {
    const L = {};
    return {
      dataset: nom ? { nom } : {},
      addEventListener(type, fn) { (L[type] = L[type] || []).push(fn); },
      fire(type, props) {
        const ev = Object.assign({ type, isPrimary: true, pointerType: 'touch', button: 0,
          clientX: 0, clientY: 0, defaultPrevented: false }, props || {});
        ev.preventDefault = () => { ev.defaultPrevented = true; };
        (L[type] || []).slice().forEach(fn => fn(ev));
        return ev;
      }
    };
  };
  const feuille = el(); feuille.scrollTop = 0;
  const ov = { querySelector: s => (s === '.modal' ? feuille : null) };
  const ctx = {
    window: { scrollY: 0 },
    Date: { now: () => horloge.t },
    setTimeout: (fn, ms) => { const id = ++n; minuteurs.push({ id, at: horloge.t + (ms || 0), fn }); return id; },
    clearTimeout: id => { minuteurs = minuteurs.filter(m => m.id !== id); },
    document: { getElementById: id => (id === 'ovSessionDetail' ? ov : null) },
    toggleSessionParcelle: nom => env.appels.coche.push(nom),
    _chrAjouterAuBloc: nom => env.appels.bloc.push(nom)
  };
  vm.createContext(ctx);
  vm.runInContext(S.bloc, ctx);
  env.ctx = ctx; env.feuille = feuille;
  env.A = el('Les Charmes'); env.B = el('La Combotte');
  ctx._sdArmerLigne(env.A); ctx._sdArmerLigne(env.B); ctx._sdArmerDefil();
  return env;
}

/* ── Le navigateur tactile, au pire cas ──────────────────────────────────── */
const TOLERANCE_NATIVE = 10;   // au-delà, le navigateur ne fait pas de click (ordre de grandeur Chrome / Safari)
/* Un contact complet, doigt posé sur `el`. Le click part dès que le doigt est
   resté dans la tolérance — même après un appui long ou une liste arrêtée. */
function doigt(env, el, o = {}) {
  const x = 100, y = 200;
  el.fire('pointerdown', { clientX: x, clientY: y });
  el.fire('touchstart');
  let max = 0;
  for (const [dx, dy] of (o.bouge || [])) {
    env.avance(10);
    el.fire('pointermove', { clientX: x + dx, clientY: y + dy });
    el.fire('touchmove');
    max = Math.max(max, Math.abs(dx), Math.abs(dy));
  }
  env.avance(o.duree == null ? 80 : o.duree);
  el.fire('pointerup', { clientX: x, clientY: y });
  const fin = el.fire('touchend');
  if (!fin.defaultPrevented && max <= TOLERANCE_NATIVE) {
    el.fire('mousedown'); el.fire('mouseup'); el.fire('click');
  }
}
/* Le doigt part d'une ligne et fait défiler : passé sa tolérance, le navigateur
   prend la main (pointercancel), la feuille défile, les touch* continuent, et
   aucun click ne suit. `enHaut` : la feuille est déjà tout en haut et on la tire
   vers le bas — rien ne défile (overscroll-behavior:none), donc aucun scroll. */
function defiler(env, el, o = {}) {
  const x = 100, y = 400;
  el.fire('pointerdown', { clientX: x, clientY: y });
  el.fire('touchstart');
  env.avance(30);
  el.fire('pointermove', { clientX: x, clientY: y - 6 });
  el.fire('touchmove');
  env.avance(30);
  el.fire('pointercancel');
  for (let k = 0; k < 8; k++) {
    if (!o.enHaut) { env.feuille.scrollTop += 40; env.feuille.fire('scroll'); }
    el.fire('touchmove');
    env.avance(16);
  }
  env.avance(o.tenue || 0);
  el.fire('touchend');
}
/* La liste file sur son élan : un « scroll » à chaque image. */
function lancer(env, ms) {
  for (let t = 0; t < ms; t += 16) { env.feuille.scrollTop += 20; env.feuille.fire('scroll'); env.avance(16); }
}
function souris(env, el, dx) {
  el.fire('pointerdown', { pointerType: 'mouse', clientX: 100, clientY: 100 });
  el.fire('mousedown');
  el.fire('pointermove', { pointerType: 'mouse', clientX: 100 + dx, clientY: 100 });
  el.fire('mousemove');
  env.avance(120);
  el.fire('pointerup', { pointerType: 'mouse', clientX: 100 + dx, clientY: 100 });
  el.fire('mouseup');
  el.fire('click');            // sur ordinateur, le click part même après un glissé dans la ligne
}

/* ── A. Le verdict, cas par cas ──────────────────────────────────────────── */
function verdicts(S) {
  const R = [];
  let V;
  try { V = bacGeste(S).ctx._sdTapVerdict; } catch (e) { return [['le bloc TAP-1 se charge (' + e.message + ')', false]]; }
  const N = 5000000;
  const v = (nom, g, now, dernier, attendu) => {
    let r; try { r = V(g, now, dernier); } catch (e) { r = 'plantage : ' + e.message; }
    R.push(['verdict — ' + nom + ' → ' + attendu, r === attendu]);
  };
  v('l\u2019appui long a déjà agi', { long: true }, N, 0, 'appui-long');
  v('la liste filait encore', { lancee: true }, N, 0, 'liste-lancee');
  v('la feuille a défilé de 40 px pendant le geste', { defil: 40 }, N, 0, 'defilement');
  v('\u2026 ou de 3 px vers le haut', { defil: -3 }, N, 0, 'defilement');
  v('2 px, un arrondi d\u2019écran', { defil: 2 }, N, 0, 'appui');
  v('le navigateur a pris le doigt (pointercancel)', { annule: true }, N, 0, 'defilement');
  v('le doigt a glissé de 17 px', { glisse: 17 }, N, 0, 'glisse');
  v('16 px, encore un appui', { glisse: 16 }, N, 0, 'appui');
  v('599 ms après le dernier geste', {}, N, N - 599, 'rebond');
  v('600 ms après', {}, N, N - 600, 'appui');
  v('sans geste suivi (clavier, lecteur d\u2019écran)', null, N, 0, 'appui');
  return R;
}

/* ── B. Les gestes ───────────────────────────────────────────────────────── */
function gestes(S) {
  const R = [];
  const cas = (nom, jouer, attendu) => {
    let ok = false;
    try { const env = bacGeste(S); jouer(env); ok = !!attendu(env.appels, env); }
    catch (e) { nom += ' (' + e.message + ')'; }
    R.push([nom, ok]);
  };
  const rien = a => a.coche.length === 0 && a.bloc.length === 0;
  cas('un appui franc coche la parcelle, une fois', e => doigt(e, e.A),
    a => a.coche.join() === 'Les Charmes' && !a.bloc.length);
  cas('\u2605 le cas signalé : un défilement parti d\u2019une ligne ne coche RIEN', e => defiler(e, e.A), rien);
  cas('après le défilement, le premier vrai appui compte', e => { defiler(e, e.A); e.avance(250); doigt(e, e.B); },
    a => a.coche.join() === 'La Combotte');
  cas('toucher pour arrêter une liste lancée ne coche rien', e => { lancer(e, 300); doigt(e, e.A); }, rien);
  cas('\u2026 et y laisser le doigt n\u2019ajoute rien au bloc', e => { lancer(e, 300); doigt(e, e.A, { duree: 700 }); }, rien);
  cas('deux appuis coup sur coup n\u2019en font qu\u2019un (la liste vient de se réordonner)',
    e => { doigt(e, e.A); e.avance(250); doigt(e, e.B); }, a => a.coche.join() === 'Les Charmes');
  cas('passé 0,6 s, le deuxième appui compte', e => { doigt(e, e.A); e.avance(700); doigt(e, e.B); },
    a => a.coche.join() === 'Les Charmes,La Combotte');
  cas('un doigt qui tremble (8 px, cahots de cabine) coche quand même',
    e => doigt(e, e.A, { bouge: [[3, -4], [-6, 5], [8, -2]] }), a => a.coche.join() === 'Les Charmes');
  cas('appui long : la parcelle rejoint le bloc, et la coche ne part pas en plus', e => doigt(e, e.A, { duree: 600 }),
    a => a.bloc.join() === 'Les Charmes' && !a.coche.length);
  // Tenu 1,5 s, le click arrive plus de 0,6 s après l'appui long : le rebond ne couvre plus,
  // seule la marque de l'appui long retient la coche (trouvé par la contre-épreuve).
  cas('appui long tenu 1,5 s : toujours pas de coche en plus', e => doigt(e, e.A, { duree: 1500 }),
    a => a.bloc.join() === 'Les Charmes' && !a.coche.length);
  cas('un doigt qui glisse puis s\u2019arrête : ni appui long, ni coche', e => doigt(e, e.A, { bouge: [[0, 30]], duree: 600 }), rien);
  cas('tirer la feuille déjà tout en haut, lentement : rien (seul pointercancel le dit)',
    e => defiler(e, e.A, { enHaut: true, tenue: 600 }), rien);
  cas('souris : un clic coche', e => souris(e, e.A, 0), a => a.coche.join() === 'Les Charmes');
  cas('souris : un glissé de 40 px dans la ligne ne coche pas', e => souris(e, e.A, 40), rien);
  cas('souris : le bouton droit ne lance pas d\u2019appui long, et son menu est retenu', e => {
    e.A.fire('pointerdown', { pointerType: 'mouse', button: 2 }); e.avance(600);
    e.menu = e.A.fire('contextmenu').defaultPrevented;
  }, (a, e) => rien(a) && e.menu === true);
  cas('un click sans doigt (clavier, lecteur d\u2019écran) coche', e => e.A.fire('click'), a => a.coche.join() === 'Les Charmes');
  return R;
}

/* ── C. La décoche ───────────────────────────────────────────────────────── */
function bacDecoche(S, o = {}) {
  const env = { ecrits: [], rendus: 0, confirme: null, chrTap: [] };
  const faites = o.faites || [{ nom: 'Les Charmes', t0: 1, t1: 2, dmin: 42, grp: 1 }, 'La Combotte'];
  const s = { id: 's1', activite: 'Griffage', tracteurId: 't1', parcellesFaites: faites.slice() };
  const w = { tracSessionId: 's1' };
  if (!o.sansConfirm) w.openConfirmDel = (titre, sub, cb, icone, bouton) => { env.confirme = { titre, sub, cb, icone, bouton }; };
  const ctx = {
    window: w, SESSIONS: [s], TRACTEURS_LIST: [], REPARATEUR: {}, ACTIVITES: [{ nom: 'Griffage', h_ha: 5 }],
    sdSkipMode: false, navigator: {}, document: { getElementById: () => null },
    showToast: () => {}, setTimeout: () => 0, _openOv: () => {}, _mvIcon: () => '', _actIcone: () => '',
    _chronoEnabledForSession: () => !!o.chrono,
    _chrTapParcelle: nom => env.chrTap.push(nom),
    _saveData: k => env.ecrits.push(k),
    renderSessionProgress: () => {}, renderSDParcelles: () => { env.rendus++; },
    _recalcPlantationTrous: () => false,
    // SESS-1 (§168) : la décoche lit la mesure en cours et s'inscrit dans la boîte noire.
    _chrono: { bloc: [], pauseOuvert: null }, _chrTrace: () => {}, _chrFmtDur: m => m + ' min',
    _chrReprendreParcelle: nom => env.chrTap.push('reprise:' + nom)
  };
  vm.createContext(ctx);
  vm.runInContext([S.chrNom, S.chrDur, S.chrMes, S.sdnorm, S.decocher, S.toggle, 'var _ocvNomParcelle=null;'].join('\n'), ctx);
  env.ctx = ctx; env.s = s;
  env.noms = () => s.parcellesFaites.map(x => (typeof x === 'string' ? x : x.nom)).join();
  return env;
}
function decoche(S) {
  const R = [];
  const cas = (nom, f) => { let ok = false; try { ok = !!f(); } catch (e) { nom += ' (' + e.message + ')'; } R.push([nom, ok]); };
  cas('toucher une parcelle faite demande confirmation, et ne décoche rien encore', () => {
    const e = bacDecoche(S); e.ctx.toggleSessionParcelle('Les Charmes');
    return e.confirme && e.noms() === 'Les Charmes,La Combotte' && !e.ecrits.length;
  });
  const drole = 'Clos "L\'A\u00een\u00e9" & Co';
  cas('la confirmation dit ce qui sera perdu (le temps mesuré) et nomme la parcelle telle quelle', () => {
    const e = bacDecoche(S, { faites: [{ nom: drole, dmin: 12 }] }); e.ctx.toggleSessionParcelle(drole);
    return /temps mesur/.test(e.confirme.sub) && e.confirme.titre.includes(drole) && e.confirme.bouton === 'D\u00e9cocher';
  });
  cas('une valeur saisie (les trous) est annoncée comme effacée', () => {
    const e = bacDecoche(S, { faites: [{ nom: 'A', data: { Trous: '120' } }] }); e.ctx.toggleSessionParcelle('A');
    return /valeur saisie/.test(e.confirme.sub);
  });
  cas('confirmer décoche cette parcelle, et elle seule, puis enregistre et redessine', () => {
    const e = bacDecoche(S); e.ctx.toggleSessionParcelle('Les Charmes'); e.confirme.cb();
    return e.noms() === 'La Combotte' && e.ecrits.includes('sessions') && e.rendus === 1;
  });
  cas('\u2605 la parcelle est retrouvée PAR SON NOM à la confirmation (la liste a bougé entre-temps)', () => {
    const e = bacDecoche(S); e.ctx.toggleSessionParcelle('La Combotte');
    e.s.parcellesFaites.unshift('Champ de la Croix');   // un autre appareil a écrit entre l'appui et la confirmation
    e.confirme.cb();
    return e.noms() === 'Champ de la Croix,Les Charmes';
  });
  cas('déjà décochée ailleurs : la confirmation ne retire rien d\u2019autre', () => {
    const e = bacDecoche(S); e.ctx.toggleSessionParcelle('Les Charmes');
    e.s.parcellesFaites.splice(0, 1); e.confirme.cb();
    return e.noms() === 'La Combotte';
  });
  cas('sans boîte de confirmation chargée : la décoche se fait quand même (repli)', () => {
    const e = bacDecoche(S, { sansConfirm: true }); e.ctx.toggleSessionParcelle('Les Charmes');
    return e.noms() === 'La Combotte';
  });
  cas('cocher reste d\u2019un seul geste, sans confirmation', () => {
    const e = bacDecoche(S); e.ctx.toggleSessionParcelle('Vieilles Vignes');
    return !e.confirme && e.noms() === 'Les Charmes,La Combotte,Vieilles Vignes';
  });
  cas('chrono allumé : toucher une parcelle à faire démarre la mesure, sans confirmation', () => {
    const e = bacDecoche(S, { chrono: true }); e.ctx.toggleSessionParcelle('Vieilles Vignes');
    return !e.confirme && e.chrTap.join() === 'Vieilles Vignes';
  });
  return R;
}

/* ── D. Le câblage et l'accompagnement ───────────────────────────────────── */
function cablage(S) {
  const R = [];
  const T = nu(S.trac);
  const rsd = fonction(S.trac, 'renderSDParcelles');
  R.push(['renderSDParcelles arme chaque ligne par _sdArmerLigne, et la feuille par _sdArmerDefil',
    /querySelectorAll\('\[data-action="coche"\]'\)\.forEach\(_sdArmerLigne\)/.test(rsd) && /_sdArmerDefil\(\)/.test(rsd)]);
  R.push(['plus aucun touchend ni mouseup dans tracteur.js : la coche ne part plus au lever du doigt',
    !/addEventListener\('touchend'/.test(T) && !/addEventListener\('mouseup'/.test(T)]);
  const C = S.css.replace(/\/\*[\s\S]*?\*\//g, '');
  const regles = C.match(/(^|\n)\.sdp-row\{[^}]*\}/g) || [];
  const regle = regles.length === 1 ? regles[0] : '';
  R.push(['la ligne : ni zoom au double appui, ni sélection, ni menu à l\u2019appui long',
    /touch-action:\s*manipulation/.test(regle) && /[;{]user-select:\s*none/.test(regle)
      && /-webkit-user-select:\s*none/.test(regle) && /-webkit-touch-callout:\s*none/.test(regle)]);
  const aide = S.utils.slice(S.utils.indexOf('var MV_AIDE = {'), S.utils.indexOf('var MV_AIDE_DEFAUT'));
  const fiche = k => { const i = aide.indexOf('\n  ' + k + ': {'); const j = aide.indexOf('\n  }', i); return i < 0 ? '' : aide.slice(i, j); };
  R.push(['fiche Tracteur : le défilement et la confirmation sont dits',
    /Faire défiler la liste ne coche rien/.test(fiche('tracteur')) && /demande une confirmation/.test(fiche('tracteur'))]);
  R.push(['\u00ab Changer d\u2019année \u00bb a quitté la fiche Tracteur pour la fiche Planning',
    !/Changer d\u2019année/.test(fiche('tracteur')) && /Changer d\u2019année/.test(fiche('planning'))]);
  R.push(['le guide Tracteur dit le défilement et la confirmation',
    /Faire défiler la liste ne coche rien/.test(S.guide) && /Décocher demande une confirmation/.test(S.guide)]);
  R.push(['la FAQ des trous ne promet plus une décoche d\u2019un geste', !/<b>décochez puis recochez<\/b>/.test(S.guide)]);
  R.push(['\u00ab Quoi de neuf \u00bb 7.53 annonce le défilement en premier',
    /\{ v: '7\.53', items: \[\s*\{ emoji: '[a-z]+', titre: 'Faire défiler/.test(S.utils)]);
  return R;
}

function mesurer(src) {
  const S = { trac: src.trac, css: src.css, utils: src.utils, guide: src.guide,
    bloc: bloc(src.trac),
    toggle: fonction(src.trac, 'toggleSessionParcelle'),
    decocher: fonction(src.trac, '_sdDecocher'),
    chrNom: fonction(src.trac, '_chrNom'),
    chrDur: fonction(src.trac, '_chrDur'),
    chrMes: fonction(src.trac, '_chrMes'),
    sdnorm: fonction(src.trac, '_sdNorm') };
  const manque = ['bloc', 'toggle', 'decocher', 'chrNom', 'chrDur', 'chrMes', 'sdnorm'].filter(k => !S[k]);
  const R = [['le bloc TAP-1 et les quatre fonctions se lisent dans tracteur.js'
    + (manque.length ? ' (manque : ' + manque.join(', ') + ')' : ''), !manque.length]];
  if (manque.length) return R;
  return R.concat(verdicts(S), gestes(S), decoche(S), cablage(S));
}

/* ── Référence ───────────────────────────────────────────────────────────── */
let ok = 0, ko = 0;
console.log('\n\u2500\u2500 UN APPUI N\u2019EST PAS UN DÉFILEMENT \u2014 lot TAP-1\n');
for (const [nom, cond] of mesurer(BASE)) {
  if (cond) { ok++; console.log('  \x1b[32m\u2713\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m\u2717\x1b[0m ' + nom); }
}
console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('  contre-épreuve non jouée : la référence est rouge'); process.exit(1); }

/* ── Contre-épreuves ─────────────────────────────────────────────────────── */
const ANCIEN_GESTE = `function _sdArmerLigne(el){
    var _lp=null,_tire=false;
    function _dn(){_tire=false;_lp=setTimeout(function(){_tire=true;_chrAjouterAuBloc(el.dataset.nom);},480);}
    function _up(){clearTimeout(_lp);if(!_tire)toggleSessionParcelle(el.dataset.nom,el);}
    function _cx(){clearTimeout(_lp);}
    el.addEventListener('touchstart',_dn,{passive:true});
    el.addEventListener('touchend',function(e){e.preventDefault();_up();});
    el.addEventListener('touchmove',_cx,{passive:true});
    el.addEventListener('mousedown',_dn);
    el.addEventListener('mouseup',_up);
    el.addEventListener('mouseleave',_cx);
}`;
/* Une mutation : dans le fichier `f`, ou seulement dans la fonction `dans` —
   l'ancre doit y exister UNE fois, sinon l'injection est déclarée morte. */
const DEFAUTS = [
  { nom: '\u2605 l\u2019ancien geste revient, mot pour mot (la coche au lever du doigt)', f: 'trac',
    remplacerFonction: '_sdArmerLigne', vers: ANCIEN_GESTE },
  { nom: 'la garde du défilement est retirée du verdict', f: 'trac',
    de: "if(g.annule||Math.abs(g.defil||0)>2) return 'defilement';", vers: "if(false) return 'defilement';" },
  { nom: 'une liste lancée n\u2019est plus reconnue', f: 'trac',
    de: 'lancee:(Date.now()-_sdDernierDefil)<_SD_LANCEE_MS', vers: 'lancee:false' },
  { nom: 'le rebond disparaît (0 ms)', f: 'trac', de: '_SD_REBOND_MS=600', vers: '_SD_REBOND_MS=0' },
  { nom: 'le glissement du doigt n\u2019est plus mesuré', f: 'trac', de: 'if(d>g.glisse) g.glisse=d;', vers: '' },
  { nom: 'l\u2019appui long ne marque plus le geste (la coche part en plus)', f: 'trac', de: 'g.long=true; ', vers: '' },
  { nom: 'pointercancel n\u2019est plus écouté', f: 'trac',
    de: "  el.addEventListener('pointercancel',function(){ var g=_sdG; if(g&&g.el===el){ g.annule=true; _sdStopLong(g); } });\n", vers: '' },
  { nom: 'la décoche redevient immédiate', f: 'trac', dans: 'toggleSessionParcelle',
    de: "if(typeof window.openConfirmDel==='function'){", vers: 'if(false){' },
  { nom: 'la confirmation reprend la PREMIÈRE parcelle au lieu de la chercher par son nom', f: 'trac', dans: '_sdDecocher',
    de: 'var i=s.parcellesFaites.findIndex(function(x){return _chrNom(x)===nom;});', vers: 'var i=0;' },
  { nom: 'la ligne peut de nouveau appeler le menu à l\u2019appui long', f: 'css', dansRegle: '.sdp-row{',
    de: '-webkit-touch-callout:none;', vers: '' },
  { nom: 'la fiche Tracteur retrouve \u00ab Changer d\u2019année \u00bb', f: 'utils',
    de: "      ['R\u00f4le Tractoriste requis'", vers: "      ['Changer d\u2019ann\u00e9e', \"x\"],\n      ['R\u00f4le Tractoriste requis'" }
];
function injecter(d) {
  const src = BASE[d.f];
  const un = (texte, motif) => texte.split(motif).length - 1 === 1;
  if (d.remplacerFonction) {
    const f = fonction(src, d.remplacerFonction);
    if (!f || !un(src, f)) return null;
    return src.replace(f, d.vers);
  }
  if (d.dans) {
    const f = fonction(src, d.dans);
    if (!f || !un(src, f) || !un(f, d.de)) return null;
    return src.replace(f, f.replace(d.de, d.vers));
  }
  if (d.dansRegle) {
    const i = src.indexOf('\n' + d.dansRegle);
    if (i < 0 || src.indexOf('\n' + d.dansRegle, i + 1) >= 0) return null;
    const j = src.indexOf('}', i);
    const r = src.slice(i, j + 1);
    if (!un(r, d.de)) return null;
    return src.slice(0, i) + r.replace(d.de, d.vers) + src.slice(j + 1);
  }
  if (!un(src, d.de)) return null;
  return src.replace(d.de, d.vers);
}
let det = 0; const rates = [];
for (const d of DEFAUTS) {
  const mute = injecter(d);
  if (mute == null) { console.log('  \x1b[31m\u2717\x1b[0m injection NON POSÉE (ancre absente ou multiple) : ' + d.nom); rates.push(d.nom); continue; }
  const rouges = mesurer(Object.assign({}, BASE, { [d.f]: mute })).filter(r => !r[1]).length;
  if (rouges) { det++; console.log('    DÉTECTÉ  ' + d.nom + ' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'); }
  else { rates.push(d.nom); console.log('  \x1b[31m\u2717\x1b[0m NON DÉTECTÉ  ' + d.nom); }
}
console.log('');
if (rates.length) { console.log('  \x1b[31m' + rates.length + ' défaut(s) passent inaperçus\x1b[0m\n'); process.exit(1); }
console.log('  Les ' + det + ' défauts sont détectés.\n');
process.exit(0);
