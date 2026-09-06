process.env.GCLOUD_PROJECT='mavigne-a0fd5';
const admin=require('firebase-admin');
const m=require('./claims.js');
const J=86400000; let ok=0,ko=0;
const t=(n,c)=>{c?(ok++,console.log('  \x1b[32m✓\x1b[0m '+n)):(ko++,console.log('  \x1b[31m✗ '+n+'\x1b[0m'));};
function faux(clients,marks){
  const mails=[]; let ecrits=null, lu=false;
  const membres={value:[{nom:'Alexandre',email:'client@domaine.fr',roles:['admin','ouvrier']}]};
  // ⚠️ admin.firestore est non-inscriptible : une affectation simple échoue EN SILENCE
  //    et le harnais tape la vraie base — il verdit alors sur une lecture ratée.
  Object.defineProperty(admin,'firestore',{configurable:true,writable:true,value:()=>({
    doc:(p)=>({ get:async()=>{ if(p==='_guerettech/tenants') lu=true;
        return {exists:true,data:()=>p==='_guerettech/tenants'?{clients}
          :p==='_guerettech/trial_mails'?{value:marks}:membres};},
      set:async(v)=>{ if(p==='_guerettech/trial_mails') ecrits=v.value; }}),
    collection:()=>({add:async(d)=>{mails.push({to:d.to[0],sujet:d.message.subject});}}),
  })});
  return {mails,get marks(){return ecrits;},get lu(){return lu;}};
}
const run=async(c,mk={})=>{const f=faux(c,mk);await m.trialWatch.run({});
  if(!f.lu) throw new Error('SETUP ROUGE : le registre n\'a pas été lu'); return f;};
const C=(o)=>({domaine:{plan:'domaine',status:'active',...o}});
(async()=>{
console.log('\n── les trois moments ──');
let r=await run(C({trialExp:Date.now()+10*J,trialRenewals:0}));
t('J-10 : rien (et le registre A bien été lu)', r.mails.length===0&&r.lu);
r=await run(C({trialExp:Date.now()+2.5*J,trialRenewals:0}));
t('J-3 : une alerte chez Nicolas', r.mails.length===1&&r.mails[0].to==='ngdevpro@gmail.com');
t('… avec le J- au sujet', /J-\d/.test(r.mails[0].sujet));
r=await run(C({trialExp:Date.now()-1*J,trialRenewals:0}));
t('échéance : « Essai terminé »', r.mails.length===1&&/termin/i.test(r.mails[0].sujet));
t('… aucune relance client à ce stade', !r.mails.some(x=>x.to==='client@domaine.fr'));
r=await run(C({trialExp:Date.now()-16*J,trialRenewals:0}),{domaine:{j3:1,exp:1}});
t('★ J+15 sec : relance CHEZ LE CLIENT', r.mails.some(x=>x.to==='client@domaine.fr'));
t('★ … et Nicolas prévenu qu\'elle est partie', r.mails.some(x=>/Relance/.test(x.sujet)));
r=await run(C({trialExp:Date.now()-16*J,trialRenewals:1}),{domaine:{j3:1,exp:1}});
t('★ reconduit : PAS de relance (le contact a eu lieu)', r.mails.length===0);
console.log('\n── anti-doublon ──');
t('marqueur posé → rien ne repart', (await run(C({trialExp:Date.now()-J,trialRenewals:0}),{domaine:{exp:1}})).mails.length===0);
r=await run(C({trialExp:Date.now()+2*J,trialRenewals:0}));
t('marqueurs réécrits après envoi', !!(r.marks&&r.marks.domaine&&r.marks.domaine.j3));
t('relance déjà faite → ne repart pas',
  (await run(C({trialExp:Date.now()-16*J,trialRenewals:0}),{domaine:{j3:1,exp:1,relance:1}})).mails.length===0);
console.log('\n── domaines à ignorer ──');
t('converti (trialExp 0)', (await run(C({trialExp:0,trialRenewals:1}))).mails.length===0);
t('pending (pas installé)', (await run(C({trialExp:Date.now()-J,status:'pending'}))).mails.length===0);
console.log('\n── contre-épreuve : la borne ──');
t('TRIAL_MAX_RENEW=1 dans le code', /const TRIAL_MAX_RENEW = 1;/.test(require('fs').readFileSync('./claims.js','utf8')));
t('le garde-fou refuse au 2e (failed-precondition)', /faites >= TRIAL_MAX_RENEW\)/.test(require('fs').readFileSync('./claims.js','utf8')));
console.log('\n'+(ko?`\x1b[31m✗ ${ko} rouge(s) sur ${ok+ko}\x1b[0m`:`\x1b[32m✓ ${ok} vertes, 0 rouge\x1b[0m`));
process.exit(ko?1:0);
})().catch(e=>{console.log('\x1b[31m✗ HARNAIS EN ERREUR : '+e.message+'\x1b[0m');process.exit(1);});
