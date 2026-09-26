const localStorageClearData = (): void => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userData");
};

export default localStorageClearData;
