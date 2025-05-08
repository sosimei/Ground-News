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

// 날짜 범위에 따른 시계열 데이터 생성
async function getTimeSeriesData(dateFilter) {
  const pipeline = [
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: "$crawl_date" },
          month: { $month: "$crawl_date" },
          day: { $dayOfMonth: "$crawl_date" }
        },
        count: { $sum: 1 },
        left: { $avg: "$bias_ratio.left" },
        center: { $avg: "$bias_ratio.center" },
        right: { $avg: "$bias_ratio.right" }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1
      }
    }
  ];

  const timeSeriesData = await collection.aggregate(pipeline).toArray();
  return timeSeriesData.map(item => ({
    date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
    count: item.count,
    bias: {
      left: item.left,
      center: item.center,
      right: item.right
    }
  }));
}

// 언론사별 상세 통계
async function getDetailedMediaStats(dateFilter) {
  const pipeline = [
    { $match: dateFilter },
    {
      $group: {
        _id: "$press_list",
        count: { $sum: 1 },
        avgBias: {
          left: { $avg: "$bias_ratio.left" },
          center: { $avg: "$bias_ratio.center" },
          right: { $avg: "$bias_ratio.right" }
        }
      }
    }
  ];

  const mediaStats = await collection.aggregate(pipeline).toArray();
  return mediaStats.map(stat => ({
    press: stat._id,
    count: stat.count,
    bias: stat.avgBias
  }));
}

// 카테고리별 상세 통계
async function getDetailedCategoryStats(dateFilter) {
  const pipeline = [
    { $match: dateFilter },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        avgBias: {
          left: { $avg: "$bias_ratio.left" },
          center: { $avg: "$bias_ratio.center" },
          right: { $avg: "$bias_ratio.right" }
        }
      }
    }
  ];

  const categoryStats = await collection.aggregate(pipeline).toArray();
  return categoryStats.map(stat => ({
    category: stat._id,
    count: stat.count,
    bias: stat.avgBias
  }));
}

exports.handler = async function(event, context) {
  try {
    await connectToDB();

    // 날짜 필터 설정
    const { dateFrom, dateTo } = event.queryStringParameters || {};
    let dateFilter = {};
    
    if (dateFrom || dateTo) {
      dateFilter.crawl_date = {};
      if (dateFrom) dateFilter.crawl_date.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.crawl_date.$lte = new Date(dateTo);
    }

    // 기본 통계
    const total = await collection.countDocuments();
    const filteredTotal = await collection.countDocuments(dateFilter);

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

    const filteredBiasStats = await collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          left: { $avg: "$bias_ratio.left" },
          center: { $avg: "$bias_ratio.center" },
          right: { $avg: "$bias_ratio.right" }
        }
      }
    ]).toArray();

    // 시계열 데이터
    const timeSeriesData = await getTimeSeriesData(dateFilter);

    // 언론사별 상세 통계
    const mediaStats = await getDetailedMediaStats(dateFilter);

    // 카테고리별 상세 통계
    const categoryStats = await getDetailedCategoryStats(dateFilter);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        isSuccess: true,
        code: "COMMON200",
        message: "성공!",
        result: {
          total,
          biasStats: biasStats[0] || { left: 0, center: 0, right: 0 },
          timeSeriesData,
          mediaStats,
          categoryStats,
          filtered: {
            total: filteredTotal,
            biasStats: filteredBiasStats[0] || { left: 0, center: 0, right: 0 }
          }
        }
      })
    };
  } catch (error) {
    console.error('statistics.js Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        isSuccess: false,
        code: "ERROR500",
        message: "서버 내부 오류",
        result: null
      })
    };
  }
};
