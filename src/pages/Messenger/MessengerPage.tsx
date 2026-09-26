import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import axios from "axios";
import {
  Send,
  MessageSquare,
  Bot,
  User as UserIcon,
  Search,
  CheckCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface Conversation {
  conversationId: string;
  partnerId: string;
  partnerType: string;
  partnerName: string;
  partnerAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  isLastMessageMine: boolean;
  unreadCount: number;
}

interface MessageItem {
  _id?: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  recipientType: string;
  recipientName: string;
  content: string;
  createdAt?: string;
  isRead?: boolean;
}

export const MessengerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const partnerQueryId = searchParams.get("partner");
  const partnerQueryName = searchParams.get("name");

  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const currentUserId = auth.user?._id;
  const currentUserName =
    auth.user?.username ||
    `${auth.user?.firstName || ""} ${auth.user?.lastName || ""}`.trim() ||
    "User";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations list
  const fetchConversations = async () => {
    if (!currentUserId) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_PROXY}/api/messages/conversations/${currentUserId}`
      );
      setConversations(res.data);

      // If a partner query param was passed, select or create that conversation
      if (partnerQueryId) {
        const found = res.data.find(
          (c: Conversation) => c.partnerId.toUpperCase() === partnerQueryId.toUpperCase()
        );
        if (found) {
          setActiveConv(found);
        } else {
          // Initialize active conversation with the requested partner
          const isAgent = ["DEBUGGER", "ARCHITECT", "SECURITY", "PERFORMANCE"].includes(
            partnerQueryId.toUpperCase()
          );
          const newConv: Conversation = {
            conversationId: `conv_${[currentUserId, partnerQueryId].sort().join("_")}`,
            partnerId: partnerQueryId,
            partnerType: isAgent ? "AGENT" : "USER",
            partnerName: partnerQueryName || partnerQueryId,
            partnerAvatar: isAgent
              ? `https://api.dicebear.com/7.x/bottts/svg?seed=${partnerQueryId}`
              : `https://api.dicebear.com/7.x/identicon/svg?seed=${partnerQueryId}`,
            lastMessage: "Start a conversation...",
            lastMessageAt: new Date().toISOString(),
            isLastMessageMine: false,
            unreadCount: 0,
          };
          setActiveConv(newConv);
          setConversations((prev) => [newConv, ...prev]);
        }
      } else if (!activeConv && res.data.length > 0) {
        setActiveConv(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    fetchConversations();
  }, [currentUserId, partnerQueryId]);

  // Load active thread messages
  useEffect(() => {
    if (!activeConv || !currentUserId) return;

    const fetchThread = async () => {
      try {
        setIsLoadingThread(true);
        const res = await axios.get(
          `${import.meta.env.VITE_APP_PROXY}/api/messages/thread/${activeConv.conversationId}`
        );
        setMessages(res.data);

        // Mark as read
        if (activeConv.unreadCount > 0) {
          await axios.put(
            `${import.meta.env.VITE_APP_PROXY}/api/messages/read/${activeConv.conversationId}`,
            { userId: currentUserId }
          );
          setActiveConv((prev) => (prev ? { ...prev, unreadCount: 0 } : null));
        }
      } catch (err) {
        console.error("Failed to load message thread:", err);
      } finally {
        setIsLoadingThread(false);
      }
    };

    fetchThread();
  }, [activeConv?.conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv || !currentUserId || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic local message
    const tempMsg: MessageItem = {
      conversationId: activeConv.conversationId,
      senderId: currentUserId,
      senderType: "USER",
      senderName: currentUserName,
      senderAvatar: auth.user?.avatarUrl || "",
      recipientId: activeConv.partnerId,
      recipientType: activeConv.partnerType,
      recipientName: activeConv.partnerName,
      content: messageText,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await axios.post(`${import.meta.env.VITE_APP_PROXY}/api/messages/send`, {
        conversationId: activeConv.conversationId,
        senderId: currentUserId,
        senderType: "USER",
        senderName: currentUserName,
        senderAvatar: auth.user?.avatarUrl || "",
        recipientId: activeConv.partnerId,
        recipientType: activeConv.partnerType,
        recipientName: activeConv.partnerName,
        content: messageText,
      });

      // Update thread with confirmed message and any agent reply
      if (res.data.reply) {
        setMessages((prev) => [...prev, res.data.reply]);
      }

      // Update conversation snippet in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === activeConv.conversationId
            ? {
                ...c,
                lastMessage: res.data.reply ? res.data.reply.content : messageText,
                lastMessageAt: new Date().toISOString(),
                isLastMessageMine: !res.data.reply,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="messenger">
      {/* Sidebar: Conversations List */}
      <aside className="messenger__sidebar">
        <div className="messenger__sidebar-header">
          <h2 className="messenger__sidebar-title">
            <MessageSquare size={18} style={{ color: "#38bdf8" }} />
            <span>Messages</span>
          </h2>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search conversations..."
              className="messenger__search-input"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="messenger__conv-list">
          {filteredConversations.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              <p>No conversations found.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConv?.conversationId === conv.conversationId;
              const isPartnerAgent = conv.partnerType === "AGENT";

              return (
                <button
                  key={conv.conversationId}
                  type="button"
                  className={`messenger__conv-item ${
                    isSelected ? "messenger__conv-item--active" : ""
                  }`}
                  onClick={() => setActiveConv(conv)}
                >
                  <div className="messenger__conv-avatar">
                    <img
                      src={
                        conv.partnerAvatar ||
                        `https://api.dicebear.com/7.x/${
                          isPartnerAgent ? "bottts" : "identicon"
                        }/svg?seed=${conv.partnerName}`
                      }
                      alt={conv.partnerName}
                    />
                  </div>

                  <div className="messenger__conv-meta">
                    <div className="messenger__conv-header">
                      <span className="messenger__conv-name">{conv.partnerName}</span>
                      {conv.unreadCount > 0 && (
                        <span className="messenger__conv-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                    <div className="messenger__conv-snippet">
                      {conv.isLastMessageMine ? "You: " : ""}
                      {conv.lastMessage}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="messenger__main">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="messenger__main-header">
              <div className="messenger__partner-info">
                <div className="messenger__partner-avatar">
                  <img
                    src={
                      activeConv.partnerAvatar ||
                      `https://api.dicebear.com/7.x/${
                        activeConv.partnerType === "AGENT" ? "bottts" : "identicon"
                      }/svg?seed=${activeConv.partnerName}`
                    }
                    alt={activeConv.partnerName}
                  />
                </div>

                <div>
                  <h3 className="messenger__partner-name">{activeConv.partnerName}</h3>
                  <div className="messenger__partner-status">
                    {activeConv.partnerType === "AGENT" ? (
                      <span style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                        <Bot size={13} /> Active Digital Citizen AI
                      </span>
                    ) : (
                      "Community Member"
                    )}
                  </div>
                </div>
              </div>

              {activeConv.partnerType !== "AGENT" && (
                <Link to={`/profile/${activeConv.partnerId}`}>
                  <button className="btn btn--ghost btn--sm" title="View Profile">
                    <ExternalLink size={14} className="btn__icon" />
                    <span className="btn__text">View Profile</span>
                  </button>
                </Link>
              )}
            </div>

            {/* Chat Messages Feed */}
            <div className="messenger__chat-feed">
              {isLoadingThread ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                  <Sparkles className="spin" size={20} style={{ color: "#38bdf8", marginBottom: "0.8rem" }} />
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="messenger__empty-chat">
                  <MessageSquare size={36} style={{ color: "var(--color-border)", marginBottom: "1rem" }} />
                  <h4 style={{ color: "#f8fafc", marginBottom: "0.4rem" }}>
                    Conversation with {activeConv.partnerName}
                  </h4>
                  <p>Send a message to start direct communication.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUserId;
                  const time = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <div
                      key={msg._id || idx}
                      className={`messenger__bubble-wrap ${
                        isMine
                          ? "messenger__bubble-wrap--mine"
                          : "messenger__bubble-wrap--theirs"
                      }`}
                    >
                      {!isMine && (
                        <div className="messenger__bubble-avatar">
                          <img
                            src={
                              msg.senderAvatar ||
                              `https://api.dicebear.com/7.x/${
                                msg.senderType === "AGENT" ? "bottts" : "identicon"
                              }/svg?seed=${msg.senderName}`
                            }
                            alt={msg.senderName}
                          />
                        </div>
                      )}

                      <div
                        className={`messenger__bubble ${
                          isMine ? "messenger__bubble--mine" : "messenger__bubble--theirs"
                        }`}
                      >
                        <div>{msg.content}</div>
                        <div className="messenger__bubble-meta">
                          <span>{time}</span>
                          {isMine && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form className="messenger__input-bar" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={
                  activeConv.partnerType === "AGENT"
                    ? `Message ${activeConv.partnerName} (instant persona reply)...`
                    : `Message ${activeConv.partnerName}...`
                }
                className="messenger__input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isSending}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn--primary messenger__send-btn"
                disabled={!inputText.trim() || isSending}
              >
                <Send size={15} />
                <span className="btn__text">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="messenger__empty-chat">
            <MessageSquare size={48} style={{ color: "var(--color-border)", marginBottom: "1.4rem" }} />
            <h3 style={{ color: "#f8fafc", marginBottom: "0.6rem" }}>Your Direct Messenger</h3>
            <p style={{ maxWidth: "340px" }}>
              Select a conversation from the sidebar to chat with community members or Digital Citizen AI organisms.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
