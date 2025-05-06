import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../utils/api';

const ClusterList = () => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // 필터 상태
  const [filters, setFilters] = useState({
    sortBy: 'crawl_date',
    sortOrder: 'desc',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API 호출로 클러스터 목록 가져오기
        const response = await apiService.clusters.getAll({
          page: pagination.page,
          limit: pagination.limit,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          search: filters.search,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        });
        
        setClusters(response.data.clusters);
        setPagination(response.data.pagination);
        setLoading(false);
      } catch (err) {
        console.error('클러스터 목록 가져오기 오류:', err);
        setError('데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
      }
    };

    fetchClusters();
  }, [pagination.page, pagination.limit, filters]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  // 정렬 변경 핸들러
  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split('-');
    setFilters({
      ...filters,
      sortBy,
      sortOrder
    });
    // 정렬 변경 시 첫 페이지로 이동
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // 검색 핸들러
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // 검색 적용 시 첫 페이지로 이동
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // 날짜 필터 변경 핸들러
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
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

  if (loading && clusters.length === 0) {
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
      <h1>뉴스 목록</h1>
      
      <div className="filter-bar">
        <div className="filter-item">
          <span className="filter-label">정렬:</span>
          <select 
            className="select-box" 
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={handleSortChange}
          >
            <option value="crawl_date-desc">최신순</option>
            <option value="crawl_date-asc">오래된순</option>
            <option value="title-asc">제목 오름차순</option>
            <option value="title-desc">제목 내림차순</option>
          </select>
        </div>
        
        <form className="filter-item" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="검색어"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
          <button type="submit" className="btn">검색</button>
        </form>
        
        <div className="filter-item">
          <span className="filter-label">시작일:</span>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleDateFilterChange}
          />
        </div>
        
        <div className="filter-item">
          <span className="filter-label">종료일:</span>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleDateFilterChange}
          />
        </div>
        
        {(filters.dateFrom || filters.dateTo || filters.search) && (
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setFilters({
                ...filters,
                search: '',
                dateFrom: '',
                dateTo: ''
              });
              setPagination({
                ...pagination,
                page: 1
              });
            }}
          >
            필터 초기화
          </button>
        )}
      </div>
      
      {clusters.length === 0 ? (
        <div className="no-results">
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div>
          {clusters.map((cluster) => (
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
          
          {/* 페이지네이션 */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(1)} 
                disabled={pagination.page === 1}
              >
                &laquo;
              </button>
              <button 
                onClick={() => handlePageChange(pagination.page - 1)} 
                disabled={pagination.page === 1}
              >
                &lt;
              </button>
              
              {/* 페이지 번호 */}
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                // 현재 페이지 주변의 페이지 번호 표시
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button 
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={pagination.page === pageNum ? 'active' : ''}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={() => handlePageChange(pagination.page + 1)} 
                disabled={pagination.page === pagination.pages}
              >
                &gt;
              </button>
              <button 
                onClick={() => handlePageChange(pagination.pages)} 
                disabled={pagination.page === pagination.pages}
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClusterList;