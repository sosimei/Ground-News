const { connectToDB, addImageUrls, respond, getPaginationData, formatListResponse, formatErrorResponse } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    // CORS 프리플라이트 요청 처리
    if (event.httpMethod === 'OPTIONS') {
      return respond(200, {});
    }

    console.log('clusters-hot.js 호출됨:', event.path, event.httpMethod);
    
    // 쿼리 파라미터 처리
    const { limit, page, skip, paginationData } = getPaginationData(event);

    // 데이터베이스 연결
    const collection = await connectToDB();

    // Hot 뉴스 쿼리에 사용할 날짜 범위: 최근 30일
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 메인 뉴스 쿼리 - 최신 순
    const query = { };
    
    // 뉴스 클러스터 총 개수
    let total = 0;
    try {
      total = await collection.countDocuments(query);
      console.log('뉴스 클러스터 총 개수:', total);
    } catch (err) {
      console.error('총 개수 조회 오류:', err);
      total = 0;
    }
    
    // 뉴스 클러스터 조회
    let clusters = [];
    try {
      clusters = await collection.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      console.log('클러스터 조회 성공, 개수:', clusters.length);
    } catch (err) {
      console.error('클러스터 조회 오류:', err);
      clusters = [];
    }
    
    // 첫 번째 클러스터 로깅 (디버깅용)
    if (clusters.length > 0) {
      const first = clusters[0];
      console.log('첫 번째 클러스터 샘플:');
      console.log('- ID:', first._id);
      console.log('- 제목:', first.title);
      console.log('- 객체 키:', Object.keys(first));
    } else {
      console.log('클러스터가 없습니다.');
    }
    
    // 이미지 URL 추가
    console.log('클러스터 데이터에 이미지 추가 전:', clusters.length);
    // 첫 번째 클러스터의 샘플 로깅
    if (clusters.length > 0) {
      const sample = clusters[0];
      console.log('샘플 클러스터 ID:', sample._id);
      console.log('이미지 ID 존재 여부:', sample.image_file_id ? '있음' : '없음');
      
      // 대표 기사 이미지 파악
      const leftArticles = sample.left?.left_article_ids || [];
      const centerArticles = sample.center?.center_article_ids || [];
      const rightArticles = sample.right?.right_article_ids || [];
      console.log('기사 수:', leftArticles.length + centerArticles.length + rightArticles.length);
    }
    
    try {
      // 기사의 이미지를 가져와서 클러스터에 추가
      clusters = await addImageUrls(clusters);
      
      // 첫 번째 클러스터의 이미지 URL 로깅
      if (clusters.length > 0) {
        const sample = clusters[0];
        console.log('이미지 추가 후 - 썸네일 URL 존재 여부:', sample.thumbnail_url ? '있음' : '없음');
        console.log('샘플 썸네일 URL:', sample.thumbnail_url || '없음');
      }
    } catch (imgErr) {
      console.error('이미지 URL 추가 오류:', imgErr);
    }

    // 응답 생성
    paginationData.total = total;
    const response = formatListResponse(clusters, paginationData);
    console.log('응답 생성 완료, 형식:', 
                Object.keys(response), 
                '데이터:', 
                response.result ? Object.keys(response.result) : '없음');
    
    return respond(200, response);
  } catch (error) {
    console.error('clusters-hot.js Error:', error);
    return respond(500, formatErrorResponse('Internal Server Error', 'ERROR500'));
  }
};