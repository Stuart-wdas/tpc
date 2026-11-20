export const formatDate = (
  v: string,
  opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' },
) =>
  new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', ...opts }).format(
    new Date(v),
  );

export const formatTime = (v: string) =>
  formatDate(v, { hour: '2-digit', minute: '2-digit', hour12: false });
