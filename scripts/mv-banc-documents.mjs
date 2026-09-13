/* ───────────────────────────────────────────────────────────────────────────
   BANC — LES DOCUMENTS SONT REELLEMENT CONSTRUITS
   Lancer : node scripts/mv-banc-documents.mjs   ·   contre : --contre

   ★★★ POURQUOI CE BANC EXISTE.
   Le lot AXE-1 a livre trois documents dont deux neufs, et son harnais LISAIT
   leur code sans jamais l'EXECUTER. Un `node --check` vert, 33 assertions
   vertes, et pas une seule preuve qu'un document se construise : une propriete
   lue sur `undefined`, un `${}` qui rend « NaN », une date jamais formatee —
   rien de tout cela ne se voit dans le texte du fichier.
   ⚠️ Un document faux ne plante pas : il s'imprime.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';

const contre = process.argv.includes('--contre');
const SRC = fs.readFileSync('src/reglages.js', 'utf8');
const PIL = fs.readFileSync('src/pilotage.js', 'utf8');

/* ── Extraction d'une fonction nommee, accolades comptees ── */
function fn(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  let d = 0, k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) {
    if (src[x] === '{') d++;
    else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); }
  }
  throw new Error('accolade non fermee : ' + nom);
}

/* ── Le decor : donnees figees, choisies pour les BORDS ── */
const PARCELLES = [
  { nom: 'Les Grandes Vignes', surface: 0.42 },
  { nom: 'Combe aux Moines',   surface: 1.13 },
  { nom: 'Clos Prieur',        surface: 0.87 }
];
const FEN = { k: 'camp2025', axe: 'campagne', lbl: '1ᵉʳ octobre 2025 → 30 septembre 2026',
              sub: '', d0: '2025-10-01', d1: '2026-09-30' };
const JOURNAL = [
  /* dans la fenetre */
  { date: '2025-11-14', parcelle: 'Les Grandes Vignes', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
  { date: '2026-03-02', parcelle: 'Combe aux Moines', tache: 'Relevage', statut: 'Validé',
    equipe: true, membresEquipe: ['Alicia', 'Shana', 'Victor'] },
  { date: '2026-03-02', parcelle: 'Combe aux Moines', tache: 'Relevage', qui: 'Alicia', statut: 'Validé' },
  { date: '2026-09-30', parcelle: 'Clos Prieur', tache: 'Vendange', qui: 'Shana', statut: 'Validé' },
  /* aux bords, DEHORS d'un jour */
  { date: '2025-09-30', parcelle: 'Clos Prieur', tache: 'Vendange', qui: 'Shana', statut: 'Validé' },
  { date: '2026-10-01', parcelle: 'Clos Prieur', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
  /* a exclure pour d'autres raisons */
  { date: '2026-04-10', parcelle: 'Clos Prieur', tache: 'Ébourgeonnage', qui: 'Alicia', statut: 'En cours' },
  { date: '2026-04-11', parcelle: 'Clos Prieur', meteo: true, statut: 'Validé' },
  { date: '', parcelle: 'Clos Prieur', tache: 'Palissage', qui: 'Victor', statut: 'Validé' },
  /* le piege : une parcelle absente de PARCELLES, et un nom a echapper */
  { date: '2026-05-04', parcelle: 'Parcelle <inconnue> & Cie', tache: 'Rognage', qui: 'A & B', statut: 'Validé' }
];
const SESSIONS = [
  { date: '2026-04-20', activite: 'Rognage', conducteur: 'Victor', tracteurId: 'T1',
    parcelles: ['Combe aux Moines'], surface: 1.13, statut: 'Validé', avancement: 100 },
  { date: '2026-10-05', activite: 'Labour', conducteur: 'Victor', tracteurId: 'T1', surface: 0.42 }
];
const TRAITEMENTS = [
  { date: '2026-06-12', produit: 'Bouillie bordelaise', dose: '2 kg/ha',
    parcelles: ['Les Grandes Vignes', 'Combe aux Moines', 'Clos Prieur', 'Une 4e'], conducteur: 'Victor' },
  { date: '2026-07-01', produit: 'Soufre <mouillable>', parcelles: 'Domaine entier', operateur: 'Alicia' },
  { date: '2025-08-01', produit: 'Hors fenêtre', parcelles: [], conducteur: 'Shana' }
];

const G = {
  PARCELLES, JOURNAL, SESSIONS, TRAITEMENTS, TRACTEURS_LIST: [{ id: 'T1', nom: 'Fendt 210' }],
  DOMAINE_NOM: 'Domaine <Test> & Fils',
  _mvFenFr: iso => { const p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; },
  _phResolve: () => ({})
};

/* ★★ LES DEFAUTS REINJECTES, AVEC LEUR GARDE.
   ★★ Patron du projet (cuv8, recalage) : la contre-epreuve dit « detecte » en
   VERT pour chaque defaut attrape, elle ne deroule pas les assertions en rouge.
   Corrige le 13/09 sur remarque de Nico — habituer l'oeil au rouge attendu,
   c'est le rendre aveugle au rouge qui compte. Et chaque defaut est injecte
   SEUL : ensemble, l'un peut masquer l'autre.
   ⚠️⚠️ VECU : l'injection d'origine visait `if(!_borne) return !!iso;`
   — une ligne qui n'existe pas. Elle etait MORTE, et la contre-epreuve passait
   quand meme parce que sa condition etait « au moins un rouge » : les rouges
   venaient d'assertions fausses, pas du defaut. Un faux vert que seule la mise
   au vert du banc a demasque. On exige donc que chaque injection MODIFIE
   reellement le texte, comme dans mv-harnais-axe. */
const INJ_LISTE = [
  ['le filtre de fenetre saute', c => c.replace('return !!iso && iso>=d0 && iso<=d1;', 'return !!iso;')],
  ['les sans-date ne sont plus comptes', c => c.replace('if(!j.date){ sansDate++; return false; }', 'if(!j.date){ return false; }')],
  ['la surface ignore les passages', c => c.replace('surfCum+=(surf[j.parcelle]||0);', 'surfCum=(surf[j.parcelle]||0);')],
  ['les travaux non valides entrent', c => c.replace(/if\(j\.statut!==['"]Valid[^)]*\) return false;/, '')],
  ['le nom du domaine n\u2019est plus echappe', c => c.replace("'<div class=\"jiv-m\">'+e(DOM)+", "'<div class=\"jiv-m\">'+(DOM)+")]
];

/* Le banc entier, REJOUABLE : la contre-epreuve le relance une fois par defaut
   injecte, en silence. */
function passe(INJECTION, muet) {
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => {
    if (cond) { ok++; if (!muet) console.log('  \x1b[32m\u2713\x1b[0m ' + nom); }
    else { ko++; if (!muet) console.log('  \x1b[31m\u2717\x1b[0m ' + nom + (det ? '\n      \u2192 ' + det : '')); }
  };
  /* ── Montage : on prend les fonctions du fichier REEL ── */
  let API;
  try {
    const noms = ['_jivEsc', '_jivJ', '_jivMoisLbl', '_jivDansFen', '_jivQui', '_jivData', '_jivDoc'];
    /* ⚠️ Le premier montage s'arretait a `function _jivEsc` et laissait dehors
       `var _JIV_MOIS`, declare juste apres : le document levait au montage. Dans
       le fichier reel tout est au meme scope — c'etait un defaut du BANC, pas du
       code livre. On prend tout jusqu'a _jivData, puis les fonctions manquantes. */
    let code = SRC.slice(SRC.indexOf('var _JIV_CSS'), SRC.indexOf('function _jivData'));
    for (const n of noms) if (!code.includes('function ' + n + '(')) code += '\n' + fn(SRC, n);
    code = code.replace(/window\./g, 'G.');
    if (INJECTION) code = INJECTION(code);
    API = new Function('G', code + '\nreturn {_jivData,_jivDoc,_jivQui,_jivMoisLbl};')(G);
    t('le module des documents se monte et s\u2019evalue', true);
  } catch (e) {
    t('le module des documents se monte et s\u2019evalue', false, e.message);
    console.log('\n  \x1b[31mmontage impossible — on ne peut rien prouver de plus\x1b[0m\n');
    process.exit(1);
  }

  /* ══ 1. LE RASSEMBLEMENT ════════════════════════════════════════════════ */
  const D = API._jivData(FEN);

  t('le filtre mord aux DEUX bords (30/09 dedans, 01/10 dehors)',
    D.trav.length === 5, D.trav.length + ' travaux : ' + D.trav.map(j => j.date).join(' '));
  t('un travail non valide n\u2019entre pas',
    !D.trav.some(j => j.statut !== 'Validé'));
  t('un releve meteo n\u2019entre pas',
    !D.trav.some(j => j.meteo));
  t('une entree sans date est ecartee ET comptee',
    D.sansDate === 1, 'sansDate = ' + D.sansDate);
  t('les jours distincts sont comptes une fois (deux entrees le 02/03)',
    D.jours === 4, 'jours = ' + D.jours);
  t('l\u2019equipe compte ses membres, pas seulement `qui`',
    D.gens === 4, 'personnes = ' + D.gens + ' (attendu Victor, Alicia, Shana + celui du piege)');
  /* ★ La surface additionne les passages, le compte de parcelles non : c'est la
     distinction que le document AFFICHE, elle doit tenir dans les chiffres. */
  const attSurf = 0.42 + 1.13 + 1.13 + 0.87 + 0;   /* la parcelle inconnue vaut 0, pas NaN */
  t('la surface additionne les passages (deux fois Combe aux Moines)',
    Math.abs(D.surfCum - attSurf) < 1e-9, 'surfCum = ' + D.surfCum + ' attendu ' + attSurf);
  t('une parcelle absente du parcellaire vaut 0, jamais NaN',
    Number.isFinite(D.surfCum));
  t('les parcelles touchees, elles, ne comptent qu\u2019une fois',
    D.parcs === 4, 'parcelles = ' + D.parcs);
  t('sessions et traitements sont bornes sur la meme fenetre',
    D.sess.length === 1 && D.trt.length === 2,
    'sess ' + D.sess.length + ' · trt ' + D.trt.length);

  /* ══ 2. LE DOCUMENT, CONSTRUIT ══════════════════════════════════════════ */
  let H = '';
  try { H = API._jivDoc(D, FEN); t('le document se construit sans lever', true); }
  catch (e) { t('le document se construit sans lever', false, e.message); }

  const corps = H.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  const texte = corps.replace(/<[^>]*>/g, ' ');

  /* ⚠️ CE QUI NE PLANTE PAS ET S'IMPRIME QUAND MEME. */
  for (const [motif, nom] of [[/\bundefined\b/, 'undefined'], [/\bNaN\b/, 'NaN'],
                              [/\[object Object\]/, '[object Object]'], [/\bnull\b/, 'null'],
                              [/\\u[0-9a-fA-F]{4}/, 'un \\uXXXX litteral']]) {
    const m = texte.match(motif);
    t('aucun « ' + nom + " » n'atteint la page", !m,
      m ? texte.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, ' ') : '');
  }
  /* ⚠️ ASSERTION FAUSSE POUR ZERO BUG (la 3e du lot) : `/<tr>/` ne comptait pas
     `<tr class="jiv-mo">`, donc 4 ouvrantes contre 7 fermantes sur un HTML sain.
     Les `<td>` etaient a 18/18 — le signe que c'etait le compteur, pas le code. */
  const paires = [[/<div[\s>]/g, /<\/div>/g], [/<table[\s>]/g, /<\/table>/g],
                  [/<tr[\s>]/g, /<\/tr>/g], [/<td[\s>]/g, /<\/td>/g],
                  [/<span[\s>]/g, /<\/span>/g], [/<tbody[\s>]/g, /<\/tbody>/g]];
  const bancal = paires.filter(([o, c]) => (corps.match(o) || []).length !== (corps.match(c) || []).length);
  t('les balises ouvrantes et fermantes s\u2019equilibrent', bancal.length === 0,
    bancal.map(([o, c]) => String(o) + ' ' + (corps.match(o) || []).length + '/' + (corps.match(c) || []).length).join(' · '));
  t('le document DIT sa fenetre, en clair',
    texte.includes('01/10/2025') && texte.includes('30/09/2026'));
  t('le nom du domaine est echappe (< et & ne passent pas bruts)',
    !/Domaine <Test>/.test(corps) && /Domaine &lt;Test&gt; &amp; Fils/.test(corps));
  t('un nom de parcelle hostile est echappe',
    /Parcelle &lt;inconnue&gt; &amp; Cie/.test(corps));
  t('les trois sections sont la',
    /Travaux de la vigne/.test(texte) && /Travaux au tracteur/.test(texte)
    && /Traitements phytosanitaires/.test(texte));
  /* ⚠️ ASSERTION FAUSSE POUR ZERO BUG (la 4e) : elle cherchait « septembre 2026 »
     dans le texte entier — or le LIBELLE DE COUVERTURE le contient deja, tout en
     haut. On lit les intertitres la ou ils sont, dans les cellules `jiv-mo`. */
  /* ⚠️ Et la 5e : les TROIS sections posent chacune leurs intertitres, donc une
     liste a plat n'est pas croissante — elle repart a chaque section. On coupe
     le document par section et on verifie l'ordre DANS chacune. */
  const RANG = { 'novembre 2025': 0, 'mars 2026': 1, 'avril 2026': 2, 'mai 2026': 3,
                 'juin 2026': 4, 'juillet 2026': 5, 'septembre 2026': 6 };
  const parSection = corps.split(/<div class="jiv-st">/).slice(1)
    .map(sec => (sec.match(/class="jiv-mo"><td colspan="\d+">([^<]*)/g) || [])
      .map(x => x.replace(/.*">/, '')));
  const croissant = parSection.every(L2 => L2.every((m, i) => i === 0 || RANG[L2[i - 1]] < RANG[m]));
  t('chaque section pose ses intertitres de mois, dans l\u2019ordre du calendrier',
    parSection.length === 3 && croissant
    && parSection[0].join('|') === 'novembre 2025|mars 2026|mai 2026|septembre 2026',
    parSection.map(L2 => '[' + L2.join(' ') + ']').join(' '));
  t('la mention « passages compris » accompagne la surface cumulee',
    /passages compris/.test(texte));
  t('le document dit que les trois sections ne s\u2019additionnent pas',
    /ne s\u2019additionnent pas/.test(texte) || /ne s'additionnent pas/.test(texte));
  t('l\u2019entree sans date est signalee au lecteur, pas tue',
    /1 entr\u00e9e sans date/.test(texte));
  t('une session hors fenetre n\u2019apparait pas (Labour du 05/10)',
    !/Labour/.test(texte));
  t('un traitement hors fenetre n\u2019apparait pas',
    !/Hors fen/.test(texte));
  t('la machine est resolue par son id, pas affichee brute',
    /Fendt 210/.test(texte) && !/\bT1\b/.test(texte));
  t('les parcelles d\u2019un traitement sont resumees au-dela de trois',
    /\+1\b/.test(texte));

  /* ══ 3. LE CADRE DE CAMPAGNE, EXECUTE ═══════════════════════════════════ */
  try {
    let code = fn(PIL, '_pilCampVend').replace(/window\./g, 'P.');
    code = 'function _arcCampagneDe(){ return 2025; }\n'
         + 'function _mvToday(){ return "2026-05-01"; }\n'
         + 'function _arcN(iso){ const d=new Date(iso+"T00:00:00Z"); return Math.round(d/864e5); }\n'
         + 'function _pilAnnuelData(){ return P.__ann; }\n' + code;
    const P = { __ann: { vend: { debut: '2026-09-08', fin: '2026-09-24' }, align: { moisIdeal: 9 } } };
    const V = new Function('P', code + '\nreturn _pilCampVend;')(P);

    const enOct = V(9);      /* campagne 01/10/2025 → 30/09/2026 : la vendange CLOT */
    t('cadre en octobre : la vendange cl\u00f4t la campagne',
      !!enOct && enOct.clot === true && enOct.coupe === false,
      JSON.stringify(enOct));
    const enAout = V(7);     /* campagne 01/08/2026 → 31/07/2027 : elle OUVRE */
    t('cadre en aout : la meme vendange OUVRE la campagne',
      !!enAout && enAout.ouvre === true && enAout.clot === false,
      JSON.stringify(enAout));
    const P2 = { __ann: { vend: { debut: '2026-09-20', fin: '2026-10-06' }, align: { moisIdeal: 10 } } };
    const V2 = new Function('P', code + '\nreturn _pilCampVend;')(P2);
    t('une vendange a cheval sur la borne est vue COUPEE',
      V2(9) && V2(9).coupe === true, JSON.stringify(V2(9)));
    const P3 = { __ann: { vend: null, align: null } };
    const V3 = new Function('P', code + '\nreturn _pilCampVend;')(P3);
    t('sans vendange datee, la fonction rend null — elle ne devine pas',
      V3(9) === null);
  } catch (e) {
    t('_pilCampVend s\u2019execute', false, e.message);
  }


  return { ok, ko };
}

if (!contre) {
  console.log('\n\u2500\u2500 LES DOCUMENTS, CONSTRUITS POUR DE VRAI\n');
  const { ok, ko } = passe(null, false);
  console.log('\n  ' + (ko === 0 ? '\x1b[32m' : '\x1b[31m') + ok + ' vert' + (ok > 1 ? 's' : '')
    + ' \u00b7 ' + ko + ' rouge' + (ko > 1 ? 's' : '') + '\x1b[0m\n');
  process.exit(ko === 0 ? 0 : 1);
}

console.log('\n\u2500\u2500 LES DOCUMENTS \u2014 contre-epreuve : chaque defaut attrape SEUL\n');
const refKo = passe(null, true).ko;
let rates = 0;
for (const [nom, f] of INJ_LISTE) {
  let touche = false;
  const inj = c => { const b = f(c); if (b !== c) touche = true; return b; };
  const { ko } = passe(inj, true);
  if (!touche) { rates++; console.log('  \x1b[31mrouge\x1b[0m  ' + nom + '  \u2192 INJECTION MORTE'); }
  else if (ko > refKo) { console.log('  \x1b[32mvert\x1b[0m   ' + nom + ' \u2192 detecte'); }
  else { rates++; console.log('  \x1b[31mrouge\x1b[0m  ' + nom + '  \u2192 PASSE le banc'); }
}
console.log('\n  ' + (rates === 0 ? '\x1b[32m' : '\x1b[31m')
  + (INJ_LISTE.length - rates) + '/' + INJ_LISTE.length + ' defauts attrapes\x1b[0m\n');
process.exit(rates === 0 ? 0 : 1);
