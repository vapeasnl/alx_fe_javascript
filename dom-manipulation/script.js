// Base URL for the mock API server (using JSONPlaceholder as an example)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Replace with your server endpoint

// Initialize quotes array with data from localStorage if available
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The only way to do great work is to love what you do.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", category: "Inspiration" }
];

// Function to save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to populate categories dynamically
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  const categories = [...new Set(quotes.map(quote => quote.category))];

  // Clear existing options and add "All Categories"
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  
  // Restore the last selected category if available
  const lastSelectedCategory = localStorage.getItem('selectedCategory');
  if (lastSelectedCategory) {
    categoryFilter.value = lastSelectedCategory;
  }
}

// Function to display quotes based on selected category
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory); // Save filter choice

  const filteredQuotes = selectedCategory === 'all'
    ? quotes
    : quotes.filter(quote => quote.category === selectedCategory);
  
  const quoteDisplay = document.getElementById('quoteDisplay');
  const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  
  quoteDisplay.innerHTML = `
    <p>"${randomQuote.text}"</p>
    <p><strong>Category:</strong> ${randomQuote.category}</p>
  `;
}

// Add quote and upload to server
function addQuote() {
  const quoteText = document.getElementById("newQuoteText").value;
  const quoteCategory = document.getElementById("newQuoteCategory").value;

  if (quoteText && quoteCategory) {
    const newQuote = { text: quoteText, category: quoteCategory };
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    filterQuotes();

    uploadQuoteToServer(newQuote);

    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    alert("Please enter both a quote and a category.");
  }
}

// Upload a quote to the server (simulation)
async function uploadQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
  } catch (error) {
    console.error("Failed to upload quote to server:", error);
  }
}

// Fetch data from server
async function fetchServerQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    const serverQuotes = await response.json();
    return serverQuotes.map(item => ({ text: item.body, category: "Server" })); // Adjust to fit quote structure
  } catch (error) {
    console.error("Failed to fetch quotes from server:", error);
    return [];
  }
}

// Conflict resolution: server data takes precedence
function resolveConflicts(localData, serverData) {
  const merged = [...serverData]; // Start with server data

  // Add unique local quotes that are not on the server
  localData.forEach(localQuote => {
    if (!serverData.some(serverQuote => serverQuote.text === localQuote.text)) {
      merged.push(localQuote);
    }
  });

  return merged;
}

// Sync with server and handle conflicts
async function syncQuotesWithServer() {
  const serverQuotes = await fetchServerQuotes();
  const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];
  const mergedQuotes = resolveConflicts(localQuotes, serverQuotes);

  localStorage.setItem("quotes", JSON.stringify(mergedQuotes));
  quotes = mergedQuotes;

  showNotification("Quotes synchronized with server. Conflicts resolved.");
  populateCategories();
  filterQuotes();
}

// Periodically sync with the server every 30 seconds
const SYNC_INTERVAL = 30000;
setInterval(syncQuotesWithServer, SYNC_INTERVAL);

// Display notifications in the UI
function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.style.display = "block";
  notification.textContent = message;
  setTimeout(() => {
    notification.style.display = "none";
  }, 5000); // Hide after 5 seconds
}

// Initial setup
window.onload = () => {
  populateCategories();
  filterQuotes();
};
//last
