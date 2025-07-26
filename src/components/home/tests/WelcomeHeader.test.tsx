import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/testing/test-utils';
import { WelcomeHeader } from '@/components/home/WelcomeHeader';

// Mock do hook useAuth
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Convidado',
    },
    loading: false,
  }),
}));

describe('WelcomeHeader', () => {
  it('deve renderizar a saudação com o nome do usuário', () => {
    renderWithProviders(<WelcomeHeader userName="Convidado" />);

    // Verifica se a saudação de boas-vindas é exibida
    expect(screen.getByText(/Welcome back, Convidado!/i)).toBeInTheDocument();

    // Verifica se a mensagem de inspiração está presente
    expect(screen.getByText(/Ready to deepen your faith today?/i)).toBeInTheDocument();
  });
});
