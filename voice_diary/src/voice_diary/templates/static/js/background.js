document.addEventListener("DOMContentLoaded", () => {
    const backgroundContainer = document.createElement("div");
    backgroundContainer.id = "background-container";
    document.body.prepend(backgroundContainer); // 背景をbodyの最前面に追加

    function createCircle() {
        const circle = document.createElement("div");
        circle.classList.add("circle");

        // ランダムなサイズ (20px - 100px)
        const size = Math.random() * 80 + 20;
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;

        // ランダムな開始位置 (画面の横幅の範囲内)
        const positionX = Math.random() * window.innerWidth;
        circle.style.left = `${positionX}px`;

        // ランダムな色
        const colors = ["#ff9ff3", "#feca57", "#ff6b6b", "#48dbfb", "#1dd1a1", "#f368e0"];
        circle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // ランダムな透明度
        circle.style.opacity = Math.random() * 0.6 + 0.3;

        // ランダムなアニメーション時間 (5秒 - 15秒)
        const duration = Math.random() * 10 + 5;
        circle.style.animationDuration = `${duration}s`;

        backgroundContainer.appendChild(circle);

        // アニメーションが終わったら削除
        setTimeout(() => {
            circle.remove();
        }, duration * 1000);
    }

    // 一定時間ごとに円を生成 (0.5秒ごと)
    setInterval(createCircle, 500);
});
