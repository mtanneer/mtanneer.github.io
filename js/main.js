document.addEventListener('DOMContentLoaded', (event) => {
    const message = "Hello, Welcome to my Website. I'm Manas";
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

function getCurrentDate() {
    var currentDate = new Date();
    var options = { month: 'short' };
    var day = currentDate.getDate();
    var month = new Intl.DateTimeFormat('en-US', options).format(currentDate);
    var year = currentDate.getFullYear();

    return `${month} ${day}, ${year}`;
}

document.addEventListener("DOMContentLoaded", function() {
    var dateElement = document.querySelector(".fh5co-blog .posted_on");
    if (dateElement) {
        dateElement.textContent = getCurrentDate();
    }
});

