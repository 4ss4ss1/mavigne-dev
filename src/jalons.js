// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — jalons.js — ★★ JALONS-1 (§340) : LE CALCUL DES JALONS ET LEUR MÉMOIRE
// ═══════════════════════════════════════════════════════════════════════════
// Décisions de Nico (maquette GRATIF, 15/10, bloc GRATIF-0 du §28) : des jalons et des paliers, jamais de
// classement, de vitesse ni de quantité épandue. Ils se gagnent sur ce que l'appli sait déjà — le journal, les
// sessions du tracteur, les opérations du Chai — plus un compteur d'ouvertures (une au plus par demi-journée).
// Un jalon gagné reste gagné. La mémoire est un document par personne, `jalons_<uid>`, qu'elle seule lit et
// écrit (firestore.rules, règle 6) : ni l'administrateur du domaine, ni un collègue.
// JALONS-2 (§341) les montre : une ligne « Nouveau jalon » dans la feuille qui suit une validation, et « Mes jalons » dans « Ma trace ».
// ⚠️ Le coéquipier (tarière, ensemencement, engrais) n'existe pas encore dans les sessions (backlog n°44) : seul le
//   conducteur compte ici.

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
    if (!s || s.conducteur !== nom) return;
    if (s.statut === 'Terminé' || s.statut === 'Validé') c.ses++;
    var act = acts[s.activite] || {}, lab = (act.champCustom && act.champCustom.feedsPlantation) ? act.champCustom.label : null;
    var sl = _mvJalSlug(s.activite);
    (s.parcellesFaites || []).forEach(function (x) {
      var n = (x && typeof x === 'object') ? x.nom : x, g = geo(n);
      if (g) { c.kmtr += g.km; if (sl === 'ensemencement' || sl === 'semis') c.sem += g.ha; if (sl === 'engrais') c.eng += g.ha; }
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
// ★★ JALONS-2 (§341) — l'annonce : dans la feuille qui suit une validation, une ligne « Nouveau jalon » ; plus de trois
//   d'un coup (un retour après longtemps), une seule ligne qui renvoie à « Ma trace ». Sans feuille ouverte, un message.
//   ⚠️ Construite avec textContent : un nom de tâche ne passe jamais par innerHTML.
function _mvJalonsAnnonce(ids) {
  if (!ids || !ids.length) return;
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
  var J = window._mvJalons, esc = (typeof window._escHtml === 'function') ? window._escHtml : function (x) { return String(x).replace(/[<>&"]/g, ''); };
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
window._mvJalonsSync = _mvJalonsSync;
window._mvJalonsAnnonce = _mvJalonsAnnonce;
window._mvJalonsSection = _mvJalonsSection;
window.MV_JALONS_SERIES = MV_JALONS_SERIES;
