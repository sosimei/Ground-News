# 한국판 그라운드 뉴스 API 명세서

이 문서는 한국판 그라운드 뉴스의 API 명세를 설명합니다.

## 공통 응답 형식

### 뉴스 목록 응답 (List Response)

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공!",
  "result": {
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
      "pages": Number
    }
  }
}
```

### 뉴스 상세 응답 (Detail Response)

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "성공",
  "result": {
    "title": "<string, ≤120자>",
    "pub_date": "<YYYY-MM-DD>",
    "article_ids": ["<ObjectIdString>", ...],
    "article_urls": ["<https://…>", ...],
    "bias_ratio": {
      "left": 0.10,
      "center": 0.50,
      "right": 0.40
    },
    "left": {
      "summary": "<3문장 요약>",
      "keywords": [
        { "word": "<string>", "score": <1-10> },
        ...
      ],
      "press_list": ["<pressCode>", ...],
      "article_ids": ["<ObjectIdString>", ...],
      "article_urls": ["<https://…>", ...]
    },
    "center": {
      "summary": "<3문장 요약>",
      "keywords": [
        { "word": "<string>", "score": <1-10> },
        ...
      ],
      "press_list": ["<pressCode>", ...],
      "article_ids": ["<ObjectIdString>", ...],
      "article_urls": ["<https://…>", ...]
    },
    "right": {
      "summary": "<3문장 요약>",
      "keywords": [
        { "word": "<string>", "score": <1-10> },
        ...
      ],
      "press_list": ["<pressCode>", ...],
      "article_ids": ["<ObjectIdString>", ...],
      "article_urls": ["<https://…>", ...]
    },
    "media_counts": { "<pressCode>": <int>, ... },
    "created_at": "<ISO8601 UTC>",
    "updated_at": "<ISO8601 UTC>",
    "model_ver": "<string>"
  }
}
```

## API 엔드포인트

### 1. 핫 뉴스 목록 가져오기

**요청:**
- URL: `/clusters/hot`
- Method: `GET`
- Query Parameters:
  - `limit` (Integer, Optional, 기본값=5): 페이지당 결과 수
  - `page` (Integer, Optional, 기본값=1): 페이지 번호

**응답:**
- 성공 (200): 뉴스 클러스터 목록 (위 '뉴스 목록 응답' 형식)

### 2. 최근 뉴스 목록 가져오기

**요청:**
- URL: `/clusters/latest`
- Method: `GET`
- Query Parameters:
  - `limit` (Integer, Optional, 기본값=5): 페이지당 결과 수
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
  - `limit` (Integer, Optional, 기본값=20): 페이지당 결과 수
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
  - `limit` (Integer, Optional, 기본값=20): 페이지당 결과 수
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
  "isSuccess": false,
  "code": "ERROR400",  // 혹은 오류 코드에 따라 다름
  "message": "Error message",
  "result": null
}
```

- ERROR400: 잘못된 요청 (파라미터 오류 등)
- ERROR404: 리소스를 찾을 수 없음
- ERROR500: 서버 내부 오류
