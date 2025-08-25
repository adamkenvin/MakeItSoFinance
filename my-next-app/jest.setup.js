import '@testing-library/jest-dom'

// Mock fetch globally for all tests
global.fetch = jest.fn()

// Polyfill Web APIs for Next.js API routes
global.Request = class Request {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = (init && init.method) || 'GET'
    this.headers = new Map(Object.entries((init && init.headers) || {}))
    this.body = (init && init.body) || null
  }
  
  async json() {
    return JSON.parse(this.body)
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = (init && init.status) || 200
    this.statusText = (init && init.statusText) || 'OK'
    this.headers = new Map(Object.entries((init && init.headers) || {}))
  }
  
  async json() {
    return JSON.parse(this.body)
  }
}

global.Headers = class Headers {
  constructor(init) {
    this.map = new Map(Object.entries(init || {}))
  }
  
  get(name) {
    return this.map.get(name)
  }
  
  set(name, value) {
    this.map.set(name, value)
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock React Query Client
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    clear: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}))

// Setup cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  fetch.mockClear()
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'file:./test.db',
}