import { createHmac, randomBytes } from 'node:crypto';

// OAuth 1.0a request signing for the X API, hand-rolled like the site's own auth. The bot posts as
// one account, and 1.0a user tokens for that account never expire - OAuth 2.0 tokens last 2 hours
// and would need a rotating refresh token saved somewhere

export type OAuthCredentials = {
	// the app's "API Key" and "API Key Secret"
	consumerKey: string;
	consumerSecret: string;
	// the bot account's "Access Token" and "Access Token Secret"
	token: string;
	tokenSecret: string;
};

// RFC 3986 - encodeURIComponent leaves !*'() alone, but OAuth wants them encoded too
export function percentEncode(value: string): string {
	return encodeURIComponent(value).replace(
		/[!*'()]/g,
		(char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
	);
}

// HMAC-SHA1 over "METHOD&url&sorted params". `params` is every query param, form-urlencoded body
// param and oauth_* param - JSON and multipart bodies aren't signed
export function oauthSignature({
	method,
	url,
	params,
	consumerSecret,
	tokenSecret
}: {
	method: string;
	// without its query string
	url: string;
	params: Record<string, string>;
	consumerSecret: string;
	tokenSecret: string;
}): string {
	const paramString = Object.entries(params)
		.map(([key, value]) => [percentEncode(key), percentEncode(value)])
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
		.map(([key, value]) => `${key}=${value}`)
		.join('&');

	const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join(
		'&'
	);
	const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

	return createHmac('sha1', signingKey).update(baseString).digest('base64');
}

// the Authorization header for one request. Query params in `url` are signed along with
// `formParams` (only for a form-urlencoded body); nonce and timestamp are only passed in by tests
export function oauthHeader({
	method,
	url,
	credentials,
	formParams = {},
	nonce = randomBytes(16).toString('hex'),
	timestamp = Math.floor(Date.now() / 1000)
}: {
	method: string;
	url: string;
	credentials: OAuthCredentials;
	formParams?: Record<string, string>;
	nonce?: string;
	timestamp?: number;
}): string {
	const parsed = new URL(url);
	const oauthParams = {
		oauth_consumer_key: credentials.consumerKey,
		oauth_nonce: nonce,
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: String(timestamp),
		oauth_token: credentials.token,
		oauth_version: '1.0'
	};

	const signature = oauthSignature({
		method,
		url: `${parsed.origin}${parsed.pathname}`,
		params: { ...Object.fromEntries(parsed.searchParams), ...formParams, ...oauthParams },
		consumerSecret: credentials.consumerSecret,
		tokenSecret: credentials.tokenSecret
	});

	const header = Object.entries({ ...oauthParams, oauth_signature: signature })
		.map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
		.join(', ');
	return `OAuth ${header}`;
}
