const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const { GridFSBucket } = require('mongodb');
const config = require('../config');

// 이미지 조회 API
router.get('/:id', async (req, res) => {
  const client = new MongoClient(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsCAFile: require('path').resolve(__dirname, '../ca-certificate.crt')
  });

  try {
    await client.connect();
    const db = client.db('news_bias');
    const bucket = new GridFSBucket(db);

    // ObjectId로 변환
    const id = new ObjectId(req.params.id);
    
    // 파일 정보 조회
    const files = db.collection('fs.files');
    const fileInfo = await files.findOne({ _id: id });
    
    if (!fileInfo) {
      return res.status(404).send('File not found');
    }

    // 콘텐츠 타입 설정
    res.set('Content-Type', fileInfo.contentType);
    
    // 파일 스트림 생성 및 응답
    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.pipe(res);
    
    downloadStream.on('error', () => {
      res.status(404).send('Error retrieving file');
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;