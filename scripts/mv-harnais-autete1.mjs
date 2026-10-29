#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — AUJ-TETE-1 (§454) : LA TÊTE D'AUJOURD'HUI — LA BASCULE EN HAUT À DROITE DU CADRE, LA PHRASE SUR TOUTE LA
   LIGNE, CHAQUE CHIFFRE AVEC SA RÉFÉRENCE, LA CAMPAGNE LUE SOUS LA DATE
   Lancer : node scripts/mv-harnais-autete1.mjs           → doit être vert
            node scripts/mv-harnais-autete1.mjs --contre  → chaque défaut réinjecté doit rougir

   ══ POURQUOI ══
   Nico (23/10), sur une capture d'Aujourd'hui : « 45 jours de retard par rapport à quoi ? 5 210 € au-dessus du budget par
   rapport à quoi ? Depuis quand ? », « que ça prenne la ligne », et la bascule Terrain · Cave · Économie « en haut à droite du
   cadre Aujourd'hui ». Maquette validée (« go »), adaptée à la barre « Vous regardez » (PIL-RANGE-2a) et aux jours
   travaillés au planning (PIL-FIX-1), parus entre-temps.

   ══ CE QU'IL TIENT ══ (les fonctions sont EXÉCUTÉES sur les vrais fichiers)
     A. pilotage.js/_pilCk2Per : la campagne que lit Aujourd'hui (_pilSaison), ses dates avec les mots de la barre
        (_pilPorteeBornes), la piste seulement dedans, « meme » quand la barre montre déjà cette campagne ; branché au modèle.
     B. cockpit-vue.js/majResume : sous chaque chiffre, sa référence (fin prévue et objectif ; coût à la fin et budget), le
        trait selon l'état, le « i » ; pluriels ; sans objectif posé ni économie ; la ponctuation collée aux boutons.
     C. htmlTete : la date, la campagne lue (nom échappé, dates déjà échappées, piste), la phrase.
     D. htmlCadreTete / htmlBascule : le nom du cadre, la bascule (le point de la Cave accroché au mot), la roue si #pil-gear.
     E. Le squelette, le montage, les gestes (allerFin, allerBudget, la roue) — allerFin et allerBudget EXÉCUTÉS.
     F. calerRefs, sur de fausses boîtes : la référence suivante se décale quand la précédente déborde, pas autrement.
     G. ouvrirInfo et les deux fiches : un titre et des paragraphes ; les fiches d'une phrase inchangées.
     H. La feuille : le bloc borné à .ck2 (sauf la sous-ligne masquée), jetons, pas de l'échelle, téléphone, la règle « meme »
        alignée sur la barre (701 px).
     I. L'accompagnement : MV_AIDE, le guide, la nouveauté (exécutée), sw.js, la liste des harnais.
   ⚠️ Il ne regarde pas un écran : le rendu se regarde au lot (§454, captures du vrai écran).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { vue: L('src/cockpit-vue.js'), pil: L('src/pilotage.js'), css: L('src/styles.css'), uti: (L('src/utils.js') + '\n' + L('src/whats-new.js')),
  guide: L('guide/11-pilotage.html'), sw: L('public/sw.js'), liste: L('scripts/mv-harnais-liste.mjs') };
const morceau = (src, debut, fin) => { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); const j = src.indexOf(fin, i); if (j < 0) throw new Error('fin introuvable : ' + fin); return src.slice(i, j + fin.length); };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
const sansComCss = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const compte = (s, re) => (s.match(re) || []).length;
const J = (a, m, j) => new Date(Date.UTC(a, m - 1, j));
const equilibre = h => compte(h, /<span/g) === compte(h, /<\/span>/g) && compte(h, /<button/g) === compte(h, /<\/button>/g) && compte(h, /<b /g) + compte(h, /<b>/g) === compte(h, /<\/b>/g) && !/undefined|NaN|null/.test(h);
const pts = n => Array.from({ length: n }, (_, k) => ({ cat: 'retard', prio: 1, quand: 'Fenêtre passée', titre: 'Tâche ' + k + ' en retard' }));
const CAVE = { lien: '1 cuve demande un contrôle en cave', lienAlerte: false, pt: 'attention' };

function vueBac(S) {
  const code = ['let V = null, VISEE = null, HTML = "", GEAR = false;',
    'const document = { getElementById: id => (id === "pil-gear" && GEAR) ? {} : null };',
    'const $ = s => (s === "#ck-resume" ? { set innerHTML(v) { HTML = v; } } : null); const $$ = () => [];',
    morceau(S.vue, 'const NF0 = ', '\n'), morceau(S.vue, 'const nb = ', '\n'), morceau(S.vue, 'const esc = s => ', '\n'), morceau(S.vue, 'const maj1 = s => ', '\n'),
    morceau(S.vue, 'const MOIS_L = ', '\n'), morceau(S.vue, 'const jourN = ', '\n'), morceau(S.vue, 'const dLong = ', '\n'),
    morceau(S.vue, 'const eur = v => ', '\n'), morceau(S.vue, 'const btnI = ', '\n'),
    'const ICO = { feuille: "<svg f></svg>", cave: "<svg c></svg>", euro: "<svg e></svg>" }; const cvIc = n => "<svg " + n + "></svg>";',
    morceau(S.vue, 'function savoirItems() {', '\n}\n'),
    morceau(S.vue, 'function htmlCadreTete() {', '\n}\n'), morceau(S.vue, 'function htmlBascule() {', '\n}\n'), morceau(S.vue, 'function htmlTete() {', '\n}\n'),
    morceau(S.vue, 'const refChiffre = ', "join('') + '</span>';\n"), morceau(S.vue, 'function majResume(r) {', '\n}\n'),
    'function calerRefs() {}',
    'this.__res = (VV, vis, r) => { V = VV; VISEE = vis; HTML = ""; majResume(r); return HTML; };',
    'this.__tete = VV => { V = VV; return htmlTete(); };',
    'this.__cadre = (VV, g) => { V = VV; GEAR = !!g; return htmlCadreTete(); };', 'this.__eur = eur;'].join('\n');
  const ctx = { Math, Number, String, Array, Object, JSON, Intl, Date }; vm.createContext(ctx); vm.runInContext(code, ctx); return ctx;
}
function perBac(S, sa, camp, auj) {
  const code = ['var window = { _pilSaison: () => SA }; var _PIL_SCOPE = { camp: CAMP }; function _pilAnAuj(){ return AUJ; }',
    morceau(S.pil, 'function _pilEsc(s){', '\n'), morceau(S.pil, 'function _pilDfr(s){', '\n'), morceau(S.pil, 'function _pilAnnOrd(y){', '\n'),
    morceau(S.pil, 'function _pilPorteeBornes(d0,d1){', '\n}\n'), morceau(S.pil, 'function _pilCk2Per(){', '\n}\n'),
    'this.__per = _pilCk2Per(); this.__bornes = _pilPorteeBornes;'].join('\n');
  const ctx = { Math, Number, String, Date, isNaN, SA: sa, CAMP: camp, AUJ: auj }; vm.createContext(ctx); vm.runInContext(code, ctx); return ctx;
}
function jouerAller(S, nom, sc) {
  const appels = [], modes = [], el = id => ({ id, scrollIntoView: a => appels.push([id, a]) });
  const ctx = { S: { mode: sc.mode }, V: { eco: sc.eco }, reduit: () => !!sc.reduit, requestAnimationFrame: f => f(),
    choisirMode: m => { modes.push(m); ctx.S.mode = m; }, $: s => (s === '#ck-verdict' || s === '#ck-ever' ? el(s) : null) };
  vm.createContext(ctx); vm.runInContext(morceau(S.vue, 'function ' + nom + '() {', '\n}\n') + '\n' + nom + '();', ctx); return { appels, modes };
}
function jouerCaler(S, figs) {
  const boite = r => ({ getBoundingClientRect: () => r });
  const F = figs.map(f => { const cap = { style: { marginLeft: f.avant || '' }, children: f.fins.map(x => boite({ right: x })) };
    return { cap, querySelector: s => (s === '.ck-fig-l' ? boite({ top: f.top, left: f.left }) : s === '.ck-cap' ? cap : null) }; });
  const ctx = { Math, Array, $$: () => F }; vm.createContext(ctx); vm.runInContext(morceau(S.vue, 'function calerRefs() {', '\n}\n') + '\ncalerRefs();', ctx);
  return F.map(f => f.cap.style.marginLeft);
}

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const vueNu = sansCom(S.vue), pilNu = sansCom(S.pil);
  // A. la campagne que lit Aujourd'hui
  {
    const SA = { nom: 'Hiver 2026–2027', debut: '2026-10-05', fin: '2027-03-05' };
    const a = perBac(S, SA, null, '2026-10-23'), p = a.__per;
    T('A1 le nom et les dates de la campagne lue, avec les mots de la barre (« du 5 oct. au 5 mars · 19ᵉ jour sur 152 »)',
      p && p.nom === 'Hiver 2026–2027' && p.bornesHtml === a.__bornes('2026-10-05', '2027-03-05') && p.bornesHtml === 'du 5 oct. au 5 mars \u00b7 19\u1d49 jour sur 152');
    T('A2 la piste : la part écoulée, dedans (19 / 152 = 12,5 %)', p.pct === 12.5 && p.meme === false);
    T('A3 la barre regarde déjà cette campagne : « meme »', perBac(S, SA, 'Hiver 2026–2027', '2026-10-23').__per.meme === true);
    const autre = perBac(S, SA, 'Printemps 2027', '2026-10-23').__per;
    T('A4 la barre sur une autre campagne : Aujourd’hui garde la sienne (_pilSaison), sans « meme »', autre.nom === 'Hiver 2026–2027' && autre.meme === false);
    const av = perBac(S, SA, null, '2026-10-01').__per, ap = perBac(S, SA, null, '2027-04-01').__per;
    T('A5 à venir ou terminée : les mots de la barre, pas de piste', /à venir/.test(av.bornesHtml) && av.pct === null && /terminé/.test(ap.bornesHtml) && ap.pct === null);
    T('A6 sans campagne : rien ; sans dates : le nom seul', perBac(S, null, null, '2026-10-23').__per === null
      && (x => x.nom === 'Hiver' && x.bornesHtml === '' && x.pct === null)(perBac(S, { nom: 'Hiver' }, null, '2026-10-23').__per));
    T('A7 branché au modèle, par typeof (les harnais qui extraient le modèle seul ne l’ont pas)', pilNu.includes("_ckV.per=(typeof _pilCk2Per==='function')?_pilCk2Per():null;"));
  }
  // B. la phrase et ses références
  {
    const c = vueBac(S), V0 = { savoir: pts(3), eco: true, objectif: '2027-03-05', cave: CAVE }, vis = J(2027, 3, 5);
    const r0 = { ecart: -45, fin: J(2027, 5, 7), sous: -5210, budget: 52400, att: 57610 };
    const h = c.__res(V0, vis, r0), eur = c.__eur;
    T('B1 le retard : un bouton qui mène à la fin prévue, décrit par sa référence (fin prévue, objectif, « i »), trait rouge',
      h.startsWith('<span class="ck-fig"><span class="ck-fig-l"><button type="button" class="ck-fig-t" data-fn="allerFin" aria-describedby="ck-cap-t">45 jours de retard</button>,</span><span class="ck-cap ko" id="ck-cap-t">')
      && h.includes('<span class="ck-cap-k">Fin prévue</span><b class="ck-cap-v">7\u00a0mai</b><button class="ck-i" type="button" data-info="resTemps"')
      && h.includes('<span class="ck-cap-k">Objectif</span><b class="ck-cap-v">5\u00a0mars</b><span></span></span></span>'));
    T('B2 l’écart au budget : un bouton vers Économie, sa référence (coût à la fin, budget, « i »), trait rouge',
      h.includes('data-fn="allerBudget" aria-describedby="ck-cap-b">' + eur(5210) + ' au-dessus du budget</button>,</span><span class="ck-cap ko" id="ck-cap-b">')
      && h.includes('<span class="ck-cap-k">Coût à la fin</span><b class="ck-cap-v">' + eur(57610) + '</b><button class="ck-i" type="button" data-info="resBudget"')
      && h.includes('<span class="ck-cap-k">Budget</span><b class="ck-cap-v">' + eur(52400) + '</b>'));
    const hok = c.__res(V0, vis, { ecart: 6, fin: J(2027, 2, 25), sous: 1840, budget: 52400, att: 50560 });
    T('B3 en avance et sous le budget : les mots, et le trait vert', hok.includes('>6 jours d’avance</button>') && hok.includes('<span class="ck-cap ok" id="ck-cap-t">')
      && hok.includes('>' + eur(1840) + ' sous le budget</button>') && hok.includes('<span class="ck-cap ok" id="ck-cap-b">') && hok.includes('25\u00a0février'));
    T('B4 un seul jour : le singulier, en retard comme en avance', c.__res(V0, vis, Object.assign({}, r0, { ecart: -1 })).includes('>1 jour de retard</button>')
      && c.__res(V0, vis, Object.assign({}, r0, { ecart: 1 })).includes('>1 jour d’avance</button>'));
    const hp = c.__res(V0, vis, { ecart: 0, fin: J(2027, 3, 5), sous: 0, budget: 52400, att: 52400 });
    T('B5 pile : « Pile à l’heure », « pile dans le budget », le trait neutre', hp.includes('>Pile à l’heure</button>') && hp.includes('<span class="ck-cap" id="ck-cap-t">')
      && hp.includes('>pile dans le budget</button>') && hp.includes('<span class="ck-cap" id="ck-cap-b">'));
    const hso = c.__res(Object.assign({}, V0, { objectif: null }), J(2026, 12, 22), r0);
    T('B6 sans objectif posé : la fin prévue seule (le repère à 60 jours ne s’écrit pas)', hso.includes('Fin prévue') && !hso.includes('Objectif'));
    const hse = c.__res(Object.assign({}, V0, { eco: false }), vis, r0), hsb = c.__res(V0, vis, Object.assign({}, r0, { budget: 0 }));
    T('B7 sans économie (ou sans budget) : ni l’écart, ni sa référence', !hse.includes('ck-cap-b') && !hse.includes('allerBudget') && !hsb.includes('ck-cap-b'));
    T('B8 les points et la cave gardent leur ponctuation (« , et » ne part plus seul en tête de ligne)',
      h.includes(' <span class="ck-tient"><button type="button" class="ck-res-pts" data-fn="anticiper" aria-label="3 points à anticiper, en tête d’« À savoir »">3 points à anticiper</button>,</span> et <span class="ck-tient"><button type="button" class="ck-res-pts ck-res-cave" data-fn="cave"')
      && h.endsWith('1 cuve demande un contrôle en cave</button>.</span>'));
    const h1 = c.__res(Object.assign({}, V0, { savoir: pts(1), cave: null }), vis, r0), h0c = c.__res(Object.assign({}, V0, { savoir: [] }), vis, r0), h00 = c.__res(Object.assign({}, V0, { savoir: [], cave: null }), vis, r0);
    T('B9 un point sans cave ; aucun point avec ou sans cave', h1.endsWith('>1 point à anticiper</button>.</span>') && h0c.includes('rien à anticiper, et <span class="ck-tient"><button')
      && h00.endsWith(' rien à anticiper.') && !h00.includes('ck-tient'));
    T('B10 des phrases bien formées : balises équilibrées, ni undefined, ni NaN, ni null', [h, hok, hp, hso, hse, hsb, h1, h0c, h00].every(equilibre));
  }
  // C. la tête
  {
    const c = vueBac(S), base = { dateTxt: 'Vendredi 23 octobre, semaine 43' };
    const per = { nom: 'Hiver 2026–2027', bornesHtml: 'du 5 oct. au 5 mars \u00b7 19\u1d49 jour sur 152', pct: 12.5, meme: false };
    const t = c.__tete(Object.assign({}, base, { per }));
    T('C1 la date, puis la campagne lue : son nom, ses dates (déjà échappées), sa piste ; puis la phrase',
      t === '<p class="ck-tete-ctx"><span class="ck-tete-date">Vendredi 23 octobre, semaine 43</span><span class="ck-tete-sep" aria-hidden="true"></span><span class="ck-per"><span class="ck-per-nom">Hiver 2026–2027</span><span class="ck-per-d"><span>du 5 oct. au 5 mars \u00b7 19\u1d49 jour sur 152</span><span class="ck-per-piste" aria-hidden="true"><i style="width:12.5%"></i></span></span></span></p><p class="ck-tete-res" id="ck-resume" aria-live="polite"></p>');
    T('C2 la barre montre déjà cette campagne : la marque « meme »', c.__tete(Object.assign({}, base, { per: Object.assign({}, per, { meme: true }) })).includes('<span class="ck-per meme">'));
    const t3 = c.__tete(Object.assign({}, base, { per: Object.assign({}, per, { pct: null }) })), t4 = c.__tete(Object.assign({}, base, { per: Object.assign({}, per, { bornesHtml: '' }) }));
    T('C3 sans piste hors de la campagne ; sans dates, le nom seul', !t3.includes('ck-per-piste') && t3.includes('19\u1d49 jour') && !t4.includes('ck-per-d') && t4.includes('Hiver 2026–2027'));
    const t5 = c.__tete(Object.assign({}, base, { per: null }));
    T('C4 sans campagne : la date et la phrase, rien d’autre', !t5.includes('ck-per') && !t5.includes('ck-tete-sep') && t5.includes('id="ck-resume"'));
    T('C5 le nom est échappé', c.__tete(Object.assign({}, base, { per: Object.assign({}, per, { nom: 'Été <b>' }) })).includes('Été &lt;b&gt;'));
  }
  // D. la ligne du cadre
  {
    const c = vueBac(S), V0 = { eco: true, cave: CAVE };
    const d = c.__cadre(V0, true);
    T('D1 le nom du cadre, la bascule (trois vues), la roue « Choisir les indicateurs »', d.startsWith('<span class="ck-cadre-nom">Aujourd’hui</span><div class="ck-bascule" role="tablist"')
      && d.includes('data-mode="terrain"') && d.includes('data-mode="cave"') && d.includes('data-mode="eco"')
      && d.endsWith('<button type="button" class="ck-roue" data-fn="indicateurs" aria-label="Choisir les indicateurs" title="Choisir les indicateurs"><svg engrenage></svg></button>'));
    T('D2 sans #pil-gear (pas de panneau à ouvrir) : pas de roue', !c.__cadre(V0, false).includes('ck-roue'));
    T('D3 le point de la Cave accroché au mot ; sans point, le mot seul', d.includes('<span class="ck-b-lab">Cave<i class="ck-b-pt attention" aria-hidden="true"></i></span></button>')
      && c.__cadre({ eco: true, cave: { pt: '' } }, true).includes('<span class="ck-b-lab">Cave</span></button>'));
    T('D4 ni économie ni cave : pas de bascule', !c.__cadre({ eco: false, cave: null }, true).includes('ck-bascule'));
    T('D5 le motif de CAVEPIL-1 est gardé mot pour mot', S.vue.includes("(V.cave ? '<button type=\"button\" role=\"tab\" data-mode=\"cave\""));
  }
  // E. le squelette, le montage, les gestes
  {
    const sq = morceau(S.vue, 'window._ck2Squelette = function () {', '};');
    T('E1 la ligne du cadre ouvre la page du cockpit, avant la tête', sq.indexOf('<div class="ck-page ck-entree" id="ck-page"> <div class="ck-cadre-tete" id="ck-cadre-tete"></div> <div class="ck-tete" id="ck-tete"></div>') > 0);
    const mo = morceau(vueNu, 'function monter() {', '\n}');
    T('E2 le montage la remplit, avant la tête', mo.indexOf("$('#ck-cadre-tete').innerHTML = htmlCadreTete();") >= 0 && mo.indexOf("$('#ck-cadre-tete').innerHTML") < mo.indexOf("$('#ck-tete').innerHTML = htmlTete();"));
    T('E3 les gestes : le délai, l’écart au budget, la roue (qui touche #pil-gear)', vueNu.includes("if (fn && fn.dataset.fn === 'allerFin') { allerFin(); return; }")
      && vueNu.includes("if (fn && fn.dataset.fn === 'allerBudget') { allerBudget(); return; }")
      && vueNu.includes("if (fn && fn.dataset.fn === 'indicateurs') { const g = document.getElementById('pil-gear'); if (g) g.click(); return; }"));
    const f1 = jouerAller(S, 'allerFin', { mode: 'eco' }), f2 = jouerAller(S, 'allerFin', { mode: 'terrain', reduit: true });
    T('E4 le délai : Terrain d’abord, le verdict amené au plus court, en douceur (sans, en animations réduites)', f1.modes.join() === 'terrain' && f1.appels.length === 1 && f1.appels[0][0] === '#ck-verdict'
      && f1.appels[0][1].block === 'nearest' && f1.appels[0][1].behavior === 'smooth' && f2.modes.length === 0 && f2.appels[0][1].behavior === 'auto');
    const b0 = jouerAller(S, 'allerBudget', { mode: 'terrain', eco: false }), b1 = jouerAller(S, 'allerBudget', { mode: 'terrain', eco: true });
    T('E5 l’écart au budget : rien sans économie ; sinon la vue Économie et son atterrissage', b0.modes.length === 0 && b0.appels.length === 0
      && b1.modes.join() === 'eco' && b1.appels.length === 1 && b1.appels[0][0] === '#ck-ever');
    T('E6 la largeur change : les références se recalent (ranger appelle calerRefs)', /function ranger\(\) \{\n  indiceSeg\(\);\n  calerRefs\(\);/.test(S.vue));
  }
  // F. calerRefs
  {
    T('F1 la référence précédente déborde : la suivante se décale, 20 px d’air (333 + 20 − 310 = 43)', jouerCaler(S, [{ top: 100, left: 160, fins: [300, 333, 240] }, { top: 100, left: 310, fins: [450] }])[1] === '43px');
    T('F2 rien ne déborde : pas de décalage, et l’ancien est effacé', jouerCaler(S, [{ top: 100, left: 160, fins: [302] }, { top: 100, left: 326, fins: [480], avant: '17px' }])[1] === '');
    T('F3 pas sur la même ligne (téléphone) : pas de décalage', jouerCaler(S, [{ top: 100, left: 40, fins: [333] }, { top: 160, left: 40, fins: [250] }])[1] === '');
  }
  // G. la bulle et les deux fiches
  {
    const appels = [];
    const code = [morceau(S.vue, 'const esc = s => ', '\n'), morceau(S.vue, 'const INFO = {', '\n};\n'), morceau(S.vue, 'function ouvrirInfo(btn, clavier) {', '\n}\n'),
      'this.__o = k => ouvrirInfo({ dataset: { info: k } }, false); this.__info = INFO;'].join('\n');
    const ctx = { window: { _mvBulleOuvrir: (b, f, o) => appels.push([f, o]) }, String, Array, Object }; vm.createContext(ctx); vm.runInContext(code, ctx);
    ctx.__o('resTemps'); ctx.__o('fin');
    const [ft, ot] = appels[0], [ff] = appels[1];
    T('G1 une fiche à titre : le titre et ses trois paragraphes, raccrochés au même « i »', ft.t === 'Le délai : sur quoi il est compté' && ft.p.length === 3 && ot.sig === '.ck-i[data-info="resTemps"]');
    T('G2 une fiche d’une phrase : comme avant', !ff.t && ff.p.length === 1 && ff.p[0] === ctx.__info.fin);
    const it = ctx.__info.resTemps.p.join(' '), ib = ctx.__info.resBudget.p.join(' ');
    T('G3 le délai : fin prévue (planning, contrats, journées de cave), objectif (et sa valeur par défaut), jours travaillés au planning',
      /^Fin prévue :/.test(ctx.__info.resTemps.p[0]) && /journées de cave/.test(it) && /^Objectif :/.test(ctx.__info.resTemps.p[1]) && /la fin de la campagne/.test(it) && /jours travaillés au planning/.test(it) && !/lundi au vendredi/.test(it));
    T('G4 le budget : tous postes, le coût à la fin, le rythme mesuré dès 40 %, l’écart constaté avant, la validation',
      ctx.__info.resBudget.t === 'L’écart au budget : sur quoi il est compté' && /tous postes compris/.test(ib) && /^Coût à la fin :/.test(ctx.__info.resBudget.p[1]) && /dès 40 %/.test(ib) && /Avant 40 %/.test(ib) && /qu’à sa validation/.test(ib));
  }
  // H. la feuille
  {
    const i = S.css.indexOf('/* ★ FIN CAVEPIL-2 */'), d = S.css.indexOf('★★ AUJ-TETE-1 (§454)'), f = S.css.indexOf('/* ★ FIN AUJ-TETE-1 */');
    const bloc = d > 0 && f > d ? sansComCss(S.css.slice(S.css.lastIndexOf('/*', d), f)) : '';
    T('H1 le bloc AUJ-TETE-1 suit celui de CAVEPIL-2', !!bloc && i > 0 && i < d);
    const sels = [...bloc.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].trim()).filter(s => !s.startsWith('@')).flatMap(s => s.split(',').map(x => x.trim()));
    T('H2 la sous-ligne du Pilotage masquée seulement quand la ligne du cadre est là', bloc.includes('#page-pilotage:has(#ck-cadre-tete) .pil-souslig{display:none}'));
    T('H3 tout le reste est borné au cockpit (.ck2)', sels.length >= 30 && sels.filter(s => !s.startsWith('.ck2 ')).join() === '#page-pilotage:has(#ck-cadre-tete) .pil-souslig');
    const horsVar = bloc.replace(/var\([^()]*\)/g, '');
    const esp = (bloc.match(/(?:padding|margin|gap)(?:-[a-z]+)?:[^;}]*/g) || []).flatMap(x => (x.match(/(\d+)px/g) || []).map(v => parseInt(v)));
    T('H4 jetons seulement : ni couleur en dur, ni taille de texte hors des pas, espacements sur l’échelle', !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(horsVar) && !/font-size\s*:\s*\d/.test(bloc)
      && esp.length > 0 && esp.every(v => [2, 4, 8, 12, 16, 20, 24, 32, 40].includes(v)));
    T('H5 le téléphone : le nom du cadre s’efface, la bascule prend la ligne, la campagne passe à la ligne',
      /@media \(max-width:699px\)\{[^@]*\.ck2 \.ck-cadre-nom\{display:none\}[^@]*\.ck2 \.ck-cadre-tete \.ck-bascule\{flex:1\}[^@]*\.ck2 \.ck-per\{flex-basis:100%\}/.test(bloc));
    T('H6 la ligne de repère ne répète pas la barre là où la barre montre ses dates (dès 701 px, la barre les cache à 700)',
      bloc.includes('@media (min-width:701px){.ck2 .ck-per.meme .ck-per-d{display:none}}') && /@media\(max-width:700px\)\{[^}]*\}*[\s\S]{0,900}\.pil-ptlab,\.pil-ptbornes\{display:none\}/.test(S.pil));
    T('H7 la ponctuation collée, le texte d’un bouton libre ; le trait rouge ou vert', bloc.includes('.ck2 .ck-fig-l,.ck2 .ck-tient{white-space:nowrap}') && bloc.includes('.ck2 .ck-tient>.ck-res-pts{white-space:normal}')
      && bloc.includes('.ck2 .ck-cap.ko::before{background:var(--danger)}') && bloc.includes('.ck2 .ck-cap.ok::before{background:var(--ok)}'));
  }
  // I. l'accompagnement
  {
    T('I1 la fiche MV_AIDE du Pilotage : la bascule en haut à droite, les références, l’exception d’Aujourd’hui',
      S.uti.includes('en haut à droite du cadre, la bascule <b>Terrain · Cave · Économie</b>') && S.uti.includes('le <b>coût à la fin</b> et le <b>budget</b> sous l’écart au budget')
      && S.uti.includes('<b>Aujourd’hui</b> fait exception : il lit toujours la campagne en cours') && S.uti.includes("['La vue Cave', \": la bascule, en haut à droite du cadre, passe à trois vues"));
    T('I2 le guide : la campagne lue, les références, Aujourd’hui parmi les écrans qui gardent leur cadre, l’atterrissage juste',
      S.guide.includes('la campagne que lisent les chiffres de la page') && S.guide.includes('le <b>coût à la fin</b> et le <b>budget</b> sous l\'écart au budget')
      && S.guide.includes("<b>Aujourd'hui</b> lit toujours la campagne en cours") && S.guide.includes("corrigé de la cadence mesurée de l'équipe dès 40 % du travail fait") && !S.guide.includes(', à la cadence\n  mesurée de l\'équipe.'));
    const iw = S.uti.indexOf('export const WHATS_NEW = ['), jw = S.uti.indexOf('\n];', iw);
    const WN = vm.runInNewContext('(' + S.uti.slice(S.uti.indexOf('[', iw), jw + 2) + ')'), APP = (S.uti.match(/export const APP_VERSION = '([^']+)'/) || [])[1], w = WN.find(b => b.v === '10.10') || {};   // GABARIT-1 (§455) : lue à sa version — un lot suivant prépend la sienne
    T('I3 la nouveauté (exécutée) de la version 10.10 : pour l’admin, pastille sur la phrase', !!APP && Array.isArray(w.items) && w.items.length === 1 && w.items[0].niv === 1
      && w.items[0].pour.join() === 'admin' && w.items[0].cible === '#ck-resume' && /par rapport à quoi/.test(w.items[0].titre));
    const vsw = (S.sw.match(/^\/\/ MA VIGNE — Service Worker v([0-9.]+)/) || [])[1];
    T('I4 sw.js : une seule version partout, et la ligne du lot', vsw && S.sw.includes("const CACHE_NAME   = 'mavigne-v" + vsw + "';") && compte(S.sw, new RegExp('Ma Vigne v' + vsw.replace('.', '\\.') + ' (installé|activé)', 'g')) === 2
      && S.sw.split('\n').slice(1, 80).some(l => /^\/\/ v10\.91 .*AUJ-TETE-1 \(§454\)/.test(l)));   // GABARIT-1 (§455) : la ligne du lot, plus forcément la première. COMPT-5 (§487) : chaque lot ajoute une ligne en tête — la fenêtre passe de 30 à 80 lignes
    T('I5 ce harnais est dans la chaîne, avec ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-autete1.mjs']") && S.liste.includes("['node scripts/mv-harnais-autete1.mjs --contre']"));
  }
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0; res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' — ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la référence du délai retirée', 'vue', "fig(maj1(temps), 'allerFin', 'ck-cap-t', refT)", "fig(maj1(temps), 'allerFin', 'ck-cap-t', '')"],
    ['l’objectif écrit sans objectif posé', 'vue', ".concat(V.objectif ? [['Objectif', dLong(VISEE)]] : [])", ".concat([['Objectif', dLong(VISEE)]])"],
    ['le pluriel du retard cassé', 'vue', "' jour' + (r.ecart < -1 ? 's' : '') + ' de retard'", "' jours de retard'"],
    ['le trait sans état', 'vue', "refChiffre('ck-cap-t', r.ecart < 0 ? 'ko' : r.ecart > 0 ? 'ok' : '',", "refChiffre('ck-cap-t', '',"],
    ['la ponctuation décollée', 'vue', "const tient = (bt, p) => '<span class=\"ck-tient\">' + bt + p + '</span>';", 'const tient = (bt, p) => bt + p;'],
    ['la bascule redescend sous la phrase', 'vue', "  $('#ck-cadre-tete').innerHTML = htmlCadreTete();", "  void 0;"],
    ['la sous-ligne reste visible', 'css', '#page-pilotage:has(#ck-cadre-tete) .pil-souslig{display:none}\n', ''],
    ['la ligne de repère répète la barre', 'css', '@media (min-width:701px){.ck2 .ck-per.meme .ck-per-d{display:none}}\n', ''],
    ['la marque « meme » jamais posée', 'pil', 'meme:(_PIL_SCOPE.camp===sa.nom)', 'meme:false'],
    ['les dates écrites autrement que la barre', 'pil', 'r.bornesHtml=_pilPorteeBornes(d0,d1);', "r.bornesHtml=d0+' – '+d1;"],
    ['la piste hors de la campagne', 'pil', 'b>=a && o>=a && o<=b) r.pct=', 'b>=a) r.pct='],
    ['calerRefs ne décale plus', 'vue', "if (d > 0) cb.style.marginLeft = d + 'px';", "if (d > 1e9) cb.style.marginLeft = d + 'px';"],
    ['un décalage ancien jamais effacé', 'vue', "F.forEach(f => { const c = f.querySelector('.ck-cap'); if (c) c.style.marginLeft = ''; });", ''],
    ['les fiches à titre ignorées', 'vue', "if (f && typeof f === 'object') {", 'if (false) {'],
    ['le point de la Cave décroché du mot', 'vue', '<span class="ck-b-lab">Cave', 'Cave<span class="ck-b-lab">'],
    ['la roue sans panneau', 'vue', "{ const g = document.getElementById('pil-gear'); if (g) g.click(); return; }", '{ return; }'],
    ['le budget mène nulle part', 'vue', "  if (S.mode !== 'eco') choisirMode('eco');\n  const v = $('#ck-ever');", "  const v = $('#ck-ever');"],
    ['les références figées à la première largeur', 'vue', '  indiceSeg();\n  calerRefs();', '  indiceSeg();'],
    ['l’aide pas à jour', 'uti', '<b>Aujourd’hui</b> fait exception : il lit toujours la campagne en cours, et la nomme sous sa date.', ''],
    ['le guide pas à jour', 'guide', 'la campagne que lisent les chiffres de la page', ''],
    ['l’atterrissage du guide redevenu faux', 'guide', "compté au barème et\n  corrigé de la cadence mesurée de l'équipe dès 40 % du travail fait — avant, l'écart déjà constaté est reporté tel quel.", "à la cadence\n  mesurée de l'équipe."],
    ['une couleur écrite en dur', 'css', '.ck2 .ck-cap.ko::before{background:var(--danger)}', '.ck2 .ck-cap.ko::before{background:#C2381B}'],
  ];
  let m = 0; DEF.forEach(([nom, f, a, b]) => { const S = Object.assign({}, SRC0); if (S[f].split(a).length !== 2) { console.log('  ??  ' + nom + ' — motif introuvable ou multiple'); m++; return; } S[f] = S[f].replace(a, b); const rouge = jouer(S).some(x => !x[1]); if (!rouge) m++; console.log((rouge ? '  mord  ' : '  RATE  ') + nom); });
  console.log('\n' + (m ? 'CONTRE-ÉPREUVES ROUGES ' + m : 'CONTRE-ÉPREUVES VERTES') + ' — ' + DEF.length + ' défauts réinjectés'); process.exit(ko || m ? 1 : 0);
}
process.exit(ko ? 1 : 0);
