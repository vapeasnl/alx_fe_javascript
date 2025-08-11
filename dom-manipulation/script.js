const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

let quotes = loadQuotes() || [
  { text: "The only limit is your mind.", category: "Motivation" },
  { text: "Life is short. Smile while you still have teeth.", category: "Humor" },
  { text: "To be or not to be.", category: "Philosophy" }
];

const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const quoteFormContainer = document.getElementById('quoteFormContainer');
const importFileInput = document.getElementById('importFile');
const exportBtn = document.getElementById('exportBtn');
const categoryFilter = document.getElementById('categoryFilter');


function createAddQuoteForm() {
  const quoteInput = document.createElement('input');
  quoteInput.type = 'text';
  quoteInput.id = 'newQuoteText';
  quoteInput.placeholder = 'Enter a new quote';

  const categoryInput = document.createElement('input');
  categoryInput.type = 'text';
  categoryInput.id = 'newQuoteCategory';
  categoryInput.placeholder = 'Enter quote category';

  const addButton = document.createElement('button');
  addButton.textContent = 'Add Quote';
  addButton.addEventListener('click', addQuote);

  quoteFormContainer.appendChild(quoteInput);
  quoteFormContainer.appendChild(categoryInput);
  quoteFormContainer.appendChild(addButton);
}

function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const lastFilter = localStorage.getItem('lastCategoryFilter') || 'all';
  categoryFilter.value = lastFilter;
}

function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes in this category.</p>";
    return;
  }

  const quote = filtered[Math.floor(Math.random() * filtered.length)];

  quoteDisplay.innerHTML = `
    <blockquote>"${quote.text}"</blockquote>
    <p><em>Category: ${quote.category}</em></p>
  `;

  sessionStorage.setItem('lastViewedQuote', quote.text);
}

function filterQuotes() {
  localStorage.setItem('lastCategoryFilter', categoryFilter.value);
  showRandomQuote();
}

function showNotification(message, isError = false) {
  const box = document.getElementById('notification');
  box.textContent = message;
  box.style.background = isError ? '#f2dede' : '#dff0d8';
  box.style.color = isError ? '#a94442' : '#3c763d';
  box.style.display = 'block';
  setTimeout(() => box.style.display = 'none', 3000);
}


function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function loadQuotes() {
  const data = localStorage.getItem('quotes');
  return data ? JSON.parse(data) : null;
}


async function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  alert("Quote added!");

  try {
    await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuote)
    });
    showNotification("Quotes synced with server!");
  } catch {
    showNotification("Quotes saved locally, server sync failed.", true);
  }

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}


function exportToJsonFile() {
  const jsonStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        quotes.push(...imported);
        quotes = deduplicateQuotes(quotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch {
      alert("Error parsing JSON.");
    }
  };
  reader.readAsText(file);
}

function deduplicateQuotes(list) {
  const seen = new Set();
  return list.filter(q => {
    const key = q.text.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch quotes from server:", error);
    return [];
  }
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const posts = await response.json();

    const serverQuotes = posts.slice(0, 10).map(post => ({
      text: post.title,
      category: "Server"
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Failed to fetch quotes from mock API:", error);
    return [];
  }
}


function mergeQuotes(serverData, localData) {
  const seen = new Set();
  const merged = [];

  for (const s of serverData) {
    merged.push(s);
    seen.add(s.text.trim().toLowerCase());
  }

  for (const l of localData) {
    const norm = l.text.trim().toLowerCase();
    if (!seen.has(norm)) {
      merged.push(l);
    }
  }

  return merged;
}

newQuoteButton.addEventListener('click', showRandomQuote);
categoryFilter.addEventListener('change', filterQuotes);
importFileInput.addEventListener('change', importFromJsonFile);
exportBtn.addEventListener('click', exportToJsonFile);

createAddQuoteForm();
populateCategories();
showRandomQuote();
syncWithServer(); 
setInterval(syncWithServer, 60000);
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const merged = mergeQuotes(serverQuotes, quotes);
  quotes = merged;
  saveQuotes();
  populateCategories();
  showNotification("Quotes synced from server.");
}
