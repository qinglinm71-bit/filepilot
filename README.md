# FilePilot

你的文件，只在你的浏览器里处理。

FilePilot 是一个开源、本地优先的图片、PDF 与文件名处理工具。没有账户、后端、数据库或付费 API，文件内容不会离开当前浏览器标签页。

## 在线使用

发布后访问：<https://qinglinm71-bit.github.io/filepilot/>

## 第一阶段功能

- 点击、拖拽与粘贴导入，多文件工作台、搜索、筛选和双视图
- 批量重命名：前后缀、查找替换、编号、大小写与扩展名
- 图片压缩、宽度限制和 JPG / PNG / WebP 转换，使用 Web Worker
- PDF 合并与按页码范围拆分，密码保护文件提供清晰提示
- 单文件下载与自动处理同名文件的 ZIP 打包
- 处理进度、取消任务、错误原因与解决提示
- 响应式中文界面、键盘焦点、44 px 触控区域和 PWA 基础

## 功能截图

![FilePilot 工作台](docs/screenshot.png)

## 隐私原理

所有文件通过浏览器的 `File`、`Blob`、Canvas、Web Worker 和 ArrayBuffer API 处理。项目不包含上传接口、遥测脚本或第三方统计。Object URL 会在删除文件或清空工作台时释放；关闭页面后文件不会被保留。详见 [PRIVACY.md](PRIVACY.md)。

## 本地开发

```bash
npm install
npm run dev
```

## 质量检查

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

## 部署

仓库内的 GitHub Actions 会在 `main` 分支通过 lint、单元测试和生产构建后部署 `dist/` 到 GitHub Pages。Vite 使用相对资源路径，单页工作台没有需要服务器回退的子路由，因此刷新不会产生 404。

## 浏览器兼容性

推荐当前稳定版 Chrome、Edge 和 Firefox。图片 Worker 需要 `OffscreenCanvas`；不支持时会显示升级浏览器提示。AVIF 是否可解码取决于浏览器能力。移动端支持导入、调整参数和下载，超大文件仍受设备内存限制。

## 路线图

- Phase 2：裁剪、EXIF 清理、PDF 页面排序/水印/页码、完整深色模式、英文界面、离线缓存、操作历史
- Phase 3：可保存预设、文件夹批处理、更多格式、快捷键与插件架构

## 贡献

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。提交代码前运行 `npm run check`。项目采用 [MIT License](LICENSE)。

## 第三方许可证

主要依赖 React、Zustand、pdf-lib、JSZip、Lucide、Vite、Tailwind CSS、Vitest 与 Playwright，均为宽松开源许可证。完整说明见 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)。
