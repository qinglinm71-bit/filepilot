# Contributing

感谢改进 FilePilot。请先创建 Issue 描述用户问题，再提交范围清晰的 Pull Request。

1. Fork 仓库并创建功能分支。
2. 运行 `npm install`。
3. 保持处理逻辑、状态和 UI 分层，不引入文件上传或遥测。
4. 为新增处理规则添加 Vitest 测试，为关键流程添加 Playwright 测试。
5. 运行 `npm run check` 后提交。

界面改动需保持键盘可操作、可见焦点、足够对比度以及至少 44×44 px 的触控区域。
