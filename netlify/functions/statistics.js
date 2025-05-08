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
    await connectToDB();

    // 기본 통계
    const total = await collection.countDocuments();

    // 쿼리 파라미터 처리
    const { dateFrom, dateTo, timeframe, category, media } = event.queryStringParameters || {};
    let dateFilter = {};
    let additionalFilter = {};
    
    // 날짜 필터 또는 타임프레임 적용
    if (dateFrom || dateTo || timeframe) {
      dateFilter.crawl_date = {};
      
      if (dateFrom) {
        dateFilter.crawl_date.$gte = new Date(dateFrom);
      } else if (timeframe) {
        const now = new Date();
        let fromDate;
        
        switch(timeframe) {
          case 'month':
            fromDate = new Date(now);
            fromDate.setMonth(now.getMonth() - 1);
            break;
          case 'week':
            fromDate = new Date(now);
            fromDate.setDate(now.getDate() - 7);
            break;
          case 'day':
            fromDate = new Date(now);
            fromDate.setDate(now.getDate() - 1);
            break;
          default:
            // 기본값은 필터 없음
            break;
        }
        
        if (fromDate) {
          dateFilter.crawl_date.$gte = fromDate;
        }
      }
      
      if (dateTo) {
        dateFilter.crawl_date.$lte = new Date(dateTo);
      }
    }

    // 추가 필터 적용
    if (category) {
      additionalFilter.category = category;
    }

    // 최종 필터 병합
    const filter = {
      ...dateFilter,
      ...additionalFilter
    };

    // 바이어스 통계
    const biasStats = await collection.aggregate([
      {
        $group: {
          _id: null,
          left: { $avg: "$bias_ratio.left" },
          center: { $avg: "$bias_ratio.center" },
          right: { $avg: "$bias_ratio.right" },
          count: { $sum: 1 }
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
        $sort: { count: -1 } // 내림차순 정렬
      }
    ]).toArray();

    // 언론사별 편향도 통계
    const mediaBiasStats = await collection.aggregate([
      {
        $unwind: "$media_counts"
      },
      {
        $group: {
          _id: "$media_counts.media",
          count: { $sum: "$media_counts.count" },
          left: { $avg: "$bias_ratio.left" },
          center: { $avg: "$bias_ratio.center" },
          right: { $avg: "$bias_ratio.right" }
        }
      },
      {
        $match: {
          count: { $gt: 5 } // 최소 5개 이상의 기사가 있는 언론사만 포함
        }
      },
      {
        $sort: { count: -1 } // 내림차순 정렬
      },
      {
        $limit: 20 // 상위 20개 언론사만 반환
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
        $sort: { count: -1 } // 내림차순 정렬
      }
    ]).toArray();

    // 카테고리별 편향도 통계
    const categoryBiasStats = await collection.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          left: { $avg: "$bias_ratio.left" },
          center: { $avg: "$bias_ratio.center" },
          right: { $avg: "$bias_ratio.right" }
        }
      },
      {
        $match: {
          _id: { $ne: null }, // null 카테고리 제외
          count: { $gt: 5 } // 최소 5개 이상의 기사가 있는 카테고리만 포함
        }
      },
      {
        $sort: { count: -1 } // 내림차순 정렬
      }
    ]).toArray();

    // 월별 트렌드 데이터 (최근 6개월)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrends = await collection.aggregate([
      {
        $match: {
          crawl_date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$crawl_date" },
            month: { $month: "$crawl_date" }
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
          "_id.month": 1
        }
      }
    ]).toArray();

    // 일별 트렌드 데이터 (최근 14일)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const dailyTrends = await collection.aggregate([
      {
        $match: {
          crawl_date: { $gte: twoWeeksAgo }
        }
      },
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
    ]).toArray();

    // 필터링된 통계
    const filteredTotal = Object.keys(filter).length > 0 ? 
      await collection.countDocuments(filter) : 
      total;

    const filteredBiasStats = Object.keys(filter).length > 0 ? 
      await collection.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            left: { $avg: "$bias_ratio.left" },
            center: { $avg: "$bias_ratio.center" },
            right: { $avg: "$bias_ratio.right" },
            count: { $sum: 1 }
          }
        }
      ]).toArray() : 
      biasStats;

    // 키워드 데이터 (정치적 성향별 상위 키워드)
    const keywordsByBias = await collection.aggregate([
      {
        $match: {
          "left.keywords": { $exists: true, $ne: [] },
          "center.keywords": { $exists: true, $ne: [] },
          "right.keywords": { $exists: true, $ne: [] }
        }
      },
      {
        $project: {
          left_keywords: "$left.keywords",
          center_keywords: "$center.keywords",
          right_keywords: "$right.keywords"
        }
      },
      {
        $unwind: "$left_keywords"
      },
      {
        $group: {
          _id: "$left_keywords.word",
          count: { $sum: 1 },
          score: { $avg: "$left_keywords.score" }
        }
      },
      {
        $match: {
          count: { $gt: 2 },
          _id: { $ne: null }
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: 20
      }
    ]).toArray();

    // 월별 트렌드 데이터 포맷팅
    const formattedMonthlyTrends = monthlyTrends.map(month => {
      const date = new Date(month._id.year, month._id.month - 1, 1);
      return {
        date: `${month._id.year}-${String(month._id.month).padStart(2, '0')}`,
        count: month.count,
        bias: {
          left: month.left,
          center: month.center,
          right: month.right
        }
      };
    });

    // 일별 트렌드 데이터 포맷팅
    const formattedDailyTrends = dailyTrends.map(day => {
      const date = new Date(day._id.year, day._id.month - 1, day._id.day);
      return {
        date: date.toISOString().split('T')[0],
        count: day.count,
        bias: {
          left: day.left,
          center: day.center,
          right: day.right
        }
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        isSuccess: true,
        code: "COMMON200",
        message: "성공!",
        result: {
          total,
          biasStats: biasStats[0] || { left: 0, center: 0, right: 0, count: 0 },
          mediaStats: mediaStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          mediaBiasStats: mediaBiasStats.map(item => ({
            name: item._id,
            count: item.count,
            bias: {
              left: item.left,
              center: item.center,
              right: item.right
            }
          })),
          categoryStats: categoryStats.reduce((acc, curr) => {
            if (curr._id) { // null 또는 undefined 카테고리 제외
              acc[curr._id] = curr.count;
            }
            return acc;
          }, {}),
          categoryBiasStats: categoryBiasStats.map(item => ({
            name: item._id,
            count: item.count,
            bias: {
              left: item.left,
              center: item.center,
              right: item.right
            }
          })),
          keywords: {
            left: keywordsByBias.map(item => ({
              word: item._id,
              count: item.count,
              score: item.score
            }))
          },
          trends: {
            monthly: formattedMonthlyTrends,
            daily: formattedDailyTrends
          },
          filtered: {
            total: filteredTotal,
            biasStats: filteredBiasStats[0] || { left: 0, center: 0, right: 0, count: 0 }
          }
        }
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
        message: "서버 내부 오류",
        result: null
      })
    };
  }
};