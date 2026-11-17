/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-7 (§589) : PILOTAGE › AUJOURD'HUI, LA VUE ÉCONOMIE ALLÉGÉE — LES SIX CARTES GARDÉES, MOINS DE MOTS DANS CHACUNE
   Lancer :          node scripts/mv-harnais-mots7.mjs
   Contre-épreuves : node scripts/mv-harnais-mots7.mjs --contre

   POURQUOI IL EXISTE
   Après la vue Terrain (MOTS-5, §586) et la vue Cave (MOTS-6, §588), la vue Économie d'Aujourd'hui suit la même règle, sur
   maquette validée le 17/11 (« C'est parfait ») : docs/maquettes/maquette-aujourdhui-economie-v1.html. Rien ne quitte
   l'écran. Dans une carte, un chiffre, une barre ou une couleur ; le pourquoi du jour et la méthode derrière le « i » ; le
   détail d'un poste, d'une appellation, d'une tâche se déplie au toucher.

   CE QU'IL GARDE
   ① les six cartes sont au squelette et à leur place ;
   ② chaque carte JOUÉE (les vraies fonctions du cockpit, montées dans Node, sur les chiffres de la démo) : le coût à la fin,
      les quatre chiffres, les deux parts de la main-d'œuvre, par poste, par appellation, l'écart par tâche — et ce qui était
      écrit reste lisible, derrière un « i » ou au toucher ;
   ③ les mots du lexique (§580c) : « coût à la fin » (plus « atterrissage »), « engagé » (plus « dépensé » ni « payé ») ;
   ④ rien n'est recalculé : les mêmes chiffres du modèle, les mêmes barres ;
   ⑤ la feuille (aujourdhui.css), l'aide, le guide, l'annonce, les versions, la référence des mots, la maquette au dépôt.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { vue: lire('src/cockpit-vue.js'), css: lire('src/styles.css'), auj: lire('src/aujourdhui.css'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'),
  guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'), ref: lire('scripts/mv-mots-baseline.json'), lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-aujourdhui-economie-v1.html') };
const ligne = (s, debut, n = 1) => { const L = s.split('\n'), i = L.findIndex((l) => l.startsWith(debut)); if (i < 0) throw new Error('ligne introuvable : ' + debut); return L.slice(i, i + n).join('\n'); };
const tranche = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('tranche introuvable : ' + a.slice(0, 40)); return s.slice(i, j); };
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const texte = (h) => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// Les chiffres de la démo au 27/10 (ceux de la maquette).
const R0 = () => ({ att: 15317, budget: 15784, dep: 1940, sous: 467, coutHa: 2182, coutHaPrevu: 2248, ecartMoy: -0.657, capMoy: 73, besoin: 11, moBudget: 15447, moDep: 1888, moAtt: 14980, moH: 146,
  a: { b: { ha: 3.17, coutHa: 214 }, g: { ha: 1.25, coutHa: 706 }, g1: { ha: 1.2, coutHa: 660 }, c: { ha: 0.9, coutHa: 0 }, f: { ha: 0.5, coutHa: 0 }, x: { ha: 0, coutHa: 0 } },
  t: { palissage: { ecart: -0.657, hB: 210, hR: 72 } } });
const POSTES0 = [{ id: 'gnr', nom: 'Carburant GNR', ref: 'proj', budget: 337, dep: 52, note: '45 L relevés · 1 plein · réparti à la surface' }, { id: 'hb', nom: 'Travaux à l’heure', ref: '', dep: 300, note: '' }];
const APPS0 = [{ id: 'b', nom: 'Bourgogne' }, { id: 'g', nom: 'Gevrey-Chambertin' }, { id: 'g1', nom: 'Gevrey-Chambertin 1er cru' }, { id: 'c', nom: 'Côte de Nuits-Villages' }, { id: 'f', nom: 'Fixin' }, { id: 'x', nom: 'Vigne arrachée' }];

// Les vraies fonctions de la vue Économie, montées dans Node.
function monter(S, eco) {
  const v = S.vue;
  const code = [ligne(v, 'const NF0 = '), ligne(v, 'const NF2 = '), ligne(v, 'const nb = '), ligne(v, 'const haTxt = '), ligne(v, 'const esc = '),
    ligne(v, 'const MOIS_C = '), ligne(v, 'const jourN = '), ligne(v, 'const dCourt = '),
    tranche(v, '\nconst eur = ', '\nconst INFO = {'), ligne(v, 'const INFO_PLUS = '), ligne(v, 'const btnI = '), ligne(v, 'const entete = ', 2),
    'const spark = () => "", cvIc = () => "<svg class=\\"mv-ic\\"></svg>", $ = () => null;',
    'let VISEE = new Date(Date.UTC(2027, 1, 28)), SPARK_ECART = [], POSTES = __P, APPS = __A, TACHES = [{ id: "palissage", cle: "Palissage", nom: "Palissage" }, { id: "taille", cle: "Taille", nom: "Taille" }];',
    'let V = { eco: __E };',
    tranche(v, '\nfunction htmlEVerdict(r) {', '\nconst GE = {'), tranche(v, '\nconst ecartTxt = ', '\n/* ═══ 8. LES MISES À JOUR'),
    'this.api = { htmlEVerdict, htmlEKpis, htmlPostes, htmlApps, htmlTaches, lignePoste, ligneMO, ligneTot, ecCadre, ecCls, INFO_PLUS };'].join('\n');
  const ctx = { Intl, Math, Number, String, Array, Object, Date, isFinite, __P: POSTES0, __A: APPS0, __E: eco || { ecTache: { Palissage: -0.657 } } };
  vm.createContext(ctx); vm.runInContext(code, ctx); return ctx.api;
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const V = sansCom(S.vue), C = S.auj, sq = ligne(S.vue, 'window._ck2Squelette = function () {');
  // ① rien ne quitte l'écran
  T('① les six cartes de la vue Économie sont au squelette', ['id="ck-ever"', 'id="ck-ekpi"', 'id="ck-echart"', 'id="ck-epos"', 'id="ck-eapp"', 'id="ck-etac"'].every((x) => sq.includes(x)));
  T('① … à leur place : sur ordinateur trois colonnes, au téléphone le même ordre', V.includes("e: { large: [['ever', 'ekpi'], ['echart', 'etac'], ['epos', 'eapp']],") && V.includes("petit: [['ever', 'ekpi', 'echart', 'epos', 'eapp', 'etac'], [], []] },"));
  T('① … et elles se montent toutes', ["$('#ck-ever').innerHTML = htmlEVerdict(R);", "$('#ck-ekpi').innerHTML = htmlEKpis(R);", "$('#ck-echart').innerHTML = entete('Main-d’œuvre', '', 'echart')", "$('#ck-epos').innerHTML = htmlPostes(R);", "$('#ck-eapp').innerHTML = htmlApps(R);", "$('#ck-etac').innerHTML = htmlTaches(R);"].every((x) => V.includes(x)));
  // ② les cartes, jouées
  let M = null, r = R0(), H = {};
  try { M = monter(S); H = { v: M.htmlEVerdict(r), k: M.htmlEKpis(r), p: M.htmlPostes(r), a: M.htmlApps(r), t: M.htmlTaches(r) }; }
  catch (e) { T('② les cartes de la vue Économie se dessinent (' + e.message + ')', false); return out; }
  essai('② coût à la fin : le montant en grand, la place de l’écart au budget, plus de phrase', () => [H.v.includes('<h2 class="ck-v-phrase ck-ev-ph"><span class="ck-roule" id="ck-ev-att"><span>15\u202f317\u202f€</span></span><small id="ck-ev-sous"></small></h2>')
    && !/La campagne devrait coûter|ck-v-sous/.test(H.v), H.v.slice(0, 500)]);
  essai('② … la barre sans étiquette sur ses repères ; dessous, ses deux bouts : engagé, budget', () => !/<em/.test(H.v) && H.v.includes('<span class="ck-fr-mk ck-fr-mdep"></span><span class="ck-fr-mk ck-fr-fin"></span><span class="ck-fr-mk ck-fr-visee"></span>')
    && H.v.includes('<p class="ck-ev-rep"><span>engagé <b id="ck-ef-dep"></b></span><span>budget <b id="ck-ef-bud"></b></span></p>'));
  essai('② … les deux boutons restent ; « Exporter » garde son nom long pour le lecteur d’écran', () => H.v.includes('data-onglet="eco">Ouvrir l’Économie</button>') && H.v.includes('data-fn="export" aria-label="Exporter pour la compta">Exporter</button>'));
  T('② … l’écart au budget s’écrit en deux ou trois mots, en couleur ; sur quoi repose le reste, derrière le « i »', V.includes("sous.textContent = e0 === 0 ? 'pile dans le budget' : e0 > 0 ? eur(e0) + ' sous le budget' : eur(-e0) + ' au-dessus du budget';")
    && V.includes("sous.className = e0 >= 0 ? 'ok' : 'ko';") && V.includes("INFO_PLUS.atterrissage = [r.cadAppl ? 'Aujourd’hui, le travail qui reste suit le rythme mesuré de l’équipe.' : 'Aujourd’hui, le travail qui reste est compté au barème.'];")
    && V.includes("$('#ck-ef-dep').textContent = eur(r.dep);") && V.includes("$('#ck-ef-bud').textContent = eur(r.budget);") && !V.includes('ck-ef-att'));
  essai('② les quatre chiffres : un nom, un chiffre, deux ou trois mots', () => { const t = texte(H.k);
    return [/^Coût à l’hectare i 0.€\/ha prévu 2.248 Écart au barème i −65,7.% plus rapide Cadence i 73.h\/j il en faut 11 Retard i rien à rattraper$/.test(t), t]; });
  essai('② … l’écart au barème prend sa couleur : plus rapide en vert, plus lent en orange, rien sans mesure', () => H.k.includes('<b id="ck-ek-ec" class="vite">') && M.ecCls({ ecartMoy: 0.2 }) === 'lent' && M.ecCls({ ecartMoy: null }) === '' && M.ecCls({ ecartMoy: 0 }) === ''
    && M.ecCadre({ ecartMoy: 0.2 }) === 'plus lent' && M.ecCadre({ ecartMoy: null }) === 'rien de validé' && M.ecCadre({ ecartMoy: 0 }) === 'au barème');
  essai('② … « rien à rattraper » est une pastille verte ; pourquoi, derrière le « i »', () => H.k.includes('<span class="ck-ph-pst ok">rien à rattraper</span>') && !/ck-ek-calme|les travaux tiennent/.test(H.k)
    && M.INFO_PLUS.inaction[0] === 'Aujourd’hui, les travaux tiennent dans leurs fenêtres.' && /^Pour tenir l’objectif du 28.févr\., il faut 11.h par jour\.$/.test(M.INFO_PLUS.cadence[0]));
  essai('② … avec un retard : les heures en chiffre, le coût en court ; la phrase derrière le « i »', () => { const m = monter(S, { ecTache: {}, inaction: { h: 40, eur: 920, horsDelai: 1 } }), h = m.htmlEKpis(r), t = texte(h);
    return [/Retard i \+.40.h env\. 900.€ · 1 hors délai$/.test(t) && !h.includes('ck-ph-pst') && /^Aujourd’hui : 40.h en plus, environ 900.€ si rien n’est décidé, 1 tâche hors délai\.$/.test(m.INFO_PLUS.inaction[0]), t + ' | ' + m.INFO_PLUS.inaction[0]]; });
  T('② la main-d’œuvre : ses deux parts du jour en chiffres au-dessus du graphe, qui servent de légende ; plus de légende dessous', V.includes(`'<p class="ck-e-chf"><span><i class="lg-fait"></i>fait <b id="ck-e-cf"></b></span><span><i class="lg-mes"></i>engagé <b id="ck-e-cd"></b></span></p>'`)
    && !V.includes('ck-gr-leg') && V.includes("if (cf) cf.textContent = nb(z.fait) + '\\u202f%'; if (cd) cd.textContent = nb(z.dep) + '\\u202f%';"));
  T('② … au bout des pointillés : la fin prévue, puis « fait 100 % · engagé N % » — à droite du point s’il y a la place, sinon à gauche', V.includes("$('#ck-e-lt').textContent = 'fin prévue ' + dCourt(fin);")
    && V.includes("$('#ck-e-ld').textContent = 'fait 100\\u202f% · engagé ' + nb(at) + '\\u202f%';") && V.includes('const droite = xf + 168 < c.w - c.padR, lab = $(\'#ck-e-lab\');') && V.includes("lab.setAttribute('text-anchor', droite ? 'start' : 'end');"));
  essai('② par poste : le nom, l’écart, la barre, « engagé / budget » — le détail au toucher', () => { const m = /<li class="ck-po" data-po="mo"><details class="ck-dp"><summary>([\s\S]*?)<\/summary><p class="ck-po-s">([\s\S]*?)<\/p><\/details><\/li>/.exec(H.p);
    return [!!m && /^Main-d’œuvre −467.€ 1.888 \/ 15.447.€$/.test(texte(m[1])) && /class="ck-puce"/.test(m[1]) && /^146 h dans les rangs, 12,93.€ de l’heure$/.test(texte(m[2])), m ? texte(m[1]) + ' | ' + texte(m[2]) : 'absent']; });
  essai('② … un poste au prévu : ce qui reste à droite, sans le mot « prévus » ; un poste au réel : sans barre, sa règle au toucher', () => { const g = /data-po="gnr">([\s\S]*?)<\/li>/.exec(H.p), h = /data-po="hb">([\s\S]*?)<\/li>/.exec(H.p);
    return [!!g && !!h && /^Carburant GNR reste 285.€ 52 \/ 337.€ 45 L relevés · 1 plein · réparti à la surface$/.test(texte(g[1])) && /^Travaux à l’heure 300.€ payé à l’heure, sans barème$/.test(texte(h[1])) && !/ck-puce/.test(h[1]), (g ? texte(g[1]) : '') + ' | ' + (h ? texte(h[1]) : '')]; });
  essai('② … toute la campagne : la même ligne, sa barre, le coût à la fin au toucher', () => { const m = /<li class="ck-po ck-po-tot" data-po="tot">([\s\S]*?)<\/li>/.exec(H.p);
    return [!!m && /^Toute la campagne −467.€ 1.940 \/ 15.784.€ coût à la fin 15.317.€$/.test(texte(m[1])) && m[1].includes('id="ck-po-b-tot"') && m[1].includes('id="ck-po-a-tot"') && V.includes('fixe(ligneMO(r)); fixe(ligneTot(r));'), m ? texte(m[1]) : 'absent']; });
  essai('② par appellation : une ligne chacune, de la plus chère à la moins chère ; la surface au toucher', () => { const L = [...H.a.matchAll(/<li class="ck-ap"><details class="ck-dp"><summary class="ck-ap-h">([\s\S]*?)<\/summary><p class="ck-ap-s">([\s\S]*?)<\/p>/g)].map((x) => texte(x[1]) + ' → ' + texte(x[2]));
    return [L.length === 3 && /^Gevrey-Chambertin 706.€\/ha → 1,25.ha en production$/.test(L[0]) && /^Gevrey-Chambertin 1er cru 660.€\/ha → 1,20.ha en production$/.test(L[1]) && /^Bourgogne 214.€\/ha → 3,17.ha en production$/.test(L[2]) && (H.a.match(/class="ck-barre fine"/g) || []).length === 3, L.join(' | ')]; });
  essai('② … celles sans travail validé sur une ligne repliée ; une vigne arrachée (0 ha) n’y entre pas', () => { const m = /<li class="ck-ap ck-ap-z"><details class="ck-dp"><summary><span>([^<]*)<\/span>[\s\S]*?<p class="ck-ap-s">([\s\S]*?)<\/p>/.exec(H.a);
    return [!!m && m[1] === '2 sans travail validé' && /^Côte de Nuits-Villages · 0,90.ha<br>Fixin · 0,50.ha$/.test(m[2]) && !H.a.includes('Vigne arrachée') && (H.a.match(/<li class="ck-ap">/g) || []).length === 3 && (H.a.match(/Côte de Nuits-Villages/g) || []).length === 1, m ? m[1] + ' | ' + m[2] : 'absent']; });
  essai('② … l’écart en un chiffre ; la phrase derrière le « i »', () => [/<p class="ck-ap-note"><b>\+230.%<\/b><span>de Bourgogne à Gevrey-Chambertin<\/span><\/p>/.test(H.a) && /^Gevrey-Chambertin a demandé 230.% de plus à l’hectare que Bourgogne, d’après les heures validées de la campagne\.$/.test(M.INFO_PLUS.apps[0]) && !H.a.includes('class="ck-cadre"'), H.a.slice(-260)]);
  essai('② … un nom d’appellation avec « & » : échappé une fois dans la carte, en texte dans la bulle (ouvrirInfo l’échappe)', () => { const m = monter(S), r1 = R0(); const A0 = APPS0[1].nom; APPS0[1].nom = 'Clos & Côte'; try { const h = m.htmlApps(r1);
    return [h.includes('<span class="n">Clos &amp; Côte</span>') && !h.includes('&amp;amp;') && m.INFO_PLUS.apps[0].startsWith('Clos & Côte a demandé'), m.INFO_PLUS.apps[0]]; } finally { APPS0[1].nom = A0; } });
  essai('② … une seule appellation comparable : ni écart, ni phrase', () => { const r1 = R0(); r1.a.g.coutHa = 0; r1.a.g1.coutHa = 0; const m = monter(S), h = m.htmlApps(r1); return !h.includes('ck-ap-note') && m.INFO_PLUS.apps.length === 0 && /4 sans travail validé/.test(h); });
  essai('② écart par tâche : le nom, la barre, l’écart ; ses heures au toucher ; seules les tâches comparables', () => { const m = /<li class="ck-ta" data-ta="palissage"><details class="ck-dp"><summary class="ck-ta-g">([\s\S]*?)<\/summary><p class="ck-ta-s" id="ck-ta-s-palissage">([\s\S]*?)<\/p>/.exec(H.t);
    return [!!m && /^Palissage −65,7.%$/.test(texte(m[1])) && /ck-ta-v vite hors/.test(m[1]) && /^210.h de barème, 72.h réelles$/.test(m[2]) && (H.t.match(/<li class="ck-ta"/g) || []).length === 1
      && H.t.includes('<div class="ck-ta-ax ck-ta-g" aria-hidden="true"><span></span><span><span>plus rapide</span><span>plus lent</span></span><span></span></div>') && /Écart par tâche/.test(texte(H.t)) && !H.t.includes('class="ck-cadre"'), m ? texte(m[1]) + ' | ' + m[2] : 'absent']; });
  // ③ le lexique
  const visible = texte([H.v, H.k, H.p, H.a, H.t].join(' '));
  T('③ les mots du lexique : « coût à la fin », « engagé » — plus « atterrissage », « dépensé » ni « payé » à l’écran', /Coût à la fin/.test(visible) && /engagé/.test(visible) && !/[Aa]tterrissage|dépensé|Dépensé/.test(visible) && !/[Aa]tterrissage/.test(V.slice(V.indexOf('function htmlEVerdict'), V.indexOf('function majPostes')).replace(/btnI\('atterrissage'/g, '').replace(/INFO_PLUS\.atterrissage/g, '')), visible.slice(0, 200));
  const info = (k) => (S.vue.match(new RegExp('^ {2}' + k + ": '.*',$", 'm')) || [''])[0];
  T('③ … les bulles « i » aussi, et elles disent ce qui a quitté les cartes', /^ {2}atterrissage: 'Le coût à la fin de l’onglet Économie : ce qui est déjà engagé/.test(info('atterrissage')) && /la partie pleine est l’engagé, le losange le coût à la fin/.test(info('atterrissage'))
    && /^ {2}coutha: 'Le coût à la fin de la campagne, divisé/.test(info('coutha')) && /Tant que l’engagé reste sous le fait/.test(info('echart')) && /Sous la barre : engagé \/ budget\. Toucher un poste dit son détail/.test(info('postes'))
    && /De la plus chère à la moins chère/.test(info('apps')) && /Le total de la carte « Écart par tâche »/.test(info('ecart')) && !/atterrissage|dépensé|payé/.test([info('atterrissage'), info('coutha'), info('echart'), info('postes')].join(' ').replace(/^ {2}atterrissage:/, '')));
  T('③ … la bulle du graphe, au survol, parle comme la légende', S.vue.includes(`<i class="pt-fait"></i>fait ' + nb(fa) + '\\u202f%</span><span><i class="pt-dep"></i>engagé ' + nb(de) + '\\u202f%</span>'`));
  // ④ rien n'est recalculé
  essai('④ les mêmes chiffres du modèle : l’écart d’un poste, sa barre et son trait ne changent pas', () => { const l = M.ligneMO(r), t = M.ligneTot(r), h = M.lignePoste(l);
    return l.budget === 15447 && l.dep === 1888 && l.att === 14980 && t.budget === 15784 && t.dep === 1940 && t.att === 15317 && /<i class="bud" style="width:9\d\.\d%">/.test(h) && /class="att" id="ck-po-a-mo" style="left:9\d\.\d%"/.test(h) && /class="ck-po-d ok">−467.€</.test(h); });
  T('④ les calculs de la mise à jour ne sont pas touchés : la frise, les barres, les tâches', V.includes('const ech = Math.max(r.budget, r.att) * 1.04, f = v => Math.max(0, Math.min(100, v / ech * 100))') && V.includes("q('.ck-fr-fin').style.left = f(r.att) + '%';")
    && V.includes('const echPoste = l => Math.max(l.budget, l.att || 0, l.dep) * 1.06 || 1;') && V.includes('const taBarre = e => ({ w: Math.min(TA_ECH, Math.abs(e)) / TA_ECH * 50, hors: Math.abs(e) > TA_ECH });'));
  // ⑤ la feuille, l'aide, le guide, l'annonce, les versions
  T('⑤ les règles du lot sont dans aujourdhui.css, pas dans styles.css', C.includes('★★★ MOTS-7 (§589)') && !S.css.includes('MOTS-7 (§589) — LA VUE') && !/\.ck-ev-rep|\.ck-e-chf|\.ck-po-q|\.ck-ap-z|\.ck-dp\b/.test(S.css));
  T('⑤ les règles mortes de la vue Économie ont quitté styles.css', !/\.ck-ek-calme|\.ck-gr-leg|\.ck-ap-c\b|\.ck-ap-b\b|\.ck-e-lf|\.ck-fr-mdep em/.test(S.css) && Buffer.byteLength(S.css) <= 1024 * 1024);
  T('⑤ … mais l’« Objectif » de la frise Terrain garde sa place, sous le trait (la règle est partagée : MOTS-7 l’avait retirée, la capture de démo l’a vu)', S.css.includes('.ck-fr-visee em{top:44px;transform:translateX(calc(-100% + 4px))}') && S.vue.includes("'<span class=\"ck-fr-mk ck-fr-visee\"><em>Objectif</em></span>'"));
  T('⑤ une ligne qui se déplie se touche sur 44 px : un poste, une appellation, une tâche', C.includes('.ck2 .ck-po .ck-dp>summary,.ck2 .ck-po div.ck-dp{display:flex;flex-direction:column;justify-content:center;min-height:44px}')
    && /\.ck2 summary\.ck-ap-h\{[^}]*min-height:44px\}/.test(C) && /\.ck2 \.ck-ta-g\{[^}]*min-height:44px\}/.test(C) && /\.ck2 \.ck-ap-z summary\{[^}]*min-height:44px/.test(C));
  T('⑤ dans une tuile étroite, la pastille passe sur deux lignes plutôt que de sortir ; la barre d’une appellation tient dans sa colonne', C.includes('.ck2 .ck-ek .ck-ph-pst{height:auto;min-height:24px;') && C.includes('.ck2 .ck-ap-h .ck-barre{grid-column:auto}'));
  T('⑤ l’aide du Pilotage dit les mots et le geste', /photo économique du jour : le coût à la fin de la campagne/.test(S.uti) && /toucher un poste, une appellation ou une tâche déplie son détail/.test(S.uti) && /les appellations \(de la plus chère à la moins chère\)/.test(S.uti));
  T('⑤ le guide aussi', /Le <b>coût à la fin<\/b> y est la fin projetée de l'onglet Économie/.test(S.guide) && /toucher un poste, une appellation ou une tâche déplie son détail/.test(S.guide) && /est le total de la carte « Écart par tâche »/.test(S.guide) && !/atterrissage/.test(S.guide));
  const wn = S.wn.slice(S.wn.indexOf("  { v: '11.17',"), S.wn.indexOf("  { v: '11.16',"));
  T('⑤ l’annonce 11.17 : pour l’admin, sans « & », et dit « Aucun calcul ne change »', wn.length > 300 && /pour: \['admin'\], emoji: 'euro', titre: 'Aujourd’hui, vue Économie\\u00a0: les mêmes cartes, moins de mots'/.test(wn) && !/titre: '[^']*&/.test(wn) && /Aucun calcul ne change\./.test(wn) && /Coût à la fin/.test(wn));
  const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1] || '0', nApp = parseFloat(app);
  T('⑤ les versions : APP 11.17 au moins, partout la même ; le service worker dit le lot', nApp >= 11.17 && (S.idx.match(new RegExp('v' + app.replace('.', '\\.') + '\\b', 'g')) || []).length >= 4 && S.idx.includes('/boot.js?v=' + app)
    && S.sw.includes('// v12.08 (17/11/2026) — MOTS-7 (§589)') && /const CACHE_NAME {3}= 'mavigne-v(\d+\.\d+)';/.test(S.sw) && parseFloat(S.sw.match(/const CACHE_NAME {3}= 'mavigne-v(\d+\.\d+)';/)[1]) >= 12.08, app);
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  const rt = ref && ref.mesures && ref.mesures['téléphone'] && ref.mesures['téléphone']['Pilotage › Aujourd’hui › Économie'], ro = ref && ref.mesures && ref.mesures['ordinateur'] && ref.mesures['ordinateur']['Pilotage › Aujourd’hui › Économie'];
  T('⑤ la référence des mots est regravée : la vue Économie à 125 mots au plus au téléphone (243 avant), 130 sur ordinateur (249 avant), un seul mot hors lexique (la date longue de la tête)', !!rt && !!ro && rt.mots <= 125 && ro.mots <= 130 && rt.lex <= 1 && ro.lex <= 1, JSON.stringify([rt, ro]));
  T('⑤ la maquette validée est au dépôt, et dite au LISEZMOI avec son écart de mot', /Pilotage › Aujourd’hui, vue Économie, maquette v1/.test(S.maq) && /`maquette-aujourdhui-economie-v1\.html` — Pilotage › Aujourd’hui, vue Économie allégée/.test(S.lm) && /la maquette écrit « dépensé », le code « engagé »/.test(S.lm));
  T('⑤ ce harnais et ses contre-épreuves sont dans la liste', S.liste.includes("['node scripts/mv-harnais-mots7.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots7.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-7 (§589) — Pilotage › Aujourd’hui, la vue Économie allégée\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['une carte quitte l’écran (par appellation)', sur('vue', "  $('#ck-eapp').innerHTML = htmlApps(R);\n", '')],
    ['sur ordinateur, les quatre chiffres changent de colonne', sur('vue', "e: { large: [['ever', 'ekpi'], ['echart', 'etac'], ['epos', 'eapp']],", "e: { large: [['ever'], ['echart', 'etac', 'ekpi'], ['epos', 'eapp']],")],
    ['la grande phrase revient', sur('vue', `'<h2 class="ck-v-phrase ck-ev-ph"><span class="ck-roule" id="ck-ev-att">`, `'<h2 class="ck-v-phrase ck-ev-ph">La campagne devrait coûter <span class="ck-roule" id="ck-ev-att">`)],
    ['les étiquettes reviennent sur les repères de la barre', sur('vue', '<span class="ck-fr-mk ck-fr-fin"></span>', '<span class="ck-fr-mk ck-fr-fin"><em id="ck-ef-att"></em></span>')],
    ['« dépensé » revient sous la barre', sur('vue', '<span>engagé <b id="ck-ef-dep"></b></span>', '<span>dépensé <b id="ck-ef-dep"></b></span>')],
    ['« Exporter » perd son nom long', sur('vue', 'data-fn="export" aria-label="Exporter pour la compta">Exporter</button>', 'data-fn="export">Exporter</button>')],
    ['la phrase de suite revient à côté du montant', sur('vue', "sous.textContent = e0 === 0 ? 'pile dans le budget' : e0 > 0 ? eur(e0) + ' sous le budget' :", "sous.textContent = e0 === 0 ? 'pile dans le budget' : e0 > 0 ? eur(e0) + ' sous le budget de ' + eur(r.budget) + ', le travail restant compté au barème' :")],
    ['sur quoi repose le reste ne va nulle part', sur('vue', "  INFO_PLUS.atterrissage = [r.cadAppl ?", "  const _x = [r.cadAppl ?")],
    ['la phrase revient sous la cadence', sur('vue', `'<span id="ck-ek-cad-c">il en faut ' + nb(r.besoin) + '</span>', 'cadence')`, `'<span id="ck-ek-cad-c">il en faut ' + nb(r.besoin) + ' pour finir le 28 février</span>', 'cadence')`)],
    ['les noms longs reviennent sur les tuiles', sur('vue', "k('cadence', 'Cadence',", "k('cadence', 'Cadence de l’équipe',")],
    ['l’écart au barème perd sa couleur', sur('vue', `'<b id="ck-ek-ec" class="' + ecCls(r) + '">'`, `'<b id="ck-ek-ec">'`)],
    ['un écart plus lent se colore comme un plus rapide', sur('vue', "r.ecartMoy > 0 ? 'lent' : 'vite';", "r.ecartMoy > 0 ? 'vite' : 'vite';")],
    ['« rien à rattraper » redevient un gros titre', sur('vue', `calme ? '<span class="ck-ph-pst ok">rien à rattraper</span>'`, `calme ? '<b class="ck-ek-calme">Rien à rattraper</b>'`)],
    ['le pourquoi du calme ne va nulle part', sur('vue', "  INFO_PLUS.inaction = [calme ? 'Aujourd’hui, les travaux tiennent dans leurs fenêtres.'", "  const _y = [calme ? 'Aujourd’hui, les travaux tiennent dans leurs fenêtres.'")],
    ['un retard perd son coût', sur('vue', "calme ? '' : 'env. ' + eur100(x.eur) + (x.horsDelai ? ' · ' + x.horsDelai + ' hors délai' : ''), 'inaction')", "'', 'inaction')")],
    ['la légende revient sous le graphe', sur('vue', `    + '<div class="ck-gr" id="ck-egr"></div>';`, `    + '<div class="ck-gr" id="ck-egr"></div><div class="ck-gr-leg">Travail fait</div>';`)],
    ['les deux parts du jour ne sont plus écrites', sur('vue', "if (cf) cf.textContent = nb(z.fait) + '\\u202f%';", '')],
    ['le graphe ne dit plus la fin prévue', sur('vue', "  $('#ck-e-lt').textContent = 'fin prévue ' + dCourt(fin);\n", '')],
    ['l’étiquette du graphe sort du cadre à droite', sur('vue', 'const droite = xf + 168 < c.w - c.padR,', 'const droite = true,')],
    ['un poste reprend ses trois lignes', sur('vue', "(det ? '<details class=\"ck-dp\"><summary>' + tete + '</summary><p class=\"ck-po-s\">' + esc(det) + '</p></details>'", "(det ? '<div class=\"ck-dp\">' + tete + '<p class=\"ck-po-s\">' + esc(det) + '</p></div>'")],
    ['le détail d’un poste disparaît', sur('vue', "const det = [barre ? '' : gauche, l.note || ''].filter(Boolean).join(' · ');", "const det = '';")],
    ['« engagé / budget » disparaît de la ligne d’un poste', sur('vue', "'<span class=\"ck-po-q\">' + esc(gauche) + '</span></div>'", "'</div>'")],
    ['« toute la campagne » perd sa barre', sur('vue', "const ligneTot = r => ({ id: 'tot', nom: 'Toute la campagne', ref: 'ecart',", "const ligneTot = r => ({ id: 'tot', nom: 'Toute la campagne', ref: '',")],
    ['la barre de « toute la campagne » ne s’anime plus', sur('vue', 'fixe(ligneMO(r)); fixe(ligneTot(r));', 'fixe(ligneMO(r));')],
    ['l’écart d’un poste est recalculé autrement', sur('vue', "droite = ecartTxt(l.att - l.budget); cls = Math.round(l.att - l.budget) <= 0 ? 'ok' : 'ko';", "droite = ecartTxt(l.dep - l.budget); cls = Math.round(l.att - l.budget) <= 0 ? 'ok' : 'ko';")],
    ['les appellations reprennent l’ordre du domaine', sur('vue', "const tri = LA.filter(a => r.a[a.id].coutHa > 0).sort((x, y) => r.a[y.id].coutHa - r.a[x.id].coutHa), hi = tri[0], lo = tri[tri.length - 1];", "const tri = LA.filter(a => r.a[a.id].coutHa > 0), hi = tri[1], lo = tri[0];")],
    ['la surface d’une appellation disparaît', sur('vue', "+ '<p class=\"ck-ap-s\">' + haTxt(x.ha) + ' en production</p></details></li>';", "+ '</details></li>';")],
    ['les appellations sans travail reprennent une ligne chacune', sur('vue', "(sans.length ? '<li class=\"ck-ap ck-ap-z\"><details class=\"ck-dp\"><summary><span>' + sans.length + ' sans travail validé</span>'", "(sans.length ? sans.map(a => '<li class=\"ck-ap\">' + esc(a.nom) + '</li>').join('') + '<li class=\"ck-ap ck-ap-z\"><details class=\"ck-dp\"><summary><span>' + sans.length + ' sans travail validé</span>'")],
    ['une vigne arrachée entre dans la liste', sur('vue', 'const LA = APPS.filter(a => r.a[a.id] && r.a[a.id].ha > 0);', 'const LA = APPS.filter(a => r.a[a.id]);')],
    ['la note de trois lignes revient sous les appellations', sur('vue', "'<p class=\"ck-ap-note\"><b>+' + ecart + '\\u00a0%</b><span>de ' + esc(lo.nom) + ' à ' + esc(hi.nom) + '</span></p>'", "'<p class=\"ck-ap-note\">' + esc(INFO_PLUS.apps[0]) + '</p>'")],
    ['la phrase de l’écart entre appellations ne va nulle part', sur('vue', "  INFO_PLUS.apps = ecart ? [nomHaut + ' a demandé '", "  const _z = ecart ? [nomHaut + ' a demandé '")],
    ['la phrase de la bulle est échappée deux fois (esc, puis ouvrirInfo)', sur('vue', "const nomHaut = hi ? String(hi.nom) : '', nomBas = lo ? String(lo.nom) : '';", "const nomHaut = hi ? esc(hi.nom) : '', nomBas = lo ? esc(lo.nom) : '';")],
    ['les heures d’une tâche reviennent sous sa barre', sur('vue', "'</span></summary>'\n        + '<p class=\"ck-ta-s\" id=\"ck-ta-s-' + t.id + '\">' + taHeures(x) + '</p></details></li>';", "'</span><span class=\"ck-ta-s\" id=\"ck-ta-s-' + t.id + '\">' + taHeures(x) + '</span></summary></details></li>';")],
    ['l’échelle reprend son mot du milieu', sur('vue', '<span><span>plus rapide</span><span>plus lent</span></span>', '<span><span>plus rapide</span><span>barème</span><span>plus lent</span></span>')],
    ['« atterrissage » revient à l’écran', sur('vue', "'<div class=\"ck-v-haut\"><span class=\"ck-v-k\">Coût à la fin' + btnI('atterrissage',", "'<div class=\"ck-v-haut\"><span class=\"ck-v-k\">Atterrissage de la campagne' + btnI('atterrissage',")],
    ['« dépensé » revient au-dessus du graphe', sur('vue', '<i class="lg-mes"></i>engagé <b id="ck-e-cd"></b>', '<i class="lg-mes"></i>dépensé <b id="ck-e-cd"></b>')],
    ['une bulle « i » garde « payé »', sur('vue', "la partie pleine l’engagé, le trait le coût à la fin ; à droite, l’écart au budget.", "la partie pleine ce qui est payé, le trait le coût à la fin ; à droite, l’écart au budget.")],
    ['la bulle du graphe garde ses vieux mots', sur('vue', "<i class=\"pt-dep\"></i>engagé ' + nb(de)", "<i class=\"pt-dep\"></i>Budget dépensé : ' + nb(de)")],
    ['l’échelle de la frise change', sur('vue', 'const ech = Math.max(r.budget, r.att) * 1.04,', 'const ech = Math.max(r.budget, r.att) * 1.5,')],
    ['le bloc du lot retourne dans styles.css', (S) => ({ ...S, css: S.css + S.auj.slice(S.auj.indexOf('★★★ MOTS-7 (§589)')) })],
    ['une règle morte revient dans styles.css', (S) => ({ ...S, css: S.css + '\n.ck-ek-calme{color:red}' })],
    ['l’« Objectif » de la frise Terrain perd sa place', sur('css', '.ck-fr-visee em{top:44px;transform:translateX(calc(-100% + 4px))}\n', '')],
    ['une appellation ne se touche plus sur 44 px', sur('auj', '.ck2 summary.ck-ap-h{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(40px,1fr) auto;align-items:center;gap:var(--e-3,12px);min-height:44px}', '.ck2 summary.ck-ap-h{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(40px,1fr) auto;align-items:center;gap:var(--e-3,12px)}')],
    ['la barre d’une appellation reprend toute la ligne', sur('auj', '.ck2 .ck-ap-h .ck-barre{grid-column:auto}', '')],
    ['la pastille sort de sa tuile', sur('auj', '.ck2 .ck-ek .ck-ph-pst{height:auto;min-height:24px;', '.ck2 .ck-ek .ck-ph-pst-x{height:auto;min-height:24px;')],
    ['l’aide garde « atterrissage »', sur('uti', 'photo économique du jour : le coût à la fin de la campagne', 'photo économique du jour : l’atterrissage de la campagne')],
    ['le guide garde « atterrissage »', sur('guide', "Le <b>coût à la fin</b> y est la fin projetée de l'onglet Économie", "L'<b>atterrissage</b> y est la fin projetée de l'onglet Économie")],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("emoji: 'euro', titre: 'Aujourd’hui, vue Économie"); if (i < 0) throw new Error('motif absent : annonce'); const j = S.wn.lastIndexOf("pour: ['admin']", i); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.08 (17/11/2026) — MOTS-7 (§589)', '// v12.08 (17/11/2026) — divers')],
    ['la référence des mots garde l’ancienne vue Économie', (S) => { const r = JSON.parse(S.ref); r.mesures['téléphone']['Pilotage › Aujourd’hui › Économie'].mots = 243; return { ...S, ref: JSON.stringify(r) }; }],
    ['la référence garde les mots hors lexique', (S) => { const r = JSON.parse(S.ref); r.mesures['ordinateur']['Pilotage › Aujourd’hui › Économie'].lex = 3; return { ...S, ref: JSON.stringify(r) }; }],
    ['la maquette n’est pas dite au LISEZMOI', sur('lm', '`maquette-aujourdhui-economie-v1.html`', '`maquette-x.html`')],
    ['le harnais sort de la liste', sur('liste', "['node scripts/mv-harnais-mots7.mjs --contre']", "['node scripts/mv-harnais-mots7.mjs']")],
  ];
  let fuites = 0;
  console.log('\nMOTS-7 — contre-épreuves : chaque mutation doit rougir\n');
  for (const [nom, f] of mutants) {
    let rouge = false, note = '';
    try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { note = ' (' + e.message + ')'; rouge = !/motif absent/.test(e.message); if (!rouge) note += ' — MOTIF ABSENT'; }
    if (!rouge) fuites++;
    console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit : ' : '\x1b[31m✗ RESTE VERT : \x1b[0m') + nom + note);
  }
  console.log('\n' + (fuites ? '\x1b[31mROUGE\x1b[0m — ' + fuites + ' contre-épreuve(s) sans effet' : '\x1b[32mVERT\x1b[0m — ' + mutants.length + ' contre-épreuves rougissent'));
  process.exit(fuites ? 1 : 0);
}
