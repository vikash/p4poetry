import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'

// Generate a consistent color for each author based on their name
const getAvatarGradient = (name) => {
  const gradients = [
    'linear-gradient(135deg, #2d1b4e 0%, #5c3d7a 100%)',
    'linear-gradient(135deg, #5c3d7a 0%, #e85d75 100%)',
    'linear-gradient(135deg, #e85d75 0%, #ff7e67 100%)',
    'linear-gradient(135deg, #ff7e67 0%, #f4c430 100%)',
    'linear-gradient(135deg, #2d1b4e 0%, #e85d75 100%)',
    'linear-gradient(135deg, #5c3d7a 0%, #ff7e67 100%)',
  ]
  const index = name ? name.charCodeAt(0) % gradients.length : 0
  return gradients[index]
}

export default function AuthorDetail() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [author, setAuthor] = useState(null)
  const [poems, setPoems] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/authors/${slug}`).then(r => {
        if (!r.ok) throw new Error('Author not found')
        return r.json()
      }),
      fetch(`/api/authors/${slug}/poems?page=${page}`).then(r => r.json())
    ]).then(([authorData, poemsData]) => {
      setAuthor(authorData.data)
      setPoems(poemsData.data?.poems || [])
      setPagination({
        total: poemsData.data?.total || 0,
        page: poemsData.data?.page || 1,
        totalPages: poemsData.data?.total_pages || 1
      })
      setLoading(false)
    }).catch(err => {
      setError(err.message)
      setLoading(false)
    })
  }, [slug, page])

  const goToPage = (newPage) => {
    setSearchParams({ page: newPage.toString() })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="text-center py-20">
        <div className="divider-artistic mb-8">
          <span className="text-[var(--color-gold)]">✦</span>
        </div>
        <h1 className="font-display text-3xl font-bold mb-4 gradient-text">Poet Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          The poet you're looking for doesn't exist in our archive.
        </p>
        <Link to="/authors" className="btn-secondary">
          Browse Poets
        </Link>
      </div>
    )
  }

  return (
    <div className="fade-in-up">
      {/* Breadcrumb */}
      <nav className="mb-8 text-center">
        <Link to="/authors" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-rose)] transition-colors">
          ← Back to Poets
        </Link>
      </nav>

      {/* Author Header */}
      <header className="glass-card p-8 md:p-12 text-center mb-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-15"
             style={{ background: 'var(--gradient-warm)' }}></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-10"
             style={{ background: 'var(--gradient-primary)' }}></div>

        <div className="relative z-10">
          {author.gravatar_url ? (
            <img
              src={author.gravatar_url}
              alt={author.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-6 shadow-xl border-4 border-[var(--color-surface-elevated)]"
            />
          ) : (
            <div
              className="avatar-large mx-auto mb-6 shadow-xl"
              style={{ background: getAvatarGradient(author.name) }}
            >
              {author.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            {author.name}
            {author.claimed && (
              <svg className="w-6 h-6 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20" title="Verified">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </h1>

          <div className="divider-artistic">
            <span className="text-[var(--color-gold)]">✦</span>
          </div>

          <p className="text-[var(--color-text-muted)] mt-4">
            <span className="text-2xl font-display font-bold gradient-text">{author.poem_count}</span>
            {' '}poem{author.poem_count !== 1 ? 's' : ''} in the archive
          </p>

          {author.bio && (
            <p className="text-lg text-[var(--color-text-light)] max-w-2xl mx-auto mt-6 leading-relaxed font-display italic">
              {author.bio}
            </p>
          )}
        </div>
      </header>

      {/* Poems Section */}
      <section>
        <header className="text-center mb-8">
          <span className="section-label">Collection</span>
          <h2 className="font-display text-2xl font-bold gradient-text mt-2">
            Poems by {author.name}
          </h2>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {poems.map(poem => (
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

              <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-[var(--color-rose)] transition-colors">
                {poem.title}
              </h3>

              <p className="text-[var(--color-text-light)] leading-relaxed line-clamp-3 font-display italic">
                {poem.content_text?.substring(0, 120)}...
              </p>

              <span className="inline-block mt-4 text-sm link-accent font-semibold">
                Read →
              </span>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <nav className="flex justify-center items-center gap-4 mt-12 pt-8">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="btn-secondary text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-[var(--color-text-muted)] text-sm px-4">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="btn-secondary text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </nav>
        )}
      </section>

      {/* Claim Profile CTA - only show if not already claimed */}
      {!author.claimed && (
        <section className="mt-16">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: 'var(--gradient-primary)' }}></div>

            <div className="relative z-10">
              <span className="section-label mb-4 inline-block">Is this you?</span>
              <h3 className="font-display text-2xl font-bold mb-4">
                Claim this profile
              </h3>
              <p className="text-[var(--color-text-muted)] max-w-md mx-auto mb-6">
                If you're {author.name}, claim your profile to manage your poems, add your bio, and connect with readers who love your work.
              </p>
              <a
                href="mailto:web@p4poetry.com"
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
