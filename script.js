document.addEventListener('DOMContentLoaded', () => {
    // ヘッダーのスクロール制御
    const header = document.querySelector('.header');
    const scrollThreshold = 50;

    const handleScroll = () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            // ホームページかつヒーローセクションにいる時だけクラスを外す
            if (document.body.classList.contains('home-page')) {
                header.classList.remove('scrolled');
            }
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初期状態のチェック

    // ナビゲーションのアクティブ状態を管理
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) || (currentPath.endsWith('/') && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // フェードインアニメーション (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // アニメーション対象の要素を初期化
    const animatedElements = document.querySelectorAll('.card, .section-title, .section-image, .section-content, .curriculum-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });

    // フォーム送信
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            btn.innerText = '送信中...';
            btn.disabled = true;

            try {
                const formData = new FormData(contactForm);
                const payload = Object.fromEntries(formData.entries());

                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(result.error || '送信に失敗しました。');
                }

                alert('お問い合わせを受け付けました。24時間以内（営業日）に担当者よりご連絡いたします。');
                contactForm.reset();
            } catch (error) {
                alert(error.message || '送信に失敗しました。時間をおいて再度お試しください。');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
});
