import axios from 'axios';

// API 기본 설정
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://newsbiasinsight.netlify.app/api'
});

// 뉴스 클러스터 관련 API
const clusters = {
  // 모든 클러스터 가져오기 (필터링, 페이지네이션 포함)
  getAll: (params) => api.get('/clusters', { params }),
  
  // 클러스터 상세 정보 가져오기
  getById: (clusterId) => api.get(`/clusters/hot/${clusterId}`),
  
  // 최신 클러스터 가져오기
  getLatest: (params) => api.get('/clusters/latest', { params }),
  
  // 핫 클러스터 가져오기
  getHot: (params) => api.get('/clusters/hot', { params }),
  
  // 카테고리별 핫 클러스터 가져오기
  getHotByCategory: (category, params) => api.get(`/clusters/hot/${category}`, { params }),
  
  // 카테고리별 최신 클러스터 가져오기
  getLatestByCategory: (category, params) => api.get(`/clusters/latest/${category}`, { params })
};

// 통계 관련 API
const statistics = {
  // 기본 통계 가져오기
  getStats: () => api.get('/statistics'),
  
  // 날짜 목록 가져오기
  getDates: () => api.get('/dates'),
  
  // 카테고리 목록 가져오기
  getCategories: () => api.get('/categories'),
  
  // 검색 기능
  search: (params) => api.get('/search', { params }),
  
  // 인기 키워드 및 뉴스 가져오기
  getTrending: (params) => api.get('/trending', { params })
};

// API 서비스 객체
const apiService = {
  clusters,
  statistics
};

export default apiService;