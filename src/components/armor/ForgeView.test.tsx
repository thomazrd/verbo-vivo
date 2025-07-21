import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgeView } from './ForgeView';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, setDoc, writeBatch, getDoc } from 'firebase/firestore';

// Mocks no topo do arquivo
jest.mock('next/navigation');
jest.mock('@/hooks/use-auth');
jest.mock('firebase/firestore');
jest.mock('@/ai/flows/armor-suggestion-flow');
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div>{children}</div>,
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
}));
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div>{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
  }),
  verticalListSortingStrategy: jest.fn(),
}));

describe('ForgeView', () => {
  const mockedUseRouter = useRouter as jest.Mock;
  const mockedUseAuth = useAuth as jest.Mock;
  const mockedAddDoc = addDoc as jest.Mock;
  const mockedWriteBatch = writeBatch as jest.Mock;
  const mockedGetDoc = getDoc as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseRouter.mockReturnValue({ push: jest.fn() });
    mockedUseAuth.mockReturnValue({
      user: { uid: 'test-user-id', displayName: 'Test User' },
      userProfile: { displayName: 'Test User' },
    });
    mockedWriteBatch.mockReturnValue({
      commit: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    });
  });

  test('TC-F-01: should create a private armor', async () => {
    mockedAddDoc.mockResolvedValueOnce({ id: 'new-id' });
    render(<ForgeView />);

    fireEvent.change(screen.getByLabelText(/Nome da Armadura/i), { target: { value: 'Test Armor' } });
    fireEvent.click(screen.getByRole('button', { name: /Forjar Armadura/i }));

    await waitFor(() => {
      expect(mockedAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: 'Test Armor',
        isShared: false,
      }));
      expect(mockedUseRouter().push).toHaveBeenCalledWith('/armor');
    });
  });

  test('TC-F-06: should edit an armor', async () => {
    mockedGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Original Armor', isShared: false }),
    });

    render(<ForgeView armorId="existing-id" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Armor')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nome da Armadura/i), { target: { value: 'Updated Armor' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      const batch = mockedWriteBatch();
      expect(batch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: 'Updated Armor'
      }));
      expect(batch.commit).toHaveBeenCalled();
    });
  });
});
