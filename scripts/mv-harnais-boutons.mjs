#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE JEU DE BOUTONS COMMUN (lot CHARTE-3, §370)
   Lancer :  node scripts/mv-harnais-boutons.mjs
             node scripts/mv-harnais-boutons.mjs --contre

   ══ POURQUOI ══
   Mesuré le 19/10 : 86 sortes de boutons dans la feuille, 17 hauteurs, 18 arrondis, 31 fonds ; l'action
   principale tantôt noire, violette, verte ou lie-de-vin. Nico a validé une maquette (canvas « le jeu de
   boutons commun ») : quatre boutons, trois tailles, l'option et le choix, l'icône — tout lu dans la charte.
   CHARTE-3a pose les pièces (.mvbtn…) et y passe neuf anciennes classes. Ce harnais tient l'acquis : un
   bouton qui reprend son propre fond ou son propre arrondi rougit le jour même.

   Ce qu'il interdit :
     A. que les pièces disparaissent du bloc CHARTE-3 de styles.css ;
     B. que le bloc écrive une couleur ou une taille de texte en dur : tout vient de la charte ;
     C. qu'une classe passée au jeu reprenne une allure (fond, couleur, bordure, arrondi, marge intérieure,
        hauteur, police, taille ou graisse) hors du bloc : dans une autre règle de la feuille, dans le CSS
        d'un module, ou dans un style écrit sur place à côté de la classe — exemptions écrites, avec raison ;
     D. que le compte des classes de boutons qui posent LEUR PROPRE fond ou arrondi remonte (PLAFOND :
        il ne peut que baisser, on le baisse à la main en passant des classes au jeu) ;
     E. que la charte perde --sur-danger (le texte du bouton Danger, clair et sombre).
   ⚠️ Il ne regarde pas un écran : la preuve au navigateur se fait au lot (§370).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const MODULES = fs.readdirSync(path.join(RACINE, 'src')).filter(f => f.endsWith('.js')).sort().map(f => 'src/' + f);

const PIECES = ['.mvbtn', '.mvbtn-principal', '.mvbtn-secondaire', '.mvbtn-discret', '.mvbtn-danger', '.mvbtn-option',
                '.mvbtn-choix', '.mvbtn-icone', '.mvbtn-terrain', '.mvbtn-bureau', '.mvbtn-compact'];
const MIGREES = ['plan-btn-saisir', 'mvc-set-btn', 'sd-trac-confirm-btn', 'pf-btn', 'pf-btn-ok', 'plan-btn-pdf',
                 'cave-toggle-btn', 'trac-type-btn', 'cave-op-type-btn', 'rfut-reason-btn',
                 'mbtn', 'mbtn-del', 'mbtn-p',   // ★ CHARTE-3b (§372) : le bouton des fenêtres
                 'cave-stepper-btn', 'mvc-step-btn', 'mvv-step2-b', 'rp-stp'];   // ★ CHARTE-3c (§373) : les « − / + »
const EXEMPTIONS = [
  { selecteur: '#ovRepBlock .sd-trac-confirm-btn', raison: 'un blanc forcé (!important) d’avant CHARTE-3, sur le principal : c’est déjà le texte du jeu' },
  { selecteur: '#regl-view-domaine .mbtn.verte', raison: 'RG-1 (§295) : Réglages › Domaine peint ses « Enregistrer » en secondaire, exprès (mv-harnais-rg1)' },
  { selecteur: '#regl-view-equipe .mbtn.verte', raison: 'RG-2 (§296) : « Ajouter un membre » à l’accent, la pièce principale du jeu redite (mv-harnais-rg2)' }
];
const PLAFOND = 72;   /* CHARTE-3c (§373) : 74 → 72, les « − / + » passés au jeu */   /* classes de boutons (hors bloc) qui posent leur propre fond ou arrondi — mesuré à CHARTE-3a ; ne peut que BAISSER */
const ALLURE = /^(background(-color|-image)?|color|border(-(color|width|style|radius))?|padding(-\w+)?|min-height|height|font-(size|weight|family))$/;

const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function bloc(css) {
  const t = css.indexOf('CHARTE-3 (§370) — LE JEU DE BOUTONS COMMUN'), f = css.indexOf('/* ═══ fin CHARTE-3 ═══ */');
  if (t < 0 || f < 0) return { dedans: '', dehors: css };
  const a = css.lastIndexOf('/*', t);
  return { dedans: css.slice(a, f), dehors: css.slice(0, a) + css.slice(f) };
}
const regles = s => [...sansCom(s).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim(), m[2]]);
const decls = c => c.split(';').map(x => x.trim()).filter(Boolean).map(x => x.split(':')[0].trim());
const porte = (sel, c) => new RegExp('\\.' + c.replace(/-/g, '\\-') + '(?![\\w-])').test(sel.replace(/:not\([^)]*\)/g, ''));   // une classe citée dans :not() n’est pas stylée

function verifier(S) {
  const f = { A: [], B: [], C: [], D: [], E: [] };
  const { dedans, dehors } = bloc(S['src/styles.css']);
  /* A */
  if (!dedans) f.A.push('le bloc CHARTE-3 est introuvable dans styles.css');
  for (const p of PIECES) if (!new RegExp(p.replace(/[.-]/g, m => '\\' + m) + '(?![\\w-])').test(sansCom(dedans))) f.A.push(p + ' absente du bloc');
  /* B */
  const nu = sansCom(dedans);
  for (const m of nu.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|:\s*(?:white|black)\b|font-size\s*:\s*\d/g)) f.B.push('« ' + m[0] + ' » dans le bloc');
  /* C — la feuille hors du bloc */
  for (const [sel, corps] of regles(dehors))
    for (const c of MIGREES)
      if (porte(sel, c)) {
        const fautives = decls(corps).filter(p => ALLURE.test(p));
        if (fautives.length && !EXEMPTIONS.some(e => sel === e.selecteur)) f.C.push('styles.css « ' + sel.slice(0, 60) + ' » pose ' + fautives.join(', '));
      }
  /* C — le CSS des modules, et les styles écrits sur place à côté de la classe */
  for (const mod of MODULES) {
    const s = S[mod] || '';
    for (const c of MIGREES) {
      for (const m of s.matchAll(new RegExp('\\.' + c.replace(/-/g, '\\-') + '(?![\\w-])[^{}\'"\\n]*\\{([^{}]*)\\}', 'g'))) {
        const fautives = decls(m[1]).filter(p => ALLURE.test(p));
        if (fautives.length) f.C.push(mod + ' : CSS « .' + c + ' » pose ' + fautives.join(', '));
      }
      for (const m of s.matchAll(new RegExp('class=\\\\?["\'][^"\'<>]*\\b' + c.replace(/-/g, '\\-') + '\\b', 'g'))) {
        const a = s.lastIndexOf('<', m.index), b = s.indexOf('>', m.index), balise = s.slice(a, b);
        const st = balise.match(/style=\\?["']([^"']*)/);
        if (st && /(?:^|;)\s*(background|border|color|padding|height|min-height|font-size|font-weight)\s*:/.test(st[1])) f.C.push(mod + ' : style écrit sur place à côté de « ' + c + ' »');
      }
    }
  }
  /* D — le plafond des boutons « maison » */
  const maison = new Set();
  for (const [sel, corps] of regles(dehors)) {
    const d = decls(corps);
    if (!d.some(p => /^(background(-color)?|border-radius)$/.test(p))) continue;
    for (const m of sel.matchAll(/\.([a-zA-Z][\w-]*)/g))
      if (/(^|-)(btn|bouton|button)(-|$)/.test(m[1]) && !/btns$/.test(m[1]) && !/-(lbl|label|ico|icon|sub|row|wrap|bar|group|grp|list|zone|txt|text|count|badge|dot|arrow|chev|in|inner|cap|num|val|line|hint|box|pill)$/.test(m[1])) maison.add(m[1]);
  }
  if (maison.size > PLAFOND) f.D.push(maison.size + ' classes de boutons posent leur propre fond ou arrondi, pour ' + PLAFOND + ' au plafond');
  /* E */
  const n = (sansCom(S['src/charte.css'] || '').match(/--sur-danger\s*:/g) || []).length;
  if (n !== 3) f.E.push('--sur-danger déclaré ' + n + ' fois dans la charte (attendu : 3 — clair, sombre manuel, sombre automatique)');
  return { f, maison: maison.size, pieces: PIECES.length };
}

const S0 = Object.fromEntries(['src/styles.css', 'src/charte.css', ...MODULES].map(x => [x, lire(x)]));
let ok = 0, ko = 0;
const t = (nom, cond, detail) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); } };
const liste = a => a.slice(0, 6).join('\n        ') + (a.length > 6 ? '\n        … (+' + (a.length - 6) + ')' : '');
if (!CONTRE) {
  console.log('\n── LE JEU DE BOUTONS COMMUN — lot CHARTE-3 (§370)\n');
  const { f, maison } = verifier(S0);
  t('les pièces du jeu sont dans le bloc CHARTE-3 (' + PIECES.length + ')', f.A.length === 0, liste(f.A));
  t('le bloc n’écrit aucune couleur ni taille de texte en dur', f.B.length === 0, liste(f.B));
  t('les ' + MIGREES.length + ' classes passées au jeu ne reprennent aucune allure ailleurs', f.C.length === 0, liste(f.C));
  t('les boutons « maison » ne remontent pas (' + maison + ' ≤ ' + PLAFOND + ')', f.D.length === 0, liste(f.D));
  if (maison < PLAFOND) console.log('    ↓ ' + (PLAFOND - maison) + ' de moins — baisser PLAFOND dans ce fichier');
  t('la charte porte --sur-danger en clair et en sombre', f.E.length === 0, liste(f.E));
} else {
  console.log('\n── CONTRE-ÉPREUVES — le jeu de boutons commun (CHARTE-3)\n');
  const muter = (fi, fn) => { const S = { ...S0 }; const av = S[fi]; S[fi] = fn(av); if (S[fi] === av) throw new Error('défaut non posé : ' + fi); return S; };
  const CAS = [
    ['une pièce disparaît du bloc', 'A', () => muter('src/styles.css', s => s.split('.mvbtn-danger').join('.mvbtn-dang'))],
    ['le bloc écrit une couleur en dur', 'B', () => muter('src/styles.css', s => s.replace('.mvbtn-discret{ background:transparent;', '.mvbtn-discret{ background:transparent; color:#7A2850;'))],
    ['une classe passée au jeu reprend un fond dans la feuille', 'C', () => muter('src/styles.css', s => s + '\n.trac-type-btn{background:var(--vert-pale)}\n')],
    ['une classe passée au jeu reprend un arrondi dans un module', 'C', () => muter('src/cave.js', s => s + "\nwindow._zz = '.plan-btn-pdf{border-radius:10px}';\n")],
    ['un style écrit sur place à côté d’une classe passée au jeu', 'C', () => muter('src/planning.js', s => s + "\nwindow._zz = '<button class=\"plan-btn-saisir\" style=\"background:#1C1A2E\">x</button>';\n")],
    ['un bouton « maison » de plus', 'D', () => muter('src/styles.css', s => s + '\n.zz-neuf-btn{background:var(--vert);border-radius:12px}\n')],
    ['la charte perd --sur-danger', 'E', () => muter('src/charte.css', s => s.replace('--sur-danger:#FFFFFF;', ''))]
  ];
  for (const [nom, r, fab] of CAS) { let S; try { S = fab(); } catch (e) { t(nom + ' — ' + e.message, false); continue; } t(nom + ' → la règle ' + r + ' rougit', verifier(S).f[r].length > 0); }
  for (const [nom, fab] of [
    ['une allure dans un commentaire ne compte pas', () => muter('src/styles.css', s => s + '\n/* .trac-type-btn{background:red} */\n')],
    ['la mise en page d’une classe passée au jeu reste permise', () => muter('src/styles.css', s => s + '\n.trac-type-btn{flex:1}\n')]]) {
    const { f } = verifier(fab()); const n = Object.values(f).reduce((a, x) => a + x.length, 0);
    t('témoin — ' + nom, n === 0, Object.entries(f).filter(([, a]) => a.length).map(([k, a]) => k + ' : ' + a[0]).join(' · '));
  }
}
console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
process.exit(ko ? 1 : 0);
