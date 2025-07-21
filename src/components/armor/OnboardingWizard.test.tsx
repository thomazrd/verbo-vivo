import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizard } from './OnboardingWizard';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, setDoc } from 'firebase/firestore';
import { suggestWeaponsForBattle } from '@/ai/flows/armor-suggestion-flow';

// Mocks
jest.mock('next/navigation');
jest.mock('@/hooks/use-auth');
jest.mock('firebase/firestore');
jest.mock('@/ai/flows/armor-suggestion-flow');
jest.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children, setApi }) => {
    const [current, setCurrent] = React.useState(0);
    const api = {
        scrollNext: () => setCurrent(p => p + 1),
        scrollPrev: () => setCurrent(p => p - 1),
    };
    if (setApi) {
        setApi(api);
    }
    const content = React.Children.toArray(children).find(c => (c as any).type.displayName === 'CarouselContent');
    const items = React.Children.toArray((content as any).props.children);
    return <div>{items[current]}</div>;
  },
  CarouselContent: ({ children }) => <div>{children}</div>,
  CarouselItem: ({ children }) => <div>{children}</div>,
}));

describe('OnboardingWizard', () => {
  const mockedUseRouter = useRouter as jest.Mock;
  const mockedUseAuth = useAuth as jest.Mock;
  const mockedAddDoc = addDoc as jest.Mock;
  const mockedSetDoc = setDoc as jest.Mock;
  const mockedSuggestWeapons = suggestWeaponsForBattle as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ push: jest.fn() });
    mockedUseAuth.mockReturnValue({
      user: { uid: 'test-user' },
      userProfile: {},
    });
    mockedSuggestWeapons.mockResolvedValue({ weapons: [] });
  });

  test('TC-A-01, TC-A-02, TC-A-03: Full flow', async () => {
    const { push } = mockedUseRouter();
    render(<OnboardingWizard />);

    // TC-A-01
    fireEvent.click(screen.getByRole('button', { name: /Eu aceito o chamado/i }));
    await waitFor(() => expect(screen.getByText('Conheça seu Arsenal')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Estou pronto para forjar/i }));
    await waitFor(() => expect(screen.getByText('Sua Primeira Batalha')).toBeInTheDocument());

    // TC-A-02
    fireEvent.click(screen.getByRole('button', { name: /Vencer a Ansiedade/i }));
    await waitFor(() => {
      expect(mockedSuggestWeapons).toHaveBeenCalled();
      expect(mockedAddDoc).toHaveBeenCalled();
      expect(mockedSetDoc).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/armor');
    });

    (push as jest.Mock).mockClear();
    (mockedSetDoc as jest.Mock).mockClear();

    // TC-A-03
    fireEvent.click(screen.getByRole('button', { name: /Quero forjar a minha do zero/i }));
     await waitFor(() => {
      expect(mockedSetDoc).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/armor/forge');
    });
  });
});
