import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, CheckCircle2, ChevronRight, FileImage, FilePenLine, Files, FolderOpen, Grid2X2, HelpCircle, LayoutList, LockKeyhole, Menu, RotateCcw, Search, ShieldCheck, Trash2, UploadCloud, X } from 'lucide-react'
import { downloadBlob, downloadZip, formatBytes, splitName } from './lib/files'
import { defaultImageOptions, imageProcessor, type ImageOptions } from './processors/image'
import { mergePdfs, splitPdf } from './processors/pdf'
import { defaultRenameOptions, previewRenames, type RenameOptions } from './processors/rename'
import { useWorkspace } from './store/workspace'
import type { WorkspaceFile } from './types/files'

const tools = [
  { id: 'rename' as const, label: '批量重命名', hint: '规则化文件名', icon: FilePenLine },
  { id: 'image' as const, label: '图片处理', hint: '压缩与格式转换', icon: FileImage },
  { id: 'pdf' as const, label: 'PDF 工具', hint: '合并与拆分', icon: Files },
]

function App() {
  const { files, selectedTool, view, addFiles, updateFile, removeFile, clear, setTool, setView } = useWorkspace()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'image' | 'pdf'>('all')
  const [rename, setRename] = useState<RenameOptions>(defaultRenameOptions)
  const [imageOptions, setImageOptions] = useState<ImageOptions>(defaultImageOptions)
  const [pdfMode, setPdfMode] = useState<'merge' | 'split'>('merge')
  const [pageRange, setPageRange] = useState('1-3')
  const [task, setTask] = useState({ running: false, progress: 0, message: '准备就绪' })
  const [controller, setController] = useState<AbortController | null>(null)
  const [notice, setNotice] = useState('')
  const [onboarding, setOnboarding] = useState(() => localStorage.getItem('filepilot-onboarded') !== 'yes')
  const [mobileNav, setMobileNav] = useState(false)

  const renameTargets = useMemo(() => files.filter((item) => item.status !== 'error'), [files])
  const proposedNames = useMemo(() => previewRenames(renameTargets, rename), [renameTargets, rename])
  const visible = useMemo(() => files.filter((item) => (filter === 'all' || item.kind === filter) && item.originalName.toLowerCase().includes(query.toLowerCase())), [files, filter, query])
  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0)
  const outputSize = files.reduce((sum, item) => sum + (item.output?.size ?? 0), 0)
  const completed = files.filter((item) => item.output).length

  useEffect(() => {
    const paste = (event: ClipboardEvent) => { const pasted = Array.from(event.clipboardData?.files ?? []); if (pasted.length) addFiles(pasted) }
    const beforeUnload = (event: BeforeUnloadEvent) => { if (files.some((item) => item.output)) event.preventDefault() }
    window.addEventListener('paste', paste); window.addEventListener('beforeunload', beforeUnload)
    return () => { window.removeEventListener('paste', paste); window.removeEventListener('beforeunload', beforeUnload) }
  }, [addFiles, files])

  const finishOnboarding = () => { localStorage.setItem('filepilot-onboarded', 'yes'); setOnboarding(false) }
  const report = (progress: number, message: string) => setTask({ running: true, progress: Math.round(progress * 100), message })

  async function runTask() {
    if (!files.length) { setNotice('请先导入文件，再开始处理。'); return }
    const nextController = new AbortController(); setController(nextController); setNotice(''); setTask({ running: true, progress: 0, message: '正在准备…' })
    try {
      if (selectedTool === 'rename') {
        renameTargets.forEach((item, index) => updateFile(item.id, { outputName: proposedNames[index] ?? item.originalName, output: item.file, status: 'done', progress: 100 }))
        report(1, '重命名方案已生成，可以下载 ZIP')
      } else if (selectedTool === 'image') {
        const result = await imageProcessor.process(files, imageOptions, { signal: nextController.signal, report })
        result.forEach((item) => updateFile(item.id, item))
      } else if (pdfMode === 'merge') {
        const blob = await mergePdfs(files, report); downloadBlob(blob, 'filepilot-merged.pdf'); setNotice('PDF 已合并并开始下载。')
      } else {
        const item = files.find((entry) => entry.kind === 'pdf' && entry.status !== 'error')
        if (!item) throw new Error('请导入一个有效 PDF。')
        const blob = await splitPdf(item, pageRange); downloadBlob(blob, `${splitName(item.originalName).stem}-pages.pdf`); report(1, '指定页面已导出')
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : '处理失败，请重试。') }
    finally { setTask((current) => ({ ...current, running: false })); setController(null) }
  }

  async function downloadResults() { const ready = useWorkspace.getState().files.filter((item) => item.output); if (!ready.length) { setNotice('还没有可下载的结果，请先处理文件。'); return } await downloadZip(ready) }

  function resetAll() { if (files.length && !window.confirm('确定清空全部文件和处理结果吗？此操作无法撤销。')) return; clear(); setTask({ running: false, progress: 0, message: '准备就绪' }); setNotice('') }

  return <div className="app-shell">
    <a className="skip-link" href="#workspace">跳到文件工作台</a>
    <header className="topbar">
      <div className="brand"><div className="brand-mark">FP</div><div><strong>FilePilot</strong><span>本地文件工作台</span></div></div>
      <div className="top-actions"><div className="privacy-pill"><ShieldCheck size={16}/> 本地处理，文件不会上传</div><button className="icon-button" aria-label="打开帮助" onClick={() => setOnboarding(true)}><HelpCircle size={20}/></button><a className="github-link" href="https://github.com/qinglinm71-bit/filepilot" target="_blank" rel="noreferrer">GitHub</a><button className="icon-button mobile-only" aria-label="打开工具菜单" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button></div>
    </header>

    <div className="workspace-layout">
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`} aria-label="工具导航">
        <div className="sidebar-label">文件工具</div>
        {tools.map((tool) => <button key={tool.id} className={`tool-nav ${selectedTool === tool.id ? 'active' : ''}`} onClick={() => { setTool(tool.id); setMobileNav(false) }}><tool.icon size={19}/><span><strong>{tool.label}</strong><small>{tool.hint}</small></span><ChevronRight size={16}/></button>)}
        <div className="local-card"><LockKeyhole size={20}/><strong>隐私设计</strong><p>没有上传接口，没有用户账户。关闭页面后，文件即从工作区消失。</p></div>
      </aside>

      <main id="workspace" className="main-panel">
        <section className="section-heading"><div><span className="eyebrow">工作台 / {tools.find((tool) => tool.id === selectedTool)?.label}</span><h1>把文件交给浏览器，而不是服务器。</h1><p>导入文件，FilePilot 会推荐工具并在本机完成处理。</p></div><button className="secondary-button" onClick={() => inputRef.current?.click()}><FolderOpen size={18}/>选择文件</button></section>

        {!files.length ? <DropZone addFiles={addFiles} inputRef={inputRef}/> : <>
          <input ref={inputRef} className="sr-only" type="file" multiple onChange={(event) => addFiles(Array.from(event.target.files ?? []))}/>
          <section className="metrics" aria-label="文件统计"><Metric label="文件数量" value={`${files.length} 个`}/><Metric label="原始大小" value={formatBytes(totalSize)}/><Metric label="预计输出" value={outputSize ? formatBytes(outputSize) : '处理后计算'}/><Metric label="完成结果" value={`${completed} 个`} accent/></section>
          <section className="file-toolbar"><div className="search-box"><Search size={17}/><label className="sr-only" htmlFor="search">搜索文件</label><input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件名"/></div><select aria-label="按类型筛选" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">全部类型</option><option value="image">图片</option><option value="pdf">PDF</option></select><div className="view-toggle"><button aria-label="列表视图" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><LayoutList size={18}/></button><button aria-label="网格视图" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Grid2X2 size={18}/></button></div><button className="text-button danger" onClick={resetAll}>全部清空</button></section>
          <FileCollection files={visible} view={view} removeFile={removeFile} proposedNames={selectedTool === 'rename' ? proposedNames : []}/>
        </>}
      </main>

      <aside className="settings-panel" aria-label="处理参数">
        <div className="settings-head"><div><span className="eyebrow">步骤 3</span><h2>处理参数</h2></div><button className="icon-button" aria-label="恢复默认参数" onClick={() => { setRename(defaultRenameOptions); setImageOptions(defaultImageOptions) }}><RotateCcw size={18}/></button></div>
        <div className="steps"><span className="done">1 导入</span><span className="done">2 选择工具</span><span className="current">3 调整并处理</span></div>
        {selectedTool === 'rename' && <RenameSettings value={rename} onChange={setRename}/>} 
        {selectedTool === 'image' && <ImageSettings value={imageOptions} onChange={setImageOptions}/>} 
        {selectedTool === 'pdf' && <PdfSettings mode={pdfMode} setMode={setPdfMode} range={pageRange} setRange={setPageRange}/>} 
        {notice && <div className="notice" role="alert">{notice}</div>}
        <div className="settings-tip"><ShieldCheck size={18}/><p><strong>处理过程保持离线</strong><br/>所有运算在当前标签页完成。</p></div>
      </aside>
    </div>

    <footer className="taskbar"><div className="task-status"><div className={`status-dot ${task.running ? 'pulse' : ''}`}/><div><strong>{task.message}</strong><span>{files.length ? `${files.length} 个文件等待处理` : '导入后即可开始'}</span></div></div><div className="progress-track" aria-label={`处理进度 ${task.progress}%`}><span style={{ width: `${task.progress}%` }}/></div><div className="task-actions">{task.running && <button className="secondary-button" onClick={() => controller?.abort()}><X size={18}/>取消</button>}<button className="secondary-button" disabled={!completed} onClick={downloadResults}><Archive size={18}/>下载 ZIP</button><button className="primary-button" disabled={task.running || !files.length} onClick={runTask}>{task.running ? '处理中…' : selectedTool === 'pdf' ? (pdfMode === 'merge' ? '合并并下载' : '拆分并下载') : '处理文件'}<ChevronRight size={18}/></button></div></footer>
    {onboarding && <Onboarding close={finishOnboarding}/>} 
  </div>
}

function DropZone({ addFiles, inputRef }: { addFiles: (files: File[]) => void; inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [drag, setDrag] = useState(false)
  return <section className={`drop-zone ${drag ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(event) => { event.preventDefault(); setDrag(false); addFiles(Array.from(event.dataTransfer.files)) }}><input ref={inputRef} className="sr-only" type="file" multiple onChange={(event) => addFiles(Array.from(event.target.files ?? []))}/><div className="upload-icon"><UploadCloud size={30}/></div><span className="eyebrow">步骤 1 · 导入文件</span><h2>拖放文件到这里</h2><p>也可以粘贴剪贴板中的图片，或一次选择多个文件。</p><button className="primary-button" onClick={() => inputRef.current?.click()}><FolderOpen size={18}/>选择文件</button><small>支持 JPG、PNG、WebP、AVIF 和 PDF · 单文件最大 250 MB</small></section>
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className={`metric ${accent ? 'accent' : ''}`}><span>{label}</span><strong>{value}</strong></div> }
function FileCollection({ files, view, removeFile, proposedNames }: { files: WorkspaceFile[]; view: 'list' | 'grid'; removeFile: (id: string) => void; proposedNames: string[] }) {
  if (!files.length) return <div className="empty-filter">没有匹配的文件，请调整搜索或筛选条件。</div>
  return <section className={`file-collection ${view}`} aria-label="文件列表">{files.map((item, index) => <article className="file-card" key={item.id}>{item.previewUrl ? <img src={item.previewUrl} alt=""/> : <div className="file-type">{item.kind === 'pdf' ? 'PDF' : 'FILE'}</div>}<div className="file-info"><strong title={item.originalName}>{item.originalName}</strong><span>{formatBytes(item.file.size)} · {item.kind === 'other' ? '仅支持重命名' : item.kind.toUpperCase()}</span>{proposedNames[index] && proposedNames[index] !== item.originalName && <small className="rename-preview">→ {proposedNames[index]}</small>}{item.error && <small className="file-error">{item.error}</small>}</div><div className={`file-status ${item.status}`}>{item.status === 'done' ? <CheckCircle2 size={15}/> : null}{item.status === 'error' ? '需处理' : item.status === 'done' ? '已完成' : '就绪'}</div><button className="icon-button" aria-label={`删除 ${item.originalName}`} onClick={() => removeFile(item.id)}><Trash2 size={17}/></button></article>)}</section>
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) { return <label className="field"><span>{label}{help && <small>{help}</small>}</span>{children}</label> }
function RenameSettings({ value, onChange }: { value: RenameOptions; onChange: (value: RenameOptions) => void }) { const set = (patch: Partial<RenameOptions>) => onChange({ ...value, ...patch }); return <div className="settings-form"><Field label="前缀"><input value={value.prefix} onChange={(e) => set({ prefix: e.target.value })} placeholder="例如：项目-"/></Field><Field label="后缀"><input value={value.suffix} onChange={(e) => set({ suffix: e.target.value })} placeholder="例如：-已确认"/></Field><div className="field-row"><Field label="查找"><input value={value.find} onChange={(e) => set({ find: e.target.value })}/></Field><Field label="替换为"><input value={value.replace} onChange={(e) => set({ replace: e.target.value })}/></Field></div><label className="check-row"><input type="checkbox" checked={value.numbering} onChange={(e) => set({ numbering: e.target.checked })}/><span>添加自动编号</span></label>{value.numbering && <div className="field-row"><Field label="起始数字"><input type="number" min="0" value={value.start} onChange={(e) => set({ start: Number(e.target.value) })}/></Field><Field label="位数"><input type="number" min="1" max="8" value={value.digits} onChange={(e) => set({ digits: Number(e.target.value) })}/></Field></div>}<Field label="英文大小写"><select value={value.caseMode} onChange={(e) => set({ caseMode: e.target.value as RenameOptions['caseMode'] })}><option value="keep">保持原样</option><option value="lower">全部小写</option><option value="upper">全部大写</option></select></Field><Field label="扩展名" help="留空则保持原格式"><input value={value.extension} onChange={(e) => set({ extension: e.target.value })} placeholder="例如：jpg"/></Field></div> }
function ImageSettings({ value, onChange }: { value: ImageOptions; onChange: (value: ImageOptions) => void }) { const set = (patch: Partial<ImageOptions>) => onChange({ ...value, ...patch }); return <div className="settings-form"><Field label="输出格式" help="WebP 通常体积更小"><select value={value.format} onChange={(e) => set({ format: e.target.value as ImageOptions['format'] })}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></Field><Field label={`图片质量 ${Math.round(value.quality * 100)}%`} help="82% 兼顾清晰度与体积"><input type="range" min="0.3" max="1" step="0.01" value={value.quality} onChange={(e) => set({ quality: Number(e.target.value) })}/></Field><Field label="最大宽度" help="小图不会被放大"><select value={value.maxWidth} onChange={(e) => set({ maxWidth: Number(e.target.value) })}><option value="0">保持原尺寸</option><option value="1080">1080 px · 社交媒体</option><option value="1920">1920 px · 网页大图</option><option value="2560">2560 px · 高清</option></select></Field></div> }
function PdfSettings({ mode, setMode, range, setRange }: { mode: 'merge' | 'split'; setMode: (mode: 'merge' | 'split') => void; range: string; setRange: (range: string) => void }) { return <div className="settings-form"><div className="segmented"><button className={mode === 'merge' ? 'active' : ''} onClick={() => setMode('merge')}>合并 PDF</button><button className={mode === 'split' ? 'active' : ''} onClick={() => setMode('split')}>拆分 PDF</button></div>{mode === 'merge' ? <div className="instruction"><strong>按列表顺序合并</strong><p>至少导入两个 PDF。处理后会生成一个新文件，原文件不受影响。</p></div> : <Field label="导出页码" help="支持范围和单页组合"><input value={range} onChange={(e) => setRange(e.target.value)} placeholder="例如 1-3,5,8"/></Field>}</div> }
function Onboarding({ close }: { close: () => void }) { return <div className="modal-backdrop" role="presentation"><section className="onboarding" role="dialog" aria-modal="true" aria-labelledby="welcome-title"><button className="icon-button close-modal" aria-label="跳过新手引导" onClick={close}><X size={20}/></button><div className="onboarding-mark"><ShieldCheck size={30}/></div><span className="eyebrow">欢迎使用 FilePilot</span><h2 id="welcome-title">你的文件，只在你的浏览器里处理。</h2><p>无需注册、无需上传。三个步骤就能完成常见文件任务。</p><div className="onboarding-steps"><div><strong>01</strong><span>导入文件</span><small>拖放、选择或粘贴</small></div><div><strong>02</strong><span>选择工具</span><small>根据类型自动推荐</small></div><div><strong>03</strong><span>处理下载</span><small>本地完成，不留副本</small></div></div><button className="primary-button wide" onClick={close}>开始使用 <ChevronRight size={18}/></button></section></div> }

export default App
