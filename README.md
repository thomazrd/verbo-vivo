
# Verbo Vivo - Seu Assistente de Discipulado Digital

Verbo Vivo é uma plataforma digital interativa projetada para aprofundar sua jornada de fé e estudo bíblico. Combinando ferramentas de leitura, meditação, comunidade e inteligência artificial, o Verbo Vivo oferece uma experiência personalizada e enriquecedora para o seu crescimento espiritual.

## ✨ Funcionalidades

*   **Leitura da Bíblia:** Acesse diversas versões da Bíblia, navegue por livros, capítulos e versículos de forma intuitiva.
*   **Resumos e Explicações com IA:** Obtenha resumos e explicações de capítulos ou trechos bíblicos gerados por IA para uma compreensão rápida dos principais temas e contextos.
*   **Chat com IA:** Converse com um assistente virtual para tirar dúvidas, explorar temas bíblicos e receber insights.
*   **Planos de Estudo Personalizados:** Crie ou receba sugestões de planos de estudo bíblico adaptados aos seus interesses e ritmo.
*   **Jornada de Sentimentos:** Uma ferramenta guiada por IA para ajudar a processar emoções à luz das Escrituras, oferecendo conforto e perspectiva bíblica.
*   **Santuário de Oração:** Um espaço para orar em voz alta e receber uma reflexão devocional baseada em sua oração, gerada por IA.
*   **Diário Espiritual:** Registre suas reflexões, orações e aprendizados em um espaço pessoal e seguro.
*   **Comunidade (Congregação):** Crie ou junte-se a uma comunidade (congregação) para compartilhar postagens, fotos, vídeos, comentários e interagir com outros membros.
*   **Artigos e Reflexões:** Um módulo de blog onde administradores da comunidade podem criar e publicar artigos, com um editor de texto completo (Markdown) e imagens de capa.
*   **Perfis de Personagens Bíblicos:** Explore perfis detalhados de personagens bíblicos, com resumos, versículos-chave e planos de estudo.
*   **Ponte da Esperança:** Gere mensagens de esperança e conforto, baseadas em versículos, para compartilhar com amigos que estão passando por dificuldades.
*   **Confessionário:** Um espaço privado e seguro para confessar pecados e receber uma palavra de perdão e graça, fundamentada nas escrituras.
*   **Onboarding Personalizado:** Configure suas preferências e objetivos para uma experiência adaptada desde o início.
*   **Configurações de Idioma e IA:** Personalize sua experiência escolhendo o idioma da interface e o modelo de IA (rápido ou avançado) de sua preferência.

### Confessionário: Um Espaço Seguro para a Graça

Esta funcionalidade foi desenhada para ser um ambiente privado e seguro, incentivando a prática espiritual da confissão.

#### Como Funciona?

1.  **Acesso Intencional:** Para entrar, o usuário precisa pressionar e segurar um ícone de cadeado. Esse ato simbólico garante que a entrada no confessionário seja um passo deliberado.
2.  **Confissão por Voz ou Texto:** O usuário pode confessar seus pecados falando ao microfone ou digitando. A interface foi projetada para ser um ouvinte passivo e sem julgamentos.
3.  **Privacidade Absoluta:** A confissão, seja em áudio ou texto, **não é salva em nenhum lugar**. Ela é processada em memória e descartada imediatamente após a interação, garantindo total privacidade e segurança.
4.  **Resposta de Graça:** Após a submissão, a IA analisa a confissão e gera uma resposta pastoral. Em vez de penitências, a IA oferece uma reflexão compassiva, fundamentada em 2 a 3 versículos bíblicos relevantes que falam sobre o perdão, a misericórdia e o amor incondicional de Deus.
5.  **Foco na Promessa:** O objetivo é reforçar a certeza do perdão que é oferecido em Cristo, transformando um ato de vulnerabilidade em um momento de encontro com a graça.

#### O Valor Bíblico

A prática da confissão é um pilar fundamental na vida cristã, baseada em promessas claras da Palavra de Deus.

*   **Fundamento Principal (1 João 1:9):** *"Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça."* O confessionário do Verbo Vivo é uma ferramenta para viver esta promessa. Ele não substitui a confissão a Deus ou a uma comunidade de irmãos, mas serve como um catalisador para que o crente se aproprie dessa verdade diariamente.
*   **Alcançar Misericórdia (Provérbios 28:13):** *"O que encobre as suas transgressões nunca prosperará, mas o que as confessa e deixa, alcançará misericórdia."* A funcionalidade incentiva a não esconder o pecado, mas a trazê-lo à luz para receber a misericórdia de Deus.
*   **Foco no Perdão, Não na Penitência:** Diferente de um confessionário tradicional, o foco aqui não é na penitência, mas na celebração da graça. A resposta da IA é sempre direcionada para a obra consumada de Cristo na cruz, que é a fonte de todo perdão.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** [Next.js](https://nextjs.org/) (React)
*   **Backend & Autenticação:** [Firebase](https://firebase.google.com/) (Firestore, Authentication, Cloud Functions, Storage)
*   **Inteligência Artificial:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
*   **UI Framework:** [Shadcn UI](https://ui.shadcn.com/) (construído sobre Tailwind CSS e Radix UI)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

*   [Node.js](https://nodejs.org/) (versão 20 ou superior)
*   [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
*   [Firebase CLI](https://firebase.google.com/docs/cli)

### Configuração do Firebase

1.  Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2.  Ative os serviços de **Authentication** (com o provedor Google), **Firestore** e **Storage**.
3.  Nas configurações do seu projeto Firebase, adicione um aplicativo da Web.
4.  Copie as credenciais do Firebase (apiKey, authDomain, etc.).
5.  Atualize o arquivo `src/lib/firebase.ts` com as credenciais do seu projeto.
6.  Para as Cloud Functions, configure a autenticação do Firebase CLI no seu ambiente local executando `firebase login`.

### Configuração do Genkit (Google AI)

1.  Certifique-se de ter um projeto no Google Cloud com a API Gemini habilitada.
2.  Configure a autenticação para o Genkit/Google AI conforme a documentação oficial. Isso pode envolver a configuração de variáveis de ambiente como `GOOGLE_API_KEY` ou o uso do `gcloud auth application-default login`.
3.  As chaves e configurações da API do Google AI são gerenciadas pelo Genkit, que busca automaticamente as credenciais do ambiente.

### Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DO_DIRETORIO>
    ```

2.  **Instale as dependências (raiz e functions):**
    ```bash
    npm install
    cd functions
    npm install
    cd ..
    ```

3.  **Execute o servidor de desenvolvimento do Next.js:**
    ```bash
    npm run dev
    ```
    A aplicação Next.js estará disponível em `http://localhost:3000`.

4.  **Execute o servidor de desenvolvimento do Genkit (para as funcionalidades de IA):**
    Em um novo terminal, na raiz do projeto:
    ```bash
    npm run genkit:watch
    ```
    O servidor Genkit (ferramentas de IA) estará disponível em `http://localhost:4000` (ou outra porta, verifique o output do terminal).
    
5. **Execute o emulador de Cloud Functions:**
   Para testar as funções de notificações e gerenciamento de comunidade localmente, execute em um novo terminal:
   ```bash
   firebase emulators:start --only functions
   ```

## 🔍 Debugando Erros de Produção

Erros que ocorrem apenas no ambiente de produção (erros 500, por exemplo) geralmente são erros do lado do servidor. Como a aplicação Next.js é servida por uma Cloud Function no Firebase, os logs detalhados desses erros podem ser encontrados no **Google Cloud Logging**.

### Passo a Passo para Encontrar a Causa do Erro

1.  **Acesse o Logs Explorer:** [Clique aqui para ir para o Google Cloud Logs Explorer](https://console.cloud.google.com/logs/viewer).
2.  **Selecione o Projeto Correto:** Garanta que o projeto no topo da página seja o mesmo do seu Firebase.
3.  **Filtre por Função e Severidade:** Use a caixa de consulta para filtrar os erros da sua aplicação. Uma consulta útil é:
    ```
    resource.type="cloud_function"
    resource.labels.function_name="ssrinovai-pr4x6"
    severity>=ERROR
    ```
    *Substitua `ssrinovai-pr4x6` pelo nome da função do seu projeto, se for diferente. Você pode encontrar o nome da função no seu [Painel do Firebase](https://console.firebase.google.com/project/_/functions).*

4.  **Interprete o Log de Erro:** Ao encontrar um erro, clique nele para expandir os detalhes. Procure por duas informações cruciais:
    *   **Mensagem de Erro:** A primeira linha, geralmente em vermelho, que descreve *o que* deu errado.
    *   **Stack Trace (Rastreamento da Pilha):** Uma lista de arquivos e números de linha que mostra *onde* o erro ocorreu.

    **Exemplo Prático de Stack Trace:**
    ```
    Error: Value for argument "document" is not a valid Firestore document. ...
        at WriteBatch.set (node_modules/@google-cloud/firestore/build/src/write-batch.js:288:23)
        at /srv/src/app/(main)/community/page.tsx:154:19  <-- FOQUE AQUI
        at ...
    ```
    Neste exemplo, o erro `not a valid Firestore document` aconteceu no seu código, no arquivo `src/app/(main)/community/page.tsx`, na linha `154`. Vá até essa linha no seu editor de código para encontrar e corrigir o problema.

## Firestore Data Model

Esta seção descreve as coleções e estruturas chave no Firestore.

### `users` Collection

*   **Document ID:** `userId` (o mesmo do Firebase Auth UID)
*   **Descrição:** Armazena informações de perfil do usuário.
*   **Campos:**
    *   `uid`: (string) ID do Usuário.
    *   `email`: (string|null) Endereço de e-mail do usuário.
    *   `displayName`: (string|null) Nome de exibição do usuário.
    *   `photoURL`: (string|null) URL da foto de perfil do usuário.
    *   `createdAt`: (Timestamp) Data de criação da conta.
    *   `onboardingCompleted`: (boolean) Flag que indica se o usuário completou o onboarding.
    *   `congregationId`: (string|null) ID da congregação à qual o usuário pertence ou solicitou entrada.
    *   `congregationStatus`: (string|null) Status do usuário na congregação ('MEMBER', 'PENDING', 'ADMIN', 'NONE').
    *   `preferredLanguage`: (string|null) Código do idioma de preferência do usuário (ex: "pt", "en").
    *   `preferredModel`: (string|null) Modelo de IA de preferência do usuário (ex: "gemini-1.5-flash").

### `congregations` Collection

*   **Document ID:** ID único gerado automaticamente.
*   **Descrição:** Armazena informações sobre as comunidades.
*   **Campos:** `name`, `city`, `pastorName`, `admins` (mapa), `memberCount`, `inviteCode`, etc.
*   **Subcoleções:**
    *   `members`: Documentos para cada membro da congregação.
    *   `posts`: Publicações da comunidade.
        *   **Subcoleções de `posts`:** `comments`, `likes`.

### Outras Coleções Principais

*   `articles`: Armazena os artigos do blog.
*   `journals`: Entradas do diário pessoal de cada usuário.
*   `notifications`: Notificações no aplicativo para os usuários.
*   `prayers`: Orações gravadas no Santuário de Oração.
*   e mais...

## 🤝 Como Contribuir

Agradecemos o interesse em contribuir com o Verbo Vivo! No momento, estamos estruturando nosso processo de contribuição. Em breve, adicionaremos mais informações sobre como você pode participar.

Algumas áreas onde futuras contribuições seriam bem-vindas:

*   Novas funcionalidades
*   Melhorias na interface do usuário (UI/UX)
*   Otimizações de performance
*   Traduções para outros idiomas
*   Correção de bugs
*   Testes automatizados

## 📄 Licença

Este projeto é distribuído sob a licença MIT. (Nota: Adicionar um arquivo LICENSE ao projeto).
