import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Bell, Check, CheckCheck, Trash2, Calendar, CreditCard, 
  AlertCircle, Star, X, Clock, MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICONS = {
  reservation_created: Calendar,
  reservation_accepted: Check,
  reservation_rejected: X,
  reservation_cancelled: X,
  reservation_modified: Calendar,
  payment_received: CreditCard,
  payment_pending: Clock,
  reminder: Bell,
  review: Star,
  system: MessageSquare
};

const NOTIFICATION_COLORS = {
  reservation_created: "bg-blue-100 text-blue-600",
  reservation_accepted: "bg-green-100 text-green-600",
  reservation_rejected: "bg-red-100 text-red-600",
  reservation_cancelled: "bg-red-100 text-red-600",
  reservation_modified: "bg-amber-100 text-amber-600",
  payment_received: "bg-green-100 text-green-600",
  payment_pending: "bg-amber-100 text-amber-600",
  reminder: "bg-purple-100 text-purple-600",
  review: "bg-amber-100 text-amber-600",
  system: "bg-slate-100 text-slate-600"
};

export default function UserNotificationCenter({ 
  notifications = [], 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDelete 
}) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationLink = (notification) => {
    if (notification.reference_type === "reservation" && notification.reference_id) {
      return createPageUrl(`MyReservations?highlight=${notification.reference_id}`);
    }
    if (notification.reference_type === "reservation") {
      return createPageUrl("MyReservations");
    }
    if (notification.reference_type === "court" && notification.reference_id) {
      return createPageUrl(`CourtDetail?id=${notification.reference_id}`);
    }
    if (notification.reference_type === "match" && notification.reference_id) {
      return createPageUrl("Community");
    }
    return null;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    const link = getNotificationLink(notification);
    if (link) {
      setOpen(false);
      window.location.href = link;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge className="bg-red-500">{unreadCount}</Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todo
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.system;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm",
                      notification.is_read 
                        ? "bg-white border-slate-100" 
                        : "bg-blue-50/50 border-blue-100"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm line-clamp-1",
                            !notification.is_read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_date), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}