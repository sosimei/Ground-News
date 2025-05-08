// netlify/functions/clusters.js
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let client;
let clustersCollection;

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

exports.handler = async function(event, context) {
  try {
    const collection = await connectToDB();
    
    // 요청 경로와 메서드 확인
    const path = event.path || '';
    const method = event.httpMethod;
    
    // 경로 패턴 매칭
    const pathSegments = path.split('/').filter(segment => segment !== '' && segment !== '.netlify' && segment !== 'functions' && segment !== 'clusters');
    
    // 쿼리 파라미터 파싱
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 10;
    const page = parseInt(queryParams.page) || 1;
    const skip = (page - 1) * limit;
    
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

    // 1. 핫 뉴스 preview 가져오기: /clusters/hot
    if (pathSegments.length === 1 && pathSegments[0] === 'hot') {
      const clusters = await collection
        .find({})
        .sort({ 'bias_ratio.total': -1 }) // 편향도가 높은 순으로 정렬
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
    }

    // 2. 최근 뉴스 preview 가져오기: /clusters/latest
    if (pathSegments.length === 1 && pathSegments[0] === 'latest') {
      const clusters = await collection
        .find({})
        .sort({ pub_date: -1 }) // 최신순으로 정렬
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
    }

    // 3. 카테고리 별 핫 뉴스 preview 가져오기: /clusters/hot/{category}
    if (pathSegments.length === 2 && pathSegments[0] === 'hot' && pathSegments[1] !== 'undefined') {
      // 두 번째 세그먼트가 ObjectId 형식인지 확인
      const isObjectId = pathSegments[1].match(/^[0-9a-fA-F]{24}$/);
      
      // ObjectId가 아니면 카테고리로 간주
      if (!isObjectId) {
        const category = pathSegments[1];
        const clusters = await collection
          .find({ category })
          .sort({ 'bias_ratio.total': -1 })
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
      }
    }

    // 4. 카테고리 별 최근 뉴스 preview 가져오기: /clusters/latest/{category}
    if (pathSegments.length === 2 && pathSegments[0] === 'latest' && pathSegments[1] !== 'undefined') {
      // 두 번째 세그먼트가 ObjectId 형식인지 확인
      const isObjectId = pathSegments[1].match(/^[0-9a-fA-F]{24}$/);
      
      // ObjectId가 아니면 카테고리로 간주
      if (!isObjectId) {
        const category = pathSegments[1];
        const clusters = await collection
          .find({ category })
          .sort({ pub_date: -1 })
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
      }
    }

    // 5. 디테일 핫 뉴스 가져오기: /clusters/hot/{id}
    if (pathSegments.length === 2 && pathSegments[0] === 'hot') {
      // 두 번째 세그먼트가 ObjectId 형식인지 확인
      const isObjectId = pathSegments[1].match(/^[0-9a-fA-F]{24}$/);
      
      // ObjectId이면 ID로 간주
      if (isObjectId) {
        const id = pathSegments[1];
        try {
          const cluster = await collection.findOne({ _id: new ObjectId(id) });
          
          if (!cluster) {
            return respond(404, { error: '뉴스를 찾을 수 없습니다.' });
          }

          const processedCluster = addImageUrls(cluster, true);
          return respond(200, processedCluster);
        } catch (error) {
          console.error('Error fetching hot cluster detail:', error);
          return respond(500, { error: '서버 오류가 발생했습니다.' });
        }
      }
    }

    // 6. 디테일 최근 뉴스 가져오기: /clusters/latest/{id}
    if (pathSegments.length === 2 && pathSegments[0] === 'latest') {
      // 두 번째 세그먼트가 ObjectId 형식인지 확인
      const isObjectId = pathSegments[1].match(/^[0-9a-fA-F]{24}$/);
      
      // ObjectId이면 ID로 간주
      if (isObjectId) {
        const id = pathSegments[1];
        try {
          const cluster = await collection.findOne({ _id: new ObjectId(id) });
          
          if (!cluster) {
            return respond(404, { error: '뉴스를 찾을 수 없습니다.' });
          }

          const processedCluster = addImageUrls(cluster, true);
          return respond(200, processedCluster);
        } catch (error) {
          console.error('Error fetching latest cluster detail:', error);
          return respond(500, { error: '서버 오류가 발생했습니다.' });
        }
      }
    }

    // 경로가 매칭되지 않으면 404
    return respond(404, { error: 'Not Found' });
  } catch (error) {
    console.error('clusters.js Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
