"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import {
  LoaderIcon,
  MoreVerticalIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
} from "lucide-react";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Image from "next/image";

export default function MessagePage({
  params,
}: {
  params: Promise<{ id: Id<"directMessages"> }>;
}) {
  const { id } = use(params);

  const directMessage = useQuery(api.functions.dms.get, { id });
  const messages = useQuery(api.functions.message.list, { directMessage: id });

  if (!directMessage) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 divide-y max-h-screen">
      <header className="flex items-center gap-2 p-4">
        <Avatar className="size-8 border">
          <AvatarImage src={directMessage.user.image} />
          <AvatarFallback></AvatarFallback>
        </Avatar>
        <h1 className="font-semibold">{directMessage.user.username}</h1>
      </header>
      <ScrollArea className="h-full py-4">
        {messages?.map((message) => (
          <MessageItem key={message._id} message={message} />
        ))}
      </ScrollArea>
      <MessageInput directMessage={id} />
    </div>
  );
}

function TypingIndicator({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const usernames = useQuery(api.functions.typing.list, { directMessage });
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots.length >= 3) {
          return "";
        } else {
          return prevDots + ".";
        }
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  if (!usernames || usernames.length === 0) return null;

  return (
    <div className="text-sm text-muted-foreground px-4 py-2">
      {usernames.join(", ")} is typing{dots}
    </div>
  );
}

type Message = FunctionReturnType<typeof api.functions.message.list>[number];

// Doc<"messages"> represents a message
function MessageItem({ message }: { message: Message }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Avatar className="size-8 border">
        {message.sender && <AvatarImage src={message.sender.image} />}
        <AvatarFallback />
      </Avatar>
      <div className="flex flex-col mr-auto">
        <p className="text-xs text-muted-foreground">
          {message.sender?.username ?? "Deleted User "}
        </p>
        <p className="text-sm ">{message.content} </p>
        {message.attachment && (
          <Image
            src={message.attachment}
            alt="Attachment"
            width={300}
            height={300}
            className="rounded border overflow-hidden"
          />
        )}
      </div>
      <MessageActions message={message} />
    </div>
  );
}
function MessageActions({ message }: { message: Message }) {
  const user = useQuery(api.functions.user.get);
  const removeMutation = useMutation(api.functions.message.remove);

  if (!user || message.sender!._id !== user._id) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreVerticalIcon className="size-4 text-muted-foreground" />
        <span className="sr-only">Message Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => removeMutation({ id: message._id })}
        >
          <TrashIcon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function MessageInput({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const [content, setContent] = useState("");
  const sendMessage = useMutation(api.functions.message.create);
  const sendTypingIndicator = useMutation(api.functions.typing.upsert);
  const removeTypingIndicator = useMutation(api.functions.typing.remove);
  const [file, setFile] = useState<File>();
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(
    api.functions.message.generateUploadUrl
  );
  const [attachment, setAtachment] = useState<Id<"_storage">>();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setUploading(true);

    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        body: file,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      setAtachment(storageId);
      toast.success("Image uploaded successfully!", {
        duration: 1000,
      });
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = () => {
    if (!typing) {
      setTyping(true);
      sendTypingIndicator({ directMessage });
      typingIntervalRef.current = setInterval(() => {
        sendTypingIndicator({ directMessage });
      }, 4000);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      removeTypingIndicator({ directMessage });
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendMessage({ directMessage, attachment, content });
      setContent("");
      setAtachment(undefined);
      setFile(undefined); // Clear the file state after sending the message
      setTyping(false);

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }

      removeTypingIndicator({ directMessage });
      toast.success("Message sent successfully!", {
        duration: 1000,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  return (
    <>
      <TypingIndicator directMessage={directMessage} />
      <form onSubmit={handleSubmit} className="flex items-end p-4 gap-2">
        <Button
          type="button"
          size="icon"
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          <PlusIcon />
          <span className="sr-only">Attach</span>
        </Button>
        <div className="flex flex-col flex-1 gap-2">
          {file && <ImagePreview file={file} isUploading={uploading} />}
          <Input
            placeholder="Message"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTyping();
            }}
            onBlur={() => {
              setTyping(false);
              if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
              }
              removeTypingIndicator({ directMessage });
            }}
          />
        </div>

        <Button size="icon">
          <SendIcon />
          <span className="sr-only">Send</span>
        </Button>
      </form>
      <input
        type="file"
        className="hidden"
        id=""
        ref={fileInputRef}
        onChange={handleImageUpload}
      />
    </>
  );
}

function ImagePreview({
  file,
  isUploading,
}: {
  file: File;
  isUploading: boolean;
}) {
  return (
    <div className="relative size-40 overflow-hidden rounded border">
      <Image
        src={URL.createObjectURL(file)}
        alt="Attachment"
        width={300}
        height={300}
      />
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <LoaderIcon className="animate-spin size-6" />
        </div>
      )}
    </div>
  );
}
