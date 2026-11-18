// 다른 과목 강의 (빈 화면·처리 상태 시연용)
// status: ready(준비됨) | processing(처리 중) | failed(처리 실패) | empty(자료 없음)

export const os01 = {
  id: 'os-01',
  courseId: 'os',
  number: 1,
  title: '운영체제 개요',
  titleEn: 'Introduction to Operating Systems',
  date: '2026-09-15',
  duration: 0,
  status: 'failed',
  statusReason: '음성을 인식할 수 없는 구간이 많아 스크립트 생성에 실패했습니다. 원본 파일은 그대로 보존되어 있습니다.',
  videoUrl: null,
  slideFile: 'os_lecture01.pdf',
  slides: [
    { no: 1, title: '운영체제 개요', subtitle: 'Introduction to Operating Systems · Lecture 01', bullets: [] },
    { no: 2, title: '운영체제의 역할', bullets: ['자원 관리자', '사용자와 하드웨어 사이의 인터페이스'] },
    { no: 3, title: '커널', bullets: ['항상 메모리에 상주하는 핵심 부분', '시스템 콜로 접근'] },
  ],
  transcript: [],
  findings: [],
};

export const os02 = {
  id: 'os-02',
  courseId: 'os',
  number: 2,
  title: '프로세스와 스레드',
  titleEn: 'Processes and Threads',
  date: '2026-09-22',
  duration: 0,
  status: 'processing',
  statusReason: '스크립트 생성 중입니다. 다른 강의와 기능은 계속 사용할 수 있습니다.',
  videoUrl: null,
  slideFile: 'os_lecture02.pdf',
  slides: [
    { no: 1, title: '프로세스와 스레드', subtitle: 'Processes and Threads · Lecture 02', bullets: [] },
    { no: 2, title: '프로세스', bullets: ['실행 중인 프로그램', '코드 · 데이터 · 스택 · 힙'] },
  ],
  transcript: [],
  findings: [],
};
