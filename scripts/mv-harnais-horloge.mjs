#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — HORLOGE-1 : « AUJOURD'HUI », LA CAMPAGNE, L'EXERCICE ET LA SEMAINE
   AUX MOMENTS PIÈGES (§181)
   Lancer : node scripts/mv-harnais-horloge.mjs          (+ --contre)

   ══ POURQUOI ══
   Point 3 de l'audit du 26/09 : le changement d'heure du 25/10/2026 (journée de
   25 h), l'heure sautée du 28/03/2027, minuit passé (l'UTC est encore la veille),
   la bascule du 1er août (campagne ET exercice), la semaine 53 de 2026, le
   29/02/2028. mv-harnais-fuseau éprouve des fonctions sous cinq fuseaux à une
   heure quelconque ; ici l'HORLOGE est figée à ces instants précis, sous l'heure
   de Paris (et, pour la semaine, trois autres fuseaux).
   Le pendant « appli entière dans un navigateur » : npm run tour -- --dates.

   ══ CE QU'IL TIENT (vraies fonctions de utils.js et planning.js) ══
     A. _mvISO(new Date()), _mvAujIso() = la date LOCALE de Paris ; _mvCampagneDe et
        _mvExercice rendent la bonne année (ouverture 1er août) à 9 instants pièges.
     B. _planIsoWeek = la semaine ISO de référence, chaque jour de 2024 à 2030,
        sous Paris, Martinique, Nouméa et UTC (31/12/2026 = semaine 53).
   Le harnais se relance lui-même en fils, un par fuseau (process.env.TZ).
   ⚠️ CHEMINS : fileURLToPath (20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const ARGS = process.argv.slice(2);
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };
const MOMENTS = ['2026-09-27T00:30:00+02:00', '2026-10-25T01:30:00+02:00', '2026-10-25T02:30:00+01:00', '2026-10-25T23:30:00+01:00',
  '2026-08-01T00:05:00+02:00', '2026-07-31T23:59:00+02:00', '2026-12-31T23:59:00+01:00', '2027-01-01T00:05:00+01:00',
  '2027-03-28T03:30:00+02:00', '2028-02-29T12:00:00+01:00'];

function bloc(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } }
  return null;
}

// ── Mode fils : un fuseau, un rapport JSON ──
if (ARGS.includes('--fils')) {
  const S = JSON.parse(fs.readFileSync(ARGS[ARGS.indexOf('--fils') + 1], 'utf8'));
  const out = { a: [], b: { n: 0, ecarts: [] } };
  const u = ['function _mvISO(', 'function _mvAujIso(', 'function _mvCampagneMois(', 'function _mvCampagneDe(', 'function _mvExerciceMois(',
             'function _mvExIso(', 'function _mvExerciceAn(', 'function _mvExercice('].map(n => bloc(S.utils, n));
  if (u.some(x => !x)) { console.log(JSON.stringify({ erreur: 'extraction utils' })); process.exit(0); }
  const RD = Date;
  if (process.env.TZ === 'Europe/Paris') for (const iso of MOMENTS) {
    const T = new RD(iso).getTime();
    class FD extends RD { constructor(...a) { if (a.length === 0) super(T); else super(...a); } static now() { return T; } }
    let r;
    try {
      r = new Function('Date', 'window', 'var MV_EX_MOIS_DEF=7, MV_CAMP_MOIS_DEF=7, MV_EX_MOIS_LBL=[];\n' + u.join('\n')
        + '\nvar t=_mvISO(new Date()); return {t:t, a:_mvAujIso(), c:_mvCampagneDe(t), e:_mvExercice().an};')(FD, { CONFIG: {} });
    } catch (e) { r = { erreur: e.message }; }
    const j = iso.slice(0, 10), an = +j.slice(0, 4), mo = +j.slice(5, 7), att = mo >= 8 ? an : an - 1;
    out.a.push({ iso, ok: r.t === j && r.a === j && r.c === att && r.e === att, vu: r, att: { j, att } });
  }
  const w = bloc(S.plan, 'function _planIsoWeek(');
  if (w) {
    let Y = 2024; const f = new Function('_pY', w + '; return _planIsoWeek;')(() => Y);
    const ref = (y, m, d) => { const t = new Date(Date.UTC(y, m, d)); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3);
      const w1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); return 1 + Math.round(((t - w1) / 864e5 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7); };
    for (Y = 2024; Y <= 2030; Y++) for (let m = 0; m < 12; m++) for (let d = 1; d <= 31; d++) {
      if (new Date(Date.UTC(Y, m, d)).getUTCMonth() !== m) continue;
      out.b.n++; const v = f(m, d), rf = ref(Y, m, d);
      if (v !== rf && out.b.ecarts.length < 5) out.b.ecarts.push(Y + '-' + (m + 1) + '-' + d + ' : ' + v + ' au lieu de ' + rf);
    }
    Y = 2026; out.b.s53 = f(11, 31);
  } else out.b.erreur = 'extraction planning';
  console.log(JSON.stringify(out));
  process.exit(0);
}

function jouer(S, silencieux) {
  const tmp = path.join(os.tmpdir(), 'mv-horloge-' + process.pid + '.json');
  fs.writeFileSync(tmp, JSON.stringify(S));
  let ok = 0, ko = 0; const rouges = [];
  const t = (lib, cond) => { if (cond) ok++; else { ko++; rouges.push(lib); } if (!silencieux) console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + lib); };
  try {
    for (const tz of ['Europe/Paris', 'America/Martinique', 'Pacific/Noumea', 'UTC']) {
      let R;
      try { R = JSON.parse(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--fils', tmp], { env: Object.assign({}, process.env, { TZ: tz }), encoding: 'utf8' })); }
      catch (e) { t(tz + ' : le fils a planté', false); continue; }
      if (R.erreur) { t(tz + ' : ' + R.erreur, false); continue; }
      if (tz === 'Europe/Paris') {
        if (!silencieux) console.log('\n' + c.b('A. Aujourd\u2019hui, campagne, exercice — horloge figée, heure de Paris'));
        for (const x of R.a) t(x.iso + ' → ' + (x.vu.t || '?') + ', campagne ' + x.vu.c + ', exercice ' + x.vu.e, x.ok);
        if (!silencieux) console.log('\n' + c.b('B. La semaine ISO du planning, 2024 → 2030'));
      }
      if (R.b.erreur) { t(tz + ' : ' + R.b.erreur, false); continue; }
      t(tz + ' : ' + R.b.n + ' jours, ' + R.b.ecarts.length + ' écart' + (R.b.ecarts.length ? ' (' + R.b.ecarts[0] + ')' : '') + ' · 31/12/2026 = S' + R.b.s53,
        R.b.n > 2500 && R.b.ecarts.length === 0 && R.b.s53 === 53);
    }
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
  return { ok, ko, rouges };
}

const BASE = { utils: fs.readFileSync(path.join(RACINE, 'src/utils.js'), 'utf8'), plan: fs.readFileSync(path.join(RACINE, 'src/planning.js'), 'utf8') };
if (!ARGS.includes('--contre')) {
  console.log(c.b('MA VIGNE — Harnais HORLOGE-1'));
  const r = jouer(BASE, false);
  console.log('\n  ' + r.ok + ' verts · ' + (r.ko ? c.r(r.ko + ' rouge(s)') : '0 rouge') + '\n');
  process.exit(r.ko ? 1 : 0);
}
function muter(S, f, a, b) { if (!S[f].includes(a)) throw new Error('ancre introuvable : ' + a.slice(0, 50)); return Object.assign({}, S, { [f]: S[f].replace(a, b) }); }
const MUT = [
  ['_mvISO lit l\u2019UTC (toISOString)', S => muter(S, 'utils', "  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')", "  return x.toISOString().slice(0,10); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')")],
  ['la semaine ISO tronque au lieu d\u2019arrondir', S => muter(S, 'plan', "  return 1+Math.round(((dt-w1)/86400000-3+((w1.getDay()+6)%7))/7);", "  return 1+Math.floor(((dt-w1)/86400000-3+((w1.getDay()+6)%7))/7);")],
  ['la campagne s\u2019ouvre un mois trop tard', S => muter(S, 'utils', "  var md=_mvCampagneMois()+1;", "  var md=_mvCampagneMois()+2;")],
];
console.log(c.b('MA VIGNE — Harnais HORLOGE-1 · contre-épreuves'));
let bad = 0;
for (const [lib, f] of MUT) {
  let S; try { S = f(BASE); } catch (e) { bad++; console.log('  ' + c.r('✗ ERREUR D\u2019INJECTION — ' + lib + ' : ' + e.message)); continue; }
  const r = jouer(S, true);
  if (r.ko) console.log('  ' + c.g('✓') + ' rougit : ' + lib + c.dim('  (' + r.rouges[0].slice(0, 70) + ')'));
  else { bad++; console.log('  ' + c.r('✗ RESTE VERT : ' + lib)); }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-épreuves rougissent\n');
process.exit(bad ? 1 : 0);
