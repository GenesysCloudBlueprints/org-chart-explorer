---
title: Exploring User Relationships
author: tim.smith
indextype: blueprint
icon: blueprint
image: org-chart-explorer.png
category: 5
summary: |
  This Genesys Cloud Developer blueprint, [Genesys Cloud Users API](https://developer.genesys.cloud/useragentman/users/ "Goes to the User API page") provides access to user configuration data and a users' relationship is defined by their `manager`. The Genesys Cloud API retrieves user relationships and details about users, including their name, department, and profile picture. Using a reactive approach, the app handles large API queues and rate limits.
---

:::{"alert":"primary","title":"About Genesys Cloud Blueprints","autoCollapse":false} 
Genesys Cloud blueprints were built to help you jump-start building an application or integrating with a third-party partner. 
Blueprints are meant to outline how to build and deploy your solutions, not production-ready turn-key solutions.
 
For more details on Genesys Cloud blueprint support and practices, 
see our Genesys Cloud blueprint [FAQ](https://developer.genesys.cloud/blueprints/faq "Opens the Genesys Cloud Blueprint FAQ page") sheet.
:::

This Genesys Cloud Developer Blueprint, [Genesys Cloud Users API](https://developer.genesys.cloud/useragentman/users/ "Goes to the User API page") provides access to user configuration data and a users' relationship is defined by their `manager`. The Genesys Cloud API retrieves user relationships and details about users, including their name, department, and profile picture. Using a reactive approach, the app handles large API queues and rate limits.

:::info
This blueprint is live in your browser with your org's data. No setup is required! The following Github pages are used to host the service: [https://genesyscloudblueprints.github.io/org-chart-explorer/](https://genesyscloudblueprints.github.io/org-chart-explorer/ "Opens the Genesys Cloud blueprints page").
:::

![Org Chart Explorer](org-chart-explorer.png)

## Scenario

Custom applications want to know how users are managed in Genesys Cloud. The use case identifies a user, then obtains their management chain (superiors) and the organizational tree below them (direct reports). 

## Solution

The blueprint explains the following Genesys Cloud concepts:

* [Genesys Cloud Grant - Implicit](https://developer.genesys.cloud/authorization/platform-auth/use-implicit-grant "Opens the Grant - Implicit page") - Using the implicit grant of OAuth to authorize third-party applications to use the Genesys Cloud Platform API.
* [Genesys Cloud Users API](https://developer.genesys.cloud/useragentman/users/ "Opens the Genesys Cloud Users API page") - A platform API endpoint for configuring Genesys Cloud users.
* Rate Limiting - The Platform API supports rate limiting as a standard feature.

## Solution components

* [React](https://react.dev/ "Goes to the React page") - An application framework for developing frontend web applications.
* [Genesys Cloud Platform API](https://developer.genesys.cloud/platform/api/ "Opens the Genesys Cloud Platform API page") - Genesys Cloud REST API.

## Software development kits

This blueprint interacts directly with the Genesys Cloud API without using the [JavaScript SDK Platform API JavaScript Client](/devapps/sdk/docexplorer/purecloudjavascript/ "Opens the JavaScript SDK Platform API JavaScript Client page"). A new behavior in React 18 relating to dependency processing with webpack led to this architectural decision. Unfortunately, the SDK requires some node.js polyfills, and React's webpack configuration no longer handles this automatically and requires ejecting to edit the file manually. Prior versions of React were fairly straightforward to use, as demonstrated in the blueprint [Develop a React app with Typescript that uses the Genesys Cloud Platform SDK](/blueprints/react-app-with-genesys-cloud-sdk/ "Opens the Develop a React app with Typescript that uses the Genesys Cloud Platform SDK page"). A more web-friendly package is planned for future JS SDK iterations.

The API types in `app/src/helpers/GenesysCloudAPITypes.ts` were copied from the JavaScript SDK's `index.d.ts` so that the SDK's model types could be used without using the SDK.

## Prerequisites

### Specialized knowledge

- Experience with TypeScript and React
- Basic understanding of Genesys Cloud terminology

### Genesys Cloud account

* A Genesys Cloud license. For more information, see [Genesys Cloud Pricing](https://www.genesys.com/pricing "Opens the Genesys Cloud pricing page") on the Genesys Cloud Pricing website. 

### Development tools run in your local environment

* [NodeJS](https://nodejs.org/) - App uses v18.

## Application overview

[TypeScript](https://www.typescriptlang.org/ "Goes to the TypeScript page") and [React](https://reactjs.org/ "Goes to the React page") are used to build the client side web application. This app's source code is located in the repository [org-chart-explorer/app](https://github.com/GenesysCloudBlueprints/org-chart-explorer/tree/main/app "Goes to the org-chart-explorer/app") in the GitHub repository.

:::info
You can try this blueprint live in your browser using your organization's data, no setup needed! This site is hosted on the following pages: [https://genesyscloudblueprints.github.io/org-chart-explorer/](https://genesyscloudblueprints.github.io/org-chart-explorer/ "Opens the Org Chart Explorer page") in the GitHub repository.
:::

### Run locally

The app runs locally using React's built-in local server. In your local shell, change to the `app` directory and install the following dependencies:

```sh
cd app
npm i
```

You can then start the service by following these steps:

```sh
npm run start
```

In the default scenario, the application will be available locally on your machine at http://localhost:3000/ if no port was changed.

### Dependencies

The following are some notable packages used by the app and what they do before we enter the application:

* [Genesys React Components](https://purecloudlabs.github.io/genesys-react-components/ "Opens the Genesys React Components page") - An open source set of React components developed by Genesys, mainly used by the Developer Center's front-end application.
* [Genesys Dev Icon Pack](https://purecloudlabs.github.io/genesys-dev-icon-pack/ "Opens the Genesys Dev Icon Pack") - An open source web icon pack developed by Genesys, similar to Font Awesome but with icons created specifically for the Developer Center's front-end app.
* [React Router](https://reactrouter.com/ "Opens the React Router page") - A library for React to manage URL-based routing on a single page app.
* [Recoil](https://recoiljs.org/ "Opens the Recoil page") - A state management library for React, but less opinionated than Redux. The library provides a shim to interact with state objects outside of components via [recoil-nexus](https://www.npmjs.com/package/recoil-nexus).
* [Axios](https://axios-http.com/docs/intro "Opens the Getting Started page") - A HTTP client.

## App authorization

The app must first become authorized. A drop-down in the header allows the user to choose their region, and if the app does not have a valid auth token, the user is prompted to initiate the auth flow. `app/src/App.tsx` contains the UI implementation.

To authorize the app to make API requests, it uses an [implicit grant](/authorization/platform-auth/use-implicit-grant "Opens the Grant - Implicit page") within Genesys Cloud OAuth. Upon clicking the link, the following function is executed to navigate the user to the Genesys Cloud auth server to challenge their credentials.  

```typescript
export function InitiateAuthFlow(region: string) {
	const oauthURL =
		`https://login.${region}/oauth/authorize` +
		`?client_id=${encodeURIComponent(process.env.REACT_APP_GENESYS_CLOUD_CLIENT_ID || '')}` +
		`&response_type=token` +
		`&redirect_uri=${encodeURIComponent(process.env.REACT_APP_GENESYS_CLOUD_REDIRECT_URI || '')}`;

	console.log('Initiating OAuth flow to', oauthURL);
	window.location.href = oauthURL;
}
```

Once the user completes authentication, they are redirected back to the app with an access token in the fragment URI (also called a "hash"). During initialization, [`GenesysCloudAPI`](https://github.com/GenesysCloudBlueprints/org-chart-explorer/blob/main/app/src/helpers/GenesysCloudAPI.ts "Opens the Genesys Cloud Blueprints org chart explorer page") is loaded and its constructor checks the fragment for an access token. This is accomplished by setting the access token to a variable on the class instance. In addition, it clears the fragment so that the token is no longer visible to the user. 

When the authorization check is performed, it uses the token obtained from [GET /api/v2/users/me](/devapps/api-explorer#get-api-v2-users-me "Opens the /api/v2/users/me page"). When the request is successful, the app will start in the context of the user returned by the request. The user data atom (global state object) stores this information and is accessible via the `useUserData()` hook. This result triggers the `useAuthFailed()` hook and prompts the user to log in if the request fails.

## Loading and displaying data

When valid authorization is confirmed, the `App` component displays `OrgChartApp` instead of the log in prompt. The app loads superiors and direct reports from the authenticated user.

The `OrgChart` component starts the data loading process. When the target user has been set, an effect fetches the user's superiors using the API. The target user is loaded as the initial user for an `OrgChartMember` component. The superiors are mapped as a vertical tree above the target user.

The `OrgChartMember` component displays user information in the org chart. The user in context is displayed in a `UserCard` component. User direct reports are also loaded asynchronously using the API. As direct reports are loaded, they are displayed under the user in recursively using the `OrgChartMember` component. 

### The `GenesysCloudAPI` class

Genesys Cloud API usage was encapsulated in a purpose-built class rather than an out-of-the-box method, which separates the presentation and business logic contained in the React components from data loading concerns. The class also provides Recoil atoms that it updates to trigger React state events in the app. This results from asynchronous API operations. You can find this class in the project directory within `app/src/helpers/GenesysCloudAPI.ts`.

### Getting superiors

The API class provides an async method `GetSuperiors(userId: string)` that loads the list of superiors from the API by `GET /api/v2/users/{userId}/superiors`. The result is an array of users representing the entire superiors chain with the direct supervisor (e.g., team lead) at the top of the list and the most superior supervisor (e.g., CEO) at the bottom. Take a look at the API Explorer resource here and try it with your users! 👇

<dxui:OpenAPIExplorer verb="get" path="/api/v2/users/{userId}/superiors" />

This resource is implemented in `GenesysCloudAPI` using the rate limit retrier as follows:

```typescript
public async GetSuperiors(userId: string) {
	if (!userId) return undefined;

	const res = await this.rateLimitRetryer(() => this.api.get(`/api/v2/users/${encodeURIComponent(userId)}/superiors`));
	if (isSuccess(res) && res.data) {
		const users = res.data as User[];
		users.forEach(this.addCachedUser.bind(this));
		return users;
	} else {
		return undefined;
	}
}
```

### Getting direct reports

A user's direct reports can be fetched from the API using the request `GET /api/v2/users/{userId}/directreports`. A single level of user data is returned, unlike the superiors resource. Because of this, the `OrgChartMember` loads itself recursively for each user. This is so that each instance can load the direct reports for each user recursively. As each user's subordinates are discovered, the app can shake out the entire org chart.

Check out the API Explorer resource here to get your direct reports! 👇

<dxui:OpenAPIExplorer verb="get" path="/api/v2/users/{userId}/directreports" />

This resource is implemented in `GenesysCloudAPI` using the rate limit retrier as follows:

```typescript
public async GetDirectReports(userId: string) {
	if (!userId) return undefined;

	const res = await this.rateLimitRetryer(() => this.api.get(`/api/v2/users/${encodeURIComponent(userId)}/directreports`));
	if (isSuccess(res) && res.data) {
		const users = res.data as User[];
		users.forEach(this.addCachedUser.bind(this));
		addSubReports(users);
		return users;
	} else {
		return undefined;
	}
}
```

:::info
React uses components to lazy load reports across the tree. This is common in React, but may not apply to all use cases or UI frameworks. Components are intended to be self-contained, given all of the key properties they need when initialized, and then expected to satisfy all of their own needs when rendered. This results in a partially loaded UI that updates as more data is available. A similar approach is to build the full reporting structure and show a loading placeholder until the tree is fully resolved. Using this approach would be especially useful for extracting information about relationships across an organization's org chart as a whole.
:::

### Displaying direct reports as CSV data

The `OrgChart` component additional feature s the list of direct reports as CSV data. It uses the `useSubReports()` hook to get a list of all loaded subreports. It then uses the data to prepare a CSV file including each direct report's name, department, title, email address, and manager's name. This data comes from `subReportsAtom` in `GenesysCloudAPI`. This atom is updated by the API class when results are retrieved via the `GetDirectReports` function.

### Rate limit retryer

API class contains a function, `rateLimitRetryer(requestFunc: {(): Promise<AxiosResponse<any, any>>}): Promise<AxiosResponse<any, any>>`. When executed, this function requests the API and returns a response object from Axios. This wrapper process adds the function to a queue of requests. A pool of processors executes it and checks the response codes for rate limiting. It sleeps for a prescribed time and retries when it encounters a rate-limited response (HTTP 429 status code).

This process enables lazy-loading UIs to request any data they need regardless of API rate limiting. In the API class, requests are queued up and processed FIFO until the queue is empty. Once a queue processor fulfills the request, the UI waits for a response. This allows the UI component to update itself.

The following are steps to implement the retryer. Each request can be retired up to five times before giving up and returning the last response. Because sleeping the right amount of time does not result in rate limiting, this should only be retired once.

```typescript
private async rateLimitRetryerImpl(requestFunc: { (): Promise<AxiosResponse<any, any>> }) {
	let retries = 5;

	// Invoke request function first (this ensures we can always return a response and never undefined)
	let res = await requestFunc();

	// Loop while checking for rate limits
	while (retries > 0) {
		retries--;

		this.setIsRateLimited(res.status === 429);

		// Return response unless it's been rate limited
		if (res.status !== 429 || retries <= 0) return res;

		// Determine how long to wait
		// https://developer.genesys.cloud/platform/api/rate-limits
		this.retryAfter = parseInt(res.headers['retry-after'] || '59');
		// Normalize retry after value and add a second just to be sure
		if (!(this.retryAfter > 0)) this.retryAfter = 60;
		else this.retryAfter++;

		// Wait
		console.warn(`Sleeping ${this.retryAfter}s to retry rate limited response`);
		await timeout(this.retryAfter);

		// Invoke request function
		console.log('Retrying request...');
		res = await requestFunc();
	}

	return res;
}
```

Wait, isn't JavaScript single threaded? If you only have one thread, why queue requests and use a pool of workers? 

Great question! In JavaScript API requests are handled in a single thread, but API requests take time to execute. When the API request is complete, JavaScript releases its thread to do other things on its callstack. The browser places the callback on the JavaScript callstack so that it can be processed when the thread is available again. This async nature enables additional processing to be added between the request and the response to simulate threading.

## Additional resources

* [Genesys Cloud Platform API Overview](/platform/api/ "Opens the Genesys Cloud Platform API Overview page") in the Genesys Cloud Developer Center.
* [Genesys Cloud Users API resources](/useragentman/users/ "Opens the Genesys Cloud User API resources page") in the Genesys Cloud Developer Center.
* [org-chart-explorer](https://genesyscloudblueprints.github.io/org-chart-explorer/ "Opens the Genesys Cloud blueprint page") in GitHub.
* [Genesys Cloud OAuth Grant Implicit](/authorization/platform-auth/use-implicit-grant "Opens the Genesys Cloud OAuth Grant Implicit page") in the Genesys Cloud Developer Center.
* [React](https://react.dev/ "Opens the React page") on the React website.
* [Download for Windows (x64)](https://nodejs.org/ "Opens the Download for Windows (x64) page") on the NodeJS website.
* [TypeScript is JavaScript with syntax for types.](https://www.typescriptlang.org/ "Opens the TypeScript is JavaScript with syntax for types. page") on the TypeScript website. 
* [Genesys React Components](https://purecloudlabs.github.io/genesys-react-components/ "Opens the Genesys React Components page") on the Genesys React Components website.
* [Genesys Dev Icon Pack](https://purecloudlabs.github.io/genesys-dev-icon-pack/ "Opens the Genesys Dev Icon Pack page") on the Genesys Dev Icon Pack website.
* [React Router](https://reactrouter.com/ "Opens the React Router page") on the React Router website.
* [Recoil](https://recoiljs.org/ "Opens the A state management library for React page") on the Recoil website.
* [Getting Started](https://axios-http.com/docs/intro "Opens the Getting Started page") on the Axios website.
