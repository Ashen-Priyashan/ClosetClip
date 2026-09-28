import { ArrowUpRight, Bookmark, Shirt, Sparkles } from 'lucide-react'

export default function App() {
  return (
    <main className="popup-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="ClosetClip home">
          <span className="brand-mark"><Shirt size={19} strokeWidth={2.2} /></span>
          <span>closet<span className="brand-accent">clip</span></span>
        </a>
        <button className="icon-button" aria-label="Saved items"><Bookmark size={18} /></button>
      </header>

      <section className="welcome" aria-labelledby="welcome-title">
        <span className="eyebrow"><Sparkles size={13} /> YOUR STYLE, COLLECTED</span>
        <h1 id="welcome-title">A little space<br />for <em>great finds.</em></h1>
        <p>Your digital closet starts here. Save pieces you love as you browse.</p>
      </section>

      <section className="closet-preview" aria-label="Closet preview">
        <div className="preview-art" aria-hidden="true">
          <div className="hanger"><span /></div>
          <div className="shirt-shape"><span className="shirt-collar" /></div>
          <div className="side-stitch" />
        </div>
        <div className="preview-copy">
          <span className="preview-label">YOUR CLOSET</span>
          <strong>Ready for its first piece</strong>
          <span>Find something you love? Clip it.</span>
        </div>
      </section>

      <button className="save-button" type="button" disabled>
        <Bookmark size={16} /> Save this page <span className="soon">COMING SOON</span>
      </button>

      <footer className="footer-note">
        <span>Made for the pieces that feel like you.</span>
        <ArrowUpRight size={15} />
      </footer>
    </main>
  )
}
