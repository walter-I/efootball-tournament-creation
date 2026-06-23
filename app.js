// Simple eFootball League Creator
const state = {
  teams: JSON.parse(localStorage.getItem('teams')||'[]'),
  cups: JSON.parse(localStorage.getItem('cups')||'[]'),
  matches: JSON.parse(localStorage.getItem('matches')||'[]')
}

function save(){
  localStorage.setItem('teams', JSON.stringify(state.teams))
  localStorage.setItem('cups', JSON.stringify(state.cups))
  localStorage.setItem('matches', JSON.stringify(state.matches))
}

// DOM
const teamName = document.getElementById('teamName')
const addTeamBtn = document.getElementById('addTeam')
const teamsList = document.getElementById('teamsList')
const cupName = document.getElementById('cupName')
const addCupBtn = document.getElementById('addCup')
const cupsList = document.getElementById('cupsList')
const startLeagueBtn = document.getElementById('startLeague')
const resetBtn = document.getElementById('reset')
const matchesDiv = document.getElementById('matches')
const standingsTable = document.querySelector('#standings tbody')
const adminBtn = document.getElementById('adminBtn')
const loginBtn = document.getElementById('loginBtn')
const roleName = document.getElementById('roleName')
const userNameDisplay = document.getElementById('userName')
const guestNameInput = document.getElementById('guestName')
const guestEmailInput = document.getElementById('guestEmail')
const registerGuestBtn = document.getElementById('registerGuest')
const guestsList = document.getElementById('guestsList')

// Persisted state
let isAdmin = localStorage.getItem('isAdmin') === 'true'
let currentUser = localStorage.getItem('currentUser') || null
// Admin password (persisted). Set to provided value.
let ADMIN_PASSWORD = localStorage.getItem('adminPassword') || 'syntaxking123#'
localStorage.setItem('adminPassword', ADMIN_PASSWORD)
state.guests = JSON.parse(localStorage.getItem('guests')||'[]')

function updateAdminUI(){
  roleName.textContent = isAdmin ? 'Admin' : (currentUser ? 'User' : 'Guest')
  adminBtn.textContent = isAdmin ? 'Logout Admin' : 'Admin Login'
  loginBtn.textContent = currentUser ? 'Logout' : 'Login'
  userNameDisplay.textContent = currentUser || 'Guest'
  const writable = !!isAdmin
  teamName.disabled = !writable
  addTeamBtn.disabled = !writable
  cupName.disabled = !writable
  addCupBtn.disabled = !writable
  startLeagueBtn.disabled = !writable
  resetBtn.disabled = !writable
  // Show/hide gated content depending on registration
  const mainContent = document.getElementById('mainContent')
  const mustRegister = document.getElementById('mustRegister')
  if(mainContent) mainContent.style.display = currentUser ? 'block' : 'none'
  if(mustRegister) mustRegister.style.display = currentUser ? 'none' : 'block'
}

adminBtn.onclick = ()=>{
  if(isAdmin){ isAdmin=false; localStorage.setItem('isAdmin','false'); currentUser=null; localStorage.removeItem('currentUser'); updateAdminUI(); return }
  const pass = prompt('Enter admin password:')
  if(pass===null) return
  if(pass === ADMIN_PASSWORD){ isAdmin=true; localStorage.setItem('isAdmin','true'); currentUser='Admin'; localStorage.setItem('currentUser',currentUser); updateAdminUI(); alert('Logged in as admin') }
  else alert('Incorrect password')
}

loginBtn.onclick = ()=>{
  if(currentUser){ // logout
    currentUser=null; localStorage.removeItem('currentUser'); isAdmin=false; localStorage.setItem('isAdmin','false'); updateAdminUI(); return
  }
  const name = prompt('Enter your name to login as user:')
  if(!name) return
  currentUser = name.trim()
  localStorage.setItem('currentUser', currentUser)
  isAdmin = false
  localStorage.setItem('isAdmin','false')
  updateAdminUI()
}

registerGuestBtn.onclick = ()=>{
  const name = guestNameInput.value.trim()
  const email = guestEmailInput.value.trim()
  if(!name){ alert('Please enter your name to register'); return }
  const guest = { id: Date.now()+Math.random(), name, email, registeredAt: new Date().toISOString() }
  state.guests.push(guest)
  localStorage.setItem('guests', JSON.stringify(state.guests))
  // set as current user
  currentUser = name
  localStorage.setItem('currentUser', currentUser)
  isAdmin = false
  localStorage.setItem('isAdmin','false')
  updateAdminUI()
  guestNameInput.value=''
  guestEmailInput.value=''
  renderGuests()
  alert('Thanks for registering — signed in as '+currentUser)
}

addTeamBtn.onclick = ()=>{ if(!isAdmin){ alert('Only admin can add teams'); return } const name=teamName.value.trim(); if(!name) return; state.teams.push({id:Date.now()+Math.random(),name}); teamName.value=''; renderTeams(); save(); }
addCupBtn.onclick = ()=>{ if(!isAdmin){ alert('Only admin can add cups'); return } const name=cupName.value.trim(); if(!name) return; state.cups.push({id:Date.now()+Math.random(),name,winner:null}); cupName.value=''; renderCups(); save(); }
resetBtn.onclick = ()=>{ if(!isAdmin){ alert('Only admin can reset data'); return } if(!confirm('Reset all data?')) return; state.teams=[]; state.cups=[]; state.matches=[]; save(); renderAll(); }

function renderTeams(){ teamsList.innerHTML=''; state.teams.forEach(t=>{
  const li=document.createElement('li'); li.textContent=t.name;
  const rm=document.createElement('button'); rm.textContent='✖'; rm.className='secondary'; rm.onclick=()=>{ if(!isAdmin){ alert('Only admin can remove teams'); return } state.teams=state.teams.filter(x=>x.id!==t.id); save(); renderAll(); }
  if(!isAdmin) rm.style.display='none'
  li.appendChild(rm); teamsList.appendChild(li);
}) }

function renderCups(){ cupsList.innerHTML=''; state.cups.forEach(c=>{
  const li=document.createElement('li');
  const span=document.createElement('span'); span.textContent=c.name+' ';
  const sel=document.createElement('select');
  const emptyOpt=document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='(no winner)'; sel.appendChild(emptyOpt);
  state.teams.forEach(t=>{ const o=document.createElement('option'); o.value=t.id; o.textContent=t.name; if(c.winner===t.id) o.selected=true; sel.appendChild(o); })
  sel.onchange=()=>{ if(!isAdmin){ alert('Only admin can set cup winners'); renderCups(); return } c.winner = sel.value||null; save(); renderCups(); }
  if(!isAdmin) sel.disabled = true
  const rm=document.createElement('button'); rm.textContent='✖'; rm.className='secondary'; rm.onclick=()=>{ state.cups=state.cups.filter(x=>x.id!==c.id); save(); renderCups(); }
  if(!isAdmin) rm.style.display='none'
  li.appendChild(span); li.appendChild(sel); li.appendChild(rm); cupsList.appendChild(li);
}) }

function renderGuests(){
  if(!guestsList) return
  guestsList.innerHTML=''
  state.guests.forEach(g=>{
    const li=document.createElement('li')
    const txt=document.createElement('div')
    txt.textContent = g.name + (g.email?(' — '+g.email):'')
    const rm=document.createElement('button')
    rm.textContent='✖'
    rm.className='secondary'
    rm.onclick = ()=>{ if(!isAdmin){ alert('Only admin can remove guests'); return } state.guests = state.guests.filter(x=>x.id!==g.id); localStorage.setItem('guests', JSON.stringify(state.guests)); renderGuests(); }
    if(!isAdmin) rm.style.display='none'
    li.appendChild(txt)
    li.appendChild(rm)
    guestsList.appendChild(li)
  })
}

function generateRoundRobin(teams){ const t = teams.map(x=>x.id); const n=t.length; let rounds=[]; if(n<2) return [];
  const arr = t.slice(); if(n%2===1) arr.push(null);
  const m = arr.length; for(let r=0;r<m-1;r++){ for(let i=0;i<m/2;i++){ const a=arr[i]; const b=arr[m-1-i]; if(a!==null && b!==null) rounds.push({home:a,away:b,played:false,scoreHome:null,scoreAway:null}); }
    // rotate
    arr.splice(1,0,arr.pop());
  }
  return rounds;
}

startLeagueBtn.onclick = ()=>{
  if(!isAdmin){ alert('Only admin can start the league'); return }
  if(state.teams.length<2){ alert('Add at least 2 teams'); return }
  state.matches = generateRoundRobin(state.teams)
  save(); renderAll();
}

function renderMatches(){ matchesDiv.innerHTML=''; state.matches.forEach((m,idx)=>{
  const a = state.teams.find(t=>t.id===m.home)
  const b = state.teams.find(t=>t.id===m.away)
  const div = document.createElement('div'); div.className='match'
  const label = document.createElement('div'); label.textContent=(a?.name||'')+' vs '+(b?.name||'')
  const inA=document.createElement('input'); inA.type='number'; inA.min=0; inA.value=(m.scoreHome===null?'':m.scoreHome)
  const inB=document.createElement('input'); inB.type='number'; inB.min=0; inB.value=(m.scoreAway===null?'':m.scoreAway)
  const saveBtn=document.createElement('button'); saveBtn.textContent='Save'
  saveBtn.onclick=()=>{ if(!isAdmin){ alert('Only admin can update match results'); return } const sh = inA.value===''?null:parseInt(inA.value); const sa = inB.value===''?null:parseInt(inB.value); m.scoreHome=sh; m.scoreAway=sa; m.played = (sh!==null && sa!==null); save(); renderAll(); }
  div.appendChild(label); div.appendChild(inA); div.appendChild(document.createTextNode(' - ')); div.appendChild(inB); div.appendChild(saveBtn);
  if(!isAdmin){ inA.disabled=true; inB.disabled=true; saveBtn.disabled=true }
  matchesDiv.appendChild(div);
}) }

function computeStandings(){ const table = {};
  state.teams.forEach(t=> table[t.id] = {id:t.id,name:t.name,mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  state.matches.forEach(m=>{ if(!m.played) return; const h=table[m.home]; const a=table[m.away]; const sh = m.scoreHome; const sa = m.scoreAway; if(!h||!a) return; h.mp++; a.mp++; h.gf+=sh; h.ga+=sa; a.gf+=sa; a.ga+=sh; if(sh>sa){ h.w++; a.l++; h.pts+=3 }else if(sh<sa){ a.w++; h.l++; a.pts+=3 }else{ h.d++; a.d++; h.pts+=1; a.pts+=1 } });
  const arr = Object.values(table)
  arr.forEach(x=> x.gd = x.gf - x.ga)
  arr.sort((a,b)=> b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name))
  return arr
}

function renderStandings(){ standingsTable.innerHTML=''; const s=computeStandings(); s.forEach((r,i)=>{
  const tr=document.createElement('tr'); tr.innerHTML=`<td>${i+1}</td><td>${r.name}</td><td>${r.mp}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd}</td><td>${r.pts}</td>`; standingsTable.appendChild(tr);
}) }

function renderAll(){ renderTeams(); renderCups(); renderMatches(); renderStandings(); renderGuests(); }
updateAdminUI();
renderAll();
