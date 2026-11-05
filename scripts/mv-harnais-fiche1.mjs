// ═══════════════════════════════════════════════════════════
//  HARNAIS FICHE-1 — LA FICHE COMPLÈTE D'UN CLIENT, LES PIÈCES SIGNÉES, LE DÉPÔT (§530)
// ═══════════════════════════════════════════════════════════
//  La maquette docs/maquettes/maquette-fiche-client-v1.html (écrans 1 et 2) :
//  la fiche en pleine page, le registre des preuves d'acceptation, les pièces
//  déposées. Les preuves sont LUES (écrites par le serveur hors du domaine) ;
//  les gestes sont des brouillons (D5) ; les versions en vigueur sont les mêmes
//  partout (serveur, appli, console).
//
//  Usage :  node scripts/mv-harnais-fiche1.mjs
//           node scripts/mv-harnais-fiche1.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { gt: lire('src/admin-gt.js'), fi: lire('src/gt/fiche.js'), pc: lire('src/gt/pieces.js'), fb: lire('src/firebase.js'), ru: lire('firestore.rules'), st: lire('storage.rules'),
  html: lire('src/gt/console.html'), co: lire('src/gt/coquille.js'), cli: lire('src/gt/clients.js'), css: lire('src/styles.css'), app: lire('src/app.js'), fcl: lire('functions/claims.js'), entree: lire('src/gt.js') };
function fonction(src, nom) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function module(src) { return new Function('window', src.replace(/^export /gm, '') + '\nreturn { etatPreuve: typeof etatPreuve!=="undefined"?etatPreuve:null, filtrer: typeof filtrer!=="undefined"?filtrer:null, compte: typeof compte!=="undefined"?compte:null, vue: typeof vue!=="undefined"?vue:null, lignes: typeof lignes!=="undefined"?lignes:null };')({}); }
const V = { cgv: '1.1', dpa: '1.0' };
const ESSAIS = {
  etat(S) {
    const P = module(S.pc);
    return P.etatPreuve(null, V).cle === 'jamais' && P.etatPreuve({ docs: { cgv: { version: '1.1' }, dpa: { version: '1.0' } } }, V).cle === 'ajour'
      && P.etatPreuve({ docs: { cgv: { version: '1.0' }, dpa: { version: '1.0' } } }, V).label === 'Dépassée : CG 1.0 → 1.1'
      && P.etatPreuve({ docs: { cgv: { version: '1.1' }, dpa: { version: '0.9' } } }, V).cle === 'depassee';
  },
  registre(S) {
    const P = module(S.pc), L = [{ slug: 'a', nom: 'Château A', etat: 'ajour', signataire: 'Jean Martin', ref: 'MV-1', deposees: 1 }, { slug: 'b', nom: 'Clos B', etat: 'depassee', signataire: 'Marc', ref: 'MV-2', deposees: 0 }, { slug: 'c', nom: 'Domaine C', etat: 'jamais', deposees: 0 }];
    const n = P.compte(L, [{}, {}, {}]);
    return P.filtrer(L, { onglet: 'arefaire', q: '' }).length === 1 && P.filtrer(L, { onglet: 'sans', q: '' })[0].slug === 'c' && P.filtrer(L, { onglet: 'toutes', q: 'martin' }).length === 1
      && P.filtrer(L, { onglet: 'toutes', q: 'chateau' }).length === 1 && n.toutes === 3 && n.deposees === 3;
  },
  fiche(S) {
    const F = module(S.fi);
    const f = { slug: 'clos-a', i: 0, nom: 'Clos <A>', debut: '2026-09-20', statut: { label: 'Abonné', classe: 'mvpas-type mvpas-vert' }, identite: { raison_sociale: 'SCEA <b>', siret: '', adresse: '', vignoble: '' },
      contact: {}, contrat: { formule: 'Domaine', tarif: '79 € HT par mois · mensuel', debut: '', essai: '', prochain: '01/12/2026', prochainMontant: '79 € HT', resiliation: 'aucune' },   /* seules les cases VIDES doivent dire « — » */
      facturation: { du: 'rien', nRetard: 0, an: 2026, encAn: '0 €', derniere: '' }, signature: { etat: 'jamais', preuve: null }, versions: V, pieces: [], chronologie: [], esc, eur: x => x, dateFr: x => x };
    const h = F.vue(f);
    return h.indexOf('Clos &lt;A&gt;') !== -1 && h.indexOf('<A>') === -1 && h.indexOf('SCEA &lt;b&gt;') !== -1 && h.indexOf('Jamais sign') !== -1 && h.indexOf('<dd>\u2014</dd>') !== -1
      && h.indexOf('+ D\u00e9poser une pi\u00e8ce sign\u00e9e') !== -1 && h.indexOf('Relancer') === -1 && h.indexOf('Aucune preuve d\u2019acceptation') !== -1;
  }
};
const LIB = { etat: '★★ l’état d’une preuve face aux versions en vigueur : à jour, dépassée (laquelle), jamais signée',
  registre: '★ le registre : onglets, recherche sans accents, l’onglet des pièces déposées compte les pièces',
  fiche: '★★ la fiche complète : un nom piégé reste du texte, une case vide dit « — », sans preuve elle le dit, « Relancer » seulement s’il y a du retard' };
function statiques(S) {
  const r = [];
  const vc = /TERMS_CGV_CUR\s*=\s*'([^']+)'/.exec(S.fcl), vd = /TERMS_DPA_CUR\s*=\s*'([^']+)'/.exec(S.fcl), va = /var _MVT_CGV = '([^']+)', _MVT_DPA = '([^']+)';/.exec(S.app), vg = /var _AGT_TEXTES = \{ cgv:'([^']+)', dpa:'([^']+)' \};/.exec(S.gt);
  r.push([!!(vc && vd && va && vg) && vc[1] === va[1] && va[1] === vg[1] && vd[1] === va[2] && va[2] === vg[2], '★★★ les versions en vigueur sont les mêmes au serveur, dans l’appli et dans la console (' + (vg ? vg[1] + ' / ' + vg[2] : '?') + ')']);
  r.push([/window\.fbGtSignatures = async function \(\) \{\n\s+var snap = await getDocs\(collection\(db, '_mv_signatures'\)\);/.test(S.fb) && /collection\(db, '_mv_signatures', String\(slug\), 'hist'\)/.test(S.fb) && !/setDoc\(doc\(db, '_mv_signatures'|updateDoc\(doc\(db, '_mv_signatures'/.test(S.fb + S.gt),
    '★★★ la console LIT les preuves et leur historique, et n’y écrit jamais']);
  r.push([/match \/_mv_signatures\/\{slug\}\/hist\/\{h\} \{\n\s+allow read:\s+if isGtAdmin\(\);\n\s+allow write: if false;/.test(S.ru), '★★ la règle : l’historique est lu par GUERETTECH seul, personne n’y écrit']);
  r.push([/match \/_guerettech\/pieces\/\{slug\}\/\{filename\} \{\n\s+allow read:\s+if isGtAdmin\(\);\n\s+allow create: if isGtAdmin\(\)\n\s+&& request\.resource\.size <= 10 \* 1024 \* 1024/.test(S.st) && /allow update, delete: if false;/.test(S.st.slice(S.st.indexOf('_guerettech/pieces'))),
    '★★★ le stockage des pièces : GUERETTECH seul, 10 Mo, PDF ou image, ni réécriture ni effacement']);
  const dep = fonction(S.gt, '_agtPieceDeposer');
  r.push([/await window\.fbGtPieceDeposer\(slug, fichier\)/.test(dep) && /window\.fbGtMaj\('pieces', function\(d\)\{ var v=Object\.assign\(\{\}, \(d&&d\.value\)\|\|\{\}\);/.test(dep), '★★ une pièce déposée : le fichier au stockage, sa ligne dans _guerettech/pieces par transaction (rien d’écrasé)']);
  const brou = fonction(S.gt, 'agtPiecesDemander') + fonction(S.gt, 'agtPreuveRecu');
  r.push([/window\.location\.href='mailto:/.test(brou) && !/collection\('mail'\)|fbGtMail|sendMail/.test(brou), '★★★ demander la signature, renvoyer le reçu : des brouillons, rien ne part seul (D5)']);
  r.push([/<button class="agt-side-it" data-tab="pieces" onclick="agtSwitchTab\('pieces'\)">/.test(S.html) && /id="agt-side-n-pieces"/.test(S.html) && /pieces: 'pieces'/.test(S.co) && /export function argFiche\(arg\)/.test(S.co)
    && /import '\.\/gt\/fiche\.js';/.test(S.entree) && /import '\.\/gt\/pieces\.js';/.test(S.entree), 'Pièces signées dans la barre (avec son compteur), #pieces et #clients/<slug>/fiche, les deux modules chargés']);
  r.push([/onclick="agtFicheOuvrir\(/.test(S.cli) && /\['agtShowFiche', 'Formule, essai et statut'\]/.test(S.cli), 'Clients : « Fiche complète » ouvre la fiche en pleine page ; l’ancienne fenêtre garde la formule, l’essai et le statut']);
  r.push([/\.agt-fc-grille\{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;\}/.test(S.css) && /\.agt-fc-bandeau\{display:flex;justify-content:space-between;align-items:flex-end;/.test(S.css), 'la feuille : la grille et le bandeau de la maquette, à l’identique']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · sur des données ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
  console.log('\n── 2 · le câblage ──');
  for (const [c, q] of statiques(SRC)) pose(c, q);
  console.log('\n' + '─'.repeat(30) + '\n  ' + verts + ' vert · ' + rouges + ' rouge\n' + '─'.repeat(30));
  process.exit(rouges ? 1 : 0);
}
const okC = [], koC = [];
function mord(titre, fichier, ancre, remplace, essai) {
  const n = SRC[fichier].split(ancre).length - 1;
  if (n !== 1) { koC.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
  const S2 = Object.assign({}, SRC, { [fichier]: SRC[fichier].replace(ancre, remplace) });
  let detecte;
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★★ la console annonce une version que le serveur ne sert pas', 'gt', "var _AGT_TEXTES = { cgv:'1.1', dpa:'1.0' };", "var _AGT_TEXTES = { cgv:'1.2', dpa:'1.0' };", 'statiques');
mord('★★ une preuve dépassée passe pour à jour', 'pc', "  if (c === versions.cgv && d === versions.dpa) return", "  if (c === versions.cgv) return", 'etat');
mord('★★★ l’historique s’ouvre en écriture', 'ru', "    match /_mv_signatures/{slug}/hist/{h} {\n      allow read:  if isGtAdmin();\n      allow write: if false;", "    match /_mv_signatures/{slug}/hist/{h} {\n      allow read:  if isGtAdmin();\n      allow write: if isGtAdmin();", 'statiques');
mord('★★★ une pièce déposée s’efface', 'st', "      allow update, delete: if false;", "      allow update, delete: if isGtAdmin();", 'statiques');
mord('★★★ la demande de signature part toute seule', 'gt', "  try{ window.location.href='mailto:?bcc='", "  try{ window.fbGtMail && window.fbGtMail(bcc); window.location.href='mailto:?bcc='", 'statiques');
mord('★★ un nom piégé s’affiche tel quel', 'fi', "<h2 class=\"agt-fc-nom\">' + esc(f.nom) + '</h2>'", "<h2 class=\"agt-fc-nom\">' + f.nom + '</h2>'", 'fiche');
mord('★ une case vide reste blanche', 'fi', "esc(p[1] == null || p[1] === '' ? '\\u2014' : p[1])", "esc(p[1] == null ? '' : p[1])", 'fiche');
mord('★ l’onglet des pièces compte les domaines', 'pc', "  if (deposees) n.deposees = deposees.length;", "", 'registre');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
