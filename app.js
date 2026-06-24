// Simple eFootball League Creator
const state = {
  teams: JSON.parse(localStorage.getItem('teams')||'[]'),
  cups: JSON.parse(localStorage.getItem('cups')||'[]'),
  matches: JSON.parse(localStorage.getItem('matches')||'[]'),
  pendingTeams: JSON.parse(localStorage.getItem('pendingTeams')||'[]')
  ,messages: JSON.parse(localStorage.getItem('messages')||'[]')
}

function save(){
  localStorage.setItem('teams', JSON.stringify(state.teams))
  localStorage.setItem('cups', JSON.stringify(state.cups))
  localStorage.setItem('matches', JSON.stringify(state.matches))
  localStorage.setItem('pendingTeams', JSON.stringify(state.pendingTeams||[]))
  localStorage.setItem('messages', JSON.stringify(state.messages||[]))
  localStorage.setItem('guests', JSON.stringify(state.guests||[]))
  // notify other tabs/windows that state changed
  try{ localStorage.setItem('lastUpdate', String(Date.now())) }catch(e){}
}

// --- Optional realtime via Firebase Realtime Database ---
let realtimeEnabled = false
let firebaseRef = null
function initRealtimeIfConfigured(){
  try{
    if(window && window.FIREBASE_CONFIG && typeof firebase !== 'undefined'){
      try{ firebase.initializeApp(window.FIREBASE_CONFIG); console.log('Firebase initialized') }catch(e){ console.warn('Firebase init exception', e) }
      const db = firebase.database()
      firebaseRef = db.ref('efootball-state')
      realtimeEnabled = true
      if(typeof realtimeStatus !== 'undefined' && realtimeStatus) realtimeStatus.textContent = 'Realtime: on'
      // initial push of local state to DB if empty
      firebaseRef.once('value').then(snap=>{
        const val = snap.val()
        if(!val){
          firebaseRef.set({ teams: state.teams, cups: state.cups, matches: state.matches, guests: state.guests, pendingTeams: state.pendingTeams||[], messages: state.messages||[], lastUpdate: Date.now() })
        }
      }).catch(()=>{})
      // listen for remote changes and apply them
      firebaseRef.on('value', snap=>{
        const val = snap.val()
        if(!val) return
        // avoid applying if our lastUpdate matches
        const remoteLU = String(val.lastUpdate || '')
        const localLU = localStorage.getItem('lastUpdate') || ''
        if(remoteLU && remoteLU === localLU) return
        state.teams = val.teams || []
        state.cups = val.cups || []
        state.matches = val.matches || []
        state.guests = val.guests || []
        state.pendingTeams = val.pendingTeams || []
        state.messages = val.messages || []
        state.announcement = val.announcement || ''
        // persist locally and re-render
        localStorage.setItem('teams', JSON.stringify(state.teams))
        localStorage.setItem('cups', JSON.stringify(state.cups))
        localStorage.setItem('matches', JSON.stringify(state.matches))
        localStorage.setItem('guests', JSON.stringify(state.guests||[]))
        localStorage.setItem('pendingTeams', JSON.stringify(state.pendingTeams||[]))
        localStorage.setItem('messages', JSON.stringify(state.messages||[]))
        localStorage.setItem('announcement', state.announcement || '')
        localStorage.setItem('lastUpdate', String(val.lastUpdate || Date.now()))
        updateAdminUI()
        renderAll()
      })
    } else {
      if(typeof realtimeStatus !== 'undefined' && realtimeStatus) realtimeStatus.textContent = 'Realtime: off'
      console.log('Realtime not configured (no FIREBASE_CONFIG or firebase SDK)')
    }
  }catch(e){ console.warn('Realtime init failed', e) }
}

// If realtime is enabled, push state to firebase when saving
const originalSave = save
save = function(){
  originalSave()
  if(realtimeEnabled && firebaseRef){
    try{
      firebaseRef.set({ teams: state.teams, cups: state.cups, matches: state.matches, guests: state.guests, pendingTeams: state.pendingTeams||[], messages: state.messages||[], announcement: state.announcement||'', lastUpdate: Date.now() })
    }catch(e){ console.warn('Failed to push to firebase', e) }
  }
}

// DOM
// Simplified DOM handles for SPA
const userNameDisplay = document.getElementById('userName')
const liveAnnouncement = document.getElementById('liveAnnouncement')
// Home cards
const totalPlayersEl = document.getElementById('totalPlayers')
const totalMatchesEl = document.getElementById('totalMatches')
const activeTournamentsEl = document.getElementById('activeTournaments')
const createTournamentBtn = document.getElementById('createTournamentBtn')
// Register view
const playerNameInput = document.getElementById('playerName')
const playerFcInput = document.getElementById('playerFc')
const playerClubInput = document.getElementById('playerClub')
const joinBtn = document.getElementById('joinBtn')
const playersTable = document.querySelector('#playersTable tbody')
// Chat view
const chatWindow = document.getElementById('chatWindow')
const chatUser = document.getElementById('chatUser')
const chatMsg = document.getElementById('chatMsg')
const chatSend = document.getElementById('chatSend')
// League table
const leagueTableBody = document.querySelector('#leagueTable tbody')
// Fixtures
const fixturesList = document.getElementById('fixturesList')
// Cup
const cupBracket = document.getElementById('cupBracket')

// Team registration elements
const regTeamFc = document.getElementById('regTeamFc')
const regTeamName = document.getElementById('regTeamName')
const registerTeamBtn = document.getElementById('registerTeamBtn')
// Auth elements (real-world login)
const loginEmail = document.getElementById('loginEmail')
const loginPassword = document.getElementById('loginPassword')
const loginUser = document.getElementById('loginUser')
const registerUser = document.getElementById('registerUser')
const logoutBtn = document.getElementById('logoutBtn')
const pendingTeamsList = document.getElementById('pendingTeamsList')
// Chat elements
const chatSidebar = document.getElementById('chatSidebar')
const chatMessages = document.getElementById('chatMessages')
const chatInput = document.getElementById('chatInput')
      // initialize Firebase Auth if available
      try{
        if(firebase && firebase.auth){
          const auth = firebase.auth()
          auth.onAuthStateChanged(user=>{
            if(user){
              currentUser = user.email || user.displayName || 'User'
              localStorage.setItem('currentUser', currentUser)
              // show logout button
              if(logoutBtn) logoutBtn.style.display = ''
              if(loginUser) loginUser.style.display = 'none'
              if(registerUser) registerUser.style.display = 'none'
            } else {
              currentUser = null
              localStorage.removeItem('currentUser')
              if(logoutBtn) logoutBtn.style.display = 'none'
              if(loginUser) loginUser.style.display = ''
              if(registerUser) registerUser.style.display = ''
            }
            updateAdminUI()
          })
        }
      }catch(e){console.warn('Auth init failed', e)}
const sendChat = document.getElementById('sendChat')
const homeBtn = document.getElementById('homeBtn')
const chatBtn = document.getElementById('chatBtn')
const sidebarNav = document.getElementById('sidebarNav')

// view buttons (routing)
const navButtons = document.querySelectorAll('[data-view]')

function showView(name){
  const sections = ['homeSection','teamsSection','fixturesSection','tableSection','cupsSection','chatSidebar','adminSection']
  sections.forEach(s=>{ const el = document.getElementById(s); if(el) el.style.display = (s===name || (s==='chatSidebar' && name==='chat'))? 'block' : 'none' })
  // update active state
  navButtons.forEach(b=> b.classList.toggle('active', b.dataset.view===name))
}

navButtons.forEach(b=> b.addEventListener('click', ()=> showView(b.dataset.view)))

// initialize realtime if user provided config via firebase-config.js
initRealtimeIfConfigured()

// --- SPA rendering logic ---
function updateHomeCards(){
  totalPlayersEl.textContent = players.length
  totalMatchesEl.textContent = matches.length
  activeTournamentsEl.textContent = 1
}

function renderPlayers(){
  playersTable.innerHTML = ''
  players.forEach((p,i)=>{
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${i+1}</td><td>${p.name}</td><td>${p.fc}</td><td>${p.club}</td>`
    playersTable.appendChild(tr)
  })
}

function renderLeague(){
  // simple standings: count wins/losses/goals from matches
  const table = {}
  players.forEach(p=> table[p.name] = {name:p.name,pts:0,w:0,l:0,gf:0,ga:0})
  matches.forEach(m=>{
    if(m.scoreA==null || m.scoreB==null) return
    const a=table[m.teamA], b=table[m.teamB]
    if(!a||!b) return
    a.gf+=m.scoreA; a.ga+=m.scoreB; b.gf+=m.scoreB; b.ga+=m.scoreA
    if(m.scoreA>m.scoreB){ a.w++; a.pts+=3; b.l++ }
    else if(m.scoreA<m.scoreB){ b.w++; b.pts+=3; a.l++ }
  })
  const arr = Object.values(table).sort((x,y)=> y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) )
  leagueTableBody.innerHTML=''
  arr.forEach((r,i)=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${i+1}</td><td>${r.name}</td><td>${r.pts}</td><td>${r.w}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td>`; leagueTableBody.appendChild(tr) })
}

function renderFixtures(){
  fixturesList.innerHTML=''
  matches.forEach((m,idx)=>{
    const card=document.createElement('div'); card.className='card';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>${m.teamA}</strong><span>vs</span><strong>${m.teamB}</strong><span>${m.status||'upcoming'}</span></div><div style="margin-top:8px">Score: ${m.scoreA==null?'—':m.scoreA} - ${m.scoreB==null?'—':m.scoreB}</div>`
    if(isAdmin){ const btn=document.createElement('button'); btn.textContent='Enter Score'; btn.onclick=()=>{ const sa=prompt('Score for '+m.teamA); const sb=prompt('Score for '+m.teamB); m.scoreA = sa===''?null:parseInt(sa); m.scoreB = sb===''?null:parseInt(sb); save(); renderFixtures(); renderLeague(); updateHomeCards(); } card.appendChild(btn) }
    fixturesList.appendChild(card)
  })
}

function renderChatLocal(){
  chatWindow.innerHTML=''
  chatMessagesLocal.forEach(m=>{ const d=document.createElement('div'); d.className='chat-msg'; d.innerHTML=`<div class="who">${m.user} • ${new Date(m.ts).toLocaleTimeString()}</div><div class="txt">${m.text}</div>`; chatWindow.appendChild(d) })
  chatWindow.scrollTop = chatWindow.scrollHeight
}

// handlers
joinBtn.onclick = ()=>{ const name=playerNameInput.value.trim(); const fc=playerFcInput.value.trim(); const club=playerClubInput.value.trim(); if(!name) return alert('Name required'); players.push({name,fc,club}); localStorage.setItem('players', JSON.stringify(players)); playerNameInput.value=''; playerFcInput.value=''; playerClubInput.value=''; renderPlayers(); updateHomeCards(); }
chatSend.onclick = ()=>{ const u = chatUser.value.trim()||'Anon'; const t = chatMsg.value.trim(); if(!t) return; chatMessagesLocal.push({user:u,text:t,ts:Date.now()}); localStorage.setItem('chat_local', JSON.stringify(chatMessagesLocal)); chatMsg.value=''; renderChatLocal(); }
createTournamentBtn.onclick = ()=>{ alert('Tournament created (demo)'); activeTournamentsEl.textContent = parseInt(activeTournamentsEl.textContent||'0')+1 }

// initial render
updateHomeCards(); renderPlayers(); renderLeague(); renderFixtures(); renderChatLocal();

// simple view switching
document.querySelectorAll('.nav .nav-btn').forEach(b=> b.addEventListener('click', ()=>{ document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); const v=document.getElementById(b.dataset.view); if(v) v.classList.add('active'); document.querySelectorAll('.nav .nav-btn').forEach(n=>n.classList.remove('active')); b.classList.add('active') }))

// Persisted state
let isAdmin = localStorage.getItem('isAdmin') === 'true'
let currentUser = localStorage.getItem('currentUser') || null
// Admin password (persisted). Set to provided value.
let ADMIN_PASSWORD = localStorage.getItem('adminPassword') || 'syntaxking123#'
localStorage.setItem('adminPassword', ADMIN_PASSWORD)
state.guests = JSON.parse(localStorage.getItem('guests')||'[]')
state.announcement = localStorage.getItem('announcement') || ''

// Frontend-only data stores (local arrays)
let players = JSON.parse(localStorage.getItem('players')||'[]')
let matches = JSON.parse(localStorage.getItem('app_matches')||'[]')
let chatMessagesLocal = JSON.parse(localStorage.getItem('chat_local')||'[]')

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
  // hide modification controls for non-admins (they can still view content)
  teamName.style.display = writable ? '' : 'none'
  addTeamBtn.style.display = writable ? '' : 'none'
  cupName.style.display = writable ? '' : 'none'
  addCupBtn.style.display = writable ? '' : 'none'
  startLeagueBtn.style.display = writable ? '' : 'none'
  resetBtn.style.display = writable ? '' : 'none'
  // announcement controls visibility
  if(announcementInput) announcementInput.style.display = writable ? '' : 'none'
  if(postAnnouncementBtn) postAnnouncementBtn.style.display = writable ? '' : 'none'
  // render announcement for all viewers
  renderAnnouncement()
  // Show/hide gated content depending on registration
  const mainContent = document.getElementById('mainContent')
  const mustRegister = document.getElementById('mustRegister')
  if(mainContent) mainContent.style.display = currentUser ? 'block' : 'none'
  if(mustRegister) mustRegister.style.display = currentUser ? 'none' : 'block'
  // registration form visibility for users
  if(regTeamFc) regTeamFc.style.display = currentUser ? '' : ''
  if(regTeamName) regTeamName.style.display = currentUser ? '' : ''
  if(registerTeamBtn) registerTeamBtn.style.display = currentUser ? '' : ''
  // show admin section only to admins
  const adminSection = document.getElementById('adminSection')
  if(adminSection) adminSection.style.display = isAdmin ? 'block' : 'none'
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

// Announcement posting (admin only)
if(postAnnouncementBtn){
  postAnnouncementBtn.onclick = ()=>{
    if(!isAdmin){ alert('Only admin can post announcements'); return }
    const msg = (announcementInput.value||'').trim()
    state.announcement = msg
    save()
    renderAnnouncement()
    if(announcementInput) announcementInput.value=''
  }
}

function renderAnnouncement(){
  if(!liveBanner) return
  const msg = state.announcement || localStorage.getItem('announcement') || ''
  if(msg){ liveBanner.textContent = msg; liveBanner.style.display = 'block' }
  else liveBanner.style.display = 'none'
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
  // allow pressing Enter in either score input to save (admin only)
  const enterSave = (e)=>{ if(e.key === 'Enter'){ saveBtn.click(); }}
  inA.addEventListener('keydown', enterSave)
  inB.addEventListener('keydown', enterSave)
  div.appendChild(label); div.appendChild(inA); div.appendChild(document.createTextNode(' - ')); div.appendChild(inB); div.appendChild(saveBtn);
  if(!isAdmin){ inA.disabled=true; inB.disabled=true; saveBtn.disabled=true; saveBtn.style.display = 'none' }
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

function renderAll(){ renderTeams(); renderCups(); renderMatches(); renderStandings(); renderGuests(); renderPendingTeams(); renderChat(); }
function renderPendingTeams(){
  if(!pendingTeamsList) return
  pendingTeamsList.innerHTML = ''
  state.pendingTeams = state.pendingTeams || []
  state.pendingTeams.forEach(pt=>{
    const li = document.createElement('li')
    li.textContent = `${pt.fc} — ${pt.name} (requested by ${pt.requestedBy || 'Unknown'})`
    const approve = document.createElement('button'); approve.textContent='Approve'; approve.className='secondary'
    approve.onclick = ()=>{
      if(!isAdmin){ alert('Only admin can approve teams'); return }
      // add to teams
      state.teams.push({ id: Date.now()+Math.random(), name: pt.name })
      // remove from pending
      state.pendingTeams = state.pendingTeams.filter(x=>x.id!==pt.id)
      save(); renderAll(); renderPendingTeams();
    }
    const reject = document.createElement('button'); reject.textContent='Reject'; reject.className='secondary'
    reject.onclick = ()=>{
      if(!isAdmin){ alert('Only admin can reject registrations'); return }
      state.pendingTeams = state.pendingTeams.filter(x=>x.id!==pt.id)
      save(); renderPendingTeams();
    }
    if(isAdmin){ li.appendChild(approve); li.appendChild(reject) }
    pendingTeamsList.appendChild(li)
  })
}

function renderChat(){
  if(!chatMessages) return
  chatMessages.innerHTML = ''
  state.messages = state.messages || []
  state.messages.slice(-200).forEach(m=>{
    const d = document.createElement('div')
    d.style.padding='6px'; d.style.borderBottom='1px solid rgba(255,255,255,0.04)'
    const who = document.createElement('div'); who.style.fontSize='12px'; who.style.opacity='0.8'; who.textContent = `${m.from} • ${new Date(m.ts).toLocaleString()}`
    const txt = document.createElement('div'); txt.style.marginTop='4px'; txt.textContent = m.text
    d.appendChild(who); d.appendChild(txt)
    chatMessages.appendChild(d)
  })
  chatMessages.scrollTop = chatMessages.scrollHeight
}

if(sendChat){
  sendChat.onclick = ()=>{
    if(!currentUser){ alert('Please register/login to send messages'); return }
    const text = (chatInput.value||'').trim()
    if(!text) return
    const msg = { id: Date.now()+Math.random(), from: currentUser, text, ts: Date.now() }
    state.messages = state.messages || []
    state.messages.push(msg)
    save(); renderChat(); chatInput.value=''
  }
  chatInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') sendChat.click() })
}

// Authentication handlers (Firebase if configured, else local fallback)
if(registerUser){
  registerUser.onclick = async ()=>{
    const email = (loginEmail.value||'').trim(); const pw = (loginPassword.value||'').trim()
    if(!email || !pw){ alert('Enter email and password to register'); return }
    if(window && window.FIREBASE_CONFIG && typeof firebase !== 'undefined' && firebase.auth){
      try{ await firebase.auth().createUserWithEmailAndPassword(email,pw); alert('Registered and logged in') }catch(e){ alert('Register failed: '+e.message) }
    } else {
      // local fallback users
      const users = JSON.parse(localStorage.getItem('users')||'[]')
      if(users.find(u=>u.email===email)){ alert('User exists'); return }
      users.push({email,password:pw}); localStorage.setItem('users', JSON.stringify(users)); currentUser = email; localStorage.setItem('currentUser', currentUser); updateAdminUI(); alert('Registered locally and logged in')
    }
  }
}
if(loginUser){
  loginUser.onclick = async ()=>{
    const email = (loginEmail.value||'').trim(); const pw = (loginPassword.value||'').trim()
    if(!email || !pw){ alert('Enter email and password to login'); return }
    if(window && window.FIREBASE_CONFIG && typeof firebase !== 'undefined' && firebase.auth){
      try{ await firebase.auth().signInWithEmailAndPassword(email,pw); alert('Logged in') }catch(e){ alert('Login failed: '+e.message) }
    } else {
      const users = JSON.parse(localStorage.getItem('users')||'[]')
      const u = users.find(u=>u.email===email && u.password===pw)
      if(!u){ alert('Invalid credentials'); return }
      currentUser = email; localStorage.setItem('currentUser', currentUser); updateAdminUI(); alert('Logged in locally')
    }
  }
}
if(logoutBtn){
  logoutBtn.onclick = async ()=>{
    if(window && window.FIREBASE_CONFIG && typeof firebase !== 'undefined' && firebase.auth){
      try{ await firebase.auth().signOut(); alert('Signed out') }catch(e){ alert('Sign out failed: '+e.message) }
    } else {
      currentUser=null; localStorage.removeItem('currentUser'); updateAdminUI(); alert('Signed out')
    }
  }
}

// top nav handlers: scroll to main or chat
if(homeBtn){
  homeBtn.onclick = ()=>{
    const main = document.getElementById('mainContent')
    if(main) main.scrollIntoView({behavior:'smooth'})
    if(chatSidebar) chatSidebar.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)'
  }
}
if(chatBtn){
  chatBtn.onclick = ()=>{
    if(chatSidebar){ chatSidebar.scrollIntoView({behavior:'smooth'}); if(chatInput) chatInput.focus(); }
  }
}

// handle user team registration
if(registerTeamBtn){
  registerTeamBtn.onclick = ()=>{
    if(!currentUser){ alert('Please register/login before submitting a team'); return }
    const fc = (regTeamFc.value||'').trim()
    const name = (regTeamName.value||'').trim()
    if(!fc || !name){ alert('Please enter both Team FC and Club name'); return }
    const pending = { id: Date.now()+Math.random(), fc, name, requestedBy: currentUser, requestedAt: new Date().toISOString() }
    state.pendingTeams = state.pendingTeams || []
    state.pendingTeams.push(pending)
    save(); renderPendingTeams()
    regTeamFc.value=''; regTeamName.value=''
    alert('Team registration submitted — awaiting admin approval')
  }
}
updateAdminUI();
renderAll();

// render announcement on start
renderAnnouncement();

// Keep track of last seen update to avoid unnecessary reloads
let lastSeenUpdate = localStorage.getItem('lastUpdate') || null

function reloadStateFromStorage(){
  state.teams = JSON.parse(localStorage.getItem('teams')||'[]')
  state.cups = JSON.parse(localStorage.getItem('cups')||'[]')
  state.matches = JSON.parse(localStorage.getItem('matches')||'[]')
  state.guests = JSON.parse(localStorage.getItem('guests')||'[]')
  state.pendingTeams = JSON.parse(localStorage.getItem('pendingTeams')||'[]')
  state.messages = JSON.parse(localStorage.getItem('messages')||'[]')
  state.announcement = localStorage.getItem('announcement') || ''
  isAdmin = localStorage.getItem('isAdmin') === 'true'
  currentUser = localStorage.getItem('currentUser') || null
  ADMIN_PASSWORD = localStorage.getItem('adminPassword') || ADMIN_PASSWORD
}

window.addEventListener('storage', (e)=>{
  if(!e.key) return
  const interesting = ['teams','cups','matches','guests','pendingTeams','messages','adminPassword','isAdmin','currentUser','announcement','lastUpdate']
  if(interesting.includes(e.key)){
    // reload and re-render
    reloadStateFromStorage()
    updateAdminUI()
    renderAll()
    lastSeenUpdate = localStorage.getItem('lastUpdate') || lastSeenUpdate
  }
})
// Fallback polling for environments where storage events may not reach (or remote updates):
setInterval(()=>{
  const lu = localStorage.getItem('lastUpdate') || null
  if(lu && lu !== lastSeenUpdate){
    lastSeenUpdate = lu
    reloadStateFromStorage()
  localStorage.setItem('announcement', state.announcement || '')
    updateAdminUI()
    renderAll()
  }
}, 3000)
