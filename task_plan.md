# FilePilot Implementation Plan

## Goal
Build and publish a production-ready, browser-only FilePilot MVP covering phase-one import, batch rename, image compression/conversion, PDF merge/split, ZIP export, progress, Chinese UI, tests, and GitHub Pages deployment.

## Architecture
- React + TypeScript + Vite + Tailwind CSS
- Zustand workspace/task state
- Feature modules under `src/features`
- Unified processors under `src/processors`
- Browser-only file utilities under `src/lib`
- Web Worker for image processing
- pdf-lib for PDF editing, JSZip for archives

## Phases
- [complete] 1. Bootstrap repository, design system, strict tooling, and documentation skeleton
- [complete] 2. Implement file workspace, validation, duplicate detection, views, filters, and import methods
- [complete] 3. Implement batch rename with preview, validation, and ZIP download
- [complete] 4. Implement image compression/conversion in a worker with progress and download
- [complete] 5. Implement PDF merge/split and archive output
- [complete] 6. Add onboarding/help/privacy, responsive UI, accessibility, and PWA baseline
- [complete] 7. Add unit/E2E tests, run lint/test/build, and fix failures
- [complete] 8. Initialize Git, publish to GitHub, enable Pages workflow, and report demo URL

## Scope Decisions
- Phase one ships a strong Chinese-first experience; English strings and full offline PWA remain roadmap items.
- GitHub Pages uses a hash router-free single-page layout to avoid refresh 404s.
- Browser APIs are feature-detected; unsupported image encoders receive explicit messages.

## Errors
| Error | Attempt | Resolution |
|---|---:|---|
| Workspace was not a Git repository | 1 | Initialize after implementation files exist |
| UI/UX search script missing from declared skill path | 1 | Follow loaded accessibility/design rules directly and continue implementation |
| `eslint-plugin-jsx-a11y` rejected ESLint 10 peer range | 1 | Pin ESLint to supported 9.x instead of forcing an invalid dependency tree |
| Vitest collected Playwright E2E suite | 1 | Restrict Vitest include pattern to `src/**/*.test.{ts,tsx}` |
| TypeScript 6 rejected pdf-lib `ArrayBufferLike` as BlobPart and untyped Vitest config | 1 | Copy bytes into an `ArrayBuffer` and import `defineConfig` from `vitest/config` |
| Playwright 1.60 Chromium download stalled on current network | 1 | Run E2E against installed stable Chrome via Playwright `channel` |
| Initial commit blocked because Git identity was unset | 1 | Configure repository-local GitHub noreply identity; leave global Git settings unchanged |
