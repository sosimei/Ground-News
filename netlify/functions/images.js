const { connectToDB, respond, ObjectId } = require('./db-utils');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

exports.handler = async function(event, context) {
  try {
    // CORS 프리플라이트 요청 처리
    if (event.httpMethod === 'OPTIONS') {
      return respond(200, {});
    }

    // 경로에서 이미지 ID 추출
    const pathParts = event.path.split('/');
    const imageId = pathParts[pathParts.length - 1];
    const isArticleImage = event.path.includes('/article/');

    console.log('images.js 호출됨:', event.path, event.httpMethod);
    console.log('이미지 ID:', imageId, '기사 이미지 여부:', isArticleImage);

    if (!imageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '이미지 ID가 필요합니다' })
      };
    }

    // MongoDB 연결
    try {
      const client = require('mongodb').MongoClient;
      const connection = await client.connect(process.env.MONGODB_URI);
      const db = connection.db('news_bias');

      // GridFS 버킷 생성
      const bucket = new GridFSBucket(db, {
        bucketName: isArticleImage ? 'article_images' : 'thumbnails' 
      });

      // 이미지 파일을 찾고 스트림 생성
      let objectId;
      try {
        objectId = new ObjectId(imageId);
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: '잘못된 이미지 ID 형식입니다' })
        };
      }

      // 이미지 메타데이터 조회
      const files = db.collection(isArticleImage ? 'article_images.files' : 'thumbnails.files');
      const fileInfo = await files.findOne({ _id: objectId });

      if (!fileInfo) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: '이미지를 찾을 수 없습니다' })
        };
      }

      // 이미지 데이터 조회
      const chunks = db.collection(isArticleImage ? 'article_images.chunks' : 'thumbnails.chunks');
      const data = await chunks.find({ files_id: objectId }).sort({ n: 1 }).toArray();

      if (!data || data.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: '이미지 데이터를 찾을 수 없습니다' })
        };
      }

      // 이미지 데이터 조합
      let imageData = Buffer.alloc(0);
      for (const chunk of data) {
        imageData = Buffer.concat([imageData, chunk.data.buffer]);
      }

      // 이미지 타입 결정
      let contentType = fileInfo.contentType || 'image/jpeg';

      // 응답 반환
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*'
        },
        body: imageData.toString('base64'),
        isBase64Encoded: true
      };
    } catch (dbError) {
      console.error('DB 연결 또는 이미지 가져오기 오류:', dbError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '서버 오류가 발생했습니다', details: dbError.message })
      };
    }
  } catch (error) {
    console.error('images.js Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '서버 오류가 발생했습니다', details: error.message })
    };
  }
};