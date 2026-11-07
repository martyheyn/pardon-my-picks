import type { BotPostType } from '$lib/utils/x-bot';
import { XRejectedError, type XClient } from './x-client';

// one post, start to finish: claim the BotPost row, upload the card, post, record it. The store
// and the X client are handed in so the "never post twice" rules can be tested without either

export type BotPostKey = { type: BotPostType; year: number; week: number };

export type BotPostStore = {
	// true when this run gets to post: it made the row, or flipped a 'failed' one back to 'posting'.
	// False when another run already has it
	claim(key: BotPostKey, text: string): Promise<boolean>;
	markPosted(key: BotPostKey, xPostId: string): Promise<void>;
	// nothing went public - the next run may try again
	markFailed(key: BotPostKey, error: string): Promise<void>;
	// keeps the row 'posting' so no run retries it, with the error saved for whoever checks X
	markStuck(key: BotPostKey, error: string): Promise<void>;
};

export type PublishResult =
	| { outcome: 'posted'; postId: string }
	| { outcome: 'claimed-elsewhere' }
	| { outcome: 'failed'; error: string }
	| { outcome: 'stuck'; error: string };

// all publishing needs from the X client
export type PostClient = Pick<XClient, 'uploadImage' | 'createPost'>;

const describeError = (err: unknown) => (err instanceof Error ? err.message : String(err));

export async function publishPost({
	key,
	text,
	png,
	store,
	x
}: {
	key: BotPostKey;
	text: string;
	png: Uint8Array;
	store: BotPostStore;
	x: PostClient;
}): Promise<PublishResult> {
	if (!(await store.claim(key, text))) return { outcome: 'claimed-elsewhere' };

	// an uploaded image isn't public until a post uses it, so any upload error can be retried
	let mediaId: string;
	try {
		mediaId = await x.uploadImage(png);
	} catch (err) {
		const error = `upload: ${describeError(err)}`;
		await store.markFailed(key, error);
		return { outcome: 'failed', error };
	}

	let postId: string;
	try {
		postId = await x.createPost(text, mediaId);
	} catch (err) {
		const error = `post: ${describeError(err)}`;
		// only a clear "no" from X is safe to retry. Anything else might have posted
		if (err instanceof XRejectedError) {
			await store.markFailed(key, error);
			return { outcome: 'failed', error };
		}
		await store.markStuck(key, error);
		return { outcome: 'stuck', error };
	}

	try {
		await store.markPosted(key, postId);
	} catch (err) {
		// it's live on X, and the row is still 'posting', so nothing will post it again
		return {
			outcome: 'stuck',
			error: `posted as ${postId}, but saving that failed: ${describeError(err)}`
		};
	}
	return { outcome: 'posted', postId };
}
