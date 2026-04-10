import { SvgIcon, SvgIconProps } from '@mui/material';

/** 羽毛球 shuttlecock — 5片扇形羽毛 + 圓形底座 */
export function BadmintonIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            {/* 5 片扇形羽毛 */}
            <ellipse cx="7" cy="7.5" rx="1.8" ry="6" transform="rotate(-30 7 7.5)" />
            <ellipse cx="9.8" cy="5.5" rx="1.8" ry="6" transform="rotate(-15 9.8 5.5)" />
            <ellipse cx="12.8" cy="4.8" rx="1.8" ry="6" />
            <ellipse cx="15.8" cy="5.5" rx="1.8" ry="6" transform="rotate(15 15.8 5.5)" />
            <ellipse cx="18.5" cy="7.5" rx="1.8" ry="6" transform="rotate(30 18.5 7.5)" />
            {/* 底座圓弧 */}
            <ellipse cx="12.8" cy="15" rx="5.5" ry="3.5" />
        </SvgIcon>
    );
}

/** 乒乓球拍 — 圓形拍面 + 握把 + 小球 */
export function TableTennisIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            {/* 拍面 */}
            <circle cx="13" cy="8" r="7" />
            {/* 握把 */}
            <rect x="8" y="14.5" width="4" height="7.5" rx="1.8" transform="rotate(-15 10 18)" />
            {/* 小球 */}
            <circle cx="4" cy="18" r="2.5" />
        </SvgIcon>
    );
}
