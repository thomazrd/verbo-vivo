# Arquitetura Técnica Detalhada: Verbo Vivo

A aplicação "Verbo Vivo" é uma plataforma web moderna e interativa, construída com uma arquitetura full-stack baseada em JavaScript/TypeScript, que integra de forma coesa tecnologias de frontend, backend serverless e inteligência artificial.

---

#### **1. Frontend (Interface do Usuário e Lógica do Cliente)**

*   **Framework Principal:** **Next.js 14+** com **React 18+**. A arquitetura é centrada no **App Router** do Next.js, priorizando a renderização no servidor (React Server Components) para um carregamento inicial rápido e melhor SEO. Componentes interativos são explicitamente designados como Client Components (`"use client";`).
*   **Linguagem:** **TypeScript**. Todo o ecossistema do frontend é estritamente tipado, garantindo robustez, prevenção de erros em tempo de compilação e uma experiência de desenvolvimento superior.
*   **Estilização e Componentes de UI:**
    *   **Shadcn/UI:** Utilizado como o principal construtor de componentes de UI. Em vez de ser uma biblioteca tradicional, funciona como uma coleção de componentes React acessíveis e reutilizáveis.
    *   **Tailwind CSS:** É a base para toda a estilização. A configuração utiliza classes utilitárias para um desenvolvimento rápido e um design consistente, com um tema centralizado no `globals.css` que usa variáveis CSS HSL para fácil customização.
    *   **Radix UI:** Fornece os primitivos de UI de baixo nível (sem estilo) para os componentes do Shadcn, garantindo total acessibilidade e comportamento previsível.
    *   **Lucide React:** A biblioteca de ícones padrão, perfeitamente integrada ao ecossistema de componentes.
    *   **Framer Motion & Embla Carousel:** Utilizados para animações fluidas e componentes de carrossel, melhorando a experiência do usuário.

#### **2. Backend e Infraestrutura (Plataforma Serverless)**

*   **Plataforma Principal:** **Firebase (Google Cloud)**. A aplicação é profundamente integrada com o ecossistema Firebase, utilizando-o como seu principal provedor de Backend-as-a-Service (BaaS).
    *   **Banco de Dados:** **Firestore**. Um banco de dados NoSQL, escalável e em tempo real, que armazena todos os dados da aplicação, incluindo perfis de usuário (`users`), comunidades (`congregations`), publicações (`posts`), artigos, planos de estudo e muito mais.
    *   **Autenticação:** **Firebase Authentication**. Gerencia todo o ciclo de vida do usuário, incluindo cadastro, login e gerenciamento de sessões. A implementação atual suporta autenticação por Email/Senha e provedor social (Google).
    *   **Armazenamento de Arquivos:** **Firebase Storage**. Utilizado para armazenar arquivos binários enviados pelos usuários, como avatares de perfil e imagens de capa para os artigos do blog.
    *   **Lógica Serverless:** **Cloud Functions for Firebase**. Utilizadas para executar código de backend seguro em resposta a eventos (gatilhos do Firestore) ou a chamadas diretas da aplicação (Funções Chamáveis). O principal caso de uso implementado é o sistema de notificações, que reage a eventos como novos likes e comentários para notificar os usuários.
    *   **Hosting:** **Firebase Hosting** com integração para Frameworks. O projeto está configurado para o deploy otimizado da aplicação Next.js, gerenciando a divisão entre assets estáticos, funções de renderização no servidor e componentes de API.

#### **3. Inteligência Artificial (Funcionalidades Generativas)**

*   **Framework de IA:** **Genkit (do Google)**. É o orquestrador central para todas as funcionalidades de IA. A lógica é organizada em "flows" (`src/ai/flows`), que são funções server-side (`'use server';`) seguras, chamadas diretamente pelos componentes React.
*   **Modelos de Linguagem:** A aplicação utiliza a família de modelos **Gemini do Google** (ex: `gemini-1.5-flash`, `gemini-1.5-pro`), acessada através do plugin `@genkit-ai/googleai`. As configurações do usuário permitem a escolha entre modelos otimizados para velocidade ou para capacidade avançada.
*   **Funcionalidades de IA Implementadas:**
    *   **Análise e Geração de Conteúdo:** Resumos de capítulos bíblicos, explicações de passagens e criação de conteúdo devocional.
    *   **Interação Conversacional:** Chat com a Bíblia e assistentes virtuais para responder a perguntas dos usuários.
    *   **Personalização:** Criação de planos de estudo, reflexões para a "Jornada de Sentimentos" e mensagens personalizadas na "Ponte da Esperança".
    *   **Sugestões Inteligentes:** Sugestões de versículos para funcionalidades como a "Minha Armadura".

#### **4. Testes, Qualidade e CI/CD**

*   **Testes:**
    *   **Framework:** **Jest** e **React Testing Library**. A configuração é otimizada para o ambiente Next.js.
    *   **Estratégia:** O foco é em testes unitários e de integração que **isolam os componentes de dependências externas (como o Firebase)** através de mocking, garantindo testes rápidos e confiáveis.
    *   **Utilitários:** Uma base de código para testes reutilizáveis (`src/testing/test-utils.tsx`) centraliza mocks e dados de teste, e um guia (`TESTING-GUIDELINES.md`) padroniza a escrita de novos testes.
*   **Qualidade de Código:** **ESLint** e **Prettier** (implícito pela formatação) são usados para manter um estilo de código consistente e livre de erros comuns.
*   **Deploy e Automação (CI/CD):**
    *   **GitHub Actions:** O projeto utiliza um workflow de CI/CD para automação. Em cada push para a branch principal (`secure-master`), o workflow automaticamente instala as dependências, compila a aplicação Next.js e faz o deploy da versão mais recente para o Firebase Hosting.
