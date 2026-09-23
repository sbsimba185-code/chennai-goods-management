import db from "./database";
import type { User, UserRole } from "./types";

/**
 * Find a user by username.
 */
export function findUserByUsername(
  username: string
): User | null {
  const user = db
    .prepare(
      `
      SELECT *
      FROM users
      WHERE username = ?
      AND active = 1
      LIMIT 1
      `
    )
    .get(username.trim()) as User | undefined;

  return user ?? null;
}

/**
 * Find a user by ID.
 */
export function findUserById(
  id: number
): User | null {
  const user = db
    .prepare(
      `
      SELECT *
      FROM users
      WHERE id = ?
      AND active = 1
      LIMIT 1
      `
    )
    .get(id) as User | undefined;

  return user ?? null;
}

/**
 * Check whether a user has the required role.
 */
export function hasRole(
  user: User,
  role: UserRole
): boolean {
  return user.role === role;
}

/**
 * Check whether a user is an Admin.
 */
export function isAdmin(user: User): boolean {
  return user.role === "ADMIN";
}

/**
 * Check whether a user is a normal User.
 */
export function isUser(user: User): boolean {
  return user.role === "USER";
}

/**
 * Return safe user information.
 *
 * The password hash is deliberately removed before
 * sending user information to the application/UI.
 */
export function safeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    active: user.active
  };
}
