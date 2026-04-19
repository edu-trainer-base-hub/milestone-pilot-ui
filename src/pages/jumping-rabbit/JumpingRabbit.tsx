import { useEffect, useRef, useState } from "react";

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface QuizQ {
  a: number;
  b: number;
  options: number[];
  answer?: number;
  correct?: boolean;
}

const randRange = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const shuffleArray = <T,>(arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const supportsVibration = () => typeof navigator !== "undefined" && !!navigator.vibrate;

export default function RabbitJumpX9({ numQuestions = 3 }: { numQuestions?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const askOnHitRef = useRef(true);

  // UI state
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [quiz, setQuiz] = useState<QuizQ[] | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [quizCount, setQuizCount] = useState<number>(numQuestions);
  const [message, setMessage] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [askOnHit, setAskOnHit] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);

  useEffect(() => {
    askOnHitRef.current = askOnHit;
  }, [askOnHit]);

  const ensureAudioCtx = () => {
    if (!effectsEnabled) return null;
    let ctx = audioCtxRef.current;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!ctx && Ctx) {
      try {
        ctx = new Ctx();
        audioCtxRef.current = ctx;
      } catch {
        return null;
      }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx ?? null;
  };

  const playTone = (freq: number, duration: number, volume = 0.12, type: OscillatorType = "sine") => {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  };

  const playSound = (kind: "jump" | "hit" | "correct" | "wrong" | "finish") => {
    if (!effectsEnabled) return;
    if (kind === "jump") {
      playTone(620, 0.08, 0.06, "triangle");
    } else if (kind === "hit") {
      playTone(180, 0.12, 0.12, "sawtooth");
      playTone(90, 0.14, 0.08, "square");
    } else if (kind === "correct") {
      playTone(720, 0.08, 0.08, "triangle");
      setTimeout(() => playTone(860, 0.1, 0.06, "triangle"), 50);
    } else if (kind === "wrong") {
      playTone(260, 0.1, 0.12, "sawtooth");
      setTimeout(() => playTone(200, 0.1, 0.08, "sawtooth"), 60);
    } else if (kind === "finish") {
      playTone(760, 0.14, 0.1, "triangle");
      setTimeout(() => playTone(920, 0.16, 0.08, "triangle"), 70);
      setTimeout(() => playTone(1080, 0.18, 0.06, "triangle"), 140);
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if (!effectsEnabled) return;
    if (supportsVibration()) navigator.vibrate(pattern);
  };

  const primeEffects = () => {
    if (!effectsEnabled) return;
    ensureAudioCtx();
  };

  // Game state (mutable ref, avoids per-frame React re-renders)
  const gameRef = useRef({
    time: 0,
    width: 800,
    height: 450,
    groundY: 380,
    gravity: 1800,
    jumpV: -700,
    rabbit: { x: 120, y: 380, vy: 0, w: 46, h: 42 },
    speed: 260,
    flowers: [] as Obstacle[],
    nextSpawn: 0,
    jumpsAvailable: 2,
    // finish/threshold flags
    speedBoosted: false,
    spawnedFinish: false,
    finishX: null as number | null,
    finished: false,
    // finish celebration (lightweight)
    celebrationTimer: 0,
    celebrationPhase: 0,
    hitCooldown: 0,
  });

  // Resize canvases to the game area container size (responsive)
  useEffect(() => {
    const base = canvasRef.current;
    const container = gameAreaRef.current;
    if (!base || !container) return;

    const resizeToContainer = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const targetW = Math.max(200, rect.width);
      const targetH = Math.max(200, rect.height);
      // style sizes
      base.style.width = `${targetW}px`;
      base.style.height = `${targetH}px`;
      // backing sizes
      const g = gameRef.current;
      g.width = Math.floor(targetW * dpr);
      g.height = Math.floor(targetH * dpr);
      base.width = g.width;
      base.height = g.height;
      g.groundY = Math.floor(g.height * 0.84);
    };

    resizeToContainer();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resizeToContainer());
      ro.observe(container);
    } else {
      const onResize = () => resizeToContainer();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    return () => {
      ro?.disconnect();
    };
  }, []);

  // Track desktop breakpoint to toggle layouts and focus targets
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync);
    else if ((mq as any).addListener) (mq as any).addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", sync);
      else if ((mq as any).removeListener) (mq as any).removeListener(sync);
    };
  }, []);

  const focusCanvas = () => {
    const el = canvasRef.current;
    if (el) {
      try {
        el.focus({ preventScroll: true } as any);
      } catch {}
    }
  };

  // Input handlers (ignored until started and not paused)
  useEffect(() => {
    const onPointer = (e: Event) => {
      e.preventDefault();
      const g = gameRef.current;
      if (!started || paused || g.finished) return;
      jump();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        const g = gameRef.current;
        if (!started || paused || g.finished) return;
        jump();
      }
    };
    const el = canvasRef.current!;
    el.addEventListener("pointerdown", onPointer, { passive: false });
    window.addEventListener("keydown", onKey, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointer as any);
      window.removeEventListener("keydown", onKey);
    };
  }, [paused, started]);

  const jump = () => {
    primeEffects();
    const g = gameRef.current;
    if (g.jumpsAvailable <= 0) return;
    g.rabbit.vy = g.jumpV;
    g.jumpsAvailable -= 1;
    playSound("jump");
  };

  // Helpers to apply thresholds based on new score value
  const handleThresholds = (newScore: number) => {
    const g = gameRef.current;
    if (newScore >= 10 && !g.speedBoosted) {
      g.speed = Math.min(620, g.speed + 90); // little faster at 10
      g.speedBoosted = true;
      setMessage("Speed up! 🚀");
      setTimeout(() => setMessage(null), 900);
    }
    if (newScore >= 15 && !g.spawnedFinish) {
      g.spawnedFinish = true;
      g.finishX = g.width + 20; // spawn finish line off-screen right
      setMessage("Finish ahead! 🏁");
      setTimeout(() => setMessage(null), 900);
    }
  };

  // Main game loop
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const g = gameRef.current;
      const base = canvasRef.current!;
      const ctx = base.getContext("2d")!;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (started && g.hitCooldown > 0) {
        g.hitCooldown = Math.max(0, g.hitCooldown - dt);
      }

      if (!paused && started && !g.finished) {
        g.time += dt;

        // Spawn flowers only until finish is spawned
        g.nextSpawn -= dt;
        if (!g.spawnedFinish && g.nextSpawn <= 0) {
          const flowerSize = randRange(36, 56);
          const space = randRange(0.9, 1.6);
          g.flowers.push({
            x: g.width + flowerSize,
            y: g.groundY - flowerSize,
            w: flowerSize,
            h: flowerSize,
          });
          g.nextSpawn = space;
          g.speed = Math.min(520, g.speed + 0.3);
        }

        // Physics
        g.rabbit.vy += g.gravity * dt;
        g.rabbit.y += g.rabbit.vy * dt;
        if (g.rabbit.y > g.groundY - g.rabbit.h) {
          g.rabbit.y = g.groundY - g.rabbit.h;
          g.rabbit.vy = 0;
          g.jumpsAvailable = 2;
        }

        // Move flowers
        for (const f of g.flowers) f.x -= g.speed * dt;
        // Move finish line if spawned
        if (g.spawnedFinish && g.finishX != null) {
          g.finishX -= g.speed * dt;
          // When finish passes rabbit, win
          if (g.finishX <= g.rabbit.x + g.rabbit.w) {
            if (!g.finished) {
              g.finished = true;
              playSound("finish");
              vibrate([80, 40, 120]);
              startCelebration();
              setWon(true);
              setMessage(null);
              setPaused(false);
              setQuiz(null);
            }
          }
        }

        // remove off-screen flowers -> score++ and thresholds
        while (g.flowers.length && g.flowers[0].x + g.flowers[0].w < -20) {
          g.flowers.shift();
          setScore((s) => {
            const ns = s + 1;
            handleThresholds(ns);
            return ns;
          });
        }

        // collision (only before finish)
        if (!g.spawnedFinish && g.hitCooldown <= 0) {
          const r = {
            x: g.rabbit.x,
            y: g.rabbit.y,
            w: g.rabbit.w,
            h: g.rabbit.h,
          };
          for (let i = 0; i < g.flowers.length; i++) {
            if (aabb(r, g.flowers[i])) {
              handleCollision(i);
              break;
            }
          }
        }
      }

      // Finish celebration update runs always (even when finished)
      updateCelebration(dt);

      draw(ctx);

      loopRef.current = requestAnimationFrame(tick);
    };
    loopRef.current = requestAnimationFrame(tick);
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, [paused, started]);

  const aabb = (a: { x: number; y: number; w: number; h: number }, b: Obstacle) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const draw = (ctx: CanvasRenderingContext2D) => {
    const g = gameRef.current;
    const W = g.width;
    const H = g.height;

    // Background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#c7f0ff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#7bc96f";
    ctx.fillRect(0, g.groundY, W, H - g.groundY);

    // Rabbit & obstacles
    drawRabbit(ctx, g.rabbit.x, g.rabbit.y, g.rabbit.w, g.rabbit.h);
    for (const f of g.flowers) drawFlower(ctx, f);

    // Finish line
    if (g.spawnedFinish && g.finishX != null) {
      drawFinishLine(ctx, g.finishX, g.groundY, H);
    }

    // Celebration glow after finishing
    if (g.finished) {
      drawCelebration(ctx, g.rabbit.x + g.rabbit.w * 0.5, g.rabbit.y + g.rabbit.h * 0.5);
    }
  };

  function drawRabbit(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const r = Math.min(w, h) * 0.25;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(x + w * 0.35, y + h * 0.35, Math.max(2, w * 0.06), 0, Math.PI * 2);
    ctx.arc(x + w * 0.65, y + h * 0.35, Math.max(2, w * 0.06), 0, Math.PI * 2);
    ctx.fill();
    // ears
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w * 0.15, y - h * 0.6, w * 0.22, h * 0.6);
    ctx.fillRect(x + w * 0.63, y - h * 0.6, w * 0.22, h * 0.6);
    ctx.fillStyle = "#ff9ec7";
    ctx.fillRect(x + w * 0.19, y - h * 0.45, w * 0.14, h * 0.45);
    ctx.fillRect(x + w * 0.67, y - h * 0.45, w * 0.14, h * 0.45);
    // nose
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.55, Math.max(2, w * 0.06), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlower(ctx: CanvasRenderingContext2D, f: Obstacle) {
    ctx.fillStyle = "#2e7d32"; // stem
    ctx.fillRect(f.x + f.w * 0.45, f.y + f.h * 0.3, f.w * 0.1, f.h * 0.7);
    ctx.fillStyle = "#ffd54f"; // petals
    const petals = 6;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const px = f.x + f.w * 0.5 + Math.cos(angle) * f.w * 0.3;
      const py = f.y + f.h * 0.3 + Math.sin(angle) * f.h * 0.3;
      roundRect(ctx, px - f.w * 0.18, py - f.h * 0.18, f.w * 0.36, f.h * 0.36, f.w * 0.12);
      ctx.fill();
    }
    ctx.fillStyle = "#ff8a00"; // center
    ctx.beginPath();
    ctx.arc(f.x + f.w * 0.5, f.y + f.h * 0.3, f.w * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFinishLine(ctx: CanvasRenderingContext2D, x: number, groundY: number, H: number) {
    const poleW = 10;
    const bannerW = 22;
    const height = Math.min(160, H - groundY + 120);
    const top = groundY - height;
    // pole
    ctx.fillStyle = "#555";
    ctx.fillRect(x - poleW, top, poleW, height);
    // checker banner
    const w = bannerW;
    const h = Math.min(120, height - 20);
    const cell = 10;
    for (let ry = 0; ry < h; ry += cell) {
      for (let rx = 0; rx < w; rx += cell) {
        ctx.fillStyle = (Math.floor(rx / cell) + Math.floor(ry / cell)) % 2 === 0 ? "#fff" : "#000";
        ctx.fillRect(x, top + ry, Math.min(cell, w - rx), Math.min(cell, h - ry));
      }
    }
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    r = clamp(r, 0, Math.min(w, h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ----- LIGHT CELEBRATION EFFECT (no extra canvas) -----
  const startCelebration = () => {
    const g = gameRef.current;
    g.celebrationTimer = 2.6;
    g.celebrationPhase = 0;
  };

  const updateCelebration = (dt: number) => {
    const g = gameRef.current;
    if (!started) return;
    if (g.celebrationTimer > 0) {
      g.celebrationTimer = Math.max(0, g.celebrationTimer - dt);
      g.celebrationPhase += dt;
    }
  };

  const drawCelebration = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    const g = gameRef.current;
    if (g.celebrationTimer <= 0) return;
    const remaining = g.celebrationTimer / 2.6;
    const pulse = Math.sin(g.celebrationPhase * 4);
    const baseRadius = Math.min(g.width, g.height) * 0.18;
    ctx.save();
    // soft glow ring
    ctx.globalAlpha = 0.6 * remaining;
    const glow = ctx.createRadialGradient(cx, cy, baseRadius * 0.25, cx, cy, baseRadius);
    glow.addColorStop(0, "rgba(255,255,255,0.95)");
    glow.addColorStop(1, "rgba(255,215,130,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * (0.9 + 0.08 * pulse), 0, Math.PI * 2);
    ctx.fill();

    // gentle rays
    ctx.globalAlpha = 0.75 * remaining;
    ctx.strokeStyle = "rgba(255,184,66,0.9)";
    ctx.lineWidth = 5;
    const rays = 10;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2 + g.celebrationPhase * 1.3;
      const innerR = baseRadius * 0.35;
      const outerR = baseRadius * (0.85 + 0.15 * Math.sin(g.celebrationPhase * 3 + i));
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();
    }

    // badge
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffe8b3";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    const badgeR = Math.min(26, baseRadius * 0.3);
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#b45309";
    ctx.font = `${badgeR * 0.9}px "Inter", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", cx, cy + badgeR * 0.05);

    ctx.restore();
  };

  // ----- QUIZ -----
  const buildOptions = (correct: number) => {
    const options = new Set<number>([correct]);
    while (options.size < 4) {
      const delta = Math.round(randRange(-6, 7));
      const candidate = Math.max(2, correct + delta);
      options.add(candidate === correct ? candidate + 3 : candidate);
    }
    return shuffleArray([...options]).slice(0, 4);
  };

  const makeQuiz = (): QuizQ[] => {
    const qs: QuizQ[] = [];
    const used = new Set<number>();
    while (qs.length < quizCount) {
      const b = Math.floor(randRange(2, 13)); // 2..12
      if (used.has(b)) continue;
      used.add(b);
      const answer = 9 * b;
      qs.push({ a: 9, b, options: buildOptions(answer) });
    }
    return qs;
  };

  const prepareLandingSpace = (collidedX?: number) => {
    const g = gameRef.current;
    const safeGap = g.width * 0.18;
    g.flowers = g.flowers.filter((f) => {
      if (typeof collidedX === "number" && f.x <= collidedX + f.w) {
        return false;
      }
      return f.x - (g.rabbit.x + g.rabbit.w) > safeGap;
    });
    g.rabbit.y = Math.min(g.rabbit.y, g.groundY - g.rabbit.h);
    g.rabbit.vy = 0;
    g.jumpsAvailable = 2;
    g.hitCooldown = 0.8;
    g.nextSpawn = Math.max(g.nextSpawn, 0.5);
  };

  const triggerQuiz = () => {
    // Do not spawn quiz after finish is spawned
    if (gameRef.current.spawnedFinish) return;
    setPaused(true);
    setQuiz(makeQuiz());
    setQuizIndex(0);
    setMessage("Answer to keep hopping! ✏️");
    vibrate(140);
  };

  const handleCollision = (hitIndex: number) => {
    const g = gameRef.current;
    const hitFlower = g.flowers[hitIndex];
    const collidedX = hitFlower ? hitFlower.x : undefined;
    g.flowers = g.flowers.filter((_, i) => i !== hitIndex);
    prepareLandingSpace(collidedX);
    playSound("hit");
    vibrate(180);

    if (!askOnHitRef.current) {
      setMessage("Ouch! Keep hopping.");
      setTimeout(() => setMessage(null), 1100);
      return;
    }

    triggerQuiz();
  };

  const handleOptionSelect = (value: number) => {
    if (!quiz) return;
    const idx = quizIndex;
    const q = quiz[idx];
    const correct = value === q.a * q.b;
    const next = [...quiz];
    next[idx] = { ...q, answer: value, correct };
    setQuiz(next);

    if (correct) {
      playSound("correct");
      vibrate(80);
      const lastIndex = quizCount - 1;
      if (idx >= lastIndex) {
        prepareLandingSpace();
        setPaused(false);
        setQuiz(null); // hide quiz entirely
        setMessage(null);
        focusCanvas();
      } else {
        setTimeout(() => setQuizIndex(idx + 1), 200);
      }
    } else {
      setMessage("Try again! ✏️");
      playSound("wrong");
      vibrate([60, 30, 60]);
      setTimeout(() => setMessage(null), 900);
    }
  };

  return (
    <div className="w-screen h-[100dvh] bg-sky-100 flex flex-col lg:flex-row">
      <div ref={gameAreaRef} className="relative flex-1 h-full overflow-hidden">
        {/* Base world canvas */}
        <canvas
          ref={canvasRef}
          className="touch-none w-full h-full block"
          aria-label="Rabbit jump game canvas"
          tabIndex={0}
        />

        {/* HUD (score only) - mobile/tablet only */}
        {!isDesktop && (
          <div className="absolute left-2 top-2 select-none z-20">
            <div className="px-3 py-1 rounded-xl bg-white/80 backdrop-blur border border-white/70 shadow text-slate-900 text-sm md:text-base font-semibold">
              Score: {score}
            </div>
          </div>
        )}

        {/* Non-blocking toast message - mobile/tablet only */}
        {message && !isDesktop && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/70 text-white text-sm md:text-base shadow z-30">
            {message}
          </div>
        )}

        {/* Win overlay - mobile/tablet only */}
        {won && !isDesktop && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-40"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white/95 p-6 shadow-xl space-y-4 text-center">
              <h2 className="text-2xl font-bold">You finished! 🏁</h2>
              <p className="text-slate-700">Final score: {score}</p>
              <div className="flex gap-3 justify-center">
                <button
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                  onClick={() => {
                    // reset to start screen
                    const g = gameRef.current;
                    g.flowers = [];
                    g.speed = 260;
                    g.speedBoosted = false;
                    g.spawnedFinish = false;
                    g.finishX = null;
                    g.finished = false;
                    g.celebrationTimer = 0;
                    g.celebrationPhase = 0;
                    g.rabbit = {
                      ...g.rabbit,
                      y: g.groundY - g.rabbit.h,
                      vy: 0,
                    };
                    g.jumpsAvailable = 2;
                    g.time = 0;
                    setScore(0);
                    setWon(false);
                    setStarted(false); // show start overlay again
                    setMessage(null);
                  }}
                >
                  Play again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Overlay with configurable question count - mobile/tablet only */}
        {!isDesktop && !started && !won && (
          <div
            className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-40"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-4">
              <h2 className="text-xl font-bold">Rabbit Jump ×9</h2>
              <p className="text-slate-600">
                Tap/click or press Space to jump over flowers. If you hit a flower, answer ×9 questions to continue.
              </p>

              <label className="text-sm font-medium block">
                Number of questions on hit
                <select
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={quizCount}
                  onChange={(e) => setQuizCount(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={askOnHit}
                  onChange={(e) => setAskOnHit(e.target.checked)}
                />
                Ask multiplication quiz after a hit
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={effectsEnabled}
                  onChange={(e) => setEffectsEnabled(e.target.checked)}
                />
                Sound & vibration effects
              </label>

              <button
                className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                onClick={() => {
                  // reset state for a fresh run
                  const g = gameRef.current;
                  g.flowers = [];
                  g.speed = 260;
                  g.speedBoosted = false;
                  g.spawnedFinish = false;
                  g.finishX = null;
                  g.finished = false;
                  g.celebrationTimer = 0;
                  g.celebrationPhase = 0;
                  g.rabbit = { ...g.rabbit, y: g.groundY - g.rabbit.h, vy: 0 };
                  g.jumpsAvailable = 2;
                  g.time = 0;
                  setScore(0);
                  setStarted(true);
                  setMessage(null);
                  primeEffects();
                  focusCanvas();
                }}
              >
                Start
              </button>
            </div>
          </div>
        )}

        {/* Quiz Modal - mobile/tablet only */}
        {!isDesktop && paused && quiz && (
          <div
            className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-40"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <h2 className="text-xl font-bold mb-3">Answer ×9 to continue ({quizCount} total)</h2>
              <div className="flex gap-1 mb-3" aria-hidden>
                {quiz.map((q, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded ${
                      i < quizIndex
                        ? q.correct
                          ? "bg-green-500"
                          : "bg-red-500"
                        : i === quizIndex
                          ? q.correct === false
                            ? "bg-red-500"
                            : "bg-blue-500"
                          : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>

              <div className="grid gap-2 mt-1">
                <div className="text-lg font-medium">
                  {quiz[quizIndex].a} × {quiz[quizIndex].b} = ?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quiz[quizIndex].options.map((opt) => {
                    const correctAnswer = quiz[quizIndex].a * quiz[quizIndex].b;
                    const selected = quiz[quizIndex].answer === opt;
                    const isCorrect = selected && quiz[quizIndex].correct;
                    const isWrong = selected && quiz[quizIndex].correct === false;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleOptionSelect(opt)}
                        className={`w-full rounded-xl px-3 py-2 text-lg border font-semibold transition-colors ${
                          isCorrect
                            ? "bg-green-100 border-green-400 text-green-700"
                            : isWrong
                              ? "bg-red-100 border-red-400 text-red-700"
                              : "bg-white border-slate-300 hover:border-blue-400"
                        }`}
                        aria-label={`Answer ${opt}`}
                      >
                        {opt}
                        {opt === correctAnswer && isCorrect ? " ✅" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-slate-600 text-sm">
                Tip: press <kbd className="px-1 py-0.5 border rounded">Space</kbd> / tap to jump.
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[360px] max-w-[420px] flex-col border-l border-slate-200 bg-white/70 backdrop-blur p-4 gap-4">
        {/* Score */}
        <div className="select-none">
          <div className="px-3 py-1 rounded-xl bg-white border border-white/70 shadow text-slate-900 text-sm md:text-base font-semibold">
            Score: {score}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="px-3 py-1.5 rounded-full bg-black/70 text-white text-sm shadow self-start">{message}</div>
        )}

        {/* Start Panel */}
        {!started && !won && (
          <div className="rounded-2xl bg-white p-5 shadow border">
            <h2 className="text-xl font-bold mb-2">Rabbit Jump ×9</h2>
            <p className="text-slate-600 mb-3">
              Press Space to jump. If you hit a flower, answer ×9 questions to continue.
            </p>
            <label className="text-sm font-medium block">
              Number of questions on hit
              <select
                className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                value={quizCount}
                onChange={(e) => setQuizCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium mt-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={askOnHit}
                onChange={(e) => setAskOnHit(e.target.checked)}
              />
              Ask multiplication quiz after a hit
            </label>
            <label className="flex items-center gap-2 text-sm font-medium mt-1">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={effectsEnabled}
                onChange={(e) => setEffectsEnabled(e.target.checked)}
              />
              Sound & vibration effects
            </label>
            <button
              className="mt-4 w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
              onClick={() => {
                // reset state for a fresh run
                const g = gameRef.current;
                g.flowers = [];
                g.speed = 260;
                g.speedBoosted = false;
                g.spawnedFinish = false;
                g.finishX = null;
                g.finished = false;
                g.celebrationTimer = 0;
                g.celebrationPhase = 0;
                g.rabbit = { ...g.rabbit, y: g.groundY - g.rabbit.h, vy: 0 };
                g.jumpsAvailable = 2;
                g.time = 0;
                setScore(0);
                setStarted(true);
                setMessage(null);
                primeEffects();
                focusCanvas();
              }}
            >
              Start
            </button>
          </div>
        )}

        {/* Quiz Panel */}
        {isDesktop && paused && quiz && (
          <div className="rounded-2xl bg-white p-5 shadow border">
            <h2 className="text-xl font-bold mb-3">Answer ×9 to continue ({quizCount} total)</h2>
            <div className="flex gap-1 mb-3" aria-hidden>
              {quiz.map((q, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${
                    i < quizIndex
                      ? q.correct
                        ? "bg-green-500"
                        : "bg-red-500"
                      : i === quizIndex
                        ? q.correct === false
                          ? "bg-red-500"
                          : "bg-blue-500"
                        : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
            <div className="grid gap-2 mt-1">
              <div className="text-lg font-medium">
                {quiz[quizIndex].a} × {quiz[quizIndex].b} = ?
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quiz[quizIndex].options.map((opt) => {
                  const correctAnswer = quiz[quizIndex].a * quiz[quizIndex].b;
                  const selected = quiz[quizIndex].answer === opt;
                  const isCorrect = selected && quiz[quizIndex].correct;
                  const isWrong = selected && quiz[quizIndex].correct === false;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleOptionSelect(opt)}
                      className={`w-full rounded-xl px-3 py-2 text-lg border font-semibold transition-colors ${
                        isCorrect
                          ? "bg-green-100 border-green-400 text-green-700"
                          : isWrong
                            ? "bg-red-100 border-red-400 text-red-700"
                            : "bg-white border-slate-300 hover:border-blue-400"
                      }`}
                      aria-label={`Answer ${opt}`}
                    >
                      {opt}
                      {opt === correctAnswer && isCorrect ? " ✅" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-3 text-slate-600 text-sm">
              Tip: press <kbd className="px-1 py-0.5 border rounded">Space</kbd> / click to jump.
            </p>
          </div>
        )}

        {/* Win Panel */}
        {isDesktop && won && (
          <div className="rounded-2xl bg-white p-5 shadow border text-center space-y-4">
            <h2 className="text-2xl font-bold">You finished! 🏁</h2>
            <p className="text-slate-700">Final score: {score}</p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                onClick={() => {
                  // reset to start screen
                  const g = gameRef.current;
                  g.flowers = [];
                  g.speed = 260;
                  g.speedBoosted = false;
                  g.spawnedFinish = false;
                  g.finishX = null;
                  g.finished = false;
                  g.celebrationTimer = 0;
                  g.celebrationPhase = 0;
                  g.rabbit = { ...g.rabbit, y: g.groundY - g.rabbit.h, vy: 0 };
                  g.jumpsAvailable = 2;
                  g.time = 0;
                  setScore(0);
                  setWon(false);
                  setStarted(false); // show start overlay again
                  setMessage(null);
                }}
              >
                Play again
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
