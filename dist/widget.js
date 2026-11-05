/**
 * Voxi.by — Embeddable WebRTC / Click-to-Call Voice Widget
 * Single-line integration for external websites:
 * <script src="https://voxi.by/widget.js" data-assistant="agent-id" data-color="#000000" data-position="bottom-right"></script>
 */

(function () {
  'use strict';

  if (window.__voxiWidgetLoaded) return;
  window.__voxiWidgetLoaded = true;

  // Read config from script tag
  const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const dataset = scriptTag ? scriptTag.dataset : {};

  const CONFIG = {
    assistantName: dataset.name || 'ИИ-Администратор',
    companyName: dataset.company || 'Voxi.by',
    primaryColor: dataset.color || '#000000',
    position: dataset.position || 'bottom-right',
    buttonText: dataset.buttonText || 'Позвонить администратору',
    welcomeMessage: dataset.welcome || 'Здравствуйте! Я голосовой ИИ-администратор. Чем могу помочь?',
  };

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    .voxi-widget-btn {
      position: fixed;
      ${CONFIG.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      bottom: 24px;
      z-index: 99999;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background: ${CONFIG.primaryColor};
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 9999px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .voxi-widget-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.4);
    }
    .voxi-widget-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: voxiPulse 1.8s infinite;
    }
    @keyframes voxiPulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .voxi-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 24px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .voxi-modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    .voxi-modal-card {
      width: 100%;
      max-width: 380px;
      background: #ffffff;
      color: #000000;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35);
      border: 1px solid #e5e5e5;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transform: translateY(20px) scale(0.96);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .voxi-modal-overlay.open .voxi-modal-card {
      transform: translateY(0) scale(1);
    }
    .voxi-modal-header {
      padding: 16px 20px;
      background: #000000;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .voxi-modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      min-height: 240px;
      justify-content: center;
    }
    .voxi-orb {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      position: relative;
    }
    .voxi-orb.active {
      animation: voxiOrbPulse 1.4s infinite alternate;
    }
    @keyframes voxiOrbPulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0.2); }
      100% { transform: scale(1.08); box-shadow: 0 0 0 16px rgba(0,0,0,0.06); }
    }
    .voxi-transcript-box {
      width: 100%;
      max-height: 120px;
      overflow-y: auto;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 13px;
      line-height: 1.4;
      color: #374151;
      text-align: center;
    }
    .voxi-action-btn {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .voxi-start-btn { background: #000000; color: #ffffff; }
    .voxi-stop-btn { background: #ef4444; color: #ffffff; }
  `;
  document.head.appendChild(style);

  // Create Button
  const btn = document.createElement('button');
  btn.className = 'voxi-widget-btn';
  btn.setAttribute('aria-label', CONFIG.buttonText);
  btn.innerHTML = `
    <span class="voxi-widget-pulse"></span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" x2="12" y1="19" y2="22"></line>
    </svg>
    <span>${CONFIG.buttonText}</span>
  `;
  document.body.appendChild(btn);

  // Create Modal
  const overlay = document.createElement('div');
  overlay.className = 'voxi-modal-overlay';
  overlay.innerHTML = `
    <div class="voxi-modal-card">
      <div class="voxi-modal-header">
        <div>
          <div style="font-weight:700;font-size:15px;">${CONFIG.assistantName}</div>
          <div style="font-size:11px;opacity:0.7;">${CONFIG.companyName} • Онлайн 24/7</div>
        </div>
        <button id="voxi-close-btn" style="background:transparent;border:none;color:#ffffff;cursor:pointer;font-size:20px;padding:4px;">✕</button>
      </div>
      <div class="voxi-modal-body">
        <div class="voxi-orb" id="voxi-orb">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" x2="12" y1="19" y2="22"></line>
          </svg>
        </div>
        <div class="voxi-transcript-box" id="voxi-transcript">
          Нажмите кнопку ниже, чтобы начать голосовой разговор с администратором.
        </div>
        <button class="voxi-action-btn voxi-start-btn" id="voxi-call-btn">
          <span>Начать разговор</span>
        </button>
      </div>
      <div style="padding:10px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #f3f4f6;">
        Работает на платформе Voxi.by 🇧🇾
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Logic
  const closeBtn = overlay.querySelector('#voxi-close-btn');
  const callBtn = overlay.querySelector('#voxi-call-btn');
  const transcriptEl = overlay.querySelector('#voxi-transcript');
  const orb = overlay.querySelector('#voxi-orb');

  let isCalling = false;
  let recognition = null;

  btn.addEventListener('click', () => {
    overlay.classList.add('open');
  });

  closeBtn.addEventListener('click', () => {
    stopCall();
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      stopCall();
      overlay.classList.remove('open');
    }
  });

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ru-RU';
    utter.rate = 1.0;
    utter.onstart = () => { orb.classList.add('active'); };
    utter.onend = () => { orb.classList.remove('active'); };
    window.speechSynthesis.speak(utter);
  }

  function startCall() {
    isCalling = true;
    callBtn.className = 'voxi-action-btn voxi-stop-btn';
    callBtn.innerHTML = '<span>Завершить звонок</span>';
    transcriptEl.textContent = CONFIG.welcomeMessage;
    speakText(CONFIG.welcomeMessage);

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        recognition = new SpeechRec();
        recognition.lang = 'ru-RU';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (evt) => {
          let text = '';
          for (let i = evt.resultIndex; i < evt.results.length; ++i) {
            text += evt.results[i][0].transcript;
          }
          if (text) {
            transcriptEl.textContent = 'Вы: ' + text;
          }
        };
        recognition.start();
      } catch {
        // Microphone access or permission failure
      }
    }
  }

  function stopCall() {
    isCalling = false;
    callBtn.className = 'voxi-action-btn voxi-start-btn';
    callBtn.innerHTML = '<span>Начать разговор</span>';
    orb.classList.remove('active');
    if (recognition) {
      try { recognition.stop(); } catch {}
      recognition = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  callBtn.addEventListener('click', () => {
    if (!isCalling) {
      startCall();
    } else {
      stopCall();
    }
  });
})();
