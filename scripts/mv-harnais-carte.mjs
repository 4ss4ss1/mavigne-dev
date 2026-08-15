/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LA CARTE A TROIS ETAGES (lot du 15/08)
   Lancer : node scripts/mv-harnais-carte.mjs
   ⚠️ §34g : on lit le CODE, jamais les commentaires qui le documentent.
   Le preflight verifie la mecanique ; ici on verifie le SENS — que le chiffre
   reste lisible carte repliee, et que le nouveau defaut atteigne vraiment les
   clients deja installes.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';

const PIL  = fs.readFileSync('src/pilotage.js', 'utf8');
const CSS  = fs.readFileSync('src/styles.css', 'utf8');
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');
const P = nu(PIL);
const C = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
function corps(nom){
  const i = P.indexOf('function ' + nom); if (i < 0) return '';
  let d = 0, s = P.indexOf('{', i); if (s < 0) return '';
  for (let k = s; k < P.length; k++) { if (P[k] === '{') d++; else if (P[k] === '}') { d--; if (!d) return P.slice(s, k + 1); } }
  return P.slice(s);
}

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};
console.log('\n── LA CARTE A TROIS ETAGES\n');

/* ══ 1. LES TROIS ETAGES SONT DANS L'EN-TETE ══
   C'est l'unique justification du repli par defaut : si le chiffre ou son cadre
   tombaient dans le corps, replier CACHERAIT une information.
   ⚠️⚠️ ON EXECUTE _pilTile, ON NE LE RELIT PAS. La premiere version de ce
     harnais decoupait la source entre deux motifs et regardait ce qu'il y avait
     dedans : la contre-epreuve a montre qu'elle restait VERTE quand on sortait
     le chiffre de l'en-tete, parce que la tranche englobait les deux cas. On
     appelle la fonction, on lit le HTML qu'elle rend, on cherche la balise
     fermante qui correspond vraiment. */
function _rendTuile(opts){
  const src = corps('_pilTile');
  const fn = new Function('_PIL_STATE','_pilIcoFor','_pilEsc','_mvInfoBtn',
    'return function _pilTile(id,ico,dot,title,statHtml,subHtml,gradPct,bodyHtml,infoCle)' + src + ';');
  return fn({collapsed:{}}, () => '[ICO]', x => String(x), c => '<button class="mv-i" data-mvi="' + c + '"></button>')(
    'essai', '', '#000', opts.titre, opts.stat, opts.sub, null, opts.corps, opts.cle);
}
/* Trouve le </div> qui ferme reellement l'ouverture a la position `i`. */
function ferme(html, i){
  let d = 0;
  const re = /<div\b[^>]*>|<\/div>/g; re.lastIndex = i;
  let m;
  while ((m = re.exec(html))) { d += m[0] === '</div>' ? -1 : 1; if (!d) return m.index; }
  return -1;
}
const H = _rendTuile({titre:'TITRE', stat:'<span class="pil-th-stat"><b>36,6</b> pers.</span>',
                      sub:'semaine du 12 mai', corps:'<p>LE-DETAIL</p>', cle:'pil.essai'});
const iTh = H.indexOf('<div class="pil-th">');
const fTh = ferme(H, iTh);
const enTete = H.slice(iTh, fTh);
const dehors = H.slice(0, iTh) + H.slice(fTh);

t('_pilTile accepte une cle de fiche (9e argument)', /function _pilTile\([^)]*,\s*infoCle\s*\)/.test(P));
t('l\'en-tete .pil-th se ferme bien', iTh >= 0 && fTh > iTh);
t('l\'etiquette est DANS l\'en-tete', /pil-th-l1/.test(enTete) && enTete.includes('TITRE'));
t('LE CHIFFRE est DANS l\'en-tete (donc lisible carte repliee)',
  enTete.includes('36,6') && /pil-th-l2/.test(enTete), 'rendu : ' + H.slice(0,150));
t('LE CHIFFRE n\'est nulle part ailleurs', !dehors.includes('36,6'));
t('LA LIGNE DE CADRE est DANS l\'en-tete', enTete.includes('semaine du 12 mai') && /pil-tsub/.test(enTete));
t('LA LIGNE DE CADRE n\'est nulle part ailleurs', !dehors.includes('semaine du 12 mai'));
t('le detail, lui, est HORS de l\'en-tete', !enTete.includes('LE-DETAIL') && dehors.includes('LE-DETAIL'));
t('la pastille est dans l\'en-tete, avant le chevron',
  enTete.indexOf('data-mvi') > 0 && enTete.indexOf('data-mvi') < enTete.indexOf('pil-th-chev'));
t('sans cle de fiche, aucune pastille',
  !_rendTuile({titre:'T', stat:'', sub:'', corps:''}).includes('data-mvi'));
t('sans chiffre ni cadre, aucun etage vide',
  !/pil-th-l2|pil-tsub/.test(_rendTuile({titre:'T', stat:'', sub:'', corps:''})));

/* ══ 2. LE DEFAUT S'INVERSE — ET ATTEINT LES CLIENTS DEJA INSTALLES ══
   Sans marqueur de version, MG et Chapelle installent la mise a jour et voient
   exactement le meme ecran : leur `collapsed` memorise gagne sur le defaut. */
/* ⚠️ Le defaut se VERIFIE EN L'EVALUANT (§6 plus bas) : une expression
   reguliere sur `collapsed:{…}` restait verte quand une seule carte repassait
   a 0 — la contre-epreuve l'a montre. Ici on ne garde que ce qui se lit. */
t('_PIL_ST_V existe', /var _PIL_ST_V\s*=\s*\d+/.test(P));
t('le defaut porte la version de l\'etat', /v:\s*_PIL_ST_V/.test(P));
t('_pilMigrEtat existe et compare a _PIL_ST_V',
  /function _pilMigrEtat/.test(P) && /st\.v\|0\)\s*>=\s*_PIL_ST_V/.test(P));
t('la migration ne repose QUE la disposition',
  /_pilMigrEtat/.test(P) && /st\.collapsed = _pilCloneDefault\(\)\.collapsed/.test(corps('_pilMigrEtat'))
  && !/st\.show\s*=/.test(corps('_pilMigrEtat')));
/* ⚠️ L'ORDRE : _pilNormalize reconstruit l'objet a partir des cles connues.
   Migrer AVANT lui perdrait `v`, et la migration se rejouerait sans fin. */
const load = corps('_pilLoadState');
/* ⚠️⚠️ IL Y A DEUX CHEMINS DE CHARGEMENT — la cle utilisateur, puis la cle du
   domaine. Les deux premieres versions de ces assertions cherchaient « au moins
   une fois » : la contre-epreuve a abime UN SEUL des deux et elles sont restees
   vertes. On compte, on ne cherche plus. */
const nSites = (load.match(/JSON\.parse\(/g) || []).length;
t('les deux chemins de chargement sont vus', nSites === 2, nSites + ' trouve(s)');
t('la migration passe APRES _pilNormalize, sur les deux chemins',
  (load.match(/_pilMigrEtat\(_pilNormalize\(/g) || []).length === nSites
  && !/_pilNormalize\(_pilMigrEtat\(/.test(load));
t('`v` traverse _pilNormalize (sinon la migration boucle)',
  /v:\(st\.v\|0\)/.test(corps('_pilNormalize')));
t('la migration est gravee sur les deux chemins',
  (load.match(/_migre[\s\S]{0,60}?_pilSaveState\(/g) || []).length === nSites);

/* ══ 3. UNE SEULE CARTE OUVERTE, PAR LE MEME CHEMIN D'ETAT ══
   Fermer a l'ecran sans ecrire dans `collapsed` ferait rouvrir au rendu suivant. */
/* ⚠️ L'assertion visait `_pilBind` — le gestionnaire vit en fait dans
   `_pilBindContent`, la delegation posee une fois sur la page. Trois rouges,
   trois assertions fausses, zero bug : la premiere question devant un rouge est
   toujours « lequel des deux a tort ? ». (§34g) */
const bind = corps('_pilBindContent');
t('ouvrir une carte referme les autres', /querySelectorAll\('\.pil-tile\.open'\)/.test(bind));
t('les cartes fermees le sont AUSSI dans l\'etat',
  /_PIL_STATE\.collapsed\[_id\]=1/.test(bind));
t('la barre « en main » de l\'ordre de passage est lachee',
  /_id==='ordrepassage'&&_PIL_OP/.test(bind));

/* ══ 4. LA GRILLE PEUT ENFIN SE REMPLIR ══ */
t('.pil-th est en display:block (trois etages empiles)', /\.pil-th\{display:block/.test(C));
t('.pil-th-l1 et .pil-th-l2 sont stylees', /\.pil-th-l1\{/.test(C) && /\.pil-th-l2\{/.test(C));
t('le chiffre est au pas --pt-xxl', /\.pil-th-stat b\{[^}]*--pt-xxl/.test(C));
t('la ligne de cadre porte son filet dore', /\.pil-tsub::before\{[^}]*background:var\(--or\)/.test(C));
t('une carte ouverte prend toute la ligne', /\.pil-tile\.open\{[^}]*grid-column:1\/-1/.test(C));
t('la grille descend a 250 px', /\.pil-panels\{[^}]*minmax\(250px/.test(C));

/* ══ 5. AUCUN NOM NE BOUGE — la visite guidee et C22 en dependent ══ */
for (const sel of ['pil-tile', 'data-pid', 'pil-th', 'pil-th-t', 'pil-th-stat', 'pil-tsub', 'pil-tbody', 'pil-cockpit-card', 'pil-dec'])
  t(`« ${sel} » intact`, P.includes(sel));
t('#pil-body-<id> intact', /pil-body-'\+id/.test(P));
t('les 27 appels a _pilTile tiennent toujours',
  (PIL.match(/_pilTile\(/g) || []).length >= 27);

/* ══════════════════════════════════════════════════════════════════════════
   6. LA MIGRATION, EXECUTEE — pas relue.
   Le point qui decide si le lot est visible chez MG et Chapelle ne se prouve
   pas par grep : on rejoue leur etat memorise reel et on regarde ce qui sort.
   ══════════════════════════════════════════════════════════════════════════ */
console.log('');
// On decoupe les cinq fonctions d'etat et on les evalue telles quelles.
function bloc(nom){
  const i = PIL.indexOf('function ' + nom + '(');
  let d = 0, s = PIL.indexOf('{', i);
  for (let k = s; k < PIL.length; k++) { if (PIL[k]==='{') d++; else if (PIL[k]==='}') { d--; if(!d) return PIL.slice(i, k+1); } }
}
const V   = PIL.match(/var _PIL_ST_V = \d+;/)[0];
const DEF = PIL.match(/var _PIL_DEFAULT = \{[\s\S]*?\n\};/)[0];
const code = [V, DEF, bloc('_pilCloneDefault'), bloc('_pilNormalize'),
              bloc('_pilMigrShow'), bloc('_pilMigrEtat')].join('\n')
  + "\nvar _PIL_SHOW_MIGR = " + PIL.match(/var _PIL_SHOW_MIGR = \{[^}]*\};/)[0].replace('var _PIL_SHOW_MIGR = ','')
  + "\nexport { _PIL_ST_V, _PIL_DEFAULT, _pilCloneDefault, _pilNormalize, _pilMigrShow, _pilMigrEtat };\n";
const M = await import('data:text/javascript;base64,' + Buffer.from(code,'utf8').toString('base64'));

const charge = st => M._pilMigrEtat(M._pilNormalize(M._pilMigrShow(st)));

console.log('\n── LA MIGRATION, JOUEE SUR DE VRAIS ETATS MEMORISES\n');

/* 1. L'etat d'un client installe depuis des mois : tout ouvert, aucune version. */
const mg = { show:{auj_marge:1, avc_bar:0}, pie:'fait', bar:'cmp',
             collapsed:{echeances:0,carte:0,etp:0,temps:0,equipe:0,tracteur:0,cave:0,presences:0,
                        gnr:0,capacite:0,traitement:0,simulateur:0,phyto:0,cout:0,couteff:0,
                        cuivre:0,ift:0,dre:0},
             sub:{trac_revision:0} };
const r1 = charge(JSON.parse(JSON.stringify(mg)));
t('un client installe voit VRAIMENT le nouveau defaut',
  Object.values(r1.collapsed).every(v=>v===1),
  'restees ouvertes : ' + Object.keys(r1.collapsed).filter(k=>!r1.collapsed[k]).join(', '));
t('ses indicateurs decoches survivent', r1.show.avc_bar === 0);
t('son onglet de graphe survit', r1.bar === 'cmp' && r1.pie === 'fait');
t('ses sous-choix survivent', r1.sub.trac_revision === 0);
t('la migration se signale pour etre gravee', r1._migre === true);

/* 2. Elle ne doit tourner QU'UNE fois. */
const r2 = charge(JSON.parse(JSON.stringify(r1)));
t('elle ne se rejoue pas au chargement suivant', !r2._migre);
const r3 = JSON.parse(JSON.stringify(r2)); r3.collapsed.gnr = 0;   // le client ouvre une carte
const r4 = charge(r3);
t('une carte ouverte par le client n\'est pas refermee ensuite', r4.collapsed.gnr === 0);

/* 3. Un etat neuf, et un etat abime. */
t('les dix-huit cartes sont repliees par defaut',
  Object.keys(M._PIL_DEFAULT.collapsed).length >= 18
  && Object.values(M._PIL_DEFAULT.collapsed).every(v=>v===1),
  'ouvertes : ' + Object.keys(M._PIL_DEFAULT.collapsed).filter(k=>!M._PIL_DEFAULT.collapsed[k]).join(', '));
t('un etat vierge part replie', Object.values(M._pilCloneDefault().collapsed).every(v=>v===1));
t('_PIL_DEFAULT porte la version', M._PIL_DEFAULT.v === M._PIL_ST_V);
const r5 = charge({ show:null, collapsed:null });
t('un etat abime ne fait pas tomber le chargement', r5 && r5.collapsed && r5.v === M._PIL_ST_V);

/* 4. La migration de `show` du lot 3 d'aout continue de fonctionner. */
const r6 = charge({ show:{avc_etp:0}, collapsed:{} });
t('l\'ancienne migration `avc_etp` -> `an_frise` tient toujours', r6.show.an_frise === 0);


console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
process.exit(ko ? 1 : 0);
