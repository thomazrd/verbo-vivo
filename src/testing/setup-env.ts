import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Adiciona TextDecoder e TextEncoder ao escopo global para os testes do Firebase
Object.assign(global, { TextDecoder, TextEncoder });


// Mock de 'next/router'
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null),
    };
  },
}));

// Mock de 'next/navigation'
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock do Firebase (geral)
jest.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(callback => {
      callback({ uid: 'test-user' }); // Simula usuário logado
      return jest.fn(); // Unsubscribe
    }),
  },
  db: {},
  storage: {},
}));

// Mock para o componente I18nInitializer
jest.mock('@/components/layout/I18nInitializer', () => {
  return {
    __esModule: true,
    default: () => null, // Renderiza nada
  };
});
