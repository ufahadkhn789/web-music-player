const STORAGE_KEY = 'simple_music_player_playlist_v1';

let songs = [
  {
    id: 1,
    title: 'SoundHelix Song 1',
    artist: 'SoundHelix',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    category: 'Ambient'
  },
  {
    id: 2,
    title: 'SoundHelix Song 2',
    artist: 'SoundHelix',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    category: 'Electronic'
  },
  {
    id: 3,
    title: 'SoundHelix Song 3',
    artist: 'SoundHelix',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    category: 'Acoustic'
  }
];

// Load persisted remote playlist (not local uploaded files)
try{
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    if (Array.isArray(saved)) {
      // Append saved remote items if not duplicating by src
      saved.forEach(s => { if (!songs.find(x=>x.src===s.src)) songs.push(s); });
    }
  }
}catch(e){ console.warn('Could not load saved playlist', e); }

// State
let currentIndex = 0;
let filtered = [...songs];
let shuffleMode = false;
let repeatMode = 'off'; // 'off' | 'one' | 'all'

// Elements
const audio = document.getElementById('audio');
const playlistEl = document.getElementById('playlist');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('categoryFilter');
const fileUpload = document.getElementById('fileUpload');
const loadSamplesBtn = document.getElementById('loadSamples');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const volumeEl = document.getElementById('volume');
const progressEl = document.getElementById('progress');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

function formatTime(s){
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s/60); const sec = Math.floor(s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}

function buildCategoryOptions(){
  const cats = Array.from(new Set(songs.map(s=>s.category)));
  cats.forEach(c=>{
    const opt = document.createElement('option'); opt.value = c; opt.textContent = c; categoryFilter.appendChild(opt);
  });
}

function renderPlaylist(){
  playlistEl.innerHTML = '';
  filtered.forEach((s, i)=>{
    const li = document.createElement('li');
    li.dataset.index = i;
    const durationText = s.duration ? formatTime(s.duration) : '';
    const tag = s.local ? '<span class="muted">(local)</span>' : '';
    li.innerHTML = `<div><strong>${s.title}</strong> ${tag}<div class="muted">${s.artist} • ${s.category}</div></div><div class="muted">${durationText}</div>`;
    if (i === currentIndex) li.classList.add('active');
    li.addEventListener('click', ()=>{ playFromIndex(i); });
    playlistEl.appendChild(li);
  });
}

function loadTrack(index){
  const track = filtered[index];
  if (!track) return;
  audio.src = track.src;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
}

function playFromIndex(index){
  currentIndex = index;
  loadTrack(currentIndex);
  audio.play();
  updatePlayButton();
  renderPlaylist();
}

function pickNextIndex(){
  if (shuffleMode) {
    if (filtered.length <= 1) return currentIndex;
    let idx = currentIndex;
    while (idx === currentIndex) idx = Math.floor(Math.random() * filtered.length);
    return idx;
  }
  return (currentIndex + 1) % filtered.length;
}

function updatePlayButton(){
  playBtn.textContent = audio.paused ? 'Play' : 'Pause';
}

// Controls
playBtn.addEventListener('click', ()=>{
  if (audio.src === '') loadTrack(currentIndex);
  if (audio.paused) audio.play(); else audio.pause();
});

prevBtn.addEventListener('click', ()=>{
  currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
  playFromIndex(currentIndex);
});

nextBtn.addEventListener('click', ()=>{
  currentIndex = pickNextIndex();
  playFromIndex(currentIndex);
});

volumeEl.addEventListener('input', ()=>{ audio.volume = volumeEl.value; });

audio.addEventListener('play', updatePlayButton);
audio.addEventListener('pause', updatePlayButton);

audio.addEventListener('timeupdate', ()=>{
  if (audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressEl.value = pct;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
});

progressEl.addEventListener('input', ()=>{
  if (!audio.duration) return;
  const pct = progressEl.value / 100;
  audio.currentTime = pct * audio.duration;
});

audio.addEventListener('ended', ()=>{
  if (repeatMode === 'one') {
    audio.currentTime = 0; audio.play();
    return;
  }
  if (repeatMode === 'off' && !shuffleMode) {
    // If at end and repeat off, stop when last track ends
    if (currentIndex === filtered.length -1) { audio.pause(); return; }
  }
  nextBtn.click();
});

// Search & filter
searchInput.addEventListener('input', ()=>{
  applyFilters();
});

categoryFilter.addEventListener('change', ()=>{
  applyFilters();
});

// File upload handling (local files)
fileUpload.addEventListener('change', (e)=>{
  const files = Array.from(e.target.files || []);
  files.forEach(f=>{
    const url = URL.createObjectURL(f);
    songs.push({ id: Date.now()+Math.random(), title: f.name.replace(/\.[^/.]+$/, ''), artist: 'Local', src: url, category: 'Local', local: true });
  });
  applyFilters();
  // Note: local files are session-only (object URLs cannot be persisted)
});

// Load more sample remote tracks
loadSamplesBtn.addEventListener('click', ()=>{
  const more = [
    { id: Date.now()+1, title:'SoundHelix Song 4', artist:'SoundHelix', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', category:'Instrumental' },
    { id: Date.now()+2, title:'SoundHelix Song 5', artist:'SoundHelix', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', category:'Ambient' }
  ];
  more.forEach(m=>{ if (!songs.find(s=>s.src===m.src)) songs.push(m); });
  // Persist remote playlist
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(songs.filter(s=>!s.local).map(({id,title,artist,src,category})=>({id,title,artist,src,category})))); }catch(e){/*ignore*/}
  applyFilters();
});

// Shuffle & Repeat
shuffleBtn.addEventListener('click', ()=>{ shuffleMode = !shuffleMode; shuffleBtn.classList.toggle('active', shuffleMode); });
repeatBtn.addEventListener('click', ()=>{
  if (repeatMode === 'off') repeatMode = 'one';
  else if (repeatMode === 'one') repeatMode = 'all';
  else repeatMode = 'off';
  repeatBtn.textContent = `Repeat: ${repeatMode}`;
  repeatBtn.classList.toggle('active', repeatMode !== 'off');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e)=>{
  if (e.target && (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA')) return; // ignore when typing
  if (e.code === 'Space') { e.preventDefault(); if (audio.paused) audio.play(); else audio.pause(); }
  if (e.code === 'ArrowRight') { nextBtn.click(); }
  if (e.code === 'ArrowLeft') { prevBtn.click(); }
  if (e.code === 'ArrowUp') { e.preventDefault(); audio.volume = Math.min(1, audio.volume + 0.05); volumeEl.value = audio.volume; }
  if (e.code === 'ArrowDown') { e.preventDefault(); audio.volume = Math.max(0, audio.volume - 0.05); volumeEl.value = audio.volume; }
});

function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  filtered = songs.filter(s=>{
    const matchesQ = q === '' || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
    const matchesCat = cat === 'all' || s.category === cat;
    return matchesQ && matchesCat;
  });
  currentIndex = 0;
  loadTrack(currentIndex);
  renderPlaylist();
}

// Preload metadata to show durations (best-effort)
function preloadDurations(){
  songs.forEach((s, i)=>{
    const a = new Audio();
    a.src = s.src;
    a.preload = 'metadata';
    a.addEventListener('loadedmetadata', ()=>{
      s.duration = a.duration;
      // If filtered list contains this index, update UI
      renderPlaylist();
    });
  });
}

// Init
buildCategoryOptions();
applyFilters();
preloadDurations();
audio.volume = parseFloat(volumeEl.value);
