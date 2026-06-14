import type { FileKind, WorkspaceFile } from '../types/files'

const MAX_FILE_SIZE = 250 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
export function fileKind(file: File): FileKind { if (IMAGE_TYPES.has(file.type)) return 'image'; if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf'; return 'other' }
export function validateFile(file: File): string | undefined { if (!file.size) return '文件为空，请重新选择有效文件。'; if (file.size > MAX_FILE_SIZE) return '文件超过 250 MB，建议先拆分后再处理。'; if (file.name.includes('/') || file.name.includes('\\')) return '文件名包含路径字符，已拒绝导入。'; return undefined }
export function createWorkspaceFile(file: File): WorkspaceFile {
  const error = validateFile(file); const kind = fileKind(file); const previewUrl = kind === 'image' && !error ? URL.createObjectURL(file) : undefined
  return { id: crypto.randomUUID(), file, originalName: file.name, outputName: file.name, kind, status: error ? 'error' : 'ready', progress: 0, ...(previewUrl ? { previewUrl } : {}), ...(error ? { error } : {}) }
}
export function sanitizeName(name: string): string { return [...name].map((character) => character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? '-' : character).join('').replace(/\s+/g, ' ').replace(/-{2,}/g, '-').trim() }
export function splitName(name: string): { stem: string; extension: string } { const dot = name.lastIndexOf('.'); return dot > 0 ? { stem: name.slice(0, dot), extension: name.slice(dot + 1) } : { stem: name, extension: '' } }
export function uniqueNames(names: string[]): string[] { const used = new Set<string>(); return names.map((name) => { const { stem, extension } = splitName(name); let result = name; let index = 2; while (used.has(result.toLowerCase())) result = `${stem} (${index++})${extension ? `.${extension}` : ''}`; used.add(result.toLowerCase()); return result }) }
export function formatBytes(bytes: number): string { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}` }
export function downloadBlob(blob: Blob, name: string): void { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = sanitizeName(name) || 'filepilot-output'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
export async function downloadZip(files: WorkspaceFile[], name = 'filepilot-output.zip'): Promise<void> { const { default: JSZip } = await import('jszip'); const zip = new JSZip(); const valid = files.filter((item) => item.output); uniqueNames(valid.map((item) => item.outputName)).forEach((fileName, index) => { const item = valid[index]; if (item?.output) zip.file(fileName, item.output) }); downloadBlob(await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), name) }
