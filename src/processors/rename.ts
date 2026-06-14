import { sanitizeName, splitName, uniqueNames } from '../lib/files'
import type { WorkspaceFile } from '../types/files'

export interface RenameOptions { prefix: string; suffix: string; find: string; replace: string; numbering: boolean; start: number; digits: number; caseMode: 'keep' | 'lower' | 'upper'; extension: string }
export const defaultRenameOptions: RenameOptions = { prefix: '', suffix: '', find: '', replace: '', numbering: false, start: 1, digits: 2, caseMode: 'keep', extension: '' }
export function previewRenames(files: WorkspaceFile[], options: RenameOptions): string[] {
  const names = files.map((item, index) => {
    const source = splitName(item.originalName); let stem = source.stem
    if (options.find) stem = stem.split(options.find).join(options.replace)
    if (options.caseMode === 'lower') stem = stem.toLowerCase()
    if (options.caseMode === 'upper') stem = stem.toUpperCase()
    const number = options.numbering ? `-${String(options.start + index).padStart(options.digits, '0')}` : ''
    const extension = sanitizeName(options.extension.replace(/^\./, '') || source.extension)
    return `${sanitizeName(`${options.prefix}${stem}${options.suffix}${number}`) || '未命名'}${extension ? `.${extension}` : ''}`
  })
  return uniqueNames(names)
}
