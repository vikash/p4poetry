import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Artistic Glass Style */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/50 shadow-sm">
        <nav className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="font-display text-2xl font-bold">
              <span className="gradient-text">P4Poetry</span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-6 md:gap-8">
              <Link
                to="/poems"
                className={`font-medium transition-all ${
                  isActive('/poems')
                    ? 'text-[var(--color-rose)]'
                    : 'text-[var(--color-text-light)] hover:text-[var(--color-rose)]'
                }`}
              >
                Poems
              </Link>
              <Link
                to="/authors"
                className={`font-medium transition-all ${
                  isActive('/authors')
                    ? 'text-[var(--color-rose)]'
                    : 'text-[var(--color-text-light)] hover:text-[var(--color-rose)]'
                }`}
              >
                Poets
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-8 md:py-12">
        <Outlet />
      </main>

      {/* Footer - Artistic Gradient */}
      <footer className="relative mt-auto overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0" style={{ background: 'var(--gradient-primary)' }}></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h4 className="font-display text-xl font-bold text-white mb-3">P4Poetry</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                A welcoming community where anyone can share their poetry. No judgment, just appreciation for the art of expression.
              </p>
            </div>

            {/* Browse */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Browse</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/poems" className="footer-link">
                    All Poems
                  </Link>
                </li>
                <li>
                  <Link to="/authors" className="footer-link">
                    Poets
                  </Link>
                </li>
                <li>
                  <Link to="/poems?language=hindi" className="footer-link">
                    हिंदी कविता
                  </Link>
                </li>
                <li>
                  <Link to="/poems?language=english" className="footer-link">
                    English Poetry
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4">For Poets</h4>
              <p className="text-white/70 text-sm mb-3">
                Claim your profile to manage your poems and add your bio.
              </p>
              <a
                href="mailto:web@p4poetry.com"
                className="footer-link inline-flex items-center gap-2 text-sm hover:!text-[var(--color-gold)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                web@p4poetry.com
              </a>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-xs text-white/50">
              &copy; {new Date().getFullYear()} P4Poetry. Passion for Poetry.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
