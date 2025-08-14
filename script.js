// Funções básicas da versão v8
const app = document.getElementById('app');
const ADMINS = ["6266","70029","4144"];
const brl = (n)=> `R$ ${Number(n||0).toFixed(2)}`;
const formatDate = d=> {
  const dt = new Date(d);
  return dt.getDate().toString().padStart(2,'0') + '/' +
         (dt.getMonth()+1).toString().padStart(2,'0') + '/' + dt.getFullYear();
};

function renderLogin(){ app.innerHTML = '<div class="card"><h2>Login</h2></div>'; }
function renderMain(){ app.innerHTML = '<div class="card"><h1 class="title">Relatório de Diferenças</h1></div>'; }
// Funções para relatórios, pós conferência e anexos mantidas
// Funções de salvar relatório, anexar imagens, ver/ocultar, etc. seriam incluídas aqui, mantendo v8
(function init(){ renderLogin(); })();