import bloomPink from '../assets/bloom-pink.svg'

export default function NavHeader() {
  return (
    <header className="nav-header">
      <div className="nav-inner">
        <img src={bloomPink} alt="" className="nav-bloom" />
        <span className="nav-name">Alexa Jacobson</span>
      </div>
    </header>
  )
}
