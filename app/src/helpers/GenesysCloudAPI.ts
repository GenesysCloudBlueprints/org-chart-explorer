import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { atom, useRecoilValue } from 'recoil';
import { getRecoil, setRecoil } from 'recoil-nexus';
import { User, UserSearchRequest, UsersSearchResponse } from './GenesysCloudAPITypes';

const ACCESS_TOKEN_KEY = 'access-token';
const MAX_QUEUE_FUNCS = 10;

interface RetryableRequestFunc {
	(): Promise<AxiosResponse<any, any>>;
}
interface RetryableQueueItem {
	func: RetryableRequestFunc;
	callback: { (res: AxiosResponse<any, any>): void };
}

export default class GenesysCloudAPI {
	public region: string;
	public me?: User;
	accessToken?: string;
	api: AxiosInstance;
	retryAfter: number = 60;
	isRateLimited: boolean = false;
	requestQueue: RetryableQueueItem[] = [];
	processors: number = 0;
	userCache: { [userId: string]: User | undefined } = {};

	constructor(region: string) {
		// Set region
		this.region = region || 'mypurecloud.com';

		// Retrieve existing access token
		this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || undefined;

		// Parse fragment
		if (window.location.hash) {
			// Inspired by https://stackoverflow.com/questions/5646851/split-and-parse-window-location-hash
			let hash = window.location.hash;
			if (hash.startsWith('#')) hash = hash.substring(1);
			const hashData: { [key: string]: string } = hash
				.split('&')
				.map((v) => v.split('='))
				.reduce((pre, [key, value]) => ({ ...pre, [key]: value }), {});

			// Scrape access token
			if (hashData.access_token) {
				this.accessToken = hashData.access_token;
				window.localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
			}

			// Remove fragment
			window.location.hash = '';
		}

		// Create API client
		this.api = axios.create({
			baseURL: `https://api.${region}`,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
			validateStatus: () => true,
		});

		setInterval(this.queueProcessor.bind(this), 500);
	}

	// Authorize checks to see if the instance has a valid auth token and initiates the auth flow if not
	public async Authorize() {
		setRecoil(isAuthFailed, !(await this.IsAuthorized()));
	}

	// IsAuthorized attempts to fetch the authenticated user's data from the API
	public async IsAuthorized() {
		const res = await this.api.get('/api/v2/users/me');
		if (isSuccess(res)) {
			this.me = res.data as User;
			this.addCachedUser(this.me);
			setUserData(this.me);
			return true;
		} else {
			// If we're rate limited checking the auth token, it's valid but the user probably refreshed the page when it got rate limited. Just get a new token so the app doesn't seem broken.
			if (res.status === 429) {
				this.setIsRateLimited(true);
				InitiateAuthFlow(this.region);
				return true;
			}
			return false;
		}
	}

	/**
	 * API Endpoint Invocations
	 *
	 * These functions wrap specific API endpoints
	 */

	// Searches for users using POST /api/v2/users/search
	public async SearchUsers(searchTerm: string) {
		if (!searchTerm || searchTerm.length < 3) return undefined;

		const request: UserSearchRequest = {
			pageSize: 15,
			pageNumber: 1,
			query: [
				{
					type: 'CONTAINS',
					fields: ['name'],
					value: searchTerm,
				},
			],
		};

		const res = await this.rateLimitRetryer(() => this.api.post('/api/v2/users/search', request));
		if (isSuccess(res) && res.data) return res.data as UsersSearchResponse;
		else return undefined;
	}

	public async GetDirectReports(userId: string) {
		if (!userId) return undefined;
		console.log('>>>>>', userId);

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

	public async GetUser(userId: string) {
		// Return from cache
		if (this.userCache[userId]) return this.userCache[userId];

		const res = await this.rateLimitRetryer(() => this.api.get(`/api/v2/users/${encodeURIComponent(userId)}`));
		if (isSuccess(res) && res.data) {
			const user = res.data as User;
			this.addCachedUser(user);
			return user;
		} else {
			return undefined;
		}
	}

	/////// PRIVATE METHODS ///////

	private async rateLimitRetryer(requestFunc: { (): Promise<AxiosResponse<any, any>> }) {
		return new Promise<AxiosResponse<any, any>>((resolve) => {
			this.requestQueue.push({
				func: requestFunc,
				callback: (res: AxiosResponse<any, any>) => resolve(res),
			});
			if (this.processors < MAX_QUEUE_FUNCS) this.queueProcessor();
		});
	}

	private async queueProcessor() {
		const itemsToProcess = Math.min(this.requestQueue.length, MAX_QUEUE_FUNCS) - this.processors;
		for (let i = 0; i < itemsToProcess; i++) {
			this.processQueueItem();
		}
	}

	private async processQueueItem() {
		console.log('processQueueItem');
		try {
			this.processors++;
			if (this.isRateLimited || this.processors > MAX_QUEUE_FUNCS) return;
			const queueItem = this.requestQueue.shift();
			if (!queueItem) return;

			// Invoke item
			queueItem.callback(await this.rateLimitRetryerImpl(queueItem.func));
		} catch (err) {
			console.error(err);
		} finally {
			this.processors--;
		}
	}

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

	private setIsRateLimited(is: boolean) {
		if (this.isRateLimited === is) return;
		setRecoil(rateLimitAtom, is);
	}

	private addCachedUser(user: User) {
		this.userCache[user.id] = user;
	}
}

// InitiateAuthFlow redirects the user's browser to the Genesys Cloud authorization server to begin the OAuth flow
export function InitiateAuthFlow(region: string) {
	const oauthURL =
		`https://login.${region}/oauth/authorize` +
		`?client_id=${encodeURIComponent(process.env.REACT_APP_GENESYS_CLOUD_CLIENT_ID || '')}` +
		`&response_type=token` +
		`&redirect_uri=${encodeURIComponent(process.env.REACT_APP_GENESYS_CLOUD_REDIRECT_URI || '')}`;

	console.log('Initiating OAuth flow to', oauthURL);
	window.location.href = oauthURL;
}

// timeout wraps setTimeout with a promise
async function timeout(seconds: number) {
	return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function isSuccess(res: AxiosResponse<any, any>) {
	return res.status >= 200 && res.status < 300;
}

const apiAtom = atom<GenesysCloudAPI | undefined>({
	key: 'api',
});

export function useGenesysCloudAPI() {
	return useRecoilValue(apiAtom);
}

export function setGenesysCloudAPI(region: string) {
	// Reset everything
	setRecoil(isAuthFailed, false);
	setRecoil(rateLimitAtom, false);
	setRecoil(apiAtom, undefined);
	setUserData();
	clearSubReports();

	const api = new GenesysCloudAPI(region);
	api.Authorize();
	setUserData(undefined);
	setRecoil(apiAtom, api);
}

const isAuthFailed = atom<boolean>({
	key: 'auth-failed',
	default: false,
});

export function useAuthFailed() {
	return useRecoilValue(isAuthFailed);
}

const userDataAtom = atom<User | undefined>({
	key: 'user-data',
	default: undefined,
});

// useUserData provides a recoil atom for the user's data (recoil is a state management library for React https://recoiljs.org/)
export function useUserData() {
	return useRecoilValue(userDataAtom);
}

// setUserData updates the user data atom
export function setUserData(user?: User) {
	setRecoil(userDataAtom, user);
}

const rateLimitAtom = atom<boolean>({
	key: 'is-rate-limited',
	default: false,
});

export function useRateLimited() {
	return useRecoilValue(rateLimitAtom);
}

const subReportsAtom = atom<User[]>({
	key: 'sub-reports',
	default: [],
});

export function useSubReports() {
	return useRecoilValue(subReportsAtom);
}

export function addSubReports(users: User[]) {
	if (!users || users.length === 0) return;
	console.log('adding', users);
	let newList = [...getRecoil(subReportsAtom), ...users];
	// Remove duplicates
	const knownIds: string[] = [];
	newList = newList.filter((user) => {
		if (!user.id || knownIds.includes(user.id)) return false;
		knownIds.push(user.id);
		return true;
	});
	setRecoil(subReportsAtom, newList);
}

export function clearSubReports() {
	setRecoil(subReportsAtom, []);
}
