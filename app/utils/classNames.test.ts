import {
  describe,
  expect,
  it
} from 'vitest'

import styles from 'components/CommentCard/CommentCard.module.scss'

import { bindStyles } from './classNames'

const cx = bindStyles({
  host: 'host_hash',
  'is-active': 'is-active_hash'
})

describe('bindStyles', () => {
  it('adds the hashed name of a class the module defines', () => {
    expect(cx('host')).toBe('host host_hash')
  })

  it('keeps global classes as written', () => {
    expect(cx('button icn-close')).toBe('button icn-close')
  })

  it('emits object keys whose value is truthy', () => {
    expect(cx({ 'is-active': true, 'is-open': false }))
      .toBe('is-active is-active_hash')
  })

  it('skips empty values and extra whitespace', () => {
    expect(cx('', null, undefined, false, '  host  '))
      .toBe('host host_hash')
  })

  it('combines strings and objects in order', () => {
    expect(cx('button', { 'is-active': 1 }, 'host')).toBe(
      'button is-active is-active_hash host host_hash')
  })

  it('works with a compiled SCSS module', () => {
    const cxModule = bindStyles(styles)

    expect(styles.host).toBeTruthy()
    expect(cxModule('host button'))
      .toBe(`host ${styles.host} button`)
  })
})
