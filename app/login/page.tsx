"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);

    try {
      /*
       * The login API will be connected in the
       * authentication backend stage.
       */

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Login failed."
        );
        return;
      }

      /*
       * Authentication/session handling will be
       * completed with the backend.
       */
      window.location.href = "/";
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">

        <div className="login-header">
          <div className="login-logo">
            🚚
          </div>

          <h1>
            Chennai Goods Management
          </h1>

          <p>
            Delivery Tracking System
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="login-form"
        >

          <label htmlFor="username">
            Username
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            placeholder="Enter username"
            autoComplete="username"
            disabled={loading}
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter password"
            autoComplete="current-password"
            disabled={loading}
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        <div className="login-footer">
          Admin and authorized users only
        </div>

      </section>
    </main>
  );
}
