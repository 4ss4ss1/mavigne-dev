#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS TENS-1 (§215) — LA TENSION DE L'ÉQUIPE FACE AU PLANNING PRÉVU
   Lancer :  node scripts/mv-harnais-tension.mjs            (scénarios)
             node scripts/mv-harnais-tension.mjs --contre   (contre-épreuves)
   ① planning.js : le mode 'prevu' de _planRangeH_ lit la grille SANS la saisie
     (e = null), 'work' lit la saisie — vrai _planRangeH_ extrait, ses voisins
     doublés AVEC leur signature, et chaque appel enregistré ;
   ② pilotage.js : le bloc TENS extrait tel quel, sous horloge figée (mardi
     16 juin 2026). _planWorkPersRange / _planPrevuPersRange doublés avec LEUR
     signature (membre, Date, Date) sur un planning écrit à la main ; _mvGraphSpark
     doublé pour capter la série. Seuils : +10 % au prévu, semaine > moyenne
     (44 h) = orange, > maximum (48 h) = rouge ; bureau et collectifs hors.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const PIL = readFileSync('src/pilotage.js', 'utf8');
const PLA = readFileSync('src/planning.js', 'utf8');

function corps(src, debut) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); } }
  throw new Error('accolades : ' + debut);
}
function blocTens(src) {
  const a = src.indexOf('var _PIL_TENS_SEUIL'), b = src.indexOf('function _pilCkAlertes(d){');
  if (a < 0 || b < a) throw new Error('bloc TENS introuvable'); return src.slice(a, b);
}
const RealDate = Date;
const FIXED = new RealDate('2026-06-16T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXED); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXED; FakeDate.parse = RealDate.parse;
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

// Le planning ecrit a la main : prevu = grille (h par jour ouvre), fait = saisie.
const OUVRE = d => d.getDay() >= 1 && d.getDay() <= 5;
const EQUIPE = [
  { nom: 'Victor', prevu: 8, fait: d => OUVRE(d) ? 9 : 0 },                                    // +12,5 %, semaine 45 h
  { nom: 'Alicia', prevu: 8, fait: d => OUVRE(d) ? 8 : 0 },                                    // au prevu
  { nom: 'Shana', prevu: 7, fait: d => OUVRE(d) ? ((iso(d) >= '2026-06-08' && iso(d) <= '2026-06-12') ? 10.5 : 7) : 0 }, // semaine 52,5 h
  { nom: 'Nina', prevu: 9, fait: d => OUVRE(d) ? 9 : 0 },                                      // modulation haute PREVUE : 45 h prevues
  { nom: 'Marc', prevu: 6, fait: d => OUVRE(d) ? 7 : 0 },                                     // +16,7 %, semaines a 35 h : seuil par l'ecart SEUL
  { nom: 'Léa', prevu: 0, fait: d => iso(d) === '2026-06-15' ? 10 : (iso(d) === '2026-06-11' ? 10 : 0) },  // rien de prevu, 20 h faites
  { nom: 'Paul', prevu: 0, fait: () => 0 },                                                    // ni prevu ni fait : pas de ligne
  { nom: 'Chloé', prevu: 7, fait: d => OUVRE(d) ? 11 : 0, bureau: true },                      // bureau : hors
  { nom: 'Vendange', prevu: 7, fait: d => OUVRE(d) ? 12 : 0, coll: true },                     // collective : hors
];
function somme(m, from, to, quoi) {
  let t = 0; const c = new RealDate(from.getFullYear(), from.getMonth(), from.getDate()), e = new RealDate(to.getFullYear(), to.getMonth(), to.getDate());
  while (c <= e) { t += quoi === 'p' ? (OUVRE(c) ? m.prevu : 0) : m.fait(c); c.setDate(c.getDate() + 1); }
  return t;
}

function chargerPil(src) {
  const appelsSpark = [];
  const ctx = { console, Math, String, Number, Array, Object, isFinite, Date: FakeDate, appelsSpark,
    _planWorkPersRange: (m, a, b) => { if (!(a instanceof RealDate) || !(b instanceof RealDate)) throw new Error('signature'); return somme(m, a, b, 'f'); },
    _planPrevuPersRange: (m, a, b) => { if (!(a instanceof RealDate) || !(b instanceof RealDate)) throw new Error('signature'); return somme(m, a, b, 'p'); },
    _planLegal: () => ({ maxHebdo: 48, maxMoy: 44, maxJour: 10 }),
    _mvEstCollectif: m => !!m.coll,
    _mvGraphSpark: (v, o) => { appelsSpark.push([v, o]); return '<svg data-n="' + v.length + '"></svg>'; },
    _mvInfoBtn: k => '<button class="mv-i" data-info="' + k + '">i</button>',
    _mvIcon: n => '<svg data-ic="' + n + '"></svg>',
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext([corps(src, 'function _pilEsc('), corps(src, 'function _pilNum('), corps(src, 'function _pilIco('), blocTens(src)].join('\n'), ctx, { filename: 'tens-extrait.js' });
  return ctx;
}
function chargerPla(src) {
  const appels = [];
  const ctx = { appels, PLANNING_ENTRIES: { X: { 2026: { 5: { 16: { h: 11 } } } } }, _planCtxYear: 2026,
    _planPlId: m => 'std', _planInContractRead: () => true, _planEffN: () => 1,
    _planDayH: (pl, m, d, e, yr) => { appels.push(['DayH', e]); return 7; },
    _planWorkH: (pl, m, d, e, yr) => { appels.push(['WorkH', e]); return e ? e.h : 7; },
    _planChampH: (pl, m, d, e, yr) => { appels.push(['ChampH', e]); return 7; } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(corps(src, 'function _planRangeH_('), ctx, { filename: 'plan-extrait.js' });
  return ctx;
}

function scenarios(pil, pla, journal) {
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => { if (cond) { ok++; if (journal) console.log('  \x1b[32m✓\x1b[0m ' + nom); }
    else { ko++; if (journal) console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
  const proche = (a, b) => a != null && Math.abs(a - b) < 1e-9;
  try {
    // ① le planning
    const P = chargerPla(pla), X = { nom: 'X' }, jour = new RealDate(2026, 5, 16);
    P.appels.length = 0; const hp = P._planRangeH_(X, jour, jour, 'prevu');
    t('① « prevu » lit la grille SANS la saisie du jour (e = null)', P.appels.length === 1 && P.appels[0][0] === 'DayH' && P.appels[0][1] === null && hp === 7, JSON.stringify(P.appels));
    P.appels.length = 0; const hw = P._planRangeH_(X, jour, jour, 'work');
    t('① « work » lit la saisie (11 h saisies)', P.appels[0][0] === 'WorkH' && P.appels[0][1] && hw === 11, JSON.stringify(P.appels));
    t('① exposés : _planPrevuPersRange et _planLegal', /window\._planPrevuPersRange\s*=\s*_planPrevuPersRange/.test(pla) && /window\._planLegal\s*=\s*_planLegal/.test(pla));
  } catch (e) { t('① le planning s’extrait et s’exécute', false, e.message); }
  let X;
  try { X = chargerPil(pil); } catch (e) { t('② le bloc TENS s’extrait et s’exécute', false, e.message); return { ok, ko }; }
  try {
    const d = { membres: EQUIPE };
    const T = X._pilTensData(d);
    const noms = T.rows.map(r => r.nom);
    t('② bureau, équipe collective et personne sans heure : pas de ligne (6 lignes)', noms.length === 6 && noms.indexOf('Chloé') < 0 && noms.indexOf('Vendange') < 0 && noms.indexOf('Paul') < 0, JSON.stringify(noms));
    const R = n => T.rows.find(r => r.nom === n);
    t('② 14 jours = 10 jours ouvrés : Victor 90 h faites pour 80 prévues (+12,5 %)', proche(R('Victor').f, 90) && proche(R('Victor').p, 80) && proche(R('Victor').ec, 12.5), JSON.stringify(R('Victor')));
    t('② Victor au seuil (orange)', R('Victor').niv === 'orange');
    t('② Marc : semaines à 35 h, mais +16,7 % au prévu → orange par l’écart seul', R('Marc').niv === 'orange' && R('Marc').sm <= 44 && proche(R('Marc').ec, 70 / 60 * 100 - 100));
    t('② Alicia au prévu : rien à signaler', R('Alicia').niv === 'ok' && proche(R('Alicia').ec, 0));
    t('② Shana : semaine à 52,5 h, au-delà du maximum → rouge', proche(R('Shana').sm, 52.5) && R('Shana').niv === 'rouge', JSON.stringify(R('Shana')));
    t('② Nina : modulation haute PRÉVUE (0 % au prévu) mais semaine à 45 h > 44 → orange', proche(R('Nina').ec, 0) && proche(R('Nina').sm, 45) && R('Nina').niv === 'orange');
    t('② Léa : rien de prévu → écart absent (null), jamais un pourcentage inventé', R('Léa').ec === null && R('Léa').niv === 'ok' && proche(R('Léa').f, 20));
    t('② semaines : la précédente (lun.–dim.) et la courante jusqu’à aujourd’hui', proche(R('Victor').s1, 45) && proche(R('Victor').s2, 18), JSON.stringify([R('Victor').s1, R('Victor').s2]));
    t('② ordre : rouge, puis orange, puis le reste', T.rows[0].nom === 'Shana' && T.rows.slice(1, 4).every(r => r.niv === 'orange') && T.rows[1].nom === 'Marc' && T.rows.slice(4).every(r => r.niv === 'ok'));
    t('② 4 au seuil dont 1 au-delà du maximum', T.nSeuil === 4 && T.nRouge === 1, JSON.stringify([T.nSeuil, T.nRouge]));
    const F = 90 + 80 + (5 * 10.5 + 5 * 7) + 90 + 70 + 20, Pv = 80 + 80 + 70 + 90 + 60;
    t('② l’équipe : Σ fait ÷ Σ prévu − 1', proche(T.F, F) && proche(T.P, Pv) && proche(T.ec, (F - Pv) / Pv * 100), JSON.stringify([T.F, T.P, T.ec]));
    t('② la série : 14 points', T.serie.length === 14);
    const f7 = 9 * 5 + 8 * 5 + (10.5 * 3 + 7 * 2) + 9 * 5 + 7 * 5 + 20, p7 = 8 * 5 + 8 * 5 + 7 * 5 + 9 * 5 + 6 * 5;
    t('② dernier point = les 7 jours qui finissent aujourd’hui (10 → 16 juin)', proche(T.serie[13], (f7 - p7) / p7 * 100), T.serie[13] + ' / ' + (f7 - p7) / p7 * 100);
    t('② calculé une fois par rendu (mémoire sur d)', X._pilTensData(d) === T);
    // ③ le rendu
    X.appelsSpark.length = 0;
    const K = X._pilCkTension({ membres: EQUIPE });
    t('③ chiffre du bandeau : écart de l’équipe, « 4 / 6 au seuil », en rouge', K.includes('<b>4 / 6</b> au seuil') && K.includes('color:var(--rouge)') && K.includes('pil.tension'), K);
    t('③ la petite courbe reçoit la série, le haut est défavorable', X.appelsSpark.length === 1 && X.appelsSpark[0][0].length === 14 && X.appelsSpark[0][1].mauvais === 'haut');
    const C = X._pilCardTension({ membres: EQUIPE });
    t('③ carte : une ligne par personne (6), maximum et semaine chargée dits', (C.match(/class="pil-tens-r"/g) || []).length === 6 && C.includes('au-delà de 48 h') && C.includes('semaine à 45 h'));
    t('③ un trait de prévu par personne qui a du prévu (5)', (C.match(/<u style=/g) || []).length === 5);
    const larg = [...C.matchAll(/(?:width|left):(-?[\d.]+)%/g)].map(m => +m[1]);
    t('③ largeurs et positions entre 0 et 100 %', larg.length > 0 && larg.every(v => v >= 0 && v <= 100));
    t('③ aucun undefined / NaN, balises équilibrées', !/undefined|NaN/.test(C + K) && (C.match(/<div[ >]/g) || []).length === (C.match(/<\/div>/g) || []).length && (C.match(/<span[ >]/g) || []).length === (C.match(/<\/span>/g) || []).length);
    t('③ le bouton mène au Planning', C.includes('data-diag="planning"') && /planning:\s*\['planning', null, null\]/.test(pil));
    t('③ sans planning : un tiret, pas de carte', X._pilCkTension({ membres: [] }).includes('<div class="kv">—</div>') && X._pilCardTension({ membres: [] }) === '');
    t('③ branché : chiffre et carte sous la clé auj_tension', /_pilShow\('auj_tension'\)\) kpis\+=_pilCkTension\(d\)/.test(pil) && /_pilShow\('auj_tension'\)\) dec\+=_pilTuileTension\(d\)/.test(pil) && /_pilShow\('auj_tension'\)\) det\+=_pilCardTension\(d\)/.test(pil)   /* ALIGN-1 (§236) : la tuile en haut, le détail dessous */);
  } catch (e) { t('les scénarios s’exécutent sans planter', false, e.stack); }
  return { ok, ko };
}

console.log('\n\x1b[1mMA VIGNE — Harnais TENS-1 · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
if (!CONTRE) { const r = scenarios(PIL, PLA, true); console.log('\n  ' + r.ok + ' vertes, ' + r.ko + ' rouges\n'); process.exit(r.ko ? 1 : 0); }
const DEFAUTS = [
  ['pla', 'le prévu relit la saisie du jour', "(mode==='prevu')?_planDayH(plId,mi,d,null,yr)", "(mode==='prevu')?_planDayH(plId,mi,d,e,yr)"],
  ['pil', 'le seuil de 10 % disparaît', '(ec!=null&&ec>_PIL_TENS_SEUIL)', '(ec!=null&&ec>500)'],
  ['pil', 'la semaine au-delà de la moyenne n’alerte plus', "(sm>L.maxMoy+1e-4||(ec!=null&&ec>_PIL_TENS_SEUIL))", "((ec!=null&&ec>_PIL_TENS_SEUIL))"],
  ['pil', 'le maximum absolu n’est plus rouge', "(sm>L.maxHebdo+1e-4)?'rouge'", "(sm>L.maxHebdo+100)?'rouge'"],
  ['pil', 'les équipes collectives comptent', "&&!(typeof window._mvEstCollectif==='function'&&window._mvEstCollectif(m))", ''],
  ['pil', 'le bureau compte', "return m&&!m.bureau&&", 'return m&&'],
  ['pil', 'la fenêtre glissante passe à 8 jours', 'd7=_pilTensJour(fin,6)', 'd7=_pilTensJour(fin,7)'],
  ['pil', 'un écart sans prévu devient 0 %', 'var ec=(p>0)?(f-p)/p*100:null;', 'var ec=(p>0)?(f-p)/p*100:0;'],
];
let rougit = 0;
for (const [f, nom, a, b] of DEFAUTS) {
  const src = f === 'pla' ? PLA : PIL, n = src.split(a).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté (' + n + ') : ' + nom); continue; }
  const r = f === 'pla' ? scenarios(PIL, PLA.replace(a, b), false) : scenarios(PIL.replace(a, b), PLA, false);
  if (r.ko > 0) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')\x1b[0m'); }
  else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log('\n  ' + rougit + '/' + DEFAUTS.length + ' contre-épreuves rougissent\n');
process.exit(rougit === DEFAUTS.length ? 0 : 1);
