// ... existing code ...
  // 기본값 설정
  const limit = parseInt(event.queryStringParameters?.limit) || 5; // 기본값을 5로 변경
  const page = parseInt(event.queryStringParameters?.page) || 1;
  const skip = (page - 1) * limit;

  try {
    const collection = await getCollection('clusters');
    
    // 핫 뉴스 조회 (편향도가 높은 순으로 정렬)
    const clusters = await collection
      .find({})
      .sort({ 
        'bias_ratio.total': -1,  // 편향도가 높은 순
        'pub_date': -1          // 같은 편향도면 최신순
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
// ... existing code ...
