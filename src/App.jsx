import { useState, useEffect, useRef, useCallback } from "react";

// ─── INDEXEDDB STORAGE ────────────────────────────────────────────────────────

const DB_NAME = "training_sys";
const DB_VERSION = 1;
const STORE = "workout_data";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => { e.target.result.createObjectStore(STORE); };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function idbSet(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}


// ─── PROGRAM DATA ─────────────────────────────────────────────────────────────

const PROGRAM = {
  A: {
    label: "DAY A", sub: "Strength + Easy Run",
    exercises: [
      { name: "Dumbbell Bench Press", sets: 3, reps: "8–12" },
      { name: "Lat Pulldown", sets: 3, reps: "10–12" },
      { name: "Cable Low Row", sets: 3, reps: "10–12" },
      { name: "Step-Ups", sets: 3, reps: "10/leg" },
      { name: "Seated DB Shoulder Press", sets: 3, reps: "8–12" },
      { name: "Rope Triceps Pushdown", sets: 2, reps: "10–12" },
      { name: "Hanging Leg Raises", sets: 3, reps: "8–12" },
    ],
    run: {
      type: "easy",
      weeks: [
        { structure: "1min run / 1min walk", total: "20 min", runSec: 60, walkSec: 60, totalMin: 20 },
        { structure: "1min run / 1min walk", total: "20 min", runSec: 60, walkSec: 60, totalMin: 20 },
        { structure: "2min run / 1min walk", total: "22 min", runSec: 120, walkSec: 60, totalMin: 22 },
        { structure: "2min run / 1min walk", total: "24 min", runSec: 120, walkSec: 60, totalMin: 24 },
        { structure: "3min run / 1min walk", total: "26 min", runSec: 180, walkSec: 60, totalMin: 26 },
        { structure: "3min run / 1min walk", total: "28 min", runSec: 180, walkSec: 60, totalMin: 28 },
        { structure: "4min run / 1min walk", total: "28 min", runSec: 240, walkSec: 60, totalMin: 28 },
        { structure: "Continuous run", total: "30 min", runSec: 1800, walkSec: 0, totalMin: 30 },
      ],
    },
  },
  B: {
    label: "DAY B", sub: "Strength + Intervals",
    exercises: [
      { name: "Dumbbell Bench Press", sets: 3, reps: "8–10" },
      { name: "Lat Pulldown", sets: 3, reps: "10–12" },
      { name: "Cable Low Row", sets: 3, reps: "10–12" },
      { name: "Step-Ups", sets: 3, reps: "10/leg" },
      { name: "Seated DB Bicep Curl", sets: 2, reps: "10–12" },
      { name: "Rope Triceps Pushdown", sets: 2, reps: "8–10" },
      { name: "Hanging Leg Raises", sets: 3, reps: "8–12" },
    ],
    run: {
      type: "intervals",
      weeks: [
        { fast: "30s", walk: "90s", rounds: "8–10", fastSec: 30, walkSec: 90, roundCount: 9 },
        { fast: "30s", walk: "90s", rounds: "8–10", fastSec: 30, walkSec: 90, roundCount: 9 },
        { fast: "45s", walk: "75s", rounds: "8–10", fastSec: 45, walkSec: 75, roundCount: 9 },
        { fast: "45s", walk: "75s", rounds: "8–10", fastSec: 45, walkSec: 75, roundCount: 9 },
        { fast: "60s", walk: "60s", rounds: "8–10", fastSec: 60, walkSec: 60, roundCount: 9 },
        { fast: "60s", walk: "60s", rounds: "8–10", fastSec: 60, walkSec: 60, roundCount: 9 },
        { fast: "75s", walk: "45s", rounds: "8–10", fastSec: 75, walkSec: 45, roundCount: 9 },
        { fast: "75s", walk: "45s", rounds: "8–10", fastSec: 75, walkSec: 45, roundCount: 9 },
      ],
    },
  },
  C: {
    label: "DAY C", sub: "Strength + Long Easy Run",
    exercises: [
      { name: "Dumbbell Bench Press", sets: 3, reps: "8–12" },
      { name: "Lat Pulldown", sets: 3, reps: "10–12" },
      { name: "Cable Low Row", sets: 3, reps: "10–12" },
      { name: "Step-Ups", sets: 3, reps: "10/leg" },
      { name: "Seated DB Shoulder Press", sets: 2, reps: "8–10" },
      { name: "Rope Triceps Pushdown", sets: 2, reps: "10–12" },
      { name: "Hanging Leg Raises", sets: 3, reps: "8–12" },
    ],
    run: {
      type: "long",
      weeks: [
        { duration: "15 min", pace: "Very easy", totalMin: 15 },
        { duration: "18 min", pace: "Very easy", totalMin: 18 },
        { duration: "20 min", pace: "Very easy", totalMin: 20 },
        { duration: "22 min", pace: "Very easy", totalMin: 22 },
        { duration: "25 min", pace: "Very easy", totalMin: 25 },
        { duration: "28 min", pace: "Very easy", totalMin: 28 },
        { duration: "30 min", pace: "Very easy", totalMin: 30 },
        { duration: "33 min", pace: "Very easy", totalMin: 33 },
      ],
    },
  },
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────

function freshData() {
  const d = { bodyWeight: [] }; // [{date, kg}]
  for (const day of ["A","B","C"]) {
    d[day] = {};
    for (let w = 1; w <= 8; w++) {
      d[day][w] = {
        exercises: {},   // { exName: kg|null }
        runKm: null,     // distance logged after run
        done: false,
      };
      for (const ex of PROGRAM[day].exercises) {
        d[day][w].exercises[ex.name] = null;
      }
    }
  }
  return d;
}

// Async IDB-backed save (fire and forget)
function saveData(d) {
  idbSet("wt_v4", d).catch(() => {
    // fallback to localStorage
    try { localStorage.setItem("wt_v4", JSON.stringify(d)); } catch {}
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmt = (v) => v === null || v === undefined ? null : v === 0 ? "BW" : `${v}kg`;
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2,"0");
const fmtTime = (s) => `${pad(s/60)}:${pad(s%60)}`;
const today = () => new Date().toISOString().slice(0,10);

// ─── AUDIO ───────────────────────────────────────────────────────────────────

function useBeep() {
  const ctxRef = useRef(null);
  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext||window.webkitAudioContext)();
    return ctxRef.current;
  };
  const tone = useCallback((freq, dur, vol=0.22, type="sine") => {
    try {
      const ctx = getCtx();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; o.type = type;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime+0.01);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime+dur);
      o.start(ctx.currentTime); o.stop(ctx.currentTime+dur+0.05);
    } catch {}
  }, []);
  const cueRun  = useCallback(()=>{ tone(1046,.1); setTimeout(()=>tone(1318,.15),110); },[tone]);
  const cueWalk = useCallback(()=>{ tone(523,.2); },[tone]);
  const cueDone = useCallback(()=>{ tone(880,.1); setTimeout(()=>tone(698,.1),130); setTimeout(()=>tone(523,.22),260); },[tone]);
  const cueTick = useCallback(()=>{ tone(660,.07,.1); },[tone]);
  return { cueRun, cueWalk, cueDone, cueTick };
}

const vibe = (p) => { try { navigator.vibrate?.(p); } catch {} };

// ─── NUMPAD ──────────────────────────────────────────────────────────────────

function Numpad({ value, label, unit="kg", onConfirm, onClose }) {
  const [val, setVal] = useState(value !== null && value !== undefined ? String(value) : "");
  const append = (ch) => { if (ch==="."&&val.includes(".")) return; if (val.length>=7) return; setVal(v=>v+ch); };
  const keys = ["7","8","9","4","5","6","1","2","3",".","0","⌫"];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",zIndex:300,backdropFilter:"blur(6px)"}} onClick={onClose}>
      <div style={{width:"100%",maxWidth:400,background:"#0d0d0d",borderTop:"1px solid #2a2a2a",padding:"16px 16px 36px",borderRadius:"16px 16px 0 0"}} onClick={e=>e.stopPropagation()}>
        {label && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#555",letterSpacing:3,textAlign:"center",marginBottom:8}}>{label}</div>}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:42,color:"#e8ff6b",textAlign:"center",letterSpacing:2,marginBottom:16,minHeight:54,borderBottom:"1px solid #1e1e1e",paddingBottom:12}}>
          {val===""?<span style={{opacity:0.2}}>0</span>:val}
          {val!==""&&<span style={{fontSize:18,color:"#555",marginLeft:6}}>{unit}</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {keys.map(k=>(
            <button key={k} onClick={()=>k==="⌫"?setVal(v=>v.slice(0,-1)):append(k)}
              style={{background:k==="⌫"?"#1a1a1a":"#141414",border:"1px solid #222",borderRadius:8,color:k==="⌫"?"#ff6b6b":"#e0e0e0",fontFamily:"'JetBrains Mono',monospace",fontSize:22,padding:"14px 0",cursor:"pointer"}}>
              {k}
            </button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
          <button onClick={onClose} style={{background:"#141414",border:"1px solid #2a2a2a",borderRadius:8,color:"#555",fontFamily:"'JetBrains Mono',monospace",fontSize:14,padding:"14px 0",cursor:"pointer"}}>CANCEL</button>
          <button onClick={()=>onConfirm(val===""?null:isNaN(parseFloat(val))?null:parseFloat(val))} style={{background:"#e8ff6b",border:"none",borderRadius:8,color:"#0d0d0d",fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,padding:"14px 0",cursor:"pointer"}}>SAVE</button>
        </div>
      </div>
    </div>
  );
}

// ─── RUN TIMER ────────────────────────────────────────────────────────────────

function RunTimer({ runConfig, runType, onClose }) {
  const [phase, setPhase] = useState("idle");
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const stateRef = useRef({ phase:"idle", round:1, timeLeft:0, totalElapsed:0 });
  const intervalRef = useRef(null);
  const { cueRun, cueWalk, cueDone, cueTick } = useBeep();

  const isIntervals = runType === "intervals";
  const totalRounds = runConfig.roundCount || 9;
  const runSec  = isIntervals ? runConfig.fastSec : (runConfig.runSec || runConfig.totalMin*60);
  const walkSec = isIntervals ? runConfig.walkSec : (runConfig.walkSec || 0);
  const totalSec = (runConfig.totalMin || 20) * 60;

  const stop = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  const goPhase = useCallback((ph, rnd, elapsed) => {
    stop();
    const dur = ph==="running" ? runSec : walkSec;
    stateRef.current = { phase:ph, round:rnd, timeLeft:dur, totalElapsed:elapsed };
    setPhase(ph); setRound(rnd); setTimeLeft(dur); setTotalElapsed(elapsed);
    if (ph==="running") { cueRun(); vibe([80,40,80]); }
    if (ph==="walking") { cueWalk(); vibe([200]); }
    intervalRef.current = setInterval(() => {
      const s = stateRef.current;
      const next = s.timeLeft - 1;
      if (next<=3&&next>0) cueTick();
      if (next<=0) {
        stop();
        const newEl = s.totalElapsed + (s.phase==="running"?runSec:walkSec);
        if (isIntervals) {
          if (s.phase==="running") {
            if (s.round>=totalRounds) { setPhase("done"); stateRef.current.phase="done"; cueDone(); vibe([200,80,200,80,400]); }
            else goPhase("walking", s.round, newEl);
          } else { goPhase("running", s.round+1, newEl); }
        } else {
          if (newEl>=totalSec) { setPhase("done"); stateRef.current.phase="done"; cueDone(); vibe([200,80,200,80,400]); }
          else if (s.phase==="running"&&walkSec>0) goPhase("walking", s.round, newEl);
          else goPhase("running", s.round+1, newEl);
        }
        return;
      }
      stateRef.current.timeLeft=next; setTimeLeft(next);
    }, 1000);
  }, [runSec, walkSec, totalRounds, totalSec, isIntervals, cueRun, cueWalk, cueDone, cueTick]);

  const handleReset = () => { stop(); setPhase("idle"); setRound(1); setTimeLeft(0); setTotalElapsed(0); stateRef.current={phase:"idle",round:1,timeLeft:0,totalElapsed:0}; };
  const handlePause = () => { stop(); const np=stateRef.current.phase==="running"?"running_paused":"walking_paused"; setPhase(np); stateRef.current.phase=np; };
  const handleResume = () => {
    const s=stateRef.current; const ph=s.phase==="running_paused"?"running":"walking";
    stateRef.current.phase=ph; setPhase(ph);
    intervalRef.current=setInterval(()=>{
      const ss=stateRef.current; const next=ss.timeLeft-1;
      if(next<=3&&next>0) cueTick();
      if(next<=0){ stop(); goPhase(ph==="running"?(walkSec>0?"walking":"running"):"running", ph==="walking"?ss.round+1:ss.round, ss.totalElapsed+(ph==="running"?runSec:walkSec)); return; }
      stateRef.current.timeLeft=next; setTimeLeft(next);
    },1000);
  };
  useEffect(()=>()=>stop(),[]);

  const isRunning=phase==="running"||phase==="running_paused";
  const isWalking=phase==="walking"||phase==="walking_paused";
  const isActive=phase==="running"||phase==="walking";
  const isPaused=phase==="running_paused"||phase==="walking_paused";
  const isDone=phase==="done";
  const phaseColor=isRunning?"#e8ff6b":isWalking?"#6bb8ff":isDone?"#6abf40":"#2a2a2a";
  const phaseLabel=isRunning?"RUN":isWalking?"WALK":isDone?"DONE":"READY";
  const ringMax=isRunning?runSec:walkSec||1;
  const ringPct=(isActive||isPaused)?Math.max(0,Math.min(1,(ringMax-timeLeft)/ringMax)):0;
  const R=90,circ=2*Math.PI*R;

  return (
    <div style={{position:"fixed",inset:0,background:"#060606",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 24px 48px",boxSizing:"border-box"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#444",letterSpacing:3}}>{runType==="intervals"?"INTERVALS":runType==="easy"?"EASY RUN":"LONG EASY"}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer"}}>✕ CLOSE</button>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"relative",width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={220} height={220} style={{position:"absolute",transform:"rotate(-90deg)"}}>
            <circle cx={110} cy={110} r={R} fill="none" stroke="#141414" strokeWidth={10}/>
            {(isActive||isPaused)&&<circle cx={110} cy={110} r={R} fill="none" stroke={phaseColor} strokeWidth={10} strokeDasharray={circ} strokeDashoffset={circ*(1-ringPct)} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.85s linear,stroke 0.3s"}}/>}
            {isDone&&<circle cx={110} cy={110} r={R} fill="none" stroke="#6abf40" strokeWidth={10} strokeDasharray={circ} strokeDashoffset={0}/>}
          </svg>
          <div style={{textAlign:"center",zIndex:1}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:phaseColor,letterSpacing:4,marginBottom:6,transition:"color 0.3s"}}>{phaseLabel}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:isDone?28:50,fontWeight:700,color:"#e0e0e0",lineHeight:1}}>
              {isDone?"DONE!":phase==="idle"?fmtTime(runSec):fmtTime(timeLeft)}
            </div>
            {isIntervals&&!isDone&&phase!=="idle"&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:"#555",marginTop:8}}>round <span style={{color:"#e0e0e0"}}>{round}</span><span style={{color:"#2a2a2a"}}>/{totalRounds}</span></div>}
          </div>
        </div>
        {!isIntervals&&(isActive||isPaused||isDone)&&(
          <div style={{width:"100%",maxWidth:240,marginTop:24}}>
            <div style={{background:"#141414",borderRadius:3,height:3,overflow:"hidden"}}><div style={{width:`${Math.min(1,totalElapsed/totalSec)*100}%`,height:"100%",background:"#6bb8ff",transition:"width 1s linear"}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333"}}>{fmtTime(totalElapsed)}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333"}}>{fmtTime(totalSec)}</span>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:20,marginTop:32}}>
          {isIntervals?[["FAST",runConfig.fast,"#e8ff6b"],["WALK",runConfig.walk,"#6bb8ff"],["ROUNDS",runConfig.rounds,"#777"]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333",letterSpacing:2,marginBottom:4}}>{l}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,color:c}}>{v}</div></div>
          )):[["DURATION",runConfig.duration||runConfig.total],["PACE",runConfig.pace||"Easy"]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333",letterSpacing:2,marginBottom:4}}>{l}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,color:"#888"}}>{v}</div></div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,width:"100%",maxWidth:320}}>
        {phase==="idle"&&<button onClick={()=>goPhase("running",1,0)} style={{flex:1,background:"#e8ff6b",border:"none",borderRadius:14,color:"#060606",fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,padding:"20px 0",cursor:"pointer",letterSpacing:3}}>START</button>}
        {isActive&&<><button onClick={handlePause} style={{flex:1,background:"#141414",border:"1px solid #222",borderRadius:14,color:"#e0e0e0",fontFamily:"'JetBrains Mono',monospace",fontSize:14,padding:"20px 0",cursor:"pointer",letterSpacing:2}}>PAUSE</button><button onClick={handleReset} style={{background:"#141414",border:"1px solid #222",borderRadius:14,color:"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:18,padding:"20px 22px",cursor:"pointer"}}>↺</button></>}
        {isPaused&&<><button onClick={handleResume} style={{flex:1,background:"#e8ff6b",border:"none",borderRadius:14,color:"#060606",fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,padding:"20px 0",cursor:"pointer",letterSpacing:2}}>RESUME</button><button onClick={handleReset} style={{background:"#141414",border:"1px solid #222",borderRadius:14,color:"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:18,padding:"20px 22px",cursor:"pointer"}}>↺</button></>}
        {isDone&&<button onClick={handleReset} style={{flex:1,background:"#141414",border:"1px solid #2a2a2a",borderRadius:14,color:"#e0e0e0",fontFamily:"'JetBrains Mono',monospace",fontSize:14,padding:"20px 0",cursor:"pointer",letterSpacing:2}}>RESTART</button>}
      </div>
    </div>
  );
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────

function Sparkline({ values, color="#e8ff6b" }) {
  const f=values.filter(v=>v!==null&&v!==undefined&&!isNaN(v));
  if (f.length<2) return <span style={{fontSize:11,color:"#2a2a2a"}}>–</span>;
  const w=100,h=26,mn=Math.min(...f),mx=Math.max(...f),rng=mx-mn||1;
  const pts=f.map((v,i)=>`${(i/(f.length-1))*w},${h-((v-mn)/rng)*h}`).join(" ");
  return <svg width={w} height={h} style={{overflow:"visible"}}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round"/><circle cx={(f.length-1)/(f.length-1)*w} cy={h-((f[f.length-1]-mn)/rng)*h} r={3} fill={color}/></svg>;
}

// ─── SESSION VIEW ─────────────────────────────────────────────────────────────

function SessionView({ day, week, data, onUpdateExercise, onUpdateRun }) {
  const [numpad, setNumpad]       = useState(null); // {exName} | {type:"km"} 
  const [showTimer, setShowTimer] = useState(false);

  const prog     = PROGRAM[day];
  const session  = data[day]?.[week] || { exercises:{}, runKm:null, done:false };
  const exData   = session.exercises || {};
  const runKm    = session.runKm;
  const isDone   = prog.exercises.every(ex=>exData[ex.name]!==null&&exData[ex.name]!==undefined);
  const runInfo  = prog.run.weeks[week-1];

  const loggedCount = prog.exercises.filter(e => exData[e.name] !== null && exData[e.name] !== undefined).length;
  const total       = prog.exercises.length;
  const allLogged   = loggedCount === total && runKm !== null;

  return (
    <div>
      {showTimer && <RunTimer runConfig={runInfo} runType={prog.run.type} onClose={()=>setShowTimer(false)}/>}

      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#444",letterSpacing:3,marginBottom:4}}>WEEK {week} / 8</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:26,color:"#e8ff6b",fontWeight:700}}>{prog.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#444",marginTop:2}}>{prog.sub}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#333",marginBottom:4}}>
              {loggedCount}<span style={{color:"#2a2a2a"}}>/{total}</span>
            </div>
            {/* Mark done button */}

          </div>
        </div>
        <div style={{marginTop:10,background:"#141414",borderRadius:3,height:3,overflow:"hidden"}}>
          <div style={{width:`${(loggedCount/total)*100}%`,height:"100%",background:"#e8ff6b",transition:"width 0.4s"}}/>
        </div>
      </div>

      {/* Exercises */}
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333",letterSpacing:3,marginBottom:10}}>STRENGTH</div>
      {prog.exercises.map((ex,i) => {
        const val = exData[ex.name];
        const logged = val !== null && val !== undefined;
        // Find most recent logged weight for this exercise in a previous week/day
        let prevVal = null;
        if (!logged) {
          // Search backwards through previous weeks for same day
          for (let w = week - 1; w >= 1; w--) {
            const prev = data[day]?.[w]?.exercises?.[ex.name];
            if (prev !== null && prev !== undefined) { prevVal = prev; break; }
          }
          // If nothing found in same day, check other days that share this exercise
          if (prevVal === null) {
            const otherDays = ["A","B","C"].filter(d=>d!==day);
            outer: for (let w = week; w >= 1; w--) {
              for (const d of otherDays) {
                const prev = data[d]?.[w]?.exercises?.[ex.name];
                if (prev !== null && prev !== undefined) { prevVal = prev; break outer; }
              }
            }
          }
        }
        const display = fmt(val);
        const prevDisplay = fmt(prevVal);
        return (
          <div key={i} onClick={()=>setNumpad({exName:ex.name})} style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"13px 14px",marginBottom:6,
            background: logged ? "#0f0f0f" : "#090909",
            border:`1px solid ${logged?"#1e1e1e":"#111"}`,
            borderRadius:8,cursor:"pointer"
          }}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:logged?"#cccccc":"#333",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#252525"}}>{ex.sets} sets · {ex.reps} reps</div>
            </div>
            <div style={{textAlign:"right",minWidth:52}}>
              {logged ? (
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:"#e8ff6b"}}>{display}</div>
              ) : prevVal !== null ? (
                <>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:"#2e2e2e"}}>{prevDisplay}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#2a2a2a",marginTop:1}}>last time</div>
                </>
              ) : (
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:"#1e1e1e"}}>—</div>
              )}
            </div>
          </div>
        );
      })}

      {/* Run block */}
      <div style={{marginTop:20,background:"#090909",border:"1px solid #141414",borderRadius:8,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#444",letterSpacing:3}}>
            RUN — {prog.run.type==="intervals"?"INTERVALS":prog.run.type==="easy"?"EASY":"LONG EASY"}
          </div>
          <button onClick={()=>setShowTimer(true)} style={{background:"#e8ff6b",border:"none",borderRadius:6,color:"#060606",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,padding:"7px 12px",cursor:"pointer",letterSpacing:1}}>▶ TIMER</button>
        </div>

        {/* Run spec */}
        <div style={{display:"grid",gridTemplateColumns:prog.run.type==="intervals"?"1fr 1fr 1fr":"1fr 1fr",gap:12,marginBottom:16}}>
          {prog.run.type==="intervals"&&[["FAST",runInfo.fast],["WALK",runInfo.walk],["ROUNDS",runInfo.rounds]].map(([l,v])=>(
            <div key={l}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333",letterSpacing:2,marginBottom:4}}>{l}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,color:"#aaa"}}>{v}</div></div>
          ))}
          {prog.run.type==="easy"&&[["STRUCTURE",runInfo.structure],["TOTAL",runInfo.total]].map(([l,v])=>(
            <div key={l}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333",letterSpacing:2,marginBottom:4}}>{l}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#aaa"}}>{v}</div></div>
          ))}
          {prog.run.type==="long"&&[["DURATION",runInfo.duration],["PACE",runInfo.pace]].map(([l,v])=>(
            <div key={l}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333",letterSpacing:2,marginBottom:4}}>{l}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#aaa"}}>{v}</div></div>
          ))}
        </div>

        {/* Distance input */}
        <div style={{borderTop:"1px solid #141414",paddingTop:14}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333",letterSpacing:3,marginBottom:8}}>DISTANCE LOGGED</div>
          <div onClick={()=>setNumpad({type:"km"})} style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"10px 12px",background:"#060606",border:`1px solid ${runKm!==null?"#1e1e1e":"#111"}`,
            borderRadius:6,cursor:"pointer"
          }}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:runKm!==null?"#888":"#2a2a2a"}}>
              {runKm!==null?`${runKm} km`:"tap to log distance"}
            </span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:runKm!==null?"#6bb8ff":"#222"}}>
              {runKm!==null?`${runKm}km`:"—"}
            </span>
          </div>
        </div>
      </div>

      {numpad?.exName && (
        <Numpad
          value={exData[numpad.exName]}
          label={numpad.exName.toUpperCase()}
          unit="kg"
          onConfirm={val=>{ onUpdateExercise(day,week,numpad.exName,val); setNumpad(null); }}
          onClose={()=>setNumpad(null)}
        />
      )}
      {numpad?.type==="km" && (
        <Numpad
          value={runKm}
          label="DISTANCE RAN"
          unit="km"
          onConfirm={val=>{ onUpdateRun(day,week,val); setNumpad(null); }}
          onClose={()=>setNumpad(null)}
        />
      )}
    </div>
  );
}

// ─── CSV EXPORT ──────────────────────────────────────────────────────────────

function exportCSV(data) {
  const rows = [["Day","Week","Exercise","Sets","Reps","Weight (kg)"]];
  for (const day of ["A","B","C"]) {
    for (let w = 1; w <= 8; w++) {
      const session = data[day]?.[w];
      if (!session) continue;
      for (const ex of PROGRAM[day].exercises) {
        const val = session.exercises?.[ex.name];
        if (val !== null && val !== undefined) {
          rows.push([`Day ${day}`, `Week ${w}`, ex.name, ex.sets, ex.reps, val === 0 ? "BW" : val]);
        }
      }
      if (session.runKm !== null && session.runKm !== undefined) {
        rows.push([`Day ${day}`, `Week ${w}`, "Run Distance", "", "", `${session.runKm} km`]);
      }
    }
  }
  // Body weight
  for (const entry of (data.bodyWeight || [])) {
    rows.push(["—", "—", "Body Weight", "", "", `${entry.kg} kg (${entry.date})`]);
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `training_sys_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CHART PRIMITIVES ────────────────────────────────────────────────────────

// Full-width bar chart — values array, each {label, value, color?}
function BarChart({ bars, unit="", height=120, color="#e8ff6b" }) {
  const maxVal = Math.max(...bars.map(b=>b.value||0), 0.01);
  return (
    <div style={{width:"100%"}}>
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height}}>
        {bars.map((b,i)=>{
          const pct = b.value!=null ? (b.value/maxVal) : 0;
          const barColor = b.color || color;
          const isEmpty = b.value==null || b.value===0;
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%",gap:4}}>
              {!isEmpty&&b.value!=null&&(
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:barColor,letterSpacing:0,whiteSpace:"nowrap"}}>
                  {b.value}{unit}
                </div>
              )}
              <div style={{
                width:"100%",borderRadius:"3px 3px 0 0",
                height: isEmpty ? 2 : `${Math.max(2,pct*100)}%`,
                background: isEmpty?"#1a1a1a":barColor,
                transition:"height 0.4s ease",
                opacity: isEmpty?0.3:1
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:4,marginTop:6}}>
        {bars.map((b,i)=>(
          <div key={i} style={{flex:1,textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#333",overflow:"hidden"}}>{b.label}</div>
        ))}
      </div>
    </div>
  );
}

// Line chart with axes — values: array of {x, y} or null slots
function LineChart({ points, width="100%", height=140, color="#e8ff6b", unit="", yMin=null, yMax=null }) {
  const valid = points.filter(p=>p!=null&&p.y!=null);
  if (valid.length < 2) return (
    <div style={{height,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#2a2a2a"}}>not enough data yet</span>
    </div>
  );
  const W=300,H=height;
  const pad={top:12,right:8,bottom:24,left:32};
  const innerW=W-pad.left-pad.right;
  const innerH=H-pad.top-pad.bottom;
  const minY = yMin!=null?yMin:Math.min(...valid.map(p=>p.y));
  const maxY = yMax!=null?yMax:Math.max(...valid.map(p=>p.y));
  const rangeY = maxY-minY||1;
  const minX = Math.min(...valid.map(p=>p.x));
  const maxX = Math.max(...valid.map(p=>p.x));
  const rangeX = maxX-minX||1;
  const toSvg = (p) => ({
    x: pad.left + ((p.x-minX)/rangeX)*innerW,
    y: pad.top + (1-(p.y-minY)/rangeY)*innerH
  });
  const svgPts = valid.map(toSvg);
  const pathD = svgPts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  // Y axis ticks
  const yTicks = [minY, (minY+maxY)/2, maxY].map(v=>({
    val: v,
    y: pad.top + (1-(v-minY)/rangeY)*innerH
  }));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible",display:"block"}}>
      {/* Grid lines */}
      {yTicks.map((t,i)=>(
        <g key={i}>
          <line x1={pad.left} y1={t.y} x2={W-pad.right} y2={t.y} stroke="#1a1a1a" strokeWidth={1}/>
          <text x={pad.left-4} y={t.y+3} fill="#333" fontSize={8} textAnchor="end" fontFamily="monospace">{Number.isInteger(t.val)?t.val:t.val.toFixed(1)}</text>
        </g>
      ))}
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      {/* Dots */}
      {svgPts.map((p,i)=>(
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color}/>
      ))}
      {/* Last value label */}
      {svgPts.length>0&&(
        <text x={svgPts[svgPts.length-1].x+5} y={svgPts[svgPts.length-1].y+4} fill={color} fontSize={9} fontFamily="monospace">{valid[valid.length-1].y}{unit}</text>
      )}
      {/* X axis labels */}
      {svgPts.map((p,i)=>(
        <text key={i} x={p.x} y={H} fill="#333" fontSize={8} textAnchor="middle" fontFamily="monospace">{valid[i].label||valid[i].x}</text>
      ))}
    </svg>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────

function ChartToggle({ mode, onChange }) {
  return (
    <div style={{display:"flex",gap:3}}>
      {[["bar","▬"],["line","╱"],["dot","•"]].map(([m,icon])=>(
        <button key={m} onClick={()=>onChange(m)} style={{
          background:mode===m?"#e8ff6b":"#111",
          border:`1px solid ${mode===m?"#e8ff6b":"#1e1e1e"}`,
          borderRadius:4,color:mode===m?"#060606":"#444",
          fontFamily:"'JetBrains Mono',monospace",fontSize:11,
          padding:"3px 8px",cursor:"pointer",lineHeight:1
        }}>{icon}</button>
      ))}
    </div>
  );
}

function Chart({ points, mode, color, unit="", height=120 }) {
  // points: [{x, y, label}] — nulls already filtered out by caller
  const valid = points.filter(p=>p&&p.y!=null);

  if (valid.length === 0) return (
    <div style={{height:40,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#222"}}>no data yet</span>
    </div>
  );

  const maxY = Math.max(...valid.map(p=>p.y));
  const minY = Math.min(...valid.map(p=>p.y));
  const rangeY = maxY - minY || 1;

  // ── BAR ──
  if (mode === "bar") {
    return (
      <div style={{width:"100%"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height}}>
          {points.map((p,i)=>{
            const empty = !p || p.y==null;
            const pct = empty ? 0 : p.y / maxY;
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%",gap:3}}>
                {!empty&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color,whiteSpace:"nowrap"}}>{p.y}{unit}</div>}
                <div style={{
                  width:"100%",borderRadius:"3px 3px 0 0",
                  height:empty?2:`${Math.max(3,pct*100)}%`,
                  background:empty?"#141414":color,opacity:empty?0.3:1,
                  transition:"height 0.4s ease"
                }}/>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:4,marginTop:5}}>
          {points.map((p,i)=>(
            <div key={i} style={{flex:1,textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#2a2a2a"}}>{p?.label||`W${i+1}`}</div>
          ))}
        </div>
      </div>
    );
  }

  // ── LINE & DOT — SVG ──
  const W=300, H=height, pad={top:14,right:24,bottom:20,left:28};
  const iW=W-pad.left-pad.right, iH=H-pad.top-pad.bottom;
  const toX=(i)=>pad.left+(i/(points.length-1||1))*iW;
  const toY=(v)=>pad.top+(1-(v-minY)/rangeY)*iH;

  const svgValid = valid.map(p=>({...p, sx:toX(points.indexOf(p)), sy:toY(p.y)}));
  const pathD = svgValid.map((p,i)=>`${i===0?"M":"L"}${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");

  // y-axis ticks
  const ticks = minY===maxY ? [minY] : [minY, maxY];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible",display:"block"}}>
      {ticks.map((t,i)=>(
        <g key={i}>
          <line x1={pad.left} y1={toY(t)} x2={W-pad.right} y2={toY(t)} stroke="#1a1a1a" strokeWidth={1}/>
          <text x={pad.left-4} y={toY(t)+4} fill="#333" fontSize={8} textAnchor="end" fontFamily="monospace">
            {Number.isInteger(t)?t:t.toFixed(1)}
          </text>
        </g>
      ))}
      {mode==="line"&&<path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>}
      {svgValid.map((p,i)=>(
        <g key={i}>
          <circle cx={p.sx} cy={p.sy} r={mode==="dot"?4:3} fill={color}/>
          {(i===svgValid.length-1||mode==="dot")&&(
            <text x={p.sx} y={p.sy-7} fill={color} fontSize={8} textAnchor="middle" fontFamily="monospace">{p.y}{unit}</text>
          )}
        </g>
      ))}
      {points.map((p,i)=>(
        <text key={i} x={toX(i)} y={H} fill="#2a2a2a" fontSize={8} textAnchor="middle" fontFamily="monospace">{p?.label||`W${i+1}`}</text>
      ))}
    </svg>
  );
}

function DashboardView({ data, currentWeek, onLogWeight }) {
  const [showWeightPad, setShowWeightPad] = useState(false);
  const [selectedEx, setSelectedEx]       = useState("Dumbbell Bench Press");
  const [liftMode, setLiftMode]           = useState("bar");
  const [runMode, setRunMode]             = useState("bar");
  const [bwMode, setBwMode]               = useState("line");

  const allEx = [...new Set(["A","B","C"].flatMap(d=>PROGRAM[d].exercises.map(e=>e.name)))];
  const bwEntries = data.bodyWeight || [];
  const latestBW  = bwEntries.length>0 ? bwEntries[bwEntries.length-1] : null;

  // Heatmap
  const weekStatus = Array.from({length:8},(_,i)=>({
    week:i+1,
    days:["A","B","C"].map(d=>getDayStatus(data,d,i+1))
  }));

  // Lift data — average across days per week for selected exercise
  const liftPoints = Array.from({length:8},(_,i)=>{
    const w=i+1;
    const vals=["A","B","C"].map(d=>{
      if(!PROGRAM[d].exercises.find(e=>e.name===selectedEx)) return null;
      return data[d]?.[w]?.exercises?.[selectedEx]??null;
    }).filter(v=>v!==null);
    if(vals.length===0) return null;
    return {x:i,y:+( vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1),label:`W${w}`};
  });

  // Per-day lift points
  const liftByDay = ["A","B","C"].map(day=>{
    if(!PROGRAM[day].exercises.find(e=>e.name===selectedEx)) return null;
    return {
      day,
      color:day==="A"?"#e8ff6b":day==="B"?"#6abf40":"#6bb8ff",
      points:Array.from({length:8},(_,i)=>{
        const v=data[day]?.[i+1]?.exercises?.[selectedEx]??null;
        return v!==null?{x:i,y:v,label:`W${i+1}`}:null;
      })
    };
  }).filter(Boolean);

  // Run data — total km per week
  const runPoints = Array.from({length:8},(_,i)=>{
    const w=i+1;
    const vals=["A","B","C"].map(d=>data[d]?.[w]?.runKm??null).filter(v=>v!==null);
    if(vals.length===0) return null;
    return {x:i,y:+vals.reduce((a,b)=>a+b,0).toFixed(2),label:`W${w}`};
  });

  // Run per day
  const runByDay=[{day:"A",label:"EASY",color:"#e8ff6b"},{day:"B",label:"INTERVALS",color:"#6abf40"},{day:"C",label:"LONG EASY",color:"#6bb8ff"}].map(({day,label,color})=>({
    day,label,color,
    points:Array.from({length:8},(_,i)=>{
      const v=data[day]?.[i+1]?.runKm??null;
      return v!==null?{x:i,y:v,label:`W${i+1}`}:null;
    })
  }));

  // BW points
  const bwPoints = bwEntries.map((e,i)=>({x:i,y:e.kg,label:e.date.slice(5)}));
  const bwDelta  = bwEntries.length>=2 ? +(bwEntries[bwEntries.length-1].kg-bwEntries[0].kg).toFixed(1) : null;
  const totalKm  = ["A","B","C"].flatMap(d=>Array.from({length:8},(_,i)=>data[d]?.[i+1]?.runKm??null)).filter(v=>v!==null).reduce((a,b)=>a+b,0).toFixed(1);

  const S = (label,val,sub,color="#e8ff6b") => (
    <div style={{background:"#090909",border:"1px solid #141414",borderRadius:8,padding:"12px 10px",textAlign:"center"}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#444",letterSpacing:2,marginBottom:5}}>{label}</div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color,lineHeight:1}}>{val}</div>
      {sub&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#444",marginTop:4}}>{sub}</div>}
    </div>
  );

  const Card = ({title,right,children}) => (
    <div style={{background:"#090909",border:"1px solid #141414",borderRadius:8,padding:16,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#444",letterSpacing:3}}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      {/* ── SUMMARY STATS ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
        {S("WEEK",`${currentWeek}/8`)}
        {S("KM RAN",`${totalKm}`,"total","#6bb8ff")}
        {S("WEIGHT",latestBW?`${latestBW.kg}`:"—","kg",latestBW?"#e8ff6b":"#333")}
      </div>

      {/* ── HEATMAP ── */}
      <Card title="8-WEEK HEATMAP">
        <div style={{display:"grid",gridTemplateColumns:"20px repeat(8,1fr)",gap:4,alignItems:"center"}}>
          <div/>
          {Array.from({length:8},(_,i)=>(
            <div key={i} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:i+1===currentWeek?"#e8ff6b":"#2a2a2a",textAlign:"center"}}>W{i+1}</div>
          ))}
          {["A","B","C"].map((day,di)=>(
            <>{/* fragment key workaround */}
              <div key={`l${di}`} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#333"}}>D{day}</div>
              {weekStatus.map(({week,days})=>{
                const status=days[di];
                const bg=status==="done"?"#6abf40":status==="partial"?"#e8a82a":"#141414";
                const isCur=week===currentWeek;
                return (
                  <div key={week} style={{height:20,borderRadius:3,background:bg,border:`1px solid ${isCur?"#e8ff6b44":status==="done"?"#3a6a2a":status==="partial"?"#5a4a1a":"#1e1e1e"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {status==="done"&&<span style={{fontSize:7,color:"#1a3a1a"}}>✓</span>}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        <div style={{display:"flex",gap:14,marginTop:12}}>
          {[["#6abf40","Complete"],["#e8a82a","Partial"],["#141414","Pending"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:2,background:c}}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#333"}}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── LIFTS ── */}
      <Card title="LIFT PROGRESSION" right={<ChartToggle mode={liftMode} onChange={setLiftMode}/>}>
        <select value={selectedEx} onChange={e=>setSelectedEx(e.target.value)} style={{width:"100%",background:"#0f0f0f",border:"1px solid #1e1e1e",color:"#e0e0e0",fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 10px",borderRadius:6,marginBottom:16,outline:"none"}}>
          {allEx.map(e=><option key={e} value={e}>{e}</option>)}
        </select>
        {/* Combined avg across days */}
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#333",letterSpacing:2,marginBottom:10}}>AVG ACROSS DAYS</div>
          <Chart points={liftPoints} mode={liftMode} color="#e8ff6b" unit="kg" height={110}/>
        </div>
        {/* Per day breakdown */}
        {liftByDay.map(({day,color,points})=>{
          const valid=points.filter(p=>p&&p.y!=null);
          if(valid.length===0) return null;
          const delta=valid.length>=2?+(valid[valid.length-1].y-valid[0].y).toFixed(1):null;
          return (
            <div key={day} style={{borderTop:"1px solid #111",paddingTop:12,marginTop:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#333",letterSpacing:2}}>DAY {day}</span>
                {delta!==null&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:delta>0?"#6abf40":delta<0?"#ff6b6b":"#444"}}>{delta>0?"+":""}{delta}kg</span>}
              </div>
              <Chart points={points} mode={liftMode} color={color} unit="kg" height={90}/>
            </div>
          );
        })}
      </Card>

      {/* ── RUNS ── */}
      <Card title="RUN DISTANCES" right={<ChartToggle mode={runMode} onChange={setRunMode}/>}>
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#333",letterSpacing:2,marginBottom:10}}>TOTAL KM PER WEEK</div>
          <Chart points={runPoints} mode={runMode} color="#6bb8ff" unit="km" height={110}/>
        </div>
        {runByDay.map(({day,label,color,points})=>{
          const valid=points.filter(p=>p&&p.y!=null);
          if(valid.length===0) return null;
          return (
            <div key={day} style={{borderTop:"1px solid #111",paddingTop:12,marginTop:12}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#333",letterSpacing:2,marginBottom:10}}>DAY {day} — {label}</div>
              <Chart points={points} mode={runMode} color={color} unit="km" height={90}/>
            </div>
          );
        })}
      </Card>

      {/* ── BODY WEIGHT ── */}
      <Card title="BODY WEIGHT" right={
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <ChartToggle mode={bwMode} onChange={setBwMode}/>
          <button onClick={()=>setShowWeightPad(true)} style={{background:"#e8ff6b",border:"none",borderRadius:5,color:"#060606",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,padding:"4px 10px",cursor:"pointer"}}>+ LOG</button>
        </div>
      }>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:16}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:40,fontWeight:700,color:latestBW?"#e8ff6b":"#222",lineHeight:1}}>{latestBW?latestBW.kg:"—"}</div>
          {latestBW&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,color:"#444"}}>kg</div>}
          {bwDelta!==null&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:bwDelta<0?"#6abf40":bwDelta>0?"#ff6b6b":"#444",marginLeft:4}}>{bwDelta>0?"+":""}{bwDelta} kg</div>}
        </div>
        <Chart
          points={bwPoints}
          mode={bwMode} color="#e8ff6b" unit="kg" height={120}
        />
        {bwEntries.length>0&&(
          <div style={{marginTop:14,maxHeight:120,overflowY:"auto"}}>
            {[...bwEntries].reverse().map((e,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #0f0f0f"}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#333"}}>{e.date}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#777"}}>{e.kg} kg</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── EXPORT ── */}
      <div style={{paddingTop:8,paddingBottom:8}}>
        <button onClick={()=>exportCSV(data)} style={{width:"100%",background:"#0f0f0f",border:"1px solid #1e1e1e",borderRadius:8,color:"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:2,padding:"14px 0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span style={{color:"#333"}}>↓</span> EXPORT DATA AS CSV
        </button>
      </div>

      {showWeightPad&&(
        <Numpad value={latestBW?.kg} label="BODY WEIGHT" unit="kg"
          onConfirm={kg=>{ if(kg!==null) onLogWeight(kg); setShowWeightPad(false); }}
          onClose={()=>setShowWeightPad(false)}
        />
      )}
    </div>
  );
}

// ─── DAY TABS WITH STATUS ─────────────────────────────────────────────────────

function getDayStatus(data, day, week) {
  const s = data[day]?.[week];
  if (!s) return "empty";
  const exArr = PROGRAM[day].exercises;
  const allLogged = exArr.every(ex=>s.exercises?.[ex.name]!==null&&s.exercises?.[ex.name]!==undefined);
  if (allLogged) return "done";
  const anyLogged = exArr.some(ex=>s.exercises?.[ex.name]!==null&&s.exercises?.[ex.name]!==undefined)||s.runKm!==null;
  if (anyLogged) return "partial";
  return "empty";
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData]           = useState(()=>freshData());
  const [loaded, setLoaded]       = useState(false);
  const [activeDay, setActiveDay] = useState("A");
  const [activeWeek, setActiveWeek] = useState(1);
  const [view, setView]           = useState("session");
  const [weekOpen, setWeekOpen]   = useState(false);

  // Load from IndexedDB on mount (with localStorage fallback)
  useEffect(() => {
    idbGet("wt_v4").then(saved => {
      if (saved) {
        setData(saved);
      } else {
        // Try localStorage migration
        try {
          const ls = localStorage.getItem("wt_v4");
          if (ls) { const parsed = JSON.parse(ls); setData(parsed); }
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  // Save on every data change (after initial load)
  useEffect(() => { if (loaded) saveData(data); }, [data, loaded]);

  const mutate = (fn) => setData(prev=>{ const next=JSON.parse(JSON.stringify(prev)); fn(next); return next; });

  const handleUpdateExercise = (day,week,exName,val) => mutate(d=>{
    if(!d[day]) d[day]={};
    if(!d[day][week]) d[day][week]={exercises:{},runKm:null,done:false};
    if(!d[day][week].exercises) d[day][week].exercises={};
    d[day][week].exercises[exName]=val;
  });

  const handleUpdateRun = (day,week,km) => mutate(d=>{
    if(!d[day]) d[day]={};
    if(!d[day][week]) d[day][week]={exercises:{},runKm:null,done:false};
    d[day][week].runKm=km;
  });


  const handleLogWeight = (kg) => mutate(d=>{
    if(!d.bodyWeight) d.bodyWeight=[];
    // Update today's entry if exists, else push
    const t=today();
    const idx=d.bodyWeight.findIndex(e=>e.date===t);
    if(idx>=0) d.bodyWeight[idx].kg=kg;
    else d.bodyWeight.push({date:t,kg});
  });

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:"#060606",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#e8ff6b",letterSpacing:4}}>LOADING...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#060606",color:"#e0e0e0",fontFamily:"'JetBrains Mono',monospace",paddingBottom:80}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      {/* Top bar */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"#060606",borderBottom:"1px solid #111",paddingTop:"max(12px, env(safe-area-inset-top))",paddingBottom:"12px",paddingLeft:"16px",paddingRight:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:11,color:"#e8ff6b",letterSpacing:3}}>TRAINING.SYS</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {/* Week picker */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setWeekOpen(o=>!o)} style={{background:"#0f0f0f",border:"1px solid #1a1a1a",borderRadius:6,color:"#e0e0e0",fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"5px 10px",cursor:"pointer"}}>W{activeWeek} ▾</button>
            {weekOpen&&(
              <div style={{position:"absolute",right:0,top:"110%",background:"#0f0f0f",border:"1px solid #1a1a1a",borderRadius:8,overflow:"hidden",zIndex:200}}>
                {Array.from({length:8},(_,i)=>i+1).map(w=>(
                  <div key={w} onClick={()=>{setActiveWeek(w);setWeekOpen(false);}} style={{padding:"8px 20px",cursor:"pointer",background:w===activeWeek?"#1a2e0a":"transparent",color:w===activeWeek?"#e8ff6b":"#666",fontSize:12}}>Week {w}</div>
                ))}
              </div>
            )}
          </div>

          {/* Day tabs with status dots */}
          {["A","B","C"].map(d=>{
            const status = getDayStatus(data,d,activeWeek);
            const isActive = activeDay===d;
            const dotColor = status==="done"?"#6abf40":status==="partial"?"#e8a82a":"#2a2a2a";
            return (
              <button key={d} onClick={()=>setActiveDay(d)} style={{
                background: isActive?"#e8ff6b":"#0f0f0f",
                border:`1px solid ${isActive?"#e8ff6b":"#1a1a1a"}`,
                borderRadius:6, color:isActive?"#060606":"#555",
                fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                padding:"5px 10px", cursor:"pointer", fontWeight:isActive?700:400,
                position:"relative"
              }}>
                {d}
                {/* status dot */}
                <span style={{
                  position:"absolute",top:3,right:3,
                  width:4,height:4,borderRadius:"50%",
                  background: isActive?"#060606":dotColor,
                  display:"block"
                }}/>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{padding:"20px 16px",maxWidth:480,margin:"0 auto"}}>
        {view==="session"
          ?<SessionView
              day={activeDay} week={activeWeek} data={data}
              onUpdateExercise={handleUpdateExercise}
              onUpdateRun={handleUpdateRun}
            />
          :<DashboardView
              data={data} currentWeek={activeWeek}
              onLogWeight={handleLogWeight}
            />
        }
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#060606",borderTop:"1px solid #111",display:"flex",justifyContent:"center",gap:2,paddingTop:"10px",paddingLeft:"16px",paddingRight:"16px",paddingBottom:"max(28px, calc(env(safe-area-inset-bottom) + 10px))"}}>
        {[["session","SESSION"],["dashboard","PROGRESS"]].map(([v,label])=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,maxWidth:180,background:view===v?"#0f0f0f":"transparent",border:`1px solid ${view===v?"#1a1a1a":"transparent"}`,borderRadius:8,color:view===v?"#e8ff6b":"#333",fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:2,padding:"10px 0",cursor:"pointer"}}>{label}</button>
        ))}
      </div>
    </div>
  );
}
