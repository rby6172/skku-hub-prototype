
import asyncio
import math
import re
import shutil
from pathlib import Path

import edge_tts
from pydub import AudioSegment


# ============================================================
# 1. 프로젝트 경로
# ============================================================

ROOT = Path(__file__).resolve().parent

LECTURE_DIR = ROOT / "src" / "data" / "lectures"
AUDIO_DIR = ROOT / "public" / "audio"


# ============================================================
# 2. 생성할 강의
# ============================================================

# Lecture 01, 02, 03 모두 생성
LECTURES = [
    "swe-01",
    "swe-02",
    "swe-03",
]


# ============================================================
# 3. TTS 설정
# ============================================================

# 한국어 여성 음성
VOICE = "ko-KR-SunHiNeural"

# 음성 속도
RATE = "-5%"

# 문장 사이 쉼 (밀리초)
PAUSE_MS = 350


# ============================================================
# 4. 영어 용어 발음 사전
# ============================================================

# 원본 스크립트는 변경하지 않고
# TTS에 전달하는 문장에만 적용합니다.

PRONUNCIATIONS = {
    # 애자일 (Lecture 03 슬라이드 9 정정 장면)
    "iteration": "이터레이션",

    # 소프트웨어 공학
    "Software Engineering": "소프트웨어 엔지니어링",
    "Software Development": "소프트웨어 디벨롭먼트",
    "Software Process Models": "소프트웨어 프로세스 모델즈",
    "Software Process": "소프트웨어 프로세스",
    "Software Architecture": "소프트웨어 아키텍처",

    # Lecture 01
    "Generic Product": "제네릭 프로덕트",
    "Customized Product": "커스터마이즈드 프로덕트",
    "Generic": "제네릭",
    "Customized": "커스터마이즈드",
    "Maintenance": "메인터넌스",
    "Validation": "밸리데이션",
    "Requirements": "리콰이어먼츠",
    "Requirement": "리콰이어먼트",
    "Stakeholder": "스테이크홀더",

    # Lecture 02
    "Waterfall Model": "워터폴 모델",
    "Waterfall": "워터폴",
    "Plan-driven": "플랜 드리븐",
    "Incremental Development": "인크리멘털 디벨롭먼트",
    "Incremental": "인크리멘털",
    "Increment": "인크리먼트",
    "Refactoring": "리팩터링",
    "Prototyping": "프로토타이핑",
    "Prototype": "프로토타입",
    "Agile Development": "애자일 디벨롭먼트",
    "Agile": "애자일",

    # 개발 및 테스트
    "Scrum": "스크럼",
    "Sprint": "스프린트",
    "DevOps": "데브옵스",
    "Implementation": "임플리멘테이션",
    "Testing": "테스팅",
    "Debugging": "디버깅",
    "Deployment": "디플로이먼트",
    "Integration": "인티그레이션",
    "Verification": "베리피케이션",

    # 기타 기술 용어
    "Framework": "프레임워크",
    "Interface": "인터페이스",
    "Component": "컴포넌트",
    "Module": "모듈",
    "Database": "데이터베이스",
    "Algorithm": "알고리즘",
    "Architecture": "아키텍처",
    "Prototype": "프로토타입",

    # 약어
    "SDLC": "에스 디 엘 씨",
    "UML": "유 엠 엘",
    "API": "에이 피 아이",
    "SRS": "에스 알 에스",
    "UI": "유 아이",
    "UX": "유 엑스",
    "CI": "씨 아이",
    "CD": "씨 디",
    "QA": "큐 에이",
    "AI": "에이 아이",
    "HW2": "에이치 더블유 투",
    "iCampus": "아이캠퍼스",
}


# ============================================================
# 5. 정규표현식
# ============================================================

# {{concept|발화 내용}} 처리
TERM_PATTERN = re.compile(
    r"\{\{[^|{}]+\|([^{}]+)\}\}"
)

# transcript 배열 추출
TRANSCRIPT_PATTERN = re.compile(
    r"(transcript\s*:\s*\[)(.*?)(\n\s*\],)",
    re.DOTALL,
)

# 각 transcript 구간 추출
SEGMENT_PATTERN = re.compile(
    r"\{\s*id:\s*'([^']+)'\s*,"
    r"\s*start:\s*[\d.]+\s*,"
    r"\s*slide:\s*(\d+)\s*,"
    r"\s*text:\s*'((?:\\.|[^'\\])*)'\s*\}",
    re.DOTALL,
)


# ============================================================
# 6. 텍스트 정리
# ============================================================

def clean_text(text):
    """
    개념 태그를 실제 발화 텍스트로 변환합니다.
    """

    text = TERM_PATTERN.sub(r"\1", text)

    text = text.replace("\\'", "'")
    text = text.replace("\\n", " ")
    text = text.replace("\\t", " ")

    return text.strip()


# ============================================================
# 7. 영어 발음 변환
# ============================================================

def convert_pronunciation(text):
    """
    영어 용어를 TTS용 한글 발음으로 변환합니다.
    원본 JS의 transcript는 변경하지 않습니다.
    """

    # 긴 표현을 우선 처리
    sorted_terms = sorted(
        PRONUNCIATIONS.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    )

    # 한 번 치환된 문자열을 다시 치환하지 않도록
    # 원본 텍스트에서 일치하는 부분을 한 번에 찾습니다.
    alternatives = []

    for english, _ in sorted_terms:
        alternatives.append(re.escape(english))

    pattern = re.compile(
        r"(?<![A-Za-z])(?:"
        + "|".join(alternatives)
        + r")(?![A-Za-z])",
        re.IGNORECASE,
    )

    pronunciation_lookup = {
        english.lower(): korean
        for english, korean in PRONUNCIATIONS.items()
    }

    def replace_match(match):
        return pronunciation_lookup.get(
            match.group(0).lower(),
            match.group(0),
        )

    return pattern.sub(replace_match, text)


# ============================================================
# 8. 강의 스크립트 추출
# ============================================================

def load_segments(source):
    """
    transcript 배열에서
    ID, 슬라이드 번호, 원본 문장을 추출합니다.
    """

    match = TRANSCRIPT_PATTERN.search(source)

    if not match:
        raise ValueError(
            "transcript 배열을 찾지 못했습니다."
        )

    body = match.group(2)

    matches = list(
        SEGMENT_PATTERN.finditer(body)
    )

    if not matches:
        raise ValueError(
            "스크립트 구간을 찾지 못했습니다."
        )

    segments = []

    for item in matches:

        original_text = clean_text(
            item.group(3)
        )

        tts_text = convert_pronunciation(
            original_text
        )

        segments.append({
            "id": item.group(1),
            "slide": int(item.group(2)),
            "text": original_text,
            "tts_text": tts_text,
        })

    return segments


# ============================================================
# 9. 문장별 음성 생성
# ============================================================

async def generate_segment(
    segment,
    index,
    segment_dir,
):
    """
    TTS용 문장으로 MP3를 생성합니다.
    """

    output = (
        segment_dir
        / f"{index:02d}_{segment['id']}.mp3"
    )

    communicator = edge_tts.Communicate(
        text=segment["tts_text"],
        voice=VOICE,
        rate=RATE,
    )

    await communicator.save(str(output))

    return output


# ============================================================
# 10. 강의 데이터 수정
# ============================================================

def update_lecture_data(
    source,
    timestamps,
    duration,
):
    """
    transcript의 start 값과
    강의 전체 duration만 수정합니다.
    """

    def replace_transcript(match):

        body = match.group(2)

        def replace_segment(seg_match):

            segment_id = seg_match.group(1)

            if segment_id not in timestamps:
                return seg_match.group(0)

            new_start = timestamps[segment_id]

            return re.sub(
                r"(start:\s*)[\d.]+",
                lambda m: (
                    m.group(1)
                    + str(new_start)
                ),
                seg_match.group(0),
                count=1,
            )

        updated_body = SEGMENT_PATTERN.sub(
            replace_segment,
            body,
        )

        return (
            match.group(1)
            + updated_body
            + match.group(3)
        )

    updated, transcript_count = TRANSCRIPT_PATTERN.subn(
        replace_transcript,
        source,
        count=1,
    )

    if transcript_count != 1:
        raise ValueError(
            "transcript 배열 수정에 실패했습니다."
        )

    # 강의 전체 duration만 수정
    updated, duration_count = re.subn(
        r"(\bduration:\s*)[\d.]+",
        lambda m: (
            m.group(1)
            + str(duration)
        ),
        updated,
        count=1,
    )

    if duration_count != 1:
        raise ValueError(
            "강의 duration 수정에 실패했습니다."
        )

    return updated


# ============================================================
# 11. 강의 하나 처리
# ============================================================

async def process_lecture(lecture_id):

    source_file = (
        LECTURE_DIR
        / f"{lecture_id}.js"
    )

    segment_dir = (
        AUDIO_DIR
        / f"{lecture_id}-segments"
    )

    output_file = (
        AUDIO_DIR
        / f"{lecture_id}.mp3"
    )

    if not source_file.exists():
        raise FileNotFoundError(
            f"강의 데이터 파일이 없습니다: {source_file}"
        )

    source = source_file.read_text(
        encoding="utf-8"
    )

    segments = load_segments(source)

    print("\n" + "=" * 50)
    print(f"강의: {lecture_id}")
    print(f"스크립트: {len(segments)}개")
    print(f"음성: {VOICE}")
    print("=" * 50)

    AUDIO_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    segment_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # 1. 문장별 TTS 생성
    # --------------------------------------------------------

    audio_files = []

    for index, segment in enumerate(
        segments,
        start=1,
    ):

        print(
            f"[{index}/{len(segments)}] "
            f"{segment['id']} 생성 중..."
        )

        if segment["text"] != segment["tts_text"]:

            print(
                f"  원본: {segment['text']}"
            )

            print(
                f"  발음: {segment['tts_text']}"
            )

        path = await generate_segment(
            segment,
            index,
            segment_dir,
        )

        audio_files.append(path)

    # --------------------------------------------------------
    # 2. 음성 병합 및 타임스탬프 계산
    # --------------------------------------------------------

    combined = AudioSegment.empty()

    timestamps = {}

    for segment, path in zip(
        segments,
        audio_files,
    ):

        audio = AudioSegment.from_mp3(path)

        # 현재까지 누적된 오디오 길이
        start = len(combined) / 1000.0

        timestamps[segment["id"]] = round(
            start,
            3,
        )

        combined += audio

        # 문장 사이 쉼
        combined += AudioSegment.silent(
            duration=PAUSE_MS
        )

    # --------------------------------------------------------
    # 3. 최종 MP3 생성
    # --------------------------------------------------------

    combined.export(
        output_file,
        format="mp3",
        bitrate="192k",
    )

    duration = math.ceil(
        len(combined) / 1000.0
    )

    # --------------------------------------------------------
    # 4. 강의 데이터 수정
    # --------------------------------------------------------

    updated = update_lecture_data(
        source,
        timestamps,
        duration,
    )

    # --------------------------------------------------------
    # 5. 기존 데이터 백업
    # --------------------------------------------------------

    backup = source_file.with_suffix(
        ".js.bak"
    )

    # 기존 백업이 있으면 덮어쓰지 않습니다.
    if not backup.exists():

        shutil.copy2(
            source_file,
            backup,
        )

        print(f"백업 생성: {backup}")

    else:

        print(f"기존 백업 유지: {backup}")

    # --------------------------------------------------------
    # 6. 수정된 JS 저장
    # --------------------------------------------------------

    source_file.write_text(
        updated,
        encoding="utf-8",
    )

    # --------------------------------------------------------
    # 7. 결과 출력
    # --------------------------------------------------------

    print("\n---------- 생성 완료 ----------")

    print(f"강의: {lecture_id}")
    print(f"음성 파일: {output_file}")
    print(f"강의 길이: {duration}초")
    print(f"수정된 데이터: {source_file}")

    print("\n타임스탬프:")

    for segment in segments:

        segment_id = segment["id"]

        print(
            f"{segment_id}: "
            f"{timestamps[segment_id]:.3f}초"
        )


# ============================================================
# 12. 전체 강의 실행
# ============================================================

async def main():

    print("================================")
    print("SKKU Hub TTS 생성 시작")
    print("================================")

    print(
        f"생성 대상: {', '.join(LECTURES)}"
    )

    print(f"사용 음성: {VOICE}")

    for lecture_id in LECTURES:

        await process_lecture(lecture_id)

    print("\n================================")
    print("모든 강의 TTS 생성 완료")
    print("================================")


if __name__ == "__main__":
    asyncio.run(main())
