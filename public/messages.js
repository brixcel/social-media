document.addEventListener("DOMContentLoaded", () => {
  // Firebase references
  const firebase = window.firebase
  const database = firebase.database()
  const storage = firebase.storage()

  // Enhanced message status tracking
  const MESSAGE_STATUS = {
    SENDING: "sending",
    SENT: "sent",
    DELIVERED: "delivered",
    READ: "read",
    FAILED: "failed",
  }

  // Enhanced duplicate prevention
  let isSubmitting = false
  let lastSubmissionTime = 0
  const SUBMISSION_COOLDOWN = 1000 // 1 second between submissions

  // ✅ FIXED: Message tracking with better duplicate prevention
  const loadedMessages = new Set() // Use Set for better performance
  let isInitialLoad = true

  // ✅ CORE: Shared Chat ID function (like Messenger)
  function getChatId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`
  }

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

  // Profanity Filter - Show warning modal
  function showProfanityWarning(matches) {
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

  // ✅ FIXED: Variables using new structure
  let currentUser = null
  let currentChatId = null // Use chatId instead of conversationId
  let selectedRecipientId = null
  let conversations = []
  let users = []
  let selectedAttachments = []

  // ✅ FIXED: Single listener references for proper cleanup
  let messagesListener = null
  let chatListListener = null

  let userProfileBtn = null
  let profileDropdown = null
  let logoutBtn = null
  let addAccountBtn = null

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
        initializeProfileElements()
        loadUserProfile(user)
        loadChatList() // ✅ FIXED: Load chat list instead of conversations
        setupMessageEventListeners()
        setupProfileUpdateListener()
      } else {
        console.log("No user authenticated, redirecting to login...")
        // For testing purposes only (remove in production):
        currentUser = {
          uid: "mockuser123",
          email: "test@example.com",
          displayName: "Test User",
        }
        initializeProfileElements()
        loadUsers()
        setupMessageEventListeners()
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
      const userStatusRef = database.ref(`/status/${user.uid}`)

      const isOfflineForDatabase = {
        state: "offline",
        lastChanged: firebase.database.ServerValue.TIMESTAMP,
      }

      const isOnlineForDatabase = {
        state: "online",
        lastChanged: firebase.database.ServerValue.TIMESTAMP,
      }

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
            })
          })
          .catch((error) => {
            console.warn("Error setting online status:", error.message)
          })
      })
    } catch (error) {
      console.error("Error in setupUserPresence:", error.message)
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

          userProfileBtn.style.cursor = "pointer"
        }
      })
      .catch((error) => {
        console.error("Error loading user profile:", error)
      })
  }

  // ✅ FIXED: Load chat list (Messenger-like approach)
  function loadChatList() {
    // Clear existing listener
    if (chatListListener) {
      database.ref(`chatList/${currentUser.uid}`).off("value", chatListListener)
    }

    // Show loading state
    loadingConversations.style.display = "flex"
    emptyConversations.style.display = "none"

    // ✅ Listen for the current user's chat list
    chatListListener = database.ref(`chatList/${currentUser.uid}`).on(
      "value",
      (snapshot) => {
        conversations = [] // Clear existing conversations

        if (snapshot.exists()) {
          // ✅ Use Map to deduplicate conversations by otherUserId
          const conversationMap = new Map()

          snapshot.forEach((childSnapshot) => {
            const chatData = childSnapshot.val()
            const otherUserId = childSnapshot.key

            // ✅ Only add if not already in map (prevents duplicates)
            if (!conversationMap.has(otherUserId)) {
              const conversation = {
                id: getChatId(currentUser.uid, otherUserId),
                otherUserId: otherUserId,
                lastMessage: chatData.lastMessage,
                timestamp: chatData.timestamp,
                unreadCount: chatData.unreadCount || 0,
                participants: {
                  [currentUser.uid]: true,
                  [otherUserId]: true,
                },
              }

              conversationMap.set(otherUserId, conversation)
            }
          })

          // Convert map to array
          conversations = Array.from(conversationMap.values())
        }

        // Sort conversations by timestamp (newest first)
        conversations.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

        console.log("Loaded conversations:", conversations.length)

        // Render conversations
        renderConversations()

        // If we have conversations, select the first one
        if (conversations.length > 0 && !currentChatId) {
          const firstConversation = conversations[0]
          selectConversation(firstConversation.id, firstConversation.otherUserId)
        }
      },
      (error) => {
        console.error("Error loading chat list:", error)
        loadingConversations.style.display = "none"
        emptyConversations.style.display = "flex"
      },
    )
  }

  // Render conversations list
  function renderConversations() {
    loadingConversations.style.display = "none"

    // ✅ FIXED: Clear ALL conversation items except the new message button
    const existingItems = conversationsList.querySelectorAll(".ursac-conversation-item")
    existingItems.forEach((item) => item.remove())

    // Keep the new message button
    const newConversationButton = conversationsList.querySelector(".ursac-new-conversation-button")
    if (!newConversationButton) {
      const buttonDiv = document.createElement("div")
      buttonDiv.className = "ursac-new-conversation-button"
      buttonDiv.innerHTML = `
      <button class="ursac-new-message-btn" id="new-message-btn">
        <i class="fas fa-plus"></i> New Message
      </button>
    `
      conversationsList.appendChild(buttonDiv)
      document.getElementById("new-message-btn").addEventListener("click", openNewMessageModal)
    }

    if (conversations.length === 0) {
      emptyConversations.style.display = "flex"
      return
    }

    emptyConversations.style.display = "none"

    // ✅ FIXED: Use Set to track rendered conversations and prevent duplicates
    const renderedConversations = new Set()

    // Render each conversation
    conversations.forEach((conversation) => {
      // ✅ Skip if already rendered
      if (renderedConversations.has(conversation.id)) {
        console.log("Skipping duplicate conversation:", conversation.id)
        return
      }

      renderedConversations.add(conversation.id)

      getUserData(conversation.otherUserId)
        .then((userData) => {
          // ✅ Check again if this conversation item already exists in DOM
          const existingItem = conversationsList.querySelector(`[data-conversation-id="${conversation.id}"]`)
          if (existingItem) {
            console.log("Conversation item already exists in DOM:", conversation.id)
            return
          }

          const userInitials = getInitials(userData.firstName, userData.lastName)
          const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
          const lastMessage = conversation.lastMessage || {}
          const unreadCount = conversation.unreadCount || 0

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
          if (conversation.id === currentChatId) {
            conversationItem.classList.add("active")
          }
          conversationItem.setAttribute("data-conversation-id", conversation.id)
          conversationItem.setAttribute("data-user-id", conversation.otherUserId)

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

          conversationItem.addEventListener("click", () => {
            selectConversation(conversation.id, conversation.otherUserId)
          })

          conversationsList.appendChild(conversationItem)
        })
        .catch((error) => {
          console.error("Error rendering conversation:", error)
        })
    })
  }

  // ✅ FIXED: Select a conversation using shared chat ID
  function selectConversation(chatId, userId) {
    // Remove active class from all conversation items
    document.querySelectorAll(".ursac-conversation-item").forEach((item) => {
      item.classList.remove("active")
    })

    // Add active class to selected conversation item
    const selectedItem = document.querySelector(`.ursac-conversation-item[data-conversation-id="${chatId}"]`)
    if (selectedItem) {
      selectedItem.classList.add("active")
    }

    // Set current chat and user
    currentChatId = chatId
    selectedRecipientId = userId

    // Show conversation view and hide default view
    conversationDefault.style.display = "none"
    conversationHeader.style.display = "flex"
    messagesArea.style.display = "block"
    messageInputArea.style.display = "flex"

    // Load user data
    getUserData(userId)
      .then((userData) => {
        const userInitials = getInitials(userData.firstName, userData.lastName)
        const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

        document.getElementById("conversation-avatar-text").textContent = userInitials
        document.getElementById("conversation-name").textContent = userName

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

    // ✅ FIXED: Setup messages listener with shared chat path
    setupMessagesListener(chatId)

    // Mark chat as read
    markChatAsRead(userId)
  }

  // ✅ FIXED: Setup messages listener using shared chat ID (NO DUPLICATES)
  function setupMessagesListener(chatId) {
    // Clear existing listener properly
    if (messagesListener) {
      try {
        database.ref(`chats/${currentChatId}/messages`).off("child_added", messagesListener)
      } catch (error) {
        console.warn("Error removing messages listener:", error)
      }
    }

    // Reset tracking
    loadedMessages.clear()
    isInitialLoad = true

    // Show loading spinner
    messagesArea.innerHTML = `
    <div class="ursac-loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading messages...</p>
    </div>
  `

    // ✅ STEP 1: Initial load from shared chat path
    database
      .ref(`chats/${chatId}/messages`)
      .once("value")
      .then((snapshot) => {
        const messagesData = snapshot.val()

        if (!messagesData) {
          messagesArea.innerHTML = `
          <div class="ursac-empty-state">
            <i class="fas fa-comment-dots"></i>
            <p>No messages yet. Start the conversation!</p>
          </div>
        `
          isInitialLoad = false
          setupRealTimeListener(chatId)
          return
        }

        try {
          // Convert to array and sort by timestamp
          const messagesArray = Object.entries(messagesData)
            .map(([id, message]) => ({
              id,
              ...message,
              timestamp: typeof message.timestamp === "number" ? message.timestamp : Date.now(),
            }))
            .filter((message) => message.id && message.sender)
            .sort((a, b) => a.timestamp - b.timestamp)

          // Clear container
          messagesArea.innerHTML = ""
          loadedMessages.clear()

          // Group messages by date and render
          const messagesByDate = groupMessagesByDate(messagesArray)

          Object.keys(messagesByDate).forEach((date) => {
            // Add date separator
            const dateSeparator = document.createElement("div")
            dateSeparator.className = "ursac-message-date"
            dateSeparator.textContent = date
            messagesArea.appendChild(dateSeparator)

            // Render messages for this date
            messagesByDate[date].forEach((message) => {
              const messageEl = renderMessage(message)
              messagesArea.appendChild(messageEl)
              loadedMessages.add(message.id) // ✅ Track loaded messages
            })
          })

          // Scroll to bottom
          messagesArea.scrollTop = messagesArea.scrollHeight

          isInitialLoad = false
          setupRealTimeListener(chatId)
        } catch (error) {
          console.error("Error processing messages:", error)
          messagesArea.innerHTML = `
          <div class="ursac-empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Failed to load messages. Please try again.</p>
          </div>
        `
          isInitialLoad = false
          setupRealTimeListener(chatId)
        }
      })
      .catch((error) => {
        console.error("Error loading messages:", error)
        messagesArea.innerHTML = `
        <div class="ursac-empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Failed to load messages. Please try again.</p>
        </div>
      `
        isInitialLoad = false
        setupRealTimeListener(chatId)
      })
  }

  // ✅ FIXED: Real-time listener with ZERO duplicates
  function setupRealTimeListener(chatId) {
    if (isInitialLoad) return

    messagesListener = (snapshot) => {
      const messageId = snapshot.key
      const messageData = snapshot.val()

      // ✅ CRITICAL: Skip if already loaded
      if (loadedMessages.has(messageId)) {
        console.log("Skipping duplicate message:", messageId)
        return
      }

      // ✅ CRITICAL: Check if message already exists in DOM
      const existingMessageInDOM = messagesArea.querySelector(`[data-message-id="${messageId}"]`)
      if (existingMessageInDOM) {
        console.log("Message already exists in DOM, skipping:", messageId)
        return
      }

      try {
        const message = { id: messageId, ...messageData }

        // Check if we need to remove "no messages" state
        const noMessagesMessage = messagesArea.querySelector(".ursac-empty-state")
        if (noMessagesMessage && noMessagesMessage.textContent.includes("No messages yet")) {
          messagesArea.innerHTML = ""
        }

        // Check if we need a new date separator
        const messageDate = formatDate(new Date(message.timestamp))
        const lastDateSeparator = messagesArea.querySelector(".ursac-message-date:last-of-type")

        if (!lastDateSeparator || lastDateSeparator.textContent !== messageDate) {
          const dateSeparator = document.createElement("div")
          dateSeparator.className = "ursac-message-date"
          dateSeparator.textContent = messageDate
          messagesArea.appendChild(dateSeparator)
        }

        // Add new message at the bottom
        const messageElement = renderMessage(message)
        messagesArea.appendChild(messageElement)

        // ✅ Track this message as loaded
        loadedMessages.add(messageId)

        // Scroll to bottom to show new message
        messagesArea.scrollTop = messagesArea.scrollHeight

        console.log("New message rendered:", messageId)
      } catch (error) {
        console.error("Error rendering new message:", error)
      }
    }

    // ✅ STEP 2: Listen for new messages on shared chat path
    database.ref(`chats/${chatId}/messages`).on("child_added", messagesListener, (error) => {
      console.error("Error in real-time message listener:", error)
    })
  }

  // ✅ FIXED: Send message using shared chat structure (NO DUPLICATES)
  function sendMessage() {
    const text = messageInput.value.trim()

    if (!text && selectedAttachments.length === 0) {
      return
    }

    // Enhanced duplicate prevention
    if (isSubmitting) {
      console.log("Submission blocked: Already submitting a message")
      return
    }

    const now = Date.now()
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
      const remainingTime = Math.ceil((SUBMISSION_COOLDOWN - (now - lastSubmissionTime)) / 1000)
      showModal("Please Wait", `Please wait ${remainingTime} more seconds before sending another message.`)
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

    // Set submission state
    isSubmitting = true
    lastSubmissionTime = now

    // Disable send button while sending
    messageSendBtn.disabled = true
    const originalText = messageSendBtn.innerHTML
    messageSendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'

    const resetSubmissionState = () => {
      isSubmitting = false
      messageSendBtn.disabled = false
      messageSendBtn.innerHTML = originalText
    }

    // Clear the input immediately
    const messageText = text
    messageInput.value = ""
    const attachmentsCopy = [...selectedAttachments]
    selectedAttachments = []

    if (attachmentsCopy.length > 0) {
      // Show upload modal
      uploadModal.style.display = "flex"
      uploadProgress.style.width = "0%"
      uploadStatus.textContent = "0%"

      // Upload the attachment
      uploadAttachment(attachmentsCopy[0])
        .then((mediaData) => {
          return createMessage(messageText, mediaData)
        })
        .then(() => {
          uploadModal.style.display = "none"
          resetSubmissionState()
        })
        .catch((error) => {
          console.error("Error uploading attachment:", error)
          showModal("Upload Failed", "Failed to upload attachment. Please try again.")
          uploadModal.style.display = "none"
          resetSubmissionState()
        })
    } else {
      createMessage(messageText)
        .then(() => {
          resetSubmissionState()
        })
        .catch((error) => {
          resetSubmissionState()
        })
    }
  }

  // ✅ FIXED: Create message in shared chat structure (SINGLE SOURCE OF TRUTH)
  function createMessage(text, mediaData = null) {
    return new Promise((resolve, reject) => {
      if (!currentChatId || !currentUser || !selectedRecipientId) {
        reject(new Error("No chat or user selected"))
        return
      }

      // ✅ Use push() for unique message IDs in shared chat
      const messageRef = database.ref(`chats/${currentChatId}/messages`).push()
      const messageId = messageRef.key

      const message = {
        sender: currentUser.uid, // ✅ Use 'sender' field like Messenger
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      }

      // Add media data if available
      if (mediaData) {
        message.mediaURL = mediaData.url
        message.mediaType = mediaData.type
        message.mediaName = mediaData.name
        message.mediaSize = mediaData.size
      }

      // ✅ Save message to shared chat path ONLY
      messageRef
        .set(message)
        .then(() => {
          // ✅ Update both users' chat lists atomically
          const updates = {}
          const lastMessageData = {
            text: text,
            sender: currentUser.uid,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            mediaURL: mediaData ? mediaData.url : null,
            mediaType: mediaData ? mediaData.type : null,
            mediaName: mediaData ? mediaData.name : null,
          }

          // Update current user's chat list
          updates[`chatList/${currentUser.uid}/${selectedRecipientId}/lastMessage`] = lastMessageData
          updates[`chatList/${currentUser.uid}/${selectedRecipientId}/timestamp`] =
            firebase.database.ServerValue.TIMESTAMP

          // Update recipient's chat list
          updates[`chatList/${selectedRecipientId}/${currentUser.uid}/lastMessage`] = lastMessageData
          updates[`chatList/${selectedRecipientId}/${currentUser.uid}/timestamp`] =
            firebase.database.ServerValue.TIMESTAMP
          updates[`chatList/${selectedRecipientId}/${currentUser.uid}/unreadCount`] =
            firebase.database.ServerValue.increment(1)

          return database.ref().update(updates)
        })
        .then(() => {
          // Create notification for the recipient
          createMessageNotification(selectedRecipientId, text, currentChatId, messageId)
          resolve()
        })
        .catch((error) => {
          console.error("Error creating message:", error)
          showModal("Message Failed", "Failed to send message. Please try again.")
          reject(error)
        })
    })
  }

  // Create a notification for a new message
  function createMessageNotification(recipientId, messageText, chatId, messageId) {
    if (!recipientId || !currentUser) return

    getUserData(currentUser.uid)
      .then((userData) => {
        const senderName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

        const notificationRef = database.ref(`notifications/${recipientId}`).push()

        const notification = {
          type: "message",
          userId: currentUser.uid,
          chatId: chatId, // ✅ Use chatId instead of conversationId
          messageId: messageId,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          read: false,
          commentText: messageText,
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

  // ✅ FIXED: Create or find existing chat using shared chat ID
  function createOrFindChat(recipientId, initialMessage) {
    return new Promise((resolve, reject) => {
      if (!currentUser || !currentUser.uid) {
        reject(new Error("You must be logged in to create a chat"))
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

      // ✅ Generate shared chat ID
      const chatId = getChatId(currentUser.uid, recipientId)

      // Check if chat already exists
      database
        .ref(`chats/${chatId}`)
        .once("value")
        .then((snapshot) => {
          if (snapshot.exists()) {
            // Chat exists, send message if provided
            if (initialMessage && initialMessage.trim() !== "") {
              const messageRef = database.ref(`chats/${chatId}/messages`).push()

              const message = {
                sender: currentUser.uid,
                text: initialMessage,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
              }

              return messageRef.set(message).then(() => {
                // Update both users' chat lists
                const updates = {}
                const lastMessageData = {
                  text: initialMessage,
                  sender: currentUser.uid,
                  timestamp: firebase.database.ServerValue.TIMESTAMP,
                }

                updates[`chatList/${currentUser.uid}/${recipientId}/lastMessage`] = lastMessageData
                updates[`chatList/${currentUser.uid}/${recipientId}/timestamp`] =
                  firebase.database.ServerValue.TIMESTAMP
                updates[`chatList/${recipientId}/${currentUser.uid}/lastMessage`] = lastMessageData
                updates[`chatList/${recipientId}/${currentUser.uid}/timestamp`] =
                  firebase.database.ServerValue.TIMESTAMP
                updates[`chatList/${recipientId}/${currentUser.uid}/unreadCount`] =
                  firebase.database.ServerValue.increment(1)

                return database
                  .ref()
                  .update(updates)
                  .then(() => chatId)
              })
            }
            return chatId
          } else {
            // Create new chat
            const chatData = {
              participants: {
                [currentUser.uid]: true,
                [recipientId]: true,
              },
              createdAt: firebase.database.ServerValue.TIMESTAMP,
              createdBy: currentUser.uid,
            }

            return database
              .ref(`chats/${chatId}`)
              .set(chatData)
              .then(() => {
                if (initialMessage && initialMessage.trim() !== "") {
                  const messageRef = database.ref(`chats/${chatId}/messages`).push()

                  const message = {
                    sender: currentUser.uid,
                    text: initialMessage,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                  }

                  return messageRef.set(message).then(() => {
                    // Update both users' chat lists
                    const updates = {}
                    const lastMessageData = {
                      text: initialMessage,
                      sender: currentUser.uid,
                      timestamp: firebase.database.ServerValue.TIMESTAMP,
                    }

                    updates[`chatList/${currentUser.uid}/${recipientId}/lastMessage`] = lastMessageData
                    updates[`chatList/${currentUser.uid}/${recipientId}/timestamp`] =
                      firebase.database.ServerValue.TIMESTAMP
                    updates[`chatList/${recipientId}/${currentUser.uid}/lastMessage`] = lastMessageData
                    updates[`chatList/${recipientId}/${currentUser.uid}/timestamp`] =
                      firebase.database.ServerValue.TIMESTAMP
                    updates[`chatList/${recipientId}/${currentUser.uid}/unreadCount`] = 1

                    return database
                      .ref()
                      .update(updates)
                      .then(() => chatId)
                  })
                }
                return chatId
              })
          }
        })
        .then((chatId) => {
          resolve(chatId)
        })
        .catch((error) => {
          console.error("Error creating/finding chat:", error)
          reject(error)
        })
    })
  }

  // ✅ FIXED: Mark chat as read
  function markChatAsRead(otherUserId) {
    const updates = {}
    updates[`chatList/${currentUser.uid}/${otherUserId}/unreadCount`] = 0
    database
      .ref()
      .update(updates)
      .catch((error) => {
        console.error("Error marking chat as read:", error)
      })
  }

  // Upload an attachment (keeping your existing implementation)
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
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const base64data = reader.result.split(",")[1]

          const apiKey = "fa517d5bab87e31f661cb28d7de365ba"

          const formData = new FormData()
          formData.append("image", base64data)

          if (uploadProgress) uploadProgress.style.width = "10%"
          if (uploadStatus) uploadStatus.textContent = "Uploading to ImgBB..."

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
              if (uploadProgress) uploadProgress.style.width = "100%"
              if (uploadStatus) uploadStatus.textContent = "Upload complete!"

              const timestamp = Date.now()

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
        const storageRef = storage.ref()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

        let fileRef
        if (fileType === "video") {
          fileRef = storageRef.child(`messages/videos/${fileName}`)
        } else {
          fileRef = storageRef.child(`messages/files/${fileName}`)
        }

        const metadata = {
          contentType: file.type,
          customMetadata: {
            "Access-Control-Allow-Origin": "*",
          },
        }

        const uploadTask = fileRef.put(file, metadata)

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
        let users = []

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val()
            user.id = childSnapshot.key

            if (user.id !== currentUser.uid) {
              users.push(user)
            }
          })
        } else {
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

    document.querySelectorAll(".ursac-recipient-item").forEach((item) => {
      item.addEventListener("click", function () {
        document.querySelectorAll(".ursac-recipient-item").forEach((el) => {
          el.classList.remove("selected")
        })

        this.classList.add("selected")
        selectedRecipientId = this.getAttribute("data-user-id")
      })
    })
  }

  // Setup message event listeners
  function setupMessageEventListeners() {
    if (messageSendBtn) {
      const newSendBtn = messageSendBtn.cloneNode(true)
      messageSendBtn.parentNode.replaceChild(newSendBtn, messageSendBtn)
      newSendBtn.addEventListener("click", sendMessage)
    }

    if (messageInput) {
      messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          sendMessage()
        }
      })

      messageInput.addEventListener("input", () => {
        const newSendBtn = document.getElementById("message-send-btn")
        if (newSendBtn) {
          newSendBtn.disabled = messageInput.value.trim() === "" && selectedAttachments.length === 0
        }
      })
    }

    if (newMessageBtn) {
      newMessageBtn.addEventListener("click", openNewMessageModal)
    }

    if (newMessageBtnEmpty) {
      newMessageBtnEmpty.addEventListener("click", openNewMessageModal)
    }

    if (newMessageBtnAlt) {
      newMessageBtnAlt.addEventListener("click", openNewMessageModal)
    }

    if (closeNewMessageModal) {
      closeNewMessageModal.addEventListener("click", () => {
        newMessageModal.style.display = "none"
      })
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase()

        if (searchTerm === "") {
          renderConversations()
          return
        }

        const filteredConversations = conversations.filter((conversation) => {
          const otherUserId = conversation.otherUserId

          return getUserData(otherUserId).then((userData) => {
            const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim().toLowerCase()
            return userName.includes(searchTerm)
          })
        })

        renderConversations(filteredConversations)
      })
    }

    if (recipientSearch) {
      recipientSearch.addEventListener("input", () => {
        const searchTerm = recipientSearch.value.toLowerCase()

        if (searchTerm === "") {
          renderRecipientsList(users)
          return
        }

        const filteredUsers = users.filter((user) => {
          const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase()
          return userName.includes(searchTerm)
        })

        renderRecipientsList(filteredUsers)
      })
    }

    if (sendNewMessage) {
      sendNewMessage.addEventListener("click", () => {
        if (!selectedRecipientId) {
          showModal("Recipient Required", "Please select a recipient")
          return
        }

        const messageText = newMessageText ? newMessageText.value.trim() : ""

        console.log("Creating chat with recipient:", selectedRecipientId)
        console.log("Message text:", messageText)

        // ✅ FIXED: Use createOrFindChat instead of createConversation
        createOrFindChat(selectedRecipientId, messageText)
          .then((chatId) => {
            console.log("Chat created/found successfully:", chatId)

            if (newMessageModal) {
              newMessageModal.style.display = "none"
            }

            if (newMessageText) {
              newMessageText.value = ""
            }

            selectConversation(chatId, selectedRecipientId)
          })
          .catch((error) => {
            console.error("Error creating chat:", error)
            showModal("Chat Failed", "Failed to create chat. Please try again.")
          })
      })
    }

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

    window.addEventListener("click", (e) => {
      if (newMessageModal && e.target === newMessageModal) {
        newMessageModal.style.display = "none"
      }

      if (uploadModal && e.target === uploadModal) {
        uploadModal.style.display = "none"
      }
    })

    const attachmentBtn = document.querySelector(".ursac-message-attachment-btn")
    const mediaBtn = document.querySelector(".ursac-message-media-btn")

    if (attachmentBtn) {
      attachmentBtn.addEventListener("click", () => {
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
        fileInput.style.display = "none"
        document.body.appendChild(fileInput)

        fileInput.addEventListener("change", () => {
          if (fileInput.files.length > 0) {
            selectedAttachments = [fileInput.files[0]]
            const newSendBtn = document.getElementById("message-send-btn")
            if (newSendBtn) {
              newSendBtn.disabled = false
            }
            sendMessage()
          }
          document.body.removeChild(fileInput)
        })

        fileInput.click()
      })
    }

    if (mediaBtn) {
      mediaBtn.addEventListener("click", () => {
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "image/*,video/*,.gif"
        fileInput.style.display = "none"
        document.body.appendChild(fileInput)

        fileInput.addEventListener("change", () => {
          if (fileInput.files.length > 0) {
            selectedAttachments = [fileInput.files[0]]
            const newSendBtn = document.getElementById("message-send-btn")
            if (newSendBtn) {
              newSendBtn.disabled = false
            }
            sendMessage()
          }
          document.body.removeChild(fileInput)
        })

        fileInput.click()
      })
    }

    const dropArea = messagesArea
    if (dropArea) {
      ;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropArea.addEventListener(eventName, preventDefaults, false)
      })

      function preventDefaults(e) {
        e.preventDefault()
        e.stopPropagation()
      }
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

      dropArea.addEventListener("drop", handleDrop, false)

      function handleDrop(e) {
        const dt = e.dataTransfer
        const files = dt.files

        if (files.length > 0) {
          selectedAttachments = [files[0]]
          const newSendBtn = document.getElementById("message-send-btn")
          if (newSendBtn) {
            newSendBtn.disabled = false
          }
          sendMessage()
        }
      }
    }
  }

  // Open new message modal
  function openNewMessageModal() {
    loadUsers()

    const selectedRecipient = null
    if (newMessageText) {
      newMessageText.value = ""
    }

    if (newMessageModal) {
      newMessageModal.style.display = "flex"
    }
  }

  // ✅ FIXED: Render message using sender field
  function renderMessage(message) {
    const isSent = message.sender === currentUser.uid
    const messageEl = document.createElement("div")
    messageEl.className = `ursac-message ${isSent ? "ursac-message-sent" : "ursac-message-received"}`
    messageEl.setAttribute("data-message-id", message.id) // ✅ Important for duplicate checking

    if (!isSent) {
      getUserData(message.sender)
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

    let messageContent = `
    ${!isSent ? `<div class="ursac-message-avatar"><span>JS</span></div>` : ""}
    <div class="ursac-message-content">
      <div class="ursac-message-bubble">
        ${message.text || ""}
      </div>
      <div class="ursac-message-time">${formatTime(new Date(message.timestamp))}</div>
    </div>
  `

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

  // ✅ FIXED: Function to open a chat from a notification
  function openChatFromNotification(chatId, userId, messageId) {
    if (!chatId || !userId) {
      console.error("Missing chat or user ID for opening from notification")
      return
    }

    selectConversation(chatId, userId)

    if (messageId) {
      setTimeout(() => {
        const messageElement = document.querySelector(`.ursac-message[data-message-id="${messageId}"]`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: "smooth", block: "center" })
          messageElement.classList.add("ursac-message-highlight")
          setTimeout(() => {
            messageElement.classList.remove("ursac-message-highlight")
          }, 2000)
        }
      }, 500)
    }
  }

  // ✅ FIXED: Update global function name
  window.openChatFromNotification = openChatFromNotification

  // Initialize the app
  init()

  // Add this function to the messages.js file
  function setupProfileUpdateListener() {
    document.addEventListener("profileUpdated", (event) => {
      const userId = event.detail.userId

      if (userId === currentUser?.uid) {
        loadUserProfile(currentUser)
      }
    })

    firebase
      .database()
      .ref("profileUpdates")
      .on("child_changed", (snapshot) => {
        const userId = snapshot.key
        const timestamp = snapshot.val()

        if (userId === selectedRecipientId) {
          getUserData(userId).then((userData) => {
            const userInitials = getInitials(userData.firstName, userData.lastName)
            const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

            document.getElementById("conversation-avatar-text").textContent = userInitials
            document.getElementById("conversation-name").textContent = userName
          })
        }

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

      document.getElementById("close-generic-modal").addEventListener("click", () => {
        modalElement.style.display = "none"
      })

      document.getElementById("acknowledge-generic").addEventListener("click", () => {
        modalElement.style.display = "none"
      })
    }

    document.getElementById("modal-title").textContent = title
    document.getElementById("modal-message").textContent = message

    modalElement.style.display = "flex"
  }
})
