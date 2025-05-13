document.addEventListener("DOMContentLoaded", () => {
  // Firebase references
  const firebase = window.firebase
  const database = firebase.database()
  const storage = firebase.storage()

  // Profanity Filter - List of prohibited words (Filipino and English)
  const prohibitedWords = [
    // Filipino bad words
    "bobo",
    "tanga",
    "gago",
    "inutil",
    "putangina",
    "punyeta",
    "ulol",
    "tarantado",
    "buwisit",
    "lintik",
    "kupal",
    "gunggong",
    "hinayupak",
    "hayop",
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

    // English bad words
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
  ]

  // Profanity Filter - Check if text contains prohibited words
  function checkForProfanity(text) {
    if (!text || typeof text !== "string") {
      return { isProfane: false, matches: [] }
    }

    // Convert to lowercase for case-insensitive matching
    const lowerText = text.toLowerCase()

    // Find all matches
    const matches = []

    for (const word of prohibitedWords) {
      // Use regex to match whole words and embedded words
      const regex = new RegExp(`${word}`, "gi")
      const found = lowerText.match(regex)

      if (found) {
        matches.push(...found)
      }
    }

    return {
      isProfane: matches.length > 0,
      matches: [...new Set(matches)], // Remove duplicates
    }
  }

  // Profanity Filter - Show warning modal
  function showProfanityWarning(matches) {
    // Create modal if it doesn't exist
    let modalElement = document.getElementById("profanity-warning-modal")

    if (!modalElement) {
      const modalHTML = `
        <div class="ursac-modal" id="profanity-warning-modal">
          <div class="ursac-modal-content">
            <div class="ursac-modal-header">
              <h3>Inappropriate Language Detected</h3>
              <button class="ursac-modal-close" id="close-profanity-modal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="ursac-modal-body">
              <p>Your message contains inappropriate language that violates our community guidelines.</p>
              <p>Please revise your message before sending.</p>
              <div id="profanity-details" class="ursac-profanity-details" style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; border-left: 3px solid #dc3545;"></div>
            </div>
            <div class="ursac-modal-footer">
              <button class="ursac-button ursac-button-primary" id="acknowledge-profanity">I Understand</button>
            </div>
          </div>
        </div>
      `

      const modalContainer = document.createElement("div")
      modalContainer.innerHTML = modalHTML
      document.body.appendChild(modalContainer.firstElementChild)

      modalElement = document.getElementById("profanity-warning-modal")

      // Add event listeners
      document.getElementById("close-profanity-modal").addEventListener("click", () => {
        modalElement.style.display = "none"
      })

      document.getElementById("acknowledge-profanity").addEventListener("click", () => {
        modalElement.style.display = "none"
      })
    }

    // Update details
    const detailsElement = document.getElementById("profanity-details")
    if (detailsElement && matches && matches.length > 0) {
      detailsElement.innerHTML = `
        <p>Detected inappropriate words:</p>
        <ul style="margin: 5px 0 0 20px; padding: 0;">
          ${matches.map((word) => `<li style="color: #dc3545; font-weight: bold;">${word}</li>`).join("")}
        </ul>
      `
    }

    // Show modal
    modalElement.style.display = "flex"
  }

  // DOM Elements
  const conversationsList = document.getElementById("conversations-list")
  const conversationView = document.getElementById("conversation-view")
  const conversationDefault = document.getElementById("conversation-default")
  const conversationHeader = document.getElementById("conversation-header")
  const messagesArea = document.getElementById("messages-area")
  const messageInputArea = document.getElementById("message-input-area")
  const messageInput = document.getElementById("message-input")
  const messageSendBtn = document.getElementById("message-send-btn")
  const loadingConversations = document.getElementById("loading-conversations")
  const emptyConversations = document.getElementById("empty-conversations")
  const newMessageBtn = document.getElementById("new-message-btn")
  const newMessageBtnEmpty = document.getElementById("new-message-btn-empty")
  const newMessageBtnAlt = document.getElementById("new-message-btn-alt")
  const searchInput = document.getElementById("search-input")
  const newMessageModal = document.getElementById("new-message-modal")
  const closeNewMessageModal = document.getElementById("close-new-message-modal")
  const recipientSearch = document.getElementById("recipient-search")
  const recipientsList = document.getElementById("recipients-list")
  const newMessageText = document.getElementById("new-message-text")
  const sendNewMessage = document.getElementById("send-new-message")
  const cancelNewMessage = document.getElementById("cancel-new-message")
  const uploadModal = document.getElementById("upload-modal")
  const uploadProgress = document.getElementById("upload-progress")
  const uploadStatus = document.getElementById("upload-status")

  // Variables
  let currentUser = null
  let currentConversation = null
  let selectedRecipientId = null
  let conversations = []
  let users = []
  let messages = []
  let selectedAttachments = []
  let messagesListener = null
  let conversationsListener = null
  let lastSentMessageId = null // Track the last sent message to prevent duplication
  let userProfileBtn = null
  let profileDropdown = null
  let logoutBtn = null
  let addAccountBtn = null

  // Map to track unique conversations by participant
  const uniqueParticipantMap = new Map()

  // Function to initialize profile elements
  function initializeProfileElements() {
    userProfileBtn = document.getElementById("user-profile-btn")
    profileDropdown = document.getElementById("user-profile-dropdown")
    logoutBtn = document.getElementById("logout-btn")
    addAccountBtn = document.getElementById("add-account-btn")

    // Toggle profile dropdown
    if (userProfileBtn) {
      userProfileBtn.addEventListener("click", function (e) {
        e.stopPropagation()
        if (profileDropdown) {
          profileDropdown.classList.toggle("show")

          // Toggle chevron rotation
          const chevron = this.querySelector(".fa-chevron-down")
          if (chevron) {
            chevron.style.transform = profileDropdown.classList.contains("show") ? "rotate(180deg)" : "rotate(0deg)"
            chevron.style.transition = "transform 0.2s"
          }

          // Position the dropdown correctly
          if (profileDropdown.classList.contains("show")) {
            const buttonRect = userProfileBtn.getBoundingClientRect()
            profileDropdown.style.bottom = `${buttonRect.height + 5}px`
            profileDropdown.style.right = "0"
          }
        }
      })
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        profileDropdown &&
        !profileDropdown.contains(e.target) &&
        userProfileBtn &&
        !userProfileBtn.contains(e.target)
      ) {
        profileDropdown.classList.remove("show")
        const chevron = userProfileBtn?.querySelector(".fa-chevron-down")
        if (chevron) {
          chevron.style.transform = "rotate(0deg)"
        }
      }
    })

    // Setup logout button
    if (logoutBtn) {
      logoutBtn.innerHTML = `
      <i class="fas fa-sign-out-alt"></i>
      <span>Log out</span>
    `
      logoutBtn.addEventListener("click", () => {
        firebase
          .auth()
          .signOut()
          .then(() => {
            window.location.href = "/login"
          })
          .catch((error) => {
            console.error("Logout Error:", error)
          })
      })
    }

    // Setup add account button
    if (addAccountBtn) {
      addAccountBtn.innerHTML = `
      <i class="fas fa-user-plus"></i>
      <span>Add an existing account</span>
    `
      addAccountBtn.addEventListener("click", () => {
        firebase
          .auth()
          .signOut()
          .then(() => {
            sessionStorage.setItem("addingAccount", "true")
            window.location.href = "/login"
          })
      })
    }
  }

  // Initialize
  function init() {
    // Check if user is logged in
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        currentUser = user
        console.log("Authenticated as:", user.email)
        setupUserPresence(user)
        initializeProfileElements() // Initialize profile elements first
        loadUserProfile(user)
        loadConversations()
        setupMessageEventListeners() // Setup message event listeners

        // Set up profile update listener
        setupProfileUpdateListener()
      } else {
        console.log("No user authenticated, redirecting to login...")
        // For testing purposes only (remove in production):
        currentUser = {
          uid: "mockuser123",
          email: "test@example.com",
          displayName: "Test User",
        }
        initializeProfileElements() // Initialize profile elements here too
        loadUsers() // Load users for testing
        setupMessageEventListeners() // Setup message event listeners
        // Show empty state
        loadingConversations.style.display = "none"
        emptyConversations.style.display = "flex"
      }
    })
  }

  // Setup user presence system
  function setupUserPresence(user) {
    if (!user || !user.uid) {
      console.error("Cannot set up user presence: Invalid user")
      return
    }

    try {
      // Create a reference to this user's specific status node
      const userStatusRef = database.ref(`/status/${user.uid}`)

      const isOfflineForDatabase = {
        state: "offline",
        lastChanged: firebase.database.ServerValue.TIMESTAMP,
      }

      const isOnlineForDatabase = {
        state: "online",
        lastChanged: firebase.database.ServerValue.TIMESTAMP,
      }

      // Create a reference to the special '.info/connected' path
      database.ref(".info/connected").on("value", (snapshot) => {
        if (snapshot.val() === false) {
          return
        }

        userStatusRef
          .onDisconnect()
          .set(isOfflineForDatabase)
          .then(() => {
            userStatusRef.set(isOnlineForDatabase).catch((error) => {
              console.warn("Could not set online status:", error.message)
              // Continue anyway - this isn't critical
            })
          })
          .catch((error) => {
            console.warn("Error setting online status:", error.message)
            // Continue anyway - user presence isn't critical
          })
      })
    } catch (error) {
      console.error("Error in setupUserPresence:", error.message)
      // Continue anyway - user presence isn't critical
    }
  }

  // Load user profile
  function loadUserProfile(user) {
    if (!user) return

    database
      .ref("users/" + user.uid)
      .once("value")
      .then((snapshot) => {
        const userData = snapshot.val()

        // Update profile button
        const userProfileBtn = document.getElementById("user-profile-btn")
        if (userData && userProfileBtn) {
          const initials = getInitials(userData.firstName, userData.lastName)
          const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

          userProfileBtn.innerHTML = `
            <div class="ursac-profile-avatar">
              <span>${initials}</span>
            </div>
            <div class="ursac-profile-info">
              <div class="ursac-profile-name">${fullName}</div>
              <div class="ursac-profile-email">${user.email}</div>
            </div>
            <i class="fas fa-chevron-down"></i>
          `

          // Make sure the dropdown arrow is visible and clickable
          userProfileBtn.style.cursor = "pointer"
        }
      })
      .catch((error) => {
        console.error("Error loading user profile:", error)
      })
  }

  // Load conversations
  function loadConversations() {
    // Clear existing listener
    if (conversationsListener) {
      database.ref("conversations").off("value", conversationsListener)
    }

    // Show loading state
    loadingConversations.style.display = "flex"
    emptyConversations.style.display = "none"

    // Reset unique participant map
    uniqueParticipantMap.clear()

    // Listen for conversations where the current user is a participant
    conversationsListener = database.ref("conversations").on(
      "value",
      (snapshot) => {
        conversations = []

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const conversation = childSnapshot.val()
            conversation.id = childSnapshot.key

            // Check if current user is a participant
            if (
              conversation.participants &&
              (conversation.participants[currentUser.uid] || conversation.createdBy === currentUser.uid)
            ) {
              conversations.push(conversation)
            }
          })
        }

        // Sort conversations by last message timestamp (newest first)
        conversations.sort((a, b) => {
          const aTime = a.lastMessage ? a.lastMessage.timestamp : a.createdAt
          const bTime = b.lastMessage ? b.lastMessage.timestamp : b.createdAt
          return bTime - aTime
        })

        // Render conversations
        renderConversations()

        // If we have conversations, select the first one
        if (conversations.length > 0 && !currentConversation) {
          const firstConversation = conversations[0]
          const otherParticipantId = Object.keys(firstConversation.participants || {}).find(
            (id) => id !== currentUser.uid,
          )
          selectConversation(firstConversation.id, otherParticipantId)
        }
      },
      (error) => {
        console.error("Error loading conversations:", error)
        // Show empty state on error
        loadingConversations.style.display = "none"
        emptyConversations.style.display = "flex"
      },
    )
  }

  // Render conversations list
  function renderConversations() {
    // Hide loading state
    loadingConversations.style.display = "none"

    // Clear conversation list but preserve the new message button
    const newConversationButton = conversationsList.querySelector(".ursac-new-conversation-button")
    conversationsList.innerHTML = ""

    // Add back the new conversation button
    if (newConversationButton) {
      conversationsList.appendChild(newConversationButton)
    } else {
      // Create the button if it doesn't exist
      const buttonDiv = document.createElement("div")
      buttonDiv.className = "ursac-new-conversation-button"
      buttonDiv.innerHTML = `
      <button class="ursac-new-message-btn" id="new-message-btn">
        <i class="fas fa-plus"></i> New Message
      </button>
    `
      conversationsList.appendChild(buttonDiv)

      // Add event listener to the new button
      document.getElementById("new-message-btn").addEventListener("click", openNewMessageModal)
    }

    if (conversations.length === 0) {
      emptyConversations.style.display = "flex"
      return
    }

    emptyConversations.style.display = "none"

    // Clear the unique participant map before processing
    uniqueParticipantMap.clear()

    // First pass: Group conversations by participant and find the most recent one
    conversations.forEach((conversation) => {
      // Get the other participant's ID (for 1:1 conversations)
      const otherParticipantId = Object.keys(conversation.participants || {}).find((id) => id !== currentUser.uid)

      if (!otherParticipantId) return

      // Get the timestamp for this conversation
      const timestamp = conversation.lastMessage ? conversation.lastMessage.timestamp : conversation.createdAt

      // If we already have a conversation with this participant, check which one is newer
      if (uniqueParticipantMap.has(otherParticipantId)) {
        const existingConv = uniqueParticipantMap.get(otherParticipantId)
        const existingTime = existingConv.lastMessage ? existingConv.lastMessage.timestamp : existingConv.createdAt

        // Only replace if this conversation is newer
        if (timestamp > existingTime) {
          uniqueParticipantMap.set(otherParticipantId, conversation)
        }
      } else {
        // First conversation with this participant
        uniqueParticipantMap.set(otherParticipantId, conversation)
      }
    })

    // Convert map back to array and sort by timestamp
    const uniqueConversations = Array.from(uniqueParticipantMap.values())
    uniqueConversations.sort((a, b) => {
      const aTime = a.lastMessage ? a.lastMessage.timestamp : a.createdAt
      const bTime = b.lastMessage ? b.lastMessage.timestamp : b.createdAt
      return bTime - aTime
    })

    // Render each unique conversation
    uniqueConversations.forEach((conversation) => {
      // Get the other participant's ID (for 1:1 conversations)
      const otherParticipantId = Object.keys(conversation.participants || {}).find((id) => id !== currentUser.uid)

      if (!otherParticipantId) return

      // Get user data for the other participant
      getUserData(otherParticipantId)
        .then((userData) => {
          const userInitials = getInitials(userData.firstName, userData.lastName)
          const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
          const lastMessage = conversation.lastMessage || {}
          const unreadCount = (conversation.unreadCount && conversation.unreadCount[currentUser.uid]) || 0

          // Format last message time
          const lastMessageTime = lastMessage.timestamp ? formatTimeAgo(new Date(lastMessage.timestamp)) : ""

          // Format last message text
          let lastMessageText = lastMessage.text || ""
          if (lastMessage.mediaURL) {
            if (lastMessage.mediaType === "image") {
              lastMessageText = "📷 Photo"
            } else if (lastMessage.mediaType === "video") {
              lastMessageText = "🎥 Video"
            } else if (lastMessage.mediaType === "file") {
              lastMessageText = "📎 File: " + (lastMessage.mediaName || "Attachment")
            }
          }

          // Create conversation item
          const conversationItem = document.createElement("div")
          conversationItem.className = "ursac-conversation-item"
          if (conversation.id === currentConversation) {
            conversationItem.classList.add("active")
          }
          conversationItem.setAttribute("data-conversation-id", conversation.id)
          conversationItem.setAttribute("data-user-id", otherParticipantId)

          // Set conversation item HTML
          conversationItem.innerHTML = `
          <div class="ursac-conversation-avatar">
            <span>${userInitials}</span>
          </div>
          <div class="ursac-conversation-info">
            <div class="ursac-conversation-name">${userName}</div>
            <div class="ursac-conversation-message">${lastMessageText}</div>
          </div>
          ${unreadCount > 0 ? `<div class="ursac-conversation-unread-badge">${unreadCount}</div>` : ""}
        `

          // Add click event listener
          conversationItem.addEventListener("click", () => {
            selectConversation(conversation.id, otherParticipantId)
          })

          // Add to conversation list
          conversationsList.appendChild(conversationItem)
        })
        .catch((error) => {
          console.error("Error rendering conversation:", error)
        })
    })
  }

  // Select a conversation
  function selectConversation(conversationId, userId) {
    // Remove active class from all conversation items
    document.querySelectorAll(".ursac-conversation-item").forEach((item) => {
      item.classList.remove("active")
    })

    // Add active class to selected conversation item
    const selectedItem = document.querySelector(`.ursac-conversation-item[data-conversation-id="${conversationId}"]`)
    if (selectedItem) {
      selectedItem.classList.add("active")
    }

    // Set current conversation and user
    currentConversation = conversationId
    selectedRecipientId = userId

    // Show conversation view and hide default view
    conversationDefault.style.display = "none"
    conversationHeader.style.display = "flex"
    messagesArea.style.display = "block"
    messageInputArea.style.display = "flex"

    // Load user data
    getUserData(userId)
      .then((userData) => {
        // Set conversation header
        const userInitials = getInitials(userData.firstName, userData.lastName)
        const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

        document.getElementById("conversation-avatar-text").textContent = userInitials
        document.getElementById("conversation-name").textContent = userName

        // Check user status
        checkUserStatus(userId)
          .then((isOnline) => {
            document.getElementById("conversation-status").textContent = isOnline ? "Online" : "Offline"
          })
          .catch((error) => {
            console.error("Error checking user status:", error)
            document.getElementById("conversation-status").textContent = "Offline"
          })
      })
      .catch((error) => {
        console.error("Error loading user data:", error)
      })

    // Load messages
    loadMessages(conversationId)

    // Mark conversation as read
    markConversationAsRead(conversationId)
  }

  // Load messages for a conversation
  function loadMessages(conversationId) {
    // Clear existing listener
    if (messagesListener) {
      database.ref(`messages/${conversationId}`).off("value", messagesListener)
    }

    // Show loading spinner
    messagesArea.innerHTML = `
      <div class="ursac-loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading messages...</p>
      </div>
    `

    // Listen for messages in this conversation
    messagesListener = database.ref(`messages/${conversationId}`).on(
      "value",
      (snapshot) => {
        messages = []

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val()
            message.id = childSnapshot.key
            messages.push(message)
          })
        }

        // Sort messages by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp)

        renderMessages()
      },
      (error) => {
        console.error("Error loading messages:", error)
        messagesArea.innerHTML = `
        <div class="ursac-empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Failed to load messages. Please try again.</p>
        </div>
      `
      },
    )
  }

  // Update the renderMessages function to prevent duplicates
  function renderMessages() {
    if (messages.length === 0) {
      messagesArea.innerHTML = `
      <div class="ursac-empty-state">
        <i class="fas fa-comment-dots"></i>
        <p>No messages yet. Start the conversation!</p>
      </div>
    `
      return
    }

    // Clear messages container
    messagesArea.innerHTML = ""

    // Create a Set to track message IDs we've already rendered
    const renderedMessageIds = new Set()

    // Group messages by date
    const messagesByDate = groupMessagesByDate(messages)

    // Render each date group
    Object.keys(messagesByDate).forEach((date) => {
      // Add date separator
      const dateSeparator = document.createElement("div")
      dateSeparator.className = "ursac-message-date"
      dateSeparator.textContent = date
      messagesArea.appendChild(dateSeparator)

      // Render messages for this date
      messagesByDate[date].forEach((message) => {
        // Skip if we've already rendered this message
        if (renderedMessageIds.has(message.id)) {
          return
        }

        renderedMessageIds.add(message.id)
        const messageEl = renderMessage(message)
        messagesArea.appendChild(messageEl)
      })
    })

    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight
  }

  // Send a message
  function sendMessage() {
    const text = messageInput.value.trim()

    if (!text && selectedAttachments.length === 0) {
      return
    }

    // Check for profanity before sending
    if (text) {
      const profanityResult = checkForProfanity(text)
      if (profanityResult.isProfane) {
        showProfanityWarning(profanityResult.matches)
        return
      }
    }

    // Disable send button while sending
    messageSendBtn.disabled = true

    if (selectedAttachments.length > 0) {
      // Show upload modal
      uploadModal.style.display = "flex"
      uploadProgress.style.width = "0%"
      uploadStatus.textContent = "0%"

      // Upload the attachment
      uploadAttachment(selectedAttachments[0])
        .then((mediaData) => {
          // Create message with media
          createMessage(text, mediaData)

          // Clear input and attachments
          messageInput.value = ""
          selectedAttachments = []

          // Hide upload modal
          uploadModal.style.display = "none"

          // Enable send button
          messageSendBtn.disabled = false
        })
        .catch((error) => {
          console.error("Error uploading attachment:", error)
          showModal("Upload Failed", "Failed to upload attachment. Please try again.")

          // Hide upload modal
          uploadModal.style.display = "none"

          // Enable send button
          messageSendBtn.disabled = false
        })
    } else {
      // Create message without media
      createMessage(text)

      // Clear input
      messageInput.value = ""

      // Enable send button
      messageSendBtn.disabled = false
    }
  }

  // Create a new message
  function createMessage(text, mediaData = null) {
    if (!currentConversation || !currentUser) return

    // Generate a unique ID for this message to prevent duplicates
    const uniqueId = Date.now() + Math.random().toString(36).substring(2, 15)

    // Check if this is a duplicate message (prevent double-sending)
    if (lastSentMessageId === uniqueId) {
      console.log("Preventing duplicate message send")
      return
    }

    lastSentMessageId = uniqueId

    const messageRef = database.ref(`messages/${currentConversation}`).push()
    const messageId = messageRef.key

    const message = {
      senderId: currentUser.uid,
      text: text,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      read: false,
      uniqueId: uniqueId, // Add a unique ID to each message
    }

    // Add media data if available
    if (mediaData) {
      message.mediaURL = mediaData.url
      message.mediaType = mediaData.type
      message.mediaName = mediaData.name
      message.mediaSize = mediaData.size
    }

    // Save message
    messageRef
      .set(message)
      .then(() => {
        // Update conversation last message
        database
          .ref(`conversations/${currentConversation}`)
          .update({
            lastMessage: {
              text: text,
              senderId: currentUser.uid,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              mediaURL: mediaData ? mediaData.url : null,
              mediaType: mediaData ? mediaData.type : null,
              mediaName: mediaData ? mediaData.name : null,
            },
          })
          .catch((error) => {
            console.error("Error updating conversation last message:", error)
          })

        // Increment unread count for the other user
        const updates = {}
        updates[`conversations/${currentConversation}/unreadCount/${selectedRecipientId}`] =
          firebase.database.ServerValue.increment(1)
        database
          .ref()
          .update(updates)
          .catch((error) => {
            console.error("Error updating unread count:", error)
          })

        // Create notification for the recipient
        createMessageNotification(selectedRecipientId, text, currentConversation, messageId)
      })
      .catch((error) => {
        console.error("Error creating message:", error)
        showModal("Message Failed", "Failed to send message. Please try again.")
      })
  }

  // Create a notification for a new message
  function createMessageNotification(recipientId, messageText, conversationId, messageId) {
    if (!recipientId || !currentUser) return

    getUserData(currentUser.uid)
      .then((userData) => {
        const senderName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

        // Create notification in the recipient's notifications list
        const notificationRef = database.ref(`notifications/${recipientId}`).push()

        const notification = {
          type: "message",
          userId: currentUser.uid,
          conversationId: conversationId,
          messageId: messageId, // Store the specific message ID
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          read: false,
          commentText: messageText, // Using commentText field for message preview
          senderName: senderName,
        }

        notificationRef.set(notification).catch((error) => {
          console.error("Error creating message notification:", error)
        })
      })
      .catch((error) => {
        console.error("Error getting user data for notification:", error)
      })
  }

  // Create a new conversation
  function createConversation(recipientId, initialMessage) {
    return new Promise((resolve, reject) => {
      if (!currentUser || !currentUser.uid) {
        reject(new Error("You must be logged in to create a conversation"))
        return
      }

      if (!recipientId) {
        reject(new Error("No recipient selected"))
        return
      }

      // Check for profanity in initial message
      if (initialMessage && initialMessage.trim() !== "") {
        const profanityResult = checkForProfanity(initialMessage)
        if (profanityResult.isProfane) {
          showProfanityWarning(profanityResult.matches)
          reject(new Error("Message contains inappropriate language"))
          return
        }
      }

      console.log("Creating conversation with recipient:", recipientId)

      // Check if conversation already exists
      const existingConversation = conversations.find((conv) => {
        return conv.participants && conv.participants[recipientId] && conv.participants[currentUser.uid]
      })

      if (existingConversation) {
        console.log("Found existing conversation:", existingConversation.id)
        // If conversation exists, just return its ID
        if (initialMessage && initialMessage.trim() !== "") {
          // Send the initial message to the existing conversation
          try {
            const messageRef = database.ref(`messages/${existingConversation.id}`).push()

            const message = {
              senderId: currentUser.uid,
              text: initialMessage,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              read: false,
            }

            messageRef
              .set(message)
              .then(() => {
                // Update conversation last message
                return database.ref(`conversations/${existingConversation.id}`).update({
                  lastMessage: {
                    text: initialMessage,
                    senderId: currentUser.uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                  },
                })
              })
              .then(() => {
                // Increment unread count for the recipient
                const updates = {}
                updates[`conversations/${existingConversation.id}/unreadCount/${recipientId}`] =
                  firebase.database.ServerValue.increment(1)
                return database.ref().update(updates)
              })
              .then(() => {
                // Create notification for the recipient
                const messageId = messageRef.key
                createMessageNotification(recipientId, initialMessage, existingConversation.id, messageId)
                resolve(existingConversation.id)
              })
              .catch((error) => {
                console.error("Error sending message to existing conversation:", error)
                // Resolve anyway to allow conversation to continue
                resolve(existingConversation.id)
              })
          } catch (error) {
            console.error("Error in existing conversation flow:", error)
            resolve(existingConversation.id)
          }
        } else {
          resolve(existingConversation.id)
        }
        return
      }

      // Create a new conversation
      console.log("Creating new conversation with recipient:", recipientId)
      try {
        const conversationRef = database.ref("conversations").push()

        const participants = {}
        participants[currentUser.uid] = true
        participants[recipientId] = true

        const conversation = {
          createdBy: currentUser.uid,
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          participants: participants,
          unreadCount: {},
        }

        conversation.unreadCount[recipientId] = 0
        conversation.unreadCount[currentUser.uid] = 0

        conversationRef
          .set(conversation)
          .then(() => {
            const conversationId = conversationRef.key
            console.log("Created new conversation with ID:", conversationId)

            // If we have an initial message, send it
            if (initialMessage && initialMessage.trim() !== "") {
              console.log("Sending initial message:", initialMessage)
              const messageRef = database.ref(`messages/${conversationId}`).push()

              const message = {
                senderId: currentUser.uid,
                text: initialMessage,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                read: false,
              }

              return messageRef.set(message).then(() => {
                // Update conversation last message
                return database
                  .ref(`conversations/${conversationId}`)
                  .update({
                    lastMessage: {
                      text: initialMessage,
                      senderId: currentUser.uid,
                      timestamp: firebase.database.ServerValue.TIMESTAMP,
                    },
                  })
                  .then(() => {
                    // Increment unread count for the recipient
                    const updates = {}
                    updates[`conversations/${conversationId}/unreadCount/${recipientId}`] = 1
                    return database
                      .ref()
                      .update(updates)
                      .then(() => {
                        // Create notification for the recipient
                        const messageId = messageRef.key
                        createMessageNotification(recipientId, initialMessage, conversationId, messageId)
                        return conversationId
                      })
                  })
              })
            }

            return conversationId
          })
          .then((conversationId) => {
            console.log("Successfully created conversation:", conversationId)
            resolve(conversationId)
          })
          .catch((error) => {
            console.error("Error creating conversation:", error)
            reject(error)
          })
      } catch (error) {
        console.error("Exception in createConversation:", error)
        reject(error)
      }
    })
  }

  // Mark conversation as read
  function markConversationAsRead(conversationId) {
    const updates = {}
    updates[`conversations/${conversationId}/unreadCount/${currentUser.uid}`] = 0
    database
      .ref()
      .update(updates)
      .catch((error) => {
        console.error("Error marking conversation as read:", error)
      })

    // Mark all messages as read
    database
      .ref(`messages/${conversationId}`)
      .once("value", (snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val()

            if (message.senderId !== currentUser.uid && !message.read) {
              database
                .ref(`messages/${conversationId}/${childSnapshot.key}`)
                .update({
                  read: true,
                })
                .catch((error) => {
                  console.error("Error marking message as read:", error)
                })
            }
          })
        }
      })
      .catch((error) => {
        console.error("Error getting messages to mark as read:", error)
      })
  }

  // Upload an attachment
  function uploadAttachment(file) {
    return new Promise((resolve, reject) => {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        reject(new Error(`File size exceeds the maximum allowed (10MB)`))
        return
      }

      // Show upload modal with initial state
      uploadModal.style.display = "flex"
      uploadProgress.style.width = "0%"
      uploadStatus.textContent = "0%"

      // Determine file type based on MIME type and extension
      const fileExtension = file.name.split(".").pop().toLowerCase()
      let fileType

      if (file.type.startsWith("image/") || fileExtension === "gif") {
        fileType = "image"
      } else if (file.type.startsWith("video/")) {
        fileType = "video"
      } else {
        fileType = "file"
      }

      // For images, use ImgBB API
      if (fileType === "image") {
        // First, convert the file to base64
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const base64data = reader.result.split(",")[1]

          // Get ImgBB API key
          const apiKey = "fa517d5bab87e31f661cb28d7de365ba" // Using the ImgBB API key

          // Create form data for the API request
          const formData = new FormData()
          formData.append("image", base64data)

          // Update progress to show we're starting the upload
          if (uploadProgress) uploadProgress.style.width = "10%"
          if (uploadStatus) uploadStatus.textContent = "Uploading to ImgBB..."

          // Make the API request to ImgBB
          fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData,
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`ImgBB API error: ${response.status}`)
              }
              return response.json()
            })
            .then((data) => {
              // Update progress to show completion
              if (uploadProgress) uploadProgress.style.width = "100%"
              if (uploadStatus) uploadStatus.textContent = "Upload complete!"

              // Store image metadata (without using Firestore FieldValue)
              const timestamp = Date.now()

              // Add to Firestore images collection if Firestore is available
              if (firebase.firestore) {
                const imageData = {
                  url: data.data.url,
                  display_url: data.data.display_url,
                  delete_url: data.data.delete_url,
                  timestamp: timestamp,
                }

                firebase
                  .firestore()
                  .collection("images")
                  .add(imageData)
                  .then((docRef) => {
                    console.log("Image URL saved to Firestore with ID:", docRef.id)
                  })
                  .catch((error) => {
                    console.error("Error saving image URL to Firestore:", error)
                  })
              } else {
                console.log("Firestore not available, skipping image metadata storage")
              }

              // Resolve with media data
              resolve({
                url: data.data.url,
                type: "image",
                name: file.name,
                size: formatFileSize(file.size),
              })
            })
            .catch((error) => {
              console.error("ImgBB upload failed:", error)
              if (uploadModal) uploadModal.style.display = "none"
              reject(error)
            })
        }

        reader.onerror = (error) => {
          console.error("Error reading file:", error)
          if (uploadModal) uploadModal.style.display = "none"
          reject(error)
        }
      } else {
        // For non-image files, use Firebase Storage
        // Create storage reference
        const storageRef = storage.ref()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

        // Choose appropriate folder based on file type
        let fileRef
        if (fileType === "video") {
          fileRef = storageRef.child(`messages/videos/${fileName}`)
        } else {
          fileRef = storageRef.child(`messages/files/${fileName}`)
        }

        // Set metadata with CORS settings
        const metadata = {
          contentType: file.type,
          customMetadata: {
            "Access-Control-Allow-Origin": "*",
          },
        }

        // Upload the file with metadata
        const uploadTask = fileRef.put(file, metadata)

        // Monitor upload progress
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            uploadProgress.style.width = progress + "%"
            uploadStatus.textContent = Math.round(progress) + "%"
          },
          (error) => {
            console.error("Upload error:", error)
            reject(error)
          },
          () => {
            // Upload completed successfully
            uploadTask.snapshot.ref
              .getDownloadURL()
              .then((downloadURL) => {
                resolve({
                  url: downloadURL,
                  type: fileType,
                  name: file.name,
                  size: formatFileSize(file.size),
                })
              })
              .catch((error) => {
                console.error("Error getting download URL:", error)
                reject(error)
              })
          },
        )
      }
    })
  }

  // Load users for new conversation modal
  function loadUsers() {
    database
      .ref("users")
      .once("value", (snapshot) => {
        users = []

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val()
            user.id = childSnapshot.key

            // Don't include current user
            if (user.id !== currentUser.uid) {
              users.push(user)
            }
          })
        } else {
          // For testing, create some mock users if no users exist
          users = [
            { id: "user1", firstName: "John", lastName: "Doe" },
            { id: "user2", firstName: "Jane", lastName: "Smith" },
            { id: "user3", firstName: "Bob", lastName: "Johnson" },
            { id: "user4", firstName: "Alice", lastName: "Williams" },
          ]
        }

        renderRecipientsList(users)
      })
      .catch((error) => {
        console.error("Error loading users:", error)
        // For testing, create some mock users if loading fails
        users = [
          { id: "user1", firstName: "John", lastName: "Doe" },
          { id: "user2", firstName: "Jane", lastName: "Smith" },
          { id: "user3", firstName: "Bob", lastName: "Johnson" },
          { id: "user4", firstName: "Alice", lastName: "Williams" },
        ]
        renderRecipientsList(users)
      })
  }

  // Render recipients list
  function renderRecipientsList(usersList) {
    if (usersList.length === 0) {
      recipientsList.innerHTML = `
        <div class="ursac-empty-state">
          <p>No users found</p>
        </div>
      `
      return
    }

    let html = ""

    usersList.forEach((user) => {
      const userInitials = getInitials(user.firstName, user.lastName)
      const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim()

      html += `
        <div class="ursac-recipient-item" data-user-id="${user.id}">
          <div class="ursac-recipient-avatar">
            <span>${userInitials}</span>
          </div>
          <div class="ursac-recipient-info">
            <div class="ursac-recipient-name">${userName}</div>
          </div>
        </div>
      `
    })

    recipientsList.innerHTML = html

    // Add click event listeners to recipient items
    document.querySelectorAll(".ursac-recipient-item").forEach((item) => {
      item.addEventListener("click", function () {
        // Remove selected class from all items
        document.querySelectorAll(".ursac-recipient-item").forEach((el) => {
          el.classList.remove("selected")
        })

        // Add selected class to this item
        this.classList.add("selected")

        // Set selected recipient
        selectedRecipientId = this.getAttribute("data-user-id")
      })
    })
  }

  // Setup message event listeners
  function setupMessageEventListeners() {
    // Send message on button click
    if (messageSendBtn) {
      messageSendBtn.addEventListener("click", sendMessage)
    }

    // Send message on Enter key (but allow Shift+Enter for new line)
    if (messageInput) {
      messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          sendMessage()
        }
      })

      // Enable/disable send button based on input
      messageInput.addEventListener("input", () => {
        messageSendBtn.disabled = messageInput.value.trim() === "" && selectedAttachments.length === 0
      })
    }

    // Open new message modal
    if (newMessageBtn) {
      newMessageBtn.addEventListener("click", openNewMessageModal)
    }

    if (newMessageBtnEmpty) {
      newMessageBtnEmpty.addEventListener("click", openNewMessageModal)
    }

    if (newMessageBtnAlt) {
      newMessageBtnAlt.addEventListener("click", openNewMessageModal)
    }

    // Close new message modal
    if (closeNewMessageModal) {
      closeNewMessageModal.addEventListener("click", () => {
        newMessageModal.style.display = "none"
      })
    }

    // Search conversations
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase()

        if (searchTerm === "") {
          renderConversations()
          return
        }

        // Filter conversations based on search term
        const filteredConversations = conversations.filter((conversation) => {
          // Get the other participant's ID
          const otherParticipantId = Object.keys(conversation.participants || {}).find((id) => id !== currentUser.uid)

          // Get user data for the other participant
          return getUserData(otherParticipantId).then((userData) => {
            const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim().toLowerCase()
            return userName.includes(searchTerm)
          })
        })

        // Render filtered conversations
        renderConversations(filteredConversations)
      })
    }

    // Search recipients
    if (recipientSearch) {
      recipientSearch.addEventListener("input", () => {
        const searchTerm = recipientSearch.value.toLowerCase()

        if (searchTerm === "") {
          renderRecipientsList(users)
          return
        }

        // Filter users based on search term
        const filteredUsers = users.filter((user) => {
          const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase()
          return userName.includes(searchTerm)
        })

        renderRecipientsList(filteredUsers)
      })
    }

    // Send new message
    if (sendNewMessage) {
      sendNewMessage.addEventListener("click", () => {
        if (!selectedRecipientId) {
          showModal("Recipient Required", "Please select a recipient")
          return
        }

        const messageText = newMessageText ? newMessageText.value.trim() : ""

        console.log("Sending new message to recipient:", selectedRecipientId)
        console.log("Message text:", messageText)

        // Create new conversation with initial message
        createConversation(selectedRecipientId, messageText)
          .then((conversationId) => {
            console.log("Conversation created successfully:", conversationId)

            // Close modal
            if (newMessageModal) {
              newMessageModal.style.display = "none"
            }

            // Reset form
            if (newMessageText) {
              newMessageText.value = ""
            }

            // Select the new conversation
            selectConversation(conversationId, selectedRecipientId)
          })
          .catch((error) => {
            console.error("Error creating conversation:", error)
            showModal("Conversation Failed", "Failed to create conversation. Please try again.")
          })
      })
    }

    // Cancel new message
    if (cancelNewMessage) {
      cancelNewMessage.addEventListener("click", () => {
        if (newMessageModal) {
          newMessageModal.style.display = "none"
        }
        selectedRecipientId = null
        if (newMessageText) {
          newMessageText.value = ""
        }
      })
    }

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
      if (newMessageModal && e.target === newMessageModal) {
        newMessageModal.style.display = "none"
      }

      if (uploadModal && e.target === uploadModal) {
        uploadModal.style.display = "none"
      }
    })

    // Attachment buttons
    const attachmentBtn = document.querySelector(".ursac-message-attachment-btn")
    const mediaBtn = document.querySelector(".ursac-message-media-btn")

    if (attachmentBtn) {
      attachmentBtn.addEventListener("click", () => {
        // Create a file input element
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
        fileInput.style.display = "none"
        document.body.appendChild(fileInput)

        fileInput.addEventListener("change", () => {
          if (fileInput.files.length > 0) {
            selectedAttachments = [fileInput.files[0]]
            messageSendBtn.disabled = false
            sendMessage()
          }
          document.body.removeChild(fileInput)
        })

        fileInput.click()
      })
    }

    if (mediaBtn) {
      mediaBtn.addEventListener("click", () => {
        // Create a file input element
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "image/*,video/*,.gif"
        fileInput.style.display = "none"
        document.body.appendChild(fileInput)

        fileInput.addEventListener("change", () => {
          if (fileInput.files.length > 0) {
            selectedAttachments = [fileInput.files[0]]
            messageSendBtn.disabled = false
            sendMessage()
          }
          document.body.removeChild(fileInput)
        })

        fileInput.click()
      })
    }

    // Add drag and drop support for file uploads
    const dropArea = messagesArea
    if (dropArea) {
      // Prevent default behavior (prevent file from being opened)
      ;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropArea.addEventListener(eventName, preventDefaults, false)
      })

      function preventDefaults(e) {
        e.preventDefault()
        e.stopPropagation()
      }
      // Highlight drop area when item is dragged over it
      ;["dragenter", "dragover"].forEach((eventName) => {
        dropArea.addEventListener(eventName, highlight, false)
      })
      ;["dragleave", "drop"].forEach((eventName) => {
        dropArea.addEventListener(eventName, unhighlight, false)
      })

      function highlight() {
        dropArea.classList.add("ursac-highlight-drop")
      }

      function unhighlight() {
        dropArea.classList.remove("ursac-highlight-drop")
      }

      // Handle dropped files
      dropArea.addEventListener("drop", handleDrop, false)

      function handleDrop(e) {
        const dt = e.dataTransfer
        const files = dt.files

        if (files.length > 0) {
          selectedAttachments = [files[0]]
          messageSendBtn.disabled = false
          sendMessage()
        }
      }
    }
  }

  // Open new message modal
  function openNewMessageModal() {
    // Load users
    loadUsers()

    // Reset form
    selectedRecipientId = null
    if (newMessageText) {
      newMessageText.value = ""
    }

    // Show modal
    if (newMessageModal) {
      newMessageModal.style.display = "flex"
    }
  }

  // Render a single message
  function renderMessage(message) {
    const isSent = message.senderId === currentUser.uid
    const messageEl = document.createElement("div")
    messageEl.className = `ursac-message ${isSent ? "ursac-message-sent" : "ursac-message-received"}`
    messageEl.setAttribute("data-message-id", message.id)

    // For received messages, add avatar
    if (!isSent) {
      getUserData(message.senderId)
        .then((userData) => {
          const userInitials = getInitials(userData.firstName, userData.lastName)
          const avatarEl = messageEl.querySelector(".ursac-message-avatar span")
          if (avatarEl) {
            avatarEl.textContent = userInitials
          }
        })
        .catch((error) => {
          console.error("Error getting user data for message:", error)
        })
    }

    // Create message content
    let messageContent = `
    ${!isSent ? `<div class="ursac-message-avatar"><span>JS</span></div>` : ""}
    <div class="ursac-message-content">
      <div class="ursac-message-bubble">
        ${message.text || ""}
      </div>
      <div class="ursac-message-time">${formatTime(new Date(message.timestamp))}</div>
    </div>
  `

    // Add media content if available
    if (message.mediaURL) {
      const fileExtension = message.mediaName ? message.mediaName.split(".").pop().toLowerCase() : ""

      if (message.mediaType === "image" || fileExtension === "gif") {
        messageContent = `
        ${!isSent ? `<div class="ursac-message-avatar"><span>JS</span></div>` : ""}
        <div class="ursac-message-content">
          <div class="ursac-message-bubble">
            ${message.text ? `${message.text}<br><br>` : ""}
            <img src="${message.mediaURL}" alt="Image" class="ursac-message-image" onclick="window.open('${message.mediaURL}', '_blank')" crossorigin="anonymous">
          </div>
          <div class="ursac-message-time">${formatTime(new Date(message.timestamp))}</div>
        </div>
      `
      } else if (message.mediaType === "video") {
        messageContent = `
        ${!isSent ? `<div class="ursac-message-avatar"><span>JS</span></div>` : ""}
        <div class="ursac-message-content">
          <div class="ursac-message-bubble">
            ${message.text ? `${message.text}<br><br>` : ""}
            <video controls class="ursac-message-video" crossorigin="anonymous">
              <source src="${message.mediaURL}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>
          <div class="ursac-message-time">${formatTime(new Date(message.timestamp))}</div>
        </div>
      `
      } else if (message.mediaType === "file") {
        messageContent = `
        ${!isSent ? `<div class="ursac-message-avatar"><span>JS</span></div>` : ""}
        <div class="ursac-message-content">
          <div class="ursac-message-bubble">
            ${message.text ? `${message.text}<br><br>` : ""}
            <a href="${message.mediaURL}" target="_blank" class="ursac-message-file" rel="noopener noreferrer">
              <i class="fas fa-file"></i>
              <div class="ursac-message-file-info">
                <div class="ursac-message-file-name">${message.mediaName || "File"}</div>
                <div class="ursac-message-file-size">${message.mediaSize || ""}</div>
              </div>
            </a>
          </div>
          <div class="ursac-message-time">${formatTime(new Date(message.timestamp))}</div>
        </div>
      `
      }
    }

    messageEl.innerHTML = messageContent
    return messageEl
  }

  // Helper function to get user data
  function getUserData(userId) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        resolve({
          firstName: "Unknown",
          lastName: "User",
        })
        return
      }

      database
        .ref(`users/${userId}`)
        .once("value", (snapshot) => {
          if (snapshot.exists()) {
            resolve(snapshot.val())
          } else {
            resolve({
              firstName: "Unknown",
              lastName: "User",
            })
          }
        })
        .catch((error) => {
          console.error("Error getting user data:", error)
          resolve({
            firstName: "Unknown",
            lastName: "User",
          })
        })
    })
  }

  // Helper function to check user status
  function checkUserStatus(userId) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        resolve(false)
        return
      }

      database
        .ref(`status/${userId}`)
        .once("value", (snapshot) => {
          if (snapshot.exists() && snapshot.val().state === "online") {
            resolve(true)
          } else {
            resolve(false)
          }
        })
        .catch((error) => {
          console.error("Error checking user status:", error)
          resolve(false)
        })
    })
  }

  // Helper function to get initials from name
  function getInitials(firstName, lastName) {
    let initials = ""
    if (firstName) initials += firstName.charAt(0).toUpperCase()
    if (lastName) initials += lastName.charAt(0).toUpperCase()
    return initials || "?"
  }

  // Helper function to format time
  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Helper function to format date
  function formatDate(date) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  // Helper function to format time ago
  function formatTimeAgo(date) {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return "Just now"
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays}d ago`
    }

    return formatDate(date)
  }

  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Group messages by date
  function groupMessagesByDate(messages) {
    const groups = {}

    messages.forEach((message) => {
      const date = formatDate(new Date(message.timestamp))
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  // Function to open a conversation from a notification
  function openConversationFromNotification(conversationId, userId, messageId) {
    if (!conversationId || !userId) {
      console.error("Missing conversation or user ID for opening from notification")
      return
    }

    // Select the conversation
    selectConversation(conversationId, userId)

    // If we have a specific message ID, scroll to it after a short delay to ensure messages are loaded
    if (messageId) {
      setTimeout(() => {
        const messageElement = document.querySelector(`.ursac-message[data-message-id="${messageId}"]`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: "smooth", block: "center" })
          // Highlight the message briefly
          messageElement.classList.add("ursac-message-highlight")
          setTimeout(() => {
            messageElement.classList.remove("ursac-message-highlight")
          }, 2000)
        }
      }, 500)
    }
  }

  // Add this function to the global scope so it can be called from notifications.js
  window.openConversationFromNotification = openConversationFromNotification

  // Initialize the app
  init()

  // Add this function to the messages.js file
  function setupProfileUpdateListener() {
    // Listen for profile updates from other pages
    document.addEventListener("profileUpdated", (event) => {
      const userId = event.detail.userId

      // If this is the current user, update the UI
      if (userId === currentUser?.uid) {
        loadUserProfile(currentUser)
      }
    })

    // Listen for changes to the profileUpdates node in Firebase
    firebase
      .database()
      .ref("profileUpdates")
      .on("child_changed", (snapshot) => {
        const userId = snapshot.key
        const timestamp = snapshot.val()

        // If this is the selected recipient, update the conversation header
        if (userId === selectedRecipientId) {
          getUserData(userId).then((userData) => {
            // Update conversation header
            const userInitials = getInitials(userData.firstName, userData.lastName)
            const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

            document.getElementById("conversation-avatar-text").textContent = userInitials
            document.getElementById("conversation-name").textContent = userName
          })
        }

        // Update conversation list items
        const conversationItems = document.querySelectorAll(`.ursac-conversation-item[data-user-id="${userId}"]`)
        if (conversationItems.length > 0) {
          getUserData(userId).then((userData) => {
            conversationItems.forEach((item) => {
              const userInitials = getInitials(userData.firstName, userData.lastName)
              const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

              const avatarElement = item.querySelector(".ursac-conversation-avatar span")
              if (avatarElement) {
                avatarElement.textContent = userInitials
              }

              const nameElement = item.querySelector(".ursac-conversation-name")
              if (nameElement) {
                nameElement.textContent = userName
              }
            })
          })
        }

        // Update recipient list items
        const recipientItems = document.querySelectorAll(`.ursac-recipient-item[data-user-id="${userId}"]`)
        if (recipientItems.length > 0) {
          getUserData(userId).then((userData) => {
            recipientItems.forEach((item) => {
              const userInitials = getInitials(userData.firstName, userData.lastName)
              const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

              const avatarElement = item.querySelector(".ursac-recipient-avatar span")
              if (avatarElement) {
                avatarElement.textContent = userInitials
              }

              const nameElement = item.querySelector(".ursac-recipient-name")
              if (nameElement) {
                nameElement.textContent = userName
              }
            })
          })
        }
      })
  }

  // Generic modal function
  function showModal(title, message) {
    // Create modal if it doesn't exist
    let modalElement = document.getElementById("generic-modal")

    if (!modalElement) {
      const modalHTML = `
        <div class="ursac-modal" id="generic-modal">
          <div class="ursac-modal-content">
            <div class="ursac-modal-header">
              <h3 id="modal-title"></h3>
              <button class="ursac-modal-close" id="close-generic-modal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="ursac-modal-body">
              <p id="modal-message"></p>
            </div>
            <div class="ursac-modal-footer">
              <button class="ursac-button ursac-button-primary" id="acknowledge-generic">I Understand</button>
            </div>
          </div>
        </div>
      `

      const modalContainer = document.createElement("div")
      modalContainer.innerHTML = modalHTML
      document.body.appendChild(modalContainer.firstElementChild)

      modalElement = document.getElementById("generic-modal")

      // Add event listeners
      document.getElementById("close-generic-modal").addEventListener("click", () => {
        modalElement.style.display = "none"
      })

      document.getElementById("acknowledge-generic").addEventListener("click", () => {
        modalElement.style.display = "none"
      })
    }

    // Update content
    document.getElementById("modal-title").textContent = title
    document.getElementById("modal-message").textContent = message

    // Show modal
    modalElement.style.display = "flex"
  }
})
