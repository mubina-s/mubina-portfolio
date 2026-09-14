import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';

const data = window.PORTFOLIO_KNOWLEDGE || [];
const chat = document.getElementById("aiChat");
const form = document.getElementById("aiForm");
const input = document.getElementById("aiInput");
const enableButton = document.getElementById("enableSemanticAI");
const status = document.getElementById("aiStatus");
const statusDot = document.getElementById("aiStatusDot");

let extractor = null;
let corpusVectors = null;
let semanticReady = false;
let loading = false;

function appendMessage(text, type="assistant", url=null) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;
  if (url && type === "assistant") {
    const br = document.createElement("br");
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url.startsWith("#") ? "View related section →" : "Open supporting link ↗";
    if (!url.startsWith("#")) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    div.append(br, a);
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function lexicalSearch(query) {
  const words = query.toLowerCase().split(/[^a-z0-9+#]+/).filter(w => w.length > 2);
  const scored = data.map(item => {
    const hay = `${item.title} ${item.text}`.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (hay.includes(word)) score += 1;
      if (item.title.toLowerCase().includes(word)) score += 1.3;
    }
    return {item, score};
  }).sort((a,b) => b.score-a.score);

  if (!scored.length || scored[0].score === 0) {
    return {
      item: {
        answer: "I couldn't find that in the public portfolio information I was given. Try asking about projects, cybersecurity tools, coursework, experience, technical skills, or career interests.",
        url: "#about"
      }
    };
  }
  return scored[0];
}

function dot(a,b) {
  let total = 0;
  for (let i=0; i<a.length; i++) total += a[i]*b[i];
  return total;
}

async function enableSemanticAI() {
  if (semanticReady || loading) return;
  loading = true;
  enableButton.disabled = true;
  statusDot.classList.add("loading");
  status.textContent = "Loading free local AI model… first use may take a moment";
  try {
    extractor = await pipeline(
      "feature-extraction",
      "onnx-community/all-MiniLM-L6-v2-ONNX",
      { dtype: "q4f16" }
    );
    const corpus = data.map(x => `${x.title}. ${x.text}`);
    const output = await extractor(corpus, { pooling: "mean", normalize: true });
    corpusVectors = output.tolist();
    semanticReady = true;
    statusDot.classList.remove("loading");
    status.textContent = "Local AI semantic search ready";
    enableButton.textContent = "Local AI enabled ✓";
    appendMessage("Local semantic AI is ready. The model runs in your browser and no portfolio question is sent to a paid AI API.");
  } catch (err) {
    console.error(err);
    statusDot.classList.remove("loading");
    status.textContent = "Local AI unavailable — fast portfolio search still works";
    enableButton.textContent = "Retry local AI";
    enableButton.disabled = false;
    appendMessage("The optional local AI model could not load in this browser, but the built-in portfolio search still works.");
  } finally {
    loading = false;
  }
}

async function semanticSearch(query) {
  const q = await extractor(query, { pooling: "mean", normalize: true });
  const vector = q.tolist()[0];
  let bestIndex = 0;
  let bestScore = -Infinity;
  corpusVectors.forEach((v, i) => {
    const s = dot(vector, v);
    if (s > bestScore) { bestScore = s; bestIndex = i; }
  });
  return {item: data[bestIndex], score: bestScore};
}

enableButton.addEventListener("click", enableSemanticAI);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  appendMessage(query, "user");
  input.value = "";
  input.disabled = true;

  try {
    const result = semanticReady ? await semanticSearch(query) : lexicalSearch(query);
    appendMessage(result.item.answer, "assistant", result.item.url);
  } catch (err) {
    console.error(err);
    const result = lexicalSearch(query);
    appendMessage(result.item.answer, "assistant", result.item.url);
  } finally {
    input.disabled = false;
    input.focus();
  }
});
