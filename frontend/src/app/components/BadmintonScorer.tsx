'use client';

import React, { useReducer, useState, useMemo, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Button,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    TextField,
    Divider,
    Alert,
    Paper,
    Collapse,
    Chip,
    Stepper,
    Step,
    StepLabel,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Undo, RestartAlt, ExpandMore, ExpandLess } from '@mui/icons-material';

/* ═══════════════════════════════════════════════════════════════════
   Types & Configuration
   ═══════════════════════════════════════════════════════════════════ */

type ScoreFormat = 11 | 15 | 21 | 31;
type MatchType = 'singles' | 'doubles' | 'mixed';
type BestOf = 1 | 3 | 5;
type MatchMode = 'single' | 'team';

interface FormatConfig {
    label: string;
    maxScore: number;
    deuceCap: number;
    intervalAt: number;
}

const FORMAT_CONFIGS: Record<ScoreFormat, FormatConfig> = {
    11: { label: '11 分制', maxScore: 11, deuceCap: 15, intervalAt: 6 },
    15: { label: '15 分制', maxScore: 15, deuceCap: 17, intervalAt: 8 },
    21: { label: '21 分制', maxScore: 21, deuceCap: 30, intervalAt: 11 },
    31: { label: '31 分制', maxScore: 31, deuceCap: 40, intervalAt: 16 },
};

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
    singles: '單打',
    doubles: '雙打',
    mixed: '混合雙打',
};

const BEST_OF_LABELS: Record<BestOf, string> = {
    1: '單局制',
    3: '三局兩勝',
    5: '五局三勝',
};

/** 隊伍制固定比賽順序（蘇迪曼盃制） */
const TEAM_MATCH_ORDER: { key: string; label: string; short: string; matchType: MatchType }[] = [
    { key: 'MS', label: '男子單打', short: '男單', matchType: 'singles' },
    { key: 'WS', label: '女子單打', short: '女單', matchType: 'singles' },
    { key: 'MD', label: '男子雙打', short: '男雙', matchType: 'doubles' },
    { key: 'WD', label: '女子雙打', short: '女雙', matchType: 'doubles' },
    { key: 'XD', label: '混合雙打', short: '混雙', matchType: 'mixed' },
];

/* ═══════════════════════════════════════════════════════════════════
   Sub-types
   ═══════════════════════════════════════════════════════════════════ */

interface GameResult {
    scores: [number, number];
    winner: 0 | 1;
}

interface TeamSubResult {
    index: number;
    label: string;
    short: string;
    matchType: MatchType;
    games: GameResult[];
    gamesWon: [number, number];
    winner: 0 | 1;
}

interface Snapshot {
    scores: [number, number];
    serving: 0 | 1;
    completedGames: GameResult[];
    gamesWon: [number, number];
    subMatchOver: boolean;
    subMatchWinner: 0 | 1 | null;
    teamCurrentIndex: number;
    teamResults: TeamSubResult[];
    teamWins: [number, number];
    teamOver: boolean;
    teamWinner: 0 | 1 | null;
}

interface MatchState {
    // ── Config ──
    mode: MatchMode;
    format: ScoreFormat;
    matchType: MatchType;
    bestOf: BestOf;
    teamNames: [string, string];

    // ── Current game ──
    scores: [number, number];
    serving: 0 | 1;
    completedGames: GameResult[];
    gamesWon: [number, number];
    /** 當前子比賽是否結束（single mode = 整場結束） */
    subMatchOver: boolean;
    subMatchWinner: 0 | 1 | null;

    // ── Team mode ──
    teamCurrentIndex: number;
    teamResults: TeamSubResult[];
    teamWins: [number, number];
    teamOver: boolean;
    teamWinner: 0 | 1 | null;

    // ── Control ──
    started: boolean;
    history: Snapshot[];
}

/* ═══════════════════════════════════════════════════════════════════
   Scoring Logic — Pure Functions
   ═══════════════════════════════════════════════════════════════════ */

function checkGameWinner(scores: [number, number], format: ScoreFormat): 0 | 1 | null {
    const { maxScore, deuceCap } = FORMAT_CONFIGS[format];
    const [a, b] = scores;
    if (a >= deuceCap) return 0;
    if (b >= deuceCap) return 1;
    if (a >= maxScore && a - b >= 2) return 0;
    if (b >= maxScore && b - a >= 2) return 1;
    return null;
}

function wouldWinGame(scores: [number, number], team: 0 | 1, format: ScoreFormat): boolean {
    const next: [number, number] = [...scores];
    next[team] += 1;
    return checkGameWinner(next, format) === team;
}

function getGamePointTeam(scores: [number, number], format: ScoreFormat): 0 | 1 | null {
    if (wouldWinGame(scores, 0, format)) return 0;
    if (wouldWinGame(scores, 1, format)) return 1;
    return null;
}

function getSubMatchPointTeam(
    scores: [number, number],
    gamesWon: [number, number],
    bestOf: BestOf,
    format: ScoreFormat,
): 0 | 1 | null {
    const gamesToWin = Math.ceil(bestOf / 2);
    const gp = getGamePointTeam(scores, format);
    if (gp === null) return null;
    if (gamesWon[gp] + 1 >= gamesToWin) return gp;
    return null;
}

function isDeuce(scores: [number, number], format: ScoreFormat): boolean {
    const { maxScore } = FORMAT_CONFIGS[format];
    return scores[0] >= maxScore - 1 && scores[1] >= maxScore - 1 && scores[0] === scores[1];
}

function justReachedInterval(
    scores: [number, number],
    history: Snapshot[],
    format: ScoreFormat,
): boolean {
    const { intervalAt } = FORMAT_CONFIGS[format];
    if (Math.max(scores[0], scores[1]) !== intervalAt) return false;
    if (history.length === 0) return true;
    const prev = history[history.length - 1].scores;
    return Math.max(prev[0], prev[1]) < intervalAt;
}

function getServiceCourt(serverScore: number): string {
    return serverScore % 2 === 0 ? '右半場' : '左半場';
}

/* ═══════════════════════════════════════════════════════════════════
   Reducer
   ═══════════════════════════════════════════════════════════════════ */

type Action =
    | { type: 'SCORE'; team: 0 | 1 }
    | { type: 'UNDO' }
    | { type: 'RESET' }
    | { type: 'CONFIG'; format?: ScoreFormat; matchType?: MatchType; bestOf?: BestOf; mode?: MatchMode }
    | { type: 'TEAM_NAME'; team: 0 | 1; name: string }
    | { type: 'SERVING'; team: 0 | 1 }
    | { type: 'START' }
    | { type: 'ADVANCE_TEAM' };

function init(): MatchState {
    return {
        mode: 'single',
        format: 21,
        matchType: 'singles',
        bestOf: 3,
        teamNames: ['A 隊', 'B 隊'],
        scores: [0, 0],
        serving: 0,
        completedGames: [],
        gamesWon: [0, 0],
        subMatchOver: false,
        subMatchWinner: null,
        teamCurrentIndex: 0,
        teamResults: [],
        teamWins: [0, 0],
        teamOver: false,
        teamWinner: null,
        started: false,
        history: [],
    };
}

function takeSnapshot(s: MatchState): Snapshot {
    return {
        scores: [...s.scores] as [number, number],
        serving: s.serving,
        completedGames: s.completedGames.map(g => ({ scores: [...g.scores] as [number, number], winner: g.winner })),
        gamesWon: [...s.gamesWon] as [number, number],
        subMatchOver: s.subMatchOver,
        subMatchWinner: s.subMatchWinner,
        teamCurrentIndex: s.teamCurrentIndex,
        teamResults: s.teamResults.map(r => ({
            ...r,
            games: r.games.map(g => ({ scores: [...g.scores] as [number, number], winner: g.winner })),
            gamesWon: [...r.gamesWon] as [number, number],
        })),
        teamWins: [...s.teamWins] as [number, number],
        teamOver: s.teamOver,
        teamWinner: s.teamWinner,
    };
}

function matchReducer(state: MatchState, action: Action): MatchState {
    switch (action.type) {
        case 'CONFIG': {
            if (state.started) return state;
            return {
                ...state,
                ...(action.format !== undefined && { format: action.format }),
                ...(action.matchType !== undefined && { matchType: action.matchType }),
                ...(action.bestOf !== undefined && { bestOf: action.bestOf }),
                ...(action.mode !== undefined && { mode: action.mode }),
            };
        }

        case 'TEAM_NAME': {
            if (state.started) return state;
            const names: [string, string] = [...state.teamNames];
            names[action.team] = action.name;
            return { ...state, teamNames: names };
        }

        case 'SERVING':
            if (state.started) return state;
            return { ...state, serving: action.team };

        case 'START':
            return { ...state, started: true };

        case 'SCORE': {
            if (state.subMatchOver) return state;
            if (state.mode === 'team' && state.teamOver) return state;

            const snap = takeSnapshot(state);
            const newScores: [number, number] = [...state.scores];
            newScores[action.team] += 1;
            const newServing: 0 | 1 = action.team;
            const gameWinner = checkGameWinner(newScores, state.format);

            if (gameWinner !== null) {
                const newGamesWon: [number, number] = [...state.gamesWon];
                newGamesWon[gameWinner] += 1;
                const newCompletedGames: GameResult[] = [
                    ...state.completedGames,
                    { scores: [...newScores] as [number, number], winner: gameWinner },
                ];
                const gamesToWin = Math.ceil(state.bestOf / 2);

                if (newGamesWon[gameWinner] >= gamesToWin) {
                    // ── 子比賽結束 ──
                    if (state.mode === 'single') {
                        return {
                            ...state,
                            scores: newScores,
                            serving: newServing,
                            completedGames: newCompletedGames,
                            gamesWon: newGamesWon,
                            subMatchOver: true,
                            subMatchWinner: gameWinner,
                            history: [...state.history, snap],
                        };
                    }

                    // ── 隊伍制：當前子比賽結束 ──
                    const def = TEAM_MATCH_ORDER[state.teamCurrentIndex];
                    const newTeamResults: TeamSubResult[] = [
                        ...state.teamResults,
                        {
                            index: state.teamCurrentIndex,
                            label: def.label,
                            short: def.short,
                            matchType: def.matchType,
                            games: newCompletedGames,
                            gamesWon: newGamesWon,
                            winner: gameWinner,
                        },
                    ];
                    const newTeamWins: [number, number] = [...state.teamWins];
                    newTeamWins[gameWinner] += 1;

                    if (newTeamWins[gameWinner] >= 3) {
                        // 隊伍制結束（先取 3 勝）
                        return {
                            ...state,
                            scores: newScores,
                            serving: newServing,
                            completedGames: newCompletedGames,
                            gamesWon: newGamesWon,
                            subMatchOver: true,
                            subMatchWinner: gameWinner,
                            teamResults: newTeamResults,
                            teamWins: newTeamWins,
                            teamOver: true,
                            teamWinner: gameWinner,
                            history: [...state.history, snap],
                        };
                    }

                    // 子比賽結束，等使用者按「下一場」
                    return {
                        ...state,
                        scores: newScores,
                        serving: newServing,
                        completedGames: newCompletedGames,
                        gamesWon: newGamesWon,
                        subMatchOver: true,
                        subMatchWinner: gameWinner,
                        teamResults: newTeamResults,
                        teamWins: newTeamWins,
                        history: [...state.history, snap],
                    };
                }

                // ── 新的一局（sub-match 內） ──
                return {
                    ...state,
                    scores: [0, 0],
                    serving: gameWinner,
                    completedGames: newCompletedGames,
                    gamesWon: newGamesWon,
                    history: [...state.history, snap],
                };
            }

            // ── 比賽繼續 ──
            return {
                ...state,
                scores: newScores,
                serving: newServing,
                history: [...state.history, snap],
            };
        }

        case 'ADVANCE_TEAM': {
            if (state.mode !== 'team' || !state.subMatchOver || state.teamOver) return state;
            const nextIndex = state.teamCurrentIndex + 1;
            if (nextIndex >= TEAM_MATCH_ORDER.length) {
                // 5 場全打完 — 以勝場數決定贏家
                const w: 0 | 1 = state.teamWins[0] >= state.teamWins[1] ? 0 : 1;
                return { ...state, teamOver: true, teamWinner: w };
            }
            return {
                ...state,
                teamCurrentIndex: nextIndex,
                scores: [0, 0],
                serving: 0,
                completedGames: [],
                gamesWon: [0, 0],
                subMatchOver: false,
                subMatchWinner: null,
            };
        }

        case 'UNDO': {
            if (state.history.length === 0) return state;
            const prev = state.history[state.history.length - 1];
            return {
                ...state,
                scores: prev.scores,
                serving: prev.serving,
                completedGames: prev.completedGames,
                gamesWon: prev.gamesWon,
                subMatchOver: prev.subMatchOver,
                subMatchWinner: prev.subMatchWinner,
                teamCurrentIndex: prev.teamCurrentIndex,
                teamResults: prev.teamResults,
                teamWins: prev.teamWins,
                teamOver: prev.teamOver,
                teamWinner: prev.teamWinner,
                history: state.history.slice(0, -1),
            };
        }

        case 'RESET':
            return init();

        default:
            return state;
    }
}

/* ═══════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════ */

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function BadmintonScorer({ open, onClose }: Props) {
    const [state, dispatch] = useReducer(matchReducer, undefined, init);
    const [showLog, setShowLog] = useState(false);
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down('sm'));

    const config = FORMAT_CONFIGS[state.format];
    const gamesToWin = Math.ceil(state.bestOf / 2);
    const isTeam = state.mode === 'team';
    const currentTeamDef = isTeam ? TEAM_MATCH_ORDER[state.teamCurrentIndex] : null;
    const gameNum = state.completedGames.length + 1;
    const isDeciding = state.bestOf > 1
        && state.gamesWon[0] === gamesToWin - 1
        && state.gamesWon[1] === gamesToWin - 1;

    // ── Indicators ──
    const subMatchPt = useMemo(() =>
        state.started && !state.subMatchOver
            ? getSubMatchPointTeam(state.scores, state.gamesWon, state.bestOf, state.format)
            : null,
        [state.scores, state.gamesWon, state.bestOf, state.format, state.started, state.subMatchOver],
    );
    const gamePt = useMemo(() =>
        state.started && !state.subMatchOver && subMatchPt === null
            ? getGamePointTeam(state.scores, state.format)
            : null,
        [state.scores, state.format, state.started, state.subMatchOver, subMatchPt],
    );
    const deuce = useMemo(() =>
        state.started && !state.subMatchOver && isDeuce(state.scores, state.format),
        [state.scores, state.format, state.started, state.subMatchOver],
    );
    const interval = useMemo(() =>
        state.started && !state.subMatchOver
            && justReachedInterval(state.scores, state.history, state.format),
        [state.scores, state.history, state.format, state.started, state.subMatchOver],
    );
    const newGameJustStarted = state.started && !state.subMatchOver
        && state.completedGames.length > 0 && state.bestOf > 1
        && state.scores[0] === 0 && state.scores[1] === 0;

    // ── Handlers ──
    const handleClose = useCallback(() => {
        const inProgress = state.started && !state.subMatchOver && !(isTeam && state.teamOver);
        if (inProgress) {
            if (!window.confirm('比賽進行中，確定要關閉計分器？所有記錄將會遺失。')) return;
        }
        dispatch({ type: 'RESET' });
        onClose();
    }, [state.started, state.subMatchOver, isTeam, state.teamOver, onClose]);

    const handleReset = useCallback(() => {
        if (window.confirm('確定要重置比賽？所有分數和記錄將會清除。')) {
            dispatch({ type: 'RESET' });
        }
    }, []);

    const displayName = (team: 0 | 1) => state.teamNames[team].trim() || (team === 0 ? 'A 隊' : 'B 隊');

    // ════════════════════════════════
    // Config Phase
    // ════════════════════════════════

    const renderConfig = () => (
        <Stack spacing={3}>
            {/* 比賽模式 */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    比賽模式
                </Typography>
                <ToggleButtonGroup
                    value={state.mode}
                    exclusive
                    onChange={(_, v) => v && dispatch({ type: 'CONFIG', mode: v })}
                    size={mobile ? 'small' : 'medium'}
                    fullWidth
                >
                    <ToggleButton value="single">單場制</ToggleButton>
                    <ToggleButton value="team">隊伍制</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* 計分制度 */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    計分制度
                </Typography>
                <ToggleButtonGroup
                    value={state.format}
                    exclusive
                    onChange={(_, v) => v && dispatch({ type: 'CONFIG', format: v })}
                    size={mobile ? 'small' : 'medium'}
                    fullWidth
                >
                    {([21, 11, 15, 31] as ScoreFormat[]).map(f => (
                        <ToggleButton key={f} value={f}>
                            {FORMAT_CONFIGS[f].label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {/* 比賽類型（單場制才選，隊伍制自動依順序） */}
            {state.mode === 'single' && (
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        比賽類型
                    </Typography>
                    <ToggleButtonGroup
                        value={state.matchType}
                        exclusive
                        onChange={(_, v) => v && dispatch({ type: 'CONFIG', matchType: v })}
                        size={mobile ? 'small' : 'medium'}
                        fullWidth
                    >
                        <ToggleButton value="singles">單打</ToggleButton>
                        <ToggleButton value="doubles">雙打</ToggleButton>
                        <ToggleButton value="mixed">混合雙打</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

            {/* 賽制 */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {state.mode === 'team' ? '每場賽制' : '賽制'}
                </Typography>
                <ToggleButtonGroup
                    value={state.bestOf}
                    exclusive
                    onChange={(_, v) => v && dispatch({ type: 'CONFIG', bestOf: v })}
                    size={mobile ? 'small' : 'medium'}
                >
                    <ToggleButton value={1}>單局制</ToggleButton>
                    <ToggleButton value={3}>三局兩勝</ToggleButton>
                    <ToggleButton value={5}>五局三勝</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Divider />

            {/* 隊名 */}
            <Stack direction="row" spacing={2}>
                <TextField
                    label={isTeam ? '隊伍 A' : '選手/隊伍 A'}
                    size="small"
                    fullWidth
                    value={state.teamNames[0]}
                    onChange={e => dispatch({ type: 'TEAM_NAME', team: 0, name: e.target.value })}
                    inputProps={{ maxLength: 20 }}
                />
                <TextField
                    label={isTeam ? '隊伍 B' : '選手/隊伍 B'}
                    size="small"
                    fullWidth
                    value={state.teamNames[1]}
                    onChange={e => dispatch({ type: 'TEAM_NAME', team: 1, name: e.target.value })}
                    inputProps={{ maxLength: 20 }}
                />
            </Stack>

            {/* 先發球方 */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    先發球方
                </Typography>
                <ToggleButtonGroup
                    value={state.serving}
                    exclusive
                    onChange={(_, v) => v !== null && dispatch({ type: 'SERVING', team: v })}
                    size="small"
                >
                    <ToggleButton value={0}>{displayName(0)}</ToggleButton>
                    <ToggleButton value={1}>{displayName(1)}</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* 規則說明 */}
            <Alert severity="info" variant="outlined">
                <Typography variant="body2">
                    <strong>{config.label}</strong>：先達 {config.maxScore} 分且領先 2 分者勝一局，
                    平分上限 {config.deuceCap} 分（突然死亡）。
                    {BEST_OF_LABELS[state.bestOf]}。
                    {isTeam && (
                        <> 隊伍制依序進行：男單→女單→男雙→女雙→混雙，先取 3 勝者獲勝。</>
                    )}
                </Typography>
            </Alert>

            <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => dispatch({ type: 'START' })}
                sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
                🏸 開始比賽
            </Button>
        </Stack>
    );

    // ════════════════════════════════
    // Score Board (共用計分區)
    // ════════════════════════════════

    const renderScoreBoard = () => (
        <Stack spacing={2}>
            {/* ── 狀態警示 ── */}
            {subMatchPt !== null && (
                <Alert severity="error" icon={false} sx={{ justifyContent: 'center', fontWeight: 'bold' }}>
                    🏆 {state.bestOf === 1 ? '賽末點' : isTeam ? '場末點' : '賽末點'} — {displayName(subMatchPt)}
                </Alert>
            )}
            {gamePt !== null && state.bestOf > 1 && (
                <Alert severity="warning" icon={false} sx={{ justifyContent: 'center', fontWeight: 'bold' }}>
                    ⚡ 局末點 — {displayName(gamePt)}
                </Alert>
            )}
            {deuce && (
                <Alert severity="info" icon={false} sx={{ justifyContent: 'center' }}>
                    🔥 Deuce！須領先 2 分（上限 {config.deuceCap} 分）
                </Alert>
            )}
            {interval && (
                <Alert severity="success" icon={false} sx={{ justifyContent: 'center' }}>
                    ⏱️ 技術暫停（60 秒）{isDeciding ? ' — 請交換場地' : ''}
                </Alert>
            )}
            {newGameJustStarted && (
                <Alert severity="info" icon={false} sx={{ justifyContent: 'center' }}>
                    🏸 第 {gameNum} 局開始！請交換場地。
                </Alert>
            )}

            {/* ── 分數顯示 ── */}
            <Stack direction="row" spacing={2} justifyContent="center">
                {([0, 1] as const).map(team => (
                    <Paper
                        key={team}
                        elevation={state.serving === team ? 6 : 1}
                        sx={{
                            flex: 1,
                            maxWidth: 220,
                            p: 2,
                            textAlign: 'center',
                            borderRadius: 3,
                            border: '2px solid',
                            borderColor: state.serving === team ? 'primary.main' : 'divider',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                            {displayName(team)}
                        </Typography>
                        {state.serving === team && (
                            <Chip
                                label={`🏸 ${getServiceCourt(state.scores[team])}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                        <Typography
                            sx={{
                                fontSize: { xs: '3.5rem', sm: '4.5rem' },
                                fontWeight: 900,
                                lineHeight: 1.2,
                                my: 1,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {state.scores[team]}
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => dispatch({ type: 'SCORE', team })}
                            sx={{ py: 1.5, fontSize: '1.3rem', fontWeight: 'bold', borderRadius: 2 }}
                        >
                            得分 +1
                        </Button>
                    </Paper>
                ))}
            </Stack>

            {/* ── 操作按鈕 ── */}
            <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                    startIcon={<Undo />}
                    onClick={() => dispatch({ type: 'UNDO' })}
                    disabled={state.history.length === 0}
                    variant="outlined"
                    size="small"
                >
                    撤銷 ({state.history.length})
                </Button>
                <Button
                    startIcon={<RestartAlt />}
                    onClick={handleReset}
                    color="error"
                    variant="outlined"
                    size="small"
                >
                    重置比賽
                </Button>
            </Stack>

            {/* ── 已完成局數 ── */}
            {state.completedGames.length > 0 && state.bestOf > 1 && (
                <>
                    <Divider />
                    <Button
                        onClick={() => setShowLog(!showLog)}
                        endIcon={showLog ? <ExpandLess /> : <ExpandMore />}
                        size="small"
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                        本場已完成局數 ({state.completedGames.length})
                    </Button>
                    <Collapse in={showLog}>
                        <Stack spacing={1}>
                            {state.completedGames.map((g, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight="bold">第 {i + 1} 局</Typography>
                                        <Typography variant="body1" fontWeight="bold" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {g.scores[0]} : {g.scores[1]}
                                        </Typography>
                                        <Chip label={`${displayName(g.winner)} 勝`} size="small" color="primary" variant="outlined" />
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Collapse>
                </>
            )}
        </Stack>
    );

    // ════════════════════════════════
    // Playing — Single Mode
    // ════════════════════════════════

    const renderSinglePlaying = () => (
        <Stack spacing={2}>
            <Stack direction="row" justifyContent="center" spacing={1} flexWrap="wrap" useFlexGap>
                {state.bestOf > 1 && <Chip label={`第 ${gameNum} 局`} color="primary" size="small" />}
                {state.bestOf > 1 && (
                    <Chip label={`局數 ${state.gamesWon[0]}:${state.gamesWon[1]}`} variant="outlined" size="small" />
                )}
                <Chip label={config.label} variant="outlined" size="small" />
                <Chip label={MATCH_TYPE_LABELS[state.matchType]} variant="outlined" size="small" />
                <Chip label={BEST_OF_LABELS[state.bestOf]} variant="outlined" size="small" />
            </Stack>
            {renderScoreBoard()}
        </Stack>
    );

    // ════════════════════════════════
    // Playing — Team Mode
    // ════════════════════════════════

    const renderTeamPlaying = () => {
        const nextDef = state.teamCurrentIndex + 1 < TEAM_MATCH_ORDER.length
            ? TEAM_MATCH_ORDER[state.teamCurrentIndex + 1]
            : null;

        return (
            <Stack spacing={2}>
                {/* 隊伍戰進度 */}
                <Stepper
                    activeStep={state.teamCurrentIndex}
                    alternativeLabel
                    sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem' }, mb: 1 }}
                >
                    {TEAM_MATCH_ORDER.map((m, i) => {
                        const result = state.teamResults.find(r => r.index === i);
                        return (
                            <Step key={m.key} completed={!!result}>
                                <StepLabel
                                    sx={{
                                        '& .MuiStepIcon-root.Mui-completed': {
                                            color: result
                                                ? (result.winner === 0 ? 'primary.main' : 'error.main')
                                                : undefined,
                                        },
                                    }}
                                >
                                    {m.short}
                                    {result && (
                                        <Typography variant="caption" display="block" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {result.gamesWon[0]}:{result.gamesWon[1]}
                                        </Typography>
                                    )}
                                </StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>

                {/* 隊伍總比分 */}
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
                    <Typography variant="h6" fontWeight="bold">{displayName(0)}</Typography>
                    <Typography
                        variant="h4"
                        fontWeight="900"
                        sx={{ fontVariantNumeric: 'tabular-nums', color: 'primary.main' }}
                    >
                        {state.teamWins[0]} : {state.teamWins[1]}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">{displayName(1)}</Typography>
                </Stack>

                {/* 當前子比賽資訊 */}
                {currentTeamDef && !state.subMatchOver && (
                    <Stack direction="row" justifyContent="center" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                            label={`第 ${state.teamCurrentIndex + 1} 場：${currentTeamDef.label}`}
                            color="secondary"
                            size="small"
                        />
                        {state.bestOf > 1 && <Chip label={`第 ${gameNum} 局`} size="small" />}
                        {state.bestOf > 1 && (
                            <Chip label={`局數 ${state.gamesWon[0]}:${state.gamesWon[1]}`} variant="outlined" size="small" />
                        )}
                        <Chip label={config.label} variant="outlined" size="small" />
                        <Chip label={BEST_OF_LABELS[state.bestOf]} variant="outlined" size="small" />
                    </Stack>
                )}

                {/* 子比賽結束 → 顯示結果 & 下一場按鈕 */}
                {state.subMatchOver && !state.teamOver && currentTeamDef && (
                    <Alert severity="success" sx={{ textAlign: 'center' }}>
                        <Typography fontWeight="bold">
                            {currentTeamDef.label}結束 — {displayName(state.subMatchWinner!)} 勝
                            {state.bestOf > 1 && `（${state.gamesWon[0]}:${state.gamesWon[1]}）`}
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Undo />}
                                onClick={() => dispatch({ type: 'UNDO' })}
                                disabled={state.history.length === 0}
                            >
                                撤銷
                            </Button>
                            {nextDef && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => dispatch({ type: 'ADVANCE_TEAM' })}
                                >
                                    開始下一場：{nextDef.label}
                                </Button>
                            )}
                        </Stack>
                    </Alert>
                )}

                {/* 計分區（子比賽進行中才顯示） */}
                {!state.subMatchOver && renderScoreBoard()}
            </Stack>
        );
    };

    // ════════════════════════════════
    // Match Over
    // ════════════════════════════════

    const renderMatchOver = () => {
        const winner = isTeam ? state.teamWinner! : state.subMatchWinner!;

        return (
            <Stack spacing={3} alignItems="center">
                <Typography variant="h4" fontWeight="900" sx={{ mt: 1 }}>
                    🎉 比賽結束
                </Typography>

                <Paper
                    sx={{
                        p: 3, borderRadius: 3, textAlign: 'center', width: '100%',
                        background: 'linear-gradient(135deg, rgba(102,187,106,0.15) 0%, rgba(66,165,245,0.15) 100%)',
                    }}
                >
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                        🏆 {displayName(winner)}
                    </Typography>
                    {isTeam && (
                        <Typography variant="h6" sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}>
                            團體戰 {state.teamWins[0]} : {state.teamWins[1]}
                        </Typography>
                    )}
                    {!isTeam && state.bestOf > 1 && (
                        <Typography variant="h6" sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}>
                            局數 {state.gamesWon[0]} : {state.gamesWon[1]}
                        </Typography>
                    )}
                </Paper>

                {/* 詳細記錄 */}
                <Stack spacing={1} sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">比賽詳細記錄</Typography>
                    {isTeam ? (
                        state.teamResults.map((r, i) => (
                            <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                    <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 48 }}>
                                        {r.short}
                                    </Typography>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                        {r.games.map((g, gi) => (
                                            <Chip
                                                key={gi}
                                                label={`${g.scores[0]}-${g.scores[1]}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontVariantNumeric: 'tabular-nums' }}
                                            />
                                        ))}
                                    </Stack>
                                    <Chip
                                        label={`${displayName(r.winner)} 勝`}
                                        size="small"
                                        color={r.winner === winner ? 'primary' : 'default'}
                                    />
                                </Stack>
                            </Paper>
                        ))
                    ) : (
                        state.completedGames.map((g, i) => (
                            <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight="bold">第 {i + 1} 局</Typography>
                                    <Typography variant="body1" fontWeight="bold" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {g.scores[0]} : {g.scores[1]}
                                    </Typography>
                                    <Chip label={`${displayName(g.winner)} 勝`} size="small" color="primary" />
                                </Stack>
                            </Paper>
                        ))
                    )}
                </Stack>

                <Typography variant="caption" color="text.secondary" textAlign="center">
                    {config.label} · {isTeam ? '隊伍制' : MATCH_TYPE_LABELS[state.matchType]} · {BEST_OF_LABELS[state.bestOf]}
                </Typography>

                <Divider sx={{ width: '100%' }} />

                <Button variant="contained" size="large" onClick={() => dispatch({ type: 'RESET' })} sx={{ px: 4 }}>
                    開始新比賽
                </Button>
            </Stack>
        );
    };

    // ════════════════════════════════
    // Main Render
    // ════════════════════════════════

    const isOver = isTeam ? state.teamOver : state.subMatchOver;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            fullScreen={mobile}
            PaperProps={{ sx: { borderRadius: mobile ? 0 : 3 } }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pb: 1 }}>
                🏸 羽球計分器
                {state.started && !isOver && (
                    <Typography variant="body2" color="text.secondary">
                        {isTeam ? `隊伍制 · ${currentTeamDef?.label ?? ''}` : MATCH_TYPE_LABELS[state.matchType]}
                        {' · '}{config.label} · {BEST_OF_LABELS[state.bestOf]}
                    </Typography>
                )}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
                {!state.started && renderConfig()}
                {state.started && !isOver && !isTeam && renderSinglePlaying()}
                {state.started && !isOver && isTeam && renderTeamPlaying()}
                {state.started && isOver && renderMatchOver()}
            </DialogContent>
            <Divider />
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleClose} color="inherit" size="small">
                    {state.started && !isOver ? '關閉計分器' : '關閉'}
                </Button>
            </Box>
        </Dialog>
    );
}
