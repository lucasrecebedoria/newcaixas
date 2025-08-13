const app = document.getElementById('app');

let currentUser = null;
let reports = JSON.parse(localStorage.getItem('reports_v7') || '[]');
let users = JSON.parse(localStorage.getItem('users_v5') || '[]');

const admins = ["0001","admin","6266","70029","4144"];

function renderLogin(){
    app.innerHTML = `<header><h1>Relatório de Diferenças</h1></header>
    <div style="padding:20px;">
        <input id="matricula" placeholder="Matrícula"><br>
        <input id="senha" type="password" placeholder="Senha"><br>
        <button onclick="login()">Login</button>
        <button onclick="renderRegister()">Cadastrar novo usuário</button>
    </div>`;
}

function renderRegister(){
    app.innerHTML = `<header><h1>Cadastrar Usuário</h1></header>
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
    if(!m||!n||!s){ alert("Preencha todos os campos."); return; }
    if(users.find(u=>u.matricula===m)){ alert("Matrícula já cadastrada."); return; }
    users.push({matricula:m,nome:n,senha:s});
    localStorage.setItem('users_v5', JSON.stringify(users));
    alert("Usuário cadastrado!");
    renderLogin();
}

function login(){
    const m = document.getElementById('matricula').value.trim();
    const s = document.getElementById('senha').value.trim();
    const user = users.find(u=>u.matricula===m && u.senha===s);
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

    let filterHTML = `<input type="date" id="filterDate">
        ${isAdmin ? '<input type="text" id="filterMatricula" placeholder="Matrícula">' : ''}
        <button onclick="applyFilter()">Filtrar</button>
        <button onclick="clearFilter()">Limpar filtros</button><hr>`;

    let reportsHTML = reports.map((r,i)=>{
        let show = isAdmin || r.matricula===currentUser.matricula;
        if(!show) return "";
        let alertText = r.posObs && (r.posObs.text || r.posObs.images.length>0) ? '<span class="alert">Verificar pós conferência</span>' : '';
        return `<div class="report">
            <strong>${r.data}</strong> - Matrícula: ${r.matricula} ${alertText}
            ${isAdmin ? `<button onclick="deleteReport(${i})">Excluir</button>` : ""}
            <button onclick="toggleReport(${i})">Ver/Esconder</button>
            <button onclick="openObsPopup(${i})">Pós conferência</button>
            <div id="report-${i}" class="hidden">
                Folha: R$ ${r.folha.toFixed(2)} | Dinheiro: R$ ${r.dinheiro.toFixed(2)} | Sobra/Falta: R$ ${r.sf}<br>
                Observação: ${r.obs || ""}
            </div>
        </div>`;
    }).join("");

    app.innerHTML = `<header>
        <h1>Relatório de Diferenças</h1>
        <div>${currentUser.nome} (${currentUser.matricula})
            <button onclick="changePassword()">Alterar Senha</button>
            <button onclick="logout()">Logout</button>
        </div>
    </header>
    <div style="padding:20px;">
        ${isAdmin ? `<select id="userSelect">${users.map(u=>`<option value="${u.matricula}">${u.matricula} - ${u.nome}</option>`).join('')}</select><br>
        <input id="data" type="date"><br>
        <input id="folha" type="number" placeholder="Valor folha"><br>
        <input id="dinheiro" type="number" placeholder="Valor em dinheiro"><br>
        <input id="obs" placeholder="Observação"><br>
        <button onclick="addReport()">Salvar</button><br><br>${filterHTML}` : filterHTML}
        ${reportsHTML}
    </div>`;
}

function addReport(){
    const data = document.getElementById('data').value;
    const folha = parseFloat(document.getElementById('folha').value);
    const dinheiro = parseFloat(document.getElementById('dinheiro').value);
    const obs = document.getElementById('obs').value;
    const sf = (dinheiro - folha).toFixed(2);
    const matricula = document.getElementById('userSelect') ? document.getElementById('userSelect').value : currentUser.matricula;
    reports.push({data, folha, dinheiro, sf, obs, matricula, posObs: {text:"", images:[]} });
    localStorage.setItem('reports_v7', JSON.stringify(reports));
    renderMain();
}

function deleteReport(i){
    if(confirm("Excluir este relatório?")){
        reports.splice(i,1);
        localStorage.setItem('reports_v7', JSON.stringify(reports));
        renderMain();
    }
}

function toggleReport(i){
    document.getElementById('report-'+i).classList.toggle('hidden');
}

function openObsPopup(i){
    const isAdmin = admins.includes(currentUser.matricula);
    let popup = document.getElementById('popupObs');
    if(!popup){
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'overlayObs';
        document.body.appendChild(overlay);

        popup = document.createElement('div');
        popup.className = 'popup';
        popup.id = 'popupObs';
        document.body.appendChild(popup);
    }
    let imagesHTML = reports[i].posObs.images.map(src=>`<img src="${src}" onclick="window.open('${src}')">`).join('');
    popup.innerHTML = `<h3>Obs pós conferência</h3>
        <textarea id="posObsField" ${isAdmin?"":"readonly"}>${reports[i].posObs.text}</textarea><br>
        ${isAdmin ? `<input type="file" id="imgInput" multiple><button onclick="addImages(${i})">Anexar imagens</button>
        <button onclick="saveObs(${i})">Salvar</button>` : ""}
        <div>${imagesHTML}</div>
        <button onclick="closeObsPopup()">Fechar</button>`;
}

function closeObsPopup(){
    const overlay = document.getElementById('overlayObs');
    const popup = document.getElementById('popupObs');
    if(overlay) overlay.remove();
    if(popup) popup.remove();
}

function addImages(i){
    const input = document.getElementById('imgInput');
    const files = input.files;
    Array.from(files).forEach(file=>{
        const reader = new FileReader();
        reader.onload = (e)=>{
            reports[i].posObs.images.push(e.target.result);
            localStorage.setItem('reports_v7', JSON.stringify(reports));
            renderMain();
            openObsPopup(i);
        };
        reader.readAsDataURL(file);
    });
}

function saveObs(i){
    reports[i].posObs.text = document.getElementById('posObsField').value;
    localStorage.setItem('reports_v7', JSON.stringify(reports));
    renderMain();
}

function changePassword(){
    const nova = prompt("Digite a nova senha:");
    if(!nova) return;
    users = users.map(u => u.matricula === currentUser.matricula ? {...u, senha: nova} : u);
    localStorage.setItem('users_v5', JSON.stringify(users));
    alert("Senha alterada!");
}

function applyFilter(){
    const date = document.getElementById('filterDate').value;
    const mat = document.getElementById('filterMatricula') ? document.getElementById('filterMatricula').value.trim() : '';
    let filtered = JSON.parse(localStorage.getItem('reports_v7') || '[]');
    if(date) filtered = filtered.filter(r=>r.data===date);
    if(mat) filtered = filtered.filter(r=>r.matricula.includes(mat));
    reports = filtered;
    renderMain();
}

function clearFilter(){
    reports = JSON.parse(localStorage.getItem('reports_v7') || '[]');
    renderMain();
}

renderLogin();