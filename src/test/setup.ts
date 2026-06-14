import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:test') })
Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn() })
Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => '00000000-0000-4000-8000-000000000000' } })
