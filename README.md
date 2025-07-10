# Verbo Vivo - Seu Assistente de Discipulado Digital

Verbo Vivo é uma plataforma digital interativa projetada para aprofundar sua jornada de fé e estudo bíblico. Combinando ferramentas de leitura, meditação, comunidade e inteligência artificial, o Verbo Vivo oferece uma experiência personalizada e enriquecedora para o seu crescimento espiritual.

## ✨ Funcionalidades

*   **Leitura da Bíblia:** Acesse diversas versões da Bíblia, navegue por livros, capítulos e versículos de forma intuitiva.
*   **Resumos Inteligentes:** Obtenha resumos de capítulos gerados por IA para uma compreensão rápida dos principais temas.
*   **Chat com IA:** Converse com um assistente virtual para tirar dúvidas, explorar temas bíblicos e receber insights.
*   **Planos de Estudo Personalizados:** Crie ou receba sugestões de planos de estudo bíblico adaptados aos seus interesses e ritmo.
*   **Meditações Guiadas:** Desfrute de meditações baseadas em passagens bíblicas, geradas para promover reflexão e paz interior.
*   **Diário Espiritual:** Registre suas reflexões, orações e aprendizados em um espaço pessoal e seguro.
*   **Círculos de Oração:** Conecte-se com outros usuários, compartilhe pedidos de oração e ore em comunidade.
*   **Comunidade e Compartilhamento:** Interaja com outros membros, discuta passagens e compartilhe suas descobertas (funcionalidade em desenvolvimento).
*   **Onboarding Personalizado:** Configure suas preferências e objetivos para uma experiência adaptada desde o início.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** [Next.js](https://nextjs.org/) (React)
*   **Backend & Autenticação:** [Firebase](https://firebase.google.com/) (Firestore, Authentication)
*   **Inteligência Artificial:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
*   **UI Framework:** [Shadcn UI](https://ui.shadcn.com/) (construído sobre Tailwind CSS e Radix UI)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

*   [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
*   [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Configuração do Firebase

1.  Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2.  Ative os serviços de **Authentication** (com o provedor Google) e **Firestore**.
3.  Nas configurações do seu projeto Firebase, adicione um aplicativo da Web.
4.  Copie as credenciais do Firebase (apiKey, authDomain, etc.).
5.  Renomeie o arquivo `.env.example` (se existir) para `.env.local` ou crie um novo arquivo `.env.local` na raiz do projeto.
6.  Adicione suas credenciais do Firebase ao arquivo `.env.local`, seguindo o formato das variáveis de ambiente usadas em `src/lib/firebase.ts`. (Nota: Atualmente, as credenciais estão diretamente no código em `src/lib/firebase.ts`, o que não é recomendado para produção. O ideal é movê-las para variáveis de ambiente).

    Exemplo de como as variáveis de ambiente seriam configuradas (se o código fosse refatorado para usá-las):
    ```bash
    NEXT_PUBLIC_FIREBASE_API_KEY=SUA_API_KEY
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=SEU_AUTH_DOMAIN
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=SEU_PROJECT_ID
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=SEU_STORAGE_BUCKET
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=SEU_MESSAGING_SENDER_ID
    NEXT_PUBLIC_FIREBASE_APP_ID=SEU_APP_ID
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=SEU_MEASUREMENT_ID
    ```

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

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Execute o servidor de desenvolvimento do Next.js:**
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
    A aplicação Next.js estará disponível em `http://localhost:3000`.

4.  **Execute o servidor de desenvolvimento do Genkit (para as funcionalidades de IA):**
    Em um novo terminal, na raiz do projeto:
    ```bash
    npm run genkit:dev
    # ou
    yarn genkit:dev
    ```
    O servidor Genkit (ferramentas de IA) estará disponível em `http://localhost:4000` (ou outra porta, verifique o output do terminal).

    Para desenvolvimento com recarregamento automático dos fluxos de IA:
    ```bash
    npm run genkit:watch
    # ou
    yarn genkit:watch
    ```

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

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes (Nota: Adicionar um arquivo LICENSE ao projeto).
