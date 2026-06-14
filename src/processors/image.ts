import { splitName } from '../lib/files'
import type { FileProcessor, WorkspaceFile } from '../types/files'

export interface ImageOptions { format: 'image/jpeg' | 'image/png' | 'image/webp'; quality: number; maxWidth: number }
export const defaultImageOptions: ImageOptions = { format: 'image/webp', quality: 0.82, maxWidth: 1920 }

function runWorker(item: WorkspaceFile, options: ImageOptions): Promise<Blob> {
  return item.file.arrayBuffer().then((buffer) => new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/image.worker.ts', import.meta.url), { type: 'module' })
    const id = crypto.randomUUID()
    worker.onmessage = (event: MessageEvent<{ id: string; blob?: Blob; error?: string }>) => { if (event.data.id !== id) return; worker.terminate(); if (event.data.blob) resolve(event.data.blob); else reject(new Error(event.data.error ?? '图片处理失败')) }
    worker.onerror = () => { worker.terminate(); reject(new Error('图片处理线程启动失败，请更新浏览器。')) }
    worker.postMessage({ id, buffer, type: options.format, quality: options.quality, maxWidth: options.maxWidth }, [buffer])
  }))
}

export const imageProcessor: FileProcessor<ImageOptions> = {
  id: 'image', accepts: (item) => item.kind === 'image' && item.status !== 'error',
  async process(files, options, context) {
    const accepted = files.filter(this.accepts); const result = [...files]
    for (let index = 0; index < accepted.length; index += 1) {
      if (context.signal.aborted) throw new DOMException('任务已取消', 'AbortError')
      const item = accepted[index]; if (!item) continue
      context.report(index / accepted.length, `正在处理 ${item.originalName}`)
      try { const output = await runWorker(item, options); const extension = options.format.split('/')[1] ?? 'webp'; const outputName = `${splitName(item.originalName).stem}.${extension === 'jpeg' ? 'jpg' : extension}`; const position = result.findIndex((entry) => entry.id === item.id); if (position >= 0) result[position] = { ...item, output, outputName, progress: 100, status: 'done' } }
      catch (error) { const position = result.findIndex((entry) => entry.id === item.id); if (position >= 0) result[position] = { ...item, status: 'error', progress: 0, error: error instanceof Error ? error.message : '图片处理失败' } }
    }
    context.report(1, '图片处理完成'); return result
  },
}
