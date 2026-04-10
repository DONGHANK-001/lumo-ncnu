import { SvgIcon, SvgIconProps } from '@mui/material';

/** 羽毛球（shuttlecock）icon */
export function BadmintonIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M12 2C9.8 2 8 3.8 8 6c0 1.5.8 2.8 2 3.5V11h4V9.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4zm-1 11l-1 9h4l-1-9h-2z" />
        </SvgIcon>
    );
}

/** 乒乓球拍 icon */
export function TableTennisIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M15.5 2C12.46 2 10 4.46 10 7.5c0 1.03.28 1.99.78 2.82L4 17.1V21h3.9l6.78-6.78c.83.5 1.79.78 2.82.78C20.54 15 23 12.54 23 9.5S20.54 2 17.5 2h-2zm2 11c-1.93 0-3.5-1.57-3.5-3.5S15.57 6 17.5 6 21 7.57 21 9.5 19.43 13 17.5 13z" />
        </SvgIcon>
    );
}
