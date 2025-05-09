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

      // 추가 디버깅 로그
      const collections = await db.listCollections().toArray();
      console.log('사용 가능한 컬렉션:', collections.map(c => c.name).join(', '));

      let objectId;
      try {
        objectId = new ObjectId(imageId);
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: '잘못된 이미지 ID 형식입니다' })
        };
      }

      // 기사 ID인 경우 해당 기사의 image_file_id를 가져옴
      if (isArticleImage) {
        const articlesCollection = db.collection('news_raw');
        const article = await articlesCollection.findOne({ _id: objectId });
        
        if (article && article.image_file_id) {
          objectId = article.image_file_id instanceof ObjectId ? 
                     article.image_file_id : 
                     new ObjectId(article.image_file_id);
          console.log('기사에서 이미지 ID 검색:', objectId);
        } else {
          console.log('기사에 이미지 ID가 없음:', objectId);
          return {
            statusCode: 404,
            body: JSON.stringify({ error: '해당 기사에 이미지가 없습니다' })
          };
        }
      }

      // GridFS 버킷 이름 찾기 (fs, fs.files, thumbnails 등 가능성 있음)
      const bucketNames = ['fs', 'thumbnails', 'images', 'article_images'];
      let fileInfo = null;
      let usedBucket = null;

      for (const bucketName of bucketNames) {
        const filesCollection = db.collection(`${bucketName}.files`);
        if (!filesCollection) continue;
        
        const tempFileInfo = await filesCollection.findOne({ _id: objectId });
        if (tempFileInfo) {
          fileInfo = tempFileInfo;
          usedBucket = bucketName;
          console.log(`이미지 찾음: ${bucketName}.files 컬렉션에서`);
          break;
        }
      }

      if (!fileInfo || !usedBucket) {
        console.log('모든 버킷에서 이미지를 찾을 수 없음:', objectId);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: '이미지를 찾을 수 없습니다' })
        };
      }

      // 이미지 데이터 조회
      const chunksCollection = db.collection(`${usedBucket}.chunks`);
      const chunks = await chunksCollection.find({ files_id: objectId }).sort({ n: 1 }).toArray();

      if (!chunks || chunks.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: '이미지 데이터를 찾을 수 없습니다' })
        };
      }

      // 이미지 데이터 조합
      let imageData = Buffer.alloc(0);
      for (const chunk of chunks) {
        // MongoDB에서 반환된 Binary 객체 처리
        const chunkData = chunk.data && chunk.data.buffer ? 
                          chunk.data.buffer : 
                          chunk.data;
        imageData = Buffer.concat([imageData, chunkData]);
      }

      // 이미지 타입 결정 (기본값은 jpeg)
      let contentType = fileInfo.contentType || 'image/jpeg';
      
      // 이미지가 없는 경우 디폴트 이미지 제공
      if (imageData.length === 0) {
        return {
          statusCode: 302,
          headers: {
            'Location': 'https://placehold.co/600x400?text=No+Image'
          }
        };
      }

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