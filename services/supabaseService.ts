import { supabase } from '../integrations/supabase/client';

export { supabase };

// 特化型サービスを再エクスポートして後方互換性を維持する
// このファイルはサービス層のハブ/ファサードとして機能します。
export * from './authService';
export * from './communityService';
export * from './kairanbanService';
export * from './timelineService';
export * from './missionService';
export * from './pointService';
export * from './adminService';
