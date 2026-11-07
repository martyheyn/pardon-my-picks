import { describe, it, expect, vi } from 'vitest';
import { publishPost, type BotPostKey, type BotPostStore, type PostClient } from './publish';
import { XRejectedError, XUnknownOutcomeError } from './x-client';

const key: BotPostKey = { type: 'fade', year: 2026, week: 9 };
const png = new Uint8Array([137, 80, 78, 71]);

const fakeStore = (claimed = true) => {
	const store = {
		claim: vi.fn(async () => claimed),
		markPosted: vi.fn(async () => {}),
		markFailed: vi.fn(async () => {}),
		markStuck: vi.fn(async () => {})
	} satisfies BotPostStore;
	return store;
};

const fakeX = (overrides: Partial<PostClient> = {}) => {
	const x = {
		uploadImage: vi.fn(async () => 'media-1'),
		createPost: vi.fn(async () => 'post-1'),
		...overrides
	} satisfies PostClient;
	return x;
};

describe('publishPost', () => {
	it('uploads the card, posts with it, and records the post id', async () => {
		const store = fakeStore();
		const x = fakeX();

		expect(await publishPost({ key, text: 'Week 9 picks are in.', png, store, x })).toEqual({
			outcome: 'posted',
			postId: 'post-1'
		});
		expect(store.claim).toHaveBeenCalledWith(key, 'Week 9 picks are in.');
		expect(x.uploadImage).toHaveBeenCalledWith(png);
		expect(x.createPost).toHaveBeenCalledWith('Week 9 picks are in.', 'media-1');
		expect(store.markPosted).toHaveBeenCalledWith(key, 'post-1');
	});

	it('never calls X when another run already claimed the post', async () => {
		const x = fakeX();
		expect(await publishPost({ key, text: 't', png, store: fakeStore(false), x })).toEqual({
			outcome: 'claimed-elsewhere'
		});
		expect(x.uploadImage).not.toHaveBeenCalled();
		expect(x.createPost).not.toHaveBeenCalled();
	});

	it('marks a failed upload as retryable and does not post', async () => {
		const store = fakeStore();
		const x = fakeX({
			uploadImage: vi.fn(async () => {
				throw new XUnknownOutcomeError('no response from /2/media/upload (TimeoutError)');
			})
		});

		const result = await publishPost({ key, text: 't', png, store, x });
		expect(result).toEqual({
			outcome: 'failed',
			error: 'upload: no response from /2/media/upload (TimeoutError)'
		});
		expect(store.markFailed).toHaveBeenCalledWith(key, result.outcome === 'failed' && result.error);
		expect(x.createPost).not.toHaveBeenCalled();
	});

	it('marks a post X turned down as retryable', async () => {
		const store = fakeStore();
		const x = fakeX({
			createPost: vi.fn(async () => {
				throw new XRejectedError('/2/tweets returned 402: credits depleted', 402);
			})
		});

		expect(await publishPost({ key, text: 't', png, store, x })).toMatchObject({
			outcome: 'failed'
		});
		expect(store.markFailed).toHaveBeenCalled();
		expect(store.markStuck).not.toHaveBeenCalled();
	});

	it('leaves the post claimed, never retried, when X gives no clear answer', async () => {
		const store = fakeStore();
		const x = fakeX({
			createPost: vi.fn(async () => {
				throw new XUnknownOutcomeError('no response from /2/tweets (TimeoutError)');
			})
		});

		expect(await publishPost({ key, text: 't', png, store, x })).toEqual({
			outcome: 'stuck',
			error: 'post: no response from /2/tweets (TimeoutError)'
		});
		expect(store.markStuck).toHaveBeenCalled();
		expect(store.markFailed).not.toHaveBeenCalled();
	});

	it('reports a live post it could not record, without marking it failed', async () => {
		const store = fakeStore();
		store.markPosted.mockRejectedValueOnce(new Error('connection reset'));

		expect(await publishPost({ key, text: 't', png, store, x: fakeX() })).toEqual({
			outcome: 'stuck',
			error: 'posted as post-1, but saving that failed: connection reset'
		});
		expect(store.markFailed).not.toHaveBeenCalled();
	});
});
