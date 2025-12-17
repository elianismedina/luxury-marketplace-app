// Debug version for Appwrite Function (ESM)
import sdk from "node-appwrite";

export default async ({ req, res, log, error }) => {
  log("Function started");
  log("Request body:", req.body);

  // Defensive: parse body if needed
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
      log("Parsed body:", body);
    } catch (e) {
      error("Failed to parse body as JSON", e);
      return res.json({ error: "Invalid JSON body" }, 400);
    }
  }

  const { userId, teamId, email, name, roles } = body || {};
  log(
    "userId:",
    userId,
    "teamId:",
    teamId,
    "email:",
    email,
    "name:",
    name,
    "roles:",
    roles
  );

  if (!userId || !teamId || !email) {
    error("Missing required fields", { userId, teamId, email });
    return res.json(
      { error: "Missing required fields: userId, teamId, email" },
      400
    );
  }

  const client = new sdk.Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const teams = new sdk.Teams(client);

  try {
    const membership = await teams.createMembership(
      teamId,
      email,
      roles || ["ALIADO"],
      undefined, // No invite URL
      userId,
      name || undefined
    );
    log("Membership created:", membership);
    return res.json({ success: true, membership });
  } catch (err) {
    error("Team assignment failed:", err.message, err);
    return res.json({ error: err.message }, 500);
  }
};
