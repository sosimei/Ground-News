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

exports.handler = async function(event, context) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    await connectToDB();

    // 날짜 필터 적용
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
          right: { $avg: "$bias_ratio.right" },
          maxLeft: { $max: "$bias_ratio.left" },
          maxCenter: { $max: "$bias_ratio.center" },
          maxRight: { $max: "$bias_ratio.right" },
          minLeft: { $min: "$bias_ratio.left" },
          minCenter: { $min: "$bias_ratio.center" },
          minRight: { $min: "$bias_ratio.right" }
        }
      }
    ]).toArray();

    // 필터링된 바이어스 통계
    const filteredBiasStats = await collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          left: { $avg: "$bias_ratio.left" },
          center: { $avg: "$bias_ratio.center" },
          right: { $avg: "$bias_ratio.right" },
          maxLeft: { $max: "$bias_ratio.left" },
          maxCenter: { $max: "$bias_ratio.center" },
          maxRight: { $max: "$bias_ratio.right" },
          minLeft: { $min: "$bias_ratio.left" },
          minCenter: { $min: "$bias_ratio.center" },
          minRight: { $min: "$bias_ratio.right" }
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
          count: { $sum: "$media_counts.count" },
          leftBias: { $avg: "$bias_ratio.left" },
          centerBias: { $avg: "$bias_ratio.center" },
          rightBias: { $avg: "$bias_ratio.right" }
        }
      }
    ]).toArray();

    // 필터링된 언론사별 통계
    const filteredMediaStats = await collection.aggregate([
      { $match: dateFilter },
      {
        $unwind: "$media_counts"
      },
      {
        $group: {
          _id: "$media_counts.media",
          count: { $sum: "$media_counts.count" },
          leftBias: { $avg: "$bias_ratio.left" },
          centerBias: { $avg: "$bias_ratio.center" },
          rightBias: { $avg: "$bias_ratio.right" }
        }
      }
    ]).toArray();

    // 카테고리별 통계
    const categoryStats = await collection.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          leftBias: { $avg: "$bias_ratio.left" },
          centerBias: { $avg: "$bias_ratio.center" },
          rightBias: { $avg: "$bias_ratio.right" }
        }
      }
    ]).toArray();

    // 필터링된 카테고리별 통계
    const filteredCategoryStats = await collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          leftBias: { $avg: "$bias_ratio.left" },
          centerBias: { $avg: "$bias_ratio.center" },
          rightBias: { $avg: "$bias_ratio.right" }
        }
      }
    ]).toArray();

    // 일별 통계
    const dailyStats = await collection.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$crawl_date" } },
          count: { $sum: 1 },
          leftBias: { $avg: "$bias_ratio.left" },
          centerBias: { $avg: "$bias_ratio.center" },
          rightBias: { $avg: "$bias_ratio.right" }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // 필터링된 일별 통계
    const filteredDailyStats = await collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$crawl_date" } },
          count: { $sum: 1 },
          leftBias: { $avg: "$bias_ratio.left" },
          centerBias: { $avg: "$bias_ratio.center" },
          rightBias: { $avg: "$bias_ratio.right" }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total,
        biasStats: biasStats[0] || { 
          left: 0, center: 0, right: 0,
          maxLeft: 0, maxCenter: 0, maxRight: 0,
          minLeft: 0, minCenter: 0, minRight: 0
        },
        mediaStats: mediaStats.reduce((acc, curr) => {
          acc[curr._id] = {
            count: curr.count,
            bias: {
              left: curr.leftBias,
              center: curr.centerBias,
              right: curr.rightBias
            }
          };
          return acc;
        }, {}),
        categoryStats: categoryStats.reduce((acc, curr) => {
          acc[curr._id] = {
            count: curr.count,
            bias: {
              left: curr.leftBias,
              center: curr.centerBias,
              right: curr.rightBias
            }
          };
          return acc;
        }, {}),
        dailyStats: dailyStats.reduce((acc, curr) => {
          acc[curr._id] = {
            count: curr.count,
            bias: {
              left: curr.leftBias,
              center: curr.centerBias,
              right: curr.rightBias
            }
          };
          return acc;
        }, {}),
        filtered: {
          total: filteredTotal,
          biasStats: filteredBiasStats[0] || { 
            left: 0, center: 0, right: 0,
            maxLeft: 0, maxCenter: 0, maxRight: 0,
            minLeft: 0, minCenter: 0, minRight: 0
          },
          mediaStats: filteredMediaStats.reduce((acc, curr) => {
            acc[curr._id] = {
              count: curr.count,
              bias: {
                left: curr.leftBias,
                center: curr.centerBias,
                right: curr.rightBias
              }
            };
            return acc;
          }, {}),
          categoryStats: filteredCategoryStats.reduce((acc, curr) => {
            acc[curr._id] = {
              count: curr.count,
              bias: {
                left: curr.leftBias,
                center: curr.centerBias,
                right: curr.rightBias
              }
            };
            return acc;
          }, {}),
          dailyStats: filteredDailyStats.reduce((acc, curr) => {
            acc[curr._id] = {
              count: curr.count,
              bias: {
                left: curr.leftBias,
                center: curr.centerBias,
                right: curr.rightBias
              }
            };
            return acc;
          }, {})
        }
      })
    };
  } catch (error) {
    console.error('statistics.js Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
