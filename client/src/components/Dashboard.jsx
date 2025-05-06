import React, { useState, useEffect } from 'react';
import apiService from '../utils/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [biasStats, setBiasStats] = useState(null);
  const [mediaStats, setMediaStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 필터 상태
  const [dateFilter, setDateFilter] = useState({
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 바이어스 통계 가져오기
        const biasResponse = await apiService.statistics.getBiasStats(dateFilter);
        setBiasStats(biasResponse.data);
        
        // 언론사별 통계 가져오기
        const mediaResponse = await apiService.statistics.getMediaStats(dateFilter);
        setMediaStats(mediaResponse.data);
        
        // 카테고리별 통계 가져오기
        const categoryResponse = await apiService.statistics.getCategoryStats(dateFilter);
        setCategoryStats(categoryResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('통계 데이터 가져오기 오류:', err);
        setError('통계 데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [dateFilter]);

  // 날짜 필터 변경 핸들러
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter({
      ...dateFilter,
      [name]: value
    });
  };

  // 바이어스 파이 차트 데이터 생성
  const createBiasPieData = (biasData) => {
    if (!biasData) return null;
    
    return {
      labels: ['진보', '중도', '보수'],
      datasets: [
        {
          data: [
            biasData.left * 100, 
            biasData.center * 100, 
            biasData.right * 100
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',  // 진보 - 파란색
            'rgba(250, 204, 21, 0.7)',  // 중도 - 노란색
            'rgba(239, 68, 68, 0.7)'    // 보수 - 빨간색
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(250, 204, 21, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // 언론사별 바 차트 데이터 생성
  const createMediaBarData = (mediaCountData) => {
    if (!mediaCountData) return null;
    
    // 상위 10개 언론사만 선택 (기사 수 기준)
    const topMedia = Object.entries(mediaCountData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: topMedia.map(([media]) => media),
      datasets: [
        {
          label: '기사 수',
          data: topMedia.map(([, count]) => count),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // 카테고리별 바 차트 데이터 생성
  const createCategoryBarData = (categoryCountData) => {
    if (!categoryCountData) return null;
    
    // 상위 10개 카테고리만 선택 (클러스터 수 기준)
    const topCategories = Object.entries(categoryCountData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: topCategories.map(([category]) => category),
      datasets: [
        {
          label: '클러스터 수',
          data: topCategories.map(([, count]) => count),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // 월별 바이어스 라인 차트 옵션
  const biasChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '정치 성향 분포',
      },
    },
  };

  // 언론사/카테고리 바 차트 옵션
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading && (!biasStats || !mediaStats || !categoryStats)) {
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
      <h1>통계 대시보드</h1>
      
      <div className="filter-bar">
        <div className="filter-item">
          <span className="filter-label">시작일:</span>
          <input
            type="date"
            name="dateFrom"
            value={dateFilter.dateFrom}
            onChange={handleDateFilterChange}
          />
        </div>
        
        <div className="filter-item">
          <span className="filter-label">종료일:</span>
          <input
            type="date"
            name="dateTo"
            value={dateFilter.dateTo}
            onChange={handleDateFilterChange}
          />
        </div>
        
        {(dateFilter.dateFrom || dateFilter.dateTo) && (
          <button 
            className="btn btn-secondary"
            onClick={() => setDateFilter({ dateFrom: '', dateTo: '' })}
          >
            필터 초기화
          </button>
        )}
      </div>
      
      <div className="dashboard-grid">
        {/* 전체 바이어스 비율 */}
        {biasStats && biasStats.overall && (
          <div className="dashboard-card">
            <h2>전체 정치 성향 분포</h2>
            <div className="chart-container">
              <Pie data={createBiasPieData(biasStats.overall)} options={biasChartOptions} />
            </div>
          </div>
        )}
        
        {/* 월별 바이어스 추이 */}
        {biasStats && biasStats.monthly && biasStats.monthly.length > 0 && (
          <div className="dashboard-card">
            <h2>월별 정치 성향 추이</h2>
            {biasStats.monthly.map((monthData, index) => (
              <div key={index} className="monthly-bias">
                <h3>{monthData.month}</h3>
                <div className="bias-distribution">
                  <div 
                    className="bias-left-bar" 
                    style={{ width: `${monthData.left * 100}%` }}
                  ></div>
                  <div 
                    className="bias-center-bar" 
                    style={{ width: `${monthData.center * 100}%` }}
                  ></div>
                  <div 
                    className="bias-right-bar" 
                    style={{ width: `${monthData.right * 100}%` }}
                  ></div>
                </div>
                <div className="bias-legend">
                  <span>
                    <span className="bias-indicator bias-left">진보</span>
                    {(monthData.left * 100).toFixed(0)}%
                  </span>
                  <span>
                    <span className="bias-indicator bias-center">중도</span>
                    {(monthData.center * 100).toFixed(0)}%
                  </span>
                  <span>
                    <span className="bias-indicator bias-right">보수</span>
                    {(monthData.right * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 언론사별 기사 수 */}
        {mediaStats && mediaStats.mediaCount && (
          <div className="dashboard-card">
            <h2>언론사별 기사 수</h2>
            <div className="chart-container">
              <Bar data={createMediaBarData(mediaStats.mediaCount)} options={barChartOptions} />
            </div>
          </div>
        )}
        
        {/* 언론사별 정치 성향 */}
        {mediaStats && mediaStats.mediaBias && (
          <div className="dashboard-card">
            <h2>언론사별 정치 성향</h2>
            <div className="media-bias-table">
              <table>
                <thead>
                  <tr>
                    <th>언론사</th>
                    <th>정치 성향</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mediaStats.mediaBias).map(([media, bias]) => (
                    <tr key={media}>
                      <td>{media}</td>
                      <td>
                        <span className={`bias-indicator bias-${bias}`}>
                          {bias === 'left' && '진보'}
                          {bias === 'center' && '중도'}
                          {bias === 'right' && '보수'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* 카테고리별 클러스터 수 */}
        {categoryStats && categoryStats.categoryCount && (
          <div className="dashboard-card">
            <h2>카테고리별 뉴스 수</h2>
            <div className="chart-container">
              <Bar data={createCategoryBarData(categoryStats.categoryCount)} options={barChartOptions} />
            </div>
          </div>
        )}
        
        {/* 카테고리별 정치 성향 */}
        {categoryStats && categoryStats.categoryBias && (
          <div className="dashboard-card">
            <h2>카테고리별 정치 성향</h2>
            <div className="category-bias-list">
              {Object.entries(categoryStats.categoryBias).map(([category, bias]) => (
                <div key={category} className="category-bias-item">
                  <h3>{category}</h3>
                  <div className="bias-distribution">
                    <div 
                      className="bias-left-bar" 
                      style={{ width: `${bias.left * 100}%` }}
                    ></div>
                    <div 
                      className="bias-center-bar" 
                      style={{ width: `${bias.center * 100}%` }}
                    ></div>
                    <div 
                      className="bias-right-bar" 
                      style={{ width: `${bias.right * 100}%` }}
                    ></div>
                  </div>
                  <div className="bias-legend">
                    <span>
                      <span className="bias-indicator bias-left">진보</span>
                      {(bias.left * 100).toFixed(0)}%
                    </span>
                    <span>
                      <span className="bias-indicator bias-center">중도</span>
                      {(bias.center * 100).toFixed(0)}%
                    </span>
                    <span>
                      <span className="bias-indicator bias-right">보수</span>
                      {(bias.right * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;