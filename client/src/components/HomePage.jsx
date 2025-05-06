import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../utils/api';

const HomePage = () => {
  const [latestClusters, setLatestClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestClusters = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          // API 호출로 최신 뉴스 클러스터 가져오기
          const response = await apiService.clusters.getLatest(6);
          setLatestClusters(response.data);
        } catch (apiError) {
          console.error('API 호출 실패, 임시 데이터 사용:', apiError);
          
          // 임시 데이터 (개발 테스트용)
          setLatestClusters([
            {
              _id: "6819ecbc4b3ccf4f77ccf1ac",
              cluster_id: "21",
              title: "미국-한국 무역 협상, 통상 정책 갈등",
              crawl_date: "2024-04-29",
              bias_ratio: {
                left: 0.4,
                center: 0.3,
                right: 0.3
              },
              media_counts: {
                "연합뉴스": 3,
                "한겨레": 2,
                "조선일보": 2
              }
            },
            {
              _id: "6819ecbc4b3ccf4f77ccf1ad",
              cluster_id: "22",
              title: "코로나 재유행 가능성, 방역 당국 대응책 마련",
              crawl_date: "2024-04-28",
              bias_ratio: {
                left: 0.2,
                center: 0.6,
                right: 0.2
              },
              media_counts: {
                "KBS": 2,
                "MBC": 1,
                "SBS": 1,
                "중앙일보": 1
              }
            },
            {
              _id: "6819ecbc4b3ccf4f77ccf1ae",
              cluster_id: "23",
              title: "반도체 산업 경쟁력 강화 방안 발표",
              crawl_date: "2024-04-28",
              bias_ratio: {
                left: 0.3,
                center: 0.2,
                right: 0.5
              },
              media_counts: {
                "매일경제": 3,
                "한국경제": 2,
                "경향신문": 1
              }
            }
          ]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('뉴스 클러스터 가져오기 오류:', err);
        setError('데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
      }
    };

    fetchLatestClusters();
  }, []);

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
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
        <h1>바이어스 뉴스</h1>
        <p>다양한 관점에서 뉴스를 바라보세요. 하나의 주제에 대해 좌우 정치적 성향에 따라 달라지는 보도를 비교해보세요.</p>
        <Link to="/news" className="btn">모든 뉴스 보기</Link>
      </div>
      
      <h2>최신 뉴스</h2>
      
      {latestClusters.length === 0 ? (
        <p>최신 뉴스가 없습니다.</p>
      ) : (
        <div>
          {latestClusters.map((cluster) => (
            <div key={cluster._id} className="card news-cluster">
              <div className="cluster-header">
                <h3 className="cluster-title">
                  <Link to={`/news/${cluster._id}`}>{cluster.title}</Link>
                </h3>
                <span className="cluster-date">{formatDate(cluster.crawl_date)}</span>
              </div>
              
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
              
              <div>
                <strong>언론사:</strong> {Object.entries(cluster.media_counts).map(([media, count], index, array) => (
                  <span key={media}>
                    {media} ({count}){index < array.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <Link to={`/news/${cluster._id}`} className="btn">자세히 보기</Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <Link to="/news" className="btn">모든 뉴스 보기</Link>
      </div>
      
      <div className="card" style={{ marginTop: '3rem', padding: '1.5rem' }}>
        <h2>바이어스 뉴스란?</h2>
        <p>
          바이어스 뉴스는 한국 언론사들의 정치적 성향에 따른 뉴스 보도 차이를 비교할 수 있는 플랫폼입니다.
          같은 이슈라도 언론사별로 관점과 강조점이 다르게 나타날 수 있습니다.
        </p>
        <p>
          우리는 최신 인공지능 기술을 활용하여 뉴스 기사의 정치적 성향을 분석하고,
          동일한 주제에 대한 진보, 중도, 보수 성향의 기사를 함께 제공함으로써
          사용자가 더 균형 잡힌 시각으로 뉴스를 이해할 수 있도록 돕습니다.
        </p>
        <p>
          다양한 관점의 뉴스를 접하고 비판적 사고를 기르는 데 도움이 되길 바랍니다.
        </p>
      </div>
    </div>
  );
};

export default HomePage;