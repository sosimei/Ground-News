/**
 * 이미지 관련 유틸리티 함수
 * news_bias.fs.files 및 news_bias.fs.chunks 컬렉션에서 
 * GridFS에 저장된 이미지를 처리하는 함수들
 */

import api from './api';
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://newsbiasinsight.netlify.app/api';

/**
 * 이미지 ID로 이미지 URL을 가져오는 함수
 * @param {string} imageId - 이미지 파일 ID (ObjectId)
 * @returns {string} 이미지 URL
 */
const getImageUrlById = (imageId) => {
  if (!imageId) return null;
  return `${baseURL}/images/${imageId}`;
};

/**
 * 기사 객체로부터 이미지 URL을 추출하는 함수
 * @param {Object} article - 기사 객체
 * @returns {string|null} 이미지 URL 또는 null
 */
const getImageUrlFromArticle = (article) => {
  if (!article) return null;
  
  // image_file_id가 있는 경우 해당 ID로 이미지 URL 생성
  if (article.image_file_id) {
    return getImageUrlById(article.image_file_id);
  }
  
  return null;
};

/**
 * 이미지 URL이 존재하는지 확인하는 함수
 * @param {string} url - 확인할 이미지 URL
 * @returns {Promise<boolean>} 이미지 존재 여부
 */
const checkImageExists = async (url) => {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('이미지 확인 오류:', error);
    return false;
  }
};

/**
 * 대체 이미지 URL을 생성하는 함수
 * @param {string} text - 이미지 대체 텍스트
 * @param {number} width - 이미지 너비
 * @param {number} height - 이미지 높이
 * @param {string} bgColor - 배경색 (기본: 회색)
 * @param {string} textColor - 텍스트 색 (기본: 흰색)
 * @returns {string} 대체 이미지 URL
 */
const getPlaceholderImage = (text, width = 300, height = 200, bgColor = '6c757d', textColor = 'ffffff') => {
  const placeholderUrl = `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text || '이미지 없음')}`;
  return placeholderUrl;
};

/**
 * 클러스터 제목으로 대체 이미지를 생성하는 함수
 * @param {Object} cluster - 클러스터 객체
 * @returns {string} 대체 이미지 URL
 */
const getClusterPlaceholderImage = (cluster) => {
  if (!cluster || !cluster.title) return getPlaceholderImage('뉴스 클러스터');
  
  // 제목의 앞 부분을 사용하여 대체 이미지 생성
  const shortTitle = cluster.title.length > 20 
    ? cluster.title.substring(0, 20) + '...' 
    : cluster.title;
  
  // bias_ratio에 따라 배경색 설정
  let bgColor = '6c757d'; // 기본 회색
  
  if (cluster.bias_ratio) {
    if (cluster.bias_ratio.left > cluster.bias_ratio.right && cluster.bias_ratio.left > 0.4) {
      bgColor = '007bff'; // 진보적 성향이 강하면 파란색
    } else if (cluster.bias_ratio.right > cluster.bias_ratio.left && cluster.bias_ratio.right > 0.4) {
      bgColor = 'dc3545'; // 보수적 성향이 강하면 빨간색
    } else if (cluster.bias_ratio.center >= 0.4) {
      bgColor = '28a745'; // 중도적 성향이 강하면 녹색
    }
  }
  
  return getPlaceholderImage(shortTitle, 400, 250, bgColor);
};

export default {
  getImageUrlById,
  getImageUrlFromArticle,
  checkImageExists,
  getPlaceholderImage,
  getClusterPlaceholderImage
};
