// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — jalons.js — ★★ JALONS-1 (§340) : LE CALCUL DES JALONS ET LEUR MÉMOIRE
// ═══════════════════════════════════════════════════════════════════════════
// Décisions de Nico (maquette GRATIF, 15/10, bloc GRATIF-0 du §28) : des jalons et des paliers, jamais de
// classement, de vitesse ni de quantité épandue. Ils se gagnent sur ce que l'appli sait déjà — le journal, les
// sessions du tracteur, les opérations du Chai — plus un compteur d'ouvertures (une au plus par demi-journée).
// Un jalon gagné reste gagné. La mémoire est un document par personne, `jalons_<uid>`, qu'elle seule lit et
// écrit (firestore.rules, règle 6) : ni l'administrateur du domaine, ni un collègue.
// JALONS-2 (§341) les montre : une ligne « Nouveau jalon » dans la feuille qui suit une validation, et « Mes jalons » dans « Ma trace ».
// COEQ-1 (§343) : le coéquipier d'une session (tarière, ensemencement, engrais) compte ses trous et ses hectares ;
//   les sessions et les kilomètres enjambés restent au conducteur.

// ── JALONS-1 : début du bloc exécutable (lu et joué tel quel par mv-harnais-jalons) ──
const MV_JALONS_SERIES = [
  { id: 'ouv',   t: 'Ouvertures de l’appli',  seuils: [1, 10, 25, 50, 100, 250, 500, 1000] },
  { id: 'val',   t: 'Validations',            seuils: [1, 10, 25, 50, 100, 250, 500, 1000] },
  { id: 'km',    t: 'Kilomètres de rangs',    seuils: [1, 42.195, 60, 100] },
  { id: 'pieds', t: 'Pieds travaillés',       seuils: [10000, 100000] },
  { id: 'ses',   t: 'Sessions de tracteur',   seuils: [1, 10, 25, 50, 100, 250] },
  { id: 'kmtr',  t: 'Kilomètres enjambés',    seuils: [100, 500] },
  { id: 'trous', t: 'Trous de tarière',       seuils: [1, 10, 100, 250, 500, 1000, 2000, 5000, 10000] },
  { id: 'sem',   t: 'Hectares semés',         seuils: [1, 5, 10, 25, 50, 100, 250, 500] },
  { id: 'eng',   t: 'Hectares d’engrais',     seuils: [1, 5, 10, 25, 50, 100, 250, 500] },
  { id: 'ouil',  t: 'Ouillages',              seuils: [1, 10, 25, 50, 100, 250] },
  { id: 'sout',  t: 'Soutirages',             seuils: [1, 5, 10, 25, 50] },
  { id: 'degu',  t: 'Dégustations',           seuils: [1] },
  { id: 'an',    t: 'Années au domaine',      seuils: [1] },
];
function _mvJalSlug(x) {
  return String(x == null ? '' : x).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function _mvJalDemiJournee(d) {
  var x = d || new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
  return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) + (x.getHours() < 13 ? '|am' : '|pm');
}
// D = { journal, sessions, activites, parcelles, cave, membres, ouv, vigne, aujourdhui } — tout est passé :
// rien n'est lu sur window ici, ce qui permet au harnais de jouer le calcul sur des données inventées.
function _mvJalonsCompteurs(nom, D) {
  D = D || {};
  var c = { ouv: (D.ouv | 0), val: 0, km: 0, pieds: 0, ses: 0, kmtr: 0, trous: 0, sem: 0, eng: 0, ouil: 0, sout: 0, degu: 0, an: 0, haTache: {} };
  if (!nom) return c;
  var parc = {};
  (D.parcelles || []).forEach(function (p) { if (p && p.nom) parc[p.nom] = p; });
  var rang = D.vigne ? (parseFloat(D.vigne.ec_rang) || 0) : 0, phaHa = D.vigne ? (parseFloat(D.vigne.pieds) || 0) : 0;
  var geo = function (n) {
    var p = parc[n]; if (!p) return null;
    var ha = parseFloat(p.surface) || 0;
    return { ha: ha, km: rang > 0 ? ha * 10 / rang : 0, pieds: phaHa > 0 ? ha * phaHa : 0 };   // 1 ha = 10 000 m² : 10 000 / rang mètres = 10 / rang km
  };
  var vus = {};
  (D.journal || []).forEach(function (j) {
    if (!j || j.meteo || j.statut !== 'Validé') return;                    // « ↩ » passe l'entrée en « Annulé » : elle sort du compte
    var eq = [];
    if (j.qui) eq.push(j.qui);
    (j.membresEquipe || []).forEach(function (n) { if (n && eq.indexOf(n) < 0) eq.push(n); });
    if (eq.indexOf(nom) < 0) return;
    var cle = [j.parcelle, j.tache, j.date, j.passage || j.niveau || ''].join('|');
    if (vus[cle]) return;                                                  // valider deux fois ne rapporte rien
    vus[cle] = 1;
    c.val++;
    var g = geo(j.parcelle); if (!g) return;
    var part = 1 / eq.length;                                              // à plusieurs, chacun a fait sa part
    c.km += g.km * part; c.pieds += g.pieds * part;
    var t = _mvJalSlug(j.tache); if (t) c.haTache[t] = (c.haTache[t] || 0) + g.ha * part;
  });
  var acts = {};
  (D.activites || []).forEach(function (a) { if (a && a.nom) acts[a.nom] = a; });
  (D.sessions || []).forEach(function (s) {
    if (!s) return;
    var cond = s.conducteur === nom, coeq = s.coequipier === nom;          // COEQ-1 (§343) : le coéquipier compte aussi
    if (!cond && !coeq) return;
    if (cond && (s.statut === 'Terminé' || s.statut === 'Validé')) c.ses++;   // les sessions et les km enjambés : au conducteur
    var act = acts[s.activite] || {}, lab = (act.champCustom && act.champCustom.feedsPlantation) ? act.champCustom.label : null;
    var sl = _mvJalSlug(s.activite);
    (s.parcellesFaites || []).forEach(function (x) {
      var n = (x && typeof x === 'object') ? x.nom : x, g = geo(n);
      if (g) { if (cond) c.kmtr += g.km; if (sl === 'ensemencement' || sl === 'semis') c.sem += g.ha; if (sl === 'engrais') c.eng += g.ha; }
      if (lab && x && typeof x === 'object' && x.data) { var nb = parseInt(x.data[lab], 10) || 0; if (nb > 0) c.trous += nb; }
    });
  });
  ((D.cave && D.cave.operations) || []).forEach(function (o) {
    if (!o) return;
    var qui = (o.intervenants && o.intervenants.length) ? o.intervenants : (o.operateur ? [o.operateur] : []);
    if (qui.indexOf(nom) < 0) return;
    if (o.type === 'ouillage') c.ouil++; else if (o.type === 'soutirage') c.sout++; else if (o.type === 'degustation') c.degu++;
  });
  var m = (D.membres || []).find(function (x) { return x && x.nom === nom; });
  if (m && m.debut_contrat) {
    var d0 = new Date(m.debut_contrat), auj = D.aujourdhui || new Date();
    if (!isNaN(d0.getTime())) c.an = Math.max(0, Math.floor((auj - d0) / (365.25 * 86400000)));
  }
  c.km = Math.round(c.km * 1000) / 1000; c.kmtr = Math.round(c.kmtr * 1000) / 1000; c.pieds = Math.round(c.pieds);
  c.sem = Math.round(c.sem * 100) / 100; c.eng = Math.round(c.eng * 100) / 100;
  return c;
}
function _mvJalonsAtteints(c) {
  var out = [];
  MV_JALONS_SERIES.forEach(function (s) { var v = (c && c[s.id]) || 0; s.seuils.forEach(function (x) { if (v >= x) out.push(s.id + '.' + x); }); });
  Object.keys((c && c.haTache) || {}).forEach(function (t) { if (c.haTache[t] >= 1) out.push('ha1.' + t); });   // le premier hectare, tâche par tâche
  return out;
}
// Un jalon gagné reste gagné : la fusion n'enlève jamais rien, elle date ce qui arrive.
function _mvJalonsFusion(ancien, atteints, jour) {
  var g = Object.assign({}, (ancien && ancien.gagnes) || {}), nouveaux = [];
  (atteints || []).forEach(function (id) { if (!g[id]) { g[id] = jour; nouveaux.push(id); } });
  return { gagnes: g, nouveaux: nouveaux };
}
// Une ouverture compte au plus une fois par demi-journée (matin avant 13 h, après-midi ensuite).
function _mvJalonsOuverture(ouv, maintenant) {
  var o = { n: (ouv && (ouv.n | 0)) || 0, dern: (ouv && ouv.dern) || '' }, dj = _mvJalDemiJournee(maintenant);
  if (o.dern !== dj) { o.n++; o.dern = dj; return { ouv: o, compte: true }; }
  return { ouv: o, compte: false };
}
// ★★ JALONS-2 (§341) — LES MOTS DES JALONS : un titre et une phrase par palier, sobres (une appli professionnelle :
//   un trait d'humour, jamais de ridicule — Nico, 15/10). Aucun caractère hors de la police embarquée (pas de « œ », pas de « … »).
const MV_JALONS_PHRASES = {
  ouv: { 1: 'Bienvenue dans Ma Vigne.', 10: 'L’appli devient un réflexe.', 25: 'Vingt-cinq ouvertures : vous êtes chez vous.', 50: 'Le chemin de l’appli, vous le connaissez.', 100: 'L’appli fait partie de votre journée.', 250: 'Un outil du quotidien.', 500: 'Vous la connaissez sur le bout des doigts.', 1000: 'Mille ouvertures : merci de la faire vivre.' },
  val: { 1: 'Le journal du domaine commence avec vous.', 10: 'Dix parcelles validées.', 25: 'Le domaine avance avec vous.', 50: 'Le journal du domaine vous doit beaucoup.', 100: 'Cent validations.', 250: 'Un pilier du journal.', 500: 'Cinq cents validations.', 1000: 'Une saison entière, et plus.' },
  km: { 1: 'Le premier kilomètre de rangs, pas à pas.', 42.195: 'Un marathon, sans dossard mais en bottes.', 60: 'Une belle étape, à pied dans les rangs.', 100: 'Un ultra-trail, sécateur en main.' },
  pieds: { 10000: 'Chacun est passé entre vos mains.', 100000: 'Une forêt de ceps.' },
  ses: { 1: 'Votre première session au volant.', 10: 'Le tracteur vous connaît.', 25: 'Vingt-cinq sessions.', 50: 'Plus régulier que la météo.', 100: 'Cent sessions au volant.', 250: 'Une carrière d’enjambeur.' },
  kmtr: { 100: 'Cent kilomètres enjambés.', 500: 'Les rangs ont l’habitude de vous voir passer.' },
  trous: { 1: 'Le plus dur, c’est de commencer.', 10: 'Dix trous, dix futurs pieds.', 100: 'Et toujours droit dans le rang.', 250: 'Le terrain vous connaît, maintenant.', 500: 'Un petit clos en préparation.', 1000: 'De quoi planter un clos.', 2000: 'La tarière a pris l’habitude de vous.', 5000: 'Cinq mille pieds de demain, chacun à sa place.', 10000: 'Un hectare entier, trou par trou.' },
  sem: { 1: 'La terre vous dit merci.', 5: 'Le sol est content.', 10: 'Les rangs restent verts l’hiver.', 25: 'Le domaine verdit derrière vous.', 50: 'Cinquante hectares de couverts semés.', 100: 'Le sol en profite.', 250: 'La terre vous connaît bien.', 500: 'Une carrière en vert.' },
  eng: { 1: 'Le premier hectare nourri.', 5: 'La vigne a de quoi faire.', 10: 'Et pas un rang oublié.', 25: 'La bonne dose, au bon endroit.', 50: 'Épandus juste où il faut.', 100: 'Sans un gramme de trop.', 250: 'Un vrai nourricier de vignes.', 500: 'Le domaine a de bonnes racines.' },
  ouil: { 1: 'La part des anges, vous la rendez.', 10: 'Les fûts vous reconnaissent.', 25: 'Le chai n’a plus de secret pour vous.', 50: 'La part des anges n’a qu’à bien se tenir.', 100: 'Le chai vous doit beaucoup.', 250: 'Une vie de chai.' },
  sout: { 1: 'Le vin quitte ses lies : vous étiez là.', 5: 'Vous avez la main sûre.', 10: 'Dix fois le vin clair, grâce à vous.', 25: 'Le vin vous doit sa limpidité.', 50: 'Maître du soutirage.' },
  degu: { 1: 'Le vin que vous avez soigné, vous l’avez goûté.' },
  an: { 1: 'Merci.' },
};
function _mvJalNb(n) {   // 10000 → « 10 000 », avec l'espace insécable de la police (pas l'espace fine)
  var s = String(n), p = s.split('.'), e = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return p.length > 1 ? e + ',' + p[1] : e;
}
function _mvJalonLibelle(id, nomTache) {
  var k = String(id || ''), i = k.indexOf('.'), serie = k.slice(0, i), seuil = k.slice(i + 1), n = parseFloat(seuil);
  if (serie === 'ha1') return { titre: 'Premier hectare de ' + String(nomTache || seuil).toLowerCase(), phrase: 'Un hectare entier, à votre part.' };
  var un = (n === 1), nb = _mvJalNb(seuil);
  var T = {
    ouv: un ? 'Première ouverture' : nb + ' ouvertures', val: un ? 'Première validation' : nb + ' validations',
    km: n === 42.195 ? 'Le marathon des rangs' : (un ? 'Premier kilomètre de rangs' : nb + ' kilomètres de rangs'),
    pieds: nb + ' pieds', ses: un ? 'Première session de tracteur' : nb + ' sessions de tracteur', kmtr: nb + ' kilomètres enjambés',
    trous: un ? 'Premier trou de tarière' : nb + ' trous de tarière', sem: un ? 'Premier hectare semé' : nb + ' hectares semés',
    eng: un ? 'Premier hectare d’engrais' : nb + ' hectares d’engrais', ouil: un ? 'Premier ouillage' : nb + ' ouillages',
    sout: un ? 'Premier soutirage' : nb + ' soutirages', degu: 'Première dégustation', an: 'Un an au domaine',
  };
  var ph = (MV_JALONS_PHRASES[serie] || {})[seuil] || (MV_JALONS_PHRASES[serie] || {})[n] || '';
  return { titre: T[serie] || k, phrase: ph };
}
// Les prochains paliers, du plus proche au plus lointain (part déjà faite).
function _mvJalonsProchains(c, gagnes) {
  var out = [];
  MV_JALONS_SERIES.forEach(function (s) {
    var v = (c && c[s.id]) || 0;
    var x = s.seuils.find(function (y) { return !(gagnes && gagnes[s.id + '.' + y]) && v < y; });
    if (x == null || v <= 0) return;
    out.push({ id: s.id + '.' + x, titre: _mvJalonLibelle(s.id + '.' + x).titre, ratio: Math.min(1, v / x), reste: _mvJalNb(Math.round(v * 10) / 10) + ' sur ' + _mvJalNb(x) });
  });
  return out.sort(function (a, b) { return b.ratio - a.ratio; });
}
function _mvJalDateFr(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? (m[3] + '/' + m[2] + '/' + m[1]) : ''; }
// ★★ PRESENCE-1 (§344) — « TA PRÉSENCE EST NOTÉE » : les opérations du Chai où l'admin a coché la personne parmi les
//   intervenants (v4.33), récentes, enregistrées par quelqu'un d'autre (on ne se signale pas à soi-même).
function _mvCaveNotees(nom, operations, aujIso, jours) {
  if (!nom) return [];
  var lim = jours == null ? 3 : jours, t0 = Date.parse(String(aujIso || '').slice(0, 10) + 'T00:00:00Z');
  return (operations || []).filter(function (o) {
    if (!o || !o.id || !o.date) return false;
    var qui = (o.intervenants && o.intervenants.length) ? o.intervenants : (o.operateur ? [o.operateur] : []);
    if (qui.indexOf(nom) < 0) return false;
    if (o.operateur === nom) return false;
    var t = Date.parse(String(o.date).slice(0, 10) + 'T00:00:00Z');
    if (isNaN(t) || isNaN(t0)) return false;
    var d = Math.round((t0 - t) / 86400000);
    return d >= 0 && d <= lim;
  }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 2);
}
function _mvCaveTypeLib(type) {
  return ({ ouillage: 'l’ouillage', soutirage: 'le soutirage', soufre: 'le sulfitage', filtration: 'la filtration', traitement: 'le traitement',
            degustation: 'la dégustation', analyse: 'l’analyse', assemblage: 'l’assemblage' })[type] || 'une opération';
}
function _mvCaveQuand(dateIso, aujIso) {
  var t = Date.parse(String(dateIso || '').slice(0, 10) + 'T00:00:00Z'), t0 = Date.parse(String(aujIso || '').slice(0, 10) + 'T00:00:00Z');
  var d = Math.round((t0 - t) / 86400000);
  if (d === 0) return 'd’aujourd’hui'; if (d === 1) return 'd’hier';
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateIso || '')); return m ? 'du ' + m[3] + '/' + m[2] : '';
}
// ★★ PREMIERES-1 (§345) — « VOS PREMIÈRES FOIS » : la frise du parcours au domaine, recalculée sur les données — les vraies
//   dates, pas celle où l'appli a remarqué le jalon (JALONS-1 n'a commencé à dater que le 15/10). Nico (15/10) : « on
//   développe bien sûr les premières fois » ; « elles sont déjà dans les compteurs » — le palier 1 de chaque série.
function _mvPremieresFois(nom, D) {
  D = D || {};
  var out = [], aVenir = [];
  if (!nom) return { faites: out, aVenir: aVenir };
  var iso = function (x) { var s = String(x || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''; };
  var nt = (typeof D.nomTache === 'function') ? D.nomTache : function (x) { return x; };
  var ajoute = function (cle, titre, date, detail) { if (date) out.push({ cle: cle, titre: titre, date: date, detail: detail || '' }); };
  var parc = {}; (D.parcelles || []).forEach(function (p) { if (p && p.nom) parc[p.nom] = p; });
  var rang = D.vigne ? (parseFloat(D.vigne.ec_rang) || 0) : 0;
  var m = (D.membres || []).find(function (x) { return x && x.nom === nom; }), arrivee = m ? iso(m.debut_contrat) : '';
  ajoute('arrivee', 'Arrivée au domaine', arrivee, '');
  var equipe = function (j) { return [j.qui].concat(j.membresEquipe || []).filter(function (n, i, a) { return n && a.indexOf(n) === i; }); };
  var J = (D.journal || []).filter(function (j) { return j && !j.meteo && j.statut === 'Validé' && iso(j.date) && equipe(j).indexOf(nom) >= 0; })
    .sort(function (a, b) { return iso(a.date).localeCompare(iso(b.date)); });
  if (J.length) ajoute('val', 'Première validation', iso(J[0].date), [nt(J[0].tache), J[0].parcelle].filter(Boolean).join(', '));
  var premiereTache = function (slugs, cle, titre) {
    var j = J.find(function (x) { return slugs.indexOf(_mvJalSlug(x.tache)) >= 0; });
    if (j) ajoute(cle, titre, iso(j.date), j.parcelle || ''); return !!j;
  };
  var aTaille = premiereTache(['taille'], 'taille', 'Première taille');
  var aVend = premiereTache(['vendange'], 'vendange', 'Première vendange au domaine');
  premiereTache(['plantation', 'entreplantation'], 'plantation', 'Première plantation');
  var ha = 0, km = 0, dHa = '', dKm = '';                                   // le jour où le cumul passe le cap, chacun sa part
  J.forEach(function (j) {
    var p = parc[j.parcelle]; if (!p) return;
    var s = (parseFloat(p.surface) || 0) / equipe(j).length;
    ha += s; if (rang > 0) km += s * 10 / rang;
    if (!dHa && ha >= 1) dHa = iso(j.date);
    if (!dKm && km >= 1) dKm = iso(j.date);
  });
  ajoute('ha1', 'Premier hectare', dHa, ''); ajoute('km1', 'Premier kilomètre de rangs', dKm, '');
  var S = (D.sessions || []).filter(function (s) { return s && iso(s.date) && (s.conducteur === nom || s.coequipier === nom); })
    .sort(function (a, b) { return iso(a.date).localeCompare(iso(b.date)); });
  var s1 = S.find(function (s) { return s.conducteur === nom; });
  if (s1) ajoute('ses', 'Première session de tracteur', iso(s1.date), s1.activite || '');
  var acts = {}; (D.activites || []).forEach(function (a) { if (a && a.nom) acts[a.nom] = a; });
  var t1 = S.find(function (s) {
    var a = acts[s.activite] || {}, lab = (a.champCustom && a.champCustom.feedsPlantation) ? a.champCustom.label : null;
    return !!lab && (s.parcellesFaites || []).some(function (x) { return x && typeof x === 'object' && x.data && (parseInt(x.data[lab], 10) || 0) > 0; });
  });
  if (t1) { var autre = t1.conducteur === nom ? t1.coequipier : t1.conducteur; ajoute('trou', 'Premier trou de tarière', iso(t1.date), autre ? 'avec ' + autre : ''); }
  var O = ((D.cave && D.cave.operations) || []).filter(function (o) {
    if (!o || !iso(o.date)) return false;
    var q = (o.intervenants && o.intervenants.length) ? o.intervenants : (o.operateur ? [o.operateur] : []);
    return q.indexOf(nom) >= 0;
  }).sort(function (a, b) { return iso(a.date).localeCompare(iso(b.date)); });
  var premOp = function (type, cle, titre) { var o = O.find(function (x) { return x.type === type; }); if (o) ajoute(cle, titre, iso(o.date), ''); };
  premOp('ouillage', 'ouil', 'Premier ouillage'); premOp('soutirage', 'sout', 'Premier soutirage'); premOp('degustation', 'degu', 'Première dégustation');
  var M = [];   // PRESENCE-2 (§346) : les relevés du Cuvier où il est noté « Qui était là »
  (D.cuves || []).forEach(function (c) { ((c && c.mesures_fa) || []).forEach(function (m) { var q = (m && m.qui && m.qui.length) ? m.qui : ((m && m.intervenants) || []); if (m && iso(m.date) && q.indexOf(nom) >= 0) M.push({ m: m, cuve: c.nom || '' }); }); });
  M.sort(function (a, b) { return iso(a.m.date).localeCompare(iso(b.m.date)); });
  var r1 = M.find(function (x) { return (x.m.remontages | 0) > 0; }), p1 = M.find(function (x) { return (x.m.pigeages | 0) > 0; });
  if (r1) ajoute('rem', 'Premier remontage', iso(r1.m.date), r1.cuve); if (p1) ajoute('pig', 'Premier pigeage', iso(p1.m.date), p1.cuve);
  var auj = iso(D.aujourdhui);
  if (arrivee) {
    var an = String(parseInt(arrivee.slice(0, 4), 10) + 1) + arrivee.slice(4);
    if (auj && an <= auj) ajoute('an', 'Un an au domaine', an, ''); else aVenir.push({ cle: 'an', titre: 'Un an au domaine', quand: an });
  }
  if (!aVend) aVenir.push({ cle: 'vendange', titre: 'Première vendange au domaine', quand: '' });
  if (!aTaille) aVenir.push({ cle: 'taille', titre: 'Première taille', quand: '' });
  out.sort(function (a, b) { return a.date.localeCompare(b.date); });
  return { faites: out, aVenir: aVenir };
}
// ★★ PRESENCE-2 (§346) — les relevés du Cuvier où la personne est notée « Qui était là » (remontages, pigeages), par un autre,
//   des trois derniers jours.
function _mvCuvierNotees(nom, cuves, aujIso, jours) {
  if (!nom) return [];
  var lim = jours == null ? 3 : jours, t0 = Date.parse(String(aujIso || '').slice(0, 10) + 'T00:00:00Z'), out = [];
  (cuves || []).forEach(function (c) {
    ((c && c.mesures_fa) || []).forEach(function (m) {
      var qui = (m && m.qui && m.qui.length) ? m.qui : ((m && m.intervenants) || []);   // PRESENCE-2B : `qui` (la tournée et le relevé), l'ancien champ relu
      if (!m || !m.id || !m.date || qui.indexOf(nom) < 0 || m.par === nom) return;
      if (!((m.remontages | 0) > 0 || (m.pigeages | 0) > 0)) return;
      var t = Date.parse(String(m.date).slice(0, 10) + 'T00:00:00Z'), d = Math.round((t0 - t) / 86400000);
      if (isNaN(d) || d < 0 || d > lim) return;
      out.push({ id: m.id, type: 'chapeau', date: String(m.date).slice(0, 10), cuve: c.nom || 'la cuve', rem: m.remontages | 0, pig: m.pigeages | 0, par: m.par || '', intervenants: qui, tour: !!m.tour });
    });
  });
  return out.sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 2);
}
function _mvChapeauLib(rem, pig) {
  var p = [];
  if (rem > 0) p.push(rem + ' remontage' + (rem > 1 ? 's' : ''));
  if (pig > 0) p.push(pig + ' pigeage' + (pig > 1 ? 's' : ''));
  return p.join(' et ');
}
// ★★ RANGBOUT-1 (§349) — « DU RANG À LA BOUTEILLE » : les vins nés des parcelles que la personne a travaillées. La chaîne
//   est celle que la Cave sait déjà faire (`_pcrbCvLignes`) : la récolte d'une parcelle → sa cuve (`cuve_id`) → la cuvée du
//   décuvage (`decuvage.cuvee_id`), en élevage ou en bouteille. Le millésime d'un travail : l'année de la vendange qui suit
//   (novembre et décembre préparent déjà le millésime suivant : la taille).
function _mvRangBouteille(nom, D) {
  D = D || {};
  if (!nom) return [];
  var iso = function (x) { var s = String(x || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''; };
  var nt = (typeof D.nomTache === 'function') ? D.nomTache : function (x) { return x; };
  var millDe = function (d) { var y = parseInt(d.slice(0, 4), 10), m = parseInt(d.slice(5, 7), 10); return String(m >= 11 ? y + 1 : y); };
  var travail = {};   // millésime → parcelle → [tâches]
  (D.journal || []).forEach(function (j) {
    if (!j || j.meteo || j.statut !== 'Validé' || !iso(j.date) || !j.parcelle) return;
    var eq = [j.qui].concat(j.membresEquipe || []);
    if (eq.indexOf(nom) < 0) return;
    var M = millDe(iso(j.date)), t = nt(j.tache || '');
    travail[M] = travail[M] || {}; var L = travail[M][j.parcelle] = travail[M][j.parcelle] || [];
    if (t && L.indexOf(t) < 0) L.push(t);
  });
  var cuves = D.cuves || [], cuvees = D.cuvees || [], out = [];
  Object.keys(travail).sort().reverse().forEach(function (M) {
    var vins = {}, ordre = [];
    (D.recoltes || []).forEach(function (r) {
      if (!r || !iso(r.date) || iso(r.date).slice(0, 4) !== M) return;
      var p = String(r.parcelle || '').trim(), taches = travail[M][p]; if (!taches) return;
      var cv = r.cuve_id ? cuves.find(function (x) { return x && x.id === r.cuve_id; }) : null; if (!cv) return;
      var cu = (cv.decuvage && cv.decuvage.cuvee_id) ? cuvees.find(function (x) { return x && x.id === cv.decuvage.cuvee_id; }) : null;
      var cle = cu ? 'cu:' + cu.id : 'cv:' + cv.id;
      if (!vins[cle]) {
        vins[cle] = { nom: cu ? String(cu.nom || 'Cuvée') + (cu.millesime ? ' ' + cu.millesime : ' ' + M) : String(cv.nom || 'Cuve') + ' (' + M + ')',
                      etat: cu ? (cu.statut === 'embouteille' ? 'en bouteille' : 'en élevage') : 'en cuve', parcelles: [] };
        ordre.push(cle);
      }
      if (!vins[cle].parcelles.some(function (x) { return x.nom === p; })) vins[cle].parcelles.push({ nom: p, taches: taches.slice() });
    });
    if (ordre.length) out.push({ millesime: M, vins: ordre.map(function (k) { return vins[k]; }) });
  });
  return out.slice(0, 2);
}
// ★★ CARTEDOM-1 (§350) — « LA CARTE DE VOTRE SAISON » : les parcelles du domaine, colorées selon les passages de la
//   personne depuis le début de la saison (maquette GRATIF : « Carte du domaine — parcelles colorées selon passages »). Les
//   contours sont ceux de la carte des Parcelles (`KML_POLYGONS_DYNAMIC`) ; le dessin est un SVG, sans fond de carte : il
//   s'affiche aussi hors réseau, dans les vignes.
function _mvCarteDomaine(nom, D) {
  D = D || {};
  var iso = function (x) { var s = String(x || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''; };
  var depuis = iso(D.depuis), n = {}, vus = {};
  if (nom) (D.journal || []).forEach(function (j) {
    if (!j || j.meteo || j.statut !== 'Validé' || !iso(j.date) || !j.parcelle) return;
    if (depuis && iso(j.date) < depuis) return;
    if ([j.qui].concat(j.membresEquipe || []).indexOf(nom) < 0) return;
    var cle = [j.parcelle, j.tache, iso(j.date), j.passage || j.niveau || ''].join('|');
    if (vus[cle]) return; vus[cle] = 1;
    var p = String(j.parcelle).toLowerCase(); n[p] = (n[p] || 0) + 1;
  });
  var zones = (D.polygones || []).filter(function (k) { return k && k.name && Array.isArray(k.pts) && k.pts.length >= 3; })
    .map(function (k) { return { nom: k.name, pts: k.pts, n: n[String(k.name).toLowerCase()] || 0 }; });
  return { zones: zones, travaillees: zones.filter(function (z) { return z.n > 0; }).length, total: zones.length };
}
function _mvCarteNiveau(x) { return x <= 0 ? 0 : (x === 1 ? 1 : (x <= 3 ? 2 : 3)); }
// La projection : équirectangulaire autour du centre (à l'échelle d'un domaine, c'est juste), dans une boîte de 1000 de large.
function _mvCarteSvgPoints(zones) {
  var lats = [], lngs = [];
  zones.forEach(function (z) { z.pts.forEach(function (p) { lats.push(+p[0]); lngs.push(+p[1]); }); });
  if (!lats.length) return { l: 0, h: 0, poly: [] };
  var minLa = Math.min.apply(null, lats), maxLa = Math.max.apply(null, lats), minLo = Math.min.apply(null, lngs), maxLo = Math.max.apply(null, lngs);
  var k = Math.cos(((minLa + maxLa) / 2) * Math.PI / 180), w = Math.max((maxLo - minLo) * k, 1e-9), hh = Math.max(maxLa - minLa, 1e-9);
  var L = 1000, H = Math.max(120, Math.round(L * hh / w)), s = L / w;
  if (H > 1400) { H = 1400; s = H / hh; L = Math.round(w * s); }
  return { l: L, h: H, poly: zones.map(function (z) {
    return z.pts.map(function (p) { return Math.round(((+p[1] - minLo) * k) * s) + ',' + Math.round((maxLa - +p[0]) * s); }).join(' ');
  }) };
}
// ★★ SAISONIMG-1 (§351) — « MA SAISON EN IMAGES » : six cartes qui racontent la saison de la personne (maquette GRATIF :
//   « style Spotify Wrapped, 6 cartes, PDF » ; « peu de chiffres personnels, racontés comme une histoire »). Tout vient des
//   calculs déjà là : le journal (sa part), le tracteur, le Chai et le Cuvier, les jalons datés, les premières fois, les vins.
function _mvSaisonImages(nom, D) {
  D = D || {};
  var iso = function (x) { var s = String(x || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''; };
  var sa = D.saison || {}, deb = iso(sa.debut), fin = iso(sa.fin), auj = iso(D.aujourdhui);
  if (!fin || (auj && fin > auj)) fin = auj || fin;
  var dans = function (d) { d = iso(d); return !!d && (!deb || d >= deb) && (!fin || d <= fin); };
  var nt = (typeof D.nomTache === 'function') ? D.nomTache : function (x) { return x; };
  var parc = {}; (D.parcelles || []).forEach(function (p) { if (p && p.nom) parc[p.nom] = p; });
  var rang = D.vigne ? (parseFloat(D.vigne.ec_rang) || 0) : 0, phaHa = D.vigne ? (parseFloat(D.vigne.pieds) || 0) : 0;
  var ha = 0, km = 0, pieds = 0, jours = {}, pass = {}, taches = {}, vus = {}, out = { ses: 0, trous: 0, ouil: 0, sout: 0, degu: 0, chap: 0 };
  if (nom) (D.journal || []).forEach(function (j) {
    if (!j || j.meteo || j.statut !== 'Validé' || !dans(j.date) || !j.parcelle) return;
    var eq = [j.qui].concat(j.membresEquipe || []).filter(function (n, i, a) { return n && a.indexOf(n) === i; });
    if (eq.indexOf(nom) < 0) return;
    var cle = [j.parcelle, j.tache, iso(j.date), j.passage || j.niveau || ''].join('|'); if (vus[cle]) return; vus[cle] = 1;
    jours[iso(j.date)] = 1; pass[j.parcelle] = (pass[j.parcelle] || 0) + 1;
    var p = parc[j.parcelle]; if (!p) return;
    var s = (parseFloat(p.surface) || 0) / eq.length;
    ha += s; if (rang > 0) km += s * 10 / rang; if (phaHa > 0) pieds += s * phaHa;
    var t = nt(j.tache || ''); if (t) taches[t] = (taches[t] || 0) + s;
  });
  var acts = {}; (D.activites || []).forEach(function (a) { if (a && a.nom) acts[a.nom] = a; });
  if (nom) (D.sessions || []).forEach(function (s) {
    if (!s || !dans(s.date) || (s.conducteur !== nom && s.coequipier !== nom)) return;
    if (s.conducteur === nom && (s.statut === 'Terminé' || s.statut === 'Validé')) out.ses++;
    var a = acts[s.activite] || {}, lab = (a.champCustom && a.champCustom.feedsPlantation) ? a.champCustom.label : null;
    if (lab) (s.parcellesFaites || []).forEach(function (x) { if (x && typeof x === 'object' && x.data) out.trous += parseInt(x.data[lab], 10) || 0; });
  });
  if (nom) ((D.cave && D.cave.operations) || []).forEach(function (o) {
    if (!o || !dans(o.date)) return;
    var q = (o.intervenants && o.intervenants.length) ? o.intervenants : (o.operateur ? [o.operateur] : []); if (q.indexOf(nom) < 0) return;
    if (o.type === 'ouillage') out.ouil++; else if (o.type === 'soutirage') out.sout++; else if (o.type === 'degustation') out.degu++;
  });
  if (nom) (D.cuves || []).forEach(function (c) { ((c && c.mesures_fa) || []).forEach(function (m) {
    var q = (m && m.qui && m.qui.length) ? m.qui : ((m && m.intervenants) || []);
    if (m && dans(m.date) && q.indexOf(nom) >= 0) out.chap += (m.remontages | 0) + (m.pigeages | 0);
  }); });
  var nb = function (x, d) { var f = Math.pow(10, d || 0); return _mvJalNb(Math.round(x * f) / f); };
  var pl = function (n, s, p) { return n + ' ' + (n > 1 ? (p || s + 's') : s); };
  var coeur = Object.keys(pass).sort(function (a, b) { return pass[b] - pass[a] || a.localeCompare(b); })[0] || '';
  var nbP = Object.keys(pass).length, nbJ = Object.keys(jours).length;
  var top = Object.keys(taches).sort(function (a, b) { return taches[b] - taches[a]; }).slice(0, 3);
  var jal = Object.keys(D.gagnes || {}).filter(function (id) { return dans(D.gagnes[id]); }).sort(function (a, b) { return String(D.gagnes[a]).localeCompare(String(D.gagnes[b])); })
    .map(function (id) { return _mvJalonLibelle(id).titre; });
  var prem = _mvPremieresFois(nom, D).faites.filter(function (f) { return dans(f.date) && f.cle !== 'arrivee'; }).map(function (f) { return f.titre; });
  var vinsG = _mvRangBouteille(nom, D).find(function (g) { return deb && g.millesime === deb.slice(0, 4); }) || _mvRangBouteille(nom, D)[0];
  var vins = vinsG ? vinsG.vins.map(function (v) { return v.nom + ' — ' + v.etat; }) : [];
  var volant = [];
  if (out.ses) volant.push(pl(out.ses, 'session') + ' de tracteur'); if (out.trous) volant.push(nb(out.trous) + ' trous de tarière');
  if (out.ouil) volant.push(pl(out.ouil, 'ouillage')); if (out.sout) volant.push(pl(out.sout, 'soutirage'));
  if (out.degu) volant.push(pl(out.degu, 'dégustation')); if (out.chap) volant.push(pl(out.chap, 'remontage ou pigeage', 'remontages et pigeages'));
  var cartes = [
    { cle: 'saison', titre: 'Votre saison', grand: nb(ha, 1) + ' ha', petit: 'de vignes, votre part', lignes: [pl(nbJ, 'jour') + ' au domaine', km > 0 ? nb(km, 1) + ' km de rangs' : '', pieds > 0 ? nb(pieds) + ' pieds' : ''].filter(Boolean) },
    { cle: 'coeur', titre: 'Votre parcelle de cœur', grand: coeur || 'À venir', petit: coeur ? pl(pass[coeur], 'passage') + ' cette saison' : 'pas encore de passage cette saison', lignes: nbP > 1 ? ['et ' + pl(nbP - 1, 'autre parcelle', 'autres parcelles')] : [] },
    { cle: 'gestes', titre: 'Vos gestes', grand: top[0] || 'À venir', petit: top[0] ? 'votre geste de la saison' : '', lignes: top.map(function (t) { return t + ' · ' + nb(taches[t], 1) + ' ha'; }) },
    { cle: 'volant', titre: 'Au volant et au chai', grand: volant.length ? String(volant.length) : '', petit: volant.length ? (volant.length > 1 ? 'métiers en plus de la vigne' : 'métier en plus de la vigne') : 'Cette saison, la vigne avant tout.', lignes: volant },
    { cle: 'jalons', titre: 'Vos premières fois et vos jalons', grand: String(prem.length + jal.length), petit: (prem.length + jal.length) ? 'moments à retenir' : 'La suite s’écrit.', lignes: prem.slice(0, 3).concat(jal.slice(-3)) },
    { cle: 'vins', titre: 'Du rang à la bouteille', grand: vins.length ? String(vins.length) : '', petit: vins.length ? (vins.length > 1 ? 'vins nés de votre travail' : 'vin né de votre travail') : 'Les vins de cette saison sont encore à naître.', lignes: vins.slice(0, 3).concat(['Merci pour cette saison.']) },
  ];
  return { saison: sa.nom || '', debut: deb, fin: fin, cartes: cartes };
}
// ── JALONS-1 : fin du bloc exécutable ──

function _mvJalonsJour() { return _mvJalDemiJournee(new Date()).slice(0, 10); }
// À la connexion, une fois les données chargées (_mvApresChargement) : lit le document de la personne, compte
// l'ouverture, recalcule, date les jalons nouveaux, et n'écrit que si quelque chose a changé.
async function _mvJalonsSync() {
  try {
    var u = window.currentUser;
    if (!u || !u.nom) return null;
    if (typeof window.fbLireJalons !== 'function' || typeof window.fbEcrireJalons !== 'function') return null;
    // ★★ JALONS-2B (§342) : une lecture refusée ou impossible arrête tout — rien d'annoncé, rien d'écrit. Sinon chaque
    //   jalon passerait pour nouveau à chaque validation, et sa date d'origine serait réécrite au retour du réseau.
    var lu = await window.fbLireJalons();
    if (!lu || lu.ok !== true) return null;
    var v = lu.value || {};
    var o = _mvJalonsOuverture(v.ouv, new Date());
    var D = { journal: window.JOURNAL, sessions: window.SESSIONS, activites: window.ACTIVITES, parcelles: window.PARCELLES,
              cave: window.CAVE_ELEVAGE, membres: window.MEMBRES, ouv: o.ouv.n,
              vigne: (typeof window._mvVigne === 'function') ? window._mvVigne() : null, aujourdhui: new Date() };
    var c = _mvJalonsCompteurs(u.nom, D);
    var f = _mvJalonsFusion(v, _mvJalonsAtteints(c), _mvJalonsJour());
    // ★★ JALONS-2B (§342) : n'écrire QUE les jalons nouveaux — l'écriture fusionne, une date déjà posée n'est jamais
    //   réécrite. ⚠️ Pas de `gagnes: {}` quand rien n'est nouveau : en fusion, une table vide REMPLACE la table entière.
    var neufs = {}; f.nouveaux.forEach(function (id) { neufs[id] = f.gagnes[id]; });
    var envoi = { v: 1, ouv: o.ouv }; if (f.nouveaux.length) envoi.gagnes = neufs;
    if (o.compte || f.nouveaux.length) await window.fbEcrireJalons(envoi);
    window._mvJalons = { compteurs: c, gagnes: f.gagnes, nouveaux: f.nouveaux };
    return window._mvJalons;
  } catch (e) { if (window._mvAvale) window._mvAvale(e, 'jalons.js/_mvJalonsSync'); return null; }
}
// ★ FETES-1 (§347) — « la fête rare se coupe » (maquette GRATIF, décision de Nico) : l'annonce « Nouveau jalon » d'après
//   validation peut se taire, depuis Réglages › Moi › Mon compte. Rangé sur CE téléphone, comme « Plein soleil » ; les jalons,
//   eux, se comptent toujours et restent dans « Ma trace ».
function _mvFetesCle() { var u = window.currentUser; return 'mv_fetes_' + (window.TENANT_ID || '') + '_' + (u && u.nom ? _mvJalSlug(u.nom) : ''); }
function _mvFetesOn() { try { return localStorage.getItem(_mvFetesCle()) !== '0'; } catch (e) { return true; } }
function _mvFetesPeindre() { var s = document.getElementById('regl-fetes-state'); if (s) s.textContent = _mvFetesOn() ? 'Activé' : 'Coupé'; }
function toggleFetes() {
  var on = !_mvFetesOn();
  try { localStorage.setItem(_mvFetesCle(), on ? '1' : '0'); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'jalons.js/toggleFetes'); }
  _mvFetesPeindre();
  if (typeof window.showToast === 'function') window.showToast(on ? 'Les jalons seront annoncés' : 'Les jalons ne seront plus annoncés');
}
window.toggleFetes = toggleFetes;
window._mvFetesPeindre = _mvFetesPeindre;
// ★★ JALONS-2 (§341) — l'annonce : dans la feuille qui suit une validation, une ligne « Nouveau jalon » ; plus de trois
//   d'un coup (un retour après longtemps), une seule ligne qui renvoie à « Ma trace ». Sans feuille ouverte, un message.
//   ⚠️ Construite avec textContent : un nom de tâche ne passe jamais par innerHTML.
function _mvJalonsAnnonce(ids) {
  if (!ids || !ids.length) return;
  if (!_mvFetesOn()) return;   // ★ FETES-1 (§347) : la personne a coupé l'annonce — les jalons se comptent quand même
  var nomT = function (slug) { var t = (window.TACHES || []).find(function (x) { return x && _mvJalSlug(x.nom) === slug; }); return t ? ((typeof window.tNom === 'function') ? window.tNom(t.nom) : t.nom) : slug; };
  var L = ids.length > 3 ? { titre: ids.length + ' nouveaux jalons', phrase: 'Retrouvez-les dans « Ma trace ».' }
                         : _mvJalonLibelle(ids[0], ids[0].indexOf('ha1.') === 0 ? nomT(ids[0].slice(4)) : '');
  var sheet = document.querySelector('.mvds-sheet');
  if (!sheet) { if (typeof window.showToast === 'function') window.showToast('Nouveau jalon : ' + L.titre); return; }
  var el = document.createElement('div'); el.className = 'mvds-jal'; el.setAttribute('role', 'status');
  el.innerHTML = '<svg class="mv-ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#ic-etoile"></use></svg><span><b></b><span class="mvds-jal-t"></span><i></i></span>';
  el.querySelector('b').textContent = 'Nouveau jalon';
  el.querySelector('.mvds-jal-t').textContent = L.titre + (ids.length > 1 && ids.length <= 3 ? ' (et ' + (ids.length - 1) + ' autre' + (ids.length > 2 ? 's' : '') + ')' : '');
  el.querySelector('i').textContent = L.phrase;
  var k = sheet.querySelector('.mvds-s, .mvds-fin-s') || sheet.querySelector('.mvds-k');   // sous le titre de la feuille (le cas courant, ou « Chantier terminé »)
  if (k) k.insertAdjacentElement('afterend', el); else sheet.appendChild(el);
}
// ★★ JALONS-2 (§341) — « Mes jalons » dans « Ma trace » : combien, les trois derniers, les trois prochains.
function _mvJalonsSection() {
  var J = window._mvJalons, esc = (typeof window._escHtml === 'function') ? window._escHtml : _mvJalEnc;
  var h = '<div class="mtr-lab">Mes jalons</div><div class="mtr-card mtr-jal">';
  if (!J) return h + '<div class="mtr-jal-vide">Vos jalons se calculent à chaque connexion.</div></div>';
  var ids = Object.keys(J.gagnes || {}).sort(function (a, b) { return String(J.gagnes[b] || '').localeCompare(String(J.gagnes[a] || '')); });
  h += '<div class="mtr-jal-n"><b>' + ids.length + '</b> jalon' + (ids.length > 1 ? 's' : '') + ' gagné' + (ids.length > 1 ? 's' : '') + '</div>';
  ids.slice(0, 3).forEach(function (id) {
    var L = _mvJalonLibelle(id);
    h += '<div class="mtr-jal-row"><span class="mtr-jal-t">' + esc(L.titre) + '</span><span class="mtr-jal-d">' + esc(_mvJalDateFr(J.gagnes[id])) + '</span></div>';
  });
  var pro = _mvJalonsProchains(J.compteurs, J.gagnes).slice(0, 3);
  if (pro.length) {
    h += '<div class="mtr-jal-sub">Les prochains</div>';
    pro.forEach(function (p) {
      h += '<div class="mtr-jal-row"><span class="mtr-jal-t">' + esc(p.titre) + '</span><span class="mtr-jal-d">' + esc(p.reste) + '</span></div>'
         + '<div class="mtr-jal-bar"><i style="width:' + Math.round(p.ratio * 100) + '%"></i></div>';
    });
  }
  return h + '</div>';
}
// Repli d'échappement, si `_escHtml` n'est pas exposé : on ENCODE (jamais on n'efface — un guillemet effacé dans un attribut
// casse un gestionnaire en silence : vécu sur « Vu », CAVE-1).
function _mvJalEnc(x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
// ★★ PRESENCE-1 (§344) — la carte « Ta présence est notée », en tête de l'Accueil de la Vigne : qui vous a noté, sur quoi,
//   pour quels vins, avec qui, et le pourquoi du geste (POURQUOI-1). « Vu » la range sur CE téléphone (localStorage :
//   une commodité, pas une donnée). Deux cartes au plus.
function _mvCaveVusCle() { var u = window.currentUser; return 'mv_cave_vus_' + (u && u.nom ? _mvJalSlug(u.nom) : ''); }
function _mvCaveVus() { try { return JSON.parse(localStorage.getItem(_mvCaveVusCle()) || '[]') || []; } catch (e) { return []; } }
function _mvCaveNoteVu(id) {
  try { var v = _mvCaveVus(); if (v.indexOf(id) < 0) v.push(id); localStorage.setItem(_mvCaveVusCle(), JSON.stringify(v.slice(-60))); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'jalons.js/_mvCaveNoteVu'); }
  _mvCaveNoteRender();
}
function _mvCaveNoteRender() {
  var box = document.getElementById('home-cave-note'); if (!box) return;
  var u = window.currentUser, esc = (typeof window._escHtml === 'function') ? window._escHtml : _mvJalEnc;
  if (!u || !u.nom) { box.innerHTML = ''; return; }
  var auj = _mvJalDemiJournee(new Date()).slice(0, 10), vus = _mvCaveVus();
  var ops = _mvCaveNotees(u.nom, (window.CAVE_ELEVAGE && window.CAVE_ELEVAGE.operations) || [], auj, 3)
    .concat(_mvCuvierNotees(u.nom, (window.CAVE_VENDANGE && window.CAVE_VENDANGE.cuves_vinif) || [], auj, 3))   // PRESENCE-2 (§346)
    .filter(function (o) { return vus.indexOf(o.id) < 0; })
    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 2);
  if (!ops.length) { box.innerHTML = ''; return; }
  var cuvees = (window.CAVE_ELEVAGE && window.CAVE_ELEVAGE.cuvees) || [];
  box.innerHTML = ops.map(function (o) {
    if (o.type === 'chapeau') {   // ★★ PRESENCE-2 (§346) : un relevé du Cuvier
      var avecC = (o.intervenants || []).filter(function (x) { return x !== u.nom; });
      var pqC = (typeof window._mvPqTexte === 'function') ? window._mvPqTexte((o.pig > 0 && !o.rem) ? 'pigeage' : 'remontage', 'cave', 'p') : '';
      return '<div class="hcn" role="status"><div class="hcn-k">Ta présence est notée</div>'
        + '<div class="hcn-t">' + esc(o.par || (o.tour ? 'La tournée' : 'L’admin')) + ' vous a noté sur <b>' + esc(_mvChapeauLib(o.rem, o.pig) + ' ' + _mvCaveQuand(o.date, auj)) + '</b>, au Cuvier' + (o.tour ? ' (la tournée)' : '') + ' : ' + esc(o.cuve)
        + (avecC.length ? ' — avec ' + esc(avecC.join(', ')) : '') + '.</div>'
        + (pqC ? '<div class="hcn-pq"><b>Pourquoi ?</b> ' + esc(pqC) + '</div>' : '')
        + '<button type="button" class="hcn-vu" data-id="' + _mvJalEnc(o.id) + '" onclick="_mvCaveNoteVu(this.dataset.id)">Vu</button></div>';
    }
    var ids = (o.cuvees_ids && o.cuvees_ids.length) ? o.cuvees_ids : (o.cuvee_id ? [o.cuvee_id] : []);
    var noms = ids.map(function (id) { var c = cuvees.find(function (x) { return x && x.id === id; }); return c ? (c.nom || 'Cuvée') + (c.millesime ? ' ' + c.millesime : '') : null; }).filter(Boolean);
    var avec = ((o.intervenants && o.intervenants.length) ? o.intervenants : []).filter(function (n) { return n !== u.nom; });
    var pq = (typeof window._mvPqTexte === 'function') ? window._mvPqTexte(o.type, 'cave', 'p') : '';
    return '<div class="hcn" role="status"><div class="hcn-k">Ta présence est notée</div>'
      + '<div class="hcn-t">' + esc(o.operateur || 'L’admin') + ' vous a noté sur <b>' + esc(_mvCaveTypeLib(o.type) + ' ' + _mvCaveQuand(o.date, auj)) + '</b>, au Chai'
      + (noms.length ? ' : ' + esc(noms.join(', ')) : '') + (avec.length ? ' — avec ' + esc(avec.join(', ')) : '') + '.</div>'
      + (pq ? '<div class="hcn-pq"><b>Pourquoi ?</b> ' + esc(pq) + '</div>' : '')
      + '<button type="button" class="hcn-vu" data-id="' + _mvJalEnc(o.id) + '" onclick="_mvCaveNoteVu(this.dataset.id)">Vu</button></div>';   // l'identifiant passe par data-id, jamais dans le code de l'attribut
  }).join('');
}
// ★★ PREMIERES-1 (§345) — la frise dans « Ma trace », au-dessus de « Mes jalons ».
function _mvPremieresSection() {
  var u = window.currentUser; if (!u || !u.nom) return '';
  var esc = (typeof window._escHtml === 'function') ? window._escHtml : _mvJalEnc;
  var P = _mvPremieresFois(u.nom, { journal: window.JOURNAL, sessions: window.SESSIONS, activites: window.ACTIVITES, parcelles: window.PARCELLES,
    cave: window.CAVE_ELEVAGE, membres: window.MEMBRES, vigne: (typeof window._mvVigne === 'function') ? window._mvVigne() : null,
    cuves: (window.CAVE_VENDANGE && window.CAVE_VENDANGE.cuves_vinif) || [],
    aujourdhui: _mvJalDemiJournee(new Date()).slice(0, 10), nomTache: (typeof window.tNom === 'function') ? window.tNom : null });
  if (!P.faites.length && !P.aVenir.length) return '';
  var h = '<div class="mtr-lab">Vos premières fois</div><div class="mtr-card mtr-pf">';
  P.faites.forEach(function (f) {
    h += '<div class="mtr-pf-row"><span class="mtr-pf-pt" aria-hidden="true"></span><div><div class="mtr-pf-t">' + esc(f.titre) + '</div>'
       + '<div class="mtr-pf-d">' + esc(_mvJalDateFr(f.date) + (f.detail ? ' · ' + f.detail : '')) + '</div></div></div>';
  });
  P.aVenir.forEach(function (f) {
    h += '<div class="mtr-pf-row mtr-pf-avenir"><span class="mtr-pf-pt" aria-hidden="true"></span><div><div class="mtr-pf-t">' + esc(f.titre) + '</div>'
       + '<div class="mtr-pf-d">' + esc(f.quand ? 'le ' + _mvJalDateFr(f.quand) : 'à venir') + '</div></div></div>';
  });
  return h + '</div>';
}
window._mvJalonsSync = _mvJalonsSync;
window._mvPremieresSection = _mvPremieresSection;
// ★★ RANGBOUT-1 (§349) — « Les vins de votre travail » dans « Ma trace » : les deux derniers millésimes, chaque vin, les
//   parcelles d'où il vient, et ce que vous y avez fait.
function _mvRangBouteilleSection() {
  var u = window.currentUser; if (!u || !u.nom) return '';
  var esc = (typeof window._escHtml === 'function') ? window._escHtml : _mvJalEnc;
  var V = window.CAVE_VENDANGE || {}, E = window.CAVE_ELEVAGE || {};
  var R = _mvRangBouteille(u.nom, { journal: window.JOURNAL, recoltes: V.recoltes, cuves: V.cuves_vinif, cuvees: E.cuvees,
    nomTache: (typeof window.tNom === 'function') ? window.tNom : null });
  if (!R.length) return '';
  var h = '<div class="mtr-lab">Les vins de votre travail</div><div class="mtr-card mtr-rb">';
  R.forEach(function (g) {
    h += '<div class="mtr-rb-mil">Millésime ' + esc(g.millesime) + '</div>';
    g.vins.forEach(function (v) {
      h += '<div class="mtr-rb-vin"><div class="mtr-rb-t"><b>' + esc(v.nom) + '</b><span class="mtr-rb-e">' + esc(v.etat) + '</span></div>';
      v.parcelles.forEach(function (p) {
        h += '<div class="mtr-rb-p">' + esc(p.nom) + (p.taches.length ? ' · ' + esc(p.taches.join(', ').toLowerCase()) : '') + '</div>';
      });
      h += '</div>';
    });
  });
  return h + '</div>';
}
window._mvRangBouteilleSection = _mvRangBouteilleSection;
// ★★ CARTEDOM-1 (§350) — la carte dans « Ma trace » : depuis le début de la saison active (sinon un an).
function _mvCarteDomaineSection() {
  var u = window.currentUser; if (!u || !u.nom) return '';
  var esc = (typeof window._escHtml === 'function') ? window._escHtml : _mvJalEnc;
  var polys = (window.KML_POLYGONS_DYNAMIC && window.KML_POLYGONS_DYNAMIC.length) ? window.KML_POLYGONS_DYNAMIC : (window.KML_DATA || []);
  var sa = (window.SAISONS || []).find(function (s) { return s && s.active; });
  var depuis = (sa && sa.debut) ? String(sa.debut).slice(0, 10) : _mvJalDemiJournee(new Date(Date.now() - 365 * 86400000)).slice(0, 10);
  var C = _mvCarteDomaine(u.nom, { polygones: polys, journal: window.JOURNAL, depuis: depuis });
  if (!C.total) return '';
  var P = _mvCarteSvgPoints(C.zones);
  var h = '<div class="mtr-lab">La carte de votre saison</div><div class="mtr-card mtr-cd">'
    + '<div class="mtr-cd-n"><b>' + C.travaillees + '</b> parcelle' + (C.travaillees > 1 ? 's' : '') + ' sur ' + C.total + ' depuis le ' + esc(_mvJalDateFr(depuis)) + '</div>'
    + '<svg class="mtr-cd-svg" viewBox="0 0 ' + P.l + ' ' + P.h + '" role="img" aria-label="Carte du domaine, parcelles colorées selon vos passages">';
  C.zones.forEach(function (z, i) {
    h += '<polygon class="cd-n' + _mvCarteNiveau(z.n) + '" points="' + P.poly[i] + '"><title>' + esc(z.nom + ' — ' + z.n + ' passage' + (z.n > 1 ? 's' : '')) + '</title></polygon>';
  });
  h += '</svg><div class="mtr-cd-leg"><span><i class="cd-n0"></i>aucun</span><span><i class="cd-n1"></i>1</span><span><i class="cd-n2"></i>2 à 3</span><span><i class="cd-n3"></i>4 et plus</span></div>';
  return h + '</div>';
}
window._mvCarteDomaineSection = _mvCarteDomaineSection;
// ★★ SAISONIMG-1 (§351) — l'écran (six cartes à faire défiler) et le PDF (le document imprimable de l'appli, `_mvDocOpen`).
function _mvSaisonDonnees() {
  var V = window.CAVE_VENDANGE || {}, E = window.CAVE_ELEVAGE || {};
  var sa = (window.SAISONS || []).find(function (s) { return s && s.active; }) || {};
  return { journal: window.JOURNAL, sessions: window.SESSIONS, activites: window.ACTIVITES, parcelles: window.PARCELLES, cave: E,
    cuves: V.cuves_vinif || [], recoltes: V.recoltes || [], cuvees: E.cuvees || [], membres: window.MEMBRES,
    vigne: (typeof window._mvVigne === 'function') ? window._mvVigne() : null, gagnes: (window._mvJalons && window._mvJalons.gagnes) || {},
    saison: sa, aujourdhui: _mvJalDemiJournee(new Date()).slice(0, 10), nomTache: (typeof window.tNom === 'function') ? window.tNom : null };
}
function _mvSaisonCartesHtml(R, esc) {
  return R.cartes.map(function (c, i) {
    return '<div class="si-c si-c-' + c.cle + '"><div class="si-n">' + (i + 1) + ' / ' + R.cartes.length + '</div>'
      + '<div class="si-t">' + esc(c.titre) + '</div>'
      + (c.grand ? '<div class="si-g">' + esc(c.grand) + '</div>' : '')
      + (c.petit ? '<div class="si-p">' + esc(c.petit) + '</div>' : '')
      + (c.lignes.length ? '<ul class="si-l">' + c.lignes.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '')
      + '</div>';
  }).join('');
}
function openSaisonImages() {
  var u = window.currentUser; if (!u || !u.nom) return;
  var esc = (typeof window._escHtml === 'function') ? window._escHtml : _mvJalEnc;
  var R = _mvSaisonImages(u.nom, _mvSaisonDonnees());
  var box = document.getElementById('si-cartes'), sub = document.getElementById('si-sub');
  if (box) { box.innerHTML = _mvSaisonCartesHtml(R, esc); box.scrollLeft = 0; }
  if (sub) sub.textContent = [R.saison, R.debut ? 'depuis le ' + _mvJalDateFr(R.debut) : ''].filter(Boolean).join(' · ');
  if (typeof window.openOv === 'function') window.openOv('ovSaisonImg'); else { var ov = document.getElementById('ovSaisonImg'); if (ov) ov.classList.add('open'); }
}
function _mvSaisonFermer() { var ov = document.getElementById('ovSaisonImg'); if (ov) ov.classList.remove('open'); }
function _mvSaisonPdf() {
  var u = window.currentUser; if (!u || !u.nom || typeof window._mvDocOpen !== 'function') return;
  var esc = (typeof window._escHtml === 'function') ? window._escHtml : _mvJalEnc;
  var R = _mvSaisonImages(u.nom, _mvSaisonDonnees());
  window._mvDocOpen({ titre: 'Ma saison en images', metas: [u.nom, R.saison], cat: 'saison',
    corps: '<div class="si-print">' + _mvSaisonCartesHtml(R, esc) + '</div>',
    css: '.si-print{display:grid;grid-template-columns:1fr 1fr;gap:12px}.si-c{border:1px solid rgba(0,0,0,.18);border-radius:12px;padding:14px;break-inside:avoid;page-break-inside:avoid}'
       + '.si-n{font-size:10px;opacity:.6}.si-t{font-size:var(--pt-nano,11px);letter-spacing:0;text-transform:none;font-weight:700;margin-top:4px}'
       + '.si-g{font-size:26px;font-weight:700;margin-top:6px}.si-p{opacity:.75}.si-l{margin:8px 0 0;padding-left:18px}' });
}
window.openSaisonImages = openSaisonImages;
window._mvSaisonFermer = _mvSaisonFermer;
window._mvSaisonPdf = _mvSaisonPdf;
window._mvCaveNoteRender = _mvCaveNoteRender;
window._mvJalonsProchains = _mvJalonsProchains;   // ACCV-2 (§417) : « Ma saison » de l'Accueil montre les deux plus proches
window._mvJalonLibelle = _mvJalonLibelle;
window._mvCaveNoteVu = _mvCaveNoteVu;
window._mvJalonsAnnonce = _mvJalonsAnnonce;
window._mvJalonsSection = _mvJalonsSection;
window.MV_JALONS_SERIES = MV_JALONS_SERIES;
