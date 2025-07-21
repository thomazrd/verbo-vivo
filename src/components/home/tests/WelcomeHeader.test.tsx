import { render, screen } from '@testing-library/react';
import { WelcomeHeader } from '../WelcomeHeader';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'home_welcome') {
        return `Bem-vindo de volta, ${options.name}!`;
      }
      return key;
    },
  })
}));

describe('WelcomeHeader', () => {
  it('renders the welcome message', () => {
    render(
        <WelcomeHeader userName="Test User" />
    );
    const heading = screen.getByRole('heading', { name: /Bem-vindo de volta, Test User/i });
    expect(heading).toBeInTheDocument();
  });
});
