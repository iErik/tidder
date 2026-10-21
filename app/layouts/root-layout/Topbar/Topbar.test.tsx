import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import Topbar from './Topbar'

function renderTopbar(sidebarShown: boolean) {
  const onSidebarToggle = vi.fn()
  render(
    <MemoryRouter>
      <Topbar
        sidebarShown={sidebarShown}
        onSidebarToggle={onSidebarToggle}
      />
    </MemoryRouter>
  )

  return { onSidebarToggle }
}

describe('Topbar', () => {
  it('says whether the sidebar is shown', () => {
    const { onSidebarToggle } = renderTopbar(false)
    const toggle = screen.getByRole(
      'button',
      { name: 'Toggle sidebar' }
    )
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    toggle.click()
    expect(onSidebarToggle).toHaveBeenCalledOnce()
  })

  it('marks the toggle expanded while it is shown', () => {
    renderTopbar(true)
    const toggle = screen.getByRole(
      'button',
      { name: 'Toggle sidebar' }
    )

    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })
})
