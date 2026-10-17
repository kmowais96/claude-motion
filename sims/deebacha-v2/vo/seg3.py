import json,re,sys
D='/mnt/project-files/tafsir/deebacha-video/vo3/'
SEC_START={1:1,2:4,3:7,4:10,5:13}
out=[]
for p in range(1,6):
    words=json.load(open(D+f'w{p}.json'))['words']
    toks=[w for w in words if w['type']=='word']
    # merge bracket tags
    items=[];buf=None
    for w in toks:
        t=w['text']
        if buf is not None:
            buf['text']+=' '+t; buf['end']=w['end']
            if t.endswith(']'): items.append(buf); buf=None
            continue
        if t.startswith('[') and not t.endswith(']'): buf=dict(w); continue
        items.append(dict(w))
    sec=SEC_START[p]; para=0; sents=[]; cur=[]; brk=None
    for it in items:
        t=it['text']
        if t.startswith('['):
            if t=='[pause]': brk=max(brk or 0,1)
            if t=='[long pause]': brk=2
            continue
        if not cur and brk is not None and sents:
            sents[-1]['after']=brk
            para+=1
            if brk==2: sec+=1
            brk=None
        cur.append(it)
        nxt_upper=True
        if re.search(r'[.?!]["\']?$',t) and not t.endswith('...'):
            sents.append({'part':p,'sec':sec,'para':para,'text':' '.join(x['text'] for x in cur),'start':cur[0]['start'],'end':cur[-1]['end'],'after':0})
            cur=[]
    if cur: sents.append({'part':p,'sec':sec,'para':para,'text':' '.join(x['text'] for x in cur),'start':cur[0]['start'],'end':cur[-1]['end'],'after':0})
    out+=sents
json.dump(out,open(D+'raw-sentences.json','w'),indent=0)
for s in out: print(s['part'],s['sec'],s['para'],s['after'],f"{s['start']:.2f}-{s['end']:.2f}",s['text'][:60])
