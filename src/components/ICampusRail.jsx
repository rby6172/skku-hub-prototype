
import React from 'react';
import {
  BookOpen,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Layers,
  UserCircle2,
} from 'lucide-react';

import { useStore } from '../store.jsx';

export default function ICampusRail() {
  const { screen, patch } = useStore();

  const items = [
    {
      key: 'account',
      label: '계정',
      icon: UserCircle2,
    },
    {
      key: 'dashboard',
      label: '대시보드',
      icon: LayoutDashboard,
    },
    {
      key: 'courses',
      label: '과목',
      icon: BookOpen,
    },
    {
      key: 'calendar',
      label: '캘린더',
      icon: CalendarDays,
    },
    {
      key: 'inbox',
      label: '메시지함',
      icon: Inbox,
    },
  ];

  // 기존 iCampus 대시보드로 이동
  const openDashboard = () => {
    patch({
      screen: 'icampus',
    });
  };

  // 현재 선택된 과목의 Lecture Hub 홈으로 이동
  const openLectureHub = () => {
    patch({
      screen: 'hub',
      tab: 'home',
    });
  };

  return (
    <nav className="rail" aria-label="iCampus 메뉴">
      <div className="rail-logo">
        iCampus
      </div>

      {/* 기존 iCampus 메뉴 */}
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          className={`rail-item ${
            screen === 'icampus' && key === 'dashboard'
              ? 'active'
              : ''
          }`}
          onClick={openDashboard}
        >
          <Icon size={20} strokeWidth={1.7} />
          <span>{label}</span>
        </button>
      ))}

      <div className="rail-sep" />

      {/* Lecture Hub 메뉴 */}
      <button
        type="button"
        className={`rail-item rail-hub ${
          screen === 'hub' ? 'active' : ''
        }`}
        onClick={openLectureHub}
      >
        <Layers size={20} strokeWidth={1.8} />
        <span>Lecture Hub</span>
      </button>
    </nav>
  );
}
