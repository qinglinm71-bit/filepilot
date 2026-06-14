import { create } from 'zustand'
import { createWorkspaceFile } from '../lib/files'
import type { WorkspaceFile } from '../types/files'

type Tool = 'rename' | 'image' | 'pdf'
interface WorkspaceState { files: WorkspaceFile[]; selectedTool: Tool; view: 'list' | 'grid'; addFiles: (files: File[]) => void; updateFile: (id: string, patch: Partial<WorkspaceFile>) => void; removeFile: (id: string) => void; clear: () => void; setTool: (tool: Tool) => void; setView: (view: 'list' | 'grid') => void }
export const useWorkspace = create<WorkspaceState>((set) => ({
  files: [], selectedTool: 'rename', view: 'list',
  addFiles: (incoming) => set((state) => { const fingerprints = new Set(state.files.map((item) => `${item.file.name}:${item.file.size}:${item.file.lastModified}`)); const fresh = incoming.filter((file) => !fingerprints.has(`${file.name}:${file.size}:${file.lastModified}`)).map(createWorkspaceFile); const suggested: Tool = fresh.some((item) => item.kind === 'image') ? 'image' : fresh.some((item) => item.kind === 'pdf') ? 'pdf' : state.selectedTool; return { files: [...state.files, ...fresh], selectedTool: suggested } }),
  updateFile: (id, patch) => set((state) => ({ files: state.files.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  removeFile: (id) => set((state) => { const target = state.files.find((item) => item.id === id); if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl); return { files: state.files.filter((item) => item.id !== id) } }),
  clear: () => set((state) => { state.files.forEach((item) => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl) }); return { files: [] } }),
  setTool: (selectedTool) => set({ selectedTool }), setView: (view) => set({ view }),
}))
