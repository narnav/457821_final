export const learningKeys = {
  all: ["learning"] as const,
  userState: (userId: string) => [...learningKeys.all, "state", userId] as const,
  currentExercise: (userId: string) =>
    [...learningKeys.all, "exercise", userId] as const,
};
