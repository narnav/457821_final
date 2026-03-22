export type ExerciseType =
  | "CONCEPT_CARD"
  | "MULTIPLE_CHOICE"
  | "FIND_THE_BUG"
  | "DRAG_DROP"
  | "CODE_FILL"
  | "TAP_TOKEN";

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  codeSnippet: string;
  explanation: string;
  options?: string[];
  correctAnswer: string;
  xpReward: number;
}

export interface Lesson {
  id: string;
  title: string;
  chapterId: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

export interface Chapter {
  id: string;
  path: "BEGINNER" | "ADVANCED";
  title: string;
  description: string;
  orderIndex: number;
}

export const chapters: Chapter[] = [
  {
    id: "b1",
    path: "BEGINNER",
    title: "Your First Code",
    description: "console.log, comments, and developer mindset",
    orderIndex: 1,
  },
  {
    id: "b2",
    path: "BEGINNER",
    title: "Variables & Data",
    description: "let/const, primitives, template literals",
    orderIndex: 2,
  },
  {
    id: "b3",
    path: "BEGINNER",
    title: "Operators & Logic",
    description: "truthy/falsy and comparisons",
    orderIndex: 3,
  },
  {
    id: "a1",
    path: "ADVANCED",
    title: "ES6+ Deep Dive",
    description: "destructuring, rest/spread, optional chaining",
    orderIndex: 1,
  },
];

export const lessons: Lesson[] = [
  {
    id: "b1-l1",
    chapterId: "b1",
    title: "Hello JavaScript",
    estimatedMinutes: 8,
    exercises: [
      {
        id: "e-1",
        type: "CONCEPT_CARD",
        prompt: "The console is your first debugging superpower.",
        codeSnippet: "console.log('Level up!');",
        explanation:
          "Use console.log to inspect values while you build. It is the quickest way to see what your program is doing.",
        correctAnswer: "GOT_IT",
        xpReward: 10,
      },
      {
        id: "e-2",
        type: "MULTIPLE_CHOICE",
        prompt: "What does this code output?",
        codeSnippet: "const language = 'JavaScript';\nconsole.log(language);",
        options: ["JavaScript", "undefined", "null", "language"],
        explanation: "console.log prints the value currently stored in language.",
        correctAnswer: "JavaScript",
        xpReward: 20,
      },
      {
        id: "e-3",
        type: "FIND_THE_BUG",
        prompt: "Tap the line containing the bug.",
        codeSnippet:
          "const score = 10;\nif (score = 10) {\n  console.log('Perfect!');\n}",
        explanation:
          "Use === for comparison. = assigns a value and changes score unexpectedly.",
        correctAnswer: "2",
        xpReward: 25,
      },
      {
        id: "e-4",
        type: "DRAG_DROP",
        prompt: "Order these lines to build a working function.",
        codeSnippet:
          "return name;\nfunction greet(name) {\nconsole.log(greet('Ada'));\n}",
        explanation: "Functions need a declaration block before return executes.",
        correctAnswer:
          "function greet(name) {||return name;||}||console.log(greet('Ada'));",
        xpReward: 25,
      },
      {
        id: "e-5",
        type: "CODE_FILL",
        prompt: "Fill the blank.",
        codeSnippet: "const points = 42;\nconsole.log(___);",
        explanation: "Use the variable name to log its value.",
        correctAnswer: "points",
        xpReward: 20,
      },
      {
        id: "e-6",
        type: "TAP_TOKEN",
        prompt: "Tap the callback function.",
        codeSnippet: "[1,2,3].map((n) => n * 2);",
        explanation: "(n) => n * 2 is the callback passed to map.",
        correctAnswer: "(n) => n * 2",
        xpReward: 20,
      },
    ],
  },
];

export interface DuelQuestion {
  id: string;
  prompt: string;
  codeSnippet: string;
  options: string[];
  correctAnswer: string;
  category: "OUTPUT" | "SCOPE" | "ASYNC" | "TYPES" | "METHODS";
}

export const duelQuestionBank: DuelQuestion[] = [
  {
    id: "dq-1",
    prompt: "What is the output?",
    codeSnippet: "console.log(typeof null);",
    options: ["object", "null", "undefined", "number"],
    correctAnswer: "object",
    category: "TYPES",
  },
  {
    id: "dq-2",
    prompt: "What logs first?",
    codeSnippet: "setTimeout(() => console.log('B'), 0);\nconsole.log('A');",
    options: ["A", "B", "Both together", "Nothing"],
    correctAnswer: "A",
    category: "ASYNC",
  },
];
