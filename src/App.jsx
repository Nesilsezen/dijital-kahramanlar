import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import appLogo from "./assets/images/dkahramanlar.png";
import puzzleA1 from "./assets/images/atakim_1-puzzle.png";
import puzzleA2 from "./assets/images/atakim_2-puzzle.png";
import puzzleB1 from "./assets/images/btakim_1-puzzle.png";
import puzzleB2 from "./assets/images/btakim_2-puzzle.png";
import bridgeUnderwaterBgImage from "./assets/images/bridge-underwater-bg.png";
import bridgeRockPileImage from "./assets/images/bridge-rock-pile.png";
import bridgeHeroSideSheetImage from "./assets/images/bridge-hero-side-sheet.png";
import cupIconWifi from "./assets/images/cup-icon-wifi.png";
import cupIconGlobe from "./assets/images/cup-icon-globe.png";
import cupIconComputer from "./assets/images/cup-icon-computer.png";
import balloonPopSfx from "./assets/audio/balloon-pop.mp3";
import gameplayLoopMusic from "./assets/audio/gameplay-loop.mp3";
import tensionLoopMusic from "./assets/audio/tension-loop.mp3";
import winnerLoopMusic from "./assets/audio/winner-loop.mp3";
import defaultSession from "./data/defaultSession.json";
import questionBank from "./data/questions.json";
import wormQuestionBank from "./data/wormQuestions.json";
import bridgeQuestionBank from "./data/bridgeQuestions.json";
import jarQuestionBank from "./data/jarQuestions.json";

const MATCH_ICON_MODULES = import.meta.glob("./assets/images/match-icons/*.svg", {
  eager: true,
  import: "default",
  query: "?url"
});
const STORAGE_KEY = "dijital-kahramanlar-session";
const GROUP_KEYS = ["A", "B"];
const FALLBACK_TRUE_FALSE_QUESTION_BANK = {
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
const FALLBACK_BRIDGE_QUESTION_BANK = {
  A: [
    {
      question: "Güçlü bir ____ kullanmalıyız.",
      answerOptions: [
        { text: "şifre", rationale: "", isCorrect: true },
        { text: "renk", rationale: "", isCorrect: false },
        { text: "oyuncak", rationale: "", isCorrect: false }
      ],
      hint: ""
    },
    {
      question: "Tanımadığımız kişilere ____ vermemeliyiz.",
      answerOptions: [
        { text: "kişisel bilgi", rationale: "", isCorrect: true },
        { text: "selam", rationale: "", isCorrect: false },
        { text: "emoji", rationale: "", isCorrect: false }
      ],
      hint: ""
    }
  ],
  B: [
    {
      question: "Şifremizi kimseyle ____ etmemeliyiz.",
      answerOptions: [
        { text: "paylaş", rationale: "", isCorrect: true },
        { text: "değiştir", rationale: "", isCorrect: false },
        { text: "uzat", rationale: "", isCorrect: false }
      ],
      hint: ""
    },
    {
      question: "Şüpheli linke hemen ____mamalıyız.",
      answerOptions: [
        { text: "tıkla", rationale: "", isCorrect: true },
        { text: "bak", rationale: "", isCorrect: false },
        { text: "gül", rationale: "", isCorrect: false }
      ],
      hint: ""
    }
  ]
};
const FALLBACK_JAR_QUESTION_BANK = {
  A: [
    {
      question: "Güçlü bir şifre için hangisi daha doğrudur?",
      answerOptions: [
        { text: "Harf + sayı + sembol", rationale: "", isCorrect: true },
        { text: "123456", rationale: "", isCorrect: false },
        { text: "Sadece isim", rationale: "", isCorrect: false }
      ],
      hint: ""
    }
  ],
  B: [
    {
      question: "Şüpheli link gelirse ne yapmalıyız?",
      answerOptions: [
        { text: "Doğrulamadan tıklamamak", rationale: "", isCorrect: true },
        { text: "Hemen açmak", rationale: "", isCorrect: false },
        { text: "Herkese göndermek", rationale: "", isCorrect: false }
      ],
      hint: ""
    }
  ]
};
const FALLBACK_QUESTION_BANK = {
  balloon: FALLBACK_TRUE_FALSE_QUESTION_BANK,
  worm: FALLBACK_TRUE_FALSE_QUESTION_BANK,
  bridge: FALLBACK_BRIDGE_QUESTION_BANK,
  jar: FALLBACK_JAR_QUESTION_BANK
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
const BRIDGE_TARGET_STEPS = 7;
const PUZZLE_IMAGE_POOLS = {
  A: [puzzleA1, puzzleA2],
  B: [puzzleB1, puzzleB2]
};
const PUZZLE_DIFFICULTY_OPTIONS = [
  { key: "easy", label: "Basit 3x3", cols: 3, rows: 3 },
  { key: "medium", label: "Orta 4x4", cols: 4, rows: 4 },
  { key: "hard", label: "Zor 5x5", cols: 5, rows: 5 }
];
const WORM_VALUE_OPTIONS = [10, 20, 30];
const CUP_ICON_OPTIONS = [
  { id: "wifi", label: "Wi-Fi", imageUrl: cupIconWifi },
  { id: "globe", label: "İnternet", imageUrl: cupIconGlobe },
  { id: "computer", label: "Bilgisayar", imageUrl: cupIconComputer }
];
const CUP_ROUNDS_PER_GROUP = 3;
const CUP_SHUFFLE_COUNT = 6;
const CUP_SHUFFLE_STEP_MS = 430;
const CUP_SHUFFLE_PREP_MS = 80;
const MATCH_GROUP_POOL_SIZE = 20;
const MATCH_PAIR_COUNT = 10;
const MATCH_PREVIEW_SECONDS = 2;
const MATCH_POINTS_PER_PAIR = 5;
const MATCH_ICON_ITEMS = [
  { id: "computer-bridge", label: "Bilgisayar Köprü", iconFile: "computer-bridge.svg" },
  { id: "url", label: "URL", iconFile: "url.svg" },
  { id: "phishing", label: "Oltalama", iconFile: "phishing.svg" },
  { id: "secure", label: "Güvenli", iconFile: "secure.svg" },
  { id: "worm", label: "Solucan", iconFile: "worm.svg" },
  { id: "antivirus", label: "Antivirüs", iconFile: "antivirus.svg" },
  { id: "firewall", label: "Güvenlik Duvarı", iconFile: "firewall.svg" },
  { id: "software", label: "Yazılım", iconFile: "software.svg" },
  { id: "player", label: "Oyuncu", iconFile: "player.svg" },
  { id: "equipment", label: "Ekipman", iconFile: "equipment.svg" },
  { id: "screen", label: "Ekran", iconFile: "screen.svg" },
  { id: "level", label: "Bölüm", iconFile: "level.svg" },
  { id: "score", label: "Skor", iconFile: "score.svg" },
  { id: "multiplayer", label: "Çok Oyunculu", iconFile: "multiplayer.svg" },
  { id: "insult", label: "Hakaret", iconFile: "insult.svg" },
  { id: "threat", label: "Tehdit", iconFile: "threat.svg" },
  { id: "glasses", label: "Gözlük", iconFile: "glasses.svg" },
  { id: "headphones", label: "Kulaklık", iconFile: "headphones.svg" },
  { id: "keyboard", label: "Klavye", iconFile: "keyboard.svg" },
  { id: "mouse", label: "Fare", iconFile: "mouse.svg" },
  { id: "virus", label: "Virüs", iconFile: "virus.svg" },
  { id: "wifi", label: "Wi-Fi", iconFile: "wifi.svg" },
  { id: "network", label: "Ağ", iconFile: "network.svg" },
  { id: "browser", label: "Tarayıcı", iconFile: "browser.svg" },
  { id: "like", label: "Beğeni", iconFile: "like.svg" },
  { id: "profile", label: "Profil", iconFile: "profile.svg" },
  { id: "clock", label: "Saat", iconFile: "clock.svg" },
  { id: "internet", label: "İnternet", iconFile: "internet.svg" },
  { id: "activity", label: "Aktivite", iconFile: "activity.svg" },
  { id: "reminder", label: "Hatırlatıcı", iconFile: "reminder.svg" },
  { id: "phone", label: "Telefon", iconFile: "phone.svg" },
  { id: "signature", label: "İmza", iconFile: "signature.svg" },
  { id: "photo", label: "Fotoğraf", iconFile: "photo.svg" },
  { id: "character", label: "Karakter", iconFile: "character.svg" },
  { id: "number", label: "Rakam", iconFile: "number.svg" },
  { id: "symbol", label: "Sembol", iconFile: "symbol.svg" },
  { id: "password", label: "Şifre", iconFile: "password.svg" },
  { id: "child", label: "Çocuk", iconFile: "child.svg" },
  { id: "tree", label: "Ağaç", iconFile: "tree.svg" },
  { id: "parent", label: "Ebeveyn", iconFile: "parent.svg" }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randomFromList(values, fallbackValue = null) {
  if (!Array.isArray(values) || values.length === 0) {
    return fallbackValue;
  }

  return values[Math.floor(Math.random() * values.length)];
}

function getMatchingIconUrl(fileName) {
  return MATCH_ICON_MODULES[`./assets/images/match-icons/${fileName}`] ?? "";
}

function swapCupSlots(slots, firstSlot, secondSlot) {
  const nextSlots = [...slots];
  const temp = nextSlots[firstSlot];
  nextSlots[firstSlot] = nextSlots[secondSlot];
  nextSlots[secondSlot] = temp;
  return nextSlots;
}

function createCupShufflePlan(stepCount) {
  const adjacentPairs = [
    [0, 1],
    [1, 2]
  ];
  const plan = [];
  let simulatedSlots = [0, 1, 2];

  for (let step = 0; step < stepCount; step += 1) {
    const pickedPair = randomFromList(adjacentPairs, adjacentPairs[0]);
    simulatedSlots = swapCupSlots(simulatedSlots, pickedPair[0], pickedPair[1]);
    plan.push(pickedPair);
  }

  if (simulatedSlots.every((cupId, slot) => cupId === slot)) {
    const pickedPair = randomFromList(adjacentPairs, adjacentPairs[0]);
    plan.push(pickedPair);
  }

  return plan;
}

function getMatchIconPool(groupKey = "A") {
  const startIndex = groupKey === "B" ? MATCH_GROUP_POOL_SIZE : 0;
  return MATCH_ICON_ITEMS.slice(startIndex, startIndex + MATCH_GROUP_POOL_SIZE);
}

function createMatchingCards(groupKey = "A", pairCount = MATCH_PAIR_COUNT) {
  const groupPool = getMatchIconPool(groupKey);
  const safePairCount = Math.max(1, Math.min(pairCount, groupPool.length));
  const selectedIcons = shuffle(groupPool).slice(0, safePairCount);
  const duplicatedCards = selectedIcons.flatMap((icon) => [
    {
      id: `${icon.id}-a`,
      iconId: icon.id,
      label: icon.label,
      iconUrl: getMatchingIconUrl(icon.iconFile)
    },
    {
      id: `${icon.id}-b`,
      iconId: icon.id,
      label: icon.label,
      iconUrl: getMatchingIconUrl(icon.iconFile)
    }
  ]);

  return shuffle(duplicatedCards);
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
    ...(turn ?? {}),
    askedQuestionIds: Array.isArray(turn?.askedQuestionIds)
      ? turn.askedQuestionIds
      : Array.isArray(baseTurn?.askedQuestionIds)
        ? baseTurn.askedQuestionIds
        : [],
    currentQuestionId:
      typeof turn?.currentQuestionId === "string" ? turn.currentQuestionId : null
  };
}

function getFallbackQuestions(gameId = "balloon", groupKey = "A") {
  const gameBank =
    FALLBACK_QUESTION_BANK[gameId] ?? FALLBACK_QUESTION_BANK.balloon;
  return gameBank[groupKey] ?? gameBank.A;
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
  const cleanedRawOptions = rawOptions.filter(
    (option) => typeof option?.text === "string" && option.text.trim()
  );
  const hasTrueFalseLabels =
    cleanedRawOptions.some((option) => option.text === "Doğru") ||
    cleanedRawOptions.some((option) => option.text === "Yanlış");

  if (cleanedRawOptions.length >= 2 && !hasTrueFalseLabels) {
    const normalizedOptions = cleanedRawOptions.map((option, index) =>
      normalizeAnswerOption(option, {
        text: `Seçenek ${index + 1}`,
        rationale: "",
        isCorrect: index === 0
      })
    );
    const hasCorrectOption = normalizedOptions.some((option) => option.isCorrect);

    if (!hasCorrectOption) {
      normalizedOptions[0] = {
        ...normalizedOptions[0],
        isCorrect: true
      };
    }

    return normalizedOptions;
  }

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

function normalizeQuestionIdPart(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 42);
}

function buildQuestionId(gameId, groupKey, question, index) {
  if (typeof question?.id === "string" && question.id.trim()) {
    return question.id.trim();
  }

  const sourceValue = question?.questionNumber ?? index + 1;
  const textValue = normalizeQuestionIdPart(question?.question || `soru-${sourceValue}`);
  return `${gameId}-${groupKey}-${sourceValue}-${textValue}`;
}

function normalizeQuestion(question, index, groupKey = "A", gameId = "balloon") {
  const fallbackQuestions = getFallbackQuestions(gameId, groupKey);
  const fallbackQuestion = fallbackQuestions[index % fallbackQuestions.length];

  return {
    id: buildQuestionId(gameId, groupKey, question, index),
    questionNumber: question?.questionNumber ?? index + 1,
    question: question?.question || fallbackQuestion.question,
    imageUrl: question?.imageUrl || "",
    answerOptions: normalizeAnswerOptions(question, fallbackQuestion),
    hint: question?.hint || fallbackQuestion.hint || "",
    difficulty: question?.difficulty || "medium",
    pointValue: Number(question?.pointValue) || undefined
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
  const normalizedGame = {
    ...FALLBACK_GAME,
    ...baseGame,
    ...gameWithoutQuestions
  };

  if (normalizedGame.id === "match") {
    return {
      ...normalizedGame,
      durationSeconds: 120
    };
  }

  return normalizedGame;
}

function normalizeGames(rawGames, baseGames) {
  const sessionGames = Array.isArray(rawGames) ? rawGames : [];
  const defaults = Array.isArray(baseGames) && baseGames.length > 0
    ? baseGames
    : [FALLBACK_GAME];

  const requiredGames = defaults.map((defaultGame, index) => {
    const byId = sessionGames.find((sessionGame) => sessionGame?.id === defaultGame.id);
    const selectedGame = byId ?? defaultGame;

    return normalizeGame(selectedGame, index);
  });

  const requiredIds = new Set(defaults.map((game) => game.id));
  const extraGames = sessionGames
    .filter((sessionGame) => sessionGame?.id && !requiredIds.has(sessionGame.id))
    .map((sessionGame, index) => normalizeGame(sessionGame, defaults.length + index));

  return [...requiredGames, ...extraGames];
}

function createSimpleTrueFalseQuestion(questionText, isCorrectTrue, extra = {}) {
  return {
    question: questionText,
    answerOptions: [
      {
        text: "Doğru",
        rationale: "",
        isCorrect: Boolean(isCorrectTrue)
      },
      {
        text: "Yanlış",
        rationale: "",
        isCorrect: !Boolean(isCorrectTrue)
      }
    ],
    hint: "",
    ...extra
  };
}

function createFillBlankQuestion(questionText, correctText, wrongOptions = [], extra = {}) {
  const safeCorrectText = String(correctText ?? "").trim();
  const safeWrongOptions = Array.isArray(wrongOptions)
    ? wrongOptions
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
    : [];

  const optionTexts = [safeCorrectText, ...safeWrongOptions]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
  const normalizedOptionTexts = optionTexts.length >= 2
    ? optionTexts
    : [safeCorrectText || "Doğru Seçenek", "Yanlış Seçenek"];
  const answerOptions = shuffle(
    normalizedOptionTexts.map((text) => ({
      text,
      rationale: "",
      isCorrect: text === (safeCorrectText || normalizedOptionTexts[0])
    }))
  );

  return {
    question: questionText,
    answerOptions,
    hint: "",
    ...extra
  };
}

function normalizeCustomQuestions(rawCustomQuestions, baseCustomQuestions) {
  const normalized = clone(baseCustomQuestions);

  ["balloon", "worm", "bridge", "jar"].forEach((gameId) => {
    GROUP_KEYS.forEach((groupKey) => {
      const sourceQuestions = Array.isArray(rawCustomQuestions?.[gameId]?.[groupKey])
        ? rawCustomQuestions[gameId][groupKey]
        : [];
      normalized[gameId][groupKey] = sourceQuestions
        .filter((question) => typeof question?.question === "string" && question.question.trim())
        .map((question, index) => {
          if (gameId === "worm") {
            return normalizeQuestion(
              {
                ...question,
                pointValue: getWormPointValue(question, index),
                difficulty:
                  question?.difficulty ??
                  (getWormPointValue(question, index) === 10
                    ? "easy"
                    : getWormPointValue(question, index) === 30
                      ? "hard"
                      : "medium")
              },
              index,
              groupKey,
              gameId
            );
          }

          return normalizeQuestion(question, index, groupKey, gameId);
        });
    });
  });

  return normalized;
}

function normalizeCustomPuzzles(rawPuzzles) {
  if (!Array.isArray(rawPuzzles)) {
    return [];
  }

  return rawPuzzles
    .filter((puzzle) => typeof puzzle?.imageUrl === "string" && puzzle.imageUrl.trim())
    .map((puzzle, index) => ({
      id: puzzle.id || `custom-puzzle-${index + 1}`,
      imageUrl: puzzle.imageUrl
    }));
}

function normalizeSettings(rawSettings, baseSettings) {
  return {
    ...baseSettings,
    ...(rawSettings ?? {}),
    developerMode: Boolean(rawSettings?.developerMode),
    customQuestions: normalizeCustomQuestions(
      rawSettings?.customQuestions,
      baseSettings.customQuestions
    ),
    customPuzzles: normalizeCustomPuzzles(rawSettings?.customPuzzles)
  };
}

function getQuestionsForGroup(gameId, groupKey, customQuestions = null) {
  const fallbackQuestions = getFallbackQuestions(gameId, groupKey);

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
          groupKey,
          "worm"
        )
      );

      return normalizedFallbackQuestions;
    }

    const normalizedBaseWormQuestions = selectedPool.map((question, index) =>
      normalizeQuestion(
        {
          ...question,
          difficulty:
            question?.difficulty ??
            inferDifficultyFromQuestionNumber(question?.questionNumber ?? index + 1),
          pointValue: getWormPointValue(question, index)
        },
        index,
        groupKey,
        "worm"
      )
    );

    const customWormQuestions = Array.isArray(customQuestions?.worm?.[groupKey])
      ? customQuestions.worm[groupKey]
      : [];

    return [...normalizedBaseWormQuestions, ...customWormQuestions];
  }

  if (gameId === "bridge") {
    const bridgeGroupSet = bridgeQuestionBank?.[groupKey];
    const otherGroupKey = groupKey === "A" ? "B" : "A";
    const bridgeOtherGroupSet = bridgeQuestionBank?.[otherGroupKey];
    const rawBridgeQuestions = Array.isArray(bridgeGroupSet?.questions)
      ? bridgeGroupSet.questions
      : Array.isArray(bridgeGroupSet)
        ? bridgeGroupSet
        : [];
    const rawBridgeOtherQuestions = Array.isArray(bridgeOtherGroupSet?.questions)
      ? bridgeOtherGroupSet.questions
      : Array.isArray(bridgeOtherGroupSet)
        ? bridgeOtherGroupSet
        : [];
    const mergedBridgeQuestions = [...rawBridgeQuestions, ...rawBridgeOtherQuestions];
    const questions =
      mergedBridgeQuestions.length > 0 ? mergedBridgeQuestions : fallbackQuestions;
    const normalizedBaseBridgeQuestions = questions.map((question, index) =>
      normalizeQuestion(question, index, groupKey, "bridge")
    );
    const customBridgeQuestions = Array.isArray(customQuestions?.bridge?.[groupKey])
      ? customQuestions.bridge[groupKey]
      : [];

    return [...normalizedBaseBridgeQuestions, ...customBridgeQuestions];
  }

  if (gameId === "jar") {
    const jarGroupSet = jarQuestionBank?.[groupKey];
    const otherGroupKey = groupKey === "A" ? "B" : "A";
    const jarOtherGroupSet = jarQuestionBank?.[otherGroupKey];
    const rawJarQuestions = Array.isArray(jarGroupSet?.questions)
      ? jarGroupSet.questions
      : Array.isArray(jarGroupSet)
        ? jarGroupSet
        : [];
    const rawOtherJarQuestions = Array.isArray(jarOtherGroupSet?.questions)
      ? jarOtherGroupSet.questions
      : Array.isArray(jarOtherGroupSet)
        ? jarOtherGroupSet
        : [];
    const mergedJarQuestions = [...rawJarQuestions, ...rawOtherJarQuestions];
    const questions = mergedJarQuestions.length > 0 ? mergedJarQuestions : fallbackQuestions;
    const normalizedBaseJarQuestions = questions.map((question, index) =>
      normalizeQuestion(question, index, groupKey, "jar")
    );
    const customJarQuestions = Array.isArray(customQuestions?.jar?.[groupKey])
      ? customQuestions.jar[groupKey]
      : [];

    return [...normalizedBaseJarQuestions, ...customJarQuestions];
  }

  const groupQuestionSet = questionBank?.[gameId]?.[groupKey];
  const rawQuestions = Array.isArray(groupQuestionSet)
    ? groupQuestionSet
    : groupQuestionSet?.questions;
  const questions =
    Array.isArray(rawQuestions) && rawQuestions.length > 0
      ? rawQuestions
      : fallbackQuestions;

  const normalizedBaseQuestions = questions.map((question, index) =>
    normalizeQuestion(question, index, groupKey, gameId)
  );
  const customBalloonQuestions = Array.isArray(customQuestions?.[gameId]?.[groupKey])
    ? customQuestions[gameId][groupKey]
    : [];

  return [...normalizedBaseQuestions, ...customBalloonQuestions];
}

function pickRandomQuestionWithoutRepeat(questions, askedQuestionIds = []) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return {
      question: null,
      askedQuestionIds: []
    };
  }

  let askedSet = new Set(
    askedQuestionIds.filter((questionId) => questions.some((question) => question.id === questionId))
  );
  let candidates = questions.filter((question) => !askedSet.has(question.id));

  if (candidates.length === 0) {
    askedSet = new Set();
    candidates = questions;
  }

  const pickedQuestion = randomFromList(candidates, questions[0]);

  if (pickedQuestion?.id) {
    askedSet.add(pickedQuestion.id);
  }

  return {
    question: pickedQuestion,
    askedQuestionIds: [...askedSet]
  };
}

function getPuzzleDifficultyByKey(key) {
  return (
    PUZZLE_DIFFICULTY_OPTIONS.find((option) => option.key === key) ??
    PUZZLE_DIFFICULTY_OPTIONS[1]
  );
}

function getBalloonQuestionPool(session, groupKey) {
  return getQuestionsForGroup(
    "balloon",
    groupKey,
    session?.settings?.customQuestions
  );
}

function assignNextBalloonQuestion(session, groupKey) {
  const turn = session.gameState.turns[groupKey];
  const questions = getBalloonQuestionPool(session, groupKey);
  const picked = pickRandomQuestionWithoutRepeat(questions, turn.askedQuestionIds);

  turn.askedQuestionIds = picked.askedQuestionIds;
  turn.currentQuestionId = picked.question?.id ?? null;
}

function resolveCurrentBalloonQuestion(session) {
  const groupKey = session?.activeGroup ?? "A";
  const turn = session?.gameState?.turns?.[groupKey];
  const questions = getBalloonQuestionPool(session, groupKey);

  if (questions.length === 0) {
    return normalizeQuestion(
      getFallbackQuestions("balloon", groupKey)[0],
      0,
      groupKey,
      "balloon"
    );
  }

  const byId = questions.find((question) => question.id === turn?.currentQuestionId);
  return byId ?? questions[0];
}

function getBridgeQuestionPool(session, groupKey) {
  return getQuestionsForGroup(
    "bridge",
    groupKey,
    session?.settings?.customQuestions
  );
}

function assignNextBridgeQuestion(session, groupKey) {
  const turn = session.gameState.turns[groupKey];
  const questions = getBridgeQuestionPool(session, groupKey);
  const picked = pickRandomQuestionWithoutRepeat(questions, turn.askedQuestionIds);

  turn.askedQuestionIds = picked.askedQuestionIds;
  turn.currentQuestionId = picked.question?.id ?? null;
}

function resolveCurrentBridgeQuestion(session) {
  const groupKey = session?.activeGroup ?? "A";
  const turn = session?.gameState?.turns?.[groupKey];
  const questions = getBridgeQuestionPool(session, groupKey);

  if (questions.length === 0) {
    return normalizeQuestion(
      getFallbackQuestions("bridge", groupKey)[0],
      0,
      groupKey,
      "bridge"
    );
  }

  const byId = questions.find((question) => question.id === turn?.currentQuestionId);
  return byId ?? questions[0];
}

function getJarQuestionPool(session, groupKey) {
  return getQuestionsForGroup(
    "jar",
    groupKey,
    session?.settings?.customQuestions
  );
}

function assignNextJarQuestion(session, groupKey) {
  const turn = session.gameState.turns[groupKey];
  const questions = getJarQuestionPool(session, groupKey);
  const picked = pickRandomQuestionWithoutRepeat(questions, turn.askedQuestionIds);

  turn.askedQuestionIds = picked.askedQuestionIds;
  turn.currentQuestionId = picked.question?.id ?? null;
}

function resolveCurrentJarQuestion(session) {
  const groupKey = session?.activeGroup ?? "A";
  const turn = session?.gameState?.turns?.[groupKey];
  const questions = getJarQuestionPool(session, groupKey);

  if (questions.length === 0) {
    return normalizeQuestion(
      getFallbackQuestions("jar", groupKey)[0],
      0,
      groupKey,
      "jar"
    );
  }

  const byId = questions.find((question) => question.id === turn?.currentQuestionId);
  return byId ?? questions[0];
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
    settings: normalizeSettings(rawSession.settings, base.settings),
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

function nextBurstState(previousBurst) {
  return {
    id: (previousBurst?.id ?? 0) + 1,
    x: "50%",
    y: "50%"
  };
}

let feedbackAudioContext = null;

function getFeedbackAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return null;
  }

  if (!feedbackAudioContext || feedbackAudioContext.state === "closed") {
    feedbackAudioContext = new AudioContextConstructor();
  }

  if (feedbackAudioContext.state === "suspended") {
    feedbackAudioContext.resume().catch(() => {});
  }

  return feedbackAudioContext;
}

function playFeedbackTone(audioContext, frequency, startAt, duration, type = "square") {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.14, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.025);
}

function playAnswerFeedbackSound(isCorrect) {
  const audioContext = getFeedbackAudioContext();
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  if (isCorrect) {
    playFeedbackTone(audioContext, 523.25, now, 0.12);
    playFeedbackTone(audioContext, 659.25, now + 0.09, 0.12);
    playFeedbackTone(audioContext, 783.99, now + 0.18, 0.16);
    return;
  }

  playFeedbackTone(audioContext, 220, now, 0.16, "sawtooth");
  playFeedbackTone(audioContext, 146.83, now + 0.14, 0.22, "sawtooth");
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

function getPuzzleTrayColumns(pieceCount) {
  if (pieceCount >= 16) {
    return 4;
  }

  if (pieceCount >= 9) {
    return 3;
  }

  return 2;
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

function getCorrectAnswerChoice(question) {
  return getAnswerChoices(question).find((choice) => choice?.isCorrect) ?? null;
}

function App() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const activeBalloonQuestion = useMemo(() => {
    if (!data || activeGame?.id !== "balloon") {
      return null;
    }

    return resolveCurrentBalloonQuestion(data);
  }, [activeGame?.id, data]);
  const activeBridgeQuestion = useMemo(() => {
    if (!data || activeGame?.id !== "bridge") {
      return null;
    }

    return resolveCurrentBridgeQuestion(data);
  }, [activeGame?.id, data]);
  const activeJarQuestion = useMemo(() => {
    if (!data || activeGame?.id !== "jar") {
      return null;
    }

    return resolveCurrentJarQuestion(data);
  }, [activeGame?.id, data]);
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
    } else if (
      data.phase === "balloonTransition" ||
      data.phase === "puzzleSetup" ||
      data.phase === "intro"
    ) {
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
    const keepSettings = clone(dataRef.current?.settings ?? defaultSession.settings);
    const resetSession = await sessionStore.resetData();
    const normalizedSession = normalizeSession(resetSession);
    normalizedSession.settings = normalizeSettings(keepSettings, defaultSession.settings);
    dataRef.current = normalizedSession;
    setData(normalizedSession);
    await sessionStore.saveData(normalizedSession);
  }, []);

  const createSessionForGame = useCallback((gameId = null) => {
    const keepSettings = clone(dataRef.current?.settings ?? defaultSession.settings);
    const nextSession = normalizeSession(clone(defaultSession));
    nextSession.settings = normalizeSettings(keepSettings, defaultSession.settings);
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

  const updateSettings = useCallback(async (updater) => {
    const currentSession = dataRef.current;
    if (!currentSession) {
      return;
    }

    const nextSession = clone(currentSession);
    const nextSettings =
      typeof updater === "function"
        ? updater(clone(nextSession.settings))
        : updater;

    nextSession.settings = normalizeSettings(nextSettings, defaultSession.settings);
    await persistSession(nextSession);
  }, [persistSession]);

  const addCustomQuestion = useCallback(
    async ({
      gameId,
      groupKey,
      questionText,
      correctAnswer,
      pointValue,
      correctOptionText,
      wrongOptionTexts
    }) => {
      const currentSession = dataRef.current;
      if (!currentSession) {
        return false;
      }

      const safeQuestionText = String(questionText ?? "").trim();
      if (!safeQuestionText) {
        return false;
      }

      const safeGameId =
        gameId === "worm" || gameId === "bridge" || gameId === "jar"
          ? gameId
          : "balloon";
      const safeGroupKey = groupKey === "B" ? "B" : "A";
      const isCorrectTrue = correctAnswer !== "Yanlış";
      const nextSession = clone(currentSession);
      const currentList = nextSession.settings.customQuestions[safeGameId][safeGroupKey];
      const nextIndex = currentList.length;
      const customQuestionId = `custom-${safeGameId}-${safeGroupKey}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      let normalizedQuestion;

      if (safeGameId === "bridge" || safeGameId === "jar") {
        const safeCorrectOptionText = String(correctOptionText ?? "").trim();
        const safeWrongOptions = Array.isArray(wrongOptionTexts)
          ? wrongOptionTexts
            .map((option) => String(option ?? "").trim())
            .filter(Boolean)
          : [];

        if (!safeCorrectOptionText) {
          return false;
        }

        const baseQuestion = createFillBlankQuestion(
          safeQuestionText,
          safeCorrectOptionText,
          safeWrongOptions,
          { id: customQuestionId }
        );
        normalizedQuestion = normalizeQuestion(
          baseQuestion,
          nextIndex,
          safeGroupKey,
          safeGameId
        );
      } else {
        const baseQuestion = createSimpleTrueFalseQuestion(safeQuestionText, isCorrectTrue, {
          id: customQuestionId
        });
        const wormValue = WORM_VALUE_OPTIONS.includes(Number(pointValue))
          ? Number(pointValue)
          : 20;
        normalizedQuestion =
          safeGameId === "worm"
            ? normalizeQuestion(
              {
                ...baseQuestion,
                pointValue: wormValue,
                difficulty:
                  wormValue === 10 ? "easy" : wormValue === 30 ? "hard" : "medium"
              },
              nextIndex,
              safeGroupKey,
              safeGameId
            )
            : normalizeQuestion(baseQuestion, nextIndex, safeGroupKey, safeGameId);
      }

      nextSession.settings.customQuestions[safeGameId][safeGroupKey] = [
        ...currentList,
        normalizedQuestion
      ];

      await persistSession(nextSession);
      return true;
    },
    [persistSession]
  );

  const addCustomPuzzle = useCallback(async (imageUrl) => {
    const currentSession = dataRef.current;
    if (!currentSession || typeof imageUrl !== "string" || !imageUrl.trim()) {
      return false;
    }

    const nextSession = clone(currentSession);
    const nextCustomPuzzle = {
      id: `custom-puzzle-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      imageUrl
    };
    nextSession.settings.customPuzzles = [
      ...nextSession.settings.customPuzzles,
      nextCustomPuzzle
    ];
    await persistSession(nextSession);
    return true;
  }, [persistSession]);

  const removeCustomQuestion = useCallback(async ({ gameId, groupKey, questionId }) => {
    const currentSession = dataRef.current;
    if (!currentSession || typeof questionId !== "string") {
      return false;
    }

    const safeGameId =
      gameId === "worm" || gameId === "bridge" || gameId === "jar"
        ? gameId
        : "balloon";
    const safeGroupKey = groupKey === "B" ? "B" : "A";
    const nextSession = clone(currentSession);
    const currentList = nextSession.settings.customQuestions[safeGameId][safeGroupKey];
    const nextList = currentList.filter((question) => question.id !== questionId);

    if (nextList.length === currentList.length) {
      return false;
    }

    nextSession.settings.customQuestions[safeGameId][safeGroupKey] = nextList;
    await persistSession(nextSession);
    return true;
  }, [persistSession]);

  const removeCustomPuzzle = useCallback(async (puzzleId) => {
    const currentSession = dataRef.current;
    if (!currentSession || typeof puzzleId !== "string") {
      return false;
    }

    const nextSession = clone(currentSession);
    const currentPuzzles = nextSession.settings.customPuzzles;
    const nextPuzzles = currentPuzzles.filter((puzzle) => puzzle.id !== puzzleId);

    if (nextPuzzles.length === currentPuzzles.length) {
      return false;
    }

    nextSession.settings.customPuzzles = nextPuzzles;
    await persistSession(nextSession);
    return true;
  }, [persistSession]);

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
    turn.currentQuestionId = null;
    turn.askedQuestionIds = [];

    if (activeGame?.id === "balloon") {
      assignNextBalloonQuestion(nextSession, nextSession.activeGroup);
    } else if (activeGame?.id === "bridge") {
      assignNextBridgeQuestion(nextSession, nextSession.activeGroup);
    }

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
      const nextGame = nextSession.games[nextGameIndex];

      if (currentGame?.id === "balloon") {
        nextSession.phase = "balloonTransition";
        nextSession.roundStatus = "transition";
        nextSession.gameState.transition.balloonPopped = false;
      } else if (nextGame?.id === "puzzle") {
        nextSession.phase = "puzzleSetup";
        nextSession.roundStatus = "transition";
        nextSession.activeGameIndex = nextGameIndex;
        nextSession.activeGroup = "A";
        nextSession.gameState.transition.puzzleDifficulty = "medium";
        nextSession.gameState.turns = clone(defaultSession.gameState.turns);
        nextSession.timer = {
          durationSeconds: nextSession.games[nextGameIndex]?.durationSeconds ?? 90,
          startedAt: null,
          endsAt: null
        };
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
      if (amount !== 0) {
        playAnswerFeedbackSound(amount > 0);
      }
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
    const nextGame = nextSession.games[nextGameIndex];

    nextSession.gameState.transition.balloonPopped = false;

    if (nextGame?.id === "puzzle") {
      nextSession.phase = "puzzleSetup";
      nextSession.roundStatus = "transition";
      nextSession.activeGameIndex = nextGameIndex;
      nextSession.activeGroup = "A";
      nextSession.gameState.transition.puzzleDifficulty = "medium";
      nextSession.timer = {
        durationSeconds: nextSession.games[nextGameIndex]?.durationSeconds ?? 90,
        startedAt: null,
        endsAt: null
      };
      nextSession.gameState.turns = clone(defaultSession.gameState.turns);
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

    await persistSession(nextSession);
  }, [data, persistSession]);

  const answerQuestion = useCallback(
    async (isCorrect) => {
      if (
        !data ||
        data.phase !== "playing" ||
        data.roundStatus !== "running" ||
        activeGame?.id !== "balloon"
      ) {
        return;
      }

      const nextSession = clone(data);
      const groupKey = nextSession.activeGroup;
      const turn = nextSession.gameState.turns[groupKey];
      const currentQuestion = resolveCurrentBalloonQuestion(nextSession);

      if (!currentQuestion) {
        return;
      }

      turn.answered += 1;
      turn.questionIndex += 1;

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

      playAnswerFeedbackSound(isCorrect);
      assignNextBalloonQuestion(nextSession, groupKey);
      await persistSession(nextSession);
    },
    [activeGame, data, persistSession]
  );

  const answerBridgeQuestion = useCallback(
    async (isCorrect) => {
      if (
        !data ||
        data.phase !== "playing" ||
        data.roundStatus !== "running" ||
        activeGame?.id !== "bridge"
      ) {
        return;
      }

      const nextSession = clone(data);
      const groupKey = nextSession.activeGroup;
      const turn = nextSession.gameState.turns[groupKey];
      const currentQuestion = resolveCurrentBridgeQuestion(nextSession);

      if (!currentQuestion) {
        return;
      }

      turn.answered += 1;

      if (isCorrect) {
        turn.correct += 1;
        turn.questionIndex += 1;
        nextSession.groups[groupKey].score = Math.max(
          0,
          nextSession.groups[groupKey].score + 10
        );

        if (turn.questionIndex < (activeGame.targetSteps ?? BRIDGE_TARGET_STEPS)) {
          assignNextBridgeQuestion(nextSession, groupKey);
        } else {
          turn.currentQuestionId = null;
        }
      } else {
        nextSession.groups[groupKey].score = Math.max(
          0,
          nextSession.groups[groupKey].score - 10
        );
      }

      playAnswerFeedbackSound(isCorrect);
      await persistSession(nextSession);
    },
    [activeGame, data, persistSession]
  );

  const openJarQuestion = useCallback(async () => {
    if (
      !data ||
      data.phase !== "playing" ||
      data.roundStatus !== "running" ||
      activeGame?.id !== "jar"
    ) {
      return false;
    }

    const nextSession = clone(data);
    const groupKey = nextSession.activeGroup;
    assignNextJarQuestion(nextSession, groupKey);
    await persistSession(nextSession);
    return true;
  }, [activeGame?.id, data, persistSession]);

  const answerJarQuestion = useCallback(
    async (isCorrect) => {
      if (
        !data ||
        data.phase !== "playing" ||
        data.roundStatus !== "running" ||
        activeGame?.id !== "jar"
      ) {
        return;
      }

      const nextSession = clone(data);
      const groupKey = nextSession.activeGroup;
      const turn = nextSession.gameState.turns[groupKey];
      turn.answered += 1;
      turn.questionIndex += 1;

      if (isCorrect) {
        turn.correct += 1;
        nextSession.groups[groupKey].score = Math.max(0, nextSession.groups[groupKey].score + 10);
      } else {
        nextSession.groups[groupKey].score = Math.max(0, nextSession.groups[groupKey].score - 10);
      }

      turn.currentQuestionId = null;
      playAnswerFeedbackSound(isCorrect);
      await persistSession(nextSession);
    },
    [activeGame?.id, data, persistSession]
  );

  const answerCupGuess = useCallback(
    async (isCorrect) => {
      if (
        !data ||
        data.phase !== "playing" ||
        data.roundStatus !== "running" ||
        activeGame?.id !== "cup"
      ) {
        return null;
      }

      const nextSession = clone(data);
      const groupKey = nextSession.activeGroup;
      const turn = nextSession.gameState.turns[groupKey];
      const roundsPerGroup = Math.max(
        1,
        Number(activeGame.roundsPerGroup) || CUP_ROUNDS_PER_GROUP
      );

      if (turn.questionIndex >= roundsPerGroup) {
        return turn.questionIndex;
      }

      turn.answered += 1;
      turn.questionIndex += 1;

      if (isCorrect) {
        turn.correct += 1;
        nextSession.groups[groupKey].score = Math.max(
          0,
          nextSession.groups[groupKey].score + (activeGame.pointsPerCorrect ?? 20)
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
      }

      playAnswerFeedbackSound(isCorrect);
      await persistSession(nextSession);
      return turn.questionIndex;
    },
    [activeGame, data, persistSession]
  );

  const setPuzzleDifficulty = useCallback(async (difficultyKey) => {
    if (!data || data.phase !== "puzzleSetup") {
      return;
    }

    const nextSession = clone(data);
    nextSession.gameState.transition.puzzleDifficulty =
      getPuzzleDifficultyByKey(difficultyKey).key;
    await persistSession(nextSession);
  }, [data, persistSession]);

  const continueToPuzzle = useCallback(async () => {
    if (!data || data.phase !== "puzzleSetup") {
      return;
    }

    const nextSession = clone(data);
    const selectedDifficulty = getPuzzleDifficultyByKey(
      nextSession.gameState.transition.puzzleDifficulty
    );

    nextSession.games = nextSession.games.map((game) => {
      if (game.id !== "puzzle") {
        return game;
      }

      return {
        ...game,
        cols: selectedDifficulty.cols,
        rows: selectedDifficulty.rows
      };
    });
    nextSession.phase = "playing";
    nextSession.roundStatus = "idle";
    nextSession.activeGroup = "A";
    nextSession.gameState.turns = clone(defaultSession.gameState.turns);
    nextSession.timer = {
      durationSeconds: nextSession.games[nextSession.activeGameIndex]?.durationSeconds ?? 90,
      startedAt: null,
      endsAt: null
    };

    await persistSession(nextSession);
  }, [data, persistSession]);

  const jumpToDeveloperScene = useCallback(async (sceneKey) => {
    const currentSession = dataRef.current ?? normalizeSession(clone(defaultSession));
    const keepSettings = clone(currentSession.settings);
    const keepGroups = clone(currentSession.groups);
    const makeSession = (gameId = null) => {
      const session = createSessionForGame(gameId);
      session.settings = keepSettings;
      session.groups = keepGroups;
      return session;
    };
    let nextSession = makeSession();

    if (sceneKey === "intro") {
      nextSession = normalizeSession(clone(defaultSession));
      nextSession.settings = keepSettings;
      nextSession.groups = keepGroups;
    } else if (sceneKey === "balloon") {
      nextSession = makeSession("balloon");
    } else if (sceneKey === "worm") {
      nextSession = makeSession("worm");
    } else if (sceneKey === "bridge") {
      nextSession = makeSession("bridge");
    } else if (sceneKey === "jar") {
      nextSession = makeSession("jar");
    } else if (sceneKey === "cup") {
      nextSession = makeSession("cup");
    } else if (sceneKey === "match") {
      nextSession = makeSession("match");
    } else if (sceneKey === "puzzle") {
      nextSession = makeSession("puzzle");
    } else if (sceneKey === "balloonTransition") {
      nextSession = makeSession("balloon");
      nextSession.phase = "balloonTransition";
      nextSession.roundStatus = "transition";
      nextSession.gameState.transition.balloonPopped = false;
    } else if (sceneKey === "puzzleSetup") {
      nextSession = makeSession("puzzle");
      nextSession.phase = "puzzleSetup";
      nextSession.roundStatus = "transition";
      nextSession.gameState.transition.puzzleDifficulty = "medium";
    } else if (sceneKey === "winner") {
      nextSession = makeSession("puzzle");
      nextSession.phase = "winner";
      nextSession.roundStatus = "complete";
    }

    await persistSession(nextSession);
    setSettingsOpen(false);
  }, [createSessionForGame, persistSession]);

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

  if (settingsOpen) {
    const allQuestions = {
      balloon: {
        A: getQuestionsForGroup("balloon", "A", data.settings.customQuestions),
        B: getQuestionsForGroup("balloon", "B", data.settings.customQuestions)
      },
      worm: {
        A: getQuestionsForGroup("worm", "A", data.settings.customQuestions),
        B: getQuestionsForGroup("worm", "B", data.settings.customQuestions)
      },
      bridge: {
        A: getQuestionsForGroup("bridge", "A", data.settings.customQuestions),
        B: getQuestionsForGroup("bridge", "B", data.settings.customQuestions)
      },
      jar: {
        A: getQuestionsForGroup("jar", "A", data.settings.customQuestions),
        B: getQuestionsForGroup("jar", "B", data.settings.customQuestions)
      }
    };

    return (
      <SettingsScreen
        allQuestions={allQuestions}
        customQuestions={data.settings.customQuestions}
        customPuzzles={data.settings.customPuzzles}
        customQuestionCounts={{
          balloon: {
            A: data.settings.customQuestions.balloon.A.length,
            B: data.settings.customQuestions.balloon.B.length
          },
          worm: {
            A: data.settings.customQuestions.worm.A.length,
            B: data.settings.customQuestions.worm.B.length
          },
          bridge: {
            A: data.settings.customQuestions.bridge.A.length,
            B: data.settings.customQuestions.bridge.B.length
          },
          jar: {
            A: data.settings.customQuestions.jar.A.length,
            B: data.settings.customQuestions.jar.B.length
          }
        }}
        developerMode={data.settings.developerMode}
        onAddCustomPuzzle={addCustomPuzzle}
        onAddQuestion={addCustomQuestion}
        onRemoveCustomPuzzle={removeCustomPuzzle}
        onRemoveQuestion={removeCustomQuestion}
        onClose={() => setSettingsOpen(false)}
        onToggleDeveloperMode={(enabled) => {
          void updateSettings((currentSettings) => ({
            ...currentSettings,
            developerMode: enabled
          }));
        }}
      />
    );
  }

  const settingsButton = data.settings.developerMode ? null : (
    <IconActionButton
      actionType="settings"
      className="small-button settings-open-button"
      onClick={() => setSettingsOpen(true)}
    />
  );

  const developerNav =
    data.settings.developerMode ? (
      <DeveloperQuickNav onJump={jumpToDeveloperScene} onOpenSettings={() => setSettingsOpen(true)} />
    ) : null;

  if (data.phase === "playing") {
    if (activeGame?.id === "worm") {
      return (
        <>
          <WormGame
            activeGame={activeGame}
            activeGroup={data.activeGroup}
            customQuestions={data.settings.customQuestions}
            groups={data.groups}
            isRunning={data.roundStatus === "running"}
            onAddScore={addScoreToActiveGroup}
            onReset={resetProgress}
            onStartTurn={startTurn}
            timeLeft={timeLeft}
          />
          {settingsButton}
          {developerNav}
        </>
      );
    }

    if (activeGame?.id === "bridge") {
      return (
        <>
          <BridgeGame
            activeGame={activeGame}
            activeGroup={data.activeGroup}
            activeTurn={activeTurn}
            groups={data.groups}
            isRunning={data.roundStatus === "running"}
            onAnswer={answerBridgeQuestion}
            onCompleteTurn={finishTurn}
            onReset={resetProgress}
            onStartTurn={startTurn}
            question={activeBridgeQuestion}
            timeLeft={timeLeft}
          />
          {settingsButton}
          {developerNav}
        </>
      );
    }

    if (activeGame?.id === "puzzle") {
      return (
        <>
          <PuzzleGame
            activeGame={activeGame}
            activeGroup={data.activeGroup}
            customPuzzles={data.settings.customPuzzles}
            groups={data.groups}
            isRunning={data.roundStatus === "running"}
            onAddScore={addScoreToActiveGroup}
            onCompleteTurn={finishTurn}
            onReset={resetProgress}
            onStartTurn={startTurn}
            timeLeft={timeLeft}
          />
          {settingsButton}
          {developerNav}
        </>
      );
    }

    if (activeGame?.id === "match") {
      return (
        <>
          <MatchingGame
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
          {settingsButton}
          {developerNav}
        </>
      );
    }

    if (activeGame?.id === "jar") {
      return (
        <>
          <JarGame
            activeGame={activeGame}
            activeGroup={data.activeGroup}
            activeTurn={activeTurn}
            groups={data.groups}
            isRunning={data.roundStatus === "running"}
            onAnswer={answerJarQuestion}
            onCatchPaper={openJarQuestion}
            onReset={resetProgress}
            onStartTurn={startTurn}
            question={activeJarQuestion}
            timeLeft={timeLeft}
          />
          {settingsButton}
          {developerNav}
        </>
      );
    }

    if (activeGame?.id === "cup") {
      return (
        <>
          <CupGame
            activeGame={activeGame}
            activeGroup={data.activeGroup}
            activeTurn={activeTurn}
            groups={data.groups}
            isRunning={data.roundStatus === "running"}
            onCompleteTurn={finishTurn}
            onGuess={answerCupGuess}
            onReset={resetProgress}
            onStartTurn={startTurn}
            timeLeft={timeLeft}
          />
          {settingsButton}
          {developerNav}
        </>
      );
    }

    return (
      <>
        <BalloonGame
          activeGame={activeGame}
          activeGroup={data.activeGroup}
          activeTurn={activeTurn}
          groups={data.groups}
          isRunning={data.roundStatus === "running"}
          onAnswer={answerQuestion}
          onReset={resetProgress}
          onStartTurn={startTurn}
          question={activeBalloonQuestion}
          timeLeft={timeLeft}
        />
        {settingsButton}
        {developerNav}
      </>
    );
  }

  if (data.phase === "winner") {
    return (
      <>
        <WinnerScreen groups={data.groups} onRestart={resetProgress} />
        {settingsButton}
        {developerNav}
      </>
    );
  }

  if (data.phase === "balloonTransition") {
    return (
      <>
        <BalloonTransitionScreen
          onContinue={continueToNextSection}
          onPop={popTransitionBalloon}
          onReset={resetProgress}
          popped={data.gameState.transition.balloonPopped}
        />
        {settingsButton}
        {developerNav}
      </>
    );
  }

  if (data.phase === "puzzleSetup") {
    return (
      <>
        <PuzzleSetupScreen
          activeDifficulty={data.gameState.transition.puzzleDifficulty}
          onContinue={continueToPuzzle}
          onReset={resetProgress}
          onSetDifficulty={setPuzzleDifficulty}
        />
        {settingsButton}
        {developerNav}
      </>
    );
  }

  return (
    <>
      <IntroScreen onStart={startSession} />
      {settingsButton}
      {developerNav}
    </>
  );
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

function IconActionButton({ actionType, className = "", onClick }) {
  const isSettings = actionType === "settings";
  const label = isSettings ? "Ayarlar" : "Sıfırla";

  return (
    <button
      aria-label={label}
      className={`pixel-button icon-button ${
        isSettings ? "settings-icon-button" : "reset-icon-button"
      } ${className}`.trim()}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`icon-glyph ${isSettings ? "settings-glyph" : "reset-glyph"}`}
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function CelebrationBurst({ burst }) {
  if (!burst?.id) {
    return null;
  }

  return (
    <div
      className="mini-confetti"
      key={burst.id}
      style={{ left: burst.x, top: burst.y }}
    >
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function DeveloperQuickNav({ onJump, onOpenSettings }) {
  const quickLinks = [
    { key: "intro", label: "Ana" },
    { key: "balloon", label: "Balon" },
    { key: "worm", label: "Yılan" },
    { key: "bridge", label: "Boşluk" },
    { key: "jar", label: "Fanus" },
    { key: "cup", label: "Bardak" },
    { key: "match", label: "Eşleştir" },
    { key: "balloonTransition", label: "Patlat" },
    { key: "puzzleSetup", label: "Puzzle Seç" },
    { key: "puzzle", label: "Puzzle" },
    { key: "winner", label: "Kazanan" }
  ];

  return (
    <aside className="developer-nav" aria-label="Geliştirici Kısayolları">
      <IconActionButton
        actionType="settings"
        className="tiny-button developer-settings-icon"
        onClick={onOpenSettings}
      />
      {quickLinks.map((link) => (
        <button
          className="pixel-button tiny-button"
          key={link.key}
          onClick={() => onJump(link.key)}
          type="button"
        >
          {link.label}
        </button>
      ))}
    </aside>
  );
}

function QuestionAdder({
  count,
  gameId,
  groupKey,
  label,
  allQuestions,
  onAddQuestion,
  onRemoveQuestion,
  showPointValue = false
}) {
  const [questionText, setQuestionText] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("Doğru");
  const [pointValue, setPointValue] = useState(20);
  const [statusText, setStatusText] = useState("");

  const submitForm = useCallback(async (event) => {
    event.preventDefault();
    const saved = await onAddQuestion({
      gameId,
      groupKey,
      questionText,
      correctAnswer,
      pointValue
    });

    if (saved) {
      setQuestionText("");
      setStatusText("Soru eklendi.");
      return;
    }

    setStatusText("Lütfen soru metni gir.");
  }, [correctAnswer, gameId, groupKey, onAddQuestion, pointValue, questionText]);

  const removeQuestion = useCallback(async (questionId) => {
    const removed = await onRemoveQuestion({ gameId, groupKey, questionId });
    setStatusText(removed ? "Soru silindi." : "Soru silinemedi.");
  }, [gameId, groupKey, onRemoveQuestion]);

  return (
    <form className="settings-form-card" onSubmit={submitForm}>
      <h4>{label}</h4>
      <small>{count} özel soru</small>
      <textarea
        onChange={(event) => setQuestionText(event.target.value)}
        placeholder="Soru metni"
        rows={3}
        value={questionText}
      />
      <div className="settings-row">
        <label>
          Doğru Cevap
          <select
            onChange={(event) => setCorrectAnswer(event.target.value)}
            value={correctAnswer}
          >
            <option value="Doğru">Doğru</option>
            <option value="Yanlış">Yanlış</option>
          </select>
        </label>
        {showPointValue ? (
          <label>
            Puan
            <select
              onChange={(event) => setPointValue(Number(event.target.value))}
              value={pointValue}
            >
              {WORM_VALUE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <button className="pixel-button small-button" type="submit">
        Soru Ekle
      </button>
      {statusText ? <p className="settings-status">{statusText}</p> : null}
      <div className="saved-list">
        {allQuestions.length === 0 ? (
          <div className="saved-item-empty">Kayıtlı soru yok.</div>
        ) : (
          allQuestions.map((question) => {
            const trueOption = getAnswerChoices(question).find(
              (choice) => choice.text === "Doğru"
            );
            const correctLabel = trueOption?.isCorrect ? "Doğru" : "Yanlış";
            const isCustomQuestion = String(question.id || "").startsWith("custom-");

            return (
              <div className="saved-item" key={question.id}>
                <div className="saved-item-content">
                  <strong>{question.question}</strong>
                  <small>
                    Kaynak: {isCustomQuestion ? "Özel" : "Hazır"} |{" "}
                    Cevap: {correctLabel}
                    {showPointValue ? ` | Puan: ${getWormPointValue(question, 0)}` : ""}
                  </small>
                </div>
                {isCustomQuestion ? (
                  <button
                    className="pixel-button tiny-button false-answer-button"
                    onClick={() => removeQuestion(question.id)}
                    type="button"
                  >
                    Sil
                  </button>
                ) : (
                  <span className="saved-item-lock">Kilitli</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </form>
  );
}

function FillBlankQuestionAdder({
  count,
  gameId,
  groupKey,
  label,
  allQuestions,
  onAddQuestion,
  onRemoveQuestion
}) {
  const [questionText, setQuestionText] = useState("");
  const [correctOptionText, setCorrectOptionText] = useState("");
  const [wrongOptionsText, setWrongOptionsText] = useState("");
  const [statusText, setStatusText] = useState("");

  const submitForm = useCallback(async (event) => {
    event.preventDefault();
    const safeQuestionText = String(questionText ?? "").trim();
    const safeCorrectOptionText = String(correctOptionText ?? "").trim();
    const safeWrongOptions = String(wrongOptionsText ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!safeQuestionText || !safeCorrectOptionText) {
      setStatusText("Cümle ve doğru seçenek zorunlu.");
      return;
    }

    const saved = await onAddQuestion({
      gameId,
      groupKey,
      questionText: safeQuestionText,
      correctOptionText: safeCorrectOptionText,
      wrongOptionTexts: safeWrongOptions
    });

    if (saved) {
      setQuestionText("");
      setCorrectOptionText("");
      setWrongOptionsText("");
      setStatusText("Soru eklendi.");
      return;
    }

    setStatusText("Soru eklenemedi.");
  }, [
    correctOptionText,
    gameId,
    groupKey,
    onAddQuestion,
    questionText,
    wrongOptionsText
  ]);

  const removeQuestion = useCallback(async (questionId) => {
    const removed = await onRemoveQuestion({ gameId, groupKey, questionId });
    setStatusText(removed ? "Soru silindi." : "Soru silinemedi.");
  }, [gameId, groupKey, onRemoveQuestion]);

  return (
    <form className="settings-form-card" onSubmit={submitForm}>
      <h4>{label}</h4>
      <small>{count} özel soru</small>
      <textarea
        onChange={(event) => setQuestionText(event.target.value)}
        placeholder="Boşluklu cümle (ör: Güçlü bir ____ seçmeliyiz.)"
        rows={3}
        value={questionText}
      />
      <label>
        Doğru Seçenek
        <input
          onChange={(event) => setCorrectOptionText(event.target.value)}
          placeholder="Örn: şifre"
          type="text"
          value={correctOptionText}
        />
      </label>
      <label>
        Yanlış Seçenekler (virgülle)
        <input
          onChange={(event) => setWrongOptionsText(event.target.value)}
          placeholder="Örn: renk, oyuncak"
          type="text"
          value={wrongOptionsText}
        />
      </label>
      <button className="pixel-button small-button" type="submit">
        Soru Ekle
      </button>
      {statusText ? <p className="settings-status">{statusText}</p> : null}
      <div className="saved-list">
        {allQuestions.length === 0 ? (
          <div className="saved-item-empty">Kayıtlı soru yok.</div>
        ) : (
          allQuestions.map((question) => {
            const isCustomQuestion = String(question.id || "").startsWith("custom-");
            const correctChoice = getCorrectAnswerChoice(question);
            const optionsText = getAnswerChoices(question)
              .map((choice) => choice.text)
              .join(" | ");

            return (
              <div className="saved-item" key={question.id}>
                <div className="saved-item-content">
                  <strong>{question.question}</strong>
                  <small>
                    Kaynak: {isCustomQuestion ? "Özel" : "Hazır"} |{" "}
                    Doğru: {correctChoice?.text ?? "-"}
                  </small>
                  <small>Şıklar: {optionsText}</small>
                </div>
                {isCustomQuestion ? (
                  <button
                    className="pixel-button tiny-button false-answer-button"
                    onClick={() => removeQuestion(question.id)}
                    type="button"
                  >
                    Sil
                  </button>
                ) : (
                  <span className="saved-item-lock">Kilitli</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </form>
  );
}

function MultipleChoiceQuestionAdder({
  count,
  gameId,
  groupKey,
  label,
  allQuestions,
  onAddQuestion,
  onRemoveQuestion
}) {
  const [questionText, setQuestionText] = useState("");
  const [correctOptionText, setCorrectOptionText] = useState("");
  const [wrongOptionsText, setWrongOptionsText] = useState("");
  const [statusText, setStatusText] = useState("");

  const submitForm = useCallback(async (event) => {
    event.preventDefault();
    const safeQuestionText = String(questionText ?? "").trim();
    const safeCorrectOptionText = String(correctOptionText ?? "").trim();
    const safeWrongOptions = String(wrongOptionsText ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!safeQuestionText || !safeCorrectOptionText || safeWrongOptions.length < 2) {
      setStatusText("Soru, doğru seçenek ve en az 2 yanlış seçenek gerekli.");
      return;
    }

    const saved = await onAddQuestion({
      gameId,
      groupKey,
      questionText: safeQuestionText,
      correctOptionText: safeCorrectOptionText,
      wrongOptionTexts: safeWrongOptions
    });

    if (saved) {
      setQuestionText("");
      setCorrectOptionText("");
      setWrongOptionsText("");
      setStatusText("Soru eklendi.");
      return;
    }

    setStatusText("Soru eklenemedi.");
  }, [
    correctOptionText,
    gameId,
    groupKey,
    onAddQuestion,
    questionText,
    wrongOptionsText
  ]);

  const removeQuestion = useCallback(async (questionId) => {
    const removed = await onRemoveQuestion({ gameId, groupKey, questionId });
    setStatusText(removed ? "Soru silindi." : "Soru silinemedi.");
  }, [gameId, groupKey, onRemoveQuestion]);

  return (
    <form className="settings-form-card" onSubmit={submitForm}>
      <h4>{label}</h4>
      <small>{count} özel soru</small>
      <textarea
        onChange={(event) => setQuestionText(event.target.value)}
        placeholder="Soru metni"
        rows={3}
        value={questionText}
      />
      <label>
        Doğru Seçenek
        <input
          onChange={(event) => setCorrectOptionText(event.target.value)}
          placeholder="Örn: Güvendiğim bir büyüğe haber veririm"
          type="text"
          value={correctOptionText}
        />
      </label>
      <label>
        Yanlış Seçenekler (virgülle)
        <input
          onChange={(event) => setWrongOptionsText(event.target.value)}
          placeholder="Örn: Hemen paylaşırım, Şifremi veririm"
          type="text"
          value={wrongOptionsText}
        />
      </label>
      <button className="pixel-button small-button" type="submit">
        Soru Ekle
      </button>
      {statusText ? <p className="settings-status">{statusText}</p> : null}
      <div className="saved-list">
        {allQuestions.length === 0 ? (
          <div className="saved-item-empty">Kayıtlı soru yok.</div>
        ) : (
          allQuestions.map((question) => {
            const isCustomQuestion = String(question.id || "").startsWith("custom-");
            const correctChoice = getCorrectAnswerChoice(question);
            const optionsText = getAnswerChoices(question)
              .map((choice) => choice.text)
              .join(" | ");

            return (
              <div className="saved-item" key={question.id}>
                <div className="saved-item-content">
                  <strong>{question.question}</strong>
                  <small>
                    Kaynak: {isCustomQuestion ? "Özel" : "Hazır"} | Doğru: {correctChoice?.text ?? "-"}
                  </small>
                  <small>Şıklar: {optionsText}</small>
                </div>
                {isCustomQuestion ? (
                  <button
                    className="pixel-button tiny-button false-answer-button"
                    onClick={() => removeQuestion(question.id)}
                    type="button"
                  >
                    Sil
                  </button>
                ) : (
                  <span className="saved-item-lock">Kilitli</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </form>
  );
}

function SettingsScreen({
  allQuestions,
  customQuestions,
  customPuzzles,
  customQuestionCounts,
  developerMode,
  onAddCustomPuzzle,
  onAddQuestion,
  onRemoveCustomPuzzle,
  onRemoveQuestion,
  onClose,
  onToggleDeveloperMode
}) {
  const [puzzleStatus, setPuzzleStatus] = useState("");

  const handlePuzzleFile = useCallback((event) => {
    const file = event.target.files?.[0];
    const inputElement = event.target;
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const imageUrl = typeof reader.result === "string" ? reader.result : "";
      const saved = await onAddCustomPuzzle(imageUrl);
      setPuzzleStatus(saved ? "Puzzle görseli eklendi." : "Puzzle eklenemedi.");
      inputElement.value = "";
    };
    reader.readAsDataURL(file);
  }, [onAddCustomPuzzle]);

  return (
    <main className="app-screen game-screen settings-screen">
      <header className="settings-header">
        <h2>Ayarlar</h2>
        <button className="pixel-button small-button" onClick={onClose} type="button">
          Kapat
        </button>
      </header>
      <section className="settings-panel">
        <div className="settings-toggle-row">
          <span>Geliştirici Modu</span>
          <label className="settings-toggle">
            <input
              checked={developerMode}
              onChange={(event) => onToggleDeveloperMode(event.target.checked)}
              type="checkbox"
            />
            <span>{developerMode ? "Açık" : "Kapalı"}</span>
          </label>
        </div>

        <h3>Balon Oyunu Soruları</h3>
        <div className="settings-grid two-col">
          <QuestionAdder
            count={customQuestionCounts.balloon.A}
            gameId="balloon"
            groupKey="A"
            allQuestions={allQuestions.balloon.A}
            label="A Grubu"
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
          />
          <QuestionAdder
            count={customQuestionCounts.balloon.B}
            gameId="balloon"
            groupKey="B"
            allQuestions={allQuestions.balloon.B}
            label="B Grubu"
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
          />
        </div>

        <h3>Yılan Oyunu Soruları</h3>
        <div className="settings-grid two-col">
          <QuestionAdder
            count={customQuestionCounts.worm.A}
            gameId="worm"
            groupKey="A"
            allQuestions={allQuestions.worm.A}
            label="A Grubu"
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
            showPointValue
          />
          <QuestionAdder
            count={customQuestionCounts.worm.B}
            gameId="worm"
            groupKey="B"
            allQuestions={allQuestions.worm.B}
            label="B Grubu"
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
            showPointValue
          />
        </div>

        <h3>Boşluk Doldurma Soruları</h3>
        <div className="settings-grid two-col">
          <FillBlankQuestionAdder
            count={customQuestionCounts.bridge.A}
            gameId="bridge"
            groupKey="A"
            allQuestions={allQuestions.bridge.A}
            label="A Grubu"
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
          />
          <FillBlankQuestionAdder
            count={customQuestionCounts.bridge.B}
            gameId="bridge"
            groupKey="B"
            allQuestions={allQuestions.bridge.B}
            label="B Grubu"
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
          />
        </div>

        <h3>Fanus Oyunu Soruları</h3>
        <div className="settings-grid two-col">
          <MultipleChoiceQuestionAdder
            count={customQuestionCounts.jar.A}
            gameId="jar"
            groupKey="A"
            allQuestions={allQuestions.jar.A}
            label="A Grubu"
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
          />
          <MultipleChoiceQuestionAdder
            count={customQuestionCounts.jar.B}
            gameId="jar"
            groupKey="B"
            allQuestions={allQuestions.jar.B}
            label="B Grubu"
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
          />
        </div>

        <h3>Puzzle Görseli Ekle</h3>
        <div className="settings-upload">
          <label className="settings-file">
            <span>Görsel Seç</span>
            <input accept="image/*" onChange={handlePuzzleFile} type="file" />
          </label>
          <strong>{customPuzzles.length} özel puzzle görseli</strong>
        </div>
        <div className="puzzle-list">
          {customPuzzles.length === 0 ? (
            <div className="saved-item-empty">Kayıtlı puzzle görseli yok.</div>
          ) : (
            customPuzzles.map((puzzle, index) => (
              <div className="puzzle-item" key={puzzle.id}>
                <img alt={`Puzzle ${index + 1}`} src={puzzle.imageUrl} />
                <button
                  className="pixel-button tiny-button false-answer-button"
                  onClick={() => {
                    void onRemoveCustomPuzzle(puzzle.id);
                  }}
                  type="button"
                >
                  Sil
                </button>
              </div>
            ))
          )}
        </div>
        {puzzleStatus ? <p className="settings-status">{puzzleStatus}</p> : null}
      </section>
    </main>
  );
}

function PuzzleSetupScreen({ activeDifficulty, onContinue, onReset, onSetDifficulty }) {
  return (
    <main className="app-screen center-screen game-screen puzzle-setup-screen">
      <section className="puzzle-setup-panel">
        <h2>Puzzle Zorluğunu Seç</h2>
        <div className="difficulty-options">
          {PUZZLE_DIFFICULTY_OPTIONS.map((option) => (
            <button
              className={`pixel-button small-button ${
                activeDifficulty === option.key ? "true-answer-button" : ""
              }`}
              key={option.key}
              onClick={() => onSetDifficulty(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="puzzle-setup-actions">
          <button className="pixel-button start-button" onClick={onContinue} type="button">
            Devam Et
          </button>
          <IconActionButton actionType="reset" className="small-button reset-button-static" onClick={onReset} />
        </div>
      </section>
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
  question,
  timeLeft
}) {
  const [burst, setBurst] = useState(null);
  const fallbackQuestion = normalizeQuestion(
    getFallbackQuestions("balloon", activeGroup)[0],
    0,
    activeGroup,
    "balloon"
  );
  const visibleQuestion = question ?? fallbackQuestion;
  const choices = getAnswerChoices(visibleQuestion);
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
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
        </section>
      ) : (
        <section className="balloon-stage" aria-label="Balon oyunu">
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
          <div
            className="question-bubble"
            key={`${activeGroup}-${balloonLevel}`}
            style={{ "--bubble-size": `${bubbleSize}px` }}
          >
            <span className="balloon-shine" />
          </div>
          <div className="question-answer-block">
            <div className="question-card">{visibleQuestion.question}</div>
            <div className="answer-row">
              {choices.map((choice) => (
                <button
                  className={`pixel-button answer-button ${
                    choice.text === "Doğru"
                      ? "true-answer-button"
                      : "false-answer-button"
                  }`}
                  key={`${choice.text}-${choice.isCorrect}`}
                  onClick={() => {
                    if (choice.isCorrect) {
                      setBurst((previousBurst) => nextBurstState(previousBurst));
                    }
                    onAnswer(choice.isCorrect);
                  }}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </div>
          <CelebrationBurst burst={burst} />
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
      <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
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

function BridgeGame({
  activeGame,
  activeGroup,
  activeTurn,
  groups,
  isRunning,
  onAnswer,
  onCompleteTurn,
  onReset,
  onStartTurn,
  question,
  timeLeft
}) {
  const [burst, setBurst] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const completedRef = useRef(false);
  const targetSteps = Math.max(1, Number(activeGame?.targetSteps) || BRIDGE_TARGET_STEPS);
  const solvedSteps = Math.max(
    0,
    Math.min(targetSteps, Number(activeTurn?.questionIndex) || 0)
  );
  const fallbackQuestion = normalizeQuestion(
    getFallbackQuestions("bridge", activeGroup)[0],
    0,
    activeGroup,
    "bridge"
  );
  const visibleQuestion = question ?? fallbackQuestion;
  const options = useMemo(
    () => shuffle(getAnswerChoices(visibleQuestion)),
    [activeGroup, activeTurn?.questionIndex, visibleQuestion]
  );
  const questionParts = useMemo(
    () => String(visibleQuestion?.question ?? "").split("____"),
    [visibleQuestion?.question]
  );
  const bridgeTiles = useMemo(
    () => Array.from({ length: targetSteps }, (_, index) => index),
    [targetSteps]
  );
  const bridgeRocks = useMemo(
    () => [
      { x: 8, y: 56, scale: 0.62 },
      { x: 18, y: 78, scale: 0.84 },
      { x: 29, y: 61, scale: 0.68 },
      { x: 40, y: 80, scale: 0.9 },
      { x: 56, y: 60, scale: 0.64 },
      { x: 70, y: 79, scale: 0.88 },
      { x: 83, y: 58, scale: 0.66 },
      { x: 94, y: 80, scale: 0.82 }
    ],
    []
  );
  const bridgeBoardStyle = useMemo(
    () => ({
      "--bridge-underwater-bg-url": `url(${bridgeUnderwaterBgImage})`,
      "--bridge-rock-url": `url(${bridgeRockPileImage})`,
      "--bridge-hero-url": `url(${bridgeHeroSideSheetImage})`
    }),
    []
  );
  const heroIndex = Math.max(0, Math.min(targetSteps - 1, solvedSteps));
  const heroPositionPercent = ((heroIndex + 0.5) / targetSteps) * 100;
  const currentStepLabel = Math.min(solvedSteps + 1, targetSteps);

  useEffect(() => {
    setIsAnswerLocked(false);
    setIsShaking(false);
    setIsJumping(false);
  }, [activeGroup, isRunning, visibleQuestion?.id]);

  useEffect(() => {
    if (!isShaking) {
      return undefined;
    }

    const shakeTimerId = window.setTimeout(() => {
      setIsShaking(false);
    }, 380);

    return () => {
      window.clearTimeout(shakeTimerId);
    };
  }, [isShaking]);

  useEffect(() => {
    if (!isJumping) {
      return undefined;
    }

    const jumpTimerId = window.setTimeout(() => {
      setIsJumping(false);
    }, 460);

    return () => {
      window.clearTimeout(jumpTimerId);
    };
  }, [isJumping]);

  useEffect(() => {
    if (!isRunning || solvedSteps < targetSteps) {
      completedRef.current = false;
      return;
    }

    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    void onCompleteTurn();
  }, [isRunning, onCompleteTurn, solvedSteps, targetSteps]);

  const handleChoice = useCallback(async (choice) => {
    if (!isRunning || isAnswerLocked || solvedSteps >= targetSteps) {
      return;
    }

    setIsAnswerLocked(true);

    if (choice?.isCorrect) {
      setIsJumping(true);
      setBurst((previousBurst) => nextBurstState(previousBurst));
      await onAnswer(true);
    } else {
      setIsShaking(true);
      await onAnswer(false);
    }

    window.setTimeout(() => {
      setIsAnswerLocked(false);
    }, 120);
  }, [isAnswerLocked, isRunning, onAnswer, solvedSteps, targetSteps]);

  return (
    <main className="app-screen game-screen bridge-screen" style={bridgeBoardStyle}>
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
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
        </section>
      ) : (
        <section className="bridge-stage">
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
          <div className="bridge-board">
            <div className={`bridge-question-panel ${isShaking ? "shake" : ""}`}>
              <div className="bridge-question-top">
                <h3>Boşluk Doldurma</h3>
                <span className="bridge-step-chip">
                  {Math.min(currentStepLabel, targetSteps)} / {targetSteps}
                </span>
              </div>
              <p className="bridge-question-text">
                {questionParts.map((part, index) => (
                  <span key={`segment-${index}`}>
                    {part}
                    {index < questionParts.length - 1 ? (
                      <span className="bridge-blank">____</span>
                    ) : null}
                  </span>
                ))}
              </p>
              <div className="bridge-options">
                {options.map((choice, index) => (
                  <button
                    className="pixel-button bridge-option-button"
                    disabled={isAnswerLocked || solvedSteps >= targetSteps}
                    key={`${choice.text}-${index}`}
                    onClick={() => {
                      void handleChoice(choice);
                    }}
                    type="button"
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
            <div className="bridge-sky-deco" aria-hidden="true">
              <span className="bridge-cloud cloud-one" />
              <span className="bridge-cloud cloud-two" />
              <span className="bridge-cloud cloud-three" />
            </div>
            <div className="bridge-water-body" aria-hidden="true" />
            <div className="bridge-waterline" aria-hidden="true" />
            <div className="bridge-rocks-layer" aria-hidden="true">
              {bridgeRocks.map((rock, index) => (
                <span
                  className="bridge-rock"
                  key={`rock-${index}`}
                  style={{
                    "--rock-x": `${rock.x}%`,
                    "--rock-y": `${rock.y}%`,
                    "--rock-scale": rock.scale,
                    "--rock-image": "var(--bridge-rock-url)"
                  }}
                />
              ))}
            </div>
            <div className="bridge-path-wrap">
              <div
                className="bridge-path"
                style={{ gridTemplateColumns: `repeat(${targetSteps}, minmax(0, 1fr))` }}
              >
                {bridgeTiles.map((tileIndex) => (
                  <div
                    className={`bridge-tile ${
                      tileIndex < solvedSteps ? "completed" : ""
                    } ${tileIndex === heroIndex ? "active" : ""}`}
                    key={tileIndex}
                    style={{ "--tile-index": tileIndex }}
                  />
                ))}
              </div>
              <div
                className={`bridge-hero ${isJumping ? "jump moving" : "idle"}`}
                style={{ left: `calc(${heroPositionPercent}% - 130px)` }}
              >
                <span className="bridge-hero-shadow" />
                <span className="bridge-hero-pixel" />
              </div>
            </div>
          </div>
          <CelebrationBurst burst={burst} />
        </section>
      )}
    </main>
  );
}

function CupGame({
  activeGame,
  activeGroup,
  activeTurn,
  groups,
  isRunning,
  onCompleteTurn,
  onGuess,
  onReset,
  onStartTurn,
  timeLeft
}) {
  const [cupSlots, setCupSlots] = useState([0, 1, 2]);
  const [targetCupId, setTargetCupId] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [statusText, setStatusText] = useState("");
  const cupSlotsRef = useRef([0, 1, 2]);
  const targetCupIdRef = useRef(0);
  const timersRef = useRef([]);
  const busyRef = useRef(false);
  const roundKeyRef = useRef("");
  const lastIconIndexRef = useRef(-1);
  const lastTargetCupRef = useRef(-1);
  const hiddenIcon = CUP_ICON_OPTIONS[iconIndex] ?? CUP_ICON_OPTIONS[0];
  const roundsPerGroup = Math.max(
    1,
    Number(activeGame?.roundsPerGroup) || CUP_ROUNDS_PER_GROUP
  );
  const shuffleCount = Math.max(
    4,
    Math.min(6, Number(activeGame?.shuffleCount) || CUP_SHUFFLE_COUNT)
  );
  const scoreCorrect = Number.isFinite(activeGame?.pointsPerCorrect)
    ? activeGame.pointsPerCorrect
    : 20;
  const scoreWrong = Number.isFinite(activeGame?.pointsPerWrong)
    ? activeGame.pointsPerWrong
    : -10;
  const playedRounds = activeTurn?.questionIndex ?? 0;

  const clearRoundTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
      window.clearInterval(timerId);
    });
    timersRef.current = [];
  }, []);

  const startRound = useCallback((roundIndex) => {
    clearRoundTimers();
    busyRef.current = false;
    const initialCupSlots = [0, 1, 2];
    cupSlotsRef.current = initialCupSlots;
    setCupSlots(initialCupSlots);
    const iconPool = CUP_ICON_OPTIONS.map((_, index) => index);
    const availableIcons = iconPool.filter((index) => index !== lastIconIndexRef.current);
    const nextIconIndex = randomFromList(
      availableIcons.length > 0 ? availableIcons : iconPool,
      0
    );
    const cupPool = [0, 1, 2];
    const availableCups = cupPool.filter((cupId) => cupId !== lastTargetCupRef.current);
    const nextTargetCupId = randomFromList(
      availableCups.length > 0 ? availableCups : cupPool,
      0
    );
    lastIconIndexRef.current = nextIconIndex;
    lastTargetCupRef.current = nextTargetCupId;
    targetCupIdRef.current = nextTargetCupId;
    setIconIndex(nextIconIndex);
    setTargetCupId(nextTargetCupId);
    setPhase("peek-up");
    setStatusText(`Tur ${roundIndex + 1}/${roundsPerGroup}`);

    const peekDownTimer = window.setTimeout(() => {
      setPhase("peek-down");
    }, 700);

    const shuffleStartTimer = window.setTimeout(() => {
      setPhase("shuffle");
      setStatusText("Karıştırılıyor...");
      const shufflePlan = createCupShufflePlan(shuffleCount);
      let swapIndex = 0;

      const runNextSwap = () => {
        const [firstSlot, secondSlot] = shufflePlan[swapIndex];
        const nextSlots = swapCupSlots(cupSlotsRef.current, firstSlot, secondSlot);
        cupSlotsRef.current = nextSlots;
        setCupSlots(nextSlots);
        swapIndex += 1;

        if (swapIndex >= shufflePlan.length) {
          const guessTimer = window.setTimeout(() => {
            setPhase("guess");
            setStatusText("Hangi bardakta?");
          }, CUP_SHUFFLE_STEP_MS);
          timersRef.current.push(guessTimer);
          return;
        }

        const nextSwapTimer = window.setTimeout(runNextSwap, CUP_SHUFFLE_STEP_MS);
        timersRef.current.push(nextSwapTimer);
      };

      const firstSwapTimer = window.setTimeout(runNextSwap, CUP_SHUFFLE_PREP_MS);
      timersRef.current.push(firstSwapTimer);
    }, 1350);

    timersRef.current.push(peekDownTimer, shuffleStartTimer);
  }, [clearRoundTimers, roundsPerGroup, shuffleCount]);

  useEffect(() => {
    return () => {
      clearRoundTimers();
    };
  }, [clearRoundTimers]);

  useEffect(() => {
    if (!isRunning) {
      clearRoundTimers();
      busyRef.current = false;
      roundKeyRef.current = "";
      setPhase("idle");
      setStatusText("");
      return;
    }

    const roundIndex = activeTurn?.questionIndex ?? 0;
    if (roundIndex >= roundsPerGroup) {
      setPhase("complete");
      setStatusText("Tur tamamlandı");
      return;
    }

    const currentRoundKey = `${activeGroup}-${roundIndex}`;
    if (roundKeyRef.current === currentRoundKey) {
      return;
    }

    roundKeyRef.current = currentRoundKey;
    startRound(roundIndex);
  }, [
    activeGroup,
    activeTurn?.questionIndex,
    clearRoundTimers,
    isRunning,
    roundsPerGroup,
    startRound
  ]);

  const slotByCup = useMemo(() => {
    const map = [0, 1, 2];
    cupSlots.forEach((cupId, slot) => {
      map[cupId] = slot;
    });
    return map;
  }, [cupSlots]);

  const revealIcon =
    phase === "peek-up" || phase === "peek-down" || phase === "result";
  const canGuess = phase === "guess" && isRunning && !busyRef.current;
  const targetSlot = slotByCup[targetCupId] ?? 0;

  const handleCupPick = useCallback(
    async (cupId) => {
      if (!canGuess) {
        return;
      }

      busyRef.current = true;
      clearRoundTimers();
      setPhase("result");

      const expectedNextRound = (activeTurn?.questionIndex ?? 0) + 1;
      roundKeyRef.current = `${activeGroup}-${expectedNextRound}`;
      const isCorrect = cupId === targetCupIdRef.current;
      const nextRoundCount = await onGuess(isCorrect);
      const resolvedRoundNumber =
        typeof nextRoundCount === "number"
          ? nextRoundCount
          : (activeTurn?.questionIndex ?? 0) + 1;
      setStatusText(
        isCorrect
          ? `${resolvedRoundNumber}. bulundu (+${scoreCorrect})`
          : `${resolvedRoundNumber}. bulunamadı (${scoreWrong})`
      );

      const revealTimer = window.setTimeout(async () => {
        if (typeof nextRoundCount !== "number") {
          busyRef.current = false;
          roundKeyRef.current = `${activeGroup}-${activeTurn?.questionIndex ?? 0}`;
          return;
        }

        if (nextRoundCount >= roundsPerGroup) {
          busyRef.current = false;
          await onCompleteTurn();
          return;
        }
        startRound(nextRoundCount);
      }, 2000);
      timersRef.current.push(revealTimer);
    },
    [
      activeTurn?.questionIndex,
      activeGroup,
      canGuess,
      clearRoundTimers,
      onCompleteTurn,
      onGuess,
      roundsPerGroup,
      scoreCorrect,
      scoreWrong,
      startRound
    ]
  );

  return (
    <main className="app-screen game-screen cup-screen">
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
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
        </section>
      ) : (
        <section className="cup-stage">
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
          <div className="cup-board" aria-label="Bardak oyunu">
            <span
              aria-hidden="true"
              className={`cup-board-icon ${revealIcon ? "visible" : ""}`}
              style={{ left: `${16.7 + targetSlot * 33.3}%` }}
            >
              <img
                alt=""
                src={hiddenIcon.imageUrl}
              />
            </span>
            {[0, 1, 2].map((cupId) => {
              const slot = slotByCup[cupId];
              const isTargetCup = targetCupId === cupId;
              const isPeekCup =
                (phase === "peek-up" || phase === "peek-down" || phase === "result") &&
                isTargetCup;
              const isPeekUp = (phase === "peek-up" || phase === "result") && isPeekCup;

              return (
                <button
                  aria-label={`Bardak ${cupId + 1}`}
                  className={`cup-item ${phase === "shuffle" ? "shuffle-moving" : "snap-position"} ${isPeekCup ? "peek-cup" : ""} ${isPeekUp ? "peek-up" : ""}`}
                  disabled={!canGuess}
                  key={`cup-${cupId}`}
                  onClick={() => {
                    void handleCupPick(cupId);
                  }}
                  style={{ left: `${16.7 + slot * 33.3}%` }}
                  type="button"
                >
                  <span className="cup-item-rim" />
                  <span className="cup-item-body" />
                </button>
              );
            })}
          </div>

          <div className="cup-meta">
            <div className="cup-round-chip">{playedRounds} / {roundsPerGroup}</div>
            <p className="cup-status">{statusText}</p>
          </div>
        </section>
      )}
    </main>
  );
}

function MatchingGame({
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
  const pairCount = Math.max(
    1,
    Math.min(
      MATCH_PAIR_COUNT,
      Number(activeGame?.pairCount) || MATCH_PAIR_COUNT
    )
  );
  const previewSeconds = Math.max(
    1,
    Number(activeGame?.previewSeconds) || MATCH_PREVIEW_SECONDS
  );
  const pointsPerPair = Number.isFinite(activeGame?.pointsPerCorrect)
    ? activeGame.pointsPerCorrect
    : MATCH_POINTS_PER_PAIR;
  const activeKey = `${activeGame?.id}-${activeGroup}`;
  const timersRef = useRef([]);
  const busyRef = useRef(false);
  const completedRef = useRef(false);
  const [cards, setCards] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [openCardIds, setOpenCardIds] = useState([]);
  const [matchedIconIds, setMatchedIconIds] = useState([]);
  const [statusText, setStatusText] = useState("");
  const [burst, setBurst] = useState(null);

  const clearMatchTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearMatchTimers();
    };
  }, [clearMatchTimers]);

  useEffect(() => {
    clearMatchTimers();
    busyRef.current = false;
    completedRef.current = false;
    setBurst(null);

    if (!isRunning) {
      setCards([]);
      setPhase("idle");
      setOpenCardIds([]);
      setMatchedIconIds([]);
      setStatusText("");
      return;
    }

    const nextCards = createMatchingCards(activeGroup, pairCount);
    setCards(nextCards);
    setPhase("preview");
    setOpenCardIds([]);
    setMatchedIconIds([]);
    setStatusText(`Kartları ezberle (${previewSeconds} sn)`);

    const previewTimer = window.setTimeout(() => {
      setPhase("play");
      setStatusText("Aynı iki kartı seç.");
    }, previewSeconds * 1000);
    timersRef.current.push(previewTimer);
  }, [
    activeGroup,
    activeKey,
    clearMatchTimers,
    isRunning,
    pairCount,
    previewSeconds
  ]);

  const matchedCount = matchedIconIds.length;
  const canPick = phase === "play" && isRunning && !busyRef.current;

  const handleCardPick = useCallback(
    async (card) => {
      if (
        !isRunning ||
        phase !== "play" ||
        busyRef.current ||
        openCardIds.includes(card.id) ||
        matchedIconIds.includes(card.iconId)
      ) {
        return;
      }

      if (openCardIds.length === 0) {
        setOpenCardIds([card.id]);
        setStatusText("İkinci kartı seç.");
        return;
      }

      if (openCardIds.length !== 1) {
        return;
      }

      const firstCard = cards.find((item) => item.id === openCardIds[0]);
      if (!firstCard) {
        setOpenCardIds([card.id]);
        return;
      }

      const nextOpenCardIds = [firstCard.id, card.id];
      const isMatch = firstCard.iconId === card.iconId;
      busyRef.current = true;
      setOpenCardIds(nextOpenCardIds);
      setPhase("checking");

      if (!isMatch) {
        playAnswerFeedbackSound(false);
        setStatusText("Eşleşmedi.");
        const closeTimer = window.setTimeout(() => {
          setOpenCardIds([]);
          setPhase("play");
          setStatusText(`${matchedIconIds.length}/${pairCount} çift bulundu.`);
          busyRef.current = false;
        }, 700);
        timersRef.current.push(closeTimer);
        return;
      }

      setStatusText(`${card.label} eşleşti (+${pointsPerPair})`);
      setBurst((previousBurst) => nextBurstState(previousBurst));
      await onAddScore(pointsPerPair);

      const matchTimer = window.setTimeout(() => {
        const nextMatchedIconIds = [...matchedIconIds, card.iconId];
        setMatchedIconIds(nextMatchedIconIds);
        setOpenCardIds([]);
        busyRef.current = false;

        if (nextMatchedIconIds.length >= pairCount && !completedRef.current) {
          completedRef.current = true;
          setPhase("complete");
          setStatusText("Tüm çiftler bulundu.");
          const finishTimer = window.setTimeout(() => {
            void onCompleteTurn();
          }, 650);
          timersRef.current.push(finishTimer);
          return;
        }

        setPhase("play");
        setStatusText(`${nextMatchedIconIds.length}/${pairCount} çift bulundu.`);
      }, 450);
      timersRef.current.push(matchTimer);
    },
    [
      cards,
      isRunning,
      matchedIconIds,
      onAddScore,
      onCompleteTurn,
      openCardIds,
      pairCount,
      phase,
      pointsPerPair
    ]
  );

  return (
    <main className="app-screen game-screen match-screen">
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
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
        </section>
      ) : (
        <section className="match-stage">
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
          <div className="match-meta">
            <div className="match-round-chip">{matchedCount} / {pairCount}</div>
            <p className="match-status">{statusText}</p>
          </div>
          <div className={`match-grid ${phase}`}>
            {cards.map((card, index) => {
              const isMatched = matchedIconIds.includes(card.iconId);
              const isOpen =
                phase === "preview" ||
                openCardIds.includes(card.id) ||
                isMatched;

              return (
                <button
                  aria-label={isOpen ? card.label : `Kapalı kart ${index + 1}`}
                  className={`match-card ${isOpen ? "open" : ""} ${isMatched ? "matched" : ""}`}
                  disabled={!canPick || isOpen}
                  key={`${card.id}-${index}`}
                  onClick={() => {
                    void handleCardPick(card);
                  }}
                  type="button"
                >
                  <span className="match-card-inner">
                    <span className="match-card-back">?</span>
                    <span className="match-card-front">
                      <span className="match-icon-pixel">
                        {card.iconUrl ? (
                          <img alt="" src={card.iconUrl} />
                        ) : (
                          <span>{card.label}</span>
                        )}
                      </span>
                      <span className="match-label">{card.label}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <CelebrationBurst burst={burst} />
        </section>
      )}
    </main>
  );
}

function JarGame({
  activeGame,
  activeGroup,
  activeTurn,
  groups,
  isRunning,
  onAnswer,
  onCatchPaper,
  onReset,
  onStartTurn,
  question,
  timeLeft
}) {
  const [burst, setBurst] = useState(null);
  const [papers, setPapers] = useState([]);
  // hookPos: kanca pozisyonu viewport'a göre (px). null = olta ucunda bekliyor.
  const [hookPos, setHookPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [caughtPaperId, setCaughtPaperId] = useState(null);
  const [answeredPaperIds, setAnsweredPaperIds] = useState(new Set());
  const [isJarShaking, setIsJarShaking] = useState(false);
  const bowlRef = useRef(null);
  const rodTipRef = useRef(null);
  const hookRef = useRef(null);
  const paperRefs = useRef({});
  const paperCount = Math.max(8, Number(activeGame?.paperCount) || 12);
  const activeQuestion = question && activeTurn?.currentQuestionId ? question : null;

  // Olta ucunun viewport pozisyonu (SVG çizgisi için)
  const getRodTipPos = useCallback(() => {
    if (!rodTipRef.current) return { x: window.innerWidth - 80, y: 120 };
    const r = rodTipRef.current.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  const createPaperLayout = useCallback(() => {
    return Array.from({ length: paperCount }, (_, index) => ({
      id: `paper-${index + 1}`,
      x: 30 + (index % 4) * 12 + Math.random() * 5,
      y: 66 + Math.floor(index / 4) * 8 + Math.random() * 4,
      rotate: -6 + Math.random() * 12,
      caught: false
    }));
  }, [paperCount]);

  useEffect(() => {
    if (isRunning) {
      setPapers(createPaperLayout());
      setHookPos(null);
      setIsDragging(false);
      setCaughtPaperId(null);
      setAnsweredPaperIds(new Set());
    }
  }, [createPaperLayout, isRunning, activeGroup]);

  useEffect(() => {
    if (!isJarShaking) return undefined;
    const timer = window.setTimeout(() => setIsJarShaking(false), 420);
    return () => window.clearTimeout(timer);
  }, [isJarShaking]);

  const randomizePapers = useCallback((event) => {
    if (caughtPaperId || isDragging) return;
    event.stopPropagation();
    setPapers((previous) =>
      previous.map((paper) => ({
        ...paper,
        x: Math.max(24, Math.min(78, paper.x + (-6 + Math.random() * 12))),
        y: Math.max(60, Math.min(86, paper.y + (-6 + Math.random() * 12))),
        rotate: -8 + Math.random() * 16
      }))
    );
    setIsJarShaking(true);
  }, [caughtPaperId, isDragging]);

  // Kanca sürükleme — window üzerinde dinle (capture kaybetme sorunu yok)
  const draggingRef = useRef(false);
  const caughtPaperIdRef = useRef(null);
  const activeQuestionRef = useRef(null);
  caughtPaperIdRef.current = caughtPaperId;
  activeQuestionRef.current = activeQuestion;

  const resetHook = useCallback(() => {
    draggingRef.current = false;
    caughtPaperIdRef.current = null;
    setIsDragging(false);
    setCaughtPaperId(null);
    setHookPos(null);
  }, []);

  const onHookPointerDown = useCallback((event) => {
    if (!isRunning || activeQuestionRef.current) return;
    // Eğer önceki turdan kanca takılı kaldıysa sıfırla
    if (caughtPaperIdRef.current) {
      resetHook();
      return;
    }
    event.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    setHookPos({ x: event.clientX, y: event.clientY });
  }, [isRunning, resetHook]);

  // Global pointermove/up — pencere düzeyinde dinleyerek kaçırma sorununu önle
  const lastHookPosRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return undefined;

    const onMove = (event) => {
      if (!draggingRef.current) return;
      const pos = { x: event.clientX, y: event.clientY };
      lastHookPosRef.current = pos;
      setHookPos(pos);

      // Kağıt yakalanmadıysa çarpışma kontrolü
      if (!caughtPaperIdRef.current && !activeQuestionRef.current) {
        for (const paper of Object.values(paperRefs.current)) {
          if (!paper) continue;
          const r = paper.getBoundingClientRect();
          if (
            pos.x >= r.left && pos.x <= r.right &&
            pos.y >= r.top && pos.y <= r.bottom
          ) {
            const pid = paper.dataset.paperid;
            if (!pid) continue;
            caughtPaperIdRef.current = pid;
            setCaughtPaperId(pid);
            setPapers((prev) => prev.map((p) => p.id === pid ? { ...p, caught: true } : p));
            break;
          }
        }
      }

      // Kağıt yakalandıysa fanus dışına çıkınca soruyu aç (bırakmayı bekleme)
      if (caughtPaperIdRef.current && !activeQuestionRef.current && bowlRef.current) {
        const bowlRect = bowlRef.current.getBoundingClientRect();
        const insideBowl =
          pos.x >= bowlRect.left && pos.x <= bowlRect.right &&
          pos.y >= bowlRect.top && pos.y <= bowlRect.bottom;
        if (!insideBowl) {
          draggingRef.current = false;
          setIsDragging(false);
          void onCatchPaper().then((opened) => {
            if (!opened) {
              const capturedId = caughtPaperIdRef.current;
              caughtPaperIdRef.current = null;
              setCaughtPaperId(null);
              setPapers((prev) => prev.map((p) => p.id === capturedId ? { ...p, caught: false } : p));
              setHookPos(null);
            }
          });
        }
      }
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);

      if (!caughtPaperIdRef.current) {
        // Kağıt yakalanmadı — kancayı sıfırla
        setHookPos(null);
        return;
      }

      if (activeQuestionRef.current) {
        return;
      }

      // Kağıt var — fanus içinde mi dışında mı bırakıldı?
      const lastPos = lastHookPosRef.current;
      if (!lastPos || !bowlRef.current) {
        // Pozisyon bilinmiyor — kağıdı geri bırak, kancayı sıfırla
        const capturedId = caughtPaperIdRef.current;
        caughtPaperIdRef.current = null;
        setCaughtPaperId(null);
        setPapers((p) => p.map((paper) => paper.id === capturedId ? { ...paper, caught: false } : paper));
        setHookPos(null);
        return;
      }
      const bowlRect = bowlRef.current.getBoundingClientRect();
      const insideBowl =
        lastPos.x >= bowlRect.left && lastPos.x <= bowlRect.right &&
        lastPos.y >= bowlRect.top && lastPos.y <= bowlRect.bottom;

      if (insideBowl) {
        // Fanus içinde bırakıldı — kağıdı geri bırak, kancayı sıfırla
        const capturedId = caughtPaperIdRef.current;
        caughtPaperIdRef.current = null;
        setCaughtPaperId(null);
        setPapers((p) => p.map((paper) => paper.id === capturedId ? { ...paper, caught: false } : paper));
        setHookPos(null);
      } else {
        // Fanus dışında bırakıldı — soruyu aç
        void onCatchPaper().then((opened) => {
          if (!opened) {
            const capturedId = caughtPaperIdRef.current;
            caughtPaperIdRef.current = null;
            setCaughtPaperId(null);
            setPapers((p) => p.map((paper) => paper.id === capturedId ? { ...paper, caught: false } : paper));
            setHookPos(null);
          }
        });
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isRunning, onCatchPaper]);

  const handleQuestionAnswer = useCallback(async (isCorrect) => {
    if (!activeQuestion) return;
    if (isCorrect) {
      setBurst((prev) => nextBurstState(prev));
    }
    const justAnsweredId = caughtPaperId;
    await onAnswer(isCorrect);
    // Cevaplanan kağıdı kalıcı olarak işaretle — bir daha açılmasın
    if (justAnsweredId) {
      setAnsweredPaperIds((prev) => new Set([...prev, justAnsweredId]));
      setPapers((prev) => prev.filter((p) => p.id !== justAnsweredId));
    }
    setCaughtPaperId(null);
    setHookPos(null);
  }, [activeQuestion, caughtPaperId, onAnswer]);

  const rodTip = getRodTipPos();
  const lineEnd = hookPos ?? rodTip;

  return (
    <main className="app-screen game-screen jar-screen">
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
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
        </section>
      ) : (
        <section className="jar-stage">
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />

          {/* SVG ip — olta ucundan kancaya */}
          <svg className="jar-line-svg" aria-hidden="true">
            <line
              x1={rodTip.x}
              y1={rodTip.y}
              x2={lineEnd.x}
              y2={lineEnd.y}
              stroke="#c8a870"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* Olta çubuğu — sağ üstte, eğik */}
          <div className="jar-rod-wrap" aria-hidden="true">
            <div className="jar-rod-stick" />
            <div className="jar-rod-grip" />
            {/* Olta ucunun referans noktası */}
            <span className="jar-rod-tip" ref={rodTipRef} />
          </div>

          {/* Kanca — sürüklenebilir, başlangıçta olta ucunda */}
          <div
            className={`jar-hook ${isDragging ? "dragging" : ""} ${caughtPaperId ? "has-catch" : ""}`}
            onPointerDown={onHookPointerDown}
            style={
              hookPos
                ? { position: "fixed", left: hookPos.x, top: hookPos.y, touchAction: "none" }
                : { position: "fixed", left: rodTip.x, top: rodTip.y, touchAction: "none" }
            }
          >
            <span className="jar-hook-curve" />
            {caughtPaperId && <div className="jar-caught-paper" />}
          </div>

          {/* Fanus — ortada */}
          <div className="jar-bowl-wrap">
            <div
              className={`jar-bowl ${isJarShaking ? "shaking" : ""}`}
              onPointerDown={randomizePapers}
              ref={bowlRef}
            >
              <div className="jar-bowl-inner">
                <div className="jar-bowl-shine" />
                <div className="jar-bowl-rim" />
                {papers.map((paper) => (
                  <div
                    className={`jar-paper ${paper.caught ? "caught" : ""}`}
                    data-paperid={paper.id}
                    key={paper.id}
                    ref={(node) => {
                      if (node) paperRefs.current[paper.id] = node;
                      else delete paperRefs.current[paper.id];
                    }}
                    style={{
                      left: `${paper.x}%`,
                      top: `${paper.y}%`,
                      transform: `translate(-50%, -50%) rotate(${paper.rotate}deg)`,
                      zIndex: Math.round(paper.y)
                    }}
                  />
                ))}
              </div>
              <div className="jar-counter">
                {activeTurn?.questionIndex ?? 0} / {paperCount}
              </div>
            </div>
          </div>

          {activeQuestion ? (
            <div className="jar-question-modal">
              <div className="jar-question-card">
                <h3>Kağıt Açıldı!</h3>
                <p className="jar-question-text">{activeQuestion.question}</p>
                <div className="jar-question-options">
                  {getAnswerChoices(activeQuestion).map((choice, index) => (
                    <button
                      className="pixel-button bridge-option-button"
                      key={`${choice.text}-${index}`}
                      onClick={() => {
                        void handleQuestionAnswer(choice.isCorrect);
                      }}
                      type="button"
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <CelebrationBurst burst={burst} />
        </section>
      )}
    </main>
  );
}

function WormGame({
  activeGame,
  activeGroup,
  customQuestions,
  groups,
  isRunning,
  onAddScore,
  onReset,
  onStartTurn,
  timeLeft
}) {
  const [burst, setBurst] = useState(null);
  const foodValueSignature = Array.isArray(activeGame?.foodValues)
    ? activeGame.foodValues.join("-")
    : "10-20-30";
  const foodValues = useMemo(() => {
    const values =
      Array.isArray(activeGame?.foodValues) && activeGame.foodValues.length > 0
        ? activeGame.foodValues
        : [10, 20, 30];

    return [...new Set(values)];
  }, [activeGame?.id, foodValueSignature]);
  const wormCustomSignature = JSON.stringify(customQuestions?.worm ?? {});
  const wormQuestions = useMemo(
    () => getQuestionsForGroup("worm", activeGroup, customQuestions),
    [activeGroup, wormCustomSignature]
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
  const askedQuestionIdsByValueRef = useRef({
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
    askedQuestionIdsByValueRef.current = {
      10: [],
      20: [],
      30: []
    };
    setPendingQuestion(null);
  }, [activeKey, foodValues, questionsByValue]);

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
          const fallbackQuestion = normalizeQuestion(
            getFallbackQuestions("worm", activeGroup)[0],
            0,
            activeGroup,
            "worm"
          );
          const askedForValue = askedQuestionIdsByValueRef.current[targetValue] ?? [];
          const picked = pickRandomQuestionWithoutRepeat(availablePool, askedForValue);
          const selectedQuestion = picked.question ?? fallbackQuestion;
          askedQuestionIdsByValueRef.current = {
            ...askedQuestionIdsByValueRef.current,
            [targetValue]: picked.askedQuestionIds
          };

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
        setBurst((previousBurst) => nextBurstState(previousBurst));
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
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
        </section>
      ) : (
        <section className="worm-stage">
          <div className="worm-stage-topbar">
            <IconActionButton
              actionType="reset"
              className="small-button reset-button worm-reset-button"
              onClick={onReset}
            />
          </div>
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
              <div className="worm-question-card">
                <h3>{pendingQuestion.prompt}</h3>
                <p className="worm-question-text">
                  {pendingQuestion.question?.question ?? "Soru bulunamadı."}
                </p>
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
            </div>
          ) : null}
          <CelebrationBurst burst={burst} />
        </section>
      )}
    </main>
  );
}

function PuzzleGame({
  activeGame,
  activeGroup,
  customPuzzles,
  groups,
  isRunning,
  onAddScore,
  onCompleteTurn,
  onReset,
  onStartTurn,
  timeLeft
}) {
  const [burst, setBurst] = useState(null);
  const cols = activeGame?.cols ?? PUZZLE_GRID.cols;
  const rows = activeGame?.rows ?? PUZZLE_GRID.rows;
  const pointsPerPiece = activeGame?.pointsPerCorrect ?? 10;
  const previewSeconds = activeGame?.previewSeconds ?? PUZZLE_PREVIEW_SECONDS;
  const scatterDuration = activeGame?.scatterMs ?? PUZZLE_SCATTER_MS;
  const pieces = useMemo(() => buildPuzzlePieces(cols, rows), [cols, rows]);
  const pieceCount = pieces.length;
  const trayColumns = useMemo(() => getPuzzleTrayColumns(pieceCount), [pieceCount]);
  const boardGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`
    }),
    [cols, rows]
  );
  const trayGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${trayColumns}, minmax(0, 1fr))`
    }),
    [trayColumns]
  );
  const pieceById = useMemo(
    () => new Map(pieces.map((piece) => [piece.id, piece])),
    [pieces]
  );
  const puzzlePoolSignature = Array.isArray(customPuzzles)
    ? customPuzzles
      .map((entry) => entry?.imageUrl)
      .filter((imageUrl) => typeof imageUrl === "string" && imageUrl.trim())
      .join("|")
    : "";
  const puzzleImagePool = useMemo(() => {
    const defaultPool = PUZZLE_IMAGE_POOLS[activeGroup] ?? PUZZLE_IMAGE_POOLS.A;
    const customPool = puzzlePoolSignature
      ? puzzlePoolSignature.split("|").filter(Boolean)
      : [];
    return [...defaultPool, ...customPool];
  }, [activeGroup, puzzlePoolSignature]);
  const activeKey = `${activeGame?.id}-${activeGroup}`;
  const workspaceRef = useRef(null);
  const boardRef = useRef(null);
  const trayRef = useRef(null);
  const dragStateRef = useRef(null);
  const placedBySlotRef = useRef(Array(pieceCount).fill(null));
  const completedRef = useRef(false);
  const [selectedImage, setSelectedImage] = useState(
    randomFromList(puzzleImagePool, puzzleA1)
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
    [cols, pieceById, rows, trayColumns]
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
      setBurst((previousBurst) => ({
        id: (previousBurst?.id ?? 0) + 1,
        x: `${((slotCol + 0.5) / cols) * 100}%`,
        y: `${((slotRow + 0.5) / rows) * 100}%`
      }));
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
      puzzleImagePool,
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
    puzzleImagePool,
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
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
        </section>
      ) : (
        <section className="puzzle-stage">
          <IconActionButton actionType="reset" className="small-button reset-button" onClick={onReset} />
          <div className="puzzle-workspace" ref={workspaceRef}>
            <div className="puzzle-board" ref={boardRef} style={boardGridStyle}>
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
            <div
              className={`puzzle-tray ${phase === "play" ? "active" : ""}`}
              ref={trayRef}
              style={trayGridStyle}
            >
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
          <CelebrationBurst burst={burst} />
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
