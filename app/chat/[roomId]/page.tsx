import { Chat } from "@/components/chat";

interface ChatRoomPageProps {
  params: { roomId: string };
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  return (
    <div className="container mx-auto py-8">
      <Chat roomId={params.roomId} />
    </div>
  );
} 