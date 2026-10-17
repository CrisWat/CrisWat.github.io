// ===== Modello Kessler a gusci (didattico) =====
// Popolazioni per guscio di 50 km tra 200 e 2000 km: A attivi, D intatti derelitti, F frammenti >=10 cm
const KS = (() => {
  const H0 = 200, DH = 50, NS = 36, RE = 6378.137;
  const LT = [[200,0.003],[250,0.02],[300,0.08],[350,0.3],[400,0.8],[450,2],[500,5],[550,10],[600,20],[650,35],
    [700,60],[750,100],[800,150],[850,220],[900,330],[1000,700],[1100,1200],[1200,2000],[1500,5000],[2000,10000],[2100,12000]];
  function life(h){ // vita orbitale [anni] per un oggetto intatto, attivita' solare media (indicativa)
    if (h<=LT[0][0]) return LT[0][1];
    for (let k=1;k<LT.length;k++) if (h<=LT[k][0]){const [h1,l1]=LT[k-1],[h2,l2]=LT[k];
      const f=(h-h1)/(h2-h1); return Math.exp(Math.log(l1)+f*(Math.log(l2)-Math.log(l1)));}
    return LT[LT.length-1][1];
  }
  const VREL = 10 * 3.15576e7; // km/anno
  const vol = [], res = [], hc = [];
  for (let s=0;s<NS;s++){const hb=H0+s*DH, ht=hb+DH; hc.push(hb+DH/2);
    vol.push(4/3*Math.PI*((RE+ht)**3-(RE+hb)**3));
    res.push(Math.max(life(ht)-life(hb),0.002));}
  function initFrom(alt, cls, mass){ // alt: quota media; cls 0=A,1=D,2=F
    const st={A:new Float64Array(NS),D:new Float64Array(NS),F:new Float64Array(NS),mI:new Float64Array(NS)};
    const ms=new Float64Array(NS), mc=new Float64Array(NS);
    for(let k=0;k<alt.length;k++){const s=Math.floor((alt[k]-H0)/DH); if(s<0||s>=NS) continue;
      if(cls[k]===0) st.A[s]++; else if(cls[k]===1) st.D[s]++; else st.F[s]++;
      if(cls[k]<2 && mass[k]>0){ms[s]+=mass[k];mc[s]++;}}
    for(let s=0;s<NS;s++) st.mI[s]= mc[s]>5? ms[s]/mc[s] : 800;
    return st;
  }
  function spread(sc, n, out, sig){ // distribuisce n frammenti attorno al guscio sc (gaussiana in quota)
    let w=[],tot=0; for(let s=0;s<NS;s++){const x=(hc[s]-hc[sc])/sig; const v=Math.exp(-0.5*x*x); w.push(v); tot+=v;}
    // quota parte che finisce sotto 200 km (rientro rapido) persa
    const below = Math.exp(-0.5*((H0-25-hc[sc])/sig)**2)*2; tot+=below;
    for(let s=0;s<NS;s++) out[s]+=n*w[s]/tot;
  }
  function run(init, p){
    // p: years, dt, launch (moltiplicatore rimpiazzo), life (anni missione), pmd (0..1), avoid (0..1),
    //    expl (frammenti/anno da esplosioni), adr (oggetti/anno), mega:{n,h}, sigII, sigIF, mF, asat:[{y,h,n}]
    const dt=p.dt||0.25, steps=Math.round(p.years/dt);
    const A=Float64Array.from(init.A), D=Float64Array.from(init.D), F=Float64Array.from(init.F), mI=init.mI;
    const A0=Float64Array.from(init.A);
    const megaS = p.mega && p.mega.n>0 ? Math.min(NS-1,Math.max(0,Math.floor((p.mega.h-H0)/DH))) : -1;
    const out={t:[],A:[],D:[],F:[],coll:[],cumColl:[],shellsF:[],events:[]}; const abandoned=new Uint8Array(NS);
    let cum=0; const sII=p.sigII*1e-6, sIF=p.sigIF*1e-6; // m2 -> km2
    const asat=(p.asat||[]).map(a=>({...a,done:false}));
    for(let it=0;it<=steps;it++){
      const t=it*dt;
      if(it%Math.round(1/dt)===0){
        out.t.push(t); out.A.push(sum(A)); out.D.push(sum(D)); out.F.push(sum(F)); out.cumColl.push(cum);
        out.shellsF.push(Array.from(F,(v,s)=>v+D[s]+A[s]));
      }
      if(it===steps) break;
      const nF=new Float64Array(NS); let collStep=0;
      for(const a of asat) if(!a.done && t>=a.y){a.done=true; spread(Math.floor((a.h-H0)/DH),a.n,nF,60);}
      for(let s=0;s<NS;s++){
        const k=VREL/vol[s]*dt;
        const fa=1-p.avoid;
        // collisioni intatto-intatto
        const cAA=0.5*A[s]*A[s]*sII*k*fa*fa, cAD=A[s]*D[s]*sII*k*fa, cDD=0.5*D[s]*D[s]*sII*k;
        const cAF=A[s]*F[s]*sIF*k*fa, cDF=D[s]*F[s]*sIF*k;
        const m=mI[s];
        const nII=5.13*Math.pow(2*m,0.75);
        // energia specifica proiettile su bersaglio: 0.5*mF*v^2 / m  [J/g]
        const emr=0.5*p.mF*1e8/(m*1000);
        const catas=emr>=40;
        const nIF=catas? 5.13*Math.pow(m+p.mF,0.75) : 5.13*Math.pow(p.mF*100,0.75);
        const fr=(cAA+cAD+cDD)*nII+(cAF+cDF)*nIF;
        if(fr>0) spread(s,fr,nF,75);
        A[s]-=2*cAA+cAD+(catas?cAF:0); D[s]-=cAD+2*cDD+(catas?cDF:0);
        collStep+=cAA+cAD+cDD+(catas?(cAF+cDF):0);
        // rischio annuo per un satellite attivo nel guscio: se supera la soglia, gli operatori abbandonano il guscio
        const risk=((A[s]+D[s])*sII+F[s]*sIF)*VREL/vol[s]; // senza manovre
        if(!abandoned[s] && risk>p.abandon && it>0){abandoned[s]=1; out.events.push({t, h:hc[s]});}
        if(A[s]<0)A[s]=0; if(D[s]<0)D[s]=0;
      }
      cum+=collStep;
      // esplosioni / frammentazioni non collisionali, proporzionali agli intatti derelitti
      if(p.expl>0){const tot=sum(D); if(tot>0) for(let s=0;s<NS;s++) if(D[s]>0) spread(s,p.expl*dt*D[s]/tot,nF,75);}
      // ADR: rimuove i derelitti nei gusci con il prodotto D*(D+F) piu' alto
      if(p.adr>0){let rem=p.adr*dt; for(let g=0;g<3&&rem>0;g++){let best=-1,bv=0; for(let s=0;s<NS;s++){const v=D[s]*(D[s]+F[s])*mI[s]/vol[s]; if(v>bv&&D[s]>1){bv=v;best=s;}} if(best<0)break; const r=Math.min(rem,D[best]-1); D[best]-=r; rem-=r;}}
      // fine missione, rimpiazzo e lanci
      for(let s=0;s<NS;s++){
        const ret=A[s]*dt/p.life; A[s]-=ret; D[s]+=ret*(1-p.pmd);
        let target=A0[s]*p.launch; if(s===megaS){ target+=p.mega.n; }
        if(abandoned[s]) target=0;
        // lancio verso il target: rimpiazzo dei ritirati + crescita entro 5 anni
        const need=Math.max(0, target-A[s]);
        A[s]+= Math.min(need, (target/p.life)*dt + need*dt/5);
      }
      // decadimento atmosferico: D e F scendono di guscio; i frammenti (A/m maggiore) piu' in fretta
      for(let s=0;s<NS;s++){
        const dD=D[s]*dt/res[s], dF=F[s]*dt/(res[s]*p.fragLife);
        const qD=Math.min(dD,D[s]), qF=Math.min(dF,F[s]);
        D[s]-=qD; F[s]-=qF; if(s>0){D[s-1]+=qD; F[s-1]+=qF;}
      }
      for(let s=0;s<NS;s++) F[s]+=nF[s];
    }
    return out;
  }
  function sum(a){let x=0;for(const v of a)x+=v;return x;}
  return {initFrom, run, NS, H0, DH, hc, life};
})();
if (typeof module!=='undefined') module.exports=KS;
