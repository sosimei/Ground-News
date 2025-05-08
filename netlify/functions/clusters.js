const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// 클러스터 컬렉션을 미들웨어로 사용
module.exports = (clustersCollection) => {
  // 이미지 URL 추가 헬퍼 함수
  const addImageUrls = (clusters, isSingleCluster = false) => {
    const processCluster = (cluster) => {
      // 클러스터 대표 이미지
      if (cluster.image_file_id) {
        cluster.thumbnail_url = `/api/images/${cluster.image_file_id}`;
      }
      
      // 각 정치적 관점별 대표 이미지 추가
      ['left', 'center', 'right'].forEach(perspective => {
        if (cluster[perspective]) {
          // 관점별 대표 이미지가 있다면 URL 추가
          if (cluster[perspective].image_file_id) {
            cluster[perspective].thumbnail_url = `/api/images/${cluster[perspective].image_file_id}`;
          }
          
          // 관점별 기사 이미지 URL 추가
          const articleIds = cluster[perspective][`${perspective}_article_ids`] || [];
          if (articleIds.length > 0) {
            cluster[perspective].article_thumbnails = articleIds.map(id => ({
              article_id: id,
              thumbnail_url: `/api/images/article/${id}`
            }));
          }
        }
      });
      
      return cluster;
    };
    
    // 단일 클러스터인 경우
    if (isSingleCluster) {
      return processCluster(clusters);
    }
    
    // 클러스터 배열인 경우
    return clusters.map(processCluster);
  };

  // 핫 뉴스 preview 가져오기
  router.get('/hot', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const clusters = await clustersCollection
        .find({})
        .sort({ 'bias_ratio.total': -1 }) // 편향도가 높은 순으로 정렬
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await clustersCollection.countDocuments({});

      res.json({
        clusters,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching hot clusters:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  // 최근 뉴스 preview 가져오기
  router.get('/latest', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const clusters = await clustersCollection
        .find({})
        .sort({ pub_date: -1 }) // 최신순으로 정렬
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await clustersCollection.countDocuments({});

      res.json({
        clusters,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching latest clusters:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  // 카테고리 별 핫 뉴스 preview 가져오기
  router.get('/hot/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const clusters = await clustersCollection
        .find({ category })
        .sort({ 'bias_ratio.total': -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await clustersCollection.countDocuments({ category });

      res.json({
        clusters,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching hot clusters by category:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  // 카테고리 별 최근 뉴스 preview 가져오기
  router.get('/latest/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const clusters = await clustersCollection
        .find({ category })
        .sort({ pub_date: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await clustersCollection.countDocuments({ category });

      res.json({
        clusters,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching latest clusters by category:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  // 디테일 핫 뉴스 가져오기
  router.get('/hot/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const cluster = await clustersCollection.findOne({ _id: id });
      
      if (!cluster) {
        return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });
      }

      res.json(cluster);
    } catch (error) {
      console.error('Error fetching hot cluster detail:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  // 디테일 최근 뉴스 가져오기
  router.get('/latest/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const cluster = await clustersCollection.findOne({ _id: id });
      
      if (!cluster) {
        return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });
      }

      res.json(cluster);
    } catch (error) {
      console.error('Error fetching latest cluster detail:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  return router;
};
