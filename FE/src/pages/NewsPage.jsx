import { useEffect, useState } from 'react'
import './History.css'
import newsService from '../services/newsService'

const NewsPage = () => {
  const [sources, setSources] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load sources from API
  const loadSources = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await newsService.getAllSources()
      setSources(data || [])
      return data || []
    } catch (err) {
      console.error('Error loading sources:', err)
      setError('Lỗi khi tải danh sách nguồn tin')
      return []
    }
  }

  // Shuffle function (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Scrape articles from all sources
  const scrapeArticles = async (sourcesToScrape) => {
    if (!sourcesToScrape || sourcesToScrape.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      setArticles([])

      // Scrape all sources concurrently
      const results = await Promise.all(
        sourcesToScrape.map(async (source) => {
          try {
            const articles = await newsService.scrapeNews(source.url)
            return articles || []
          } catch (e) {
            console.error(`Error scraping ${source.url}:`, e)
            return []
          }
        })
      )

      // Flatten all articles from all sources
      const allArticles = results.flat()
      // Shuffle articles before displaying
      const shuffledArticles = shuffleArray(allArticles)
      setArticles(shuffledArticles)
      if (allArticles.length === 0) {
        setError('Không tìm thấy bài báo nào')
      }
    } catch (err) {
      console.error('Error scraping articles:', err)
      setError(err.message || 'Lỗi khi tải tin tức')
    } finally {
      setLoading(false)
    }
  }

  // Load sources on mount
  useEffect(() => {
    const initLoad = async () => {
      const loadedSources = await loadSources()
      await scrapeArticles(loadedSources)
    }
    initLoad()
  }, [])

  return (
    <div className="history-container">
      <div className="history-card">
        <h1 className="history-title">Tin tức</h1>
        <p className="history-subtitle">
          Tổng hợp bài báo sức khỏe từ các trang tin do Admin cấu hình
        </p>

        {error && (
          <div style={{ background: '#fed7d7', color: '#c53030', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(102, 126, 234, 0.2)', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <p style={{ marginTop: 12, color: '#718096' }}>Đang tải bài báo...</p>
          </div>
        )}

        {!loading && sources.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#718096' }}>
            <p>Chưa có nguồn tin nào. Vui lòng liên hệ admin để thêm.</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {articles.map((article) => (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'white',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {article.image && (
                  <div style={{ width: '100%', height: 160, overflow: 'hidden', background: '#f3f4f6' }}>
                    <img
                      src={article.image}
                      alt={article.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#1a202c', lineHeight: 1.4 }}>
                    {article.title}
                  </h3>
                  {article.description && (
                    <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#4a5568', lineHeight: 1.4, flex: 1 }}>
                      {article.description}
                    </p>
                  )}
                  <div style={{ marginTop: 'auto', fontSize: 12, color: '#a0aec0' }}>
                    Nguồn: {article.source}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && sources.length > 0 && !error && (
          <div style={{ textAlign: 'center', padding: 32, color: '#718096' }}>
            <p>Không tìm thấy bài báo nào. Thử lại sau.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default NewsPage