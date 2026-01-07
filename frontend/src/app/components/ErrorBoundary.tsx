'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * 全域錯誤邊界元件
 * 捕捉 React 元件樹中的 JavaScript 錯誤，並顯示友好的錯誤頁面
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });

        // 可以在這裡發送錯誤到監控服務 (如 Sentry)
        // logErrorToService(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // 如果有自訂 fallback，使用它
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // 預設錯誤 UI
            return (
                <Box
                    sx={{
                        minHeight: '100vh',
                        bgcolor: 'background.default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                    }}
                >
                    <Container maxWidth="sm">
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                bgcolor: 'background.paper',
                                borderRadius: 3,
                            }}
                        >
                            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                                😵
                            </Typography>
                            <Typography variant="h5" gutterBottom fontWeight="bold">
                                哎呀，出了點問題
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 4 }}>
                                頁面發生了一些錯誤。請嘗試重新整理頁面，或返回首頁。
                            </Typography>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        mb: 3,
                                        bgcolor: 'error.dark',
                                        textAlign: 'left',
                                        overflow: 'auto',
                                        maxHeight: 200,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        component="pre"
                                        sx={{ fontFamily: 'monospace', color: 'error.contrastText' }}
                                    >
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </Typography>
                                </Paper>
                            )}

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<RefreshIcon />}
                                    onClick={this.handleReload}
                                >
                                    重新整理
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<HomeIcon />}
                                    onClick={this.handleGoHome}
                                >
                                    返回首頁
                                </Button>
                            </Box>
                        </Paper>
                    </Container>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
