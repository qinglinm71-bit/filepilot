import { expect, it } from 'vitest'
import { previewRenames, type RenameOptions } from './rename'

const files = ['Summer One.JPG', 'Summer Two.JPG'].map((name, index) => ({ id: String(index), file: new File(['x'], name), originalName: name, outputName: name, kind: 'image' as const, status: 'ready' as const, progress: 0 }))
it('applies rename rules and numbering', () => { const options: RenameOptions = { prefix: 'trip-', suffix: '', find: 'Summer ', replace: '', numbering: true, start: 7, digits: 3, caseMode: 'lower', extension: 'webp' }; expect(previewRenames(files, options)).toEqual(['trip-one-007.webp', 'trip-two-008.webp']) })
