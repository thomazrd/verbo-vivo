import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mocks Globais
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock para o DND Kit
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => children,
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
}));
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => children,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
  }),
  verticalListSortingStrategy: jest.fn(),
  sortableKeyboardCoordinates: jest.fn(),
  arrayMove: jest.fn(),
}));


jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn((db, collection, id) => ({ id, path: `${collection}/${id}` })),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-id' })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  writeBatch: jest.fn(() => ({
    commit: jest.fn(() => Promise.resolve()),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
  serverTimestamp: jest.fn(),
  arrayUnion: jest.fn(item => `arrayUnion:${item}`),
  arrayRemove: jest.fn(item => `arrayRemove:${item}`),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
  startAfter: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'test-user', displayName: 'Test User' },
    userProfile: { armorOnboardingCompleted: true },
  })),
}));

jest.mock('@/components/ui/carousel', () => {
    const React = require('react');
    const useCarousel = () => {
        const [api, setApi] = React.useState(null);
        const ref = React.useRef();
        React.useEffect(() => {
            setApi({
                scrollNext: jest.fn(),
                scrollPrev: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
            });
        }, []);
        return { carouselRef: ref, api, setApi };
    };
    return {
        Carousel: ({ children }) => <div data-testid="carousel">{children}</div>,
        CarouselContent: ({ children }) => <div>{children}</div>,
        CarouselItem: ({ children }) => <div>{children}</div>,
        CarouselNext: () => <button data-testid="carousel-next" />,
        CarouselPrevious: () => <button data-testid="carousel-previous" />,
        useCarousel: useCarousel,
    };
});
