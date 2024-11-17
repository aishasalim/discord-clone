import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, PlusIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreateServer() {
  const imageUpload = useImageUpload();
  const createServer = useMutation(api.functions.server.create);
  const [name, setName] = useState("");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { serverId, defaultChannelId } = await createServer({
        name,
        iconId: imageUpload.storageId,
      });
      router.push(`/servers/${serverId}/channels/${defaultChannelId}`);
      setOpen(false);
    } catch (e) {
      toast.error("Failed to create a server", {
        description:
          e instanceof Error ? e.message : "An unknown error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton tooltip="Create Server">
          <PlusIcon />
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Server</DialogTitle>
        </DialogHeader>
        <form action="" className="content" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2 mb-4">
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Icon</Label>
            <div className="flex items-center gap-4">
              <input {...imageUpload.inputProps} />
              <Avatar className="size-10 border">
                {imageUpload.previewUrl && (
                  <AvatarImage src={imageUpload.previewUrl} />
                )}
                <AvatarFallback>
                  <ImageIcon className="text-muted-foreground size-4" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                type="button"
                size="sm"
                onClick={imageUpload.open}
              >
                {imageUpload.isUploading ? "Uploading..." : "Upload Icon"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={imageUpload.isUploading || !name}>
              {imageUpload.isUploading ? "Uploading..." : "Create Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
