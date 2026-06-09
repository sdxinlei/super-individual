/**
 * 超级个体 - 主站脚本
 */

// 统计数字动画
function animateCounter(el, target, suffix = '') {
    let current = 0;
    const increment = Math.ceil(target / 40);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current + suffix;
    }, 30);
}

// 计算独立开发天数（从 2026 年 6 月 1 日起算）
function calcDaysSince(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

// 页面加载时启动计数动画
document.addEventListener('DOMContentLoaded', () => {
    const toolCount = document.getElementById('toolCount');
    const projCount = document.getElementById('projCount');
    const dayCount = document.getElementById('dayCount');

    if (toolCount) animateCounter(toolCount, 2);
    if (projCount) animateCounter(projCount, 1);
    if (dayCount) animateCounter(dayCount, calcDaysSince('2026-06-01'), '+');
});

// 滚动时导航栏透明度变化
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 60) {
        navbar.style.background = 'rgba(10, 10, 15, 0.95)';
    } else {
        navbar.style.background = 'rgba(10, 10, 15, 0.85)';
    }
});
