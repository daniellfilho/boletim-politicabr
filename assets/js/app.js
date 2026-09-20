/**
 * BOLETIM POLITICABR - QUIZ & SMARTPHONE APP SIMULATOR
 * Modern, impartial, high-performance political personalization engine.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDateHeader();
  loadDailyNewsFeed();
  initQuizApp();
  initUrnaSimulator();
});

/* ==========================================================================
   LINK DE CHECKOUT DA ASSINATURA (KIWIFY)
   Troque pela URL real assim que o produto for criado na Kiwify
   (Painel Kiwify -> seu produto -> "Link de vendas" ou "Compartilhar").
   ========================================================================== */
const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/8IfBNlU';

/* ==========================================================================
   1. DYNAMIC HEADER DATE
   ========================================================================== */
function initDateHeader() {
  const dateEl = document.getElementById('current-edition-date');
  const clockEl = document.getElementById('device-clock');

  function updateTimes() {
    const now = new Date();
    if (dateEl) {
      const options = { day: '2-digit', month: 'long', year: 'numeric' };
      const formatted = now.toLocaleDateString('pt-BR', options);
      dateEl.innerHTML = `<span class="edition-bullet"></span> EDIÇÃO DE HOJE: ${formatted.toUpperCase()}`;
    }
    if (clockEl) {
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      clockEl.textContent = `${hours}:${minutes}`;
    }
  }

  updateTimes();
  setInterval(updateTimes, 30000);
}

/* ==========================================================================
   2. DIAGNÓSTICO RÁPIDO (PERGUNTA ÚNICA DE AUTO-IDENTIFICAÇÃO)
   ========================================================================== */
/* O quiz de múltiplas perguntas foi substituído por uma única pergunta
   direta: "Com qual lado você mais se identifica?" (Esquerda/Centro/Direita).
   Cada opção já mapeia direto para um "score" representativo, reaproveitado
   pelas mesmas funções de personalização (showResults, feed diário etc.)
   que já existiam para o quiz de várias perguntas. */
const SCORE_POR_LADO = {
  esquerda: -60,
  centro: 0,
  direita: 60
};

/* ==========================================================================
   3. QUIZ ENGINE CONTROLLER
   ========================================================================== */
let currentScore = 0; // score representativo do lado escolhido (ver SCORE_POR_LADO)

function initQuizApp() {
  // Screen elements
  const introView = document.getElementById('view-intro');
  const quizView = document.getElementById('view-quiz');
  const startBtn = document.getElementById('btn-start-quiz');

  // Start Quiz Button -> mostra a pergunta única
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      introView.classList.remove('active');
      quizView.classList.add('active');
    });
  }

  // Botões de auto-identificação (Esquerda / Centro / Direita)
  document.querySelectorAll('.lado-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lado-btn').forEach((b) => (b.style.pointerEvents = 'none'));
      btn.classList.add('selected');
      const lado = btn.dataset.lado;
      currentScore = SCORE_POR_LADO[lado] ?? 0;
      setTimeout(() => {
        showPreResultado(lado);
      }, 250);
    });
  });

  // Setup App Preview Button
  const previewAppBtn = document.getElementById('btn-see-app-preview');
  if (previewAppBtn) {
    previewAppBtn.addEventListener('click', () => {
      document.getElementById('mockup-showcase').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Setup Lead Capture Trigger Button
  const convertBtn = document.getElementById('btn-convert-access');
  if (convertBtn) {
    convertBtn.addEventListener('click', () => {
      document.getElementById('capture-section').scrollIntoView({ behavior: 'smooth' });
      document.getElementById('lead-name').focus();
    });
  }

  // Setup Interactive Phone Mockup Widgets
  initPhoneMockupInteractivity();

  // Setup Lead Form Submission
  initLeadForm();
}

/* ==========================================================================
   2.7 PRÉ-RESULTADO — frase provocativa antes da Urna
   ========================================================================== */
function showPreResultado(lado) {
  const quizView = document.getElementById('view-quiz');
  const preView = document.getElementById('view-preresultado');

  quizView.classList.remove('active');
  preView.classList.add('active');

  const fraseEl = document.getElementById('preresultado-frase');

  if (lado === 'direita') {
    fraseEl.textContent = 'Então você é um patriota!?';
  } else if (lado === 'esquerda') {
    fraseEl.textContent = 'Então você é companheiro(a)!?';
  } else {
    fraseEl.textContent = 'Então você é do time do bom senso!?';
  }

  const btnContinuar = document.getElementById('btn-continuar-preresultado');
  // Evita empilhar listeners se a pessoa passar por essa tela mais de uma vez
  btnContinuar.onclick = () => {
    showResults();
    setTimeout(() => {
      const urna = document.getElementById('urna-showcase');
      if (urna) {
        const headerEl = document.querySelector('.site-header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
        const y = urna.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 150);
  };
}

/* ==========================================================================
   4. SCORE CALCULATION & RESULT MAPPING (-100 TO +100)
   ========================================================================== */
function showResults() {
  const quizView = document.getElementById('view-quiz');
  const resultView = document.getElementById('view-result');

  quizView.classList.remove('active');
  resultView.classList.add('active');

  // Score já definido diretamente pela escolha na pergunta única
  const normalizedScore = currentScore;

  // Map to political profile with luminous dark-theme tags
  let profile = {
    title: "Centro Moderado / Pragmático",
    tagColor: "#38bdf8",
    tagBg: "rgba(56, 189, 248, 0.15)",
    description: "Você valoriza a estabilidade institucional, soluções de bom senso e equilíbrio pragmático. Desconfia de soluções radicais e prefere reformas graduais que combinem responsabilidade econômica com justiça social."
  };

  if (normalizedScore <= -45) {
    profile = {
      title: "Esquerda Democrática",
      tagColor: "#93c5fd",
      tagBg: "rgba(59, 130, 246, 0.2)",
      description: "Você defende o fortalecimento de serviços públicos universais, a centralidade do combate às desigualdades e a regulação ativa do mercado para garantir direitos e dignidade para as maiorias."
    };
  } else if (normalizedScore > -45 && normalizedScore <= -15) {
    profile = {
      title: "Centro-Esquerda Social",
      tagColor: "#7dd3fc",
      tagBg: "rgba(14, 165, 233, 0.2)",
      description: "Você combina a defesa de uma rede forte de proteção social e sustentabilidade com o respeito ao funcionamento dos mercados e responsabilidade fiscal equilibrada."
    };
  } else if (normalizedScore >= 15 && normalizedScore < 45) {
    profile = {
      title: "Centro-Direita Liberal",
      tagColor: "#fde047",
      tagBg: "rgba(250, 204, 21, 0.2)",
      description: "Você prioriza a liberdade de empreender, a desburocratização estatal e a eficiência dos gastos públicos, mantendo respeito à institucionalidade e aos direitos civis."
    };
  } else if (normalizedScore >= 45) {
    profile = {
      title: "Direita Liberal-Conservadora",
      tagColor: "#fca5a5",
      tagBg: "rgba(239, 68, 68, 0.2)",
      description: "Você apoia com convicção o livre mercado irrestrito, a redução drástica do peso do Estado, a responsabilidade individual, a firmeza na segurança pública e a preservação de valores tradicionais."
    };
  }

  // Update UI Elements
  document.getElementById('result-profile-name').textContent = profile.title;
  const tagEl = document.getElementById('result-profile-tag');
  tagEl.textContent = `Pontuação no Espectro: ${normalizedScore > 0 ? '+' + normalizedScore : normalizedScore}`;
  tagEl.style.color = profile.tagColor;
  tagEl.style.backgroundColor = profile.tagBg;
  tagEl.style.borderColor = profile.tagColor;

  document.getElementById('result-description-text').textContent = profile.description;

  // Show the personalized visual block only for right- or left-leaning results
  const rightBlock = document.getElementById('result-personalized-right');
  if (rightBlock) {
    rightBlock.style.display = normalizedScore >= 15 ? 'block' : 'none';
  }
  const leftBlock = document.getElementById('result-personalized-left');
  if (leftBlock) {
    leftBlock.style.display = normalizedScore <= -15 ? 'block' : 'none';
  }
  const centerBlock = document.getElementById('result-personalized-center');
  if (centerBlock) {
    centerBlock.style.display = (normalizedScore > -15 && normalizedScore < 15) ? 'block' : 'none';
  }

  // Move indicator on spectrum bar (-100 = 0%, 0 = 50%, +100 = 100%)
  const percentagePos = ((normalizedScore + 100) / 200) * 100;
  const indicator = document.getElementById('spectrum-indicator');
  setTimeout(() => {
    indicator.style.left = `${percentagePos}%`;
  }, 300);

  // Save in hidden fields and localStorage for customization
  window.currentUserScore = normalizedScore;
  window.currentUserProfile = profile.title;

  localStorage.setItem('boletim_quiz_score', normalizedScore);
  localStorage.setItem('boletim_quiz_profile', profile.title);

  // Update Mockup to reflect this profile!
  customizePhoneMockup(profile.title, normalizedScore);
}

/* ==========================================================================
   5. PHONE MOCKUP CUSTOMIZATION & INTERACTIVITY
   ========================================================================== */
/* ==========================================================================
   FEED DIÁRIO GERADO PELO ROBÔ (noticias-diarias.json)
   Se o arquivo existir e puder ser buscado, ele substitui os textos fixos
   abaixo pela notícia real do dia, já calibrada por perfil. Se não existir
   (por exemplo, ao abrir o preview.html direto do computador, sem servidor),
   o site simplesmente continua usando os textos fixos - nada quebra.
   ========================================================================== */
let DAILY_NEWS_FEED = null;

async function loadDailyNewsFeed() {
  try {
    const response = await fetch('noticias-diarias.json', { cache: 'no-store' });
    if (!response.ok) return;
    DAILY_NEWS_FEED = await response.json();
  } catch (err) {
    // Sem servidor ou sem arquivo publicado ainda: segue com o texto fixo.
    DAILY_NEWS_FEED = null;
  }
}

function customizePhoneMockup(profileTitle, score) {
  const badgeEl = document.getElementById('mockup-profile-badge');
  const headlineEl = document.getElementById('mockup-headline-title');
  const leadEl = document.getElementById('mockup-headline-lead');

  if (badgeEl) {
    badgeEl.textContent = `Você vê isso porque seu perfil é ${profileTitle}`;
  }

  const lado = score >= 15 ? 'direita' : (score <= -15 ? 'esquerda' : 'centro');
  const primeiraNoticia = DAILY_NEWS_FEED?.noticias?.[0];
  const noticiaDoDia = primeiraNoticia && primeiraNoticia[lado];

  if (noticiaDoDia) {
    // Notícia real do dia, gerada pelo robô e calibrada para este perfil
    headlineEl.textContent = noticiaDoDia.manchete;
    leadEl.textContent = noticiaDoDia.resumo;
  } else if (score < 0) {
    // Left-leaning priority framing (texto fixo de exemplo)
    headlineEl.textContent = "Congresso avança em projeto que revisa isenções fiscais de grandes grupos econômicos.";
    leadEl.textContent = "Proposta prioriza a redistribuição tributária e a blindagem de recursos para o piso da enfermagem e a educação básica.";
  } else {
    // Right-leaning priority framing (texto fixo de exemplo)
    headlineEl.textContent = "Comissão aprova corte de gastos administrativos e trava criação de novas secretarias.";
    leadEl.textContent = "Medida atende apelo de setores produtivos por alívio fiscal e responsabilidade orçamentária estrita em Brasília.";
  }

  // Swap the mockup thumbnail image based on political leaning
  const thumbImg = document.getElementById('mockup-news-thumb-img');
  if (thumbImg) {
    if (score >= 15) {
      thumbImg.src = 'assets/images/candidatos/flavio-bolsonaro.png';
    } else if (score <= -15) {
      thumbImg.src = 'assets/images/candidatos/lula.png';
    } else {
      thumbImg.src = 'assets/images/hero-eleicoes.png';
    }
  }
}

function initPhoneMockupInteractivity() {
  // 1. "Dois Lados" Tab Switching
  const tabLeft = document.getElementById('tab-side-left');
  const tabRight = document.getElementById('tab-side-right');
  const sideContent = document.getElementById('side-content-display');

  if (tabLeft && tabRight && sideContent) {
    tabLeft.addEventListener('click', () => {
      tabLeft.classList.add('active', 'tab-left');
      tabRight.classList.remove('active', 'tab-right');
      sideContent.className = 'side-content-box left-border';
      sideContent.innerHTML = `<strong>Sob a ótica de Esquerda:</strong> A proposta é vista como uma vitória da justiça fiscal, impedindo privilégios corporativos e garantindo que o Orçamento contemple quem mais precisa.`;
    });

    tabRight.addEventListener('click', () => {
      tabRight.classList.add('active', 'tab-right');
      tabLeft.classList.remove('active', 'tab-left');
      sideContent.className = 'side-content-box right-border';
      sideContent.innerHTML = `<strong>Sob a ótica de Direita:</strong> Analistas alertam para o risco de aumento indireto de custos para o consumidor final e defendem que a solução real é cortar a gastança do Estado.`;
    });
  }

  // 2. Audio Summary Player (60-second briefing simulation)
  const playBtn = document.getElementById('mockup-audio-play-btn');
  const audioFill = document.getElementById('mockup-audio-fill');
  const audioTimer = document.getElementById('mockup-audio-timer');
  let isPlaying = false;
  let audioInterval = null;
  let currentSec = 24;

  if (playBtn && audioFill && audioTimer) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;

      if (isPlaying) {
        playBtn.innerHTML = `❚❚`;
        audioInterval = setInterval(() => {
          currentSec++;
          if (currentSec > 60) currentSec = 0;
          const pct = Math.round((currentSec / 60) * 100);
          audioFill.style.width = `${pct}%`;
          audioTimer.textContent = `0:${String(currentSec).padStart(2, '0')} / 1:00`;
        }, 1000);
      } else {
        playBtn.innerHTML = `▶`;
        clearInterval(audioInterval);
      }
    });
  }

  // 3. "Modo Sem Viés" Toggle
  const unbiasedBtn = document.getElementById('btn-unbiased-mode');
  const headlineTitle = document.getElementById('mockup-headline-title');
  const headlineLead = document.getElementById('mockup-headline-lead');
  const badgeEl = document.getElementById('mockup-profile-badge');

  let isUnbiased = false;
  if (unbiasedBtn && headlineTitle) {
    unbiasedBtn.addEventListener('click', () => {
      isUnbiased = !isUnbiased;
      unbiasedBtn.classList.toggle('active', isUnbiased);

      if (isUnbiased) {
        badgeEl.textContent = "MODO SEM VIÉS ATIVADO (FATOS BRUTOS)";
        badgeEl.style.backgroundColor = "#475569";
        headlineTitle.textContent = "Câmara dos Deputados conclui votação do PL 2.340 com 318 votos a 142.";
        headlineLead.textContent = "Texto segue para sanção presidencial. Sessão durou 4 horas e 15 minutos; confira a íntegra nominal dos votos registrados no painel eletrônico.";
      } else {
        badgeEl.style.backgroundColor = "#0f172a";
        const savedProfile = window.currentUserProfile || "Leitor Político";
        customizePhoneMockup(savedProfile, window.currentUserScore || 0);
      }
    });
  }

  // 4. "Onde Votou Meu Parlamentar" Search Simulator
  const searchInput = document.getElementById('parlamentar-search-input');
  const searchBtn = document.getElementById('parlamentar-search-btn');
  const searchResult = document.getElementById('parlamentar-search-result');

  if (searchBtn && searchInput && searchResult) {
    searchBtn.addEventListener('click', () => {
      const term = searchInput.value.trim().toUpperCase();
      if (!term) {
        searchResult.style.display = 'block';
        searchResult.textContent = "Por favor, digite uma sigla de Estado (ex: SP, RJ, MG) ou o nome de um parlamentar.";
        return;
      }

      searchResult.style.display = 'block';
      searchResult.innerHTML = `
        <strong>Bancada de ${term}:</strong> 74% dos deputados votaram FAVORÁVEIS à matéria orçamentária; 26% votaram CONTRA. Nenhum voto de abstenção registrado.
      `;
    });
  }
}

/* ==========================================================================
   6. LEAD CAPTURE FORM SUBMISSION
   ========================================================================== */
function initLeadForm() {
  const form = document.getElementById('lead-capture-form');
  const captureSection = document.getElementById('capture-section');

  if (!form || !captureSection) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('lead-name').value.trim();
    const email = document.getElementById('lead-email').value.trim();
    const score = window.currentUserScore ?? localStorage.getItem('boletim_quiz_score') ?? 0;
    const profile = window.currentUserProfile ?? localStorage.getItem('boletim_quiz_profile') ?? 'Leitor Político';

    if (!name || !email) return;

    // Save lead in local storage
    const leadData = {
      name,
      email,
      score,
      profile,
      registeredAt: new Date().toISOString()
    };

    localStorage.setItem('boletim_user_lead', JSON.stringify(leadData));

    // Meta Pixel: evento de Lead, disparado ao completar o cadastro do quiz
    if (typeof fbq === 'function') {
      fbq('track', 'Lead');
    }

    // Mostra estado de carregamento no botão enquanto o e-mail é enviado de verdade
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitBtnOriginalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Falha no envio do e-mail');
        renderLeadSuccess(captureSection, name, email, profile, true);
      })
      .catch((err) => {
        console.error('[lead-form] Não foi possível enviar o e-mail:', err);
        // Mesmo se o envio falhar, o cadastro já foi salvo localmente;
        // avisamos o leitor com uma mensagem levemente diferente.
        renderLeadSuccess(captureSection, name, email, profile, false);
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtnOriginalText;
        }
      });
  });
}

function renderLeadSuccess(captureSection, name, email, profile, emailEnviado) {
    // Render Success Confirmation Screen
    captureSection.innerHTML = `
      <div class="success-card">
        <div class="success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 class="success-title">Acesso Pré-Reservado com Sucesso!</h3>
        <p class="success-desc">
          Olá, <strong>${name}</strong>. Seu perfil <strong>${profile}</strong> foi registrado com prioridade.
          ${emailEnviado
            ? `Enviamos para <strong>${email}</strong> o link de acesso exclusivo à edição de lançamento do <strong>Boletim PoliticaBR</strong>.`
            : `Seu cadastro foi salvo com <strong>${email}</strong>, mas tivemos uma instabilidade ao enviar o e-mail agora — nossa equipe vai reenviar em breve.`
          }
        </p>
        <div style="background: var(--bg-subtle); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 0.85rem; color: var(--text-muted); margin-bottom: 24px;">
          🔒 Seus dados estão seguros e protegidos pela LGPD. Não enviamos spam nem compartilhamos suas respostas.
        </div>
        <a href="${KIWIFY_CHECKOUT_URL}" class="btn-primary" onclick="if (typeof fbq === 'function') { fbq('track', 'InitiateCheckout'); }" style="display:inline-block;text-decoration:none;font-size: 1rem; padding: 14px 28px; margin-bottom: 12px;">
          Quero a assinatura completa
        </a>
        <br>
        <button class="btn-primary" onclick="window.location.reload();" style="font-size: 0.85rem; padding: 10px 20px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted); box-shadow: none;">
          Fazer o Quiz Novamente
        </button>
      </div>
    `;

    captureSection.scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   7. URNA ELETRÔNICA SIMULATOR (VOTAÇÃO 2026 COM ÁUDIO DO TSE E CONTABILIZAÇÃO)
   ========================================================================== */
function initUrnaSimulator() {
  const URNA_CANDIDATES = {
    '13': { name: 'LUIZ INÁCIO LULA DA SILVA', party: 'PT', vice: 'A Definir', photo: 'assets/images/candidatos/lula.png', color: '#ef4444' },
    '22': { name: 'FLÁVIO BOLSONARO', party: 'PL', vice: 'A Definir', photo: 'assets/images/candidatos/flavio-bolsonaro.png', color: '#1d4ed8' },
    '55': { name: 'RONALDO CAIADO', party: 'UNIÃO BRASIL', vice: 'A Definir', photo: 'assets/images/candidatos/ronaldo-caiado.png', color: '#2563eb' },
    '30': { name: 'ROMEU ZEMA', party: 'NOVO', vice: 'A Definir', photo: 'assets/images/candidatos/romeu-zema.png', color: '#f97316' },
    '70': { name: 'AUGUSTO CURY', party: 'AVANTE', vice: 'Júlio Delgado', photo: 'assets/images/candidatos/augusto-cury.png', color: '#dc2626' },
    '14': { name: 'RENAN SANTOS', party: 'MISSÃO', vice: 'Aroldo Medina', photo: 'assets/images/candidatos/renan-santos.png', color: '#0d9488' },
    '00': { name: 'VOTO NULO', party: 'VOTO NULO', vice: 'Nenhum', avatar: '❌', color: '#64748b' },
    'branco': { name: 'VOTO EM BRANCO', party: 'VOTO EM BRANCO', vice: 'Nenhum', avatar: '⚪', color: '#94a3b8' }
  };

  let currentDigits = '';
  let isBranco = false;
  let isVotingFinished = false;

  // DOM Elements
  const digit1 = document.getElementById('digit-1');
  const digit2 = document.getElementById('digit-2');
  const candName = document.getElementById('urna-cand-name');
  const candParty = document.getElementById('urna-cand-party');
  const candVice = document.getElementById('urna-cand-vice');
  const photoAvatar = document.getElementById('urna-photo-avatar');
  const votingView = document.getElementById('urna-voting-view');
  const fimView = document.getElementById('urna-fim-view');
  const resultsContainer = document.getElementById('urna-live-results');
  const resultsBars = document.getElementById('urna-results-bars');

  if (!digit1 || !digit2) return;

  // Web Audio API Beep Generators
  function playKeyBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  function playTseConfirmTone() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, start, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = audioCtx.currentTime;
      playTone(1050, now, 0.06);
      playTone(1050, now + 0.09, 0.06);
      playTone(1050, now + 0.18, 0.06);
      playTone(1750, now + 0.27, 0.45);
    } catch (e) {}
  }

  // Renders either a real candidate photo or an emoji placeholder inside the photo box
  function renderCandidatePhoto(data) {
    if (data.photo) {
      photoAvatar.innerHTML = `<img src="${data.photo}" alt="Foto de ${data.name}" class="urna-photo-img">`;
    } else {
      photoAvatar.innerHTML = '';
      photoAvatar.textContent = data.avatar || '❓';
    }
  }

  // Update Urna Monitor UI
  function updateUrnaScreen() {
    if (isBranco) {
      digit1.textContent = '';
      digit2.textContent = '';
      digit1.classList.remove('active-cursor');
      digit2.classList.remove('active-cursor');

      const data = URNA_CANDIDATES['branco'];
      candName.textContent = data.name;
      candParty.textContent = data.party;
      candVice.textContent = data.vice;
      renderCandidatePhoto(data);
      return;
    }

    const d1 = currentDigits[0] || '';
    const d2 = currentDigits[1] || '';

    digit1.textContent = d1;
    digit2.textContent = d2;

    if (!d1) {
      digit1.classList.add('active-cursor');
      digit2.classList.remove('active-cursor');
    } else if (!d2) {
      digit1.classList.remove('active-cursor');
      digit2.classList.add('active-cursor');
    } else {
      digit1.classList.remove('active-cursor');
      digit2.classList.remove('active-cursor');
    }

    if (currentDigits.length === 2) {
      const candidate = URNA_CANDIDATES[currentDigits] || {
        name: 'NÚMERO ERRADO (VOTO NULO)',
        party: 'NENHUM',
        vice: '--',
        avatar: '❓',
        color: '#64748b'
      };

      candName.textContent = candidate.name;
      candParty.textContent = candidate.party;
      candVice.textContent = candidate.vice;
      renderCandidatePhoto(candidate);
    } else {
      candName.textContent = '--';
      candParty.textContent = '--';
      candVice.textContent = '--';
      renderCandidatePhoto({ avatar: '👤' });
    }
  }

  // Handle number input
  function handleInputKey(key) {
    if (isVotingFinished || isBranco) return;
    if (currentDigits.length < 2) {
      playKeyBeep();
      currentDigits += key;
      updateUrnaScreen();
    }
  }

  // Handle BRANCO
  function handleBranco() {
    if (isVotingFinished) return;
    playKeyBeep();
    currentDigits = '';
    isBranco = true;
    updateUrnaScreen();
  }

  // Handle CORRIGE
  function handleCorrige() {
    if (isVotingFinished) return;
    playKeyBeep();
    currentDigits = '';
    isBranco = false;
    updateUrnaScreen();
  }

  // Handle CONFIRMA
  function handleConfirma() {
    if (isVotingFinished) return;

    // Must have 2 digits or be branco
    if (currentDigits.length === 2 || isBranco) {
      playTseConfirmTone();
      isVotingFinished = true;

      // Identify selected candidate or nulo/branco
      let voteKey = isBranco ? 'branco' : (URNA_CANDIDATES[currentDigits] ? currentDigits : '00');

      // Record vote in tally
      recordVote(voteKey);

      // Show FIM screen
      votingView.style.display = 'none';
      fimView.style.display = 'flex';

      // Mostra só a confirmação (sem números) - o resultado de verdade
      // fica reservado pro final da página, depois da prévia e do cadastro
      setTimeout(() => {
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        renderResultadoFinal();
      }, 1200);
    }
  }

  // Record vote - envia para o backend (contagem real, de todos os visitantes)
  // e usa uma marca local só para impedir múltiplos votos do MESMO navegador.
  async function recordVote(key) {
    const jaVotou = localStorage.getItem('boletim_ja_votou_urna');
    if (jaVotou) return; // já contabilizado antes neste navegador
    try {
      await fetch('/api/registrar-voto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: key }),
      });
      localStorage.setItem('boletim_ja_votou_urna', key);
    } catch (err) {
      console.error('[urna] Não foi possível registrar o voto:', err);
    }
  }

  // Resultado final da urna (seção lá embaixo, depois da prévia e do cadastro)
  // - Só mostra o resultado de verdade pra quem já votou (mesmo em outra sessão)
  // - Quem ainda não votou vê uma mensagem pedindo pra votar primeiro
  async function renderResultadoFinal() {
    const bloqueadoMsg = document.getElementById('resultado-final-bloqueado');
    const jaVotou = localStorage.getItem('boletim_ja_votou_urna');

    if (!jaVotou) {
      if (bloqueadoMsg) bloqueadoMsg.style.display = 'block';
      resultsBars.innerHTML = '';
      return;
    }
    if (bloqueadoMsg) bloqueadoMsg.style.display = 'none';

    let tally = {};
    try {
      const resp = await fetch('/api/resultado-urna', { cache: 'no-store' });
      const data = await resp.json();
      tally = data.tally || {};
    } catch (err) {
      console.error('[urna] Não foi possível carregar o resultado:', err);
    }

    const total = Object.values(tally).reduce((acc, curr) => acc + curr, 0) || 1;
    const sortedKeys = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);

    resultsBars.innerHTML = '';

    if (sortedKeys.length === 0) {
      resultsBars.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Ainda não há votos suficientes para exibir o resultado.</p>';
      return;
    }

    sortedKeys.forEach(k => {
      const count = tally[k];
      const pct = ((count / total) * 100).toFixed(1);
      const cand = URNA_CANDIDATES[k] || { name: `Opção ${k}`, color: '#94a3b8' };

      const row = document.createElement('div');
      row.className = 'result-bar-row';
      row.innerHTML = `
        <div class="result-bar-labels">
          <span>${cand.avatar || '🗳️'} <strong>${cand.name}</strong> (${cand.party || ''})</span>
          <span>${pct}%</span>
        </div>
        <div class="result-bar-track">
          <div class="result-bar-fill" style="width: 0%; background: ${cand.color || '#ffbf00'};"></div>
        </div>
      `;

      resultsBars.appendChild(row);

      // Animate bar fill
      setTimeout(() => {
        const fill = row.querySelector('.result-bar-fill');
        if (fill) fill.style.width = `${pct}%`;
      }, 50);
    });
  }

  // Keypad Click Handlers
  document.querySelectorAll('.urna-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      if (key !== null) handleInputKey(key);
    });
  });

  document.getElementById('btn-urna-branco')?.addEventListener('click', handleBranco);
  document.getElementById('btn-urna-corrige')?.addEventListener('click', handleCorrige);
  document.getElementById('btn-urna-confirma')?.addEventListener('click', handleConfirma);

  // Botão pós-voto: leva pra prévia do app (o resultado em % fica só no final da página)
  document.getElementById('btn-ver-preview-apos-voto')?.addEventListener('click', () => {
    document.getElementById('mockup-showcase').scrollIntoView({ behavior: 'smooth' });
  });

  // Initial screen setup
  updateUrnaScreen();

  // Checa de cara se a pessoa já votou em uma visita anterior, pra já
  // deixar o resultado final (lá embaixo) correto desde o carregamento
  renderResultadoFinal();
}
