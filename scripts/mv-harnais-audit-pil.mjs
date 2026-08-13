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
T('A4 « Decider » ne titre plus',          !/sim:'D\u00e9cider/.test(NC));
T('B6 l\'onglet ③ ne promet plus de taches', !/L\\'\u00e9quipe & les t\u00e2ches/.test(NC));
T('B6 la cle `equ` n\'a PAS bouge',        /\['equ','\\uD83D\\uDC65'/.test(NC));
T('A4 libelle d\'onglet echappe',          /_pilEsc\(t\[2\]\)/.test(NC));

// ── A3 : la memoire du niveau ① ──
T('A3 les deux cles sont aux defauts',     /an_cadres:1, an_frise:1/.test(NC));
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
T('A8 les 7 impasses l\'utilisent',        (NC.match(/_pilEmptyGo\(/g)||[]).length===8); // 7 sites + la definition
T('A8 plus aucune impasse muette',         !/pil-empty">[^']*R\u00e9glages/.test(NC) && !/pil-empty">[^']*R\\u00e9glages/.test(NC));
T('A8 « Saisons » n\'est plus affiche',    !/\u203a Saisons|\u203A Saisons/.test(NC));

// ── A9 : un seul registre ──
T('A9 plus de « ton objectif »',           !/Marge sur ton objectif/.test(NC));
T('A9 plus de « active-les »',             !/active-les via/.test(NC));
T('A9 plus de « Decoche »',                !/D\u00e9coche pour retirer/.test(NC));

// ── A10 : tiret, jamais zero ──
T('A10 la photo distingue panne et zero',  /!D\.cu \|\| !D\.cu\.avail/.test(corps('_pilPhotosHtml')));
T('A10 la panne porte un drapeau rouge',   /_pilFlag\('r','Ouvrez Conformit/.test(NC));

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
T('compat : data-pid traitement',          /_pilTile\('traitement'/.test(NC));

console.log(ko ? ('\n  '+ko+' ROUGE(S) sur '+n) : ('\n  '+n+' assertions vertes'));
process.exit(ko?1:0);
