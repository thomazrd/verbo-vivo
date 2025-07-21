import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyArmorPage from './page';

// Mocks
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'user-1' },
    userProfile: { armorOnboardingCompleted: true, favoriteArmorIds: [] },
  })),
}));

const mockOnSnapshot = jest.fn();
const mockGetDocs = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: mockOnSnapshot,
  getDocs: mockGetDocs,
}));

jest.mock('@/components/armor/ArmorCard', () => ({
  ArmorCard: ({ armor }) => <div data-testid="armor-card">{armor.name}</div>,
}));

describe('MyArmorPage', () => {
  const userArmors = [
    { id: 'armor-1', name: 'Minha Armadura Pessoal', userId: 'user-1' },
    { id: 'armor-2', name: 'Minha Armadura Compartilhada', userId: 'user-1' },
  ];
  const communityArmors = [
    { id: 'armor-3', name: 'Armadura da Comunidade', userId: 'user-2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock correto para onSnapshot
    mockOnSnapshot.mockImplementation((query, callback) => {
      const snapshot = {
        docs: userArmors.map(doc => ({ id: doc.id, data: () => doc })),
        forEach: (cb) => userArmors.forEach(doc => cb({ id: doc.id, data: () => doc })),
      };
      callback(snapshot);
      return jest.fn(); // unsubscribe
    });
  });

  test('TC-L-04: should display user armors and filter community armors', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        ...communityArmors.map(doc => ({ id: doc.id, data: () => doc })),
        { id: userArmors[1].id, data: () => userArmors[1] }
      ],
    });

    render(<MyArmorPage />);

    // Aba "Minhas Armaduras"
    await waitFor(() => {
      expect(screen.getByText('Minha Armadura Pessoal')).toBeInTheDocument();
    });

    // Mudar para a aba "Comunidade"
    fireEvent.click(screen.getByRole('tab', { name: /Comunidade/i }));

    await waitFor(() => {
      expect(screen.getByText('Armadura da Comunidade')).toBeInTheDocument();
      expect(screen.queryByText('Minha Armadura Compartilhada')).not.toBeInTheDocument();
    });
  });
});
