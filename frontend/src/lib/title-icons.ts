import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import {
    WbTwilight, Bolt, LocalFireDepartment, Explore, Shield, Waves,
    GpsFixed, Park, AutoAwesome, Terrain,
    Security, EmojiEvents, Stars, AccountBalance, WorkspacePremium,
    NightsStay, MilitaryTech,
    SportsBasketball, DirectionsRun, SportsTennis, SportsCricket,
    FitnessCenter, SportsVolleyball,
    Restaurant, MenuBook,
    SportsBaseball, Diamond, VerifiedUser, School,
} from '@mui/icons-material';

export interface TitleIconEntry {
    Icon: ComponentType<SvgIconProps>;
    color: string;
}

/**
 * 稱號 icon key → MUI Icon + 顏色
 * key 值對應後端 TitleEntry.icon
 */
export const TITLE_ICON_MAP: Record<string, TitleIconEntry> = {
    // Pioneer
    WbTwilight:           { Icon: WbTwilight, color: '#FF6F00' },
    Bolt:                 { Icon: Bolt, color: '#FFC107' },
    LocalFireDepartment:  { Icon: LocalFireDepartment, color: '#FF5722' },
    Explore:              { Icon: Explore, color: '#26A69A' },
    Shield:               { Icon: Shield, color: '#42A5F5' },
    Waves:                { Icon: Waves, color: '#29B6F6' },
    GpsFixed:             { Icon: GpsFixed, color: '#EF5350' },
    Park:                 { Icon: Park, color: '#66BB6A' },
    AutoAwesome:          { Icon: AutoAwesome, color: '#AB47BC' },
    Terrain:              { Icon: Terrain, color: '#78909C' },
    // Leaderboard
    Security:             { Icon: Security, color: '#FFD700' },
    EmojiEvents:          { Icon: EmojiEvents, color: '#C0C0C0' },
    Stars:                { Icon: Stars, color: '#CD7F32' },
    AccountBalance:       { Icon: AccountBalance, color: '#7E57C2' },
    WorkspacePremium:     { Icon: WorkspacePremium, color: '#FF7043' },
    MilitaryTech:         { Icon: MilitaryTech, color: '#78909C' },
    NightsStay:           { Icon: NightsStay, color: '#7E57C2' },
    // Sports
    SportsBasketball:     { Icon: SportsBasketball, color: '#FF6D00' },
    DirectionsRun:        { Icon: DirectionsRun, color: '#00C853' },
    SportsTennis:         { Icon: SportsTennis, color: '#2979FF' },
    SportsCricket:        { Icon: SportsCricket, color: '#00BFA5' },
    FitnessCenter:        { Icon: FitnessCenter, color: '#EF5350' },
    SportsVolleyball:     { Icon: SportsVolleyball, color: '#FFD600' },
    // Social
    Restaurant:           { Icon: Restaurant, color: '#FF7043' },
    MenuBook:             { Icon: MenuBook, color: '#5C6BC0' },
    // Events & Others
    SportsBaseball:       { Icon: SportsBaseball, color: '#D32F2F' },
    Diamond:              { Icon: Diamond, color: '#29B6F6' },
    VerifiedUser:         { Icon: VerifiedUser, color: '#66BB6A' },
    School:               { Icon: School, color: '#FFB300' },
};
