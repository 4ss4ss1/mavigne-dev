// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ★★★ AUJ-1 (§260) — LE COCKPIT D'AUJOURD'HUI, VUE TERRAIN
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Nico (06/10) : un Pilotage « dynamique, professionnel et qui en jette » ; maquette du cockpit validée
// en v2 le 07/10 (« tout est ok »), avec une exigence : GARDER toutes les infos d'Aujourd'hui.
// Ce module RANGE les blocs que _pilTabAuj calcule déjà (fin prévue et marge, coût de l'inaction,
// décision du jour, indicateurs, alertes) et AJOUTE ce qui manquait pour lire la journée d'un coup
// d'œil : le résumé en une phrase, les chantiers en cours, la courbe de la charge restante (photo
// quotidienne PHOTO-1, puis projection jusqu'à la fin prévue) et le fil « En direct » des
// validations du jour.
//
// ⚠️⚠️ POURQUOI UN MODULE À PART : pilotage.js pèse 880 Ko, on découpe à 950. Ce module ne lit
//   RIEN de l'intérieur de pilotage.js : _pilTabAuj lui passe ses morceaux tout calculés (un seul
//   moteur par chiffre). Il ne fait que de la mise en page, et le mouvement passe par _mvAnim (MOUV-1).
// ⚠️ L'HEURE D'UNE VALIDATION : une entrée du journal n'a pas de champ d'heure, mais son identifiant
//   est Date.now() écrit en base 16 (app.js : id:Date.now().toString(16)). On le relit, et seulement
//   s'il a cette forme — sinon on n'invente pas d'heure.
// ⚠️ LE DIRECT : quand l'équipe valide, l'écran se redessine (_prioRedessine → renderPilotage). Le
//   cockpit retient ce qu'il montrait : les chiffres défilent depuis l'ancienne valeur, les nouvelles
//   lignes du fil s'éclairent une fois. Rien n'exige que les téléphones de l'équipe soient à jour.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

var _CK = { vu: {}, fil: null, serie: [], m: null, vue: 'terrain', d: null };

function _ckNb(v){ return Math.round(Number(v) || 0).toLocaleString('fr-FR'); }
function _ckIso(dt){
  var x = dt || new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
function _ckMaj1(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
// L'heure d'une entrée du journal : son identifiant base 16, s'il en a la forme ; sinon rien.
function _ckTs(e){
  var id = e && e.id;
  if(typeof id !== 'string' || !/^[0-9a-f]{10,12}$/.test(id)) return null;
  var t = parseInt(id, 16);
  return (t > 1500000000000 && t < Date.now() + 86400000) ? t : null;
}
// Qui travaille sur une ligne du journal — ★ DIRECT-1 (§318) : l'équipe d'abord, dans son ordre ; celui qui a saisi ensuite, s'il
//   n'y est pas déjà et s'il était dans les rangs. « Sans moi » (quiHors, TV-2) : il n'y figure pas — comme pour le temps passé
//   (_ecoTempsVigne) et le journal des interventions. Sans équipe : l'auteur seul. Nico (12/10) : « l'équipe est bien
//   programmée mais c'est encore moi d'indiqué dessus ».
function _ckQui(e){
  var q = String((e && e.qui) || '').trim(), r = [];
  ((e && Array.isArray(e.membresEquipe)) ? e.membresEquipe : []).forEach(function(x){ var n = String(x || '').trim(); if(n && r.indexOf(n) < 0) r.push(n); });
  if(q && r.indexOf(q) < 0 && !(e.quiHors && r.length)) r.push(q);
  return r;
}
window._ckQui = _ckQui;

// ── Le fil : les validations et les débuts de la journée, du plus récent au plus ancien ──────────
window._ckFilDonnees = function(journal, auj){
  var r = [];
  (journal || []).forEach(function(e){
    if(!e || e.date !== auj || e.meteo || !e.tache || !e.parcelle) return;
    if(e.statut !== 'Validé' && e.statut !== 'En cours') return;
    r.push({ e: e, ts: _ckTs(e) });
  });
  r.sort(function(a, b){ return (b.ts || 0) - (a.ts || 0); });
  return r;
};

// ── ★★ DIRECT-1 (§318) — LE TRACTEUR DANS « EN DIRECT » ────────────────────────────────────────────────────────────
//   Nico (12/10) : « aujourd'hui j'étais sur le tracteur, j'aimerais bien que ça apparaisse ». Tout est déjà partagé entre les
//   téléphones : la session (conducteur, activité, date) et sa boîte noire (`trace`, SESS-1 §168 : chaque geste et son heure,
//   gardés 3 jours dans le document de la session). Le chrono, lui, vit sur l'appareil : on ne le lit pas.
//   Rend, pour le jour `auj` : evts — 'trac' (une parcelle ou un bloc fini, ses minutes quand la mesure en a), 'trac-debut' (la
//   session ouverte ce jour-là), 'traite' (un traitement : l'assistant phyto écrit une session type:'traitement') ; cours — le
//   conducteur sur une parcelle en ce moment, ou en pause. Une parcelle décochée dans la journée sort de l'événement qui la
//   portait ; sans aucun geste du jour, les parcelles finies ce jour-là (leur heure de fin, t1) font foi.
function _ckJourDe(t){ var n = Number(t); return (isFinite(n) && n > 1500000000000) ? _ckIso(new Date(n)) : ''; }
function _ckTsSession(s){
  var m = /^trat_(\d{12,14})$/.exec(String((s && s.id) || ''));
  if(m){ var t = Number(m[1]); return (t > 1500000000000 && t < Date.now() + 86400000) ? t : null; }
  return _ckTs(s);
}
function _ckHeureLe(auj, hhmm){
  var m = /^(\d{1,2})[:h](\d{2})/.exec(String(hhmm || '').trim()), p = String(auj || '').split('-');
  if(!m || p.length !== 3) return null;
  var d = new Date(+p[0], +p[1] - 1, +p[2], +m[1], +m[2]);
  return isNaN(d.getTime()) ? null : d.getTime();
}
function _ckParcs(p){ return String(p || '').split(' + ').map(function(x){ return x.trim(); }).filter(Boolean); }
window._ckTracJour = function(sessions, auj, o){
  var evts = [], cours = [], tracs = (o && Array.isArray(o.tracs)) ? o.tracs : [];
  (Array.isArray(sessions) ? sessions : []).forEach(function(s){
    if(!s || typeof s !== 'object') return;
    var qui = String(s.conducteur || '').trim(), act = String(s.activite || '').trim(), t0 = _ckTsSession(s);
    if(s.type === 'traitement'){
      if(String(s.date || '').slice(0, 10) !== auj) return;
      var tsT = _ckHeureLe(auj, s.heureFin) || _ckHeureLe(auj, s.heureDebut) || ((t0 && _ckJourDe(t0) === auj) ? t0 : null);
      evts.push({ k: 'traite', qui: qui, act: act || 'Traitement', parcs: (Array.isArray(s.parcelles) ? s.parcelles : []).filter(Boolean).map(String), m: null, ts: tsT });
      return;
    }
    var tr = (Array.isArray(s.trace) ? s.trace : []).filter(function(y){ return y && _ckJourDe(y.t) === auj; });
    for(var i = tr.length - 1; i >= 0 && !qui; i--) qui = String(tr[i].u || '').trim();
    if(String(s.date || '').slice(0, 10) === auj){
      var tn = (tracs.filter(function(x){ return x && x.id === s.tracteurId; })[0] || {}).nom || '';
      evts.push({ k: 'trac-debut', qui: qui, act: act, parcs: [], m: null, trac: String(tn), ts: (t0 && _ckJourDe(t0) === auj) ? t0 : (tr.length ? Number(tr[0].t) : null) });
    }
    var faits = [], bloc = [], tB = null, pause = false, tP = null, pBloc = [];
    tr.forEach(function(y){
      var e = String(y.e || ''), ps = _ckParcs(y.p), t = Number(y.t);
      if(e === 'fin'){ if(ps.length) faits.push({ parcs: ps, m: (typeof y.m === 'number' && y.m > 0) ? y.m : null, ts: t }); bloc = []; tB = null; }
      else if(e === 'coche' || e === 'retabli'){ if(ps.length) faits.push({ parcs: ps, m: null, ts: t }); }
      else if(e === 'decoche'){ ps.forEach(function(n){ for(var j = faits.length - 1; j >= 0; j--){ var k = faits[j].parcs.indexOf(n); if(k >= 0){ faits[j].parcs.splice(k, 1); return; } } }); }
      else if(e === 'debut' || e === 'reprise'){ bloc = ps; tB = t; pause = false; }
      else if(e === 'ajout'){ ps.forEach(function(n){ if(bloc.indexOf(n) < 0) bloc.push(n); }); }
      else if(e === 'reprend'){ pause = false; if(ps.length){ bloc = ps; tB = t; } }
      else if(e === 'interrompt'){ pBloc = ps.length ? ps : bloc; bloc = []; tB = null; pause = true; tP = t; }
      else if(e === 'dejeuner'){ pBloc = []; bloc = []; tB = null; pause = true; tP = t; }
      else if(e === 'finjour' || e === 'ferme'){ bloc = []; tB = null; pause = false; }
    });
    if(!tr.length){
      var grp = {};
      (Array.isArray(s.parcellesFaites) ? s.parcellesFaites : []).forEach(function(x){
        if(!x || typeof x !== 'object' || _ckJourDe(x.t1) !== auj) return;
        var n = String(x.nom || '').trim(); if(n) (grp[x.t1] = grp[x.t1] || []).push(n);
      });
      Object.keys(grp).forEach(function(k){ faits.push({ parcs: grp[k], m: null, ts: Number(k) }); });
    }
    faits.forEach(function(f){ if(f.parcs.length) evts.push({ k: 'trac', qui: qui, act: act, parcs: f.parcs, m: f.m, ts: f.ts }); });
    if(s.statut === 'Terminé') return;
    if(bloc.length) cours.push({ qui: qui, act: act, parcs: bloc, ts: tB, pause: false });
    else if(pause) cours.push({ qui: qui, act: act, parcs: pBloc, ts: tP, pause: true });
  });
  evts.sort(function(a, b){ return (b.ts || 0) - (a.ts || 0); });
  cours.sort(function(a, b){ return (b.ts || 0) - (a.ts || 0); });
  return { evts: evts, cours: cours };
};

// ── Le résumé : une phrase, rien que des chiffres déjà calculés ───────────────────────────────────

// ── La charge restante : les photos du jour (PHOTO-1), aujourd'hui en direct, puis la projection ──
// AUJ-5 (§307) : `per` (la période active) écarte une photo prise sur une autre période — chaque photo porte la sienne (p).
// ★★ AUJ-6 (§308) — la courbe ne trace plus que des photos sûres (Nico, 10/10 : « plus de lignes qui montent et descendent ») :
//   · une photo SANS période (d'avant AUJ-5) ne dit pas de quelle période elle est : écartée dès qu'on en connaît une ;
//   · un jour, une valeur (la dernière écrite) ; ni le jour même (le direct le remplace) ni un jour à venir ;
//   · un 0 suivi d'un reste > 0 est impossible dans une période — le travail fait ne se défait pas : c'est une photo prise
//     avant l'arrivée des données (les traits verticaux). Écarté.
window._ckChargeSerie = function(photos, d, auj, per){
  var parJour = {};
  (photos || []).forEach(function(x){
    if(!x || typeof x.d !== 'string' || typeof x.reste !== 'number' || !isFinite(x.reste) || x.d >= auj) return;
    if(per && x.p !== per) return;
    parJour[x.d] = x.reste;
  });
  var s = Object.keys(parJour).sort().map(function(k){ return { iso: k, v: parJour[k] }; });
  var live = Number(d && d.totalReste);
  if(d && d.totalReste != null && isFinite(live)) s.push({ iso: auj, v: Math.round(live) });
  for(var i = s.length - 2; i >= 0; i--){
    if(!(s[i].v > 0) && s.slice(i + 1).some(function(o){ return o.v > 0; })) s.splice(i, 1);
  }
  return s;
};

// ── À SAVOIR (AUJ-2, §261) : ce qui peut changer la journée ou la semaine ───────────────────────
//   Règles validées par Nico le 07/10 :
//   • météo : les deux jours qui viennent, AU NIVEAU DU DOMAINE (prévisions heure par heure de l'Accueil,
//     METEO_HOURLY) ; pluie ≥ 2 mm sur un jour ou vent ≥ 40 km/h ; ce qui est en cours là où ça tombe (AUJ-8, §312).
//     Le détail par secteur viendra dans un lot suivant : le cache par commune ne porte que la journée.
//   • absences : les 7 jours qui viennent (aujourd'hui est déjà dans la tuile « Présences ») ; l'état du jour
//     est lu par _pilEtatEntree, le même que les présences. Le Pilotage est réservé à l'admin.
//   • contrats : les fins dans les 30 jours (fin_contrat). • retards : fenêtre passée et tâche pas finie.
//   • matériel et cave : les blocs d'avant, rangés DANS l'encart (aucun recalculé).
var _CK_SV = { jours: 7, contrat: 30, pluie: 2, vent: 40, loin: 62 };   // loin (AUJ-5) : jusqu'où chercher la fin d'une absence
function _ckJc(dt){ return dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }
// ★ ANTICIPE-1 (§420) : « Absence de Inès » → « Absence d’Inès » — l'élision devant une voyelle ou un h (VIF-1 écrivait toujours « de »).
function _ckDe(nom){ var s = String(nom || ''); return (/^[aeiouh\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f6\u00f9\u00fb\u00fc\u0153\u00e6]/i.test(s) ? 'd\u2019' : 'de ') + s; }
function _ckPlusJ(t, k){ return new Date(t.getFullYear(), t.getMonth(), t.getDate() + k); }
// AUJ-5 : le point final, sans doubler celui d'une date abrégée (« mar. 13 oct. », jamais « oct.. »).
function _ckPt(s){ return /\.$/.test(s) ? s : s + '.'; }
// SECT-1 (§264) : SECTEUR PAR SECTEUR dès que le domaine en a plusieurs (relevé par commune de l'Accueil, _wxSecteurs) ;
//   sinon les prévisions du domaine (METEO_HOURLY). Mêmes seuils. Dessous : ce qui est en cours (_ckEnCours, AUJ-8).
function _ckMeteoJour(h, iso){
  var mm = 0, vent = 0, vuV = false, h0 = null, h1 = null, vu = false;
  for(var i = 0; i < h.time.length; i++){
    var s = String(h.time[i]); if(s.slice(0, 10) !== iso) continue;
    vu = true;
    var p = Number(h.precip[i]) || 0, wv = h.wind ? h.wind[i] : null, w = Number(wv) || 0, hh = parseInt(s.slice(11, 13), 10);
    if(wv != null && isFinite(Number(wv))) vuV = true;
    mm += p; if(w > vent) vent = w;
    if(p >= 0.2){ if(h0 === null) h0 = hh; h1 = hh + 1; }
  }
  // AUJ-8 (§312) : un vent jamais relevé est inconnu (null), pas 0 km/h.
  return { vu: vu, mm: Math.round(mm * 10) / 10, vent: vuV ? Math.round(vent) : null, h0: h0, h1: h1 };
}
// AUJ-8 : la bande des cinq jours (_pilCk2Modele) prend le même calcul que les lignes.
window._ckMeteoJour = _ckMeteoJour;
function _ckMm(v){ return String(v).replace('.', ',') + '\u202fmm'; }
function _ckEt(l){ return l.join(', ').replace(/, ([^,]*)$/, ' et $1'); }
window._ckEt = _ckEt;   // DIRECT-1 (§318) : « Victor, Shana et Alicia » — le modèle du cockpit (pilotage.js) en a besoin
// ★ AUJ-8 (§312) — CE QUI EST EN COURS LÀ OÙ IL PLEUT OU VENTE : un fait, jamais un verdict (« ce n'est pas à l'appli de décider »).
//   Tâche du plan commencée au calendrier ce jour-là et pas finie ; ses parcelles pas encore faites dans les communes touchées.
//   ⚠️ Commune rangée { nom, lat, lng } (FORME-1) : lue en texte, le compte par secteur valait toujours zéro.
function _ckCommuneDe(p){
  var c = p && p.commune;
  return String((c && typeof c === 'object') ? (c.nom || '') : (c || '')).trim();
}
function _ckEnCours(rows, plan, iso, communes){
  if(!plan || !Array.isArray(plan.parcs) || !plan.parcs.length) return [];
  var dom = String(window._domaineCommuneNom || 'Domaine'), out = [];
  var dans = function(p){ return !communes || communes.indexOf(_ckCommuneDe(p) || dom) >= 0; };
  window._ckPlanTaches(rows).forEach(function(r){
    if((Number(r.pct) || 0) >= 100) return;
    var deb = _ckPlanDebut(plan.fen, r.nom);
    if(!deb || deb > iso) return;
    var et = window._ckPlanEtats(plan.parcs, plan.journal, r.nom, deb, false);
    var n = plan.parcs.filter(function(p){ var e = p && et[p.nom]; return p && dans(p) && (e === 'afaire' || e === 'cours' || e === 'retard'); }).length;
    if(n) out.push({ nom: r.nom, n: n, deb: deb });
  });
  return out.sort(function(a, b){ return a.deb < b.deb ? -1 : (a.deb > b.deb ? 1 : 0); });
}
function _ckEnCoursTxt(l, communes){
  if(!l || !l.length) return '';
  var s = function(n){ return n > 1 ? 's' : ''; };
  var lib = function(n){ var x = String((typeof window.tNom === 'function') ? window.tNom(n) : n); return x.charAt(0).toLowerCase() + x.slice(1); };
  var t = l.slice(0, 3).map(function(x, k){ return lib(x.nom) + ', ' + x.n + (k ? '' : ' parcelle' + s(x.n) + ' pas encore faite' + s(x.n)); }).join(' ; ');
  var r = l.length - 3;
  if(r > 0) t += ' ; et ' + r + ' autre' + s(r) + ' tâche' + s(r);
  return 'En cours' + (communes && communes.length ? ' sur ' + _ckEt(communes) : '') + ' : ' + t + '.';
}
window._ckSvMeteo = function(H, rows, now, secteurs, plan){
  var t = now || new Date(), out = [];
  var sect = (secteurs || []).filter(function(s){ return s && s.nom && s.h && Array.isArray(s.h.time) && Array.isArray(s.h.precip); });
  [1, 2].forEach(function(k){
    var dt = _ckPlusJ(t, k), iso = _ckIso(dt), quand = k === 1 ? 'Demain' : _ckMaj1(dt.toLocaleDateString('fr-FR', { weekday: 'long' }));
    if(sect.length){
      var tou = [];
      sect.forEach(function(s){ var j = _ckMeteoJour(s.h, iso); if(j.vu && (j.mm >= _CK_SV.pluie || j.vent >= _CK_SV.vent)) tou.push({ nom: s.nom, j: j }); });
      if(!tou.length) return;
      var pl = tou.filter(function(x){ return x.j.mm >= _CK_SV.pluie; }), ve = tou.filter(function(x){ return x.j.vent >= _CK_SV.vent; }), tt = '';
      if(pl.length === 1) tt = 'Pluie annoncée sur ' + pl[0].nom + ' : ' + _ckMm(pl[0].j.mm) + (pl[0].j.h0 !== null ? ', de ' + pl[0].j.h0 + '\u00a0h à ' + pl[0].j.h1 + '\u00a0h' : '');
      else if(pl.length > 1) tt = 'Pluie annoncée sur ' + _ckEt(pl.map(function(x){ return x.nom + ' (' + _ckMm(x.j.mm) + ')'; }));
      if(ve.length) tt += (tt ? ' ; vent à ' : 'Vent annoncé à ') + Math.max.apply(null, ve.map(function(x){ return x.j.vent; })) + '\u202fkm/h sur ' + _ckEt(ve.map(function(x){ return x.nom; }));
      // ★ AUJ-8 (§312) : sous la ligne, un FAIT — ce qui est en cours dans les communes touchées —, jamais un verdict.
      var com = tou.map(function(x){ return x.nom; }), ec = _ckEnCours(rows, plan, iso, com);
      var sous = _ckEnCoursTxt(ec, com), prio = ec.length ? 1 : 2;
      out.push({ cat: 'meteo', prio: prio, quand: quand, titre: tt, sous: sous });
      return;
    }
    if(!H || !Array.isArray(H.time) || !Array.isArray(H.precip)) return;
    var j = _ckMeteoJour(H, iso);
    if(!j.vu || (j.mm < _CK_SV.pluie && j.vent < _CK_SV.vent)) return;
    var t1 = j.mm >= _CK_SV.pluie ? 'Pluie annoncée : ' + _ckMm(j.mm) + (j.h0 !== null ? ', de ' + j.h0 + '\u00a0h à ' + j.h1 + '\u00a0h' : '') : '';
    if(j.vent >= _CK_SV.vent) t1 += (t1 ? ', vent à ' : 'Vent annoncé à ') + j.vent + '\u202fkm/h';
    var ecD = _ckEnCours(rows, plan, iso, null);
    out.push({ cat: 'meteo', prio: ecD.length ? 1 : 2, quand: quand, titre: t1, sous: _ckEnCoursTxt(ecD, null) });
  });
  return out;
};
// ★★ AUJ-5 (§307) — LE PLANNING FAIT FOI. Un jour où la personne n'est pas prévue au planning (week-end, jour sans heures au
//   modèle) ne coupe plus une absence et ne sert jamais de jour de retour : avant, un congé du lundi au vendredi annonçait
//   « De retour le samedi », et un congé de deux semaines s'arrêtait au premier week-end. `travaille(m, date)` est la question
//   posée au planning (pilotage.js/_pilPrevuLe) ; sans elle, le samedi et le dimanche sont chômés. Une absence qui dépasse la
//   semaine est suivie jusqu'à sa fin (62 jours au plus). Un arrêt maladie dit sa fin (Nico, 10/10).
window._ckSvAbsences = function(membres, PE, etatDe, now, travaille){
  if(!PE || typeof etatDe !== 'function') return [];
  var t = now || new Date(), out = [], loin = _CK_SV.loin || 62;
  var prevu = typeof travaille === 'function' ? travaille : function(m, dt){ var w = dt.getDay(); return w !== 0 && w !== 6; };
  (membres || []).forEach(function(m){
    if(!m || m.statut === 'Inactif' || m.bureau || !m.nom) return;
    var etatLe = function(k){
      var dt = _ckPlusJ(t, k), by = PE[m.nom] && PE[m.nom][dt.getFullYear()];
      var e = by && by[dt.getMonth()] && by[dt.getMonth()][dt.getDate()];
      return e ? etatDe(e) : null;
    };
    var pl = null, k;
    for(k = 1; k <= loin; k++){
      if(!pl && k > _CK_SV.jours) break;                 // n'annonce que ce qui commence dans la semaine
      var et = etatLe(k);
      if(et && et.etat !== 'present'){
        if(!pl) pl = { etat: et.etat, motif: et.motif || '', debut: k, fin: k };
        else if(pl.etat === et.etat) pl.fin = k;
        else break;
      } else if(pl){
        if(!prevu(m, _ckPlusJ(t, k))) continue;          // un jour non travaillé ne coupe pas l'absence
        break;
      }
    }
    if(!pl) return;
    var ret = null, suite = null;                         // le retour : le premier jour travaillé au planning, sans absence
    for(k = pl.fin + 1; k <= pl.fin + loin; k++){
      var e2 = etatLe(k);
      if(e2 && e2.etat !== 'present'){ suite = e2.etat; break; }   // une autre absence enchaîne : on le dit, pas « pas de retour »
      if(prevu(m, _ckPlusJ(t, k))){ ret = _ckPlusJ(t, k); break; }
    }
    var d0 = _ckPlusJ(t, pl.debut), d1 = _ckPlusJ(t, pl.fin);
    var lib = pl.etat === 'cp' ? 'en congé' : pl.etat === 'recup' ? 'en récupération' : pl.etat === 'maladie' ? 'en arrêt' : 'absent';
    // Le motif (admin seulement) ne cache plus la date : « Formation CACES. De retour le ven. 16 oct. »
    var fin = ret ? _ckPt('De retour le ' + _ckJc(ret)) : (suite ? _ckPt('Puis ' + ({ cp: 'en congé', recup: 'en récupération', maladie: 'en arrêt maladie' }[suite] || 'absence'))
      : 'Pas de retour prévu au planning d’ici deux mois.');
    var sous = pl.etat === 'maladie' ? _ckPt('Fin d’arrêt le ' + _ckJc(d1)) : (pl.motif ? _ckPt(pl.motif) + ' ' : '') + fin;
    // VIF-1 : « absent » ne s'accorde pas sans le genre de la personne (la fiche ne le porte pas) : « Absence de Sophie ».
    out.push({ cat: 'equipe', prio: 2, titre: pl.etat === 'absent' ? 'Absence ' + _ckDe(m.nom) : m.nom + ' ' + lib,
      quand: pl.debut === pl.fin ? (pl.debut === 1 ? 'Demain' : _ckJc(d0)) : 'Du ' + _ckJc(d0) + ' au ' + _ckJc(d1),
      sous: sous, action: 'planning' });
  });
  return out;
};
window._ckSvContrats = function(membres, now, gains){
  var t = now || new Date(), auj = _ckIso(t), lim = _ckIso(_ckPlusJ(t, _CK_SV.contrat)), out = [];
  (membres || []).forEach(function(m){
    if(!m || m.statut === 'Inactif' || typeof m.fin_contrat !== 'string' || m.fin_contrat < auj || m.fin_contrat > lim) return;
    var p = m.fin_contrat.split('-');
    out.push({ cat: 'contrat', prio: 1, quand: _ckJc(new Date(+p[0], +p[1] - 1, +p[2])), titre: 'Fin du contrat de ' + m.nom,
      sous: _ckProlong(gains && gains[m.nom]), action: 'renfort' });
  });
  return out;
};
// PROL-1 (§265) : la phrase du gain d'une prolongation d'un mois (calculé dans pilotage.js par le simulateur de renfort).
function _ckProlong(g){
  if(!g) return 'Le planning en tient compte dès cette date. Pour prolonger ou remplacer, simulez un renfort.';
  if(!(g.h >= 1) && !(g.taches >= 1)) return 'Le prolonger d’un mois ne changerait rien aux travaux de la campagne.';
  var p = [];
  if(g.h >= 1) p.push('éviterait ' + _ckNb(g.h) + '\u202fh de rattrapage' + (g.eur ? ' (env. ' + g.eur + ')' : ''));
  if(g.taches >= 1) p.push('ramènerait ' + g.taches + ' tâche' + (g.taches > 1 ? 's' : '') + ' dans sa fenêtre');
  return 'Le prolonger d’un mois ' + p.join(' et ') + '.';
}
window._ckSvRetards = function(rows, retards){
  var R = retards || {}, out = [];
  (rows || []).forEach(function(r){
    if(!r || !R[r.nom] || (r.pct || 0) >= 100) return;
    var nom = (typeof window.tNom === 'function') ? window.tNom(r.nom) : r.nom;
    out.push({ cat: 'retard', prio: 1, quand: 'Fenêtre passée', titre: nom + ' en retard',
      sous: 'Faite à ' + Math.round(r.pct || 0) + '\u00a0% : le travail restant sort de ses dates.', action: 'campagne' });
  });
  return out;
};
var _CK_SV_ACT = { planning: ['Ouvrir le planning', "goTo('planning')"], renfort: ['Simuler un renfort', "_pilSetTab('sim')"],
  campagne: ['Voir La campagne', "_pilSetTab('camp')"] };
var _CK_SV_IC = { meteo: '\u2614', equipe: '\u263A', contrat: '\u270E', retard: '\u29D7' };

// ── LE DOMAINE EN DIRECT (AUJ-3, §262) : les parcelles rangées par appellation, puis par commune ─────────
//   Un SCHÉMA, pas une carte (la vraie reste dans Parcelles) : une bande par appellation, une bande par
//   parcelle dont la LARGEUR SUIT LA SURFACE, à la même échelle pour tout le domaine — le rapport des
//   surfaces se garde d'une appellation à l'autre. Chaque parcelle prend la couleur de son état pour la tâche
//   choisie ; toucher une parcelle ouvre sa fiche (openDP — FORME-1, §301) : on valide là, par le chemin de toujours.
//   ★★ ETAT-1 (§320) : l'état vient du STATUT de la parcelle dans la période, celui de sa fiche (faite = validée, en cours =
//   commencée) ; en retard = fenêtre passée et pas faite ; arrachée = statut. Le journal ne dit plus que qui y travaille.
//   Les tâches à passages ou à niveaux ne sont pas proposées : une validation n'y dit pas « fini ».
var _CK_PL = { W: 1000, m: 16, h: 64, gap: 3, gapC: 14 };
// ★★ ETAT-1 (§320) — LE STATUT D'UNE TÂCHE SUR UNE PARCELLE, LU COMME SA FICHE (app.js/getTacheStatut : la période consultée,
//   celle du Pilotage). Repli, fonction absente (harnais, ordre de chargement) : le statut écrit de la période active.
function _ckPlanStatut(p, tache){
  if(typeof window.getTacheStatut === 'function') return String(window.getTacheStatut(p, tache) || '');
  var s = p && p.taches && p.taches[tache];
  return typeof s === 'string' ? s : '';
}
// ★ FORME-1 (§301) : UNE lecture pour l'état d'une parcelle ET pour ceux qui y travaillent. deb[parcelle] = la ligne « En cours »
//   qui la met en cours. Avant FORME-1, l'équipe venait du journal du JOUR seul : une parcelle commencée la veille restait « en
//   cours » sans personne dessus, et le plan écrivait « aucune équipe ».
// ★★ ETAT-1 (§320) : l'ÉTAT vient du statut de la parcelle (o.statut, sinon _ckPlanStatut) — faite = validée, en cours =
//   commencée ; un arrachage fini pour l'équipe (app.js/_mvAuPrestataire) est « faite », la suite revient au prestataire. Le
//   journal ne dit plus que QUI : la dernière ligne « En cours » de la période [debutIso, o.fin], le même jour départagé par
//   l'heure du début. Avant, l'état venait du journal : sans borne pour une tâche sans fenêtre (debutIso null — entreplantation
//   sans trou, travaux sans barème : une validation d'une saison passée peignait la parcelle « faite ») et sourd aux annulations
//   (↩ écrit « Annulé », « remis » n'écrit rien). Nico (12/10) : « Entreplantation fait » sur le plan, « À faire » sur la fiche.
function _ckPlanLire(parcs, journal, tache, debutIso, o){
  var etat = {}, deb = {}, lire = (o && typeof o.statut === 'function') ? o.statut : _ckPlanStatut;
  var fin = (o && o.fin) ? String(o.fin) : '', presta = (typeof window._mvAuPrestataire === 'function') ? window._mvAuPrestataire : null;
  // ★ HORS-1 (§322) : la tâche désactivée sur la parcelle — sa fiche dit « Non applicable sur cette parcelle », ou « Pas choisie pour
  //   cette campagne » pour l'arrachage, le désherbage et l'effeuillage (utils.js/_mvTacheConcerne : la règle de la fiche et de
  //   l'avancement) — est « hors » : ni à faire ni en retard, elle ne compte nulle part. Avant, elle restait « à faire ». Nico (12/10).
  var conc = (typeof window._mvTacheConcerne === 'function') ? window._mvTacheConcerne : null;
  (parcs || []).forEach(function(p){
    if(!p || !p.nom) return;
    if(/arrach/i.test(String(p.statut || ''))){ etat[p.nom] = 'arr'; return; }
    if(conc && !conc(p, tache)){ etat[p.nom] = 'hors'; return; }
    var s = lire(p, tache);
    etat[p.nom] = s === 'Validé' ? 'faite' : (s === 'En cours' ? ((presta && presta(p, tache)) ? 'faite' : 'cours') : 'afaire');
  });
  (journal || []).forEach(function(e){
    if(!e || e.tache !== tache || e.statut !== 'En cours' || etat[e.parcelle] !== 'cours') return;
    var d = String(e.date || ''), c = deb[e.parcelle], dc = c ? String(c.date || '') : '';
    if((debutIso && d < debutIso) || (fin && d > fin)) return;
    if(!c || d > dc || (d === dc && (Number(e.ts_debut) || 0) > (Number(c.ts_debut) || 0))) deb[e.parcelle] = e;
  });
  // ★ ETATS-1 (§415) — une parcelle « en cours » SANS entrée « En cours » (un arrachage en étapes : ses étapes sont validées
  //   une à une) : la dernière entrée de la tâche sur la parcelle, dans la période, dit qui y travaille. Avant : « Personne
  //   d'indiqué » (DIRECT-2), alors que l'équipe venait de valider une étape.
  (journal || []).forEach(function(e){ if(!e || e.tache !== tache || etat[e.parcelle] !== 'cours' || (deb[e.parcelle] && deb[e.parcelle].statut === 'En cours')) return;
    // (noms à part : les ancres du premier passage restent uniques pour les contre-épreuves d'ETAT-1)
    var jour = String(e.date || ''), avant = deb[e.parcelle], jourAvant = avant ? String(avant.date || '') : '';
    if(debutIso && jour < debutIso) return; if(fin && jour > fin) return;
    if(!avant || jour > jourAvant || (jour === jourAvant && (Number(e.ts) || Number(e.ts_debut) || 0) > (Number(avant.ts) || Number(avant.ts_debut) || 0))) deb[e.parcelle] = e; });
  return { etat: etat, deb: deb };
}
window._ckPlanEtats = function(parcs, journal, tache, debutIso, enRetard, o){
  var etat = _ckPlanLire(parcs, journal, tache, debutIso, o).etat;
  if(enRetard) Object.keys(etat).forEach(function(n){ if(etat[n] === 'afaire') etat[n] = 'retard'; });
  return etat;
};
// Les parcelles en cours et la ligne « En cours » de chacune : qui l'a commencée, et quel jour.
window._ckPlanDebuts = function(parcs, journal, tache, debutIso, o){ return _ckPlanLire(parcs, journal, tache, debutIso, o).deb; };
var _CK_PL_LIB = { faite: 'faite', cours: 'en cours', afaire: 'à faire', retard: 'en retard', arr: 'arrachée', hors: 'pas concernée' };
window._ckPlanTaches = function(rows){
  return (rows || []).filter(function(t){
    return t && t.nom && !(t.type === 'niveaux' || t.type === 'passages' || t.nom === 'Relevage' || t.nom === 'Ebourgeonnage' || t.nom === 'Pioche');
  });
};
function _ckPlanDebut(fen, nom){
  var w = (fen || []).filter(function(x){ return x && x.nom === nom && x.ws != null; })[0];
  if(!w) return null;
  var d = new Date(Date.UTC(2026, 0, 1) + w.ws * 86400000);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}

// ── La mise en page : à gauche ce qui décide, à droite ce qui arrive ──────────────────────────────

// ── LA BASCULE TERRAIN / ÉCONOMIE (AUJ-4, §263) ─────────────────────────────────────────────────────

// ── Après le dessin : la courbe s'inscrit au kit (tracé, infobulle), les chiffres défilent ────────
