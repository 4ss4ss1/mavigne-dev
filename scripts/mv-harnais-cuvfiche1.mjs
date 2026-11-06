// HARNAIS — CUVFICHE-1 (§532) : la fiche d'une cuve au téléphone (fenêtre ovCuveFiche).
//   node scripts/mv-harnais-cuvfiche1.mjs           → doit être vert
//   node scripts/mv-harnais-cuvfiche1.mjs --contre  → chaque défaut réinjecté doit rougir
// Signalé par Nico le 06/11 : une cuve en Pressurage, impossible de la décuver au téléphone — la fiche ne défilait pas
// jusqu'à ses gestes, et « Noter un relevé » s'ouvrait derrière elle. En relisant : Décuver, l'étape, l'opération et la
// fin de FA (feuilles .mvv-ov, z-index 9000) passaient aussi dessous — la fiche est un dialogue (openOv, plancher 9200)
// et _mvOvSync rend inerte tout ce qui est hors du dialogue du dessus.
// Joue les VRAIES fonctions de cuvier.js (_vendBascOuv, _vendFicheTel, _vendFicheHaut, _vendFicheOuverte,
// _vendFicheRafraichir, _vendFicheEtat, _vendFicheRendre, _vendFicheEcarter, _vendFicheRevenir, _vendSheet, _vendSheetClose)
// dans un faux DOM qui tient les classes, le défilement et les listes dépliées (<details data-vf> — un contenu réécrit
// repart en haut, listes repliées, comme dans un vrai navigateur), les minuteurs et les images. Bouchons (dits ici) : la fiche elle-même (_vendFicheHtml, une marque « id|étape »), les courbes, et
// renderVendCuves — qui ne repeint la fiche que si la vraie fonction l'appelle (lu dans son texte).
// Le style qui fait défiler, les trois fenêtres ouvertes par openOv et l'annonce sont lus dans le texte.
// Jamais déployé (scripts/) → aucun bump.
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = {
  cuv: fs.readFileSync('src/cuvier.js', 'utf8'),
  wn: fs.readFileSync('src/whats-new.js', 'utf8'),
};
function bornes(src, nom) {
  const m = [...src.matchAll(new RegExp('^function ' + nom + '\\s*\\(', 'gm'))];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return [m[0].index, j + 1];
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
const FONCTIONS = ['_vendBascOuv', '_vendFicheTel', '_vendFicheHaut', '_vendFicheOuverte', '_vendFicheRafraichir',
  '_vendFicheEtat', '_vendFicheRendre', '_vendFicheEcarter', '_vendFicheRevenir', '_vendSheet', '_vendSheetClose'];

// Un élément : ses classes, son défilement et ses listes dépliées (un contenu réécrit repart en haut, listes repliées).
function El(id, classes) {
  const cl = new Set(classes || []);
  const e = { id, className: '', scrollTop: 0, offsetParent: {}, style: {}, _h: '', _det: [], addEventListener() {},
    classList: { add: (c) => cl.add(c), remove: (c) => cl.delete(c), contains: (c) => cl.has(c) },
    querySelectorAll(q) {
      if (q === 'details[data-vf][open]') return this._det.filter((d) => d.open);
      if (q === 'details[data-vf]') return this._det.slice();
      return [];
    } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) {
    this._h = String(v); this.scrollTop = 0;
    this._det = [...this._h.matchAll(/<details[^>]*data-vf="(\w+)"([^>]*)>/g)].map((m) => ({ cle: m[1], open: / open/.test(m[2]), getAttribute: () => m[1] }));
  } });
  return e;
}

function monde(S) {
  const L = [];
  let code = 'var _vendOuvert = null, _vendFicheAttente = null, _vendSheetSeq = 0;\n';
  for (const f of FONCTIONS) code += fn(S.cuv, f) + '\n';
  const CUVES = [{ id: 'c1', statut: 'fa' }, { id: 'c2', statut: 'mpf' }, { id: 'c3', statut: 'decuvage' }];
  const els = { 'mvv-body': El('mvv-body'), 'cuv-fiche-corps': El('cuv-fiche-corps'),
    ovCuveFiche: El('ovCuveFiche', ['overlay']), ovAutre: El('ovAutre', ['overlay']) };
  const appels = [], minuteurs = [], images = [];
  // La vraie renderVendCuves repeint-elle la fiche, avant les courbes ? (lu dans son texte)
  const RAFRAICHIT = /\n\s*_vendFicheRafraichir\(\);[^\n]*\n\s*_vendPeindreGraphes\(\);/.test(fn(S.cuv, 'renderVendCuves'));
  const ctx = {
    LARGE: false,
    CAVE_VENDANGE: { cuves_vinif: CUVES },
    document: {
      getElementById: (id) => els[id] || null,
      createElement: () => El(''),
      body: { appendChild: (e) => { els[e.id] = e; return e; } },
      querySelector: (q) => (q === '.overlay.open'
        ? (Object.values(els).find((e) => e.classList.contains('overlay') && e.classList.contains('open')) || null) : null),
    },
    _matLarge: () => ctx.LARGE, canWrite: () => true,
    _vendFicheHtml: (c) => '<div class="F">' + c.id + '|' + c.statut + '</div><details class="mvv-histwrap" data-vf="mes"><summary>relevés</summary></details>'
      + '<details class="mvv-histwrap" data-vf="ops"><summary>opérations</summary></details>',
    _vendPeindreGraphes: () => appels.push('peindre'), _vendEnsureSheetCss() {},
    renderVendCuves: () => { appels.push('rendu'); if (RAFRAICHIT) ctx._vendFicheRafraichir(); },
    setTimeout: (f) => { minuteurs.push(f); return minuteurs.length; },
    requestAnimationFrame: (f) => { images.push(f); return images.length; },
  };
  ctx.window = ctx;
  ctx.openOv = (id) => { els[id].classList.add('open'); appels.push('ouvre:' + id); };
  ctx.closeOv = (e, id) => { if (els[id]) els[id].classList.remove('open'); appels.push('ferme:' + id); };
  ctx._mvHistPush = () => appels.push('historique');
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'cuvfiche1-extrait.js' });
  const tic = () => { const l = minuteurs.splice(0); l.forEach((f) => f()); };
  const image = () => { const l = images.splice(0); l.forEach((f) => f()); };
  const ouverte = () => els.ovCuveFiche.classList.contains('open');
  const corps = els['cuv-fiche-corps'];
  return { ctx, els, appels, tic, image, ouverte, corps, CUVES, L };
}

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  const essai = (nom, f) => { try { f(); } catch (e) { t(nom, false, 'plantage : ' + e.message); } };

  /* ══ 1. OUVRIR, REFERMER, ROUVRIR ══ */
  essai('ouvrir', () => {
    const w = monde(S);
    w.ctx._vendBascOuv('c1');
    t('au téléphone, la fiche s’ouvre dans sa fenêtre', w.ouverte() && /F">c1\|fa/.test(w.corps.innerHTML) && w.appels.includes('ouvre:ovCuveFiche'), w.appels.join(' '));
    w.els.ovCuveFiche.classList.remove('open');                       // refermée par le fond, ou par le retour Android
    w.ctx._vendBascOuv('c1');
    t('refermée par le fond ou le retour, elle se rouvre au premier toucher', w.ouverte() && w.ctx._vendOuvert === 'c1', '_vendOuvert=' + w.ctx._vendOuvert);
    w.ctx._vendBascOuv('c1');
    t('ouverte, la retoucher la referme (la croix)', !w.ouverte() && w.ctx._vendOuvert === null && w.appels.includes('ferme:ovCuveFiche'));
  });

  /* ══ 2. UNE FEUILLE .mvv-ov (Décuver, l'étape, l'opération, la fin de FA) ══ */
  essai('feuille', () => {
    const w = monde(S);
    w.ctx._vendBascOuv('c1'); w.corps._det.find((d) => d.cle === 'mes').open = true; w.corps.scrollTop = 420;
    w.ctx._vendSheet('<p>Décuver</p>');
    t('une feuille écarte la fiche (sinon elle passe dessous, inerte)', !w.ouverte() && w.ctx._vendFicheAttente && w.ctx._vendFicheAttente.id === 'c1');
    w.image();
    t('la feuille s’ouvre', w.els['mvv-ov'] && w.els['mvv-ov'].classList.contains('open'));
    w.CUVES[0].statut = 'decuvage';                                    // le geste enregistré
    w.ctx._vendSheetClose();
    t('pendant la fin du geste, la fiche attend', !w.ouverte());
    w.tic();
    t('la feuille fermée, la fiche revient, à jour', w.ouverte() && /F">c1\|decuvage/.test(w.corps.innerHTML), w.corps.innerHTML);
    w.image();
    t('… au même endroit du défilement', w.corps.scrollTop === 420, 'scrollTop=' + w.corps.scrollTop);
    t('… la liste des relevés toujours dépliée, celle des opérations toujours repliée',
      w.corps._det.find((d) => d.cle === 'mes').open && !w.corps._det.find((d) => d.cle === 'ops').open);
  });

  /* ══ 3. DEUX FEUILLES ENCHAÎNÉES : la fiche ne s'intercale pas ══ */
  essai('enchaînées', () => {
    const w = monde(S);
    w.ctx._vendBascOuv('c1');
    w.ctx._vendSheet('<p>A</p>'); w.image();
    w.ctx._vendSheetClose(); w.ctx._vendSheet('<p>B</p>');           // « open » de B posé à l'image suivante
    w.tic();
    t('une feuille qui en enchaîne une autre ne rappelle pas la fiche entre les deux', !w.ouverte());
    w.image(); w.ctx._vendSheetClose(); w.tic();
    t('… la fiche revient à la fermeture de la dernière', w.ouverte());
  });

  /* ══ 4. UN AUTRE DIALOGUE OUVERT ══ */
  essai('autre dialogue', () => {
    const w = monde(S);
    w.ctx._vendBascOuv('c1');
    w.ctx._vendSheet('<p>A</p>'); w.image();
    w.els.ovAutre.classList.add('open');
    w.ctx._vendSheetClose(); w.tic();
    t('un autre dialogue ouvert : la fiche ne passe pas devant lui', !w.ouverte() && w.ctx._vendFicheAttente === null);
  });

  /* ══ 5. ORDINATEUR : la fiche est dans l'écran, une feuille n'y touche pas ══ */
  essai('ordinateur', () => {
    const w = monde(S);
    w.ctx.LARGE = true; w.ctx._vendOuvert = 'c2';
    w.els.ovCuveFiche.classList.add('open');                          // fenêtre restée ouverte, puis écran élargi
    w.ctx._vendSheet('<p>A</p>');
    t('sur ordinateur, une feuille ne ferme pas la fiche', !w.appels.includes('ferme:ovCuveFiche') && w.ctx._vendFicheAttente === null);
  });

  /* ══ 6. UN GESTE PAR openOv (relevé, cuve) : renderVendCuves repeint la fiche ══ */
  essai('repeinte', () => {
    const w = monde(S);
    w.ctx._vendBascOuv('c1'); w.corps._det.find((d) => d.cle === 'ops').open = true; w.corps.scrollTop = 300;
    w.CUVES[0].statut = 'fml';
    w.ctx.renderVendCuves();
    t('un geste enregistré repeint la fiche ouverte', /F">c1\|fml/.test(w.corps.innerHTML), w.corps.innerHTML);
    w.image();
    t('… sans la ramener en haut', w.corps.scrollTop === 300, 'scrollTop=' + w.corps.scrollTop);
    t('… ni replier la liste qu’on avait dépliée', w.corps._det.find((d) => d.cle === 'ops').open);
    w.ctx._vendBascOuv('c1'); w.ctx._vendBascOuv('c3');
    w.CUVES.splice(2, 1);                                              // cuve supprimée depuis « Modifier »
    w.ctx.renderVendCuves();
    t('la cuve supprimée : sa fiche se ferme', !w.ouverte());
  });

  /* ══ 7. LU DANS LE TEXTE ══ */
  essai('texte', () => {
    for (const [f, ov] of [['openOvVendMesure', 'ovVendMesure'], ['openOvVendCuve', 'ovVendCuve'], ['openOvVendRec', 'ovVendRec']])
      t(ov + ' s’ouvre par openOv, au-dessus de la fiche', fn(S.cuv, f).includes("window.openOv('" + ov + "')"));
    t('les trois listes de la fiche portent leur clé (Parcours, relevés, opérations)',
      fn(S.cuv, '_vendParcHist').includes('data-vf="parc"') && fn(S.cuv, '_vendMesHist').includes('data-vf="mes"') && fn(S.cuv, '_vendOpsSummary').includes('data-vf="ops"'));
    t('la fiche défile : #cuv-fiche-corps est la zone qui défile', /#cuv-fiche-corps\{flex:1 1 auto;min-height:0;overflow-y:auto/.test(fn(S.cuv, '_vendInjectCss')));
    const bloc = S.wn.slice(S.wn.indexOf("{ v: '10.66'"), S.wn.indexOf("{ v: '10.65'"));
    t('la nouveauté le dit, au Journal', /La fiche d’une cuve défile enfin jusqu’en bas/.test(bloc) && /Ce que la fiche ouvre passe devant elle/.test(bloc) && /niv: 0/.test(bloc));
  });
  return L;
}

const DEFAUTS = [
  ['la fiche refermée demande deux touchers', (S) => ({ ...S, cuv: S.cuv.replace("  if(id && !_matLarge() && fo && fo.classList && !fo.classList.contains('open')) _vendOuvert=id;\n  else _vendOuvert=(_vendOuvert===id?null:id);", '  _vendOuvert=(_vendOuvert===id?null:id);') })],
  ['la feuille laisse la fiche par-dessus', (S) => ({ ...S, cuv: S.cuv.replace("  _vendFicheEcarter();   // ★ CUVFICHE-1 : au téléphone, la fiche de la cuve s'écarte", '  // (retiré)') })],
  ['la fiche écartée ne revient pas', (S) => ({ ...S, cuv: S.cuv.replace('if(_vendFicheAttente){ var seq=_vendSheetSeq;', 'if(false){ var seq=_vendSheetSeq;') })],
  ['la fiche s’intercale entre deux feuilles', (S) => ({ ...S, cuv: S.cuv.replace('if(seq===_vendSheetSeq) _vendFicheRevenir();', '_vendFicheRevenir();') })],
  ['la fiche passe devant un autre dialogue', (S) => ({ ...S, cuv: S.cuv.replace("  if(document.querySelector('.overlay.open')) return;        // un autre dialogue est ouvert", '  // (retiré)') })],
  ['la fiche revient en haut, listes repliées', (S) => ({ ...S, cuv: S.cuv.replace('  _vendFicheTel(c, a.etat);', '  _vendFicheTel(c, null);') })],
  ['un geste enregistré laisse la fiche périmée', (S) => ({ ...S, cuv: S.cuv.replace("  _vendFicheRafraichir();   // ★ CUVFICHE-1 : la fiche du téléphone suit le geste", '  // (retiré)') })],
  ['le repeint ramène la fiche en haut, listes repliées', (S) => ({ ...S, cuv: S.cuv.replace("  _vendFicheRendre(corps, etat);\n}\nfunction _vendFicheEcarter(){", '}\nfunction _vendFicheEcarter(){') })],
  ['le repeint replie les listes', (S) => ({ ...S, cuv: S.cuv.replace("    for(var i=0;i<l.length;i++) if(e.ouverts.indexOf(l[i].getAttribute('data-vf'))>=0) l[i].open=true;", '    // (retiré)') })],
  ['la liste des relevés perd sa clé', (S) => ({ ...S, cuv: S.cuv.replace('<details class="mvv-histwrap" data-vf="mes">', '<details class="mvv-histwrap">') })],
  ['une cuve supprimée garde sa fiche ouverte', (S) => ({ ...S, cuv: S.cuv.replace("if(!c){ if(typeof window.closeOv==='function') window.closeOv(null,'ovCuveFiche'); return; }   // cuve supprimée", 'if(!c){ return; }   // cuve supprimée') })],
  ['sur ordinateur, la feuille ferme la fiche', (S) => ({ ...S, cuv: S.cuv.replace("function _vendFicheOuverte(){\n  if(_matLarge()) return false;\n", 'function _vendFicheOuverte(){\n') })],
  ['le relevé repasse derrière la fiche', (S) => ({ ...S, cuv: S.cuv.replace("if(typeof window.openOv==='function') window.openOv('ovVendMesure'); else if(ov) ov.classList.add('open');", "if(ov) ov.classList.add('open');") })],
  ['la fiche ne défile plus', (S) => ({ ...S, cuv: S.cuv.replace('#cuv-fiche-corps{flex:1 1 auto;min-height:0;overflow-y:auto;', '#cuv-fiche-corps{flex:1 1 auto;') })],
  ['la nouveauté manque', (S) => ({ ...S, wn: S.wn.replace('La fiche d’une cuve défile enfin jusqu’en bas', 'X') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nCUVFICHE-1 — la fiche d’une cuve au téléphone');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nCUVFICHE-1 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = S.cuv === SAIN.cuv && S.wn === SAIN.wn;
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
