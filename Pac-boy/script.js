// マップの定義（0: 通路+餌, 1: 壁, 2: パックマン初期位置, 3: ゴースト初期位置）
const INITIAL_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,1,0,0,0,2,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,1,0,1,3,1,0,0,0,1],
    [1,1,1,0,1,0,0,0,0,0,1,0,1,1,1],
    [1,0,0,0,1,1,1,1,1,1,1,0,0,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,0,0,1,1,1,0,1,1,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const CELL_SIZE = 30;
const GHOST_COLORS = ['red', 'pink', 'cyan', 'orange'];

const PacmanGame = () => {
    const [map, setMap] = React.useState([]);
    const [pacman, setPacman] = React.useState({ x: 0, y: 0 });
    const [ghosts, setGhosts] = React.useState([]);
    const [score, setScore] = React.useState(0);
    const [gameOver, setGameOver] = React.useState(false);
    const [gameWon, setGameWon] = React.useState(false);

    React.useEffect(() => {
        initGame();
    }, []);

    const initGame = () => {
        const newMap = JSON.parse(JSON.stringify(INITIAL_MAP));
        let pacmanPos = { x: 0, y: 0 };
        const ghostPositions = [];
        let remainingDots = 0;

        for (let y = 0; y < newMap.length; y++) {
            for (let x = 0; x < newMap[y].length; x++) {
                if (newMap[y][x] === 2) {
                    pacmanPos = { x, y };
                    newMap[y][x] = 0;
                } else if (newMap[y][x] === 3) {
                    ghostPositions.push({ x, y });
                    newMap[y][x] = 0;
                }
                if (newMap[y][x] === 0) {
                    remainingDots++;
                }
            }
        }

        setMap(newMap);
        setPacman(pacmanPos);
        setGhosts(ghostPositions);
        setScore(0);
        setGameOver(false);
        setGameWon(false);
    };

    React.useEffect(() => {
        const handleKeyPress = (e) => {
            if (gameOver || gameWon) return;

            const movement = {
                ArrowUp: { x: 0, y: -1 },
                ArrowDown: { x: 0, y: 1 },
                ArrowLeft: { x: -1, y: 0 },
                ArrowRight: { x: 1, y: 0 }
            }[e.key];

            if (movement) {
                movePacman(movement);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameOver, gameWon, map, pacman]);

    const movePacman = React.useCallback(({ x: dx, y: dy }) => {
        const newX = pacman.x + dx;
        const newY = pacman.y + dy;

        if (map[newY]?.[newX] !== 1) {
            setPacman({ x: newX, y: newY });

            if (map[newY][newX] === 0) {
                const newMap = [...map];
                newMap[newY][newX] = -1;
                setMap(newMap);
                setScore(score + 10);

                const remainingDots = newMap.flat().filter(cell => cell === 0).length;
                if (remainingDots === 0) {
                    setGameWon(true);
                }
            }
        }
    }, [map, pacman, score]);

    React.useEffect(() => {
        if (gameOver || gameWon) return;

        const moveGhosts = () => {
            setGhosts(currentGhosts => 
                currentGhosts.map((ghost, index) => {
                    let dx = 0, dy = 0;
                    switch (index) {
                        case 0:
                            dx = Math.sign(pacman.x - ghost.x);
                            dy = Math.sign(pacman.y - ghost.y);
                            break;
                        case 1:
                            dx = Math.sign((pacman.x + 4) - ghost.x);
                            dy = Math.sign((pacman.y + 4) - ghost.y);
                            break;
                        case 2:
                            dx = Math.random() > 0.5 ? 1 : -1;
                            dy = Math.random() > 0.5 ? 1 : -1;
                            break;
                        case 3:
                            dx = Math.sign(ghost.x - pacman.x);
                            dy = Math.sign(ghost.y - pacman.y);
                            break;
                    }

                    const newX = ghost.x + dx;
                    const newY = ghost.y + dy;

                    if (map[newY]?.[newX] !== 1) {
                        return { x: newX, y: newY };
                    }
                    return ghost;
                })
            );
        };

        const intervalId = setInterval(moveGhosts, 500);
        return () => clearInterval(intervalId);
    }, [gameOver, gameWon, map, pacman]);

    React.useEffect(() => {
        const checkCollision = () => {
            ghosts.forEach(ghost => {
                if (ghost.x === pacman.x && ghost.y === pacman.y) {
                    setGameOver(true);
                }
            });
        };

        checkCollision();
    }, [ghosts, pacman]);

    return React.createElement('div', {
        className: 'flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4'
    }, [
        React.createElement('div', {
            key: 'score',
            className: 'mb-4 text-white text-xl'
        }, `Score: ${score}`),
        
        (gameOver || gameWon) && React.createElement('div', {
            key: 'restart',
            className: 'mb-4'
        }, React.createElement('button', {
            onClick: initGame,
            className: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
        }, 'Restart')),

        React.createElement('div', {
            key: 'game-board',
            className: 'relative bg-black p-2 rounded'
        }, [
            ...map.map((row, y) =>
                React.createElement('div', {
                    key: y,
                    className: 'flex'
                }, row.map((cell, x) =>
                    React.createElement('div', {
                        key: `${x}-${y}`,
                        className: 'flex items-center justify-center',
                        style: {
                            width: CELL_SIZE,
                            height: CELL_SIZE
                        }
                    }, cell === 1 ?
                        React.createElement('div', {
                            className: 'w-full h-full bg-blue-900'
                        }) :
                        cell === 0 ?
                        React.createElement('div', {
                            className: 'w-2 h-2 bg-yellow-200 rounded-full'
                        }) : null
                    )
                ))
            ),
            React.createElement('div', {
                key: 'pacman',
                className: 'absolute w-6 h-6 bg-yellow-400 rounded-full',
                style: {
                    left: pacman.x * CELL_SIZE + 2,
                    top: pacman.y * CELL_SIZE + 2,
                }
            }),
            ...ghosts.map((ghost, index) =>
                React.createElement('div', {
                    key: `ghost-${index}`,
                    className: 'absolute w-6 h-6 rounded-full',
                    style: {
                        left: ghost.x * CELL_SIZE + 2,
                        top: ghost.y * CELL_SIZE + 2,
                        backgroundColor: GHOST_COLORS[index],
                    }
                })
            )
        ]),

        gameOver && React.createElement('div', {
            key: 'game-over',
            className: 'mt-4 text-red-500 text-2xl font-bold'
        }, 'Game Over!'),

        gameWon && React.createElement('div', {
            key: 'game-won',
            className: 'mt-4 text-green-500 text-2xl font-bold'
        }, 'You Win!')
    ]);
};

ReactDOM.render(
    React.createElement(PacmanGame),
    document.getElementById('root')
);