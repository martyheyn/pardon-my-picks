/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#18314FFF',
				primaryHover: '#345680',
				secondary: '#FFA500',
				dark: '#2d2d2d'
			}
		},
		fontFamily: {
			header: ['Kanit', 'serif'],
			paragraph: ['IBM Plex Sans', 'serif']
		}
	},
	plugins: []
};
