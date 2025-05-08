const { connectToDB, addImageUrls, respond } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    const collection = await connectToDB();
    
    // 기본값 설정
    const limit = parseInt(event.queryStringParameters?.limit) || 5; // 기본값을 5로 변경
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const skip = (page - 1) * limit;

    // 디버그 로깅
    console.log(`Fetching latest clusters with limit=${limit}, page=${page}`);
    
    const clusters = await collection
      .find({})
      .sort({ 
        'pub_date': -1,         // 최신순
        'bias_ratio.total': -1  // 같은 날짜면 편향도가 높은 순
      })
      .skip(skip)
      .limit(limit)
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
    console.error('clusters-latest.js Error:', error);
    return respond(500, { error: 'Internal Server Error', message: error.message });
  }
};
