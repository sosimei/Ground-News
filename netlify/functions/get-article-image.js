const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

exports.handler = async function(event, context) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // OPTIONS 메서드 처리 (CORS 프리플라이트 요청)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  // 기사 ID 추출
  const articleId = event.path.split('/').pop();
  if (!articleId || articleId === 'get-article-image') {
    return {
      statusCode: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '유효한 기사 ID가 필요합니다.' })
    };
  }

  let client;
  try {
    // MongoDB 연결
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('news_bias');

    // 기사 정보 조회
    const article = await db.collection('news_raw').findOne({ 
      _id: new ObjectId(articleId) 
    });

    if (!article || !article.image_file_id) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: '기사를 찾을 수 없거나 기사에 이미지가 없습니다.' })
    };
    }

    // 이미지 파일 메타데이터 조회
    const file = await db.collection('fs.files').findOne({ 
      _id: new ObjectId(article.image_file_id) 
    });

    if (!file) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: '이미지를 찾을 수 없습니다.' })
      };
    }

    // 모든 청크 가져오기
    const chunks = await db.collection('fs.chunks')
      .find({ files_id: new ObjectId(article.image_file_id) })
      .sort({ n: 1 })
      .toArray();

    if (!chunks || chunks.length === 0) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: '이미지 데이터를 찾을 수 없습니다.' })
      };
    }

    // 모든 청크를 하나의 Buffer로 결합
    let fileData = Buffer.alloc(0);
    for (const chunk of chunks) {
      fileData = Buffer.concat([fileData, chunk.data.buffer]);
    }

    // 이미지 반환
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': file.contentType,
        'Content-Length': file.length,
        'Cache-Control': 'public, max-age=31536000' // 1년 캐싱
      },
      body: fileData.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('get-article-image.js Error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '서버 오류가 발생했습니다.' })
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
};