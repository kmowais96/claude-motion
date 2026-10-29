"""Sound for KishkVideo: light effects under the sermon. No music bed; his voice carries it.

    python3 -m sfx sfx/cues/kishk.py
"""

from sfx.synth import blip, click, impact, pop, riser, scratch, whoosh

TIMELINE = "src/kishk/timeline.json"
OUT = "public/kishk/sfx.wav"
TARGET_LUFS = -30.0

STACKS = [5, 9, 13, 17, 12, 8, 4]


def score(mix, tl):
    k = {n: v[0] for n, v in tl["key"].items()}
    names = tl["names"]
    fin = tl["final"]["s"]
    end = tl["final"]["e"] + 0.35
    put = mix.put

    put(0.0, scratch(1.0), 0.06)

    # whoever wants… the answer lands
    order = sorted((n for n in k if n.rstrip("2") in ("companion", "proof", "wealth", "reminder")), key=k.get) + ["none"]
    for i, n in enumerate(order[:-1]):
        st, en = k[n], k[order[i + 1]]
        put(st - 0.15, whoosh(0.45, 2600, 700, peak=0.4), 0.08)
        ans = st + 0.42 * (en - st)
        put(ans, pop(820 + (i % 4) * 90, 360), 0.22, (i % 4 - 1.5) * 0.15)
    put(k["none"] - 0.1, whoosh(0.7, 3000, 300, peak=0.6), 0.1)
    put(k["fire"] - 0.2, whoosh(1.4, 120, 900, peak=0.7, q=0.5), 0.2)
    put(k["fire"] + 0.15, pop(600, 180), 0.26)

    put(k["adam"] - 0.3, whoosh(0.9, 1800, 300, peak=0.5), 0.1)
    put(k["weep"] - 0.1, whoosh(0.6, 500, 2200, peak=0.5), 0.08)
    put(k["separate"] - 0.2, whoosh(0.7, 2400, 500, peak=0.5), 0.08)

    # coins stack, then crumble
    a = k["tyrants"]
    put(a + 0.2, pop(760, 320), 0.2)
    for c, n in enumerate(STACKS):
        for j in range(0, n, 3):
            put(a + 0.3 + c * 0.12 + j * 0.07, click(3600 + (c * 7 + j) % 5 * 260, dur=0.035), 0.05, (c - 3) * 0.2)
    put(k["survive"] + 0.35, whoosh(1.4, 5000, 400, peak=0.15, q=0.5), 0.12)

    put(k["army"] + 0.4, pop(700, 300), 0.2)
    put(k["army"] + 0.2, whoosh(k["grave"] - k["army"] - 0.6, 200, 1200, peak=0.8, q=0.6), 0.07)
    put(k["grave"] - 0.1, whoosh(1.2, 2500, 150, peak=0.5), 0.14)
    put(k["grave"] + 0.6, blip(49.0, dur=0.8, tau=0.25), 0.4)

    put(k["silent"] - 0.2, whoosh(0.6, 2000, 600, peak=0.5), 0.08)
    put(k["believe"] - 0.4, whoosh(1.6, 300, 2600, peak=0.7, q=0.6), 0.1)
    for n in ("verily1", "verily2", "verily3"):
        put(k[n], blip(146.83, dur=1.2, tau=0.45), 0.08)

    # the names: a soft low pulse under each crowd answer, then one riser into the final line
    put(k["tellme"] - 0.2, whoosh(0.8, 400, 2800, peak=0.6), 0.1)
    for i, n in enumerate(names):
        put(n["hit"], blip(98.0, dur=0.45, tau=0.12), 0.16, ((i % 3) - 1) * 0.2)
    put(names[-6]["hit"], riser(fin - names[-6]["hit"], 200, 3600), 0.1)
    put(fin - 0.01, impact(), 0.3)

    put(end - 0.1, whoosh(0.6, 2600, 700, peak=0.4), 0.08)
    put(end + 0.9, pop(1000, 500), 0.18)
