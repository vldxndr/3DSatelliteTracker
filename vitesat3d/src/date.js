export function updateDateTime() {
    const now = new Date();
    const dateTimeDiv = document.getElementById("date-time");
  
    dateTimeDiv.textContent = now.toLocaleString("en-GB", {
      timeZone: "Europe/Bucharest",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
}