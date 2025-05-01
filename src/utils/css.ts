import themes from '@themes'

export const setCssVar = (varName, val): bool => {
  const root = document?.documentElement?.style
  if (!root) {
    console.error(
      `Faild to set CSS variable "${varName}": ` +
      `document element does not exist.`
    )

    return false
  }

  root.setProperty(`--${varName}`, val)
  return true
}

export const bindThemeVars = (themeName) => {
  const theme = themes[themeName]
  if (!theme) return

  Object.entries(theme).forEach(([varName, val]) => {
    setCssVar(varName, val)
  })
}

