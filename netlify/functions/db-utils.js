const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let client;
let clustersCollection;

// MongoDB 연결 및 컬렉션 가져오기
async function connectToDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('news_bias');
    clustersCollection = db.collection('clusters');
  }
  return clustersCollection;
}

// 이미지 URL 추가 헬퍼 함수
const addImageUrls = (clusters, isSingleCluster = false) => {
  const processCluster = (cluster) => {
    // 클러스터 대표 이미지
    if (cluster.image_file_id) {
      cluster.thumbnail_url = `/api/images/${cluster.image_file_id}`;
    }
    
    // 각 정치적 관점별 대표 이미지 추가
    ['left', 'center', 'right'].forEach(perspective => {
      if (cluster[perspective]) {
        // 관점별 대표 이미지가 있다면 URL 추가
        if (cluster[perspective].image_file_id) {
          cluster[perspective].thumbnail_url = `/api/images/${cluster[perspective].image_file_id}`;
        }
        
        // 관점별 기사 이미지 URL 추가
        const articleIds = cluster[perspective][`${perspective}_article_ids`] || [];
        if (articleIds.length > 0) {
          cluster[perspective].article_thumbnails = articleIds.map(id => ({
            article_id: id,
            thumbnail_url: `/api/images/article/${id}`
          }));
        }
      }
    });
    
    return cluster;
  };
  
  // 단일 클러스터인 경우
  if (isSingleCluster) {
    return processCluster(clusters);
  }
  
  // 클러스터 배열인 경우
  return clusters.map(processCluster);
};

// 응답 헬퍼 함수
const respond = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  },
  body: JSON.stringify(body)
});

module.exports = {
  connectToDB,
  addImageUrls,
  respond,
  ObjectId
};
