/* ───────────────────────────────────────────────────────
   HARNAIS — CAVEAUJ-2 (§435) : LE CUVIER, LE CHAI, LES DERNIERS GESTES ; L'OUILLAGE AU JOUR OUVRÉ
   Lancer :          node scripts/mv-harnais-caveauj2.mjs
   Contre-épreuves : node scripts/mv-harnais-caveauj2.mjs --contre

   POURQUOI IL EXISTE
   Suite de CAVEAUJ-1 (§434), même maquette validée le 22/10. Et la règle de Nico (23/10) : « ouillage le jour avant le
   jour férié, ou le vendredi si tombe un dimanche ou samedi ». Ce harnais grave :
   1. _mlJourOuvre : samedi et dimanche → vendredi ; un férié → la veille ; un dimanche ou un lundi férié → le vendredi ;
   2. _mlOuillages : l'échéance déplacée garde sa date d'origine (`du`), le cycle suivant part du jour avancé, jamais avant
      aujourd'hui, et un retard reste un retard ; l'agenda dit « avancé du … » ;
   3. le Cuvier passe devant le Chai pendant les vendanges, derrière le reste de l'année ; les deux cartes vivent dans la
      colonne de « Ce qui presse », les derniers gestes après le calendrier ;
   4. les derniers gestes : dix jours, du plus récent au plus ancien ; le décuvage dit vers quelle cuvée ;
   5. la malo d'une cuvée : finie, bloquée, en cours, après la FA, évitée, pas d'analyse ;
   6. boutons et pastilles du jeu commun, aucune classe « maison » de pastille ou de carte, par jetons ;
   7. il est branché dans la liste des contrôles.
   ⚠️ Il ne regarde pas un écran : la preuve au navigateur se fait au lot (captures).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), plan: lire('src/planning.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
function monter(S) {
  const F = new Function('var _MV_FERIES_CACHE={};\n' + corps(S.plan, '_mvEasterMD') + '\n' + corps(S.plan, '_feriesY') + '\nreturn _feriesY;')();
  const code = ['_mlIso', '_mlD', '_mlAddJ', '_mlEcartJ', '_mlFerie', '_mlJourOuvre', '_mlOuillages', '_aujNb', '_aujRecents', '_aujMalo'].map((n) => corps(S.cave, n)).join('\n');
  const stub = 'var window={_feriesY:F}; var CAVE_ELEVAGE=E.e, CAVE_VENDANGE=E.v;'
    + 'function _caveOuille(){ return true; } function _mlSeuil(){ return 14; } function _caveNbTonneaux(){ return 3; }'
    + 'function _caveFutsL(){ return 684; } function _caveFutL(){ return 228; } function _mlVolParFut(){ return 7; }'
    + 'function _vendTriMes(c){ return (c.mesures_fa||[]).slice(); } function _mlNomCuvee(c){ return c.nom+" \\u2019"+String(c.millesime).slice(-2); }'
    + 'function _caveFmlEtat(c){ return c.fml||""; } function _mlFrC(d){ return d; }';
  return (E) => new Function('F', 'E', stub + '\n' + code + '\nreturn {_mlJourOuvre:_mlJourOuvre,_mlOuillages:_mlOuillages,_aujRecents:_aujRecents,_aujMalo:_aujMalo};')(F, E);
}

function verifier(S) {
  const R = []; const T = (nom, ok) => R.push([nom, !!ok]);
  const essai = (nom, f) => { try { T(nom, f()); } catch (e) { T(nom + ' (' + e.message + ')', false); } };
  let mk = null;
  try { mk = monter(S); } catch (e) { T('les fonctions s\u2019extraient (' + e.message + ')', false); return R; }
  const vide = { e: { cuvees: [] }, v: { cuves_vinif: [] } };
  // 1. le jour ouvré d'avant
  essai('samedi et dimanche reviennent au vendredi', () => { const M = mk(vide); return M._mlJourOuvre('2026-10-31') === '2026-10-30' && M._mlJourOuvre('2026-11-08') === '2026-11-06'; });
  essai('un f\u00e9ri\u00e9 revient \u00e0 la veille (11 novembre \u2192 10)', () => mk(vide)._mlJourOuvre('2026-11-11') === '2026-11-10');
  essai('un dimanche f\u00e9ri\u00e9 et un lundi f\u00e9ri\u00e9 reviennent au vendredi (Toussaint 2026, lundi de P\u00e2ques 2027)', () => { const M = mk(vide); return M._mlJourOuvre('2026-11-01') === '2026-10-30' && M._mlJourOuvre('2027-03-29') === '2027-03-26'; });
  essai('un jour ouvr\u00e9 reste o\u00f9 il est', () => mk(vide)._mlJourOuvre('2026-10-28') === '2026-10-28');
  // 2. les ouillages
  const avec = (c) => ({ e: { cuvees: [Object.assign({ nom: 'X', millesime: 2025 }, c)] }, v: { cuves_vinif: [] } });
  essai('une \u00e9ch\u00e9ance du samedi 31 tombe le vendredi 30 et garde sa date d\u2019origine', () => { const o = mk(avec({ id: 'g', last_ouillage: '2026-10-17' }))._mlOuillages('2026-10-22', 4); return o[0].date === '2026-10-30' && o[0].du === '2026-10-31' && o[0].retard === 0; });
  essai('le cycle suivant part du jour avanc\u00e9 (f\u00e9ri\u00e9 du 11 \u2192 10, puis 24)', () => { const o = mk(avec({ id: 'h', last_ouillage: '2026-10-28' }))._mlOuillages('2026-10-29', 4); return o[0].date === '2026-11-10' && o[0].du === '2026-11-11' && o[1] && o[1].date === '2026-11-24' && o[1].du === null; });
  essai('un retard reste un retard, aujourd\u2019hui', () => { const o = mk(avec({ id: 'f', last_ouillage: '2026-10-01' }))._mlOuillages('2026-10-22', 4); return o[0].date === '2026-10-22' && o[0].retard === 7; });
  essai('jamais avant aujourd\u2019hui : d\u00fb un samedi, ouvert le samedi, il reste ce jour-l\u00e0', () => mk(avec({ id: 'b', last_ouillage: '2026-10-10' }))._mlOuillages('2026-10-24', 4)[0].date === '2026-10-24');
  T('l\u2019agenda dit \u00ab avanc\u00e9 du \u2026 \u00bb pour un ouillage d\u00e9plac\u00e9', /o\.du \? \('avanc\\u00e9 du '\+_mlFrJ\(o\.du\)/.test(S.cave));
  // 3. l'ordre et la place
  T('le Cuvier passe devant le Chai pendant les vendanges, derri\u00e8re le reste de l\u2019ann\u00e9e', /return _mlPhase\(\)==='vendange'\?cv\+ch:ch\+cv;/.test(S.cave));
  T('les deux cartes vivent dans la colonne de \u00ab Ce qui presse \u00bb, les derniers gestes apr\u00e8s le calendrier', /\+_aujEtat\(from,parc\)\+'<\/div>'/.test(S.cave) && /\+_aujCal\(sem,from\);\n {2}h\+=_aujRecentsHtml\(from\);/.test(S.cave));
  // 4. les derniers gestes
  const E4 = { e: { cuvees: [{ id: 'v1', nom: 'VV', millesime: 2026 }], operations: [{ type: 'ouillage', date: '2026-10-21', cuvee_id: 'v1', operateur: 'Marie' }, { type: 'soutirage', date: '2026-10-05', cuvee_id: 'v1' }] },
    v: { cuves_vinif: [{ nom: 'Cuve 7', mesures_fa: [{ date: '2026-10-20', densite: 1014, temp_c: 24 }, { date: '2026-10-22', densite: 1012 }], decuvage: { date: '2026-10-21', cuvee_id: 'v1' } }] } };
  essai('les derniers gestes : dix jours, du plus r\u00e9cent au plus ancien', () => { const ev = mk(E4)._aujRecents('2026-10-22'); return ev.length === 4 && ev[0].d === '2026-10-22' && ev[3].d === '2026-10-20' && !ev.some((e) => e.d === '2026-10-05'); });
  essai('le d\u00e9cuvage dit vers quelle cuv\u00e9e', () => mk(E4)._aujRecents('2026-10-22').some((e) => e.t === 'D\u00e9cuvage' && /Cuve 7 \u2192 VV \u201926/.test(e.q)));
  // 5. la malo d'une cuvée
  essai('la malo : finie, bloqu\u00e9e, en cours, apr\u00e8s la FA, \u00e9vit\u00e9e, pas d\u2019analyse', () => {
    const M = mk({ e: { cuvees: [] }, v: { cuves_vinif: [{ decuvage: { cuvee_id: 'n26', fa_finie: false } }] } });
    const f = M._aujMalo({ id: 'a' }, { finie: true }), b = M._aujMalo({ id: 'b' }, { p: { etat: 'bloquee', mal: 1.4 } }), e = M._aujMalo({ id: 'c' }, { p: { etat: 'normal', mal: 0.62, date: '2027-03-03' } });
    const fa = M._aujMalo({ id: 'n26' }, {}), r = M._aujMalo({ id: 'd' }, null), s = M._aujMalo({ id: 'e', fml: 'sans' }, null);
    return f[0] === 'Finie' && f[1] === 'mvpas-fait' && b[0] === 'Bloqu\u00e9e \u00b7 1,4\u00a0g/L' && b[1] === 'mvpas-retard' && e[1] === 'mvpas-encours' && /fin vers le 2027-03-03/.test(e[2])
      && fa[0] === 'Apr\u00e8s la FA' && r[0] === 'Pas d\u2019analyse' && s[0] === '\u00c9vit\u00e9e';
  });
  // 6. jeu commun, jetons
  let rendu = '';
  try { rendu = ['_aujCuveLigne', '_aujChaiLigne', '_aujEtat', '_aujRecentsHtml'].map((n) => corps(S.cave, n)).join('\n'); } catch (e) { rendu = ''; }
  const btns = [...rendu.matchAll(/<button\b[^>]*?class="([^"]*)"/g)].map((m) => m[1]);
  T('chaque bouton vient du jeu commun (.mvbtn) \u2014 ' + btns.length + ' boutons', btns.length >= 5 && btns.every((k) => /^mvbtn(\s|$)/.test(k)));
  T('les pastilles viennent du jeu commun (.mvpas)', (rendu.match(/class="mvpas/g) || []).length >= 3);
  const i0 = S.css.indexOf('\u2605\u2605 CAVEAUJ-2 (\u00a7435)'), i1 = S.css.indexOf('/* \u2605 FIN CAVEAUJ-2 */', i0), B = (i0 < 0 || i1 < 0) ? '' : S.css.slice(i0, i1);
  const maison = [...B.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]).filter((k) => /(^|-)(chip|chips|pill|badge|pastille|tag|card|cards|carte|cartes|tile|tiles|panel|panneau|encart|box)(-|$)/.test(k));
  T('aucune classe \u00ab maison \u00bb de pastille ou de carte dans le bloc', maison.length === 0);
  T('le bloc CAVEAUJ-2 est pos\u00e9, par jetons : aucune couleur \u00e9crite, le filet avec son repli', B.length > 3000 && !/#[0-9A-Fa-f]{3,8}\b/.test(sansVar(B)) && !/var\(--ligne\)/.test(B));
  T('ce harnais est branch\u00e9 dans la liste des contr\u00f4les', S.liste.includes("['node scripts/mv-harnais-caveauj2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-caveauj2.mjs --contre'],"));
  return R;
}

const MUT = [
  ['le week-end ne recule plus', (S) => ({ ...S, cave: S.cave.replace('if(j!==0&&j!==6&&!_mlFerie(x)) return x;', 'if(!_mlFerie(x)) return x;') })],
  ['le f\u00e9ri\u00e9 ne recule plus', (S) => ({ ...S, cave: S.cave.replace('if(j!==0&&j!==6&&!_mlFerie(x)) return x;', 'if(j!==0&&j!==6) return x;') })],
  ['un ouillage plac\u00e9 avant aujourd\u2019hui', (S) => ({ ...S, cave: S.cave.replace('var dj=_mlJourOuvre(d); if(dj<from) dj=from;', 'var dj=_mlJourOuvre(d);') })],
  ['le cycle repart de la date d\u2019origine', (S) => ({ ...S, cave: S.cave.replace('      d=_mlAddJ(dj,seuil);\n    }', '      d=_mlAddJ(d,seuil);\n    }') })],
  ['la date d\u2019origine perdue', (S) => ({ ...S, cave: S.cave.replace('du:(dj!==d)?d:null', 'du:null') })],
  ['le Chai devant le Cuvier aux vendanges', (S) => ({ ...S, cave: S.cave.replace("return _mlPhase()==='vendange'?cv+ch:ch+cv;", "return _mlPhase()==='vendange'?ch+cv:cv+ch;") })],
  ['les derniers gestes dans le d\u00e9sordre', (S) => ({ ...S, cave: S.cave.replace('  ev.sort(function(a,b){ return a.d<b.d?1:(a.d>b.d?-1:0); });\n', '') })],
  ['une couleur \u00e9crite dans le bloc', (S) => ({ ...S, css: S.css.replace('#page-cave .caj-jg.due > i{ background:var(--danger); }', '#page-cave .caj-jg.due > i{ background:#C2381B; }') })],
  ['une pastille maison', (S) => ({ ...S, css: S.css.replace('#page-cave .caj-sub{', '#page-cave .caj-tag{') })],
  ['un bouton hors du jeu commun', (S) => ({ ...S, cave: S.cave.replace('class="mvbtn mvbtn-secondaire mvbtn-compact caj-plus"', 'class="caj-plus"') })],
];

console.log('\n\u2500\u2500 CAVEAUJ-2 : Le Cuvier, Le Chai, les derniers gestes ; l\u2019ouillage au jour ouvr\u00e9\n');
const res = verifier(S0); let ko = 0;
for (const [nom, ok] of res) { console.log((ok ? '  \u2713 ' : '  \u2717 ') + nom); if (!ok) ko++; }
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions');
if (CONTRE) {
  let rate = 0;
  console.log('\n\u2500\u2500 Contre-\u00e9preuves : chaque mutation doit rougir');
  for (const [nom, f] of MUT) {
    const S = f(S0), meme = S.cave === S0.cave && S.css === S0.css;
    const rouge = verifier(S).some(([, ok]) => !ok);
    console.log((rouge && !meme ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + nom + (meme ? ' (MOTIF ABSENT)' : ''));
    if (!rouge || meme) rate++;
  }
  console.log('\n' + (rate ? 'ROUGE \u2014 ' + rate + ' contre-\u00e9preuve(s) sans effet' : 'VERT \u2014 ' + MUT.length + ' contre-\u00e9preuves rougissent'));
  process.exit(ko || rate ? 1 : 0);
}
process.exit(ko ? 1 : 0);
