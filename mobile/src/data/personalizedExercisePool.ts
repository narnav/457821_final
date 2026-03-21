export type PersonalizationLevel = "BEGINNER" | "BASICS" | "INTERMEDIATE" | "ADVANCED";

export interface PersonalizedExercise {
  id: string;
  type: "CONCEPT_CARD" | "MULTIPLE_CHOICE" | "FIND_THE_BUG" | "DRAG_DROP" | "CODE_FILL" | "TAP_TOKEN";
  prompt: string;
  codeSnippet: string;
  correctAnswer: string;
  explanation: string;
  xpReward: number;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

type ExerciseSpec = [string, string, string, string, string[], string];

function build(spec: ExerciseSpec): PersonalizedExercise {
  const [id, prompt, codeSnippet, correctAnswer, choiceValues, explanation] = spec;
  return {
    id,
    type: "MULTIPLE_CHOICE",
    prompt,
    codeSnippet,
    correctAnswer,
    explanation,
    xpReward: 20,
    options: choiceValues.map((text, index) => ({ id: `${id}-opt-${index}`, text, isCorrect: text === correctAnswer })),
  };
}

function copyExercises(list: PersonalizedExercise[]): PersonalizedExercise[] {
  return list.map((exercise) => ({
    ...exercise,
    options: exercise.options.map((option) => ({ ...option })),
  }));
}

const beginnerSpecs: ExerciseSpec[] = [
  ["bg-1", "Which declaration is best for a score that changes during a game?", "/* choose one */", "let", ["const", "let", "var", "score"], "let is intended for values that may be reassigned."],
  ["bg-2", "What does this print?", "const type = typeof 12;\nconsole.log(type);", "number", ["string", "number", "boolean", "undefined"], "typeof 12 returns number."],
  ["bg-3", "What is the output?", "console.log(7 + 5);", "12", ["75", "12", "2", "undefined"], "Basic arithmetic addition results in 12."],
  ["bg-4", "What is printed?", "const label = '  code  ';\nconsole.log(label.trim());", "code", ["  code  ", "code", "CODE", "false"], "trim removes spaces at both ends."],
  ["bg-5", "Which branch runs?", "const lives = 0;\nif (lives) { console.log('play'); } else { console.log('game over'); }", "game over", ["play", "game over", "0", "undefined"], "0 is falsy, so else runs."],
  ["bg-6", "How many loop iterations happen?", "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}", "3", ["2", "3", "4", "1"], "i takes 0,1,2 so loop runs 3 times."],
  ["bg-7", "What does this return?", "const fruits = ['apple', 'pear'];\nconsole.log(fruits[0]);", "apple", ["pear", "apple", "2", "undefined"], "Index 0 points at the first element."],
  ["bg-8", "What prints?", "const user = { name: 'Mina' };\nconsole.log(user.name);", "Mina", ["name", "Mina", "undefined", "object"], "Dot access reads the property value."],
  ["bg-9", "What does this function output?", "function shout() { console.log('Hey!'); }\nshout();", "Hey!", ["shout", "Hey!", "undefined", "function"], "Function logs the string when called."],
  ["bg-10", "What is the result?", "console.log('5' + 1);", "51", ["6", "51", "NaN", "undefined"], "String plus number concatenates into a string."],
  ["bg-11", "What does includes return here?", "const title = 'CodeQuest';\nconsole.log(title.includes('Quest'));", "true", ["false", "true", "Quest", "undefined"], "Quest is a substring of CodeQuest."],
  ["bg-12", "What is printed?", "const msg = 'hi';\nconsole.log(msg.toUpperCase());", "HI", ["hi", "HI", "Hi", "undefined"], "toUpperCase converts letters to uppercase."],
  ["bg-13", "What is printed?", "const cities = ['Rome'];\ncities.push('Lima');\nconsole.log(cities.length);", "2", ["1", "2", "3", "undefined"], "push adds one element, length becomes 2."],
  ["bg-14", "What does pop return?", "const list = ['a', 'b'];\nconsole.log(list.pop());", "b", ["a", "b", "2", "undefined"], "pop removes and returns the last item."],
  ["bg-15", "Which value is truthy?", "/* pick truthy */", "'0'", ["0", "''", "'0'", "null"], "Non-empty strings are truthy, including '0'."],
  ["bg-16", "What prints?", "let total = 1;\nwhile (total < 4) { total++; }\nconsole.log(total);", "4", ["3", "4", "5", "1"], "Loop increments until total equals 4."],
  ["bg-17", "What does typeof null return?", "console.log(typeof null);", "object", ["null", "object", "undefined", "number"], "JavaScript historically reports object for null."],
  ["bg-18", "What does this print?", "const name = '  Ada';\nconsole.log(name.toLowerCase().trim());", "ada", ["Ada", "  ada", "ada", "undefined"], "toLowerCase then trim results in ada."],
  ["bg-19", "What is logged?", "const x = 10;\nif (x > 5) console.log('big');", "big", ["small", "big", "true", "10"], "10 is greater than 5."],
  ["bg-20", "What prints?", "const arr = [3, 9, 1];\nconsole.log(arr.length);", "3", ["2", "3", "9", "undefined"], "Array has three items."],
  ["bg-21", "What does this output?", "const pet = { kind: 'cat' };\nconsole.log(pet['kind']);", "cat", ["kind", "cat", "undefined", "object"], "Bracket notation reads the same property."],
  ["bg-22", "What is the output?", "console.log(14 - 6);", "8", ["20", "8", "146", "undefined"], "Subtraction yields 8."],
  ["bg-23", "What happens when condition is false?", "if (false) { console.log('A'); } else { console.log('B'); }", "B", ["A", "B", "false", "undefined"], "Else branch executes."],
  ["bg-24", "What does this print?", "const word = 'play';\nconsole.log(word.includes('ay'));", "true", ["true", "false", "ay", "undefined"], "ay appears in play."],
  ["bg-25", "What is printed?", "let temp = 2;\ntemp = temp + 3;\nconsole.log(temp);", "5", ["23", "5", "2", "undefined"], "Value is reassigned to 5."],
  ["bg-26", "What prints?", "function tap() { console.log('tap'); }\ntap();", "tap", ["tap", "undefined", "function", "null"], "Function body logs tap."],
  ["bg-27", "What does this return?", "const str = 'JS';\nconsole.log(str.toLowerCase());", "js", ["JS", "js", "Js", "undefined"], "toLowerCase converts to js."],
  ["bg-28", "What prints?", "const nums = [2];\nnums.push(4);\nconsole.log(nums[1]);", "4", ["2", "4", "1", "undefined"], "New value is stored at index 1."],
  ["bg-29", "What is printed?", "const price = 0;\nconsole.log(Boolean(price));", "false", ["true", "false", "0", "undefined"], "0 coerces to false."],
  ["bg-30", "What prints?", "const t = '  wow  ';\nconsole.log(t.trim().length);", "3", ["2", "3", "7", "undefined"], "After trim, wow has length 3."],
];

const basicsSpecs: ExerciseSpec[] = [
  ["bs-1", "Which line is a function expression?", "/* pick one */", "const log = function() {}", ["function run() {}", "const log = function() {}", "return () => {}", "log()"], "Function expression is assigned to a variable."],
  ["bs-2", "What does this arrow function return?", "const add = (a, b) => a + b;\nconsole.log(add(2, 4));", "6", ["24", "6", "undefined", "NaN"], "Arrow expression returns a+b."],
  ["bs-3", "What is printed?", "const n = 'Maya';\nconsole.log(`Hi ${n}`);", "Hi Maya", ["Hi ${n}", "Hi Maya", "Maya Hi", "undefined"], "Template literal interpolates variable value."],
  ["bs-4", "What does ternary produce?", "const ready = true;\nconst msg = ready ? 'Go' : 'Wait';\nconsole.log(msg);", "Go", ["Wait", "Go", "true", "undefined"], "True condition selects first value."],
  ["bs-5", "What does indexOf return?", "const tags = ['js', 'ui', 'api'];\nconsole.log(tags.indexOf('ui'));", "1", ["0", "1", "2", "-1"], "ui is at index 1."],
  ["bs-6", "What is joined string?", "const p = ['a', 'b', 'c'];\nconsole.log(p.join('-'));", "a-b-c", ["abc", "a,b,c", "a-b-c", "undefined"], "join with '-' inserts dashes."],
  ["bs-7", "What prints?", "const q = [1,2,3];\nconsole.log(q.slice(1));", "[2,3]", ["[1,2]", "[2,3]", "[3]", "2"], "slice(1) copies from index 1 onward."],
  ["bs-8", "What value does this log?", "const r = [1,2,3];\nconsole.log([...r].reverse()[0]);", "3", ["1", "2", "3", "undefined"], "Copied array reversed starts with 3."],
  ["bs-9", "What does this print?", "const user = {name:'Ari', say(){ return this.name; }};\nconsole.log(user.say());", "Ari", ["name", "Ari", "undefined", "say"], "this refers to user inside method call."],
  ["bs-10", "Which destructuring is correct?", "const obj = {id: 7, title: 'task'};\n/* pick id extraction */", "const { id } = obj", ["const id = obj.id", "const { id } = obj", "const [id] = obj", "obj.id()"], "Object destructuring uses braces."],
  ["bs-11", "What does default parameter do here?", "const greet = (name = 'friend') => `Hi ${name}`;\nconsole.log(greet());", "Hi friend", ["Hi ", "Hi friend", "friend", "undefined"], "Default value is used when arg missing."],
  ["bs-12", "What does spread create?", "const base = [1,2];\nconst next = [...base, 3];\nconsole.log(next);", "[1,2,3]", ["[1,2]", "[1,2,3]", "3", "undefined"], "Spread copies base and appends 3."],
  ["bs-13", "Which loop iterates array values?", "const names=['a','b'];\n/* pick loop */", "for (const n of names)", ["for (const i in names)", "for (const n of names)", "for (names)", "while names"], "for...of iterates values."],
  ["bs-14", "Which loop iterates object keys?", "const score={a:1,b:2};\n/* pick loop */", "for (const k in score)", ["for (const k of score)", "for (const k in score)", "for (score)", "forEach(score)"], "for...in iterates enumerable keys."],
  ["bs-15", "What does short-circuit return?", "const title = '' || 'Untitled';\nconsole.log(title);", "Untitled", ["", "Untitled", "false", "undefined"], "|| returns first truthy value."],
  ["bs-16", "What does nullish coalescing return?", "const c = null ?? 'fallback';\nconsole.log(c);", "fallback", ["null", "fallback", "undefined", "false"], "?? uses right side for null/undefined only."],
  ["bs-17", "What is logged?", "const score = 0 || 15;\nconsole.log(score);", "15", ["0", "15", "false", "undefined"], "0 is falsy so || picks 15."],
  ["bs-18", "What is logged?", "const score = 0 ?? 15;\nconsole.log(score);", "0", ["0", "15", "false", "undefined"], "0 is not nullish, so ?? keeps 0."],
  ["bs-19", "What is printed?", "const x = ['a','b','c'];\nconsole.log(x.slice(0,2).join(','));", "a,b", ["a,b", "b,c", "abc", "undefined"], "slice(0,2) gives a,b then join."],
  ["bs-20", "What is output?", "const fn = (v) => v ? 'yes' : 'no';\nconsole.log(fn(false));", "no", ["yes", "no", "false", "undefined"], "False condition returns no."],
  ["bs-21", "What does this log?", "const person = { first:'Ira', last:'N' };\nconst { first } = person;\nconsole.log(first);", "Ira", ["Ira", "person", "first", "undefined"], "first is extracted from person."],
  ["bs-22", "What does this print?", "const pair = [8, 9];\nconst [a, b] = pair;\nconsole.log(b);", "9", ["8", "9", "pair", "undefined"], "Array destructuring assigns by position."],
  ["bs-23", "What is result?", "const total = (a = 1, b = 2) => a + b;\nconsole.log(total(5));", "7", ["5", "6", "7", "undefined"], "a=5, b default 2, sum 7."],
  ["bs-24", "Which is immutable reverse?", "const list=[1,2,3];\n/* pick one */", "[...list].reverse()", ["list.reverse()", "[...list].reverse()", "list.slice(1)", "list.unshift()"], "Copy+reverse keeps original list unchanged."],
  ["bs-25", "What does this return?", "const isReady = true && 'launch';\nconsole.log(isReady);", "launch", ["true", "launch", "false", "undefined"], "&& returns last operand when all truthy."],
  ["bs-26", "What is output?", "const mode = '' ?? 'dark';\nconsole.log(mode);", "", ["dark", "", "undefined", "false"], "Empty string is not nullish, so stays."],
  ["bs-27", "What prints?", "const teams = ['red', 'blue'];\nconsole.log(teams.indexOf('green'));", "-1", ["0", "1", "-1", "undefined"], "indexOf returns -1 for missing element."],
  ["bs-28", "What prints?", "const x = ['n','o'];\nconsole.log(x.join(''));", "no", ["n,o", "no", "on", "undefined"], "join with empty separator concatenates."],
  ["bs-29", "What is output?", "const obj = { a: 1, b: 2 };\nlet sum = 0;\nfor (const k in obj) sum += obj[k];\nconsole.log(sum);", "3", ["2", "3", "12", "undefined"], "Loop adds both values."],
  ["bs-30", "What does this print?", "const out = [1,2,3].slice(1).reverse();\nconsole.log(out);", "[3,2]", ["[2,3]", "[3,2]", "[1,2,3]", "undefined"], "slice copy then reverse gives [3,2]."],
];

const intermediateSpecs: ExerciseSpec[] = [
  ["im-1", "What does map produce here?", "const prices = [3, 5];\nconsole.log(prices.map((p) => p * 10));", "[30,50]", ["[3,5]", "[30,50]", "80", "undefined"], "map transforms each element and returns a new array."],
  ["im-2", "What does filter return?", "const ids = [2, 7, 8, 11];\nconsole.log(ids.filter((id) => id > 7));", "[8,11]", ["[2,7]", "[8,11]", "11", "undefined"], "filter keeps values that satisfy the predicate."],
  ["im-3", "What does find return?", "const users = [{id:1},{id:4}];\nconsole.log(users.find((u) => u.id === 4));", "{id:4}", ["{id:1}", "{id:4}", "[{id:4}]", "undefined"], "find returns the first matching element."],
  ["im-4", "What does some return?", "const nums = [1, 3, 8];\nconsole.log(nums.some((n) => n % 2 === 0));", "true", ["false", "true", "8", "undefined"], "At least one item is even."],
  ["im-5", "What does every return?", "const nums = [2, 4, 6];\nconsole.log(nums.every((n) => n % 2 === 0));", "true", ["true", "false", "6", "undefined"], "All elements pass the condition."],
  ["im-6", "What is reduce result?", "const points = [2, 3, 5];\nconsole.log(points.reduce((a, b) => a + b, 0));", "10", ["235", "10", "8", "undefined"], "reduce accumulates to one value."],
  ["im-7", "What logs from this closure?", "function maker(){ let v=0; return () => ++v; }\nconst next = maker();\nconsole.log(next(), next());", "1 2", ["1 1", "1 2", "2 2", "0 1"], "Returned function keeps lexical state."],
  ["im-8", "What prints with var in async loop?", "for (var i=0;i<2;i++){ setTimeout(()=>console.log(i),0); }", "2 2", ["0 1", "2 2", "1 2", "undefined"], "var shares one binding, final value is printed."],
  ["im-9", "What prints with let in async loop?", "for (let i=0;i<2;i++){ setTimeout(()=>console.log(i),0); }", "0 1", ["2 2", "0 1", "1 1", "undefined"], "let creates per-iteration bindings."],
  ["im-10", "What is callback role here?", "const out = [1,2,3].map((n) => n + 1);", "Function passed into map", ["Array to map", "Function passed into map", "Promise object", "Loop index"], "map expects a callback for each element."],
  ["im-11", "What is .then chained value?", "Promise.resolve(2).then((v) => v * 3).then(console.log);", "6", ["2", "3", "6", "undefined"], "First then returns 6 to next then."],
  ["im-12", "What does catch handle?", "Promise.reject(new Error('x')).catch(() => 'ok').then(console.log);", "ok", ["x", "ok", "undefined", "throws"], "catch recovers rejected promise."],
  ["im-13", "What does await resolve to?", "async function run(){ const v = await Promise.resolve(9); return v; }\nrun().then(console.log);", "9", ["Promise", "9", "undefined", "0"], "await unwraps resolved value."],
  ["im-14", "What is printed by try/catch?", "try { throw new Error('nope'); } catch { console.log('handled'); }", "handled", ["nope", "handled", "undefined", "error"], "catch executes after throw."],
  ["im-15", "What does prototype access do?", "const animal = {sound:'mew'};\nconst cat = Object.create(animal);\nconsole.log(cat.sound);", "mew", ["undefined", "mew", "animal", "null"], "Property is read from prototype chain."],
  ["im-16", "What does class method return?", "class Counter { value=2; up(){ return this.value + 1; } }\nconsole.log(new Counter().up());", "3", ["2", "3", "1", "undefined"], "Method reads instance field and increments."],
  ["im-17", "Import/export concept: what does import read?", "// module exports const api = 5;\n// consumer imports api", "Exported binding from another module", ["Local variable only", "Exported binding from another module", "A class instance", "A promise by default"], "import consumes named/default exports."],
  ["im-18", "Optional chaining result?", "const cfg = {};\nconsole.log(cfg.server?.port ?? 3000);", "3000", ["undefined", "3000", "null", "0"], "Missing path yields undefined then fallback."],
  ["im-19", "Object.keys output?", "const stats = { wins: 2, losses: 1 };\nconsole.log(Object.keys(stats));", "['wins','losses']", ["[2,1]", "['wins','losses']", "wins,losses", "undefined"], "keys returns property-name array."],
  ["im-20", "Object.values output?", "const stats = { wins: 2, losses: 1 };\nconsole.log(Object.values(stats));", "[2,1]", ["['wins','losses']", "[2,1]", "2", "undefined"], "values returns property values."],
  ["im-21", "Object.entries shape?", "const m = { a: 1 };\nconsole.log(Object.entries(m));", "[['a',1]]", ["['a',1]", "[['a',1]]", "{a:1}", "undefined"], "entries returns key-value tuple arrays."],
  ["im-22", "Chained array methods result?", "const out = [1,2,3,4].filter((n)=>n%2===0).map((n)=>n*3);\nconsole.log(out);", "[6,12]", ["[2,4]", "[6,12]", "18", "undefined"], "filter then map transforms remaining elements."],
  ["im-23", "What does this IIFE print?", "(() => { const hidden = 7; console.log(hidden); })();", "7", ["hidden", "7", "undefined", "error"], "IIFE executes immediately in its own scope."],
  ["im-24", "What does reduce with object accumulator build?", "const rows = ['a','b'];\nconsole.log(rows.reduce((acc, v) => ({...acc, [v]: true}), {}));", "{a:true,b:true}", ["['a','b']", "{a:true,b:true}", "true", "undefined"], "Reducer returns updated object each step."],
  ["im-25", "Promise chain order concept?", "console.log('A'); Promise.resolve().then(()=>console.log('B')); console.log('C');", "A C B", ["A B C", "A C B", "B A C", "C A B"], "Microtask runs after sync lines."],
  ["im-26", "What does this callback parameter represent?", "[10,20].forEach((value, index) => console.log(index));", "Current item index", ["Array length", "Current item index", "Promise state", "Loop exit code"], "forEach passes value and index."],
  ["im-27", "What prints?", "const factory = (start) => () => start + 1;\nconst fn = factory(4);\nconsole.log(fn());", "5", ["4", "5", "start", "undefined"], "Closure captures start as 4."],
  ["im-28", "What is output of find on miss?", "const value = [1,2,3].find((x) => x > 5);\nconsole.log(value);", "undefined", ["null", "undefined", "[]", "0"], "find returns undefined when no match."],
  ["im-29", "What does async function always return?", "async function x(){ return 1; }\nconsole.log(x() instanceof Promise);", "true", ["false", "true", "1", "undefined"], "async wraps return in Promise."],
  ["im-30", "What does try/catch/finally guarantee?", "try { throw new Error('x'); } catch {} finally { console.log('done'); }", "finally block runs", ["catch skipped", "finally block runs", "promise rejected", "done is optional"], "finally runs regardless of throw/catch path."],
];

const advancedSpecs: ExerciseSpec[] = [
  ["ad-1", "Memoization closure result?", "function memo(){ const cache = new Map(); return (n)=> cache.get(n) ?? (cache.set(n,n*n), cache.get(n)); }\nconst sq = memo(); console.log(sq(3));", "9", ["3", "6", "9", "undefined"], "Factory keeps cache across calls via closure."],
  ["ad-2", "What does bind change?", "const obj = { x: 4 };\nfunction read(){ return this.x; }\nconst bound = read.bind(obj);\nconsole.log(bound());", "4", ["undefined", "4", "obj", "NaN"], "bind fixes this to obj."],
  ["ad-3", "What does call do here?", "function sum(a,b){ return a+b+this.base; }\nconsole.log(sum.call({base:1},2,3));", "6", ["5", "6", "undefined", "NaN"], "call sets this and passes args immediately."],
  ["ad-4", "What does apply expect?", "function max2(a,b){ return Math.max(a,b); }\nconsole.log(max2.apply(null,[7,2]));", "7", ["2", "7", "[7,2]", "undefined"], "apply passes arguments as array-like."],
  ["ad-5", "Prototype chain lookup result?", "const a = { p: 1 }; const b = Object.create(a); const c = Object.create(b);\nconsole.log(c.p);", "1", ["undefined", "1", "0", "c"], "Lookup walks up prototype chain."],
  ["ad-6", "Generator first next value?", "function* ids(){ yield 10; yield 20; }\nconst g = ids();\nconsole.log(g.next().value);", "10", ["20", "10", "undefined", "done"], "First next pulls first yield value."],
  ["ad-7", "Iterator protocol requires what?", "const it = [1,2][Symbol.iterator]();", "next() returning {value,done}", ["value only", "next() returning {value,done}", "promise resolve", "generator only"], "Iterators expose next with value/done."],
  ["ad-8", "Why use Symbol keys?", "const id = Symbol('id'); const obj = { [id]: 5 };", "Avoid accidental key collisions", ["Faster loops only", "Avoid accidental key collisions", "Serialize to JSON always", "Replace Map"], "Symbols create unique property keys."],
  ["ad-9", "WeakMap key constraint?", "const wm = new WeakMap();", "Keys must be objects", ["Keys must be strings", "Keys must be objects", "Any primitive", "Only arrays"], "WeakMap accepts object keys only."],
  ["ad-10", "WeakSet stores what?", "const ws = new WeakSet();", "Object references", ["Numbers", "Strings", "Object references", "Tuples"], "WeakSet holds objects weakly referenced."],
  ["ad-11", "Proxy get trap can do what?", "new Proxy({}, { get(target, prop){ return 'x'; } });", "Intercept property reads", ["Only writes", "Intercept property reads", "Patch event loop", "Compile code"], "get trap runs when reading props."],
  ["ad-12", "Reflect.get role?", "Reflect.get({a:1}, 'a')", "Standardized property access helper", ["Array clone", "Standardized property access helper", "Promise utility", "JSON parser"], "Reflect mirrors low-level object operations."],
  ["ad-13", "Microtask vs macrotask order?", "setTimeout(()=>console.log('timeout'),0); Promise.resolve().then(()=>console.log('then')); console.log('sync');", "sync then timeout", ["then sync timeout", "sync then timeout", "timeout then sync", "random"], "sync first, then microtask, then macrotask."],
  ["ad-14", "Promise.all result behavior?", "Promise.all([Promise.resolve(1), Promise.resolve(2)])", "Resolves array when all succeed", ["First value only", "Resolves array when all succeed", "Always rejects", "Runs sequentially"], "all waits for every promise."],
  ["ad-15", "Promise.race behavior?", "Promise.race([slow, fast])", "Settles with first settled promise", ["Waits all", "Settles with first settled promise", "Sorts by value", "Rejects by default"], "race mirrors earliest settle."],
  ["ad-16", "Promise.allSettled result shape?", "Promise.allSettled([Promise.resolve(1), Promise.reject('x')])", "Array of {status,value|reason}", ["Single boolean", "Array of {status,value|reason}", "Only fulfilled values", "Error throw"], "allSettled keeps both outcomes."],
  ["ad-17", "Advanced async pattern: what does await in loop imply?", "for (const id of ids) { await fetchById(id); }", "Sequential requests", ["Parallel by default", "Sequential requests", "Compile error", "No network"], "await inside loop serializes execution."],
  ["ad-18", "How to run async tasks in parallel?", "await Promise.all(tasks.map((t)=>t()));", "Launch all tasks then await all", ["Runs one by one", "Launch all tasks then await all", "Ignores errors", "Returns first only"], "Promise.all parallelizes pending tasks."],
  ["ad-19", "Currying output?", "const add = (a) => (b) => a + b;\nconsole.log(add(2)(5));", "7", ["25", "7", "undefined", "NaN"], "Curried function returns another function."],
  ["ad-20", "Partial application result?", "const multiply = (a,b) => a*b; const double = multiply.bind(null,2);\nconsole.log(double(6));", "12", ["8", "12", "26", "undefined"], "bind pre-fills first argument."],
  ["ad-21", "Functional composition result?", "const compose = (f,g) => (x) => f(g(x));\nconst inc = (x)=>x+1; const dbl=(x)=>x*2; console.log(compose(inc,dbl)(3));", "7", ["6", "7", "8", "undefined"], "dbl(3)=6 then inc -> 7."],
  ["ad-22", "Deep clone safe for plain data?", "const clone = structuredClone(data);", "Clones nested plain structures", ["Only shallow copy", "Clones nested plain structures", "Mutates original", "Stringifies functions"], "structuredClone copies deep serializable data."],
  ["ad-23", "Regex test output?", "console.log(/^\\d+$/.test('1234'));", "true", ["false", "true", "1234", "undefined"], "Pattern matches one or more digits only."],
  ["ad-24", "Regex mismatch output?", "console.log(/^[a-z]+$/.test('abc7'));", "false", ["true", "false", "abc7", "undefined"], "abc7 has digit so pattern fails."],
  ["ad-25", "Module pattern purpose?", "const service = (()=>{ const secret=1; return { read:()=>secret }; })();", "Encapsulate private state", ["Global mutation", "Encapsulate private state", "Compile to class", "Disable closures"], "IIFE module hides internal variables."],
  ["ad-26", "Observer pattern core idea?", "source.subscribe(listener)", "Publishers notify subscribed listeners", ["Single callback only", "Publishers notify subscribed listeners", "Promise batching", "Inheritance helper"], "Observer connects producer and consumers."],
  ["ad-27", "Singleton intent?", "class Config { static instance = new Config(); }", "Keep a single shared instance", ["Create many copies", "Keep a single shared instance", "Replace DI", "Avoid exports"], "Singleton exposes one global-like instance."],
  ["ad-28", "Tagged template receives what?", "tag`Hi ${name}`", "Strings array plus interpolated values", ["Only final string", "Strings array plus interpolated values", "Object keys", "Promise"], "Tag functions receive chunks and expressions."],
  ["ad-29", "This edge case output?", "const x = { value: 2, f(){ return () => this.value; } };\nconsole.log(x.f()());", "2", ["undefined", "2", "x", "NaN"], "Arrow keeps outer method this context."],
  ["ad-30", "Which is safer fallback for nullable nested access?", "const port = cfg?.server?.port ?? 8080;", "Optional chaining with nullish fallback", ["cfg.server.port || 8080 always", "Optional chaining with nullish fallback", "delete cfg.server", "throw cfg"], "?. and ?? avoid crashes while preserving 0/empty string semantics."],
];

const exerciseSets: Record<PersonalizationLevel, PersonalizedExercise[]> = {
  BEGINNER: beginnerSpecs.map(build),
  BASICS: basicsSpecs.map(build),
  INTERMEDIATE: intermediateSpecs.map(build),
  ADVANCED: advancedSpecs.map(build),
};

function assertUniqueAndSizedPools() {
  const levels: PersonalizationLevel[] = ["BEGINNER", "BASICS", "INTERMEDIATE", "ADVANCED"];
  const seenIds = new Set<string>();
  for (const level of levels) {
    const list = exerciseSets[level];
    if (list.length !== 30) {
      throw new Error(`Exercise pool for ${level} must contain exactly 30 items.`);
    }
    for (const exercise of list) {
      if (seenIds.has(exercise.id)) {
        throw new Error(`Duplicate exercise id found across levels: ${exercise.id}`);
      }
      seenIds.add(exercise.id);
    }
  }
}

assertUniqueAndSizedPools();

export function getExercisePoolForLevel(level: PersonalizationLevel): PersonalizedExercise[] {
  return copyExercises(exerciseSets[level]);
}
