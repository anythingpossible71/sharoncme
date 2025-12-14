"use client";

import { useState, useMemo } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Trash2, Mail as MailIcon, User } from "lucide-react";
import { deleteContactMessage, markMessageAsRead } from "@/app/actions/contact-messages";
import { useRouter } from "next/navigation";

// Format relative time helper
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  if (diffMonths < 12) return `${diffMonths}m`;
  return `${Math.floor(diffDays / 365)}y`;
};

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  replied: boolean;
  created_at: Date;
}

interface InboxMessagesListProps {
  initialMessages: ContactMessage[];
}

export function InboxMessagesList({ initialMessages }: InboxMessagesListProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);

    // Mark as read if not already read
    if (!message.read) {
      await markMessageAsRead(message.id);
      // Update local state
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? { ...msg, read: true } : msg))
      );
      router.refresh();
    }
  };

  const handleDeleteClick = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessageToDelete(messageId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;

    setIsDeleting(true);
    const result = await deleteContactMessage(messageToDelete);

    if (result.success) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete));
      setMessageToDelete(null);
      setIsDeleteDialogOpen(false);
      router.refresh();
    }

    setIsDeleting(false);
  };

  const handleDeleteFromDialog = async (messageId: string) => {
    setIsDeleting(true);
    const result = await deleteContactMessage(messageId);

    if (result.success) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setIsDialogOpen(false);
      router.refresh();
    }

    setIsDeleting(false);
  };

  const columns = useMemo<ColumnDef<ContactMessage>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          return <span className="font-medium">{row.getValue("name")}</span>;
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email")}</div>,
      },
      {
        accessorKey: "created_at",
        header: "Time",
        cell: ({ row }) => {
          const date = row.getValue("created_at") as Date;
          return <div className="text-muted-foreground text-sm">{formatRelativeTime(date)}</div>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const message = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => handleDeleteClick(message.id, e)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete message</span>
            </Button>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: messages,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Your inbox is empty. Contact messages will appear here once submitted through the
              contact form.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => handleOpenMessage(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Message View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailIcon className="h-5 w-5" />
              {selectedMessage?.subject || "Contact Message"}
            </DialogTitle>
            <DialogDescription>
              {selectedMessage && formatRelativeTime(selectedMessage.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{selectedMessage.name}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedMessage.email}</span>
                </div>
              </div>
              {selectedMessage.subject && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Subject</h4>
                  <p className="text-sm">{selectedMessage.subject}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold mb-2">Message</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedMessage) {
                  handleDeleteFromDialog(selectedMessage.id);
                }
              }}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isDeleting}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
