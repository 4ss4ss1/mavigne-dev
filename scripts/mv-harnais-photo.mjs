#!/usr/bin/env node
// PIL-RANGE-1b (§441) : l'ancien Aujourd'hui (tuiles d'avant, petites courbes, frise, carte Cave) est retiré ; ce harnais ne garde que ce qui vit encore.
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS PHOTO-1 (§219) — LA PHOTO QUOTIDIENNE DES CHIFFRES DU COCKPIT
   Lancer :  node scripts/mv-harnais-photo.mjs            (scénarios)
             node scripts/mv-harnais-photo.mjs --contre   (contre-épreuves)
   Le bloc PHOTO est extrait de src/pilotage.js avec le vrai _pilSaison ; horloge
   figée (16 juin 2026) ; saveData doublé pour COMPTER les écritures. Prouvé : une
   écriture par jour, admin seulement, période active seulement, 60 lignes au plus,
   tri par date, rien de rétroactif ; les séries : trou pour un jour sans photo,
   point du jour en direct, charge en écart à la première photo de la fenêtre,
   budget = consommé − fait, rien sous deux points.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const CONTRE = process.argv.includes('--contre');
const PIL = readFileSync('src/pilotage.js', 'utf8');
function corps(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  let j = src.indexOf('{', i), n = 0; for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); } } throw new Error('accolades : ' + debut); }
function bloc(src) { const a = src.indexOf('var _PIL_PHOTO_MAX='), b = src.indexOf('function _friseNorm(');   /* PIL-RANGE-1b (§441) : les petites courbes qui suivaient la photo sont retirées */ if (a < 0 || b < a) throw new Error('bloc PHOTO introuvable'); return src.slice(a, b); }
const RealDate = Date, FIXED = new RealDate('2026-06-16T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXED); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXED; FakeDate.parse = RealDate.parse;
const iso = k => { const d = new RealDate(2026, 5, 16 - k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

function charger(src, o = {}) {
  const ecrits = [];
  const ctx = { Math, Object, Array, String, Number, isFinite, console, Date: FakeDate, ecrits,
    CONFIG: { photo: o.photo === undefined ? [] : o.photo },
    SAISONS: [{ nom: '2026' }, { nom: '2025' }], _visuSaison: () => (o.visu || ''),
    getSaisonActive: () => ({ nom: '2026' }),
    isAdmin: () => o.admin !== false,
    _dataReady: o.pret !== false,   // AUJ-6 (§308) : la photo attend l'arrivée des données
    saveData: k => { ecrits.push(k); },
    _pecData: () => (o.E || { configured: true, cons: 47.26, avc: 42.1 }),
  };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([corps(src, 'function _pilSaison('), bloc(src)].join('\n'), ctx, { filename: 'photo-extrait.js' });
  return ctx;
}
function scenarios(src, journal) {
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => { if (cond) { ok++; if (journal) console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; if (journal) console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
  const proche = (a, b) => a != null && Math.abs(a - b) < 1e-9;
  try {
    const X = charger(src), d = { totalReste: 1186.4, totalTotal: 2400 };
    t('première ouverture du jour : une écriture, une ligne {d, reste, cons, avc}', X._pilPhotoEcrire(d) === true && X.ecrits.length === 1 && X.ecrits[0] === 'config' && X.CONFIG.photo.length === 1 && X.CONFIG.photo[0].d === '2026-06-16' && X.CONFIG.photo[0].reste === 1186 && X.CONFIG.photo[0].cons === 47.3 && X.CONFIG.photo[0].avc === 42.1, JSON.stringify(X.CONFIG.photo));
    t('seconde ouverture le même jour : rien (jamais réécrite)', X._pilPhotoEcrire({ totalReste: 999, totalTotal: 2400 }) === false && X.ecrits.length === 1 && X.CONFIG.photo[0].reste === 1186);
    t('non admin : rien', charger(src, { admin: false })._pilPhotoEcrire(d) === false);
    t('avant l’arrivée des données : rien (AUJ-6)', (() => { const Y = charger(src, { pret: false }); return Y._pilPhotoEcrire(d) === false && Y.ecrits.length === 0; })());
    t('rien de prévu dans la période : rien (AUJ-6)', (() => { const Y = charger(src); return Y._pilPhotoEcrire({ totalReste: 0, totalTotal: 0 }) === false && Y.ecrits.length === 0; })());
    const Xa = charger(src, { visu: '2025' });
    t('archive consultée (2025 alors que 2026 est active) : rien', Xa._pilPhotoEcrire(d) === false && Xa.ecrits.length === 0);
    t('sans saveData : rien, sans planter', (() => { const Y = charger(src); Y.saveData = undefined; return Y._pilPhotoEcrire(d) === false; })());
    const Xe = charger(src, { E: { configured: false } }); Xe._pilPhotoEcrire(d);
    t('budget non configuré : la ligne garde la charge, sans cons ni avc', Xe.CONFIG.photo[0].reste === 1186 && Xe.CONFIG.photo[0].cons === undefined);
    // 60 lignes, tri, rien de retroactif
    const vieux = []; for (let k = 80; k >= 1; k--) vieux.push({ d: iso(k), reste: 2000 - k });
    const Xm = charger(src, { photo: vieux.slice().reverse().concat([{ d: '2026-06-20', reste: 1 }, { reste: 5 }]) });   // desordre + une date future + une ligne sans date
    Xm._pilPhotoEcrire(d);
    const L = Xm.CONFIG.photo;
    t('60 lignes au plus, triées par date, la plus ancienne retirée', L.length === 60 && L[0].d === iso(59) && L[59].d === '2026-06-16' && L.every((x, i) => !i || x.d > L[i - 1].d), L.length + ' ' + (L[0] && L[0].d));
    t('une ligne datée dans le futur ou sans date est écartée', !L.some(x => x.d === '2026-06-20') && L.every(x => typeof x.d === 'string'));
    // les series
    const ph = [];
    for (let k = 13; k >= 1; k--) if (k !== 5) ph.push({ d: iso(k), reste: 1500 - (13 - k) * 20, cons: 40 + (13 - k), avc: 40 + (13 - k) * 0.5, p: '2026' });   // AUJ-6 : la petite courbe ne lit que les photos de la période
    const Xs = charger(src, { photo: ph });
    t('branché : écriture au rendu d’Aujourd’hui', /try\{ _pilPhotoEcrire\(d\); \}/.test(src));
  } catch (e) { t('les scénarios s’exécutent sans planter', false, e.stack); }
  return { ok, ko };
}
console.log('\n\x1b[1mMA VIGNE — Harnais PHOTO-1 · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
if (!CONTRE) { const r = scenarios(PIL, true); console.log('\n  ' + r.ok + ' vertes, ' + r.ko + ' rouges\n'); process.exit(r.ko ? 1 : 0); }
const DEFAUTS = [
  ['la photo se réécrit à chaque ouverture', "if(L.some(function(x){ return x&&x.d===auj; })) return false;", ''],
  ['un non-admin écrit', "if(!d||typeof window.isAdmin!=='function'||!window.isAdmin()||typeof window.saveData!=='function') return false;", "if(!d||typeof window.saveData!=='function') return false;"],
  ['une archive consultée photographie', "if(!sa||!sp||sa.nom!==sp.nom) return false;", ''],
  ['plus de 60 lignes', 'if(N.length>_PIL_PHOTO_MAX) N=N.slice(N.length-_PIL_PHOTO_MAX);', ''],
  ['la photo part avant l’arrivée des données (AUJ-6)', "if(!window._dataReady||", "if("],
  ['une période sans travail prévu est photographiée (AUJ-6)', "!(Number(d.totalTotal)>0)||", ""],
];
let rougit = 0;
for (const [nom, a, b] of DEFAUTS) {
  const n = PIL.split(a).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté (' + n + ') : ' + nom); continue; }
  const r = scenarios(PIL.replace(a, b), false);
  if (r.ko > 0) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')\x1b[0m'); } else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log('\n  ' + rougit + '/' + DEFAUTS.length + ' contre-épreuves rougissent\n');
process.exit(rougit === DEFAUTS.length ? 0 : 1);
