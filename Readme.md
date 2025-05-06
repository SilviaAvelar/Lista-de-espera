# Oficina Digital Tech Life - Lista de Espera 🚀

Aplicação web para gerenciar uma lista de espera para a Oficina Digital da Tech Life.
Permite aos usuários se inscreverem e aos administradores gerenciarem as inscrições, com funcionalidades protegidas por autenticação.

<!-- (Opcional: Adicione um GIF ou screenshot da aplicação aqui. Você pode usar ferramentas como ScreenToGif ou Kap) -->
<!-- ![Demo da Aplicação](link_para_seu_gif_ou_screenshot.gif) -->

## ✨ Funcionalidades
*   **Inscrição de Participantes:** Usuários podem adicionar nome completo e função desejada à lista de espera.
*   **Listagem de Participantes:** Visualização da lista de todos os participantes inscritos.
*   **Filtragem por Função:** Permite filtrar a lista de participantes por uma função específica (Dev Back End, UI Designer, etc.).
*   **Edição de Participantes:** Administradores podem editar os dados de um participante (requer autenticação).
*   **Exclusão de Participantes:** Administradores podem remover um participante da lista (requer autenticação).
*   **Login de Administrador:** Sistema de login para proteger as ações de edição e exclusão.
*   **Página "Saiba Mais":** Redireciona para uma página com mais detalhes sobre a Oficina Digital.
*   **Notificações:** Feedback visual para o usuário sobre o sucesso ou falha das operações (usando Toastify.js).

## 🛠️ Tecnologias Utilizadas
*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript (Vanilla JS)
    *   [Toastify.js](https://apvarun.github.io/toastify-js/) (para notificações)
    *   [Font Awesome](https://fontawesome.com/) (para ícones)

*   **Backend (Serverless Functions na Vercel):**
    *   Node.js
    *   [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
    *   [bcrypt](https://www.npmjs.com/package/bcrypt) (para hashing de senhas)
    *   [jsonwebtoken (JWT)](https://www.npmjs.com/package/jsonwebtoken) (para autenticação)
    *   [dotenv](https://www.npmjs.com/package/dotenv) (para variáveis de ambiente)

*   **Banco de Dados:**
    *   MongoDB (MongoDB Atlas)

*   **Hospedagem/Deploy:**
    *   Vercel

## ⚙️ Pré-requisitos
Antes de começar, você precisará ter instalado em sua máquina:
*   [Node.js](https://nodejs.org/) (versão 18.x ou superior recomendada)
*   [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/) (gerenciador de pacotes Node.js)
*   [Vercel CLI](https://vercel.com/docs/cli) (opcional, mas recomendado para desenvolvimento local e deploy)
*   Uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) para obter a URI de conexão.

## 🚀 Instalação e Execução Local
1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/nome-do-seu-repositorio.git
    cd nome-do-seu-repositorio
    ```

2.  **Instale as dependências do backend:**
    As dependências do backend (como `mongodb`, `bcrypt`, `jsonwebtoken`) são gerenciadas automaticamente pela Vercel durante o deploy. Para desenvolvimento local com `vercel dev`, elas também podem ser resolvidas. Se você tiver um `package.json` na raiz ou na pasta `api/` com essas dependências, execute:
    ```bash
    npm install
    # ou, se o package.json estiver apenas na pasta api:
    # cd api
    # npm install
    # cd ..
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione as seguintes variáveis (substitua pelos seus valores):
    ```env
    MONGODB_URI="sua_mongodb_connection_string"
    JWT_SECRET="seu_segredo_super_secreto_para_jwt"
    ```
    *   `MONGODB_URI`: Sua string de conexão do MongoDB Atlas.
    *   `JWT_SECRET`: Uma string aleatória e segura para assinar os tokens JWT.

4.  **Configure o Usuário Administrador:**
    Veja a seção [🔑 Configuração do Administrador](#-configuração-do-administrador) abaixo.

5.  **Execute o projeto localmente com a Vercel CLI:**
    Este comando iniciará um servidor de desenvolvimento que simula o ambiente Vercel, incluindo as serverless functions na pasta `api/`.
    ```bash
    vercel dev
    ```
    A aplicação estará acessível em `http://localhost:3000` (ou outra porta, se indicada pelo Vercel CLI).

## 🔑 Configuração do Administrador
A aplicação espera um usuário administrador com `username: 'admin'` e uma senha hasheada no banco de dados.

1.  **Crie o Hash da Senha:**
    *   Use o script `generate-hash.js` fornecido:
        ```bash
        node generate-hash.js
        ```
    *   Este script pedirá uma senha (ex: `secreta123`) e imprimirá o hash gerado no console. Copie este hash.

2.  **Insira o Usuário no MongoDB:**
    *   Conecte-se à sua instância do MongoDB Atlas (usando o MongoDB Compass, Shell ou seu driver preferido).
    *   Navegue até o banco de dados `waitlistDB` e a coleção `users`.
    *   Insira um novo documento com os seguintes campos:
        ```json
        {
          "username": "admin",
          "passwordHash": "COLE_O_HASH_GERADO_AQUI"
        }
        ```

Agora, você poderá fazer login na aplicação usando o nome de usuário "admin" e a senha que você usou para gerar o hash (ex: `secreta123`).

## 🔌 Endpoints da API

Todos os endpoints estão prefixados com `/api`.

*   **`POST /api/login`**
    *   Autentica o administrador.
    *   **Corpo da Requisição:** `{ "password": "sua_senha_admin" }`
    *   **Resposta de Sucesso (200):** `{ "message": "Login bem-sucedido", "token": "seu_jwt_token" }`
    *   **Resposta de Falha (401):** `{ "message": "Credenciais inválidas" }`

*   **`GET /api/participants`**
    *   Lista todos os participantes.
    *   **Query Params (opcional):** `?role=NomeDaFuncao` para filtrar por função.
    *   **Resposta de Sucesso (200):** `[ { "_id": "...", "name": "...", "role": "..." }, ... ]`

*   **`POST /api/participants`**
    *   Adiciona um novo participante.
    *   **Corpo da Requisição:** `{ "name": "Nome Completo", "role": "Função Escolhida" }`
    *   **Resposta de Sucesso (201):** `{ "message": "Participante adicionado", "id": "id_do_novo_participante" }`

*   **`PUT /api/participants?id=<participant_id>`**
    *   Atualiza um participante existente.
    *   **Requer Autenticação (Bearer Token).**
    *   **Corpo da Requisição:** `{ "name": "Novo Nome", "role": "Nova Função" }` (ou apenas os campos a serem atualizados)
    *   **Resposta de Sucesso (200):** `{ "message": "Participante atualizado com sucesso" }`
    *   **Resposta de Falha (404):** `{ "error": "Participante não encontrado" }`

*   **`DELETE /api/participants?id=<participant_id>`**
    *   Remove um participante.
    *   **Requer Autenticação (Bearer Token).**
    *   **Resposta de Sucesso (200):** `{ "message": "Participante excluído" }`
    *   **Resposta de Falha (404):** `{ "error": "Participante não encontrado" }`

Feito com ❤️ por Silvia Avelar.
