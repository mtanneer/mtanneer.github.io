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

