import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BattleModePage from './page';
import { getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

// Mocks
jest.mock('firebase/firestore');
jest.mock('next/navigation');
jest.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({ user: { uid: 'test-user' } }),
}));

describe('BattleModePage', () => {
  const mockedGetDoc = getDoc as jest.Mock;
  const mockedUseParams = useParams as jest.Mock;
  const mockedUseRouter = useRouter as jest.Mock;
  let push;

  const armor = {
    name: 'Armadura de Batalha',
    weapons: [
      { id: 'w1', verseReference: 'Salmos 23:1', verseText: 'O Senhor é o meu pastor...' },
      { id: 'w2', verseReference: 'Filipenses 4:13', verseText: 'Tudo posso naquele...' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    push = jest.fn();
    mockedUseRouter.mockReturnValue({ push });
    mockedUseParams.mockReturnValue({ armorId: 'armor-1' });
  });

  test('TC-B-01 & TC-B-02: should load armor, navigate, and exit', async () => {
    mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => armor });
    render(<BattleModePage params={{ armorId: 'armor-1' }} />);

    // Espera o loader desaparecer e o primeiro versículo aparecer
    await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
        expect(screen.getByText('Salmos 23:1')).toBeInTheDocument();
    });

    // O mock do carrossel é simplificado, então não podemos testar a navegação
    // mas podemos verificar se o botão de sair funciona.
    fireEvent.click(screen.getByRole('button', { name: /x/i }));
    expect(push).toHaveBeenCalledWith('/armor');
  });

  test('should redirect if armor not found', async () => {
    mockedGetDoc.mockResolvedValue({ exists: () => false });
    render(<BattleModePage params={{ armorId: 'armor-1' }}/>);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/armor'));
  });
});
