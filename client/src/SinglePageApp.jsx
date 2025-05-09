import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import apiService from './utils/api';
import ClusterCard from './components/ClusterCard';
import ImageLoader from './components/ImageLoader';

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
  
  // 에러 상태
  const [error, setError] = useState(null);

  // 다크모드 토글
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };
  
  // 날짜 및 카테고리 목록 가져오기
  useEffect(() => {
    // 날짜 목록 가져오기
    apiService.statistics.getDates()
      .then(response => {
        console.log('날짜 데이터 로드 성공:', response.data);
        setDates(response.data.dates || []);
        if (response.data.dates && response.data.dates.length > 0) {
          setSelectedDate(response.data.dates[0]);
        }
      })
      .catch(error => {
        console.error('Error fetching dates:', error);
        setError('날짜 목록을 가져오는 중 오류가 발생했습니다.');
      });
      
    // 카테고리 목록 가져오기
    apiService.statistics.getCategories()
      .then(response => {
        console.log('카테고리 데이터 로드 성공:', response.data);
        setCategories(response.data.categories || []);
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        setError('카테고리 목록을 가져오는 중 오류가 발생했습니다.');
      });
  }, []);

  // 뉴스 데이터 가져오기 (검색 또는 일반 목록)
  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      setError(null);
      
      const params = {
        date: selectedDate,
        page: page,
        limit: itemsPerPage
      };
      
      // 검색 중이면 검색 API 사용, 아니면 기본 클러스터 API 사용
      let apiPromise;
      if (isSearching && searchQuery.trim()) {
        params.q = searchQuery;
        apiPromise = apiService.statistics.search(params);
      } else if (selectedCategory) {
        params.category = selectedCategory;
        apiPromise = apiService.clusters.getHotByCategory(selectedCategory, params);
      } else {
        apiPromise = apiService.clusters.getHot(params);
      }
      
      apiPromise
        .then(response => {
          console.log('클러스터 데이터 로드 성공:', response.data);
          if (response.data.clusters) {
            setClusters(response.data.clusters);
            
            // 페이지네이션 정보
            if (response.data.pagination) {
              setTotalCount(response.data.pagination.total || 0);
              setTotalPages(response.data.pagination.totalPages || 1);
            } else {
              setTotalCount(response.data.totalCount || response.data.clusters.length);
              setTotalPages(response.data.totalPages || 1);
            }
          } else {
            setClusters([]);
            setTotalCount(0);
            setTotalPages(1);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          setLoading(false);
          setError('뉴스 데이터를 가져오는 중 오류가 발생했습니다.');
        });
      
      // 인기 뉴스 정보 가져오기
      apiService.statistics.getTrending()
        .then(response => {
          console.log('인기 뉴스 데이터 로드 성공:', response.data);
          setTrendingData(response.data);
        })
        .catch(error => {
          console.error('Error fetching trending data:', error);
        });
        
      // 통계 데이터도 가져오기
      apiService.statistics.getStats()
        .then(response => {
          console.log('통계 데이터 로드 성공:', response.data);
          setStats(response.data);
        })
        .catch(error => {
          console.error('Error fetching stats:', error);
        });
    }
  }, [selectedDate, selectedCategory, page, isSearching, searchQuery]);
  
  // 클러스터 세부 정보 가져오기
  const fetchClusterDetails = (clusterId) => {
    setLoading(true);
    setError(null);
    
    apiService.clusters.getById(clusterId)
      .then(response => {
        console.log('클러스터 상세 정보 로드 성공:', response.data);
        setSelectedCluster(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching cluster details:', error);
        setLoading(false);
        setError('클러스터 상세 정보를 가져오는데 실패했습니다.');
      });
  };
  
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
    if (!biasRatio) {
      biasRatio = { left: 0.33, center: 0.34, right: 0.33 };
    }
    
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
    // ID만 있는 경우 상세 정보 가져오기
    if (cluster._id && (!cluster.left || !cluster.center || !cluster.right)) {
      fetchClusterDetails(cluster._id);
    } else {
      setSelectedCluster(cluster);
    }
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
    setError(null);
  };

  // 통계 대시보드 렌더링
  const renderStatsDashboard = () => {
    if (!stats) return null;
    
    const { biasCount, total } = stats;
    const totalBias = (biasCount?.left || 0) + (biasCount?.center || 0) + (biasCount?.right || 0);
    
    // 각 편향성 비율 계산
    const biasDistribution = {
      avgLeftRatio: totalBias ? (biasCount?.left || 0) / totalBias : 0,
      avgCenterRatio: totalBias ? (biasCount?.center || 0) / totalBias : 0,
      avgRightRatio: totalBias ? (biasCount?.right || 0) / totalBias : 0
    };
    
    return (
      <div className="stats-dashboard">
        <h2>뉴스 통계 ({selectedDate})</h2>
        <div className="stats-card">
          <h3>뉴스 클러스터 수</h3>
          <div className="stats-number">{total || 0}</div>
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
    // 이미지 ID 가져오기
    const getMainImageId = () => {
      // 클러스터 자체 이미지
      if (selectedCluster.image_file_id) return selectedCluster.image_file_id;
      
      // 왼쪽 기사 이미지
      if (selectedCluster.left && selectedCluster.left.image_file_id) {
        return selectedCluster.left.image_file_id;
      }
      
      // 중앙 기사 이미지
      if (selectedCluster.center && selectedCluster.center.image_file_id) {
        return selectedCluster.center.image_file_id;
      }
      
      // 오른쪽 기사 이미지
      if (selectedCluster.right && selectedCluster.right.image_file_id) {
        return selectedCluster.right.image_file_id;
      }
      
      return null;
    };
    
    const mainImageId = getMainImageId();
    
    return (
      <div className="app-container">
        <header className="app-header">
          <h1 className="title">한국판 그라운드 뉴스</h1>
          <button className="back-button" onClick={goBack}>← 목록으로 돌아가기</button>
        </header>
        
        {loading ? (
          <div className="loading">뉴스 상세 정보를 불러오는 중...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="cluster-detail">
            <h2 className="detail-title">{selectedCluster.title}</h2>
            <div className="detail-meta">
              <span className="detail-date">{selectedCluster.pub_date || selectedCluster.crawl_date}</span>
            </div>
            
            {/* 대표 이미지 표시 */}
            {mainImageId && (
              <div style={{ maxWidth: '100%', overflow: 'hidden', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                <ImageLoader 
                  imageId={mainImageId}
                  alt={selectedCluster.title}
                  width="100%"
                  height={400}
                  cluster={selectedCluster}
                />
              </div>
            )}
            
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
                                {selectedCluster.left.article_urls && selectedCluster.left.article_urls[i] 
                                  ? <a href={selectedCluster.left.article_urls[i]} target="_blank" rel="noopener noreferrer">{press}</a>
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
                                {selectedCluster.center.article_urls && selectedCluster.center.article_urls[i] 
                                  ? <a href={selectedCluster.center.article_urls[i]} target="_blank" rel="noopener noreferrer">{press}</a>
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
                                {selectedCluster.right.article_urls && selectedCluster.right.article_urls[i] 
                                  ? <a href={selectedCluster.right.article_urls[i]} target="_blank" rel="noopener noreferrer">{press}</a>
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
            
            {/* 관련 이미지 갤러리 */}
            {(selectedCluster.left?.image_file_id || selectedCluster.center?.image_file_id || selectedCluster.right?.image_file_id) && (
              <div className="related-images">
                <h3>관련 이미지</h3>
                <div className="image-gallery">
                  {selectedCluster.left?.image_file_id && (
                    <div className="gallery-item">
                      <ImageLoader 
                        imageId={selectedCluster.left.image_file_id}
                        alt="진보적 관점 기사 이미지"
                        width="100%"
                        height="100%"
                        placeholderText="진보 기사 이미지"
                      />
                      <div className="gallery-caption">진보적 관점 기사</div>
                    </div>
                  )}
                  {selectedCluster.center?.image_file_id && (
                    <div className="gallery-item">
                      <ImageLoader 
                        imageId={selectedCluster.center.image_file_id}
                        alt="중도적 관점 기사 이미지"
                        width="100%"
                        height="100%"
                        placeholderText="중도 기사 이미지"
                      />
                      <div className="gallery-caption">중도적 관점 기사</div>
                    </div>
                  )}
                  {selectedCluster.right?.image_file_id && (
                    <div className="gallery-item">
                      <ImageLoader 
                        imageId={selectedCluster.right.image_file_id}
                        alt="보수적 관점 기사 이미지"
                        width="100%"
                        height="100%"
                        placeholderText="보수 기사 이미지"
                      />
                      <div className="gallery-caption">보수적 관점 기사</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
        <h3 className="trending-title">주요 뉴스</h3>
        <div className="trending-list">
          {trendingData.trendingClusters.slice(0, 5).map((cluster, index) => (
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
      
      {error && <div className="error-message">{error}</div>}
      
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
          <div className="cluster-list">
            {clusters && clusters.length > 0 ? clusters.map(cluster => (
              <ClusterCard 
                key={cluster._id}
                cluster={cluster}
                onClick={() => viewClusterDetails(cluster)}
                showImage={true}
                imageSize={{ width: 200, height: 150 }}
              />
            )) : (
              <div className="no-clusters">
                {isSearching ? '검색 결과가 없습니다.' : '해당 조건에 맞는 뉴스가 없습니다.'}
              </div>
            )}
          </div>
          
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