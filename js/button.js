document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.remove('animate'); 
    void btn.offsetWidth; 
    btn.classList.add('animate'); 
  });
});