document.addEventListener('DOMContentLoaded', (event) => {
    const message = "";
    const welcomeMessage = document.querySelector('.welcome-message');
    let index = 0;

    function typeWriter() {
        if (index < message.length) {
            welcomeMessage.innerHTML += message.charAt(index);
            index++;
            setTimeout(typeWriter, 100);
        } else {
            welcomeMessage.classList.add('finished');
        }
    }

    typeWriter();
});
