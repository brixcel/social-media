/**
 * Content Filtering System
 * Handles profanity detection and content moderation
 */

// Prohibited words list
const prohibitedWords = [
  "bobo",
  "tanga",
  "gago",
  "inutil",
  "putangina",
  "punyeta",
  "ulol",
  "tarantado",
  "buwisit",
  "bwisit",
  "lintik",
  "kupal",
  "gunggong",
  "hinayupak",
  "hayop",
  "pota",
  "p0t4",
  "potae",
  "p0tae",
  "p0tah",
  "p0t4h",
  "engot",
  "ungas",
  "pokpok",
  "puta",
  "leche",
  "burat",
  "tite",
  "pekpek",
  "bilat",
  "kantot",
  "iyot",
  "stupid",
  "idiot",
  "dumb",
  "moron",
  "fool",
  "imbecile",
  "retard",
  "asshole",
  "bitch",
  "bastard",
  "damn",
  "shit",
  "fuck",
  "cunt",
  "dick",
  "pussy",
  "whore",
  "ass",
]

/**
 * Check text for profanity
 * @param {string} text - Text to check
 * @returns {Object} - Result object with isProfane flag and matches array
 */
function checkForProfanity(text) {
  if (!text || typeof text !== "string") {
    return { isProfane: false, matches: [] }
  }

  const lowerText = text.toLowerCase()
  const matches = []

  for (const word of prohibitedWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    const found = lowerText.match(regex)
    if (found) {
      matches.push(...found)
    }
  }

  return {
    isProfane: matches.length > 0,
    matches: [...new Set(matches)],
  }
}

/**
 * Show profanity warning modal
 * @param {Array} matches - Array of detected inappropriate words
 */
function showProfanityWarning(matches) {
  let modalElement = document.getElementById("profanity-warning-modal")

  if (!modalElement) {
    const modalHTML = `
      <div class="ursac-modal" id="profanity-warning-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div class="ursac-modal-content" style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
          <div class="ursac-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>Inappropriate Language Detected</h3>
            <button class="ursac-modal-close" id="close-profanity-modal" style="background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
          </div>
          <div class="ursac-modal-body" style="margin-bottom: 20px;">
            <p>Your message contains inappropriate language that violates our community guidelines.</p>
            <p>Please revise your message before sending.</p>
            <div id="profanity-details" class="ursac-profanity-details" style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; border-left: 3px solid #dc3545;"></div>
          </div>
          <div class="ursac-modal-footer" style="text-align: right;">
            <button class="ursac-button ursac-button-primary" id="acknowledge-profanity" style="background: #4a76a8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">I Understand</button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML("beforeend", modalHTML)
    modalElement = document.getElementById("profanity-warning-modal")
  }

  // Setup modal close functionality
  const closeModal = () => {
    modalElement.style.display = "none"
  }

  const closeButton = document.getElementById("close-profanity-modal")
  const acknowledgeButton = document.getElementById("acknowledge-profanity")

  if (closeButton) {
    closeButton.onclick = closeModal
  }

  if (acknowledgeButton) {
    acknowledgeButton.onclick = closeModal
  }

  // Close modal when clicking outside
  modalElement.onclick = (e) => {
    if (e.target === modalElement) {
      closeModal()
    }
  }

  // Display detected words
  const detailsElement = document.getElementById("profanity-details")
  if (detailsElement && matches && matches.length > 0) {
    detailsElement.innerHTML = `
      <p>Detected inappropriate words:</p>
      <ul style="margin: 5px 0 0 20px; padding: 0;">
        ${matches.map((word) => `<li style="color: #dc3545; font-weight: bold;">${word}</li>`).join("")}
      </ul>
    `
  }

  modalElement.style.display = "flex"
}

// Export functions to global scope
window.checkForProfanity = checkForProfanity
window.showProfanityWarning = showProfanityWarning
