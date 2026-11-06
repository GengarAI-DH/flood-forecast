import json,os,sys
D="/home/claude/data"
names=["stages","forecasts","backtest","model","edges","accuracy","risk","clock","odds","briefs","watchlist","alerts","people","riskinfo","fit","tuning","calls","flashes"]
data={n:json.load(open(f"{D}/{n}.json")) for n in names}
data["radar"]=json.load(open("radar.json"))
page=open(sys.argv[1] if len(sys.argv)>1 else f"{D}/index.html").read()
files={}
fdir=sys.argv[2] if len(sys.argv)>2 else None
if fdir:
    for f in os.listdir(fdir): files[f]=open(os.path.join(fdir,f)).read()
J=lambda o: json.dumps(o).replace('</','<\\/')
d3=open("node_modules/d3/dist/d3.min.js").read()
html=f"""<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<style>
:root{{--color-fg:#1f1e1c;--color-fg-muted:#6b6862;--color-bg:#faf9f6;--color-panel:#fff;--color-border-line:#e4e1da;--color-ok:#2f7d4f;--color-warn:#b06d12;--color-bad:#b3362e;
--font-anthropic-sans:system-ui,sans-serif;--font-anthropic-serif:Georgia,serif;--cds-font-size-caption:12px;--cds-font-size-body:14px;--cds-font-size-heading:16px;--cds-font-size-title:24px;--cds-font-weight-medium:600;
--cds-gap-xs:4px;--cds-gap-sm:8px;--cds-gap-md:12px;--cds-gap-lg:20px;--cds-gap-xl:28px;--cds-pad-xs:4px;--cds-pad-sm:8px;--cds-pad-md:12px;--cds-pad-lg:16px;--cds-pad-xl:24px;--cds-radius:8px;
--cds-chart-grid:#eee;--cds-chart-axis:#bbb;--cds-chart-reference:#999;--cds-chart-muted:#c9c5bd;--cds-chart-status-critical:#d0572e;--cds-surface-popover:#fff;--cds-border:#ddd;--cds-shadow-popover:0 4px 12px rgba(0,0,0,.12);--cds-text-secondary:#6b6862;--cds-dur-slow:300ms;--cds-ease-out:ease-out}}
body{{margin:0;background:var(--color-bg);font-family:system-ui}} #dash-root{{padding:0 16px 40px}}
</style>
<script>{d3}</script></head><body><div id="dash-root"></div>
<script>
window.__errors=[];window.addEventListener('error',e=>__errors.push(String(e.message)));
const DATA={J(data)};const FILES={J(files)};const PAGE={J(page)};
const calcs={{}},draws={{}},onDatas=[];let params={{}};
const colors=['#2c6fbb','#d1793a','#3a9a6a','#8a5cc2','#c2456b','#4aa3b5','#9a8a2c','#6b6b6b'];
function rowsOf(id){{ if(DATA[id]) return DATA[id]; if(calcs[id]){{ const c=calcs[id]; return c.fn(...c.inputs.map(rowsOf)); }} return null; }}
window.dash={{
 data(id){{ try{{ const d=rowsOf(id); if(d==null) return {{status:'missing',data:[],message:'missing'}}; return {{status:'ok',data:d,rows:d,columns:d[0]?Object.keys(d[0]):[],refreshing:false,meta:[]}}; }}catch(e){{ __errors.push('calc '+id+': '+e.message); return {{status:'error',data:[],message:e.message}}; }} }},
 calc(id,o){{calcs[id]=o}}, loader(){{}}, colors, refresh(){{}}, setLink(){{}},
 params(){{return {{...params}}}}, setParams(o){{ for(const k in o){{ if(o[k]==null) delete params[k]; else params[k]=o[k]; }} runAll(); }}, resetParams(){{params={{}};runAll();}},
 onData(fn){{onDatas.push(fn); try{{fn()}}catch(e){{__errors.push('onData: '+e.message)}} }},
 draw(name,fn){{ if(fn===undefined){{ runOne(name); return; }} draws[name]=fn }}
}};
function runOne(name){{ document.querySelectorAll('[data-draw="'+name+'"]').forEach(el=>{{ if(el.closest('[hidden]')) return; try{{ const f=draws[name]; if(typeof f==='function') f(el); else {{ if(!el.__m){{el.__m=f.mount?f.mount(el):undefined;}} f.update&&f.update(el,el.__m); }} }}catch(e){{__errors.push('draw '+name+': '+e.message)}} }}); }}
function runAll(){{ onDatas.forEach(f=>{{try{{f()}}catch(e){{__errors.push('onData: '+e.message)}}}});
 for(const name in draws){{ document.querySelectorAll('[data-draw="'+name+'"]').forEach(el=>{{ if(el.closest('[hidden]')) return; try{{ const f=draws[name]; if(typeof f==='function') f(el); else {{ if(!el.__m){{el.__m=f.mount?f.mount(el):undefined;}} f.update&&f.update(el,el.__m); }} }}catch(e){{__errors.push('draw '+name+': '+e.message)}} }}); }} }}
window.__unknownDraws=()=>[...document.querySelectorAll('[data-draw]')].map(e=>e.dataset.draw).filter(n=>!draws[n]);
const root=document.getElementById('dash-root'); root.innerHTML=PAGE;
const scripts=[...root.querySelectorAll('script, link[rel=stylesheet]')];
for(const s of scripts){{
  if(s.tagName==='LINK'){{ const st=document.createElement('style'); st.textContent=FILES[s.getAttribute('href')]||''; s.replaceWith(st); continue; }}
  const src=s.getAttribute('src'); const code=src?FILES[src]:s.textContent;
  if(src && code==null) __errors.push('missing file '+src);
  try{{ (new Function(code||''))(); }}catch(e){{ __errors.push('script: '+e.message); }}
}}
new MutationObserver(ms=>{{ if(ms.some(m=>m.attributeName==='hidden')) runAll(); }}).observe(root,{{attributes:true,subtree:true,attributeFilter:['hidden']}});
runAll(); window.addEventListener('resize',runAll);
</script></body></html>"""
open("harness.html","w").write(html)
print("ok", len(html))
