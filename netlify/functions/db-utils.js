const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let client;
let clustersCollection;

// MongoDB 연결 및 컬렉션 가져오기
async function connectToDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('news_bias');
    clustersCollection = db.collection('clusters');
  }
  return clustersCollection;
}

// 뉴스 원본 컬렉션 가져오기
async function getNewsRawCollection() {
  if (!client) {
    await connectToDB();
  }
  return client.db('news_bias').collection('news_raw');
}

// 이미지 URL 추가 헬퍼 함수
const addImageUrls = async (clusters, isSingleCluster = false) => {
  // 기사 ID에서 이미지 ID를 가져오는 함수
  const getImageIdFromArticle = async (articleId) => {
    try {
      if (!articleId) return null;
      
      const newsRaw = await getNewsRawCollection();
      const article = await newsRaw.findOne(
        { _id: articleId.length === 24 ? new ObjectId(articleId) : articleId },
        { projection: { image_file_id: 1 } }
      );
      
      if (article && article.image_file_id) {
        return article.image_file_id;
      }
    } catch (err) {
      console.error('기사 이미지 ID 조회 실패:', articleId, err);
    }
    return null;
  };
  
  // 클러스터 객체 처리 함수
  const processCluster = async (cluster) => {
    console.log(`클러스터 ${cluster._id || 'unknown'} 이미지 처리 시작`);
    
    // 클러스터 대표 이미지가 없을 경우, 기사에서 하나 가져옴
    if (!cluster.image_file_id) {
      let foundImageId = null;
      
      // 첫 번째 가능한 기사에서 이미지 찾기
      const perspectives = ['left', 'center', 'right'];
      for (const perspective of perspectives) {
        if (cluster[perspective]) {
          const articleIds = cluster[perspective][`${perspective}_article_ids`] || [];
          if (articleIds.length > 0) {
            // 첫 번째 기사에서 이미지 ID 가져오기 시도
            foundImageId = await getImageIdFromArticle(articleIds[0]);
            if (foundImageId) {
              console.log(`클러스터 ${cluster._id}의 대표 이미지를 ${perspective} 기사에서 찾음:`, foundImageId);
              cluster.image_file_id = foundImageId;
              break;
            }
          }
        }
      }
    }
    
    // 대표 이미지 URL 설정
    if (cluster.image_file_id) {
      cluster.thumbnail_url = `/api/images/${cluster.image_file_id}`;
      console.log(`클러스터 ${cluster._id}에 대표 이미지 URL 설정됨:`, cluster.thumbnail_url);
    } else {
      console.log(`클러스터 ${cluster._id}에 대표 이미지 없음`);
    }
    
    // 각 정치적 관점별 대표 이미지 추가
    for (const perspective of ['left', 'center', 'right']) {
      if (cluster[perspective]) {
        // 관점별 대표 이미지가 없을 경우, 첫 번째 기사 이미지 사용
        if (!cluster[perspective].image_file_id) {
          const articleIds = cluster[perspective][`${perspective}_article_ids`] || [];
          if (articleIds.length > 0) {
            const perspectiveImageId = await getImageIdFromArticle(articleIds[0]);
            if (perspectiveImageId) {
              cluster[perspective].image_file_id = perspectiveImageId;
              console.log(`${perspective} 관점 이미지 ID 설정됨:`, perspectiveImageId);
            }
          }
        }
        
        // 관점별 대표 이미지 URL 설정
        if (cluster[perspective].image_file_id) {
          cluster[perspective].thumbnail_url = `/api/images/${cluster[perspective].image_file_id}`;
          console.log(`${perspective} 관점 이미지 URL 설정됨:`, cluster[perspective].thumbnail_url);
        } else if (cluster.image_file_id) {
          // 관점별 이미지가 없으면 클러스터 대표 이미지 사용
          cluster[perspective].thumbnail_url = cluster.thumbnail_url;
          console.log(`${perspective} 관점 이미지 없음, 클러스터 대표 이미지 사용`);
        }
        
        // 관점별 기사 이미지 URL 추가
        const articleIds = cluster[perspective][`${perspective}_article_ids`] || [];
        if (articleIds.length > 0) {
          cluster[perspective].article_thumbnails = articleIds.map(id => ({
            article_id: id,
            thumbnail_url: `/api/images/article/${id}`
          }));
          console.log(`${perspective} 관점 기사 썸네일 ${articleIds.length}개 추가됨`);
        }
      }
    }
    
    // 디버그용 로그 추가
    if (isSingleCluster) {
      console.log('클러스터 이미지 처리 완료:', 
        cluster.thumbnail_url ? '메인 이미지 있음' : '메인 이미지 없음',
        cluster.left?.thumbnail_url ? '좌 이미지 있음' : '좌 이미지 없음',
        cluster.center?.thumbnail_url ? '중 이미지 있음' : '중 이미지 없음',
        cluster.right?.thumbnail_url ? '우 이미지 있음' : '우 이미지 없음'
      );
    }
    
    return cluster;
  };
  
  try {
    // 단일 클러스터인 경우
    if (isSingleCluster) {
      return await processCluster(clusters);
    }
    
    // 클러스터 배열인 경우
    const processedClusters = [];
    for (const cluster of clusters) {
      const processed = await processCluster(cluster);
      processedClusters.push(processed);
    }
    return processedClusters;
  } catch (error) {
    console.error('이미지 URL 추가 중 오류:', error);
    // 오류가 발생해도 원래 클러스터 반환
    return isSingleCluster ? clusters : (Array.isArray(clusters) ? clusters : []);
  }
};

// 응답 헬퍼 함수
const respond = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  },
  body: JSON.stringify(body)
});

// 공통 페이지네이션 함수
const getPaginationData = (event, defaultLimit = 10) => {
  const limit = parseInt(event.queryStringParameters?.limit) || defaultLimit;
  const page = parseInt(event.queryStringParameters?.page) || 1;
  const skip = (page - 1) * limit;
  
  return {
    limit,
    page,
    skip,
    paginationData: { page, limit }
  };
};

// API 응답 형식화 함수 (목록)
const formatListResponse = (clusters, pagination) => {
  // 클러스터가 배열인지 확인
  if (!Array.isArray(clusters)) {
    console.error('formatListResponse: clusters가 배열이 아님:', typeof clusters);
    clusters = [];
  }
  
  // pagination 객체가 유효한지 확인
  if (!pagination || typeof pagination !== 'object') {
    console.error('formatListResponse: pagination이 유효하지 않음:', pagination);
    pagination = { page: 1, limit: 10, total: 0 };
  }
  
  // 누락된 페이지네이션 필드 채우기
  const { page = 1, limit = 10, total = 0 } = pagination;
  const pages = Math.ceil(total / limit) || 1;
  
  // 응답 구조 생성 및 디버깅 로그
  const response = {
    isSuccess: true,
    code: "COMMON200",
    message: "성공!",
    result: {
      clusters,
      pagination: { total, page, limit, pages }
    }
  };
  
  console.log('formatListResponse 결과:', 
              'clusters 수:', clusters.length, 
              'pagination:', response.result.pagination);
  
  return response;
};

// API 응답 형식화 함수 (상세) - DetailResponse 형식에 맞게 수정
const formatDetailResponse = (cluster) => {
  // 클러스터 객체가 유효한지 확인
  if (!cluster || typeof cluster !== 'object') {
    console.error('formatDetailResponse: cluster가 유효하지 않음:', cluster);
    cluster = {};
  }
  
  // 각 정치적 관점별 데이터 처리
  const processedResult = {
    title: cluster.title || "",
    pub_date: cluster.pub_date || "",
    article_ids: [],
    article_urls: [],
    bias_ratio: cluster.bias_ratio || { left: 0, center: 0, right: 0 },
    left: {
      summary: cluster.left?.summary || "",
      keywords: cluster.left?.keywords || [],
      press_list: cluster.left?.press_list || [],
      article_ids: cluster.left?.left_article_ids || [],
      article_urls: cluster.left?.left_article_urls || []
    },
    center: {
      summary: cluster.center?.summary || "",
      keywords: cluster.center?.keywords || [],
      press_list: cluster.center?.press_list || [],
      article_ids: cluster.center?.center_article_ids || [],
      article_urls: cluster.center?.center_article_urls || []
    },
    right: {
      summary: cluster.right?.summary || "",
      keywords: cluster.right?.keywords || [],
      press_list: cluster.right?.press_list || [],
      article_ids: cluster.right?.right_article_ids || [],
      article_urls: cluster.right?.right_article_urls || []
    },
    media_counts: cluster.media_counts || {},
    created_at: cluster.created_at || new Date().toISOString(),
    updated_at: cluster.updated_at || new Date().toISOString(),
    model_ver: cluster.model_ver || ""
  };

  // 썸네일 URL 추가
  if (cluster.thumbnail_url) {
    processedResult.thumbnail_url = cluster.thumbnail_url;
  }
  
  // 각 관점별 썸네일 URL 복사
  if (cluster.left?.thumbnail_url) {
    processedResult.left.thumbnail_url = cluster.left.thumbnail_url;
  }
  if (cluster.center?.thumbnail_url) {
    processedResult.center.thumbnail_url = cluster.center.thumbnail_url;
  }
  if (cluster.right?.thumbnail_url) {
    processedResult.right.thumbnail_url = cluster.right.thumbnail_url;
  }
  
  // 기사 썸네일 정보 복사
  if (cluster.left?.article_thumbnails) {
    processedResult.left.article_thumbnails = cluster.left.article_thumbnails;
  }
  if (cluster.center?.article_thumbnails) {
    processedResult.center.article_thumbnails = cluster.center.article_thumbnails;
  }
  if (cluster.right?.article_thumbnails) {
    processedResult.right.article_thumbnails = cluster.right.article_thumbnails;
  }

  // 모든 기사 ID 통합
  processedResult.article_ids = [
    ...(processedResult.left.article_ids || []),
    ...(processedResult.center.article_ids || []),
    ...(processedResult.right.article_ids || [])
  ];

  // 모든 기사 URL 통합
  processedResult.article_urls = [
    ...(processedResult.left.article_urls || []),
    ...(processedResult.center.article_urls || []),
    ...(processedResult.right.article_urls || [])
  ];

  console.log('formatDetailResponse 결과:', 
              '제목:', processedResult.title,
              '썸네일 유무:', processedResult.thumbnail_url ? '있음' : '없음');
              
  return {
    isSuccess: true,
    code: 200,
    message: "성공",
    result: processedResult
  };
};

// 오류 응답 형식화 함수
const formatErrorResponse = (errorMessage, errorCode = "ERROR400") => {
  return {
    isSuccess: false,
    code: errorCode,
    message: errorMessage,
    result: null
  };
};

module.exports = {
  connectToDB,
  getNewsRawCollection,
  addImageUrls,
  respond,
  ObjectId,
  getPaginationData,
  formatListResponse,
  formatDetailResponse,
  formatErrorResponse
};