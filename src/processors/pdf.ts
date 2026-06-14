import type { PDFDocument as PDFDocumentType } from 'pdf-lib'
import type { WorkspaceFile } from '../types/files'

async function loadPdf(item: WorkspaceFile): Promise<PDFDocumentType> {
  try { const { PDFDocument } = await import('pdf-lib'); return await PDFDocument.load(await item.file.arrayBuffer()) }
  catch { throw new Error(`${item.originalName} 无法读取，可能已损坏或受密码保护。`) }
}
export async function mergePdfs(files: WorkspaceFile[], report: (value: number, message: string) => void): Promise<Blob> {
  const pdfs = files.filter((item) => item.kind === 'pdf' && item.status !== 'error'); if (pdfs.length < 2) throw new Error('请至少导入两个有效 PDF。')
  const { PDFDocument } = await import('pdf-lib')
  const output = await PDFDocument.create()
  for (let index = 0; index < pdfs.length; index += 1) { const item = pdfs[index]; if (!item) continue; report(index / pdfs.length, `正在合并 ${item.originalName}`); const source = await loadPdf(item); const pages = await output.copyPages(source, source.getPageIndices()); pages.forEach((page) => output.addPage(page)) }
  report(1, 'PDF 合并完成'); const bytes = await output.save(); return new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' })
}
export function parsePageRange(value: string, pageCount: number): number[] {
  const pages = new Set<number>()
  for (const part of value.split(',').map((item) => item.trim()).filter(Boolean)) { const [startText, endText] = part.split('-'); const start = Number(startText); const end = Number(endText ?? startText); if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > pageCount || start > end) throw new Error(`页码范围“${part}”无效，当前 PDF 共 ${pageCount} 页。`); for (let page = start; page <= end; page += 1) pages.add(page - 1) }
  if (!pages.size) throw new Error('请输入页码，例如 1-3,5。'); return [...pages]
}
export async function splitPdf(item: WorkspaceFile, range: string): Promise<Blob> { const { PDFDocument } = await import('pdf-lib'); const source = await loadPdf(item); const indices = parsePageRange(range, source.getPageCount()); const output = await PDFDocument.create(); const pages = await output.copyPages(source, indices); pages.forEach((page) => output.addPage(page)); const bytes = await output.save(); return new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' }) }
