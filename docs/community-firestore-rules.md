# Arquitetura de Regras de Segurança da Comunidade

Este documento detalha as regras de segurança do Firestore para a funcionalidade "Comunidade" do aplicativo Verbo Vivo. O objetivo é garantir um ambiente seguro, onde os membros possam interagir de forma significativa, mantendo o controle sobre seu próprio conteúdo.

## Filosofia de Segurança

A estratégia de segurança para a comunidade se baseia em três princípios fundamentais:

1.  **Acesso por Associação:** Apenas membros verificados de uma congregação podem visualizar e interagir com o conteúdo dessa comunidade.
2.  **Propriedade do Conteúdo:** O criador de um post ou comentário é o único que pode modificá-lo ou excluí-lo.
3.  **Abertura para Interação:** Qualquer membro da comunidade pode interagir com o conteúdo dos outros, seja comentando ou curtindo.

## Estrutura das Regras

As regras são aplicadas na coleção `congregations` e em suas subcoleções (`members`, `posts`, `comments`, `likes`).

---

### 1. Coleção `congregations`

Controla o acesso à própria congregação.

```
match /congregations/{congregationId} {
    allow read: if isSignedIn();
    allow create: if isSignedIn() && request.auth.uid == request.resource.data.createdBy;
    allow update, delete: if isCongregationAdmin(congregationId);
}
```

-   **`allow read`**: Qualquer usuário autenticado (`isSignedIn()`) pode ler as informações básicas de uma congregação. Isso é útil para, por exemplo, exibir o nome da congregação em uma solicitação pendente.
-   **`allow create`**: Um usuário autenticado pode criar uma congregação, desde que ele se defina como o criador (`createdBy`).
-   **`allow update, delete`**: Apenas administradores (`isCongregationAdmin()`) podem editar os detalhes ou excluir uma congregação.

---

### 2. Subcoleção `members`

Gerencia quem pertence a uma congregação e seus status.

```
match /members/{userId} {
    allow read, list: if isCongregationMember(congregationId);
    allow create: if isSignedIn() && request.auth.uid == userId;
    allow update: if isCongregationAdmin(congregationId);
    allow delete: if isCongregationAdmin(congregationId) || request.auth.uid == userId;
}
```

-   **`allow read, list`**: Apenas membros da mesma congregação (`isCongregationMember()`) podem ver a lista de outros membros.
-   **`allow create`**: Um usuário pode criar um documento para si mesmo, o que representa uma solicitação para entrar na congregação.
-   **`allow update`**: Apenas administradores podem atualizar o status de um membro (ex: aprovar um pedido).
-   **`allow delete`**: Um administrador pode remover um membro, ou um membro pode remover a si mesmo (sair da congregação).

---

### 3. Subcoleção `posts`

Controla as publicações no feed da comunidade. **Esta é a seção mais crítica para a interação.**

```
match /posts/{postId} {
    allow read: if isCongregationMember(congregationId);
    allow create: if isCongregationMember(congregationId) && request.auth.uid == request.resource.data.authorId;
    allow update, delete: if isProfileOwner(resource.data.authorId);

    // ... regras para subcoleções de comments e likes ...
}
```

-   **`allow read`**: Qualquer membro da congregação pode ler os posts.
-   **`allow create`**: Qualquer membro pode criar um novo post, desde que se identifique como o autor.
-   **`allow update, delete`**: Apenas o proprietário do post (`isProfileOwner()`) pode editá-lo ou excluí-lo.

---

### 4. Subcoleção `comments`

Controla os comentários dentro de um post.

```
match /comments/{commentId} {
    allow read: if isCongregationMember(congregationId);
    allow create: if isCongregationMember(congregationId) && request.auth.uid == request.resource.data.authorId;
    allow update, delete: if isProfileOwner(resource.data.authorId);
}
```

-   **`allow create`**: **A regra chave.** Qualquer membro da congregação (`isCongregationMember()`) pode criar um comentário em qualquer post, desde que se identifique como autor no documento do comentário.
-   **`allow update, delete`**: Apenas o autor do comentário pode editá-lo ou excluí-lo.

---

### 5. Subcoleção `likes`

Gerencia as curtidas em um post.

```
match /likes/{userId} {
    allow read: if isCongregationMember(congregationId);
    allow create, delete: if isCongregationMember(congregationId) && request.auth.uid == userId;
}
```

-   **`allow create, delete`**: Um membro da congregação só pode adicionar ou remover sua própria curtida. O `userId` no documento de `like` deve ser o mesmo do usuário autenticado.

Esta arquitetura de regras garante um ambiente comunitário funcional e seguro, onde a interação é incentivada, mas a propriedade do conteúdo é respeitada.
