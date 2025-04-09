import { throttle } from '@scripts/utils';

type Star = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
};
const background = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let excitedMode = false;

    const observer = new ResizeObserver(
        throttle(() => {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }, 200)
    );
    observer.observe(canvas);

    const stars: Star[] = [];
    let maxStars = 256;
    const radius = 48;
    const starSize = 4.0;
    let starGrow = 0.1;
    let slowStarThreshold = maxStars / 2;
    let baseAlpha = 0.2;

    const slowStarDelay = 8;
    const idleStars = 16;
    let starsOnMouseMove = 10;
    context.shadowColor = '#e3dcca';
    context.shadowBlur = 20;

    const pushNewStar = (x: number, y: number) => {
        if (stars.length >= maxStars) {
            stars.shift();
        }
        const angle = Math.random() * Math.PI * 2;
        let speedMultiplier = excitedMode ? 4 : 1; // much faster in excited mode
        const speed = (Math.random() * 0.5 + 0.1) * speedMultiplier;
        stars.push({
            x: x + getRandomWeightedInt(),
            y: y + getRandomWeightedInt(),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 0,
            color: Math.random() > 0.5 ? '#FFE4B5' : '#e6e6ff',
        });
    };

    const pushRandomStar = () => {
        const randomX = ~~(Math.random() * canvas.width);
        const randomY = ~~(Math.random() * canvas.height);
        pushNewStar(randomX, randomY);
    };

    const getRandomWeightedInt = () => {
        const weights = {
            inner: 0.7,
            outer: 0.9,
        };
        const randomSegment = Math.random();
        const sign = Math.random() < 0.5 ? -1 : 1;

        if (randomSegment < weights.inner) return sign * ~~(Math.random() * (radius / 4) + 0.5);
        else if (randomSegment < weights.outer) return sign * ~~(Math.random() * (radius / 3) + radius / 3 + 0.5);
        else return sign * ~~(Math.random() * (radius / 3) + (2 * radius) / 3 + 0.5);
    };

    let drawing = false;
    const generateIdleStars = () => {
        let count = 0;
        pushRandomStar();
        const intervalId = setInterval(() => {
            pushRandomStar();
            count += 1;
            if (stars.length > idleStars || count >= idleStars) {
                clearInterval(intervalId);
                drawing = false;
            }
        }, 200);
    };

    const draw = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (!drawing && stars.length < idleStars) {
            drawing = true;
            generateIdleStars();
        } else {
            for (let i = stars.length - 1; i >= 0; i--) {
                const star = stars[i];

                star.x += star.vx;
                star.y += star.vy;
                star.radius += stars.length < slowStarThreshold ? starGrow / slowStarDelay : starGrow;

                const alpha = baseAlpha * Math.pow(1 - star.radius / starSize, 0.3);

                if (star.radius > starSize || alpha <= 0) {
                    stars.splice(i, 1);
                    continue;
                }

                if (excitedMode) {
                    // Assign a random bright color for explosion effect
                    const r = Math.floor(128 + Math.random() * 127);
                    const g = Math.floor(128 + Math.random() * 127);
                    const b = Math.floor(128 + Math.random() * 127);
                    star.color = `rgb(${r},${g},${b})`;
                }

                context.beginPath();
                context.arc(star.x, star.y, star.radius * 0.6, 0, Math.PI * 2);
                context.fillStyle = star.color;
                context.globalAlpha = alpha;
                context.fill();

                const tailLength = star.radius * 2.5;
                const startX = star.x - star.vx * tailLength;
                const startY = star.y - star.vy * tailLength;

                context.beginPath();
                context.moveTo(startX, startY);
                context.lineTo(star.x, star.y);
                context.strokeStyle = star.color;
                context.lineWidth = star.radius * 0.73;
                context.globalAlpha = alpha * 0.6;
                context.lineCap = 'round';
                context.stroke();
            }
            context.globalAlpha = 1.0;
        }
        requestAnimationFrame(draw);
    };

    const onMouseMove = (event: MouseEvent) => {
        const x = event.clientX;
        const y = event.clientY;
        for (let i = 0; i < starsOnMouseMove; i++) pushNewStar(x, y);
    };

    document.addEventListener('mousemove', throttle(onMouseMove, 10));

    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (emailLink) {
        let excitedTimeout: ReturnType<typeof setTimeout> | null = null;

        emailLink.addEventListener('mouseenter', () => {
            excitedMode = true;
            maxStars = 512;
            starsOnMouseMove = 40;
            starGrow = 0.3;
            slowStarThreshold = maxStars / 2;
            baseAlpha = 1;

            if (excitedTimeout) clearTimeout(excitedTimeout);
            excitedTimeout = setTimeout(() => {
                excitedMode = false;
                maxStars = 256;
                starsOnMouseMove = 10;
                starGrow = 0.1;
                slowStarThreshold = maxStars / 2;
                baseAlpha = 0.2;
            }, 1000);
        });
    }

    draw();
};

export default background;
