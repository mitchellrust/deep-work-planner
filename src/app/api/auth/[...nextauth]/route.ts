import { handlers } from "@/auth";

// Export GET and POST handlers for Auth.js
// These handle OAuth callbacks, sign-in, sign-out, and session management
export const { GET, POST } = handlers;
