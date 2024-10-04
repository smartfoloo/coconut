const currentHour = new Date().getHours();

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

const greetingElement = document.getElementById("greeting");
const greeting = getGreeting(currentHour);
greetingElement.textContent = greeting