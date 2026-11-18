// 전공용어 사전
// 스크립트 문장 안에서 {{용어ID|강의에서 실제로 말한 표기}} 로 쓰면
// 화면의 "용어 표기" 설정(원문 / 한글 / English)에 따라 표시가 바뀝니다.
// 사전에 없는 용어ID는 원래 말한 표기를 그대로 보여 줍니다 (FR-TRN-07).

const glossary = {
  se: { ko: '소프트웨어 공학', en: 'Software Engineering' },
  process: { ko: '소프트웨어 프로세스', en: 'Software Process' },
  requirements: { ko: '요구사항', en: 'Requirements' },
  stakeholder: { ko: '이해관계자', en: 'Stakeholder' },
  waterfall: { ko: '폭포수 모델', en: 'Waterfall Model' },
  incremental: { ko: '점진적 개발', en: 'Incremental Development' },
  prototyping: { ko: '프로토타이핑', en: 'Prototyping' },
  plandriven: { ko: '계획 중심 개발', en: 'Plan-driven Development' },
  agile: { ko: '애자일', en: 'Agile' },
  manifesto: { ko: '애자일 선언문', en: 'Agile Manifesto' },
  xp: { ko: '익스트림 프로그래밍', en: 'Extreme Programming (XP)' },
  userstory: { ko: '사용자 스토리', en: 'User Story' },
  pair: { ko: '짝 프로그래밍', en: 'Pair Programming' },
  tdd: { ko: '테스트 주도 개발', en: 'Test-Driven Development' },
  refactoring: { ko: '리팩토링', en: 'Refactoring' },
  ci: { ko: '지속적 통합', en: 'Continuous Integration' },
  scrum: { ko: '스크럼', en: 'Scrum' },
  sprint: { ko: '스프린트', en: 'Sprint' },
  backlog: { ko: '제품 백로그', en: 'Product Backlog' },
  dailyscrum: { ko: '데일리 스크럼', en: 'Daily Scrum' },
  validation: { ko: '검증', en: 'Validation' },
  maintenance: { ko: '유지보수', en: 'Maintenance' },
};

export default glossary;
