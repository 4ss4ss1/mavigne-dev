// Harnais du lot AUDIT PILOTAGE (APP 6.07 / SW 6.57).
// ⚠️ Il verifie le SENS. La mecanique (catch muets, div dans button, ESLint) est
//    au preflight : on ne duplique pas l'un dans l'autre (§34e).
// ⚠️ `corps()` retire les commentaires : un harnais qui lit ce qu'on RACONTE au
//    sujet du code ne teste pas le code (§34g).
import fs from 'fs';
const f = process.argv[2] || 'src/pilotage.js';
const SRC = fs.readFileSync(f, 'utf8');
const NC  = SRC.replace(/^\s*\/\/.*$/gm, '');          // sans commentaires
function corps(nom){
  const i = NC.indexOf('function '+nom);
  if(i<0) return '';
  let d=0, s=NC.indexOf('{', i);
  if(s<0) return '';
  for(let k=s;k<NC.length;k++){ if(NC[k]==='{')d++; else if(NC[k]==='}'){d--; if(!d) return NC.slice(s,k+1);} }
  return NC.slice(s);
}
let ko=0, n=0;
const T=(lab,cond)=>{ n++; if(!cond){ console.log('  ROUGE  '+lab); ko++; } };

// ── A1 : les deux barres collantes ──
T('A1 le fil porte un id',                 /class="pil-portee" id="pil-portee"/.test(NC));
T('A1 le top des onglets est une variable', /body \.pil-tabsbar\{top:var\(--pil-portee-h/.test(NC));
T('A1 la hauteur est MESUREE, pas ecrite', /getBoundingClientRect\(\)\.height/.test(corps('_pilStickyH')));
T('A1 mesuree a chaque repeinte du fil',   /_pilStickyH\(\)/.test(corps('_pilPortee')));

// ── A2/A4/B6 : la barre et les titres ──
T('A2 le niveau ① a un titre',             /an:'L\\'ann\u00e9e/.test(NC));
T('A4 « Avancement » ne titre plus',       !/avc:'Avancement'/.test(NC));
// ★★★ CLIQUET INVERSE LE 15/08 — ET C'EST UN REVIREMENT ASSUME.
//   §34 lot 5 avait declare « Decider » mort : la barre etait alors une liste de
//   SUJETS, et un verbe d'action y detonnait. La barre est un axe de ZOOM depuis,
//   et l'onglet `sim` contient la SEULE carte du module qui ecrive une donnee
//   partagee (l'ordre de passage → CONFIG.ordre_passage_t → ecran de l'equipe).
//   Un onglet nomme « Simuler » promettait qu'il ne s'y passe rien : c'etait faux.
//   ⚠️ L'assertion ne DISPARAIT pas, elle CHANGE DE SENS. Un cliquet qu'on retire
//     ne protege plus rien ; celui-ci garde desormais le nom neuf.
T('A4 « Decider » titre a nouveau (revirement §34 lot 5)', /sim:'Décider — /.test(NC));
T('A4 « Simuler » ne titre plus',          !/sim:'Simuler/.test(NC) && !/'Simuler'\]/.test(NC));
T('A4 la cle `sim` n\'a PAS bouge',           /\['sim','/.test(NC) && /\bsim:1/.test(NC));
T('B6 l\'onglet ③ ne promet plus de taches', !/L\\'\u00e9quipe & les t\u00e2ches/.test(NC));
T('B6 la cle `equ` n\'a PAS bouge',        /\['equ','\\uD83D\\uDC65'/.test(NC));
T('A4 libelle d\'onglet echappe',          /_pilEsc\(t\[2\]\)/.test(NC));

// ── A3 : la memoire du niveau ① ──
// ⚠️ L'ASSERTION EXIGEAIT L'ADJACENCE, PAS LA PRESENCE. Elle rougissait des
//   qu'une cle du meme onglet s'intercalait — ici `an_budget`. Son INTENTION
//   etait « les deux cles sont aux defauts » : on la teste, une par une.
T('A3 an_cadres est aux defauts',          /\ban_cadres:1/.test(NC));
T('A3 an_frise est aux defauts',           /\ban_frise:1/.test(NC));
T('A3 an_budget est aux defauts',          /\ban_budget:1/.test(NC));
T('A3 avc_etp a quitte les defauts',       !/avc_etp:1/.test(NC));
T('A3 on migre AVANT de normaliser',       /_pilNormalize\(_pilMigrShow\(JSON\.parse\(raw\)\)\)/.test(corps('_pilLoadState')));
T('A3 la migration ne passe plus apres',   !/return _pilMigrShow\(n\)/.test(corps('_pilLoadState')));

// ── A7 : « Voir les deux cadres » ──
T('A7 le panneau porte une ancre',         /id="pil-an-cadres"/.test(NC));
T('A7 le constat vise une cible interne',  /cible:'an_cadres'/.test(NC));
T('A7 _pilGo sait rester dans le module',  /an_cadres/.test(corps('_pilFlash'))===false && /cible==='an_cadres'/.test(NC));
T('A7 le clignotement a UN seul site',     (NC.match(/el\.style\.boxShadow='0 0 0 3px var\(--or\)'/g)||[]).length===1);

// ── A8 : les impasses ──
T('A8 le helper existe',                   /function _pilEmptyGo\(txt,cible,lib\)/.test(NC));
T('A8 il passe par la porte du diagnostic', /data-diag=/.test(corps('_pilEmptyGo')));
// ⚠️ C'ETAIT UN CLIQUET A L'ENVERS. La condition « exactement 8 » rougissait des
//   qu'on AJOUTAIT un bouton — c'est-a-dire chaque fois qu'on faisait ce que ce
//   controle existe pour encourager. Ce qu'on veut interdire, c'est le RETOUR au
//   texte mort : le compte ne doit jamais DESCENDRE sous les 8 d'origine.
//   (Passe a 11 le 15/08 : contrats echus de l'Equipe, cuve GNR absente, niveau bas.)
const _nGo = (NC.match(/_pilEmptyGo\(/g)||[]).length;
T('A8 aucune impasse ne redevient muette (' + (_nGo-1) + ' boutons)', _nGo >= 8);
T('A8 plus aucune impasse muette',         !/pil-empty">[^']*R\u00e9glages/.test(NC) && !/pil-empty">[^']*R\\u00e9glages/.test(NC));
T('A8 « Saisons » n\'est plus affiche',    !/\u203a Saisons|\u203A Saisons/.test(NC));

// ── A9 : un seul registre ──
T('A9 plus de « ton objectif »',           !/Marge sur ton objectif/.test(NC));
T('A9 plus de « active-les »',             !/active-les via/.test(NC));
T('A9 plus de « Decoche »',                !/D\u00e9coche pour retirer/.test(NC));

// ── A10 : tiret, jamais zero ──
// ★ LA PHOTO CONFORMITE A QUITTE LA BANDE (le cuivre roule sur sept ans, il
//   ignore la portee — il n'avait pas sa place dans une ligne qui se recadre).
//   ⚠️ LA GARANTIE, ELLE, NE DISPARAIT PAS : « un calcul qui n'a pas abouti
//     s'ecrit TIRET, jamais zero — un zero est une mesure ». Elle se verifie
//     desormais la ou le cuivre vit : l'onglet Conformite.
T('A10 Conformite distingue la panne du zero',
  /if\(!cu\.avail\)\{/.test(corps('_pilTabCfm')) && /if\(!cu\.rows\.length\)\{/.test(corps('_pilTabCfm')));
T('A10 la panne rend un tiret, pas un zero',
  /!cu\.avail[\s\S]{0,220}_pilStat\('\\u2014'/.test(corps('_pilTabCfm')));
T('A10 le zero mesure, lui, s\'ecrit zero',
  /!cu\.rows\.length[\s\S]{0,200}_pilStat\('0'/.test(corps('_pilTabCfm')));
T('A10 la bande ne compte plus que trois photos',
  /\+pTrav\+pEff\+pBud\+'<\/div>'/.test(corps('_pilPhotosHtml')) && !/pCfm/.test(NC));

// ── A11/A12/A13 ──
T('A11 le clic sur photo ouverte agit',    /_pt===_PIL_TAB/.test(NC) && /pil-content/.test(NC));
T('A12 l\'onglet ③ a un repli',            /_hEqu \|\|/.test(NC));
T('A13 la branche morte est retiree',      !/d\.exm/.test(NC));

// ── B5 : nommer le cadre ──
T('B5 le bandeau existe',                  /function _pilCadreAvert\(txt\)/.test(NC));
T('B5 Economie l\'affiche',                /_pilCadreAvert\(_pilAvertEco\(\)\)/.test(NC));
T('B5 Cave l\'affiche',                    /_pilCadreAvert\(_pilAvertCav\(\)\)/.test(NC));
T('B5 Conformite l\'affiche',              /_pilCadreAvert\(_pilAvertCfm\(\)\)/.test(NC));
T('B5 Economie lit la portee',             /_PIL_SCOPE\.camp/.test(corps('_pilAvertEco')));
T('B5 la sous-vue Exercice a l\'avis inverse', /_PEC_SUB==='exe'/.test(corps('_pilAvertEco')));
T('B5 aucun sixieme selecteur',            !/_PIL_ECOSEL|_PIL_CFMSEL|_PIL_CAVSEL/.test(NC));

// ── garde : les points d'accroche d'app.js ──
T('compat visite : data-tab eco/sim',      /data-tab="'\+t\[0\]\+'"/.test(NC));
T('compat visite : .pil-dec',              /pil-dec/.test(NC));
T('compat visite : .pil-cockpit-card',     /pil-cockpit-card/.test(NC));
// ⚠️ `_pilTile('traitement')` N'EXISTE PLUS : la fenetre de traitement etait
//   affichee a DEUX endroits pour une seule source (_pilTreatDays). Elle a
//   fusionne dans « Traiter ? », sur Aujourd'hui — c'est une decision du jour.
//   VERIFIE AVANT DE RETIRER CE POINT : la visite guidee d'app.js vise
//   `.pil-tile[data-pid="cuivre"]`, PAS « traitement ». Aucun spotlight ne
//   pointe dans le vide. (C22 n'aurait pas pu le dire : il verifie le TOKEN
//   `pil-tile`, pas le selecteur d'attribut complet.)
T('compat : la visite guidee vise une tuile qui existe',
  /_pilTile\('cuivre'/.test(NC));
T('la fenetre de traitement n\'a plus qu\'un seul rendu',
  !/_pilPanelTraitement/.test(NC) && !/mat_traitement/.test(NC));
T('… et sa fiche reste posee sur la carte survivante',
  /_mvInfoBtn\('pil\.traitement'\)/.test(corps('_pilCkTraiter')));
T('… qui porte bien les cinq jours',
  /_pilTreatRows\(days\)/.test(corps('_pilCkTraiter')));

console.log(ko ? ('\n  '+ko+' ROUGE(S) sur '+n) : ('\n  '+n+' assertions vertes'));
process.exit(ko?1:0);
