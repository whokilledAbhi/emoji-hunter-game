"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const HERO_EMOJIS = [
  "\u{1F612}",
  "\u{1F600}",
  "\u{1F60E}",
  "\u{1F61C}",
  "\u{1F978}",
  "\u{1F921}",
  "\u{1F608}",
  "\u{1F47B}",
  "\u{1F47D}",
  "\u{1F42F}",
  "\u{1F98A}",
  "\u{1F436}",
  "\u{1F435}",
];

const TARGET_EMOJIS = [
  "\u{1F34E}",
  "\u{1F355}",
  "\u{1F32E}",
  "\u{1F354}",
  "\u{1F369}",
  "\u{1F353}",
  "\u{1F48E}",
  "\u{2B50}",
];

const OBSTACLES = ["\u{1F9F1}", "\u{1FAA8}", "\u{1F335}", "\u{1F9F2}"];

const MAP_OPTIONS = [
  {
    id: "neon-grid",
    name: "Neon Grid",
    subtitle: "Hacker black wall",
    style: {
      backgroundColor: "#020613",
      backgroundImage:
        "radial-gradient(circle at 18% 24%, rgba(6, 182, 212, 0.35) 0%, transparent 32%), radial-gradient(circle at 82% 12%, rgba(16, 185, 129, 0.28) 0%, transparent 35%), linear-gradient(135deg, rgba(2, 6, 23, 0.96) 0%, rgba(4, 12, 32, 0.98) 100%), repeating-linear-gradient(0deg, rgba(34, 211, 238, 0.08) 0px, rgba(34, 211, 238, 0.08) 2px, transparent 2px, transparent 46px), repeating-linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0px, rgba(16, 185, 129, 0.08) 2px, transparent 2px, transparent 46px)",
      backgroundSize: "cover, cover, cover, 46px 46px, 46px 46px",
      backgroundPosition: "center",
    },
  },
  {
    id: "cartoon-town",
    name: "Cartoon Town",
    subtitle: "Playful houses",
    style: {
      backgroundColor: "#8bd3ff",
      backgroundImage:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(196, 235, 255, 0.55) 34%, rgba(132, 211, 149, 0.6) 34%, rgba(132, 211, 149, 0.6) 100%), repeating-linear-gradient(90deg, rgba(248, 113, 113, 0.8) 0px, rgba(248, 113, 113, 0.8) 34px, rgba(249, 168, 212, 0.8) 34px, rgba(249, 168, 212, 0.8) 68px, rgba(125, 211, 252, 0.8) 68px, rgba(125, 211, 252, 0.8) 102px, transparent 102px, transparent 136px), repeating-linear-gradient(0deg, rgba(15, 23, 42, 0.11) 0px, rgba(15, 23, 42, 0.11) 3px, transparent 3px, transparent 54px)",
      backgroundSize: "cover, 136px 68px, 54px 54px",
      backgroundPosition: "center, center 62%, center",
    },
  },
  {
    id: "nebula-arcade",
    name: "Nebula Arcade",
    subtitle: "Cosmic mist",
    style: {
      backgroundColor: "#120a33",
      backgroundImage:
        "radial-gradient(circle at 15% 24%, rgba(192, 132, 252, 0.55) 0%, transparent 28%), radial-gradient(circle at 82% 18%, rgba(34, 211, 238, 0.4) 0%, transparent 30%), radial-gradient(circle at 52% 76%, rgba(236, 72, 153, 0.5) 0%, transparent 36%), linear-gradient(140deg, rgba(15, 23, 42, 0.95) 0%, rgba(49, 23, 94, 0.9) 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
  },
  {
    id: "jungle-trail",
    name: "Jungle Trail",
    subtitle: "Leafy maze",
    style: {
      backgroundColor: "#0c2617",
      backgroundImage:
        "radial-gradient(circle at 20% 12%, rgba(74, 222, 128, 0.36) 0%, transparent 32%), radial-gradient(circle at 72% 24%, rgba(16, 185, 129, 0.36) 0%, transparent 34%), linear-gradient(180deg, rgba(6, 95, 70, 0.6) 0%, rgba(22, 101, 52, 0.8) 100%), repeating-linear-gradient(45deg, rgba(187, 247, 208, 0.09) 0px, rgba(187, 247, 208, 0.09) 8px, transparent 8px, transparent 24px)",
      backgroundSize: "cover, cover, cover, 24px 24px",
      backgroundPosition: "center",
    },
  },
  {
    id: "desert-sunset",
    name: "Desert Sunset",
    subtitle: "Warm dunes",
    style: {
      backgroundColor: "#3f1d11",
      backgroundImage:
        "radial-gradient(circle at 50% 10%, rgba(253, 186, 116, 0.6) 0%, rgba(251, 113, 133, 0.3) 26%, transparent 42%), linear-gradient(180deg, rgba(249, 115, 22, 0.34) 0%, rgba(217, 70, 239, 0.24) 40%, rgba(120, 53, 15, 0.7) 100%), repeating-linear-gradient(-20deg, rgba(251, 191, 36, 0.18) 0px, rgba(251, 191, 36, 0.18) 14px, rgba(120, 53, 15, 0.25) 14px, rgba(120, 53, 15, 0.25) 32px)",
      backgroundSize: "cover, cover, 32px 32px",
      backgroundPosition: "center",
    },
  },
];

const GRID_SIZE = 20;
const LEVEL_UP_SCORE = 50;
const POINTS_PER_TARGET = 10;
const OBSTACLES_PER_LEVEL = 3;
const TWEMOJI_BASE = "/emojis";
const SWIPE_THRESHOLD = 28;

function getCellKey(x, y) {
  return `${x}:${y}`;
}

function emojiToCodepoint(symbol) {
  return [...symbol]
    .map((character) => character.codePointAt(0).toString(16))
    .filter((codepoint) => codepoint !== "fe0f")
    .join("-");
}

function EmojiIcon({ symbol, label, className = "" }) {
  const codepoint = useMemo(() => emojiToCodepoint(symbol), [symbol]);

  return (
    // Using plain img here keeps dynamic SVG emoji rendering lightweight for many tiny grid cells.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${TWEMOJI_BASE}/${codepoint}.svg`}
      alt={label}
      className={`emoji-icon ${className}`.trim()}
      draggable={false}
      decoding="async"
      loading="eager"
      width="72"
      height="72"
    />
  );
}

export default function GameGrid() {
  const [player, setPlayer] = useState({ x: 10, y: 10 });
  const [target, setTarget] = useState({ x: 5, y: 5, emoji: TARGET_EMOJIS[0] });
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [theme, setTheme] = useState("light");
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [scorePulseKey, setScorePulseKey] = useState(0);
  const [heroEmoji, setHeroEmoji] = useState("\u{1F60E}");
  const [selectedMapId, setSelectedMapId] = useState("neon-grid");
  const [mapBrightness, setMapBrightness] = useState(96);
  const [captureFx, setCaptureFx] = useState(null);
  const [endReason, setEndReason] = useState(null);

  const containerRef = useRef(null);
  const touchStart = useRef(null);
  const pulseTimeoutRef = useRef(null);
  const eatTimeoutRef = useRef(null);
  const captureTimeoutRef = useRef(null);
  const scoreRef = useRef(0);
  const obstaclesRef = useRef([]);

  const level = Math.floor(score / LEVEL_UP_SCORE) + 1;

  const obstacleLookup = useMemo(
    () => new Set(obstacles.map(({ x, y }) => getCellKey(x, y))),
    [obstacles]
  );

  const activeMap = useMemo(
    () => MAP_OPTIONS.find((item) => item.id === selectedMapId) ?? MAP_OPTIONS[0],
    [selectedMapId]
  );

  const boardMapStyle = useMemo(
    () => ({
      ...activeMap.style,
      filter: `brightness(${mapBrightness}%)`,
    }),
    [activeMap, mapBrightness]
  );

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (isGameStarted && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isGameStarted]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
      if (eatTimeoutRef.current) {
        clearTimeout(eatTimeoutRef.current);
      }
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, []);

  const getRandomOpenCell = useCallback((blockedSet) => {
    const capacity = GRID_SIZE * GRID_SIZE;
    if (blockedSet.size >= capacity) {
      return null;
    }

    for (let attempts = 0; attempts < 700; attempts += 1) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (!blockedSet.has(getCellKey(x, y))) {
        return { x, y };
      }
    }

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        if (!blockedSet.has(getCellKey(x, y))) {
          return { x, y };
        }
      }
    }

    return null;
  }, []);

  const spawnTarget = useCallback(
    (currentObstacles, currentPlayer) => {
      const blockedSet = new Set(
        currentObstacles.map(({ x, y }) => getCellKey(x, y))
      );
      blockedSet.add(getCellKey(currentPlayer.x, currentPlayer.y));

      const cell = getRandomOpenCell(blockedSet);
      if (!cell) {
        setEndReason("board-full");
        setIsGameOver(true);
        return;
      }

      const emoji =
        TARGET_EMOJIS[Math.floor(Math.random() * TARGET_EMOJIS.length)];
      setTarget({ ...cell, emoji });
    },
    [getRandomOpenCell]
  );

  const handleCapture = useCallback(
    (capturedTarget, playerPosition) => {
      const currentScore = scoreRef.current;
      const currentLevel = Math.floor(currentScore / LEVEL_UP_SCORE) + 1;
      const newScore = currentScore + POINTS_PER_TARGET;
      const nextLevel = Math.floor(newScore / LEVEL_UP_SCORE) + 1;

      scoreRef.current = newScore;
      setScore(newScore);
      setScorePulseKey((value) => value + 1);
      setIsPulsing(true);
      setIsEating(true);
      setCaptureFx({
        key: Date.now(),
        x: capturedTarget.x,
        y: capturedTarget.y,
        emoji: capturedTarget.emoji,
      });

      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
      if (eatTimeoutRef.current) {
        clearTimeout(eatTimeoutRef.current);
      }
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }

      pulseTimeoutRef.current = setTimeout(() => {
        setIsPulsing(false);
      }, 260);

      eatTimeoutRef.current = setTimeout(() => {
        setIsEating(false);
      }, 320);

      captureTimeoutRef.current = setTimeout(() => {
        setCaptureFx(null);
      }, 360);

      let nextObstacles = obstaclesRef.current;

      if (nextLevel > currentLevel && nextLevel >= 3) {
        const blockedSet = new Set([
          ...nextObstacles.map(({ x, y }) => getCellKey(x, y)),
          getCellKey(playerPosition.x, playerPosition.y),
          getCellKey(capturedTarget.x, capturedTarget.y),
        ]);

        nextObstacles = [...nextObstacles];

        for (let index = 0; index < OBSTACLES_PER_LEVEL; index += 1) {
          const location = getRandomOpenCell(blockedSet);
          if (!location) {
            break;
          }

          blockedSet.add(getCellKey(location.x, location.y));
          const emoji = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
          nextObstacles.push({ ...location, emoji });
        }

        obstaclesRef.current = nextObstacles;
        setObstacles(nextObstacles);
      }

      spawnTarget(nextObstacles, playerPosition);
    },
    [getRandomOpenCell, spawnTarget]
  );

  useEffect(() => {
    if (!isGameStarted || isGameOver || level < 3) {
      return;
    }

    const speed = Math.max(320, 1360 - level * 120);

    const interval = setInterval(() => {
      setTarget((previous) => {
        const options = [
          { x: previous.x + 1, y: previous.y },
          { x: previous.x - 1, y: previous.y },
          { x: previous.x, y: previous.y + 1 },
          { x: previous.x, y: previous.y - 1 },
        ].filter(
          (candidate) =>
            candidate.x >= 0 &&
            candidate.x < GRID_SIZE &&
            candidate.y >= 0 &&
            candidate.y < GRID_SIZE &&
            !obstacleLookup.has(getCellKey(candidate.x, candidate.y)) &&
            !(candidate.x === player.x && candidate.y === player.y)
        );

        if (!options.length) {
          return previous;
        }

        const next = options[Math.floor(Math.random() * options.length)];

        if (next.x === player.x && next.y === player.y) {
          handleCapture({ ...next, emoji: previous.emoji }, player);
          return previous;
        }

        return { ...next, emoji: previous.emoji };
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isGameStarted, isGameOver, level, obstacleLookup, player, handleCapture]);

  const handleMove = useCallback(
    (direction) => {
      if (!isGameStarted || isGameOver) {
        return;
      }

      setPlayer((previous) => {
        let x = previous.x;
        let y = previous.y;

        if (direction === "UP") {
          y -= 1;
        } else if (direction === "DOWN") {
          y += 1;
        } else if (direction === "LEFT") {
          x -= 1;
        } else if (direction === "RIGHT") {
          x += 1;
        }

        if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
          return previous;
        }

        if (obstacleLookup.has(getCellKey(x, y))) {
          setEndReason("obstacle");
          setIsGameOver(true);
          return previous;
        }

        const nextPlayer = { x, y };

        if (x === target.x && y === target.y) {
          handleCapture(target, nextPlayer);
        }

        return nextPlayer;
      });
    },
    [isGameStarted, isGameOver, obstacleLookup, target, handleCapture]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!isGameStarted || isGameOver) {
        return;
      }

      const key = event.key.toLowerCase();
      let direction = "";

      if (key === "arrowup" || key === "w") {
        direction = "UP";
      } else if (key === "arrowdown" || key === "s") {
        direction = "DOWN";
      } else if (key === "arrowleft" || key === "a") {
        direction = "LEFT";
      } else if (key === "arrowright" || key === "d") {
        direction = "RIGHT";
      }

      if (direction) {
        event.preventDefault();
        handleMove(direction);
      }
    },
    [isGameStarted, isGameOver, handleMove]
  );

  const handleTouchStart = useCallback((event) => {
    touchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (event) => {
      if (!touchStart.current) {
        return;
      }

      const endPoint = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };

      const dx = endPoint.x - touchStart.current.x;
      const dy = endPoint.y - touchStart.current.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          handleMove(dx > 0 ? "RIGHT" : "LEFT");
        }
      } else if (Math.abs(dy) > SWIPE_THRESHOLD) {
        handleMove(dy > 0 ? "DOWN" : "UP");
      }

      touchStart.current = null;
    },
    [handleMove]
  );

  const startGame = useCallback(() => {
    const freshPlayer = {
      x: Math.floor(GRID_SIZE / 2),
      y: Math.floor(GRID_SIZE / 2),
    };

    setIsGameStarted(true);
    setIsGameOver(false);
    setScore(0);
    setScorePulseKey(0);
    setIsPulsing(false);
    setIsEating(false);
    setCaptureFx(null);
    setEndReason(null);
    setObstacles([]);
    scoreRef.current = 0;
    obstaclesRef.current = [];
    setPlayer(freshPlayer);
    spawnTarget([], freshPlayer);

    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.focus();
      }
    });
  }, [spawnTarget]);

  const abortGame = useCallback(() => {
    if (!isGameStarted || isGameOver) {
      return;
    }

    setEndReason("aborted");
    setIsGameOver(true);
    setIsPulsing(false);
    setIsEating(false);
    setCaptureFx(null);
  }, [isGameStarted, isGameOver]);

  const goBackToLoadout = useCallback(() => {
    setIsGameStarted(false);
    setIsGameOver(false);
    setScore(0);
    setScorePulseKey(0);
    setIsPulsing(false);
    setIsEating(false);
    setCaptureFx(null);
    setEndReason(null);
    setObstacles([]);
    scoreRef.current = 0;
    obstaclesRef.current = [];
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => (previous === "dark" ? "light" : "dark"));
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full max-w-5xl select-none">
      <section className="animate-board-reveal rounded-[1.75rem] border border-slate-300/60 bg-white/68 p-3 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.52)] backdrop-blur-2xl sm:p-5 dark:border-slate-100/10 dark:bg-slate-950/62 dark:shadow-[0_18px_45px_-22px_rgba(7,17,33,0.95)]">
        <div className="mb-3 grid grid-cols-[1fr_auto] gap-3 sm:mb-4 sm:gap-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div
              key={`score-${scorePulseKey}`}
              className="animate-score-pulse rounded-2xl border border-cyan-300/40 bg-cyan-100/65 px-3 py-2 text-cyan-900 sm:px-4 sm:py-3 dark:border-cyan-300/20 dark:bg-cyan-500/14 dark:text-cyan-100"
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em]">
                Score
              </p>
              <p className="font-mono text-2xl font-bold sm:text-3xl">{score}</p>
            </div>

            <div className="rounded-2xl border border-emerald-300/40 bg-emerald-100/65 px-3 py-2 text-emerald-900 sm:px-4 sm:py-3 dark:border-emerald-300/20 dark:bg-emerald-500/14 dark:text-emerald-100">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em]">
                Level
              </p>
              <p className="font-mono text-2xl font-bold sm:text-3xl">{level}</p>
            </div>

            <div className="rounded-2xl border border-orange-300/40 bg-orange-100/65 px-3 py-2 text-orange-900 sm:px-4 sm:py-3 dark:border-orange-300/20 dark:bg-orange-500/14 dark:text-orange-100">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em]">
                Hero
              </p>
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 dark:bg-slate-900/80">
                <EmojiIcon symbol={heroEmoji} label="Hero emoji" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-slate-300/70 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:-translate-y-0.5 hover:bg-white sm:text-sm dark:border-slate-100/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <button
              type="button"
              onClick={startGame}
              className="rounded-full border border-orange-300/60 bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-orange-600 sm:text-sm"
            >
              Restart
            </button>

            <button
              type="button"
              onClick={abortGame}
              disabled={!isGameStarted || isGameOver}
              className="rounded-full border border-rose-300/60 bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
            >
              Abort Game
            </button>

            <button
              type="button"
              onClick={goBackToLoadout}
              className="rounded-full border border-cyan-300/60 bg-cyan-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-cyan-600 sm:text-sm"
            >
              Back
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => containerRef.current?.focus()}
          className="relative mx-auto touch-none overflow-hidden rounded-2xl border border-slate-300/65 bg-slate-100/76 shadow-inner outline-none focus-visible:ring-4 focus-visible:ring-orange-400/40 dark:border-slate-200/10 dark:bg-slate-900/78"
          aria-label="Emoji hunter game board"
        >
          <div className="pointer-events-none absolute inset-0 opacity-95" style={boardMapStyle} />
          <div className="pointer-events-none absolute inset-0 bg-slate-950/15 dark:bg-slate-950/35" />
          <div className="pointer-events-none absolute inset-0 grid-sheen" />

          <div
            className="relative z-20 grid border-l border-t border-cyan-300/55 shadow-[inset_0_0_20px_rgba(34,211,238,0.16)]"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: "min(92vw, 680px)",
              maxWidth: "100%",
              aspectRatio: "1 / 1",
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              const isPlayer = x === player.x && y === player.y;
              const isTarget = x === target.x && y === target.y;
              const obstacle = obstacles.find(
                (entry) => entry.x === x && entry.y === y
              );
              const isCaptureCell =
                captureFx && captureFx.x === x && captureFx.y === y;

              const playerAnimationClass = [
                isPulsing ? "animate-player-pop" : "",
                isEating ? "animate-player-chomp" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={index}
                  className="game-cell relative flex items-center justify-center overflow-hidden border-r border-b border-cyan-300/55"
                >
                  {isCaptureCell && (
                    <div
                      key={captureFx.key}
                      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                    >
                      <span className="absolute inset-[16%] rounded-full border border-cyan-100/70 animate-eat-wave" />
                      <EmojiIcon
                        symbol={captureFx.emoji}
                        label="Captured target"
                        className="cell-emoji animate-eaten-target"
                      />
                    </div>
                  )}

                  {isPlayer && (
                    <>
                      {isPulsing && (
                        <span className="pointer-events-none absolute inset-[16%] rounded-full border-2 border-orange-300/80 animate-capture-ring" />
                      )}
                      <EmojiIcon
                        symbol={heroEmoji}
                        label="Player"
                        className={`cell-emoji ${playerAnimationClass}`.trim()}
                      />
                    </>
                  )}

                  {isTarget && !isPlayer && (
                    <EmojiIcon
                      symbol={target.emoji}
                      label="Target"
                      className="cell-emoji animate-target-hop"
                    />
                  )}

                  {obstacle && !isPlayer && !isTarget && (
                    <EmojiIcon
                      symbol={obstacle.emoji}
                      label="Obstacle"
                      className="cell-emoji animate-obstacle-sway"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {(!isGameStarted || isGameOver) && (
            <div className="animate-overlay-fade absolute inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-2 text-white backdrop-blur-sm sm:p-4">
              <div className="loadout-scroll max-h-full w-full overflow-y-auto rounded-2xl border border-white/15 bg-slate-900/75 p-4 pr-3 text-center shadow-2xl sm:p-5">
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-orange-200/90">
                  Emoji Hunter Loadout
                </p>
                <h2 className="text-balance text-2xl font-black sm:text-4xl">
                  {isGameOver
                    ? endReason === "aborted"
                      ? "Game Aborted"
                      : "Round Over"
                    : "Choose Hero and Map"}
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-xs text-slate-100/90 sm:text-sm">
                  {isGameOver
                    ? endReason === "aborted"
                      ? `You aborted at level ${level} with ${score} points. Change setup and start when ready.`
                      : `You reached level ${level} with ${score} points. Switch your setup and jump back in.`
                    : "Pick your hero emoji, map style, and map lighting before you start hunting."}
                </p>

                <div className="mt-4 text-left">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-200/90">
                    Hero Emoji
                  </p>
                  <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-7">
                    {HERO_EMOJIS.map((emoji) => {
                      const selected = heroEmoji === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setHeroEmoji(emoji)}
                          aria-label={`Choose hero ${emoji}`}
                          className={`flex h-12 items-center justify-center rounded-xl border transition ${
                            selected
                              ? "border-orange-300 bg-orange-400/25"
                              : "border-white/15 bg-white/8 hover:border-orange-200/60 hover:bg-white/15"
                          }`}
                        >
                          <EmojiIcon symbol={emoji} label="Hero option" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 text-left">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-200/90">
                    Map Style
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {MAP_OPTIONS.map((mapItem) => {
                      const selected = selectedMapId === mapItem.id;
                      return (
                        <button
                          key={mapItem.id}
                          type="button"
                          onClick={() => setSelectedMapId(mapItem.id)}
                          className={`rounded-xl border p-2 text-left transition ${
                            selected
                              ? "border-cyan-300 bg-cyan-400/20"
                              : "border-white/15 bg-white/8 hover:border-cyan-200/60 hover:bg-white/15"
                          }`}
                        >
                          <div
                            className="h-12 w-full rounded-lg border border-white/15"
                            style={{ ...mapItem.style, filter: `brightness(${mapBrightness}%)` }}
                          />
                          <p className="mt-2 text-xs font-semibold text-white">
                            {mapItem.name}
                          </p>
                          <p className="text-[0.65rem] text-slate-200/85">
                            {mapItem.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-200/90">
                      Map Lighting
                    </p>
                    <span className="text-xs font-semibold text-cyan-100">
                      {mapBrightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="130"
                    value={mapBrightness}
                    onChange={(event) =>
                      setMapBrightness(Number.parseInt(event.target.value, 10))
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="mt-5 rounded-full bg-gradient-to-r from-orange-500 to-cyan-500 px-8 py-3 text-base font-bold tracking-wide text-white shadow-lg transition hover:-translate-y-0.5 hover:from-orange-600 hover:to-cyan-600"
                >
                  {isGameOver ? "Play Again" : "Start Game"}
                </button>
              </div>
            </div>
          )}
        </div>

        {isGameStarted && !isGameOver && (
          <div className="mt-4 flex flex-col items-center gap-2 md:hidden">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Swipe on board or tap controls
            </p>
            <div className="grid w-[228px] grid-cols-3 gap-2">
              <div />
              <button
                type="button"
                aria-label="Move up"
                onClick={() => handleMove("UP")}
                className="dpad-button flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300/70 bg-white/90 text-2xl text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-100/15 dark:bg-slate-900/78 dark:text-slate-100"
              >
                {"\u2191"}
              </button>
              <div />

              <button
                type="button"
                aria-label="Move left"
                onClick={() => handleMove("LEFT")}
                className="dpad-button flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300/70 bg-white/90 text-2xl text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-100/15 dark:bg-slate-900/78 dark:text-slate-100"
              >
                {"\u2190"}
              </button>

              <button
                type="button"
                aria-label="Move down"
                onClick={() => handleMove("DOWN")}
                className="dpad-button flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300/70 bg-white/90 text-2xl text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-100/15 dark:bg-slate-900/78 dark:text-slate-100"
              >
                {"\u2193"}
              </button>

              <button
                type="button"
                aria-label="Move right"
                onClick={() => handleMove("RIGHT")}
                className="dpad-button flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300/70 bg-white/90 text-2xl text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-100/15 dark:bg-slate-900/78 dark:text-slate-100"
              >
                {"\u2192"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-slate-300/60 bg-white/75 px-3 py-2 text-center text-xs font-medium text-slate-700 sm:text-sm dark:border-slate-100/10 dark:bg-slate-900/72 dark:text-slate-200">
          Controls: W/A/S/D, arrow keys, swipe, or mobile D-pad. Capture targets to trigger the new eating animation. Obstacles start at level 3.
        </div>
      </section>
    </div>
  );
}
