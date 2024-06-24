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
				disabled: '#d1d5db',
				lightRed: '#fca5a5',
				lightRedHover: '#f87171',
				darkRed: '#7f1d1d',
				darkRedHover: '#991b1b',
				lightGreen: '#86efac',
				darkGreen: '#14532d',
				lightYellow: '#fde047',
				darkYellow: 'rgb(234 179 8)'
			}
		},
		fontFamily: {
			header: ['Kanit', 'serif'],
			paragraph: ['IBM Plex Sans', 'serif']
		}
	},
	plugins: []
};
