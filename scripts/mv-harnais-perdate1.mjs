/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — PERDATE-1 (§427) : UNE DATE IMPOSSIBLE N'EST PAS UNE DATE VIDE ; UNE SEULE LISTE DE TÂCHES POUR LES DEUX
   FENÊTRES DE PÉRIODE (« Nouvelle période », « Modifier la période »)
   Lancer : node scripts/mv-harnais-perdate1.mjs          (le contrôle)
            node scripts/mv-harnais-perdate1.mjs --contre  (la contre-épreuve)
   Les vraies fonctions de src/reglages.js sont EXTRAITES et EXÉCUTÉES dans un vm, sur un faux document dont un champ
   date peut porter validity.badInput — ce que rend le navigateur pour un 31/09 tapé (value '' et badInput, mesuré au
   navigateur, §427b) : _perDateLue, _perDatesAlertes, _perTacheInfo, _perTacheCorps et les deux listes à cocher
   (_nsBuildTaches, _esBuildTaches — sur le vrai TACHES_CATALOGUE d'app.js, avec les vrais échappeurs d'utils.js), puis
   saveSaison et saveEditSaison de bout en bout. Le câblage
   (index.html, gestionnaires, exposition, ordre des gestes) est lu, commentaires blanchis.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import vm from 'node:vm';

const G0 = fs.readFileSync('src/reglages.js', 'utf8');
const A0 = fs.readFileSync('src/app.js', 'utf8');
const U0 = fs.readFileSync('src/utils.js', 'utf8');
const H0 = fs.readFileSync('index.html', 'utf8');
const S0 = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');

// Découpe une déclaration `function X(` par comptage d'accolades, en sautant chaînes, gabarits et commentaires.
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) return '';
  let j = src.indexOf('{', i), d = 0;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (c === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j + 2) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') {
      for (j++; j < src.length && src[j] !== c; j++) if (src[j] === '\\') j++;
      continue;
    }
    if (c === '{') d++; else if (c === '}') { d--; if (!d) break; }
  }
  return src.slice(i, j + 1);
}
// Les échappeurs d'utils.js portent des expressions régulières à guillemets (/"/g, /'/g) : on les découpe à la ligne,
// de leur déclaration à l'accolade fermante en début de ligne.
function fonctionLignes(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) return '';
  return src.slice(i, src.indexOf('\n}\n', i) + 2);
}
// Une ligne `var X=…;`.
function ligneVar(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) return '';
  return src.slice(i, src.indexOf('\n', i));
}
function catalogue(src) {
  const i = src.indexOf('const TACHES_CATALOGUE = [');
  const j = src.indexOf('\n];', i);
  return src.slice(i, j + 3).replace('const TACHES_CATALOGUE', 'var TACHES_CATALOGUE');
}
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// ── Un faux document : des éléments par id, un champ date peut être « impossible » (badInput) ─────────────────
function element(id, init) {
  const e = Object.assign({ id, value: '', innerHTML: '', textContent: '', hidden: false, bad: false, attrs: {} }, init || {});
  e.validity = { get badInput() { return !!e.bad; } };
  e.setAttribute = (k, v) => { e.attrs[k] = String(v); };
  e.removeAttribute = (k) => { delete e.attrs[k]; };
  e.getAttribute = (k) => (k in e.attrs ? e.attrs[k] : null);
  e.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
  return e;
}
const NOMS = ['_perDateLue', '_perDateKoMsg', '_perDatesAlertes', '_perAlertesHtml', '_perTacheInfo', '_perTacheCorps',
  '_nsBuildTaches', '_esBuildTaches',
  '_nsRefTaches', '_nsNote', '_nsPeriode', 'saveSaison', '_seedFromCat', '_perAssureTaches', '_esDatesEtat', '_esDatesNote',
  '_esBuildEch', 'saveEditSaison', '_renamePeriode'];
function monter(G, A, U) {
  const morceaux = NOMS.map((n) => [n, fonction(G, n)]);
  const vides = morceaux.filter(([, c]) => !c).map(([n]) => n);
  if (vides.length) throw new Error('introuvable dans reglages.js : ' + vides.join(', '));
  const code = [
    ligneVar(G, "var _PER_KO="), ligneVar(G, "var _MV_MOISA="),
    'var _nsTachesSel=new Set(), _nsTachesTouched=false; var _esEchTasks=[]; var _esSaison=null; var _esTachesSel=new Set();',
    fonctionLignes(U, '_escHtml'), fonctionLignes(U, '_escAttr'), catalogue(A),
    ...morceaux.map(([, c]) => c),
  ].join('\n');
  const els = {}, toasts = [], sauves = [];
  const ctx = {
    console, Set, Array, Object, String, Number, JSON, Math, Date,
    document: { getElementById: (id) => els[id] || null },
    showToast: (m, c) => toasts.push(String(m)),
    isAdmin: () => true,
    renderReglages: () => {},
    _mvIcon: (n) => '<svg data-i="' + n + '"></svg>',
    // ⚠️ le vrai _mvIconTache traduit le nom en icône (TACHE_ICO, « feuille » par défaut) et ne le recopie jamais : un stub qui
    //   le recopierait mettrait dans le HTML un nom non échappé que l'appli n'y met pas (vécu à l'écriture de ce harnais).
    _mvIconTache: () => '<svg data-t="tache"></svg>',
  };
  ctx.window = ctx;
  ctx.saveData = (k) => sauves.push(k);
  ctx.closeOv = () => {}; ctx.openOv = () => {}; ctx.recalcTravaux = () => {};
  ctx.PARCELLES = []; ctx.SESSIONS = []; ctx.HISTORIQUE = []; ctx.CONFIG = {};
  vm.createContext(ctx);
  vm.runInContext(code + '\nwindow.TACHES_CATALOGUE=TACHES_CATALOGUE;\n' +
    'window.__etat=function(k,v){ if(k==="es"){_esTachesSel=v.sel;_esEchTasks=v.ech;_esSaison=v.saison;} if(k==="ns"){_nsTachesSel=v.sel;_nsTachesTouched=true;} };', ctx);
  return { ctx, els, toasts, sauves, el: (id, init) => (els[id] = element(id, init)) };
}

async function controles(G, A, U, H, S) {
  const r = [];
  const ok = (x, c, d) => r.push([x, !!c, d]);
  let M;
  try { M = monter(G, A, U); } catch (e) { ok('les fonctions de PERDATE-1 sont dans reglages.js', false, e.message); return r; }
  const { ctx } = M;

  // ── A. La lecture d'une case date ──
  const bad = M.el('x-bad', { bad: true }), bon = M.el('x-bon', { value: '2027-09-30', attrs: { 'aria-invalid': 'true' } });
  const a1 = ctx._perDateLue(bad), a2 = ctx._perDateLue(bon), a3 = ctx._perDateLue(null);
  ok('la case impossible (31/09 tapé : value vide, badInput) se lit impossible, pas vide', a1.ko === true && a1.v === '' && bad.getAttribute('aria-invalid') === 'true', JSON.stringify(a1));
  ok('une case juste se lit, et perd sa marque rouge', a2.ko === false && a2.v === '2027-09-30' && bon.getAttribute('aria-invalid') === null, JSON.stringify(a2));
  ok('une case absente ne fait pas planter', a3.ko === false && a3.v === '');

  // ── B. Les alertes de dates ──
  const F = (v, ko) => ({ v: v || '', ko: !!ko });
  const b1 = ctx._perDatesAlertes(F('2027-08-01'), F('', true), null);
  ok('fin impossible : une alerte qui le dit et donne l’exemple du 31 septembre', b1.length === 1 && /^Date de fin impossible/.test(b1[0]) && /31\s+septembre/.test(b1[0]), JSON.stringify(b1));
  const b2 = ctx._perDatesAlertes(F('', true), F('', true), null);
  ok('début et fin impossibles : deux alertes', b2.length === 2 && /^Date de début impossible/.test(b2[0]), JSON.stringify(b2));
  const b3 = ctx._perDatesAlertes(F('2027-09-30'), F('2027-08-01'), null);
  ok('une fin avant le début est dite', b3.length === 1 && b3[0] === 'La fin précède le début.', JSON.stringify(b3));
  ctx.SAISONS = [{ nom: 'Hiver', debut: '2027-01-01', fin: '2027-03-31' }, { nom: 'Vendange 2027', debut: '2027-08-01', fin: '2027-09-30' }];
  const b4 = ctx._perDatesAlertes(F('2027-09-01'), F('2027-10-15'), 'Vendange 2027');
  const b5 = ctx._perDatesAlertes(F('2027-09-01'), F('2027-10-15'), null);
  ok('la période qu’on modifie ne se chevauche pas elle-même (exclue par son nom)', b4.length === 0, JSON.stringify(b4));
  ok('une autre période chevauchée est nommée', b5.length === 1 && b5[0] === 'Chevauche : Vendange 2027.', JSON.stringify(b5));

  // ── C. Le libellé des heures, sur le vrai catalogue ──
  const cat = ctx.TACHES_CATALOGUE, info = (n) => ctx._perTacheInfo(cat.find((c) => c.nom === n) || {});
  const libs = cat.map((c) => ctx._perTacheInfo(c));
  ok('aucun travail du catalogue n’affiche « undefined » ni « NaN »', cat.length > 10 && libs.every((l) => !/undefined|NaN/.test(l)), JSON.stringify(libs));
  ok('les travaux au temps réel sans heures écrivent « temps réel »', ['Arrachage', 'Desherbage', 'Effeuillage', 'Vendange'].every((n) => info(n) === 'temps réel'), ['Arrachage', 'Desherbage', 'Effeuillage', 'Vendange'].map(info).join(' | '));
  ok('tarière, niveaux, passages et heures simples gardent leur libellé', info('Entreplantation') === 'tarière' && info('Relevage') === '90 h/ha' && info('Ebourgeonnage') === '35/35 h/ha' && info('Taille') === '70 h/ha', [info('Entreplantation'), info('Relevage'), info('Ebourgeonnage'), info('Taille')].join(' | '));
  let c9; try { c9 = ctx._perTacheInfo({ nom: 'Maison', type: 'niveaux' }); } catch (e) { c9 = 'PLANTE ' + e.message; }
  ok('une tâche du domaine à 28 h/ha s’affiche, une tâche « niveaux » sans niveaux ne plante pas', ctx._perTacheInfo({ nom: 'Dégraffage', hha: 28 }) === '28 h/ha' && !/PLANTE|NaN|undefined/.test(c9), c9);

  // ── D. Les deux listes à cocher, construites par les vraies fonctions de chaque fenêtre ──
  ctx.TACHES = [{ nom: 'Taille', hha: 70 }, { nom: 'Dégraffage <b>x</b>', hha: 28 }];
  M.el('ns-taches-pick'); M.el('ns-taches-count'); M.el('es-taches-pick'); M.el('es-taches-count');
  let hn = '', he = '';
  try {
    ctx.__etat('ns', { sel: new Set(['Vendange']) }); ctx._nsBuildTaches(); hn = M.els['ns-taches-pick'].innerHTML;
    ctx.__etat('es', { sel: new Set(), ech: [], saison: null }); ctx._esBuildTaches(); he = M.els['es-taches-pick'].innerHTML;
  } catch (e) { hn = he = 'PLANTE ' + e.message; }
  const lignes = (hn.match(/class="ns-tpick/g) || []).length;
  ok('les deux listes : une ligne par travail du catalogue et par tâche propre au domaine, sans « undefined » ni « NaN »', lignes === cat.length + 1 && (he.match(/class="ns-tpick/g) || []).length === lignes && !/undefined|NaN|PLANTE/.test(hn + he), lignes + ' lignes pour ' + (cat.length + 1) + ' ' + hn.slice(0, 80));
  ok('le nom d’une tâche du domaine est échappé, dans les deux listes', hn.includes('Dégraffage &lt;b&gt;x&lt;/b&gt;') && he.includes('Dégraffage &lt;b&gt;x&lt;/b&gt;') && !(hn + he).includes('<b>x</b>'));
  ok('chaque fenêtre garde son gestionnaire, la case cochée est marquée', hn.includes('onclick="_nsToggleTache(\'Taille\')"') && he.includes('onclick="_esToggleTache(\'Taille\')"') && /class="ns-tpick on"[^>]*_nsToggleTache\('Vendange'\)/.test(hn));
  ok('« temps réel » dans la liste de « Nouvelle période » (la fenêtre de la capture)', /<span class="n">Vendange<\/span><span class="h">temps réel<\/span>/.test(hn), (hn.match(/<span class="n">Vendange<\/span><span class="h">[^<]*/) || [''])[0]);

  // ── E. « Nouvelle période » de bout en bout ──
  const ns = (deb, fin) => {
    M.toasts.length = 0; M.sauves.length = 0;
    M.el('ns-nom', { value: 'Vendange 2028' }); M.el('ns-debut', deb); M.el('ns-fin', fin); M.el('ns-note'); M.el('ovSaison');
    ctx.__etat('ns', { sel: new Set() });
    const n0 = ctx.SAISONS.length; ctx.saveSaison();
    return { ajout: ctx.SAISONS.length - n0, toast: M.toasts[0] || '', note: M.els['ns-note'].innerHTML, finKo: M.els['ns-fin'].getAttribute('aria-invalid') };
  };
  const e1 = ns({ value: '2028-08-01' }, { bad: true });
  ok('création, fin au 31/09 : refusée avec « Date de fin impossible », plus « obligatoires »', e1.ajout === 0 && /^Date de fin impossible/.test(e1.toast) && !/obligatoires/.test(e1.toast), e1.toast);
  ok('création : la case de fin passe en rouge et la note le dit', e1.finKo === 'true' && /Date de fin impossible/.test(e1.note), e1.note.slice(0, 120));
  const e2 = ns({ value: '' }, { value: '' });
  ok('création, deux cases vraiment vides : « Début et fin obligatoires » reste', e2.ajout === 0 && /^Début et fin obligatoires/.test(e2.toast), e2.toast);
  const e3 = ns({ value: '2028-08-01' }, { value: '2028-09-30' });
  const neuve = ctx.SAISONS[ctx.SAISONS.length - 1];
  ok('création, dates justes : la période est créée avec sa fin', e3.ajout === 1 && neuve.fin === '2028-09-30' && M.sauves.includes('saisons'), JSON.stringify(neuve));

  // ── F. « Modifier la période » de bout en bout ──
  const es = (o) => {
    M.toasts.length = 0; M.sauves.length = 0;
    const s = { nom: 'Vendange 2027', debut: '2027-08-01', fin: '2027-09-30', taches: ['Vendange'], echeances: { Vendange: { d1: '2027-09-05', d2: '2027-09-20' } } };
    ctx.SAISONS = [{ nom: 'Hiver', debut: '2027-01-01', fin: '2027-03-31' }, s];
    ctx.PARCELLES = [{ tachesAll: { 'Vendange 2027': { Vendange: 1 } } }];
    M.el('es-saison-nom', { value: 'Vendange 2027' }); M.el('es-saison-nomlibre', { value: o.nom || 'Vendange 2027' });
    M.el('es-saison-periode', { value: '' }); M.el('es-saison-debut', o.deb || { value: '2027-08-01' }); M.el('es-saison-fin', o.fin || { value: '2027-09-30' });
    M.el('es-saison-note', { hidden: true }); M.el('es-echeances');
    ctx.__etat('es', { sel: new Set(['Vendange']), ech: ['Vendange'], saison: s });
    M.el('es-ech-0-d1', o.d1 || { value: '2027-09-05' }); M.el('es-ech-0-d2', o.d2 || { value: '2027-09-20' });
    ctx.saveEditSaison();
    return { s, toast: M.toasts[0] || '', sauve: M.sauves.slice(), note: M.els['es-saison-note'], renomme: ctx.PARCELLES[0].tachesAll };
  };
  const f1 = es({ fin: { bad: true } });
  ok('modification, fin au 31/09 : la fin n’est PAS effacée, rien n’est enregistré', f1.s.fin === '2027-09-30' && f1.sauve.length === 0 && /^Date de fin impossible/.test(f1.toast), JSON.stringify({ fin: f1.s.fin, sauve: f1.sauve, toast: f1.toast }));
  ok('modification : la note sous les dates apparaît et le dit', f1.note.hidden === false && /Date de fin impossible/.test(f1.note.innerHTML), f1.note.innerHTML.slice(0, 100));
  const f2 = es({ nom: 'Vendanges', fin: { bad: true } });
  ok('modification : rien ne bouge avant correction — pas de renommage, pas de clés migrées', f2.s.nom === 'Vendange 2027' && Object.keys(f2.renomme).join() === 'Vendange 2027', JSON.stringify({ nom: f2.s.nom, cles: Object.keys(f2.renomme) }));
  const f3 = es({ deb: { value: '2027-09-30' }, fin: { value: '2027-08-01' } });
  ok('modification : une fin avant le début est refusée, comme à la création', f3.s.debut === '2027-08-01' && f3.sauve.length === 0 && f3.toast === 'La fin précède le début', f3.toast);
  const f4 = es({ d2: { bad: true } });
  ok('modification : une date de travaux impossible est refusée, la tâche nommée', f4.s.echeances.Vendange.d2 === '2027-09-20' && f4.sauve.length === 0 && /Date de travaux impossible : Vendange/.test(f4.toast), f4.toast);
  const f5 = es({ fin: { value: '2027-10-05' } });
  ok('modification, dates justes : enregistrée, nouvelle fin, note cachée', f5.s.fin === '2027-10-05' && f5.sauve.includes('saisons') && f5.note.hidden === true && /^Période mise à jour/.test(f5.toast), JSON.stringify({ fin: f5.s.fin, sauve: f5.sauve, cachee: f5.note.hidden, toast: f5.toast }));

  // ── G. Le câblage ──
  const g = sansCommentaires(G), h = H;
  ok('une seule ligne de tâche dans reglages.js : le corps commun, appelé par les deux fenêtres', (g.match(/<span class="h">/g) || []).length === 1 && /_perTacheCorps\(c,on\)/.test(fonction(g, '_nsBuildTaches')) && /_perTacheCorps\(c,on\)/.test(fonction(g, '_esBuildTaches')));
  ok('les deux gestionnaires restent écrits en clair (le compte des gestes sans tuto et le preflight les lisent)', fonction(g, '_nsBuildTaches').includes(`onclick="_nsToggleTache(\\''+_escAttr(c.nom)`) && fonction(g, '_esBuildTaches').includes(`onclick="_esToggleTache(\\''+_escAttr(c.nom)`));
  ok('index.html : les cases début et fin de « Modifier la période » réagissent au départ (onblur) et au changement', /id="es-saison-debut" onblur="_esDatesNote\(\)" onchange="_esDatesNote\(\)"/.test(h) && /id="es-saison-fin" onblur="_esDatesNote\(\)" onchange="_esDatesNote\(\)"/.test(h));
  ok('index.html : la note de la période a son propre identifiant — « es-note » reste au seul champ Note du tracteur', (h.match(/id="es-saison-note"/g) || []).length === 1 && (h.match(/id="es-note"/g) || []).length === 1);
  ok('index.html : « Nouvelle période » garde ses deux gestionnaires de date', /id="ns-debut" onblur="_nsDateEdit\(\)" onchange="_nsDateEdit\(\)"/.test(h) && /id="ns-fin" onblur="_nsDateEdit\(\)" onchange="_nsDateEdit\(\)"/.test(h));
  ok('_esDatesNote est exposée (un onblur ne voit pas une fonction du module)', /window\._esDatesNote\s*=\s*_esDatesNote;/.test(g));
  const eb = fonction(g, '_esBuildEch');
  ok('les dates de travaux réagissent au départ de la case, la note suit chaque reconstruction', (eb.match(/onblur="_esDatesNote\(\)" onchange="_esDatesNote\(\)"/g) || []).length === 2 && (eb.match(/_esDatesNote\(\);/g) || []).length === 2);
  const se = fonction(g, 'saveEditSaison'), iv = se.indexOf('_esDatesNote()');
  ok('saveEditSaison contrôle les dates AVANT le renommage et les tâches', iv > 0 && iv < se.indexOf('_renamePeriode(') && iv < se.indexOf('_perAssureTaches('));
  ok('le rouge vient du jeu des cases (CHARTE-6) : .fi[aria-invalid="true"] existe dans la feuille', /\.fi\[aria-invalid="true"\]/.test(S));
  return r;
}

let vertes = 0, rouges = 0;
const t = (x, c, d) => { if (c) { vertes++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { rouges++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── PERDATE-1 — une date impossible n’est pas une date vide ; une seule liste de tâches\n');
  for (const [x, c, d] of await controles(G0, A0, U0, H0, S0)) t(x, c, d);
  console.log(`\n  ${vertes} vertes, ${rouges} rouges\n`);
  process.exit(rouges ? 1 : 0);
}
console.log('\n── PERDATE-1 — contre-épreuve\n');
const remplace = (src, a, b) => { if (!src.includes(a)) throw new Error('motif absent : ' + a.slice(0, 50)); return src.replace(a, b); };
const deplace = (src) => {
  const i = src.indexOf('  // PERDATE-1 (§427) : rien ne bouge'), j = src.indexOf("  if(_eKo){ showToast(_eKo,'#B85A1A'); return; }\n", i) + "  if(_eKo){ showToast(_eKo,'#B85A1A'); return; }\n".length;
  if (i < 0 || j < i) throw new Error('bloc de contrôle introuvable');
  const bloc = src.slice(i, j), reste = src.slice(0, i) + src.slice(j);
  return remplace(reste, '  s.taches=Array.from(_esTachesSel||[]);', bloc + '  s.taches=Array.from(_esTachesSel||[]);');
};
const essais = [
  ['la case impossible lue comme vide (l’ancien défaut) est vue', () => [remplace(G0, 'var ko=!!(el&&el.validity&&el.validity.badInput);', 'var ko=false;'), H0], 'la case impossible'],
  ['« undefined h/ha » revenu est vu', () => [remplace(G0, "return Number(c.hha)>0?(Number(c.hha)+' h/ha'):'temps réel';", "return c.hha+' h/ha';"), H0], 'aucun travail du catalogue'],
  ['une modification qui enregistre malgré la date impossible est vue', () => [remplace(G0, "if(_eKo){ showToast(_eKo,'#B85A1A'); return; }", "if(_eKo){ showToast(_eKo,'#B85A1A'); }"), H0], 'modification, fin au 31/09'],
  ['un nom de tâche non échappé est vu', () => [remplace(G0, "+'<span class=\"n\">'+_escHtml(c.label||c.nom)+'</span>'", "+'<span class=\"n\">'+(c.label||c.nom)+'</span>'"), H0], 'le nom d’une tâche'],
  ['le chevauchement jugé sur l’objet (la période se chevauche elle-même) est vu', () => [remplace(G0, 's&&s.nom!==sauf&&', 's&&s!==sauf&&'), H0], 'la période qu’on modifie'],
  ['la création qui relit la case comme avant (« obligatoires ») est vue', () => [remplace(G0, "var _dl=_perDateLue(document.getElementById('ns-debut')),_fl=_perDateLue(document.getElementById('ns-fin'));", "var _dl={v:(document.getElementById('ns-debut')||{}).value||'',ko:false},_fl={v:(document.getElementById('ns-fin')||{}).value||'',ko:false};"), H0], 'création, fin au 31/09'],
  ['le contrôle déplacé après le renommage est vu', () => [deplace(G0), H0], 'modification : rien ne bouge'],
  ['une case de fin sans gestionnaire de départ est vue', () => [G0, remplace(H0, 'id="es-saison-fin" onblur="_esDatesNote()" onchange="_esDatesNote()"', 'id="es-saison-fin"')], 'index.html : les cases début et fin'],
  ['la note qui reprend l’identifiant du champ du tracteur est vue', () => [G0, remplace(H0, 'id="es-saison-note"', 'id="es-note"')], 'index.html : la note de la période'],
  ['une seconde copie du corps de ligne est vue', () => [remplace(G0, "onclick=\"_esToggleTache(\\''+_escAttr(c.nom)+'\\')\">'+_perTacheCorps(c,on)+'</div>';", "onclick=\"_esToggleTache(\\''+_escAttr(c.nom)+'\\')\"><span class=\"h\">'+c.hha+' h/ha</span></div>';"), H0], 'une seule ligne de tâche'],
  ['un gestionnaire repassé en variable (caché au compte des gestes) est vu', () => [remplace(G0, "onclick=\"_nsToggleTache(\\''+_escAttr(c.nom)", "onclick=\"'+'_nsToggleTache'+'(\\''+_escAttr(c.nom)"), H0], 'les deux gestionnaires restent'],
];
let rates = 0;
for (const [x, fabrique, cible] of essais) {
  let vu, G, H;
  try { [G, H] = fabrique(); } catch (e) { vu = false; console.log('      (essai impossible à monter : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (G !== undefined) {
    try { vu = (await controles(G, A0, U0, H, S0)).some(([y, c]) => y.startsWith(cible) && !c); }
    catch (e) { vu = true; console.log('      (plantage, donc vu : ' + String(e && e.message).slice(0, 60) + ')'); }
  }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`);
process.exit(rates ? 1 : 0);
