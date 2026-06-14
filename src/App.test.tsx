import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import App from './App'
import { useWorkspace } from './store/workspace'

beforeEach(() => { localStorage.setItem('filepilot-onboarded', 'yes'); useWorkspace.setState({ files: [] }) })
it('does not allow processing without files', () => { render(<App/>); expect(screen.getByRole('button', { name: /处理文件/ })).toBeDisabled(); expect(screen.getByText('拖放文件到这里')).toBeInTheDocument() })
