// 강의 보기: 영상(또는 슬라이드 재생) + 슬라이드 + 스크립트 동기화
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ChevronLeft, ChevronRight, ListFilter, Loader2, Pause, Play, RotateCcw, RotateCw, Sparkles, Subtitles, Upload, Volume2,
} from 'lucide-react';
import { FINDING_TYPES, segmentAt, segmentsForSlide, plainText } from '../data/index.js';
import { asset, fmtTime } from '../lib/format.js';
import { getFile } from '../lib/fileStore.js';
import { usePlayer, useStore } from '../store.jsx';
import { EmptyState, JumpButton, SlideView, TermText, TypeBadge } from './common.jsx';

// public/audio/swe-03.mp3: Lecture 03 시연용 TTS
const DEMO_AUDIO = { 
  'swe-01': '/audio/swe-01.mp3',
  'swe-02': '/audio/swe-02.mp3',
  'swe-03': '/audio/swe-03.mp3',
 };

export default function LectureTab({ lecture }) {
  const { retried, patch } = useStore();
  if (!lecture) return null;
  const status = retried[lecture.id] && lecture.status === 'failed' ? 'processing' : lecture.status;

  if (status !== 'ready') {
    return <NotReady lecture={lecture} status={status} onRetry={() => patch((s) => ({ retried: { ...s.retried, [lecture.id]: true } }))} onUpload={() => patch({ tab: 'materials' })} />;
  }
  return <Viewer lecture={lecture} />;
}

function NotReady({ lecture, status, onRetry, onUpload }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const slide = lecture.slides[slideIdx];
  return (
    <div className="viewer not-ready">
      <div className="stage-col">
        {lecture.slides.length ? (
          <>
            <div className="stage">
              <SlideView lecture={lecture} slide={slide} />
            </div>
            <div className="slide-nav">
              <button type="button" className="icon-btn" disabled={slideIdx === 0} onClick={() => setSlideIdx((i) => i - 1)} aria-label="이전 슬라이드">
                <ChevronLeft size={16} />
              </button>
              <span className="mono">
                슬라이드 {slide.no} / {lecture.slides.length}
              </span>
              <button type="button" className="icon-btn" disabled={slideIdx === lecture.slides.length - 1} onClick={() => setSlideIdx((i) => i + 1)} aria-label="다음 슬라이드">
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <EmptyState icon={Upload} title="자료 없음" action={<button type="button" className="btn primary" onClick={onUpload}>자료 업로드하기</button>}>
            이 강의에 등록된 슬라이드나 영상이 없습니다.
          </EmptyState>
        )}
      </div>
      <div className="script-col">
        <div className="panel status-panel">
          {status === 'processing' && (
            <>
              <Loader2 size={28} className="spin accent" />
              <strong>스크립트 생성 중</strong>
              <p className="muted">{lecture.statusReason || '처리 작업이 대기열에서 실행 중입니다.'} 다른 강의와 기능은 계속 사용할 수 있습니다.</p>
              <span className="chip chip-info">작업 상태: 실행 중</span>
            </>
          )}
          {status === 'failed' && (
            <>
              <AlertTriangle size={28} className="danger" />
              <strong>처리 실패</strong>
              <p className="muted">{lecture.statusReason}</p>
              <button type="button" className="btn primary" onClick={onRetry}>
                <RotateCcw size={14} /> 다시 시도
              </button>
            </>
          )}
          {status === 'empty' && (
            <>
              <Subtitles size={28} className="muted" />
              <strong>스크립트 없음</strong>
              <p className="muted">강의 영상·음성을 업로드하면 스크립트를 만들 수 있습니다. (이 프로토타입에서는 미리 준비한 강의만 스크립트가 제공됩니다)</p>
              <button type="button" className="btn" onClick={onUpload}>
                <Upload size={14} /> 자료 탭으로
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Viewer({ lecture }) {
  const { analyzed, patch, lectureVideo } = useStore();
  const player = usePlayer();
  const { time, playing, setPlaying, seek } = player;
  const current = segmentAt(lecture, time);
  const slideNo = current?.slide ?? 1;
  const slide = lecture.slides.find((s) => s.no === slideNo);
  const isAnalyzed = !!analyzed[lecture.id];

  const corrections = isAnalyzed ? lecture.findings.filter((f) => f.type === 'correction' && f.slide === slideNo && f.after) : [];
  const slideFindings = isAnalyzed ? lecture.findings.filter((f) => f.slide === slideNo) : [];
  const slideSegs = segmentsForSlide(lecture, slideNo);

  // 업로드한 영상을 이 강의 영상으로 쓰는 경우
  const [uploadedUrl, setUploadedUrl] = useState(null);
  useEffect(() => {
    let url;
    const id = lectureVideo[lecture.id];
    if (!id) {
      setUploadedUrl(null);
      return undefined;
    }
    getFile(id).then((rec) => {
      if (rec?.blob) {
        url = URL.createObjectURL(rec.blob);
        setUploadedUrl(url);
      }
    });
    return () => url && URL.revokeObjectURL(url);
  }, [lectureVideo, lecture.id]);
  const videoSrc = uploadedUrl || asset(lecture.videoUrl);
  const audioSrc = videoSrc ? null : asset(DEMO_AUDIO[lecture.id]);
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => { setAudioReady(false); }, [audioSrc]);

  // 키보드: 스페이스 재생/정지, ← → 5초
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') seek(time + 5);
      else if (e.key === 'ArrowLeft') seek(time - 5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [time, seek, setPlaying]);

  const gotoSlide = (no) => {
    const seg = segmentsForSlide(lecture, no)[0];
    if (seg) seek(seg.start);
  };

  return (
    <div className="viewer">
      <div className="stage-col">
        <div className="stage">
          {videoSrc ? (
            <VideoStage src={videoSrc} />
          ) : (
            <>
              <SlideView lecture={lecture} slide={slide} annotations={corrections} />
              <span className="stage-mode" title="강의 영상이 없어 슬라이드를 시간에 맞춰 보여 줍니다">
                {audioReady ? 'TTS 음성 · 슬라이드 동기화' : '슬라이드 재생 모드 · 영상 미등록'}
              </span>
            </>
          )}
          {audioSrc && <AudioStage key={lecture.id} src={audioSrc} onReadyChange={setAudioReady} />}
          {playing === false && time === 0 && !videoSrc && (
            <button type="button" className="big-play" onClick={() => setPlaying(true)} aria-label="재생">
              <Play size={30} fill="currentColor" />
            </button>
          )}
        </div>
        <PlayerBar lecture={lecture} isAnalyzed={isAnalyzed} hasAudio={audioReady} />
        <div className="below-stage">
          <div className="slide-nav">
            <button type="button" className="icon-btn" disabled={slideNo <= 1} onClick={() => gotoSlide(slideNo - 1)} aria-label="이전 슬라이드">
              <ChevronLeft size={16} />
            </button>
            <span className="mono">
              슬라이드 {slideNo} / {lecture.slides.length}
            </span>
            <button type="button" className="icon-btn" disabled={slideNo >= lecture.slides.length} onClick={() => gotoSlide(slideNo + 1)} aria-label="다음 슬라이드">
              <ChevronRight size={16} />
            </button>
            <span className="muted small">이 슬라이드 설명 구간</span>
            <div className="seg-chips">
              {slideSegs.map((s) => (
                <button key={s.id} type="button" className={`seg-chip mono ${current?.id === s.id ? 'on' : ''}`} onClick={() => seek(s.start)}>
                  {fmtTime(s.start)}
                </button>
              ))}
            </div>
          </div>
          <div className="slide-insights">
            {!isAnalyzed ? (
              <div className="hint">
                <Sparkles size={15} />
                <span>AI 분석을 실행하면 이 슬라이드의 구두 정정·추가 설명이 여기에 표시됩니다.</span>
                <button type="button" className="btn small" onClick={() => patch({ tab: 'analysis' })}>
                  AI 분석으로
                </button>
              </div>
            ) : slideFindings.length === 0 ? (
              <div className="hint muted">
                <Sparkles size={15} /> 이 슬라이드에는 AI 분석 결과가 없습니다.
              </div>
            ) : (
              slideFindings.map((f) => (
                <div key={f.id} className={`mini-finding type-border-${f.type}`}>
                  <TypeBadge type={f.type} />
                  <span className="mini-title">{f.type === 'correction' && f.after ? `${f.before} → ${f.after}` : f.title}</span>
                  <JumpButton lectureId={lecture.id} time={lecture.transcript.find((s) => s.id === f.evidence[f.evidence.length - 1])?.start} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ScriptPanel lecture={lecture} current={current} isAnalyzed={isAnalyzed} />
    </div>
  );
}

function VideoStage({ src }) {
  const ref = useRef(null);
  const { time, setTime, playing, setPlaying, seekNonce, rate, setVideoActive } = usePlayer();

  useEffect(() => {
    setVideoActive(true);
    return () => setVideoActive(false);
  }, [setVideoActive]);

  useEffect(() => {
    const v = ref.current;
    if (v && Math.abs(v.currentTime - time) > 0.3) v.currentTime = time;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekNonce]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing && v.paused) v.play().catch(() => setPlaying(false));
    if (!playing && !v.paused) v.pause();
  }, [playing, setPlaying]);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = rate;
  }, [rate]);

  return (
    <video
      ref={ref}
      src={src}
      className="video"
      onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onClick={() => setPlaying(!playing)}
    />
  );
}

// TTS 파일이 있으면 실제 오디오 재생 시간이 슬라이드/스크립트의 기준이 됩니다.
function AudioStage({ src, onReadyChange }) {
  const ref = useRef(null);
  const readyRef = useRef(false);
  const { time, setTime, playing, setPlaying, seekNonce, rate, setVideoActive } = usePlayer();
  const timeRef = useRef(time);
  const playingRef = useRef(playing);
  const rateRef = useRef(rate);

  useEffect(() => { timeRef.current = time; }, [time]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { rateRef.current = rate; }, [rate]);

  // 로딩 중에는 가상 시계가 먼저 진행되지 않도록 멈춥니다.
  // 파일이 없거나 로딩에 실패하면 기존 슬라이드 재생 모드로 돌아갑니다.
  useEffect(() => {
    readyRef.current = false;
    setVideoActive(true);
    return () => {
      ref.current?.pause();
      setVideoActive(false);
    };
  }, [setVideoActive]);

  const handleReady = () => {
    const audio = ref.current;
    if (!audio || readyRef.current) return;
    readyRef.current = true;
    audio.playbackRate = rateRef.current;
    audio.currentTime = Math.min(timeRef.current, audio.duration || timeRef.current);
    onReadyChange(true);
    if (playingRef.current) audio.play().catch(() => setPlaying(false));
  };

  const handleError = () => {
    readyRef.current = false;
    onReadyChange(false);
    setVideoActive(false);
  };

  useEffect(() => {
    const audio = ref.current;
    if (!audio || !readyRef.current) return;
    const target = Math.min(timeRef.current, audio.duration || timeRef.current);
    if (Math.abs(audio.currentTime - target) > 0.1) audio.currentTime = target;
  }, [seekNonce]);

  useEffect(() => {
    const audio = ref.current;
    if (!audio || !readyRef.current) return;
    if (playing && audio.paused) audio.play().catch(() => setPlaying(false));
    if (!playing && !audio.paused) audio.pause();
  }, [playing, setPlaying]);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = rate;
  }, [rate]);

  return (
    <audio
      ref={ref}
      src={src}
      preload="auto"
      style={{ display: 'none' }}
      onCanPlay={handleReady}
      onError={handleError}
      onTimeUpdate={(e) => { if (readyRef.current) setTime(e.currentTarget.currentTime); }}
      onEnded={() => { setTime(ref.current?.duration || timeRef.current); setPlaying(false); }}
    />
  );
}

function PlayerBar({ lecture, isAnalyzed, hasAudio }) {
  const { time, playing, setPlaying, seek, rate, setRate } = usePlayer();
  const dur = lecture.duration || 1;
  const barRef = useRef(null);
  const current = segmentAt(lecture, time);

  const markers = useMemo(() => {
    if (!isAnalyzed) return [];
    return lecture.findings
      .filter((f) => f.evidence.length)
      .map((f) => {
        const seg = lecture.transcript.find((s) => s.id === f.evidence[f.evidence.length - 1]);
        return seg ? { id: f.id, type: f.type, t: seg.start, title: f.title } : null;
      })
      .filter(Boolean);
  }, [lecture, isAnalyzed]);

  const onBar = (e) => {
    const r = barRef.current.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * dur);
  };

  return (
    <div className="player">
      <button type="button" className="icon-btn" onClick={() => seek(time - 10)} aria-label="10초 뒤로">
        <RotateCcw size={16} />
      </button>
      <button type="button" className="play-btn" onClick={() => setPlaying(!playing)} aria-label={playing ? '일시정지' : '재생'}>
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>
      <button type="button" className="icon-btn" onClick={() => seek(time + 10)} aria-label="10초 앞으로">
        <RotateCw size={16} />
      </button>
      <span className="mono time">
        {fmtTime(time)} / {fmtTime(dur)}
      </span>
      <div className="bar" ref={barRef} onClick={onBar} role="slider" aria-label="재생 위치" aria-valuemin={0} aria-valuemax={dur} aria-valuenow={Math.round(time)} tabIndex={0}>
        <div className="bar-fill" style={{ width: `${(time / dur) * 100}%` }} />
        {lecture.slides.map((s) => {
          const seg = segmentsForSlide(lecture, s.no)[0];
          return seg ? <span key={s.no} className="bar-slide" style={{ left: `${(seg.start / dur) * 100}%` }} /> : null;
        })}
        {markers.map((m) => (
          <span key={m.id} className={`bar-marker type-bg-${m.type}`} style={{ left: `${(m.t / dur) * 100}%` }} title={`${FINDING_TYPES[m.type].label}: ${m.title}`} />
        ))}
        <span className="bar-knob" style={{ left: `${(time / dur) * 100}%` }} />
      </div>
      <span className="caption-mini" title={current ? plainText(current.text) : ''}>
        <Subtitles size={14} /> 자막
      </span>
      {hasAudio && <span className="caption-mini" title="시연용 TTS 음성 재생 중"><Volume2 size={14} /> 음성</span>}
      <select value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="재생 속도">
        {[0.75, 1, 1.25, 1.5, 2, 4].map((r) => (
          <option key={r} value={r}>
            {r}x
          </option>
        ))}
      </select>
    </div>
  );
}

function ScriptPanel({ lecture, current, isAnalyzed }) {
  const { seek, playing } = usePlayer();
  const [filter, setFilter] = useState('');
  const [follow, setFollow] = useState(true);
  const listRef = useRef(null);
  const findingBySeg = useMemo(() => {
    const m = {};
    if (!isAnalyzed) return m;
    lecture.findings.forEach((f) => f.evidence.forEach((sid) => (m[sid] = m[sid] || []).push(f)));
    return m;
  }, [lecture, isAnalyzed]);

  useEffect(() => {
    if (!follow || !current || filter) return;
    const el = listRef.current?.querySelector(`[data-seg="${current.id}"]`);
    if (el) el.scrollIntoView({ block: 'center', behavior: playing ? 'smooth' : 'auto' });
  }, [current?.id, follow, filter, playing]);

  const segs = filter
    ? lecture.transcript.filter((s) => ['spoken', 'ko', 'en'].some((m) => plainText(s.text, m).toLowerCase().includes(filter.toLowerCase())))
    : lecture.transcript;

  return (
    <div className="script-col panel">
      <div className="panel-head">
        <strong>스크립트 · 원본 전사문</strong>
        <span className="muted small">{lecture.transcript.length}개 구간</span>
      </div>
      <div className="script-tools">
        <ListFilter size={14} />
        <input placeholder="스크립트에서 찾기" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
          자동 스크롤
        </label>
      </div>
      <div className="script-list" ref={listRef}>
        {segs.length === 0 && <div className="muted small pad">일치 결과 없음</div>}
        {segs.map((s) => {
          const fs = findingBySeg[s.id] || [];
          return (
            <div key={s.id} data-seg={s.id} className={`seg ${current?.id === s.id ? 'on' : ''}`} onClick={() => seek(s.start)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && seek(s.start)}>
              <div className="seg-meta">
                <span className="mono seg-time">{fmtTime(s.start)}</span>
                <span className="seg-slide">S{s.slide}</span>
              </div>
              <div className="seg-body">
                <p>
                  <TermText text={s.text} highlight={filter} />
                </p>
                {fs.length > 0 && (
                  <div className="seg-badges">
                    {[...new Map(fs.map((f) => [f.type, f])).values()].map((f) => (
                      <TypeBadge key={f.id} type={f.type} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
