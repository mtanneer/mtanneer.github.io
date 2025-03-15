async function fetchNews() {
    const response = await fetch('https://news-ai-iota-ruddy.vercel.app/news');
    const articles = await response.json();

    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = ''; // Clear any previous content

    articles.forEach(article => {
        // Create article elements dynamically
        const articleDiv = document.createElement('div');
        articleDiv.classList.add('article');
        
        const title = document.createElement('h2');
        title.textContent = article.title;

        const description = document.createElement('p');
        description.textContent = article.description;

        const link = document.createElement('a');
        link.href = article.url;
        link.textContent = 'Read more';
        link.target = '_blank';

        // Summarize Button
        const summarizeButton = document.createElement('button');
        summarizeButton.textContent = "Summarize";
        summarizeButton.onclick = async () => {
            await summarizeArticle(article.content, description);
        };


        // Append elements to the article div
        articleDiv.appendChild(title);
        articleDiv.appendChild(description);
        articleDiv.appendChild(link);
        articleDiv.appendChild(summarizeButton);

        // Append article div to the news container
        newsContainer.appendChild(articleDiv);
    });
}

// Function to summarize article content
async function summarizeArticle(content, descriptionElement) {
    try {
        const response = await fetch('https://news-ai-iota-ruddy.vercel.app/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) throw new Error("Summarization failed");

        const data = await response.json();
        console.log("Summary:", data.summary);

        // Update the description with the summary
        descriptionElement.textContent = data.summary;
    } catch (error) {
        console.error("Error summarizing article:", error);
    }
}

// Call the fetchNews function when the page loads
document.addEventListener("DOMContentLoaded", fetchNews);