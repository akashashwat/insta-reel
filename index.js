document.addEventListener('DOMContentLoaded', () => {
    const creators = document.querySelectorAll('.creator');
    const videoCards = document.querySelectorAll('.videoCard');
    const creatorReels = document.querySelector('.creatorReels');
    const creatorProfile = document.querySelector('.creatorProfile');

    let currentVideoIndex = 0; // Track the currently playing video
    let isPlaying = false; // Flag to track if a video is currently starting playback
    let isTransitioning = false; // Flag to prevent updates during creator transitions
    let progressInterval = null; // Track the progress bar interval

    // Debounce function to limit the rate of scroll event handling
    function debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Function to pause all videos except the one at the given index
    async function pauseAllVideos(exceptIndex) {
        for (let i = 0; i < videoCards.length; i++) {
            if (i !== exceptIndex) {
                const video = videoCards[i].querySelector('video');
                const progressBar = videoCards[i].querySelector('.progress-bar span');
                if (!video.paused) {
                    await video.pause(); // Ensure pause completes
                    video.currentTime = 0;
                    progressBar.style.width = '0%';
                }
            }
        }
        // Clear any existing progress bar interval
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    // Function to update the progress bar for a video
    function updateProgressBar(video, progressSpan) {
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        progressInterval = setInterval(() => {
            if (video.paused || video.ended) {
                clearInterval(progressInterval);
                progressInterval = null;
                return;
            }

            const percent = (video.currentTime / video.duration) * 100;
            progressSpan.style.width = `${percent}%`;

            if (percent >= 100) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
        }, 100); // Update every 100ms
    }

    // Function to play video and update progress bar
    async function playVideo(index) {
        if (currentVideoIndex === index && !videoCards[index].querySelector('video').paused) {
            return; // If the video is already playing, do nothing
        }

        // Set the flag to indicate a play operation is in progress
        isPlaying = true;

        try {
            // Pause all other videos
            await pauseAllVideos(index);

            const video = videoCards[index].querySelector('video');
            const progressBar = videoCards[index].querySelector('.progress-bar span');

            // Reset video state
            video.currentTime = 0;
            progressBar.style.width = '0%'; // Ensure progress bar starts at 0

            // Play the video and wait for the play promise to resolve
            await video.play();

            // Update current video index
            currentVideoIndex = index;

            // Start updating the progress bar
            updateProgressBar(video, progressBar);

        } catch (error) {
            console.error('Error playing video:', error);
        } finally {
            isPlaying = false; // Reset the flag once the play operation is complete
        }
    }

    // Initial play of the first video
    playVideo(0);

    // Click event for creators
    creators.forEach((creator, index) => {
        creator.addEventListener('click', async () => {
            if (isTransitioning || isPlaying) {
                return; // Prevent clicks during transitions or play operations
            }

            isTransitioning = true;

            // Update active creator
            creators.forEach(c => c.classList.remove('active'));
            creator.classList.add('active');

            // Scroll to corresponding video card
            const videoCard = videoCards[index];
            videoCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });

            // Play the corresponding video
            await playVideo(index);

            // Scroll creator profile to center the active creator
            const creatorWidth = creator.offsetWidth + 12; // Including gap
            const scrollOffset = index * creatorWidth - (creatorProfile.offsetWidth - creatorWidth) / 2;
            creatorProfile.scrollTo({ left: scrollOffset, behavior: 'smooth' });

            // Reset the transitioning flag after the scroll animation
            setTimeout(() => {
                isTransitioning = false;
            }, 500); // Match the scroll animation duration (adjust if needed)
        });
    });

    // Scroll event for video cards (debounced to prevent rapid updates)
    const handleReelsScroll = debounce(async () => {
        if (isTransitioning || isPlaying) {
            return; // Skip updates during transitions or play operations
        }

        const scrollLeft = creatorReels.scrollLeft;
        const cardWidth = videoCards[0].offsetWidth + 16; // Including gap
        const activeIndex = Math.round(scrollLeft / cardWidth);

        // Update active creator
        creators.forEach(c => c.classList.remove('active'));
        creators[activeIndex].classList.add('active');

        // Play the active video
        await playVideo(activeIndex);

        // Scroll creator profile to center the active creator
        const creatorWidth = creators[0].offsetWidth + 12; // Including gap
        const scrollOffset = activeIndex * creatorWidth - (creatorProfile.offsetWidth - creatorWidth) / 2;
        creatorProfile.scrollTo({ left: scrollOffset, behavior: 'smooth' });
    }, 100);

    creatorReels.addEventListener('scroll', handleReelsScroll);

    // Mute/Unmute functionality
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