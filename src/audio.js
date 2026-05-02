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

    function clearFade(name) {
        const s = streams[name];
        if (s && s.fadeInterval) {
            clearInterval(s.fadeInterval);
            s.fadeInterval = null;
        }
    }

    function fade(name, targetVolume, durationMs) {
        const s = streams[name];
        if (!s) return;

        clearFade(name);

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
                clearFade(name);
            }
        }, stepTime);
    }

    return {

        // Create a new audio stream
        create(name, url, options = {}) {
            if (streams[name]) {
                throw new Error(`Stream with name "${name}" already exists`);
            }

            const audio = document.createElement("audio");
            audio.src = url;
            audio.preload = "auto";
            audio.controls = false;

            // optional callback
            if (typeof options.onEnded === "function") {
                audio.addEventListener("ended", () => {
                    options.onEnded(name);
                });
            }

            getContainer().appendChild(audio);

            streams[name] = {
                audio,
                fadeInterval: null
            };
        },

        play(name, { fadeInMs = 0, targetVolume = 100, callback = null } = {}) {
            const s = streams[name];
            if (!s) return;

            // optional callback
            if (typeof callback === "function") {
                audio.addEventListener("ended", () => {
                    callback(name);
                });
            }

            const audio = s.audio;

            if (fadeInMs > 0) {
                audio.volume = 0;
                audio.play();
                fade(name, targetVolume, fadeInMs);
            } else {
                audio.volume = clampVolume(targetVolume) / 100;
                audio.play();
            }
        },

        pause(name) {
            const s = streams[name];
            if (!s) return;

            clearFade(name);
            s.audio.pause();
        },

        stop(name, { fadeOutMs = 0 } = {}) {
            const s = streams[name];
            if (!s) return;

            if (fadeOutMs > 0) {
                fade(name, 0, fadeOutMs);

                setTimeout(() => {
                    s.audio.pause();
                    s.audio.currentTime = 0;
                }, fadeOutMs);
            } else {
                clearFade(name);
                s.audio.pause();
                s.audio.currentTime = 0;
            }
        },

        delete(name, { fadeOutMs = 0 } = {}) {
            const s = streams[name];
            if (!s) return;

            if (fadeOutMs > 0) {
                fade(name, 0, fadeOutMs);

                setTimeout(() => {
                    s.audio.pause();
                    s.audio.remove();
                    delete streams[name];
                }, fadeOutMs);
            } else {
                clearFade(name);
                s.audio.pause();
                s.audio.remove();
                delete streams[name];
            }
        },

        setVolume(name, volume, { fadeMs = 0 } = {}) {
            const s = streams[name];
            if (!s) return;

            if (fadeMs > 0) {
                fade(name, volume, fadeMs);
            } else {
                clearFade(name);
                s.audio.volume = clampVolume(volume) / 100;
            }
        },

        exists(name) {
            return !!streams[name];
        },

        stopAll({ fadeOutMs = 0 } = {}) {
            Object.keys(streams).forEach(name => {
                this.stop(name, { fadeOutMs });
            });
        },

       deleteAll({ fadeOutMs = 0 } = {}) {
            Object.keys(streams).forEach(name => {
                this.delete(name, { fadeOutMs });
            });
        }
    };
})();