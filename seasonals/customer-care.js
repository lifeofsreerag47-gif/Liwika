// Customer Care interactions
const cards = document.querySelectorAll('.tilt-card');

cards.forEach(card => {
    card.addEventListener('mousemove', e => {
        if (window.innerWidth <= 700) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -5;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 5;
        card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px) scale(1.015)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const form = document.getElementById('careForm');
const formNote = document.getElementById('formNote');
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        formNote.textContent = 'Thanks — your message is ready to be sent. We’ll get back to you soon.';
        formNote.style.color = '#d9a441';
        form.reset();
    });
}
