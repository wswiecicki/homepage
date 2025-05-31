import background from '@scripts/background';

function initializeCodeBlockCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre');

    codeBlocks.forEach((block) => {
        if (block.querySelector('.copy-button')) {
            return;
        }

        const button = document.createElement('button');
        button.innerText = 'Copy';
        button.classList.add('copy-button');

        button.addEventListener('click', async () => {
            const codeElement = block.querySelector('code');
            const codeToCopy = codeElement ? codeElement.innerText : '';

            if (codeToCopy) {
                try {
                    await navigator.clipboard.writeText(codeToCopy);
                    button.innerText = 'Copied!';
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.innerText = 'Copy';
                        button.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    button.innerText = 'Error';
                    setTimeout(() => {
                        button.innerText = 'Copy';
                    }, 2000);
                }
            }
        });

        block.appendChild(button);
    });
}

background();
initializeCodeBlockCopyButtons();

document.addEventListener('astro:after-swap', () => {
    background();
    initializeCodeBlockCopyButtons();
});
