/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — COEQ-1 (§343) : LE COÉQUIPIER, CHOISI AVEC L'ACTIVITÉ DU TRACTEUR
   Lancer : node scripts/mv-harnais-coeq1.mjs          (le contrôle)
            node scripts/mv-harnais-coeq1.mjs --contre  (la contre-épreuve)
   `_mvActCoeq` est EXÉCUTÉE sur des activités inventées ; le reste est le câblage
   (la fenêtre de nouvelle session, l'enregistrement, la fiche, l'éditeur).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const T0 = fs.readFileSync('src/tracteur.js', 'utf8'), H0 = fs.readFileSync('index.html', 'utf8'), R0 = fs.readFileSync('src/reglages.js', 'utf8');
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0, k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
function controles(T, H, R) {
  const r = [];
  let coeq = null; try { coeq = new Function(fonction(T, '_mvActCoeq') + '\nreturn _mvActCoeq;')(); } catch (e) { coeq = null; }
  const q = a => { try { return coeq(a); } catch (e) { return 'erreur'; } };
  r.push(['_mvActCoeq existe et s’exécute', typeof coeq === 'function']);
  r.push(['d’office : tarière, ensemencement, semis, engrais (accents et majuscules indifférents)', q({ nom: 'Tarière' }) === true && q({ nom: 'Ensemencement' }) === true && q({ nom: 'SEMIS' }) === true && q({ nom: 'Engrais' }) === true]);
  r.push(['les autres activités : sans coéquipier', q({ nom: 'Rognage' }) === false && q({ nom: 'Labour' }) === false && q({ nom: 'Traitement' }) === false && q(null) === false]);
  r.push(['la décision de l’admin l’emporte, dans les deux sens', q({ nom: 'Tarière', coequipier: false }) === false && q({ nom: 'Rognage', coequipier: true }) === true]);
  r.push(['la fenêtre « Nouvelle session » a sa zone, cachée d’office', /<div id="s-coeq-wrap" style="display:none"><div class="fl"[^>]*>Coéquipier<\/div><div class="ppicker" id="s-coeq-pick"><\/div><\/div>/.test(H)]);
  r.push(['le coéquipier suit l’ouverture, l’activité et le conducteur', /_sessCoeqRender\(\);   \/\/ COEQ-1 \(§343\)\n  _openOv\('ovSession'\);/.test(T) && /function onSessionActChange\(\)\{\n  var actNom=_actNomDuSelect\('s-act'\);\n  _sessCoeqRender\(\);/.test(T) && /if\(parent&&parent\.id==='s-cond-pick'\)_sessCoeqRender\(\);/.test(T)]);
  const rd = fonction(T, '_sessCoeqRender');
  r.push(['le conducteur n’est pas proposé comme coéquipier, ni un membre inactif ; « Personne » d’office', /m\.nom!==cond&&\(m\.statut\|\|'Actif'\)==='Actif'/.test(rd) && /Personne<\/div>/.test(rd) && /_escHtml\(n\)/.test(rd) && /_escAttr\(n\)/.test(rd)]);
  const sv = fonction(T, 'saveSession');
  r.push(['l’enregistrement ne pose le champ que s’il porte un nom (jamais undefined)', /if\(_coeq\) _sess\.coequipier=_coeq;/.test(sv) && /SESSIONS\.push\(_sess\);/.test(sv) && !/coequipier:/.test(sv)]);
  r.push(['la fiche d’une session dit « … et <coéquipier> »', /\$\{s\.coequipier\?' et '\+s\.coequipier:''\}/.test(T)]);
  r.push(['l’éditeur d’activité : la case, lue et écrite', H.includes('id="eat-coeq"') && /_coeqEl\.checked=!!\(window\._mvActCoeq&&window\._mvActCoeq\(act\)\)/.test(R) && /act\.coequipier=!!_coeqEl\.checked;/.test(R)]);
  r.push(['la liste des activités montre « À deux »', /window\._mvActCoeq\(a\)\)\?_mvBadge\('À deux','neutre'\)/.test(R)]);
  return r;
}
let ok = 0, ko = 0;
const t = (n, c) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + n); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n); } };
if (!CONTRE) {
  console.log('\n── COEQ-1 — le coéquipier, choisi avec l’activité\n');
  for (const [n, c] of controles(T0, H0, R0)) t(n, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── COEQ-1 — contre-épreuve\n');
const essais = [
  ['le rognage devenu « à deux » d’office est vu', T0.replace("s==='tariere'||s==='ensemencement'", "s==='tariere'||s==='rognage'||s==='ensemencement'"), H0, R0, 'les autres activités'],
  ['un champ coequipier écrit vide (undefined) est vu', T0.replace('  if(_coeq) _sess.coequipier=_coeq;', '  _sess.coequipier=_coeq||undefined;'), H0, R0, 'l’enregistrement'],
  ['le conducteur proposé comme son propre coéquipier est vu', T0.replace("m.nom!==cond&&", ''), H0, R0, 'le conducteur n’est pas proposé'],
];
let rates = 0;
for (const [n, T, H, R, cible] of essais) { const vu = controles(T, H, R).some(([x, c]) => x.startsWith(cible) && !c); if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); } }
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
