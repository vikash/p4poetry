import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function PoemDetail() {
  const { slug } = useParams()
  const [poem, setPoem] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/poems/${slug}`).then(r => {
        if (!r.ok) throw new Error('Poem not found')
        return r.json()
      }),
      fetch(`/api/poems/${slug}/comments`).then(r => r.json())
    ]).then(([poemData, commentsData]) => {
      setPoem(poemData.data)
      setComments(commentsData.data || [])
      setLoading(false)
    }).catch(err => {
      setError(err.message)
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !poem) {
    return (
      <div className="text-center py-20">
        <div className="divider-artistic mb-8">
          <span className="text-[var(--color-gold)]">✦</span>
        </div>
        <h1 className="font-display text-3xl font-bold mb-4 gradient-text">Poem Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          The poem you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/poems" className="btn-secondary">
          Browse Poems
        </Link>
      </div>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const formatCommentDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <article className="fade-in-up">
      {/* Breadcrumb */}
      <nav className="mb-8 text-center">
        <Link to="/poems" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-rose)] transition-colors">
          ← Back to Poems
        </Link>
      </nav>

      {/* Poem Card */}
      <div className="glass-card p-8 md:p-12 relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
             style={{ background: 'var(--gradient-warm)' }}></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10"
             style={{ background: 'var(--gradient-primary)' }}></div>

        <div className="relative z-10">
          {/* Poem Header */}
          <header className="text-center max-w-3xl mx-auto mb-8">
            <span className={`badge ${poem.language === 'hindi' ? 'badge-hindi' : 'badge-english'} mb-6 inline-block`}>
              {poem.language === 'hindi' ? 'हिंदी' : 'English'}
            </span>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {poem.title}
            </h1>

            <p className="text-lg text-[var(--color-text-light)]">
              By{' '}
              <Link to={`/authors/${poem.author_slug}`} className="link-accent font-semibold">
                {poem.author_name}
              </Link>
              {poem.original_date && (
                <span className="text-[var(--color-text-muted)]">
                  {' '} · {formatDate(poem.original_date)}
                </span>
              )}
            </p>
          </header>

          {/* Decorative Divider */}
          <div className="divider-artistic">
            <span className="text-[var(--color-gold)]">✦</span>
          </div>

          {/* The Poem */}
          <section className="max-w-2xl mx-auto py-8">
            <div className="poem-content text-center whitespace-pre-line">
              {poem.content_text}
            </div>
          </section>

          {/* End Ornament */}
          <div className="text-center my-8">
            <span className="text-3xl text-[var(--color-gold)]">❧</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {poem.tags && poem.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {poem.tags.map(tag => (
            <span
              key={tag}
              className="px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-sm text-[var(--color-purple)] border border-[var(--color-purple)]/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Author Card */}
      <section className="glass-card p-6 md:p-8 mt-8">
        <div className="flex items-center gap-6">
          <div className="avatar">
            {poem.author_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="section-label mb-1">About the Poet</p>
            <h3 className="font-display text-xl font-semibold">
              <Link to={`/authors/${poem.author_slug}`} className="hover:text-[var(--color-rose)] transition-colors">
                {poem.author_name}
              </Link>
            </h3>
          </div>
          <Link
            to={`/authors/${poem.author_slug}`}
            className="btn-primary text-sm hidden md:inline-flex"
          >
            View Profile
          </Link>
        </div>
      </section>

      {/* Navigation */}
      <nav className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
        <Link to="/poems" className="link-accent font-semibold">
          ← All Poems
        </Link>
        <Link to={`/authors/${poem.author_slug}`} className="link-accent font-semibold">
          More by {poem.author_name} →
        </Link>
      </nav>

      {/* Comments / Readers' Responses */}
      {comments.length > 0 && (
        <section className="mt-16">
          <div className="glass-card p-8">
            <header className="mb-8 text-center">
              <span className="section-label">Readers' Responses</span>
              <h2 className="font-display text-2xl font-bold gradient-text mt-2">
                {comments.length} Comment{comments.length !== 1 ? 's' : ''}
              </h2>
            </header>

            <div className="space-y-6 max-w-2xl mx-auto">
              {comments.map(comment => (
                <div key={comment.id} className="p-4 rounded-2xl bg-[var(--color-cream)] border-l-4 border-[var(--color-rose)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                         style={{ background: 'var(--gradient-primary)' }}>
                      {comment.author_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm">{comment.author_name}</span>
                    {comment.commented_at && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatCommentDate(comment.commented_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--color-text-light)] leading-relaxed whitespace-pre-line pl-11">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
