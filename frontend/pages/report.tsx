import { useState, useEffect, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import TextareaAutosize from 'react-textarea-autosize'; // นำเข้า TextareaAutosize

const translations = {
  th: {
    sidebarHeader: 'DISASTER CHATBOT',
    newChat: 'แชทใหม่',
    reportEmergency: 'แจ้งข้อมูลภัยพิบัติ',
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
    yourBrowserNotSupportVoiceRecognition: 'เบราว์เซอร์ของคุณไม่รองรับการแปลงเสียงเป็นข้อความ',
    typeMessageOrSpeak: 'รายงานเหตุการณ์ที่พบเห็นเพื่อร่วมเป็นส่วนหนึ่งในการปกป้องชีวิตและความปลอดภัยของทุกคน',
    cancel: 'ยกเลิก',
  },
  en: {
    sidebarHeader: 'DISASTER CHATBOT',
    newChat: 'New Chat',
    reportEmergency: 'Report Disaster ',
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
    yourBrowserNotSupportVoiceRecognition: 'Your browser does not support voice-to-text conversion',
    typeMessageOrSpeak: 'Report incidents witnessed to be part of protecting everyone\'s lives and safety',
    cancel: 'Cancel', 
  },
};

export default function ReportPage() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [language, setLanguage] = useState<'th' | 'en'>('th');

  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    if (!navigator.geolocation) {
      setLocationError(translations[language].noGeolocation);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocationError(translations[language].cannotGetLocation + err.message);
      },
      { enableHighAccuracy: true }
    );

    return () => window.removeEventListener('resize', handleResize);
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'en') {
      document.documentElement.classList.add('lang-en');
      document.documentElement.classList.remove('lang-th');
    } else {
      document.documentElement.classList.add('lang-th');
      document.documentElement.classList.remove('lang-en');
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'th' ? 'en' : 'th'));
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    // TextareaAutosize จะปรับขนาดอัตโนมัติ ไม่ต้องทำ e.target.style.height ตรงนี้
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (description.trim()) {
        handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
      } else {
        startListening();
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!location) {
      Swal.fire({
        icon: 'error',
        title: translations[language].reportErrorTitle,
        text: translations[language].allowLocationShare,
        customClass: {
          popup: 'swal2-custom-popup',
          title: 'swal2-custom-title',
          htmlContainer: 'swal2-custom-content',
          icon: 'swal2-custom-icon',
          confirmButton: "btn btn-primary swal-confirm-button"
        },
        buttonsStyling: false,
        confirmButtonText: language === 'th' ? 'ตกลง' : 'OK'
      });
      return;
    }

    const swalWithCustomButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success swal-confirm-button",
        cancelButton: "btn btn-danger swal-cancel-button",
        popup: 'swal2-custom-popup',
        title: 'swal2-custom-title',
        htmlContainer: 'swal2-custom-content',
        icon: 'swal2-custom-icon',
        actions: 'swal2-actions-custom swal2-actions-more-gap'
      },
      buttonsStyling: false
    });

    const result = await swalWithCustomButtons.fire({
      title: translations[language].confirmReportTitle,
      text: translations[language].confirmReportText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: translations[language].confirmReportButton,
      cancelButtonText: translations[language].cancelReportButton,
      reverseButtons: true,
      backdrop: 'rgba(0,0,0,0.5)',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            lat: location.lat,
            lng: location.lng,
          }),
        });
        const data = await res.json();

        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: translations[language].reportSuccessTitle,
            text: translations[language].reportSuccessText,
            customClass: {
              popup: 'swal2-custom-popup',
              title: 'swal2-custom-title',
              htmlContainer: 'swal2-custom-content',
              icon: 'swal2-custom-icon'
            },
            confirmButtonColor: '#007bff',
            buttonsStyling: true,
            confirmButtonText: language === 'th' ? 'ตกลง' : 'OK'
          });

          setDescription('');
          // TextareaAutosize จะปรับขนาดเองเมื่อค่าเปลี่ยน
        } else {
          await swalWithCustomButtons.fire(
            translations[language].reportErrorTitle,
            translations[language].reportErrorMessage + (data.message || 'เกิดข้อผิดพลาดบางอย่าง'),
            "error"
          );
        }
      } catch (error) {
        console.error('Error submitting report:', error);
        await swalWithCustomButtons.fire(
          translations[language].reportErrorTitle,
          translations[language].connectionErrorServer,
          "error"
        );
      } finally {
        setLoading(false);
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      await Swal.fire({
        icon: 'error',
        title: translations[language].cancel,
        text: translations[language].reportCanceled,
        confirmButtonText: language === 'th' ? 'ตกลง' : 'OK',
        confirmButtonColor: '#007bff',
        buttonsStyling: true,
        customClass: {
          popup: 'swal2-custom-popup',
          title: 'swal2-custom-title',
          htmlContainer: 'swal2-custom-content',
          icon: 'swal2-custom-icon'
        }
      });
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Swal.fire({
        icon: 'warning',
        title: translations[language].reportErrorTitle,
        text: translations[language].yourBrowserNotSupportVoiceRecognition,
        customClass: {
          popup: 'swal2-custom-popup',
          title: 'swal2-custom-title',
          htmlContainer: 'swal2-custom-content',
          icon: 'swal2-custom-icon',
          confirmButton: "btn btn-primary swal-confirm-button"
        },
        buttonsStyling: false,
        confirmButtonText: language === 'th' ? 'ตกลง' : 'OK'
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'th' ? 'th-TH' : 'en-US';
    recognition.interimResults = true; // ตั้งค่าเป็น true
    recognition.maxAlternatives = 3;

    setIsListening(true);

    let baseDescription = description; // เก็บ description เริ่มต้นก่อนเริ่มฟัง

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Cast event to any to access properties like resultIndex and results which might not be fully typed in some environments
      const speechEvent = event as any;
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; ++i) {
        const transcript = speechEvent.results[i][0].transcript;
        if (speechEvent.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        // เมื่อได้ finalTranscript ให้ต่อท้าย baseDescription
        baseDescription = (baseDescription + ' ' + finalTranscript).trim();
        setDescription(baseDescription);
      } else {
        // เมื่อได้ interimTranscript ให้แสดงผลลัพธ์ทันที
        // โดยการแทนที่ interimTranscript เก่าด้วย interimTranscript ใหม่
        setDescription((baseDescription + ' ' + interimTranscript).trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      Swal.fire({
        icon: 'error',
        title: translations[language].reportErrorTitle,
        text: translations[language].cannotListen + event.error,
        customClass: {
          popup: 'swal2-custom-popup',
          title: 'swal2-custom-title',
          htmlContainer: 'swal2-custom-content',
          icon: 'swal2-custom-icon',
          confirmButton: "btn btn-primary swal-confirm-button"
        },
        buttonsStyling: false,
        confirmButtonText: language === 'th' ? 'ตกลง' : 'OK'
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // หลังสิ้นสุดการฟัง ให้ trigger การส่งข้อมูลถ้ามี description
      // ใช้ค่า description ล่าสุดที่ถูกต้อง
      if (description.trim()) {
        const fakeEvent = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
        handleSubmit(fakeEvent);
      }
    };

    recognition.start();
  };

  const handleNewChat = () => {
    router.push('/');
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
        className={`main-content flex-grow-1 d-flex flex-column`}
        style={{ maxWidth: isMobile ? '100%' : (sidebarOpen ? 'calc(100% - 280px)' : '100%'), width: '100%' }}
      >
        <div className="chat-header p-4 text-center">
          <Button variant="outline-secondary" onClick={toggleLanguage} style={{ position: 'absolute', top: '15px', right: '15px' }}>
            {language.toUpperCase()}/{(language === 'th' ? 'EN' : 'TH')}
          </Button>
        </div>

        <Card className="chat-container-card flex-grow-1 mx-4 my-3 d-flex justify-content-center align-items-center">
          <Card.Body className="w-100" style={{ maxWidth: isMobile ? '100%' : '1000px' }}>
            <h1 className="text-center mb-2 text-black report-title">{translations[language].reportTitle}</h1>
            <Card.Text className="text-center mb-4 text-muted report-description">
              {translations[language].reportDescription}
            </Card.Text>
            {locationError && <Alert variant="warning" className="mb-3">{locationError}</Alert>}

            <Form onSubmit={handleSubmit}>
              <div className="input-with-buttons-wrapper">
                <TextareaAutosize // ใช้ TextareaAutosize
                  minRows={1}
                  maxRows={5} // กำหนด maxRows เป็น 5
                  name="description"
                  value={description}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  required
                  placeholder={translations[language].typeMessageOrSpeak}
                  className="form-control description-input flex-grow-1 me-2"
                />
                {description.trim() ? (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-action"
                  >
                    {loading ? <Spinner animation="border" size="sm" /> : <i className="material-icons">send</i>}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={startListening}
                    disabled={loading || isListening}
                    className={`btn-action ${isListening ? 'listening-animation' : ''}`}
                  >
                    {isListening ? <Spinner animation="grow" size="sm" /> : <i className="material-icons">mic</i>}
                  </Button>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}