const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');
const articlesRoutes = require('../../server/routes/articles');
// 다른 라우트들도 필요하면 import

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// API 라우트 설정
app.use('/.netlify/functions/api/articles', articlesRoutes);
// 다른 라우트들도 필요하면 추가

// 기본 라우트
app.get('/.netlify/functions/api', (req, res) => {
  res.json({
    message: 'News Bias API is running'
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '서버 에러가 발생했습니다.',
    error: err.message
  });
});

// serverless 함수로 export
module.exports.handler = serverless(app);