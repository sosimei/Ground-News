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

    const url = event.path;

    // 날짜 목록 조회
    if (url.includes('/api/dates')) {
      const dates = await collection.distinct("crawl_date");
      return {
        statusCode: 200,
        body: JSON.stringify({ dates }),
      };
    }

    // 카테고리 목록 조회 (예: 정치/경제)
    if (url.includes('/api/categories')) {
      const categories = await collection.distinct("category");
      return {
        statusCode: 200,
        body: JSON.stringify({ categories }),
      };
    }

    // 검색 (title 내 키워드)
    if (url.includes('/api/search')) {
      const query = event.queryStringParameters.q || '';
      const clusters = await collection.find({
        title: { $regex: query, $options: 'i' }
      }).limit(20).toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({ clusters }),
      };
    }

    // 인기 키워드 예시
    if (url.includes('/api/trending')) {
      const keywords = await collection.aggregate([
        { $unwind: "$center.keywords" },
        { $group: {
            _id: "$center.keywords.word",
            total: { $sum: 1 }
        }},
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]).toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({ trending: keywords }),
      };
    }

    // fallback
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Not Found" })
    };
  } catch (error) {
    console.error('additional.js Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ erro
