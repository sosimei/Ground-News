// 실제 API가 구현되지 않은 부분을 대체하기 위한 모킹 데이터
const mockData = {
  // 날짜 목록 모킹
  dates: ["2025-05-08", "2025-05-07", "2025-05-06", "2025-05-05", "2025-05-04"],
  
  // 카테고리 목록 모킹
  categories: ["정치", "경제", "사회", "국제", "문화", "스포츠", "과학", "기술"],
  
  // 클러스터 상세 정보 모킹 (특정 ID에 해당하는 데이터가 없을 때 임시 사용)
  getClusterDetail: (id) => {
    // /api/clusters/hot 응답에서 해당 ID를 가진 클러스터를 찾아 반환
    // 이 함수는 사용 전에 setHotClusters로 데이터가 설정되어 있어야 함
    if (mockData.hotClusters && mockData.hotClusters.length > 0) {
      const found = mockData.hotClusters.find(c => c._id === id);
      if (found) return found;
    }
    
    // 찾지 못한 경우 기본 데이터 반환
    return {
      _id: id,
      title: "클러스터 정보를 찾을 수 없습니다",
      pub_date: "2025-05-08",
      bias_ratio: { left: 0.33, center: 0.34, right: 0.33 },
      left: {
        summary: "이 기사의 왼쪽 관점 정보가 없습니다.",
        keywords: [{ word: "예시", score: 0.9 }],
        press_list: ["예시 언론사"],
        article_urls: ["https://example.com"]
      },
      center: {
        summary: "이 기사의 중립 관점 정보가 없습니다.",
        keywords: [{ word: "예시", score: 0.9 }],
        press_list: ["예시 언론사"],
        article_urls: ["https://example.com"]
      },
      right: {
        summary: "이 기사의 오른쪽 관점 정보가 없습니다.",
        keywords: [{ word: "예시", score: 0.9 }],
        press_list: ["예시 언론사"],
        article_urls: ["https://example.com"]
      },
      media_counts: { "예시 언론사": 3 }
    };
  },
  
  // 트렌딩 데이터 모킹
  trending: {
    trendingKeywords: [
      { _id: "정치", totalScore: 2.5 },
      { _id: "경제", totalScore: 2.2 },
      { _id: "사회", totalScore: 2.0 },
      { _id: "국제", totalScore: 1.8 },
      { _id: "문화", totalScore: 1.5 }
    ],
    trendingClusters: [] // 이것은 실제 hot clusters 데이터로 채워질 것입니다
  },
  
  // hotClusters 데이터를 설정하는 함수
  setHotClusters: (clusters) => {
    mockData.hotClusters = clusters;
    // 트렌딩 클러스터를 실제 데이터의 첫 5개로 설정
    mockData.trending.trendingClusters = clusters.slice(0, 5);
  }
};

export default mockData;
