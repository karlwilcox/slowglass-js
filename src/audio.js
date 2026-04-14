export const AudioManager = (function () {
    const streams = {};
    let container = null;

    function getContainer() {
        if (!container) {
            container = document.getElementById("audio");
            if (!container) {
                throw new Error('Audio container div with id "audio" not found');
            }
        }
        return container;
    }

    function clampVolume(vol) {
        return Math.max(0, Math.min(100, vol));
    }

    function clearFade(tag) {
        const s = streams[tag];
        if (s && s.fadeInterval) {
            clearInterval(s.fadeInterval);
            s.fadeInterval = null;
        }
    }

    function fade(tag, targetVolume, durationMs) {
        const s = streams[tag];
        if (!s) return;

        clearFade(tag);

        const audio = s.audio;
        const startVolume = audio.volume;
        const endVolume = clampVolume(targetVolume) / 100;

        if (durationMs <= 0) {
            audio.volume = endVolume;
            return;
        }

        const steps = 30; // smoothness
        const stepTime = durationMs / steps;
        const delta = (endVolume - startVolume) / steps;

        let currentStep = 0;

        s.fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, Math.min(1, audio.volume + delta));

            if (currentStep >= steps) {
                audio.volume = endVolume;
                clearFade(tag);
            }
        }, stepTime);
    }

    return {

        // Create a new audio stream
        create(tag, url, options = {}) {
            if (streams[tag]) {
                throw new Error(`Stream with tag "${tag}" already exists`);
            }

            const audio = document.createElement("audio");
            audio.src = url;
            audio.preload = "auto";
            audio.controls = false;

            // optional callback
            if (typeof options.onEnded === "function") {
                audio.addEventListener("ended", () => {
                    options.onEnded(tag);
                });
            }

            getContainer().appendChild(audio);

            streams[tag] = {
                audio,
                fadeInterval: null
            };
        },

        play(tag, { fadeInMs = 0, targetVolume = 100, callback = null } = {}) {
            const s = streams[tag];
            if (!s) return;

            // optional callback
            if (typeof callback === "function") {
                audio.addEventListener("ended", () => {
                    callback(tag);
                });
            }

            const audio = s.audio;

            if (fadeInMs > 0) {
                audio.volume = 0;
                audio.play();
                fade(tag, targetVolume, fadeInMs);
            } else {
                audio.volume = clampVolume(targetVolume) / 100;
                audio.play();
            }
        },

        pause(tag) {
            const s = streams[tag];
            if (!s) return;

            clearFade(tag);
            s.audio.pause();
        },

        stop(tag, { fadeOutMs = 0 } = {}) {
            const s = streams[tag];
            if (!s) return;

            if (fadeOutMs > 0) {
                fade(tag, 0, fadeOutMs);

                setTimeout(() => {
                    s.audio.pause();
                    s.audio.currentTime = 0;
                }, fadeOutMs);
            } else {
                clearFade(tag);
                s.audio.pause();
                s.audio.currentTime = 0;
            }
        },

        delete(tag, { fadeOutMs = 0 } = {}) {
            const s = streams[tag];
            if (!s) return;

            if (fadeOutMs > 0) {
                fade(tag, 0, fadeOutMs);

                setTimeout(() => {
                    s.audio.pause();
                    s.audio.remove();
                    delete streams[tag];
                }, fadeOutMs);
            } else {
                clearFade(tag);
                s.audio.pause();
                s.audio.remove();
                delete streams[tag];
            }
        },

        setVolume(tag, volume, { fadeMs = 0 } = {}) {
            const s = streams[tag];
            if (!s) return;

            if (fadeMs > 0) {
                fade(tag, volume, fadeMs);
            } else {
                clearFade(tag);
                s.audio.volume = clampVolume(volume) / 100;
            }
        },

        exists(tag) {
            return !!streams[tag];
        },

        stopAll({ fadeOutMs = 0 } = {}) {
            Object.keys(streams).forEach(tag => {
                this.stop(tag, { fadeOutMs });
            });
        },

       deleteAll({ fadeOutMs = 0 } = {}) {
            Object.keys(streams).forEach(tag => {
                this.delete(tag, { fadeOutMs });
            });
        }
    };
})();