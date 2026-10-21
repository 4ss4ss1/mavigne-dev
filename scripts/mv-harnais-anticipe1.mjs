#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ANTICIPE-1 (§420) : LES POINTS À ANTICIPER, EN TÊTE ET D'UN GESTE
   Lancer : node scripts/mv-harnais-anticipe1.mjs           → doit être vert
            node scripts/mv-harnais-anticipe1.mjs --contre  → chaque défaut réinjecté doit rougir

   ══ POURQUOI ══
   Nico (21/10), sur une capture d'Aujourd'hui au téléphone : « 2 points à anticiper… Lesquels ? ». La phrase comptait les
   lignes prioritaires d'« À savoir » (prio 1), mais la vue ne les triait pas (le cockpit de secours, si) : météo, absences,
   puis contrats et retards — et passé cinq lignes, « Tout voir » les cachait. Leur seule marque : la date en gras.

   ══ CE QU'IL TIENT ══ (les fonctions sont EXÉCUTÉES sur le vrai fichier, commentaires compris dans aucune preuve)
     A. savoirItems : les points à anticiper en tête, chacun dans son ordre ; le reste derrière, dans le sien.
     B. htmlSavoir : l'étiquette « À anticiper » sur eux seuls, dans les cinq premières lignes ; balises équilibrées.
     C. majResume : « N points à anticiper » est un bouton data-fn="anticiper" (singulier, pluriel) ; sinon « rien à anticiper ».
     D. allerAnticiper, sur un faux document : Terrain d'abord, la liste dépliée au-delà de cinq, la première ligne amenée
        (« start » au téléphone, « nearest » ailleurs), la respiration hors animations réduites, une trace quand il n'y a rien.
     E. La feuille : le bloc ANTICIPE-1 borné à .ck2, jetons seulement, la respiration sur une animation qui existe.
     F. Les absences : la tuile (lignes de pilotage.js EXÉCUTÉES) sans « absent » ; « Absence d’Inès » (cockpit.js EXÉCUTÉ).
     G. L'accompagnement : la bulle « i » d'« À savoir », la fiche MV_AIDE, le guide, la nouveauté 9.80.
   ⚠️ Il ne regarde pas un écran : le rendu se regarde au lot (§420).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { vue: L('src/cockpit-vue.js'), pil: L('src/pilotage.js'), ck: L('src/cockpit.js'), css: L('src/styles.css'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };
const morceau = (src, debut, fin) => { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); const j = src.indexOf(fin, i); if (j < 0) throw new Error('fin introuvable : ' + fin); return src.slice(i, j + fin.length); };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
const sansComCss = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const compte = (s, re) => (s.match(re) || []).length;

const SV = [   // l'ordre des sources : météo, absences, contrats, retards, matériel (pilotage.js/_pilCk2Modele)
  { cat: 'meteo', prio: 2, quand: 'Demain', titre: 'Pluie annoncée : 4 mm' },
  { cat: 'meteo', prio: 1, quand: 'Vendredi', titre: 'Vent annoncé à 45 km/h', sous: 'En cours : taille, 6 parcelles pas encore faites.' },
  { cat: 'equipe', prio: 2, quand: 'Demain', titre: 'Absence d’Inès' }, { cat: 'equipe', prio: 2, quand: 'Demain', titre: 'Hugo en congé' },
  { cat: 'equipe', prio: 2, quand: 'Du lun. au ven.', titre: 'Absence de Sophie' },
  { cat: 'contrat', prio: 1, quand: 'ven. 13 nov.', titre: 'Fin du contrat de Léa' },
  { cat: 'retard', prio: 1, quand: 'Fenêtre passée', titre: 'Réparations en retard' }, { cat: 'retard', prio: 1, quand: 'Fenêtre passée', titre: 'Tirage des bois en retard' },
  { cat: 'materiel', prio: 2, quand: 'En réparation', titre: 'T2 immobilisé' }];

// ── Le faux document de D ──────────────────────────────────────────────────────────────────────
function element(o) {
  const cls = new Set(o.cls || []), att = {};
  const el = { dataset: o.dataset || {}, textContent: '', offsetWidth: 10, appels: [], ecout: 0,
    classList: { add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c), toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)) },
    setAttribute: (k, v) => { att[k] = String(v); }, getAttribute: k => att[k],
    scrollIntoView: a => el.appels.push(['scroll', a]), focus: a => el.appels.push(['focus', a]), addEventListener: () => { el.ecout++; } };
  el.a = cls; el.att = att; return el;
}
function jouerAller(S, sc) {
  const forts = Array.from({ length: sc.n }, () => element({ cls: ['ck-sv', 'fort'] })), liste = element({ cls: sc.tout ? ['ck-sv-l', 'tout'] : ['ck-sv-l'] });
  const bouton = element({}), page = element({ dataset: { taille: sc.taille } }), journal = [], modes = [];
  const ctx = { S: { mode: sc.mode, svTout: !!sc.tout }, window: { logError: x => journal.push(x) }, reduit: () => !!sc.reduit,
    requestAnimationFrame: f => f(), choisirMode: m => { modes.push(m); ctx.S.mode = m; },
    $: s => (s === '#ck-sv-l' ? (sc.sansListe ? null : liste) : s === '#ck-sv-tout' ? bouton : s === '#ck-page' ? page : null),
    $$: s => (s === '#ck-sv-l .ck-sv.fort' ? forts : []) };
  vm.createContext(ctx); vm.runInContext(morceau(S.vue, 'function allerAnticiper() {', '\n}\n') + '\nallerAnticiper();', ctx);
  return { forts, liste, bouton, journal, modes, S: ctx.S };
}

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const vueNu = sansCom(S.vue), pilNu = sansCom(S.pil), ckNu = sansCom(S.ck);
  // A. le tri
  {
    const ctx = { Object }; vm.createContext(ctx);
    vm.runInContext(['let V = null;', morceau(S.vue, 'function savoirItems() {', '\n}\n'), 'this.__si = VV => { V = VV; return savoirItems(); };'].join('\n'), ctx);
    const L2 = ctx.__si({ savoir: SV }), t = L2.map(x => x.titre);
    T('A1 les points à anticiper passent en tête, chacun dans son ordre (météo, contrat, retards)',
      t.slice(0, 4).join('|') === 'Vent annoncé à 45 km/h|Fin du contrat de Léa|Réparations en retard|Tirage des bois en retard');
    T('A2 le reste suit dans son ordre (météo, absences, matériel), rien de perdu',
      t.slice(4).join('|') === 'Pluie annoncée : 4 mm|Absence d’Inès|Hugo en congé|Absence de Sophie|T2 immobilisé' && L2.length === SV.length);
    T('A3 chaque ligne garde son pictogramme', L2.every(x => x.ic) && L2[0].ic === 'pluie' && L2[1].ic === 'contrat');
    T('A4 sans « À savoir », une liste vide (pas de plantage)', ctx.__si({}).length === 0);
  }
  // B. l'étiquette
  {
    const code = ['let METEO = [], V = null; const S = { svTout: false };', morceau(S.vue, 'const esc = s => ', '\n'), morceau(S.vue, 'const INFO = {', '\n};\n'),
      morceau(S.vue, 'const SVG = ', '\n\n'), morceau(S.vue, 'function savoirItems() {', '\n}\n'), morceau(S.vue, 'function htmlSavoir(r) {', '\n}\n'),
      'this.__r = (VV) => { V = VV; return htmlSavoir(); }; this.__info = INFO;'].join('\n');
    const ctx = { Math, Number, String, Array, Object, JSON }; vm.createContext(ctx); vm.runInContext(code, ctx);
    const h = ctx.__r({ savoir: SV }), lis = h.split('<li ').slice(1);
    T('B1 l’étiquette « À anticiper » sur les quatre points, et sur eux seuls',
      compte(h, /<span class="ck-sv-k">À anticiper<\/span>/g) === 4 && lis.slice(0, 4).every(x => x.includes(' fort"') && x.includes('ck-sv-k')) && lis.slice(4).every(x => !x.includes('ck-sv-k') && !x.includes(' fort"')));
    T('B2 les points tiennent dans les cinq lignes que « Tout voir » laisse visibles', lis.length === 9 && lis.slice(0, 5).filter(x => x.includes(' fort"')).length === 4);
    T('B3 une liste bien formée : balises équilibrées, ni undefined ni NaN',
      compte(h, /<li /g) === compte(h, /<\/li>/g) && compte(h, /<span/g) === compte(h, /<\/span>/g) && compte(h, /<div/g) === compte(h, /<\/div>/g) && !/undefined|NaN/.test(h));
    T('B4 la bulle « i » d’« À savoir » dit l’ordre et l’étiquette, et garde ce que dit la bande',
      /En tête, surlignés et marqués « À anticiper »/.test(ctx.__info.savoir) && /toucher la phrase mène ici/.test(ctx.__info.savoir)
      && /risque de pluie/.test(ctx.__info.savoir) && /vent le plus fort/.test(ctx.__info.savoir) && /30 jours/.test(ctx.__info.savoir));
  }
  // C. la phrase
  {
    const code = ['let V = null, HTML = ""; const $ = () => ({ set innerHTML(v) { HTML = v; } });', morceau(S.vue, 'const maj1 = s => ', '\n'),
      morceau(S.vue, 'function savoirItems() {', '\n}\n'), morceau(S.vue, 'function majResume(r) {', '\n}\n'),
      'this.__m = (VV, r) => { V = VV; HTML = ""; majResume(r); return HTML; };'].join('\n');
    const ctx = { Math, Number, String, Array, Object }; vm.createContext(ctx); vm.runInContext(code, ctx);
    const r = { ecart: -45, sous: 0, budget: 0 };
    const h4 = ctx.__m({ savoir: SV, eco: false }, r), h1 = ctx.__m({ savoir: SV.filter(x => x.cat !== 'retard' && x.cat !== 'contrat'), eco: false }, r),
      h0 = ctx.__m({ savoir: SV.filter(x => x.prio !== 1), eco: false }, r);
    T('C1 « 4 points à anticiper » est un bouton qui mène à eux (data-fn="anticiper"), son nom contient le texte vu',
      h4.includes('<button type="button" class="ck-res-pts" data-fn="anticiper" aria-label="4 points à anticiper, en tête d’« À savoir »">4 points à anticiper</button>.') && h4.startsWith('<b>45 jours de retard</b>, '));
    T('C2 un seul point : le singulier', h1.includes('>1 point à anticiper</button>.'));
    T('C3 rien à anticiper : une phrase, pas de bouton', h0.endsWith('rien à anticiper.') && !h0.includes('<button'));
  }
  // D. le geste
  {
    const a = jouerAller(S, { n: 2, mode: 'eco', taille: 'petit' }), s0 = a.forts[0].appels.find(x => x[0] === 'scroll');
    T('D1 depuis Économie : Terrain d’abord, la première ligne amenée sous les barres (« start »), en douceur',
      a.modes.join() === 'terrain' && s0 && s0[1].block === 'start' && s0[1].behavior === 'smooth');
    T('D2 le doigt y est posé (focus sans saut) et les points respirent', a.forts[0].att.tabindex === '-1' && a.forts[0].appels.some(x => x[0] === 'focus' && x[1].preventScroll)
      && a.forts.every(f => f.a.has('signal') && f.ecout === 1));
    const b = jouerAller(S, { n: 7, mode: 'terrain', taille: 'large' }), s1 = b.forts[0].appels.find(x => x[0] === 'scroll');
    T('D3 plus de cinq points : la liste se déplie (« Replier », aria-expanded), sur ordinateur au plus court (« nearest »)',
      b.liste.a.has('tout') && b.S.svTout === true && b.bouton.textContent === 'Replier' && b.bouton.att['aria-expanded'] === 'true' && s1 && s1[1].block === 'nearest' && b.modes.length === 0);
    const c = jouerAller(S, { n: 3, mode: 'terrain', taille: 'petit', reduit: true }), s2 = c.forts[0].appels.find(x => x[0] === 'scroll');
    T('D4 en animations réduites : ni douceur ni respiration', s2 && s2[1].behavior === 'auto' && c.forts.every(f => !f.a.has('signal')));
    const d = jouerAller(S, { n: 0, mode: 'terrain', taille: 'petit' });
    T('D5 rien à montrer : le geste le trace, il ne se tait pas', d.journal.length === 1 && /anticiper/.test(d.journal[0].msg));
    T('D6 l’écouteur de la page appelle le geste', vueNu.includes("if (fn && fn.dataset.fn === 'anticiper') { allerAnticiper(); return; }"));
  }
  // E. la feuille
  {
    const i = S.css.indexOf('★ ANTICIPE-1 (§420)'), j = S.css.indexOf('@media (hover:hover){.ck2 .ck-res-pts:hover', i), bloc = i > 0 && j > i ? sansComCss(S.css.slice(S.css.lastIndexOf('/*', i), S.css.indexOf('}}', j) + 2)) : '';
    T('E1 le bloc ANTICIPE-1 est dans la feuille, juste après les lignes d’« À savoir »', !!bloc && i > S.css.indexOf('.ck-sv-l:not(.tout) .ck-sv:nth-child(n+6){display:none}') && i < S.css.indexOf('TETE-2 (§329) a donné au Pilotage'));
    const sels = [...bloc.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].trim()).filter(s => !s.startsWith('@'));
    T('E2 chaque règle est bornée au cockpit d’Aujourd’hui (.ck2) : le cockpit de secours garde ses lignes', sels.length >= 7 && sels.every(s => s.startsWith('.ck2 ')));
    T('E3 rien d’écrit en dur (ni couleur, ni taille hors des pas) et l’anneau de focus commun jamais éteint', !/#[0-9a-fA-F]{3,8}\b|rgba?\(|font-size\s*:\s*\d|outline\s*:\s*none/.test(bloc) && bloc.includes('font-size:var(--pt-nano,11px)'));
    T('E4 le marquage : surligné à la couleur « attention » (l’or est neutre dans .ck2), étiquette en mot, la phrase en lien ; la respiration sur une animation qui existe',
      /\.ck2 \.ck-sv\.fort\{[^}]*background:var\(--attention-doux\)[^}]*scroll-margin-top:var\(--ck-colle,16px\)/.test(bloc) && bloc.includes('.ck2 .ck-sv-k{') && !/--or(-pale|-tx)?\b/.test(bloc)
      && /\.ck2 \.ck-res-pts\{[^}]*font:inherit[^}]*text-decoration:underline/.test(bloc) && bloc.includes('.ck2 .ck-sv.signal{animation:hpc-pouls ') && S.css.includes('@keyframes hpc-pouls{'));
  }
  // F. les absences
  {
    const lignes = morceau(S.pil, '  var absVus=', "(absListe||'Toute l\\u2019équipe est là');");
    const tuile = (abs, repos, jEff) => { const ctx = { abs, repos, jEff, jNom: 'jeudi' }; vm.createContext(ctx); vm.runInContext(lignes + '\nthis.__t = absTxt;', ctx); return ctx.__t; };
    const g = (nom, motif) => ({ nom, motif: motif || '' });
    const t1 = tuile([g('Inès'), g('Sophie')], false, null), t2 = tuile([g('Hugo', 'en congé')], false, null), t3 = tuile([g('Inès'), g('Hugo', 'en congé'), g('Léa')], false, null), t8 = tuile([g('Hugo', 'en congé'), g('Léa', 'en arrêt')], false, null);
    const t4 = tuile([g('Inès'), g('Sophie')], true, new Date()), t5 = tuile([], true, new Date()), t6 = tuile([], false, null), t7 = tuile([g('Hugo', 'en congé')], true, new Date());
    T('F1 la tuile : « Absences : Inès, Sophie » — plus d’adjectif à accorder', t1 === 'Absences\u00a0: Inès, Sophie');
    T('F2 un motif connu reste derrière le nom, comme avant (« Hugo en congé ») ; un nom sans motif amène le mot en tête ; au-delà de deux, « et 1 autre »', t2 === 'Hugo en congé' && t8 === 'Hugo en congé, Léa en arrêt' && t3 === 'Absences\u00a0: Inès, Hugo en congé et 1 autre');
    T('F3 un jour de repos : jamais deux « : » de suite, et la phrase d’avant quand les motifs sont connus', t4 === 'Repos aujourd\u2019hui \u00b7 jeudi, absences\u00a0: Inès, Sophie' && t5 === 'Repos aujourd\u2019hui \u00b7 jeudi : toute l\u2019équipe' && t6 === 'Toute l\u2019équipe est là' && t7 === 'Repos aujourd\u2019hui \u00b7 jeudi : Hugo en congé');
    T('F4 « absent » n’est plus un motif, et la légende des avatars suit', pilNu.includes("var LIB={ cp:'en congé', recup:'en récupération', maladie:'en arrêt', absent:'' };")
      && pilNu.includes("(abs.length?', '+(absPref&&!repos?absTxt.charAt(0).toLowerCase()+absTxt.slice(1):absTxt):'')") && ![t1, t2, t3, t4, t7, t8].some(x => / absent\b/.test(x)));
    T('F5 la bulle d’un avatar absent : « Absence : Inès », un motif connu derrière le nom', vueNu.includes("esc(g.absent ? (g.motif ? g.p + ' ' + g.motif : 'Absence\\u00a0: ' + g.p) : g.p)") && !vueNu.includes("(g.motif || 'absent')"));
    const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
    ctx.window = ctx; vm.createContext(ctx); vm.runInContext(S.ck, ctx);
    const t0 = new Date(), d1 = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + 1), j = { [d1.getFullYear()]: { [d1.getMonth()]: { [d1.getDate()]: { absent: true } } } };
    const ab = ctx._ckSvAbsences([{ nom: 'Inès' }, { nom: 'Sophie' }, { nom: 'Hugo' }, { nom: 'Émile' }], { Inès: j, Sophie: j, Hugo: j, Émile: j }, e => ({ etat: e && e.absent ? 'absent' : 'present', motif: '' }), t0);
    const ti = n => (ab.find(x => x.titre.endsWith(n)) || {}).titre;
    T('F6 « À savoir » : l’élision devant une voyelle ou un h (« Absence d’Inès », « d’Hugo », « d’Émile »), « de » sinon',
      ab.length === 4 && ti('Inès') === 'Absence d\u2019Inès' && ti('Hugo') === 'Absence d\u2019Hugo' && ti('Émile') === 'Absence d\u2019Émile' && ti('Sophie') === 'Absence de Sophie' && ckNu.includes("'Absence ' + _ckDe(m.nom)"));
  }
  // G. l'accompagnement
  T('G1 la fiche MV_AIDE du Pilotage dit la phrase touchable et les points en tête', S.uti.includes('les points à anticiper — touchez-les pour y aller')
    && S.uti.includes('les <b>points à anticiper</b> y viennent en tête, surlignés et marqués « À anticiper »'));
  T('G2 le guide dit la même chose', S.guide.includes("et les points à anticiper — touchez-les pour y aller") && S.guide.includes('y viennent en tête, surlignés et marqués « À anticiper »'));
  T('G3 la nouveauté 9.80 : pastille sur « À savoir », pour l’admin ; la correction des absences au Journal',
    /\{ v: '9\.80', d: '2026-10-21', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-savoir'/.test(S.uti) && /\{ niv: 0, pour: \['admin'\], emoji: 'equipe', titre: 'Les absences s’écrivent sans faute d’accord'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0; res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' — ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le tri retiré', 'vue', 'return L.filter(x => x.prio === 1).concat(L.filter(x => x.prio !== 1));', 'return L;'],
    ['l’étiquette retirée', 'vue', `(x.prio === 1 ? '<span class="ck-sv-k">À anticiper</span>' : '')`, `''`],
    ['la phrase redevient du texte', 'vue', `(n ? '<button type="button" class="ck-res-pts" data-fn="anticiper" aria-label="' + pts + ', en tête d’« À savoir »">' + pts + '</button>.' : 'rien à anticiper.')`, `(n ? pts + '.' : 'rien à anticiper.')`],
    ['le geste débranché', 'vue', "    if (fn && fn.dataset.fn === 'anticiper') { allerAnticiper(); return; }", ''],
    ['Économie gardée', 'vue', "  if (S.mode !== 'terrain') { choisirMode('terrain'); }", ''],
    ['plus de cinq points restent cachés', 'vue', 'if (forts.length > 5 && !l.classList', 'if (forts.length > 50 && !l.classList'],
    ['les animations réduites ignorées', 'vue', "if (!reduit()) forts.forEach(li =>", 'if (true) forts.forEach(li =>'],
    ['le téléphone amené « au plus court »', 'vue', "block: petit ? 'start' : 'nearest'", "block: 'nearest'"],
    ['rien à montrer, en silence', 'vue', "if (window.logError) window.logError({ level: 'info', cat: 'cockpit', msg: 'anticiper : aucune ligne à montrer' }); return;", 'return;'],
    ['le bloc qui déborde sur le cockpit de secours', 'css', '.ck2 .ck-sv.fort{margin:', '.ck-sv.fort{margin:'],
    ['l’anneau de focus éteint', 'css', '.ck2 .ck-sv.signal{animation:hpc-pouls 1.2s var(--mv-sortie) 2}', '.ck2 .ck-sv.signal{animation:hpc-pouls 1.2s var(--mv-sortie) 2}\n.ck2 .ck-res-pts:focus-visible{outline:none}'],
    ['l’or neutre du cockpit (le gris)', 'css', 'border-radius:var(--ck-r-md);background:var(--attention-doux);box-shadow:none;', 'border-radius:var(--ck-r-md);background:var(--or-pale);box-shadow:none;'],
    ['une couleur écrite en dur', 'css', '.ck2 .ck-sv.fort{margin:0 calc(-1 * var(--e-3,12px));padding:var(--e-3,12px);border-radius:var(--ck-r-md);background:var(--attention-doux);', '.ck2 .ck-sv.fort{margin:0 calc(-1 * var(--e-3,12px));padding:var(--e-3,12px);border-radius:var(--ck-r-md);background:#FAF3E0;'],
    ['« absent » revenu dans la tuile', 'pil', "maladie:'en arrêt', absent:'' };", "maladie:'en arrêt', absent:'absent' };"],
    ['le mot « Absences » retiré', 'pil', "(absPref?(abs.length>1?'Absences':'Absence')+'\\u00a0: '+absNoms:absNoms)", 'absNoms'],
    ['le préfixe posé même quand les motifs sont connus', 'pil', "absPref=absVus.some(function(g){ return !g.motif; });", 'absPref=true;'],
    ['le double deux-points du repos', 'pil', "(absPref?', '+absListe.charAt(0).toLowerCase()+absListe.slice(1):' : '+(absListe||'toute l\\u2019équipe'))", "' : '+(absListe||'toute l\\u2019équipe')"],
    ['« Absence de Inès » revenu', 'ck', "'Absence ' + _ckDe(m.nom)", "'Absence de ' + m.nom"],
    ['la bulle « i » sans l’ordre', 'vue', 'En tête, surlignés et marqués « À anticiper », ', ''],
    ['l’avatar au masculin', 'vue', "'Absence\\u00a0: ' + g.p", "g.p + ', absent'"],
    ['le guide pas à jour', 'guide', ' — touchez-les pour y aller', ''],
  ];
  let m = 0; DEF.forEach(([nom, f, a, b]) => { const S = Object.assign({}, SRC0); if (S[f].split(a).length !== 2) { console.log('  ??  ' + nom + ' — motif introuvable ou multiple'); m++; return; } S[f] = S[f].replace(a, b); const rouge = jouer(S).some(x => !x[1]); if (!rouge) m++; console.log((rouge ? '  ok  ' : '  KO  ') + nom + (rouge ? ' → rougit' : ' → reste vert')); });
  console.log('\n' + (m ? 'CONTRE-ÉPREUVES ROUGES ' + m : 'CONTRE-ÉPREUVES VERTES') + ' — ' + DEF.length + ' défauts réinjectés'); process.exit(ko || m ? 1 : 0);
}
process.exit(ko ? 1 : 0);
