/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ARRIVEE-1 (§337) : CHEZ L'OUVRIER, LA VIGNE A DEUX ONGLETS
   Lancer : node scripts/mv-harnais-arrivee1.mjs          (le contrôle)
            node scripts/mv-harnais-arrivee1.mjs --contre  (la contre-épreuve)
   Une seule question, `_mvJournalOuvert`, EXÉCUTÉE ici sur des rôles ; puis ses
   quatre usages : onglets et liens (applyRoles), navigation (goTo,
   switchVigneOng), raccourcis de l'Accueil.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const A0 = fs.readFileSync('src/app.js', 'utf8');
const H0 = fs.readFileSync('index.html', 'utf8');
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0, k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
function controles(A, H) {
  const r = [];
  const f = fonction(A, '_mvJournalOuvert');
  let ouvert = null;
  try { ouvert = new Function('window', f + '\nreturn _mvJournalOuvert;'); } catch (e) { ouvert = null; }
  const essai = roles => { try { return ouvert({ currentUser: roles ? { roles } : null })(); } catch (e) { return 'erreur'; } };
  r.push(['_mvJournalOuvert existe et s’exécute', !!f && typeof ouvert === 'function']);
  r.push(['le Journal reste à l’admin et au pilotage', essai(['admin']) === true && essai(['pilotage']) === true && essai(['admin', 'ouvrier']) === true]);
  r.push(['l’ouvrier, le tractoriste et le saisonnier n’ont pas le Journal', essai(['ouvrier']) === false && essai(['tractoriste']) === false && essai(['saisonnier']) === false && essai(['ouvrier', 'tractoriste']) === false]);
  r.push(['sans utilisateur, pas de Journal', essai(null) === false && essai([]) === false]);
  const ar = fonction(A, 'applyRoles');
  r.push(['applyRoles cache les deux onglets Journal chez l’ouvrier', /\['vng-ong-journal','vng-ong-journal-p'\]\.forEach[\s\S]{0,140}_jOk\?'':'none'/.test(ar) && /var _jOk=_mvJournalOuvert\(\)/.test(ar)]);
  r.push(['ACCV-3 (§418) : « Ma trace » est dans « Ma saison », pour tous', /onclick=\"openMaTrace\(\)\"/.test(fonction(A, 'renderHomeMoi'))]);
  r.push(['goTo renvoie le Journal vers les Parcelles chez l’ouvrier', /if\(page==='journal'&&!_mvJournalOuvert\(\)\) page='parcelles';/.test(fonction(A, 'goTo'))]);
  r.push(['switchVigneOng fait de même', /if\(dest==='journal'&&!_mvJournalOuvert\(\)\) dest='parcelles';/.test(fonction(A, 'switchVigneOng'))]);
  r.push(['ACCV-3 (§418) : l’Accueil n’a plus de raccourcis — ni « + Journal » ni « Valider », pour personne', !/function renderHomeRaccourcis\(/.test(A) && !/function homeShortcut\(/.test(A)]);
  r.push(['index.html ne porte plus les cibles retirées (#home-trv-tout, #home-msem-journal, #home-msem-trace)', !H.includes('id="home-trv-tout"') && !H.includes('id="home-msem-journal"') && !H.includes('id="home-msem-trace"')]);
  return r;
}
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
if (!CONTRE) {
  console.log('\n── ARRIVEE-1 — chez l’ouvrier, la Vigne a deux onglets\n');
  for (const [n, c] of controles(A0, H0)) t(n, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
  process.exit(ko ? 1 : 0);
}
console.log('\n── ARRIVEE-1 — contre-épreuve\n');
const essais = [
  ['le tractoriste qui retrouve le Journal est vu', A0.replace("return r.indexOf('admin')>=0||r.indexOf('pilotage')>=0;", "return r.indexOf('admin')>=0||r.indexOf('pilotage')>=0||r.indexOf('tractoriste')>=0;"), H0, 'l’ouvrier, le tractoriste'],
  ['la garde de goTo retirée est vue', A0.replace("  if(page==='journal'&&!_mvJournalOuvert()) page='parcelles';", ''), H0, 'goTo renvoie'],
  ['des raccourcis revenus à l’Accueil sont vus', A0 + '\nfunction renderHomeRaccourcis(){}', H0, 'ACCV-3 (§418) : l’Accueil n’a plus de raccourcis'],
];
let rates = 0;
for (const [nom, A, H, cible] of essais) {
  const vu = controles(A, H).some(([n, c]) => n.startsWith(cible) && !c);
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + nom); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + nom + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`);
process.exit(rates ? 1 : 0);
