require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// 샘플 뉴스 데이터
const sampleNews = [
  {
    cluster_id: "1",
    title: '정부, 반도체 산업 5년간 1조원 투자 계획 발표',
    crawl_date: "2025-05-01",
    category: '경제',
    bias_ratio: {
      left: 0.3,
      center: 0.4,
      right: 0.3
    },
    left: {
      summary: '정부가 반도체 산업에 1조원 투자 계획을 발표했지만, 노동계와 환경단체는 노동권 보호와 환경 영향 평가가 부족하다고 비판했다. 취약계층 보호와 공정한 일자리 배분이 중요하다고 강조하며 정부 정책의 재검토를 요구했다.',
      keywords: [
        { word: '노동권', score: 0.9 },
        { word: '환경 영향', score: 0.85 },
        { word: '공정 배분', score: 0.8 },
        { word: '기업 책임', score: 0.75 },
        { word: '취약계층', score: 0.7 }
      ],
      press_list: ['한경레'],
      left_article_ids: ["68113726af7d33520dbfcd10"],
      left_article_urls: ["https://www.hani.co.kr"]
    },
    center: {
      summary: '정부가 국내 반도체 산업 경쟁력 강화를 위해 향후 5년간 1조원 규모의 투자 계획을 발표했다. 이번 투자는 첨단 반도체 기술 개발과 인재 양성, 중소기업 지원 등에 활용될 예정이다.',
      keywords: [
        { word: '반도체', score: 0.9 },
        { word: '정부 투자', score: 0.85 },
        { word: '산업 경쟁력', score: 0.8 },
        { word: '기술 개발', score: 0.75 },
        { word: '인재 양성', score: 0.7 }
      ],
      press_list: ['연합뉴스'],
      center_article_ids: ["68113726af7d33520dbfcd11"],
      center_article_urls: ["https://www.yna.co.kr"]
    },
    right: {
      summary: '정부의 반도체 산업 1조원 투자 계획은 국가 경제성장에 크게 기여할 전략적 결정이다. 시장 주도적 투자와 규제 해소가 경쟁력 확보에 필요하며, 외국과의 기술 경쟁에서 승리하기 위한 적절한 조치로 평가된다.',
      keywords: [
        { word: '국가 경쟁력', score: 0.9 },
        { word: '규제 해소', score: 0.85 },
        { word: '시장 주도', score: 0.8 },
        { word: '기술 보호', score: 0.75 },
        { word: '경제 성장', score: 0.7 }
      ],
      press_list: ['조선일보'],
      right_article_ids: ["68113726af7d33520dbfcd12"],
      right_article_urls: ["https://www.chosun.com"]
    },
    media_counts: {
      '연합뉴스': 1,
      '한경레': 1,
      '조선일보': 1
    },
    model_ver: "gpt-4.1-nano",
    created_at: new Date('2025-05-01T13:03:08.119806+00:00'),
    updated_at: new Date('2025-05-01T13:03:08.119806+00:00'),
  },
  {
    cluster_id: "2",
      { name: '조선일보', bias: '보수', url: 'https://www.chosun.com' },
      { name: '한겨레', bias: '진보', url: 'https://www.hani.co.kr' },
      { name: '중앙일보', bias: '중도보수', url: 'https://www.joongang.co.kr' }
    ]
  },
  {
    title: '여야, 국회 법사위 놓고 충돌... 법안 처리 지연',
    content: '여야가 국회 법제사법위원회 운영을 놓고 충돌하면서 주요 법안 처리가 지연되고 있다. 야당은 법사위 위원장직을 요구하고 있는 반면, 여당은 기존 관례에 따라 여당이 맡아야 한다고 주장하며 대립 중이다.',
    category: '정치',
    date: new Date('2025-05-02'),
    sources: [
      { name: '동아일보', bias: '보수', url: 'https://www.donga.com' },
      { name: '경향신문', bias: '진보', url: 'https://www.khan.co.kr' },
      { name: '한국일보', bias: '중도', url: 'https://www.hankookilbo.com' }
    ]
  },
  {
    title: '코로나19 신종 변이 바이러스 첫 국내 감염자 발생',
    content: '코로나19 신종 변이 바이러스 감염자가 국내에서 처음으로 확인됐다. 방역당국은 해외 입국자를 통해 유입된 것으로 추정하고 있으며, 기존 백신의 효과는 유지되는 것으로 알려졌다.',
    category: '사회',
    date: new Date('2025-05-03'),
    sources: [
      { name: 'YTN', bias: '중도', url: 'https://www.ytn.co.kr' },
      { name: 'TV조선', bias: '보수', url: 'https://www.tvchosun.com' },
      { name: 'JTBC', bias: '중도진보', url: 'https://www.jtbc.co.kr' }
    ]
  },
  {
    title: '국제올림픽위원회, 2036년 올림픽 개최지 발표 연기',
    content: 'IOC가 2036년 하계올림픽 개최지 발표를 내년으로 연기했다. 한국을 포함한 여러 국가가 유치 의향을 표명한 가운데, IOC는 후보 도시들의 추가 준비 시간을 위해 결정을 연기했다고 밝혔다.',
    category: '국제',
    date: new Date('2025-05-04'),
    sources: [
      { name: 'SBS', bias: '중도', url: 'https://www.sbs.co.kr' },
      { name: 'KBS', bias: '중도', url: 'https://www.kbs.co.kr' },
      { name: 'MBC', bias: '중도진보', url: 'https://www.mbc.co.kr' }
    ]
  },
  {
    title: '국내 대표 영화제, 역대 최다 관객 동원 기록',
    content: '올해 개최된 국내 대표 영화제가 관객 수 20만 명을 넘어서며 역대 최다 관객 동원 기록을 세웠다. 코로나19 이후 문화 행사가 정상화되면서 해외 관객도 크게 증가한 것으로 나타났다.',
    category: '문화',
    date: new Date('2025-05-05'),
    sources: [
      { name: '스포츠조선', bias: '중도보수', url: 'https://www.sportschosun.com' },
      { name: '오마이뉴스', bias: '진보', url: 'https://www.ohmynews.com' },
      { name: '뉴시스', bias: '중도', url: 'https://www.newsis.com' }
    ]
  },
  {
    title: '국내 인공지능 스타트업, 글로벌 대회서 우승',
    content: '국내 인공지능 스타트업이 세계적 권위의 AI 경진대회에서 우승을 차지했다. 자연어 처리 분야에서 혁신적인 모델을 발표해 주목받았으며, 글로벌 기업들의 투자 제안이 쇄도하고 있다.',
    category: '과학',
    date: new Date('2025-05-06'),
    sources: [
      { name: '전자신문', bias: '중도', url: 'https://www.etnews.com' },
      { name: '매일경제', bias: '중도보수', url: 'https://www.mk.co.kr' },
      { name: '한국경제', bias: '보수', url: 'https://www.hankyung.com' }
    ]
  },
  {
    title: '프로야구 올스타전, 역대 최고 시청률 기록',
    content: '어제 열린 프로야구 올스타전이 평균 시청률 15.7%를 기록하며 역대 최고 시청률을 달성했다. 신인왕 출신 선수들의 맹활약과 다양한 이벤트로 팬들의 큰 호응을 얻었다.',
    category: '스포츠',
    date: new Date('2025-05-06'),
    sources: [
      { name: '스포츠서울', bias: '중도', url: 'https://www.sportsseoul.com' },
      { name: '스포티비', bias: '중도', url: 'https://www.spotvnews.co.kr' },
      { name: '일간스포츠', bias: '중도보수', url: 'https://www.ilgansports.com' }
    ]
  }
];

async function seedDatabase() {
  try {
    await client.connect();
    console.log('몽고DB에 연결되었습니다');

    const database = client.db('news_bias');
    const collection = database.collection('clusters');

    // 기존 데이터 삭제 (선택사항)
    await collection.deleteMany({});
    console.log('기존 데이터를 삭제했습니다');

    // 샘플 데이터 삽입
    const result = await collection.insertMany(sampleNews);
    console.log(`${result.insertedCount}개의 뉴스 항목이 추가되었습니다`);

    console.log('샘플 데이터 삽입이 완료되었습니다');
  } catch (error) {
    console.error('데이터 시드 오류:', error);
  } finally {
    await client.close();
    console.log('몽고DB 연결을 종료했습니다');
  }
}

// 스크립트 실행
seedDatabase();
