/**
 * 모바일 앱에서 API 사용 가이드
 * 
 * 이 문서는 바이어스 뉴스 모바일 앱 개발을 위한 API 사용 방법을 설명합니다.
 */

/**
 * API 기본 설정
 * 
 * 모바일 앱에서는 다음과 같이 API 클라이언트를 구성할 수 있습니다.
 * 
 * React Native 예시:
 * 
 * import axios from 'axios';
 * 
 * const api = axios.create({
 *   baseURL: 'https://your-api-domain.com/api',
 *   timeout: 10000,
 *   headers: {
 *     'Content-Type': 'application/json'
 *   }
 * });
 * 
 * Flutter 예시:
 * 
 * import 'package:dio/dio.dart';
 * 
 * Dio dio = Dio();
 * dio.options.baseUrl = 'https://your-api-domain.com/api';
 * dio.options.connectTimeout = 10000; // 10초
 * dio.options.receiveTimeout = 10000; // 10초
 * dio.options.headers = {
 *   'Content-Type': 'application/json'
 * };
 */

/**
 * API 엔드포인트 개요
 * 
 * 1. 클러스터(뉴스 그룹) 관련:
 *    - GET /clusters - 모든 클러스터 가져오기 (필터링, 페이지네이션 지원)
 *    - GET /clusters/latest - 최신 클러스터 가져오기
 *    - GET /clusters/:id - 특정 클러스터 상세 정보 가져오기
 * 
 * 2. 통계 관련:
 *    - GET /statistics/bias - 바이어스 통계 가져오기
 *    - GET /statistics/media - 언론사별 통계 가져오기
 *    - GET /statistics/category - 카테고리별 통계 가져오기
 */

/**
 * 클러스터 목록 가져오기
 * 
 * React Native 예시:
 * 
 * const fetchClusters = async (params) => {
 *   try {
 *     const response = await api.get('/clusters', { params });
 *     return response.data;
 *   } catch (error) {
 *     console.error('Error fetching clusters:', error);
 *     throw error;
 *   }
 * };
 * 
 * // 사용 예시:
 * fetchClusters({
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'crawl_date',
 *   sortOrder: 'desc',
 *   search: '검색어',
 *   dateFrom: '2025-01-01',
 *   dateTo: '2025-05-01'
 * })
 *   .then(data => {
 *     console.log('클러스터 목록:', data.clusters);
 *     console.log('페이지네이션 정보:', data.pagination);
 *   })
 *   .catch(error => {
 *     // 에러 처리
 *   });
 * 
 * Flutter 예시:
 * 
 * Future<Map<String, dynamic>> fetchClusters(Map<String, dynamic> params) async {
 *   try {
 *     final response = await dio.get('/clusters', queryParameters: params);
 *     return response.data;
 *   } catch (error) {
 *     print('Error fetching clusters: $error');
 *     throw error;
 *   }
 * }
 * 
 * // 사용 예시:
 * Map<String, dynamic> params = {
 *   'page': 1,
 *   'limit': 10,
 *   'sortBy': 'crawl_date',
 *   'sortOrder': 'desc',
 *   'search': '검색어',
 *   'dateFrom': '2025-01-01',
 *   'dateTo': '2025-05-01'
 * };
 * 
 * fetchClusters(params).then((data) {
 *   print('클러스터 목록: ${data['clusters']}');
 *   print('페이지네이션 정보: ${data['pagination']}');
 * }).catchError((error) {
 *   // 에러 처리
 * });
 */

/**
 * 특정 클러스터 상세 정보 가져오기
 * 
 * React Native 예시:
 * 
 * const fetchClusterDetail = async (clusterId) => {
 *   try {
 *     const response = await api.get(`/clusters/${clusterId}`);
 *     return response.data;
 *   } catch (error) {
 *     console.error('Error fetching cluster detail:', error);
 *     throw error;
 *   }
 * };
 * 
 * // 사용 예시:
 * fetchClusterDetail('6819ecbc4b3ccf4f77ccf1ac')
 *   .then(cluster => {
 *     console.log('클러스터 상세 정보:', cluster);
 *   })
 *   .catch(error => {
 *     // 에러 처리
 *   });
 * 
 * Flutter 예시:
 * 
 * Future<Map<String, dynamic>> fetchClusterDetail(String clusterId) async {
 *   try {
 *     final response = await dio.get('/clusters/$clusterId');
 *     return response.data;
 *   } catch (error) {
 *     print('Error fetching cluster detail: $error');
 *     throw error;
 *   }
 * }
 * 
 * // 사용 예시:
 * fetchClusterDetail('6819ecbc4b3ccf4f77ccf1ac').then((cluster) {
 *   print('클러스터 상세 정보: $cluster');
 * }).catchError((error) {
 *   // 에러 처리
 * });
 */

/**
 * 통계 데이터 가져오기
 * 
 * React Native 예시:
 * 
 * const fetchBiasStats = async (params) => {
 *   try {
 *     const response = await api.get('/statistics/bias', { params });
 *     return response.data;
 *   } catch (error) {
 *     console.error('Error fetching bias stats:', error);
 *     throw error;
 *   }
 * };
 * 
 * // 사용 예시:
 * fetchBiasStats({
 *   dateFrom: '2025-01-01',
 *   dateTo: '2025-05-01'
 * })
 *   .then(stats => {
 *     console.log('전체 바이어스 비율:', stats.overall);
 *     console.log('월별 바이어스 추이:', stats.monthly);
 *   })
 *   .catch(error => {
 *     // 에러 처리
 *   });
 * 
 * Flutter 예시:
 * 
 * Future<Map<String, dynamic>> fetchBiasStats(Map<String, dynamic> params) async {
 *   try {
 *     final response = await dio.get('/statistics/bias', queryParameters: params);
 *     return response.data;
 *   } catch (error) {
 *     print('Error fetching bias stats: $error');
 *     throw error;
 *   }
 * }
 * 
 * // 사용 예시:
 * Map<String, dynamic> params = {
 *   'dateFrom': '2025-01-01',
 *   'dateTo': '2025-05-01'
 * };
 * 
 * fetchBiasStats(params).then((stats) {
 *   print('전체 바이어스 비율: ${stats['overall']}');
 *   print('월별 바이어스 추이: ${stats['monthly']}');
 * }).catchError((error) {
 *   // 에러 처리
 * });
 */

/**
 * 오프라인 모드 지원
 * 
 * 모바일 앱에서는 오프라인 모드를 지원하기 위해 다음과 같은 방법을 고려할 수 있습니다.
 * 
 * 1. 로컬 데이터베이스 사용:
 *    - React Native: AsyncStorage, Realm, SQLite
 *    - Flutter: Hive, SQLite, Shared Preferences
 * 
 * 2. 캐싱 전략:
 *    - React Native에서 axios-cache-adapter 사용 예시:
 * 
 *      import { setup } from 'axios-cache-adapter';
 *      import AsyncStorage from '@react-native-async-storage/async-storage';
 *      
 *      const cache = {
 *        maxAge: 15 * 60 * 1000, // 15분
 *        store: {
 *          async getItem(key) {
 *            const value = await AsyncStorage.getItem(key);
 *            return value ? JSON.parse(value) : null;
 *          },
 *          async setItem(key, value) {
 *            await AsyncStorage.setItem(key, JSON.stringify(value));
 *          },
 *          async removeItem(key) {
 *            await AsyncStorage.removeItem(key);
 *          }
 *        }
 *      };
 *      
 *      const api = setup({
 *        baseURL: 'https://your-api-domain.com/api',
 *        cache
 *      });
 * 
 *    - Flutter에서 dio_cache_interceptor 사용 예시:
 * 
 *      import 'package:dio/dio.dart';
 *      import 'package:dio_cache_interceptor/dio_cache_interceptor.dart';
 *      import 'package:dio_cache_interceptor_hive_store/dio_cache_interceptor_hive_store.dart';
 *      import 'package:path_provider/path_provider.dart';
 * 
 *      Future<Dio> setupDio() async {
 *        final dir = await getTemporaryDirectory();
 *        final store = HiveCacheStore(dir.path);
 *        
 *        final options = CacheOptions(
 *          store: store,
 *          policy: CachePolicy.forceCache,
 *          hitCacheOnErrorExcept: [401, 403],
 *          maxStale: const Duration(days: 7),
 *        );
 *        
 *        final dio = Dio();
 *        dio.options.baseUrl = 'https://your-api-domain.com/api';
 *        dio.interceptors.add(DioCacheInterceptor(options: options));
 *        
 *        return dio;
 *      }
 */

/**
 * 보안 고려사항
 * 
 * 모바일 앱에서 API 호출 시 다음 보안 사항을 고려하세요:
 * 
 * 1. HTTPS 사용: 모든 API 통신은 HTTPS로 이루어져야 합니다.
 * 
 * 2. 인증 토큰: 필요한 경우 JWT와 같은 인증 토큰을 사용하세요.
 *    
 *    // React Native 예시
 *    api.interceptors.request.use(
 *      async config => {
 *        const token = await AsyncStorage.getItem('authToken');
 *        if (token) {
 *          config.headers.Authorization = `Bearer ${token}`;
 *        }
 *        return config;
 *      },
 *      error => {
 *        return Promise.reject(error);
 *      }
 *    );
 * 
 *    // Flutter 예시
 *    dio.interceptors.add(InterceptorsWrapper(
 *      onRequest: (options, handler) async {
 *        final token = await getToken(); // 토큰 가져오는 함수
 *        if (token != null) {
 *          options.headers['Authorization'] = 'Bearer $token';
 *        }
 *        return handler.next(options);
 *      }
 *    ));
 * 
 * 3. 민감한 데이터: 기기에 민감한 데이터를 저장할 때는 암호화를 사용하세요.
 *    - React Native: react-native-keychain
 *    - Flutter: flutter_secure_storage
 */

/**
 * 에러 처리 가이드라인
 * 
 * 모바일 앱에서 API 호출 시 다음과 같은 에러 처리 패턴을 사용하세요:
 * 
 * React Native 예시:
 * 
 * const fetchData = async () => {
 *   try {
 *     // 로딩 상태 설정
 *     setLoading(true);
 *     
 *     // API 호출
 *     const response = await api.get('/endpoint');
 *     
 *     // 데이터 처리
 *     setData(response.data);
 *     
 *     // 로딩 상태 해제
 *     setLoading(false);
 *   } catch (error) {
 *     // 오류 처리
 *     setLoading(false);
 *     
 *     // 네트워크 오류
 *     if (!error.response) {
 *       setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
 *       return;
 *     }
 *     
 *     // HTTP 상태 코드 기반 오류
 *     switch (error.response.status) {
 *       case 401:
 *         setError('인증이 필요합니다.');
 *         // 로그인 화면으로 리디렉션
 *         break;
 *       case 404:
 *         setError('요청한 리소스를 찾을 수 없습니다.');
 *         break;
 *       case 500:
 *         setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
 *         break;
 *       default:
 *         setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
 *     }
 *   }
 * };
 * 
 * Flutter 예시:
 * 
 * Future<void> fetchData() async {
 *   try {
 *     // 로딩 상태 설정
 *     setState(() {
 *       isLoading = true;
 *       error = null;
 *     });
 *     
 *     // API 호출
 *     final response = await dio.get('/endpoint');
 *     
 *     // 데이터 처리
 *     setState(() {
 *       data = response.data;
 *       isLoading = false;
 *     });
 *   } catch (e) {
 *     setState(() {
 *       isLoading = false;
 *       
 *       // 오류 처리
 *       if (e is DioError) {
 *         if (e.type == DioErrorType.connectTimeout ||
 *             e.type == DioErrorType.receiveTimeout ||
 *             e.type == DioErrorType.other) {
 *           error = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
 *         } else if (e.response != null) {
 *           // HTTP 상태 코드 기반 오류
 *           switch (e.response!.statusCode) {
 *             case 401:
 *               error = '인증이 필요합니다.';
 *               // 로그인 화면으로 리디렉션
 *               break;
 *             case 404:
 *               error = '요청한 리소스를 찾을 수 없습니다.';
 *               break;
 *             case 500:
 *               error = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
 *               break;
 *             default:
 *               error = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
 *           }
 *         } else {
 *           error = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
 *         }
 *       } else {
 *         error = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
 *       }
 *     });
 *   }
 * }
 */

// 모듈로 내보내기 (모듈 형태로 사용할 경우)
export default {
  version: '1.0.0',
  apiBaseUrl: 'https://your-api-domain.com/api',
  endpoints: {
    clusters: '/clusters',
    clusterDetail: '/clusters/:id',
    latestClusters: '/clusters/latest',
    biasStatistics: '/statistics/bias',
    mediaStatistics: '/statistics/media',
    categoryStatistics: '/statistics/category'
  }
};