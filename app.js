/* =========================================================
   CHENNAI GOODS MANAGEMENT
   SINGLE CLEAN APP.JS
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
   GLOBAL STATE
   ========================================================= */

let accessToken =
  sessionStorage.getItem(SESSION_KEY);

let shipments = [];

let currentAction = null;

let editingShipmentId = null;


/* =========================================================
   HELPERS
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}


function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function safe(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function (character) {

        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[character];

      }
    );

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
    new Date(value + "T00:00:00")
  );

}


function normalizeUppercase(value) {

  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

}


function shipmentStatus(shipment) {

  if (shipment.accounts_date) {

    return "COMPLETED";

  }

  if (shipment.delivery_date) {

    return "ACCOUNTS PENDING";

  }

  return "PENDING DELIVERY";

}


/* =========================================================
   SUPABASE HEADERS
   ========================================================= */

function supabaseHeaders(extra = {}) {

  return {

    "apikey":
      SUPABASE_KEY,

    "Authorization":
      "Bearer " + accessToken,

    ...extra

  };

}


/* =========================================================
   SUPABASE API
   ========================================================= */

async function api(
  path,
  options = {}
) {

  const response =
    await fetch(
      SUPABASE_URL +
      "/rest/v1/" +
      path,
      {

        ...options,

        headers:
          supabaseHeaders(
            options.headers || {}
          )

      }
    );


  if (!response.ok) {

    const error =
      await response
        .json()
        .catch(
          function () {

            return {
              message:
                response.statusText
            };

          }
        );


    throw new Error(

      error.message ||
      error.details ||
      error.hint ||
      error.error ||
      "SUPABASE REQUEST FAILED."

    );

  }


  if (response.status === 204) {

    return null;

  }


  return response.json();

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
   LOAD ALL SHIPMENTS
   ========================================================= */

async function loadShipments() {

  if (!accessToken) {

    showLogin();

    return;

  }


  const select =
    [
      "*",
      "parties(name)",
      "branches(name)",
      "stock_checks(checked_date,check_status)"
    ].join(",");


  const query =
    new URLSearchParams({

      select:
        select,

      order:
        "created_at.desc"

    });


  const rows =
    await api(
      "shipments?" +
      query.toString()
    );


  shipments =
    rows.map(
      function (shipment) {

        const checks =
          [
            ...(shipment.stock_checks || [])
          ]
            .sort(
              function (a, b) {

                return b.checked_date
                  .localeCompare(
                    a.checked_date
                  );

              }
            );


        const lastCheck =
          checks[0] || null;


        return {

          ...shipment,

          party_name:
            shipment.parties?.name || "",

          branch_name:
            shipment.branches?.name || "",

          stock_status:
            lastCheck
              ? lastCheck.check_status
              : null,

          stock_checked_date:
            lastCheck
              ? lastCheck.checked_date
              : null

        };

      }
    );


  render();

}


/* =========================================================
   FIND OR CREATE PARTY / BRANCH
   ========================================================= */

async function getOrCreate(
  table,
  name
) {

  const cleanName =
    normalizeUppercase(name);


  if (!cleanName) {

    throw new Error(
      "NAME CANNOT BE EMPTY."
    );

  }


  const query =
    new URLSearchParams({

      select:
        "id",

      name:
        "eq." + cleanName,

      limit:
        "1"

    });


  const existing =
    await api(
      table +
      "?" +
      query.toString()
    );


  if (existing.length > 0) {

    return existing[0].id;

  }


  const created =
    await api(
      table,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Prefer":
            "return=representation"

        },

        body:
          JSON.stringify(
            [
              {

                name:
                  cleanName,

                is_active:
                  true

              }
            ]
          )

      }
    );


  if (
    !created ||
    !created.length
  ) {

    throw new Error(
      "COULD NOT CREATE " +
      table.toUpperCase() +
      "."
    );

  }


  return created[0].id;

}


/* =========================================================
   PARTY / BRANCH SUGGESTIONS
   ========================================================= */

function populateDatalists() {

  const partyList =
    $("#party-list");

  const branchList =
    $("#branch-list");


  const parties =
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
      .sort();


  const branches =
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
      .sort();


  if (partyList) {

    partyList.innerHTML =
      parties
        .map(
          function (name) {

            return `
              <option value="${safe(name)}"></option>
            `;

          }
        )
        .join("");

  }


  if (branchList) {

    branchList.innerHTML =
      branches
        .map(
          function (name) {

            return `
              <option value="${safe(name)}"></option>
            `;

          }
        )
        .join("");

  }

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageName) {

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
          button.dataset.page === pageName
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

  editingShipmentId =
    null;


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


  const button =
    form.querySelector(
      '[type="submit"]'
    );


  if (button) {

    button.textContent =
      "Save goods receipt";

  }


  const message =
    $("#form-message");


  if (message) {

    message.textContent =
      "";

  }

}


/* =========================================================
   EDIT SHIPMENT
   ========================================================= */

function editShipment(shipment) {

  if (!shipment) {

    return;

  }


  editingShipmentId =
    shipment.id;


  const form =
    $("#shipment-form");


  if (!form) {

    return;

  }


  const fields = [

    "received_date",
    "lr_number",
    "party_name",
    "branch_name",
    "quantity",
    "amount",
    "payment_type",
    "remarks"

  ];


  fields.forEach(
    function (field) {

      if (form.elements[field]) {

        form.elements[field].value =
          shipment[field] ?? "";

      }

    }
  );


  const button =
    form.querySelector(
      '[type="submit"]'
    );


  if (button) {

    button.textContent =
      "Save changes";

  }


  showPage("receive");

}


/* =========================================================
   SHIPMENT ROW
   ========================================================= */

function shipmentRow(
  shipment,
  mode
) {

  const status =
    shipmentStatus(shipment);


  const statusClass =
    status === "COMPLETED"
      ? "completed"
      : status === "ACCOUNTS PENDING"
        ? "accounts"
        : "pending";


  let actions = "";


  if (
    mode === "workflow"
  ) {

    if (
      status ===
      "PENDING DELIVERY"
    ) {

      actions =
        actionButton(
          "deliver",
          shipment,
          "MARK DELIVERY"
        );

    }


    else if (
      status ===
      "ACCOUNTS PENDING"
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


  if (
    mode === "all"
  ) {

    actions =
      actionButton(
        "edit",
        shipment,
        "EDIT",
        "light"
      ) +

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
        ${
          safe(shipment.remarks) ||
          "—"
        }
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
   ACTION BUTTON
   ========================================================= */

function actionButton(
  type,
  shipment,
  label,
  kind = ""
) {

  return `

    <button
      class="action ${kind}"
      data-action="${type}"
      data-id="${shipment.id}"
      type="button"
    >
      ${label}
    </button>

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

    element.innerHTML = `

      <p class="empty">
        NO SHIPMENTS FOUND.
      </p>

    `;

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
   STOCK TABLE
   ========================================================= */

function renderStockTable(
  data
) {

  const element =
    $("#stock-table");


  if (!element) {

    return;

  }


  if (
    !data ||
    !data.length
  ) {

    element.innerHTML = `

      <p class="empty">
        THERE ARE NO UNDELIVERED GOODS TO CHECK.
      </p>

    `;

    return;

  }


  element.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>LR NO.</th>
            <th>PARTY</th>
            <th>FROM</th>
            <th>QTY</th>
            <th>REMARKS</th>
            <th>LAST CHECK</th>
            <th>GODOWN STATUS</th>
            <th>ACTIONS</th>

          </tr>

        </thead>

        <tbody>

          ${data
            .map(
              function (shipment) {

                const status =
                  shipment.stock_status;


                let statusHTML;


                if (status) {

                  statusHTML = `

                    <span
                      class="badge ${
                        status ===
                        "IN GODOWN"
                          ? "completed"
                          : "pending"
                      }"
                    >

                      ${
                        status ===
                        "IN GODOWN"
                          ? "IN GODOWN"
                          : "NOT FOUND"
                      }

                    </span>

                  `;

                }

                else {

                  statusHTML = `

                    <span class="muted">
                      NOT CHECKED
                    </span>

                  `;

                }


                return `

                  <tr>

                    <td>
                      <b>
                        ${safe(
                          shipment.lr_number
                        )}
                      </b>
                    </td>

                    <td>
                      ${safe(
                        shipment.party_name
                      )}
                    </td>

                    <td>
                      ${safe(
                        shipment.branch_name
                      )}
                    </td>

                    <td>
                      ${safe(
                        shipment.quantity
                      )}
                    </td>

                    <td>
                      ${
                        safe(
                          shipment.remarks
                        ) || "—"
                      }
                    </td>

                    <td>
                      ${formatDate(
                        shipment.stock_checked_date
                      )}
                    </td>

                    <td>
                      ${statusHTML}
                    </td>

                    <td class="actions">

                      ${actionButton(
                        "in-godown",
                        shipment,
                        "IN GODOWN"
                      )}

                      ${actionButton(
                        "not-found",
                        shipment,
                        "NOT FOUND",
                        "danger"
                      )}

                    </td>

                  </tr>

                `;

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


  /* STOCK CHECK */

  renderStockTable(
    pending
  );


  populateDatalists();

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


      if (loginButton) {

        loginButton.disabled =
          true;

        loginButton.textContent =
          "SIGNING IN...";

      }


      loginMessage.textContent =
        "PLEASE WAIT...";


      try {

        const response =
          await fetch(

            SUPABASE_URL +
            "/auth/v1/token?grant_type=password",

            {

              method:
                "POST",

              headers: {

                "apikey":
                  SUPABASE_KEY,

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  email:
                    OFFICE_EMAIL,

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
          SESSION_KEY,
          accessToken
        );


        loginMessage.textContent =
          "";


        showApp();


        await loadShipments();


        console.log(
          "LOGIN SUCCESSFUL"
        );


      }

      catch (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );


        loginMessage.textContent =
          error.message;

      }

      finally {

        if (loginButton) {

          loginButton.disabled =
            false;

          loginButton.textContent =
            "SIGN IN";

        }

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

      accessToken =
        null;


      sessionStorage.removeItem(
        SESSION_KEY
      );


      const password =
        $("#login-password");


      if (password) {

        password.value =
          "";

      }


      showLogin();

    }
  );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

document
  .querySelectorAll(".nav-link")
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const page =
            button.dataset.page;


          if (
            page === "receive"
          ) {

            resetReceiveForm();

          }


          showPage(page);

        }
      );

    }
  );


/* =========================================================
   VIEW ALL / OTHER DATA-GO BUTTONS
   ========================================================= */

document
  .querySelectorAll("[data-go]")
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
   SAVE RECEIVE GOODS
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
          '[type="submit"]'
        );


      const formData =
        Object.fromEntries(
          new FormData(
            shipmentForm
          )
        );


      const receivedDate =
        formData.received_date;


      const lrNumber =
        normalizeUppercase(
          formData.lr_number
        );


      const partyName =
        normalizeUppercase(
          formData.party_name
        );


      const branchName =
        normalizeUppercase(
          formData.branch_name
        );


      const quantity =
        Number(
          formData.quantity
        );


      const amount =
        Number(
          formData.amount
        );


      const paymentType =
        formData.payment_type;


      const remarks =
        normalizeUppercase(
          formData.remarks
        );


      /* VALIDATION */

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
        quantity <= 0
      ) {

        formMessage.textContent =
          "PLEASE ENTER A VALID QUANTITY.";

        return;

      }


      if (
        Number.isNaN(amount) ||
        amount < 0
      ) {

        formMessage.textContent =
          "PLEASE ENTER A VALID AMOUNT.";

        return;

      }


      /*
       * ONLY THESE 3 PAYMENT TYPES
       *
       * TOPAY
       * TBB
       * PAID
       */

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


      if (!accessToken) {

        formMessage.textContent =
          "YOUR LOGIN SESSION HAS EXPIRED. PLEASE SIGN IN AGAIN.";

        showLogin();

        return;

      }


      if (saveButton) {

        saveButton.disabled =
          true;

        saveButton.textContent =
          editingShipmentId
            ? "SAVING CHANGES..."
            : "SAVING...";

      }


      formMessage.textContent =
        "SAVING GOODS RECEIPT...";


      try {

        /*
         * GET OR CREATE PARTY
         */

        const partyId =
          await getOrCreate(
            "parties",
            partyName
          );


        /*
         * GET OR CREATE BRANCH
         */

        const branchId =
          await getOrCreate(
            "branches",
            branchName
          );


        /*
         * PREPARE SHIPMENT
         */

        const payload = {

          received_date:
            receivedDate,

          lr_number:
            lrNumber,

          party_id:
            partyId,

          from_branch_id:
            branchId,

          quantity:
            quantity,

          amount:
            amount,

          payment_type:
            paymentType,

          remarks:
            remarks || null

        };


        let savedShipment;


        /*
         * EDIT EXISTING
         */

        if (editingShipmentId) {

          const result =
            await api(
              "shipments?id=eq." +
              editingShipmentId,
              {

                method:
                  "PATCH",

                headers: {

                  "Content-Type":
                    "application/json",

                  "Prefer":
                    "return=representation"

                },

                body:
                  JSON.stringify(
                    payload
                  )

              }
            );


          savedShipment =
            result[0];

        }


        /*
         * CREATE NEW
         */

        else {

          const result =
            await api(
              "shipments",
              {

                method:
                  "POST",

                headers: {

                  "Content-Type":
                    "application/json",

                  "Prefer":
                    "return=representation"

                },

                body:
                  JSON.stringify(
                    [payload]
                  )

              }
            );


          savedShipment =
            result[0];


          /*
           * RECORD RECEIVED EVENT
           */

          if (
            savedShipment &&
            savedShipment.id
          ) {

            try {

              await api(
                "shipment_events",
                {

                  method:
                    "POST",

                  headers: {

                    "Content-Type":
                      "application/json",

                    "Prefer":
                      "return=minimal"

                  },

                  body:
                    JSON.stringify(
                      [
                        {

                          shipment_id:
                            savedShipment.id,

                          event_type:
                            "RECEIVED",

                          event_date:
                            receivedDate,

                          notes:
                            remarks ||
                            null

                        }
                      ]
                    )

                }
              );

            }

            catch (eventError) {

              console.error(
                "RECEIVED EVENT ERROR:",
                eventError
              );

            }

          }

        }


        /*
         * SUCCESS
         */

        formMessage.textContent =
          savedShipment &&
          savedShipment.serial_no
            ? (
                "RECEIVE GOODS SAVED SUCCESSFULLY — SERIAL NO. " +
                savedShipment.serial_no
              )
            : "RECEIVE GOODS SAVED SUCCESSFULLY.";


        resetReceiveForm();


        /*
         * Keep success message
         */

        formMessage.textContent =
          savedShipment &&
          savedShipment.serial_no
            ? (
                "RECEIVE GOODS SAVED SUCCESSFULLY — SERIAL NO. " +
                savedShipment.serial_no
              )
            : "RECEIVE GOODS SAVED SUCCESSFULLY.";


        await loadShipments();


        console.log(
          "SHIPMENT SAVED:",
          savedShipment
        );

      }


      catch (error) {

        console.error(
          "SHIPMENT SAVE ERROR:",
          error
        );


        formMessage.textContent =
          error.message ||
          "ERROR SAVING GOODS RECEIPT.";

      }


      finally {

        if (saveButton) {

          saveButton.disabled =
            false;

          saveButton.textContent =
            editingShipmentId
              ? "Save changes"
              : "Save goods receipt";

        }

      }

    }
  );

}


/* =========================================================
   ACTIONS
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


    const action =
      button.dataset.action;


    /* EDIT */

    if (
      action === "edit"
    ) {

      editShipment(
        shipment
      );

      return;

    }


    /* DELETE */

    if (
      action === "delete"
    ) {

      const confirmed =
        confirm(

          "DELETE LR " +
          shipment.lr_number +
          "?\n\nTHIS CANNOT BE UNDONE."

        );


      if (!confirmed) {

        return;

      }


      cloudAction(
        async function () {

          await api(
            "shipments?id=eq." +
            shipment.id,
            {

              method:
                "DELETE"

            }
          );

        }
      );


      return;

    }


    /* MARK UNDELIVERED */

    if (
      action === "undelivered"
    ) {

      const confirmed =
        confirm(

          "MARK LR " +
          shipment.lr_number +
          " AS UNDELIVERED?\n\n" +
          "DELIVERY AND A/C DATES WILL BE REMOVED."

        );


      if (!confirmed) {

        return;

      }


      cloudAction(
        async function () {

          await api(
            "shipments?id=eq." +
            shipment.id,
            {

              method:
                "PATCH",

              headers: {

                "Content-Type":
                  "application/json",

                "Prefer":
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

        }
      );


      return;

    }


    /* STOCK: IN GODOWN */

    if (
      action ===
      "in-godown"
    ) {

      cloudAction(
        async function () {

          await saveStockCheck(
            shipment,
            "IN GODOWN"
          );

        }
      );


      return;

    }


    /* STOCK: NOT FOUND */

    if (
      action ===
      "not-found"
    ) {

      cloudAction(
        async function () {

          await saveStockCheck(
            shipment,
            "NOT FOUND"
          );

        }
      );


      return;

    }


    /* DATE ACTION */

    currentAction = {

      type:
        action,

      shipment:
        shipment

    };


    const dialog =
      $("#date-dialog");


    const title =
      $("#dialog-title");


    const detail =
      $("#dialog-detail");


    const dateInput =
      $("#action-date");


    const dateLabel =
      $("#date-label");


    if (!dialog) {

      return;

    }


    if (
      action ===
      "deliver"
    ) {

      title.textContent =
        "MARK DELIVERY";

      detail.textContent =
        shipment.lr_number +
        " · " +
        shipment.party_name;

      dateLabel.textContent =
        "DELIVERY DATE";

      dateInput.min =
        shipment.received_date;

    }


    else {

      title.textContent =
        "ENTER A/C DATE";

      detail.textContent =
        shipment.lr_number +
        " · " +
        shipment.party_name;

      dateLabel.textContent =
        "A/C DATE";

      dateInput.min =
        shipment.delivery_date;

    }


    dateInput.value =
      today();


    dialog.showModal();

  }
);


/* =========================================================
   SAVE DATE DIALOG
   ========================================================= */

const dateForm =
  $("#date-form");


if (dateForm) {

  dateForm.addEventListener(
    "submit",
    function (event) {

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

        return;

      }


      cloudAction(
        async function () {

          const field =
            currentAction.type ===
            "deliver"

              ? "delivery_date"

              : "accounts_date";


          await api(
            "shipments?id=eq." +
            currentAction.shipment.id,
            {

              method:
                "PATCH",

              headers: {

                "Content-Type":
                  "application/json",

                "Prefer":
                  "return=minimal"

              },

              body:
                JSON.stringify({

                  [field]:
                    selectedDate

                })

            }
          );


          const dialog =
            $("#date-dialog");


          if (dialog) {

            dialog.close();

          }


          currentAction =
            null;

        }
      );

    }
  );

}


/* =========================================================
   SAVE STOCK CHECK
   ========================================================= */

async function saveStockCheck(
  shipment,
  status
) {

  await api(
    "stock_checks?on_conflict=shipment_id,checked_date",
    {

      method:
        "POST",

      headers: {

        "Content-Type":
          "application/json",

        "Prefer":
          "resolution=merge-duplicates"

      },

      body:
        JSON.stringify(
          [
            {

              shipment_id:
                shipment.id,

              checked_date:
                today(),

              check_status:
                status

            }
          ]
        )

    }
  );

}


/* =========================================================
   CLOUD ACTION
   ========================================================= */

async function cloudAction(
  callback
) {

  try {

    await callback();

    await loadShipments();

  }

  catch (error) {

    console.error(
      "CLOUD ACTION ERROR:",
      error
    );


    alert(
      error.message ||
      "ACTION FAILED."
    );

  }

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

          const search =
            input.value
              .trim()
              .toLowerCase();


          const kind =
            input.dataset.search;


          let data;


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


          else if (
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


          else if (
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


          else {

            data =
              shipments;

          }


          if (search) {

            data =
              data.filter(
                function (shipment) {

                  return (

                    (
                      shipment.lr_number ||
                      ""
                    )

                      .toLowerCase()

                      .includes(search)

                    ||

                    (
                      shipment.party_name ||
                      ""
                    )

                      .toLowerCase()

                      .includes(search)

                    ||

                    (
                      shipment.branch_name ||
                      ""
                    )

                      .toLowerCase()

                      .includes(search)

                    ||

                    (
                      shipment.remarks ||
                      ""
                    )

                      .toLowerCase()

                      .includes(search)

                  );

                }
              );

          }


          if (
            kind ===
            "stock"
          ) {

            renderStockTable(
              data
            );

          }

          else {

            renderTable(
              data,
              "#" +
              kind +
              "-table",

              kind ===
                "all"
                ? "all"
                : "workflow"

            );

          }

        }
      );

    }
  );


/* =========================================================
   INITIAL LOAD
   ========================================================= */

resetReceiveForm();


if (accessToken) {

  showApp();


  loadShipments()
    .catch(
      function (error) {

        console.error(
          "INITIAL LOAD ERROR:",
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

}

else {

  showLogin();

}
