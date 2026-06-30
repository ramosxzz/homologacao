import re, sys, collections
path, H = sys.argv[1], float(sys.argv[2])
html = open(path).read()
words = re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', html)
lines = collections.OrderedDict()
for xMin,yMin,xMax,yMax,t in words:
    key = round(float(yMin))
    lines.setdefault(key, []).append((float(xMin),float(xMax),float(yMin),float(yMax),t))
for key in sorted(lines):
    ws = sorted(lines[key], key=lambda w:w[0])
    txt=' '.join(w[4] for w in ws)
    x0=ws[0][0]; xe=ws[-1][1]; yMax=ws[0][3]
    print(f"pdfY={H-yMax:6.1f} x0={x0:6.1f} xEnd={xe:6.1f} | {txt[:88]}")
