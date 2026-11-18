// 자료: 강의별 슬라이드·영상·스크립트·필기 관리와 업로드 (파일은 브라우저 IndexedDB에 저장)
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, FileAudio, FileText, FileVideo, Image as ImageIcon, MonitorPlay, Presentation, Subtitles, Trash2, UploadCloud, X } from 'lucide-react';
import { notes } from '../data/index.js';
import { fmtSize, fmtTime, lectureLabel, uid } from '../lib/format.js';
import { deleteFile, listFiles, saveFile } from '../lib/fileStore.js';
import { useStore } from '../store.jsx';

const KINDS = [
  { kind: 'slide', label: '슬라이드', ext: ['pdf', 'ppt', 'pptx'], max: 100, icon: Presentation },
  { kind: 'media', label: '강의 영상·음성', ext: ['mp4', 'webm', 'mov', 'mp3', 'm4a', 'wav'], max: 1024, icon: FileVideo },
  { kind: 'note', label: '필기', ext: ['txt', 'md', 'pdf', 'png', 'jpg', 'jpeg'], max: 25, icon: FileText },
];

function detectKind(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['mp4', 'webm', 'mov', 'mp3', 'm4a', 'wav'].includes(ext)) return 'media';
  if (['ppt', 'pptx'].includes(ext)) return 'slide';
  if (['txt', 'md', 'png', 'jpg', 'jpeg'].includes(ext)) return 'note';
  if (ext === 'pdf') return 'slide';
  return null;
}

export default function MaterialsTab({ lecture }) {
  const { toast, lectureVideo, patch } = useStore();
  const [files, setFiles] = useState([]);
  const [kind, setKind] = useState('auto');
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const refresh = useCallback(() => {
    if (lecture) listFiles(lecture.id).then(setFiles).catch(() => setFiles([]));
  }, [lecture]);
  useEffect(refresh, [refresh]);

  if (!lecture) return null;

  const handle = async (fileList) => {
    setError('');
    for (const file of Array.from(fileList)) {
      const k = kind === 'auto' ? detectKind(file.name) : kind;
      const spec = KINDS.find((x) => x.kind === k);
      const ext = file.name.split('.').pop().toLowerCase();
      if (!spec || !spec.ext.includes(ext)) {
        setError(`'${file.name}': 지원하지 않는 형식입니다. (슬라이드: PDF·PPT, 영상·음성: MP4·MP3 등, 필기: TXT·PDF·이미지)`);
        continue;
      }
      if (file.size > spec.max * 1024 * 1024) {
        setError(`'${file.name}': ${spec.label} 파일은 ${spec.max} MB 이하만 올릴 수 있습니다.`);
        continue;
      }
      if (file.size === 0) {
        setError(`'${file.name}': 비어 있거나 읽을 수 없는 파일입니다.`);
        continue;
      }
      const dup = files.find((f) => f.name === file.name && f.size === file.size);
      if (dup && !window.confirm(`'${file.name}'과 같은 파일이 이미 있습니다. 별도 자료로 하나 더 추가할까요?\n(취소하면 기존 자료를 그대로 사용합니다)`)) continue;
      const versionOf = files.find((f) => f.name === file.name && f.size !== file.size);
      await saveFile({
        id: uid(),
        lectureId: lecture.id,
        kind: k,
        name: file.name,
        size: file.size,
        type: file.type,
        blob: file,
        createdAt: Date.now(),
        version: versionOf ? (versionOf.version || 1) + 1 : 1,
      });
      toast(`'${file.name}'을 ${lectureLabel(lecture)}에 저장했습니다. 원본 파일은 그대로 보존됩니다.`);
    }
    refresh();
  };

  const builtIn = [
    lecture.slides.length > 0 && {
      key: 'slides', icon: Presentation, name: lecture.slideFile || '슬라이드', meta: `슬라이드 ${lecture.slides.length}장 · 시연 데이터`, status: '준비됨', tone: 'ok',
    },
    {
      key: 'video', icon: MonitorPlay, name: lecture.videoUrl ? lecture.videoUrl.split('/').pop() : '강의 영상', meta: lecture.videoUrl ? '시연 데이터' : lectureVideo[lecture.id] ? '업로드한 영상 사용 중' : '미등록 · 슬라이드 재생 모드로 표시',
      status: lecture.videoUrl || lectureVideo[lecture.id] ? '준비됨' : '자료 없음', tone: lecture.videoUrl || lectureVideo[lecture.id] ? 'ok' : 'muted',
    },
    {
      key: 'script', icon: Subtitles, name: '스크립트 (자동 생성)',
      meta: lecture.transcript.length ? `${lecture.transcript.length}개 구간 · 길이 ${fmtTime(lecture.duration)} · 미리 실행한 STT 결과` : lecture.statusReason || '아직 없음',
      status: { ready: '준비됨', processing: '처리 중', failed: '처리 실패', empty: '자료 없음' }[lecture.status], tone: { ready: 'ok', processing: 'info', failed: 'danger', empty: 'muted' }[lecture.status],
    },
    notes[lecture.id] && { key: 'note', icon: FileText, name: notes[lecture.id].fileName, meta: '개인 필기 · 시연 데이터', status: '준비됨', tone: 'ok' },
  ].filter(Boolean);

  return (
    <div className="materials">
      <section>
        <h3 className="sub-h">{lectureLabel(lecture)} 자료</h3>
        <div className="mat-list">
          {builtIn.map((m) => (
            <div key={m.key} className="mat-item">
              <m.icon size={20} className="muted" />
              <div className="mat-main">
                <strong>{m.name}</strong>
                <span className="muted small">{m.meta}</span>
              </div>
              <span className={`chip chip-${m.tone}`}>{m.status}</span>
            </div>
          ))}
          {files.map((f) => (
            <UploadedItem
              key={f.id}
              f={f}
              isVideo={lectureVideo[lecture.id] === f.id}
              onPreview={() => setPreview(f)}
              onUseVideo={() => {
                patch((s) => ({ lectureVideo: { ...s.lectureVideo, [lecture.id]: s.lectureVideo[lecture.id] === f.id ? undefined : f.id } }));
              }}
              onDelete={async () => {
                if (!window.confirm(`'${f.name}'을 삭제할까요? 이 파일을 참조하는 결과는 근거를 확인할 수 없게 됩니다.`)) return;
                await deleteFile(f.id);
                if (lectureVideo[lecture.id] === f.id) patch((s) => ({ lectureVideo: { ...s.lectureVideo, [lecture.id]: undefined } }));
                refresh();
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="sub-h">자료 업로드</h3>
        <div className="row gap-s upload-kind">
          <span className="muted small">자료 종류</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="auto">자동 판별</option>
            {KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div
          className={`dropzone ${drag ? 'drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handle(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <UploadCloud size={30} />
          <strong>파일을 끌어다 놓거나 클릭해서 선택</strong>
          <span className="muted small">슬라이드 PDF·PPT (100 MB) · 강의 영상·음성 MP4·MP3 (1 GB) · 필기 TXT·PDF·이미지 (25 MB)</span>
          <input ref={inputRef} type="file" multiple hidden onChange={(e) => handle(e.target.files)} />
        </div>
        {error && <div className="error-line">{error}</div>}
        <p className="muted small">
          업로드한 파일은 이 브라우저에만 저장됩니다(서버 없음). 영상을 올린 뒤 "강의 영상으로 사용"을 누르면 강의 보기에서 재생됩니다. 새 파일의 자동 분석은 이 프로토타입에서 제공하지 않습니다.
        </p>
      </section>

      {preview && <PreviewModal f={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function UploadedItem({ f, isVideo, onPreview, onUseVideo, onDelete }) {
  const isMedia = f.kind === 'media';
  const Icon = isMedia ? (f.type.startsWith('audio') ? FileAudio : FileVideo) : f.type.startsWith('image') ? ImageIcon : f.kind === 'slide' ? Presentation : FileText;
  return (
    <div className="mat-item">
      <Icon size={20} className="accent" />
      <div className="mat-main">
        <strong>
          {f.name} {f.version > 1 && <span className="chip chip-info">v{f.version}</span>}
        </strong>
        <span className="muted small">
          {{ slide: '슬라이드', media: '영상·음성', note: '필기' }[f.kind]} · {fmtSize(f.size)} · {new Date(f.createdAt).toLocaleString('ko-KR')}
        </span>
      </div>
      <span className="chip chip-ok">저장됨</span>
      {isMedia && f.type.startsWith('video') && (
        <button type="button" className={`btn small ${isVideo ? 'primary' : ''}`} onClick={onUseVideo}>
          <MonitorPlay size={13} /> {isVideo ? '강의 영상으로 사용 중' : '강의 영상으로 사용'}
        </button>
      )}
      <button type="button" className="icon-btn" aria-label="미리보기" onClick={onPreview}>
        <Eye size={15} />
      </button>
      <button type="button" className="icon-btn" aria-label="삭제" onClick={onDelete}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function PreviewModal({ f, onClose }) {
  const [url, setUrl] = useState(null);
  const [text, setText] = useState(null);
  useEffect(() => {
    const u = URL.createObjectURL(f.blob);
    setUrl(u);
    if (/\.(txt|md)$/i.test(f.name)) f.blob.text().then(setText);
    return () => URL.revokeObjectURL(u);
  }, [f]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  let body;
  if (!url) body = null;
  else if (f.type.startsWith('video')) body = <video src={url} controls className="preview-media" />;
  else if (f.type.startsWith('audio')) body = <audio src={url} controls />;
  else if (f.type.startsWith('image')) body = <img src={url} alt={f.name} className="preview-media" />;
  else if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) body = <iframe title={f.name} src={url} className="preview-frame" />;
  else if (text != null) body = <pre className="preview-text">{text}</pre>;
  else
    body = (
      <div className="empty">
        <strong>미리보기를 제공할 수 없는 형식입니다</strong>
        <p>원본 파일은 그대로 보존되어 있습니다. (PPT는 PDF로 변환해 올리면 미리볼 수 있습니다)</p>
      </div>
    );

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${f.name} 미리보기`}>
        <header>
          <strong>{f.name}</strong>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <div className="modal-body">{body}</div>
      </div>
    </div>
  );
}
