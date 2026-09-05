// ════════════════════════════════════════════════════════════════════════════
// mv-harnais-toast-honnete.mjs — LE MESSAGE DE SUCCES ATTEND LE SUCCES
// ════════════════════════════════════════════════════════════════════════════
// `fbSave` rend un etat depuis le 25/08 (§68). Ecrire un contrat et le brancher
// sont deux lots : pendant huit jours, vingt-quatre appelants directs l'ont ignore
// et affichaient « enregistre » en vert dans la milliseconde — dont vingt-deux dans
// le planning (conges, acomptes, cadre legal, heures sup).
//
// Ce harnais tient deux choses :
//   1. `fbSaveToast` / `fbToastApres` (firebase.js) respectent le contrat — verifie
//      en EXECUTANT le code reel extrait du fichier, pas en le relisant.
//   2. ★ L'INVARIANT GLOBAL : plus aucun appel direct a `fbSave` suivi d'un toast
//      de succes, dans aucun module. C'est cette regle-la qui empeche le prochain
//      lot de recreer le defaut ailleurs — le point 1 seul ne protegerait que les
//      appelants deja convertis.
//
// Chemins par new URL(..., import.meta.url) — C26 / piege Windows (§55n).
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL('../', import.meta.url));
const lire = (rel) => fs.readFileSync(path.join(RACINE, rel), 'utf8');

let rouges = 0, verts = 0;
function verifie(nom, cond, detail) {
  if (cond) { verts++; console.log('    \u2713 ' + nom); }
  else { rouges++; console.log('    \u2717 ' + nom + (detail ? '  \u2014 ' + detail : '')); }
}
function bloc(src, debut, fin) {
  const i = src.indexOf(debut);
  if (i === -1) throw new Error('ancre introuvable : ' + debut);
  const j = src.indexOf(fin, i);
  if (j === -1) throw new Error('fin introuvable pour : ' + debut);
  return src.slice(i, j + fin.length);
}
// Les commentaires ne sont pas du code (§53, §68 : quatre controles ont deja valide
// la prose ecrite au-dessus de l'instruction).
function sansCommentaires(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
          .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(Math.max(0, m.length - p.length)));
}

const FB = lire('src/firebase.js');

// ── 1. Le contrat, execute ──────────────────────────────────────────────────
console.log('\n  1. fbSaveToast() et fbToastApres() rendent compte de la verite');
{
  const code = bloc(FB, 'window.fbSaveToast = function (paires, msg, coul) {', '\n};\n')
             + '\n' + bloc(FB, 'window.fbToastApres = function (etat, msg, coul) {', '\n};\n');

  async function joue(etat, paires) {
    const toasts = [];
    const box = { console, setTimeout, clearTimeout, Promise, Object, Array, String, JSON };
    box.window = box;
    box.showToast = (m, c) => toasts.push({ m: String(m), c: String(c) });
    box.logError = () => {};
    box.fbSave = () => Promise.resolve(etat);
    vm.createContext(box);
    vm.runInContext(code, box);
    const r = box.fbSaveToast(paires === undefined ? { journal: [1] } : paires, 'Acompte enregistré', '#2D7A27');
    await new Promise((res) => setTimeout(res, 30));
    return { toasts, r };
  }

  const A = await joue({ ok: true });
  verifie('ok -> le message de l\'appelant, dans SA couleur',
    A.toasts.length === 1 && A.toasts[0].m === 'Acompte enregistré' && A.toasts[0].c === '#2D7A27', JSON.stringify(A.toasts));

  const B = await joue({ ok: false, queued: true });
  verifie('en file -> PAS « Acompte enregistré »', !B.toasts.some((t) => t.m.includes('Acompte')), JSON.stringify(B.toasts));
  verifie('en file -> l\'ecran dit l\'attente', B.toasts.some((t) => t.m.includes('attente')), JSON.stringify(B.toasts));

  const C = await joue({ ok: false, denied: true });
  verifie('refuse -> PAS « Acompte enregistré »', !C.toasts.some((t) => t.m.includes('Acompte')), JSON.stringify(C.toasts));
  verifie('refuse -> la saisie est annoncee conservee', C.toasts.some((t) => t.m.includes('conserv')), JSON.stringify(C.toasts));

  const D = await joue({ ok: false, blocked: true });
  verifie('protection anti-perte -> aucun toast en double', D.toasts.length === 0, JSON.stringify(D.toasts));

  // ⚠️ paires null = RIEN n'a ete ecrit (selection vide). Le message ne dit alors pas
  //    « enregistre », il dit « rien a faire » : il doit sortir tout de suite.
  const E = await joue({ ok: false, denied: true }, null);
  verifie('rien a ecrire -> message immediat, aucune attente',
    E.toasts.length === 1 && E.toasts[0].m === 'Acompte enregistré', JSON.stringify(E.toasts));

  // fbToastApres
  async function apres(etat) {
    const toasts = [];
    const box = { console, setTimeout, clearTimeout, Promise, Object, Array, String, JSON };
    box.window = box;
    box.showToast = (m, c) => toasts.push({ m: String(m), c: String(c) });
    box.logError = () => {};
    box.fbSave = () => Promise.resolve({ ok: true });
    vm.createContext(box);
    vm.runInContext(code, box);
    box.fbToastApres(etat, 'CSV importé', '#3D6B27');
    await new Promise((res) => setTimeout(res, 20));
    return toasts;
  }
  verifie('fbToastApres(null) -> message immediat', (await apres(null)).length === 1);
  verifie('fbToastApres(ok) -> message', (await apres(Promise.resolve({ ok: true }))).length === 1);
  verifie('fbToastApres(echec) -> silence', (await apres(Promise.resolve({ ok: false, queued: true }))).length === 0);
}

// ── 2. ★ L'invariant global ─────────────────────────────────────────────────
console.log('\n  2. plus aucun fbSave direct suivi d\'un message de succes');
{
  // firebase.js definit fbSave ; app.js porte saveData/_fbSaveMuet, le chemin qui
  // LIT deja l'etat (§68). Partout ailleurs, un fbSave suivi d'un showToast est le
  // defaut que ce harnais interdit.
  const MODULES = ['src/planning.js', 'src/cave.js', 'src/tracteur.js', 'src/phyto.js',
                   'src/pilotage.js', 'src/reglages.js', 'src/reserve.js', 'src/onboarding.js',
                   'src/admin-gt.js', 'src/utils.js'];
  const coupables = [];
  let inspectes = 0;
  for (const rel of MODULES) {
    let txt;
    try { txt = sansCommentaires(lire(rel)); } catch { continue; }
    const lignes = txt.split('\n');
    for (let i = 0; i < lignes.length; i++) {
      if (!/\bfbSave\s*\(/.test(lignes[i])) continue;
      if (/fbSaveToast|fbToastApres/.test(lignes[i])) continue;
      inspectes++;
      const suite = lignes.slice(i, i + 5).join('\n');
      if (/showToast\s*\(/.test(suite)) coupables.push(rel + ':' + (i + 1));
    }
  }
  verifie('des appels fbSave ont bien ete inspectes', inspectes > 0, 'inspectes=' + inspectes);
  verifie('aucun fbSave direct ne parle avant de savoir', coupables.length === 0, coupables.join(' · '));

  // Et le chemin central d'app.js doit continuer de lire l'etat.
  const APP = sansCommentaires(lire('src/app.js'));
  verifie('saveData lit toujours { ok } avant son toast vert',
    /r\s*&&\s*r\.ok\s*\)\s*\{\s*showToast\(toastMsg/.test(APP));
  verifie('saveData accepte une couleur (sinon un appelant reprendrait showToast)',
    /function saveData\(keyHint,\s*toastMsg,\s*toastCoul\)/.test(APP));
}

console.log('\n  ' + verts + ' vert(s) \u00b7 ' + rouges + ' rouge(s)');
if (rouges) { console.log('  \u2717 TOAST-HONNETE \u00c9CHOU\u00c9\n'); process.exit(1); }
console.log('  \u2713 TOAST-HONNETE OK\n');
