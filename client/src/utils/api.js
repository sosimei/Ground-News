import axios from 'axios';

// API 기본 설정
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
});

// 뉴스 클러스터 관련 API
const clusters = {
  // 모든 클러스터 가져오기 (필터링, 페이지네이션 포함)
  getAll: (params) => api.get('/clusters', { params }),
  
  // 클러스터 상세 정보 가져오기
  getById: (clusterId) => api.get(`/clusters/${clusterId}`),
  
  // 최신 클러스터 가져오기
  getLatest: (limit = 5) => api.get('/clusters/latest', { params: { limit } })
};

// 통계 관련 API
const statistics = {
  // 바이어스 통계 가져오기
  getBiasStats: (params) => api.get('/statistics/bias', { params }),
  
  // 언론사별 통계 가져오기
  getMediaStats: (params) => api.get('/statistics/media', { params }),
  
  // 카테고리별 통계 가져오기
  getCategoryStats: (params) => api.get('/statistics/category', { params })
};

// API 서비스 객체
const apiService = {
  clusters,
  statistics
};

export default apiService;