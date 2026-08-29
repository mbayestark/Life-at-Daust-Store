import { useState, useEffect } from "react";
import { useConvex } from "convex/react";
import { WifiOff } from "lucide-react";

export default function ConvexStatus() {
  const convex = useConvex();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let timeout;
    const unsub = convex.subscribeToConnectionState((state) => {
      clearTimeout(timeout);
      if (!state.isWebSocketConnected && state.hasEverConnected) {
        timeout = setTimeout(() => setOffline(true), 4000);
      } else {
        setOffline(false);
      }
    });
    return () => { unsub(); clearTimeout(timeout); };
  }, [convex]);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Connection lost — reconnecting. Some features may be unavailable.</span>
    </div>
  );
}
