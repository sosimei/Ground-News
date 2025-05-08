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
    console.log(`Fetching hot clusters for category '${category}' with limit=${limit}, page=${page}`);
    
    // MongoDB ObjectId 형식인지 확인
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`Warning: '${category}' matches ObjectId pattern, but being treated as a category`);
      return respond(400, { 
        error: '잘못된 요청', 
        message: 'ObjectId 형식의 문자열이 카테고리로 사용되었습니다. ID를 찾으려면 API 경로를 다시 확인하세요.' 
      });
    }
    
    const clusters = await collection
      .find({ category })
      .sort({ 'bias_ratio.total': -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log(`Found ${clusters.length} clusters for category '${category}'`);
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
    console.error('clusters-hot-category.js Error:', error);
    return respond(500, { error: 'Internal Server Error', message: error.message });
  }
};
