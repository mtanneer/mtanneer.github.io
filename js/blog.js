document.addEventListener("DOMContentLoaded", function () {
    const blogContainer = document.getElementById("blogPosts");
    const categoryFilter = document.getElementById("categoryFilter");

    fetch("../json/posts.json")
        .then(response => response.json())
        .then(posts => {
            displayPosts(posts);

            categoryFilter.addEventListener("change", function () {
                const selectedCategory = categoryFilter.value;
                const filteredPosts = selectedCategory === "all"
                    ? posts
                    : posts.filter(post => post.category === selectedCategory);

                displayPosts(filteredPosts);
            });
        });

    function displayPosts(posts) {
        blogContainer.innerHTML = ""; // Clear previous posts

        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        posts.forEach(post => {
            const postElement = document.createElement("div");
            postElement.classList.add("blog-post");
            postElement.innerHTML = `
                <h2><a href="post.html?id=${post.id}" class="link-style">${post.title}</a></h2>
                <p><strong>Date:</strong> ${post.date}  <strong>Category:</strong> ${post.category}</p>
                <p>${post.excerpt}</p>
            `;
            blogContainer.appendChild(postElement);
        });
    }
});

