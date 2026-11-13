// Единое хранилище access-токена для API-запросов.
// Токен живёт в памяти Redux (state.auth.accessToken) и дублируется сюда,
// чтобы axios-интерсепторы не зависели от циклического импорта store.
const KEY = 'accessToken';

export const setAccessToken = (token) => {
  if (token) localStorage.setItem(KEY, token);
  else localStorage.removeItem(KEY);
};

export const getAccessToken = () => localStorage.getItem(KEY);
