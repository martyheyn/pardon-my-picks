/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#18314FFF',
				primaryHover: '#345680',
				secondary: '#FFA500',
				dark: '#2d2d2d',
				darkPrimary: '#1a1a1a',
				darkHover: '#4b5563',
				darkSecondary: '#333333',
				muteTextColor: '#4b5563',
				darkMuteTextColor: '#d1d5db',
				disabled: '#d1d5db'
			}
		},
		fontFamily: {
			header: ['Kanit', 'serif'],
			paragraph: ['IBM Plex Sans', 'serif']
		}
	},
	plugins: []
};
