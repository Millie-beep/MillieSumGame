import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, RefreshCw, Play, Pause, AlertCircle, ChevronLeft, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Constants ---
const COLS = 6;
const ROWS = 10;
const INITIAL_ROWS = 4;
const TICK_INTERVAL = 1000; // 1 second for timer
const TIME_MODE_SPEED = 8; // seconds per new row in time mode

type GameMode = 'classic' | 'time';
type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
}

export default function App() {
  // --- State ---
  const [status, setStatus] = useState<GameStatus>('idle');
  const [mode, setMode] = useState<GameMode>('classic');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [target, setTarget] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(TIME_MODE_SPEED);
  const [showHelp, setShowHelp] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // --- Helpers ---
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const getRandomNum = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const generateTarget = useCallback((currentBlocks: Block[]) => {
    if (currentBlocks.length === 0) return getRandomNum(10, 20);
    
    // Pick 2-4 random blocks and sum them to ensure the target is reachable
    const count = Math.min(currentBlocks.length, getRandomNum(2, 4));
    const shuffled = [...currentBlocks].sort(() => 0.5 - Math.random());
    const sum = shuffled.slice(0, count).reduce((acc, b) => acc + b.value, 0);
    
    // Sometimes just give a random number to keep it challenging
    return Math.random() > 0.3 ? sum : getRandomNum(10, 25);
  }, []);

  const addNewRow = useCallback(() => {
    setBlocks(prev => {
      // Shift existing blocks up
      const shifted = prev.map(b => ({ ...b, row: b.row + 1 }));
      
      // Check for game over (if any block reaches the top row)
      if (shifted.some(b => b.row >= ROWS)) {
        setStatus('gameover');
        return prev;
      }

      // Add new row at bottom (row 0)
      const newRowBlocks: Block[] = Array.from({ length: COLS }).map((_, col) => ({
        id: generateId(),
        value: getRandomNum(1, 9),
        row: 0,
        col
      }));

      return [...shifted, ...newRowBlocks];
    });
  }, []);

  const initGame = (selectedMode: GameMode) => {
    const initialBlocks: Block[] = [];
    for (let r = 0; r < INITIAL_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        initialBlocks.push({
          id: generateId(),
          value: getRandomNum(1, 9),
          row: r,
          col: c
        });
      }
    }
    setBlocks(initialBlocks);
    setTarget(generateTarget(initialBlocks));
    setScore(0);
    setMode(selectedMode);
    setStatus('playing');
    setSelectedIds([]);
    setTimer(TIME_MODE_SPEED);
  };

  // --- Effects ---
  useEffect(() => {
    const saved = localStorage.getItem('sumstack-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('sumstack-highscore', score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    if (status === 'playing' && mode === 'time') {
      gameLoopRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            addNewRow();
            return TIME_MODE_SPEED;
          }
          return prev - 1;
        });
      }, TICK_INTERVAL);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [status, mode, addNewRow]);

  // --- Handlers ---
  const handleBlockClick = (id: string) => {
    if (status !== 'playing') return;

    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      let next: string[];
      if (isSelected) {
        next = prev.filter(i => i !== id);
      } else {
        next = [...prev, id];
      }

      // Check sum
      const currentSum = blocks
        .filter(b => next.includes(b.id))
        .reduce((acc, b) => acc + b.value, 0);

      if (currentSum === target) {
        // Success!
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        });

        const remainingBlocks = blocks.filter(b => !next.includes(b.id));
        setBlocks(remainingBlocks);
        setScore(s => s + target);
        setTarget(generateTarget(remainingBlocks));
        
        if (mode === 'classic') {
          addNewRow();
        }
        
        return [];
      } else if (currentSum > target) {
        // Over sum - visual feedback or just clear selection
        return [];
      }

      return next;
    });
  };

  const currentSum = blocks
    .filter(b => selectedIds.includes(b.id))
    .reduce((acc, b) => acc + b.value, 0);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-emerald-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-[#141414]/10 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <h1 className="hidden sm:block font-bold text-lg tracking-tight">数字堆叠</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">目标</span>
            <span className="text-2xl font-black text-emerald-600 leading-none">{target}</span>
          </div>
          <div className="h-8 w-px bg-[#141414]/10" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">得分</span>
            <span className="text-2xl font-black leading-none">{score}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
          >
            <HelpCircle size={20} />
          </button>
          {status === 'playing' && (
            <button 
              onClick={() => setStatus('paused')}
              className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
            >
              <Pause size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-md mx-auto">
        {/* Game Board Container */}
        <div className="relative aspect-[6/10] w-full bg-white rounded-3xl shadow-2xl shadow-black/5 border border-[#141414]/5 overflow-hidden">
          
          {/* Grid Background */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-10 pointer-events-none opacity-[0.03]">
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} className="border border-[#141414]" />
            ))}
          </div>

          {/* Blocks */}
          <div className="absolute inset-0 p-2 grid grid-cols-6 grid-rows-10 gap-2">
            <AnimatePresence>
              {blocks.map((block) => (
                <motion.button
                  key={block.id}
                  layoutId={block.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    gridRowStart: ROWS - block.row,
                    gridColumnStart: block.col + 1
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => handleBlockClick(block.id)}
                  className={`
                    relative w-full h-full rounded-lg flex items-center justify-center text-xl font-bold transition-all
                    ${selectedIds.includes(block.id) 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-95' 
                      : 'bg-[#F5F5F0] hover:bg-white hover:shadow-md border border-[#141414]/5'}
                  `}
                >
                  {block.value}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {status === 'idle' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="mb-8">
                  <h2 className="text-4xl font-black mb-2">数字堆叠</h2>
                  <p className="text-sm opacity-60">组合数字以达到目标总和</p>
                </div>
                
                <div className="space-y-3 w-full max-w-[200px]">
                  <button 
                    onClick={() => initGame('classic')}
                    className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Trophy size={18} />
                    经典模式
                  </button>
                  <button 
                    onClick={() => initGame('time')}
                    className="w-full py-4 border-2 border-[#141414] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#141414]/5 hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Clock size={18} />
                    计时模式
                  </button>
                </div>

                {highScore > 0 && (
                  <div className="mt-12 flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">最高分</span>
                    <span className="text-2xl font-black">{highScore}</span>
                  </div>
                )}
              </motion.div>
            )}

            {status === 'paused' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
              >
                <h2 className="text-3xl font-black mb-8">已暂停</h2>
                <button 
                  onClick={() => setStatus('playing')}
                  className="w-16 h-16 bg-[#141414] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                >
                  <Play size={32} className="ml-1" />
                </button>
              </motion.div>
            )}

            {status === 'gameover' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-red-500 z-20 flex flex-col items-center justify-center p-8 text-white text-center"
              >
                <AlertCircle size={64} className="mb-4" />
                <h2 className="text-4xl font-black mb-2">游戏结束</h2>
                <p className="mb-8 opacity-80">方块触顶了！</p>
                
                <div className="bg-white/20 rounded-2xl p-6 w-full mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold uppercase tracking-widest opacity-70">最终得分</span>
                    <span className="text-3xl font-black">{score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase tracking-widest opacity-70">最高纪录</span>
                    <span className="text-xl font-black">{highScore}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setStatus('idle')}
                  className="w-full py-4 bg-white text-red-500 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-xl"
                >
                  <RefreshCw size={20} />
                  再试一次
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Controls */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">当前总和</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${currentSum > target ? 'text-red-500' : 'text-[#141414]'}`}>
                  {currentSum}
                </span>
                <span className="text-sm opacity-30">/ {target}</span>
              </div>
            </div>
          </div>

          {mode === 'time' && status === 'playing' && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">下一行</span>
              <div className="w-24 h-2 bg-[#141414]/10 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timer / TIME_MODE_SPEED) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black mb-4">玩法说明</h3>
              <ul className="space-y-4 text-sm leading-relaxed opacity-80">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">1</span>
                  选择方块，使它们的总和等于顶部的<span className="font-bold text-[#141414]">目标数字</span>。
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">2</span>
                  方块不需要相邻，网格中任何位置的组合都可以！
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">3</span>
                  在<span className="font-bold text-[#141414]">经典模式</span>下，每次成功消除后底部会新增一行。
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">4</span>
                  在<span className="font-bold text-[#141414]">计时模式</span>下，每隔几秒会自动新增一行。
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">!</span>
                  不要让方块堆积到屏幕顶部！
                </li>
              </ul>
              <button 
                onClick={() => setShowHelp(false)}
                className="w-full mt-8 py-4 bg-[#141414] text-white rounded-2xl font-bold"
              >
                明白了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square rounded-full bg-emerald-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square rounded-full bg-blue-100/50 blur-[120px]" />
      </div>
    </div>
  );
}
