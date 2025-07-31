# Arquitetura Técnica: Centro de Comando e Treinamento

Este documento detalha a arquitetura de dados e as regras de segurança para a funcionalidade "Centro de Comando e Treinamento" (Planos de Batalha).

## 1. Modelo de Dados no Firestore

A funcionalidade utiliza três coleções principais para gerenciar os planos, o progresso dos usuários e os logs de missões.

### Coleção `battlePlans`

Armazena a definição de cada Plano de Batalha criado por um líder.

- **Document ID:** ID único gerado automaticamente.
- **Descrição:** Contém o conteúdo estático de um plano.
- **Campos:**
    - `title`: (string) Título do plano.
    - `description`: (string) Descrição do plano.
    - `durationDays`: (number) Duração em dias.
    - `coverImageUrl`: (string) URL da imagem de capa.
    - `creatorId`: (string) UID do usuário que criou o plano.
    - `creatorName`: (string) Nome do criador.
    - `status`: (string) `DRAFT`, `PUBLISHED`, `ARCHIVED`.
    - `missions`: (array de objetos `Mission`) Lista de todas as missões do plano.
        - `id`: (string) ID único da missão.
        - `day`: (number) Dia em que a missão deve ser realizada.
        - `title`: (string) Título da missão.
        - `type`: (string) `BIBLE_READING`, `PRAYER`, `REFLECTION`.
        - `content`: (map) Objeto com o conteúdo da missão (ex: `{ verse: 'Filipenses 4:13' }`).
        - `leaderNote`: (string, opcional) Nota do líder para a missão.
    - `createdAt`: (Timestamp) Data de criação.
    - `updatedAt`: (Timestamp) Data da última atualização.

### Coleção `userBattlePlans`

Armazena o progresso de cada usuário em um plano específico.

- **Document ID:** ID único gerado automaticamente.
- **Descrição:** Vincula um usuário a um plano e rastreia seu progresso.
- **Campos:**
    - `userId`: (string) UID do usuário (soldado).
    - `planId`: (string) ID do `battlePlans` que o usuário iniciou.
    - `planTitle`: (string) Título do plano (desnormalizado).
    - `planCoverImageUrl`: (string) Imagem de capa (desnormalizada).
    - `planCreatorId`: (string) ID do criador do plano (desnormalizado).
    - `startDate`: (Timestamp) Data em que o usuário iniciou o plano.
    - `status`: (string) `IN_PROGRESS`, `COMPLETED`.
    - `progressPercentage`: (number) Percentual de conclusão.
    - `consentToShareProgress`: (boolean) **Flag crucial.** `true` se o usuário consentiu em compartilhar seu status com o líder.
    - `completedMissionIds`: (array de strings) Lista de IDs das missões concluídas.

### Coleção `missionLogs`

Registra a conclusão de cada missão individual e o sentimento do usuário.

- **Document ID:** ID único gerado automaticamente.
- **Descrição:** Log de cada missão concluída.
- **Campos:**
    - `userId`: (string) UID do usuário.
    - `planId`: (string) ID do plano.
    - `missionId`: (string) ID da missão.
    - `completedAt`: (Timestamp) Data da conclusão.
    - `feeling`: (string) `GRATEFUL`, `CHALLENGED`, `PEACEFUL`, `STRENGTHENED`, `SKIPPED`.

## 2. Regras de Segurança do Firestore

As regras são projetadas para proteger a privacidade do usuário, permitindo o acompanhamento consentido pelo líder.

### `rules/collections/battlePlans.rules`

```
// collections/battlePlans.rules

// Função auxiliar para verificar se o usuário é o criador de um plano
function isPlanCreator(planId) {
  return request.auth.uid == get(/databases/$(database)/documents/battlePlans/$(planId)).data.creatorId;
}

match /battlePlans/{planId} {
  // Leitura: Qualquer usuário autenticado pode ler planos publicados.
  allow read: if isSignedIn() && resource.data.status == 'PUBLISHED';

  // Criação: Qualquer usuário autenticado pode criar um plano (será um líder).
  allow create: if isSignedIn();

  // Atualização e Exclusão: Apenas o criador original do plano pode modificar ou apagar.
  allow update, delete: if isSignedIn() && isPlanCreator(planId);

  // Regras para a subcoleção de missões (geralmente gerenciada junto com o plano)
  match /missions/{missionId} {
    allow read: if isSignedIn();
    // A escrita (create, update, delete) de missões é controlada pela permissão de 'update' do plano pai.
    allow write: if isSignedIn() && isPlanCreator(planId);
  }
}

match /userBattlePlans/{userPlanId} {
  // Leitura: Um usuário pode ler seu próprio progresso.
  // Um LÍDER pode ler o progresso de um soldado SE o soldado deu consentimento.
  allow read: if isProfileOwner(request.auth.uid) ||
              (isSignedIn() && resource.data.consentToShareProgress == true &&
               request.auth.uid == resource.data.planCreatorId);

  // Criação: Um usuário pode criar seu próprio registro de progresso (iniciar um plano).
  allow create: if isProfileOwner(request.resource.data.userId);

  // Atualização: Um usuário só pode atualizar seu próprio progresso.
  allow update: if isProfileOwner(request.auth.uid);

  // Exclusão: Um usuário só pode apagar seu próprio progresso.
  allow delete: if isProfileOwner(request.auth.uid);
}

match /missionLogs/{logId} {
  // Um usuário só pode ler, criar, atualizar ou apagar seus próprios logs de missão.
  allow read, write: if isProfileOwner(request.auth.uid);
}
```

Esta arquitetura garante um sistema seguro e funcional, onde os líderes podem criar conteúdo e acompanhar suas comunidades de forma saudável, e os soldados têm controle total sobre sua privacidade e progresso!
