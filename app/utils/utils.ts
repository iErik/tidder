//  I had to write this function because Boolean(-1) will return true,
//  and while this is correct, this is not always what you want.
export function numToBoolean(num) {
  return num > 0 ? true : false;
}

export function popupWindow(url:string, w:number, h:number, title?: string): void {
  window.tidder.openPopup(url, w, h, title);
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function abbreviate(num, maxPlaces?, forcePlaces?, forceLetter?) {
  var abbr = '';

  num = Number(num);
  forceLetter = forceLetter || false

  if (forceLetter !== false) {
    return annotate(num, maxPlaces, forcePlaces, forceLetter);
  }

  if (num >= 1e12) abbr = 'T'
  else if (num >= 1e9) abbr = 'B'
  else if (num >= 1e6) abbr = 'M'
  else if (num >= 1e3) abbr = 'K'

  return annotate(num, maxPlaces, forcePlaces, abbr);
}

function annotate(num, maxPlaces?, forcePlaces?, abbr?) {
  var rounded: any = 0;

  switch(abbr) {
    case 'T':
      rounded = num / 1e12;
      break;
    case 'B':
      rounded = num / 1e9;
      break;
    case 'M':
      rounded = num / 1e6;
      break;
    case 'K':
      rounded = num / 1e3;
      break;
    default:
      rounded = num;
      break;
  }

  if (maxPlaces !== false) {
    var test = new RegExp('\\.\\d{' + (maxPlaces + 1) + ',}$');

    if (test.test(('' + rounded))) rounded = rounded.toFixed(maxPlaces);
  }

  if ((forcePlaces !== false) && !(num < 1e3)) {
    rounded = Number(rounded).toFixed(forcePlaces);
  }

  return rounded + abbr
}

export function togglePageScroll(scrollState: boolean) {
  if (!scrollState) {
    if(document.body.className.indexOf('no-scroll') === -1)
      document.body.className += ' ' + 'no-scroll'
  } else {
    document.body.className = document.body.className.replace('no-scroll', '');
  }
}
