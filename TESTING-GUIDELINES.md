# Guia de Testes da Aplicação Verbo Vivo

Este documento estabelece as diretrizes e melhores práticas para a escrita de testes unitários e de integração na aplicação. O objetivo é garantir a qualidade, a manutenibilidade e a confiabilidade do código.

## Ferramentas

- **Framework de Teste:** [Jest](https://jestjs.io/)
- **Testes de Componentes React:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- **Mocks e Assertions:** Jest-DOM e mocks manuais.

## Filosofia de Teste

Seguimos a filosofia da React Testing Library:

> "Quanto mais seus testes se assemelharem à forma como seu software é usado, mais confiança eles poderão lhe dar."

Isso significa que nossos testes devem focar no comportamento do componente do ponto de vista do usuário, em vez de detalhes de implementação.

## Estrutura de Arquivos

- Arquivos de teste devem ser colocados em um diretório `tests` dentro da pasta do componente que está sendo testado.
- O nome do arquivo de teste deve seguir o padrão: `[NomeDoComponente].test.tsx`.

**Exemplo:**
```
src/
└── components/
    └── home/
        ├── WelcomeHeader.tsx
        └── tests/
            └── WelcomeHeader.test.tsx
```

## Escrevendo Testes

### Utilizando a Base de Testes Reutilizável

Para garantir que os componentes sejam renderizados em um ambiente consistente e isolado, criamos uma função utilitária `renderWithProviders`. Ela envolve o componente a ser testado com todos os provedores de contexto necessários (como `ThemeProvider`, `I18nextProvider`, etc.).

**Onde encontrar:** `src/testing/test-utils.tsx`

**Como usar:**
Importe `renderWithProviders` em seu arquivo de teste e use-o no lugar do `render` padrão da React Testing Library.

```javascript
import { renderWithProviders, screen } from '@/testing/test-utils';
import MeuComponente from '@/components/meu-componente/MeuComponente';

it('deve renderizar corretamente', () => {
  renderWithProviders(<MeuComponente />);

  expect(screen.getByText(/Texto esperado/i)).toBeInTheDocument();
});
```

### Mockando Dependências

Testes unitários devem ser independentes de serviços externos como Firebase, APIs, ou mesmo `next/router`.

#### Mocks Globais

Mocks para dependências comuns e globais (como Firebase, `next/router`, `next/navigation`) já estão configurados no arquivo `src/testing/setup-env.ts`. Este arquivo é carregado automaticamente pelo Jest antes da execução dos testes.

**Não é necessário mockar essas dependências em cada arquivo de teste.**

#### Mocks Específicos

Quando um componente depende de um hook customizado ou de um módulo específico, você deve mocká-lo diretamente no arquivo de teste usando `jest.mock`.

**Exemplo (mockando o hook `useAuth`):**
```javascript
import { renderWithProviders, screen } from '@/testing/test-utils';
import WelcomeHeader from '@/components/home/WelcomeHeader';

// Mock do hook useAuth
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Usuário Teste',
    },
    loading: false,
  }),
}));

describe('WelcomeHeader', () => {
  it('deve saudar o usuário', () => {
    renderWithProviders(<WelcomeHeader />);
    expect(screen.getByText(/Olá, Usuário Teste/i)).toBeInTheDocument();
  });
});
```

**Dica:** Ao mockar, forneça apenas os dados necessários para o teste. Se precisar testar diferentes cenários (ex: usuário logado vs. não logado, estado de carregamento), você pode usar `jest.spyOn` dentro de cada teste para alterar o valor do mock.

### Consultas (Queries)

Prefira usar as consultas da React Testing Library que são mais acessíveis e focadas no usuário.

- **`getByRole`:** A melhor opção. Procura por elementos com base em sua função na árvore de acessibilidade.
- **`getByLabelText`:** Para elementos de formulário.
- **`getByPlaceholderText`:** Para inputs com placeholders.
- **`getByText`:** Para encontrar elementos pelo seu conteúdo de texto.
- **`getByDisplayValue`:** Para encontrar elementos de formulário pelo seu valor atual.
- **`getByTestId`:** Use como último recurso, apenas se nenhuma das outras consultas for suficiente. Adicione o atributo `data-testid` ao seu elemento JSX.

## Executando os Testes

Para rodar todos os testes, execute o seguinte comando na raiz do projeto:

```bash
npm test
```

Para rodar os testes em modo "watch", que re-executa os testes a cada alteração de arquivo:

```bash
npm test -- --watch
```

---

Ao seguir estas diretrizes, garantimos que nossa base de código permaneça robusta, fácil de manter e com alta qualidade. Contribua para os testes sempre que adicionar ou modificar uma funcionalidade!
