const { connectToDB, addImageUrls, respond, ObjectId, formatDetailResponse, formatErrorResponse } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    // CORS 프리플라이트 요청 처리
    if (event.httpMethod === 'OPTIONS') {
      return respond(200, {});
    }

    console.log('clusters-hot-id.js 호출됨:', event.path, event.httpMethod);

    // 경로에서 ID 파라미터 추출
    const pathParts = event.path.split('/');
    const id = pathParts[pathParts.length - 1];

    // 쿼리 파라미터로도 ID를 받을 수 있도록 함
    const queryId = event.queryStringParameters?.id;
    
    // 경로 파라미터 또는 쿼리 파라미터 중 하나로 ID를 설정
    const clusterId = id || queryId;

    console.log('추출된 클러스터 ID:', clusterId);

    if (!clusterId) {
      return respond(400, formatErrorResponse('ID parameter is required', 'ERROR400'));
    }

    // 유효한 ObjectId 형식인지 확인
    if (!clusterId.match(/^[0-9a-fA-F]{24}$/)) {
      return respond(400, formatErrorResponse('Invalid ID format', 'ERROR400'));
    }

    // 데이터베이스 연결
    const collection = await connectToDB();

    // 세부 핫 뉴스 조회
    const cluster = await collection.findOne({ _id: new ObjectId(clusterId) });
    
    if (!cluster) {
      return respond(404, formatErrorResponse('News not found', 'ERROR404'));
    }

    console.log('클러스터 기본 정보:');
    console.log('- 제목:', cluster.title);
    console.log('- 이미지 ID 존재 여부:', cluster.image_file_id ? '있음' : '없음');
    
    // 정치적 관점별 기사 ID 로깅
    console.log('- 좌파 기사 수:', (cluster.left?.left_article_ids || []).length);
    console.log('- 중도 기사 수:', (cluster.center?.center_article_ids || []).length);
    console.log('- 우파 기사 수:', (cluster.right?.right_article_ids || []).length);

    // 이미지 URL 추가
    console.log('이미지 URL 추가 시작...');
    const processedCluster = await addImageUrls(cluster, true);

    // 로깅 추가
    console.log('이미지 URL 추가 후:');
    console.log('- 메인 이미지:', processedCluster.thumbnail_url || '없음');
    console.log('- 좌파 이미지:', processedCluster.left?.thumbnail_url || '없음');
    console.log('- 중도 이미지:', processedCluster.center?.thumbnail_url || '없음');
    console.log('- 우파 이미지:', processedCluster.right?.thumbnail_url || '없음');

    // 응답
    const response = formatDetailResponse(processedCluster);
    return respond(200, response);
  } catch (error) {
    console.error('clusters-hot-id.js Error:', error);
    return respond(500, formatErrorResponse('Internal Server Error', 'ERROR500'));
  }
};