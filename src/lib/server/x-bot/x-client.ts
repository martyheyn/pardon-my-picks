import { oauthHeader, type OAuthCredentials } from './oauth';

// the X API calls the bot makes: upload the card, then post with it attached - plus a lookup of
// whose account the keys belong to, for /bot/check. Credentials are
// handed in (run.ts reads them from env), so nothing here touches env or logs a secret

// X's docs disagree on whether v2 upload takes OAuth 1.0a. If uploads come back 401/403, switch this
// to 'https://upload.x.com/1.1/media/upload.json' - same multipart body and signing, and the
// response's media_id_string is read below
export const MEDIA_UPLOAD_URL = 'https://api.x.com/2/media/upload';
const CREATE_POST_URL = 'https://api.x.com/2/tweets';
const ME_URL = 'https://api.x.com/2/users/me';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ERROR_LENGTH = 300;

// X answered and said no (a 4xx) - nothing went public, so it's safe to try again later
export class XRejectedError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'XRejectedError';
	}
}

// no clear answer - the connection dropped, it timed out, X had a 5xx, or a 2xx came back without
// an id. The request may or may not have gone through
export class XUnknownOutcomeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'XUnknownOutcomeError';
	}
}

export type XClient = {
	uploadImage(png: Uint8Array): Promise<string>;
	createPost(text: string, mediaId: string): Promise<string>;
	// the @handle (without the @) of the account the access token posts as
	accountHandle(): Promise<string>;
};

const endpointName = (url: string) => new URL(url).pathname;

async function send(url: string, init: RequestInit): Promise<Response> {
	try {
		return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
	} catch (err) {
		const reason = err instanceof Error ? err.name : 'unknown error';
		throw new XUnknownOutcomeError(`no response from ${endpointName(url)} (${reason})`);
	}
}

// just X's own error wording - never the request, which carries the signed Authorization header
async function errorDetail(res: Response): Promise<string> {
	const body = await res.text().catch(() => '');
	let detail = body;
	try {
		const json = JSON.parse(body);
		detail = json.detail ?? json.title ?? json.errors?.[0]?.message ?? body;
	} catch {
		// not JSON - keep the raw text
	}
	return String(detail).slice(0, MAX_ERROR_LENGTH);
}

async function failure(res: Response, url: string): Promise<Error> {
	const message = `${endpointName(url)} returned ${res.status}: ${await errorDetail(res)}`;
	return res.status >= 500
		? new XUnknownOutcomeError(message)
		: new XRejectedError(message, res.status);
}

export function createXClient(credentials: OAuthCredentials): XClient {
	const authorization = (method: 'GET' | 'POST', url: string) =>
		oauthHeader({ method, url, credentials });

	return {
		async uploadImage(png) {
			const form = new FormData();
			form.append('media', new Blob([Buffer.from(png)], { type: 'image/png' }), 'card.png');
			form.append('media_category', 'tweet_image');

			const res = await send(MEDIA_UPLOAD_URL, {
				method: 'POST',
				headers: { authorization: authorization('POST', MEDIA_UPLOAD_URL) },
				body: form
			});
			if (!res.ok) throw await failure(res, MEDIA_UPLOAD_URL);

			const json = await res.json().catch(() => null);
			// v2 answers { data: { id } }, v1.1 answers { media_id_string }
			const id = json?.data?.id ?? json?.media_id_string;
			if (!id) throw new XUnknownOutcomeError('media upload succeeded without a media id');
			return String(id);
		},

		async createPost(text, mediaId) {
			const res = await send(CREATE_POST_URL, {
				method: 'POST',
				headers: {
					authorization: authorization('POST', CREATE_POST_URL),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ text, media: { media_ids: [mediaId] } })
			});
			if (!res.ok) throw await failure(res, CREATE_POST_URL);

			const json = await res.json().catch(() => null);
			const id = json?.data?.id;
			if (!id) throw new XUnknownOutcomeError('post request succeeded without a post id');
			return String(id);
		},

		async accountHandle() {
			const res = await send(ME_URL, {
				method: 'GET',
				headers: { authorization: authorization('GET', ME_URL) }
			});
			if (!res.ok) throw await failure(res, ME_URL);

			const json = await res.json().catch(() => null);
			const username = json?.data?.username;
			if (!username) throw new XUnknownOutcomeError('account lookup succeeded without a username');
			return String(username);
		}
	};
}

export const postUrl = (postId: string) => `https://x.com/i/web/status/${postId}`;
