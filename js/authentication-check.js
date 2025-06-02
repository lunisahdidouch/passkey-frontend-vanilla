async function checkAuthentication() {
  try {
    const response = await fetch("http://localhost:8080/api/user/profile", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log("User not authenticated, redirecting to login");
      window.location.href = "login.html";
      return;
    }

    const userData = await response.json();

    document.getElementById("userDisplayName").textContent =
      userData.displayName;
    document.getElementById("profileInitial").textContent = userData.displayName
      .charAt(0)
      .toUpperCase();
    document.getElementById("userEmail").textContent = userData.email;

    console.log("User authenticated successfully:", userData.username);
  } catch (error) {
    console.error("Authentication check failed:", error);
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (confirm("Are you sure you want to logout?")) {
        fetch("http://localhost:8080/api/user/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((response) => {
            if (response.ok) {
              console.log("Logout successful");
            } else {
              console.warn(
                "Logout endpoint failed, but proceeding with redirect"
              );
            }
          })
          .catch((error) => {
            console.error("Logout request failed:", error);
          })
          .finally(() => {
            window.location.href = "login.html";
          });
      }
    });
  }
});
