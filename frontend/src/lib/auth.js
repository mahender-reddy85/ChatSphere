export const getToken = () => localStorage.getItem("token");

export const setAuth = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));};

export const getUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
