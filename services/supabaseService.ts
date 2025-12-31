import { supabase } from '../integrations/supabase/client';

export { supabase };

// Re-export all specialized services to maintain backward compatibility
// This file now acts as a central hub/facade for the service layer.
export * from './authService';
export * from './communityService';
export * from './kairanbanService';
export * from './timelineService';
export * from './missionService';
export * from './pointService';
export * from './adminService';
