// Lightweight eFootball dashboard app
const state = {
  players: JSON.parse(localStorage.getItem('players') || '[]'),
  teams: JSON.parse(localStorage.getItem('teams') || '[]'),
  chat: JSON.parse(localStorage.getItem('chat') || '[]'),
  matches: JSON.parse(localStorage.getItem('matches') || '[]')
}

let currentUser = localStorage.getItem('currentUser') || 'Guest'
let isAdmin = localStorage.getItem('isAdmin') === 'true'
let firebaseDb = null

const els = {
  userName: document.getElementById('userName'),
  backendStatus: document.getElementById('backendStatus'),
  testBackendBtn: document.getElementById('testBackendBtn'),
  totalPlayers: document.getElementById('totalPlayers'),
  totalMatches: document.getElementById('totalMatches'),
  chatCount: document.getElementById('chatCount'),
  playerName: document.getElementById('playerName'),
  playerTeam: document.getElementById('playerTeam'),
  joinBtn: document.getElementById('joinBtn'),
  playersTable: document.querySelector('#playersTable tbody'),
  manageTeamsArea: document.getElementById('manageTeamsArea'),
  newTeam: document.getElementById('newTeam'),
  addTeamBtn: document.getElementById('addTeamBtn'),
  teamsList: document.getElementById('teamsList'),
  chatWindow: document.getElementById('chatWindow'),
  chatUser: document.getElementById('chatUser'),
  chatMsg: document.getElementById('chatMsg'),
  chatSend: document.getElementById('chatSend'),
  leagueTableBody: document.querySelector('#leagueTable tbody'),
  fixturesList: document.getElementById('fixturesList'),
  authModal: document.getElementById('authModal'),
  authUser: document.getElementById('authUser'),
  authPass: document.getElementById('authPass'),
  authRegister: document.getElementById('authRegister'),
  authLogin: document.getElementById('authLogin'),
  openAuthBtn: document.getElementById('openAuthBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  resetAdminBtn: document.getElementById('resetAdminBtn')
}

const navButtons = Array.from(document.querySelectorAll('.nav-btn'))
const views = Array.from(document.querySelectorAll('.view'))
const DEFAULT_TEAMS = [
  { id: 'team-1', name: 'Red Lions' },
  { id: 'team-2', name: 'Blue Eagles' }
]

function saveState() {
  localStorage.setItem('players', JSON.stringify(state.players))
  localStorage.setItem('teams', JSON.stringify(state.teams))
  localStorage.setItem('chat', JSON.stringify(state.chat))
  localStorage.setItem('matches', JSON.stringify(state.matches))
  localStorage.setItem('currentUser', currentUser)
  localStorage.setItem('isAdmin', String(isAdmin))
}

function setStatus(text) {
  if (els.backendStatus) els.backendStatus.textContent = 'Backend: ' + text
}

function initFirebase() {
  if (typeof window.FIREBASE_CONFIG === 'object' && typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(window.FIREBASE_CONFIG)
      firebaseDb = firebase.database()
      setStatus('Ready')
    } catch (err) {
      console.warn('Firebase init error', err)
      setStatus('Init failed')
    }
  } else {
    setStatus('Disabled')
  }
}

function testBackend() {
  if (!firebaseDb) { setStatus('No DB'); return }
  setStatus('Checking...')
  const ref = firebaseDb.ref('health/ping')
  const now = Date.now()
  ref.set({ ts: now })
    .then(() => ref.once('value'))
    .then(snap => {
      const data = snap.val()
      setStatus(data && data.ts ? 'OK (' + new Date(data.ts).toLocaleTimeString() + ')' : 'OK')
    })
    .catch(err => { console.warn(err); setStatus('Error') })
}

function updateHomeCards() {
  if (els.totalPlayers) els.totalPlayers.textContent = String(state.players.length)
  if (els.totalMatches) els.totalMatches.textContent = String(state.matches.length)
  if (els.chatCount) els.chatCount.textContent = String(state.chat.length)
}

function renderPlayers() {
  if (!els.playersTable) return
  els.playersTable.innerHTML = ''
  state.players.forEach((player, index) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `\n      <td>${index + 1}</td><td>${player.name}</td><td>${player.team || 'Unassigned'}</td><td><button data-index="${index}">Remove</button></td>`
    els.playersTable.appendChild(tr)
  })
  els.playersTable.querySelectorAll('button[data-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index)
      if (!Number.isNaN(idx)) {
        state.players.splice(idx, 1)
        saveState()
        renderAll()
      }
    })
  })
}

function renderTeams() {
  if (!els.teamsList || !els.playerTeam) return
  els.teamsList.innerHTML = ''
  els.playerTeam.innerHTML = ''
  const teams = state.teams.length ? state.teams : DEFAULT_TEAMS
  teams.forEach(team => {
    const opt = document.createElement('option')
    opt.value = team.id
    opt.textContent = team.name
    els.playerTeam.appendChild(opt)
    const div = document.createElement('div')
    div.textContent = team.name
    els.teamsList.appendChild(div)
  })
}

function renderChat() {
  if (!els.chatWindow) return
  els.chatWindow.innerHTML = ''
  state.chat.slice(-20).forEach(msg => {
    const item = document.createElement('div')
    item.className = 'chat-msg'
    item.innerHTML = `<div class="who">${msg.user} • ${new Date(msg.ts).toLocaleTimeString()}</div><div class="txt">${msg.text}</div>`
    els.chatWindow.appendChild(item)
  })
  els.chatWindow.scrollTop = els.chatWindow.scrollHeight
}

function renderLeague() {
  if (!els.leagueTableBody) return
  els.leagueTableBody.innerHTML = ''
  if (!state.matches.length) {
    const row = document.createElement('tr')
    row.innerHTML = '<td colspan="3">No league data yet</td>'
    els.leagueTableBody.appendChild(row)
    return
  }
  state.matches.forEach((match, idx) => {
    const row = document.createElement('tr')
    row.innerHTML = `<td>${idx + 1}</td><td>${match.name || 'Match ' + (idx + 1)}</td><td>${match.score || '-'}</td>`
    els.leagueTableBody.appendChild(row)
  })
}

function renderFixtures() {
  if (!els.fixturesList) return
  els.fixturesList.innerHTML = ''
  if (!state.matches.length) {
    const card = document.createElement('div')
    card.className = 'card'
    card.textContent = 'No fixtures yet.'
    els.fixturesList.appendChild(card)
    return
  }
  state.matches.forEach(match => {
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `<div><strong>${match.teamA || 'Team A'}</strong> vs <strong>${match.teamB || 'Team B'}</strong></div><div>Status: ${match.status || 'upcoming'}</div><div>Score: ${match.score || '—'}</div>`
    els.fixturesList.appendChild(card)
  })
}

function renderAll() {
  if (els.userName) els.userName.textContent = currentUser || 'Guest'
  updateHomeCards()
  renderPlayers()
  renderTeams()
  renderChat()
  renderLeague()
  renderFixtures()
  if (els.manageTeamsArea) els.manageTeamsArea.style.display = isAdmin ? 'block' : 'none'
  if (els.openAuthBtn) els.openAuthBtn.style.display = (currentUser && currentUser !== 'Guest') ? 'none' : ''
  if (els.logoutBtn) els.logoutBtn.style.display = (currentUser && currentUser !== 'Guest') ? '' : 'none'
}

function showView(id) {
  views.forEach(view => (view.style.display = view.id === id ? 'block' : 'none'))
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === id))
}

function bindEvents() {
  if (els.joinBtn) {
    els.joinBtn.addEventListener('click', () => {
      const name = els.playerName?.value.trim()
      const team = els.playerTeam?.value
      if (!name) { alert('Player name is required'); return }
      state.players.push({ name, team })
      if (els.playerName) els.playerName.value = ''
      saveState()
      renderAll()
    })
  }
  if (els.addTeamBtn) {
    els.addTeamBtn.addEventListener('click', () => {
      const name = els.newTeam?.value.trim()
      if (!name) { alert('Team name is required'); return }
      state.teams.push({ id: 'team-' + Date.now(), name })
      if (els.newTeam) els.newTeam.value = ''
      saveState()
      renderAll()
    })
  }
  if (els.chatSend) {
    els.chatSend.addEventListener('click', () => {
      const text = els.chatMsg?.value.trim()
      const user = els.chatUser?.value.trim() || currentUser || 'Anon'
      if (!text) return
      state.chat.push({ user, text, ts: Date.now() })
      if (els.chatMsg) els.chatMsg.value = ''
      saveState()
      renderChat()
    })
  }
  if (els.testBackendBtn) {
    els.testBackendBtn.addEventListener('click', testBackend)
  }
  if (els.openAuthBtn) {
    els.openAuthBtn.addEventListener('click', () => {
      if (els.authModal) els.authModal.style.display = 'flex'
    })
  }
  if (els.authLogin) {
    els.authLogin.addEventListener('click', () => {
      const name = els.authUser?.value.trim()
      const pass = els.authPass?.value || ''
      if (!name) { alert('Enter a username'); return }
      const admin = pass === 'admin123'
      currentUser = name
      isAdmin = admin
      saveState()
      renderAll()
      if (els.authModal) els.authModal.style.display = 'none'
    })
  }
  if (els.authRegister) {
    els.authRegister.addEventListener('click', () => {
      const name = els.authUser?.value.trim()
      if (!name) { alert('Enter a username'); return }
      currentUser = name
      isAdmin = false
      saveState()
      renderAll()
      if (els.authModal) els.authModal.style.display = 'none'
    })
  }
  if (els.logoutBtn) {
    els.logoutBtn.addEventListener('click', () => {
      currentUser = 'Guest'
      isAdmin = false
      saveState()
      renderAll()
      alert('Logged out')
    })
  }
  if (els.resetAdminBtn) {
    els.resetAdminBtn.addEventListener('click', () => {
      isAdmin = false
      saveState()
      renderAll()
      alert('Admin reset')
    })
  }
  navButtons.forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)))
}

function init() {
  if (!state.teams.length) state.teams = DEFAULT_TEAMS.slice()
  initFirebase()
  bindEvents()
  renderAll()
  if (navButtons.length) showView(navButtons[0].dataset.view)
  setTimeout(testBackend, 500)
}

init()
