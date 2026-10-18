#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   TUTO-2 (§359) — L'INVENTAIRE DES GESTES, LU DANS LE CODE
   Lancer : node scripts/mv-tutos-inventaire.mjs   → dist/tutos-inventaire.json (fabriqué : jamais livré ni commité)

   Chaque geste = une fonction lancée par un clic, un choix ou une saisie
   (on*="…" dans index.html et src/*.js, hors console GUERETTECH). Pour chacun :
   le module (fichier où la fonction est DÉFINIE), le libellé à l'écran, le
   contenant (fenêtre de index.html et son titre, ou fonction qui dessine
   l'écran), qui peut le faire (garde en tête de la fonction), s'il parle au
   serveur, et s'il est déjà couvert par un tuto (`couvre` de src/tutos.js).
   Les gestes d'un même contenant forment UN objectif proposé ; fermer, annuler
   et changer d'onglet sont proposés en exemption, avec leur raison.
   C'est une PROPOSITION à valider : relancer le script la régénère depuis le code.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => fs.readFileSync(path.join(R, f), 'utf8');
const HORS = new Set(['src/admin-gt.js', 'src/gt.js', 'src/tutos.js']);
const GENERIQUES = new Set(['$', 'if', 'return', 'event.stopPropagation', 'event.preventDefault', 'closeOv', '_openOv', 'openOv',
  'closeModal', 'history.back', 'this.select', 'this.blur', 'location.reload']);
const MODULE = { 'src/app.js': 'Vigne', 'src/tournees.js': 'Vigne', 'src/comptes.js': 'Vigne', 'src/jalons.js': 'Vigne',
  'src/tracteur.js': 'Tracteur', 'src/phyto.js': 'Phyto', 'src/cave.js': 'Cave', 'src/cuvier.js': 'Cave', 'src/reserve.js': 'Réserve',
  'src/planning.js': 'Planning', 'src/planning-vue.js': 'Planning', 'src/pilotage.js': 'Pilotage', 'src/cockpit.js': 'Pilotage',
  'src/cockpit-vue.js': 'Pilotage', 'src/reglages.js': 'Réglages', 'src/onboarding.js': 'Installation', 'src/utils.js': 'Commun',
  'src/coquille.js': 'Commun', 'src/firebase.js': 'Commun', 'src/ids.js': 'Commun' };

const fichiers = fs.readdirSync(path.join(R, 'src')).filter((f) => f.endsWith('.js')).map((f) => 'src/' + f).filter((f) => !HORS.has(f));
const SRC = {}; for (const f of fichiers.concat(['index.html'])) SRC[f] = lire(f);
const nettoie = (t) => String(t || '').replace(/'\s*\+[^+]*\+\s*'/g, ' ').replace(/\\u00a0/g, ' ').replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#39;|&quot;|\\'/g, ' ').replace(/\s+/g, ' ').trim();

// où la fonction est définie, et son début (pour la garde et le serveur)
function definition(nom) {
  const n = nom.replace(/\$/g, '\\$');
  const res = [new RegExp('function ' + n + '\\s*\\('), new RegExp('window\\.' + n + '\\s*=\\s*(async\\s*)?function'), new RegExp('\\b' + n + '\\s*=\\s*(async\\s*)?function')];
  for (const f of fichiers) {
    for (const re of res) {
      const m = re.exec(SRC[f]);
      if (m) return { f, corps: SRC[f].slice(m.index, m.index + 2500) };
    }
  }
  return null;
}
function role(corps) {
  const t = (corps || '').slice(0, 450);
  if (/isAdmin\(\)\s*(&&|\|\|)\s*!?\s*isTractoriste|isTractoriste\(\)\s*\|\|\s*isAdmin|isAdmin\(\)\|\|isTractoriste\(\)/.test(t)) return 'tractoriste';
  if (/!\s*isAdmin\(\)|!_mvMoiAdmin\(\)|_mvMoiAdmin\(\)\)\s*return|isAdmin\(\)\)\s*\{?\s*showToast\('R/.test(t)) return 'admin';
  if (/!\s*canWrite\(\)/.test(t)) return 'ouvrier';
  return 'tous';
}
const serveur = (corps) => /fbCallFn\(|uploadBytes|_mvUpload|fbUpload|httpsCallable|sendPasswordReset|updatePassword/.test(corps || '');
function exemption(nom, lib) {
  if (/^(close|cancel|annuler|fermer|_ferme|_mvFermer|hide|_hide)|Close$|Cancel$|Annuler$|Fermer$/i.test(nom) || /^(annuler|fermer|retour)$/i.test(lib)) return 'fermer ou annuler';
  if (/^(switch|_?goTo$|_dockGo|_dockPlus|setTab|_pilSetTab|showTab)|Onglet|Ong$|Tab$/i.test(nom)) return 'onglet ou navigation';
  return '';
}
// le contenant : fenêtre de index.html (et son titre) ou fonction qui dessine
const FENETRES = [];
for (const m of SRC['index.html'].matchAll(/<div class="overlay[^"]*" id="([^"]+)"/g)) {
  const bloc = SRC['index.html'].slice(m.index, m.index + 4000);
  const t = /class="modal-title"[^>]*>([\s\S]*?)<\/div>/.exec(bloc);
  FENETRES.push({ i: m.index, id: m[1], titre: t ? nettoie(t[1]) : '' });
}
for (const m of SRC['index.html'].matchAll(/<div class="page[^"]*" id="(page-[^"]+)"/g)) FENETRES.push({ i: m.index, id: m[1], titre: '' });
FENETRES.sort((a, b) => a.i - b.i);
function contenant(f, i) {
  if (f === 'index.html') { let c = null; for (const w of FENETRES) { if (w.i <= i) c = w; else break; } return c ? { cle: c.id, titre: c.titre } : { cle: 'index', titre: '' }; }
  const avant = SRC[f].slice(0, i), m = [...avant.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].pop();
  return { cle: f + '#' + (m ? m[1] : '?'), titre: '' };
}
function libelle(s, i) {
  const fin = s.indexOf('>', i);
  const tag = s.slice(Math.max(0, s.lastIndexOf('<', i)), fin + 1);
  const attr = /(?:aria-label|title|data-tip)=\\?["']([^"'\\]+)/.exec(tag);
  const apres = fin > 0 ? s.slice(fin + 1, fin + 220) : '';
  const txt = nettoie(apres.split(/<\/(?:button|div|span|a|label|option)>/)[0]);
  const propre = (x) => x && x.length > 1 && x.length < 70 && !/[<>{}$=;]|'\s*\+|\+\s*'|\|\||&#|\\|^['"+ ]|\?\s*'/.test(x);
  const t = propre(txt) ? txt : (attr && propre(nettoie(attr[1])) ? nettoie(attr[1]) : '');
  return t.replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').replace(/[^A-Za-zÀ-ÿ0-9)…]+$/, '').slice(0, 80);
}

const couvre = new Set([...lire('src/tutos.js').matchAll(/couvre:\s*\[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])));
const gestes = {};
for (const [f, s] of Object.entries(SRC)) {
  for (const m of s.matchAll(/on(click|change|input|submit|keyup|keydown)\s*=\s*\\?["']\s*([A-Za-z_$][\w$.]*)/g)) {
    const nom = m[2].replace(/^window\./, '');
    if (GENERIQUES.has(nom)) continue;
    const g = gestes[nom] || (gestes[nom] = { nom, libelles: [], contenants: [], evts: [] });
    const lib = libelle(s, m.index); if (lib && !g.libelles.includes(lib)) g.libelles.push(lib);
    const c = contenant(f, m.index); if (!g.contenants.some((x) => x.cle === c.cle)) g.contenants.push(c);
    if (!g.evts.includes(m[1])) g.evts.push(m[1]);
    const av = s.slice(Math.max(0, m.index - 260), m.index);
    if (/isAdmin\(\)\s*\?|isAdmin\(\)\s*&&|_mvMoiAdmin\(\)\s*\?/.test(av)) g.vu = 'admin';
    else if (!g.vu && /canEdit\s*\?|isTractoriste\(\)\s*\?/.test(av)) g.vu = 'tractoriste';
  }
}
for (const g of Object.values(gestes)) {
  const d = definition(g.nom);
  g.module = d ? (MODULE[d.f] || 'Commun') : 'Commun';
  g.defini = d ? d.f : '';
  g.role = d ? role(d.corps) : 'tous';
  if (g.role === 'tous' && g.vu) g.role = g.vu;
  g.serveur = d ? serveur(d.corps) : false;
  g.exempt = exemption(g.nom, g.libelles[0] || '');
  g.fait = couvre.has(g.nom);
}
// objectifs proposés : un par contenant principal
const obj = {};
for (const g of Object.values(gestes)) {
  if (g.exempt) continue;
  const c = g.contenants[0];
  const cle = g.module + '|' + c.cle;
  const o = obj[cle] || (obj[cle] = { cle, module: g.module, fenetre: c.cle, titreFenetre: c.titre, gestes: [] });
  o.gestes.push(g.nom);
}
const ordreRole = ['tous', 'ouvrier', 'tractoriste', 'admin'];
for (const o of Object.values(obj)) {
  const gs = o.gestes.map((n) => gestes[n]);
  o.libelles = [...new Set(gs.flatMap((g) => g.libelles))].slice(0, 6);
  const VERBE = /^(Enregistrer|Ajouter|Valider|D\u00e9marrer|Demarrer|Supprimer|Exporter|Imprimer|Cr\u00e9er|Modifier|Noter|Saisir|Importer|Envoyer|Renommer|Terminer|Corriger|Appliquer|Diffuser|Poser|Choisir|Changer|Ouvrir|Voir|Lancer|G\u00e9n\u00e9rer|T\u00e9l\u00e9charger|D\u00e9clarer|R\u00e9gler|Restaurer|Sauvegarder|Planifier|Marquer|Passer|Retirer|D\u00e9cuver|Entonner|Assembler|Compl\u00e9ter|Archiver|Cl\u00f4turer|Dupliquer|Copier|Partager)/i;
  o.titre = o.titreFenetre || (o.libelles.find((l) => VERBE.test(l)) || o.libelles[0] || '');
  o.fonction = o.fenetre.split('#').pop();
  o.role = gs.map((g) => g.role).sort((a, b) => ordreRole.indexOf(b) - ordreRole.indexOf(a))[0];
  o.serveur = gs.some((g) => g.serveur);
  o.fait = gs.every((g) => g.fait) ? 'fait' : (gs.some((g) => g.fait) ? 'en partie' : 'à faire');
}
const sortie = { genere: new Date().toISOString().slice(0, 10), gestes: Object.values(gestes).sort((a, b) => a.module.localeCompare(b.module) || a.nom.localeCompare(b.nom)),
  objectifs: Object.values(obj).sort((a, b) => a.module.localeCompare(b.module) || b.gestes.length - a.gestes.length) };
fs.mkdirSync(path.join(R, 'dist'), { recursive: true });
fs.writeFileSync(path.join(R, 'dist/tutos-inventaire.json'), JSON.stringify(sortie, null, 1) + '\n');
const ex = sortie.gestes.filter((g) => g.exempt);
console.log('gestes : ' + sortie.gestes.length + ' · exemptés proposés : ' + ex.length + ' (fermer ' + ex.filter((g) => g.exempt.startsWith('fermer')).length + ', onglets ' + ex.filter((g) => g.exempt.startsWith('onglet')).length + ')');
console.log('objectifs proposés : ' + sortie.objectifs.length + ' · parlent au serveur : ' + sortie.objectifs.filter((o) => o.serveur).length + ' · faits : ' + sortie.objectifs.filter((o) => o.fait !== 'à faire').length);
const parMod = {}; for (const o of sortie.objectifs) parMod[o.module] = (parMod[o.module] || 0) + 1;
console.log(Object.entries(parMod).map(([m, n]) => m + ' ' + n).join(' · '));
const parRole = {}; for (const o of sortie.objectifs) parRole[o.role] = (parRole[o.role] || 0) + 1;
console.log('rôles : ' + Object.entries(parRole).map(([m, n]) => m + ' ' + n).join(' · '));
