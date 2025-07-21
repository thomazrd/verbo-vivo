import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BattleModePage from './page';
import { getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

// Mocks
jest.mock('firebase/firestore');
jest.mock('next/navigation');
jest.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children, setApi }) => {
      const [index, setIndex] = React.useState(0);
      const items = React.Children.toArray(children[0].props.children);
      const api = {
          scrollNext: () => setIndex(i => (i < items.length - 1 ? i + 1 : i)),
          scrollPrev: () => setIndex(i => (i > 0 ? i - 1 : i)),
          on: jest.fn(),
          off: jest.fn(),
      };
      React.useEffect(() => { if (setApi) setApi(api) }, [setApi, api]);
      return <div>{items[index]}</div>;
  },
  CarouselContent: ({ children }) => <div>{children}</div>,
  CarouselItem: ({ children }) => <div>{children}</div>,
  CarouselNext: (props) => <button {...props} data-testid="carousel-next" />,
  CarouselPrevious: (props) => <button {...props} data-testid="carousel-previous" />,
}));


describe('BattleModePage', () => {
  const mockedGetDoc = getDoc as jest.Mock;
  const mockedUseParams = useParams as jest.Mock;
  const mockedUseRouter = useRouter as jest.Mock;
  let push;

  const armor = {
    id: 'armor-1',
    name: 'Armadura de Batalha',
    weapons: [
      { id: 'w1', verseReference: 'Salmos 23:1', verseText: 'O Senhor é o meu pastor...' },
      { id: 'w2', verseReference: 'Filipenses 4:13', verseText: 'Tudo posso naquele...' },
    ],
  };

  beforeEach(() => {
    push = jest.fn();
    mockedUseRouter.mockReturnValue({ push });
    mockedUseParams.mockReturnValue({ armorId: 'armor-1' });
    mockedGetDoc.mockClear();
  });

  test('TC-B-01 & TC-B-02: should navigate and exit', async () => {
    mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => armor });
    render(<BattleModePage params={{ armorId: 'armor-1' }} />);

    await waitFor(() => expect(screen.getByText('Salmos 23:1')).toBeInTheDocument());

    // Navegar
    fireEvent.click(screen.getByTestId('carousel-next'));
    await waitFor(() => expect(screen.getByText('Filipenses 4:13')).toBeInTheDocument());

    // Sair
    fireEvent.click(screen.getByRole('button', { name: /x/i }));
    expect(push).toHaveBeenCalledWith('/armor');
  });

  test('should redirect if armor not found', async () => {
    mockedGetDoc.mockResolvedValue({ exists: () => false });
    render(<BattleModePage params={{ armorId: 'armor-1' }}/>);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/armor'));
  });
});
