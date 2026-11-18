// iCampus 대시보드 모형 — 여기서 Lecture Hub로 들어간다
import React from 'react';
import { ArrowRight, Layers, MoreVertical } from 'lucide-react';
import { courses } from '../data/index.js';
import { useStore } from '../store.jsx';

const COLORS = { swe: '#2f6fed', os: '#0c8599', net: '#7048e8' };

export default function ICampusHome() {
  const { patch, todos } = useStore();
  const openHub = (courseId) => {
    const first = { swe: 'swe-03', os: 'os-01', net: null }[courseId];
    patch({ screen: 'hub', courseId, ...(first ? { lectureId: first } : {}), tab: 'lecture' });
  };
  const pending = todos.filter((t) => !t.completed);
  return (
    <main className="icampus">
      <header className="icampus-head">
        <h1>대시보드</h1>
        <MoreVertical size={18} className="muted" />
      </header>
      <div className="icampus-body">
        <section>
          <div className="hub-promo">
            <div className="hub-promo-icon">
              <Layers size={26} />
            </div>
            <div>
              <strong>Lecture Hub</strong>
              <p>강의자료 · 스크립트 · 필기 · 퀴즈 · 할 일을 강의 단위로 한곳에서 복습하세요.</p>
            </div>
            <button type="button" className="btn primary" onClick={() => patch({ screen: 'hub' })}>
              Lecture Hub 열기 <ArrowRight size={15} />
            </button>
          </div>
          <div className="course-cards">
            {courses.map((c) => (
              <article key={c.id} className="course-card">
                <div className="course-card-top" style={{ background: COLORS[c.id] }} />
                <div className="course-card-body">
                  <strong>{c.title}</strong>
                  <span className="muted">
                    {c.code} · {c.term}
                  </span>
                  <button type="button" className="link-btn" onClick={() => openHub(c.id)}>
                    <Layers size={14} /> Lecture Hub에서 열기
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="icampus-side">
          <h2>할 일</h2>
          {pending.length === 0 ? (
            <p className="muted small">할 일이 없습니다.</p>
          ) : (
            <ul className="icampus-todos">
              {pending.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <span className={`dot ${t.confirmed ? '' : 'warn'}`} />
                  <span>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="muted small proto-note">
            이 화면은 iCampus를 흉내 낸 시연용 모형입니다. 실제 서비스는 iCampus 서버 코드를 수정하지 않고 사이드바 메뉴로 연결하는 방식을 가정합니다.
          </p>
        </aside>
      </div>
    </main>
  );
}
