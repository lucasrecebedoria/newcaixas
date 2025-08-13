const app = document.getElementById('app');

let currentUser = null;
let reports = JSON.parse(localStorage.getItem('reports_v4') || '[]');
let users = JSON.parse(localStorage.getItem('users_v4') || '[]');

const admins = ["0001","admin","6266","70029","4144"];

// Render login
function renderLogin(){
    app.innerHTML = `
    <header><h1>Relatório de Diferenças</h1></header>
    <div style="padding:20px;">
        <input id="matricula" placeholder="Matrícula"><br>
        <input id="senha" type="password" placeholder="Senha"><br>
        <button onclick="login()">Login</button>
        <button onclick="renderRegister()">Cadastrar novo usuário</button>
    </div>`;
}

function renderRegister(){
    app.innerHTML = `
    <header><h1>Cadastrar Usuário</h1></header>
    <div style="padding:20px;">
        <input id="matricula" placeholder="Matrícula"><br>
        <input id="nome" placeholder="Nome"><br>
        <input id="senha" type="password" placeholder="Senha"><br>
        <button onclick="register()">Cadastrar</button>
        <button onclick="renderLogin()">Voltar</button>
    </div>`;
}

function register(){
    const m = document.getElementById('matricula').value.trim();
    const n = document.getElementById('nome').value.trim();
    const s = document.getElementById('senha').value.trim();
    if(!m || !n || !s){ alert("Preencha todos os campos."); return; }
    if(users.find(u => u.matricula === m)){ alert("Matrícula já cadastrada."); return; }
    users.push({matricula: m, nome: n, senha: s});
    localStorage.setItem('users_v4', JSON.stringify(users));
    alert("Usuário cadastrado!");
    renderLogin();
}

function login(){
    const m = document.getElementById('matricula').value.trim();
    const s = document.getElementById('senha').value.trim();
    const user = users.find(u => u.matricula === m && u.senha === s);
    if(!user){ alert("Credenciais inválidas."); return; }
    currentUser = user;
    renderMain();
}

function logout(){
    currentUser = null;
    renderLogin();
}

function renderMain(){
    const isAdmin = admins.includes(currentUser.matricula);
    let reportsHTML = reports.map((r,i)=>`
        <div class="report">
            <strong>${r.data}</strong> - Matrícula: ${r.matricula}
            ${isAdmin ? `<button onclick="deleteReport(${i})">Excluir</button>` : ""}
            <button onclick="toggleReport(${i})">Ver/Esconder</button>
            <button onclick="openObsPopup(${i})">Pós conferência</button>
            <div id="report-${i}" class="hidden">
                Folha: ${r.folha} | Dinheiro: ${r.dinheiro} | Sobra/Falta: ${r.sf}<br>
                Observação: ${r.obs || ""}
            </div>
        </div>
    `).join("");

    app.innerHTML = `
    <header>
        <h1>Relatório de Diferenças</h1>
        <div>${currentUser.nome} (${currentUser.matricula}) 
            <button onclick="changePassword()">Alterar Senha</button>
            <button onclick="logout()">Logout</button>
        </div>
    </header>
    <div style="padding:20px;">
        ${isAdmin ? `
        <input id="data" type="date"><br>
        <input id="folha" type="number" placeholder="Valor folha"><br>
        <input id="dinheiro" type="number" placeholder="Valor em dinheiro"><br>
        <input id="obs" placeholder="Observação"><br>
        <button onclick="addReport()">Salvar</button>
        ` : ""}
        <hr>
        ${reportsHTML}
    </div>`;
}

function addReport(){
    const data = document.getElementById('data').value;
    const folha = parseFloat(document.getElementById('folha').value);
    const dinheiro = parseFloat(document.getElementById('dinheiro').value);
    const obs = document.getElementById('obs').value;
    const sf = (dinheiro - folha).toFixed(2);
    reports.push({data, folha, dinheiro, sf, obs, matricula: currentUser.matricula, posObs: ""});
    localStorage.setItem('reports_v4', JSON.stringify(reports));
    renderMain();
}

function deleteReport(i){
    if(confirm("Excluir este relatório?")){
        reports.splice(i,1);
        localStorage.setItem('reports_v4', JSON.stringify(reports));
        renderMain();
    }
}

function toggleReport(i){
    document.getElementById('report-'+i).classList.toggle('hidden');
}

function openObsPopup(i){
    const isAdmin = admins.includes(currentUser.matricula);
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.onclick = ()=>document.body.removeChild(overlay);

    const popup = document.createElement('div');
    popup.className = 'popup';

    popup.innerHTML = `
        <h3>Obs pós conferência</h3>
        <textarea id="posObsField" ${isAdmin?"":"readonly"}>${reports[i].posObs || ""}</textarea><br>
        ${isAdmin ? `<button onclick="saveObs(${i})">Salvar</button>` : ""}
        <button onclick="document.body.removeChild(document.querySelector('.overlay'))">Fechar</button>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

function saveObs(i){
    reports[i].posObs = document.getElementById('posObsField').value;
    localStorage.setItem('reports_v4', JSON.stringify(reports));
    document.body.removeChild(document.querySelector('.overlay'));
}

function changePassword(){
    const nova = prompt("Digite a nova senha:");
    if(!nova) return;
    users = users.map(u => u.matricula === currentUser.matricula ? {...u, senha: nova} : u);
    localStorage.setItem('users_v4', JSON.stringify(users));
    alert("Senha alterada!");
}

renderLogin();