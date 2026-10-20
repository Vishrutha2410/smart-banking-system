import dotenv from "dotenv";
import { google } from "googleapis";
import http from "http";
import { URL } from "url";

dotenv.config();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET");
  console.error("Make sure your .env file is in the backend project root.");
  process.exit(1);
}

const REDIRECT_URI = "http://localhost:5000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("\n==============================================");
console.log(" Gmail OAuth Authorization");
console.log("==============================================\n");

console.log("Open this URL in your browser:\n");
console.log(authUrl);

console.log("\nWaiting for Google authorization...\n");

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(
      req.url,
      `http://localhost:5000`
    );

    if (requestUrl.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const code = requestUrl.searchParams.get("code");

    if (!code) {
      res.writeHead(400);
      res.end("Authorization code not found.");
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, {
      "Content-Type": "text/html",
    });

    res.end(`
      <html>
        <body style="font-family:Arial;padding:40px;">
          <h2>Gmail authorization successful!</h2>
          <p>You can close this browser tab and return to PowerShell.</p>
        </body>
      </html>
    `);

    console.log("\n==============================================");
    console.log("✅ Gmail authorization successful!");
    console.log("==============================================\n");

    console.log("Refresh Token:\n");
    console.log(tokens.refresh_token);

    console.log("\nAdd this to your .env file:\n");
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);

    console.log("\nKeep this refresh token secret.");
    console.log("Do NOT upload it to GitHub.\n");

    server.close();
  } catch (error) {
    console.error("\n❌ OAuth error:");
    console.error(error.response?.data || error.message);

    res.writeHead(500);
    res.end("OAuth authorization failed.");
  }
});

server.listen(5000, () => {
  console.log("OAuth callback server running at:");
  console.log("http://localhost:5000/oauth2callback\n");
});