/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — YALLER-1 (§527) : TROUVER UNE PARCELLE ET « Y ALLER »
   Lancer : node scripts/mv-harnais-yaller1.mjs          (le contrôle)
            node scripts/mv-harnais-yaller1.mjs --contre  (la contre-épreuve)
   La recherche sans accents, « Ailleurs dans le domaine » et ses raisons, le bouton « Y aller », les adresses d’itinéraire et
   l’appli lue sur le téléphone sont EXÉCUTÉS sur un domaine inventé (les fonctions d’app.js, extraites) ; le reste est le
   câblage : le filtre de la liste, la fiche, ↩ et ✕ à l’admin, le tri de la carte Tracteur, l’accompagnement.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const lire = f => fs.readFileSync(f, 'utf8');
const S0 = { A: lire('src/app.js'), H: lire('index.html'), U: lire('src/utils.js'), W: lire('src/whats-new.js'), G: lire('guide/04-vigne.html'), T: lire('src/tutos.js') };
const CONTRE = process.argv.includes('--contre');
function fonction(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) return '';
  let d = 0; const k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) { if (src[x] === '{') d++; else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); } }
  return '';
}
const NOMS = ['_pvSansAccent', '_pvQ', '_pvCherche', '_pvSurligne', '_pAilleurs', '_pPourquoi', '_mvYaPos', '_pYaPill', '_yaApple', '_yaApps', '_yaLire', '_yaNom', '_mvYAllerUrl'];
const PARC = () => [
  { nom: 'Clos du Moulin', statut: 'Active', taches: { Taille: 'Non démarré' } },
  { nom: 'Les Perrières', statut: 'Active', taches: { Taille: 'Validé' }, commune: { nom: 'Brochon' } },
  { nom: 'Les Combes', statut: 'Active', taches: {}, hors: true },
  { nom: 'Clos Vieux', statut: 'Arrachee', taches: {} }
];
function monde(S, { q = '', T = 'Taille', ua = 'Mozilla/5.0 (Linux; Android 14)', ls = {} } = {}) {
  const code = NOMS.map(n => { const f = fonction(S.A, n); if (!f) throw new Error(n + ' introuvable'); return f; }).join('\n');
  const env = {
    pSearch: q, pTacheFilter: T, PARCELLES: PARC(), _YA_CLE: 'mavigne_gps', navigator: { userAgent: ua },
    localStorage: { getItem: k => (k in ls ? ls[k] : null) },
    window: { _mvParcGeo: o => (o && o.nom === 'Clos du Moulin') ? { lat: 47.2291, lng: 4.9655 } : null, _mvTacheSel: () => false, _mvHorsPer: p => !!p.hors },
    _mvArrHors: p => p.statut === 'Arrachee', _mvExclu: p => !!p.hors, _pvCurDone: (p, t) => !!(p.taches && p.taches[t] === 'Validé'), _pvAuPresta: () => false,
    _pDernier: () => '28 oct.', tNom: t => t, _escHtml: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    _escAttr: s => String(s).replace(/"/g, '&quot;'), _mvIcon: n => '<i data-ic="' + n + '"></i>', _pDesk: () => false
  };
  const k = Object.keys(env);
  return new Function(...k, code + '\nreturn {' + NOMS.join(',') + '};')(...k.map(x => env[x]));
}
function controles(S) {
  const r = []; let w = null, w2, w3, wi, wv;
  try { w = monde(S, { q: 'perriere' }); w2 = monde(S, { q: 'clos' }); w3 = monde(S, { q: '' });
    wi = monde(S, { q: 'clos', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', ls: { mavigne_gps: 'plans' } }); wv = monde(S, { q: 'clos', ls: { mavigne_gps: 'plans' } });
  } catch (e) { w = null; r.push(['les fonctions de YALLER-1 s’exécutent — ' + e.message, false]); }
  if (w) {
    r.push(['la recherche sans accents : « perriere » trouve « Les Perrières », « PERRI » aussi, « moulin » non', w._pvCherche('Les Perrières', 'perriere') && w._pvCherche('Les Perrières', 'PERRI') && !w._pvCherche('Les Perrières', 'moulin')]);
    r.push(['le surlignage garde le nom écrit : « Les <mark>Perri</mark>ères »', /Les <mark[^>]*>Perri<\/mark>ères/.test(monde(S, { q: 'perri' })._pvSurligne('Les Perrières'))]);
    r.push(['« ailleurs » = celles qui répondent hors de la liste (Clos Vieux), jamais une de la liste', w2._pAilleurs([{ nom: 'Clos du Moulin' }]).map(p => p.nom).join('|') === 'Clos Vieux']);
    const f = w2._pPourquoi({ nom: 'Les Perrières', statut: 'Active', taches: { Taille: 'Validé' }, commune: { nom: 'Brochon' } }), h = w2._pPourquoi({ nom: 'Les Combes', statut: 'Active', taches: {}, hors: true }), a = w2._pPourquoi({ nom: 'Clos Vieux', statut: 'Arrachee', taches: {} });
    r.push(['les raisons : « Taille, fait le 28 oct. · Brochon », « Sans taille cette période », « Arrachée »', f.includes('Taille, fait le 28 oct.') && f.includes('Brochon') && h.includes('Sans taille cette période') && a.includes('Arrachée') && a.includes('p-pq-arr')]);
    r.push(['sans recherche, rien ne change : pas d’« ailleurs », pas de « Y aller »', w3._pAilleurs([]).length === 0 && w3._pYaPill({ nom: 'Clos du Moulin' }) === '']);
    const ya = w2._pYaPill({ nom: 'Clos du Moulin' }), sp = w2._pYaPill({ nom: 'Clos Vieux' });
    r.push(['« Y aller » seulement avec une position : le bouton pour le Clos du Moulin, « Pas de position » sans contour', ya.includes('_mvYAller(') && ya.includes('data-tuto="parc.yaller"') && ya.includes('data-n="Clos du Moulin"') && sp.includes('Pas de position') && !sp.includes('_mvYAller(')]);
    const g = w2._mvYAllerUrl('gmaps', 47.2291, 4.9655), z = w2._mvYAllerUrl('waze', 47.2291, 4.9655), p = w2._mvYAllerUrl('plans', 47.2291, 4.9655);
    r.push(['les adresses d’itinéraire : Google Maps et Waze en guidage, Plans en voiture', g === 'https://www.google.com/maps/dir/?api=1&destination=47.229100,4.965500&travelmode=driving&dir_action=navigate' && z === 'https://waze.com/ul?ll=47.229100,4.965500&navigate=yes' && p === 'https://maps.apple.com/?daddr=47.229100,4.965500&dirflg=d']);
    r.push(['Plans n’est proposé que chez Apple', w2._yaApps().map(x => x.id).join(',') === 'gmaps,waze' && wi._yaApps().map(x => x.id).join(',') === 'gmaps,waze,plans']);
    r.push(['l’appli se lit sur le téléphone : « plans » vaut sur iPhone, pas sur Android ; rien = demander', wi._yaLire() === 'plans' && wv._yaLire() === '' && w3._yaLire() === '']);
  }
  const A = S.A;
  r.push(['le filtre de la liste cherche sans accents', A.includes('if(pSearch&&!_pvCherche(p.nom,pSearch))return false;') && !A.includes('p.nom.toLowerCase().includes(pSearch.toLowerCase())')]);
  r.push(['la liste vidée par la recherche ne dit plus « tâche terminée »', A.includes('cont.innerHTML=_pvQ()?(_pAil.length?_pChTete(0,_pAil)+_pChAilleurs(_pAil):_pChVide()):msg;') && fonction(A, '_pChVide').includes('Aucune parcelle')]);
  r.push(['la fiche lit la position du contour (_mvParcGeo), plus p.lat seul', A.includes('_dpYaPeindre(p);') && !A.includes("getElementById('dp-gps-btn')") && fonction(A, '_dpYaPeindre').includes('_mvYaPos(p)') && fonction(A, '_mvYaPos').includes('_mvParcGeo')]);
  r.push(['↩ et ✕ de la fiche à l’admin, dans l’écran et dans les fonctions', A.includes('const canExcl=canEdit&&isAdmin();') && !A.includes("${canEdit&&stat!=='Non démarré'?") && fonction(A, 'annulerTache').includes('if(!isAdmin())') && fonction(A, 'toggleExcluTache').includes('if(!isAdmin())')]);
  const i = A.indexOf('function renderHomeTrac('), j = A.indexOf('var mien=S.filter(', i), mien = (i >= 0 && j > i) ? A.slice(j, A.indexOf('\n', j)).replace(/\/\/.*$/, '') : '';
  r.push(['le tri de la carte Tracteur n’est plus avalé par un commentaire', mien.includes('.sort(function(a,b){')]);
  r.push(['« Y aller » et le choix de l’appli sont dans la page (feuille, fiche, Réglages › Moi, icône) ; plus de bouton GPS mort', S.H.includes('id="ovYAller"') && S.H.includes('id="dp-ya"') && S.H.includes('id="regl-gps-row"') && S.H.includes('<symbol id="ic-itineraire"') && !S.H.includes('dp-gps-btn') && !S.H.includes('Ouvrir dans GPS')]);
  r.push(['les fonctions des boutons sont exposées', ['_mvYAller', '_yaChoisir', '_yaReglage'].every(n => A.includes('window.' + n + '=' + n + ';'))]);
  const aide = (S.U.match(/\n\s+parcelles\s*:\s*\{[\s\S]*?\n\s+journal\s*:\s*\{/) || [''])[0];
  r.push(['l’accompagnement dit « Y aller » : l’aide de Parcelles, le guide, l’annonce en tête, le tuto', aide.includes("['Y aller'") && S.G.includes('<b>Y aller</b>') && !S.G.includes('Ouvrir dans GPS')
    && /v: '[\d.]+', d: '[^']+', items: \[\s*\/\/ YALLER-1/.test(S.W) && S.W.indexOf('YALLER-1') < S.W.indexOf("v: '10.63'") && S.T.includes("id: 'yaller'") && S.T.includes("couvre: ['_mvYAller']")]);
  return r;
}
if (!CONTRE) {
  let ko = 0;
  console.log('\n── YALLER-1 — trouver une parcelle et y aller\n');
  for (const [n, c] of controles(S0)) { if (!c) ko++; console.log('  ' + (c ? '\x1b[32m✓\x1b[0m ' : '\x1b[31m✗\x1b[0m ') + n); }
  console.log(`\n  ${ko ? ko + ' rouge(s)' : 'tout est vert'}\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── YALLER-1 — contre-épreuve\n');
const mut = (k, a, b) => { if (!S0[k].includes(a)) throw new Error('défaut non posé : ' + a.slice(0, 60)); return { ...S0, [k]: S0[k].replace(a, b) }; };
const essais = [
  ['la recherche redevient sensible aux accents', () => mut('A', "function _pvSansAccent(s){ return String(s==null?'':s).normalize('NFD')", "function _pvSansAccent(s){ return String(s==null?'':s).normalize('NFC')"), 'la recherche sans accents'],
  ['« ailleurs » reprend les parcelles de la liste', () => mut('A', '!dans[p.nom]&&', ''), '« ailleurs »'],
  ['la fiche relit le bouton GPS mort', () => mut('A', '_dpYaPeindre(p);', "document.getElementById('dp-gps-btn');"), 'la fiche lit'],
  ['la croix revient chez l’ouvrier', () => mut('A', 'const canExcl=canEdit&&isAdmin();', 'const canExcl=canEdit;'), '↩ et ✕'],
  ['le commentaire avale de nouveau le tri', () => mut('A', ".sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); });   // COEQ-2 (§523)", "   // COEQ-2 (§523).sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); });"), 'le tri de la carte Tracteur'],
  ['Waze sans guidage', () => mut('A', '&navigate=yes', ''), 'les adresses'],
  ['Plans proposé sur Android', () => mut('A', 'if(_yaApple()) a.push(', 'a.push('), 'Plans n’est proposé'],
  ['le vide de recherche redevient « tâche terminée »', () => mut('A', 'cont.innerHTML=_pvQ()?(_pAil.length?_pChTete(0,_pAil)+_pChAilleurs(_pAil):_pChVide()):msg;', 'cont.innerHTML=msg;'), 'la liste vidée'],
];
let rates = 0;
for (const [n, fab, cible] of essais) { let vu = false; try { vu = controles(fab()).some(([x, c]) => x.startsWith(cible) && !c); } catch (e) { vu = false; } if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); } }
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
