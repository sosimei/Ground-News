const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB 연결
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// 바이어스 통계 가져오기
router.get('/bias', async (req, res) => {
  try {
    await client.connect();
    const collection = client.db('news_db').collection('clusters');
    
    const { dateFrom, dateTo } = req.query;
    const query = {};
    
    if (dateFrom || dateTo) {
      query.crawl_date = {};
      if (dateFrom) query.crawl_date.$gte = new Date(dateFrom);
      if (dateTo) query.crawl_date.$lte = new Date(dateTo);
    }
    
    const clusters = await collection.find(query).toArray();
    
    // 바이어스 비율 계산
    const totalClusters = clusters.length;
    const biasStats = clusters.reduce((acc, cluster) => {
      acc.left += cluster.bias_ratio.left;
      acc.center += cluster.bias_ratio.center;
      acc.right += cluster.bias_ratio.right;
      return acc;
    }, { left: 0, center: 0, right: 0 });
    
    // 평균 계산
    const result = {
      left: biasStats.left / totalClusters,
      center: biasStats.center / totalClusters,
      right: biasStats.right / totalClusters
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching bias statistics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 언론사별 통계 가져오기
router.get('/media', async (req, res) => {
  try {
    await client.connect();
    const collection = client.db('news_db').collection('clusters');
    
    const { dateFrom, dateTo } = req.query;
    const query = {};
    
    if (dateFrom || dateTo) {
      query.crawl_date = {};
      if (dateFrom) query.crawl_date.$gte = new Date(dateFrom);
      if (dateTo) query.crawl_date.$lte = new Date(dateTo);
    }
    
    const clusters = await collection.find(query).toArray();
    
    // 언론사별 기사 수 계산
    const mediaCounts = clusters.reduce((acc, cluster) => {
      Object.entries(cluster.media_counts).forEach(([media, count]) => {
        acc[media] = (acc[media] || 0) + count;
      });
      return acc;
    }, {});
    
    res.json({ mediaCounts });
  } catch (error) {
    console.error('Error fetching media statistics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 카테고리별 통계 가져오기
router.get('/category', async (req, res) => {
  try {
    await client.connect();
    const collection = client.db('news_db').collection('clusters');
    
    const { dateFrom, dateTo } = req.query;
    const query = {};
    
    if (dateFrom || dateTo) {
      query.crawl_date = {};
      if (dateFrom) query.crawl_date.$gte = new Date(dateFrom);
      if (dateTo) query.crawl_date.$lte = new Date(dateTo);
    }
    
    const clusters = await collection.find(query).toArray();
    
    // 카테고리별 클러스터 수 계산
    const categoryCounts = clusters.reduce((acc, cluster) => {
      const category = cluster.category || '기타';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    res.json({ categoryCounts });
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 전체 통계 가져오기
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const collection = client.db('news_db').collection('clusters');
    
    const totalClusters = await collection.countDocuments();
    
    // 전체 기사 수 계산
    const clusters = await collection.find().toArray();
    const totalArticles = clusters.reduce((acc, cluster) => {
      return acc + Object.values(cluster.media_counts).reduce((sum, count) => sum + count, 0);
    }, 0);
    
    // 평균 바이어스 계산
    const biasStats = clusters.reduce((acc, cluster) => {
      acc.left += cluster.bias_ratio.left;
      acc.center += cluster.bias_ratio.center;
      acc.right += cluster.bias_ratio.right;
      return acc;
    }, { left: 0, center: 0, right: 0 });
    
    const averageBias = {
      left: biasStats.left / totalClusters,
      center: biasStats.center / totalClusters,
      right: biasStats.right / totalClusters
    };
    
    res.json({
      totalClusters,
      totalArticles,
      averageBias
    });
  } catch (error) {
    console.error('Error fetching overall statistics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router; 
