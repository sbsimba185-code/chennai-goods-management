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

const OFFICE_EMAIL =
  "silambarasan2453@gmail.com";

const SESSION_KEY =
  "chennai-goods-session";


/* =========================================================
   APPLICATION STATE
   ========================================================= */

let accessToken =
  sessionStorage.getItem(SESSION_KEY);

let shipments = [];

let currentAction = null;

let editingShipmentId = null;


/* =========================================================
   SHORT HELPERS
   ========================================================= */

const $ = (selector) =>
  document.querySelector(selector);


function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function normalizeUppercase(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}


function safe(value) {
  return String(value ?? "")
    .replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
}


function formatDate(value) {

  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  ).format(
    new Date(`${value}T00:00:00`)
  );
}


function statusOf(shipment) {

  if (shipment.accounts_date) {
    return "Completed";
  }

  if (shipment.delivery_date) {
    return "Accounts pending";
  }

  return "Pending delivery";
}


/* =========================================================
   SUPABASE API
   ========================================================= */

function authHeaders(extra = {}) {

  return {
    apikey: SUPABASE_KEY,
    Authorization:
      `Bearer ${accessToken}`,
    ...extra
  };
}


async function api(
  path,
  options = {}
) {

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${path}`,
      {
        ...options,

        headers:
          authHeaders(
            options.headers || {}
          )
      }
    );


  if (!response.ok) {

    const body =
      await response
        .json()
        .catch(() => ({}));


    throw new Error(
      body.message ||
      body.details ||
      body.hint ||
      body.error ||
      `SUPABASE ERROR (${response.status})`
    );
  }


  if (response.status === 204) {
    return null;
  }


  const text =
    await response.text();


  if (!text) {
    return null;
  }


  try {

    return JSON.parse(text);

  } catch {

    return null;

  }
}


/* =========================================================
   LOGIN SCREEN
   ========================================================= */

function showLogin() {

  const loginScreen =
    $("#login-screen");

  const appShell =
    $("#app-shell");


  if (loginScreen) {

    loginScreen.hidden = false;
    loginScreen.style.display = "grid";

  }


  if (appShell) {

    appShell.hidden = true;
    appShell.style.display = "none";

  }
}


function showApp() {

  const loginScreen =
    $("#login-screen");

  const appShell =
    $("#app-shell");


  if (loginScreen) {

    loginScreen.hidden = true;
    loginScreen.style.display = "none";

  }


  if (appShell) {

    appShell.hidden = false;
    appShell.style.display = "block";

  }
}


/* =========================================================
   LOGIN
   ========================================================= */

const loginForm =
  $("#login-form");


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const loginMessage =
        $("#login-message");

      const loginButton =
        $("#login-button");


      const password =
        $("#login-password")
          .value;


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
            `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
            {
              method: "POST",

              headers: {
                apikey: SUPABASE_KEY,
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email: OFFICE_EMAIL,
                password: password
              })
            }
          );


        const data =
          await response
            .json()
            .catch(() => ({}));


        console.log(
          "SUPABASE LOGIN RESPONSE:",
          data
        );


        if (
          !response.ok ||
          !data.access_token
        ) {

          loginMessage.textContent =
            data.error_description ||
            data.msg ||
            "SIGN-IN FAILED. CHECK YOUR PASSWORD.";

          return;
        }


        accessToken =
          data.access_token;


        sessionStorage.setItem(
          SESSION_KEY,
          accessToken
        );


        showApp();


        try {

          await loadShipments();

          showPage("dashboard");

          loginMessage.textContent =
            "";

        } catch (error) {

          console.error(
            "DASHBOARD LOAD ERROR:",
            error
          );

          loginMessage.textContent =
            "LOGIN SUCCEEDED, BUT DATA COULD NOT LOAD. CHECK SUPABASE POLICIES.";

        }

      } catch (error) {

        console.error(
          "LOGIN CONNECTION ERROR:",
          error
        );

        loginMessage.textContent =
          "COULD NOT CONNECT TO SUPABASE.";

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
  $("#sign-out");


if (signOutButton) {

  signOutButton.addEventListener(
    "click",
    function () {

      accessToken = null;

      sessionStorage.removeItem(
        SESSION_KEY
      );


      const password =
        $("#login-password");

      if (password) {
        password.value = "";
      }


      const loginMessage =
        $("#login-message");

      if (loginMessage) {
        loginMessage.textContent = "";
      }


      showLogin();

    }
  );

}


/* =========================================================
   LOAD SHIPMENTS
   ========================================================= */

async function loadShipments() {

  const select =
    [
      "*",
      "parties(name)",
      "branches(name)",
      "stock_checks(checked_date,check_status)"
    ].join(",");


  const query =
    new URLSearchParams({
      select: select,
      order: "created_at.desc"
    });


  const rows =
    await api(
      `shipments?${query.toString()}`
    );


  shipments =
    (rows || []).map(
      function (shipment) {

        const checks =
          Array.isArray(
            shipment.stock_checks
          )
            ? [...shipment.stock_checks]
            : [];


        checks.sort(
          function (a, b) {

            return String(
              b.checked_date || ""
            ).localeCompare(
              String(
                a.checked_date || ""
              )
            );

          }
        );


        const latestCheck =
          checks[0];


        return {

          ...shipment,

          party_name:
            shipment.parties?.name || "",

          branch_name:
            shipment.branches?.name || "",

          stock_status:
            latestCheck?.check_status ||
            null,

          stock_checked_date:
            latestCheck?.checked_date ||
            null

        };

      }
    );


  render();
}


/* =========================================================
   FIND OR CREATE PARTY
   ========================================================= */

async function getOrCreateParty(
  partyName
) {

  const name =
    normalizeUppercase(
      partyName
    );


  if (!name) {

    throw new Error(
      "PLEASE ENTER PARTY NAME."
    );

  }


  const query =
    new URLSearchParams({
      select: "id,name",
      name: `eq.${name}`,
      limit: "1"
    });


  const existing =
    await api(
      `parties?${query.toString()}`
    );


  if (
    existing &&
    existing.length
  ) {

    return existing[0].id;

  }


  const created =
    await api(
      "parties",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Prefer:
            "return=representation"
        },

        body: JSON.stringify([
          {
            name: name,
            is_active: true
          }
        ])
      }
    );


  if (
    !created ||
    !created.length ||
    !created[0].id
  ) {

    throw new Error(
      "PARTY COULD NOT BE CREATED."
    );

  }


  return created[0].id;
}


/* =========================================================
   FIND OR CREATE BRANCH
   ========================================================= */

async function getOrCreateBranch(
  branchName
) {

  const name =
    normalizeUppercase(
      branchName
    );


  if (!name) {

    throw new Error(
      "PLEASE ENTER FROM BRANCH."
    );

  }


  const query =
    new URLSearchParams({
      select: "id,name",
      name: `eq.${name}`,
      limit: "1"
    });


  const existing =
    await api(
      `branches?${query.toString()}`
    );


  if (
    existing &&
    existing.length
  ) {

    return existing[0].id;

  }


  const created =
    await api(
      "branches",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Prefer:
            "return=representation"
        },

        body: JSON.stringify([
          {
            name: name,
            is_active: true
          }
        ])
      }
    );


  if (
    !created ||
    !created.length ||
    !created[0].id
  ) {

    throw new Error(
      "BRANCH COULD NOT BE CREATED."
    );

  }


  return created[0].id;
}


/* =========================================================
   TABLE BUTTON
   ========================================================= */

function actionButton(
  type,
  shipment,
  label,
  className = ""
) {

  return `
    <button
      type="button"
      class="action ${className}"
      data-action="${type}"
      data-id="${safe(shipment.id)}"
    >
      ${safe(label)}
    </button>
  `;
}


/* =========================================================
   SHIPMENT ROW
   ========================================================= */

function shipmentRow(
  shipment,
  mode
) {

  const status =
    statusOf(shipment);


  let statusClass =
    "pending";


  if (status === "Completed") {
    statusClass = "completed";
  }

  if (status === "Accounts pending") {
    statusClass = "accounts";
  }


  let actions = "";


  if (mode === "workflow") {

    if (
      status ===
      "Pending delivery"
    ) {

      actions =
        actionButton(
          "deliver",
          shipment,
          "DELIVERY"
        );

    } else if (
      status ===
      "Accounts pending"
    ) {

      actions =
        actionButton(
          "accounts",
          shipment,
          "ENTER A/C DATE"
        ) +

        actionButton(
          "undelivered",
          shipment,
          "MARK UNDELIVERED",
          "light"
        );

    }

  }


  if (mode === "all") {

    if (
      status !==
      "Pending delivery"
    ) {

      actions +=
        actionButton(
          "undelivered",
          shipment,
          "MARK UNDELIVERED",
          "light"
        );

    }


    actions +=
      actionButton(
        "edit",
        shipment,
        "EDIT",
        "light"
      );


    actions +=
      actionButton(
        "delete",
        shipment,
        "DELETE",
        "danger"
      );

  }


  return `
    <tr>

      <td>
        <b>
          ${safe(shipment.lr_number)}
        </b>
      </td>

      <td>
        ${safe(shipment.party_name)}
      </td>

      <td>
        ${safe(shipment.branch_name)}
      </td>

      <td>
        ${safe(shipment.quantity)}
      </td>

      <td>
        ₹${Number(
          shipment.amount || 0
        ).toLocaleString("en-IN")}
      </td>

      <td>
        ${safe(
          shipment.remarks
        ) || "—"}
      </td>

      <td>
        ${formatDate(
          shipment.delivery_date
        )}
      </td>

      <td>
        ${formatDate(
          shipment.accounts_date
        )}
      </td>

      <td>
        ${formatDate(
          shipment.received_date
        )}
      </td>

      <td>
        <span
          class="badge ${statusClass}"
        >
          ${status}
        </span>
      </td>

      ${
        mode
          ? `
            <td class="actions">
              ${actions}
            </td>
          `
          : ""
      }

    </tr>
  `;
}


/* =========================================================
   SHIPMENT TABLE
   ========================================================= */

function renderTable(
  data,
  target,
  mode = false
) {

  const element =
    $(target);


  if (!element) {
    return;
  }


  const headers = `
    <th>LR NO.</th>
    <th>PARTY</th>
    <th>FROM</th>
    <th>QTY</th>
    <th>AMOUNT</th>
    <th>REMARKS</th>
    <th>DELIVERY DATE</th>
    <th>A/C DATE</th>
    <th>RECEIVED</th>
    <th>STATUS</th>
    ${
      mode
        ? "<th>ACTIONS</th>"
        : ""
    }
  `;


  if (
    !data ||
    !data.length
  ) {

    element.innerHTML =
      `<p class="empty">
        NO SHIPMENTS FOUND.
      </p>`;

    return;
  }


  element.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            ${headers}
          </tr>
        </thead>

        <tbody>

          ${data
            .map(
              function (shipment) {
                return shipmentRow(
                  shipment,
                  mode
                );
              }
            )
            .join("")}

        </tbody>

      </table>

    </div>

  `;
}



/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function render() {

  const pending =
    shipments.filter(
      function (shipment) {
        return !shipment.delivery_date;
      }
    );


  const accountsPending =
    shipments.filter(
      function (shipment) {
        return (
          shipment.delivery_date &&
          !shipment.accounts_date
        );
      }
    );


  const completed =
    shipments.filter(
      function (shipment) {
        return !!shipment.accounts_date;
      }
    );


  const receivedToday =
    shipments.filter(
      function (shipment) {
        return (
          shipment.received_date ===
          today()
        );
      }
    );


  const completedToday =
    completed.filter(
      function (shipment) {
        return (
          shipment.accounts_date ===
          today()
        );
      }
    );


  const statReceived =
    $("#stat-received");

  const statDelivery =
    $("#stat-delivery");

  const statAccounts =
    $("#stat-accounts");

  const statCompleted =
    $("#stat-completed");


  if (statReceived) {
    statReceived.textContent =
      receivedToday.length;
  }


  if (statDelivery) {
    statDelivery.textContent =
      pending.length;
  }


  if (statAccounts) {
    statAccounts.textContent =
      accountsPending.length;
  }


  if (statCompleted) {
    statCompleted.textContent =
      completedToday.length;
  }


  const deliveryCount =
    $("#delivery-count");

  if (deliveryCount) {

    deliveryCount.textContent =
      pending.length || "";

  }


  const accountsCount =
    $("#accounts-count");

  if (accountsCount) {

    accountsCount.textContent =
      accountsPending.length || "";

  }


  renderTable(
    shipments.slice(0, 6),
    "#recent-table"
  );


  renderTable(
    pending,
    "#delivery-table",
    "workflow"
  );


  renderTable(
    accountsPending,
    "#accounts-table",
    "workflow"
  );


  renderTable(
    shipments,
    "#all-table",
    "all"
  );


  renderStockTable(
    pending
  );


  populateDatalists();
}


/* =========================================================
   PARTY / BRANCH DATALISTS
   ========================================================= */

function populateDatalists() {

  const partyNames =
    [
      ...new Set(
        shipments
          .map(
            function (shipment) {
              return shipment.party_name;
            }
          )
          .filter(Boolean)
      )
    ]
      .sort(
        function (a, b) {
          return a.localeCompare(b);
        }
      );


  const branchNames =
    [
      ...new Set(
        shipments
          .map(
            function (shipment) {
              return shipment.branch_name;
            }
          )
          .filter(Boolean)
      )
    ]
      .sort(
        function (a, b) {
          return a.localeCompare(b);
        }
      );


  const partyList =
    $("#party-list");


  if (partyList) {

    partyList.innerHTML =
      partyNames
        .map(
          function (name) {
            return `
              <option
                value="${safe(name)}"
              ></option>
            `;
          }
        )
        .join("");

  }


  const branchList =
    $("#branch-list");


  if (branchList) {

    branchList.innerHTML =
      branchNames
        .map(
          function (name) {
            return `
              <option
                value="${safe(name)}"
              ></option>
            `;
          }
        )
        .join("");

  }
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(
  pageName
) {

  document
    .querySelectorAll(".page")
    .forEach(
      function (page) {

        page.classList.toggle(
          "active",
          page.id === pageName
        );

      }
    );


  document
    .querySelectorAll(".nav-link")
    .forEach(
      function (button) {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            pageName
        );

      }
    );


  const titles = {

    dashboard: [
      "Good morning",
      "CHENNAI BRANCH"
    ],

    receive: [
      editingShipmentId
        ? "Edit shipment"
        : "Receive goods",
      "NEW GOODS ENTRY"
    ],

    delivery: [
      "Pending delivery",
      "CHENNAI BRANCH"
    ],

    accounts: [
      "Accounts pending",
      "CHENNAI BRANCH"
    ],

    stock: [
      "Godown stock check",
      "DAILY PHYSICAL VERIFICATION"
    ],

    all: [
      "All shipments",
      "CHENNAI BRANCH"
    ]

  };


  const title =
    titles[pageName] ||
    titles.dashboard;


  const pageTitle =
    $("#page-title");

  const pageKicker =
    $("#page-kicker");


  if (pageTitle) {
    pageTitle.textContent =
      title[0];
  }


  if (pageKicker) {
    pageKicker.textContent =
      title[1];
  }


  const receiveButton =
    $("#receive-button");


  if (receiveButton) {

    receiveButton.style.display =
      pageName === "receive"
        ? "none"
        : "";

  }
}


/* =========================================================
   RESET RECEIVE FORM
   ========================================================= */

function resetReceiveForm() {

  editingShipmentId = null;


  const form =
    $("#shipment-form");


  if (!form) {
    return;
  }


  form.reset();


  if (
    form.elements.received_date
  ) {

    form.elements.received_date.value =
      today();

  }


  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );


  if (submitButton) {

    submitButton.textContent =
      "SAVE GOODS RECEIPT";

  }


  const message =
    $("#form-message");


  if (message) {
    message.textContent = "";
  }
}


/* =========================================================
   EDIT SHIPMENT
   ========================================================= */

function editShipment(
  shipment
) {

  editingShipmentId =
    shipment.id;


  const form =
    $("#shipment-form");


  if (!form) {
    return;
  }


  form.elements.received_date.value =
    shipment.received_date || "";


  form.elements.lr_number.value =
    shipment.lr_number || "";


  form.elements.party_name.value =
    shipment.party_name || "";


  form.elements.branch_name.value =
    shipment.branch_name || "";


  form.elements.quantity.value =
    shipment.quantity ?? "";


  form.elements.amount.value =
    shipment.amount ?? "";


  form.elements.payment_type.value =
    shipment.payment_type ||
    "TOPAY";


  form.elements.remarks.value =
    shipment.remarks || "";


  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );


  if (submitButton) {

    submitButton.textContent =
      "SAVE CHANGES";

  }


  showPage("receive");
}


/* =========================================================
   CLOUD ACTION
   ========================================================= */

async function cloudAction(
  action
) {

  try {

    await action();

    await loadShipments();

  } catch (error) {

    console.error(
      "CLOUD ACTION ERROR:",
      error
    );


    alert(
      error.message ||
      "SOMETHING WENT WRONG."
    );

  }
}


/* =========================================================
   RECEIVE GOODS
   ========================================================= */

const shipmentForm =
  $("#shipment-form");


if (shipmentForm) {

  shipmentForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const formMessage =
        $("#form-message");


      const saveButton =
        shipmentForm.querySelector(
          'button[type="submit"]'
        );


      const receivedDate =
        shipmentForm.elements
          .received_date
          .value;


      const lrNumber =
        normalizeUppercase(
          shipmentForm.elements
            .lr_number
            .value
        );


      const partyName =
        normalizeUppercase(
          shipmentForm.elements
            .party_name
            .value
        );


      const branchName =
        normalizeUppercase(
          shipmentForm.elements
            .branch_name
            .value
        );


      const quantity =
        shipmentForm.elements
          .quantity
          .value;


      const amount =
        shipmentForm.elements
          .amount
          .value;


      const paymentType =
        shipmentForm.elements
          .payment_type
          .value;


      const remarks =
        normalizeUppercase(
          shipmentForm.elements
            .remarks
            .value
        );


      /* ---------------------------------------------------
         VALIDATION
         --------------------------------------------------- */

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


      /* ---------------------------------------------------
         CHECK LOGIN
         --------------------------------------------------- */

      accessToken =
        sessionStorage.getItem(
          SESSION_KEY
        );


      if (!accessToken) {

        formMessage.textContent =
          "YOUR LOGIN SESSION HAS EXPIRED. PLEASE SIGN IN AGAIN.";

        showLogin();

        return;
      }


      /* ---------------------------------------------------
         BUTTON
         --------------------------------------------------- */

      if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
          "SAVING...";

      }


      formMessage.textContent =
        "SAVING GOODS RECEIPT...";


      try {

        /* -------------------------------------------------
           FIND OR CREATE PARTY
           ------------------------------------------------- */

        const partyId =
          await getOrCreateParty(
            partyName
          );


        /* -------------------------------------------------
           FIND OR CREATE BRANCH
           ------------------------------------------------- */

        const branchId =
          await getOrCreateBranch(
            branchName
          );


        /* -------------------------------------------------
           SHIPMENT PAYLOAD
           ------------------------------------------------- */

        const payload = {

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

          remarks:
            remarks || null

        };


        /* -------------------------------------------------
           EDIT EXISTING
           ------------------------------------------------- */

        if (editingShipmentId) {

          await api(
            `shipments?id=eq.${encodeURIComponent(
              editingShipmentId
            )}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Prefer:
                  "return=minimal"
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );


          editingShipmentId =
            null;


          formMessage.textContent =
            "SHIPMENT UPDATED SUCCESSFULLY.";

        }


        /* -------------------------------------------------
           CREATE NEW
           ------------------------------------------------- */

        else {

          const created =
            await api(
              "shipments",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Prefer:
                    "return=representation"
                },

                body:
                  JSON.stringify([
                    payload
                  ])
              }
            );


          if (
            !created ||
            !created.length
          ) {

            throw new Error(
              "SHIPMENT WAS NOT SAVED."
            );

          }


          const newShipment =
            created[0];


          /* -----------------------------------------------
             RECEIVED EVENT
             ----------------------------------------------- */

          try {

            await api(
              "shipment_events",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Prefer:
                    "return=minimal"
                },

                body:
                  JSON.stringify([
                    {
                      shipment_id:
                        newShipment.id,

                      event_type:
                        "RECEIVED",

                      event_date:
                        receivedDate,

                      notes:
                        remarks ||
                        null
                    }
                  ])
              }
            );

          } catch (eventError) {

            console.error(
              "RECEIVED EVENT ERROR:",
              eventError
            );

            /*
             * The shipment itself has already been
             * successfully saved.
             */
          }


          formMessage.textContent =
            "RECEIVE GOODS SAVED SUCCESSFULLY.";

        }


        /* -------------------------------------------------
           RESET
           ------------------------------------------------- */

        shipmentForm.reset();


        shipmentForm.elements
          .received_date.value =
          today();


        if (saveButton) {

          saveButton.textContent =
            "SAVE GOODS RECEIPT";

        }


        await loadShipments();


      } catch (error) {

        console.error(
          "RECEIVE GOODS SAVE ERROR:",
          error
        );


        formMessage.textContent =
          error.message ||
          "ERROR SAVING GOODS RECEIPT.";

      } finally {

        if (saveButton) {

          saveButton.disabled =
            false;

          if (!editingShipmentId) {

            saveButton.textContent =
              "SAVE GOODS RECEIPT";

          }

        }

      }

    }
  );

}


/* =========================================================
   DELIVERY / ACCOUNTS / STOCK / EDIT / DELETE
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) {
      return;
    }


    const shipment =
      shipments.find(
        function (item) {
          return (
            item.id ===
            button.dataset.id
          );
        }
      );


    if (!shipment) {
      return;
    }


    const type =
      button.dataset.action;


    /* -----------------------------------------------------
       EDIT
       ----------------------------------------------------- */

    if (type === "edit") {

      editShipment(
        shipment
      );

      return;
    }


    /* -----------------------------------------------------
       DELETE
       ----------------------------------------------------- */

    if (type === "delete") {

      const confirmed =
        confirm(
          `DELETE LR ${shipment.lr_number}? THIS CANNOT BE UNDONE.`
        );


      if (!confirmed) {
        return;
      }


      cloudAction(
        async function () {

          await api(
            `shipments?id=eq.${encodeURIComponent(
              shipment.id
            )}`,
            {
              method: "DELETE",

              headers: {
                Prefer:
                  "return=minimal"
              }
            }
          );

        }
      );


      return;
    }


    /* -----------------------------------------------------
       MARK UNDELIVERED
       ----------------------------------------------------- */

    if (
      type ===
      "undelivered"
    ) {

      const confirmed =
        confirm(
          `MARK LR ${shipment.lr_number} AS UNDELIVERED? DELIVERY AND A/C DATES WILL BE REMOVED.`
        );


      if (!confirmed) {
        return;
      }


      cloudAction(
        async function () {

          await api(
            `shipments?id=eq.${encodeURIComponent(
              shipment.id
            )}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Prefer:
                  "return=minimal"
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


          /*
           * Your shipment_events table only accepts:
           * RECEIVED
           * DELIVERED
           * ACCOUNTS_COMPLETED
           * NOTE
           *
           * Therefore we use NOTE for reversal.
           */

          await api(
            "shipment_events",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Prefer:
                  "return=minimal"
              },

              body:
                JSON.stringify([
                  {
                    shipment_id:
                      shipment.id,

                    event_type:
                      "NOTE",

                    event_date:
                      today(),

                    notes:
                      "DELIVERY REVERSED"
                  }
                ])
            }
          );

        }
      );


      return;
    }


    /* -----------------------------------------------------
       STOCK CHECK
       ----------------------------------------------------- */

    if (
      type ===
      "in-godown" ||
      type ===
      "not-found"
    ) {

      const checkStatus =
        type ===
        "in-godown"
          ? "IN GODOWN"
          : "NOT FOUND";


      cloudAction(
        async function () {

          await api(
            "stock_checks?on_conflict=shipment_id,checked_date",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Prefer:
                  "resolution=merge-duplicates,return=minimal"
              },

              body:
                JSON.stringify([
                  {
                    shipment_id:
                      shipment.id,

                    checked_date:
                      today(),

                    check_status:
                      checkStatus
                  }
                ])
            }
          );

        }
      );


      return;
    }


    /* -----------------------------------------------------
       DELIVERY / ACCOUNTS DATE DIALOG
       ----------------------------------------------------- */

    if (
      type !== "deliver" &&
      type !== "accounts"
    ) {

      return;
    }


    currentAction = {
      type: type,
      shipment: shipment
    };


    const dialog =
      $("#date-dialog");


    if (!dialog) {
      return;
    }


    const dialogTitle =
      $("#dialog-title");


    const dialogDetail =
      $("#dialog-detail");


    const dateLabel =
      $("#date-label");


    const dateInput =
      $("#action-date");


    if (dialogTitle) {

      dialogTitle.textContent =
        type === "deliver"
          ? "ENTER DELIVERY DATE"
          : "ENTER A/C DATE";

    }


    if (dialogDetail) {

      dialogDetail.textContent =
        `${shipment.lr_number} · ${shipment.party_name}`;

    }


    if (dateLabel) {

      dateLabel.textContent =
        type === "deliver"
          ? "DELIVERY DATE"
          : "A/C DATE";

    }


    if (dateInput) {

      dateInput.min =
        type === "deliver"
          ? shipment.received_date
          : shipment.delivery_date;


      dateInput.value =
        type === "deliver"
          ? (
              shipment.delivery_date ||
              today()
            )
          : (
              shipment.accounts_date ||
              today()
            );

    }


    if (
      typeof dialog.showModal ===
      "function"
    ) {

      dialog.showModal();

    } else {

      dialog.setAttribute(
        "open",
        ""
      );

    }

  }
);


/* =========================================================
   DATE DIALOG
   ========================================================= */

const dateForm =
  $("#date-form");


if (dateForm) {

  dateForm.addEventListener(
    "submit",
    async function (event) {

      /*
       * The HTML uses method="dialog".
       * We manually control the action.
       */

      if (
        event.submitter &&
        event.submitter.value ===
          "cancel"
      ) {

        return;
      }


      event.preventDefault();


      if (!currentAction) {
        return;
      }


      const selectedDate =
        $("#action-date").value;


      if (!selectedDate) {

        alert(
          "PLEASE SELECT A DATE."
        );

        return;
      }


      const shipment =
        currentAction.shipment;


      const isDelivery =
        currentAction.type ===
        "deliver";


      const field =
        isDelivery
          ? "delivery_date"
          : "accounts_date";


      try {

        await api(
          `shipments?id=eq.${encodeURIComponent(
            shipment.id
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify({
                [field]:
                  selectedDate,

                /*
                 * If delivery is being entered,
                 * accounts date must remain null
                 * until accounts is completed.
                 */
              })
          }
        );


        /* -------------------------------------------------
           CREATE EVENT
           ------------------------------------------------- */

        await api(
          "shipment_events",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify([
                {
                  shipment_id:
                    shipment.id,

                  event_type:
                    isDelivery
                      ? "DELIVERED"
                      : "ACCOUNTS_COMPLETED",

                  event_date:
                    selectedDate,

                  notes:
                    null
                }
              ])
          }
        );


        const dialog =
          $("#date-dialog");


        if (dialog) {

          if (
            typeof dialog.close ===
            "function"
          ) {

            dialog.close();

          } else {

            dialog.removeAttribute(
              "open"
            );

          }

        }


        currentAction =
          null;


        await loadShipments();


      } catch (error) {

        console.error(
          "DATE UPDATE ERROR:",
          error
        );


        alert(
          error.message ||
          "COULD NOT SAVE DATE."
        );

      }

    }
  );

}


/* =========================================================
   SEARCH
   ========================================================= */

document
  .querySelectorAll(
    "[data-search]"
  )
  .forEach(
    function (input) {

      input.addEventListener(
        "input",
        function () {

          const searchText =
            normalizeUppercase(
              input.value
            );


          const kind =
            input.dataset.search;


          let data =
            shipments;


          if (
            kind ===
            "delivery"
          ) {

            data =
              shipments.filter(
                function (shipment) {

                  return !shipment.delivery_date;

                }
              );

          }


          if (
            kind ===
            "accounts"
          ) {

            data =
              shipments.filter(
                function (shipment) {

                  return (
                    shipment.delivery_date &&
                    !shipment.accounts_date
                  );

                }
              );

          }


          if (
            kind ===
            "stock"
          ) {

            data =
              shipments.filter(
                function (shipment) {

                  return !shipment.delivery_date;

                }
              );

          }


          if (searchText) {

            data =
              data.filter(
                function (shipment) {

                  const combined =
                    [
                      shipment.lr_number,
                      shipment.party_name,
                      shipment.branch_name,
                      shipment.remarks
                    ]
                      .filter(Boolean)
                      .join(" ");


                  return normalizeUppercase(
                    combined
                  ).includes(
                    searchText
                  );

                }
              );

          }


          if (
            kind ===
            "delivery"
          ) {

            renderTable(
              data,
              "#delivery-table",
              "workflow"
            );

            return;

          }


          if (
            kind ===
            "accounts"
          ) {

            renderTable(
              data,
              "#accounts-table",
              "workflow"
            );

            return;

          }


          if (
            kind ===
            "all"
          ) {

            renderTable(
              data,
              "#all-table",
              "all"
            );

            return;

          }


          if (
            kind ===
            "stock"
          ) {

            renderStockTable(
              data
            );

          }

        }
      );

    }
  );


/* =========================================================
   NAVIGATION
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

          if (
            button.dataset.page ===
            "receive"
          ) {

            resetReceiveForm();

          }


          showPage(
            button.dataset.page
          );

        }
      );

    }
  );


/* =========================================================
   DATA-GO BUTTONS
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
   RECEIVE BUTTON
   ========================================================= */

const receiveButton =
  $("#receive-button");


if (receiveButton) {

  receiveButton.addEventListener(
    "click",
    function () {

      resetReceiveForm();

      showPage(
        "receive"
      );

    }
  );

}


/* =========================================================
   UPPERCASE INPUTS
   ========================================================= */

function setupUppercaseInput(
  selector
) {

  document
    .querySelectorAll(
      selector
    )
    .forEach(
      function (input) {

        input.addEventListener(
          "input",
          function () {

            const start =
              input.selectionStart;


            const end =
              input.selectionEnd;


            input.value =
              normalizeUppercase(
                input.value
              );


            try {

              input.setSelectionRange(
                start,
                end
              );

            } catch {

              /* Ignore */

            }

        });

      }
    );
}


setupUppercaseInput(
  "#lr-number"
);


setupUppercaseInput(
  "#party-name"
);


setupUppercaseInput(
  "#branch-name"
);


setupUppercaseInput(
  "#remarks"
);


/* =========================================================
   INITIALIZE RECEIVE FORM
   ========================================================= */

resetReceiveForm();


/* =========================================================
   RESTORE SESSION
   ========================================================= */

if (accessToken) {

  showApp();


  loadShipments()
    .then(
      function () {

        showPage(
          "dashboard"
        );

      }
    )
    .catch(
      function (error) {

        console.error(
          "SESSION RESTORE ERROR:",
          error
        );


        accessToken =
          null;


        sessionStorage.removeItem(
          SESSION_KEY
        );


        showLogin();

      }
    );

} else {

  showLogin();

}
/* =========================================================
   STOCK CHECKING
   ========================================================= */

const stockTableElement =
  document.getElementById("stock-table");

const stockSearchElement =
  document.getElementById("stock-search");

const stockCountElement =
  document.getElementById("stock-count");

const stockPendingCountElement =
  document.getElementById("stock-pending-count");

const stockFoundCountElement =
  document.getElementById("stock-found-count");

const stockNotFoundCountElement =
  document.getElementById("stock-not-found-count");


let stockShipments = [];


/* =========================================================
   STOCK DATE
   ========================================================= */

function stockToday() {

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return (
    year +
    "-" +
    month +
    "-" +
    day
  );
}


/* =========================================================
   STOCK ESCAPE HTML
   ========================================================= */

function stockEscapeHtml(value) {

  if (value === null ||
      value === undefined) {

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
   LOAD STOCK
   ========================================================= */

async function loadStockPage() {

  if (!stockTableElement) {
    return;
  }


  const token =
    sessionStorage.getItem(
      "chennai_access_token"
    );


  if (!token) {

    stockTableElement.innerHTML =
      '<div class="stock-error">' +
      'YOUR LOGIN SESSION HAS EXPIRED. PLEASE SIGN IN AGAIN.' +
      '</div>';

    return;
  }


  stockTableElement.innerHTML =
    '<p class="empty">LOADING STOCK...</p>';


  try {

    /*
     * Get shipments which have not yet
     * been delivered.
     */

    const shipmentResponse =
      await fetch(
        SUPABASE_URL +
        "/rest/v1/shipment_status_view" +
        "?select=id,serial_no,received_date,lr_number,party_id,quantity,from_branch_id,current_status" +
        "&delivery_date=is.null" +
        "&order=received_date.asc,serial_no.asc",
        {

          method: "GET",

          headers: {

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              "Bearer " + token

          }

        }
      );


    const shipmentData =
      await shipmentResponse.json();


    if (!shipmentResponse.ok) {

      console.error(
        "STOCK SHIPMENT LOAD ERROR:",
        shipmentData
      );

      throw new Error(
        shipmentData.message ||
        shipmentData.details ||
        "UNABLE TO LOAD STOCK."
      );

    }


    /*
     * Get party names.
     */

    const partyResponse =
      await fetch(
        SUPABASE_URL +
        "/rest/v1/parties" +
        "?select=id,name",
        {

          method: "GET",

          headers: {

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              "Bearer " + token

          }

        }
      );


    const partyData =
      await partyResponse.json();


    if (!partyResponse.ok) {

      throw new Error(
        "UNABLE TO LOAD PARTIES."
      );

    }


    /*
     * Create party lookup.
     */

    const partyMap = {};

    partyData.forEach(
      function (party) {

        partyMap[party.id] =
          party.name;

      }
    );


    /*
     * Get branch names.
     */

    const branchResponse =
      await fetch(
        SUPABASE_URL +
        "/rest/v1/branches" +
        "?select=id,name",
        {

          method: "GET",

          headers: {

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              "Bearer " + token

          }

        }
      );


    const branchData =
      await branchResponse.json();


    if (!branchResponse.ok) {

      throw new Error(
        "UNABLE TO LOAD BRANCHES."
      );

    }


    const branchMap = {};

    branchData.forEach(
      function (branch) {

        branchMap[branch.id] =
          branch.name;

      }
    );


    /*
     * Get stock check history.
     *
     * Ordered newest first so the first
     * record for each shipment is its
     * latest stock check.
     */

    const stockCheckResponse =
      await fetch(
        SUPABASE_URL +
        "/rest/v1/stock_checks" +
        "?select=shipment_id,checked_date,check_status,remarks,created_at" +
        "&order=checked_date.desc,created_at.desc" +
        "&limit=5000",
        {

          method: "GET",

          headers: {

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              "Bearer " + token

          }

        }
      );


    const stockCheckData =
      await stockCheckResponse.json();


    if (!stockCheckResponse.ok) {

      console.error(
        "STOCK CHECK LOAD ERROR:",
        stockCheckData
      );

      throw new Error(
        "UNABLE TO LOAD STOCK CHECKS."
      );

    }


    /*
     * Latest check per shipment.
     */

    const latestCheckMap = {};


    stockCheckData.forEach(
      function (check) {

        if (
          !latestCheckMap[
            check.shipment_id
          ]
        ) {

          latestCheckMap[
            check.shipment_id
          ] = check;

        }

      }
    );


    /*
     * Build final stock records.
     */

    stockShipments =
      (shipmentData || []).map(
        function (shipment) {

          return {

            id:
              shipment.id,

            serial_no:
              shipment.serial_no,

            received_date:
              shipment.received_date,

            lr_number:
              shipment.lr_number,

            party_name:
              partyMap[
                shipment.party_id
              ] || "UNKNOWN PARTY",

            branch_name:
              branchMap[
                shipment.from_branch_id
              ] || "UNKNOWN BRANCH",

            quantity:
              shipment.quantity,

            latest_check:
              latestCheckMap[
                shipment.id
              ] || null

          };

        }
      );


    renderStockTable();


  } catch (error) {

    console.error(
      "STOCK PAGE ERROR:",
      error
    );


    stockTableElement.innerHTML =
      '<div class="stock-error">' +
      stockEscapeHtml(
        error.message
      ) +
      '</div>';

  }

}


/* =========================================================
   RENDER STOCK TABLE
   ========================================================= */

function renderStockTable() {

  if (!stockTableElement) {
    return;
  }


  const searchText =
    stockSearchElement
      ? stockSearchElement.value
          .trim()
          .toUpperCase()
      : "";


  const filtered =
    stockShipments.filter(
      function (shipment) {

        if (!searchText) {
          return true;
        }


        const combined =
          (
            String(
              shipment.serial_no || ""
            ) +
            " " +
            String(
              shipment.lr_number || ""
            ) +
            " " +
            String(
              shipment.party_name || ""
            ) +
            " " +
            String(
              shipment.branch_name || ""
            )
          ).toUpperCase();


        return combined.includes(
          searchText
        );

      }
    );


  /*
   * Counts
   */

  let pendingCount = 0;
  let foundCount = 0;
  let notFoundCount = 0;


  stockShipments.forEach(
    function (shipment) {

      if (!shipment.latest_check) {

        pendingCount++;

      } else if (
        shipment.latest_check.check_status ===
        "IN GODOWN"
      ) {

        foundCount++;

      } else if (
        shipment.latest_check.check_status ===
        "NOT FOUND"
      ) {

        notFoundCount++;

      }

    }
  );


  if (stockPendingCountElement) {

    stockPendingCountElement.textContent =
      pendingCount;

  }


  if (stockFoundCountElement) {

    stockFoundCountElement.textContent =
      foundCount;

  }


  if (stockNotFoundCountElement) {

    stockNotFoundCountElement.textContent =
      notFoundCount;

  }


  if (stockCountElement) {

    stockCountElement.textContent =
      pendingCount;

  }


  if (!filtered.length) {

    stockTableElement.innerHTML =
      '<div class="stock-empty">' +
      (
        stockShipments.length
          ? "NO STOCK MATCHES YOUR SEARCH."
          : "NO GOODS ARE CURRENTLY PENDING DELIVERY."
      ) +
      '</div>';

    return;

  }


  let html = "";

  html +=
    '<div class="stock-table-wrapper">';

  html +=
    '<table class="stock-table">';

  html += "<thead>";

  html += "<tr>";

  html += "<th>SERIAL NO</th>";

  html += "<th>LR NUMBER</th>";

  html += "<th>PARTY</th>";

  html += "<th>FROM BRANCH</th>";

  html += "<th>QTY</th>";

  html += "<th>RECEIVED</th>";

  html += "<th>LAST CHECK</th>";

  html += "<th>STATUS</th>";

  html += "<th>ACTION</th>";

  html += "</tr>";

  html += "</thead>";

  html += "<tbody>";


  filtered.forEach(
    function (shipment) {

      const check =
        shipment.latest_check;


      let statusText =
        "PENDING CHECK";

      let statusClass =
        "pending";


      if (check) {

        if (
          check.check_status ===
          "IN GODOWN"
        ) {

          statusText =
            "IN GODOWN";

          statusClass =
            "found";

        } else if (
          check.check_status ===
          "NOT FOUND"
        ) {

          statusText =
            "NOT FOUND";

          statusClass =
            "not-found";

        }

      }


      html += "<tr>";


      html +=
        '<td class="stock-serial">' +
        stockEscapeHtml(
          shipment.serial_no
        ) +
        "</td>";


      html +=
        '<td class="stock-lr">' +
        stockEscapeHtml(
          shipment.lr_number
        ) +
        "</td>";


      html +=
        '<td class="stock-party">' +
        stockEscapeHtml(
          shipment.party_name
        ) +
        "</td>";


      html +=
        "<td>" +
        stockEscapeHtml(
          shipment.branch_name
        ) +
        "</td>";


      html +=
        "<td>" +
        stockEscapeHtml(
          shipment.quantity
        ) +
        "</td>";


      html +=
        '<td class="stock-date">' +
        stockEscapeHtml(
          shipment.received_date
        ) +
        "</td>";


      html +=
        '<td class="stock-last-check">' +
        (
          check
            ? stockEscapeHtml(
                check.checked_date
              )
            : "NOT CHECKED"
        ) +
        "</td>";


      html +=
        '<td>' +
        '<span class="stock-status ' +
        statusClass +
        '">' +
        statusText +
        "</span>" +
        "</td>";


      html +=
        '<td>' +
        '<div class="stock-action-area">';


      html +=
        '<input ' +
        'type="text" ' +
        'class="stock-remark-input" ' +
        'id="stock-remark-' +
        shipment.id +
        '" ' +
        'placeholder="REMARKS" ' +
        'value="' +
        stockEscapeHtml(
          check
            ? check.remarks || ""
            : ""
        ) +
        '">';


      html +=
        '<button ' +
        'type="button" ' +
        'class="stock-action-button found" ' +
        'data-stock-id="' +
        shipment.id +
        '" ' +
        'data-stock-status="IN GODOWN">' +
        'IN GODOWN' +
        "</button>";


      html +=
        '<button ' +
        'type="button" ' +
        'class="stock-action-button not-found" ' +
        'data-stock-id="' +
        shipment.id +
        '" ' +
        'data-stock-status="NOT FOUND">' +
        'NOT FOUND' +
        "</button>";


      html +=
        "</div>";

      html += "</td>";

      html += "</tr>";

    }
  );


  html += "</tbody>";

  html += "</table>";

  html += "</div>";


  stockTableElement.innerHTML =
    html;


  /*
   * Attach buttons after rendering.
   */

  document
    .querySelectorAll(
      ".stock-action-button"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          async function () {

            const shipmentId =
              button.dataset.stockId;

            const status =
              button.dataset.stockStatus;


            const remarkInput =
              document.getElementById(
                "stock-remark-" +
                shipmentId
              );


            const remarks =
              remarkInput
                ? remarkInput.value
                    .trim()
                    .toUpperCase()
                : "";


            await saveStockCheck(
              shipmentId,
              status,
              remarks
            );

          }
        );

      }
    );

}


/* =========================================================
   SAVE STOCK CHECK
   ========================================================= */

async function saveStockCheck(
  shipmentId,
  checkStatus,
  remarks
) {

  const token =
    sessionStorage.getItem(
      "chennai_access_token"
    );


  if (!token) {

    alert(
      "YOUR LOGIN SESSION HAS EXPIRED. PLEASE SIGN IN AGAIN."
    );

    showLogin();

    return;

  }


  if (
    ![
      "IN GODOWN",
      "NOT FOUND"
    ].includes(checkStatus)
  ) {

    alert(
      "INVALID STOCK STATUS."
    );

    return;

  }


  /*
   * Disable buttons for this shipment
   */

  const buttons =
    document.querySelectorAll(
      '[data-stock-id="' +
      shipmentId +
      '"]'
    );


  buttons.forEach(
    function (button) {

      button.disabled = true;

    }
  );


  try {

    const today =
      stockToday();


    /*
     * UPSERT means:
     *
     * If today's check already exists,
     * update it.
     *
     * Otherwise create it.
     */

    const response =
      await fetch(
        SUPABASE_URL +
        "/rest/v1/stock_checks" +
        "?on_conflict=shipment_id,checked_date",
        {

          method: "POST",

          headers: {

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              "Bearer " + token,

            "Content-Type":
              "application/json",

            "Prefer":
              "resolution=merge-duplicates,return=representation"

          },

          body: JSON.stringify({

            shipment_id:
              shipmentId,

            checked_date:
              today,

            check_status:
              checkStatus,

            remarks:
              remarks || null

          })

        }
      );


    const data =
      await response.json();


    console.log(
      "STOCK CHECK RESPONSE:",
      data
    );


    if (!response.ok) {

      console.error(
        "STOCK CHECK SAVE ERROR:",
        data
      );


      throw new Error(
        data.message ||
        data.details ||
        data.hint ||
        "UNABLE TO SAVE STOCK CHECK."
      );

    }


    /*
     * Success
     */

    alert(
      "STOCK CHECK SAVED: " +
      checkStatus
    );


    /*
     * Reload stock data so the latest
     * status immediately appears.
     */

    await loadStockPage();


  } catch (error) {

    console.error(
      "STOCK CHECK ERROR:",
      error
    );


    alert(
      "ERROR: " +
      error.message
    );


    buttons.forEach(
      function (button) {

        button.disabled = false;

      }
    );

  }

}


/* =========================================================
   STOCK SEARCH
   ========================================================= */

if (stockSearchElement) {

  stockSearchElement.addEventListener(
    "input",
    function () {

      renderStockTable();

    }
  );

}


/* =========================================================
   OPEN STOCK PAGE
   ========================================================= */

const stockNavigationButton =
  document.querySelector(
    '[data-page="stock"]'
  );


if (stockNavigationButton) {

  stockNavigationButton.addEventListener(
    "click",
    function () {

      loadStockPage();

    }
  );

}


/* =========================================================
   LOAD STOCK WHEN APP OPENS
   ========================================================= */

if (
  sessionStorage.getItem(
    "chennai_access_token"
  )
) {

  /*
   * Don't block application startup.
   * Stock loads when the user opens
   * the Stock Checking page.
   */

  console.log(
    "STOCK CHECKING READY"
  );

}
