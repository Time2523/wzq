class Gomoku {
    constructor() {
        this.board = Array(15).fill().map(() => Array(15).fill(0));
        this.currentPlayer = 1; // 1: 黑棋, 2: 白棋
        this.isGameOver = false;
        this.wins = this.loadWins();
        this.currentScore = 0;
        this.highestScore = this.loadHighestScore();
        this.moveHistory = [];
        this.updateScoreboard();
        this.updateScoreDisplay();
        this.initBoard();
        this.bindEvents();
    }

    loadHighestScore() {
        const savedScore = localStorage.getItem('gomoku-highest-score');
        return savedScore ? parseInt(savedScore) : 0;
    }

    saveHighestScore() {
        if (this.currentScore > this.highestScore) {
            this.highestScore = this.currentScore;
            localStorage.setItem('gomoku-highest-score', this.highestScore.toString());
        }
    }

    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.currentScore;
        document.getElementById('highest-score').textContent = this.highestScore;
    }

    loadWins() {
        const savedWins = localStorage.getItem('gomoku-wins');
        return savedWins ? JSON.parse(savedWins) : { black: 0, white: 0 };
    }

    saveWins() {
        localStorage.setItem('gomoku-wins', JSON.stringify(this.wins));
    }

    updateScoreboard() {
        document.getElementById('black-wins').textContent = this.wins.black;
        document.getElementById('white-wins').textContent = this.wins.white;
    }

    initBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardElement.appendChild(cell);
            }
        }

        this.board = Array(15).fill().map(() => Array(15).fill(0));
        this.currentPlayer = 1;
        this.isGameOver = false;
        this.currentScore = 0;
        this.moveHistory = [];
        document.getElementById('status').textContent = '轮到黑棋';
        this.updateScoreDisplay();
        document.getElementById('undo').disabled = true;
        
        // 隐藏游戏结束界面
        document.getElementById('game-over').classList.remove('active');
    }

    bindEvents() {
        const boardElement = document.getElementById('board');
        boardElement.addEventListener('click', (e) => {
            if (this.isGameOver) return;
            
            const cell = e.target;
            if (cell.classList.contains('cell')) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                if (this.board[row][col] === 0) {
                    this.placeStone(row, col, this.currentPlayer);
                    
                    if (this.checkWin(row, col, this.currentPlayer)) {
                        this.isGameOver = true;
                        this.handleGameOver(this.currentPlayer);
                        return;
                    }
                    
                    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                    document.getElementById('status').textContent = this.currentPlayer === 1 ? '轮到黑棋' : '轮到白棋';
                    
                    // AI回合
                    if (this.currentPlayer === 2) {
                        setTimeout(() => {
                            this.aiMove();
                        }, 500);
                    }
                }
            }
        });

        document.getElementById('restart').addEventListener('click', () => {
            this.initBoard();
        });

        document.getElementById('undo').addEventListener('click', () => {
            this.undoMove();
        });

        document.getElementById('play-again').addEventListener('click', () => {
            this.initBoard();
        });
    }

    placeStone(row, col, player) {
        this.board[row][col] = player;
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        const stone = document.createElement('div');
        stone.className = `stone ${player === 1 ? 'black' : 'white'}`;
        cell.appendChild(stone);
        
        // 播放落子音效
        const moveSound = document.getElementById('move-sound');
        moveSound.currentTime = 0;
        moveSound.play().catch(e => console.log('Audio play failed:', e));
        
        // 添加落子动画
        stone.style.transform = 'scale(0)';
        setTimeout(() => {
            stone.style.transform = 'scale(1)';
        }, 10);
        
        // 记录落子历史
        this.moveHistory.push({ row, col, player });
        document.getElementById('undo').disabled = this.moveHistory.length === 0;
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正向检查
            for (let i = 1; i < 5; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                
                if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 反向检查
            for (let i = 1; i < 5; i++) {
                const newRow = row - i * dx;
                const newCol = col - i * dy;
                
                if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }

    undoMove() {
        if (this.moveHistory.length === 0 || this.isGameOver) return;
        
        // 移除最后一步棋
        const lastMove = this.moveHistory.pop();
        this.board[lastMove.row][lastMove.col] = 0;
        
        // 移除DOM中的棋子
        const cell = document.querySelector(`.cell[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`);
        if (cell) {
            const stone = cell.querySelector('.stone');
            if (stone) {
                cell.removeChild(stone);
            }
        }
        
        // 切换回上一个玩家
        this.currentPlayer = lastMove.player;
        document.getElementById('status').textContent = this.currentPlayer === 1 ? '轮到黑棋' : '轮到白棋';
        
        // 扣分
        this.currentScore = Math.max(0, this.currentScore - 10);
        this.updateScoreDisplay();
        
        // 更新悔棋按钮状态
        document.getElementById('undo').disabled = this.moveHistory.length === 0;
    }

    handleGameOver(winner) {
        // 计算得分
        let score = 100; // 基础分
        score -= (this.moveHistory.length - 5) * 2; // 每多一步扣2分
        score = Math.max(0, score); // 最低分为0
        
        if (winner === 1) {
            this.currentScore = score;
            const message = `黑棋获胜！得分: ${score}`;
            document.getElementById('game-over-message').textContent = message;
            this.wins.black++;
            
            // 播放胜利音效
            const winSound = document.getElementById('win-sound');
            winSound.currentTime = 0;
            winSound.play().catch(e => console.log('Audio play failed:', e));
        } else {
            this.currentScore = 0; // 白棋获胜，玩家不得分
            const message = '白棋获胜！得分: 0';
            document.getElementById('game-over-message').textContent = message;
            this.wins.white++;
            
            // 播放失败音效
            const loseSound = document.getElementById('lose-sound');
            loseSound.currentTime = 0;
            loseSound.play().catch(e => console.log('Audio play failed:', e));
        }
        
        document.getElementById('game-over').classList.add('active');
        this.saveWins();
        this.saveHighestScore();
        this.updateScoreboard();
        this.updateScoreDisplay();
    }

    aiMove() {
        const bestMove = this.minimax(2, -Infinity, Infinity, true);
        if (bestMove) {
            this.placeStone(bestMove.row, bestMove.col, 2);
            
            if (this.checkWin(bestMove.row, bestMove.col, 2)) {
                this.isGameOver = true;
                this.handleGameOver(2);
                return;
            }
            
            this.currentPlayer = 1;
            document.getElementById('status').textContent = '轮到黑棋';
        }
    }

    minimax(depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return { score: this.evaluateBoard() };
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            let bestMove = null;
            
            const moves = this.getValidMoves();
            for (const move of moves) {
                this.board[move.row][move.col] = 2;
                const result = this.minimax(depth - 1, alpha, beta, false);
                this.board[move.row][move.col] = 0;
                
                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, bestScore);
                if (beta <= alpha) {
                    break;
                }
            }
            
            return bestMove ? { ...bestMove, score: bestScore } : { score: bestScore };
        } else {
            let bestScore = Infinity;
            let bestMove = null;
            
            const moves = this.getValidMoves();
            for (const move of moves) {
                this.board[move.row][move.col] = 1;
                const result = this.minimax(depth - 1, alpha, beta, true);
                this.board[move.row][move.col] = 0;
                
                if (result.score < bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, bestScore);
                if (beta <= alpha) {
                    break;
                }
            }
            
            return bestMove ? { ...bestMove, score: bestScore } : { score: bestScore };
        }
    }

    getValidMoves() {
        const moves = [];
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (this.board[i][j] === 0) {
                    // 只考虑有相邻棋子的位置，减少搜索空间
                    if (this.hasAdjacentStone(i, j)) {
                        moves.push({ row: i, col: j });
                    }
                }
            }
        }
        
        // 如果没有相邻棋子，选择中心位置
        if (moves.length === 0) {
            moves.push({ row: 7, col: 7 });
        }
        
        return moves;
    }

    hasAdjacentStone(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && this.board[newRow][newCol] !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    evaluateBoard() {
        let score = 0;
        
        // 评估白棋的优势
        score += this.evaluatePlayer(2);
        // 评估黑棋的威胁
        score -= this.evaluatePlayer(1);
        
        return score;
    }

    evaluatePlayer(player) {
        let score = 0;
        
        // 评估每一行
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j <= 10; j++) {
                const line = this.board[i].slice(j, j + 5);
                score += this.evaluateLine(line, player);
            }
        }
        
        // 评估每一列
        for (let j = 0; j < 15; j++) {
            for (let i = 0; i <= 10; i++) {
                const line = [];
                for (let k = 0; k < 5; k++) {
                    line.push(this.board[i + k][j]);
                }
                score += this.evaluateLine(line, player);
            }
        }
        
        // 评估对角线
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                const line = [];
                for (let k = 0; k < 5; k++) {
                    line.push(this.board[i + k][j + k]);
                }
                score += this.evaluateLine(line, player);
            }
        }
        
        // 评估反对角线
        for (let i = 0; i <= 10; i++) {
            for (let j = 4; j < 15; j++) {
                const line = [];
                for (let k = 0; k < 5; k++) {
                    line.push(this.board[i + k][j - k]);
                }
                score += this.evaluateLine(line, player);
            }
        }
        
        return score;
    }

    evaluateLine(line, player) {
        const opponent = player === 1 ? 2 : 1;
        const playerCount = line.filter(cell => cell === player).length;
        const opponentCount = line.filter(cell => cell === opponent).length;
        
        if (opponentCount > 0) {
            return 0;
        }
        
        switch (playerCount) {
            case 5:
                return 10000;
            case 4:
                return 1000;
            case 3:
                return 100;
            case 2:
                return 10;
            case 1:
                return 1;
            default:
                return 0;
        }
    }
}

// 初始化游戏
window.onload = function() {
    new Gomoku();
};