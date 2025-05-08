import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DatePicker } from 'antd';
import moment from 'moment';
import axios from 'axios';
import styled from 'styled-components';

const { RangePicker } = DatePicker;

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Section = styled.section`
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  margin-bottom: 1rem;
  color: #333;
`;

const FilterContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Statistics = () => {
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const response = await axios.get('/.netlify/functions/statistics', {
        params: {
          dateFrom: startDate.format('YYYY-MM-DD'),
          dateTo: endDate.format('YYYY-MM-DD')
        },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setStats(response.data.result);
    } catch (error) {
      console.error('통계 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  if (loading) return <div>로딩 중...</div>;
  if (!stats) return <div>데이터를 불러올 수 없습니다.</div>;

  return (
    <Container>
      <Section>
        <Title>뉴스 통계</Title>
        <FilterContainer>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            allowClear={false}
          />
        </FilterContainer>
      </Section>

      <Section>
        <Title>시계열 분석</Title>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={stats.timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="bias.left" name="좌파" stroke="#FF0000" />
            <Line type="monotone" dataKey="bias.center" name="중립" stroke="#00FF00" />
            <Line type="monotone" dataKey="bias.right" name="우파" stroke="#0000FF" />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      <Section>
        <Title>언론사별 통계</Title>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={stats.mediaStats}
              dataKey="count"
              nameKey="press"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label
            >
              {stats.mediaStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Section>

      <Section>
        <Title>카테고리별 통계</Title>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={stats.categoryStats}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label
            >
              {stats.categoryStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Section>

      <Section>
        <Title>전체 통계</Title>
        <div>
          <p>총 뉴스 수: {stats.total}</p>
          <p>선택 기간 뉴스 수: {stats.filtered.total}</p>
          <p>평균 바이어스:</p>
          <ul>
            <li>좌파: {(stats.biasStats.left * 100).toFixed(2)}%</li>
            <li>중립: {(stats.biasStats.center * 100).toFixed(2)}%</li>
            <li>우파: {(stats.biasStats.right * 100).toFixed(2)}%</li>
          </ul>
        </div>
      </Section>
    </Container>
  );
};

export default Statistics; 
