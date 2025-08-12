# Relatório de Diferenças — Site estático

Este é um site estático (HTML/CSS/JS) criado para ser hospedado no GitHub Pages.

Funcionalidades:
- Tela de login e registro (matrícula, nome, senha).
- Registro cria usuário salvo no `localStorage`.
- Relatórios com campos: data do caixa, valor folha, valor em dinheiro, sobra/falta (calculado automaticamente), observação.
- Apenas administradores podem editar relatórios — admin são os matriculas na lista `DEFAULT_ADMINS` no `app.js` e/ou usuários com `isAdmin=true`.
- Usuários comuns só visualizam os relatórios ligados à própria matrícula.
- Admins podem filtrar por matrícula e editar qualquer relatório a qualquer momento.
- Layout: degradê preto e cinza + detalhes verdes 3D. Título no topo: "Relatório de Diferenças". Botão Logout no canto superior direito.

**ATENÇÃO**: Os dados são armazenados no `localStorage` do navegador. Para produção, você precisa de um backend (API) e autenticação segura.

Como usar:
1. Baixe o ZIP e descompacte.
2. Faça `git init` / commit e suba para um repositório GitHub.
3. Habilite GitHub Pages na branch `main` (ou `gh-pages`) para servir como site estático.

Edite a lista de administradores:
- Abra `app.js` e altere `DEFAULT_ADMINS` para as matriculas que devem ter privilégios administrativos.
