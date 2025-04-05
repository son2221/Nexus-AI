// Enhanced to ensure robust code copying
export function createCodeBlock(code, language = 'javascript') {
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-block';
    
    // Language tag
    const languageTag = document.createElement('span');
    languageTag.className = 'code-language-tag';
    languageTag.textContent = language;
    
    // Code pre element
    const codeElement = document.createElement('pre');
    const actualCodeElement = document.createElement('code');
    actualCodeElement.className = `language-${language}`;
    actualCodeElement.textContent = code;
    codeElement.appendChild(actualCodeElement);
    
    // Copy button with improved interactions
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-code-btn';
    copyButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
        </svg>
        Copy
    `;
    
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(code.trim()).then(() => {
            copyButton.classList.add('copied');
            copyButton.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                </svg>
                Copied!
            `;
            
            setTimeout(() => {
                copyButton.classList.remove('copied');
                copyButton.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                    </svg>
                    Copy
                `;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
        });
    });
    
    // Assemble container
    codeContainer.appendChild(languageTag);
    codeContainer.appendChild(copyButton);
    codeContainer.appendChild(codeElement);
    
    return codeContainer;
}

export function enhanceCodeBlocks(container, marked) {
    // Find and enhance existing code blocks in markdown content
    const codeElements = container.querySelectorAll('pre > code');
    codeElements.forEach(codeEl => {
        const codeText = codeEl.textContent;
        const language = getLanguageFromClass(codeEl.className);
        
        // Wrap the code block with our enhanced version
        const codeBlockWrapper = createCodeBlock(codeText, language);
        codeEl.parentElement.parentElement.replaceWith(codeBlockWrapper);
    });
}

function getLanguageFromClass(className) {
    const languageMatch = className.match(/language-(\w+)/);
    return languageMatch ? languageMatch[1] : 'javascript';
}