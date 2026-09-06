#!/usr/bin/env node
// ── CONTRE-EPREUVES DU LOT SEC-7 : C24 (cliquet XSS) + C25 (App Check) ──────
// On REINTRODUIT chaque defaut dans une COPIE du depot, on relance le preflight
// et on exige un rouge NOMME. Puis on retire, et on exige le vert.
//
// ⚠️⚠️ CE QUE CE HARNAIS NE FAIT PAS, ET POURQUOI. Il ne lit PAS le seul code
//   de sortie. Le preflight porte vingt-quatre controles : un rouge de C11 ou
//   de C15 ferait sortir 1 tout aussi bien, et la contre-epreuve se lirait
//   comme un succes en n'ayant rien prouve. C'est exactement la faute de §48
//   (une assertion INCAPABLE d'echouer) et de §42f (une assertion satisfaite
//   par autre chose que ce qu'elle vise). On exige donc, sur la SORTIE :
//     · la mention du VOLET attendu (C24a / C24b / C24c),
//     · sur le FICHIER attendu,
//     · au niveau ERREUR.
//   Un plantage (code de sortie null, ou signal) n'est PAS un rouge valide :
//   il est compte en echec, avec la trace.
//
// ⚠️ LE TEMOIN D'ABORD. Avant toute injection, le bac a sable intact doit
//   sortir VERT. Sans ce temoin, tout rouge obtenu ensuite pourrait venir de
//   la copie elle-meme et non du defaut injecte.
//
// ★ Les deux dernieres epreuves sont INVERSES : elles injectent un motif qui
//   RESSEMBLE a une faute et exigent le VERT. Un cliquet qui crie au loup est
//   un cliquet qu'on finit par debrancher — les faux positifs se testent
//   aussi.

import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// ⚠️ fileURLToPath, JAMAIS new URL(...).pathname : sous Windows ce dernier rend
//   « /C:/Users/… », que Node reprefixe ensuite en « C:\C:\Users\… ». Le bac a
//   sable est Linux, la machine de Nico est Windows (§53).
const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, '..');
const c = {
  g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`, d: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`,
};

const A_COPIER = ['src', 'scripts', 'public', 'functions', 'index.html', 'package.json'];

// Ancre unique + remplacement. `volet` = ce qu'on exige de voir rougir ;
// `volet: null` = epreuve INVERSE, on exige le vert.
const EPREUVES = [
  // ── C24c : la regle du lot, une substitution nue dans un gabarit HTML ─────
  {
    nom: 'C24c · une interpolation nue de plus dans un gabarit de app.js',
    volet: 'C24c', fichier: 'src/app.js',
    de: 'style="width:${pct}%;background:${col}"',
    a: 'style="width:${pct}%;background:${col}" title="${p.nom}"',
  },
  {
    nom: 'C24c · un gabarit HTML NEUF dans cave.js (fichier sans aucun gabarit aujourd\'hui)',
    volet: 'C24c', fichier: 'src/cave.js',
    de: "function _cavePkOccHtml(o){\n  if(!o) return '<span class=\"mvc-pk-occ libre\">Libre</span>';",
    a: "function _cavePkOccHtml(o){\n  if(!o) return `<span class=\"mvc-pk-occ libre\">${o&&o.nom}</span>`;",
  },
  {
    nom: 'C24c · un gabarit HTML NEUF dans admin-gt.js (fichier sans aucun gabarit aujourd\'hui)',
    volet: 'C24c', fichier: 'src/admin-gt.js',
    de: 'function _agtCguHtml(',
    a: 'function _agtCguNeuf(t){ return `<div class="x">${t.nom}</div>`; }\nwindow._agtCguNeuf=_agtCguNeuf;\nfunction _agtCguHtml(',
  },
  {
    nom: 'C24c · PIEGE n°2 — un ternaire dont UNE SEULE branche est echappee',
    volet: 'C24c', fichier: 'src/app.js',
    de: 'style="width:${pct}%;background:${col}"',
    a: 'style="width:${pct}%;background:${col}" data-t="${pct>0?_escHtml(String(pct)):col}"',
  },

  // ── C24a : le mauvais echappeur dans un slot JS ──────────────────────────
  {
    nom: 'C24a · _escHtml au lieu de _escAttr dans un onclick de planning.js',
    volet: 'C24a', fichier: 'src/planning.js',
    de: 'onclick="planSetAbsMotif(\\\'\'+_escAttr(mo.id)+\'\\\')"',
    a: 'onclick="planSetAbsMotif(\\\'\'+_escHtml(mo.id)+\'\\\')"',
  },
  {
    nom: 'C24a · le mauvais echappeur dans un slot JS de reglages.js',
    volet: 'C24a', fichier: 'src/reglages.js',
    de: "+_escAttr(e.t)+",
    a: "+_escHtml(e.t)+",
  },

  // ── C24b : un slot JS sans aucun echappement ─────────────────────────────
  {
    nom: 'C24b · valeur posee crue dans un onclick de planning.js',
    volet: 'C24b', fichier: 'src/planning.js',
    de: 'onclick="planSetAbsMotif(\\\'\'+_escAttr(mo.id)+\'\\\')"',
    a: 'onclick="planSetAbsMotif(\\\'\'+mo.id+\'\\\')"',
  },

  // ── LE POINT FIXE : casser une aide prouvee sûre doit rougir SES APPELS ──
  // ── LE POINT FIXE, PROUVE EN DEUX TEMPS ET A TRAVERS DEUX FICHIERS ──────
  //  ⚠️ A DIRE FRANCHEMENT : sur le depot d'aujourd'hui, le point fixe ne
  //  retire AUCUN constat — mesure faite, 332 et 169 avec comme sans. Les 139
  //  aides qu'il prouve sûres vivent toutes dans les modules ecrits en
  //  concatenation, et aucune n'est appelee depuis une substitution. Il n'est
  //  donc pas la pour le compte du jour : il est la pour que la PREMIERE
  //  personne qui ecrira `${_mvInfoBtn(...)}` dans un gabarit n'ait pas un
  //  faux positif au visage. Ces deux epreuves prouvent le mecanisme
  //  lui-meme, faute de pouvoir le prouver sur un site de production.
  {
    nom: '★ INVERSE · POINT FIXE 1/2 — appeler une aide PROUVEE sûre (utils.js) depuis un gabarit de app.js',
    volet: null, fichier: 'src/app.js',
    de: 'style="width:${pct}%;background:${col}"',
    a: 'style="width:${pct}%;background:${col}">${_mvInfoBtn(\'x\')}<i',
  },
  {
    nom: 'POINT FIXE 2/2 — la MEME aide cesse d\'echapper (utils.js) → l\'appel rougit dans app.js',
    volet: 'C24c', fichier: 'src/utils.js', voletFichier: 'src/app.js',
    prealable: {
      fichier: 'src/app.js',
      de: 'style="width:${pct}%;background:${col}"',
      a: 'style="width:${pct}%;background:${col}">${_mvInfoBtn(\'x\')}<i',
    },
    de: "return '<button type=\"button\" class=\"mv-i\" data-mvi=\"' + _escAttr(cle)",
    a: "return '<button type=\"button\" class=\"mv-i\" data-mvi=\"' + (cle)",
  },

  // ── EPREUVES INVERSES : ca doit rester VERT ──────────────────────────────
  {
    nom: '★ INVERSE · PIEGE n°4 — une fausse interpolation DANS UN COMMENTAIRE',
    volet: null, fichier: 'src/app.js',
    de: '  function _bar(pct,col){',
    a: '  // exemple pour la doc : <div title="${p.nom}">${x.libelle}</div>\n  function _bar(pct,col){',
  },
  {
    nom: '★ INVERSE · PIEGE n°3 — parentheses imbriquees _escHtml(String(x||\'\'))',
    volet: null, fichier: 'src/app.js',
    de: 'style="width:${pct}%;background:${col}"',
    a: 'style="width:${pct}%;background:${col}" data-n="${_escHtml(String((col===\'x\'?pct:col)||\'\'))}"',
  },
  {
    nom: '★ INVERSE · un ternaire dont LES DEUX branches sont echappees',
    volet: null, fichier: 'src/app.js',
    de: 'style="width:${pct}%;background:${col}"',
    a: 'style="width:${pct}%;background:${col}" data-t="${pct>0?_escHtml(String(pct)):_escHtml(col)}"',
  },
  {
    nom: '★ INVERSE · Number() autour de l\'interpolation',
    volet: null, fichier: 'src/app.js',
    de: 'style="width:${pct}%;background:${col}"',
    a: 'style="width:${pct}%;background:${col}" data-w="${Number(pct)}"',
  },

  // ══ C25 — LE JETON APP CHECK ═════════════════════════════════════════════
  //  ⚠️ Ces epreuves ne prouvent PAS que App Check est actif en production —
  //  ca, c'est la console, et elle a ete lue le 22/08. Elles prouvent qu'une
  //  fonction ecrite DEMAIN sans le jeton ne passera pas la porte.
  {
    nom: 'C25 · une onCall perd enforceAppCheck',
    volet: 'C25 —', fichier: 'functions/claims.js', voletFichier: 'functions/claims.js',
    de: 'exports.acceptTerms = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }',
    a: 'exports.acceptTerms = onCall({ region: REGION, timeoutSeconds: 30 }',
  },
  {
    nom: 'C25 · enforceAppCheck passe explicitement a false',
    volet: 'C25 —', fichier: 'functions/claims.js', voletFichier: 'functions/claims.js',
    de: 'exports.gtEndSession = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }',
    a: 'exports.gtEndSession = onCall({ region: REGION, enforceAppCheck: false, timeoutSeconds: 30 }',
  },
  {
    nom: 'C25 · une onCall NEUVE sans aucune option (la callback en 1er argument)',
    volet: 'C25 —', fichier: 'functions/ephy.js', voletFichier: 'functions/ephy.js',
    de: 'exports.syncEphyVigneNow = onCall(',
    a: 'exports.uneFonctionNeuve = onCall(async (request) => { return { ok: true }; });\nexports.syncEphyVigneNow = onCall(',
  },
  {
    nom: 'C25 · une SURFACE HTTP publique neuve (onRequest)',
    volet: 'C25 —', fichier: 'functions/ephy.js', voletFichier: 'functions/ephy.js',
    de: 'exports.syncEphyVigneNow = onCall(',
    a: 'exports.portePubliqueNeuve = onRequest(async (req, res) => { res.json({ ok: true }); });\nexports.syncEphyVigneNow = onCall(',
  },
  {
    nom: '★ C25 · des options NON litterales doivent AVERTIR, pas se taire',
    volet: 'C25 :', niveau: 'WARN', fichier: 'functions/claims.js', voletFichier: 'functions/claims.js',
    de: 'exports.getLoginRoster = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }',
    a: 'const _OPTS_GT = { region: REGION, enforceAppCheck: true };\nexports.getLoginRoster = onCall(_OPTS_GT',
  },
  {
    nom: '★ INVERSE · une onCall NEUVE avec le jeton reste verte',
    volet: null, fichier: 'functions/ephy.js',
    de: 'exports.syncEphyVigneNow = onCall(',
    a: 'exports.uneFonctionNeuve = onCall({ region: REGION, enforceAppCheck: true }, async (request) => { return { ok: true }; });\nexports.syncEphyVigneNow = onCall(',
  },
];

function bacNeuf() {
  const bac = mkdtempSync(join(tmpdir(), 'c24-'));
  for (const el of A_COPIER) {
    const de = join(RACINE, el);
    if (existsSync(de)) cpSync(de, join(bac, el), { recursive: true });
  }
  return bac;
}
function lancer(bac) {
  // --only=C24 : sans lui, chaque passage paie les 26 s des vingt-trois autres
  // regles, treize fois. Le temoin, lui, tourne COMPLET (plus bas).
  const r = spawnSync(process.execPath, [join(bac, 'scripts', 'preflight.mjs'), bac, '--only=C24,C25'],
    { encoding: 'utf8', timeout: 300000, env: { ...process.env, NO_COLOR: '1' } });
  return { code: r.status, sortie: (r.stdout || '') + (r.stderr || ''), signal: r.signal };
}
// Une ERREUR portant le volet attendu, sur le fichier attendu.
function rougeNomme(sortie, volet, fichier, niveau) {
  const tag = niveau === 'WARN' ? 'ATTENTION' : 'ERREUR';
  let dansFichier = false;
  for (const ligne of sortie.split('\n')) {
    if (/^ {2}\S/.test(ligne)) dansFichier = ligne.trim() === fichier;
    else if (dansFichier && new RegExp('^\\s+' + tag + '\\s').test(ligne) && ligne.includes(volet + ' ')) return true;
  }
  return false;
}

console.log(c.b('\n  CONTRE-EPREUVES SEC-7 — C24 cliquet XSS · C25 App Check\n'));

// ── LE TEMOIN ────────────────────────────────────────────────────────────────
let bac = bacNeuf();
let temoin;
try {
  // Le temoin tourne COMPLET : c'est lui qui prouve que la copie est saine.
  const t = spawnSync(process.execPath, [join(bac, 'scripts', 'preflight.mjs'), bac],
    { encoding: 'utf8', timeout: 300000, env: { ...process.env, NO_COLOR: '1' } });
  temoin = { code: t.status, sortie: (t.stdout || '') + (t.stderr || ''), signal: t.signal };
} finally { rmSync(bac, { recursive: true, force: true }); }
if (temoin.code !== 0) {
  console.log('  ' + c.r('✗ TEMOIN ROUGE') + ' — la copie intacte ne passe pas le preflight (code '
    + temoin.code + (temoin.signal ? ', signal ' + temoin.signal : '') + ').');
  console.log(c.d('    Tout rouge obtenu ensuite serait ininterpretable. On s\'arrete ici.'));
  console.log(c.d('    ' + temoin.sortie.split('\n').filter(l => /ERREUR/.test(l)).slice(0, 6).join('\n    ')));
  process.exit(1);
}
console.log('  ' + c.g('✓') + ' temoin : la copie intacte sort VERTE\n');

// ── LES EPREUVES ─────────────────────────────────────────────────────────────
let ok = 0, ko = 0;
for (const e of EPREUVES) {
  bac = bacNeuf();
  try {
    // Un prealable pose le DECOR (ici : l'appel dans un gabarit) avant que le
    // defaut ne soit injecte ailleurs. Son ancre est verifiee comme les autres.
    if (e.prealable) {
      const cp = join(bac, e.prealable.fichier);
      const sp = readFileSync(cp, 'utf8');
      if (sp.split(e.prealable.de).length - 1 !== 1) {
        console.log('  ' + c.r('✗') + ' ' + e.nom + c.d('  → ancre du PREALABLE introuvable ou ambigue : la contre-epreuve est fausse'));
        ko++; continue;
      }
      writeFileSync(cp, sp.replace(e.prealable.de, e.prealable.a), 'utf8');
    }
    const cible = join(bac, e.fichier);
    const src = readFileSync(cible, 'utf8');
    const n = src.split(e.de).length - 1;
    if (n !== 1) {
      console.log('  ' + c.r('✗') + ' ' + e.nom + c.d(`  → ancre introuvable ou ambigue (${n} fois) : LA CONTRE-EPREUVE EST FAUSSE, pas le code`));
      ko++; continue;
    }
    writeFileSync(cible, src.replace(e.de, e.a), 'utf8');
    const r = lancer(bac);

    if (r.code === null || r.signal) {
      console.log('  ' + c.r('✗') + ' ' + e.nom + c.d('  → le preflight a plante (signal ' + r.signal + ') : ce n\'est PAS un rouge valide'));
      ko++; continue;
    }
    if (e.volet === null) {                       // epreuve inverse : on veut le vert
      const faux = /ERREUR.*C2[45][abc]? [—:]/.test(r.sortie);
      if (!faux) { ok++; console.log('  ' + c.g('✓') + ' ' + e.nom + c.d('  → reste vert, aucun faux positif')); }
      else {
        ko++;
        console.log('  ' + c.r('✗') + ' ' + e.nom + c.d('  → C24 CRIE AU LOUP :'));
        console.log(c.d('      ' + (r.sortie.split('\n').find(l => /ERREUR.*C2[45][abc]? [—:]/.test(l)) || '').trim().slice(0, 150)));
      }
      continue;
    }
    const cible2 = e.voletFichier || e.fichier;
    if (rougeNomme(r.sortie, e.volet, cible2, e.niveau)) {
      ok++;
      const l = r.sortie.split('\n').find(x => x.includes(e.volet + ' ') && /ERREUR|ATTENTION/.test(x)) || '';
      console.log('  ' + c.g('✓') + ' ' + e.nom);
      console.log(c.d('      ' + l.trim().replace(/\s+/g, ' ').slice(0, 140)));
    } else {
      ko++;
      console.log('  ' + c.r('✗') + ' ' + e.nom + c.d(`  → aucun(e) ${e.niveau || 'ERREUR'} ${e.volet} sur ${cible2} (code ${r.code}) : le cliquet ne prouve rien sur ce point`));
    }
  } finally {
    rmSync(bac, { recursive: true, force: true });
  }
}

console.log('\n' + (ko === 0
  ? c.g(`  ✓ ${ok} epreuves passees — chaque defaut rougit, chaque piege reste vert`)
  : c.r(`  ✗ ${ko} epreuve(s) en echec sur ${ok + ko}`)) + '\n');
process.exit(ko === 0 ? 0 : 1);
