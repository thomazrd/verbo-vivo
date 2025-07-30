# Arquitetando Regras do Firestore para Escala

Um guia interativo para transformar seu arquivo monolítico `firestore.rules` em um sistema modular, seguro e manutenível que cresce com sua aplicação.

## O Desafio do Arquivo Único

À medida que sua aplicação cresce, o arquivo `firestore.rules` também cresce, trazendo três desafios principais.

**🤯 Legibilidade e Carga Cognitiva**
Um arquivo com milhares de linhas é difícil de entender. Analisar a segurança de uma única coleção exige a leitura de todo o arquivo, aumentando a chance de erros.

**🤝 Conflitos e Colaboração**
Vários desenvolvedores trabalhando no mesmo arquivo `firestore.rules` leva a constantes conflitos de mesclagem (merge conflicts), atrasando o desenvolvimento.

**📏 Limites da Plataforma**
O Firebase impõe um limite de 256 KB no tamanho do arquivo de regras. Aplicações complexas podem atingir esse limite, impedindo novas implantações.

## Comparando as Ferramentas de Modularização

A comunidade desenvolveu várias ferramentas para resolver o problema.

| Ferramenta | Método | Source Maps |
|---|---|---|
| **@simpleclub/firebase-rules-generator** | `include "path.rules";` | **Sim** |
| firestore-rulez | Automático por pasta | Não |
| Concatenação Manual | Script (cat, Gulp) | Não |

**Recomendação:** `@simpleclub/firebase-rules-generator` é a melhor escolha para projetos sérios devido ao suporte a *source maps*, que é crucial para a depuração.

---

## Estrutura de Projeto Escalável

Uma boa organização de arquivos é a base de um sistema manutenível.

### 📂 Estrutura de Diretórios

```
rules/
├── collections/
│   ├── articles.rules
│   ├── congregations.rules
│   ├── studies.rules
│   └── users.rules
├── functions/
│   ├── auth.rules
│   └── validation.rules
└── index.rules
```

### 📄 Exemplos de Código

<details>
<summary><code>rules/index.rules</code> (O Orquestrador)</summary>

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Funções de utilidade devem ser incluídas primeiro
    include "functions/auth.rules";
    include "functions/validation.rules";

    // 2. Regras específicas das coleções
    include "collections/users.rules";
    include "collections/congregations.rules";
    include "collections/articles.rules";
    include "collections/studies.rules";
    // Adicione outras coleções aqui
  }
}
```
</details>

<details>
<summary><code>rules/functions/auth.rules</code> (Funções Reutilizáveis)</summary>

```
// Funções relacionadas à autenticação
function isSignedIn() {
  return request.auth != null;
}

function isUser(userId) {
  return isSignedIn() && request.auth.uid == userId;
}

// Outras funções de checagem de perfil poderiam vir aqui
// Ex: function isAdmin() { ... }
```
</details>

<details>
<summary><code>rules/collections/users.rules</code> (Regras de uma Coleção)</summary>

```
match /users/{userId} {
  allow read: if isSignedIn();
  allow write: if isUser(userId);

  // Regras para subcoleções de 'users'
  // match /plans/{planId} { ... }
}
```
</details>

---

## Automatizando o Fluxo de Trabalho

A automação garante consistência e integra a gestão de regras ao seu ciclo de desenvolvimento.

### Desenvolvimento Local (`package.json`)

```json
{
  "scripts": {
    "rules:build": "firebase-rules-generator rules/index.rules > firestore.rules",
    "rules:watch": "firebase-rules-generator --watch rules/index.rules > firestore.rules",
    "build": "npm run rules:build && next build"
  }
}
```

### CI/CD (GitHub Actions)

O arquivo `.github/workflows/firebase-deploy.yml` já existente pode ser adaptado para incluir o passo de build das regras antes do deploy.

---

## Testes e Depuração

Teste o arquivo compilado e use as ferramentas do emulador para garantir a segurança e a corretude das suas regras.

### Exemplo de Teste Unitário (posts.test.js)

Use `@firebase/rules-unit-testing` para simular operações e verificar se suas regras se comportam como esperado.

```javascript
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const fs = require("fs");

describe("Regras da coleção Posts", () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "seu-projeto-de-teste",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  test('deve negar a leitura para usuários não autenticados', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const postRef = db.collection('posts').doc('some-post');
    await assertFails(postRef.get());
  });

  test('deve permitir a leitura para usuários autenticados', async () => {
    const db = testEnv.authenticatedContext({ uid: 'alice' }).firestore();
    const postRef = db.collection('posts').doc('some-post');
    await assertSucceeds(postRef.get());
  });
});
```

Lembre-se, a segurança é um processo contínuo. Revise e teste suas regras regularmente.
