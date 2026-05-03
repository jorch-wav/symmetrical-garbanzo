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
  const d = { bodyWeight: [], extraDays: [] }; // extraDays: [{id, date, week, note, cardio:[{name,min}]}]
  for (const day of ["A","B","C"]) {
    d[day] = {};
    for (let w = 1; w <= 8; w++) {
      d[day][w] = {
        exercises: {},   // { exName: kg|null }
        warmup: [],      // [{id, name, min}]
        runKm: null,
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

// ─── WARMUP NAME INPUT ───────────────────────────────────────────────────────

// ─── SWIPE TO DELETE ─────────────────────────────────────────────────────────

function SwipeToDelete({ children, onDelete }) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(null);
  const THRESHOLD = 80;

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; setSwiping(true); };
  const onTouchMove  = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffsetX(Math.max(-120, dx));
  };
  const onTouchEnd = () => {
    if (offsetX < -THRESHOLD) { onDelete(); }
    else { setOffsetX(0); }
    setSwiping(false);
    startX.current = null;
  };

  return (
    <div style={{ position:"relative", overflow:"hidden", marginBottom:6, borderRadius:8 }}>
      {/* Delete background */}
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:80, background:"#7a1a1a", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"0 8px 8px 0" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#ff6b6b", letterSpacing:1 }}>DELETE</span>
      </div>
      {/* Content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform:`translateX(${offsetX}px)`, transition: swiping ? "none" : "transform 0.25s ease", position:"relative", zIndex:1 }}
      >
        {children}
      </div>
    </div>
  );
}

function WarmupModal({ onConfirm, onClose }) {
  const [name, setName] = useState("");
  const [mins, setMins] = useState("");
  const suggestions = ["Rowing machine","Skip rope","Cycling","Assault bike","Stair climber","Elliptical","Swimming","Foam rolling"];
  const save = () => {
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), min: parseFloat(mins)||null });
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",zIndex:300,backdropFilter:"blur(6px)"}} onClick={onClose}>
      <div style={{width:"100%",maxWidth:400,background:"#0d0d0d",borderTop:"1px solid #2a2a2a",padding:"16px 16px 36px",borderRadius:"16px 16px 0 0"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#555",letterSpacing:3,textAlign:"center",marginBottom:14}}>ADD CARDIO</div>
        {/* Name + duration on one row */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input
            autoFocus
            value={name}
            onChange={e=>setName(e.target.value)}
            placeholder="exercise"
            style={{flex:1,background:"#141414",border:"1px solid #2a2a2a",borderRadius:8,color:"#e8ff6b",fontFamily:"'JetBrains Mono',monospace",fontSize:16,padding:"11px 12px",outline:"none"}}
          />
          <div style={{display:"flex",alignItems:"center",gap:4,background:"#141414",border:"1px solid #2a2a2a",borderRadius:8,padding:"0 12px"}}>
            <input
              value={mins}
              onChange={e=>setMins(e.target.value.replace(/[^0-9]/g,""))}
              placeholder="min"
              inputMode="numeric"
              style={{width:42,background:"none",border:"none",color:"#6bb8ff",fontFamily:"'JetBrains Mono',monospace",fontSize:16,outline:"none",textAlign:"center"}}
            />
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#444"}}>m</span>
          </div>
        </div>
        {/* Quick picks */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {suggestions.map(s=>(
            <button key={s} onClick={()=>setName(s)} style={{background:name===s?"#e8ff6b":"#141414",border:`1px solid ${name===s?"#e8ff6b":"#222"}`,borderRadius:20,color:name===s?"#0d0d0d":"#666",fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 10px",cursor:"pointer"}}>{s}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={onClose} style={{background:"#141414",border:"1px solid #2a2a2a",borderRadius:8,color:"#555",fontFamily:"'JetBrains Mono',monospace",fontSize:14,padding:"14px 0",cursor:"pointer"}}>CANCEL</button>
          <button onClick={save} style={{background:name?"#e8ff6b":"#1e1e1e",border:"none",borderRadius:8,color:name?"#0d0d0d":"#333",fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,padding:"14px 0",cursor:"pointer"}}>ADD</button>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION VIEW ─────────────────────────────────────────────────────────────

function SessionView({ day, week, data, onUpdateExercise, onUpdateRun, onAddWarmup, onEditWarmup, onRemoveWarmup }) {
  const [numpad, setNumpad]         = useState(null); // {exName} | {type:"km"}
  const [showWarmupModal, setShowWarmupModal] = useState(false); 
  const [showTimer, setShowTimer] = useState(false);

  const prog     = PROGRAM[day];
  const session  = data[day]?.[week] || { exercises:{}, warmup:[], runKm:null, done:false };
  const exData   = session.exercises || {};
  const warmup   = session.warmup || [];
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

      {/* Warmup cardio */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#333",letterSpacing:3}}>PRE-STRENGTH CARDIO</div>
          <button onClick={()=>setShowWarmupModal(true)} style={{background:"none",border:"1px solid #1e1e1e",borderRadius:5,color:"#555",fontFamily:"'JetBrains Mono',monospace",fontSize:13,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
        </div>
        {warmup.length===0&&(
          <div onClick={()=>setShowWarmupModal(true)} style={{padding:"10px 14px",background:"#090909",border:"1px dashed #1a1a1a",borderRadius:8,cursor:"pointer",textAlign:"center"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#2a2a2a"}}>+ add cardio warmup</span>
          </div>
        )}
        {warmup.map((item,idx)=>(
          <SwipeToDelete key={item.id} onDelete={()=>onRemoveWarmup(day,week,idx)}>
            <div style={{background:"#0f0f0f",border:"1px solid #1e1e1e",borderRadius:8,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:item.name?"#ccc":"#444"}}>{item.name||"exercise"}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:700,color:item.min?"#6bb8ff":"#2a2a2a"}}>{item.min?`${item.min}m`:"—"}</span>
            </div>
          </SwipeToDelete>
        ))}
        {warmup.length>0&&(
          <button onClick={()=>setShowWarmupModal(true)} style={{width:"100%",background:"none",border:"1px dashed #1a1a1a",borderRadius:8,color:"#2a2a2a",fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"7px 0",cursor:"pointer",marginTop:6}}>+ another</button>
        )}
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
      {showWarmupModal && (
        <WarmupModal
          onConfirm={({name,min})=>{ onAddWarmup(day,week,{name,min}); setShowWarmupModal(false); }}
          onClose={()=>setShowWarmupModal(false)}
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

function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `training_sys_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      // Basic sanity check
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid file");
      onSuccess(parsed);
    } catch {
      onError("Could not read file. Make sure it's a TRAINING.SYS backup.");
    }
  };
  reader.readAsText(file);
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────

// ─── PROGRESS TABLE ──────────────────────────────────────────────────────────

// ─── RADAR CHART ─────────────────────────────────────────────────────────────

function RadarChart({ weeklyData, exercises, currentWeek }) {
  const [tooltip, setTooltip] = useState(null);
  const W = 300, H = 300, cx = 150, cy = 158, maxR = 90;
  const n = exercises.length;

  const WEEK_COLORS = ["#6bb8ff","#a78bfa","#34d399","#fb923c","#f472b6","#60a5fa","#facc15","#e8ff6b"];

  const maxPerEx = {};
  exercises.forEach(ex => {
    const vals = weeklyData.map(w => w.values[ex.name]).filter(v => v != null && v > 0);
    maxPerEx[ex.name] = vals.length ? Math.max(...vals) : 1;
  });

  const angle = (i) => (Math.PI * 2 * i / n) - Math.PI / 2;
  const point = (i, r) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });

  const weekPts = (values) => exercises.map((ex, i) => {
    const v = values[ex.name];
    const r = (v != null && v > 0) ? Math.max(14, (v / maxPerEx[ex.name]) * maxR) : 14;
    return point(i, r);
  });

  const toPath = (pts) => pts.map((p,i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";

  const filledWeeks = weeklyData.filter(w => Object.values(w.values).some(v => v != null));
  const latestWeek = filledWeeks[filledWeeks.length - 1];

  return (
    <div style={{ position:"relative", WebkitUserSelect:"none", userSelect:"none", WebkitTouchCallout:"none" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ display:"block", touchAction:"none", WebkitUserSelect:"none", userSelect:"none" }}
        onPointerLeave={() => setTooltip(null)}
      >
        {[0.33, 0.66, 1.0].map((r, i) => (
          <polygon key={i}
            points={exercises.map((_,j) => { const p = point(j, r*maxR); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ")}
            fill="none" stroke="#1e1e1e" strokeWidth={1}
          />
        ))}
        {exercises.map((ex, i) => {
          const lp = point(i, maxR + 24);
          const ap = point(i, maxR);
          const ang = angle(i);
          const anchor = Math.abs(Math.cos(ang)) < 0.25 ? "middle" : Math.cos(ang) > 0 ? "start" : "end";
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={ap.x.toFixed(1)} y2={ap.y.toFixed(1)} stroke="#222" strokeWidth={1}/>
              <text x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} fill="#666" fontSize={9}
                textAnchor={anchor} dominantBaseline="middle" fontFamily="monospace"
                style={{ pointerEvents:"none" }}>
                {ex.label}
              </text>
            </g>
          );
        })}
        {filledWeeks.map((wd, wi) => {
          const isLatest = wi === filledWeeks.length - 1;
          const color = WEEK_COLORS[(wd.week - 1) % WEEK_COLORS.length];
          const opacity = isLatest ? 0.9 : Math.max(0.1, 0.5 - (filledWeeks.length - 1 - wi) * 0.12);
          const pts = weekPts(wd.values);
          return (
            <path key={wd.week} d={toPath(pts)}
              fill={color} fillOpacity={opacity * 0.18}
              stroke={color} strokeOpacity={opacity}
              strokeWidth={isLatest ? 2.5 : 1.5}
              style={{ pointerEvents:"none" }}
            />
          );
        })}
        {latestWeek && (() => {
          const pts = weekPts(latestWeek.values);
          return exercises.map((ex, i) => (
            <circle key={i} cx={pts[i].x.toFixed(1)} cy={pts[i].y.toFixed(1)} r={14}
              fill="transparent"
              onPointerDown={(e) => { e.preventDefault(); setTooltip({ x:pts[i].x, y:pts[i].y, week:latestWeek.week, ex:ex.name, val:latestWeek.values[ex.name] }); }}
              style={{ cursor:"pointer", touchAction:"none" }}
            />
          ));
        })()}
        {tooltip && (() => {
          const tx = tooltip.x > cx ? Math.min(W-86, tooltip.x-4) : Math.max(4, tooltip.x-82);
          const ty = Math.min(H-36, Math.max(4, tooltip.y-18));
          const display = tooltip.val===0?"BW":tooltip.val!=null?`${tooltip.val}kg`:"—";
          const exShort = tooltip.ex.replace("Dumbbell ","DB ").replace("Seated ","").replace("Rope ","").replace("Hanging ","").slice(0,16);
          return (
            <g style={{ pointerEvents:"none" }}>
              <rect x={tx} y={ty} width={84} height={30} rx={6} fill="#0d0d0d" stroke="#e8ff6b" strokeWidth={1.2}/>
              <text x={tx+6} y={ty+10} fill="#777" fontSize={7.5} fontFamily="monospace" dominantBaseline="hanging">{exShort}</text>
              <text x={tx+6} y={ty+20} fill="#e8ff6b" fontSize={9} fontFamily="monospace" dominantBaseline="hanging" fontWeight="bold">W{tooltip.week} · {display}</text>
            </g>
          );
        })()}
      </svg>
      <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginTop:6 }}>
        {filledWeeks.map((w, i) => {
          const color = WEEK_COLORS[(w.week-1) % WEEK_COLORS.length];
          const isLatest = i === filledWeeks.length - 1;
          return (
            <div key={w.week} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:16, height:2.5, background:color, borderRadius:2, opacity:isLatest?1:0.5 }}/>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:isLatest?color:"#444" }}>W{w.week}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CARDIO LINE CHART ────────────────────────────────────────────────────────

function CardioLine({ sessions }) {
  // sessions: [{date, label, totalMin, breakdown:[{name,min}]}]
  const [tooltip, setTooltip] = useState(null);
  if (sessions.length === 0) return (
    <div style={{ padding: '24px 0', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#222' }}>
      no cardio logged yet
    </div>
  );

  const W = 300, H = 140;
  const pad = { top: 16, right: 16, bottom: 24, left: 28 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const maxMin = Math.max(...sessions.map(s => s.totalMin), 1);
  const toX = (i) => pad.left + (i / Math.max(sessions.length - 1, 1)) * iW;
  const toY = (v) => pad.top + (1 - v / maxMin) * iH;

  // Smooth curve using bezier
  const pts = sessions.map((s, i) => ({ x: toX(i), y: toY(s.totalMin) }));
  let pathD = '';
  if (pts.length === 1) {
    pathD = `M${pts[0].x},${pts[0].y}`;
  } else {
    pathD = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i-1], curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      pathD += ` C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
    }
  }

  // Area fill
  const areaD = pathD + ` L${pts[pts.length-1].x.toFixed(1)},${(pad.top+iH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.top+iH).toFixed(1)} Z`;

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', touchAction: 'none' }}
        onPointerLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="cardioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6bb8ff" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#6bb8ff" stopOpacity="0.02"/>
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.5, 1.0].map((r, i) => (
          <g key={i}>
            <line x1={pad.left} y1={toY(maxMin*r)} x2={W-pad.right} y2={toY(maxMin*r)}
              stroke="#161616" strokeWidth={1}/>
            <text x={pad.left-4} y={toY(maxMin*r)+3} fill="#2a2a2a" fontSize={7}
              textAnchor="end" fontFamily="monospace">{Math.round(maxMin*r)}m</text>
          </g>
        ))}

        {/* Area */}
        <path d={areaD} fill="url(#cardioGrad)"/>
        {/* Line */}
        <path d={pathD} fill="none" stroke="#6bb8ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>

        {/* Dots + tap targets */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3.5}
              fill="#6bb8ff" stroke="#060606" strokeWidth={1.5}/>
            <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={14}
              fill="transparent"
              onPointerDown={() => setTooltip({ idx: i, x: p.x, y: p.y, session: sessions[i] })}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}

        {/* X labels — show first, last, and every other */}
        {sessions.map((s, i) => {
          if (sessions.length > 6 && i % 2 !== 0 && i !== sessions.length-1) return null;
          return (
            <text key={i} x={pts[i].x.toFixed(1)} y={H-2}
              fill="#2a2a2a" fontSize={7} textAnchor="middle" fontFamily="monospace">
              {s.label}
            </text>
          );
        })}
      </svg>

      {/* Tooltip panel */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x / 300 * 100 + '%',
          top: 0,
          transform: tooltip.x > 200 ? 'translateX(-110%)' : 'translateX(8px)',
          background: '#0d0d0d',
          border: '1px solid #6bb8ff',
          borderRadius: 8,
          padding: '8px 10px',
          minWidth: 110,
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#6bb8ff', marginBottom: 6 }}>
            {tooltip.session.date} · {tooltip.session.totalMin}m total
          </div>
          {tooltip.session.breakdown.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 3 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#666' }}>{b.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#e0e0e0' }}>{b.min}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────

function DashboardView({ data, currentWeek, onLogWeight, onImport }) {
  const [showWeightPad, setShowWeightPad] = useState(false);
  const [activeDay, setActiveDay]         = useState("A");

  const bwEntries = data.bodyWeight || [];
  const latestBW  = bwEntries.length > 0 ? bwEntries[bwEntries.length - 1] : null;
  const bwDelta   = bwEntries.length >= 2
    ? +(bwEntries[bwEntries.length-1].kg - bwEntries[0].kg).toFixed(1) : null;

  // ── Heatmap ──
  const weekStatus = Array.from({ length: 8 }, (_, i) => ({
    week: i + 1,
    days: ["A","B","C"].map(d => getDayStatus(data, d, i + 1))
  }));

  // ── Radar data ──
  // For selected day, build weeklyData
  const radarExercises = PROGRAM[activeDay].exercises.map(ex => ({
    name: ex.name,
    label: ex.name
      .replace('Dumbbell ','DB ')
      .replace('Seated DB ','')
      .replace(' Press','P')
      .replace('Pulldown','Pull')
      .replace('Triceps ','Tri ')
      .replace('Pushdown','Push')
      .replace('Hanging ','')
      .replace(' Raises','R')
      .replace('Cable ','')
      .replace('Bicep Curl','Curl')
      .replace('Shoulder','Sh.')
      .slice(0, 10)
  }));

  const radarWeeklyData = Array.from({ length: 8 }, (_, i) => {
    const w = i + 1;
    const values = {};
    PROGRAM[activeDay].exercises.forEach(ex => {
      values[ex.name] = data[activeDay]?.[w]?.exercises?.[ex.name] ?? null;
    });
    return { week: w, values };
  }).filter(wd => Object.values(wd.values).some(v => v != null));

  // ── Cardio line sessions ──
  const cardioSessions = [];
  for (const day of ["A","B","C"]) {
    for (let w = 1; w <= 8; w++) {
      const warmup = data[day]?.[w]?.warmup || [];
      const items = warmup.filter(item => item.name && item.min > 0);
      if (items.length === 0) continue;
      const totalMin = items.reduce((a, b) => a + (parseFloat(b.min)||0), 0);
      cardioSessions.push({
        date: `W${w}${day}`,
        label: `${day}${w}`,
        totalMin,
        breakdown: items.map(it => ({ name: it.name, min: parseFloat(it.min)||0 })),
        sortKey: w * 10 + ["A","B","C"].indexOf(day)
      });
    }
  }
  // Also include extra days cardio
  for (const ex of (data.extraDays || [])) {
    const items = (ex.cardio || []).filter(c => c.name && c.min);
    if (items.length === 0) continue;
    const totalMin = items.reduce((a,b) => a + (parseFloat(b.min)||0), 0);
    cardioSessions.push({
      date: ex.date,
      label: `+${ex.week}`,
      totalMin,
      breakdown: items.map(it => ({ name: it.name, min: parseFloat(it.min)||0 })),
      sortKey: ex.week * 10 + 5
    });
  }
  cardioSessions.sort((a, b) => a.sortKey - b.sortKey);

  const totalKm = ["A","B","C"].flatMap(d =>
    Array.from({length:8},(_,i) => data[d]?.[i+1]?.runKm ?? null)
  ).filter(v => v !== null).reduce((a,b) => a+b, 0).toFixed(1);

  const Card = ({ title, right, children }) => (
    <div style={{ background: "#090909", border: "1px solid #141414", borderRadius: 8, padding: 16, marginBottom: 16 }}>
      {(title || right) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#444", letterSpacing: 3 }}>{title}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div>

      {/* ── SUMMARY STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          ["WEEK", `${currentWeek}/8`, "#e8ff6b"],
          ["KM RAN", totalKm, "#6bb8ff"],
          ["WEIGHT", latestBW ? `${latestBW.kg}` : "—", latestBW ? "#e8ff6b" : "#333"],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: "#090909", border: "1px solid #141414", borderRadius: 8, padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 5 }}>{label}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* ── HEATMAP ── */}
      <Card title="8-WEEK HEATMAP">
        <div style={{ display: "grid", gridTemplateColumns: "20px repeat(8,1fr)", gap: 4, alignItems: "center" }}>
          <div/>
          {Array.from({length:8},(_,i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: i+1===currentWeek?"#e8ff6b":"#2a2a2a", textAlign: "center" }}>W{i+1}</div>
          ))}
          {["A","B","C"].map((day, di) => (
            <>
              <div key={`l${di}`} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#333" }}>D{day}</div>
              {weekStatus.map(({ week, days }) => {
                const status = days[di];
                const bg = status==="done" ? "#6abf40" : status==="partial" ? "#e8a82a" : "#141414";
                const isCur = week === currentWeek;
                return (
                  <div key={week} style={{ height: 20, borderRadius: 3, background: bg, border: `1px solid ${isCur?"#e8ff6b44":status==="done"?"#3a6a2a":status==="partial"?"#5a4a1a":"#1e1e1e"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {status==="done" && <span style={{ fontSize: 7, color: "#1a3a1a" }}>✓</span>}
                  </div>
                );
              })}
            </>
          ))}
          {(data.extraDays||[]).length > 0 && <>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#555" }}>+</div>
            {Array.from({length:8},(_,i) => {
              const extras = (data.extraDays||[]).filter(e => e.week === i+1);
              return (
                <div key={i} style={{ height: 20, borderRadius: 3, background: extras.length>0?"#5a3a8a":"#141414", border: `1px solid ${i+1===currentWeek?"#e8ff6b44":extras.length>0?"#7a4aaa":"#1e1e1e"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {extras.length>0 && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"#c8a0ff" }}>{extras.length}</span>}
                </div>
              );
            })}
          </>}
        </div>
        <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
          {[["#6abf40","Complete"],["#e8a82a","Partial"],["#141414","Pending"],...((data.extraDays||[]).length>0?[["#5a3a8a","Extra"]]:[])]
            .map(([c,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:7, height:7, borderRadius:2, background:c }}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#333" }}>{l}</span>
              </div>
            ))}
        </div>
      </Card>

      {/* ── STRENGTH RADAR ── */}
      <Card title="STRENGTH" right={
        <div style={{ display:"flex", gap:4 }}>
          {["A","B","C"].map(d => (
            <button key={d} onClick={()=>setActiveDay(d)} style={{
              background: activeDay===d ? "#e8ff6b" : "#111",
              border: `1px solid ${activeDay===d ? "#e8ff6b" : "#1e1e1e"}`,
              borderRadius: 5, color: activeDay===d ? "#060606" : "#555",
              fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              padding:"3px 10px", cursor:"pointer", fontWeight: activeDay===d?700:400
            }}>{d}</button>
          ))}
        </div>
      }>
        {radarWeeklyData.length === 0
          ? <div style={{ textAlign:"center", padding:"32px 0", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#222" }}>log a session to see your shape</div>
          : <RadarChart weeklyData={radarWeeklyData} exercises={radarExercises} currentWeek={currentWeek}/>
        }
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#333", textAlign:"center", marginTop:8 }}>hold any point to inspect · each ring = one week</div>
      </Card>

      {/* ── CARDIO LINE ── */}
      {cardioSessions.length > 0 && (
        <Card title="CARDIO WARMUP">
          <CardioLine sessions={cardioSessions}/>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"#333", marginTop:8 }}>tap any point for breakdown</div>
        </Card>
      )}

      {/* ── BODY WEIGHT ── */}
      <Card title="BODY WEIGHT" right={
        <button onClick={()=>setShowWeightPad(true)} style={{ background:"#e8ff6b", border:"none", borderRadius:5, color:"#060606", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, padding:"4px 10px", cursor:"pointer" }}>+ LOG</button>
      }>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:14 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:38, fontWeight:700, color:latestBW?"#e8ff6b":"#222", lineHeight:1 }}>{latestBW?latestBW.kg:"—"}</div>
          {latestBW && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, color:"#444" }}>kg</div>}
          {bwDelta!==null && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:bwDelta<0?"#6abf40":bwDelta>0?"#ff6b6b":"#444", marginLeft:4 }}>{bwDelta>0?"+":""}{bwDelta} kg</div>}
        </div>
        {bwEntries.length > 0 && (
          <div style={{ maxHeight:120, overflowY:"auto" }}>
            {[...bwEntries].reverse().map((e,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #0f0f0f" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#333" }}>{e.date}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#777" }}>{e.kg} kg</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── BACKUP & RESTORE ── */}
      <div style={{ paddingTop:8, paddingBottom:8 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#333", letterSpacing:3, marginBottom:10 }}>BACKUP & RESTORE</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
          <button onClick={()=>exportJSON(data)} style={{ background:"#0f0f0f", border:"1px solid #1e1e1e", borderRadius:8, color:"#888", fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:1, padding:"14px 0", cursor:"pointer" }}>↓ BACKUP JSON</button>
          <label style={{ background:"#0f0f0f", border:"1px solid #1e1e1e", borderRadius:8, color:"#888", fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:1, padding:"14px 0", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            ↑ RESTORE JSON
            <input type="file" accept=".json" style={{ display:"none" }} onChange={e=>{
              const file=e.target.files?.[0]; if(!file) return;
              importJSON(file, parsed=>{ if(window.confirm("Replace all data with this backup?")){ onImport(parsed); } }, err=>alert(err));
              e.target.value="";
            }}/>
          </label>
        </div>
        <button onClick={()=>exportCSV(data)} style={{ width:"100%", background:"#0f0f0f", border:"1px solid #1e1e1e", borderRadius:8, color:"#444", fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:2, padding:"12px 0", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <span style={{ color:"#333" }}>↓</span> EXPORT CSV
        </button>
      </div>

      {showWeightPad && (
        <Numpad value={latestBW?.kg} label="BODY WEIGHT" unit="kg"
          onConfirm={kg=>{ if(kg!==null) onLogWeight(kg); setShowWeightPad(false); }}
          onClose={()=>setShowWeightPad(false)}
        />
      )}
    </div>
  );
}

// ─── EXTRA DAY ───────────────────────────────────────────────────────────────

function ExtraDayModal({ week, onSave, onClose }) {
  const [note, setNote]     = useState("");
  const [cardio, setCardio] = useState([{id:Date.now(),name:"",min:""}]);
  const suggestions = ["Rowing machine","Skip rope","Cycling","Assault bike","Stair climber","Elliptical","Yoga / Mobility","Skateboarding","Swimming","Foam rolling"];

  const addItem = () => setCardio(c=>[...c,{id:Date.now()+c.length,name:"",min:""}]);
  const removeItem = (id) => setCardio(c=>c.filter(i=>i.id!==id));
  const updateItem = (id,field,val) => setCardio(c=>c.map(i=>i.id===id?{...i,[field]:val}:i));

  const save = () => {
    const items = cardio.filter(i=>i.name||i.min);
    onSave({ id:Date.now(), date:today(), week, note, cardio:items });
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",zIndex:300,backdropFilter:"blur(6px)"}} onClick={onClose}>
      <div style={{width:"100%",maxWidth:480,background:"#0d0d0d",borderTop:"1px solid #2a2a2a",padding:"20px 16px 40px",borderRadius:"16px 16px 0 0",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#555",letterSpacing:3,textAlign:"center",marginBottom:16}}>EXTRA DAY — WEEK {week}</div>

        {/* Cardio items */}
        <div style={{marginBottom:16}}>
          {cardio.map((item,idx)=>(
            <div key={item.id} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
              <div style={{flex:1,background:"#111",border:"1px solid #1e1e1e",borderRadius:8,padding:"10px 12px"}}>
                <input
                  value={item.name}
                  onChange={e=>updateItem(item.id,"name",e.target.value)}
                  placeholder="exercise name"
                  style={{width:"100%",background:"none",border:"none",color:"#e0e0e0",fontFamily:"'JetBrains Mono',monospace",fontSize:13,outline:"none",marginBottom:4}}
                />
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input
                    value={item.min}
                    onChange={e=>updateItem(item.id,"min",e.target.value.replace(/[^0-9]/g,""))}
                    placeholder="min"
                    inputMode="numeric"
                    style={{width:60,background:"none",border:"none",borderBottom:"1px solid #2a2a2a",color:"#6bb8ff",fontFamily:"'JetBrains Mono',monospace",fontSize:13,outline:"none",padding:"2px 0"}}
                  />
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#333"}}>minutes</span>
                </div>
              </div>
              {cardio.length>1&&<button onClick={()=>removeItem(item.id)} style={{background:"none",border:"none",color:"#333",fontSize:18,cursor:"pointer"}}>×</button>}
            </div>
          ))}
          <button onClick={addItem} style={{width:"100%",background:"none",border:"1px dashed #1a1a1a",borderRadius:8,color:"#2a2a2a",fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 0",cursor:"pointer"}}>+ add another</button>
        </div>

        {/* Suggestions */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {suggestions.map(s=>(
            <button key={s} onClick={()=>{
              const empty=cardio.find(i=>!i.name);
              if(empty) updateItem(empty.id,"name",s);
              else setCardio(c=>[...c,{id:Date.now(),name:s,min:""}]);
            }} style={{background:"#111",border:"1px solid #1e1e1e",borderRadius:20,color:"#555",fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 10px",cursor:"pointer"}}>{s}</button>
          ))}
        </div>

        {/* Note */}
        <input
          value={note}
          onChange={e=>setNote(e.target.value)}
          placeholder="notes (optional)"
          style={{width:"100%",background:"#111",border:"1px solid #1e1e1e",borderRadius:8,color:"#888",fontFamily:"'JetBrains Mono',monospace",fontSize:12,padding:"10px 12px",outline:"none",boxSizing:"border-box",marginBottom:14}}
        />

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button onClick={onClose} style={{background:"#141414",border:"1px solid #2a2a2a",borderRadius:8,color:"#555",fontFamily:"'JetBrains Mono',monospace",fontSize:14,padding:"14px 0",cursor:"pointer"}}>CANCEL</button>
          <button onClick={save} style={{background:"#e8ff6b",border:"none",borderRadius:8,color:"#0d0d0d",fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,padding:"14px 0",cursor:"pointer"}}>SAVE DAY</button>
        </div>
      </div>
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
  const [showExtraDay, setShowExtraDay] = useState(false);

  // Load from IndexedDB on mount (with localStorage fallback)
  useEffect(() => {
    Promise.all([idbGet("wt_v4"), idbGet("wt_session")]).then(([saved, session]) => {
      if (saved) {
        setData(saved);
      } else {
        try {
          const ls = localStorage.getItem("wt_v4");
          if (ls) { const parsed = JSON.parse(ls); setData(parsed); }
        } catch {}
      }
      // Restore last active day/week
      if (session?.day) setActiveDay(session.day);
      if (session?.week) setActiveWeek(session.week);
      setLoaded(true);
    });
  }, []);

  // Save data on every change (after initial load)
  useEffect(() => { if (loaded) saveData(data); }, [data, loaded]);

  // Persist last active session whenever it changes
  useEffect(() => {
    if (loaded) idbSet("wt_session", { day: activeDay, week: activeWeek });
  }, [activeDay, activeWeek, loaded]);

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
    const t=today();
    const idx=d.bodyWeight.findIndex(e=>e.date===t);
    if(idx>=0) d.bodyWeight[idx].kg=kg;
    else d.bodyWeight.push({date:t,kg});
  });

  const handleImport = (parsed) => {
    setData(parsed);
    saveData(parsed);
  };

  const handleAddWarmup = (day,week,item) => mutate(d=>{
    if(!d[day][week].warmup) d[day][week].warmup=[];
    d[day][week].warmup.push({id:Date.now(), name:item?.name||"", min:item?.min||null});
  });

  const handleEditWarmup = (day,week,idx,field,val) => mutate(d=>{
    if(!d[day][week].warmup) return;
    d[day][week].warmup[idx][field]=val;
  });

  const handleRemoveWarmup = (day,week,idx) => mutate(d=>{
    if(!d[day][week].warmup) return;
    d[day][week].warmup.splice(idx,1);
  });

  const handleSaveExtraDay = (entry) => mutate(d=>{
    if(!d.extraDays) d.extraDays=[];
    d.extraDays.push(entry);
    setShowExtraDay(false);
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
              onAddWarmup={handleAddWarmup}
              onEditWarmup={handleEditWarmup}
              onRemoveWarmup={handleRemoveWarmup}
            />
          :<DashboardView
              data={data} currentWeek={activeWeek}
              onLogWeight={handleLogWeight}
              onImport={handleImport}
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
