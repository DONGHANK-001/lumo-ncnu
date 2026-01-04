import { Router, Request, Response } from 'express';

const router = Router();

/**
 * AI 路由預留
 * 未來可加入：
 * - POST /ai/group-text - 揪團文案優化
 * - POST /ai/match - 配對建議
 * - POST /ai/icebreaker - 破冰流程生成
 */

router.get('/status', (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            enabled: false,
            message: 'AI 功能尚未啟用，敬請期待',
            features: [
                { name: 'group-text', status: 'coming_soon', description: '揪團文案優化' },
                { name: 'match', status: 'coming_soon', description: '智慧配對建議' },
                { name: 'icebreaker', status: 'coming_soon', description: '破冰流程生成' },
            ],
        },
    });
});

export default router;
