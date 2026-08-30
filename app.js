const SUPABASE_URL = 'https://yonxttybnkvxwnbhzwyi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EC6Tm1kbWuPEPtfeeJED9Q_6dbqOZVh';
const OFFICE_EMAIL = 'silambarasan2453@gmail.com';
const SESSION_KEY = 'chennai-goods-session';

let token = sessionStorage.getItem(SESSION_KEY);
let shipments = [];
let currentAction = null;
let editingId = null;

const $ = (selector) => document.querySelector(selector);

const today = () => new Date().toISOString().slice(0, 10);

const safe = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(new Date(`${value}T00:00:00`))
    : '—';


/* =========================================================
   STATUS
   ========================================================= */

function statusOf(shipment) {
  if (shipment.accounts_date) {
    return 'Completed';
  }

  if (shipment.delivery_date) {
    return 'Accounts pending';
  }

  return 'Pending delivery';
}


/* =========================================================
   SUPABASE API
   ========================================================= */

function authHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    ...extra
  };
}


async function api(path, options = {}) {

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: authHeaders(options.headers || {})
    }
  );

  if (!response.ok) {

    const body = await response.json().catch(() => ({}));

    throw new Error(
      body.message ||
      body.error_description ||
      body.hint ||
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

  const select = [
    '*',
    'parties(party_name)',
    'branches(branch_name,branch_code)'
  ].join(',');

  const params = new URLSearchParams({
    select,
    order: 'created_at.desc'
  });

  const rows = await api(`shipments?${params}`);

  shipments = rows.map((shipment) => ({

    ...shipment,

    party_name:
      shipment.parties?.party_name || '',

    branch_name:
      shipment.branches?.branch_name ||
      shipment.branches?.branch_code ||
      ''

  }));

  render();
}


/* =========================================================
   PARTY
   ========================================================= */

async function getOrCreateParty(name) {

  const cleanName = name.trim();

  const query = new URLSearchParams({
    select: 'id',
    party_name: `eq.${cleanName}`,
    limit: '1'
  });

  const existing = await api(`parties?${query}`);

  if (existing[0]) {
    return existing[0].id;
  }

  const created = await api(
    'parties',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },

      body: JSON.stringify([
        {
          party_name: cleanName,
          active: true
        }
      ])
    }
  );

  return created[0].id;
}


/* =========================================================
   BRANCH
   ========================================================= */

async function getOrCreateBranch(name) {

  const cleanName = name.trim();

  const query = new URLSearchParams({
    select: 'id',
    branch_code: `eq.${cleanName}`,
    limit: '1'
  });

  const existing = await api(`branches?${query}`);

  if (existing[0]) {
    return existing[0].id;
  }

  const created = await api(
    'branches',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },

      body: JSON.stringify([
        {
          branch_code: cleanName,
          branch_name: cleanName,
          active: true
        }
      ])
    }
  );

  return created[0].id;
}


/* =========================================================
   ACTION BUTTON
   ========================================================= */

function button(type, shipment, label, kind = '') {

  return `
    <button
      type="button"
      class="action ${kind}"
      data-action="${type}"
      data-id="${shipment.id}">
      ${label}
    </button>
  `;
}


/* =========================================================
   TABLE ROW
   ========================================================= */

function row(shipment, mode) {

  const status = statusOf(shipment);

  const statusClass =
    status === 'Completed'
      ? 'completed'
      : status === 'Accounts pending'
        ? 'accounts'
        : 'pending';

  let actions = '';

  if (mode === 'workflow') {

    if (status === 'Pending delivery') {

      actions =
        button(
          'deliver',
          shipment,
          'Delivery'
        );

    } else if (status === 'Accounts pending') {

      actions =
        button(
          'accounts',
          shipment,
          'Enter A/C date'
        ) +

        button(
          'undelivered',
          shipment,
          'Mark undelivered',
          'light'
        );

    } else {

      actions =
        button(
          'undelivered',
          shipment,
          'Mark undelivered',
          'light'
        );
    }
  }


  if (mode === 'all') {

    actions =
      (
        status !== 'Pending delivery'
          ? button(
              'undelivered',
              shipment,
              'Mark undelivered',
              'light'
            )
          : ''
      ) +

      button(
        'edit',
        shipment,
        'Edit',
        'light'
      ) +

      button(
        'delete',
        shipment,
        'Delete',
        'danger'
      );
  }


  return `
    <tr>

      <td>
        <b>${safe(shipment.lr_number)}</b>
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
        ).toLocaleString('en-IN')}
      </td>

      <td>
        ${safe(shipment.remarks) || '—'}
      </td>

      <td>
        ${formatDate(shipment.delivery_date)}
      </td>

      <td>
        ${formatDate(shipment.accounts_date)}
      </td>

      <td>
        ${formatDate(shipment.received_date)}
      </td>

      <td>
        <span class="badge ${statusClass}">
          ${status}
        </span>
      </td>

      ${
        mode
          ? `<td class="actions">${actions}</td>`
          : ''
      }

    </tr>
  `;
}


/* =========================================================
   TABLE
   ========================================================= */

function table(data, target, mode = false) {

  const headers = `
    <th>LR no.</th>
    <th>Party</th>
    <th>From</th>
    <th>Qty</th>
    <th>Amount</th>
    <th>Remarks</th>
    <th>Delivery date</th>
    <th>A/C date</th>
    <th>Received</th>
    <th>Status</th>
  `;

  const actionHeader =
    mode ? '<th></th>' : '';

  const element = $(target);

  if (!element) {
    return;
  }

  element.innerHTML = data.length

    ? `
      <div class="table-wrap">

        <table>

          <thead>
            <tr>
              ${headers}
              ${actionHeader}
            </tr>
          </thead>

          <tbody>
            ${data
              .map((shipment) =>
                row(shipment, mode)
              )
              .join('')}
          </tbody>

        </table>

      </div>
    `

    : `
      <p class="empty">
        No shipments found.
      </p>
    `;
}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function render() {

  const pending =
    shipments.filter(
      (s) => !s.delivery_date
    );

  const accountsPending =
    shipments.filter(
      (s) =>
        s.delivery_date &&
        !s.accounts_date
    );

  const completed =
    shipments.filter(
      (s) => s.accounts_date
    );


  const receivedToday =
    shipments.filter(
      (s) =>
        s.received_date === today()
    ).length;


  const completedToday =
    completed.filter(
      (s) =>
        s.accounts_date === today()
    ).length;


  const receivedStat =
    $('#stat-received');

  const deliveryStat =
    $('#stat-delivery');

  const accountsStat =
    $('#stat-accounts');

  const completedStat =
    $('#stat-completed');


  if (receivedStat) {
    receivedStat.textContent =
      receivedToday;
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
      completedToday;
  }


  const deliveryCount =
    $('#delivery-count');

  const accountsCount =
    $('#accounts-count');


  if (deliveryCount) {
    deliveryCount.textContent =
      pending.length || '';
  }

  if (accountsCount) {
    accountsCount.textContent =
      accountsPending.length || '';
  }


  table(
    shipments.slice(0, 6),
    '#recent-table'
  );

  table(
    pending,
    '#delivery-table',
    'workflow'
  );

  table(
    accountsPending,
    '#accounts-table',
    'workflow'
  );

  table(
    shipments,
    '#all-table',
    'all'
  );


  const parties =
    [
      ...new Set(
        shipments
          .map((s) => s.party_name)
          .filter(Boolean)
      )
    ].sort(
      (a, b) =>
        a.localeCompare(b)
    );


  const branches =
    [
      ...new Set(
        shipments
          .map((s) => s.branch_name)
          .filter(Boolean)
      )
    ].sort(
      (a, b) =>
        a.localeCompare(b)
    );


  const partyList =
    $('#party-list');

  const branchList =
    $('#branch-list');


  if (partyList) {

    partyList.innerHTML =
      parties
        .map(
          (name) =>
            `<option value="${safe(name)}">`
        )
        .join('');
  }


  if (branchList) {

    branchList.innerHTML =
      branches
        .map(
          (name) =>
            `<option value="${safe(name)}">`
        )
        .join('');
  }
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(page) {

  document
    .querySelectorAll('.page')
    .forEach((element) => {

      element.classList.toggle(
        'active',
        element.id === page
      );

    });


  document
    .querySelectorAll('.nav-link')
    .forEach((element) => {

      element.classList.toggle(
        'active',
        element.dataset.page === page
      );

    });


  const titles = {

    dashboard: [
      'Good morning',
      'CHENNAI BRANCH'
    ],

    receive: [
      editingId
        ? 'Edit shipment'
        : 'Receive goods',
      'NEW GOODS ENTRY'
    ],

    delivery: [
      'Pending delivery',
      'CHENNAI BRANCH'
    ],

    accounts: [
      'Accounts pending',
      'CHENNAI BRANCH'
    ],

    stock: [
      'Godown stock check',
      'DAILY PHYSICAL VERIFICATION'
    ],

    all: [
      'All shipments',
      'CHENNAI BRANCH'
    ]

  };


  const title =
    titles[page] ||
    titles.dashboard;


  const pageTitle =
    $('#page-title');

  const pageKicker =
    $('#page-kicker');

  const receiveButton =
    $('#receive-button');


  if (pageTitle) {
    pageTitle.textContent =
      title[0];
  }

  if (pageKicker) {
    pageKicker.textContent =
      title[1];
  }

  if (receiveButton) {

    receiveButton.style.display =
      page === 'receive'
        ? 'none'
        : '';
  }
}


/* =========================================================
   RESET RECEIVE FORM
   ========================================================= */

function resetForm() {

  editingId = null;

  const form =
    $('#shipment-form');

  if (!form) {
    return;
  }

  form.reset();

  if (form.elements.received_date) {

    form.elements.received_date.value =
      today();
  }


  const submitButton =
    form.querySelector(
      '[type="submit"]'
    );


  if (submitButton) {

    submitButton.textContent =
      'Save goods receipt';
  }


  const message =
    $('#form-message');

  if (message) {
    message.textContent = '';
  }
}


/* =========================================================
   EDIT SHIPMENT
   ========================================================= */

function editShipment(shipment) {

  editingId =
    shipment.id;

  const form =
    $('#shipment-form');

  if (!form) {
    return;
  }


  form.elements.received_date.value =
    shipment.received_date || '';

  form.elements.lr_number.value =
    shipment.lr_number || '';

  form.elements.party_name.value =
    shipment.party_name || '';

  form.elements.branch_name.value =
    shipment.branch_name || '';

  form.elements.quantity.value =
    shipment.quantity ?? '';

  form.elements.amount.value =
    shipment.amount ?? '';

  form.elements.payment_type.value =
    shipment.payment_type || 'TOPAY';

  form.elements.remarks.value =
    shipment.remarks || '';


  const submitButton =
    form.querySelector(
      '[type="submit"]'
    );


  if (submitButton) {

    submitButton.textContent =
      'Save changes';
  }


  showPage('receive');
}


/* =========================================================
   CLOUD ACTION
   ========================================================= */

async function cloudAction(action) {

  try {

    await action();

    await load();

  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      'Something went wrong.'
    );
  }
}


/* =========================================================
   LOGIN SCREEN
   ========================================================= */

/*
   IMPORTANT FIX:

   We use style.display instead of only
   the hidden attribute.

   This prevents .login-screen {
       display: grid;
   }

   from keeping the login page visible.
*/

function showApp() {

  const login =
    $('#login-screen');

  const app =
    $('#app-shell');


  if (login) {

    login.style.display =
      'none';
  }


  if (app) {

    app.hidden = false;

    app.style.display =
      'block';
  }
}


function showLogin() {

  const login =
    $('#login-screen');

  const app =
    $('#app-shell');


  if (app) {

    app.style.display =
      'none';

    app.hidden = true;
  }


  if (login) {

    login.hidden = false;

    login.style.display =
      'grid';
  }
}


/* =========================================================
   LOGIN
   ========================================================= */

const loginForm =
  $('#login-form');


if (loginForm) {

  loginForm.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const message =
        $('#login-message');

      const passwordInput =
        $('#login-password');


      const password =
        passwordInput
          ? passwordInput.value.trim()
          : '';


      if (!password) {

        if (message) {

          message.textContent =
            'Enter your password.';
        }

        return;
      }


      if (message) {

        message.textContent =
          'Signing in...';
      }


      try {

        const response =
          await fetch(
            `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
            {
              method: 'POST',

              headers: {
                apikey: SUPABASE_KEY,
                'Content-Type':
                  'application/json'
              },

              body: JSON.stringify({
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

          if (message) {

            message.textContent =
              data.error_description ||
              data.msg ||
              'Sign-in failed. Check your password.';
          }

          return;
        }


        /*
           LOGIN SUCCESS
        */

        token =
          data.access_token;


        sessionStorage.setItem(
          SESSION_KEY,
          token
        );


        /*
           IMPORTANT:

           Change screen BEFORE loading
           the dashboard.

           This guarantees that a slow
           database request does not leave
           the user staring at "Signing in".
        */

        showApp();


        if (message) {

          message.textContent =
            '';
        }


        try {

          await load();

          showPage(
            'dashboard'
          );

        } catch (error) {

          console.error(
            'Dashboard load failed:',
            error
          );


          /*
             Login succeeded but database
             loading failed.
          */

          if (message) {

            message.textContent =
              'Login succeeded, but the dashboard could not load. Check database permissions.';
          }


          showLogin();
        }

      } catch (error) {

        console.error(
          'Login request failed:',
          error
        );


        if (message) {

          message.textContent =
            'Could not connect to the cloud. Check your internet connection.';
        }
      }

    }
  );
}


/* =========================================================
   SIGN OUT
   ========================================================= */

const signOut =
  $('#sign-out');


if (signOut) {

  signOut.addEventListener(
    'click',
    () => {

      token = null;

      sessionStorage.removeItem(
        SESSION_KEY
      );


      const password =
        $('#login-password');

      const message =
        $('#login-message');


      if (password) {
        password.value = '';
      }

      if (message) {
        message.textContent = '';
      }


      showLogin();
    }
  );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

document
  .querySelectorAll('.nav-link')
  .forEach((buttonElement) => {

    buttonElement.addEventListener(
      'click',
      () => {

        const page =
          buttonElement.dataset.page;


        if (page === 'receive') {

          resetForm();
        }


        showPage(page);
      }
    );
  });


/* =========================================================
   DASHBOARD BUTTONS
   ========================================================= */

document
  .querySelectorAll('[data-go]')
  .forEach((buttonElement) => {

    buttonElement.addEventListener(
      'click',
      () => {

        showPage(
          buttonElement.dataset.go
        );
      }
    );
  });


/* =========================================================
   RECEIVE BUTTON
   ========================================================= */

const receiveButton =
  $('#receive-button');


if (receiveButton) {

  receiveButton.addEventListener(
    'click',
    () => {

      resetForm();

      showPage(
        'receive'
      );
    }
  );
}


/* =========================================================
   SAVE SHIPMENT
   ========================================================= */

const shipmentForm =
  $('#shipment-form');


if (shipmentForm) {

  shipmentForm.addEventListener(
    'submit',
    (event) => {

      event.preventDefault();


      cloudAction(
        async () => {

          const data =
            Object.fromEntries(
              new FormData(
                event.target
              )
            );


          const partyName =
            data.party_name.trim();

          const branchName =
            data.branch_name.trim();


          if (!partyName) {

            throw new Error(
              'Party name is required.'
            );
          }


          if (!branchName) {

            throw new Error(
              'From branch is required.'
            );
          }


          if (!data.received_date) {

            throw new Error(
              'Received date is required.'
            );
          }


          if (!data.lr_number.trim()) {

            throw new Error(
              'LR number is required.'
            );
          }


          if (
            !data.quantity ||
            Number(data.quantity) <= 0
          ) {

            throw new Error(
              'Quantity must be greater than zero.'
            );
          }


          if (
            Number(data.amount) < 0
          ) {

            throw new Error(
              'Amount cannot be negative.'
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
              data.lr_number.trim(),

            party_id:
              partyId,

            from_branch_id:
              branchId,

            quantity:
              Number(data.quantity),

            amount:
              Number(data.amount),

            payment_type:
              data.payment_type,

            remarks:
              data.remarks?.trim() ||
              null
          };


          if (editingId) {

            await api(
              `shipments?id=eq.${editingId}`,
              {
                method: 'PATCH',

                headers: {
                  'Content-Type':
                    'application/json',

                  Prefer:
                    'return=minimal'
                },

                body:
                  JSON.stringify(
                    payload
                  )
              }
            );

          } else {

            await api(
              'shipments',
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json',

                  Prefer:
                    'return=minimal'
                },

                body:
                  JSON.stringify([
                    payload
                  ])
              }
            );
          }


          resetForm();


          const formMessage =
            $('#form-message');


          if (formMessage) {

            formMessage.textContent =
              editingId
                ? 'Changes saved to cloud.'
                : 'Goods receipt saved to cloud.';
          }
        }
      );
    }
  );
}


/* =========================================================
   DELIVERY / ACCOUNTS / EDIT / DELETE
   ========================================================= */

document.addEventListener(
  'click',
  (event) => {

    const buttonElement =
      event.target.closest(
        '[data-action]'
      );


    if (!buttonElement) {
      return;
    }


    const shipment =
      shipments.find(
        (item) =>
          item.id ===
          buttonElement.dataset.id
      );


    if (!shipment) {
      return;
    }


    const type =
      buttonElement.dataset.action;


    /* EDIT */

    if (type === 'edit') {

      editShipment(
        shipment
      );

      return;
    }


    /* DELETE */

    if (type === 'delete') {

      if (
        confirm(
          `Delete LR ${shipment.lr_number}? This cannot be undone.`
        )
      ) {

        cloudAction(
          () =>
            api(
              `shipments?id=eq.${shipment.id}`,
              {
                method: 'DELETE'
              }
            )
        );
      }

      return;
    }


    /* MARK UNDELIVERED */

    if (type === 'undelivered') {

      if (
        confirm(
          `Mark LR ${shipment.lr_number} as undelivered? Its delivery and A/C dates will be removed.`
        )
      ) {

        cloudAction(
          async () => {

            await api(
              `shipments?id=eq.${shipment.id}`,
              {
                method: 'PATCH',

                headers: {
                  'Content-Type':
                    'application/json'
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
              'shipment_events',
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify([
                    {
                      shipment_id:
                        shipment.id,

                      event_type:
                        'DELIVERY_REVERSED',

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


    /* DELIVERY / ACCOUNTS */

    if (
      type !== 'deliver' &&
      type !== 'accounts'
    ) {

      return;
    }


    currentAction = {

      type:
        type,

      shipment:
        shipment
    };


    const dialog =
      $('#date-dialog');


    const dialogTitle =
      $('#dialog-title');

    const dialogDetail =
      $('#dialog-detail');

    const dateLabel =
      $('#date-label');

    const dateInput =
      $('#action-date');


    if (!dialog || !dateInput) {
      return;
    }


    if (dialogTitle) {

      dialogTitle.textContent =
        type === 'deliver'
          ? 'Enter delivery date'
          : 'Enter A/C date';
    }


    if (dialogDetail) {

      dialogDetail.textContent =
        `${shipment.lr_number} · ${shipment.party_name}`;
    }


    if (dateLabel) {

      dateLabel.childNodes[0]
        .nodeValue =
          type === 'deliver'
            ? 'Delivery date'
            : 'A/C date';
    }


    /*
       Delivery cannot be before
       received date.

       A/C date cannot be before
       delivery date.
    */

    dateInput.min =
      type === 'deliver'
        ? shipment.received_date
        : shipment.delivery_date;


    dateInput.value =
      type === 'deliver'
        ? shipment.delivery_date ||
          today()

        : shipment.accounts_date ||
          today();


    dialog.showModal();
  }
);


/* =========================================================
   DATE FORM
   ========================================================= */

const dateForm =
  $('#date-form');


if (dateForm) {

  dateForm.addEventListener(
    'submit',
    (event) => {

      if (
        event.submitter?.value ===
        'cancel'
      ) {

        return;
      }


      event.preventDefault();


      cloudAction(
        async () => {

          if (!currentAction) {
            return;
          }


          const selectedDate =
            $('#action-date').value;


          if (!selectedDate) {

            throw new Error(
              'Please select a date.'
            );
          }


          const shipment =
            currentAction.shipment;


          const isDelivery =
            currentAction.type ===
            'deliver';


          const field =
            isDelivery
              ? 'delivery_date'
              : 'accounts_date';


          /*
             Extra date validation
          */

          if (
            isDelivery &&
            selectedDate <
              shipment.received_date
          ) {

            throw new Error(
              'Delivery date cannot be before received date.'
            );
          }


          if (
            !isDelivery &&
            selectedDate <
              shipment.delivery_date
          ) {

            throw new Error(
              'A/C date cannot be before delivery date.'
            );
          }


          await api(
            `shipments?id=eq.${shipment.id}`,
            {
              method: 'PATCH',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  [field]:
                    selectedDate
                })
            }
          );


          await api(
            'shipment_events',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify([
                  {
                    shipment_id:
                      shipment.id,

                    event_type:
                      isDelivery
                        ? 'DELIVERY'
                        : 'ACCOUNTS_ENTERED',

                    event_date:
                      selectedDate
                  }
                ])
              }
            }
          );


          $('#date-dialog').close();

          currentAction =
            null;
        }
      );
    }
  );
}


/* =========================================================
   SEARCH
   ========================================================= */

document
  .querySelectorAll('[data-search]')
  .forEach((input) => {

    input.addEventListener(
      'input',
      () => {

        const query =
          input.value
            .toLowerCase()
            .trim();


        const kind =
          input.dataset.search;


        let data;


        if (kind === 'delivery') {

          data =
            shipments.filter(
              (s) =>
                !s.delivery_date
            );

        } else if (
          kind === 'accounts'
        ) {

          data =
            shipments.filter(
              (s) =>
                s.delivery_date &&
                !s.accounts_date
            );

        } else {

          data =
            shipments;
        }


        data =
          data.filter(
            (shipment) =>

              `${shipment.lr_number}
               ${shipment.party_name}
               ${shipment.branch_name}
               ${shipment.remarks || ''}`
                .toLowerCase()
                .includes(query)
          );


        /*
           Godown stock page is not connected
           to a stock_checks table yet.
        */

        if (kind === 'stock') {

          const stockTable =
            $('#stock-table');

          if (stockTable) {

            stockTable.innerHTML =
              `
              <p class="empty">
                Godown stock check is not enabled in this version.
              </p>
              `;
          }

          return;
        }


        table(
          data,

          `#${kind}-table`,

          kind === 'all'
            ? 'all'
            : 'workflow'
        );
      }
    );
  });


/* =========================================================
   INITIALISE FORM
   ========================================================= */

resetForm();


/* =========================================================
   RESTORE SESSION
   ========================================================= */

if (token) {

  /*
     We already have a valid-looking session.

     Show the application immediately,
     then verify the database request.
  */

  showApp();


  load()

    .then(
      () => {

        showPage(
          'dashboard'
        );
      }
    )

    .catch(
      (error) => {

        console.error(
          'Saved session could not be restored:',
          error
        );


        token = null;

        sessionStorage.removeItem(
          SESSION_KEY
        );


        showLogin();
      }
    );

} else {

  showLogin();
}
