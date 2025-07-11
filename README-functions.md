# Guia para Implementação do Backend (Firebase Functions)

Este documento serve como um guia para o desenvolvedor responsável por finalizar o sistema de notificações do projeto Verbo Vivo.

## Status Atual

- **Frontend:** 100% pronto. A interface do usuário para notificações (sino, lista, itens) e a lógica para receber os dados do Firestore já estão implementadas no código Next.js (dentro da pasta `src`).
- **Backend:** **Pendente.** O código do backend, que é responsável por *gerar* as notificações, precisa ser criado e implantado.

## O Que Precisa Ser Feito

A pasta `functions`, que conterá o código do backend, **ainda não existe** neste projeto. Ela deve ser criada usando as ferramentas do Firebase.

### Passo 1: Inicializar o Firebase Functions

Na raiz deste projeto, execute o seguinte comando:

```bash
firebase init functions
```

Siga as instruções:
1.  Selecione "Use an existing project" e escolha o projeto Firebase correspondente.
2.  Escolha **TypeScript** como a linguagem.
3.  Concorde em usar o ESLint e instalar as dependências com `npm`.

Este processo criará a pasta `functions` na raiz do projeto.

### Passo 2: Adicionar o Código da Função

Navegue até a pasta recém-criada (`functions/src`) e substitua o conteúdo do arquivo `index.ts` pelo código de gatilhos de notificação.

> **Nota:** O código completo para o arquivo `index.ts` foi fornecido na especificação técnica detalhada. Ele contém toda a lógica para observar os eventos do Firestore (novos likes, comentários, etc.) e criar as notificações correspondentes.

### Passo 3: Implantar as Funções

Após adicionar o código e instalar as dependências (rodando `npm install` dentro da pasta `functions`), implante o backend no Firebase com o comando:

```bash
firebase deploy --only functions
```

Após a conclusão bem-sucedida, o sistema de notificações estará totalmente funcional.
