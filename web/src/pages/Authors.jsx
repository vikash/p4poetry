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
                <div
                  className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center font-display text-2xl font-semibold text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
                  style={{ background: getAvatarGradient(author.name) }}
                >
                  {author.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-display text-lg font-medium group-hover:text-[var(--color-rose)] transition-colors">
                  {author.name}
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
