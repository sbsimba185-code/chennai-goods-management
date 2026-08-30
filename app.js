const SUPABASE_URL =
  "https://yonxttybnkvxwnbhzwyi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_EC6Tm1kbWuPEPtfeeJED9Q_6dbqOZVh";

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");

const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");


// Show login
function showLogin() {
  loginScreen.hidden = false;
  loginScreen.style.display = "grid";

  appShell.hidden = true;
  appShell.style.display = "none";
}


// Show application
function showApp() {
  loginScreen.hidden = true;
  loginScreen.style.display = "none";

  appShell.hidden = false;
  appShell.style.display = "block";
}


// Login
loginForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  const email =
    document.getElementById("login-email").value.trim();

  const password =
    document.getElementById("login-password").value;

  if (!password) {
    loginMessage.textContent =
      "Please enter your password.";
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  loginMessage.textContent = "Please wait...";

  try {

    const response = await fetch(
      SUPABASE_URL +
      "/auth/v1/token?grant_type=password",
      {
        method: "POST",

        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email: email,
          password: password
        })
      }
    );

    const data = await response.json();

    console.log("Supabase response:", data);

    if (!response.ok) {
      throw new Error(
        data.error_description ||
        data.msg ||
        "Login failed."
      );
    }

    if (!data.access_token) {
      throw new Error(
        "No login token was returned."
      );
    }

    sessionStorage.setItem(
      "chennai_access_token",
      data.access_token
    );

    loginMessage.textContent = "";

    showApp();

    console.log("LOGIN SUCCESSFUL");

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    loginMessage.textContent =
      error.message;

  } finally {

    loginButton.disabled = false;
    loginButton.textContent = "Sign in";

  }

});


// Sign out
const signOutButton =
  document.getElementById("sign-out");

if (signOutButton) {

  signOutButton.addEventListener(
    "click",
    function () {

      sessionStorage.removeItem(
        "chennai_access_token"
      );

      document.getElementById(
        "login-password"
      ).value = "";

      showLogin();

    }
  );

}


// Sidebar navigation
document
  .querySelectorAll(".nav-link")
  .forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        const pageName =
          button.dataset.page;

        document
          .querySelectorAll(".page")
          .forEach(function (page) {

            page.classList.remove("active");

          });

        const selectedPage =
          document.getElementById(pageName);

        if (selectedPage) {
          selectedPage.classList.add("active");
        }

        document
          .querySelectorAll(".nav-link")
          .forEach(function (item) {

            item.classList.remove("active");

          });

        button.classList.add("active");

      }
    );

  });


// Receive goods button
const receiveButton =
  document.getElementById("receive-button");

if (receiveButton) {

  receiveButton.addEventListener(
    "click",
    function () {

      document
        .querySelectorAll(".page")
        .forEach(function (page) {

          page.classList.remove("active");

        });

      document
        .getElementById("receive")
        .classList.add("active");

      document
        .querySelectorAll(".nav-link")
        .forEach(function (item) {

          item.classList.remove("active");

        });

      document
        .querySelector('[data-page="receive"]')
        .classList.add("active");

    }
  );

}


// Start
const savedToken =
  sessionStorage.getItem(
    "chennai_access_token"
  );

if (savedToken) {
  showApp();
} else {
  showLogin();
}
