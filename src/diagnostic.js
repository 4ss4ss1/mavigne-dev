/* ═════════════════════════════════════════════════════════════════
   MA VIGNE — LE CHAI › DIAGNOSTIC (src/diagnostic.js) — DIAG-1
   ★ Lecture seule : croise ce que la cave sait déjà (Cuvées, Labo, Cuvier,
     opérations, fûts, dégustations) et nomme une cause possible quand
     plusieurs signaux vont ensemble. Rien ne s'y saisit ; seule action :
     préparer une demande d'analyse au labo.
   ★ Fidèle à la maquette validée le 22/10 (maquette-analyses-chai.html).
   ⚠ Les données : _laboLignes() (cave.js) pour TOUTES les analyses, la cuve
     d'origine par decuvage.cuvee_id (même règle que _caveCuveSource),
     CAVE_ELEVAGE.operations pour les gestes du Chai, cuve.operations pour
     ceux du Cuvier. Les réglages : CAVE_ELEVAGE.config.diag (admin).
   ⚠ Police : « 2 » n'est pas dans le subset auto-hébergé — la source écrit
     SO2 / H2SO4, et dgnTypo() pose <sub> à l'affichage (jamais dans un attribut).
   ⚠ Toutes les classes sont préfixées dgn- : styles.css porte des .ok, .on,
     .chip, .vide… génériques qui fuiraient ici.
   © 2026 Nicolas GUÉRET / GUERETTECH
   ═════════════════════════════════════════════════════════════════ */
var DGN_ROOT = 'mvc-body-diag';
function dgnAujMs() {
  var s = (typeof window._mvToday === 'function') ? window._mvToday() : new Date().toISOString().slice(0, 10);
  var p = String(s).slice(0, 10).split('-');
  return Date.UTC(+p[0], +p[1] - 1, +p[2]);
}
function dgnIso(ms) { var d = new Date(ms); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
function dgnOkD(s) { if (!s) return false; var p = String(s).slice(0, 10).split('-'); return p.length === 3 && isFinite(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
function dgnD(s) { return String(s).slice(0, 10); }
function dgnNum(v) { if (v == null || v === '' || typeof v === 'boolean') return null; var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
function dgnCuveDe(cuvee) {
  var V = window.CAVE_VENDANGE, L = (V && V.cuves_vinif) || [];
  for (var i = 0; i < L.length; i++) if (L[i] && L[i].decuvage && String(L[i].decuvage.cuvee_id) === String(cuvee.id)) return L[i];
  return null;
}
function dgnCoul(cv) {
  if (!cv || !Array.isArray(cv.parcelles) || typeof window._parcCoul !== 'function') return 'rouge';
  var b = 0, r = 0;
  cv.parcelles.forEach(function (p) { if (window._parcCoul(p) === 'b') b++; else r++; });
  return b > r ? 'blanc' : 'rouge';
}
function dgnOpsDe(cuvee) {
  var E = window.CAVE_ELEVAGE;
  return ((E && E.operations) || []).filter(function (op) {
    if (!op || typeof op !== 'object' || !dgnOkD(op.date)) return false;
    var ids = (Array.isArray(op.cuvees_ids) && op.cuvees_ids.length) ? op.cuvees_ids : (op.cuvee_id != null ? [op.cuvee_id] : []);
    return ids.some(function (x) { return String(x) === String(cuvee.id); });
  });
}
var DGN_CUVIER = {
  so2: ['so2', 'Sulfitage'], levurage: ['levure', 'Levurage'], nutriment: ['nutri', 'Nutriment'], chaptalisation: ['chapt', 'Chaptalisation'],
  acidification: ['trait', 'Acidification'], desacidification: ['trait', 'Désacidification'], enzymage: ['trait', 'Enzymage'], tanins: ['trait', 'Tanins'],
  collage: ['trait', 'Collage'], bentonite: ['trait', 'Bentonite'], delestage: ['trait', 'Délestage'], saignee: ['trait', 'Saignée'],
  remontage: ['trait', 'Remontage'], pigeage: ['trait', 'Pigeage'], assemblage: ['asm', 'Assemblage'], bacteries: ['malo', 'Ensemencement de la malo']
};
var DGN_SIG = { fruit: 'fruité', ouv: 'ouvert', ferm: 'fermé', red: 'réduit', oxy: 'oxydatif', vol: 'piqué, volatile', ani: 'animal, écurie', bois: 'boisé' };
/* DIAG-4 : la force de la solution de SO2 du Chai (Réglages du diagnostic) convertit une dose du soutirage en mg/L. */
function dgnMglChai(dose, unite, volL) {
  var c = (typeof S !== 'undefined' && S.set) ? S.set.solution : null;
  if (!c || dose == null || !(volL > 0)) return null;
  var ml = (unite === 'mL' || unite === 'ml') ? dose : dose * 10;
  return Math.round(ml * c / 100 * 1000 / volL * 10) / 10;
}
function dgnModele(cuvee, lab) {
  var cv = dgnCuveDe(cuvee), parD = {};
  lab.forEach(function (l) {
    var ok = (l.lieu === 'chai' && String(l.cid) === String(cuvee.id)) || (cv && l.lieu === 'cuvier' && String(l.cid) === String(cv.id));
    if (!ok || !dgnOkD(l.date)) return;
    var d = dgnD(l.date), a = parD[d] || { d: d }, n = 0;
    ['tav', 'dp', 'gf', 'av', 'at', 'ph', 'so2l', 'so2t', 'mal', 'azote', 'ep', 'acet', 'ethanal'].forEach(function (k) { var o = l.vals && l.vals[k]; if (o && isFinite(o.v)) { a[k] = +o.v; if (k === 'azote') a.nass = +o.v; n++; } });   /* DIAG-3 : les quatre analyses neuves du labo */
    if (l.malo === 'ok') { a.maloOk = true; n++; }
    if (n) parD[d] = a;
  });
  var ana = Object.keys(parD).sort().map(function (d) { return parD[d]; });
  var mes = (cv && Array.isArray(cv.mesures_fa)) ? cv.mesures_fa.filter(function (m) { return m && typeof m === 'object' && dgnOkD(m.date); }).slice().sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); }) : [];
  var dec = (cv && cv.decuvage && typeof cv.decuvage === 'object') ? cv.decuvage : null;
  var fa0 = mes.length ? dgnD(mes[0].date) : null, fa1 = dec && dgnOkD(dec.fa_fin_date) ? dgnD(dec.fa_fin_date) : (dec && dgnOkD(dec.date) ? dgnD(dec.date) : null);
  var m0 = dec && dgnOkD(dec.date) ? dgnD(dec.date) : null;
  var m1 = null;
  if (cuvee.fml_terminee && dgnOkD(cuvee.fml_terminee_date)) m1 = dgnD(cuvee.fml_terminee_date);
  if (!m1) { var aok = ana.filter(function (a) { return a.maloOk && (!m0 || a.d >= m0); })[0]; if (aok) m1 = aok.d; }
  if (!m1 && cuvee.fml_terminee) { var amal = ana.filter(function (a) { return a.mal != null && a.mal < 0.1 && (!m0 || a.d >= m0); })[0]; m1 = amal ? amal.d : (m0 || (ana[0] && ana[0].d) || null); }
  var futs = (Array.isArray(cuvee.tonneaux) ? cuvee.tonneaux : []).filter(function (l) { return l && typeof l === 'object'; }).map(function (l) {
    var an = parseInt(l.annee, 10), mil = parseInt(cuvee.millesime, 10);
    var vins = (isFinite(an) && typeof window._mvFutVins === 'function') ? window._mvFutVins(an, isFinite(mil) ? mil : null) : null;
    return { t: String(l.four || '').trim() || 'Tonnelier non renseigné', an: isFinite(an) ? an : null, nb: Math.max(1, parseInt(l.nb, 10) || 1), vins: vins };
  });
  var nbL = 0, sumL = 0;
  (Array.isArray(cuvee.tonneaux) ? cuvee.tonneaux : []).forEach(function (l) { var v = dgnNum(l && l.l), nb = Math.max(1, parseInt(l && l.nb, 10) || 1); if (v > 0) { sumL += v * nb; nbL += nb; } });
  var futL = nbL ? sumL / nbL : 228;
  var gestes = [], ouil = [], ouilVol = [];
  if (cv && Array.isArray(cv.operations)) cv.operations.forEach(function (o) {
    if (!o || typeof o !== 'object' || !dgnOkD(o.date)) return;
    var ty = DGN_CUVIER[o.type] || ['trait', String(o.type || 'Opération').charAt(0).toUpperCase() + String(o.type || 'opération').slice(1)];
    var dose = dgnNum(o.dose), g = { d: dgnD(o.date), k: ty[0], l: ty[1], det: '' };
    if (o.type === 'so2') { g.mgl = dose != null ? dose * 10 : null; g.det = dose != null ? dose + ' g/hL' : ''; }
    else if (dose != null) g.det = dose + (o.dose_unit ? ' ' + o.dose_unit : '');
    gestes.push(g);
  });
  if (dec && dgnOkD(dec.date)) gestes.push({ d: dgnD(dec.date), k: 'enton', l: 'Décuvage et entonnage', det: '' });
  dgnOpsDe(cuvee).forEach(function (op) {
    var d = (op.data && typeof op.data === 'object') ? op.data : {}, ds = dgnD(op.date);
    if (op.type === 'ouillage') { ouil.push(ds); var vo = dgnNum(d.vol_total_L); if (vo > 0) ouilVol.push({ d: ds, v: vo }); return; }   /* DIAG-5 : le volume ouillé fait la part des anges */
    if (op.type === 'analyse') return;
    if (op.type === 'soutirage') {
      gestes.push({ d: ds, k: 'sout', l: 'Soutirage', det: d.note ? String(d.note) : '', air: (d.air === true || d.air === false) ? d.air : null });   /* DIAG-2 : op.data.air */
      var so2 = (d.so2 && typeof d.so2 === 'object') ? d.so2 : null;
      if (so2 && so2.mode && so2.mode !== 'none') {
        var dts = (Array.isArray(so2.dates) && so2.dates.length) ? so2.dates : [ds], dose2 = dgnNum(so2.dose);
        dts.filter(dgnOkD).forEach(function (x) { if (dgnD(x) <= dgnIso(dgnAujMs())) gestes.push({ d: dgnD(x), k: 'so2', l: 'Sulfitage au soutirage', det: dose2 != null ? dose2 + ' ' + (so2.unite || 'cL') + ' par fût' : '', mgl: dgnMglChai(dose2, so2.unite || 'cL', futL) }); });
      }
      return;
    }
    if (op.type === 'soufre') { var nb = dgnNum(d.nb_total), gp = dgnNum(d.grammes_pastille); gestes.push({ d: ds, k: 'so2', l: 'Méchage', det: nb ? nb + ' pastille' + (nb > 1 ? 's' : '') + (gp ? ' de ' + gp + ' g' : '') : '', mgl: null }); return; }
    if (op.type === 'degustation') {
      var f = (d.fut && typeof d.fut === 'object') ? d.fut : null, sig = Array.isArray(d.signaux) ? d.signaux.slice() : [];
      var txt = sig.map(function (x) { return DGN_SIG[x] || x; }).join(', ');
      gestes.push({ d: ds, k: 'degus', temp: dgnNum(d.temp_chai), l: f ? 'Dégustation d’un fût' : 'Dégustation', det: (f && f.repere ? 'Fût ' + f.repere + (f.four || f.annee ? ' (' + [f.four, f.annee].filter(Boolean).join(', ') + ')' : '') + ' : ' : '') + (txt || 'aucun signal noté') + '.', sig: sig, suite: d.suite || null, fut: f ? ('fût ' + String(f.repere || '').trim()).trim() : null, futDe: f ? [f.four, f.annee].filter(Boolean).join(', ') : '' });
      return;
    }
    var LBL2 = { traitement: ['trait', 'Traitement'], filtration: ['filtre', 'Filtration'], retrait_fut: ['retrait', 'Retrait de fût'], assemblage: ['asm', 'Assemblage'] }[op.type] || ['trait', 'Opération'];
    gestes.push({ d: ds, k: LBL2[0], l: LBL2[1] + (d.produit ? ' : ' + d.produit : ''), det: '' });
  });
  var mise = (cuvee.statut === 'embouteille' && dgnOkD(cuvee.date_embouteillage)) ? dgnD(cuvee.date_embouteillage) : null;
  if (mise) gestes.push({ d: mise, k: 'mise', l: 'Mise en bouteille', det: cuvee.nb_bouteilles ? Number(cuvee.nb_bouteilles).toLocaleString('fr-FR') + ' bouteilles' : '' });
  gestes.sort(function (a, b) { return a.d < b.d ? -1 : (a.d > b.d ? 1 : 0); });
  if (mise) {
    var avant = ana.filter(function (a) { return a.d <= mise; }), la = avant[avant.length - 1];
    if (la && (Date.parse(mise) - Date.parse(la.d)) / 864e5 <= 45) la.mise = true;
    ana.forEach(function (a) { if (a.d > mise) a.bouteille = true; });
  }
  var densPts = [];
  mes.forEach(function (m) {
    var v = (typeof window._vendMesD20 === 'function') ? dgnNum(window._vendMesD20(m)) : dgnNum(m.densite);
    if (v == null) return; if (v < 2) v = v * 1000;
    if (v >= 1002) densPts.push({ d: dgnD(m.date), s: Math.round((v - 1000) * 2.2) });
  });
  /* DIAG-5 : part des anges = volume ouillé ramené à l’année, sur le volume des fûts de la cuvée (au moins deux mois d’ouillages) */
  var anges = null, volFuts = nbL ? sumL : 0;
  if (ouilVol.length >= 2 && volFuts > 0) {
    var j0 = Date.parse(ouilVol[0].d + 'T00:00:00Z'), j1 = Date.parse(ouilVol[ouilVol.length - 1].d + 'T00:00:00Z'), ans = (j1 - j0) / 864e5 / 365;
    if (ans >= 60 / 365) anges = Math.round(ouilVol.slice(1).reduce(function (s, o) { return s + o.v; }, 0) / volFuts / ans * 1000) / 10;
  }
  var mt = function (v) { return v === 'stable' || v === 'instable' ? v : null; };
  var dates = [fa0, m0].concat(ana.map(function (a) { return a.d; }), gestes.map(function (g) { return g.d; })).filter(Boolean).sort();
  var debut = dates.length ? dgnIso(Date.parse(dates[0] + 'T00:00:00Z') - 5 * 864e5) : dgnIso(dgnAujMs() - 30 * 864e5);
  if (!fa1) fa1 = fa0 || m0 || debut;
  if (!fa0) fa0 = fa1;
  if (!m0) m0 = fa1;
  return { k: String(cuvee.id), id: cuvee.id, nom: String(cuvee.nom || 'Cuvée'), mil: cuvee.millesime != null ? cuvee.millesime : '', coul: dgnCoul(cv), anges: anges, o2: dgnNum(cuvee.mise_o2), prot: mt(cuvee.mise_prot),
    futs: futs, debut: debut, fa: [fa0, fa1], malo: [m0, m1], mise: mise, bouteilles: cuvee.nb_bouteilles || null, tart: mt(cuvee.mise_tart), co2: null,
    densPts: densPts, ana: ana, gestes: gestes, ouilDates: ouil.sort(), sansCuve: !cv, futL: futL };
}
function dgnDonnees() {
  var E = window.CAVE_ELEVAGE, out = {};
  var lab = (typeof window._laboLignes === 'function') ? window._laboLignes() : [];
  ((E && E.cuvees) || []).forEach(function (c) {
    if (!c || typeof c !== 'object' || c.id == null) return;
    try { out[String(c.id)] = dgnModele(c, lab); }
    catch (err) { if (typeof window.logError === 'function') window.logError({ level: 'info', cat: 'diag-modele', msg: String(err && err.message || err) }); }
  });
  return out;
}
function dgnReglages() {
  var E = window.CAVE_ELEVAGE, c = (E && E.config && E.config.diag && typeof E.config.diag === 'object') ? E.config.diag : {};
  var n = function (v, d) { var x = parseFloat(v); return isFinite(x) ? x : d; };
  var sol = parseFloat(c.solution);
  return { unite: c.unite === 'acet' ? 'acet' : 'h2so4', objR: n(c.objR, 0.5), objB: n(c.objB, 0.8), seuil: n(c.seuil, 0.60), solution: (isFinite(sol) && sol > 0) ? sol : null };
}
function dgnPeutRegler() { return typeof window.isAdmin === 'function' && !!window.isAdmin(); }
function dgnEnregistrer(msg) {
  var E = window.CAVE_ELEVAGE; if (!E || !dgnPeutRegler()) return;
  if (!E.config) E.config = {};
  E.config.diag = { unite: S.set.unite, objR: S.set.objR, objB: S.set.objB, seuil: S.set.seuil, solution: S.set.solution };
  window.CAVE_ELEVAGE = E;
  if (typeof window.fbSaveToast === 'function') window.fbSaveToast({ cave_elevage: E }, msg, '#3D6B27');
}

var J = 864e5, PKA = 1.8, F_ACET = 0.815, USUEL_AV = 0.007, USUEL_LIE = 2;
function t(s) { if (!s) return NaN; var p = String(s).slice(0, 10).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
var AUJ = dgnAujMs();
var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
function fd(ms, an) { var d = new Date(ms), j = d.getUTCDate(); return (j === 1 ? '1er' : String(j)) + ' ' + MOIS[d.getUTCMonth()] + (an ? ' ' + d.getUTCFullYear() : ''); }
function nf(v, k) { var m = Math.pow(10, k); return (Math.round(v * m) / m).toFixed(k).replace('.', ','); }
function sg(v, k) { return (v >= 0 ? '+' : '−') + nf(Math.abs(v), k); }
function pt(x) { return /\.$/.test(x) ? x : x + '.'; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ls(pts) {
  if (pts.length < 2) return null;
  var n = pts.length, mx = 0, my = 0, sxy = 0, sxx = 0;
  pts.forEach(function (p) { mx += p.ms; my += p.v; }); mx /= n; my /= n;
  pts.forEach(function (p) { sxy += (p.ms - mx) * (p.v - my); sxx += (p.ms - mx) * (p.ms - mx); });
  if (!sxx) return null;
  var b = sxy / sxx; return { b: b * J, at: function (ms) { return my + b * (ms - mx); } };
}
function actif(l, ph) { return l / (1 + Math.pow(10, ph - PKA)); }
function besoin(o, ph) { return o * (1 + Math.pow(10, ph - PKA)); }
function avU(v) { return S.set.unite === 'acet' ? v / F_ACET : v; }
function uAv(court) { return S.set.unite === 'acet' ? (court ? 'g/L acét.' : 'g/L en acide acétique') : (court ? 'g/L H2SO4' : 'g/L en H2SO4'); }

function analyser(D) {
  var set = S.set, obj = D.coul === 'blanc' ? set.objB : set.objR, an = D.ana;
  var miseMs = D.mise ? t(D.mise) : null, ref = miseMs || AUJ;
  function phAt(ms) { var ph = null; an.forEach(function (a) { if (a.ph != null && !a.lot && t(a.d) <= ms) ph = a.ph; }); return ph; }
  function serie(k) { return an.filter(function (a) { return a[k] != null && !a.lot; }).map(function (a) { return { ms: t(a.d), v: a[k], a: a }; }); }
  var nbF = 0, nbNeuf = 0, sv = 0;
  var nbA = 0; D.futs.forEach(function (f) { nbF += f.nb; if (f.vins === 0) nbNeuf += f.nb; if (f.vins != null) { sv += f.vins * f.nb; nbA += f.nb; } });
  var part = nbF ? nbNeuf / nbF : 0, age = nbA ? sv / nbA : null;
  var faEnd = t(D.fa[1]), m0 = t(D.malo[0]), maloEnd = D.malo[1] ? t(D.malo[1]) : null;
  var adds = D.gestes.filter(function (g) { return g.k === 'so2'; }).map(function (g) { return { ms: t(g.d), mgl: g.mgl || null }; });

  /* SO2 */
  var so2 = { vide: true };
  var sp = serie('so2l').filter(function (p) { return !p.a.bouteille; }).map(function (p) { return { ms: p.ms, v: p.v, tot: p.a.so2t, ph: phAt(p.ms), a: p.a }; });
  if (sp.length && miseMs) {
    var am = sp.filter(function (p) { return p.a.mise; })[0] || sp[sp.length - 1];
    var ap = an.filter(function (a) { return a.bouteille; })[0];
    so2 = { vide: false, mise: true, last: am, act: actif(am.v, am.ph), actAuj: actif(am.v, am.ph), need: besoin(obj, am.ph), tot: am.tot, apres: ap ? { ms: t(ap.d), v: ap.so2l } : null };
  } else if (sp.length) {
    var last = sp[sp.length - 1];
    var lastAdd = adds.filter(function (a) { return a.ms <= last.ms; }).pop();
    var since = sp.filter(function (p) { return !lastAdd || p.ms > lastAdd.ms; });
    var fit = ls(since), fitLast = fit ? fit.at(last.ms) : last.v, need = besoin(obj, last.ph);
    var estAuj = fit ? fit.at(AUJ) : last.v;
    var cross = null;
    if (fit && fit.b < -0.005 && fitLast > need) cross = last.ms + (fitLast - need) / (-fit.b) * J;
    var rend = null;
    if (lastAdd) {
      var bef = sp.filter(function (p) { return p.ms < lastAdd.ms; }).pop(), aft = sp.filter(function (p) { return p.ms > lastAdd.ms; })[0];
      if (bef && aft && lastAdd.mgl) rend = (aft.v - bef.v) / lastAdd.mgl;
    }
    var manque = Math.max(0, need - estAuj), dose = (rend && rend > 0.15 && manque > 0) ? manque / rend : null;
    var lie = null;
    if (since.length >= 2) { var b0 = since[0], b1 = since[since.length - 1], mois = (b1.ms - b0.ms) / J / 30.44; if (mois > 0.5) lie = ((b1.tot - b1.v) - (b0.tot - b0.v)) / mois; }
    var ageJ = Math.round((AUJ - last.ms) / J);
    so2 = {
      vide: false, mise: false, last: last, need: need, act: actif(last.v, last.ph), estAuj: estAuj, actAuj: actif(estAuj, last.ph),
      fit: fit, cross: cross, rend: rend, dose: dose, totApres: dose != null ? last.tot + dose : null, cl: dose != null ? dose * (D.futL || 228) / 1000 * 10 / (S.set.solution || 10) : null,
      lie: lie, since: since, lastAdd: lastAdd, ageJ: ageJ, vieux: ageJ > 45
    };
  }

  /* Volatile */
  var avp = serie('av');
  var avFa = (avp.filter(function (p) { return p.ms >= faEnd; })[0] || avp[0] || { v: 0.25 }).v;
  var avMalo = maloEnd ? (avp.filter(function (p) { return p.ms >= maloEnd; })[0] || { v: avFa }).v : null;
  var budgetAn = 0.04 + 0.12 * part, TOL = 0.03;
  function env(ms) {
    if (ms <= faEnd) return 0.33;
    if (!maloEnd || ms <= maloEnd) { var m1 = maloEnd || (m0 + 70 * J), p = Math.min(1, Math.max(0, (ms - m0) / (m1 - m0))); return avFa + 0.24 * p + TOL; }
    return avMalo + budgetAn * (ms - maloEnd) / (365 * J) + TOL;
  }
  var avLast = miseMs ? (avp.filter(function (p) { return p.a.mise; })[0] || avp[avp.length - 1]) : avp[avp.length - 1];
  var elev = maloEnd ? avp.filter(function (p) { return p.ms >= maloEnd && p.ms <= ref; }) : [];
  var rec = ls(elev.slice(-3)), pente = rec ? rec.b * 30.44 : null;
  var av = !avLast ? { vide: true, last: null, env: null, hors: false, pente: null, rec: null, vite: false, auSeuil: false, fa: null, malo: null } : {
    last: avLast, env: env(avLast.ms), hors: avLast.v > env(avLast.ms) + 1e-9, pente: pente, rec: rec,
    vite: !miseMs && pente != null && pente > 2 * USUEL_AV, auSeuil: !miseMs && avLast.v >= set.seuil - 1e-9, fa: avFa, malo: avMalo
  };

  /* Sucres restants */
  var gfp = serie('gf');
  var gfFa = gfp.filter(function (p) { return p.ms >= faEnd - 3 * J && p.v < 1; })[0] || null;
  var gfLast = miseMs ? (gfp.filter(function (p) { return p.a.mise; })[0] || gfp[gfp.length - 1]) : gfp[gfp.length - 1];
  var gf = { fa: gfFa, last: gfLast, baisse: !!(gfFa && gfLast && gfLast.ms > gfFa.ms && (gfFa.v - gfLast.v) >= 0.2 - 1e-9) };

  /* Malo, alcool */
  var malp = serie('mal'), malLast = malp[malp.length - 1] || null;
  var tavp = serie('tav'), tav = tavp.length ? tavp[tavp.length - 1].v : null;
  var dpp = serie('dp'), dp = dpp.length ? dpp[0].v : null;
  var enrich = 0, enrichInconnu = false; D.gestes.forEach(function (g) { if (g.k === 'chapt') { if (g.vol) enrich += g.vol; else enrichInconnu = true; } });
  var so2tp = serie('so2t'), so2t = so2tp.length ? so2tp[so2tp.length - 1].v : null;
  var phLast = phAt(ref);
  var conds = [], nLim = 0, tempChai = null;
  D.gestes.forEach(function (g) { var ms = t(g.d); if (g.k === 'degus' && g.temp != null && ms <= ref && ms >= ref - 30 * J) tempChai = { v: g.temp, ms: ms }; });
  if (!maloEnd) {
    var cond = function (nom, txt, fav, def) { return { nom: nom, v: txt, etat: fav ? 'favorable' : (def ? 'défavorable' : 'limite') }; };
    if (tav != null) conds.push(cond('TAV', nf(tav, 1) + ' % vol', tav < 13, tav > 14));
    if (phLast != null) conds.push(cond('pH', nf(phLast, 2), phLast >= 3.3 && phLast <= 3.5, phLast < 3.1));
    if (so2t != null) conds.push(cond('SO2 total', nf(so2t, 0) + ' mg/L', so2t < 30, so2t > 40));
    if (tempChai) conds.push(cond('Chai', nf(tempChai.v, 1) + ' °C', tempChai.v >= 18 && tempChai.v <= 22, tempChai.v < 16));   /* DIAG-5 : la température notée à la dégustation */
    nLim = conds.filter(function (c) { return c.etat !== 'favorable'; }).length;
  }

  /* Signaux */
  var lie2 = !so2.vide && !so2.mise && so2.lie != null && so2.lie > 2 * USUEL_LIE;
  var sigs = [];
  if (!miseMs && maloEnd && (av.hors || av.vite)) sigs.push('av');
  if (!miseMs && gf.baisse) sigs.push('gf');
  if (lie2) sigs.push('lie');

  /* Geste choisi par défaut */
  var defSel = 0, best = -1;
  D.gestes.forEach(function (g, i) {
    var ms = t(g.d), sc = ms <= ref ? 1 : 0;
    if (g.k === 'degus' && g.suite) sc = 3;
    if (sc >= best) { best = sc; defSel = i; }
  });

  var ou = (D.ouilDates || []).map(t).filter(function (m) { return m <= ref; });

  return {
    D: D, obj: obj, miseMs: miseMs, ref: ref, phAt: phAt, serie: serie, nbF: nbF, nbNeuf: nbNeuf, part: part, age: age,
    faEnd: faEnd, m0: m0, maloEnd: maloEnd, adds: adds, so2: so2, av: av, env: env, gf: gf, malLast: malLast,
    tav: tav, dp: dp, enrich: enrich, tempChai: tempChai, so2t: so2t, phLast: phLast, conds: conds, nLim: nLim, sigs: sigs, defSel: defSel,
    ouil: ou, enrichInconnu: enrichInconnu, so2Ajoute: adds.reduce(function (s, a) { return s + (a.mgl || 0); }, 0), so2Inconnu: adds.some(function (a) { return !a.mgl; })
  };
}

function joursA(ms) { return Math.round((ms - AUJ) / J); }

function gravite(M) {
  var s = M.so2;
  if (M.miseMs) return { g: 'n', txt: 'Fiche du vin', cls: '' };
  if (M.sigs.length >= 2 || M.av.auSeuil) return { g: 'dan', txt: M.sigs.length >= 2 ? M.sigs.length + ' signaux' : 'Volatile au seuil', cls: 'dan' };
  if (!s.vide && s.vieux) return { g: 'att', txt: 'Analyse à refaire', cls: 'att' };
  if (!s.vide && s.actAuj < M.obj) return { g: s.actAuj < 0.8 * M.obj ? 'dan' : 'att', txt: 'SO2 sous l’objectif', cls: s.actAuj < 0.8 * M.obj ? 'dan' : 'att' };
  if (!s.vide && s.cross && joursA(s.cross) <= 21) return { g: 'att', txt: 'SO2 dans ' + joursA(s.cross) + ' j', cls: 'att' };
  if (!M.maloEnd && M.nLim) return { g: 'att', txt: 'Malo à surveiller', cls: 'att' };
  if (M.sigs.length === 1) return { g: 'att', txt: '1 signal', cls: 'att' };
  return { g: 'ok', txt: (!s.vide && s.cross) ? 'SO2 dans ' + joursA(s.cross) + ' j' : 'Tout va bien', cls: '' };
}

function etape(M) {
  var D = M.D;
  if (M.miseMs) return 'Mis en bouteille le ' + fd(M.miseMs, true);
  if (!M.maloEnd) return 'Entonné depuis ' + Math.round((AUJ - M.m0) / J) + ' jours, malo non démarrée';
  var mois = Math.round((AUJ - t(D.fa[1])) / J / 30.44);
  return 'En élevage depuis ' + mois + ' mois';
}

function vinsTxt(n) { return n == null ? 'inconnu' : nf(n, 1) + (n >= 2 ? ' vins' : ' vin'); }
function tuiles(M) {
  var s = M.so2, av = M.av, T = [];
  if (s.vide) T.push({ k: 'so2', t: 'SO2 actif', v: '—', u: '', p: ['n', 'Non mesuré'], c: 'Pas de sulfitage pendant la malo.' });
  else if (s.mise) T.push({ k: 'so2', t: 'SO2 actif', v: nf(s.act, 2), u: 'mg/L', p: ['n', 'À la mise'], c: 'Libre ' + nf(s.last.v, 0) + ' mg/L, total ' + nf(s.tot, 0) + ' mg/L, pH ' + nf(s.last.ph, 2) + '.' });
  else if (s.vieux) T.push({ k: 'so2', t: 'SO2 actif', v: nf(s.actAuj, 2), u: 'mg/L', p: ['att', 'Estimation ancienne'], c: 'Dernière analyse il y a ' + s.ageJ + ' jours.' });
  else if (s.actAuj < M.obj) T.push({ k: 'so2', t: 'SO2 actif', v: nf(s.actAuj, 2), u: 'mg/L', p: [s.actAuj < 0.8 * M.obj ? 'dan' : 'att', 'Sous l’objectif'], c: 'Objectif ' + nf(M.obj, 1) + ' mg/L : il faudrait ' + nf(s.need, 0) + ' mg/L de SO2 libre.' });
  else if (s.cross) { var j = joursA(s.cross); T.push({ k: 'so2', t: 'SO2 actif', v: nf(s.actAuj, 2), u: 'mg/L', p: [j <= 21 ? 'att' : 'ok', 'Sulfitage dans ' + j + ' j'], c: pt('Objectif ' + nf(M.obj, 1) + ' mg/L, franchi vers le ' + fd(s.cross)) }); }
  else T.push({ k: 'so2', t: 'SO2 actif', v: nf(s.actAuj, 2), u: 'mg/L', p: ['ok', 'Stable'], c: 'Objectif ' + nf(M.obj, 1) + ' mg/L.' });
  var ap = M.miseMs ? (av.hors ? ['att', 'Au-dessus de l’attendu'] : ['ok', 'Conforme à l’attendu']) : (av.auSeuil ? ['dan', 'Seuil d’alerte atteint'] : (av.hors ? ['att', 'Au-dessus de l’attendu'] : (av.vite ? ['att', 'Hausse rapide'] : ['ok', 'Conforme à l’attendu'])));
  if (av.vide) T.push({ k: 'av', t: 'Acidité volatile', v: '—', u: '', p: ['n', 'Non mesurée'], c: 'Aucune analyse d’acidité volatile.' });
  else T.push({ k: 'av', t: 'Acidité volatile', v: nf(avU(av.last.v), 2), u: uAv(true), p: ap, c: pt('Valeur attendue ' + (M.miseMs ? 'à la mise' : 'à ce stade') + ' : ' + nf(avU(av.env), 2)) });
  var gfp;
  if (!M.gf.last) gfp = ['n', 'Non mesuré'];
  else if (M.gf.baisse) gfp = ['att', 'En baisse'];
  else if (M.gf.fa && M.gf.last.ms > M.gf.fa.ms) gfp = ['ok', 'Stables'];
  else gfp = ['ok', 'FA terminée'];
  T.push({ k: 'gf', t: 'Sucres résiduels', v: M.gf.last ? nf(M.gf.last.v, 1) : '—', u: 'g/L', p: gfp, c: M.gf.fa ? (M.gf.last.ms > M.gf.fa.ms ? nf(M.gf.fa.v, 1) + ' g/L en fin de FA.' : 'Moins de 1 g/L : vin sec.') : 'Pas de mesure en fin de FA.' });
  if (M.maloEnd) T.push({ k: 'malo', t: 'Malo', v: 'Terminée', u: '', p: ['ok', Math.round((M.maloEnd - M.m0) / J) + ' jours'], c: pt('Achevée le ' + fd(M.maloEnd, true)) });
  else T.push({ k: 'malo', t: 'Malo', v: 'Non démarrée', u: '', p: M.nLim ? ['att', M.nLim + ' frein' + (M.nLim > 1 ? 's' : '')] : ['ok', 'Conditions favorables'], c: Math.round((AUJ - M.m0) / J) + ' jours depuis l’entonnage.' });
  return T;
}

function pourquoi(M, k) {
  var s = M.so2, av = M.av, o = { titre: '', ps: [], repere: '', base: '' }, coul = M.D.coul === 'blanc' ? 'blancs' : 'rouges';
  if (k === 'so2') {
    if (s.vide) { o.titre = 'SO2 actif : en attente de la fin de la malo'; o.ps = ['Le vin n’est pas sulfité pendant la malo : les bactéries y sont sensibles. Le calcul démarre au premier sulfitage.']; return o; }
    o.ps.push('Le SO2 qui protège le vin est le SO2 actif (moléculaire). Il se calcule à partir du SO2 libre et du pH : plus le pH est élevé, plus il faut de SO2 libre pour la même protection.');
    if (s.mise) {
      o.titre = 'Le SO2 à la mise';
      o.ps.push('À la mise : SO2 libre ' + nf(s.last.v, 0) + ' mg/L à pH ' + nf(s.last.ph, 2) + ', soit ' + nf(s.act, 2) + ' mg/L de SO2 actif ; SO2 total ' + nf(s.tot, 0) + ' mg/L.');
      if (s.apres) o.ps.push('Le ' + fd(s.apres.ms, true) + ', en bouteille : SO2 libre ' + nf(s.apres.v, 0) + ' mg/L, soit ' + nf(s.last.v - s.apres.v, 0) + ' mg/L de moins. Une baisse après la mise est habituelle.');
      o.base = 'Objectif du domaine pour les vins ' + coul + ' : ' + nf(M.obj, 1) + ' mg/L de SO2 actif.';
      return o;
    }
    if (s.vieux) {
      o.titre = 'Estimation à confirmer';
      o.ps.push('Dernière analyse il y a ' + s.ageJ + ' jours. L’estimation prolonge la tendance de l’été, plus rapide qu’en hiver.');
      if (s.cross) o.ps.push(pt('À cette vitesse, le SO2 actif passerait sous ' + nf(M.obj, 1) + ' mg/L vers le ' + fd(s.cross) + ' ; seule une analyse récente permet de le confirmer'));
      o.repere = 'Analyse à demander : SO2 libre et total, pH.';
      o.base = 'Calcul fondé sur ' + s.since.length + ' analyses depuis le dernier sulfitage.';
      return o;
    }
    if (s.actAuj < M.obj) {
      o.titre = 'Pourquoi le SO2 actif est sous l’objectif';
      o.ps.push('Ici : SO2 libre ' + nf(s.last.v, 0) + ' mg/L à pH ' + nf(s.last.ph, 2) + '. Pour ' + nf(M.obj, 1) + ' mg/L de SO2 actif, il en faudrait ' + nf(s.need, 0) + ' mg/L.');
      if (s.since.length && s.since[0].v < s.need) o.ps.push('Après le dernier sulfitage, le SO2 libre n’est monté qu’à ' + nf(s.since[0].v, 0) + ' mg/L : à ce pH, la dose était insuffisante.');
      if (s.dose != null) {
        var lim = M.D.coul === 'blanc' ? 200 : 150;
        o.repere = 'Estimation indicative : environ ' + nf(s.dose, 0) + ' mg/L de SO2 à ajouter (sur ce vin, ' + nf(s.rend * 100, 0) + ' % de l’ajout se retrouve en SO2 libre), soit ' + nf(s.cl, 1) + ' cL par fût de solution à ' + nf(S.set.solution || 10, 0) + ' %' + (S.set.solution ? '' : ' (force non réglée : 10 % par défaut)') + '.';
        if (s.totApres > lim) o.repere += ' Le SO2 total atteindrait ' + nf(s.totApres, 0) + ' mg/L, au-delà de la limite de ' + lim + ' mg/L des vins ' + coul + ' : à voir avec l’œnologue.';
      }
    } else {
      o.titre = 'Date du prochain sulfitage';
      o.ps.push('SO2 libre ' + nf(s.last.v, 0) + ' mg/L à pH ' + nf(s.last.ph, 2) + ' : il en faut au moins ' + nf(s.need, 0) + ' mg/L pour ' + nf(M.obj, 1) + ' mg/L de SO2 actif.');
      if (s.fit && s.cross) o.ps.push(pt('Depuis le dernier sulfitage, le SO2 libre baisse de ' + nf(-s.fit.b * 30.44, 1) + ' mg/L par mois. À cette vitesse, le SO2 actif passera sous l’objectif vers le ' + fd(s.cross)));
      if (s.rend) o.repere = 'Sur ce vin, le dernier sulfitage s’est retrouvé à ' + nf(s.rend * 100, 0) + ' % en SO2 libre.';
    }
    o.base = 'Calcul fondé sur ' + s.since.length + ' analyse' + (s.since.length > 1 ? 's' : '') + ' depuis le dernier sulfitage. Objectif du domaine pour les vins ' + coul + ' : ' + nf(M.obj, 1) + ' mg/L de SO2 actif.';
  }
  if (k === 'av' && av.vide) { o.titre = 'Acidité volatile'; o.ps.push('Aucune analyse d’acidité volatile pour cette cuvée : la valeur attendue se calcule dès la première mesure.'); return o; }
  if (k === 'av') {
    o.titre = 'Comment l’acidité volatile est évaluée';
    o.ps.push('La valeur attendue tient compte de la fin de fermentation, de la malo et de la part de fûts neufs : le bois neuf fait légèrement monter l’acidité volatile, le bois usagé presque pas.');
    o.ps.push('Ici, ' + Math.round(M.part * 100) + ' % de fûts neufs. Valeur attendue ' + (M.miseMs ? 'à la mise' : 'à ce stade') + ' : ' + nf(avU(av.env), 2) + ' ' + uAv(true) + '. Mesure : ' + nf(avU(av.last.v), 2) + '.');
    if (av.pente != null && !M.miseMs) o.ps.push('Tendance des trois dernières analyses : ' + sg(avU(av.pente), 3) + ' g/L par mois' + (av.vite ? ', soit ' + nf(av.pente / USUEL_AV, 0) + ' fois la référence du domaine.' : ', conforme à la référence du domaine.'));
    o.base = 'Seuil d’alerte du domaine : ' + nf(avU(S.set.seuil), 2) + ' ' + uAv(true) + ' (réglable). Ordres de grandeur : la malo ajoute 0,1 à 0,3 g/L, l’élevage en fût 0,1 à 0,15 g/L par an (exprimés en acide acétique).';
  }
  if (k === 'gf') {
    o.titre = 'Sucres résiduels';
    if (!M.gf.fa) { o.ps.push('Aucune mesure sous 1 g/L après la fermentation.'); return o; }
    o.ps.push('En fin de fermentation : ' + nf(M.gf.fa.v, 1) + ' g/L de glucose + fructose. Un vin est considéré comme sec sous 1 g/L.');
    if (M.gf.baisse) o.ps.push('En élevage, cette valeur doit rester stable. Elle est descendue à ' + nf(M.gf.last.v, 1) + ' g/L : des micro-organismes consomment ces sucres. Les Brettanomyces se développent dès 0,3 g/L.');
    else if (M.gf.last.ms > M.gf.fa.ms) o.ps.push('Elle est restée à ' + nf(M.gf.last.v, 1) + ' g/L : aucune consommation détectée.');
    else o.ps.push('Une seule mesure pour l’instant : la prochaine analyse indiquera si la valeur reste stable.');
    o.base = 'Glucose + fructose, dosés au laboratoire.';
  }
  if (k === 'malo') {
    if (M.maloEnd) { o.titre = 'Malo terminée'; o.ps.push('Malo achevée le ' + fd(M.maloEnd, true) + ', ' + Math.round((M.maloEnd - M.m0) / J) + ' jours après l’entonnage ; acide malique inférieur à 0,1 g/L.'); o.ps.push('La malo augmente l’acidité volatile : les bactéries dégradent aussi l’acide citrique.'); return o; }
    o.titre = 'Freins de la malo';
    o.ps.push('Repères de l’AWRI : TAV inférieur à 13 % vol, pH de 3,3 à 3,5, SO2 total inférieur à 30 mg/L, température de 18 à 22 °C. Les freins s’additionnent.');
    o.ps.push('Ici : ' + M.conds.map(function (c) { return c.nom + ' ' + c.v + ' (' + c.etat + ')'; }).join(', ') + '.' + (M.tempChai ? '' : ' Température du chai : aucune notée à la dégustation depuis 30 jours.'));
    o.repere = (M.tempChai ? 'Température du chai prise à la dégustation du ' + fd(M.tempChai.ms) + '.' : 'Noter la température du chai à la dégustation compléterait ce diagnostic.');
    o.base = pt('Acide malique : ' + nf(M.malLast.v, 1) + ' g/L le ' + fd(t(M.malLast.a.d)));
  }
  return o;
}

function synthese(M) {
  var s = M.so2, av = M.av;
  if (M.miseMs) return { g: 'ok', txt: 'Mis en bouteille le ' + fd(M.miseMs, true) + ' : ' + M.D.bouteilles.toLocaleString('fr-FR') + ' bouteilles. La volatile est restée dans son budget jusqu’à la mise.' };
  if (M.sigs.length >= 2) return { g: 'dan', txt: 'Depuis juillet, plusieurs signaux à la fois : la volatile monte, les sucres restants baissent, le SO2 se combine.' };
  if (!M.maloEnd) return { g: M.nLim ? 'att' : 'ok', txt: 'Fermentation finie avec ' + nf(M.gf.last.v, 1) + ' g/L de sucres. La malo n’a pas commencé' + (M.nLim ? ', avec ' + ['', 'un', 'deux', 'trois'][M.nLim] + ' frein' + (M.nLim > 1 ? 's' : '') + ' léger' + (M.nLim > 1 ? 's.' : '.') : '.') };
  var txt = (av.hors || av.vite) ? 'La volatile sort de son budget. ' : 'La volatile est dans son budget. ';
  var g = (av.hors || av.vite) ? 'att' : 'ok';
  if (s.vieux) { txt += 'La dernière analyse a ' + s.ageJ + ' jours : à refaire avant de prévoir le sulfitage.'; g = 'att'; }
  else if (s.actAuj < M.obj) { txt += 'Le SO2 actif est passé sous l’objectif : un sulfitage est à prévoir.'; g = 'att'; }
  else if (s.cross) { txt += pt('Prochain sulfitage à prévoir vers le ' + fd(s.cross)); if (joursA(s.cross) <= 21) g = 'att'; }
  return { g: g, txt: txt };
}

function echeances(M) {
  var D = M.D, s = M.so2, av = M.av, nom = D.nom + ' ' + D.mil, out = [];
  if (M.miseMs) return out;
  if (M.sigs.length >= 2) {
    var ch = [];
    if (av.auSeuil || av.hors || av.vite) ch.push('Volatile ' + nf(avU(av.last.v), 2) + (av.auSeuil ? ', au seuil' : ', hors budget'));
    if (M.gf.baisse) ch.push('Sucres ' + nf(M.gf.fa.v, 1) + ' puis ' + nf(M.gf.last.v, 1) + ' g/L');
    if (s.lie != null && s.lie > 2 * USUEL_LIE) ch.push('SO2 combiné +' + nf(s.lie, 1) + ' mg/L par mois');
    if (!s.vide && s.actAuj < M.obj) ch.push('SO2 actif ' + nf(s.actAuj, 2));
    out.push({ quand: 'now', ordre: 0, g: 'dan', cuv: D.k, tuile: 'av', nom: nom, suj: 'Plusieurs signaux à la fois', exp: 'Ensemble, ils font penser à une activité microbienne.', chips: ch, ech: 'Maintenant', act: 'Préparer la demande au labo' });
  } else if (!s.vide && !s.mise && !s.vieux && s.actAuj < M.obj) {
    out.push({ quand: 'now', ordre: 1, g: 'att', cuv: D.k, tuile: 'so2', nom: nom, suj: 'SO2 actif sous l’objectif', exp: 'Libre ' + nf(s.last.v, 0) + ' mg/L à pH ' + nf(s.last.ph, 2) + '.', chips: [], ech: 'Maintenant', act: '' });
  }
  if (!M.maloEnd && M.nLim) out.push({ quand: 'now', ordre: 2, g: 'att', cuv: D.k, tuile: 'malo', nom: nom, suj: 'La malo n’a pas commencé', exp: Math.round((AUJ - M.m0) / J) + ' jours après l’entonnage. Malique ' + nf(M.malLast.v, 1) + ' g/L.', chips: M.conds.filter(function (c) { return c.etat !== 'favorable'; }).map(function (c) { return c.nom + ' ' + c.v + ' : ' + c.etat; }).concat(['Température non suivie']), ech: 'Maintenant', act: '' });
  if (!s.vide && !s.mise && s.vieux) out.push({ quand: 'now', ordre: 3, g: 'att', cuv: D.k, tuile: 'so2', nom: nom, suj: 'Dernière analyse il y a ' + s.ageJ + ' jours', exp: 'La date du prochain sulfitage repose sur des analyses d’été.', chips: [], ech: 'Maintenant', act: 'Demander une analyse' });
  if (!s.vide && !s.mise && s.cross && s.cross > AUJ && s.cross <= AUJ + 60 * J) {
    var j = joursA(s.cross);
    out.push({ quand: 'later', ordre: 10 + j, ms: s.cross, g: j <= 14 ? 'att' : 'n', cuv: D.k, tuile: 'so2', nom: nom, suj: pt('SO2 actif sous ' + nf(M.obj, 1) + ' vers le ' + fd(s.cross)), exp: 'Libre ' + nf(s.last.v, 0) + ' mg/L à pH ' + nf(s.last.ph, 2) + ', baisse de ' + nf(-s.fit.b * 30.44, 1) + ' mg/L par mois.' + (s.vieux ? ' Date incertaine.' : ''), chips: [], ech: 'Dans ' + j + ' j', incertain: s.vieux, act: '' });
  }
  return out;
}

/* ════════ Diagnostic : indices croisés, causes probables, prévisions ════════ */
var USUEL_SO2 = { rouge: 2.6, blanc: 4.2 };
function nez(M, sig) {
  var lim = M.ref - 120 * J;
  var ds = M.D.gestes.filter(function (g) { return g.k === 'degus' && t(g.d) >= lim && t(g.d) <= M.ref; });
  if (!ds.length) return { etat: 'inconnu', val: 'aucune dégustation depuis 4 mois' };
  var hit = ds.filter(function (g) { return (g.sig || []).indexOf(sig) >= 0; }).pop();
  if (hit) return { etat: 'oui', val: 'noté le ' + fd(t(hit.d)) + (hit.fut ? ', ' + hit.fut : ''), g: hit };
  return { etat: 'non', val: 'non relevé à la dégustation du ' + fd(t(ds[ds.length - 1].d)) };
}
function indices(M) {
  var D = M.D, s = M.so2, av = M.av, I = {};
  function mk(id, etat, label, val, src, couloir) { I[id] = { id: id, etat: etat, label: label, val: val || '', src: src, couloir: couloir || null }; }
  var dansElev = function (p) { return M.maloEnd && p.ms >= M.maloEnd && p.ms <= M.ref; };
  if (M.gf.fa && M.gf.last && M.gf.last.ms > M.gf.fa.ms) mk('sucres', M.gf.baisse ? 'oui' : 'non', 'Sucres résiduels en baisse', nf(M.gf.fa.v, 1) + ' puis ' + nf(M.gf.last.v, 1) + ' g/L (glucose + fructose)', 'Labo', 'sucres');
  else mk('sucres', 'inconnu', 'Sucres résiduels en baisse', 'une seule mesure depuis la fin de FA', 'Labo', 'sucres');
  if (!s.vide && !s.mise && s.lie != null) mk('lie', s.lie > 2 * USUEL_LIE ? 'oui' : 'non', 'SO2 combiné en hausse rapide', sg(s.lie, 1) + ' mg/L par mois (référence du domaine : ' + sg(USUEL_LIE, 1) + ')', 'Labo', 'lie');
  else mk('lie', 'inconnu', 'SO2 combiné en hausse rapide', 'analyses insuffisantes depuis le dernier sulfitage', 'Labo', 'lie');
  if (av.vide) mk('av', 'inconnu', 'Acidité volatile au-dessus de l’attendu', 'non mesurée', 'Labo', 'av');
  else mk('av', (av.hors || av.vite) && !M.miseMs ? 'oui' : 'non', 'Acidité volatile au-dessus de l’attendu', nf(avU(av.last.v), 2) + ' ' + uAv(true) + ' pour ' + nf(avU(av.env), 2) + ' attendu' + (av.vite ? ' ; hausse ' + nf(av.pente / USUEL_AV, 0) + ' fois plus rapide que la référence' : ''), 'Labo', 'av');
  var us = USUEL_SO2[D.coul] || 2.6;
  if (!s.vide && !s.mise && s.fit) { var perte = -s.fit.b * 30.44; mk('fond', perte > 1.5 * us ? 'oui' : 'non', 'SO2 libre en baisse rapide', '−' + nf(perte, 1) + ' mg/L par mois (référence du domaine : −' + nf(us, 1) + ')', 'Labo', 'so2'); }
  else mk('fond', 'inconnu', 'SO2 libre en baisse rapide', 'analyses insuffisantes', 'Labo', 'so2');
  if (!s.vide && !s.mise) mk('actif', s.actAuj < M.obj ? 'oui' : 'non', 'SO2 actif sous l’objectif', nf(s.actAuj, 2) + ' mg/L estimé, pour un objectif de ' + nf(M.obj, 1), 'Calcul', 'so2');
  if (M.phLast != null) mk('ph', M.phLast >= 3.6 ? 'oui' : 'non', 'pH élevé', 'pH ' + nf(M.phLast, 2) + ' (repère : 3,60)', 'Labo', 'ph');
  var nbV = 0; D.futs.forEach(function (f) { if (f.vins >= 3) nbV += f.nb; });
  mk('vieux', M.nbF && nbV / M.nbF >= 0.5 ? 'oui' : 'non', 'Fûts âgés', nbV + ' fûts sur ' + M.nbF + ' ont 3 vins ou plus', 'Fûts');
  var mo = new Date(M.ref).getUTCMonth() + 1;
  mk('saison', (mo >= 6 && mo <= 10) ? 'oui' : 'non', 'Période estivale', 'de juin à octobre (calendrier, pas une mesure)', 'Calendrier');
  var na = nez(M, 'ani'); mk('nez_ani', na.etat, 'Nez animal, écurie', na.val, 'Dégustation'); I.nez_ani.g = na.g;
  var nv = nez(M, 'vol'); mk('nez_vol', nv.etat, 'Nez piqué, volatile', nv.val, 'Dégustation'); I.nez_vol.g = nv.g;
  var no = nez(M, 'oxy'); mk('nez_oxy', no.etat, 'Nez oxydatif', no.val, 'Dégustation'); I.nez_oxy.g = no.g;
  var fl = nez(M, 'fleur'); mk('fleur', fl.etat, 'Fleur en surface', fl.val, 'Dégustation');   /* DIAG-2 : le signal « Fleur en surface » de la dégustation */
  var souts = D.gestes.filter(function (g) { return g.k === 'sout' && M.maloEnd && t(g.d) > M.maloEnd && t(g.d) <= M.ref; });
  var air = souts.filter(function (g) { return g.air === true; }).pop();
  if (air) mk('air', 'oui', 'Soutirage à l’air', 'le ' + fd(t(air.d)), 'Opérations');
  else if (souts.some(function (g) { return g.air == null; })) mk('air', 'inconnu', 'Soutirage à l’air', 'aération non renseignée (nouveau champ)', 'Nouveau champ');
  else mk('air', 'non', 'Soutirage à l’air', 'aucun depuis la fin de la malo', 'Opérations');
  var oi = []; for (var q = 1; q < M.ouil.length; q++) oi.push((M.ouil[q] - M.ouil[q - 1]) / J);
  oi = oi.slice(-8).sort(function (a, b) { return a - b; });
  var om = oi.length ? oi[Math.floor(oi.length / 2)] : null;
  if (om == null) mk('ouil', 'inconnu', 'Ouillages espacés', 'moins de deux ouillages enregistrés', 'Opérations');
  else mk('ouil', om > 21 ? 'oui' : 'non', 'Ouillages espacés', 'un tous les ' + Math.round(om) + ' jours environ', 'Opérations');
  var moisElev = M.maloEnd ? (M.ref - M.maloEnd) / J / 30.44 : 0;
  mk('neuf', (M.part >= 0.5 && moisElev < 6) ? 'oui' : 'non', 'Forte part de fûts neufs en début d’élevage', Math.round(M.part * 100) + ' % de fûts neufs', 'Fûts');
  var php = M.serie('ph').filter(dansElev);
  if (php.length >= 2) mk('phup', php[php.length - 1].v - php[0].v >= 0.1 - 1e-9 ? 'oui' : 'non', 'pH en hausse', nf(php[0].v, 2) + ' puis ' + nf(php[php.length - 1].v, 2) + ' depuis la fin de la malo', 'Labo', 'ph');
  else mk('phup', 'inconnu', 'pH en hausse', 'analyses insuffisantes', 'Labo', 'ph');
  var atp = M.serie('at').filter(dansElev);
  if (atp.length >= 2) mk('atdown', atp[0].v - atp[atp.length - 1].v >= 0.3 - 1e-9 ? 'oui' : 'non', 'Acidité totale en baisse', nf(atp[0].v, 2) + ' puis ' + nf(atp[atp.length - 1].v, 2) + ' g/L H2SO4 depuis la fin de la malo', 'Labo', 'at');
  else mk('atdown', 'inconnu', 'Acidité totale en baisse', 'analyses insuffisantes', 'Labo', 'at');
  if (M.gf.last) mk('sucres_haut', M.gf.last.v >= 1 ? 'oui' : 'non', 'Sucres résiduels de 1 g/L ou plus', nf(M.gf.last.v, 1) + ' g/L', 'Labo', 'sucres');
  if (M.malLast) mk('malique', (M.maloEnd && M.malLast.v >= 0.1) ? 'oui' : 'non', 'Acide malique résiduel', M.malLast.v < 0.1 ? 'moins de 0,1 g/L' : nf(M.malLast.v, 1) + ' g/L', 'Labo', 'mal');
  /* DIAG-3 : l’analyse de confirmation, comparée au seuil de perception (4-EP 370 à 620 µg/L ; acétate d’éthyle 150 à 200 mg/L, AWRI ; éthanal 100 à 125 mg/L, AWRI) */
  function laboDer(k) { return D.ana.filter(function (a) { return a[k] != null && !a.bouteille && t(a.d) <= M.ref; }).pop() || null; }
  function confLabo(id, k, label, seuil, u, plur) { var x = laboDer(k); if (!x) { mk(id, 'inconnu', label, plur ? 'non mesurés' : 'non mesuré', 'Labo'); return; } var au = x[k] >= seuil; mk(id, au ? 'oui' : 'non', label, nf(x[k], 0) + ' ' + u + ' le ' + fd(t(x.d)) + (au ? ', au-dessus' : ', en dessous') + ' du seuil de perception (' + seuil + ')', 'Labo'); }
  confLabo('ep', 'ep', 'Éthylphénols (4-EP, 4-EG)', 400, 'µg/L', true);
  confLabo('acet', 'acet', 'Acétate d’éthyle', 150, 'mg/L', false);
  confLabo('ethanal', 'ethanal', 'Éthanal', 100, 'mg/L', false);
  /* malo en cours */
  var mp = M.serie('mal');
  if (!M.maloEnd && mp.length >= 2) { var a0 = mp[mp.length - 2], a1 = mp[mp.length - 1], jj = (a1.ms - a0.ms) / J; mk('mal_stagne', (jj >= 10 && a0.v - a1.v < 0.2) ? 'oui' : 'non', 'Acide malique presque stable', nf(a0.v, 1) + ' puis ' + nf(a1.v, 1) + ' g/L en ' + Math.round(jj) + ' jours', 'Labo', 'mal'); }
  else if (!M.maloEnd) mk('mal_stagne', 'inconnu', 'Acide malique presque stable', 'une seule analyse', 'Labo', 'mal');
  if (M.tav != null) mk('alc', M.tav > 13 ? 'oui' : 'non', 'TAV supérieur à 13 % vol', nf(M.tav, 1) + ' % vol', 'Labo');
  if (M.so2t != null) mk('so2t', M.so2t > 30 ? 'oui' : 'non', 'SO2 total supérieur à 30 mg/L', nf(M.so2t, 0) + ' mg/L', 'Labo');
  if (M.phLast != null) mk('ph_bas', M.phLast < 3.3 ? 'oui' : 'non', 'pH inférieur à 3,3', 'pH ' + nf(M.phLast, 2), 'Labo');
  var tg = M.tempChai; if (tg) mk('temp', tg.v < 16 ? 'oui' : 'non', 'Chai à moins de 16 °C', nf(tg.v, 1) + ' °C le ' + fd(tg.ms) + ' (dégustation)', 'Dégustation'); else mk('temp', 'inconnu', 'Chai à moins de 16 °C', 'aucune température notée à la dégustation depuis 30 jours', 'Dégustation');   /* DIAG-5 */
  if (M.gf.fa || M.gf.last) { var gfin = (M.gf.fa || M.gf.last); mk('sucres_fin', gfin.v >= 1 ? 'oui' : 'non', 'Sucres résiduels de 1 g/L ou plus en fin de FA', nf(gfin.v, 1) + ' g/L', 'Labo', 'sucres'); }
  if (M.phLast != null) mk('ph_haut', M.phLast >= 3.5 ? 'oui' : 'non', 'pH de 3,5 ou plus', 'pH ' + nf(M.phLast, 2), 'Labo', 'ph');
  var nass = D.ana.filter(function (x) { return x.nass != null; })[0];
  if (nass) mk('azote', (nass.nass < 150 || (M.dp >= 13 && nass.nass < 200)) ? 'oui' : 'non', 'Azote assimilable faible pour le degré', nass.nass + ' mg/L pour ' + nf(M.dp, 1) + ' % vol probable', 'Labo');
  /* en bouteille */
  if (s.mise) {
    mk('actif_mise', s.act < M.obj ? 'oui' : 'non', 'SO2 actif à la mise sous l’objectif', nf(s.act, 2) + ' mg/L pour un objectif de ' + nf(M.obj, 1), 'Calcul', 'so2');
    if (s.apres) mk('baisse_btl', s.last.v - s.apres.v > 5 ? 'oui' : 'non', 'SO2 libre en baisse en bouteille', nf(s.last.v, 0) + ' puis ' + nf(s.apres.v, 0) + ' mg/L en ' + Math.round((s.apres.ms - s.last.ms) / J / 30.44) + ' mois', 'Labo', 'so2');
    var tst = function (x) { return x == null ? 'non renseigné' : (x === 'instable' ? 'test défavorable (instable)' : 'test favorable (stable)'); };   /* DIAG-5 : les tests notés à la mise */
    mk('tart_ko', D.tart == null ? 'inconnu' : (D.tart === 'instable' ? 'oui' : 'non'), 'Test de stabilité tartrique défavorable', tst(D.tart), 'Mise');
    mk('prot_ko', D.prot == null ? 'inconnu' : (D.prot === 'instable' ? 'oui' : 'non'), 'Test de stabilité protéique défavorable', tst(D.prot), 'Mise');
    if (D.o2 != null) mk('o2', D.o2 > 1 ? 'oui' : 'non', 'Oxygène dissous à la mise', nf(D.o2, 1) + ' mg/L (repère : 1 mg/L au plus)', 'Mise'); else mk('o2', 'inconnu', 'Oxygène dissous à la mise', 'non mesuré', 'Mise');   /* DIAG-5 */
  }
  return I;
}
var RISQUES = {
  elev: [
    { laboL: ['Éthylphénols (4-EP et 4-EG)'], k: 'brett', nom: 'Brettanomyces (Brett)', tc: 'Brett', question: 'Contamination par les Brettanomyces ?', cause: 'Levure d’altération qui se développe sur les derniers sucres et produit des éthylphénols : odeurs d’écurie, de cuir, de sueur de cheval.', core: [['sucres', 2], ['lie', 2], ['nez_ani', 2]], sup: [['actif', 1], ['av', 1]], ctx: ['ph', 'vieux', 'saison'], conf: ['ep'], labo: 'Éthylphénols (4-EP et 4-EG)', laboDit: 'teneur élevée en cas de Brett', chai: 'odeur d’écurie, de cuir', lanes: ['sucres', 'lie', 'av', 'so2'] },
    { laboL: ['Acétate d’éthyle'], k: 'pique', nom: 'Piqûre acétique (fût piqué)', tc: 'fût piqué', question: 'Piqûre acétique sur un fût ?', cause: 'En présence d’air, des bactéries acétiques transforment l’alcool en acide acétique, puis en acétate d’éthyle : odeur de vinaigre, de colle.', core: [['av', 2], ['nez_vol', 2]], sup: [['fleur', 1], ['air', 1], ['ouil', 1], ['actif', 1]], ctx: [], conf: ['acet'], labo: 'Acétate d’éthyle', laboDit: 'teneur élevée en cas de piqûre acétique', chai: 'odeur de vinaigre, de colle', lanes: ['av', 'so2'] },
    { laboL: ['Éthanal'], k: 'oxy', nom: 'Oxydation', tc: 'oxydation', question: 'Oxydation en cours ?', cause: 'L’oxygène consomme le SO2 libre, puis altère le vin : notes de pomme blette, de noix ; couleur qui évolue.', core: [['nez_oxy', 2], ['fond', 1]], sup: [['lie', 1], ['air', 1], ['ouil', 1], ['fleur', 1]], ctx: ['neuf'], conf: ['ethanal'], labo: 'Éthanal', laboDit: 'teneur élevée en cas d’oxydation ou de fleur', chai: 'pomme blette, noix', lanes: ['so2', 'lie'] },
    { laboL: ['Acidité totale', 'Acide tartrique'], k: 'tourne', nom: 'Tourne (bactéries lactiques)', tc: 'tourne', question: 'Tourne ?', cause: 'Certaines bactéries lactiques dégradent l’acide tartrique : l’acidité totale baisse, le pH et l’acidité volatile augmentent.', core: [['phup', 2], ['atdown', 2]], sup: [['av', 1]], ctx: [], conf: [], labo: 'Acidité totale, pH et acide tartrique', laboDit: '', chai: '', lanes: ['ph', 'at', 'av'] },
    { laboL: ['Acide malique'], k: 'referm', nom: 'Reprise de fermentation', tc: 'reprise de fermentation', question: 'Risque de reprise de fermentation ?', cause: 'Des sucres ou de l’acide malique résiduels peuvent fermenter à nouveau, en fût ou en bouteille.', core: [['sucres_haut', 2], ['malique', 2]], sup: [['sucres', 1]], ctx: [], conf: [], labo: 'Sucres et acide malique', laboDit: '', chai: '', lanes: ['sucres', 'mal'] }
  ],
  malo: [
    { laboL: ['Acide malique'], k: 'malo', nom: 'Malo lente ou bloquée', tc: 'malo lente', question: 'Malo lente ?', cause: 'Les bactéries de la malo sont freinées par un TAV élevé, un SO2 total élevé, un pH bas ou une cave froide ; ces freins s’additionnent.', core: [['mal_stagne', 2]], sup: [['alc', 1], ['so2t', 1], ['ph_bas', 1], ['temp', 1]], ctx: [], conf: [], labo: 'Acide malique dans quinze jours', laboDit: '', chai: 'relever la température du chai', lanes: ['mal'] },
    { laboL: [], k: 'plact', nom: 'Piqûre lactique', tc: 'piqûre lactique', question: 'Risque de piqûre lactique ?', cause: 'Des sucres restés après la fermentation peuvent être attaqués par les bactéries lactiques, avec production d’acidité volatile ; le risque augmente avec le pH.', core: [['sucres_fin', 2]], sup: [['ph_haut', 1], ['av', 1]], ctx: [], conf: [], labo: 'Sucres et acidité volatile', laboDit: '', chai: '', lanes: ['sucres', 'av'] },
    { laboL: [], k: 'ferm', nom: 'Fermentation alcoolique', tc: 'fermentation incomplète', question: 'Fermentation incomplète ?', cause: 'Un degré probable élevé augmente les besoins des levures en azote ; un manque d’azote ralentit la fin de fermentation.', core: [['sucres_fin', 2]], sup: [['azote', 1]], ctx: [], conf: [], labo: 'Sucres', laboDit: '', chai: '', lanes: ['sucres'] }
  ],
  btl: [
    { laboL: [], k: 'prot', nom: 'Protection SO2 en bouteille', tc: 'protection SO2 juste', question: 'Protection SO2 un peu juste en bouteille', cause: 'Après la mise, le SO2 libre continue de baisser ; trop bas, il protège moins bien le vin de l’oxydation.', core: [['actif_mise', 2]], sup: [['baisse_btl', 1]], ctx: [], conf: [], labo: 'SO2 libre et total en bouteille', laboDit: '', chai: '', lanes: ['so2'] },
    { laboL: ['Acide malique'], k: 'referm', nom: 'Reprise de fermentation en bouteille', tc: 'reprise de fermentation', question: 'Risque de reprise de fermentation en bouteille ?', cause: 'Des sucres ou de l’acide malique résiduels peuvent fermenter en bouteille.', core: [['sucres_haut', 2], ['malique', 2]], sup: [], ctx: [], conf: [], labo: 'Sucres et acide malique', laboDit: '', chai: '', lanes: ['sucres', 'mal'] },
    { laboL: ['Tests de stabilité tartrique et protéique'], k: 'stab', nom: 'Dépôts et troubles', tc: 'dépôts', question: 'Risque de dépôts ?', cause: 'Sans stabilisation, des cristaux de tartre ou un trouble protéique peuvent apparaître en bouteille.', core: [['tart_ko', 2], ['prot_ko', 2]], sup: [], ctx: [], conf: [], labo: 'Tests de stabilité', laboDit: '', chai: '', lanes: [] },
    { laboL: ['Oxygène dissous'], k: 'o2', nom: 'Oxygène à la mise', tc: 'oxygène à la mise', question: 'Oxygène à la mise trop élevé ?', cause: 'L’oxygène dissous et celui de l’espace de tête consomment le SO2 libre dans les premiers mois.', core: [['o2', 2]], sup: [], ctx: [], conf: [], labo: 'Oxygène dissous', laboDit: '', chai: '', lanes: [] }
  ]
};
function capi(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function evaluer(R, I) {
  var score = 0, coreN = 0, connus = 0, preuves = [], contexte = [], manque = [], lignes = [];
  R.core.forEach(function (c) { var x = I[c[0]]; if (!x) return; lignes.push({ x: x, role: 'core' }); if (x.etat !== 'inconnu') connus++; if (x.etat === 'oui') { coreN++; score += c[1]; preuves.push(x); } else if (x.etat === 'inconnu') manque.push(x); });
  R.sup.forEach(function (c) { var x = I[c[0]]; if (!x) return; lignes.push({ x: x, role: 'sup' }); if (x.etat === 'oui') { score += c[1]; preuves.push(x); } else if (x.etat === 'inconnu') manque.push(x); });
  R.ctx.forEach(function (id) { var x = I[id]; if (!x) return; lignes.push({ x: x, role: 'ctx' }); if (coreN && x.etat === 'oui') { score += 1; contexte.push(x); } });
  var contre = [], mesures = 0;   /* DIAG-3 : une analyse de confirmation au-dessus du seuil compte comme un indice fort ; en dessous, elle interdit « Signes forts » */
  R.conf.forEach(function (id) { var x = I[id]; if (!x) return; lignes.push({ x: x, role: 'conf' }); if (x.etat === 'inconnu') { manque.push(x); return; } mesures++; if (x.etat === 'oui') { coreN++; score += 3; preuves.push(x); } else contre.push(x); });
  var st = coreN === 0 ? (connus === 0 ? 'inconnu' : 'rien') : ((coreN >= 2 && score >= 6) ? 'probable' : (score >= 3 ? 'possible' : 'surveiller'));
  if (contre.length && st === 'probable') st = 'possible';
  return { R: R, k: R.k, score: score, coreN: coreN, st: st, preuves: preuves, contexte: contexte, manque: manque, lignes: lignes, contre: contre, total: R.core.length + R.sup.length + mesures };
}
var RANG_ST = { probable: 0, possible: 1, surveiller: 2, inconnu: 3, rien: 4 };
var ST_PILL = { probable: ['dan', 'Signes forts'], possible: ['att', 'Signes modérés'], surveiller: ['n', 'Signe isolé'], inconnu: ['n', 'Non évaluable'], rien: ['ok', 'Aucun signe'] };
function diagnostic(M) {
  if (M._dg) return M._dg;
  var I = indices(M), stage = M.miseMs ? 'btl' : (!M.maloEnd ? 'malo' : 'elev');
  var ev = RISQUES[stage].map(function (R) { return evaluer(R, I); });
  var vieux = stage === 'elev' && M.so2.vieux;
  if (vieux) ev.forEach(function (e) { e.st = 'inconnu'; e.vieux = true; });
  var tri = ev.slice().sort(function (a, b) { return (RANG_ST[a.st] - RANG_ST[b.st]) || (b.score - a.score); });
  var top = tri.filter(function (e) { return e.st === 'probable' || e.st === 'possible'; }).slice(0, 2);
  var titre = '';
  if (top.length === 2 && top[0].st === top[1].st) titre = capi(top[0].R.tc) + ' ou ' + top[1].R.tc + ' ?';
  else if (top.length) titre = top[0].R.question;
  M._dg = { I: I, stage: stage, ev: ev, tri: tri, top: top, titre: titre, vieux: vieux };
  return M._dg;
}
function previsions(M) {
  var s = M.so2, av = M.av, P = [];
  if (M.miseMs) {
    if (s.apres) P.push({ g: 'n', txt: 'Le SO2 libre a perdu ' + nf(s.last.v - s.apres.v, 0) + ' mg/L en ' + Math.round((s.apres.ms - s.last.ms) / J / 30.44) + ' mois après la mise. Une nouvelle analyse en bouteille indiquera si la baisse ralentit.' });
    return P;
  }
  if (!s.vide && s.cross && !s.vieux) P.push({ g: joursA(s.cross) <= 21 ? 'att' : 'n', txt: pt('Sulfitage à prévoir vers le ' + fd(s.cross) + ' : le SO2 actif passera sous l’objectif de ' + nf(M.obj, 1) + ' mg/L') });
  if (!s.vide && !s.vieux && s.actAuj < M.obj && s.dose != null) P.push({ g: 'att', txt: 'Estimation indicative : environ ' + nf(s.dose, 0) + ' mg/L de SO2 à ajouter pour revenir à ' + nf(M.obj, 1) + ' mg/L d’actif (sur ce vin, ' + nf(s.rend * 100, 0) + ' % de l’ajout se retrouve en SO2 libre).' + (s.totApres > (M.D.coul === 'blanc' ? 200 : 150) ? ' Le SO2 total atteindrait ' + nf(s.totApres, 0) + ' mg/L, au-delà de la limite de ' + (M.D.coul === 'blanc' ? 200 : 150) + ' mg/L des vins ' + (M.D.coul === 'blanc' ? 'blancs' : 'rouges') + ' : le sulfitage seul ne suffit pas. À voir avec l’œnologue.' : '') });
  if (M.maloEnd && av.rec && !av.auSeuil) {
    var b = av.rec ? av.rec.b : 0; if (b > 0) { var j = (S.set.seuil - av.last.v) / b; if (j < 365) P.push({ g: 'att', txt: pt('À la vitesse actuelle, l’acidité volatile atteindrait le seuil d’alerte du domaine vers le ' + fd(av.last.ms + j * J, true)) }); else P.push({ g: 'ok', txt: 'À la vitesse actuelle, l’acidité volatile reste loin du seuil d’alerte du domaine.' }); }
  }
  if (M.maloEnd) {
    var dz = M.D.gestes.filter(function (g) { return g.k === 'degus' && t(g.d) <= M.ref; }).pop();
    if (!dz || (M.ref - t(dz.d)) / J > 90) P.push({ g: 'att', txt: (dz ? 'Dernière dégustation des fûts le ' + fd(t(dz.d), true) : 'Aucune dégustation des fûts enregistrée') + ' : seul le contrôle au nez, fût par fût, permet de repérer tôt un fût qui dévie.' });
  }
  if (!M.maloEnd) {
    var mp = M.serie('mal');
    if (mp.length >= 2) { var a0 = mp[mp.length - 2], a1 = mp[mp.length - 1], v = (a0.v - a1.v) / ((a1.ms - a0.ms) / J); if (v > 0) { var fin = a1.ms + (a1.v - 0.1) / v * J; P.push({ g: 'att', txt: pt('À la vitesse actuelle, la malo se terminerait vers ' + MOIS[new Date(fin).getUTCMonth()] + ' ' + new Date(fin).getUTCFullYear()) }); } else P.push({ g: 'att', txt: 'L’acide malique ne baisse pas : la malo n’a pas démarré.' }); }
  }
  return P;
}


/* ════════ DIAG-1 : liste, références du domaine, comparaison, demande ════════ */
function dgnListe() {
  var E = window.CAVE_ELEVAGE, ok = (typeof window._caveDansFiltre === 'function') ? window._caveDansFiltre : function () { return true; };
  return ((E && E.cuvees) || []).filter(function (c) { return c && c.id != null && MOD[String(c.id)] && ok(c); }).map(function (c) { return String(c.id); });
}
var USUEL_DEF = { av: 0.007, lie: 2, rouge: 2.6, blanc: 4.2 }, REFS = { n: 0 };
function dgnMed(a) { if (a.length < 3) return null; a = a.slice().sort(function (x, y) { return x - y; }); var m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
function dgnRefs() {
  var av = [], lie = [], so2 = { rouge: [], blanc: [] };
  Object.keys(MOD).forEach(function (k) {
    var M = MOD[k]; if (!M || !M.maloEnd) return;
    var dg; try { dg = diagnostic(M); } catch (err) { dgnLog(err); return; }
    if (dg.top && dg.top.length && dg.top[0].st === 'probable') return;
    if (!M.av.vide && M.av.pente != null) av.push(M.av.pente);
    var s = M.so2; if (!s.vide && !s.mise) { if (s.lie != null) lie.push(s.lie); if (s.fit) so2[M.D.coul === 'blanc' ? 'blanc' : 'rouge'].push(-s.fit.b * 30.44); }
  });
  REFS = { n: av.length, av: dgnMed(av), lie: dgnMed(lie), rouge: dgnMed(so2.rouge), blanc: dgnMed(so2.blanc) };
  USUEL_AV = REFS.av > 0 ? REFS.av : USUEL_DEF.av;
  USUEL_LIE = REFS.lie > 0 ? REFS.lie : USUEL_DEF.lie;
  USUEL_SO2.rouge = REFS.rouge > 0 ? REFS.rouge : USUEL_DEF.rouge;
  USUEL_SO2.blanc = REFS.blanc > 0 ? REFS.blanc : USUEL_DEF.blanc;
}
function dgnInit(nom) {
  var w = String(nom).split(/[\s'’-]+/).filter(function (x) { return x && !/^(de|du|des|la|le|les|et|d|l|en)$/i.test(x); });
  return w.slice(0, 3).map(function (x) { return x.charAt(0).toUpperCase(); }).join('') || '?';
}
function dgnCmp() {
  var out = [];
  Object.keys(MOD).forEach(function (k) {
    var M = MOD[k], D = M.D; if (!M.maloEnd) return;
    var r = { k: k, nom: D.nom, mil: D.mil, coul: D.coul, c: dgnInit(D.nom), enCours: !M.miseMs, neuf: Math.round(M.part * 100), age: M.age, tonn: null, dom: null, av: null, so2: null, anges: D.anges, alerte: false };
    var parT = {}; D.futs.forEach(function (f) { parT[f.t] = (parT[f.t] || 0) + f.nb; });
    Object.keys(parT).forEach(function (n) { var p = M.nbF ? parT[n] / M.nbF : 0; if (p >= 0.7 && n !== 'Tonnelier non renseigné') { r.tonn = n; r.dom = Math.round(p * 100); } });
    var avp = M.serie('av').filter(function (p) { return p.ms >= M.maloEnd && p.ms <= M.ref; });
    if (avp.length >= 2) { var ans = (avp[avp.length - 1].ms - avp[0].ms) / J / 365; if (ans >= 0.25) r.av = Math.max(0, (avp[avp.length - 1].v - avp[0].v) / ans); }
    var sp = M.serie('so2l').filter(function (p) { return !p.a.bouteille; }), bornes = M.adds.map(function (a) { return a.ms; }), segs = [], cur = [];
    sp.forEach(function (p) { if (cur.length && bornes.some(function (b) { return b > cur[cur.length - 1].ms && b <= p.ms; })) { segs.push(cur); cur = []; } cur.push(p); });
    if (cur.length) segs.push(cur);
    var pentes = []; segs.forEach(function (sg2) { var f = ls(sg2); if (f && f.b < 0) pentes.push(-f.b * 30.44); });
    if (pentes.length) { pentes.sort(function (a, b) { return a - b; }); r.so2 = pentes[Math.floor(pentes.length / 2)]; }
    try { var dg = diagnostic(M); r.alerte = !!(dg.top && dg.top.length && dg.top[0].st === 'probable'); } catch (err) { dgnLog(err); }
    if (r.av != null || r.so2 != null || r.anges != null) out.push(r);
  });
  return out;
}
function dgnEchelles(all, m, a, C) {
  var vals = all.map(function (r) { return C.mes === 'av' ? avU(r.av) : r[C.mes]; }).filter(function (v) { return v != null && isFinite(v); });
  var mx = vals.length ? Math.max.apply(null, vals) : 0, pasY = C.mes === 'av' ? 0.05 : (C.mes === 'so2' ? 1 : 0.5);
  var top = Math.max(pasY * 2, Math.ceil(mx * 1.15 / pasY) * pasY), step = pasY * Math.max(1, Math.ceil(Math.round(top / pasY) / 6));
  m.max = top; m.ticks = []; for (var v = 0; v <= top + 1e-9; v += step) m.ticks.push(Math.round(v * 1000) / 1000);
  if (a.num) { var xs = all.map(function (r) { return r[C.axe]; }).filter(function (v) { return v != null && isFinite(v); }); var xm = xs.length ? Math.max.apply(null, xs) : 0; a.min = 0; a.max = Math.max(a.pas * 2, Math.ceil(xm / a.pas) * a.pas); }
  else { var u = {}; all.forEach(function (r) { var c = C.axe === 'tonn' ? r.tonn : r.mil; if (c != null && c !== '') u[c] = 1; }); a.cats = Object.keys(u).sort(); }
}
function dgnDemande(M, dg) {
  var foc = S.focus && !S.fenCuv ? dg.ev.filter(function (e) { return e.k === S.focus; }) : dg.top;
  var anas = ['Acidité volatile', 'SO2 libre et total', 'pH', 'Glucose et fructose'];
  foc.forEach(function (e) { (e.R.laboL || []).forEach(function (a) { if (anas.indexOf(a) < 0) anas.push(a); }); });
  if (dg.stage === 'malo' && anas.indexOf('Acide malique') < 0) anas.push('Acide malique');
  return { foc: foc, anas: anas, brett: foc.some(function (e) { return e.k === 'brett'; }), nz: dg.I.nez_ani && (dg.I.nez_ani.g || (dg.I.nez_vol && dg.I.nez_vol.g)) };
}
function dgnEnvoyer() {
  var M = MOD[S.fenCuv || S.cuv]; if (!M) return;
  var D = M.D, dg = diagnostic(M), X = dgnDemande(M, dg);
  var txt = ['Demande d’analyse : ' + D.nom + ' ' + D.mil, '',
    'Échantillon : moyen de la cuvée' + (S.op.futSuspect && X.nz && X.nz.fut ? ' ; un second échantillon du ' + X.nz.fut + ' seul' : '') + '.',
    'Analyses : ' + X.anas.join(', ') + (X.brett && S.op.tppv ? ', potentiel en phénols volatils' : '') + '.',
    'Motif : ' + (dg.titre || (dg.vieux ? 'dernière analyse trop ancienne' : 'contrôle')) + '.'].join('\n');
  if (navigator.share) { navigator.share({ title: 'Demande d’analyse', text: txt }).catch(function (err) { dgnLog(err); }); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('Demande copiée : collez-la dans votre message au labo'); }, function () { toast('Copie impossible sur cet appareil'); });
  else toast('Copie impossible sur cet appareil');
}
/* La police auto-hébergée n'a pas « 2 » : l'indice se pose à l'affichage, dans le texte seulement. */
function dgnTypo(h) {
  var dansTexte = false;
  return String(h).replace(/(<[^>]*>)|([^<]+)/g, function (m, tag, txt) {
    if (tag) { if (/^<text[\s>]/.test(tag)) dansTexte = true; else if (/^<\/text>/.test(tag)) dansTexte = false; return tag; }
    if (dansTexte) return txt.replace(/\bH2SO4\b/g, 'H<tspan baseline-shift="sub" font-size="75%">2</tspan>SO<tspan baseline-shift="sub" font-size="75%">4</tspan>').replace(/\b(SO|CO)2\b/g, '$1<tspan baseline-shift="sub" font-size="75%">2</tspan>');
    if (!/\b(H2SO4|SO2|CO2)\b/.test(txt)) return txt;
    return '<span>' + txt.replace(/\bH2SO4\b/g, 'H<sub>2</sub>SO<sub>4</sub>').replace(/\b(SO|CO)2\b/g, '$1<sub>2</sub>') + '</span>';   /* un seul morceau : un parent en flex ne glisse pas d’espace avant l’indice */
  });
}

var S = {
  vue: 'suivi', cuv: null, tuile: null, sel: null, tab: null, per: 'tout', offs: {}, proj: true, focus: null,
  filtre: 'toutes', q: '', detail: false, tiroir: null, fen: null,
  set: { unite: 'h2so4', objR: 0.5, objB: 0.8, seuil: 0.60 }, selIdx: null, fenCuv: null,
  cmp: { mes: 'av', axe: 'neuf', coul: 'rouge', ecart: true },
  op: { futSuspect: true, tppv: false }
};
function offDe(k) {
  if (!S.offs[k]) { var M = MOD[k], st = M.miseMs ? 'btl' : (!M.maloEnd ? 'malo' : 'elev'); S.offs[k] = st === 'elev' ? { mal: true, ph: true, at: true } : (st === 'malo' ? { so2: true, lie: true, ph: true, at: true } : { mal: true, lie: true, ph: true, at: true }); }
  return S.offs[k];
}
var MOD = {}, CUV = {}, CMP = [];
function dgnLog(err) { if (typeof window.logError === 'function') window.logError({ level: 'info', cat: 'diag', msg: String(err && err.message || err) }); }
function recalc() {
  AUJ = dgnAujMs(); S.set = dgnReglages();
  CUV = dgnDonnees(); MOD = {};
  Object.keys(CUV).forEach(function (k) { try { MOD[k] = analyser(CUV[k]); } catch (err) { dgnLog(err); } });
  dgnRefs();
  Object.keys(MOD).forEach(function (k) { try { MOD[k] = analyser(CUV[k]); } catch (err) { dgnLog(err); delete MOD[k]; } });
  CMP = dgnCmp();
}
var SRC_PILL = { 'Labo': 'labo', 'Labo, calculé': 'labo', 'Labo, nouveau': 'nouveau', 'Dégustation': 'nez', 'Fûts': 'futs', 'Cuvées': 'cuvees', 'Calendrier': 'cal', 'Chai': 'nouveau', 'Mise': 'labo', 'Calcul': 'labo', 'Opérations': 'cuvees', 'Nouveau champ': 'nouveau' };

var IC = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  pilotage: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.4"/>',
  vigne: '<path d="M12 21c4.4 0 7-3.3 7-7.6C19 8.6 15 5 12 3 9 5 5 8.6 5 13.4 5 17.7 7.6 21 12 21Z"/><path d="M12 21V9"/>',
  phyto: '<path d="M12 3.5s-6 6.3-6 10.3a6 6 0 0 0 12 0C18 9.8 12 3.5 12 3.5Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  tracteur: '<circle cx="7.5" cy="16" r="3.5"/><circle cx="17.5" cy="17" r="2.5"/><path d="M7.5 12.5V6.5h5.5l2 6"/><path d="M15 12.5h4.5V17"/><path d="M11 16h4"/>',
  cave: '<path d="M7 4h10c1.7 4.6 1.7 11.4 0 16H7C5.3 15.4 5.3 8.6 7 4Z"/><path d="M5.9 9h12.2M5.9 15h12.2"/>',
  reserve: '<path d="M4 8l8-4 8 4v8l-8 4-8-4Z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  planning: '<rect x="4.5" y="5.5" width="15" height="14" rx="2"/><path d="M4.5 10h15M9 3.5v4M15 3.5v4"/>',
  reglages: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lune: '<path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10Z"/>',
  soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  chevd: '<path d="M9.5 6l6 6-6 6"/>', chevg: '<path d="M14.5 6l-6 6 6 6"/>',
  fermer: '<path d="M6 6l12 12M18 6L6 18"/>',
  alerte: '<path d="M12 4.5l8.5 15h-17Z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  ok: '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.4l2.5 2.5 5-5.2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.4"/>',
  fiole: '<path d="M9.5 3.5h5M10.5 3.5v5.5l-5 8.8a1.5 1.5 0 0 0 1.3 2.2h10.4a1.5 1.5 0 0 0 1.3-2.2l-5-8.8V3.5"/><path d="M7.6 14.5h8.8"/>',
  menu: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  logo: '<circle cx="12" cy="8.2" r="2.3"/><circle cx="8.6" cy="11.4" r="2.3"/><circle cx="15.4" cy="11.4" r="2.3"/><circle cx="12" cy="14.6" r="2.3"/><circle cx="9.3" cy="17.8" r="2"/><circle cx="14.7" cy="17.8" r="2"/><path d="M12 5.9V3.6l2.4-1.1"/>'
};
function ico(n, cls) { return '<svg class="dgn-ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; }
var GI = {
  so2: 'M8 2.5C8 2.5 3.8 7.4 3.8 10.2a4.2 4.2 0 0 0 8.4 0C12.2 7.4 8 2.5 8 2.5Z',
  levure: 'M3.4 6.2a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0ZM8.3 10.4a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0-4.6 0ZM3.8 11.6a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0Z',
  nutri: 'M2.8 8a5.2 5.2 0 1 0 10.4 0a5.2 5.2 0 1 0-10.4 0ZM8 5.6v4.8M5.6 8h4.8',
  chapt: 'M3.6 5.6 8 3.4l4.4 2.2v4.8L8 12.6l-4.4-2.2ZM3.6 5.6 8 7.8l4.4-2.2M8 7.8v4.8',
  bact: 'M3.4 6.2h4.2a1.6 1.6 0 0 1 0 3.2H3.4a1.6 1.6 0 0 1 0-3.2ZM9.2 3.4h3.4a1.4 1.4 0 0 1 0 2.8H9.2a1.4 1.4 0 0 1 0-2.8ZM9.6 10.4h2.8a1.4 1.4 0 0 1 0 2.8H9.6a1.4 1.4 0 0 1 0-2.8Z',
  decuv: 'M3 4.5h10M8 4.5v5M5.4 7.4 8 10l2.6-2.6M3.5 12.5h9',
  enton: 'M4.6 2.8h6.8c1.4 3.4 1.4 7 0 10.4H4.6c-1.4-3.4-1.4-7 0-10.4ZM3.6 6.2h8.8M3.6 9.8h8.8',
  sout: 'M2.8 5h10.4M8 5v7M5.2 9.4 8 12.2l2.8-2.8',
  degus: 'M5 2.5h6l-.9 4.6a2.1 2.1 0 0 1-4.2 0ZM8 9.3v3.6M5.6 13.3h4.8',
  lot: 'M6.4 2.5h3.2M7.1 2.5v3.6l-3.3 6.3a1 1 0 0 0 .9 1.5h6.6a1 1 0 0 0 .9-1.5L8.9 6.1V2.5M5.2 10h5.6',
  mise: 'M7 1.8h2v2.6c1.8.9 2.4 2.3 2.4 3.8v6H4.6v-6c0-1.5.6-2.9 2.4-3.8Z'
};
function gico(k) { return '<svg class="dgn-ico dgn-ico-s" viewBox="0 0 16 16" aria-hidden="true"><path d="' + (GI[k] || GI.lot) + '"/></svg>'; }
var LBL = { so2: 'Sulfitage', levure: 'Levurage', nutri: 'Nutriment', chapt: 'Chaptalisation', bact: 'Ensemencement', decuv: 'Décuvage', enton: 'Entonnage', sout: 'Soutirage', degus: 'Dégustation', lot: 'Analyse d’un lot', mise: 'Mise en bouteille' };
var RANG = { dan: 0, att: 1, ok: 2, n: 3 };

function $(id) { return document.getElementById(id); }
function toast(msg) { if (typeof window.showToast === 'function') window.showToast(msg); }
function pill(p) { var cl = 'mvpas mvpas-statut mvpas-' + ({ dan: 'retard', att: 'surveiller', ok: 'fait', n: 'afaire' }[p[0]] || 'afaire'); return '<span class="' + cl + '">' + esc(p[1]) + '</span>'; }
function seg(liste, act, cur, cls, label) {
  return '<div class="dgn-seg ' + (cls || '') + '" role="group" aria-label="' + esc(label) + '">' + liste.map(function (o) {
    return '<button type="button" data-dgn="' + act + '" data-v="' + esc(o[0]) + '" aria-pressed="' + (String(cur) === String(o[0])) + '"' + (o[2] ? ' disabled' : '') + '>' + o[1] + '</button>';
  }).join('') + '</div>';
}

/* ════════ Rendu général ════════ */
function typo(h) {
  return dgnTypo(h).replace(/(\d) (g\/L|mg\/L|µg\/L|cL|°C|jours?|j\b|mois|fûts?|vins?|% vol)/g, '$1\u00a0$2').replace(/(\d) %/g, '$1\u202f%').replace(/ ([:;?!])(?=[\s<’])/g, '\u00a0$1');
}
function dgnMonter() {
  var root = $(DGN_ROOT); if (!root) return false;
  if (!$('dgn-vues')) {
    root.innerHTML = '<div class="dgn-app"><div class="dgn-vue-barre"><div id="dgn-vues"></div><p class="dgn-lecture-g">' + ico('info') + '<span>Lecture seule : le diagnostic croise les données de Cuvées, Bouteilles et Labo. Les rapports d’analyse se saisissent dans l’onglet Labo.</span></p><div class="dgn-vb-act"><button type="button" class="mvbtn mvbtn-discret mvbtn-bureau" data-dgn="aide" aria-label="Méthode du diagnostic">' + ico('info') + '<span>Méthode</span></button><button type="button" class="mvbtn mvbtn-discret mvbtn-bureau" data-dgn="reg" aria-label="Réglages du diagnostic">' + ico('reglages') + '<span>Réglages</span></button></div></div><div id="dgn-vue" class="dgn-vue"></div></div>';
    if (!root._dgn) { root._dgn = true; root.addEventListener('click', dgnClic); root.addEventListener('input', dgnSaisie); }
  }
  if (!$('dgn-voile')) {
    var o = document.createElement('div'); o.className = 'dgn-app dgn-ov';
    o.innerHTML = '<div class="dgn-voile" id="dgn-voile"></div><aside class="dgn-tiroir" id="dgn-tiroir" aria-label="Panneau latéral" aria-hidden="true"></aside><div class="dgn-fen" id="dgn-fen" role="dialog" aria-modal="true" aria-hidden="true"></div>';
    document.body.appendChild(o);
    o.addEventListener('click', function (e) { if (e.target && e.target.id === 'dgn-voile') { S.tiroir = null; S.fen = null; render(); return; } dgnClic(e); });
  }
  return true;
}
function render() {
  var root = $(DGN_ROOT); if (!root) return;
  if (!window._dataReady) { root.innerHTML = (typeof window._mvSk === 'function') ? window._mvSk('chai') : ''; return; }
  if (!dgnMonter()) return;
  try {
    recalc();
    var nb = 0; dgnListe().forEach(function (k) { nb += echeances2(MOD[k]).filter(function (e) { return e.quand === 'now'; }).length; });
    $('dgn-vues').innerHTML = seg([['suivi', 'Par cuvée'], ['echeances', 'Échéancier <span class="dgn-cpt">' + nb + '</span>'], ['comparer', 'Comparaison']], 'vue', S.vue, '', 'Vue');
    var h = '';
    if (!dgnListe().length && S.vue === 'suivi') h = '<p class="dgn-vide">Aucune cuvée à diagnostiquer pour ce millésime. Le diagnostic lit les cuvées du Chai, leurs analyses et leurs opérations.</p>';
    else if (S.vue === 'suivi') h = vueSuivi();
    else if (S.vue === 'echeances') h = vueEcheances();
    else h = vueComparer();
    $('dgn-vue').innerHTML = typo(h);
  } catch (err) { dgnLog(err); $('dgn-vue').innerHTML = '<p class="dgn-diag-note">Le diagnostic n’a pas pu se calculer sur ces données. L’erreur a été transmise ; les autres onglets du Chai ne sont pas touchés.</p>'; }
  renderTiroir(); renderFen();
  requestAnimationFrame(function () { renderFrise(); renderCmpGraph(); });
}

/* ════════ Suivi : liste ════════ */
function statutListe(M) {
  var dg = diagnostic(M), s = M.so2;
  if (dg.top.length) {
    var g = dg.top[0].st === 'probable' ? 'dan' : 'att';
    var txt = dg.top.length === 2 && dg.top[0].st === dg.top[1].st ? capi(dg.top[0].R.tc) + ' ou ' + dg.top[1].R.tc + ' ?' : capi(dg.top[0].R.tc) + (M.miseMs ? '' : ' ?');
    return { g: g, txt: txt, cls: g };
  }
  if (dg.vieux) return { g: 'att', txt: 'Analyse trop ancienne', cls: 'att' };
  if (M.miseMs) return { g: 'n', txt: 'Vin fini', cls: '' };
  if (!s.vide && s.cross && joursA(s.cross) <= 21) return { g: 'att', txt: 'Sulfitage dans ' + joursA(s.cross) + ' j', cls: 'att' };
  return { g: 'ok', txt: 'Aucune anomalie', sous: (!s.vide && s.cross) ? 'Sulfitage dans ' + joursA(s.cross) + ' j' : '', cls: '' };
}
function vueSuivi() {
  var keys = dgnListe();
  if (!S.cuv || keys.indexOf(S.cuv) < 0) S.cuv = keys.slice().sort(function (a, b) { return RANG[statutListe(MOD[a]).g] - RANG[statutListe(MOD[b]).g]; })[0];
  return '<div class="dgn-md' + (S.detail ? ' dgn-detail' : '') + '"><section class="dgn-liste" aria-label="Cuvées">' + listeHtml() + '</section><section class="dgn-fiche" aria-label="Diagnostic de la cuvée">' + ficheHtml() + '</section></div>';
}
function listeHtml() {
  var items = dgnListe().map(function (k) { return { k: k, M: MOD[k], G: statutListe(MOD[k]) }; });
  var q = S.q.trim().toLowerCase();
  items = items.filter(function (it) {
    var D = it.M.D;
    if (S.filtre === 'traiter' && !(it.G.g === 'dan' || it.G.g === 'att')) return false;
    if (S.filtre === 'rouge' && D.coul !== 'rouge') return false;
    if (S.filtre === 'blanc' && D.coul !== 'blanc') return false;
    if (q && (D.nom + ' ' + D.mil).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function (a, b) { return (RANG[a.G.g] - RANG[b.G.g]) || a.M.D.nom.localeCompare(b.M.D.nom) || b.M.D.mil - a.M.D.mil; });
  var cours = items.filter(function (i) { return !i.M.miseMs; }), btl = items.filter(function (i) { return i.M.miseMs; });
  var h = '<div class="dgn-liste-tete"><label class="dgn-champ">' + ico('search', 'ico-s') + '<span class="dgn-sr">Chercher une cuvée</span><input type="search" id="dgn-q" placeholder="Chercher une cuvée" value="' + esc(S.q) + '"></label>';
  h += '<div class="dgn-filtres" role="group" aria-label="Filtrer">' + [['toutes', 'Toutes'], ['traiter', 'À traiter'], ['rouge', 'Rouges'], ['blanc', 'Blancs']].map(function (f) { return '<button type="button" data-dgn="filtre" data-v="' + f[0] + '" aria-pressed="' + (S.filtre === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div></div>';
  function ligne(it) {
    var D = it.M.D, col = it.G.cls ? ({ att: 'var(--attention-texte)', dan: 'var(--danger-texte)', ok: 'var(--ok-texte)' }[it.G.cls] || 'var(--texte-doux)') : 'var(--texte-doux)';
    return '<button type="button" class="dgn-ligne" data-dgn="cuv" data-v="' + it.k + '" aria-current="' + (S.cuv === it.k) + '"><span class="dgn-puce dgn-puce-' + it.G.g + '"></span><span style="min-width:0"><span class="dgn-ligne-nom">' + esc(D.nom) + ' ' + D.mil + '</span><span class="dgn-ligne-sous">' + esc(etape(it.M)) + '</span></span><span class="dgn-ligne-etat" style="color:' + col + '">' + esc(it.G.txt) + (it.G.sous ? '<small>' + esc(it.G.sous) + '</small>' : '') + '</span></button>';
  }
  if (cours.length) h += '<div class="dgn-groupe">En cours, ' + cours.length + '</div>' + cours.map(ligne).join('');
  if (btl.length) h += '<div class="dgn-groupe">Mises en bouteille, ' + btl.length + '</div>' + btl.map(ligne).join('');
  if (!items.length) h += '<p class="dgn-vide">Aucune cuvée ne correspond.</p>';
  return h;
}

/* ════════ Suivi : fiche ════════ */
function choisis(M) {
  if (S.selIdx) return S.selIdx;
  var D = M.D, g0 = D.gestes[M.defSel], m0 = g0 ? t(g0.d) : null;
  return D.gestes.map(function (g, i) { return i; }).filter(function (i) { return m0 != null && Math.abs(t(D.gestes[i].d) - m0) <= 10 * J; });
}
function etatIco(etat) {
  if (etat === 'oui') return '<span class="dgn-et dgn-et-oui" title="Vu">' + '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4 6.6 11.3 12.5 4.9"/></svg></span>';
  if (etat === 'non') return '<span class="dgn-et dgn-et-non" title="Pas vu"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 8h7"/></svg></span>';
  return '<span class="dgn-et dgn-et-inc" title="Pas mesuré">?</span>';
}
function srcTag(src) { return '<span class="dgn-src dgn-src-' + (SRC_PILL[src] || 'dgn-labo') + '">' + esc(src) + '</span>'; }
function vieuxLot(M) { return M.D.futs.slice().sort(function (a, b) { return b.vins - a.vins; })[0]; }
function diagHtml(M) {
  var dg = diagnostic(M), D = M.D, P = previsions(M);
  var foc = S.focus ? dg.ev.filter(function (e) { return e.k === S.focus; })[0] : null;
  if (foc) return focusHtml(M, dg, foc, P);
  var h = '';
  if (dg.vieux) {
    h += '<section class="dgn-diag dgn-diag-att" aria-label="Diagnostic"><div class="dgn-diag-t"><span class="dgn-diag-i">' + ico('info') + '</span><div class="dgn-diag-tt"><h2>Diagnostic impossible : analyse trop ancienne</h2><p>Dernière analyse il y a ' + M.so2.ageJ + ' jours : les deux derniers mois ne sont pas couverts. Une analyse récente (SO2 libre et total, pH, acidité volatile, sucres) relancera le diagnostic.</p></div>' + pill(['n', 'Non évaluable']) + '</div>';
    h += '<div class="dgn-diag-act"><button type="button" class="mvbtn mvbtn-principal mvbtn-bureau" data-dgn="labo">' + ico('fiole', 'ico-s') + 'Demander une analyse</button></div>';
    if (P.length) h += '<ul class="dgn-vient">' + P.map(function (p) { return '<li class="dgn-v-' + p.g + '">' + esc(p.txt) + '</li>'; }).join('') + '</ul>';
    return h + '</section>';
  }
  if (!dg.top.length) {
    var nb = 0; Object.keys(dg.I).forEach(function (k) { if (dg.I[k].etat !== 'inconnu') nb++; });
    var COURT = { fleur: 'la fleur', ep: 'les éthylphénols', acet: 'l’acétate d’éthyle', ethanal: 'l’éthanal', temp: 'la température du chai', o2: 'l’oxygène dissous à la mise' };
    var pasMes = dg.ev.reduce(function (a, e) { e.manque.forEach(function (x) { if (COURT[x.id] && a.indexOf(COURT[x.id]) < 0) a.push(COURT[x.id]); }); return a; }, []);
    h += '<section class="dgn-diag dgn-diag-ok" aria-label="Diagnostic"><div class="dgn-diag-t"><span class="dgn-diag-i">' + ico('ok') + '</span><div class="dgn-diag-tt"><h2>Aucune anomalie détectée</h2><p>' + nb + ' indices croisés (laboratoire, opérations, fûts, dégustations) : aucun ne s’écarte des références du domaine.</p></div>' + pill(['ok', 'Aucun signe']) + '</div>';
    if (P.length) h += '<div class="dgn-diag-bloc"><h3>Prochaines échéances</h3><ul class="dgn-vient">' + P.map(function (p) { return '<li class="dgn-v-' + p.g + '">' + esc(p.txt) + '</li>'; }).join('') + '</ul></div>';
    if (pasMes.length) h += '<p class="dgn-diag-note">' + esc(cap(pasMes.slice(0, -1).join(', ') + (pasMes.length > 1 ? ' et ' : '') + pasMes[pasMes.length - 1])) + ' : non suivis à ce jour. Ces mesures permettraient une détection plus précoce.</p>';
    return h + '</section>';
  }
  var top = dg.top, g = top[0].st === 'probable' ? 'dan' : 'att';
  var vus = [], ids = {};
  top.forEach(function (e) {
    e.preuves.forEach(function (x) {
      if (!ids[x.id]) { ids[x.id] = { x: x, pour: [], fort: false }; vus.push(ids[x.id]); }
      ids[x.id].pour.push(e.R.tc);
      if (e.R.core.some(function (c) { return c[0] === x.id; }) || (e.R.conf || []).indexOf(x.id) >= 0) ids[x.id].fort = true;   /* DIAG-3 : une analyse de confirmation au-dessus du seuil est un indice principal */
    });
  });
  vus.sort(function (a, b) { return (b.fort - a.fort) || (b.pour.length - a.pour.length); });
  var terrain = []; top.forEach(function (e) { e.contexte.forEach(function (x) { if (terrain.indexOf(x) < 0) terrain.push(x); }); });
  h += '<section class="dgn-diag dgn-diag-' + g + '" aria-label="Diagnostic"><div class="dgn-diag-t"><span class="dgn-diag-i">' + ico('alerte') + '</span><div class="dgn-diag-tt"><h2>' + esc(dg.titre) + '</h2><p>' + (top.length === 2 && top[0].st === top[1].st ? 'Ces indices, pris ensemble, orientent vers l’une ou l’autre de ces causes. Isolément, aucun n’est concluant.' : 'Ces indices, pris ensemble, orientent vers cette cause.' + (top.length === 2 ? ' Autre cause possible : ' + top[1].R.nom.charAt(0).toLowerCase() + top[1].R.nom.slice(1) + '.' : '')) + '</p></div>' + pill(ST_PILL[top[0].st]) + '</div>';
  function li(v) { return '<li>' + etatIco('oui') + '<div class="dgn-p-t"><b>' + esc(v.x.label) + '</b><span>' + esc(v.x.val) + '</span><div class="dgn-p-m">' + srcTag(v.x.src) + (top.length > 1 ? '<span class="dgn-pour">' + esc(capi(v.pour.join(', ').toLowerCase())) + '</span>' : '') + '</div></div></li>'; }
  var vF = vus.filter(function (v) { return v.fort; }), vS = vus.filter(function (v) { return !v.fort; });
  h += '<div class="dgn-diag-g"><div class="dgn-diag-bloc"><h3>Indices relevés</h3>' + (vF.length ? '<h4>Principaux</h4><ul class="dgn-preuves">' + vF.map(li).join('') + '</ul>' : '') + (vS.length ? '<h4>Secondaires</h4><ul class="dgn-preuves">' + vS.map(li).join('') + '</ul>' : '');
  var pasSuivi = []; top.forEach(function (e) { e.lignes.forEach(function (l) { if (l.role !== 'conf' && l.x.etat === 'inconnu' && pasSuivi.indexOf(l.x) < 0) pasSuivi.push(l.x); }); });
  var contre = []; top.forEach(function (e) { (e.contre || []).forEach(function (x) { if (contre.indexOf(x) < 0) contre.push(x); }); });
  if (contre.length) h += '<div class="dgn-terrain"><span>Analyse contraire</span>' + contre.map(function (x) { return '<span class="mvpas mvpas-etiquette">' + esc(x.label + ' : ' + x.val) + '</span>'; }).join('') + '</div>';
  if (terrain.length) h += '<div class="dgn-terrain"><span>Conditions favorables</span>' + terrain.map(function (x) { return '<span class="mvpas mvpas-etiquette">' + esc(x.val) + '</span>'; }).join('') + '</div>';
  if (pasSuivi.length) h += '<div class="dgn-terrain"><span>Non suivi à ce jour</span>' + pasSuivi.map(function (x) { return '<span class="mvpas mvpas-etiquette dgn-nonsuivi">' + esc(x.label) + '</span>'; }).join('') + '</div>';
  h += '</div><div class="dgn-diag-bloc"><h3>Pour confirmer</h3>';
  var lab = top.filter(function (e) { return e.R.laboDit; });
  h += '<div class="dgn-opt"><b>Au laboratoire</b><ul>' + (lab.length ? lab.map(function (e) { var dm = e.R.conf && e.R.conf[0] ? dg.I[e.R.conf[0]] : null; return '<li><b>' + esc(e.R.labo) + '</b> : ' + esc(e.R.laboDit) + '.' + (dm && dm.etat !== 'inconnu' ? ' Déjà mesuré : ' + esc(dm.val) + '.' : '') + '</li>'; }).join('') : top.map(function (e) { return '<li>' + esc(e.R.labo) + '.</li>'; }).join('')) + '</ul><button type="button" class="mvbtn mvbtn-principal mvbtn-bureau" data-dgn="labo">' + ico('fiole', 'ico-s') + 'Demander une analyse</button></div>';
  var chai = top.filter(function (e) { return e.R.chai; });
  if (chai.length && dg.stage === 'elev') {
    var vl = vieuxLot(M), nz = dg.I.nez_ani.g || dg.I.nez_vol.g;
    h += '<div class="dgn-opt"><b>Au chai</b><p>Contrôler les ' + M.nbF + ' fûts au nez, un par un' + (nz && nz.fut ? ', en commençant par le ' + nz.fut + ', puis les plus âgés' : (vl ? ', en commençant par les plus âgés (' + vl.t + ', ' + vl.an + ')' : '')) + '. ' + cap(chai.map(function (e) { return e.R.chai + ' : ' + e.R.tc; }).join(' ; ')) + '. Vérifier aussi la présence de fleur et le niveau.</p><button type="button" class="mvbtn mvbtn-secondaire mvbtn-bureau" data-dgn="tab" data-v="futs">Voir l’ordre de contrôle</button></div>';
  } else if (chai.length && dg.stage === 'malo') {
    h += '<div class="dgn-opt"><b>Au chai</b><p>Relever la température du chai : en dessous de 16 °C, la malo ralentit. Elle se note à la dégustation (Nouvelle opération).</p></div>';
  }
  h += '</div></div>';
  /* comparaison des hypothèses */
  var lignes = [], vu2 = {};
  top.forEach(function (e) { e.lignes.forEach(function (l) { if (!vu2[l.x.id]) { vu2[l.x.id] = 1; lignes.push(l.x); } }); });
  h += '<details class="dgn-hyp"><summary>Comparer les hypothèses, indice par indice</summary><div class="dgn-defile"><table class="dgn-tab"><thead><tr><th>Indice</th>' + top.map(function (e) { return '<th>' + esc(e.R.nom) + '</th>'; }).join('') + '</tr></thead><tbody>' + lignes.map(function (x) {
    return '<tr><td><b>' + esc(x.label) + '</b><div class="dgn-sous">' + esc(x.val) + '</div></td>' + top.map(function (e) { var l = e.lignes.filter(function (y) { return y.x.id === x.id; })[0]; return '<td>' + (l ? etatIco(x.etat) + '<span class="dgn-role">' + ({ core: 'principal', sup: 'secondaire', ctx: 'condition', conf: 'confirmation' }[l.role]) + '</span>' : '<span class="dgn-na">—</span>') + '</td>'; }).join('') + '</tr>';
  }).join('') + '</tbody></table></div>' + '<p class="dgn-legende-et">' + etatIco('oui') + '<span>relevé</span>' + etatIco('non') + '<span>non relevé</span>' + etatIco('inconnu') + '<span>non mesuré</span></p>' + '</details>';
  if (P.length) h += '<div class="dgn-diag-bloc dgn-diag-sep"><h3>Points d’attention</h3><ul class="dgn-vient">' + P.map(function (p) { return '<li class="dgn-v-' + p.g + '">' + esc(p.txt) + '</li>'; }).join('') + '</ul></div>';
  h += '<p class="dgn-avert">Diagnostic indicatif, établi à partir des données saisies. Il oriente les contrôles ; il ne remplace ni l’analyse de confirmation ni l’avis de l’œnologue.</p>';
  return h + '</section>';
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function focusHtml(M, dg, e, P) {
  var g = ST_PILL[e.st][0], R = e.R;
  var grp = [['core', 'Indices principaux'], ['sup', 'Indices secondaires'], ['ctx', 'Conditions favorables'], ['conf', 'Analyse de confirmation']];
  var h = '<section class="dgn-diag dgn-diag-' + (g === 'dgn-ok' ? 'dgn-ok' : (g === 'dgn-n' ? 'dgn-n' : g)) + '" aria-label="' + esc(R.nom) + '"><div class="dgn-diag-t"><span class="dgn-diag-i">' + ico(e.st === 'rien' ? 'ok' : (e.st === 'inconnu' ? 'info' : 'alerte')) + '</span><div class="dgn-diag-tt"><h2>' + esc(R.nom) + '</h2><p>' + esc(R.cause) + '</p></div>' + pill(ST_PILL[e.st]) + '</div>';
  h += '<div class="dgn-diag-g">' + grp.map(function (gr) {
    var ls = e.lignes.filter(function (l) { return l.role === gr[0]; }); if (!ls.length) return '';
    return '<div class="dgn-diag-bloc"><h3>' + gr[1] + '</h3><ul class="dgn-preuves">' + ls.map(function (l) { return '<li class="' + (l.x.etat === 'dgn-oui' ? '' : 'dgn-pale') + '">' + etatIco(l.x.etat) + '<div class="dgn-p-t"><b>' + esc(l.x.label) + '</b><span>' + esc(l.x.val) + '</span><div class="dgn-p-m">' + srcTag(l.x.src) + '</div></div></li>'; }).join('') + '</ul></div>';
  }).join('') + '</div>';
  h += '<p class="dgn-legende-et">' + etatIco('oui') + '<span>relevé</span>' + etatIco('non') + '<span>non relevé</span>' + etatIco('inconnu') + '<span>non mesuré</span></p>';
  if (e.vieux) h += '<p class="dgn-diag-note">Analyse trop ancienne pour juger.</p>';
  h += '<div class="dgn-diag-act">' + ((e.st === 'probable' || e.st === 'possible') ? '<button type="button" class="mvbtn mvbtn-principal mvbtn-bureau" data-dgn="labo">' + ico('fiole', 'ico-s') + 'Demander une analyse</button>' : '') + '<button type="button" class="mvbtn mvbtn-secondaire mvbtn-bureau" data-dgn="focus" data-v="">Retour au diagnostic</button></div>';
  return h + '</section>';
}
function risquesHtml(M) {
  var dg = diagnostic(M);
  return '<div class="dgn-grille" role="group" aria-label="Grille des risques">' + dg.ev.map(function (e) {
    var p = ST_PILL[e.st], on = S.focus === e.k, base;
    if (e.st === 'inconnu') base = e.vieux ? 'Analyse trop ancienne pour évaluer' : 'Données insuffisantes';
    else if (e.st === 'rien') base = 'Aucun indice principal relevé';
    else base = e.preuves.length + ' indice' + (e.preuves.length > 1 ? 's' : '') + ' sur ' + e.total + ' : ' + e.preuves.slice(0, 2).map(function (x) { return /^[A-Z][A-Z0-92]/.test(x.label) ? x.label : x.label.charAt(0).toLowerCase() + x.label.slice(1); }).join(', ') + (e.preuves.length > 2 ? '…' : '');
    return '<button type="button" class="dgn-g-ligne" data-dgn="focus" data-v="' + e.k + '" aria-pressed="' + on + '"><span class="dgn-puce dgn-puce-' + p[0] + '"></span><span class="dgn-g-n"><b>' + esc(e.R.nom) + '</b><span>' + esc(base) + '</span></span>' + pill(p) + ico('chevd', 'ico-s g-chev') + '</button>';
  }).join('') + '</div>';
}
function ficheHtml() {
  var M = MOD[S.cuv], D = M.D, T = tuiles(M), tk = S.tuile;
  var h = '<button type="button" class="dgn-retour" data-dgn="retour">' + ico('chevg', 'ico-s') + 'Cuvées</button>';
  h += '<button type="button" class="dgn-retour" style="float:right" data-dgn="fiche" data-v="' + esc(S.cuv) + '">Fiche de la cuvée' + ico('chevd', 'ico-s') + '</button>';   // CAVE-RANGE-2a (§450)
  h += '<div class="dgn-fiche-tete"><div style="min-width:0"><h2 class="dgn-fiche-nom">' + esc(D.nom) + ' <span>' + D.mil + '</span></h2><div class="dgn-meta">';
  var derA = D.ana.filter(function (a) { return !a.bouteille; }).pop();
  h += '<span>' + esc(etape(M)) + '</span><span>' + M.nbF + ' fûts, ' + Math.round(M.part * 100) + ' % de neufs</span><span>Âge moyen ' + vinsTxt(M.age) + '</span>';
  if (M.dp != null && M.tav != null && !M.enrichInconnu) { var at = M.dp + M.enrich, ec = M.tav - at; h += '<span class="' + (Math.abs(ec) <= 0.3 ? 'dgn-ok' : '') + '">TAV ' + nf(M.tav, 1) + ' % vol (' + nf(at, 1) + ' attendu)</span>'; }
  if (derA) h += '<span>Dernière analyse le ' + fd(t(derA.d), true) + '</span>';
  h += '</div></div></div>';
  h += diagHtml(M);
  h += '<div class="dgn-bloc-titre"><h3>Chiffres clés</h3><span>Sélectionnez un chiffre pour afficher sa méthode de calcul.</span></div><div class="dgn-tuiles">' + T.map(function (x) {
    return '<button type="button" class="dgn-tuile" data-dgn="tuile" data-v="' + x.k + '" aria-pressed="' + (x.k === tk) + '"><span class="dgn-tuile-h">' + esc(x.t) + pill(x.p) + '</span><span class="dgn-tuile-v">' + esc(x.v) + (x.u ? '<small>' + esc(x.u) + '</small>' : '') + '</span><span class="dgn-tuile-c">' + esc(x.c) + '</span></button>';
  }).join('') + '</div>';
  if (tk) {
    var Pq = pourquoi(M, tk);
    h += '<div class="dgn-pourquoi" aria-live="polite"><h3>' + esc(Pq.titre) + '</h3>' + Pq.ps.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + (Pq.repere ? '<div class="dgn-repere">' + esc(Pq.repere) + '</div>' : '') + (Pq.base ? '<p class="dgn-base">' + esc(Pq.base) + '</p>' : '') + '</div>';
  }
  h += '<div class="dgn-bloc-titre"><h3>Grille des risques</h3><span>Sélectionnez un risque pour afficher le détail de ses indices.</span></div>' + risquesHtml(M);
  var off = offDe(S.cuv);
  var lanes = [['sucres', 'Sucres résiduels', 'var(--ink-info)'], ['mal', 'Acide malique', 'var(--vert-med)'], ['av', 'Acidité volatile', 'var(--terre)'], ['so2', 'SO2 libre', 'var(--bleu)'], ['lie', 'SO2 combiné', 'var(--plan-acc)'], ['ph', 'pH', 'var(--texte-med)'], ['at', 'Acidité totale', 'var(--acier-med)']];
  h += '<section class="mvcarte" aria-label="Évolution des analyses"><div class="dgn-carte-tete"><h2>Évolution des analyses</h2><div class="dgn-outils"><div class="dgn-legende" role="group" aria-label="Courbes">' + lanes.map(function (l) { return '<button type="button" data-dgn="lane" data-v="' + l[0] + '" aria-pressed="' + !off[l[0]] + '"><i class="dgn-puce" style="background:' + l[2] + '"></i>' + l[1] + '</button>'; }).join('') + '</div>';
  h += seg([['tout', 'Tout le parcours'], ['elev', 'Élevage', !M.maloEnd], ['90', '90 jours']], 'per', S.per, 'seg-s', 'Période');
  if (!M.miseMs) h += '<button type="button" class="dgn-interr" data-dgn="proj" aria-pressed="' + S.proj + '"><span class="dgn-sw" aria-hidden="true"></span>Projection</button>';
  h += '</div></div><div class="dgn-frise" id="dgn-frise"></div>';
  var idx = choisis(M);
  if (idx.length) h += '<div class="dgn-detail-geste" aria-live="polite">' + idx.map(function (i) { return detailGeste(M, D.gestes[i], i); }).join('') + '</div>';
  h += '</section>';
  var tab = S.tab || (M.miseMs ? 'fiche' : 'gestes');
  h += '<section class="mvcarte" aria-label="Détails"><div class="dgn-sous-onglets" role="tablist">' + [['gestes', 'Opérations'], ['analyses', 'Analyses du labo'], ['futs', 'Fûts'], ['fiche', M.miseMs ? 'Fiche du vin fini' : 'Fiche de suivi']].map(function (o) { return '<button type="button" role="tab" data-dgn="tab" data-v="' + o[0] + '" aria-selected="' + (tab === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div><div class="dgn-panneau" role="tabpanel" id="dgn-panneau">';
  if (tab === 'gestes') h += ongletGestes(M);
  else if (tab === 'analyses') h += ongletAnalyses(M);
  else if (tab === 'futs') h += ongletFuts(M);
  else h += ongletFiche(M);
  h += '</div></section>';
  return h;
}
function effets(M, g, i) {
  var D = M.D, gms = t(g.d), ef = [];
  if (g.k === 'so2') {
    if (g.mgl) ef.push('Environ ' + nf(g.mgl, 1) + ' mg/L de SO2 ajoutés.');
    else ef.push('Dose non convertie en mg/L : la force de la solution n’est pas renseignée.');
    var sp = M.serie('so2l'), bf = sp.filter(function (q) { return q.ms < gms; }).pop(), af = sp.filter(function (q) { return q.ms > gms; })[0];
    if (bf && af) ef.push('SO2 libre : ' + nf(bf.v, 0) + ' mg/L le ' + fd(bf.ms) + ', puis ' + nf(af.v, 0) + ' mg/L le ' + pt(fd(af.ms)) + (g.mgl ? ' ' + nf((af.v - bf.v) / g.mgl * 100, 0) + ' % de l’ajout retrouvé en SO2 libre.' : ''));
    else if (af) ef.push(pt('Première mesure suivante : ' + nf(af.v, 0) + ' mg/L de SO2 libre le ' + fd(af.ms)));
  }
  if (g.k === 'sout') ef.push(g.air === true ? 'Soutirage avec aération : apport d’oxygène. SO2 libre et acidité volatile à surveiller dans les semaines suivantes.' : (g.air === false ? 'Soutirage sans aération : aucun apport d’oxygène enregistré.' : 'Aération non renseignée (nouveau champ) : SO2 libre et acidité volatile à surveiller dans les semaines suivantes.'));
  if (g.k === 'degus' && g.sig && (g.sig.indexOf('vol') >= 0 || g.sig.indexOf('ani') >= 0 || g.sig.indexOf('oxy') >= 0)) ef.push('Observation prise en compte par le diagnostic, avec les analyses de l’ensemble de la cuvée.');
  if (g.k === 'enton') ef.push(M.nbF ? M.nbF + ' fûts, ' + Math.round(M.part * 100) + ' % de neufs, âge moyen ' + vinsTxt(M.age) + '.' : 'Aucun fût renseigné sur la cuvée.');
  if (g.k === 'chapt') ef.push(g.vol ? 'Enrichissement de ' + nf(g.vol, 1) + ' % vol, pris en compte dans le TAV attendu.' : 'Quantité non convertie en % vol : le TAV attendu n’est pas calculé.');
  if (g.k === 'mise' && !M.so2.vide && M.so2.mise) ef.push('Dernière analyse avant la mise : SO2 libre ' + nf(M.so2.last.v, 0) + ' mg/L, total ' + nf(M.so2.tot, 0) + ' mg/L.');
  return ef;
}
function detailGeste(M, g, i) {
  return '<div class="dgn-dg"><span class="dgn-dg-i">' + gico(g.k) + '</span><div><div class="dgn-dg-t"><b>' + esc(g.l) + '</b><span>' + fd(t(g.d), true) + '</span></div>' + (g.det ? '<p class="dgn-det">' + esc(g.det) + '</p>' : '') + effets(M, g, i).map(function (e) { return '<p>' + esc(e) + '</p>'; }).join('') + '</div></div>';
}
function ongletGestes(M, sel) {
  var D = M.D, idx = choisis(M);
  var h = '<ul class="dgn-journal">' + D.gestes.map(function (g, i) { return { g: g, i: i }; }).reverse().map(function (o) {
    var g = o.g, on = idx.indexOf(o.i) >= 0;
    return '<li class="' + (on ? 'dgn-sel' : '') + '"><span class="dgn-d">' + fd(t(g.d), true) + '</span><span class="dgn-dg-i">' + gico(g.k) + '</span><span><span class="dgn-t">' + esc(g.l) + '</span>' + (g.det ? '<div class="dgn-x">' + esc(g.det) + '</div>' : '') + effets(M, g, o.i).map(function (e) { return '<div class="dgn-e">' + esc(e) + '</div>'; }).join('') + '</span></li>';
  }).join('') + '</ul>';
  h += '<p class="dgn-base" style="margin:12px 0 0;font-size:var(--pt-micro,12px);color:var(--texte-doux)">' + M.ouil.length + ' ouillages, ' + M.adds.length + ' sulfitage' + (M.adds.length > 1 ? 's' : '') + (M.so2Ajoute ? ' (dont ' + nf(M.so2Ajoute, 0) + ' mg/L de SO2 connus).' : '.') + '</p>';
  return h;
}
function ongletAnalyses(M) {
  var D = M.D;
  var rows = D.ana.slice().reverse().map(function (a) {
    var ms = t(a.d), phx = a.ph != null ? a.ph : M.phAt(ms);
    function v(x, k) { if (x == null) return '—'; if (k === 'mal' && x < 0.1) return '< 0,1'; if (k === 'av') return nf(avU(x), 2); if (k === 'gf' || k === 'mal') return nf(x, x >= 10 ? 0 : (k === 'mal' ? 2 : 1)); if (k === 'ph') return nf(x, 2); return nf(x, 0); }
    var qui = a.lot ? '<span class="dgn-lot">' + esc(a.lot) + '</span>' : (a.mise ? 'à la mise' : (a.bouteille ? 'en bouteille' : 'cuvée'));
    return '<tr><td>' + fd(ms, true) + '</td><td>' + qui + '</td><td>' + v(a.gf, 'gf') + '</td><td>' + v(a.mal, 'mal') + '</td><td>' + v(a.av, 'av') + '</td><td>' + v(a.so2l, 's') + '</td><td>' + v(a.so2t, 's') + '</td><td>' + v(a.ph, 'ph') + '</td><td>' + (a.at != null ? nf(a.at, 2) : '—') + '</td><td>' + ((a.so2l != null && phx != null) ? nf(actif(a.so2l, phx), 2) : '—') + '</td></tr>';
  }).join('');
  return '<p class="dgn-lecture">' + ico('info', 'ico-s') + '<span>Lecture seule. Les rapports du labo se saisissent dans l’onglet <button type="button" class="dgn-lien" data-dgn="go-labo">Labo</button>.</span></p><div class="dgn-defile"><table class="dgn-tab"><thead><tr><th>Date</th><th>Prélevé sur</th><th>Sucres</th><th>Malique</th><th>Volatile</th><th>SO2 libre</th><th>SO2 total</th><th>pH</th><th>Acidité totale</th><th>SO2 actif</th></tr></thead><tbody>' + rows + '</tbody></table></div><p style="margin:10px 0 0;font-size:var(--pt-micro,12px);color:var(--texte-doux)">Acidité volatile en ' + uAv(false) + ', acidité totale en g/L H2SO4. SO2 actif calculé avec le pH de l’analyse.</p>';
}
function ongletFuts(M) {
  var D = M.D, mil = D.mil, dg = diagnostic(M);
  var soup = dg.top.filter(function (e) { return e.k === 'brett' || e.k === 'pique' || e.k === 'oxy'; });
  var h = '';
  if (soup.length) {
    var nz = dg.I.nez_ani.g || dg.I.nez_vol.g || dg.I.nez_oxy.g;
    var lots = D.futs.slice().sort(function (a, b) { return b.vins - a.vins; });
    h += '<div class="dgn-sentir"><h3>Ordre de contrôle conseillé</h3><p>Les analyses portent sur l’ensemble de la cuvée. Pour savoir si un fût en particulier est en cause, le contrôle au nez, fût par fût, reste le plus sûr. ' + cap(soup.map(function (e) { return e.R.chai + ' : ' + e.R.tc; }).join(' ; ')) + '. Vérifier aussi la présence de fleur et le niveau.</p><ol>';
    if (nz && nz.fut) h += '<li><b>Le ' + esc(nz.fut) + '</b> (' + esc(nz.futDe || '') + ') : ' + esc(pt('défaut relevé au nez le ' + fd(t(nz.d)))) + '</li>';
    lots.forEach(function (f) { h += '<li><b>' + esc(f.t + ', ' + f.an) + '</b> : ' + f.nb + ' fût' + (f.nb > 1 ? 's' : '') + ' ' + (f.vins === 0 ? 'neufs' : 'de ' + f.vins + ' vin' + (f.vins > 1 ? 's' : '')) + (f.vins >= 3 ? ' (bois âgé)' : '') + '.</li>'; });
    h += '</ol><p class="dgn-petit">Les observations se saisissent dans une dégustation (onglet Cuvées) ; le diagnostic se met à jour automatiquement.</p></div>';
  }
  var rows = D.futs.map(function (f) { return '<tr><td>' + esc(f.t) + '</td><td>' + f.an + '</td><td>' + f.nb + '</td><td>' + (f.vins === 0 ? 'neufs' : f.vins + ' vin' + (f.vins > 1 ? 's' : '')) + '</td><td>' + Math.round(f.nb / M.nbF * 100) + ' %</td></tr>'; }).join('');
  h += '<div class="dgn-defile"><table class="dgn-tab"><thead><tr><th>Tonnelier</th><th>Année du fût</th><th>Fûts</th><th>À l’entonnage</th><th>Part</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  h += '<div class="dgn-grille2" style="margin-top:12px"><div class="dgn-bloc"><span class="dgn-k">Part de neuf</span><span class="dgn-v">' + Math.round(M.part * 100) + ' %</span><span class="dgn-c">' + M.nbNeuf + ' fût' + (M.nbNeuf > 1 ? 's' : '') + ' neuf' + (M.nbNeuf > 1 ? 's' : '') + ' sur ' + M.nbF + '.</span></div><div class="dgn-bloc"><span class="dgn-k">Âge moyen</span><span class="dgn-v">' + vinsTxt(M.age) + '</span><span class="dgn-c">Nombre de vins déjà passés dans les fûts, à l’entonnage du ' + mil + '.</span></div><div class="dgn-bloc"><span class="dgn-k">Part des anges</span><span class="dgn-v">' + nf(D.anges, 1) + ' %</span><span class="dgn-c">Du volume par an, mesurée aux ouillages.</span></div></div>';
  return h;
}
function ongletFiche(M) {
  var D = M.D, s = M.so2, av = M.av, b = [];
  function bloc(k, v, c) { b.push('<div class="dgn-bloc"><span class="dgn-k">' + esc(k) + '</span><span class="dgn-v">' + esc(v) + '</span><span class="dgn-c">' + esc(c) + '</span></div>'); }
  if (M.dp != null) bloc('Du degré probable au TAV', M.tav != null ? nf(M.tav, 1) + ' % vol' : '—', 'Degré probable ' + nf(M.dp, 1) + (M.enrichInconnu ? ', chaptalisation notée (quantité non convertie).' : (M.enrich ? ', chaptalisation ' + sg(M.enrich, 1) : ', sans enrichissement') + ' : ' + nf(M.dp + M.enrich, 1) + ' % vol attendus.'));
  if (!D.sansCuve) bloc('Fermentation alcoolique', Math.round((t(D.fa[1]) - t(D.fa[0])) / J) + ' jours', M.gf.fa ? nf(M.gf.fa.v, 1) + ' g/L de sucres résiduels à la fin.' : 'Fin à confirmer par une analyse.');
  bloc('Malo', M.maloEnd ? Math.round((M.maloEnd - M.m0) / J) + ' jours' : 'En attente', M.maloEnd ? pt('Finie le ' + fd(M.maloEnd, true)) : 'Pas encore terminée.');
  if (!av.vide) bloc('Acidité volatile', nf(avU(av.last.v), 2) + ' ' + uAv(true), 'Fin de FA ' + nf(avU(av.fa), 2) + (av.malo != null ? ', fin de malo ' + nf(avU(av.malo), 2) : '') + (M.miseMs ? ', mise ' : ', dernière analyse ') + nf(avU(av.last.v), 2) + '. Valeur attendue : ' + nf(avU(av.env), 2) + '.');
  bloc('Sulfitages', M.adds.length + ' sulfitage' + (M.adds.length > 1 ? 's' : ''), (M.so2Ajoute ? 'Dont ' + nf(M.so2Ajoute, 0) + ' mg/L connus.' : 'Doses non converties en mg/L.') + (!s.vide ? ' ' + (s.mise ? 'À la mise' : 'Dernière analyse') + ' : libre ' + nf(s.last.v, 0) + ', total ' + nf(s.mise ? s.tot : s.last.tot, 0) + ' mg/L.' : ''));
  bloc('Fûts', M.nbF + ' fûts', M.nbF ? Math.round(M.part * 100) + ' % de neufs, âge moyen ' + vinsTxt(M.age) + (D.anges != null ? ', part des anges ' + nf(D.anges, 1) + ' % par an' : '') + '.' : 'Aucun fût renseigné.');
  var h = '<div class="dgn-grille2" style="margin-top:8px">' + b.join('') + '</div>';
  if (M.miseMs) {
    h += '<h3 style="margin:18px 0 8px;font-size:var(--pt-base,14px)">À la mise, le ' + fd(M.miseMs, true) + '</h3><div class="dgn-grille2">';
    h += '<div class="dgn-bloc"><span class="dgn-k">Bouteilles</span><span class="dgn-v">' + (D.bouteilles ? Number(D.bouteilles).toLocaleString('fr-FR') : '—') + '</span><span class="dgn-c">' + M.ouil.length + ' ouillages pendant l’élevage.</span></div>';
    if (!s.vide && s.mise) h += '<div class="dgn-bloc"><span class="dgn-k">SO2 actif</span><span class="dgn-v">' + nf(s.act, 2) + ' mg/L</span><span class="dgn-c">Libre ' + nf(s.last.v, 0) + ', total ' + nf(s.tot, 0) + ' mg/L, pH ' + nf(s.last.ph, 2) + '.</span></div>';
    var stb = function (x) { return x === 'stable' ? 'stable' : (x === 'instable' ? 'instable' : 'non renseigné'); };
    h += '<div class="dgn-bloc"><span class="dgn-k">Oxygène dissous, stabilité</span><span class="dgn-v">' + (D.o2 != null ? nf(D.o2, 1) + ' mg/L' : '—') + '</span><span class="dgn-c">Test tartrique ' + stb(D.tart) + ', test protéique ' + stb(D.prot) + '.</span></div>';
    if (s.apres) h += '<div class="dgn-bloc"><span class="dgn-k">En bouteille</span><span class="dgn-v">' + nf(s.apres.v, 0) + ' mg/L</span><span class="dgn-c">SO2 libre le ' + fd(s.apres.ms, true) + ', ' + nf(s.last.v - s.apres.v, 0) + ' de moins qu’à la mise.</span></div>';
    h += '</div>';
    var A = dgnAvant(M);
    if (A) {
      var cmpL = function (a, b2, plus, moins, eg) { if (a == null || b2 == null) return '—'; return Math.abs(a - b2) < 1e-9 ? eg : (a > b2 ? plus : moins); };
      h += '<h3 style="margin:18px 0 8px;font-size:var(--pt-base,14px)">Comparé au millésime ' + esc(A.D.mil) + '</h3><div class="dgn-defile"><table class="dgn-tab"><thead><tr><th>Mesure</th><th>' + esc(D.mil) + '</th><th>' + esc(A.D.mil) + '</th><th>Lecture</th></tr></thead><tbody>';
      h += '<tr><td>Degré probable</td><td><b>' + (M.dp != null ? nf(M.dp, 1) + ' %' : '—') + '</b></td><td>' + (A.dp != null ? nf(A.dp, 1) + ' %' : '—') + '</td><td>' + cmpL(M.dp, A.dp, 'Plus de sucre au départ', 'Moins de sucre au départ', 'Équivalent') + '</td></tr>';
      var dM = M.maloEnd ? Math.round((M.maloEnd - M.m0) / J) : null, dA = A.maloEnd ? Math.round((A.maloEnd - A.m0) / J) : null;
      h += '<tr><td>Durée de la malo</td><td><b>' + (dM != null ? dM + ' jours' : '—') + '</b></td><td>' + (dA != null ? dA + ' jours' : '—') + '</td><td>' + cmpL(dM, dA, 'Malo plus longue', 'Malo plus courte', 'Équivalente') + '</td></tr>';
      h += '<tr><td>Acidité volatile à la mise</td><td><b>' + (!av.vide ? nf(avU(av.last.v), 2) : '—') + '</b></td><td>' + (!A.av.vide ? nf(avU(A.av.last.v), 2) : '—') + '</td><td>' + cmpL(!av.vide ? av.last.v : null, !A.av.vide ? A.av.last.v : null, 'Plus élevée', 'Plus basse', 'Équivalente') + ' (fûts neufs : ' + Math.round(M.part * 100) + ' % contre ' + Math.round(A.part * 100) + ' %)</td></tr>';
      var tM = (!s.vide && s.mise) ? s.tot : null, tA = (!A.so2.vide && A.so2.mise) ? A.so2.tot : null;
      h += '<tr><td>SO2 total à la mise</td><td><b>' + (tM != null ? nf(tM, 0) + ' mg/L' : '—') + '</b></td><td>' + (tA != null ? nf(tA, 0) + ' mg/L' : '—') + '</td><td>' + cmpL(tM, tA, 'Sulfitage plus marqué', 'Sulfitage plus modéré', 'Équivalent') + '</td></tr>';
      h += '</tbody></table></div>';
    }
  } else h += '<p style="margin:14px 0 0;font-size:var(--pt-txt,13px);color:var(--texte-med)">La fiche se complète automatiquement. À la mise, elle intégrera les dernières analyses, puis la comparaison avec le millésime précédent.</p>';
  return h;
}
function dgnAvant(M) {
  var nom = String(M.D.nom).trim().toLowerCase(), mil = parseInt(M.D.mil, 10), best = null;
  if (!isFinite(mil)) return null;
  Object.keys(MOD).forEach(function (k) { var X = MOD[k]; if (X && X !== M && String(X.D.nom).trim().toLowerCase() === nom && parseInt(X.D.mil, 10) === mil - 1) best = X; });
  return best;
}

/* ════════ La frise ════════ */
var FR = null;
function renderFrise() {
  var host = $('dgn-frise'); if (!host) return;
  var W = host.clientWidth; if (W < 120) return;
  var M = MOD[S.cuv], D = M.D, G = 44, R = 10, PW = W - G - R, LH = W < 560 ? 70 : 82;
  var t0 = t(D.debut), t1;
  if (M.miseMs) t1 = (M.so2.apres ? M.so2.apres.ms : M.miseMs) + 30 * J;
  else { t1 = AUJ + 35 * J; if (S.proj && M.so2.cross && M.so2.cross > AUJ) t1 = Math.max(t1, Math.min(M.so2.cross + 20 * J, AUJ + 100 * J)); }
  if (S.per === 'elev' && M.maloEnd) t0 = M.maloEnd - 12 * J;
  if (S.per === '90') t0 = Math.max(t(D.debut), M.ref - 90 * J);
  function X(ms) { return G + (ms - t0) / (t1 - t0) * PW; }
  var now = M.miseMs ? null : AUJ, xNow = now ? X(now) : null;
  var h = '';
  /* étapes */
  var ph = [['Fermentation', t(D.fa[0]), t(D.fa[1]), 'var(--or-pale)'], [M.maloEnd ? 'Malo' : 'Malo (non démarrée)', M.m0, M.maloEnd || AUJ, 'var(--vert-pale)']];
  if (M.maloEnd) ph.push(['Élevage', M.maloEnd, M.miseMs || AUJ, 'var(--terre-pale)']);
  if (M.miseMs) ph.push(['En bouteille', M.miseMs, t1, 'var(--survol)']);
  h += '<svg width="' + W + '" height="26" aria-hidden="true">';
  ph.forEach(function (p) { var a = Math.max(G, X(p[1])), b = Math.min(G + PW, X(p[2])); if (b - a < 2) return; h += '<rect x="' + a.toFixed(1) + '" y="3" width="' + (b - a).toFixed(1) + '" height="20" rx="5" style="fill:' + p[3] + '"/>'; if (b - a > 70) h += '<text x="' + (a + 8).toFixed(1) + '" y="17" font-size="11" font-weight="600" style="fill:var(--texte)">' + esc(p[0]) + '</text>'; });
  if (xNow != null && G + PW - xNow > 64) h += '<text x="' + (xNow + 8).toFixed(1) + '" y="17" font-size="11" style="fill:var(--texte-doux)">Projection</text>';
  h += '</svg>';
  /* gestes */
  var idxSel = choisis(M), selMs = idxSel.length ? t(D.gestes[idxSel[0]].d) : null;
  var gs = D.gestes.map(function (g, i) { return { g: g, i: i, ms: t(g.d) }; }).filter(function (o) { return o.ms >= t0 && o.ms <= t1; });
  var grp = [];
  gs.forEach(function (o) { var x = X(o.ms), gr = grp[grp.length - 1]; if (gr && x - gr.x < 32) gr.items.push(o); else grp.push({ x: x, items: [o] }); });
  h += '<div class="dgn-rangee" style="height:38px">';
  grp.forEach(function (gr) {
    var on = gr.items.some(function (o) { return choisis(M).indexOf(o.i) >= 0; });
    var x = Math.max(G + 15, Math.min(G + PW - 15, gr.x)), noms = gr.items.map(function (o) { return LBL[o.g.k]; });
    h += '<button type="button" class="dgn-geste" data-dgn="geste" data-v="' + gr.items.map(function (o) { return o.i; }).join(',') + '" aria-pressed="' + on + '" aria-label="' + esc(noms.join(', ') + ', ' + fd(gr.items[0].ms, true)) + '" title="' + esc(noms.join(', ')) + '" style="left:' + x.toFixed(1) + 'px">' + gico(gr.items[0].g.k) + (gr.items.length > 1 ? '<b>+' + (gr.items.length - 1) + '</b>' : '') + '</button>';
  });
  h += '</div>';
  var ou = M.ouil.filter(function (m) { return m >= t0 && m <= t1; });
  h += '<svg width="' + W + '" height="14" aria-hidden="true"><text x="' + (G - 6) + '" y="11" text-anchor="end" font-size="11" style="fill:var(--texte-doux)">ouill.</text>' + ou.map(function (m) { var x = X(m).toFixed(1); return '<line x1="' + x + '" x2="' + x + '" y1="3" y2="12" style="stroke:var(--texte-doux);stroke-width:1"/>'; }).join('') + '</svg>';
  /* couloirs */
  var L = couloirs(M, t0, t1);
  var off = offDe(S.cuv), vis = L.filter(function (l) { return !off[l.k]; });
  h += '<div class="dgn-couloirs" tabindex="0" aria-label="Courbes ; flèches gauche et droite pour passer d’une date à l’autre">';
  vis.forEach(function (Ln) {
    h += '<div class="dgn-couloir-t' + (Ln.dim ? ' dgn-dim' : '') + '"><span class="dgn-n"><i class="dgn-puce" style="background:' + Ln.col + '"></i>' + esc(Ln.n) + ' <span class="dgn-u">' + esc(Ln.u) + '</span></span><span class="dgn-v" style="color:' + (Ln.vcol || 'var(--texte)') + '">' + esc(Ln.val) + '</span></div>';
    h += laneSvg(Ln, W, LH, G, PW, X, xNow, selMs);
  });
  if (!vis.length) h += '<p class="dgn-vide">Choisis au moins une courbe.</p>';
  h += '<div class="dgn-capture"></div><div class="dgn-xh"></div><div class="dgn-bulle"></div></div>';
  /* axe */
  var span = (t1 - t0) / J, d0 = new Date(t0), yy = d0.getUTCFullYear(), mm = d0.getUTCMonth(), vs = [];
  for (var k = 0; k < 40; k++) {
    if (mm > 11) { mm = 0; yy++; }
    (span < 130 ? [1, 15] : [1]).forEach(function (j) { var ms = Date.UTC(yy, mm, j); if (ms >= t0 && ms <= t1 && X(ms) < G + PW - 30) vs.push({ ms: ms, m: mm, y: yy, j: j }); });
    if (Date.UTC(yy, mm, 1) > t1) break; mm++;
  }
  var pas = Math.max(1, Math.ceil(vs.length / Math.max(2, Math.floor(PW / 64))));
  h += '<div class="dgn-axe">' + vs.filter(function (v, i) { return i % pas === 0; }).map(function (v, i) { var lab = (span < 130 ? (v.j === 1 ? '1er ' : '15 ') : '') + MOIS[v.m] + ((i === 0 || (v.m === 0 && v.j === 1)) ? ' ' + v.y : ''); return '<span style="left:' + (X(v.ms) - G).toFixed(1) + 'px">' + lab + '</span>'; }).join('') + '</div>';
  host.innerHTML = dgnTypo(h);
  /* curseur */
  var snaps = [];
  D.ana.forEach(function (a) { var ms = t(a.d); if (ms >= t0 && ms <= t1 && snaps.indexOf(ms) < 0) snaps.push(ms); });
  D.gestes.forEach(function (g) { var ms = t(g.d); if (ms >= t0 && ms <= t1 && snaps.indexOf(ms) < 0) snaps.push(ms); });
  snaps.sort(function (a, b) { return a - b; });
  FR = { X: X, G: G, W: W, snaps: snaps, L: vis, M: M, cur: null };
  var zone = host.querySelector('.dgn-couloirs'), cap = host.querySelector('.dgn-capture');
  if (!cap || !vis.length) return;
  cap.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; viser(e, cap); });
  cap.addEventListener('pointerdown', function (e) { viser(e, cap); });
  cap.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') cacherXh(); });
  zone.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Escape') return;
    e.preventDefault();
    if (e.key === 'Escape') { cacherXh(); return; }
    var i = FR.cur == null ? (e.key === 'ArrowLeft' ? snaps.length - 1 : 0) : snaps.indexOf(FR.cur) + (e.key === 'ArrowLeft' ? -1 : 1);
    i = Math.max(0, Math.min(snaps.length - 1, i)); montrerXh(snaps[i]);
  });
}
function viser(e, cap) {
  var r = cap.getBoundingClientRect(), px = e.clientX - r.left + FR.G, best = null, bd = 1e9;
  FR.snaps.forEach(function (ms) { var d = Math.abs(FR.X(ms) - px); if (d < bd) { bd = d; best = ms; } });
  if (best != null && bd <= 40) montrerXh(best); else cacherXh();
}
function montrerXh(ms) {
  var host = $('dgn-frise'); if (!host) return;
  var xh = host.querySelector('.dgn-xh'), bu = host.querySelector('.dgn-bulle'), x = FR.X(ms), M = FR.M, D = M.D;
  var rows = '';
  FR.L.forEach(function (Ln) { var p = Ln.pts.filter(function (q) { return q.ms === ms; })[0]; if (p) rows += '<div class="dgn-r"><span><i class="dgn-puce" style="background:' + Ln.col + '"></i>' + esc(Ln.n) + '</span><span>' + esc(Ln.tip(p)) + '</span></div>'; });
  D.ana.filter(function (a) { return a.lot && t(a.d) === ms; }).forEach(function (a) { rows += '<div class="dgn-r"><span><i class="dgn-puce dgn-puce-dan"></i>' + esc(a.lot) + ' seul</span><span>vol. ' + nf(avU(a.av), 2) + ', libre ' + nf(a.so2l, 0) + '</span></div>'; });
  var ges = D.gestes.filter(function (g) { return t(g.d) === ms; }).map(function (g) { return esc(g.l); });
  bu.innerHTML = dgnTypo('<b>' + fd(ms, true) + '</b>' + (rows || '<div class="dgn-r"><span>Aucune analyse ce jour</span><span></span></div>') + (ges.length ? '<div class="dgn-g">' + ges.join('<br>') + '</div>' : ''));
  xh.style.left = x + 'px'; xh.style.display = 'block'; bu.style.display = 'block';
  var bw = bu.offsetWidth, left = x + 12; if (left + bw > FR.W - 2) left = x - 12 - bw; bu.style.left = Math.max(2, left) + 'px';
  FR.cur = ms;
}
function cacherXh() { var host = $('dgn-frise'); if (!host) return; var a = host.querySelector('.dgn-xh'), b = host.querySelector('.dgn-bulle'); if (a) a.style.display = 'none'; if (b) b.style.display = 'none'; if (FR) FR.cur = null; }

function couloirs(M, t0, t1) {
  var D = M.D, L = [], s = M.so2, av = M.av;
  function pts(k) { return M.serie(k).map(function (p) { return { ms: p.ms, v: p.v, a: p.a }; }); }
  /* sucres */
  (function () {
    var L2 = Math.log(300) / Math.LN10;
    function y(v) { return (L2 - Math.log(Math.max(v, 0.1)) / Math.LN10) / (L2 + 1); }
    var dens = (D.densPts || []).map(function (p) { return { ms: t(p.d), v: p.s }; }), lab = pts('gf'), res = lab.filter(function (p) { return p.v < 5; });
    L.push({ k: 'sucres', n: 'Sucres résiduels (G+F)', u: 'g/L, échelle log.', col: 'var(--ink-info)', y: y, lignes: [dens, res], pts: lab, dots: lab.map(function (p) { return { ms: p.ms, v: p.v, c: (M.gf.baisse && p.ms === M.gf.last.ms) ? 'var(--attention)' : null }; }),
      ticks: [[200, '200'], [20, '20'], [2, '2'], [0.2, '0,2']], refs: [{ v: 1, l: 'vin sec sous 1 g/L', c: 'var(--ok)' }], val: M.gf.last ? nf(M.gf.last.v, 1) + ' g/L' : '—', vcol: M.gf.baisse ? 'var(--attention-texte)' : null,
      tip: function (p) { return nf(p.v, p.v < 10 ? 1 : 0) + ' g/L'; }, aria: 'Sucres de ' + (dens[0] ? nf(dens[0].v, 0) : (lab[0] ? nf(lab[0].v, 1) : '?')) + ' g/L à ' + (M.gf.last ? nf(M.gf.last.v, 1) : '?') + ' g/L' });
  })();
  /* malique */
  (function () {
    var p = pts('mal');
    L.push({ k: 'mal', n: 'Acide malique', u: 'g/L', col: 'var(--vert-med)', y: function (v) { return 1 - Math.min(v, 3) / 3; }, lignes: [p], pts: p, dots: p.map(function (q) { return { ms: q.ms, v: q.v }; }),
      ticks: [[0, '0'], [1, '1'], [2, '2'], [3, '3']], refs: [{ v: 0.1, l: 'fin de malo sous 0,1 g/L', c: 'var(--ok)' }], val: M.malLast ? (M.malLast.v < 0.1 ? 'moins de 0,1' : nf(M.malLast.v, 1) + ' g/L') : '—',
      tip: function (q) { return q.v < 0.1 ? 'moins de 0,1 g/L' : nf(q.v, 2) + ' g/L'; }, aria: 'Acide malique' });
  })();
  /* volatile */
  (function () {
    var p = pts('av'), bands = [];
    function bande(a, b, base) { if (b <= a) return; var up = [], lo = []; for (var m = a; m <= b + 1; m += 5 * J) { var mm = Math.min(m, b); up.push([mm, Math.min(0.8, M.env(mm))]); lo.unshift([mm, base]); } bands.push(up.concat(lo)); }
    var mEnd = M.maloEnd || Math.min(AUJ, M.m0 + 70 * J);
    bande(M.m0, Math.min(mEnd, t1), av.fa);
    if (M.maloEnd) bande(M.maloEnd, Math.min(t1, M.miseMs || t1), av.malo);
    var proj = null;
    if (!M.miseMs && S.proj && av.rec && av.last.ms < t1) proj = [[av.last.ms, av.last.v], [t1, Math.max(0, av.last.v + av.rec.b * (t1 - av.last.ms) / J)]];
    var lots = D.ana.filter(function (a) { return a.lot && a.av != null; }).map(function (a) { return { ms: t(a.d), v: a.av, lot: a.lot }; });
    var dl = p.map(function (q) { var e = M.env(q.ms); return { ms: q.ms, v: q.v, c: (!M.miseMs && q.v >= S.set.seuil - 1e-9) ? 'var(--danger)' : (q.v > e + 1e-9 ? 'var(--attention)' : null) }; });
    var tk = [0, 0.2, 0.4, 0.6, 0.8].map(function (v) { return [v, nf(avU(v), 1)]; });
    L.push({ k: 'av', n: 'Acidité volatile', u: uAv(true), col: 'var(--terre)', y: function (v) { return 1 - Math.min(v, 0.8) / 0.8; }, lignes: [p], pts: p, dots: dl, lots: lots, bands: bands, proj: proj,
      ticks: tk, refs: M.miseMs ? [] : [{ v: S.set.seuil, l: 'seuil d’alerte du domaine ' + nf(avU(S.set.seuil), 2), c: 'var(--danger)', gauche: true }],
      val: av.vide ? '—' : nf(avU(av.last.v), 2), vcol: av.auSeuil ? 'var(--danger-texte)' : ((av.hors || av.vite) ? 'var(--attention-texte)' : null),
      tip: function (q) { return nf(avU(q.v), 2) + ' (attendu ' + nf(avU(M.env(q.ms)), 2) + ')'; }, aria: 'Volatile ' + (av.vide ? 'non mesurée' : nf(avU(av.last.v), 2)) + ', budget ' + nf(avU(av.env), 2) });
  })();
  /* SO2 */
  (function () {
    var p = M.serie('so2l').map(function (q) { return { ms: q.ms, v: q.v, a: q.a }; });
    var cuts = M.adds.map(function (a) { return a.ms; }); if (M.miseMs) cuts.push(M.miseMs + 1);
    var segs = [], cur = [];
    p.forEach(function (q) { if (cur.length && cuts.some(function (c) { return c > cur[cur.length - 1].ms && c <= q.ms; })) { segs.push(cur); cur = []; } cur.push(q); });
    if (cur.length) segs.push(cur);
    var steps = [];
    p.forEach(function (q, i) { if (q.a.bouteille) return; var nx = i < p.length - 1 && !p[i + 1].a.bouteille ? p[i + 1].ms : (M.miseMs || t1); steps.push([q.ms, nx, besoin(M.obj, M.phAt(q.ms))]); });
    var proj = null, marks = [];
    if (!s.vide && !s.mise && s.fit && S.proj) {
      var end = s.cross ? s.cross : t1;
      proj = [[s.last.ms, s.fit.at(s.last.ms)], [end, Math.max(0, s.fit.at(end))]];
      if (s.cross) marks.push({ ms: s.cross, v: s.need, l: 'sous l’objectif vers le ' + fd(s.cross) });
    }
    var lots = D.ana.filter(function (a) { return a.lot && a.so2l != null; }).map(function (a) { return { ms: t(a.d), v: a.so2l, lot: a.lot }; });
    L.push({ k: 'so2', n: 'SO2 libre', u: 'mg/L', col: 'var(--bleu)', y: function (v) { return 1 - Math.min(v, 60) / 60; }, lignes: segs, pts: p,
      dots: p.map(function (q) { var ph = M.phAt(q.ms); return { ms: q.ms, v: q.v, c: (!q.a.bouteille && ph && actif(q.v, ph) < M.obj - 1e-9) ? 'var(--attention)' : null }; }), lots: lots, steps: steps, proj: proj, marks: marks,
      ticks: [[0, '0'], [20, '20'], [40, '40'], [60, '60']], refs: [],
      val: s.vide ? 'pas encore' : nf(s.mise ? s.last.v : s.last.v, 0) + ' mg/L', vcol: (!s.vide && !s.mise && s.actAuj < M.obj) ? 'var(--attention-texte)' : null,
      tip: function (q) { var ph = M.phAt(q.ms); return nf(q.v, 0) + ' mg/L' + (ph ? ', actif ' + nf(actif(q.v, ph), 2) : ''); }, aria: 'SO2 libre ; le pointillé orange est le libre nécessaire pour l’objectif' });
  })();
  /* SO2 combiné */
  (function () {
    var p = M.D.ana.filter(function (a) { return !a.lot && !a.bouteille && a.so2l != null && a.so2t != null; }).map(function (a) { return { ms: t(a.d), v: a.so2t - a.so2l, a: a }; });
    var cuts = M.adds.map(function (a) { return a.ms; }), segs = [], cur = [];
    p.forEach(function (q) { if (cur.length && cuts.some(function (c) { return c > cur[cur.length - 1].ms && c <= q.ms; })) { segs.push(cur); cur = []; } cur.push(q); });
    if (cur.length) segs.push(cur);
    var dl = p.length ? p[p.length - 1] : null, I = diagnostic(M).I;
    L.push({ k: 'lie', n: 'SO2 combiné', u: 'mg/L, total moins libre', col: 'var(--plan-acc)', y: function (v) { return 1 - Math.min(v, 80) / 80; }, lignes: segs, pts: p, dots: p.map(function (q) { return { ms: q.ms, v: q.v }; }),
      ticks: [[0, '0'], [40, '40'], [80, '80']], refs: [], val: dl ? nf(dl.v, 0) + ' mg/L' : '—', vcol: (I.lie && I.lie.etat === 'oui') ? 'var(--attention-texte)' : null,
      tip: function (q) { return nf(q.v, 0) + ' mg/L'; }, aria: 'SO2 combiné' });
  })();
  /* pH */
  (function () {
    var p = pts('ph');
    L.push({ k: 'ph', n: 'pH', u: '', col: 'var(--texte-med)', y: function (v) { return (3.9 - Math.max(3.2, Math.min(3.9, v))) / 0.7; }, lignes: [p], pts: p, dots: p.map(function (q) { return { ms: q.ms, v: q.v }; }),
      ticks: [[3.3, '3,3'], [3.5, '3,5'], [3.7, '3,7'], [3.9, '3,9']], refs: [], val: M.phLast != null ? nf(M.phLast, 2) : '—', tip: function (q) { return nf(q.v, 2); }, aria: 'pH' });
  })();
  /* acidité totale */
  (function () {
    var p = pts('at');
    L.push({ k: 'at', n: 'Acidité totale', u: 'g/L H2SO4', col: 'var(--acier-med)', y: function (v) { return (5.2 - Math.max(3, Math.min(5.2, v))) / 2.2; }, lignes: [p], pts: p, dots: p.map(function (q) { return { ms: q.ms, v: q.v }; }),
      ticks: [[3.2, '3,2'], [4.2, '4,2'], [5.2, '5,2']], refs: [], val: p.length ? nf(p[p.length - 1].v, 2) : '—', tip: function (q) { return nf(q.v, 2) + ' g/L'; }, aria: 'Acidité totale' });
  })();
  /* le diagnostic éclaire les courbes qui portent ses indices */
  var dg = diagnostic(M), foc = S.focus ? dg.ev.filter(function (e) { return e.k === S.focus; }) : dg.top;
  var lf = {}, ev = {};
  foc.forEach(function (e) { e.R.lanes.forEach(function (k) { lf[k] = 1; }); e.preuves.forEach(function (x) { if (!x.couloir) return; ev[x.couloir] = ev[x.couloir] || []; if (ev[x.couloir].indexOf(x) < 0) ev[x.couloir].push(x); }); });
  var TAG = { sucres: 'en baisse', lie: 'hausse rapide', av: 'au-dessus de l’attendu', fond: 'baisse rapide', actif: 'sous l’objectif', phup: 'en hausse', atdown: 'en baisse', mal_stagne: 'presque stable', actif_mise: 'sous l’objectif', baisse_btl: 'en baisse', sucres_haut: 'résiduels', malique: 'résiduel', sucres_fin: 'résiduels' };
  var aF = Object.keys(lf).length > 0;
  L.forEach(function (Ln) {
    Ln.dim = aF && !lf[Ln.k];
    var xs = ev[Ln.k] || [], last = Ln.pts.filter(function (q) { return q.ms >= t0 && q.ms <= t1; }).pop();
    Ln.evid = (xs.length && last) ? [{ ms: last.ms, v: last.v, l: xs.map(function (x) { return TAG[x.id] || x.label; }).join(', ') }] : [];
  });
  return L;
}

function laneSvg(Ln, W, LH, G, PW, X, xNow, selMs) {
  var top = 8, bot = LH - 8, hh = bot - top;
  function Y(v) { return top + Ln.y(v) * hh; }
  function P(a) { return a.map(function (q, i) { return (i ? 'L' : 'M') + X(q.ms).toFixed(1) + ' ' + Y(q.v).toFixed(1); }).join(''); }
  var id = 'k' + Ln.k, s = '<svg width="' + W + '" height="' + LH + '" role="img" aria-label="' + esc(Ln.aria) + '"' + (Ln.dim ? ' class="dgn-dim"' : '') + '>';
  s += '<defs><clipPath id="' + id + '"><rect x="' + G + '" y="0" width="' + PW + '" height="' + LH + '"/></clipPath><pattern id="h' + id + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="7" style="fill:var(--survol)"/></pattern></defs>';
  Ln.ticks.forEach(function (tk) { var y = Y(tk[0]).toFixed(1); s += '<line x1="' + G + '" x2="' + (G + PW) + '" y1="' + y + '" y2="' + y + '" style="stroke:var(--ligne)"/><text x="' + (G - 6) + '" y="' + (+y + 3.5) + '" text-anchor="end" font-size="11" style="fill:var(--texte-doux)">' + tk[1] + '</text>'; });
  s += '<g clip-path="url(#' + id + ')">';
  if (xNow != null) s += '<rect x="' + xNow.toFixed(1) + '" y="0" width="' + Math.max(0, G + PW - xNow).toFixed(1) + '" height="' + LH + '" style="fill:url(#h' + id + ')"/>';
  (Ln.bands || []).forEach(function (b) { s += '<path d="' + b.map(function (q, i) { return (i ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }).join('') + 'Z" style="fill:var(--ok-doux)"/>'; });
  if (selMs != null) { var xs = X(selMs).toFixed(1); s += '<line x1="' + xs + '" x2="' + xs + '" y1="0" y2="' + LH + '" style="stroke:var(--accent-texte);stroke-width:1;stroke-dasharray:3 3"/>'; }
  (Ln.refs || []).forEach(function (r) { var y = Y(r.v).toFixed(1); s += '<line x1="' + G + '" x2="' + (G + PW) + '" y1="' + y + '" y2="' + y + '" style="stroke:' + r.c + ';stroke-width:1;stroke-dasharray:2 3"/>'; });
  if (Ln.steps && Ln.steps.length) s += '<path d="' + Ln.steps.map(function (st, i) { return (i ? 'L' : 'M') + X(st[0]).toFixed(1) + ' ' + Y(st[2]).toFixed(1) + 'L' + X(st[1]).toFixed(1) + ' ' + Y(st[2]).toFixed(1); }).join('') + '" style="fill:none;stroke:var(--attention);stroke-width:1.5;stroke-dasharray:6 4"/>';
  (Ln.lignes || []).forEach(function (a) { if (a.length > 1) s += '<path d="' + P(a) + '" style="fill:none;stroke:' + Ln.col + ';stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>'; });
  if (Ln.proj) s += '<path d="M' + X(Ln.proj[0][0]).toFixed(1) + ' ' + Y(Ln.proj[0][1]).toFixed(1) + 'L' + X(Ln.proj[1][0]).toFixed(1) + ' ' + Y(Ln.proj[1][1]).toFixed(1) + '" style="fill:none;stroke:' + Ln.col + ';stroke-width:2;stroke-dasharray:1.5 5;stroke-linecap:round"/>';
  if (xNow != null) s += '<line x1="' + xNow.toFixed(1) + '" x2="' + xNow.toFixed(1) + '" y1="0" y2="' + LH + '" style="stroke:var(--accent-texte);stroke-width:1.5"/>';
  (Ln.dots || []).forEach(function (d) { s += '<circle cx="' + X(d.ms).toFixed(1) + '" cy="' + Y(d.v).toFixed(1) + '" r="3.6" style="fill:' + (d.c || 'var(--bg-card)') + ';stroke:' + (d.c || Ln.col) + ';stroke-width:2"/>'; });
  (Ln.lots || []).forEach(function (d) { var cx = X(d.ms).toFixed(1), cy = Y(d.v).toFixed(1), avant = (G + PW) - X(d.ms) < 90; s += '<circle cx="' + cx + '" cy="' + cy + '" r="4.5" style="fill:var(--bg-card);stroke:var(--danger);stroke-width:2"/><text x="' + (avant ? +cx - 8 : +cx + 8) + '" y="' + (+cy + 4) + '" text-anchor="' + (avant ? 'end' : 'start') + '" font-size="11" font-weight="600" style="fill:var(--danger-texte);paint-order:stroke;stroke:var(--bg-card);stroke-width:3px">' + esc(d.lot) + '</text>'; });
  (Ln.marks || []).forEach(function (m) { var cx = X(m.ms), cy = Y(m.v); s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5" style="fill:var(--bg-card);stroke:var(--attention);stroke-width:2"/>'; var gauche = cx - G > 170; s += '<text x="' + (gauche ? cx - 9 : cx + 9).toFixed(1) + '" y="' + (cy + 15).toFixed(1) + '" text-anchor="' + (gauche ? 'end' : 'start') + '" font-size="11" font-weight="600" style="fill:var(--attention-texte);paint-order:stroke;stroke:var(--bg-card);stroke-width:3px">' + esc(m.l) + '</text>'; });
  (Ln.refs || []).forEach(function (r) { var y = Y(r.v); s += '<text x="' + (r.gauche ? G + 4 : G + PW - 4) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="' + (r.gauche ? 'start' : 'end') + '" font-size="11" font-weight="600" style="fill:' + r.c + ';paint-order:stroke;stroke:var(--bg-card);stroke-width:3px">' + esc(r.l) + '</text>'; });
  if (Ln.steps && Ln.steps.length) { var lst = Ln.steps[Ln.steps.length - 1], ly = Y(lst[2]); s += '<text x="' + (G + PW - 4) + '" y="' + (ly - 5).toFixed(1) + '" text-anchor="end" font-size="11" font-weight="600" style="fill:var(--attention-texte);paint-order:stroke;stroke:var(--bg-card);stroke-width:3px">SO2 libre nécessaire</text>'; }
  (Ln.evid || []).forEach(function (m) { var cx = X(m.ms), cy = Y(m.v), gauche = cx - G > 120; s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="8.5" style="fill:none;stroke:var(--danger);stroke-width:2"/><text x="' + (gauche ? cx - 13 : cx + 13).toFixed(1) + '" y="' + (cy + 4).toFixed(1) + '" text-anchor="' + (gauche ? 'end' : 'start') + '" font-size="11" font-weight="700" style="fill:var(--danger-texte);paint-order:stroke;stroke:var(--bg-card);stroke-width:3px">' + esc(m.l) + '</text>'; });
  return s + '</g></svg>';
}

/* ════════ À venir ════════ */
function echeances2(M) {
  var D = M.D, s = M.so2, dg = diagnostic(M), nom = D.nom + ' ' + D.mil, out = [], P = previsions(M);
  if (M.miseMs) return out;
  if (dg.top.length) {
    var e0 = dg.top[0], ids = {}, ch = [];
    dg.top.forEach(function (e) { e.preuves.forEach(function (x) { if (!ids[x.id] && ch.length < 4) { ids[x.id] = 1; ch.push(cap(x.label.replace(/^(Le |La |Les |L’|Il )/, '')) + ' : ' + x.val); } }); });
    var pr = P.filter(function (p) { return /malo finirait|ne baisse pas/.test(p.txt); })[0];
    out.push({ quand: 'now', ordre: e0.st === 'probable' ? 0 : 1, g: e0.st === 'probable' ? 'dan' : 'att', cuv: D.k, nom: nom, suj: dg.titre, exp: (pr ? pr.txt + ' ' : '') + 'Indices croisés : laboratoire, opérations, fûts, dégustations.', chips: ch, act: e0.R.laboDit || dg.stage === 'malo' ? 'Demander une analyse' : '' });
  }
  if (dg.vieux) out.push({ quand: 'now', ordre: 2, g: 'att', vieux: true, cuv: D.k, nom: nom, suj: 'Analyse trop ancienne : ' + s.ageJ + ' jours', exp: 'Les deux derniers mois ne sont pas couverts par le diagnostic.', chips: [], act: 'Demander une analyse' });
  if (!s.vide && !s.mise && !s.vieux && s.cross && s.cross > AUJ && s.cross <= AUJ + 60 * J) {
    var j = joursA(s.cross);
    out.push({ quand: 'later', ordre: 10 + j, ms: s.cross, g: j <= 14 ? 'att' : 'n', cuv: D.k, nom: nom, suj: pt('SO2 actif sous l’objectif (' + nf(M.obj, 1) + ' mg/L) vers le ' + fd(s.cross)), exp: 'SO2 libre ' + nf(s.last.v, 0) + ' mg/L à pH ' + nf(s.last.ph, 2) + ' ; baisse de ' + nf(-s.fit.b * 30.44, 1) + ' mg/L par mois.', chips: [], ech: 'Dans ' + j + ' j', act: '' });
  }
  return out;
}
function vueEcheances() {
  var all = []; dgnListe().forEach(function (k) { all = all.concat(echeances2(MOD[k])); });
  all.sort(function (a, b) { return a.ordre - b.ordre; });
  var now = all.filter(function (e) { return e.quand === 'now'; }), later = all.filter(function (e) { return e.quand === 'later'; });
  var h = '<div style="display:flex;flex-direction:column;gap:16px">';
  h += '<section class="mvcarte" aria-label="Les 60 prochains jours"><div class="dgn-carte-tete"><h2>Les 60 prochains jours</h2><span style="font-size:var(--pt-micro,12px);color:var(--texte-doux)">Au ' + fd(AUJ, true) + ', toutes cuvées</span></div><div class="dgn-ech-frise"><div class="dgn-axe60"></div>';
  for (var w = 0; w <= 8; w++) { var ms = AUJ + w * 7 * J, x = (w * 7 / 60 * 100); if (x > 100) break; h += '<span class="dgn-sem" style="left:' + x.toFixed(2) + '%"></span><span class="dgn-sem-l" style="left:' + x.toFixed(2) + '%">' + (w === 0 ? 'aujourd’hui' : fd(ms)) + '</span>'; }
  later.forEach(function (e, i) {
    var x = (e.ms - AUJ) / (60 * J) * 100, haut = i % 2 === 0;
    h += '<span class="dgn-jal" style="left:' + x.toFixed(2) + '%;border-color:' + (e.g === 'att' ? 'var(--attention)' : 'var(--texte-med)') + '"></span><span class="dgn-jal-l" style="left:' + x.toFixed(2) + '%;' + (haut ? 'bottom:72px' : 'top:84px') + ';' + (x > 70 ? 'transform:translateX(-100%);border-left:0;border-right:1px solid var(--ligne-forte);padding:0 6px 0 0;text-align:right' : '') + '"><b>' + fd(e.ms) + '</b><span style="color:var(--texte-med)">' + esc(e.nom) + '</span></span>';
  });
  h += '</div></section>';
  function ligne(e) {
    var p = e.g === 'dan' ? ['dan', 'Signes forts'] : (e.g === 'att' ? ['att', e.quand === 'now' ? (e.vieux ? 'Analyse ancienne' : 'Signes modérés') : e.ech] : ['n', e.ech]);
    return '<div class="dgn-ech-l"><div>' + pill(p) + '</div><div style="min-width:0"><div class="dgn-cuv">' + esc(e.nom) + '</div><div class="dgn-suj">' + esc(e.suj) + '</div><div class="dgn-exp">' + esc(e.exp) + '</div>' + (e.chips.length ? '<div class="dgn-chips">' + e.chips.map(function (c) { return '<span class="mvpas mvpas-etiquette">' + esc(c) + '</span>'; }).join('') + '</div>' : '') + '</div><div class="dgn-act" style="display:flex;gap:8px;flex-wrap:wrap">' + (e.act ? '<button type="button" class="mvbtn mvbtn-principal mvbtn-compact" data-dgn="labo" data-c="' + e.cuv + '">' + esc(e.act) + '</button>' : '') + '<button type="button" class="mvbtn mvbtn-secondaire mvbtn-compact" data-dgn="ouvrir" data-v="' + e.cuv + '">Ouvrir le diagnostic</button></div></div>';
  }
  h += '<section class="mvcarte" aria-label="À traiter maintenant"><h2 class="dgn-sec-t">À traiter maintenant <span>' + now.length + ' point' + (now.length > 1 ? 's' : '') + '</span></h2>' + (now.length ? now.map(ligne).join('') : '<p class="dgn-vide">Aucun point à traiter aujourd’hui.</p>') + '</section>';
  h += '<section class="mvcarte" aria-label="À venir"><h2 class="dgn-sec-t">Dans les 60 jours <span>' + later.length + ' date' + (later.length > 1 ? 's' : '') + '</span></h2>' + (later.length ? later.map(ligne).join('') : '<p class="dgn-vide">Rien de prévu dans les 60 jours.</p>') + '</section></div>';
  return h;
}

/* ════════ Comparer ════════ */
var MES = { av: { l: 'Hausse de l’acidité volatile en élevage', u: function () { return uAv(true) + ' par an'; }, uc: 'g/L par an', k: 2, max: 0.25, ticks: [0, 0.05, 0.1, 0.15, 0.2, 0.25] }, so2: { l: 'Baisse du SO2 libre entre deux sulfitages', u: function () { return 'mg/L par mois, entre deux sulfitages'; }, uc: 'mg/L par mois', k: 1, max: 7, ticks: [0, 1, 2, 3, 4, 5, 6, 7] }, anges: { l: 'Part des anges', u: function () { return '% du volume par an'; }, uc: 'point par an', k: 1, max: 6, ticks: [0, 1, 2, 3, 4, 5, 6] } };
var AXE = { neuf: { l: 'Part de fûts neufs', num: true, min: 0, max: 60, k: 0, pas: 10, pasL: '10 % de fûts neufs en plus', suf: ' %' }, age: { l: 'Âge moyen des fûts', num: true, min: 0, max: 4, k: 0, pas: 1, pasL: 'un vin de plus', suf: ' vin' }, tonn: { l: 'Tonnelier', num: false, cats: ['A', 'B', 'C'] }, mil: { l: 'Millésime', num: false, cats: [2023, 2024, 2025] } };
function cmpModele() {
  var C = S.cmp, m = MES[C.mes], a = AXE[C.axe];
  var all = CMP.filter(function (r) { return (C.coul === 'tous' || r.coul === C.coul) && r[C.mes] != null; });
  dgnEchelles(all, m, a, C);
  var hors = 0, pts = all.filter(function (r) { if (C.axe === 'tonn' && !r.tonn) { hors++; return false; } if (a.num && r[C.axe] == null) return false; return true; });
  var calc = pts.filter(function (r) { return !(C.ecart && r.alerte); });
  var val = function (r) { return C.mes === 'av' ? avU(r.av) : r[C.mes]; };
  var res = { m: m, a: a, pts: pts, val: val, verdict: '', detail: '', trend: null, groups: null };
  if (a.num) {
    var n = calc.length;
    if (n >= 3) {
      var mx = 0, my = 0; calc.forEach(function (r) { mx += r[C.axe]; my += val(r); }); mx /= n; my /= n;
      var sxy = 0, sxx = 0, syy = 0; calc.forEach(function (r) { sxy += (r[C.axe] - mx) * (val(r) - my); sxx += Math.pow(r[C.axe] - mx, 2); syy += Math.pow(val(r) - my, 2); });
      var b = sxx ? sxy / sxx : 0, r2 = (sxx && syy) ? sxy * sxy / (sxx * syy) : 0;
      res.trend = { b: b, y0: my + b * (a.min - mx), y1: my + b * (a.max - mx) };
      var mils = {}; calc.forEach(function (r) { mils[r.mil] = 1; });
      var force = r2 >= 0.5 ? 'Tendance nette' : (r2 >= 0.2 ? 'Tendance faible' : 'Aucune tendance');
      res.verdict = force + (n < 10 && r2 >= 0.2 ? ', à confirmer' : '') + ' : ' + sg(b * a.pas, m.k + 1) + ' ' + m.uc + ' pour ' + a.pasL + '.';
      res.detail = 'Base : ' + n + ' cuvées, ' + Object.keys(mils).length + ' millésimes' + (C.ecart && pts.some(function (r) { return r.alerte; }) ? ', hors cuvée en alerte.' : '.');
    } else res.verdict = 'Effectif insuffisant pour dégager une tendance.';
  } else {
    res.groups = a.cats.map(function (c) { var rs = pts.filter(function (r) { return (C.axe === 'tonn' ? r.tonn : r.mil) === c; }), rc = rs.filter(function (r) { return !(C.ecart && r.alerte); }); return { c: c, rs: rs, n: rc.length, moy: rc.length ? rc.reduce(function (s2, r) { return s2 + val(r); }, 0) / rc.length : null }; });
    var petit = res.groups.some(function (g) { return g.n < 4; });
    res.verdict = petit ? 'Effectifs insuffisants pour conclure : au moins 4 cuvées par groupe sont nécessaires (ici ' + res.groups.map(function (g) { return g.n; }).join(', ') + ').' : 'Moyennes par groupe sur le graphique.';
    if (C.axe === 'tonn') res.detail = 'Les tonneliers ne sont pas utilisés sur les mêmes vins. ' + res.groups.map(function (g) { var u = {}; g.rs.forEach(function (r) { u[r.nom] = 1; }); return g.c + ' : ' + (Object.keys(u).join(', ') || 'aucune cuvée'); }).join(' ; ') + '. Seules sont retenues les cuvées dont au moins 70 % des fûts viennent d’un même tonnelier' + (hors ? ' (' + hors + ' exclues).' : '.');
    else res.detail = 'Un millésime fait varier plusieurs facteurs à la fois (vendange, pH, conditions de cave) : la comparaison reste descriptive.';
  }
  var u = {}; all.filter(function (r) { return r.neuf >= 40; }).forEach(function (r) { u[r.nom] = 1; });
  res.prudence = 'Une corrélation n’est pas une cause : les fûts neufs vont souvent aux meilleures cuvées (ici, 40 % de neufs ou plus : ' + (Object.keys(u).join(', ') || 'aucune') + '). Un écart peut venir du vin autant que du bois.';
  var al = pts.filter(function (r) { return r.alerte; }).map(function (r) { return r.nom + ' ' + r.mil; });
  res.alerte = al.length ? al.join(', ') + (al.length > 1 ? ' s’écartent' : ' s’écarte') + ' nettement (cercle rouge) : signal propre au vin, non attribuable aux fûts. ' + (C.ecart ? 'Exclu' + (al.length > 1 ? 's' : '') + ' du calcul.' : 'Inclus dans le calcul.') : '';
  return res;
}
function vueComparer() {
  var C = S.cmp, R = cmpModele();
  var h = '<div class="dgn-cmp-ctl"><label>Indicateur' + seg([['av', 'Hausse de l’acidité volatile'], ['so2', 'Baisse du SO2 libre'], ['anges', 'Part des anges']], 'cmp-mes', C.mes, '', 'Indicateur') + '</label>';
  h += '<label>Critère' + seg([['neuf', 'Part de fûts neufs'], ['age', 'Âge des fûts'], ['tonn', 'Tonnelier'], ['mil', 'Millésime']], 'cmp-axe', C.axe, '', 'Critère') + '</label>';
  h += '<label>Couleur' + seg([['rouge', 'Rouges'], ['blanc', 'Blancs'], ['tous', 'Toutes']], 'cmp-coul', C.coul, '', 'Couleur') + '</label>';
  h += '<button type="button" class="dgn-interr" data-dgn="cmp-ecart" aria-pressed="' + C.ecart + '"><span class="dgn-sw" aria-hidden="true"></span>Exclure la cuvée en alerte</button></div>';
  h += '<div class="dgn-cmp-g"><section class="mvcarte" aria-label="Graphique"><div class="dgn-carte-tete"><h2>' + esc(R.m.l) + ' selon ' + esc(R.a.l.charAt(0).toLowerCase() + R.a.l.slice(1)) + '</h2><span style="font-size:var(--pt-micro,12px);color:var(--texte-doux)">' + esc(R.m.u()) + '</span></div><div id="dgn-cmpg" style="padding:4px 12px 12px"></div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:6px 16px;padding:0 16px 14px;font-size:var(--pt-micro,12px);color:var(--texte-med)"><span style="display:inline-flex;align-items:center;gap:6px"><i class="dgn-puce" style="background:var(--accent)"></i>Rouge</span><span style="display:inline-flex;align-items:center;gap:6px"><i class="dgn-puce" style="background:var(--or)"></i>Blanc</span><span style="display:inline-flex;align-items:center;gap:6px"><i class="dgn-puce" style="background:var(--bg-card);border:2px solid var(--danger)"></i>Cuvée en alerte</span><span style="display:inline-flex;align-items:center;gap:6px"><i style="width:18px;border-top:2px dashed var(--accent-texte)"></i>Tendance (numérique) ou moyenne (groupe)</span></div></section>';
  h += '<aside class="mvcarte dgn-insight" aria-label="Lecture"><h3>Lecture</h3><p class="dgn-verdict">' + esc(R.verdict) + '</p>' + (R.detail ? '<p>' + esc(R.detail) + '</p>' : '') + (R.alerte ? '<p class="dgn-note dgn-note-dan">' + esc(R.alerte) + '</p>' : '') + '<div class="dgn-note"><h3 style="margin:0 0 4px">Prudence</h3><p>' + esc(R.prudence) + '</p><p style="margin-top:6px">Deux fûts d’un même lot de bois peuvent faire évoluer un même vin différemment : sur trois cuvées, un écart peut relever du hasard.</p></div></aside></div>';
  var rows = R.pts.slice().sort(function (p, q) { return R.val(q) - R.val(p); }).map(function (r) { return '<tr><td><b>' + esc(r.nom) + '</b></td><td>' + r.mil + (r.enCours ? ', en cours' : '') + '</td><td>' + r.neuf + ' %</td><td>' + (r.age != null ? nf(r.age, 1) : '—') + '</td><td>' + (r.tonn ? esc(r.tonn) + ' (' + r.dom + ' %)' : 'plusieurs tonneliers') + '</td><td style="font-weight:700;color:' + (r.alerte ? 'var(--danger-texte)' : 'var(--texte)') + '">' + nf(R.val(r), R.m.k) + '</td></tr>'; }).join('');
  h += '<section class="mvcarte" style="margin-top:16px" aria-label="Cuvées comparées"><h2 class="dgn-sec-t">Les cuvées comparées</h2><div class="dgn-defile" style="padding:0 16px 12px"><table class="dgn-tab"><thead><tr><th>Cuvée</th><th>Millésime</th><th>Part de fûts neufs</th><th>Âge moyen (vins)</th><th>Tonnelier</th><th>' + esc(R.m.l) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  return h;
}
function renderCmpGraph() {
  var host = $('dgn-cmpg'); if (!host) return;
  var W = host.clientWidth; if (W < 120) return;
  var R = cmpModele(), G = 46, PW = W - G - 16, H = W < 560 ? 240 : 300, top = 10, bot = H - 30;
  function Y(v) { return top + (1 - Math.min(v, R.m.max) / R.m.max) * (bot - top); }
  var s = '<svg width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(R.verdict) + '">';
  R.m.ticks.forEach(function (v) { var y = Y(v).toFixed(1); s += '<line x1="' + G + '" x2="' + (G + PW) + '" y1="' + y + '" y2="' + y + '" style="stroke:var(--ligne)"/><text x="' + (G - 6) + '" y="' + (+y + 4) + '" text-anchor="end" font-size="11" style="fill:var(--texte-doux)">' + nf(v, R.m.k) + '</text>'; });
  var pts = [];
  if (R.a.num) {
    var X = function (v) { return G + (v - R.a.min) / (R.a.max - R.a.min) * PW; };
    for (var v = R.a.min; v <= R.a.max + 1e-9; v += R.a.pas) s += '<text x="' + X(v).toFixed(1) + '" y="' + (bot + 18) + '" text-anchor="' + (v === R.a.min ? 'start' : (v + R.a.pas > R.a.max + 1e-9 ? 'end' : 'middle')) + '" font-size="11" style="fill:var(--texte-doux)">' + nf(v, R.a.k) + R.a.suf + '</text>';
    if (R.trend) s += '<line x1="' + G + '" x2="' + (G + PW) + '" y1="' + Y(Math.max(0, R.trend.y0)).toFixed(1) + '" y2="' + Y(Math.max(0, R.trend.y1)).toFixed(1) + '" style="stroke:var(--accent-texte);stroke-width:2;stroke-dasharray:6 4"/>';
    R.pts.forEach(function (r) { pts.push({ x: X(r[S.cmp.axe]), y: Y(R.val(r)), r: r }); });
  } else {
    var w = PW / R.a.cats.length;
    R.groups.forEach(function (g, i) {
      var cx = G + w * i + w / 2;
      s += '<text x="' + cx.toFixed(1) + '" y="' + (bot + 18) + '" text-anchor="middle" font-size="11" style="fill:var(--texte-doux)">' + esc(String(g.c)) + ' (' + g.n + ')</text>';
      if (g.moy != null) s += '<line x1="' + (cx - w * 0.32).toFixed(1) + '" x2="' + (cx + w * 0.32).toFixed(1) + '" y1="' + Y(g.moy).toFixed(1) + '" y2="' + Y(g.moy).toFixed(1) + '" style="stroke:var(--accent-texte);stroke-width:2;stroke-dasharray:6 4"/>';
      g.rs.forEach(function (r, j) { pts.push({ x: cx + (j - (g.rs.length - 1) / 2) * Math.min(26, w / (g.rs.length + 1)), y: Y(R.val(r)), r: r }); });
    });
  }
  s += '<line x1="' + G + '" x2="' + (G + PW) + '" y1="' + bot + '" y2="' + bot + '" style="stroke:var(--ligne-forte)"/>';
  var places = [];
  pts.slice().sort(function (a, b) { return a.x - b.x; }).forEach(function (p) {
    var ly = p.y + 4, essai = 0;
    while (essai < 6 && places.some(function (q) { return Math.abs(q.x - p.x) < 44 && Math.abs(q.y - ly) < 12; })) { ly -= 13; essai++; }
    places.push({ x: p.x, y: ly }); p.ly = ly;
  });
  pts.forEach(function (p) {
    var r = p.r, c = r.coul === 'blanc' ? 'var(--or)' : 'var(--accent)';
    s += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="6" style="fill:' + (r.alerte ? 'var(--bg-card)' : c) + ';stroke:' + (r.alerte ? 'var(--danger)' : c) + ';stroke-width:2"><title>' + esc(r.nom + ' ' + r.mil + ' : ' + nf(R.val(r), R.m.k)) + '</title></circle>';
  });
  pts.forEach(function (p) { s += '<text x="' + (p.x + 9).toFixed(1) + '" y="' + p.ly.toFixed(1) + '" font-size="11" font-weight="600" style="fill:var(--texte-med);paint-order:stroke;stroke:var(--bg-card);stroke-width:3px">' + p.r.c + ' ' + String(p.r.mil).slice(2) + '</text>'; });
  host.innerHTML = dgnTypo(s + '</svg>');
}

/* ════════ Panneau latéral : réglages et aide ════════ */
var AIDE = [
  ['Fermentation alcoolique', [
    ['Densité, chaque jour', 'détecter tôt un ralentissement', 'oui'],
    ['Température de la cuve', 'au-delà de 30 à 32 °C, risque d’arrêt de fermentation', 'oui'],
    ['Degré probable et azote assimilable', 'plus le degré probable est élevé, plus les levures ont besoin d’azote', 'oui'],
    ['Sucres résiduels en fin de FA', 'fermentation achevée sous 2 g/L', 'oui']]],
  ['Fermentation malolactique', [
    ['Acide malique', 'suivre l’avancement de la malo', 'oui'],
    ['TAV, pH, SO2 total', 'freins de la malo, qui s’additionnent', 'oui'],
    ['Température du chai', 'en dessous de 16 °C, la malo ralentit', 'oui']]],
  ['Élevage', [
    ['Acidité volatile', 'piqûre acétique, Brettanomyces, bactéries lactiques', 'oui'],
    ['SO2 libre, SO2 total et pH', 'SO2 actif (protection) et SO2 combiné', 'oui'],
    ['Sucres résiduels', 'substrat des Brettanomyces', 'oui'],
    ['Acidité totale et pH', 'baisse d’acidité en cas de tourne', 'oui'],
    ['Éthylphénols (4-EP, 4-EG)', 'confirmation des Brettanomyces (seuil de perception : 400 µg/L)', 'oui'],
    ['Acétate d’éthyle', 'confirmation d’une piqûre acétique (seuil de perception : 150 mg/L)', 'oui'],
    ['Éthanal', 'oxydation, levures de voile (seuil de perception : 100 mg/L)', 'oui'],
    ['Contrôle au nez, fût par fût', 'localiser le fût en cause', 'oui'],
    ['Fleur en surface', 'présence d’air au-dessus du vin', 'oui'],
    ['Ouillages, soutirages à l’air', 'apports d’oxygène', 'oui']]],
  ['Mise en bouteille', [
    ['SO2 libre, SO2 total et pH', 'protection du vin en bouteille', 'oui'],
    ['Sucres et acide malique', 'prévenir une reprise de fermentation en bouteille', 'oui'],
    ['Oxygène dissous', 'oxygène total en bouteille : de l’ordre de 1 mg/L', 'oui'],
    ['Tests de stabilité, turbidité', 'prévenir cristaux et troubles', 'oui'],
    ['Contrôle des Brettanomyces en cas de doute', 'décider d’une filtration', 'oui']]]
];
function renderTiroir() {
  var T = $('dgn-tiroir'), V = $('dgn-voile'), on = !!S.tiroir || !!S.fen;
  V.classList.toggle('dgn-on', on);
  T.classList.toggle('dgn-on', !!S.tiroir); T.setAttribute('aria-hidden', String(!S.tiroir));
  if (!S.tiroir) return;
  var h = '';
  if (S.tiroir === 'aide') {
    h += '<div class="dgn-tiroir-t"><h2>Méthode du diagnostic</h2><button type="button" class="mvbtn mvbtn-discret mvbtn-icone mvbtn-bureau" data-dgn="fermer" aria-label="Fermer">' + ico('fermer') + '</button></div><div class="dgn-tiroir-c"><p class="dgn-intro">L’onglet Diagnostic ne comporte aucune saisie : il croise les données déjà enregistrées dans Cuvées, Bouteilles et Labo.</p><div class="dgn-reg"><h3>Lecture des statuts</h3><ul class="dgn-aide dgn-statuts">' + [['dan', 'Signes forts', 'au moins deux indices principaux concordants'], ['att', 'Signes modérés', 'un indice principal, appuyé par d’autres indices'], ['n', 'Signe isolé', 'un indice principal seul'], ['ok', 'Aucun signe', 'aucun indice principal relevé'], ['n', 'Non évaluable', 'données manquantes ou trop anciennes']].map(function (s) { return '<li>' + pill([s[0], s[1]]) + '<span>' + s[2] + '</span></li>'; }).join('') + '</ul><p class="dgn-petit">Un statut décrit des indices, pas une certitude : il oriente les contrôles et l’analyse de confirmation. Une analyse de confirmation au-dessus du seuil de perception compte comme un indice fort ; en dessous, elle empêche « Signes forts ».</p></div><h3 class="dgn-aide-t">Ce qui est surveillé, étape par étape</h3>';
    AIDE.forEach(function (et) {
      h += '<div class="dgn-reg"><h3>' + esc(et[0]) + '</h3><ul class="dgn-aide">' + et[1].map(function (l) {
        var tag = l[2] === 'oui' ? '<span class="dgn-src dgn-src-cuvees">Déjà saisi</span>' : (l[2] === 'azote' ? '<span class="dgn-src dgn-src-nouveau">Azote : nouveau champ</span>' : (l[2] === 'air' ? '<span class="dgn-src dgn-src-nouveau">« À l’air » : nouveau champ</span>' : '<span class="dgn-src dgn-src-nouveau">Nouveau champ</span>'));
        return '<li><div><b>' + esc(l[0]) + '</b><span>' + esc(l[1]) + '</span></div>' + tag + '</li>';
      }).join('') + '</ul></div>';
    });
    T.innerHTML = typo(h + '</div>'); return;
  }
  var st = S.set, phs = [3.3, 3.4, 3.5, 3.6, 3.7].map(function (ph) { var f = 1 + Math.pow(10, ph - PKA); return '<tr><td>' + nf(ph, 1) + '</td><td><b>' + nf(st.objR * f, 0) + '</b> mg/L</td><td><b>' + nf(st.objB * f, 0) + '</b> mg/L</td></tr>'; }).join('');
  h += '<div class="dgn-tiroir-t"><h2>Réglages du diagnostic</h2><button type="button" class="mvbtn mvbtn-discret mvbtn-icone mvbtn-bureau" data-dgn="fermer" aria-label="Fermer">' + ico('fermer') + '</button></div><div class="dgn-tiroir-c">';
  h += '<div class="dgn-reg"><h3>Unité de la volatile</h3><p>Celle de vos rapports de laboratoire. Les valeurs attendues et le seuil suivent.</p>' + seg([['h2so4', 'En H2SO4'], ['acet', 'En acide acétique']], 'set-unite', st.unite, '', 'Unité') + '<p class="dgn-petit">0,60 g/L en H2SO4 = 0,74 g/L en acide acétique.</p></div>';
  h += '<div class="dgn-reg"><h3>Objectif de SO2 actif</h3><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="width:56px;font-size:var(--pt-txt,13px);color:var(--texte-med)">Rouges</span>' + seg([[0.5, '0,5'], [0.6, '0,6'], [0.7, '0,7'], [0.8, '0,8']], 'set-objR', st.objR, '', 'Rouges') + '</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="width:56px;font-size:var(--pt-txt,13px);color:var(--texte-med)">Blancs</span>' + seg([[0.6, '0,6'], [0.7, '0,7'], [0.8, '0,8']], 'set-objB', st.objB, '', 'Blancs') + '</div><p>SO2 libre nécessaire selon le pH :</p><table class="dgn-tab"><thead><tr><th>pH</th><th>Rouges</th><th>Blancs</th></tr></thead><tbody>' + phs + '</tbody></table></div>';
  h += '<div class="dgn-reg"><h3>Solution de SO2 du Chai</h3><p>Sa force convertit les doses du soutirage (cL ou mL par fût) en mg/L : rendement des sulfitages et dose estimée.</p>' + seg([['', 'Non réglée'], [5, '5 %'], [6, '6 %'], [8, '8 %'], [10, '10 %'], [18, '18 %']], 'set-sol', st.solution == null ? '' : st.solution, '', 'Solution de SO2') + '</div>';
  h += '<div class="dgn-reg"><h3>Seuil d’alerte de la volatile</h3><div class="dgn-pas"><button type="button" class="mvbtn mvbtn-secondaire mvbtn-icone mvbtn-bureau" data-dgn="set-seuil" data-v="-1" aria-label="Baisser">−</button><output>' + nf(avU(st.seuil), 2) + '</output><button type="button" class="mvbtn mvbtn-secondaire mvbtn-icone mvbtn-bureau" data-dgn="set-seuil" data-v="1" aria-label="Monter">+</button><span style="font-size:var(--pt-txt,13px);color:var(--texte-med)">' + uAv(false) + '</span></div></div>';
  h += '<div class="dgn-reg"><h3>Références du domaine</h3><p>' + (REFS.n >= 3 ? 'Médianes calculées sur ' + REFS.n + ' cuvées du domaine sorties de la malo, hors cuvée en alerte' : 'Pas encore assez de cuvées sorties de la malo : valeurs de référence') + ' ; elles servent à repérer les écarts.</p><table class="dgn-tab"><tbody><tr><td>Volatile en élevage</td><td><b>' + sg(avU(USUEL_AV), 3) + '</b> par mois</td></tr><tr><td>SO2 libre perdu, rouges</td><td><b>−' + nf(USUEL_SO2.rouge, 1) + '</b> mg/L par mois</td></tr><tr><td>SO2 libre perdu, blancs</td><td><b>−' + nf(USUEL_SO2.blanc, 1) + '</b> mg/L par mois</td></tr><tr><td>SO2 combiné</td><td><b>' + sg(USUEL_LIE, 1) + '</b> mg/L par mois</td></tr></tbody></table></div>';
  T.innerHTML = typo(h + '</div>');
}

/* ════════ Demande au labo ════════ */
function renderFen() {
  var F = $('dgn-fen'); F.classList.toggle('dgn-on', !!S.fen); F.setAttribute('aria-hidden', String(!S.fen));
  if (!S.fen) return;
  var M = MOD[S.fenCuv || S.cuv], D = M.D, dg = diagnostic(M);
  var X = dgnDemande(M, dg), foc = X.foc, anas = X.anas, brett = X.brett, nz = X.nz;
  var h = '<div class="dgn-fen-t"><h2>Demande d’analyse</h2><button type="button" class="mvbtn mvbtn-discret mvbtn-icone mvbtn-bureau" data-dgn="fermer" aria-label="Fermer">' + ico('fermer') + '</button></div><div class="dgn-fen-c">';
  h += '<div class="dgn-recap"><b>' + esc(D.nom + ' ' + D.mil) + '</b><span>' + esc(dg.titre || (dg.vieux ? 'Analyse trop ancienne' : 'Contrôle')) + '</span></div>';
  h += '<div class="dgn-f"><span>Prélèvement</span><p class="dgn-ligne-f">Échantillon moyen de la cuvée (habituel).</p>';
  if (nz && nz.fut) h += '<button type="button" class="dgn-choix" data-dgn="fut-suspect" aria-pressed="' + S.op.futSuspect + '"><span class="dgn-case">' + (S.op.futSuspect ? ico('valide', 'ico-s') : '') + '</span><span>Ajouter un échantillon du ' + esc(nz.fut) + ' seul<small>' + pt('Nez relevé le ' + fd(t(nz.d))) + ' Permet de décider d’un éventuel retrait du fût.</small></span></button>';
  h += '</div><div class="dgn-f"><span>Analyses demandées</span><div class="dgn-chips2">' + anas.map(function (a) { return '<span class="mvpas mvpas-etiquette">' + esc(a) + '</span>'; }).join('') + '</div></div>';
  if (brett) h += '<button type="button" class="dgn-choix" data-dgn="tppv" aria-pressed="' + S.op.tppv + '"><span class="dgn-case">' + (S.op.tppv ? ico('valide', 'ico-s') : '') + '</span><span>Ajouter le potentiel en phénols volatils<small>Estime la quantité maximale d’éthylphénols que les Brett pourraient produire dans ce vin.</small></span></button>';
  h += '<p class="dgn-petit">Demande préparée à partir du diagnostic, à partager ou copier dans votre message au labo. Une fois saisis dans l’onglet Labo, les résultats mettent le diagnostic à jour.</p></div><div class="dgn-fen-p"><button type="button" class="mvbtn mvbtn-secondaire mvbtn-bureau" data-dgn="fermer">Annuler</button><button type="button" class="mvbtn mvbtn-principal mvbtn-bureau" data-dgn="envoyer">Préparer la demande</button></div>';
  F.innerHTML = typo(h);
}

/* ════════ Événements ════════ */
function dgnClic(e) {
  var b = e.target.closest('[data-dgn]'); if (!b) return;
  var a = b.getAttribute('data-dgn'), v = b.getAttribute('data-v');
  switch (a) {
    case 'vue': S.vue = v; S.detail = false; break;
    case 'cuv': S.cuv = v; S.tuile = null; S.sel = null; S.selIdx = null; S.tab = null; S.focus = null; S.detail = true; window.scrollTo(0, 0); break;
    case 'retour': S.detail = false; break;
    case 'fiche': if (typeof window.openCuveeDetail === 'function') window.openCuveeDetail(v, null, 'dgn'); return;   // CAVE-RANGE-2a (§450) : la fiche unique de la cuvée
    case 'filtre': S.filtre = v; break;
    case 'tuile': S.tuile = S.tuile === v ? null : v; break;
    case 'focus': S.focus = (v && S.focus !== v) ? v : null; break;
    case 'per': S.per = v; break;
    case 'lane': var o = offDe(S.cuv); o[v] = !o[v]; break;
    case 'proj': S.proj = !S.proj; break;
    case 'geste': S.selIdx = v.split(',').map(Number); S.sel = S.selIdx[0]; break;
    case 'tab': S.tab = v; render(); var pn = $('dgn-panneau'); if (pn) pn.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return;
    case 'ouvrir': S.vue = 'suivi'; S.cuv = v; S.tuile = null; S.sel = null; S.selIdx = null; S.tab = null; S.focus = null; S.detail = true; window.scrollTo(0, 0); break;
    case 'cmp-mes': S.cmp.mes = v; break;
    case 'cmp-axe': S.cmp.axe = v; break;
    case 'cmp-coul': S.cmp.coul = v; break;
    case 'cmp-ecart': S.cmp.ecart = !S.cmp.ecart; break;
    case 'reg': S.tiroir = 'reg'; break;
    case 'aide': S.tiroir = 'aide'; break;
    case 'fermer': S.tiroir = null; S.fen = null; break;
    case 'set-unite': case 'set-objR': case 'set-objB': case 'set-seuil': case 'set-sol':
      if (!dgnPeutRegler()) { toast('Réglage réservé à l’administrateur'); return; }
      if (a === 'set-unite') S.set.unite = v; else if (a === 'set-objR') S.set.objR = +v; else if (a === 'set-objB') S.set.objB = +v; else if (a === 'set-sol') S.set.solution = (v === '' ? null : +v);
      else if (a === 'set-seuil') S.set.seuil = Math.max(0.3, Math.min(0.98, Math.round((S.set.seuil + (+v) * 0.02) * 100) / 100));
      dgnEnregistrer('Réglage du diagnostic enregistré'); break;
    case 'labo': S.fen = 'labo'; S.fenCuv = b.getAttribute('data-c') || null; break;
    case 'fut-suspect': S.op.futSuspect = !S.op.futSuspect; break;
    case 'tppv': S.op.tppv = !S.op.tppv; break;
    case 'envoyer': dgnEnvoyer(); S.fen = null; break;
    case 'go-labo': S.tiroir = null; S.fen = null; renderTiroir(); renderFen(); if (typeof window.switchCaveOng === 'function') window.switchCaveOng('labo'); return;
    case 'go-cuv': S.tiroir = null; S.fen = null; renderTiroir(); renderFen(); if (typeof window.switchCaveOng === 'function') window.switchCaveOng('cuv'); return;
    case 'toast': toast(v || 'Hors de cette maquette.'); return;
    default: return;
  }
  render();
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (S.tiroir || S.fen)) { S.tiroir = null; S.fen = null; render(); } });
function dgnSaisie(e) { if (e.target && e.target.id === 'dgn-q') { S.q = e.target.value; var l = document.querySelector('.dgn-liste'); if (l) { l.innerHTML = typo(listeHtml()); var q = $('dgn-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); } } }
var dernierW = 0;
window.addEventListener('resize', function () { var w = window.innerWidth; if (Math.abs(w - dernierW) < 2) return; dernierW = w; var r = $(DGN_ROOT); if (!r || !r.offsetParent || !$('dgn-vue')) return; renderFrise(); renderCmpGraph(); });

window.renderCaveDiag = render;
// ★★ CAVEPIL-1 (§436) — LE DIAGNOSTIC EN LECTURE, pour le verdict de la Cave et la vue Cave du Pilotage. Même calcul que
//   l'onglet (recalc puis statutListe), sans rien dessiner, sur TOUTES les cuvées (le filtre de millésime du Chai ne s'applique
//   pas ici). g : dan (signes forts), att, n, ok — la lecture des statuts de la méthode. nAna : les analyses du labo lues.
// CAVE-RANGE-2a (§450) : depuis la fiche unique d'une cuvée, ouvrir son diagnostic (Chai › Diagnostic, la cuvée choisie).
window._dgnVoirCuvee = function (id) {
  S.vue = 'suivi'; S.cuv = String(id); S.tuile = null; S.sel = null; S.tab = null; S.detail = true;
  if (typeof window.switchCaveOng === 'function') window.switchCaveOng('diag'); else render();
};
window._dgnSynthese = function () {
  if (!window._dataReady || !window.CAVE_ELEVAGE) return [];
  recalc();
  return ((window.CAVE_ELEVAGE.cuvees) || []).filter(function (c) { return c && c.id != null && MOD[String(c.id)]; }).map(function (c) {
    var M = MOD[String(c.id)], st = statutListe(M), D = M.D || {};
    return { id: String(c.id), nom: D.nom || c.nom || '', mil: D.mil != null ? D.mil : c.millesime, g: st.g, txt: st.txt || '', mise: !!M.miseMs, nAna: Array.isArray(D.ana) ? D.ana.length : 0 };
  });
};
