import axios from 'axios';
import mockData from './mockData';

// API 기본 설정
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://newsbiasinsight.netlify.app/api'
});

// 관리 중인 클러스터 데이터 캐시
let clustersCache = [];

// 모킹 및 실제 API를 모두 처리할 수 있는 래퍼 함수
const apiWrapper = async (apiCall, mockResult, errorHandler) => {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    console.warn(`API 호출 실패, 모킹 데이터 사용: ${error.message}`);
    if (errorHandler) {
      return errorHandler(error);
    }
    // 모킹 데이터 포맷에 맞게 반환
    return { data: mockResult };
  }
};

// 뉴스 클러스터 관련 API
const clusters = {
  // 핫 클러스터 가져오기
  getHot: async (params) => {
    const response = await api.get('/clusters/hot', { params });
    // 캐시에 저장
    if (response.data && response.data.clusters) {
      clustersCache = response.data.clusters;
      mockData.setHotClusters(response.data.clusters);
    }
    return response;
  },
  
  // 클러스터 상세 정보 가져오기 (없으면 모킹 사용)
  getById: async (clusterId) => {
    // 캐시에서 먼저 찾기
    const cachedCluster = clustersCache.find(c => c._id === clusterId);
    if (cachedCluster) {
      console.log('캐시에서 클러스터 찾음:', clusterId);
      return { data: cachedCluster };
    }
    
    // API 호출 시도
    return apiWrapper(
      () => api.get(`/clusters/hot/${clusterId}`),
      mockData.getClusterDetail(clusterId)
    );
  },
  
  // 카테고리별 핫 클러스터 가져오기
  getHotByCategory: async (category, params) => {
    return apiWrapper(
      () => api.get(`/clusters/hot/${category}`, { params }),
      { clusters: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
    );
  }
};

// 통계 관련 API
const statistics = {
  // 기본 통계 가져오기
  getStats: async () => {
    return await api.get('/statistics');
  },
  
  // 날짜 목록 가져오기 (모킹 데이터 사용)
  getDates: async () => {
    return apiWrapper(
      () => api.get('/dates'),
      { dates: mockData.dates }
    );
  },
  
  // 카테고리 목록 가져오기 (모킹 데이터 사용)
  getCategories: async () => {
    return apiWrapper(
      () => api.get('/categories'),
      { categories: mockData.categories }
    );
  },
  
  // 검색 기능 (모킹으로 클러스터 중 검색)
  search: async (params) => {
    const query = params.q?.toLowerCase() || '';
    
    return apiWrapper(
      () => api.get('/search', { params }),
      {
        clusters: clustersCache.filter(cluster => 
          cluster.title?.toLowerCase().includes(query) ||
          cluster.left?.summary?.toLowerCase().includes(query) ||
          cluster.center?.summary?.toLowerCase().includes(query) ||
          cluster.right?.summary?.toLowerCase().includes(query)
        ),
        totalCount: clustersCache.length,
        totalPages: 1,
        currentPage: 1
      }
    );
  },
  
  // 인기 키워드 및 뉴스 가져오기 (모킹 데이터 사용)
  getTrending: async () => {
    return apiWrapper(
      () => api.get('/trending'),
      mockData.trending
    );
  }
};

// API 서비스 객체
const apiService = {
  clusters,
  statistics
};

export default apiService;