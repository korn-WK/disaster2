import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Table, 
  Badge, 
  Spinner, 
  Modal,
  Alert,
  ProgressBar
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface ScrapingStatus {
  googleApi: string;
  todayScrapedCount: number;
  totalScrapedCount: number;
}

interface ScrapedReport {
  _id: string;
  disasterType: string;
  location: string;
  severityLevel: string;
  severityReasoning: string;
  description: string;
  locationCoordinates: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  source?: string;
}

const ScrapingPage: React.FC = () => {
  const [status, setStatus] = useState<ScrapingStatus | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [filters, setFilters] = useState({
    severityLevel: '',
    limit: 20
  });
  const [showResults, setShowResults] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchScrapedData();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/scraping/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchScrapedData = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severityLevel) params.append('severityLevel', filters.severityLevel);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`http://localhost:5000/api/scraping/data?${params}`);
      const data = await response.json();
      if (data.success) {
        setScrapedData(data.data);
      }
    } catch (error) {
      console.error('Error fetching scraped data:', error);
    }
  };

  const startScraping = async () => {
    setLoading(true);
    setLoadingProgress(0);
    setElapsedTime(0);
    const startTime = Date.now();
    
    // Timer to update elapsed time
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    setLoadingStatus('กำลังเชื่อมต่อกับ Google News RSS...');
    
    try {
      setLoadingProgress(25);
      setLoadingStatus('กำลังค้นหาข้อมูลการแจ้งเหตุน้ำท่วมในเชียงราย...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setLoadingProgress(50);
      setLoadingStatus('กำลังวิเคราะห์รายงานสถานการณ์ด้วย AI...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLoadingProgress(75);
      setLoadingStatus('กำลังบันทึกข้อมูลการแจ้งเหตุลงฐานข้อมูล...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await fetch('http://localhost:5000/api/scraping/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setLoadingProgress(95);
      setLoadingStatus('กำลังบันทึกข้อมูลลงฐานข้อมูล...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data = await response.json();
      if (data.success) {
        setLoadingProgress(100);
        setLoadingStatus('เสร็จสิ้น!');
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const totalTime = Math.floor((Date.now() - startTime) / 1000);
        alert(`กวาดข้อมูลการแจ้งเหตุเสร็จสิ้น: ${data.data.length} รายการ\nใช้เวลา: ${totalTime} วินาที`);
        fetchStatus();
        fetchScrapedData();
        setSuccessMessage(`✅ กวาดข้อมูลการแจ้งเหตุเสร็จสิ้น! พบ ${data.data.length} รายการ`);
        setShowSuccess(true);
      } else {
        alert('เกิดข้อผิดพลาดในการกวาดข้อมูล');
      }
    } catch (error) {
      console.error('Error starting scraping:', error);
      alert('เกิดข้อผิดพลาดในการกวาดข้อมูล');
    } finally {
      clearInterval(timer);
      setLoading(false);
      setLoadingStatus('');
      setLoadingProgress(0);
      setElapsedTime(0);
    }
  };

  const cleanupOldData = async () => {
    if (!confirm('คุณต้องการลบข้อมูลการแจ้งเหตุเก่า 7 วันขึ้นไปหรือไม่?')) return;

    try {
      const response = await fetch('http://localhost:5000/api/scraping/cleanup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysOld: 7 }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`ลบข้อมูลการแจ้งเหตุเก่าแล้ว: ${data.deletedCount} รายการ`);
        fetchStatus();
        fetchScrapedData();
      }
    } catch (error) {
      console.error('Error cleaning up data:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const getSeverityVariant = (level: string) => {
    const variants: { [key: string]: string } = {
      low: 'success',
      medium: 'warning',
      high: 'danger'
    };
    return variants[level] || 'success';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} วินาที`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes} นาที ${remainingSeconds} วินาที`;
    }
  };

  // ฟังก์ชันจัดการการเลือกข้อมูล
  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(scrapedData.map(item => item._id));
      setSelectAll(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert('กรุณาเลือกข้อมูลที่ต้องการลบ');
      return;
    }

    if (!confirm(`คุณต้องการลบข้อมูลที่เลือก ${selectedItems.length} รายการหรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/scraping/delete-selected', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds: selectedItems }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`ลบข้อมูลที่เลือกแล้ว: ${data.deletedCount} รายการ`);
        setSelectedItems([]);
        setSelectAll(false);
        fetchStatus();
        fetchScrapedData();
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } catch (error) {
      console.error('Error deleting selected items:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  return (
    <div>
      <Container fluid className="mt-4">
        <Row>
          <Col>
            <h2 className="mb-4">
              <i className="bi bi-water me-2"></i>
              ระบบข้อมูลการแจ้งเหตุน้ำท่วมเชียงราย
            </h2>
          </Col>
        </Row>

        {/* Status Cards */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center h-100">
              <Card.Body>
                <i className="bi bi-google text-primary" style={{ fontSize: '2rem' }}></i>
                <Card.Title className="mt-2">Google News API</Card.Title>
                <Card.Text className="h4 text-primary">
                  {status?.googleApi === 'active' ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center h-100">
              <Card.Body>
                <i className="bi bi-calendar-day text-success" style={{ fontSize: '2rem' }}></i>
                <Card.Title className="mt-2">ข้อมูลวันนี้</Card.Title>
                <Card.Text className="h4 text-success">
                  {status?.todayScrapedCount || 0} รายการ
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center h-100">
              <Card.Body>
                <i className="bi bi-database text-info" style={{ fontSize: '2rem' }}></i>
                <Card.Title className="mt-2">ข้อมูลทั้งหมด</Card.Title>
                <Card.Text className="h4 text-info">
                  {status?.totalScrapedCount || 0} รายการ
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Control Panel */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-gear me-2"></i>
                  จัดการการกวาดข้อมูล
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={startScraping}
                      disabled={loading}
                      className="w-100 mb-3"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          กำลังกวาดข้อมูล...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-play-circle me-2"></i>
                          เริ่มกวาดข้อมูลการแจ้งเหตุ
                        </>
                      )}
                    </Button>
                  </Col>
                  <Col md={6}>
                    <Button 
                      variant="outline-danger" 
                      onClick={cleanupOldData}
                      className="w-100 mb-3"
                    >
                      <i className="bi bi-trash me-2"></i>
                      ลบข้อมูลเก่า (7 วัน)
                    </Button>
                    {selectedItems.length > 0 && (
                      <Button 
                        variant="danger" 
                        onClick={handleBulkDelete}
                        className="w-100"
                      >
                        <i className="bi bi-trash me-2"></i>
                        ลบข้อมูลที่เลือก ({selectedItems.length} รายการ)
                      </Button>
                    )}
                  </Col>
                </Row>
                
                {loading && (
                  <Alert variant="info" className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>กำลังกวาดข้อมูลการแจ้งเหตุ...</strong>
                      <span className="text-muted">{formatTime(elapsedTime)}</span>
                    </div>
                    <ProgressBar 
                      now={loadingProgress} 
                      label={`${loadingProgress}%`}
                      variant="primary"
                    />
                    <small className="text-muted mt-2 d-block">{loadingStatus}</small>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-funnel me-2"></i>
                  กรองข้อมูล
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>ระดับความรุนแรง</Form.Label>
                      <Form.Select
                        value={filters.severityLevel}
                        onChange={(e) => setFilters({...filters, severityLevel: e.target.value})}
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="low">ต่ำ</option>
                        <option value="medium">ปานกลาง</option>
                        <option value="high">สูง</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>จำนวนรายการ</Form.Label>
                      <Form.Select
                        value={filters.limit}
                        onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
                      >
                        <option value={10}>10 รายการ</option>
                        <option value={20}>20 รายการ</option>
                        <option value={50}>50 รายการ</option>
                        <option value={100}>100 รายการ</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <Button 
                      variant="outline-primary" 
                      onClick={fetchScrapedData}
                      className="w-100"
                    >
                      <i className="bi bi-search me-2"></i>
                      ค้นหา
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Data Table */}
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-table me-2"></i>
                    ข้อมูลการแจ้งเหตุน้ำท่วมที่กวาดได้
                  </h5>
                  {selectedItems.length > 0 && (
                    <div className="d-flex align-items-center">
                      <Badge bg="primary" className="me-2">
                        เลือกแล้ว {selectedItems.length} รายการ
                      </Badge>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => {
                          setSelectedItems([]);
                          setSelectAll(false);
                        }}
                      >
                        ยกเลิกการเลือก
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {scrapedData.length === 0 ? (
                  <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    ยังไม่มีข้อมูลการแจ้งเหตุน้ำท่วมในเชียงราย กรุณากดปุ่ม "เริ่มกวาดข้อมูลการแจ้งเหตุ" เพื่อดึงข้อมูล
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>
                            <Form.Check
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              label="เลือกทั้งหมด"
                            />
                          </th>
                          <th>สถานที่</th>
                          <th>รายละเอียด</th>
                          <th>ระดับความรุนแรง</th>
                          <th>เหตุผล</th>
                          <th>วันที่</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scrapedData.map((item) => (
                          <tr key={item._id}>
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedItems.includes(item._id)}
                                onChange={() => handleItemSelect(item._id)}
                              />
                            </td>
                            <td>
                              <strong>{item.location}</strong>
                              {item.locationCoordinates && (
                                <div className="text-muted small">
                                  {item.locationCoordinates.lat.toFixed(6)}, {item.locationCoordinates.lng.toFixed(6)}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                                {item.description}
                                {item.source && (
                                  <div className="text-muted small mt-1">
                                    <i className="bi bi-link-45deg me-1"></i>
                                    <a href={item.source} target="_blank" rel="noopener noreferrer">
                                      ดูแหล่งข้อมูล
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <Badge bg={getSeverityVariant(item.severityLevel)}>
                                {item.severityLevel === 'low' ? 'ต่ำ' : 
                                 item.severityLevel === 'medium' ? 'ปานกลาง' : 'สูง'}
                              </Badge>
                              <div className="text-muted small mt-1">
                                {item.disasterType}
                              </div>
                            </td>
                            <td>
                              <div style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                                {item.severityReasoning}
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="fw-bold">
                                  {new Date(item.createdAt).toLocaleDateString('th-TH')}
                                </div>
                                <div className="text-muted small">
                                  {new Date(item.createdAt).toLocaleTimeString('th-TH')}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
              {scrapedData.length > 0 && (
                <Card.Footer>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      แสดง {scrapedData.length} รายการ
                    </small>
                    {selectedItems.length > 0 && (
                      <small className="text-primary">
                        เลือกแล้ว {selectedItems.length} รายการ
                      </small>
                    )}
                  </div>
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Loading Modal */}
      <Modal show={loading} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>
            <i className="bi bi-hourglass-split me-2"></i>
            กำลังกวาดข้อมูลการแจ้งเหตุ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Spinner animation="border" variant="primary" size="sm" className="mb-3" />
            <h5>{loadingStatus}</h5>
            <ProgressBar 
              now={loadingProgress} 
              label={`${loadingProgress}%`}
              variant="primary"
              className="mb-3"
            />
            <p className="text-muted">
              ใช้เวลา: {formatTime(elapsedTime)}
            </p>
            <small className="text-muted">
              กำลังดึงข้อมูลการแจ้งเหตุน้ำท่วมในเชียงรายจาก Google News...
            </small>
          </div>
        </Modal.Body>
      </Modal>

      {/* Success Modal */}
      <Modal show={showSuccess} onHide={() => setShowSuccess(false)}>
        <Modal.Header closeButton>
          <Modal.Title>สำเร็จ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {successMessage}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowSuccess(false)}>
            ปิด
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ScrapingPage; 