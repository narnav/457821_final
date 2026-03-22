import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedExercise {
  type: "CONCEPT_CARD" | "MULTIPLE_CHOICE" | "FIND_THE_BUG" | "DRAG_DROP" | "CODE_FILL" | "TAP_TOKEN";
  prompt: string;
  codeSnippet: string;
  correctAnswer: string;
  explanation: string;
  xpReward: number;
  options?: string[];
}

async function createLessonWithExercises(params: {
  chapterId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  orderIndex: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  exercises: SeedExercise[];
}) {
  const lesson = await prisma.lesson.create({
    data: {
      chapterId: params.chapterId,
      title: params.title,
      description: params.description,
      estimatedMinutes: params.estimatedMinutes,
      orderIndex: params.orderIndex,
      difficulty: params.difficulty,
    },
  });

  for (let i = 0; i < params.exercises.length; i += 1) {
    const exercise = params.exercises[i];
    const created = await prisma.exercise.create({
      data: {
        lessonId: lesson.id,
        type: exercise.type,
        prompt: exercise.prompt,
        codeSnippet: exercise.codeSnippet,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
        orderIndex: i + 1,
        xpReward: exercise.xpReward,
      },
    });

    if (exercise.options && exercise.options.length > 0) {
      await prisma.exerciseOption.createMany({
        data: exercise.options.map((option) => ({
          exerciseId: created.id,
          text: option,
          isCorrect: option === exercise.correctAnswer,
        })),
      });
    }
  }
}

async function main() {
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.userExerciseHistory.deleteMany();
  await prisma.exerciseOption.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.duelQuestion.deleteMany();

  const beginnerPath = await prisma.learningPath.create({
    data: {
      key: "BEGINNER",
      title: "JavaScript Foundations",
      description: "Start from zero and become confident with core JS concepts.",
    },
  });
  const advancedPath = await prisma.learningPath.create({
    data: {
      key: "ADVANCED",
      title: "Professional JavaScript",
      description: "Deep, practical ES6+ and backend architecture skills.",
    },
  });

  const chapters = await prisma.chapter.createManyAndReturn({
    data: [
      { pathId: beginnerPath.id, title: "What JavaScript Is", description: "console basics and browser runtime", orderIndex: 1 },
      { pathId: beginnerPath.id, title: "Variables and Values", description: "let, const, assignment, and reading values", orderIndex: 2 },
      { pathId: beginnerPath.id, title: "Data Types", description: "string, number, boolean, null, undefined", orderIndex: 3 },
      { pathId: beginnerPath.id, title: "Operators and Comparisons", description: "arithmetic and boolean logic", orderIndex: 4 },
      { pathId: beginnerPath.id, title: "Conditionals", description: "if/else and ternary branching", orderIndex: 5 },
      { pathId: beginnerPath.id, title: "Loops", description: "for, while, and break", orderIndex: 6 },
      { pathId: beginnerPath.id, title: "Functions", description: "declare, call, and return", orderIndex: 7 },
      { pathId: beginnerPath.id, title: "Arrays", description: "indexing and length fundamentals", orderIndex: 8 },
      { pathId: advancedPath.id, title: "Array Methods", description: "map/filter/reduce/find/some/every", orderIndex: 1 },
      { pathId: advancedPath.id, title: "Closures and Scope", description: "lexical scope and closure behavior", orderIndex: 2 },
      { pathId: advancedPath.id, title: "this Binding", description: "method invocation and arrow function behavior", orderIndex: 3 },
      { pathId: advancedPath.id, title: "Async JavaScript", description: "event loop, promises, async/await", orderIndex: 4 },
      { pathId: advancedPath.id, title: "Destructuring and Spread", description: "modern object and array syntax", orderIndex: 5 },
      { pathId: advancedPath.id, title: "ES6 Classes", description: "constructors, inheritance, and super", orderIndex: 6 },
      { pathId: advancedPath.id, title: "Node and Express Patterns", description: "routes, middleware, and response APIs", orderIndex: 7 },
      { pathId: advancedPath.id, title: "Error Handling and Edge Cases", description: "exceptions and runtime safety", orderIndex: 8 },
    ],
  });

  const chapterByTitle = new Map(chapters.map((chapter) => [chapter.title, chapter.id]));

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("What JavaScript Is")!,
    title: "JavaScript in the Browser",
    description: "Understand JS runtime and console basics",
    estimatedMinutes: 8,
    orderIndex: 1,
    difficulty: "BEGINNER",
    exercises: [
      {
        type: "CONCEPT_CARD",
        prompt: "JavaScript adds behavior to web pages.",
        codeSnippet: "console.log('Button clicked!');",
        correctAnswer: "GOT_IT",
        explanation: "JS reacts to user actions and changes what users see.",
        xpReward: 10,
      },
      {
        type: "CONCEPT_CARD",
        prompt: "Use the browser console to inspect values quickly.",
        codeSnippet: "const score = 42;\nconsole.log(score);",
        correctAnswer: "GOT_IT",
        explanation: "The console is your first debugging tool.",
        xpReward: 10,
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Variables and Values")!,
    title: "Storing and Reusing Values",
    description: "Work with let/const and variable reassignment",
    estimatedMinutes: 12,
    orderIndex: 1,
    difficulty: "BEGINNER",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does this output?",
        codeSnippet: "let name = 'Maya';\nconsole.log(name);",
        correctAnswer: "Maya",
        explanation: "The variable name stores the string 'Maya'.",
        xpReward: 20,
        options: ["Maya", "name", "undefined", "null"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Which declaration should be used for values that should not be reassigned?",
        codeSnippet: "// choose one keyword",
        correctAnswer: "const",
        explanation: "Use const when the variable binding should stay fixed.",
        xpReward: 20,
        options: ["let", "const", "var", "value"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What happens here?",
        codeSnippet: "const points = 10;\npoints = 12;",
        correctAnswer: "It throws an error",
        explanation: "A const binding cannot be reassigned.",
        xpReward: 20,
        options: ["It updates to 12", "It throws an error", "It becomes undefined", "It prints 10"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is logged?",
        codeSnippet: "let city = 'Paris';\ncity = 'Rome';\nconsole.log(city);",
        correctAnswer: "Rome",
        explanation: "let allows reassignment, so the latest value is logged.",
        xpReward: 20,
        options: ["Paris", "Rome", "undefined", "city"],
      },
      {
        type: "CODE_FILL",
        prompt: "Fill the blank with the correct variable name.",
        codeSnippet: "let user = 'Ana';\nconsole.log(___);",
        correctAnswer: "user",
        explanation: "You print a variable by writing its identifier.",
        xpReward: 20,
        options: ["user", "const", "let", "username"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Data Types")!,
    title: "Primitive Types and typeof",
    description: "Recognize JS primitive values and type checks",
    estimatedMinutes: 10,
    orderIndex: 1,
    difficulty: "BEGINNER",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does this output?",
        codeSnippet: "console.log(typeof '5');",
        correctAnswer: "string",
        explanation: "Quotes make 5 a string value.",
        xpReward: 20,
        options: ["number", "string", "boolean", "undefined"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is the result?",
        codeSnippet: "console.log(typeof 5);",
        correctAnswer: "number",
        explanation: "Without quotes, 5 is a number.",
        xpReward: 20,
        options: ["string", "number", "boolean", "object"],
      },
      {
        type: "TAP_TOKEN",
        prompt: "Tap the value that is falsy.",
        codeSnippet: "const candidates = [0, 'hello', 9, true];",
        correctAnswer: "0",
        explanation: "0 is one of JavaScript's falsy values.",
        xpReward: 20,
        options: ["0", "'hello'", "9", "true"],
      },
      {
        type: "TAP_TOKEN",
        prompt: "Tap the value whose typeof is 'undefined'.",
        codeSnippet: "const value = undefined;\nconsole.log(typeof value);",
        correctAnswer: "undefined",
        explanation: "The literal undefined has typeof 'undefined'.",
        xpReward: 20,
        options: ["null", "undefined", "false", "0"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Operators and Comparisons")!,
    title: "Operators You Use Every Day",
    description: "Arithmetic and boolean expression evaluation",
    estimatedMinutes: 10,
    orderIndex: 1,
    difficulty: "BEGINNER",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is logged?",
        codeSnippet: "console.log(6 / 2 + 1);",
        correctAnswer: "4",
        explanation: "6 / 2 is 3, then +1 gives 4.",
        xpReward: 20,
        options: ["3", "4", "7", "12"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does strict equality return?",
        codeSnippet: "console.log(5 === '5');",
        correctAnswer: "false",
        explanation: "=== checks both value and type.",
        xpReward: 20,
        options: ["true", "false", "5", "'5'"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is the result?",
        codeSnippet: "console.log(!true);",
        correctAnswer: "false",
        explanation: "! flips a boolean value.",
        xpReward: 20,
        options: ["true", "false", "undefined", "0"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is logged?",
        codeSnippet: "console.log(true && false || true);",
        correctAnswer: "true",
        explanation: "true && false is false, then false || true is true.",
        xpReward: 20,
        options: ["false", "true", "undefined", "null"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Conditionals")!,
    title: "Branching Logic",
    description: "if/else and ternary operator behavior",
    estimatedMinutes: 10,
    orderIndex: 1,
    difficulty: "BEGINNER",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is printed?",
        codeSnippet: "const isMember = true;\nif (isMember) { console.log('Access'); } else { console.log('Denied'); }",
        correctAnswer: "Access",
        explanation: "The if branch runs when condition is true.",
        xpReward: 20,
        options: ["Denied", "Access", "Both", "Nothing"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does this output?",
        codeSnippet: "const age = 15;\nif (age >= 18) { console.log('Adult'); } else { console.log('Minor'); }",
        correctAnswer: "Minor",
        explanation: "15 is not greater than or equal to 18.",
        xpReward: 20,
        options: ["Adult", "Minor", "undefined", "false"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What value is assigned?",
        codeSnippet: "const online = false;\nconst status = online ? 'On' : 'Off';\nconsole.log(status);",
        correctAnswer: "Off",
        explanation: "Ternary chooses the second value when condition is false.",
        xpReward: 20,
        options: ["On", "Off", "false", "status"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is logged?",
        codeSnippet: "let points = 0;\nif (points === 0) { points = 10; }\nconsole.log(points);",
        correctAnswer: "10",
        explanation: "Condition is true, so points is updated to 10.",
        xpReward: 20,
        options: ["0", "10", "undefined", "NaN"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Loops")!,
    title: "Loop Fundamentals",
    description: "Understand iteration counts and break behavior",
    estimatedMinutes: 12,
    orderIndex: 1,
    difficulty: "BEGINNER",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "How many times does this loop run?",
        codeSnippet: "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
        correctAnswer: "5",
        explanation: "It runs for i = 1,2,3,4,5.",
        xpReward: 20,
        options: ["4", "5", "6", "1"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is i in the final iteration?",
        codeSnippet: "for (let i = 1; i <= 5; i++) {\n  // ...\n}",
        correctAnswer: "5",
        explanation: "The last value satisfying i <= 5 is 5.",
        xpReward: 20,
        options: ["4", "5", "6", "0"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is printed?",
        codeSnippet: "let n = 1;\nwhile (n < 4) {\n  console.log(n);\n  n++;\n}",
        correctAnswer: "1, 2, 3",
        explanation: "The loop prints each value before incrementing until n becomes 4.",
        xpReward: 20,
        options: ["1, 2, 3", "1, 2, 3, 4", "2, 3, 4", "1"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does break do here?",
        codeSnippet: "for (let i = 0; i < 5; i++) {\n  if (i === 2) break;\n}\nconsole.log('done');",
        correctAnswer: "Stops the loop when i is 2",
        explanation: "break exits the loop immediately.",
        xpReward: 20,
        options: ["Skips only i=2", "Stops the loop when i is 2", "Restarts the loop", "Throws an error"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "How many values are logged?",
        codeSnippet: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
        correctAnswer: "3",
        explanation: "Values 0, 1, and 2 are logged.",
        xpReward: 20,
        options: ["2", "3", "4", "1"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Functions")!,
    title: "Functions and Return Values",
    description: "Declare, call, and reason about returned data",
    estimatedMinutes: 12,
    orderIndex: 1,
    difficulty: "BEGINNER",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What gets logged?",
        codeSnippet: "function greet() { return 'Hi'; }\nconsole.log(greet());",
        correctAnswer: "Hi",
        explanation: "greet returns 'Hi', and console.log prints it.",
        xpReward: 20,
        options: ["greet", "Hi", "undefined", "function"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is the difference here?",
        codeSnippet: "function say(){ console.log('Hi'); }\nfunction get(){ return 'Hi'; }",
        correctAnswer: "say logs directly, get returns a value",
        explanation: "console.log outputs immediately; return passes a value to the caller.",
        xpReward: 20,
        options: [
          "Both return strings",
          "say logs directly, get returns a value",
          "Both throw errors",
          "get logs directly, say returns value",
        ],
      },
      {
        type: "DRAG_DROP",
        prompt: "Arrange the lines to build a valid function that returns a full name.",
        codeSnippet: "function fullName(first, last) {\nreturn `${first} ${last}`;\n}\nconsole.log(fullName('Ada', 'Lovelace'));",
        correctAnswer: "function fullName(first, last) {||return `${first} ${last}`;||}||console.log(fullName('Ada', 'Lovelace'));",
        explanation: "The function declaration must wrap the return statement before calling it.",
        xpReward: 25,
      },
      {
        type: "CODE_FILL",
        prompt: "Fill the blank with the keyword that sends a value back.",
        codeSnippet: "function add(a, b) {\n  /* blank */\n  a + b;\n}",
        correctAnswer: "return",
        explanation: "return sends a value back to whoever called the function.",
        xpReward: 20,
        options: ["return", "console.log", "let", "const"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Arrays")!,
    title: "Array Basics",
    description: "Indexing and length with simple arrays",
    estimatedMinutes: 8,
    orderIndex: 1,
    difficulty: "BEGINNER",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is logged?",
        codeSnippet: "const colors = ['red', 'blue', 'green'];\nconsole.log(colors[1]);",
        correctAnswer: "blue",
        explanation: "Array indexes start at 0, so index 1 is 'blue'.",
        xpReward: 20,
        options: ["red", "blue", "green", "undefined"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does this output?",
        codeSnippet: "const nums = [4, 9, 16];\nconsole.log(nums.length);",
        correctAnswer: "3",
        explanation: ".length returns the number of elements in the array.",
        xpReward: 20,
        options: ["2", "3", "4", "16"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Array Methods")!,
    title: "Mapping, Filtering, and Reduction",
    description: "Core array method behavior and edge cases",
    estimatedMinutes: 14,
    orderIndex: 1,
    difficulty: "ADVANCED",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is the result?",
        codeSnippet: "const out = [1,2,3].map(n => n * 2);\nconsole.log(out);",
        correctAnswer: "[2, 4, 6]",
        explanation: "map returns a new array with transformed values.",
        xpReward: 25,
        options: ["[1, 2, 3]", "[2, 4, 6]", "6", "undefined"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does filter return when no element matches?",
        codeSnippet: "const out = [1,2,3].filter(n => n > 10);\nconsole.log(out);",
        correctAnswer: "[]",
        explanation: "filter always returns an array, empty when no match exists.",
        xpReward: 25,
        options: ["null", "undefined", "[]", "[0]"],
      },
      {
        type: "TAP_TOKEN",
        prompt: "Which token correctly completes this expression?",
        codeSnippet: "const ids = users.___(u => u.active);",
        correctAnswer: "filter",
        explanation: "filter keeps only elements where predicate returns true.",
        xpReward: 25,
        options: ["map", "filter", "reduce", "forEach"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does find return if no item matches?",
        codeSnippet: "const user = [{id:1}].find(u => u.id === 2);\nconsole.log(user);",
        correctAnswer: "undefined",
        explanation: "find returns undefined when it cannot find a match.",
        xpReward: 25,
        options: ["null", "[]", "undefined", "{}"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does this output?",
        codeSnippet: "const result = [1,2,3].every(n => n > 0);\nconsole.log(result);",
        correctAnswer: "true",
        explanation: "every returns true only when all items satisfy the predicate.",
        xpReward: 25,
        options: ["true", "false", "3", "undefined"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Closures and Scope")!,
    title: "Scope and Closure Behavior",
    description: "Track lexical environment and captured values",
    estimatedMinutes: 12,
    orderIndex: 1,
    difficulty: "ADVANCED",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is logged?",
        codeSnippet: "function makeCounter(){ let c = 0; return () => ++c; }\nconst count = makeCounter();\nconsole.log(count(), count());",
        correctAnswer: "1 2",
        explanation: "The inner function closes over c and preserves state between calls.",
        xpReward: 25,
        options: ["1 1", "1 2", "2 2", "0 1"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What prints in this loop?",
        codeSnippet: "for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }",
        correctAnswer: "3 3 3",
        explanation: "var is function-scoped, so callbacks see final value after loop.",
        xpReward: 25,
        options: ["0 1 2", "3 3 3", "2 2 2", "throws error"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What prints with let in the same pattern?",
        codeSnippet: "for (let i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }",
        correctAnswer: "0 1 2",
        explanation: "let creates a new binding each iteration.",
        xpReward: 25,
        options: ["3 3 3", "0 1 2", "1 2 3", "undefined"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Which variable is visible here?",
        codeSnippet: "{ const secret = 42; }\nconsole.log(typeof secret);",
        correctAnswer: "undefined",
        explanation: "secret is block-scoped and unavailable outside the block.",
        xpReward: 25,
        options: ["42", "undefined", "number", "secret"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("this Binding")!,
    title: "Understanding this in Context",
    description: "Compare method, standalone, and arrow contexts",
    estimatedMinutes: 10,
    orderIndex: 1,
    difficulty: "ADVANCED",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does this method call return?",
        codeSnippet: "const obj = { x: 5, getX(){ return this.x; } };\nconsole.log(obj.getX());",
        correctAnswer: "5",
        explanation: "When called as obj.getX(), this points to obj.",
        xpReward: 25,
        options: ["undefined", "5", "obj", "NaN"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What happens here?",
        codeSnippet: "const obj = { x: 5, getX(){ return this.x; } };\nconst fn = obj.getX;\nconsole.log(fn());",
        correctAnswer: "undefined",
        explanation: "Detached function call loses the object receiver in strict mode patterns.",
        xpReward: 25,
        options: ["5", "undefined", "obj", "throws syntax error"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does an arrow function keep from outer scope?",
        codeSnippet: "const obj = { x: 9, run(){ const f = () => this.x; return f(); } };\nconsole.log(obj.run());",
        correctAnswer: "9",
        explanation: "Arrow functions capture surrounding this from run().",
        xpReward: 25,
        options: ["undefined", "9", "0", "NaN"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Async JavaScript")!,
    title: "Execution Order and Awaiting Promises",
    description: "Reason about event loop and async return values",
    estimatedMinutes: 14,
    orderIndex: 1,
    difficulty: "ADVANCED",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What order is logged?",
        codeSnippet: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));",
        correctAnswer: "A, C, B",
        explanation: "Sync logs first, then microtasks, then macrotasks.",
        xpReward: 25,
        options: ["A, B, C", "A, C, B", "C, A, B", "B, C, A"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does an async function return?",
        codeSnippet: "async function run(){ return 5; }\nconsole.log(run());",
        correctAnswer: "A Promise",
        explanation: "async wraps return values in a Promise.",
        xpReward: 25,
        options: ["5", "undefined", "A Promise", "An object literal"],
      },
      {
        type: "FIND_THE_BUG",
        prompt: "Tap the line with the async bug.",
        codeSnippet: "async function fetchName(){\n  const res = fetch('/user');\n  return (await res).json();\n}",
        correctAnswer: "2",
        explanation: "fetch returns a Promise and should be awaited before using response.",
        xpReward: 25,
        options: ["1", "2", "3", "4"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is printed?",
        codeSnippet: "async function x(){ try { throw new Error('x'); } catch { return 'handled'; } }\nx().then(console.log);",
        correctAnswer: "handled",
        explanation: "The catch block handles the thrown error and returns a value.",
        xpReward: 25,
        options: ["x", "handled", "undefined", "unhandled rejection"],
      },
      {
        type: "TAP_TOKEN",
        prompt: "Choose the missing keyword.",
        codeSnippet: "const user = /* blank */ getUser();",
        correctAnswer: "await",
        explanation: "Use await inside an async function to resolve a Promise result.",
        xpReward: 25,
        options: ["await", "return", "yield", "new"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Destructuring and Spread")!,
    title: "Modern Object and Array Patterns",
    description: "Use concise extraction and merge syntax",
    estimatedMinutes: 10,
    orderIndex: 1,
    difficulty: "ADVANCED",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What value does b get?",
        codeSnippet: "const [a, b = 10] = [3];\nconsole.log(b);",
        correctAnswer: "10",
        explanation: "Default values apply when element is missing.",
        xpReward: 25,
        options: ["3", "10", "undefined", "0"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does this log?",
        codeSnippet: "const { id: userId } = { id: 7 };\nconsole.log(userId);",
        correctAnswer: "7",
        explanation: "id is renamed to userId during destructuring.",
        xpReward: 25,
        options: ["id", "7", "undefined", "userId"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is merged array?",
        codeSnippet: "const out = [...[1,2], ...[3,4]];\nconsole.log(out);",
        correctAnswer: "[1, 2, 3, 4]",
        explanation: "Spread expands each array into a new combined array.",
        xpReward: 25,
        options: ["[1,2]", "[3,4]", "[1, 2, 3, 4]", "[[1,2],[3,4]]"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("ES6 Classes")!,
    title: "Classes and Inheritance",
    description: "Constructors, instances, and extending behavior",
    estimatedMinutes: 10,
    orderIndex: 1,
    difficulty: "ADVANCED",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is logged?",
        codeSnippet: "class User { constructor(name){ this.name = name; } }\nconst u = new User('Sam');\nconsole.log(u.name);",
        correctAnswer: "Sam",
        explanation: "Constructor assigns the name property on instance creation.",
        xpReward: 25,
        options: ["User", "Sam", "undefined", "name"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does extends do?",
        codeSnippet: "class Admin extends User {}",
        correctAnswer: "Creates a subclass that inherits User behavior",
        explanation: "extends links prototype inheritance between classes.",
        xpReward: 25,
        options: [
          "Creates a subclass that inherits User behavior",
          "Copies User values once only",
          "Runs User constructor automatically without super",
          "Disables methods",
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does this print?",
        codeSnippet: "class A { hi(){ return 'A'; } }\nclass B extends A { hi(){ return super.hi() + 'B'; } }\nconsole.log(new B().hi());",
        correctAnswer: "AB",
        explanation: "super.hi() calls the parent method, then appends B.",
        xpReward: 25,
        options: ["A", "B", "AB", "BA"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Node and Express Patterns")!,
    title: "Backend Request Flow",
    description: "Understand req/res and middleware order",
    estimatedMinutes: 12,
    orderIndex: 1,
    difficulty: "ADVANCED",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "In an Express route, what is req?",
        codeSnippet: "app.get('/users', (req, res) => {\n  res.json([]);\n});",
        correctAnswer: "The incoming request object",
        explanation: "req contains params, query, body, headers, and more.",
        xpReward: 25,
        options: ["The outgoing response", "The incoming request object", "The database connection", "A middleware array"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does res.json() do?",
        codeSnippet: "res.json({ ok: true });",
        correctAnswer: "Sends a JSON response body",
        explanation: "res.json serializes and sends JSON to the client.",
        xpReward: 25,
        options: ["Parses JSON from req", "Sends a JSON response body", "Writes file to disk", "Ends app process"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "When does middleware run?",
        codeSnippet: "app.use(auth);\napp.get('/secure', handler);",
        correctAnswer: "Before the matching route handler",
        explanation: "Middleware in the chain runs before the route handler unless it ends response.",
        xpReward: 25,
        options: ["After handler only", "Before the matching route handler", "Only on POST", "Only on errors"],
      },
      {
        type: "TAP_TOKEN",
        prompt: "Pick the token for CommonJS import.",
        codeSnippet: "const express = ___('express');",
        correctAnswer: "require",
        explanation: "CommonJS modules use require(...).",
        xpReward: 25,
        options: ["require", "import", "export", "include"],
      },
    ],
  });

  await createLessonWithExercises({
    chapterId: chapterByTitle.get("Error Handling and Edge Cases")!,
    title: "Handling Failure Correctly",
    description: "Catch runtime exceptions and avoid null access crashes",
    estimatedMinutes: 10,
    orderIndex: 1,
    difficulty: "ADVANCED",
    exercises: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does try/catch catch?",
        codeSnippet: "try { JSON.parse('{bad'); } catch (e) { console.log('caught'); }",
        correctAnswer: "Runtime exceptions thrown inside try",
        explanation: "catch handles exceptions thrown during runtime execution.",
        xpReward: 25,
        options: ["All syntax errors at compile time", "Runtime exceptions thrown inside try", "Network latency", "Type declarations"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What happens here?",
        codeSnippet: "const x = null;\nconsole.log(x.name);",
        correctAnswer: "Throws a TypeError",
        explanation: "You cannot access properties on null.",
        xpReward: 25,
        options: ["undefined", "null", "Throws a TypeError", "''"],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What does JSON.parse do with invalid JSON?",
        codeSnippet: "JSON.parse('{ name: \"Ada\" }');",
        correctAnswer: "Throws an exception",
        explanation: "Invalid JSON syntax causes JSON.parse to throw.",
        xpReward: 25,
        options: ["Returns null", "Fixes and parses it", "Throws an exception", "Returns empty object"],
      },
    ],
  });

  const beginnerOutputQuestions = Array.from({ length: 20 }).map((_, index) => ({
    questionText: `Beginner Output ${index + 1}: What is the output?`,
    codeSnippet:
      index % 5 === 0
        ? "const x = 2;\nconsole.log(x + 3);"
        : index % 5 === 1
          ? "let name = 'JS';\nconsole.log(name.toLowerCase());"
          : index % 5 === 2
            ? "const arr = [1,2,3];\nconsole.log(arr.length);"
            : index % 5 === 3
              ? "console.log(Boolean(''));"
              : "const a = '5';\nconsole.log(Number(a) + 1);",
    correctAnswer:
      index % 5 === 0
        ? "5"
        : index % 5 === 1
          ? "js"
          : index % 5 === 2
            ? "3"
            : index % 5 === 3
              ? "false"
              : "6",
    options:
      index % 5 === 0
        ? ["4", "5", "23", "undefined"]
        : index % 5 === 1
          ? ["JS", "js", "undefined", "TypeError"]
          : index % 5 === 2
            ? ["2", "3", "4", "undefined"]
            : index % 5 === 3
              ? ["true", "false", "''", "0"]
              : ["51", "6", "NaN", "undefined"],
    explanation: "Read the operator behavior and method result directly from the snippet.",
    type: "MULTIPLE_CHOICE",
    difficulty: "BEGINNER",
    category: "OUTPUT",
    timesUsed: 0,
    correctRate: 1,
  }));

  const beginnerBugQuestions = Array.from({ length: 12 }).map((_, index) => ({
    questionText: `Beginner Bug ${index + 1}: Which line contains the bug?`,
    codeSnippet:
      index % 4 === 0
        ? "const total = 0;\nfor (let i = 0; i <= 3; i++) {\n  total += i;\n}"
        : index % 4 === 1
          ? "const score = 10;\nif (score = 10) {\n  console.log('Perfect');\n}"
          : index % 4 === 2
            ? "const user = { name: 'Ada' };\nconsole.log(user.age.toUpperCase());\nconsole.log('done');\nconst safe = true;"
            : "const values = [1,2,3];\nconsole.log(values.length());\nconsole.log(values);\nconst done = true;",
    correctAnswer: index % 4 === 0 ? "1" : index % 4 === 1 ? "2" : index % 4 === 2 ? "2" : "2",
    options: ["1", "2", "3", "4"],
    explanation: "Spot the line that introduces invalid logic or runtime behavior.",
    type: "FIND_THE_BUG",
    difficulty: "BEGINNER",
    category: "METHODS",
    timesUsed: 0,
    correctRate: 1,
  }));

  const beginnerTokenQuestions = Array.from({ length: 8 }).map((_, index) => ({
    questionText: `Beginner Token ${index + 1}: Pick the correct token.`,
    codeSnippet:
      index % 4 === 0
        ? "const nums = [1,2,3];\nconst result = nums.___(n => n * 2);"
        : index % 4 === 1
          ? "const name = 'codequest';\nconsole.log(name.___());"
          : index % 4 === 2
            ? "const flag = true;\nif (flag ___ false) {\n  console.log('ok');\n}"
            : "const x = 4;\nconsole.log(___ x);",
    correctAnswer: index % 4 === 0 ? "map" : index % 4 === 1 ? "toUpperCase" : index % 4 === 2 ? "&&" : "typeof",
    options:
      index % 4 === 0
        ? ["map", "filter", "reduce", "forEach"]
        : index % 4 === 1
          ? ["trim", "toUpperCase", "slice", "repeat"]
          : index % 4 === 2
            ? ["&&", "=>", "||", "??"]
            : ["typeof", "return", "delete", "await"],
    explanation: "Choose the token that makes the code valid and correct.",
    type: "TAP_TOKEN",
    difficulty: "BEGINNER",
    category: "TYPES",
    timesUsed: 0,
    correctRate: 1,
  }));

  const advancedOutputQuestions = Array.from({ length: 20 }).map((_, index) => ({
    questionText: `Advanced Output ${index + 1}: What prints first / final value?`,
    codeSnippet:
      index % 5 === 0
        ? "Promise.resolve().then(() => console.log('micro'));\nsetTimeout(() => console.log('macro'), 0);\nconsole.log('sync');"
        : index % 5 === 1
          ? "const obj = { x: 2, fn() { return this.x; } };\nconst f = obj.fn;\nconsole.log(f());"
          : index % 5 === 2
            ? "const a = [1,2];\nconst b = a;\nb.push(3);\nconsole.log(a.length);"
            : index % 5 === 3
              ? "async function run(){ return 7; }\nrun().then(v => console.log(v));\nconsole.log('after');"
              : "const map = new Map();\nmap.set('x', 1);\nconsole.log(map.get('x'));",
    correctAnswer:
      index % 5 === 0
        ? "sync, micro, macro"
        : index % 5 === 1
          ? "undefined"
          : index % 5 === 2
            ? "3"
            : index % 5 === 3
              ? "after, 7"
              : "1",
    options:
      index % 5 === 0
        ? ["micro, sync, macro", "sync, micro, macro", "sync, macro, micro", "macro, sync, micro"]
        : index % 5 === 1
          ? ["2", "undefined", "null", "TypeError"]
          : index % 5 === 2
            ? ["2", "3", "1", "4"]
            : index % 5 === 3
              ? ["7, after", "after, 7", "after only", "Promise pending"]
              : ["0", "1", "undefined", "NaN"],
    explanation: "Advanced questions test event loop order, this binding, and references.",
    type: "MULTIPLE_CHOICE",
    difficulty: "ADVANCED",
    category: "ASYNC",
    timesUsed: 0,
    correctRate: 1,
  }));

  const advancedBugQuestions = Array.from({ length: 12 }).map((_, index) => ({
    questionText: `Advanced Bug ${index + 1}: Which line contains the bug?`,
    codeSnippet:
      index % 4 === 0
        ? "async function getData(){\n  const res = fetch('/api');\n  return (await res).json();\n}"
        : index % 4 === 1
          ? "class User {}\nconst u = User();\nconsole.log(u);\nconst done = true;"
          : index % 4 === 2
            ? "app.use(auth);\napp.get('/x', handler);\nfunction auth(req,res,next){ res.send('blocked'); }\nconst done = true;"
            : "const query = `SELECT * FROM users WHERE id = ${id}`;\ndb.query(query);\nconst mode = 'unsafe';\nconsole.log(mode);",
    correctAnswer: index % 4 === 0 ? "2" : index % 4 === 1 ? "2" : index % 4 === 2 ? "3" : "1",
    options: ["1", "2", "3", "4"],
    explanation: "Advanced bug spotting focuses on async mistakes, middleware flow, and security.",
    type: "FIND_THE_BUG",
    difficulty: "ADVANCED",
    category: "SCOPE",
    timesUsed: 0,
    correctRate: 1,
  }));

  const advancedTokenQuestions = Array.from({ length: 8 }).map((_, index) => ({
    questionText: `Advanced Token ${index + 1}: Complete the snippet.`,
    codeSnippet:
      index % 4 === 0
        ? "const { a, ...rest } = obj;\nconsole.log(Object.___(rest).length);"
        : index % 4 === 1
          ? "router.get('/users', auth, ___);"
          : index % 4 === 2
            ? "const result = await Promise.___([a(), b()]);"
            : "const value = config?.service?.port ___ 3000;",
    correctAnswer: index % 4 === 0 ? "keys" : index % 4 === 1 ? "handler" : index % 4 === 2 ? "all" : "??",
    options:
      index % 4 === 0
        ? ["keys", "values", "entries", "assign"]
        : index % 4 === 1
          ? ["handler", "middleware", "listen", "post"]
          : index % 4 === 2
            ? ["all", "race", "resolve", "any"]
            : ["??", "&&", "||", "==="],
    explanation: "Token completion checks production API familiarity and modern syntax.",
    type: "TAP_TOKEN",
    difficulty: "ADVANCED",
    category: "METHODS",
    timesUsed: 0,
    correctRate: 1,
  }));

  const duelQuestions = [
    ...beginnerOutputQuestions,
    ...beginnerBugQuestions,
    ...beginnerTokenQuestions,
    ...advancedOutputQuestions,
    ...advancedBugQuestions,
    ...advancedTokenQuestions,
  ];

  await prisma.duelQuestion.createMany({ data: duelQuestions });

  await prisma.badge.createMany({
    data: [
      { name: "Week Warrior", description: "Maintain a 7-day streak", iconKey: "week-warrior", category: "Consistency", unlockConditionJson: "{\"streak\":7}" },
      { name: "Month Master", description: "Maintain a 30-day streak", iconKey: "month-master", category: "Consistency", unlockConditionJson: "{\"streak\":30}" },
      { name: "Loop Lord", description: "Complete Loops chapter", iconKey: "loop-lord", category: "Learning", unlockConditionJson: "{\"chapter\":\"Loops\"}" },
      { name: "Async Ace", description: "Complete Async chapter", iconKey: "async-ace", category: "Learning", unlockConditionJson: "{\"chapter\":\"Async\"}" },
      { name: "First Blood", description: "Win your first duel", iconKey: "first-blood", category: "Duel", unlockConditionJson: "{\"duelWins\":1}" },
      { name: "Unbeatable", description: "Win 5 duels in a row", iconKey: "unbeatable", category: "Duel", unlockConditionJson: "{\"duelStreak\":5}" },
      { name: "Champion", description: "Reach Gold rank", iconKey: "champion", category: "Duel", unlockConditionJson: "{\"tier\":\"GOLD\"}" },
      { name: "Speed Coder", description: "Answer in under 2 seconds", iconKey: "speed-coder", category: "Speed", unlockConditionJson: "{\"answerMs\":2000}" },
      { name: "Lightning", description: "Five consecutive fast answers", iconKey: "lightning", category: "Speed", unlockConditionJson: "{\"fastAnswers\":5}" },
      { name: "Puzzle Solved", description: "Solve the Daily Code Puzzle", iconKey: "puzzle-solved", category: "Learning", unlockConditionJson: "{\"dailyPuzzle\":1}" },
    ],
  });

  console.log("Seed complete: paths, chapters, lessons, exercises, duel questions, badges.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
