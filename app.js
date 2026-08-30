const SUPABASE_URL =
  "https://yonxttybnkvxwnbhzwyi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_EC6Tm1kbWuPEPtfeeJED9Q_6dbqOZVh";

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");

const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");

const shipmentForm =
  document.getElementById("shipment-form");

const formMessage =
  document.getElementById("form-message");

let accessToken =
  sessionStorage.getItem("chennai_access_token");


/* =========================================================
   LOGIN SCREEN
   ========================================================= */

function showLogin() {
  loginScreen.hidden = false;
  loginScreen.style.display = "grid";

  appShell.hidden = true;
  appShell.style.display = "none";
}


function showApp() {
  loginScreen.hidden = true;
  loginScreen.style.display = "none";

  appShell.hidden = false;
  appShell.style.display = "block";

  loadParties();
  loadBranches();
}


/* =========================================================
   SUPABASE HEADERS
   ========================================================= */

function supabaseHeaders() {
  return {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + accessToken,
    "Content-Type": "application/json"
  };
}


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    const email =
      document
        .getElementById("login-email")
        .value
        .trim();

    const password =
      document
        .getElementById("login-password")
        .value;

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

      const data =
        await response.json();

      console.log(
        "Supabase login response:",
        data
      );

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

      accessToken =
        data.access_token;

      sessionStorage.setItem(
        "chennai_access_token",
        accessToken
      );

      loginMessage.textContent = "";

      showApp();

      console.log(
        "LOGIN SUCCESSFUL"
      );

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      loginMessage.textContent =
        error.message;

    } finally {

      loginButton.disabled = false;
      loginButton.textContent = "Sign in";

    }

  }
);


/* =========================================================
   SIGN OUT
   ========================================================= */

const signOutButton =
  document.getElementById("sign-out");

if (signOutButton) {

  signOutButton.addEventListener(
    "click",
    function () {

      accessToken = null;

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


/* =========================================================
   LOAD PARTIES
   ========================================================= */

async function loadParties() {

  const partyList =
    document.getElementById("party-list");

  if (!partyList) {
    return;
  }

  try {

    const response = await fetch(
      SUPABASE_URL +
      "/rest/v1/parties?select=id,name&is_active=eq.true&order=name.asc",
      {
        method: "GET",
        headers: supabaseHeaders()
      }
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        "Could not load parties: " +
        errorText
      );
    }

    const parties =
      await response.json();

    partyList.innerHTML = "";

    parties.forEach(
      function (party) {

        const option =
          document.createElement("option");

        option.value =
          party.name;

        partyList.appendChild(
          option
        );

      }
    );

    console.log(
      "Parties loaded:",
      parties.length
    );

  } catch (error) {

    console.error(
      "PARTY LOAD ERROR:",
      error
    );

  }

}


/* =========================================================
   LOAD BRANCHES
   ========================================================= */

async function loadBranches() {

  const branchList =
    document.getElementById("branch-list");

  if (!branchList) {
    return;
  }

  try {

    const response = await fetch(
      SUPABASE_URL +
      "/rest/v1/branches?select=id,name&is_active=eq.true&order=name.asc",
      {
        method: "GET",
        headers: supabaseHeaders()
      }
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        "Could not load branches: " +
        errorText
      );
    }

    const branches =
      await response.json();

    branchList.innerHTML = "";

    branches.forEach(
      function (branch) {

        const option =
          document.createElement("option");

        option.value =
          branch.name;

        branchList.appendChild(
          option
        );

      }
    );

    console.log(
      "Branches loaded:",
      branches.length
    );

  } catch (error) {

    console.error(
      "BRANCH LOAD ERROR:",
      error
    );

  }

}


/* =========================================================
   FIND PARTY
   ========================================================= */

async function findPartyId(
  partyName
) {

  const url =
    SUPABASE_URL +
    "/rest/v1/parties" +
    "?select=id,name" +
    "&name=eq." +
    encodeURIComponent(partyName) +
    "&is_active=eq.true" +
    "&limit=1";

  const response =
    await fetch(
      url,
      {
        method: "GET",
        headers: supabaseHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    console.error(
      "Party lookup error:",
      data
    );

    throw new Error(
      "Could not find party."
    );
  }

  if (!data.length) {

    throw new Error(
      "Party not found. Please select an existing party."
    );
  }

  return data[0].id;
}


/* =========================================================
   FIND BRANCH
   ========================================================= */

async function findBranchId(
  branchName
) {

  const url =
    SUPABASE_URL +
    "/rest/v1/branches" +
    "?select=id,name" +
    "&name=eq." +
    encodeURIComponent(branchName) +
    "&is_active=eq.true" +
    "&limit=1";

  const response =
    await fetch(
      url,
      {
        method: "GET",
        headers: supabaseHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    console.error(
      "Branch lookup error:",
      data
    );

    throw new Error(
      "Could not find branch."
    );
  }

  if (!data.length) {

    throw new Error(
      "Branch not found. Please select an existing branch."
    );
  }

  return data[0].id;
}


/* =========================================================
   SAVE SHIPMENT
   ========================================================= */

async function saveShipment() {

  const receivedDate =
    document.getElementById(
      "received-date"
    ).value;

  const lrNumber =
    document.getElementById(
      "lr-number"
    ).value
    .trim();

  const partyName =
    document.getElementById(
      "party-name"
    ).value
    .trim();

  const branchName =
    document.getElementById(
      "branch-name"
    ).value
    .trim();

  const quantity =
    document.getElementById(
      "quantity"
    ).value;

  const amount =
    document.getElementById(
      "amount"
    ).value;

  const paymentType =
    document.getElementById(
      "payment-type"
    ).value;

  const remarks =
    document.getElementById(
      "remarks"
    ).value
    .trim();


  /* VALIDATION */

  if (!receivedDate) {
    throw new Error(
      "Please select the received date."
    );
  }

  if (!lrNumber) {
    throw new Error(
      "Please enter the LR number."
    );
  }

  if (!partyName) {
    throw new Error(
      "Please select a party."
    );
  }

  if (!branchName) {
    throw new Error(
      "Please select the from branch."
    );
  }

  if (
    !quantity ||
    Number(quantity) <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }

  if (
    amount === "" ||
    Number(amount) < 0
  ) {
    throw new Error(
      "Amount cannot be negative."
    );
  }

  if (
    ![
      "TOPAY",
      "TBB",
      "PAID"
    ].includes(paymentType)
  ) {
    throw new Error(
      "Invalid payment type."
    );
  }


  /* FIND FOREIGN KEYS */

  const partyId =
    await findPartyId(
      partyName
    );

  const branchId =
    await findBranchId(
      branchName
    );


  /* SAVE SHIPMENT */

  const shipmentResponse =
    await fetch(
      SUPABASE_URL +
      "/rest/v1/shipments",
      {
        method: "POST",

        headers: {
          ...supabaseHeaders(),
          "Prefer":
            "return=representation"
        },

        body: JSON.stringify({
          received_date:
            receivedDate,

          lr_number:
            lrNumber,

          party_id:
            partyId,

          quantity:
            Number(quantity),

          amount:
            Number(amount),

          payment_type:
            paymentType,

          from_branch_id:
            branchId,

          delivery_date:
            null,

          accounts_date:
            null,

          remarks:
            remarks || null
        })
      }
    );


  const shipmentData =
    await shipmentResponse
      .json();


  if (!shipmentResponse.ok) {

    console.error(
      "SHIPMENT SAVE ERROR:",
      shipmentData
    );

    throw new Error(
      shipmentData.message ||
      shipmentData.details ||
      shipmentData.hint ||
      shipmentData.error ||
      "Supabase could not save the shipment."
    );
  }


  if (
    !Array.isArray(shipmentData) ||
    !shipmentData.length
  ) {

    throw new Error(
      "Shipment save response was empty."
    );
  }


  const shipment =
    shipmentData[0];


  /* CREATE RECEIVED EVENT */

  const eventResponse =
    await fetch(
      SUPABASE_URL +
      "/rest/v1/shipment_events",
      {
        method: "POST",

        headers: supabaseHeaders(),

        body: JSON.stringify({
          shipment_id:
            shipment.id,

          event_type:
            "RECEIVED",

          event_date:
            receivedDate,

          notes:
            remarks || null
        })
      }
    );


  if (!eventResponse.ok) {

    const eventError =
      await eventResponse.text();

    console.error(
      "EVENT SAVE ERROR:",
      eventError
    );

    throw new Error(
      "Shipment was saved, but the RECEIVED event could not be recorded."
    );
  }


  return shipment;
}


/* =========================================================
   RECEIVE GOODS FORM
   ========================================================= */

if (shipmentForm) {

  shipmentForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const submitButton =
        shipmentForm.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          "Saving...";
      }

      if (formMessage) {

        formMessage.textContent =
          "Saving to cloud...";

      }

      try {

        const shipment =
          await saveShipment();

        if (formMessage) {

          formMessage.textContent =
            "Saved successfully. LR " +
            shipment.lr_number +
            " has been recorded.";

        }

        shipmentForm.reset();

        console.log(
          "SHIPMENT SAVED SUCCESSFULLY:",
          shipment
        );

      } catch (error) {

        console.error(
          "RECEIVE GOODS ERROR:",
          error
        );

        if (formMessage) {

          formMessage.textContent =
            error.message;

        }

      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            "Save goods receipt";

        }

      }

    }
  );

}


/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

document
  .querySelectorAll(".nav-link")
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const pageName =
            button.dataset.page;

          document
            .querySelectorAll(".page")
            .forEach(
              function (page) {

                page.classList.remove(
                  "active"
                );

              }
            );

          const selectedPage =
            document.getElementById(
              pageName
            );

          if (selectedPage) {

            selectedPage.classList.add(
              "active"
            );

          }

          document
            .querySelectorAll(".nav-link")
            .forEach(
              function (item) {

                item.classList.remove(
                  "active"
                );

              }
            );

          button.classList.add(
            "active"
          );

        }
      );

    }
  );


/* =========================================================
   RECEIVE GOODS BUTTON
   ========================================================= */

const receiveButton =
  document.getElementById(
    "receive-button"
  );

if (receiveButton) {

  receiveButton.addEventListener(
    "click",
    function () {

      document
        .querySelectorAll(".page")
        .forEach(
          function (page) {

            page.classList.remove(
              "active"
            );

          }
        );

      const receivePage =
        document.getElementById(
          "receive"
        );

      if (receivePage) {

        receivePage.classList.add(
          "active"
        );

      }

      document
        .querySelectorAll(".nav-link")
        .forEach(
          function (item) {

            item.classList.remove(
              "active"
            );

          }
        );

      const receiveNav =
        document.querySelector(
          '[data-page="receive"]'
        );

      if (receiveNav) {

        receiveNav.classList.add(
          "active"
        );

      }

    }
  );

}


/* =========================================================
   START APPLICATION
   ========================================================= */

if (accessToken) {

  showApp();

} else {

  showLogin();

}

/* =========================================================
   SMART PARTY / BRANCH SEARCH
   ========================================================= */

function normalizeUppercase(value) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}


/* ---------------------------------------------------------
   Generic smart search
   --------------------------------------------------------- */

function setupSmartSearch({
  inputId,
  hiddenId,
  suggestionsId,
  table,
  label
}) {

  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  const suggestions = document.getElementById(suggestionsId);

  if (!input || !hidden || !suggestions) {
    console.error("Smart search elements missing:", label);
    return;
  }

  let searchTimer = null;


  function hideSuggestions() {
    suggestions.hidden = true;
    suggestions.innerHTML = "";
  }


  function showMessage(message) {

    suggestions.innerHTML = "";

    const item = document.createElement("div");

    item.className = "smart-suggestion";

    item.textContent = message;

    suggestions.appendChild(item);

    suggestions.hidden = false;
  }


  function showResults(rows, searchText) {

    suggestions.innerHTML = "";

    rows.forEach(function (row) {

      const item = document.createElement("div");

      item.className = "smart-suggestion";

      const name = document.createElement("div");

      name.className = "smart-suggestion-name";

      name.textContent = row.name;

      item.appendChild(name);


      if (row.phone) {

        const meta = document.createElement("div");

        meta.className = "smart-suggestion-meta";

        meta.textContent = row.phone;

        item.appendChild(meta);

      }


      item.addEventListener("mousedown", function (event) {

        event.preventDefault();

        input.value = row.name;

        hidden.value = row.id;

        hideSuggestions();

      });


      suggestions.appendChild(item);

    });


    const createItem = document.createElement("div");

    createItem.className = "smart-create";

    createItem.textContent =
      '+ ADD "' +
      searchText +
      '" AS NEW ' +
      label.toUpperCase();


    createItem.addEventListener("mousedown", function (event) {

      event.preventDefault();

      createNewRecord(
        table,
        label,
        input,
        hidden,
        suggestions
      );

    });


    suggestions.appendChild(createItem);

    suggestions.hidden = false;
  }


  async function search() {

    const searchText =
      normalizeUppercase(input.value);

    hidden.value = "";

    if (!searchText) {

      hideSuggestions();

      return;
    }


    clearTimeout(searchTimer);


    searchTimer = setTimeout(async function () {

      try {

        const token =
          sessionStorage.getItem(
            "chennai_access_token"
          );


        if (!token) {

          showMessage("PLEASE SIGN IN AGAIN.");

          return;
        }


        const response = await fetch(
          SUPABASE_URL +
          "/rest/v1/" +
          table +
          "?select=id,name,phone" +
          "&name=ilike.*" +
          encodeURIComponent(searchText) +
          "*" +
          "&is_active=eq.true" +
          "&order=name.asc" +
          "&limit=10",
          {

            method: "GET",

            headers: {

              "apikey": SUPABASE_KEY,

              "Authorization":
                "Bearer " + token

            }

          }
        );


        const data =
          await response.json();


        if (!response.ok) {

          console.error(
            "Search error:",
            data
          );

          showMessage(
            "UNABLE TO SEARCH " +
            label.toUpperCase() +
            "."
          );

          return;
        }


        showResults(
          data || [],
          searchText
        );


      } catch (error) {

        console.error(
          "Smart search error:",
          error
        );

        showMessage(
          "SEARCH ERROR."
        );

      }

    }, 250);

  }


  input.addEventListener(
    "input",
    search
  );


  input.addEventListener(
    "focus",
    function () {

      if (input.value.trim()) {
        search();
      }

    }
  );


  input.addEventListener(
    "blur",
    function () {

      setTimeout(
        hideSuggestions,
        200
      );

    }
  );


  input.addEventListener(
    "change",
    function () {

      input.value =
        normalizeUppercase(
          input.value
        );

    }
  );

}


/* ---------------------------------------------------------
   CREATE NEW PARTY / BRANCH
   --------------------------------------------------------- */

async function createNewRecord(
  table,
  label,
  input,
  hidden,
  suggestions
) {

  const name =
    normalizeUppercase(
      input.value
    );


  if (!name) {

    alert(
      "PLEASE ENTER A " +
      label.toUpperCase() +
      " NAME."
    );

    return;
  }


  const token =
    sessionStorage.getItem(
      "chennai_access_token"
    );


  if (!token) {

    alert(
      "YOUR LOGIN SESSION HAS EXPIRED. PLEASE SIGN IN AGAIN."
    );

    return;
  }


  try {

    suggestions.hidden = true;


    const response = await fetch(
      SUPABASE_URL +
      "/rest/v1/" +
      table,
      {

        method: "POST",

        headers: {

          "apikey": SUPABASE_KEY,

          "Authorization":
            "Bearer " + token,

          "Content-Type":
            "application/json",

          "Prefer":
            "return=representation"

        },

        body: JSON.stringify({

          name: name,

          is_active: true

        })

      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Create error:",
        data
      );


      if (
        response.status === 409 ||
        (
          data &&
          data.code === "23505"
        )
      ) {

        alert(
          "THIS " +
          label.toUpperCase() +
          " ALREADY EXISTS. SEARCH AND SELECT IT."
        );

      } else {

        alert(
          data.message ||
          data.error_description ||
          "UNABLE TO CREATE " +
          label.toUpperCase() +
          "."
        );

      }

      return;
    }


    if (!data || !data.length) {

      alert(
        label.toUpperCase() +
        " WAS NOT CREATED."
      );

      return;
    }


    const created =
      data[0];


    input.value =
      created.name;

    hidden.value =
      created.id;


    suggestions.hidden =
      true;


    console.log(
      "NEW " +
      label.toUpperCase() +
      " CREATED:",
      created
    );


  } catch (error) {

    console.error(
      "Create record error:",
      error
    );

    alert(
      "ERROR CREATING " +
      label.toUpperCase() +
      "."
    );

  }

}


/* ---------------------------------------------------------
   START SMART SEARCH
   --------------------------------------------------------- */

setupSmartSearch({

  inputId: "party-name",

  hiddenId: "party-id",

  suggestionsId:
    "party-suggestions",

  table: "parties",

  label: "party"

});


setupSmartSearch({

  inputId: "branch-name",

  hiddenId: "branch-id",

  suggestionsId:
    "branch-suggestions",

  table: "branches",

  label: "branch"

});
