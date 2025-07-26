# Guia para Implementação do Backend (Firebase Functions)

Este documento serve como um guia para o desenvolvedor responsável por finalizar o sistema de notificações do projeto Verbo Vivo.

## Status Atual

- **Frontend:** 100% pronto. A interface do usuário para notificações (sino, lista, itens) e a lógica para receber os dados do Firestore já estão implementadas no código Next.js (dentro da pasta `src`).
- **Backend (Estrutura):** A estrutura da pasta `functions` (com `package.json`, `tsconfig.json` e o código-fonte em `src/index.ts`) já está criada e configurada no `firebase.json`.

## O Que Precisa Ser Feito

A tarefa restante é instalar as dependências do backend e implantar as funções no Firebase.

### Passo 1: Instalar Dependências das Funções

Navegue até a pasta `functions` e instale as dependências npm:

```bash
cd functions
npm install
```

### Passo 2: Implantar as Funções

Após a instalação das dependências, retorne para a pasta raiz do projeto e execute o comando de deploy:

```bash
cd ..
firebase deploy --only functions
```

Após a conclusão bem-sucedida, o sistema de notificações estará totalmente funcional.
