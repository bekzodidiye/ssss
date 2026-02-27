
export const getUzTime = (date?: Date | string | number) => {
  const d = date ? new Date(date) : new Date();
  // Convert to Uzbekistan time string and parse it back to a Date object
  // This Date object's local time methods (getHours, etc.) will now return Uzbekistan values
  // Note: This is a common trick to "force" a timezone for calculations
  const uzStr = d.toLocaleString("en-US", { timeZone: "Asia/Tashkent" });
  return new Date(uzStr);
};

export const getTodayStr = () => {
  const uzDate = getUzTime();
  const y = uzDate.getFullYear();
  const m = String(uzDate.getMonth() + 1).padStart(2, '0');
  const d = String(uzDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isDateMatch = (timestamp: string, dateStr: string) => {
  if (!timestamp) return false;
  const uzDate = getUzTime(timestamp);
  const y = uzDate.getFullYear();
  const m = String(uzDate.getMonth() + 1).padStart(2, '0');
  const d = String(uzDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}` === dateStr;
};

export const getLatenessStatus = (checkInTimestamp: string, workingHours?: string) => {
  if (!workingHours || !workingHours.includes('-')) return null;
  
  try {
    const startTimePart = workingHours.split('-')[0].trim();
    const timeMatch = startTimePart.match(/(\d{1,2})[:.](\d{2})/);
    
    if (!timeMatch) return null;
    
    const startH = parseInt(timeMatch[1], 10);
    const startM = parseInt(timeMatch[2], 10);
    
    const uzDate = getUzTime(checkInTimestamp);
    if (isNaN(uzDate.getTime())) return null;

    const startTotalMinutes = startH * 60 + startM;
    const checkInTotalMinutes = uzDate.getHours() * 60 + uzDate.getMinutes();

    if (checkInTotalMinutes > startTotalMinutes) {
      const diff = checkInTotalMinutes - startTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      
      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;
      
      return {
        isLate: true,
        isEarly: false,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    } else if (checkInTotalMinutes < startTotalMinutes) {
      const diff = startTotalMinutes - checkInTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      
      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;

      return {
        isLate: false,
        isEarly: true,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const getEarlyDepartureStatus = (coTimestamp: string, workingHours?: string) => {
  if (!workingHours || !workingHours.includes('-')) return null;
  
  try {
    const endTimePart = workingHours.split('-')[1].trim();
    const timeMatch = endTimePart.match(/(\d{1,2})[:.](\d{2})/);
    
    if (!timeMatch) return null;
    
    const endH = parseInt(timeMatch[1], 10);
    const endM = parseInt(timeMatch[2], 10);
    
    const uzDate = getUzTime(coTimestamp);
    if (isNaN(uzDate.getTime())) return null;

    const endTotalMinutes = endH * 60 + endM;
    const coTotalMinutes = uzDate.getHours() * 60 + uzDate.getMinutes();

    if (coTotalMinutes < endTotalMinutes) {
      const diff = endTotalMinutes - coTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      
      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;
      
      return {
        isEarly: true,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};
