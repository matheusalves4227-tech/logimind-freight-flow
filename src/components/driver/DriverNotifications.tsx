import { useState, useEffect, useRef } from "react";
import { Bell, BellRing, Check, CheckCheck, Truck, MapPin, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  metadata: any;
  read: boolean;
  created_at: string;
}

const notificationSound = typeof Audio !== "undefined" ? new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGiRxm8n/2IxSKBt0pNDz4JdKHRR9rNr13ZFDGxGCsOD33ZFAGhCFtOP43ZJAHBKH") : null;

export const DriverNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe, permission } = usePushNotifications();
  const prevCountRef = useRef(0);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    loadNotifications();
    const channel = supabase
      .channel("driver-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "driver_notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          toast.info(newNotif.title, { description: newNotif.body });
          try { notificationSound?.play(); } catch {}
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("driver_notifications")
      .select("*")
      .eq("driver_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setNotifications(data as Notification[]);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("driver_notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("driver_notifications").update({ read: true }).eq("driver_user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Push notifications desativadas");
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("Push notifications ativadas!");
      } else if (permission === "denied") {
        toast.error("Permissão negada. Habilite nas configurações do navegador.");
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "opportunity": return <Truck className="h-4 w-4 text-primary" />;
      case "assignment": return <MapPin className="h-4 w-4 text-green-500" />;
      case "payment": return <DollarSign className="h-4 w-4 text-amber-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-primary animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
                <CheckCheck className="h-3 w-3 mr-1" /> Ler todas
              </Button>
            )}
          </div>
        </div>

        {isSupported && (
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">Push Notifications</span>
            <Switch checked={isSubscribed} onCheckedChange={handleTogglePush} disabled={loading} />
          </div>
        )}

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Nenhuma notificação ainda
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  !n.read ? "bg-primary/5" : ""
                }`}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-semibold" : "font-normal"}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
