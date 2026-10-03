#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS CARTE-1 (§217) — LES VUES DE LA CARTE DU DOMAINE
   Lancer :  node scripts/mv-harnais-carte-vues.mjs            (scénarios)
             node scripts/mv-harnais-carte-vues.mjs --contre   (contre-épreuves)
   Le bloc CARTE-1 est extrait de src/pilotage.js AVEC les sources qu'il lit
   (_cfmPassages, _cfmIftRef, _pilEsc, _ecoEur — les vraies) ; seuls _pecData
   (signature : aucun argument → {configured, rows}) et getPCls sont doublés.
   Horloge figée au mardi 16 juin 2026.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const PIL = readFileSync('src/pilotage.js', 'utf8');
function corps(src, debut) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); } }
  throw new Error('accolades : ' + debut);
}
function bloc(src) { const a = src.indexOf("var _PIL_LENT='avc';"), b = src.indexOf('var _PIL_LENT_PREP=null;'); if (a < 0 || b < a) throw new Error('bloc CARTE-1 introuvable'); return src.slice(a, b); }
const RealDate = Date, FIXED = new RealDate('2026-06-16T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXED); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXED; FakeDate.parse = RealDate.parse;

function charger(src, o = {}) {
  const PARC = [{ nom: 'A', cepage: 'Pinot noir' }, { nom: 'B', cepage: 'Aligoté' }, { nom: 'C', cepage: 'aligote' }, { nom: 'D', cepage: 'Savagnin' },
    { nom: 'E' }, { nom: 'F', cepage: 'Melon' }, { nom: 'Z', statut: 'Arrachee', cepage: 'Gamay' }];
  const TR = [
    { date: '2026-06-02', parcelles: ['A', 'B'], sessionId: 's1' }, { date: '2026-06-16', parcelles: ['A'], sessionId: 's2' },
    { date: '2026-06-09', parcelles: ['C'], sessionId: 's3' }, { date: '2025-07-01', parcelles: ['D'], sessionId: 'old' }];
  for (let i = 0; i < 8; i++) TR.push({ date: '2026-05-0' + (i + 1), parcelles: ['B'], sessionId: 'b' + i });
  for (let i = 0; i < 11; i++) TR.push({ date: '2026-04-' + String(i + 10), parcelles: ['C'], sessionId: 'c' + i });
  TR.push({ date: '2026-05-20', parcelles: ['C'], sessionId: 'c0' });   // meme session : un seul passage
  const ctx = { Math, Object, Array, String, Number, isFinite, parseInt, console, Date: FakeDate,
    PARCELLES: PARC, TRAITEMENTS: TR, CONFIG: { conformite: { ift_ref: 8 } },
    _pilSaison: () => ({ nom: '2026' }), _saisonForDate: iso => (iso >= '2025-11-01' && iso <= '2026-10-31') ? '2026' : '2025',
    getSaisonActive: () => ({ nom: '2026' }),
    getPCls: p => ({ col: '#5B9B3A', pct: 40 }),
    _pecData: () => (o.nonConfig ? { configured: false, rows: [] } : { configured: true, rows: [
      { nom: 'A', surf: 1, engHa: 1000 }, { nom: 'B', surf: 0.5, engHa: 4000 }, { nom: 'C', surf: 0.8, engHa: 2500 },
      { nom: 'E', surf: 0.3, engHa: 0 }, { nom: 'Z', surf: 0.4, engHa: 99999, arr: true }] }) };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([corps(src, 'function _pilEsc('), corps(src, 'function _ecoEur('), corps(src, 'function _cfmPassages('), corps(src, 'function _cfmIftRef('), corps(src, 'function _friseNorm('), bloc(src)].join('\n'), ctx, { filename: 'carte-extrait.js' });
  return ctx;
}

function scenarios(src, journal) {
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => { if (cond) { ok++; if (journal) console.log('  \x1b[32m✓\x1b[0m ' + nom); }
    else { ko++; if (journal) console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
  try {
    const X = charger(src), P = n => X.PARCELLES.find(p => p.nom === n);
    const vue = l => { X._PIL_LENT = l; vm.runInContext("_PIL_LENT='" + l + "';", X); return X._pilLentPrep(); };
    let o = vue('phy');
    t('dernier traitement : la date la PLUS RÉCENTE de chaque parcelle (A traitée aujourd’hui)', o.j.A === 0 && X._pilLentCol(P('A'), o).txt === 'traitée aujourd’hui' && X._pilLentCol(P('A'), o).col === '#3D6B27', JSON.stringify(o.j));
    t('14 jours = rouge, 7 jours = or', o.j.B === 14 && X._pilLentCol(P('B'), o).col === '#A0291E' && X._pilLentCol(P('C'), o).col === '#C2A14D');
    t('toutes campagnes : un traitement de l’an dernier compte (D, 350 j)', o.j.D === 350, o.j.D);
    t('jamais traitée : pas de couleur (gris), pas « 0 j »', X._pilLentCol(P('E'), o) === null);
    o = vue('pass');
    t('passages : la règle de la Conformité (une session = un passage)', o.pass.C === 12 && o.pass.B === 9 && o.pass.A === 2, JSON.stringify(o.pass));
    t('la référence vient des réglages (8)', o.refIft === 8);
    t('zéro passage est une MESURE : couleur claire, pas gris', X._pilLentCol(P('E'), o) && X._pilLentCol(P('E'), o).col === '#DDEBD2');
    t('au-dessus de la référence : orange (9/8) ; au-delà de +25 % : rouge (12/8)', X._pilLentCol(P('B'), o).col === '#B85A1A' && X._pilLentCol(P('C'), o).col === '#A0291E');
    t('à la référence ou dessous : du vert clair au vert (2/8)', /^#[0-9A-F]{6}$/.test(X._pilLentCol(P('A'), o).col) && X._pilLentCol(P('A'), o).col !== '#DDEBD2');
    o = vue('cep');
    t('cépage : « Aligoté » et « aligote » sont le même cépage, même couleur', X._pilLentCol(P('B'), o).col === X._pilLentCol(P('C'), o).col && X._pilLentCol(P('B'), o).col === '#A8B86A');
    t('cépage connu : sa couleur ; inconnus : la palette, dans l’ordre d’apparition', X._pilLentCol(P('A'), o).col === '#7A1020' && X._pilLentCol(P('D'), o).col === '#4A80C4' && X._pilLentCol(P('F'), o).col === '#C8853A');
    t('sans cépage sur la fiche : gris', X._pilLentCol(P('E'), o) === null);
    t('une vigne arrachée n’ajoute pas son cépage à la légende', !X._pilLentLeg(o).includes('Gamay'));
    o = vue('cout');
    t('coût / ha : échelle de la moins chère (0) à la plus chère (4 000 €), arrachée hors', o.mn === 0 && o.mx === 4000, JSON.stringify([o.mn, o.mx]));
    t('la moins chère en clair, la plus chère en terre', X._pilLentCol(P('E'), o).col === '#EAF3E2' && X._pilLentCol(P('B'), o).col === '#8A5A38');
    t('absente du tableau de l’Économie : gris', X._pilLentCol(P('D'), o) === null);
    const Xn = charger(src, { nonConfig: true }); vm.runInContext("_PIL_LENT='cout';", Xn); const on = Xn._pilLentPrep();
    t('Économie non configurée : aucune couleur, la légende dit quoi faire', Xn._pilLentCol(P('A'), on) === null && Xn._pilLentLeg(on).includes('taux horaires à renseigner'));
    o = vue('avc');
    t('avancement : la couleur d’avant (getPCls)', X._pilLentCol(P('A'), o).col === '#5B9B3A' && X._pilLentCol(P('A'), o).txt === '40 %');
    // legendes et boutons
    vm.runInContext("_PIL_LENT='pass';", X);
    const Lg = X._pilLentLeg(X._pilLentPrep());
    t('légende des passages : la référence écrite, et « sans donnée »', Lg.includes('jusqu’à la référence (8)') && Lg.includes('sans donnée'));
    const Bt = X._pilLentBtns();
    t('cinq boutons, un seul appuyé, le bon', (Bt.match(/class="pil-lent-b/g) || []).length === 5 && (Bt.match(/aria-pressed="true"/g) || []).length === 1 && /data-lent="pass" aria-pressed="true"/.test(Bt));
    t('aucun undefined / NaN dans les légendes', ['phy', 'pass', 'cep', 'cout', 'avc'].every(l => { vm.runInContext("_PIL_LENT='" + l + "';", X); return !/undefined|NaN/.test(X._pilLentLeg(X._pilLentPrep())); }));
    // branchements
    t('la carte peint chaque parcelle avec la vue courante (contours ET épingles)', (src.match(/_pilLentCol\(p,_lo\)/g) || []).length === 2 && /_pilLentCol\(pp,_lo\)/.test(src));
    t('le clic sur une vue redessine', /closest\('\.pil-lent-b'\)/.test(src) && /_PIL_LENT=_lv; _PIL_LENT_PREP=null; renderPilotage\(\)/.test(src));
  } catch (e) { t('les scénarios s’exécutent sans planter', false, e.stack); }
  return { ok, ko };
}

console.log('\n\x1b[1mMA VIGNE — Harnais CARTE-1 · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
if (!CONTRE) { const r = scenarios(PIL, true); console.log('\n  ' + r.ok + ' vertes, ' + r.ko + ' rouges\n'); process.exit(r.ko ? 1 : 0); }
const DEFAUTS = [
  ['la date la plus ANCIENNE l’emporte', 'if(nom&&(!der[nom]||dd>der[nom]))', 'if(nom&&(!der[nom]||dd<der[nom]))'],
  ['la référence est ignorée', 'r=o.refIft>0?n/o.refIft:0;', 'r=n/12;'],
  ['zéro passage devient gris', "var n=o.pass[p.nom]||0, r=", "if(!o.pass[p.nom]) return null; var n=o.pass[p.nom], r="],
  ['le cépage redevient sensible aux accents', 'var c=o.cep[_friseNorm(p.cepage)];', 'var c=o.cep[String(p.cepage)];'],
  ['l’échelle du coût est inversée', '(v-o.mn)/(o.mx-o.mn)', '(o.mx-v)/(o.mx-o.mn)'],
  ['une vigne arrachée ajoute son cépage', "if(!p||p.statut==='Arrachee') return; var c=_friseNorm(p.cepage);", "if(!p) return; var c=_friseNorm(p.cepage);"],
  ['une vigne arrachée entre dans l’échelle du coût', 'if(!r||r.arr||!(r.surf>0)) return;', 'if(!r||!(r.surf>0)) return;'],
];
let rougit = 0;
for (const [nom, a, b] of DEFAUTS) {
  const n = PIL.split(a).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté (' + n + ') : ' + nom); continue; }
  const r = scenarios(PIL.replace(a, b), false);
  if (r.ko > 0) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')\x1b[0m'); }
  else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log('\n  ' + rougit + '/' + DEFAUTS.length + ' contre-épreuves rougissent\n');
process.exit(rougit === DEFAUTS.length ? 0 : 1);
