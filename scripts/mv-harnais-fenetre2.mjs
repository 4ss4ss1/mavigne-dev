/* ───────────────────────────────────────────────────────
   HARNAIS — FENETRE-2 (§567) : LE CRÉNEAU — HYGROMÉTRIE, JOUR, CRÉNEAU DU SOIR, PLUIE D'APRÈS, FRISE DES CINQ JOURS
   Lancer :          node scripts/mv-harnais-fenetre2.mjs
   Contre-épreuves : node scripts/mv-harnais-fenetre2.mjs --contre

   POURQUOI IL EXISTE
   Un créneau annoncé à 3 h du matin ou par 35 % d'humidité fait traiter pour rien. Ce harnais JOUE _pilTreatDays (extraite de
   pilotage.js) sur une prévision fabriquée à Gevrey : la nuit exclue (lever et coucher NOAA), l'hygrométrie sous 50 % exclue, la
   pluie et le vent ; les parcelles en fleur ont le créneau du soir ; la pluie des 72 h qui suivent et son jour ; il JOUE la frise
   (une case par heure, la bonne couleur) et garde la lecture croisée, la requête (l'hygrométrie demandée) et la démo.
   ─────────────────────────────────────────────────────── */
process.env.TZ = 'Europe/Paris';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), app: lire('src/app.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const m = new RegExp('var ' + nom + '\\s*=').exec(src); if (!m) throw new Error('introuvable : ' + nom); return src.slice(m.index, src.indexOf(';', m.index) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
// Une prévision de cinq jours à partir de demain minuit : sec, calme, 18 °C, 70 % ; le 2e jour, 35 % d'humidité de 9 h à 16 h ;
// le 3e jour, de la pluie 14 h-16 h (6 mm/h).
function prevision() {
  const d0 = new Date(); d0.setDate(d0.getDate() + 1); d0.setHours(0, 0, 0, 0);
  const time = [], temp = [], precip = [], wind = [], hum = [], pp = [];
  for (let k = 0; k < 5 * 24; k++) { const d = new Date(d0.getTime() + k * 3600000); const j = Math.floor(k / 24), h = d.getHours();
    time.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(h).padStart(2, '0') + ':00');
    temp.push(18); wind.push(8); pp.push(5); hum.push(j === 1 && h >= 9 && h < 16 ? 35 : 70); precip.push(j === 2 && h >= 14 && h < 16 ? 6 : 0); }
  return { time, temp, precip, wind, hum, pp };
}
function monde(S, soirF) {
  const ctx = { window: { METEO_HOURLY: prevision() }, localStorage: { getItem: () => null }, getDomaineGeo: () => ({ lat: 47.2257, lng: 4.9670 }), _pilSoirFleurs: () => soirF, Date, Math, JSON, _pilEsc: (s) => String(s).replace(/</g, '&lt;') };
  vm.createContext(ctx);
  vm.runInContext([variable(S.pil, 'PIL_TREAT_DAYS'), variable(S.pil, 'PIL_TREAT_DRY_H'), variable(S.pil, 'PIL_TREAT_LEACH_MM'), variable(S.pil, 'PIL_TREAT_PP_ALERT'), 'var PIL_TREAT_HR_MIN=50, PIL_TREAT_APRES_H=72;', variable(S.pil, '_PIL_FR_LEG'),
    'function _pilPhotoIso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }',
    ...['_pilCoucher', '_pilTreatDays', '_pilFrise5'].map((n) => fonction(S.pil, 'function ' + n + '('))].join('\n') + '\nthis.jours=_pilTreatDays; this.frise=_pilFrise5; this.soleil=_pilCoucher;', ctx);
  return ctx;
}
function jouer(S) {
  if (!S.pil.includes('var PIL_TREAT_HR_MIN=50, PIL_TREAT_APRES_H=72;')) throw new Error('constantes');
  const C = monde(S, null), J = C.jours();
  const iso = J && J[0] && C.window.METEO_HOURLY.time[0].slice(0, 10), lv = C.soleil(iso, 47.2257, 4.9670, true), cc = C.soleil(iso, 47.2257, 4.9670);
  t('① le jour : le créneau commence après le lever du soleil (NOAA) et finit avant son coucher', J[0].start != null && J[0].start * 60 >= lv && J[0].end * 60 <= cc + 60 && lv < 9 * 60 && cc > 16 * 60);
  const nuit = J[0].heures.filter((x) => x.h === 2)[0], midi = J[0].heures.filter((x) => x.h === 12)[0];
  t('① la frise du 1er jour : la nuit en « nuit », midi en « bon créneau »', nuit && nuit.cl === 'nuit' && midi && midi.cl === 'ok');
  const h2 = J[1].heures.filter((x) => x.h === 12)[0];
  t('② le 2e jour : l’hygrométrie sous 50 % (9 h-16 h) exclut le milieu de journée — la case « sec », le créneau ailleurs', h2 && h2.cl === 'sec' && J[1].start != null && (J[1].end <= 9 || J[1].start >= 16));
  t('③ la pluie d’après : le créneau du 2e jour voit les 12 mm du 3e jour dans ses 72 h, et leur jour', J[1].apresMm === 12 && /\d/.test(J[1].apresJour));
  const p3 = J[2].heures.filter((x) => x.h === 15)[0];
  t('③ le 3e jour : la pluie en « pluie »', p3 && p3.cl === 'pluie');
  const F = monde(S, { n: 2, debut: '', fin: '' }).jours();
  const hAv = Math.ceil((cc - 120) / 60), hNuit = Math.ceil(cc / 60) + 1, hApres = Math.ceil((cc + 180) / 60) + 1;   // le coucher du jour même (NOAA)
  const c1 = F[0].heures.filter((x) => x.h === hAv)[0], c2 = F[0].heures.filter((x) => x.h === hNuit)[0], c3 = F[0].heures.filter((x) => x.h === hApres)[0];
  t('④ des parcelles en fleur : de 2 h avant à 3 h après le coucher (' + hAv + ' h, ' + hNuit + ' h la nuit tombée) en « créneau du soir », pas après (' + hApres + ' h)', c1 && c1.cl === 'soir' && c2 && c2.cl === 'soir' && (!c3 || c3.cl !== 'soir'));
  const h = C.frise(J);
  t('⑤ la frise : cinq lignes de 24 cases, les couleurs, la légende', (h.match(/class="pil-fr-r"/g) || []).length === 5 && (h.match(/<i class="pil-fr-c/g) || []).length >= 5 * 24 && h.includes('pil-fr-c ok') && h.includes('pil-fr-c sec') && h.includes('pil-fr-c pluie') && h.includes('créneau du soir, parcelles en fleur'));
  t('⑥ la lecture croisée : le créneau face aux parcelles à nu, le soir des parcelles en fleur, la pluie d’après face au lessivage', S.pil.includes("+nu.length+' parcelle'+(nu.length>1?'s':'')+' \\u00e0 nu'+(soir&&soir.n?' \\u00b7 le soir pour les '+soir.n+' en fleur':'')") && S.pil.includes("le contact sera lessiv\\u00e9"));
  t('⑦ l’hygrométrie demandée heure par heure et gardée ; la démo en a ; la liste joue ce fichier', S.app.includes('windspeed_10m,relative_humidity_2m&timezone=Europe/Paris&forecast_days=5') && S.app.includes('hum:d.hourly.relative_humidity_2m||[]') && S.app.includes('window.METEO_HOURLY={time:time,temp:temp,precip:precip,wind:wind,hum:hum};')
    && S.liste.indexOf("mv-harnais-fenetre2.mjs'") > 0 && S.liste.indexOf("mv-harnais-fenetre2.mjs --contre'") > 0);
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
    ['l’hygrométrie ignorée', m('pil', 'function ok(i){ return dry(i)&&calm(i)&&cool(i)&&humid(i)&&jour(i); }', 'function ok(i){ return dry(i)&&calm(i)&&cool(i)&&jour(i); }')],
    ['la nuit permise', m('pil', 'function ok(i){ return dry(i)&&calm(i)&&cool(i)&&humid(i)&&jour(i); }', 'function ok(i){ return dry(i)&&calm(i)&&cool(i)&&humid(i); }')],
    ['le soir décalé (1 h après le coucher)', m('pil', 'return m>=S.c-120&&m<S.c+180;', 'return m>=S.c-120&&m<S.c+60;')],
    ['la pluie d’après sur 6 h seulement', m('pil', 'var PIL_TREAT_HR_MIN=50, PIL_TREAT_APRES_H=72;', 'var PIL_TREAT_HR_MIN=50, PIL_TREAT_APRES_H=6;')],
    ['le lever pris pour le coucher', m('pil', "t=720-4*lng-eq+(lever?-4:4)*Math.acos(x)/R;", "t=720-4*lng-eq+4*Math.acos(x)/R;")],
    ['l’hygrométrie plus demandée', m('app', 'windspeed_10m,relative_humidity_2m&timezone=Europe/Paris&forecast_days=5', 'windspeed_10m&timezone=Europe/Paris&forecast_days=5')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-fenetre2.mjs'").join("mv-harnais-fenetreZ.mjs'") })],
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
