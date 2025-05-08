const { connectToDB, addImageUrls, respond, getPaginationData, formatResponse } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    // CORS 프리플라이트 요청 처리
    if (event.httpMethod === 'OPTIONS') {
      return respond(200, {});
    }

    // 경로 패턴에서 카테고리 추출
    const path = event.path || '';
    const pathSegments = path
      .split('/')
      .filter(segment => segment !== '' && segment !== '.netlify' && segment !== 'functions');

    // 카테고리 파라미터 확인
    const category = pathSegments[pathSegments.length - 1];
    if (!category) {
      return respond(400, { error: 'Category parameter is required' });
    }

    // 데이터베이스 연결
    const collection = await connectToDB();
    
    // 페이지네이션 데이터 가져오기
    const { limit, page, skip, paginationData } = getPaginationData(event);

    // 카테고리별 최신 뉴스 조회
    const clusters = await collection
      .find({ category })
      .sort({ pub_date: -1 })  // 최신순
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments({ category });
    const processedClusters = addImageUrls(clusters);

    // 응답 형식화
    return respond(200, {
      clusters: processedClusters,
      pagination: {
        ...paginationData,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('clusters-latest-category.js Error:', error);
    return respond(500, { error: 'Internal Server Error', message: error.message });
  }
};
