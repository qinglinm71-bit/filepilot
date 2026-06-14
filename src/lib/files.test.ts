import { describe, expect, it } from 'vitest'
import { sanitizeName, splitName, uniqueNames, validateFile } from './files'

describe('file utilities', () => {
  it('sanitizes dangerous names', () => expect(sanitizeName('../report:*?.pdf')).toBe('..-report-.pdf'))
  it('splits extension without losing dots', () => expect(splitName('photo.final.jpg')).toEqual({ stem: 'photo.final', extension: 'jpg' }))
  it('prevents duplicate output names', () => expect(uniqueNames(['a.pdf', 'a.pdf', 'A.pdf'])).toEqual(['a.pdf', 'a (2).pdf', 'A (3).pdf']))
  it('rejects empty files', () => expect(validateFile(new File([], 'empty.pdf'))).toContain('为空'))
})
