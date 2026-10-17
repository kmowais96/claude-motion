# Urdu takes -> sentences. Each Urdu sentence stands in for the English one at the same index,
# so it borrows that sentence's section, paragraph and (English) caption text.
import json,re
D='/mnt/project-files/tafsir/deebacha-video/urdu/vo/'
EN=json.load(open('../sentences.json'))['sentences']
out=[]
for p in range(1,6):
    toks=[w for w in json.load(open(D+f'w{p}.json'))['words'] if w['type']=='word']
    items=[];buf=None
    for w in toks:
        t=w['text']
        if buf is not None:
            buf['text']+=' '+t; buf['end']=w['end']
            if t.endswith(']'): items.append(buf); buf=None
            continue
        if t.startswith('[') and not t.endswith(']'): buf=dict(w); continue
        items.append(dict(w))
    sents=[];cur=[];brk=None
    for it in items:
        t=it['text']
        if t.startswith('['):
            if t=='[pause]': brk=max(brk or 0,1)
            if t=='[long pause]': brk=2
            continue
        if not cur and brk is not None and sents: sents[-1]['after']=brk; brk=None
        cur.append(it)
        if re.search(r'[۔؟]$',t):
            sents.append({'part':p,'ur':' '.join(x['text'] for x in cur),'start':cur[0]['start'],'end':cur[-1]['end'],'after':0}); cur=[]
    if cur: sents.append({'part':p,'ur':' '.join(x['text'] for x in cur),'start':cur[0]['start'],'end':cur[-1]['end'],'after':0})
    out+=sents
assert len(out)==len(EN),(len(out),len(EN))
bad=0
for i,(u,e) in enumerate(zip(out,EN)):
    assert u['part']==e['part'],i
    u.update(sec=e['sec'],para=e['para'],text=e['text'])
    nxt=EN[i+1] if i+1<len(EN) else None
    want=0 if not nxt else (2 if nxt['sec']!=e['sec'] else (1 if nxt['para']!=e['para'] else 0))
    if nxt and nxt['part']==e['part'] and want!=u['after']: bad+=1; print('break mismatch',i,want,u['after'],u['ur'][:40])
json.dump(out,open(D+'raw-sentences.json','w'),indent=0,ensure_ascii=False)
print(len(out),'sentences; break mismatches',bad)
