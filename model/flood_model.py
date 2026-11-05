import json, numpy as np
hist = [
  {"name":"Web dev (bootcamp era)","stages":[1995,2005,2011,2013,2016,2023],"barrier":2},
  {"name":"Data science","stages":[2006,2010,2012,2014,2017,2020],"barrier":3},
  {"name":"Mobile app dev","stages":[2007,2009,2010,2011,2012,2014],"barrier":2},
  {"name":"Commercial drone pilot","stages":[2010,2014,2016,2016,2017,2019],"barrier":2},
  {"name":"Blockchain / crypto dev","stages":[2008,2017,2018,2018,2021,2022],"barrier":2},
  {"name":"Prompt engineer","stages":[2020,2023,2023,2023,2023,2024],"barrier":1},
]
# hands-on fields still short as of 2026 -> lag is at least (2026 - spike)
censored = [
  {"name":"Wind turbine technician","spike":2010,"barrier":4},
  {"name":"EV service technician","spike":2020,"barrier":4},
]
def f(spike,b): return [1.0, spike-2010, b]
def fit(H, C):
    X = [f(r["stages"][2],r["barrier"]) for r in H]; y=[r["stages"][5]-r["stages"][2] for r in H]
    Xc = [f(c["spike"],c["barrier"]) for c in C]; yc=[2026-c["spike"] for c in C]
    w=None
    for _ in range(50):
        XX=np.array(X+[x for x,_ in zip(Xc,yc)],float)
        yy=list(y)
        for x,lb in zip(Xc,yc):
            p = lb if w is None else max(lb, float(np.dot(w,x)))
            yy.append(p)
        I=np.eye(3); I[0,0]=0
        w=np.linalg.solve(XX.T@XX+0.5*I, XX.T@np.array(yy,float))
    return w
pred=lambda w,s,b: max(1.0,float(np.dot(w,f(s,b))))
bt=[]
for i,r in enumerate(hist):
    w=fit(hist[:i]+hist[i+1:],censored)
    p=r["stages"][2]+pred(w,r["stages"][2],r["barrier"])
    bt.append({"name":r["name"],"spike":r["stages"][2],"actual":r["stages"][5],"predicted":round(p,1),"error":round(p-r["stages"][5],1)})
mae=float(np.mean([abs(b["error"]) for b in bt]))
w=fit(hist,censored)
fund_lag=float(np.median([r["stages"][2]-r["stages"][1] for r in hist]))
current=[
  {"name":"Agentic AI engineer","stages":[2023,2024,2025],"barrier":2},
  {"name":"Cybersecurity (entry level)","stages":[2000,2013,2015],"barrier":3},
  {"name":"Robotics technician","stages":[2015,2021,2024],"barrier":4},
  {"name":"Data center critical-facilities tech","stages":[2018,2023,2024],"barrier":4},
  {"name":"Humanoid robot field service","stages":[2022,2025],"barrier":4},
]
preds=[]
for c in current:
    s=c["stages"]; spike=s[2] if len(s)>=3 else s[1]+fund_lag
    sat=spike+pred(w,spike,c["barrier"])
    preds.append({"name":c["name"],"barrier":c["barrier"],"known":s,"spike":round(spike,1),"spike_predicted":len(s)<3,
      "flood_year":round(sat,1),"low":round(sat-mae,1),"high":round(sat+mae,1)})
out={"weights":{"intercept":round(w[0],2),"per_year_later":round(w[1],2),"per_barrier_point":round(w[2],2)},
 "fund_to_job_lag_median":fund_lag,"backtest":bt,"mae_years":round(mae,2),"historical":hist,"censored":censored,"predictions":preds}
json.dump(out,open("model_output.json","w"),indent=1)
print(json.dumps({k:out[k] for k in ["weights","backtest","mae_years","predictions"]},indent=1))
