"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getReceivedMessages, getSentMessages, markMessageAsRead } from "@/lib/firebase/messages";
import { getEvent } from "@/lib/firebase/events";
import { getUser } from "@/lib/firebase/users";
import { Message, Event, User as UserData } from "@/lib/firebase/types";

export const dynamic = 'force-dynamic';

interface MessageWithDetails extends Message {
  event?: Event;
  sender?: UserData;
  receiver?: UserData;
}

export default function MessagesPage() {
  const [user] = useAuthState(auth!);
  const [receivedMessages, setReceivedMessages] = useState<MessageWithDetails[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithDetails | null>(null);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 받은 쪽지와 보낸 쪽지 가져오기
      const [received, sent] = await Promise.all([
        getReceivedMessages(user.uid),
        getSentMessages(user.uid),
      ]);
      
      // 받은 쪽지 상세 정보 로드
      const receivedWithDetails = await Promise.all(
        received.map(async (msg) => {
          try {
            const [event, sender] = await Promise.all([
              getEvent(msg.eventId).catch(() => null),
              getUser(msg.senderId).catch(() => null),
            ]);
            return { ...msg, event: event || undefined, sender: sender || undefined };
          } catch (error) {
            console.error("쪽지 상세 정보 로드 실패:", error);
            return { ...msg, event: undefined, sender: undefined };
          }
        })
      );
      
      // 보낸 쪽지 상세 정보 로드
      const sentWithDetails = await Promise.all(
        sent.map(async (msg) => {
          try {
            const [event, receiver] = await Promise.all([
              getEvent(msg.eventId).catch(() => null),
              getUser(msg.receiverId).catch(() => null),
            ]);
            return { ...msg, event: event || undefined, receiver: receiver || undefined };
          } catch (error) {
            console.error("쪽지 상세 정보 로드 실패:", error);
            return { ...msg, event: undefined, receiver: undefined };
          }
        })
      );
      
      setReceivedMessages(receivedWithDetails);
      setSentMessages(sentWithDetails);
    } catch (error) {
      console.error("쪽지 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message: MessageWithDetails) => {
    setSelectedMessage(message);
    
    // 받은 쪽지이고 읽지 않았다면 읽음 처리
    if (activeTab === "received" && !message.read) {
      try {
        await markMessageAsRead(message.messageId);
        // 로컬 상태 업데이트
        setReceivedMessages(prev =>
          prev.map(msg =>
            msg.messageId === message.messageId ? { ...msg, read: true } : msg
          )
        );
      } catch (error) {
        console.error("읽음 처리 실패:", error);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const messages = activeTab === "received" ? receivedMessages : sentMessages;
  const unreadCount = receivedMessages.filter(msg => !msg.read).length;

  return (
    <div className="min-h-screen text-gray-800 pt-4 pb-24 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">
            내 쪽지
          </h1>
          <p className="text-gray-600 mt-2">보낸 쪽지와 받은 쪽지를 확인할 수 있습니다.</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-6 py-3 font-semibold transition relative ${
              activeTab === "received"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            받은 쪽지
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "sent"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            보낸 쪽지
          </button>
        </div>

        {/* 쪽지 목록 */}
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {activeTab === "received" ? "받은 쪽지가 없습니다." : "보낸 쪽지가 없습니다."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const otherUser = activeTab === "received" ? message.sender : message.receiver;
              
              return (
                <div
                  key={message.messageId}
                  onClick={() => handleMessageClick(message)}
                  className={`card-elegant card-hover p-4 cursor-pointer ${
                    activeTab === "received" && !message.read ? "bg-blue-50 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                      {otherUser?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {otherUser?.name || "알 수 없음"}
                          </span>
                          {activeTab === "received" && !message.read && (
                            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                              새
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {message.createdAt.toLocaleString("ko-KR")}
                        </span>
                      </div>
                      {message.event && (
                        <p className="text-sm text-gray-600 mb-2">
                          행사: {message.event.title}
                        </p>
                      )}
                      <p className="text-gray-700 line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 쪽지 상세 모달 */}
        {selectedMessage && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMessage(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {(activeTab === "received" ? selectedMessage.sender : selectedMessage.receiver)?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {(activeTab === "received" ? selectedMessage.sender : selectedMessage.receiver)?.name || "알 수 없음"}
                    </h3>
                    {selectedMessage.event && (
                      <p className="text-sm text-gray-600">
                        {selectedMessage.event.title}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <span className="text-xs text-gray-500">
                  {selectedMessage.createdAt.toLocaleString("ko-KR")}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



