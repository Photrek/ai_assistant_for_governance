import ai_agent_client from "ai_agent_client";

export const aiAgentAPI = new ai_agent_client({
  transport: {
    type: "http",
    host: "localhost",
    port: 4441
  },
});