'use client';

import { Box, Container, Stack, Skeleton } from '@mui/material';

export default function LeaderboardLoading() {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Skeleton variant="text" width={200} height={44} sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width={280} height={20} sx={{ mx: 'auto', mb: 3 }} />
            <Stack direction="row" spacing={1} justifyContent="center" mb={3}>
                {[100, 100].map((w, i) => (
                    <Skeleton key={i} variant="rounded" width={w} height={36} sx={{ borderRadius: 99 }} />
                ))}
            </Stack>
            <Stack spacing={2}>
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 3 }} />
                ))}
            </Stack>
        </Container>
    );
}
