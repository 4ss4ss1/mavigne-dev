/* ───────────────────────────────────────────────────────
   HARNAIS — PIL-RANGE-2a (§443) : LA BARRE « VOUS REGARDEZ »
   Lancer :          node scripts/mv-harnais-pilrange2a.mjs
   Contre-épreuves : node scripts/mv-harnais-pilrange2a.mjs --contre

   POURQUOI IL EXISTE
   Maquette du rangement du Pilotage validée par Nico (23/10) : une seule barre, en haut, lue par tout le module —
   la campagne, l'année vigne ou l'exercice, l'élément regardé, ses dates et le jour où l'on est. Elle remplace le fil
   d'Ariane et sort le choix du cadre de l'onglet L'année, SANS état nouveau : _PIL_SCOPE (camp, cadre, recul) rendu
   visible. Ce harnais EXÉCUTE les vraies fonctions de pilotage.js (_pilCrumbHtml, _pilPorteeMode, _pilPorteePeriodes,
   _pilPorteePeriode, _pilPorteeCampDefaut, _pilPorteeChoisir, _pilPorteeBornes, _pilDfr, _pilAnnOrd) :
   1. le segment marque ce qu'on regarde ; l'exercice et l'année vigne portent leurs flèches et leurs dates ;
   2. la campagne porte son nom (qui ouvre la liste) et ses dates, avec « Nᵉ jour sur M » ;
   3. « La campagne » sans campagne choisie prend la période active, sinon celle en cours, sinon la dernière commencée ;
   4. l'année vigne et l'exercice quittent la campagne et écrivent le cadre par _pilCadreSet ;
   5. les dates : à venir, terminé, le jour où l'on est ; rien d'inventé sans dates ;
   et lit sur le texte : les gestes passent par la portée, la liste se remplit à l'ouverture et se ferme ailleurs,
   le fil d'Ariane et le cadre de L'année ont disparu, les styles et le téléphone, la liste joue ce fichier.
   ★ PORTEE-1 (§591) : la barre ne reste que sur Économie › Le détail et ne choisit plus que l'ANNÉE (_pilCrumbAnnee) ; « La
     campagne », sa liste et sa campagne par défaut sont partis — la campagne se choisit à la pastille du haut (mv-harnais-portee1).
     Ce harnais garde ce qui reste de la barre : 1, 4 (sans la campagne), 5, et le texte qui la tient.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const PERS = [{ nom: 'Hiver 2025-26', debut: '2025-11-16', fin: '2026-03-15' }, { nom: 'Été 2026', debut: '2026-06-15', fin: '2026-09-14' },
  { nom: 'Automne 2026', debut: '2026-09-15', fin: '2026-11-15' }, { nom: 'Hiver 2026-27', debut: '2026-11-16', fin: '2027-03-15' }, { nom: 'Sans dates' }];
function monter(S, o) {
  const scope = Object.assign({ camp: null, cadre: 'exo', recul: 0 }, o.scope || {}); const ecrit = [];
  const ctx = { _PIL_SCOPE: scope, _pilPtOuvert: false /* TETE-4C (§579) : le choix replié, l'état que lit la barre */, window: { _cmpVisibles: () => o.pers || PERS, _pilSaison: () => (o.active ? { nom: o.active } : null), logError: () => {} },
    _pilAnCadre: () => (o.ca === null ? null : Object.assign({ court: '2026-27', titre: 'Exercice 2026-27', d0: '2026-08-01', d1: '2027-07-31', recul: 0, prevOk: true }, o.ca || {})),
    _pilAnAuj: () => o.auj || '2026-10-23', _pilEsc: (x) => String(x).replace(/</g, '&lt;'), _mvInfoBtn: (k) => '<i data-k="' + k + '"></i>',
    _pilScopeSet: (c) => { scope.camp = c || null; ecrit.push('camp:' + scope.camp); }, _pilCadreSet: (c) => { scope.cadre = (c === 'vig') ? 'vig' : 'exo'; ecrit.push('cadre:' + scope.cadre); } };
  vm.createContext(ctx);
  vm.runInContext(['_pilCrumbAnnee', '_pilPorteeMode', '_pilPorteeChoisir', '_pilPorteeBornes', '_pilDfr', '_pilAnnOrd'].map((n) => corps(S.pil, n)).join('\n'), ctx);
  return { ctx, scope, ecrit };
}
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const sur = (f) => { try { return f(); } catch (e) { return 'PLANTE ' + (e && e.message); } };
const on = (h, m) => new RegExp('data-portee="' + m + '" class="on" aria-pressed="true"').test(h);

function jouer(S) {
  // ① l'exercice, l'année vigne
  const E = monter(S, {}); const hE = sur(() => E.ctx._pilCrumbAnnee());
  t('① l’étiquette et les deux choix, « L’exercice » marqué — plus « La campagne » (PORTEE-1, §591 : elle est à la pastille du haut)', /Vous regardez/.test(hE) && on(hE, 'exo') && !on(hE, 'vig') && !/data-portee="camp"/.test(hE) && !/La campagne/.test(hE) && /ann\\u00e9e vigne|année vigne/.test(hE), hE.slice(0, 160));
  t('① l’année regardée et ses flèches (le chemin data-anrecul de toujours), la fiche « i »', /data-anrecul="-1"/.test(hE) && /data-anrecul="1"[^>]*disabled/.test(hE) && />2026-27</.test(hE) && /data-k="pil\.cadres"/.test(hE));
  t('① ses dates et le jour où l’on est (23 oct. = 84ᵉ jour sur 365)', /du 1 août au 31 juil\. · 84\u1d49 jour sur 365/.test(hE), (hE.match(/pil-ptbornes">([^<]*)/) || [])[1]);
  const V = monter(S, { scope: { cadre: 'vig' }, ca: { court: '2026', d0: '2026-09-01', d1: '2027-08-31' } }); const hV = sur(() => V.ctx._pilCrumbAnnee());
  t('① « L’année vigne » marquée, ses dates', on(hV, 'vig') && /du 1 sept\. au 31 août · 53\u1d49 jour sur 365/.test(hV));
  const N = monter(S, { ca: null });
  t('① exercice impossible à borner : le bouton qui mène au réglage', /data-diag="exercice"/.test(sur(() => N.ctx._pilCrumbAnnee())));
  // ④ l'année vigne, l'exercice — la campagne ne se pose plus (PORTEE-1)
  const Y = monter(S, { scope: { cadre: 'exo' } }); Y.ctx._pilPorteeChoisir('vig');
  t('④ « L’année vigne » écrit le cadre (_pilCadreSet), rien d’autre', Y.scope.cadre === 'vig' && Y.ecrit.join() === 'cadre:vig', Y.ecrit.join());
  Y.ctx._pilPorteeChoisir('exo');
  t('④ « L’exercice » de même', Y.scope.cadre === 'exo');
  Y.ctx._pilPorteeChoisir('camp');
  t('④ « La campagne » ne se pose plus : la portée reste sur le cadre', Y.scope.camp === null && Y.ctx._pilPorteeMode() === 'exo', String(Y.scope.camp));
  // ⑤ les dates
  const B = E.ctx._pilPorteeBornes;
  t('⑤ à venir, terminé, jour N sur M', /à venir$/.test(B('2026-11-16', '2027-03-15')) && /terminé$/.test(B('2026-06-15', '2026-09-14')) && /1\u1d49 jour sur 1$/.test(B('2026-10-23', '2026-10-23')));
  t('⑤ sans dates : rien d’inventé', B(null, '2026-01-01') === '' && B('', '') === '');
  // ⑥ sur le texte
  const P = S.pil, bind = corps(P, '_pilBindContent');
  t('⑥ le segment passe par la portée : _pilPorteeChoisir, puis la barre et l’onglet se repeignent', /closest\('\[data-portee\]'\)[\s\S]{0,80}_pilPorteeChoisir\(_ptV\.getAttribute\('data-portee'\)\); _pilPortee\(\); _pilFillContent\(_pilData\(\)\)/.test(bind));
  t('⑥ la liste des campagnes est partie (PORTEE-1) : plus de data-ptpop, de _pilPorteePopHtml, de puces data-etpc', !/data-ptpop|_pilPorteePopHtml|data-etpc/.test(P));
  const Pnu = P.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');   // les commentaires d'histoire ne comptent pas
  t('⑥ plus de fil d’Ariane (croix, racine) ni de cadre dans L’année', !/pil-cr-x|pil-cr-root|data-ancadre/.test(Pnu) && !/function _pilAnCadreHtml\(/.test(P) && /avis=_pilAnAvisHtml\(\);/.test(corps(P, '_pecViewSynthese')));
  t('⑥ aucun état nouveau : la barre ne lit et n’écrit que _PIL_SCOPE', !/_PIL_SCOPE\.(mode|portee|vue)\b/.test(P) && !/var _PIL_PORTEE/.test(P));
  t('⑥ sur téléphone l’étiquette et les dates s’effacent', /max-width:700px[\s\S]{0,900}\.pil-ptlab,\.pil-ptbornes\{display:none\}/.test(P));
  t('⑦ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pilrange2a.mjs'") > 0 && S.liste.indexOf("mv-harnais-pilrange2a.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, a, b) => { if (S.pil.split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 60)); return Object.assign({}, S, { pil: S.pil.split(a).join(b) }); };
  const mutants = [
    ['le segment ne marque plus ce qu’on regarde', (S) => R(S, "class=\"'+(mode===m?'on':'')+'\"", "class=\"\"")],
    ['« La campagne » revient dans la barre', (S) => R(S, "+B('exo','L\\u2019exercice')", "+B('camp','La campagne')+B('exo','L\\u2019exercice')")],
    ['« La campagne » se pose de nouveau', (S) => R(S, "function _pilPorteeChoisir(m){ _pilCadreSet(m==='vig'?'vig':'exo'); }", "function _pilPorteeChoisir(m){ if(m==='camp'){ _pilScopeSet('Automne 2026'); return; } _pilCadreSet(m==='vig'?'vig':'exo'); }")],
    ['le jour se compte à partir de zéro', (S) => R(S, "t+=' \\u00b7 '+(o-a+1)+'\\u1d49 jour sur '", "t+=' \\u00b7 '+(o-a)+'\\u1d49 jour sur '")],
    ['les dates inventées sans bornes', (S) => R(S, "  if(!d0 || !d1) return '';\n", '')],
    ['un état nouveau à côté de la portée', (S) => R(S, "function _pilPorteeMode(){ return (_PIL_SCOPE.cadre", "function _pilPorteeMode(){ _PIL_SCOPE.mode=1; return (_PIL_SCOPE.cadre")],
    ['la liste des harnais ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pilrange2a.mjs'").join("mv-harnais-pilrangeX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m non injecté (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + ko + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
