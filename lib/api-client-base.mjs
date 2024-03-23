// ----------------------------------------------------------------------------
// Copyright (c) Ben Coleman, 2024. Licensed under the MIT License.
// Generic API client for calling an REST API
// ----------------------------------------------------------------------------

export class APIClientBase {
  endpoint = "/api";

  config = {
    verbose: false, // Extra logging
    headers: {}, // Pass in extra headers on all requests
    delay: 0, // Fake network delay in ms
    authProvider: null, // Should be an object with getAccessToken() method
    success: (resp) => resp.ok, // Success checker, you can plug in your own
  };

  constructor(endpoint, config = {}) {
    // Trim any trailing slash from the endpoint
    this.endpoint = endpoint.replace(/\/$/, "");

    this.config = { ...this.config, ...config };

    this.debug(`### API client created for endpoint ${this.endpoint}`);

    if (this.config.authProvider) {
      this.debug(
        `### API client: auth enabled with ${this.config.authProvider.constructor.name}`
      );
    }
  }

  // All requests go through this, it handles serialization, auth etc
  async _request(path, method = "GET", payload, auth = false, reqHeaders = {}) {
    this.debug(`### API request: ${method} ${this.endpoint}/${path}`);

    let headers = {};
    let body = null;

    if (payload) {
      try {
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      } catch (e) {
        // If we can't JSON stringify, just send the raw payload and hope for the best
        body = payload;
      }
    }

    // This handles authentication if enabled and the request requires it
    if (auth && this.config.authProvider) {
      let token = null;
      try {
        this.debug(`### API client: Getting access token...`);

        // Call the auth provider to get a token
        token = await this.config.authProvider.getAccessToken();
      } catch (e) {
        throw new Error("Failed to get access token");
      }

      // Append the access token to the request if we have one
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // Make the actual HTTP request
    const response = await fetch(`${this.endpoint}/${path}`, {
      method,
      body,
      headers: { ...headers, ...reqHeaders, ...this.config.headers },
    });

    this.debug(`### API response: ${response.status} ${response.statusText}`);

    // Add a fake delay to simulate network latency
    if (this.config.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delay));
    }

    // All responses are checked via the success function
    if (!this.config.success(response)) {
      // Check if there is a JSON error object in the response
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(
          `API error /${path} ${response.status} ${response.statusText}`
        );
      }

      // Support for RFC 7807 / 9457 error messages
      if (errorData.title !== undefined) {
        throw new Error(
          `${errorData.title} (${errorData.instance}): ${errorData.detail}`
        );
      }

      throw new Error(
        `API error /${path} ${response.status} ${response.statusText}`
      );
    }

    // Return unmarshalled object if response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    }

    // Otherwise return plain text
    return await response.text();
  }

  // Debug logging
  debug(...args) {
    if (this.config.verbose) {
      console.log(...args);
    }
  }
}
