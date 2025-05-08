const { connectToDB, addImageUrls, respond } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    const collection = await connectToDB();
    
    // 기본값 설정
    const limit = parseInt(event.queryStringParameters?.limit) || 5;
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const skip = (page - 1) * limit;

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

    return respond(200, {
      clusters: processedClusters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('clusters-hot.js Error:', error);
    return respond(500, { error: 'Internal Server Error', message: error.message });
  }
};
