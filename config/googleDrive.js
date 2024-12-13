import {google} from "googleapis";

export const oauth2Client = new google.auth.OAuth2(
    "1046821061384-1a7jq2k3n7m99ai677t4hq8ppt266een.apps.googleusercontent.com",
    "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",
    ["http://localhost:5555"]
  );

  oauth2Client.setCredentials({ 
    refresh_token: "https://oauth2.googleapis.com/token" 
  });