import React from 'react';
import apiService from '../../utils/api';

// 기사 목록을 표시하는 컴포넌트
const ArticleList = ({ articles, press, urls, bias, titles = [], imageIds = [] }) => {
  // 기사 데이터가 없으면 아무것도 표시하지 않음
  if (!press || !urls || press.length === 0 || urls.length === 0) {
    return (
      <div className="article-empty">
        <p>관련 기사가 없습니다.</p>
      </div>
    );
  }
  
  // 바이어스 클래스 결정
  const getBiasClass = (bias) => {
    switch (bias) {
      case 'left':
        return 'bias-left';
      case 'center':
        return 'bias-center';
      case 'right':
        return 'bias-right';
      default:
        return '';
    }
  };
  
  // 바이어스 텍스트 결정
  const getBiasText = (bias) => {
    switch (bias) {
      case 'left':
        return '진보';
      case 'center':
        return '중도';
      case 'right':
        return '보수';
      default:
        return '알 수 없음';
    }
  };

  // 이미지 URL 생성
  const getImageUrl = (imageId) => {
    return apiService.images.getImageUrl(imageId);
  };
  
  return (
    <div className="article-list">
      <h3>
        <span className={`bias-indicator ${getBiasClass(bias)}`}>
          {getBiasText(bias)}
        </span> 
        성향 언론 기사
      </h3>
      
      {press.map((media, index) => (
        <div key={index} className="article-item">
          <div className="article-header">
            <span className="article-source">{media}</span>
          </div>
          
          {imageIds && imageIds[index] && (
            <div className="article-image-container">
              <img 
                src={getImageUrl(imageIds[index])} 
                alt={titles[index] || `${media} 관련 이미지`}
                className="article-thumbnail"
                onError={(e) => {
                  console.error("이미지 로드 실패:", e);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <h4 className="article-title">
            <a href={urls[index]} target="_blank" rel="noopener noreferrer">
              {titles && titles[index] ? titles[index] : `${media} 기사 보기`}
            </a>
          </h4>
        </div>
      ))}
    </div>
  );
};

export default ArticleList;