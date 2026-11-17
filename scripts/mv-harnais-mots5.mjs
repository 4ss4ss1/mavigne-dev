/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-5 (§586) : PILOTAGE › AUJOURD'HUI ALLÉGÉ — TOUTES LES CARTES GARDÉES, MOINS DE MOTS DANS CHACUNE
   Lancer :          node scripts/mv-harnais-mots5.mjs
   Contre-épreuves : node scripts/mv-harnais-mots5.mjs --contre

   POURQUOI IL EXISTE
   La première maquette de cet écran retirait des cartes (cinq blocs, le reste envoyé dans d'autres onglets). Nico, 16/11 :
   « l'onglet de pilotage doit vraiment rapporter chaque élément […] l'onglet comme il était avant me semblait bien.
   Effectivement, il faut l'alléger. » La règle de ce lot : RIEN NE QUITTE L'ÉCRAN ; on allège DANS chaque carte — un titre,
   un chiffre, une barre ou une couleur, la méthode derrière le « i », le détail au toucher. Au téléphone, « En direct » et
   « À savoir » juste sous la phrase du jour. Maquette validée : docs/maquettes/maquette-aujourdhui-v4.html.

   CE QU'IL GARDE
   ① les neuf cartes de la vue Terrain sont toujours au squelette, et rangées comme avant sur ordinateur ;
   ② chaque carte s'allège comme la maquette (la phrase, les tuiles, la fin prévue, À savoir, la décision, le plan,
      les chantiers, la charge restante, En direct) — et ce qui était écrit reste lisible : derrière un « i » ou au toucher ;
   ③ les pièces JOUÉES : la ligne de repères, la ligne d'une question, la suite d'un chantier, les colonnes du plan ;
   ④ le téléphone : l'ordre, les tuiles deux par deux, la marge ; une page pas encore posée n'est pas un téléphone ;
   ⑤ l'aide, le guide, l'annonce, les versions, la référence des mots, la maquette au dépôt, ce fichier dans la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { vue: lire('src/cockpit-vue.js'), css: lire('src/styles.css'), auj: lire('src/aujourdhui.css'), app: lire('src/app.js'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'),
  guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'), ref: lire('scripts/mv-mots-baseline.json'), lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-aujourdhui-v4.html') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const ligne = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n', i) + 1); };
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');

// ③ Les pièces jouées, dans un bac : le code du module, pas une copie.
function bac(S) {
  const code = ['const esc = s => String(s);', ligne(S.vue, 'const btnI = '), 'const refChiffre = ' + S.vue.slice(S.vue.indexOf('const refChiffre = ') + 19, S.vue.indexOf("btnI(info, lab) + '</span>';\n", S.vue.indexOf('const refChiffre = ')) + 28),
    ligne(S.vue, 'const suiteFen = '), ligne(S.vue, 'function mesuresPlan(W) {'),
    'this.ref = refChiffre; this.suite = suiteFen; this.plan = mesuresPlan;'].join('\n');
  const c = {}; vm.createContext(c); vm.runInContext(code, c); return c;
}
function dz(S) {
  const h = fnDe(S.vue, 'function htmlDecision() {'); const a = h.indexOf('  const dz = '), b = h.indexOf('  const p = D.pres');
  const code = 'const esc = s => String(s);\n' + h.slice(a, b) + '\nthis.dz = dz; this.lien = lien;';
  const c = {}; vm.createContext(c); vm.runInContext(code, c); return c;
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const V = sansCom(S.vue), C = S.css + '\n' + S.auj;
  const sq = ligne(S.vue, 'window._ck2Squelette = function () {');
  // ① rien ne quitte l'écran
  T('① les neuf cartes de la vue Terrain sont au squelette : tête, tuiles, fin prévue, décision, En direct, plan, chantiers, charge, À savoir',
    ['id="ck-tete"', 'id="ck-photos"', 'id="ck-verdict"', 'id="ck-decision"', 'id="ck-fil"', 'id="ck-plan"', 'id="ck-chant"', 'id="ck-courbe"', 'id="ck-savoir"'].every((x) => sq.includes(x)));
  T('① sur ordinateur, les cartes gardent leur place : fin prévue et décision à gauche, plan, chantiers et charge au milieu, En direct et À savoir à droite',
    V.includes("t: { large: [['verdict', 'decision'], ['plan', 'chant', 'courbe'], ['fil', 'savoir']],"));
  T('① la bascule Terrain · Cave · Économie et « Simuler un renfort » sont toujours là', V.includes('data-mode="cave"') && V.includes('data-mode="eco"') && V.includes('data-onglet="sim">Simuler un renfort</button>'));
  // ② chaque carte s'allège
  const res = fnDe(S.vue, 'function majResume(r) {');
  T('② la phrase : la phrase, les pastilles, UNE ligne de repères — dans cet ordre', /'<span class="ck-res-ph">'[\s\S]*'<span class="ck-res-pl">'[\s\S]*'<span class="ck-res-rep">' \+ refT \+ refB \+ '<\/span>'/.test(res));
  T('② les pastilles restent des boutons qui mènent aux points et à la Cave', res.includes('data-fn="anticiper"') && res.includes('data-fn="cave"') && res.includes("'<span class=\"ck-res-rien\">rien à anticiper</span>'"));
  T('② le calage au pixel des repères est retiré (calerRefs), le mot « Aujourd’hui » du cadre aussi', !V.includes('calerRefs') && !V.includes('ck-cadre-nom') && !C.includes('ck-cadre-nom') && !C.includes('.ck-tient'));
  const ph = fnDe(S.vue, 'function htmlPhotos(r) {');
  T('② les tuiles : une barre à la place de la petite courbe, « Équipe », la pastille « à régler »', ph.includes("barrePh('ck-ph-trav-b')") && ph.includes("barrePh('ck-ph-bud-b', true)") && !ph.includes('spark(')
    && ph.includes("'effectif', 'Équipe'") && ph.includes('<span class="ck-ph-pst">à régler</span>') && ph.includes("tousLa ? 'présents' : esc(V.absTxt)"));
  T('② les barres des tuiles se posent au montage ET à la mise à jour (les chiffres montent seuls au montage, sans majPhotos)',
    (V.match(/barresPh\(r\);/g) || []).length === 2 && /Anim\.compter\(\$\('#ck-ph-trav'\), r\.pct, nb, 1100\);\n    barresPh\(r\);/.test(V));
  const ver = fnDe(S.vue, 'function htmlVerdict(r) {');
  T('② la fin prévue : la date courte en grand, l’écart à côté, plus de phrase ; le losange n’a plus d’étiquette', ver.includes("id=\"ck-v-fin\"><span>' + dCourt(r.fin)") && ver.includes('<small id="ck-v-ecart"></small>')
    && !sansCom(ver).includes('finiront le') && ver.includes('<span class="ck-fr-mk ck-fr-fin"></span>') && !V.includes('ck-fr-fin-l') && V.includes("Anim.rouler($('#ck-v-fin'), dCourt(r.fin));"));
  const sav = fnDe(S.vue, 'function htmlSavoir(r) {');
  T('② À savoir : le compte en pastille, ce que change un point se déplie, ni étiquette en mots ni légende', sav.includes("'<span class=\"ck-sv-n\">' + items.length + ' point'")
    && sav.includes("(x.sous ? '<details class=\"ck-sv-d\"><summary>' : '')") && sav.includes("(x.sous ? '</summary><p class=\"ck-sv-s\">' + esc(x.sous) + '</p></details>' : '')") && !sav.includes('ck-sv-k') && !sav.includes('ck-met-leg'));
  T('② À savoir : la météo et le bouton d’un point sont toujours là', sav.includes('class="ck-met"') && sav.includes('class="ck-sv-a"') && sav.includes("'<span class=\"ck-met-v\">'"));
  const dec = fnDe(S.vue, 'function htmlDecision() {');
  T('② la décision : quatre questions courtes, chacune avec son bouton court et son nom long', ["dz('Présents'", "dz('Traiter ?'", "dz('Priorité'", "dz('Tension'"].every((x) => dec.includes(x))
    && dec.includes("lien('data-module=\"planning\"', 'Planning', 'Ouvrir le planning')") && dec.includes("lien('data-module=\"phyto\"', 'Phyto', 'Registre phyto')") && !dec.includes('ck-dz-fen-ax'));
  T('② le plan : la note en un mot, une famille à zéro effacée, la phrase d’état masquée', V.includes("(n === PARCS.length ? 'Aucun contour' : n + ' sans contour') + '</summary><span>'") && V.includes("b.classList.toggle('zero', !n[k]);")
    && V.includes('id="ck-plan-cadre" hidden></p>') && C.includes('.ck2 #ck-plan .ck-leg-i.zero[data-f="arr"]{display:none}'));
  const cha = fnDe(S.vue, 'function htmlChantiers(r) {');
  T('② les chantiers : nom, barre, %, heures sur une ligne ; les dates sous le chantier affiché sur le plan', /ck-ch-nom[\s\S]*ck-barre[\s\S]*ck-ch-pct[\s\S]*ck-ch-det[\s\S]*ck-ch-ret[\s\S]*ck-ch-fen/.test(cha)
    && C.includes('.ck2 .ck-ch .ck-ch-fen{grid-column:1/-1;display:none}') && C.includes('.ck2 .ck-ch.vue .ck-ch-fen{display:block}') && C.includes('.ck2 .ck-ch-ret:empty{display:none}'));
  T('② la charge restante : le chiffre en grand, plus de légende, les noms sur les traits', V.includes("$('#ck-gr-cadre').innerHTML = '<b>' + nb(r.reste) + '\\u202fh</b><span>' + nb(r.capMoy) + ' h par jour</span>';")
    && !V.includes('lg-proj') && !V.includes('lg-bes') && !C.includes('.lg-proj') && C.includes('.lg-mes{border-top:2px solid var(--terre)}') && V.includes('id="ck-c-bes-l" class="ck-c-txt ck-c-bes-l">allure objectif</text>') && (V.match(/'fin prévue ' \+ dCourt\(/g) || []).length === 2);
  T('② « allure objectif » se tait quand sa droite est trop courte ou collée à la projection', V.includes('const vu = VISEE > AUJ && xv - xa > 150 && Math.abs(xv - xf) > 70;') && V.includes("bl.style.display = vu ? '' : 'none';"));
  T('② « Agrandir » puis « Fermer » : le graphe revient en fin de carte (il était supprimé, faute de légende devant laquelle le remettre)', V.includes("if (gr) { if (carte) carte.appendChild(gr); else gr.remove(); }"));
  T('② En direct : plus de sous-titre, le fil intact', !fnDe(S.vue, 'function htmlFil() {').includes('Qui est où en ce moment') && V.includes('id="ck-fil-l"') && V.includes('En ce moment</p>'));
  T('② ce qui était écrit reste lisible : les « i » le portent', ["fin: '", "budget: '", "savoir: '", "decision: '", "plan: '", "courbe: '", "chant: '"].every((k) => new RegExp('^  ' + k.replace('?', '\\?'), 'm').test(S.vue))
    && S.vue.includes('le risque de pluie (la barre bleue et son pourcentage)') && S.vue.includes('Touchez une réponse pour lire sa raison.') && S.vue.includes('par date de début, les terminés en bas') && S.vue.includes('les tirets, l’allure objectif'));
  // ③ joué
  let B = null, D = null; try { B = bac(S); D = dz(S); } catch (e) { B = null; T('③ les pièces se laissent jouer', false, e.message); }
  if (B && D) {
    const r1 = B.ref('ck-cap-t', '', [['fin prévue', '25 nov.'], ['objectif', '28 févr.']], 'resTemps', 'x');
    T('③ joué — un repère tient en une ligne : « fin prévue 25 nov. · objectif 28 févr. », puis son « i »', r1.startsWith('<span class="ck-cap" id="ck-cap-t"><span class="ck-cap-k">fin prévue</span> <b class="ck-cap-v">25 nov.</b> \u00b7 <span class="ck-cap-k">objectif</span> 28 févr.<button class="ck-i"') && r1.includes('data-info="resTemps"'), r1);
    T('③ joué — sans objectif posé, le repère n’invente rien', !B.ref('ck-cap-t', '', [['fin prévue', '25 nov.']], 'resTemps', 'x').includes('\u00b7'));
    const q = D.dz('Traiter ?', 'Non', 'Pluie à 14 h', '<i>b</i>', D.lien('data-module="phyto"', 'Phyto', 'Registre phyto'), ' data-mvt="traiter"');
    T('③ joué — une question : son titre, son bouton, la réponse qui se déplie sur sa raison, puis son dessin',
      q === '<div class="ck-dz" data-mvt="traiter"><div class="ck-dz-t">Traiter ?</div><div class="ck-dz-p"><button type="button" class="ck-lien" data-module="phyto" aria-label="Registre phyto">Phyto</button></div><details class="ck-dz-d"><summary class="ck-dz-v">Non</summary><p class="ck-dz-r">Pluie à 14 h</p></details><div class="ck-dz-b"><i>b</i></div></div>', q);
    T('③ joué — sans raison, la réponse n’est pas un faux bouton', D.dz('Tension', '—', '', '', '').includes('<div class="ck-dz-v">—</div>') && !D.dz('Tension', '—', '', '', '').includes('<details'));
    T('③ joué — la suite d’un chantier ne commence plus par une virgule', B.suite({ eqFini: true }, { etat: 'fait', pct: 50 }) === 'la suite au prestataire' && B.suite({}, { etat: 'retard', pct: 40 }) === 'fenêtre passée' && B.suite({}, { etat: 'cours', pct: 10 }) === '');
    T('③ joué — le plan : deux appellations de front dès 300 px, une seule en dessous, trois dès 900', B.plan(280).C === 1 && B.plan(300).C === 2 && B.plan(410).C === 2 && B.plan(900).C === 3);
  }
  // ④ le téléphone
  T('④ au téléphone, « En direct » puis « À savoir » en tête de la liste', V.includes("petit: [['fil', 'savoir', 'verdict', 'decision', 'plan', 'chant', 'courbe'], [], []] },"));
  T('④ … et avant les tuiles : l’ordre se fait dans la feuille (la vue et ses colonnes s’effacent, order)', C.includes('.ck-page[data-taille="petit"]{display:flex;flex-direction:column}')
    && C.includes('.ck-page[data-taille="petit"]>#ck-vue-terrain:not([hidden])>.ck-col>#ck-fil{order:1}') && C.includes('.ck-page[data-taille="petit"]>#ck-vue-terrain:not([hidden])>.ck-col>#ck-savoir{order:2}')
    && C.includes('.ck-page[data-taille="petit"]>#ck-photos{order:3;') && C.includes('.ck-page[data-taille="petit"]>.ck-vue{order:5}'));
  T('④ la feuille du lot est à part, lue après styles.css et bandeau.css (styles.css est à son plafond : rien n’y entre)',
    /import '\.\/bandeau\.css';[^\n]*\nimport '\.\/aujourdhui\.css';/.test(S.app) && !S.css.includes('ck-res-pl') && !S.css.includes('MOTS-5 (§586) — AUJOURD') && S.auj.includes('★★★ MOTS-5 (§586)'));
  T('④ les tuiles deux par deux (elles défilaient de côté), 16 px de marge', /@media \(max-width:699px\)\{\s*\.ck2 \.ck-photos\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\);overflow:hidden\}/.test(C)
    && C.includes('@media (max-width:699px){.ck2 .ck-page{margin-left:calc(-1 * var(--e-2,8px));margin-right:calc(-1 * var(--e-2,8px));padding-left:0;padding-right:0}}'));
  T('④ une pastille qui redit un point écrit juste dessous s’efface au téléphone', C.includes('.ck-page[data-taille="petit"] .ck-res-pts.dbl{display:none}') && res.includes('class="ck-res-pts dbl" data-fn="anticiper"') && res.includes("const cvDbl = items.some(x => x.cat === 'cave');"));
  T('④ une page pas encore posée n’est pas un téléphone : rien ne se range sous 200 px', /if \(!pg\) \{[^\n]*\n  if \(pg\.clientWidth < 200\) return;/.test(V));
  // ⑤ autour
  T('⑤ l’aide et le guide disent la règle et le geste', S.uti.includes('Chaque carte tient en un titre, un chiffre et une barre : l’explication est derrière le « i », le détail s’ouvre au toucher')
    && S.guide.includes('<b>Chaque carte se lit sans phrase</b>') && S.guide.includes('touchez la réponse pour lire sa raison'));
  const iw = S.wn.indexOf("  { v: '11.14',"), bw = iw >= 0 ? S.wn.slice(iw, S.wn.indexOf('\n  ] },', iw)) : '';
  T('⑤ l’annonce 11.14, pour l’admin, sans « & » dans son titre', /pour: \['admin'\]/.test(bw) && /titre: 'Aujourd’hui\\u00a0: les mêmes cartes, moins de mots'/.test(bw) && !/titre: '[^']*&/.test(bw));
  T('⑤ les versions : APP 11.14 partout, SW 12.05 et sa ligne', /APP_VERSION = '11\.14'/.test(S.uti) && (S.idx.match(/11\.14/g) || []).length === 5 && !S.idx.includes('11.13')
    && S.sw.startsWith('// MA VIGNE — Service Worker v12.05\n// v12.05 (16/11/2026) — MOTS-5 (§586)') && S.sw.includes("const CACHE_NAME   = 'mavigne-v12.05';"));
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  const a = ref && ref.mesures && ref.mesures['téléphone'] && ref.mesures['téléphone']['Pilotage › Aujourd’hui › Terrain'];
  T('⑤ la référence des mots est regravée : la vue Terrain à 170 mots au plus au téléphone (319 avant), aucune phrase de 15 mots', !!a && a.mots <= 170 && a.p15 === 0, JSON.stringify(a));
  T('⑤ la maquette validée est au dépôt, et dite au LISEZMOI', /Pilotage › Aujourd’hui, maquette v4/.test(S.maq) && /`maquette-aujourdhui-v4\.html` — Pilotage › Aujourd’hui allégé/.test(S.lm));
  T('⑤ ce harnais et ses contre-épreuves sont dans la liste', S.liste.includes("['node scripts/mv-harnais-mots5.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots5.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-5 (§586) — Pilotage › Aujourd’hui allégé\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 50)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const refMut = (f) => (S) => { const r = JSON.parse(S.ref); f(r.mesures['téléphone']['Pilotage › Aujourd’hui › Terrain']); return { ...S, ref: JSON.stringify(r) }; };
  const mutants = [
    ['une carte quitte l’écran (la charge restante)', sur('vue', '<section class="ck-courbe ck-panneau" id="ck-courbe" aria-label="Charge restante"></section>', '')],
    ['sur ordinateur, « À savoir » quitte la colonne de droite', sur('vue', "['plan', 'chant', 'courbe'], ['fil', 'savoir']],", "['plan', 'chant', 'courbe', 'savoir'], ['fil']],")],
    ['les repères reviennent avant les pastilles', sur('vue', "    + '<span class=\"ck-res-pl\">' + ((ptsB || cv) ? ptsB + cv : '<span class=\"ck-res-rien\">rien à anticiper</span>') + '</span>'\n    + '<span class=\"ck-res-rep\">' + refT + refB + '</span>';", "    + '<span class=\"ck-res-rep\">' + refT + refB + '</span>';")],
    ['la petite courbe revient dans la tuile Travaux', sur('vue', "barrePh('ck-ph-trav-b'),", "spark(SPARK_TRAV, 'bas'),")],
    ['les barres des tuiles restent vides au montage', sur('vue', "    Anim.compter($('#ck-ph-trav'), r.pct, nb, 1100);\n    barresPh(r);", "    Anim.compter($('#ck-ph-trav'), r.pct, nb, 1100);")],
    ['la grande phrase de la fin prévue revient', sur('vue', "'<h2 class=\"ck-v-phrase\"><span class=\"ck-roule\"", "'<h2 class=\"ck-v-phrase\">Les travaux finiront le <span class=\"ck-roule\"")],
    ['ce que change un point ne se déplie plus (il disparaît)', sur('vue', "(x.sous ? '</summary><p class=\"ck-sv-s\">' + esc(x.sous) + '</p></details>' : '')", "(x.sous ? '</summary></details>' : '')")],
    ['la raison d’une réponse disparaît', sur('vue', "'</summary><p class=\"ck-dz-r\">' + esc(raison) + '</p></details>'", "'</summary></details>'")],
    ['le bouton d’une question perd son nom long', sur('vue', "' aria-label=\"' + long + '\">' + court + '</button>'", "'>' + court + '</button>'")],
    ['« Arrachée 0 » reste dans la légende', sur('auj', '.ck2 #ck-plan .ck-leg-i.zero[data-f="arr"]{display:none}', '')],
    ['les dates d’un chantier ne s’affichent jamais', sur('auj', '.ck2 .ck-ch.vue .ck-ch-fen{display:block}', '')],
    ['la suite d’un chantier reprend sa virgule', sur('vue', "x.etat === 'retard' ? 'fenêtre passée'", "x.etat === 'retard' ? ', fenêtre passée'")],
    ['la légende du graphe revient', sur('vue', "    + '<div class=\"ck-gr\" id=\"ck-gr\"></div>';", "    + '<div class=\"ck-gr\" id=\"ck-gr\"></div><i class=\"lg-proj\"></i>';")],
    ['la légende d’Économie perd son trait (« Budget dépensé »)', sur('css', '.lg-mes{border-top:2px solid var(--terre)}\n', '')],
    ['le graphe est supprimé au retour d’« Agrandir »', sur('vue', 'if (gr) { if (carte) carte.appendChild(gr); else gr.remove(); }', 'if (gr) gr.remove();')],
    ['« allure objectif » parle sur une droite trop courte', sur('vue', 'const vu = VISEE > AUJ && xv - xa > 150 && Math.abs(xv - xf) > 70;', 'const vu = true;')],
    ['le « i » des chantiers perd la règle de l’ordre', sur('vue', "  chant: 'Les chantiers de la campagne, par date de début, les terminés en bas.", "  chant: 'Les chantiers.")],
    ['le plan reste sur une colonne à 410 px', sur('vue', 'C: W >= 900 ? 3 : (W >= 300 ? 2 : 1) }; }', 'C: W >= 900 ? 3 : (p ? 1 : 2) }; }')],
    ['au téléphone, l’ordre d’avant', sur('vue', "petit: [['fil', 'savoir', 'verdict',", "petit: [['verdict', 'savoir', 'fil',")],
    ['au téléphone, les tuiles repassent devant « En direct »', sur('auj', '.ck-page[data-taille="petit"]>#ck-photos{order:3;', '.ck-page[data-taille="petit"]>#ck-photos{order:0;')],
    ['les tuiles défilent de côté', sur('auj', '.ck2 .ck-photos{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);overflow:hidden}', '')],
    ['la feuille du lot n’est plus lue', sur('app', "import './aujourdhui.css';", "// import './aujourdhui.css';")],
    ['le bloc du lot retourne dans styles.css (au plafond)', (S) => ({ ...S, css: S.css + S.auj })],
    ['une page de 32 px est prise pour un téléphone', sur('vue', '  if (pg.clientWidth < 200) return;', '  if (pg.clientWidth < 0) return;')],
    ['l’aide tait la règle', sur('uti', 'Chaque carte tient en un titre, un chiffre et une barre : ', '')],
    ['le guide tait le geste', sur('guide', 'touchez la réponse pour lire sa raison', 'les verdicts tombent sur la même ligne')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("  { v: '11.14',"); const j = S.wn.indexOf("pour: ['admin']", i); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.05 (16/11/2026) — MOTS-5 (§586)', '// v12.05 (16/11/2026) — divers')],
    ['la référence des mots n’a pas été regravée', refMut((t) => { t.mots = 319; })],
    ['la maquette n’est pas au dépôt', (S) => ({ ...S, maq: '' })],
    ['la liste ne joue plus ce fichier', (S) => ({ ...S, liste: S.liste.split("mv-harnais-mots5.mjs'").join("mv-harnais-motsX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible : ' + nom + ' (' + e.message + ')'); continue; }
    if (Object.keys(S0).every((k) => S[k] === S0[k])) { console.log('  \x1b[31m✗\x1b[0m mutant sans effet : ' + nom); continue; }
    let rouges = 0; try { rouges = suite(S).filter((x) => !x[1]).length; } catch (e) { rouges = 1; }
    if (rouges > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + rouges + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
