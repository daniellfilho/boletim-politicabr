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
const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/1FQ2xY0';

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
   2. QUIZ DATASET (16 BALANCED & NEUTRAL QUESTIONS + 3 TRANSITIONS)
   ========================================================================== */
/* ==========================================================================
   ÍCONES TEMÁTICOS DO QUIZ (SVG originais, estilo line-icon, um por pergunta)
   ========================================================================== */
const QUESTION_ICONS = {
  1: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 40h36"/><rect x="11" y="24" width="6" height="12"/><rect x="21" y="16" width="6" height="20"/><rect x="31" y="9" width="6" height="27"/></svg>`,
  2: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 6h22v36l-4-3-4 3-4-3-4 3-4-3-2 3z"/><path d="M18 17h12M18 24h12M18 31h6"/></svg>`,
  3: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 40s-14-8.5-14-18.5C10 16 13.5 12 18 12c3 0 5 1.5 6 3.5C25 13.5 27 12 30 12c4.5 0 8 4 8 9.5C38 31.5 24 40 24 40z"/><path d="M18 22l3.5 3.5L27 20"/></svg>`,
  4: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 5l15 5v10c0 12-8 19-15 23-7-4-15-11-15-23V10z"/><path d="M18 24l4.5 4.5L31 19"/></svg>`,
  5: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 42V22"/><path d="M24 22c0-9 7-16 16-16 0 9-7 16-16 16z"/><path d="M24 28c0-7-5.5-13-13-13 0 7 5.5 13 13 13z"/></svg>`,
  6: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v6M24 12l-10 8M24 12l10 8M6 20h16M26 20h16"/><path d="M6 20c0 4 3.5 7 7 7s7-3 7-7M26 20c0 4 3.5 7 7 7s7-3 7-7"/><path d="M24 36h-1M24 36V20M17 42h14"/></svg>`,
  7: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20l24-12v32L6 28z"/><path d="M6 20v8h5l3 10h4l-2-10"/><path d="M35 16c2.5 2 4 5 4 8s-1.5 6-4 8"/></svg>`,
  8: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c4.5 4.7 7 11 7 17s-2.5 12.3-7 17c-4.5-4.7-7-11-7-17s2.5-12.3 7-17z"/></svg>`,
  9: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v4M24 38v4M12 12l16 6 16-6M12 12l-4 12 4 4 4-4-4-12M44 12l-4 12 4 4 4-4-4-12M24 10v28M14 40h20"/></svg>`,
  10: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 42V18l10-6v30M16 42V24l10-6v24M26 42V14l16-6v34"/><path d="M6 42h36"/></svg>`,
  11: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 12c-4-3-11-4-16-2v26c5-2 12-1 16 2 4-3 11-4 16-2V10c-5-2-12-1-16 2z"/><path d="M24 12v28"/></svg>`,
  12: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 5l15 5v10c0 12-8 19-15 23-7-4-15-11-15-23V10z"/><path d="M17 24h5l2.5-6 3 12 2.5-6h6"/></svg>`,
  13: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="2"/><path d="M24 2v6M24 40v6M2 24h6M40 24h6"/></svg>`,
  14: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="18" cy="34" rx="12" ry="5"/><ellipse cx="18" cy="27" rx="12" ry="5"/><ellipse cx="18" cy="20" rx="12" ry="5"/><path d="M30 20v14M6 20v14"/><path d="M34 14l4-4 4 4M38 10v16"/></svg>`,
  15: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18h32M24 6L8 18h32z"/><path d="M12 18v16M20 18v16M28 18v16M36 18v16"/><path d="M8 40h32"/></svg>`,
  16: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 16h30l-3 22H12z"/><path d="M9 16l3-8h24l3 8"/><circle cx="24" cy="27" r="4.5"/></svg>`
};

const QUIZ_QUESTIONS = [
  {
    id: 1,
    category: "Economia e Estado",
    question: "Qual deve ser o papel principal do Estado no desenvolvimento da economia nacional?",
    options: [
      { text: "O Estado deve planejar, investir estrategicamente em setores-chave e controlar empresas estatais essenciais.", score: -2.0 },
      { text: "O Estado deve regular ativamente os mercados e intervir para corrigir desigualdades sociais e regionais.", score: -0.7 },
      { text: "O Estado deve focar em desburocratização, segurança jurídica e atração de investimentos privados.", score: 0.7 },
      { text: "O Estado deve ter presença mínima na economia, priorizando privatizações amplas e livre mercado irrestrito.", score: 2.0 }
    ]
  },
  {
    id: 2,
    category: "Carga Tributária",
    question: "Em relação ao sistema de impostos do Brasil, qual diretriz você considera mais adequada?",
    options: [
      { text: "Impostos fortemente progressivos, tributando mais quem ganha mais para financiar serviços públicos universais.", score: -2.0 },
      { text: "Simplificação tributária combinada com alíquotas moderadas que preservem a rede de seguridade social.", score: -0.7 },
      { text: "Redução do peso dos impostos sobre empresas e produção para incentivar a geração de empregos.", score: 0.7 },
      { text: "Corte drástico e imediato de tributos em todos os níveis, acompanhado de rígido corte de despesas estatais.", score: 2.0 }
    ]
  },
  {
    id: 3,
    category: "Programas Sociais",
    question: "Como você avalia os programas federais de transferência de renda (como o Bolsa Família)?",
    options: [
      { text: "São direitos fundamentais e indispensáveis que devem ser permanentemente expandidos como renda básica da cidadania.", score: -2.0 },
      { text: "São medidas essenciais de combate à miséria, mas precisam ser aprimoradas com qualificação e foco em crianças.", score: -0.7 },
      { text: "São necessários como alívio temporário, mas devem ter exigências rígidas de contrapartida e portas de saída rápidas.", score: 0.7 },
      { text: "Criam dependência crônica do Estado e devem ser gradualmente substituídos por incentivos diretos ao trabalho privado.", score: 2.0 }
    ]
  },
  {
    id: 4,
    category: "Segurança Pública",
    question: "Qual deve ser a principal prioridade do país para a redução dos índices de criminalidade?",
    options: [
      { text: "Enfrentar as raízes sociais da violência: desemprego, evasão escolar e promover a desmilitarização policial.", score: -2.0 },
      { text: "Modernizar a inteligência policial, combater o crime organizado e aprimorar o sistema de ressocialização prisional.", score: -0.7 },
      { text: "Endurecer a legislação penal, reduzir a maioridade para crimes graves e apoiar o trabalho das forças de segurança.", score: 0.7 },
      { text: "Tolerância zero irrestrita, cumprimento rigoroso de penas sem benefícios e garantia do direito civil à legítima defesa.", score: 2.0 }
    ]
  },
  // TRANSITION 1 OCCURS HERE (AFTER Q4)
  {
    id: 5,
    category: "Meio Ambiente & Agro",
    question: "Como equilibrar a preservação ambiental com o crescimento do agronegócio e obras de infraestrutura?",
    options: [
      { text: "A preservação de biomas e demarcação de terras indígenas devem prevalecer sobre qualquer expansão da fronteira agrícola.", score: -2.0 },
      { text: "Promover incentivos econômicos a produtores sustentáveis, aliando rigor na fiscalização a transição ecológica.", score: -0.7 },
      { text: "Desburocratizar o licenciamento ambiental e valorizar o agronegócio moderno, que já é o motor de exportação do país.", score: 0.7 },
      { text: "Eliminar entraves de órgãos ambientais que travam o desenvolvimento produtivo, mineração e geração de energia.", score: 2.0 }
    ]
  },
  {
    id: 6,
    category: "Valores e Legislação",
    question: "Em debates legislativos sobre costumes e valores morais, qual deve ser a postura das leis?",
    options: [
      { text: "As leis devem garantir a plena autonomia individual, diversidade e descriminalização de pautas comportamentais.", score: -2.0 },
      { text: "O Estado deve ser estritamente laico, protegendo minorias sem desconsiderar consensos democráticos vigentes.", score: -0.7 },
      { text: "A legislação deve preservar a instituição familiar tradicional e os valores culturais majoritários da sociedade.", score: 0.7 },
      { text: "Defesa intransigente dos valores cristãos e morais tradicionais como pilares invioláveis da ordem jurídica.", score: 2.0 }
    ]
  },
  {
    id: 7,
    category: "Liberdade de Expressão",
    question: "Qual o limite adequado para a regulação de conteúdo e combate à desinformação nas redes sociais?",
    options: [
      { text: "Regulação rigorosa com responsabilização civil e criminal imediata de plataformas sobre desinformação e discursos de ódio.", score: -2.0 },
      { text: "Criação de diretrizes transparentes com participação da sociedade civil, garantindo o direito à ampla defesa.", score: -0.7 },
      { text: "A moderação deve ser feita pelas próprias plataformas sem controle estatal prévio, coibindo apenas crimes tipificados em lei.", score: 0.7 },
      { text: "Liberdade de expressão total e irrestrita; qualquer intervenção estatal ou judicial prévia configura censura inaceitável.", score: 2.0 }
    ]
  },
  {
    id: 8,
    category: "Política Externa",
    question: "Qual deve ser a diretriz central da diplomacia brasileira no cenário internacional?",
    options: [
      { text: "Priorizar a cooperação Sul-Sul, fortalecimento dos BRICS e contraponto à hegemonia das potências ocidentais.", score: -2.0 },
      { text: "Diplomacia multilateral pragmática, liderando pautas globais como combate à fome e transição climática.", score: -0.7 },
      { text: "Alinhamento prioritário a grandes democracias de mercado ocidentais (como EUA e Europa) e acordos de livre-comércio.", score: 0.7 },
      { text: "Defesa firme da soberania nacional, com pragmatismo comercial estrito e repúdio a interferências de fóruns globalistas.", score: 2.0 }
    ]
  },
  // TRANSITION 2 OCCURS HERE (AFTER Q8)
  {
    id: 9,
    category: "Responsabilidade Fiscal",
    question: "Em momentos de déficit nas contas públicas, qual medida deve ser priorizada pelo governo?",
    options: [
      { text: "Aumentar receitas taxando o capital improdutivo e os lucros bancários, mantendo os investimentos sociais e públicos.", score: -2.0 },
      { text: "Adotar metas fiscais equilibradas que preservem investimentos cruciais, combinando contenção e estímulo moderado.", score: -0.7 },
      { text: "Cumprir rigorosamente o teto de gastos e reformar a máquina pública para reduzir despesas correntes do Executivo.", score: 0.7 },
      { text: "Congelar gastos imediatamente, extinguir ministérios e cortar subsídios para reequilibrar as contas sem novos impostos.", score: 2.0 }
    ]
  },
  {
    id: 10,
    category: "Privatizações e Estatais",
    question: "O que o Brasil deve fazer com suas empresas estatais (Petrobras, bancos públicos, Correios)?",
    options: [
      { text: "Manter sob controle estatal pleno para garantir preços acessíveis à população e soberania energética/financeira.", score: -2.0 },
      { text: "Manter o controle público das estratégicas com governança profissionalizada e transparência contra indicações políticas.", score: -0.7 },
      { text: "Privatizar a maioria das empresas e abrir os setores regulados à competição para atrair investimentos privados.", score: 0.7 },
      { text: "Privatizar todas as estatais sem exceção, encerrando privilégios e o uso do patrimônio público por grupos de interesse.", score: 2.0 }
    ]
  },
  {
    id: 11,
    category: "Educação Pública",
    question: "Qual modelo pedagógico e de gestão deve ser priorizado nas escolas públicas de educação básica?",
    options: [
      { text: "Educação plural, inclusiva e crítica, com ênfase em direitos humanos, combate a preconceitos e valorização docente.", score: -2.0 },
      { text: "Foco na alfabetização na idade certa e ensino em tempo integral, com infraestrutura moderna e avaliação contínua.", score: -0.7 },
      { text: "Ensino focado em competências práticas de mercado, matemática e ciências, com estímulo a modelos cívico-militares.", score: 0.7 },
      { text: "Ênfase em disciplina rigorosa, currículo neutro sem interferência ideológica e liberdade para ensino domiciliar (homeschooling).", score: 2.0 }
    ]
  },
  {
    id: 12,
    category: "Liberdade Individual em Crises",
    question: "Durante emergências públicas ou sanitárias, como balancear imposições do Estado e escolhas individuais?",
    options: [
      { text: "O bem coletivo e as determinações científicas oficiais devem prevalecer de forma obrigatória sobre liberdades individuais.", score: -2.0 },
      { text: "O Estado deve liderar com campanhas educativas transparentes e medidas protetivas sem cercear direitos fundamentais.", score: -0.7 },
      { text: "As decisões devem priorizar o funcionamento da economia e a manutenção do sustento das famílias e trabalhadores.", score: 0.7 },
      { text: "A liberdade individual e a autonomia sobre o próprio corpo são invioláveis; o Estado nunca pode impor restrições ou vacinas.", score: 2.0 }
    ]
  },
  // TRANSITION 3 OCCURS HERE (AFTER Q12)
  {
    id: 13,
    category: "Armas de Fogo",
    question: "Qual deve ser a política brasileira em relação à posse e porte de armas de fogo para cidadãos comuns?",
    options: [
      { text: "Desarmamento rigoroso; a circulação de armas aumenta a violência urbana e deve ser fortemente restringida.", score: -2.0 },
      { text: "Controle estatal rígido com exigência de critérios psicológicos e técnicos sérios para casos excepcionais justificados.", score: -0.7 },
      { text: "Facilitação da posse responsável em residências e propriedades rurais para proteção da família e do patrimônio.", score: 0.7 },
      { text: "O porte de armas é um direito natural de autodefesa que deve ser garantido a qualquer cidadão idôneo sem burocracia.", score: 2.0 }
    ]
  },
  {
    id: 14,
    category: "Tributação sobre Renda e Riqueza",
    question: "O que pensa sobre a criação de impostos sobre grandes fortunas e taxação de dividendos empresariais?",
    options: [
      { text: "Medida urgente de justiça distributiva para combater a histórica concentração de renda no país.", score: -2.0 },
      { text: "Válida se acompanhada da redução da tributação sobre o consumo de alimentos e medicamentos para a classe média.", score: -0.7 },
      { text: "Arriscada, pois pode provocar fuga de capitais, desinvestimento e desestímulo à criação de novas empresas.", score: 0.7 },
      { text: "Inadmissível; penaliza quem produziu e gera riqueza, além de ser confiscatória e ineficiente na arrecadação real.", score: 2.0 }
    ]
  },
  {
    id: 15,
    category: "Prerrogativas Políticas",
    question: "Qual deve ser o futuro do foro especial por prerrogativa de função (foro privilegiado) para políticos?",
    options: [
      { text: "Manter nos termos estritos da Constituição para evitar perseguições políticas locais contra mandatos legítimos.", score: -2.0 },
      { text: "Restringir o foro exclusivamente a atos cometidos no exercício do mandato e relacionados com a função pública.", score: -0.7 },
      { text: "Extinguir o foro privilegiado para a esmagadora maioria dos cargos, submetendo todos à primeira instância judicial.", score: 0.7 },
      { text: "Fim absoluto e imediato de qualquer foro especial ou imunidade; perante a lei todos os cidadãos devem ser idênticos.", score: 2.0 }
    ]
  },
  {
    id: 16,
    category: "Financiamento de Campanhas",
    question: "Como as campanhas eleitorais e os partidos políticos devem ser financiados no Brasil?",
    options: [
      { text: "Financiamento 100% público com distribuição equitativa para evitar a influência do poder econômico privado nas urnas.", score: -2.0 },
      { text: "Financiamento público com teto rigoroso de despesas e critérios severos de transparência e auditoria das contas.", score: -0.7 },
      { text: "Modelo misto com redução expressiva do Fundo Eleitoral público e permissão para doações de pessoas físicas e jurídicas.", score: 0.7 },
      { text: "Fim total do Fundo Eleitoral público (Fundão); os partidos devem ser mantidos exclusivamente por seus próprios filiados.", score: 2.0 }
    ]
  }
];

/* 3 Transition Curiosities (Inserted after Q4, Q8, Q12) */
const TRANSITIONS = {
  4: {
    tag: "DADO NEUTRO SOBRE O BRASIL",
    title: "156 Milhões de Eleitores em Ação",
    body: "O Brasil possui o quarto maior colégio eleitoral do planeta e é um dos raros países a realizar apurações 100% informatizadas em menos de 3 horas após o encerramento das seções. Seu voto é um dos mais céleres do mundo contemporâneo."
  },
  8: {
    tag: "FATOS DA DEMOCRACIA",
    title: "A Constituição Cidadã de 1988",
    body: "Promulgada após o período militar, a Constituição Brasileira de 1988 já recebeu mais de 130 emendas constitucionais. Trata-se de uma das Cartas mais detalhadas do mundo, equilibrando garantias sociais e limites ao poder do Estado."
  },
  12: {
    tag: "BASTIDORES DO CONGRESSO",
    title: "A Complexidade das PECs",
    body: "Para que uma Proposta de Emenda à Constituição seja aprovada, são necessários 3/5 dos votos tanto na Câmara dos Deputados (308 de 513) quanto no Senado (49 de 81), em dois turnos de votação em cada casa. Nenhum governo governa sozinho."
  }
};

/* ==========================================================================
   3. QUIZ ENGINE CONTROLLER
   ========================================================================== */
let currentQuestionIndex = 0;
let userAnswers = []; // array of score numbers

function initQuizApp() {
  // Screen elements
  const introView = document.getElementById('view-intro');
  const quizView = document.getElementById('view-quiz');
  const transitionView = document.getElementById('view-transition');
  const resultView = document.getElementById('view-result');
  const progressContainer = document.getElementById('quiz-progress-container');
  const startBtn = document.getElementById('btn-start-quiz');

  // Start Quiz Button
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      introView.classList.remove('active');
      quizView.classList.add('active');
      progressContainer.classList.add('active');
      currentQuestionIndex = 0;
      userAnswers = [];
      renderQuestion();
    });
  }

  // Setup transition continue button
  const continueTransitionBtn = document.getElementById('btn-continue-transition');
  if (continueTransitionBtn) {
    continueTransitionBtn.addEventListener('click', () => {
      transitionView.classList.remove('active');
      quizView.classList.add('active');
      progressContainer.classList.add('active');
      renderQuestion();
    });
  }

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

function renderQuestion() {
  const q = QUIZ_QUESTIONS[currentQuestionIndex];
  if (!q) return;

  // Update progress bar
  const totalQuestions = QUIZ_QUESTIONS.length;
  const currentStep = currentQuestionIndex + 1;
  const pct = Math.round((currentStep / totalQuestions) * 100);

  document.getElementById('progress-text').textContent = `Pergunta ${currentStep} de ${totalQuestions}`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill-bar').style.width = `${pct}%`;

  // Render text
  document.getElementById('question-category').textContent = q.category;
  document.getElementById('question-title').textContent = q.question;

  // Render themed icon for this question's subject
  const iconWrap = document.getElementById('question-icon-wrap');
  if (iconWrap) {
    iconWrap.innerHTML = QUESTION_ICONS[q.id] || '';
  }

  // Render options
  const optionsList = document.getElementById('options-container');
  optionsList.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="option-letter">${letters[idx]}</span>
      <span class="option-text">${opt.text}</span>
    `;

    btn.addEventListener('click', () => {
      // Highlight selection briefly
      btn.classList.add('selected');
      userAnswers.push(opt.score);

      // Disable all other buttons in this step
      const allBtns = optionsList.querySelectorAll('.option-btn');
      allBtns.forEach(b => b.style.pointerEvents = 'none');

      setTimeout(() => {
        handleNextStep();
      }, 250);
    });

    optionsList.appendChild(btn);
  });
}

function handleNextStep() {
  currentQuestionIndex++;

  // Check if we hit a transition checkpoint (after Q4, Q8, Q12)
  if (TRANSITIONS[currentQuestionIndex]) {
    showTransitionScreen(TRANSITIONS[currentQuestionIndex]);
    return;
  }

  // Check if finished
  if (currentQuestionIndex >= QUIZ_QUESTIONS.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showTransitionScreen(transitionData) {
  const quizView = document.getElementById('view-quiz');
  const transitionView = document.getElementById('view-transition');
  const progressContainer = document.getElementById('quiz-progress-container');

  quizView.classList.remove('active');
  progressContainer.classList.remove('active');
  transitionView.classList.add('active');

  document.getElementById('transition-tag').textContent = transitionData.tag;
  document.getElementById('transition-title').textContent = transitionData.title;
  document.getElementById('transition-body').textContent = transitionData.body;
}

/* ==========================================================================
   4. SCORE CALCULATION & RESULT MAPPING (-100 TO +100)
   ========================================================================== */
function showResults() {
  const quizView = document.getElementById('view-quiz');
  const resultView = document.getElementById('view-result');
  const progressContainer = document.getElementById('quiz-progress-container');

  quizView.classList.remove('active');
  progressContainer.classList.remove('active');
  resultView.classList.add('active');

  // Calculate score
  const totalWeight = userAnswers.reduce((acc, curr) => acc + curr, 0);
  const maxPossible = QUIZ_QUESTIONS.length * 2.0; // 16 * 2 = 32
  const normalizedScore = Math.round((totalWeight / maxPossible) * 100);

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
        <a href="${KIWIFY_CHECKOUT_URL}" class="btn-primary" style="display:inline-block;text-decoration:none;font-size: 1rem; padding: 14px 28px; margin-bottom: 12px;">
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
  const revoteBtn = document.getElementById('btn-revote');

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

      // Render and display Live Results after 1.2s
      setTimeout(() => {
        renderLiveResults();
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
      }, 1200);
    }
  }

  // Record vote in localStorage
  function recordVote(key) {
    let tally = JSON.parse(localStorage.getItem('boletim_urna_poll_tally')) || {
      '13': 1420,
      '22': 1380,
      '10': 640,
      '55': 280,
      '30': 210,
      '44': 190,
      '15': 175,
      '12': 160,
      'branco': 110,
      '00': 95
    };

    tally[key] = (tally[key] || 0) + 1;
    localStorage.setItem('boletim_urna_poll_tally', JSON.stringify(tally));
  }

  // Render Reader Poll Results
  function renderLiveResults() {
    const tally = JSON.parse(localStorage.getItem('boletim_urna_poll_tally')) || {};
    const total = Object.values(tally).reduce((acc, curr) => acc + curr, 0) || 1;

    // Sort by most voted
    const sortedKeys = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);

    resultsBars.innerHTML = '';

    sortedKeys.forEach(k => {
      const count = tally[k];
      const pct = ((count / total) * 100).toFixed(1);
      const cand = URNA_CANDIDATES[k] || { name: `Opção ${k}`, color: '#94a3b8' };

      const row = document.createElement('div');
      row.className = 'result-bar-row';
      row.innerHTML = `
        <div class="result-bar-labels">
          <span>${cand.avatar || '🗳️'} <strong>${cand.name}</strong> (${cand.party || ''})</span>
          <span>${pct}% (${count.toLocaleString('pt-BR')} votos)</span>
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

  // Re-vote Button Handler
  if (revoteBtn) {
    revoteBtn.addEventListener('click', () => {
      isVotingFinished = false;
      currentDigits = '';
      isBranco = false;
      fimView.style.display = 'none';
      votingView.style.display = 'flex';
      resultsContainer.style.display = 'none';
      updateUrnaScreen();
      document.getElementById('urna-showcase').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Initial screen setup
  updateUrnaScreen();
}
