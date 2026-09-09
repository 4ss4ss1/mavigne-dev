/* ───────────────────────────────────────────────────────
   HARNAIS — AUJOURD'HUI, L'ÉCRAN D'ARRIVÉE DE LA CAVE (lot CAVE-1)
   Lancer :          node scripts/mv-harnais-cave-auj.mjs
   Contre-épreuves : node scripts/mv-harnais-cave-auj.mjs --contre

   POURQUOI IL EXISTE
   Le 08/09/2026, Nico : « c'est un peu le bordel dans l'application entre
   les infos dans pilotage, les infos dans le cuvier, les infos un peu
   partout ». Mesuré sur le code : « Ce qui vient » (Cave › Le millésime) et
   « Ce qui presse » (Pilotage › Cave) rendaient le MÊME moteur sur deux
   écrans ; la bande #cave-kpis était écrite à trois endroits avec trois sens.
   Le lot fusionne l'agenda dans un onglet Aujourd'hui, en tête de la Cave,
   et porte dans cave.js ce que seul pilotage.js savait (soutirage à faire,
   malo bloquée, doses de SO2). Ce harnais grave :

   1. UN SEUL ÉCRIVAIN pour l'en-tête et pour la bande de quatre chiffres.
   2. La Cave s'ouvre sur Aujourd'hui, et l'ancien sous-onglet n'existe plus
      nulle part (index.html, cave.js, app.js).
   3. Un soutirage n'acquitte le geste que s'il est POSTÉRIEUR à la date où
      la malo a été constatée finie — sinon un soutirage de mars vaut quitus
      pour une malo finie en mai.
   4. La fenêtre des doses de SO2 vaut nSem*7-1 : J+28 est exclu, comme
      dans _mlAgenda.
   5. L'ordre d'affichage ne s'écrit JAMAIS (ordre[k]||9) : 'alerte' vaut 0.
   6. La hiérarchie du verdict est fixe : contrôle > à mesurer > raisin sur
      pied > ouillage > soutirage > SO2 > parc > « Rien ne presse ».
   7. Une ligne de l'agenda est UN bouton : le verbe à droite est un <span>,
      jamais un second <button>.

   Méthode C20 : fonctions extraites de src/cave.js et exécutées pour de vrai,
   bouchons minimaux. §34g : les commentaires sont retirés avant toute
   lecture — un harnais qui lit ce qu'on raconte du code ne teste pas le code.
   ─────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const SRC  = readFileSync('src/cave.js', 'utf8');
const HTML = readFileSync('index.html', 'utf8');
const APP  = readFileSync('src/app.js', 'utf8');
const UT   = readFileSync('src/utils.js', 'utf8');

const nu = s => s
  .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
const SRCNU = nu(SRC), APPNU = nu(APP), UTNU = nu(UT);
const HTMLNU = HTML.replace(/<!--[\s\S]*?-->/g, '');

let vert = 0, total = 0;
const rouges = [];
function pose(ok, nom, detail) {
  total++;
  if (ok) { vert++; console.log('   \u2713 ' + nom); }
  else { rouges.push(nom); console.log('   \u2717 ' + nom + (detail ? '\n      \u2192 ' + detail : '')); }
}

/* ══ EXTRACTION ═════════════════════════════════════════════════════════ */
function extraire(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) { console.error('ABSENTE de src/cave.js : ' + nom); process.exit(1); }
  let i = src.indexOf('{', m.index), d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return [m.index, src.slice(m.index, j + 1)];
  }
  console.error('accolade non ferm\u00e9e : ' + nom); process.exit(1);
}
const NOMS = ['_mlD', '_mlIso', '_mlAddJ', '_mlEcartJ', '_mlLundi', '_mlFrC',
  '_mlFinMalo', '_mlMalo', '_mlSo2Doses', '_mlAgendaComplet', '_mlSansDate', '_mlVerdict'];
function bloc(src) {
  return NOMS.map(n => extraire(src, n)).sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');
}
const BLOC = bloc(SRCNU);

/* ══ BOUCHONS ═══════════════════════════════════════════════════════════
   _mlAgenda est testé par mv-harnais-agenda ; ici on le remplace par un
   squelette de semaines (même découpe lundi→dimanche) où l'on dépose les
   items que chaque cas veut voir. _mlProjMalo est une fenêtre : on lui dicte
   l'état par cuvée. Rien de ce qu'on mesure ici n'est bouché. */
const AUJ = '2026-09-07';                              // un lundi
function monter(ce, opts, mutation) {
  opts = opts || {};
  const corps = mutation ? mutation(BLOC) : BLOC;
  const agenda = opts.agenda || (() => []);           // items à déposer par semaine
  const proj = opts.proj || {};
  const f = new Function('CAVE_ELEVAGE', 'window', '_ML_SEM', '_ML_MOIS', '_mlAgenda',
    '_caveLastSout', '_mlNomCuvee', '_mvF1',
    corps + '\nreturn {_mlFinMalo,_mlMalo,_mlSo2Doses,_mlAgendaComplet,_mlSansDate,_mlVerdict,_mlLundi,_mlAddJ};');
  const lastSout = id => {
    const l = (ce.operations || []).filter(o => o && o.type === 'soutirage' && o.date
      && ((o.cuvees_ids && o.cuvees_ids.length) ? o.cuvees_ids : (o.cuvee_id ? [o.cuvee_id] : [])).indexOf(id) !== -1)
      .sort((a, b) => a.date > b.date ? -1 : 1);
    return l.length ? l[0].date : null;
  };
  return f(ce,
    { _mlProjMalo: c => proj[c.id] || { etat: 'attente' }, logError: null },
    4, ['janv.', 'f\u00e9vr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'ao\u00fbt', 'sept.', 'oct.', 'nov.', 'd\u00e9c.'],
    function (from, nSem) {
      // même découpe que _mlAgenda : nSem semaines calendaires depuis le lundi
      const d = s => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
      const iso = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      const l0 = d(from); l0.setDate(l0.getDate() - ((l0.getDay() + 6) % 7));
      const sem = [];
      for (let i = 0; i < nSem; i++) {
        const lu = new Date(l0); lu.setDate(lu.getDate() + i * 7);
        const di = new Date(lu); di.setDate(di.getDate() + 6);
        sem.push({ lundi: iso(lu), dim: iso(di), items: agenda(i).map(x => Object.assign({ date: iso(lu) }, x)) });
      }
      return sem;
    },
    lastSout, c => (c.nom || '') + ' \u2019' + String(c.millesime || '').slice(-2),
    n => (Math.round((n || 0) * 10) / 10).toString().replace('.', ','));
}
const cave = (cuvees, operations) => ({ cuvees: cuvees || [], operations: operations || [], config: {} });
const CUV = { id: 'c1', nom: 'Charmes', millesime: 2025, nb_tonneaux: 6 };
const items = sem => sem.reduce((a, s) => a.concat(s.items), []);

/* ══ 1. STRUCTURE — un seul écrivain, un seul écran ═════════════════════ */
console.log('\n── CAVE-1 : Aujourd\u2019hui, l\u2019\u00e9cran d\u2019arriv\u00e9e\n');
console.log('  Structure');
pose(/var caveSection\s*=\s*'aujourdhui'/.test(SRCNU), 'la Cave s\u2019ouvre sur Aujourd\u2019hui (caveSection par d\u00e9faut)');
pose((SRCNU.match(/getElementById\('cave-kpis'\)/g) || []).length === 1,
  'la bande #cave-kpis n\u2019a qu\u2019UN \u00e9crivain dans cave.js',
  (SRCNU.match(/getElementById\('cave-kpis'\)/g) || []).length + ' acc\u00e8s');
pose((SRCNU.match(/getElementById\('cave-hdr-title'\)/g) || []).length === 1,
  'le titre de l\u2019en-t\u00eate n\u2019a qu\u2019UN \u00e9crivain (_caveHeaderRender)');
const rc = extraire(SRCNU, 'renderCave')[1];
pose(/_caveHeaderRender\(\)/.test(rc) && /_caveKpisRender\(\)/.test(rc), 'renderCave \u00e9crit l\u2019en-t\u00eate et la bande avant toute section');
/* Lot CAVE-2 : la liste s'est allongee ('reglages', la roue crantee). Ce qui
   compte ici : 'aujourdhui' y est, en tete, et c'est le repli. */
pose(/\['aujourdhui','elevage','vendange','millesime'(,'[a-z]+')*\]\.indexOf\(caveSection\)<0\) caveSection = 'aujourdhui'/.test(rc), 'le filet de renderCave conna\u00eet la quatri\u00e8me section, et replie dessus');
/* Lot CAVE-3 : la barre du millesime est revenue avec DEUX onglets (La ligne de
   vie, Les courbes) et _mlSetTab avec elle. Ce que le lot ① grave reste vrai :
   « Ce qui vient » n'existe plus, et une demande de 'venir' atterrit sur
   Aujourd'hui. */
pose(!/_mlRenderVenir/.test(SRCNU), '_mlRenderVenir ne survit pas (C15)');
/* Lot CAVE-5 : la Cave d'avant Le Chai (#cave-view-cuv / -journal / -divers)
   dormait dans index.html, masquee a chaque rendu. Retiree, avec ses appelants. */
pose(!/id="cave-view-(?:cuv|journal|divers)"/.test(HTMLNU), 'les trois blocs morts d\u2019index.html ne sont pas revenus');
pose(!/'cuv','journal','divers'/.test(SRCNU), 'les listes de masquage ne citent plus les blocs morts');
pose(!/function setOuillageAlerte|_caveOuillageRefresh/.test(SRCNU), 'setOuillageAlerte / _caveOuillageRefresh (seuls appel\u00e9s par le bloc mort) ont disparu');
pose(/id="mvc-ana-input"[^>]*_onCaveAnaFileChange/.test(HTMLNU) && /function _onCaveAnaFileChange/.test(SRCNU), 'l\u2019import d\u2019analyse PDF vit toujours, par le Journal du Chai');
pose(/t==='venir'\)\{ caveSection='aujourdhui'; renderCave\(\); return; \}/.test(SRCNU), "_mlSetTab('venir') atterrit sur Aujourd\u2019hui");
pose(!/ml-tab-venir/.test(HTMLNU) && !/Ce qui vient/.test(HTMLNU), 'index.html : le sous-onglet « Ce qui vient » a disparu');
const tabs = (HTMLNU.match(/id="cave-sec-tabs">([\s\S]*?)<\/div>/) || [])[1] || '';
pose(/^\s*<button class="mvu-tab active" id="cave-sec-aujourdhui"/.test(tabs), 'index.html : Aujourd\u2019hui est le premier onglet, et l\u2019actif');
pose((tabs.match(/class="mvu-tab active"/g) || []).length === 1, 'index.html : un seul onglet actif par d\u00e9faut');
pose(/id="cave-view-auj"/.test(HTMLNU) && /id="auj-body"/.test(HTMLNU) && /id="cave-kpis-note"/.test(HTMLNU),
  'index.html : #cave-view-auj, #auj-body et #cave-kpis-note existent');
pose(/selectCaveSection\('aujourdhui'\)/.test(APPNU) && /sel:\['#auj-body','#cave-view-auj','#page-cave'\]/.test(APPNU),
  'app.js : la visite guid\u00e9e (17 h 15) atterrit sur Aujourd\u2019hui');
pose(/id:'aujourdhui'/.test(APPNU) && /id==='aujourdhui'/.test(APPNU), 'app.js : le chapitre d\u00e9mo « Aujourd\u2019hui » a sa branche');
pose(/'cave\.auj':\s*\{/.test(UTNU) && /_mvInfoBtn\('cave\.auj'\)/.test(SRCNU), 'la fiche MV_INFO cave.auj existe et est pos\u00e9e');
const ev = extraire(SRCNU, '_mlEvHtml')[1];
pose((ev.match(/<button/g) || []).length === 1 && /class="auj-act"/.test(ev), 'une ligne = UN bouton, le verbe est un <span> (pas de bouton dans un bouton)');
pose(/_mvIcon\(ico,16\)/.test(ev) && !/[\u{1F300}-\u{1FAFF}]/u.test(ev), 'la ligne porte une ic\u00f4ne du sprite, aucun \u00e9moji');
const ac = extraire(SRCNU, '_mlAgendaComplet')[1];
pose(/_mlAgenda\(from,nSem\)/.test(ac), '_mlAgendaComplet consomme _mlAgenda (il ne le recopie pas)');
pose(!/\(ordre\[[a-z.]+\]\s*\|\|\s*9\)/.test(ac), 'l\u2019ordre ne s\u2019\u00e9crit pas (ordre[k]||9)');
const gk = extraire(SRCNU, '_mlGo')[1];
pose(/kind==='so2'/.test(gk) && /'soufre'/.test(gk) && /kind==='fut'/.test(gk) && /goTo\('reserve'\)/.test(gk),
  '_mlGo conna\u00eet so2 (op\u00e9ration soufre) et fut (La R\u00e9serve)');

/* ══ 2. EXÉCUTION — soutirage et malo ═══════════════════════════════════ */
console.log('\n  Soutirage & malo, ex\u00e9cut\u00e9s');
{
  const M = monter(cave([CUV]), { proj: { c1: { etat: 'finie', mal: 0.05, dernier: '2026-08-03', n: 4 } } });
  const l = M._mlMalo();
  pose(l.length === 1 && l[0].cas === 'a_soutirer', 'malo finie, aucun soutirage \u2192 \u00e0 soutirer');
  const sem = M._mlAgendaComplet(AUJ, 4);
  const it = items(sem);
  pose(it.length === 1 && it[0].kind === 'soutirage' && it[0].date === AUJ && it[0].ref === 'c1',
    'l\u2019agenda porte une ligne « soutirage » aujourd\u2019hui, sur la cuv\u00e9e');
  pose(/malo finie le 3 ao\u00fbt/.test(it[0].detail), 'la ligne dit quand la malo a \u00e9t\u00e9 constat\u00e9e finie');
}
{
  const M = monter(cave([CUV], [{ type: 'soutirage', date: '2026-08-10', cuvee_id: 'c1' }]),
    { proj: { c1: { etat: 'finie', mal: 0.05, dernier: '2026-08-03', n: 4 } } });
  pose(M._mlMalo()[0].cas === 'fait', 'un soutirage POST\u00c9RIEUR \u00e0 la fin de malo acquitte le geste');
  pose(items(M._mlAgendaComplet(AUJ, 4)).length === 0, '\u2026 et rien ne reste \u00e0 l\u2019agenda');
}
{
  const M = monter(cave([CUV], [{ type: 'soutirage', date: '2026-03-10', cuvee_id: 'c1' }]),
    { proj: { c1: { etat: 'finie', mal: 0.05, dernier: '2026-05-20', n: 4 } } });
  pose(M._mlMalo()[0].cas === 'a_soutirer', 'un soutirage de mars n\u2019acquitte PAS une malo finie en mai');
}
{
  const c = Object.assign({}, CUV, { fml_terminee: true });
  const M = monter(cave([c], [{ type: 'analyse', date: '2026-06-01', cuvee_id: 'c1', data: { fml: 'ok', fml_date: '2026-05-28' } }]));
  const l = M._mlMalo();
  pose(l[0].finie && l[0].cas === 'a_soutirer' && l[0].ref === '2026-05-28',
    'malo d\u00e9clar\u00e9e finie sans mesure : c\u2019est la parole du vigneron, r\u00e9f\u00e9renc\u00e9e \u00e0 l\u2019analyse');
}
{
  const M = monter(cave([CUV]), { proj: { c1: { etat: 'bloquee', mal: 1.2, dernier: '2026-09-01', n: 5 } } });
  const it = items(M._mlAgendaComplet(AUJ, 4));
  pose(it.length === 1 && it[0].kind === 'malo' && it[0].urgence === 'due', 'malo bloqu\u00e9e \u2192 ligne « malo » due, aujourd\u2019hui');
  pose(/1,2 g\/L/.test(it[0].detail), '\u2026 avec le malique restant');
  const v = M._mlVerdict(M._mlAgendaComplet(AUJ, 4), {});
  pose(v.cls === 'due' && /1 cuve demande un contr\u00f4le/.test(v.t), 'le verdict passe la malo bloqu\u00e9e en t\u00eate, comme une alerte');
}
{
  const bout = { id: 'b1', nom: 'Vieux', millesime: 2024, statut: 'embouteille' };
  const M = monter(cave([bout]), { proj: { b1: { etat: 'finie', mal: 0.05, dernier: '2026-01-03', n: 4 } } });
  pose(M._mlMalo().length === 0, 'une cuv\u00e9e embouteill\u00e9e n\u2019est plus suivie');
}

/* ══ 3. EXÉCUTION — les doses de SO2 et leur fenêtre ═══════════════════ */
console.log('\n  Doses de SO\u2082, ex\u00e9cut\u00e9es');
{
  const ops = [{ type: 'soutirage', date: '2026-08-20', cuvee_id: 'c1',
    data: { so2: { dates: ['2026-09-01', '2026-09-13', '2026-10-04', '2026-10-05'], dose: 2, unite: 'cL' } } }];
  const M = monter(cave([CUV], ops));
  const so = M._mlSo2Doses(AUJ, 4);
  const dates = so.doses.map(d => d.date);
  pose(dates.join(' ') === '2026-09-13 2026-10-04', 'fen\u00eatre [J, J+27] : hier est exclu, J+27 inclus, J+28 exclu', dates.join(' '));
  pose(so.doses[0].rang === 2 && so.doses[0].sur === 4, 'chaque dose porte son rang sur le total programm\u00e9');
  const sem = M._mlAgendaComplet(AUJ, 4);
  const it = items(sem);
  pose(it.length === 2 && it.every(x => x.kind === 'so2'), 'les deux doses entrent \u00e0 l\u2019agenda');
  pose(sem[0].items.length === 1 && sem[3].items.length === 1, '\u2026 chacune dans SA semaine (la 1re et la 4e)');
  pose(/dose 2\/4 \u00b7 2 cL/.test(sem[0].items[0].detail) && so.nom.c1 === 'Charmes \u201925', 'la ligne dit rang, dose et cuv\u00e9e');
  const v = M._mlVerdict(sem, {});
  pose(/1 dose de SO\u2082 cette semaine/.test(v.t), 'le verdict ne compte que les doses de CETTE semaine');
}

/* ══ 4. EXÉCUTION — l'ordre, et la hiérarchie du verdict ═══════════════ */
console.log('\n  Ordre et verdict, ex\u00e9cut\u00e9s');
{
  const agenda = i => i === 0 ? [
    { kind: 'ouillage', titre: 'A', detail: '', urgence: 'due', ref: 'a', futs: 6 },
    { kind: 'alerte', titre: 'B', detail: '', urgence: 'due', ref: 'b' },
    { kind: 'mesure', titre: 'C', detail: '', urgence: 'due', ref: 'c' },
    { kind: 'ouillage', titre: 'A2', detail: '', urgence: 'due', ref: 'a', futs: 6 },
  ] : [];
  const M = monter(cave([CUV]), { agenda, proj: { c1: { etat: 'finie', mal: 0.05, dernier: '2026-08-03', n: 4 } } });
  const sem = M._mlAgendaComplet(AUJ, 4);
  const kinds = sem[0].items.map(x => x.kind);
  pose(kinds.join(' ') === 'alerte mesure soutirage ouillage ouillage', 'm\u00eame date : alerte, mesure, soutirage, puis les ouillages', kinds.join(' '));
  let v = M._mlVerdict(sem, {});
  pose(v.cls === 'due' && v.t === '1 cuve demande un contr\u00f4le', 'l\u2019alerte passe devant tout');
  pose(/^Et 1 cuve \u00e0 mesurer\. /.test(v.s), 'la seconde ligne annonce ce qui suit (« Et \u2026 »)');
  // sans alerte : les mesures
  const M2 = monter(cave([CUV]), { agenda: i => i === 0 ? agenda(0).filter(x => x.kind !== 'alerte') : [] ,
    proj: { c1: { etat: 'finie', mal: 0.05, dernier: '2026-08-03', n: 4 } } });
  v = M2._mlVerdict(M2._mlAgendaComplet(AUJ, 4), {});
  pose(v.t === '1 cuve \u00e0 mesurer', 'puis les cuves \u00e0 mesurer');
  // en vendange, le raisin sur pied passe avant l'ouillage
  const M3 = monter(cave([]), { agenda: i => i === 0 ? [{ kind: 'ouillage', titre: 'A', detail: '', urgence: 'due', ref: 'a', futs: 6 }] : [] });
  v = M3._mlVerdict(M3._mlAgendaComplet(AUJ, 4), { phase: 'vendange', haReste: 2.35 });
  pose(v.t === '2,4 ha restent \u00e0 rentrer', 'en vendange, le raisin encore sur pied passe avant l\u2019ouillage');
  v = M3._mlVerdict(M3._mlAgendaComplet(AUJ, 4), { phase: 'elevage', haReste: 2.35 });
  pose(v.t === '1 cuv\u00e9e \u00e0 ouiller', '\u2026 mais pas hors vendange');
  // deux lignes d'ouillage sur la meme cuvee = UNE cuvee
  v = M._mlVerdict(sem, {});
  const M4 = monter(cave([]), { agenda: i => i === 0 ? agenda(0).filter(x => x.kind === 'ouillage') : [] });
  v = M4._mlVerdict(M4._mlAgendaComplet(AUJ, 4), {});
  pose(v.t === '1 cuv\u00e9e \u00e0 ouiller', 'deux \u00e9ch\u00e9ances d\u2019ouillage sur la m\u00eame cuv\u00e9e comptent pour UNE');
  // parc en fin de vie, sans date
  const M5 = monter(cave([]));
  const parc = { aReformer: 4, vie: 5, libres: 3, occupes: 38, parc: 41 };
  v = M5._mlVerdict(M5._mlAgendaComplet(AUJ, 4), { parc });
  pose(v.cls === 'warn' && v.t === '4 f\u00fbts arrivent en fin de vie', 'les f\u00fbts en fin de vie ferment la hi\u00e9rarchie');
  const sd = M5._mlSansDate(parc);
  pose(sd.length === 1 && sd[0].kind === 'fut' && !sd[0].date && /au-del\u00e0 de 5 vins/.test(sd[0].titre), 'ils sont list\u00e9s SANS date, jamais rang\u00e9s dans une semaine');
  pose(M5._mlSansDate({ aReformer: 0 }).length === 0 && M5._mlSansDate(null).length === 0, '\u2026 et rien sans f\u00fbt \u00e0 r\u00e9former (ni sans parc)');
  v = M5._mlVerdict(M5._mlAgendaComplet(AUJ, 4), {});
  pose(v.cls === 'ok' && v.t === 'Rien ne presse aujourd\u2019hui', 'sans rien : « Rien ne presse aujourd\u2019hui », en vert');
}

/* ══ CONTRE-ÉPREUVES ════════════════════════════════════════════════════
   Chacune casse le code extrait d'une façon plausible et exige un ROUGE.
   Une contre-épreuve qui reste verte est un contrôle qui ne mord pas. */
if (CONTRE) {
  console.log('\n  Contre-\u00e9preuves');
  const casse = (nom, mutation, verif) => {
    let ok = false;
    try { ok = verif(mutation); } catch (e) { ok = false; }
    pose(!ok, nom + ' \u2192 rougit bien', ok ? 'la mutation est pass\u00e9e au vert' : '');
  };
  casse('(ordre[k]||9) r\u00e9introduit', b => {
    const m = b.replace("(ordre[a.kind]!=null?ordre[a.kind]:9), ob=(ordre[b.kind]!=null?ordre[b.kind]:9)", '(ordre[a.kind]||9), ob=(ordre[b.kind]||9)');
    if (m === b) throw new Error('mutation non appliqu\u00e9e'); return m;
  }, mut => {
    const M = monter(cave([]), { agenda: i => i === 0 ? [{ kind: 'ouillage', titre: 'A', urgence: 'due', ref: 'a', futs: 6 }, { kind: 'alerte', titre: 'B', urgence: 'due', ref: 'b' }] : [] }, mut);
    return M._mlAgendaComplet(AUJ, 4)[0].items[0].kind === 'alerte';
  });
  casse('un soutirage ant\u00e9rieur acquitte la malo (sout>=ref retir\u00e9)', b => {
    const m = b.replace('var acquitte=!!sout&&(!ref||sout>=ref);', 'var acquitte=!!sout;');
    if (m === b) throw new Error('mutation non appliqu\u00e9e'); return m;
  }, mut => {
    const M = monter(cave([CUV], [{ type: 'soutirage', date: '2026-03-10', cuvee_id: 'c1' }]),
      { proj: { c1: { etat: 'finie', mal: 0.05, dernier: '2026-05-20', n: 4 } } }, mut);
    return M._mlMalo()[0].cas === 'a_soutirer';
  });
  casse('la fen\u00eatre SO2 inclut J+28 (nSem*7 au lieu de nSem*7-1)', b => {
    const m = b.replace('var fin=_mlAddJ(from,(nSem||4)*7-1)', 'var fin=_mlAddJ(from,(nSem||4)*7)');
    if (m === b) throw new Error('mutation non appliqu\u00e9e'); return m;
  }, mut => {
    const ops = [{ type: 'soutirage', date: '2026-08-20', cuvee_id: 'c1', data: { so2: { dates: ['2026-10-05'], dose: 2 } } }];
    return monter(cave([CUV], ops), {}, mut)._mlSo2Doses(AUJ, 4).doses.length === 0;
  });
  casse('les mesures passent devant les alertes dans le verdict', b => {
    const i = b.indexOf("var nAl=n('alerte')+n('malo');"), j = b.indexOf("var nMe=n('mesure','due');");
    if (i < 0 || j < 0) throw new Error('mutation non appliqu\u00e9e');
    const blocAl = b.slice(i, j), k = b.indexOf("if(ctx.phase==='vendange'", j), blocMe = b.slice(j, k);
    return b.slice(0, i) + blocMe + blocAl + b.slice(k);
  }, mut => {
    const M = monter(cave([]), { agenda: i => i === 0 ? [{ kind: 'alerte', titre: 'B', urgence: 'due', ref: 'b' }, { kind: 'mesure', titre: 'C', urgence: 'due', ref: 'c' }] : [] }, mut);
    return M._mlVerdict(M._mlAgendaComplet(AUJ, 4), {}).t === '1 cuve demande un contr\u00f4le';
  });
  casse('les f\u00fbts en fin de vie prennent une date', b => {
    const m = b.replace("detail:'\\u00e0 renouveler avant le prochain entonnage", "date:'2026-09-30', detail:'\\u00e0 renouveler avant le prochain entonnage");
    if (m === b) throw new Error('mutation non appliqu\u00e9e'); return m;
  }, mut => !monter(cave([]), {}, mut)._mlSansDate({ aReformer: 2, vie: 5, libres: 1 })[0].date);
  casse('une cuv\u00e9e embouteill\u00e9e revient au suivi', b => {
    const m = b.replace("if(!x||!x.id||x.statut==='embouteille') return;", 'if(!x||!x.id) return;');
    if (m === b) throw new Error('mutation non appliqu\u00e9e'); return m;
  }, mut => {
    const bout = { id: 'b1', nom: 'Vieux', millesime: 2024, statut: 'embouteille' };
    return monter(cave([bout]), { proj: { b1: { etat: 'finie', dernier: '2026-01-03', n: 4 } } }, mut)._mlMalo().length === 0;
  });
}

console.log('\n  ' + vert + ' / ' + total + ' vertes' + (rouges.length ? ' \u2014 ROUGES : ' + rouges.join(' | ') : ''));
process.exit(rouges.length ? 1 : 0);
