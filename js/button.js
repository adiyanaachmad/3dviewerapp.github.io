document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.remove('animate');
    void btn.offsetWidth;
    btn.classList.add('animate');
  });
});

const clickSound = new Audio('sounds/minecraft_click.mp3');
clickSound.volume = 1.0;

function playSoundEffect() {
  clickSound.currentTime = 0;
  clickSound.play();
}

const soundElements = document.querySelectorAll('.sound-init');
soundElements.forEach(element => {
  element.addEventListener('click', playSoundEffect);
});