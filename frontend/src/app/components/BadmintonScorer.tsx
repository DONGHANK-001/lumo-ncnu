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
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Undo, RestartAlt, ExpandMore, ExpandLess } from '@mui/icons-material';

/* ═══════════════════════════════════════════════════════════════════
   Types & Configuration
   ═══════════════════════════════════════════════════════════════════ */

type ScoreFormat = 11 | 15 | 21 | 31;
type MatchType = 'singles' | 'doubles' | 'mixed';
type BestOf = 3 | 5;

interface FormatConfig {
    label: string;
    maxScore: number;
    /** 平分上限（突然死亡分數） */
    deuceCap: number;
    /** 技術暫停觸發分數 */
    intervalAt: number;
}

/**
 * 計分制度規則：
 * - 21 分制（BWF 標準）：20 平後須領先 2 分，29 平時搶 30（突然死亡）
 * - 11 分制（BWF 新制）：10 平後須領先 2 分，14 平時搶 15
 * - 15 分制（傳統制）  ：14 平後須領先 2 分，16 平時搶 17
 * - 31 分制（舊制）    ：30 平後須領先 2 分，39 平時搶 40
 */
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

interface GameResult {
    scores: [number, number];
    winner: 0 | 1;
}

interface Snapshot {
    scores: [number, number];
    serving: 0 | 1;
    completedGames: GameResult[];
    gamesWon: [number, number];
    matchOver: boolean;
    matchWinner: 0 | 1 | null;
}

interface MatchState {
    format: ScoreFormat;
    matchType: MatchType;
    bestOf: BestOf;
    teamNames: [string, string];
    scores: [number, number];
    serving: 0 | 1;
    completedGames: GameResult[];
    gamesWon: [number, number];
    matchOver: boolean;
    matchWinner: 0 | 1 | null;
    started: boolean;
    history: Snapshot[];
}

/* ═══════════════════════════════════════════════════════════════════
   Scoring Logic — Pure Functions
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 判斷當前局是否結束。
 * 規則：達到 maxScore 且領先 ≥ 2 分勝出；
 *       達到 deuceCap 則突然死亡（先到者勝）。
 */
function checkGameWinner(scores: [number, number], format: ScoreFormat): 0 | 1 | null {
    const { maxScore, deuceCap } = FORMAT_CONFIGS[format];
    const [a, b] = scores;

    // 突然死亡
    if (a >= deuceCap) return 0;
    if (b >= deuceCap) return 1;

    // 正常勝出
    if (a >= maxScore && a - b >= 2) return 0;
    if (b >= maxScore && b - a >= 2) return 1;

    return null;
}

/** 若 team 再得 1 分是否贏下這一局 */
function wouldWinGame(scores: [number, number], team: 0 | 1, format: ScoreFormat): boolean {
    const next: [number, number] = [...scores];
    next[team] += 1;
    return checkGameWinner(next, format) === team;
}

/** 局末點：哪一方再得 1 分就贏下這一局，null 表示都不是 */
function getGamePointTeam(scores: [number, number], format: ScoreFormat): 0 | 1 | null {
    if (wouldWinGame(scores, 0, format)) return 0;
    if (wouldWinGame(scores, 1, format)) return 1;
    return null;
}

/** 賽末點：同時是局末點且贏下這一局就贏得整場比賽 */
function getMatchPointTeam(
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

/** 是否處於 Deuce（雙方都達 maxScore-1 且同分） */
function isDeuce(scores: [number, number], format: ScoreFormat): boolean {
    const { maxScore } = FORMAT_CONFIGS[format];
    return scores[0] >= maxScore - 1 && scores[1] >= maxScore - 1 && scores[0] === scores[1];
}

/**
 * 是否「剛好」到達技術暫停分數（只在領先方分數首次抵達 intervalAt 時觸發一次）。
 * 透過比對上一筆 history 判斷是不是「剛到」而非「已經過了」。
 */
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

/**
 * 發球方站位：依 BWF 規則，發球方自身分數為偶數時站右半場，奇數站左半場。
 */
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
    | { type: 'CONFIG'; format?: ScoreFormat; matchType?: MatchType; bestOf?: BestOf }
    | { type: 'TEAM_NAME'; team: 0 | 1; name: string }
    | { type: 'SERVING'; team: 0 | 1 }
    | { type: 'START' };

function init(): MatchState {
    return {
        format: 21,
        matchType: 'singles',
        bestOf: 3,
        teamNames: ['A 隊', 'B 隊'],
        scores: [0, 0],
        serving: 0,
        completedGames: [],
        gamesWon: [0, 0],
        matchOver: false,
        matchWinner: null,
        started: false,
        history: [],
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
            if (state.matchOver) return state;

            // 建立快照供撤銷使用
            const snap: Snapshot = {
                scores: [...state.scores] as [number, number],
                serving: state.serving,
                completedGames: state.completedGames.map(g => ({
                    scores: [...g.scores] as [number, number],
                    winner: g.winner,
                })),
                gamesWon: [...state.gamesWon] as [number, number],
                matchOver: false,
                matchWinner: null,
            };

            const newScores: [number, number] = [...state.scores];
            newScores[action.team] += 1;

            // BWF 規則：得分方取得發球權
            const newServing: 0 | 1 = action.team;

            const winner = checkGameWinner(newScores, state.format);

            if (winner !== null) {
                const newGamesWon: [number, number] = [...state.gamesWon];
                newGamesWon[winner] += 1;
                const newCompleted: GameResult[] = [
                    ...state.completedGames,
                    { scores: [...newScores] as [number, number], winner },
                ];
                const gamesToWin = Math.ceil(state.bestOf / 2);

                if (newGamesWon[winner] >= gamesToWin) {
                    // ── 比賽結束 ──
                    return {
                        ...state,
                        scores: newScores,
                        serving: newServing,
                        completedGames: newCompleted,
                        gamesWon: newGamesWon,
                        matchOver: true,
                        matchWinner: winner,
                        history: [...state.history, snap],
                    };
                }

                // ── 新的一局：勝方先發球，交換場地 ──
                return {
                    ...state,
                    scores: [0, 0],
                    serving: winner,
                    completedGames: newCompleted,
                    gamesWon: newGamesWon,
                    matchOver: false,
                    matchWinner: null,
                    history: [...state.history, snap],
                };
            }

            return {
                ...state,
                scores: newScores,
                serving: newServing,
                history: [...state.history, snap],
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
                matchOver: prev.matchOver,
                matchWinner: prev.matchWinner,
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
    const gameNum = state.completedGames.length + 1;
    const gamesToWin = Math.ceil(state.bestOf / 2);
    const isDeciding = state.gamesWon[0] === gamesToWin - 1 && state.gamesWon[1] === gamesToWin - 1;

    // ── 即時狀態指標（memoized）──

    const matchPt = useMemo(() =>
        state.started && !state.matchOver
            ? getMatchPointTeam(state.scores, state.gamesWon, state.bestOf, state.format)
            : null,
        [state.scores, state.gamesWon, state.bestOf, state.format, state.started, state.matchOver],
    );

    const gamePt = useMemo(() =>
        state.started && !state.matchOver && matchPt === null
            ? getGamePointTeam(state.scores, state.format)
            : null,
        [state.scores, state.format, state.started, state.matchOver, matchPt],
    );

    const deuce = useMemo(() =>
        state.started && !state.matchOver && isDeuce(state.scores, state.format),
        [state.scores, state.format, state.started, state.matchOver],
    );

    const interval = useMemo(() =>
        state.started && !state.matchOver
            && justReachedInterval(state.scores, state.history, state.format),
        [state.scores, state.history, state.format, state.started, state.matchOver],
    );

    const newGameJustStarted = state.started && !state.matchOver
        && state.completedGames.length > 0
        && state.scores[0] === 0 && state.scores[1] === 0;

    // ── Event Handlers ──

    const handleClose = useCallback(() => {
        if (state.started && !state.matchOver) {
            if (!window.confirm('比賽進行中，確定要關閉計分器？所有記錄將會遺失。')) return;
        }
        dispatch({ type: 'RESET' });
        onClose();
    }, [state.started, state.matchOver, onClose]);

    const handleReset = useCallback(() => {
        if (window.confirm('確定要重置比賽？所有分數和記錄將會清除。')) {
            dispatch({ type: 'RESET' });
        }
    }, []);

    const displayName = (team: 0 | 1) => state.teamNames[team].trim() || (team === 0 ? 'A 隊' : 'B 隊');

    // ════════════════════════════════════════
    // Config Phase
    // ════════════════════════════════════════

    const renderConfig = () => (
        <Stack spacing={3}>
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

            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    賽制
                </Typography>
                <ToggleButtonGroup
                    value={state.bestOf}
                    exclusive
                    onChange={(_, v) => v && dispatch({ type: 'CONFIG', bestOf: v })}
                    size={mobile ? 'small' : 'medium'}
                >
                    <ToggleButton value={3}>三局兩勝</ToggleButton>
                    <ToggleButton value={5}>五局三勝</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Divider />

            <Stack direction="row" spacing={2}>
                <TextField
                    label="隊伍 A"
                    size="small"
                    fullWidth
                    value={state.teamNames[0]}
                    onChange={e => dispatch({ type: 'TEAM_NAME', team: 0, name: e.target.value })}
                    inputProps={{ maxLength: 20 }}
                />
                <TextField
                    label="隊伍 B"
                    size="small"
                    fullWidth
                    value={state.teamNames[1]}
                    onChange={e => dispatch({ type: 'TEAM_NAME', team: 1, name: e.target.value })}
                    inputProps={{ maxLength: 20 }}
                />
            </Stack>

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

            <Alert severity="info" variant="outlined">
                <Typography variant="body2">
                    <strong>{config.label}</strong>：先達 {config.maxScore} 分且領先 2 分者勝一局，
                    平分上限 {config.deuceCap} 分（突然死亡）。
                    {state.bestOf === 3 ? '三局兩勝制。' : '五局三勝制。'}
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

    // ════════════════════════════════════════
    // Playing Phase
    // ════════════════════════════════════════

    const renderPlaying = () => (
        <Stack spacing={2}>
            {/* 比賽資訊列 */}
            <Stack direction="row" justifyContent="center" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`第 ${gameNum} 局`} color="primary" size="small" />
                <Chip
                    label={`局數 ${state.gamesWon[0]}:${state.gamesWon[1]}`}
                    variant="outlined"
                    size="small"
                />
                <Chip label={config.label} variant="outlined" size="small" />
                <Chip label={MATCH_TYPE_LABELS[state.matchType]} variant="outlined" size="small" />
            </Stack>

            {/* ── 狀態警示 ── */}
            {matchPt !== null && (
                <Alert severity="error" icon={false} sx={{ justifyContent: 'center', fontWeight: 'bold' }}>
                    🏆 賽末點 — {displayName(matchPt)}
                </Alert>
            )}
            {gamePt !== null && (
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
                    🏸 第 {gameNum} 局開始！
                    {displayName(state.completedGames[state.completedGames.length - 1].winner)} 先發球。
                    請交換場地。
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
                            sx={{
                                py: 1.5,
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                borderRadius: 2,
                            }}
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

            {/* ── 已完成局數記錄 ── */}
            {state.completedGames.length > 0 && (
                <>
                    <Divider />
                    <Button
                        onClick={() => setShowLog(!showLog)}
                        endIcon={showLog ? <ExpandLess /> : <ExpandMore />}
                        size="small"
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                        已完成局數 ({state.completedGames.length})
                    </Button>
                    <Collapse in={showLog}>
                        <Stack spacing={1}>
                            {state.completedGames.map((g, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight="bold">
                                            第 {i + 1} 局
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            fontWeight="bold"
                                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            {g.scores[0]} : {g.scores[1]}
                                        </Typography>
                                        <Chip
                                            label={`${displayName(g.winner)} 勝`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Collapse>
                </>
            )}
        </Stack>
    );

    // ════════════════════════════════════════
    // Match Over Phase
    // ════════════════════════════════════════

    const renderMatchOver = () => (
        <Stack spacing={3} alignItems="center">
            <Typography variant="h4" fontWeight="900" sx={{ mt: 1 }}>
                🎉 比賽結束
            </Typography>

            <Paper
                sx={{
                    p: 3,
                    borderRadius: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(102,187,106,0.15) 0%, rgba(66,165,245,0.15) 100%)',
                    width: '100%',
                }}
            >
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                    🏆 {displayName(state.matchWinner!)}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}>
                    局數 {state.gamesWon[0]} : {state.gamesWon[1]}
                </Typography>
            </Paper>

            <Stack spacing={1} sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary">
                    比賽詳細記錄
                </Typography>
                {state.completedGames.map((g, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight="bold">
                                第 {i + 1} 局
                            </Typography>
                            <Typography
                                variant="body1"
                                fontWeight="bold"
                                sx={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                                {g.scores[0]} : {g.scores[1]}
                            </Typography>
                            <Chip
                                label={`${displayName(g.winner)} 勝`}
                                size="small"
                                color="primary"
                            />
                        </Stack>
                    </Paper>
                ))}
            </Stack>

            <Stack spacing={1} sx={{ width: '100%' }}>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                    {config.label} · {MATCH_TYPE_LABELS[state.matchType]} · {state.bestOf === 3 ? '三局兩勝' : '五局三勝'}
                </Typography>
            </Stack>

            <Divider sx={{ width: '100%' }} />

            <Button
                variant="contained"
                size="large"
                onClick={() => dispatch({ type: 'RESET' })}
                sx={{ px: 4 }}
            >
                開始新比賽
            </Button>
        </Stack>
    );

    // ════════════════════════════════════════
    // Render
    // ════════════════════════════════════════

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
                {state.started && !state.matchOver && (
                    <Typography variant="body2" color="text.secondary">
                        {MATCH_TYPE_LABELS[state.matchType]} · {config.label} · {state.bestOf === 3 ? '三局兩勝' : '五局三勝'}
                    </Typography>
                )}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
                {!state.started && renderConfig()}
                {state.started && !state.matchOver && renderPlaying()}
                {state.matchOver && renderMatchOver()}
            </DialogContent>
            <Divider />
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleClose} color="inherit" size="small">
                    {state.started && !state.matchOver ? '關閉計分器' : '關閉'}
                </Button>
            </Box>
        </Dialog>
    );
}
