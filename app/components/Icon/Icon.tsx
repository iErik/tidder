import ArrowDownO from './icons/arrow-down-o.svg?react'
import ArrowDown from './icons/arrow-down.svg?react'
import ArrowUpO from './icons/arrow-up-o.svg?react'
import ArrowUp from './icons/arrow-up.svg?react'
import Check from './icons/check.svg?react'
import CloseDarwin from './icons/close-darwin.svg?react'
import Close from './icons/close.svg?react'
import Comment from './icons/comment.svg?react'
import Default from './icons/default.svg?react'
import Facebook from './icons/facebook.svg?react'
import Gear from './icons/gear.svg?react'
import Information from './icons/information.svg?react'
import MaximizeDarwin from './icons/maximize-darwin.svg?react'
import Maximize from './icons/maximize.svg?react'
import Menu from './icons/menu.svg?react'
import MinimizeDarwin from './icons/minimize-darwin.svg?react'
import Minimize from './icons/minimize.svg?react'
import Nsfw from './icons/nsfw.svg?react'
import PlusDarwin from './icons/plus-darwin.svg?react'
import Plus from './icons/plus.svg?react'
import Search from './icons/search.svg?react'
import Self from './icons/self.svg?react'
import Spoiler from './icons/spoiler.svg?react'
import Tumblr from './icons/tumblr.svg?react'
import Twitter from './icons/twitter.svg?react'
import UnmaximizeDarwin from './icons/unmaximize-darwin.svg?react'
import Verify from './icons/verify.svg?react'

// Every icon, by name. To add one, drop its SVG in icons/
// (drawn on a square viewBox, without fill colours) and
// list it here.
const icons = {
  'arrow-down-o': ArrowDownO,
  'arrow-down': ArrowDown,
  'arrow-up-o': ArrowUpO,
  'arrow-up': ArrowUp,
  'check': Check,
  'close-darwin': CloseDarwin,
  'close': Close,
  'comment': Comment,
  'default': Default,
  'facebook': Facebook,
  'gear': Gear,
  'information': Information,
  'maximize-darwin': MaximizeDarwin,
  'maximize': Maximize,
  'menu': Menu,
  'minimize-darwin': MinimizeDarwin,
  'minimize': Minimize,
  'nsfw': Nsfw,
  'plus-darwin': PlusDarwin,
  'plus': Plus,
  'search': Search,
  'self': Self,
  'spoiler': Spoiler,
  'tumblr': Tumblr,
  'twitter': Twitter,
  'unmaximize-darwin': UnmaximizeDarwin,
  'verify': Verify
}

export type IconName = keyof typeof icons

interface Props {
  name: IconName
  className?: string

  // Accessible name. Without one the icon is decorative
  // and hidden from assistive technology.
  title?: string
}

// An SVG icon sized 1em and filled with currentColor, so
// font-size and color set it. Styled globally through the
// `icon` and `icon-<name>` classes (styles/base/_icons.scss).
export default function Icon({ name, className, title }: Props) {
  const Svg = icons[name]
  const classes = ['icon', `icon-${name}`, className]

  return (
    <Svg
      className={classes.filter(Boolean).join(' ')}
      {...title
        ? { 'role': 'img', 'aria-label': title }
        : { 'aria-hidden': true }}
    />
  )
}
