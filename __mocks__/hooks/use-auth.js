export const useAuth = jest.fn(() => ({
  user: {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.png',
  },
  userProfile: {
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.png',
    armorOnboardingCompleted: true,
    preferredModel: 'gemini-1.5-flash',
    preferredLanguage: 'pt-BR',
  },
  loading: false,
  error: null,
  login: jest.fn(),
  signup: jest.fn(),
  logout: jest.fn(),
}));
