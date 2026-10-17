import {
  describe,
  expect,
  it
} from 'vitest'

import styles from 'components/CommentCard/CommentCard.module.scss'

import { bindStyles } from './classNames'

const cx = bindStyles({
  'comment-card': 'comment-card_hash',
  'is-active': 'is-active_hash'
})

describe('bindStyles', () => {
  it('adds the hashed name of a class the module defines', () => {
    expect(cx('comment-card')).toBe('comment-card comment-card_hash')
  })

  it('keeps global classes as written', () => {
    expect(cx('button icn-close')).toBe('button icn-close')
  })

  it('emits object keys whose value is truthy', () => {
    expect(cx({ 'is-active': true, 'is-open': false }))
      .toBe('is-active is-active_hash')
  })

  it('skips empty values and extra whitespace', () => {
    expect(cx('', null, undefined, false, '  comment-card  '))
      .toBe('comment-card comment-card_hash')
  })

  it('combines strings and objects in order', () => {
    expect(cx('button', { 'is-active': 1 }, 'comment-card')).toBe(
      'button is-active is-active_hash comment-card comment-card_hash')
  })

  it('works with a compiled SCSS module', () => {
    const cxModule = bindStyles(styles)

    expect(styles['comment-card']).toBeTruthy()
    expect(cxModule('comment-card button'))
      .toBe(`comment-card ${styles['comment-card']} button`)
  })
})
