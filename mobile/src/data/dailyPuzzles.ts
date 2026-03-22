export interface DailyPuzzle {
  id: string;
  prompt: string;
  acceptedAnswers: string[];
}

const puzzles: DailyPuzzle[] = [
  {
    id: "p-last-element",
    prompt: "Write a one-line JS expression that returns the last element of array `arr`.",
    acceptedAnswers: ["arr[arr.length-1]", "arr.at(-1)"],
  },
  { id: "p-first-element", prompt: "Write a one-line expression that returns the FIRST element of array `arr`.", acceptedAnswers: ["arr[0]"] },
  { id: "p-string-length", prompt: "Write a one-line expression that returns the LENGTH of string `str`.", acceptedAnswers: ["str.length"] },
  { id: "p-double-array", prompt: "Write a one-line expression that returns `arr` with all elements doubled.", acceptedAnswers: ["arr.map(x=>x*2)", "arr.map((x)=>x*2)"] },
  { id: "p-even-only", prompt: "Write a one-line expression that returns only the EVEN numbers from `arr`.", acceptedAnswers: ["arr.filter(x=>x%2===0)", "arr.filter((x)=>x%2===0)"] },
  { id: "p-sum-all", prompt: "Write a one-line expression that returns the SUM of all elements in `arr`.", acceptedAnswers: ["arr.reduce((a,b)=>a+b,0)", "arr.reduce((a, b) => a + b, 0)"] },
  { id: "p-includes-5", prompt: "Write a one-line expression that checks if `arr` INCLUDES the number 5.", acceptedAnswers: ["arr.includes(5)"] },
  { id: "p-reverse-copy", prompt: "Write a one-line expression that returns `arr` REVERSED (without mutating).", acceptedAnswers: ["[...arr].reverse()", "arr.slice().reverse()"] },
  { id: "p-largest", prompt: "Write a one-line expression that returns the LARGEST number in `arr`.", acceptedAnswers: ["Math.max(...arr)"] },
  { id: "p-smallest", prompt: "Write a one-line expression that returns the SMALLEST number in `arr`.", acceptedAnswers: ["Math.min(...arr)"] },
  { id: "p-uppercase", prompt: "Write a one-line expression that converts string `str` to UPPERCASE.", acceptedAnswers: ["str.toUpperCase()"] },
  { id: "p-trim", prompt: "Write a one-line expression that removes WHITESPACE from both ends of `str`.", acceptedAnswers: ["str.trim()"] },
  { id: "p-split-words", prompt: "Write a one-line expression that SPLITS `str` into an array of words.", acceptedAnswers: ["str.split(' ')", "str.split(\" \")"] },
  { id: "p-join-comma", prompt: "Write a one-line expression that JOINS array `arr` into a string with commas.", acceptedAnswers: ["arr.join(', ')", "arr.join(\", \")"] },
  { id: "p-index-of-x", prompt: "Write a one-line expression that returns the index of value `x` in `arr`, or -1.", acceptedAnswers: ["arr.indexOf(x)"] },
  { id: "p-every-positive", prompt: "Write a one-line expression that returns TRUE if ALL elements in `arr` are positive.", acceptedAnswers: ["arr.every(x=>x>0)", "arr.every((x)=>x>0)"] },
  { id: "p-some-negative", prompt: "Write a one-line expression that returns TRUE if ANY element in `arr` is negative.", acceptedAnswers: ["arr.some(x=>x<0)", "arr.some((x)=>x<0)"] },
  { id: "p-without-first", prompt: "Write a one-line expression that returns a NEW array without the first element.", acceptedAnswers: ["arr.slice(1)"] },
  { id: "p-find-gt10", prompt: "Write a one-line expression that returns the first element > 10 in `arr`.", acceptedAnswers: ["arr.find(x=>x>10)", "arr.find((x)=>x>10)"] },
  { id: "p-object-keys", prompt: "Write a one-line expression that returns `obj` keys as an array.", acceptedAnswers: ["Object.keys(obj)"] },
  { id: "p-flat-array", prompt: "Write a one-line expression that returns a FLATTENED version of nested array `arr`.", acceptedAnswers: ["arr.flat()"] },
];

export function normalizePuzzleAnswer(value: string): string {
  return value.replace(/\s+/g, "").trim().replace(/;$/, "");
}

export function getPuzzleForDate(date: Date): DailyPuzzle {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const puzzleIndex = ((dayOfYear % puzzles.length) + puzzles.length) % puzzles.length;
  return puzzles[puzzleIndex];
}

export function isPuzzleAnswerCorrect(puzzle: DailyPuzzle, input: string): boolean {
  const normalizedInput = normalizePuzzleAnswer(input);
  if (!normalizedInput) return false;
  return puzzle.acceptedAnswers.some((answer) => normalizePuzzleAnswer(answer) === normalizedInput);
}

export const dailyPuzzleBank = puzzles;
