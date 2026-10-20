//  I had to write this function because Boolean(-1) will return true,
//  and while this is correct, this is not always what you want.
export function numToBoolean(num: number): boolean {
  return num > 0
}

export function popupWindow(
  url: string,
  w: number,
  h: number,
  title?: string
): void {
  window.tidder.openPopup(url, w, h, title)
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const units: [string, number][] = [
  ['T', 1e12],
  ['B', 1e9],
  ['M', 1e6],
  ['K', 1e3]
]

export function abbreviate(
  num: number | string,
  maxPlaces: number | false = false,
  forcePlaces: number | false = false,
  forceLetter: string | false = false
): string {
  const value = Number(num)

  // Units and padding are picked by magnitude, so a negative
  // number reads like its positive counterpart, with the sign
  if (value < 0) {
    return '-' + abbreviate(
      -value, maxPlaces, forcePlaces, forceLetter
    )
  }

  if (forceLetter !== false) {
    return annotate(value, maxPlaces, forcePlaces, forceLetter)
  }

  const unit = units.find(([, size]) => value >= size)
  const [abbr, size] = unit ?? ['', 1]
  const result = annotate(value, maxPlaces, forcePlaces, abbr)

  // Rounding to maxPlaces can carry the value to 1000 of its
  // unit (999,950 to 1000.0K): abbreviate what it rounded to
  // instead, which moves it to the next unit. T is the last
  const scaled = parseFloat(result)

  if (abbr !== 'T' && scaled >= 1e3) {
    return abbreviate(scaled * size, maxPlaces, forcePlaces)
  }

  return result
}

function annotate(
  num: number,
  maxPlaces: number | false,
  forcePlaces: number | false,
  abbr: string
): string {
  let rounded: number | string

  switch(abbr) {
    case 'T':
      rounded = num / 1e12
      break
    case 'B':
      rounded = num / 1e9
      break
    case 'M':
      rounded = num / 1e6
      break
    case 'K':
      rounded = num / 1e3
      break
    default:
      rounded = num
      break
  }

  if (maxPlaces !== false) {
    const test = new RegExp('\\.\\d{' + (maxPlaces + 1) + ',}$')

    if (test.test(('' + rounded))) rounded = rounded.toFixed(maxPlaces)
  }

  if ((forcePlaces !== false) && !(num < 1e3)) {
    rounded = Number(rounded).toFixed(forcePlaces)
  }

  return rounded + abbr
}
