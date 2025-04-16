
import { UserType } from "@/types/user";

export interface User {
  id?: string;
  email?: string;
  userType?: UserType;
}

export const getUserFromStorage = (): User | null => {
  const userJson = localStorage.getItem("user");
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const removeUserFromStorage = () => {
  localStorage.removeItem("user");
};
