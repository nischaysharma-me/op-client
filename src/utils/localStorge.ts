export interface UserData {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
}

export const isUserLoggedIn = (): boolean => {
  if (localStorage.getItem("userData") && localStorage.getItem("accessToken")) {
    return true;
  }
  return false;
};

export const clearCredentials = (): void => {
  localStorage.removeItem("userData");
  localStorage.removeItem("accessToken");
};

export const getAuthToken = (): string | null => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    return "Bearer " + token;
  }
  console.warn("No Token Available");
  return null;
};

export const getUser = (): UserData | null => {
  const data = localStorage.getItem("userData");
  if (!data) return null;
  try {
    return JSON.parse(data) as UserData;
  } catch (error) {
    return null;
  }
};
