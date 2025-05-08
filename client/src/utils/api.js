import axios from 'axios';
import mockData from './mockData';

// API 기본 설정
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://newsbiasinsight.netlify.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // 10초 타임아웃
});

// API 에러 처리 헬퍼 함수
const handleApiError = (error) => {
  console.error('API 에러:', error);
  
  // axios 에러 형식에 따라 처리
  if (error.response) {
    // 서버가 응답했으나 에러 상태 코드인 경우
    console.error('서버 에러 응답:', error.response.status, error.response.data);
    return { 
      error: true, 
      status: error.response.status, 
      message: error.response.data.message || '서버 에러가 발생했습니다.' 
    };
  } else if (error.request) {
    // 요청이 전송되었으나 응답이 없는 경우
    console.error('서버 응답 없음:', error.request);
    return { 
      error: true, 
      status: 0, 
      message: '서버가 응답하지 않습니다. 네트워크 연결을 확인해주세요.' 
    };
  } else {
    // 요청 설정 중 에러가 발생한 경우
    console.error('요청 설정 에러:', error.message);
    return { 
      error: true, 
      status: 0, 
      message: '요청을 보내는 중 에러가 발생했습니다.' 
    };
  }
};

// 모킹 및 실제 API를 모두 처리할 수 있는 래퍼 함수
const apiWrapper = async (apiCall, mockResult, useCache = false, cacheKey = null) => {
  try {
    const response = await apiCall();
    
    // 캐싱이 필요한 경우 로컬 스토리지에 저장
    if (useCache && cacheKey && response.data) {
      const cacheData = {
        data: response.data,
        timestamp: Date.now()
      };
      localStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify(cacheData));
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    const errorResult = handleApiError(error);
    
    // 에러 발생 시 모킹 데이터 사용 (개발 환경에서만)
    if (import.meta.env.DEV && mockResult) {
      console.warn(`API 호출 실패, 모킹 데이터 사용합니다:`, errorResult.message);
      return { success: true, data: mockResult, isMocked: true };
    }
    
    // 에러 결과 반환
    return { success: false, ...errorResult };
  }
};

// 클러스터 관련 API
const clusters = {
  // 클러스터 목록 조회
  getList: async (params = {}) => {
    const defaultParams = {
      page: 1,
      limit: 10
    };
    const queryParams = { ...defaultParams, ...params };
    
    // 캐시 확인 (5분 유효기간)
    const cacheKey = `clusters_list_${JSON.stringify(queryParams)}`;
    const cachedData = localStorage.getItem(`api_cache_${cacheKey}`);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      const cacheAge = now - timestamp;
      
      // 5분(300,000ms) 이내의 캐시면 사용
      if (cacheAge < 300000) {
        console.log('캐시된 클러스터 목록 사용:', cacheKey);
        return { success: true, data, fromCache: true };
      }
    }
    
    return await apiWrapper(
      () => api.get('/clusters', { params: queryParams }),
      { 
        clusters: mockData.hotClusters, 
        pagination: { 
          total: mockData.hotClusters.length, 
          page: queryParams.page, 
          limit: queryParams.limit, 
          totalPages: Math.ceil(mockData.hotClusters.length / queryParams.limit) 
        } 
      },
      true,
      cacheKey
    );
  },
  
  // 핫 클러스터 조회
  getHot: async (params = {}) => {
    const defaultParams = {
      page: 1,
      limit: 5
    };
    const queryParams = { ...defaultParams, ...params };
    
    return await apiWrapper(
      () => api.get('/clusters/hot', { params: queryParams }),
      { 
        clusters: mockData.hotClusters, 
        pagination: { 
          total: mockData.hotClusters.length, 
          page: queryParams.page, 
          limit: queryParams.limit, 
          totalPages: Math.ceil(mockData.hotClusters.length / queryParams.limit) 
        } 
      }
    );
  },
  
  // 클러스터 상세 정보 조회
  getById: async (clusterId) => {
    if (!clusterId) {
      return { success: false, error: true, message: '클러스터 ID가 필요합니다.' };
    }
    
    return await apiWrapper(
      () => api.get(`/clusters/${clusterId}`),
      mockData.getClusterDetail(clusterId)
    );
  },
  
  // 카테고리별 클러스터 조회
  getByCategory: async (category, params = {}) => {
    if (!category) {
      return { success: false, error: true, message: '카테고리가 필요합니다.' };
    }
    
    const defaultParams = {
      page: 1,
      limit: 10
    };
    const queryParams = { ...defaultParams, ...params };
    
    return await apiWrapper(
      () => api.get(`/clusters/category/${category}`, { params: queryParams }),
      { 
        clusters: mockData.hotClusters.filter(c => c.category === category),
        pagination: { 
          total: mockData.hotClusters.filter(c => c.category === category).length, 
          page: queryParams.page, 
          limit: queryParams.limit, 
          totalPages: Math.ceil(mockData.hotClusters.filter(c => c.category === category).length / queryParams.limit) 
        } 
      }
    );
  },
  
  // 날짜별 클러스터 조회
  getByDate: async (date, params = {}) => {
    if (!date) {
      return { success: false, error: true, message: '날짜가 필요합니다.' };
    }
    
    const defaultParams = {
      page: 1,
      limit: 10
    };
    const queryParams = { ...defaultParams, ...params };
    
    return await apiWrapper(
      () => api.get(`/clusters/date/${date}`, { params: queryParams }),
      { 
        clusters: mockData.hotClusters.filter(c => c.pub_date === date || c.crawl_date === date),
        pagination: { 
          total: mockData.hotClusters.filter(c => c.pub_date === date || c.crawl_date === date).length, 
          page: queryParams.page, 
          limit: queryParams.limit, 
          totalPages: Math.ceil(mockData.hotClusters.filter(c => c.pub_date === date || c.crawl_date === date).length / queryParams.limit) 
        } 
      }
    );
  }
};

// 통계 관련 API
const statistics = {
  // 기본 통계 가져오기
  getStats: async () => {
    return await apiWrapper(
      () => api.get('/statistics'),
      mockData.statistics
    );
  },
  
  // 날짜 목록 가져오기
  getDates: async () => {
    return await apiWrapper(
      () => api.get('/dates'),
      { dates: mockData.dates }
    );
  },
  
  // 카테고리 목록 가져오기
  getCategories: async () => {
    return await apiWrapper(
      () => api.get('/categories'),
      { categories: mockData.categories }
    );
  },
  
  // 검색 기능
  search: async (params = {}) => {
    if (!params.q) {
      return { success: false, error: true, message: '검색어가 필요합니다.' };
    }
    
    const defaultParams = {
      page: 1,
      limit: 10
    };
    const queryParams = { ...defaultParams, ...params };
    const query = queryParams.q.toLowerCase();
    
    return await apiWrapper(
      () => api.get('/search', { params: queryParams }),
      {
        clusters: mockData.hotClusters.filter(cluster => 
          cluster.title?.toLowerCase().includes(query) ||
          cluster.left?.summary?.toLowerCase().includes(query) ||
          cluster.center?.summary?.toLowerCase().includes(query) ||
          cluster.right?.summary?.toLowerCase().includes(query)
        ),
        pagination: {
          total: mockData.hotClusters.filter(cluster => 
            cluster.title?.toLowerCase().includes(query) ||
            cluster.left?.summary?.toLowerCase().includes(query) ||
            cluster.center?.summary?.toLowerCase().includes(query) ||
            cluster.right?.summary?.toLowerCase().includes(query)
          ).length,
          page: queryParams.page,
          limit: queryParams.limit,
          totalPages: Math.ceil(mockData.hotClusters.filter(cluster => 
            cluster.title?.toLowerCase().includes(query) ||
            cluster.left?.summary?.toLowerCase().includes(query) ||
            cluster.center?.summary?.toLowerCase().includes(query) ||
            cluster.right?.summary?.toLowerCase().includes(query)
          ).length / queryParams.limit)
        }
      }
    );
  },
  
  // 인기 키워드 및 뉴스 가져오기
  getTrending: async () => {
    return await apiWrapper(
      () => api.get('/trending'),
      mockData.trending
    );
  }
};

// API 인터셉터 설정
api.interceptors.request.use(
  (config) => {
    // 요청 전 처리 (예: 로딩 표시 등)
    console.log(`API 요청: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    // 요청 에러 처리
    console.error('API 요청 에러:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // 응답 후 처리
    console.log(`API 응답 성공: ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // 응답 에러 처리
    console.error('API 응답 에러:', error);
    return Promise.reject(error);
  }
);

// API 서비스 객체
const apiService = {
  clusters,
  statistics
};

export default apiService;