# ギターコード学習サイト Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** コードダイアグラムと各弦の音名を学べる学習画面と、「形 → 名前」4択クイズを持つ、フロントエンド完結のギターコード学習サイトを作る。

**Architecture:** Vite + React + TypeScript の SPA。ロジック（音名計算・出題・記録・ルート解析）はすべて `src/lib/` の純粋関数にまとめて Vitest でテストする。UI は `src/pages/` と `src/components/` に置き、ルーティングはハッシュ（`#/level/1/quiz`）を自前でパースする。

**Tech Stack:** Vite, React, TypeScript, Vitest（すべて実行時点の最新版）

**Spec:** `docs/superpowers/specs/2026-10-11-guitar-chord-learning-design.md`

## Global Constraints

- 音名は英語表記（C D E）。12音は ♯ 表記（`C, C#, D, D#, E, F, F#, G, G#, A, A#, B`）。表示名は B♭ のみ ♭
- 弦の並びは常に 6弦→1弦（配列 index 0 = 6弦）。開放弦は E A D G B E
- クイズは1回10問、4択。クリア条件は最高正答率 80% 以上
- localStorage キーは `code-master:progress`
- ダイアグラムはライブラリを使わず SVG で自前描画する
- サーバー・外部 API は使わない。デプロイ設定は作らない
- **コミットはユーザーが `/commit` で行う。各タスクではコミットしない**（ユーザーのグローバル設定）
- spec のディレクトリ構成に加えて、次のファイルを追加する: `src/model.ts`（型と定数）、`src/lib/route.ts`（ルート解析）、`src/router.ts`（hash の購読と遷移）、`src/components/ChordCard.tsx`（コード名＋ダイアグラム＋構成音のカード）

## Review Focus

1. **コード数が10未満のレベル（Lv3 = 5コード）** → 出題数は10問のままで、全コードが少なくとも1回出る（Task 4 でテスト）
2. **localStorage が壊れた値・使えない・例外を投げる** → 記録なしとして動き、画面が落ちない（Task 5 でテスト）
3. **不正な URL を直接開く**（`#/level/9/quiz`, `#/level/abc/study`, `#/foo`）→ ホームに戻る。結果がない状態で `#/level/1/result` を開く → クイズに戻る（Task 6 でテスト、Task 8 で実装）
4. **クイズ中に URL のレベルだけ変わる**（`#/level/1/quiz` → `#/level/2/quiz`）→ 新しいレベルの問題に作り直される（Task 8 で `key` を付けて対応し、手動で確認）
5. **同じ問題で回答ボタンを連打する** → 1回目の回答だけが数えられる（Task 8 で実装し、手動で確認）

---

### Task 1: プロジェクトの雛形

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Interfaces:**
- Consumes: なし
- Produces: `npm run dev` / `npm run build` / `npm test` が使える状態

- [ ] **Step 1: package.json を作る**

```json
{
  "name": "code-master",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: 依存をインストールする**

Run:
```bash
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest
```
Expected: `node_modules/` と `package-lock.json` ができる

- [ ] **Step 3: 設定ファイルを作る**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
  },
});
```

`.gitignore`:
```
node_modules
dist
.DS_Store
```

`index.html`:
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ギターコード練習</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: エントリポイントと仮の App を作る**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`（Task 7 で置き換える）:
```tsx
export default function App() {
  return <main className="page"><h1>ギターコード練習</h1></main>;
}
```

`src/index.css`:
```css
:root {
  --bg: #faf8f5;
  --surface: #ffffff;
  --text: #2b2b2b;
  --muted: #6b6b6b;
  --accent: #c0612b;
  --accent-text: #ffffff;
  --line: #d9d4cc;
  --correct: #2f8f5b;
  --wrong: #c43d3d;
  font-family: system-ui, -apple-system, "Hiragino Sans", sans-serif;
  color: var(--text);
  background: var(--bg);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1c1b1a;
    --surface: #262422;
    --text: #ece8e2;
    --muted: #a39d94;
    --accent: #e38550;
    --accent-text: #1c1b1a;
    --line: #4a4641;
    --correct: #5cc28a;
    --wrong: #ef6b6b;
  }
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); }
.page { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 1.6rem; margin: 0 0 8px; }
h2 { font-size: 1.15rem; margin: 0 0 8px; }
p { margin: 4px 0; }
a { color: var(--accent); }
.muted { color: var(--muted); }
.back { display: inline-block; margin-bottom: 16px; }

.button {
  display: inline-block;
  padding: 10px 18px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  background: var(--accent);
  color: var(--accent-text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}
.button.secondary { background: transparent; color: var(--accent); }
.button:disabled { opacity: 0.5; cursor: default; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

.level-grid, .chord-grid {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}
.level-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.chord-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
.level-card, .chord-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
}
.chord-card { text-align: center; }
.badge {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--correct);
  color: var(--bg);
  font-size: 0.8rem;
}

.chord-diagram { width: 100%; max-width: 180px; height: auto; display: block; margin: 0 auto; }
.chord-diagram .fret, .chord-diagram .string { stroke: var(--muted); stroke-width: 1; }
.chord-diagram .nut { stroke: var(--text); stroke-width: 4; }
.chord-diagram .dot, .chord-diagram .barre { fill: var(--text); }
.chord-diagram .finger { fill: var(--bg); font-size: 11px; font-weight: bold; }
.chord-diagram .marker, .chord-diagram .base-fret { fill: var(--muted); font-size: 12px; }
.chord-diagram .note { fill: var(--accent); font-size: 12px; font-weight: bold; }

.quiz { max-width: 480px; margin: 0 auto; text-align: center; }
.choices { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
.choice {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}
.choice.correct { border-color: var(--correct); background: var(--correct); color: var(--bg); }
.choice.wrong { border-color: var(--wrong); background: var(--wrong); color: var(--bg); }
.feedback { margin-top: 16px; font-weight: bold; }
.feedback.correct { color: var(--correct); }
.feedback.wrong { color: var(--wrong); }
.score { font-size: 2.4rem; font-weight: bold; margin: 8px 0; }
```

- [ ] **Step 5: ビルドが通ることを確認する**

Run: `npm run build`
Expected: エラーなしで `dist/` ができる

---

### Task 2: 型定義と音名の計算

**Files:**
- Create: `src/model.ts`, `src/lib/notes.ts`
- Test: `src/lib/notes.test.ts`

**Interfaces:**
- Consumes: なし
- Produces:
  - `src/model.ts`: `NOTES`, `type Note`, `LEVELS`, `type Level`, `isLevel(n: number): n is Level`, `type Chord`
  - `src/lib/notes.ts`: `stringNotes(chord: Chord): (Note | null)[]`, `rootNote(chord: Chord): Note`, `chordTones(chord: Chord): Note[]`

- [ ] **Step 1: model.ts を作る**

```ts
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type Note = (typeof NOTES)[number];

export const LEVELS = [1, 2, 3, 4, 5] as const;
export type Level = (typeof LEVELS)[number];

export function isLevel(n: number): n is Level {
  return (LEVELS as readonly number[]).includes(n);
}

export type Chord = {
  /** 一意キー。例: "C", "Am", "F#m7", "Bb" */
  id: string;
  /** 表示名。例: "B♭" */
  name: string;
  level: Level;
  /** 6弦→1弦の順、長さ6。null=ミュート, 0=開放 */
  frets: (number | null)[];
  /** 指番号（1〜4）。6弦→1弦の順 */
  fingers?: (number | null)[];
  /** 弦番号は 6〜1。fromString が低音側 */
  barre?: { fret: number; fromString: number; toString: number };
  /** ダイアグラムの表示開始フレット。省略時は 1 */
  baseFret?: number;
};
```

- [ ] **Step 2: 失敗するテストを書く**

`src/lib/notes.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Chord } from '../model';
import { chordTones, rootNote, stringNotes } from './notes';

const chord = (id: string, frets: (number | null)[]): Chord => ({ id, name: id, level: 1, frets });

describe('stringNotes', () => {
  it('C の押さえ方から各弦の音を求める', () => {
    expect(stringNotes(chord('C', [null, 3, 2, 0, 1, 0]))).toEqual([null, 'C', 'E', 'G', 'C', 'E']);
  });

  it('12フレットを超えても1周して求める', () => {
    expect(stringNotes(chord('X', [12, 13, null, null, null, null]))).toEqual(['E', 'A#', null, null, null, null]);
  });
});

describe('rootNote', () => {
  it('一番低い鳴っている弦の音をルートにする', () => {
    expect(rootNote(chord('D', [null, null, 0, 2, 3, 2]))).toBe('D');
  });

  it('鳴っている弦がなければ例外を投げる', () => {
    expect(() => rootNote(chord('X', [null, null, null, null, null, null]))).toThrow();
  });
});

describe('chordTones', () => {
  it('重複を除き、ルートからの音程順に並べる', () => {
    expect(chordTones(chord('C', [null, 3, 2, 0, 1, 0]))).toEqual(['C', 'E', 'G']);
  });

  it('ルートより低い音名でも音程順に並ぶ', () => {
    // A7: A E G C# E → A C# E G
    expect(chordTones(chord('A7', [null, 0, 2, 0, 2, 0]))).toEqual(['A', 'C#', 'E', 'G']);
  });
});
```

- [ ] **Step 3: テストが失敗することを確認する**

Run: `npx vitest run src/lib/notes.test.ts`
Expected: FAIL（`./notes` が見つからない）

- [ ] **Step 4: notes.ts を実装する**

```ts
import { NOTES, type Chord, type Note } from '../model';

const OPEN_STRINGS: readonly Note[] = ['E', 'A', 'D', 'G', 'B', 'E'];

function noteAt(openNote: Note, fret: number): Note {
  return NOTES[(NOTES.indexOf(openNote) + fret) % 12];
}

function intervalFrom(root: Note, note: Note): number {
  return (NOTES.indexOf(note) - NOTES.indexOf(root) + 12) % 12;
}

export function stringNotes(chord: Chord): (Note | null)[] {
  return chord.frets.map((fret, i) => (fret === null ? null : noteAt(OPEN_STRINGS[i], fret)));
}

export function rootNote(chord: Chord): Note {
  const root = stringNotes(chord).find((note): note is Note => note !== null);
  if (!root) throw new Error(`${chord.id} に鳴っている弦がありません`);
  return root;
}

export function chordTones(chord: Chord): Note[] {
  const root = rootNote(chord);
  const unique = [...new Set(stringNotes(chord).filter((note): note is Note => note !== null))];
  return unique.sort((a, b) => intervalFrom(root, a) - intervalFrom(root, b));
}
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx vitest run src/lib/notes.test.ts`
Expected: PASS（6 tests）

---

### Task 3: コードデータと整合性テスト

**Files:**
- Create: `src/data/chords.ts`
- Test: `src/data/chords.test.ts`

**Interfaces:**
- Consumes: `type Chord`, `type Level`, `LEVELS`, `NOTES`（model.ts）、`chordTones`, `rootNote`（notes.ts）
- Produces: `CHORDS: Chord[]`, `LEVEL_INFO: Record<Level, { title: string; description: string }>`, `chordsOfLevel(level: Level): Chord[]`

- [ ] **Step 1: 失敗するテストを書く**

`src/data/chords.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { LEVELS, NOTES, type Level, type Note } from '../model';
import { chordTones, rootNote } from '../lib/notes';
import { CHORDS, LEVEL_INFO, chordsOfLevel } from './chords';

const QUALITY_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  add9: [0, 4, 7, 2],
  '6': [0, 4, 7, 9],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  m7b5: [0, 3, 6, 10],
  '9': [0, 4, 7, 10, 2],
};

const PERFECT_FIFTH = 7;

/** id（例: "F#m7", "Bb"）から期待されるルートと構成音を求める。完全5度は省略可として分けて返す */
function expectedTones(id: string): { root: Note; required: Note[]; optional: Note[] } {
  const match = id.match(/^([A-G])(#|b)?(.*)$/);
  if (!match) throw new Error(`id を解釈できません: ${id}`);
  const [, letter, accidental, quality] = match;
  const intervals = QUALITY_INTERVALS[quality];
  if (!intervals) throw new Error(`未知のコードタイプ: ${quality}`);
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const rootIndex = (NOTES.indexOf(letter as Note) + offset + 12) % 12;
  const toNote = (interval: number) => NOTES[(rootIndex + interval) % 12];
  return {
    root: NOTES[rootIndex],
    required: intervals.filter((i) => i !== PERFECT_FIFTH).map(toNote),
    optional: intervals.filter((i) => i === PERFECT_FIFTH).map(toNote),
  };
}

const EXPECTED_IDS: Record<Level, string[]> = {
  1: ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm', 'B', 'F'],
  2: ['A7', 'D7', 'E7', 'G7', 'C7', 'B7', 'Am7', 'Em7', 'Dm7'],
  3: ['Bm', 'Bb', 'F#m', 'Cm', 'Gm'],
  4: ['Fmaj7', 'Cmaj7', 'Bm7', 'F#m7', 'Asus4', 'Dsus4', 'Esus4', 'Asus2', 'Dsus2'],
  5: ['Cadd9', 'C6', 'Bdim', 'Caug', 'Bm7b5', 'E9'],
};

describe('CHORDS', () => {
  it.each(LEVELS)('Lv%i に spec どおりのコードが入っている', (level) => {
    expect(chordsOfLevel(level).map((c) => c.id)).toEqual(EXPECTED_IDS[level]);
  });

  it('id が一意', () => {
    const ids = CHORDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('すべてのレベルに説明がある', () => {
    for (const level of LEVELS) expect(LEVEL_INFO[level].title).not.toBe('');
  });

  describe.each(CHORDS)('$id', (chord) => {
    const expected = expectedTones(chord.id);

    it('frets と fingers が6弦分ある', () => {
      expect(chord.frets).toHaveLength(6);
      if (chord.fingers) expect(chord.fingers).toHaveLength(6);
    });

    it('ルートが一番低い弦で鳴っている', () => {
      expect(rootNote(chord)).toBe(expected.root);
    });

    it('構成音がコード名と一致する（完全5度は省略可）', () => {
      const tones = chordTones(chord);
      for (const tone of tones) expect([...expected.required, ...expected.optional]).toContain(tone);
      for (const tone of expected.required) expect(tones).toContain(tone);
    });

    it('表示範囲（baseFret から5フレット）に収まっている', () => {
      const base = chord.baseFret ?? 1;
      for (const fret of chord.frets) {
        if (fret !== null && fret > 0) {
          expect(fret).toBeGreaterThanOrEqual(base);
          expect(fret).toBeLessThan(base + 5);
        }
      }
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/data/chords.test.ts`
Expected: FAIL（`./chords` が見つからない）

- [ ] **Step 3: chords.ts を実装する**

```ts
import type { Chord, Level } from '../model';

export const LEVEL_INFO: Record<Level, { title: string; description: string }> = {
  1: { title: '必須コード', description: 'まず最初に覚えたい基本のコード。F と B のバレーもここで挑戦します。' },
  2: { title: 'オープンの7th', description: '開放弦を使ったセブンスコード。ブルースやポップスでよく登場します。' },
  3: { title: 'バレーコード（基本）', description: '6弦・5弦ルートのバレーで、いろいろなキーのメジャー・マイナーを押さえます。' },
  4: { title: 'バレーの7th系・sus', description: 'maj7・m7 と sus2 / sus4。響きに色をつけるコードです。' },
  5: { title: 'テンション・応用', description: 'add9・6・dim・aug・m7♭5・9th。知っておくと表現の幅が広がります。' },
};

export const CHORDS: Chord[] = [
  // Lv1
  { id: 'C', name: 'C', level: 1, frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  { id: 'G', name: 'G', level: 1, frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  { id: 'D', name: 'D', level: 1, frets: [null, null, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  { id: 'A', name: 'A', level: 1, frets: [null, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  { id: 'E', name: 'E', level: 1, frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  { id: 'Am', name: 'Am', level: 1, frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  { id: 'Em', name: 'Em', level: 1, frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  { id: 'Dm', name: 'Dm', level: 1, frets: [null, null, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  {
    id: 'B', name: 'B', level: 1,
    frets: [null, 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1],
    barre: { fret: 2, fromString: 5, toString: 1 },
  },
  {
    id: 'F', name: 'F', level: 1,
    frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, fromString: 6, toString: 1 },
  },

  // Lv2
  { id: 'A7', name: 'A7', level: 2, frets: [null, 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  { id: 'D7', name: 'D7', level: 2, frets: [null, null, 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
  { id: 'E7', name: 'E7', level: 2, frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  { id: 'G7', name: 'G7', level: 2, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  { id: 'C7', name: 'C7', level: 2, frets: [null, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  { id: 'B7', name: 'B7', level: 2, frets: [null, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
  { id: 'Am7', name: 'Am7', level: 2, frets: [null, 0, 2, 0, 1, 0], fingers: [null, null, 2, null, 1, null] },
  { id: 'Em7', name: 'Em7', level: 2, frets: [0, 2, 0, 0, 0, 0], fingers: [null, 2, null, null, null, null] },
  { id: 'Dm7', name: 'Dm7', level: 2, frets: [null, null, 0, 2, 1, 1], fingers: [null, null, null, 2, 1, 1] },

  // Lv3
  {
    id: 'Bm', name: 'Bm', level: 3,
    frets: [null, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 5, toString: 1 },
  },
  {
    id: 'Bb', name: 'B♭', level: 3,
    frets: [null, 1, 3, 3, 3, 1], fingers: [null, 1, 2, 3, 4, 1],
    barre: { fret: 1, fromString: 5, toString: 1 },
  },
  {
    id: 'F#m', name: 'F#m', level: 3,
    frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1 },
  },
  {
    id: 'Cm', name: 'Cm', level: 3,
    frets: [null, 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 3, fromString: 5, toString: 1 },
  },
  {
    id: 'Gm', name: 'Gm', level: 3,
    frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 3, fromString: 6, toString: 1 },
  },

  // Lv4
  { id: 'Fmaj7', name: 'Fmaj7', level: 4, frets: [null, null, 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, null] },
  { id: 'Cmaj7', name: 'Cmaj7', level: 4, frets: [null, 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },
  {
    id: 'Bm7', name: 'Bm7', level: 4,
    frets: [null, 2, 4, 2, 3, 2], fingers: [null, 1, 3, 1, 2, 1],
    barre: { fret: 2, fromString: 5, toString: 1 },
  },
  {
    id: 'F#m7', name: 'F#m7', level: 4,
    frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1 },
  },
  { id: 'Asus4', name: 'Asus4', level: 4, frets: [null, 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 3, null] },
  { id: 'Dsus4', name: 'Dsus4', level: 4, frets: [null, null, 0, 2, 3, 3], fingers: [null, null, null, 1, 2, 3] },
  { id: 'Esus4', name: 'Esus4', level: 4, frets: [0, 2, 2, 2, 0, 0], fingers: [null, 2, 3, 4, null, null] },
  { id: 'Asus2', name: 'Asus2', level: 4, frets: [null, 0, 2, 2, 0, 0], fingers: [null, null, 1, 2, null, null] },
  { id: 'Dsus2', name: 'Dsus2', level: 4, frets: [null, null, 0, 2, 3, 0], fingers: [null, null, null, 1, 3, null] },

  // Lv5
  { id: 'Cadd9', name: 'Cadd9', level: 5, frets: [null, 3, 2, 0, 3, 0], fingers: [null, 2, 1, null, 3, null] },
  { id: 'C6', name: 'C6', level: 5, frets: [null, 3, 2, 2, 1, 0], fingers: [null, 4, 2, 3, 1, null] },
  { id: 'Bdim', name: 'Bdim', level: 5, frets: [null, 2, 3, 4, 3, null], fingers: [null, 1, 2, 4, 3, null] },
  { id: 'Caug', name: 'Caug', level: 5, frets: [null, 3, 2, 1, 1, 0], fingers: [null, 4, 3, 1, 2, null] },
  { id: 'Bm7b5', name: 'Bm7♭5', level: 5, frets: [null, 2, 3, 2, 3, null], fingers: [null, 1, 3, 2, 4, null] },
  { id: 'E9', name: 'E9', level: 5, frets: [0, 2, 0, 1, 0, 2], fingers: [null, 2, null, 1, null, 3] },
];

export function chordsOfLevel(level: Level): Chord[] {
  return CHORDS.filter((chord) => chord.level === level);
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/data/chords.test.ts`
Expected: PASS（失敗したコードがあれば、テストではなく押さえ方のデータを直す）

---

### Task 4: クイズの出題ロジック

**Files:**
- Create: `src/lib/quiz.ts`
- Test: `src/lib/quiz.test.ts`

**Interfaces:**
- Consumes: `type Chord`, `type Level`（model.ts）、`CHORDS`, `chordsOfLevel`（chords.ts、テストのみ）
- Produces:
  - `QUESTION_COUNT = 10`, `CHOICE_COUNT = 4`
  - `type Question = { answer: Chord; choices: Chord[] }`
  - `type QuizResult = { level: Level; score: number; correct: number; total: number; wrong: Chord[] }`
  - `generateQuiz(levelChords: readonly Chord[], allChords: readonly Chord[], rng?: () => number): Question[]`
  - `scorePercent(correct: number, total: number): number`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/quiz.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CHORDS, chordsOfLevel } from '../data/chords';
import { CHOICE_COUNT, QUESTION_COUNT, generateQuiz, scorePercent } from './quiz';

/** テスト用の再現可能な乱数 */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

describe('generateQuiz', () => {
  it('10問出題する', () => {
    expect(generateQuiz(chordsOfLevel(1), CHORDS, seededRng(1))).toHaveLength(QUESTION_COUNT);
  });

  it('10個以上のレベルでは同じコードを2回出さない', () => {
    const ids = generateQuiz(chordsOfLevel(1), CHORDS, seededRng(2)).map((q) => q.answer.id);
    expect(new Set(ids).size).toBe(QUESTION_COUNT);
  });

  it('10個未満のレベルでも10問出し、全コードが少なくとも1回出る', () => {
    const level3 = chordsOfLevel(3);
    const questions = generateQuiz(level3, CHORDS, seededRng(3));
    expect(questions).toHaveLength(QUESTION_COUNT);
    expect(new Set(questions.map((q) => q.answer.id))).toEqual(new Set(level3.map((c) => c.id)));
  });

  it('選択肢は4つで重複がなく、正解がちょうど1つ含まれる', () => {
    for (const seed of [4, 5, 6]) {
      for (const q of generateQuiz(chordsOfLevel(5), CHORDS, seededRng(seed))) {
        const ids = q.choices.map((c) => c.id);
        expect(ids).toHaveLength(CHOICE_COUNT);
        expect(new Set(ids).size).toBe(CHOICE_COUNT);
        expect(ids.filter((id) => id === q.answer.id)).toHaveLength(1);
      }
    }
  });

  it('不正解の選択肢は同じレベルのコードを優先する', () => {
    for (const q of generateQuiz(chordsOfLevel(2), CHORDS, seededRng(7))) {
      expect(q.choices.every((c) => c.level === 2)).toBe(true);
    }
  });

  it('同じレベルが足りないときは他のレベルから補う', () => {
    const twoChords = chordsOfLevel(1).slice(0, 2);
    for (const q of generateQuiz(twoChords, CHORDS, seededRng(8))) {
      expect(q.choices).toHaveLength(CHOICE_COUNT);
      expect(new Set(q.choices.map((c) => c.id)).size).toBe(CHOICE_COUNT);
    }
  });

  it('コードが空なら例外を投げる', () => {
    expect(() => generateQuiz([], CHORDS)).toThrow();
  });
});

describe('scorePercent', () => {
  it('正答率を整数の % で返す', () => {
    expect(scorePercent(7, 10)).toBe(70);
    expect(scorePercent(2, 3)).toBe(67);
    expect(scorePercent(0, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/quiz.test.ts`
Expected: FAIL（`./quiz` が見つからない）

- [ ] **Step 3: quiz.ts を実装する**

```ts
import type { Chord, Level } from '../model';

export const QUESTION_COUNT = 10;
export const CHOICE_COUNT = 4;

export type Question = { answer: Chord; choices: Chord[] };

export type QuizResult = {
  level: Level;
  score: number;
  correct: number;
  total: number;
  wrong: Chord[];
};

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 全コードを一巡させてから重複を許して count 個そろえる */
function pickAnswers(levelChords: readonly Chord[], rng: () => number): Chord[] {
  const answers: Chord[] = [];
  while (answers.length < QUESTION_COUNT) answers.push(...shuffle(levelChords, rng));
  return answers.slice(0, QUESTION_COUNT);
}

function buildChoices(
  answer: Chord,
  levelChords: readonly Chord[],
  allChords: readonly Chord[],
  rng: () => number,
): Chord[] {
  const levelIds = new Set(levelChords.map((c) => c.id));
  const sameLevel = shuffle(levelChords.filter((c) => c.id !== answer.id), rng);
  const others = shuffle(allChords.filter((c) => !levelIds.has(c.id)), rng);
  const distractors = [...sameLevel, ...others].slice(0, CHOICE_COUNT - 1);
  return shuffle([answer, ...distractors], rng);
}

export function generateQuiz(
  levelChords: readonly Chord[],
  allChords: readonly Chord[],
  rng: () => number = Math.random,
): Question[] {
  if (levelChords.length === 0) throw new Error('出題できるコードがありません');
  return pickAnswers(levelChords, rng).map((answer) => ({
    answer,
    choices: buildChoices(answer, levelChords, allChords, rng),
  }));
}

export function scorePercent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/quiz.test.ts`
Expected: PASS（8 tests）

---

### Task 5: 記録の保存

**Files:**
- Create: `src/lib/progress.ts`
- Test: `src/lib/progress.test.ts`

**Interfaces:**
- Consumes: `LEVELS`, `type Level`（model.ts）
- Produces:
  - `type LevelProgress = { bestScore: number; cleared: boolean }`
  - `type Progress = Partial<Record<Level, LevelProgress>>`
  - `STORAGE_KEY = 'code-master:progress'`, `CLEAR_THRESHOLD = 80`
  - `loadProgress(storage?: StorageLike | null): Progress`
  - `saveResult(level: Level, score: number, storage?: StorageLike | null): Progress`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/progress.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, loadProgress, saveResult } from './progress';

function memoryStorage(initial: string | null = null) {
  const data = new Map<string, string>();
  if (initial !== null) data.set(STORAGE_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const throwingStorage = {
  getItem: () => { throw new Error('denied'); },
  setItem: () => { throw new Error('denied'); },
};

describe('loadProgress', () => {
  it('記録がなければ空', () => {
    expect(loadProgress(memoryStorage())).toEqual({});
  });

  it('保存した記録を読める', () => {
    const storage = memoryStorage();
    saveResult(1, 90, storage);
    expect(loadProgress(storage)).toEqual({ 1: { bestScore: 90, cleared: true } });
  });

  it('壊れた JSON なら空', () => {
    expect(loadProgress(memoryStorage('{not json'))).toEqual({});
  });

  it('不正な値のレベルだけ無視する', () => {
    const raw = JSON.stringify({ 1: { bestScore: 70 }, 2: { bestScore: 'x' }, 3: { bestScore: 150 }, 9: { bestScore: 50 } });
    expect(loadProgress(memoryStorage(raw))).toEqual({ 1: { bestScore: 70, cleared: false } });
  });

  it('storage が使えない・例外を投げるなら空', () => {
    expect(loadProgress(null)).toEqual({});
    expect(loadProgress(throwingStorage)).toEqual({});
  });
});

describe('saveResult', () => {
  it('80% 以上でクリアになる', () => {
    expect(saveResult(2, 80, memoryStorage())[2]).toEqual({ bestScore: 80, cleared: true });
    expect(saveResult(2, 79, memoryStorage())[2]).toEqual({ bestScore: 79, cleared: false });
  });

  it('最高値より低いスコアでは更新しない', () => {
    const storage = memoryStorage();
    saveResult(1, 90, storage);
    saveResult(1, 50, storage);
    expect(loadProgress(storage)[1]).toEqual({ bestScore: 90, cleared: true });
  });

  it('他のレベルの記録を消さない', () => {
    const storage = memoryStorage();
    saveResult(1, 90, storage);
    saveResult(2, 40, storage);
    expect(loadProgress(storage)).toEqual({
      1: { bestScore: 90, cleared: true },
      2: { bestScore: 40, cleared: false },
    });
  });

  it('storage が例外を投げても落ちずに結果を返す', () => {
    expect(saveResult(1, 90, throwingStorage)[1]).toEqual({ bestScore: 90, cleared: true });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/progress.test.ts`
Expected: FAIL（`./progress` が見つからない）

- [ ] **Step 3: progress.ts を実装する**

```ts
import { LEVELS, type Level } from '../model';

export type LevelProgress = { bestScore: number; cleared: boolean };
export type Progress = Partial<Record<Level, LevelProgress>>;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const STORAGE_KEY = 'code-master:progress';
export const CLEAR_THRESHOLD = 80;

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function toLevelProgress(value: unknown): LevelProgress | null {
  if (typeof value !== 'object' || value === null) return null;
  const { bestScore } = value as { bestScore?: unknown };
  if (typeof bestScore !== 'number' || !Number.isFinite(bestScore) || bestScore < 0 || bestScore > 100) return null;
  return { bestScore, cleared: bestScore >= CLEAR_THRESHOLD };
}

export function loadProgress(storage: StorageLike | null = defaultStorage()): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const progress: Progress = {};
    for (const level of LEVELS) {
      const entry = toLevelProgress((parsed as Record<string, unknown>)[level]);
      if (entry) progress[level] = entry;
    }
    return progress;
  } catch {
    return {};
  }
}

export function saveResult(level: Level, score: number, storage: StorageLike | null = defaultStorage()): Progress {
  const current = loadProgress(storage);
  const best = current[level]?.bestScore;
  if (best !== undefined && score <= best) return current;
  const next: Progress = { ...current, [level]: { bestScore: score, cleared: score >= CLEAR_THRESHOLD } };
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても、今回の結果はそのまま返す
  }
  return next;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/progress.test.ts`
Expected: PASS（9 tests）

---

### Task 6: ルートの解析

**Files:**
- Create: `src/lib/route.ts`
- Test: `src/lib/route.test.ts`

**Interfaces:**
- Consumes: `isLevel`, `type Level`（model.ts）
- Produces:
  - `type Route = { page: 'home' } | { page: 'study' | 'quiz' | 'result'; level: Level }`
  - `parseRoute(hash: string): Route`
  - `formatRoute(route: Route): string`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/route.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatRoute, parseRoute } from './route';

describe('parseRoute', () => {
  it.each([
    ['#/level/1/study', { page: 'study', level: 1 }],
    ['#/level/3/quiz', { page: 'quiz', level: 3 }],
    ['#/level/5/result', { page: 'result', level: 5 }],
  ])('%s を解析する', (hash, expected) => {
    expect(parseRoute(hash)).toEqual(expected);
  });

  it.each(['', '#', '#/', '#/foo', '#/level/0/quiz', '#/level/6/quiz', '#/level/abc/study', '#/level/1/play', '#/level/1/quiz/extra'])(
    '%s はホームになる',
    (hash) => {
      expect(parseRoute(hash)).toEqual({ page: 'home' });
    },
  );
});

describe('formatRoute', () => {
  it('ルートを hash に戻す', () => {
    expect(formatRoute({ page: 'home' })).toBe('#/');
    expect(formatRoute({ page: 'quiz', level: 2 })).toBe('#/level/2/quiz');
  });

  it('parseRoute と往復できる', () => {
    expect(parseRoute(formatRoute({ page: 'study', level: 4 }))).toEqual({ page: 'study', level: 4 });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/route.test.ts`
Expected: FAIL（`./route` が見つからない）

- [ ] **Step 3: route.ts を実装する**

```ts
import { isLevel, type Level } from '../model';

type LevelPage = 'study' | 'quiz' | 'result';
export type Route = { page: 'home' } | { page: LevelPage; level: Level };

export function parseRoute(hash: string): Route {
  const match = hash.match(/^#\/level\/(\d+)\/(study|quiz|result)$/);
  if (match) {
    const level = Number(match[1]);
    if (isLevel(level)) return { page: match[2] as LevelPage, level };
  }
  return { page: 'home' };
}

export function formatRoute(route: Route): string {
  return route.page === 'home' ? '#/' : `#/level/${route.level}/${route.page}`;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/route.test.ts`
Expected: PASS

---

### Task 7: ダイアグラム・ホーム・学習画面

**Files:**
- Create: `src/router.ts`, `src/components/ChordDiagram.tsx`, `src/components/ChordCard.tsx`, `src/pages/Home.tsx`, `src/pages/Study.tsx`
- Modify: `src/App.tsx`（全体を置き換え）

**Interfaces:**
- Consumes: `parseRoute`, `formatRoute`, `type Route`（route.ts）、`stringNotes`, `chordTones`, `rootNote`（notes.ts）、`CHORDS`, `LEVEL_INFO`, `chordsOfLevel`（chords.ts）、`loadProgress`（progress.ts）
- Produces:
  - `useHashRoute(): Route`, `navigate(route: Route, replace?: boolean): void`（router.ts）
  - `<ChordDiagram chord={Chord} showNotes={boolean} />`
  - `<ChordCard chord={Chord} />`（コード名・音名つきダイアグラム・構成音・ルート）

- [ ] **Step 1: router.ts を作る**

```ts
import { useEffect, useState } from 'react';
import { formatRoute, parseRoute, type Route } from './lib/route';

export function useHashRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parseRoute(hash);
}

export function navigate(route: Route, replace = false): void {
  const hash = formatRoute(route);
  if (replace) window.location.replace(hash);
  else window.location.hash = hash;
}
```

- [ ] **Step 2: ChordDiagram を作る**

`src/components/ChordDiagram.tsx`:
```tsx
import type { Chord } from '../model';
import { stringNotes } from '../lib/notes';

const FRET_COUNT = 5;
const STRING_GAP = 24;
const FRET_GAP = 28;
const LEFT = 28;
const TOP = 36;
const DOT_RADIUS = 9;
const WIDTH = LEFT * 2 + STRING_GAP * 5;
const BOARD_BOTTOM = TOP + FRET_GAP * FRET_COUNT;
const HEIGHT = BOARD_BOTTOM + 28;

/** i: 0 = 6弦 */
const stringX = (i: number) => LEFT + i * STRING_GAP;
/** 弦番号（6〜1）→ 配列 index */
const indexOfString = (stringNumber: number) => 6 - stringNumber;

type Props = { chord: Chord; showNotes: boolean };

export default function ChordDiagram({ chord, showNotes }: Props) {
  const baseFret = chord.baseFret ?? 1;
  const fretY = (fret: number) => TOP + (fret - baseFret + 0.5) * FRET_GAP;
  const notes = stringNotes(chord);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="chord-diagram"
      role="img"
      aria-label={showNotes ? `${chord.name} のダイアグラム` : 'コードダイアグラム'}
    >
      {Array.from({ length: FRET_COUNT + 1 }, (_, f) => (
        <line
          key={`fret-${f}`}
          x1={stringX(0)} x2={stringX(5)}
          y1={TOP + f * FRET_GAP} y2={TOP + f * FRET_GAP}
          className={f === 0 && baseFret === 1 ? 'nut' : 'fret'}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`string-${i}`} x1={stringX(i)} x2={stringX(i)} y1={TOP} y2={BOARD_BOTTOM} className="string" />
      ))}
      {baseFret > 1 && (
        <text x={LEFT - 12} y={fretY(baseFret)} className="base-fret" textAnchor="end" dominantBaseline="middle">
          {baseFret}fr
        </text>
      )}
      {chord.barre && (
        <rect
          x={stringX(indexOfString(chord.barre.fromString)) - DOT_RADIUS}
          y={fretY(chord.barre.fret) - DOT_RADIUS}
          width={stringX(indexOfString(chord.barre.toString)) - stringX(indexOfString(chord.barre.fromString)) + DOT_RADIUS * 2}
          height={DOT_RADIUS * 2}
          rx={DOT_RADIUS}
          className="barre"
        />
      )}
      {chord.frets.map((fret, i) => {
        if (fret === null || fret === 0) {
          return (
            <text key={`mark-${i}`} x={stringX(i)} y={TOP - 12} className="marker" textAnchor="middle">
              {fret === null ? '×' : '○'}
            </text>
          );
        }
        const finger = chord.fingers?.[i];
        return (
          <g key={`dot-${i}`}>
            <circle cx={stringX(i)} cy={fretY(fret)} r={DOT_RADIUS} className="dot" />
            {finger != null && (
              <text x={stringX(i)} y={fretY(fret)} className="finger" textAnchor="middle" dominantBaseline="central">
                {finger}
              </text>
            )}
          </g>
        );
      })}
      {showNotes &&
        notes.map((note, i) =>
          note === null ? null : (
            <text key={`note-${i}`} x={stringX(i)} y={BOARD_BOTTOM + 20} className="note" textAnchor="middle">
              {note}
            </text>
          ),
        )}
    </svg>
  );
}
```

- [ ] **Step 3: ChordCard を作る**

`src/components/ChordCard.tsx`:
```tsx
import type { Chord } from '../model';
import { chordTones, rootNote } from '../lib/notes';
import ChordDiagram from './ChordDiagram';

export default function ChordCard({ chord }: { chord: Chord }) {
  return (
    <section className="chord-card">
      <h2>{chord.name}</h2>
      <ChordDiagram chord={chord} showNotes />
      <p>構成音: {chordTones(chord).join('・')}</p>
      <p className="muted">ルート: {rootNote(chord)}</p>
    </section>
  );
}
```

- [ ] **Step 4: Home を作る**

`src/pages/Home.tsx`:
```tsx
import { useState } from 'react';
import { LEVELS } from '../model';
import { LEVEL_INFO } from '../data/chords';
import { loadProgress } from '../lib/progress';
import { formatRoute } from '../lib/route';

export default function Home() {
  const [progress] = useState(() => loadProgress());

  return (
    <main className="page">
      <h1>ギターコード練習</h1>
      <p className="muted">コードの形と、各弦で鳴っている音をセットで覚えよう。</p>
      <div className="level-grid">
        {LEVELS.map((level) => {
          const record = progress[level];
          return (
            <section key={level} className="level-card">
              <h2>Lv{level} {LEVEL_INFO[level].title}</h2>
              <p className="muted">{LEVEL_INFO[level].description}</p>
              <p>
                {record ? `最高正答率 ${record.bestScore}%` : '未挑戦'}
                {record?.cleared && <span className="badge">クリア済み</span>}
              </p>
              <div className="actions">
                <a className="button secondary" href={formatRoute({ page: 'study', level })}>学習</a>
                <a className="button" href={formatRoute({ page: 'quiz', level })}>クイズ</a>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Study を作る**

`src/pages/Study.tsx`:
```tsx
import type { Level } from '../model';
import { LEVEL_INFO, chordsOfLevel } from '../data/chords';
import { formatRoute } from '../lib/route';
import ChordCard from '../components/ChordCard';

export default function Study({ level }: { level: Level }) {
  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title}</h1>
      <p className="muted">{LEVEL_INFO[level].description}</p>
      <div className="actions">
        <a className="button" href={formatRoute({ page: 'quiz', level })}>クイズに挑戦</a>
      </div>
      <div className="chord-grid">
        {chordsOfLevel(level).map((chord) => (
          <ChordCard key={chord.id} chord={chord} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 6: App を置き換える（クイズ・結果は Task 8 で追加）**

`src/App.tsx`:
```tsx
import { useEffect } from 'react';
import { formatRoute } from './lib/route';
import { navigate, useHashRoute } from './router';
import Home from './pages/Home';
import Study from './pages/Study';

export default function App() {
  const route = useHashRoute();
  const canonical = formatRoute(route);

  useEffect(() => {
    if (window.location.hash !== canonical) navigate(route, true);
  }, [canonical]);

  if (route.page === 'study') return <Study key={route.level} level={route.level} />;
  return <Home />;
}
```

- [ ] **Step 7: 型チェックとテストを通す**

Run: `npm run build && npm test`
Expected: どちらもエラーなし

- [ ] **Step 8: 手動で確認する**

Run: `npm run dev` を実行し、表示された URL を開く
確認すること:
- ホームに Lv1〜5 のカードが出て、すべて「未挑戦」になっている
- 「学習」で各レベルのコードが並び、各弦の下に音名、×/○、指番号が出ている
- F・B・Bm などはバレーが横棒で描かれている。Cm・Gm（3〜5フレット）も表示範囲に収まっている
- `#/level/9/study` や `#/foo` を開くと `#/` に戻る
- ダークモードでも線や文字が読める

---

### Task 8: クイズ画面と結果画面

**Files:**
- Create: `src/pages/Quiz.tsx`, `src/pages/Result.tsx`
- Modify: `src/App.tsx`（全体を置き換え）

**Interfaces:**
- Consumes: `generateQuiz`, `scorePercent`, `type QuizResult`（quiz.ts）、`saveResult`（progress.ts）、`CHORDS`, `chordsOfLevel`（chords.ts）、`ChordDiagram`, `ChordCard`、`navigate`, `useHashRoute`（router.ts）
- Produces: 完成したアプリ

- [ ] **Step 1: Quiz を作る**

`src/pages/Quiz.tsx`:
```tsx
import { useState } from 'react';
import type { Chord, Level } from '../model';
import { CHORDS, LEVEL_INFO, chordsOfLevel } from '../data/chords';
import { generateQuiz, scorePercent, type QuizResult } from '../lib/quiz';
import { saveResult } from '../lib/progress';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';

type Props = { level: Level; onFinish: (result: QuizResult) => void };

export default function Quiz({ level, onFinish }: Props) {
  const [questions] = useState(() => generateQuiz(chordsOfLevel(level), CHORDS));
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState<Chord[]>([]);

  const question = questions[index];
  const answered = selectedId !== null;
  const isCorrect = selectedId === question.answer.id;

  function choose(choice: Chord) {
    if (answered) return;
    setSelectedId(choice.id);
    if (choice.id === question.answer.id) {
      setCorrect((n) => n + 1);
    } else {
      setWrong((list) => (list.some((c) => c.id === question.answer.id) ? list : [...list, question.answer]));
    }
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelectedId(null);
      return;
    }
    const score = scorePercent(correct, questions.length);
    saveResult(level, score);
    onFinish({ level, score, correct, total: questions.length, wrong });
  }

  function choiceClass(choice: Chord): string {
    if (!answered) return 'choice';
    if (choice.id === question.answer.id) return 'choice correct';
    if (choice.id === selectedId) return 'choice wrong';
    return 'choice';
  }

  return (
    <main className="page quiz">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title}</h1>
      <p className="muted">{index + 1} / {questions.length} 問目</p>
      <ChordDiagram chord={question.answer} showNotes={answered} />
      <div className="choices">
        {question.choices.map((choice) => (
          <button key={choice.id} className={choiceClass(choice)} disabled={answered} onClick={() => choose(choice)}>
            {choice.name}
          </button>
        ))}
      </div>
      {answered && (
        <>
          <p className={isCorrect ? 'feedback correct' : 'feedback wrong'}>
            {isCorrect ? '正解！' : `不正解… 正解は ${question.answer.name}`}
          </p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <button className="button" onClick={next}>
              {index + 1 < questions.length ? '次へ' : '結果を見る'}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Result を作る**

`src/pages/Result.tsx`:
```tsx
import { useEffect } from 'react';
import type { Level } from '../model';
import { LEVEL_INFO } from '../data/chords';
import { CLEAR_THRESHOLD } from '../lib/progress';
import type { QuizResult } from '../lib/quiz';
import { formatRoute } from '../lib/route';
import { navigate } from '../router';
import ChordCard from '../components/ChordCard';

type Props = { level: Level; result: QuizResult | null };

export default function Result({ level, result }: Props) {
  const valid = result !== null && result.level === level;

  useEffect(() => {
    if (!valid) navigate({ page: 'quiz', level }, true);
  }, [valid, level]);

  if (!valid) return null;

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title} の結果</h1>
      <p className="score">{result.score}%</p>
      <p>{result.total} 問中 {result.correct} 問正解{result.score >= CLEAR_THRESHOLD && ' — クリア！'}</p>
      <div className="actions">
        <a className="button" href={formatRoute({ page: 'quiz', level })}>もう一度</a>
        <a className="button secondary" href={formatRoute({ page: 'study', level })}>学習に戻る</a>
      </div>
      {result.wrong.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>間違えたコード</h2>
          <div className="chord-grid">
            {result.wrong.map((chord) => (
              <ChordCard key={chord.id} chord={chord} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 3: App を置き換える**

`src/App.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { formatRoute } from './lib/route';
import type { QuizResult } from './lib/quiz';
import { navigate, useHashRoute } from './router';
import Home from './pages/Home';
import Study from './pages/Study';
import Quiz from './pages/Quiz';
import Result from './pages/Result';

export default function App() {
  const route = useHashRoute();
  const canonical = formatRoute(route);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (window.location.hash !== canonical) navigate(route, true);
  }, [canonical]);

  function handleFinish(result: QuizResult) {
    setLastResult(result);
    navigate({ page: 'result', level: result.level });
  }

  switch (route.page) {
    case 'study':
      return <Study key={route.level} level={route.level} />;
    case 'quiz':
      // key でレベルが変わったときに問題を作り直す
      return <Quiz key={route.level} level={route.level} onFinish={handleFinish} />;
    case 'result':
      return <Result level={route.level} result={lastResult} />;
    default:
      return <Home />;
  }
}
```

- [ ] **Step 4: 型チェックとテストを通す**

Run: `npm run build && npm test`
Expected: どちらもエラーなし

- [ ] **Step 5: 手動で確認する**

Run: `npm run dev`
確認すること:
- クイズでは最初は音名が隠れていて、回答すると正誤と音名が表示される
- 回答後は選択肢が押せない（連打しても正解数が増えない）
- 10問目のあとに結果画面が出て、正答率と間違えたコードが表示される
- ホームに戻ると最高正答率が反映され、80% 以上なら「クリア済み」が出る。低いスコアを取っても最高値は下がらない
- 「もう一度」で新しい問題になる
- Lv3（5コード）でも10問出る
- クイズの途中で URL を `#/level/2/quiz` に書き換えると、Lv2 の1問目から始まる
- 結果がない状態で `#/level/1/result` を直接開くと `#/level/1/quiz` に移動する
- リロードしても記録が残っている
