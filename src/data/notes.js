// 개인 필기 예시와 AI 필기 점검 결과 (시연용으로 미리 준비한 결과)
// results[].type: missing(누락 가능성) | mismatch(불일치) | insufficient(근거 부족)
// noteLine: 필기에서 문제가 된 줄 (필기 텍스트에 그대로 들어 있어야 강조 표시됨)
// evidence: 강의 근거 (segmentId)

const notes = {
  'swe-03': {
    fileName: 'lecture03_필기.txt',
    text: `[Lecture 03 애자일 필기]
- 애자일 등장 배경: 요구사항이 자주 바뀜, 계획 중심은 변경 비용 큼
- 애자일 선언문 (2001)
  - 개인과 상호작용 > 프로세스와 도구
  - 작동하는 소프트웨어 > 문서
- XP (Extreme Programming)
  - user story 카드
  - pair programming: 2명이 같이 코딩
  - test-first: 테스트 먼저
  - 릴리스 주기: 2~3개월
- XP는 2000년대 초에 처음 만들어짐
- Scrum
  - product backlog
  - sprint: 보통 1~2개월
- HW3 있음 (날짜 확인)`,
    results: [
      {
        id: 'n1', type: 'mismatch', support: 'supported',
        title: 'XP 릴리스 주기가 정정 전 내용으로 적혀 있음',
        noteLine: '  - 릴리스 주기: 2~3개월',
        explanation: '교수자가 슬라이드의 "2~3개월"을 "2~3주"로 구두 정정했습니다. 필기는 정정 전 내용입니다.',
        evidence: ['s24'],
      },
      {
        id: 'n2', type: 'mismatch', support: 'supported',
        title: '스프린트 기간이 강의 설명과 다름',
        noteLine: '  - sprint: 보통 1~2개월',
        explanation: '강의에서는 스프린트가 보통 1주에서 4주라고 설명했습니다.',
        evidence: ['s27'],
      },
      {
        id: 'n3', type: 'missing', support: 'supported',
        title: '애자일 선언문의 가치 4개 중 2개만 필기됨',
        noteLine: '- 애자일 선언문 (2001)',
        explanation: '"계약 협상보다 고객과의 협력", "계획을 따르기보다 변화에 대응"이 빠져 있습니다. 교수자가 두 번 강조한 내용입니다.',
        evidence: ['s8', 's9'],
      },
      {
        id: 'n4', type: 'missing', support: 'supported',
        title: '데일리 스크럼 설명 누락',
        noteLine: '- Scrum',
        explanation: '매일 15분 정도의 짧은 회의(stand-up meeting)라는 설명이 필기에 없습니다.',
        evidence: ['s28', 's29'],
      },
      {
        id: 'n5', type: 'missing', support: 'supported',
        title: '짝 프로그래밍의 역할(driver / navigator) 누락',
        noteLine: '  - pair programming: 2명이 같이 코딩',
        explanation: '슬라이드에는 없지만 강의에서 두 역할과 역할 교대를 설명했습니다.',
        evidence: ['s20'],
      },
      {
        id: 'n6', type: 'insufficient', support: 'insufficient',
        title: '강의 자료에서 확인할 수 없는 내용',
        noteLine: '- XP는 2000년대 초에 처음 만들어짐',
        explanation: '이 강의의 슬라이드·스크립트에서 이 내용을 확인할 수 없습니다. 오류로 판단하지 않았습니다.',
        evidence: [],
      },
    ],
  },
};

export default notes;
