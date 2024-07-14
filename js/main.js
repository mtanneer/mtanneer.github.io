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

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close the modal when clicking outside of the modal content
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target === modals[i]) {
            modals[i].style.display = 'none';
        }
    }
}
