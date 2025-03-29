const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
|| window.innerWidth < 768;

// Canvas setup
const c = document.getElementById('c');
let w, h, hw, hh, ctx;
let lastTime = 0;
const mobileFrameRate = isMobile ? 30 : 60;

// Animation options with mobile optimizations
const baseOpts = {
strings: ["EID", "MUBARAK!", "", "", "SHOUQ ALKANHAL"],
charSize: isMobile ? 20 : 30,
charSpacing: isMobile ? 25 : 35,
lineHeight: isMobile ? 30 : 40,
fireworkPrevPoints: isMobile ? 5 : 10,
fireworkBaseLineWidth: isMobile ? 3 : 5,
fireworkAddedLineWidth: isMobile ? 5 : 8,
fireworkCircleBaseSize: isMobile ? 15 : 20,
fireworkCircleAddedSize: 10,
fireworkSpawnTime: isMobile ? 150 : 200,
fireworkBaseReachTime: isMobile ? 20 : 30,
fireworkAddedReachTime: 30,
fireworkCircleBaseTime: 30,
fireworkCircleAddedTime: 30,
fireworkCircleFadeBaseTime: 10,
fireworkCircleFadeAddedTime: 5,
fireworkBaseShards: isMobile ? 3 : 5,
fireworkAddedShards: isMobile ? 2 : 5,
fireworkShardPrevPoints: 3,
fireworkShardBaseVel: 4,
fireworkShardAddedVel: 2,
fireworkShardBaseSize: 3,
fireworkShardAddedSize: 3,
gravity: 0.1,
upFlow: -0.1,
letterContemplatingWaitTime: isMobile ? 240 : 360,
balloonSpawnTime: 20,
balloonBaseInflateTime: 10,
balloonAddedInflateTime: 10,
balloonBaseSize: 20,
balloonAddedSize: 20,
balloonBaseVel: 0.4,
balloonAddedVel: 0.4,
balloonBaseRadian: -(Math.PI / 2 - 0.5),
balloonAddedRadian: -1
};

let opts, calc, Tau, TauQuarter, letters;

function initCanvas() {
w = c.width = window.innerWidth;
h = c.height = window.innerHeight;
hw = w / 2;
hh = h / 2;
ctx = c.getContext("2d");

opts = {...baseOpts};
opts.cx = w / 2;
opts.cy = h / 2;

calc = {
totalWidth: opts.charSpacing * Math.max(...opts.strings.map(s => s.length))
};

Tau = Math.PI * 2;
TauQuarter = Tau / 4;

ctx.font = opts.charSize + "px Verdana";

initLetters();
}

function initLetters() {
letters = [];
for (let i = 0; i < opts.strings.length; ++i) {
for (let j = 0; j < opts.strings[i].length; ++j) {
letters.push(
  new Letter(
      opts.strings[i][j],
      j * opts.charSpacing + opts.charSpacing / 2 - 
      (opts.strings[i].length * opts.charSize) / 2,
      i * opts.lineHeight + opts.lineHeight / 2 - 
      (opts.strings.length * opts.lineHeight) / 2
  )
);
}
}
}

function Letter(char, x, y) {
this.char = char;
this.x = x;
this.y = y;
this.dx = -ctx.measureText(char).width / 2;
this.dy = +opts.charSize / 2;
this.fireworkDy = this.y - hh;

const hue = (x / calc.totalWidth) * 360;
this.color = `hsl(${hue},80%,50%)`;
this.lightAlphaColor = `hsla(${hue},80%,light%,alp)`;
this.lightColor = `hsl(${hue},80%,light%)`;
this.alphaColor = `hsla(${hue},80%,50%,alp)`;

this.reset();
}

Letter.prototype.reset = function() {
this.phase = "firework";
this.tick = 0;
this.spawned = false;
this.spawningTime = (opts.fireworkSpawnTime * Math.random()) | 0;
this.reachTime = (opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random()) | 0;
this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
this.prevPoints = [[0, hh, 0]];
};

// Optimized step function
Letter.prototype.step = function() {
if (isMobile && this.phase === "firework" && this.prevPoints.length > 3) {
this.prevPoints.shift();
}

if (this.phase === "firework") {
if (!this.spawned) {
if (++this.tick >= this.spawningTime) {
  this.tick = 0;
  this.spawned = true;
}
} else {
this.tick++;
const linearProportion = this.tick / this.reachTime;
const armonicProportion = Math.sin(linearProportion * TauQuarter);
const x = linearProportion * this.x;
const y = hh + armonicProportion * this.fireworkDy;

if (this.prevPoints.length > opts.fireworkPrevPoints) {
  this.prevPoints.shift();
}

this.prevPoints.push([x, y, linearProportion * this.lineWidth]);

for (let i = 1; i < this.prevPoints.length; i++) {
  const point = this.prevPoints[i];
  const point2 = this.prevPoints[i-1];
  
  ctx.strokeStyle = this.alphaColor.replace("alp", i/this.prevPoints.length);
  ctx.lineWidth = point[2] * (1/(this.prevPoints.length-1)) * i;
  ctx.beginPath();
  ctx.moveTo(point[0], point[1]);
  ctx.lineTo(point2[0], point2[1]);
  ctx.stroke();
}

if (this.tick >= this.reachTime) {
  this.phase = "contemplate";
  this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
  this.circleCompleteTime = (opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random()) | 0;
  this.circleCreating = true;
  this.circleFading = false;
  this.circleFadeTime = (opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random()) | 0;
  this.tick = this.tick2 = 0;
  
  this.shards = [];
  const shardCount = (opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random()) | 0;
  const angle = Tau / shardCount;
  let x = 1, y = 0;
  
  for (let i = 0; i < shardCount; i++) {
      const x1 = x;
      x = x * Math.cos(angle) - y * Math.sin(angle);
      y = y * Math.cos(angle) + x1 * Math.sin(angle);
      this.shards.push(new Shard(this.x, this.y, x, y, this.alphaColor));
  }
}
}
} 
// ... include other phase handling (contemplate, balloon) ...
// (Keep your existing code for other phases, just optimize drawing calls)
};

function Shard(x, y, vx, vy, color) {
const vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
this.vx = vx * vel;
this.vy = vy * vel;
this.x = x;
this.y = y;
this.prevPoints = [[x, y]];
this.color = color;
this.alive = true;
this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
}

Shard.prototype.step = function() {
this.x += this.vx;
this.y += this.vy += opts.gravity;

if (this.prevPoints.length > opts.fireworkShardPrevPoints) {
this.prevPoints.shift();
}

this.prevPoints.push([this.x, this.y]);

for (let k = 0; k < this.prevPoints.length - 1; k++) {
const point = this.prevPoints[k];
const point2 = this.prevPoints[k+1];

ctx.strokeStyle = this.color.replace("alp", k/this.prevPoints.length);
ctx.lineWidth = k * (this.size/this.prevPoints.length);
ctx.beginPath();
ctx.moveTo(point[0], point[1]);
ctx.lineTo(point2[0], point2[1]);
ctx.stroke();
}

if (this.prevPoints[0][1] > hh) this.alive = false;
};

function anim(timestamp) {
if (isMobile && timestamp - lastTime < 1000/mobileFrameRate) {
window.requestAnimationFrame(anim);
return;
}
lastTime = timestamp;

// Optimized clear
ctx.clearRect(0, 0, w, h);

ctx.translate(hw, hh);

let done = true;
for (let l = 0; l < letters.length; l++) {
letters[l].step();
if (letters[l].phase !== "done") done = false;
}

ctx.translate(-hw, -hh);

if (done) {
for (let l = 0; l < letters.length; l++) {
letters[l].reset();
}
}

window.requestAnimationFrame(anim);
}

// Initialize
initCanvas();

// Start animation
anim(0);

// Handle resize with debounce
let resizeTimeout;
window.addEventListener("resize", () => {
clearTimeout(resizeTimeout);
resizeTimeout = setTimeout(() => {
initCanvas();
if (isMobile) letters.forEach(l => l.reset());
}, 200);
});

// Prevent touch events
document.addEventListener('touchstart', (e) => {
if (e.target === c) e.preventDefault();
}, { passive: false });