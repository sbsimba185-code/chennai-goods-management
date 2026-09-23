"use client";

import { useState } from "react";

type User = {
  id: number;
  name: string;
  username: string;
  role: "ADMIN" | "USER";
  active: number;
};

export default function AdminPage() {
  const [activeSection, setActiveSection] =
    useState<
      "USERS" | "SHIPMENTS" | "IMPORT" | null
    >(null);

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [error, setError] = useState("");

  async function loadUsers() {
    setActiveSection("USERS");
    setLoadingUsers(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/users"
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load users."
        );
        return;
      }

      setUsers(data.users || []);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoadingUsers(false);
    }
  }

  async function addUser() {
    const name = window.prompt(
      "Enter user name:"
    );

    if (name === null || !name.trim()) {
      return;
    }

    const username = window.prompt(
      "Enter username:"
    );

    if (
      username === null ||
      !username.trim()
    ) {
      return;
    }

    const password = window.prompt(
      "Enter password:"
    );

    if (password === null || !password) {
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.trim(),
            username: username.trim(),
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to add user."
        );
        return;
      }

      window.alert("User added successfully.");

      await loadUsers();
    } catch {
      window.alert(
        "Unable to connect to the server."
      );
    }
  }

  async function editUser(user: User) {
    const name = window.prompt(
      "Enter new name:",
      user.name
    );

    if (name === null || !name.trim()) {
      return;
    }

    const username = window.prompt(
      "Enter new username:",
      user.username
    );

    if (
      username === null ||
      !username.trim()
    ) {
      return;
    }

    const password = window.prompt(
      "Enter new password (leave blank to keep current password):"
    );

    if (password === null) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.trim(),
            username: username.trim(),
            password: password || undefined
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to update user."
        );
        return;
      }

      window.alert(
        "User updated successfully."
      );

      await loadUsers();
    } catch {
      window.alert(
        "Unable to connect to the server."
      );
    }
  }

  async function toggleUser(user: User) {
    const action = user.active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            active: !user.active
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            `Unable to ${action} user.`
        );
        return;
      }

      await loadUsers();
    } catch {
      window.alert(
        "Unable to connect to the server."
      );
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Delete ${user.name}? This will deactivate the user account.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to delete user."
        );
        return;
      }

      await loadUsers();
    } catch {
      window.alert(
        "Unable to connect to the server."
      );
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Control Panel</h1>

          <p>
            Manage users, shipments, imports and
            system operations.
          </p>
        </div>

        <div className="admin-warning">
          <strong>Admin Access</strong>
          <span>
            This section is intended only for
            authorized administrators.
          </span>
        </div>

        <div className="admin-menu">
          <button
            onClick={loadUsers}
            className={
              activeSection === "USERS"
                ? "active"
                : ""
            }
          >
            <strong>👥 User Management</strong>
            <span>
              Add, edit, activate or deactivate
              users.
            </span>
          </button>

          <button
            onClick={() =>
              setActiveSection("SHIPMENTS")
            }
            className={
              activeSection === "SHIPMENTS"
                ? "active"
                : ""
            }
          >
            <strong>📦 Shipment Management</strong>
            <span>
              Edit, delete, change type and undo
              shipment operations.
            </span>
          </button>

          <button
            onClick={() =>
              setActiveSection("IMPORT")
            }
            className={
              activeSection === "IMPORT"
                ? "active"
                : ""
            }
          >
            <strong>📊 Excel Import</strong>
            <span>
              Import shipment data from Excel.
            </span>
          </button>
        </div>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {activeSection === "USERS" && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <h2>User Management</h2>
                <p>
                  Manage authorized system users.
                </p>
              </div>

              <button
                className="admin-primary-button"
                onClick={addUser}
              >
                + Add User
              </button>
            </div>

            {loadingUsers ? (
              <div className="admin-message">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="admin-message">
                No users found.
              </div>
            ) : (
              <div className="user-list">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="user-card"
                  >
                    <div className="user-info">
                      <strong>
                        {user.name}
                      </strong>

                      <span>
                        Username:{" "}
                        {user.username}
                      </span>

                      <span>
                        Role: {user.role}
                      </span>

                      <span
                        className={
                          user.active
                            ? "user-active"
                            : "user-inactive"
                        }
                      >
                        {user.active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <div className="user-actions">
                      <button
                        onClick={() =>
                          editUser(user)
                        }
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          toggleUser(user)
                        }
                      >
                        {user.active
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      {user.role !== "ADMIN" && (
                        <button
                          className="delete-user"
                          onClick={() =>
                            deleteUser(user)
                          }
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "SHIPMENTS" && (
          <section className="admin-section">
            <h2>Shipment Management</h2>

            <p className="admin-description">
              Shipment editing, deletion, delivery
              type changes and undo operations will
              be available here.
            </p>

            <div className="admin-placeholder">
              Shipment management interface will
              connect to the shipment API.
            </div>
          </section>
        )}

        {activeSection === "IMPORT" && (
          <section className="admin-section">
            <h2>Excel Import</h2>

            <p className="admin-description">
              Use the Excel import page to upload
              shipment records.
            </p>

            <button
              className="admin-primary-button"
              onClick={() =>
                (window.location.href =
                  "/import")
              }
            >
              Open Excel Import
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
