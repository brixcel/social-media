// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the confirm button and form elements
    const confirmBtn = document.getElementById('confirm-btn');
    const forumForm = document.getElementById('forumForm');
    const messageDiv = document.getElementById('message');

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Get Firebase services
    const database = firebase.database();

    // Variable to track approval setting
    let requiresApproval = false;

    // Function to show messages
    function showMessage(text, isError = false) {
        messageDiv.textContent = text;
        messageDiv.style.display = 'block';
        messageDiv.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
        messageDiv.style.color = isError ? '#721c24' : '#155724';
        messageDiv.style.border = isError ? '1px solid #f5c6cb' : '1px solid #c3e6cb';

        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    // Function to handle form submission
    forumForm.addEventListener('submit', function(event) {
        // Prevent the default form submission
        event.preventDefault();

        // Get form values
        const forumName = document.getElementById('forum-name').value.trim();
        const forumDescription = document.getElementById('forum-description').value.trim();

        // Validate form
        if (!forumName || !forumDescription) {
            showMessage('Please fill in all required fields', true);
            return;
        }

        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Creating...';

        // Create forum in Firebase
        createForum(forumName, forumDescription, requiresApproval);
    });

    // Function to create forum in Firebase
    function createForum(name, description, requiresApproval) {
        // Get a reference to the 'forums' node in Firebase
        const forumsRef = database.ref('forums');

        // Create a new forum entry with a unique key
        const newForumRef = forumsRef.push();

        // Save forum data without an image
        saveForum(newForumRef, name, description, requiresApproval);
    }

    function sendForumCreationNotification(forumId, forumName, creatorId) {
    // Get a reference to the users in Firebase
    const usersRef = database.ref("users")

    // Query for admins and moderators
    usersRef
      .once("value")
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((userSnapshot) => {
            const userData = userSnapshot.val()
            const userId = userSnapshot.key

            // Skip the creator - they don't need a notification about their own action
            if (userId === creatorId) return

            // Check if user is admin or moderator (you may need to adjust this based on your user roles structure)
            if (userData.role === "admin" || userData.role === "moderator") {
              // Create notification for this admin/moderator
              const notificationsRef = database.ref(`notifications/${userId}`)
              const newNotificationRef = notificationsRef.push()

              newNotificationRef.set({
                type: "forum_created",
                forumId: forumId,
                forumName: forumName,
                userId: creatorId,
                read: false,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                message: `A new forum "${forumName}" has been created`,
              })
            }
          })
        }
      })
      .catch((error) => {
        console.error("Error sending notifications:", error)
      })
  }

    // Function to save forum data to Firebase
    function saveForum(forumRef, name, description, requiresApproval) {
  // Get the current user
  const user = firebase.auth().currentUser;

  if (!user) {
    showModal('Error', 'You must be logged in to create a forum.', true);
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm';
    return;
  }

  const forumId = forumRef.key; // Get forum ID from the reference
  const forumData = {
    name,
    description,
    requiresApproval,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    user: {
      uid: user.uid,
      email: user.email
    },
    members: {
      [user.uid]: {
        email: user.email,
        joinedAt: firebase.database.ServerValue.TIMESTAMP,
        reason: requiresApproval ? '' : null
      }
    }
  };

  forumRef.set(forumData)
    .then(() => {
      console.log("Forum created successfully");
      showModal('Success', 'Forum created successfully!');

      // ✅ Add notification
      const notificationRef = firebase.database().ref('notifications').push();
      const notificationId = notificationRef.key;

     const forumCreatedNotifRef = firebase.database().ref(`notifications/${user.uid}`).push();
        return forumCreatedNotifRef.set({
        type: 'forum_created',
        userId: user.uid,
        forumId: forumId,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        message: `created a new forum: ${description || name}`,
        read: false
        });

      notificationRef.set(notificationData)
        .then(() => {
          console.log("Notification for forum creation saved.");
        })
        .catch((error) => {
          console.error("Failed to create notification:", error);
        });

      // Reset form
      forumForm.reset();
      document.querySelectorAll('.ursac-button-secondary').forEach(btn => {
        btn.classList.remove('highlighted');
      });
      document.getElementById('no-approval-btn').classList.add('highlighted');
      requiresApproval = false;

      // Reset button
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
    })
    .catch((error) => {
      console.error("Failed to create forum:", error);
      showModal('Error', 'Failed to create forum: ' + error.message, true);

      // Reset button
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
    });
}

    // Function to show a modal
    function showModal(title, message, isError = false) {
        const modal = document.createElement('div');
        modal.className = 'modal';

        const modalContent = `
                <div class="modal-content">
                        <h2 style="color: ${isError ? '#721c24' : '#155724'};">${title}</h2>
                        <p>${message}</p>
                        <button id="modal-close-btn" class="modal-close-btn">Close</button>
                </div>
        `;

        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        const closeModal = () => {
            document.body.removeChild(modal);
        };

        document.getElementById('modal-close-btn').addEventListener('click', closeModal);

        // Close modal when clicking outside the content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
});

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        text-align: center;
        max-width: 400px;
        width: 90%;
    }

    .modal-close-btn {
        margin-top: 15px;
        padding: 10px 20px;
        background-color: #007bff;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .modal-close-btn:hover {
        background-color: #0056b3;
    }

    #message {
        display: none;
        padding: 10px;
        margin-top: 10px;
        border-radius: 4px;
        font-size: 14px;
    }
`;
document.head.appendChild(style);
