import './styles.scss'

function Button({
  children,
  stealth,
  ...props
}) {
  return (
    <button type="button" className="Button" {...props}>
      { children }
    </button>
  )
}

export default Button
