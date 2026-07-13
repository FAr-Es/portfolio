/* ================= FAKE-LENIS SMOOTH SCROLL ================= */
const wrapper = document.getElementById('smooth-wrapper');
const content = document.getElementById('smooth-content');
const spacer = document.getElementById('spacer');
let target = 0, current = 0;
const LERP = 0.09;

function resizeSpacer(){ spacer.style.height = content.offsetHeight + 'px'; }
resizeSpacer();
window.addEventListener('resize', resizeSpacer);
new ResizeObserver(resizeSpacer).observe(content);

function lerp(a,b,t){ return a + (b-a)*t; }

function raf(){
  target = window.scrollY || window.pageYOffset;
  current = lerp(current, target, LERP);
  if (Math.abs(target-current) < 0.05) current = target;
  wrapper.style.transform = `translate3d(0, ${-current}px, 0)`;
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// smooth anchor nav
document.querySelectorAll('a[data-nav]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const el = document.querySelector(a.getAttribute('href'));
    if(el) window.scrollTo({top: el.offsetTop, behavior:'smooth'});
  });
});

/* ================= NAV: scroll state + active link ================= */
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section');

function onScrollUI(){
  nav.classList.toggle('scrolled', target > 40);
}
setInterval(onScrollUI, 50);

const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if(en.isIntersecting){
      navLinks.forEach(l=>l.classList.remove('active'));
      const link = document.querySelector(`.nav-links a[href="#${en.target.id}"]`);
      if(link) link.classList.add('active');
    }
  });
}, {rootMargin:'-45% 0px -45% 0px'});
sections.forEach(s=>io.observe(s));

/* ================= REVEAL ON SCROLL ================= */
const revealIO = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if(en.isIntersecting){ en.target.classList.add('in'); revealIO.unobserve(en.target); }
  });
}, {threshold:.15});
document.querySelectorAll('.reveal, .reveal-stagger').forEach(el=>revealIO.observe(el));

/* ================= PARALLAX (about layers) ================= */
const parallaxEls = document.querySelectorAll('[data-speed]');
function parallaxLoop(){
  parallaxEls.forEach(el=>{
    const speed = parseFloat(el.dataset.speed);
    const rect = el.getBoundingClientRect();
    const offset = (rect.top - window.innerHeight/2) * speed;
    el.style.transform = `translateY(${-offset}px)`;
  });
  requestAnimationFrame(parallaxLoop);
}
requestAnimationFrame(parallaxLoop);

/* ================= CUSTOM CURSOR ================= */
const outer = document.getElementById('cursor-outer');
const inner = document.getElementById('cursor-inner');
let mx=innerWidth/2, my=innerHeight/2, ox=mx, oy=my;
window.addEventListener('mousemove', e=>{
  mx = e.clientX; my = e.clientY;
  inner.style.left = mx+'px'; inner.style.top = my+'px';
});
function cursorLoop(){
  ox = lerp(ox, mx, .18); oy = lerp(oy, my, .18);
  outer.style.left = ox+'px'; outer.style.top = oy+'px';
  requestAnimationFrame(cursorLoop);
}
requestAnimationFrame(cursorLoop);

document.querySelectorAll('[data-cursor]').forEach(el=>{
  const mode = el.dataset.cursor;
  el.addEventListener('mouseenter', ()=>{ outer.classList.add(mode); inner.classList.add('hide'); });
  el.addEventListener('mouseleave', ()=>{ outer.classList.remove(mode); inner.classList.remove('hide'); });
});

/* magnetic buttons */
document.querySelectorAll('.magnetic').forEach(el=>{
  el.addEventListener('mousemove', e=>{
    const r = el.getBoundingClientRect();
    const relX = e.clientX - r.left - r.width/2;
    const relY = e.clientY - r.top - r.height/2;
    el.style.transform = `translate(${relX*0.25}px, ${relY*0.25}px)`;
  });
  el.addEventListener('mouseleave', ()=>{ el.style.transform = 'translate(0,0)'; });
});

/* contact field focus glow */
document.querySelectorAll('.field input, .field textarea').forEach(inp=>{
  inp.addEventListener('focus', ()=> inp.closest('.field').classList.add('focused'));
  inp.addEventListener('blur', ()=> { if(!inp.value) inp.closest('.field').classList.remove('focused'); });
});

/* ================= INTERACTIVE PARTICLE BACKGROUND ================= */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W,H;
function resizeCanvas(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const PARTICLE_COUNT = Math.min(90, Math.floor((innerWidth*innerHeight)/16000));
const particles = Array.from({length:PARTICLE_COUNT}, ()=>({
  x: Math.random()*innerWidth,
  y: Math.random()*innerHeight,
  vx: (Math.random()-0.5)*0.15,
  vy: (Math.random()-0.5)*0.15,
  r: Math.random()*1.6+0.6,
  baseA: Math.random()*0.4+0.15
}));

let cursorX = innerWidth/2, cursorY = innerHeight/2, cursorActive = false;
window.addEventListener('mousemove', e=>{
  cursorX = e.clientX; cursorY = e.clientY; cursorActive = true;
});
window.addEventListener('mouseleave', ()=> cursorActive = false);

function drawBg(){
  ctx.clearRect(0,0,W,H);

  // cursor glow
  if(cursorActive){
    const glow = ctx.createRadialGradient(cursorX,cursorY,0,cursorX,cursorY,220);
    glow.addColorStop(0, 'rgba(255,43,43,0.10)');
    glow.addColorStop(1, 'rgba(255,43,43,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,W,H);
  }

  particles.forEach(p=>{
    // gentle drift
    p.x += p.vx; p.y += p.vy;
    if(p.x<0) p.x=W; if(p.x>W) p.x=0;
    if(p.y<0) p.y=H; if(p.y>H) p.y=0;

    // repel from cursor
    const dx = p.x - cursorX, dy = p.y - cursorY;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const radius = 140;
    let alpha = p.baseA;
    if(dist < radius){
      const force = (radius-dist)/radius;
      p.x += (dx/dist) * force * 2.2;
      p.y += (dy/dist) * force * 2.2;
      alpha = Math.min(1, p.baseA + force*0.6);
    }

    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = `rgba(255,43,43,${alpha})`;
    ctx.fill();
  });

  // connect nearby particles faintly
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const a=particles[i], b=particles[j];
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      if(d < 90){
        ctx.strokeStyle = `rgba(255,43,43,${0.08*(1-d/90)})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(drawBg);
}
requestAnimationFrame(drawBg);

/* pause heavy animation when tab hidden */
document.addEventListener('visibilitychange', ()=>{
  // particles + parallax loops are cheap; left running. Could gate via document.hidden if needed.
});

/* respect reduced motion */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.querySelectorAll('.reveal,.reveal-stagger').forEach(el=>el.classList.add('in'));
}
 
/* live Cairo clock */
function tickClock(){
  const el = document.getElementById('clock');
  const fmt = new Intl.DateTimeFormat('en-GB', {hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Africa/Cairo'});
  el.textContent = fmt.format(new Date());
}
tickClock();
setInterval(tickClock, 1000*10);