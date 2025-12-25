import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [stats, setStats] = useState(null)
  const [featuredPoem, setFeaturedPoem] = useState(null)
  const [recentPoems, setRecentPoems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/poems?per_page=7').then(r => r.json())
    ]).then(([statsData, poemsData]) => {
      setStats(statsData.data)
      const poems = poemsData.data?.poems || []
      if (poems.length > 0) {
        setFeaturedPoem(poems[0])
        setRecentPoems(poems.slice(1, 7))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="fade-in-up">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 blob-bg hero-gradient">
        <div className="text-center relative z-10">
          <span className="section-label">Welcome to</span>
          <h1 className="font-display text-5xl md:text-7xl font-bold mt-2 mb-4">
            <span className="gradient-text">P4Poetry</span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--color-text-light)] mb-2 font-display italic">
            Passion for Poetry
          </p>
          <p className="text-[var(--color-text-muted)] max-w-lg mx-auto mb-8">
            A safe, welcoming space for poets of all backgrounds to share their voice. Write, share, and connect with fellow poetry lovers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/poems" className="btn-primary">
              Explore Poems
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link to="/authors" className="btn-secondary">
              Meet the Poets
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            <div className="stat-card">
              <div className="stat-number">{stats.total_poems}</div>
              <div className="text-sm text-[var(--color-text-muted)] mt-1">Poems</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.total_authors}</div>
              <div className="text-sm text-[var(--color-text-muted)] mt-1">Poets</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.languages?.english || 0}</div>
              <div className="text-sm text-[var(--color-text-muted)] mt-1">English</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.languages?.hindi || 0}</div>
              <div className="text-sm text-[var(--color-text-muted)] mt-1">हिंदी</div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Poem */}
      {featuredPoem && (
        <section className="py-12">
          <div className="glass-card p-8 md:p-12 relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10"
                 style={{ background: 'var(--gradient-warm)', borderRadius: '0 24px 0 100%' }}></div>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <span className="section-label">Featured Poem</span>

              <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-3">
                <Link to={`/poems/${featuredPoem.slug}`} className="hover:text-[var(--color-rose)] transition-colors">
                  {featuredPoem.title}
                </Link>
              </h2>

              <p className="text-[var(--color-text-muted)] mb-6">
                by <Link to={`/authors/${featuredPoem.author_slug}`} className="link-accent">{featuredPoem.author_name}</Link>
              </p>

              <div className="divider-artistic">
                <span className="text-[var(--color-gold)]">✦</span>
              </div>

              <div className="font-display text-xl md:text-2xl italic leading-relaxed text-[var(--color-text-light)] whitespace-pre-line my-8">
                {featuredPoem.content_text?.substring(0, 250)}...
              </div>

              <Link to={`/poems/${featuredPoem.slug}`} className="link-accent font-semibold">
                Continue Reading →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Poems */}
      <section className="py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="section-label">From the Archive</span>
            <h2 className="font-display text-3xl font-bold gradient-text mt-2">Recent Poems</h2>
          </div>
          <Link to="/poems" className="link-accent font-semibold hidden md:block">
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {recentPoems.map(poem => (
            <Link
              key={poem.id}
              to={`/poems/${poem.slug}`}
              className="glass-card p-6 block group"
            >
              <div className="mb-3">
                <span className={`badge ${poem.language === 'hindi' ? 'badge-hindi' : 'badge-english'}`}>
                  {poem.language === 'hindi' ? 'हिंदी' : 'English'}
                </span>
              </div>

              <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-[var(--color-rose)] transition-colors">
                {poem.title}
              </h3>

              <p className="text-sm text-[var(--color-text-muted)] mb-4">by {poem.author_name}</p>

              <p className="text-[var(--color-text-light)] leading-relaxed line-clamp-3 font-display italic">
                {poem.content_text?.substring(0, 120)}...
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link to="/poems" className="btn-secondary">View All Poems</Link>
        </div>
      </section>

      {/* Language Sections */}
      <section className="py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/poems?language=english"
            className="glass-card p-8 group relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                 style={{ background: 'linear-gradient(135deg, rgba(45, 27, 78, 0.05) 0%, rgba(92, 61, 122, 0.05) 100%)' }}></div>
            <div className="relative z-10">
              <span className="section-label">English Poetry</span>
              <h3 className="font-display text-3xl font-bold mt-2 mb-3">
                {stats?.languages?.english || 0} <span className="text-lg font-normal">poems</span>
              </h3>
              <p className="text-[var(--color-text-muted)] mb-4">
                Explore verses in English from poets worldwide
              </p>
              <span className="link-accent font-semibold">Browse →</span>
            </div>
          </Link>

          <Link
            to="/poems?language=hindi"
            className="glass-card p-8 group relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                 style={{ background: 'linear-gradient(135deg, rgba(232, 93, 117, 0.05) 0%, rgba(255, 126, 103, 0.05) 100%)' }}></div>
            <div className="relative z-10">
              <span className="section-label">हिंदी कविता</span>
              <h3 className="font-display text-3xl font-bold mt-2 mb-3">
                {stats?.languages?.hindi || 0} <span className="text-lg font-normal">कविताएँ</span>
              </h3>
              <p className="text-[var(--color-text-muted)] mb-4">
                हिंदी की सुंदर कविताओं का संग्रह
              </p>
              <span className="link-accent font-semibold">Browse →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="text-center p-8 md:p-12 rounded-3xl relative overflow-hidden"
             style={{ background: 'var(--gradient-primary)' }}>
          <div className="absolute inset-0 opacity-20">
            <div className="float-decoration" style={{ top: '10%', left: '10%' }}></div>
            <div className="float-decoration" style={{ bottom: '10%', right: '15%', animationDelay: '2s' }}></div>
          </div>

          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Your poetry matters here
            </h2>
            <p className="text-white/80 max-w-lg mx-auto mb-8">
              P4Poetry is your space to express yourself freely. Claim your profile to manage your poems and connect with readers who appreciate your words.
            </p>
            <a
              href="mailto:web@p4poetry.com"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[var(--color-deep)] font-semibold rounded-full hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Claim Your Profile
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
