type ClassValue = string | false | null | undefined | Record<string, unknown>

// Builds className strings for a component that uses a CSS Module. Every
// class is emitted as written, so the global styles (buttons, icons, grid)
// still match, and a class the module defines also gets its hashed name.
// This mirrors Angular's emulated encapsulation, where component styles
// only matched the component's own elements while global styles matched
// everything.
export function bindStyles(styles: Readonly<Record<string, string>>) {
  return (...values: ClassValue[]): string => {
    const names: string[] = []

    for (const value of values) {
      if (!value) continue

      if (typeof value === 'string')
        names.push(...value.split(/\s+/).filter(Boolean))
      else
        for (const [name, enabled] of Object.entries(value))
          if (enabled) names.push(name)
    }

    return names
      .map((name) => styles[name] ? `${name} ${styles[name]}` : name)
      .join(' ')
  }
}
