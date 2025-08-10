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

// Ensure window.matchMedia always returns a valid object
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
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

// Mock offline detection hook to prevent async fetch calls during tests
vi.mock('hooks/useOfflineDetection', () => ({
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

// Also mock with the @ alias path
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

// Mock fetch for offline detection and API calls
global.fetch = vi.fn((url: string | URL | Request) => {
  const urlString = typeof url === 'string' ? url : url.toString();
  
  // Handle health check endpoint specifically
  if (urlString.includes('/api/health')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: () => Promise.resolve({ status: 'ok' }),
      text: () => Promise.resolve('OK'),
    } as Response);
  }
  
  // Default mock for other requests
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as Response);
});

// Mock payroll validation functions to prevent async calls
vi.mock('@/lib/actions/payroll-validation', () => ({
  validateEmployeePayroll: vi.fn(() => Promise.resolve({
    success: true,
    data: {
      isValid: true,
      errors: [],
      warnings: [],
      auditTrail: [],
    }
  })),
  submitDiscrepancyReport: vi.fn(() => Promise.resolve({
    success: true,
    data: { id: 'report-1' }
  })),
}));
