document.addEventListener('DOMContentLoaded', function() {
    // SiriWave初期化
    const siriContainer = document.getElementById('siri-container');
    if (!siriContainer) {
        console.error('SiriWave container not found');
        return;
    }

    // SiriWaveの初期化
    let siriWave = new SiriWave({
        container: siriContainer,
        width: 300,
        height: 200,
        style: 'ios9',
        autostart: false,
    });

    // SiriWaveをグローバルにアクセス可能にする
    window.siriWave = siriWave;
    
    // ページ切替機能
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 全てのページを隠す
            pages.forEach(page => {
                page.style.display = 'none';
            });
            
            // 選択したページを表示
            const pageId = item.getAttribute('data-page');
            document.getElementById(`${pageId}-page`).style.display = 'block';
            
            // ナビゲーション・アイテムのアクティベーション・ステータスを更新する
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            item.classList.add('active');
        });
    });

    // 初期化カレンダー
    class Calendar {
        constructor() {
            this.date = new Date();
            this.months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            this.currentMonthElement = document.getElementById('currentMonth');
            this.calendarDaysElement = document.getElementById('calendarDays');
            this.diaryListElement = document.getElementById('diaryList');
            
            this.updateCalendar();
            this.setupEventListeners();
        }

        updateCalendar() {
            const year = this.date.getFullYear();
            const month = this.date.getMonth();
            
            // 月タイトルを更新
            this.currentMonthElement.textContent = `${year}年 ${this.months[month]}`;
            
            // カレンダークリア
            this.calendarDaysElement.innerHTML = '';
            
            // 月の最初と最後の日を取得
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            // 前月の日付を記入
            const firstDayWeekday = firstDay.getDay();
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            
            for (let i = firstDayWeekday - 1; i >= 0; i--) {
                const dayElement = this.createDayElement(prevMonthLastDay - i, 'other-month');
                this.calendarDaysElement.appendChild(dayElement);
            }
            
            // 当月の日付を入力
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const dayElement = this.createDayElement(day, '');
                
                // 今日の日付をチェック
                const currentDate = new Date();
                if (currentDate.getDate() === day && 
                    currentDate.getMonth() === month && 
                    currentDate.getFullYear() === year) {
                    dayElement.classList.add('today');
                }
                
                // 日記があるかどうかをチェック
                if (this.hasDiary(year, month + 1, day)) {
                    dayElement.classList.add('has-diary');
                }
                
                this.calendarDaysElement.appendChild(dayElement);
            }
            
            // 下月の日付を入力
            const remainingDays = 42 - this.calendarDaysElement.children.length;
            for (let day = 1; day <= remainingDays; day++) {
                const dayElement = this.createDayElement(day, 'other-month');
                this.calendarDaysElement.appendChild(dayElement);
            }
        }

        createDayElement(day, className) {
            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day ${className}`;
            dayElement.textContent = day;
            return dayElement;
        }

        hasDiary(year, month, day) {
            const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            return diaries.some(diary => diary.date === dateStr);
        }

        showDiaries(year, month, day) {
            const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayDiaries = diaries.filter(diary => diary.date === dateStr);
            
            this.diaryListElement.innerHTML = '';
            
            if (dayDiaries.length === 0) {
                this.diaryListElement.innerHTML = '<div class="no-diary">この日の日記はありません</div>';
                return;
            }
            
            
            dayDiaries.forEach(diary => {
                const diaryElement = document.createElement('div');
                diaryElement.className = 'diary-item';
                diaryElement.innerHTML = `
                    <p>${diary.content}</p>
                    <div class="diary-time">${diary.time}</div>
                    ${diary.response ? `<div class="diary-feedback">${diary.response}</div>` : ''}
 
                `;
                this.diaryListElement.appendChild(diaryElement);
            });
        }

        setupEventListeners() {
            document.getElementById('prevMonth').addEventListener('click', () => {
                this.date.setMonth(this.date.getMonth() - 1);
                this.updateCalendar();
            });
            
            document.getElementById('nextMonth').addEventListener('click', () => {
                this.date.setMonth(this.date.getMonth() + 1);
                this.updateCalendar();
            });
            
            this.calendarDaysElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('calendar-day')) {
                    // 以前選択した日付を削除
                    const selectedDay = this.calendarDaysElement.querySelector('.selected');
                    if (selectedDay) {
                        selectedDay.classList.remove('selected');
                    }
                    
                    // 選択した日付をハイライト
                    e.target.classList.add('selected');
                    
                    // 選択した日付の日記を表示
                    const day = parseInt(e.target.textContent);
                    const month = this.date.getMonth() + 1;
                    const year = this.date.getFullYear();

                    this.showDiaries(year, month, day);
                }
            });
        }
    }

    // カレンダーの初期化
    new Calendar();

    // 音声入力機能の初期化
    const startVoiceBtn = document.getElementById('startVoice');
    if (!startVoiceBtn) {
        console.error("Start voice button not found");
        return;
    }
    let recognition = null;
    let siriRecognition = null;
    let isRecognizing = false; // マイクが作動中かどうかを追跡
    let inactivityTimeout = null; // マイクが無操作の場合のタイムアウト

    if ('webkitSpeechRecognition' in window) {
        // テキスト入力用の音声認識
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = true;

        const siriContainer = document.getElementById('siri-container')

        recognition.onstart = () => {
            isRecognizing = true; // マイクが作動中
            startVoiceBtn.style.backgroundColor = '#dc3545'; // ボタンを赤色に変更
            siriWave.start(); // SiriWaveを開始
            siriContainer.style.display = 'block'; // SiriWaveのコンテナを表示

            // 10秒間の無操作で音声入力を停止
            inactivityTimeout = setTimeout(() => {
                recognition.stop();
                siriWave.stop();
                startVoiceBtn.style.backgroundColor = ''; // ボタンの色を元に戻す
                stop_message = '音声入力が10秒間検出されなかったため停止しました。'
                console.log(stop_message);
            }, 5000); // 5秒
        };

        recognition.onend = () => {
            isRecognizing = false; // マイクが終了
            startVoiceBtn.style.backgroundColor = ''; // ボタンの色を元に戻す
            siriWave.stop(); // SiriWaveを停止
            siriContainer.style.display = 'none'; // SiriWaveのコンテナを表示
            clearTimeout(inactivityTimeout); // タイムーをクリア(?)

            // テキスト入力用の音声認識を再開
            if (siriRecognition) {
                siriRecognition.start();
            }
        };

        recognition.onresult = (event) => {
            clearTimeout(inactivityTimeout); // タイムーをリセット(?)
            const content = document.getElementById('diaryContent');
            content.value = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            // 新しいタイマーを再設定
            inactivityTimeout = setTimeout(() => {
                recognition.stop();
                siriWave.stop();
                startVoiceBtn.style.backgroundColor = ''; // ボタンの色を元に戻す
                stop_message = '音声入力が10秒間検出されなかったため停止しました。'
                console.log(stop_message);
            }, 5000); // 5秒
        };

        // "ヘイSiri"認識用の音声認識
        siriRecognition = new webkitSpeechRecognition();
        siriRecognition.lang = 'ja-JP';
        siriRecognition.continuous = true;
        siriRecognition.interimResults = true;

        siriRecognition.onresult = (event) => {
            const content = document.getElementById('diaryContent');
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            // "ヘイSiri"が検出された場合、音声入力を開始
            if (transcript.includes("Hey Siri")) {
                startVoiceBtn.style.backgroundColor = '#dc3545';
                siriWave.start(); // SiriWaveを開始
                recognition.start(); // テキスト入力用の音声認識を開始
            }
        };
    }

    // create-btnが押されたときにSiri認識を常に起動
    document.querySelector('.create-btn').addEventListener('click', () => {
        if (!siriRecognition) {
            alert('お使いのブラウザは音声入力に対応していません。');
            return;
        }
        siriRecognition.start(); // "ヘイSiri"認識を開始
    });

    // テキスト入力用マイクボタンのイベントリスナー
    startVoiceBtn.addEventListener('click', () => {
        if (!recognition) {
            alert('お使いのブラウザは音声入力に対応していません。');
            return;
        }

        // テキスト入力用マイクが作動中の場合、終了して"ヘイSiri"マイクに切り替え
        if (isRecognizing) {
            recognition.stop(); // テキスト入力用の音声認識を停止
            siriRecognition.start(); // "ヘイSiri"認識を開始
        } else {
            recognition.start(); // テキスト入力用の音声認識を開始
        }
    });

    // 日記保存
    document.getElementById('saveDiary').addEventListener('click', () => {
        const date = document.getElementById('diaryDate').value;
        const content = document.getElementById('diaryContent').value;
        
        if (!date || !content) {
            alert('日付と内容を入力してください。');
            return;
        }
        
        const diary = {
            date: date,
            time: new Date().toLocaleTimeString('ja-JP'),
            content: content
        };
        
        // ここで日記をサーバーに送信
        fetch('/save_diary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(diary)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            alert('日記を保存しました！');
            // フォームをクリア
            document.getElementById('diaryDate').value = '';
            document.getElementById('diaryContent').value = '';
        })
        
        const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
        diaries.push(diary);
        localStorage.setItem('diaries', JSON.stringify(diaries));
        
        // フォームをクリア
        document.getElementById('diaryDate').value = '';
        document.getElementById('diaryContent').value = '';
        
        alert('日記を保存しました！');

        // カレンダーの更新（カレンダーページの場合）
        const calendar = document.querySelector('.calendar-page');
        if (calendar && window.getComputedStyle(calendar).display !== 'none') {
            new Calendar();
        }
    });

    // 深色モード切替
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
    });

    // 深色モード設定のチェック
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // 初期ページ（カレンダー）の表示
    document.getElementById('calendar-page').style.display = 'block';
    document.querySelector('[data-page="calendar"]').classList.add('active');

    // 日付選択器のクリックイベント
    const dateFormGroup = document.querySelector('#create-page .form-group');
    if (dateFormGroup) {
        dateFormGroup.addEventListener('click', function() {
            const dateInput = this.querySelector('.diary-date');
            if (dateInput) {
                dateInput.click();
            }
        });
    }
});