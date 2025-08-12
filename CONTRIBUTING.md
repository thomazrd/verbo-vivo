# Como Contribuir para o Verbo Vivo

Primeiramente, muito obrigado pelo seu interesse em contribuir com o Verbo Vivo! Somos uma comunidade que busca usar a tecnologia para aprofundar a jornada de fé de milhares de pessoas. Toda contribuição, grande ou pequena, é valiosa para nós.

Este documento é um guia para ajudar você a fazer sua contribuição.

## Código de Conduta

Ao participar deste projeto, você concorda em seguir nosso [Código de Conduta](CODE_OF_CONDUCT.md). Esperamos que todas as interações sejam respeitosas e construtivas.

## Como Posso Ajudar?

Existem muitas maneiras de contribuir com o Verbo Vivo:

*   **Reportando Bugs:** Se você encontrar um erro na aplicação, por favor, nos informe.
*   **Sugerindo Melhorias:** Tem uma ideia para uma nova funcionalidade ou para melhorar uma existente? Adoraríamos ouvir.
*   **Escrevendo Código:** Ajude-nos a consertar bugs ou a construir novas funcionalidades.
*   **Melhorando a Documentação:** Uma documentação clara é fundamental. Se você ver algo que pode ser melhorado, nos ajude!

## Primeiros Passos

Antes de começar, você precisará configurar o ambiente de desenvolvimento. Por favor, siga as instruções detalhadas na seção **"Como Executar o Projeto"** do nosso arquivo [README.md](README.md).

## Processo de Pull Request (PR)

Para contribuir com código, por favor, siga este processo:

1.  **Faça um "Fork" do repositório:** Crie uma cópia do nosso repositório na sua própria conta do GitHub.
2.  **Crie uma Nova Branch:** A partir da branch `master`, crie uma nova branch para suas alterações. Use um nome descritivo, como `feat/nova-funcionalidade` ou `fix/bug-no-login`.
    ```bash
    git checkout -b feat/minha-nova-feature
    ```
3.  **Faça suas Alterações:** Implemente o código, garantindo que você siga as diretrizes de estilo do projeto.
4.  **Faça o "Commit" de suas Alterações:** Use mensagens de commit claras e descritivas.
    ```bash
    git commit -m "feat: Adiciona a funcionalidade X que faz Y"
    ```
5.  **Envie sua Branch para seu Fork:**
    ```bash
    git push origin feat/minha-nova-feature
    ```
6.  **Abra um Pull Request:** No repositório original do Verbo Vivo, abra um Pull Request da sua branch para a branch `master`.
7.  **Descreva seu PR:** Preencha o template do Pull Request com uma descrição clara do que você fez, por que fez e como isso pode ser testado.

## Guias de Estilo

### Mensagens de Commit

Utilizamos o padrão "Conventional Commits". Isso nos ajuda a manter um histórico de commits legível e a automatizar a geração de changelogs. Exemplos:
*   `feat:` para novas funcionalidades.
*   `fix:` para correções de bugs.
*   `docs:` para alterações na documentação.
*   `style:` para formatação de código.
*   `refactor:` para refatorações que não alteram a funcionalidade.
*   `chore:` para tarefas de manutenção.

### Estilo de Código

O projeto está configurado com **ESLint** e **Prettier** para manter um estilo de código consistente. Por favor, certifique-se de que seu editor está configurado para usá-los e formate seu código antes de fazer o commit.

Agradecemos novamente por sua dedicação e por se juntar a nós nesta missão!
