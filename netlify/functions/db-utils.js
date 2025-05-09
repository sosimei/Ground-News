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
              '제목:', processedResult.title);
              
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
  respond,
  ObjectId,
  getPaginationData,
  formatListResponse,
  formatDetailResponse,
  formatErrorResponse
};