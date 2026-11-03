// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt/leads.js — L'ÉCRAN LEADS DE LA CONSOLE GUERETTECH — GT-UI-5, §520
// ════════════════════════════════════════════════════════════════════════════
// La maquette v1 (docs/maquettes/maquette-console-gt-v1.html, MAQ-1) : les demandes du site en COLONNES par statut
// (Nouveau, Répondu, Mise en route, Installé, Sans suite) ou en tableau, et la fiche d'une demande à côté — ce que le
// domaine a dit de lui, le statut à choisir, la note, « Répondre » (un brouillon dans la messagerie, jamais envoyé
// seul), la pièce jointe, la copie.
// Ce fichier ne lit la console que par `window._agtLeadsDonnees()` et n'agit que par ses gestes publics
// (agtLeadSet, agtLeadNote, agtLeadMail, agtLeadPj, agtLeadCopy).
// ⚠️ Chargé par src/gt.js, sur gt.html seulement.
// ════════════════════════════════════════════════════════════════════════════

export var COLONNES = ['nouveau', 'repondu', 'mer', 'installe', 'perdu'];
var ST_COUL = { nouveau: 'mvpas-retard', repondu: 'mvpas-encours', mer: 'mvpas-surveiller', installe: 'mvpas-fait', perdu: 'mvpas-afaire' };
var E = { vue: 'colonnes', ouvert: '', q: '' };
function _escAttr(v) { return (typeof window !== 'undefined' && window._escAttr) ? window._escAttr(v) : String(v == null ? '' : v).replace(/[\\'"<>&]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
function plier(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

// ── Les fonctions pures (le harnais gtui5 les joue) ──────────────────────────
// Où se range une demande, et ce qu'on en dit sur sa carte : la région ou la commune, la surface, l'ancienneté.
export function ranger(leads) {
  var c = {}; COLONNES.forEach(function (k) { c[k] = []; });
  (leads || []).forEach(function (l) { (c[COLONNES.indexOf(l.st) >= 0 ? l.st : 'nouveau']).push(l); });
  return c;
}
export function sousTitre(l, maintenant) {
  var lieu = l.region || l.commune || l.ville || '', ha = l.surface ? String(l.surface).replace('.', ',') + ' ha' : '';
  var t = Date.parse(l.createdAt || ''), age = '';
  if (t) {
    var h = Math.floor(((maintenant || Date.now()) - t) / 3600000);
    age = h < 24 ? ('re\u00e7u il y a ' + Math.max(1, h) + ' h') : ('re\u00e7u il y a ' + Math.floor(h / 24) + ' j');
  }
  return [lieu, ha, age].filter(Boolean).join(' \u00b7 ');
}
// La pastille de relance d'une carte (la maquette) : « Relance en retard de N jours » ou « Relancer le jj/mm ».
export function relancePastille(l, d) {
  if (!l.relance || l.st === 'installe' || l.st === 'perdu') return '';
  if (l.retard > 0) return '<span class="mvpas mvpas-statut mvpas-retard">Relance en retard de ' + l.retard + ' jour' + (l.retard > 1 ? 's' : '') + '</span>';
  return '<span class="mvpas mvpas-statut mvpas-afaire">Relancer le ' + String(l.relance).slice(8, 10) + '/' + String(l.relance).slice(5, 7) + '</span>';
}
export function chercher(leads, q) {
  q = plier(q).trim();
  if (!q) return leads || [];
  return (leads || []).filter(function (l) { return plier([l.domaine, l.commune, l.ville, l.region, l.email, l.note].join(' ')).indexOf(q) >= 0; });
}

// ── Le dessin ─────────────────────────────────────────────────────────────────
function fiche(l, d) {
  var esc = d.esc;
  var h = '<aside class="agt-inc-fiche" aria-label="Fiche de la demande">';
  h += '<div class="agt-inc-fiche-tete"><div class="agt-inc-fiche-sur">' + esc(sousTitre(l)) + '</div>'
    + '<button class="agt-inc-x" onclick="agtLeadsOuvrir(\'\')" aria-label="Fermer la fiche">\u00d7</button></div>';
  h += '<h3 class="agt-inc-fiche-titre">' + esc(l.domaine || 'Demande sans nom') + '</h3>';
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Statut</div><div class="agt-inc-outils">' + COLONNES.map(function (k) {
    return '<button class="mvpas mvpas-filtre' + (l.st === k ? ' on' : '') + '" aria-pressed="' + (l.st === k) + '" onclick="agtLeadSet(\'' + _escAttr(l._id) + '\',\'' + _escAttr(k) + '\')">' + esc(d.st[k] || k) + '</button>';
  }).join('') + '</div></div>';
  var lignes = [['Contact', [l.email, l.tel].filter(Boolean).join(' \u00b7 ')], ['Lieu', [l.commune || l.ville, l.cp, l.region].filter(Boolean).join(' \u00b7 ')],
    ['Vignoble', [l.surface ? (String(l.surface).replace('.', ',') + ' ha') : '', l.nbparc ? (l.nbparc + ' parcelles') : '', l.cuvees ? (l.cuvees + ' cuv\u00e9es') : ''].filter(Boolean).join(' \u00b7 ')],
    ['\u00c9quipe', [l.users ? (l.users + ' personnes') : '', l.perm ? (l.perm + ' permanents') : '', l.saiso ? (l.saiso + ' saisonniers') : ''].filter(Boolean).join(' \u00b7 ')],
    ['Conduite', l.conduite || ''], ['Engins', l.engins || ''], ['Modules', Array.isArray(l.modules) ? l.modules.join(', ') : (l.modules || '')],
    ['Mise en route', l.mer || ''], ['Parcellaire', l.parcellaire ? 'joint' : '']].filter(function (x) { return x[1]; });
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Ce que le domaine a dit</div><dl class="agt-inc-dl">' + lignes.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>'
    + (l.message ? '<pre class="agt-fac-relance" style="margin-top:8px">' + esc(l.message) + '</pre>' : '') + '</div>';
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Relancer le</div><div class="agt-inc-outils">'
    + '<input id="agt-lead-rel" class="agt-inc-sel" type="date" aria-label="Date de relance" value="' + esc(l.relance || '') + '">'
    + '<button class="agt-btn agt-inc-court" onclick="agtLeadRelance(\'' + _escAttr(l._id) + '\',(document.getElementById(\'agt-lead-rel\')||{}).value||\'\')">Enregistrer</button>'
    + (l.relance ? '<button class="agt-btn agt-inc-court" onclick="agtLeadRelance(\'' + _escAttr(l._id) + '\',\'\')">Retirer</button>' : '') + '</div>'
    + '<p class="agt-cli-note">Le jour venu, un mail \u00ab Relance \u00e0 faire \u00bb vous arrive et le Radar la remonte ; rien ne part chez le prospect.</p></div>';
  h += '<div class="agt-inc-bloc"><div class="agt-inc-h4">Note</div>' + (l.note ? '<p class="agt-cli-note" style="white-space:pre-wrap">' + esc(l.note) + '</p>' : '<p class="agt-cli-note">Aucune note.</p>')
    + '<button class="agt-btn agt-inc-court" onclick="agtLeadNote(\'' + _escAttr(l._id) + '\')">' + (l.note ? 'Modifier la note' : '+ Note') + '</button></div>';
  h += '<div class="agt-inc-actions"><button class="agt-btn fill agt-inc-court" onclick="agtLeadMail(\'' + _escAttr(l._id) + '\')">R\u00e9pondre</button>'
    + (l.parcellaire ? '<button class="agt-btn agt-inc-court" onclick="agtLeadPj(\'' + _escAttr(l._id) + '\')">Parcellaire joint</button>' : '')
    + '<button class="agt-btn agt-inc-court" onclick="agtLeadCopy(\'' + _escAttr(l._id) + '\')">Copier la demande</button></div>'
    + '<p class="agt-cli-note">\u00ab R\u00e9pondre \u00bb ouvre un brouillon dans votre messagerie : rien ne part sans votre \u00ab Envoyer \u00bb.</p>';
  return h + '</aside>';
}
export function vue(d) {
  var esc = d.esc, tout = chercher(d.leads || [], E.q), cols = ranger(tout);
  var ouvert = E.ouvert ? (d.leads || []).filter(function (l) { return l._id === E.ouvert; })[0] : null;
  var h = '<div class="agt-inc agt-leads"><div class="agt-inc-outils">'
    + [['colonnes', 'Colonnes'], ['tableau', 'Tableau']].map(function (v) { return '<button class="mvpas mvpas-filtre' + (E.vue === v[0] ? ' on' : '') + '" aria-pressed="' + (E.vue === v[0]) + '" onclick="agtLeadsVue(\'' + _escAttr(v[0]) + '\')">' + v[1] + '</button>'; }).join('')
    + '<input id="agt-leads-q" class="agt-inc-q" type="search" placeholder="Chercher un domaine, une commune, une adresse" aria-label="Chercher une demande" value="' + esc(E.q) + '" oninput="agtLeadsCherche(this.value)"></div>';
  h += '<div class="agt-inc-corps' + (ouvert ? ' avec-fiche' : '') + '">' + (ouvert ? fiche(ouvert, d) : '') + '<div style="flex:1;min-width:0">';
  if (E.vue === 'colonnes') {
    h += '<div class="agt-leads-cols">' + COLONNES.map(function (k) {
      return '<section class="agt-leads-col" aria-label="' + esc(d.st[k] || k) + '"><div class="agt-leads-col-t"><span>' + esc(d.st[k] || k) + '</span><span class="mvpas mvpas-compteur">' + cols[k].length + '</span></div>'
        + cols[k].map(function (l) {
          return '<div class="mvcarte-fond agt-leads-fiche' + (l._id === E.ouvert ? ' on' : '') + '" tabindex="0" onclick="agtLeadsOuvrir(\'' + _escAttr(l._id) + '\')" onkeydown="if(event.key===\'Enter\')agtLeadsOuvrir(\'' + _escAttr(l._id) + '\')">'
            + '<b>' + esc(l.domaine || 'Demande sans nom') + '</b><span class="agt-tbl-sous">' + esc(sousTitre(l)) + '</span>'
            + (l.note ? '<span class="agt-leads-note">' + esc(String(l.note).split('\n')[0].slice(0, 90)) + '</span>' : '') + relancePastille(l, d) + '</div>';
        }).join('') + '</section>';
    }).join('') + '</div>';
  } else {
    h += '<div class="agt-tbl-cadre"><table class="agt-tbl"><thead><tr><th style="padding:8px 12px">Domaine</th><th style="padding:8px 12px">Contact</th><th style="padding:8px 12px">Re\u00e7ue</th><th style="padding:8px 12px">Statut</th></tr></thead><tbody>'
      + (tout.length ? tout.map(function (l) {
        return '<tr class="' + (l._id === E.ouvert ? 'on' : '') + '" tabindex="0" onclick="agtLeadsOuvrir(\'' + _escAttr(l._id) + '\')" onkeydown="if(event.key===\'Enter\')agtLeadsOuvrir(\'' + _escAttr(l._id) + '\')">'
          + '<td class="agt-tbl-titre"><span class="agt-tbl-msg">' + esc(l.domaine || 'Demande sans nom') + '</span><span class="agt-tbl-sous">' + esc(sousTitre(l)) + '</span></td>'
          + '<td>' + esc(l.email || l.tel || '\u2014') + '</td><td>' + esc(d.dateFr(l.createdAt)) + '</td>'
          + '<td><span class="mvpas mvpas-statut ' + (ST_COUL[l.st] || 'mvpas-afaire') + '">' + esc(d.st[l.st] || l.st) + '</span></td></tr>';
      }).join('') : '<tr><td colspan="4"><div class="agt-inc-vide">Aucune demande.</div></td></tr>') + '</tbody></table></div>';
  }
  return h + '</div></div></div>';
}

// ── Les gestes de l'écran ─────────────────────────────────────────────────────
function rendre() { if (window.agtRenderBody) window.agtRenderBody(); }
window._agtLeadsVue = vue;
window.agtLeadsVue = function (v) { E.vue = (v === 'tableau') ? 'tableau' : 'colonnes'; rendre(); };
window.agtLeadsOuvrir = function (id) { E.ouvert = (id && E.ouvert !== id) ? String(id) : ''; rendre(); };
window.agtLeadsCherche = function (v) {
  E.q = String(v || ''); rendre();
  var i = document.getElementById('agt-leads-q'); if (i) { i.focus(); try { i.setSelectionRange(E.q.length, E.q.length); } catch (e) { if (window.logError) window.logError({ level: 'info', cat: 'ui', msg: 'curseur de la recherche non pos\u00e9', detail: String((e && e.message) || e) }); } }
};
