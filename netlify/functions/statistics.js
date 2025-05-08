const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let client;
let collection;

async function connectToDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('news_bias');
    collection = db.collection('clusters');
  }
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async function(event, context) {
  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('Statistics API 호출됨:', event.httpMethod, event.path, event.queryStringParameters);
    await connectToDB();

    // 기본 통계
    const total = await collection.countDocuments();

    // 바이어스 통계
    const biasStats = await collection.aggregate([
      {
        $group: {
          _id: null,
          left: { $avg: "$bias_ratio.left" },
          center: { $avg: "$bias_ratio.center" },
          right: { $avg: "$bias_ratio.right" }
        }
      }
    ]).toArray();

    // 언론사별 통계
    const mediaStats = await collection.aggregate([
      {
        $unwind: "$media_counts"
      },
      {
        $group: {
          _id: "$media_counts.media",
          count: { $sum: "$media_counts.count" }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    // 카테고리별 통계
    const categoryStats = await collection.aggregate([
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

    // 결과 생성 및 반환
    const result = {
      total,
      biasStats: biasStats[0] || { left: 0, center: 0, right: 0 },
      mediaStats: mediaStats.reduce((acc, curr) => {
        acc[curr._id || '미분류'] = curr.count;
        return acc;
      }, {}),
      categoryStats: categoryStats.reduce((acc, curr) => {
        acc[curr._id || '미분류'] = curr.count;
        return acc;
      }, {}),
      filtered: {
        total,
        biasStats: biasStats[0] || { left: 0, center: 0, right: 0 }
      }
    };

    console.log('Statistics API 응답 생성:', Object.keys(result));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        isSuccess: true,
        code: "COMMON200",
        message: "성공!",
        result
      })
    };
  } catch (error) {
    console.error('statistics.js Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        isSuccess: false,
        code: "ERROR500",
        message: "서버 내부 오류: " + error.message,
        result: null
      })
    };
  }
};