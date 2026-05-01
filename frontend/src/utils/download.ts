import { api } from '@/api/client'

export async function triggerDownload(path: string): Promise<void> {
  const { blob, filename } = await api.download(path)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
