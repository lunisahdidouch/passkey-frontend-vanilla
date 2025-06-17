if (typeof SimpleWebAuthnBrowser === "undefined") {
  console.error("SimpleWebAuthnBrowser is not loaded. Please include the library.");
}

const { startRegistration } = SimpleWebAuthnBrowser;

let currentPasskeys = [];
let currentEditingPasskeyId = null;
let isAddingPasskey = false;

async function loadUserPasskeys() {
  try {
    const response = await fetch("http://localhost:8080/api/passkeys", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to load passkeys");
      return;
    }

    currentPasskeys = await response.json();
    renderPasskeys();
  } catch (error) {
    console.error("Error loading passkeys:", error);
  }
}

function renderPasskeys() {
  const passkeyContainer = document.getElementById("passkeyContainer");
  
  if (currentPasskeys.length === 0) {
    passkeyContainer.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p>No passkeys found. Add a passkey to get started.</p>
      </div>
    `;
    return;
  }

  passkeyContainer.innerHTML = currentPasskeys.map((passkey, index) => `
    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div class="flex items-center space-x-4">
        <svg
          width="32"
          height="33"
          viewBox="0 0 32 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 27.3334V22.6667C0 21.7223 0.243056 20.8542 0.729167 20.0626C1.21528 19.2709 1.86111 18.6667 2.66667 18.2501C4.38889 17.389 6.13889 16.7431 7.91667 16.3126C9.69444 15.882 11.5 15.6667 13.3333 15.6667C13.8889 15.6667 14.4444 15.6876 15 15.7292C15.5556 15.7709 16.1111 15.8334 16.6667 15.9167C16.5556 17.5279 16.8472 19.0487 17.5417 20.4792C18.2361 21.9098 19.25 23.0834 20.5833 24.0001V27.3334H0ZM13.3333 14.0001C11.5 14.0001 9.93056 13.3473 8.625 12.0417C7.31944 10.7362 6.66667 9.16675 6.66667 7.33341C6.66667 5.50008 7.31944 3.93064 8.625 2.62508C9.93056 1.31953 11.5 0.666748 13.3333 0.666748C15.1667 0.666748 16.7361 1.31953 18.0417 2.62508C19.3472 3.93064 20 5.50008 20 7.33341C20 9.16675 19.3472 10.7362 18.0417 12.0417C16.7361 13.3473 15.1667 14.0001 13.3333 14.0001Z"
            fill="#0070AD"
          />
          <path
            d="M26.6667 32.3334L24.1667 29.8334V22.0834C22.9444 21.7223 21.9444 21.0348 21.1667 20.0209C20.3889 19.007 20 17.8334 20 16.5001C20 14.889 20.5694 13.514 21.7083 12.3751C22.8472 11.2362 24.2222 10.6667 25.8333 10.6667C27.4444 10.6667 28.8194 11.2362 29.9583 12.3751C31.0972 13.514 31.6667 14.889 31.6667 16.5001C31.6667 17.7501 31.3125 18.8612 30.6042 19.8334C29.8958 20.8056 29 21.5001 27.9167 21.9167L30 24.0001L27.5 26.5001L30 29.0001L26.6667 32.3334ZM25.8333 17.3334C26.3056 17.3334 26.7014 17.1737 27.0208 16.8542C27.3403 16.5348 27.5 16.139 27.5 15.6667C27.5 15.1945 27.3403 14.7987 27.0208 14.4792C26.7014 14.1598 26.3056 14.0001 25.8333 14.0001C25.3611 14.0001 24.9653 14.1598 24.6458 14.4792C24.3264 14.7987 24.1667 15.1945 24.1667 15.6667C24.1667 16.139 24.3264 16.5348 24.6458 16.8542C24.9653 17.1737 25.3611 17.3334 25.8333 17.3334Z"
            fill="#FF4019"
          />
        </svg>
        <div>
          <h3 class="font-medium text-gray-900">${passkey.name}</h3>
          <p class="text-sm text-gray-500">
            Added on ${formatDate(passkey.createdAt)} | Last used ${getRelativeTime(passkey.lastUsed)}
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button
          class="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-600 transition-colors"
          onclick="openRenameModal('${passkey.id}', '${passkey.name}')"
          title="Rename passkey"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#12ABDB"
          >
            <path
              d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
            />
          </svg>
        </button>
        <button
          class="p-2 ${currentPasskeys.length <= 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100'} border ${currentPasskeys.length <= 1 ? 'border-gray-200' : 'border-red-200'} rounded-lg ${currentPasskeys.length <= 1 ? 'text-gray-400' : 'text-red-600'} transition-colors"
          onclick="deletePasskey('${passkey.id}')"
          ${currentPasskeys.length <= 1 ? 'disabled title="Cannot delete the last passkey"' : 'title="Delete passkey"'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            />
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

async function addPasskey() {
  if (isAddingPasskey) {
    console.log("Already adding a passkey, please wait...");
    return;
  }

  isAddingPasskey = true;
  
  try {
    // Start the add passkey flow
    console.log("Starting add passkey flow...");
    const startResponse = await fetch("http://localhost:8080/api/passkeys/add/start", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.error || "Failed to start add passkey flow");
    }

    // Get registration options
    console.log("Getting registration options...");
    const optionsResponse = await fetch("http://localhost:8080/webauthn/register/start", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({})
    });

    if (!optionsResponse.ok) {
      throw new Error("Failed to get registration options");
    }

    const optionsFromServer = await optionsResponse.json();
    console.log("Received registration options:", optionsFromServer);

    // Start passkey registration
    let attResp;
    try {
      if (!optionsFromServer.publicKey) {
        throw new Error("publicKey field missing in server options.");
      }

      const actualCreationOptions = optionsFromServer.publicKey;
      console.log("Starting WebAuthn registration...");
      attResp = await startRegistration({ optionsJSON: actualCreationOptions });
      console.log("WebAuthn registration completed:", attResp);
    } catch (error) {
      console.error("WebAuthn registration failed:", error);
      throw new Error("Failed to register with authenticator: " + error.message);
    }

    // Finish registration
    console.log("Finishing registration...");
    const finishResponse = await fetch("http://localhost:8080/webauthn/register/finish", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attResp),
    });

    if (!finishResponse.ok) {
      throw new Error("Failed to complete registration");
    }

    const result = await finishResponse.json();
    
    if (result && result.success) {
      showSuccessNotification("New passkey added successfully!");
      loadUserPasskeys();
    } else {
      throw new Error(result.error || "Registration failed");
    }

  } catch (error) {
    console.error("Error adding passkey:", error);
    alert("Failed to add passkey: " + error.message);
  } finally {
    isAddingPasskey = false;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now - date;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return "just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
}

function openRenameModal(passkeyId, currentName) {
  currentEditingPasskeyId = passkeyId;
  const input = document.getElementById("passkeyName");
  input.value = currentName;
  document.getElementById("renameModal").classList.remove("hidden");
  input.focus();
}

function closeRenameModal() {
  currentEditingPasskeyId = null;
  document.getElementById("renameModal").classList.add("hidden");
  document.getElementById("passkeyName").value = "";
}

async function savePasskeyName() {
  if (!currentEditingPasskeyId) return;

  const newName = document.getElementById("passkeyName").value.trim();
  if (!newName) {
    alert("Please enter a name for the passkey");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/api/passkeys/${currentEditingPasskeyId}/name`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });

    if (response.ok) {
      closeRenameModal();
      showSuccessNotification("Passkey name updated successfully!");
      loadUserPasskeys(); // Reload the passkeys to reflect changes
    } else {
      const error = await response.json();
      alert("Failed to update passkey name: " + (error.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error updating passkey name:", error);
    alert("Failed to update passkey name");
  }
}

async function deletePasskey(passkeyId) {
  // Check if this is the last passkey
  if (currentPasskeys.length <= 1) {
    alert("Cannot delete the last passkey. You must have at least one passkey to access your account.");
    return;
  }

  if (!confirm("Are you sure you want to delete this passkey? This action cannot be undone.")) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/api/passkeys/${passkeyId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      showSuccessNotification("Passkey deleted successfully!");
      loadUserPasskeys(); // Reload the passkeys to reflect changes
    } else {
      const error = await response.json();
      alert("Failed to delete passkey: " + (error.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error deleting passkey:", error);
    alert("Failed to delete passkey");
  }
}

function showSuccessNotification(message) {
  const notification = document.getElementById("successNotification");
  const messageSpan = notification.querySelector("span:last-child");
  messageSpan.textContent = message;
  
  notification.classList.remove("hidden");
  notification.classList.remove("opacity-0");
  notification.classList.add("opacity-100");

  setTimeout(() => {
    notification.classList.remove("opacity-100");
    notification.classList.add("opacity-0");

    setTimeout(() => {
      notification.classList.add("hidden");
    }, 300);
  }, 2000);
}

// Load passkeys when the page loads
document.addEventListener("DOMContentLoaded", function () {
  loadUserPasskeys();
});