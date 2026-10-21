import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'

import rule from './icon-button-label.mjs'

// RuleTester runs its cases as Vitest tests
RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } }
  }
})

const missing = name => [{
  messageId: 'missing',
  data: { name }
}]

tester.run('icon-button-label', rule, {
  valid: [
    '<button aria-label="Upvote"><Icon name="up" /></button>',
    '<button aria-labelledby="l"><Icon name="up" /></button>',
    '<button><Icon name="up" title="Upvote" /></button>',
    '<button><Icon name="comment" /> Comments</button>',
    '<button><Icon name="up" /><span>3</span></button>',
    '<button>{count}<Icon name="up" /></button>',
    '<button {...props}><Icon name="up" /></button>',
    '<a href="#" aria-label="Share"><Icon name="share" /></a>',
    '<div><Icon name="up" /></div>',
    '<button>Save</button>'
  ],

  invalid: [
    {
      code: '<button><Icon name="up" /></button>',
      errors: missing('button')
    },
    {
      code: '<button>\n  {/* up */}\n  <Icon name="up" />\n'
        + '</button>',
      errors: missing('button')
    },
    {
      code: '<button>{on && <Icon name="check" />}</button>',
      errors: missing('button')
    },
    {
      code: '<button>{on ? <Icon name="check" />'
        + ' : <Icon name="plus" />}</button>',
      errors: missing('button')
    },
    {
      code: '<button><><Icon name="up" /></></button>',
      errors: missing('button')
    },
    {
      code: '<a href="#"><Icon name="share" /></a>',
      errors: missing('a')
    }
  ]
})
