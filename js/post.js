document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");

    if (!postId) {
        document.getElementById("postContent").innerHTML = "<h2>Post not found</h2>";
        return;
    }

    fetch("../json/posts.json")
        .then(response => response.json())
        .then(posts => {
            const post = posts.find(p => p.id === postId);

            if (!post) {
                document.getElementById("postContent").innerHTML = "<h2>Post not found</h2>";
                return;
            }

            document.getElementById("postTitle").textContent = post.title;
            document.getElementById("postDate").textContent = post.date;
            document.getElementById("postCategory").textContent = post.category;
            document.getElementById("postBody").textContent = post.content;
        })
        .catch(error => {
            console.error("Error loading blog post:", error);
        });
});
