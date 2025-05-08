const { connectToDB, addImageUrls, respond, getPaginationData, formatListResponse, formatErrorResponse } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    // CORS 프리플라이트 요청 처리
    if (event.httpMethod === 'OPTIONS') {
      return respond(200, {});
    }

    // 데이터베이스 연결
    const collection = await connectToDB();
    
    // 페이지네이션 데이터 가져오기 (기본값 5개씩)
    const { limit, page, skip, paginationData } = getPaginationData(event, 5);

    // 핫 뉴스 조회 (편향도가 높은 순으로 정렬)
    const clusters = await collection
      .aggregate([
        {
          $addFields: {
            // 편향도 점수 계산: 중도에서 벗어난 정도
            bias_score: {
              $abs: {
                $subtract: [
                  { $add: [
                    { $multiply: ["$bias_ratio.left", 0] },    // left는 0
                    { $multiply: ["$bias_ratio.center", 0.5] }, // center는 0.5
                    { $multiply: ["$bias_ratio.right", 1] }    // right는 1
                  ]},
                  0.5  // 중도(0.5)와의 차이
                ]
              }
            }
          }
        },
        {
          $sort: {
            bias_score: -1,  // 편향도 점수 높은 순
            pub_date: -1     // 같은 편향도면 최신순
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

    const total = await collection.countDocuments({});
    const processedClusters = addImageUrls(clusters);

    // 응답 형식화
    const response = formatListResponse(processedClusters, {
      ...paginationData,
      total
    });

    return respond(200, response);
  } catch (error) {
    console.error('clusters-hot.js Error:', error);
    return respond(500, formatErrorResponse('Internal Server Error', 'ERROR500'));
  }
};
