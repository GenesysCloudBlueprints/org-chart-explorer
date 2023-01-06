import axios, { AxiosInstance } from 'axios';
import { User, UserSearchRequest, UsersSearchResponse } from './GenesysCloudAPITypes';

const ACCESS_TOKEN_KEY = 'access-token';

export default class GenesysCloudAPI {
	public region: string;
	public me?: User;
	accessToken?: string;
	api: AxiosInstance;

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
				// console.log('>> SET access token', this.accessToken);
				window.localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
			}

			// Remove fragment
			window.location.hash = '';
		}

		// Create API client
		// console.log('>> GET access token', this.accessToken);
		this.api = axios.create({
			baseURL: `https://api.${region}`,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});
	}

	public async IsAuthorized() {
		try {
			this.me = (await this.api.get('/api/v2/users/me')).data as User;
			return true;
		} catch (err) {
			console.log(err);
			return false;
		}
	}

	public InitiateAuthFlow() {
		const oauthURL =
			`https://login.${this.region}/oauth/authorize` +
			`?client_id=${encodeURIComponent(process.env.REACT_APP_GENESYS_CLOUD_CLIENT_ID || '')}` +
			`&response_type=token` +
			`&redirect_uri=${encodeURIComponent(process.env.REACT_APP_GENESYS_CLOUD_REDIRECT_URI || '')}`;

		console.log('Initiating OAuth flow to', oauthURL);
		window.location.href = oauthURL;
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

		const res = await this.api.post('/api/v2/users/search', request);
		console.log('User search results', res.status, res.statusText, '\n', res.data);
		if (res.data) return res.data as UsersSearchResponse;
		else return undefined;
	}

	public async GetDirectReports(userId: string) {
		if (!userId) return undefined;

		const res = await this.api.get(`/api/v2/users/${encodeURIComponent(userId)}/directreports`);
		console.log('User direct reports for ', userId, '\n', res.status, res.statusText, '\n', res.data);
		if (res.data) return res.data as User[];
		else return undefined;
	}
}
