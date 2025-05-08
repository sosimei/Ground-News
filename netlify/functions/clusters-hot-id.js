const { connectToDB, addImageUrls, respond, ObjectId } = require('./db-utils');

exports.handler = async function(event, context) {
  try {
    const collection = await connectToDB();
    
    // 경로에서 ID 추출
    const path = event.path || '';
    const pathParts = path.split('/');
    const id = pathParts[pathParts.length - 1];
    
    // 디버그 로깅
    console.log(`Fetching hot cluster detail for ID: ${id}`);
    
    // ID가 ObjectId 형식인지 확인
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return respond(400, { error: '유효하지 않은 ID 형식입니다.' });
    }
    
    try {
      // 디버그 로깅 추가
      console.log(`Looking for cluster with _id: ${id}`);
      
      const cluster = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!cluster) {
        console.log(`No cluster found with ID: ${id}`);
        return respond(404, { error: '뉴스를 찾을 수 없습니다.' });
      }

      console.log(`Found cluster: ${cluster._id}`);
      const processedCluster = addImageUrls(cluster, true);
      return respond(200, processedCluster);
    } catch (error) {
      console.error('Error fetching hot cluster detail:', error);
      return respond(500, { error: '서버 오류가 발생했습니다.', message: error.message });
    }
  } catch (error) {
    console.error('clusters-hot-id.js Error:', error);
    return respond(500, { error: 'Internal Server Error', message: error.message });
  }
};
