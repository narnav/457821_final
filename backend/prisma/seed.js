import { Difficulty, ExerciseType, PathType, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
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
            key: PathType.BEGINNER,
            title: "JavaScript Foundations",
            description: "Start from zero and become confident with core JS concepts.",
        },
    });
    const advancedPath = await prisma.learningPath.create({
        data: {
            key: PathType.ADVANCED,
            title: "Professional JavaScript",
            description: "Deep, practical ES6+ and backend architecture skills.",
        },
    });
    const chapters = await prisma.chapter.createManyAndReturn({
        data: [
            {
                pathId: beginnerPath.id,
                title: "Your First Code",
                description: "console.log, comments, and mindset",
                orderIndex: 1,
            },
            {
                pathId: beginnerPath.id,
                title: "Variables & Data",
                description: "let/const, types, template literals",
                orderIndex: 2,
            },
            {
                pathId: beginnerPath.id,
                title: "Operators & Logic",
                description: "comparisons and truthy/falsy",
                orderIndex: 3,
            },
            {
                pathId: advancedPath.id,
                title: "ES6+ Deep Dive",
                description: "destructuring, optional chaining, rest/spread",
                orderIndex: 1,
            },
        ],
    });
    const chapterByTitle = new Map(chapters.map((chapter) => [chapter.title, chapter.id]));
    const lessons = await prisma.lesson.createManyAndReturn({
        data: [
            {
                chapterId: chapterByTitle.get("Your First Code"),
                title: "Meet console.log",
                description: "Print values and inspect behavior",
                estimatedMinutes: 8,
                orderIndex: 1,
                difficulty: Difficulty.BEGINNER,
            },
            {
                chapterId: chapterByTitle.get("Your First Code"),
                title: "Comments and readability",
                description: "Learn code comments and intent-driven coding",
                estimatedMinutes: 8,
                orderIndex: 2,
                difficulty: Difficulty.BEGINNER,
            },
            {
                chapterId: chapterByTitle.get("Variables & Data"),
                title: "let vs const",
                description: "Understand mutability and reassignment",
                estimatedMinutes: 10,
                orderIndex: 1,
                difficulty: Difficulty.BEGINNER,
            },
            {
                chapterId: chapterByTitle.get("Variables & Data"),
                title: "Primitive data types",
                description: "strings, numbers, booleans, null and undefined",
                estimatedMinutes: 10,
                orderIndex: 2,
                difficulty: Difficulty.BEGINNER,
            },
            {
                chapterId: chapterByTitle.get("Operators & Logic"),
                title: "Comparison operators",
                description: "===, !==, > and < in practical scenarios",
                estimatedMinutes: 10,
                orderIndex: 1,
                difficulty: Difficulty.BEGINNER,
            },
            {
                chapterId: chapterByTitle.get("Operators & Logic"),
                title: "Truthy, falsy, and short circuit",
                description: "How JS evaluates conditions",
                estimatedMinutes: 12,
                orderIndex: 2,
                difficulty: Difficulty.BEGINNER,
            },
            {
                chapterId: chapterByTitle.get("ES6+ Deep Dive"),
                title: "Destructuring and modern syntax",
                description: "Write concise production-ready code",
                estimatedMinutes: 14,
                orderIndex: 1,
                difficulty: Difficulty.ADVANCED,
            },
        ],
    });
    for (const lesson of lessons) {
        const exercises = await prisma.exercise.createManyAndReturn({
            data: [
                {
                    lessonId: lesson.id,
                    type: ExerciseType.CONCEPT_CARD,
                    prompt: `Core concept: ${lesson.title}`,
                    codeSnippet: "const level = 1;\nconsole.log(`Level ${level}`);",
                    correctAnswer: "GOT_IT",
                    explanation: "Short concept card with practical framing and concrete code.",
                    orderIndex: 1,
                    xpReward: 10,
                },
                {
                    lessonId: lesson.id,
                    type: ExerciseType.MULTIPLE_CHOICE,
                    prompt: "What does this output?",
                    codeSnippet: "const score = 7;\nconsole.log(score + 1);",
                    correctAnswer: "8",
                    explanation: "score + 1 evaluates to 8.",
                    orderIndex: 2,
                    xpReward: 20,
                },
                {
                    lessonId: lesson.id,
                    type: ExerciseType.FIND_THE_BUG,
                    prompt: "Tap the buggy line.",
                    codeSnippet: "const x = 3;\nif (x = 4) {\n  console.log('x is 4');\n}",
                    correctAnswer: "2",
                    explanation: "Use comparison (===), not assignment (=), in conditions.",
                    orderIndex: 3,
                    xpReward: 25,
                },
                {
                    lessonId: lesson.id,
                    type: ExerciseType.DRAG_DROP,
                    prompt: "Arrange lines to create working code.",
                    codeSnippet: "return n * 2;\nfunction double(n) {\n}\nconsole.log(double(3));",
                    correctAnswer: "function double(n) {||return n * 2;||}||console.log(double(3));",
                    explanation: "The return statement must be inside the function block.",
                    orderIndex: 4,
                    xpReward: 25,
                },
                {
                    lessonId: lesson.id,
                    type: ExerciseType.CODE_FILL,
                    prompt: "Fill the blank.",
                    codeSnippet: "const name = 'Ada';\nconsole.log(___);",
                    correctAnswer: "name",
                    explanation: "Use the variable identifier to print the value.",
                    orderIndex: 5,
                    xpReward: 20,
                },
                {
                    lessonId: lesson.id,
                    type: ExerciseType.TAP_TOKEN,
                    prompt: "Tap the callback function.",
                    codeSnippet: "[1, 2, 3].map((v) => v + 1);",
                    correctAnswer: "(v) => v + 1",
                    explanation: "The function passed to map is the callback.",
                    orderIndex: 6,
                    xpReward: 20,
                },
            ],
        });
        for (const exercise of exercises) {
            if (exercise.type === ExerciseType.MULTIPLE_CHOICE) {
                await prisma.exerciseOption.createMany({
                    data: [
                        { exerciseId: exercise.id, text: "7", isCorrect: false },
                        { exerciseId: exercise.id, text: "8", isCorrect: true },
                        { exerciseId: exercise.id, text: "9", isCorrect: false },
                        { exerciseId: exercise.id, text: "undefined", isCorrect: false },
                    ],
                });
            }
        }
    }
    const categories = ["OUTPUT", "SCOPE", "ASYNC", "TYPES", "METHODS"];
    const duelQuestions = Array.from({ length: 50 }).map((_, index) => {
        const category = categories[index % categories.length];
        return {
            questionText: `Duel Q${index + 1}: quick ${category.toLowerCase()} challenge`,
            codeSnippet: category === "ASYNC"
                ? "setTimeout(() => console.log('B'), 0);\nconsole.log('A');"
                : category === "TYPES"
                    ? "console.log(typeof null);"
                    : category === "METHODS"
                        ? "console.log([1,2,3].map(n => n * 2)[1]);"
                        : category === "SCOPE"
                            ? "let a = 1;\nif (true) { let a = 2; }\nconsole.log(a);"
                            : "console.log(2 + '2');",
            correctAnswer: category === "ASYNC"
                ? "A"
                : category === "TYPES"
                    ? "object"
                    : category === "METHODS"
                        ? "4"
                        : category === "SCOPE"
                            ? "1"
                            : "22",
            type: ExerciseType.MULTIPLE_CHOICE,
            difficulty: index % 3 === 0 ? Difficulty.BEGINNER : index % 3 === 1 ? Difficulty.INTERMEDIATE : Difficulty.ADVANCED,
            category,
            timesUsed: 0,
            correctRate: 1,
        };
    });
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
