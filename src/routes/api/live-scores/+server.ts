export async function GET(event: Event) {
	const options: ResponseInit = {
		status: 418,
		headers: {
			X: 'Gon give it to ya'
		}
	};

	return new Response('Hello', options);
}
