const { connectToDB, addImageUrls, respond, getPaginationData, formatListResponse, formatErrorResponse } = require('./db-utils');

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
      return respond(400, formatErrorResponse('Category parameter is required', 'ERROR400'));
    }

    // 데이터베이스 연결
    const collection = await connectToDB();
    
    // 페이지네이션 데이터 가져오기 (기본값 20개씩)
    const { limit, page, skip, paginationData } = getPaginationData(event, 20);

    // 카테고리별 핫 뉴스 조회
    const clusters = await collection
      .aggregate([
        {
          $match: { category }
        },
        {
          $addFields: {
            bias_score: {
              $abs: {
                $subtract: [
                  { $add: [
                    { $multiply: ["$bias_ratio.left", 0] },
                    { $multiply: ["$bias_ratio.center", 0.5] },
                    { $multiply: ["$bias_ratio.right", 1] }
                  ]},
                  0.5
                ]
              }
            }
          }
        },
        {
          $sort: {
            bias_score: -1,
            pub_date: -1
          }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ])
      .toArray();

    const total = await collection.countDocuments({ category });
    const processedClusters = addImageUrls(clusters);

    // 응답 형식화
    const response = formatListResponse(processedClusters, {
      ...paginationData,
      total
    });

    return respond(200, response);
  } catch (error) {
    console.error('clusters-hot-category.js Error:', error);
    return respond(500, formatErrorResponse('Internal Server Error', 'ERROR500'));
  }
};
