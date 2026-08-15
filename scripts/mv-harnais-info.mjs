/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LA PASTILLE « i » (MV_INFO)
   Lancer : node scripts/mv-harnais-info.mjs
   ⚠️ ON EXECUTE MV_INFO, ON NE LE RELIT PAS — meme regle que le controle du
      journal des nouveautes. Une relecture a l'oeil ne voit ni un backslash
      rendu litteralement, ni une cle en double, ni un demi-surrogate isole.
   ⚠️ §34g : `corps()` retire les commentaires. Un harnais qui lit ce qu'on
      RACONTE au sujet du code ne teste pas le code.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';

const U    = fs.readFileSync('src/utils.js', 'utf8');
const PIL  = fs.readFileSync('src/pilotage.js', 'utf8');
const HTML = fs.readFileSync('index.html', 'utf8');
const CSS  = fs.readFileSync('src/styles.css', 'utf8');
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');
const UNU = nu(U), PILNU = nu(PIL);

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};

console.log('\n── LA PASTILLE « i » — MV_INFO\n');

/* ══ 1. Le dictionnaire, EXECUTE ══ */
const i = U.indexOf('export const MV_INFO = {');
if (i < 0) { console.log('  \x1b[31m✗\x1b[0m MV_INFO introuvable dans src/utils.js'); process.exit(1); }
const j = U.indexOf('\n};', i) + 3;
const bloc = U.slice(i, j).replace('export const', 'const') + '\nexport { MV_INFO };\n';
const { MV_INFO } = await import('data:text/javascript;base64,'
  + Buffer.from(bloc, 'utf8').toString('base64'));
const cles = Object.keys(MV_INFO);

t('MV_INFO s\'evalue et n\'est pas vide', cles.length > 0, cles.length + ' fiche(s)');
t('chaque fiche porte un titre et au moins un paragraphe',
  cles.every(k => MV_INFO[k] && MV_INFO[k].t && Array.isArray(MV_INFO[k].p) && MV_INFO[k].p.length));
t('chaque cle est nommee par son module (prefixe « xxx. »)',
  cles.every(k => /^[a-z]{3,5}\.[a-z0-9]+$/.test(k)), cles.filter(k => !/^[a-z]{3,5}\.[a-z0-9]+$/.test(k)).join(', '));

const txt = cles.flatMap(k => [MV_INFO[k].t, ...MV_INFO[k].p]).join('\n');
t('aucun backslash rendu litteralement', txt.indexOf('\\') === -1);
let demi = 0;
for (let k = 0; k < txt.length; k++) {
  const o = txt.charCodeAt(k);
  if (o >= 0xD800 && o <= 0xDBFF) { const n = txt.charCodeAt(k + 1); if (!(n >= 0xDC00 && n <= 0xDFFF)) demi++; }
  else if (o >= 0xDC00 && o <= 0xDFFF) { const p = txt.charCodeAt(k - 1); if (!(p >= 0xD800 && p <= 0xDBFF)) demi++; }
}
t('aucun demi-surrogate isole', demi === 0, demi + ' isole(s)');
t('les balises <b> sont refermees',
  cles.every(k => MV_INFO[k].p.every(p =>
    (p.match(/<b>/g) || []).length === (p.match(/<\/b>/g) || []).length)));

/* ══ 2. AUCUNE PASTILLE MORTE, AUCUNE FICHE ORPHELINE ══
   C'est le seul controle qui compte vraiment : un bouton qui ouvre une feuille
   vide est plus deroutant qu'une explication absente. */
const posees = new Set([...[UNU, PILNU, HTML].join('\n')
  .matchAll(/_mvInfoBtn\(\s*'([^']+)'|data-mvi="([^"]+)"/g)]
  .map(m => m[1] || m[2]).filter(x => x && !x.includes('+')));
t('toute pastille posee a sa fiche', [...posees].every(k => cles.includes(k)),
  [...posees].filter(k => !cles.includes(k)).join(', '));
t('toute fiche est posee quelque part', cles.every(k => posees.has(k)),
  cles.filter(k => !posees.has(k)).join(', '));

/* ══ 3. LA CHAINE COMPLETE ══ */
t('la feuille #ovInfo existe dans index.html', /id="ovInfo"/.test(HTML));
t('l\'hote #info-inner existe (sinon _mvInfoOpen sort sans rien faire)', /id="info-inner"/.test(HTML));
t('le fond de la feuille ferme l\'overlay', /closeOv\(event,'ovInfo'\)/.test(HTML));
t('_mvInfoOpen passe par openOv (Echap, retour arriere, empilement)',
  /openOv\('ovInfo'\)/.test(UNU));
t('_mvInfoOpen et _mvInfoBtn sont exposes sur window',
  /window\._mvInfoOpen\s*=/.test(UNU) && /window\._mvInfoBtn\s*=/.test(UNU));
t('un seul ecouteur, delegue sur le document', (UNU.match(/data-mvi\]/g) || []).length >= 1
  && /addEventListener\('click'/.test(UNU.slice(UNU.indexOf('_mvInfoOpen'))));

/* ⚠️ LE POINT QUI CASSE TOUT S'IL MANQUE : la pastille vit dans un en-tete de
   tuile qui replie la tuile au clic. Sans stopPropagation, ouvrir la fiche
   fermerait l'ecran qu'on cherche a comprendre. */
const ecouteur = UNU.slice(UNU.indexOf("closest('[data-mvi]')"), UNU.indexOf("closest('[data-mvi]')") + 400);
t('l\'ecouteur arrete la propagation (sinon la tuile se replie)',
  /stopPropagation\(\)/.test(ecouteur));

t('une cle inconnue est tracee, pas avalee en silence',
  /MV_INFO : cle inconnue/.test(U));

/* ══ 4. L'HABILLAGE ══ */
t('.mv-i est stylee dans styles.css', /\.mv-i\{/.test(CSS));
t('.mv-i a une cible tactile elargie (::after)', /\.mv-i::after\{/.test(CSS));
t('.mvi-bd est stylee', /\.mvi-bd\{/.test(CSS));

/* ══ 5. LE TEXTE A BIEN QUITTE L'ECRAN — pas ete duplique ══
   Trois phrases pilotes : si elles sont encore dans le module ET dans la fiche,
   le lot n'a rien deplace, il a recopie. */
const partis = [
  ['la capacite : « hors bureau, hors absents »', 'hors bureau, hors absents'],
  ['la cadence : le biais cave/atelier/bureau', 'la cave, l\u2019atelier et le bureau'],
  ['les deux cadres : « pourquoi les deux totaux »', 'Pourquoi les deux totaux'],
  ['les deux cadres : le compte de resultat', 'ce n\u2019est pas un compte de r\u00e9sultat'],
];
for (const [nom, ph] of partis) {
  // §34g dans l'autre sens : la phrase survit dans un COMMENTAIRE qui explique
  // le deplacement. On lit le code seul, sinon on interdit de se documenter.
  t(nom + ' a quitte l\'ecran', !PILNU.includes(ph));
  t(nom + ' est dans la fiche', txt.includes(ph) || txt.includes(ph.replace(/\u2019/g, "'")));
}

/* ══ 6. LES DEUX DETTES DE §34i SOLDEES ══ */
t('_PIL_SEM ne se declare plus dans le module', !/var _PIL_SEM\s*=/.test(PILNU));
t('_PIL_SEM est exporte par utils.js', /export const _PIL_SEM = \{/.test(UNU));
t('pilotage.js l\'importe (plus de lecture sur window)',
  /import \{[^}]*_PIL_SEM[^}]*\} from '\.\/utils\.js'/.test(PILNU));
t('_PIL_SEM n\'est expose qu\'une fois', (nu(U + PIL).match(/window\._PIL_SEM\s*=/g) || []).length === 1);

console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
process.exit(ko ? 1 : 0);
