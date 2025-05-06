import React from 'react';

const About = () => {
  return (
    <div className="about-page">
      <h1>바이어스 뉴스 소개</h1>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>바이어스 뉴스란?</h2>
        <p>
          바이어스 뉴스는 한국의 다양한 언론사들이 동일한 사건에 대해 어떻게 다르게 보도하는지를 
          비교해볼 수 있는 뉴스 분석 플랫폼입니다. 정치적 성향에 따라 같은 사안도 다르게 해석되고 
          보도되는 현상을 객관적으로 보여주기 위해 개발되었습니다.
        </p>
        <p>
          인공지능 기술을 활용하여 뉴스 기사의 정치적 관점을 분석하고, 진보, 중도, 보수 성향으로 
          분류하여 다양한 관점에서 뉴스를 볼 수 있도록 돕습니다. 이를 통해 사용자들은 더 균형 잡힌 
          시각으로 정보를 접하고 비판적 사고를 기를 수 있습니다.
        </p>
      </div>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>주요 기능</h2>
        <ul>
          <li><strong>뉴스 클러스터링</strong> - 동일한 사건에 대한 다양한 언론사의 기사를 하나의 클러스터로 모아 비교할 수 있습니다.</li>
          <li><strong>정치 성향 분석</strong> - AI 기술을 활용하여 각 기사의 정치적 성향을 진보, 중도, 보수로 분류합니다.</li>
          <li><strong>관점별 요약</strong> - 각 정치 성향별로 뉴스 내용을 요약하여 한눈에 다양한 관점을 비교할 수 있습니다.</li>
          <li><strong>키워드 분석</strong> - 성향별로 강조되는 키워드를 추출하여 보여줍니다.</li>
          <li><strong>통계 대시보드</strong> - 언론사별, 카테고리별 정치 성향 통계를 시각화하여 제공합니다.</li>
        </ul>
      </div>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>정치 성향 분류 기준</h2>
        <p>
          바이어스 뉴스는 한국 언론사들의 정치적 성향을 다음과 같이 분류합니다. 이 분류는 
          학술 연구와 언론 분석을 참고하여 작성되었으며, 시간에 따라 변화할 수 있습니다.
        </p>
        
        <div className="bias-categories">
          <div className="bias-category left">
            <h3>진보 성향</h3>
            <p>진보적 가치관과 정책을 지지하는 경향이 있는 언론사들입니다.</p>
            <ul>
              <li>한겨레</li>
              <li>경향신문</li>
              <li>오마이뉴스</li>
              <li>프레시안</li>
            </ul>
          </div>
          
          <div className="bias-category center">
            <h3>중도 성향</h3>
            <p>상대적으로 중립적인 입장에서 보도하는 경향이 있는 언론사들입니다.</p>
            <ul>
              <li>중앙일보</li>
              <li>JTBC</li>
              <li>연합뉴스</li>
              <li>KBS</li>
              <li>MBC</li>
              <li>SBS</li>
            </ul>
          </div>
          
          <div className="bias-category right">
            <h3>보수 성향</h3>
            <p>보수적 가치관과 정책을 지지하는 경향이 있는 언론사들입니다.</p>
            <ul>
              <li>조선일보</li>
              <li>동아일보</li>
              <li>중앙일보</li>
              <li>매일경제</li>
              <li>한국경제</li>
            </ul>
          </div>
        </div>
        
        <p className="disclaimer">
          * 위 분류는 참고용이며, 실제 각 기사의 정치적 성향은 AI 분석을 통해 개별적으로 판단됩니다.
        </p>
      </div>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>데이터 수집 및 분석 방법</h2>
        <p>
          바이어스 뉴스는 매일 주요 언론사의 기사를 수집하고 분석합니다. 데이터 처리 과정은 
          다음과 같습니다:
        </p>
        <ol>
          <li><strong>뉴스 수집</strong> - 주요 언론사의 웹사이트에서 최신 기사를 자동으로 수집합니다.</li>
          <li><strong>토픽 클러스터링</strong> - 유사한 주제의 기사들을 하나의 클러스터로 그룹화합니다.</li>
          <li><strong>정치 성향 분석</strong> - 자연어 처리 AI 모델을 통해 각 기사의 정치적 관점을 분석합니다.</li>
          <li><strong>키워드 추출</strong> - 각 성향별 주요 키워드를 추출하여 차이점을 부각합니다.</li>
          <li><strong>요약 생성</strong> - 각 정치 성향별로 기사 내용을 요약합니다.</li>
        </ol>
      </div>
      
      <div className="card">
        <h2>개발자 정보</h2>
        <p>
          바이어스 뉴스는 뉴스의 다양한 관점을 객관적으로 비교하기 위해 개발되었습니다. 
          이 프로젝트는 Ground News를 영감으로 삼아 한국형 뉴스 분석 플랫폼을 목표로 합니다.
        </p>
        <p>
          <strong>기술 스택</strong>: React, Node.js, Express, MongoDB, Chart.js
        </p>
        <p>
          <strong>프로젝트 소스 코드</strong>: <a href="https://github.com/sosimei/korean-news-bias-analyzer" target="_blank" rel="noopener noreferrer">GitHub 저장소</a>
        </p>
        <p>
          <strong>문의 사항</strong>: 프로젝트 개선 제안이나 문의 사항은 GitHub 이슈로 등록해주세요.
        </p>
      </div>
    </div>
  );
};

export default About;