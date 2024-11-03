import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckIcon, MessageCircleIcon, XIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function FriendsListEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-muted/50 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function PendingFriendsList() {
  const friends = useQuery(api.functions.friends.listPending);
  const updateStatus = useMutation(api.functions.friends.updateStatus);

  return (
    <div className="flex flex-col divide-y">
      <h2 className="text-xs font-medium text-muted-foreground p-2.5">
        Pending Friends
      </h2>
      {friends?.length === 0 && (
        <FriendsListEmpty>No friends requests yet.</FriendsListEmpty>
      )}
      {friends?.map((friend, index) => (
        <FriendItem
          key={index}
          username={friend.user.username}
          image={friend.user.image}
        >
          <IconButton
            title="Accept Friend"
            className=" hover:bg-green-100"
            icon={<CheckIcon />}
            onclick={() =>
              updateStatus({
                id: friend._id,
                status: "accepted",
              })
            }
          />

          <IconButton
            title="Reject Friend"
            className=" hover:bg-red-100"
            icon={<XIcon />}
            onclick={() =>
              updateStatus({
                id: friend._id,
                status: "rejected",
              })
            }
          />
        </FriendItem>
      ))}
    </div>
  );
}
export function AcceptedFriendsList() {
  const friends = useQuery(api.functions.friends.listAccepted);
  const updateStatus = useMutation(api.functions.friends.updateStatus);
  return (
    <div className="flex flex-col divide-y">
      <h2 className="text-xs font-medium text-muted-foreground p-2.5">
        Accepted Friends
      </h2>
      {friends?.length === 0 && (
        <FriendsListEmpty>No friends yet.</FriendsListEmpty>
      )}

      {friends?.map((friend, index) => (
        <FriendItem
          key={index}
          username={friend.user.username}
          image={friend.user.image}
        >
          <IconButton
            title="Start DM"
            className=""
            icon={<MessageCircleIcon />}
            onclick={() => {}}
          />
          <IconButton
            title="Remove Friend"
            className=" hover:bg-red-100"
            icon={<XIcon />}
            onclick={() =>
              updateStatus({
                id: friend._id,
                status: "rejected",
              })
            }
          />
        </FriendItem>
      ))}
    </div>
  );
}

function IconButton({
  title,
  className,
  icon,
  onclick,
}: {
  title: string;
  className?: string;
  icon: React.ReactNode;
  onclick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          className={cn("rounded-full", className)}
          size="icon"
          onClick={onclick}
        >
          {icon} <span className="sr-only">{title}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}

function FriendItem({
  username,
  image,
  children,
}: {
  username: string;
  image: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 gap-2.5">
      <div className="flex items-center gap-2 5">
        <Avatar className="size-8">
          <AvatarImage src={image} />
          <AvatarFallback>{username}</AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium">{username}</p>
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}