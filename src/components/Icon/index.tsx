import * as icons from '@icons'

type IconProps = {
  icon: string,
  size: number
}

function Icon(props: IconProps = {
  size: 18,
}) {
  const name = `Icn${props.icon}`
  const IconComponent = icons[name] || <div />

  return (
    <>
      <IconComponent className="icon" />
    </>
  )
}

export default Icon
