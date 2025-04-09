import { throttle } from '@scripts/utils';

type Star = {
    x: number;
    y: number;
    radius: number;
    color: string;
};

const background = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const observer = new ResizeObserver(
        throttle(() => {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }, 200)
    );
    observer.observe(canvas);

    const stars: Star[] = [];
    const maxStars = 196;
    const radius = 48;
    const starSize = 2.5;
    const starGrow = 0.075;
    const slowStarThreshold = maxStars / 2;
    const slowStarDelay = 8;
    const idleStars = 16;
    const starsOnMouseMove = 10;
    context.shadowColor = '#e3dcca';
    context.shadowBlur = 20;

    const pushNewStar = (x: number, y: number) => {
        if (stars.length >= maxStars) {
            stars.shift();
        }
        stars.push({
            x: x + getRandomWeightedInt(),
            y: y + getRandomWeightedInt(),
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
            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                context.beginPath();
                context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                context.fillStyle = star.color;
                context.globalAlpha = Math.min(0.6, i / stars.length);
                context.fill();
                star.radius += stars.length < slowStarThreshold ? starGrow / slowStarDelay : starGrow;
                if (star.radius > starSize) stars.shift();
            }
        }
        requestAnimationFrame(draw);
    };

    const onMouseMove = (event: MouseEvent) => {
        const x = event.clientX;
        const y = event.clientY;
        for (let i = 0; i < starsOnMouseMove; i++) pushNewStar(x, y);
    };

    document.addEventListener('mousemove', throttle(onMouseMove, 10));
    draw();
};

export default background;
