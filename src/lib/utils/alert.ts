export type Alert = {
	text: string | undefined;
	alertType: 'error' | 'success' | undefined;
};

export const callAlert = (message: string | undefined, type: boolean | undefined): Alert => {
	let alert: Alert = {
		text: message,
		alertType: type ? 'success' : 'error'
	};

	return alert;
};
