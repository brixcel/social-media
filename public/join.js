document.addEventListener("DOMContentLoaded", function () {
    let noForumsAvailable = true; // Flag to check if any forums are available to join

    const forumRef = firebase.database().ref('forums');
    const forumContainer = document.querySelector('.ursac-content-main');

    forumRef.once('value', (snapshot) => {
        const forums = snapshot.val();
        if (forums) {
            Object.values(forums).forEach(forum => {
                const currentUserUid = firebase.auth().currentUser?.uid;
    // Skip if the user is already a member of the forum or if they are the owner
                const isMember = forum.members && forum.members.hasOwnProperty(currentUserUid);
                const isOwner = forum.ownerUid === currentUserUid;

                if (isMember || isOwner) {
                    console.log(`User cannot join this forum: ${forum.name}`);
                    return;  // Skip rendering the forum if the user is a member or the owner
                }
            noForumsAvailable = false;
            const card = document.createElement('div');
            card.className = 'ursac-forum-card';
            card.innerHTML = `
            <div class="ursac-forum-card-header">
            <h3 class="forum-name" style="color: #0078ff;">${forum.name || 'No Name'}</h3>
            </div>
            <div class="ursac-forum-card-body">
            <p class="forum-description" style="color: #0078ff;">${forum.description || 'No Description'}</p>
            </div>
            `;

            // Add some styles for better appearance
            card.style.border = '1px solid #ccc';
            card.style.borderRadius = '8px';
            card.style.padding = '16px';
            card.style.margin = '10px 10px 10px 20px'; // Increased left margin
            card.style.backgroundColor = '#f9f9f9';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            card.style.transition = 'transform 0.2s, box-shadow 0.2s';
            card.style.cursor = 'pointer';

            card.addEventListener('mouseover', () => {
            card.style.transform = 'scale(1.02)';
            card.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
            });

            card.addEventListener('mouseout', () => {
            card.style.transform = 'scale(1)';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            });

                

            document.getElementById('joinable-forums').appendChild(card);    // Prevent joining own forum
                if (forum.ownerUid === firebase.auth().currentUser.uid) {
                    console.log(`User cannot join their own forum: ${forum.name}`);
                    return;
                }

                if (forum.requiresApproval === false) {
                    const modalOverlay = document.createElement('div');
                    modalOverlay.className = 'modal-overlay';
                    const modal = document.createElement('div');
                    modal.className = 'no-approval-modal';
                    modal.innerHTML = `
                        <div class="modal-content">
                            <h2>Join Forum</h2>
                            <p>Do you want to join the forum "${forum.name}"?</p>
                            <div class="modal-buttons">
                                <button class="join-forum">Yes</button>
                                <button class="close-modal">No</button>
                            </div>
                        </div>
                    `;
                    modalOverlay.appendChild(modal);
                    document.body.appendChild(modalOverlay);

                    modalOverlay.style.display = 'none';
                    modalOverlay.style.position = 'fixed';
                    modalOverlay.style.top = '0';
                    modalOverlay.style.left = '0';
                    modalOverlay.style.width = '100%';
                    modalOverlay.style.height = '100%';
                    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    modalOverlay.style.zIndex = '1000';

                    modal.style.position = 'fixed';
                    modal.style.top = '50%';
                    modal.style.left = '50%';
                    modal.style.transform = 'translate(-50%, -50%)';
                    modal.style.backgroundColor = 'white';
                    modal.style.padding = '20px';
                    modal.style.borderRadius = '10px';
                    modal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                    modal.style.textAlign = 'center';

                    const buttons = modal.querySelectorAll('button');
                    buttons.forEach(button => {
                        button.style.margin = '10px';
                        button.style.padding = '10px 20px';
                        button.style.border = 'none';
                        button.style.borderRadius = '5px';
                        button.style.cursor = 'pointer';
                    });

                    const joinButton = modal.querySelector('.join-forum');
                    joinButton.style.backgroundColor = '#4CAF50';
                    joinButton.style.color = 'white';

                    const closeModalButton = modal.querySelector('.close-modal');
                    closeModalButton.style.backgroundColor = '#f44336';
                    closeModalButton.style.color = 'white';

                    card.addEventListener('click', () => {
                        modalOverlay.style.display = 'block';
                    });

                    joinButton.addEventListener('click', () => {
                        const successModalOverlay = document.createElement('div');
                        successModalOverlay.className = 'modal-overlay';
                        const successModal = document.createElement('div');
                        successModal.className = 'success-modal';
                        successModal.innerHTML = `
                            <div class="modal-content">
                                <h2>Success</h2>
                                <p>You have successfully joined the forum "${forum.name}"!</p>
                                <button class="close-success-modal">Close</button>
                            </div>
                        `;
                        successModalOverlay.appendChild(successModal);
                        document.body.appendChild(successModalOverlay);

                        // Add user to the forum in Firebase
                        const currentUser = firebase.auth().currentUser;
                        if (currentUser && forum.id) {
                        const forumData = {
                            name: forum.name,
                            description: forum.description,
                            requiresApproval: forum.requiresApproval,
                            createdAt: forum.createdAt || firebase.database.ServerValue.TIMESTAMP,
                            user: {
                            uid: currentUser.uid,
                            email: currentUser.email
                            },
                            members: {
                            [currentUser.uid]: {
                                email: currentUser.email,
                                joinedAt: firebase.database.ServerValue.TIMESTAMP
                            }
                            }
                        };

                        // Push the forum data to the Firebase database (assuming the forum ID is used for storage)
                        const forumRef = firebase.database().ref(`forums/${forum.id}`);
                        forumRef.set(forumData).then(() => {
                            // Notification Data for forum joined
                            const forumJoinedNotifRef = firebase.database().ref(`notifications/${currentUser.uid}`).push();
                            return forumJoinedNotifRef.set({
                            type: 'forum_joined',  // Changed to 'forum_joined'
                            userId: currentUser.uid,
                            forumId: forum.id,
                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                            message: `joined the forum: ${forumData.name || 'Unnamed Forum'}`,
                            read: false,
                            forumName: forumData.name,  // Added the forum name
                            forumDescription: forumData.description  // Added the forum description
                            });
                        }).catch(error => {
                            console.error('Error joining forum:', error);
                        });
                        }

                        successModalOverlay.style.display = 'block';
                        successModalOverlay.style.position = 'fixed';
                        successModalOverlay.style.top = '0';
                        successModalOverlay.style.left = '0';
                        successModalOverlay.style.width = '100%';
                        successModalOverlay.style.height = '100%';
                        successModalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        successModalOverlay.style.zIndex = '1000';

                        successModal.style.position = 'fixed';
                        successModal.style.top = '50%';
                        successModal.style.left = '50%';
                        successModal.style.transform = 'translate(-50%, -50%)';
                        successModal.style.backgroundColor = 'white';
                        successModal.style.padding = '20px';
                        successModal.style.borderRadius = '10px';
                        successModal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                        successModal.style.textAlign = 'center';

                        const closeSuccessModalButton = successModal.querySelector('.close-success-modal');
                        closeSuccessModalButton.style.marginTop = '10px';
                        closeSuccessModalButton.style.padding = '10px 20px';
                        closeSuccessModalButton.style.border = 'none';
                        closeSuccessModalButton.style.borderRadius = '5px';
                        closeSuccessModalButton.style.cursor = 'pointer';
                        closeSuccessModalButton.style.backgroundColor = '#4CAF50';
                        closeSuccessModalButton.style.color = 'white';

                        closeSuccessModalButton.addEventListener('click', () => {
                            successModalOverlay.remove();
                        });

                        modalOverlay.style.display = 'none';
                    });

                    closeModalButton.addEventListener('click', (event) => {
                        event.stopPropagation();
                        modalOverlay.style.display = 'none';
                    });
                    } else if (forum.requiresApproval === true) {
                        const approvalModalOverlay = document.createElement('div');
                        approvalModalOverlay.className = 'modal-overlay';
                        const approvalModal = document.createElement('div');
                        approvalModal.className = 'approval-modal';
                        approvalModal.innerHTML = `
                            <div class="modal-content">
                                <h2>Request Approval</h2>
                                <p>Why do you want to join the forum "${forum.name}"?</p>
                                <textarea class="approval-reason" placeholder="Enter your reason here..." rows="4" style="width: 100%; margin-bottom: 10px;"></textarea>
                                <div class="modal-buttons">
                                    <button class="submit-approval-request">Submit</button>
                                    <button class="close-approval-modal">Close</button>
                                </div>
                            </div>
                        `;
                        approvalModalOverlay.appendChild(approvalModal);
                        document.body.appendChild(approvalModalOverlay);

                        approvalModalOverlay.style.display = 'none';
                        approvalModalOverlay.style.position = 'fixed';
                        approvalModalOverlay.style.top = '0';
                        approvalModalOverlay.style.left = '0';
                        approvalModalOverlay.style.width = '100%';
                        approvalModalOverlay.style.height = '100%';
                        approvalModalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        approvalModalOverlay.style.zIndex = '1000';

                        approvalModal.style.position = 'fixed';
                        approvalModal.style.top = '50%';
                        approvalModal.style.left = '50%';
                        approvalModal.style.transform = 'translate(-50%, -50%)';
                        approvalModal.style.backgroundColor = 'white';
                        approvalModal.style.padding = '20px';
                        approvalModal.style.borderRadius = '10px';
                        approvalModal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                        approvalModal.style.textAlign = 'center';

                        const submitApprovalRequestButton = approvalModal.querySelector('.submit-approval-request');
                        const closeApprovalModalButton = approvalModal.querySelector('.close-approval-modal');
                        const approvalReasonTextarea = approvalModal.querySelector('.approval-reason');

                        submitApprovalRequestButton.style.margin = '10px';
                        submitApprovalRequestButton.style.padding = '10px 20px';
                        submitApprovalRequestButton.style.border = 'none';
                        submitApprovalRequestButton.style.borderRadius = '5px';
                        submitApprovalRequestButton.style.cursor = 'pointer';
                        submitApprovalRequestButton.style.backgroundColor = '#4CAF50';
                        submitApprovalRequestButton.style.color = 'white';

                        closeApprovalModalButton.style.margin = '10px';
                        closeApprovalModalButton.style.padding = '10px 20px';
                        closeApprovalModalButton.style.border = 'none';
                        closeApprovalModalButton.style.borderRadius = '5px';
                        closeApprovalModalButton.style.cursor = 'pointer';
                        closeApprovalModalButton.style.backgroundColor = '#f44336';
                        closeApprovalModalButton.style.color = 'white';

                        submitApprovalRequestButton.addEventListener('click', () => {
                            const reason = approvalReasonTextarea.value.trim();
                            if (reason) {
                                const confirmationModalOverlay = document.createElement('div');
                                confirmationModalOverlay.className = 'modal-overlay';
                                const confirmationModal = document.createElement('div');
                                confirmationModal.className = 'confirmation-modal';
                                confirmationModal.innerHTML = `
                                    <div class="modal-content">
                                        <h2>Request Submitted</h2>
                                        <p>Your request to join the forum "${forum.name}" has been submitted for approval.</p>
                                        <button class="close-confirmation-modal">Close</button>
                                    </div>
                                `;

                                // Add user to the forum in Firebase
                                const currentUser = firebase.auth().currentUser;
                                if (currentUser && forum.id) {
                                    const forumMemberRef = firebase.database().ref(`forums/${forum.id}/members/${currentUser.uid}`);
                                    forumMemberRef.set({
                                        email: currentUser.email,
                                        joinedAt: firebase.database.ServerValue.TIMESTAMP,
                                        reason: reason || null
                                    }).then(() => {
                                        console.log(`Join request submitted for forum "${forum.name}" by user ${currentUser.email}`);
                                    }).catch((error) => {
                                        console.error("Error submitting join request:", error);
                                    });
                                
                                

                                    // const forumMembersRef = firebase.database().ref(`forums/${forum.id}/members/${currentUser.uid}`);
                                    // forumMembersRef.set({
                                    //     email: currentUser.email,
                                    //     joinedAt: firebase.database.ServerValue.TIMESTAMP
                                    // }).then(() => {
                                    //     console.log(`User ${currentUser.email} successfully added to forum "${forum.name}"`);
                                    // }).catch((error) => {
                                    //     console.error("Error adding user to forum:", error);
                                    // });
                                }
                                confirmationModalOverlay.appendChild(confirmationModal);
                                document.body.appendChild(confirmationModalOverlay);

                                confirmationModalOverlay.style.display = 'block';
                                confirmationModalOverlay.style.position = 'fixed';
                                confirmationModalOverlay.style.top = '0';
                                confirmationModalOverlay.style.left = '0';
                                confirmationModalOverlay.style.width = '100%';
                                confirmationModalOverlay.style.height = '100%';
                                confirmationModalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                                confirmationModalOverlay.style.zIndex = '1000';

                                confirmationModal.style.position = 'fixed';
                                confirmationModal.style.top = '50%';
                                confirmationModal.style.left = '50%';
                                confirmationModal.style.transform = 'translate(-50%, -50%)';
                                confirmationModal.style.backgroundColor = 'white';
                                confirmationModal.style.padding = '20px';
                                confirmationModal.style.borderRadius = '10px';
                                confirmationModal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                                confirmationModal.style.textAlign = 'center';

                                const closeConfirmationModalButton = confirmationModal.querySelector('.close-confirmation-modal');
                                closeConfirmationModalButton.style.marginTop = '10px';
                                closeConfirmationModalButton.style.padding = '10px 20px';
                                closeConfirmationModalButton.style.border = 'none';
                                closeConfirmationModalButton.style.borderRadius = '5px';
                                closeConfirmationModalButton.style.cursor = 'pointer';
                                closeConfirmationModalButton.style.backgroundColor = '#4CAF50';
                                closeConfirmationModalButton.style.color = 'white';

                                closeConfirmationModalButton.addEventListener('click', () => {
                                    confirmationModalOverlay.remove();
                                });

                                approvalModalOverlay.style.display = 'none';
                            } else {
                                const errorModalOverlay = document.createElement('div');
                                errorModalOverlay.className = 'modal-overlay';
                                const errorModal = document.createElement('div');
                                errorModal.className = 'error-modal';
                                errorModal.innerHTML = `
                                    <div class="modal-content">
                                        <h2>Error</h2>
                                        <p>Please provide a reason for joining the forum.</p>
                                        <button class="close-error-modal">Close</button>
                                    </div>
                                `;
                                errorModalOverlay.appendChild(errorModal);
                                document.body.appendChild(errorModalOverlay);

                                errorModalOverlay.style.display = 'block';
                                errorModalOverlay.style.position = 'fixed';
                                errorModalOverlay.style.top = '0';
                                errorModalOverlay.style.left = '0';
                                errorModalOverlay.style.width = '100%';
                                errorModalOverlay.style.height = '100%';
                                errorModalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                                errorModalOverlay.style.zIndex = '1000';

                                errorModal.style.position = 'fixed';
                                errorModal.style.top = '50%';
                                errorModal.style.left = '50%';
                                errorModal.style.transform = 'translate(-50%, -50%)';
                                errorModal.style.backgroundColor = 'white';
                                errorModal.style.padding = '20px';
                                errorModal.style.borderRadius = '10px';
                                errorModal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                                errorModal.style.textAlign = 'center';

                                const closeErrorModalButton = errorModal.querySelector('.close-error-modal');
                                closeErrorModalButton.style.marginTop = '10px';
                                closeErrorModalButton.style.padding = '10px 20px';
                                closeErrorModalButton.style.border = 'none';
                                closeErrorModalButton.style.borderRadius = '5px';
                                closeErrorModalButton.style.cursor = 'pointer';
                                closeErrorModalButton.style.backgroundColor = '#f44336';
                                closeErrorModalButton.style.color = 'white';

                                closeErrorModalButton.addEventListener('click', () => {
                                    errorModalOverlay.remove();
                                });
                            }
                        });

                        closeApprovalModalButton.addEventListener('click', () => {
                            approvalModalOverlay.style.display = 'none';
                        });

                        closeApprovalModalButton.addEventListener('click', () => {
                            approvalModalOverlay.style.display = 'none';
                        });

                        card.addEventListener('click', () => {
                            approvalModalOverlay.style.display = 'block';
                        });

                    card.addEventListener('click', () => {
                        approvalModalOverlay.style.display = 'block';
                    });
                    
                } else {
                    card.addEventListener('click', () => {
                        console.log(`Card clicked for forum: ${forum.name}`);
                        console.log(`requiresApproval: ${forum.requiresApproval}`);
                        
                    });
                }
            });
            
        } else {
            forumContainer.innerHTML += `<p style="color:white;">No Forums Available</p>`;
        }
    }, (error) => {
        console.error("Error fetching forums:", error);
        forumContainer.innerHTML += `<p style="color:red;">Error Loading Forums</p>`;
    });
});


document.getElementById('search-input').addEventListener('input', function () {
    const searchValue = this.value.toLowerCase();
    const forumCards = document.querySelectorAll('.ursac-forum-card');
    let visibleCount = 0;

    forumCards.forEach(card => {
        const forumName = card.querySelector('.forum-name')?.textContent.toLowerCase() || '';
        if (forumName.includes(searchValue)) {
            card.style.display = ''; // Show
            visibleCount++;
        } else {
            card.style.display = 'none'; // Hide
        }
    });

    // Toggle "No results" message
    const noResultsMessage = document.getElementById('no-results');
    if (noResultsMessage) {
        noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    } else if (visibleCount === 0) {
        const noResults = document.createElement('p');
        noResults.id = 'no-results';
        noResults.textContent = 'No relevant forums found.';
        noResults.style.color = 'white';
        noResults.style.textAlign = 'center';
        noResults.style.marginTop = '20px';
        noResults.style.position = 'absolute';
        noResults.style.top = '50%';
        noResults.style.left = '50%';
        noResults.style.transform = 'translate(-50%, -50%)';
        noResults.style.padding = '10px';
        noResults.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        noResults.style.borderRadius = '8px';
        noResults.style.width = '90%';
        noResults.style.maxWidth = '400px';
        noResults.style.boxSizing = 'border-box';
        document.querySelector('.ursac-content-main').appendChild(noResults);
    } else {
        const existingNoResults = document.getElementById('no-results');
        if (existingNoResults) {
            existingNoResults.remove();
        }
    }
});


