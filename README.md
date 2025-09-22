# n8n Random Node — True Random Number Generator (Random.org)

Este repositório contém um **custom node programático** para o **n8n** chamado **Random**, com uma única operação: **True Random Number Generator**.  
O node consome a API pública da **Random.org** para gerar um número inteiro aleatório dentro do intervalo `[Min, Max]`.

> Endpoint utilizado (GET):  
> `https://www.random.org/integers/?num=1&min=1&max=60&col=1&base=10&format=plain&rnd=new`

---

## ✨ O que este projeto entrega

- **Custom Node (TypeScript)** com `execute()` chamando Random.org.
- **Inputs**: `Min` e `Max` (apenas números).
- **Ícone SVG** no node (compatível com tema claro/escuro ou único arquivo).
- **Infra local com Docker Compose**: n8n + PostgreSQL.
- **Montagem da pasta de conectores** (`.n8n/custom`) no container.
- **Guia de testes** (funcional no n8n e opcional unit test).
- **Checklist & Troubleshooting** com erros comuns (ícone, permissões, credenciais, shell).

---

## 📦 Estrutura de pastas

```
n8n-random-node/
├─ custom/
│  └─ n8n-nodes-random/
│     ├─ nodes/
│     │  └─ Random/
│     │     ├─ Random.node.ts
│     │     ├─ random.svg            # ícone (e opcional random.dark.svg)
│     ├─ dist/
│     │  └─ nodes/
│     │     └─ Random/
│     │        ├─ Random.node.js
│     │        └─ random.svg         # cópia do SVG após build
│     ├─ package.json
│     └─ tsconfig.json
├─ docker-compose.yml
└─ README.md  ← este arquivo
```

---

## ✅ Requisitos

### Sistema
- **Docker** e **Docker Compose** instalados.
- **Porta 5678** livre (UI do n8n).
- Acesso à internet para o container **n8n** (o node faz requisições HTTP à Random.org).

### Node.js (opcional, para build local do pacote)
- **Node LTS 20/22** + **npm**.
- Recomendado: `nvm` para gerenciar versões.

---

## ⚙️ Configuração

### 1) Dependências do custom node

No host:

```bash
cd custom/n8n-nodes-random
npm install
```

Scripts relevantes no `package.json`:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json && npx copyfiles \"nodes/**/*.svg\" dist"
  },
  "devDependencies": {
    "copyfiles": "^2.4.1",
    "typescript": "^5.x"
  }
}
```

> **Por que `copyfiles`?** O TypeScript não copia assets por padrão.  
> Precisamos garantir que `random.svg` vá para **`dist/nodes/Random/random.svg`**, onde o n8n procura.

Agora faça o build:

```bash
npm run build
```

### 2) Docker Compose

`docker-compose.yml` mínimo sugerido:

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: n8n
      POSTGRES_DB: n8n
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U n8n -d n8n"]
      interval: 5s
      timeout: 5s
      retries: 10

  n8n:
    image: n8nio/n8n:latest
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "5678:5678"
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: db
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n
      DB_POSTGRESDB_PASSWORD: n8n

      # Onde o n8n procura custom nodes no container
      N8N_CUSTOM_EXTENSIONS: "/home/node/.n8n/custom"

      # (Opcional, recomendado) Corrigir permissões do settings file
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: "true"

    volumes:
      # monta ./custom do host em /home/node/.n8n/custom do container
      - "./custom:/home/node/.n8n/custom"

volumes:
  pgdata:
```

> Dica: versões novas do Compose ignoram `version: "3"`. Pode remover a chave `version` para evitar warnings.

---

## 🚀 Como rodar do zero

1) **Clone** este repositório (ou crie a estrutura acima).
2) **Instale** e **builde** o node:
   ```bash
   cd custom/n8n-nodes-random
   npm install
   npm run build
   cd ../../
   ```
3) **Suba** a stack:
   ```bash
   docker compose up -d
   ```
4) Acesse **http://localhost:5678** e complete o onboarding do n8n (criar usuário admin).

---

## 🧪 Como testar

### A. Teste funcional (no editor do n8n)

1. No editor, crie um novo workflow.
2. Adicione um **Start** e o node **Random (True Random Number Generator)**.
3. Configure:
   - **Min**: 1  
   - **Max**: 60
4. Conecte **Start → Random** e clique **Execute Node**.

**Saída esperada** (exemplo):

```json
{
  "random": 17,
  "Min": 1,
  "Max": 60,
  "source": "random.org",
  "requestedAt": "2025-09-22T22:15:10.001Z"
}
```

> Execute múltiplas vezes: os valores devem variar, sempre dentro do intervalo.

### B. Teste do endpoint fora do n8n (opcional)

No navegador/terminal, valide a API pública:

```
https://www.random.org/integers/?num=1&min=1&max=60&col=1&base=10&format=plain&rnd=new
```

O retorno deve ser um número em `text/plain` seguido de `\n`.

### C. Testes unitários (opcional)

Se quiser formalizar estrutura e regras do node (sem subir n8n):

1. Instale dev deps:
   ```bash
   cd custom/n8n-nodes-random
   npm i -D jest ts-jest @types/jest
   npx ts-jest config:init
   ```
2. Crie `__tests__/Random.node.test.ts` com assert básicos (ex.: descrição, props).
3. Rode:
   ```bash
   npm test
   ```

> Para testar `execute()` sem internet, **moque** `this.helpers.httpRequest` (injeção via `call/apply` ou wrappers de teste).

---

## 🧩 Como o ícone funciona

No `Random.node.ts`, use:

```ts
icon: 'file:random.svg',
```

ou, se quiser tema claro/escuro:

```ts
icon: {
  light: 'file:random.svg',
  dark: 'file:random.dark.svg',
},
```

**Importante:** após o build, **o(s) SVG(s) deve(m) estar em**  
`dist/nodes/Random/random.svg` (e `random.dark.svg` se usado).

---

## 🛠️ Troubleshooting

### 1) Ícone aparece “quebrado”
- Verifique **dentro do container**:
  ```bash
  docker compose exec n8n sh -lc "ls -la /home/node/.n8n/custom/n8n-nodes-random/dist/nodes/Random"
  ```
  Você **precisa** ver o `random.svg` no mesmo diretório do `Random.node.js`.
- Garanta que o script de build **copia** os SVGs:
  ```json
  "build": "tsc -p tsconfig.json && npx copyfiles \"nodes/**/*.svg\" dist"
  ```
- Reinicie o serviço n8n e dê **hard refresh** no navegador (Ctrl+F5).

### 2) Aviso: “Permissions 0644 for n8n settings file … are too wide”
- Opção recomendada: aplicar correção automática
  ```yaml
  environment:
    N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: "true"
  ```
- Ou dentro do container:
  ```bash
  docker compose exec n8n sh -lc "chmod 600 /home/node/.n8n/config"
  ```

### 3) Erro: `require(...).RandomApi is not a constructor`
- Você **não usa credenciais** neste projeto.  
  Certifique-se de **não** ter `credentials/` no `src` **nem** em `dist`.
  ```bash
  rm -rf custom/n8n-nodes-random/credentials
  rm -rf custom/n8n-nodes-random/dist/credentials
  npm run build
  docker compose restart n8n
  ```
- O loader do n8n tenta instanciar qualquer `*.credentials.*` que encontrar na pasta custom.

### 4) `bash: not found` ao executar comandos no container
- Use **sh**:
  ```bash
  docker compose exec n8n sh -lc "comando"
  ```

### 5) Ícone ainda não aparece mesmo após corrigir
- Confirme no **JS compilado** que o `icon` está simples:
  ```bash
  docker compose exec n8n sh -lc "grep -n \"icon\" /home/node/.n8n/custom/n8n-nodes-random/dist/nodes/Random/Random.node.js"
  ```
  Deve estar `icon: 'file:random.svg',` (ou `{ light, dark }` com **ambos** arquivos no `dist`).

---

## 🧭 Critérios de Avaliação — como este projeto atende

- **Infra local (Docker + PostgreSQL)**: `docker-compose.yml` funcional.
- **Pasta interna de conectores**: `./custom` montada em `/home/node/.n8n/custom` + `N8N_CUSTOM_EXTENSIONS`.
- **Organização de arquivos**: `nodes/Random/*`, `dist/*`, `package.json`, `tsconfig.json`.
- **Qualidade do código**: TypeScript, validações (`Min ≤ Max`), erros claros, uso de `this.helpers.httpRequest`.
- **Integração com Random.org**: endpoint `integers` com `format=plain`, parse robusto.
- **Atenção aos detalhes**: ícone SVG, cópia para `dist`, tema dark opcional, permissões.
- **README detalhado**: este guia cobre instalação, execução, testes e troubleshooting.
- **Boas práticas n8n**: node programático para lógica custom, helpers HTTP do n8n, sem credenciais desnecessárias.

---

## 📋 Checklist final

- [ ] `npm run build` gera `dist/nodes/Random/Random.node.js` **e** `random.svg`.
- [ ] `docker compose up -d` sobe **db** e **n8n** com sucesso.
- [ ] Node **Random** aparece no editor e executa retornando número válido.
- [ ] Sem pasta `credentials/` no `dist` (não usamos neste projeto).
- [ ] Sem warnings bloqueantes (permissões tratadas; `version` removida do compose se preferir).

---

## 📄 Licença

MIT (ou adapte conforme sua necessidade).
