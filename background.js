chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "quickLearnAI",
    title: "Define Selected Word",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "quickLearnAI") {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: getSelectedText,
      },
      (results) => {
        if (results && results[0]?.result) {
          const selectedWord = results[0].result.trim();
          fetchDefinition(selectedWord);
        } else {
          alert("Please select a word to define.");
        }
      }
    );
  }
});

function getSelectedText() {
  return window.getSelection().toString();
}

function fetchDefinition(word) {
  const dictionaryAPI = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  fetch(dictionaryAPI)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Word not found: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      const meanings = data[0]?.meanings
        .map((m) => `${m.partOfSpeech}: ${m.definitions[0].definition}`)
        .join("\n");
      alert(`Definition of "${word}":\n\n${meanings || "No definitions found."}`);
    })
    .catch((err) => {
      console.error("Dictionary API Error:", err);
      alert("Unable to fetch definition. Please try again.");
    });
}


