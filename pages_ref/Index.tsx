import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
    const [status, setStatus] = useState("INITIALIZING...");

    useEffect(() => {
        const checkConnection = async () => {
            // Just check health by a simple select, assume 'profiles' or some public table exists
            // If error (e.g. table not found), it shows failure, but at least we know client is set up
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await supabase.from("profiles" as any).select("count", { count: 'exact', head: true });
                if (error && error.code !== 'PGRST116') { // PGRST116 might be no data related, but usually error
                    console.log("Health check error (might be expected if table missing):", error);
                    // Try another common table if profiles fails
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { error: error2 } = await supabase.from("users" as any).select("count", { count: 'exact', head: true });
                    if (error2) {
                        setStatus("CONNECTION FAILURE or DATABASE LOCKED");
                    } else {
                        setStatus("SYSTEM ONLINE");
                    }
                } else {
                    setStatus("SYSTEM ONLINE");
                }
            } catch (e) {
                setStatus("CRITICAL ERROR");
            }
        };
        checkConnection();
    }, []);

    return (
        <div className="min-h-screen bg-black text-[#00ff41] p-8 flex flex-col items-center justify-center relative overflow-hidden font-mono">
            {/* Glitch overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>

            <div className="z-20 border border-[#00ff41] p-10 bg-black/90 backdrop-blur-md relative max-w-2xl w-full shadow-[0_0_20px_rgba(0,255,65,0.2)]">
                <div className="absolute top-0 left-0 w-2 h-2 bg-[#00ff41]"></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-[#00ff41]"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#00ff41]"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00ff41]"></div>

                <h1 className="text-5xl font-bold mb-6 glitch tracking-tighter" data-text="KAIRANBAN BASE">KAIRANBAN BASE</h1>
                <div className="h-px w-full bg-[#00ff41] mb-6 opacity-50 shadow-[0_0_10px_#00ff41]"></div>

                <div className="space-y-4 text-lg">
                    <div className="flex justify-between border-b border-[#00ff41]/30 pb-2">
                        <span>&gt; TARGET_SYSTEM:</span>
                        <span className="font-bold">ASHIBATCH_CORE</span>
                    </div>
                    <div className="flex justify-between border-b border-[#00ff41]/30 pb-2">
                        <span>&gt; STATUS:</span>
                        <span className={status === "SYSTEM ONLINE" ? "animate-pulse font-bold" : "text-red-500 font-bold"}>{status}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#00ff41]/30 pb-2">
                        <span>&gt; SECURITY_LEVEL:</span>
                        <span>MAXIMUM</span>
                    </div>
                    <div className="flex justify-between pb-2">
                        <span>&gt; OPERATOR:</span>
                        <span>GHOST_ADMIN</span>
                    </div>
                </div>

                <button className="mt-10 w-full border border-[#00ff41] py-4 text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-all uppercase tracking-[0.2em] font-bold text-xl relative group overflow-hidden">
                    <span className="relative z-10">Initiate Protocol</span>
                    <div className="absolute inset-0 bg-[#00ff41] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
                </button>
            </div>

            <div className="absolute bottom-10 text-xs text-[#00ff41]/50 text-center">
                <p>SECURE CONNECTION ESTABLISHED</p>
                <p>ENCRYPTED VIA 4096-BIT RSA</p>
            </div>
        </div>
    );
};

export default Index;
