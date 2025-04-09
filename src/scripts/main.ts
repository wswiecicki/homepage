import background from '@scripts/background';
background();
document.addEventListener('astro:after-swap', () => background());
