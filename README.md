# 한국판 그라운드 뉴스 (Korean Ground News)

다양한 정치적 관점에서 뉴스를 비교해볼 수 있는 한국판 그라운드 뉴스입니다. 이 웹사이트는 뉴스 기사를 좌파(진보), 중도, 우파(보수) 관점으로 분류하여 같은 사안에 대한 다양한 시각을 제공합니다.

## 프로젝트 구조

```
korean-ground-news/
├── client/             # 프론트엔드 (React)
├── server/             # 백엔드 (Express.js, MongoDB)
└── README.md           # 프로젝트 설명 문서
```

## 기능

- 날짜별 뉴스 클러스터 조회
- 정치 성향별 뉴스 요약 및 비교
- 언론사별 기사 링크 제공
- 정치 성향 분포 시각화
- 뉴스 클러스터별 핵심 키워드 제공

## 기술 스택

### 프론트엔드
- React.js
- CSS (반응형 디자인)
- Vite (빌드 도구)

### 백엔드
- Node.js
- Express.js
- MongoDB (Atlas 클라우드 데이터베이스)

## 설치 및 실행 방법

### 1. 사전 요구사항
- Node.js (14.x 이상)
- npm 또는 yarn

### 2. 백엔드 서버 실행

```bash
# 서버 디렉토리로 이동
cd server

# 의존성 설치
npm install

# 서버 실행
npm start
```

서버는 기본적으로 http://localhost:3001 에서 실행됩니다.

### 3. 프론트엔드 클라이언트 실행

```bash
# 클라이언트 디렉토리로 이동
cd client

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

클라이언트는 기본적으로 http://localhost:5173 에서 실행됩니다.

## 환경 변수 설정

서버의 `.env` 파일에 다음 환경 변수가 설정되어 있어야 합니다:

```
MONGODB_URI=mongodb+srv://argenti1654:zT4kMCBPrBateYRi@news.jcy5i4s.mongodb.net/news_bias?retryWrites=true&w=majority&appName=News
```

## 데이터베이스 구조

MongoDB 클러스터 내 `news_bias` 데이터베이스의 `clusters` 컬렉션에 다음과 같은 구조로 뉴스 클러스터 데이터가 저장됩니다:

```javascript
{
  "_id": ObjectId,
  "cluster_id": String,
  "crawl_date": String,
  "title": String,
  "bias_ratio": {
    "left": Number,
    "center": Number,
    "right": Number
  },
  "left": {
    "summary": String,
    "keywords": Array,
    "press_list": Array,
    "left_article_ids": Array,
    "left_article_urls": Array
  },
  "center": {
    "summary": String,
    "keywords": Array,
    "press_list": Array,
    "center_article_ids": Array,
    "center_article_urls": Array
  },
  "right": {
    "summary": String,
    "keywords": Array,
    "press_list": Array,
    "right_article_ids": Array,
    "right_article_urls": Array
  },
  "media_counts": Object,
  "created_at": Date,
  "updated_at": Date
}
```

## 향후 개발 계획

- 사용자 계정 및 인증 시스템
- 개인화된 뉴스 추천
- 주제별 뉴스 분류
- 모바일 앱 개발
- 실시간 뉴스 업데이트
