import { initializeVoiceRecognition } from './voiceRecognition.js'
import { initializeDarkMode } from './darkMode.js'

document.addEventListener('DOMContentLoaded',() =>{

    initializeVoiceRecognition();
    initializeDarkMode();

    const diaryDateInput = document.getElementById('diaryDate');
    if (diaryDateInput) {
        const today = new Date().toISOString().split('T')[0];
        diaryDateInput.value = today
    };

    let isSpeaking = false;
    const synth = window.speechSynthesis;
    let currentUtterance = null;

    // メッセージ読み上げ
    function speakText(text) {
        if (isSpeaking) {
            synth.cancel();
            isSpeaking = false;
            console.log("🔊 読み上げをキャンセルしました");
        } else {
            setTimeout(() => {
                const currentUtterance = new SpeechSynthesisUtterance(text || "共感メッセージがありません");
                currentUtterance.lang = 'ja-JP';
                currentUtterance.volume = 1;
                currentUtterance.rate = 1;
                currentUtterance.pitch = 1;

                currentUtterance.onend = () => {
                    isSpeaking = false;
                    console.log("🔊 読み上げが完了しました");
                };
                synth.speak(currentUtterance);
                isSpeaking = true;
                console.log("🔊 読み上げを開始しました");
            }, 100);
        }
    }

    // SiriWave 初期化
    const siriContainer = document.getElementById('siri-container');
    if (!siriContainer) {
        console.error('SiriWave container not found');
        return;
    }

    let siriWave = new SiriWave({
        container: siriContainer,
        width: 300,
        height: 200,
        style: 'ios9',
        autostart: false,
    });

    window.siriWave = siriWave;

    // ページ切り替え機能
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            pages.forEach(page => page.style.display = 'none');
            document.getElementById(`${item.getAttribute('data-page')}-page`).style.display = 'block';
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // カレンダー
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

        async updateCalendar() {
            const year = this.date.getFullYear();
            const month = this.date.getMonth();
            this.currentMonthElement.textContent = `${year}年 ${this.months[month]}`;
            this.calendarDaysElement.innerHTML = '';

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const firstDayWeekday = firstDay.getDay();
            const prevMonthLastDay = new Date(year, month, 0).getDate();

            for (let i = firstDayWeekday - 1; i >= 0; i--) {
                this.calendarDaysElement.appendChild(this.createDayElement(prevMonthLastDay - i, 'other-month'));
            }

            for (let day = 1; day <= lastDay.getDate(); day++) {
                const dayElement = this.createDayElement(day, '');
                if (new Date().toDateString() === new Date(year, month, day).toDateString()) {
                    dayElement.classList.add('today');
                }
                if (await this.hasDiary(year, month + 1, day)) {
                    dayElement.classList.add('has-diary');
                }
                this.calendarDaysElement.appendChild(dayElement);
            }

            const remainingDays = 42 - this.calendarDaysElement.children.length;
            for (let day = 1; day <= remainingDays; day++) {
                this.calendarDaysElement.appendChild(this.createDayElement(day, 'other-month'));
            }
        }

        createDayElement(day, className) {
            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day ${className}`;
            dayElement.textContent = day;
            return dayElement;
        }

        async hasDiary(year, month, day) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const response = await fetch(`/get_diaries?date=${dateStr}`);
            const data = await response.json();
            return data.diaries.length > 0;
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

            this.calendarDaysElement.addEventListener('click', async (e) => {
                if (e.target.classList.contains('calendar-day')) {
                    document.querySelector('.selected')?.classList.remove('selected');
                    e.target.classList.add('selected');

                    const day = e.target.textContent.padStart(2, '0');
                    const month = (this.date.getMonth() + 1).toString().padStart(2, '0');
                    const year = this.date.getFullYear();
                    await fetchDiaries(`${year}-${month}-${day}`);
                }
            });
        }
    }

    new Calendar();

    // 日記保存
    document.getElementById('saveDiary').addEventListener('click', async () => {
        const diaryDateInput = document.getElementById('diaryDate');
        const diaryContentInput = document.getElementById('diaryContent');

        const date = diaryDateInput.value;
        const content = diaryContentInput.value;

        if (!date || !content) {
            alert('日付と内容を入力してください。');
            return;
        }

        const diary = {
            date: date,
            time: new Date().toLocaleTimeString('ja-JP'),
            content: content
        };

        try {
            const response = await fetch('/save_diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(diary)
            });

            const result = await response.json();

            if (response.ok) {

                diaryContentInput.value = '';

                const today = new Date().toISOString().split('T')[0];
                diaryDateInput.value = today;

                new Calendar();
                // calendar.updateCalendar();

                const createpage = document.getElementById('create-page');
                const calendarpage = document.getElementById('calendar-page');
            
                createpage.style.display = 'none';
                createpage.classList.remove('active');
                calendarpage.style.display = 'block';
                createpage.classList.add('active');
                

            } else {
                alert('エラーが発生しました: ' + result.message);
            }
        } catch (error) {
            console.error('日記保存エラー:', error);
            alert('日記の保存に失敗しました');
        }
    });

    // MongoDBから日記を取得
    async function fetchDiaries(date) {
        try {
            const response = await fetch(`/get_diaries?date=${date}`);
            const data = await response.json();
    
            const diaryList = document.getElementById('diaryList');
            diaryList.innerHTML = '';
    
            if (data.diaries.length === 0) {
                diaryList.innerHTML = '<div class="no-diary">この日の日記はありません</div>';
                return;
            }
    
            data.diaries.forEach(diary => {
                const diaryElement = document.createElement('div');
                diaryElement.className = 'diary-item';
                diaryElement.dataset.response = diary.response || '共感メッセージがありません';
                
                diaryElement.innerHTML = `
                    <p style="margin-bottom: 10px;"><strong>日記の内容:</strong> ${diary.content}</p>
                    <p><strong>共感:</strong> ${diary.response || 'なし'}</p>
                    <div class="diary-time">${diary.time}</div>
                `;
                
                let shouldShowEmotions = false;
                
                if (diary.prompt4emnum && diary.prompt4emnum.trim() !== '') {
                    try {
                        const emotionSizes = diary.prompt4emnum.split(',').map(size => parseInt(size.trim()));
                        
                        const allZeros = emotionSizes.every(size => size === 0 || isNaN(size));
                        
                        if (emotionSizes.length === 5 && !allZeros) {
                            shouldShowEmotions = true;
                            
                            const emotionContainer = document.createElement('div');
                            emotionContainer.className = 'emotion-container';
                            
                            const emotionCircles = document.createElement('div');
                            emotionCircles.className = 'emotion-circles flower-pattern';
                            
                            const emotions = [
                                { name: 'excitement', label: '興奮', size: emotionSizes[0] },
                                { name: 'happiness', label: '嬉しさ', size: emotionSizes[1] },
                                { name: 'neutral', label: '中立', size: emotionSizes[2] },
                                { name: 'sadness', label: '悲しみ', size: emotionSizes[3] },
                                { name: 'tired', label: '疲れ', size: emotionSizes[4] }
                            ];
                            
                            emotions.forEach(emotion => {
                                const circle = document.createElement('div');
                                circle.className = `emotion-circle ${emotion.name}`;
                                circle.style.setProperty('--scale-value', emotion.size/40);
                                
                                const span = document.createElement('span');
                                span.textContent = emotion.label;
                                
                                circle.appendChild(span);
                                emotionCircles.appendChild(circle);
                            });
                            
                            emotionContainer.appendChild(emotionCircles);
                            diaryElement.appendChild(emotionContainer);
                        }
                    } catch (error) {
                        console.error('日記取得エラー:', error);
                    }
                }
                
                diaryList.appendChild(diaryElement);
            });
        } catch (error) {
            console.error('日記取得エラー:', error);
        }
    }

    // diaryListの親要素にクリックイベントを追加
    const diaryList = document.getElementById('diaryList');
    if (diaryList) {
        diaryList.addEventListener('click', (e) => {
            const diaryItem = e.target.closest('.diary-item');
            if (diaryItem) {
                console.log("📌 diary-item クリックされました:", diaryItem);
                const responseText = diaryItem.dataset.response;
                console.log("🔊 読み上げる共感メッセージ:", responseText);
                speakText(responseText);
            }
        });
    }

    document.getElementById('calendar-page').style.display = 'block';
    document.querySelector('[data-page="calendar"]').classList.add('active');
});
