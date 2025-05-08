const { connectToDB, addImageUrls, respond } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    const collection = await connectToDB();
    
    // 쿼리 파라미터 파싱
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 20;
    const page = parseInt(queryParams.page) || 1;
    const skip = (page - 1) * limit;

    // 경로에서 카테고리 추출
    const path = event.path || '';
    const pathParts = path.split('/');
    let category = pathParts[pathParts.length - 1];
    
    // URL 디코딩
    category = decodeURIComponent(category);
    
    // 디버그 로깅
    console.log(`Fetching latest clusters for category '${category}' with limit=${limit}, page=${page}`);
    
    const clusters = await collection
      .find({ category })
      .sort({ pub_date: -1 }) // 최신순으로 정렬
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments({ category });
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
    console.error('clusters-latest-category.js Error:', error);
    return respond(500, { error: 'Internal Server Error', message: error.message });
  }
};
