// netlify/functions/api.js
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let client;
let clustersCollection;

/**
 * MongoDB 연결 및 컬렉션 가져오기
 */
async function connectToDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('news_bias');
    clustersCollection = db.collection('clusters');
  }
  return clustersCollection;
}

/**
 * 이미지 URL 추가 헬퍼 함수
 */
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

/**
 * 응답 헬퍼 함수
 */
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

// API 요청 라우터
exports.handler = async function(event, context) {
  try {
    // 요청 경로와 메서드 확인
    const path = event.path || '';
    const method = event.httpMethod;
    
    // CORS 프리플라이트 요청 처리
    if (method === 'OPTIONS') {
      return respond(200, {});
    }

    // 경로 패턴 매칭
    const pathSegments = path
      .split('/')
      .filter(segment => segment !== '' && segment !== '.netlify' && segment !== 'functions' && segment !== 'api');
    
    // 쿼리 파라미터 파싱
    const queryParams = event.queryStringParameters || {};
    
    // 데이터베이스 연결
    const collection = await connectToDB();
    
    // 라우팅 처리
    const limit = parseInt(queryParams.limit) || 10;
    const page = parseInt(queryParams.page) || 1;
    const skip = (page - 1) * limit;
    const paginationData = { page, limit };

    // 경로에 따른 요청 처리
    if (pathSegments.length === 0) {
      // 기본 API 정보
      return respond(200, { 
        message: "Ground News API", 
        version: "1.0.0" 
      });
    }

    // clusters 엔드포인트
    if (pathSegments[0] === 'clusters') {
      // 1. 모든 뉴스 목록 가져오기: /api/clusters
      if (pathSegments.length === 1) {
        const sort = {};
        if (queryParams.sort === 'latest') {
          sort.pub_date = -1;
        } else if (queryParams.sort === 'bias') {
          sort['bias_ratio.total'] = -1;
        } else {
          // 기본 정렬: 최신순
          sort.pub_date = -1;
        }

        const clusters = await collection
          .find({})
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray();

        const total = await collection.countDocuments({});
        const processedClusters = addImageUrls(clusters);

        return respond(200, {
          clusters: processedClusters,
          pagination: {
            ...paginationData,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }

      // 2. 특정 ID의 뉴스 가져오기: /api/clusters/{id}
      if (pathSegments.length === 2) {
        const id = pathSegments[1];
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          const cluster = await collection.findOne({ _id: new ObjectId(id) });
          
          if (!cluster) {
            return respond(404, { error: 'News not found' });
          }

          const processedCluster = addImageUrls(cluster, true);
          return respond(200, processedCluster);
        } else {
          return respond(400, { error: 'Invalid ID format' });
        }
      }

      // 3. 카테고리별 뉴스 목록 가져오기: /api/clusters/category/{category}
      if (pathSegments.length === 3 && pathSegments[1] === 'category') {
        const category = pathSegments[2];
        const sort = {};
        if (queryParams.sort === 'latest') {
          sort.pub_date = -1;
        } else if (queryParams.sort === 'bias') {
          sort['bias_ratio.total'] = -1;
        } else {
          // 기본 정렬: 최신순
          sort.pub_date = -1;
        }

        const clusters = await collection
          .find({ category })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray();

        const total = await collection.countDocuments({ category });
        const processedClusters = addImageUrls(clusters);

        return respond(200, {
          clusters: processedClusters,
          pagination: {
            ...paginationData,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
    }

    // hot 엔드포인트
    if (pathSegments[0] === 'hot') {
      // 1. 핫 뉴스 목록 가져오기: /api/hot
      if (pathSegments.length === 1) {
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
            ...paginationData,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }

      // 2. 카테고리별 핫 뉴스 목록 가져오기: /api/hot/category/{category}
      if (pathSegments.length === 3 && pathSegments[1] === 'category') {
        const category = pathSegments[2];
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

        return respond(200, {
          clusters: processedClusters,
          pagination: {
            ...paginationData,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
    }

    // latest 엔드포인트
    if (pathSegments[0] === 'latest') {
      // 1. 최신 뉴스 목록 가져오기: /api/latest
      if (pathSegments.length === 1) {
        const clusters = await collection
          .find({})
          .sort({ pub_date: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        const total = await collection.countDocuments({});
        const processedClusters = addImageUrls(clusters);

        return respond(200, {
          clusters: processedClusters,
          pagination: {
            ...paginationData,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }

      // 2. 카테고리별 최신 뉴스 목록 가져오기: /api/latest/category/{category}
      if (pathSegments.length === 3 && pathSegments[1] === 'category') {
        const category = pathSegments[2];
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
            ...paginationData,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
    }

    // statistics 엔드포인트
    if (pathSegments[0] === 'statistics') {
      // 기본 통계 정보 가져오기: /api/statistics
      if (pathSegments.length === 1) {
        // 총 뉴스 수
        const totalClusters = await collection.countDocuments({});
        
        // 카테고리별 뉴스 수
        const categoryCounts = await collection.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          }
        ]).toArray();
        
        // 편향 분포
        const biasDistribution = await collection.aggregate([
          {
            $group: {
              _id: null,
              leftAvg: { $avg: "$bias_ratio.left" },
              centerAvg: { $avg: "$bias_ratio.center" },
              rightAvg: { $avg: "$bias_ratio.right" },
              totalAvg: { $avg: "$bias_ratio.total" }
            }
          }
        ]).toArray();

        return respond(200, {
          totalClusters,
          categoryCounts,
          biasDistribution: biasDistribution[0] || { leftAvg: 0, centerAvg: 0, rightAvg: 0, totalAvg: 0 }
        });
      }
    }

    // 경로가 매칭되지 않으면 404
    return respond(404, { error: 'Not Found' });
  } catch (error) {
    console.error('API Error:', error);
    return respond(500, { error: 'Internal Server Error', message: error.message });
  }
};
