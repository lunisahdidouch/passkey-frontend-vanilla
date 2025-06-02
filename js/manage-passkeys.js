function openRenameModal() {
  document.getElementById("renameModal").classList.remove("hidden");
}

function closeRenameModal() {
  document.getElementById("renameModal").classList.add("hidden");
}

function savePasskeyName() {
  closeRenameModal();
  showSuccessNotification();
}

function showSuccessNotification() {
  const notification = document.getElementById("successNotification");
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

function deletePasskey(passkeyId) {
  if (confirm("Are you sure you want to delete this passkey?")) {
    console.log(`Deleting passkey: ${passkeyId}`);
  }
}
