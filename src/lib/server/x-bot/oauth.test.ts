import { describe, it, expect } from 'vitest';
import { oauthHeader, oauthSignature, percentEncode } from './oauth';

// the worked example from X's "Creating a signature" docs
// (docs.x.com/fundamentals/authentication/oauth-1-0a/creating-a-signature)
const example = {
	credentials: {
		consumerKey: 'xvz1evFS4wEEPTGEFPHBog',
		consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
		token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
		tokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE'
	},
	nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
	timestamp: 1318622958,
	status: 'Hello Ladies + Gentlemen, a signed OAuth request!'
};

const exampleParams = {
	status: example.status,
	include_entities: 'true',
	oauth_consumer_key: example.credentials.consumerKey,
	oauth_nonce: example.nonce,
	oauth_signature_method: 'HMAC-SHA1',
	oauth_timestamp: String(example.timestamp),
	oauth_token: example.credentials.token,
	oauth_version: '1.0'
};

describe('percentEncode', () => {
	it('encodes the characters encodeURIComponent leaves alone', () => {
		expect(percentEncode("!*'()")).toBe('%21%2A%27%28%29');
	});

	it('encodes spaces as %20 and leaves unreserved characters', () => {
		expect(percentEncode('Ladies + Gentlemen')).toBe('Ladies%20%2B%20Gentlemen');
		expect(percentEncode('a-b_c.d~e')).toBe('a-b_c.d~e');
	});
});

describe('oauthSignature', () => {
	it("matches X's worked example", () => {
		const signature = oauthSignature({
			method: 'POST',
			url: 'https://api.x.com/1.1/statuses/update.json',
			params: exampleParams,
			consumerSecret: example.credentials.consumerSecret,
			tokenSecret: example.credentials.tokenSecret
		});
		expect(signature).toBe('Ls93hJiZbQ3akF3HF3x1Bz8/zU4=');
	});

	it('matches the same example from the api.twitter.com days', () => {
		const signature = oauthSignature({
			method: 'post',
			url: 'https://api.twitter.com/1.1/statuses/update.json',
			params: exampleParams,
			consumerSecret: example.credentials.consumerSecret,
			tokenSecret: example.credentials.tokenSecret
		});
		expect(signature).toBe('hCtSmYh+iHYCEqBWrE7C7hYmtUk=');
	});
});

describe('oauthHeader', () => {
	const expectedSignature = 'oauth_signature="Ls93hJiZbQ3akF3HF3x1Bz8%2FzU4%3D"';

	it('signs form params and puts every oauth param in the header', () => {
		const header = oauthHeader({
			method: 'POST',
			url: 'https://api.x.com/1.1/statuses/update.json',
			credentials: example.credentials,
			formParams: { status: example.status, include_entities: 'true' },
			nonce: example.nonce,
			timestamp: example.timestamp
		});

		expect(header).toBe(
			'OAuth oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog", ' +
				'oauth_nonce="kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg", ' +
				'oauth_signature_method="HMAC-SHA1", oauth_timestamp="1318622958", ' +
				'oauth_token="370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", ' +
				`oauth_version="1.0", ${expectedSignature}`
		);
	});

	it('signs query params from the url the same way', () => {
		const header = oauthHeader({
			method: 'POST',
			url: 'https://api.x.com/1.1/statuses/update.json?include_entities=true',
			credentials: example.credentials,
			formParams: { status: example.status },
			nonce: example.nonce,
			timestamp: example.timestamp
		});
		expect(header).toContain(expectedSignature);
	});

	it('never puts the secrets in the header', () => {
		const header = oauthHeader({
			method: 'POST',
			url: 'https://api.x.com/2/tweets',
			credentials: example.credentials
		});
		expect(header).not.toContain(example.credentials.consumerSecret);
		expect(header).not.toContain(example.credentials.tokenSecret);
	});

	it('uses a fresh nonce for every request', () => {
		const sign = () =>
			oauthHeader({
				method: 'POST',
				url: 'https://api.x.com/2/tweets',
				credentials: example.credentials
			});
		expect(sign()).not.toBe(sign());
	});
});
