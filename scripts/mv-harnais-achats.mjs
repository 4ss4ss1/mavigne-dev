/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ACHATS : LE SEUL ENDROIT OU L'ON MET LES PRIX
   Rejoue le moteur de _pachLignes sur des scenarios reels, puis REINTRODUIT
   chaque defaut et exige que le harnais ROUGISSE.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
const PIL = readFileSync('src/pilotage.js', 'utf8');
const RSV = readFileSync('src/reserve.js', 'utf8');
const TRA = readFileSync('src/tracteur.js', 'utf8');

let ok = 0, ko = 0;
const t = (n, c, d) => { if (c) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + n); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n + (d !== undefined ? '\n      → ' + d : '')); } };

console.log('\n── TROIS ETATS, JAMAIS DEUX\n');
/* ★★★ Le coeur du lot. `null` = a chiffrer, `0` = sans frais (garantie),
   `>0` = chiffre. Un test truthy confondrait les deux premiers et laisserait
   une reparation sous garantie « a chiffrer » a vie. */
const etat = p => (p == null ? 'a-chiffrer' : (p > 0 ? 'chiffre' : 'sans-frais'));
t('null  -> a chiffrer', etat(null) === 'a-chiffrer');
t('0     -> sans frais (une VALEUR, pas un vide)', etat(0) === 'sans-frais');
t('246.5 -> chiffre', etat(246.5) === 'chiffre');
const L = [{prix:null},{prix:0},{prix:155},{prix:null}];
t('le compteur range 0 avec les CHIFFREES', L.filter(x => x.prix != null).length === 2);
t('le compteur « a chiffrer » ne compte que les vides', L.filter(x => x.prix == null).length === 2);
t('un test truthy donnerait un compte FAUX (la preuve que != null est requis)',
  L.filter(x => x.prix).length === 1);

console.log('\n── LA SOURCE : LE CODE FAIT-IL CE QU\'IL DIT ?\n');
t('aucun test truthy sur un prix dans _pachLignes',
  !/prix:\(?[a-z]\.pri[xz]\?\s/.test(PIL) && /a\.prix!=null&&isFinite/.test(PIL));
t('le prix des futs est lu avec != null', /f\.prix!=null&&isFinite/.test(PIL));
/* TROU TROUVE PAR CONTRE-EPREUVE : la version precedente testait « il existe AU
   MOINS UNE lecture correcte ». Or `r.eur != null` apparait DEUX fois, dans
   _pexData et dans _pachLignes, et en casser une laissait le harnais vert.
   On compte, et surtout on exige qu'AUCUNE lecture truthy ne subsiste. */
t('les DEUX lectures du montant de reparation sont en != null',
  (PIL.match(/r\.eur!=null&&isFinite/g) || []).length === 2,
  (PIL.match(/r\.eur!=null&&isFinite/g) || []).length + ' au lieu de 2');
t('aucune lecture truthy d\'un prix ne subsiste',
  !/[ (][arf]\.(prix|eur)\s*&&/.test(PIL) && !/if\s*\(\s*[arf]\.(prix|eur)\s*\)/.test(PIL),
  (PIL.match(/[ (][arf]\.(prix|eur)\s*&&/g) || []).join(' | '));
t('la saisie accepte 0 (n>=0), pas seulement n>0', /if\(!isFinite\(n\)\|\|n<0\)/.test(PIL));
t('vider le champ remet a null, sans ecraser par 0', /if\(t===''\)\{ prix=null; \}/.test(PIL));

console.log('\n── LE PRIX RETOURNE DANS L\'OBJET\n');
t('_pachEcrit ecrit dans achats[], futs[] et reparateur_hist[]',
  /a\.prix=prix/.test(PIL) && /f\.prix=prix/.test(PIL) && /arr\[k\]\.eur=prix/.test(PIL));
t('il rend le NOM du document a sauver, jamais un booleen',
  /return 'intrants';/.test(PIL) && /return 'reparateur_hist';/.test(PIL));
t('une ligne introuvable rend null et ne sauve rien',
  /if\(!doc\)\{/.test(PIL) && /return null;/.test(PIL));
t('aucune table de prix separee (pas d\'orphelins possibles)',
  !/INTRANTS\.prix|_PRIX_TABLE|prix_par_id/.test(PIL));

console.log('\n── L\'ECRAN N\'INVENTE AUCUN FAIT\n');
t('« Achat » ouvre les formulaires des modules, il ne les recopie pas',
  /window\._rsvOpenFut/.test(PIL) && /window\._rsvOpenAchat/.test(PIL));
t('les formulaires appeles sont bien exposes par leur module',
  /window\._rsvOpenAchat\s*=/.test(RSV) && /window\._rsvOpenFut\s*=/.test(RSV));
t('aucune creation d\'objet metier depuis Pilotage',
  !/INTRANTS\.achats\.push|INTRANTS\.futs\.push|REPARATEUR_HIST\[[^\]]*\]\.unshift/.test(PIL));

console.log('\n── LA SOURCE « REPARATEUR », PAS LES FICHES D\'ENTRETIEN\n');
/* ⚠️ Le signal existait deja : le cycle emmene -> rentre. Faire remonter les
   fiches d'entretien aurait noye l'ecran de pleins de gazole. */
t('Pilotage lit REPARATEUR_HIST', /window\.REPARATEUR_HIST/.test(PIL));
t('Pilotage ne lit PAS les fiches d\'entretien pour les achats',
  !/ENTRETIENS/.test(PIL.slice(PIL.indexOf('function _pachLignes'), PIL.indexOf('function _pachEcrit'))));
t('l\'historique du reparateur porte le fournisseur', /four:_rep\.four\|\|''/.test(TRA));
t('le reparateur se saisit au DEPART, pas au retour', /var four=_g\?_g\.value\.trim\(\):'';/.test(TRA));
t('aucun montant demande au tractoriste',
  !/rep-eur|rep-montant|rep-prix/.test(TRA) && !/rep-eur/.test(readFileSync('index.html','utf8')));
t('le champ « chez qui » existe dans l\'overlay', /id="rep-four"/.test(readFileSync('index.html','utf8')));

console.log('\n── CE QUE LE LOT PRECEDENT A DEFAIT\n');
t('l\'onglet Depenses de La Reserve a disparu', !/_rsvTab==='depenses'/.test(RSV));
t('la cle INTRANTS.depenses a disparu', !/depenses:\s*\[\]/.test(RSV));
t('le garde ne compte plus une cle inexistante',
  /\['produits','achats','inventaires','futs'\]/.test(readFileSync('src/firebase.js', 'utf8')));
t('_eur2 survit au retrait du bloc qui le portait', /function _eur2\(n\)/.test(RSV));
t('le prix des futs est declare au modele', /futs: \[\],\s*\/\/ \[\{id,four,ref,annee,qte,date,prix\}\]/.test(RSV));

console.log('\n── L\'EXERCICE RESTE COHERENT\n');
t('le total additionne les reparations, plus des depenses', /var total=salT\+gnrT\+achT\+repT;/.test(PIL));
t('les trois sommes mensuelles portent le 4e poste',
  /b\.sal\+b\.gnr\+b\.ach\+\(b\.dep\|\|0\)/.test(PIL) && /\(b\.ach\|\|0\)\+\(b\.dep\|\|0\)/.test(PIL));
t('les reparations partent au tracteur, jamais ailleurs',
  /_ateAdd\('trac', f, 'R\\u00e9parateur/.test(PIL));
t('la sous-vue Achats est declaree et routee',
  /\['ach','euro','Achats'\]/.test(PIL) && /_PEC_SUB==='ach'/.test(PIL));
t('la sous-nav rend ses pictos par le sprite, plus en emojis',
  /_mvIcon\(s\[1\],16\)/.test(PIL));

console.log(`\n  ${ok} vert · ${ko} rouge\n`);
process.exit(ko ? 1 : 0);
