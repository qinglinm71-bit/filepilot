import { describe, expect, it } from 'vitest'
import { parsePageRange } from './pdf'

describe('PDF ranges', () => {
  it('parses ranges and removes duplicates', () => expect(parsePageRange('1-3,3,5', 5)).toEqual([0, 1, 2, 4]))
  it('rejects pages outside the document', () => expect(() => parsePageRange('1-7', 4)).toThrow('无效'))
})
