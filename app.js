/* =========================================================
   CHENNAI GOODS MANAGEMENT
   APP.JS
   ========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
  "https://yonxttybnkvxwnbhzwyi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_EC6Tm1kbWuPEPtfeeJED9Q_6dbqOZVh";


/* =========================================================
   ELEMENTS
   ========================================================= */

const loginForm =
  document.getElementById("login-form");

const loginButton =
  document.getElementById("login-button");

const loginMessage =
  document.getElementById("login-message");

const loginScreen =
  document.getElementById("login-screen");

const appShell =
  document.getElementById("app-shell");

const shipmentForm =
  document.getElementById("shipment-form");

const formMessage =
  document.getElementById("form-message");


/* =========================================================
   ACCESS TOKEN
   ========================================================= */

let accessToken =
  sessionStorage.getItem(
    "chennai_access_token"
  );


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLogin() {

  if (loginScreen) {

    loginScreen.hidden = false;
    loginScreen.style.display = "grid";

  }

  if (appShell) {

    appShell.hidden = true;
    appShell.style.display = "none";

  }

}


/* =========================================================
   SHOW APP
   ========================================================= */

function showApp() {

  if (loginScreen) {

    loginScreen.hidden = true;
    loginScreen.style.display = "none";

  }

  if (appShell) {

    appShell.hidden = false;
    appShell.style.display = "block";

  }

  loadParties();
  loadBranches();

}


/* =========================================================
   SUPABASE HEADERS
   ========================================================= */

function supabaseHeaders() {

  return {

    "apikey":
      SUPABASE_KEY,

    "Authorization":
      "Bearer " + accessToken,

    "Content-Type":
      "application/json"

  };

}


/* =========================================================
   UPPERCASE NORMALIZATION
   ========================================================= */

function normalizeUppercase(value) {

  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

}


/* =========================================================
   LOGIN
   ========================================================= */

if (loginForm) {

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

      loginButton.textContent =
        "Signing in...";

      loginMessage.textContent =
        "Please wait...";


      try {

        const response =
          await fetch(

            SUPABASE_URL +
            "/auth/v1/token?grant_type=password",

            {

              method: "POST",

              headers: {

                "apikey":
                  SUPABASE_KEY,

                "Content-Type":
                  "application/json"

              },

              body: JSON.stringify({

                email:
                  email,

                password:
                  password

              })

            }

          );


        const data =
          await response.json();


        console.log(
          "SUPABASE LOGIN RESPONSE:",
          data
        );


        if (!response.ok) {

          throw new Error(

            data.error_description ||
            data.msg ||
            data.message ||
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


        loginMessage.textContent =
          "";


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

        loginButton.disabled =
          false;

        loginButton.textContent =
          "Sign in";

      }

    }
  );

}


/* =========================================================
   SIGN OUT
   ========================================================= */

const signOutButton =
  document.getElementById(
    "sign-out"
  );


if (signOutButton) {

  signOutButton.addEventListener(
    "click",
    function () {

      accessToken = null;


      sessionStorage.removeItem(
        "chennai_access_token"
      );


      const passwordInput =
        document.getElementById(
          "login-password"
        );


      if (passwordInput) {

        passwordInput.value = "";

      }


      showLogin();

    }
  );

}


/* =========================================================
   LOAD PARTIES
   ========================================================= */

async function loadParties() {

  const partyList =
    document.getElementById(
      "party-list"
    );


  if (!partyList) {

    return;

  }


  if (!accessToken) {

    return;

  }


  try {

    const response =
      await fetch(

        SUPABASE_URL +
        "/rest/v1/parties" +
        "?select=id,name,phone" +
        "&is_active=eq.true" +
        "&order=name.asc",

        {

          method: "GET",

          headers:
            supabaseHeaders()

        }

      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "PARTY LOAD ERROR:",
        data
      );

      return;

    }


    partyList.innerHTML =
      "";


    data.forEach(
      function (party) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          party.name;


        partyList.appendChild(
          option
        );

      }
    );


    console.log(
      "PARTIES LOADED:",
      data.length
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
    document.getElementById(
      "branch-list"
    );


  if (!branchList) {

    return;

  }


  if (!accessToken) {

    return;

  }


  try {

    const response =
      await fetch(

        SUPABASE_URL +
        "/rest/v1/branches" +
        "?select=id,name,phone" +
        "&is_active=eq.true" +
        "&order=name.asc",

        {

          method: "GET",

          headers:
            supabaseHeaders()

        }

      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "BRANCH LOAD ERROR:",
        data
      );

      return;

    }


    branchList.innerHTML =
      "";


    data.forEach(
      function (branch) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          branch.name;


        branchList.appendChild(
          option
        );

      }
    );


    console.log(
      "BRANCHES LOADED:",
      data.length
    );


  } catch (error) {

    console.error(
      "BRANCH LOAD ERROR:",
      error
    );

  }

}


/* =========================================================
   FIND PARTY ID
   ========================================================= */

async function findPartyId(
  partyName
) {

  const name =
    normalizeUppercase(
      partyName
    );


  const url =
    SUPABASE_URL +
    "/rest/v1/parties" +
    "?select=id,name" +
    "&name=eq." +
    encodeURIComponent(name) +
    "&is_active=eq.true" +
    "&limit=1";


  const response =
    await fetch(

      url,

      {

        method: "GET",

        headers:
          supabaseHeaders()

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "PARTY LOOKUP ERROR:",
      data
    );


    throw new Error(
      "Could not find party."
    );

  }


  if (!data.length) {

    throw new Error(
      "PARTY NOT FOUND. PLEASE SELECT OR CREATE THE PARTY."
    );

  }


  return data[0].id;

}


/* =========================================================
   FIND BRANCH ID
   ========================================================= */

async function findBranchId(
  branchName
) {

  const name =
    normalizeUppercase(
      branchName
    );


  const url =
    SUPABASE_URL +
    "/rest/v1/branches" +
    "?select=id,name" +
    "&name=eq." +
    encodeURIComponent(name) +
    "&is_active=eq.true" +
    "&limit=1";


  const response =
    await fetch(

      url,

      {

        method: "GET",

        headers:
          supabaseHeaders()

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "BRANCH LOOKUP ERROR:",
      data
    );


    throw new Error(
      "Could not find branch."
    );

  }


  if (!data.length) {

    throw new Error(
      "BRANCH NOT FOUND. PLEASE SELECT OR CREATE THE BRANCH."
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
    normalizeUppercase(
      document.getElementById(
        "lr-number"
      ).value
    );


  const partyName =
    normalizeUppercase(
      document.getElementById(
        "party-name"
      ).value
    );


  const branchName =
    normalizeUppercase(
      document.getElementById(
        "branch-name"
      ).value
    );


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
    normalizeUppercase(
      document.getElementById(
        "remarks"
      ).value
    );


  /* -------------------------------------------------------
     VALIDATION
     ------------------------------------------------------- */

  if (!receivedDate) {

    throw new Error(
      "PLEASE SELECT THE RECEIVED DATE."
    );

  }


  if (!lrNumber) {

    throw new Error(
      "PLEASE ENTER THE LR NUMBER."
    );

  }


  if (!partyName) {

    throw new Error(
      "PLEASE SELECT OR CREATE A PARTY."
    );

  }


  if (!branchName) {

    throw new Error(
      "PLEASE SELECT OR CREATE THE FROM BRANCH."
    );

  }


  if (
    !quantity ||
    Number(quantity) <= 0
  ) {

    throw new Error(
      "QUANTITY MUST BE GREATER THAN ZERO."
    );

  }


  if (
    amount === "" ||
    Number(amount) < 0
  ) {

    throw new Error(
      "AMOUNT CANNOT BE NEGATIVE."
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
      "INVALID PAYMENT TYPE."
    );

  }


  /* -------------------------------------------------------
     FOREIGN KEYS
     ------------------------------------------------------- */

  const partyId =
    await findPartyId(
      partyName
    );


  const branchId =
    await findBranchId(
      branchName
    );


  /* -------------------------------------------------------
     INSERT SHIPMENT
     ------------------------------------------------------- */

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

        body:
          JSON.stringify({

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
    await shipmentResponse.json();


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
      "SUPABASE COULD NOT SAVE THE SHIPMENT."

    );

  }


  if (
    !Array.isArray(shipmentData) ||
    !shipmentData.length
  ) {

    throw new Error(
      "SHIPMENT SAVE RESPONSE WAS EMPTY."
    );

  }


  const shipment =
    shipmentData[0];


  /* -------------------------------------------------------
     CREATE RECEIVED EVENT
     ------------------------------------------------------- */

  const eventResponse =
    await fetch(

      SUPABASE_URL +
      "/rest/v1/shipment_events",

      {

        method: "POST",

        headers: {

          ...supabaseHeaders(),

          "Prefer":
            "return=minimal"

        },

        body:
          JSON.stringify({

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
      "RECEIVED EVENT ERROR:",
      eventError
    );


    /*
       Shipment itself has already been saved.
       We report the event problem separately.
    */

    console.warn(
      "SHIPMENT SAVED BUT RECEIVED EVENT FAILED."
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


      if (!accessToken) {

        if (formMessage) {

          formMessage.textContent =
            "YOUR LOGIN SESSION HAS EXPIRED. PLEASE SIGN IN AGAIN.";

        }

        showLogin();

        return;

      }


      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          "SAVING...";

      }


      if (formMessage) {

        formMessage.textContent =
          "SAVING TO CLOUD...";

      }


      try {

        const shipment =
          await saveShipment();


        if (formMessage) {

          formMessage.textContent =
            "RECEIVE GOODS SAVED SUCCESSFULLY — SERIAL NO. " +
            shipment.serial_no;

        }


        shipmentForm.reset();


        /*
           Clear hidden Party / Branch IDs
           if they exist.
        */

        const partyIdInput =
          document.getElementById(
            "party-id"
          );


        if (partyIdInput) {

          partyIdInput.value =
            "";

        }


        const branchIdInput =
          document.getElementById(
            "branch-id"
          );


        if (branchIdInput) {

          branchIdInput.value =
            "";

        }


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
   SMART PARTY / BRANCH SEARCH
   ========================================================= */

function setupSmartSearch({

  inputId,
  hiddenId,
  suggestionsId,
  table,
  label

}) {

  const input =
    document.getElementById(
      inputId
    );


  const hidden =
    document.getElementById(
      hiddenId
    );


  const suggestions =
    document.getElementById(
      suggestionsId
    );


  if (
    !input ||
    !hidden ||
    !suggestions
  ) {

    console.warn(
      "SMART SEARCH ELEMENTS MISSING:",
      label
    );

    return;

  }


  let searchTimer =
    null;


  function hideSuggestions() {

    suggestions.hidden =
      true;

    suggestions.innerHTML =
      "";

  }


  function showMessage(
    message
  ) {

    suggestions.innerHTML =
      "";


    const item =
      document.createElement(
        "div"
      );


    item.className =
      "smart-suggestion";


    item.textContent =
      message;


    suggestions.appendChild(
      item
    );


    suggestions.hidden =
      false;

  }


  function showResults(
    rows,
    searchText
  ) {

    suggestions.innerHTML =
      "";


    rows.forEach(
      function (row) {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "smart-suggestion";


        const name =
          document.createElement(
            "div"
          );


        name.className =
          "smart-suggestion-name";


        name.textContent =
          row.name;


        item.appendChild(
          name
        );


        if (row.phone) {

          const meta =
            document.createElement(
              "div"
            );


          meta.className =
            "smart-suggestion-meta";


          meta.textContent =
            row.phone;


          item.appendChild(
            meta
          );

        }


        item.addEventListener(
          "mousedown",
          function (event) {

            event.preventDefault();


            input.value =
              row.name;


            hidden.value =
              row.id;


            hideSuggestions();

          }
        );


        suggestions.appendChild(
          item
        );

      }
    );


    /*
       Add new record option.
    */

    if (searchText) {

      const createItem =
        document.createElement(
          "div"
        );


      createItem.className =
        "smart-create";


      createItem.textContent =
        '+ ADD "' +
        searchText +
        '" AS NEW ' +
        label.toUpperCase();


      createItem.addEventListener(
        "mousedown",
        function (event) {

          event.preventDefault();


          createNewRecord(

            table,
            label,
            input,
            hidden,
            suggestions

          );

        }
      );


      suggestions.appendChild(
        createItem
      );

    }


    suggestions.hidden =
      false;

  }


  async function search() {

    const searchText =
      normalizeUppercase(
        input.value
      );


    /*
       If user changes the name,
       remove the old ID.
    */

    hidden.value =
      "";


    if (!searchText) {

      hideSuggestions();

      return;

    }


    clearTimeout(
      searchTimer
    );


    searchTimer =
      setTimeout(
        async function () {

          try {

            const token =
              sessionStorage.getItem(
                "chennai_access_token"
              );


            if (!token) {

              showMessage(
                "PLEASE SIGN IN AGAIN."
              );

              return;

            }


            const response =
              await fetch(

                SUPABASE_URL +
                "/rest/v1/" +
                table +
                "?select=id,name,phone" +
                "&name=ilike.*" +
                encodeURIComponent(
                  searchText
                ) +
                "*" +
                "&is_active=eq.true" +
                "&order=name.asc" +
                "&limit=10",

                {

                  method: "GET",

                  headers: {

                    "apikey":
                      SUPABASE_KEY,

                    "Authorization":
                      "Bearer " +
                      token

                  }

                }

              );


            const data =
              await response.json();


            if (!response.ok) {

              console.error(
                "SMART SEARCH ERROR:",
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
              "SMART SEARCH ERROR:",
              error
            );


            showMessage(
              "SEARCH ERROR."
            );

          }

        },
        250
      );

  }


  input.addEventListener(
    "input",
    search
  );


  input.addEventListener(
    "focus",
    function () {

      if (
        input.value.trim()
      ) {

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


/* =========================================================
   CREATE NEW PARTY / BRANCH
   ========================================================= */

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

    suggestions.hidden =
      true;


    const response =
      await fetch(

        SUPABASE_URL +
        "/rest/v1/" +
        table,

        {

          method: "POST",

          headers: {

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              "Bearer " +
              token,

            "Content-Type":
              "application/json",

            "Prefer":
              "return=representation"

          },

          body:
            JSON.stringify({

              name:
                name,

              is_active:
                true

            })

        }

      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "CREATE ERROR:",
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
          data.details ||
          "UNABLE TO CREATE " +
          label.toUpperCase() +
          "."

        );

      }


      return;

    }


    if (
      !data ||
      !data.length
    ) {

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


    /*
       Refresh datalist in background.
    */

    if (
      table === "parties"
    ) {

      loadParties();

    }


    if (
      table === "branches"
    ) {

      loadBranches();

    }


  } catch (error) {

    console.error(
      "CREATE RECORD ERROR:",
      error
    );


    alert(
      "ERROR CREATING " +
      label.toUpperCase() +
      "."
    );

  }

}


/* =========================================================
   START SMART SEARCH
   ========================================================= */

setupSmartSearch({

  inputId:
    "party-name",

  hiddenId:
    "party-id",

  suggestionsId:
    "party-suggestions",

  table:
    "parties",

  label:
    "party"

});


setupSmartSearch({

  inputId:
    "branch-name",

  hiddenId:
    "branch-id",

  suggestionsId:
    "branch-suggestions",

  table:
    "branches",

  label:
    "branch"

});


/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

document
  .querySelectorAll(
    ".nav-link"
  )
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const pageName =
            button.dataset.page;


          document
            .querySelectorAll(
              ".page"
            )
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
            .querySelectorAll(
              ".nav-link"
            )
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
        .querySelectorAll(
          ".page"
        )
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
        .querySelectorAll(
          ".nav-link"
        )
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
   END OF APP.JS
   ========================================================= */
