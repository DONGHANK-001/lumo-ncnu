import { Box, Container, Grid, Card, CardContent, Stack, Skeleton } from '@mui/material';

export default function GroupsLoading() {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Skeleton variant="text" width={160} height={40} />
                <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 2 }} />
            </Stack>
            <Stack direction="row" spacing={1} mb={3}>
                {[80, 60, 70, 90].map((w, i) => (
                    <Skeleton key={i} variant="rounded" width={w} height={32} sx={{ borderRadius: 99 }} />
                ))}
            </Stack>
            <Grid container spacing={3}>
                {[...Array(6)].map((_, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                        <Card sx={{ height: '100%', borderRadius: 3 }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Skeleton variant="rounded" width={80} height={24} />
                                        <Skeleton variant="rounded" width={60} height={24} />
                                    </Stack>
                                    <Skeleton variant="text" width="100%" height={28} />
                                    <Stack spacing={1}>
                                        <Skeleton variant="text" width="100%" height={16} />
                                        <Skeleton variant="text" width="100%" height={16} />
                                        <Skeleton variant="text" width="80%" height={16} />
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}
