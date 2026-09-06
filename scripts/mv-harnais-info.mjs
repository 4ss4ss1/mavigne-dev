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
function corpsPil(nom){
  const i = PILNU.indexOf('function '+nom+'('); if(i<0) return '';
  let d=0, k=PILNU.indexOf('{', i);
  for(let x=k;x<PILNU.length;x++){ if(PILNU[x]==='{')d++; else if(PILNU[x]==='}'){d--; if(!d) return PILNU.slice(i,x+1);} }
  return '';
}
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
/* Un ou deux niveaux apres le module : `pil.gnr`, `pil.eco.remarques`. Le
   second dit module + ecran + chose — l'assertion d'origine n'autorisait qu'un
   seul niveau et rejetait le nommage le plus precis. */
const NOM = /^[a-z]{3,5}(\.[a-z0-9]+){1,2}$/;
t('chaque cle est nommee par son module (prefixe « xxx. »)',
  cles.every(k => NOM.test(k)), cles.filter(k => !NOM.test(k)).join(', '));

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
/* ⚠️ VECU AU LOT SUIVANT : cette detection ne cherchait que `_mvInfoBtn('X')`
   et `data-mvi="X"`. Des que la cle est passee en ARGUMENT (_pilTile(…, 'pil.x')),
   la fiche passait pour orpheline. On cherche desormais la cle elle-meme,
   litteralement, partout hors du dictionnaire — c'est vrai quelle que soit la
   facon dont elle est posee. */
const HORS = [UNU.slice(0, UNU.indexOf('const MV_INFO = {')) + UNU.slice(UNU.indexOf('\n};', UNU.indexOf('const MV_INFO = {'))),
              PILNU, HTML].join('\n');
const posees = new Set([...[UNU, PILNU, HTML].join('\n')
  .matchAll(/_mvInfoBtn\(\s*'([^']+)'|data-mvi="([^"]+)"/g)]
  .map(m => m[1] || m[2]).filter(x => x && !x.includes('+')));
t('toute pastille posee a sa fiche', [...posees].every(k => cles.includes(k)),
  [...posees].filter(k => !cles.includes(k)).join(', '));
const estPosee = k => posees.has(k) || HORS.includes("'" + k + "'");
t('toute fiche est posee quelque part', cles.every(estPosee),
  cles.filter(k => !estPosee(k)).join(', '));

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

/* ══ 5 bis. « L'EQUIPE & LE MATERIEL » : SIX CARTES, SIX FICHES, SIX CADRES ══
   Une carte sans ligne de cadre est une carte dont on ne sait pas sur quoi le
   chiffre a ete calcule. Une fiche sans pastille est une fiche inatteignable.
   On exige les trois pour chacune des six. */
// ⚠️ « traitement » A QUITTE CETTE LISTE le 15/08. La fenetre de traitement
//   etait rendue a DEUX endroits pour une seule source (_pilTreatDays) : elle a
//   fusionne dans « Traiter ? » (Aujourd'hui), qui n'est pas une _pilTile mais
//   une .pil-tile2. Sa garantie est reprise plus bas, sous sa forme neuve.
// ⚠️ « phyto » reste dans la liste : la carte existe toujours, a l'identique.
//   Elle a seulement change d'ONGLET (materiel → Conformite). Ce controle-ci
//   verifie sa forme, pas sa place.
const CARTES = ['equipe','presences','tracteur','gnr','phyto','capacite'];
for (const c of CARTES) {
  const app = [...PIL.matchAll(new RegExp("_pilTile\\('" + c + "'[\\s\\S]{0,900}?\\);", 'g'))];
  t(`la carte « ${c} » est rendue`, app.length >= 1);
  // ⚠⚠ FAUX-VERT FERME : `[].every(...)` rend TRUE. Sans le `app.length >= 1`,
  //   une carte supprimee sortait « pas rendue ✗ » mais « porte sa fiche ✓ » et
  //   « porte une ligne de cadre ✓ » — deux verts sur zero appel. Vecu le 15/08.
  t(`« ${c} » porte sa fiche`,
    app.length >= 1 && app.every(m => m[0].includes("'pil." + c + "'")),
    app.length ? 'appel sans cle' : 'aucun appel');
  t(`« ${c} » porte une ligne de cadre (jamais null)`,
    app.length >= 1 && app.every(m => !/,\s*null,\s*null,/.test(m[0].replace(/\n\s*/g,' '))));
}

/* « Traiter ? » : la carte qui a absorbe la fenetre de traitement. Ce n'est pas
   une _pilTile — elle vit dans la grille .pil-dec du cockpit — donc on verifie
   les trois memes choses sous sa forme propre. */
const CK = (() => { const i = PIL.indexOf('function _pilCkTraiter('); let d = 0, s = PIL.indexOf('{', i);
  for (let k = s; k < PIL.length; k++) { if (PIL[k] === '{') d++; else if (PIL[k] === '}') { d--; if (!d) return PIL.slice(s, k + 1); } }
  return ''; })();
t('« Traiter ? » existe', CK.length > 0);
t('« Traiter ? » porte la fiche pil.traitement', CK.includes("_mvInfoBtn('pil.traitement')"));
t('« Traiter ? » porte les cinq jours', CK.includes('_pilTreatRows(days)'));
t('… derriere un depliant, pas etires dans la grille', CK.includes('<details class="pil-t5"'));
t('le verdict du jour reste en grand, jamais replie', /pil-big[\s\S]{0,80}\+big\+/.test(CK));
t('le dessin des cinq jours est PARTAGE, pas recopie',
  (PIL.match(/_pilTreatRows\(/g) || []).length === 2);
t('plus aucun second rendu de la fenetre de traitement', !PIL.includes('_pilPanelTraitement'));

/* ══ 5 ter. LES DOUBLONS TROUVES EN DEPLACANT LE TEXTE ══
   Le meme nombre affiche deux fois sur une carte, c'est le lecteur qui doute. */
/* §34g : la phrase survit dans le commentaire qui documente le registre. */
t('Phyto ne redit plus son total dans son corps',
  !PILNU.includes("interventions enregistrées"));
t('GNR ne redit plus ses litres dans son corps',
  !/pil-xxl[\s\S]{0,40}_pilNum\(niveau\)/.test(PIL) && !/31px[^\n]*_pilNum\(niveau\)/.test(PIL));
t('les criteres de traitement ont quitte l\'ecran',
  !PIL.includes('phytotoxicité') && !PIL.includes('DAR / DRE / ZNT'));
t('… et sont dans la fiche',
  txt.includes('phytotoxicité') && txt.includes('ZNT'));
t('« hors capacité vigne » a quitte l\'ecran', !nu(PIL).includes('hors capacité vigne'));
t('… et est dans la fiche', txt.includes('capacité à la vigne'));

/* ══ 5 quater. LA CIBLE HORS REGLAGES ══ */
t('la cible « entretien » existe', /entretien: \['tracteur'/.test(PILNU));
t('_pilGo sait appeler un autre commutateur que switchReglTab',
  /var _sw = C\[3\] \|\| 'switchReglTab'/.test(PILNU));
t('le commutateur vise existe bien sur window',
  fs.readFileSync('src/tracteur.js','utf8').includes('window.switchTracOnglet'));
t('les sept cibles d\'origine gardent leur forme a trois elements',
  ['saisons','taches','dens','secteurs','equipe','tracteurs'].every(k =>
    new RegExp(k + ":\\s*\\['reglages',").test(PILNU)));

/* ══ 5 quinquies. LES FICHES VIVANTES ══
   Un contenu calcule a l'execution echapperait a tout controle statique. La
   regle : une cle vivante reste DECLAREE dans MV_INFO, avec un repli honnete.
   _mvInfoSet refuse toute cle non declaree — sinon la porte est ouverte. */
t('_mvInfoSet existe et est exposee',
  /export function _mvInfoSet/.test(UNU) && /window\._mvInfoSet\s*=/.test(UNU));
const setCorps = UNU.slice(UNU.indexOf('function _mvInfoSet'), UNU.indexOf('export function _mvInfoOpen'));
t('_mvInfoSet refuse une cle non declaree dans MV_INFO', /if \(!MV_INFO\[cle\]\)/.test(setCorps));
t('… et le trace au lieu de l\'avaler', /cle vivante non declaree/.test(setCorps));
t('_mvInfoOpen lit le registre vivant AVANT le dictionnaire',
  /MV_INFO_LIVE\[cle\] \|\| MV_INFO\[cle\]/.test(UNU));
const vivantes = [...PILNU.matchAll(/_mvInfoSet\('([^']+)'/g)].map(m => m[1]);
t('toute fiche remplie a l\'execution est declaree', vivantes.every(k => cles.includes(k)),
  vivantes.filter(k => !cles.includes(k)).join(', '));
t('… et son repli dit honnetement qu\'elle est vide',
  vivantes.every(k => /Aucune remarque|pas encore/.test(MV_INFO[k].p.join(' '))));

/* ══ 5 sexies. LE MUR D'ALERTES D'ECONOMIE ══
   Douze paragraphes empiles, tous au meme poids : ce qui met un chiffre a ZERO
   avait la meme taille que « le chiffre montera mecaniquement ». */
t('_pecAlertes ne produit plus de paves .pec-a', !/pec-a [^"]*'\+em\+/.test(PILNU)
  && !/function _pecAlertes[\s\S]{0,1200}?pec-a /.test(PILNU));
t('les postes a zero sont separes des remarques',
  /function _pecZeros\(E\)/.test(PILNU) && /function _pecRemarques\(E,TL\)/.test(PILNU));
t('… et les deux alimentent le rendu partage',
  /_pecFiabCard\(_pecZeros\(E\), _pecRemarques\(E,TL\),/.test(PILNU));
/* ⚠️ UN SEUL RENDU POUR LES DEUX ECRANS. Deux implementations de la meme carte,
   c'est la garantie qu'elles divergeront — la faute que ce chantier corrige. */
t('la carte de fiabilite n\'a qu\'un seul rendu',
  (PILNU.match(/class="pec-fia bad"/g)||[]).length === 1
  && (PILNU.match(/class="pec-fia ok"/g)||[]).length === 1);
t('_pecFiabCard prend ses cles en argument',
  /function _pecFiabCard\(Z, R, cleFia, cleRem, okTxt, okSous\)/.test(PILNU));
t('le rendu partage pose la pastille dans SES DEUX etats',
  (PILNU.match(/_mvInfoBtn\(cleFia\)/g)||[]).length === 2,
  'trouvee ' + (PILNU.match(/_mvInfoBtn\(cleFia\)/g)||[]).length + ' fois au lieu de 2');
t('la Synthese lui passe ses deux cles',
  /'pil\.eco\.fiabilite', 'pil\.eco\.remarques'/.test(PILNU));
t('chaque poste a zero propose son bouton quand une porte existe',
  /data-diag="'\+_pilEsc\(z\.cible\)/.test(PILNU));
t('un poste sans porte ne promet pas de bouton', /pec-fia-x/.test(PILNU));
t('les remarques sont repliees derriere une puce',
  /class="pec-remq" data-mvi="'\+_pilEsc\(cleRem\)\+'"/.test(PILNU));
t('le cas « tout est en place » a son etat vert', /pec-fia ok/.test(PILNU));
t('la carte de fiabilite est stylee', /\.pec-fia\{/.test(PILNU) && /\.pec-remq\{/.test(PILNU));
t('l\'ecart de cadence garde sa fiche a cote de son chiffre',
  /cart de cadence'\+\(typeof _mvInfoBtn[\s\S]{0,60}?_mvInfoBtn\('pil\.cadence'\)/.test(PILNU));

/* ══ 5 septies. L'EXERCICE PASSE A LA MEME REGLE ══
   Sept paves colores avant le premier chiffre, comme la Synthese en avait douze.
   Meme separation, MEME CARTE — on ne re-implemente pas. */
t('les postes a zero de l\'Exercice sont separes des remarques',
  /function _pexZeros\(E\)/.test(PILNU) && /function _pexRemarques\(E\)/.test(PILNU));
t('l\'Exercice consomme le rendu partage',
  /_pecFiabCard\(_pexZeros\(E\), _pexRemarques\(E\),/.test(PILNU));
t('… avec SES cles, pas celles de la Synthese',
  /'pil\.exo\.fiabilite', 'pil\.exo\.remarques'/.test(PILNU));
t('_pexEntete ne fabrique plus de paves .pec-a',
  !/function _pexEntete[\s\S]{0,900}?pec-a /.test(PILNU));
t('la garde comptable garde sa ligne de cadre a l\'ecran',
  /pas un compte de r\\u00e9sultat/.test(PILNU) && /charges d\\u2019exploitation/.test(PILNU));
t('… et sa liste est partie dans la fiche',
  !PILNU.includes('ni le fermage') && txt.includes('ni le fermage'));
t('la garde porte sa pastille', /_mvInfoBtn\('pil\.exo\.garde'\)/.test(PILNU));

/* Les deux ecrans ne doivent JAMAIS partager une cle : une fiche vivante
   remplie par l'un s'afficherait sous la pastille de l'autre. */
const cleSyn = ['pil.eco.fiabilite','pil.eco.remarques'];
const cleExo = ['pil.exo.fiabilite','pil.exo.remarques'];
t('les deux ecrans ont des cles distinctes',
  cleSyn.every(k => cles.includes(k)) && cleExo.every(k => cles.includes(k))
  && !cleSyn.some(k => cleExo.includes(k)));

/* ══ 5 octies. LE VERDICT D'ECONOMIE ══
   Chaque branche melangeait le verdict, la mise en garde de methode et un chemin
   a retenir. La methode etait meme dite DEUX fois : le paragraphe reprenait mot
   pour mot la fiche `pil.cadence`, et les deux auraient vieilli separement. */
const VERD = corpsPil('_pecVerdict');
t('le verdict porte la fiche de la cadence (une seule source)',
  /_mvInfoBtn\('pil\.cadence'\)/.test(VERD));
t('la mise en garde cave/atelier a quitte le verdict',
  !/cave et l..atelier/.test(VERD) && !/contient aussi la cave/.test(VERD));
t('… et vit toujours dans la fiche', /la cave, l\u2019atelier et le bureau|cave, l’atelier et le bureau/.test(txt));
t('les chemins sont devenus des boutons',
  /data-diag="'\+_pilEsc\(a\[1\]\)/.test(VERD) && /data-pec="sub" data-v="'\+_pilEsc\(a\[1\]\)/.test(VERD));
const VERD_PROSE = VERD.replace(/act\.push\(\[[^\]]*\]\);/g, '')
                       .replace(/var boutons=act\.map\([\s\S]*?\}\)\.join\(''\);/, '');
t('plus aucun chemin ecrit en toutes lettres dans un paragraphe du verdict',
  !/\\u203[Aa]/.test(VERD_PROSE) && !/Postes &amp; travaux|est dans <b>Postes/.test(VERD_PROSE),
  'chevron ou renvoi trouve hors des boutons');
t('la source « an dernier » a sa ligne de cadre', /pec-vcadre/.test(VERD));

/* ⚠️⚠️ LE PIEGE QU'AUCUN CONTROLE NE VOIT, TROUVE A LA CAPTURE.
   Dans un conteneur flex, CHAQUE element enfant devient un item a part : le <b>
   du nom de campagne formait sa propre colonne et la phrase se coupait en trois.
   Toute ligne de cadre pouvant contenir du HTML doit envelopper son texte. */
t('la ligne de cadre du verdict enveloppe son texte dans un span',
  /pec-vcadre"><span>/.test(VERD));
t('… et le CSS ne le laisse pas retrecir', /\.pec-vcadre>span\{flex:1;min-width:0\}/.test(PILNU));
/* Le pendant pour les cartes : _pilTile ECHAPPE son sous-titre, donc aucun <b>
   n'y devient un item. C'est ce qui rend le meme piege impossible la-bas. */
t('la ligne de cadre des cartes echappe son contenu (pas de HTML, pas de piege)',
  /pil-tsub">'\+_pilEsc\(subHtml\)/.test(PILNU));

/* ══ 5 nonies. LE SOUS-TITRE D'UNE CARTE EST UNE LIGNE DE CADRE ══
   Pas un mode d'emploi. Un sous-titre long, c'est de la methode restee a
   l'ecran — on la lit a chaque ouverture au lieu d'une fois. */
const CS = [...PILNU.matchAll(/pec-cs">([^']{0,600})/g)].map(m => m[1]);
const CS_LONGS = CS.filter(x => x.replace(/<[^>]+>/g,'').replace(/\\u[0-9A-Fa-f]{4}/g,'').length > 95);
t('aucun sous-titre de carte ne depasse la ligne de cadre',
  CS_LONGS.length === 0, CS_LONGS.length + ' trop long(s), dont : ' + (CS_LONGS[0]||'').slice(0,110));

const CARTES_ECO = ['pil.eco.revient','pil.eco.postes','pil.eco.travaux','pil.eco.parcelles','pil.exo.salaires'];
for (const k of CARTES_ECO)
  t(`la carte « ${k.split('.').pop()} » porte sa fiche`, PILNU.includes("_mvInfoBtn('" + k + "')"));

/* Les phrases deplacees ne doivent pas etre restees en double a l'ecran. */
const PARTIES = [
  // ⚠️ Ce motif existe AUSSI dans le libelle du reglage lui-meme (_PEC_HYPO), ou
  //   il est a sa place. On ne le cherche que dans la vue qui l'affichait en trop.
  ['l\'hypothese de conversion', 'hypoth\\u00e8se de conversion</b> (', ],
  ['le detail des colonnes MO / Reste / Budget', 'main-d\\u2019\\u0153uvre d\\u00e9j\\u00e0 faite'],
  ['« cliquez pour trier »', 'Cliquez sur un en-t\\u00eate'],
  ['le bareme complet contre le realise', 'bar\\u00e8me complet'],
  ['« ce qu\'une parcelle a de particulier »', 'a de particulier, une fois la surface'],
  ['l\'ecart conges / absences remunerees', 'ce sont les cong\\u00e9s et les absences'],
];
for (const [nom, motif] of PARTIES)
  t(nom + ' a quitte l\'ecran', !PILNU.includes(motif));

/* ══ 5 decies. LES QUATRE DERNIERS ONGLETS ══
   Simuler, Conformite, Cave, La campagne. « Comment lire » est, par definition,
   ce qu'on lit une fois — c'etait affiche en permanence entre chaque titre
   d'etape et son graphe. */
t('les cinq etapes du simulateur portent leur fiche',
  ['frise','semaine','cout','plan','modele'].every(k => PILNU.includes("_mvInfoBtn('pil.sim." + k + "')")));
t('plus aucun « Comment lire » a l\'ecran', !PILNU.includes('Comment lire'));
t('… et les explications sont dans les fiches',
  txt.includes('ligne par travail') && txt.includes('une fois l\u2019\u00e9ch\u00e9ance tranch\u00e9e'.replace(/\\u2019/g,'\u2019')));
/* La legende de couleurs RESTE : on ne la lit pas, on la consulte du regard. */
t('la legende des couleurs reste a l\'ecran',
  /rf-k[\s\S]{0,200}Vert[\s\S]{0,200}Hachur[\s\S]{0,200}Rouge/.test(PILNU));
/* ⚠️ ON MESURE, ON NE CHERCHE PAS UNE PHRASE. Un `!includes` sur du texte
   echappe est vrai des qu'un niveau d'echappement diverge — donc toujours vert.
   La longueur du bloc, elle, ne ment pas. */
const RFLIM = (PILNU.match(/rf-lim">[\s\S]{0,1200}?<\/div>'/) || [''])[0];
t('« ce que le modele suppose » ne garde que son fait utile',
  RFLIM.length > 0 && RFLIM.length < 400, RFLIM.length + ' caracteres (400 max)');

t('les trois cartes de Conformite portent leur fiche',
  ['cuivre','ift','dre'].every(k => PILNU.includes("_mvInfoBtn('pil.cfm." + k + "')")));
t('le fait qui protege reste a l\'ecran (delai de rentree)',
  /Ne pas p\\u00e9n\\u00e9trer la parcelle/.test(PILNU));
t('le detail CLP est parti dans la fiche',
  !PILNU.includes('phrases de risque CLP') && txt.includes('phrases de risque CLP'));

t('_pcavCard accepte une cle de fiche (7e argument)',
  /function _pcavCard\(ico,dot,titre,stat,body,mini,infoCle\)/.test(PILNU));
t('… et la pose dans l\'en-tete, pas dans le pied',
  /pcav-t">'\+_pilEsc\(titre\)\+'<\/span>'\s*\+\(infoCle/.test(PILNU));
t('les quatre cartes de la Cave portent leur fiche',
  ['anges','malo','ouillage','rdt'].every(k => PILNU.includes("'pil.cav." + k + "'")));
const ANGES = (PILNU.match(/'[^']{0,400}',\s*'pil\.cav\.anges'\)/) || [''])[0];
t('la note de la part des anges est ramenee a une ligne',
  ANGES.length > 0 && ANGES.length < 130, ANGES.length + ' caracteres (130 max)');
t('… et la mesure est dans la fiche', /exactement ce qui s.{0,3}est/.test(txt));

t('« une moyenne n\'est pas un pic » garde sa fiche',
  PILNU.includes("_mvInfoBtn('pil.avc.temps')"));

/* ══ 6. LES DEUX DETTES DE §34i SOLDEES ══ */
t('_PIL_SEM ne se declare plus dans le module', !/var _PIL_SEM\s*=/.test(PILNU));
t('_PIL_SEM est exporte par utils.js', /export const _PIL_SEM = \{/.test(UNU));
t('pilotage.js l\'importe (plus de lecture sur window)',
  /import \{[^}]*_PIL_SEM[^}]*\} from '\.\/utils\.js'/.test(PILNU));
t('_PIL_SEM n\'est expose qu\'une fois', (nu(U + PIL).match(/window\._PIL_SEM\s*=/g) || []).length === 1);

console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
process.exit(ko ? 1 : 0);
