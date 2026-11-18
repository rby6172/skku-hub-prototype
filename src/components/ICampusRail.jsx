// iCampus 왼쪽 사이드바를 흉내 낸 모형 (실제 iCampus 코드는 수정하지 않는다는 가정)
import React from 'react';
import { BookOpen, CalendarDays, Inbox, LayoutDashboard, Layers, UserCircle2 } from 'lucide-react';
import { useStore } from '../store.jsx';

export default function ICampusRail() {
  const { screen, patch } = useStore();
  const items = [
    { key: 'account', label: '계정', icon: UserCircle2 },
    { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { key: 'courses', label: '과목', icon: BookOpen },
    { key: 'calendar', label: '캘린더', icon: CalendarDays },
    { key: 'inbox', label: '메시지함', icon: Inbox },
  ];
  return (
    <nav className="rail" aria-label="iCampus 메뉴">
      <div className="rail-logo">iCampus</div>
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          className={`rail-item ${screen === 'icampus' && key === 'dashboard' ? 'active' : ''}`}
          onClick={() => patch({ screen: 'icampus' })}
        >
          <Icon size={20} strokeWidth={1.7} />
          <span>{label}</span>
        </button>
      ))}
      <div className="rail-sep" />
      <button type="button" className={`rail-item rail-hub ${screen === 'hub' ? 'active' : ''}`} onClick={() => patch({ screen: 'hub' })}>
        <Layers size={20} strokeWidth={1.8} />
        <span>Lecture Hub</span>
      </button>
    </nav>
  );
}
