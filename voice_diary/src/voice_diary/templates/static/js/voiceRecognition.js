export function initializeVoiceRecognition() {
    console.log("音声認識を初期化します。");
    const startVoiceBtn = document.getElementById('startVoice');
    const siriContainer = document.getElementById('siri-container');
    const diaryContent = document.getElementById('diaryContent');
    const createBtn = document.querySelector('.create-btn');

    if (!startVoiceBtn || !siriContainer || !diaryContent) {
        console.error("必要な要素が見つかりません。音声認識を初期化できません。");
        return;
    }

    let recognition = null;
    let siriRecognition = null;
    let isRecognizing = false;
    let inactivityTimeout = null;

    if (!('webkitSpeechRecognition' in window)) {
        alert("お使いのブラウザは音声認識をサポートしていません。");
        return;
    }

    // 音声認識のインスタンス作成
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = true;

    siriRecognition = new webkitSpeechRecognition();
    siriRecognition.lang = 'ja-JP';
    siriRecognition.continuous = true;
    siriRecognition.interimResults = true;

    function startRecognition() {
        isRecognizing = true;
        startVoiceBtn.style.backgroundColor = '#dc3545';
        siriWave.start();
        siriContainer.style.display = 'block';

        // 5秒間の無操作で音声入力を停止
        inactivityTimeout = setTimeout(stopRecognition, 5000);
    }

    function stopRecognition() {
        if (recognition) recognition.stop();
        if (siriRecognition) siriRecognition.stop();
        isRecognizing = false;
        startVoiceBtn.style.backgroundColor = '';
        siriWave.stop();
        siriContainer.style.display = 'none';
        clearTimeout(inactivityTimeout);
    }

    recognition.onstart = startRecognition;

    recognition.onend = () => {
        stopRecognition();
        if (siriRecognition) siriRecognition.start();
    };

    recognition.onresult = (event) => {
        clearTimeout(inactivityTimeout);
        diaryContent.value = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        inactivityTimeout = setTimeout(stopRecognition, 5000);
    };

    siriRecognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        if (transcript.includes("Hey Siri")) {
            startVoiceBtn.style.backgroundColor = '#dc3545';
            siriWave.start();
            recognition.start();
        }
    };

    // `create-btn` が存在する場合のみイベントを追加
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (!siriRecognition) {
                alert('お使いのブラウザは音声入力に対応していません。');
                return;
            }
            siriRecognition.start();
        });
    }

    // 音声入力ボタンのクリックイベント
    startVoiceBtn.addEventListener('click', () => {
        if (!recognition) {
            alert('お使いのブラウザは音声入力に対応していません。');
            return;
        }

        if (isRecognizing) {
            stopRecognition();
            siriRecognition.start();
        } else {
            recognition.start();
        }
    });
}
