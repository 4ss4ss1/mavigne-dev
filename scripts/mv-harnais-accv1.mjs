// HARNAIS — ACCV-1 (§416) : la carte du jour de l'Accueil au dessin de la maquette (Nico, 21/10 : « go comme la maquette »).
//   node scripts/mv-harnais-accv1.mjs           → doit être vert
//   node scripts/mv-harnais-accv1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue la VRAIE _homePrioCarte et la VRAIE _homeDreLignes (extraites par leurs accolades) sur un faux DOM : priorité avec
// équipe, journal, délai de rentrée et formes ; administrateur ; sans priorité ; sans rien. Lit la feuille, l'aide, le guide.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { app: L('src/app.js'), css: L('src/styles.css'), uti: (L('src/utils.js') + '\n' + L('src/whats-new.js')), guide: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ ACCV-1 (§416)'); if (i < 0) return ''; const j = css.indexOf('★ FIN ACCV-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ISO = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const AUJ = ISO(new Date()), HIER = ISO(new Date(Date.now() - 864e5));
const hexDe = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime().toString(16); };
function jouer(S, o) {
  const el = id => ({ id, parentNode: null, className: '', classList: { add() {} }, innerHTML: '' });
  const w = el('w'), kp = el('home-kpis'), eq = el('home-eqj-wrap'), corps = { v: null };
  w.insertBefore = n => { n.parentNode = w; if (n.id === 'home-prio-corps') corps.v = n; };
  const doc = { querySelector: () => w, getElementById: id => (id === 'home-kpis' ? kp : id === 'home-eqj-wrap' ? eq : id === 'home-prio-corps' ? corps.v : null), createElement: () => el('home-prio-corps') };
  const P = [{ nom: 'Les Crais', surface: '0,5' }, { nom: 'Bel Air', surface: '1' }, { nom: 'La Justice', surface: '0,25' }, { nom: 'En Champs', surface: '0,4' }, { nom: 'Arrachée', surface: '1', statut: 'Arrachee' }];
  const ST = { 'Les Crais': 'Validé', 'Bel Air': 'Validé', 'La Justice': 'En cours' };
  const J = [
    { id: hexDe(9, 10) + '-qv', date: AUJ, parcelle: 'Les Crais', tache: 'Réparation', qui: 'Sophie', statut: 'Validé', membresEquipe: ['Jean'] },
    { id: hexDe(10, 5) + '-qv', date: AUJ, parcelle: 'Les Crais', tache: 'Réparation', qui: 'Jean', statut: 'Validé' },
    { id: hexDe(16, 40) + '-qv', date: HIER, parcelle: 'Bel Air', tache: 'Réparation', qui: 'Sophie', statut: 'Validé' },
    { id: hexDe(8, 0) + '-qv', date: AUJ, parcelle: 'En Champs', tache: 'Réparation', qui: 'Paul', statut: 'Annulé' },
    { id: hexDe(11, 48) + '-qv', date: AUJ, parcelle: 'La Justice', tache: 'Réparation', qui: 'Jean', statut: 'En cours', membresEquipe: ['Sophie'] }
  ];
  const fin = new Date(2026, 10, 3);
  const corpsF = ['function _homeSurf(p){', 'function _homeHa(x){', 'function _homeForme(f,r){', 'function _homeRangs(fo,fw){', 'function _homeDreLignes(now){', 'function _homePrioCarte(){'].map(d => fonction(S.app, d)).join('\n');   // ★ CARTEDOM-2 (§491) : les rangs vivent dans _homeRangs
  const noms = ['document', 'PARCELLES', '_prioItems', '_prioForMember', 'getTacheStatut', 'getPCls', 'tNom', '_escAttr', '_escHtml', '_pvSurfFr', 'window', 'currentUser', '_mvMoiAdmin', '_mvIcon', 'JOURNAL', 'MEMBRES', 'priorityMessage', '_mvToday', '_mvISO', '_mvPartCalc', '_mvPartDate', '_mvPartTache', '_hvHeure', 'fmtDate', '_mvEqBrut', 'dreEffectif'];
  const f = new Function(...noms, corpsF + '\n_homePrioCarte(); return document.getElementById(\'home-prio-corps\');');
  const win = {
    _mvParcForme: n => (n === 'Bel Air' ? { w: 100, h: 40, rings: [[[0, 0], [100, 0], [100, 40], [60, 40], [60, 20], [0, 20]]] } : null),
    _mvEqDe: o.equipe ? (() => ['Sophie', 'Jean']) : undefined, _mvEqJour: () => [['Sophie', 'Jean'], ['Paul', 'Lucas']], _mvTourneesLues: () => [{ id: 't1', nom: 'Hiver' }],
    _mvPqBtn: (t) => '<button type="button" class="mv-pq" data-mvi="pqt.x">Pourquoi\u00a0?</button>',
    TRAITEMENTS: o.dre ? [{ date: AUJ, heureFin: String(new Date().getHours()).padStart(2, '0') + ':00', produit: 'Produit A', parcelles: ['Les Crais'], sessionId: 's1' }] : [],
    CATALOGUE: [{ nom: 'Produit A', drae: 48, type: 'X' }]
  };
  const c = f(doc, P, () => (o.prio ? [{ t: 'Réparation', equipe: ['Lucas', 'Inès'] }] : []), () => null, p => ST[p.nom], p => ({ pct: ST[p.nom] === 'Validé' ? 100 : (ST[p.nom] ? 50 : 0) }), t => t, esc, esc, s => s, win,
    { nom: o.admin ? 'Marie' : 'Sophie' }, () => !!o.admin, (n) => '<svg class="mv-ic" data-i="' + n + '"></svg>', J, [{ nom: 'Sophie', couleur: '#7A4F2E' }, { nom: 'Jean', couleur: '#1A4A7A' }],
    o.mot || '', () => AUJ, d => ISO(d), (t) => ({ pct: t === 'Réparation' ? 62 : 38, restN: 3, rest: 1.2, fin }), d => d.getDate() + ' novembre',
    (out) => { out.M = o.moment ? { mode: 'dates', taches: ['Réparation', 'Entreplantation'] } : null; return o.moment ? 'Réparation' : null; },
    j => { const m = /^([0-9a-f]{10,12})-/.exec(j.id || ''); if (!m) return ''; const d = new Date(parseInt(m[1], 16)); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
    s => s, () => [{ t: 't1' }, { t: '' }], (drae) => ({ h: drae }));
  return c ? c.innerHTML : '';
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let A = '', D = '', Ad = '', Sa = '', V = '';
  try { A = jouer(S, { prio: true, equipe: true, mot: 'On finit <b>Gevrey-bas</b>' }); D = jouer(S, { prio: true, equipe: true, dre: true }); Ad = jouer(S, { prio: true, admin: true }); Sa = jouer(S, { moment: true, equipe: true }); V = jouer(S, { admin: true }); } catch (e) { A = 'plantage ' + e.message; }
  T('la tâche du jour en grand, le message échappé dans son encadré', A.includes('<h2 class="hpc-titre">Réparation</h2>') && A.includes('class="hpc-mot"') && A.includes('On finit &lt;b&gt;Gevrey-bas&lt;/b&gt;') && !A.includes('<b>Gevrey'));
  T('l’avancement pèse la surface des concernées (1,50 ha sur 2,15 ha = 70 %), la barre le suit', A.includes('<div class="hpc-pct">70<small>') && A.includes('1,50\u00a0ha faits sur 2,15\u00a0ha') && A.includes('<div class="hpc-bar"><i style="--p:70%">'));
  T('la petite victoire : une parcelle validée deux fois aujourd’hui compte une fois (+0,50 ha), l’annulée jamais ; hier +1,00 ha', A.includes('+0,50\u00a0ha aujourd\u2019hui') && A.includes('hier +1,00\u00a0ha'));
  T('l’équipe du jour, ses initiales et sa tournée', A.includes('Sophie et Jean') && A.includes('class="hpc-avt" style="--c:#7A4F2E"') && A.includes('tourn\u00e9e \u00ab\u00a0Hiver\u00a0\u00bb'));
  T('« En ce moment » : la parcelle commencée par l’équipe, depuis son heure', A.includes('En ce moment') && A.includes('>La Justice<') && A.includes('depuis 11\u00a0h\u00a048'));
  T('la fin prévue au rythme des 15 derniers jours', A.includes('vers le 3 novembre') && A.includes('au rythme des 15 derniers jours'));
  T('les gestes : « Aller aux parcelles » et la pastille « Pourquoi ? » de la tâche', A.includes('onclick="switchVigneOng(\'parcelles\')"') && A.includes('class="mv-pq"'));
  T('les parcelles : formes avec rangs coupés au contour (équerre : 20 m de haut à gauche de x = 60, 40 m à droite)', (() => { const m = A.match(/<g class="hpc-rg">([\s\S]*?)<\/g>/); if (!m) return false; const L2 = [...m[1].matchAll(/x1="([\d.]+)" y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/g)].map(l => [+l[1], +l[2], +l[3]]); return L2.length > 5 && L2.every(l => l[1] >= 0 && l[2] <= 40.01) && L2.filter(l => l[0] < 60).every(l => l[2] <= 20.01) && L2.some(l => l[0] > 60 && l[2] > 39); })());
  T('la légende compte : 2 faites, 1 en cours, 1 à faire', A.includes('<b>2</b> faites') && A.includes('<b>1</b> en cours') && A.includes('<b>1</b> \u00e0 faire'));
  T('aucun « undefined » ni « NaN », l’arrachée exclue', ![A, D, Ad, Sa, V].some(h => /undefined|NaN/.test(h)) && !A.includes('Arrach\u00e9e'));
  T('délai de rentrée : le bandeau rouge en tête, la parcelle marquée, la légende le dit', D.indexOf('<div class="hpc-dre-b" role="alert">') === 0 && D.includes('sur Les Crais') && /class="hpc-p[^"]*hpc-dre"[^>]*data-nom="Les Crais"/.test(D) && D.includes('hpc-l-dre') && !A.includes('hpc-dre-b'));
  T('administrateur : « Modifier » ouvre la priorité, « Équipes du jour » porte le tuto et ouvre le réglage', Ad.includes('onclick="openPriorityEdit()"') && Ad.includes('data-tuto="home.eqj" onclick="openEqJour()"') && Ad.includes('\u00c9quipes du jour\u00a0: 2 \u00e9quipes'));
  T('sans priorité : les chantiers du moment, deux avancements, pas de pourcentage en double', Sa.includes('Les chantiers du moment') && Sa.includes('Réparation et entreplantation') && (Sa.match(/class="hpc-duo-c"/g) || []).length === 2 && !Sa.includes('hpc-pct') && Sa.includes('La saison, parcelle par parcelle'));
  T('sans rien : « Pas encore de priorité », et l’administrateur la fixe d’ici (équipes du jour à côté)', V.includes('Pas encore de priorit\u00e9') && V.includes('<span>Fixer la priorit\u00e9</span>') && V.includes('data-tuto="home.eqj"'));
  T('une seule règle du délai de rentrée : « À savoir » la lit dans _homeDreLignes (l’ancien bloc est retiré, ACCV-3)', (S.app.match(/function _homeDreLignes\(now\)\{/g) || []).length === 1 && !S.app.includes('function renderHomeDRE(') && fonction(S.app, 'function _accSavoirItems(').includes('_homeDreLignes(now)'));
  T('le bloc ACCV-1 : après ETATS-1, avant TETE-2, par jetons seulement (' + dur.length + '), animations coupées sur demande', B.length > 4000 && S.css.indexOf('★ ACCV-1 (§416)') > S.css.indexOf('★ ETATS-1 (§415)') && S.css.indexOf('★ FIN ACCV-1') < S.css.indexOf('/* ★ TETE-2 (§329)') && dur.length === 0 && B.includes('@media (prefers-reduced-motion:reduce){ #page-home .hpc-ici,#page-home .hpc-pouls{ animation:none; } }'));
  T('l’aide, le guide et les nouveautés disent la carte du jour', S.uti.includes('la tâche du jour en grand, le message de l’administrateur') && S.uti.includes("titre: 'La carte du jour, refaite'") && S.guide.includes('Un délai de rentrée en cours s\'affiche en rouge'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-accv1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-accv1.mjs --contre'],"));
  return out;
}
function lancer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = lancer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une parcelle validée deux fois compte deux fois', 'app', "||!j.parcelle||vus[j.parcelle]) return;", "||!j.parcelle) return;", 2],
    ['le message n’est plus échappé', 'app', "<p>\\u00ab\\u00a0'+_escHtml(pm)+'", "<p>\\u00ab\\u00a0'+pm+'", 0],
    ['les parcelles sous délai ne sont plus marquées', 'app', "dre=dreTout||!!dreN[p.nom]", "dre=false", 10],
    ['les rangs ne sont plus coupés au contour', 'app', "for(var m=0;m+1<ys.length;m+=2){", "ys=[0,fo.h];for(var m=0;m+1<ys.length;m+=2){", 7],
    ['« Aller aux parcelles » ne mène plus aux parcelles', 'app', "onclick=\"switchVigneOng(\\'parcelles\\')\"><span>Aller aux parcelles</span>", "onclick=\"goTo(\\'home\\')\"><span>Aller aux parcelles</span>", 6],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-home .hpc-cta{ display:inline-flex;', '#page-home .hpc-cta{ color:#7A2850; display:inline-flex;', 15],
    ['« À savoir » garde sa propre copie de la règle', 'app', "(typeof _homeDreLignes==='function'?_homeDreLignes(now):[])", "[]", 14],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-accv1.mjs'],", '', 17]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = lancer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  process.exit(mord === DEF.length ? 0 : 1);
}
process.exit(ko ? 1 : 0);
