/* =========================================================
   CHENNAI GOODS MANAGEMENT
   COMPLETE APP.JS
   ========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
  "https://yonxttybnkvxwnbhzwyi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_EC6Tm1kbWuPEPtfeeJED9Q_6dbqOZVh";


/* =========================================================
   GLOBAL ELEMENTS
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

let accessToken =
  sessionStorage.getItem("chennai_access_token");


/* =========================================================
   UTILITY
   ========================================================= */

function normalizeUppercase(value) {

  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatAmount(value) {

  const number =
    Number(value || 0);

  return number.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

}


function formatDate(value) {

  if (!value) {
    return "-";
  }

  const parts =
    String(value).split("-");

  if (parts.length !== 3) {
    return value;
  }

  return (
    parts[2] +
    "-" +
    parts[1] +
    "-" +
    parts[0]
  );

}


/* =========================================================
   SUPABASE HEADERS
   ========================================================= */

function supabaseHeaders() {

  const token =
    sessionStorage.getItem(
      "chennai_access_token"
    );

  return {

    "apikey":
      SUPABASE_KEY,

    "Authorization":
      "Bearer " + (token || accessToken || ""),

    "Content-Type":
      "application/json"

  };

}


/* =========================================================
   SUPABASE API HELPER
   ========================================================= */

async function api(
  endpoint,
  options = {}
) {

  const response =
    await fetch(
      SUPABASE_URL + endpoint,
      {
        ...options,
        headers: {
          ...supabaseHeaders(),
          ...(options.headers || {})
        }
      }
    );


  const text =
    await response.text();


  let data = null;

  if (text) {

    try {

      data =
        JSON.parse(text);

    } catch {

      data =
        text;

    }

  }


  if (!response.ok) {

    console.error(
      "SUPABASE API ERROR:",
      endpoint,
      data
    );


    const message =
      data?.message ||
      data?.details ||
      data?.hint ||
      data?.error_description ||
      data?.error ||
      "SUPABASE REQUEST FAILED.";

    throw new Error(message);

  }


  return data;

}


/* =========================================================
   LOGIN SCREEN
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


async function showApp() {

  if (loginScreen) {

    loginScreen.hidden = true;
    loginScreen.style.display = "none";

  }


  if (appShell) {

    appShell.hidden = false;
    appShell.style.display = "block";

  }


  await loadAllData();

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
          ?.value
          .trim();


      const password =
        document
          .getElementById("login-password")
          ?.value;


      if (!password) {

        loginMessage.textContent =
          "PLEASE ENTER YOUR PASSWORD.";

        return;

      }


      loginButton.disabled = true;
      loginButton.textContent =
        "SIGNING IN...";

      loginMessage.textContent =
        "PLEASE WAIT...";


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

              body:
                JSON.stringify({
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
            "LOGIN FAILED."
          );

        }


        if (!data.access_token) {

          throw new Error(
            "NO LOGIN TOKEN WAS RETURNED."
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


        await showApp();


        console.log(
          "LOGIN SUCCESSFUL"
        );


      } catch (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );


        loginMessage.textContent =
          String(
            error.message
          ).toUpperCase();


      } finally {

        loginButton.disabled =
          false;

        loginButton.textContent =
          "SIGN IN";

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

      accessToken =
        null;


      sessionStorage.removeItem(
        "chennai_access_token"
      );


      const passwordInput =
        document.getElementById(
          "login-password"
        );


      if (passwordInput) {

        passwordInput.value =
          "";

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


  try {

    const parties =
      await api(
        "/rest/v1/parties" +
        "?select=id,name,phone" +
        "&is_active=eq.true" +
        "&order=name.asc" +
        "&limit=1000"
      );


    partyList.innerHTML =
      "";


    (parties || []).forEach(
      function (party) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          normalizeUppercase(
            party.name
          );


        partyList.appendChild(
          option
        );

      }
    );


    console.log(
      "PARTIES LOADED:",
      parties?.length || 0
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


  try {

    const branches =
      await api(
        "/rest/v1/branches" +
        "?select=id,name" +
        "&is_active=eq.true" +
        "&order=name.asc" +
        "&limit=1000"
      );


    branchList.innerHTML =
      "";


    (branches || []).forEach(
      function (branch) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          normalizeUppercase(
            branch.name
          );


        branchList.appendChild(
          option
        );

      }
    );


    console.log(
      "BRANCHES LOADED:",
      branches?.length || 0
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

  const name =
    normalizeUppercase(
      partyName
    );


  const encoded =
    encodeURIComponent(name);


  const data =
    await api(
      "/rest/v1/parties" +
      "?select=id,name" +
      "&name=eq." +
      encoded +
      "&is_active=eq.true" +
      "&limit=1"
    );


  if (!data || !data.length) {

    throw new Error(
      "PARTY NOT FOUND. PLEASE CREATE THE PARTY FIRST."
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

  const name =
    normalizeUppercase(
      branchName
    );


  const encoded =
    encodeURIComponent(name);


  const data =
    await api(
      "/rest/v1/branches" +
      "?select=id,name" +
      "&name=eq." +
      encoded +
      "&is_active=eq.true" +
      "&limit=1"
    );


  if (!data || !data.length) {

    throw new Error(
      "BRANCH NOT FOUND. PLEASE CREATE THE BRANCH FIRST."
    );

  }


  return data[0].id;

}


/* =========================================================
   CREATE PARTY
   ========================================================= */

async function createParty(
  name
) {

  const partyName =
    normalizeUppercase(
      name
    );


  if (!partyName) {

    throw new Error(
      "PLEASE ENTER PARTY NAME."
    );

  }


  const existing =
    await api(
      "/rest/v1/parties" +
      "?select=id,name" +
      "&name=eq." +
      encodeURIComponent(
        partyName
      ) +
      "&limit=1"
    );


  if (existing?.length) {

    return existing[0];

  }


  const data =
    await api(
      "/rest/v1/parties",
      {
        method: "POST",

        headers: {
          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify({
            name:
              partyName,

            is_active:
              true
          })
      }
    );


  return data[0];

}


/* =========================================================
   CREATE BRANCH
   ========================================================= */

async function createBranch(
  name
) {

  const branchName =
    normalizeUppercase(
      name
    );


  if (!branchName) {

    throw new Error(
      "PLEASE ENTER BRANCH NAME."
    );

  }


  const existing =
    await api(
      "/rest/v1/branches" +
      "?select=id,name" +
      "&name=eq." +
      encodeURIComponent(
        branchName
      ) +
      "&limit=1"
    );


  if (existing?.length) {

    return existing[0];

  }


  const data =
    await api(
      "/rest/v1/branches",
      {
        method: "POST",

        headers: {
          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify({
            name:
              branchName,

            is_active:
              true
          })
      }
    );


  return data[0];

}


/* =========================================================
   PARTY / BRANCH SMART INPUT
   ========================================================= */

function setupSmartInput(
  inputId,
  table,
  label
) {

  const input =
    document.getElementById(
      inputId
    );


  if (!input) {
    return;
  }


  input.addEventListener(
    "input",
    async function () {

      input.value =
        normalizeUppercase(
          input.value
        );


      const searchText =
        input.value.trim();


      if (!searchText) {
        return;
      }


      try {

        const rows =
          await api(
            "/rest/v1/" +
            table +
            "?select=id,name" +
            "&name=ilike.*" +
            encodeURIComponent(
              searchText
            ) +
            "*" +
            "&is_active=eq.true" +
            "&order=name.asc" +
            "&limit=10"
          );


        console.log(
          label.toUpperCase() +
          " SEARCH:",
          rows
        );


        /*
         * Native datalist is used when available.
         */

        const listId =
          table === "parties"
            ? "party-list"
            : "branch-list";


        const list =
          document.getElementById(
            listId
          );


        if (list) {

          list.innerHTML =
            "";


          (rows || []).forEach(
            function (row) {

              const option =
                document.createElement(
                  "option"
                );


              option.value =
                normalizeUppercase(
                  row.name
                );


              list.appendChild(
                option
              );

            }
          );

        }


      } catch (error) {

        console.error(
          label.toUpperCase() +
          " SEARCH ERROR:",
          error
        );

      }

    }
  );


  input.addEventListener(
    "blur",
    function () {

      input.value =
        normalizeUppercase(
          input.value
        );

    }
  );

}


/* =========================================================
   INITIALISE SMART INPUTS
   ========================================================= */

setupSmartInput(
  "party-name",
  "parties",
  "party"
);


setupSmartInput(
  "branch-name",
  "branches",
  "branch"
);


/* =========================================================
   RECEIVE GOODS
   ========================================================= */

if (shipmentForm) {

  shipmentForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


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


      if (!receivedDate) {

        formMessage.textContent =
          "PLEASE SELECT RECEIVED DATE.";

        return;

      }


      if (!lrNumber) {

        formMessage.textContent =
          "PLEASE ENTER LR NUMBER.";

        return;

      }


      if (!partyName) {

        formMessage.textContent =
          "PLEASE ENTER PARTY NAME.";

        return;

      }


      if (!branchName) {

        formMessage.textContent =
          "PLEASE ENTER FROM BRANCH.";

        return;

      }


      if (
        !quantity ||
        Number(quantity) <= 0
      ) {

        formMessage.textContent =
          "PLEASE ENTER A VALID QUANTITY.";

        return;

      }


      if (
        amount === "" ||
        Number(amount) < 0
      ) {

        formMessage.textContent =
          "PLEASE ENTER A VALID AMOUNT.";

        return;

      }


      if (
        ![
          "TOPAY",
          "TBB",
          "PAID"
        ].includes(paymentType)
      ) {

        formMessage.textContent =
          "PLEASE SELECT A VALID PAYMENT TYPE.";

        return;

      }


      const token =
        sessionStorage.getItem(
          "chennai_access_token"
        );


      if (!token) {

        formMessage.textContent =
          "YOUR LOGIN SESSION HAS EXPIRED. PLEASE SIGN IN AGAIN.";

        showLogin();

        return;

      }


      const saveButton =
        shipmentForm.querySelector(
          'button[type="submit"]'
        );


      saveButton.disabled =
        true;


      saveButton.textContent =
        "SAVING...";


      formMessage.textContent =
        "SAVING GOODS RECEIPT...";


      try {

        const partyId =
          await findPartyId(
            partyName
          );


        const branchId =
          await findBranchId(
            branchName
          );


        const data =
          await api(
            "/rest/v1/shipments",
            {
              method: "POST",

              headers: {
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


        if (
          !data ||
          !Array.isArray(data) ||
          !data.length
        ) {

          throw new Error(
            "SAVE RESPONSE WAS EMPTY. PLEASE CHECK SUPABASE."
          );

        }


        const shipment =
          data[0];


        /*
         * RECEIVED EVENT
         */

        try {

          await api(
            "/rest/v1/shipment_events",
            {
              method: "POST",

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

        } catch (eventError) {

          console.warn(
            "RECEIVED EVENT ERROR:",
            eventError
          );

        }


        formMessage.textContent =
          "RECEIVE GOODS SAVED SUCCESSFULLY — SERIAL NO. " +
          shipment.serial_no;


        shipmentForm.reset();


        await loadAllData();


      } catch (error) {

        console.error(
          "RECEIVE GOODS ERROR:",
          error
        );


        formMessage.textContent =
          String(
            error.message ||
            "ERROR SAVING GOODS RECEIPT."
          ).toUpperCase();


      } finally {

        saveButton.disabled =
          false;

        saveButton.textContent =
          "SAVE GOODS RECEIPT";

      }

    }
  );

}


/* =========================================================
   SHIPMENT STATUS
   ========================================================= */

function getShipmentStatus(
  shipment
) {

  if (
    shipment.accounts_date
  ) {

    return "ACCOUNTS COMPLETED";

  }


  if (
    shipment.delivery_date
  ) {

    if (
      shipment.payment_type ===
      "TOPAY"
    ) {

      return "DELIVERED - ACCOUNTS PENDING";

    }


    return "COMPLETED";

  }


  return "PENDING DELIVERY";

}


/* =========================================================
   PARTY NAME
   ========================================================= */

function partyName(
  shipment
) {

  return (
    shipment.parties?.name ||
    shipment.party?.name ||
    shipment.party_name ||
    "-"
  );

}


/* =========================================================
   BRANCH NAME
   ========================================================= */

function branchName(
  shipment
) {

  return (
    shipment.branches?.name ||
    shipment.branch?.name ||
    shipment.branch_name ||
    "-"
  );

}


/* =========================================================
   PAYMENT LABEL
   ========================================================= */

function paymentLabel(
  type
) {

  const labels = {

    TOPAY:
      "TOPAY",

    TBB:
      "TBB",

    PAID:
      "PAID"

  };


  return (
    labels[type] ||
    type ||
    "-"
  );

}


/* =========================================================
   SHIPMENT TABLE
   ========================================================= */

function shipmentTable(
  shipments,
  emptyMessage
) {

  if (
    !shipments ||
    !shipments.length
  ) {

    return `
      <p class="empty">
        ${escapeHtml(
          emptyMessage ||
          "NO SHIPMENTS FOUND."
        )}
      </p>
    `;

  }


  let html = `

    <div class="table-scroll">

      <table class="data-table">

        <thead>

          <tr>

            <th>
              SERIAL
            </th>

            <th>
              LR NUMBER
            </th>

            <th>
              RECEIVED
            </th>

            <th>
              PARTY
            </th>

            <th>
              FROM BRANCH
            </th>

            <th>
              QTY
            </th>

            <th>
              AMOUNT
            </th>

            <th>
              PAYMENT
            </th>

            <th>
              STATUS
            </th>

            <th>
              ACTION
            </th>

          </tr>

        </thead>

        <tbody>

  `;


  shipments.forEach(
    function (shipment, index) {

      const status =
        getShipmentStatus(
          shipment
        );


      html += `

        <tr>

          <td>
            ${escapeHtml(
              shipment.serial_no ??
              index + 1
            )}
          </td>

          <td>
            <strong>
              ${escapeHtml(
                shipment.lr_number
              )}
            </strong>
          </td>

          <td>
            ${formatDate(
              shipment.received_date
            )}
          </td>

          <td>
            ${escapeHtml(
              partyName(shipment)
            )}
          </td>

          <td>
            ${escapeHtml(
              branchName(shipment)
            )}
          </td>

          <td>
            ${escapeHtml(
              shipment.quantity
            )}
          </td>

          <td>
            ₹${formatAmount(
              shipment.amount
            )}
          </td>

          <td>
            ${escapeHtml(
              paymentLabel(
                shipment.payment_type
              )
            )}
          </td>

          <td>
            ${escapeHtml(
              status
            )}
          </td>

          <td>

            ${
              !shipment.delivery_date
                ? `
                  <button
                    class="small-button"
                    data-action="delivery"
                    data-id="${escapeHtml(
                      shipment.id
                    )}"
                  >
                    DELIVER
                  </button>
                `
                : ""
            }

            ${
              shipment.delivery_date &&
              shipment.payment_type ===
                "TOPAY" &&
              !shipment.accounts_date
                ? `
                  <button
                    class="small-button"
                    data-action="accounts"
                    data-id="${escapeHtml(
                      shipment.id
                    )}"
                  >
                    ACCOUNTS
                  </button>
                `
                : ""
            }

            <button
              class="small-button"
              data-action="edit"
              data-id="${escapeHtml(
                shipment.id
              )}"
            >
              EDIT
            </button>

            <button
              class="small-button"
              data-action="delete"
              data-id="${escapeHtml(
                shipment.id
              )}"
            >
              DELETE
            </button>

            ${
              shipment.delivery_date
                ? `
                  <button
                    class="small-button"
                    data-action="undeliver"
                    data-id="${escapeHtml(
                      shipment.id
                    )}"
                  >
                    UNDELIVER
                  </button>
                `
                : ""
            }

          </td>

        </tr>

      `;

    }
  );


  html += `

        </tbody>

      </table>

    </div>

  `;


  return html;

}


/* =========================================================
   RECENT TABLE
   ========================================================= */

function renderRecentTable(
  shipments
) {

  const container =
    document.getElementById(
      "recent-table"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    shipmentTable(
      shipments,
      "NO RECENT SHIPMENTS."
    );

}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

  const shipments =
    window.allShipments ||
    [];


  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  const receivedToday =
    shipments.filter(
      shipment =>
        shipment.received_date ===
        today
    ).length;


  const pendingDelivery =
    shipments.filter(
      shipment =>
        !shipment.delivery_date
    ).length;


  const accountsPending =
    shipments.filter(
      shipment =>
        shipment.payment_type ===
          "TOPAY" &&
        shipment.delivery_date &&
        !shipment.accounts_date
    ).length;


  const completedToday =
    shipments.filter(
      shipment => {

        if (
          shipment.payment_type ===
          "TOPAY"
        ) {

          return (
            shipment.accounts_date ===
            today
          );

        }


        return (
          shipment.delivery_date ===
          today
        );

      }
    ).length;


  const receivedElement =
    document.getElementById(
      "stat-received"
    );


  const deliveryElement =
    document.getElementById(
      "stat-delivery"
    );


  const accountsElement =
    document.getElementById(
      "stat-accounts"
    );


  const completedElement =
    document.getElementById(
      "stat-completed"
    );


  if (receivedElement) {

    receivedElement.textContent =
      receivedToday;

  }


  if (deliveryElement) {

    deliveryElement.textContent =
      pendingDelivery;

  }


  if (accountsElement) {

    accountsElement.textContent =
      accountsPending;

  }


  if (completedElement) {

    completedElement.textContent =
      completedToday;

  }


  renderRecentTable(
    shipments.slice(
      0,
      10
    )
  );

}


/* =========================================================
   LOAD SHIPMENTS
   ========================================================= */

async function loadShipments() {

  const data =
    await api(
      "/rest/v1/shipments" +
      "?select=*" +
      "&order=created_at.desc" +
      "&limit=5000"
    );


  window.allShipments =
    data || [];


  return (
    window.allShipments
  );

}


/* =========================================================
   DELIVERY TABLE
   ========================================================= */

function renderDeliveryTable(
  shipments
) {

  const container =
    document.getElementById(
      "delivery-table"
    );


  if (!container) {
    return;
  }


  const pending =
    (shipments || []).filter(
      shipment =>
        !shipment.delivery_date
    );


  container.innerHTML =
    shipmentTable(
      pending,
      "NO SHIPMENTS PENDING DELIVERY."
    );

}


/* =========================================================
   ACCOUNTS TABLE
   ========================================================= */

function renderAccountsTable(
  shipments
) {

  const container =
    document.getElementById(
      "accounts-table"
    );


  if (!container) {
    return;
  }


  const pending =
    (shipments || []).filter(
      shipment =>
        shipment.payment_type ===
          "TOPAY" &&
        shipment.delivery_date &&
        !shipment.accounts_date
    );


  container.innerHTML =
    shipmentTable(
      pending,
      "NO TOPAY SHIPMENTS PENDING ACCOUNTS."
    );

}


/* =========================================================
   ALL SHIPMENTS TABLE
   ========================================================= */

function renderAllTable(
  shipments
) {

  const container =
    document.getElementById(
      "all-table"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    shipmentTable(
      shipments,
      "NO SHIPMENTS FOUND."
    );

}


/* =========================================================
   STOCK
   ========================================================= */

function renderStockTable(
  shipments
) {

  const container =
    document.getElementById(
      "stock-table"
    );


  if (!container) {
    return;
  }


  /*
   * CURRENT STOCK =
   * GOODS RECEIVED BUT NOT DELIVERED
   */

  const stock =
    shipments.filter(
      shipment =>
        !shipment.delivery_date
    );


  if (!stock.length) {

    container.innerHTML = `
      <p class="empty">
        NO GOODS CURRENTLY IN STOCK.
      </p>
    `;

    return;

  }


  let totalQuantity = 0;


  stock.forEach(
    shipment => {

      totalQuantity +=
        Number(
          shipment.quantity || 0
        );

    }
  );


  container.innerHTML = `

    <div class="stats-grid">

      <article class="stat-card">

        <span>
          TOTAL SHIPMENTS IN STOCK
        </span>

        <strong>
          ${stock.length}
        </strong>

      </article>

      <article class="stat-card">

        <span>
          TOTAL QUANTITY IN STOCK
        </span>

        <strong>
          ${totalQuantity}
        </strong>

      </article>

    </div>


    ${shipmentTable(
      stock,
      "NO GOODS CURRENTLY IN STOCK."
    )}

  `;

}


/* =========================================================
   DELIVERY ACTION
   ========================================================= */

async function markDelivered(
  shipmentId
) {

  const shipment =
    window.allShipments.find(
      item =>
        String(item.id) ===
        String(shipmentId)
    );


  if (!shipment) {

    alert(
      "SHIPMENT NOT FOUND."
    );

    return;

  }


  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  try {

    await api(
      "/rest/v1/shipments?id=eq." +
      encodeURIComponent(
        shipmentId
      ),
      {
        method: "PATCH",

        headers: {
          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify({
            delivery_date:
              today
          })

      }
    );


    /*
     * Delivery event
     */

    try {

      await api(
        "/rest/v1/shipment_events",
        {
          method: "POST",

          body:
            JSON.stringify({

              shipment_id:
                shipmentId,

              event_type:
                "DELIVERED",

              event_date:
                today,

              notes:
                null

            })
        }
      );

    } catch (eventError) {

      console.warn(
        "DELIVERY EVENT ERROR:",
        eventError
      );

    }


    await loadAllData();


    alert(
      "DELIVERY RECORDED SUCCESSFULLY."
    );


  } catch (error) {

    console.error(
      "DELIVERY ERROR:",
      error
    );


    alert(
      String(
        error.message
      ).toUpperCase()
    );

  }

}


/* =========================================================
   MARK ACCOUNTS COMPLETED
   ONLY TOPAY
   ========================================================= */

async function markAccountsCompleted(
  shipmentId
) {

  const shipment =
    window.allShipments.find(
      item =>
        String(item.id) ===
        String(shipmentId)
    );


  if (!shipment) {

    alert(
      "SHIPMENT NOT FOUND."
    );

    return;

  }


  /*
   * SAFETY CHECK
   */

  if (
    shipment.payment_type !==
    "TOPAY"
  ) {

    alert(
      "ONLY TOPAY SHIPMENTS CAN MOVE TO ACCOUNTS."
    );

    return;

  }


  if (
    !shipment.delivery_date
  ) {

    alert(
      "SHIPMENT MUST BE DELIVERED BEFORE ACCOUNTS."
    );

    return;

  }


  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  try {

    await api(
      "/rest/v1/shipments?id=eq." +
      encodeURIComponent(
        shipmentId
      ),
      {
        method: "PATCH",

        headers: {
          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify({
            accounts_date:
              today
          })

      }
    );


    /*
     * Accounts event
     */

    try {

      await api(
        "/rest/v1/shipment_events",
        {
          method: "POST",

          body:
            JSON.stringify({

              shipment_id:
                shipmentId,

              event_type:
                "ACCOUNTS",

              event_date:
                today,

              notes:
                null

            })
        }
      );

    } catch (eventError) {

      console.warn(
        "ACCOUNTS EVENT ERROR:",
        eventError
      );

    }


    await loadAllData();


    alert(
      "ACCOUNTS COMPLETED SUCCESSFULLY."
    );


  } catch (error) {

    console.error(
      "ACCOUNTS ERROR:",
      error
    );


    alert(
      String(
        error.message
      ).toUpperCase()
    );

  }

}


/* =========================================================
   EDIT SHIPMENT
   ========================================================= */

async function editShipment(
  shipmentId
) {

  const shipment =
    window.allShipments.find(
      item =>
        String(item.id) ===
        String(shipmentId)
    );


  if (!shipment) {

    alert(
      "SHIPMENT NOT FOUND."
    );

    return;

  }


  const lrNumber =
    prompt(
      "LR NUMBER:",
      shipment.lr_number ||
      ""
    );


  if (lrNumber === null) {
    return;
  }


  const receivedDate =
    prompt(
      "RECEIVED DATE (YYYY-MM-DD):",
      shipment.received_date ||
      ""
    );


  if (receivedDate === null) {
    return;
  }


  const quantity =
    prompt(
      "QUANTITY:",
      shipment.quantity ??
      ""
    );


  if (quantity === null) {
    return;
  }


  const amount =
    prompt(
      "AMOUNT:",
      shipment.amount ??
      ""
    );


  if (amount === null) {
    return;
  }


  const paymentType =
    prompt(
      "PAYMENT TYPE (TOPAY / TBB / PAID):",
      shipment.payment_type ||
      "TOPAY"
    );


  if (paymentType === null) {
    return;
  }


  const remarks =
    prompt(
      "REMARKS:",
      shipment.remarks ||
      ""
    );


  if (remarks === null) {
    return;
  }


  const cleanPaymentType =
    normalizeUppercase(
      paymentType
    );


  if (
    ![
      "TOPAY",
      "TBB",
      "PAID"
    ].includes(
      cleanPaymentType
    )
  ) {

    alert(
      "PAYMENT TYPE MUST BE TOPAY, TBB OR PAID."
    );

    return;

  }


  if (!receivedDate) {

    alert(
      "RECEIVED DATE IS REQUIRED."
    );

    return;

  }


  if (!lrNumber.trim()) {

    alert(
      "LR NUMBER IS REQUIRED."
    );

    return;

  }


  if (
    !quantity ||
    Number(quantity) <= 0
  ) {

    alert(
      "QUANTITY MUST BE GREATER THAN ZERO."
    );

    return;

  }


  if (
    amount === "" ||
    Number(amount) < 0
  ) {

    alert(
      "AMOUNT CANNOT BE NEGATIVE."
    );

    return;

  }


  try {

    await api(
      "/rest/v1/shipments?id=eq." +
      encodeURIComponent(
        shipmentId
      ),
      {
        method: "PATCH",

        headers: {
          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify({

            lr_number:
              normalizeUppercase(
                lrNumber
              ),

            received_date:
              receivedDate,

            quantity:
              Number(quantity),

            amount:
              Number(amount),

            payment_type:
              cleanPaymentType,

            remarks:
              normalizeUppercase(
                remarks
              ) || null

          })

      }
    );


    await loadAllData();


    alert(
      "SHIPMENT UPDATED SUCCESSFULLY."
    );


  } catch (error) {

    console.error(
      "EDIT SHIPMENT ERROR:",
      error
    );


    alert(
      String(
        error.message ||
        "UNABLE TO UPDATE SHIPMENT."
      ).toUpperCase()
    );

  }

}


/* =========================================================
   DELETE SHIPMENT
   ========================================================= */

async function deleteShipment(
  shipmentId
) {

  const shipment =
    window.allShipments.find(
      item =>
        String(item.id) ===
        String(shipmentId)
    );


  if (!shipment) {

    alert(
      "SHIPMENT NOT FOUND."
    );

    return;

  }


  const confirmed =
    confirm(
      "DELETE LR " +
      String(
        shipment.lr_number ||
        ""
      ) +
      "?\n\nTHIS CANNOT BE UNDONE."
    );


  if (!confirmed) {
    return;
  }


  try {

    await api(
      "/rest/v1/shipment_events?shipment_id=eq." +
      encodeURIComponent(
        shipmentId
      ),
      {
        method: "DELETE"
      }
    );


    await api(
      "/rest/v1/shipments?id=eq." +
      encodeURIComponent(
        shipmentId
      ),
      {
        method: "DELETE"
      }
    );


    await loadAllData();


    alert(
      "SHIPMENT DELETED SUCCESSFULLY."
    );


  } catch (error) {

    console.error(
      "DELETE SHIPMENT ERROR:",
      error
    );


    alert(
      String(
        error.message ||
        "UNABLE TO DELETE SHIPMENT."
      ).toUpperCase()
    );

  }

}


/* =========================================================
   UNDELIVER SHIPMENT
   ========================================================= */

async function undeliverShipment(
  shipmentId
) {

  const shipment =
    window.allShipments.find(
      item =>
        String(item.id) ===
        String(shipmentId)
    );


  if (!shipment) {

    alert(
      "SHIPMENT NOT FOUND."
    );

    return;

  }


  if (
    !shipment.delivery_date
  ) {

    alert(
      "THIS SHIPMENT IS NOT DELIVERED."
    );

    return;

  }


  const confirmed =
    confirm(
      "UNDO DELIVERY FOR LR " +
      String(
        shipment.lr_number ||
        ""
      ) +
      "?\n\nTHE SHIPMENT WILL RETURN TO DELIVERY."
    );


  if (!confirmed) {
    return;
  }


  try {

    await api(
      "/rest/v1/shipments?id=eq." +
      encodeURIComponent(
        shipmentId
      ),
      {
        method: "PATCH",

        headers: {
          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify({

            delivery_date:
              null,

            accounts_date:
              null

          })

      }
    );


    await loadAllData();


    alert(
      "DELIVERY UNDONE SUCCESSFULLY."
    );


  } catch (error) {

    console.error(
      "UNDELIVER ERROR:",
      error
    );


    alert(
      String(
        error.message ||
        "UNABLE TO UNDELIVER SHIPMENT."
      ).toUpperCase()
    );

  }

}


/* =========================================================
   TABLE ACTIONS
   ========================================================= */

document.addEventListener(
  "click",
  async function (event) {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) {
      return;
    }


    const action =
      button.dataset.action;


    const id =
      button.dataset.id;


    if (action === "delivery") {

      await markDelivered(
        id
      );

    }


    if (action === "accounts") {

      await markAccountsCompleted(
        id
      );

    }


    if (action === "edit") {

      await editShipment(
        id
      );

    }


    if (action === "delete") {

      await deleteShipment(
        id
      );

    }


    if (action === "undeliver") {

      await undeliverShipment(
        id
      );

    }

  }
);


/* =========================================================
   SEARCH TABLES
   ========================================================= */

function setupShipmentSearch() {

  document
    .querySelectorAll(
      ".search-input"
    )
    .forEach(
      function (input) {

        input.addEventListener(
          "input",
          function () {

            const search =
              normalizeUppercase(
                input.value
              );


            const type =
              input.dataset.search;


            let source =
              window.allShipments ||
              [];


            if (
              type ===
              "delivery"
            ) {

              source =
                source.filter(
                  shipment =>
                    !shipment.delivery_date
                );

            }


            if (
              type ===
              "accounts"
            ) {

              source =
                source.filter(
                  shipment =>
                    shipment.payment_type ===
                      "TOPAY" &&
                    shipment.delivery_date &&
                    !shipment.accounts_date
                );

            }


            if (!search) {

              renderSearchResult(
                type,
                source
              );

              return;

            }


            source =
              source.filter(
                function (shipment) {

                  const text = (

                    String(
                      shipment.lr_number ||
                      ""
                    ) +

                    " " +

                    partyName(
                      shipment
                    ) +

                    " " +

                    branchName(
                      shipment
                    ) +

                    " " +

                    paymentLabel(
                      shipment.payment_type
                    )

                  ).toUpperCase();


                  return text.includes(
                    search
                  );

                }
              );


            renderSearchResult(
              type,
              source
            );

          }
        );

      }
    );

}


/* =========================================================
   SEARCH RESULT
   ========================================================= */

function renderSearchResult(
  type,
  shipments
) {

  if (
    type ===
    "delivery"
  ) {

    const container =
      document.getElementById(
        "delivery-table"
      );


    if (container) {

      container.innerHTML =
        shipmentTable(
          shipments,
          "NO MATCHING SHIPMENTS."
        );

    }

  }


  if (
    type ===
    "accounts"
  ) {

    const container =
      document.getElementById(
        "accounts-table"
      );


    if (container) {

      container.innerHTML =
        shipmentTable(
          shipments,
          "NO MATCHING TOPAY SHIPMENTS."
        );

    }

  }


  if (
    type ===
    "all"
  ) {

    const container =
      document.getElementById(
        "all-table"
      );


    if (container) {

      container.innerHTML =
        shipmentTable(
          shipments,
          "NO MATCHING SHIPMENTS."
        );

    }

  }

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showPage(
  pageName
) {

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


  const page =
    document.getElementById(
      pageName
    );


  if (page) {

    page.classList.add(
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


  const nav =
    document.querySelector(
      '[data-page="' +
      pageName +
      '"]'
    );


  if (nav) {

    nav.classList.add(
      "active"
    );

  }


  const titles = {

    dashboard:
      "GOOD MORNING",

    receive:
      "RECEIVE GOODS",

    delivery:
      "DELIVERY",

    accounts:
      "ACCOUNTS",

    all:
      "ALL SHIPMENTS",

    stock:
      "GODOWN STOCK"

  };


  const pageTitle =
    document.getElementById(
      "page-title"
    );


  if (pageTitle) {

    pageTitle.textContent =
      titles[pageName] ||
      "GOODS MANAGEMENT";

  }


  if (
    pageName ===
    "dashboard"
  ) {

    loadDashboard();

  }


  if (
    pageName ===
    "delivery"
  ) {

    renderDeliveryTable(
      window.allShipments ||
      []
    );

  }


  if (
    pageName ===
    "accounts"
  ) {

    renderAccountsTable(
      window.allShipments ||
      []
    );

  }


  if (
    pageName ===
    "all"
  ) {

    renderAllTable(
      window.allShipments ||
      []
    );

  }


  if (
    pageName ===
    "stock"
  ) {

    renderStockTable(
      window.allShipments ||
      []
    );

  }

}


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

          showPage(
            button.dataset.page
          );

        }
      );

    }
  );


/* =========================================================
   RECEIVE BUTTON
   ========================================================= */

const receiveButton =
  document.getElementById(
    "receive-button"
  );


if (receiveButton) {

  receiveButton.addEventListener(
    "click",
    function () {

      showPage(
        "receive"
      );

    }
  );

}


/* =========================================================
   VIEW ALL BUTTONS
   ========================================================= */

document
  .querySelectorAll(
    "[data-go]"
  )
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          showPage(
            button.dataset.go
          );

        }
      );

    }
  );


/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadAllData() {

  try {

    await Promise.all([
      loadParties(),
      loadBranches()
    ]);


    await loadShipments();


    await loadDashboard();


    renderDeliveryTable(
      window.allShipments
    );


    renderAccountsTable(
      window.allShipments
    );


    renderAllTable(
      window.allShipments
    );


    renderStockTable(
      window.allShipments
    );


    setupShipmentSearch();


  } catch (error) {

    console.error(
      "DASHBOARD LOAD FAILED:",
      error
    );

  }

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
   DASHBOARD
========================================================= */



/* =========================================================
   RECENT SHIPMENTS
========================================================= */

function renderRecentShipments(shipments) {

  const container =
    document.getElementById("recent-table");

  if (!container) {
    return;
  }


  if (!shipments || shipments.length === 0) {

    container.innerHTML =
      '<p class="empty">No shipments found.</p>';

    return;
  }


  const recent =
    shipments.slice(0, 10);


  container.innerHTML = "";


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "table-responsive";


  const table =
    document.createElement("table");

  table.className =
    "data-table";


  table.innerHTML = `
    <thead>
      <tr>
        <th>LR No.</th>
        <th>Party</th>
        <th>From</th>
        <th>Qty</th>
        <th>Amount</th>
        <th>Payment</th>
        <th>Status</th>
      </tr>
    </thead>
  `;


  const tbody =
    document.createElement("tbody");


  recent.forEach(function (shipment) {

    const row =
      document.createElement("tr");


    const status =
      getShipmentStatus(shipment);


    row.innerHTML = `
      <td>
        <strong>
          ${escapeHtml(
            shipment.lr_number || "-"
          )}
        </strong>
      </td>

      <td>
        ${escapeHtml(
          shipment.parties?.name || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          shipment.branches?.name || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          String(shipment.quantity ?? "-")
        )}
      </td>

      <td>
        ₹${formatAmount(shipment.amount)}
      </td>

      <td>
        ${paymentLabel(
          shipment.payment_type
        )}
      </td>

      <td>
        ${statusBadge(status)}
      </td>
    `;


    tbody.appendChild(row);

  });


  table.appendChild(tbody);

  wrapper.appendChild(table);

  container.appendChild(wrapper);
}


/* =========================================================
   LOAD ALL SHIPMENTS
========================================================= */

async function loadShipments() {

  try {

    const shipments =
      await getShipments();


    renderDeliveryTable(
      shipments
    );

    renderAccountsTable(
      shipments
    );

    renderAllShipmentsTable(
      shipments
    );

    renderStockTable(
      shipments
    );


  } catch (error) {

    console.error(
      "SHIPMENTS LOAD FAILED:",
      error
    );

  }
}


/* =========================================================
   GET SHIPMENTS
========================================================= */

async function getShipments() {

  const token =
    sessionStorage.getItem(
      "chennai_access_token"
    );


  if (!token) {

    throw new Error(
      "Login session expired."
    );

  }


  const url =
    SUPABASE_URL +
    "/rest/v1/shipments" +
    "?select=*" +
    ",parties(id,name,phone)" +
    ",branches(id,name)" +
    "&order=created_at.desc";


  const response =
    await fetch(
      url,
      {
        method: "GET",

        headers: {
          "apikey":
            SUPABASE_KEY,

          "Authorization":
            "Bearer " + token,

          "Content-Type":
            "application/json"
        }
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "GET SHIPMENTS ERROR:",
      data
    );


    /*
     * If token expired, send user
     * back to login.
     */
    if (
      response.status === 401 ||
      response.status === 403
    ) {

      accessToken = null;

      sessionStorage.removeItem(
        "chennai_access_token"
      );

      showLogin();

    }


    throw new Error(
      data.message ||
      data.details ||
      data.hint ||
      "Could not load shipments."
    );

  }


  return Array.isArray(data)
    ? data
    : [];
}


/* =========================================================
   SHIPMENT STATUS
========================================================= */

function getShipmentStatus(shipment) {

  /*
   * TOPAY:
   *
   * Received
   *    ↓
   * Delivery
   *    ↓
   * Accounts
   *    ↓
   * Completed
   */

  if (
    shipment.payment_type === "TOPAY"
  ) {

    if (
      shipment.delivery_date &&
      shipment.accounts_date
    ) {

      return "COMPLETED";

    }


    if (
      shipment.delivery_date
    ) {

      return "ACCOUNTS PENDING";

    }


    return "DELIVERY PENDING";
  }


  /*
   * PAID / TBB:
   *
   * Received
   *    ↓
   * Delivery
   *    ↓
   * Completed
   */

  if (
    shipment.delivery_date
  ) {

    return "COMPLETED";

  }


  return "DELIVERY PENDING";
}


/* =========================================================
   PAYMENT LABEL
========================================================= */

function paymentLabel(type) {

  if (type === "TOPAY") {
    return "To Pay";
  }

  if (type === "TBB") {
    return "TBB";
  }

  if (type === "PAID") {
    return "Paid";
  }

  if (type === "FOC") {
    return "FOC";
  }

  return type || "-";
}


/* =========================================================
   STATUS BADGE
========================================================= */

function statusBadge(status) {

  let className =
    "status-badge";


  if (status === "COMPLETED") {

    className +=
      " status-completed";

  } else if (
    status === "ACCOUNTS PENDING"
  ) {

    className +=
      " status-accounts";

  } else {

    className +=
      " status-delivery";

  }


  return `
    <span class="${className}">
      ${escapeHtml(status)}
    </span>
  `;
}


/* =========================================================
   FORMAT AMOUNT
========================================================= */

function formatAmount(amount) {

  const number =
    Number(amount);


  if (
    Number.isNaN(number)
  ) {

    return "0.00";

  }


  return number.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   DELIVERY TABLE
========================================================= */

function renderDeliveryTable(
  shipments
) {

  const container =
    document.getElementById(
      "delivery-table"
    );


  if (!container) {
    return;
  }


  /*
   * EVERYTHING NOT DELIVERED
   * appears in Delivery.
   */
  const rows =
    shipments.filter(
      function (shipment) {

        return !shipment.delivery_date;

      }
    );


  renderShipmentTable(
    container,
    rows,
    "delivery"
  );
}


/* =========================================================
   ACCOUNTS TABLE
========================================================= */

function renderAccountsTable(
  shipments
) {

  const container =
    document.getElementById(
      "accounts-table"
    );


  if (!container) {
    return;
  }


  /*
   * IMPORTANT:
   *
   * ONLY TOPAY shipments
   * move into Accounts.
   *
   * They must already be delivered.
   *
   * They must NOT already have
   * accounts_date.
   */
  const rows =
    shipments.filter(
      function (shipment) {

        return (
          shipment.payment_type ===
            "TOPAY" &&

          !!shipment.delivery_date &&

          !shipment.accounts_date
        );

      }
    );


  renderShipmentTable(
    container,
    rows,
    "accounts"
  );
}


/* =========================================================
   ALL SHIPMENTS TABLE
========================================================= */

function renderAllShipmentsTable(
  shipments
) {

  const container =
    document.getElementById(
      "all-table"
    );


  if (!container) {
    return;
  }


  renderShipmentTable(
    container,
    shipments,
    "all"
  );
}


/* =========================================================
   GENERIC SHIPMENT TABLE
========================================================= */

function renderShipmentTable(
  container,
  shipments,
  mode
) {

  container.innerHTML = "";


  if (
    !shipments ||
    shipments.length === 0
  ) {

    container.innerHTML =
      '<p class="empty">No shipments found.</p>';

    return;

  }


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "table-responsive";


  const table =
    document.createElement("table");

  table.className =
    "data-table";


  const thead =
    document.createElement("thead");


  thead.innerHTML = `
    <tr>

      <th>LR No.</th>

      <th>Received</th>

      <th>Party</th>

      <th>From Branch</th>

      <th>Qty</th>

      <th>Amount</th>

      <th>Payment</th>

      <th>Delivery</th>

      <th>Accounts</th>

      <th>Status</th>

      <th>Action</th>

    </tr>
  `;


  const tbody =
    document.createElement("tbody");


  shipments.forEach(
    function (shipment) {

      const row =
        document.createElement("tr");


      row.innerHTML = `
        <td>
          <strong>
            ${escapeHtml(
              shipment.lr_number || "-"
            )}
          </strong>
        </td>

        <td>
          ${formatDate(
            shipment.received_date
          )}
        </td>

        <td>
          ${escapeHtml(
            shipment.parties?.name || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            shipment.branches?.name || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            String(
              shipment.quantity ?? "-"
            )
          )}
        </td>

        <td>
          ₹${formatAmount(
            shipment.amount
          )}
        </td>

        <td>
          ${paymentLabel(
            shipment.payment_type
          )}
        </td>

        <td>
          ${
            shipment.delivery_date
              ? formatDate(
                  shipment.delivery_date
                )
              : "-"
          }
        </td>

        <td>
          ${
            shipment.accounts_date
              ? formatDate(
                  shipment.accounts_date
                )
              : "-"
          }
        </td>

        <td>
          ${statusBadge(
            getShipmentStatus(
              shipment
            )
          )}
        </td>

        <td>
          ${createActionButtons(
            shipment,
            mode
          )}
        </td>
      `;


      tbody.appendChild(row);

    }
  );


  table.appendChild(thead);

  table.appendChild(tbody);

  wrapper.appendChild(table);

  container.appendChild(wrapper);
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date) {

  if (!date) {
    return "-";
  }


  const parts =
    String(date).split("-");


  if (
    parts.length === 3
  ) {

    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  return date;
}


/* =========================================================
   ACTION BUTTONS
========================================================= */

function createActionButtons(
  shipment,
  mode
) {

  let html = "";


  /*
   * EDIT
   */
  html += `
    <button
      type="button"
      class="table-action edit-action"
      data-action="edit"
      data-id="${shipment.id}"
    >
      Edit
    </button>
  `;


  /*
   * DELIVERY
   *
   * Show only when shipment
   * has not been delivered.
   */
  if (!shipment.delivery_date) {

    html += `
      <button
        type="button"
        class="table-action delivery-action"
        data-action="delivery"
        data-id="${shipment.id}"
      >
        Delivered
      </button>
    `;

  } else {

    /*
     * UNDELIVER
     *
     * Allows correction if goods
     * were marked delivered by mistake.
     */
    html += `
      <button
        type="button"
        class="table-action undeliver-action"
        data-action="undeliver"
        data-id="${shipment.id}"
      >
        Undeliver
      </button>
    `;

  }


  /*
   * ACCOUNTS
   *
   * ONLY TOPAY shipments.
   */
  if (
    shipment.payment_type === "TOPAY" &&
    shipment.delivery_date &&
    !shipment.accounts_date
  ) {

    html += `
      <button
        type="button"
        class="table-action accounts-action"
        data-action="accounts"
        data-id="${shipment.id}"
      >
        Accounts Done
      </button>
    `;

  }


  /*
   * DELETE
   */
  html += `
    <button
      type="button"
      class="table-action delete-action"
      data-action="delete"
      data-id="${shipment.id}"
    >
      Delete
    </button>
  `;


  return `
    <div class="table-actions">
      ${html}
    </div>
  `;
}


/* =========================================================
   TABLE ACTION HANDLER
========================================================= */

document.addEventListener(
  "click",
  async function (event) {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) {
      return;
    }


    const action =
      button.dataset.action;


    const id =
      button.dataset.id;


    if (!id) {
      return;
    }


    try {

      button.disabled = true;


      /*
       * DELIVERY
       */

      if (
        action === "delivery"
      ) {

        await markDelivered(
          id
        );

      }


      /*
       * UNDELIVER
       */

      else if (
        action === "undeliver"
      ) {

        await markUndelivered(
          id
        );

      }


      /*
       * ACCOUNTS
       */

      else if (
        action === "accounts"
      ) {

        await markAccountsCompleted(
          id
        );

      }


      /*
       * DELETE
       */

      else if (
        action === "delete"
      ) {

        await deleteShipment(
          id
        );

      }


      /*
       * EDIT
       */

      else if (
        action === "edit"
      ) {

        await editShipment(
          id
        );

      }


    } catch (error) {

      console.error(
        "ACTION ERROR:",
        error
      );

      alert(
        error.message ||
        "Action failed."
      );


    } finally {

      button.disabled =
        false;

    }

  }
);


/* =========================================================
   MARK DELIVERED
========================================================= */

async function markDelivered(
  id
) {

  const date =
    prompt(
      "Enter delivery date (YYYY-MM-DD):",
      new Date()
        .toISOString()
        .split("T")[0]
    );


  if (!date) {
    return;
  }


  const token =
    sessionStorage.getItem(
      "chennai_access_token"
    );


  const response =
    await fetch(
      SUPABASE_URL +
      "/rest/v1/shipments?id=eq." +
      encodeURIComponent(id),
      {

        method: "PATCH",

        headers: {
          "apikey":
            SUPABASE_KEY,

          "Authorization":
            "Bearer " + token,

          "Content-Type":
            "application/json",

          "Prefer":
            "return=representation"
        },

        body: JSON.stringify({

          delivery_date:
            date

        })

      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      data.details ||
      "Could not mark shipment as delivered."
    );

  }


  await loadDashboard();

  await loadShipments();

}


/* =========================================================
   MARK UNDELIVERED
========================================================= */

async function markUndelivered(
  id
) {

  const confirmed =
    confirm(
      "Are you sure you want to mark this shipment as undelivered?"
    );


  if (!confirmed) {
    return;
  }


  const token =
    sessionStorage.getItem(
      "chennai_access_token"
    );


  const response =
    await fetch(
      SUPABASE_URL +
      "/rest/v1/shipments?id=eq." +
      encodeURIComponent(id),
      {

        method: "PATCH",

        headers: {
          "apikey":
            SUPABASE_KEY,

          "Authorization":
            "Bearer " + token,

          "Content-Type":
            "application/json",

          "Prefer":
            "return=representation"
        },

        body: JSON.stringify({

          delivery_date:
            null,

          /*
           * If delivery is cancelled,
           * TOPAY must also leave Accounts.
           */
          accounts_date:
            null

        })

      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      data.details ||
      "Could not undo delivery."
    );

  }


  await loadDashboard();

  await loadShipments();

}


/* =========================================================
   MARK ACCOUNTS COMPLETED
========================================================= */

async function markAccountsCompleted(
  id
) {

  const date =
    prompt(
      "Enter accounts completion date (YYYY-MM-DD):",
      new Date()
        .toISOString()
        .split("T")[0]
    );


  if (!date) {
    return;
  }


  const token =
    sessionStorage.getItem(
      "chennai_access_token"
    );


  const response =
    await fetch(
      SUPABASE_URL +
      "/rest/v1/shipments?id=eq." +
      encodeURIComponent(id),
      {

        method: "PATCH",

        headers: {
          "apikey":
            SUPABASE_KEY,

          "Authorization":
            "Bearer " + token,

          "Content-Type":
            "application/json",

          "Prefer":
            "return=representation"
        },

        body: JSON.stringify({

          accounts_date:
            date

        })

      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      data.details ||
      "Could not complete accounts."
    );

  }


  await loadDashboard();

  await loadShipments();

}
