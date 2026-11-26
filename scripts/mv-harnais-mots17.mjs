/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-17 (§612) : LE BALAYAGE — LES PHRASES ISOLÉES DE PLANNING, VIGNE ET TRACTEUR
   Lancer :          node scripts/mv-harnais-mots17.mjs
   Contre-épreuves : node scripts/mv-harnais-mots17.mjs --contre

   POURQUOI IL EXISTE
   Le dernier lot du plan « Moins de texte » (§580) : six phrases isolées, sans écran à redessiner (Réglages n'en a aucune).
   Mesuré (démo, 25/11) : Planning › Année portait trois notes de mode d'emploi (44, 26 et 18 mots) et dépliait ses 9 fériés,
   308 mots ; Vigne › Stades, une ligne de méthode en tête de « Ce qui vient » et, en saison, 30 mots de seuils en pied ;
   Tracteur › Entretien, deux phrases qui disaient un geste au lieu de l'offrir. Hors plan, la seule phrase longue de
   l'Accueil (16 mots). Maquette refaite en v2 à la demande de Nico, validée (« go », 25/11) avec ses sept recommandations :
   docs/maquettes/maquette-balayage-v2.html.

   CE QU'IL GARDE
   ① Planning › Année : « Dimanches travaillés » seul sous Le cadre ; le mode d'emploi derrière « Régler la frise ? » (au bout
      de la rangée de l'admin) ; la note du rythme dans le « i » de « Changer le rythme à partir d'ici », sa date comprise ;
   ② les fériés, JOUÉS (la vraie _planAnneeFeriesBloc) : le « i » sur « N fériés portent des heures », la règle de l'année
      dans la fiche vivante (2026 : 0 h au modèle ; base active : compte pour ses heures), plus à l'écran ; la liste repliée,
      ouverte pendant un brouillon ;
   ③ Vigne › Stades : la carte sans la méthode ni les seuils, le « i » au titre ; « Températures de la dernière lecture » reste ;
   ④ Tracteur › Entretien, JOUÉ : « + Autre entretien » seul quand rien n'est réglé, la carte et son titre dès un entretien,
      l'exemple dans le champ Nom ; « intervalle ? » sur la ligne de la révision, qui ouvre le crayon, pour qui peut régler ;
   ⑤ l'Accueil : 9 mots ; les fiches « i », le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const APP = 'src/' + 'app' + '.js';
const S0 = { ann: lire('src/planning-annee.js') + '\n' + lire('src/planning-annee-vue.js'),   // ANNEE-3 (§614) : la vue, sortie de planning-annee.js
  mod: lire('src/planning-modeles.js'), app: lire(APP), cpt: lire('src/compteur.js'), trac: lire('src/tracteur.js'),
  uti: lire('src/utils.js'), css: lire('src/styles.css'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'),
  gp: lire('guide/10-planning.html'), gv: lire('guide/04-vigne.html'), gt: lire('guide/06-tracteur.html'), liste: lire('scripts/mv-harnais-liste.mjs'),
  lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-balayage-v2.html') };
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('introuvable : ' + nom);
  let k = src.indexOf('{', i), p = 0, q = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; }
    if (c === '/' && src[k + 1] === '*') { k = src.indexOf('*/', k) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') p++; else if (c === '}') { p--; if (p === 0) return src.slice(i, k + 1); }
  }
  throw new Error('fin introuvable : ' + nom);
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const texte = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const IBTN = (k) => '<button type="button" class="mv-i" data-mvi="' + k + '"></button>';

// Les fériés de l'année : la vraie _planAnneeFeriesBloc, les fériés donnés.
function feries(S, o) {
  const set = {};
  const F = o.F || [{ m: 0, d: 1, g: 3, nom: 'Jour de l’An', h: 7, we: false, sol: false, saison: 7 }, { m: 4, d: 1, g: 4, nom: 'Fête du Travail', h: 7, we: false, sol: false, saison: 7 },
    { m: 7, d: 15, g: 5, nom: 'Assomption', h: 0, we: true, sol: false, saison: 0 }];
  const ctx = { _escHtml: esc, _escAttr: esc, _paH: (h) => h + '\u00a0h', _mvInfoBtn: IBTN, _mvInfoSet: (k, f) => { set[k] = f; }, _planAnneeFeries: () => F, _planBaseActive: () => !!o.base,
    window: { PLAN_MOIS_FR: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] } };
  vm.createContext(ctx);
  vm.runInContext(fonction(S.mod, '_planAnneeFerieDate') + '\n' + fonction(S.mod, '_planAnneeFeriesBloc') + '\nthis.bloc=_planAnneeFeriesBloc;', ctx);
  return { h: ctx.bloc({}, 'standard', o.yr || 2026, true, !!o.ouvert), set };
}
// Les autres entretiens : la vraie _trEntProgHtml (et son formulaire), l'état des entretiens en bouchon.
function entretiens(S, L, o) {
  o = o || {};
  const ctx = { isAdmin: () => o.adm !== false, isTractoriste: () => false, _mvIcon: () => '', _escHtml: esc, _escAttr: esc, _gnrField: (i) => '<input id="' + i + '">', _gnrNum: (n) => String(n),
    _fmtDate: (d) => d, _trEntEtat: () => ({ connu: false }), _trEntTexte: () => 'jamais noté', _trEntIntervalle: () => 'toutes les 500 h', _entProgEdit: o.edit || null };
  vm.createContext(ctx);
  vm.runInContext(fonction(S.cpt, '_trEntForm') + '\n' + fonction(S.cpt, '_trEntProgHtml') + '\nthis.h=_trEntProgHtml;', ctx);
  return ctx.h({ entretiens_prog: L });
}
// La révision : la vraie _revCardHtml, le compteur estimé en bouchon.
function revision(S, t, o) {
  o = o || {};
  const ctx = { isAdmin: () => o.edit !== false, isTractoriste: () => false, _revEdit: false, _mvIcon: () => '', _escHtml: esc, _gnrField: () => '', _gnrNum: (n) => String(n),
    _trCompteur: () => ({ h: 482, base: null }), _trHeuresTxt: (k) => k.h + ' h', _trRevEtat: () => null, _fmtDate: (d) => d, _trHeuresFr: (n) => String(n), _trDateAn: (d) => d };
  vm.createContext(ctx);
  vm.runInContext(fonction(S.trac, '_revCardHtml') + '\nthis.h=_revCardHtml;', ctx);
  return ctx.h(t);
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };

  // ①
  // ANNEE-2 (§613) : la vue de l'année est refaite — le cadre et ses dimanches vivent dans le panneau des contrôles, « Régler la frise ? »
  //   dans le menu « … » de la barre (après Exporter), plus au bout de la rangée de l'admin.
  T('① sous Le cadre, « Dimanches travaillés » seul : le mode d’emploi a quitté l’écran',
    S.ann.includes("<span class=\"anv-ln-n\">Dimanches travaill\\u00e9s</span><span class=\"anv-ln-s\">'+(C.dim||'aucun')+'</span></div>'")
    && !S.ann.includes('R\\u00e8gle une saison avec') && !S.ann.includes('se r\\u00e8gle jour par jour plus haut'));
  T('① « Régler la frise ? » dans le menu « … » de la barre, après Exporter (ANNEE-2), dans le style du menu',
    S.ann.includes("'<button type=\"button\" class=\"anv-menu-l\" role=\"menuitem\" data-mvi=\"plan.frise\">R\\u00e9gler la frise\\u00a0?<span>le mode d\\u2019emploi</span></button>'")
    && S.ann.indexOf('data-mvi="plan.frise"') > S.ann.indexOf('planExportCSV(this.dataset.pl)')
    && !S.css.includes('#page-planning .pa-aide{margin-left:auto;align-self:center}'));
  T('① le rythme : la note dans le « i » du titre (sa date en gras), plus sous le titre ; le « i » ne replie pas la section (règle des pastilles)',
    S.ann.includes("_mvInfoSet('plan.rythme',{ p:['Les jours r\\u00e9guliers de la saison, de cette semaine'+(finS>=0?' jusqu\\u2019au <b>'+_planAnneeDate(J,finS,true)+'</b>':'')")
    && S.ann.includes("<span>Changer le rythme \\u00e0 partir d\\u2019ici</span>'+_mvInfoBtn('plan.rythme')+'</div>'") && !S.ann.includes('line-height:1.5;margin:4px 0">Les jours r')
    && S.ann.includes("import { isAdmin, _escHtml, _escAttr, _mvInfoBtn, _mvInfoSet } from './utils.js';"));

  // ②
  essai('② 2026 : « 2 fériés portent des heures. » et son « i » ; la règle de 2026 dans la fiche, plus à l’écran ; la liste repliée', () => {
    const r = feries(S, { yr: 2026 }), f = r.set['plan.feries'];
    return [r.h.includes('<b>2 fériés portent des heures.</b> <button type="button" class="mv-i" data-mvi="plan.feries">') && !/Chômé, un férié/.test(r.h)
      && !!f && /vaut 0 h au modèle en 2026/.test(f.p[0]) && /majoration comprise/.test(f.p[0]) && r.h.includes('<details style="margin-top:8px">'), r.h.slice(0, 500)];
  });
  essai('② la base active (2027) : la fiche dit « compte quand même pour ses heures prévues »', () => {
    const f = feries(S, { yr: 2027, base: true }).set['plan.feries'];
    return [!!f && /compte quand même pour ses heures prévues/.test(f.p[0]) && !/0 h au modèle/.test(f.p[0]), f && f.p[0]];
  });
  essai('② pendant un brouillon, la liste s’ouvre (le tuto « Travailler un férié » en a besoin)', () => feries(S, { ouvert: true }).h.includes('<details open style="margin-top:8px">'));
  essai('② aucun férié avec des heures : ni « i », ni fiche', () => {
    const r = feries(S, { F: [{ m: 7, d: 15, g: 5, nom: 'Assomption', h: 0, we: true, sol: false, saison: 0 }] });
    return [!r.h.includes('plan.feries') && !r.set['plan.feries'] && r.h.includes('Aucun férié n’est travaillé au modèle.'), r.h.slice(0, 300)];
  });

  // ③
  T('③ Stades : la carte sans la méthode ni les seuils ; le « i » au titre « Ce qui vient »',
    S.app.includes("var tete='<div class=\"mvcarte phr-resume\" id=\"phr-cqv\"><div class=\"phr-ct2\">Ce qui vient '+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('phr.dj'):'')+'</div>';")
    && !S.app.includes('mod\\u00e8le GFV (Parker et al.') && !S.app.includes('Seuils publi\\u00e9s\\u00a0: Pinot noir'));
  T('③ « Températures de la dernière lecture » reste à l’écran quand c’est le cas',
    S.app.includes("if(T.vieux) h+='<div class=\"phr-m phr-cqv-pied\">Temp\\u00e9ratures de la derni\\u00e8re lecture.</div>';"));

  // ④
  essai('④ rien de réglé : « + Autre entretien » seul, sans carte ni phrase', () => {
    const h = entretiens(S, []);
    return [h === '<div class="ent-prog ep-seul"><button type="button" class="mvbtn mvbtn-secondaire ep-btn" onclick="_trEntEdit(\'nouveau\')">+ Autre entretien</button></div>' && !/Vidange de pont/.test(h), h];
  });
  essai('④ un entretien réglé : la carte, son titre, le bouton « + Autre entretien » ; l’ouvrier sans rien de réglé ne voit rien', () => {
    const h = entretiens(S, [{ id: 'e1', nom: 'Vidange pont', tous_h: 500 }]), v = entretiens(S, [], { adm: false });
    return [texte(h).startsWith('Autres entretiens + Autre entretien Vidange pont') && h.includes('class="ent-resume-card ent-prog"') && v === '', texte(h)];
  });
  essai('④ « + Autre entretien » ouvre le formulaire : l’exemple est dans le champ Nom', () => {
    const h = entretiens(S, [], { edit: 'nouveau' });
    return [h.includes('placeholder="ex. Vidange pont et boîte"') && !h.includes('ep-seul') && !h.includes('>+ Autre entretien<'), h.slice(0, 300)];
  });
  essai('④ intervalle manquant : la pastille « intervalle ? » sur la ligne de la révision ouvre le crayon ; plus de phrase', () => {
    const h = revision(S, { nom: 'T1', compteur_h: 482, revision_h: 500 });
    return [h.includes('482 h / 500 h <button type="button" class="mv-pq rel-iv" onclick="window.openRevEdit()" aria-label="Régler l’intervalle des révisions">intervalle ?</button></div>')
      && !/régler au crayon/.test(h), texte(h)];
  });
  essai('④ intervalle réglé : la ligne de l’intervalle, pas de pastille ; sans droit de régler : pas de pastille', () => {
    const a = revision(S, { nom: 'T1', compteur_h: 482, revision_h: 500, rev_h: 500 }), b = revision(S, { nom: 'T1', compteur_h: 482, revision_h: 500 }, { edit: false });
    return [texte(a).includes('Toutes les 500 h') && !a.includes('rel-iv') && !b.includes('rel-iv'), texte(a) + ' | ' + texte(b)];
  });
  T('④ la pastille garde son allure malgré l’habillage des boutons de carte du Tracteur ; le bouton seul a sa largeur',
    S.css.includes('#page-tracteur .ent-resume-card button.mv-pq{ border:1px solid var(--or)!important;') && S.css.includes('.ent-prog.ep-seul .ep-btn{width:100%;justify-content:center}'));

  // ⑤
  T('⑤ l’Accueil : « Vos compteurs partent à la première validation. »',
    S.app.includes('<span><b>Votre saison commence.</b> Vos compteurs partent \\u00e0 la premi\\u00e8re validation.</span>') && !S.app.includes('lancera vos compteurs'));
  T('⑤ les quatre fiches : la frise (ses heures en tête de la vue, ‹ et ›), le rythme et les fériés (repli honnête), les degrés-jours (GFV, seuils, prévision)',
    S.uti.includes("'plan.frise': { t: 'Régler la frise'") && S.uti.includes('en touchant ses heures, en tête de la vue (‹ et › pour la voisine)')
    && S.uti.includes("'plan.rythme': { t: 'Changer le rythme à partir d’ici'") && S.uti.includes("'plan.feries': { t: 'Les fériés qui portent des heures'")
    && S.uti.includes("'phr.dj': { t: 'Les degrés-jours'") && S.uti.includes('le <b>modèle GFV</b> (Parker et al. 2011, 2013)')
    && S.uti.includes('Pinot noir <b>1\\u00a0219</b> et <b>2\\u00a0511\\u00a0°C·j</b>, Chardonnay <b>1\\u00a0217</b> et <b>2\\u00a0541</b> — la pleine floraison, puis la véraison.')
    && S.uti.includes('Au-delà des 16 jours de prévision, la moyenne des dix dernières années.'));
  T('⑤ le guide : « Régler la frise ? » (menu « … », ANNEE-2), « Chômer les N », le « i » de « Ce qui vient », « intervalle ? », « + Autre entretien »',
    S.gp.includes('le mode d\'emploi « Régler la frise ? »') && S.gp.includes('« Chômer les N » les chôme d\'un geste')   // ANNEE-2 (§613) : le guide de l'année réécrit — le mode d'emploi dans le menu « … », les fériés dans les contrôles
    && S.gv.includes('La méthode et les seuils sont dans le « i » de « Ce qui vient »') && S.gt.includes('la pastille <b>« intervalle ? »</b>') && S.gt.includes('par <b>« + Autre entretien »</b>'));
  const iW = S.wn.indexOf("{ v: '11.33'"), jW = S.wn.indexOf("{ v: '11.32'");
  T('⑤ l’annonce 11.33, pour l’administrateur seulement', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin']") && S.wn.slice(iW, jW).includes('Régler la frise'));
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑤ les versions : APP 11.33 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.33 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && S.sw.includes('// v12.24 (25/11/2026) — MOTS-17 (§612)'));
  T('⑤ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('Le balayage') && S.lm.includes('maquette-balayage-v2.html'));
  T('⑤ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots17.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots17.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-17 (§612) — Le balayage : Planning, Vigne, Tracteur\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 600) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['le mode d’emploi revient sous Le cadre', sur('ann', "+(C.dim||'aucun')+'</span></div>'", "+(C.dim||'aucun')+'. R\\u00e8gle une saison avec \\u2212 et +.</span></div>'")],
    ['« Régler la frise ? » disparaît', sur('ann', "'<button type=\"button\" class=\"anv-menu-l\" role=\"menuitem\" data-mvi=\"plan.frise\">R\\u00e9gler la frise\\u00a0?<span>le mode d\\u2019emploi</span></button>'", "''")],
    ['la note du rythme revient sous le titre', sur('ann', "+_mvInfoBtn('plan.rythme')+'</div>'", "+_mvInfoBtn('plan.rythme')+'</div><div style=\"font-size:var(--pt-micro,11px);color:var(--texte-doux);line-height:1.5;margin:4px 0\">Les jours r\\u00e9guliers</div>'")],
    ['le rythme perd sa date', sur('ann', "' jusqu\\u2019au <b>'+_planAnneeDate(J,finS,true)+'</b>'", "''")],
    ['la règle des fériés revient à l’écran', sur('mod', "des heures.</b> '+_mvInfoBtn('plan.feries')", "des heures.</b> Ch\\u00f4m\\u00e9, un f\\u00e9ri\\u00e9 vaut 0 h.'+_mvInfoBtn('plan.feries')")],
    ['la fiche des fériés ignore la base de l’année', sur('mod', "_mvInfoSet('plan.feries',{ p:[_planBaseActive(yr)?", "_mvInfoSet('plan.feries',{ p:[false?")],
    ['la liste des fériés reste ouverte', sur('mod', "h+='<details'+(ouvert?' open':'')", "h+='<details'+((P.length||ouvert)?' open':'')")],
    ['la liste ne s’ouvre plus pendant un brouillon', sur('mod', "h+='<details'+(ouvert?' open':'')", "h+='<details'+(false?' open':'')")],
    ['les seuils reviennent sur la carte des Stades', sur('app', "if(T.vieux) h+='<div class=\"phr-m phr-cqv-pied\">Temp\\u00e9ratures de la derni\\u00e8re lecture.</div>';", "h+='<div class=\"phr-m phr-cqv-pied\">Seuils publi\\u00e9s\\u00a0: Pinot noir 1\\u00a0219.</div>';")],
    ['« Ce qui vient » perd son « i »', sur('app', "Ce qui vient '+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('phr.dj'):'')+'</div>';", "Ce qui vient</div>';")],
    ['la phrase d’exemple revient', sur('cpt', "  if(!L.length&&_entProgEdit!=='nouveau') return '<div class=\"ent-prog ep-seul\">'+ajout+'</div>';", "  if(!L.length&&_entProgEdit!=='nouveau') return '<div class=\"ent-prog ep-seul\">'+ajout+'<div class=\"ep-vide\">Vidange de pont et bo\\u00eete, filtres, graissage.</div></div>';")],
    ['le bouton redevient « Ajouter »', sur('cpt', "onclick=\"_trEntEdit(\\'nouveau\\')\">+ Autre entretien</button>';", "onclick=\"_trEntEdit(\\'nouveau\\')\">Ajouter</button>';")],
    ['la carte vide revient', sur('cpt', "  if(!L.length&&_entProgEdit!=='nouveau') return '<div class=\"ent-prog ep-seul\">'+ajout+'</div>';\n", '')],
    ['la phrase de l’intervalle revient', sur('trac', ":'';\n  // MOTS-17 (§612)", ":(hasComp?'Intervalle \\u00e0 r\\u00e9gler au crayon\\u00a0: la suivante se calculera seule.':'');\n  // MOTS-17 (§612)")],
    ['« intervalle ? » montré à qui ne peut pas régler', sur('trac', 'var _ivP=(!(_ivh||_ivm)&&hasComp&&canEdit)?', 'var _ivP=(!(_ivh||_ivm)&&hasComp)?')],
    ['« intervalle ? » n’ouvre plus le crayon', sur('trac', 'class="mv-pq rel-iv" onclick="window.openRevEdit()"', 'class="mv-pq rel-iv"')],
    ['l’Accueil retrouve sa phrase longue', sur('app', 'Vos compteurs partent \\u00e0 la premi\\u00e8re validation.', 'Votre premi\\u00e8re validation lancera vos compteurs\\u00a0: hectares, jours au domaine, kilom\\u00e8tres de rangs.')],
    ['la fiche de la frise oublie où se choisit la semaine', sur('uti', 'en touchant ses heures, en tête de la vue (‹ et › pour la voisine)', 'plus haut')],
    ['la fiche des degrés-jours perd les seuils', sur('uti', 'Pinot noir <b>1\\u00a0219</b>', 'Pinot noir <b>1\\u00a0291</b>')],
    ['le guide ne dit pas « Régler la frise ? »', sur('gp', 'le mode d\'emploi « Régler la frise ? »', 'le mode d\'emploi « Aide »')],
    ['l’annonce est montrée à tout le monde', sur('wn', "pour: ['admin'], emoji: 'calendrier', titre: 'Planning, Stades, Entretien", "pour: ['tous'], emoji: 'calendrier', titre: 'Planning, Stades, Entretien")],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.24 (25/11/2026) — MOTS-17 (§612)', '// v12.24 (25/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-balayage-v2.html', 'maquette-balayage-vX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots17.mjs']", "['node scripts/mv-harnais-mots17Z.mjs']")],
  ];
  let bons = 0, mal = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { mal++; console.log('  \x1b[31m✗\x1b[0m non injecté (' + e.message + ') : ' + nom); continue; }
    let r; try { r = suite(S); } catch (e) { r = [['plantage', false]]; }
    const k = r.filter((x) => !x[1]).length;
    if (k > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + k + ')'); } else { mal++; console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom); }
  }
  console.log('\n' + (mal ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves rougissent');
  process.exit(mal ? 1 : 0);
}
