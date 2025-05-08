const { connectToDB, addImageUrls, respond, ObjectId, formatDetailResponse, formatErrorResponse } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    // CORS 프리플라이트 요청 처리
    if (event.httpMethod === 'OPTIONS') {
      return respond(200, {});
    }

    // 경로 패턴에서 ID 추출
    const path = event.path || '';
    const pathSegments = path
      .split('/')
      .filter(segment => segment !== '' && segment !== '.netlify' && segment !== 'functions');

    // ID 파라미터 확인
    const id = pathSegments[pathSegments.length - 1];
    if (!id) {
      return respond(400, formatErrorResponse('ID parameter is required', 'ERROR400'));
    }

    // 유효한 ObjectId 형식인지 확인
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return respond(400, formatErrorResponse('Invalid ID format', 'ERROR400'));
    }

    // 데이터베이스 연결
    const collection = await connectToDB();

    // 세부 핫 뉴스 조회
    const cluster = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!cluster) {
      return respond(404, formatErrorResponse('News not found', 'ERROR404'));
    }

    // 이미지 URL 추가
    const processedCluster = addImageUrls(cluster, true);

    // 응답
    const response = formatDetailResponse(processedCluster);
    return respond(200, response);
  } catch (error) {
    console.error('clusters-hot-id.js Error:', error);
    return respond(500, formatErrorResponse('Internal Server Error', 'ERROR500'));
  }
};
