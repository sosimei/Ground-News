import React from 'react';
import ImageLoader from './ImageLoader';

/**
 * 뉴스 클러스터 카드 컴포넌트
 * 클러스터 정보와 관련 이미지를 함께 표시
 */
const ClusterCard = ({ 
  cluster, 
  onClick, 
  showImage = true,
  imageSize = { width: 200, height: 150 }
}) => {
  if (!cluster) return null;
  
  // 클러스터에서 이미지 ID 추출
  // left/center/right의 첫 번째 기사의
  // image_file_id를 사용하거나, 없으면 null
  const getClusterImageId = () => {
    if (cluster.image_file_id) return cluster.image_file_id;
    
    // 왼쪽(진보) 기사 이미지
    if (cluster.left && cluster.left.article_ids && cluster.left.article_ids.length > 0) {
      if (cluster.left.image_file_id) return cluster.left.image_file_id;
    }
    
    // 중앙(중도) 기사 이미지
    if (cluster.center && cluster.center.article_ids && cluster.center.article_ids.length > 0) {
      if (cluster.center.image_file_id) return cluster.center.image_file_id;
    }
    
    // 오른쪽(보수) 기사 이미지
    if (cluster.right && cluster.right.article_ids && cluster.right.article_ids.length > 0) {
      if (cluster.right.image_file_id) return cluster.right.image_file_id;
    }
    
    return null;
  };
  
  // 정치 편향성 그래프 렌더링 함수
  const renderBiasGraph = (biasRatio) => {
    if (!biasRatio) {
      biasRatio = { left: 0.33, center: 0.34, right: 0.33 };
    }
    
    const leftWidth = `${biasRatio.left * 100}%`;
    const centerWidth = `${biasRatio.center * 100}%`;
    const rightWidth = `${biasRatio.right * 100}%`;
    
    return (
      <div className="bias-graph">
        <div className="bias-bar">
          <div className="bias-segment left" style={{ width: leftWidth }} title={`진보: ${Math.round(biasRatio.left * 100)}%`}>
            {biasRatio.left > 0.1 && `${Math.round(biasRatio.left * 100)}%`}
          </div>
          <div className="bias-segment center" style={{ width: centerWidth }} title={`중도: ${Math.round(biasRatio.center * 100)}%`}>
            {biasRatio.center > 0.1 && `${Math.round(biasRatio.center * 100)}%`}
          </div>
          <div className="bias-segment right" style={{ width: rightWidth }} title={`보수: ${Math.round(biasRatio.right * 100)}%`}>
            {biasRatio.right > 0.1 && `${Math.round(biasRatio.right * 100)}%`}
          </div>
        </div>
        <div className="bias-labels">
          <span className="bias-label left">진보</span>
          <span className="bias-label center">중도</span>
          <span className="bias-label right">보수</span>
        </div>
      </div>
    );
  };

  const imageId = showImage ? getClusterImageId() : null;
  
  return (
    <div className="cluster-card" onClick={() => onClick && onClick(cluster)}>
      <div className="cluster-card-content">
        {showImage && (
          <div className="cluster-card-image">
            <ImageLoader 
              imageId={imageId}
              alt={cluster.title}
              width={imageSize.width}
              height={imageSize.height}
              cluster={cluster}
            />
          </div>
        )}
        
        <div className="cluster-card-info">
          <h3 className="cluster-card-title">{cluster.title}</h3>
          
          <div className="cluster-card-meta">
            <span className="cluster-card-date">{cluster.pub_date || cluster.crawl_date}</span>
            {cluster.category && (
              <span className="cluster-card-category">{cluster.category}</span>
            )}
          </div>
          
          {/* 정치 성향 분포 그래프 */}
          {renderBiasGraph(cluster.bias_ratio)}
          
          {/* 언론사 태그 */}
          {cluster.media_counts && (
            <div className="press-tags">
              {Object.keys(cluster.media_counts).slice(0, 5).map(press => (
                <span key={press} className="press-tag">
                  {press} ({cluster.media_counts[press]})
                </span>
              ))}
              {Object.keys(cluster.media_counts).length > 5 && (
                <span className="press-tag more">
                  +{Object.keys(cluster.media_counts).length - 5}개 더보기
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClusterCard;