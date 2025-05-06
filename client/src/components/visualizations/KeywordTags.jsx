import React from 'react';

// 키워드 태그를 표시하는 컴포넌트
const KeywordTags = ({ keywords }) => {
  // 키워드가 없거나 빈 배열이면 아무것도, 표시하지 않음
  if (!keywords || keywords.length === 0) {
    return null;
  }
  
  return (
    <div className="cluster-keywords">
      {keywords.map((keyword) => (
        <span 
          key={keyword.word} 
          className="keyword-tag"
          title={`연관도: ${(keyword.score * 100).toFixed(0)}%`}
        >
          {keyword.word}
        </span>
      ))}
    </div>
  );
};

export default KeywordTags;