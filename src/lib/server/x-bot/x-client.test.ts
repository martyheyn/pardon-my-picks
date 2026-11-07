import { afterEach, describe, expect, it, vi } from 'vitest';
import { MEDIA_UPLOAD_URL, XRejectedError, XUnknownOutcomeError, createXClient } from './x-client';

const credentials = {
	consumerKey: 'consumer-key',
	consumerSecret: 'consumer-secret-do-not-leak',
	token: 'access-token',
	tokenSecret: 'token-secret-do-not-leak'
};

const png = new Uint8Array([137, 80, 78, 71]);

const reply = (status: number, body: unknown) =>
	new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

const stubFetch = (...responses: (Response | Error)[]) => {
	const fetchMock = vi.fn();
	for (const response of responses) {
		if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
		else fetchMock.mockResolvedValueOnce(response);
	}
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('uploadImage', () => {
	it('sends the card as a signed multipart upload and returns the media id', async () => {
		const fetchMock = stubFetch(reply(200, { data: { id: '1880000000000000001' } }));

		expect(await createXClient(credentials).uploadImage(png)).toBe('1880000000000000001');

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(MEDIA_UPLOAD_URL);
		expect(init.method).toBe('POST');
		expect(init.headers.authorization).toMatch(/^OAuth oauth_consumer_key="consumer-key"/);
		expect((init.body as FormData).get('media_category')).toBe('tweet_image');
		expect((init.body as FormData).get('media')).toBeInstanceOf(Blob);
	});

	it("reads v1.1's media_id_string too, for if the upload url is switched", async () => {
		stubFetch(reply(200, { media_id_string: '1880000000000000002' }));
		expect(await createXClient(credentials).uploadImage(png)).toBe('1880000000000000002');
	});
});

describe('createPost', () => {
	it('posts the text with the uploaded card attached and returns the post id', async () => {
		const fetchMock = stubFetch(reply(201, { data: { id: '1880000000000000003', text: 'hi' } }));

		expect(await createXClient(credentials).createPost('Week 9 picks are in.', 'media-1')).toBe(
			'1880000000000000003'
		);

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.x.com/2/tweets');
		expect(init.headers['content-type']).toBe('application/json');
		expect(JSON.parse(init.body)).toEqual({
			text: 'Week 9 picks are in.',
			media: { media_ids: ['media-1'] }
		});
	});

	it("treats a 4xx as X saying no, with X's own wording", async () => {
		stubFetch(
			reply(403, { title: 'Forbidden', detail: 'You are not permitted to perform this action.' })
		);
		const attempt = createXClient(credentials).createPost('t', 'media-1');

		await expect(attempt).rejects.toBeInstanceOf(XRejectedError);
		await expect(attempt).rejects.toMatchObject({
			status: 403,
			message: '/2/tweets returned 403: You are not permitted to perform this action.'
		});
	});

	it('treats a 5xx as an unknown outcome, since the post may have gone through', async () => {
		stubFetch(reply(503, 'Service Unavailable'));
		await expect(createXClient(credentials).createPost('t', 'media-1')).rejects.toBeInstanceOf(
			XUnknownOutcomeError
		);
	});

	it('treats a timeout or dropped connection as an unknown outcome', async () => {
		stubFetch(Object.assign(new Error('timed out'), { name: 'TimeoutError' }));
		await expect(createXClient(credentials).createPost('t', 'media-1')).rejects.toThrow(
			new XUnknownOutcomeError('no response from /2/tweets (TimeoutError)')
		);
	});

	it('treats a success without a post id as an unknown outcome', async () => {
		stubFetch(reply(200, {}));
		await expect(createXClient(credentials).createPost('t', 'media-1')).rejects.toBeInstanceOf(
			XUnknownOutcomeError
		);
	});

	it('never puts the secrets in an error', async () => {
		stubFetch(reply(401, { title: 'Unauthorized' }));
		const error = await createXClient(credentials)
			.createPost('t', 'media-1')
			.catch((err: Error) => err);

		expect(String(error)).not.toContain(credentials.consumerSecret);
		expect(String(error)).not.toContain(credentials.tokenSecret);
	});
});

describe('accountHandle', () => {
	it('looks up whose account the keys post as with a signed GET', async () => {
		const fetchMock = stubFetch(
			reply(200, { data: { id: '1', name: 'Pardon My Picks', username: 'pardon_my_pick' } })
		);

		expect(await createXClient(credentials).accountHandle()).toBe('pardon_my_pick');

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.x.com/2/users/me');
		expect(init.method).toBe('GET');
		expect(init.headers.authorization).toMatch(/^OAuth /);
	});
});
