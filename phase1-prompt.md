# rulegen v0.2.0 — Phase 1: 에이전트 확장 + import 기능

## 프로젝트 컨텍스트
- npm 패키지: rulegen (v0.1.0 published)
- GitHub: https://github.com/jhoonseo/rulegen
- 경쟁자: rulesync (v7.8, 161K weekly downloads, 21+ agents)
- 목표: rulesync 기능의 80%를 커버하면서 더 나은 DX 제공

## 현재 프로젝트 구조
```
src/
├── index.ts                    # CLI entry point (commander)
├── types/
│   ├── config.ts               # Zod schema for rulegen.config.json
│   └── scanner.ts              # Scanner types
├── scanners/
│   ├── project-scanner.ts      # Language, framework detection
│   ├── deps-scanner.ts         # package.json, requirements.txt
│   ├── git-scanner.ts          # Git conventions
│   └── index.ts                # Scanner orchestrator
├── generators/
│   ├── base-generator.ts       # Abstract base (156 lines)
│   ├── claude-generator.ts     # CLAUDE.md
│   ├── cursor-generator.ts     # .cursorrules
│   ├── copilot-generator.ts    # .github/copilot-instructions.md
│   ├── windsurf-generator.ts   # .windsurfrules
│   ├── aider-generator.ts      # .aider.conf.yml + CONVENTIONS.md
│   ├── codex-generator.ts      # codex.md
│   └── index.ts                # Generator registry
├── commands/
│   ├── init.ts                 # Interactive setup
│   ├── generate.ts             # Generate agent files
│   ├── sync.ts                 # Watch mode
│   └── doctor.ts               # Health check
└── utils/
    ├── logger.ts
    ├── file.ts
    ├── prompt.ts
    └── errors.ts
tests/
├── generators/generators.test.ts
├── scanners/
│   ├── deps-scanner.test.ts
│   ├── index.test.ts
│   └── project-scanner.test.ts
└── types/config.test.ts
```

## 작업 1: 에이전트 10개 추가

기존 6개 (claude, cursor, copilot, windsurf, aider, codex)에 아래 10개 추가.
각 에이전트의 config file 경로와 포맷을 정확히 지켜야 함:

| # | Agent | Config File(s) | Format |
|---|-------|---------------|--------|
| 1 | Gemini CLI | `GEMINI.md` | Markdown |
| 2 | Cline | `.clinerules/project.md` | Markdown |
| 3 | OpenCode | `.opencode/rules.md` | Markdown |
| 4 | Roo Code | `.roo/rules.md` | Markdown |
| 5 | Junie | `.junie/guidelines.md` | Markdown |
| 6 | Continue.dev | `.continue/rules.md` | Markdown |
| 7 | Sourcegraph Cody | `.vscode/cody.json` | JSON (instructions field) |
| 8 | AGENTS.md | `AGENTS.md` | Markdown (OpenAI multi-agent format) |
| 9 | Goose | `.goose/config.yaml` | YAML (instructions field) |
| 10 | Amp | `.amp/rules.md` | Markdown |

각 generator는 `src/generators/base-generator.ts`를 상속하고, 해당 에이전트에 최적화된 포맷으로 출력해야 함.
Cody는 JSON, Goose는 YAML이므로 포맷 주의.

### 구현 파일:
```
src/generators/gemini-generator.ts
src/generators/cline-generator.ts
src/generators/opencode-generator.ts
src/generators/roocode-generator.ts
src/generators/junie-generator.ts
src/generators/continue-generator.ts
src/generators/cody-generator.ts
src/generators/agents-generator.ts
src/generators/goose-generator.ts
src/generators/amp-generator.ts
```

`src/generators/index.ts` 업데이트: 모든 16개 generator 등록.
`src/types/config.ts`의 targets 배열에 새 에이전트 이름 추가.

## 작업 2: import 기능

기존 에이전트 config 파일을 읽어서 rulegen.config.json으로 역변환하는 기능.

### 명령어:
```bash
rulegen import                          # 자동 감지 (모든 에이전트 파일 스캔)
rulegen import --from claude            # 특정 에이전트에서 import
rulegen import --from cursor,copilot    # 복수 지정
```

### 동작:
1. 프로젝트 디렉토리에서 알려진 에이전트 config 파일 탐색
2. 파일 내용을 파싱해서 project, rules, instructions 추출
3. rulegen.config.json 생성 (기존 파일 있으면 merge 여부 확인)

### 구현 파일:
```
src/commands/import.ts           # import 명령어
src/importers/base-importer.ts   # 추상 base
src/importers/claude-importer.ts # CLAUDE.md → config
src/importers/cursor-importer.ts # .cursorrules → config
src/importers/index.ts           # 전체 importer registry + auto-detect
```

모든 16개 에이전트에 대한 importer를 만들 필요는 없음. 주요 5개(claude, cursor, copilot, windsurf, cline)만 구현.
나머지는 base-importer의 generic markdown parser로 처리.

## 작업 3: CLI UX 개선

### 원커맨드 모드:
```bash
npx rulegen                # 인자 없이 실행하면: init → generate 한번에
```

`src/index.ts`에서 인자 없는 경우 default action 추가:
- rulegen.config.json 없으면 → init 실행
- rulegen.config.json 있으면 → generate 실행

### --output 옵션:
```bash
rulegen generate --output .rulesync/   # rulesync 호환 포맷으로 출력
```

## 작업 4: 테스트

- 새 generator 10개에 대한 테스트 추가 (tests/generators/)
- import 기능 테스트 (tests/importers/)
- 원커맨드 모드 테스트
- 기존 53개 테스트 깨지지 않아야 함
- 최종 목표: 80+ 테스트, 전부 통과

## 작업 5: README 업데이트

README.md의 Supported Agents 테이블을 16개로 업데이트.
import 기능과 원커맨드 사용법 추가.
rulesync와의 차별점 섹션 추가:
- "Zero-config setup: `npx rulegen` one command does everything"
- "Coming soon: AI-powered rule generation"

## 작업 6: 빌드 & QA

1. `npm run build` 통과
2. `npm run typecheck` 통과
3. `npm run test` 통과 (80+ tests)
4. `npm run lint` 통과
5. dogfooding: `npx tsx src/index.ts init --yes && npx tsx src/index.ts generate --force && npx tsx src/index.ts doctor`
6. doctor가 16개 에이전트 파일 전부 체크

## 작업 7: 버전 & 커밋

1. package.json version을 "0.2.0"으로 변경
2. 작업별로 conventional commit:
   - `feat: add 10 new agent generators (gemini, cline, opencode, roocode, junie, continue, cody, agents, goose, amp)`
   - `feat: implement import command for reverse config generation`
   - `feat: add zero-arg default mode and --output option`
   - `docs: update README with 16 agents and import feature`
   - `chore: bump version to 0.2.0`
3. `git push`

## 제약 사항
- TypeScript strict mode 유지
- ESM + CJS dual output (tsup)
- Zod schema validation 유지
- base-generator 패턴 따르기
- 외부 의존성 최소화 (yaml 파싱은 js-yaml 추가 허용)
- 각 에이전트의 공식 문서에 맞는 파일 경로/포맷 사용

## 성공 기준
- `npm run build && npm run typecheck && npm run test && npm run lint` 전부 통과
- `rulegen init --yes && rulegen generate --force` 실행 시 16개 에이전트 파일 생성
- `rulegen import` 실행 시 기존 config 파일에서 rulegen.config.json 생성
- `rulegen doctor` 모든 체크 통과
- 테스트 80개 이상
