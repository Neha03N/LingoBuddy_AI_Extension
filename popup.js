document.getElementById("summarize").addEventListener("click", () => processText("summarize"));
document.getElementById("rewrite").addEventListener("click", () => processText("rewrite"));
document.getElementById("define").addEventListener("click", () => processText("define"));

function processText(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => window.getSelection().toString(),
      },
      (results) => {
        if (results && results[0]?.result) {
          const selectedText = results[0].result.trim();
          if (selectedText) {
            if (action === "define") {
              fetchDefinition(selectedText);
            } else {
              callAPI(action, selectedText);
            }
          } else {
            alert("No text selected! Please select text on the page first.");
          }
        }
      }
    );
  });
}

function toggleLoading(show) {
  const loadingElement = document.getElementById("loading");
  loadingElement.style.display = show ? "block" : "none";
}


function callAPI(action, text) {
  const apiUrl = "https://api-inference.huggingface.co/models";
  const apiKey = "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"; 

  let model, payload;

  if (action === "summarize") {
    model = "facebook/bart-large-cnn";
    payload = { inputs: text };
  } else if (action === "rewrite") {
    model = "prithivida/parrot_paraphraser_on_T5";

    // Adjusting the max_length and min_length based on the original text size
    const originalLength = text.split(" ").length; 
    const minLength = Math.max(1, Math.floor(originalLength * 0.9)); 
    const maxLength = Math.ceil(originalLength * 1.1); 

    payload = {
      inputs: text,
      parameters: {
        do_sample: true,
        temperature: 0.7,
        top_k: 50,
        min_length: minLength,
        max_length: maxLength,
      },
    };
  }

  toggleLoading(true); 

  fetch(`${apiUrl}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      let result;
      if (action === "summarize") {
        result = data[0]?.summary_text || "No summary generated.";
      } else if (action === "rewrite") {
        result = data[0]?.generated_text || "No rewritten text generated.";
      }

      document.getElementById("output").textContent = result;

      
      showCopyButton(result);
    })
    .catch((err) => {
      console.error("API Error:", err);
      alert("Something went wrong! Check the console for details.");
    })
    .finally(() => {
      toggleLoading(false); 
    });
}

function fetchDefinition(word) {
  const dictionaryAPI = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

  toggleLoading(true); 

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

      document.getElementById("output").textContent = `Definition of "${word}":\n\n${meanings || "No definitions found."}`;
    })
    .catch((err) => {
      console.error("Dictionary API Error:", err);
      document.getElementById("output").textContent = "Unable to fetch definition. Please try again.";
    })
    .finally(() => {
      toggleLoading(false); 
    });
}


function showCopyButton(content) {
  const copyContainer = document.getElementById("copy-container");
  copyContainer.innerHTML = ""; 

  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy";
  copyButton.style.padding = "10px 20px";
  copyButton.style.cursor = "pointer";
  copyButton.style.fontSize = "16px";
  copyButton.style.border = "1px solid #ccc";
  copyButton.style.borderRadius = "5px";
  copyButton.style.backgroundColor = "#28a745";
  copyButton.style.color = "white";
  copyButton.style.marginTop = "10px";
  copyButton.style.transition = "background-color 0.3s";

  copyButton.addEventListener("mouseover", () => {
    copyButton.style.backgroundColor = "#218838";
  });
  copyButton.addEventListener("mouseout", () => {
    copyButton.style.backgroundColor = "#28a745";
  });

  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(content).then(() => {
      alert("Copied to clipboard!");
    });
  });

  copyContainer.appendChild(copyButton);
}


