import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
// Server-side proxy will handle AI requests. Do not use the SDK in the browser.

// --- Ícones (SVG como componentes React) ---
const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m0 0a8.485 8.485 0 0011.08-5.747H.92a8.485 8.485 0 0011.08 5.747z" />
  </svg>
);
const BeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a4 4 0 00-5.656 0l-2.829 2.829a4 4 0 01-5.656-5.656l2.829-2.829a4 4 0 005.656-5.656l-2.829-2.829a4 4 0 00-5.656 5.656l2.829 2.829" />
  </svg>
);
const SparklesIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a1.06 1.06 0 012.12 0 1.06 1.06 0 01-2.12 0zM16 5a1.06 1.06 0 012.12 0 1.06 1.06 0 01-2.12 0zM17 17a1.06 1.06 0 012.12 0 1.06 1.06 0 01-2.12 0zM12 1a1.06 1.06 0 012.12 0 1.06 1.06 0 01-2.12 0z" />
    </svg>
);


// --- Tipos de Dados ---
type User = {
  name: string;
  email: string;
  city: string;
  state: string;
  quizAnswers: Record<string, string>;
  isSubscribed: boolean;
  progress: {
    math: number;
    science: number;
  };
  stats: {
    math: { correct: number; total: number };
    science: { correct: number; total: number };
  };
  simulationHistory: {
      subject: 'Matemática' | 'Ciências';
      score: number;
      total: number;
      date: number;
  }[];
  password?: string; // Incluído para verificação
};

type Question = {
  question: string;
  options: string[];
  answer: string;
};

// Helper: embaralha um array (retorna cópia)
const shuffleArray = <T,>(arr: T[]): T[] => {
    return [...arr].sort(() => Math.random() - 0.5);
};

// --- Banco de Dados Simulado (localStorage) ---
const db = {
  saveUser: (email: string, userData: any) => {
    localStorage.setItem(`user_${email}`, JSON.stringify(userData));
  },
  getUser: (email: string): User | null => {
    const data = localStorage.getItem(`user_${email}`);
    return data ? JSON.parse(data) : null;
  },
  getAllUsers: (): User[] => {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_')) {
        const user = JSON.parse(localStorage.getItem(key)!);
        // Garante que o usuário tenha a estrutura correta antes de adicionar
        if (user && user.progress && user.stats) {
            users.push(user);
        }
      }
    }
    return users;
  }
};

// --- Banco de Questões Expandido ---
const mathQuestions: Question[] = [
  { question: "Qual o valor de 5! (fatorial)?", options: ["120", "25", "50", "100"], answer: "120" },
  { question: "Se um triângulo tem lados 3, 4 e 5, qual o seu tipo?", options: ["Retângulo", "Equilátero", "Isósceles", "Escaleno"], answer: "Retângulo" },
  { question: "Qual a raiz quadrada de 144?", options: ["12", "14", "16", "11"], answer: "12" },
  { question: "Resolva: 2x + 5 = 15", options: ["x = 5", "x = 10", "x = 2.5", "x = 7.5"], answer: "x = 5" },
  { question: "Quanto é 25% de 200?", options: ["50", "25", "100", "75"], answer: "50" },
  { question: "Qual o próximo número na sequência: 2, 4, 8, 16, ...?", options: ["32", "24", "64", "20"], answer: "32" },
  { question: "Um círculo com raio de 5cm tem qual área? (Use π=3.14)", options: ["78.5 cm²", "31.4 cm²", "15.7 cm²", "50 cm²"], answer: "78.5 cm²" },
  { question: "Qual o resultado de (3 + 4) * 2?", options: ["14", "11", "10", "24"], answer: "14" },
  { question: "Se um evento tem probabilidade de 0.25 de ocorrer, qual a probabilidade de ele não ocorrer?", options: ["0.75", "0.50", "1.00", "0.25"], answer: "0.75" },
  { question: "Em um hexágono regular, qual o valor de cada ângulo interno?", options: ["120°", "108°", "90°", "60°"], answer: "120°" },
  { question: "Qual o volume de um cubo com aresta de 4cm?", options: ["64 cm³", "16 cm³", "12 cm³", "48 cm³"], answer: "64 cm³" },
  { question: "Qual é o MDC (Máximo Divisor Comum) de 12 e 18?", options: ["6", "3", "2", "12"], answer: "6" },
  { question: "Converta 0.75 em uma fração irredutível.", options: ["3/4", "75/100", "1/4", "4/3"], answer: "3/4" },
  { question: "Se log₂(x) = 4, qual o valor de x?", options: ["16", "8", "2", "4"], answer: "16" },
  { question: "Numa progressão aritmética com a₁=3 e razão r=4, qual é o décimo termo?", options: ["39", "43", "36", "40"], answer: "39" },
  { question: "Qual a área de um trapézio com bases 10 e 6 e altura 5?", options: ["40", "80", "50", "32"], answer: "40" },
  { question: "O preço de um produto aumentou 20% e passou a custar R$ 60. Qual era o preço original?", options: ["R$ 50", "R$ 48", "R$ 52", "R$ 45"], answer: "R$ 50" },
  { question: "Em um baralho de 52 cartas, qual a probabilidade de tirar um Rei?", options: ["1/13", "1/52", "4/13", "1/4"], answer: "1/13" },
  { question: "Qual é a soma dos ângulos internos de um pentágono?", options: ["540°", "360°", "720°", "180°"], answer: "540°" },
  { question: "Se f(x) = 3x - 2, qual o valor de f(4)?", options: ["10", "12", "14", "8"], answer: "10" },
  { question: "Uma loja oferece um desconto de 15% em um produto de R$ 80. Qual o valor do desconto?", options: ["R$ 12", "R$ 15", "R$ 10", "R$ 8"], answer: "R$ 12" },
  { question: "Qual é a hipotenusa de um triângulo retângulo com catetos 6 e 8?", options: ["10", "14", "12", "9"], answer: "10" },
  { question: "Quantos anagramas tem a palavra 'ENEM'?", options: ["12", "24", "6", "4"], answer: "12" },
  { question: "Qual a forma simplificada da expressão (x² - 4) / (x - 2)?", options: ["x + 2", "x - 2", "x", "2"], answer: "x + 2" },
  { question: "Qual o juro simples produzido por um capital de R$ 1.200, aplicado a uma taxa de 2% ao mês, durante 5 meses?", options: ["R$ 120", "R$ 100", "R$ 240", "R$ 60"], answer: "R$ 120" },
  { question: "Qual a mediana do conjunto de dados: 2, 5, 8, 3, 9, 5, 1?", options: ["5", "8", "4", "3"], answer: "5" },
  { question: "Quantos litros correspondem a 3,5 m³?", options: ["3500 litros", "350 litros", "35 litros", "0.35 litros"], answer: "3500 litros" },
  { question: "O triplo de um número menos 10 é igual a 11. Que número é esse?", options: ["7", "3", "21", "1"], answer: "7" },
  { question: "Em uma urna com 5 bolas vermelhas e 3 azuis, qual a probabilidade de tirar uma bola azul?", options: ["3/8", "5/8", "1/3", "1/5"], answer: "3/8" },
  { question: "Qual o valor da expressão 2³ + 2²?", options: ["12", "10", "16", "32"], answer: "12" },
];

const scienceQuestions: Question[] = [
  { question: "Qual a fórmula da água?", options: ["H2O", "CO2", "O2", "NaCl"], answer: "H2O" },
  { question: "Qual o processo pelo qual as plantas produzem seu próprio alimento?", options: ["Fotossíntese", "Respiração", "Transpiração", "Digestão"], answer: "Fotossíntese" },
  { question: "Qual o planeta mais próximo do Sol?", options: ["Mercúrio", "Vênus", "Terra", "Marte"], answer: "Mercúrio" },
  { question: "A unidade básica da vida é a:", options: ["Célula", "Molécula", "Átomo", "Tecido"], answer: "Célula" },
  { question: "A força que nos mantém na superfície da Terra é a:", options: ["Gravidade", "Inércia", "Atrito", "Eletromagnetismo"], answer: "Gravidade" },
  { question: "Qual elemento químico tem o símbolo 'Fe'?", options: ["Ferro", "Ouro", "Prata", "Cobre"], answer: "Ferro" },
  { question: "Qual das seguintes é uma fonte de energia renovável?", options: ["Solar", "Carvão", "Petróleo", "Gás Natural"], answer: "Solar" },
  { question: "O processo de transformação da água do estado líquido para o gasoso chama-se:", options: ["Evaporação", "Condensação", "Solidificação", "Sublimação"], answer: "Evaporação" },
  { question: "Em que parte da célula o material genético (DNA) é encontrado?", options: ["Núcleo", "Mitocôndria", "Ribossomo", "Citoplasma"], answer: "Núcleo" },
  { question: "A Primeira Lei de Newton também é conhecida como Lei da:", options: ["Inércia", "Ação e Reação", "Gravitação Universal", "Termodinâmica"], answer: "Inércia" },
  { question: "Qual gás é essencial para a respiração humana?", options: ["Oxigênio (O2)", "Dióxido de Carbono (CO2)", "Nitrogênio (N2)", "Hidrogênio (H2)"], answer: "Oxigênio (O2)" },
  { question: "A camada de ozônio protege a Terra de qual tipo de radiação?", options: ["Ultravioleta (UV)", "Infravermelha", "Raios X", "Micro-ondas"], answer: "Ultravioleta (UV)" },
  { question: "Qual é o ácido presente no estômago humano?", options: ["Ácido Clorídrico (HCl)", "Ácido Sulfúrico (H2SO4)", "Ácido Cítrico", "Ácido Acético"], answer: "Ácido Clorídrico (HCl)" },
  { question: "Qual organela celular é responsável pela produção de energia (ATP)?", options: ["Mitocôndria", "Lisossomo", "Complexo de Golgi", "Retículo Endoplasmático"], answer: "Mitocôndria" },
  { question: "A velocidade do som no ar é de aproximadamente:", options: ["343 m/s", "3.0 x 10^8 m/s", "100 km/h", "10 m/s"], answer: "343 m/s" },
  { question: "Um exemplo de mistura homogênea é:", options: ["Água e sal dissolvido", "Água e areia", "Granito", "Sangue"], answer: "Água e sal dissolvido" },
  { question: "Na Tabela Periódica, os elementos estão organizados em ordem crescente de:", options: ["Número Atômico", "Massa Atômica", "Raio Atômico", "Eletronegatividade"], answer: "Número Atômico" },
  { question: "Qual é a principal função dos glóbulos vermelhos (hemácias)?", options: ["Transporte de oxigênio", "Defesa do organismo", "Coagulação sanguínea", "Transporte de nutrientes"], answer: "Transporte de oxigênio" },
  { question: "A teoria da evolução das espécies por seleção natural foi proposta por:", options: ["Charles Darwin", "Gregor Mendel", "Louis Pasteur", "Isaac Newton"], answer: "Charles Darwin" },
  { question: "Qual o tipo de ligação química presente na molécula de sal de cozinha (NaCl)?", options: ["Iônica", "Covalente", "Metálica", "De hidrogênio"], answer: "Iônica" },
  { question: "Em um circuito elétrico, a unidade de medida da resistência é:", options: ["Ohm (Ω)", "Volt (V)", "Ampere (A)", "Watt (W)"], answer: "Ohm (Ω)" },
  { question: "Qual destes animais é um mamífero que bota ovos?", options: ["Ornitorrinco", "Canguru", "Morcego", "Baleia"], answer: "Ornitorrinco" },
  { question: "O que é um ecossistema?", options: ["Conjunto de seres vivos e o ambiente onde vivem, interagindo entre si", "Conjunto de seres da mesma espécie", "O ambiente físico de uma região", "Apenas a comunidade de seres vivos de um local"], answer: "Conjunto de seres vivos e o ambiente onde vivem, interagindo entre si" },
  { question: "O pH de uma solução neutra é:", options: ["7", "0", "14", "Depende da temperatura"], answer: "7" },
  { question: "A energia proveniente do movimento dos ventos é chamada de:", options: ["Energia Eólica", "Energia Solar", "Energia Geotérmica", "Energia Hidrelétrica"], answer: "Energia Eólica" },
  { question: "Qual doença é causada pela falta de Vitamina C?", options: ["Escorbuto", "Raquitismo", "Anemia", "Beribéri"], answer: "Escorbuto" },
  { question: "O fenômeno óptico responsável pela formação do arco-íris é a:", options: ["Dispersão da luz", "Reflexão da luz", "Refração da luz", "Difração da luz"], answer: "Dispersão da luz" },
  { question: "Qual é a unidade de medida de frequência?", options: ["Hertz (Hz)", "Decibel (dB)", "Newton (N)", "Joule (J)"], answer: "Hertz (Hz)" },
  { question: "Em qual estado físico as partículas de uma substância estão mais agregadas e organizadas?", options: ["Sólido", "Líquido", "Gasoso", "Plasma"], answer: "Sólido" },
  { question: "Qual das seguintes estruturas NÃO faz parte do sistema digestório humano?", options: ["Pulmão", "Fígado", "Estômago", "Intestino"], answer: "Pulmão" },
];

const summaries = {
    'Matemática': [
        { title: 'Porcentagem', content: 'Para calcular X% de Y, multiplique Y por (X/100). Ex: 25% de 200 é 200 * 0.25 = 50. Para aumentos, multiplique por (1 + X/100). Para descontos, por (1 - X/100).' },
        { title: 'Análise Combinatória', content: 'Permutação (Pₙ = n!): ordem importa. Arranjo (Aₙ,ₚ = n!/(n-p)!): ordem importa, escolhe p de n. Combinação (Cₙ,ₚ = n!/(p!(n-p)!)): ordem não importa.' },
        { title: 'Funções (1º e 2º Grau)', content: 'Função de 1º Grau (f(x) = ax + b): reta. Raiz: x = -b/a. Função de 2º Grau (f(x) = ax² + bx + c): parábola. Raízes via Bhaskara. Vértice: Xv = -b/2a, Yv = -Δ/4a.' },
        { title: 'Geometria Plana e Espacial', content: 'Áreas: Quadrado (l²), Retângulo (b*h), Triângulo (b*h/2), Círculo (πr²). Volumes: Cubo (a³), Paralelepípedo (a*b*c), Cilindro (πr²h), Esfera (4/3πr³).' },
    ],
    'Ciências': [
        { title: 'Ecologia', content: 'Conceitos chave: Ecossistema (seres vivos + ambiente), Cadeia Alimentar (fluxo de energia), Relações Ecológicas (mutualismo, comensalismo, parasitismo). Fique atento a problemas ambientais como aquecimento global e desmatamento.' },
        { title: 'Genética', content: 'Leis de Mendel: 1ª Lei (Segregação), 2ª Lei (Segregação Independente). Conceitos: Gene (trecho de DNA), Alelo (versão do gene), Dominante/Recessivo, Homozigoto (AA/aa), Heterozigoto (Aa).' },
        { title: 'Leis de Newton', content: '1ª Lei (Inércia): um corpo em repouso/movimento uniforme tende a permanecer assim. 2ª Lei (F=ma): a força resultante é o produto da massa pela aceleração. 3ª Lei (Ação e Reação): toda ação tem uma reação igual e oposta.' },
        { title: 'Química Orgânica', content: 'Principais Funções: Hidrocarbonetos (só C e H), Álcool (-OH), Aldeído (-CHO), Cetona (-CO-), Ácido Carboxílico (-COOH), Éster (-COO-). Reações comuns: Combustão, Esterificação.' },
    ]
};


// --- Geração de Usuários Fictícios para Ranking ---
const generateFakeUsers = (): User[] => {
    const names = ["Lucas", "Julia", "Matheus", "Beatriz", "Gabriel", "Larissa", "Enzo", "Sofia", "Miguel", "Isabella", "Arthur", "Manuela", "Davi", "Laura"];
    const fakeUsers: User[] = [];
    for (let i = 0; i < 250; i++) { // Aumentado para 250 usuários
        const mathProgress = Math.floor(Math.random() * 60) + 40; // 40-99%
        const scienceProgress = Math.floor(Math.random() * 60) + 40;
        fakeUsers.push({
            name: `${names[i % names.length]} S.`,
            email: `fakeuser${i}@email.com`,
            city: "São Paulo", state: "SP", quizAnswers: {},
            isSubscribed: true,
            progress: { math: mathProgress, science: scienceProgress },
            stats: { 
                math: { correct: mathProgress, total: 100 },
                science: { correct: scienceProgress, total: 100 }
            },
            simulationHistory: [],
        });
    }
    return fakeUsers;
};
const fakeUsersForRanking = generateFakeUsers();


// --- Componentes de Tela ---

const WelcomeScreen = ({ onStart, onLogin }) => (
  <div className="min-h-screen flex flex-col justify-center items-center text-white p-4 text-center bg-gradient-to-br from-slate-900 to-slate-800">
    <h1 className="text-5xl font-extrabold mb-4 text-cyan-400">Virada ENEM</h1>
    <p className="text-lg mb-8 italic">Sua segunda chance começa agora!</p>
    <div className="h-24 flex flex-col justify-center items-center">
        <p className="text-slate-300 text-xl font-light animate-pulse">Foi mal no primeiro dia? Ainda dá pra virar o jogo.</p>
    </div>
    <button onClick={onStart} className="w-full max-w-xs bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-4 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 mb-4">
      Começar agora
    </button>
    <button onClick={onLogin} className="w-full max-w-xs bg-transparent border border-cyan-500 hover:bg-cyan-500 hover:text-slate-900 text-cyan-500 font-bold py-3 px-4 rounded-lg text-lg transition duration-300">
      Já tenho cadastro
    </button>
  </div>
);

const AuthForm = ({ title, buttonText, onSubmit, isRegister = false, error, onSwitch }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', city: '', state: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 p-4">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">{title}</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-2xl">
        {isRegister && (
          <input type="text" name="name" placeholder="Nome completo" value={formData.name} onChange={handleChange} required className="w-full bg-slate-700 text-white p-3 rounded-lg mb-4 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        )}
        <input type="email" name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} required className="w-full bg-slate-700 text-white p-3 rounded-lg mb-4 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        <input type="password" name="password" placeholder="Senha" value={formData.password} onChange={handleChange} required className="w-full bg-slate-700 text-white p-3 rounded-lg mb-4 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        {isRegister && (
          <>
            <input type="text" name="city" placeholder="Cidade" value={formData.city} onChange={handleChange} required className="w-full bg-slate-700 text-white p-3 rounded-lg mb-4 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            <input type="text" name="state" placeholder="Estado" value={formData.state} onChange={handleChange} required className="w-full bg-slate-700 text-white p-3 rounded-lg mb-6 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </>
        )}
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-4 rounded-lg text-lg transition duration-300 transform hover:scale-105">
          {buttonText}
        </button>
        <p className="text-center mt-4 text-slate-400">
            {isRegister ? "Já tem uma conta?" : "Não tem uma conta?"}
            <button type="button" onClick={onSwitch} className="font-semibold text-cyan-400 hover:underline ml-2">
                {isRegister ? "Faça Login" : "Cadastre-se"}
            </button>
        </p>
      </form>
    </div>
  );
};

const InitialQuizScreen = ({ onComplete }) => {
  const questions = [
    { id: 'studyTime', text: 'Há quanto tempo você está estudando para o ENEM?', options: ['Menos de 1 mês', '1 a 3 meses', 'Mais de 3 meses'] },
    { id: 'difficulty', text: 'Qual sua maior dificuldade?', options: ['Matemática', 'Ciências da Natureza', 'As duas'] },
    { id: 'firstDay', text: 'Você fez o primeiro dia do ENEM?', options: ['Sim, fui bem', 'Sim, mas fui mal', 'Não fiz'] },
    { id: 'hoursPerDay', text: 'Quantas horas por dia você consegue estudar?', options: ['Menos de 1 hora', '1 a 2 horas', '3+ horas'] },
    { id: 'goal', text: 'O que você mais quer melhorar?', options: ['Raciocínio rápido', 'Revisão dos temas', 'Fazer mais questões'] },
  ];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleAnswer = (option) => {
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: option }));
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete({ ...answers, [questions[currentQuestion].id]: option });
    }
  };
  
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 p-4 text-white">
        <div className="w-full max-w-lg text-center">
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
              <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s' }}></div>
            </div>
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-semibold mb-6">{questions[currentQuestion].text}</h2>
                <div className="space-y-4">
                    {questions[currentQuestion].options.map(option => (
                        <button key={option} onClick={() => handleAnswer(option)} className="w-full text-left bg-slate-700 hover:bg-cyan-600 p-4 rounded-lg text-lg transition duration-300">
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

const SubscriptionScreen = ({ onSubscribed }) => {
    const [showPixModal, setShowPixModal] = useState(false);
    const [charge, setCharge] = useState<any | null>(null);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState('');
    const pollRef = useRef<number | null>(null);

    const BACKEND = 'http://localhost:4000';

    const createCharge = async (plan, price) => {
        try {
            const email = localStorage.getItem('lastUser') || '';
            if (!email) {
                setError('Faça login antes de assinar (entre com seu e-mail).');
                return;
            }
            const res = await fetch(`${BACKEND}/api/create-charge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, plan, amount: price }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCharge(data);
            setShowPixModal(true);

            // Generate QR code image via server endpoint
            try {
                const qrRes = await fetch(`${BACKEND}/api/generate-qr`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: data.copiaecola }),
                });
                const qrData = await qrRes.json();
                if (qrData.qrCodeImage) {
                    setQrImage(qrData.qrCodeImage);
                }
            } catch (qrErr) {
                console.warn('QR generation failed, will show fallback', qrErr);
            }

            // start polling status automatically
            startPolling(data.chargeId);
        } catch (err) {
            console.error(err);
            setError('Erro ao criar cobrança. Tente novamente.');
        }
    };

    const startPolling = (chargeId) => {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => checkStatus(chargeId), 3000);
    };

    const stopPolling = () => {
        if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const checkStatus = async (chargeId) => {
        try {
            setIsChecking(true);
            const res = await fetch(`${BACKEND}/api/payment-status?chargeId=${chargeId}`);
            const data = await res.json();
            if (data.paid) {
                stopPolling();
                // inform server and client
                const email = localStorage.getItem('lastUser') || '';
                await fetch(`${BACKEND}/api/confirm-subscription`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                setShowPixModal(false);
                onSubscribed();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsChecking(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copiado!');
    };

    // simulatePayment removed for production-like flow

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <h1 className="text-4xl font-extrabold text-center mb-4 text-cyan-400">Plano Premium Virada ENEM</h1>
                <p className="text-center text-slate-300 mb-8">Acesso total para garantir sua aprovação!</p>

                <div className="bg-slate-800 p-8 rounded-xl shadow-2xl mb-8">
                    {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                    <ul className="space-y-4">
                        {['Acesso a simulados interativos', 'Questões comentadas', 'Revisões rápidas', 'Videoaulas curtas e diretas', 'Plano de estudo personalizado', 'Modo de desafio e ranking', 'Suporte com IA para tirar dúvidas'].map(item => (
                            <li key={item} className="flex items-center">
                                <svg className="w-6 h-6 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-center mb-8">
                  {[{days: 7, price: 19.9}, {days: 15, price: 29.9}, {days: 30, price: 49.9}].map(plan => (
                      <div key={plan.days} className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-cyan-500 transition duration-300">
                          <h3 className="text-2xl font-bold">{plan.days} dias</h3>
                          <p className="text-4xl font-extrabold my-4">R$ <span className="text-cyan-400">{plan.price.toFixed(2)}</span></p>
                          <button onClick={() => createCharge(`${plan.days}d`, plan.price)} className="w-full bg-cyan-500 text-slate-900 font-bold py-2 rounded-lg hover:bg-cyan-600 transition">Assinar</button>
                      </div>
                  ))}
                </div>

                <p className="text-center text-lg font-semibold text-slate-300 mb-12">Mais de 1000+ alunos já assinaram e estão se preparando!</p>
            </div>

            {showPixModal && charge && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
                    <div className="bg-slate-800 p-8 rounded-xl shadow-2xl text-center w-full max-w-sm">
                        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Pagamento via PIX</h2>
                        <p className="text-slate-300 mb-4">Escaneie o QR code com seu app do banco ou use o copia-e-cola abaixo.</p>

                        {/* QR Code image (generated locally via server) */}
                        {qrImage ? (
                            <div className="flex justify-center mb-4">
                                <img
                                    src={qrImage}
                                    alt="QR code PIX"
                                    className="w-64 h-64 bg-white p-2 rounded border-2 border-cyan-400"
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center mb-4 w-64 h-64 bg-slate-700 rounded flex items-center justify-center text-slate-400">
                                <p>Gerando QR...</p>
                            </div>
                        )}

                        <div className="bg-slate-700 p-3 rounded-lg mb-4">
                            <p className="text-sm break-words font-mono">{charge.copiaecola}</p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => copyToClipboard(charge.copiaecola)} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg">Copiar</button>
                            <button onClick={() => checkStatus(charge.chargeId)} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-4 rounded-lg">Verificar</button>
                            <button onClick={() => { stopPolling(); setShowPixModal(false); setQrImage(null); }} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SummaryScreen = ({ subject, onBack }) => {
    const subjectSummaries = summaries[subject] || [];

    return (
        <div className="min-h-screen flex flex-col items-center bg-slate-900 p-4 text-white">
            <div className="w-full max-w-2xl">
                <button onClick={onBack} className="mb-4 text-cyan-400 hover:underline">{"< Voltar ao Painel"}</button>
                <h1 className="text-3xl font-bold mb-6 text-center">Resumos Rápidos de {subject}</h1>
                <div className="space-y-6">
                    {subjectSummaries.map((summary, index) => (
                        <div key={index} className="bg-slate-800 p-6 rounded-xl shadow-2xl">
                            <h2 className="text-xl font-bold mb-3 text-cyan-400">{summary.title}</h2>
                            <p className="text-slate-300 leading-relaxed">{summary.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StudyScreen = ({ subject, onBack, onUpdateProgress }) => {
    const questions = subject === 'Matemática' ? mathQuestions : scienceQuestions;
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    useEffect(() => {
        setShuffledQuestions(
            [...questions]
              .map(q => ({ ...q, options: shuffleArray(q.options) }))
              .sort(() => Math.random() - 0.5)
        );
    }, [subject]);

    if (shuffledQuestions.length === 0) {
        return <div className="min-h-screen flex justify-center items-center bg-slate-900 text-white">Carregando questões...</div>;
    }

    const currentQuestion = shuffledQuestions[currentQuestionIndex];

    const handleOptionSelect = (option: string) => {
        setSelectedOption(option);
        const correct = option === currentQuestion.answer;
        setIsCorrect(correct);
        onUpdateProgress(subject, correct);

        setTimeout(() => {
            setSelectedOption(null);
            setIsCorrect(null);
            if (currentQuestionIndex < shuffledQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                alert("Você completou todas as questões de " + subject + "!");
                onBack();
            }
        }, 1500);
    };

    const getButtonClass = (option: string) => {
        if (selectedOption === null) return "bg-slate-700 hover:bg-cyan-800";
        if (option === currentQuestion.answer) return "bg-green-500";
        if (option === selectedOption && !isCorrect) return "bg-red-500";
        return "bg-slate-700 opacity-50";
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-slate-900 p-4 text-white">
            <div className="w-full max-w-2xl">
                <button onClick={onBack} className="mb-4 text-cyan-400 hover:underline">{"< Voltar ao Painel"}</button>
                <h1 className="text-3xl font-bold mb-6 text-center">Exercícios de {subject}</h1>
                <div className="bg-slate-800 p-8 rounded-xl shadow-2xl">
                    <p className="text-slate-400 mb-2">Questão {currentQuestionIndex + 1} de {shuffledQuestions.length}</p>
                    <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>
                    <div className="space-y-4">
                        {currentQuestion.options.map(option => (
                            <button
                                key={option}
                                disabled={selectedOption !== null}
                                onClick={() => handleOptionSelect(option)}
                                className={`w-full text-left p-4 rounded-lg text-lg transition duration-300 ${getButtonClass(option)}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SimulationScreen = ({ subject, onBack, onUpdateProgress, onRecordSimulation }) => {
    const questions = useMemo(() => {
        const allQuestions = subject === 'Matemática' ? mathQuestions : scienceQuestions;
        return [...allQuestions]
            .sort(() => 0.5 - Math.random())
            .slice(0, 10)
            .map(q => ({ ...q, options: shuffleArray(q.options) }));
    }, [subject]);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<(string | null)[]>(Array(10).fill(null));
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        if (finished) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishSimulation();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [finished]);

    const handleSelectAnswer = (answer: string) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = answer;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < 9) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishSimulation();
        }
    };
    
    const finishSimulation = () => {
        if (finished) return; 
        setFinished(true);
        let score = 0;
        answers.forEach((ans, index) => {
            if(ans !== null) {
                const isCorrect = ans === questions[index].answer;
                if (isCorrect) score++;
                onUpdateProgress(subject, isCorrect);
            } else {
                 onUpdateProgress(subject, false); // Considera não respondida como errada
            }
        });
        onRecordSimulation(subject, score, 10);
    }

    if(finished) {
        const score = answers.reduce((acc, ans, index) => acc + (ans === questions[index].answer ? 1 : 0), 0);
        return (
             <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 p-4 text-white">
                <div className="bg-slate-800 p-8 rounded-xl shadow-2xl text-center">
                    <h1 className="text-3xl font-bold mb-4 text-cyan-400">Simulado Finalizado!</h1>
                    <p className="text-xl mb-6">Você acertou {score} de 10 questões.</p>
                    <div className="text-6xl font-extrabold mb-8">{score * 10}%</div>
                    <button onClick={onBack} className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-4 rounded-lg text-lg">
                        Voltar ao Painel
                    </button>
                </div>
            </div>
        );
    }
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen flex flex-col items-center bg-slate-900 p-4 text-white">
            <div className="w-full max-w-2xl">
                 <div className="flex justify-between items-center mb-4">
                    <button onClick={onBack} className="text-cyan-400 hover:underline">{"< Voltar ao Painel"}</button>
                    <div className="text-2xl font-bold text-cyan-400">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
                </div>
                <h1 className="text-3xl font-bold mb-6 text-center">Mini Simulado de {subject}</h1>
                <div className="bg-slate-800 p-8 rounded-xl shadow-2xl">
                    <p className="text-slate-400 mb-2">Questão {currentQuestionIndex + 1} de 10</p>
                    <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>
                    <div className="space-y-4">
                        {currentQuestion.options.map(option => (
                            <button
                                key={option}
                                onClick={() => handleSelectAnswer(option)}
                                className={`w-full text-left p-4 rounded-lg text-lg transition duration-300 ${answers[currentQuestionIndex] === option ? 'bg-cyan-600 ring-2 ring-cyan-400' : 'bg-slate-700 hover:bg-cyan-800'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                     <button onClick={handleNext} className="w-full mt-8 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-4 rounded-lg text-lg">
                        {currentQuestionIndex < 9 ? 'Próxima' : 'Finalizar Simulado'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const AIChatbot = ({ onClose }) => {
    const [messages, setMessages] = useState<any[]>([{ role: 'model', text: 'Olá! Sou seu tutor IA. Como posso te ajudar a se preparar para a prova de Matemática ou Ciências da Natureza?' }]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessage = { role: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.text }),
            });
            const data = await res.json();
            const modelText = data?.text ?? 'Desculpe, não foi possível obter resposta.';
            setMessages(prev => [...prev, { role: 'model', text: modelText }]);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-slate-800 w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-cyan-400 flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-2" />
                        Tutor IA
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-lg p-3 rounded-lg bg-slate-700 text-slate-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t border-slate-700">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Tire sua dúvida aqui..."
                            className="flex-1 bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !userInput.trim()}>
                            Enviar
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

const Dashboard = ({ user, onLogout, onSelectStudy, onSelectSimulation, onSelectSummary }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const allUsers = useMemo(() => {
    const realUsers = db.getAllUsers();
    const combined = [...fakeUsersForRanking, ...realUsers];
    const uniqueUsers = Array.from(new Map(combined.map(u => [u.email, u])).values());
    return uniqueUsers.sort((a, b) => (b.progress.math + b.progress.science) - (a.progress.math + a.progress.science));
  }, [user]);

  const userRank = allUsers.findIndex(u => u.email === user.email) + 1;

  const progressData = [
    { name: 'Matemática', value: user.progress.math || 0 },
    { name: 'Ciências', value: user.progress.science || 0 },
  ];
  const COLORS = ['#22d3ee', '#67e8f9'];
  
  const totalSimulations = user.simulationHistory.length;
  const avgMathScore = user.simulationHistory.filter(s => s.subject === 'Matemática').reduce((acc, curr) => acc + curr.score, 0) / (user.simulationHistory.filter(s => s.subject === 'Matemática').length || 1);
  const avgScienceScore = user.simulationHistory.filter(s => s.subject === 'Ciências').reduce((acc, curr) => acc + curr.score, 0) / (user.simulationHistory.filter(s => s.subject === 'Ciências').length || 1);


  const rankingTopUsers = allUsers.slice(0, 4);
  const isUserInTop = rankingTopUsers.some(u => u.email === user.email);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {isChatOpen && <AIChatbot onClose={() => setIsChatOpen(false)} />}
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold">Olá, {user.name.split(' ')[0]}!</h1>
            <p className="text-slate-400">Pronto para virar o jogo?</p>
        </div>
        <button onClick={onLogout} className="bg-slate-700 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition">Sair</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card de Estudo */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Área de Estudo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ subject: 'Matemática', icon: <BookOpenIcon/> }, { subject: 'Ciências da Natureza', icon: <BeakerIcon/> }].map(item => (
                    <div key={item.subject} className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center text-xl font-semibold mb-3 text-cyan-400">
                            {item.icon} {item.subject}
                        </div>
                        <button onClick={() => onSelectSummary(item.subject === 'Matemática' ? 'Matemática' : 'Ciências')} className="w-full bg-slate-600 hover:bg-slate-500 text-sm py-2 rounded-md mb-2">Resumos rápidos</button>
                        <button onClick={() => onSelectStudy(item.subject === 'Matemática' ? 'Matemática' : 'Ciências')} className="w-full bg-slate-600 hover:bg-slate-500 text-sm py-2 rounded-md mb-2">Exercícios práticos</button>
                        <button onClick={() => onSelectSimulation(item.subject === 'Matemática' ? 'Matemática' : 'Ciências')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-sm py-2 rounded-md font-semibold">Mini simulados</button>
                    </div>
                ))}
            </div>
             <button onClick={() => setIsChatOpen(true)} className="mt-6 w-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-300 transform hover:scale-105">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Perguntar ao Tutor IA
            </button>
        </div>

        {/* Card de Progresso */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Seu Progresso</h2>
             <div className="flex-grow">
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={progressData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {progressData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
             </div>
        </div>
        
        {/* Card de Estatísticas */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Estatísticas</h2>
            <div className="space-y-4">
                <div className="flex justify-between bg-slate-700 p-3 rounded-lg">
                    <span>Simulados Realizados:</span>
                    <span className="font-bold text-cyan-400">{totalSimulations}</span>
                </div>
                 <div className="flex justify-between bg-slate-700 p-3 rounded-lg">
                    <span>Média em Simulados (Mat):</span>
                    <span className="font-bold text-cyan-400">{avgMathScore.toFixed(1)} / 10</span>
                </div>
                 <div className="flex justify-between bg-slate-700 p-3 rounded-lg">
                    <span>Média em Simulados (Ciên):</span>
                    <span className="font-bold text-cyan-400">{avgScienceScore.toFixed(1)} / 10</span>
                </div>
                 <div className="flex justify-between bg-slate-700 p-3 rounded-lg">
                    <span>Precisão Geral (Mat):</span>
                    <span className="font-bold text-cyan-400">{user.stats.math.total > 0 ? ((user.stats.math.correct / user.stats.math.total) * 100).toFixed(0) : 0}%</span>
                </div>
                 <div className="flex justify-between bg-slate-700 p-3 rounded-lg">
                    <span>Precisão Geral (Ciên):</span>
                    <span className="font-bold text-cyan-400">{user.stats.science.total > 0 ? ((user.stats.science.correct / user.stats.science.total) * 100).toFixed(0) : 0}%</span>
                </div>
            </div>
        </div>

        {/* Card de Ranking */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Ranking Nacional</h2>
            <p className="text-slate-400 mb-4">Sua posição: <span className="font-bold text-cyan-400">{userRank}º</span></p>
            <ul className="space-y-3">
              {rankingTopUsers.map((u, index) => (
                <li key={u.email} className={`flex justify-between items-center p-3 rounded-lg ${u.email === user.email ? 'bg-cyan-500/20' : 'bg-slate-700'}`}>
                    <span className="font-semibold">{index + 1}. {u.name}</span>
                    <span className="font-bold text-cyan-400">{Math.round((u.progress.math + u.progress.science) / 2)}%</span>
                </li>
              ))}
              {!isUserInTop && userRank > 4 && (
                <>
                  <li className="text-center text-slate-500">...</li>
                  <li className={`flex justify-between items-center p-3 rounded-lg bg-cyan-500/20`}>
                      <span className="font-semibold">{userRank}. {user.name}</span>
                      <span className="font-bold text-cyan-400">{Math.round((user.progress.math + user.progress.science) / 2)}%</span>
                  </li>
                </>
              )}
            </ul>
        </div>
      </div>
    </div>
  );
};


// --- Componente Principal ---
function App() {
  const [screen, setScreen] = useState('welcome'); // welcome, register, login, quiz, subscription, dashboard, study, simulation, summary
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState('');
  const [studySubject, setStudySubject] = useState('');
  const [isRegisterForm, setIsRegisterForm] = useState(true);

  // Helper para centralizar a atualização do usuário, garantindo a persistência correta
  const updateUser = (updateFn: (user: User) => User) => {
    if (!currentUser) return;
    const existingUser = db.getUser(currentUser.email);
    if (!existingUser) return;

    const updatedUser = updateFn(existingUser);

    db.saveUser(currentUser.email, updatedUser);
    setCurrentUser(updatedUser);
  };
  
  useEffect(() => {
    const lastUserEmail = localStorage.getItem('lastUser');
    if (lastUserEmail) {
      const user = db.getUser(lastUserEmail);
      if (user) {
        setCurrentUser(user);
        if (user.isSubscribed) {
            setScreen('dashboard');
        } else {
            setScreen('subscription');
        }
      }
    }
  }, []);
  
  const handleRegister = (formData) => {
    if (db.getUser(formData.email)) {
        setAuthError('Este e-mail já está cadastrado.');
        return;
    }
    const newUser: User = {
        name: formData.name,
        email: formData.email,
        city: formData.city,
        state: formData.state,
        quizAnswers: {},
        isSubscribed: false, 
        progress: { math: 0, science: 0 },
        stats: { math: { correct: 0, total: 0 }, science: { correct: 0, total: 0 } },
        simulationHistory: [],
        password: formData.password, // Salva a senha no objeto do usuário
    };
    db.saveUser(formData.email, newUser);
    setCurrentUser(newUser);
    setAuthError('');
        // Save lastUser so payment flow and other screens recognize the user immediately
        localStorage.setItem('lastUser', newUser.email);
        // After cadastro, ir direto para a tela de assinatura para que a mensagem/QR apareça na hora
        setScreen('subscription');
  };

  const handleLogin = (formData) => {
    const user = db.getUser(formData.email);
    if (user && user.password && user.password === formData.password) {
        setCurrentUser(user);
        localStorage.setItem('lastUser', user.email);
        setAuthError('');
        if (user.isSubscribed) {
            setScreen('dashboard');
        } else {
            setScreen('subscription');
        }
    } else {
        setAuthError('E-mail ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lastUser');
    setCurrentUser(null);
    setScreen('welcome');
  };

  const handleQuizComplete = (answers) => {
    updateUser(user => ({ ...user, quizAnswers: answers }));
    setScreen('subscription');
  };
  
  const handleSubscribed = () => {
    if (!currentUser) return;
    updateUser(user => ({ ...user, isSubscribed: true }));
    localStorage.setItem('lastUser', currentUser.email);
    setScreen('dashboard');
  };
  
  const handleSelectStudy = (subject: 'Matemática' | 'Ciências') => {
      setStudySubject(subject);
      setScreen('study');
  };

  const handleSelectSimulation = (subject: 'Matemática' | 'Ciências') => {
      setStudySubject(subject);
      setScreen('simulation');
  };
  
  const handleSelectSummary = (subject: 'Matemática' | 'Ciências') => {
      setStudySubject(subject);
      setScreen('summary');
  };

  const handleUpdateProgress = (subject: 'Matemática' | 'Ciências', isCorrect: boolean) => {
    updateUser(user => {
        // Usar uma cópia profunda para evitar mutação de estado aninhado
        const updatedUser = JSON.parse(JSON.stringify(user));
        const subjectKey = subject === 'Matemática' ? 'math' : 'science';

        updatedUser.stats[subjectKey].total += 1;
        if (isCorrect) {
            updatedUser.stats[subjectKey].correct += 1;
        }

        const { correct, total } = updatedUser.stats[subjectKey];
        updatedUser.progress[subjectKey] = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        return updatedUser;
    });
  };
  
  const handleRecordSimulation = (subject: 'Matemática' | 'Ciências', score: number, total: number) => {
    updateUser(user => {
        const updatedUser = JSON.parse(JSON.stringify(user));
        if (!updatedUser.simulationHistory) {
            updatedUser.simulationHistory = [];
        }
        updatedUser.simulationHistory.push({ subject, score, total, date: Date.now() });
        
        // Atualiza progresso com base no desempenho do simulado
        const subjectKey = subject === 'Matemática' ? 'math' : 'science';
        const currentProgress = updatedUser.progress[subjectKey];
        const performance = (score / total); // 0 a 1
        
        let newProgress;
        if (performance >= 0.6) {
            newProgress = Math.min(100, currentProgress + Math.round((performance - 0.5) * 10)); // Sobe mais
        } else {
            newProgress = Math.max(0, currentProgress - Math.round((0.5 - performance) * 10)); // Desce
        }
        updatedUser.progress[subjectKey] = newProgress;

        return updatedUser;
    });
  };

  const switchAuthMode = () => {
      setIsRegisterForm(!isRegisterForm);
      setAuthError('');
  }

  const renderAuthScreen = () => {
      if (isRegisterForm) {
          return <AuthForm title="Criar Conta" buttonText="Cadastrar" onSubmit={handleRegister} isRegister={true} error={authError} onSwitch={switchAuthMode} />;
      }
      return <AuthForm title="Entrar" buttonText="Login" onSubmit={handleLogin} error={authError} onSwitch={switchAuthMode} />;
  }

  switch(screen) {
    case 'welcome': return <WelcomeScreen onStart={() => { setIsRegisterForm(true); setScreen('auth'); }} onLogin={() => { setIsRegisterForm(false); setScreen('auth'); }} />;
    case 'auth': return renderAuthScreen();
    case 'quiz': return <InitialQuizScreen onComplete={handleQuizComplete} />;
    case 'subscription': return <SubscriptionScreen onSubscribed={handleSubscribed} />;
    case 'dashboard': return currentUser && <Dashboard user={currentUser} onLogout={handleLogout} onSelectStudy={handleSelectStudy} onSelectSimulation={handleSelectSimulation} onSelectSummary={handleSelectSummary} />;
    case 'study': return <StudyScreen subject={studySubject} onBack={() => setScreen('dashboard')} onUpdateProgress={handleUpdateProgress} />;
    case 'simulation': return <SimulationScreen subject={studySubject} onBack={() => setScreen('dashboard')} onUpdateProgress={handleUpdateProgress} onRecordSimulation={handleRecordSimulation} />;
    case 'summary': return <SummaryScreen subject={studySubject} onBack={() => setScreen('dashboard')} />;
    default: return <WelcomeScreen onStart={() => { setIsRegisterForm(true); setScreen('auth'); }} onLogin={() => { setIsRegisterForm(false); setScreen('auth'); }} />;
  }
}

export default App;
