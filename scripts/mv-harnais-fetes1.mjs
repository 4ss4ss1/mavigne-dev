/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — FETES-1 (§347) : « ANNONCER MES JALONS » SE COUPE
   Lancer : node scripts/mv-harnais-fetes1.mjs          (le contrôle)
            node scripts/mv-harnais-fetes1.mjs --contre  (la contre-épreuve)
   `_mvFetesOn` et `toggleFetes` sont EXÉCUTÉES avec un faux localStorage ;
   le reste est le câblage (la ligne des Réglages, l'annonce qui se tait).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J0 = fs.readFileSync('src/jalons.js', 'utf8'), H = fs.readFileSync('index.html', 'utf8'), R = fs.readFileSync('src/reglages.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8');
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0, k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
function controles(J) {
  const r = [], store = {}, toasts = [];
  const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  const window = { currentUser: { nom: 'Paul Léo' }, TENANT_ID: 'mg', showToast: m => toasts.push(m) };
  const document = { getElementById: () => null };
  let F = null;
  try {
    F = new Function('window', 'localStorage', 'document',
      fonction(J, '_mvJalSlug') + fonction(J, '_mvFetesCle') + fonction(J, '_mvFetesOn') + fonction(J, '_mvFetesPeindre') + fonction(J, 'toggleFetes')
      + '\nreturn { on: _mvFetesOn, bascule: toggleFetes, cle: _mvFetesCle };')(window, localStorage, document);
  } catch (e) { F = null; }
  r.push(['les fonctions existent et s’exécutent', !!F]);
  if (!F) return r;
  r.push(['par défaut, les jalons sont annoncés', F.on() === true]);
  F.bascule();
  r.push(['une bascule coupe, et le range sur ce téléphone', F.on() === false && store[F.cle()] === '0' && toasts[0] === 'Les jalons ne seront plus annoncés']);
  F.bascule();
  r.push(['une seconde bascule rallume', F.on() === true && store[F.cle()] === '1']);
  r.push(['la clé est propre au domaine et à la personne', F.cle() === 'mv_fetes_mg_paulleo']);
  r.push(['coupée, l’annonce se tait (rien n’est inséré, pas de message)', /function _mvJalonsAnnonce\(ids\) \{\n  if \(!ids \|\| !ids\.length\) return;\n  if \(!_mvFetesOn\(\)\) return;/.test(J)]);
  return r;
}
function cablage() {
  return [
    ['la ligne « Annoncer mes jalons » dans Réglages › App › Mon compte, sous le mot de passe', /onclick="openChangePwd\(\)">[\s\S]{0,700}<div class="set-row" id="regl-fetes-row"[^>]*onclick="toggleFetes\(\)">[\s\S]{0,500}Annoncer mes jalons[\s\S]{0,300}id="regl-fetes-state"/.test(H)],
    ['l’état se peint au démarrage et à l’ouverture de l’onglet App', /if\(window\._mvFetesPeindre\) window\._mvFetesPeindre\(\);/.test(A) && /if\(tab==='app'&&window\._mvFetesPeindre\) window\._mvFetesPeindre\(\);/.test(R)],
  ];
}
let ok = 0, ko = 0;
const t = (x, c) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x); } };
if (!CONTRE) {
  console.log('\n── FETES-1 — « Annoncer mes jalons » se coupe\n');
  for (const [x, c] of controles(J0).concat(cablage())) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── FETES-1 — contre-épreuve\n');
const essais = [
  ['une annonce qui ignore le réglage est vue', J0.replace('  if (!_mvFetesOn()) return;   // ★ FETES-1', '  // ★ FETES-1'), 'coupée, l’annonce se tait'],
  ['un réglage coupé d’office est vu', J0.replace("return localStorage.getItem(_mvFetesCle()) !== '0';", "return localStorage.getItem(_mvFetesCle()) === '1';"), 'par défaut, les jalons'],
];
let rates = 0;
for (const [x, J, cible] of essais) { const vu = controles(J).some(([y, c]) => y.startsWith(cible) && !c); if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); } }
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
