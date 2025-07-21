import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyArmorPage from './page';
import { useAuth } from '@/hooks/use-auth';
import { onSnapshot, getDocs } from 'firebase/firestore';

// Mocks
jest.mock('@/hooks/use-auth');
jest.mock('firebase/firestore');
jest.mock('@/components/armor/ArmorCard', () => ({
  ArmorCard: ({ armor }) => <div data-testid="armor-card">{armor.name}</div>,
}));

describe('MyArmorPage', () => {
  const mockedUseAuth = useAuth as jest.Mock;
  const mockedOnSnapshot = onSnapshot as jest.Mock;
  const mockedGetDocs = getDocs as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { uid: 'user-1' },
      userProfile: { armorOnboardingCompleted: true, favoriteArmorIds: [] },
    });
  });

  test('TC-L-04: should display user armors and filter community armors', async () => {
    const userArmors = [{ id: 'armor-1', name: 'Minha Armadura Pessoal', userId: 'user-1' }];
    const communityArmors = [
        { id: 'armor-2', name: 'Armadura da Comunidade', userId: 'user-2' },
        { id: 'armor-1', name: 'Minha Armadura Pessoal', userId: 'user-1' } // Deve ser filtrado
    ];

    mockedOnSnapshot.mockImplementation((query, callback) => {
      const snapshot = { docs: userArmors.map(doc => ({ id: doc.id, data: () => doc })) };
      callback(snapshot);
      return jest.fn(); // unsubscribe
    });

    mockedGetDocs.mockResolvedValue({
      docs: communityArmors.map(doc => ({ id: doc.id, data: () => doc })),
    });

    render(<MyArmorPage />);

    await waitFor(() => {
      expect(screen.getByText('Minha Armadura Pessoal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Comunidade/i }));

    await waitFor(() => {
      expect(mockedGetDocs).toHaveBeenCalled();
      expect(screen.getByText('Armadura da Comunidade')).toBeInTheDocument();
      expect(screen.queryByText('Minha Armadura Pessoal')).not.toBeInTheDocument();
    });
  });
});
