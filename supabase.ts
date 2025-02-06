// supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nruyzvbrrlcapfcxxowo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXl6dmJycmxjYXBmY3h4b3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMTQ5NTYsImV4cCI6MjA1Mzg5MDk1Nn0.8nmWmdxHJJHDxUR2AnMffhLeL5DfRDC3U8bY_U_hWpY';

export const supabase = createClient(supabaseUrl, supabaseKey);