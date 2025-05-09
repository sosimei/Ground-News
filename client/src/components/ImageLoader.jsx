import React, { useState, useEffect } from 'react';
import apiService from '../utils/api';
import imageService from '../utils/imageService';

/**
 * 이미지 로더 컴포넌트
 * 이미지 ID를 받아 해당 이미지를 GridFS에서 로드하고 표시
 * 로딩 중이거나 오류 발생 시 대체 이미지 표시
 */
const ImageLoader = ({ 
  imageId, 
  alt = '뉴스 이미지', 
  className = '', 
  width = 300, 
  height = 200,
  placeholderText = null,
  cluster = null,
  onLoad = () => {},
  onError = () => {}
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // 이미지 로드 함수
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      if (!imageId) {
        setLoading(false);
        setError(true);
        return;
      }
      
      try {
        const result = await apiService.images.getImageById(imageId);
        
        if (isMounted && result.success && result.data.url) {
          setImageUrl(result.data.url);
          setLoading(false);
          onLoad(result.data);
        } else {
          throw new Error('이미지 로드 실패');
        }
      } catch (error) {
        console.error('이미지 로드 오류:', error);
        if (isMounted) {
          setError(true);
          setLoading(false);
          onError(error);
        }
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
      // URL.revokeObjectURL을 사용하여 메모리 누수 방지
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageId]);
  
  // 로딩 중 표시
  if (loading) {
    return (
      <div 
        className={`image-loader loading ${className}`}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          color: '#666',
          fontSize: '14px'
        }}
      >
        이미지 로딩 중...
      </div>
    );
  }
  
  // 오류 발생 시 대체 이미지 표시
  if (error || !imageUrl) {
    let placeholderImageUrl;
    
    if (cluster) {
      // 클러스터 정보가 있으면 클러스터 기반 대체 이미지 생성
      placeholderImageUrl = imageService.getClusterPlaceholderImage(cluster);
    } else {
      // 단순 대체 이미지
      placeholderImageUrl = imageService.getPlaceholderImage(
        placeholderText || alt, 
        width, 
        height
      );
    }
    
    return (
      <img 
        src={placeholderImageUrl}
        alt={alt}
        className={`image-loader placeholder ${className}`}
        style={{ width: `${width}px`, height: `${height}px`, objectFit: 'cover' }}
      />
    );
  }
  
  // 이미지 표시
  return (
    <img 
      src={imageUrl}
      alt={alt}
      className={`image-loader ${className}`}
      style={{ width: `${width}px`, height: `${height}px`, objectFit: 'cover' }}
      onError={() => {
        setError(true);
        onError(new Error('이미지 로드 실패'));
      }}
    />
  );
};

export default ImageLoader;