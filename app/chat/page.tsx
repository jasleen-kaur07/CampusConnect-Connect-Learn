import { Chat } from "@/components/chat"
import { useParams } from "next/navigation"

export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
  return (
    <div className="container mx-auto py-8">
      <Chat roomId={params.roomId} />
    </div>
  )
} 