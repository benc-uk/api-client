// ----------------------------------------------------------------------------------------------------------
// Copyright (c) Ben Coleman, 2024. Licensed under the MIT License.
// AuthProvider for APIClientBase that uses MSAL.js v3 for authentication
// NOTE!
// We can't use ESM CDN imports, so we have to use the global `msal` object, there's no way around this
// - Don't forget to include the MSAL.js script in your HTML, e.g.
// <script src="https://cdn.jsdelivr.net/npm/@azure/msal-browser@3.11/lib/msal-browser.min.js"></script>
// ----------------------------------------------------------------------------------------------------------

import * as msal from 'https://cdn.jsdelivr.net/npm/@azure/msal-browser@3.11.0/+esm'

export class AuthProviderMSAL {
  msalApp = null
  scopes = []

  /**
   * Create a new MSAL auth provider
   * @param {string} clientId
   * @param {string[]} scopes
   * @param {string} tenant
   */
  constructor(clientId, scopes = ['User.Read'], tenant = 'common') {
    const config = {
      auth: {
        clientId,
        redirectUri: window.location.origin,
        authority: `https://login.microsoftonline.com/${tenant}`,
      },
      cache: {
        cacheLocation: 'localStorage',
      },
    }

    this.msalApp = new msal.PublicClientApplication(config)
    this.scopes = scopes
  }

  // Initialize the MSAL app, this needed since v3 of MSAL and we can't do it in the constructor
  async initialize() {
    return await this.msalApp.initialize()
  }

  // Get an access token, either from cache or by prompting the user
  // This implements our contract with the API client
  async getAccessToken() {
    await this.msalApp.initialize()

    let tokenRes = null

    try {
      tokenRes = await this.msalApp.acquireTokenSilent({
        scopes: this.scopes,
      })
    } catch (e) {
      tokenRes = await this.msalApp.acquireTokenPopup({
        scopes: this.scopes,
      })
    }

    if (!tokenRes || !tokenRes.accessToken) {
      throw new Error('Failed to get token from MSAL')
    }

    return tokenRes.accessToken
  }
}
