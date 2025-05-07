// netlify/functions/additional.js
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

exports.handler = async function(event) {
  try {
    await connectToDB();

    // netlify.toml에서 from="/api/*" to="/.netlify/functions/additional?path=:splat" 으로
    // 리디렉트해주어야 합니다.
    const route = event.queryStringParameters?.path || '';

    // 1) 날짜 목록 조회
    if (route === 'dates') {
      let dates = await collection.distinct('crawl_date');
      dates = dates.sort((a, b) => b.localeCompare(a)); // 내림차순
      return {
        statusCode: 200,
        body: JSON.stringify({ dates }),
      };
    }

    // 2) 카테고리 목록 조회
    if (route === 'categories') {
      let categories = await collection.distinct('category');
      categories = categories.filter(c => c);  // null/빈 문자열 제거
      return {
        statusCode: 200,
        body: JSON.stringify({ categories }),
      };
    }

    // 3) 검색
    if (route === 'search') {
      const {
        q = '',
        date = '',
        category = '',
        limit = '20',
        skip = '0'
      } = event.queryStringParameters || {};

      const query = {};
      if (q) {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { 'left.summary':  { $regex: q, $options: 'i' } },
          { 'center.summary':{ $regex: q, $options: 'i' } },
          { 'right.summary': { $regex: q, $options: 'i' } }
        ];
      }
      if (date)      query.crawl_date = date;
      if (category)  query.category   = category;

      const lim  = parseInt(limit, 10);
      const off  = parseInt(skip, 10);
      const clusters = await collection
        .find(query)
        .sort({ crawl_date: -1 })
        .skip(off)
        .limit(lim)
        .toArray();

      const totalCount = await collection.countDocuments(query);
      const totalPages = Math.ceil(totalCount / lim);

      return {
        statusCode: 200,
        body: JSON.stringify({
          clusters,
          totalCount,
          totalPages,
          currentPage: Math.floor(off / lim) + 1
        }),
      };
    }

    // 4) 인기 키워드 및 클러스터
    if (route === 'trending') {
      const { date = '', limit = '5' } = event.queryStringParameters || {};
      const lim = parseInt(limit, 10);

      const match = date ? { $match: { crawl_date: date } } : { $match: {} };

      // 인기 키워드 집계 (left.keywords 기준)
      const trendingKeywords = await collection.aggregate([
        match,
        { $unwind: '$left.keywords' },
        { $group: {
            _id: '$left.keywords.word',
            totalScore: { $sum: '$left.keywords.score' }
          }
        },
        { $sort: { totalScore: -1 } },
        { $limit: lim }
      ]).toArray();

      // 최신 클러스터 lim개
      const trendingClusters = await collection
        .find(date ? { crawl_date: date } : {})
        .sort({ crawl_date: -1 })
        .limit(lim)
        .toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({ trendingKeywords, trendingClusters }),
      };
    }

    // 5) 경로가 매칭되지 않으면 404
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not Found' }),
    };
  } catch (error) {
    console.error('additional.js Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
