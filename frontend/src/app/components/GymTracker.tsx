'use client';

import React, { useReducer, useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Button,
    Stack,
    IconButton,
    TextField,
    Divider,
    Alert,
    Paper,
    Chip,
    Collapse,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Add,
    Remove,
    Delete,
    Timer,
    FitnessCenter,
    PlayArrow,
    Pause,
    RestartAlt,
    ExpandMore,
    ExpandLess,
    CheckCircle,
} from '@mui/icons-material';

/* ═══════════════════════════════════════════════════════════════════
   Types & Configuration
   ═══════════════════════════════════════════════════════════════════ */

type ExerciseMode = 'reps' | 'timed';

interface EquipmentDef {
    key: string;
    label: string;
    emoji: string;
    category: string;
    defaultMode: ExerciseMode;
}

const EQUIPMENT_CATEGORIES = [
    { key: 'free', label: '🏋️ 自由重量' },
    { key: 'machine', label: '🔧 固定式機械' },
    { key: 'cardio', label: '🏃 有氧器材' },
    { key: 'functional', label: '🧘 功能性/伸展' },
];

const PRESET_EXERCISES: EquipmentDef[] = [
    // ── 自由重量 Free Weights ──
    { key: 'barbell_bench', label: '槓鈴臥推', emoji: '🏋️', category: 'free', defaultMode: 'reps' },
    { key: 'dumbbell_bench', label: '啞鈴臥推', emoji: '💪', category: 'free', defaultMode: 'reps' },
    { key: 'incline_bench', label: '上斜臥推', emoji: '🏋️', category: 'free', defaultMode: 'reps' },
    { key: 'barbell_squat', label: '槓鈴深蹲', emoji: '🦵', category: 'free', defaultMode: 'reps' },
    { key: 'deadlift', label: '硬舉', emoji: '🏋️', category: 'free', defaultMode: 'reps' },
    { key: 'barbell_row', label: '槓鈴划船', emoji: '🚣', category: 'free', defaultMode: 'reps' },
    { key: 'overhead_press', label: '槓鈴肩推', emoji: '🙆', category: 'free', defaultMode: 'reps' },
    { key: 'dumbbell_row', label: '啞鈴划船', emoji: '🚣', category: 'free', defaultMode: 'reps' },
    { key: 'dumbbell_fly', label: '啞鈴飛鳥', emoji: '🦅', category: 'free', defaultMode: 'reps' },
    { key: 'dumbbell_shoulder', label: '啞鈴肩推', emoji: '🙆', category: 'free', defaultMode: 'reps' },
    { key: 'lateral_raise', label: '啞鈴側平舉', emoji: '🤸', category: 'free', defaultMode: 'reps' },
    { key: 'front_raise', label: '啞鈴前平舉', emoji: '🤸', category: 'free', defaultMode: 'reps' },
    { key: 'bicep_curl', label: '啞鈴二頭彎舉', emoji: '💪', category: 'free', defaultMode: 'reps' },
    { key: 'barbell_curl', label: '槓鈴二頭彎舉', emoji: '💪', category: 'free', defaultMode: 'reps' },
    { key: 'hammer_curl', label: '錘式彎舉', emoji: '🔨', category: 'free', defaultMode: 'reps' },
    { key: 'skull_crusher', label: '仰臥三頭伸展', emoji: '💀', category: 'free', defaultMode: 'reps' },
    { key: 'lunge', label: '啞鈴弓步蹲', emoji: '🚶', category: 'free', defaultMode: 'reps' },
    { key: 'goblet_squat', label: '高腳杯深蹲', emoji: '🦵', category: 'free', defaultMode: 'reps' },
    { key: 'kettlebell_swing', label: '壺鈴擺盪', emoji: '🔔', category: 'free', defaultMode: 'reps' },
    { key: 'clean_press', label: '上搏挺舉', emoji: '🏋️', category: 'free', defaultMode: 'reps' },

    // ── 固定式機械 Machine Weights ──
    { key: 'lat_pulldown', label: '滑輪下拉', emoji: '🔽', category: 'machine', defaultMode: 'reps' },
    { key: 'seated_row', label: '坐姿划船機', emoji: '🪑', category: 'machine', defaultMode: 'reps' },
    { key: 'leg_press', label: '腿推機', emoji: '🦿', category: 'machine', defaultMode: 'reps' },
    { key: 'leg_extension', label: '腿伸展機', emoji: '🦵', category: 'machine', defaultMode: 'reps' },
    { key: 'leg_curl', label: '腿彎舉機', emoji: '🦵', category: 'machine', defaultMode: 'reps' },
    { key: 'chest_press', label: '坐姿推胸機', emoji: '🏋️', category: 'machine', defaultMode: 'reps' },
    { key: 'pec_deck', label: '蝴蝶機夾胸', emoji: '🦋', category: 'machine', defaultMode: 'reps' },
    { key: 'cable_crossover', label: '纜繩夾胸', emoji: '🔗', category: 'machine', defaultMode: 'reps' },
    { key: 'cable_pushdown', label: '纜繩三頭下壓', emoji: '🔽', category: 'machine', defaultMode: 'reps' },
    { key: 'face_pull', label: 'Face Pull', emoji: '🔗', category: 'machine', defaultMode: 'reps' },
    { key: 'smith_squat', label: '史密斯深蹲', emoji: '🦵', category: 'machine', defaultMode: 'reps' },
    { key: 'smith_bench', label: '史密斯臥推', emoji: '🏋️', category: 'machine', defaultMode: 'reps' },
    { key: 'hack_squat', label: '哈克深蹲機', emoji: '🦵', category: 'machine', defaultMode: 'reps' },
    { key: 'calf_raise_m', label: '小腿上提機', emoji: '🦶', category: 'machine', defaultMode: 'reps' },
    { key: 'ab_machine', label: '腹肌訓練機', emoji: '🧘', category: 'machine', defaultMode: 'reps' },
    { key: 'pull_up_assist', label: '輔助引體向上機', emoji: '🧗', category: 'machine', defaultMode: 'reps' },

    // ── 有氧器材 Cardio Equipment ──
    { key: 'treadmill', label: '跑步機', emoji: '🏃', category: 'cardio', defaultMode: 'timed' },
    { key: 'elliptical', label: '橢圓機', emoji: '🚴', category: 'cardio', defaultMode: 'timed' },
    { key: 'stationary_bike', label: '飛輪', emoji: '🚲', category: 'cardio', defaultMode: 'timed' },
    { key: 'rowing_machine', label: '划船機', emoji: '🚣', category: 'cardio', defaultMode: 'timed' },
    { key: 'stair_climber', label: '階梯機', emoji: '🪜', category: 'cardio', defaultMode: 'timed' },
    { key: 'jump_rope', label: '跳繩', emoji: '🪢', category: 'cardio', defaultMode: 'timed' },
    { key: 'jumping_jack', label: '開合跳', emoji: '🤸', category: 'cardio', defaultMode: 'timed' },
    { key: 'burpee', label: '波比跳', emoji: '🤸', category: 'cardio', defaultMode: 'reps' },

    // ── 功能性/伸展 Functional/Stretching ──
    { key: 'plank', label: '棒式', emoji: '🧘', category: 'functional', defaultMode: 'timed' },
    { key: 'side_plank', label: '側棒式', emoji: '🧘', category: 'functional', defaultMode: 'timed' },
    { key: 'crunch', label: '捲腹', emoji: '🧘', category: 'functional', defaultMode: 'reps' },
    { key: 'russian_twist', label: '俄式轉體', emoji: '🔄', category: 'functional', defaultMode: 'reps' },
    { key: 'leg_raise', label: '懸吊抬腿', emoji: '🦵', category: 'functional', defaultMode: 'reps' },
    { key: 'pull_up', label: '引體向上', emoji: '🧗', category: 'functional', defaultMode: 'reps' },
    { key: 'push_up', label: '伏地挺身', emoji: '🫸', category: 'functional', defaultMode: 'reps' },
    { key: 'dip', label: '雙槓撐體', emoji: '💪', category: 'functional', defaultMode: 'reps' },
    { key: 'trx_row', label: 'TRX 划船', emoji: '🔗', category: 'functional', defaultMode: 'reps' },
    { key: 'trx_squat', label: 'TRX 深蹲', emoji: '🦵', category: 'functional', defaultMode: 'reps' },
    { key: 'turkish_getup', label: '土耳其起立', emoji: '🧎', category: 'functional', defaultMode: 'reps' },
    { key: 'yoga_stretch', label: '瑜伽伸展', emoji: '🧘', category: 'functional', defaultMode: 'timed' },
    { key: 'foam_roll', label: '滾筒放鬆', emoji: '🧘', category: 'functional', defaultMode: 'timed' },
    { key: 'band_pull_apart', label: '彈力帶拉開', emoji: '🔗', category: 'functional', defaultMode: 'reps' },
];

/* ═══════════════════════════════════════════════════════════════════
   State Types
   ═══════════════════════════════════════════════════════════════════ */

interface SetRecord {
    id: number;
    reps?: number;
    weight?: number;
    duration?: number; // seconds
    done: boolean;
}

interface ExerciseEntry {
    id: number;
    exerciseKey: string;
    label: string;
    emoji: string;
    mode: ExerciseMode;
    sets: SetRecord[];
    restSeconds: number;
    notes: string;
}

interface WorkoutState {
    phase: 'setup' | 'training' | 'done';
    exercises: ExerciseEntry[];
    currentExerciseIndex: number;
    startedAt: number | null;
    finishedAt: number | null;
    nextId: number;
}

/* ═══════════════════════════════════════════════════════════════════
   Reducer
   ═══════════════════════════════════════════════════════════════════ */

type WAction =
    | { type: 'ADD_EXERCISE'; exercise: EquipmentDef }
    | { type: 'ADD_CUSTOM'; label: string; mode: ExerciseMode }
    | { type: 'REMOVE_EXERCISE'; id: number }
    | { type: 'MOVE_EXERCISE'; from: number; dir: 'up' | 'down' }
    | { type: 'ADD_SET'; exerciseId: number }
    | { type: 'REMOVE_SET'; exerciseId: number; setId: number }
    | { type: 'UPDATE_SET'; exerciseId: number; setId: number; field: 'reps' | 'weight' | 'duration'; value: number }
    | { type: 'TOGGLE_DONE'; exerciseId: number; setId: number }
    | { type: 'SET_REST'; exerciseId: number; seconds: number }
    | { type: 'SET_NOTES'; exerciseId: number; notes: string }
    | { type: 'START' }
    | { type: 'FINISH' }
    | { type: 'NAV'; index: number }
    | { type: 'RESET' };

function initState(): WorkoutState {
    return {
        phase: 'setup',
        exercises: [],
        currentExerciseIndex: 0,
        startedAt: null,
        finishedAt: null,
        nextId: 1,
    };
}

function makeDefaultSets(mode: ExerciseMode, startId: number): SetRecord[] {
    if (mode === 'timed') return [{ id: startId, duration: 60, done: false }];
    return Array.from({ length: 3 }, (_, i) => ({ id: startId + i, reps: 12, weight: 0, done: false }));
}

function workoutReducer(state: WorkoutState, action: WAction): WorkoutState {
    switch (action.type) {
        case 'ADD_EXERCISE': {
            const ex = action.exercise;
            const sets = makeDefaultSets(ex.defaultMode, state.nextId);
            const entry: ExerciseEntry = {
                id: state.nextId + 100,
                exerciseKey: ex.key,
                label: ex.label,
                emoji: ex.emoji,
                mode: ex.defaultMode,
                sets,
                restSeconds: 60,
                notes: '',
            };
            return { ...state, exercises: [...state.exercises, entry], nextId: state.nextId + 110 };
        }

        case 'ADD_CUSTOM': {
            const sets = makeDefaultSets(action.mode, state.nextId);
            const entry: ExerciseEntry = {
                id: state.nextId + 100,
                exerciseKey: `custom_${state.nextId}`,
                label: action.label,
                emoji: '🏋️',
                mode: action.mode,
                sets,
                restSeconds: 60,
                notes: '',
            };
            return { ...state, exercises: [...state.exercises, entry], nextId: state.nextId + 110 };
        }

        case 'REMOVE_EXERCISE':
            return { ...state, exercises: state.exercises.filter(e => e.id !== action.id) };

        case 'MOVE_EXERCISE': {
            const arr = [...state.exercises];
            const t = action.dir === 'up' ? action.from - 1 : action.from + 1;
            if (t < 0 || t >= arr.length) return state;
            [arr[action.from], arr[t]] = [arr[t], arr[action.from]];
            return { ...state, exercises: arr };
        }

        case 'ADD_SET':
            return {
                ...state,
                exercises: state.exercises.map(e => {
                    if (e.id !== action.exerciseId) return e;
                    const last = e.sets[e.sets.length - 1];
                    const ns: SetRecord = e.mode === 'reps'
                        ? { id: state.nextId, reps: last?.reps ?? 12, weight: last?.weight ?? 0, done: false }
                        : { id: state.nextId, duration: last?.duration ?? 60, done: false };
                    return { ...e, sets: [...e.sets, ns] };
                }),
                nextId: state.nextId + 1,
            };

        case 'REMOVE_SET':
            return {
                ...state,
                exercises: state.exercises.map(e => {
                    if (e.id !== action.exerciseId || e.sets.length <= 1) return e;
                    return { ...e, sets: e.sets.filter(s => s.id !== action.setId) };
                }),
            };

        case 'UPDATE_SET':
            return {
                ...state,
                exercises: state.exercises.map(e => {
                    if (e.id !== action.exerciseId) return e;
                    return {
                        ...e,
                        sets: e.sets.map(s =>
                            s.id === action.setId ? { ...s, [action.field]: Math.max(0, action.value) } : s,
                        ),
                    };
                }),
            };

        case 'TOGGLE_DONE':
            return {
                ...state,
                exercises: state.exercises.map(e => {
                    if (e.id !== action.exerciseId) return e;
                    return { ...e, sets: e.sets.map(s => s.id === action.setId ? { ...s, done: !s.done } : s) };
                }),
            };

        case 'SET_REST':
            return {
                ...state,
                exercises: state.exercises.map(e =>
                    e.id === action.exerciseId ? { ...e, restSeconds: Math.max(0, action.seconds) } : e,
                ),
            };

        case 'SET_NOTES':
            return {
                ...state,
                exercises: state.exercises.map(e =>
                    e.id === action.exerciseId ? { ...e, notes: action.notes } : e,
                ),
            };

        case 'START':
            if (state.exercises.length === 0) return state;
            return { ...state, phase: 'training', startedAt: Date.now(), currentExerciseIndex: 0 };

        case 'FINISH':
            return { ...state, phase: 'done', finishedAt: Date.now() };

        case 'NAV':
            return { ...state, currentExerciseIndex: action.index };

        case 'RESET':
            return initState();

        default:
            return state;
    }
}

/* ═══════════════════════════════════════════════════════════════════
   Countdown Timer Hook
   ═══════════════════════════════════════════════════════════════════ */

function useCountdown() {
    const [remaining, setRemaining] = useState(0);
    const [running, setRunning] = useState(false);
    const ref = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = useCallback((s: number) => { setRemaining(s); setRunning(true); }, []);
    const toggle = useCallback(() => setRunning(r => !r), []);
    const reset = useCallback(() => { setRunning(false); setRemaining(0); }, []);

    useEffect(() => {
        if (running && remaining > 0) {
            ref.current = setInterval(() => {
                setRemaining(r => {
                    if (r <= 1) { setRunning(false); return 0; }
                    return r - 1;
                });
            }, 1000);
        }
        return () => { if (ref.current) clearInterval(ref.current); };
    }, [running, remaining]);

    return { remaining, running, start, toggle, reset };
}

function fmt(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════ */

interface Props { open: boolean; onClose: () => void; }

export default function GymTracker({ open, onClose }: Props) {
    const [state, dispatch] = useReducer(workoutReducer, undefined, initState);
    const [filterCat, setFilterCat] = useState<string>('free');
    const [customName, setCustomName] = useState('');
    const [customMode, setCustomMode] = useState<ExerciseMode>('reps');
    const [showPicker, setShowPicker] = useState(true);
    const rest = useCountdown();
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleClose = useCallback(() => {
        if (state.phase === 'training') {
            if (!window.confirm('訓練進行中，確定要關閉？記錄將會遺失。')) return;
        }
        rest.reset();
        dispatch({ type: 'RESET' });
        onClose();
    }, [state.phase, onClose, rest]);

    const totalSets = state.exercises.reduce((s, e) => s + e.sets.length, 0);
    const doneSets = state.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0);
    const totalVolume = state.exercises.reduce((s, e) =>
        s + e.sets.filter(x => x.done).reduce((a, x) => a + (x.reps ?? 0) * (x.weight ?? 0), 0), 0);

    // ════════════════════════════════
    // Setup Phase
    // ════════════════════════════════

    const renderSetup = () => {
        const filtered = PRESET_EXERCISES.filter(e => e.category === filterCat);
        const added = new Set(state.exercises.map(e => e.exerciseKey));

        return (
            <Stack spacing={2}>
                {/* 已加入的動作 */}
                {state.exercises.length > 0 && (
                    <>
                        <Typography variant="subtitle2" color="text.secondary">
                            已加入 ({state.exercises.length} 個動作，共 {totalSets} 組)
                        </Typography>
                        <Stack spacing={1}>
                            {state.exercises.map((ex, i) => (
                                <Paper key={ex.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography sx={{ fontSize: '1.2rem' }}>{ex.emoji}</Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }} noWrap>
                                            {ex.label}
                                        </Typography>
                                        <Chip
                                            label={ex.mode === 'reps' ? `${ex.sets.length} 組` : '計時'}
                                            size="small" variant="outlined"
                                        />
                                        <IconButton size="small" disabled={i === 0}
                                            onClick={() => dispatch({ type: 'MOVE_EXERCISE', from: i, dir: 'up' })}>
                                            <ExpandLess fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" disabled={i === state.exercises.length - 1}
                                            onClick={() => dispatch({ type: 'MOVE_EXERCISE', from: i, dir: 'down' })}>
                                            <ExpandMore fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error"
                                            onClick={() => dispatch({ type: 'REMOVE_EXERCISE', id: ex.id })}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                        <Divider />
                    </>
                )}

                {/* 新增動作 */}
                <Button variant="outlined" onClick={() => setShowPicker(!showPicker)}
                    endIcon={showPicker ? <ExpandLess /> : <ExpandMore />}
                    sx={{ textTransform: 'none' }}>
                    {showPicker ? '收合動作列表' : '＋ 新增動作'}
                </Button>

                <Collapse in={showPicker}>
                    <Stack spacing={2}>
                        {/* 四大分類 */}
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {EQUIPMENT_CATEGORIES.map(c => (
                                <Chip key={c.key} label={c.label} size="small"
                                    color={filterCat === c.key ? 'primary' : 'default'}
                                    onClick={() => setFilterCat(c.key)} />
                            ))}
                        </Stack>

                        {/* 動作列表 */}
                        <Box sx={{
                            maxHeight: 220, overflowY: 'auto',
                            border: '1px solid', borderColor: 'divider', borderRadius: 2,
                        }}>
                            {filtered.map(ex => (
                                <Box key={ex.key} sx={{
                                    display: 'flex', alignItems: 'center', px: 1.5, py: 1, gap: 1.5,
                                    borderBottom: '1px solid', borderColor: 'divider',
                                    opacity: added.has(ex.key) ? 0.4 : 1,
                                    '&:hover': { bgcolor: 'action.hover' },
                                    cursor: added.has(ex.key) ? 'default' : 'pointer',
                                }} onClick={() => { if (!added.has(ex.key)) dispatch({ type: 'ADD_EXERCISE', exercise: ex }); }}>
                                    <Typography sx={{ fontSize: '1.1rem' }}>{ex.emoji}</Typography>
                                    <Typography variant="body2" sx={{ flex: 1 }}>{ex.label}</Typography>
                                    <Chip label={ex.defaultMode === 'reps' ? '組×次' : '計時'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                    {added.has(ex.key) && <CheckCircle fontSize="small" color="success" />}
                                </Box>
                            ))}
                        </Box>

                        {/* 自訂動作 */}
                        <Divider><Chip label="或 自訂動作" size="small" /></Divider>
                        <Stack direction="row" spacing={1} alignItems="flex-end">
                            <TextField label="動作名稱" size="small" value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                inputProps={{ maxLength: 20 }} sx={{ flex: 1 }} />
                            <FormControl size="small" sx={{ minWidth: 90 }}>
                                <InputLabel>模式</InputLabel>
                                <Select value={customMode} label="模式"
                                    onChange={e => setCustomMode(e.target.value as ExerciseMode)}>
                                    <MenuItem value="reps">組×次</MenuItem>
                                    <MenuItem value="timed">計時</MenuItem>
                                </Select>
                            </FormControl>
                            <Button variant="contained" size="small" disabled={!customName.trim()}
                                onClick={() => {
                                    dispatch({ type: 'ADD_CUSTOM', label: customName.trim(), mode: customMode });
                                    setCustomName('');
                                }}>
                                加入
                            </Button>
                        </Stack>
                    </Stack>
                </Collapse>

                {state.exercises.length > 0 && (
                    <>
                        <Divider />
                        <Alert severity="info" variant="outlined">
                            <Typography variant="body2">
                                已加入 <strong>{state.exercises.length}</strong> 個動作，
                                共 <strong>{totalSets}</strong> 組。開始訓練後仍可調整。
                            </Typography>
                        </Alert>
                        <Button variant="contained" size="large" fullWidth
                            onClick={() => { dispatch({ type: 'START' }); setShowPicker(false); }}
                            sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}>
                            💪 開始訓練
                        </Button>
                    </>
                )}
            </Stack>
        );
    };

    // ════════════════════════════════
    // Training Phase
    // ════════════════════════════════

    const renderTraining = () => {
        const cur = state.exercises[state.currentExerciseIndex];
        if (!cur) return null;

        return (
            <Stack spacing={2}>
                {/* 進度條 */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                        進度 {doneSets}/{totalSets} 組
                    </Typography>
                    {totalVolume > 0 && (
                        <Chip label={`總訓練量 ${totalVolume.toLocaleString()} kg`} size="small" variant="outlined" />
                    )}
                </Stack>
                <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <Box sx={{
                        height: '100%', borderRadius: 3, bgcolor: 'primary.main',
                        width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%`,
                        transition: 'width 0.3s',
                    }} />
                </Box>

                {/* 動作切換 */}
                <Stack direction="row" spacing={0.5} sx={{ overflowX: 'auto', pb: 1 }}>
                    {state.exercises.map((ex, i) => {
                        const exDone = ex.sets.every(s => s.done);
                        return (
                            <Chip key={ex.id} label={ex.label} size="small"
                                color={i === state.currentExerciseIndex ? 'primary' : exDone ? 'success' : 'default'}
                                variant={i === state.currentExerciseIndex ? 'filled' : 'outlined'}
                                onClick={() => dispatch({ type: 'NAV', index: i })}
                                sx={{ flexShrink: 0 }} />
                        );
                    })}
                </Stack>

                <Divider />

                {/* 動作標題 */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ fontSize: '1.5rem' }}>{cur.emoji}</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>{cur.label}</Typography>
                    <Chip label={cur.mode === 'reps' ? '重量×次數' : '計時'} size="small" color="secondary" variant="outlined" />
                </Stack>

                {/* 組別 */}
                <Stack spacing={1}>
                    {cur.sets.map((set, si) => (
                        <Paper key={set.id} variant="outlined" sx={{
                            p: 1.5, borderRadius: 2,
                            borderColor: set.done ? 'success.main' : 'divider',
                            ...(set.done && { bgcolor: 'rgba(76,175,80,0.08)' }),
                        }}>
                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 28, color: 'text.secondary' }}>
                                    #{si + 1}
                                </Typography>

                                {cur.mode === 'reps' ? (
                                    <>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <IconButton size="small" onClick={() => dispatch({
                                                type: 'UPDATE_SET', exerciseId: cur.id, setId: set.id,
                                                field: 'weight', value: (set.weight ?? 0) - 2.5,
                                            })}><Remove fontSize="small" /></IconButton>
                                            <TextField value={set.weight ?? 0} size="small"
                                                onChange={e => dispatch({
                                                    type: 'UPDATE_SET', exerciseId: cur.id, setId: set.id,
                                                    field: 'weight', value: parseFloat(e.target.value) || 0,
                                                })}
                                                inputProps={{ style: { textAlign: 'center', width: 44 } }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                            <IconButton size="small" onClick={() => dispatch({
                                                type: 'UPDATE_SET', exerciseId: cur.id, setId: set.id,
                                                field: 'weight', value: (set.weight ?? 0) + 2.5,
                                            })}><Add fontSize="small" /></IconButton>
                                            <Typography variant="caption" color="text.secondary">kg</Typography>
                                        </Stack>
                                        <Typography color="text.secondary">×</Typography>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <IconButton size="small" onClick={() => dispatch({
                                                type: 'UPDATE_SET', exerciseId: cur.id, setId: set.id,
                                                field: 'reps', value: (set.reps ?? 0) - 1,
                                            })}><Remove fontSize="small" /></IconButton>
                                            <TextField value={set.reps ?? 0} size="small"
                                                onChange={e => dispatch({
                                                    type: 'UPDATE_SET', exerciseId: cur.id, setId: set.id,
                                                    field: 'reps', value: parseInt(e.target.value) || 0,
                                                })}
                                                inputProps={{ style: { textAlign: 'center', width: 34 } }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                            <IconButton size="small" onClick={() => dispatch({
                                                type: 'UPDATE_SET', exerciseId: cur.id, setId: set.id,
                                                field: 'reps', value: (set.reps ?? 0) + 1,
                                            })}><Add fontSize="small" /></IconButton>
                                            <Typography variant="caption" color="text.secondary">下</Typography>
                                        </Stack>
                                    </>
                                ) : (
                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                                        <IconButton size="small" onClick={() => dispatch({
                                            type: 'UPDATE_SET', exerciseId: cur.id, setId: set.id,
                                            field: 'duration', value: (set.duration ?? 0) - 15,
                                        })}><Remove fontSize="small" /></IconButton>
                                        <Typography variant="body1" fontWeight="bold"
                                            sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 48, textAlign: 'center' }}>
                                            {fmt(set.duration ?? 0)}
                                        </Typography>
                                        <IconButton size="small" onClick={() => dispatch({
                                            type: 'UPDATE_SET', exerciseId: cur.id, setId: set.id,
                                            field: 'duration', value: (set.duration ?? 0) + 15,
                                        })}><Add fontSize="small" /></IconButton>
                                    </Stack>
                                )}

                                <Button variant={set.done ? 'contained' : 'outlined'}
                                    color={set.done ? 'success' : 'primary'} size="small"
                                    sx={{ minWidth: 48, borderRadius: 2 }}
                                    onClick={() => {
                                        dispatch({ type: 'TOGGLE_DONE', exerciseId: cur.id, setId: set.id });
                                        if (!set.done && cur.restSeconds > 0) rest.start(cur.restSeconds);
                                    }}>
                                    {set.done ? '✓' : '完成'}
                                </Button>

                                {cur.sets.length > 1 && (
                                    <IconButton size="small" color="error"
                                        onClick={() => dispatch({ type: 'REMOVE_SET', exerciseId: cur.id, setId: set.id })}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                )}
                            </Stack>
                        </Paper>
                    ))}

                    <Button variant="text" size="small" startIcon={<Add />}
                        onClick={() => dispatch({ type: 'ADD_SET', exerciseId: cur.id })}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
                        新增一組
                    </Button>
                </Stack>

                {/* 組間休息 */}
                <Divider />
                <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Timer fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">組間休息</Typography>
                        <Stack direction="row" spacing={0.5}>
                            {[30, 60, 90, 120, 180].map(sec => (
                                <Chip key={sec} label={sec < 60 ? `${sec}s` : `${sec / 60}m`} size="small"
                                    color={cur.restSeconds === sec ? 'primary' : 'default'}
                                    variant={cur.restSeconds === sec ? 'filled' : 'outlined'}
                                    onClick={() => dispatch({ type: 'SET_REST', exerciseId: cur.id, seconds: sec })} />
                            ))}
                        </Stack>
                    </Stack>

                    {(rest.remaining > 0 || rest.running) && (
                        <Paper sx={{
                            p: 2, borderRadius: 3, textAlign: 'center',
                            bgcolor: rest.remaining <= 5 ? 'error.main' : 'primary.main',
                            color: 'white', transition: 'background-color 0.3s',
                        }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>組間休息</Typography>
                            <Typography variant="h3" fontWeight="900" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {fmt(rest.remaining)}
                            </Typography>
                            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                                <IconButton size="small" sx={{ color: 'white' }} onClick={rest.toggle}>
                                    {rest.running ? <Pause /> : <PlayArrow />}
                                </IconButton>
                                <IconButton size="small" sx={{ color: 'white' }} onClick={rest.reset}>
                                    <RestartAlt />
                                </IconButton>
                                <Button size="small" sx={{ color: 'white', fontSize: '0.75rem' }}
                                    onClick={() => rest.start(rest.remaining + 30)}>+30s</Button>
                            </Stack>
                        </Paper>
                    )}
                </Stack>

                {/* 備註 */}
                <TextField label="備註" size="small" fullWidth multiline minRows={1} maxRows={3}
                    value={cur.notes} onChange={e => dispatch({ type: 'SET_NOTES', exerciseId: cur.id, notes: e.target.value })}
                    inputProps={{ maxLength: 200 }} placeholder="例如：注意肩胛骨後收" />

                {/* 操作列 */}
                <Divider />
                <Stack direction="row" spacing={1} justifyContent="space-between">
                    <Button variant="outlined" color="error" size="small" startIcon={<RestartAlt />}
                        onClick={() => {
                            if (window.confirm('確定要重置所有訓練記錄？')) {
                                rest.reset(); dispatch({ type: 'RESET' });
                            }
                        }}>重置</Button>
                    <Button variant="contained" color={doneSets === totalSets && totalSets > 0 ? 'success' : 'primary'}
                        onClick={() => dispatch({ type: 'FINISH' })}>
                        {doneSets === totalSets && totalSets > 0 ? '🎉 完成訓練' : '結束訓練'}
                    </Button>
                </Stack>
            </Stack>
        );
    };

    // ════════════════════════════════
    // Done Phase — 結算截圖畫面
    // ════════════════════════════════

    const renderDone = () => {
        const duration = state.startedAt && state.finishedAt
            ? Math.round((state.finishedAt - state.startedAt) / 1000) : 0;
        const today = new Date();
        const dateStr = `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;

        return (
            <Stack spacing={2.5} alignItems="center">
                {/* 標題區域 */}
                <Stack alignItems="center" spacing={0.5} sx={{ pt: 1 }}>
                    <Typography variant="h4" fontWeight="900">🎉 訓練完成！</Typography>
                    <Typography variant="body2" color="text.secondary">{dateStr}</Typography>
                </Stack>

                {/* 統計卡片 */}
                <Paper sx={{
                    p: 3, borderRadius: 3, textAlign: 'center', width: '100%',
                    background: 'linear-gradient(135deg, rgba(156,39,176,0.12) 0%, rgba(33,150,243,0.12) 100%)',
                }}>
                    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" color="primary.main">{fmt(duration)}</Typography>
                            <Typography variant="caption" color="text.secondary">訓練時間</Typography>
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" color="primary.main">{state.exercises.length}</Typography>
                            <Typography variant="caption" color="text.secondary">動作數</Typography>
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" color="primary.main">{doneSets}/{totalSets}</Typography>
                            <Typography variant="caption" color="text.secondary">完成組數</Typography>
                        </Box>
                        {totalVolume > 0 && (
                            <Box>
                                <Typography variant="h5" fontWeight="bold" color="primary.main">
                                    {totalVolume.toLocaleString()} kg
                                </Typography>
                                <Typography variant="caption" color="text.secondary">總訓練量</Typography>
                            </Box>
                        )}
                    </Stack>
                </Paper>

                {/* 動作詳細記錄 */}
                <Stack spacing={1} sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">訓練詳細記錄</Typography>
                    {state.exercises.map(ex => {
                        const exDoneSets = ex.sets.filter(s => s.done);
                        const exVol = exDoneSets.reduce((a, s) => a + (s.reps ?? 0) * (s.weight ?? 0), 0);
                        return (
                            <Paper key={ex.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                <Stack spacing={0.5}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography>{ex.emoji}</Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>{ex.label}</Typography>
                                        <Chip label={`${exDoneSets.length}/${ex.sets.length} 組`} size="small"
                                            color={exDoneSets.length === ex.sets.length ? 'success' : 'default'} variant="outlined" />
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                        {exDoneSets.map((s, i) => (
                                            <Chip key={i} size="small" variant="outlined"
                                                sx={{ fontVariantNumeric: 'tabular-nums' }}
                                                label={ex.mode === 'reps' ? `${s.weight}kg × ${s.reps}` : fmt(s.duration ?? 0)} />
                                        ))}
                                    </Stack>
                                    {ex.mode === 'reps' && exVol > 0 && (
                                        <Typography variant="caption" color="text.secondary">
                                            訓練量：{exVol.toLocaleString()} kg
                                        </Typography>
                                    )}
                                    {ex.notes && (
                                        <Typography variant="caption" color="text.secondary">📝 {ex.notes}</Typography>
                                    )}
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
                    LUMO 暨大運動配對平台 · 健身訓練記錄
                </Typography>

                <Divider sx={{ width: '100%' }} />

                <Alert severity="info" variant="outlined" sx={{ width: '100%' }}>
                    <Typography variant="body2">
                        📸 截圖保存你的訓練記錄吧！
                    </Typography>
                </Alert>

                <Button variant="contained" size="large" onClick={() => dispatch({ type: 'RESET' })} sx={{ px: 4 }}>
                    開始新的訓練
                </Button>
            </Stack>
        );
    };

    // ════════════════════════════════
    // Main Render
    // ════════════════════════════════

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={mobile}
            PaperProps={{ sx: { borderRadius: mobile ? 0 : 3 } }}>
            <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pb: 1 }}>
                <FitnessCenter sx={{ verticalAlign: 'middle', mr: 1 }} />
                健身訓練記錄器
                {state.phase === 'training' && (
                    <Typography variant="body2" color="text.secondary">
                        {state.exercises.length} 個動作 · {doneSets}/{totalSets} 組完成
                        {totalVolume > 0 && ` · ${totalVolume.toLocaleString()} kg`}
                    </Typography>
                )}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
                {state.phase === 'setup' && renderSetup()}
                {state.phase === 'training' && renderTraining()}
                {state.phase === 'done' && renderDone()}
            </DialogContent>
            <Divider />
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleClose} color="inherit" size="small">
                    {state.phase === 'training' ? '關閉記錄器' : '關閉'}
                </Button>
            </Box>
        </Dialog>
    );
}
