// ------- App Relatório de Diferenças (versão corrigida) -------
// Chaves de armazenamento (nova versão para evitar dados antigos corrompidos)
const K_USERS   = "rd_users_v3";
const K_REPORTS = "rd_reports_v3";
const K_SESSION = "rd_session_v3";

// Admins exigidos
const ADMINS = ["6266", "70029", "4144", "0001", "admin"];

// Helpers
const $ = (id) => document.getElementById(id);
const save = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
const load = (k,def)=>{
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : def; }
  catch(e){ console.warn("Falha ao ler localStorage", k, e); return def; }
};

// Estado
let users   = load(K_USERS, []);
let reports = load(K_REPORTS, []);
let session = load(K_SESSION, null);

// Seed de admin padrão
function seedAdminIfEmpty(){
  if(!Array.isArray(users) || users.length === 0){
    users = [{ matricula:"0001", nome:"Administrador", senha:"admin", isAdmin:true }];
    save(K_USERS, users);
  }
}
seedAdminIfEmpty();

function isAdmin(m){ return ADMINS.includes(String(m)) || !!users.find(u=>u.matricula===m && u.isAdmin); }

// DOM pronto
document.addEventListener("DOMContentLoaded", () => {
  bindAuth();
  bindReportForm();
  bindAdminFilter();
  bindPopup();
  // Se existir sessão válida, entrar direto
  if(session && session.matricula){
    session.isAdmin = isAdmin(session.matricula);
    enterApp();
  }else{
    // garantir que botões do topo fiquem ocultos antes do login
    toggleTopActions(false);
  }
});

// ----- Autenticação -----
function bindAuth(){
  $("btnLogin").onclick = () => {
    const m = $("loginMatricula").value.trim();
    const s = $("loginSenha").value;
    const u = users.find(x => x.matricula === m && x.senha === s);
    if(!u){ alert("Credenciais inválidas"); return; }
    session = { matricula: u.matricula, nome: u.nome, isAdmin: isAdmin(u.matricula) };
    save(K_SESSION, session);
    enterApp();
  };

  $("btnRegister").onclick = () => {
    const m = $("regMatricula").value.trim();
    const n = $("regNome").value.trim();
    const s = $("regSenha").value;
    if(!m || !n || !s){ alert("Preencha todos os campos"); return; }
    if(users.find(u => u.matricula === m)){ alert("Matrícula já cadastrada"); return; }
    users.push({ matricula: m, nome: n, senha: s, isAdmin: false });
    save(K_USERS, users);
    alert("Usuário cadastrado!");
    // limpar campos
    ["regMatricula","regNome","regSenha"].forEach(id => $(id).value = "");
  };

  $("btnLogout").onclick = () => {
    session = null;
    localStorage.removeItem(K_SESSION);
    $("appSection").classList.add("hidden");
    $("authSection").classList.remove("hidden");
    toggleTopActions(false);
  };

  $("btnChangePwd").onclick = () => {
    if(!session){ alert("Faça login."); return; }
    const nova = prompt("Nova senha:");
    if(!nova) return;
    const u = users.find(x=>x.matricula === session.matricula);
    if(u){
      u.senha = nova;
      save(K_USERS, users);
      alert("Senha alterada!");
    }
  };
}

function enterApp(){
  $("authSection").classList.add("hidden");
  $("appSection").classList.remove("hidden");
  $("welcomeText").textContent = `Olá, ${session.nome} (${session.matricula})`;
  toggleTopActions(true);
  if(session.isAdmin) $("adminFilter").classList.remove("hidden");
  else $("adminFilter").classList.add("hidden");
  renderReports();
}

function toggleTopActions(loggedIn){
  ["welcomeText","btnChangePwd","btnLogout"].forEach(id => {
    const el = $(id);
    if(loggedIn) el.classList.remove("hidden"); else el.classList.add("hidden");
  });
}

// ----- Form de relatório -----
function bindReportForm(){
  $("repFolha").addEventListener("input", calcSobra);
  $("repDinheiro").addEventListener("input", calcSobra);
  $("btnSaveReport").onclick = () => {
    if(!session){ alert("Faça login"); return; }
    const data = $("repData").value || new Date().toISOString().slice(0,10);
    const folha = parseFloat($("repFolha").value || 0);
    const dinheiro = parseFloat($("repDinheiro").value || 0);
    const sobra = dinheiro - folha;
    const obs = $("repObs").value || "";
    const obsConf = $("repObsConf").value || "";
    const r = { id: "r"+Date.now(), matricula: session.matricula, nome: session.nome,
                dataCaixa: data, valorFolha: folha, valorDinheiro: dinheiro, sobraFalta: sobra,
                obs, obsConf };
    reports.unshift(r);
    save(K_REPORTS, reports);
    ["repData","repFolha","repDinheiro","repSobra","repObs","repObsConf"].forEach(id => $(id).value = "");
    renderReports();
  };
}
function calcSobra(){
  const f = parseFloat($("repFolha").value || 0);
  const d = parseFloat($("repDinheiro").value || 0);
  $("repSobra").value = (d - f).toFixed(2);
}

// ----- Filtro admin -----
function bindAdminFilter(){
  $("btnFilter").onclick = () => renderReports($("filterMatricula").value.trim());
  $("btnClearFilter").onclick = () => { $("filterMatricula").value = ""; renderReports(); };
}

// ----- Popup Obs pós conferência -----
let currentObsReportId = null;
function bindPopup(){
  $("popupClose").onclick = () => closeObsPopup();
  $("popupSave").onclick = () => {
    if(!session || !session.isAdmin || !currentObsReportId) return;
    const r = reports.find(x=>x.id===currentObsReportId);
    if(!r) return;
    r.obsConf = $("popupTextarea").value;
    save(K_REPORTS, reports);
    closeObsPopup();
  };
}
function openObsPopup(report){
  currentObsReportId = report.id;
  $("obsPopup").classList.remove("hidden");
  $("popupTextarea").value = report.obsConf || "";
  if(session.isAdmin){
    $("popupTextarea").disabled = false;
    $("popupSave").classList.remove("hidden");
  }else{
    $("popupTextarea").disabled = true;
    $("popupSave").classList.add("hidden");
  }
}
function closeObsPopup(){
  $("obsPopup").classList.add("hidden");
  currentObsReportId = null;
}

// ----- Renderização de relatórios -----
function renderReports(filterMat=""){
  const list = $("reportsList");
  list.innerHTML = "";
  const data = session.isAdmin
    ? (filterMat ? reports.filter(r=>String(r.matricula) === String(filterMat)) : reports)
    : reports.filter(r=>r.matricula === session.matricula);

  if(data.length === 0){
    list.innerHTML = "<p>Nenhum relatório.</p>";
    return;
  }

  data.forEach(r => {
    const row = document.createElement("article"); row.className = "report";

    // Esquerda: legenda + botão para popup
    const left = document.createElement("div"); left.className = "report-left";
    const legend = document.createElement("div"); legend.className = "legend"; legend.textContent = "Obs pós conferência";
    const btnObs = document.createElement("button"); btnObs.className = "obs-open"; btnObs.textContent = "Ver";
    btnObs.onclick = () => openObsPopup(r);
    left.appendChild(legend); left.appendChild(btnObs);

    // Direita: header (data) + detalhes (minimizado por padrão)
    const right = document.createElement("div"); right.className = "report-right";
    const header = document.createElement("div"); header.className = "report-header";
    const date = document.createElement("span"); date.className = "date"; date.textContent = r.dataCaixa;
    const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = r.matricula;
    header.appendChild(date); header.appendChild(badge);

    const details = document.createElement("div"); details.className = "report-details";
    details.innerHTML = `
      <div><b>Nome:</b> ${r.nome}</div>
      <div><b>Valor folha:</b> ${r.valorFolha.toFixed(2)}</div>
      <div><b>Valor em dinheiro:</b> ${r.valorDinheiro.toFixed(2)}</div>
      <div><b>Sobra/Falta:</b> ${r.sobraFalta.toFixed(2)}</div>
      <div><b>Observação:</b> ${r.obs || "-"}</div>
    `;

    const actions = document.createElement("div"); actions.className = "actions";
    if(session.isAdmin){
      const btnEdit = document.createElement("button"); btnEdit.className = "btn btn-sm"; btnEdit.textContent = "Editar";
      btnEdit.onclick = () => editReport(r.id);
      const btnDel  = document.createElement("button"); btnDel.className = "btn btn-sm"; btnDel.style.background="#660000"; btnDel.style.color="#fff"; btnDel.textContent = "Excluir";
      btnDel.onclick = () => deleteReport(r.id);
      actions.appendChild(btnEdit); actions.appendChild(btnDel);
    }
    details.appendChild(actions);

    header.onclick = () => details.classList.toggle("show");

    right.appendChild(header);
    right.appendChild(details);

    row.appendChild(left);
    row.appendChild(right);
    list.appendChild(row);
  });
}

// ----- Edição/Exclusão -----
function editReport(id){
  const r = reports.find(x=>x.id===id); if(!r) return;
  const d  = prompt("Data do caixa:", r.dataCaixa); if(!d) return;
  const vf = parseFloat(prompt("Valor folha:", r.valorFolha)); if(isNaN(vf)) return alert("Valor folha inválido.");
  const vd = parseFloat(prompt("Valor em dinheiro:", r.valorDinheiro)); if(isNaN(vd)) return alert("Valor dinheiro inválido.");
  const ob = prompt("Observação:", r.obs); if(ob === null) return;
  r.dataCaixa = d; r.valorFolha = vf; r.valorDinheiro = vd; r.sobraFalta = (vd - vf); r.obs = ob;
  save(K_REPORTS, reports); renderReports();
}

function deleteReport(id){
  if(!confirm("Deseja excluir este relatório?")) return;
  reports = reports.filter(r=>r.id !== id);
  save(K_REPORTS, reports); renderReports();
}
