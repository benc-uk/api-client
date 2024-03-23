// ----------------------------------------------------------------------------
// Copyright (c) Ben Coleman, 2024. Licensed under the MIT License.
// AuthProvider for APIClientBase that uses MSAL for authentication
// ----------------------------------------------------------------------------

export class AuthProviderMSAL {
  msalApp = null;
  scopes = [];

  constructor(clientId, scopes = ["User.Read"], tenant = "common") {
    const config = {
      auth: {
        clientId,
        redirectUri: window.location.origin,
        authority: `https://login.microsoftonline.com/${tenant}`,
      },
      cache: {
        cacheLocation: "localStorage",
      },
    };

    this.msalApp = new msal.PublicClientApplication(config);
    this.scopes = scopes;
  }

  // Get an access token, either from cache or by prompting the user
  // This implements our contract with the API client
  async getAccessToken() {
    let tokenRes = null;

    try {
      tokenRes = await this.msalApp.acquireTokenSilent({
        scopes: this.scopes,
      });
    } catch (e) {
      tokenRes = await this.msalApp.acquireTokenPopup({
        scopes: this.scopes,
      });
    }

    if (!tokenRes || !tokenRes.accessToken) {
      throw new Error("Failed to get token from MSAL");
    }

    return tokenRes.accessToken;
  }
}
