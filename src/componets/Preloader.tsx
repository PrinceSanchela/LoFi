import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PreloaderProps {
    onFinish: () => void;
}

const typingText = "Prince Sanchela's Projects"; // ✅ Correct string
const Preloader: React.FC<PreloaderProps> = ({ onFinish }) => {
    const [displayText, setDisplayText] = useState(""); // typed letters
    const [showCursor, setShowCursor] = useState(false);
    const [zoomOut, setZoomOut] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect theme mode
    useEffect(() => {
        const checkTheme = () => {
            const darkMode = document.documentElement.classList.contains('dark');
            setIsDarkMode(darkMode);
        };

        // Initial check
        checkTheme();

        // Watch for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let index = 0;
        const typingSpeed = 100; // Original speed
        const cursorHold = 500; // Original hold
        const postDelay = 2000; // Original delay
        const fadeOutDuration = 800; // Original fade out

        // Typing interval
        const typingInterval = setInterval(() => {
            if (index < typingText.length) {
                setDisplayText(typingText.slice(0, index + 1));
                index++;
            } else {
                clearInterval(typingInterval);

                // Show blinking cursor
                setShowCursor(true);

                // Zoom-out effect
                setTimeout(() => setZoomOut(true), cursorHold);
            }
        }, typingSpeed);

        // Total duration before calling onFinish
        const totalDuration =
            typingText.length * typingSpeed + cursorHold + postDelay + fadeOutDuration;

        const finishTimer = setTimeout(() => onFinish(), totalDuration);

        return () => {
            clearInterval(typingInterval);
            clearTimeout(finishTimer);
        };
    }, [onFinish]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50 px-4 sm:px-6 md:px-8"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            >
                {/* Logo */}
                <motion.img
                    src={isDarkMode ? "/logo-dark.png" : "/logo-white.png"}
                    alt="Prince Logo"
                    className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 mb-4 sm:mb-6 md:mb-8"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{
                        scale: zoomOut ? 1.2 : 1,
                        rotate: zoomOut ? 20 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 120, damping: 12 }}
                />

                {/* Typing text */}
                <motion.h1
                    className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x flex items-center justify-center text-center max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw]"
                    animate={{ scale: zoomOut ? 1.1 : 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="break-words">{displayText}</span>
                    {showCursor && (
                        <motion.span
                            className="inline-block w-[1.5px] sm:w-[2px] h-4 xs:h-5 sm:h-6 md:h-7 lg:h-8 bg-blue-500 ml-0.5 sm:ml-1 flex-shrink-0"
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{
                                repeat: Infinity,
                                duration: 0.6,
                                ease: "easeInOut",
                            }}
                        />
                    )}
                </motion.h1>

                {/* Tagline */}
                <motion.p
                    className="text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 md:mt-4 text-xs xs:text-sm sm:text-base md:text-lg text-center max-w-[90vw] sm:max-w-[80vw]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    Crafting ideas into experiences 🚀
                </motion.p>
            </motion.div>
        </AnimatePresence>
    );
};

export default Preloader;
