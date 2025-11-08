const quotes = [
  {
    text: "Dream big. Start small. Act now.",
    translation: "크게 꿈꾸고, 작게 시작하며, 지금 행동하라.",
    author: "Robin Sharma",
    theme: "Action"
  },
  {
    text: "You don't have to be extreme, just consistent.",
    translation: "극단적일 필요는 없고, 꾸준하기만 하면 된다.",
    author: "Unknown",
    theme: "Consistency"
  },
  {
    text: "Make your vision so clear that your fears become irrelevant.",
    translation: "두려움이 의미 없어질 만큼 선명한 비전을 그려라.",
    author: "Unknown",
    theme: "Vision"
  },
  {
    text: "Discipline is choosing what you want most over what you want now.",
    translation: "규율이란 지금 원하는 것보다 가장 원하는 것을 선택하는 것이다.",
    author: "Craig Groeschel",
    theme: "Discipline"
  },
  {
    text: "Your future needs you, not your past.",
    translation: "미래는 과거가 아닌 지금의 당신을 필요로 한다.",
    author: "Unknown",
    theme: "Growth"
  },
  {
    text: "Energy flows where attention goes.",
    translation: "시선이 닿는 곳에 에너지가 흐른다.",
    author: "Tony Robbins",
    theme: "Focus"
  },
  {
    text: "Progress over perfection, always.",
    translation: "언제나 완벽함보다 진전을 우선하라.",
    author: "Unknown",
    theme: "Progress"
  },
  {
    text: "Your vibe attracts your tribe.",
    translation: "당신의 분위기가 당신의 사람들을 끌어당긴다.",
    author: "Unknown",
    theme: "Mindset"
  },
  {
    text: "Turn your can'ts into cans and your dreams into plans.",
    translation: "할 수 없다는 말을 할 수 있다는 말로 바꾸고, 꿈을 계획으로 만들어라.",
    author: "Unknown",
    theme: "Empower"
  },
  {
    text: "Small steps still move mountains.",
    translation: "작은 걸음도 결국 산을 옮긴다.",
    author: "Unknown",
    theme: "Momentum"
  },
  {
    text: "Stay patient and trust your journey.",
    translation: "인내하며 자신의 여정을 믿어라.",
    author: "Unknown",
    theme: "Journey"
  },
  {
    text: "One day or day one. You decide.",
    translation: "언젠가 할 것인가, 오늘을 첫날로 만들 것인가. 선택은 당신의 몫이다.",
    author: "Unknown",
    theme: "Decision"
  }
];

const themeElement = document.getElementById("quoteTheme");
const indexElement = document.getElementById("quoteIndex");
const totalElement = document.getElementById("quoteTotal");
const textElement = document.getElementById("quoteText");
const authorElement = document.getElementById("quoteAuthor");
const translationElement = document.getElementById("quoteTranslation");
const button = document.getElementById("generateButton");

totalElement.textContent = quotes.length.toString().padStart(2, "0");

let queue = shuffleQuotes();

function shuffleQuotes() {
  return [...quotes].sort(() => Math.random() - 0.5);
}

function updateQuoteCard(quote, index) {
  themeElement.textContent = quote.theme;
  indexElement.textContent = (index + 1).toString().padStart(2, "0");
  textElement.textContent = quote.text;
  authorElement.textContent = quote.author ? `— ${quote.author}` : "";
  translationElement.textContent = quote.translation;

  // animate subtle fade in
  const card = document.querySelector(".quote-card");
  card.classList.remove("quote-card--active");
  void card.offsetWidth; // trigger reflow
  card.classList.add("quote-card--active");
}

button.addEventListener("click", () => {
  if (queue.length === 0) {
    queue = shuffleQuotes();
  }

  const nextQuote = queue.shift();
  const displayIndex = quotes.indexOf(nextQuote);
  updateQuoteCard(nextQuote, displayIndex);
});

// allow Enter key for accessibility
button.addEventListener("keyup", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    button.click();
  }
});
