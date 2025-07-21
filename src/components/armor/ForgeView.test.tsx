import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ForgeView } from './ForgeView';
import { useRouter } from 'next/navigation';
import { addDoc, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { getBibleWeaponSuggestion } from '@/ai/flows/armor-suggestion-flow';
import { useAuth } from '@/hooks/use-auth';

// Mocks são automáticos via jest.setup.js

describe('ForgeView', () => {
  const { push } = useRouter();
  const mockedAddDoc = addDoc as jest.Mock;
  const mockedGetDoc = getDoc as jest.Mock;
  const mockedSetDoc = setDoc as jest.Mock;
  const mockedWriteBatch = writeBatch as jest.Mock;
  const mockedGetBibleWeaponSuggestion = getBibleWeaponSuggestion as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
        user: { uid: 'test-user-id', displayName: 'Test User', photoURL: 'test-photo.jpg' },
        userProfile: { displayName: 'Test User', photoURL: 'test-photo.jpg' },
    });
    mockedGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    const batch = {
        commit: jest.fn().mockResolvedValue(undefined),
        update: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    };
    mockedWriteBatch.mockReturnValue(batch);
  });

  test('TC-F-01: should create a private armor', async () => {
    render(<ForgeView />);
    fireEvent.change(screen.getByLabelText(/Nome da Armadura/i), { target: { value: 'Minha Armadura' } });
    fireEvent.click(screen.getByRole('button', { name: /Forjar Armadura/i }));

    await waitFor(() => {
      expect(mockedAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Minha Armadura',
          isShared: false,
        })
      );
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/armor'));
  });

  test('TC-F-03 & TC-F-04: should add weapons', async () => {
    render(<ForgeView />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Arma/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/Referência/i), { target: { value: 'João 3:16' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Adicionar Arma/i }));
    await waitFor(() => expect(screen.getByText('João 3:16')).toBeInTheDocument());
  });

  test('TC-F-06: should edit an armor', async () => {
    mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ name: 'Original', isShared: false, weapons: [] }) });
    render(<ForgeView armorId="edit-id" />);

    await waitFor(() => expect(screen.getByDisplayValue('Original')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Nome da Armadura/i), { target: { value: 'Editada' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
        expect(mockedWriteBatch().update).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ name: 'Editada' })
        );
        expect(mockedWriteBatch().commit).toHaveBeenCalled();
    });
  });

});
