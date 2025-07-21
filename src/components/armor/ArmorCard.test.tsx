import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ArmorCard } from './ArmorCard';
import { useAuth } from '@/hooks/use-auth';
import { writeBatch, arrayUnion, arrayRemove, addDoc, getDoc, updateDoc } from 'firebase/firestore';

jest.mock('@/hooks/use-auth');

describe('ArmorCard', () => {
    const mockedUseAuth = useAuth as jest.Mock;
    const mockedUpdateDoc = updateDoc as jest.Mock;
    const mockedAddDoc = addDoc as jest.Mock;
    const mockedWriteBatch = writeBatch as jest.Mock;

    const user = { uid: 'test-user-id' };
    const armor = {
        id: 'armor-1',
        name: 'Armadura de Teste',
        description: 'Descrição',
        userId: 'test-user-id',
        weapons: [{ id: 'w1', verseReference: 'Ref 1:1', verseText: 'Texto 1' }],
        isShared: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseAuth.mockReturnValue({ user });
        const batch = { commit: jest.fn().mockResolvedValue(undefined), delete: jest.fn(), set: jest.fn() };
        mockedWriteBatch.mockReturnValue(batch);
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => true });
    });

    test('TC-L-01: should toggle favorite status', async () => {
        const { rerender } = render(<ArmorCard armor={armor} isFavorited={false} />);
        fireEvent.click(screen.getByTestId('favorite-button-armor-1'));
        await waitFor(() => {
            expect(mockedUpdateDoc).toHaveBeenCalledWith(expect.anything(), { favoriteArmorIds: arrayUnion('armor-1') });
        });

        rerender(<ArmorCard armor={armor} isFavorited={true} />);
        fireEvent.click(screen.getByTestId('favorite-button-armor-1'));
        await waitFor(() => {
            expect(mockedUpdateDoc).toHaveBeenCalledWith(expect.anything(), { favoriteArmorIds: arrayRemove('armor-1') });
        });
    });

    test('TC-L-06: should delete an armor', async () => {
        render(<ArmorCard armor={armor} isFavorited={false} />);
        fireEvent.click(screen.getByTestId('more-button-armor-1'));
        fireEvent.click(await screen.findByText(/Desmontar/i));
        fireEvent.click(screen.getByRole('button', { name: "Desmontar" }));
        await waitFor(() => expect(mockedWriteBatch().commit).toHaveBeenCalled());
    });

    test('TC-L-02: should add community armor', async () => {
        const communityArmor = { ...armor, userId: 'another-user' };
        render(<ArmorCard armor={communityArmor} isCommunityView={true} />);
        fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));
        await waitFor(() => {
            expect(mockedAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                name: 'Armadura de Teste',
                originalArmorId: 'armor-1'
            }));
        });
    });

    test('TC-L-03: should view verses', async () => {
        render(<ArmorCard armor={armor} isCommunityView={true} />);
        fireEvent.click(screen.getByText(/visualizar versículos/i));
        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText('Ref 1:1')).toBeInTheDocument();
    });
});
