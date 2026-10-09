<h1 align="center">
  <img src="../../assets/app-icon.png" alt="Thoughtline app icon" width="96" height="96" valign="middle" /> 晾念头 · Thoughtline
</h1>

<p align="center">
  <a href="https://github.com/NocodeMrLi/thoughtline/stargazers"><img src="badges/stars.svg" alt="GitHub stars: 0" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases"><img src="badges/downloads.svg" alt="Release asset downloads: 3" /></a>
  <a href="#license"><img src="badges/license.svg" alt="License: UNLICENSED" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2"><img src="badges/preview.svg" alt="Preview: 0.0.17-preview.2" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/issues"><img src="badges/feedback.svg" alt="Feedback on GitHub" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2"><img src="badges/platforms.svg" alt="Platforms: macOS and Windows" /></a>
</p>

<p align="center">
  <sub><a href="../../README.md">中文</a> · <a href="../../docs/readme/README.en.md">English</a> · <a href="../../docs/readme/README.ja.md">日本語</a> · <a href="../../docs/readme/README.ko.md">한국어</a> · <a href="../../docs/readme/README.es.md">Español</a> · <a href="../../docs/readme/README.fr.md">Français</a> · <a href="../../docs/readme/README.pt.md">Português</a></sub>
</p>

<p align="center">
  <strong>생각을 걸어 두고, 영감을 가까이.</strong><br />
  줄 하나와 집게, 종이로 일상의 아이디어를 남깁니다.
</p>

<h2 align="center"><a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2"><ins>Thoughtline 다운로드</ins></a></h2>

<p align="center"><sub>macOS Apple Silicon · Windows x64 · 0.0.17-preview.2</sub></p>

Thoughtline은 macOS와 Windows용 가벼운 데스크톱 메모 도구입니다. 화면 위쪽 가장자리에서 생각을 꺼내 보고, 기록한 뒤 하던 일로 돌아가세요.

## 기능

- 단축키로 제목, 본문, 분류를 기록하고 미완성 메모를 초안으로 저장합니다.
- 데스크톱에는 줄, 집게, 종이만 표시합니다. 새 메모의 기본 분류는 일반입니다.
- 집게 전체를 옮기거나 종이 한 장을 분리하고, 호환 집게를 합칩니다. 정리는 실행 취소할 수 있습니다.
- 상세 보기와 달력에서 직접 편집합니다. 잠시 입력을 멈추면 자동 저장하고 페이지를 즉시 전환합니다.
- 일·월·년으로 돌아보고 검색과 상태 필터로 보관한 메모도 찾습니다.
- 삭제한 메모를 최근 삭제에서 복원합니다. 프로젝트 삭제는 메모 내용을 유지합니다.
- 본문을 복사하거나 일반 텍스트로 드래그합니다. 원본을 유지하고 자동 전송하지 않습니다.
- 데이터를 로컬에 저장하고 실제 폴더 확인, 이동, 독립 백업 내보내기를 지원합니다.

<p align="center"><img src="images/thought-calendar.png" alt="합성 시연 데이터를 사용한 생각 달력." width="740" /><br /><sub>합성 시연 데이터를 사용한 생각 달력.</sub></p>

## 다운로드 및 설치

현재 미리보기 버전입니다. 저장소 접근 권한이 있는 구성원에게 제공됩니다. Releases에서 패키지, 격리 실행 스크립트, SHA256SUMS와 빌드 정보를 확인하세요. [Releases](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2).

| Platform | Package |
|---|---|
| macOS · Apple Silicon | arm64 · DMG |
| Windows | x64 · EXE (NSIS) |

업데이트 전에 정상 종료하고 데이터를 백업하세요. Mac은 ad-hoc 서명이며 Developer ID 서명이나 공증이 없고, Windows는 서명되지 않았습니다. 시스템 보안 보호를 끄지 마세요. 자동 업데이트는 없습니다.

## 시작하기

1. Control + Alt + N(Mac: ⌃ + ⌥ + N)으로 새 메모를 엽니다. 설정에서 변경할 수 있습니다.
2. Enter는 줄바꿈입니다. Mac은 ⌘ + Enter, Windows는 Ctrl + Enter로 제출합니다. Esc는 초안을 저장하고 닫습니다.
3. 포인터를 화면 위쪽 가장자리로 옮겨 줄을 표시하고 종이를 열어 읽기, 복사, 편집, 보관합니다.
4. 달력에서 보관한 메모를 찾거나 최근 삭제에서 복원합니다.

Codex, Claude, Cursor는 분류 라벨입니다. 다른 앱에는 직접 복사하거나 본문을 드래그하세요. 실제 입력칸의 수신 동작은 검증 중입니다.

## 데이터와 백업

달력 설정은 실제 데이터 폴더를 표시합니다. 이동은 복사와 검증 후 경로를 전환하며 원본을 남깁니다. 백업 내보내기는 현재 위치를 변경하지 않습니다. [Data / 备份说明](../ROUND1-DATA-SAFETY.md).

현재 형식은 schema3이며 0.0.16-preview.6은 직접 읽을 수 없습니다. 새 데이터를 보존하고 업그레이드 전 백업을 별도 폴더에서 검증한 뒤 다운그레이드하세요. 그 백업에는 이후 변경이 없습니다.

## 개발

Node.js 24.19.0 이상의 24.x를 사용합니다. verify는 타입 검사, 단위 테스트와 빌드를 수행합니다. 플랫폼 패키지는 해당 OS에서 빌드하세요. Electron, React, TypeScript, Vite를 사용합니다.

```bash
npm ci
npm run dev
```

```bash
npm run verify
npm run package:mac
npm run package:win
```

적용 가능한 자동 검사와 패키지 검증은 통과했습니다. 실제 Mac/Windows 입력기, DPI, 다중 화면, 포커스와 WeChat·Doubao·WorkBuddy 입력칸은 독립 테스트가 필요합니다. 언어 링크는 README 번역이며 앱 UI는 현재 중국어입니다.

## 피드백

버그와 제안은 Issues에 등록하세요. 버전, 재현 단계, 예상 결과와 실제 결과, 개인정보를 가린 증거를 첨부하세요. 실제 메모나 개인 데이터를 올리지 마세요. [Issues](https://github.com/NocodeMrLi/thoughtline/issues).

Star와 다운로드 수는 2026-10-09 API 스냅샷입니다. 다운로드는 릴리스 파일의 다운로드 횟수입니다.

<a id="license"></a>
## 라이선스와 감사

현재 프로젝트는 UNLICENSED이며 오픈소스 사용 권한을 부여하지 않았습니다. 향후 공개 시 라이선스와 기여 방식을 정합니다. 포함된 코드의 라이선스는 제3자 고지를 참고하세요. [Third-party notices](../../THIRD_PARTY_NOTICES.md).
