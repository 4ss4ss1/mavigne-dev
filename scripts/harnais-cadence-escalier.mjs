// Harnais — ESCALIER DE SOURCES DE LA CADENCE (backlog 7, §20b)
// Extrait _pecCadHisto du fichier REEL et l'execute sur un decor monte a la main.
// Regle de §40 : un harnais qui verdit sur une panne de montage est pire qu'aucun
// harnais. Une garde rougit donc si l'extraction n'a rien trouve.
import { readFileSync } from 'fs';

// ★ RACINE DEDUITE DU FICHIER, JAMAIS DU REPERTOIRE COURANT NI D'UN CHEMIN ABSOLU.
//   Regle posee en §44c : six harnais portaient « /home/claude/mavigne-dev/ » en dur —
//   un chemin de bac a sable. Chez Nico et en CI ils sortaient en ENOENT, et deux
//   d'entre eux etaient VERTS ici : un filet qui ne demarre pas se lit comme un succes.
const R = new URL('../', import.meta.url).pathname;
const SRC = readFileSync(R+'src/pilotage.js', 'utf8');

let pass = 0, fail = 0;
function ok(nom, cond, det) {
  if (cond) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '  → ' + det : '')); }
}

// ── Extraction ────────────────────────────────────────────────────────
function extraire(nom) {
  const i = SRC.indexOf('function ' + nom + '(');
  if (i < 0) return null;
  let d = 0, started = false, j = i;
  for (; j < SRC.length; j++) {
    if (SRC[j] === '{') { d++; started = true; }
    else if (SRC[j] === '}') { d--; if (started && d === 0) { j++; break; } }
  }
  return SRC.slice(i, j);
}

const srcHisto = extraire('_pecCadHisto');
// ★ GARDE DE MONTAGE — sans elle, un renommage ferait verdir un harnais vide.
ok('MONTAGE · _pecCadHisto est extraite du fichier reel', !!srcHisto && srcHisto.length > 400,
   srcHisto ? ('longueur ' + srcHisto.length) : 'INTROUVABLE');
if (!srcHisto) { console.log('\n\x1b[31mMontage impossible — abandon.\x1b[0m'); process.exit(1); }

// ── Decor ─────────────────────────────────────────────────────────────
// Deux salaries, une periode archivee « Printemps 2025 » du 08/03 au 31/07/2025.
// Bareme fait cette annee-la : 1000 h. Presence planning : 1200 h. Tracteur : 100 h.
// => hReel = 1100, ecart = (1100-1000)/1000 = +10 %.
function decor(over) {
  over = over || {};
  const g = {
    MEMBRES: over.MEMBRES !== undefined ? over.MEMBRES : [
      { nom: 'Alice', statut: 'Actif' },
      { nom: 'Bob',   statut: 'Actif' }
    ],
    SAISONS: over.SAISONS !== undefined ? over.SAISONS : [
      { nom: 'Printemps 2025', debut: '2025-03-08', fin: '2025-07-31', active: false },
      { nom: 'Printemps 2026', debut: '2026-03-08', fin: '2026-07-31', active: true }
    ],
    _mvEnContratSurPeriode: () => true,
    _planWorkPersRange: over._planWorkPersRange !== undefined ? over._planWorkPersRange
                        : ((m) => (m.nom === 'Alice' ? 700 : 500)),   // 1200 h au total
    logError: () => {}
  };
  const snapDefaut = { saisonNom: 'Printemps 2025', stats: { hFaites: 1000 } };
  const ctx = {
    window: g,
    _pilCmpSnapshot: () => (over.snap !== undefined ? over.snap : snapDefaut),
    _pilCmpPeriode: (nom) => (g.SAISONS || []).find(s => s && s.nom === nom) || null,
    _pexD: (iso) => new Date(Date.parse(iso + 'T00:00:00')),
    _ecoTracHByParc: over._ecoTracHByParc !== undefined ? over._ecoTracHByParc
                     : (() => ({ h: { 'Ergot': 60, 'Jouise': 40 } }))   // 100 h
  };
  return ctx;
}

function appel(ctx) {
  const noms = Object.keys(ctx);
  // eslint-disable-next-line no-new-func
  const f = new Function(...noms, srcHisto + '\nreturn _pecCadHisto;')(...noms.map(k => ctx[k]));
  return f(0);
}

console.log('\n── MARCHE 2 : le cas nominal ─────────────────────────────');
{
  const r = appel(decor());
  ok('rend un resultat', !!r);
  ok('hBar vient du snapshot (1000 h)', r && Math.abs(r.hBar - 1000) < 0.01, r && r.hBar);
  ok('hReel = presence 1200 moins tracteur 100 = 1100 h', r && Math.abs(r.hReel - 1100) < 0.01, r && r.hReel);
  ok('ecart = +10 %', r && Math.abs(r.ecart - 0.10) < 1e-9, r && r.ecart);
  ok('la periode rendue est celle du snapshot', r && r.d0 === '2025-03-08' && r.d1 === '2025-07-31',
     r && (r.d0 + ' -> ' + r.d1));
  ok('le nom de la campagne source est rendu (l\'ecran doit pouvoir le dire)',
     r && r.nom === 'Printemps 2025', r && r.nom);
  ok('nMbr compte les salaries qui ont des heures', r && r.nMbr === 2, r && r.nMbr);
}

console.log('\n── LES GARDES : chacune doit rendre null, pas un chiffre ──');
ok('aucun snapshot comparable → null',        appel(decor({ snap: null })) === null);
ok('snapshot sans stats → null',              appel(decor({ snap: { saisonNom: 'X' } })) === null);
ok('hFaites a zero → null (pas de division)', appel(decor({ snap: { saisonNom: 'Printemps 2025', stats: { hFaites: 0 } } })) === null);
ok('periode absente de SAISONS → null',       appel(decor({ SAISONS: [{ nom: 'Printemps 2026', debut: '2026-03-08', fin: '2026-07-31', active: true }] })) === null);
ok('periode sans dates → null',               appel(decor({ SAISONS: [{ nom: 'Printemps 2025' }, { nom: 'Printemps 2026', debut: '2026-03-08', fin: '2026-07-31', active: true }] })) === null);
ok('aucun membre → null',                     appel(decor({ MEMBRES: [] })) === null);
ok('planning vide sur la fenetre → null',     appel(decor({ _planWorkPersRange: () => 0 })) === null);
ok('tracteur >= presence → null (jamais 0 h de vigne)',
   appel(decor({ _ecoTracHByParc: () => ({ h: { 'Ergot': 5000 } }) })) === null);
ok('_ecoTracHByParc qui jette → tracteur a 0, pas de plantage',
   (() => { const r = appel(decor({ _ecoTracHByParc: () => { throw new Error('boom'); } }));
            return r && Math.abs(r.hReel - 1200) < 0.01; })());

console.log('\n── LE CABLAGE DANS _pecData ──────────────────────────────');
ok('la marche 2 n\'est tentee que si la marche 1 a echoue',
   /if\(!cadOk\)\{\s*\n\s*cadHist\s*=\s*_pecCadHisto/.test(SRC));
ok('la source est marquee \'histo\' quand la marche 2 sert',
   /cadSrc\s*=\s*'histo'/.test(SRC));
ok('cad.src remonte cadSrc et non plus le seul planning',
   /src:\(cadSrc \|\| \(cadP\?'planning':null\)\)/.test(SRC));
ok('cad.histoNom est expose (l\'ecran doit nommer la campagne)',
   /histoNom:\(cadHist\?cadHist\.nom:''\)/.test(SRC));
ok('hTrac affiche est celui de la fenetre histo quand elle sert',
   /hTrac:\(cadHist\?cadHist\.hTrac:T\.tracH\)/.test(SRC));

console.log('\n── L\'HONNETETE D\'AFFICHAGE (§34 : jamais deux choses sous un mot) ──');
ok('le verdict est reecrit quand la source est histo',
   /if\(ec!=null && E\.cad\.src==='histo'\)/.test(SRC));
ok('le verdict nomme la campagne source',
   /E\.cad\.histoNom\|\|'la campagne pr/.test(SRC));
ok('la note du graphe distingue la source histo',
   /E\.cad\.src==='histo'\s*\n?\s*\?\s*\('\\u21a9/.test(SRC) || SRC.includes("Mesur\\u00e9 sur la campagne pr\\u00e9c\\u00e9dente"));
ok('le KPI ecart de cadence annonce la source histo',
   /campagne pr\\u00e9c\\u00e9dente \\u00b7 fin projet/.test(SRC));
// ★★ ASSERTION REBASEE (§44c). Elle cherchait « push('warn' » — une FORME de code
//    supposee, jamais ecrite. Le comportement, lui, est bien la : quand l'ecart vient
//    de l'historique, le conseil dit que c'est un REPERE et ne cite pas la projection
//    de fin. C'est ca qu'il faut proteger, pas le nom d'un niveau d'alerte.
ok('l\'alerte >15 % ne crie plus au derapage sur un chiffre d\'histoire',
   /if\(E\.cad\.src==='histo' \|\| !E\.cad\.applic\)/.test(SRC)
   && /c\\u2019est un <b>rep\\u00e8re<\/b>, pas une pr\\u00e9vision/.test(SRC));
ok('le message de marche 3 mentionne l\'absence d\'archive comparable',
   /aucune campagne comparable archiv/.test(SRC));

console.log('\n════════════════════════════════════════════════════════');
console.log(fail === 0 ? `\x1b[32m${pass} assertions vertes.\x1b[0m`
                       : `\x1b[31m${fail} ROUGE(S)\x1b[0m sur ${pass + fail}.`);
process.exit(fail === 0 ? 0 : 1);
