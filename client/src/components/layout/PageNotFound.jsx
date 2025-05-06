import React from 'react';
import { Link } from 'react-router-dom';

const PageNotFound = () => {
  return (
    <div className="error-page">
      <h1>404 - 페이지를 찾을 수 없습니다</h1>
      <p>요청하신 페이지가 존재하지 않거나 다른 주소로 이동되었습니다.</p>
      <div className="error-actions">
        <Link to="/" className="btn">홈으로 돌아가기</Link>
        <Link to="/news" className="btn btn-secondary">뉴스 목록 보기</Link>
      </div>
    </div>
  );
};

export default PageNotFound;