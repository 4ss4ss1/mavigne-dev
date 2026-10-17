/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — TACHEPER-1 (§352) : UNE TÂCHE COCHÉE EN MODIFIANT UNE PÉRIODE ENTRE DANS LE DOMAINE
   Lancer : node scripts/mv-harnais-tacheper1.mjs          (le contrôle)
            node scripts/mv-harnais-tacheper1.mjs --contre  (la contre-épreuve)
   `_perAssureTaches` et `_seedFromCat` sont EXÉCUTÉES (extraites de src/reglages.js) ;
   le reste est le câblage : création, modification, réparation à l'ouverture (admin seul).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const G0 = fs.readFileSync('src/reglages.js', 'utf8'), A0 = fs.readFileSync('src/app.js', 'utf8');
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let j = src.indexOf('{', i), d = 0;
  for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } }
  return src.slice(i, j + 1);
}
let n = 0;
async function charger(G) {
  const code = 'const window = globalThis.__w;\n' + fonction(G, '_seedFromCat') + '\n' + fonction(G, '_perAssureTaches') + '\nexport { _perAssureTaches };\n// ' + (++n) + '\n';
  return import('data:text/javascript;base64,' + Buffer.from(code, 'utf8').toString('base64'));
}
async function controles(G, A) {
  const r = [];
  globalThis.__w = {
    TACHES: [{ nom: 'Taille', hha: 70 }],
    TACHES_CATALOGUE: [{ nom: 'Taille', hha: 70 }, { nom: 'Entreplantation', anytime: true, trous: true, minTrou: 3, obligatoire: true }, { nom: 'Relevage', hha: 90, type: 'niveaux', niveaux: [{ num: 1, hha: 50 }] }],
  };
  const M = await charger(G), W = globalThis.__w;
  const a = M._perAssureTaches(['Taille', 'Entreplantation', 'Ma tâche maison', 'Entreplantation']);
  r.push(['une tâche de la convention cochée entre dans le domaine, une seule fois', a.join() === 'Entreplantation' && W.TACHES.filter(t => t.nom === 'Entreplantation').length === 1, JSON.stringify(a)]);
  const e = W.TACHES.find(t => t.nom === 'Entreplantation') || {};
  r.push(['elle arrive avec sa nature (à trous, toute l’année)', e.trous === true && e.anytime === true && e.minTrou === 3 && e.hha === undefined, JSON.stringify(e)]);
  r.push(['une tâche inconnue de la convention ne se crée pas (une tâche du domaine supprimée ne revient pas)', !W.TACHES.some(t => t.nom === 'Ma tâche maison')]);
  r.push(['la deuxième fois, rien ne bouge', M._perAssureTaches(['Entreplantation', 'Taille']).length === 0 && W.TACHES.length === 2]);
  const ss = fonction(G, 'saveSaison'), es = fonction(G, 'saveEditSaison'), rp = fonction(A, '_perReparerTaches'), mi = fonction(A, '_migrateTachesSaison');
  r.push(['la création passe par l’écrivain unique', /_perAssureTaches\(_selNoms\)/.test(ss) && !/TACHES_CATALOGUE/.test(ss)]);
  r.push(['la modification aussi, et enregistre les tâches ajoutées', /var _tAjout=_perAssureTaches\(s\.taches\);/.test(es) && /if\(_tAjout\.length\)\{[\s\S]*window\.saveData\('taches'\)/.test(es)]);
  r.push(['le message de la modification s’écrit en clair (plus de « U0001F4C5 »)', !/U0001F4C5/.test(G) && /showToast\('Période mise à jour'/.test(es)]);
  r.push(['la réparation à l’ouverture : admin seul, données chargées, puis enregistrée', /isAdmin\(\)\)\|\|!\(typeof canWrite==='function'&&canWrite\(\)\)\) return false;/.test(rp) && /_mvKeyLoaded\.taches\|\|!_mvKeyLoaded\.saisons/.test(rp) && /saveData\('taches'\)/.test(rp)]);
  r.push(['elle tourne après la migration des listes de tâches', /_migrateSaisonTaches\(\);\n  _perReparerTaches\(\);/.test(mi)]);
  r.push(['l’écrivain unique est exposé à app.js', /window\._perAssureTaches\s*=\s*_perAssureTaches;/.test(G)]);
  return r;
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── TACHEPER-1 — une tâche cochée entre dans le domaine\n');
  for (const [x, c, d] of await controles(G0, A0)) t(x, c, d);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── TACHEPER-1 — contre-épreuve\n');
const essais = [
  ['la modification qui oublie le domaine est vue', G0.replace('  var _tAjout=_perAssureTaches(s.taches);', '  var _tAjout=[];'), A0, 'la modification aussi'],
  ['une tâche hors convention créée est vue', G0.replace("    if(cat){ window.TACHES.push(_seedFromCat(cat)); ajout.push(tnom); }", "    window.TACHES.push(cat?_seedFromCat(cat):{nom:tnom}); ajout.push(tnom);"), A0, 'une tâche inconnue'],
  ['une réparation qui écrit depuis tous les téléphones est vue', G0, A0.replace("if(!(typeof isAdmin==='function'&&isAdmin())||!(typeof canWrite==='function'&&canWrite())) return false;", "if(!(typeof canWrite==='function'&&canWrite())) return false;"), 'la réparation à l’ouverture'],
];
let rates = 0;
for (const [x, G, A, cible] of essais) {
  let vu; try { vu = (await controles(G, A)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = true; console.log('      (plantage, donc vu : ' + String(e && e.message).slice(0, 60) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
