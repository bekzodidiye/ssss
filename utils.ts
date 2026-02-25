
export const getTodayStr = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};
