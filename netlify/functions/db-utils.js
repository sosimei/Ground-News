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

// 이미지 URL 추가 헬퍼 함수
const addImageUrls = (clusters, isSingleCluster = false) => {
  const processCluster = (cluster) => {
    // 클러스터 대표 이미지
    if (cluster.image_file_id) {
      cluster.thumbnail_url = `/api/images/${cluster.image_file_id}`;
    }
    
    // 각 정치적 관점별 대표 이미지 추가
    ['left', 'center', 'right'].forEach(perspective => {
      if (cluster[perspective]) {
        // 관점별 대표 이미지가 있다면 URL 추가
        if (cluster[perspective].image_file_id) {
          cluster[perspective].thumbnail_url = `/api/images/${cluster[perspective].image_file_id}`;
        }
        
        // 관점별 기사 이미지 URL 추가
        const articleIds = cluster[perspective][`${perspective}_article_ids`] || [];
        if (articleIds.length > 0) {
          cluster[perspective].article_thumbnails = articleIds.map(id => ({
            article_id: id,
            thumbnail_url: `/api/images/article/${id}`
          }));
        }
      }
    });
    
    // 디버그용 로그 추가
    if (isSingleCluster) {
      console.log('addImageUrls 단일 클러스터 처리:', 
        cluster.thumbnail_url ? '메인 이미지 있음' : '메인 이미지 없음',
        cluster.left?.thumbnail_url ? '좌 이미지 있음' : '좌 이미지 없음',
        cluster.center?.thumbnail_url ? '중 이미지 있음' : '중 이미지 없음',
        cluster.right?.thumbnail_url ? '우 이미지 있음' : '우 이미지 없음'
      );
    }
    
    return cluster;
  };
  
  // 단일 클러스터인 경우
  if (isSingleCluster) {
    return processCluster(clusters);
  }
  
  // 클러스터 배열인 경우
  return clusters.map(processCluster);
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
  return {
    isSuccess: true,
    code: "COMMON200",
    message: "성공!",
    result: {
      clusters,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(pagination.total / pagination.limit)
      }
    }
  };
};

// API 응답 형식화 함수 (상세) - DetailResponse 형식에 맞게 수정
const formatDetailResponse = (cluster) => {
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
  addImageUrls,
  respond,
  ObjectId,
  getPaginationData,
  formatListResponse,
  formatDetailResponse,
  formatErrorResponse
};