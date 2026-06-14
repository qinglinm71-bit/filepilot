export type FileKind = 'image' | 'pdf' | 'other'
export type FileStatus = 'ready' | 'processing' | 'done' | 'error'
export interface WorkspaceFile { id: string; file: File; originalName: string; outputName: string; kind: FileKind; status: FileStatus; progress: number; previewUrl?: string; error?: string; output?: Blob }
export interface ProcessContext { signal: AbortSignal; report: (progress: number, message: string) => void }
export interface FileProcessor<TOptions> { id: string; accepts: (item: WorkspaceFile) => boolean; process: (files: WorkspaceFile[], options: TOptions, context: ProcessContext) => Promise<WorkspaceFile[]> }
