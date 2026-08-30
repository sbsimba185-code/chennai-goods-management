/* =========================================================
   CHENNAI GOODS MANAGEMENT
   STEP 1 — AUTHENTICATION + CLOUD CONNECTION
   ========================================================= */


/* ---------------------------------------------------------
   SUPABASE CONFIGURATION
   --------------------------------------------------------- */

const SUPABASE_URL =
  'https://yonxttybnkvxwnbhzwyi.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_EC6Tm1kbWuPEPtfeeJED9Q_6dbqOZVh';

const OFFICE_EMAIL =
  'silambarasan2453@gmail.com';

const SESSION_KEY =
  'chennai-goods-session';


/* ---------------------------------------------------------
   GLOBAL STATE
   --------------------------------------------------------- */

let accessToken =
  sessionStorage.getItem(SESSION_KEY);


/* ---------------------------------------------------------
   SHORT DOM HELPER
   --------------------------------------------------------- */

function $(selector) {
  return document.querySelector(selector);
}


/* ---------------------------------------------------------
   LOGIN SCREEN
   --------------------------------------------------------- */

function showLoginScreen() {

  const loginScreen =
    $('#login-screen');

  const appShell =
    $('#app-shell');


  /*
     Completely hide application.
  */

  if (appShell) {

    appShell.hidden = true;
    appShell.style.display = 'none';
  }


  /*
     Completely show login.
  */

  if (loginScreen) {

    loginScreen.hidden = false;
    loginScreen.style.display = 'grid';
  }
}


/* ---------------------------------------------------------
   APPLICATION SCREEN
   --------------------------------------------------------- */

function showApplication() {

  const loginScreen =
    $('#login-screen');

  const appShell =
    $('#app-shell');


  /*
     Completely hide login.
  */

  if (loginScreen) {

    loginScreen.hidden = true;
    loginScreen.style.display = 'none';
  }


  /*
     Completely show application.
  */

  if (appShell) {

    appShell.hidden = false;
    appShell.style.display = 'block';
  }
}


/* ---------------------------------------------------------
   DISPLAY PAGE
   --------------------------------------------------------- */

function showPage(pageId) {

  /*
     Hide every page.
  */

  document
    .querySelectorAll('.page')
    .forEach((page) => {

      page.classList.remove('active');

    });


  /*
     Show requested page.
  */

  const page =
    document.getElementById(pageId);

  if (page) {

    page.classList.add('active');
  }


  /*
     Update sidebar selection.
  */

  document
    .querySelectorAll('.nav-link')
    .forEach((button) => {

      button.classList.toggle(
        'active',
        button.dataset.page === pageId
      );

    });


  /*
     Update heading.
  */

  const titles = {

    dashboard: [
      'Good morning',
      'CHENNAI BRANCH'
    ],

    receive: [
      'Receive goods',
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

    all: [
      'All shipments',
      'CHENNAI BRANCH'
    ],

    stock: [
      'Godown stock',
      'CHENNAI BRANCH'
    ]

  };


  const title =
    titles[pageId] ||
    titles.dashboard;


  const pageTitle =
    $('#page-title');

  const pageKicker =
    $('#page-kicker');


  if (pageTitle) {

    pageTitle.textContent =
      title[0];
  }


  if (pageKicker) {

    pageKicker.textContent =
      title[1];
  }
}


/* ---------------------------------------------------------
   SUPABASE AUTHENTICATION
   --------------------------------------------------------- */

async function login(email, password) {

  const response =
    await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {

        method: 'POST',

        headers: {

          apikey:
            SUPABASE_KEY,

          'Content-Type':
            'application/json'

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
    await response
      .json()
      .catch(() => ({}));


  /*
     Authentication failed.
  */

  if (!response.ok) {

    throw new Error(

      data.error_description ||

      data.msg ||

      'Invalid email or password.'

    );
  }


  /*
     Supabase should return an access token.
  */

  if (!data.access_token) {

    throw new Error(
      'Login succeeded but no access token was returned.'
    );
  }


  return data;
}


/* ---------------------------------------------------------
   TEST CLOUD CONNECTION
   --------------------------------------------------------- */

async function testCloudConnection() {

  if (!accessToken) {

    throw new Error(
      'No login session.'
    );
  }


  /*
     We only test that the authenticated
     user can communicate with Supabase.

     We are NOT loading shipment data yet.
  */

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/shipments?select=id&limit=1`,
      {

        method: 'GET',

        headers: {

          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${accessToken}`

        }

      }
    );


  if (!response.ok) {

    const data =
      await response
        .json()
        .catch(() => ({}));


    throw new Error(

      data.message ||

      data.hint ||

      `Cloud database error (${response.status}).`

    );
  }


  return true;
}


/* ---------------------------------------------------------
   LOGIN FORM
   --------------------------------------------------------- */

const loginForm =
  $('#login-form');


if (loginForm) {

  loginForm.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const emailInput =
        $('#login-email');

      const passwordInput =
        $('#login-password');

      const loginButton =
        $('#login-button');

      const message =
        $('#login-message');


      const email =
        emailInput
          ? emailInput.value.trim()
          : OFFICE_EMAIL;


      const password =
        passwordInput
          ? passwordInput.value
          : '';


      /*
         Basic validation.
      */

      if (!password) {

        if (message) {

          message.textContent =
            'Please enter your password.';
        }

        return;
      }


      /*
         Prevent duplicate clicks.
      */

      if (loginButton) {

        loginButton.disabled = true;
        loginButton.textContent =
          'Signing in...';
      }


      if (message) {

        message.textContent =
          'Connecting to cloud...';
      }


      try {

        /*
           Authenticate.
        */

        const session =
          await login(
            email,
            password
          );


        /*
           Save token.
        */

        accessToken =
          session.access_token;


        sessionStorage.setItem(
          SESSION_KEY,
          accessToken
        );


        /*
           IMPORTANT:

           Switch to the application
           immediately after successful
           authentication.
        */

        showApplication();


        showPage(
          'dashboard'
        );


        /*
           Test database separately.

           A database failure should NOT
           send us back to the login page.
        */

        try {

          await testCloudConnection();

          console.log(
            'Cloud connection successful.'
          );

        } catch (cloudError) {

          console.error(
            'Cloud connection failed:',
            cloudError
          );


          alert(
            `Login successful, but cloud database access failed.\n\n${cloudError.message}`
          );
        }


      } catch (error) {

        console.error(
          'Login failed:',
          error
        );


        /*
           Make sure application stays hidden
           if authentication really failed.
        */

        showLoginScreen();


        if (message) {

          message.textContent =
            error.message ||
            'Sign-in failed.';
        }


      } finally {

        if (loginButton) {

          loginButton.disabled = false;

          loginButton.textContent =
            'Sign in';
        }
      }

    }
  );
}


/* ---------------------------------------------------------
   SIGN OUT
   --------------------------------------------------------- */

const signOutButton =
  $('#sign-out');


if (signOutButton) {

  signOutButton.addEventListener(
    'click',
    () => {

      accessToken =
        null;


      sessionStorage.removeItem(
        SESSION_KEY
      );


      const passwordInput =
        $('#login-password');

      const message =
        $('#login-message');


      if (passwordInput) {

        passwordInput.value = '';
      }


      if (message) {

        message.textContent = '';
      }


      showLoginScreen();

    }
  );
}


/* ---------------------------------------------------------
   SIDEBAR NAVIGATION
   --------------------------------------------------------- */

document
  .querySelectorAll('.nav-link')
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        const page =
          button.dataset.page;


        showPage(page);

      }
    );

  });


/* ---------------------------------------------------------
   DASHBOARD "VIEW ALL"
   --------------------------------------------------------- */

document
  .querySelectorAll('[data-go]')
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        showPage(
          button.dataset.go
        );

      }
    );

  });


/* ---------------------------------------------------------
   RECEIVE BUTTON
   --------------------------------------------------------- */

const receiveButton =
  $('#receive-button');


if (receiveButton) {

  receiveButton.addEventListener(
    'click',
    () => {

      showPage(
        'receive'
      );

    }
  );
}


/* ---------------------------------------------------------
   START APPLICATION
   --------------------------------------------------------- */

function startApplication() {

  /*
     No saved session.
     Show login.
  */

  if (!accessToken) {

    showLoginScreen();

    return;
  }


  /*
     Saved session exists.

     Show application immediately.
  */

  showApplication();


  showPage(
    'dashboard'
  );


  /*
     Verify that the saved token can
     still access the database.

     If it cannot, clear the session
     and return to login.
  */

  testCloudConnection()

    .then(() => {

      console.log(
        'Saved session is valid.'
      );

    })

    .catch((error) => {

      console.warn(
        'Saved session is no longer valid:',
        error
      );


      accessToken =
        null;


      sessionStorage.removeItem(
        SESSION_KEY
      );


      showLoginScreen();

    });
}


/* ---------------------------------------------------------
   RUN
   --------------------------------------------------------- */

startApplication();
