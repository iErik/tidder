//  I had to write this function because Boolean(-1) will return true,
//  and while this is correct, this is not always what you want.
export function numToBoolean(num: number): boolean {
  return num > 0
}

export function popupWindow(url: string, w: number, h: number, title?: string): void {
  window.tidder.openPopup(url, w, h, title)
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function abbreviate(
  num: number | string,
  maxPlaces: number | false = false,
  forcePlaces: number | false = false,
  forceLetter: string | false = false
): string {
  let abbr = ''
  let value = Number(num)

  if (forceLetter !== false) {
    return annotate(value, maxPlaces, forcePlaces, forceLetter)
  }

  if (value >= 1e12) abbr = 'T'
  else if (value >= 1e9) abbr = 'B'
  else if (value >= 1e6) abbr = 'M'
  else if (value >= 1e3) abbr = 'K'

  return annotate(value, maxPlaces, forcePlaces, abbr)
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
    let test = new RegExp('\\.\\d{' + (maxPlaces + 1) + ',}$')

    if (test.test(('' + rounded))) rounded = rounded.toFixed(maxPlaces)
  }

  if ((forcePlaces !== false) && !(num < 1e3)) {
    rounded = Number(rounded).toFixed(forcePlaces)
  }

  return rounded + abbr
}
