interface ImageJob { id: string; buffer: ArrayBuffer; type: string; quality: number; maxWidth: number }
self.onmessage = async (event: MessageEvent<ImageJob>) => {
  const { id, buffer, type, quality, maxWidth } = event.data
  try {
    const bitmap = await createImageBitmap(new Blob([buffer]))
    const scale = maxWidth > 0 && bitmap.width > maxWidth ? maxWidth / bitmap.width : 1
    const width = Math.max(1, Math.round(bitmap.width * scale)); const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = new OffscreenCanvas(width, height); const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器无法创建图片画布。')
    if (type === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height) }
    context.drawImage(bitmap, 0, 0, width, height); bitmap.close()
    const blob = await canvas.convertToBlob({ type, quality })
    self.postMessage({ id, blob, width, height })
  } catch (error) { self.postMessage({ id, error: error instanceof Error ? error.message : '图片处理失败' }) }
}
export {}
