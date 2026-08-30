/* =========================================================
   CHENNAI GOODS MANAGEMENT
   COMPLETE APP.JS
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

let token =
  sessionStorage.getItem(SESSION_KEY);

let shipments = [];

let currentAction = null;

let editingId = null;


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector) =>
  document.querySelector(selector);


const today = () =>
  new Date()
    .toISOString()
    .slice(0, 10);


const normalizeUppercase = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();


const safe = (value) =>
  String(value ?? "")
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


const formatDate = (value) => {

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
};


/* =========================================================
   IMPORTANT WORKFLOW STATUS
   =========================================================

   TOPAY:
   received
      ↓
   delivery
      ↓
   accounts
      ↓
   completed

   TBB / PAID:
   received
      ↓
   delivery
      ↓
   completed

   ========================================================= */

function statusOf(shipment) {

  /* TOPAY completed only after accounts date */

  if (
    shipment.payment_type === "TOPAY"
  ) {

    if (shipment.accounts_date) {
      return "Completed";
    }

    if (shipment.delivery_date) {
      return "Accounts pending";
    }

    return "Pending delivery";
  }


  /* TBB and PAID completed immediately
     after delivery */

  if (
    shipment.payment_type === "TBB" ||
    shipment.payment_type === "PAID"
  ) {

    if (shipment.delivery_date) {
      return "Completed";
    }

    return "Pending delivery";
  }


  /* Safe fallback */

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
      `Bearer ${token}`,

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
        .catch(
          () => ({})
        );


    throw new Error(
      body.message ||
      body.error_description ||
      body.hint ||
      body.details ||
      `Cloud request failed (${response.status}).`
    );
  }


  if (response.status === 204) {
    return null;
  }


  return response.json();
}


/* =========================================================
   LOAD SHIPMENTS
   ========================================================= */

async function load() {

  const select =
    "*,parties(party_name),branches(branch_name,branch_code)";


  const rows =
    await api(
      `shipments?${new URLSearchParams({
        select,
        order: "created_at.desc"
      })}`
    );


  shipments =
    rows.map(
      function (shipment) {

        return {
          ...shipment,

          party_name:
            shipment.parties?.party_name ||
            "",

          branch_name:
            shipment.branches?.branch_name ||
            shipment.branches?.branch_code ||
            ""
        };

      }
    );


  render();
}


/* =========================================================
   PARTY
   ========================================================= */

async function getOrCreateParty(
  name
) {

  const cleanName =
    normalizeUppercase(name);


  const query =
    new URLSearchParams({

      select: "id",

      party_name:
        `eq.${cleanName}`,

      limit: "1"

    });


  const existing =
    await api(
      `parties?${query}`
    );


  if (existing[0]) {

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

        body:
          JSON.stringify([
            {
              party_name:
                cleanName,

              active:
                true
            }
          ])
      }
    );


  return created[0].id;
}


/* =========================================================
   BRANCH
   ========================================================= */

async function getOrCreateBranch(
  name
) {

  const cleanName =
    normalizeUppercase(name);


  const query =
    new URLSearchParams({

      select: "id",

      branch_code:
        `eq.${cleanName}`,

      limit: "1"

    });


  const existing =
    await api(
      `branches?${query}`
    );


  if (existing[0]) {

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

        body:
          JSON.stringify([
            {
              branch_code:
                cleanName,

              branch_name:
                cleanName,

              active:
                true
            }
          ])
      }
    );


  return created[0].id;
}


/* =========================================================
   ACTION BUTTON
   ========================================================= */

function button(
  type,
  shipment,
  label,
  kind = ""
) {

  return `
    <button
      type="button"
      class="action ${kind}"
      data-action="${type}"
      data-id="${shipment.id}"
    >
      ${label}
    </button>
  `;
}


/* =========================================================
   TABLE ROW
   ========================================================= */

function row(
  shipment,
  mode
) {

  const status =
    statusOf(shipment);


  const statusClass =
    status === "Completed"
      ? "completed"
      : status === "Accounts pending"
        ? "accounts"
        : "pending";


  let actions = "";


  /* =====================================================
     WORKFLOW ACTIONS
     ===================================================== */

  if (mode === "workflow") {

    if (
      status ===
      "Pending delivery"
    ) {

      actions =
        button(
          "deliver",
          shipment,
          "Delivery"
        );

    }

    else if (
      status ===
      "Accounts pending"
    ) {

      /*
       * This can only be TOPAY
       */

      actions =
        button(
          "accounts",
          shipment,
          "Enter A/C date"
        ) +

        button(
          "undelivered",
          shipment,
          "Mark undelivered",
          "light"
        );

    }

    else {

      /*
       * Completed shipments
       * can still be reversed
       */

      actions =
        button(
          "undelivered",
          shipment,
          "Mark undelivered",
          "light"
        );
    }
  }


  /* =====================================================
     ALL SHIPMENTS ACTIONS
     ===================================================== */

  if (mode === "all") {

    actions =
      (
        shipment.delivery_date
          ? button(
              "undelivered",
              shipment,
              "Mark undelivered",
              "light"
            )
          : ""
      ) +

      button(
        "edit",
        shipment,
        "Edit",
        "light"
      ) +

      button(
        "delete",
        shipment,
        "Delete",
        "danger"
      );
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
   TABLE
   ========================================================= */

function table(
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
  `;


  element.innerHTML =
    data.length

      ? `
        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                ${headers}

                ${
                  mode
                    ? "<th></th>"
                    : ""
                }

              </tr>

            </thead>

            <tbody>

              ${data
                .map(
                  function (shipment) {
                    return row(
                      shipment,
                      mode
                    );
                  }
                )
                .join("")}

            </tbody>

          </table>

        </div>
      `

      : `
        <p class="empty">
          NO SHIPMENTS FOUND.
        </p>
      `;
}


/* =========================================================
   RENDER
   ========================================================= */

function render() {

  /* -----------------------------------------------------
     DELIVERY
     All shipments without delivery date
     TOPAY + TBB + PAID
     ----------------------------------------------------- */

  const pending =
    shipments.filter(
      function (shipment) {

        return !shipment.delivery_date;

      }
    );


  /* -----------------------------------------------------
     ACCOUNTS

     ONLY TOPAY
     AND already delivered
     AND accounts date not entered
     ----------------------------------------------------- */

  const accountsPending =
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


  /* -----------------------------------------------------
     COMPLETED

     TOPAY:
       accounts_date exists

     TBB / PAID:
       delivery_date exists
     ----------------------------------------------------- */

  const completed =
    shipments.filter(
      function (shipment) {

        return (
          (
            shipment.payment_type ===
              "TOPAY" &&

            !!shipment.accounts_date
          )

          ||

          (
            (
              shipment.payment_type ===
                "TBB" ||

              shipment.payment_type ===
                "PAID"
            ) &&

            !!shipment.delivery_date
          )
        );

      }
    );


  /* -----------------------------------------------------
     RECEIVED TODAY
     ----------------------------------------------------- */

  const receivedToday =
    shipments.filter(
      function (shipment) {

        return (
          shipment.received_date ===
          today()
        );

      }
    );


  /* -----------------------------------------------------
     COMPLETED TODAY
     ----------------------------------------------------- */

  const completedToday =
    completed.filter(
      function (shipment) {

        /*
         * TOPAY uses accounts date
         */

        if (
          shipment.payment_type ===
          "TOPAY"
        ) {

          return (
            shipment.accounts_date ===
            today()
          );
        }


        /*
         * TBB / PAID use delivery date
         */

        return (
          shipment.delivery_date ===
          today()
        );

      }
    );


  /* -----------------------------------------------------
     DASHBOARD
     ----------------------------------------------------- */

  const receivedStat =
    $("#stat-received");

  const deliveryStat =
    $("#stat-delivery");

  const accountsStat =
    $("#stat-accounts");

  const completedStat =
    $("#stat-completed");


  if (receivedStat) {

    receivedStat.textContent =
      receivedToday.length;
  }


  if (deliveryStat) {

    deliveryStat.textContent =
      pending.length;
  }


  if (accountsStat) {

    accountsStat.textContent =
      accountsPending.length;
  }


  if (completedStat) {

    completedStat.textContent =
      completedToday.length;
  }


  /* -----------------------------------------------------
     SIDEBAR COUNTS
     ----------------------------------------------------- */

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


  /* -----------------------------------------------------
     TABLES
     ----------------------------------------------------- */

  table(
    shipments.slice(0, 6),
    "#recent-table"
  );


  table(
    pending,
    "#delivery-table",
    "workflow"
  );


  table(
    accountsPending,
    "#accounts-table",
    "workflow"
  );


  table(
    shipments,
    "#all-table",
    "all"
  );


  /* -----------------------------------------------------
     PARTY DATALIST
     ----------------------------------------------------- */

  const parties =
    [
      ...new Set(
        shipments
          .map(
            (shipment) =>
              shipment.party_name
          )
          .filter(Boolean)
      )
    ]
      .sort(
        (a, b) =>
          a.localeCompare(b)
      );


  const partyList =
    $("#party-list");


  if (partyList) {

    partyList.innerHTML =
      parties
        .map(
          function (name) {

            return `
              <option
                value="${safe(name)}"
              >
            `;

          }
        )
        .join("");
  }


  /* -----------------------------------------------------
     BRANCH DATALIST
     ----------------------------------------------------- */

  const branches =
    [
      ...new Set(
        shipments
          .map(
            (shipment) =>
              shipment.branch_name
          )
          .filter(Boolean)
      )
    ]
      .sort(
        (a, b) =>
          a.localeCompare(b)
      );


  const branchList =
    $("#branch-list");


  if (branchList) {

    branchList.innerHTML =
      branches
        .map(
          function (name) {

            return `
              <option
                value="${safe(name)}"
              >
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
  page
) {

  document
    .querySelectorAll(".page")
    .forEach(
      function (element) {

        element.classList.toggle(
          "active",
          element.id === page
        );

      }
    );


  document
    .querySelectorAll(".nav-link")
    .forEach(
      function (element) {

        element.classList.toggle(
          "active",
          element.dataset.page ===
            page
        );

      }
    );


  const titles = {

    dashboard: [
      "Good morning",
      "CHENNAI BRANCH"
    ],

    receive: [
      editingId
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
    titles[page] ||
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
      page === "receive"
        ? "none"
        : "";
  }
}


/* =========================================================
   RESET FORM
   ========================================================= */

function resetForm() {

  editingId = null;


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
      '[type="submit"]'
    );


  if (submitButton) {

    submitButton.textContent =
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

function editShipment(
  shipment
) {

  editingId =
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
      '[type="submit"]'
    );


  if (submitButton) {

    submitButton.textContent =
      "Save changes";
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

    await load();

  }

  catch (error) {

    console.error(
      "CLOUD ACTION ERROR:",
      error
    );


    alert(
      error.message ||
      "Something went wrong."
    );
  }
}


/* =========================================================
   LOGIN / APP
   ========================================================= */

function showApp() {

  $("#login-screen").style.display =
    "none";

  $("#app-shell").hidden =
    false;

  $("#app-shell").style.display =
    "block";
}


function showLogin() {

  $("#app-shell").style.display =
    "none";

  $("#app-shell").hidden =
    true;

  $("#login-screen").style.display =
    "grid";
}


/* =========================================================
   LOGIN
   ========================================================= */

$("#login-form")
  .addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const message =
        $("#login-message");


      const password =
        $("#login-password")
          .value;


      if (!password) {

        message.textContent =
          "ENTER YOUR PASSWORD.";

        return;
      }


      message.textContent =
        "SIGNING IN...";


      try {

        const response =
          await fetch(
            `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
            {

              method: "POST",

              headers: {

                apikey:
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
          await response
            .json()
            .catch(
              () => ({})
            );


        if (
          !response.ok ||
          !data.access_token
        ) {

          message.textContent =
            data.error_description ||
            data.msg ||
            "SIGN-IN FAILED. CHECK YOUR PASSWORD.";

          return;
        }


        token =
          data.access_token;


        sessionStorage.setItem(
          SESSION_KEY,
          token
        );


        showApp();


        try {

          await load();

          showPage(
            "dashboard"
          );

          message.textContent =
            "";

        }

        catch (error) {

          console.error(
            "DASHBOARD LOAD FAILED:",
            error
          );


          message.textContent =
            "LOGIN SUCCEEDED, BUT DASHBOARD COULD NOT LOAD.";


          showLogin();
        }

      }

      catch (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );


        message.textContent =
          "COULD NOT CONNECT TO THE CLOUD.";
      }

    }
  );


/* =========================================================
   SIGN OUT
   ========================================================= */

$("#sign-out")
  .addEventListener(
    "click",
    function () {

      token = null;

      sessionStorage.removeItem(
        SESSION_KEY
      );


      $("#login-password")
        .value = "";


      $("#login-message")
        .textContent = "";


      showLogin();
    }
  );


/* =========================================================
   SIDEBAR
   ========================================================= */

document
  .querySelectorAll(
    ".nav-link"
  )
  .forEach(
    function (buttonElement) {

      buttonElement
        .addEventListener(
          "click",
          function () {

            const page =
              buttonElement
                .dataset
                .page;


            if (
              page ===
              "receive"
            ) {

              resetForm();
            }


            showPage(page);

          }
        );

    }
  );


/* =========================================================
   VIEW ALL BUTTONS
   ========================================================= */

document
  .querySelectorAll(
    "[data-go]"
  )
  .forEach(
    function (buttonElement) {

      buttonElement
        .addEventListener(
          "click",
          function () {

            showPage(
              buttonElement
                .dataset
                .go
            );

          }
        );

    }
  );


/* =========================================================
   RECEIVE BUTTON
   ========================================================= */

$("#receive-button")
  .addEventListener(
    "click",
    function () {

      resetForm();

      showPage(
        "receive"
      );

    }
  );


/* =========================================================
   RECEIVE GOODS FORM
   ========================================================= */

$("#shipment-form")
  .addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      cloudAction(
        async function () {

          const data =
            Object.fromEntries(
              new FormData(
                event.target
              )
            );


          const partyName =
            normalizeUppercase(
              data.party_name
            );


          const branchName =
            normalizeUppercase(
              data.branch_name
            );


          if (!partyName) {

            throw new Error(
              "PARTY NAME IS REQUIRED."
            );
          }


          if (!branchName) {

            throw new Error(
              "FROM BRANCH IS REQUIRED."
            );
          }


          if (!data.received_date) {

            throw new Error(
              "RECEIVED DATE IS REQUIRED."
            );
          }


          if (!data.lr_number?.trim()) {

            throw new Error(
              "LR NUMBER IS REQUIRED."
            );
          }


          if (
            !data.quantity ||
            Number(data.quantity) <= 0
          ) {

            throw new Error(
              "QUANTITY MUST BE GREATER THAN ZERO."
            );
          }


          if (
            data.amount === "" ||
            Number(data.amount) < 0
          ) {

            throw new Error(
              "AMOUNT CANNOT BE NEGATIVE."
            );
          }


          const paymentType =
            data.payment_type;


          if (
            ![
              "TOPAY",
              "TBB",
              "PAID"
            ].includes(
              paymentType
            )
          ) {

            throw new Error(
              "INVALID PAYMENT TYPE."
            );
          }


          const partyId =
            await getOrCreateParty(
              partyName
            );


          const branchId =
            await getOrCreateBranch(
              branchName
            );


          const payload = {

            received_date:
              data.received_date,

            lr_number:
              normalizeUppercase(
                data.lr_number
              ),

            party_id:
              partyId,

            from_branch_id:
              branchId,

            quantity:
              Number(
                data.quantity
              ),

            amount:
              Number(
                data.amount
              ),

            payment_type:
              paymentType,

            remarks:
              normalizeUppercase(
                data.remarks
              ) || null

          };


          if (editingId) {

            await api(
              `shipments?id=eq.${encodeURIComponent(
                editingId
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


            editingId =
              null;

          }

          else {

            await api(
              "shipments",
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
                    payload
                  ])

              }
            );
          }


          resetForm();


          $("#form-message")
            .textContent =
              "RECEIVE GOODS SAVED SUCCESSFULLY.";
        }
      );

    }
  );


/* =========================================================
   TABLE ACTIONS
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {

    const buttonElement =
      event.target.closest(
        "[data-action]"
      );


    if (!buttonElement) {
      return;
    }


    const shipment =
      shipments.find(
        function (item) {

          return (
            String(item.id) ===
            String(
              buttonElement.dataset.id
            )
          );

        }
      );


    if (!shipment) {
      return;
    }


    const type =
      buttonElement.dataset.action;


    /* -----------------------------------------------------
       EDIT
       ----------------------------------------------------- */

    if (
      type === "edit"
    ) {

      editShipment(
        shipment
      );

      return;
    }


    /* -----------------------------------------------------
       DELETE
       ----------------------------------------------------- */

    if (
      type === "delete"
    ) {

      if (
        confirm(
          `DELETE LR ${shipment.lr_number}? THIS CANNOT BE UNDONE.`
        )
      ) {

        cloudAction(
          function () {

            return api(
              `shipments?id=eq.${shipment.id}`,
              {
                method:
                  "DELETE"
              }
            );

          }
        );
      }


      return;
    }


    /* -----------------------------------------------------
       MARK UNDELIVERED
       ----------------------------------------------------- */

    if (
      type === "undelivered"
    ) {

      if (
        confirm(
          `MARK LR ${shipment.lr_number} AS UNDELIVERED?`
        )
      ) {

        cloudAction(
          async function () {

            await api(
              `shipments?id=eq.${shipment.id}`,
              {

                method:
                  "PATCH",

                headers: {
                  "Content-Type":
                    "application/json"
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


            await api(
              "shipment_events",
              {

                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify([
                    {
                      shipment_id:
                        shipment.id,

                      event_type:
                        "DELIVERY_REVERSED",

                      event_date:
                        today()
                    }
                  ])
              }
            );

          }
        );
      }


      return;
    }


    /* -----------------------------------------------------
       DELIVERY / ACCOUNTS DIALOG
       ----------------------------------------------------- */

    if (
      type !== "deliver" &&
      type !== "accounts"
    ) {

      return;
    }


    currentAction = {
      type,
      shipment
    };


    const isDelivery =
      type === "deliver";


    $("#dialog-title")
      .textContent =
        isDelivery
          ? "ENTER DELIVERY DATE"
          : "ENTER A/C DATE";


    $("#dialog-detail")
      .textContent =
        `${shipment.lr_number} · ${shipment.party_name}`;


    const dateLabel =
      $("#date-label");


    if (dateLabel) {

      dateLabel.textContent =
        isDelivery
          ? "DELIVERY DATE"
          : "A/C DATE";
    }


    const dateInput =
      $("#action-date");


    if (isDelivery) {

      dateInput.min =
        shipment.received_date;

      dateInput.value =
        shipment.delivery_date ||
        today();

    }

    else {

      dateInput.min =
        shipment.delivery_date;

      dateInput.value =
        shipment.accounts_date ||
        today();
    }


    $("#date-dialog")
      .showModal();

  }
);


/* =========================================================
   DATE ACTION
   ========================================================= */

$("#date-form")
  .addEventListener(
    "submit",
    function (event) {

      if (
        event.submitter?.value ===
        "cancel"
      ) {

        return;
      }


      event.preventDefault();


      cloudAction(
        async function () {

          if (!currentAction) {
            return;
          }


          const selectedDate =
            $("#action-date").value;


          if (!selectedDate) {

            throw new Error(
              "PLEASE SELECT A DATE."
            );
          }


          const shipment =
            currentAction.shipment;


          const isDelivery =
            currentAction.type ===
            "deliver";


          /* =================================================
             DELIVERY
             ================================================= */

          if (isDelivery) {

            await api(
              `shipments?id=eq.${shipment.id}`,
              {

                method:
                  "PATCH",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    delivery_date:
                      selectedDate
                  })

              }
            );


            await api(
              "shipment_events",
              {

                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify([
                    {

                      shipment_id:
                        shipment.id,

                      event_type:
                        "DELIVERY",

                      event_date:
                        selectedDate

                    }
                  ])
              }
            );


            /*
             * IMPORTANT:
             *
             * TOPAY:
             *   remains in Accounts.
             *
             * TBB:
             *   completed now.
             *
             * PAID:
             *   completed now.
             *
             * We DO NOT set accounts_date
             * for TBB or PAID.
             */

          }


          /* =================================================
             ACCOUNTS
             ================================================= */

          else {

            /*
             * Safety check:
             * only TOPAY can enter Accounts.
             */

            if (
              shipment.payment_type !==
              "TOPAY"
            ) {

              throw new Error(
                "ONLY TOPAY SHIPMENTS CAN ENTER ACCOUNTS."
              );
            }


            await api(
              `shipments?id=eq.${shipment.id}`,
              {

                method:
                  "PATCH",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    accounts_date:
                      selectedDate
                  })

              }
            );


            await api(
              "shipment_events",
              {

                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify([
                    {

                      shipment_id:
                        shipment.id,

                      event_type:
                        "ACCOUNTS_ENTERED",

                      event_date:
                        selectedDate

                    }
                  ])
              }
            );

          }


          $("#date-dialog")
            .close();


          currentAction =
            null;
        }
      );

    }
  );


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

          const query =
            input.value
              .toLowerCase()
              .trim();


          const kind =
            input.dataset.search;


          let data;


          /* -------------------------------------------------
             DELIVERY
             ------------------------------------------------- */

          if (
            kind === "delivery"
          ) {

            data =
              shipments.filter(
                function (shipment) {

                  return (
                    !shipment.delivery_date
                  );

                }
              );
          }


          /* -------------------------------------------------
             ACCOUNTS

             ONLY TOPAY
             ------------------------------------------------- */

          else if (
            kind === "accounts"
          ) {

            data =
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
          }


          /* -------------------------------------------------
             ALL
             ------------------------------------------------- */

          else {

            data =
              shipments;
          }


          data =
            data.filter(
              function (shipment) {

                return `
                  ${shipment.lr_number}
                  ${shipment.party_name}
                  ${shipment.branch_name}
                  ${shipment.remarks || ""}
                `
                  .toLowerCase()
                  .includes(query);

              }
            );


          table(
            data,
            `#${kind}-table`,
            kind === "all"
              ? "all"
              : "workflow"
          );

        }
      );

    }
  );


/* =========================================================
   START
   ========================================================= */

resetForm();


if (token) {

  showApp();


  load()
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


        token = null;


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
