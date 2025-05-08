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

// 명시적으로 Content-Type 헤더를 설정
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff'
};

exports.handler = async function(event, context) {
  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    console.log('Statistics API 호출됨:', event.httpMethod, event.path, event.queryStringParameters);
    
    try {
      await connectToDB();
    } catch (dbError) {
      console.error('DB 연결 오류:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          isSuccess: false,
          code: "ERROR500",
          message: "데이터베이스 연결 오류: " + dbError.message,
          result: null
        })
      };
    }

    // 날짜 필터링 조건 구성
    const query = {};
    if (event.queryStringParameters) {
      const { dateFrom, dateTo, timeframe } = event.queryStringParameters;
      
      if (dateFrom || dateTo) {
        query.created_at = {};
        if (dateFrom) query.created_at.$gte = new Date(dateFrom);
        if (dateTo) query.created_at.$lte = new Date(dateTo);
      } else if (timeframe && timeframe !== 'all') {
        const now = new Date();
        query.created_at = { $gte: new Date() };
        
        switch (timeframe) {
          case 'day':
            query.created_at.$gte = new Date(now.setDate(now.getDate() - 1));
            break;
          case 'week':
            query.created_at.$gte = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            query.created_at.$gte = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            query.created_at.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }
      }
    }

    // 에러 발생 가능성이 있는 각 집계를 try-catch로 분리
    let total = 0;
    let filteredTotal = 0;
    let biasStats = [];
    let filteredBiasStats = [];
    let mediaStats = [];
    let categoryStats = [];

    try {
      // 전체 카운트
      total = await collection.countDocuments();
      
      // 필터링된 카운트
      filteredTotal = await collection.countDocuments(query);
    } catch (countError) {
      console.error('Count 쿼리 오류:', countError);
      // 오류 발생해도 계속 진행
    }

    try {
      // 바이어스 통계
      biasStats = await collection.aggregate([
        {
          $group: {
            _id: null,
            left: { $avg: "$bias_ratio.left" },
            center: { $avg: "$bias_ratio.center" },
            right: { $avg: "$bias_ratio.right" }
          }
        }
      ]).toArray();
    } catch (biasError) {
      console.error('Bias 통계 쿼리 오류:', biasError);
      // 오류 발생해도 계속 진행
    }

    try {
      // 필터링된 바이어스 통계
      filteredBiasStats = await collection.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            left: { $avg: "$bias_ratio.left" },
            center: { $avg: "$bias_ratio.center" },
            right: { $avg: "$bias_ratio.right" }
          }
        }
      ]).toArray();
    } catch (filteredBiasError) {
      console.error('필터링된 Bias 통계 쿼리 오류:', filteredBiasError);
      // 오류 발생해도 계속 진행
    }

    try {
      // 언론사별 통계
      mediaStats = await collection.aggregate([
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
    } catch (mediaError) {
      console.error('Media 통계 쿼리 오류:', mediaError);
      // 오류 발생해도 계속 진행
    }

    try {
      // 카테고리별 통계
      categoryStats = await collection.aggregate([
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
    } catch (categoryError) {
      console.error('Category 통계 쿼리 오류:', categoryError);
      // 오류 발생해도 계속 진행
    }

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
        total: filteredTotal,
        biasStats: filteredBiasStats[0] || { left: 0, center: 0, right: 0 }
      }
    };

    console.log('Statistics API 응답 생성:', Object.keys(result));
    
    // JSON 문자열로 변환하여 빈 객체라도 응답할 수 있도록 함
    const responseBody = JSON.stringify({
      isSuccess: true,
      code: "COMMON200",
      message: "성공!",
      result
    });
    
    return {
      statusCode: 200,
      headers,
      body: responseBody
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