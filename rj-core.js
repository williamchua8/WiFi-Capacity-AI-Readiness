/*! Ruijie Wi-Fi Capacity & AI Readiness Benchmark, model core
 *  (c) 2026 Ruijie Networks. All rights reserved.
 *  Unauthorised reproduction, redistribution or derivative use is prohibited.
 *  Build: RJ-CORE-2.0
 *
 *  Everything is scoped inside one function and published through a single
 *  namespace object. Obfuscators are free to rename anything internal, because
 *  the only names that must survive are the string keys on window.RJ.
 */
(function(GLOBAL){
"use strict";

/* ---- deployment guard: refuse to run outside approved hosts ---- */
(function(){
  var ALLOW = [
    "ebg-campaign.ruijie.com",
    "ruijie.com",
    "ruijienetworks.com",
    "msgsndr.com",              // GHL published pages
    "gohighlevel.com",          // GHL preview
    "leadconnectorhq.com",      // GHL funnels
    "localhost",
    "127.0.0.1",
    ""                          // local file preview
  ];
  var h = (location && location.hostname || "").toLowerCase();
  var ok = ALLOW.some(function(d){ return h === d || h.indexOf("."+d) === h.length-d.length-1; });
  if(!ok && h.indexOf("file")!==0){
    try{ document.documentElement.innerHTML =
      '<div style="font:16px Arial;padding:48px;color:#EAF2FF;background:#03081A;min-height:100vh">'+
      'This assessment is licensed for use on Ruijie Networks properties only.</div>'; }catch(e){}
    throw new Error("RJ-CORE: unlicensed host");
  }
})();

/* ============================================================
   CONFIG
   ============================================================ */
const GHL_WEBHOOK = ""; // TODO: paste GoHighLevel webhook URL here
const CTA_REPORT  = "https://ebg-campaign.ruijie.com/2026-trend?lead_source=WiFi+App&sm_post=Report";
const CTA_CONTACT = "https://ebg-campaign.ruijie.com/connect-with-us?lead_source=WiFi+App&sm_post=Report";
const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function isMobile(){ return window.innerWidth<=760; }

/* ---------- sector planning profiles ---------- */
const SECTORS = {
  education:    {label:"Education",         ppap:32, dpp:2.2, occ:"scheduled", act:0.45},
  manufacturing:{label:"Manufacturing",     ppap:20, dpp:2.9, occ:"full",      act:0.30},
  logistics:    {label:"Logistics",         ppap:18, dpp:3.4, occ:"full",      act:0.34},
  services:     {label:"Services",          ppap:25, dpp:2.5, occ:"hybrid_mod",act:0.35},
  enterprise:   {label:"Enterprise",        ppap:26, dpp:2.5, occ:"hybrid_mod",act:0.35},
  finance:      {label:"Finance & Banking", ppap:22, dpp:2.6, occ:"hybrid_mod",act:0.40},
  retail:       {label:"Retail",            ppap:30, dpp:2.1, occ:"full",      act:0.25},
  healthcare:   {label:"Healthcare",        ppap:22, dpp:3.6, occ:"full",      act:0.42},
  government:   {label:"Government",        ppap:26, dpp:2.2, occ:"hybrid_lgt",act:0.32},
  hospitality:  {label:"Hospitality",       ppap:36, dpp:2.5, occ:"full",      act:0.22},
  general:      {label:"General Enterprise",ppap:25, dpp:2.5, occ:"hybrid_mod",act:0.33}
};
const SECTOR_ORDER = ["education","manufacturing","logistics","services","enterprise","finance","retail","healthcare","government","hospitality"];
const SECTOR_ICONS = {
  education:'<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
  manufacturing:'<path d="M2 20h20V9l-6 4V9l-6 4V9L4 13V4H2z"/><path d="M7 17h2M13 17h2"/>',
  logistics:'<path d="M1 7h11v10H1z"/><path d="M12 10h5l4 4v3h-9z"/><circle cx="6" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
  services:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M2 13h20"/>',
  enterprise:'<rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="8" width="8" height="13" rx="1"/><path d="M6 7h2M6 11h2M6 15h2M16 12h2M16 16h2"/>',
  finance:'<path d="M3 21h18M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/><path d="M3 9h18"/>',
  retail:'<path d="M3 8h18l-1.5 12.5a2 2 0 01-2 1.5H6.5a2 2 0 01-2-1.5L3 8z"/><path d="M8 8V6a4 4 0 018 0v2"/>',
  healthcare:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M12 9v7M8.5 12.5h7"/>',
  government:'<path d="M3 21h18M4 21V10M20 21V10M8 21V10M16 21V10M12 21V10"/><path d="M2 10l10-7 10 7"/>',
  hospitality:'<path d="M2 20h20M4 20V9a2 2 0 012-2h12a2 2 0 012 2v11"/><path d="M8 20v-5h8v5"/><path d="M9 11h.01M15 11h.01"/>'
};
const SECTOR_SYNONYMS = {
  education:["university","universities","college","school","campus","k12","k-12","academy","academic","student","training","institute","polytechnic","tuition","education","higher ed","edu"],
  manufacturing:["factory","factories","plant","industrial","manufacturer","automotive","mining","energy","utilities","oil","gas","chemical","semiconductor","electronics","production","assembly","fabrication","fmcg","construction","engineering","agriculture","textile","food processing","pharma manufacturing"],
  logistics:["logistics","warehouse","warehousing","supply chain","distribution","fulfilment","fulfillment","3pl","freight","shipping","courier","delivery","haulage","trucking","fleet","cold chain","port","terminal","depot","cargo","transport","last mile","air freight","customs broker"],
  services:["consulting","consultancy","legal","law","accounting","audit","bpo","call centre","call center","outsourcing","media","advertising","agency","marketing","architecture","recruitment","hr","professional services","real estate","property","telecom","telecommunications","isp","service provider","msp"],
  enterprise:["corporate","headquarters","hq","office","technology","software","saas","tech","conglomerate","holdings","group","multinational","shared services","it"],
  finance:["bank","banking","finance","financial","insurance","fintech","investment","asset management","wealth","credit","securities","brokerage","capital","fund","payments","treasury","exchange"],
  retail:["shop","store","mall","supermarket","hypermarket","ecommerce","e-commerce","restaurant","food","beverage","f&b","franchise","convenience","fashion","grocery","pharmacy retail","showroom","dealership","retail"],
  healthcare:["hospital","clinic","medical","pharma","pharmaceutical","dental","aged care","nursing","laboratory","lab","diagnostic","healthcare","health","biotech","surgery","patient"],
  government:["ministry","council","municipal","public sector","defence","defense","military","agency","government","govt","customs","immigration","police","court","embassy","statutory","regulator","smart city","transport authority","airport authority"],
  hospitality:["hotel","hotels","resort","venue","conference","convention","stadium","arena","casino","cruise","theme park","tourism","travel","hospitality","serviced apartment","banquet","catering"]
};

/* ---------- occupancy ---------- */
const OCC = {
  full:       {label:"Mostly on site, 4 to 5 days",  r:1.0},
  scheduled:  {label:"Timetabled peaks",             r:1.2},
  hybrid_mod: {label:"Hybrid, 2 to 3 days",          r:1.5},
  hybrid_lgt: {label:"Highly flexible, 1 day or less",r:2.4}
};

/* ---------- wireless standards ---------- */
/* Base median airtime access delay per standard on a quiet channel, in ms.
   Newer generations schedule rather than contend, so the floor is lower. */
const WIFI_LAT = {wifi4:12, wifi5:6, wifi6:3, wifi6e:2.6, wifi7:2, mixed:7};
const WIFI = {
  /* cap = effective sustained goodput (Mbps) a single radio delivers across many
     concurrent clients in a dense, mixed-rate environment. Calibrated so that
     breaking points reproduce published testing: Wi-Fi 5 fails near 20 concurrent
     users on standard video, Wi-Fi 6 carries 25+ at modest degradation. [1]
     pen is a display factor only, used to widen slow-client segments on the
     airtime clock. It is not applied twice in the airtime maths. */
  wifi4: {label:"Wi-Fi 4 or older", cap:25,  pen:2.40, spec:10, ai:14, bands:"2.4 GHz"},
  wifi5: {label:"Wi-Fi 5",          cap:55,  pen:1.75, spec:30, ai:30, bands:"2.4 / 5 GHz"},
  wifi6: {label:"Wi-Fi 6",          cap:110, pen:1.15, spec:58, ai:66, bands:"2.4 / 5 GHz"},
  wifi6e:{label:"Wi-Fi 6E",         cap:145, pen:1.06, spec:80, ai:80, bands:"2.4 / 5 / 6 GHz"},
  wifi7: {label:"Wi-Fi 7",          cap:190, pen:1.00, spec:95, ai:92, bands:"2.4 / 5 / 6 GHz"},
  mixed: {label:"Mixed or not sure",cap:65,  pen:1.60, spec:34, ai:34, bands:"Mixed estate"}
};

/* ---------- applications ---------- */
const APPS = {
  web:      {short:"Business apps and web", label:"Light business apps, email and web", mbps:1.0, up:0.12, lat:150,
             d:"Browsers, messaging, thin line-of-business systems"},
  video_std:{short:"Voice and video", label:"Voice and standard video",      mbps:2.0, up:0.30, lat:50,
             d:"Calls, meetings, standard streaming, digital signage"},
  saas:     {short:"SaaS and virtual desktops", label:"Heavy SaaS, virtual desktops and file sync", mbps:2.8, up:0.34, lat:70,
             d:"VDI and DaaS, always-on cloud suites, large file sync, CAD or ERP over the network"},
  video_hd: {short:"HD video at scale", label:"HD video and collaboration at scale", mbps:3.5, up:0.38, lat:40,
             d:"Full-HD meetings across many rooms, lecture capture, live streaming"},
  special:  {short:"Machine and telemetry", label:"Machine, imaging or telemetry traffic", mbps:6.0, up:0.30, lat:20,
             d:"AGVs and robotics, machine vision, medical imaging, CCTV analytics, dense sensor fleets"}
};
/* per-sector example text so the fourth option never reads as irrelevant */
const APP_HINT = {
  manufacturing:"In a plant this is usually AGVs, machine vision and line telemetry.",
  logistics:"In a warehouse this is usually scanners, AGVs, yard cameras and cold-chain sensors.",
  healthcare:"In a hospital this is usually imaging transfer, telemetry and clinical device fleets.",
  education:"On a campus this is usually lecture capture and streamed instructional video.",
  retail:"In retail this is usually POS, CCTV analytics and inventory sensing.",
  hospitality:"In a venue this is usually guest streaming and event production traffic.",
  government:"In public sector this is usually surveillance, control room and field systems.",
  finance:"In financial services this is usually trading, market data and branch video.",
  services:"In professional services this is usually collaboration and client video.",
  enterprise:"In a corporate estate this is usually collaboration and building systems.",
  general:""
};

/* ---------- AI stages ---------- */
const AI = {
  none:      {label:"No AI workloads yet",             mult2035:2.5, press:0.10, up:0.005, flow:643},
  standard:  {label:"Standard AI assistants",          mult2035:4.2, press:0.36, up:0.030, flow:820},
  piloting:  {label:"Piloting autonomous agents",      mult2035:6.6, press:0.66, up:0.062, flow:1060},
  production:{label:"Agents running in production",    mult2035:9.0, press:0.92, up:0.090, flow:1292}
};

/* ---------- wired + ops ---------- */
const WIRED = {
  unsure:  {label:"Not sure",                          s:35},
  g1:      {label:"1G uplinks with PoE+",              s:38},
  multigig:{label:"Multi-gig uplinks with PoE++",      s:86},
  fibre:   {label:"Fiber to the floor / optical LAN",  s:96}
};
const OPS = {
  basic:     {label:"Basic, device level only", s:24},
  dashboards:{label:"Central dashboards",       s:60},
  analytics: {label:"Analytics driven",         s:94}
};

/* ---------- 6 GHz regulatory posture ---------- */
const SIXG_FULL = ["United States","Canada","Brazil","South Korea","Saudi Arabia","United Arab Emirates","Chile","Colombia","Peru","Costa Rica","Guatemala","Honduras","Jordan","Morocco","Tunisia","Kenya"];
const SIXG_NONE = ["China","Russia","Belarus"];
const COUNTRIES = ["Malaysia","Singapore","Indonesia","Thailand","Vietnam","Philippines","Cambodia","Myanmar","Brunei","India","Bangladesh","Sri Lanka","Pakistan","Nepal","China","Hong Kong SAR","Taiwan","Japan","South Korea","Australia","New Zealand","United Arab Emirates","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman","Jordan","Egypt","Turkey","Israel","South Africa","Nigeria","Kenya","Ghana","Morocco","Tunisia","United Kingdom","Ireland","Germany","France","Spain","Italy","Netherlands","Belgium","Portugal","Poland","Czechia","Austria","Switzerland","Sweden","Norway","Denmark","Finland","Greece","Romania","Hungary","United States","Canada","Mexico","Brazil","Argentina","Chile","Colombia","Peru","Russia","Other"];
function sixGHzPosture(c){
  if(SIXG_NONE.indexOf(c)>-1) return {k:"none", t:"6 GHz is not available for Wi-Fi in your market"};
  if(SIXG_FULL.indexOf(c)>-1) return {k:"full", t:"the full 6 GHz band is open in your market"};
  return {k:"lower", t:"the lower 6 GHz band is typically available in your market"};
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
/* A radio cannot be busier than all of the time. Every surface that shows an
   airtime figure goes through here so none of them can print above 100%. */
function airLabel(r,style){
  const u=Math.round(Math.min(r.airtime,1)*100);
  if(!r.oversub) return u+"%";
  if(style==="short") return "100%+";
  if(style==="long")  return "100% airtime, demand "+r.oversub.toFixed(1)+"x over capacity";
  return "100% + "+r.oversub.toFixed(1)+"x over";
}

/* ---------- horizon years, derived not hard coded ---------- */
const YEAR_NOW    = new Date().getFullYear();
const YEAR_BASE   = Math.max(2026, YEAR_NOW);
const YEAR_TARGET = Math.max(2035, YEAR_BASE + 5);
const YEAR_SPAN   = Math.max(1, YEAR_TARGET - YEAR_BASE);
/* The published projection runs 2026 to 2035. As the base year advances, less of
   that growth remains ahead of us, so the effective ceiling scales down with the
   remaining span rather than pretending the full multiple is still to come. */
const HORIZON_REMAIN = clamp(YEAR_SPAN / 9, 0.35, 1);
function horizonYear(h){ return YEAR_BASE + Math.round(clamp(h,0,1) * YEAR_SPAN); }

/* ---------- tiers ---------- */
const TIERS = [
  {k:"constrained",lo:0, hi:30, label:"Constrained", c:"#FF4D5E", d:"At or beyond design limits today"},
  {k:"exposed",    lo:31,hi:55, label:"Exposed",     c:"#F5A623", d:"Adequate now, exposed under AI-era load"},
  {k:"prepared",   lo:56,hi:80, label:"Prepared",    c:"#00D4D8", d:"Sound foundation with targeted gaps"},
  {k:"advanced",   lo:81,hi:100,label:"Advanced",    c:"#2DD4BF", d:"Headroom for agentic workloads"}
];
function tierOf(s){ return TIERS.find(t=>s>=t.lo&&s<=t.hi)||TIERS[0]; }

/* ---------- pillars ---------- */
const PILLARS = [
  {k:"cap",  label:"Airtime Headroom",      w:0.30, d:"Spare channel time per radio at peak client density"},
  {k:"ai",   label:"AI Traffic Readiness",  w:0.25, d:"Upstream symmetry, flow duration and air-side prioritisation"},
  {k:"spec", label:"Spectrum & Standards",  w:0.20, d:"Wi-Fi generation capability and usable band count"},
  {k:"wire", label:"AP Backhaul & Power",   w:0.15, d:"Uplink speed and PoE budget feeding each access point"},
  {k:"ops",  label:"RF Visibility & Control",w:0.10,d:"Ability to see and tune the radio environment in service"}
];

/* ---------- state ---------- */
const S = {
  lead:{}, sector:"", sectorFree:"",
  scale:"", wifi:"", app:"", ai:"",
  intent:"", trigger:"",
  ppap:26, dpp:2.5, occ:"hybrid_mod", wired:"unsure", ops:"dashboards", horizon:0,
  baseline:null
};
const SCALE = {
  u100:   {label:"Under 100",        n:80},
  "100_500":{label:"100 to 500",     n:300},
  "500_2000":{label:"500 to 2,000",  n:1200},
  o2000:  {label:"Over 2,000",       n:3500}
};
const INTENT = {
  none:        {label:"No plans in the next 24 months",    grade:"D"},
  researching: {label:"Researching and building the case", grade:"C"},
  budgeted:    {label:"Budget approved this financial year",grade:"B"},
  shortlisting:{label:"Actively evaluating and shortlisting",grade:"A"}
};
const TRIGGER = {
  capacity:{label:"Coverage or capacity complaints"},
  refresh: {label:"Refresh cycle due"},
  newsite: {label:"New site or expansion"},
  airollout:{label:"AI or new application rollout"},
  security:{label:"Security or compliance"},
  none:    {label:"Nothing specific right now"}
};

/* ============================================================
   MODEL
   ============================================================ */
function compute(st){
  const sec=SECTORS[st.sector]||SECTORS.general;
  const w=WIFI[st.wifi]||WIFI.wifi6, a=APPS[st.app]||APPS.video_std, ai=AI[st.ai]||AI.standard;
  const scl=SCALE[st.scale]||SCALE["100_500"];
  const occR=(OCC[st.occ]||OCC.hybrid_mod).r;

  const concurrent = (st.ppap/occR)*st.dpp*sec.act;
  const perDev = a.mbps;
  const offered = concurrent*perDev;
  const cap = w.cap;
  /* Demand ratio. A radio cannot physically be more than 100% busy, so a value
     above 1.0 means offered load exceeds what the medium can carry: frames queue,
     retry and drop. Utilisation is what we display, oversubscription is the
     honest way to express anything past the ceiling. */
  const airtime = clamp(offered/cap,0,4);
  const utilisation = Math.min(airtime,1);
  const oversub = airtime>1 ? airtime : 0;

  // breaking point: concurrent devices at the 80% airtime ceiling
  const breakAt = Math.max(1,Math.floor((0.80*cap)/perDev));

  /* Latency. Contention delay on a shared medium rises non-linearly with
     utilisation, so a simple 1/(1-rho) queueing term is the defensible shape.
     Anchored against published testing that found latency rising roughly 14x
     on Wi-Fi 5 and 3.5x on Wi-Fi 6 as concurrency climbed. [1] */
  const rho = clamp(airtime, 0, 0.97);
  const latBase = WIFI_LAT[st.wifi] || WIFI_LAT.wifi6;
  const latencyMs = Math.round(latBase / (1 - rho) * 10) / 10;
  const latencyTol = a.lat;
  const latencyRatio = latencyMs / latencyTol;

  // AI growth curve, horizon 0..1 maps 2026 -> 2035
  const h=st.horizon;
  const effMult = 1 + (ai.mult2035-1)*HORIZON_REMAIN;
  const growth = 1 + (effMult-1)*Math.pow(h,1.55);
  const futureAirtime = clamp(airtime*growth,0,4);

  // pillars
  const ratio = airtime/0.80;
  const capS = clamp(Math.round(105-ratio*90),0,100);

  const sg = sixGHzPosture(st.lead.country||"Other");
  let specS = w.spec;
  if((st.wifi==="wifi6e"||st.wifi==="wifi7")){
    if(sg.k==="none") specS=Math.min(specS,52);
    else if(sg.k==="lower") specS=Math.min(specS,Math.round(specS*0.88));
  }
  specS=clamp(specS,0,100);

  /* Latency sensitivity belongs here rather than in Airtime Headroom, because
     airtime already scores the utilisation itself. What this adds is whether
     the delay that utilisation produces is tolerable for this workload. */
  const latPenalty = latencyRatio<=0.5 ? 0 : latencyRatio<=1 ? 6 : latencyRatio<=2 ? 16 : 26;
  const aiS = clamp(Math.round(w.ai - ai.press*46 + 18 - (a.mbps>3?6:0) - h*10 - latPenalty),0,100);
  const wireS = (WIRED[st.wired]||WIRED.unsure).s;
  const opsS  = (OPS[st.ops]||OPS.dashboards).s;

  const p={cap:capS, ai:aiS, spec:specS, wire:wireS, ops:opsS};
  let overall=0; PILLARS.forEach(pl=>overall+=p[pl.k]*pl.w);
  overall=clamp(Math.round(overall),0,100);

  // share of flows that are upstream-heavy, comparable to the 0.5% web baseline.
  // Application profile nudges it slightly, AI stage dominates.
  const upstreamShare = clamp(ai.up * (1 + (a.up-0.12)*0.9), 0.004, 0.12);

  return {
    concurrent:Math.round(concurrent), offered:Math.round(offered), cap:Math.round(cap),
    airtime, futureAirtime, breakAt, growth, p, overall, tier:tierOf(overall),
    utilisation, oversub, horizonYear:horizonYear(h), effMult,
    upstreamShare, flowMs:ai.flow, sixg:sg, perDev,
    latencyMs, latencyTol, latencyRatio, latBase,
    devicesTotal:Math.round(scl.n*st.dpp),
    apsNeeded:Math.max(1,Math.ceil(scl.n/st.ppap))
  };
}

/* ============================================================
   RADAR
   ============================================================ */
function radarSVG(p,compact){
  const PAD = compact ? 22 : 34;
  const size=520, cx=260, cy=compact?222:200, R=compact?178:152;
  const keys=PILLARS.map(x=>x.k);
  const SHORT={cap:"Airtime",ai:"AI Traffic",spec:"Spectrum",wire:"Backhaul",ops:"Visibility"};
  const labels=PILLARS.map(x=>compact?SHORT[x.k]:x.label);
  const n=keys.length;
  const pt=(i,r)=>{
    const a=-Math.PI/2 + (Math.PI*2*i)/n;
    return [cx+Math.cos(a)*r, cy+Math.sin(a)*r];
  };
  let g='<svg viewBox="0 0 '+size+' '+(compact?430:400)+'" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">';
  [0.25,0.5,0.75,1].forEach(f=>{
    let d="";
    for(let i=0;i<n;i++){const[x,y]=pt(i,R*f);d+=(i?"L":"M")+x.toFixed(1)+","+y.toFixed(1);}
    g+='<path d="'+d+'Z" fill="none" stroke="rgba(120,170,235,.15)" stroke-width="1.2"/>';
  });
  for(let i=0;i<n;i++){const[x,y]=pt(i,R);g+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="rgba(120,170,235,.15)" stroke-width="1.2"/>';}
  let d="",dots="";
  keys.forEach((k,i)=>{
    const v=clamp(p[k],0,100)/100;
    const[x,y]=pt(i,R*v);
    d+=(i?"L":"M")+x.toFixed(1)+","+y.toFixed(1);
    dots+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(compact?6:5.4)+'" fill="#00D4D8" stroke="#03081A" stroke-width="2.4"/>';
  });
  g+='<path id="radarPath" d="'+d+'Z" fill="rgba(0,212,216,.18)" stroke="#00D4D8" stroke-width="2.6" stroke-linejoin="round"/>'+dots;
  labels.forEach((L,i)=>{
    const[x,y]=pt(i,R+PAD);
    let anchor="middle", dy=4;
    if(x>cx+12) anchor="start"; else if(x<cx-12) anchor="end";
    if(y<cy-60) dy=-2; if(y>cy+60) dy=13;
    const words=L.split(" ");
    let lines=[L];
    if(!compact && L.length>18){ lines=[words.slice(0,words.length-1).join(" "), words[words.length-1]]; }
    const fs=compact?17:13.5;
    let txt='<text x="'+x.toFixed(1)+'" y="'+(y+dy).toFixed(1)+'" text-anchor="'+anchor+'" font-family="Arial" font-size="'+fs+'" font-weight="700" fill="#A8BEDC">';
    lines.forEach((ln,j)=>{ txt+='<tspan x="'+x.toFixed(1)+'" dy="'+(j?fs+1:0)+'">'+ln+'</tspan>'; });
    txt+='</text>';
    const[vx,vy]=pt(i,R-(compact?20:16));
    g+=txt+'<text x="'+vx.toFixed(1)+'" y="'+(vy+5).toFixed(1)+'" text-anchor="middle" font-family="Space Grotesk,Arial" font-size="'+(compact?19:14)+'" font-weight="700" fill="#00D4D8">'+Math.round(p[keys[i]])+'</text>';
  });
  g+='</svg>';
  return g;
}

/* ============================================================
   GAUGE
   ============================================================ */
function gaugeSVG(v,color){
  const R=104, C=Math.PI*R*1.5;
  const off=C*(1-clamp(v,0,1));
  return '<svg viewBox="0 0 260 260" style="overflow:visible">'+
    '<circle cx="130" cy="130" r="'+R+'" fill="none" stroke="rgba(120,170,235,.13)" stroke-width="15" stroke-linecap="round" stroke-dasharray="'+C+' '+(Math.PI*2*R)+'" transform="rotate(135 130 130)"/>'+
    '<circle id="gaugeArc" cx="130" cy="130" r="'+R+'" fill="none" stroke="'+color+'" stroke-width="15" stroke-linecap="round" stroke-dasharray="'+C+' '+(Math.PI*2*R)+'" stroke-dashoffset="'+C+'" transform="rotate(135 130 130)" style="transition:stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)" data-off="'+off+'"/>'+
    '</svg>';
}

const PILLAR_ICON = {
  cap:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  ai:'<path d="M2 12h3l2.5-7 4 14 3-9 2 2h5.5"/>',
  spec:'<path d="M4.9 19.1a10 10 0 010-14.2M19.1 4.9a10 10 0 010 14.2"/><path d="M7.8 16.2a6 6 0 010-8.4M16.2 7.8a6 6 0 010 8.4"/><circle cx="12" cy="12" r="1.6"/>',
  wire:'<path d="M6 3v5M18 3v5"/><path d="M5 8h14v4a7 7 0 01-14 0z"/><path d="M12 19v3"/>',
  ops:'<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
  lat:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/>'
};

/* ============================================================
   PERSONALISATION
   ============================================================ */
function orgName(){ return (S.lead.company||"your organisation").trim(); }
function firstName(){ return (S.lead.first||"").trim(); }
function orgShort(){
  // trim legal suffixes so copy reads naturally in a sentence
  let n=orgName().replace(/\s+(Sdn\.?\s*Bhd\.?|Berhad|Bhd\.?|Pte\.?\s*Ltd\.?|Pty\.?\s*Ltd\.?|Ltd\.?|Limited|LLC|L\.L\.C\.?|Inc\.?|Incorporated|GmbH|AG|N\.?V\.?|B\.?V\.?|S\.A\.?|S\.p\.A\.?|PLC|Corp\.?|Corporation|Co\.?|Holdings|Group)$/i,"");
  return n.length>34 ? orgName() : n;
}

/* ============================================================
   FINDINGS
   ============================================================ */
function buildFindings(R){
  const out=[];
  const ranked=PILLARS.slice().sort((a,b)=>R.p[a.k]-R.p[b.k]);
  const w=WIFI[S.wifi], ai=AI[S.ai], sec=SECTORS[S.sector]||SECTORS.general;

  ranked.slice(0,3).forEach(pl=>{
    const v=R.p[pl.k];
    if(pl.k==="cap"){
      out.push({ic:"cap",t:"Airtime is the first thing that runs out",
        b:"At "+R.concurrent+" concurrent clients per radio and roughly "+R.perDev.toFixed(1)+" Mbps each, "+orgShort()+" is running at <k>"+airLabel(R,"long")+"</k>. WLAN design practice treats around 80% airtime as the practical ceiling, above which contention, backoff and retransmission dominate rather than useful throughput.<sup>[3]</sup>",
        m:"<b>Breaking point:</b> approximately <k>"+R.breakAt+" concurrent clients</k> on one radio at your current Wi-Fi standard."});
    }
    if(pl.k==="ai"){
      out.push({ic:"ai",t:"Volume is not the problem, traffic shape is",
        b:"AI traffic behaves differently from the web traffic the "+orgShort()+" network was designed for. Published 2026 research measured median AI inference flow duration at roughly <k>twice</k> that of standard web transactions, and found a materially higher share of flows running upstream-heavy than general web traffic does.<sup>[2]</sup> Agent-executed tasks in the same research generated several times more traffic per task than human-driven interactions.<sup>[2]</sup>",
        m:"<b>Your exposure:</b> upstream airtime on the wireless edge, prioritisation for inference paths, and firewall state headroom for longer-lived flows."});
    }
    if(pl.k==="spec"){
      out.push({ic:"spec",t:"Your spectrum is doing half the work",
        b:"'"+orgShort()+"' is running "+w.label+" across "+w.bands+". Based on your registered country, "+R.sixg.t+". Where 6 GHz is usable, moving high-density areas onto a third radio relieves pressure that currently sits entirely on 5 GHz, and gives you clean spectrum with no legacy clients slowing the medium.",
        m:"<b>Note:</b> 6 GHz availability is set by national regulation and differs sharply across EMEA, APAC and the Middle East."});
    }
    if(pl.k==="wire"){
      out.push({ic:"wire",t:"The bottleneck may be the feed, not the radio",
        b:"The wired underlay at "+orgShort()+" is recorded as <b>"+WIRED[S.wired].label.toLowerCase()+"</b>. A Wi-Fi 6E or Wi-Fi 7 access point needs a multi-gigabit uplink and 802.3bt power to run all its radios at full rate. On a 1G uplink with PoE+, it will negotiate down, disable a radio chain or throttle, and the air interface upgrade you paid for never materialises.",
        m:"<b>Check first:</b> uplink speed per AP, switch aggregation capacity, and PoE budget per port at full load."});
    }
    if(pl.k==="ai" && R.latencyRatio>1){ /* handled by the dedicated latency finding below */ }
    if(pl.k==="ops"){
      out.push({ic:"ops",t:"You cannot tune an RF environment you cannot see",
        b:"Visibility is recorded as <b>"+OPS[S.ops].label.toLowerCase()+"</b>. Airtime utilisation, co-channel interference and client retry rate are the three measurements that predict wireless user experience, and none of them appear in a basic device view. Without them, RF problems surface as helpdesk tickets rather than as data.",
        m:"<b>Minimum useful set:</b> per-radio airtime, channel utilisation, client retry rate, RSSI distribution and roaming events."});
    }
  });
  /* Latency earns a slot on merit rather than by pillar rank, because it is
     the thing users actually report and it is invisible in a throughput number. */
  if(R.latencyRatio>1){
    out.unshift({ic:"lat",t:"Latency is what your users will report, not throughput",
      b:"At "+airLabel(R)+" airtime, modelled median access delay on one radio is around <w>"+R.latencyMs+" ms</w>. Contention delay rises non-linearly as a channel fills, so the last 20% of utilisation costs far more delay than the first 20%. Your dominant workload, "+APPS[S.app].label.toLowerCase()+", starts to degrade beyond roughly <k>"+R.latencyTol+" ms</k>.",
      m:"<b>What this looks like:</b> calls breaking up, scanners retrying, applications feeling slow while a speed test still reports healthy throughput."});
  }
  return out.slice(0,3);
}

/* ============================================================
   FOCUS CARDS
   ============================================================ */
const FOCUS_MAP={
  cap:{tag:"Airtime headroom",h:"Client density is your constraint, not coverage",
    p:"Adding more of the same access point rarely fixes a density problem, it adds co-channel interference and makes the contention worse. What works is higher-density radios, more usable spectrum, tighter cell sizing and reduced transmit power. Ruijie's high-density access point range is built around exactly this problem in campus, venue and open-plan environments."},
  ai:{tag:"AI traffic readiness",h:"Provision the air interface for shape, not just volume",
    p:"Upstream capacity, prioritisation for inference paths and firewall state headroom matter more than headline throughput once agents are in production. Ruijie Cloud gives you visibility of these flows before they turn into incidents, and the wireless estate can be tuned centrally as the traffic mix shifts."},
  spec:{tag:"Spectrum & standards",h:"Open a third radio where regulation allows",
    p:"Tri-band designs move high-density areas off a congested 5 GHz plane. Ruijie's portfolio spans Wi-Fi 6, 6E and Wi-Fi 7, so migration can be staged site by site rather than as a single estate-wide replacement, which keeps the capital profile manageable."},
  wire:{tag:"AP backhaul & power",h:"Your access points are only as good as what feeds them",
    p:"Wi-Fi 7 needs multi-gigabit uplinks and 802.3bt power to deliver what it promises. Ruijie's Simplified Optical Ethernet architecture carries multi-gig to every access point with substantially less cabling and floor space than traditional copper aggregation, which is often the difference between a viable upgrade and a building works project."},
  ops:{tag:"RF visibility & control",h:"Make the RF environment measurable before you scale it",
    p:"Cloud-managed RF visibility with automated channel and power optimization turns airtime management into a routine task rather than a fire drill. Ruijie Cloud is Tolly certified for reliability and manages networks across 147+ countries."}
};


function verdictText(R){
  if(!R||!R.tier) return "";
  const t=R.tier.k, sec=(SECTORS[S.sector]||SECTORS.general).label.toLowerCase(), org=orgShort();
  if(t==="constrained") return org+"'s AP radios are already at or beyond their practical airtime ceiling for a "+sec+" environment of this client density. <b>Capacity is a present problem, not a future one.</b> Everything below is ordered by what to fix first.";
  if(t==="exposed") return "The "+org+" WLAN handles today's load, but the airtime margin is thin. <b>The exposure appears when AI workloads change the shape of your traffic</b>, not when they change the volume. The gaps below are the ones that close fastest.";
  if(t==="prepared") return org+" has a sound wireless foundation with specific, addressable gaps. <b>Protect the airtime margin rather than spending it</b>, and the estate should carry agentic workloads without a wholesale AP refresh.";
  return org+" has real headroom. <b>The two things worth watching are sustained inference flows holding session state far longer than web traffic, and rising upstream demand</b> from large context payloads. Neither is urgent today.";
}

/* expose nothing extra: everything above is already file-scope global by design */
window.RJ_CORE_READY = true;


/* ---- the only contract with the page shell ---- */
GLOBAL.RJ = {
  S: S,
  SECTORS: SECTORS,
  SECTOR_ORDER: SECTOR_ORDER,
  SECTOR_ICONS: SECTOR_ICONS,
  SECTOR_SYNONYMS: SECTOR_SYNONYMS,
  OCC: OCC,
  WIFI: WIFI,
  WIFI_LAT: WIFI_LAT,
  APPS: APPS,
  APP_HINT: APP_HINT,
  AI: AI,
  WIRED: WIRED,
  OPS: OPS,
  SCALE: SCALE,
  INTENT: INTENT,
  TRIGGER: TRIGGER,
  PILLARS: PILLARS,
  PILLAR_ICON: PILLAR_ICON,
  TIERS: TIERS,
  FOCUS_MAP: FOCUS_MAP,
  COUNTRIES: COUNTRIES,
  SIXG_FULL: SIXG_FULL,
  SIXG_NONE: SIXG_NONE,
  YEAR_NOW: YEAR_NOW,
  YEAR_BASE: YEAR_BASE,
  YEAR_TARGET: YEAR_TARGET,
  YEAR_SPAN: YEAR_SPAN,
  RM: RM,
  GHL_WEBHOOK: GHL_WEBHOOK,
  CTA_REPORT: CTA_REPORT,
  CTA_CONTACT: CTA_CONTACT,
  clamp: clamp,
  airLabel: airLabel,
  horizonYear: horizonYear,
  sixGHzPosture: sixGHzPosture,
  tierOf: tierOf,
  isMobile: isMobile,
  compute: compute,
  radarSVG: radarSVG,
  gaugeSVG: gaugeSVG,
  buildFindings: buildFindings,
  verdictText: verdictText,
  orgName: orgName,
  firstName: firstName,
  orgShort: orgShort
};
GLOBAL.RJ_CORE_READY = true;

})(window);
