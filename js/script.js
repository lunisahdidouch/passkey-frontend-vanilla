if (typeof SimpleWebAuthnBrowser === "undefined") {
  console.error("SimpleWebAuthnBrowser is not loaded. Check the script tag.");
  alert("Error: WebAuthn library not loaded.");
}

const { startRegistration, startAuthentication, browserSupportsWebAuthn } =
  SimpleWebAuthnBrowser;

// DOM Elements
const registrationSection = document.getElementById("registrationSection");
const loginSection = document.getElementById("loginSection");
const switchToLoginLink = document.getElementById("switchToLogin");
const switchToRegisterLink = document.getElementById("switchToRegister");
const headerAuthLink = document.getElementById("headerAuthLink");
const pageTitle = document.querySelector("title");

// Form elements
const regUsernameInput = document.getElementById("regUsername");
const regDisplayNameInput = document.getElementById("regDisplayName");
const authUsernameInput = document.getElementById("authUsername");
const btnRegister = document.getElementById("btnRegister");
const btnLogin = document.getElementById("btnLogin");

// Display message
const messageArea = document.createElement("div");
messageArea.id = "messageArea";
messageArea.className = "mt-6";
document.querySelector("main .w-full.max-w-md").appendChild(messageArea);

function showLogin() {
  registrationSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  headerAuthLink.textContent = "Sign up";
  pageTitle.textContent = "Login";
  clearMessage();
}

function showRegistration() {
  loginSection.classList.add("hidden");
  registrationSection.classList.remove("hidden");
  headerAuthLink.textContent = "Login";
  pageTitle.textContent = "Create Account";
  clearMessage();
}

// Message handling
function clearMessage() {
  messageArea.innerHTML = "";
}

function showMessage(message, type = "info") {
  messageArea.innerHTML = "";
  if (!message) return;

  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  messageDiv.className = "message px-4 py-3 rounded-md relative";

  if (type === "success") {
    messageDiv.classList.add(
      "bg-green-100",
      "border",
      "border-green-400",
      "text-green-700"
    );
  } else if (type === "error") {
    messageDiv.classList.add(
      "bg-red-100",
      "border",
      "border-red-400",
      "text-red-700"
    );
  } else {
    messageDiv.classList.add(
      "bg-blue-100",
      "border",
      "border-blue-400",
      "text-blue-700"
    );
  }

  messageArea.appendChild(messageDiv);
}

// Event Listeners for UI navigation
switchToLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  showLogin();
});

switchToRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  showRegistration();
});

headerAuthLink.addEventListener("click", (e) => {
  e.preventDefault();
  if (headerAuthLink.textContent.toLowerCase().includes("login")) {
    showLogin();
  } else {
    showRegistration();
  }
});

// Check browser support for WebAuthn
if (!browserSupportsWebAuthn()) {
  showMessage("This browser does not support WebAuthn.", "error");
  btnRegister.disabled = true;
  btnLogin.disabled = true;
}

// Registration logic
btnRegister.addEventListener("click", async () => {
  clearMessage();
  const username = regUsernameInput.value;
  const displayName = regDisplayNameInput.value;

  if (!username || !displayName) {
    showMessage("Please enter both email and name for registration.", "error");
    return;
  }

  try {
    console.log("Fetching registration options");
    const respOptions = await fetch(
      "http://localhost:8080/webauthn/register/start",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", //!!!!!!
        body: JSON.stringify({ username, displayName }),
      }
    );

    if (!(await handleFetchError(respOptions, "fetching registration options")))
      return;
    // The line above is a shortened version of the following commented code:
    // const fetchResult = await handleFetchError(respOptions, "fetching registration options");
    // if (!fetchResult) {
    //     return;
    // }

    const optionsFromServer = await respOptions.json();
    console.log("Received registration options:", optionsFromServer);

    let attResp;
    try {
      if (!optionsFromServer.publicKey)
        throw new Error("publicKey field missing in server options.");
      // There is a mismatch between what the client receives and what the client expects in ordet to communicate with the authenticator.
      // Therefore I  extract the publicKey from the server's response and then continue with the registration.
      const actualCreationOptions = optionsFromServer.publicKey;
      showMessage("Please interact with your authenticator...", "info");
      attResp = await startRegistration({ optionsJSON: actualCreationOptions });
      console.log("Authenticator registration response:", attResp);
    } catch (error) {
      handleWebAuthnError(error, "registration with authenticator");
      return;
    }

    console.log("Sending attestation");
    const verificationResp = await fetch(
      "http://localhost:8080/webauthn/register/finish",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(attResp),
      }
    );

    if (
      !(await handleFetchError(
        verificationResp,
        "sending registration to server"
      ))
    )
      return;

    const verificationJSON = await verificationResp.json();

if (verificationJSON && verificationJSON.success) {
  if (verificationJSON.autoLogin) {
    showMessage(
      `Registration successful! Welcome ${verificationJSON.username}! Redirecting to your account...`,
      "success"
    );
    
    setTimeout(() => {
      window.location.href = "settings.html";
    }, 1500);
  } else {
    showMessage(
      `Registration successful for ${verificationJSON.username}! You can now try logging in.`,
      "success"
    );
    showLogin();
  }
} else {
      showMessage(
        `Server verification failed: ${
          verificationJSON.error || "Unknown error."
        }`,
        "error"
      );
    }
  } catch (fetchError) {
    console.error("Network/Fetch error during registration:", fetchError);
    showMessage("Network error. Could not connect to server.", "error");
  }
});

// Authentication logic
btnLogin.addEventListener("click", async () => {
  clearMessage();
  // The username is optional for authentication, since the server can return options for all registered authenticators.
  // By filling in a username, the server can return options for a specific authenticator and the user will only see the corresponding authenticator option.
  // If kept blank, the user will see all authenticators registered for the account which is useful if the user has multiple authenticators registered.
  const username = authUsernameInput.value || null;

  try {
    console.log("Fetching authentication options from server...");
    const requestBody = {};
    if (username) {
      requestBody.username = username;
    }

    const respOptions = await fetch(
      "http://localhost:8080/webauthn/authentication/start",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:
          Object.keys(requestBody).length > 0
            ? JSON.stringify(requestBody)
            : undefined,
      }
    );

    if (
      !(await handleFetchError(respOptions, "fetching authentication options"))
    )
      return;
    const optionsFromServer = await respOptions.json();
    console.log("Received authentication options:", optionsFromServer);

    let assertResp;
    try {
      if (!optionsFromServer.publicKey)
        throw new Error("publicKey field missing in server options.");
      const actualAuthOptions = optionsFromServer.publicKey;
      showMessage(
        "Please interact with your authenticator to log in...",
        "info"
      );
      assertResp = await startAuthentication({
        optionsJSON: actualAuthOptions,
      });
      console.log("Authenticator authentication response:", assertResp);
    } catch (error) {
      handleWebAuthnError(error, "authentication with authenticator");
      return;
    }

    console.log("Sending assertion to /authentication/finish...");
    const verificationResp = await fetch(
      "http://localhost:8080/webauthn/authentication/finish",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(assertResp),
      }
    );

    if (
      !(await handleFetchError(
        verificationResp,
        "sending authentication to server"
      ))
    )
      return;
    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.success) {
      showMessage(
        `Login successful for ${verificationJSON.username}!`,
        "success"
      );

      setTimeout(() => {
        window.location.href = "settings.html";
      }, 1500);
    } else {
      showMessage(
        `Server authentication failed: ${
          verificationJSON.error || "Unknown error."
        }`,
        "error"
      );
    }
  } catch (fetchError) {
    console.error("Network/Fetch error during authentication:", fetchError);
    showMessage("Network error. Could not connect to server.", "error");
  }
});

// These are some utility functions to handle fetch errors and WebAuthn errors.
async function handleFetchError(response, actionDescription) {
  if (!response.ok) {
    let errorMsg = `Error ${actionDescription} (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      errorMsg += `: ${errorData.error || response.statusText}`;
    } catch (e) {
      /* ignore if response body is not JSON */
    }
    console.error(errorMsg, response);
    showMessage(errorMsg, "error");
    return false;
  }
  return true;
}

function handleWebAuthnError(error, actionDescription) {
  console.error(`Error during ${actionDescription}:`, error);
  let errorMessage =
    error.message || `An unknown error occurred during ${actionDescription}.`;
  if (error.name === "InvalidStateError") {
    errorMessage = `Error: Authenticator invalid state during ${actionDescription}.`;
  } else if (error.name === "NotAllowedError") {
    errorMessage = `Error: The ${actionDescription} operation was not allowed, timed out, or cancelled.`;
  } else if (error.name === "SecurityError") {
    errorMessage = `SecurityError: ${error.message}. Ensure origin and RP ID match.`;
  }
  showMessage(errorMessage, "error");
}
