const LONDON_LON = -0.1276;
const TEACHER_PASSWORD = "badcafe012";
const DESTINATIONS = [
  ["Paris, France",2.35],["Barcelona, Spain",2.17],["Rome, Italy",12.5],["Athens, Greece",23.7],["Cairo, Egypt",31.2],["Dubai, UAE",55.3],["Muscat, Oman",58.4],["Mumbai, India",72.8],["Goa, India",73.8],["Kathmandu, Nepal",85.3],["Bangkok, Thailand",100.5],["Singapore",103.8],["Kuala Lumpur, Malaysia",101.7],["Bali, Indonesia",115.2],["Perth, Australia",115.9],["Adelaide, Australia",138.6],["Melbourne, Australia",144.9],["Sydney, Australia",151.2],["Auckland, New Zealand",174.8],["Nadi, Fiji",177.4],
  ["Honolulu, USA",-157.9],["Vancouver, Canada",-123.1],["Seattle, USA",-122.3],["San Francisco, USA",-122.4],["Los Angeles, USA",-118.2],["Las Vegas, USA",-115.1],["Mexico City, Mexico",-99.1],["Cancun, Mexico",-86.8],["Havana, Cuba",-82.4],["Miami, USA",-80.2],["New York, USA",-74.0],["Toronto, Canada",-79.4],["Santo Domingo, DR",-69.9],["Bogota, Colombia",-74.1],["Lima, Peru",-77.0],["Santiago, Chile",-70.7],["Buenos Aires, Argentina",-58.4],["Rio de Janeiro, Brazil",-43.2],["Cape Town, South Africa",18.4],["Marrakesh, Morocco",-7.98],
  ["Lisbon, Portugal",-9.1],["Reykjavik, Iceland",-21.9],["Dublin, Ireland",-6.26],["Amsterdam, Netherlands",4.9],["Berlin, Germany",13.4],["Prague, Czechia",14.4],["Vienna, Austria",16.4],["Istanbul, Türkiye",28.9],["Doha, Qatar",51.5],["Tokyo, Japan",139.7]
];

const DEFAULT_LIFEEVENTS = ["Flight delay due to storms","Lost luggage at transfer airport","Hotel overbooked on arrival","Passport queue causes missed connection","Rail strike affects local travel","Unexpected festival crowds in city centre","Food poisoning from street food","Broken leg during excursion","Local taxi strike","Hurricane warning changes plans","Heatwave causes attraction closures","Museum closed for emergency maintenance","Phone lost while sightseeing","Travel card payment declined temporarily","Minor language misunderstanding with guide","Unexpected visa paperwork issue","Seasickness on ferry crossing"]

let lifeEvents = [];

const $ = id => document.getElementById(id);

function hideRevealButtonForSession(){
  $("revealBtn").classList.add("hidden");
  $("statusMsg").textContent = "Destination revealed for this visit. Come back next lesson to reveal again.";
}

async function loadTextLines(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    return lines.length ? lines : fallback;
  } catch (_err) {
    return fallback;
  }
}
function hashCode(str){ let h=2166136261; for(const c of str){ h^=c.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0; }
function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function normalizeLon(lon){ return lon<0?lon+360:lon; }

function itineraryFromOriginal(originalCode){
  const seed = hashCode(originalCode);
  const rng = mulberry32(seed);
  const dir = rng() < 0.5 ? "east" : "west";
  const start = normalizeLon(LONDON_LON);
  const arr = DESTINATIONS.map(d => ({name:d[0], lon:d[1], nlon:normalizeLon(d[1])}));
  const sorted = arr.sort((a,b)=>a.nlon-b.nlon);
  const transformed = sorted.map(c => ({...c, rel: dir==="east" ? ((c.nlon-start+360)%360) : ((start-c.nlon+360)%360)})).sort((a,b)=>a.rel-b.rel);
  const step = 40 + Math.floor(rng()*30);
  let pos = 5 + Math.floor(rng()*25);
  const picks = [];
  for(let i=0;i<5;i++){
    const candidateIndex = transformed.findIndex(c => c.rel >= pos);
    const index = candidateIndex >= 0 ? candidateIndex : transformed.length-1;
    picks.push(transformed[index].name);
    pos += step + Math.floor(rng()*15);
  }
  return picks;
}

const LESSON_TOKENS = ["SKY9", "WAVE4", "TREK8", "GLOBE2", "NOVA7"];

function parseCode(code){
  const m = code.trim().toUpperCase().match(/^KES2-([A-Z0-9]{6})(?:-([A-Z0-9]{4,8}))?$/);
  if(!m) return null;
  const original = `KES2-${m[1]}`;
  if(!m[2]) return { original, lesson:1 };
  const lesson = LESSON_TOKENS.indexOf(m[2]) + 1;
  if(lesson < 1) return null;
  return { original, lesson };
}
function lessonToken(lesson){ return LESSON_TOKENS[Math.max(0, Math.min(lesson-1, LESSON_TOKENS.length-1))]; }
function nextCode(original, lesson){
  const nextLesson = Math.min(lesson+1,5);
  return `${original}-${lessonToken(nextLesson)}`;
}

function generateOriginalCode(name){
  const day = new Date().toISOString().slice(0,10);
  const key = `kes2_lastgen_${name.toLowerCase()}`;
  const last = localStorage.getItem(key);
  if(last === day) return null;
  const token = (hashCode(name + day).toString(36).toUpperCase() + "XXXXXX").slice(0,6);
  localStorage.setItem(key, day);
  return `KES2-${token}`;
}

function pick(arr,rng){ return arr[Math.floor(rng()*arr.length)]; }
async function revealFlow(original, lesson){
  const profile = JSON.parse(localStorage.getItem(`kes2_profile_${original}`) || "null");
  if(!profile){ $("statusMsg").textContent = "No saved profile for this code on this device. For lesson 1, please register as a new customer first."; return; }
  $("statusMsg").textContent = "";
  $("result").classList.add("hidden");
  $("loader").classList.remove("hidden");
  const bar = $("progressBar"), txt = $("progressText");
  const start = Date.now();
  await new Promise(resolve=>{
    const t = setInterval(()=>{
      const elapsed = Date.now()-start;
      const pct = Math.min(100, Math.floor((elapsed/7000)*100));
      bar.style.width = pct+"%"; txt.textContent = pct+"%";
      if(pct>=100){ clearInterval(t); resolve(); }
    },100);
  });
  $("loader").classList.add("hidden");

  const route = itineraryFromOriginal(original);
  const index = lesson-1;
  const city = route[index];
  const rng = mulberry32(hashCode(original+lesson));
  const event = rng()<0.7 ? pick(lifeEvents, rng) : "No complication this week — smooth travelling!";

  const history = route.slice(0, lesson).map((c, i) => `<li>Lesson ${i+1}: <strong>${c}</strong></li>`).join("");
  const next = nextCode(original, lesson);
  const out = `<h3>Lesson ${lesson} Destination 🌍</h3><p><strong>${city}</strong></p><p>Complication: ${event}</p><h4>Trip history</h4><ol>${history}</ol><p>Next lesson code: <strong id='nextCodeText'>${next}</strong></p><button id='copyCodeBtn' type='button'>Copy next code 📋</button>`;
  $("result").innerHTML = out;
  $("result").classList.remove("hidden");
  const copyBtn = $("copyCodeBtn");
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(next);
      copyBtn.textContent = "Copied ✅";
    } catch (_err) {
      copyBtn.textContent = "Copy failed";
    }
  };
}

document.querySelectorAll(".tab-btn").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  btn.classList.add("active"); $(btn.dataset.tab).classList.add("active");
});

$("revealBtn").onclick = () => {
  const newTabActive = $("new").classList.contains("active");

  if (newTabActive) {
    const name = $("firstName").value.trim();
    if(!name) return $("statusMsg").textContent="Please enter your first name.";
    let existingCode = $("newCodeOutput").textContent.match(/KES2-[A-Z0-9]{6}/)?.[0];
    if (!existingCode) {
      const code = generateOriginalCode(name);
      if(!code) return $("statusMsg").textContent="Travel code already generated today for this name.";
      localStorage.setItem(`kes2_profile_${code}`, JSON.stringify({name}));
      $("newCodeOutput").textContent = `Next lesson code: ${nextCode(code, 1)}`;
      existingCode = code;
    }

    hideRevealButtonForSession();
    return revealFlow(existingCode, 1);
  }

  const input = $("travelCodeInput").value.trim();
  if(!input) return $("statusMsg").textContent="Enter a travel code first.";
  const parsed = parseCode(input);
  if(!parsed) return $("statusMsg").textContent="Invalid code format.";
  hideRevealButtonForSession();
  revealFlow(parsed.original, parsed.lesson);
};

$("teacherViewBtn").onclick = () => {
  if($("teacherPassword").value !== TEACHER_PASSWORD) return alert("Incorrect password");
  const parsed = parseCode($("teacherCode").value.trim());
  if(!parsed) return alert("Enter a valid original code, e.g. KES2-ABC123");
  const route = itineraryFromOriginal(parsed.original);
  $("teacherResult").innerHTML = `<h3>Full Itinerary</h3><ol>${route.map(c=>`<li>${c}</li>`).join("")}</ol>`;
  $("teacherResult").classList.remove("hidden");
};

(async function init(){
  lifeEvents = await loadTextLines("lifeevents.txt", DEFAULT_LIFEEVENTS);
})();
