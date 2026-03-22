const TOKEN_KEY = "access_token";
const USER_ID_KEY = "user_id";

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUserId: () => localStorage.getItem(USER_ID_KEY),

  setSession: (token: string, userId: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, userId);
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};
