// ====== FIREBASE ======
// A variável `db` já vem do script do index.html

// Salvar usuário com matrícula como ID
function salvarUsuario() {
  const nomeInput = document.getElementById("nome");
  const matriculaInput = document.getElementById("matricula");

  if (!nomeInput || !matriculaInput) return;

  const nome = nomeInput.value.trim();
  const matricula = matriculaInput.value.trim();

  if (!nome || !matricula) {
    alert("Preencha todos os campos!");
    return;
  }

  db.collection("usuarios").doc(matricula).set({
    nome,
    matricula
  })
  .then(() => {
    console.log(`Usuário ${nome} salvo com matrícula ${matricula}`);
    nomeInput.value = "";
    matriculaInput.value = "";
    carregarUsuarios(); // Atualiza a lista
  })
  .catch(err => console.error("Erro ao salvar usuário:", err));
}

// Carregar todos os usuários e atualizar layout
function carregarUsuarios() {
  db.collection("usuarios").get()
    .then(snapshot => {
      const usuarios = snapshot.docs.map(doc => doc.data());
      atualizarLayoutUsuarios(usuarios);
    })
    .catch(err => console.error("Erro ao carregar usuários:", err));
}

// Atualiza apenas o container da lista, sem afetar o site
function atualizarLayoutUsuarios(usuarios) {
  const container = document.getElementById("listaUsuariosContainer");
  if (!container) return;

  container.innerHTML = ""; // limpa apenas a lista

  const ul = document.createElement("ul");
  usuarios.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.nome} - ${user.matricula}`;
    ul.appendChild(li);
  });

  container.appendChild(ul);
}

// Adiciona evento no botão existente
const btnSalvar = document.getElementById("btnSalvar");
if (btnSalvar) {
  btnSalvar.addEventListener("click", salvarUsuario);
}

// Carrega usuários ao abrir a página
window.onload = () => {
  carregarUsuarios();
  if (typeof initApp === "function") initApp(); // mantém inicializações antigas
};
