'use client';

import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';

export default function CharactersPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                minHeight: '100dvh',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Floating particles */}
            <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            width: i % 3 === 0 ? 8 : 5,
                            height: i % 3 === 0 ? 8 : 5,
                            borderRadius: '50%',
                            background: isDark
                                ? `rgba(208, 188, 255, ${0.15 + (i % 4) * 0.05})`
                                : `rgba(103, 80, 164, ${0.1 + (i % 4) * 0.04})`,
                            left: `${8 + (i * 7.3) % 84}%`,
                            animation: `particleFloat ${6 + (i % 5) * 2}s ease-in-out infinite`,
                            animationDelay: `${(i * 1.3) % 8}s`,
                        }}
                    />
                ))}
            </Box>

            {/* Content */}
            <Container
                maxWidth="sm"
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    pt: 4,
                    pb: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Button
                    startIcon={<ArrowBack />}
                    component={Link}
                    href="/"
                    sx={{ alignSelf: 'flex-start', mb: 3, color: 'text.secondary' }}
                >
                    返回首頁
                </Button>

                <Typography
                    variant="h4"
                    fontWeight="bold"
                    textAlign="center"
                    sx={{
                        mb: 1,
                        background: isDark
                            ? 'linear-gradient(135deg, #D0BCFF, #FFB4AB)'
                            : 'linear-gradient(135deg, #6750A4, #B3261E)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                    }}
                >
                    LUMO 夥伴們
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
                    陪你在暨大的每一天，一起運動、一起成長
                </Typography>

                {/* Main illustration with float animation */}
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 420,
                        mx: 'auto',
                        animation: 'breathe 4s ease-in-out infinite',
                    }}
                >
                    {/* Soft glow behind image */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '10%',
                            left: '10%',
                            width: '80%',
                            height: '80%',
                            borderRadius: '50%',
                            background: isDark
                                ? 'radial-gradient(circle, rgba(208,188,255,0.12) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(103,80,164,0.08) 0%, transparent 70%)',
                            filter: 'blur(30px)',
                            animation: 'glowPulse 4s ease-in-out infinite',
                        }}
                    />
                    <Box
                        component="img"
                        src="/characters.webp"
                        alt="LUMO IP 角色 — 四位可愛的吉祥物夥伴"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            position: 'relative',
                            filter: isDark ? 'drop-shadow(0 8px 32px rgba(208,188,255,0.18))' : 'drop-shadow(0 8px 32px rgba(0,0,0,0.1))',
                        }}
                    />
                </Box>

                {/* Character descriptions */}
                <Stack spacing={2} sx={{ mt: 5, width: '100%' }}>
                    {[
                        { name: '李哲恩', trait: '溫柔可靠的大男孩，戴著眼鏡的他總是第一個發起揪團', color: '#5B8BD4' },
                        { name: '徐曜辰', trait: '酷酷的棒球外套少年，運動場上永遠充滿好勝心', color: '#424242' },
                        { name: '王佑慧', trait: '活潑開朗的元氣少女，最愛和大家一起動起來', color: '#3F51B5' },
                        { name: '白語寧', trait: '知性溫暖的工裝女孩，是大家最安心的後盾', color: '#8D6E63' },
                    ].map((c) => (
                        <Box
                            key={c.name}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                p: 2,
                                borderRadius: 3,
                                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateX(4px)' },
                            }}
                        >
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${c.color}, ${c.color}88)`,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>
                                    {c.name[1]}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold">{c.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{c.trait}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Stack>

                <Typography variant="caption" color="text.secondary" textAlign="center" mt={4}>
                    插畫為 LUMO 原創 IP，請勿任意轉載使用
                </Typography>
            </Container>

            {/* Keyframe animations */}
            <style>{`
                @keyframes breathe {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes glowPulse {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
                @keyframes particleFloat {
                    0% { top: 110%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: -5%; opacity: 0; }
                }
            `}</style>
        </Box>
    );
}
