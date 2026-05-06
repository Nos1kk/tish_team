export function createServiceRotatorController(rotator, texts, options = {}) {
    const animationDuration = options.animationDuration ?? 360;
    const charStagger = options.charStagger ?? 18;
    const nextEnterDelay = options.nextEnterDelay ?? 16;
    const initialEmptyDuration = options.initialEmptyDuration ?? 180;
    const holdDuration = options.holdDuration ?? 900;
    const interWordGapDuration = options.interWordGapDuration ?? 55;
    const horizontalPadding = options.horizontalPadding ?? 8;
    const minWidth = options.minWidth ?? 52;
    const maxWidth = options.maxWidth ?? 150;
    const switchOvershoot = options.switchOvershoot ?? 10;
    const emptyWidthText = options.emptyWidthText ?? '';
    const srOnly = rotator.querySelector('.rotator-sr-only');
    const currentWord = rotator.querySelector('.rotator-word-current');
    const nextWord = rotator.querySelector('.rotator-word-next');
    const measure = rotator.querySelector('.rotator-measure');

    let currentText = '';
    let nextIndex = 0;
    let firstIntroPending = true;
    let running = false;
    let isAnimating = false;
    let timers = [];

    rotator.style.setProperty('--flip-duration', `${animationDuration}ms`);
    rotator.style.setProperty('--char-stagger', `${charStagger}ms`);
    rotator.style.setProperty('--next-enter-delay', `${nextEnterDelay}ms`);

    function clamp(value) {
        return Math.max(minWidth, Math.min(maxWidth, value));
    }

    function measureWordWidth(text) {
        const resolved = text || emptyWidthText;
        measure.textContent = resolved;
        const width = measure.getBoundingClientRect().width;
        return clamp(Math.ceil(width + horizontalPadding));
    }

    function setWidthByWord(text, immediate = false) {
        const width = measureWordWidth(text);
        if (immediate) {
            rotator.classList.add('is-width-instant');
            rotator.style.width = `${width}px`;
            void rotator.offsetWidth;
            rotator.classList.remove('is-width-instant');
            return;
        }

        rotator.style.width = `${width}px`;
    }

    function clearTimer() {
        timers.forEach((timerId) => clearTimeout(timerId));
        timers = [];
    }

    function schedule(callback, delay) {
        const timerId = setTimeout(() => {
            timers = timers.filter((id) => id !== timerId);
            callback();
        }, delay);
        timers.push(timerId);
    }

    function setAccessibleText(text) {
        if (!srOnly) return;
        srOnly.textContent = text;
    }

    function renderWordChars(target, text) {
        const source = text || '';
        target.textContent = '';

        if (!source) return;

        const fragment = document.createDocumentFragment();
        Array.from(source).forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'rotator-char';
            span.style.setProperty('--char-index', index);
            span.textContent = char === ' ' ? '\u00A0' : char;
            fragment.appendChild(span);
        });

        target.appendChild(fragment);
    }

    function getTextLength(text) {
        return Array.from(text || '').length;
    }

    function showWord(text, immediate = false) {
        renderWordChars(currentWord, text);
        renderWordChars(nextWord, '');
        rotator.classList.remove('is-animating');
        currentText = text;
        setAccessibleText(text);
        setWidthByWord(text, immediate);
    }

    function transitionTo(nextText, onComplete) {
        if (isAnimating) {
            return;
        }

        clearTimer();
        isAnimating = true;
        renderWordChars(nextWord, nextText);
        setAccessibleText(nextText);
        if (nextText) {
            const targetWidth = measureWordWidth(nextText);
            const currentWidth = clamp(Math.ceil(rotator.getBoundingClientRect().width || targetWidth));
            const overshootWidth = clamp(Math.max(targetWidth, currentWidth) + switchOvershoot);
            rotator.style.width = `${overshootWidth}px`;
            schedule(() => {
                rotator.style.width = `${targetWidth}px`;
            }, Math.max(90, Math.round(animationDuration * 0.36)));
        } else {
            setWidthByWord(currentText || emptyWidthText);
        }

        const outgoingCount = getTextLength(currentText);
        const incomingCount = getTextLength(nextText);
        const maxOutgoingDelay = Math.max(0, outgoingCount - 1) * charStagger;
        const maxIncomingDelay = incomingCount > 0
            ? nextEnterDelay + Math.max(0, incomingCount - 1) * charStagger
            : 0;
        const transitionTotalDuration = animationDuration + Math.max(maxOutgoingDelay, maxIncomingDelay);

        rotator.classList.remove('is-animating');
        void rotator.offsetWidth;
        rotator.classList.add('is-animating');

        schedule(() => {
            renderWordChars(currentWord, nextText);
            renderWordChars(nextWord, '');
            rotator.classList.remove('is-animating');
            currentText = nextText;
            setWidthByWord(nextText || emptyWidthText);
            isAnimating = false;
            onComplete?.();
        }, transitionTotalDuration);
    }

    function runLoop() {
        if (!running || texts.length === 0) return;

        const delayBeforeEnter = firstIntroPending ? initialEmptyDuration : 0;

        schedule(() => {
            if (!running) return;
            transitionTo(texts[nextIndex], () => {
                if (!running) return;
                schedule(() => {
                    if (!running) return;
                    transitionTo('', () => {
                        if (!running) return;
                        nextIndex = (nextIndex + 1) % texts.length;
                        firstIntroPending = false;
                        schedule(() => {
                            if (!running) return;
                            runLoop();
                        }, interWordGapDuration);
                    });
                }, holdDuration);
            });
        }, delayBeforeEnter);
    }

    return {
        stop() {
            running = false;
            clearTimer();
            isAnimating = false;
            showWord('', true);
        },
        restart() {
            running = false;
            clearTimer();
            if (!texts.length) return;
            isAnimating = false;
            nextIndex = 0;
            firstIntroPending = true;
            showWord('', true);
            running = true;
            runLoop();
        },
        refresh() {
            setWidthByWord(currentText || emptyWidthText, true);
        }
    };
}


