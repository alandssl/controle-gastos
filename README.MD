# 💸 CON-CHECKLIST

API de **controle de gastos pessoais** feita com **Node.js, TypeScript, Express, Prisma e MySQL**.
Permite cadastrar usuários, registrar gastos por categoria, controlar pagamentos (à vista ou parcelados) e vincular cartões.

> 🌿 **Branches:** este README descreve o **back-end** (branch `main`). O **front-end** fica em uma branch separada: `frontend`.

---

## 📑 Sumário

- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Modelagem do banco](#-modelagem-do-banco)
- [Pré-requisitos](#-pré-requisitos)
- [Como rodar](#-como-rodar)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Rodando tudo no Docker](#-rodando-tudo-no-docker-opcional)
- [Comandos úteis](#-comandos-úteis)
- [Rotas da API](#-rotas-da-api)
- [Front-end](#-front-end)
- [Roadmap](#-roadmap)

---

## 🛠 Tecnologias

| Tecnologia                                   | Para que serve                          |
| -------------------------------------------- | --------------------------------------- |
| [Node.js](https://nodejs.org) 22+            | Ambiente de execução                    |
| [TypeScript](https://www.typescriptlang.org) | Tipagem estática                        |
| [Express](https://expressjs.com)             | Servidor HTTP e rotas                   |
| [Prisma 7](https://www.prisma.io)            | ORM (acesso ao banco)                   |
| [MySQL 8](https://www.mysql.com)             | Banco de dados                          |
| [Docker](https://www.docker.com)             | Subir o MySQL (e, opcionalmente, o app) |
| [tsx](https://tsx.is)                        | Rodar TypeScript direto, sem compilar   |

---

## ✨ Funcionalidades

- 👤 Cadastro e consulta de **usuários** (nome, salário e dia do salário)
- 🧾 Registro de **gastos** com descrição, valor, data e categoria
- 🏷 Categorias de gasto: alimentação, transporte, compras, lazer, saúde, casa e outros
- 💳 Controle de **pagamentos** (débito, PIX ou crédito), com suporte a **parcelas**
- 🪪 Cadastro de **cartões** vinculados ao usuário e aos pagamentos
- 🔎 Consulta de gastos por usuário

> ✏️ **Novo recurso:** _descreva aqui o modo/recurso novo que você criou (o que faz, como usar)._

---

## 🗂 Estrutura do projeto

```
CON-CHECKLIST/
├── prisma/
│   ├── schema.prisma          # Models e enums do banco
│   └── migrations/            # Histórico de migrations
├── generated/                 # Prisma Client gerado (não vai pro Git)
├── src/
│   ├── lib/
│   │   └── prisma.ts          # Instância única do Prisma Client
│   ├── interfaces/            # Tipos e DTOs (Usuario, Gasto, Pagamento)
│   ├── service/               # Regras de negócio + acesso ao banco
│   ├── controller/            # Recebe req/res e chama o service
│   ├── router/                # Define as rotas e liga ao controller
│   │   └── index.ts           # Junta todas as rotas
│   └── index.ts               # Cria o app Express e sobe o servidor
├── docker-compose.yml         # MySQL (e app, se quiser)
├── prisma.config.ts           # Configuração do Prisma 7
├── .env                       # Variáveis de ambiente (não vai pro Git)
├── package.json
└── tsconfig.json
```

### Fluxo de uma requisição

```
Cliente → Router → Controller → Service → Prisma → MySQL
                       ↓
                 res.json(resposta)
```

| Camada         | Responsabilidade                                                      |
| -------------- | --------------------------------------------------------------------- |
| **Router**     | Diz qual função atende cada rota (`POST /usuario`, `GET /gasto`...)   |
| **Controller** | Lê `req.body`, `req.params` e `req.query`, chama o service e responde |
| **Service**    | Regras de negócio e consultas ao banco via Prisma                     |

---

## 🗄 Modelagem do banco

```mermaid
erDiagram
    Usuario ||--o{ Gasto : possui
    Usuario ||--o{ Cartao : possui
    Gasto ||--o{ Pagamento : "é pago por"
    Cartao ||--o{ Pagamento : "paga"

    Usuario {
        int id PK
        string nome
        float salario
        int diaSalario
    }
    Gasto {
        int id PK
        string descricao
        TipoGasto tipoGasto
        float valorGasto
        datetime dataGasto
        int usuarioId FK
    }
    Pagamento {
        int id PK
        float valorPago
        datetime dataPago
        boolean pagamentoFeito
        TipoPagamento tipoPagamento
        int parcelas
        float valorParcela
        int gastoId FK
        int cartaoId FK
    }
    Cartao {
        int id PK
        int usuarioId FK
    }
```

### Enums

| Enum            | Valores                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `TipoGasto`     | `ALIMENTACAO`, `TRANSPORTE`, `COMPRAS`, `LAZER`, `SAUDE`, `CASA`, `OUTROS` |
| `TipoPagamento` | `DEBITO`, `PIX`, `CREDITO`                                                 |

### Regras de relacionamento

- Um **usuário** tem vários **gastos** e vários **cartões**.
- Um **gasto** pode ter vários **pagamentos** (por exemplo, parcelas) ou nenhum, se ainda não foi pago.
- Um **cartão** pode estar em vários **pagamentos**. O cartão é opcional no pagamento (PIX e débito podem não ter).

---

## ✅ Pré-requisitos

- [Node.js](https://nodejs.org) **22 ou superior** (`node -v` para conferir)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto e rodando
- [Git](https://git-scm.com)

---

## 🚀 Como rodar

### 1. Clonar e instalar

```bash
git clone <url-do-repositorio>
cd CON-CHECKLIST
npm install
```

### 2. Configurar o `.env`

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL="mysql://root:senha123@127.0.0.1:3306/con_checklist"
```

> A senha e o nome do banco precisam ser **iguais** aos do `docker-compose.yml`.

### 3. Subir o MySQL

```bash
docker compose up -d
```

Confira se subiu (aguarde uns segundos até ficar pronto):

```bash
docker ps
```

### 4. Criar as tabelas e gerar o Prisma Client

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Iniciar o servidor

```bash
npm run dev
```

A API fica disponível em **http://localhost:3000** 🎉

---

## 🔐 Variáveis de ambiente

| Variável       | Descrição                  | Exemplo                                              |
| -------------- | -------------------------- | ---------------------------------------------------- |
| `DATABASE_URL` | URL de conexão com o MySQL | `mysql://root:senha123@127.0.0.1:3306/con_checklist` |

Formato da URL:

```
mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

| Onde o app roda            | Host                      |
| -------------------------- | ------------------------- |
| No seu PC (`npm run dev`)  | `127.0.0.1`               |
| Dentro do Docker (compose) | `mysql` (nome do serviço) |

> ⚠️ Nunca suba o `.env` para o GitHub. Ele já está no `.gitignore`.

---

## 🐳 Rodando tudo no Docker (opcional)

Além do MySQL, dá pra subir a própria API em container. Para isso o projeto precisa de um `Dockerfile` e de um serviço `app` no `docker-compose.yml`.

```bash
docker compose up -d --build
```

| Comando                        | O que faz                                              |
| ------------------------------ | ------------------------------------------------------ |
| `docker compose up -d --build` | Constrói e sobe tudo em segundo plano                  |
| `docker compose logs -f app`   | Acompanha os logs da API                               |
| `docker compose down`          | Para e remove os containers (os dados ficam no volume) |
| `docker compose down -v`       | Para e **apaga também os dados** do banco              |

---

## 🧰 Comandos úteis

### npm

| Comando       | O que faz                              |
| ------------- | -------------------------------------- |
| `npm run dev` | Sobe o servidor com recarga automática |

### Prisma

| Comando                              | O que faz                                         |
| ------------------------------------ | ------------------------------------------------- |
| `npx prisma migrate dev --name algo` | Cria e aplica uma migration após mudar o schema   |
| `npx prisma migrate reset`           | Zera o banco e reaplica tudo (**apaga os dados**) |
| `npx prisma generate`                | Regenera o Prisma Client                          |
| `npx prisma format`                  | Formata o schema e completa relações que faltam   |
| `npx prisma studio`                  | Abre uma interface visual para ver os dados       |

### Fluxo ao alterar o banco

1. Edite o `prisma/schema.prisma`
2. Rode `npx prisma migrate dev --name descricao-da-mudanca`
3. Se o editor mostrar tipos antigos: `Ctrl + Shift + P` → **TypeScript: Restart TS Server**

---

## 📡 Rotas da API

> ✏️ Ajuste esta tabela conforme as rotas que você realmente criou.

### Usuários — `/usuario`

| Método | Rota                  | Descrição                     |
| ------ | --------------------- | ----------------------------- |
| `POST` | `/usuario`            | Cria um usuário               |
| `GET`  | `/usuario`            | Lista os usuários             |
| `GET`  | `/usuario/:id`        | Busca um usuário pelo id      |
| `GET`  | `/usuario?nome=Alan`  | Busca usuários pelo nome      |
| `GET`  | `/usuario/:id/gastos` | Lista os gastos de um usuário |

**Exemplo de body (`POST /usuario`):**

```json
{
  "nome": "Alan",
  "salario": 3000.5,
  "diaSalario": 5
}
```

### Gastos — `/gasto`

| Método | Rota     | Descrição         |
| ------ | -------- | ----------------- |
| `POST` | `/gasto` | Registra um gasto |
| `GET`  | `/gasto` | Lista os gastos   |

**Exemplo de body (`POST /gasto`):**

```json
{
  "descricao": "Mercado",
  "tipoGasto": "ALIMENTACAO",
  "valorGasto": 150.9,
  "usuarioId": 1
}
```

### Pagamentos — `/pagamento`

| Método | Rota         | Descrição             |
| ------ | ------------ | --------------------- |
| `POST` | `/pagamento` | Registra um pagamento |
| `GET`  | `/pagamento` | Lista os pagamentos   |

**Exemplo de body (`POST /pagamento`):**

```json
{
  "gastoId": 1,
  "tipoPagamento": "CREDITO",
  "parcelas": 3,
  "valorParcela": 50.3,
  "cartaoId": 1
}
```

### Códigos de resposta

| Código | Significado                              |
| ------ | ---------------------------------------- |
| `200`  | Sucesso                                  |
| `201`  | Criado com sucesso                       |
| `400`  | Dados obrigatórios ausentes ou inválidos |
| `404`  | Registro não encontrado                  |
| `500`  | Erro interno do servidor                 |

---

## 🖥 Front-end

O front-end do projeto está em uma **branch separada**.

```bash
git checkout frontend
```

Para rodar os dois juntos, use dois terminais:

| Terminal | Pasta                  | Comando                            |
| -------- | ---------------------- | ---------------------------------- |
| 1        | raiz (`CON-CHECKLIST`) | `npm run dev` (API em `:3000`)     |
| 2        | front-end              | Siga o README da branch `frontend` |

---

## 🗺 Roadmap

- [x] Modelagem do banco com Prisma
- [x] MySQL no Docker
- [x] CRUD de usuários
- [x] CRUD de gastos
- [x] CRUD de pagamentos e parcelas
- [ ] CRUD de cartões
- [x] Resumo mensal (total de gastos x salário)
- [x] Testes automatizados

---

## 📝 Licença

Projeto de estudo. Use e modifique à vontade. 🚀
