/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ANNEE-TAB (§548) : L'ANNÉE A SON ONGLET, ET UNE NOTATION PROPRE
   Lancer : node scripts/mv-harnais-anneetab.mjs          (le contrôle)
            node scripts/mv-harnais-anneetab.mjs --contre  (chaque défaut reposé doit rougir)
   Demande de Nico (07/11) : « les notations des heures par jour dans l'année, c'est sale et pas pro ; un onglet à côté
   de Le mois et Les gens sera plus ergonomique ». Ce harnais tient : l'onglet (index.html, la liste des onglets valides,
   le routage), le choix du modèle en haut, la roue qui ne porte plus « L'année », la notation « 8 h 30 » (espaces
   insécables, « repos » pour un jour à zéro), les jours en lignes et plus en sept colonnes serrées.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f, env) => fs.readFileSync(process.env[env] || path.join(R, f), 'utf8');
const DEFAUTS = {
  onglet:  ['l’onglet disparaît de la barre', 'index.html', 'MV_AT_HTML', 'data-tab="annee" data-tuto="plan.tab.annee"', 'data-tab="anneeX" data-tuto="plan.tab.annee"'],
  notation:['la notation redevient « 8h30 »', 'src/planning-annee.js', 'MV_AT_AN', "+'\\u00a0h'+(mm?'\\u00a0'+(mm<10?'0':'')+mm:'');}", "+'h'+(mm?(mm<10?'0':'')+mm:'');}"],
  roue:    ['la roue reporte « L’année » sur chaque modèle', 'src/planning.js', 'MV_AT_PL', "function _planModeles(){", "function _planRoueAnnee(){return '<button data-pl=\"x\" onclick=\"planAnneeOuvrir(this.dataset.pl)\">L\\u2019ann\\u00e9e</button>';}\nfunction _planModeles(){"],
};
if (CONTRE) {
  console.log('\n── ANNEE-TAB — contre-épreuve (un processus par défaut)\n'); let tenues = 0, total = 0;
  for (const [cle, [quoi, fic, env, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const src = lire(fic), n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-at-')), fp = path.join(tmp, path.basename(fic));
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { [env]: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu'); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}
const PL = lire('src/planning.js', 'MV_AT_PL'), AN = lire('src/planning-annee.js', 'MV_AT_AN'), HTML = lire('index.html', 'MV_AT_HTML');
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det ? ' — ' + det : '')); } }
console.log('\n── ANNEE-TAB — l’onglet L’année\n');
T(/class="mvu-tab plan-tab-admin" data-tab="annee" data-tuto="plan\.tab\.annee" onclick="planSwitchTab\(&#39;annee&#39;\)"/.test(HTML), 'la barre du Planning a l’onglet « L’année », pour l’admin');
T(/_PLAN_VALID_TAB=\{[^}]*annee:1/.test(PL), 'l’onglet est un onglet valide');
T(/planTab==='annee'&&window\._planAnneeOnglet\)window\._planAnneeOnglet\(\)/.test(fonction(PL, '_planRenderBody')), 'il affiche l’année d’un modèle');
T(/planTab==='annee'&&isAdmin\(\)\)\{ sb\.innerHTML=window\._planAnneeBande/.test(fonction(PL, '_planRenderHeader')), 'sa bande de chiffres : le modèle, la base, l’écart');
T(!/onclick="planAnneeOuvrir\(/.test(PL), 'la roue crantée ne porte plus « L’année » sur chaque modèle');
T(/onclick="planAnneeModele\(this\)"/.test(fonction(AN, '_planAnneeChoix')) && /data-tuto="plan\.annee\.modele"/.test(AN), 'en haut, le choix du modèle');
T(/document\.getElementById\('plan-body'\)/.test(fonction(AN, '_planRenderAnnee')), 'la frise s’écrit dans l’onglet');
console.log('\n── une notation propre\n');
const ctx = vm.createContext({});
vm.runInContext(fonction(AN, '_paH') + ';this.H=_paH;', ctx);
const n = s => s.replace(/\u00a0/g, '·').replace(/\u202f/g, '˙');
T(n(ctx.H(8.5)) === '8·h·30' && n(ctx.H(4)) === '4·h' && n(ctx.H(1827)) === '1˙827·h', '« 8 h 30 », « 4 h », « 1 827 h » — espaces insécables', [ctx.H(8.5), ctx.H(4), ctx.H(1827)].map(n).join(' | '));
T(n(ctx.H(-1.5)) === '−1·h·30', 'un écart négatif : « −1 h 30 », le vrai signe moins', n(ctx.H(-1.5)));
const ed = fonction(AN, '_planAnneeJoursEd'), rd = fonction(AN, '_planRenderAnnee');
T(!/repeat\(7,/.test(ed) && !/repeat\(7,/.test(rd), 'les jours en lignes, plus en sept colonnes serrées');
T(/'repos'/.test(ed) && !/_planFmt\(/.test(rd) && !/_planFmt\(/.test(ed), 'un jour à zéro dit « repos » ; plus de « 8h30 » à l’écran');
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
