"""Self-host only the Latin font subsets used by the journal."""
import re
import urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets'/'fonts'
DEST.mkdir(parents=True,exist_ok=True)
families=[('Literata','Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700','literata'),
          ('Bricolage Grotesque','Bricolage+Grotesque:opsz,wght@12..96,400..700','bricolagegrotesque'),
          ('Kalam','Kalam:wght@400','kalam')]
output=[]
for name,query,folder in families:
    url='https://fonts.googleapis.com/css2?family='+query+'&display=swap'
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'})
    css=urllib.request.urlopen(req,timeout=30).read().decode()
    blocks=re.findall(r'/\* latin \*/\s*(@font-face\s*\{[^}]+\})',css)
    if not blocks:
        raise RuntimeError('No Latin subset found for '+name)
    for i,block in enumerate(blocks):
        src=re.search(r'url\((https://[^)]+)\)',block).group(1)
        filename=folder+('-italic' if 'font-style: italic' in block else '')+'.woff2'
        (DEST/filename).write_bytes(urllib.request.urlopen(src,timeout=30).read())
        output.append(block.replace(src,'fonts/'+filename))
    license_url='https://raw.githubusercontent.com/google/fonts/main/ofl/'+folder+'/OFL.txt'
    (DEST/(folder+'-OFL.txt')).write_bytes(urllib.request.urlopen(license_url,timeout=30).read())
    print('Downloaded',name,flush=True)
(ROOT/'assets'/'fonts.css').write_text('\n\n'.join(output)+'\n',encoding='utf-8')
