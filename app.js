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

addTeamBtn.onclick = ()=>{ const name=teamName.value.trim(); if(!name) return; state.teams.push({id:Date.now()+Math.random(),name}); teamName.value=''; renderTeams(); save(); }
addCupBtn.onclick = ()=>{ const name=cupName.value.trim(); if(!name) return; state.cups.push({id:Date.now()+Math.random(),name,winner:null}); cupName.value=''; renderCups(); save(); }
resetBtn.onclick = ()=>{ if(!confirm('Reset all data?')) return; state.teams=[]; state.cups=[]; state.matches=[]; save(); renderAll(); }

function renderTeams(){ teamsList.innerHTML=''; state.teams.forEach(t=>{
  const li=document.createElement('li'); li.textContent=t.name;
  const rm=document.createElement('button'); rm.textContent='✖'; rm.className='secondary'; rm.onclick=()=>{ state.teams=state.teams.filter(x=>x.id!==t.id); save(); renderAll(); }
  li.appendChild(rm); teamsList.appendChild(li);
}) }

function renderCups(){ cupsList.innerHTML=''; state.cups.forEach(c=>{
  const li=document.createElement('li');
  const span=document.createElement('span'); span.textContent=c.name+' ';
  const sel=document.createElement('select');
  const emptyOpt=document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='(no winner)'; sel.appendChild(emptyOpt);
  state.teams.forEach(t=>{ const o=document.createElement('option'); o.value=t.id; o.textContent=t.name; if(c.winner===t.id) o.selected=true; sel.appendChild(o); })
  sel.onchange=()=>{ c.winner = sel.value||null; save(); renderCups(); }
  const rm=document.createElement('button'); rm.textContent='✖'; rm.className='secondary'; rm.onclick=()=>{ state.cups=state.cups.filter(x=>x.id!==c.id); save(); renderCups(); }
  li.appendChild(span); li.appendChild(sel); li.appendChild(rm); cupsList.appendChild(li);
}) }

function generateRoundRobin(teams){ const t = teams.map(x=>x.id); const n=t.length; let rounds=[]; if(n<2) return [];
  const arr = t.slice(); if(n%2===1) arr.push(null);
  const m = arr.length; for(let r=0;r<m-1;r++){ for(let i=0;i<m/2;i++){ const a=arr[i]; const b=arr[m-1-i]; if(a!==null && b!==null) rounds.push({home:a,away:b,played:false,scoreHome:null,scoreAway:null}); }
    // rotate
    arr.splice(1,0,arr.pop());
  }
  return rounds;
}

startLeagueBtn.onclick = ()=>{
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
  saveBtn.onclick=()=>{ const sh = inA.value===''?null:parseInt(inA.value); const sa = inB.value===''?null:parseInt(inB.value); m.scoreHome=sh; m.scoreAway=sa; m.played = (sh!==null && sa!==null); save(); renderAll(); }
  div.appendChild(label); div.appendChild(inA); div.appendChild(document.createTextNode(' - ')); div.appendChild(inB); div.appendChild(saveBtn);
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

function renderAll(){ renderTeams(); renderCups(); renderMatches(); renderStandings(); }

renderAll();
