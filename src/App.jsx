import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import appLogo from "../dkahramanlar.png";
import puzzleA1 from "../atakim_1-puzzle.png";
import puzzleA2 from "../atakim_2-puzzle.png";
import puzzleB1 from "../btakim_1-puzzle.png";
import puzzleB2 from "../btakim_2-puzzle.png";
import balloonPopSfx from "./assets/audio/balloon-pop.mp3";
import gameplayLoopMusic from "./assets/audio/gameplay-loop.mp3";
import tensionLoopMusic from "./assets/audio/tension-loop.mp3";
import winnerLoopMusic from "./assets/audio/winner-loop.mp3";
import defaultSession from "./data/defaultSession.json";
import questionBank from "./data/questions.json";
import wormQuestionBank from "./data/wormQuestions.json";

const STORAGE_KEY = "dijital-kahramanlar-session";
const GROUP_KEYS = ["A", "B"];
const FALLBACK_QUESTION_BANK = {
  A: [
    {
      question: "A Soru 1",
      answerOptions: [
        {
          text: "Doğru",
          rationale: "",
          isCorrect: true
        },
        {
          text: "Yanlış",
          rationale: "",
          isCorrect: false
        }
      ],
      hint: ""
    },
    {
      question: "A Soru 2",
      answerOptions: [
        {
          text: "Doğru",
          rationale: "",
          isCorrect: false
        },
        {
          text: "Yanlış",
          rationale: "",
          isCorrect: true
        }
      ],
      hint: ""
    },
    {
      question: "A Soru 3",
      answerOptions: [
        {
          text: "Doğru",
          rationale: "",
          isCorrect: true
        },
        {
          text: "Yanlış",
          rationale: "",
          isCorrect: false
        }
      ],
      hint: ""
    }
  ],
  B: [
    {
      question: "B Soru 1",
      answerOptions: [
        {
          text: "Doğru",
          rationale: "",
          isCorrect: true
        },
        {
          text: "Yanlış",
          rationale: "",
          isCorrect: false
        }
      ],
      hint: ""
    },
    {
      question: "B Soru 2",
      answerOptions: [
        {
          text: "Doğru",
          rationale: "",
          isCorrect: false
        },
        {
          text: "Yanlış",
          rationale: "",
          isCorrect: true
        }
      ],
      hint: ""
    },
    {
      question: "B Soru 3",
      answerOptions: [
        {
          text: "Doğru",
          rationale: "",
          isCorrect: true
        },
        {
          text: "Yanlış",
          rationale: "",
          isCorrect: false
        }
      ],
      hint: ""
    }
  ]
};
const FALLBACK_GAME = {
  id: "balloon",
  title: "Balon Oyunu",
  durationSeconds: 90,
  pointsPerCorrect: 10,
  pointsPerWrong: 0
};
const WORM_GRID = {
  cols: 20,
  rows: 12
};
const WORM_STEP_MS = 280;
const WORM_DIRECTION_PRESETS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};
const PUZZLE_GRID = {
  cols: 3,
  rows: 3
};
const PUZZLE_PREVIEW_SECONDS = 3;
const PUZZLE_SCATTER_MS = 760;
const TENSION_THRESHOLD_SECONDS = 15;
const PUZZLE_IMAGE_POOLS = {
  A: [puzzleA1, puzzleA2],
  B: [puzzleB1, puzzleB2]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randomFromList(values, fallbackValue = null) {
  if (!Array.isArray(values) || values.length === 0) {
    return fallbackValue;
  }

  return values[Math.floor(Math.random() * values.length)];
}

function shuffle(values) {
  const nextValues = [...values];

  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = nextValues[index];
    nextValues[index] = nextValues[swapIndex];
    nextValues[swapIndex] = temp;
  }

  return nextValues;
}

function normalizeGroup(baseGroup, group) {
  return {
    ...baseGroup,
    ...(group ?? {}),
    score: Number.isFinite(group?.score) ? Math.max(0, group.score) : baseGroup.score,
    completedGames: Array.isArray(group?.completedGames)
      ? group.completedGames
      : []
  };
}

function normalizeTurn(baseTurn, turn) {
  return {
    ...baseTurn,
    ...(turn ?? {})
  };
}

function getFallbackQuestions(groupKey) {
  return FALLBACK_QUESTION_BANK[groupKey] ?? FALLBACK_QUESTION_BANK.A;
}

function normalizeAnswerOption(option, fallbackOption) {
  return {
    text: option?.text || fallbackOption.text,
    rationale: option?.rationale || fallbackOption.rationale || "",
    isCorrect:
      typeof option?.isCorrect === "boolean"
        ? option.isCorrect
        : fallbackOption.isCorrect
  };
}

function normalizeAnswerOptions(question, fallbackQuestion) {
  const rawOptions = Array.isArray(question?.answerOptions)
    ? question.answerOptions
    : [];
  const fallbackOptions = fallbackQuestion.answerOptions;
  const trueOption =
    rawOptions.find((option) => option?.text === "Doğru") ??
    (question?.correctAnswer
      ? {
          text: "Doğru",
          rationale: "",
          isCorrect: question.correctAnswer === "Doğru"
        }
      : null) ??
    fallbackOptions[0];
  const falseOption =
    rawOptions.find((option) => option?.text === "Yanlış") ??
    (question?.wrongAnswer
      ? {
          text: "Yanlış",
          rationale: "",
          isCorrect: question.correctAnswer === "Yanlış"
        }
      : null) ??
    fallbackOptions[1];

  return [
    normalizeAnswerOption(trueOption, fallbackOptions[0]),
    normalizeAnswerOption(falseOption, fallbackOptions[1])
  ];
}

function normalizeQuestion(question, index, groupKey = "A") {
  const fallbackQuestions = getFallbackQuestions(groupKey);
  const fallbackQuestion = fallbackQuestions[index % fallbackQuestions.length];

  return {
    questionNumber: question?.questionNumber ?? index + 1,
    question: question?.question || fallbackQuestion.question,
    imageUrl: question?.imageUrl || "",
    answerOptions: normalizeAnswerOptions(question, fallbackQuestion),
    hint: question?.hint || fallbackQuestion.hint || "",
    difficulty: question?.difficulty || "medium"
  };
}

function inferDifficultyFromQuestionNumber(questionNumber) {
  if (questionNumber <= 17) {
    return "easy";
  }

  if (questionNumber <= 33) {
    return "medium";
  }

  return "hard";
}

function getPointValueFromDifficulty(difficulty) {
  if (difficulty === "easy") {
    return 10;
  }

  if (difficulty === "hard") {
    return 30;
  }

  return 20;
}

function getPointValueFromIndex(indexInGroup) {
  if (indexInGroup < 10) {
    return 10;
  }

  if (indexInGroup < 20) {
    return 20;
  }

  return 30;
}

function getWormPointValue(question, indexInGroup) {
  const explicitValue = Number(question?.pointValue);
  if ([10, 20, 30].includes(explicitValue)) {
    return explicitValue;
  }

  if (typeof question?.difficulty === "string") {
    return getPointValueFromDifficulty(question.difficulty);
  }

  return getPointValueFromIndex(indexInGroup);
}

function normalizeGame(game, index = 0) {
  const baseGame = defaultSession.games?.[index] ?? FALLBACK_GAME;
  const { questions, ...gameWithoutQuestions } = game ?? {};

  return {
    ...FALLBACK_GAME,
    ...baseGame,
    ...gameWithoutQuestions
  };
}

function normalizeGames(rawGames, baseGames) {
  const sessionGames = Array.isArray(rawGames) ? rawGames : [];
  const defaults = Array.isArray(baseGames) && baseGames.length > 0
    ? baseGames
    : [FALLBACK_GAME];

  const requiredGames = defaults.map((defaultGame, index) => {
    const byId = sessionGames.find((sessionGame) => sessionGame?.id === defaultGame.id);
    const selectedGame = byId ?? sessionGames[index] ?? defaultGame;

    return normalizeGame(selectedGame, index);
  });

  const requiredIds = new Set(requiredGames.map((game) => game.id));
  const extraGames = sessionGames
    .filter((sessionGame) => sessionGame?.id && !requiredIds.has(sessionGame.id))
    .map((sessionGame, index) => normalizeGame(sessionGame, defaults.length + index));

  return [...requiredGames, ...extraGames];
}

function getQuestionsForGroup(gameId, groupKey) {
  const fallbackQuestions = getFallbackQuestions(groupKey);

  if (gameId === "worm") {
    const rawWormQuestions = Array.isArray(wormQuestionBank?.questions)
      ? wormQuestionBank.questions
      : [];
    let selectedPool = [];

    if (rawWormQuestions.length >= 50) {
      selectedPool =
        groupKey === "A"
          ? rawWormQuestions.slice(0, 25)
          : rawWormQuestions.slice(25, 50);
    } else {
      const splitByGroup = rawWormQuestions.filter((_, index) =>
        groupKey === "A" ? index % 2 === 0 : index % 2 === 1
      );
      selectedPool = splitByGroup.length > 0 ? splitByGroup : rawWormQuestions;
    }

    if (selectedPool.length === 0) {
      const normalizedFallbackQuestions = fallbackQuestions.map((question, index) =>
        normalizeQuestion(
          {
            ...question,
            difficulty: "easy",
            pointValue: 10
          },
          index,
          groupKey
        )
      );

      return shuffle(normalizedFallbackQuestions);
    }

    const normalizedWormQuestions = selectedPool.map((question, index) =>
      normalizeQuestion(
        {
          ...question,
          difficulty:
            question?.difficulty ??
            inferDifficultyFromQuestionNumber(question?.questionNumber ?? index + 1),
          pointValue: getWormPointValue(question, index)
        },
        index,
        groupKey
      )
    );

    return shuffle(normalizedWormQuestions);
  }

  const groupQuestionSet = questionBank?.[gameId]?.[groupKey];
  const rawQuestions = Array.isArray(groupQuestionSet)
    ? groupQuestionSet
    : groupQuestionSet?.questions;
  const questions =
    Array.isArray(rawQuestions) && rawQuestions.length > 0
      ? rawQuestions
      : fallbackQuestions;

  const normalizedQuestions = questions.map((question, index) =>
    normalizeQuestion(question, index, groupKey)
  );

  return shuffle(normalizedQuestions);
}

function normalizeSession(rawSession) {
  const base = clone(defaultSession);

  if (
    !rawSession ||
    typeof rawSession !== "object" ||
    rawSession.schemaVersion !== base.schemaVersion
  ) {
    return {
      ...base,
      games: normalizeGames(base.games, base.games)
    };
  }

  const games = normalizeGames(rawSession.games, base.games);

  return {
    ...base,
    ...rawSession,
    timer: {
      ...base.timer,
      ...(rawSession.timer ?? {})
    },
    groups: {
      A: normalizeGroup(base.groups.A, rawSession.groups?.A),
      B: normalizeGroup(base.groups.B, rawSession.groups?.B)
    },
    gameState: {
      ...base.gameState,
      ...(rawSession.gameState ?? {}),
      transition: {
        ...base.gameState.transition,
        ...(rawSession.gameState?.transition ?? {})
      },
      turns: {
        A: normalizeTurn(base.gameState.turns.A, rawSession.gameState?.turns?.A),
        B: normalizeTurn(base.gameState.turns.B, rawSession.gameState?.turns?.B)
      }
    },
    games
  };
}

function getBrowserSession() {
  try {
    const savedSession = window.localStorage.getItem(STORAGE_KEY);
    return savedSession ? JSON.parse(savedSession) : clone(defaultSession);
  } catch {
    return clone(defaultSession);
  }
}

const sessionStore = {
  async getData() {
    if (window.appAPI?.getData) {
      return window.appAPI.getData();
    }

    return getBrowserSession();
  },
  async saveData(appData) {
    if (window.appAPI?.saveData) {
      return window.appAPI.saveData(appData);
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    return true;
  },
  async resetData() {
    if (window.appAPI?.resetData) {
      return window.appAPI.resetData();
    }

    const resetSession = clone(defaultSession);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resetSession));
    return resetSession;
  }
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isSameCell(cellA, cellB) {
  return cellA.x === cellB.x && cellA.y === cellB.y;
}

function createInitialSnake() {
  return [
    { x: 7, y: 6 },
    { x: 6, y: 6 },
    { x: 5, y: 6 }
  ];
}

function spawnFoodAtRandomCell(occupied, value) {
  let attempts = 0;

  while (attempts < 160) {
    const x = Math.floor(Math.random() * WORM_GRID.cols);
    const y = Math.floor(Math.random() * WORM_GRID.rows);
    const key = `${x}-${y}`;

    if (!occupied.has(key)) {
      occupied.add(key);
      return { x, y, value };
    }

    attempts += 1;
  }

  const fallbackX = Math.floor(Math.random() * WORM_GRID.cols);
  const fallbackY = Math.floor(Math.random() * WORM_GRID.rows);
  occupied.add(`${fallbackX}-${fallbackY}`);

  return {
    x: fallbackX,
    y: fallbackY,
    value
  };
}

function spawnWormFoods(snakeCells, foodValues) {
  const values = Array.isArray(foodValues) && foodValues.length > 0
    ? [...new Set(foodValues)]
    : [10, 20, 30];
  const occupied = new Set(snakeCells.map((cell) => `${cell.x}-${cell.y}`));

  return values.map((value) => spawnFoodAtRandomCell(occupied, value));
}

function getWormGrowthByValue(value) {
  const safeValue = Number.isFinite(value) ? value : 10;
  return Math.max(2, Math.floor(safeValue / 10) + 1);
}

function buildPuzzlePieces(cols, rows) {
  return Array.from({ length: cols * rows }, (_, index) => ({
    id: index,
    row: Math.floor(index / cols),
    col: index % cols
  }));
}

function getPuzzlePieceBackgroundStyle(piece, imageUrl, cols, rows) {
  const xRatio = cols > 1 ? piece.col / (cols - 1) : 0;
  const yRatio = rows > 1 ? piece.row / (rows - 1) : 0;

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${xRatio * 100}% ${yRatio * 100}%`
  };
}

function getTimeLeft(session, now) {
  if (session.roundStatus !== "running" || !session.timer.endsAt) {
    return session.timer.durationSeconds;
  }

  const endsAt = new Date(session.timer.endsAt).getTime();

  if (!Number.isFinite(endsAt)) {
    return 0;
  }

  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

function getWinner(groups) {
  if (groups.A.score === groups.B.score) {
    return "Beraberlik";
  }

  return groups.A.score > groups.B.score ? "A Grubu Kazandı" : "B Grubu Kazandı";
}

function getAnswerChoices(question) {
  return Array.isArray(question?.answerOptions)
    ? question.answerOptions
    : [];
}

function App() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const dataRef = useRef(null);
  const audioRefs = useRef(null);

  const unlockAudio = useCallback(() => {
    setAudioUnlocked(true);
  }, []);

  useEffect(() => {
    const gameplay = new Audio(gameplayLoopMusic);
    gameplay.loop = true;
    gameplay.preload = "auto";
    gameplay.volume = 0.36;

    const tension = new Audio(tensionLoopMusic);
    tension.loop = true;
    tension.preload = "auto";
    tension.volume = 0.42;

    const winner = new Audio(winnerLoopMusic);
    winner.loop = true;
    winner.preload = "auto";
    winner.volume = 0.38;

    const pop = new Audio(balloonPopSfx);
    pop.preload = "auto";
    pop.volume = 0.95;

    audioRefs.current = {
      gameplay,
      tension,
      winner,
      pop,
      activeTrack: "none"
    };

    return () => {
      [gameplay, tension, winner, pop].forEach((track) => {
        track.pause();
        track.currentTime = 0;
      });
      audioRefs.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioUnlocked) {
      return undefined;
    }

    const handleUnlock = () => {
      setAudioUnlocked(true);
    };

    window.addEventListener("pointerdown", handleUnlock, { once: true });
    window.addEventListener("keydown", handleUnlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleUnlock);
      window.removeEventListener("keydown", handleUnlock);
    };
  }, [audioUnlocked]);

  const persistSession = useCallback(async (nextSession) => {
    const normalizedSession = normalizeSession(nextSession);
    dataRef.current = normalizedSession;
    setData(normalizedSession);
    await sessionStore.saveData(normalizedSession);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const savedSession = await sessionStore.getData();
        const normalizedSession = normalizeSession(savedSession);

        if (isMounted) {
          dataRef.current = normalizedSession;
          setData(normalizedSession);
        }

        await sessionStore.saveData(normalizedSession);
      } catch (error) {
        if (isMounted) {
          setLoadError("Oturum verisi okunamadı.");
        }

        console.error(error);
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeGame = data?.games[data.activeGameIndex] ?? data?.games[0];
  const activeTurn = data?.gameState.turns[data.activeGroup];
  const activeQuestions = useMemo(() => {
    return getQuestionsForGroup(
      activeGame?.id ?? FALLBACK_GAME.id,
      data?.activeGroup ?? "A"
    );
  }, [activeGame?.id, data?.activeGroup]);
  const timeLeft = useMemo(() => {
    if (!data) return 0;
    return getTimeLeft(data, now);
  }, [data, now]);

  useEffect(() => {
    const tracks = audioRefs.current;
    if (!tracks) {
      return;
    }

    const pauseBackground = () => {
      tracks.gameplay.pause();
      tracks.tension.pause();
      tracks.winner.pause();
      tracks.activeTrack = "none";
    };

    if (!audioUnlocked || !data) {
      pauseBackground();
      return;
    }

    let nextTrack = "none";

    if (data.phase === "winner") {
      nextTrack = "winner";
    } else if (data.phase === "playing") {
      const inTensionWindow =
        data.roundStatus === "running" &&
        timeLeft > 0 &&
        timeLeft <= TENSION_THRESHOLD_SECONDS;
      nextTrack = inTensionWindow ? "tension" : "gameplay";
    } else if (data.phase === "balloonTransition" || data.phase === "intro") {
      nextTrack = "gameplay";
    }

    if (tracks.activeTrack === nextTrack) {
      return;
    }

    [tracks.gameplay, tracks.tension, tracks.winner].forEach((track) => {
      track.pause();
      track.currentTime = 0;
    });

    tracks.activeTrack = nextTrack;

    if (nextTrack === "none") {
      return;
    }

    const targetTrack =
      nextTrack === "winner"
        ? tracks.winner
        : nextTrack === "tension"
          ? tracks.tension
          : tracks.gameplay;

    targetTrack.play().catch(() => {});
  }, [audioUnlocked, data, timeLeft]);

  const resetProgress = useCallback(async () => {
    const resetSession = await sessionStore.resetData();
    const normalizedSession = normalizeSession(resetSession);
    dataRef.current = normalizedSession;
    setData(normalizedSession);
  }, []);

  const createSessionForGame = useCallback((gameId = null) => {
    const nextSession = normalizeSession(clone(defaultSession));
    const requestedGameIndex = gameId
      ? nextSession.games.findIndex((game) => game.id === gameId)
      : 0;
    const activeGameIndex = requestedGameIndex >= 0 ? requestedGameIndex : 0;

    nextSession.phase = "playing";
    nextSession.activeGameIndex = activeGameIndex;
    nextSession.activeGroup = "A";
    nextSession.roundStatus = "idle";
    nextSession.gameState.turns = clone(defaultSession.gameState.turns);
    nextSession.gameState.transition = clone(defaultSession.gameState.transition);
    nextSession.timer = {
      durationSeconds: nextSession.games[activeGameIndex]?.durationSeconds ?? 90,
      startedAt: null,
      endsAt: null
    };

    return nextSession;
  }, []);

  const startSession = useCallback(async () => {
    unlockAudio();
    await persistSession(createSessionForGame());
  }, [createSessionForGame, persistSession, unlockAudio]);

  const startTurn = useCallback(async () => {
    if (!data || data.phase !== "playing" || data.roundStatus === "running") {
      return;
    }

    unlockAudio();

    const startedAt = Date.now();
    const durationSeconds = activeGame?.durationSeconds ?? 90;
    const nextSession = clone(data);
    const turn = nextSession.gameState.turns[nextSession.activeGroup];

    turn.status = "running";
    turn.questionIndex = 0;
    nextSession.roundStatus = "running";
    nextSession.timer = {
      durationSeconds,
      startedAt: new Date(startedAt).toISOString(),
      endsAt: new Date(startedAt + durationSeconds * 1000).toISOString()
    };

    setNow(startedAt);
    await persistSession(nextSession);
  }, [activeGame, data, persistSession, unlockAudio]);

  const finishTurn = useCallback(async () => {
    const currentSession = dataRef.current;
    if (!currentSession || currentSession.phase !== "playing") {
      return;
    }

    const nextSession = clone(currentSession);
    const groupKey = nextSession.activeGroup;
    const activeGroupTurn = nextSession.gameState.turns[groupKey];
    const currentGame =
      nextSession.games[nextSession.activeGameIndex] ?? FALLBACK_GAME;

    activeGroupTurn.status = "finished";
    nextSession.roundStatus = "idle";
    nextSession.timer = {
      durationSeconds: currentGame?.durationSeconds ?? 90,
      startedAt: null,
      endsAt: null
    };

    if (currentGame?.id) {
      const completedGames = new Set(nextSession.groups[groupKey].completedGames);
      completedGames.add(currentGame.id);
      nextSession.groups[groupKey].completedGames = [...completedGames];
    }

    if (groupKey === "A") {
      nextSession.activeGroup = "B";
    } else {
      const nextGameIndex = nextSession.activeGameIndex + 1;

      if (currentGame?.id === "balloon") {
        nextSession.phase = "balloonTransition";
        nextSession.roundStatus = "transition";
        nextSession.gameState.transition.balloonPopped = false;
      } else if (nextGameIndex < nextSession.games.length) {
        nextSession.phase = "playing";
        nextSession.roundStatus = "idle";
        nextSession.activeGameIndex = nextGameIndex;
        nextSession.activeGroup = "A";
        nextSession.timer = {
          durationSeconds: nextSession.games[nextGameIndex]?.durationSeconds ?? 90,
          startedAt: null,
          endsAt: null
        };
        nextSession.gameState.turns = clone(defaultSession.gameState.turns);
      } else {
        nextSession.phase = "winner";
        nextSession.roundStatus = "complete";
      }
    }

    await persistSession(nextSession);
  }, [persistSession]);

  const addScoreToActiveGroup = useCallback(
    async (amount) => {
      const currentSession = dataRef.current;
      if (!currentSession || currentSession.phase !== "playing") {
        return;
      }

      const nextSession = clone(currentSession);
      const groupKey = nextSession.activeGroup;

      nextSession.groups[groupKey].score = Math.max(
        0,
        nextSession.groups[groupKey].score + amount
      );
      await persistSession(nextSession);
    },
    [persistSession]
  );

  const popTransitionBalloon = useCallback(async () => {
    if (!data || data.phase !== "balloonTransition") {
      return;
    }

    const popTrack = audioRefs.current?.pop;
    if (popTrack) {
      popTrack.currentTime = 0;
      popTrack.play().catch(() => {});
    }

    const nextSession = clone(data);
    nextSession.gameState.transition.balloonPopped = true;
    await persistSession(nextSession);
  }, [data, persistSession]);

  const continueToNextSection = useCallback(async () => {
    if (!data || data.phase !== "balloonTransition") {
      return;
    }

    const nextSession = clone(data);
    const nextGameIndex = nextSession.activeGameIndex + 1;

    nextSession.gameState.transition.balloonPopped = false;

    if (nextGameIndex < nextSession.games.length) {
      nextSession.phase = "playing";
      nextSession.roundStatus = "idle";
      nextSession.activeGameIndex = nextGameIndex;
      nextSession.activeGroup = "A";
      nextSession.timer = {
        durationSeconds: nextSession.games[nextGameIndex]?.durationSeconds ?? 90,
        startedAt: null,
        endsAt: null
      };
      nextSession.gameState.turns = clone(defaultSession.gameState.turns);
    } else {
      nextSession.phase = "winner";
      nextSession.roundStatus = "complete";
    }

    await persistSession(nextSession);
  }, [data, persistSession]);

  const answerQuestion = useCallback(
    async (isCorrect) => {
      if (
        !data ||
        data.phase !== "playing" ||
        data.roundStatus !== "running" ||
        activeQuestions.length === 0
      ) {
        return;
      }

      const nextSession = clone(data);
      const groupKey = nextSession.activeGroup;
      const turn = nextSession.gameState.turns[groupKey];

      turn.answered += 1;
      turn.questionIndex = (turn.questionIndex + 1) % activeQuestions.length;

      if (isCorrect) {
        turn.correct += 1;
        turn.balloonLevel += 1;
        nextSession.groups[groupKey].score = Math.max(
          0,
          nextSession.groups[groupKey].score + (activeGame.pointsPerCorrect ?? 10)
        );
      } else {
        const configuredWrongPenalty = Number.isFinite(activeGame.pointsPerWrong)
          ? activeGame.pointsPerWrong
          : -10;
        const wrongPenalty = configuredWrongPenalty < 0 ? configuredWrongPenalty : -10;
        nextSession.groups[groupKey].score = Math.max(
          0,
          nextSession.groups[groupKey].score + wrongPenalty
        );
        turn.balloonLevel = Math.max(0, turn.balloonLevel - 1);
      }

      await persistSession(nextSession);
    },
    [activeGame, activeQuestions.length, data, persistSession]
  );

  useEffect(() => {
    if (data?.roundStatus !== "running") {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(timerId);
  }, [data?.roundStatus]);

  useEffect(() => {
    if (!data || data.roundStatus !== "running" || timeLeft > 0) {
      return;
    }

    finishTurn();
  }, [data, finishTurn, timeLeft]);

  if (loadError) {
    return (
      <main className="app-screen center-screen">
        <div className="status-text">{loadError}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-screen center-screen">
        <div className="status-text">Yükleniyor...</div>
      </main>
    );
  }

  if (data.phase === "playing") {
    if (activeGame?.id === "worm") {
      return (
        <WormGame
          activeGame={activeGame}
          activeGroup={data.activeGroup}
          groups={data.groups}
          isRunning={data.roundStatus === "running"}
          onAddScore={addScoreToActiveGroup}
          onReset={resetProgress}
          onStartTurn={startTurn}
          timeLeft={timeLeft}
        />
      );
    }

    if (activeGame?.id === "puzzle") {
      return (
        <PuzzleGame
          activeGame={activeGame}
          activeGroup={data.activeGroup}
          groups={data.groups}
          isRunning={data.roundStatus === "running"}
          onAddScore={addScoreToActiveGroup}
          onCompleteTurn={finishTurn}
          onReset={resetProgress}
          onStartTurn={startTurn}
          timeLeft={timeLeft}
        />
      );
    }

    return (
      <BalloonGame
        activeGame={activeGame}
        activeGroup={data.activeGroup}
        activeTurn={activeTurn}
        groups={data.groups}
        isRunning={data.roundStatus === "running"}
        onAnswer={answerQuestion}
        onReset={resetProgress}
        onStartTurn={startTurn}
        questions={activeQuestions}
        timeLeft={timeLeft}
      />
    );
  }

  if (data.phase === "winner") {
    return <WinnerScreen groups={data.groups} onRestart={resetProgress} />;
  }

  if (data.phase === "balloonTransition") {
    return (
      <BalloonTransitionScreen
        onContinue={continueToNextSection}
        onPop={popTransitionBalloon}
        onReset={resetProgress}
        popped={data.gameState.transition.balloonPopped}
      />
    );
  }

  return <IntroScreen onStart={startSession} />;
}

function IntroScreen({ onStart }) {
  return (
    <main className="app-screen center-screen intro-screen">
      <img
        className="home-logo"
        src={appLogo}
        alt="Dijital Kahramanlar"
      />
      <button className="pixel-button start-button" onClick={onStart}>
        Başla
      </button>
    </main>
  );
}

function BalloonGame({
  activeGame,
  activeGroup,
  activeTurn,
  groups,
  isRunning,
  onAnswer,
  onReset,
  onStartTurn,
  questions,
  timeLeft
}) {
  const questionIndex = activeTurn?.questionIndex ?? 0;
  const safeQuestionIndex =
    questions.length > 0 ? questionIndex % questions.length : 0;
  const question = questions[safeQuestionIndex] ?? getFallbackQuestions(activeGroup)[0];
  const choices = getAnswerChoices(question);
  const balloonLevel = activeTurn?.balloonLevel ?? 0;
  const bubbleSize = Math.min(560, 150 + balloonLevel * 42);

  return (
    <main className="app-screen game-screen">
      <header className="game-header">
        <ScoreBox label="A Grubu" score={groups.A.score} active={activeGroup === "A"} />
        <div className="timer-box">{formatTime(timeLeft)}</div>
        <ScoreBox label="B Grubu" score={groups.B.score} active={activeGroup === "B"} />
      </header>

      {!isRunning ? (
        <section className="turn-start" aria-label="Tur başlangıcı">
          <div className="turn-label">{groups[activeGroup].name}</div>
          <button className="pixel-button start-button" onClick={onStartTurn}>
            Başlat
          </button>
          <button className="pixel-button small-button reset-button" onClick={onReset}>
            Sıfırla
          </button>
        </section>
      ) : (
        <section className="balloon-stage" aria-label="Balon oyunu">
          <button className="pixel-button small-button reset-button" onClick={onReset}>
            Sıfırla
          </button>
          <div
            className="question-bubble"
            key={`${activeGroup}-${balloonLevel}`}
            style={{ "--bubble-size": `${bubbleSize}px` }}
          >
            <span className="balloon-shine" />
          </div>
          <div className="question-answer-block">
            <div className="question-card">{question?.question}</div>
            <div className="answer-row">
              {choices.map((choice) => (
                <button
                  className={`pixel-button answer-button ${
                    choice.text === "Doğru"
                      ? "true-answer-button"
                      : "false-answer-button"
                  }`}
                  key={`${choice.text}-${choice.isCorrect}`}
                  onClick={() => onAnswer(choice.isCorrect)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function ScoreBox({ active, label, score }) {
  return (
    <div className={`score-box ${active ? "active" : ""}`}>
      <span>{label}</span>
      <strong>{score}</strong>
    </div>
  );
}

function BalloonTransitionScreen({ onContinue, onPop, onReset, popped }) {
  const stageRef = useRef(null);
  const balloonRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [needlePosition, setNeedlePosition] = useState(null);

  const moveNeedle = useCallback((event) => {
    if (!dragging || !stageRef.current) {
      return;
    }

    const stageRect = stageRef.current.getBoundingClientRect();
    setNeedlePosition({
      x: event.clientX - stageRect.left,
      y: event.clientY - stageRect.top
    });
  }, [dragging]);

  const releaseNeedle = useCallback((event) => {
    if (!dragging) {
      return;
    }

    setDragging(false);

    if (!balloonRef.current) {
      setNeedlePosition(null);
      return;
    }

    const balloonRect = balloonRef.current.getBoundingClientRect();
    const hitBalloon =
      event.clientX >= balloonRect.left &&
      event.clientX <= balloonRect.right &&
      event.clientY >= balloonRect.top &&
      event.clientY <= balloonRect.bottom;

    if (hitBalloon) {
      onPop();
      return;
    }

    setNeedlePosition(null);
  }, [dragging, onPop]);

  const startNeedleDrag = useCallback((event) => {
    if (popped) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);

    if (stageRef.current) {
      const stageRect = stageRef.current.getBoundingClientRect();
      setNeedlePosition({
        x: event.clientX - stageRect.left,
        y: event.clientY - stageRect.top
      });
    }
  }, [popped]);

  return (
    <main className="app-screen game-screen pop-screen">
      <button className="pixel-button small-button reset-button" onClick={onReset}>
        Sıfırla
      </button>
      <section
        className="pop-stage"
        onPointerMove={moveNeedle}
        onPointerUp={releaseNeedle}
        ref={stageRef}
      >
        <div
          className={`transition-balloon ${popped ? "popped" : ""}`}
          ref={balloonRef}
        >
          <span className="balloon-shine" />
        </div>
        {popped ? (
          <div className="pop-particles" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : (
          <button
            aria-label="İğne"
            className={`needle-tool ${dragging ? "dragging" : ""} ${
              needlePosition ? "placed" : ""
            }`}
            onPointerDown={startNeedleDrag}
            style={
              needlePosition
                ? {
                    left: `${needlePosition.x}px`,
                    top: `${needlePosition.y}px`
                  }
                : undefined
            }
          >
            <span />
          </button>
        )}
        {popped ? (
          <button className="pixel-button start-button continue-button" onClick={onContinue}>
            Devam Et
          </button>
        ) : null}
      </section>
    </main>
  );
}

function WormGame({
  activeGame,
  activeGroup,
  groups,
  isRunning,
  onAddScore,
  onReset,
  onStartTurn,
  timeLeft
}) {
  const foodValues = Array.isArray(activeGame?.foodValues) && activeGame.foodValues.length > 0
    ? activeGame.foodValues
    : [10, 20, 30];
  const wormQuestions = useMemo(
    () => getQuestionsForGroup("worm", activeGroup),
    [activeGroup]
  );
  const questionsByValue = useMemo(() => {
    const buckets = {
      10: [],
      20: [],
      30: []
    };

    wormQuestions.forEach((question, index) => {
      const pointValue = getWormPointValue(question, index);
      if (buckets[pointValue]) {
        buckets[pointValue].push(question);
      } else {
        buckets[20].push(question);
      }
    });

    return buckets;
  }, [wormQuestions]);
  const [snakeCells, setSnakeCells] = useState(() => createInitialSnake());
  const [direction, setDirection] = useState(WORM_DIRECTION_PRESETS.right);
  const [foods, setFoods] = useState(() => spawnWormFoods(createInitialSnake(), foodValues));
  const [growth, setGrowth] = useState(0);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const questionQueueRef = useRef({
    10: [],
    20: [],
    30: []
  });
  const directionRef = useRef(direction);
  const foodsRef = useRef(foods);
  const growthRef = useRef(growth);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    x: 0,
    y: 0
  });
  const activeKey = `${activeGame?.id}-${activeGroup}`;

  useEffect(() => {
    const nextSnake = createInitialSnake();
    const nextFoods = spawnWormFoods(nextSnake, foodValues);
    setSnakeCells(nextSnake);
    setDirection(WORM_DIRECTION_PRESETS.right);
    directionRef.current = WORM_DIRECTION_PRESETS.right;
    setFoods(nextFoods);
    foodsRef.current = nextFoods;
    setGrowth(0);
    growthRef.current = 0;
    questionQueueRef.current = {
      10: shuffle(questionsByValue[10]),
      20: shuffle(questionsByValue[20]),
      30: shuffle(questionsByValue[30])
    };
    setPendingQuestion(null);
  }, [activeKey, foodValues, questionsByValue]);

  useEffect(() => {
    questionQueueRef.current = {
      10: shuffle(questionsByValue[10]),
      20: shuffle(questionsByValue[20]),
      30: shuffle(questionsByValue[30])
    };
  }, [questionsByValue]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    foodsRef.current = foods;
  }, [foods]);

  useEffect(() => {
    growthRef.current = growth;
  }, [growth]);

  const requestDirection = useCallback(
    (nextDirection) => {
      if (!isRunning || pendingQuestion) {
        return;
      }

      const isOpposite =
        direction.x + nextDirection.x === 0 && direction.y + nextDirection.y === 0;

      if (isOpposite && snakeCells.length > 1) {
        return;
      }

      setDirection(nextDirection);
    },
    [direction, isRunning, pendingQuestion, snakeCells.length]
  );

  useEffect(() => {
    if (!isRunning || pendingQuestion) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSnakeCells((currentSnake) => {
        const head = currentSnake[0];
        const nextDirection = directionRef.current;
        const nextHead = {
          x: (head.x + nextDirection.x + WORM_GRID.cols) % WORM_GRID.cols,
          y: (head.y + nextDirection.y + WORM_GRID.rows) % WORM_GRID.rows
        };
        const activeFoods = foodsRef.current;
        const eatenFood = activeFoods.find((candidate) => isSameCell(nextHead, candidate));
        const ateFood = Boolean(eatenFood);
        const nextSnake = [nextHead, ...currentSnake];
        let nextGrowth = growthRef.current;

        if (ateFood) {
          const targetValue =
            eatenFood.value === 10 || eatenFood.value === 20 || eatenFood.value === 30
              ? eatenFood.value
              : 20;
          const valuePool = questionsByValue[targetValue] ?? [];
          const fallbackPool = [
            ...questionsByValue[10],
            ...questionsByValue[20],
            ...questionsByValue[30]
          ];
          const availablePool = valuePool.length > 0 ? valuePool : fallbackPool;
          let selectedQuestion = getFallbackQuestions(activeGroup)[0];

          if (availablePool.length > 0) {
            let queue = questionQueueRef.current[targetValue] ?? [];

            if (queue.length === 0) {
              queue = shuffle(availablePool);
            }

            selectedQuestion = queue.pop() ?? selectedQuestion;
            questionQueueRef.current = {
              ...questionQueueRef.current,
              [targetValue]: queue
            };
          }

          setPendingQuestion({
            value: eatenFood.value,
            growthGain: getWormGrowthByValue(eatenFood.value),
            prompt: `${eatenFood.value} puanlık soru açıldı`,
            question: selectedQuestion
          });
          const occupied = new Set(nextSnake.map((cell) => `${cell.x}-${cell.y}`));
          activeFoods.forEach((candidateFood) => {
            if (candidateFood !== eatenFood) {
              occupied.add(`${candidateFood.x}-${candidateFood.y}`);
            }
          });
          const replacementFood = spawnFoodAtRandomCell(occupied, eatenFood.value);
          const nextFoods = activeFoods.map((candidateFood) =>
            candidateFood === eatenFood ? replacementFood : candidateFood
          );
          foodsRef.current = nextFoods;
          setFoods(nextFoods);
        }

        if (nextGrowth > 0) {
          nextGrowth -= 1;
        } else {
          nextSnake.pop();
        }

        if (nextGrowth !== growthRef.current) {
          growthRef.current = nextGrowth;
          setGrowth(nextGrowth);
        }

        return nextSnake;
      });
    }, activeGame?.stepMs ?? WORM_STEP_MS);

    return () => window.clearInterval(timerId);
  }, [
    activeGame?.stepMs,
    activeGroup,
    foodValues,
    isRunning,
    pendingQuestion,
    questionsByValue
  ]);

  const handleQuestionAnswer = useCallback(
    async (isCorrect) => {
      if (!pendingQuestion) {
        return;
      }

      if (isCorrect) {
        await onAddScore(pendingQuestion.value);
        setGrowth((currentGrowth) => {
          const nextGrowth = currentGrowth + (pendingQuestion.growthGain ?? 1);
          growthRef.current = nextGrowth;
          return nextGrowth;
        });
      } else {
        await onAddScore(-Math.abs(pendingQuestion.value));
      }

      setPendingQuestion(null);
    },
    [onAddScore, pendingQuestion]
  );

  const onBoardPointerDown = useCallback((event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };
  }, []);

  const onBoardPointerMove = useCallback(
    (event) => {
      const dragState = dragRef.current;
      if (!dragState.active || dragState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.x;
      const deltaY = event.clientY - dragState.y;
      const threshold = 14;

      if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        requestDirection(
          deltaX > 0 ? WORM_DIRECTION_PRESETS.right : WORM_DIRECTION_PRESETS.left
        );
      } else {
        requestDirection(
          deltaY > 0 ? WORM_DIRECTION_PRESETS.down : WORM_DIRECTION_PRESETS.up
        );
      }

      dragRef.current = {
        ...dragState,
        x: event.clientX,
        y: event.clientY
      };
    },
    [requestDirection]
  );

  const onBoardPointerEnd = useCallback((event) => {
    const dragState = dragRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = {
      active: false,
      pointerId: null,
      x: 0,
      y: 0
    };
  }, []);

  const cellElements = useMemo(() => {
    const snakeSet = new Set(snakeCells.map((cell) => `${cell.x}-${cell.y}`));
    const snakeHeadKey =
      snakeCells.length > 0 ? `${snakeCells[0].x}-${snakeCells[0].y}` : "";
    const foodByKey = new Map(foods.map((item) => [`${item.x}-${item.y}`, item]));
    const cells = [];

    for (let y = 0; y < WORM_GRID.rows; y += 1) {
      for (let x = 0; x < WORM_GRID.cols; x += 1) {
        const key = `${x}-${y}`;
        const classNames = ["worm-cell"];

        if (snakeSet.has(key)) {
          classNames.push("snake");
          if (key === snakeHeadKey) {
            classNames.push("head");
          }
        }

        const foodAtCell = foodByKey.get(key);

        if (foodAtCell) {
          classNames.push("food", `food-${foodAtCell.value}`);
        }

        cells.push(
          <div className={classNames.join(" ")} key={key}>
            {foodAtCell ? <span className="worm-food-token">{foodAtCell.value}</span> : ""}
          </div>
        );
      }
    }

    return cells;
  }, [foods, snakeCells]);

  const pendingChoices = useMemo(() => {
    const question = pendingQuestion?.question;
    const choices = question ? getAnswerChoices(question) : [];

    return {
      trueOption:
        choices.find((choice) => choice?.text === "Doğru") ?? {
          text: "Doğru",
          isCorrect: true
        },
      falseOption:
        choices.find((choice) => choice?.text === "Yanlış") ?? {
          text: "Yanlış",
          isCorrect: false
        }
    };
  }, [pendingQuestion]);

  return (
    <main className="app-screen game-screen worm-screen">
      <header className="game-header">
        <ScoreBox label="A Grubu" score={groups.A.score} active={activeGroup === "A"} />
        <div className="timer-box">{formatTime(timeLeft)}</div>
        <ScoreBox label="B Grubu" score={groups.B.score} active={activeGroup === "B"} />
      </header>

      {!isRunning ? (
        <section className="turn-start" aria-label="Tur başlangıcı">
          <div className="turn-label">{groups[activeGroup].name}</div>
          <button className="pixel-button start-button" onClick={onStartTurn}>
            Başlat
          </button>
          <button className="pixel-button small-button reset-button" onClick={onReset}>
            Sıfırla
          </button>
        </section>
      ) : (
        <section className="worm-stage">
          <button className="pixel-button small-button reset-button" onClick={onReset}>
            Sıfırla
          </button>
          <div
            className="worm-board"
            onPointerDown={onBoardPointerDown}
            onPointerMove={onBoardPointerMove}
            onPointerUp={onBoardPointerEnd}
            onPointerCancel={onBoardPointerEnd}
          >
            {cellElements}
          </div>
          {pendingQuestion ? (
            <div className="worm-question-modal">
              <h3>{pendingQuestion.prompt}</h3>
              <p>{pendingQuestion.question?.question ?? "Soru bulunamadı."}</p>
              <div className="worm-question-actions">
                <button
                  className="pixel-button true-answer-button"
                  onClick={() => handleQuestionAnswer(pendingChoices.trueOption.isCorrect)}
                >
                  {pendingChoices.trueOption.text}
                </button>
                <button
                  className="pixel-button false-answer-button"
                  onClick={() => handleQuestionAnswer(pendingChoices.falseOption.isCorrect)}
                >
                  {pendingChoices.falseOption.text}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}

function PuzzleGame({
  activeGame,
  activeGroup,
  groups,
  isRunning,
  onAddScore,
  onCompleteTurn,
  onReset,
  onStartTurn,
  timeLeft
}) {
  const cols = activeGame?.cols ?? PUZZLE_GRID.cols;
  const rows = activeGame?.rows ?? PUZZLE_GRID.rows;
  const pointsPerPiece = activeGame?.pointsPerCorrect ?? 10;
  const previewSeconds = activeGame?.previewSeconds ?? PUZZLE_PREVIEW_SECONDS;
  const scatterDuration = activeGame?.scatterMs ?? PUZZLE_SCATTER_MS;
  const pieces = useMemo(() => buildPuzzlePieces(cols, rows), [cols, rows]);
  const pieceCount = pieces.length;
  const pieceById = useMemo(
    () => new Map(pieces.map((piece) => [piece.id, piece])),
    [pieces]
  );
  const activeKey = `${activeGame?.id}-${activeGroup}`;
  const workspaceRef = useRef(null);
  const boardRef = useRef(null);
  const trayRef = useRef(null);
  const dragStateRef = useRef(null);
  const placedBySlotRef = useRef(Array(pieceCount).fill(null));
  const completedRef = useRef(false);
  const [selectedImage, setSelectedImage] = useState(
    randomFromList(PUZZLE_IMAGE_POOLS.A, puzzleA1)
  );
  const [phase, setPhase] = useState("idle");
  const [previewCountdown, setPreviewCountdown] = useState(previewSeconds);
  const [trayPieceOrder, setTrayPieceOrder] = useState([]);
  const [placedBySlot, setPlacedBySlot] = useState(() =>
    Array(pieceCount).fill(null)
  );
  const [dragState, setDragState] = useState(null);
  const [scatterPieces, setScatterPieces] = useState([]);
  const [scatterActive, setScatterActive] = useState(false);

  const clearDragState = useCallback(() => {
    dragStateRef.current = null;
    setDragState(null);
  }, []);

  const getScatterFrames = useCallback(
    (pieceOrder) => {
      if (!workspaceRef.current || !boardRef.current || !trayRef.current) {
        return [];
      }

      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      const boardRect = boardRef.current.getBoundingClientRect();
      const trayRect = trayRef.current.getBoundingClientRect();
      const boardCellWidth = boardRect.width / cols;
      const boardCellHeight = boardRect.height / rows;
      const trayColumns = 2;
      const trayGap = 12;
      const trayPadding = 12;
      const trayCellWidth =
        (trayRect.width - trayPadding * 2 - trayGap * (trayColumns - 1)) / trayColumns;
      const pieceWidth = Math.max(52, Math.min(boardCellWidth, trayCellWidth));
      const pieceHeight = pieceWidth * (boardCellHeight / boardCellWidth);

      return pieceOrder.map((pieceId, index) => {
        const piece = pieceById.get(pieceId);
        const trayCol = index % trayColumns;
        const trayRow = Math.floor(index / trayColumns);
        const fromX =
          boardRect.left -
          workspaceRect.left +
          piece.col * boardCellWidth +
          (boardCellWidth - pieceWidth) / 2;
        const fromY =
          boardRect.top -
          workspaceRect.top +
          piece.row * boardCellHeight +
          (boardCellHeight - pieceHeight) / 2;
        const toX =
          trayRect.left -
          workspaceRect.left +
          trayPadding +
          trayCol * (pieceWidth + trayGap);
        const toY =
          trayRect.top -
          workspaceRect.top +
          trayPadding +
          trayRow * (pieceHeight + trayGap);

        return {
          pieceId,
          fromX,
          fromY,
          toX,
          toY,
          width: pieceWidth,
          height: pieceHeight,
          rotation: (Math.random() * 12 - 6).toFixed(2)
        };
      });
    },
    [cols, pieceById, rows]
  );

  const tryPlacePiece = useCallback(
    (pieceId, clientX, clientY) => {
      if (phase !== "play" || !boardRef.current) {
        return;
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      const insideBoard =
        clientX >= boardRect.left &&
        clientX <= boardRect.right &&
        clientY >= boardRect.top &&
        clientY <= boardRect.bottom;

      if (!insideBoard) {
        return;
      }

      const slotWidth = boardRect.width / cols;
      const slotHeight = boardRect.height / rows;
      const slotCol = Math.min(
        cols - 1,
        Math.max(0, Math.floor((clientX - boardRect.left) / slotWidth))
      );
      const slotRow = Math.min(
        rows - 1,
        Math.max(0, Math.floor((clientY - boardRect.top) / slotHeight))
      );
      const slotIndex = slotRow * cols + slotCol;

      if (slotIndex !== pieceId) {
        return;
      }

      const currentSlots = placedBySlotRef.current;
      if (currentSlots[slotIndex] !== null) {
        return;
      }

      const nextSlots = [...currentSlots];
      nextSlots[slotIndex] = pieceId;
      placedBySlotRef.current = nextSlots;
      setPlacedBySlot(nextSlots);
      void onAddScore(pointsPerPiece);
    },
    [cols, onAddScore, phase, pointsPerPiece, rows]
  );

  const onTrayPiecePointerDown = useCallback(
    (event, pieceId) => {
      if (phase !== "play" || !isRunning || dragStateRef.current) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.setPointerCapture(event.pointerId);
      const nextDragState = {
        pieceId,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        height: rect.height
      };

      dragStateRef.current = nextDragState;
      setDragState(nextDragState);
    },
    [isRunning, phase]
  );

  const onTrayPiecePointerMove = useCallback((event) => {
    const currentDrag = dragStateRef.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    const nextDragState = {
      ...currentDrag,
      x: event.clientX,
      y: event.clientY
    };

    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  }, []);

  const onTrayPiecePointerUp = useCallback(
    (event) => {
      const currentDrag = dragStateRef.current;
      if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      clearDragState();
      tryPlacePiece(currentDrag.pieceId, event.clientX, event.clientY);
    },
    [clearDragState, tryPlacePiece]
  );

  const onTrayPiecePointerCancel = useCallback(
    (event) => {
      const currentDrag = dragStateRef.current;
      if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      clearDragState();
    },
    [clearDragState]
  );

  useEffect(() => {
    const resetSlots = Array(pieceCount).fill(null);
    placedBySlotRef.current = resetSlots;
    setPlacedBySlot(resetSlots);
  }, [pieceCount]);

  useEffect(() => {
    if (!isRunning) {
      completedRef.current = false;
      setPhase("idle");
      setPreviewCountdown(previewSeconds);
      setScatterPieces([]);
      setScatterActive(false);
      clearDragState();
      return undefined;
    }

    const selectedFromPool = randomFromList(
      PUZZLE_IMAGE_POOLS[activeGroup],
      PUZZLE_IMAGE_POOLS.A[0]
    );
    const nextTrayPieceIds = shuffle(pieces.map((piece) => piece.id));
    let scatterTimeoutId = null;
    let rafOne = null;
    let rafTwo = null;

    completedRef.current = false;
    setSelectedImage(selectedFromPool);
    setTrayPieceOrder(nextTrayPieceIds);
    const resetSlots = Array(pieceCount).fill(null);
    placedBySlotRef.current = resetSlots;
    setPlacedBySlot(resetSlots);
    setPreviewCountdown(previewSeconds);
    setPhase("preview");
    setScatterPieces([]);
    setScatterActive(false);
    clearDragState();

    const countdownId = window.setInterval(() => {
      setPreviewCountdown((currentValue) => Math.max(1, currentValue - 1));
    }, 1000);

    const previewTimeoutId = window.setTimeout(() => {
      window.clearInterval(countdownId);

      const nextScatterFrames = getScatterFrames(nextTrayPieceIds);

      if (nextScatterFrames.length === 0) {
        setPreviewCountdown(0);
        setPhase("play");
        return;
      }

      setPreviewCountdown(0);
      setScatterPieces(nextScatterFrames);
      setPhase("scatter");
      setScatterActive(false);
      rafOne = window.requestAnimationFrame(() => {
        rafTwo = window.requestAnimationFrame(() => {
          setScatterActive(true);
        });
      });
      scatterTimeoutId = window.setTimeout(() => {
        setScatterPieces([]);
        setScatterActive(false);
        setPhase("play");
      }, scatterDuration);
    }, previewSeconds * 1000);

    return () => {
      window.clearInterval(countdownId);
      window.clearTimeout(previewTimeoutId);
      if (scatterTimeoutId) {
        window.clearTimeout(scatterTimeoutId);
      }

      if (rafOne) {
        window.cancelAnimationFrame(rafOne);
      }

      if (rafTwo) {
        window.cancelAnimationFrame(rafTwo);
      }
    };
  }, [
    activeGroup,
    activeKey,
    clearDragState,
    getScatterFrames,
    isRunning,
    pieceCount,
    pieces,
    previewSeconds,
    scatterDuration
  ]);

  const placedCount = useMemo(
    () => placedBySlot.reduce((total, pieceId) => (pieceId === null ? total : total + 1), 0),
    [placedBySlot]
  );
  const visibleTrayPieceIds = useMemo(() => {
    const placedSet = new Set(placedBySlot.filter((pieceId) => pieceId !== null));
    return trayPieceOrder.filter((pieceId) => !placedSet.has(pieceId));
  }, [placedBySlot, trayPieceOrder]);

  useEffect(() => {
    if (!isRunning || phase !== "play" || placedCount !== pieceCount || completedRef.current) {
      return;
    }

    completedRef.current = true;
    setPhase("complete");
    void onCompleteTurn();
  }, [isRunning, onCompleteTurn, phase, pieceCount, placedCount]);

  const dragPiece = dragState ? pieceById.get(dragState.pieceId) : null;

  return (
    <main className="app-screen game-screen puzzle-screen">
      <header className="game-header">
        <ScoreBox label="A Grubu" score={groups.A.score} active={activeGroup === "A"} />
        <div className="timer-box">{formatTime(timeLeft)}</div>
        <ScoreBox label="B Grubu" score={groups.B.score} active={activeGroup === "B"} />
      </header>

      {!isRunning ? (
        <section className="turn-start" aria-label="Tur başlangıcı">
          <div className="turn-label">{groups[activeGroup].name}</div>
          <button className="pixel-button start-button" onClick={onStartTurn}>
            Başlat
          </button>
          <button className="pixel-button small-button reset-button" onClick={onReset}>
            Sıfırla
          </button>
        </section>
      ) : (
        <section className="puzzle-stage">
          <button className="pixel-button small-button reset-button" onClick={onReset}>
            Sıfırla
          </button>
          <div className="puzzle-workspace" ref={workspaceRef}>
            <div className="puzzle-board" ref={boardRef}>
              {Array.from({ length: pieceCount }, (_, slotIndex) => {
                const pieceId = placedBySlot[slotIndex];
                const piece = pieceId !== null ? pieceById.get(pieceId) : null;

                return (
                  <div className={`puzzle-slot ${piece ? "filled" : ""}`} key={slotIndex}>
                    {piece ? (
                      <div
                        className="puzzle-piece board-piece"
                        style={getPuzzlePieceBackgroundStyle(piece, selectedImage, cols, rows)}
                      />
                    ) : null}
                  </div>
                );
              })}
              {phase === "preview" ? (
                <div className="puzzle-preview">
                  <img alt="Puzzle Önizleme" src={selectedImage} />
                  <span>{previewCountdown}</span>
                </div>
              ) : null}
            </div>
            <div className={`puzzle-tray ${phase === "play" ? "active" : ""}`} ref={trayRef}>
              {phase === "play" || phase === "complete"
                ? visibleTrayPieceIds.map((pieceId) => {
                  const piece = pieceById.get(pieceId);
                  const isDragging = dragState?.pieceId === pieceId;

                  return (
                    <button
                      className={`puzzle-piece tray-piece ${isDragging ? "drag-source" : ""}`}
                      key={pieceId}
                      onPointerCancel={onTrayPiecePointerCancel}
                      onPointerDown={(event) => onTrayPiecePointerDown(event, pieceId)}
                      onPointerMove={onTrayPiecePointerMove}
                      onPointerUp={onTrayPiecePointerUp}
                      style={getPuzzlePieceBackgroundStyle(piece, selectedImage, cols, rows)}
                      type="button"
                    />
                  );
                })
                : null}
            </div>
            {phase === "scatter" ? (
              <div className="puzzle-scatter-layer" aria-hidden="true">
                {scatterPieces.map((scatterPiece) => {
                  const piece = pieceById.get(scatterPiece.pieceId);
                  const style = {
                    ...getPuzzlePieceBackgroundStyle(piece, selectedImage, cols, rows),
                    width: `${scatterPiece.width}px`,
                    height: `${scatterPiece.height}px`,
                    left: `${scatterPiece.fromX}px`,
                    top: `${scatterPiece.fromY}px`,
                    transform: scatterActive
                      ? `translate(${scatterPiece.toX - scatterPiece.fromX}px, ${scatterPiece.toY - scatterPiece.fromY}px) rotate(${scatterPiece.rotation}deg)`
                      : "translate(0, 0) rotate(0deg)"
                  };

                  return (
                    <div
                      className="puzzle-piece scatter-piece"
                      key={`scatter-${scatterPiece.pieceId}`}
                      style={style}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
          {dragPiece && dragState ? (
            <div
              className="puzzle-piece puzzle-drag-piece"
              style={{
                ...getPuzzlePieceBackgroundStyle(dragPiece, selectedImage, cols, rows),
                width: `${dragState.width}px`,
                height: `${dragState.height}px`,
                left: `${dragState.x - dragState.offsetX}px`,
                top: `${dragState.y - dragState.offsetY}px`
              }}
            />
          ) : null}
        </section>
      )}
    </main>
  );
}

function WinnerScreen({ groups, onRestart }) {
  return (
    <main className="app-screen center-screen winner-screen">
      <section className="winner-panel">
        <h1>{getWinner(groups)}</h1>
        <div className="winner-scores">
          {GROUP_KEYS.map((groupKey) => (
            <div className="winner-score" key={groupKey}>
              <span>{groups[groupKey].name}</span>
              <strong>{groups[groupKey].score}</strong>
            </div>
          ))}
        </div>
        <button className="pixel-button start-button" onClick={onRestart}>
          Yeniden Başla
        </button>
      </section>
    </main>
  );
}

export default App;
