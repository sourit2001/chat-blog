"use client";

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabaseClient) {
            setLoading(false);
            return;
        }

        // Get initial user
        supabaseClient.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        if (!supabaseClient) return;
        await supabaseClient.auth.signOut();
    };

    return { user, loading, signOut };
}
