import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function Poems() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [poems, setPoems] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')

  const page = parseInt(searchParams.get('page') || '1')
  const language = searchParams.get('language') || ''

  useEffect(() => {
    setLoading(true)
    const q = searchParams.get('q')
    let url = q
      ? `/api/poems/search?q=${encodeURIComponent(q)}&page=${page}`
      : `/api/poems?page=${page}&per_page=12`

    if (language) {
      url += `&language=${language}`
    }

    fetch(url)
      .then(r => r.json())
      .then(data => {
        setPoems(data.data?.poems || [])
        setPagination({
          total: data.data?.total || 0,
          page: data.data?.page || 1,
          totalPages: data.data?.total_pages || 1
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [searchParams, page, language])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) {
      params.set('q', search.trim())
    }
    if (language) {
      params.set('language', language)
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const goToPage = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
  }

  const setLanguageFilter = (lang) => {
    const params = new URLSearchParams(searchParams)
    if (lang) {
      params.set('language', lang)
    } else {
      params.delete('language')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  return (
    <div className="fade-in-up">
      {/* Header */}
      <header className="text-center mb-12 pb-8 relative">
        <div className="blob-bg">
          <span className="section-label">The Archive</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-2 mb-4">
            <span className="gradient-text">
              {searchParams.get('q') ? 'Search Results' : 'All Poems'}
            </span>
          </h1>
          {!searchParams.get('q') && (
            <p className="text-lg text-[var(--color-text-muted)] max-w-xl mx-auto">
              Poems shared by our community of writers from around the world
            </p>
          )}
        </div>
      </header>

      {/* Search & Filters */}
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or content..."
              className="input-styled flex-1"
            />
            <button type="submit" className="btn-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </form>

        {/* Language Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setLanguageFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              !language
                ? 'bg-[var(--color-deep)] text-white shadow-lg'
                : 'bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-cream)] border border-[var(--color-deep)]/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setLanguageFilter('english')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              language === 'english'
                ? 'bg-[var(--color-purple)] text-white shadow-lg'
                : 'bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-cream)] border border-[var(--color-purple)]/10'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguageFilter('hindi')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              language === 'hindi'
                ? 'bg-[var(--color-rose)] text-white shadow-lg'
                : 'bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-cream)] border border-[var(--color-rose)]/10'
            }`}
          >
            हिंदी
          </button>
          <button
            onClick={() => setLanguageFilter('marathi')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              language === 'marathi'
                ? 'bg-[var(--color-coral)] text-white shadow-lg'
                : 'bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-cream)] border border-[var(--color-coral)]/10'
            }`}
          >
            मराठी
          </button>
          <button
            onClick={() => setLanguageFilter('punjabi')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              language === 'punjabi'
                ? 'bg-[var(--color-gold)] text-[var(--color-deep)] shadow-lg'
                : 'bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-cream)] border border-[var(--color-gold)]/10'
            }`}
          >
            ਪੰਜਾਬੀ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <p className="text-center text-[var(--color-text-muted)] mb-8">
            {pagination.total} poem{pagination.total !== 1 ? 's' : ''} found
          </p>

          {poems.length === 0 ? (
            <div className="text-center py-16">
              <div className="divider-artistic mb-8">
                <span className="text-[var(--color-gold)]">✦</span>
              </div>
              <p className="font-display text-xl text-[var(--color-text-muted)]">
                No poems found. Try a different search.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {poems.map((poem) => (
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

                  <h2 className="font-display text-xl font-semibold mb-2 group-hover:text-[var(--color-rose)] transition-colors">
                    {poem.title}
                  </h2>

                  <p className="text-sm text-[var(--color-text-muted)] mb-4">by {poem.author_name}</p>

                  <p className="text-[var(--color-text-light)] leading-relaxed line-clamp-3 font-display italic">
                    {poem.content_text?.substring(0, 120)}...
                  </p>

                  <span className="inline-block mt-4 text-sm link-accent font-semibold">
                    Read Poem →
                  </span>
                </Link>
              ))}
            </div>
          )}

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
        </>
      )}
    </div>
  )
}
