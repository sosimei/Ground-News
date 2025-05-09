const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const config = require('../config');

// 기사 정보 조회 API
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
    
    // ObjectId로 변환
    const id = new ObjectId(req.params.id);
    
    // 기사 정보 조회
    const articles = db.collection('news_raw');
    const article = await articles.findOne({ _id: id });
    
    if (!article) {
      return res.status(404).send('Article not found');
    }

    // 이미지 관련 정보 제거
    const { image_file_id, ...articleWithoutImage } = article;

    res.json(articleWithoutImage);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  } finally {
    await client.close();
  }
});

// 클러스터에 속한 기사들 조회 API
router.get('/bycluster/:clusterId', async (req, res) => {
  const client = new MongoClient(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsCAFile: require('path').resolve(__dirname, '../ca-certificate.crt')
  });

  try {
    await client.connect();
    const db = client.db('news_bias');
    
    // 클러스터 ID로 변환
    const clusterId = req.params.clusterId;
    
    // 클러스터 정보 조회
    const clusters = db.collection('clusters');
    const cluster = await clusters.findOne({ cluster_id: clusterId });
    
    if (!cluster) {
      return res.status(404).send('Cluster not found');
    }

    // 클러스터 내 기사 ID 목록 수집
    const articleIds = [];
    
    if (cluster.left && cluster.left.left_article_ids) {
      articleIds.push(...cluster.left.left_article_ids.map(id => new ObjectId(id)));
    }
    
    if (cluster.center && cluster.center.center_article_ids) {
      articleIds.push(...cluster.center.center_article_ids.map(id => new ObjectId(id)));
    }
    
    if (cluster.right && cluster.right.right_article_ids) {
      articleIds.push(...cluster.right.right_article_ids.map(id => new ObjectId(id)));
    }
    
    if (articleIds.length === 0) {
      return res.json({ articles: [] });
    }
    
    // 기사 정보 조회
    const articlesCollection = db.collection('news_raw');
    const articles = await articlesCollection.find({ _id: { $in: articleIds } }).toArray();
    
    // 이미지 관련 정보 제거
    const articlesWithoutImages = articles.map(article => {
      const { image_file_id, ...articleWithoutImage } = article;
      return articleWithoutImage;
    });
    
    res.json({ articles: articlesWithoutImages });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  } finally {
    await client.close();
  }
});

module.exports = router;