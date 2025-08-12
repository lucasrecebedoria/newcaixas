// Simple static app using localStorage for users and reports.
// IMPORTANT: For production, replace storage with a server + authentication.

const STORAGE_USERS = "rpd_users_v1";
const STORAGE_REPORTS = "rpd_reports_v1";
const STORAGE_SESSION = "rpd_session_v1";

// Default admin matriculas (edit as needed)
const DEFAULT_ADMINS = ["6266","admin"];

// Utilities
function $(id){return document.getElementById(id)}
function saveJSON(key,obj){localStorage.setItem(key, JSON.stringify(obj))}
function loadJSON(key,def){const v=localStorage.getItem(key); return v?JSON.parse(v):def}

// Initialize default data
let users = loadJSON(STORAGE_USERS, []);
let reports = loadJSON(STORAGE_REPORTS, []);
let session = loadJSON(STORAGE_SESSION, null);

// If no users, create a sample admin user
if(users.length===0){
  users.push({matricula:"0001", nome:"Administrador", senha:"admin", isAdmin:true});
  users.push({matricula:"1000", nome:"Usuario Exemplo", senha:"1234", isAdmin:false});
  saveJSON(STORAGE_USERS, users);
}

// Mark admin list
function isAdminMatricula(m){
  return DEFAULT_ADMINS.includes(m) || (users.find(u=>u.matricula===m)?.isAdmin===true);
}

// Auth elements
const authSection = $("authSection");
const appSection = $("appSection");
const welcomeText = $("welcomeText");
const adminControls = $("adminControls");
const reportsList = $("reportsList");

// Login/Register
$("loginBtn").onclick = () => {
  const m = $("loginMatricula").value.trim();
  const s = $("loginSenha").value;
  const u = users.find(x=>x.matricula===m && x.senha===s);
  if(!u){alert("Matrícula ou senha inválida"); return;}
  session = {matricula:u.matricula, nome:u.nome, isAdmin: isAdminMatricula(u.matricula)};
  saveJSON(STORAGE_SESSION, session);
  showApp();
}

$("regBtn").onclick = () => {
  const m = $("regMatricula").value.trim();
  const n = $("regNome").value.trim();
  const s = $("regSenha").value;
  if(!m||!n||!s){alert("Preencha todos os campos de registro"); return;}
  if(users.find(u=>u.matricula===m)){alert("Matrícula já existe"); return;}
  const newUser = {matricula:m, nome:n, senha:s, isAdmin:false};
  users.push(newUser);
  saveJSON(STORAGE_USERS, users);
  alert("Usuário cadastrado com sucesso. Faça login.");
  $("regMatricula").value=""; $("regNome").value=""; $("regSenha").value="";
}

// Logout
$("logoutBtn").onclick = () => {
  session = null; localStorage.removeItem(STORAGE_SESSION);
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
}

// Compute sobra automatically
$("repFolha").oninput = computeSobra;
$("repDinheiro").oninput = computeSobra;
function computeSobra(){
  const f = parseFloat($("repFolha").value||0);
  const d = parseFloat($("repDinheiro").value||0);
  const sobra = (d - f);
  $("repSobra").value = sobra.toFixed(2);
}

// Save report
$("saveReportBtn").onclick = () => {
  if(!session){ alert("Faça login."); return; }
  const r = {
    id: "r_"+Date.now(),
    matricula: session.matricula,
    nome: session.nome,
    dataCaixa: $("repData").value || new Date().toISOString().slice(0,10),
    valorFolha: parseFloat($("repFolha").value||0),
    valorDinheiro: parseFloat($("repDinheiro").value||0),
    sobraFalta: parseFloat($("repSobra").value||0),
    obs: $("repObs").value||"",
    createdAt: new Date().toISOString()
  };
  reports.unshift(r);
  saveJSON(STORAGE_REPORTS, reports);
  clearReportForm();
  renderReports();
}

// Clear form
function clearReportForm(){
  $("repData").value=""; $("repFolha").value=""; $("repDinheiro").value="";
  $("repSobra").value=""; $("repObs").value="";
}

// Render reports
function renderReports(filterMatric=null){
  reportsList.innerHTML = "";
  const visible = reports.filter(r=>{
    if(session.isAdmin){
      if(filterMatric && filterMatric.trim()!=="") return r.matricula===filterMatric.trim();
      return true;
    } else {
      return r.matricula === session.matricula;
    }
  });

  if(visible.length===0){
    reportsList.innerHTML = "<p>Nenhum relatório encontrado.</p>";
    return;
  }

  visible.forEach(r=>{
    const div = document.createElement("div");
    div.className = "report";
    div.innerHTML = `
      <div class="field"><strong>Matrícula</strong><br/>${r.matricula}</div>
      <div class="field"><strong>Nome</strong><br/>${r.nome}</div>
      <div class="field"><strong>Data do Caixa</strong><br/><span class="r-data">${r.dataCaixa}</span></div>
      <div class="field"><strong>Valor Folha</strong><br/><span class="r-folha">${r.valorFolha.toFixed(2)}</span></div>
      <div class="field"><strong>Valor Dinheiro</strong><br/><span class="r-dinheiro">${r.valorDinheiro.toFixed(2)}</span></div>
      <div class="field"><strong>Sobra/Falta</strong><br/><span class="r-sobra">${r.sobraFalta.toFixed(2)}</span></div>
      <div class="field" style="grid-column:1/-1"><strong>Observação</strong><br/><span class="r-obs">${r.obs||''}</span></div>
      <div class="actions" style="grid-column:1/-1">
        ${ session.isAdmin ? `<button class="btn editBtn" data-id="${r.id}">Editar</button>` : '' }
      </div>
    `;
    reportsList.appendChild(div);
  });

  // attach edit handlers
  if(session.isAdmin){
    document.querySelectorAll(".editBtn").forEach(b=>{
      b.onclick = ()=>{ openEditModal(b.dataset.id) }
    });
  }
}

// Edit modal (simple prompt-based editor for static site)
function openEditModal(id){
  const r = reports.find(x=>x.id===id);
  if(!r){ alert("Relatório não encontrado"); return; }
  // Admin can edit any field
  const dataCaixa = prompt("Data do caixa (YYYY-MM-DD):", r.dataCaixa) || r.dataCaixa;
  const valorFolha = parseFloat(prompt("Valor folha:", r.valorFolha) || r.valorFolha);
  const valorDinheiro = parseFloat(prompt("Valor em dinheiro:", r.valorDinheiro) || r.valorDinheiro);
  const obs = prompt("Observação:", r.obs || "") || "";
  r.dataCaixa = dataCaixa;
  r.valorFolha = isNaN(valorFolha)?0:valorFolha;
  r.valorDinheiro = isNaN(valorDinheiro)?0:valorDinheiro;
  r.sobraFalta = r.valorDinheiro - r.valorFolha;
  r.obs = obs;
  saveJSON(STORAGE_REPORTS, reports);
  renderReports();
}

// Show app after login
function showApp(){
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  welcomeText.textContent = `Olá, ${session.nome} (${session.matricula})`;
  if(session.isAdmin){
    adminControls.classList.remove("hidden");
    // attach filter
    $("filterBtn").onclick = ()=> renderReports($("filterMatricula").value);
    $("clearFilterBtn").onclick = ()=> { $("filterMatricula").value=""; renderReports(null) };
  } else {
    adminControls.classList.add("hidden");
  }
  renderReports();
}

// On load, restore session if present
(function init(){
  users = loadJSON(STORAGE_USERS, users);
  reports = loadJSON(STORAGE_REPORTS, reports);
  session = loadJSON(STORAGE_SESSION, session);
  if(session){
    session.isAdmin = isAdminMatricula(session.matricula);
    showApp();
  }
})();
