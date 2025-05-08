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
  try {
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
      }
    ]).toArray();

    // 카테고리별 통계
    const categoryStats = await collection.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // 날짜 필터 적용
    const { dateFrom, dateTo } = event.queryStringParameters || {};
    let dateFilter = {};
    
    if (dateFrom || dateTo) {
      dateFilter.crawl_date = {};
      if (dateFrom) dateFilter.crawl_date.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.crawl_date.$lte = new Date(dateTo);
    }

    // 필터링된 통계
    const filteredTotal = await collection.countDocuments(dateFilter);
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        total,
        biasStats: biasStats[0] || { left: 0, center: 0, right: 0 },
        mediaStats: mediaStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        categoryStats: categoryStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        filtered: {
          total: filteredTotal,
          biasStats: filteredBiasStats[0] || { left: 0, center: 0, right: 0 }
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
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
