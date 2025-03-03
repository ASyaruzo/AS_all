export function initializeVoiceRecognition() {
    console.log("音声認識を初期化します。");
    const startVoiceBtn = document.getElementById('startVoice');
    const siriContainer = document.getElementById('siri-container');
    const diaryContent = document.getElementById('diaryContent');
    const createBtn = document.querySelector('.create-btn');

    let autoSaveTimer;
    const AUTO_SAVE_DELAY = 5000;  // 5秒

    if (!startVoiceBtn || !siriContainer || !diaryContent) {
        console.error("必要な要素が見つかりません。音声認識を初期化できません。");
        return;
    }

    let recognition = null;
    let siriRecognition = null;
    let isRecognizing = false;
    let inactivityTimeout = null;
    let isSpeaking = false; // 音声入力中かどうか

    if (!('webkitSpeechRecognition' in window)) {
        alert("お使いのブラウザは音声認識をサポートしていません。");
        return;
    }

    // 音声認識のインスタンス作成
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true; // 音声認識を常時有効化
    recognition.interimResults = true; // リアルタイムで認証結果を取得

    siriRecognition = new webkitSpeechRecognition();
    siriRecognition.lang = 'en-US';
    siriRecognition.continuous = true;
    siriRecognition.interimResults = true;

    let finalTranscript = '' // 確定した音声データを保持

    function startRecognition() {
        if (isRecognizing) return;  // すでに開始されていたら何もしない
        isRecognizing = true;
        isSpeaking = true; // 音声入力中はhey moon を無効化
        startVoiceBtn.style.backgroundColor = '#dc3545';
        siriWave.start();
        siriContainer.style.display = 'block';

        // 5秒間の無操作で音声入力を停止
        inactivityTimeout = setTimeout(stopRecognition, 5000);
    }

    // 一定時間無音だった時の処理
    function stopRecognition() {
        if (!isRecognizing) return;  // すでに停止していたら何もしない
        if (recognition) recognition.stop();
        isRecognizing = false;
        isSpeaking = false;
        startVoiceBtn.style.backgroundColor = '';
        siriWave.stop();
        siriContainer.style.display = 'none';
        clearTimeout(inactivityTimeout);

        // 音声入力中に一定時間無音だった時も、自動保存タイマーを起動
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(autoSaveDiary, AUTO_SAVE_DELAY);
    }

    recognition.onstart = startRecognition;

    recognition.onend = () => {
        if (isRecognizing) {
            recognition.start();
        } else {
            setTimeout(() => {
                siriRecognition.start();
            }, 1000);
        }
        };

    recognition.onresult = (event) => {
        clearTimeout(inactivityTimeout);


        let interimTranscript = ''; // 途中経過の音声

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();
            if (event.results[i].isFinal) {
                finalTranscript += transcript +" "; // 確定した音声データを追加
                isSpeaking = false; //f 確定したらhey moon を有効化
            } else {
                interimTranscript = transcript; // 途中経過の音声を更新
                isSpeaking = true; // 途中経過の時はhey moon を無効化
            }
        }

        console.log("認識中:", interimTranscript, "isSpeaking:", isSpeaking, "finalTranscript", finalTranscript);

        // diaryContentを最新のものに更新
        const diaryContent = document.getElementById('diaryContent');
        if (diaryContent) {
             // 確定した音声を保持するため、`value` に上書きするのではなく **結合** する
             diaryContent.value = finalTranscript + (interimTranscript ? ` ${interimTranscript}` : "");

            // 途中経過をリアルタイムで表示しつつ、上書
            // if (interimTranscript) {
            //     diaryContent.value += ` ${interimTranscript}`; // 途中経過を追記（リアルタイム表示）
            // }
        }

        // 自動保存タイマーをリセット
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(autoSaveDiary, AUTO_SAVE_DELAY);

        inactivityTimeout = setTimeout(stopRecognition, 5000);
    };


    // 自動保存
    function autoSaveDiary() {
        const saveDiaryButton = document.getElementById('saveDiary');
        if (diaryContent.value.trim() !== '') {
            saveDiaryButton.click();

            finalTranscript = ''; // 保存後は確定した音声データをリセット
        }
    }

    siriRecognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        if (!isSpeaking && (
            transcript.includes("hey moon") ||
            transcript.includes("hey mon") ||
            transcript.includes("hey mom") ||
            transcript.includes("hey man") ||
            transcript.includes("hey man") ||
            transcript.includes("Hey, Moon.") ||
            transcript.includes("Hate Moon?") ||
            transcript.includes("Haymoon.") ||
            transcript.includes("Hey, man.")
        )) {

            // 作成ページへ移動
            document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
            document.getElementById('create-page').style.display = 'block';
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const targetPage = item.getAttribute('data-page');

                    if (isRecognizing && targetPage !== 'create') {
                        console.log(" 他のページへ移動したため、音声認識を停止");
                        stopRecognition();
                    }
                });
            });
            document.querySelector('[data-page="create"]').classList.add('active');

            // 作成ページへ移動
            window.dispatchEvent(new CustomEvent('voiceCommand', { detail: 'hey moon' }));

            startVoiceBtn.style.backgroundColor = '#dc3545';
            siriWave.start();
            recognition.start();
        }
    };

    // 初回ロード時に hey moon を常に待ち受ける
    siriRecognition.start();

    // ユーザーが別のタブに移動した時に音声認識を停止**
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            console.log("ユーザーがタブを離れたため、音声認識を停止したで！");
            stopRecognition();
        }
    });


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
