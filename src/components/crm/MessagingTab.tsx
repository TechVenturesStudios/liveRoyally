
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Send, Paperclip } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample data for conversations
const conversations = [
  { 
    id: 1, 
    name: "Metro Diner", 
    lastMessage: "When can we expect the new promotional materials?",
    time: "10:30 AM",
    unread: true
  },
  { 
    id: 2, 
    name: "City Fitness Center", 
    lastMessage: "Thanks for sending over the new contract details.",
    time: "Yesterday",
    unread: false
  },
  { 
    id: 3, 
    name: "Riverfront Spa", 
    lastMessage: "We'd like to participate in the upcoming event.",
    time: "Yesterday",
    unread: true
  },
  { 
    id: 4, 
    name: "Sunrise Bakery", 
    lastMessage: "The new campaign looks great! When does it go live?",
    time: "Mon",
    unread: false
  },
  { 
    id: 5, 
    name: "Downtown Books", 
    lastMessage: "Can we schedule a call to discuss membership benefits?",
    time: "Sun",
    unread: false
  }
];

// Sample messages for a conversation
const sampleMessages = [
  {
    id: 1,
    sender: "Metro Diner",
    content: "Hello! We're interested in the upcoming holiday promotion. Can you provide more details?",
    time: "10:15 AM",
    isMe: false
  },
  {
    id: 2,
    sender: "You",
    content: "Hi there! Absolutely. The holiday promotion will run from December 1st to January 15th. Would you like me to send over the complete package?",
    time: "10:20 AM",
    isMe: true
  },
  {
    id: 3,
    sender: "Metro Diner",
    content: "Yes, please! Also, when can we expect the new promotional materials?",
    time: "10:30 AM",
    isMe: false
  }
];

const MessagingTab = () => {
  const [activeConversation, setActiveConversation] = useState(conversations[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(sampleMessages);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: "You",
        content: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-1">
        <CardHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative w-full max-w-sm mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search contacts..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-350px)]">
            {filteredConversations.map((conversation) => (
              <div 
                key={conversation.id}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b
                  ${activeConversation.id === conversation.id ? 'bg-muted/50' : 'hover:bg-muted/20'}`}
                onClick={() => setActiveConversation(conversation)}
              >
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {conversation.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{conversation.name}</p>
                    <p className="text-xs text-muted-foreground">{conversation.time}</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                )}
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader className="px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {activeConversation?.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{activeConversation?.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col">
          <ScrollArea className="flex-1 h-[calc(100vh-350px)] p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] rounded-lg p-3 
                      ${message.isMe 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                      }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 
                      ${message.isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t mt-auto">
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea 
                placeholder="Type your message..." 
                className="min-h-10 resize-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button size="icon" className="shrink-0" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagingTab;
