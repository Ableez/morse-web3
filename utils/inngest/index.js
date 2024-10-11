import {
  createUserFunction,
  updateUserFunction,
  deleteUserFunction,
} from "./user.js";

export const functions = [
  createUserFunction,
  updateUserFunction,
  deleteUserFunction,
];

export { inngest } from "./client";
