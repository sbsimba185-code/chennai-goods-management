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


      const saveButton =
        shipmentForm.querySelector(
          'button[type="submit"]'
        );


      const message =
        document.getElementById(
          "form-message"
        );


      const receivedDate =
        document.getElementById(
          "received-date"
        )?.value;


      const lrNumber =
        normalizeUppercase(
          document.getElementById(
            "lr-number"
          )?.value
        );


      const partyName =
        normalizeUppercase(
          document.getElementById(
            "party-name"
          )?.value
        );


      const branchName =
        normalizeUppercase(
          document.getElementById(
            "branch-name"
          )?.value
        );


      const quantity =
        document.getElementById(
          "quantity"
        )?.value;


      const amount =
        document.getElementById(
          "amount"
        )?.value;


      const paymentType =
        document.getElementById(
          "payment-type"
        )?.value;


      const remarks =
        normalizeUppercase(
          document.getElementById(
            "remarks"
          )?.value
        );


      /* ---------------------------------------------------
         VALIDATION
         --------------------------------------------------- */

      if (!receivedDate) {

        message.textContent =
          "PLEASE SELECT RECEIVED DATE.";

        return;

      }


      if (!lrNumber) {

        message.textContent =
          "PLEASE ENTER LR NUMBER.";

        return;

      }


      if (!partyName) {

        message.textContent =
          "PLEASE ENTER PARTY NAME.";

        return;

      }


      if (!branchName) {

        message.textContent =
          "PLEASE ENTER FROM BRANCH.";

        return;

      }


      if (
        !quantity ||
        Number(quantity) <= 0
      ) {

        message.textContent =
          "PLEASE ENTER A VALID QUANTITY.";

        return;

      }


      if (
        amount === "" ||
        Number(amount) < 0
      ) {

        message.textContent =
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

        message.textContent =
          "PLEASE SELECT TOPAY, TBB OR PAID.";

        return;

      }


      const token =
        sessionStorage.getItem(
          "chennai_access_token"
        );


      if (!token) {

        message.textContent =
          "YOUR LOGIN SESSION HAS EXPIRED. PLEASE SIGN IN AGAIN.";

        showLogin();

        return;

      }


      if (saveButton) {

        saveButton.disabled =
          true;

        saveButton.textContent =
          "SAVING...";

      }


      message.textContent =
        "SAVING GOODS RECEIPT...";


      try {

        /* -------------------------------------------------
           FIND OR CREATE PARTY
           ------------------------------------------------- */

        let party;

        try {

          party =
            await findPartyId(
              partyName
            );

        } catch {

          const create =
            confirm(
              "PARTY \"" +
              partyName +
              "\" DOES NOT EXIST.\n\n" +
              "CREATE THIS PARTY?"
            );


          if (!create) {
            throw new Error(
              "PARTY NOT CREATED."
            );
          }


          const newParty =
            await createParty(
              partyName
            );


          party =
            newParty.id;

        }


        /* -------------------------------------------------
           FIND OR CREATE BRANCH
           ------------------------------------------------- */

        let branch;

        try {

          branch =
            await findBranchId(
              branchName
            );

        } catch {

          const create =
            confirm(
              "BRANCH \"" +
              branchName +
              "\" DOES NOT EXIST.\n\n" +
              "CREATE THIS BRANCH?"
            );


          if (!create) {
            throw new Error(
              "BRANCH NOT CREATED."
            );
          }


          const newBranch =
            await createBranch(
              branchName
            );


          branch =
            newBranch.id;

        }


        /* -------------------------------------------------
           SAVE SHIPMENT
           ------------------------------------------------- */

        const shipment =
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
                    party,

                  quantity:
                    Number(quantity),

                  amount:
                    Number(amount),

                  payment_type:
                    paymentType,

                  from_branch_id:
                    branch,

                  delivery_date:
                    null,

                  accounts_date:
                    null,

                  remarks:
                    remarks || null

                })
            }
          );


        const savedShipment =
          shipment[0];


        /* -------------------------------------------------
           RECEIVED EVENT
           ------------------------------------------------- */

        try {

          await api(
            "/rest/v1/shipment_events",
            {
              method: "POST",

              body:
                JSON.stringify({

                  shipment_id:
                    savedShipment.id,

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
            "EVENT COULD NOT BE SAVED:",
            eventError
          );

        }


        message.textContent =
          "RECEIVE GOODS SAVED SUCCESSFULLY.";


        shipmentForm.reset();


        await loadAllData();


        console.log(
          "SHIPMENT SAVED:",
          savedShipment
        );


      } catch (error) {

        console.error(
          "RECEIVE GOODS ERROR:",
          error
        );


        message.textContent =
          String(
            error.message
          ).toUpperCase();


      } finally {

        if (saveButton) {

          saveButton.disabled =
            false;

          saveButton.textContent =
            "SAVE GOODS RECEIPT";

        }

      }

    }
  );

}


/* =========================================================
   LOAD SHIPMENTS
   IMPORTANT:
   parties uses `name`
   branches uses `name`
   ========================================================= */

async function loadShipments() {

  try {

    const shipments =
      await api(
        "/rest/v1/shipments" +
        "?select=*," +
        "parties(id,name,phone)," +
        "branches(id,name)" +
        "&order=created_at.desc" +
        "&limit=5000"
      );


    window.allShipments =
      shipments || [];


    console.log(
      "SHIPMENTS LOADED:",
      window.allShipments.length
    );


    return window.allShipments;


  } catch (error) {

    console.error(
      "SHIPMENTS LOAD FAILED:",
      error
    );


    throw error;

  }

}


/* =========================================================
   SHIPMENT STATUS
   ========================================================= */

function getShipmentStatus(
  shipment
) {

  if (
    shipment.delivery_date
  ) {

    if (
      shipment.payment_type ===
      "TOPAY" &&
      !shipment.accounts_date
    ) {

      return "ACCOUNTS PENDING";

    }


    return "COMPLETED";

  }


  return "PENDING DELIVERY";

}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

  const shipments =
    window.allShipments || [];


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


  /*
   * IMPORTANT:
   * ONLY TOPAY + DELIVERED + NOT ACCOUNTS
   */

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
      shipment =>
        shipment.delivery_date ===
        today
    ).length;


  setText(
    "stat-received",
    receivedToday
  );


  setText(
    "stat-delivery",
    pendingDelivery
  );


  setText(
    "stat-accounts",
    accountsPending
  );


  setText(
    "stat-completed",
    completedToday
  );


  setText(
    "delivery-count",
    pendingDelivery
  );


  setText(
    "accounts-count",
    accountsPending
  );


  renderRecentTable(
    shipments.slice(0, 10)
  );

}


/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }

}


/* =========================================================
   SHIPMENT PARTY NAME
   ========================================================= */

function partyName(
  shipment
) {

  return (
    shipment.parties?.name ||
    shipment.party_name ||
    "UNKNOWN PARTY"
  );

}


/* =========================================================
   SHIPMENT BRANCH NAME
   ========================================================= */

function branchName(
  shipment
) {

  return (
    shipment.branches?.name ||
    shipment.branch_name ||
    "UNKNOWN BRANCH"
  );

}


/* =========================================================
   PAYMENT LABEL
   ========================================================= */

function paymentLabel(
  payment
) {

  if (payment === "TOPAY") {
    return "TOPAY";
  }

  if (payment === "TBB") {
    return "TBB";
  }

  if (payment === "PAID") {
    return "PAID";
  }

  return payment || "-";

}


/* =========================================================
   TABLE
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
        ${escapeHtml(emptyMessage)}
      </p>
    `;

  }


  let html = `

    <div class="table-wrapper">

      <table>

        <thead>

          <tr>

            <th>SL NO</th>

            <th>LR NUMBER</th>

            <th>RECEIVED</th>

            <th>PARTY</th>

            <th>FROM BRANCH</th>

            <th>QTY</th>

            <th>AMOUNT</th>

            <th>PAYMENT</th>

            <th>STATUS</th>

            <th>ACTION</th>

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
    shipments.filter(
      shipment =>
        !shipment.delivery_date
    );


  container.innerHTML =
    shipmentTable(
      pending,
      "NO GOODS ARE CURRENTLY PENDING DELIVERY."
    );

}


/* =========================================================
   ACCOUNTS TABLE
   ONLY TOPAY
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


  const accounts =
    shipments.filter(
      shipment =>
        shipment.payment_type ===
          "TOPAY" &&
        shipment.delivery_date &&
        !shipment.accounts_date
    );


  container.innerHTML =
    shipmentTable(
      accounts,
      "NO TOPAY SHIPMENTS ARE PENDING IN ACCOUNTS."
    );

}


/* =========================================================
   ALL SHIPMENTS
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


            if (type === "delivery") {

              source =
                source.filter(
                  shipment =>
                    !shipment.delivery_date
                );

            }


            if (type === "accounts") {

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

  if (type === "delivery") {

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


  if (type === "accounts") {

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


  if (type === "all") {

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


  setText(
    "page-title",
    titles[pageName] ||
    "GOODS MANAGEMENT"
  );


  if (
    pageName === "dashboard"
  ) {

    loadDashboard();

  }


  if (
    pageName === "delivery"
  ) {

    renderDeliveryTable(
      window.allShipments || []
    );

  }


  if (
    pageName === "accounts"
  ) {

    renderAccountsTable(
      window.allShipments || []
    );

  }


  if (
    pageName === "all"
  ) {

    renderAllTable(
      window.allShipments || []
    );

  }


  if (
    pageName === "stock"
  ) {

    renderStockTable(
      window.allShipments || []
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
