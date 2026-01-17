import { useEffect, useRef, useState } from "react";
import { MainNav } from "@/components/MainNav";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMediaUrl } from "@/lib/media";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { Search, Send, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";


interface Attachment {
  type: "image" | "video" | "file";
  url: string;
  originalName?: string;
}

interface SenderDetailsUser {
  firstName: string;
  lastName: string;
  image?: string;
}

interface SenderDetailsCompany {
  name: string;
  logo?: string;
}

interface Sender {
  id: string;
  type: "User" | "Company";
  details?: SenderDetailsUser | SenderDetailsCompany | null;
}

interface ChatMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender?: Sender;
  attachments?: Attachment[];
}

interface Conversation {
  _id: { u1: string; u2: string };
  participant: Sender;
  lastMessage: ChatMessage;
}


export default function MessagesPage() {
  const { user, isAuthenticated, isLoading, company } = useAuth();
  const { unreadCount } = useUnreadNotifications(); 
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const myId = user?._id || company?._id;
  const myType: "User" | "Company" = user ? "User" : "Company";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
const [searchParams] = useSearchParams();
const targetUserId = searchParams.get("user");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [messageInput, setMessageInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (isAuthenticated) {
      const fetchUser = async () => {
        try {
          const userData = await api.getUserProfile();
          setCurrentUser(userData);
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      };
      fetchUser();
    }
  }, [isAuthenticated]);


  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const previewUrl = (file: File) => URL.createObjectURL(file);

  const getOtherParticipantId = (conv: Conversation) => {
    if (!myId) return null;
    return conv._id.u1 === myId ? conv._id.u2 : conv._id.u1;
  };

  const getParticipantName = (p?: Sender) => {
    if (!p?.details) return "Unknown";
    return p.type === "Company"
      ? (p.details as SenderDetailsCompany).name
      : `${(p.details as SenderDetailsUser).firstName} ${(p.details as SenderDetailsUser).lastName}`;
  };

  const getParticipantAvatar = (p?: Sender) => {
    if (!p?.details) return undefined;
    return p.type === "Company"
      ? formatMediaUrl((p.details as SenderDetailsCompany).logo)
      : formatMediaUrl((p.details as SenderDetailsUser).image);
  };
  

  const normalizeMessage = (m: any): ChatMessage => {
    if (!m) return m;

    if (m.sender?.id) return m;
    return {
      ...m,
      sender: { id: m.sender, type: m.senderType, details: null },
    };
  };


  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        setLoadingConversations(true);
        const data = await api.getConversations();
        setConversations(Array.isArray(data) ? data : []);
        
        try {
          const response = await api.getMyConnections();
          setAvailableUsers(Array.isArray(response) ? response : []);
        } catch (err) {
          console.error("Failed to fetch connections:", err);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConversations(false);
      }
    })();
  }, [isAuthenticated]);

 

useEffect(() => {
  if (!targetUserId || loadingConversations || !myId) return;


  const existingConv = conversations.find(conv => {
    const otherId = getOtherParticipantId(conv);
    return otherId === targetUserId;
  });

  if (existingConv) {
   
    if (selectedConversation?._id !== existingConv._id) {
      openConversation(existingConv);
    }
    return;
  }

  if (!selectedConversation || getOtherParticipantId(selectedConversation) !== targetUserId) {
    (async () => {
      try {
        const participant = await api.getPublicProfile(targetUserId);

        const tempConversation: Conversation = {
          _id: { u1: myId, u2: targetUserId },
          participant: {
            id: participant._id,
            type: "User",
            details: {
              firstName: participant.firstName,
              lastName: participant.lastName,
              image: participant.image
            }
          },
          lastMessage: {
            _id: "temp",
            content: "",
            createdAt: new Date().toISOString()
          }
        };

        setSelectedConversation(tempConversation);
        
        try {
          const data = await api.getChatHistory(targetUserId);
          setMessages(Array.isArray(data) ? data.map(normalizeMessage) : []);
          setTimeout(scrollToBottom, 100);
        } catch (err) {
          console.error("Failed to load chat history:", err);
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load participant profile", err);
      }
    })();
  }
}, [targetUserId, loadingConversations, conversations, myId]);

    

      const openConversation = async (conv: Conversation) => {
  if (selectedConversation?._id === conv._id && messages.length > 0) {
    return;
  }
  
  setSelectedConversation(conv);
  setLoadingMessages(true);

  try {
    const otherId = getOtherParticipantId(conv);
    if (!otherId) return;

    const data = await api.getChatHistory(otherId);
    const normalizedMessages = Array.isArray(data) 
      ? data.map(normalizeMessage) 
      : [];
    
    setMessages(normalizedMessages);
    setTimeout(scrollToBottom, 100);
  } finally {
    setLoadingMessages(false);
  }
};



  const handleSendMessage = async () => {
    if (
      (!messageInput.trim() && selectedFiles.length === 0) ||
      !selectedConversation ||
      sending ||
      !myId
    )
      return;

    const receiverId = getOtherParticipantId(selectedConversation);
    if (!receiverId) return;

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("receiverId", receiverId);
      formData.append("receiverType", selectedConversation.participant.type);
      formData.append("content", messageInput.trim());
      selectedFiles.forEach(file => formData.append("files", file));

      const sent = await api.sendMessage(formData);

      const normalizedMessage = normalizeMessage({
        ...sent,
        sender: {
          id: myId,
          type: myType,
          details: myType === "User"
            ? {
              firstName: user?.firstName,
              lastName: user?.lastName,
              image: user?.image,
            }
            : {
              name: company?.name,
              logo: company?.logo,
            },
        },
      });

      setMessages(prev => [...prev, normalizedMessage]);

      setConversations(prev => {
        const existingConvIndex = prev.findIndex(conv => {
          const otherId = getOtherParticipantId(conv);
          return otherId === receiverId;
        });

        if (existingConvIndex >= 0) {
          const updated = [...prev];
          updated[existingConvIndex] = {
            ...updated[existingConvIndex],
            lastMessage: normalizedMessage
          };
          return updated;
        } else {
       
          const newConv: Conversation = {
            _id: selectedConversation._id,
            participant: selectedConversation.participant,
            lastMessage: normalizedMessage
          };
          return [newConv, ...prev];
        }
      });

      setMessageInput("");
      setSelectedFiles([]);
      setTimeout(scrollToBottom, 50);
    } finally {
      setSending(false);
    }
  };


  useEffect(() => {
    return () => {
      selectedFiles.forEach(file =>
        URL.revokeObjectURL(previewUrl(file))
      );
    };
  }, [selectedFiles]);

 
  const navbarUser = isAuthenticated ? (
    currentUser ? {
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email,
      avatar: formatMediaUrl(currentUser.image),
      role: "user" as const
    } : {
      name: "Loading...",
      email: "",
      avatar: undefined,
      role: "user" as const
    }
  ) : undefined;


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <MainNav user={navbarUser} unreadNotifications={unreadCount} />
      
      <PageContainer className="pt-6">
        <div className="grid grid-cols-[320px_1fr] gap-4">

          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b font-semibold">Messages</div>

            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search people or conversations..."
                  className="w-full pl-9 pr-3 py-2 rounded-md border text-sm"
                />
              </div>
            </div>

            {loadingConversations ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                {conversations.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/30">
                      Conversations
                    </div>
                    <div className="divide-y">
                      {conversations
                        .filter(c =>
                          getParticipantName(c.participant)
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map(conv => (
                          <button
                            key={`${conv._id.u1}_${conv._id.u2}`}
                            onClick={() => openConversation(conv)}
                            className={`w-full p-4 text-left hover:bg-secondary/50 flex gap-3 transition-colors ${
                              selectedConversation?._id === conv._id ? 'bg-secondary' : ''
                            }`}
                          >
                            <UserAvatar
                              name={getParticipantName(conv.participant)}
                              src={getParticipantAvatar(conv.participant)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {getParticipantName(conv.participant)}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage?.content || "Attachment"}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </>
                )}

              
                {availableUsers.length > 0 && searchQuery && (
                  <>
                  
                    <div className="divide-y">
                      {availableUsers
                        .filter(user =>
                          `${user.firstName} ${user.lastName}`
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .filter(user => {
                       
                          return !conversations.some(conv => {
                            const otherId = getOtherParticipantId(conv);
                            return otherId === user._id;
                          });
                        })
                        .map(user => (
                          <button
                            key={user._id}
                            onClick={() => {
                              const tempConversation: Conversation = {
                                _id: { u1: myId || '', u2: user._id },
                                participant: {
                                  id: user._id,
                                  type: "User",
                                  details: {
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    image: user.image
                                  }
                                },
                                lastMessage: {
                                  _id: "temp",
                                  content: "",
                                  createdAt: new Date().toISOString()
                                }
                              };
                              setSelectedConversation(tempConversation);
                              setMessages([]);
                              setSearchQuery("");
                            }}
                            className="w-full p-4 text-left hover:bg-secondary/50 flex gap-3 transition-colors"
                          >
                            <UserAvatar
                              name={`${user.firstName} ${user.lastName}`}
                              src={formatMediaUrl(user.image)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {user.headline || "No headline"}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </>
                )}

                {conversations.length === 0 && (!searchQuery || availableUsers.length === 0) && (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start a conversation with someone!</p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          <GlassCard className="flex flex-col h-[600px] p-0 overflow-hidden">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            ) : (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                <UserAvatar
                  name={getParticipantName(selectedConversation.participant)}
                  src={getParticipantAvatar(selectedConversation.participant)}
                />

                <button
                  onClick={() =>
                    navigate(`/profile/${selectedConversation.participant.id}`)
                  }
                  className="font-semibold hover:underline hover:text-primary transition"
                >
                  {getParticipantName(selectedConversation.participant)}
                </button>
              </div>


                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map(m => {
                      const isMe =
                        m.sender?.id === myId &&
                        m.sender?.type === myType;

                      return (
                        <div
                          key={m._id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border"
                            }`}
                          >
                            {m.content}
                            {m.attachments?.map((a, i) =>
                              a.type === "image" ? (
                                <img
                                  key={i}
                                  src={formatMediaUrl(a.url)}
                                  className="mt-2 rounded max-h-48"
                                  alt="Attachment"
                                />
                              ) : (
                                <a
                                  key={i}
                                  href={formatMediaUrl(a.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs underline mt-1"
                                >
                                  <Paperclip className="inline h-3 w-3" />{" "}
                                  {a.originalName || "File"}
                                </a>
                              )
                            )}
                            <div className="text-xs text-opacity-70 mt-1">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No messages yet</p>
                      <p className="text-sm mt-1">Send a message to start the conversation!</p>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>


                {selectedFiles.length > 0 && (
                  <div className="px-4 py-2 border-t flex gap-2 flex-wrap">
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="relative border rounded p-2 text-xs flex items-center gap-2"
                      >
                        {file.type.startsWith("image") ? (
                          <img
                            src={previewUrl(file)}
                            className="h-16 w-16 object-cover rounded"
                            alt="Preview"
                          />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                        <span className="truncate max-w-[100px]">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFiles(f =>
                              f.filter((_, idx) => idx !== i)
                            )
                          }
                          className="text-red-500 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}


                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-4 border-t flex gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={e =>
                      setSelectedFiles(
                        e.target.files ? Array.from(e.target.files) : []
                      )
                    }
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 rounded-md border"
                    disabled={sending}
                  />
                  <button 
                    type="submit" 
                    disabled={sending || (!messageInput.trim() && selectedFiles.length === 0)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            )}
          </GlassCard>
        </div>
      </PageContainer>
    </div>
  );
}