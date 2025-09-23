(function () {
    const adElements = document.querySelectorAll(".advertisement");

    if (adElements.length === 0) {
        console.warn("No advertisement containers found!");
        return;
    }

    const adCache = {}; 
    const adIntervals = new Map();

    function renderAd(container, ads, index) {
        const ad = ads[index % ads.length];

        // Fade transition
        container.classList.add("fade-out");
        setTimeout(() => {
            container.innerHTML = `
                <div class="ad-card">
                    <img src="${ad.image}" alt="${ad.title}" loading="lazy" />
                    <div class="ad-content">
                        <h3>${ad.title}</h3>
                        <p>${ad.description}</p>
                        <a href="${ad.link}" target="_blank" rel="noopener">Learn More</a>
                    </div>
                    <div class="ad-progress"></div>
                </div>
            `;
            container.classList.remove("fade-out");
            container.classList.add("fade-in");

            // Animate progress bar
            const progress = container.querySelector(".ad-progress");
            if (progress) {
                progress.style.animation = "progressAnim 10s linear forwards";
            }
        }, 300);
    }

    function loadAndDisplayAds(container, category = "default") {
        if (adCache[category]) {
            startRotation(container, adCache[category]);
            return;
        }

        fetch(`http://localhost:4000/api/sda?category=${category}`)
            .then((response) => response.json())
            .then((ads) => {
                if (!ads.length) {
                    container.innerHTML = "<p>No ads available</p>";
                    return;
                }
                adCache[category] = ads;
                startRotation(container, ads);
            })
            .catch((error) => {
                console.error(`Error fetching ads for category '${category}':`, error);
                container.innerHTML = "<p>Error loading ads</p>";
            });
    }

    function startRotation(container, ads) {
        let index = 0;
        renderAd(container, ads, index);

        if (adIntervals.has(container)) {
            clearInterval(adIntervals.get(container));
        }

        const intervalId = setInterval(() => {
            index = (index + 1) % ads.length;
            renderAd(container, ads, index);
        }, 10000);

        adIntervals.set(container, intervalId);

        // Pause on hover
        container.addEventListener("mouseenter", () => clearInterval(intervalId));
        container.addEventListener("mouseleave", () => {
            startRotation(container, ads); // restart rotation
        });
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const container = entry.target;
                obs.unobserve(container);
                const category = container.getAttribute("data-category") || "default";
                loadAndDisplayAds(container, category);
            }
        });
    }, {
        rootMargin: "100px",
        threshold: 0.1,
    });

    adElements.forEach((el) => observer.observe(el));
})();
