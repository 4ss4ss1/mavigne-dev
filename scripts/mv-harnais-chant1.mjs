// HARNAIS — CHANT-1 (§316) : l'ordre des chantiers — à faire ou en cours par date de début, l'arrachage fini pour l'équipe
//   en tête des terminés, puis les terminés.
//   node scripts/mv-harnais-chant1.mjs           → doit être vert
//   node scripts/mv-harnais-chant1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions : _mvOrdreChantiers et _mvkAvancement (src/utils.js), _mvChantiersCtx (src/app.js), et la
// ligne suiteFen du cockpit (src/cockpit-vue.js) ; lit le branchement sur le texte des sources, commentaires retirés.
// Aucune écriture dans le dépôt : les contre-épreuves travaillent sur des copies en mémoire.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { uti: L('src/utils.js'), app: L('src/app.js'), pil: L('src/pilotage.js'), vue: L('src/cockpit-vue.js'), ck: L('src/cockpit.js'),
  css: L('src/styles.css'), g04: L('guide/04-vigne.html'), g11: L('guide/11-pilotage.html') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
function ligne(src, re) { const m = src.match(re); if (!m) throw new Error('introuvable : ' + re); return m[0]; }

function mondeU(S, stub) {
  const ctx = { Math, Number, String, Date, Array, Object, JSON, parseInt,
    _escHtml: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), tNom: n => n };
  ctx.window = ctx;
  if (stub) ctx._mvChantiersCtx = stub;
  vm.createContext(ctx);
  const U = S.uti;
  const code = ['_mvkNb', '_mvkHa'].map(n => ligne(U, new RegExp('function ' + n + '\\([a-z]\\)\\{[^\\n]*\\n'))).join('')
    + ligne(U, /function _mvkEtat\(pct,enRetard\)\{[^\n]*\n/)
    + ['_mvOrdreChantiers(rows,ctx){', '_mvkDet(t){', '_mvkLigne(nom,pct,etat,det,sous){', '_mvkAvancement(rows,retards){']
        .map(s => sansCom(fn(U, 'function ' + s))).join('\n')
    + '\nthis.__f={_mvOrdreChantiers,_mvkAvancement};';
  vm.runInContext(code, ctx);
  return ctx.__f;
}
function mondeA(S, o) {
  const P0 = { nom: 'Été 2026', debut: '2026-05-01', fin: '2026-08-31' }, P1 = { nom: 'Automne 2026', debut: '2026-09-01', fin: '2026-11-30' };
  const vus = [];
  const ctx = { Math, Number, String, Date, Array, Object, JSON, _visuSaison: () => o.vue, getSaisonActive: () => P1, _arrEquipeFiniePartout: () => !!o.arr };
  ctx.window = ctx; ctx.SAISONS = [P0, P1];
  // Un stub qui lit son argument : chaque période rend SES fenêtres (fin différente du début, pour voir laquelle est lue).
  ctx._chargeSaisonData = sa => { vus.push(sa && sa.nom); if (o.panne) throw new Error('panne');
    return sa === P1 ? { taskWindows: [{ nom: 'Reparation', start: '2026-10-01', end: '2026-10-31' }, { nom: 'Taille', start: '2026-11-15', end: '2026-11-30' }, { nom: 'Vide' }] }
      : sa === P0 ? { taskWindows: [{ nom: 'Relevage', start: '2026-06-01', end: '2026-07-15' }] } : null; };
  vm.createContext(ctx);
  vm.runInContext(sansCom(fn(S.app, 'function _mvChantiersCtx(sa){')) + '\nthis.__f=_mvChantiersCtx;', ctx);
  return { f: ctx.__f, vus, P0, P1 };
}

function suite(S) {
  const out = []; const T = (n, f) => { let c = false; try { c = !!f(); } catch (e) { c = false; n += ' — PLANTE : ' + e.message; } out.push([n, c]); };
  const fu = () => mondeU(S, null);
  const ORD = (rows, c) => fu()._mvOrdreChantiers(rows, c).map(t => t.nom).join(',');
  // ── la règle ──
  T('l\u2019exemple de Nico : le chantier du 1er septembre avant celui du 15', () => ORD([{ nom: 'B', pct: 10 }, { nom: 'A', pct: 0 }], { debut: { A: '2026-09-01', B: '2026-09-15' } }) === 'A,B');
  T('la date de fin ne compte pas (un long chantier commencé tôt reste devant)', () => ORD([{ nom: 'Court', pct: 0 }, { nom: 'Long', pct: 0 }], { debut: { Long: '2026-09-01', Court: '2026-09-15' } }) === 'Long,Court');
  T('un chantier terminé descend en bas, même commencé plus tôt', () => ORD([{ nom: 'Fini', pct: 100 }, { nom: 'Todo', pct: 0 }], { debut: { Fini: '2026-08-01', Todo: '2026-09-15' } }) === 'Todo,Fini');
  T('un chantier en retard (pas fini) reste en haut', () => ORD([{ nom: 'Fini', pct: 100 }, { nom: 'Retard', pct: 40 }], { debut: { Fini: '2026-08-01', Retard: '2026-08-15' } }) === 'Retard,Fini');
  const C5 = { debut: { Taille: '2026-11-15', Vendange: '2026-09-01', Arrachage: '2026-09-15', Brulage: '2026-08-20' }, equipeFinie: { Arrachage: true } };
  T('l\u2019arrachage fini pour l\u2019équipe : premier des terminés, quelle que soit sa date ; les terminés par date', () =>
    ORD([{ nom: 'Taille', pct: 0 }, { nom: 'Vendange', pct: 100 }, { nom: 'Arrachage', pct: 50 }, { nom: 'Brulage', pct: 100 }], C5) === 'Taille,Arrachage,Brulage,Vendange');
  T('… à 100 %, c\u2019est un terminé comme les autres (rangé par date)', () => ORD([{ nom: 'Arrachage', pct: 100 }, { nom: 'Vendange', pct: 100 }], C5) === 'Vendange,Arrachage');
  T('… pas fini pour l\u2019équipe : il reste avec ce qui est à faire', () => ORD([{ nom: 'Vendange', pct: 100 }, { nom: 'Arrachage', pct: 50 }], { debut: C5.debut }) === 'Arrachage,Vendange');
  T('même date de début : l\u2019ordre reçu (celui des Réglages), dans les deux sens', () => ORD([{ nom: 'X', pct: 0 }, { nom: 'Y', pct: 0 }], { debut: { X: '2026-09-01', Y: '2026-09-01' } }) === 'X,Y'
    && ORD([{ nom: 'Y', pct: 0 }, { nom: 'X', pct: 0 }], { debut: { X: '2026-09-01', Y: '2026-09-01' } }) === 'Y,X');
  T('sans fenêtre : le début de la période (la tâche court sur toute la période)', () => ORD([{ nom: 'Datee', pct: 0 }, { nom: 'Sans', pct: 0 }], { debut: { Datee: '2026-09-10' }, defaut: '2026-09-01' }) === 'Sans,Datee');
  T('sans contexte : les terminés en bas, l\u2019ordre reçu ailleurs', () => ORD([{ nom: 'F', pct: 100 }, { nom: 'A', pct: 0 }, { nom: 'B', pct: 10 }], null) === 'A,B,F');
  T('une entrée qui n\u2019est pas une liste rend une liste vide ; la liste reçue n\u2019est pas modifiée', () => {
    const f = fu(), rows = [{ nom: 'F', pct: 100 }, { nom: 'A', pct: 0 }]; f._mvOrdreChantiers(rows, null);
    return f._mvOrdreChantiers(null, null).length === 0 && f._mvOrdreChantiers('x', null).length === 0 && rows.map(t => t.nom).join(',') === 'F,A'; });
  // ── le kit (Accueil, Pilotage › La campagne) ──
  const ctxK = () => ({ debut: { Taille: '2026-11-15', Reparation: '2026-10-01', Vendange: '2026-09-01', Arrachage: '2026-09-15' }, defaut: '2026-09-01', equipeFinie: { Arrachage: true } });
  const rowsK = () => [{ nom: 'Taille', pct: 0, h_done: 0, h_total: 500 }, { nom: 'Vendange', pct: 100, h_total: 0, surf_done: 11.76, surf_total: 11.76 },
    { nom: 'Arrachage', pct: 50, h_total: 0, surf_done: 0.4, surf_total: 0.8 }, { nom: 'Reparation', pct: 20, h_done: 20, h_total: 100 }];
  const hK = () => mondeU(S, ctxK)._mvkAvancement(rowsK(), { Reparation: true, Arrachage: true });
  const pos = (h, n) => h.indexOf('>' + n + '<');
  T('le kit range ses lignes par la règle : Réparation, Taille, Arrachage, Vendange', () => { const h = hK(); return pos(h, 'Reparation') >= 0 && pos(h, 'Reparation') < pos(h, 'Taille') && pos(h, 'Taille') < pos(h, 'Arrachage') && pos(h, 'Arrachage') < pos(h, 'Vendange'); });
  T('… l\u2019arrachage fini pour l\u2019équipe en vert, à son vrai pourcentage (50 %), même fenêtre passée', () => /Arrachage<\/span><span class="mvk-barre"><i class="mvk-fait" style="width:50%"/.test(hK()));
  T('… sa mention dessous, une fois, avant la ligne suivante', () => { const h = hK(), m = '<div class="mvk-note">Fini pour l\u2019équipe, la suite au prestataire</div>', i = h.indexOf(m);
    return h.split(m).length === 2 && i > pos(h, 'Arrachage') && i < pos(h, 'Vendange'); });
  T('… le retard des autres ne change pas (Réparation reste orange)', () => /Reparation<\/span><span class="mvk-barre"><i class="mvk-retard"/.test(hK()));
  T('… ni « undefined » ni « NaN »', () => !/undefined|NaN/.test(hK()));
  T('sans app.js (pas de contexte) : aucune mention, l\u2019arrachage reste en cours, les terminés en bas', () => { const h = mondeU(S, null)._mvkAvancement(rowsK(), {});
    return !h.includes('mvk-note') && /Arrachage<\/span><span class="mvk-barre"><i class="mvk-cours"/.test(h) && pos(h, 'Vendange') > pos(h, 'Reparation'); });
  // ── ce que la règle lit (app.js) ──
  T('le contexte : le début de chaque fenêtre (pas sa fin) de la période consultée, et son début par défaut', () => { const w = mondeA(S, { vue: 'Automne 2026' }), c = w.f();
    return c.debut.Reparation === '2026-10-01' && c.debut.Taille === '2026-11-15' && !('Vide' in c.debut) && c.defaut === '2026-09-01' && w.vus.join() === 'Automne 2026'; });
  T('… la période CONSULTÉE, pas l\u2019active', () => { const c = mondeA(S, { vue: 'Été 2026' }).f(); return c.debut.Relevage === '2026-06-01' && !c.debut.Reparation && c.defaut === '2026-05-01'; });
  T('… la période donnée en argument (celle du Pilotage)', () => { const w = mondeA(S, { vue: 'Automne 2026' }); const c = w.f(w.P0); return c.debut.Relevage === '2026-06-01' && w.vus.join() === 'Été 2026'; });
  T('… une période consultée inconnue : l\u2019active', () => mondeA(S, { vue: 'Inconnue' }).f().defaut === '2026-09-01');
  T('… l\u2019arrachage fini pour l\u2019équipe partout (ARRACH-7), et lui seul', () => mondeA(S, { vue: 'Automne 2026', arr: true }).f().equipeFinie.Arrachage === true
    && Object.keys(mondeA(S, { vue: 'Automne 2026' }).f().equipeFinie).length === 0);
  T('… une panne du calcul des fenêtres ne fait pas tomber l\u2019écran (le début de la période reste)', () => { const c = mondeA(S, { vue: 'Automne 2026', panne: true }).f(); return c.defaut === '2026-09-01' && Object.keys(c.debut).length === 0; });
  // ── le cockpit (Pilotage › Aujourd'hui) ──
  const P = sansCom(S.pil), Vv = sansCom(S.vue);
  T('le modèle du cockpit range ses tâches par la même règle, dans la période du Pilotage, avant de les construire', () => {
    const b = fn(P, 'function _pilCk2Modele(d, m){'), i = b.indexOf("rows=window._mvOrdreChantiers(rows, OC);"), j = b.indexOf('var taches=rows.map(');
    return b.includes('window._mvChantiersCtx(_pilSaison())') && i > 0 && j > i && b.includes('eqFini:!!EQF[r.nom]&&(Number(r.pct)||0)<100'); });
  T('le cockpit garde eqFini, le peint en vert et ne le prend pas comme tâche du plan par défaut', () => Vv.includes('cle: t.cle, eqFini: !!t.eqFini }));')
    && Vv.includes("const etat = (pct >= 99.95 || t.eqFini) ? 'fait'") && Vv.includes('TACHES.find(t => t.pct < 100 && !t.eqFini)'));
  T('la fenêtre dit « la suite au prestataire » (fini pour l\u2019équipe) ou « fenêtre passée » — au montage comme à la mise à jour', () => {
    const l = ligne(Vv, /const suiteFen = [^\n]*\n/), c = {}; vm.createContext(c); vm.runInContext(l.replace('const suiteFen', 'this.suiteFen'), c); const f = c.suiteFen;
    return f({ eqFini: true }, { etat: 'fait', pct: 50 }) === ', la suite au prestataire' && f({}, { etat: 'retard', pct: 40 }) === ', fenêtre passée'
      && f({ eqFini: true }, { etat: 'fait', pct: 100 }) === '' && f({}, { etat: 'cours', pct: 10 }) === '' && (Vv.match(/suiteFen\(t, x\)/g) || []).length === 2; });
  T('le sous-titre dit la règle, ici et dans le repli (cockpit.js)', () => Vv.includes("'Par date de début, les terminés en bas'") && S.ck.includes("'Par date de début, les terminés en bas'")
    && !Vv.includes('Dans l\u2019ordre des dates de la campagne') && !S.ck.includes('Dans l\u2019ordre des dates de la campagne'));
  T('les deux lectures sont exposées (pilotage.js et le kit les appellent par window)', () => /window\._mvOrdreChantiers=_mvOrdreChantiers;/.test(sansCom(S.uti)) && /window\._mvChantiersCtx=_mvChantiersCtx;/.test(sansCom(S.app)));
  T('la mention a sa règle de feuille, aux jetons seuls', () => /\.mvk-note\{margin:0 0 var\(--e-1,4px\);font-size:var\(--pt-micro,11px\);color:var\(--texte-doux\);\}/.test(S.css));
  // ── l'accompagnement ──
  T('l\u2019aide de l\u2019Accueil et du Pilotage dit la règle', () => S.uti.includes("['Avancement par tâche', \"range les tâches par date de début")
    && S.uti.includes('les chantiers (à faire ou en cours en haut, par date de début ; les terminés en bas)') && S.uti.includes('la tâche se range en tête des terminées, en vert'));
  T('le guide aussi (Vigne et Pilotage)', () => S.g04.includes('rangé par date de début, ce qui reste à faire en haut') && S.g04.includes('en tête des tâches finies, en vert')
    && S.g11.includes('par date de début ; les terminés en bas') && S.g11.includes("l'arrachage fini pour l'équipe passe en tête des terminées"));
  // ARRACH-9 (§317) : le BLOC 8.84, pas la tête du tableau — figer la tête faisait rougir ce harnais au lot suivant.
  T('les nouveautés l\u2019annoncent (bloc 8.84)', () => { const i = S.uti.indexOf("{ v: '8.84', d: '2026-10-12', items: ["), j = S.uti.indexOf("{ v: '8.83'", i); return i > 0 && j > i && S.uti.slice(i, j).includes('Les chantiers se rangent par date de début'); });
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nCHANT-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b) => { const S = Object.assign({}, SRC0); if (!S[k].includes(a)) throw new Error('contre-épreuve sans ancre : ' + a.slice(0, 60)); S[k] = S[k].split(a).join(b); return S; };
const CONTRES = [
  ['sans les groupes (les terminés ne descendent plus)', () => sub('uti', '(a.g-b.g)||', '')],
  ['sans la date de début', () => sub('uti', '(a.d<b.d?-1:(a.d>b.d?1:0))||', '')],
  ['l\u2019arrachage fini pour l\u2019équipe sans son groupe', () => sub('uti', '((t&&eq[t.nom])?1:0)', '0')],
  ['le kit sans le vert de l\u2019arrachage', () => sub('uti', "eqf?'fait':_mvkEtat(", '_mvkEtat(')],
  ['le kit sans la mention', () => sub('uti', "if(eqf) h+='<div class=\"mvk-note\">", "if(false) h+='<div class=\"mvk-note\">")],
  ['le kit sans l\u2019ordre', () => sub('uti', "var L=(typeof _mvOrdreChantiers==='function')?_mvOrdreChantiers(rows,C):(Array.isArray(rows)?rows:[]);", 'var L=Array.isArray(rows)?rows:[];')],
  ['le contexte lit la fin de la fenêtre', () => sub('app', 'if(w&&w.nom&&w.start) out.debut[w.nom]=String(w.start);', 'if(w&&w.nom&&w.end) out.debut[w.nom]=String(w.end);')],
  ['le contexte oublie l\u2019arrachage', () => sub('app', "out.equipeFinie['Arrachage']=true;", '0;')],
  ['le contexte lit la période active', () => sub('app', 'var vn=_visuSaison();', "var vn='';")],
  ['le modèle du cockpit ne trie plus', () => sub('pil', "if(typeof window._mvOrdreChantiers==='function') rows=window._mvOrdreChantiers(rows, OC);", '')],
  ['le cockpit oublie le vert', () => sub('vue', '(pct >= 99.95 || t.eqFini)', '(pct >= 99.95)')],
  ['la fenêtre oublie le prestataire', () => sub('vue', "', la suite au prestataire'", "''")],
  ['l\u2019ancien sous-titre revient', () => sub('vue', "'Par date de début, les terminés en bas'", "'Dans l\u2019ordre des dates de la campagne'")],
];
let mord = 0, muet = 0;
CONTRES.forEach(([n, mk]) => { let rouge = false; try { rouge = suite(mk()).some(([, c]) => !c); } catch (e) { rouge = true; }
  if (rouge) { mord++; console.log('  \u2713 contre-épreuve rouge : ' + n); } else { muet++; console.log('  \u2717 contre-épreuve MUETTE : ' + n); } });
console.log(`\nCHANT-1 contre-épreuves : ${mord}/${CONTRES.length} mordent`);
process.exit(muet ? 1 : 0);
