export function fmtTime(sec) {
  if (sec == null || Number.isNaN(sec)) return '--:--';
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(r).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 'YYYY-MM-DDTHH:mm' (한국 시간 기준으로 저장) → '10월 14일 (수) 23:59'
export function fmtDue(iso) {
  if (!iso) return '';
  const [d, t] = iso.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const day = DAYS[new Date(Date.UTC(y, mo - 1, da)).getUTCDay()];
  return `${mo}월 ${da}일 (${day})${t ? ` ${t}` : ''}`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, mo, da] = iso.split('-').map(Number);
  const day = DAYS[new Date(Date.UTC(y, mo - 1, da)).getUTCDay()];
  return `${mo}/${da} (${day})`;
}

export function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function lectureLabel(lecture) {
  return `Lecture ${String(lecture.number).padStart(2, '0')}`;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

// public 폴더 파일 경로('/videos/a.mp4')를 배포 주소(하위 경로 포함)에 맞게 변환
export function asset(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  return import.meta.env.BASE_URL + path.slice(1);
}
