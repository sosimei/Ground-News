import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../../utils/api';

const ClusterDetail = () => {
  const { clusterId } = useParams();
  const [cluster, setCluster] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClusterDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          // 실제 API 호출
          const response = await apiService.clusters.getById(clusterId);
          setCluster(response.data);
          
          // 탭 초기값 설정 - 컨텐츠가 있는 탭으로 설정
          if (response.data.left && response.data.left.summary) {
            setActiveTab('left');
          } else if (response.data.center && response.data.center.summary) {
            setActiveTab('center');
          } else if (response.data.right && response.data.right.summary) {
            setActiveTab('right');
          } else {
            setActiveTab('all');
          }
        } catch (apiError) {
          console.error('API 호출 실패, 임시 데이터 사용:', apiError);
          
          // 임시 데이터 (개발 테스트용)
          const tempCluster = {
            _id: "6819ecbc4b3ccf4f77ccf1ac",
            cluster_id: "21",
            title: "미국-한국 무역 협상, 통상 정책 갈등",
            crawl_date: "2024-04-29",
            thumbnail_url: "/api/images/6819ecbc4b3ccf4f77ccf2ac", // 임시 이미지 ID
            bias_ratio: {
              left: 0.4,
              center: 0.3,
              right: 0.3
            },
            left: {
              summary: "진보 성향 언론은 미국의 불공정한 통상 압력을 지적하고, 한국 정부가 국내 산업 보호를 위해 더 강경하게 대응해야 한다고 주장했습니다. 특히 미국의 일방적인 관세 인상 가능성에 대해 강한 우려를 표명했으며, 과거 무역 협상 사례에서 한국이 불리한 입장에 처했던 점을 언급했습니다.",
              keywords: [
                { word: "관세", score: 0.9 },
                { word: "협상", score: 0.85 },
                { word: "미국", score: 0.8 },
                { word: "한국", score: 0.75 },
                { word: "통상", score: 0.7 }
              ],
              press_list: ["한겨레", "경향신문"],
              left_article_ids: ["68113726af7d33520dbfcd10", "68113726af7d33520dbfcd11"],
              left_article_urls: [
                "https://www.hani.co.kr/arti/economy/article12345.html",
                "https://www.khan.co.kr/economy/article67890.html"
              ],
              thumbnail_url: "/api/images/6819ecbc4b3ccf4f77ccf2aa" // 임시 이미지 ID
            },
            center: {
              summary: "중도 성향 언론은 미국과 한국 간 무역 협상의 쟁점을 균형 있게 다루었습니다. 양국의 이해관계가 충돌하는 부분을 객관적으로 분석하고, 협상 과정에서 발생할 수 있는 다양한 시나리오를 제시했습니다. 관세 문제와 함께 기술 이전, 지적재산권 등 다양한 협상 의제를 포괄적으로 다루었습니다.",
              keywords: [
                { word: "관세 협상", score: 0.88 },
                { word: "미국", score: 0.85 },
                { word: "한국", score: 0.8 },
                { word: "정치 일정", score: 0.75 },
                { word: "무역 협상", score: 0.7 }
              ],
              press_list: ["연합뉴스", "중앙일보", "KBS"],
              center_article_ids: ["68113726af7d33520dbfcd12", "68113726af7d33520dbfcd13", "68113726af7d33520dbfcd14"],
              center_article_urls: [
                "https://www.yna.co.kr/view/AKR20250429178200071",
                "https://www.joongang.co.kr/article/123456",
                "https://news.kbs.co.kr/news/view.do?ncd=7654321"
              ],
              thumbnail_url: "/api/images/6819ecbc4b3ccf4f77ccf2ab" // 임시 이미지 ID
            },
            right: {
              summary: "보수 성향 언론은 미국과의 통상 협력 강화 필요성을 강조하고, 한국 기업의 미국 시장 접근성 확대를 위한 전략적 접근을 주문했습니다. 또한 중국과의 관계를 고려한 균형 있는 통상 정책의 중요성을 언급하며, 안보 동맹과 경제 협력을 연계한 포괄적 접근을 제안했습니다.",
              keywords: [
                { word: "관세", score: 0.85 },
                { word: "한국", score: 0.8 },
                { word: "통상 정책", score: 0.75 },
                { word: "중국 요인", score: 0.7 },
                { word: "방위비", score: 0.65 }
              ],
              press_list: ["조선일보", "동아일보", "매일경제"],
              right_article_ids: ["68113726af7d33520dbfcd15", "68113726af7d33520dbfcd16", "68113726af7d33520dbfcd17"],
              right_article_urls: [
                "https://www.chosun.com/economy/article98765.html",
                "https://www.donga.com/news/article54321.html",
                "https://www.mk.co.kr/news/article24680.html"
              ],
              thumbnail_url: "/api/images/6819ecbc4b3ccf4f77ccf2ac" // 임시 이미지 ID
            },
            media_counts: {
              "한겨레": 2,
              "경향신문": 1,
              "연합뉴스": 1,
              "중앙일보": 1,
              "KBS": 1,
              "조선일보": 2,
              "동아일보": 1,
              "매일경제": 1
            },
            created_at: "2025-05-01T13:03:08.119806+00:00",
            updated_at: "2025-05-01T13:03:08.119806+00:00"
          };
          
          setCluster(tempCluster);
          
          // 탭 초기값 설정
          if (tempCluster.left && tempCluster.left.summary) {
            setActiveTab('left');
          } else if (tempCluster.center && tempCluster.center.summary) {
            setActiveTab('center');
          } else if (tempCluster.right && tempCluster.right.summary) {
            setActiveTab('right');
          } else {
            setActiveTab('all');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('클러스터 상세 정보 가져오기 오류:', err);
        setError('데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
      }
    };

    fetchClusterDetail();
  }, [clusterId]);

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <Link to="/news" className="btn">뉴스 목록으로 돌아가기</Link>
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="error-message">
        <p>요청하신 뉴스를 찾을 수 없습니다.</p>
        <Link to="/news" className="btn">뉴스 목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="card cluster-detail-header">
        <div className="cluster-header-content">
          {/* 대표 이미지 표시 */}
          {cluster.thumbnail_url && (
            <div className="cluster-detail-image">
              <img 
                src={cluster.thumbnail_url} 
                alt={cluster.title} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="cluster-header-info">
            <h1 className="cluster-title">{cluster.title}</h1>
            <span className="cluster-date">{formatDate(cluster.crawl_date || cluster.pub_date)}</span>
            
            {cluster.bias_ratio && (
              <>
                <div className="bias-distribution">
                  <div 
                    className="bias-left-bar" 
                    style={{ width: `${cluster.bias_ratio.left * 100}%` }}
                  ></div>
                  <div 
                    className="bias-center-bar" 
                    style={{ width: `${cluster.bias_ratio.center * 100}%` }}
                  ></div>
                  <div 
                    className="bias-right-bar" 
                    style={{ width: `${cluster.bias_ratio.right * 100}%` }}
                  ></div>
                </div>
                
                <div className="bias-legend">
                  <span>
                    <span className="bias-indicator bias-left">진보</span>
                    {(cluster.bias_ratio.left * 100).toFixed(0)}%
                  </span>
                  <span>
                    <span className="bias-indicator bias-center">중도</span>
                    {(cluster.bias_ratio.center * 100).toFixed(0)}%
                  </span>
                  <span>
                    <span className="bias-indicator bias-right">보수</span>
                    {(cluster.bias_ratio.right * 100).toFixed(0)}%
                  </span>
                </div>
              </>
            )}
            
            {cluster.media_counts && (
              <div>
                <strong>언론사:</strong> {Object.entries(cluster.media_counts).map(([media, count], index, array) => (
                  <span key={media}>
                    {media} ({count}){index < array.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="news-perspectives">
        <div className="perspective-tabs">
          {cluster.left && cluster.left.summary && (
            <div 
              className={`perspective-tab left ${activeTab === 'left' ? 'active' : ''}`}
              onClick={() => handleTabChange('left')}
            >
              진보적 관점
            </div>
          )}
          
          {cluster.center && cluster.center.summary && (
            <div 
              className={`perspective-tab center ${activeTab === 'center' ? 'active' : ''}`}
              onClick={() => handleTabChange('center')}
            >
              중도적 관점
            </div>
          )}
          
          {cluster.right && cluster.right.summary && (
            <div 
              className={`perspective-tab right ${activeTab === 'right' ? 'active' : ''}`}
              onClick={() => handleTabChange('right')}
            >
              보수적 관점
            </div>
          )}
          
          <div 
            className={`perspective-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            모든 기사
          </div>
        </div>
        
        <div className="perspective-content">
          {activeTab === 'left' && cluster.left && (
            <div className="perspective-view">
              {/* 좌측 관점 이미지 */}
              {cluster.left.thumbnail_url && (
                <div className="perspective-image">
                  <img 
                    src={cluster.left.thumbnail_url} 
                    alt="진보 관점 대표 이미지" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="perspective-summary">
                <h3>진보적 관점 요약</h3>
                <p>{cluster.left.summary}</p>
                
                {cluster.left.keywords && (
                  <div className="cluster-keywords">
                    {cluster.left.keywords.map((keyword) => (
                      <span key={keyword.word} className="keyword-tag">
                        {keyword.word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="perspective-articles">
                <h3>진보 성향 언론 기사</h3>
                {cluster.left.press_list && cluster.left.left_article_urls && (
                  <div className="article-list">
                    {cluster.left.press_list.map((press, index) => (
                      <div key={index} className="article-item">
                        <div className="article-header">
                          <span className="article-source">{press}</span>
                        </div>
                        <h4 className="article-title">
                          <a href={cluster.left.left_article_urls[index]} target="_blank" rel="noopener noreferrer">
                            {/* 실제 구현 시 기사 제목 정보 필요 */}
                            {cluster.title} - {press} 기사
                          </a>
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'center' && cluster.center && (
            <div className="perspective-view">
              {/* 중도 관점 이미지 */}
              {cluster.center.thumbnail_url && (
                <div className="perspective-image">
                  <img 
                    src={cluster.center.thumbnail_url} 
                    alt="중도 관점 대표 이미지" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="perspective-summary">
                <h3>중도적 관점 요약</h3>
                <p>{cluster.center.summary}</p>
                
                {cluster.center.keywords && (
                  <div className="cluster-keywords">
                    {cluster.center.keywords.map((keyword) => (
                      <span key={keyword.word} className="keyword-tag">
                        {keyword.word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="perspective-articles">
                <h3>중도 성향 언론 기사</h3>
                {cluster.center.press_list && cluster.center.center_article_urls && (
                  <div className="article-list">
                    {cluster.center.press_list.map((press, index) => (
                      <div key={index} className="article-item">
                        <div className="article-header">
                          <span className="article-source">{press}</span>
                        </div>
                        <h4 className="article-title">
                          <a href={cluster.center.center_article_urls[index]} target="_blank" rel="noopener noreferrer">
                            {/* 실제 구현 시 기사 제목 정보 필요 */}
                            {cluster.title} - {press} 기사
                          </a>
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'right' && cluster.right && (
            <div className="perspective-view">
              {/* 우측 관점 이미지 */}
              {cluster.right.thumbnail_url && (
                <div className="perspective-image">
                  <img 
                    src={cluster.right.thumbnail_url} 
                    alt="보수 관점 대표 이미지" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="perspective-summary">
                <h3>보수적 관점 요약</h3>
                <p>{cluster.right.summary}</p>
                
                {cluster.right.keywords && (
                  <div className="cluster-keywords">
                    {cluster.right.keywords.map((keyword) => (
                      <span key={keyword.word} className="keyword-tag">
                        {keyword.word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="perspective-articles">
                <h3>보수 성향 언론 기사</h3>
                {cluster.right.press_list && cluster.right.right_article_urls && (
                  <div className="article-list">
                    {cluster.right.press_list.map((press, index) => (
                      <div key={index} className="article-item">
                        <div className="article-header">
                          <span className="article-source">{press}</span>
                        </div>
                        <h4 className="article-title">
                          <a href={cluster.right.right_article_urls[index]} target="_blank" rel="noopener noreferrer">
                            {/* 실제 구현 시 기사 제목 정보 필요 */}
                            {cluster.title} - {press} 기사
                          </a>
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'all' && (
            <div>
              <h3>모든 언론사 기사</h3>
              <div className="all-articles">
                {/* 진보 기사 */}
                {cluster.left && cluster.left.press_list && cluster.left.left_article_urls && (
                  <div className="bias-section">
                    <h4>
                      <span className="bias-indicator bias-left">진보</span> 언론사 기사
                    </h4>
                    {cluster.left.press_list.map((press, index) => (
                      <div key={`left-${index}`} className="article-item">
                        <div className="article-header">
                          <span className="article-source">{press}</span>
                        </div>
                        <h4 className="article-title">
                          <a href={cluster.left.left_article_urls[index]} target="_blank" rel="noopener noreferrer">
                            {cluster.title} - {press} 기사
                          </a>
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 중도 기사 */}
                {cluster.center && cluster.center.press_list && cluster.center.center_article_urls && (
                  <div className="bias-section">
                    <h4>
                      <span className="bias-indicator bias-center">중도</span> 언론사 기사
                    </h4>
                    {cluster.center.press_list.map((press, index) => (
                      <div key={`center-${index}`} className="article-item">
                        <div className="article-header">
                          <span className="article-source">{press}</span>
                        </div>
                        <h4 className="article-title">
                          <a href={cluster.center.center_article_urls[index]} target="_blank" rel="noopener noreferrer">
                            {cluster.title} - {press} 기사
                          </a>
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 보수 기사 */}
                {cluster.right && cluster.right.press_list && cluster.right.right_article_urls && (
                  <div className="bias-section">
                    <h4>
                      <span className="bias-indicator bias-right">보수</span> 언론사 기사
                    </h4>
                    {cluster.right.press_list.map((press, index) => (
                      <div key={`right-${index}`} className="article-item">
                        <div className="article-header">
                          <span className="article-source">{press}</span>
                        </div>
                        <h4 className="article-title">
                          <a href={cluster.right.right_article_urls[index]} target="_blank" rel="noopener noreferrer">
                            {cluster.title} - {press} 기사
                          </a>
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/news" className="btn">뉴스 목록으로 돌아가기</Link>
      </div>
    </div>
  );
};

export default ClusterDetail;