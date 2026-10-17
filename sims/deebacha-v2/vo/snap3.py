# Snap sentence boundaries to real silences in the audio (word timings drift).
import json,wave,numpy as np
D='/mnt/project-files/tafsir/deebacha-video/vo3/'
R=48000; HOP=480; TH=-42; MINSIL=0.10
raw=json.load(open(D+'raw-sentences.json'))
def load(p):
    w=wave.open(D+f's{p}.wav'); return np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)
def silences(a):
    n=len(a)//HOP; f=a[:n*HOP].reshape(n,HOP)
    db=20*np.log10(np.sqrt((f**2).mean(1))/32768+1e-9)
    q=db<TH; out=[]; i=0
    while i<n:
        if q[i]:
            j=i
            while j<n and q[j]: j+=1
            if (j-i)*HOP/R>=MINSIL: out.append((i*HOP/R,j*HOP/R))
            i=j
        else: i+=1
    return out
res={}
for p in range(1,6):
    a=load(p); sil=silences(a); L=len(a)/R
    ss=[s for s in raw if s['part']==p]
    onset=sil[0][1] if sil and sil[0][0]==0 else 0.0
    offset=sil[-1][0] if sil and sil[-1][1]>=L-0.02 else L
    cuts=[]
    for k in range(len(ss)-1):
        b=(ss[k]['end']+ss[k+1]['start'])/2
        lo=cuts[-1][1] if cuts else onset
        cand=[x for x in sil if x[0]>=lo and x[1]<offset and abs((x[0]+x[1])/2-b)<1.5]
        if not cand:
            # quietest 60 ms window near the boundary
            n=len(a)//HOP; f=a[:n*HOP].reshape(n,HOP); e=(f**2).mean(1)
            i0=max(int((b-0.9)*R/HOP),int(lo*R/HOP)); i1=int((b+0.3)*R/HOP)
            w=np.convolve(e[i0:i1],np.ones(6),'valid'); i=i0+int(w.argmin())
            x=(i*HOP/R,(i+6)*HOP/R); print('QUIET',p,k,x,ss[k+1]['text'][:30]); cuts.append(x); continue
        x=min(cand,key=lambda x:abs((x[0]+x[1])/2-b)-0.5*min(x[1]-x[0],1.0))
        cuts.append(x)
    res[p]=dict(onset=onset,offset=offset,L=L,cuts=cuts)
    d=[round((c[0]+c[1])/2-(ss[k]['end']+ss[k+1]['start'])/2,2) for k,c in enumerate(cuts)]
    print(p,'onset',round(onset,2),'offset',round(offset,2),'L',round(L,2),'drift max',max(map(abs,d)),'mean',round(float(np.mean(d)),2))
json.dump(res,open(D+'cuts.json','w'))
