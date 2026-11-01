/* ───────────────────────────────────────────────────────
   HARNAIS — PHENO-1D (§509) : NOTER LE STADE — LA DATE EN UN APPUI, AUCUN RETOUR EN ARRIÈRE, UNE QUESTION AVANT LES GRANDS SAUTS
   Lancer :          node scripts/mv-harnais-pheno1d.mjs
   Contre-épreuves : node scripts/mv-harnais-pheno1d.mjs --contre

   POURQUOI IL EXISTE
   Nico (01/11) : « un stade ne peut pas revenir en arrière » — par cuvée surtout, où des parcelles sont déjà plus avancées ; et
   « un grand saut en avant, une petite garde : vous êtes sûr ? — pas un blocage ». La maquette de la date (v3) a été validée.
   Ce harnais JOUE les vraies fonctions (extraites d'app.js) : la garde à une date (la note d'avant, celle d'après, celle du jour),
   le saut d'une phase entière et son message, l'enregistrement qui refuse un retour en arrière même appelé directement, le
   remplacement du jour et son « Annuler », la date du relevé, la fenêtre entière (une parcelle, une cuvée) avec un faux document ;
   il garde la commune lue par son nom, le thème clair qui fixe les calendriers, le smoke hermétique et sa limite en CI.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), utils: lire('src/utils.js'), html: lire('index.html'), css: lire('src/styles.css'), charte: lire('src/charte.css'),
  tutos: lire('src/tutos.js'), wn: lire('src/whats-new.js'), smoke: lire('scripts/smoke.mjs'), ci: lire('.github/workflows/ci.yml'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
const FN = ['_phenoAdm', '_phenoStade', '_phenoAn', '_phenoListe', '_phenoDernier', '_phenoCepages', '_phenoEnSaison', '_phenoGroupe', '_phenoCuvees', '_phenoJour', '_phenoLib',
  '_phenoIso', '_phenoDecale', '_phenoEcart', '_phenoJm', '_phenoDateLongue', '_phenoDateCourte', '_phenoCap', '_phenoRel', '_phenoDat', '_phenoDateDe', '_phenoGarde', '_phenoPermis', '_phenoSaut',
  '_phenoNoter', '_phenoChoisir', '_phenoEnregistrer', '_phenoFenCibles', '_phenoJoursHtml', '_phenoFenetre', '_phenoCorriger', '_phenoSupprimer', '_phenoCuvCoche', '_phenoReponse', '_phenoDate',
  '_phenoNoterCuvee', '_phenoAjouter', '_phenoNoterDirect', '_phenoReleveRaz', '_phenoReleveDate'];
function monde(S, o) {
  o = o || {};
  const P = [{ nom: 'Billard Petite', pid: 'b1', cepage: 'Pinot Noir', surface: '0.62' }, { nom: 'Au Velle', pid: 'b2', cepage: 'Pinot Noir', surface: '0.61', commune: { nom: 'Gevrey-Chambertin', lat: 47.2, lng: 4.9 } },
    { nom: 'Ergot', pid: 'b3', cepage: 'Pinot Noir', surface: '0.45' }];
  const pheno = o.pheno || { 2026: [{ pid: 'b1', nom: 'Billard Petite', b: 9, d: '2026-04-16', t: 'a' }, { pid: 'b1', nom: 'Billard Petite', b: 12, d: '2026-04-27', t: 'b' }, { pid: 'b1', nom: 'Billard Petite', b: 16, d: '2026-05-07', t: 'c' },
    { pid: 'b2', nom: 'Au Velle', b: 57, d: '2026-05-12', t: 'd' }] };
  const el = { 'phn-titre': { textContent: '' }, 'phn-sub': { textContent: '' }, 'phn-corps': { innerHTML: '' }, 'phd-corps': { innerHTML: '' }, ovPheno: { classList: { contains: () => !!o.ouvert } } };
  const toasts = [], ouverts = [], fermes = []; let saves = 0, vues = 0;
  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ctx = { window: { PARCELLES: P, PHENO: pheno, currentUser: { nom: 'Nico' }, CAVE_ELEVAGE: { cuvees: o.cuvees || [] } }, isAdmin: () => o.adm !== false, todayStr: () => o.auj || '2026-05-14',
    document: { getElementById: (id) => el[id] || null }, saveData: () => { saves++; }, _escHtml: esc, _escAttr: esc, _mvIcon: (n) => '<i data-ic="' + n + '"></i>',
    showToastAnnuler: (m, f) => toasts.push({ m, f }), _phenoRafraichir() {}, openOv: (id) => ouverts.push(id), closeOv: (e, id) => fermes.push(id), _phenoRendreVue: () => { vues++; } };
  vm.createContext(ctx);
  const code = [variable(S.app, '_PHENO_STADES'), variable(S.app, '_PHENO_MOIS'), variable(S.app, '_PHENO_MOIS_L'), variable(S.app, '_PHENO_SEM'),
    "var _phenoP=null, _phenoB=null, _phenoFen={ jour:'auj', autre:'', corr:false, confirme:false, coches:{}, cible:null }, _phenoCuv=null, _phenoMode='parcelle', _phenoFiltre=false, _phenoOuverte='', _phenoRelJour='auj', _phenoRelAutre='', _phenoRelDu='', _phenoQuestion=null, _phenoMenu=false;",
    fonction(S.utils, 'function _mvCommuneNom(').replace(/^/, ''),
    ...FN.map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nthis.F=function(){ return { p:_phenoP, b:_phenoB, fen:_phenoFen, q:_phenoQuestion }; }; this.rel=function(k,a){ _phenoRelJour=k; _phenoRelAutre=a||\'\'; _phenoRelDu=todayStr(); };'
    + '\nthis.garde=_phenoGarde; this.permis=_phenoPermis; this.saut=_phenoSaut; this.dateDe=_phenoDateDe; this.ajouter=_phenoAjouter; this.direct=_phenoNoterDirect; this.commune=_mvCommuneNom;'
    + '\nthis.noter=_phenoNoter; this.choisir=_phenoChoisir; this.enregistrer=_phenoEnregistrer; this.reponse=_phenoReponse; this.date=_phenoDate; this.corriger=_phenoCorriger; this.cuvee=_phenoNoterCuvee; this.coche=_phenoCuvCoche;';
  vm.runInContext(code, ctx);
  const L = () => (ctx.window.PHENO['2026'] || []).filter((e) => e && e.pid === 'b1');
  return { ctx, el, toasts, ouverts, fermes, saves: () => saves, vues: () => vues, P, L, corps: () => el['phn-corps'].innerHTML };
}
const tuile = (h, b) => { const m = new RegExp('<button[^>]*data-b="' + b + '"[^>]*>[\\s\\S]*?</button>').exec(h); return m ? m[0] : ''; };
function jouer(S) {
  // ① la garde à une date
  const A = monde(S); const p = A.P[0];
  const g1 = A.ctx.garde(p, '2026-05-14'), g2 = A.ctx.garde(p, '2026-05-01'), g3 = A.ctx.garde(p, '2026-04-10');
  t('① la garde : à une date, entre la note d’avant (la plus avancée) et celle d’après — la vigne ne revient pas en arrière',
    g1.f && g1.f.b === 16 && !g1.c && !A.ctx.permis(g1, 12) && A.ctx.permis(g1, 16) && A.ctx.permis(g1, 55)
    && g2.f.b === 12 && g2.c.b === 16 && !A.ctx.permis(g2, 9) && A.ctx.permis(g2, 12) && A.ctx.permis(g2, 16) && !A.ctx.permis(g2, 55));
  t('① une date plus ancienne reste possible : le coton au 10 avril, quand le débourrement est du 16', !g3.f && g3.c.b === 9 && A.ctx.permis(g3, 5) && A.ctx.permis(g3, 9) && !A.ctx.permis(g3, 12));
  A.ctx.window.PHENO['2026'].push({ pid: 'b1', nom: 'Billard Petite', b: 55, d: '2026-05-14', t: 'z' });
  const g4 = A.ctx.garde(p, '2026-05-14');
  t('① le même jour : la note du jour ne compte pas dans la garde — la corriger reste possible', g4.j && g4.j.b === 55 && g4.f.b === 16 && A.ctx.permis(g4, 16));
  // ② le saut d'une phase entière
  const s61 = A.ctx.saut(g1, 61, '2026-05-14'), s81 = A.ctx.saut(g1, 81, '2026-05-14'), gB = A.ctx.garde(A.P[1], '2026-05-14'), s71 = A.ctx.saut(gB, 71, '2026-05-14');
  t('② un saut d’une phase entière : le message dit ce qui manque et en combien de jours ; une phase voisine ne demande rien',
    A.ctx.saut(g1, 55, '2026-05-14') === null && A.ctx.saut(g1, 16, '2026-05-14') === null && s61 && s61.txt === 'De 6\u20138 feuilles (16) \u00e0 d\u00e9but floraison (61) en 7\u00a0jours, sans les boutons.' && !s61.flo);
  t('② trois phases d’un coup ; la floraison sautée le dit (« Ce qui vient ») ; sans note d’avant, aucune question',
    s81 && /sans les boutons, la floraison ni la grappe\.$/.test(s81.txt) && s81.flo && s71 && /sans la floraison\.$/.test(s71.txt) && s71.flo && A.ctx.saut(g3, 81, '2026-04-10') === null);
  // ③ l'enregistrement : la garde y vit aussi ; le remplacement du jour ; Annuler
  const B = monde(S); const n0 = B.ctx.ajouter([B.P[0]], 9, '2026-05-14');
  t('③ un retour en arrière refusé même en appelant l’enregistrement directement : rien d’écrit, rien d’annoncé', n0 === 0 && B.saves() === 0 && B.toasts.length === 0 && B.L().length === 3);
  B.ctx.ajouter([B.P[0]], 55, '2026-05-14'); B.ctx.ajouter([B.P[0]], 57, '2026-05-14');
  const duJour = B.L().filter((e) => e.d === '2026-05-14');
  t('③ le même jour, la nouvelle note remplace l’ancienne ; le message le dit', duJour.length === 1 && duJour[0].b === 57 && /^Note remplac\u00e9e \u00b7 Billard Petite \u00b7 boutons s\u00e9par\u00e9s \(57\)$/.test(B.toasts[1].m));
  B.toasts[1].f();
  const apres = B.L().filter((e) => e.d === '2026-05-14');
  t('③ « Annuler » rend la note remplacée', apres.length === 1 && apres[0].b === 55);
  const C = monde(S); C.ctx.ajouter([C.P[0], C.P[1]], 16, '2026-05-14');
  t('③ par cuvée : la parcelle déjà plus avancée est écartée, jamais notée ; le message le compte', (C.ctx.window.PHENO['2026'] || []).filter((e) => e.d === '2026-05-14').length === 1 && /\u00b7 1 \u00e9cart\u00e9e$/.test(C.toasts[0].m));
  // ④ la date
  const D = monde(S);
  t('④ la date : aujourd’hui, hier, avant-hier, une autre date ; jamais dans le futur, jamais d’une autre année',
    D.ctx.dateDe('auj', '', '2026-05-14') === '2026-05-14' && D.ctx.dateDe('hier', '', '2026-05-14') === '2026-05-13' && D.ctx.dateDe('avh', '', '2026-05-14') === '2026-05-12'
    && D.ctx.dateDe('autre', '2026-05-09', '2026-05-14') === '2026-05-09' && D.ctx.dateDe('autre', '2026-05-20', '2026-05-14') === '2026-05-14' && D.ctx.dateDe('autre', '2025-05-01', '2026-05-14') === '2026-05-14');
  // ⑤ le relevé : la question avant un grand saut, sous la ligne
  const E = monde(S); E.ctx.direct('Billard Petite', 61);
  const q1 = E.ctx.F().q, avant = E.L().length;
  E.ctx.direct('Billard Petite', 61, true); E.ctx.direct('Billard Petite', 9);
  t('⑤ le relevé : un grand saut pose la question sans rien écrire ; « Oui, noter » écrit ; un retour en arrière ne fait rien',
    q1 && q1.nom === 'Billard Petite' && q1.b === 61 && avant === 3 && E.vues() >= 1 && E.L().length === 4 && E.L().some((e) => e.b === 61 && e.d === '2026-05-14') && E.ctx.F().q === null);
  const E2 = monde(S); E2.ctx.rel('hier'); E2.ctx.direct('Billard Petite', 55);
  t('⑤ le relevé note à la date choisie en tête (hier)', E2.L().some((e) => e.b === 55 && e.d === '2026-05-13'));
  // ⑥ la commune par son nom
  t('⑥ la commune par son nom ({nom, lat, lng} ou une chaîne) — plus jamais « [object Object] » dans le relevé',
    E.ctx.commune({ commune: { nom: 'Gevrey-Chambertin', lat: 1, lng: 2 } }) === 'Gevrey-Chambertin' && E.ctx.commune({ commune: 'Brochon' }) === 'Brochon' && E.ctx.commune({}) === ''
    && fonction(S.app, 'function _phenoRendreVue(').includes('_mvCommuneNom(x.p)') && !fonction(S.app, 'function _phenoRendreVue(').includes('x.p.commune'));
  // ⑦ la fenêtre entière, avec un faux document
  const F = monde(S); F.ctx.noter('Billard Petite');
  let h = F.corps();
  t('⑦ la fenêtre : les stades d’avant grisés et inertes, « dernier noté » cerclé, « suivant » signalé, la garde dite, « La corriger »',
    F.ouverts[0] === 'ovPheno' && F.el['phn-titre'].textContent === 'Billard Petite' && /bloque/.test(tuile(h, 12)) && /disabled/.test(tuile(h, 12)) && !/bloque/.test(tuile(h, 16))
    && /actuel/.test(tuile(h, 16)) && /dernier not\u00e9/.test(tuile(h, 16)) && /prochain/.test(tuile(h, 55)) && /suivant/.test(tuile(h, 55))
    && h.includes('Gris\u00e9s\u00a0: avant 6\u20138 feuilles (16), not\u00e9 le 7 mai.') && h.includes('La note du 7 mai est fausse\u00a0? La corriger') && h.includes('Aujourd\u2019hui') && h.includes('type="date"'));
  F.ctx.choisir(61); F.ctx.enregistrer(); h = F.corps();
  const rien = F.L().length;
  F.ctx.reponse('f', 1);
  t('⑦ un grand saut : la question remplace le bouton, rien n’est écrit avant « Oui, noter »', rien === 3 && h.includes('Vous \u00eates s\u00fbr') && h.includes('sans les boutons') && !h.includes('id="phn-ok"') && F.L().length === 4 && F.fermes.includes('ovPheno'));
  const G = monde(S); G.ctx.noter('Billard Petite'); G.ctx.date('f', 'autre', '2026-05-01'); h = G.corps();
  t('⑦ une autre date : seuls les stades possibles entre les deux notes ; la date écrite en toutes lettres', h.includes('seuls 2\u20133 feuilles (12) \u00e0 6\u20138 feuilles (16) sont possibles') && /bloque/.test(tuile(h, 55)) && !/bloque/.test(tuile(h, 12)) && h.includes('Vendredi 1er mai 2026'));
  G.ctx.date('f', 'auj'); G.ctx.corriger(1); h = G.corps();
  const okCorr = h.includes('Supprimer la note du jeudi 7 mai'); G.ctx.corriger(2);
  t('⑦ corriger : la fenêtre dit quelle note sera supprimée ; la supprimer rouvre les stades d’avant ; « Annuler » la rend', okCorr && !G.L().some((e) => e.b === 16) && G.toasts[0].m === 'Note du 7 mai supprim\u00e9e' && !/bloque/.test(tuile(G.corps(), 12)) && (G.toasts[0].f(), G.L().some((e) => e.b === 16)));
  const H = monde(S, { cuvees: [{ nom: 'Gevrey', millesime: '2025', parcelles: ['Billard Petite', 'Au Velle'] }] }); H.ctx.cuvee('Gevrey'); H.ctx.choisir(55); h = H.corps();
  t('⑦ par cuvée : la parcelle déjà plus avancée écartée avec sa raison, le bouton ne compte que les autres', H.el['phn-titre'].textContent === 'Gevrey' && h.includes('1 parcelle \u00e9cart\u00e9e') && /phn-cl exclue[\s\S]*?D\u00e9j\u00e0 plus avanc\u00e9e\u00a0: boutons s\u00e9par\u00e9s \(57\)/.test(h) && h.includes('Enregistrer pour 1 parcelle'));
  H.ctx.choisir(61); H.ctx.enregistrer(); h = H.corps(); const q2 = h.includes('Billard Petite saute une phase enti\u00e8re.'); H.ctx.reponse('f', 1);
  t('⑦ par cuvée : un saut signalé, une seule question, puis les deux parcelles notées', q2 && (H.ctx.window.PHENO['2026'] || []).filter((e) => e.b === 61).length === 2 && H.toasts[0].m === '2 parcelles \u00b7 d\u00e9but floraison (61)');
  // ⑧ l'écran, les supports, la CI
  t('⑧ la fenêtre de date du relevé ; les gestes neufs exposés ; le tuto suit l’instant de la note (le remplacement ne change pas le compte)',
    S.html.includes('id="ovPhenoDate"') && S.html.includes('id="phd-corps"') && S.app.includes('window._phenoDate=_phenoDate; window._phenoCorriger=_phenoCorriger; window._phenoCuvCoche=_phenoCuvCoche; window._phenoReponse=_phenoReponse; window._phenoMenuDate=_phenoMenuDate;')
    && S.tutos.includes("fait: function (memo) { return !_ouvert('ovPheno') && _phenoT() > (memo.t0 || ''); },") && !S.tutos.includes('_phenoN('));
  t('⑧ le thème clair fixe les calendriers ; le calendrier sous « Autre » ; les deux défauts du sombre corrigés',
    S.charte.includes('#app-root[data-theme="light"],:root[data-theme="light"]{color-scheme:light;}') && S.css.includes('.phn-sous::-webkit-calendar-picker-indicator{position:absolute;inset:0;')
    && S.css.includes('.phr-e.prochain{border-color:var(--accent,#7A2850);background:var(--accent-doux,') && S.css.includes('.phr-ech-pc .phr-e.actuel em{color:var(--sur-inverse,#F5F4F1);}'));
  t('⑧ le smoke hermétique sur le serveur local et sa garde de temps ; sa limite d’étape en CI ; les nouveautés 10.58',
    S.smoke.includes("if (!URL_ARG) return (u.startsWith(baseUrl) || u.startsWith('data:') || u.startsWith('blob:')) ? route.continue() : route.abort();") && S.smoke.includes("const GARDE_MS = parseInt(getArg('--garde', '120000'), 10);")
    && /- name: Smoke — l'app demarre sans exception\n {8}timeout-minutes: 4\n/.test(S.ci) && /export const WHATS_NEW = \[\n  \{ v: '10\.58'/.test(S.wn) && S.wn.includes('Le stade ne revient jamais en arri\u00e8re'));
  t('⑧ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pheno1d.mjs'") > 0 && S.liste.indexOf("mv-harnais-pheno1d.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['la note d’avant ne garde plus (retour en arrière permis)', m('app', 'return (!g.f||b>=g.f.b)&&(!g.c||b<=g.c.b);', 'return (!g.c||b<=g.c.b);')],
    ['la note d’après ne garde plus', m('app', 'return (!g.f||b>=g.f.b)&&(!g.c||b<=g.c.b);', 'return (!g.f||b>=g.f.b);')],
    ['la note du jour compte dans la garde (la corriger devient impossible)', m('app', "    if(e.d<d){ if(!f||b>f.b||(b===f.b&&e.d>f.d)) f=n; }", "    if(e.d<=d){ if(!f||b>f.b||(b===f.b&&e.d>f.d)) f=n; }")],
    ['l’enregistrement ne garde plus', m('app', 'var ok=cibles.filter(function(x){ return _phenoPermis(_phenoGarde(x,d),b); }), ex=cibles.length-ok.length;', 'var ok=cibles.slice(), ex=0;')],
    ['le même jour, la note s’ajoute au lieu de remplacer', m('app', 'var retires=P[an].filter(function(e){ return ok.some(function(x){ return meme(e,x); }); });', 'var retires=[];')],
    ['« Annuler » ne rend pas la note remplacée', m('app', 'Q[an]=Q[an].filter(function(e){ return !(e&&e.t===t); }).concat(retires);', 'Q[an]=Q[an].filter(function(e){ return !(e&&e.t===t); });')],
    ['le saut se déclenche dès la phase voisine', m('app', 'if(z-a<2) return null;', 'if(z-a<1) return null;')],
    ['la floraison sautée ne le dit plus', m('app', 'flo:a<3&&z>3', 'flo:false')],
    ['le relevé enregistre un grand saut sans question', m('app', "  if(!force&&_phenoSaut(g,b,d)){ _phenoQuestion={ nom:nom, b:b }; _phenoRendreVue(); return; }", '')],
    ['la fenêtre enregistre un grand saut sans question', m('app', "  if(!force&&ok.some(function(x){ return _phenoSaut(x.g,b,d); })){ _phenoFen.confirme=true; _phenoFenetre(); return; }", '')],
    ['la commune relue telle quelle', m('app', "var sous=[_phenoCepages(x.p)[0],_mvCommuneNom(x.p)]", "var sous=[_phenoCepages(x.p)[0],x.p.commune]")],
    ['le smoke laisse passer internet', m('smoke', "    if (!URL_ARG) return (u.startsWith(baseUrl) || u.startsWith('data:') || u.startsWith('blob:')) ? route.continue() : route.abort();\n", '')],
    ['le thème clair ne fixe plus les calendriers', m('charte', '#app-root[data-theme="light"],:root[data-theme="light"]{color-scheme:light;}', '')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pheno1d.mjs'").join("mv-harnais-phenoZ.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
