# 한국판 그라운드 뉴스 API 명세서

이 문서는 한국판 그라운드 뉴스의 API 명세를 설명합니다.

## 공통 응답 형식

### 뉴스 목록 응답 (List Response)

```json
{
  "clusters": [
    {
      // 뉴스 클러스터 객체
      "_id": "ObjectId",
      "cluster_id": "String",
      "title": "String",
      "crawl_date": "String",
      "bias_ratio": {
        "left": Number,
        "center": Number,
        "right": Number
      },
      "left": {
        "summary": "String",
        "keywords": Array,
        "press_list": Array,
        // 기타 왼쪽 관점 데이터
      },
      "center": {
        // 중도 관점 데이터
      },
      "right": {
        // 우측 관점 데이터
      },
      // 기타 메타데이터
    },
    // 추가 뉴스 클러스터 객체들...
  ],
  "pagination": {
    "page": Number,
    "limit": Number,
    "total": Number,
    "totalPages": Number
  }
}
```

### 뉴스 상세 응답 (Detail Response)

```json
{
  "_id": "ObjectId",
  "cluster_id": "String",
  "title": "String",
  "crawl_date": "String",
  "bias_ratio": {
    "left": Number,
    "center": Number,
    "right": Number
  },
  "left": {
    "summary": "String",
    "keywords": Array,
    "press_list": Array,
    "left_article_ids": Array,
    "left_article_urls": Array
  },
  "center": {
    "summary": "String",
    "keywords": Array,
    "press_list": Array,
    "center_article_ids": Array,
    "center_article_urls": Array
  },
  "right": {
    "summary": "String",
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

## API 엔드포인트

### 1. 핫 뉴스 목록 가져오기

**요청:**
- URL: `/clusters/hot`
- Method: `GET`
- Query Parameters:
  - `limit` (Integer, Optional, 기본값=10): 페이지당 결과 수
  - `page` (Integer, Optional, 기본값=1): 페이지 번호

**응답:**
- 성공 (200): 뉴스 클러스터 목록 (위 '뉴스 목록 응답' 형식)

### 2. 최근 뉴스 목록 가져오기

**요청:**
- URL: `/clusters/latest`
- Method: `GET`
- Query Parameters:
  - `limit` (Integer, Optional, 기본값=10): 페이지당 결과 수
  - `page` (Integer, Optional, 기본값=1): 페이지 번호

**응답:**
- 성공 (200): 뉴스 클러스터 목록 (위 '뉴스 목록 응답' 형식)

### 3. 카테고리별 핫 뉴스 목록 가져오기

**요청:**
- URL: `/clusters/hot/{category}`
- Method: `GET`
- URL Parameters:
  - `category` (String, Required): 뉴스 카테고리
- Query Parameters:
  - `limit` (Integer, Optional, 기본값=10): 페이지당 결과 수
  - `page` (Integer, Optional, 기본값=1): 페이지 번호

**응답:**
- 성공 (200): 뉴스 클러스터 목록 (위 '뉴스 목록 응답' 형식)

### 4. 카테고리별 최근 뉴스 목록 가져오기

**요청:**
- URL: `/clusters/latest/{category}`
- Method: `GET`
- URL Parameters:
  - `category` (String, Required): 뉴스 카테고리
- Query Parameters:
  - `limit` (Integer, Optional, 기본값=10): 페이지당 결과 수
  - `page` (Integer, Optional, 기본값=1): 페이지 번호

**응답:**
- 성공 (200): 뉴스 클러스터 목록 (위 '뉴스 목록 응답' 형식)

### 5. 세부 핫 뉴스 가져오기

**요청:**
- URL: `/clusters/hot/{id}`
- Method: `GET`
- URL Parameters:
  - `id` (String, Required): 뉴스 클러스터 ID

**응답:**
- 성공 (200): 뉴스 클러스터 상세 정보 (위 '뉴스 상세 응답' 형식)
- 실패 (404): 뉴스를 찾을 수 없음

### 6. 세부 최근 뉴스 가져오기

**요청:**
- URL: `/clusters/latest/{id}`
- Method: `GET`
- URL Parameters:
  - `id` (String, Required): 뉴스 클러스터 ID

**응답:**
- 성공 (200): 뉴스 클러스터 상세 정보 (위 '뉴스 상세 응답' 형식)
- 실패 (404): 뉴스를 찾을 수 없음

## 오류 응답

모든 API 엔드포인트는 오류 발생시 다음과 같은 응답을 반환합니다:

```json
{
  "error": "Error message",
  "message": "Detailed error message or description"
}
```

- 400: 잘못된 요청 (파라미터 오류 등)
- 404: 리소스를 찾을 수 없음
- 500: 서버 내부 오류
