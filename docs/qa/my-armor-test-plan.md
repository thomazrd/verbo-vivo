
# Plano de Testes: Funcionalidade "Minha Armadura"

## 1. Objetivo

Este documento detalha os casos de teste para validar a funcionalidade "Minha Armadura" do aplicativo Verbo Vivo. O objetivo é garantir que a criação, edição, visualização, compartilhamento e interação com as armaduras (versículos) estejam funcionando conforme o esperado, tanto na visão pessoal quanto na comunitária.

## 2. Pré-requisitos

- Acesso ao ambiente de testes da aplicação.
- Pelo menos dois usuários de teste cadastrados e autenticados (Usuário A e Usuário B).
- Configuração do Firebase (Firestore, Auth) e Genkit (AI) funcionando no ambiente.
- Ambos os usuários devem ter completado o onboarding inicial.

---

## 3. Cenários de Teste

### 3.1. Onboarding da Armadura

| ID do Teste | Descrição do Teste | Passos de Execução | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **TC-A-01** | **Fluxo de Onboarding - Aceitar Chamado** | 1. Faça login como um novo usuário que não completou o onboarding da armadura.<br>2. Navegue para a seção "Minha Armadura".<br>3. Na primeira tela ("O Chamado"), clique em "Eu aceito o chamado". | O carrossel avança para a próxima tela ("Conheça seu Arsenal"). |
| **TC-A-02** | **Fluxo de Onboarding - Criar Armadura Pré-definida** | 1. Siga os passos de TC-A-01 até a tela "Sua Primeira Batalha".<br>2. Clique em um dos botões de batalha (ex: "Vencer a Ansiedade"). | 1. Um loader aparece com a mensagem "Forjando sua Armadura...".<br>2. Após o carregamento, o usuário é redirecionado para `/armor`.<br>3. Uma nova armadura chamada "Armadura para Vencer a Ansiedade" aparece na lista "Minhas Armaduras". |
| **TC-A-03** | **Fluxo de Onboarding - Forjar do Zero** | 1. Siga os passos de TC-A-01 até a tela "Sua Primeira Batalha".<br>2. Clique no link "Quero forjar a minha do zero". | O usuário é redirecionado para a página `/armor/forge` para criar uma nova armadura. |

### 3.2. Criação e Edição de Armaduras (Forja)

| ID do Teste | Descrição do Teste | Passos de Execução | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **TC-F-01** | **Criar uma armadura privada** | 1. Faça login.<br>2. Navegue para "Minha Armadura".<br>3. Clique no botão `+`.<br>4. Preencha o nome e a descrição.<br>5. **NÃO** marque a caixa "Compartilhar com a comunidade".<br>6. Adicione pelo menos um versículo (arma).<br>7. Clique em "Forjar Armadura". | 1. O usuário é redirecionado para `/armor`.<br>2. A nova armadura aparece na aba "Minhas Armaduras".<br>3. A armadura **NÃO** aparece na aba "Comunidade". |
| **TC-F-02** | **Criar uma armadura pública** | 1. Siga os passos de TC-F-01, mas **MARQUE** a caixa "Compartilhar com a comunidade".<br>2. Salve a armadura. | 1. A nova armadura aparece na aba "Minhas Armaduras".<br>2. Faça login como **Usuário B**.<br>3. A armadura criada pelo **Usuário A** aparece na aba "Comunidade". |
| **TC-F-03** | **Adicionar Arma com IA** | 1. Na tela de forja, clique em "Adicionar Arma".<br>2. No modal, digite um tema (ex: "Paciência") na seção da IA.<br>3. Clique no botão `Wand2`.<br>4. Clique no `+` para adicionar uma das sugestões. | 1. A IA retorna 3 sugestões de versículos.<br>2. O versículo escolhido é adicionado à lista de armas na tela de forja.<br>3. O modal permanece aberto, e a sugestão adicionada desaparece da lista do modal. |
| **TC-F-04** | **Adicionar Arma Manualmente** | 1. Na tela de forja, clique em "Adicionar Arma".<br>2. No modal, preencha os campos "Referência", "Texto do Versículo" e "Versão" na seção manual.<br>3. Clique em "Adicionar Arma". | O versículo inserido manualmente é adicionado à lista de armas na tela de forja. O modal permanece aberto e os campos manuais são limpos. |
| **TC-F-05** | **Remover e Reordenar Armas** | 1. Na tela de forja, adicione pelo menos 3 armas.<br>2. Clique no ícone de lixeira (`Trash2`) de uma das armas.<br>3. Use o ícone de arrastar (`GripVertical`) para mudar a ordem das armas restantes. | 1. A arma é removida da lista.<br>2. A ordem das armas é atualizada visualmente.<br>3. Ao salvar, a nova ordem é mantida. |
| **TC-F-06** | **Editar uma armadura (torná-la pública)** | 1. Edite uma armadura privada existente.<br>2. Marque a caixa "Compartilhar com a comunidade".<br>3. Salve as alterações. | 1. Faça login como **Usuário B**.<br>2. A armadura editada agora aparece na aba "Comunidade". |
| **TC-F-07** | **Editar uma armadura (torná-la privada)** | 1. Edite uma armadura pública existente.<br>2. Desmarque a caixa "Compartilhar com a comunidade".<br>3. Salve as alterações. | 1. Faça login como **Usuário B**.<br>2. A armadura editada **NÃO** deve mais aparecer na aba "Comunidade". |

### 3.3. Arsenal (Listagem de Armaduras)

| ID do Teste | Descrição do Teste | Passos de Execução | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **TC-L-01** | **Favoritar e Desfavoritar uma armadura** | 1. Na aba "Minhas Armaduras", clique no ícone de estrela (`Star`) em um card.<br>2. Recarregue a página.<br>3. Clique na estrela novamente. | 1. A estrela fica preenchida (amarela).<br>2. A armadura favoritada move-se para o topo da lista.<br>3. Após o recarregamento, o estado de favorito persiste.<br>4. Ao clicar novamente, a estrela fica vazia e a armadura retorna à sua posição original (ordenada por data). |
| **TC-L-02** | **Adicionar armadura da comunidade** | 1. Com o **Usuário A**, crie uma armadura pública.<br>2. Faça login com o **Usuário B** e vá para a aba "Comunidade".<br>3. Encontre a armadura do Usuário A e clique em "Adicionar às Minhas Armaduras". | 1. O botão muda para "Já Adicionada" com um ícone de check (`Check`).<br>2. Navegue para a aba "Minhas Armaduras".<br>3. A armadura copiada agora está na sua lista pessoal. |
| **TC-L-03** | **Visualizar versículos da comunidade** | 1. Na aba "Comunidade", clique no link "visualizar versículos" em um card. | Um modal abre, exibindo todos os versículos (armas) contidos naquela armadura. |
| **TC-L-04** | **Armaduras próprias não aparecem na comunidade** | 1. Como **Usuário A**, crie uma armadura e marque-a como compartilhada. | A armadura aparece na aba "Minhas Armaduras", mas **NÃO** deve aparecer na aba "Comunidade" para o **Usuário A**. |
| **TC-L-05** | **Lazy Loading da Comunidade** | 1. Crie várias armaduras públicas com diferentes usuários.<br>2. Faça login com um usuário e navegue para a aba "Comunidade".<br>3. Role a página para baixo. | 1. Inicialmente, apenas um lote de armaduras é carregado.<br>2. Ao rolar até o final da lista, um ícone de carregamento aparece brevemente e mais armaduras são carregadas. |
| **TC-L-06** | **Excluir uma armadura** | 1. Na aba "Minhas Armaduras", clique no menu de três pontos em um card.<br>2. Selecione "Desmontar".<br>3. Confirme na caixa de diálogo. | 1. A armadura é removida da lista.<br>2. Se a armadura era pública, ela também deve ser removida da aba "Comunidade" para outros usuários. |

### 3.4. Modo Batalha

| ID do Teste | Descrição do Teste | Passos de Execução | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **TC-B-01** | **Navegar no Modo Batalha** | 1. Na aba "Minhas Armaduras", clique em "Modo Batalha" em um card com múltiplas armas.<br>2. Use as setas de navegação para avançar e retroceder. | 1. A interface de tela cheia do Modo Batalha é exibida.<br>2. Cada clique nas setas mostra o próximo/anterior versículo da armadura. |
| **TC-B-02** | **Sair do Modo Batalha** | 1. Entre no Modo Batalha.<br>2. Clique no ícone de fechar (`X`). | O usuário é redirecionado de volta para a página `/armor`. |
