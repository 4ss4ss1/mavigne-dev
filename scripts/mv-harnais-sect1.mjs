// HARNAIS — SECT-1 (§264) : la météo par secteur dans « À savoir ».
//   node scripts/mv-harnais-sect1.mjs           → doit être vert
//   node scripts/mv-harnais-sect1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES _wxDeuxJours, _wxFromApi, window._wxSecteurs (app.js) et _ckSvMeteo (cockpit.js).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { app: L('src/app.js'), ck: L('src/cockpit.js'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };
const bloc = (s, a, fin) => { const i = s.indexOf(a); if (i < 0) throw new Error('introuvable : ' + a); return s.slice(i, s.indexOf(fin, i) + fin.length); };
function serie(j0, jours, f) { const o = { time: [], precipitation: [], windspeed_10m: [] }; jours.forEach((d, k) => { for (let h = 0; h < 24; h++) { o.time.push(d + 'T' + String(h).padStart(2, '0') + ':00'); const v = f(k, h); o.precipitation.push(v[0]); o.windspeed_10m.push(v[1]); } }); return o; }
function monde(S, stock) {
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0,
    localStorage: { getItem: () => stock || null }, wmoIcone: () => 'soleil', wmoDesc: () => 'Beau' };
  ctx.window = ctx; ctx._wxTenant = () => 'mg';
  vm.createContext(ctx);
  vm.runInContext("var _WXCOM_KEY='mavigne_meteocom_cache';\n" + (S.app.match(/var _WXCOM_V=\d+;/) || [''])[0] + '\n'
    + bloc(S.app, 'function _wxDeuxJours(hr){', '\n}\n') + bloc(S.app, 'function _wxFromApi(d){', '\n}\n') + bloc(S.app, 'window._wxSecteurs=function(){', '\n};\n')
    + 'this.__f={_wxDeuxJours:_wxDeuxJours,_wxFromApi:_wxFromApi};', ctx);
  vm.runInContext(S.ck, ctx);
  return ctx;
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  T('le même appel rapporte aussi la pluie et le vent heure par heure, sur trois jours',
    S.app.includes("+'&hourly=precipitation,windspeed_10m'") && S.app.includes("+'&timezone=Europe/Paris&forecast_days=3';") && /var _WXCOM_V=3;/.test(S.app));
  const W = monde(S);
  const hr = serie('2027-01-12', ['2027-01-12', '2027-01-13', '2027-01-14'], (k, h) => [k === 1 && h >= 8 && h <= 10 ? 2 : 0, k === 2 && h === 15 ? 45 : 10]);
  const dj = W.__f._wxDeuxJours(hr);
  T('on garde les deux jours qui SUIVENT celui du relevé (48 heures, à partir de demain 0 h)', dj && dj.time.length === 48 && dj.time[0] === '2027-01-13T00:00' && dj.precip[8] === 2 && dj.wind[39] === 45);
  T('une série vide ne donne rien', W.__f._wxDeuxJours({ time: [] }) === null && W.__f._wxDeuxJours(null) === null);
  const wx = W.__f._wxFromApi({ current: { temperature_2m: 4.4, weathercode: 1, windspeed_10m: 12 }, daily: {}, hourly: hr });
  T('le relevé garde sa forme et porte ses deux jours (wx.h)', wx.temp === 4 && wx.wind === 12 && wx.h.time.length === 48);
  W.METEO_PAR_COMMUNE = { a: { nom: 'Brochon', wx: { h: dj } }, b: { nom: 'Gevrey-Chambertin', wx: { temp: 3 } } };
  T('les secteurs se lisent en mémoire ; un secteur sans ses deux jours est laissé de côté', JSON.stringify(W._wxSecteurs().map(x => x.nom)) === '["Brochon"]');
  const cache = (o) => JSON.stringify(Object.assign({ v: 3, tenant: 'mg', ts: Date.now(), data: { a: { nom: 'Brochon', wx: { h: dj } } } }, o));
  T('sinon le cache du même domaine, de moins de 12 h', monde(S, cache({}))._wxSecteurs().length === 1);
  T('… jamais celui d\u2019un autre domaine, ni d\u2019avant la version 3, ni de plus de 12 h',
    monde(S, cache({ tenant: 'garraud' }))._wxSecteurs().length === 0 && monde(S, cache({ v: 2 }))._wxSecteurs().length === 0 && monde(S, cache({ ts: Date.now() - 13 * 3600e3 }))._wxSecteurs().length === 0);

  const now = new Date(2027, 0, 12, 9, 0);
  const h2 = serie('', ['2027-01-13', '2027-01-14'], (k, h) => [k === 0 && h >= 9 && h <= 10 ? 0.5 : 0, 10]);   // Gevrey : 1 mm demain, sous le seuil
  const sects = [{ nom: 'Brochon', h: { time: dj.time, precip: dj.precip, wind: dj.wind } }, { nom: 'Gevrey-Chambertin', h: { time: h2.time, precip: h2.precipitation, wind: h2.windspeed_10m } }];
  const plan = { parcs: [{ nom: 'Les Charmes', commune: 'Brochon' }, { nom: 'Vignois', commune: 'Brochon' }, { nom: 'Les Crais', commune: 'Gevrey-Chambertin' }],
    journal: [{ date: '2027-01-05', parcelle: 'Les Charmes', tache: 'Brulage', statut: 'Validé' }], fen: [] };
  const m1 = W._ckSvMeteo(null, [{ nom: 'Brulage', pct: 40 }], now, sects, plan);
  T('un secteur touché : la commune, le cumul, la plage horaire', m1[0].quand === 'Demain' && m1[0].titre === 'Pluie annoncée sur Brochon : 6\u202fmm, de 8\u00a0h à 11\u00a0h');
  T('le brûlage attendra sur la commune touchée, avec ses parcelles pas encore faites (la faite ne compte pas, Gevrey non plus)',
    m1[0].prio === 1 && m1[0].sous === 'Le brûlage attendra un temps sec sur Brochon : 1 parcelle pas encore faite.');
  T('le vent fort dit où il souffle', /^Vent annoncé à 45\u202fkm\/h sur Brochon$/.test(m1[1].titre));
  const plus = sects.map(s => s.nom === 'Gevrey-Chambertin' ? { nom: s.nom, h: { time: s.h.time, precip: s.h.precip.map(v => v * 2), wind: s.h.wind } } : s);
  T('plusieurs secteurs : chacun avec son cumul', W._ckSvMeteo(null, [], now, plus, plan)[0].titre === 'Pluie annoncée sur Brochon (6\u202fmm) et Gevrey-Chambertin (2\u202fmm)');
  const H = { time: dj.time, precip: dj.precip, wind: dj.wind };
  const sec = [{ nom: 'Brochon', h: { time: h2.time, precip: h2.precipitation, wind: h2.windspeed_10m } }];
  T('des secteurs sous les seuils l\u2019emportent sur la prévision du domaine : rien à dire', W._ckSvMeteo(H, [], now, sec, plan).length === 0);
  T('des secteurs touchés : une seule ligne par jour, la prévision du domaine ne s\u2019y ajoute pas', W._ckSvMeteo(H, [], now, sects, plan).filter(x => x.quand === 'Demain').length === 1);
  T('sans secteurs : la prévision du domaine, comme avant', W._ckSvMeteo(H, [], now, null, plan)[0].titre === 'Pluie annoncée : 6\u202fmm, de 8\u00a0h à 11\u00a0h');
  T('le cockpit passe les secteurs et le plan à la règle', S.ck.includes("(typeof window._wxSecteurs === 'function' ? window._wxSecteurs() : null), { parcs: (o.parcs || window.PARCELLES || []), journal: o.journal, fen: o.fenetres }"));
  T('aide, guide et nouveauté (8.36)', S.uti.includes('secteur par secteur quand le domaine s’étend sur plusieurs communes') && S.guide.includes("secteur par secteur si le domaine s'étend sur plusieurs communes")
    && /\{ v: '8\.36', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-savoir'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['l\u2019appel resté sur un jour', 'app', "+'&timezone=Europe/Paris&forecast_days=3';", "+'&timezone=Europe/Paris&forecast_days=1';"],
    ['le jour du relevé gardé avec les suivants', 'app', "var s=String(hr.time[i]); if(s.slice(0,10)===j0) continue;", "var s=String(hr.time[i]);"],
    ['un cache d\u2019un autre domaine relu', 'app', "&&raw.tenant===_wxTenant()&&", "&&"],
    ['un cache d\u2019avant la version 3 relu', 'app', "if(raw&&raw.v===_WXCOM_V&&raw.data", "if(raw&&raw.data"],
    ['un cache trop vieux relu', 'app', "&&raw.ts&&(Date.now()-raw.ts)<12*3600*1000) s=raw.data;", ") s=raw.data;"],
    ['la prévision du domaine qui passe devant les secteurs', 'ck', "      out.push({ cat: 'meteo', prio: prio, quand: quand, titre: tt, sous: sous });\n      return;\n    }\n    if(!H", "      out.push({ cat: 'meteo', prio: prio, quand: quand, titre: tt, sous: sous });\n    }\n    if(!H"],
    ['les parcelles faites comptées', 'ck', "(e === 'afaire' || e === 'cours' || e === 'retard')", "e !== 'arr'"],
    ['les communes non touchées comptées', 'ck', "return p && com.indexOf(String(p.commune || '').trim()) >= 0 && (", "return p && ("],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length !== 2) { console.log('  ??  ancre introuvable ou multiple : ' + nom); manques++; return; }
    S[f] = S[f].replace(a, b);
    const rouge = jouer(S).some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
