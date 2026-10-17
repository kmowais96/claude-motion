# Assemble narration cutting only inside real silences; padding goes into those silences.
import json,wave,numpy as np
D="/mnt/project-files/tafsir/deebacha-video/vo3/"
R=48000; LEAD=7.6; TAIL=2.0; PRE=0.12; POST=0.30
REAL=0.30   # only a pause at least this long may be opened up; shorter gaps are run-ons and stay untouched
MIN={0:0.7,1:1.6,2:2.8}
EXTRA={0:0.6,1:1.4,2:2.6}  # on top of the natural pause, to keep v3's unhurried pacing
raw=json.load(open(D+'raw-sentences.json')); C=json.load(open(D+'cuts.json'))
def load(p):
    w=wave.open(D+f's{p}.wav'); return np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)
def fade(x,head,tail,n=480):
    n=min(n,len(x)//2); r=np.linspace(0,1,n); x=x.copy()
    if head: x[:n]*=r
    if tail: x[-n:]*=r[::-1]
    return x
out=[np.zeros(int(LEAD*R),np.float32)]; t=LEAD; sents=[]
for p in range(1,6):
    a=load(p); c=C[str(p)]; ss=[s for s in raw if s['part']==p]
    # boundaries in source time: segment k runs from bnd[k] to bnd[k+1] (cut at silence centres)
    on=c['onset']; off=c['offset']
    bnd=[max(0,on-PRE)]+[(x[0]+x[1])/2 for x in c['cuts']]+[min(c['L'],off+POST)]
    for k,s in enumerate(ss):
        st=on if k==0 else c['cuts'][k-1][1]
        en=off if k==len(ss)-1 else c['cuts'][k][0]
        real=lambda j: j<0 or j>=len(c['cuts']) or c['cuts'][j][1]-c['cuts'][j][0]>=REAL
        seg=fade(a[int(bnd[k]*R):int(bnd[k+1]*R)],real(k-1),real(k))
        sents.append(dict(part=p,sec=s['sec'],para=s['para'],text=s['text'],start=round(t+st-bnd[k],3),end=round(t+en-bnd[k],3)))
        out.append(seg); t+=len(seg)/R
        if p==5 and k==len(ss)-1: break
        brk=2 if k==len(ss)-1 else s['after']
        have=(bnd[k+1]-en)+((c['cuts'][k][1]-bnd[k+1]) if k<len(ss)-1 else PRE)
        add=max(MIN[brk]-have,EXTRA[brk]) if real(k) else 0.0
        out.append(np.zeros(int(add*R),np.float32)); t+=int(add*R)/R
out.append(np.zeros(int(TAIL*R),np.float32))
y=np.concatenate(out); total=len(y)/R
w=wave.open(D+'narration-v3.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(R); w.writeframes(np.clip(y,-32768,32767).astype(np.int16).tobytes()); w.close()
for i,s in enumerate(sents): s['idx']=i
json.dump({'total':round(total,3),'sentences':sents},open(D+'sentences-v3.json','w'),indent=1,ensure_ascii=False)
print(round(total,2),len(sents))
