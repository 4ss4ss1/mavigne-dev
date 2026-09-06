// ════════════════════════════════════════════════════════════════════════════
// mv-harnais-vendange-garde.mjs — VD-GARDE / VD-SAVE
// ════════════════════════════════════════════════════════════════════════════
// Trois choses a tenir dans le Cuvier :
//   1. _vendLectureSeule() (cave.js) doit rendre EXACTEMENT ce que rend
//      deriveRo() (functions/claims.js) — les deux fichiers sont lus et joues
//      cote a cote, pas recopies ici : une regle dupliquee ne se surveille que
//      par comparaison des deux sources reelles.
//   2. _vendFbSave() ne dit « enregistre » que sur { ok:true }.
//   3. Aucun ecrivain de la vendange ne part sans garde de role.
//
// Chemins par new URL(..., import.meta.url) — C26 / piege Windows (§55n).
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const F_CAVE   = fileURLToPath(new URL('../src/cave.js', import.meta.url));
const F_CLAIMS = fileURLToPath(new URL('../functions/claims.js', import.meta.url));
const cave   = fs.readFileSync(F_CAVE, 'utf8');
const claims = fs.readFileSync(F_CLAIMS, 'utf8');

let rouges = 0, verts = 0;
function verifie(nom, cond, detail) {
  if (cond) { verts++; console.log('    \u2713 ' + nom); }
  else { rouges++; console.log('    \u2717 ' + nom + (detail ? '  \u2014 ' + detail : '')); }
}
function bloc(src, debut, fin, depuis) {
  const i = src.indexOf(debut, depuis || 0);
  if (i === -1) throw new Error('ancre introuvable : ' + debut);
  const j = src.indexOf(fin, i);
  if (j === -1) throw new Error('fin introuvable pour : ' + debut);
  return src.slice(i, j + fin.length);
}
// Les commentaires ne sont pas du code : quatre fois qu'un controle valide la
// prose ecrite juste au-dessus de l'instruction (§53, §68).
function sansCommentaires(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
          .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(Math.max(0, m.length - p.length)));
}

// ── 1. Miroir exact de deriveRo ─────────────────────────────────────────────
console.log('\n  1. _vendLectureSeule() est le miroir de deriveRo()');
{
  const txtRo   = bloc(claims, 'function deriveRo(roles) {', '\n}\n');
  const txtVend = bloc(cave, 'function _vendLectureSeule(){', '\n}\n');
  const box = { console, window: {}, Object, Array, String };
  box.window.logError = () => {};
  vm.createContext(box);
  vm.runInContext(txtRo + '\n' + txtVend, box);

  const ROLES = ['admin', 'ouvrier', 'tractoriste', 'saisonnier', 'pilotage'];
  let ecarts = [];
  for (let m = 0; m < (1 << ROLES.length); m++) {
    const r = ROLES.filter((_, i) => m & (1 << i));
    if (!r.length) continue;                       // aucun role : cas hors modele
    box.window.currentUser = { roles: r };
    const serveur = vm.runInContext('deriveRo(' + JSON.stringify(r) + ')', box);
    const client  = vm.runInContext('_vendLectureSeule()', box);
    if (!!serveur !== !!client) ecarts.push(r.join('+') + ' serveur=' + serveur + ' client=' + client);
  }
  verifie('les 31 combinaisons de roles donnent le meme verdict', ecarts.length === 0, ecarts.join(' | '));

  box.window.currentUser = null;
  verifie('pas de session -> on laisse faire (le serveur tranchera)', vm.runInContext('_vendLectureSeule()', box) === false);
  box.window.currentUser = { roles: ['tractoriste'] };
  verifie('un TRACTORISTE n\'est pas bloque (canWrite() l\'aurait bloque)', vm.runInContext('_vendLectureSeule()', box) === false);
  box.window.currentUser = { roles: ['pilotage'] };
  verifie('un compte pilotage est bien en lecture seule', vm.runInContext('_vendLectureSeule()', box) === true);
  box.window.currentUser = { roles: ['saisonnier', 'ouvrier'] };
  verifie('saisonnier + ouvrier peut ecrire (comme le serveur)', vm.runInContext('_vendLectureSeule()', box) === false);
}

// ── 2. Le message de succes depend du succes ────────────────────────────────
// ⚠️ Le contrat n'a QU'UNE implementation : `fbSaveToast` (firebase.js). `_vendFbSave`
// ne fait plus que lui passer les bonnes cles. Les deux fichiers sont donc charges et
// joues ENSEMBLE — stubber fbSaveToast ici ne testerait que le passage d'arguments.
console.log('\n  2. _vendFbSave() ne dit « enregistre » que sur ok');
{
  const F_FB = fileURLToPath(new URL('../src/firebase.js', import.meta.url));
  const fb   = fs.readFileSync(F_FB, 'utf8');
  const txt  = bloc(fb, 'window.fbSaveToast = function (paires, msg, coul) {', '\n};\n')
             + '\n' + bloc(cave, 'function _vendFbSave(msg,coul,cles){', '\n}\n');
  async function joue(etat) {
    const toasts = [];
    const box = {
      console, setTimeout, clearTimeout, Promise, Array, Object, String, JSON,
      CAVE_VENDANGE: { recoltes: [1] }, CAVE_ELEVAGE: { cuvees: [] },
      showToast: (m, c) => toasts.push({ m: String(m), c: String(c) }),
      window: {},
    };
    box.window.showToast = box.showToast;      // fbSaveToast passe par window.showToast
    box.window.logError = () => {};
    box.window.fbSave = () => Promise.resolve(etat);
    vm.createContext(box);
    vm.runInContext(txt, box);
    vm.runInContext('_vendFbSave("Récolte enregistrée","#3D6B27")', box);
    await new Promise((r) => setTimeout(r, 30));
    return toasts;
  }
  const okT = await joue({ ok: true });
  verifie('ok -> le message de l\'appelant', okT.length === 1 && okT[0].m === 'Récolte enregistrée', JSON.stringify(okT));

  const qT = await joue({ ok: false, queued: true });
  verifie('en file -> PAS « enregistrée »', !qT.some((t) => t.m.includes('enregistrée')), JSON.stringify(qT));
  verifie('en file -> l\'ecran dit l\'attente', qT.some((t) => t.m.includes('attente')), JSON.stringify(qT));

  const dT = await joue({ ok: false, denied: true });
  verifie('refuse -> PAS « enregistrée »', !dT.some((t) => t.m.includes('enregistrée')), JSON.stringify(dT));
  verifie('refuse -> l\'ecran dit que la saisie est gardee', dT.some((t) => t.m.includes('conserv')), JSON.stringify(dT));

  const bT = await joue({ ok: false, blocked: true });
  verifie('protection anti-perte -> aucun toast en double', bT.length === 0, JSON.stringify(bT));
}

// ── 3. Aucun ecrivain sans garde ────────────────────────────────────────────
console.log('\n  3. tous les ecrivains de la vendange sont gardes');
{
  const c = sansCommentaires(cave);
  verifie('plus aucun fbSave(\'cave_vendange\') nu', c.indexOf("fbSave('cave_vendange'") === -1,
    'restant(s) : ' + (c.match(/fbSave\('cave_vendange'/g) || []).length);

  // Chaque fonction qui appelle _vendFbSave doit contenir une garde de role AVANT.
  const lignes = c.split('\n');
  const debutFn = /^(?:window\.)?(?:function\s+([A-Za-z0-9_$]+)|(?:var|let|const)\s+([A-Za-z0-9_$]+)\s*=\s*function|([A-Za-z0-9_$.]+)\s*=\s*function)/;
  const GARDES = ['_vendGarde(', 'canWrite(', 'isSaisonnier(', 'isAdmin('];
  const nus = [];
  let vus = 0;
  for (let i = 0; i < lignes.length; i++) {
    if (lignes[i].indexOf('_vendFbSave(') === -1) continue;
    if (debutFn.test(lignes[i])) continue;                 // la declaration elle-meme
    let s = -1;
    for (let j = i; j >= 0; j--) { if (debutFn.test(lignes[j])) { s = j; break; } }
    if (s === -1) continue;
    const m = debutFn.exec(lignes[s]);
    const nom = m[1] || m[2] || m[3];
    if (nom === '_vendFbSave') continue;
    vus++;
    const corps = lignes.slice(s, i).join('\n');
    if (!GARDES.some((g) => corps.indexOf(g) !== -1)) nus.push(nom + ' (l.' + (i + 1) + ')');
  }
  verifie('au moins 19 ecrivains inspectes', vus >= 19, 'inspectes=' + vus);
  verifie('aucun ecrivain sans garde de role', nus.length === 0, nus.join(', '));
}

console.log('\n  ' + verts + ' vert(s) \u00b7 ' + rouges + ' rouge(s)');
if (rouges) { console.log('  \u2717 VD-GARDE \u00c9CHOU\u00c9\n'); process.exit(1); }
console.log('  \u2713 VD-GARDE OK\n');
