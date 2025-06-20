'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Card, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';

type Message = {
  role: 'user' | 'ai';
  text: string;
  createdAt?: string;
};

const userId = 'user123';

// กำหนดการแปลข้อความของคุณ
const translations = {
  th: {
    sidebarHeader: 'DISASTER CHATBOT',
    newChat: 'แชทใหม่',
    reportEmergency: 'แจ้งข้อมูลภัยพิบัติ',
    startConversation: 'เริ่มการสนทนาได้เลย...',
    aiThinking: 'AI กำลังคิด...',
    typeMessage: 'พิมพ์ข้อความ หรือกดไมค์เพื่อพูด...',
    loadingResponse: 'กำลังรอคำตอบ...',
    connectionError: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
    historyLoadError: '❌ โหลดประวัติการแชทไม่สำเร็จ',
    browserVoiceRecognition: 'เบราว์เซอร์ไม่รองรับ Voice Recognition',
    send: 'ส่ง',
    cancel: 'ยกเลิก',
    reportTitle: 'แจ้งข้อมูลภัยพิบัติ',
    reportDescription: 'ภัยพิบัติสามารถเกิดขึ้นได้ทุกเมื่อ โดยไม่ทันตั้งตัว การแจ้งเหตุที่รวดเร็วและแม่นยำจะช่วยให้หน่วยงานสามารถเข้าถึงพื้นที่ได้ทันท่วงทีลดความสูญเสีย และช่วยเหลือผู้ประสบภัยอย่างมีประสิทธิภาพ โปรดรายงานเหตุการณ์ที่พบเห็นเพื่อร่วมเป็นส่วนหนึ่งในการปกป้องชีวิตและความปลอดภัยของทุกคน',
    noGeolocation: 'เบราว์เซอร์ไม่รองรับ Geolocation',
    cannotGetLocation: 'ไม่สามารถขอพิกัดได้: ',
    confirmReportTitle: 'ยืนยันการแจ้งข้อมูล?',
    confirmReportText: 'โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน',
    confirmReportButton: 'ใช่, ยืนยัน!',
    cancelReportButton: 'ไม่, ยกเลิก',
    reportSuccessTitle: 'สำเร็จ!',
    reportSuccessText: 'รายงานของคุณถูกส่งเรียบร้อยแล้ว.',
    reportErrorTitle: 'เกิดข้อผิดพลาด!',
    reportErrorMessage: 'ไม่สามารถส่งรายงานได้: ',
    connectionErrorServer: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์.',
    reportCanceled: 'การส่งรายงานถูกยกเลิก.',
    cannotListen: '⚠️ ไม่สามารถฟังเสียงได้: ',
    allowLocationShare: 'ไม่สามารถระบุตำแหน่งของคุณได้ กรุณาอนุญาตให้แชร์พิกัด',
    yourBrowserNotSupportVoiceRecognition: 'เบราว์เซอร์ของคุณไม่รองรับการแปลงเสียงเป็นข้อความ'

  },
  en: {
    sidebarHeader: 'DISASTER CHATBOT',
    newChat: 'New Chat',
    reportEmergency: 'Report Disaster ',
    startConversation: 'Start a conversation...',
    aiThinking: 'AI is thinking...',
    typeMessage: 'Type a message or press mic to speak...',
    loadingResponse: 'Waiting for response...',
    connectionError: '❌ Error connecting to server',
    historyLoadError: '❌ Failed to load chat history',
    browserVoiceRecognition: 'Your browser does not support Voice Recognition',
    send: 'Send',
    cancel: 'Cancel',
    reportTitle: 'Report Disaster Information',
    reportDescription: 'Disasters can happen at any time, without warning. Rapid and accurate reporting will help agencies reach the area in a timely manner, reducing losses and effectively assisting those affected. Please report any incidents you witness to be part of protecting everyone\'s lives and safety.',
    noGeolocation: 'Browser does not support Geolocation',
    cannotGetLocation: 'Could not get location: ',
    confirmReportTitle: 'Confirm report?',
    confirmReportText: 'Please check the information before confirming',
    confirmReportButton: 'Yes, confirm!',
    cancelReportButton: 'No, cancel',
    reportSuccessTitle: 'Success!',
    reportSuccessText: 'Your report has been submitted successfully.',
    reportErrorTitle: 'Error!',
    reportErrorMessage: 'Failed to send report: ',
    connectionErrorServer: 'Error connecting to server.',
    reportCanceled: 'Report submission canceled.',
    cannotListen: '⚠️ Cannot listen: ',
    allowLocationShare: 'Unable to determine your location. Please allow location sharing.',
    yourBrowserNotSupportVoiceRecognition: 'Your browser does not support voice-to-text conversion'
  },
};

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/${userId}`);
        setChat(res.data.messages || []);
      } catch {
        setChat([{ role: 'ai', text: translations[language].historyLoadError }]);
      }
    };
    fetchHistory();

    return () => window.removeEventListener('resize', handleResize);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'th' ? 'en' : 'th'));
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMsg: Message = { role: 'user', text: message, createdAt: new Date().toISOString() };
    setChat(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/chat/chat', { userId, message });
      const aiMsg: Message = { role: 'ai', text: res.data.response, createdAt: new Date().toISOString() };
      setChat(prev => [...prev, aiMsg]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'ai', text: translations[language].connectionError }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(translations[language].yourBrowserNotSupportVoiceRecognition);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'th' ? 'th-TH' : 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    setIsListening(true);

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // วนลูปผ่านผลลัพธ์เพื่อแยก interim และ final
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }


      setMessage(finalTranscript || interimTranscript);
      if (finalTranscript) {
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      alert(translations[language].cannotListen + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
  };

  const handleNewChat = () => {
    setChat([]);
    if (isMobile) setSidebarOpen(false);
  };

  const handleReportEmergency = () => {
    router.push('/report');
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {!sidebarOpen && (
        <Button variant="light" className="menu-toggle-button" onClick={() => setSidebarOpen(true)}>
          <img src="/menu.png" alt="Menu" style={{ width: '24px', height: '24px' }} />
        </Button>
      )}

      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
        {sidebarOpen && (
          <>
            <div className="sidebar-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0 d-flex align-items-center text-black text-bold">
                <img src="/robot.png" alt="bot" style={{ width: '36px', height: '36px', marginRight: '12px' }} />
                <span>{translations[language].sidebarHeader}</span>
              </h6>
              <Button variant="outline-secondary" className="btn-close-sidebar" onClick={() => setSidebarOpen(false)}>
                <img src="/menu.png" alt="Close" style={{ width: '24px', height: '24px' }} />
              </Button>
            </div>
            <br />
            <div className="flex-grow-1 p-2" style={{ overflowY: 'auto' }}>
              <Button className="st-button-like btn-light w-100 mb-3" onClick={handleNewChat}>
                <img src="/newchat.png" alt="New Chat" style={{ width: '24px', marginRight: '8px' }} /> {translations[language].newChat}
              </Button>
              <Button className="st-button-like btn-danger w-100 mb-3" onClick={handleReportEmergency}>
                <img src="/emergency.png" alt="Emergency" style={{ width: '24px', marginRight: '8px' }} /> {translations[language].reportEmergency}
              </Button>
            </div>
          </>
        )}
      </div>

      {isMobile && sidebarOpen && <div className="overlay show" onClick={() => setSidebarOpen(false)}></div>}

      <div
        className="main-content"
        style={{
          maxWidth: sidebarOpen ? 'calc(100% - 280px)' : '100%',
          width: '100%',
          transition: 'max-width 0.3s ease',
        }}
      >
        <div className="chat-header p-4 text-center">
          {/* TH/EN button added here based on your image */}
          <Button variant="outline-secondary" onClick={toggleLanguage} style={{ position: 'absolute', top: '15px', right: '15px' }}>
            {language.toUpperCase()}/{(language === 'th' ? 'EN' : 'TH')}
          </Button>
        </div>

        <Card className="chat-container-card flex-grow-1 mx-4 my-3">
          <Card.Body>
            {chat.length === 0 && <p className="text-secondary text-center">{translations[language].startConversation}</p>}

            {chat.map((msg, i) => (
              <div key={i}>
                <div className="d-flex align-items-start mb-2">
                  {msg.role === 'ai' && (
                    <img
                      src="/robot.png"
                      alt="AI Avatar"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        marginRight: '10px',
                        marginTop: '8px',
                        flexShrink: 0
                      }}
                    />
                  )}
                  <div
                    className={`${msg.role === 'user' ? 'user-message-bubble' : 'assistant-message-bubble'
                      }`}
                    style={{
                      maxWidth: '70%',
                      wordWrap: 'break-word',
                    }}
                  >
                    {msg.role === 'ai' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <div style={{ margin: '0.2rem 0', lineHeight: '1.5' }}>{children}</div>,
                          ul: ({ children }) => <ul style={{ paddingLeft: '1.25rem', margin: '0.2rem 0' }}>{children}</ul>,
                          li: ({ children }) => <li style={{ marginBottom: '0.1rem' }}>{children}</li>,
                          code: ({ children }) => (
                            <code
                              style={{
                                backgroundColor: '#f5f5f5',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontSize: '0.92rem',
                                fontFamily: 'monospace'
                              }}
                            >
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre
                              style={{
                                backgroundColor: '#f0f0f0',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                overflowX: 'auto',
                                margin: '0.5rem 0'
                              }}
                            >
                              {children}
                            </pre>
                          ),
                          h1: ({ children }) => <h3 style={{ margin: '0.5rem 0 0.3rem' }}>{children}</h3>,
                          h2: ({ children }) => <h4 style={{ margin: '0.5rem 0 0.3rem' }}>{children}</h4>,
                          h3: ({ children }) => <h5 style={{ margin: '0.5rem 0 0.3rem' }}>{children}</h5>,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>

                {msg.createdAt && (
                  <small
                    className="mt-1 me-2 ms-2"
                    style={{
                      float: msg.role === 'user' ? 'right' : 'left',
                      clear: 'both',
                      fontSize: '0.75rem',
                      color: '#6c757d',
                      marginBottom: '30px'
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </small>
                )}
                <div style={{ clear: 'both' }}></div>
              </div>
            ))}

            {loading && (
              <div className="d-flex justify-content-start align-items-center mb-3">
                <Spinner animation="grow" size="sm" variant="secondary" className="me-2" />
                <small className="text-secondary">{translations[language].aiThinking}</small>
              </div>
            )}

            <div ref={messagesEndRef} />
          </Card.Body>
        </Card>

        {/* Input Section */}
        <div className="chat-input-container">
          <div className="chat-form-wrapper">
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading && message.trim()) {
                  sendMessage();
                }
              }}
              className="w-100"
            >
              <TextareaAutosize
                minRows={1}
                maxRows={2}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && message.trim()) {
                      sendMessage();
                    }
                  }
                }}
                placeholder={loading ? translations[language].loadingResponse : translations[language].typeMessage}
                disabled={loading}
                className="form-control chat-input"
              />
              {message.trim() ? (
                <Button type="submit" className="btn-action" disabled={loading}>
                  <i className="material-icons">send</i>
                </Button>
              ) : (
                <Button type="button" onClick={startListening} disabled={loading || isListening} className={`btn-action ${isListening ? 'listening-animation' : ''}`}>
                  {isListening ? (
                    <Spinner animation="grow" size="sm" />
                  ) : (
                    <i className="material-icons">mic</i>
                  )}
                </Button>
              )}
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}