import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

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

export default function Authors() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [authors, setAuthors] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)

  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/authors?page=${page}&per_page=24`)
      .then(r => r.json())
      .then(data => {
        setAuthors(data.data?.authors || [])
        setPagination({
          total: data.data?.total || 0,
          page: data.data?.page || 1,
          totalPages: data.data?.total_pages || 1
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page])

  const goToPage = (newPage) => {
    setSearchParams({ page: newPage.toString() })
  }

  return (
    <div className="fade-in-up">
      {/* Header */}
      <header className="text-center mb-12 pb-8 blob-bg">
        <span className="section-label">Contributors</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-2 mb-4">
          <span className="gradient-text">Poets</span>
        </h1>
        <p className="text-lg text-[var(--color-text-muted)] max-w-xl mx-auto">
          Meet the poets who share their heart and soul through words.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <p className="text-center text-[var(--color-text-muted)] mb-12">
            {pagination.total} poets in the archive
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 stagger-children">
            {authors.map(author => (
              <Link
                key={author.id}
                to={`/authors/${author.slug}`}
                className="group text-center"
              >
                {author.gravatar_url ? (
                  <img
                    src={author.gravatar_url}
                    alt={author.name}
                    className="w-20 h-20 mx-auto mb-4 rounded-full shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-[var(--color-surface-elevated)]"
                  />
                ) : (
                  <div
                    className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center font-display text-2xl font-semibold text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
                    style={{ background: getAvatarGradient(author.name) }}
                  >
                    {author.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="font-display text-lg font-medium group-hover:text-[var(--color-rose)] transition-colors flex items-center justify-center gap-1">
                  {author.name}
                  {author.claimed && (
                    <svg className="w-4 h-4 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20" title="Verified">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {author.poem_count} poem{author.poem_count !== 1 ? 's' : ''}
                </p>
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
        </>
      )}
    </div>
  )
}
