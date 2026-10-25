async function api(path,opts={}){const r=await fetch(path,{headers:{'Content-Type':'application/json',...(opts.token?{Authorization:'Bearer '+opts.token}:{})},...opts});return r.json()}
function setRole(role){api('/api/login',{method:'POST',body:JSON.stringify({role})}).then(d=>{localStorage.setItem('token',d.token);localStorage.setItem('role',d.role);location.href=role==='admin'?'/admin/dashboard':role==='teacher'?'/teacher/dashboard':'/student/dashboard'})}
function money(n){return new Intl.NumberFormat('bn-BD').format(n||0)+' টাকা'}
window.addEventListener('load',()=>{document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear())})
async function loadAdmin(){const d=await api('/api/admin/dashboard',{token:localStorage.getItem('token')});document.querySelector('#counts').innerHTML=Object.entries(d.counts||{}).map(([k,v])=>`<div class="card"><h3>${k}</h3><b>${v}</b></div>`).join('')}
async function loadFinance(){const rows=await api('/api/finance/transactions');document.querySelector('#ledger').innerHTML=rows.map(x=>`<tr><td>${x.date}</td><td>${x.type}</td><td>${x.title}</td><td>${money(x.amount)}</td><td>${x.status}</td></tr>`).join('')}
async function loadStudents(){const rows=await api('/api/students');document.querySelector('#students').innerHTML=rows.map(x=>`<tr><td>${x.id}</td><td>${x.name}</td><td>${x.className}</td><td>${x.roll}</td><td>${x.phone}</td><td>${money(x.due)}</td></tr>`).join('')}
function toggleMenu(){const m=document.getElementById('navMenu');if(m)m.classList.toggle('open')}
