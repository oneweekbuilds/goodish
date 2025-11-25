import React from 'react';

const BackgroundGradient = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Top Left Blob */}
            <div
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-purple-200 via-violet-100 to-transparent blur-3xl opacity-60 animate-pulse"
                style={{ animationDuration: '8s' }}
            />

            {/* Bottom Right Blob */}
            <div
                className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-blue-200 via-cyan-100 to-transparent blur-3xl opacity-60 animate-pulse"
                style={{ animationDuration: '8s', animationDelay: '1s' }}
            />
        </div>
    );
};

export default BackgroundGradient;
