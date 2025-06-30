/**
 * Media Handling System
 * Manages file uploads, media preview, and media processing
 */

// Global media state
let selectedMedia = null

/**
 * Handle file selection for posts
 * @param {Event} event - File input change event
 * @param {string} type - Media type (image, video, file)
 */
function handleFileSelect(event, type) {
  const file = event.target.files[0]
  if (!file) return

  // Remove video support as requested
  if (type === "video") {
    window.showModal(
      "Video Not Supported",
      "Video uploads are not currently supported. Please select an image or document instead.",
    )
    event.target.value = ""
    return
  }

  clearMediaPreview()
  selectedMedia = {
    file: file,
    type: type,
    name: file.name,
    size: window.formatFileSize(file.size),
  }

  const mediaPreview = document.getElementById("media-preview")
  if (!mediaPreview) return

  const previewItem = document.createElement("div")
  previewItem.className = "ursac-preview-item"

  if (type === "image") {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Selected image" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
        <div class="ursac-preview-remove" onclick="window.clearMediaPreview()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <i class="fas fa-times"></i>
        </div>
      `
      previewItem.style.position = "relative"
      previewItem.style.display = "inline-block"
      mediaPreview.appendChild(previewItem)
    }
    reader.readAsDataURL(file)
  } else if (type === "file") {
    previewItem.innerHTML = `
      <div class="ursac-preview-file" style="display: flex; align-items: center; gap: 8px; padding: 10px; background: #f0f2f5; border-radius: 8px; position: relative;">
        <i class="fas fa-file" style="font-size: 24px; color: #4a76a8;"></i>
        <span>${file.name}</span>
        <div class="ursac-preview-remove" onclick="window.clearMediaPreview()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px;">
          <i class="fas fa-times"></i>
        </div>
      </div>
    `
    mediaPreview.appendChild(previewItem)
  }

  window.updatePostButton()
  const expandedPostArea = document.getElementById("expanded-post-area")
  if (expandedPostArea) {
    expandedPostArea.classList.add("ursac-expanded")
  }
}

/**
 * Clear media preview and reset selection
 */
function clearMediaPreview() {
  const mediaPreview = document.getElementById("media-preview")
  if (mediaPreview) {
    mediaPreview.innerHTML = ""
  }
  selectedMedia = null

  const filePhoto = document.getElementById("file-photo")
  const fileAttachment = document.getElementById("file-attachment")

  if (filePhoto) filePhoto.value = ""
  if (fileAttachment) fileAttachment.value = ""

  window.updatePostButton()
}

/**
 * Upload media file to storage
 * @param {File} file - File to upload
 * @param {string} type - Media type
 * @returns {Promise} - Promise resolving to media data
 */
function uploadMedia(file, type) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"))
      return
    }

    const uploadModal = document.getElementById("upload-modal")
    const uploadProgress = document.getElementById("upload-progress")
    const uploadStatus = document.getElementById("upload-status")

    if (uploadModal) uploadModal.style.display = "flex"
    if (uploadStatus) uploadStatus.textContent = "0%"
    if (uploadProgress) uploadProgress.style.width = "0%"

    if (type !== "image") {
      // Upload non-image files to Firebase Storage
      const storageRef = window.firebaseStorage.ref()
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      const fileRef = storageRef.child(`files/${fileName}`)

      const uploadTask = fileRef.put(file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          if (uploadProgress) uploadProgress.style.width = progress + "%"
          if (uploadStatus) uploadStatus.textContent = `${Math.round(progress)}%`
        },
        (error) => {
          console.error("Upload failed:", error)
          if (uploadModal) uploadModal.style.display = "none"
          reject(error)
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            if (uploadStatus) uploadStatus.textContent = "Upload complete!"
            setTimeout(() => {
              if (uploadModal) uploadModal.style.display = "none"
            }, 1000)

            resolve({
              url: downloadURL,
              type: type,
              name: file.name,
              size: window.formatFileSize(file.size),
            })
          })
        },
      )
      return
    }

    // For images, use ImgBB API
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

          setTimeout(() => {
            if (uploadModal) uploadModal.style.display = "none"
          }, 1000)

          resolve({
            url: data.data.url,
            type: "image",
            name: file.name,
            size: window.formatFileSize(file.size),
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
  })
}

/**
 * Update post button state based on content and media
 */
function updatePostButton() {
  const postForm = document.getElementById("postForm")
  const postButton = document.getElementById("post-button")

  if (postForm && postButton) {
    const hasContent = postForm.value.trim() !== ""
    const hasMedia = selectedMedia !== null
    postButton.disabled = !hasContent && !hasMedia
  }
}

/**
 * Get current selected media
 * @returns {Object|null} - Selected media object or null
 */
function getSelectedMedia() {
  return selectedMedia
}

// Export functions to global scope
window.handleFileSelect = handleFileSelect
window.clearMediaPreview = clearMediaPreview
window.uploadMedia = uploadMedia
window.updatePostButton = updatePostButton
window.getSelectedMedia = getSelectedMedia
