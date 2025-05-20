document.addEventListener('DOMContentLoaded', () => {
    const creators = document.querySelectorAll('.creator');
    const videoCards = document.querySelectorAll('.videoCard');
    const creatorReels = document.querySelector('.creatorReels');
    const creatorProfile = document.querySelector('.creatorProfile');

    let currentVideoIndex = 0;
    let isPlaying = false;
    let isTransitioning = false;
    let progressInterval = null;

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Preload next video
    function preloadNextVideo(currentIndex) {
        const nextIndex = (currentIndex + 1) % videoCards.length;
        const nextCard = videoCards[nextIndex];
        const nextVideo = nextCard.querySelector('video');
        const nextSource = nextVideo.querySelector('source');

        if (!nextVideo.dataset.loaded) {
            nextVideo.poster = nextVideo.dataset.poster;
            nextSource.src = nextSource.dataset.src;
            nextVideo.load();
            nextVideo.dataset.loaded = 'true';
        }
    }

    // Pause all videos except one
    async function pauseAllVideos(exceptIndex) {
        for (let i = 0; i < videoCards.length; i++) {
            if (i !== exceptIndex) {
                const video = videoCards[i].querySelector('video');
                const progressBar = videoCards[i].querySelector('.progress-bar span');
                if (!video.paused) {
                    await video.pause();
                    video.currentTime = 0;
                    progressBar.style.width = '0%';
                    video.poster = video.dataset.poster;
                }
            }
        }
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    // Progress bar
    function updateProgressBar(video, progressSpan) {
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(() => {
            if (video.paused || video.ended) {
                clearInterval(progressInterval);
                progressInterval = null;
                return;
            }
            const percent = (video.currentTime / video.duration) * 100;
            progressSpan.style.width = `${percent}%`;
        }, 100);
    }

    // Play video
    async function playVideo(index) {
        if (currentVideoIndex === index && !videoCards[index].querySelector('video').paused) return;

        isPlaying = true;

        try {
            await pauseAllVideos(index);

            const videoCard = videoCards[index];
            const video = videoCard.querySelector('video');
            const source = video.querySelector('source');
            const progressBar = videoCard.querySelector('.progress-bar span');

            if (!video.dataset.loaded) {
                video.poster = video.dataset.poster;
                source.src = source.dataset.src;
                video.load();
                video.dataset.loaded = 'true';
            }

            video.currentTime = 0;
            progressBar.style.width = '0%';

            if (video.readyState < 2) {
                await new Promise(resolve => {
                    video.addEventListener('loadeddata', resolve, { once: true });
                });
            }

            await video.play();
            currentVideoIndex = index;
            updateProgressBar(video, progressBar);
            preloadNextVideo(index);

        } catch (error) {
            console.error('Error playing video:', error);
        } finally {
            isPlaying = false;
        }
    }

    // Initial play of first video
    playVideo(0);

    // Creator click
    creators.forEach((creator, index) => {
        creator.addEventListener('click', async () => {
            if (isTransitioning || isPlaying) return;

            isTransitioning = true;
            creators.forEach(c => c.classList.remove('active'));
            creator.classList.add('active');

            const videoCard = videoCards[index];
            videoCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            await playVideo(index);

            const creatorWidth = creator.offsetWidth + 12;
            const scrollOffset = index * creatorWidth - (creatorProfile.offsetWidth - creatorWidth) / 2;
            creatorProfile.scrollTo({ left: scrollOffset, behavior: 'smooth' });

            setTimeout(() => {
                isTransitioning = false;
            }, 500);
        });
    });

    // Reels scroll
    const handleReelsScroll = debounce(async () => {
        if (isTransitioning || isPlaying) return;

        const scrollLeft = creatorReels.scrollLeft;
        const cardWidth = videoCards[0].offsetWidth + 16;
        const activeIndex = Math.round(scrollLeft / cardWidth);

        creators.forEach(c => c.classList.remove('active'));
        creators[activeIndex].classList.add('active');

        await playVideo(activeIndex);

        const creatorWidth = creators[0].offsetWidth + 12;
        const scrollOffset = activeIndex * creatorWidth - (creatorProfile.offsetWidth - creatorWidth) / 2;
        creatorProfile.scrollTo({ left: scrollOffset, behavior: 'smooth' });
    }, 100);

    creatorReels.addEventListener('scroll', handleReelsScroll);

    // Mute toggle
    document.querySelectorAll('.mute-btn').forEach(button => {
        button.addEventListener('click', () => {
            const video = button.closest('.videoCard').querySelector('video');
            video.muted = !video.muted;
            button.querySelector('img').src = video.muted
                ? "https://cdn.tetr.com/assets/ih-images/icons/mute.png"
                : "https://cdn.tetr.com/assets/ih-images/icons/unmute.png";
        });
    });
});
