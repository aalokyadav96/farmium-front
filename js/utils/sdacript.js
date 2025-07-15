(function () {
    const adElements = document.querySelectorAll(".advertisement");

    if (adElements.length === 0) {
        console.warn("No advertisement containers found!");
        return;
    }

    const adCache = {}; // In-memory cache for ads per category
    const adIntervals = new Map(); // To store rotation intervals

    function renderAd(container, ads, index) {
        const ad = ads[index % ads.length];
        container.innerHTML = `
            <div class="ad">
                <img src="${ad.image}" alt="${ad.title}" style="width: 100%; height: auto;" loading="lazy" />
                <h3>${ad.title}</h3>
                <p>${ad.description}</p>
                <a href="${ad.link}" target="_blank" style="color: blue;">Learn More</a>
            </div>
        `;
    }

    function loadAndDisplayAds(container, category = "default") {
        // If ads already cached, use them
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

        // Clear previous interval if any
        if (adIntervals.has(container)) {
            clearInterval(adIntervals.get(container));
        }

        const intervalId = setInterval(() => {
            index = (index + 1) % ads.length;
            renderAd(container, ads, index);
        }, 10000); // 10 seconds

        adIntervals.set(container, intervalId);
    }

    // Use IntersectionObserver for lazy loading
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
