import { useState, type FormEvent } from 'react'

import type { ReportReason } from 'api/posts'
import { useSubRules } from 'api/queries'
import { reportThing } from 'api/thingState'
import type { Votable } from 'api/types'

import SubmitButton from 'components/SubmitButton/SubmitButton'

import { bindStyles } from 'utils/classNames'

import styles from './ReportCard.module.scss'

const cx = bindStyles(styles)

// 'subRules' leads to a second step listing the subreddit's rules.
type Choice = ReportReason | 'subRules'

const SITE_REASONS = [
  ['Spam', 'This is spam'],
  ['Threatening, harassing, or inciting violence',
    'It threatens or incites violence or physical harm'],
  ['Personal and confidential information',
    'This reveals private and confidential information bout someone'],
]

function sameChoice(a: Choice | null, b: Choice): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

interface Props {
  thing: Votable
  onCancel: () => void
}

export default function ReportCard({ thing, onCancel }: Props) {
  const rules = useSubRules(thing.subreddit)
  const subRules = rules.data ?? []

  const [choice, setChoice] = useState<Choice | null>(null)
  const [isRuleReason, setRuleReason] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [isSubmitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!choice || isLoading) return

    if (choice === 'subRules') {
      setRuleReason(true)
      return
    }

    setLoading(true)
    setError('')

    try {
      await reportThing(thing, choice)
      setSubmitted(true)
    } catch (err) {
      console.error('Reporting failed:', err)
      setError('The report could not be sent. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const rollback = () => {
    if (isRuleReason)
      setRuleReason(false)
    else
      onCancel()
  }

  const radio = (value: Choice, label: string, key?: string) => (
    <div className={cx('form-input')} key={key}>
      <label className={cx('wrapper-input')}>
        <input type="radio"
          className={cx('input-radio')}
          name="reason"
          checked={sameChoice(choice, value)}
          onChange={() => setChoice(value)} />
        <p className={cx('label')}>{label}</p>
      </label>
    </div>
  )

  return (
    <div className={cx('host')}>
      <div className={cx('card-title')}>
        <p className={cx('title')}>
          We're sorry something's wrong. How can we help?
        </p>
      </div>

      {!rules.isPending && !isSubmitted && (
        <form className={cx('form-group')} onSubmit={submit}>

          <div className={cx('form-inputs')} hidden={isRuleReason}>
            {subRules.length > 0 &&
              radio('subRules',
                `It breaks ${thing.subreddit_name_prefixed}'s rules`)}

            {SITE_REASONS.map(([reason, label]) =>
              radio({ site_reason: reason }, label, reason))}
          </div>

          <div className={cx('form-inputs')} hidden={!isRuleReason}>
            {subRules.map((rule) =>
              radio({ rule_reason: rule.violation_reason },
                rule.short_name, rule.short_name))}
          </div>

          {error && (
            <div className={cx('form-errors')}>
              <span className={cx('error')}>{error}</span>
            </div>
          )}

          <div className={cx('form-controls')}>
            <div className={cx('form-control')}>
              <SubmitButton isDisabled={!choice} isLoading={isLoading}>
                {choice === 'subRules' ? 'Next' : 'Submit'}
              </SubmitButton>
            </div>
            <div className={cx('form-control')}>
              <button type="button"
                className={cx('button secondary')}
                onClick={rollback}>
                {isRuleReason ? 'Back' : 'Cancel'}
              </button>
            </div>
          </div>
        </form>
      )}

      {isSubmitted && (
        <div className={cx('form-success')}>
          <p>We've submitted your report. Thanks for letting us know!</p>
          <button type="button"
            className={cx('button secondary')}
            onClick={onCancel}>
            Close
          </button>
        </div>
      )}

      {rules.isPending && (
        <div className={cx('wrapper-spinner')}>
          <div className={cx('bar-spinner')}></div>
        </div>
      )}
    </div>
  )
}
