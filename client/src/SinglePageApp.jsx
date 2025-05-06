import React, { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 5;
  
  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  
  // 카테고리 관련 상태
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // 다크모드 상태
  const [darkMode, setDarkMode] = useState(false);
  
  // 인기 뉴스 상태
  const [trendingData, setTrendingData] = useState(null);

  // 다크모드 토글
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };
  
  // 날짜 및 카테고리 목록 가져오기
  useEffect(() => {
    // 날짜 목록 가져오기
    fetch('http://localhost:3001/api/dates')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('날짜 데이터 로드 성공:', data);
        setDates(data);
        if (data.length > 0) {
          setSelectedDate(data[0]);
        }
      })
      .catch(error => {
        console.error('Error fetching dates:', error);
        alert('날짜 목록을 가져오는 중 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
      });
      
    // 카테고리 목록 가져오기
    fetch('http://localhost:3001/api/categories')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('카테고리 데이터 로드 성공:', data);
        setCategories(data);
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
      });
  }, []);

  // 뉴스 데이터 가져오기 (검색 또는 일반 목록)
  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      
      const skip = (page - 1) * itemsPerPage;
      let url;
      
      // 검색 중이면 검색 API 사용, 아니면 기본 클러스터 API 사용
      if (isSearching && searchQuery.trim()) {
        url = `http://localhost:3001/api/search?query=${encodeURIComponent(searchQuery)}&date=${selectedDate}&limit=${itemsPerPage}&skip=${skip}`;
        if (selectedCategory) {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }
      } else {
        url = `http://localhost:3001/api/clusters?date=${selectedDate}&limit=${itemsPerPage}&skip=${skip}`;
        if (selectedCategory) {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }
      }
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('클러스터 데이터 로드 성공:', data);
          setClusters(data.clusters);
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          setLoading(false);
          alert('뉴스 데이터를 가져오는 중 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
        });
      
      // 인기 뉴스 정보 가져오기
      fetch(`http://localhost:3001/api/trending?date=${selectedDate}&limit=5`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('인기 뉴스 데이터 로드 성공:', data);
          setTrendingData(data);
        })
        .catch(error => {
          console.error('Error fetching trending data:', error);
        });
        
      // 통계 데이터도 가져오기
      fetch(`http://localhost:3001/api/stats?date=${selectedDate}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('통계 데이터 로드 성공:', data);
          setStats(data);
        })
        .catch(error => {
          console.error('Error fetching stats:', error);
          alert('통계 데이터를 가져오는 중 오류가 발생했습니다.');
        });
    }
  }, [selectedDate, selectedCategory, page, isSearching, searchQuery]);
  
  // 검색 처리 함수
  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(!!searchQuery.trim());
    setPage(1); // 검색 시 페이지 초기화
  };
  
  // 검색 취소 함수
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // 정치 편향성 그래프 렌더링 함수
  const renderBiasGraph = (biasRatio) => {
    const leftWidth = `${biasRatio.left * 100}%`;
    const centerWidth = `${biasRatio.center * 100}%`;
    const rightWidth = `${biasRatio.right * 100}%`;
    
    return (
      <div className="bias-graph">
        <div className="bias-bar">
          <div className="bias-segment left" style={{ width: leftWidth }} title={`진보: ${Math.round(biasRatio.left * 100)}%`}>
            {biasRatio.left > 0.1 && `${Math.round(biasRatio.left * 100)}%`}
          </div>
          <div className="bias-segment center" style={{ width: centerWidth }} title={`중도: ${Math.round(biasRatio.center * 100)}%`}>
            {biasRatio.center > 0.1 && `${Math.round(biasRatio.center * 100)}%`}
          </div>
          <div className="bias-segment right" style={{ width: rightWidth }} title={`보수: ${Math.round(biasRatio.right * 100)}%`}>
            {biasRatio.right > 0.1 && `${Math.round(biasRatio.right * 100)}%`}
          </div>
        </div>
        <div className="bias-labels">
          <span className="bias-label left">진보</span>
          <span className="bias-label center">중도</span>
          <span className="bias-label right">보수</span>
        </div>
      </div>
    );
  };

  // 클러스터 세부 정보 보기
  const viewClusterDetails = (cluster) => {
    setSelectedCluster(cluster);
  };

  // 키워드 렌더링 함수
  const renderKeywords = (keywords) => {
    if (!keywords || keywords.length === 0) return null;
    
    return (
      <div className="keywords">
        {keywords.map((keyword, i) => (
          <span key={i} className="keyword-tag" 
                style={{ opacity: keyword.score * 0.7 + 0.3 }}>
            {keyword.word}
          </span>
        ))}
      </div>
    );
  };

  // 뒤로가기 함수
  const goBack = () => {
    setSelectedCluster(null);
  };

  // 통계 대시보드 렌더링
  const renderStatsDashboard = () => {
    if (!stats) return null;
    
    const { biasDistribution, totalClusters } = stats;
    
    return (
      <div className="stats-dashboard">
        <h2>뉴스 통계 ({selectedDate})</h2>
        <div className="stats-card">
          <h3>뉴스 클러스터 수</h3>
          <div className="stats-number">{totalClusters}</div>
        </div>
        {biasDistribution && (
          <div className="stats-card">
            <h3>평균 정치 성향 분포</h3>
            <div className="bias-graph">
              <div className="bias-bar">
                <div className="bias-segment left" 
                     style={{ width: `${biasDistribution.avgLeftRatio * 100}%` }}
                     title={`진보: ${Math.round(biasDistribution.avgLeftRatio * 100)}%`}>
                  {biasDistribution.avgLeftRatio > 0.1 && `${Math.round(biasDistribution.avgLeftRatio * 100)}%`}
                </div>
                <div className="bias-segment center" 
                     style={{ width: `${biasDistribution.avgCenterRatio * 100}%` }}
                     title={`중도: ${Math.round(biasDistribution.avgCenterRatio * 100)}%`}>
                  {biasDistribution.avgCenterRatio > 0.1 && `${Math.round(biasDistribution.avgCenterRatio * 100)}%`}
                </div>
                <div className="bias-segment right" 
                     style={{ width: `${biasDistribution.avgRightRatio * 100}%` }}
                     title={`보수: ${Math.round(biasDistribution.avgRightRatio * 100)}%`}>
                  {biasDistribution.avgRightRatio > 0.1 && `${Math.round(biasDistribution.avgRightRatio * 100)}%`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 클러스터 상세 정보
  if (selectedCluster) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1 className="title">한국판 그라운드 뉴스</h1>
          <button className="back-button" onClick={goBack}>← 목록으로 돌아가기</button>
        </header>
        
        <div className="cluster-detail">
          <h2 className="detail-title">{selectedCluster.title}</h2>
          <div className="detail-meta">
            <span className="detail-date">{selectedCluster.crawl_date}</span>
          </div>
          
          <div className="bias-section">
            <h3>정치 성향 분포</h3>
            {renderBiasGraph(selectedCluster.bias_ratio)}
          </div>
          
          <div className="perspectives">
            <div className="perspective-columns">
              {/* 진보적 관점 */}
              <div className="perspective left-perspective">
                <h3>진보적 관점</h3>
                {selectedCluster.left && selectedCluster.left.summary 
                  ? (<div className="perspective-content">
                      <p className="summary">{selectedCluster.left.summary}</p>
                      {renderKeywords(selectedCluster.left.keywords)}
                      <div className="source-list">
                        <h4>출처</h4>
                        <ul>
                          {selectedCluster.left.press_list && selectedCluster.left.press_list.map((press, i) => (
                            <li key={i}>
                              {selectedCluster.left.left_article_urls && selectedCluster.left.left_article_urls[i] 
                                ? <a href={selectedCluster.left.left_article_urls[i]} target="_blank" rel="noopener noreferrer">{press}</a>
                                : press
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>)
                  : <p className="empty-perspective">진보적 관점의 기사가 없습니다.</p>
                }
              </div>
              
              {/* 중도적 관점 */}
              <div className="perspective center-perspective">
                <h3>중도적 관점</h3>
                {selectedCluster.center && selectedCluster.center.summary 
                  ? (<div className="perspective-content">
                      <p className="summary">{selectedCluster.center.summary}</p>
                      {renderKeywords(selectedCluster.center.keywords)}
                      <div className="source-list">
                        <h4>출처</h4>
                        <ul>
                          {selectedCluster.center.press_list && selectedCluster.center.press_list.map((press, i) => (
                            <li key={i}>
                              {selectedCluster.center.center_article_urls && selectedCluster.center.center_article_urls[i] 
                                ? <a href={selectedCluster.center.center_article_urls[i]} target="_blank" rel="noopener noreferrer">{press}</a>
                                : press
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>)
                  : <p className="empty-perspective">중도적 관점의 기사가 없습니다.</p>
                }
              </div>
              
              {/* 보수적 관점 */}
              <div className="perspective right-perspective">
                <h3>보수적 관점</h3>
                {selectedCluster.right && selectedCluster.right.summary 
                  ? (<div className="perspective-content">
                      <p className="summary">{selectedCluster.right.summary}</p>
                      {renderKeywords(selectedCluster.right.keywords)}
                      <div className="source-list">
                        <h4>출처</h4>
                        <ul>
                          {selectedCluster.right.press_list && selectedCluster.right.press_list.map((press, i) => (
                            <li key={i}>
                              {selectedCluster.right.right_article_urls && selectedCluster.right.right_article_urls[i] 
                                ? <a href={selectedCluster.right.right_article_urls[i]} target="_blank" rel="noopener noreferrer">{press}</a>
                                : press
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>)
                  : <p className="empty-perspective">보수적 관점의 기사가 없습니다.</p>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 인기 키워드 렌더링 함수
  const renderTrendingKeywords = () => {
    if (!trendingData || !trendingData.trendingKeywords) return null;
    
    return (
      <div className="trending-keywords">
        <h3 className="trending-title">인기 키워드</h3>
        <div className="keywords-cloud">
          {trendingData.trendingKeywords.map((keyword, index) => (
            <span 
              key={index} 
              className="trending-keyword"
              style={{ 
                fontSize: `${Math.min(1.2 + (keyword.totalScore * 0.3), 2)}em`,
                opacity: 0.7 + (keyword.totalScore * 0.2)
              }}
              onClick={() => {
                setSearchQuery(keyword._id);
                setIsSearching(true);
                setPage(1);
              }}
            >
              {keyword._id}
            </span>
          ))}
        </div>
      </div>
    );
  };
  
  // 인기 뉴스 렌더링 함수
  const renderTrendingNews = () => {
    if (!trendingData || !trendingData.trendingClusters) return null;
    
    return (
      <div className="trending-news">
        <h3 className="trending-title">오늘의 주요 뉴스</h3>
        <div className="trending-list">
          {trendingData.trendingClusters.map((cluster, index) => (
            <div key={index} className="trending-item" onClick={() => viewClusterDetails(cluster)}>
              <span className="trending-number">{index + 1}</span>
              <h4 className="trending-cluster-title">{cluster.title}</h4>
              {renderBiasGraph(cluster.bias_ratio)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 클러스터 목록 페이지
  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <div className="header-top">
          <h1 className="title">한국판 그라운드 뉴스</h1>
          <button className="mode-toggle" onClick={toggleDarkMode}>
            {darkMode ? '화면 밝게' : '화면 어둑게'}
          </button>
        </div>
        <p className="subtitle">다양한 관점에서 뉴스를 비교해보세요</p>
      </header>
      
      <div className="top-controls">
        <div className="date-filter">
          <label htmlFor="date-select">날짜:</label>
          <select 
            id="date-select"
            value={selectedDate} 
            onChange={e => {
              setSelectedDate(e.target.value);
              setPage(1); // 날짜 변경 시 페이지 초기화
            }}
          >
            {dates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
        
        <div className="category-filter">
          <label htmlFor="category-select">카테고리:</label>
          <select 
            id="category-select"
            value={selectedCategory} 
            onChange={e => {
              setSelectedCategory(e.target.value);
              setPage(1); // 카테고리 변경 시 페이지 초기화
            }}
          >
            <option value="">전체</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="관심 있는 키워드나 토픽을 검색해보세요"
            className="search-input"
            ref={searchInputRef}
          />
          <button type="submit" className="search-button">검색</button>
          {isSearching && (
            <button type="button" onClick={clearSearch} className="clear-search-button">검색 취소</button>
          )}
        </form>
      </div>
      
      {isSearching && (
        <div className="search-info">
          <p>"{searchQuery}" 검색 결과: {totalCount}개의 뉴스</p>
        </div>
      )}
      
      {!isSearching && (
        <div className="trending-section">
          {renderTrendingKeywords()}
          {renderTrendingNews()}
        </div>
      )}
      
      {renderStatsDashboard()}
      
      {loading ? (
        <div className="loading">뉴스를 불러오는 중...</div>
      ) : (
        <>
          <ul className="cluster-list">
            {clusters && clusters.length > 0 ? clusters.map(cluster => (
              <li key={cluster._id} className="cluster-item" onClick={() => viewClusterDetails(cluster)}>
                <h2 className="cluster-title">{cluster.title}</h2>
                <div className="cluster-meta">
                  <span className="cluster-date">{cluster.crawl_date}</span>
                  {cluster.category && (
                    <span className="cluster-category">{cluster.category}</span>
                  )}
                </div>
                
                {/* 정치 성향 분포 그래프 */}
                {renderBiasGraph(cluster.bias_ratio)}
                
                {/* 언론사 태그 */}
                <div className="press-tags">
                  {Object.keys(cluster.media_counts || {}).map(press => (
                    <span key={press} className="press-tag">
                      {press} ({cluster.media_counts[press]})
                    </span>
                  ))}
                </div>
              </li>
            )) : (
              <div className="no-clusters">
                {isSearching ? '검색 결과가 없습니다.' : '해당 조건에 맞는 뉴스가 없습니다.'}
              </div>
            )}
          </ul>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="page-btn"
              >
                이전
              </button>
              <span className="page-info">페이지 {page} / {totalPages}</span>
              <button 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="page-btn"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
