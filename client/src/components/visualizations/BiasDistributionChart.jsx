import React from 'react';

// 바이어스 분포를 시각적으로 표현하는 컴포넌트
const BiasDistributionChart = ({ biasRatio }) => {
  const { left, center, right } = biasRatio;
  
  return (
    <div className="bias-chart">
      <div className="bias-distribution">
        <div 
          className="bias-left-bar" 
          style={{ width: `${left * 100}%` }}
          title={`진보: ${(left * 100).toFixed(1)}%`}
        ></div>
        <div 
          className="bias-center-bar" 
          style={{ width: `${center * 100}%` }}
          title={`중도: ${(center * 100).toFixed(1)}%`}
        ></div>
        <div 
          className="bias-right-bar" 
          style={{ width: `${right * 100}%` }}
          title={`보수: ${(right * 100).toFixed(1)}%`}
        ></div>
      </div>
      
      <div className="bias-legend">
        <div>
          <span className="bias-indicator bias-left">진보</span>
          <span>{(left * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span className="bias-indicator bias-center">중도</span>
          <span>{(center * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span className="bias-indicator bias-right">보수</span>
          <span>{(right * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default BiasDistributionChart;