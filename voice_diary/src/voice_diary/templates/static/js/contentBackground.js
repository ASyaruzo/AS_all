document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.querySelector(".main-content");

    if (!mainContent) {
        console.warn("main-content が見つかりません。スクリプトを実行できません。");
        return;
    }

    // 背景用コンテナを作成し、main-content に追加
    const contentBackground = document.createElement("div");
    contentBackground.id = "content-background";
    mainContent.appendChild(contentBackground);

    function createSmallCircle() {
        const smallCircle = document.createElement("div");
        smallCircle.classList.add("small-circle");

        // ランダムなサイズ (5px - 20px)
        const size = Math.random() * 15 + 5;
        smallCircle.style.width = `${size}px`;
        smallCircle.style.height = `${size}px`;

        // ランダムな開始位置 (main-content の横幅の範囲内)
        const positionX = Math.random() * mainContent.clientWidth;
        smallCircle.style.left = `${positionX}px`;

        // ランダムな色
        const colors = ["#ff9ff3", "#feca57", "#ff6b6b", "#48dbfb", "#1dd1a1", "#f368e0"];
        smallCircle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // ランダムな透明度
        smallCircle.style.opacity = Math.random() * 0.5 + 0.2;

        // ランダムなアニメーション時間 (4秒 - 12秒)
        const duration = Math.random() * 8 + 4;
        smallCircle.style.animationDuration = `${duration}s`;

        contentBackground.appendChild(smallCircle);

        // アニメーションが終わったら削除
        setTimeout(() => {
            smallCircle.remove();
        }, duration * 1000);
    }

    // 一定時間ごとに小さな丸を生成 (0.3秒ごと)
    setInterval(createSmallCircle, 300);
});
