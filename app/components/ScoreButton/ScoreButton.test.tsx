import { render, screen } from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import ScoreButton from './ScoreButton'

const pressed = (name: string) => screen
  .getByRole('button', { name })
  .getAttribute('aria-pressed')

describe('ScoreButton', () => {
  it('shows the vote as pressed, under fixed labels', () => {
    const view = render(
      <ScoreButton score="1" likes={null} onVote={vi.fn()} />
    )
    expect(pressed('Upvote')).toBe('false')
    expect(pressed('Downvote')).toBe('false')

    view.rerender(
      <ScoreButton score="2" likes={true} onVote={vi.fn()} />
    )
    expect(pressed('Upvote')).toBe('true')
    expect(pressed('Downvote')).toBe('false')

    view.rerender(
      <ScoreButton score="0" likes={false} onVote={vi.fn()} />
    )
    expect(pressed('Upvote')).toBe('false')
    expect(pressed('Downvote')).toBe('true')
  })
})
