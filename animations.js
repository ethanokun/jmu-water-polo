document.addEventListener('DOMContentLoaded', () => {
    // Scroll animation functionality using IntersectionObserver
    const faders = document.querySelectorAll('.fade-in');
    
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);
    
    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // Water Polo Ball Drag, Throw, and Bounce Game
    const balls = document.querySelectorAll('.water-polo-ball');
    
    balls.forEach(ball => {
        let isDragging = false;
        let physicsFrame;
        let vx = 0, vy = 0;
        let lastX = 0, lastY = 0;
        let lastTime = 0;
        let velocityHistory = [];
        let rotation = 0;
        
        const container = ball.parentElement;
        const goals = container.querySelectorAll('.goal-box');
        const goalText = container.querySelector('.goal-text');
        
        const resetBall = () => {
            cancelAnimationFrame(physicsFrame);
            ball.style.left = '50%';
            ball.style.top = '50%';
            ball.style.transform = `translate(-50%, -50%) rotate(0deg)`;
            vx = 0; vy = 0;
            rotation = 0;
        };

        const updatePhysics = () => {
            if (isDragging) return;
            
            const rect = container.getBoundingClientRect();
            let x = (parseFloat(ball.style.left) || 50) / 100 * rect.width;
            let y = (parseFloat(ball.style.top) || 50) / 100 * rect.height;
            
            x += vx;
            y += vy;
            
            vx *= 0.98; // Friction
            vy *= 0.98;
            
            const radius = 15; // Half of 30px width
            const bounce = -0.7; // Energy loss on bounce
            
            // Wall collisions
            if (x <= radius) {
                x = radius;
                vx *= bounce;
            } else if (x >= rect.width - radius) {
                x = rect.width - radius;
                vx *= bounce;
            }
            
            if (y <= radius) {
                y = radius;
                vy *= bounce;
            } else if (y >= rect.height - radius) {
                y = rect.height - radius;
                vy *= bounce;
            }
            
            rotation += vx * 2;
            ball.style.left = (x / rect.width * 100) + '%';
            ball.style.top = (y / rect.height * 100) + '%';
            ball.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            
            // Collision Detection
            const ballRect = ball.getBoundingClientRect();
            let isGoal = false;
            
            goals.forEach(goal => {
                const goalRect = goal.getBoundingClientRect();
                if (
                    ballRect.left < goalRect.right &&
                    ballRect.right > goalRect.left &&
                    ballRect.top < goalRect.bottom &&
                    ballRect.bottom > goalRect.top
                ) {
                    isGoal = true;
                }
            });
            
            if (isGoal && goalText) {
                goalText.classList.add('show');
                setTimeout(() => {
                    goalText.classList.remove('show');
                    resetBall();
                }, 1500);
                return; // Stop physics loop
            }
            
            // Stop if moving too slow
            if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
                vx = 0;
                vy = 0;
                return;
            }
            
            physicsFrame = requestAnimationFrame(updatePhysics);
        };

        const onDragStart = (e) => {
            if (physicsFrame) cancelAnimationFrame(physicsFrame);
            isDragging = true;
            ball.classList.add('dragging');
            if (e.type === 'touchstart') e.preventDefault();
            
            lastX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            lastY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            lastTime = performance.now();
            vx = 0;
            vy = 0;
            velocityHistory = [];
        };

        const onDragMove = (e) => {
            if (!isDragging) return;
            
            let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            const now = performance.now();
            const dt = Math.max(1, now - lastTime);
            
            let currentVx = ((clientX - lastX) / dt) * 15;
            let currentVy = ((clientY - lastY) / dt) * 15;
            
            velocityHistory.push({vx: currentVx, vy: currentVy});
            if (velocityHistory.length > 5) velocityHistory.shift();
            
            lastX = clientX;
            lastY = clientY;
            lastTime = now;
            
            const rect = container.getBoundingClientRect();
            let x = clientX - rect.left;
            let y = clientY - rect.top;
            
            x = Math.max(0, Math.min(x, rect.width));
            y = Math.max(0, Math.min(y, rect.height));
            
            ball.style.left = (x / rect.width * 100) + '%';
            ball.style.top = (y / rect.height * 100) + '%';
        };

        const onDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            ball.classList.remove('dragging');
            
            // Average velocity history for smooth tangential release
            if (velocityHistory.length > 0 && performance.now() - lastTime < 100) {
                vx = velocityHistory.reduce((sum, v) => sum + v.vx, 0) / velocityHistory.length;
                vy = velocityHistory.reduce((sum, v) => sum + v.vy, 0) / velocityHistory.length;
            } else {
                vx = 0;
                vy = 0;
            }
            
            // Start physics loop to handle bouncing & sliding
            physicsFrame = requestAnimationFrame(updatePhysics);
        };

        ball.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        
        ball.addEventListener('touchstart', onDragStart, {passive: false});
        document.addEventListener('touchmove', onDragMove, {passive: false});
        document.addEventListener('touchend', onDragEnd);
    });
});
