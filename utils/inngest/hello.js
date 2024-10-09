import { inngest } from "./client";

export default inngest.createFunction(
  { id: "hello-world" },
  { event: "" },
  async ({ event, step }) => {
    return {
      message: `Hello ${event.name}!`,
    };
  }
);
