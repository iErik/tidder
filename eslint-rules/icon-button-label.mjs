// Reports a <button> or <a> whose only content is <Icon>
// elements and that has no aria-label or aria-labelledby:
// icons are aria-hidden, so screen readers would announce
// it as just "button". An <Icon> with a title names itself.

// What a piece of content gives the element: nothing
// (whitespace, comments), only icons, or a name of some
// kind (text, a titled icon, any other element)
const NOTHING = 0
const ICON = 1
const NAME = 2

const LABELS = ['aria-label', 'aria-labelledby']

function elementName(node) {
  return node.openingElement.name.type === 'JSXIdentifier'
    ? node.openingElement.name.name
    : null
}

// Whether it sets one of the attributes by name. A spread
// doesn't count: the rule can't see what it holds
function hasAttribute(node, names) {
  return node.openingElement.attributes.some(attr =>
    attr.type === 'JSXAttribute'
      && names.includes(attr.name.name))
}

// The strongest of the parts: a name anywhere wins
const combine = parts => Math.max(NOTHING, ...parts)

// An expression inside {…}. In `a && <Icon />` only the
// right side renders; with || and ?? both sides can
function expression(node) {
  switch (node.type) {
    case 'JSXEmptyExpression':
      return NOTHING
    case 'JSXElement':
    case 'JSXFragment':
      return content(node)
    case 'LogicalExpression':
      return node.operator === '&&'
        ? expression(node.right)
        : combine([
          expression(node.left),
          expression(node.right)
        ])
    case 'ConditionalExpression':
      return combine([
        expression(node.consequent),
        expression(node.alternate)
      ])
    // null, false, true, undefined and '' render nothing
    case 'Literal':
      return node.value === null || node.value === ''
        || typeof node.value === 'boolean'
        ? NOTHING
        : NAME
    case 'Identifier':
      return node.name === 'undefined' ? NOTHING : NAME
    case 'ArrayExpression':
      return combine(
        node.elements.filter(Boolean).map(expression)
      )
    default:
      return NAME
  }
}

function content(node) {
  switch (node.type) {
    case 'JSXText':
      return node.value.trim() ? NAME : NOTHING
    case 'JSXExpressionContainer':
      return expression(node.expression)
    case 'JSXFragment':
      return combine(node.children.map(content))
    case 'JSXElement':
      if (elementName(node) !== 'Icon') return NAME
      return hasAttribute(node, ['title']) ? NAME : ICON
    default:
      return NAME
  }
}

export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      missing: 'This <{{name}}> only shows an icon. Give it'
        + ' an aria-label that describes its action.'
    }
  },

  create(context) {
    return {
      JSXElement(node) {
        const name = elementName(node)
        if (name !== 'button' && name !== 'a') return
        if (hasAttribute(node, LABELS)) return

        const children = combine(node.children.map(content))
        if (children !== ICON) return

        context.report({
          node: node.openingElement,
          messageId: 'missing',
          data: { name }
        })
      }
    }
  }
}
