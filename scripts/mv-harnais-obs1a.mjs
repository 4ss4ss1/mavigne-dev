/* ───────────────────────────────────────────────────────
   HARNAIS — OBS-1A (§565) : SIGNALER — LE TYPE, L'INTENSITÉ, LA PHOTO, LE POINT GPS ; L'OUVRIER SIGNALE, L'ADMIN CLÔT
   Lancer :          node scripts/mv-harnais-obs1a.mjs
   Contre-épreuves : node scripts/mv-harnais-obs1a.mjs --contre

   POURQUOI IL EXISTE
   Ce que le chef voit dans les rangs entre enfin quelque part. Ce harnais JOUE les vraies fonctions (extraites d'app.js) :
   l'enregistrement (une entrée par signalement, écrite seule — deux téléphones ne s'écrasent pas —, la note bornée, le point
   GPS, la photo marquée « à reprendre » tant qu'elle n'est pas partie), la photo envoyée puis notée, ou gardée sur l'appareil
   sans réseau, « Clore » réservé à l'administrateur, la liste de la parcelle (les plus récents d'abord, pas les annulés),
   l'historique de la fiche ; il garde l'écriture par fusion, le chemin et la règle Storage des photos, la fenêtre, les branchements.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), fb: lire('src/firebase.js'), st: lire('storage.rules'), html: lire('index.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const P = [{ nom: 'Les Crais', pid: 'p1' }, { nom: 'Clos Prieur', pid: 'p3' }];
  const ecrits = [], store = {}, toasts = [];
  const el = { 'obs-note': { value: o.note || '' } };
  const ctx = { window: { PARCELLES: P, OBS: o.obs || {}, currentUser: { nom: 'Victor' }, fbObsEcrire: (an, x) => { ecrits.push([an, JSON.parse(JSON.stringify(x))]); return Promise.resolve(true); }, fbObsPhoto: () => Promise.resolve(o.url === undefined ? null : o.url), showToast: (m) => toasts.push(m) },
    document: { getElementById: (id) => el[id] || null }, canWrite: () => o.ecrit !== false, isAdmin: () => !!o.adm, todayStr: () => '2026-05-26', closeOv() {}, showToast: (m) => toasts.push(m),
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } }, FileReader: function () { this.readAsDataURL = (b) => { this.result = 'data:image/jpeg;base64,QUJD'; this.onload(); }; },
    _escHtml: (x) => String(x).replace(/</g, '&lt;'), _escAttr: (x) => String(x).replace(/"/g, '&quot;'), _phenoJour: (d) => 'le ' + d, _phenoP: null, atob: (s) => Buffer.from(s, 'base64').toString('binary'), Blob: function (parts, opt) { this.parts = parts; this.type = opt && opt.type; }, Uint8Array };
  vm.createContext(ctx);
  vm.runInContext([variable(S.app, '_OBS_TYPES'), variable(S.app, '_OBS_INT'), 'var _obsF=null, _obsEcoute=null;',
    ...['_obsAn', '_obsType', '_obsListe', '_obsPeutSignaler', '_obsNoteLue', '_obsId', '_obsEnregistrer', '_obsPhotoEnvoyer', '_obsGarder', '_obsAttente', '_obsBlob', '_obsClore', '_obsFicheHtml'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nfunction _obsRafraichir(){} function _obsDemarrer(){}\nthis.set=function(F){ _obsF=F; }; this.enr=_obsEnregistrer; this.clore=_obsClore; this.liste=_obsListe; this.fiche=_obsFicheHtml; this.att=function(){ return store; };', ctx);
  return { ctx, ecrits, store, toasts };
}
const attendre = () => new Promise((r) => setTimeout(r, 10));
async function jouer(S) {
  const A = monde(S, { note: '  Feutrage sur grappes, 3 pieds de suite.  ' + 'x'.repeat(300), url: null });
  A.ctx.set({ p: { nom: 'Les Crais', pid: 'p1' }, type: 'oidium', int: 'fort', note: '', photo: { blob: { size: 180000 }, ko: 176 }, pos: { lat: 47.221, lng: 4.964, prec: 6 } });
  A.ctx.enr(); await attendre();
  const w = A.ecrits[0], id = w && Object.keys(w[1])[0], e = w && w[1][id];
  t('① enregistrer : une seule entrée écrite (deux téléphones ne s’écrasent pas), à l’année, avec le type, l’intensité, l’auteur, le point GPS', w && w[0] === '2026' && Object.keys(w[1]).length === 1 && e.type === 'oidium' && e.int === 'fort' && e.par === 'Victor' && e.nom === 'Les Crais' && e.pid === 'p1' && e.lat === 47.221 && e.lng === 4.964 && e.prec === 6 && e.statut === 'ouvert' && e.d === '2026-05-26');
  t('① la note : sans les blancs, 200 caractères au plus', e.note.length === 200 && e.note.startsWith('Feutrage sur grappes'));
  t('② la photo : « à reprendre » tant qu’elle n’est pas partie ; sans réseau, gardée sur l’appareil pour être renvoyée', e.photo === 'a-reprendre' && JSON.parse(A.store.mvObsPhotos || '{}')[id] && JSON.parse(A.store.mvObsPhotos)[id].an === '2026');
  const B = monde(S, { url: 'https://firebasestorage.googleapis.com/x.jpg' });
  B.ctx.set({ p: { nom: 'Clos Prieur', pid: 'p3' }, type: 'gel', int: 'faible', note: '', photo: { blob: { size: 9 }, ko: 1 }, pos: null }); B.ctx.enr(); await attendre();
  const idB = Object.keys(B.ecrits[0][1])[0];
  t('② la photo partie : son adresse s’écrit sur la même entrée (seule), plus rien à reprendre ; sans position, pas de coordonnées', B.ecrits.length === 2 && JSON.stringify(B.ecrits[1][1]) === JSON.stringify({ [idB]: { photo: 'https://firebasestorage.googleapis.com/x.jpg' } }) && !('lat' in B.ecrits[0][1][idB]) && !(B.store.mvObsPhotos || '').includes(idB));
  const C = monde(S, { ecrit: false }); C.ctx.set({ p: { nom: 'Les Crais' }, type: 'oidium', int: 'moyen', note: '' }); C.ctx.enr();
  t('③ en lecture seule : rien ne s’écrit', C.ecrits.length === 0);
  const O = { a1: { nom: 'Les Crais', type: 'oidium', int: 'fort', d: '2026-05-20', t: '2026-05-20T09:40:00Z', par: 'Victor', statut: 'ouvert' }, a2: { nom: 'Les Crais', type: 'gel', int: 'faible', d: '2026-05-24', t: '2026-05-24T18:00:00Z', par: 'Nico', statut: 'clos' }, a3: { nom: 'Les Crais', type: 'mildiou', int: 'moyen', t: '2026-05-25T08:00:00Z', statut: 'annule' }, a4: { nom: 'Clos Prieur', type: 'palissage', int: 'moyen', t: '2026-05-21T08:00:00Z', statut: 'ouvert' }, a5: { nom: 'Les Crais', type: 'inconnu', t: '2026-05-26T08:00:00Z' } };
  const D = monde(S, { obs: JSON.parse(JSON.stringify(O)) });
  t('④ la liste d’une parcelle : les plus récents d’abord, sans les annulés ni un type inconnu', D.ctx.liste('Les Crais').map((x) => x.id).join() === 'a2,a1');
  D.ctx.clore('a1');
  const E = monde(S, { obs: JSON.parse(JSON.stringify(O)), adm: true }); E.ctx.clore('a1'); E.ctx.clore('a2');
  t('⑤ « Clore » : pas sans être administrateur ; l’administrateur clôt une entrée (seule), pas deux fois', D.ecrits.length === 0 && E.ecrits.length === 1 && E.ecrits[0][1].a1.statut === 'clos' && E.ecrits[0][1].a1.closPar === 'Victor' && Object.keys(E.ecrits[0][1]).join() === 'a1');
  const hO = monde(S, { obs: JSON.parse(JSON.stringify(O)) }).ctx.fiche({ nom: 'Les Crais' }), hA = monde(S, { obs: JSON.parse(JSON.stringify(O)), adm: true }).ctx.fiche({ nom: 'Les Crais' }), hR = monde(S, { obs: {}, ecrit: false }).ctx.fiche({ nom: 'Les Crais' });
  t('⑥ la fiche : « Signaler » pour qui écrit, « Clore » pour l’administrateur sur un signalement ouvert ; rien en lecture seule sans signalement', hO.includes('onclick="_obsSignaler(this.dataset.nom)"') && !hO.includes('_obsClore') && hO.includes('1 ouvert · 2 cette année') && hA.includes('data-id="a1" onclick="_obsClore(this.dataset.id)"') && !hA.includes('data-id="a2"') && hR === '');
  t('⑦ firebase.js : observations_<année> écrit par fusion ; la photo sous tenants/<domaine>/photos/<id>.jpg, en JPEG, par la porte des tutos ; jamais en démo', S.fb.includes("return setDoc(fbDocRef('observations_' + String(an)), { value: entrees }, { merge: true })") && S.fb.includes("var r = _storageRef(_storage, 'tenants/' + TENANT_ID + '/photos/' + id + '.jpg');") && S.fb.includes("var t = uploadBytesResumable(r, blob, { contentType: 'image/jpeg' });") && S.fb.includes("TENANT_ID !== 'domaine-dupont'"));
  t('⑦ storage.rules : une image d’1 Mo au plus, par un membre qui écrit ; jamais remplacée ; l’administrateur supprime', /match \/tenants\/\{tenant\}\/photos\/\{filename\} \{[\s\S]{0,700}request\.resource\.size <= 1 \* 1024 \* 1024[\s\S]{0,120}request\.resource\.contentType\.matches\('image\/\.\*'\);\s*allow update: if false;\s*allow delete: if !isDemoAccount\(\) && \(isTenantAdmin\(tenant\) \|\| isGtAdmin\(\)\);/.test(S.st));
  t('⑧ l’écran : la fenêtre, la place dans la fiche, les deux fiches branchées, la photo de l’appareil ; la liste joue ce fichier', S.html.includes('id="ovObs"') && S.html.includes('id="dp-obs"') && S.app.includes('_obsDemarrer(); _obsFiche(p);   // ★ OBS-1A') && S.app.includes("var _obH=(typeof _obsFicheHtml==='function')?_obsFicheHtml(p):'';") && S.app.includes('accept="image/\\u002a" capture="environment"')
    && S.liste.indexOf("mv-harnais-obs1a.mjs'") > 0 && S.liste.indexOf("mv-harnais-obs1a.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { await jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { await jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['l’écriture sans fusion (un téléphone écrase l’autre)', m('fb', "{ value: entrees }, { merge: true })", "{ value: entrees })")],
    ['la note sans borne', m('app', "note:String(F.note||'').trim().slice(0,200)", "note:String(F.note||'').trim()")],
    ['la photo non marquée à reprendre', m('app', "statut:'ouvert', photo:F.photo?'a-reprendre':null };", "statut:'ouvert', photo:null };")],
    ['sans réseau, la photo perdue', m('app', '    else _obsGarder(an,id,blob);\n', '\n')],
    ['« Clore » ouvert à tous', m('app', "  if(!(typeof isAdmin==='function'&&isAdmin())) return;\n  var e=window.OBS&&window.OBS[id]; if(!e||e.statut==='clos') return;", "  var e=window.OBS&&window.OBS[id]; if(!e||e.statut==='clos') return;")],
    ['les annulés reviennent dans la liste', m('app', "e&&_obsType(e.type)&&e.statut!=='annule'&&", "e&&_obsType(e.type)&&")],
    ['la règle Storage accepte 10 Mo', m('st', '&& request.resource.size <= 1 * 1024 * 1024\n                    && request.resource.contentType.matches(\'image/.*\');\n      allow update: if false;', "&& request.resource.size <= 10 * 1024 * 1024\n                    && request.resource.contentType.matches('image/.*');\n      allow update: if false;")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-obs1a.mjs'").join("mv-harnais-obsZa.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { await jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
