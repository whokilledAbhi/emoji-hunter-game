"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PLAYER_EMOJI = "\u{1F60E}";
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

const GRID_SIZE = 20;
const LEVEL_UP_SCORE = 50;
const POINTS_PER_TARGET = 10;
const OBSTACLES_PER_LEVEL = 3;
const TWEMOJI_BASE = "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg";
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
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [scorePulseKey, setScorePulseKey] = useState(0);

  const containerRef = useRef(null);
  const touchStart = useRef(null);
  const pulseTimeoutRef = useRef(null);
  const scoreRef = useRef(0);
  const obstaclesRef = useRef([]);

  const level = Math.floor(score / LEVEL_UP_SCORE) + 1;
  const obstacleLookup = useMemo(
    () => new Set(obstacles.map(({ x, y }) => getCellKey(x, y))),
    [obstacles]
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

      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }

      pulseTimeoutRef.current = setTimeout(() => {
        setIsPulsing(false);
      }, 260);

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
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
          <div className="pointer-events-none absolute inset-0 grid-sheen" />

          <div
            className="relative grid gap-px bg-slate-300/75 p-px dark:bg-slate-600/45"
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
              const obstacle = obstacles.find((entry) => entry.x === x && entry.y === y);

              const tileClass = isPlayer
                ? "bg-orange-200/90 dark:bg-orange-500/24"
                : isTarget
                  ? "bg-cyan-200/86 dark:bg-cyan-500/24"
                  : obstacle
                    ? "bg-rose-200/86 dark:bg-rose-500/22"
                    : "bg-white/92 dark:bg-slate-950/88";

              return (
                <div
                  key={index}
                  className={`relative flex items-center justify-center overflow-hidden transition-colors duration-150 ${tileClass}`}
                >
                  {isPlayer && (
                    <>
                      {isPulsing && (
                        <span className="pointer-events-none absolute inset-[16%] rounded-full border-2 border-orange-400/70 animate-capture-ring" />
                      )}
                      <EmojiIcon
                        symbol={PLAYER_EMOJI}
                        label="Player"
                        className={isPulsing ? "animate-player-pop" : ""}
                      />
                    </>
                  )}

                  {isTarget && !isPlayer && (
                    <EmojiIcon
                      symbol={target.emoji}
                      label="Target"
                      className="animate-target-hop"
                    />
                  )}

                  {obstacle && !isPlayer && !isTarget && (
                    <EmojiIcon
                      symbol={obstacle.emoji}
                      label="Obstacle"
                      className="animate-obstacle-sway"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {(!isGameStarted || isGameOver) && (
            <div className="animate-overlay-fade absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/50 px-6 text-center text-white backdrop-blur-sm">
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-orange-200/90">
                Emoji Hunter
              </p>
              <h2 className="text-balance text-3xl font-black sm:text-5xl">
                {isGameOver ? "Round Over" : "Ready to Hunt?"}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-slate-100/90 sm:text-base">
                {isGameOver
                  ? `You reached level ${level} with ${score} points.`
                  : "Collect glowing targets and avoid obstacle tiles. The board speeds up from level 3."}
              </p>

              <button
                type="button"
                onClick={startGame}
                className="mt-6 rounded-full bg-gradient-to-r from-orange-500 to-cyan-500 px-8 py-3 text-base font-bold tracking-wide text-white shadow-lg transition hover:-translate-y-0.5 hover:from-orange-600 hover:to-cyan-600"
              >
                {isGameOver ? "Play Again" : "Start Game"}
              </button>
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
          Controls: W/A/S/D, arrow keys, swipe, or mobile D-pad. Obstacles start appearing at level 3.
        </div>
      </section>
    </div>
  );
}
