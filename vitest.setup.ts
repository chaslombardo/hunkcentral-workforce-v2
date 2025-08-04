import '@testing-library/jest-dom/vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// NextAuth mock will be handled in individual test files when needed

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock offline detection hook
vi.mock('@/hooks/useOfflineDetection', () => ({
  useOfflineDetection: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
    wasOffline: false,
    lastOnlineAt: new Date(),
    lastOfflineAt: null,
  })),
  useConnectivityActions: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
    wasOffline: false,
    lastOnlineAt: new Date(),
    lastOfflineAt: null,
    showOfflineNotice: false,
    dismissOfflineNotice: vi.fn(),
  })),
}));

// Mock fetch for offline detection
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
  } as Response)
);
